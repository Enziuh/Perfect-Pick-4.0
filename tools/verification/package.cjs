'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {checkAppsScriptCompatibility}=require('./gas-compatibility.cjs');
const {buildOfflineBundle}=require('../sheets/offline-bundle.cjs');
const {inspectLocalTarget,assertNoPrivateReferences}=require('./local-target.cjs');
const ROOT=path.resolve(__dirname,'../..'),STAGE=path.join(ROOT,'.verification-package');
const FILES=Object.freeze(['Verification.gs','appsscript.json']);
const SOURCES=Object.freeze(['tools/sheets/offline-bundle.cjs','tools/sheets/sheets-read-adapter.cjs','tools/sheets/workbook-profile.cjs','tools/compatibility/pp3-identity.cjs','tools/compatibility/legacy-prize-facts.cjs','tools/contracts/live-contract.cjs','tools/projector/project-competition.cjs','tools/projector/monthly-decision.cjs','tools/verification/timestamps.cjs','tools/verification/owner-evidence.cjs','tools/verification/offline-report.cjs','tools/verification/disabled-entry.cjs','tools/verification/prepared-diagnostic.cjs','tools/verification/owner-connection.cjs','tools/verification/private-owner-config.cjs','tools/verification/package-manifest.json']);
const SCOPE='https://www.googleapis.com/auth/spreadsheets.readonly';
const ENTRY='\n// Owner-editor diagnostic. Disabled unless the private source provider is explicitly configured.\nfunction verifyPerfectPick4Package_(){\n  const report=PerfectPickVerificationPackage_.diagnostic();\n  return report;\n}\n';
const need=(ok,message='Verification package rejected')=>{if(!ok)throw Error(message);};
function safePath(file){let current=path.resolve(file);need(fs.existsSync(current));while(current!==path.dirname(current)){need(!fs.lstatSync(current).isSymbolicLink(),'Symlink rejected');current=path.dirname(current);}}
function render(){
 for(const relative of SOURCES){const full=path.join(ROOT,relative);safePath(full);need(fs.statSync(full).isFile());}
 const bundle=buildOfflineBundle(),suffix='})(globalThis);';need(bundle.endsWith(suffix));
 const privateBundle=bundle.slice(0,-suffix.length)+'})(privateRoot);';
 const script='var PerfectPickVerificationPackage_=(function(){\nconst privateRoot={};\n'+privateBundle+'\nreturn Object.freeze({diagnostic:privateRoot.PerfectPick4ReadOnly.createOwnerDiagnostic(privateRoot.PerfectPick4ReadOnly.loadPrivateOwnerConfig,function(){return Sheets;},function(){return Date.now();})});\n})();'+ENTRY;
 checkAppsScriptCompatibility(script,'Verification.gs');
 return {'Verification.gs':script,'appsscript.json':fs.readFileSync(path.join(__dirname,'package-manifest.json'),'utf8')};
}
function inspect(contents){
 need(JSON.stringify(Object.keys(contents).sort())===JSON.stringify([...FILES].sort()),'Unexpected package files');
 const source=contents['Verification.gs'],text=contents['appsscript.json'];
 checkAppsScriptCompatibility(source,'Verification.gs');
 const manifest=JSON.parse(text);
 need(JSON.stringify(Object.keys(manifest).sort())===JSON.stringify(['timeZone','runtimeVersion','exceptionLogging','oauthScopes','dependencies'].sort()),'Unexpected manifest fields');
 need(manifest.timeZone==='America/Los_Angeles'&&manifest.runtimeVersion==='V8'&&manifest.exceptionLogging==='NONE','Unexpected runtime/logging');
 need(JSON.stringify(manifest.oauthScopes)===JSON.stringify([SCOPE]),'Read-only scope required');
 need(JSON.stringify(manifest.dependencies)===JSON.stringify({enabledAdvancedServices:[{userSymbol:'Sheets',serviceId:'sheets',version:'v4'}]}),'Unexpected dependencies');
 for(const value of [source,text.replaceAll(SCOPE,'')]){need(typeof value==='string'&&!value.includes('\0'));need(!/https?:\/\//i.test(value),'Endpoint reference rejected');assertNoPrivateReferences(value);}
 const forbidden=[/\b(?:doGet|doPost|onOpen|onEdit|onFormSubmit|setup\w*|syncNFL\w*|backfill\w*|TEMP_\w*|ensureNFL\w*)\s*\(/,
  /\b(?:SpreadsheetApp|FormApp|ScriptApp|PropertiesService|UrlFetchApp|DriveApp|GmailApp|MailApp|ContentService|HtmlService|Session|Logger|console)\s*[.(]/,
  /\.\s*(?:setValue|setValues|insertSheet|deleteSheet|deleteRows?|appendRow|setAcceptingResponses|newTrigger|batchUpdate|update|append|clearContents|clear)\s*\(/,
  /\b(?:fetch|eval|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(/,/new\s+Function\b/,/sourceMappingURL/];
 need(!forbidden.some(pattern=>pattern.test(source)),'Forbidden package capability');
 need(source.endsWith(ENTRY),'Disabled diagnostic required');
 const expected=render();need(FILES.every(file=>contents[file]===expected[file]),'Package differs from approved source assembly');
 return Object.fromEntries(FILES.map(file=>[file,crypto.createHash('sha256').update(contents[file]).digest('hex')]));
}
function sealPath(dir){return dir+'.seal.json';}
function verify(dir=STAGE,enforceSeal=true){
 safePath(dir);need(fs.statSync(dir).isDirectory());const names=fs.readdirSync(dir).sort();need(JSON.stringify(names)===JSON.stringify([...FILES].sort()),'Unexpected package files');
 const contents={};for(const file of FILES){const full=path.join(dir,file);safePath(full);need(fs.lstatSync(full).isFile(),'Non-file rejected');contents[file]=fs.readFileSync(full,'utf8');}
 const hashes=inspect(contents);
 if(enforceSeal){safePath(sealPath(dir));need(JSON.stringify(hashes)===fs.readFileSync(sealPath(dir),'utf8'),'Package seal mismatch');}
 return hashes;
}
function stage(dir=STAGE){
 if(fs.existsSync(dir)){safePath(dir);need(fs.statSync(dir).isDirectory());need(fs.readdirSync(dir).every(name=>FILES.includes(name)),'Unexpected staging input');}
 else fs.mkdirSync(dir,{recursive:true});
 const contents=render();inspect(contents);
 for(const file of FILES){const full=path.join(dir,file);if(fs.existsSync(full)){safePath(full);need(fs.lstatSync(full).isFile());}fs.writeFileSync(full,contents[file],{mode:0o600});}
 const hashes=verify(dir,false);
 if(fs.existsSync(sealPath(dir)))safePath(sealPath(dir));fs.writeFileSync(sealPath(dir),JSON.stringify(hashes),{mode:0o600});
 return verify(dir,true);
}
if(require.main===module){
 try{
  const command=process.argv[2];need(process.argv.length===3,'Use stage, verify or target');
  if(command==='target')console.log(JSON.stringify(inspectLocalTarget()));
  else {need(command==='stage'||command==='verify','Use stage, verify or target');const hashes=command==='stage'?stage():verify();console.log(JSON.stringify({package:'PASS',files:FILES,hashes,diagnostic:'DISABLED',readyForUpload:false}));}
 }catch{console.error('Verification package check failed. No upload or read attempted.');process.exitCode=1;}
}
module.exports={FILES,SOURCES,STAGE,render,inspect,stage,verify,inspectLocalTarget};
