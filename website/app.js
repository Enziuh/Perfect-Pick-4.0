(() => {
  const preview = window.PerfectPickPreview;
  const liveView = preview?.kind === 'live';
  const ownerView = liveView || preview?.kind === 'owner-contract';
  let navigationStarted = false;
  const sourceLabel = liveView ? 'Competition' : ownerView ? 'Owner verification' : 'Synthetic';
  const publicPicks = data => data.entriesStatus === 'CLOSED' && data.visibility !== 'WITHHELD';
  let picksRequest = 0;
  let monthlyRequest = 0;
  let activeWeek = null;
  let prizeData = null;
  const weekCache = new Map();
  const monthlyCache = new Map();
  let deadlineTimer = null;
  let matchData = null;
  let matchModels = [];
  let eligiblePickWeeks = [];
  let renderGeneration = 0;
  const renderedViews = new Map();
  let viewPreferences={week:null,player:'',match:''};

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  const currencyFormatter = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'});
  const money = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? currencyFormatter.format(n) : 'Unavailable';

  async function get(action, extra = '') {
    if (!preview) throw new Error('Synthetic preview data adapter is unavailable.');
    return preview.get(action, extra);
  }

  async function loadWeek(week) {
    const number = Number(week);
    if (!weekCache.has(number)) {
      const pending = get('week', `&week=${number}`).catch(error => { weekCache.delete(number); throw error; });
      weekCache.set(number, pending);
    }
    return weekCache.get(number);
  }

  function setStatus(text, type = '') {
    const el = $('status');
    if (!el) return;
    if(el.textContent!==text)el.textContent = text;
    el.className = `status ${type}`.trim();
  }

  function formatPacificDateTime_(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }

  function pacificWeekday_(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long'
    }).format(date);
  }

  function countdownText_(deadlineValue) {
    if (!deadlineValue) return 'Deadline not scheduled';
    const deadline = new Date(deadlineValue);
    if (Number.isNaN(deadline.getTime())) return 'Deadline not scheduled';

    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) return 'Deadline reached';

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s remaining`;
    return `${minutes}m ${seconds}s remaining`;
  }

  function renderFormControl_(control) {
    const data = control || {};
    const week = Number(data.activeWeek || 0);
    const status = String((ownerView ? data.reportedStatus : '') || data.status || '').trim().toUpperCase();
    const closeAt = data.picksClose || '';
    const kickoffAt = data.firstKickoff || '';

    setText('formWeekLabel', week ? `Week ${week} Picks` : 'Picks');
    setText('picksCloseTime', formatPacificDateTime_(closeAt));
    setText('firstGameLabel', data.firstGame || '—');
    setText('firstKickoffTime', kickoffAt ? `Kickoff: ${formatPacificDateTime_(kickoffAt)}` : '—');
    setText('deadlineRuleLabel', 'Picks close at the official deadline.');

    const badge = $('formStatusBadge');
    if (badge) {
      badge.className = 'deadline-status';
      if (status === 'OPEN') {
        badge.textContent = 'Picks Open';
        badge.classList.add('is-open');
      } else if (status === 'CLOSED') {
        badge.textContent = 'Picks Closed';
        badge.classList.add('is-closed');
      } else {
        badge.textContent = 'Not Scheduled';
        badge.classList.add('is-unknown');
      }
    }

    const updateCountdown = () => {
      const el = $('picksCountdown');
      if (!el) return;
      const text = countdownText_(closeAt);
      const label=status === 'CLOSED' ? 'Entries are closed' : text;
      if(el.textContent!==label)el.textContent=label;
      el.classList.toggle('deadline-passed', text === 'Deadline reached');
    };

    if (deadlineTimer) clearInterval(deadlineTimer);
    updateCountdown();
    if (closeAt && status !== 'CLOSED') {
      deadlineTimer = setInterval(updateCountdown, 1000);
    }

    const notice = $('deadlineNotice');
    if (notice) {
      const firstGameDay = pacificWeekday_(kickoffAt);
      if (firstGameDay && firstGameDay !== 'Thursday') {
        notice.hidden = false;
        notice.innerHTML = `<strong>Early schedule this week:</strong> the first game is ${escapeHtml(firstGameDay)}, so picks close ${escapeHtml(formatPacificDateTime_(closeAt))}.`;
      } else {
        notice.hidden = true;
        notice.textContent = '';
      }
    }
  }

  function renderDashboard(prizes) {
    document.querySelectorAll('[data-late-entry-policy]').forEach(node=>{node.hidden=prizes.scoringBasis!=='ELIGIBLE_SUBMITTED_FINAL_PICKS';});
    setText('activeWeek', prizes.activeWeek || '—');
    renderFormControl_(prizes.formControl);
    if(liveView)setText('sourceStatusNote','Entries '+(prizes.formControl.reportedStatus||'UNKNOWN')+'. Player picks appear only after verified closure.');

    const periodLabel = prizes.currentPeriodName || prizes.currentPeriod || '—';
    setText('periodName', periodLabel);
    setText('weeklyPot', money(prizes.currentWeeklyPot));
    setText('monthlyPot', money(prizes.currentMonthlyPot));
    setText('monthlyWinnerPool', money(prizes.projectedMonthlyWinnerPool));
    setText('seasonPot', money(prizes.projectedSeasonPot));
    setText('poolEstimateNote',prizes.estimateBasis ? `Pools are estimates based on ${prizes.estimateBasis.participantsPerWeek} participants per week, not verified collected funds.` : 'Prize amounts reflect available rules and evidence.');
    setText(
      'confirmedSeasonPot',
      prizes.estimateBasis ? `Estimate based on ${prizes.estimateBasis.participantsPerWeek} participants per week; not collected funds` : liveView ? 'Calculated pool information; collections handled separately' : `Confirmed after completed periods: ${money(prizes.confirmedSeasonPot)}`
    );

    const rolloverLines = (prizes.currentMonthlyRolloverBreakdown || [])
      .map(x => `Week ${x.week}: ${money(x.amount)}`)
      .join(' + ');

    const monthlyBase = rolloverLines || 'No finalized weekly rollovers yet';
    const projectedSeasonContribution = prizes.currentProjectedSeasonContribution;
    $('prizeBreakdown').innerHTML = `
      <div class="breakdown-row">
        <span>Monthly rollover pot</span>
        <strong>${money(prizes.currentMonthlyPot)}</strong>
        <small>${escapeHtml(monthlyBase)}</small>
      </div>
      <div class="breakdown-arrow">→</div>
      <div class="breakdown-row">
        <span>Monthly prize portion</span>
        <strong>${money(prizes.projectedMonthlyWinnerPool)}</strong>
        <small>${prizes.estimateBasis ? 'Estimate based on '+prizes.estimateBasis.participantsPerWeek+' participants; not collected funds' : ownerView ? 'Calculated allocation from prize rules' : '50% of the monthly rollover pot'}</small>
      </div>
      <div class="breakdown-arrow">+</div>
      <div class="breakdown-row">
        <span>Season pot portion</span>
        <strong>${money(projectedSeasonContribution)}</strong>
        <small>${prizes.estimateBasis ? 'Estimate based on '+prizes.estimateBasis.participantsPerWeek+' participants; not collected funds' : ownerView ? 'Calculated allocation from prize rules' : '50% of the monthly rollover pot'}</small>
      </div>
    `;

    $('recentWeeks').innerHTML = '<tr><td colspan="4">Checking finalized results…</td></tr>';
  }

  function formatAccuracy(points, completedGames) {
    if (!Number.isFinite(points) || !Number.isFinite(completedGames) || completedGames <= 0 || points < 0 || points > completedGames) return '—';
    return `${(points / completedGames * 100).toFixed(1).replace(/\.0$/, '')}%`;
  }

  function accuracyHtml(player) {
    const accuracy = formatAccuracy(player.points, player.completedGames);
    return `<span class="accuracy-indicator${accuracy === '—' ? ' is-empty' : ''}" title="Correct picks divided by submitted picks with FINAL results">${accuracy}</span>`;
  }

  function renderStandingsRows(containerId, standings, showCompleted = true, resolution = null) {
    $(containerId).innerHTML = standings.map(player => `
      <tr class="${player.rank <= 3 ? ['','rank-first','rank-second','rank-third'][player.rank] : ''}${resolution?.leaders.includes(player.name) && resolution.status === 'UNRESOLVED TIE' ? ' is-unresolved' : ''}">
        <td><span class="rank-badge">${player.rank}</span></td>
        <td class="player-name-cell">${escapeHtml(player.name)}${resolution?.winner === player.name ? '<span class="standing-note is-champion">Monthly Champion</span>' : resolution?.leaders.includes(player.name) ? `<span class="standing-note">${resolution.leaders.length === 1 ? 'Leader' : 'Shared leader'}</span>` : ''}</td>
        <td class="num"><strong>${player.points}</strong></td>
        ${showCompleted ? `<td class="num">${player.completedGames}</td>` : ''}
        <td class="num">${accuracyHtml(player)}</td>
      </tr>`).join('') || `<tr><td colspan="${showCompleted ? 5 : 4}">Standings await approved display names and verified closed entry periods.</td></tr>`;
  }

  function championExplanation(resolution) {
    let text = resolution.reason;
    if (resolution.actualTotal !== null) text = `${resolution.game} · FINAL combined score: ${resolution.actualTotal}. ${text}`;
    if (resolution.winner && resolution.winningDifference !== null) {
      const prediction = resolution.comparisons.find(p => p.name === resolution.winner).prediction;
      text += ` Winning prediction: ${prediction}; off by ${resolution.winningDifference}.`;
      if (resolution.margin !== null) text += ` Margin over the next closest eligible prediction: ${resolution.margin} points.`;
    }
    return text;
  }

  function renderChampionSpotlight(period, resolution) {
    const title = resolution.winner ? `${period.displayName} · ${resolution.winner}` : `${period.displayName} · ${resolution.status.toLowerCase()}`;
    setText('championHeading', title);
    const points = resolution.points === null ? '' : `${resolution.points} monthly points. `;
    setText('championSummary', `${points}${championExplanation(resolution)} Prize pool: ${money(period.monthlyWinnerPool)}. ${resolution.winner ? 'Champion confirmation does not record or calculate a payment.' : 'No prize has been awarded.'}`);
    setText('championState', resolution.status);
    $('championState').dataset.state = resolution.status;
    $('championHeading').dataset.winner = resolution.winner || '';
  }

  async function loadMonthlyResolution(period) {
    if (!monthlyCache.has(period.periodKey)) {
      monthlyCache.set(period.periodKey, (async () => {
        const weeks = await Promise.all(Array.from({length:period.endWeek-period.startWeek+1}, (_,i) => loadWeek(period.startWeek+i)));
        return preview.resolveMonthlyChampion(period, weeks);
      })());
    }
    return monthlyCache.get(period.periodKey);
  }

  function renderSeasonStandings(prizes) {
    renderStandingsRows('seasonStandingsBody', prizes.overallStandings || []);
    if(liveView&&prizes.seasonCoverage){const heading=document.querySelector('#season h2');if(heading)heading.textContent='Season standings · covered weeks '+prizes.seasonCoverage;}
  }

  function championComparisonsHtml(resolution) {
    if (!resolution.comparisons.length) return '';
    return `<div class="table-region" role="region" aria-label="Monthly tiebreaker comparison" tabindex="0">
      <table class="champion-comparison"><caption>Tied first-place players · ${escapeHtml(resolution.game)} · FINAL combined score ${resolution.actualTotal}</caption>
        <thead><tr><th>Approved alias</th><th class="num">Prediction</th><th class="num">Absolute difference</th><th>Decision</th></tr></thead>
        <tbody>${resolution.comparisons.map(player => `<tr class="${player.name === resolution.winner ? 'rank-first' : ''}">
          <td>${escapeHtml(player.name)}</td><td class="num">${player.eligible ? player.prediction : '—'}</td>
          <td class="num">${player.eligible ? player.difference : '—'}</td>
          <td>${!player.eligible ? 'Ineligible: missing or invalid prediction' : player.name === resolution.winner ? 'Winning prediction' : resolution.status === 'UNRESOLVED TIE' && player.difference === Math.min(...resolution.comparisons.filter(p => p.eligible).map(p => p.difference)) ? 'Equally closest · manual decision' : 'Eligible'}</td>
        </tr>`).join('')}</tbody></table></div>`;
  }

  function renderMonthlyChampion(period, resolution) {
    const callout = $('monthlyPrizeCallout');
    callout.dataset.state = resolution.status;
    callout.dataset.winner = resolution.winner || '';
    callout.innerHTML = `<div class="champion-panel-heading"><div><span class="monthly-prize-label">${escapeHtml(period.displayName)} · Monthly competition</span>
      <h3>${resolution.winner ? escapeHtml(resolution.winner) : 'Monthly Champion decision'}</h3></div>
      <span class="pill champion-status" data-state="${resolution.status}">${resolution.status}</span></div>
      <p>${resolution.points === null ? '' : `<strong>${resolution.points} monthly points</strong> · `}${escapeHtml(championExplanation(resolution))}</p>
      <p class="muted">Monthly prize pool: <strong>${money(period.monthlyWinnerPool)}</strong>. ${liveView ? 'Estimated allocation, not collected funds. The treasurer handles disbursements separately.' : ownerView ? 'Payment status: ' + (period.paymentState || 'UNKNOWN') + '.' : resolution.winner ? 'No payment is recorded by this preview.' : 'No champion payout is awarded while the decision is pending.'}</p>
      ${championComparisonsHtml(resolution)}`;
    renderChampionSpotlight(period, resolution);
    renderStandingsRows('monthlyStandingsBody', period.standings || [], true, resolution);
  }

  async function renderMonthlyPeriod(periodKey) {
    if (!prizeData) return;
    const request = ++monthlyRequest;
    const period = (prizeData.periods || []).find(p => p.periodKey === periodKey);
    if (!period) return;
    setText('monthlyTitle', `${period.displayName} Standings`);
    // Clear any previous period's winner immediately, including on failed loads.
    renderMonthlyChampion(period, preview.resolveMonthlyChampion(period, []));
    try {
      const resolution = await loadMonthlyResolution(period);
      if (request !== monthlyRequest) return;
      renderMonthlyChampion(period, resolution);
    } catch (_) {
      if (request !== monthlyRequest) return;
      renderMonthlyChampion(period, preview.resolveMonthlyChampion(period, []));
    }
  }

  async function renderPrizes(prizes) {
    const generation=renderGeneration;
    const weeks = await Promise.all(prizes.weekly.map(row => loadWeek(row.week)));
    if(generation!==renderGeneration)return;
    const weekly = prizes.weekly.map((row,i) => preview.buildWeeklyPrize(row,weeks[i]));
    const currentIndex = prizes.weekly.findIndex(w => w.week === prizes.activeWeek);
    const current = weekly[currentIndex];
    const topPoints = Math.max(...prizes.overallStandings.map(player => player.points));
    const seasonLeaders = prizes.overallStandings.filter(player => player.points === topPoints).map(player => player.name);
    const seasonContext = seasonLeaders.length ? `Current points leaders: ${seasonLeaders.join(', ')} · ${topPoints} points. Season title not confirmed.` : 'Season standings unavailable.';
    const basis=prizes.estimateBasis;
    $('prizeSummary').innerHTML = `${basis ? `<p class="state-message" style="grid-column:1/-1">Prize estimates assume ${basis.participantsPerWeek} participants per week, not verified collected funds. Actual submissions determine standings and picks. Collections and disbursements are handled separately by the treasurer.</p>` : ''}<article class="card"><span>Week ${prizes.activeWeek} pool · ${basis ? 'estimate' : 'projected'}</span><strong>${money(current.pool)}</strong><small>${escapeHtml(current.status)}${liveView ? '' : '. '+current.payment}.</small></article>
      <article class="card"><span>${basis ? 'Season allocation estimate to date' : liveView ? 'Season prize pool' : 'Season pool · confirmed'}</span><strong>${money(basis ? prizes.projectedSeasonPot : prizes.confirmedSeasonPot)}</strong><small>${basis ? 'Calculated from estimated rollovers; not collected funds.' : liveView ? 'Calculated allocation; treasurer manages collections separately.' : 'Projected total: '+money(prizes.projectedSeasonPot)+'. Payout distribution and payment status unavailable.'}</small><a href="#standings/season">View season standings ↗</a><small>${escapeHtml(seasonContext)}</small></article>`;
    const periodCards = (await Promise.all(prizes.periods.map(async p => {
      const resolution = await loadMonthlyResolution(p);
      return `<article class="period-card" data-status="${resolution.status}" data-winner="${escapeHtml(resolution.winner || '')}">
        <div class="period-head"><div><div class="eyebrow">Weeks ${p.startWeek}–${p.endWeek} · ${escapeHtml(p.ruleMode)} rules</div><h3>${escapeHtml(p.displayName)}</h3></div><span class="pill">${resolution.status}</span></div>
        <p><strong>${escapeHtml(resolution.winner || 'Champion not confirmed')}</strong>${resolution.points === null ? '' : ` · ${resolution.points} monthly points`}</p><p class="muted">${escapeHtml(championExplanation(resolution))}</p>
        <div class="period-grid"><div><span>Monthly prize pool · ${p.estimateBasis ? 'estimate · not collected' : ownerView ? p.poolState : p.allWeeksFinalized ? 'reported final' : 'provisional'}</span><strong>${money(p.monthlyWinnerPool)}</strong></div><div><span>Rollover pot</span><strong>${money(p.monthlyPot)}</strong></div><div><span>Season contribution</span><strong>${money(p.seasonContribution)}</strong></div></div>
        <p class="muted">Monthly and season shares: ${p.monthlyWinnerPct == null ? 'Unavailable' : p.monthlyWinnerPct + '%'} / ${p.seasonPct == null ? 'Unavailable' : p.seasonPct + '%'}. ${liveView ? 'Calculated pools are estimates, not collected funds. Champions are determined by game results.' : 'Champion confirmation is not a payment. '+(ownerView ? 'Payment status: ' + (p.paymentState || 'UNKNOWN') : 'Payment status unavailable')+'.'}</p><a href="#standings/monthly" data-prize-period="${p.periodKey}">Review monthly standings and tiebreakers ↗</a></article>`;
    }))).join('');
    if(generation!==renderGeneration)return;
    $('periodCards').innerHTML=periodCards;
    $('periodCards').querySelectorAll('[data-prize-period]').forEach(link => link.addEventListener('click', () => {
      $('monthlyPeriodSelect').value = link.dataset.prizePeriod;
      renderMonthlyPeriod(link.dataset.prizePeriod);
    }));
    $('weeklyPrizeBody').innerHTML = prizes.weekly.map((w,i) => {
      const view = weekly[i];
      return `<tr><td>${w.week}</td><td>${escapeHtml(w.periodKey)}</td><td class="num">${publicPicks(weeks[i]) ? w.activePlayers : 'Unavailable'}</td><td class="num">${money(view.pool)}</td><td>${view.status}</td><td>${view.winners.length ? escapeHtml(view.winners.join(', ')) + `<small class="prize-allocation">${liveView ? 'Perfect Week' : 'Allocation each: '+money(view.allocationEach)+' · '+view.payment}</small>` : 'Not confirmed'}</td><td class="num">${view.rollover === null ? 'Pending / unavailable' : money(view.rollover)}</td></tr>`;
    }).join('');
  }

  async function renderOverview(prizes) {
    const generation=renderGeneration;
    const recent=prizes.weekly.filter(w=>w.week<=prizes.activeWeek).slice(-5);
    const [currentWeek,...recentWeeks]=await Promise.all([loadWeek(prizes.activeWeek),...recent.map(w=>loadWeek(w.week))]);
    if(generation!==renderGeneration)return;
    const views=new Map(recent.map((row,i)=>[row.week,preview.buildWeeklyPrize(row,recentWeeks[i])]));
    $('recentWeeks').innerHTML=recent.slice().reverse().map(w=>{
      const view=views.get(w.week);
      return `<tr><td>W${w.week}</td><td>${money(view.pool)}</td><td>${view.status}</td><td>${view.winners.length?escapeHtml(view.winners.join(', ')):view.rollover>0?(view.estimateBasis?'Estimated rollover':'Rollover confirmed'):view.rollover===0?'No rollover':'Pending'}</td></tr>`;
    }).join('');
    const completed = currentWeek.results.filter(game => game.status === 'Final').length;
    setText('overviewProgress', `Week ${prizes.activeWeek}: ${completed} of ${currentWeek.games.length} games FINAL. ${liveView ? 'Results refresh automatically; use Refresh results to check again.' : ownerView ? 'Validated private snapshot; not a live feed.' : 'Synthetic snapshot, not a live feed.'}`);
    const highlights = prizes.currentWeekStandings.slice(0,3);
    const leaders=highlights.length?prizes.currentWeekStandings:prizes.overallStandings;
    setText('overviewLeaders', leaders.length ? (highlights.length?'Current weekly leaders':'Season leaders · verified covered weeks') : 'Weekly leaders unavailable until entries explicitly close.');
    $('overviewLeaderCards').innerHTML=leaders.filter(p=>p.rank<=3).map(p=>`<article class="leader-card rank-${['','first','second','third'][p.rank]}"><span class="rank-badge">${p.rank}</span><div><strong>${escapeHtml(p.name)}</strong><small>${p.points} correct · ${formatAccuracy(p.points,p.completedGames)} accuracy</small></div></article>`).join('');
    const upcoming=currentWeek;
    $('dashboardUpcoming').innerHTML=upcoming.games.filter(game=>preview.buildMatchView(upcoming,game,prizes.formControl).isFinal===false).slice(0,3).map(game=>gameCardHtml(preview.buildMatchView(upcoming,game,prizes.formControl))).join('')||'<p class="state-message">No upcoming games in the current week.</p>';

    await renderDashboardGameResults(currentWeek);
    const period=prizes.periods.find(p=>p.periodKey===prizes.currentPeriod);
    if(period){const resolution=await loadMonthlyResolution(period);if(generation===renderGeneration)renderChampionSpotlight(period,resolution);}
  }



  async function loadWeekPicks(week) {
    const request = ++picksRequest;
    const normalizedWeek = Number(week);
    if (!normalizedWeek) return;
    if(viewPreferences.week!==normalizedWeek)viewPreferences={week:normalizedWeek,player:'',match:''};

    $('weekSelect').value = String(normalizedWeek);
    $('picksWeekTitle').textContent = `Week ${normalizedWeek} Picks`;
    $('picksSubmissionCount').textContent = 'Loading submissions…';
    matchData = null;
    matchModels = [];
    $('matchPrivacyNotice').hidden = false;
    $('matchPrivacyNotice').textContent = `Loading ${sourceLabel.toLowerCase()} matchups…`;
    $('matchGameResults').innerHTML = '<p class="state-message">Loading results…</p>';
    $('matchSelect').innerHTML = '<option value="">All matchups</option>';
    $('playerSelect').innerHTML = '<option value="">All players</option>';
    $('playerSelect').disabled = true;
    $('pickMatrix').open = false;
    syncWeekButtons(normalizedWeek);
    $('playerPicksHead').innerHTML = '';
    $('playerPicksBody').innerHTML = '<tr><td>Loading player picks…</td></tr>';
    $('playerPickCards').innerHTML = `<p class="state-message">Loading ${sourceLabel.toLowerCase()} picks…</p>`;

    try {
      const data = await loadWeek(normalizedWeek);
      if (request !== picksRequest) return;
      renderWeekPicks(data);

    } catch (err) {
      if (request !== picksRequest) return;
      console.error(err);
      $('picksSubmissionCount').textContent = 'Could not load this week.';
      $('playerPickCards').innerHTML = `<p class="state-message">${sourceLabel} player picks unavailable.</p>`;
      $('matchGameResults').textContent = `${sourceLabel} results unavailable.`;
      $('matchPrivacyNotice').hidden = false;
      $('matchPrivacyNotice').textContent = 'Match data unavailable. Picks and voting remain protected.';
      $('playerPicksBody').innerHTML = `<tr><td>${escapeHtml(err.message || 'Could not load player picks.')}</td></tr>`;
    }
  }

  function syncWeekButtons(week) {
    const options = [...$('weekSelect').options].map(option => Number(option.value));
    $('previousWeek').disabled = options.indexOf(week) <= 0;
    $('nextWeek').disabled = options.indexOf(week) >= options.length - 1;
  }

  function selectionLabel(state) {
    return state === 'missed' ? '<span aria-label="MISSED DEADLINE · 0 points. The cutoff passed before submission."><span class="deadline-label-full">◷ MISSED DEADLINE</span><span class="deadline-label-short" aria-hidden="true">◷ MISSED</span> · 0 points</span>' : state === 'unverified' ? 'UNVERIFIED CUTOFF · Eligibility withheld' : state === 'no-submission' ? 'NO SUBMISSION · 0 points' : state === 'no-selection' ? 'NO PICK · 0 points' : state === 'correct' ? '✓ Correct' : state === 'wrong' ? '✕ Incorrect' : 'Pending';
  }

  // Reported OPEN improves messaging only; it never authorizes disclosure.
  function isOpenWeek(data) {
    return data.entriesStatus === 'OPEN' || data.week === activeWeek && prizeData?.formControl.reportedStatus === 'OPEN';
  }

  function pickPrivacyMessage(data) {
    if (isOpenWeek(data)) return `Week ${data.week} is open. Picks, predictions and voting stay private until entries are officially closed.`;
    if (data.entriesStatus === 'CLOSED') return `Week ${data.week} is closed, but approved player picks are unavailable until weekly data is complete.`;
    return `Week ${data.week} player picks are unavailable until entries are officially closed and complete approved picks are available.`;
  }

  function updatePickWeekAvailability(weeks) {
    eligiblePickWeeks = weeks.filter(w=>publicPicks(w)&&(w.hasPlayers??w.standings?.length)).map(w=>w.week).sort((a,b)=>a-b);
    for (const id of ['weekSelect','weeklyWeekSelect']) for (const option of $(id).options) {
      const data=weeks.find(w=>w.week===Number(option.value));
      if(data)option.textContent=`Week ${data.week} · ${publicPicks(data)?'Closed':isOpenWeek(data)?'Open':'Private'}`;
    }
    if(matchData)renderPickWeekHelp(matchData);
  }

  function renderPickWeekHelp(data) {
    const latest=eligiblePickWeeks.at(-1),button=$('closedWeekShortcut');
    setText('selectedWeekPrivacy',publicPicks(data)?`Week ${data.week} is closed. Approved player picks and comparisons are available.`:pickPrivacyMessage(data));
    button.hidden=publicPicks(data)||latest===undefined;
    button.textContent=latest===undefined?'No closed-week picks available':`View Week ${latest} player picks`;
    button.onclick=()=>loadWeekPicks(latest);
  }

  function renderWeekPicks(data) {
    matchData = data;
    matchModels = (data.games || []).map(game => preview.buildMatchView(data, game, prizeData?.formControl));
    setText('matchResultsWeek', `Week ${data.week}`);
    $('matchSelect').innerHTML = '<option value="">All matchups</option>' + matchModels.map(model => `<option value="${escapeHtml(model.game)}">${escapeHtml(model.game)}</option>`).join('');
    const closed = publicPicks(data);
    $('matchPrivacyNotice').hidden = closed;
    $('matchPrivacyNotice').textContent = pickPrivacyMessage(data);
    renderPickWeekHelp(data);
    setText('picksSubmissionCount', closed ? `${data.standings.length} submission${data.standings.length === 1 ? '' : 's'} for Week ${data.week}` : pickPrivacyMessage(data));
    $('playerSelect').innerHTML = '<option value="">All players</option>' + (closed ? data.standings.map(player => `<option value="${escapeHtml(player.name)}">${escapeHtml(player.name)}</option>`).join('') : '');
    $('playerSelect').disabled = !closed || !data.standings.length;
    for(const [id,value] of [['playerSelect',viewPreferences.player],['matchSelect',viewPreferences.match]])if(value&&[...$(id).options].some(o=>o.value===value))$(id).value=value;
    renderMatchCards();
    renderPlayerPickCards(data);
    renderPlayerPicksTable(data);
  }

  function votingHtml(model) {
    if (!model.votes) return '<p class="pick-meta">Voting unavailable until disclosure is verified.</p>';
    const votes = model.votes;
    const description = votes.teams.map(p => `${p.team}: ${p.percentage}%, ${p.count} votes`).join('; ');
    return `<div class="match-voting"><p class="eyebrow">Selection share</p>
      <div class="vote-bar" role="img" aria-label="${escapeHtml(description)}">${votes.teams.map(p => `<span aria-hidden="true" style="width:${p.percentage}%;${teamColorStyle_(p.team)}"></span>`).join('')}</div>
      <div class="vote-options">${votes.teams.map(p => `<div class="vote-option ${model.winner === p.team ? 'vote-winner' : ''}" style="${teamColorStyle_(p.team)}">
        <div class="vote-team-line">${teamBadgeHtml_(p.team, true, 'vote-team-badge')}<strong>${escapeHtml(p.team)}</strong></div>
        <span class="vote-share">${p.percentage}% <small>· ${p.count} vote${p.count === 1 ? '' : 's'}</small></span>
        ${model.winner === p.team ? '<span class="vote-decision">✓ Game winner</span>' : ''}
        ${votes.total && p.count > votes.total / 2 ? '<span class="vote-popular">Most selected</span>' : ''}
      </div>`).join('')}</div>
      <p class="pick-meta">${votes.total ? `${votes.total} valid votes · Popularity is not a game result.` : 'No valid votes yet. Both teams have 0%.'}</p>
      <details class="match-comparison" data-game="${escapeHtml(model.game)}"><summary>Compare picks for this matchup</summary><ul></ul></details>
    </div>`;
  }

  function gameCardHtml(model, includeVoting = false) {
    return `<article class="game-result-card" data-game="${escapeHtml(model.game)}">
      <div class="game-result-status" data-status="${escapeHtml(model.status)}">${model.status === 'In progress' ? 'LIVE · In progress' : escapeHtml(model.status)}${model.winner === 'Tie' ? ' · Tie' : ''}</div>
      ${model.kickoff ? `<p class="kickoff-note">${ownerView ? 'Kickoff' : 'Synthetic kickoff'} · ${escapeHtml(formatPacificDateTime_(model.kickoff))}</p>` : ''}
      ${model.teams.map((team,index) => teamResultHtml_(team,model.scores[index],!model.isFinal || !model.winner ? 'pending' : model.winner === 'Tie' ? 'draw' : model.winner === team ? 'winner' : 'loser')).join('')}
      ${!model.isFinal && model.scores.some(score => score !== '') ? '<p class="pick-meta">Scores provisional · No pick result until FINAL.</p>' : ''}
      ${includeVoting ? votingHtml(model) : ''}
    </article>`;
  }

  function renderMatchCards() {
    const selected = $('matchSelect').value;
    const models = matchModels.filter(model => !selected || selected === model.game);
    const groups = [['Awaiting results',models.filter(model => !model.isFinal)],['Final results',models.filter(model => model.isFinal)]];
    $('matchGameResults').innerHTML = groups.filter(([,items]) => items.length).map(([title,items]) => `<h4 class="match-group-heading">${title}</h4>${items.map(model => gameCardHtml(model, true)).join('')}`).join('') || '<p class="state-message">No matchups available.</p>';
  }

  function validTiebreakPrediction(player) {
    const raw=player.tiebreakPrediction;
    return typeof raw==='string' && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;
  }

  function renderPlayerPrediction(player, data) {
    if (!publicPicks(data) || !data.tiebreak?.enabled) return '';
    if (!data.tiebreak.revealed) return '<p class="player-prediction">Tiebreak prediction unavailable until publication is confirmed.</p>';
    if(player.tiebreakEligibility==='MISSED_DEADLINE')return '<p class="player-prediction">◷ Tiebreaker MISSED DEADLINE: your retained entry arrived after the designated game’s kickoff.</p>';
    if(player.tiebreakTimingUnverified)return '<p class="player-prediction">Tiebreaker eligibility unavailable: verified entry or kickoff evidence is missing.</p>';
    const raw = validTiebreakPrediction(player);
    const valid = raw !== null;
    const model = matchModels.find(m => m.game === data.tiebreak.game);
    const actual = model?.isFinal && model.scores.every(score => score !== '') ? model.scores.reduce((sum,score) => sum+Number(score),0) : null;
    return `<div class="player-prediction"><p class="eyebrow">Period-ending tiebreaker</p><p>${escapeHtml(data.tiebreak.game || 'Designated game unavailable')}</p>
      <p><strong>Tiebreak prediction: ${valid ? `${Number(raw)} combined points` : 'No valid prediction · Ineligible'}</strong></p>
      <p>${actual === null ? 'Actual combined score pending.' : `Actual FINAL combined score: ${actual}.${valid ? ` Off by ${Math.abs(Number(raw)-actual)}.` : ''}`}</p>
      <a class="text-link" href="#standings/monthly">Monthly champion decision ↗</a></div>`;
  }

  function renderPlayerPickCards(data) {
    if (!publicPicks(data)) {
      $('playerPickCards').innerHTML = `<div class="privacy-state"><strong>Picks stay private</strong>${escapeHtml(pickPrivacyMessage(data))}</div>`;
      return;
    }
    const selected = $('playerSelect').value;
    const players = data.standings.filter(p => !selected || p.name === selected);
    if(selected&&!currentMatchDisclosure(data))return;
    $('playerPickCards').innerHTML = players.map(player => `<details class="player-pick-card"${selected ? ' open data-built="true"' : ''}>
      <summary><span>${escapeHtml(player.name)}</span>${accuracyHtml(player)}</summary><div class="player-pick-details">${selected?playerDetailsHtml(player,data):''}</div></details>`).join('') || '<p class="state-message">No public picks for this week.</p>';
  }

  function currentMatchDisclosure(data) {
    if(!data||data!==matchData||!publicPicks(data))return false;
    // The adapter checks current snapshot/disclosure expiry before any deferred DOM work.
    if(data.games.length)preview.buildMatchView(data,data.games[0],prizeData?.formControl);
    return true;
  }

  function populatePlayerDetails(card,data) {
    if(!card||!card.isConnected||!currentMatchDisclosure(data)||card.dataset.built)return;
    const player=data.standings.find(p=>p.name===card.querySelector('summary>span').textContent);
    if(!player)return;
    card.querySelector('.player-pick-details').innerHTML=playerDetailsHtml(player,data);
    card.dataset.built='true';
  }

  function playerDetailsHtml(player,data) {
    return `<ul>${matchModels.map(model=>{
      const pick=model.selections.find(p=>p.name===player.name);
      return `<li><span>${escapeHtml(model.game)}</span>${pick?`<span class="selection-choice ${pick.state}" style="${teamColorStyle_(pick.pick)}">${pick.pick?teamBadgeHtml_(pick.pick,true,'pick-team-badge'):''}<strong>${escapeHtml(pick.pick || '—')}</strong><small>${selectionLabel(pick.state)}</small></span>`:'<span>No selection</span>'}</li>`;
    }).join('')}</ul>${renderPlayerPrediction(player,data)}`;
  }

  function populateMatchComparison(details) {
    if(!currentMatchDisclosure(matchData)||details.dataset.built)return;
    const model=matchModels.find(m=>m.game===details.dataset.game);if(!model)return;
    details.querySelector('ul').innerHTML=model.selections.map(p=>`<li><span>${escapeHtml(p.name)}</span><span class="selection-choice ${p.state}" style="${teamColorStyle_(p.pick)}"><strong>${escapeHtml(p.pick || '—')}</strong><small>${selectionLabel(p.state)}</small></span></li>`).join('')||'<li>No selections for this matchup.</li>';
    details.dataset.built='true';
  }

  function renderPlayerPicksTable(data) {
    if(!$('pickMatrix').open){
      $('playerPicksHead').textContent='';$('playerPicksBody').textContent='';
      delete $('pickMatrix').dataset.built;return;
    }
    if($('pickMatrix').dataset.built===String(picksRequest)&&currentMatchDisclosure(data))return;
    if (!publicPicks(data)) {
      $('playerPicksHead').innerHTML = '';
      $('playerPicksBody').innerHTML = `<tr><td>${escapeHtml(pickPrivacyMessage(data))}</td></tr>`;
      return;
    }
    if(!currentMatchDisclosure(data))return;
    $('pickMatrix').dataset.built=String(picksRequest);
    const showPrediction=data.tiebreak?.enabled&&data.tiebreak.revealed;
    $('playerPicksHead').innerHTML = `<tr><th scope="col">Player</th>${matchModels.map(model => `<th scope="col" class="game-th">${matchupHeaderHtml_(model.game)}</th>`).join('')}${showPrediction?'<th scope="col">Tiebreak total</th>':''}<th scope="col">Correct</th><th scope="col">Accuracy</th></tr>`;
    $('playerPicksBody').innerHTML = data.standings.map(player => `<tr><th scope="row" class="player-name">${escapeHtml(player.name)}</th>${matchModels.map(model => {
      const pick = model.selections.find(p => p.name === player.name);
      return pick ? `<td class="pick-cell ${pick.state}" style="${teamColorStyle_(pick.pick)}"><strong>${escapeHtml(pick.pick || '—')}</strong><p class="pick-outcome">${selectionLabel(pick.state)}</p></td>` : '<td class="pick-cell empty">—</td>';
    }).join('')}${showPrediction?`<td class="num matrix-prediction">${player.tiebreakEligibility==='MISSED_DEADLINE'?'MISSED DEADLINE':player.tiebreakTimingUnverified?'UNVERIFIED CUTOFF':validTiebreakPrediction(player)??'—'}</td>`:''}<td class="num matrix-total">${player.points}</td><td class="num">${accuracyHtml(player)}</td></tr>`).join('') || `<tr><td colspan="${matchModels.length+3+(showPrediction?1:0)}">No submissions yet.</td></tr>`;
  }

  function populateWeekSelector(weeks, defaultWeek) {
    const select = $('weekSelect');
    select.innerHTML = weeks.map(week =>
      `<option value="${week}">Week ${week}</option>`
    ).join('');

    select.value = String(defaultWeek);
    select.onchange = () => loadWeekPicks(select.value);
    ['previousWeek','nextWeek'].forEach((id,index) => $(id).onclick = () => {
      const options = [...select.options];
      const next = options[select.selectedIndex + (index === 0 ? -1 : 1)];
      if (next) loadWeekPicks(next.value);
    });
    $('matchSelect').onchange = ()=>{viewPreferences.match=$('matchSelect').value;renderMatchCards();};
    $('playerSelect').onchange = () => { viewPreferences.player=$('playerSelect').value;if (matchData) renderPlayerPickCards(matchData); };
  }

  function renderWeeklyDetails(weekData) {
    setText('weeklyTitle', `Week ${weekData?.week || '—'} Standings`);
    setText(
      'weeklyStatusNote',
      weekData?.visibility === 'WITHHELD' ? 'Standings withheld; disclosure evidence incomplete.' : weekData?.outcome?.finalized ? 'This week is final.' : `${sourceLabel} standings; results pending.`
    );
    setText('weeklyResultsWeek', `Week ${weekData?.week || '—'}`);

    renderStandingsRows('weeklyStandingsBody', weekData?.standings || []);

    renderGameResultsInto_('weeklyGameResults', weekData);
  }

  async function renderDashboardGameResults(weekData) {
    const generation=renderGeneration;
    let results = weekData;
    if (!weekData.results.some(game => game.status === 'Final')) {
      const recent = prizeData.weekly.filter(row => row.week < weekData.week && row.finalized).at(-1);
      if (recent) {
        const snapshot = await loadWeek(recent.week);
        if (snapshot.results.some(game => game.status === 'Final')) results = snapshot;
      }
    }
    if(generation!==renderGeneration)return;
    setText('dashboardResultsWeek', `Week ${results.week}${results !== weekData ? ' · Recent finals' : ''}`);
    renderGameResultsInto_('dashboardGameResults', results);
  }

  function renderGameResultsInto_(containerId, weekData) {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = (weekData?.games || []).map(game => gameCardHtml(preview.buildMatchView(weekData, game, prizeData?.formControl))).join('') || '<p class="state-message">No games found for this week.</p>';
  }

  function teamResultHtml_(team, score, state) {
    const highlighted = state === 'winner';
    const style = highlighted ? teamColorStyle_(team) : '';
    const cls = highlighted ? 'team-winner' : state === 'loser' ? 'team-loser' : 'team-neutral';
    const outcomeLabel = state === 'winner' ? '✓ WINNER' : state === 'loser' ? 'LOSS' : state === 'draw' ? 'TIE' : '';
    const scoreHtml = score === ''
      ? '<span class="team-result-score empty-score">—</span>'
      : `<span class="team-result-score">${escapeHtml(score)}</span>`;

    return `
      <div class="team-result ${cls}" ${style ? `style="${style}"` : ''}>
        <span class="team-result-name">
          ${teamBadgeHtml_(team, highlighted, 'team-result-badge')}
          <span>${escapeHtml(team)}</span>
        </span>
        <span class="team-result-right">
          ${scoreHtml}
          ${outcomeLabel ? `<strong>${outcomeLabel}</strong>` : ''}
        </span>
      </div>
    `;
  }

  const NFL_TEAM_ABBRS = {
    cardinals:'ARI',
    falcons:'ATL',
    ravens:'BAL',
    bills:'BUF',
    panthers:'CAR',
    bears:'CHI',
    bengals:'CIN',
    browns:'CLE',
    cowboys:'DAL',
    broncos:'DEN',
    lions:'DET',
    packers:'GB',
    texans:'HOU',
    colts:'IND',
    jaguars:'JAX',
    chiefs:'KC',
    raiders:'LV',
    chargers:'LAC',
    rams:'LAR',
    dolphins:'MIA',
    vikings:'MIN',
    patriots:'NE',
    saints:'NO',
    giants:'NYG',
    jets:'NYJ',
    eagles:'PHI',
    steelers:'PIT',
    '49ers':'SF',
    seahawks:'SEA',
    buccaneers:'TB',
    titans:'TEN',
    commanders:'WAS'
  };

  function teamAbbr_(team) {
    return NFL_TEAM_ABBRS[normalizeTeamLabel(team)] || String(team || '').trim().slice(0, 3).toUpperCase();
  }

  function teamBadgeHtml_(team, highlighted = false, className = 'team-badge') {
    const style = highlighted ? teamColorStyle_(team) : '';
    const cls = highlighted ? `${className} highlighted` : className;
    const abbr=teamAbbr_(team);const known=Object.values(NFL_TEAM_ABBRS).includes(abbr);
    return `<span class="${cls}" ${style ? `style="${style}"` : ''}>${known ? `<img class="team-logo" src="assets/teams/${abbr.toLowerCase()}.svg" width="48" height="48" alt="" loading="lazy" decoding="async">` : ''}<span class="team-abbreviation">${escapeHtml(abbr)}</span></span>`;
  }

  function matchupHeaderHtml_(game) {
    const teams = String(game || '').split(/\s+vs\.?\s+/i);
    const team1 = teams[0] || game;
    const team2 = teams[1] || '';
    if (!team2) return escapeHtml(game);

    return `
      <div class="matchup-header">
        <span class="matchup-team">${teamBadgeHtml_(team1, false, 'matchup-badge')}<span>${escapeHtml(team1)}</span></span>
        <span class="matchup-vs">vs</span>
        <span class="matchup-team">${teamBadgeHtml_(team2, false, 'matchup-badge')}<span>${escapeHtml(team2)}</span></span>
      </div>
    `;
  }

  const NFL_TEAM_COLORS = {
    cardinals:'#97233F', falcons:'#A71930', ravens:'#241773', bills:'#00338D',
    panthers:'#0085CA', bears:'#0B162A', bengals:'#FB4F14', browns:'#311D00',
    cowboys:'#003594', broncos:'#FB4F14', lions:'#0076B6', packers:'#203731',
    texans:'#03202F', colts:'#002C5F', jaguars:'#006778', chiefs:'#E31837',
    raiders:'#000000', chargers:'#0080C6', rams:'#003594', dolphins:'#008E97',
    vikings:'#4F2683', patriots:'#002244', saints:'#D3BC8D', giants:'#0B2265',
    jets:'#125740', eagles:'#004C54', steelers:'#FFB612', '49ers':'#AA0000',
    seahawks:'#002244', buccaneers:'#D50A0A', titans:'#4B92DB', commanders:'#5A1414'
  };

  function teamColor_(team) {
    return NFL_TEAM_COLORS[normalizeTeamLabel(team)] || '#147a5f';
  }

  function teamColorStyle_(team) {
    return `--team-color:${teamColor_(team)};`;
  }

  function normalizeTeamLabel(value) {
    return String(value || '').trim().toLowerCase().split(/\s+/).pop();
  }

  function populateWeeklySelector(weeks, defaultWeek) {
    const select = $('weeklyWeekSelect');
    if (!select) return;

    select.innerHTML = weeks.map(week =>
      `<option value="${week}">Week ${week}</option>`
    ).join('');
    select.value = String(defaultWeek);

    select.onchange = async () => {
      const week = Number(select.value),generation=renderGeneration;
      try {
        const data = await loadWeek(week);
        if (generation===renderGeneration&&Number(select.value) === week) renderWeeklyDetails(data);
      } catch (_) {
        setText('weeklyStatusNote', `${sourceLabel} week unavailable. No external connection was attempted.`);
        $('weeklyStandingsBody').innerHTML = '';
        $('weeklyGameResults').textContent = `${sourceLabel} data unavailable.`;
      }
    };
  }

  function populateMonthlySelector(periods, defaultPeriod) {
    const select = $('monthlyPeriodSelect');
    if (!select) return;

    select.innerHTML = periods.map(period =>
      `<option value="${escapeHtml(period.periodKey)}">${escapeHtml(period.displayName)} (${period.startWeek}-${period.endWeek})</option>`
    ).join('');
    select.value = defaultPeriod || periods[0]?.periodKey || '';

    select.onchange = () => renderMonthlyPeriod(select.value);
  }

  function setupNavigation() {
    const routes = {
      overview: ['overview'], 'match-center': ['match-center'],
      standings: ['standings', 'weekly'], 'standings/weekly': ['standings', 'weekly'],
      'standings/monthly': ['standings', 'monthly'], 'standings/season': ['standings', 'season'],
      prizes: ['prizes'], guide: ['guide', 'rules'], 'guide/rules': ['guide', 'rules'], 'guide/faq': ['guide', 'faq']
    };
    const legacyRoutes = {dashboard:'overview',picks:'match-center',weekly:'standings/weekly',monthly:'standings/monthly',season:'standings/season',rules:'guide/rules',faq:'guide/faq'};
    function applyRoute(focus = false) {
      let key = location.hash.slice(1);
      if (legacyRoutes[key]) key = legacyRoutes[key];
      if (!Object.hasOwn(routes, key)) key = 'overview';
      if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
      const [destination, subview] = routes[key];
      document.querySelectorAll('.destination').forEach(panel => { panel.hidden = panel.id !== destination; });
      ['weekly','monthly','season','rules','faq'].forEach(id => {
        $(id).hidden = id !== subview;
      });
      document.querySelectorAll('.primary-nav a').forEach(link => {
        if (link.dataset.destination === destination) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      document.querySelectorAll('.subnav a').forEach(link => {
        if (link.hash === `#${destination}/${subview}`) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      const heading = $(destination).querySelector('.page-header h1');
      document.title = `${heading.textContent} · Perfect Pick 4.0 — ${liveView ? 'Competition' : ownerView ? 'Owner Verification' : 'Synthetic Preview'}`;
      if (focus) heading.focus({preventScroll:true});
      if(prizeData){const generation=renderGeneration;renderActiveView().catch(()=>{if(generation===renderGeneration)setStatus('This view is unavailable. Refresh to retry.','error');});}
    }
    window.addEventListener('hashchange', () => applyRoute(true));
    document.querySelectorAll('.primary-nav, .subnav').forEach(nav => {
      nav.addEventListener('keydown', event => {
        const links = [...nav.querySelectorAll('a')];
        const index = links.indexOf(document.activeElement);
        if (index < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
        links[target].focus();
      });
    });
    document.querySelector('.skip-link').addEventListener('click', event => {
      event.preventDefault();
      $('main-content').focus();
    });
    applyRoute();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function resetRenderedData(message) {
    document.querySelectorAll('[data-view-state]').forEach(panel=>{delete panel.dataset.viewState;panel.removeAttribute('aria-busy');});
    weekCache.clear();monthlyCache.clear();renderedViews.clear();matchData=null;matchModels=[];eligiblePickWeeks=[];
    picksRequest++;monthlyRequest++;if(deadlineTimer){clearInterval(deadlineTimer);deadlineTimer=null;}
    document.querySelectorAll('.legacy-section tbody').forEach(body=>body.textContent='');
    for(const id of ['playerPicksHead','playerPickCards','matchGameResults','monthlyPrizeCallout','prizeSummary','periodCards','dashboardGameResults','weeklyGameResults','recentWeeks','prizeBreakdown','overviewLeaders','overviewLeaderCards','dashboardUpcoming','picksSubmissionCount','weeklyStatusNote','overviewProgress'])$(id).textContent=message;
    for(const id of ['championHeading','championSummary','championState']){$(id).textContent=message;delete $(id).dataset.winner;}
    document.querySelectorAll('[data-winner]').forEach(element=>delete element.dataset.winner);
    $('pickMatrix').open=false;delete $('pickMatrix').dataset.built;
    $('playerSelect').innerHTML='<option value="">All players</option>';$('playerSelect').disabled=true;
    $('matchSelect').innerHTML='<option value="">All matchups</option>';
    $('closedWeekShortcut').hidden=true;setText('selectedWeekPrivacy',message);
  }

  async function renderActiveView() {
    if(!prizeData)return;
    const destination=document.querySelector('.destination:not([hidden])')?.id;
    const key=destination==='standings'?document.querySelector('#standings .legacy-section:not([hidden])')?.id:destination;
    if(renderedViews.has(key))return renderedViews.get(key);
    const generation=renderGeneration,prizes=prizeData;
    const panel=$(key);panel.dataset.viewState='loading';panel.setAttribute('aria-busy','true');
    const job=Promise.resolve().then(async()=>{
      if(generation!==renderGeneration)return;
      if(key==='overview')await renderOverview(prizes);
      else if(key==='match-center'){
        const weeks=prizes.weekAvailability||await Promise.all(prizes.weekly.map(w=>loadWeek(w.week)));
        if(generation!==renderGeneration)return;updatePickWeekAvailability(weeks);
        if(matchData?.week!==Number($('weekSelect').value))await loadWeekPicks(Number($('weekSelect').value));
      }else if(key==='weekly'){
        const week=await loadWeek(Number($('weeklyWeekSelect').value));if(generation===renderGeneration)renderWeeklyDetails(week);
      }else if(key==='monthly')await renderMonthlyPeriod($('monthlyPeriodSelect').value);
      else if(key==='season')renderSeasonStandings(prizes);
      else if(key==='prizes')await renderPrizes(prizes);
    }).then(()=>{if(generation===renderGeneration){panel.dataset.viewState='ready';panel.setAttribute('aria-busy','false');}}).catch(error=>{if(generation===renderGeneration){renderedViews.delete(key);panel.dataset.viewState='error';panel.setAttribute('aria-busy','false');}throw error;});
    renderedViews.set(key,job);return job;
  }

  async function load() {
    if (!navigationStarted) { setupNavigation(); navigationStarted=true; }
    const selected={week:$('weekSelect').value,weekly:$('weeklyWeekSelect').value,month:$('monthlyPeriodSelect').value,player:$('playerSelect').value,match:$('matchSelect').value};
    viewPreferences={week:Number(selected.week),player:selected.player||viewPreferences.player,match:selected.match||viewPreferences.match};
    const hadRenderedData=prizeData!==null||renderedViews.size>0;
    const generation=++renderGeneration;prizeData=null;if(hadRenderedData)resetRenderedData('Waiting for this view.');
    try {
      setStatus(liveView ? 'Loading competition data…' : ownerView ? 'Loading validated owner snapshot…' : 'Loading synthetic preview…');
      const prizes = await get('prizes');if(generation!==renderGeneration)return;
      prizeData = prizes;renderDashboard(prizes);
      activeWeek = Number(prizes.activeWeek || 1);
      const weeks = (prizes.weekly || []).map(w => Number(w.week)).filter(Boolean);
      const availableWeeks = weeks.length ? weeks : Array.from({ length: 18 }, (_, i) => i + 1);
      populateWeekSelector(availableWeeks, availableWeeks.includes(Number(selected.week))?Number(selected.week):activeWeek);
      populateWeeklySelector(availableWeeks, availableWeeks.includes(Number(selected.weekly))?Number(selected.weekly):activeWeek);
      populateMonthlySelector(prizes.periods || [], prizes.periods.some(p=>p.periodKey===selected.month)?selected.month:prizes.currentPeriod);
      await renderActiveView();if(generation!==renderGeneration)return;
      const when = prizes.generatedAt ? new Date(prizes.generatedAt).toLocaleString() : '';
      setStatus(`${sourceLabel} data loaded${when ? ` • ${when}` : ''}`, 'ok');
    } catch (err) {
      if(generation!==renderGeneration)return;
      setText('championHeading', 'Competition unavailable.');
      setText('championSummary', `${sourceLabel} data unavailable. No champion or payout has been awarded.`);
      setText('championState', 'Unavailable');
      setStatus(liveView ? 'Competition data unavailable. Use Refresh results to retry.' : ownerView ? 'Verified snapshot unavailable. Reverification required; no external connection attempted.' : 'Synthetic preview unavailable. Missing or invalid fixtures; no external connection attempted.', 'error');
      if (!liveView) document.querySelectorAll('.legacy-section').forEach(panel => {
        if (!['rules', 'faq'].includes(panel.id)) panel.innerHTML = `<div class="panel state-message">${sourceLabel} data unavailable. No external connection attempted.</div>`;
      });
    }
  }

  document.addEventListener('toggle',event=>{
    const details=event.target;if(!details.open)return;
    try{
      if(details.id==='pickMatrix'&&matchData)renderPlayerPicksTable(matchData);
      else if(details.matches('.player-pick-card'))populatePlayerDetails(details,matchData);
      else if(details.matches('.match-comparison'))populateMatchComparison(details);
    }catch{
      // Never reuse deferred player content after the validated snapshot expires.
      if(details.id==='pickMatrix'){$('playerPicksHead').textContent='';$('playerPicksBody').textContent='Picks unavailable. Refresh to retry.';}
      else details.querySelector('ul,.player-pick-details')?.replaceChildren();
    }
  },true);

  document.addEventListener('DOMContentLoaded', load);
  if (liveView) {
    document.addEventListener('perfectpick:loading',()=>{const button=$('refreshResults');if(button){button.disabled=true;button.textContent='Updating…';}});
    document.addEventListener('perfectpick:settled',()=>{const button=$('refreshResults');if(button){button.disabled=false;button.textContent='Refresh results';}});
    document.addEventListener('perfectpick:degraded',()=>setStatus('Update unavailable. Showing still-valid snapshot; retry with Refresh results.','warning'));
    document.addEventListener('perfectpick:invalid',()=>setStatus('Latest response could not be verified. Showing still-valid snapshot; retry with Refresh results.','warning'));
    document.addEventListener('perfectpick:refresh', load);
    document.addEventListener('perfectpick:unavailable', () => {
      renderGeneration++;viewPreferences.player='';viewPreferences.match='';prizeData=null;resetRenderedData('Competition data unavailable. Refresh to retry.');
      for (const id of ['championHeading','championSummary','championState','weeklyPot','monthlyPot','monthlyWinnerPool','seasonPot','confirmedSeasonPot']) { const element=$(id); if(element) { element.textContent='Unavailable'; delete element.dataset.winner; } }
      const privacy=$('matchPrivacyNotice');if(privacy){privacy.hidden=false;privacy.textContent='Competition data unavailable. Picks and voting remain protected.';}
      document.querySelectorAll('[data-winner]').forEach(element=>delete element.dataset.winner);
      const players=$('playerSelect');if(players){players.innerHTML='<option value="">Unavailable</option>';players.disabled=true;}
      const button=$('submitPicks');if(button){button.removeAttribute('href');button.setAttribute('aria-disabled','true');button.disabled=true;}
      setStatus('Competition data unavailable. Refresh to retry.', 'error');
    });
  }
})();
