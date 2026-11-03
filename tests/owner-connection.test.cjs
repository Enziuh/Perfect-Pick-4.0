'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {createOwnerDiagnostic,META_FIELDS,VALUE_FIELDS}=require('../tools/verification/owner-connection.cjs');
const {sheetsExample}=require('./support/sheets-example.cjs');
const pkg=require('../tools/verification/package.cjs');
function setup(mode='VERIFY'){
 const e=sheetsExample();for(const row of e.matrix.Responses.slice(1))row[0]=new Date(e.policy.now).toISOString();
 const competition={target:e.target,timeZone:'America/Los_Angeles',revision:e.policy.revision,maxAgeMs:e.policy.maxAgeMs,layout:e.layout,policy:Object.fromEntries(['games','teams','periods','seasonWeeks','decisions','accounting'].map(k=>[k,e.policy[k]])),aliases:[...e.policy.aliases].map(([privateKey,a])=>({privateKey,...a,revision:e.policy.revision})),closures:[...e.policy.closures].map(([week,c])=>({week,snapshotRevision:c.snapshotRevision,closureRevision:c.entry.revision,status:'CLOSED',mechanism:'OWNER_VERIFIED_CLOSURE',verifiedClosed:true,checkedAt:c.entry.checkedAt,validUntil:c.entry.validUntil,deadline:c.entry.deadline}))};
 const config={activation:{enabled:true,soleOwnerReviewed:true,noPublicExecutionReviewed:true,readOnlyGrantsReviewed:true,notBefore:new Date(e.policy.now-1000).toISOString(),expiresAt:new Date(e.policy.now+60000).toISOString()},mode,competition,capture:{...e.proof},captureAuthorityReviewed:true,identityFormat:'EXACT_TEXT'};
 const nativeCalls=[];let loads=0;
 const deny=new Proxy({}, {get(_t,key){e.denied.attempts.push(String(key));throw Error('FORBIDDEN_NATIVE');}});
 const metadata={properties:{timeZone:competition.timeZone},sheets:['Results','Responses'].map(title=>({properties:{title,gridProperties:{rowCount:1100,columnCount:32}}}))};
 const methods={get(target,options){nativeCalls.push({target,options});assert.equal(target,e.target);assert.deepEqual(JSON.parse(JSON.stringify(options)),{ranges:["'Results'!A1","'Responses'!A1"],fields:META_FIELDS,includeGridData:false});return metadata;},Values:new Proxy({batchGet(target,options){assert.equal(options.fields,VALUE_FIELDS);return e.dependencies.values.batchGet(target,options);}}, {get(t,key){return key==='batchGet'?t[key]:deny[key];}})};
 const sheets={Spreadsheets:new Proxy(methods,{get(t,key){return ['get','Values'].includes(key)?t[key]:deny[key];}})};
 const run=createOwnerDiagnostic(()=>config,()=>{loads++;return sheets;},()=>e.state.clock);
 return {e,config,metadata,sheets,nativeCalls,run,get loads(){return loads;}};
}
function safe(result){
 assert.deepEqual(Object.keys(result).sort(),['aliases','closure','comparison','records','revision','schema','state','structure','timeZone','timestamps']);
 assert.deepEqual(Object.keys(result.structure).sort(),['discoveredTabs','expectedColumns','expectedTabs','matchedColumns']);
 assert.deepEqual(Object.keys(result.records).sort(),['completeness','responses','results']);
 const text=JSON.stringify(result);for(const marker of ['FABRICATED','Bears','Chiefs','Phone','Timestamp','W1 |','aliasName','p_','g_','Notes'])assert(!text.includes(marker));
}
test('native read-only connector calls only projected metadata get and bounded values reads',()=>{
 const s=setup(),r=s.run();safe(r);assert.equal(r.state,'VALIDATED_READ');assert.equal(r.comparison,'READY_FOR_PRIVATE_COMPARISON');assert.equal(r.records.results,2);assert.equal(r.schema,'VALID');assert.equal(r.timestamps,'COMPATIBLE');assert.equal(s.loads,1);assert.equal(s.nativeCalls.length,1);assert.equal(s.e.calls.length,5);assert.deepEqual(s.e.denied.attempts,[]);
 for(const c of s.e.calls)for(const range of c.options.ranges){assert(/^'(Results|Responses)'![A-H]\d+:[A-H]\d+$/.test(range));if(range.startsWith("'Responses'"))assert(!/![BG]/.test(range));}
 assert.equal(s.run().state,'BLOCKED');assert.equal(s.e.calls.length,5);
});
test('first-run STRUCTURE mode reads headers only and never projects unclosed player records',()=>{
 const s=setup('STRUCTURE');s.config.competition.aliases=[];s.config.competition.closures=[];s.config.capture=null;s.config.captureAuthorityReviewed=false;
 const r=s.run();safe(r);assert.equal(r.state,'STRUCTURE_CHECKED');assert.equal(r.closure,'UNVERIFIED');assert.equal(r.aliases,'UNVERIFIED');assert.equal(r.comparison,'BLOCKED');assert.equal(r.records.results,null);assert.equal(r.timestamps,'NOT_CHECKED');assert.equal(s.e.calls.length,1);assert(s.e.calls[0].options.ranges.every(r=>/^'(Results|Responses)'![A-Z]+1:[A-Z]+1$/.test(r)));assert.deepEqual(s.e.denied.attempts,[]);
});
test('disabled/missing private configuration never resolves native services or trusts call arguments',()=>{
 let loads=0;const run=createOwnerDiagnostic(()=>null,()=>{loads++;throw Error();},Date.now);assert.equal(run({enabled:true}).state,'DISABLED');assert.equal(run().state,'DISABLED');assert.equal(loads,0);
 const s=setup();s.config.activation.enabled=false;assert.equal(s.run().state,'DISABLED');assert.equal(s.loads,0);
});
test('authorization, layout, identity mode and required closure/alias/capture gates fail before native access',()=>{
 const changes=[s=>s.config.competition.layout.results.columns[0].sheet='UNAPPROVED_TAB',s=>s.config.competition.layout.responses.identity.extra='FABRICATED_PRIVATE',s=>s.config.activation.soleOwnerReviewed=false,s=>s.config.activation.noPublicExecutionReviewed=false,s=>s.config.activation.readOnlyGrantsReviewed=false,s=>s.config.activation.expiresAt=s.config.activation.notBefore,s=>s.config.activation.expiresAt=new Date(s.e.policy.now+600000).toISOString(),s=>s.config.identityFormat='AUTO_NAME',s=>delete s.config.competition.target,s=>s.config.competition.layout.results.columns[0].header='PRIVATE',s=>s.config.competition.closures=[],s=>s.config.competition.closures[0].status='UNKNOWN',s=>s.config.competition.closures[0].mechanism='DEADLINE_PASSED',s=>s.config.competition.aliases=[],s=>s.config.competition.aliases[0].approved=false,s=>s.config.capture=null,s=>s.config.captureAuthorityReviewed=false,s=>s.config.capture.resultRows=401,s=>s.config.capture.revision++,s=>s.config.capture.observedAt='2020-01-01T00:00:00.000Z',s=>s.config.capture.notes='FABRICATED_PRIVATE'];
 for(const mutate of changes){const s=setup();mutate(s);const r=s.run();safe(r);assert.equal(r.state,'BLOCKED');assert.equal(s.loads,0);assert.equal(s.e.calls.length,0);}
});
test('missing tabs, wrong timezone, invalid capacities or unexpected headers block without body reads',()=>{
 for(const mutate of [s=>s.metadata.sheets.pop(),s=>s.metadata.sheets[0].properties.title='FABRICATED_PRIVATE',s=>s.metadata.properties.timeZone='UTC',s=>s.metadata.sheets[0].properties.gridProperties.rowCount=1,s=>s.metadata.sheets[0].properties.gridProperties.columnCount=1,s=>s.e.matrix.Results[0][0]='FABRICATED_PRIVATE']){
  const s=setup();mutate(s);const r=s.run();safe(r);assert.equal(r.state,'BLOCKED');assert(s.e.calls.length<=1);assert.deepEqual(s.e.denied.attempts,[]);
 }
});
test('partial, changing, stale or invalid snapshots and absent participant aliases never pass comparison readiness',()=>{
 for(const mutate of [s=>s.e.matrix.Results.pop(),s=>s.e.state.onRead=(m,n)=>{if(n===3)m.Results[1][6]=99;},s=>s.e.state.onRead=()=>{s.e.state.clock+=600000;},s=>s.e.matrix.Responses[1][0]='bad timestamp',s=>s.config.competition.aliases.pop(),s=>s.e.matrix.Results[1][6]='bad score']){
  const s=setup();mutate(s);const r=s.run();safe(r);assert.notEqual(r.comparison,'READY_FOR_PRIVATE_COMPARISON');assert.deepEqual(s.e.denied.attempts,[]);
 }
});
test('native permission/errors and malicious response header values never leak exception payloads',()=>{
 const s=setup();const run=createOwnerDiagnostic(()=>s.config,()=>{throw Error('FABRICATED_PRIVATE');},()=>s.e.state.clock);safe(run());assert.equal(s.e.calls.length,0);
 const t=setup();t.e.state.transform=()=>({valueRanges:[{range:'FABRICATED_PRIVATE'}]});safe(t.run());assert.deepEqual(t.e.denied.attempts,[]);
});
test('exact generated package is disabled even with injected globals and write-denying native services',()=>{
 const s=setup(),context=vm.createContext({...s.e.denied.globals,Map,Set,Date,Error,Sheets:s.sheets,PP_OWNER_CONFIG:s.config});vm.runInContext(pkg.render()['Verification.gs'],context);assert.equal(context.verifyPerfectPick4Package_(s.config).state,'DISABLED');assert.equal(context.verifyPerfectPick4Package_().state,'DISABLED');assert.equal(s.nativeCalls.length,0);assert.equal(s.e.calls.length,0);assert.deepEqual(s.e.denied.attempts,[]);assert.deepEqual(Object.keys(context.PerfectPickVerificationPackage_),['diagnostic']);assert.equal(context.doGet,undefined);assert.equal(context.doPost,undefined);
});
test('owner-private source activation exercises actual generated native connection in VM without new globals',()=>{
 const s=setup();
 // Only fabricated test compilation replaces the private null provider. It is NOT a shippable artifact.
 const source=pkg.render()['Verification.gs'].replace('// BEGIN OWNER-PRIVATE CONFIGURATION (remote isolated editor only)\n return null;','// BEGIN OWNER-PRIVATE CONFIGURATION (remote isolated editor only)\n return fabricatedConfig;');
 assert.notEqual(source,pkg.render()['Verification.gs']);assert.throws(()=>pkg.inspect({...pkg.render(),'Verification.gs':source}));
 const Clock=class extends Date {static now(){return s.e.state.clock;}};
 const context=vm.createContext({...s.e.denied.globals,Map,Set,Date:Clock,Error,Sheets:s.sheets,fabricatedConfig:s.config});vm.runInContext(source,context);const r=context.verifyPerfectPick4Package_();assert.equal(r.comparison,'READY_FOR_PRIVATE_COMPARISON');assert.equal(r.records.results,2);assert.deepEqual(s.e.denied.attempts,[]);
});
test('write requests, arbitrary dispatch and stale closure cannot be configured into native execution',()=>{
 for(const mutate of [s=>s.config.action='update',s=>s.config.mode='WRITE',s=>s.config.competition.closures[0].validUntil=s.config.competition.closures[0].checkedAt,s=>s.config.activation.notBefore=new Date(s.e.policy.now+1000).toISOString()]){
  const s=setup();mutate(s);assert.equal(s.run().state,'BLOCKED');assert.equal(s.loads,0);assert.deepEqual(s.e.denied.attempts,[]);
 }
 const fs=require('node:fs');const source=fs.readFileSync(require.resolve('../tools/verification/owner-connection.cjs'),'utf8');
 const calls=[...source.matchAll(/sheets\.Spreadsheets\.([A-Za-z.]+)\(/g)].map(m=>m[1]);assert.deepEqual(calls,['get','Values.batchGet','Values.batchGet']);
 for(const forbidden of [/\bSpreadsheetApp\b/,/\bPropertiesService\b/,/\bFormApp\b/,/\bScriptApp\b/,/\bSession\b/,/\b(?:Logger|console)\s*\./,/\.(?:update|batchUpdate|append|clear|setValue|setValues)\s*\(/])assert(!forbidden.test(source));
});

test('header mismatch reports only safe progress counts and fixed schema status',()=>{
 const s=setup('STRUCTURE');s.e.matrix.Results[0][1]='FABRICATED_PRIVATE_HEADER';const r=s.run();safe(r);assert.equal(r.state,'BLOCKED');assert.equal(r.schema,'HEADER_MISMATCH');assert.equal(r.structure.discoveredTabs,2);assert.equal(r.structure.matchedColumns,1);assert.equal(r.comparison,'BLOCKED');assert.equal(r.records.results,null);
});
