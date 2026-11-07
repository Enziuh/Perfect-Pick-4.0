'use strict';
// Pure server-side boundary. No I/O, endpoint, native service, private-identity join or publication.
const {validatePublic,comparePublic}=require('../contracts/live-contract.cjs');
const {formEntry}=require('./form-entry.cjs');
const NAMES={ARI:'Cardinals',ATL:'Falcons',BAL:'Ravens',BUF:'Bills',CAR:'Panthers',CHI:'Bears',CIN:'Bengals',CLE:'Browns',DAL:'Cowboys',DEN:'Broncos',DET:'Lions',GB:'Packers',HOU:'Texans',IND:'Colts',JAX:'Jaguars',KC:'Chiefs',LAC:'Chargers',LAR:'Rams',LV:'Raiders',MIA:'Dolphins',MIN:'Vikings',NE:'Patriots',NO:'Saints',NYG:'Giants',NYJ:'Jets',PHI:'Eagles',PIT:'Steelers',SEA:'Seahawks',SF:'49ers',TB:'Buccaneers',TEN:'Titans',WAS:'Commanders'};
const dollars=n=>typeof n==='number'?n/100:null;
function createDashboardModel(candidate,trust,context){
 validatePublic(candidate,trust);
 if(candidate.state!=='READY'||!context||!candidate.weeks.some(w=>w.week===context.activeWeek))throw Error('Dashboard unavailable');
 const s=JSON.parse(JSON.stringify(candidate)),byGame=new Map(s.games.map(g=>[g.game,g])),byScope=new Map(s.standings.map(t=>[t.key,t])),byPrize=new Map(s.prizes.map(p=>[p.key,p]));
 const aliases=new Map([...trust.aliases]);
 const label=g=>NAMES[g.home]+' vs '+NAMES[g.away];
 const rows=key=>(byScope.get(key)?.rows||[]).map(r=>({name:r.alias,rank:r.rank,points:r.points,completedGames:r.completedGames,totalPicks:r.totalPicks??null}));
 const freshEntry=entry=>entry.authority==='OFFICIAL'&&Date.parse(entry.checkedAt)<=trust.now&&trust.now-Date.parse(entry.checkedAt)<=trust.maxAgeMs&&Date.parse(entry.validUntil)>trust.now;
 const final=week=>s.games.filter(g=>g.week===week).length>0&&s.games.filter(g=>g.week===week).every(g=>g.status==='FINAL');
 const weeks=s.weeks.slice().sort((a,b)=>a.week-b.week).map(w=>{
  const table=byScope.get('W'+w.week),deadlineVisible=Boolean(trust.deadlineDisclosures?.has(w.week)&&require('../disclosure/weekly-deadline.cjs').permitted(trust,w.week,s)),available=(w.entry.status==='CLOSED'||deadlineVisible)&&table?.state==='AVAILABLE'&&Array.isArray(w.picks)&&Array.isArray(w.votes);
  const m=s.months.find(m=>m.endWeek===w.week),designated=m?.designatedGame?byGame.get(m.designatedGame):null;
  return {...(deadlineVisible?{disclosureMode:'DEADLINE_PASSED'}:{}),season:s.season,week:w.week,entriesStatus:freshEntry(w.entry)?w.entry.status:'UNKNOWN',visibility:available?'AVAILABLE':'WITHHELD',
   games:s.games.filter(g=>g.week===w.week).map(label),results:s.games.filter(g=>g.week===w.week).map(g=>({game:label(g),team1:NAMES[g.home],team2:NAMES[g.away],status:g.status==='FINAL'?'Final':g.status==='IN_PROGRESS'?'In progress':g.status==='SCHEDULED'?'Scheduled':'Pending',winner:g.winner==='HOME'?NAMES[g.home]:g.winner==='AWAY'?NAMES[g.away]:g.winner==='TIE'?'Tie':'',team1Score:g.homeScore??'',team2Score:g.awayScore??''})),
   outcome:{finalized:final(w.week),perfectWinners:[]},tiebreak:{enabled:Boolean(designated),revealed:available,game:designated?label(designated):'',method:'Combined Points'},
   standings:available?rows('W'+w.week).map(r=>{const p=w.picks.find(p=>p.alias===r.name);return {...r,picks:(p?.selections||[]).map(p=>({game:label(byGame.get(p.game)),pick:NAMES[p.team]||'',...(p.eligibility?{eligibility:p.eligibility}:{})})),tiebreakEligibility:p?.prediction?.eligibility||null,tiebreakTimingUnverified:p?.prediction?.eligibility==='UNVERIFIED_CUTOFF',tiebreakPrediction:p?.prediction?.total==null?'':String(p.prediction.total)};}):[]};
 });
 const matchViews={};
 for(const week of weeks){const w=s.weeks.find(w=>w.week===week.week);matchViews[week.week]={};for(const g of s.games.filter(g=>g.week===week.week)){
  const winner=g.winner==='HOME'?NAMES[g.home]:g.winner==='AWAY'?NAMES[g.away]:g.winner==='TIE'?'Tie':'';
  const vote=week.visibility==='AVAILABLE'?w.votes.find(v=>v.game===g.game):null;
  const selections=week.visibility==='AVAILABLE'?w.picks.flatMap(p=>p.selections.filter(p=>p.game===g.game).map(pick=>({name:p.alias,pick:NAMES[pick.team]||'',state:pick.eligibility==='MISSED_DEADLINE'?'missed':pick.eligibility==='UNVERIFIED_CUTOFF'?'unverified':pick.team===null?'no-selection':g.status!=='FINAL'?'pending':NAMES[pick.team]===winner?'correct':'wrong'}))):[];
  matchViews[week.week][label(g)]={game:label(g),teams:[NAMES[g.home],NAMES[g.away]],status:week.results.find(r=>r.game===label(g)).status,winner,isFinal:g.status==='FINAL',kickoff:g.kickoff||'',scores:[g.homeScore==null?'':String(g.homeScore),g.awayScore==null?'':String(g.awayScore)],votes:vote?{total:vote.total,teams:vote.teams.map(t=>({team:NAMES[t.team],count:t.count,percentage:t.basisPoints/100}))}:null,selections};
 }}
 const resolutions={},periods=s.months.map(m=>{
  const table=byScope.get(m.key),p=byPrize.get(m.key),leaderPoints=table?.state==='AVAILABLE'&&table.rows.length?Math.max(...table.rows.map(r=>r.points)):null;
  const comparisons=(m.comparisons||[]).map(c=>({name:aliases.get(c.player),eligible:c.prediction!==null,prediction:c.prediction,difference:c.difference}));
  const eligible=comparisons.filter(c=>c.eligible).sort((a,b)=>a.difference-b.difference),winning=m.winner?comparisons.find(c=>c.name===aliases.get(m.winner)):null;
  resolutions[m.key]={status:m.state,reason:m.method==='POINTS'?'Highest monthly points after finalized results.':m.method==='COMBINED_POINTS'?(m.winner?'Uniquely closest eligible prediction among points leaders.':'Manual decision required; no champion payout confirmed.'):'Required closure, completion or final-score evidence is unavailable.',winner:m.winner?aliases.get(m.winner):null,points:leaderPoints,leaders:table?.state==='AVAILABLE'?table.rows.filter(r=>r.points===leaderPoints).map(r=>r.alias):[],game:m.designatedGame?label(byGame.get(m.designatedGame)):'',actualTotal:m.actualTotal,comparisons,winningDifference:winning?.difference??null,margin:winning&&eligible.length>1?eligible[1].difference-eligible[0].difference:null};
  return {periodKey:m.key,displayName:'Period '+m.key,startWeek:m.startWeek,endWeek:m.endWeek,allWeeksFinalized:m.competitionComplete&&s.games.filter(g=>g.week>=m.startWeek&&g.week<=m.endWeek).every(g=>g.status==='FINAL'),standings:rows(m.key),ruleMode:'Verified contract',poolState:p?.poolState||'UNAVAILABLE',paymentState:p?.paymentState||'UNKNOWN',estimateBasis:p?.estimateBasis||null,monthlyPot:dollars(p?.funding?.rolloverCents),monthlyWinnerPool:dollars(p?.poolCents),monthlyWinnerPct:p?.funding? p.funding.monthlyShareBasisPoints/100:null,seasonPct:p?.funding?p.funding.seasonShareBasisPoints/100:null,seasonContribution:dollars(p?.funding?.seasonContributionCents)};
 });
 const prizeViews={},weekly=weeks.map(w=>{
  const p=byPrize.get('W'+w.week),estimated=Boolean(p?.estimateBasis),confirmed=p?.allocationState==='CONFIRMED',allocations=confirmed?p.allocations:[],winners=estimated&&w.visibility==='AVAILABLE'&&w.outcome.finalized?w.standings.filter(r=>r.points===w.games.length&&r.completedGames===w.games.length&&r.totalPicks===w.games.length).map(r=>r.name):allocations.map(a=>aliases.get(a.player));
  prizeViews[w.week]={pool:dollars(p?.poolCents),estimateBasis:p?.estimateBasis||null,status:estimated?'ESTIMATE · NOT COLLECTED':confirmed?(winners.length?'WINNERS CONFIRMED':p.rollover?'ROLLOVER CONFIRMED':'ALLOCATION CONFIRMED'):(p?.poolState||'UNAVAILABLE')+' · ALLOCATION PENDING',winners,allocationEach:allocations.length&&allocations.every(a=>a.cents===allocations[0].cents)?dollars(allocations[0].cents):null,rollover:estimated?dollars(p.estimatedRolloverCents):p?.rollover?dollars(p.rollover.cents):null,payment:p?.paymentState==='UNKNOWN'?'Payment status unavailable':p?.paymentState==='PAID'?'Paid per verified ledger':p?.paymentState==='UNPAID'?'Unpaid per verified ledger':'Payment status unavailable'};
  return {week:w.week,periodKey:periods.find(p=>w.week>=p.startWeek&&w.week<=p.endWeek)?.periodKey||'',activePlayers:w.visibility==='AVAILABLE'?w.standings.length:null,finalized:final(w.week)};
 });
 const current=weeks.find(w=>w.week===context.activeWeek),official=s.weeks.find(w=>w.week===context.activeWeek),period=periods.find(p=>current.week>=p.startWeek&&current.week<=p.endWeek),season=byPrize.get('S'+s.season);
 const prizes={scoringBasis:s.scoringBasis,lateEntryStartWeek:s.lateEntryStartWeek??null,estimateBasis:season?.estimateBasis||null,season:s.season,generatedAt:s.generatedAt,activeWeek:current.week,formControl:{activeWeek:current.week,status:current.entriesStatus,picksClose:official.entry.deadline,firstGame:'',firstKickoff:'',deadlineRule:'Official deadline; closure is independently verified'},currentPeriod:period?.periodKey||'',currentPeriodName:period?.displayName||'Unavailable',currentWeekStandings:current.standings,currentWeeklyPot:prizeViews[current.week].pool,currentMonthlyPot:period?.monthlyPot??null,projectedMonthlyWinnerPool:period?.monthlyWinnerPool??null,currentProjectedSeasonContribution:period?.seasonContribution??null,currentMonthlyRolloverBreakdown:[],confirmedSeasonPot:season?.poolState==='CONFIRMED'?dollars(season.poolCents):null,projectedSeasonPot:dollars(season?.projectedPoolCents),weekly,periods,overallStandings:rows('S'+s.season)};
 const expiresAt=Math.min(Date.parse(s.generatedAt)+trust.maxAgeMs,...s.games.map(g=>Date.parse(g.verifiedAt)+trust.maxAgeMs),...s.weeks.filter(w=>freshEntry(w.entry)).flatMap(w=>[Date.parse(w.entry.validUntil),Date.parse(w.entry.checkedAt)+trust.maxAgeMs]));
 prizes.seasonCoverage=byScope.get('S'+s.season)?.weeks.join(', ')||'';
 return {expiresAt,prizes,weeks,matchViews,prizeViews,resolutions,form:formEntry(context.form,JSON.stringify(trust.closures.get(official.week))===JSON.stringify(official.entry)?official.entry:null,trust.now,trust.maxAgeMs)};
}
// Runs in private owner-preview assembly only, never in the public six-file adapter.
function createViewAdapter(model,clock){
 const check=()=>{if(!model||clock()>=model.expiresAt){model=null;throw Error('Verified snapshot unavailable or expired');}};
 const copy=v=>JSON.parse(JSON.stringify(v));
 return Object.freeze({kind:'owner-contract',get:async(action,extra='')=>{check();if(action==='prizes')return copy(model.prizes);if(action==='week'&&/^&week=(?:[1-9]|1[0-8])$/.test(extra)){const week=model.weeks.find(w=>w.week===Number(extra.slice(6)));if(week)return copy(week);}throw Error('Resource unavailable');},
  buildMatchView:(week,label)=>{check();return copy(model.matchViews[week.week]?.[label]||{});},buildWeeklyPrize:row=>{check();return copy(model.prizeViews[row.week]);},
  resolveMonthlyChampion:(period,weeks)=>{check();if(!weeks.length)return {status:'IN PROGRESS',reason:'Checking validated monthly decision.',winner:null,points:null,leaders:[],game:'',actualTotal:null,comparisons:[],winningDifference:null,margin:null};return copy(model.resolutions[period.periodKey]);}});
}
function compareDashboard(actual,baseline,trust,options){return comparePublic(actual,baseline,trust,options);}
module.exports={createDashboardModel,createViewAdapter,compareDashboard,TEAM_NAMES:NAMES};
