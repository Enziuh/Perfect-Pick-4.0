'use strict';
const {safeAlias}=require('../compatibility/pp3-display-name.cjs');
// Offline executable specification only. No I/O, backend service or browser adapter.
const VERSION='pp4-public/1';
const TEAMS=new Set('ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN NE NO NYG NYJ PHI PIT SEA SF TB TEN WAS'.split(' '));
const fail=()=>{throw new Error('Invalid public contract');};
const need=value=>{if(!value)fail();};
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const object=(value,required,optional=[])=>{
 need(value!==null&&typeof value==='object'&&!Array.isArray(value));
 need([Object.prototype,null].includes(Object.getPrototypeOf(value)));
 const keys=Reflect.ownKeys(value);need(required.every(k=>Object.prototype.hasOwnProperty.call(value,k))&&keys.every(k=>required.includes(k)||optional.includes(k)));
};
const list=(value,max=1000)=>{need(Array.isArray(value)&&value.length<=max&&Reflect.ownKeys(value).length===value.length+1);for(let i=0;i<value.length;i++)need(Object.prototype.hasOwnProperty.call(value,i));return value;};
const unique=values=>need(new Set(values).size===values.length);
const time=value=>{need(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value));const ms=Date.parse(value);need(Number.isFinite(ms)&&new Date(ms).toISOString()===value);return ms;};
const week=value=>need(Number.isInteger(value)&&value>=1&&value<=18);
const nullableTime=value=>{if(value!==null)time(value);};
const key=value=>need(typeof value==='string'&&/^[pg]_[a-z0-9]{8,32}$/.test(value));
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const sorted=values=>[...values].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
const scopeKey=value=>need(typeof value==='string'&&/^(W(?:[1-9]|1[0-8])|M[1-9][0-9]?|S[0-9]{4})$/.test(value));
function normalizeScore(value){
 if(value===null||value===undefined||value==='')return null;
 if(typeof value==='string'){value=value.trim();if(value==='')return null;need(/^\d+$/.test(value));value=Number(value);}
 need(integer(value));return value;
}
function validatePublicInternal(snapshot,trust){
 // Trust is injected by a future server, never supplied by a browser/request DTO.
 need(trust&&integer(trust.now)&&integer(trust.maxAgeMs)&&trust.maxAgeMs>0&&trust.aliases instanceof Map&&trust.closures instanceof Map&&trust.prizes instanceof Map&&trust.aliasCompleteness instanceof Map);
 object(snapshot,['version','revision','generatedAt','state'],snapshot.state==='READY'?['season','scoringBasis','weeks','games','standings','months','prizes','lateEntryStartWeek','accuracy']:['reason']);
 need(snapshot.version===VERSION&&integer(snapshot.revision));
 const generated=time(snapshot.generatedAt);need(generated<=trust.now&&trust.now-generated<=trust.maxAgeMs);
 if(snapshot.state==='UNAVAILABLE'){
  need(['STALE','UNVERIFIED','INVALID_RESULTS','MISSING_ALIAS','INCONSISTENT'].includes(snapshot.reason));return snapshot;
 }
 need(snapshot.state==='READY');
 if(snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS')need(Number.isInteger(snapshot.lateEntryStartWeek)&&snapshot.lateEntryStartWeek>=1&&snapshot.lateEntryStartWeek<=18);else need(!Object.prototype.hasOwnProperty.call(snapshot,'lateEntryStartWeek'));
 for(const field of ['season','scoringBasis','weeks','games','standings','months','prizes'])need(Object.prototype.hasOwnProperty.call(snapshot,field));
 need(Number.isInteger(snapshot.season)&&snapshot.season>=2000&&snapshot.season<=2200&&['SUBMITTED_FINAL_PICKS','ELIGIBLE_SUBMITTED_FINAL_PICKS'].includes(snapshot.scoringBasis));
 const fresh=value=>{const t=time(value);need(t<=generated&&trust.now-t<=trust.maxAgeMs);};
 const approved=row=>{key(row.player);need(row.player.startsWith('p_')&&trust.aliases.get(row.player)===row.alias&&safeAlias(row.alias));};
 const weeks=new Map();
 for(const w of list(snapshot.weeks,18)){
  object(w,['week','entry'],['picks','votes']);week(w.week);need(!weeks.has(w.week));weeks.set(w.week,w);
  object(w.entry,['status','authority','revision','checkedAt','validUntil','deadline']);
  need(['OPEN','CLOSED','UNKNOWN','UPCOMING'].includes(w.entry.status)&&['OFFICIAL','UNVERIFIED'].includes(w.entry.authority)&&integer(w.entry.revision));
  time(w.entry.checkedAt);time(w.entry.validUntil);nullableTime(w.entry.deadline);
  need(time(w.entry.checkedAt)<=generated&&time(w.entry.validUntil)>=time(w.entry.checkedAt));
  const evidence=trust.closures.get(w.week);
  if(w.entry.status==='CLOSED'){
   need(w.entry.authority==='OFFICIAL'&&evidence&&same(w.entry,evidence));fresh(w.entry.checkedAt);need(trust.now<time(w.entry.validUntil));
  }
  if(w.entry.status!=='CLOSED'&&!(trust.deadlineDisclosures?.has(w.week)&&require('../disclosure/weekly-deadline.cjs').permitted(trust,w.week,snapshot)))need(!Object.prototype.hasOwnProperty.call(w,'picks')&&!Object.prototype.hasOwnProperty.call(w,'votes'));
 }
 need(weeks.size>0);
 const games=new Map();
 for(const g of list(snapshot.games,400)){
  object(g,['game','week','home','away','kickoff','status','homeScore','awayScore','winner','verifiedAt']);key(g.game);need(g.game.startsWith('g_')&&!games.has(g.game));games.set(g.game,g);week(g.week);need(weeks.has(g.week));
  need(TEAMS.has(g.home)&&TEAMS.has(g.away)&&g.home!==g.away);nullableTime(g.kickoff);fresh(g.verifiedAt);
  need(['SCHEDULED','IN_PROGRESS','PENDING','FINAL'].includes(g.status));
  need((g.homeScore===null||integer(g.homeScore))&&(g.awayScore===null||integer(g.awayScore)));
  if(g.status==='FINAL'){
   need(integer(g.homeScore)&&integer(g.awayScore)&&integer(g.homeScore+g.awayScore));
   need(g.winner===(g.homeScore===g.awayScore?'TIE':g.homeScore>g.awayScore?'HOME':'AWAY'));
  }else need(g.winner===null);
 }
 const closed=ws=>ws.every(n=>weeks.get(n)?.entry.status==='CLOSED'||trust.deadlineDisclosures?.has(n)&&require('../disclosure/weekly-deadline.cjs').permitted(trust,n,snapshot));
 const final=ws=>{const rows=[...games.values()].filter(g=>ws.includes(g.week));return ws.every(n=>rows.some(g=>g.week===n))&&rows.every(g=>g.status==='FINAL');};
 for(const w of weeks.values()){
  if(w.picks!==undefined||w.votes!==undefined)need(trust.aliasCompleteness.get(w.week)===true);
  if(w.picks!==undefined){
   const players=list(w.picks);unique(players.map(p=>p.player));
   for(const p of players){
    object(p,['player','alias','selections'],['prediction']);approved(p);
    const selections=list(p.selections,32);unique(selections.map(s=>s.game));if(snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS'&&w.week>=snapshot.lateEntryStartWeek)need(selections.length===[...games.values()].filter(g=>g.week===w.week).length);
    for(const s of selections){object(s,['game','team'],snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS'?['eligibility']:[]);const g=games.get(s.game);need(g&&g.week===w.week&&([g.home,g.away].includes(s.team)||snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS'&&w.week>=snapshot.lateEntryStartWeek&&s.team===null));if(snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS')need((w.week<snapshot.lateEntryStartWeek?['LEGACY']:['ELIGIBLE','MISSED_DEADLINE','UNVERIFIED_CUTOFF']).includes(s.eligibility));}
    if(p.prediction!==undefined){object(p.prediction,['game','total'],snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS'?['eligibility']:[]);if(snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS')need((w.week<snapshot.lateEntryStartWeek?['LEGACY']:['ELIGIBLE','MISSED_DEADLINE','UNVERIFIED_CUTOFF']).includes(p.prediction.eligibility)&&(['ELIGIBLE','LEGACY'].includes(p.prediction.eligibility)||p.prediction.total===null));const g=games.get(p.prediction.game);need(g&&g.week===w.week&&(p.prediction.total===null||integer(p.prediction.total)));}
   }
  }
  if(w.votes!==undefined){
   const votes=list(w.votes,32);unique(votes.map(v=>v.game));need(w.picks!==undefined);
   for(const v of votes){
    object(v,['game','total','teams']);const g=games.get(v.game);need(g&&g.week===w.week&&integer(v.total));
    list(v.teams,2);need(v.teams.length===2);unique(v.teams.map(t=>t.team));
    const counts=[g.home,g.away].map(team=>w.picks.reduce((sum,p)=>sum+Number(p.selections.some(s=>s.game===g.game&&s.team===team&&(snapshot.scoringBasis!=='ELIGIBLE_SUBMITTED_FINAL_PICKS'||['ELIGIBLE','LEGACY'].includes(s.eligibility)))),0));
    need(v.total===counts[0]+counts[1]);
    for(const t of v.teams){object(t,['team','count','basisPoints']);const index=[g.home,g.away].indexOf(t.team);need(index>=0&&t.count===counts[index]&&integer(t.basisPoints));
     const home=v.total?Math.round(counts[0]/v.total*10000):0;
     need(t.basisPoints===(v.total?(index===0?home:10000-home):0));
    }
   }
  }
 }
 const standings=new Map();
 for(const s of list(snapshot.standings,50)){
  object(s,['scope','key','weeks','state'],['rows','reason']);scopeKey(s.key);need(!standings.has(s.key));standings.set(s.key,s);
  need(['WEEKLY','MONTHLY','SEASON'].includes(s.scope)&&s.key.startsWith({WEEKLY:'W',MONTHLY:'M',SEASON:'S'}[s.scope]));
  list(s.weeks,18).forEach(week);unique(s.weeks);need(s.weeks.length>0&&s.weeks.every(n=>weeks.has(n)));
  if(s.scope==='WEEKLY')need(s.weeks.length===1&&s.key==='W'+s.weeks[0]);
  if(s.scope==='SEASON')need(s.key==='S'+snapshot.season);
  if(s.state==='WITHHELD'){need(!Object.prototype.hasOwnProperty.call(s,'rows')&&['CLOSURE_UNVERIFIED','MISSING_ALIAS','INCOMPLETE'].includes(s.reason));continue;}
  need(s.state==='AVAILABLE'&&closed(s.weeks)&&s.weeks.every(n=>trust.aliasCompleteness.get(n)===true)&&!Object.prototype.hasOwnProperty.call(s,'reason'));
  const rows=list(s.rows);unique(rows.map(r=>r.player));let last=null,rank=0;
  rows.forEach((r,i)=>{
   object(r,['player','alias','rank','points','completedGames'],['totalPicks','accuracyBasisPoints']);approved(r);
   need(integer(r.points)&&integer(r.completedGames)&&r.points<=r.completedGames&&integer(r.rank));
   if(last!==null)need(r.points<=last);if(last!==r.points)rank=i+1;need(r.rank===rank);last=r.points;
   if(r.totalPicks!==undefined)need(integer(r.totalPicks)&&r.totalPicks>=r.completedGames);
   if(r.accuracyBasisPoints!==undefined)need(r.accuracyBasisPoints===(r.completedGames?Math.round(r.points/r.completedGames*10000):null));
  });
 }
 // Reconcile published totals without changing scoring/rank rules.
 for(const s of standings.values())if(s.state==='AVAILABLE'){
  if(s.scope==='WEEKLY'){
   const w=weeks.get(s.weeks[0]);const slate=[...games.values()].filter(g=>g.week===w.week);
   for(const r of s.rows)need(r.completedGames<=slate.filter(g=>g.status==='FINAL').length);
   if(w.picks!==undefined){
    need(same(s.rows.map(r=>r.player).sort(),w.picks.map(p=>p.player).sort()));
    for(const r of s.rows){
     const selections=w.picks.find(p=>p.player===r.player).selections;
     const eligible=selections.filter(p=>p.team!==null&&(snapshot.scoringBasis!=='ELIGIBLE_SUBMITTED_FINAL_PICKS'||['ELIGIBLE','LEGACY'].includes(p.eligibility)));
     const completed=eligible.filter(p=>games.get(p.game).status==='FINAL');
     const correct=completed.filter(p=>{const g=games.get(p.game);return p.team===(g.winner==='HOME'?g.home:g.winner==='AWAY'?g.away:null);});
     need(r.points===correct.length&&r.completedGames===completed.length);
     if(r.totalPicks!==undefined)need(r.totalPicks===eligible.length);
    }
   }
  }else{
   const parts=s.weeks.map(n=>standings.get('W'+n));need(parts.every(part=>part?.state==='AVAILABLE'));
   const totals=new Map();
   for(const part of parts)for(const row of part.rows){const total=totals.get(row.player)||{points:0,completedGames:0,totalPicks:0,hasTotals:true};total.points+=row.points;total.completedGames+=row.completedGames;total.totalPicks+=row.totalPicks??0;if(total.hasTotals)total.hasTotals=row.totalPicks!==undefined;totals.set(row.player,total);}
   need(same([...totals.keys()].sort(),s.rows.map(r=>r.player).sort()));
   for(const row of s.rows){const total=totals.get(row.player);need(row.points===total.points&&row.completedGames===total.completedGames);if(row.totalPicks!==undefined)need(total.hasTotals&&row.totalPicks===total.totalPicks);}
  }
 }
 const months=new Map();
 for(const m of list(snapshot.months,12)){
  object(m,['key','startWeek','endWeek','competitionComplete','designatedGame','state','winner','actualTotal','method'],['comparisons']);scopeKey(m.key);need(!months.has(m.key));months.set(m.key,m);
  week(m.startWeek);week(m.endWeek);need(m.endWeek>=m.startWeek);
  const s=standings.get(m.key);need(s&&s.weeks.length===m.endWeek-m.startWeek+1&&s.weeks.every(n=>n>=m.startWeek&&n<=m.endWeek)&&s.scope==='MONTHLY'&&typeof m.competitionComplete==='boolean');
  need(m.designatedGame===null||games.has(m.designatedGame));
  let expected='IN PROGRESS',winner=null,actual=null,method='NONE',comparisons;
  const g=games.get(m.designatedGame);
  if(g)need(g.week===Math.max(...s.weeks));
  if(m.competitionComplete&&snapshot.scoringBasis==='ELIGIBLE_SUBMITTED_FINAL_PICKS'){need(!snapshot.weeks.filter(w=>s.weeks.includes(w.week)).some(w=>w.picks?.some(p=>p.selections.some(v=>v.eligibility==='UNVERIFIED_CUTOFF'))));const leaders=s.rows?.filter(r=>r.points===s.rows[0]?.points)||[];if(leaders.length>1)need(!weeks.get(games.get(m.designatedGame)?.week)?.picks?.some(p=>leaders.some(r=>r.player===p.player)&&p.prediction?.eligibility==='UNVERIFIED_CUTOFF'));}
  if(m.competitionComplete&&closed(s.weeks)&&s.state==='AVAILABLE'&&s.rows.some(r=>r.completedGames>0)){
   const leaders=s.rows.filter(r=>r.points===s.rows[0].points);
   if(final(s.weeks)){
    if(leaders.length===1){expected='MONTHLY CHAMPION';winner=leaders[0].player;method='POINTS';}
    else if(g&&g.status==='FINAL'){
     actual=g.homeScore+g.awayScore;method='COMBINED_POINTS';
     comparisons=leaders.map(r=>{const p=weeks.get(g.week).picks?.find(p=>p.player===r.player)?.prediction;const predicted=p?.game===g.game?p.total:null;return {player:r.player,prediction:predicted??null,difference:predicted===null||predicted===undefined?null:Math.abs(predicted-actual)};});
     const eligible=comparisons.filter(c=>c.difference!==null);
     if(!eligible.length)expected='NO ELIGIBLE TIEBREAKER';
     else {const minimum=Math.min(...eligible.map(c=>c.difference));const closest=eligible.filter(c=>c.difference===minimum);expected=closest.length===1?'MONTHLY CHAMPION':'UNRESOLVED TIE';if(closest.length===1)winner=closest[0].player;}
    }
   }else if(g&&g.status!=='FINAL'&&[...games.values()].filter(x=>s.weeks.includes(x.week)&&x.game!==g.game).every(x=>x.status==='FINAL'))expected='AWAITING FINAL SCORE';
  }
  need(m.state===expected&&m.winner===winner&&m.actualTotal===actual&&m.method===method);
  if(comparisons){list(m.comparisons);m.comparisons.forEach(c=>object(c,['player','prediction','difference']));need(same(sorted(m.comparisons),sorted(comparisons)));}
  else need(!Object.prototype.hasOwnProperty.call(m,'comparisons'));
 }
 for(const s of standings.values())if(s.scope==='MONTHLY')need(months.has(s.key));
 const prizeKeys=[];
 for(const p of list(snapshot.prizes,50)){
  object(p,['key','currency','poolCents','poolState','allocationState','paymentState'],['allocations','rollover','funding','projectedPoolCents','estimateBasis','estimatedRolloverCents']);scopeKey(p.key);prizeKeys.push(p.key);
  const s=standings.get(p.key);need(s&&p.currency==='USD'&&['UNAVAILABLE','PROJECTED','CONFIRMED'].includes(p.poolState));
  need(p.poolCents===null||integer(p.poolCents));need((p.poolState==='UNAVAILABLE')===(p.poolCents===null));
  need(['UNAVAILABLE','PENDING','CONFIRMED'].includes(p.allocationState)&&['UNKNOWN','UNPAID','PAID'].includes(p.paymentState));
  if(p.poolCents!==null||p.projectedPoolCents!==undefined||p.funding!==undefined||p.allocationState==='CONFIRMED'||p.paymentState!=='UNKNOWN'||p.rollover!==undefined){
   // Private trust contains only an approved public accounting projection, no ledger IDs.
   need(same(p,trust.prizes.get(p.key)));
  }
  if(p.estimateBasis!==undefined){
   object(p.estimateBasis,['kind','participantsPerWeek']);need(p.estimateBasis.kind==='ASSUMED_NOT_COLLECTED'&&integer(p.estimateBasis.participantsPerWeek)&&p.estimateBasis.participantsPerWeek>0&&p.estimateBasis.participantsPerWeek<=1000);
   need(['PROJECTED','UNAVAILABLE'].includes(p.poolState)&&p.allocationState==='UNAVAILABLE'&&p.paymentState==='UNKNOWN'&&!p.allocations&&!p.rollover&&same(p,trust.prizes.get(p.key)));
  }
  if(p.estimatedRolloverCents!==undefined){
   need(p.estimateBasis&&s.scope==='WEEKLY'&&(p.estimatedRolloverCents===null||integer(p.estimatedRolloverCents)));
   if(p.estimatedRolloverCents!==null){need(closed(s.weeks)&&final(s.weeks)&&s.state==='AVAILABLE');const count=[...games.values()].filter(g=>s.weeks.includes(g.week)).length;const perfect=s.rows.some(r=>r.points===count&&r.completedGames===count&&r.totalPicks===count);need(p.estimatedRolloverCents===0||!perfect&&p.estimatedRolloverCents===p.poolCents);}
  }
  if(p.projectedPoolCents!==undefined)need(p.projectedPoolCents===null||integer(p.projectedPoolCents));
  if(p.funding!==undefined){
   const f=p.funding;object(f,['rolloverCents','monthlyPrizeCents','seasonContributionCents','monthlyShareBasisPoints','seasonShareBasisPoints']);
   need(s.scope==='MONTHLY'&&Object.values(f).every(integer)&&f.monthlyShareBasisPoints+f.seasonShareBasisPoints<=10000&&f.monthlyPrizeCents===p.poolCents&&f.monthlyPrizeCents+f.seasonContributionCents<=f.rolloverCents);
  }
  if(p.allocationState==='CONFIRMED'){
   need(closed(s.weeks)&&final(s.weeks)&&s.state==='AVAILABLE'&&p.poolState==='CONFIRMED');
   const allocations=list(p.allocations);unique(allocations.map(a=>a.player));
   for(const a of allocations){object(a,['player','cents']);need(s.rows.some(r=>r.player===a.player)&&integer(a.cents));}
   need(allocations.reduce((sum,a)=>sum+a.cents,0)<=p.poolCents);
   if(s.scope==='SEASON')need(s.weeks.length===18&&s.weeks.includes(18));
   if(s.scope==='MONTHLY'){const m=months.get(s.key);need(m?.state==='MONTHLY CHAMPION'&&allocations.length===1&&allocations[0].player===m.winner);}
   if(s.scope==='WEEKLY'){
    const count=[...games.values()].filter(g=>s.weeks.includes(g.week)).length;
    const perfect=s.rows.filter(r=>r.points===count&&r.completedGames===count&&r.totalPicks===count).map(r=>r.player);
    need(same([...perfect].sort(),allocations.map(a=>a.player).sort()));
   }
  }else need(!Object.prototype.hasOwnProperty.call(p,'allocations'));
  if(p.paymentState!=='UNKNOWN')need(p.allocationState==='CONFIRMED');
  if(p.rollover!==undefined){
   need(p.allocationState==='CONFIRMED');
   object(p.rollover,['to','cents']);scopeKey(p.rollover.to);
   need(s.scope==='WEEKLY'&&closed(s.weeks)&&final(s.weeks)&&p.poolState==='CONFIRMED'&&integer(p.rollover.cents)&&p.rollover.cents===p.poolCents);
   const target=standings.get(p.rollover.to);need(target?.scope==='MONTHLY'&&s.weeks.every(n=>target.weeks.includes(n)));
   need(!p.allocations?.length&&p.paymentState==='UNKNOWN');
   const count=[...games.values()].filter(g=>s.weeks.includes(g.week)).length;
   need(s.state==='AVAILABLE'&&!s.rows.some(r=>r.points===count&&r.completedGames===count&&r.totalPicks===count));
  }
 }
 if(snapshot.accuracy)require('../scoring/roster-accuracy.cjs').validate(snapshot,trust.aliases);
 unique(prizeKeys);return snapshot;
}
function validatePublic(snapshot,trust){
 try{return validatePublicInternal(snapshot,trust);}catch{fail();}
}
function comparePublic(a,b,trust,{legacyChampionOracle=false,candidateTrust=trust}={}){
 validatePublic(a,trust);validatePublic(b,candidateTrust);
 const codes=['SCORES','RANKINGS','PRIZES','CHAMPIONS'];
 if(a.state!=='READY'||b.state!=='READY'||a.revision!==b.revision||a.season!==b.season)return {state:'NOT_COMPARABLE',checks:codes.map(code=>({code,state:'NOT_COMPARABLE'}))};
 const canonical=(snapshot,code)=>{
  if(code==='SCORES')return sorted(snapshot.games.map(g=>[g.game,g.week,g.home,g.away,g.status,g.homeScore,g.awayScore,g.winner]));
  if(code==='RANKINGS')return sorted(snapshot.standings.map(s=>[s.scope,s.key,s.weeks.slice().sort((a,b)=>a-b),s.state,s.reason??null,sorted((s.rows||[]).map(r=>[r.player,r.rank,r.points,r.completedGames,r.totalPicks??null]))]));
  if(code==='PRIZES')return sorted(snapshot.prizes.map(p=>[p.key,p.currency,p.poolCents,p.poolState,p.allocationState,p.paymentState,sorted((p.allocations||[]).map(a=>[a.player,a.cents])),p.rollover?[p.rollover.to,p.rollover.cents]:null,p.projectedPoolCents??null,p.estimateBasis??null,p.estimatedRolloverCents??null,p.funding?[p.funding.rolloverCents,p.funding.monthlyPrizeCents,p.funding.seasonContributionCents,p.funding.monthlyShareBasisPoints,p.funding.seasonShareBasisPoints]:null]));
  return sorted(snapshot.months.map(m=>[m.key,m.competitionComplete,m.designatedGame,m.state,m.winner,m.actualTotal,m.method,sorted((m.comparisons||[]).map(c=>[c.player,c.prediction,c.difference]))]));
 };
 const checks=codes.map(code=>({code,state:code==='CHAMPIONS'&&!legacyChampionOracle?'NOT_COMPARABLE':same(canonical(a,code),canonical(b,code))?'MATCH':'MISMATCH'}));
 return {state:checks.some(c=>c.state==='MISMATCH')?'MISMATCH':checks.some(c=>c.state==='NOT_COMPARABLE')?'NOT_COMPARABLE':'MATCH',checks};
}
module.exports={VERSION,normalizeScore,validatePublic,comparePublic};
