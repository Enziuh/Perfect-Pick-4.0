/* This adapter has exactly one input: the bundled synthetic fixture. */
(function (root) {
  'use strict';
  const APPROVED_ALIASES = Object.freeze(['Synthetic Comet', 'Synthetic Harbor', 'Synthetic Maple', 'Synthetic Orbit']);
  const fail = () => { throw new Error('Invalid synthetic fixture.'); };
  // Public labels are approved fixture constants, never arbitrary spreadsheet text.
  const labels = new Set(['', 'Week 5', '2026-10-01T12:00:00.000Z',
    '2099-10-01T23:00:00.000Z', '2099-10-01T22:00:00.000Z',
    'Synthetic example: 1 hour before first kickoff',
    ...Array.from({length:5},(_,i)=>`M${i+1}`),
    ...Array.from({length:5},(_,i)=>`Month ${i+1}`),
    ...Array.from({length:18},(_,i)=>`WK ${i+1} Tie Breaker — Chiefs vs Bills — Enter Combined Score`)]);
  const str = v => typeof v === 'string' && labels.has(v);
  const num = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10000;
  const bool = v => typeof v === 'boolean';
  const literal = x => v => v === x;
  const choice = (...xs) => v => xs.includes(v);
  const array = schema => v => Array.isArray(v) && v.length <= 100 && v.every(x => check(schema, x));
  const check = (schema, value) => typeof schema === 'function' ? schema(value) :
    value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === Object.keys(schema).length &&
    Object.keys(schema).every(k => Object.hasOwn(value, k) && check(schema[k], value[k]));
  const alias = choice(...APPROVED_ALIASES);
  const empty = v => Array.isArray(v) && v.length === 0;
  const score = v => v === '' || (num(v) && Number.isInteger(v));
  const team = choice('Bears', 'Lions', 'Chiefs', 'Bills');
  const game = choice('Bears vs Lions', 'Chiefs vs Bills');
  const status = choice('Pending', 'Final');
  const standing = {rank:num,name:alias,points:num,completedGames:num};
  const pick = {game,pick:team,winner:choice('', 'Tie','Bears','Lions','Chiefs','Bills'),status,correct:choice(true,false,null)};
  const player = {...standing,totalPicks:num,perfectWeek:bool,picks:array(pick),tiebreakSubmitted:bool,tiebreakPrediction:v=>typeof v==='string' && (v==='' || /^\d{1,3}$/.test(v)),tiebreakQuestion:str};
  const result = {game,team1:team,team2:team,winner:pick.winner,status,team1Score:score,team2Score:score};
  const outcome = {finalized:bool,status:choice('pending','winner','rollover'),perfectWinners:array(alias)};
  const tiebreak = {enabled:bool,revealed:bool,questionLabel:str,game:v=>v==='' || game(v),method:literal('Combined Points')};
  const weekSchema = {season:literal(2026),week:num,entriesStatus:choice('CLOSED','OPEN','UNKNOWN','UPCOMING'),games:array(game),results:array(result),outcome,tiebreak,standings:array(player)};
  const weekly = {week:num,periodKey:str,activePlayers:num,weeklyEntry:literal(5),weeklyPot:num,finalized:bool,perfectPickWinners:num,perfectPickWinnerNames:array(alias),perfectPayoutEach:num,rolloverToMonthly:num};
  const period = {periodKey:str,displayName:str,startWeek:num,endWeek:num,ruleMode:literal('NEW'),includeInSeason:bool,locked:bool,monthlyPot:num,monthlyWinnerPct:literal(50),monthlyWinnerPool:num,seasonPct:literal(50),seasonContribution:num,allWeeksFinalized:bool,leaders:array(alias),standings:array(standing),tiebreakRule:{week:num,questionLabel:str,game,actualTotal:score,status,method:literal('Combined Points')},estimatedMonthlyWinnings:empty,projectedMonthlyPayoutEach:literal(0),monthlyPayoutEach:literal(0)};
  const control = {activeWeek:num,section:str,firstGame:game,firstKickoff:str,picksClose:str,status:choice('OPEN','CLOSED','UNKNOWN','UPCOMING'),deadlineRule:str,updated:str};
  const prizes = {app:literal('Perfect Pick 4.0 — Synthetic Preview'),season:literal(2026),generatedAt:str,activeWeek:num,formControl:control,currentPeriod:str,currentPeriodName:str,currentRuleMode:literal('NEW'),currentWeeklyPot:num,currentWeekStandings:array(player),currentWeekFinalized:bool,currentWeekPerfectWinners:array(alias),currentMonthlyPot:num,currentMonthlyRolloverBreakdown:array({week:num,amount:num}),projectedMonthlyWinnerPool:num,currentProjectedSeasonContribution:num,currentPeriodStandings:array(standing),currentPeriodEstimatedWinnings:empty,confirmedSeasonPot:num,projectedSeasonPot:num,seasonPayoutPercents:literal(null),weekly:array(weekly),periods:array(period),overallStandings:array({...standing,totalPicks:num}),estimatedSeasonWinnings:empty};
  function validate(data) {
    if (!check({synthetic:literal(true),aliases:array(alias),prizes,weeks:array(weekSchema)},data)) fail();
    if (JSON.stringify(data.aliases)!==JSON.stringify(APPROVED_ALIASES) || data.weeks.length!==18 || data.prizes.weekly.length!==18 || data.prizes.periods.length!==5) fail();
    data.weeks.forEach((w,i) => {
      if(w.week!==i+1 || w.games.length!==2 || w.results.length!==2) fail();
      if(w.entriesStatus!=='CLOSED' && (w.standings.length || w.tiebreak.revealed || w.outcome.perfectWinners.length)) fail();
      if(!w.tiebreak.revealed && w.standings.some(p=>p.tiebreakPrediction!=='')) fail();
      if(w.standings.some(p=>p.points>p.completedGames || p.completedGames>p.totalPicks || p.totalPicks>2)) fail();
      if(new Set(w.results.map(r=>r.game)).size!==w.games.length || w.results.some(r=>!w.games.includes(r.game) || r.team1!==r.game.split(' vs ')[0] || r.team2!==r.game.split(' vs ')[1])) fail();
      if(new Set(w.standings.map(p=>p.name)).size!==w.standings.length) fail();
      for(const player of w.standings){
        if(player.picks.length!==player.totalPicks || new Set(player.picks.map(p=>p.game)).size!==player.picks.length) fail();
        if(player.picks.some(p=>!w.games.includes(p.game) || !p.game.split(' vs ').includes(p.pick))) fail();
      }
    });
    const active=data.weeks.find(w=>w.week===data.prizes.activeWeek);
    if(!active || data.prizes.formControl.activeWeek!==active.week || data.prizes.formControl.status!==active.entriesStatus || JSON.stringify(active.standings)!==JSON.stringify(data.prizes.currentWeekStandings)) fail();
    return data;
  }
  function buildMatchView(data, label, control = {}) {
    // Result and selection presentation only; scoring points/ranks are untouched.
    const teams = String(label).split(' vs ');
    const matches = (data.results || []).filter(r => r.game === label);
    const result = matches.length === 1 ? matches[0] : null;
    const winner = result?.status === 'Final' && [...teams,'Tie'].includes(result.winner) ? result.winner : '';
    const state = !result ? 'Unavailable' : result.status === 'Final' && !winner ? 'Final result unavailable' : result.status;
    const readScore = value => value !== '' && value !== null && value !== undefined &&
      /^(?:0|[1-9]\d*)$/.test(String(value)) ? String(value) : '';
    const kickoff = control.activeWeek === data.week && control.firstGame === label &&
      typeof control.firstKickoff === 'string' && !Number.isNaN(Date.parse(control.firstKickoff)) ? control.firstKickoff : '';
    const model = {game:label,teams,status:state,winner,isFinal:Boolean(winner),kickoff,
      scores:[readScore(result?.team1Score),readScore(result?.team2Score)],votes:null,selections:[]};
    // Stop before touching any selection-bearing fields when closure is unconfirmed.
    if (data.entriesStatus !== 'CLOSED') return model;
    const rows = data.standings || [];
    const names = rows.map(p => p.name);
    if (new Set(names).size !== names.length || names.some(name => !APPROVED_ALIASES.includes(name))) return model;
    model.selections = rows.flatMap(player => {
      const picks = (player.picks || []).filter(p => p.game === label);
      if (picks.length !== 1 || !teams.includes(picks[0].pick)) return [];
      const selected = picks[0].pick;
      return [{name:player.name,pick:selected,state:!winner ? 'pending' : selected === winner ? 'correct' : 'wrong'}];
    });
    const total = model.selections.length;
    const counts = teams.map(team => model.selections.filter(p => p.pick === team).length);
    const first = total ? Math.round(counts[0]/total*1000)/10 : 0;
    model.votes = {total,teams:teams.map((team,index) => ({team,count:counts[index],
      percentage:total ? (index === 0 ? first : Math.round((100-first)*10)/10) : 0}))};
    return model;
  }

  function parseCombinedPrediction(value) {
    // Blank, whitespace, booleans and numeric coercion must never become zero.
    if (typeof value !== 'string' || !/^\d{1,3}$/.test(value)) return null;
    return Number(value);
  }

  function finalScore(result) {
    const read = value => {
      if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);
      return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
    };
    if (!result || result.status !== 'Final') return null;
    const first = read(result.team1Score), second = read(result.team2Score);
    if (first === null || second === null || !Number.isSafeInteger(first + second)) return null;
    const winner = first === second ? 'Tie' : first > second ? result.team1 : result.team2;
    return result.winner === winner ? first + second : null;
  }

  function resolveMonthlyChampion(period, weeks) {
    // Pure presentation result: no mutation, rank changes, payment or service calls.
    const base = {status:'IN PROGRESS',reason:'Competition data is incomplete.',winner:null,
      points:null,leaders:[],game:'',actualTotal:null,comparisons:[],winningDifference:null,margin:null};
    const result = (status, reason, details = {}) => ({...base,status,reason,...details});
    if (!period || !Number.isInteger(period.startWeek) || !Number.isInteger(period.endWeek) ||
        period.startWeek < 1 || period.endWeek > 18 || period.startWeek > period.endWeek || !Array.isArray(weeks)) return base;
    const periodWeeks = [];
    for (let week = period.startWeek; week <= period.endWeek; week++) {
      const found = weeks.filter(w => w.week === week);
      if (found.length !== 1) return base;
      periodWeeks.push(found[0]);
    }
    // No predictions, participation details or champion confirmation before closure.
    if (periodWeeks.some(w => w.entriesStatus !== 'CLOSED')) {
      return result('IN PROGRESS','Entries must be explicitly CLOSED for every applicable week. Predictions remain private.');
    }
    const standings = period.standings;
    if (!Array.isArray(standings) || !standings.length ||
        standings.some(p => !APPROVED_ALIASES.includes(p.name) || !Number.isSafeInteger(p.points) || p.points < 0 ||
          !Number.isSafeInteger(p.completedGames) || p.points > p.completedGames || p.completedGames < 0) ||
        new Set(standings.map(p => p.name)).size !== standings.length) return base;
    const points = Math.max(...standings.map(p => p.points));
    const leaders = standings.filter(p => p.points === points).map(p => p.name).sort();
    const context = {points,leaders};
    const game = period.tiebreakRule?.game || '';
    const lastWeek = periodWeeks[periodWeeks.length - 1];
    const games = [];
    for (const week of periodWeeks) {
      if (!Array.isArray(week.games) || !week.games.length || new Set(week.games).size !== week.games.length || !Array.isArray(week.results)) return base;
      for (const label of week.games) {
        const found = week.results.filter(r => r.game === label);
        games.push({week:week.week,game:label,score:found.length === 1 ? finalScore(found[0]) : null});
      }
    }
    const unfinished = games.filter(g => g.score === null);
    if (unfinished.length) {
      const onlyTiebreak = unfinished.length === 1 && unfinished[0].week === period.endWeek && unfinished[0].game === game;
      return result(onlyTiebreak ? 'AWAITING FINAL SCORE' : 'IN PROGRESS',
        onlyTiebreak ? 'The designated game needs a valid FINAL score. First place is not confirmed yet.' : 'Required monthly game results are not all FINAL.',context);
    }
    if (period.allWeeksFinalized !== true || periodWeeks.some(w => w.outcome?.finalized !== true)) {
      return result('IN PROGRESS','Monthly completion has not been confirmed.',context);
    }
    if (!standings.some(p => p.completedGames > 0)) return result('IN PROGRESS','No completed FINAL games are available for the standings.',context);
    // Guard stale monthly aggregates without recalculating or altering ranking rules.
    const totals = new Map();
    for (const week of periodWeeks) {
      if (!Array.isArray(week.standings) || new Set(week.standings.map(p => p.name)).size !== week.standings.length) return base;
      for (const player of week.standings) {
        if (!APPROVED_ALIASES.includes(player.name) || !Number.isSafeInteger(player.points) || !Number.isSafeInteger(player.completedGames) || player.points < 0 || player.completedGames < player.points) return base;
        const sum = totals.get(player.name) || {points:0,completedGames:0};
        totals.set(player.name,{points:sum.points+player.points,completedGames:sum.completedGames+player.completedGames});
      }
    }
    if (totals.size !== standings.length || standings.some(p => totals.get(p.name)?.points !== p.points || totals.get(p.name)?.completedGames !== p.completedGames)) {
      return result('IN PROGRESS','Monthly and weekly standings need reconciliation.',context);
    }
    if (leaders.length === 1) {
      return result('MONTHLY CHAMPION','Highest monthly points after all required results were finalized. No tiebreaker was needed.',{...context,winner:leaders[0]});
    }
    if (!game || period.tiebreakRule?.week !== period.endWeek || period.tiebreakRule?.method !== 'Combined Points' ||
        lastWeek.tiebreak?.game !== game || lastWeek.tiebreak?.enabled !== true || lastWeek.tiebreak?.revealed !== true) {
      return result('IN PROGRESS','The designated tiebreaker and public prediction availability need confirmation.',context);
    }
    const designated = games.filter(g => g.week === period.endWeek && g.game === game);
    if (designated.length !== 1) return result('AWAITING FINAL SCORE','The designated FINAL game could not be uniquely verified.',context);
    const actualTotal = designated[0].score;
    const comparisons = leaders.map(name => {
      const rows = lastWeek.standings.filter(p => p.name === name);
      const prediction = rows.length === 1 ? parseCombinedPrediction(rows[0].tiebreakPrediction) : null;
      return {name,eligible:prediction !== null,prediction,difference:prediction === null ? null : Math.abs(prediction-actualTotal)};
    });
    const details = {...context,game,actualTotal,comparisons};
    const eligible = comparisons.filter(p => p.eligible);
    if (!eligible.length) return result('NO ELIGIBLE TIEBREAKER','All tied leaders have missing or invalid predictions. Manual decision required; no champion or payout is awarded.',details);
    const minimum = Math.min(...eligible.map(p => p.difference));
    const closest = eligible.filter(p => p.difference === minimum);
    if (closest.length > 1) return result('UNRESOLVED TIE','Equally close valid predictions. Manual decision required; no champion or payout is awarded.',details);
    const next = eligible.filter(p => p !== closest[0]);
    const margin = next.length ? Math.min(...next.map(p => p.difference))-minimum : null;
    return result('MONTHLY CHAMPION',margin === null
      ? 'The only eligible prediction among players tied for first place.'
      : 'The uniquely closest valid prediction among players tied for first place.',
      {...details,winner:closest[0].name,winningDifference:minimum,margin});
  }

  // Presentation only: allocations are not payment confirmations.
  function buildWeeklyPrize(row, week) {
    const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    const closed = week?.entriesStatus === 'CLOSED';
    const final = closed && row?.week === week.week && row?.finalized === true && week?.outcome?.finalized === true &&
      week.results.length === week.games.length && week.results.length > 0 && week.results.every(game => finalScore(game) !== null);
    const names = final && Array.isArray(row.perfectPickWinnerNames) &&
      row.perfectPickWinnerNames.every(name => APPROVED_ALIASES.includes(name)) &&
      JSON.stringify([...row.perfectPickWinnerNames].sort()) === JSON.stringify([...(week.outcome.perfectWinners || [])].sort())
      ? row.perfectPickWinnerNames : [];
    const rollover = final && !names.length && week.outcome.perfectWinners?.length === 0 && row.perfectPickWinnerNames?.length === 0 && row.rolloverToMonthly === row.weeklyPot
      ? amount(row.rolloverToMonthly) : null;
    return {pool:amount(row?.weeklyPot), status:final ? (names.length ? 'WINNERS CONFIRMED' : rollover !== null ? 'ROLLOVER CONFIRMED' : 'ALLOCATION UNCONFIRMED') : 'PROJECTED · RESULTS PENDING',
      winners:names, allocationEach:names.length ? amount(row.perfectPayoutEach) : null, rollover,
      payment:'Payment status unavailable'};
  }

  let pending;
  async function fixture() {
    if (!pending) pending = (async () => {
      const response = await root.fetch('./fixtures/preview.json', {cache:'no-store',redirect:'error',credentials:'omit'});
      if (!response.ok) throw new Error('Synthetic fixture unavailable.');
      return validate(await response.json());
    })();
    return pending;
  }
  async function get(action, extra='') {
    const data=await fixture();
    if(action==='prizes') return structuredClone(data.prizes);
    if(action==='week' && /^&week=(?:[1-9]|1[0-8])$/.test(extra)) return structuredClone(data.weeks[Number(extra.slice(6))-1]);
    throw new Error('Unsupported synthetic resource.');
  }
  const api=Object.freeze({get,validate,buildMatchView,buildWeeklyPrize,resolveMonthlyChampion,APPROVED_ALIASES});
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else Object.defineProperty(root,'PerfectPickPreview',{value:api,writable:false,configurable:false});
})(globalThis);
