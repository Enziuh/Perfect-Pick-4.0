/* Served only by the owner-restricted Apps Script presentation build. No endpoint URL or client secret. */
function startLiveClient(root,createViewAdapter){
 let api=null,pending=null,last=0,expiry=null,failed=false;
 const SIX_HOURS=21600000;
 function notify(name){root.document.dispatchEvent(new root.Event(name));}
 function clear(){api=null;failed=true;notify('perfectpick:unavailable');}
 function fetchModel(force=false){
  if(pending)return pending;if(api&&!force)return Promise.resolve(api);
  if(failed&&!force)return Promise.reject(Error('Competition data unavailable'));
  pending=new Promise((resolve,reject)=>{
   const fail=()=>{api=null;failed=true;reject(Error('Competition data unavailable'));};
   try{root.google.script.run.withSuccessHandler(reply=>{
    try{
     if(reply?.state!=='READY'||!reply.model||!Number.isFinite(reply.model.expiresAt)||reply.model.expiresAt<=Date.now())throw Error();
     api=createViewAdapter(reply.model,()=>Date.now());failed=false;last=Date.now();
     root.clearTimeout(expiry);expiry=root.setTimeout(()=>{clear();refresh();},Math.max(1,reply.model.expiresAt-Date.now()));
     const button=root.document.getElementById('submitPicks'),note=root.document.getElementById('submitPicksNote');
     if(button&&note){const f=reply.model.form;const replacement=root.document.createElement(f?.available?'a':'button');replacement.id='submitPicks';replacement.className='submit-picks';replacement.textContent='Submit Picks';replacement.setAttribute('aria-describedby','submitPicksNote');if(f?.available){replacement.href=f.url;replacement.target='_blank';replacement.rel='noopener noreferrer';}else replacement.disabled=true;button.replaceWith(replacement);note.textContent=f?.message||'Official entry link unavailable.';}
     resolve(api);
    }catch{fail();}
   }).withFailureHandler(fail).getPerfectPickDashboard();}catch{fail();}
  }).finally(()=>{pending=null;}).catch(error=>{clear();throw error;});return pending;
 }
 async function refresh(){try{await fetchModel(true);notify('perfectpick:refresh');}catch{}}
 const adapter={kind:'live',get:async(...args)=>(await fetchModel()).get(...args)};
 for(const method of ['buildMatchView','buildWeeklyPrize','resolveMonthlyChampion'])adapter[method]=(...args)=>{if(!api)throw Error('Competition data unavailable');return api[method](...args);};
 Object.defineProperty(root,'PerfectPickPreview',{value:Object.freeze(adapter),writable:false,configurable:false});
 root.setInterval(refresh,SIX_HOURS);
 root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden&&Date.now()-last>=SIX_HOURS)refresh();});
 root.document.addEventListener('DOMContentLoaded',()=>{root.document.getElementById('refreshResults')?.addEventListener('click',refresh);});
}
if(typeof module!=='undefined'&&module.exports)module.exports={startLiveClient};
