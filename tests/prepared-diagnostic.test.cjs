'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {runPreparedDiagnostic}=require('../tools/verification/prepared-diagnostic.cjs');
const {sheetsExample}=require('./support/sheets-example.cjs');
const pkg=require('../tools/verification/package.cjs');
const {buildOfflineBundle}=require('../tools/sheets/offline-bundle.cjs');
function setup(){
 const e=sheetsExample(),stages=[];
 for(const row of e.matrix.Responses.slice(1))row[0]=new Date(e.policy.now).toISOString();
 const config={target:e.target,timeZone:'America/Los_Angeles',revision:e.policy.revision,maxAgeMs:e.policy.maxAgeMs,layout:e.layout,
  policy:Object.fromEntries(['games','teams','periods','seasonWeeks','decisions','accounting'].map(k=>[k,e.policy[k]])),
  aliases:[...e.policy.aliases].map(([privateKey,a])=>({privateKey,...a,revision:e.policy.revision})),
  closures:[...e.policy.closures].map(([week,c])=>({week,snapshotRevision:c.snapshotRevision,closureRevision:c.entry.revision,status:'CLOSED',mechanism:'OWNER_VERIFIED_CLOSURE',verifiedClosed:true,checkedAt:c.entry.checkedAt,validUntil:c.entry.validUntil,deadline:c.entry.deadline}))};
 const dependencies={...e.dependencies,authorize(stage,scope){stages.push({stage,scope});return true;}};
 return {e,config,dependencies,stages,run:()=>runPreparedDiagnostic(dependencies,config)};
}
const shape=report=>{
 assert.deepEqual(Object.keys(report).sort(),['counts','readiness','state','validation']);
 assert.deepEqual(Object.keys(report.counts).sort(),['availableScopes','finalGames','games','weeks','withheldScopes']);
 assert(Object.values(report.counts).every(n=>Number.isSafeInteger(n)&&n>=0));
};
test('fabricated authorized diagnostic validates without returning raw records or comparison claims',()=>{
 const s=setup(),r=s.run();shape(r);assert.equal(r.state,'VALIDATED_READ');assert.equal(r.readiness,'PRIVATE_COMPARISON_REQUIRED');assert.equal(r.counts.games,2);assert.equal(s.e.calls.length,4);assert.deepEqual(s.e.denied.attempts,[]);
 assert.deepEqual(s.stages.map(s=>s.stage),['PREFLIGHT','BOUNDED_READ']);assert.equal(s.stages[1].scope.capture.resultRows,2);
 const text=JSON.stringify(r);for(const forbidden of ['FABRICATED','alias','player','prediction','selection','Phone','Timestamp','target','revision','p_','g_'])assert(!text.includes(forbidden));
});
test('missing, claimed, denied and throwing authorization never reach evidence or Sheets',()=>{
 for(const mutate of [s=>delete s.dependencies.authorize,s=>s.dependencies.authorize=true,s=>s.dependencies.authorize=()=>false,s=>s.dependencies.authorize=()=>{throw Error('FABRICATED_PRIVATE');}]){
  const s=setup();mutate(s);assert.equal(s.run().state,'BLOCKED');assert.equal(s.e.state.evidence,0);assert.equal(s.e.calls.length,0);
 }
 const s=setup();s.dependencies.authorize=stage=>stage==='PREFLIGHT';assert.equal(s.run().state,'BLOCKED');assert.equal(s.e.state.evidence,1);assert.equal(s.e.calls.length,0);
});
test('missing configuration, timezone, alias approval or authoritative closure prevents every read',()=>{
 for(const mutate of [s=>delete s.config.target,s=>s.config.extra='FABRICATED_PRIVATE',s=>s.config.timeZone='',s=>s.config.revision=-1,s=>s.config.maxAgeMs=0,s=>s.config.aliases=[],s=>s.config.aliases[0].approved=false,s=>s.config.closures=[],s=>s.config.closures[0].status='UNKNOWN',s=>s.config.closures[0].verifiedClosed=false,s=>s.config.closures[0].mechanism='DEADLINE_ELAPSED',s=>s.config.closures[0].snapshotRevision++,s=>s.config.closures[0].validUntil=s.config.closures[0].checkedAt]){
  const s=setup();mutate(s);const r=s.run();shape(r);assert.equal(r.state,'BLOCKED');assert.equal(s.e.calls.length,0);assert.equal(s.e.state.evidence,0);
 }
});
test('missing, stale, partial or changed capture evidence cannot authorize a data read',()=>{
 for(const mutate of [p=>delete p.resultRows,p=>p.resultRows=401,p=>p.responseRows=1001,p=>p.revision++,p=>p.quiescent=false,p=>p.observedAt='2020-01-01T00:00:00.000Z',p=>p.validUntil=p.observedAt,p=>p.notes='FABRICATED_PRIVATE']){
  const s=setup();s.e.state.onEvidence=p=>{mutate(p);return p;};assert.equal(s.run().state,'BLOCKED');assert.equal(s.e.calls.length,0);
 }
 const s=setup();s.e.state.onEvidence=(p,n)=>{if(n>1)p.responseRows++;return p;};assert.equal(s.run().state,'INCOMPLETE');assert.equal(s.e.calls.length,0);
});
test('bounded single-column paths exclude Name and notes and preserve strict rendering options',()=>{
 const s=setup();s.run();for(const call of s.e.calls){assert.equal(call.target,s.e.target);assert.equal(call.options.valueRenderOption,'UNFORMATTED_VALUE');assert.equal(call.options.dateTimeRenderOption,'SERIAL_NUMBER');for(const range of call.options.ranges){assert(/^'(Results|Responses)'![A-H]\d+:[A-H]\d+$/.test(range));if(range.startsWith("'Responses'"))assert(!/![BG]/.test(range));}}
 assert.equal(s.e.state.evidence,3);assert(s.e.calls.every(c=>c.options.ranges.every(r=>Number(r.match(/(\d+)$/)[1])<=s.e.proof.responseRows+2)));
});
test('unmapped entrants, inconsistent headers, partial results and timestamp errors remain redacted',()=>{
 for(const mutate of [s=>s.config.aliases.pop(),s=>s.e.matrix.Results[0][0]='WRONG',s=>s.e.matrix.Results.pop(),s=>s.e.matrix.Responses[1][0]='ambiguous',s=>s.e.matrix.Results[1][6]='invalid score']){
  const s=setup();mutate(s);const r=s.run();shape(r);assert.notEqual(r.state,'VALIDATED_READ');assert(!JSON.stringify(r).includes('FABRICATED'));assert.deepEqual(s.e.denied.attempts,[]);
 }
});
test('service exceptions never escape in diagnostic output or trigger fallback writes',()=>{
 const s=setup();s.dependencies.values={batchGet(){throw Error('FABRICATED_PRIVATE');}};const r=s.run();shape(r);assert.equal(r.state,'INCOMPLETE');assert(!JSON.stringify(r).includes('FABRICATED'));assert.deepEqual(s.e.denied.attempts,[]);
});
test('packaged coordinator remains private and entry stays unconditionally disabled',()=>{
 const s=setup(),context=vm.createContext({Map,Set,Date,Error,PP_OWNER_CONFIG:s.config,Sheets:new Proxy({}, {get(){throw Error('Native read denied');}})});
 vm.runInContext(pkg.render()['Verification.gs'],context);assert.deepEqual(Object.keys(context.PerfectPickVerificationPackage_),['diagnostic']);assert.equal(context.runPreparedDiagnostic,undefined);
 assert.equal(context.verifyPerfectPick4Package_(s.dependencies,s.config).state,'DISABLED');assert.equal(s.e.calls.length,0);assert.equal(context.doGet,undefined);assert.equal(context.doPost,undefined);
});
test('coordinator executes through the Apps Script-compatible offline assembly with denied services',()=>{
 const s=setup(),context=vm.createContext({...s.e.denied.globals,Map,Set,Date,Error});vm.runInContext(buildOfflineBundle(),context);
 assert.equal(context.PerfectPick4ReadOnly.runPreparedDiagnostic(s.dependencies,s.config).state,'VALIDATED_READ');assert.deepEqual(s.e.denied.attempts,[]);
});
