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
  const score = v => v === '' || num(v);
  const team = choice('Bears', 'Lions', 'Chiefs', 'Bills');
  const game = choice('Bears vs Lions', 'Chiefs vs Bills');
  const status = choice('Pending', 'Final');
  const standing = {rank:num,name:alias,points:num,completedGames:num};
  const pick = {game,pick:team,winner:choice('', 'Tie','Bears','Lions','Chiefs','Bills'),status,correct:choice(true,false,null)};
  const player = {...standing,totalPicks:num,perfectWeek:bool,picks:array(pick),tiebreakSubmitted:bool,tiebreakPrediction:v=>v==='' || /^\d{1,3}$/.test(v),tiebreakQuestion:str};
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
    });
    const active=data.weeks.find(w=>w.week===data.prizes.activeWeek);
    if(!active || data.prizes.formControl.activeWeek!==active.week || data.prizes.formControl.status!==active.entriesStatus || JSON.stringify(active.standings)!==JSON.stringify(data.prizes.currentWeekStandings)) fail();
    return data;
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
  const api=Object.freeze({get,validate,APPROVED_ALIASES});
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else Object.defineProperty(root,'PerfectPickPreview',{value:api,writable:false,configurable:false});
})(globalThis);
