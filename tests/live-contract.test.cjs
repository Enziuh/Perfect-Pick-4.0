'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {VERSION,normalizeScore,validatePublic,comparePublic}=require('../tools/contracts/live-contract.cjs');
const {example,AT,UNTIL,COMET,G1}=require('./support/live-contract-examples.cjs');
const {FILES}=require('../tools/security/public-artifact.cjs');
const reject=(snapshot,trust)=>assert.throws(()=>validatePublic(snapshot,trust),{message:'Invalid public contract'});
for(const name of ['decisive','unresolved','no-eligible','pending','zero-votes','in-progress','unknown','missing-alias','zero-completed']){
 test('live contract synthetic example: '+name,()=>{const {snapshot,trust}=example(name),before=JSON.stringify(snapshot);assert.equal(validatePublic(snapshot,trust),snapshot);assert.equal(JSON.stringify(snapshot),before);});
}
test('scores normalize strictly without converting absence into zero',()=>{
 for(const value of ['',null,undefined,' ','\t'])assert.equal(normalizeScore(value),null);
 for(const value of [0,'0',' 21 ',21])assert.equal(normalizeScore(value),Number(value));
 for(const value of [false,true,NaN,Infinity,-1,'-1','1.5',1.5,'1e2','0x10',{},[],Number.MAX_SAFE_INTEGER+1])assert.throws(()=>normalizeScore(value));
});
test('every nested record rejects additional fields with a value-free error',()=>{
 const {snapshot,trust}=example();
 const paths=[];
 function visit(value,p=[]){if(!value||typeof value!=='object')return;if(!Array.isArray(value))paths.push(p);for(const [k,v]of Object.entries(value))visit(v,[...p,k]);}
 visit(snapshot);
 for(const parts of paths)for(const field of ['phone','email','notes','rawResponse','privateId','scriptId','submissionId','constructor']){
  const copy=structuredClone(snapshot);let node=copy;for(const part of parts)node=node[part];Object.defineProperty(node,field,{value:'FORBIDDEN',enumerable:true});reject(copy,trust);
 }
});
test('non-CLOSED status forbids even empty selection and vote fields',()=>{
 for(const status of ['OPEN','UNKNOWN','UPCOMING'])for(const field of ['picks','votes']){
  const {snapshot,trust}=example('unknown');snapshot.weeks[1].entry.status=status;snapshot.weeks[1][field]=[];reject(snapshot,trust);
 }
 const {snapshot,trust}=example();snapshot.weeks[1].entry.status='closed';reject(snapshot,trust);
});
test('closure must match trusted official week evidence, remain fresh and survive reopen',()=>{
 for(const mutate of [
  (s,t)=>t.closures.delete(2),(s,t)=>t.closures.get(2).status='OPEN',
  s=>s.weeks[1].entry.authority='UNVERIFIED',s=>s.weeks[1].entry.revision++,
  (s,t)=>{t.now=Date.parse(UNTIL);s.generatedAt=UNTIL;s.games.forEach(g=>g.verifiedAt=UNTIL);},
  (s,t)=>{s.weeks[1].entry.checkedAt='2026-09-30T12:00:00.000Z';t.closures.set(2,structuredClone(s.weeks[1].entry));}
 ]){const {snapshot,trust}=example();mutate(snapshot,trust);reject(snapshot,trust);}
});
test('stale, missing, provisional and contradictory scores cannot confirm results',()=>{
 for(const mutate of [
  s=>s.games[0].verifiedAt='2026-09-30T12:00:00.000Z',
  s=>s.games[0].verifiedAt='2026-10-01T12:00:01.000Z',
  s=>s.games[0].homeScore=null,s=>s.games[0].homeScore='20',
  s=>s.games[0].winner='AWAY',s=>s.games[0].status='Final',
  s=>s.games[0].status='PENDING',s=>s.generatedAt='2026-09-30T12:00:00.000Z'
 ]){const {snapshot,trust}=example();mutate(snapshot,trust);reject(snapshot,trust);}
 const {snapshot,trust}=example('pending');snapshot.months[0].state='MONTHLY CHAMPION';snapshot.months[0].winner=COMET;reject(snapshot,trust);
});
test('missing approvals suppress identity-bearing scopes; labels never substitute for approval',()=>{
 for(const mutate of [(s,t)=>t.aliases.delete(COMET),s=>s.weeks[0].picks[0].alias='Unapproved Alias',s=>s.weeks[0].picks[0].player='p_other0001']){
  const {snapshot,trust}=example();mutate(snapshot,trust);reject(snapshot,trust);
 }
 const {snapshot,trust}=example('missing-alias');validatePublic(snapshot,trust);
 assert(snapshot.standings.every(s=>!Object.hasOwn(s,'rows')));assert(snapshot.weeks.every(w=>!Object.hasOwn(w,'picks')));
});
test('points, shared ranks, accuracy and period aggregates must reconcile',()=>{
 for(const mutate of [
  s=>s.standings[0].rows[0].rank=2,s=>s.standings[2].rows[1].rank=2,
  s=>s.standings[2].rows[0].points=2,s=>s.standings[0].rows[0].accuracyBasisPoints=0,
  s=>s.standings[0].rows[0].totalPicks=0,s=>s.standings[0].rows[0].completedGames=2,
  s=>s.months[0].endWeek=3,s=>s.standings[2].weeks=[1],s=>s.standings.splice(0,1)
 ]){const {snapshot,trust}=example();mutate(snapshot,trust);reject(snapshot,trust);}
 const {snapshot,trust}=example('pending');assert(snapshot.standings[1].rows.every(r=>r.accuracyBasisPoints===null));validatePublic(snapshot,trust);
});
test('monthly decisions reject arbitrary winners, invalid predictions and disclosure before closure',()=>{
 for(const scenario of ['unresolved','no-eligible','unknown','in-progress']){
  const {snapshot,trust}=example(scenario);snapshot.months[0].state='MONTHLY CHAMPION';snapshot.months[0].winner=COMET;reject(snapshot,trust);
 }
 for(const mutate of [s=>s.months[0].actualTotal=99,s=>s.months[0].comparisons[0].difference=0,s=>s.weeks[1].picks[0].prediction.total='',s=>s.months[0].winner='p_other0001']){
  const {snapshot,trust}=example();mutate(snapshot,trust);reject(snapshot,trust);
 }
 const {snapshot,trust}=example();snapshot.weeks.reverse();snapshot.games.reverse();snapshot.standings.reverse();snapshot.months[0].comparisons.reverse();validatePublic(snapshot,trust);
});
test('votes require published valid selections; zero votes never divide by zero',()=>{
 const {snapshot,trust}=example('zero-votes');assert(snapshot.weeks[0].votes[0].teams.every(t=>t.count===0&&t.basisPoints===0));validatePublic(snapshot,trust);
 for(const mutate of [s=>s.weeks[0].votes[0].teams[0].count++,s=>s.weeks[0].votes[0].teams[0].basisPoints=10000,s=>delete s.weeks[0].picks]){
  const {snapshot,trust}=example();mutate(snapshot,trust);reject(snapshot,trust);
 }
});
test('accounting needs trusted amounts; unknown payments and missing pools are explicit',()=>{
 const {snapshot,trust}=example();assert(snapshot.prizes.every(p=>p.paymentState==='UNKNOWN'));assert.equal(snapshot.prizes.at(-1).poolCents,null);
 for(const mutate of [s=>s.prizes[0].poolCents++,s=>s.prizes[0].paymentState='PAID',s=>delete s.prizes[0].poolCents,s=>s.prizes.at(-1).poolCents=0]){
  const s=structuredClone(snapshot);mutate(s);reject(s,trust);
 }
 const p=snapshot.prizes[0];p.allocationState='CONFIRMED';p.allocations=[{player:COMET,cents:1000}];trust.prizes.set(p.key,structuredClone(p));validatePublic(snapshot,trust);
 // Even trusted accounting cannot award an unresolved monthly championship.
 const tie=example('unresolved'),monthly=tie.snapshot.prizes.find(p=>p.key==='M1');monthly.allocationState='CONFIRMED';monthly.allocations=[{player:COMET,cents:1000}];monthly.paymentState='PAID';tie.trust.prizes.set('M1',structuredClone(monthly));reject(tie.snapshot,tie.trust);
});
test('rollovers need finalized no-perfect evidence and authoritative destination/amount',()=>{
 const {snapshot,trust}=example('zero-votes'),p=snapshot.prizes[0];p.allocationState='CONFIRMED';p.allocations=[];p.rollover={to:'M1',cents:1000};trust.prizes.set(p.key,structuredClone(p));validatePublic(snapshot,trust);
 p.rollover.cents=999;trust.prizes.set(p.key,structuredClone(p));reject(snapshot,trust);
 const winner=example(),q=winner.snapshot.prizes[0];q.allocationState='CONFIRMED';q.allocations=[];q.rollover={to:'M1',cents:1000};winner.trust.prizes.set(q.key,structuredClone(q));reject(winner.snapshot,winner.trust);
});
test('unavailable envelopes contain only controlled reasons, never cached payloads',()=>{
 const {trust}=example();const s={version:VERSION,revision:1,generatedAt:AT,state:'UNAVAILABLE',reason:'STALE'};validatePublic(s,trust);
 reject({...s,games:[]},trust);reject({...s,reason:'FORBIDDEN'},trust);
});
test('comparison is deterministic, distinguishes missing champion oracle, and never returns values',()=>{
 const a=example(),b=structuredClone(a.snapshot);b.games.reverse();b.weeks.reverse();b.standings.reverse();b.standings.forEach(s=>s.rows?.reverse());
 // Reverse only equal-point rows; weekly ranks must still descend.
 b.standings.filter(s=>s.scope==='WEEKLY').forEach(s=>s.rows.reverse());
 assert.equal(comparePublic(a.snapshot,b,a.trust,{legacyChampionOracle:true}).state,'MATCH');
 assert.equal(comparePublic(a.snapshot,b,a.trust).state,'NOT_COMPARABLE');
 b.revision=2;assert.equal(comparePublic(a.snapshot,b,a.trust).state,'NOT_COMPARABLE');
 const tie=example('unresolved');const result=comparePublic(a.snapshot,tie.snapshot,a.trust,{legacyChampionOracle:true});
 assert.equal(result.state,'MISMATCH');assert.equal(result.checks.find(c=>c.code==='CHAMPIONS').state,'MISMATCH');
 assert(!/Synthetic|example|player|alias|prediction|cents|38|40|44/.test(JSON.stringify(result)));
 assert.deepEqual(Object.keys(result),['state','checks']);
 const malformed=structuredClone(b);malformed.notes='FORBIDDEN';assert.throws(()=>comparePublic(a.snapshot,malformed,a.trust),{message:'Invalid public contract'});
});
test('contract tools and synthetic examples remain outside the six-file browser publication',()=>{
 assert.equal(FILES.length,6);assert(!FILES.some(file=>/contract/.test(file)));
 for(const name of ['website/app.js','website/config.js','website/preview-data.js','website/index.html'])assert(!fs.readFileSync(path.resolve(__dirname,'..',name),'utf8').includes('live-contract'));
});
test('trusted alias completeness prevents silently dropping an unmapped participant',()=>{
 const {snapshot,trust}=example();trust.aliasCompleteness.set(1,false);reject(snapshot,trust);
});
test('unexpected accessors cannot leak values through validator exceptions',()=>{
 const {snapshot,trust}=example();Object.defineProperty(snapshot,'state',{get(){throw Error('FORBIDDEN');}});reject(snapshot,trust);
});
test('monthly funding and projected season totals require exact approved accounting',()=>{
 const {snapshot,trust}=example(),m=snapshot.prizes.find(p=>p.key==='M1'),season=snapshot.prizes.at(-1);
 m.funding={rolloverCents:2000,monthlyPrizeCents:1000,seasonContributionCents:1000,monthlyShareBasisPoints:5000,seasonShareBasisPoints:5000};season.projectedPoolCents=1000;
 trust.prizes.set(m.key,structuredClone(m));trust.prizes.set(season.key,structuredClone(season));validatePublic(snapshot,trust);
 m.funding.seasonContributionCents=1001;trust.prizes.set(m.key,structuredClone(m));reject(snapshot,trust);
});
test('independently evidenced prize discrepancies produce redacted comparison failure',()=>{
 const baseline=example(),candidate=example();candidate.snapshot.prizes[0].poolCents=900;candidate.trust.prizes.set('W1',structuredClone(candidate.snapshot.prizes[0]));
 const result=comparePublic(baseline.snapshot,candidate.snapshot,baseline.trust,{candidateTrust:candidate.trust});
 assert.equal(result.state,'MISMATCH');assert.equal(result.checks.find(c=>c.code==='PRIZES').state,'MISMATCH');assert(!JSON.stringify(result).includes('900'));
});

test('contract monthly states agree with the approved frontend resolver on invented cases',()=>{
 const {resolveMonthlyChampion}=require('../website/preview-data.js');
 for(const name of ['decisive','unresolved','no-eligible','pending','zero-votes','in-progress','unknown','missing-alias','zero-completed']){
  const {snapshot:s,trust}=example(name);validatePublic(s,trust);
  const month=s.months[0],table=s.standings.find(t=>t.key===month.key),designated=s.games.find(g=>g.game===month.designatedGame);
  const label=g=>g.home+' vs '+g.away;
  const weeks=s.weeks.map(w=>({week:w.week,entriesStatus:w.entry.status,games:s.games.filter(g=>g.week===w.week).map(label),results:s.games.filter(g=>g.week===w.week).map(g=>({game:label(g),team1:g.home,team2:g.away,status:g.status==='FINAL'?'Final':'Pending',winner:g.winner==='HOME'?g.home:g.winner==='AWAY'?g.away:g.winner==='TIE'?'Tie':'',team1Score:g.homeScore??'',team2Score:g.awayScore??''})),outcome:{finalized:s.games.filter(g=>g.week===w.week).every(g=>g.status==='FINAL')},tiebreak:{enabled:true,revealed:w.entry.status==='CLOSED',game:label(designated)},standings:(s.standings.find(t=>t.key==='W'+w.week).rows||[]).map(r=>{const prediction=w.picks?.find(p=>p.player===r.player)?.prediction?.total;return {name:r.alias,points:r.points,completedGames:r.completedGames,tiebreakPrediction:prediction===undefined||prediction===null?'':String(prediction)};})}));
  const period={startWeek:month.startWeek,endWeek:month.endWeek,allWeeksFinalized:month.competitionComplete&&s.games.every(g=>g.status==='FINAL'),standings:(table.rows||[]).map(r=>({name:r.alias,points:r.points,completedGames:r.completedGames})),tiebreakRule:{week:month.endWeek,game:label(designated),method:'Combined Points'}};
  const result=resolveMonthlyChampion(period,weeks);
  assert.equal(result.status,month.state,name);assert.equal(result.winner,month.winner===null?null:trust.aliases.get(month.winner),name);
 }
});
test('score mismatches and unavailable inputs cannot be mistaken for comparison success',()=>{
 const a=example(),b=structuredClone(a.snapshot);b.games[0].homeScore++;
 const report=comparePublic(a.snapshot,b,a.trust,{legacyChampionOracle:true});assert.equal(report.checks[0].state,'MISMATCH');
 const unavailable={version:VERSION,revision:1,generatedAt:AT,state:'UNAVAILABLE',reason:'UNVERIFIED'};
 assert.equal(comparePublic(a.snapshot,unavailable,a.trust).state,'NOT_COMPARABLE');
});

test('evidence object property order does not alter authority or deterministic validation',()=>{
 const {snapshot,trust}=example();
 trust.closures=new Map([...trust.closures].map(([k,v])=>[k,Object.fromEntries(Object.entries(v).reverse())]));
 trust.prizes=new Map([...trust.prizes].map(([k,v])=>[k,Object.fromEntries(Object.entries(v).reverse())]));
 validatePublic(snapshot,trust);
});
