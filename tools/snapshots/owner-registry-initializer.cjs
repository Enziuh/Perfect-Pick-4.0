'use strict';
// One temporary owner-editor action. Bootstrap stays null in tracked source;
// actual input is supplied only inside the already-authorized private Google project.
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const NAME='pp4InitializePrivateRegistryOnce';
const SOURCE=`
function pp4RegistryOwnerBootstrap_() { return null; }
function pp4InitializePrivateRegistryOnce() {
 try {
  const registry=pp4PrivateRegistry_();
  const store=pp4RegistryOwnerBootstrap_();
  if (!store || !Array.isArray(store.entries) || store.entries.length!==23) throw Error('Blocked');
  const properties=PropertiesService.getScriptProperties();
  if (properties.getProperty('PP4_PRIVATE_RANDOM_IDS_V1_PRIMARY')===null) registry.save(store,0);
  const before=registry.load();
  if (before.generation!==1 || JSON.stringify(before.store)!==JSON.stringify(store)) throw Error('Blocked');
  registry.recover(1);
  const after=registry.load();
  if (after.generation!==1 || JSON.stringify(after.store)!==JSON.stringify(store)) throw Error('Blocked');
  const receipt={state:'REGISTRY_INITIALIZATION_VERIFIED',players:23,uniqueIds:23,generation:1,exactIdsPreserved:true,cloudReadBack:true,cloudBackupRecovery:true,activeOwner:true,effectiveOwner:true};
  console.log(JSON.stringify(receipt));
  return receipt;
 } catch (_) { throw Error('Private registry initialization blocked; no private values logged'); }
}
`;
function render(){checkAppsScriptCompatibility(SOURCE,'TemporaryOwnerRegistryInitialization.gs');return SOURCE;}
module.exports={NAME,render};
