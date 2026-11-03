'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const pkg=require('../tools/verification/package.cjs');
const {assessTarget}=require('../tools/verification/local-target.cjs');
const {writeDenyingServices}=require('./support/write-denying-services.cjs');
const temp=()=>fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'pp-verification-package-'));
function withPackage(fn){const root=temp(),dir=path.join(root,'package');try{pkg.stage(dir);return fn(dir);}finally{fs.rmSync(root,{recursive:true,force:true,maxRetries:10});}}
test('independent package is exactly one script plus a strict read-only manifest',()=>withPackage(dir=>{
 assert.deepEqual(fs.readdirSync(dir).sort(),['Verification.gs','appsscript.json']);assert.equal(Object.keys(pkg.verify(dir)).length,2);
 const m=JSON.parse(fs.readFileSync(path.join(dir,'appsscript.json'),'utf8'));
 assert.deepEqual(m.oauthScopes,['https://www.googleapis.com/auth/spreadsheets.readonly']);assert.equal(m.exceptionLogging,'NONE');assert.equal(m.runtimeVersion,'V8');
 assert(!Object.hasOwn(m,'webapp'));assert(!Object.hasOwn(m,'executionApi'));assert(!Object.hasOwn(m.dependencies,'libraries'));
 assert.deepEqual(m.dependencies.enabledAdvancedServices,[{userSymbol:'Sheets',serviceId:'sheets',version:'v4'}]);
}));
test('package assembles only reviewed pure modules; no copied legacy function or mutation service',()=>{
 assert(pkg.SOURCES.every(s=>s.startsWith('tools/')&&!s.startsWith('apps-script/')));
 const source=pkg.render()['Verification.gs'];
 for(const name of ['setupPerfectPick3_0','setupTriggers3_0','syncNFLResults3_0','ensureNFLResultColumns3_0_','TEMP_apply5050PrizeRules','PP_forceOpenForm','PP_forceCloseForm','doGet','doPost','SpreadsheetApp','FormApp','ScriptApp','PropertiesService','UrlFetchApp','DriveApp'])assert(!new RegExp('\\b'+name+'\\s*[.(]').test(source),name);
 assert(!source.includes('node:'));assert(!source.includes('readFileSync'));assert(!source.includes('writeFileSync'));
});
test('offline load and diagnostic need no configuration and cannot invoke a read',()=>withPackage(dir=>{
 const denied=writeDenyingServices();let reads=0;
 const context=vm.createContext({...denied.globals,Map,Set,Date,Error,Sheets:new Proxy({}, {get(){reads++;throw Error('Forbidden native access');}})});
 vm.runInContext(fs.readFileSync(path.join(dir,'Verification.gs'),'utf8'),context);
 const result=context.verifyPerfectPick4Package_({enabled:true,owner:true,read(){reads++;}});
 assert.equal(result.state,'DISABLED');assert.equal(result.reason,'OWNER_AUTHORIZATION_AND_ISOLATION_REQUIRED');assert.equal(reads,0);assert.deepEqual(denied.attempts,[]);
 assert.equal(context.doGet,undefined);assert.equal(context.doPost,undefined);assert.equal(context.require,undefined);assert.equal(context.module,undefined);
 assert.equal(context.PerfectPick4ReadOnly,undefined);assert.deepEqual(Object.keys(context.PerfectPickVerificationPackage_),['diagnostic']);
 assert.deepEqual(Object.keys(result).sort(),['reason','state']);
}));
test('purported private configuration cannot enable diagnostic or publish data',()=>withPackage(dir=>{
 const context=vm.createContext({Map,Set,Date,Error,PP_OWNER_CONFIG:{enabled:true,privateTarget:'FABRICATED_PRIVATE',aliases:'FABRICATED_PRIVATE',closed:true}});
 vm.runInContext(fs.readFileSync(path.join(dir,'Verification.gs'),'utf8'),context);
 const output=JSON.stringify(context.verifyPerfectPick4Package_());assert(!output.includes('FABRICATED'));assert(output.includes('DISABLED'));
}));
test('every manifest escalation and endpoint setting is rejected',()=>{
 const baseline=pkg.render();
 for(const mutate of [m=>m.oauthScopes.push('FORBIDDEN'),m=>m.webapp={access:'ANYONE_ANONYMOUS'},m=>m.executionApi={access:'ANYONE'},m=>m.dependencies.libraries=[],m=>m.exceptionLogging='STACKDRIVER',m=>m.dependencies.enabledAdvancedServices.push({userSymbol:'Drive',serviceId:'drive',version:'v3'})]){
  const m=JSON.parse(baseline['appsscript.json']);mutate(m);assert.throws(()=>pkg.inspect({...baseline,'appsscript.json':JSON.stringify(m)}));
 }
});
test('secret/linkage, networking, handlers and write-capable additions cannot enter the package',()=>{
 for(const extra of ['\nfunction doGet(){return 1;}','\nSpreadsheetApp.openById("FORBIDDEN");','\nSheets.Spreadsheets.Values.update();','\nFormApp.openById("FORBIDDEN");','\nScriptApp.newTrigger("FORBIDDEN");','\nfetch("https://example.invalid");','\nconst value="invented@example.invalid";','\nconst token="ghp_abcdefghijklmnopqrstuvwxyz0123456789";']){
  const content=pkg.render();content['Verification.gs']+=extra;assert.throws(()=>pkg.inspect(content));
 }
});
test('actual staging rejects unknown files, target config, symlinks, directories and source maps',()=>{
 for(const name of ['.clasp.json','OwnerPrivateConfig.gs','backup.zip','Verification.gs.map','source'])withPackage(dir=>{
  if(name==='source')fs.mkdirSync(path.join(dir,name));else fs.writeFileSync(path.join(dir,name),'FORBIDDEN');assert.throws(()=>pkg.verify(dir));assert.throws(()=>pkg.stage(dir));
 });
 withPackage(dir=>{fs.unlinkSync(path.join(dir,'Verification.gs'));fs.symlinkSync(path.join(dir,'appsscript.json'),path.join(dir,'Verification.gs'));assert.throws(()=>pkg.verify(dir));assert.throws(()=>pkg.stage(dir));});
});
test('artifact seals and exact reviewed source assembly reject tampering',()=>withPackage(dir=>{
 fs.appendFileSync(path.join(dir,'Verification.gs'),'\n// changed bytes');assert.throws(()=>pkg.verify(dir));
 pkg.stage(dir);fs.writeFileSync(dir+'.seal.json','{}');assert.throws(()=>pkg.verify(dir));
}));
test('target assessment never certifies remote identity or returns identifiers',()=>{
 const a='fabricated_script_alpha_000000',b='fabricated_script_beta_000000';
 const result=assessTarget({scriptId:a,ignored:true,tracked:false,legacyIds:[b]});assert.equal(result.localTarget,'DISTINCT_FROM_HISTORICAL_LEGACY');assert.equal(result.remoteProjectIdentity,'OWNER_CONFIRMATION_REQUIRED');assert.equal(result.readyForUpload,false);assert(!JSON.stringify(result).includes(a));assert(!JSON.stringify(result).includes(b));
 for(const input of [{scriptId:a,ignored:true,tracked:false,legacyIds:[a]},{scriptId:a,ignored:false,tracked:false,legacyIds:[b]},{scriptId:a,ignored:true,tracked:true,legacyIds:[b]},{scriptId:a,ignored:true,tracked:false,legacyIds:[]}])assert.equal(assessTarget(input).localTarget,'NOT_VERIFIED');
});
test('target inspection CLI reports status only; no clasp or network operation',()=>{
 const out=cp.execFileSync(process.execPath,[path.resolve(__dirname,'../tools/verification/package.cjs'),'target'],{encoding:'utf8'});const status=JSON.parse(out);assert.equal(status.readyForUpload,false);assert.equal(status.remoteProjectIdentity,'OWNER_CONFIRMATION_REQUIRED');assert.deepEqual(Object.keys(status),['localTarget','remoteProjectIdentity','readyForUpload']);
});
test('package is ignored and never added to the synthetic six-file publication',()=>{
 const {FILES}=require('../tools/security/public-artifact.cjs');assert.equal(FILES.length,6);assert(!FILES.includes('Verification.gs'));assert(!FILES.includes('appsscript.json'));
 for(const file of ['.verification-package/Verification.gs','.verification-package.seal.json'])cp.execFileSync('git',['check-ignore','-q',file]);
 assert.equal(cp.execFileSync('git',['ls-files','--','.verification-package'],{encoding:'utf8'}).trim(),'');
});
