'use strict';
var PerfectPickOwnerEvidence=(function(){
 const fail=()=>{throw Error('Invalid owner evidence');};
 const need=v=>{if(!v)fail();};
 const integer=v=>Number.isSafeInteger(v)&&v>=0;
 const exact=(v,keys)=>need(v&&typeof v==='object'&&!Array.isArray(v)&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)));
 const stamp=v=>{need(typeof v==='string');const t=Date.parse(v);need(Number.isFinite(t)&&new Date(t).toISOString()===v);return t;};
 function aliases(records,revision){
  try{
   need(Array.isArray(records)&&records.length<=1000&&integer(revision));const map=new Map(),players=new Set(),labels=new Set();
   for(const r of records){
    exact(r,['privateKey','player','alias','approved','revision']);
    need(r.revision===revision&&r.approved===true&&typeof r.privateKey==='string'&&r.privateKey.length>0&&typeof r.player==='string'&&/^p_[a-z0-9]{8,32}$/.test(r.player)&&typeof r.alias==='string'&&/^[A-Za-z][A-Za-z0-9 -]{0,47}$/.test(r.alias));
    need(!map.has(r.privateKey)&&!players.has(r.player)&&!labels.has(r.alias));players.add(r.player);labels.add(r.alias);
    map.set(r.privateKey,Object.freeze({player:r.player,alias:r.alias,approved:true}));
   }return map;
  }catch{fail();}
 }
 function closures(records,context){
  try{
   need(Array.isArray(records)&&records.length<=18&&integer(context.revision)&&integer(context.now)&&integer(context.maxAgeMs)&&context.maxAgeMs>0);
   const map=new Map(),seen=new Set();
   for(const r of records){
    exact(r,['week','snapshotRevision','closureRevision','status','mechanism','verifiedClosed','checkedAt','validUntil','deadline']);
    need(Number.isInteger(r.week)&&r.week>=1&&r.week<=18&&!seen.has(r.week));seen.add(r.week);
    const checked=stamp(r.checkedAt),until=stamp(r.validUntil);if(r.deadline!==null)stamp(r.deadline);
    if(r.status!=='CLOSED'||r.mechanism!=='OWNER_VERIFIED_CLOSURE'||r.verifiedClosed!==true||r.snapshotRevision!==context.revision||!integer(r.closureRevision)||checked>context.now||context.now-checked>context.maxAgeMs||until<=context.now)continue;
    map.set(r.week,Object.freeze({snapshotRevision:r.snapshotRevision,entry:Object.freeze({status:'CLOSED',authority:'OFFICIAL',revision:r.closureRevision,checkedAt:r.checkedAt,validUntil:r.validUntil,deadline:r.deadline})}));
   }return map;
  }catch{fail();}
 }
 return Object.freeze({aliases,closures});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PerfectPickOwnerEvidence;
