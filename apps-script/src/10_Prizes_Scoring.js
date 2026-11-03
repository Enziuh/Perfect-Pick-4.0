function buildPrizeDashboardFromContext_(ctx) {
  const rules = readPrizeRules_(ctx.ss);
  const weeklyPrizeRows = readWeeklyPrizeRows_(ctx.ss);
  const tiebreakRules = readTiebreakRules_(ctx.ss);
  const formControl = readFormControl_(ctx.ss);
  const overall = buildOverallFromContext_(ctx);
  const activeWeek = getActiveWeek_(ctx.games, ctx.resultLookup);
  const currentWeekData = buildWeekFromContext_(activeWeek, ctx);

  const weekly = [];
  for (let week = 1; week <= 18; week++) {
    const rule = findRuleForWeek_(rules, week);
    const row = weeklyPrizeRows[week] || {};
    const scored = buildWeekFromContext_(week, ctx);

    const entry = numberOr_(rule?.weeklyEntry, PP3.DEFAULT_WEEKLY_ENTRY);
    const activePlayers = numberOr_(row.activePlayers, 0);
    const calculatedPot = roundMoney_(activePlayers * entry);
    const overridePot = parseOptionalNumber_(row.overrideWeeklyPot);
    const weeklyPot = overridePot === null ? calculatedPot : roundMoney_(overridePot);

    weekly.push({
      week,
      periodKey: rule?.periodKey || row.periodKey || '',
      activePlayers,
      weeklyEntry: entry,
      weeklyPot,
      finalized: scored.outcome.finalized,
      perfectPickWinners: scored.outcome.perfectWinners.length,
      perfectPickWinnerNames: scored.outcome.perfectWinners,
      perfectPayoutEach: scored.outcome.finalized && scored.outcome.perfectWinners.length
        ? roundMoney_(weeklyPot / scored.outcome.perfectWinners.length)
        : 0,
      rolloverToMonthly:
        String(rule?.ruleMode || '').toUpperCase() === 'NEW' &&
        scored.outcome.finalized &&
        scored.outcome.perfectWinners.length === 0
          ? weeklyPot
          : 0,
      overrideWeeklyPot: overridePot,
      notes: row.notes || ''
    });
  }

  const periods = rules.map(rule => {
    const periodWeeks = weekly.filter(w => w.week >= rule.startWeek && w.week <= rule.endWeek);
    const allWeeksFinalized =
      periodWeeks.length > 0 &&
      periodWeeks.every(w => w.finalized);

    const monthlyPot = roundMoney_(
      periodWeeks.reduce((sum, w) => sum + w.rolloverToMonthly, 0)
    );

    const newMode = rule.ruleMode === 'NEW';
    const monthlyWinnerPool = newMode
      ? roundMoney_(monthlyPot * rule.monthlyWinnerPct / 100)
      : 0;

    const seasonContribution = newMode && rule.includeInSeason
      ? roundMoney_(monthlyPot * rule.seasonPct / 100)
      : 0;

    const standings = getPeriodStandings_(ctx, rule.startWeek, rule.endWeek);
    const leaders = standings.length
      ? standings.filter(p => p.points === standings[0].points).map(p => p.name)
      : [];

    return {
      periodKey: rule.periodKey,
      displayName: rule.displayName,
      startWeek: rule.startWeek,
      endWeek: rule.endWeek,
      ruleMode: rule.ruleMode,
      includeInSeason: rule.includeInSeason,
      locked: rule.locked,
      monthlyPot,
      monthlyWinnerPct: rule.monthlyWinnerPct,
      monthlyWinnerPool,
      seasonPct: rule.seasonPct,
      seasonContribution,
      allWeeksFinalized,
      leaders,
      standings,
      tiebreakRule: tiebreakRules[rule.endWeek] || {
        week: rule.endWeek,
        questionLabel: `WK ${rule.endWeek} Tie Breaker — Final Game — Enter Combined Score`,
        game: '',
        eventId: '',
        actualTotal: '',
        status: 'Pending',
        method: 'Combined Points',
        notes: ''
      },
      // The monthly share is for one 1st-place winner. If 1st is tied,
      // the period-ending combined-points question decides the winner.
      estimatedMonthlyWinnings: [],
      projectedMonthlyPayoutEach: 0,
      monthlyPayoutEach: 0
    };
  });

  const currentRule = findRuleForWeek_(rules, activeWeek) || null;
  const currentPeriod = currentRule
    ? periods.find(p => p.periodKey === currentRule.periodKey) || null
    : null;
  const currentWeekRow = weekly.find(w => w.week === activeWeek) || null;
  const currentPeriodWeeks = currentRule
    ? weekly.filter(w => w.week >= currentRule.startWeek && w.week <= currentRule.endWeek)
    : [];

  const currentMonthlyRolloverBreakdown = currentPeriodWeeks
    .filter(w => w.rolloverToMonthly > 0)
    .map(w => ({
      week: w.week,
      amount: w.rolloverToMonthly
    }));

  const currentProjectedSeasonContribution =
    currentPeriod?.seasonContribution || 0;

  const confirmedSeasonPot = roundMoney_(
    periods
      .filter(p => p.ruleMode === 'NEW' && p.includeInSeason && p.allWeeksFinalized)
      .reduce((sum, p) => sum + p.seasonContribution, 0)
  );

  const projectedSeasonPot = roundMoney_(
    periods
      .filter(p => p.ruleMode === 'NEW' && p.includeInSeason)
      .reduce((sum, p) => sum + p.seasonContribution, 0)
  );

  return {
    app: 'Perfect Pick 3.0',
    season: PP3.SEASON,
    generatedAt: new Date().toISOString(),
    activeWeek,
    formControl,
    currentPeriod: currentRule?.periodKey || '',
    currentPeriodName: currentRule?.displayName || '',
    currentRuleMode: currentRule?.ruleMode || '',
    currentWeeklyPot: currentWeekRow?.weeklyPot || 0,
    currentWeekStandings: currentWeekData?.standings || [],
    currentWeekFinalized: currentWeekData?.outcome?.finalized || false,
    currentWeekPerfectWinners: currentWeekData?.outcome?.perfectWinners || [],
    currentMonthlyPot: currentPeriod?.monthlyPot || 0,
    currentMonthlyRolloverBreakdown,
    projectedMonthlyWinnerPool: currentPeriod?.monthlyWinnerPool || 0,
    currentProjectedSeasonContribution,
    currentPeriodStandings: currentPeriod?.standings || [],
    currentPeriodEstimatedWinnings: [],
    confirmedSeasonPot,
    projectedSeasonPot,
    // Season payout structure is intentionally TBD.
    seasonPayoutPercents: null,
    weekly,
    periods,
    overallStandings: overall.standings,
    estimatedSeasonWinnings: []
  };
}

function calculateRankedPayouts_(standings, prizePool, payoutPercents) {
  if (!standings.length || prizePool <= 0) return [];

  const percentsByPosition = {
    1: numberOr_(payoutPercents.first, 60),
    2: numberOr_(payoutPercents.second, 25),
    3: numberOr_(payoutPercents.third, 15)
  };

  const payouts = [];
  let i = 0;

  while (i < standings.length) {
    const points = standings[i].points;
    const group = [];
    let j = i;

    while (j < standings.length && standings[j].points === points) {
      group.push(standings[j]);
      j++;
    }

    const startPosition = i + 1;
    let combinedPct = 0;

    for (let pos = startPosition; pos < startPosition + group.length; pos++) {
      combinedPct += percentsByPosition[pos] || 0;
    }

    const pctEach = group.length ? combinedPct / group.length : 0;
    const rawGroupAmount = prizePool * combinedPct / 100;
    const baseAmountEach = group.length ? Math.floor((rawGroupAmount / group.length) * 100) / 100 : 0;
    let remainderCents = Math.round((rawGroupAmount - baseAmountEach * group.length) * 100);

    group.forEach((player, index) => {
      const extraCent = index < remainderCents ? 0.01 : 0;
      payouts.push({
        rank: player.rank,
        name: player.name,
        points: player.points,
        payoutPercent: roundMoney_(pctEach),
        estimatedWinnings: roundMoney_(baseAmountEach + extraCent)
      });
    });

    i = j;
  }

  return payouts;
}

function calculateSeasonEstimatedWinnings_(standings, seasonPot, payoutPercents) {
  return calculateRankedPayouts_(standings, seasonPot, payoutPercents);
}

function getSeasonPayoutPercents_(rules) {
  const candidate = rules.find(r => r.ruleMode === 'NEW') || rules[0] || {};
  return {
    first: numberOr_(candidate.season1Pct, 60),
    second: numberOr_(candidate.season2Pct, 25),
    third: numberOr_(candidate.season3Pct, 15)
  };
}

/* =========================================================
   SCORING / PERFECT PICK
   ========================================================= */

function buildWeekFromContext_(week, ctx) {
  const weekGames = ctx.games.filter(g => g.week === week);

  if (!weekGames.length) {
    return {
      season: PP3.SEASON,
      week,
      games: [],
      results: [],
      outcome: { finalized: false, status: 'pending', perfectWinners: [] },
      standings: []
    };
  }

  const latest = getLatestSubmissionPerWeek_(ctx.responses, ctx.games);
  const entrants = Object.values(latest).filter(s => s.week === week);

  const tiebreakRules = readTiebreakRules_(ctx.ss);
  const tiebreakRule = tiebreakRules[week] || null;
  const revealTiebreak = tiebreakRule
    ? shouldRevealTiebreakPrediction_(week, ctx.ss)
    : false;

  const standingsPrivate = entrants.map(submission =>
    scoreSubmissionForWeek_(
      submission,
      weekGames,
      ctx.playerRegistry,
      ctx.resultLookup
    )
  );

  standingsPrivate.sort((a, b) =>
    b.points - a.points ||
    a.publicName.localeCompare(b.publicName)
  );

  const ranked = addRanks_(standingsPrivate);

  const standings = ranked.map(player => ({
    rank: player.rank,
    name: player.publicName,
    points: player.points,
    completedGames: player.completedGames,
    totalPicks: player.totalPicks,
    perfectWeek: player.perfectWeek,
    picks: player.picks,
    // The prediction itself stays hidden until picks are locked.
    tiebreakSubmitted: Boolean(player.tiebreakPrediction),
    tiebreakPrediction: revealTiebreak ? player.tiebreakPrediction : '',
    tiebreakQuestion: player.tiebreakQuestion || ''
  }));

  // Game result data is independent of player submissions so the dashboard
  // can show scores even when nobody submitted picks for a game/week.
  const results = weekGames.map(gameInfo => {
    const result =
      ctx.resultLookup[week]?.[normalizeGame_(gameInfo.game)] || {};

    const parsedTeams = parseTeamsFromGame3_0_(gameInfo.game);

    return {
      game: gameInfo.game,
      team1: result.team1 || parsedTeams.team1 || '',
      team2: result.team2 || parsedTeams.team2 || '',
      winner: String(result.winner || '').trim(),
      status: String(result.status || 'Pending').trim(),
      team1Score:
        result.team1Score === undefined || result.team1Score === null
          ? ''
          : result.team1Score,
      team2Score:
        result.team2Score === undefined || result.team2Score === null
          ? ''
          : result.team2Score
    };
  });

  const outcome = calculateWeekOutcomeFromStandings_(
    week,
    weekGames,
    standingsPrivate,
    ctx.resultLookup
  );

  return {
    season: PP3.SEASON,
    week,
    games: weekGames.map(g => g.game),
    results,
    outcome,
    tiebreak: {
      enabled: Boolean(tiebreakRule),
      revealed: Boolean(tiebreakRule && revealTiebreak),
      questionLabel: tiebreakRule?.questionLabel || '',
      game: tiebreakRule?.game || '',
      method: tiebreakRule?.method || 'Combined Points'
    },
    standings
  };
}

function calculateWeekOutcomeFromStandings_(week, weekGames, standingsPrivate, resultLookup) {
  const allGamesFinal = weekGames.every(game => {
    const result = resultLookup[week]?.[normalizeGame_(game.game)] || null;
    return result && normalizeText_(result.status) === 'final';
  });

  if (!allGamesFinal) {
    return {
      finalized: false,
      status: 'pending',
      perfectWinners: []
    };
  }

  const gameCount = weekGames.length;
  const perfectWinners = standingsPrivate
    .filter(player =>
      player.points === gameCount &&
      player.completedGames === gameCount &&
      player.totalPicks === gameCount
    )
    .map(player => player.publicName);

  return {
    finalized: true,
    status: perfectWinners.length ? 'winner' : 'rollover',
    perfectWinners
  };
}

function scoreSubmissionForWeek_(submission, weekGames, playerRegistry, resultLookup) {
  const response = submission.response;
  const submittedName = String(response[PP3.NAME_COLUMN] || '').trim();
  const internalName =
    playerRegistry[submission.phone] ||
    submittedName ||
    'Player';

  const player = {
    privateId: submission.phone,
    publicName: toPublicName_(internalName),
    points: 0,
    completedGames: 0,
    totalPicks: 0,
    perfectWeek: false,
    picks: [],
    tiebreakPrediction: '',
    tiebreakQuestion: ''
  };

  const tiebreakEntry = getTiebreakPredictionForWeek_(response, submission.week);
  player.tiebreakPrediction = tiebreakEntry.prediction;
  player.tiebreakQuestion = tiebreakEntry.questionLabel;

  weekGames.forEach(gameInfo => {
    const pick = String(response[gameInfo.header] || '').trim();
    if (!pick) return;

    player.totalPicks++;

    const result =
      resultLookup[submission.week]?.[normalizeGame_(gameInfo.game)] || null;

    let winner = '';
    let status = 'Pending';
    let correct = null;

    if (result) {
      winner = String(result.winner || '').trim();
      status = String(result.status || 'Pending').trim();
    }

    if (winner && normalizeText_(status) === 'final') {
      player.completedGames++;
      correct = normalizeTeam_(pick) === normalizeTeam_(winner);
      if (correct) player.points++;
    }

    player.picks.push({
      game: gameInfo.game,
      pick,
      winner,
      status,
      correct
    });
  });

  const gameCount = weekGames.length;
  player.perfectWeek =
    gameCount > 0 &&
    player.points === gameCount &&
    player.completedGames === gameCount &&
    player.totalPicks === gameCount;

  return player;
}


function getTiebreakPredictionForWeek_(response, week) {
  const weekNumber = Number(week);
  if (!weekNumber || !response) {
    return { questionLabel: '', prediction: '' };
  }

  const regex = new RegExp(`^WK\\s*${weekNumber}\\s+Tie\\s*Breaker\\b`, 'i');
  const questionLabel = Object.keys(response).find(header => regex.test(String(header || '').trim())) || '';
  const prediction = questionLabel
    ? String(response[questionLabel] || '').trim()
    : '';

  return {
    questionLabel,
    prediction
  };
}

function shouldRevealTiebreakPrediction_(week, ss) {
  const control = readFormControl_(ss);
  const activeWeek = Number(control.activeWeek || 0);
  const targetWeek = Number(week || 0);

  // Any completed/older week is safe to reveal once a later week is active.
  if (activeWeek && targetWeek < activeWeek) return true;

  if (targetWeek !== activeWeek) return false;

  if (String(control.status || '').toUpperCase() === 'CLOSED') {
    return true;
  }

  if (control.picksClose) {
    const deadline = new Date(control.picksClose);
    if (!isNaN(deadline.getTime()) && Date.now() >= deadline.getTime()) {
      return true;
    }
  }

  return false;
}

function buildOverallFromContext_(ctx) {
  const latest = getLatestSubmissionPerWeek_(ctx.responses, ctx.games);
  const aggregate = {};

  Object.values(latest).forEach(submission => {
    const weekGames = ctx.games.filter(g => g.week === submission.week);
    if (!weekGames.length) return;

    const scored = scoreSubmissionForWeek_(
      submission,
      weekGames,
      ctx.playerRegistry,
      ctx.resultLookup
    );

    if (!aggregate[submission.phone]) {
      aggregate[submission.phone] = {
        privateId: submission.phone,
        name: scored.publicName,
        points: 0,
        completedGames: 0,
        totalPicks: 0
      };
    }

    aggregate[submission.phone].points += scored.points;
    aggregate[submission.phone].completedGames += scored.completedGames;
    aggregate[submission.phone].totalPicks += scored.totalPicks;
  });

  let privateStandings = Object.values(aggregate);

  privateStandings.sort((a, b) =>
    b.points - a.points ||
    a.name.localeCompare(b.name)
  );

  const ranked = addRanks_(privateStandings);

  return {
    season: PP3.SEASON,
    standings: ranked.map(p => ({
      rank: p.rank,
      name: p.name,
      points: p.points,
      completedGames: p.completedGames,
      totalPicks: p.totalPicks
    }))
  };
}

function getPeriodStandings_(ctx, startWeek, endWeek) {
  const latest = getLatestSubmissionPerWeek_(ctx.responses, ctx.games);
  const aggregate = {};

  Object.values(latest)
    .filter(s => s.week >= startWeek && s.week <= endWeek)
    .forEach(submission => {
      const weekGames = ctx.games.filter(g => g.week === submission.week);
      if (!weekGames.length) return;

      const scored = scoreSubmissionForWeek_(
        submission,
        weekGames,
        ctx.playerRegistry,
        ctx.resultLookup
      );

      if (!aggregate[submission.phone]) {
        aggregate[submission.phone] = {
          name: scored.publicName,
          points: 0,
          completedGames: 0
        };
      }

      aggregate[submission.phone].points += scored.points;
      aggregate[submission.phone].completedGames += scored.completedGames;
    });

  const values = Object.values(aggregate).sort((a, b) =>
    b.points - a.points || a.name.localeCompare(b.name)
  );

  return addRanks_(values).map(p => ({
    rank: p.rank,
    name: p.name,
    points: p.points,
    completedGames: p.completedGames
  }));
}
