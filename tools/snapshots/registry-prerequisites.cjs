'use strict';
// Pure READ-ONLY diagnostic. Only fixed labels/counts/booleans leave this module.
const {validate:validateStore}=require('./identity-contract.cjs');
function inspect({config,activeUser,effectiveUser,bootstrap,properties,digest,loadRegistry,prepareRegistry,verifyLock}){
 const report={state:'BLOCKED',code:'CONFIGURATION',configurationEnabled:false,ownerReviewFlag:false,expectedOwnerConfigured:false,activeIdentityReadSucceeded:false,activeIdentityAvailable:false,activeOwnerMatches:false,effectiveIdentityReadSucceeded:false,effectiveIdentityAvailable:false,effectiveOwnerMatches:false,bootstrapValid:false,bootstrapPlayers:null,registryFactoryAvailable:false,digestAvailable:false,registryLockAvailable:false,namespaceInspected:false,namespaceStable:false,propertiesPresent:null,highWaterGeneration:null,primary:null,backups:null,coreLoadValid:false,coreStoreMatchesExpected:false,diagnosticWrites:0};
 const done=code=>({...report,code});
 try{
  const c=config();report.configurationEnabled=c?.enabled===true;report.ownerReviewFlag=c?.ownerOnlyEditorReviewed===true;report.expectedOwnerConfigured=typeof c?.ownerEmail==='string'&&c.ownerEmail.length>=6&&c.ownerEmail.trim()===c.ownerEmail;
  if(!report.configurationEnabled||!report.ownerReviewFlag||!report.expectedOwnerConfigured)return done('CONFIGURATION_DISABLED_OR_INVALID');
  let active='',effective='',activeScopeError=false,effectiveScopeError=false;
  try{active=activeUser();report.activeIdentityReadSucceeded=true;}catch(e){activeScopeError=/userinfo\.email/.test(String(e?.message||''));}
  try{effective=effectiveUser();report.effectiveIdentityReadSucceeded=true;}catch(e){effectiveScopeError=/userinfo\.email/.test(String(e?.message||''));}
  report.activeIdentityAvailable=typeof active==='string'&&active.length>0;report.effectiveIdentityAvailable=typeof effective==='string'&&effective.length>0;report.activeOwnerMatches=report.activeIdentityAvailable&&active===c.ownerEmail;report.effectiveOwnerMatches=report.effectiveIdentityAvailable&&effective===c.ownerEmail;
  if(!report.activeIdentityAvailable)return done(activeScopeError?'ACTIVE_EMAIL_SCOPE_REQUIRED':'ACTIVE_IDENTITY_UNAVAILABLE');
  if(!report.activeOwnerMatches)return done('ACTIVE_OWNER_MISMATCH');
  if(!report.effectiveIdentityAvailable)return done(effectiveScopeError?'EFFECTIVE_EMAIL_SCOPE_REQUIRED':'EFFECTIVE_IDENTITY_UNAVAILABLE');
  if(!report.effectiveOwnerMatches)return done('EFFECTIVE_OWNER_MISMATCH');
  const expected=bootstrap();try{validateStore(expected);report.bootstrapValid=true;report.bootstrapPlayers=expected.entries.length;}catch{return done('BOOTSTRAP_SCHEMA_INVALID');}
  if(report.bootstrapPlayers!==23)return done('BOOTSTRAP_COUNT_UNEXPECTED');
  try{const core=prepareRegistry();if(!core||typeof core.load!=='function')return done('REGISTRY_FACTORY_UNAVAILABLE');report.registryFactoryAvailable=true;}catch{return done('REGISTRY_FACTORY_UNAVAILABLE');}
  try{report.digestAvailable=digest('PP4_REGISTRY_PUBLIC_DIGEST_PROBE_V1')==='d5e37f8ecfca5b457a19860f924c4879164d065408c3150c2984d5ca1773f822';}catch{return done('DIGEST_SERVICE_UNAVAILABLE');}
  if(!report.digestAvailable)return done('DIGEST_SERVICE_MISMATCH');
  try{report.registryLockAvailable=verifyLock()===true;}catch{return done('REGISTRY_LOCK_UNAVAILABLE');}
  if(!report.registryLockAvailable)return done('REGISTRY_LOCK_UNAVAILABLE');
  // No Properties/Bootstrap values are read until BOTH owner checks succeed.
  const service=properties(),names=['PRIMARY','BACKUP_A','BACKUP_B','HIGH_WATER'];
  const snapshot=()=>names.map(n=>service.getProperty('PP4_PRIVATE_RANDOM_IDS_V1_'+n));
  const first=snapshot(),second=snapshot();report.namespaceInspected=true;report.namespaceStable=first.every((v,i)=>v===second[i]);if(!report.namespaceStable)return done('PROPERTY_SNAPSHOT_CHANGED');
  report.propertiesPresent=Object.fromEntries(names.map((n,i)=>[n.toLowerCase(),first[i]!==null]));
  const same=(a,b)=>a.entries.length===b.entries.length&&a.entries.every(e=>b.entries.some(n=>n.sourceKey===e.sourceKey&&n.publicId===e.publicId));
  function record(text){const r={present:text!==null,jsonValid:false,schemaValid:false,checksumValid:false,players:null,generation:null,mappingMatchesExpected:false,jsonMatchesExpected:false};if(text===null)return r;
   try{const value=JSON.parse(text);r.jsonValid=true;if(!value||Object.keys(value).sort().join(',')!=='checksum,generation,store,version'||value.version!==1||!Number.isSafeInteger(value.generation)||value.generation<1)return r;validateStore(value.store);r.schemaValid=true;r.players=value.store.entries.length;r.generation=value.generation;r.checksumValid=value.checksum===digest(JSON.stringify({version:1,generation:value.generation,store:value.store}));r.mappingMatchesExpected=same(value.store,expected);r.jsonMatchesExpected=JSON.stringify(value.store)===JSON.stringify(expected);return r;}catch{return r;}
  }
  report.primary=record(first[0]);report.backups=[record(first[1]),record(first[2])];
  if(first[3]!==null){if(!/^[1-9][0-9]*$/.test(first[3])||!Number.isSafeInteger(Number(first[3])))return done('HIGH_WATER_INVALID');report.highWaterGeneration=Number(first[3]);}
  if(first.every(v=>v===null)){report.state='READY';return done('NAMESPACE_EMPTY_NO_INITIALIZATION_WRITES');}
  if(!report.primary.present)return done('PARTIAL_NAMESPACE_PRIMARY_ABSENT');
  if(!report.primary.schemaValid)return done('PRIMARY_SCHEMA_INVALID');
  if(!report.primary.checksumValid)return done('PRIMARY_CHECKSUM_INVALID');
  if(!report.primary.mappingMatchesExpected)return done('PRIMARY_MAPPING_MISMATCH');
  if(report.highWaterGeneration!==report.primary.generation)return done('HIGH_WATER_MISMATCH');
  if(!report.backups.some(r=>r.schemaValid&&r.checksumValid&&r.generation===report.highWaterGeneration&&r.mappingMatchesExpected))return done('MATCHING_BACKUP_UNAVAILABLE');
  try{const loaded=loadRegistry();report.coreLoadValid=true;report.coreStoreMatchesExpected=same(loaded.store,expected);}catch{return done('REVIEWED_REGISTRY_LOAD_BLOCKED');}
  if(!report.coreStoreMatchesExpected)return done('CORE_MAPPING_MISMATCH');
  if(!report.primary.jsonMatchesExpected)return done('JSON_ORDER_ONLY_MISMATCH');
  report.state='VERIFIED_EXISTING';return done('EXACT_REGISTRY_ALREADY_PRESENT');
 }catch{return done('READ_ONLY_INSPECTION_UNAVAILABLE');}
}
module.exports={inspect};
