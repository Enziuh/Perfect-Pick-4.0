'use strict';
// Additive, disabled file for EXISTING private staging project; never uploaded automatically.
const path=require('node:path'),{bundle}=require('../api/bundle.cjs'),{checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
function render(){
 let source=String.raw`// Private owner clock handler ONLY. No doGet/doPost/web deployment.
function pp4CloudOwn_(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function pp4CloudClone_(value){return JSON.parse(JSON.stringify(value));}
function pp4CloudSnapshotConfig_(){try{
 const value=PropertiesService.getScriptProperties().getProperty('PP4_CLOUD_SNAPSHOT_CONFIG');
 if(!value)return null;const c=JSON.parse(value);if(!c||c.enabled!==true)return null;
 if(c.cloudPublicationApproved!==true||typeof c.ownerEmail!=='string'||!c.ownerEmail.includes('@')||!Array.isArray(c.approvedAliases)||c.approvedAliases.length!==23||!/^https:\/\/script\.google\.com\/macros\/s\/AKfycb[A-Za-z0-9_-]{14,194}\/exec$/.test(c.endpoint))throw Error('Cloud publisher configuration blocked');return c;
}catch{throw Error('Cloud publisher configuration blocked');}}
function pp4CloudDigest_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function pp4CloudSnapshotTick(){
 const c=pp4CloudSnapshotConfig_();if(!c)return {state:'DISABLED'};
 const properties=PropertiesService.getScriptProperties(),lock=LockService.getScriptLock();
 const owner=()=>Session.getEffectiveUser().getEmail();
 const api='https://api.github.com/repos/Enziuh/Perfect-Pick-4.0';
 function request(path,method,body){
  const token=properties.getProperty('PP4_CLOUD_GITHUB_TOKEN');if(typeof token!=='string'||token.length<20)throw Error('Publisher credential unavailable');
  const options={method:method||'get',followRedirects:false,muteHttpExceptions:true,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}};
  if(body!==undefined){options.contentType='application/json';options.payload=JSON.stringify(body);}
  const r=UrlFetchApp.fetch(api+path,options),status=r.getResponseCode();if(status<200||status>=300)throw Error('GitHub publication unavailable');const text=r.getContentText();if(text.length>2000000)throw Error('GitHub publication unavailable');return text?JSON.parse(text):null;
 }
 function read(){const r=request('/contents/public-data/snapshot.json?ref=develop');if(r.encoding!=='base64'||r.type!=='file')throw Error();const text=Utilities.newBlob(Utilities.base64Decode(r.content.replace(/\s/g,''))).getDataAsString('UTF-8');if(text.length>2000000)throw Error();const commits=request('/commits?sha=develop&path=public-data/snapshot.json&per_page=1');return {file:JSON.parse(text),sha:r.sha,commit:commits[0].sha};}
 const deps={config:()=>c,owner,now:()=>Date.now(),digest:pp4CloudDigest_,lock:{acquire:()=>lock.tryLock(1000),release:()=>lock.releaseLock()},
 state:{load:()=>{const s=properties.getProperty('PP4_CLOUD_PUBLISHER_STATE');return s?JSON.parse(s):null;},save:value=>{const s=JSON.stringify(value);if(s.length>8000)throw Error();properties.setProperty('PP4_CLOUD_PUBLISHER_STATE',s);}},
 registry:{load:()=>(${bundle(path.join(__dirname,'private-registry.cjs'))}).registry({assertOwner:()=>owner()===c.ownerEmail,properties:{getProperty:k=>properties.getProperty(k)},lock:{waitLock:()=>{},releaseLock:()=>{}},digest:pp4CloudDigest_}).load()},
 readSource:()=>{let url=c.endpoint+'?action=dashboard4&rules=LATE_ENTRY_V1';for(let i=0;i<3;i++){const r=UrlFetchApp.fetch(url,{method:'get',followRedirects:false,muteHttpExceptions:true});const status=r.getResponseCode();if(status===302||status===303){const h=r.getAllHeaders();url=h.Location||h.location;if(!/^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com)\//.test(url))throw Error();continue;}if(status!==200)throw Error();const t=r.getContentText();if(t.length>2000000)throw Error();return JSON.parse(t);}throw Error();},
 github:{read,write:(file,sha)=>{const content=JSON.stringify(file);const r=request('/contents/public-data/snapshot.json','put',{message:'Refresh validated public competition snapshot',branch:'develop',sha,content:Utilities.base64Encode(content,Utilities.Charset.UTF_8)});return r.commit.sha;},
 dispatch:()=>request('/actions/workflows/pages.yml/dispatches','post',{ref:'develop',inputs:{profile:'static'}}),
 status:commit=>{const r=request('/actions/workflows/pages.yml/runs?branch=develop&head_sha='+commit+'&per_page=20'),runs=r.workflow_runs.filter(r=>r.head_sha===commit&&r.event==='workflow_dispatch');if(!runs.length)return 'MISSING';const run=runs[0];return run.status!=='completed'?'PENDING':run.conclusion==='success'?'SUCCESS':'FAILED';},
 published:()=>{const r=UrlFetchApp.fetch('https://enziuh.github.io/Perfect-Pick-4.0/data/snapshot.json',{method:'get',followRedirects:false,muteHttpExceptions:true});if(r.getResponseCode()!==200)throw Error();const t=r.getContentText();if(t.length>2000000)throw Error();return JSON.parse(t);}}};
 return (${bundle(path.join(__dirname,'cloud-publisher.cjs'))}).createCloudPublisher(deps).tick();
}
// Explicit owner approval required before running this installer. Existing triggers untouched.
function pp4InstallCloudSnapshotClock(){
 const c=pp4CloudSnapshotConfig_();if(!c||c.installPublisherTriggerApproved!==true||Session.getActiveUser().getEmail()!==c.ownerEmail||Session.getEffectiveUser().getEmail()!==c.ownerEmail)throw Error('Cloud clock installation not approved');
 const existing=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='pp4CloudSnapshotTick');if(existing.length>1)throw Error('Duplicate publisher clocks require owner review');if(existing.length)return {state:'ALREADY_INSTALLED'};
 ScriptApp.newTrigger('pp4CloudSnapshotTick').timeBased().everyMinutes(15).create();return {state:'INSTALLED'};
}
`;
 source=source.replaceAll('Object.hasOwn(', 'pp4CloudOwn_(').replaceAll('structuredClone(', 'pp4CloudClone_(');
 checkAppsScriptCompatibility(source,'CloudSnapshotPublisher.gs');return source;
}
function verify(dir){
 const fs=require('node:fs'),crypto=require('node:crypto');
 if(fs.lstatSync(dir).isSymbolicLink()||fs.readdirSync(dir).join(',')!=='CloudSnapshotPublisher.gs')throw Error('Exact additive package required');
 const file=path.join(dir,'CloudSnapshotPublisher.gs'),seal=dir+'.seal.json';if(fs.lstatSync(file).isSymbolicLink()||fs.lstatSync(seal).isSymbolicLink())throw Error('Unsafe package');
 const source=fs.readFileSync(file,'utf8');if(source!==render()||fs.readFileSync(seal,'utf8')!==JSON.stringify({sha256:crypto.createHash('sha256').update(source).digest('hex')}))throw Error('Cloud package integrity failure');return true;
}
function stage(dir=path.resolve('tmp/cloud-publisher-package')){
 const fs=require('node:fs'),crypto=require('node:crypto'),root=path.resolve('tmp'),target=path.resolve(dir);if(!target.startsWith(root+path.sep)||fs.existsSync(target)||fs.existsSync(target+'.seal.json'))throw Error('Fresh ignored package path required');
 for(let p=path.dirname(target);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Unsafe package');if(p===root)break;}
 fs.mkdirSync(target,{recursive:true,mode:0o700});const source=render();fs.writeFileSync(path.join(target,'CloudSnapshotPublisher.gs'),source,{mode:0o600,flag:'wx'});fs.writeFileSync(target+'.seal.json',JSON.stringify({sha256:crypto.createHash('sha256').update(source).digest('hex')}),{mode:0o600,flag:'wx'});return verify(target);
}
module.exports={render,stage,verify};
