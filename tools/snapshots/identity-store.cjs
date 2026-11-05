'use strict';
// Private publisher only. Never bundled into a browser or publication artifact.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {PUBLIC_ID,validate}=require('./identity-contract.cjs');
function assign(store,sourceKeys,random=crypto.randomBytes){
 validate(store);const result=structuredClone(store),byKey=new Map(result.entries.map(e=>[e.sourceKey,e.publicId])),used=new Set(byKey.values());
 const forbidden=new Set([...sourceKeys,...store.entries.map(e=>e.sourceKey)]);
 for(const sourceKey of sourceKeys){if(!/^p_[a-z0-9]{8,32}$/.test(sourceKey))throw Error('Invalid private identity store');if(byKey.has(sourceKey))continue;
  const bytes=random(16);if(!Buffer.isBuffer(bytes)||bytes.length!==16)throw Error('Invalid identity entropy');const publicId='p_'+bytes.toString('hex');
  if(used.has(publicId)||forbidden.has(publicId))throw Error('Public ID collision');used.add(publicId);byKey.set(sourceKey,publicId);result.entries.push({sourceKey,publicId});
 }
 validate(result);return {store:result,ids:byKey};
}
// Explicit private reconciliation for a verified source-key change. Never infer
// continuity from a display name. Old snapshots remain public-ID compatible.
function rekey(store,{previousSourceKey,nextSourceKey,verifiedSamePlayer}={}){
 validate(store);if(verifiedSamePlayer!==true||!/^p_[a-z0-9]{8,32}$/.test(nextSourceKey||'')||!store.entries.some(e=>e.sourceKey===previousSourceKey)||store.entries.some(e=>e.sourceKey===nextSourceKey))throw Error('Verified private reconciliation required');
 const result=structuredClone(store);result.entries.find(e=>e.sourceKey===previousSourceKey).sourceKey=nextSourceKey;return validate(result);
}
function privatePath(file){
 const root=path.resolve(__dirname,'../..'),target=path.resolve(file);
 // Development storage restricted to the existing ignored tmp tree. Not a durable
 // production registry. Reject links anywhere in its ancestry and tracked paths.
 if(!target.startsWith(path.join(root,'tmp')+path.sep))throw Error('Ignored private storage required');
 for(let p=path.dirname(target);p!==root;p=path.dirname(p))if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Ignored private storage required');
 cp.execFileSync('git',['check-ignore','--quiet',target],{cwd:root,stdio:'ignore'});
 if(fs.existsSync(target)&&(!fs.lstatSync(target).isFile()||fs.lstatSync(target).isSymbolicLink()||(fs.statSync(target).mode&0o077)!==0))throw Error('Restricted private file required');return target;
}
function load(file){const target=privatePath(file);return fs.existsSync(target)?validate(JSON.parse(fs.readFileSync(target,'utf8'))):{version:1,entries:[]};}
function save(file,store){validate(store);const target=privatePath(file);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});const temp=target+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(store),{mode:0o600,flag:'wx'});fs.renameSync(temp,target);}finally{fs.rmSync(temp,{force:true});}}
module.exports={PUBLIC_ID,validate,assign,rekey,load,save};
