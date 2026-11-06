'use strict';
// Restricted owner-publisher state, never a GitHub input/artifact. Google remains
// the proposed primary identity store; a local mirror alone is not durable.
const os=require('node:os'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {isDeepStrictEqual}=require('node:util'),{encrypt,decrypt}=require('./encrypted-backup.cjs'),{validate}=require('./schema.cjs');
function target(file){
 const root=path.resolve(__dirname,'../..'),p=path.resolve(file),outside=path.join(os.homedir(),'Library/Application Support/Perfect Pick/Private Registry');const local=['tmp','backups'].some(d=>p.startsWith(path.join(root,d)+path.sep));if(!local&&!p.startsWith(outside+path.sep))throw Error('Restricted private state required');
 if(!local&&fs.existsSync(outside)&&(fs.statSync(outside).mode&0o077)!==0)throw Error('Restricted private state required');
 for(let dir=path.dirname(p);dir!==path.dirname(dir);dir=path.dirname(dir))if(fs.existsSync(dir)&&fs.lstatSync(dir).isSymbolicLink())throw Error('Restricted private state required');
 if(local)cp.execFileSync('git',['check-ignore','--quiet',p],{cwd:root,stdio:'ignore'});
 if(fs.existsSync(p)&&(!fs.lstatSync(p).isFile()||fs.lstatSync(p).isSymbolicLink()||(fs.statSync(p).mode&0o077)!==0))throw Error('Restricted private state required');return p;
}
function atomic(file,value){const p=target(file);fs.mkdirSync(path.dirname(p),{recursive:true,mode:0o700});const temp=p+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';try{const fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(value));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,p);}finally{fs.rmSync(temp,{force:true});}}
function independentBackup(file,getKey,{testOnly=false}={}){return async state=>{
 let pending;
 try{const p=target(file);if(!testOnly&&p.startsWith(path.resolve(__dirname,'../..')+path.sep))throw Error('Recovery export must stay outside repository');const key=await getKey(),sealed=encrypt(state.store,key,{generation:state.generation});pending=p+'.pending-'+crypto.randomBytes(8).toString('hex')+'.json';
 atomic(pending,{version:1,generation:state.generation,backup:sealed});const restored=JSON.parse(fs.readFileSync(target(pending),'utf8'));
 if(restored.version!==1||restored.generation!==state.generation||!isDeepStrictEqual(decrypt(restored.backup,key,{expectedGeneration:state.generation}),state.store))throw Error();
 // Preserve a prior encrypted export before promoting the verified new copy.
 if(fs.existsSync(p)){const old=JSON.parse(fs.readFileSync(p,'utf8'));decrypt(old.backup,key,{expectedGeneration:old.generation});atomic(p+'.previous',old);}
 fs.renameSync(pending,p);return {verified:true,generation:state.generation,players:state.store.entries.length};
 }catch{throw Error('Independent private backup unavailable');}finally{if(pending)fs.rmSync(pending,{force:true});}
 };}
function archive(file,clock=Date.now){return Object.freeze({async load(){try{const p=target(file);if(!fs.existsSync(p))return null;const value=JSON.parse(fs.readFileSync(p,'utf8'));validate(value,Date.parse(value.capturedAt));return value;}catch{throw Error('Private archive unavailable');}},async commit(value){validate(value,clock());atomic(file,value);}});}
module.exports={independentBackup,archive,target,atomic};
