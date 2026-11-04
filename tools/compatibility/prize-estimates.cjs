'use strict';
const {cents}=require('./legacy-prize-facts.cjs');
// Pool budgets only: the owner's assumed count never affects actual player scores.
function estimatePrizes(snapshot,facts,participants){
 if(!Number.isInteger(participants)||participants<1||participants>1000)throw Error('Invalid assumed participant count');
 const basis={kind:'ASSUMED_NOT_COLLECTED',participantsPerWeek:participants},weekly=new Map(),periods=new Map();
 const prize=(key,amount)=>({key,currency:'USD',poolCents:amount,poolState:amount===null?'UNAVAILABLE':'PROJECTED',allocationState:'UNAVAILABLE',paymentState:'UNKNOWN',estimateBasis:{...basis}});
 for(const w of snapshot.weeks){
  const raw=facts.weekly.find(r=>r.week===w.week),rules=facts.periods.filter(p=>w.week>=p.startWeek&&w.week<=p.endWeek);if(!raw||rules.length!==1)throw Error('Missing prize rules');
  const entry=cents(raw.weeklyEntry);if(entry===null)throw Error('Missing entry rule');const amount=entry*participants;if(!Number.isSafeInteger(amount))throw Error('Invalid estimated amount');
  const p=prize('W'+w.week,amount),games=snapshot.games.filter(g=>g.week===w.week),table=snapshot.standings.find(s=>s.key===p.key);
  const final=games.length>0&&games.every(g=>g.status==='FINAL');
  p.estimatedRolloverCents=null;
  if(final&&table?.state==='AVAILABLE')p.estimatedRolloverCents=rules[0].ruleMode==='NEW'&&!table.rows.some(r=>r.points===games.length&&r.completedGames===games.length&&r.totalPicks===games.length)?amount:0;
  weekly.set(w.week,p);
 }
 for(const rule of facts.periods){
  const span=Array.from({length:rule.endWeek-rule.startWeek+1},(_,i)=>rule.startWeek+i);let total=0,known=true;
  for(const week of span){const p=weekly.get(week);if(!p)throw Error('Incomplete period');const final=snapshot.games.filter(g=>g.week===week).every(g=>g.status==='FINAL');if(final){if(p.estimatedRolloverCents===null)known=false;else total+=p.estimatedRolloverCents;}}
  const monthly=cents(rule.monthlyWinnerPct),season=cents(rule.seasonPct);if(monthly===null||season===null||monthly+season>10000)throw Error('Invalid allocation shares');
  const amount=!known?null:rule.ruleMode==='NEW'?Math.round(total*monthly/10000):0,p=prize(rule.periodKey,amount);
  if(known)p.funding={rolloverCents:total,monthlyPrizeCents:amount,seasonContributionCents:rule.ruleMode==='NEW'&&rule.includeInSeason?Math.round(total*season/10000):0,monthlyShareBasisPoints:monthly,seasonShareBasisPoints:season};
  periods.set(rule.periodKey,p);
 }
 const all=[...periods.values()],season=prize('S'+snapshot.season,all.every(p=>p.funding)?all.reduce((n,p)=>n+p.funding.seasonContributionCents,0):null);if(season.poolCents!==null)season.projectedPoolCents=season.poolCents;
 return snapshot.prizes.map(p=>p.key[0]==='W'?weekly.get(Number(p.key.slice(1))):p.key[0]==='M'?periods.get(p.key):season);
}
module.exports={estimatePrizes};
