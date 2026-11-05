'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {render}=require('../tools/snapshots/owner-registry-operation.cjs');
const {registry,PREFIX}=require('../tools/snapshots/private-registry.cjs');
const {assign}=require('../tools/snapshots/identity-store.cjs');
function fixture(){let active='owner@example.invalid',effective=active,enabled=true,writes=0;const data=new Map(),props={getProperty:k=>{assert(k.startsWith(PREFIX));return data.get(k)??null;},setProperty:(k,v)=>{assert(k.startsWith(PREFIX));writes++;data.set(k,v);}},service=registry({assertOwner:()=>active===effective&&effective==='owner@example.invalid',properties:props,lock:{waitLock(){},releaseLock(){}},digest:t=>crypto.createHash('sha256').update(t).digest('hex')});
 const ctx=vm.createContext({pp4PrivateRegistryConfig_:()=>enabled?{enabled:true,ownerOnlyEditorReviewed:true,ownerEmail:'owner@example.invalid'}:null,Session:{getActiveUser:()=>({getEmail:()=>active}),getEffectiveUser:()=>({getEmail:()=>effective})},pp4PrivateRegistry_:()=>service,PropertiesService:{getScriptProperties:()=>props},ContentService:{MimeType:{JSON:'JSON'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})}});vm.runInContext(render(),ctx);
 return {post:(operation,store)=>ctx.doPost({postData:{type:'application/json',contents:JSON.stringify(store===undefined?{operation}:{operation,store})}}),raw:v=>ctx.doPost({postData:{type:'application/json',contents:JSON.stringify(v)}}),get writes(){return writes;},data,set active(v){active=v;},set effective(v){effective=v;},set enabled(v){enabled=v;}};
}
function store(){return assign({version:1,entries:[]},Array.from({length:23},(_,i)=>'p_fabricated'+String(i).padStart(3,'0'))).store;}
test('temporary owner operation verifies both principals without registry writes and rejects anonymous/wrong/disabled callers',()=>{
 for(const actor of ['active','effective','enabled']){const f=fixture();if(actor==='enabled')f.enabled=false;else f[actor]='';assert.equal(f.post('VERIFY_OWNER').state,'BLOCKED');assert.equal(f.writes,0);}
 const f=fixture();assert.equal(f.post('VERIFY_OWNER').state,'OWNER_VERIFIED');assert.equal(f.writes,0);
});
test('initialization is bounded/idempotent, preserves23 IDs, reads back and recovers verified cloud backup',()=>{
 const f=fixture(),s=store();const saved=f.post('INITIALIZE',s);assert.equal(saved.state,'REGISTRY_INITIALIZED');assert(saved.exactIdsPreserved);assert(saved.backupVerified);const n=f.writes;assert.equal(f.post('INITIALIZE',s).state,'REGISTRY_INITIALIZED');assert.equal(f.writes,n);assert.equal(f.post('READ_BACK',s).state,'REGISTRY_READ_BACK_VERIFIED');assert.equal(f.writes,n);assert.equal(f.post('RECOVER',s).state,'REGISTRY_RECOVERY_VERIFIED');
 assert(!JSON.stringify(saved).includes(s.entries[0].sourceKey));assert(!JSON.stringify(saved).includes(s.entries[0].publicId));assert.equal(f.data.size,3);
});
test('unknown actions/fields, wrong map/count and private error details cannot cause writes or escape responses',()=>{
 const f=fixture(),s=store();for(const input of [{operation:'SCORE_SYNC',store:s},{operation:'INITIALIZE',store:s,notes:'PRIVATE_SECRET'},{operation:'INITIALIZE',store:{...s,phone:'PRIVATE_SECRET'}},{operation:'INITIALIZE',store:{version:1,entries:[]}},{operation:'INITIALIZE',store:{version:1,entries:s.entries.map((e,i)=>i?e:{...e,phone:'PRIVATE_SECRET'})}}]){const r=f.raw(input);assert.equal(r.state,'BLOCKED');assert(!JSON.stringify(r).includes('PRIVATE_SECRET'));assert.equal(f.writes,0);}
 f.post('INITIALIZE',s);const n=f.writes;assert.equal(f.post('INITIALIZE',store()).state,'BLOCKED');assert.equal(f.writes,n);
});
test('temporary transport has no GET route, Sheets/Forms/sync/trigger/network or logger operations',()=>{
 const source=render();assert(!/doGet|SpreadsheetApp|FormApp|ScriptApp|UrlFetchApp|console\.|Logger|deleteProperty|newTrigger|syncNFL/.test(source));assert(source.includes('function doPost(e)'));assert(!source.includes('Math.random'));
});
