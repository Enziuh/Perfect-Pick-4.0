'use strict';
// Local activation candidate only. NOT wired to Pages or any upload command.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {FILES:BASE}=require('../security/public-artifact.cjs'),{TEAM_FILES,validateLogo}=require('../security/team-assets.cjs');
const {assertNoPrivateReferences}=require('../verification/local-target.cjs');
const {validate,scanText}=require('./schema.cjs'),{assets}=require('./local-preview.cjs');
const FILES=Object.freeze([...BASE.filter(f=>f!=='fixtures/preview.json'),'data/snapshot.json']);
function inventory(dir,prefix=''){
 if(!fs.lstatSync(dir).isDirectory()||fs.lstatSync(dir).isSymbolicLink())throw Error('Unsafe artifact');
 return fs.readdirSync(dir).flatMap(name=>{const file=prefix+name,p=path.join(dir,name),s=fs.lstatSync(p);if(s.isSymbolicLink())throw Error('Unsafe artifact');if(s.isDirectory()){if(!['data','assets','assets/teams'].includes(file))throw Error('Unexpected directory');return inventory(p,file+'/');}if(!s.isFile())throw Error('Unsafe artifact');return [file];}).sort();
}
function verify(dir,now){
 if(JSON.stringify(inventory(dir))!==JSON.stringify([...FILES].sort()))throw Error('Exact static artifact allowlist required');
 const file=JSON.parse(fs.readFileSync(path.join(dir,'data/snapshot.json'),'utf8'));validate(file,now);scanText(JSON.stringify(file));const expected=assets(file),hashes={};
 for(const name of FILES){const text=fs.readFileSync(path.join(dir,name),'utf8');if(text!==expected[name])throw Error('Unexpected artifact content');if(TEAM_FILES.includes(name))validateLogo(text);assertNoPrivateReferences(text);hashes[name]=crypto.createHash('sha256').update(text).digest('hex');}
 const seal=dir+'.seal.json';if(!fs.lstatSync(seal).isFile()||fs.lstatSync(seal).isSymbolicLink()||fs.readFileSync(seal,'utf8')!==JSON.stringify(hashes))throw Error('Static artifact integrity failure');return hashes;
}
function stage(file,dir,now){
 const root=path.resolve('tmp'),target=path.resolve(dir);if(!target.startsWith(root+path.sep))throw Error('Ignored local output required');
 for(let p=path.dirname(target);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Unsafe output');if(p===root)break;}
 if(fs.existsSync(target)||fs.existsSync(target+'.seal.json'))throw Error('Fresh directory required');validate(file,now);const contents=assets(file),hashes={};
 try{fs.mkdirSync(target,{recursive:true,mode:0o700});for(const name of FILES){fs.mkdirSync(path.dirname(path.join(target,name)),{recursive:true});fs.writeFileSync(path.join(target,name),contents[name],{mode:0o600});hashes[name]=crypto.createHash('sha256').update(contents[name]).digest('hex');}fs.writeFileSync(target+'.seal.json',JSON.stringify(hashes),{mode:0o600,flag:'wx'});return verify(target,now);}catch{fs.rmSync(target,{recursive:true,force:true});fs.rmSync(target+'.seal.json',{force:true});throw Error('Static artifact blocked');}
}
module.exports={FILES,verify,stage};
