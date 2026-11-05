'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {inspect}=require('../tools/snapshots/registry-prerequisites.cjs'),{registry,PREFIX}=require('../tools/snapshots/private-registry.cjs'),{assign}=require('../tools/snapshots/identity-store.cjs');
function fixture(){let actor='owner@example.invalid',effective=actor,writes=0,reads=0;const data=new Map(),store=assign({version:1,entries:[]},Array.from({length:23},(_,i)=>'p_fabricated'+String(i).padStart(3,'0'))).store,digest=t=>crypto.createHash('sha256').update(t).digest('hex'),p={getProperty:k=>{assert(k.startsWith(PREFIX));reads++;return data.get(k)??null;},setProperty:(k,v)=>{writes++;data.set(k,v);}},core=registry({assertOwner:()=>actor===effective&&actor==='owner@example.invalid',properties:p,lock:{waitLock(){},releaseLock(){}},digest});const deps={config:()=>({enabled:true,ownerOnlyEditorReviewed:true,ownerEmail:'owner@example.invalid'}),activeUser:()=>actor,effectiveUser:()=>effective,bootstrap:()=>store,properties:()=>p,digest,loadRegistry:()=>core.load(),prepareRegistry:()=>core,verifyLock:()=>true};return {deps,data,store,core,get writes(){return writes;},get reads(){return reads;},set actor(v){actor=v;},set effective(v){effective=v;}};}
test('owner identity failures identify exact fixed guard and perform no bootstrap/property reads or writes',()=>{
 for(const [key,value,code] of [['actor','','ACTIVE_IDENTITY_UNAVAILABLE'],['actor','different@example.invalid','ACTIVE_OWNER_MISMATCH'],['effective','','EFFECTIVE_IDENTITY_UNAVAILABLE'],['effective','different@example.invalid','EFFECTIVE_OWNER_MISMATCH']]){const f=fixture();f[key]=value;f.deps.bootstrap=()=>{throw Error('Must not read input');};const r=inspect(f.deps);assert.equal(r.code,code);assert.equal(f.reads,0);assert.equal(f.writes,0);assert.equal(r.namespaceInspected,false);}
 const f=fixture();f.deps.activeUser=()=>{throw Error('userinfo.email PRIVATE_SECRET');};assert.equal(inspect(f.deps).code,'ACTIVE_EMAIL_SCOPE_REQUIRED');assert.equal(f.reads,0);
});
test('empty, partial and complete namespace states are identified without mutation',()=>{
 const f=fixture();let r=inspect(f.deps);assert.equal(r.code,'NAMESPACE_EMPTY_NO_INITIALIZATION_WRITES');assert.equal(f.writes,0);assert.equal(r.namespaceInspected,true);
 f.data.set(PREFIX+'HIGH_WATER','1');r=inspect(f.deps);assert.equal(r.code,'PARTIAL_NAMESPACE_PRIMARY_ABSENT');assert.equal(f.writes,0);f.data.clear();f.core.save(f.store,0);const n=f.writes;r=inspect(f.deps);assert.equal(r.code,'EXACT_REGISTRY_ALREADY_PRESENT');assert(r.primary.mappingMatchesExpected&&r.primary.checksumValid&&r.coreLoadValid);assert.equal(f.writes,n);
 for(const e of f.store.entries){assert(!JSON.stringify(r).includes(e.sourceKey));assert(!JSON.stringify(r).includes(e.publicId));}assert(!JSON.stringify(r).includes('owner@example.invalid'));
});
test('checksum, high-water, backup and exact mapping prerequisites are separately diagnosed',()=>{
 const f=fixture();f.core.save(f.store,0);const original=new Map(f.data),n=f.writes;
 for(const [mutate,code] of [[()=>f.data.set(PREFIX+'PRIMARY','bad'),'PRIMARY_SCHEMA_INVALID'],[()=>{const r=JSON.parse(f.data.get(PREFIX+'PRIMARY'));r.checksum='bad';f.data.set(PREFIX+'PRIMARY',JSON.stringify(r));},'PRIMARY_CHECKSUM_INVALID'],[()=>f.data.set(PREFIX+'HIGH_WATER','2'),'HIGH_WATER_MISMATCH'],[()=>f.data.delete(PREFIX+'BACKUP_B'),'MATCHING_BACKUP_UNAVAILABLE']]){f.data.clear();for(const [k,v]of original)f.data.set(k,v);mutate();assert.equal(inspect(f.deps).code,code);assert.equal(f.writes,n);}
});
test('JSON formatting/order differences are reported without weakening field/value identity checks',()=>{
 const f=fixture();f.core.save(f.store,0);f.deps.bootstrap=()=>({entries:f.store.entries,version:1});const r=inspect(f.deps);assert.equal(r.code,'JSON_ORDER_ONLY_MISMATCH');assert.equal(r.primary.mappingMatchesExpected,true);assert.equal(r.primary.jsonMatchesExpected,false);
});
test('read-only inspection package is ES2020 compatible with no setters, recovery/init, HTTP or unrelated operations',()=>{
 const pkg=require('../tools/snapshots/registry-prerequisites-package.cjs'),source=pkg.render();assert(!pkg.NAME.endsWith('_'));assert.equal((source.match(/ScriptApp\./g)||[]).length,2);assert(source.includes('ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL,[identityScope])'));assert(source.includes('info.getAuthorizedScopes()'));assert(!/setProperty|deleteProperty|\.save\(|\.recover\(|\.restore\(|doGet|doPost|SpreadsheetApp|FormApp|UrlFetchApp/.test(source));
});

test('factory, public digest probe and lock prerequisites fail with fixed labels before property reads',()=>{
 for(const [name,code]of [['prepareRegistry','REGISTRY_FACTORY_UNAVAILABLE'],['digest','DIGEST_SERVICE_UNAVAILABLE'],['verifyLock','REGISTRY_LOCK_UNAVAILABLE']]){const f=fixture();f.deps[name]=()=>{throw Error('PRIVATE_SECRET');};const r=inspect(f.deps);assert.equal(r.code,code);assert.equal(f.reads,0);assert.equal(f.writes,0);assert(!JSON.stringify(r).includes('PRIVATE_SECRET'));}
});
