'use strict';
const path=require('node:path');
const {bundle}=require('../api/bundle.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const NAME='pp4InspectPrivateRegistryReadOnly';
function render(){const source=`
function pp4InspectPrivateRegistryReadOnly() {
 const inspector=${bundle(path.join(__dirname,'registry-prerequisites.cjs'))};
 const result=inspector.inspect({config:()=>pp4PrivateRegistryConfig_(),activeUser:()=>Session.getActiveUser().getEmail(),effectiveUser:()=>Session.getEffectiveUser().getEmail(),bootstrap:()=>pp4RegistryOwnerBootstrap_(),properties:()=>PropertiesService.getScriptProperties(),digest:text=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join(''),loadRegistry:()=>pp4PrivateRegistry_().load()});
 console.log(JSON.stringify(result));
 return result;
}
`;checkAppsScriptCompatibility(source,'TemporaryRegistryReadOnlyInspection.gs');return source;}
module.exports={NAME,render};
