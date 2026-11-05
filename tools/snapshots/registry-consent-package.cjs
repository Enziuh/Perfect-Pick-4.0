'use strict';
const {EMAIL_SCOPE}=require('./registry-scopes.cjs');
const helper=require('./private-registry-package.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const NAME='pp4CompletePrivateRegistryConsent';
function render(){const source=`
// Temporary editor-only consent. No registry access or public endpoint.
function ${NAME}() {
 ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [${JSON.stringify(EMAIL_SCOPE)}]);
 const info=ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL,[${JSON.stringify(EMAIL_SCOPE)}]);
 const scopes=info.getAuthorizedScopes();
 const emailScopeAuthorized=Array.isArray(scopes) && scopes.indexOf(${JSON.stringify(EMAIL_SCOPE)})>=0;
 let activeOwnerMatches=false,effectiveOwnerMatches=false;
 if(emailScopeAuthorized){
  try{const c=pp4PrivateRegistryConfig_();
   if(c && c.ownerOnlyEditorReviewed===true && typeof c.ownerEmail==='string'){
    activeOwnerMatches=Session.getActiveUser().getEmail()===c.ownerEmail;
    effectiveOwnerMatches=Session.getEffectiveUser().getEmail()===c.ownerEmail;
   }
  }catch(_){}
 }
 const report={state:emailScopeAuthorized&&activeOwnerMatches&&effectiveOwnerMatches?'OWNER_IDENTITY_VERIFIED':'BLOCKED',emailScopeAuthorized,authorizationStatusKnown:Array.isArray(scopes),activeOwnerMatches,effectiveOwnerMatches,registryWritesEnabled:false,diagnosticWrites:0};
 console.log(JSON.stringify(report));
 return report;
}
`;checkAppsScriptCompatibility(source,'TemporaryRegistryConsent.gs');return source;}
// Temporary capability restriction; preserves both reviewed identity guards. Refuse
// any unreviewed source rather than silently patching an arbitrary editor helper.
function readOnlyHelper(source,config){
 const reviewed=helper.render().replace('function pp4PrivateRegistryConfig_() { return null; }','function pp4PrivateRegistryConfig_() { return '+JSON.stringify(config)+'; }');
 if(source!==reviewed)throw Error('Reviewed helper mismatch');
 const marker=' return (',end=".join('')});\n}";
 if(source.split(marker).length!==2||source.split(end).length!==2)throw Error('Read-only helper boundary mismatch');
 const result=source.replace(marker,' const registry=(').replace(end,".join('')});\n return Object.freeze({load:()=>registry.load()});\n}");
 checkAppsScriptCompatibility(result,'OwnerIdentityRegistry.gs');return result;
}
module.exports={NAME,render,readOnlyHelper};
