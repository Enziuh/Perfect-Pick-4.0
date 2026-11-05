'use strict';
// Temporary private staging transport. Never deployed publicly or part of Pages.
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const SOURCE=`
function doPost(e) {
 function reply(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
 let gate='CONFIG';
 try {
  const c=pp4PrivateRegistryConfig_();
  if (!c || c.enabled!==true || c.ownerOnlyEditorReviewed!==true || typeof c.ownerEmail!=='string' || c.ownerEmail.length<6) throw Error('Blocked');
  gate='ACTIVE_OWNER_AVAILABLE'; const active=Session.getActiveUser().getEmail(); if (!active) throw Error('Blocked');
  gate='ACTIVE_OWNER_MATCH'; if (active!==c.ownerEmail) throw Error('Blocked');
  gate='EFFECTIVE_OWNER_AVAILABLE'; const effective=Session.getEffectiveUser().getEmail(); if (!effective) throw Error('Blocked');
  gate='EFFECTIVE_OWNER_MATCH'; if (effective!==c.ownerEmail) throw Error('Blocked');
  gate='REQUEST_SCHEMA';
  if (!e || !e.postData || !/^application\\/json\\b/.test(e.postData.type||'') || typeof e.postData.contents!=='string' || e.postData.contents.length>12000) throw Error('Blocked');
  const input=JSON.parse(e.postData.contents);gate='ACTION_SCHEMA';
  if (!input || typeof input!=='object' || Array.isArray(input)) throw Error('Blocked');
  if (input.operation==='VERIFY_OWNER' && Object.keys(input).join(',')==='operation') return reply({state:'OWNER_VERIFIED',activeOwner:true,effectiveOwner:true,registryWrites:false});
  if (!['INITIALIZE','READ_BACK','RECOVER'].includes(input.operation) || Object.keys(input).sort().join(',')!=='operation,store') throw Error('Blocked');
  gate='STORE_SCHEMA'; const store=input.store;
  if (!store || Object.keys(store).sort().join(',')!=='entries,version' || store.version!==1 || !Array.isArray(store.entries) || store.entries.length!==23) throw Error('Blocked');
  const sources=new Set(),ids=new Set();
  for (const row of store.entries) {
   if (!row || Object.keys(row).sort().join(',')!=='publicId,sourceKey' || typeof row.sourceKey!=='string' || !/^p_[a-z0-9]{8,32}$/.test(row.sourceKey) || typeof row.publicId!=='string' || !/^p_[a-f0-9]{32}$/.test(row.publicId) || sources.has(row.sourceKey) || ids.has(row.publicId)) throw Error('Blocked');
   sources.add(row.sourceKey); ids.add(row.publicId);
  }
  for (const id of ids) if (sources.has(id)) throw Error('Blocked');
  gate='REGISTRY'; const registry=pp4PrivateRegistry_();
  if (input.operation==='INITIALIZE') {
   const properties=PropertiesService.getScriptProperties();
   if (properties.getProperty('PP4_PRIVATE_RANDOM_IDS_V1_PRIMARY')===null) registry.save(store,0);
  }
  let state=registry.load();
  if (state.generation!==1 || JSON.stringify(state.store)!==JSON.stringify(store)) throw Error('Blocked');
  if (input.operation==='RECOVER') { registry.recover(state.generation); state=registry.load(); }
  if (state.generation!==1 || JSON.stringify(state.store)!==JSON.stringify(store)) throw Error('Blocked');
  return reply({state:input.operation==='INITIALIZE'?'REGISTRY_INITIALIZED':input.operation==='RECOVER'?'REGISTRY_RECOVERY_VERIFIED':'REGISTRY_READ_BACK_VERIFIED',players:23,uniqueIds:23,generation:1,exactIdsPreserved:true,backupVerified:true,activeOwner:true,effectiveOwner:true});
 } catch (_) { return reply({state:'BLOCKED',code:'OWNER_REGISTRY_UNAVAILABLE',gate:gate}); }
}
`;
function render(){checkAppsScriptCompatibility(SOURCE,'TemporaryOwnerRegistryOperation.gs');return SOURCE;}
module.exports={render};
