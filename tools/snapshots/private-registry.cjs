'use strict';
// Private owner-side storage only. Never bundle this module into Pages.
const {validate}=require('./identity-contract.cjs');
const PREFIX='PP4_PRIVATE_RANDOM_IDS_V1_',PRIMARY=PREFIX+'PRIMARY',WATERMARK=PREFIX+'HIGH_WATER',BACKUPS=[PREFIX+'BACKUP_A',PREFIX+'BACKUP_B'];
function registry({assertOwner,properties,lock,digest}){
 const fail=()=>{throw Error('Private registry unavailable');};
 const copy=value=>JSON.parse(JSON.stringify(value));
 function guard(){if(typeof assertOwner!=='function'||assertOwner()!==true||!properties||!lock||typeof digest!=='function')fail();}
 function read(key){
  const text=properties.getProperty(key);if(text===null)return null;
  try{if(text.length>8500)fail();const r=JSON.parse(text);if(Object.keys(r).sort().join(',')!=='checksum,generation,store,version'||r.version!==1||!Number.isSafeInteger(r.generation)||r.generation<1||r.checksum!==digest(JSON.stringify({version:1,generation:r.generation,store:r.store})))fail();validate(r.store);return r;}catch{fail();}
 }
 function highWater(){const v=properties.getProperty(WATERMARK);if(v===null)return 0;if(!/^[1-9][0-9]*$/.test(v)||!Number.isSafeInteger(Number(v)))fail();return Number(v);}
 function backups(){const out=[];for(const key of BACKUPS){try{const r=read(key);if(r)out.push(r);}catch{}}return out;}
 function locked(fn){let held=false;try{guard();lock.waitLock(10000);held=true;return fn();}catch{fail();}finally{if(held){try{lock.releaseLock();}catch{fail();}}}}
 function load(){return locked(()=>{const main=read(PRIMARY);if(!main||highWater()!==main.generation)fail();const copies=backups();if(!copies.some(r=>r.generation===main.generation&&r.checksum===main.checksum)||copies.some(r=>r.generation>main.generation||r.generation===main.generation&&r.checksum!==main.checksum))fail();return {generation:main.generation,store:copy(main.store)};});}
 function save(store,expectedGeneration,{verifiedRekeys=[]}={}){return locked(()=>{
  validate(store);const prior=read(PRIMARY),other=backups();
  if(!Number.isSafeInteger(expectedGeneration)||expectedGeneration<0||(prior?prior.generation:0)!==expectedGeneration||highWater()!==expectedGeneration||other.some(r=>r.generation>expectedGeneration)||!prior&&BACKUPS.some(k=>properties.getProperty(k)!==null))fail();
  // Existing IDs may not be silently changed, deleted, or reset by a publisher.
  if(!Array.isArray(verifiedRekeys)||verifiedRekeys.some(r=>!r||Object.keys(r).sort().join(',')!=='nextSourceKey,previousSourceKey,verifiedSamePlayer'||r.verifiedSamePlayer!==true))fail();
  if(prior)for(const old of prior.store.entries)if(!store.entries.some(e=>e.sourceKey===old.sourceKey&&e.publicId===old.publicId)&&!verifiedRekeys.some(r=>r.previousSourceKey===old.sourceKey&&store.entries.some(e=>e.sourceKey===r.nextSourceKey&&e.publicId===old.publicId)))fail();
  const generation=expectedGeneration+1,body={version:1,generation,store:copy(store)},record=JSON.stringify({...body,checksum:digest(JSON.stringify(body))});if(record.length>8500)fail();
  const slot=BACKUPS[generation%2];properties.setProperty(WATERMARK,String(generation));if(highWater()!==generation)fail();properties.setProperty(slot,record);if(read(slot).generation!==generation)fail();properties.setProperty(PRIMARY,record);if(read(PRIMARY).generation!==generation)fail();
  return {state:'SAVED',generation,players:store.entries.length,backupVerified:true};
 });}
 function recover(expectedGeneration){return locked(()=>{
  const copies=backups().sort((a,b)=>b.generation-a.generation),latest=copies[0];if(highWater()!==expectedGeneration||!latest||latest.generation!==expectedGeneration||copies.some(r=>r.generation===latest.generation&&r.checksum!==latest.checksum))fail();
  // No automatic fallback to an older ID map after corruption or partial writes.
  properties.setProperty(PRIMARY,JSON.stringify(latest));const verified=read(PRIMARY);if(verified.checksum!==latest.checksum)fail();return {state:'RECOVERED',generation:latest.generation,players:latest.store.entries.length};
 });}
 function restore(store,expectedGeneration,{verifiedRecovery=false}={}){return locked(()=>{
  validate(store);if(verifiedRecovery!==true||!Number.isSafeInteger(expectedGeneration)||expectedGeneration<1||highWater()!==expectedGeneration)fail();
  let existing=null;try{existing=read(PRIMARY);}catch{}if(existing)fail();
  // Caller must use the separately authenticated backup and owner-confirmed
  // high-water generation. No automatic restore from an older surviving backup.
  const body={version:1,generation:expectedGeneration,store:copy(store)},record=JSON.stringify({...body,checksum:digest(JSON.stringify(body))});if(record.length>8500)fail();
  properties.setProperty(BACKUPS[expectedGeneration%2],record);properties.setProperty(PRIMARY,record);if(read(PRIMARY).checksum!==JSON.parse(record).checksum)fail();return {state:'RESTORED',generation:expectedGeneration,players:store.entries.length};
 });}
 return Object.freeze({load,save,recover,restore});
}
module.exports={registry,PREFIX};
