'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {decode}=require('../api/browser-client.cjs'),{projectReply,scanText,validate}=require('./schema.cjs');
const identity=require('./identity-store.cjs');
function generate(reply,store,now,{approvedAliases}={}){
 try{
  if(!(approvedAliases instanceof Map)||reply.aliases.some(a=>approvedAliases.get(a.player)!==a.alias))throw Error();
  decode(reply,now); // Reject unknown/unauthorized source fields, never copy blindly.
  const assigned=identity.assign(store,reply.aliases.map(a=>a.player));
  const payload=projectReply(reply,assigned.ids),model=decode(payload,now);
  const file={schema:'PP4_STATIC_V1',generatedAt:payload.snapshot.generatedAt,expiresAt:new Date(model.expiresAt).toISOString(),payload};
  validate(file,now);scanText(JSON.stringify(file),store.entries.map(e=>e.sourceKey).concat(reply.aliases.map(a=>a.player)));
  return {file,store:assigned.store};
 }catch{throw Error('Snapshot generation blocked');}
}
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function outputPath(dir){
 const root=path.resolve(__dirname,'../..','tmp'),target=path.resolve(dir);
 if(!target.startsWith(root+path.sep))throw Error('Local ignored prototype output required');
 for(let p=target;;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Unsafe output');if(p===root)break;}
 return target;
}
function verify(dir,now){
 try{const target=outputPath(dir);if(!fs.lstatSync(target).isDirectory()||fs.readdirSync(target).join(',')!=='snapshot.json')throw Error();
 const file=path.join(target,'snapshot.json');if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink())throw Error();
 const text=fs.readFileSync(file,'utf8'),model=validate(JSON.parse(text),now);scanText(text);
 const seal=target+'.seal.json';if(fs.lstatSync(seal).isSymbolicLink()||fs.readFileSync(seal,'utf8')!==hash(text))throw Error();return model;
 }catch{throw Error('Snapshot artifact blocked');}
}
// A generation is immutable. Publish selection/atomic hosting remains DISABLED;
// do not mutate a previous good directory if any step fails.
function stage(reply,mappingFile,dir,now,approval){
 const target=outputPath(dir);if(fs.existsSync(target)||fs.existsSync(target+'.seal.json'))throw Error('Fresh generation directory required');
 const result=generate(reply,identity.load(mappingFile),now,approval),text=JSON.stringify(result.file);
 scanText(text,result.store.entries.map(e=>e.sourceKey));
 fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});const temp=fs.mkdtempSync(path.join(path.dirname(target),'.snapshot-'));
 try{
  fs.writeFileSync(path.join(temp,'snapshot.json'),text,{mode:0o600});
  // Persist private random identities BEFORE making even a local generation available.
  // A failed generation may leave unused IDs, never a published ID without its map.
  identity.save(mappingFile,result.store);fs.writeFileSync(target+'.seal.json',hash(text),{flag:'wx',mode:0o600});fs.renameSync(temp,target);verify(target,now);
 }catch{fs.rmSync(temp,{recursive:true,force:true});fs.rmSync(target,{recursive:true,force:true});fs.rmSync(target+'.seal.json',{force:true});throw Error('Snapshot staging blocked');}
 return {files:['snapshot.json'],players:result.file.payload.aliases.length,expiresAt:result.file.expiresAt};
}
// Private local publisher input. No credentials, registry or phone data needed.
// Caller must separately authorize a real capture; nothing runs at module load.
async function readPublicApi(config,fetcher=fetch){
 if(!config||Object.keys(config).sort().join(',')!=='approved,endpoint'||config.approved!==true||!/^https:\/\/script\.google\.com\/macros\/s\/AKfycb[A-Za-z0-9_-]{14,194}\/exec$/.test(config.endpoint))throw Error('Reviewed source required');
 try{
 const response=await fetcher(config.endpoint+'?action=dashboard4',{signal:AbortSignal.timeout(20000),credentials:'omit',cache:'no-store'});
 if(!response.ok||!/^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com)\//.test(response.url)||!/^application\/json\b/i.test(response.headers.get('content-type')||''))throw Error('Source unavailable');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();throw Error();}chunks.push(value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('Source unavailable');}finally{reader.releaseLock();}
 }catch{throw Error('Source unavailable');}
}
module.exports={generate,stage,verify,readPublicApi};
