'use strict';
const {createDashboardModel,createViewAdapter,TEAM_NAMES}=require('../presentation/contract-dashboard.cjs');
const {policyAlias}=require('../compatibility/pp3-display-name.cjs');
const {approvedPlayerDestination}=require('../presentation/form-entry.cjs');
function decode(reply,now){
 if(!reply||Object.keys(reply).sort().join(',')!=='activeWeek,aliases,control,form,schema,snapshot'||reply.schema!=='PP4_JSON_V1'||!Array.isArray(reply.aliases)||reply.aliases.length>1000)throw Error('Competition data unavailable');
 const aliases=new Map();for(const a of reply.aliases){if(!a||Object.keys(a).sort().join(',')!=='alias,player'||aliases.has(a.player))throw Error('Competition data unavailable');aliases.set(a.player,a.alias);}
 const disclosed=new Map();
 for(const w of reply.snapshot?.weeks||[])for(const p of w.picks||[])disclosed.set(p.player,p.alias);
 if(disclosed.size!==aliases.size||[...aliases].some(([player,alias])=>disclosed.get(player)!==alias||!policyAlias(alias)))throw Error('Competition data unavailable');
 const s=reply.snapshot;const trust={now,maxAgeMs:120000,aliases,closures:new Map((s?.weeks||[]).map(w=>[w.week,w.entry])),aliasCompleteness:new Map((s?.weeks||[]).map(w=>[w.week,Object.hasOwn(w,'picks')])),prizes:new Map((s?.prizes||[]).map(p=>[p.key,p]))};
 if(reply.form!==null&&!approvedPlayerDestination(reply.form))throw Error('Competition data unavailable');
 const model=createDashboardModel(s,trust,{activeWeek:reply.activeWeek,form:reply.form});
 const c=reply.control,iso=v=>v===''||typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
 if(!c||Object.keys(c).sort().join(',')!=='activeWeek,firstGame,firstKickoff,picksClose,reportedStatus'||c.activeWeek!==reply.activeWeek||!['OPEN','CLOSED','UPCOMING','UNKNOWN'].includes(c.reportedStatus)||!iso(c.firstKickoff)||!iso(c.picksClose)||!(c.firstGame===''||s.games.some(g=>g.week===reply.activeWeek&&TEAM_NAMES[g.home]+' vs '+TEAM_NAMES[g.away]===c.firstGame)))throw Error('Competition data unavailable');
 const destination=approvedPlayerDestination(reply.form);if(destination&&model.weeks.find(w=>w.week===reply.activeWeek).entriesStatus!=='CLOSED')model.form={available:true,url:destination,label:'Submit Picks',message:'Official Form · Check entry availability on the Form.'};
 Object.assign(model.prizes.formControl,c);
 // Lightweight frontend metadata avoids cloning every historical pick list just
 // to label week controls. Actual disclosure still uses the validated week model.
 model.prizes.weekAvailability=model.weeks.map(w=>({week:w.week,entriesStatus:w.entriesStatus,visibility:w.visibility,hasPlayers:w.visibility==='AVAILABLE'&&w.standings.length>0}));
 return model;
}
function install(root,config){
 if(config.form!==undefined&&!approvedPlayerDestination(config.form))throw Error('Approved official Form link required');
 const endpoint=config.endpoint;if(!/^https:\/\/script\.google\.com\/macros\/s\/AKfycb[A-Za-z0-9_-]{14,194}\/exec$/.test(endpoint))throw Error('Approved JSON endpoint required');
 let current=null,pending=null,expiryTimer=null,refreshTimer=null,failed=false,last=0,expiresAt=0,degraded=false,acceptedAt=-1,acceptedRevision=-1;
 const notice=name=>root.document.dispatchEvent(new root.Event(name));
 const clear=()=>{current=null;failed=true;notice('perfectpick:unavailable');};
 const fresh=()=>current&&Date.now()<expiresAt;
 const wait=ms=>new Promise(resolve=>root.setTimeout(resolve,ms));
 const invalid=()=>Object.assign(Error('Competition data unavailable'),{kind:'INVALID'});
 async function request(force=false){
  if(pending)return pending;if(fresh()&&!force)return current;
  if(failed&&!force)throw Error('Competition data unavailable');
  notice('perfectpick:loading');
  pending=(async()=>{
   let model;
   for(let attempt=0;attempt<3;attempt++){
    if(attempt)await wait(attempt===1?400:1200);
    const controller=new root.AbortController(),timeout=root.setTimeout(()=>controller.abort(),20000);
    try{
     const response=await root.fetch(endpoint+'?action=dashboard4&rules=LATE_ENTRY_V1',{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',redirect:'follow',signal:controller.signal});
     if(!response.ok)throw Error('Network unavailable');
     if(!/^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com)\//.test(response.url)||!/^application\/json\b/i.test(response.headers.get('content-type')||''))throw invalid();
     const text=await response.text();if(text.length>2000000)throw invalid();
     try{
      const reply=JSON.parse(text);model=decode(reply,Date.now());
      const at=Date.parse(reply.snapshot.generatedAt),revision=reply.snapshot.revision;
      if(at<acceptedAt||revision<acceptedRevision)throw invalid();
      acceptedAt=at;acceptedRevision=revision;
     }catch{throw invalid();}
     break;
    }catch(error){if(attempt===2)throw error;}
    finally{root.clearTimeout(timeout);}
   }
   const official=approvedPlayerDestination(config.form);
   if(official&&model.weeks.find(w=>w.week===model.prizes.activeWeek).entriesStatus!=='CLOSED'&&model.prizes.formControl.reportedStatus!=='CLOSED')model.form={available:true,url:official,label:'Submit Picks',message:'Continue to the existing official Google Form. Entry availability is controlled by the Form.'};
   current=createViewAdapter(model,()=>Date.now());failed=false;degraded=false;last=Date.now();expiresAt=model.expiresAt;
   root.clearTimeout(expiryTimer);root.clearTimeout(refreshTimer);
   // Refresh ahead of expiry. Never extend disclosure evidence to cover an outage.
   refreshTimer=root.setTimeout(refresh,Math.max(1,expiresAt-Date.now()-30000));
   expiryTimer=root.setTimeout(()=>{clear();refresh();},Math.max(1,expiresAt-Date.now()));
   const button=root.document.getElementById('submitPicks'),note=root.document.getElementById('submitPicksNote');
   if(button&&note){const f=model.form;const link=root.document.createElement(f.available?'a':'button');link.id='submitPicks';link.className='submit-picks';link.textContent='Submit Picks';if(f.available){link.href=f.url;link.target='_blank';link.rel='noopener noreferrer';}else link.disabled=true;link.setAttribute('aria-describedby','submitPicksNote');button.replaceWith(link);note.textContent=f.message;}
   return current;
  })().catch(error=>{if(fresh()){degraded=true;notice('perfectpick:degraded');if(error.kind==='INVALID')notice('perfectpick:invalid');return current;}clear();throw Error('Competition data unavailable');}).finally(()=>{pending=null;notice('perfectpick:settled');});return pending;
 }
 async function refresh(){if(pending){try{await pending;}catch{}return;}try{await request(true);if(!degraded)notice('perfectpick:refresh');}catch{}}
 const adapter={kind:'live',get:async(...args)=>(await request()).get(...args)};
 for(const name of ['buildMatchView','buildWeeklyPrize','resolveMonthlyChampion'])adapter[name]=(...args)=>{if(!current)throw Error('Competition data unavailable');return current[name](...args);};
 Object.defineProperty(root,'PerfectPickPreview',{value:Object.freeze(adapter),writable:false,configurable:false});
 root.setInterval(refresh,21600000);
 root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden&&Date.now()-last>=120000)refresh();});
 root.document.addEventListener('DOMContentLoaded',()=>root.document.getElementById('refreshResults')?.addEventListener('click',refresh));
}
module.exports={decode,install};
