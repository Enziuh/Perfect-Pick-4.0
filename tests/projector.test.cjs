'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {projectCompetition}=require('../tools/projector/project-competition.cjs');
const {projectFromReader}=require('../tools/projector/read-only-reader.cjs');
const {validatePublic,comparePublic}=require('../tools/contracts/live-contract.cjs');
const {fabricated,validationTrust}=require('./support/projector-examples.cjs');
const {example,AT,COMET,MAPLE}=require('./support/live-contract-examples.cjs');
const {writeDenyingServices}=require('./support/write-denying-services.cjs');
const valid=(value,policy)=>validatePublic(value,validationTrust(policy,value));
for(const scenario of ['decisive','unresolved','no-eligible','pending','zero-votes','in-progress','unknown','missing-alias','zero-completed']){
 test('fabricated legacy projector: '+scenario,()=>{
  const {source,policy}=fabricated(scenario),before=JSON.stringify(source),value=projectCompetition(source,policy);
  assert.equal(value.state,'READY');valid(value,policy);assert.equal(JSON.stringify(source),before);
  assert(!JSON.stringify(value).includes('FABRICATED_PRIVATE_MARKER'));
  assert.equal(value.months[0].state,example(scenario).snapshot.months[0].state);
  if(!['zero-votes','missing-alias'].includes(scenario))assert.equal(comparePublic(value,example(scenario).snapshot,validationTrust(policy,value),{legacyChampionOracle:true}).state,'MATCH');
 });
}
test('unverifiable closure is UNKNOWN and never reads private submissions',()=>{
 for(const mutate of [
  p=>p.closures.delete(2),p=>p.closures.get(2).entry.status='OPEN',p=>p.closures.get(2).entry.status='closed',
  p=>p.closures.get(2).entry.authority='UNVERIFIED',p=>p.closures.get(2).snapshotRevision=0,
  p=>p.closures.get(2).entry.checkedAt='2026-09-30T12:00:00.000Z',p=>p.closures.get(2).entry.validUntil=AT
 ]){
  const {source,policy}=fabricated();mutate(policy);
  Object.defineProperty(source.weeks[1],'submissions',{get(){throw Error('Private submissions read');}});
  const value=projectCompetition(source,policy);assert.equal(value.state,'READY');
  const w=value.weeks[1];assert.notEqual(w.entry.status,'CLOSED');assert(!Object.hasOwn(w,'picks'));assert(!Object.hasOwn(w,'votes'));
  assert.equal(value.standings.find(s=>s.key==='M1').state,'WITHHELD');assert.equal(value.months[0].winner,null);valid(value,policy);
 }
});
test('revocation cannot reuse previously closed data; no page-session cache exists',()=>{
 const {source,policy}=fabricated();assert(projectCompetition(source,policy).weeks[1].picks);
 policy.closures.get(2).entry.status='OPEN';const value=projectCompetition(source,policy);assert(!Object.hasOwn(value.weeks[1],'picks'));
 policy.closures.get(2).entry.status='CLOSED';policy.aliases.delete('fabricated-entry-a');
 const hidden=projectCompetition(source,policy);assert(hidden.weeks.every(w=>!Object.hasOwn(w,'picks')));assert(hidden.standings.every(s=>s.state==='WITHHELD'));
});
test('unknown source fields are not read or reflected; approved fields reject hostile strings',()=>{
 const {source,policy}=fabricated();
 const poison=()=>{throw Error('FORBIDDEN private getter');};
 for(const object of [source,...source.games,...source.weeks.flatMap(w=>w.submissions)])for(const key of ['notes','phone','email','rawResponse','scriptId','name'])Object.defineProperty(object,key,{get:poison});
 const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert(!/FORBIDDEN|private getter/.test(JSON.stringify(value)));valid(value,policy);
 source.games[0].team1Score='<script>FABRICATED_PRIVATE_MARKER</script>';
 const failure=projectCompetition(source,policy);assert.equal(failure.state,'UNAVAILABLE');assert.equal(failure.reason,'INVALID_RESULTS');assert(!JSON.stringify(failure).includes('FABRICATED'));
});
test('raw name/identity never becomes an alias and ambiguous approvals withhold whole scopes',()=>{
 for(const mutate of [
  p=>p.aliases.get('fabricated-entry-a').approved=false,
  p=>p.aliases.get('fabricated-entry-a').alias='<unapproved>',
  p=>p.aliases.get('fabricated-entry-a').player='fabricated-entry-a',
  p=>p.aliases.get('fabricated-entry-b').player=COMET
 ]){const {source,policy}=fabricated();mutate(policy);const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert(value.weeks.every(w=>!Object.hasOwn(w,'picks')));assert.equal(value.months[0].winner,null);valid(value,policy);}
});
test('incomplete, duplicate and malicious selected records cannot create partial rankings or votes',()=>{
 for(const mutate of [
  (s,p)=>p.completeWeeks.delete(1),s=>s.weeks[0].submissions[0].selections.push({...s.weeks[0].submissions[0].selections[0]}),
  s=>s.weeks[0].submissions[0].selections[0].pick='FORBIDDEN',s=>s.weeks[0].submissions[0].timestamp='invalid',
  s=>s.weeks[0].submissions[0].identity='',s=>s.weeks[0].submissions[0].selections=null
 ]){const {source,policy}=fabricated();mutate(source,policy);const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert(!Object.hasOwn(value.weeks[0],'picks'));assert.equal(value.standings[0].reason,'INCOMPLETE');valid(value,policy);}
});
test('latest accepted weekly submission uses legacy equal-time last-row behavior without extra votes',()=>{
 const {source,policy}=fabricated();
 const original=structuredClone(source.weeks[0].submissions[0]);original.timestamp='2026-10-01T11:59:00.000Z';original.selections[0].pick='Lions';source.weeks[0].submissions.unshift(original);
 const equal=structuredClone(source.weeks[0].submissions.at(-2));equal.selections[0].pick='Lions';source.weeks[0].submissions.push(equal);
 // Last equal timestamp for the same private identity wins; ties in championship are separate.
 const value=projectCompetition(source,policy);valid(value,policy);const pick=value.weeks[0].picks.find(p=>p.player===COMET);
 assert.equal(pick.selections[0].team,'DET');assert.equal(value.weeks[0].votes[0].total,2);
 assert.equal(value.standings[0].rows.find(r=>r.player===COMET).points,0);
});
test('Final-only scoring preserves missing-pick denominator, shared ranks and NFL ties',()=>{
 const pending=fabricated('pending');pending.source.weeks[1].submissions.forEach(p=>p.selections[0].correct=true);
 const p=projectCompetition(pending.source,pending.policy);assert(p.standings.find(s=>s.key==='W2').rows.every(r=>r.points===0&&r.completedGames===0&&r.accuracyBasisPoints===null));valid(p,pending.policy);
 const tied=fabricated();tied.source.games[0].team1Score='0';tied.source.games[0].team2Score='0';tied.source.games[0].winner='Tie';
 const t=projectCompetition(tied.source,tied.policy);valid(t,tied.policy);assert(t.standings[0].rows.every(r=>r.points===0&&r.completedGames===1&&r.rank===1));assert.equal(t.games[0].homeScore,0);
 const empty=fabricated();empty.source.weeks[0].submissions=[];const z=projectCompetition(empty.source,empty.policy);assert(z.weeks[0].votes[0].teams.every(team=>team.count===0&&team.basisPoints===0));valid(z,empty.policy);
});
test('missing/fractional/contradictory final scores and stale or incomplete schedule fail safely',()=>{
 for(const mutate of [
  s=>s.games[0].team1Score='',s=>s.games[0].team1Score='1.5',s=>s.games[0].winner='Lions',
  s=>delete s.games[0].verifiedAt,s=>s.games[0].verifiedAt='2026-09-30T12:00:00.000Z',
  s=>s.games.push(structuredClone(s.games[0])),s=>s.games.pop(),s=>s.games[0].status='unrecognized',
  s=>s.games[0].team1='FORBIDDEN'
 ]){const {source,policy}=fabricated();mutate(source);const value=projectCompetition(source,policy);assert.equal(value.state,'UNAVAILABLE');assert.equal(value.reason,'INVALID_RESULTS');valid(value,policy);}
 const {source,policy}=fabricated('pending');const value=projectCompetition(source,policy);assert.equal(value.games[1].homeScore,null);
});
test('missing snapshot freshness/revision and read failures produce value-free unavailable envelopes',()=>{
 for(const [mutate,reason] of [[s=>delete s.observedAt,'UNVERIFIED'],[s=>s.observedAt='2026-09-30T12:00:00.000Z','STALE'],[s=>s.revision++,'INCONSISTENT']]){
  const {source,policy}=fabricated();mutate(source);const value=projectCompetition(source,policy);assert.equal(value.reason,reason);valid(value,policy);assert.deepEqual(Object.keys(value),['version','revision','generatedAt','state','reason']);
 }
 const {policy}=fabricated();const value=projectFromReader(Object.freeze({readSnapshot(){throw Error('FABRICATED_PRIVATE_MARKER');}}),policy);assert.equal(value.reason,'UNVERIFIED');assert(!JSON.stringify(value).includes('FABRICATED'));
});
test('monthly decision evidence is required; missing/invalid predictions never become zero',()=>{
 const missing=fabricated();missing.policy.decisions.clear();assert.equal(projectCompetition(missing.source,missing.policy).months[0].state,'IN PROGRESS');
 const invalid=fabricated();invalid.source.weeks[1].submissions.forEach(p=>p.prediction.value='invalid');const value=projectCompetition(invalid.source,invalid.policy);assert.equal(value.months[0].state,'NO ELIGIBLE TIEBREAKER');assert(value.months[0].comparisons.every(c=>c.prediction===null));valid(value,invalid.policy);
 const one=fabricated();one.source.weeks[1].submissions[1].prediction.value='';one.source.weeks[1].submissions[0].prediction.value='0';const winner=projectCompetition(one.source,one.policy);assert.equal(winner.months[0].winner,COMET);assert.equal(winner.months[0].comparisons.find(c=>c.player===COMET).prediction,0);valid(winner,one.policy);
});
test('missing/stale payout evidence is unavailable, not zero or paid',()=>{
 const {source,policy}=fabricated();policy.accounting.clear();const value=projectCompetition(source,policy);
 assert(value.prizes.every(p=>p.poolCents===null&&p.poolState==='UNAVAILABLE'&&p.paymentState==='UNKNOWN'));valid(value,policy);
 const stale=fabricated();stale.policy.accounting.get('W1').verifiedAt='2026-09-30T12:00:00.000Z';assert.equal(projectCompetition(stale.source,stale.policy).prizes[0].poolCents,null);
});
test('accounting fields are explicitly projected and contradictory tie payouts fail closed',()=>{
 const {source,policy}=fabricated();const a=policy.accounting.get('W1').value;
 a.notes='FABRICATED_PRIVATE_MARKER';a.allocations=[{player:COMET,cents:1000,notes:'FABRICATED_PRIVATE_MARKER'}];a.allocationState='CONFIRMED';a.paymentState='UNPAID';
 const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert.equal(value.prizes[0].paymentState,'UNPAID');assert(!JSON.stringify(value).includes('FABRICATED_PRIVATE_MARKER'));
 // Independent validator rejects unknown fields in public evidence, so use its same allowlisted public view.
 const trust=validationTrust(policy,value);trust.prizes.set('W1',value.prizes[0]);validatePublic(value,trust);
 const tie=fabricated('unresolved'),m=tie.policy.accounting.get('M1').value;m.allocationState='CONFIRMED';m.allocations=[{player:COMET,cents:1000}];m.paymentState='PAID';const safe=projectCompetition(tie.source,tie.policy);assert.equal(safe.state,'UNAVAILABLE');assert(!JSON.stringify(safe).includes(COMET));
});
test('projector has no action router and read-only interface rejects extra capabilities',()=>{
 const {source,policy}=fabricated(),services=writeDenyingServices();
 const reader=services.reader(source);assert.deepEqual(Object.keys(reader),['readSnapshot']);assert.equal(projectFromReader(reader,policy).state,'READY');
 for(const action of ['write','setup','sync','deploy'])assert.throws(()=>projectFromReader({...reader,[action](){throw Error('Should not run');}},policy),{message:'Invalid read-only interface'});
 assert.deepEqual(Object.keys(require('../tools/projector/project-competition.cjs')),['projectCompetition']);assert.equal(services.attempts.length,0);
});
test('write-denying services block mutations and sandboxed projection attempts no service access',()=>{
 const services=writeDenyingServices();
 for(const [name,method] of [['SpreadsheetApp','setValue'],['FormApp','setAcceptingResponses'],['ScriptApp','newTrigger'],['PropertiesService','setProperty'],['UrlFetchApp','fetch']])assert.throws(()=>services.globals[name][method]('FABRICATED'),{message:'Service operation denied'});
 assert.equal(services.attempts.length,5);services.attempts.length=0;
 const context=vm.createContext({...services.globals,Map,Set,Date,Error});const cache=new Map();
 const permitted=new Set(['tools/scoring/late-entry.cjs','tools/compatibility/pp3-display-name.cjs','tools/projector/read-only-reader.cjs','tools/projector/project-competition.cjs','tools/projector/monthly-decision.cjs','tools/contracts/live-contract.cjs'].map(p=>path.resolve(__dirname,'..',p)));
 function load(file){assert(permitted.has(file),'Unapproved module dependency');if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const wrapper=vm.runInContext('(function(require,module,exports){'+fs.readFileSync(file,'utf8')+'\n})',context);wrapper(name=>load(path.resolve(path.dirname(file),name)),module,module.exports);return module.exports;}
 const projector=load(path.resolve(__dirname,'../tools/projector/read-only-reader.cjs'));
 for(const scenario of ['decisive','unknown','missing-alias','unresolved','pending']){const {source,policy}=fabricated(scenario);const value=projector.projectFromReader(services.reader(source),policy);assert.equal(value.state,'READY');}
 assert.deepEqual(services.attempts,[],'Even swallowed service attempts must fail the test');
});
test('projected data supplies existing Match Center, standings and champion component needs',()=>{
 const {buildMatchView,resolveMonthlyChampion}=require('../website/preview-data.js');
 const {componentInputs}=require('./support/projector-frontend-needs.cjs');
 for(const scenario of ['decisive','unresolved','pending','unknown','missing-alias','no-eligible','zero-completed']){
  const {source,policy}=fabricated(scenario),value=projectCompetition(source,policy);const inputs=componentInputs(value);
  assert.equal(resolveMonthlyChampion(inputs.period,inputs.weeks).status,value.months[0].state,scenario);
  for(const week of inputs.weeks)for(const label of week.games){
   const model=buildMatchView(week,label),publicWeek=value.weeks.find(w=>w.week===week.week);
   if(publicWeek.picks){
    const g=value.games.find(g=>g.week===week.week);const vote=publicWeek.votes.find(v=>v.game===g.game);
    assert.equal(model.votes.total,vote.total);assert.deepEqual(model.votes.teams.map(t=>t.count),vote.teams.map(t=>t.count));
   }else assert.equal(model.selections.length,0);
  }
  assert(value.prizes.every(p=>p.paymentState==='UNKNOWN')); // Champion is never payment evidence.
 }
});
test('input and policy mutations are denied, including Map writes',()=>{
 const {source,policy}=fabricated(),attempts=[];
 const freeze=value=>{if(value&&typeof value==='object'){if(value instanceof Map){for(const v of value.values())freeze(v);}else {Object.values(value).forEach(freeze);Object.freeze(value);}}};
 freeze(source);freeze(policy);
 const guarded={...policy};
 for(const [field,map] of Object.entries(policy))if(map instanceof Map)guarded[field]=new Proxy(map,{get(target,name){if(['set','delete','clear'].includes(name))return ()=>{attempts.push(field);throw Error('Mutation denied');};const value=Reflect.get(target,name,target);return typeof value==='function'?value.bind(target):value;}});
 Object.freeze(guarded);const value=projectCompetition(source,guarded);assert.equal(value.state,'READY');assert.deepEqual(attempts,[]);
});
test('unresolved monthly decision is independent of source order and does not break shared ranks',()=>{
 const {source,policy}=fabricated('unresolved');const first=projectCompetition(source,policy);
 source.weeks.reverse();source.games.reverse();source.weeks.forEach(w=>w.submissions.reverse());
 const value=projectCompetition(source,policy);valid(value,policy);assert.equal(value.months[0].state,'UNRESOLVED TIE');assert.equal(value.months[0].winner,null);
 const rows=value.standings.find(s=>s.key==='M1').rows;assert(rows.every(r=>r.rank===1&&r.points===1));
 assert.equal(comparePublic(first,value,validationTrust(policy,value),{legacyChampionOracle:true}).state,'MATCH');
});

test('closed scopes withheld for missing aliases require a future explicit frontend unavailable state',()=>{
 const {source,policy}=fabricated('missing-alias'),value=projectCompetition(source,policy);
 const {componentInputs}=require('./support/projector-frontend-needs.cjs');
 const {buildMatchView}=require('../website/preview-data.js');
 const input=componentInputs(value).weeks[0];assert.equal(input.entriesStatus,'CLOSED');assert(!Object.hasOwn(value.weeks[0],'votes'));
 // This records a migration blocker, not permission to publish fake zero votes.
 const currentModel=buildMatchView(input,input.games[0]);assert.equal(currentModel.votes.total,0);
 assert.equal(value.standings[0].state,'WITHHELD');
});
test('reader accessors and invalid policy cannot leak exception values',()=>{
 const {policy}=fabricated();
 const reader=Object.defineProperty({},'readSnapshot',{get(){throw Error('FABRICATED_PRIVATE_MARKER');}});
 assert.throws(()=>projectFromReader(reader,policy),{message:'Invalid read-only interface'});
 assert.throws(()=>projectFromReader({readSnapshot:async()=>null},policy),{message:'Invalid read-only interface'});
 Object.defineProperty(policy,'now',{get(){throw Error('FABRICATED_PRIVATE_MARKER');}});
 assert.throws(()=>projectCompetition(null,policy),{message:'Invalid projector policy'});
});

test('approved team, matchup and Final labels normalize whitespace/case without accepting unknown labels',()=>{
 const {source,policy}=fabricated();
 source.games.forEach(g=>{g.game=' '+g.game.toLowerCase()+' ';g.status=' FINAL ';g.team1=' '+g.team1.toLowerCase()+' ';g.winner=' '+g.winner.toLowerCase()+' ';});
 source.weeks.forEach(w=>w.submissions.forEach(p=>{p.selections.forEach(s=>{s.game=' '+s.game.toLowerCase()+' ';s.pick=' '+s.pick.toLowerCase()+' ';});if(p.prediction)p.prediction.game=p.prediction.game.toLowerCase();}));
 const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert.equal(value.months[0].winner,COMET);valid(value,policy);
});

test('cross-week approval collisions cannot merge different private participants into one champion',()=>{
 const {source,policy}=fabricated();source.weeks[0].submissions.splice(1,1);source.weeks[1].submissions.splice(0,1);
 policy.aliases.get('fabricated-entry-b').player=COMET;
 const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert(value.weeks.every(w=>!Object.hasOwn(w,'picks')));assert.equal(value.months[0].winner,null);valid(value,policy);
});
test('explicit rollover and funding facts survive projection without exposing source accounting notes',()=>{
 const {source,policy}=fabricated();source.games[0].team2Score=source.games[0].team1Score;source.games[0].winner='Tie';
 const weekly=policy.accounting.get('W1').value;weekly.allocationState='CONFIRMED';weekly.allocations=[];weekly.rollover={to:'M1',cents:1000,notes:'FABRICATED_PRIVATE_MARKER'};
 const monthly=policy.accounting.get('M1').value;monthly.funding={rolloverCents:2000,monthlyPrizeCents:1000,seasonContributionCents:1000,monthlyShareBasisPoints:5000,seasonShareBasisPoints:5000,notes:'FABRICATED_PRIVATE_MARKER'};
 const value=projectCompetition(source,policy);assert.equal(value.state,'READY');assert.deepEqual(value.prizes[0].rollover,{to:'M1',cents:1000});assert.equal(value.prizes.find(p=>p.key==='M1').funding.seasonContributionCents,1000);assert(!JSON.stringify(value).includes('FABRICATED_PRIVATE_MARKER'));
 const trust=validationTrust(policy,value);for(const prize of value.prizes)trust.prizes.set(prize.key,prize);validatePublic(value,trust);
});
