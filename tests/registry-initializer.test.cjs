'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {NAME,render}=require('../tools/snapshots/owner-registry-initializer.cjs'),{registry,PREFIX}=require('../tools/snapshots/private-registry.cjs'),{assign}=require('../tools/snapshots/identity-store.cjs');
function fixture(){let owner=true;const values=new Map(),logs=[],store=assign({version:1,entries:[]},Array.from({length:23},(_,i)=>'p_fabricated'+String(i).padStart(3,'0'))).store;let writes=0;const props={getProperty:k=>{assert(k.startsWith(PREFIX));return values.get(k)??null;},setProperty:(k,v)=>{assert(k.startsWith(PREFIX));writes++;values.set(k,v);}};
 const service=registry({assertOwner:()=>owner,properties:props,lock:{waitLock(){},releaseLock(){}},digest:t=>crypto.createHash('sha256').update(t).digest('hex')});
 const ctx=vm.createContext({pp4PrivateRegistry_:()=>{if(!owner)throw Error('PRIVATE_SECRET');return service;},PropertiesService:{getScriptProperties:()=>props},console:{log:text=>logs.push(text)}});vm.runInContext(render(),ctx);ctx.pp4RegistryOwnerBootstrap_=()=>store;
 return {ctx,store,values,logs,get writes(){return writes;},set owner(v){owner=v;}};
}
test('owner-editor initialization saves unchanged23 IDs, reads back, recovers backup and logs only safe receipt',()=>{
 const f=fixture(),r=f.ctx[NAME]();assert.equal(r.state,'REGISTRY_INITIALIZATION_VERIFIED');assert(r.cloudReadBack&&r.cloudBackupRecovery&&r.activeOwner&&r.effectiveOwner);assert.equal(f.values.size,3);const first=JSON.parse(f.values.get(PREFIX+'PRIMARY'));assert.deepEqual(first.store,f.store);assert.equal(first.generation,1);
 f.ctx[NAME]();assert.equal(JSON.parse(f.values.get(PREFIX+'PRIMARY')).generation,1);for(const text of f.logs)for(const row of f.store.entries){assert(!text.includes(row.sourceKey));assert(!text.includes(row.publicId));}assert(!JSON.stringify(f.logs).includes('PRIVATE'));
});
test('wrong owner, missing bootstrap and differing existing IDs fail closed without resetting the registry',()=>{
 const f=fixture();f.owner=false;assert.throws(()=>f.ctx[NAME](),/blocked; no private values logged/);assert.equal(f.writes,0);f.owner=true;f.ctx.pp4RegistryOwnerBootstrap_=()=>null;assert.throws(()=>f.ctx[NAME]());assert.equal(f.writes,0);f.ctx.pp4RegistryOwnerBootstrap_=()=>f.store;f.ctx[NAME]();const before=f.values.get(PREFIX+'PRIMARY'),writes=f.writes;
 const different=structuredClone(f.store);different.entries[0].publicId='p_'+'a'.repeat(32);f.ctx.pp4RegistryOwnerBootstrap_=()=>different;assert.throws(()=>f.ctx[NAME]());assert.equal(f.values.get(PREFIX+'PRIMARY'),before);assert.equal(f.writes,writes);
});
test('temporary initializer has no HTTP handler, ID generation, unrelated services, trigger or deployment operations',()=>{
 const s=render();assert(!NAME.endsWith('_'));assert(!/doGet|doPost|SpreadsheetApp|FormApp|ScriptApp|UrlFetchApp|Math.random|randomBytes|newTrigger|deleteProperty/.test(s));assert(s.includes('pp4RegistryOwnerBootstrap_() { return null; }'));
});
