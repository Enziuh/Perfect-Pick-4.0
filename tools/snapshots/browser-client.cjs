'use strict';
const {validate}=require('./schema.cjs');
const {plan}=require('./activity.cjs');
const {createViewAdapter}=require('../presentation/contract-dashboard.cjs');
const {approvedPlayerDestination}=require('../presentation/form-entry.cjs');
// Isolated local prototype. Existing api profile is the explicit rollback path;
// static validation failures NEVER fall through to another source.
function install(root,config){
 if(!config||Object.keys(config).join(',')!=='snapshot'||config.snapshot!=='./data/snapshot.json')throw Error('Same-origin snapshot required');
 let degraded=false,current=null,pending=null,expiry=0,timer=null,acceptedAt=-1,acceptedRevision=-1,activityTimer=null;
 const emit=name=>root.document.dispatchEvent(new root.Event(name));
 const clear=()=>{current=null;root.clearTimeout(activityTimer);const note=root.document.getElementById('staticSnapshotNotice');if(note)note.textContent='Competition snapshot expired or unavailable. Refresh to retry.';emit('perfectpick:unavailable');};
 const fresh=()=>current&&Date.now()<expiry;
 async function request(force=false){
  if(current&&!fresh())clear();
  if(pending)return pending;if(fresh()&&!force)return current;
  emit('perfectpick:loading');
  pending=(async()=>{
   let model,official=null,refreshInterval=21600000;
   for(let attempt=0;attempt<3;attempt++){
    if(attempt)await new Promise(r=>root.setTimeout(r,attempt===1?400:1200));
    const controller=new root.AbortController(),timeout=root.setTimeout(()=>controller.abort(),10000);
    try{
     const expected=new URL(config.snapshot,root.location.href);
     const res=await root.fetch(expected.href,{signal:controller.signal,credentials:'omit',cache:'no-store',redirect:'error'});
     if(!res.ok||res.url!==expected.href||!/^application\/json\b/i.test(res.headers.get('content-type')||''))throw Error();
     const text=await res.text();if(text.length>2000000)throw Error();
     const file=JSON.parse(text);model=validate(file,Date.now());official=approvedPlayerDestination(file.payload.form);refreshInterval=plan(file.payload,Date.now()).intervalMs;
     const at=Date.parse(file.generatedAt),revision=file.payload.snapshot.revision;
     if(at<acceptedAt||revision<acceptedRevision)throw Error();acceptedAt=at;acceptedRevision=revision;break;
    }catch{if(attempt===2)throw Error('Snapshot unavailable');}
    finally{root.clearTimeout(timeout);}
   }
   const freshness=root.document.getElementById('staticSnapshotNotice');if(freshness)freshness.textContent=model.prizes.staticFreshness?'Snapshot checked '+new Date(model.prizes.staticFreshness.sourceObservedAt).toLocaleString('en-US',{timeZone:'America/Los_Angeles',timeZoneName:'short'})+'. Scores reflect the latest available Sheet read; score-update time is not provided. Valid for up to six hours.':'Verified short-lived competition snapshot.';
   if(official&&!model.form.available)model.form={available:true,url:official,label:'Open official Form',message:'Check entry availability on the official Form. Reopening does not reset game cutoffs or authorize public picks.'};
   degraded=false;current=createViewAdapter(model,()=>Date.now());expiry=model.expiresAt;root.clearTimeout(timer);timer=root.setTimeout(clear,Math.max(1,expiry-Date.now()));
   const control=root.document.getElementById('submitPicks'),note=root.document.getElementById('submitPicksNote');
   if(control&&note){const form=model.form,link=root.document.createElement(form.available?'a':'button');link.id='submitPicks';link.className='submit-picks';link.textContent='Submit Picks';if(form.available&&approvedPlayerDestination({url:form.url,verified:true,approvedForPlayers:true})){link.href=form.url;link.target='_blank';link.rel='noopener noreferrer';}else link.disabled=true;link.setAttribute('aria-describedby','submitPicksNote');control.replaceWith(link);note.textContent=form.message;}
   root.clearTimeout(activityTimer);if(refreshInterval<21600000)activityTimer=root.setTimeout(refresh,Math.max(900000,refreshInterval));
   return current;
  })().catch(()=>{if(fresh()){degraded=true;emit('perfectpick:degraded');return current;}clear();throw Error('Competition data unavailable');}).finally(()=>{pending=null;emit('perfectpick:settled');});return pending;
 }
 async function refresh(){if(pending){await pending.catch(()=>{});return;}try{await request(true);if(!degraded)emit('perfectpick:refresh');}catch{}}
 const adapter={kind:'live',get:async(...args)=>(await request()).get(...args)};
 for(const name of ['buildMatchView','buildWeeklyPrize','resolveMonthlyChampion'])adapter[name]=(...args)=>{if(!fresh()){clear();throw Error('Competition data unavailable');}return current[name](...args);};
 Object.defineProperty(root,'PerfectPickPreview',{value:Object.freeze(adapter),writable:false,configurable:false});
 root.document.addEventListener('DOMContentLoaded',()=>root.document.getElementById('refreshResults')?.addEventListener('click',refresh));
 root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden&&!fresh())return refresh();});
 root.setInterval(refresh,21600000); // six-hour fallback; verified activity adds15/30-minute same-origin checks, never API polling
}
module.exports={install};
