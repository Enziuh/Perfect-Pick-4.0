'use strict';
const {safeAlias}=require('../compatibility/pp3-display-name.cjs');
var PerfectPickOwnerEvidence=(function(){
 const fail=()=>{throw Error('Invalid owner evidence');};
 const need=v=>{if(!v)fail();};
 const integer=v=>Number.isSafeInteger(v)&&v>=0;
 const exact=(v,keys)=>need(v&&typeof v==='object'&&!Array.isArray(v)&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)));
 const stamp=v=>{need(typeof v==='string');const t=Date.parse(v);need(Number.isFinite(t)&&new Date(t).toISOString()===v);return t;};
 function aliases(records,revision,normalizeKey=value=>value){
  try{
   need(Array.isArray(records)&&records.length<=1000&&integer(revision));const map=new Map(),players=new Set(),labels=new Set();
   for(const r of records){
    exact(r,['privateKey','player','alias','approved','revision']);
    need(r.revision===revision&&r.approved===true&&typeof r.privateKey==='string'&&r.privateKey.length>0&&typeof r.player==='string'&&/^p_[a-z0-9]{8,32}$/.test(r.player)&&safeAlias(r.alias));
    const privateKey=normalizeKey(r.privateKey);need(typeof privateKey==='string'&&privateKey.length>0);
    need(!map.has(privateKey)&&!players.has(r.player)&&!labels.has(r.alias));players.add(r.player);labels.add(r.alias);
    map.set(privateKey,Object.freeze({player:r.player,alias:r.alias,approved:true}));
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
 // A current server-owned owner decision is distinct from a cached Form observation.
 // Verify its revision, time and current Form Control coherence on each fresh snapshot.
 // Never derive other weeks' closure from dates or from the active week number.
 function attestations(records,context,control){
  need(Array.isArray(records)&&records.length<=18&&integer(context.revision)&&integer(context.now)&&integer(context.maxAgeMs)&&context.maxAgeMs>0);
  const map=new Map(),seen=new Set(),active=Number(control?.activeWeek);
  const coherent=Number.isInteger(active)&&active>=1&&active<=18&&['OPEN','CLOSED','UPCOMING'].includes(control?.status);
  for(const r of records){
   exact(r,['week','revision','attestedAt','status','approved']);
   need(Number.isInteger(r.week)&&r.week>=1&&r.week<=18&&!seen.has(r.week)&&typeof r.approved==='boolean');seen.add(r.week);
   const at=stamp(r.attestedAt);
   if(!coherent||!r.approved||r.status!=='CLOSED'||r.revision!==context.revision||at>context.now||r.week>active||r.week===active&&control.status!=='CLOSED')continue;
   const checkedAt=new Date(context.now).toISOString(),validUntil=new Date(context.now+context.maxAgeMs).toISOString();
   map.set(r.week,Object.freeze({snapshotRevision:context.revision,entry:Object.freeze({status:'CLOSED',authority:'OFFICIAL',revision:r.revision,checkedAt,validUntil,deadline:null})}));
  }
  return map;
 }
 return Object.freeze({aliases,closures,attestations});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PerfectPickOwnerEvidence;
