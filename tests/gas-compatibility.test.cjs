'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {checkAppsScriptCompatibility}=require('../tools/verification/gas-compatibility.cjs');
const pkg=require('../tools/verification/package.cjs');
const {buildOfflineBundle}=require('../tools/sheets/offline-bundle.cjs');
const {sheetsExample}=require('./support/sheets-example.cjs');
const {writeDenyingServices}=require('./support/write-denying-services.cjs');
test('independent ES2020 grammar catches logical assignment accepted by modern Node',()=>{
 for(const operator of ['&&=','||=','??=']){
  const source=`let total={hasTotals:true};let row={totalPicks:1};total.hasTotals ${operator} row.totalPicks!==undefined;`;
  assert.doesNotThrow(()=>new vm.Script(source));
  assert.throws(()=>checkAppsScriptCompatibility(source,'regression'),/^Error: ES2020 syntax rejected in regression at 1:/);
 }
});
test('grammar gate rejects later syntax and modules rather than merely scanning operator strings',()=>{
 for(const source of ['const n=1_000;','class X { value=1; }','class X { #value=1; }','class X { static {} }','export const x=1;','await Promise.resolve();','const r=/x/d;'])assert.throws(()=>checkAppsScriptCompatibility(source));
 for(const source of ['const value="a &&= b"; // x ||= 1\n','const r=/&&=/;','const obj={value:1}; if(obj.value)obj.value=2;','const x={a:1};const y=x?.a ?? 0;'])assert.doesNotThrow(()=>checkAppsScriptCompatibility(source));
});
test('post-2020 APIs are rejected even when the grammar is otherwise valid',()=>{
 for(const source of ['Object.hasOwn({},"a");','Object["hasOwn"]({},"a");','[1].at(0);','"x".replaceAll("x","y");','[1].findLast(x=>x);','Object.groupBy([],x=>x);','Promise.any([]);'])assert.throws(()=>checkAppsScriptCompatibility(source),/^Error: Post-2020 runtime API rejected/);
});
test('compatibility checker fails closed when pinned parser is missing, modified or wrong version',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../tools/verification/gas-compatibility.cjs'),'utf8');
 for(const mode of ['missing','modified','wrong-version']){
  const module={exports:{}};
  const fakeFs=mode==='missing'?{lstatSync(){throw Error('missing');}}:mode==='modified'?{lstatSync(){return {isSymbolicLink:()=>false};},readFileSync(){return Buffer.from('modified');}}:fs;
  const requireFake=name=>name==='node:fs'?fakeFs:name.includes('acorn.cjs')?{version:'0'}:require(name);
  vm.runInNewContext('(function(require,module,__dirname){'+source+'\n})') (requireFake,module,path.resolve(__dirname,'../tools/verification'));
  assert.throws(()=>module.exports.checkAppsScriptCompatibility('const x=1;'),{message:'Required compatibility parser unavailable or invalid'});
 }
});
test('vendored dependency is pinned, MIT licensed and never part of Apps Script or Pages',()=>{
 const dir=path.resolve(__dirname,'../tools/vendor/acorn'),meta=JSON.parse(fs.readFileSync(path.join(dir,'PROVENANCE.json')));
 assert.equal(meta.version,'8.15.0');assert.equal(meta.license,'MIT');
 for(const [file,field] of [['acorn.cjs','sha256'],['LICENSE','licenseSha256']])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex'),meta[field]);
 const source=pkg.render()['Verification.gs'];assert(!source.includes('Acorn'));assert(!source.includes('ecmaVersion'));assert(!pkg.SOURCES.some(p=>p.includes('vendor')));
 const {FILES}=require('../tools/security/public-artifact.cjs');assert.equal(FILES.length,6);assert(!FILES.some(p=>/vendor|acorn|compatibility/.test(p)));
});
test('source and generated package are ES2020-compatible and package inspection enforces the gate',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../tools/contracts/live-contract.cjs'),'utf8');
 assert(source.includes('if(total.hasTotals)total.hasTotals=row.totalPicks!==undefined;'));
 for(const file of pkg.SOURCES.filter(file=>file.endsWith('.cjs')&&!file.endsWith('offline-bundle.cjs')))checkAppsScriptCompatibility(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),file);
 const content=pkg.render();assert.equal(checkAppsScriptCompatibility(content['Verification.gs']).grammar,'ECMAScript 2020');
 assert.throws(()=>pkg.inspect({...content,'Verification.gs':content['Verification.gs']+'\nlet x=true; x &&= false;'}),/^Error: ES2020 syntax rejected/);
});
test('package and fabricated pipeline run with post-2020 built-ins unavailable',()=>{
 const denied=writeDenyingServices(),context=vm.createContext({...denied.globals,Map,Set,Date,Error});
 vm.runInContext('Object.hasOwn=undefined; String.prototype.replaceAll=undefined; Array.prototype.at=undefined; Array.prototype.findLast=undefined; Promise.any=undefined;',context);
 vm.runInContext(pkg.render()['Verification.gs'],context);assert.equal(context.verifyPerfectPick4Package_().state,'DISABLED');assert.equal(context.PerfectPick4ReadOnly,undefined);
 vm.runInContext(buildOfflineBundle(),context);const api=context.PerfectPick4ReadOnly;
 for(const scenario of ['decisive','unresolved','unknown','missing-alias','pending']){
  const e=sheetsExample(scenario);e.dependencies.projectCompetition=api.projectCompetition;
  const result=api.create(e.dependencies,e.target,e.layout,e.policy).readPublicSnapshot();assert.equal(result.state,'READY');assert.equal(e.denied.attempts.length,0);
 }
 assert.deepEqual(denied.attempts,[]);
});
test('missing weekly totalPicks is never treated as zero when validating aggregate totals',()=>{
 const {example}=require('./support/live-contract-examples.cjs'),{validatePublic}=require('../tools/contracts/live-contract.cjs');
 const {snapshot,trust}=example();delete snapshot.standings[0].rows[0].totalPicks;
 assert.throws(()=>validatePublic(snapshot,trust),{message:'Invalid public contract'});
 snapshot.standings.filter(s=>s.scope!=='WEEKLY').forEach(s=>delete s.rows.find(r=>r.player==='p_example01').totalPicks);
 assert.equal(validatePublic(snapshot,trust),snapshot);
});
