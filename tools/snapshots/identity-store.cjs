'use strict';
// Private publisher only. Never bundled into a browser or publication artifact.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const PUBLIC_ID=/^p_[a-f0-9]{32}$/;
function validate(store){
 if(!store||Object.keys(store).sort().join(',')!=='entries,version'||store.version!==1||!Array.isArray(store.entries)||store.entries.length>10000)throw Error('Invalid private identity store');
 const sources=new Set(),ids=new Set();
 for(const e of store.entries){if(!e||Object.keys(e).sort().join(',')!=='publicId,sourceKey'||typeof e.sourceKey!=='string'||!/^p_[a-z0-9]{8,32}$/.test(e.sourceKey)||!PUBLIC_ID.test(e.publicId)||sources.has(e.sourceKey)||ids.has(e.publicId)||e.sourceKey===e.publicId)throw Error('Invalid private identity store');sources.add(e.sourceKey);ids.add(e.publicId);}
 return store;
}
function assign(store,sourceKeys,random=crypto.randomBytes){
 validate(store);const result=structuredClone(store),byKey=new Map(result.entries.map(e=>[e.sourceKey,e.publicId])),used=new Set(byKey.values());
 for(const sourceKey of sourceKeys){if(!/^p_[a-z0-9]{8,32}$/.test(sourceKey))throw Error('Invalid private identity store');if(byKey.has(sourceKey))continue;
  const bytes=random(16);if(!Buffer.isBuffer(bytes)||bytes.length!==16)throw Error('Invalid identity entropy');const publicId='p_'+bytes.toString('hex');
  if(used.has(publicId)||sourceKey===publicId)throw Error('Public ID collision');used.add(publicId);byKey.set(sourceKey,publicId);result.entries.push({sourceKey,publicId});
 }
 validate(result);return {store:result,ids:byKey};
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
module.exports={PUBLIC_ID,validate,assign,load,save};
