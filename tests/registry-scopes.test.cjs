'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {SCOPES,EMAIL_SCOPE,explicitManifest}=require('../tools/snapshots/registry-scopes.cjs');
test('staging manifest pins only four inherited permissions and approved email scope without changing other settings',()=>{
 const original={timeZone:'America/Los_Angeles',dependencies:{},runtimeVersion:'V8',webapp:{access:'MYSELF',executeAs:'USER_ACCESSING'}};
 const next=explicitManifest(original);assert.equal(next.oauthScopes.length,5);assert(next.oauthScopes.includes(EMAIL_SCOPE));assert.equal(new Set(next.oauthScopes).size,5);const {oauthScopes,...rest}=next;assert.deepEqual(rest,original);assert.equal(original.oauthScopes,undefined);assert.deepEqual(explicitManifest(next),next);
 assert.throws(()=>explicitManifest({...original,oauthScopes:['unapproved']}));assert.throws(()=>explicitManifest({...original,oauthScopes:'bad'}));assert(Object.isFrozen(SCOPES));
});
test('authorization probe returns only scope booleans and performs no writes when identity remains unauthorized',()=>{
 const source=require('../tools/snapshots/registry-prerequisites-package.cjs').render();
 for(const granted of [[],[EMAIL_SCOPE],null]){let writes=0;const context={console:{log:s=>{assert(!s.includes('PRIVATE_SECRET'));}},ScriptApp:{AuthMode:{FULL:'FULL'},getAuthorizationInfo:(mode,scopes)=>{assert.equal(mode,'FULL');assert.deepEqual(Array.from(scopes),[EMAIL_SCOPE]);return {getAuthorizedScopes:()=>granted};}},pp4PrivateRegistryConfig_:()=>({enabled:true,ownerOnlyEditorReviewed:true,ownerEmail:'owner@example.invalid'}),Session:{getActiveUser:()=>({getEmail(){throw Error('userinfo.email PRIVATE_SECRET');}}),getEffectiveUser:()=>({getEmail(){throw Error('userinfo.email PRIVATE_SECRET');}})},PropertiesService:{getScriptProperties(){writes++;throw Error('Must not access');}}};vm.createContext(context);vm.runInContext(source,context);const r=context.pp4InspectPrivateRegistryReadOnly();assert.equal(r.code,'ACTIVE_EMAIL_SCOPE_REQUIRED');assert.equal(r.emailScopeAuthorized,Array.isArray(granted)&&granted.includes(EMAIL_SCOPE));assert.equal(r.authorizationStatusKnown,Array.isArray(granted));assert.equal(r.namespaceInspected,false);assert.equal(writes,0);}
});
