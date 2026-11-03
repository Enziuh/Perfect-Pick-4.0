'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {create}=require('../tools/sheets/sheets-read-adapter.cjs');
const {buildOfflineBundle}=require('../tools/sheets/offline-bundle.cjs');
const {sheetsExample}=require('./support/sheets-example.cjs');
const {validatePublic}=require('../tools/contracts/live-contract.cjs');
const {validationTrust}=require('./support/projector-examples.cjs');
const {writeDenyingServices}=require('./support/write-denying-services.cjs');
const run=e=>create(e.dependencies,e.target,e.layout,e.policy).readPublicSnapshot();
const valid=(value,e)=>validatePublic(value,validationTrust({aliases:e.policy.aliases,closures:e.policy.closures,accounting:e.policy.accounting,maxAgeMs:e.policy.maxAgeMs,now:e.state.clock},value));
for(const scenario of ['decisive','unresolved','pending','unknown','missing-alias','no-eligible','in-progress','zero-completed']){
 test('bounded fabricated Sheets pipeline: '+scenario,()=>{
  const e=sheetsExample(scenario),value=run(e);assert.equal(value.state,'READY');valid(value,e);
  assert(!/FABRICATED|Phone Number|Timestamp|spreadsheetId|Notes/.test(JSON.stringify(value)));
  assert.equal(e.calls.length,4);assert.equal(e.denied.attempts.length,0);
 });
}
test('read interface has no write actions; requests are exact bounded columns only',()=>{
 const e=sheetsExample(),reader=create(e.dependencies,e.target,e.layout,e.policy);
 assert.deepEqual(Object.keys(reader),['readPublicSnapshot']);reader.readPublicSnapshot();
 for(const c of e.calls){assert.equal(c.options.valueRenderOption,'UNFORMATTED_VALUE');assert.equal(c.options.dateTimeRenderOption,'SERIAL_NUMBER');assert.equal(c.options.majorDimension,'ROWS');
  for(const r of c.options.ranges){assert(/^'(Results|Responses)'![A-Z]+\d+:[A-Z]+\d+$/.test(r));assert(!/^'Responses'![BG]/.test(r));assert(!/^'Results'![IJ]/.test(r));}
 }
 for(const method of ['update','batchUpdate','append','clear'])assert.throws(()=>e.dependencies.values[method](),{message:'Service operation denied'});
 assert.equal(e.denied.attempts.length,4);
});
test('unknown, expired and mismatched closure prevents all response reads',()=>{
 for(const mutate of [p=>p.closures.clear(),p=>{for(const c of p.closures.values())c.entry.status='OPEN';},p=>{for(const c of p.closures.values())c.snapshotRevision++;},p=>{for(const c of p.closures.values())c.entry.validUntil='2026-10-01T12:00:00.000Z';}]){
  const e=sheetsExample();mutate(e.policy);const value=run(e);assert.equal(value.state,'READY');valid(value,e);assert(e.calls.every(c=>c.options.ranges.every(r=>r.startsWith("'Results'!"))));assert(value.weeks.every(w=>!Object.hasOwn(w,'picks')&&!Object.hasOwn(w,'votes')));
 }
});
test('mixed weeks read only closed selection and prediction columns',()=>{
 const e=sheetsExample('unknown'),value=run(e);valid(value,e);
 assert(e.calls.every(c=>c.options.ranges.every(r=>!/^'Responses'![EF]/.test(r))));assert(!Object.hasOwn(value.weeks[1],'picks'));assert.equal(value.months[0].winner,null);
});
test('absent approvals cannot become real-name aliases or partial standings',()=>{
 const e=sheetsExample();e.policy.aliases.clear();const value=run(e);assert.equal(value.state,'READY');valid(value,e);assert(value.standings.every(s=>s.state==='WITHHELD'));assert(value.weeks.every(w=>!Object.hasOwn(w,'picks')));
});
test('missing/moved headers fail before any body or private identity read',()=>{
 for(const mutate of [e=>e.matrix.Results[0][0]='',e=>e.matrix.Responses[0][2]='Name',e=>e.matrix.Responses[0][5]='',e=>e.matrix.Results[0][6]='Unknown']){
  const e=sheetsExample();mutate(e);const value=run(e);assert.equal(value.state,'UNAVAILABLE');assert.equal(e.calls.length,1);assert(e.calls[0].options.ranges.every(r=>/1:[A-Z]+1$/.test(r)));valid(value,e);
 }
});
test('missing configured required game/prediction or duplicate columns are rejected',()=>{
 for(const mutate of [l=>l.results.columns.pop(),l=>l.responses.games.pop(),l=>l.responses.predictions.pop(),l=>l.responses.identity.column=2,l=>l.responses.timestamp.column=3,l=>l.results.sheet='Other']){
  const e=sheetsExample();mutate(e.layout);
  if(e.layout.responses.identity.column===2){assert.equal(run(e).state,'UNAVAILABLE');}else assert.throws(()=>create(e.dependencies,e.target,e.layout,e.policy),{message:'Invalid Sheets reader configuration'});
 }
});
test('absent/stale/completeness evidence never authorizes a read',()=>{
 for(const mutate of [e=>e.dependencies.readEvidence=()=>null,e=>e.proof.observedAt='2026-09-30T12:00:00.000Z',e=>e.proof.quiescent=false,e=>delete e.proof.responseRows,e=>e.proof.revision++,e=>e.proof.responseRows=1001]){
  const e=sheetsExample();mutate(e);const value=run(e);assert.equal(value.state,'UNAVAILABLE');assert.equal(e.calls.length,0);valid(value,e);
 }
});
test('post-read revision, row-count and freshness changes fail closed',()=>{
 for(const key of ['revision','resultRows','responseRows']){
  const e=sheetsExample();e.state.onEvidence=(proof,n)=>n===2?{...proof,[key]:proof[key]+1}:proof;assert.equal(run(e).state,'UNAVAILABLE');
 }
 const e=sheetsExample();e.state.onRead=(_m,n)=>{if(n===4)e.state.clock+=600000;};const value=run(e);assert.equal(value.state,'UNAVAILABLE');valid(value,e);
});
test('changing scores or late appended submissions cannot pass repeated-read checks',()=>{
 for(const mutate of [e=>{e.state.onRead=(m,n)=>{if(n===2)m.Results[1][6]=99;};},e=>{e.state.onRead=(m,n)=>{if(n===2)m.Responses.push([...m.Responses[1]]);};}]){
  const e=sheetsExample();mutate(e);const value=run(e);assert.equal(value.state,'UNAVAILABLE');valid(value,e);
 }
});
test('partial, reordered, duplicated or overflowing ranges cannot become complete source records',()=>{
 for(const transform of [r=>({...r,valueRanges:r.valueRanges.slice(1)}),r=>({...r,valueRanges:r.valueRanges.slice().reverse()}),r=>({...r,valueRanges:r.valueRanges.map((v,i)=>i===1?r.valueRanges[0]:v)}),r=>({...r,valueRanges:r.valueRanges.map(v=>({...v,majorDimension:'COLUMNS'}))})]){
  const e=sheetsExample();e.state.transform=transform;assert.equal(run(e).state,'UNAVAILABLE');
 }
 const e=sheetsExample();e.matrix.Results.push([...e.matrix.Results[1]]);assert.equal(run(e).state,'UNAVAILABLE');
 const missing=sheetsExample();missing.matrix.Responses[2][2]='';assert.equal(run(missing).state,'UNAVAILABLE');
});
test('numeric scores normalize and missing FINAL scores never become zero',()=>{
 const tied=sheetsExample();tied.matrix.Results[1][6]=0;tied.matrix.Results[1][7]='0';tied.matrix.Results[1][2]='Tie';const value=run(tied);assert.equal(value.state,'READY');assert.equal(value.games[0].homeScore,0);assert.equal(value.games[0].winner,'TIE');valid(value,tied);
 for(const score of ['',null,'1.5',false,'FORBIDDEN']){const e=sheetsExample();e.matrix.Results[1][6]=score;const value=run(e);assert.equal(value.state,'UNAVAILABLE');assert(!JSON.stringify(value).includes('FORBIDDEN'));}
});
test('submission time and identity codecs are explicit, never locale/timezone guesses',()=>{
 for(const mutate of [e=>e.matrix.Responses[1][0]='10/01/26',e=>e.matrix.Responses[1][2]=12345,e=>e.dependencies.submissionTime=()=>{throw Error('FABRICATED_PRIVATE');}]){
  const e=sheetsExample();mutate(e);const value=run(e);assert.equal(value.state,'UNAVAILABLE');assert(!JSON.stringify(value).includes('FABRICATED_PRIVATE'));valid(value,e);
 }
});
test('service errors never expose target, raw rows or provider error text',()=>{
 const e=sheetsExample();e.dependencies.values={batchGet(){throw Error('FABRICATED_TARGET FABRICATED_PRIVATE');}};const value=run(e);assert.equal(value.state,'UNAVAILABLE');assert(!JSON.stringify(value).includes('FABRICATED'));valid(value,e);
});
test('Apps Script-style bundle runs without Node globals and denies native services',()=>{
 const denied=writeDenyingServices(),context=vm.createContext({...denied.globals,Map,Set,Date,Error});
 const bundle=buildOfflineBundle();assert(!/node:|fs\.read|apps-script\/src/.test(bundle));vm.runInContext(bundle,context);assert.equal(context.require,undefined);assert.equal(context.module,undefined);
 const api=context.PerfectPick4ReadOnly;
 for(const scenario of ['decisive','unknown','unresolved','missing-alias']){
  const e=sheetsExample(scenario);e.dependencies.projectCompetition=api.projectCompetition;
  const value=api.create(e.dependencies,e.target,e.layout,e.policy).readPublicSnapshot();assert.equal(value.state,'READY');assert.equal(e.denied.attempts.length,0);
 }
 assert.deepEqual(denied.attempts,[]);
});
test('Sheets modules stay outside the exact synthetic publication and current runtime',()=>{
 const {FILES}=require('../tools/security/public-artifact.cjs');assert.equal(FILES.length,6);assert(!FILES.some(f=>/sheets|bundle/.test(f)));
 for(const file of ['app.js','preview-data.js','config.js','index.html'])assert(!fs.readFileSync(path.resolve(__dirname,'../website',file),'utf8').includes('PerfectPick4ReadOnly'));
});

test('private policy fields and provider metadata are never enumerated into the public pipeline',()=>{
 const e=sheetsExample();Object.defineProperty(e.policy,'notes',{enumerable:true,get(){throw Error('FABRICATED_PRIVATE');}});
 const value=run(e);assert.equal(value.state,'READY');valid(value,e);assert(!JSON.stringify(value).includes('FABRICATED'));
});
