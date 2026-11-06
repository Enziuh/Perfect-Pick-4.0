'use strict';
// Private Google execution only. GitHub dependency accepts a validated public file, never source/store.
const {safeCode}=require('./github-error.cjs');
const {project,historicalEqual,stableContent}=require('./cloud-projector.cjs'),{production}=require('./production-policy.cjs'),{plan}=require('./activity.cjs');
function createCloudPublisher(d){
 function tick(){
  const config=d.config();if(!config||config.enabled!==true)return {state:'DISABLED'};
  let held=false,phase='OWNER',boundary=null;
  try{
   if(config.cloudPublicationApproved!==true||d.owner()!==config.ownerEmail)throw Error();
   if(!d.lock.acquire())return {state:'BUSY'};held=true;
   phase='STATE';let state=d.state.load()||{};const now=d.now();
   if(state.intent){const remote=d.github.read();if(d.digest(JSON.stringify(remote.file))===state.intent.hash){state={...state,pending:{commit:remote.commit,hash:state.intent.hash}};delete state.intent;d.state.save(state);}else if(remote.sha===state.intent.previousSha){state={...state,nextRunAt:null};delete state.intent;d.state.save(state);}else throw Error();}
   // Never re-dispatch an expired candidate after missed clocks. Recover with a fresh read.
   if(state.pending&&Number.isFinite(Date.parse(state.expiresAt))&&Date.parse(state.expiresAt)<=now){state={...state,nextRunAt:null,lastError:{code:'EXPIRED_PENDING_RECOVERY',at:new Date(now).toISOString()}};delete state.pending;d.state.save(state);}
   // A pending unexpired generation is resumed, not overwritten.
   if(state.pending){
    if(!/^[a-f0-9]{40}$/.test(state.pending.commit)||!/^[a-f0-9]{64}$/.test(state.pending.hash)||!Number.isFinite(Date.parse(state.expiresAt)))throw Error();
    phase='DEPLOYMENT';const result=d.github.status(state.pending.commit);
    if(result==='PENDING'){if(Date.parse(state.expiresAt)-now<1800000)throw Error();return {state:'WAITING_FOR_CI'};}
    if(result==='MISSING'){d.github.dispatch();return {state:'DISPATCH_RETRIED'};}
    if(result==='FAILED'&&(state.pending.retries||0)<1&&Date.parse(state.expiresAt)-now>1800000){state.pending.retries=(state.pending.retries||0)+1;d.state.save(state);d.github.dispatch();return {state:'CI_RETRY_QUEUED'};}if(result!=='SUCCESS')throw Error();
    const live=d.github.published();production(live,d.now());
    if(d.digest(JSON.stringify(live))!==state.pending.hash)throw Error();
    state={nextRunAt:state.nextRunAt,lastSuccessAt:new Date(d.now()).toISOString(),expiresAt:live.expiresAt};d.state.save(state);
   }
   if(state.nextRunAt&&Date.parse(state.nextRunAt)>now)return {state:'NOT_DUE',nextRunAt:state.nextRunAt};
   phase='REGISTRY';const registry=d.registry.load();if(registry.generation!==1||registry.store.entries.length!==23)throw Error();
   phase='SOURCE';const source=d.readSource();
   phase='PROJECTION';const file=project(source,registry.store,d.now(),new Map(config.approvedAliases.map(a=>[a.player,a.alias])));
   const activity=plan(source,d.now()),nextRunAt=new Date(Math.min(Date.parse(activity.nextCheckAt),Date.parse(file.expiresAt)-1800000)).toISOString();
   if(Date.parse(nextRunAt)<=d.now())throw Error();
   phase='PUBLIC_BASELINE';const previous=d.github.read();if(!previous||!previous.file||!previous.sha)throw Error();
   production(previous.file,Date.parse(previous.file.capturedAt));
   if(!historicalEqual(previous.file,file)||JSON.stringify(previous.file.payload.aliases)!==JSON.stringify(file.payload.aliases)||Date.parse(file.generatedAt)<Date.parse(previous.file.generatedAt)||file.payload.snapshot.revision<previous.file.payload.snapshot.revision)throw Error();
   if(state.lastSuccessAt&&stableContent(previous.file)===stableContent(file)&&Date.parse(previous.file.expiresAt)-d.now()>activity.intervalMs+900000){d.state.save({...state,nextRunAt});return {state:'UNCHANGED',nextRunAt};}
   phase='PUBLIC_WRITE';boundary='PUBLIC_VALIDATION';production(file,d.now());const hash=d.digest(JSON.stringify(file));
   // Save a public-only intent before the network write so a crash is recoverable.
   boundary='INTENT_SAVE';d.state.save({...state,nextRunAt,expiresAt:file.expiresAt,intent:{hash,previousSha:previous.sha}});
   boundary='GITHUB_PUT';const commit=d.github.write(file,previous.sha);if(!/^[a-f0-9]{40}$/.test(commit))throw Error();
   boundary='PENDING_SAVE';d.state.save({...state,nextRunAt,pending:{commit,hash},expiresAt:file.expiresAt});
   phase='DISPATCH';boundary=null;d.github.dispatch();return {state:'QUEUED',nextRunAt,players:23,games:272};
  }catch(error){
   const detail=safeCode(error);
   if(held)try{const prior=d.state.load()||{};d.state.save({...prior,lastError:{code:phase,boundary,detail,at:new Date(d.now()).toISOString()}});}catch{}
   // Fixed label only: native failure notification must not contain inputs or exception text.
   throw Error('Cloud snapshot publication blocked: '+phase+(boundary?'/'+boundary:'')+(detail?'/'+detail:''));
  }finally{if(held)d.lock.release();}
 }
 return Object.freeze({tick});
}
module.exports={createCloudPublisher};
