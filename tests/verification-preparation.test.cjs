'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {createParser}=require('../tools/verification/timestamps.cjs');
const owner=require('../tools/verification/owner-evidence.cjs');
const {summarizeOffline}=require('../tools/verification/offline-report.cjs');
const {verifyRealCompetitionReadOnly_}=require('../tools/verification/disabled-entry.cjs');
const {create}=require('../tools/sheets/sheets-read-adapter.cjs');
const {buildOfflineBundle}=require('../tools/sheets/offline-bundle.cjs');
const {sheetsExample}=require('./support/sheets-example.cjs');
const {validationTrust}=require('./support/projector-examples.cjs');
const {example,AT,UNTIL,COMET}=require('./support/live-contract-examples.cjs');
const {writeDenyingServices}=require('./support/write-denying-services.cjs');
const serial=wall=>(Date.parse(wall)-Date.UTC(1899,11,30))/86400000;
const aliasRecords=()=>[{privateKey:'fabricated-entry-a',player:COMET,alias:'Synthetic Comet',approved:true,revision:1}];
const closedRecord=()=>({week:1,snapshotRevision:1,closureRevision:1,status:'CLOSED',mechanism:'OWNER_VERIFIED_CLOSURE',verifiedClosed:true,checkedAt:AT,validUntil:UNTIL,deadline:'2026-09-30T12:00:00.000Z'});
const context={revision:1,now:Date.parse(AT),maxAgeMs:300000};
for(const [local,utc] of [
 ['2026-01-15 12:00:00','2026-01-15T20:00:00.000Z'],
 ['2026-07-15 12:00:00','2026-07-15T19:00:00.000Z'],
 ['2026-03-08 01:59:59.123','2026-03-08T09:59:59.123Z'],
 ['2026-03-08 03:00:00','2026-03-08T10:00:00.000Z'],
 ['2026-11-01 02:00:00','2026-11-01T10:00:00.000Z'],
 ['2024-02-29 00:00:00','2024-02-29T08:00:00.000Z']
])test('configured Pacific timestamp: '+local,()=>assert.equal(createParser('America/Los_Angeles').parse(local),utc));
test('Date and canonical UTC values preserve the instant, including ambiguous local folds',()=>{
 const p=createParser('America/Los_Angeles');
 for(const utc of [AT,'2026-11-01T08:30:00.000Z','2026-11-01T09:30:00.000Z']){assert.equal(p.parse(new Date(utc)),utc);assert.equal(p.parse(utc),utc);}
 const foreign=vm.runInNewContext('new Date("2026-10-01T12:00:00.000Z")');assert.equal(p.parse(foreign),AT);
});
test('Sheet serials represent local calendar time with fractional milliseconds',()=>{
 const p=createParser('America/Los_Angeles');
 assert.equal(p.parse(serial('2026-10-01T05:00:00.000Z')),AT);
 assert.equal(p.parse(serial('2026-01-15T12:00:00.123Z')),'2026-01-15T20:00:00.123Z');
 assert.equal(createParser('Asia/Kolkata').parse('2026-01-15 12:00:00'),'2026-01-15T06:30:00.000Z');
});
test('ambiguous fall times and nonexistent spring times fail closed for strings and serials',()=>{
 const p=createParser('America/Los_Angeles');
 for(const s of ['2026-03-08 02:30:00','2026-11-01 01:30:00']){
  assert.throws(()=>p.parse(s),{message:'Unverifiable submission time'});
  assert.throws(()=>p.parse(serial(s.replace(' ','T')+'.000Z')),{message:'Unverifiable submission time'});
 }
});
test('malformed dates, guessed locale strings and missing timezone never become timestamps',()=>{
 const p=createParser('America/Los_Angeles');
 for(const v of ['',null,undefined,false,NaN,Infinity,-1,0,Date.now(),'10/01/26 5:00 AM','2026-02-29 12:00:00','2026-01-01 24:00:00','2026-02-30T00:00:00.000Z',new Date(NaN),{},'FORBIDDEN'])assert.throws(()=>p.parse(v),{message:'Unverifiable submission time'});
 for(const tz of ['',undefined,'Not/AZone'])assert.throws(()=>createParser(tz),{message:'Unverifiable submission time'});
});
test('timestamp interpretation is independent of host timezone',()=>{
 const file=path.resolve(__dirname,'../tools/verification/timestamps.cjs');
 const script=`process.stdout.write(require(${JSON.stringify(file)}).createParser('America/Los_Angeles').parse('2026-07-15 12:00:00'))`;
 for(const TZ of ['UTC','Asia/Tokyo','America/Los_Angeles'])assert.equal(execFileSync(process.execPath,['-e',script],{env:{...process.env,TZ},encoding:'utf8'}),'2026-07-15T19:00:00.000Z');
});
test('aliases require explicit private owner approval and never fall back to source names',()=>{
 const map=owner.aliases(aliasRecords(),1);assert.equal(map.get('fabricated-entry-a').alias,'Synthetic Comet');assert(Object.isFrozen(map.get('fabricated-entry-a')));
 for(const mutate of [r=>r[0].approved=false,r=>r[0].revision=2,r=>r[0].name='FORBIDDEN',r=>r[0].alias='<raw>',r=>r.push({...r[0],privateKey:'fabricated-entry-b'})]){const rows=aliasRecords();mutate(rows);assert.throws(()=>owner.aliases(rows,1),{message:'Invalid owner evidence'});}
 assert.equal(owner.aliases([],1).size,0);
});
test('owner closure must be explicit, verified, fresh, revision-bound and never inferred from deadlines',()=>{
 assert.equal(owner.closures([closedRecord()],context).size,1);
 for(const mutate of [r=>r.status='OPEN',r=>r.verifiedClosed=false,r=>r.mechanism='DEADLINE_ELAPSED',r=>r.snapshotRevision=2,r=>r.checkedAt='2026-09-30T12:00:00.000Z',r=>r.validUntil=AT]){const row=closedRecord();mutate(row);assert.equal(owner.closures([row],context).size,0);}
 assert.equal(owner.closures([],context).size,0);
 assert.throws(()=>owner.closures([closedRecord(),closedRecord()],context),{message:'Invalid owner evidence'});
});
test('realistic fabricated serials and explicit owner maps feed the existing read-only projector pipeline',()=>{
 const e=sheetsExample(),p=createParser('America/Los_Angeles');
 for(const row of e.matrix.Responses.slice(1))row[0]=serial('2026-10-01T05:00:00.000Z');
 e.dependencies.submissionTime=p.parse;
 const records=[...e.policy.aliases].map(([privateKey,a])=>({privateKey,player:a.player,alias:a.alias,approved:true,revision:1}));e.policy.aliases=owner.aliases(records,1);
 e.policy.closures=owner.closures([closedRecord(),{...closedRecord(),week:2}],context);
 const actual=create(e.dependencies,e.target,e.layout,e.policy).readPublicSnapshot();
 const expected=example();const report=summarizeOffline(actual,expected.snapshot,validationTrust(e.policy,actual),{legacyChampionOracle:true,candidateTrust:expected.trust});
 assert.equal(report.state,'VERIFIED_OFFLINE');assert.equal(report.counts.games,2);assert.equal(report.discrepancies,0);assert.equal(e.denied.attempts.length,0);
});
test('reports return only allowed counts/check states, never identities, inputs or private data',()=>{
 const a=example(),b=example('unresolved');const report=summarizeOffline(a.snapshot,b.snapshot,a.trust,{legacyChampionOracle:true});
 assert.equal(report.state,'DISCREPANCIES');assert.equal(report.discrepancies,1);
 assert.deepEqual(Object.keys(report),['state','counts','validation','checks','discrepancies']);
 assert.deepEqual(Object.keys(report.counts),['weeks','games','finalGames','availableScopes','withheldScopes']);
 assert(!/Synthetic|example|alias|player|phone|email|prediction|cents|38|40|44/.test(JSON.stringify(report)));
 for(const row of report.checks)assert.deepEqual(Object.keys(row),['code','state']);
});
test('unavailable, invalid, withheld and oracle-less comparisons cannot be labeled verified',()=>{
 const e=example();assert.equal(summarizeOffline(e.snapshot,e.snapshot,e.trust).state,'INCOMPLETE');
 assert.equal(summarizeOffline(e.snapshot,null,e.trust).state,'INCOMPLETE');
 const hidden=example('unknown');assert.equal(summarizeOffline(hidden.snapshot,hidden.snapshot,hidden.trust,{legacyChampionOracle:true}).state,'INCOMPLETE');
 const invalid=structuredClone(e.snapshot);invalid.notes='FORBIDDEN';const report=summarizeOffline(invalid,e.snapshot,e.trust);assert.equal(report.state,'INVALID');assert.equal(report.counts.games,0);assert(!JSON.stringify(report).includes('FORBIDDEN'));
});
test('incomplete snapshots, inconsistent headers and stale results remain safely unavailable in reports',()=>{
 for(const mutate of [e=>e.matrix.Results[0][0]='Missing',e=>e.proof.quiescent=false,e=>e.proof.observedAt='2026-09-30T12:00:00.000Z',e=>{e.state.onEvidence=(v,n)=>n===2?{...v,revision:2}:v;}]){
  const e=sheetsExample();mutate(e);const actual=create(e.dependencies,e.target,e.layout,e.policy).readPublicSnapshot();assert.equal(actual.state,'UNAVAILABLE');const base=example();const report=summarizeOffline(actual,base.snapshot,base.trust);assert.equal(report.validation,'UNAVAILABLE');assert.equal(report.counts.games,0);
 }
});
test('real-read entry remains disabled regardless of flags, callbacks, globals or purported owner input',()=>{
 let calls=0;const result=verifyRealCompetitionReadOnly_({enabled:true,owner:true,read(){calls++;throw Error('FORBIDDEN');}});
 assert.deepEqual(result,{state:'DISABLED',reason:'OWNER_AUTHORIZATION_AND_ISOLATION_REQUIRED'});assert.equal(calls,0);assert(Object.isFrozen(result));
 const denied=writeDenyingServices(),context=vm.createContext({...denied.globals,Map,Set,Date,Error});vm.runInContext(buildOfflineBundle(),context);
 const api=context.PerfectPick4ReadOnly;assert.equal(api.verifyRealCompetitionReadOnly_().state,'DISABLED');assert.equal(api.timestamps.createParser('America/Los_Angeles').parse('2026-07-15 12:00:00'),'2026-07-15T19:00:00.000Z');assert.deepEqual(denied.attempts,[]);assert.equal(context.doGet,undefined);assert.equal(context.doPost,undefined);
});
test('verification components have no read services, write actions, or public publication membership',()=>{
 const {FILES}=require('../tools/security/public-artifact.cjs');assert.equal(FILES.length,38);assert(!FILES.some(f=>/verification/.test(f)));
 for(const file of ['timestamps.cjs','owner-evidence.cjs','offline-report.cjs','disabled-entry.cjs']){
  const source=fs.readFileSync(path.resolve(__dirname,'../tools/verification',file),'utf8');assert(!/\b(?:SpreadsheetApp|FormApp|ScriptApp|PropertiesService|UrlFetchApp|fetch|console|Logger)\s*[.(]/.test(source));
 }
});
test('unsupported timezone runtime fails instead of using host-local interpretation',()=>{
 const code=fs.readFileSync(path.resolve(__dirname,'../tools/verification/timestamps.cjs'),'utf8');const context=vm.createContext({Intl:undefined});vm.runInContext(code,context);assert.throws(()=>context.PerfectPickTimestamp.createParser('America/Los_Angeles'),{message:'Unverifiable submission time'});
});
test('stale result evidence is rejected before report counts or comparison values are returned',()=>{
 const e=example(),stale=structuredClone(e.snapshot);stale.games[0].verifiedAt='2026-09-30T12:00:00.000Z';const report=summarizeOffline(stale,e.snapshot,e.trust);assert.equal(report.state,'INVALID');assert.equal(report.counts.games,0);assert.equal(report.checks.length,0);
});
