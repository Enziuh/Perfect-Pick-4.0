'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const t=require('../tools/verification/disclosure-telemetry.cjs'),{createLegacyProvider}=require('../tools/api/legacy-provider.cjs'),{lateExample}=require('./support/pp3-api-example.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function run({enabled=false,failSink=false,mode='valid'}={}){
 const x=lateExample();x.cfg.authority=x.e.authority;if(mode==='withheld')x.e.authority.closures=[];
 if(mode==='alias')x.e.authority.aliases=[];
 const calls={},deps={...x.deps};for(const key of Object.keys(deps))if(typeof deps[key]==='function'){const f=deps[key];deps[key]=(...args)=>{calls[key]=(calls[key]||0)+1;return f(...args);};}
 if(mode==='failure')deps.context=()=>{calls.context=(calls.context||0)+1;throw Error('SECRET_PHONE_PICK_TIMESTAMP');};
 const logs=[],telemetry=t.create({enabled,until:x.e.policy.now+60000,now:()=>x.e.policy.now,sink:s=>{if(failSink)throw Error('SECRET');logs.push(s);}});
 deps.observeWeek10=telemetry.record;const result=createLegacyProvider(deps)();telemetry.finish();telemetry.finish();return {result,calls,logs};
}
test('enabled, disabled and failing-sink providers have identical outputs, hashes and private dependency call counts',()=>{
 for(const mode of ['valid','withheld','alias','failure']){const off=run({mode}),on=run({enabled:true,mode}),broken=run({enabled:true,failSink:true,mode});assert.deepEqual(on.result,off.result);assert.equal(hash(on.result),hash(off.result));assert.deepEqual(broken.result,off.result);assert.deepEqual(on.calls,off.calls);assert.deepEqual(broken.calls,off.calls);assert.equal(off.logs.length,0);assert.equal(on.logs.length,1);assert.equal(broken.logs.length,0);assert(!on.logs[0].includes('SECRET'));}
});
test('original W10 table reason is preserved, and source failure reports only a fixed stage/code',()=>{
 for(const mode of ['valid','withheld','alias']){const {logs,result}=run({enabled:true,mode});const receipt=JSON.parse(logs[0]),table=result.snapshot.standings.find(x=>x.key==='W10');assert.equal(receipt.week,10);assert.equal(receipt.state,table.state);assert.equal(receipt.reason,table.reason??'NONE');}
 const r=JSON.parse(run({enabled:true,mode:'failure'}).logs[0]);assert.equal(r.stage,'CONTEXT');assert.equal(r.state,'UNAVAILABLE');assert.equal(r.reason,'SOURCE_VALIDATION_FAILED');
});
test('unknown reasons and sensitive extra fields never enter the fixed telemetry schema',()=>{
 const logs=[],d=t.create({enabled:true,until:100,now:()=>1,sink:s=>logs.push(s)});d.record({stage:'SECRET',state:'SECRET',reason:'SECRET',phone:'SECRET',picks:['SECRET'],alias:'SECRET',timestamp:'SECRET',closurePresent:true,aliasesVerified:'SECRET'});d.finish();const r=JSON.parse(logs[0]);assert.deepEqual(Object.keys(r),['week','stage','state','reason','flags']);assert.equal(r.reason,'UNKNOWN');assert.deepEqual(r.flags,{closurePresent:true});assert(!logs[0].includes('SECRET'));
});
test('disabled, expired, unbounded or failing clocks cannot emit; finish emits at most once',()=>{
 for(const opts of [{},{enabled:false,until:20},{enabled:true,until:0},{enabled:true,until:86400002},{enabled:true,until:20,now:()=>{throw Error('SECRET');}}]){let calls=0;const d=t.create({now:()=>1,sink:()=>calls++,...opts});d.record({reason:'NONE'});d.finish();assert.equal(calls,0);}
 let clock=1,calls=0;const d=t.create({enabled:true,until:10,now:()=>clock,sink:()=>calls++});clock=10;d.finish();assert.equal(calls,0);
});
test('throwing observers cannot alter provider output or hide real source failure',()=>{
 const x=lateExample();x.cfg.authority=x.e.authority;const expected=x.get();assert.deepEqual(createLegacyProvider({...x.deps,observeWeek10(){throw Error('SECRET');}})(),expected);
});
test('telemetry module has no services, data readers, persistence, network, dynamic execution or raw logger',()=>{
 const source=fs.readFileSync('tools/verification/disclosure-telemetry.cjs','utf8');assert(!/SpreadsheetApp|FormApp|PropertiesService|UrlFetchApp|ScriptApp|fetch\(|getValues?\(|getDisplayValues?\(|setProperty|console\.|eval\(|Function\(/.test(source));
 const bundle=require('../tools/snapshots/cloud-package.cjs').render();assert(bundle.includes('const PP4_WEEK10_TELEMETRY_ENABLED=false;'));assert(bundle.includes('const PP4_WEEK10_TELEMETRY_UNTIL=0;'));assert(bundle.includes('finally{diagnostic.finish();}'));assert(!/function doGet|function doPost/.test(bundle));
});
test('telemetry cannot alter immutable snapshot bytes or protected competition artifacts',()=>{
 const file=fs.readFileSync('public-data/snapshot.json'),before=crypto.createHash('sha256').update(file).digest('hex');const logs=[],d=t.create({enabled:true,until:10,now:()=>1,sink:x=>logs.push(x)});d.record({stage:'PROJECTION',state:'WITHHELD',reason:'MISSING_ALIAS'});d.finish();assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public-data/snapshot.json')).digest('hex'),before);assert.equal(logs.length,1);
});
test('throwing observer accessors are contained, including the original failure path',()=>{
 const x=lateExample();x.cfg.authority=x.e.authority;const deps={...x.deps};Object.defineProperty(deps,'observeWeek10',{get(){throw Error('SECRET');}});assert.deepEqual(createLegacyProvider(deps)(),x.get());deps.context=()=>{throw Error('SECRET');};assert.deepEqual(createLegacyProvider(deps)(),{state:'UNAVAILABLE'});
});
test('fixed events in provider and projector contain only allowlisted primitives and no private objects',()=>{
 const acorn=require('../tools/vendor/acorn/acorn.cjs');let events=0;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='CallExpression'&&((n.callee.type==='Identifier'&&n.callee.name==='trace')||(n.callee.type==='Identifier'&&n.callee.name==='observeWeek10'))){const o=n.arguments[n.callee.name==='trace'?0:1];if(o?.type==='ObjectExpression'){events++;for(const p of o.properties){assert(p.type==='Property');assert(['stage','state','reason',...t.FLAGS].includes(p.key.name));assert(!['ArrayExpression','ObjectExpression','SpreadElement'].includes(p.value.type));}}}for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 for(const f of ['tools/api/legacy-provider.cjs','tools/projector/project-competition.cjs'])walk(acorn.parse(fs.readFileSync(f,'utf8'),{ecmaVersion:2020}));assert(events>=8);
});
test('provider output matches pinned pre-telemetry b7957d8 synthetic baselines',()=>{
 const expected={valid:'9c2d824fda51c201609eb8e07ea1174a75ae97392ddf9cd0f424839aee0d43e2',withheld:'9c950a10c92245bf41d05f4d705244a815f2e507d4d15e9bea60161f4da949ef',alias:'489c0ad2796ba65996e1ad58dbb2a123314b105a8c492f2dddbb5a505ff0922f'};
 for(const [mode,digest]of Object.entries(expected))assert.equal(hash(run({enabled:true,mode}).result),digest);
});
test('accessor values are captured once before validation and cannot swap a secret into output',()=>{
 const logs=[],d=t.create({enabled:true,until:10,now:()=>1,sink:s=>logs.push(s)}),counts={},event={};for(const [key,value]of Object.entries({stage:'SOURCE',state:'WITHHELD',reason:'INCOMPLETE',sourceComplete:false}))Object.defineProperty(event,key,{get(){counts[key]=(counts[key]||0)+1;return counts[key]===1?value:'SECRET';}});d.record(event);d.finish();assert(!logs[0].includes('SECRET'));assert(Object.values(counts).every(n=>n===1));
});
