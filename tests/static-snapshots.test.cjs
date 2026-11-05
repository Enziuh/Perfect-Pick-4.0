'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {example}=require('./support/pp3-api-example.cjs');
const {generate,stage,verify,readPublicApi}=require('../tools/snapshots/publisher.cjs');
const identity=require('../tools/snapshots/identity-store.cjs'),schema=require('../tools/snapshots/schema.cjs');
const {decode}=require('../tools/api/browser-client.cjs'),{install}=require('../tools/snapshots/browser-client.cjs');
function setup(){const x=example();x.cfg.authority=x.e.authority;const reply=x.get(),now=x.e.policy.now,approval={approvedAliases:new Map(reply.aliases.map(a=>[a.player,a.alias]))};return {x,reply,now,approval,build:(r=reply,s={version:1,entries:[]})=>generate(r,s,now,approval)};}
test('snapshot allowlist removes all private source identities and preserves scoring/champion/prize parity',()=>{
 const s=setup(),{file,store}=s.build(),text=JSON.stringify(file),model=schema.validate(file,s.now),before=decode(s.reply,s.now);
 for(const a of s.reply.aliases)assert(!text.includes(a.player));
 for(const row of s.x.matrix.Responses.slice(1))assert(!text.includes(row[2]));
 assert(!text.includes('PRIVATE_'));assert(!text.includes('sourceKey'));assert.equal(store.entries.length,2);
 for(const key of ['weeks','matchViews','prizes','prizeViews','resolutions'])assert.deepEqual(model[key],before[key]);
 const again=s.build(s.reply,store);assert.deepEqual(again.store,store);assert.deepEqual(again.file,file);
 assert(file.payload.aliases.every(a=>/^p_[a-f0-9]{32}$/.test(a.player)));
});
test('public IDs use independent 128-bit CSPRNG bytes and collisions are rejected, never phone hashes',()=>{
 const store={version:1,entries:[]},keys=['p_original001','p_original002'];let calls=0;
 const assigned=identity.assign(store,keys,n=>{assert.equal(n,16);return Buffer.alloc(n,++calls);});assert.equal(calls,2);assert.equal(assigned.ids.get(keys[0]),'p_'+'01'.repeat(16));
 assert.throws(()=>identity.assign(assigned.store,['p_another003'],()=>Buffer.alloc(16,1)),/collision/);
 assert.throws(()=>identity.assign(store,keys,()=>Buffer.alloc(16,1)),/collision/);
 assert.throws(()=>identity.assign(store,keys,()=>Buffer.alloc(8)),/entropy/);
 const first=identity.assign(store,keys),second=identity.assign(store,[...keys].reverse());assert.notEqual(first.ids.get(keys[0]),second.ids.get(keys[0]));
 const source=fs.readFileSync(path.join(__dirname,'../tools/snapshots/identity-store.cjs'),'utf8');assert(source.includes('randomBytes'));assert(!/createHash|createHmac/.test(source));
 assert.throws(()=>identity.validate({version:1,entries:[{sourceKey:keys[0],publicId:'p_'+'a'.repeat(32)},{sourceKey:keys[1],publicId:'p_'+'a'.repeat(32)}]}));
});
test('unexpected private, raw submission and contact fields fail closed at every source boundary',()=>{
 const s=setup();for(const mutate of [r=>r.phone='555-010-0199',r=>r.snapshot.rawResponses=[],r=>r.control.notes='PRIVATE_SECRET',r=>r.aliases[0].phone='555-010-0199',r=>r.snapshot.weeks[0].picks[0].submissionId='PRIVATE_SECRET',r=>r.snapshot.prizes[0].ledgerId='PRIVATE_SECRET']){const r=structuredClone(s.reply);mutate(r);assert.throws(()=>s.build(r),{message:'Snapshot generation blocked'});}
 for(const marker of ['555-010-0199','5550100199','PRIVATE_SECRET','secret@example.invalid','ya29.fake','phone','sourceKey','rawResponses'])assert.throws(()=>schema.scanText(marker));
});
test('explicit approved alias roster is required, missing or changed names never auto-approve',()=>{
 const s=setup();assert.throws(()=>generate(s.reply,{version:1,entries:[]},s.now));
 assert.throws(()=>generate(s.reply,{version:1,entries:[]},s.now,{approvedAliases:new Map()}));
 s.approval.approvedAliases.set(s.reply.aliases[0].player,'Another A.');assert.throws(()=>s.build());
});
test('OPEN/unknown/expired closure, missing aliases and fabricated authority never disclose protected records',()=>{
 for(const change of [x=>x.matrix['Form Control'][1][5]='OPEN',x=>x.cfg.authority.closures=[],x=>x.cfg.authority.aliases=[],x=>x.cfg.authority.closures.forEach(c=>c.validUntil=c.checkedAt)]){
  const s=setup();change(s.x);const r=s.x.get();const {file}=s.build(r);const m=schema.validate(file,s.now);
  for(const w of file.payload.snapshot.weeks)if(w.entry.status!=='CLOSED'){assert(!Object.hasOwn(w,'picks'));assert(!Object.hasOwn(w,'votes'));}
  if(r.snapshot.weeks.every(w=>!w.picks)){assert.deepEqual(file.payload.aliases,[]);assert(m.weeks.every(w=>w.standings.length===0));}
 }
 const s=setup();for(const status of ['OPEN','UNKNOWN']){const r=structuredClone(s.reply);r.snapshot.weeks[0].entry.status=status;assert.throws(()=>s.build(r));}
 const {file}=s.build();assert.throws(()=>schema.validate(file,s.now+120001));const tampered=structuredClone(file);tampered.expiresAt=new Date(s.now+86400000).toISOString();assert.throws(()=>schema.validate(tampered,s.now));
});
test('snapshot and private map staging rejects unsafe paths, links, unexpected files and partial replacement',()=>{
 const root=path.resolve('tmp/snapshot-test-'+crypto.randomBytes(6).toString('hex'));fs.mkdirSync(root,{recursive:true,mode:0o700});
 try{const s=setup(),map=path.join(root,'private/ids.json'),out=path.join(root,'public');stage(s.reply,map,out,s.now,s.approval);verify(out,s.now);
  assert.equal(fs.statSync(map).mode&0o777,0o600);assert.deepEqual(fs.readdirSync(out),['snapshot.json']);const good=fs.readFileSync(path.join(out,'snapshot.json'),'utf8');
  assert.throws(()=>stage(s.reply,map,out,s.now,s.approval));assert.equal(fs.readFileSync(path.join(out,'snapshot.json'),'utf8'),good);
  const invalid=structuredClone(s.reply);invalid.snapshot.weeks[0].picks[0].phone='555-010-0199';assert.throws(()=>stage(invalid,map,path.join(root,'partial'),s.now,s.approval));assert(!fs.existsSync(path.join(root,'partial')));
  fs.writeFileSync(path.join(out,'unexpected.map'),'PRIVATE_MARKER');assert.throws(()=>verify(out,s.now));fs.rmSync(path.join(out,'unexpected.map'));
  assert.throws(()=>stage(s.reply,map,'../escape',s.now,s.approval));assert.throws(()=>identity.save('website/private.json',{version:1,entries:[]}));
  fs.symlinkSync(out,path.join(root,'linked'));assert.throws(()=>verify(path.join(root,'linked'),s.now));
  fs.appendFileSync(path.join(out,'snapshot.json'),' ');assert.throws(()=>verify(out,s.now));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
function client(s){
 const listeners={},events=[],timers=[];let requests=0,fail=false,file=s.build().file;
 const root={location:{href:'http://localhost/Perfect-Pick-4.0/'},AbortController,Event:class{constructor(type){this.type=type;}},setTimeout(fn,ms){if(ms<2000)queueMicrotask(fn);else timers.push({fn,ms});return timers.length;},clearTimeout(){},setInterval(){},document:{hidden:false,getElementById(){return null;},addEventListener(name,fn){listeners[name]=fn;},dispatchEvent(e){events.push(e.type);}},async fetch(url,options){requests++;assert.equal(url,'http://localhost/Perfect-Pick-4.0/data/snapshot.json');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');if(fail)throw Error('PRIVATE_SECRET');return {ok:true,url,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(file)};}};
 return {root,listeners,events,timers,get requests(){return requests;},set fail(v){fail=v;},set file(v){file=v;}};
}
test('static browser coalesces requests, bounded retries retain only fresh data and never API-fallback',async()=>{
 const s=setup(),c=client(s),real=Date.now;let now=s.now;Date.now=()=>now;
 try{install(c.root,{snapshot:'./data/snapshot.json'});await Promise.all([c.root.PerfectPickPreview.get('prizes'),c.root.PerfectPickPreview.get('week','&week=1')]);assert.equal(c.requests,1);
  c.fail=true;await c.listeners.visibilitychange(); // Fresh data, no extra request.
  assert.equal(c.requests,1);now+=120001;await c.listeners.visibilitychange();assert.equal(c.requests,4);assert(c.events.includes('perfectpick:unavailable'));await assert.rejects(c.root.PerfectPickPreview.get('prizes'));assert.equal(c.requests,7);
  assert.throws(()=>c.root.PerfectPickPreview.buildMatchView({week:1},'Bears vs Lions'));assert(!JSON.stringify(c.events).includes('PRIVATE'));
 }finally{Date.now=real;}
 assert.throws(()=>install(client(s).root,{snapshot:'https://external.invalid/snapshot.json'}));
});
test('public API capture uses only reviewed dashboard4 GET, caps bytes and never logs source exceptions',async()=>{
 const endpoint='https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec';let calls=0;
 const r=await readPublicApi({approved:true,endpoint},async(url,opts)=>{calls++;assert.equal(url,endpoint+'?action=dashboard4');assert.equal(opts.credentials,'omit');const r=new Response('{}',{headers:{'content-type':'application/json'}});Object.defineProperty(r,'url',{value:endpoint});return r;});assert.deepEqual(r,{});assert.equal(calls,1);
 await assert.rejects(readPublicApi({approved:false,endpoint}));
 await assert.rejects(readPublicApi({approved:true,endpoint},async()=>{const r=new Response('x'.repeat(2000001),{headers:{'content-type':'application/json'}});Object.defineProperty(r,'url',{value:endpoint});return r;}));
});
module.exports={setup};
