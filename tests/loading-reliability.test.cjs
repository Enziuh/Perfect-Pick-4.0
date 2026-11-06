'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {install}=require('../tools/api/browser-client.cjs'),{example}=require('./support/pp3-api-example.cjs');
const endpoint='https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec';
function harness(){const x=example();x.cfg.authority=x.e.authority;let now=x.e.policy.now;const events=[],waits=[],timers=[],handlers={},intervals=[];let calls=0,mode='valid';
 const root={AbortController,Event:class{constructor(type){this.type=type;}},setTimeout(fn,ms){if(ms<2000){waits.push(ms);queueMicrotask(fn);}else timers.push({fn,ms});return timers.length;},clearTimeout(){},setInterval(fn){intervals.push(fn);},document:{hidden:false,getElementById:()=>null,addEventListener:(k,f)=>handlers[k]=f,dispatchEvent:e=>events.push(e.type)},fetch:async(url,options)=>{calls++;assert.equal(url,endpoint+'?action=dashboard4&rules=LATE_ENTRY_V1');assert.equal(options.credentials,'omit');if(mode==='network'||mode==='recover'&&calls<3)throw Error('PRIVATE_FAILURE');if(mode==='timeout')return new Promise((_,reject)=>{options.signal.addEventListener('abort',()=>reject(Error('PRIVATE_ABORT')));queueMicrotask(()=>timers.findLast(t=>t.ms===20000).fn());});return {ok:mode!=='http',url:endpoint,headers:{get:()=>mode==='html'?'text/html':'application/json'},text:async()=>mode==='malformed'?'PRIVATE_JSON_FAILURE':JSON.stringify(x.get())};}};
 return {root,x,events,waits,timers,intervals,setMode:v=>mode=v,clock:()=>now,advance:ms=>now+=ms,calls:()=>calls};}
async function run(fn){const h=harness(),real=Date.now;Date.now=h.clock;try{install(h.root,{endpoint});await fn(h);}finally{Date.now=real;}}
test('transient failures retry exactly twice with bounded backoff and coalesce concurrent consumers',()=>run(async h=>{h.setMode('recover');const out=await Promise.all([h.root.PerfectPickPreview.get('prizes'),h.root.PerfectPickPreview.get('week','&week=1')]);assert.equal(out.length,2);assert.equal(h.calls(),3);assert.deepEqual(h.waits,[400,1200]);assert(!h.events.includes('perfectpick:unavailable'));}));
test('network, HTTP, HTML, malformed and timed-out responses stop after three attempts without sensitive errors',async()=>{for(const mode of ['network','http','html','malformed','timeout'])await run(async h=>{h.setMode(mode);await assert.rejects(h.root.PerfectPickPreview.get('prizes'),{message:'Competition data unavailable'});assert.equal(h.calls(),3);assert.deepEqual(h.waits,[400,1200]);assert(h.events.includes('perfectpick:unavailable'));});});
test('failed background refresh retains only unexpired data; expiry still removes player disclosure and champion access',()=>run(async h=>{await h.root.PerfectPickPreview.get('prizes');h.setMode('network');await h.intervals[0]();assert(h.events.includes('perfectpick:degraded'));assert(!h.events.includes('perfectpick:unavailable'));const week=await h.root.PerfectPickPreview.get('week','&week=1');assert(week.standings.length);assert.equal(h.calls(),4);h.advance(120001);await h.intervals[0]();assert(h.events.includes('perfectpick:unavailable'));await assert.rejects(h.root.PerfectPickPreview.get('week','&week=1'));assert.throws(()=>h.root.PerfectPickPreview.resolveMonthlyChampion({},[{}]));assert.equal(h.calls(),7);}));
test('early refresh is scheduled before evidence expiry, and a forced retry can recover after initial failure',()=>run(async h=>{h.setMode('network');await assert.rejects(h.root.PerfectPickPreview.get('prizes'));h.setMode('valid');await h.intervals[0]();assert((await h.root.PerfectPickPreview.get('prizes')).weekly.length);assert(h.timers.some(t=>t.ms===90000));assert(h.timers.some(t=>t.ms===120000));}));
test('an older but otherwise valid response cannot overwrite a newer successful snapshot',()=>run(async h=>{
 const older=h.x.get();await h.root.PerfectPickPreview.get('prizes');h.advance(5000);h.x.e.policy.now=h.clock();
 await h.intervals[0]();const latest=await h.root.PerfectPickPreview.get('prizes');assert.equal(latest.generatedAt,new Date(h.clock()).toISOString());
 h.root.fetch=async()=>({ok:true,url:endpoint,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(older)});
 await h.intervals[0]();assert.equal((await h.root.PerfectPickPreview.get('prizes')).generatedAt,latest.generatedAt);
 assert(h.events.includes('perfectpick:invalid'));assert(!h.events.includes('perfectpick:unavailable'));
}));
test('coalesced forced refreshes publish one update and never create simultaneous fetches',()=>run(async h=>{
 await h.root.PerfectPickPreview.get('prizes');const before=h.events.filter(e=>e==='perfectpick:refresh').length;
 await Promise.all([h.intervals[0](),h.intervals[0](),h.intervals[0]()]);assert.equal(h.calls(),2);
 assert.equal(h.events.filter(e=>e==='perfectpick:refresh').length-before,1);
}));
test('availability metadata labels only approved CLOSED scopes and never carries picks or predictions',()=>run(async h=>{
 const prizes=await h.root.PerfectPickPreview.get('prizes');assert(prizes.weekAvailability.length);
 for(const w of prizes.weekAvailability)assert.deepEqual(Object.keys(w).sort(),['entriesStatus','hasPlayers','visibility','week']);
 assert(prizes.weekAvailability.every(w=>!w.hasPlayers||w.entriesStatus==='CLOSED'&&w.visibility==='AVAILABLE'));
}));
