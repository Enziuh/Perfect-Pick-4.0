'use strict';
// Local Git/filesystem inspection only. Never returns an identifier or its digest.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const git=(...args)=>cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const valid=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{20,200}$/.test(id);
let cache;
function privateFacts(){
 const refs=['main','develop'].map(ref=>{try{git('rev-parse','--verify',ref);return ref;}catch{return 'origin/'+ref;}});
 const configPath=path.join(ROOT,'apps-script/.clasp.json');
 let current=null,privateConfig='';
 if(fs.existsSync(configPath)){if(fs.lstatSync(configPath).isSymbolicLink())throw Error('Unverifiable local target');privateConfig=fs.readFileSync(configPath,'utf8');current=JSON.parse(privateConfig).scriptId;if(!valid(current))throw Error('Unverifiable local target');}
 const source=fs.readFileSync(path.join(ROOT,'apps-script/src/00_Config_Setup.js'),'utf8');
 const revision=refs.map(ref=>git('rev-parse',ref).trim()).join('|')+crypto.createHash('sha256').update(privateConfig+source).digest('hex');
 if(cache?.revision===revision)return cache;
 const legacy=new Set(),identifiers=new Set();
 for(const match of source.matchAll(/SHEET_ID\s*:\s*['"]([^'"]+)/g))identifiers.add(match[1]);
 for(const commit of git('rev-list',...refs).trim().split('\n')){
  for(const name of ['apps-script/.clasp.json','website/config.js','apps-script/src/00_Config_Setup.js']){
   if(!git('ls-tree','--name-only',commit,'--',name).trim())continue;
   const text=git('show',commit+':'+name);
   for(const m of text.matchAll(/(?:"scriptId"\s*:\s*"|SHEET_ID\s*:\s*['"])([^'"\s]+)/g))identifiers.add(m[1]);
   for(const m of text.matchAll(/https:\/\/script\.google\.com\/macros\/s\/([^/'"\s]+)/g))identifiers.add(m[1]);
   if(name==='apps-script/.clasp.json'){const id=JSON.parse(text).scriptId;if(valid(id))legacy.add(id);}
  }
 }
 if(!legacy.size||identifiers.size<2)throw Error('Incomplete local history');
 if(current)identifiers.add(current);
 cache={revision,current,legacy,identifiers};return cache;
}
function assessTarget({scriptId,ignored,tracked,legacyIds}){
 const distinct=valid(scriptId)&&ignored===true&&tracked===false&&Array.isArray(legacyIds)&&legacyIds.length>0&&!legacyIds.includes(scriptId);
 return {localTarget:distinct?'DISTINCT_FROM_HISTORICAL_LEGACY':'NOT_VERIFIED',remoteProjectIdentity:'OWNER_CONFIRMATION_REQUIRED',readyForUpload:false};
}
function inspectLocalTarget(){
 try{const facts=privateFacts();let ignored=false;try{git('check-ignore','-q','apps-script/.clasp.json');ignored=true;}catch{}
  return assessTarget({scriptId:facts.current,ignored,tracked:Boolean(git('ls-files','--','apps-script/.clasp.json').trim()),legacyIds:[...facts.legacy]});
 }catch{return {localTarget:'NOT_VERIFIED',remoteProjectIdentity:'OWNER_CONFIRMATION_REQUIRED',readyForUpload:false};}
}
function assertNoPrivateReferences(text){
 try{
  const {identifiers}=privateFacts();
  const patterns=[/-----BEGIN .*PRIVATE KEY-----/,/\b(?:gh[pousr]_|github_pat_|AIza|ya29\.)[\w.-]+/,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,/(?<!\d)(?:\+1[- .]?)?\(?\d{3}\)?[- .]\d{3}[- .]\d{4}(?!\d)/,/(?:api[_-]?key|client[_-]?secret|refresh[_-]?token|access[_-]?token|password)\s*[=:]/i];
  if([...identifiers].some(id=>text.includes(id))||patterns.some(p=>p.test(text)))throw Error();
 }catch{throw Error('Verification privacy check failed');}
}
module.exports={assessTarget,inspectLocalTarget,assertNoPrivateReferences};
