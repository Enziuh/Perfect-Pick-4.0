'use strict';
// Preparation only. No upload/authorization/execution and no automatic real config.
const path=require('node:path');
const {bundle}=require('../api/bundle.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
function render(){
 const source=`// Private editor helper only. No doGet/doPost, triggers or published interface.
function pp4PrivateRegistryConfig_() { return null; }
function pp4PrivateRegistry_() {
 const c=pp4PrivateRegistryConfig_();
 if(!c || c.enabled!==true || c.ownerOnlyEditorReviewed!==true || typeof c.ownerEmail!=='string' || c.ownerEmail.length<6 || c.ownerEmail.indexOf('@')<1 || c.ownerEmail.trim()!==c.ownerEmail)throw Error('Private registry disabled');
 const assertOwner=()=>Session.getActiveUser().getEmail()===c.ownerEmail && Session.getEffectiveUser().getEmail()===c.ownerEmail;
 if(!assertOwner())throw Error('Private owner required');
 return (${bundle(path.join(__dirname,'private-registry.cjs'))}).registry({assertOwner,properties:PropertiesService.getScriptProperties(),lock:LockService.getScriptLock(),digest:text=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('')});
}
function pp4InitializePrivateRegistry_() {
 try{
 const registry=pp4PrivateRegistry_();
 const input=PropertiesService.getScriptProperties().getProperty('PP4_PRIVATE_RANDOM_IDS_V1_BOOTSTRAP');
 if(!input)throw Error('Private bootstrap unavailable');
 return registry.save(JSON.parse(input),0);
 }catch{throw Error('Private registry initialization unavailable');}
}
`;
 checkAppsScriptCompatibility(source,'PrivateIdentityRegistry.gs');return source;
}
module.exports={render};
