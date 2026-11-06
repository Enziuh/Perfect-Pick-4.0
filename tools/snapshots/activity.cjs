'use strict';
// Pure scheduling plan only. Never installs timers/triggers or publishes data.
const intervals=Object.freeze({LIVE:900000,GAME_DAY:1800000,NON_GAME_DAY:21600000,UNVERIFIED:1800000,CLOSURE:0});
function plan(reply,now,{timezone='America/Los_Angeles',closureApproved=false,previous=null}={}){
 if(!Number.isSafeInteger(now)||!reply?.snapshot?.games)throw Error('Activity unavailable');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}),date=t=>formatter.format(new Date(t));
 const s=reply.snapshot,active=s.games.filter(g=>g.week===reply.activeWeek),fresh=g=>Number.isFinite(Date.parse(g.verifiedAt))&&Date.parse(g.verifiedAt)<=now&&now-Date.parse(g.verifiedAt)<=120000;
 let activity='UNVERIFIED';
 if(active.length&&active.every(fresh)){
  if(active.some(g=>g.status==='IN_PROGRESS'))activity='LIVE';
  else if(active.every(g=>g.kickoff!==null&&Number.isFinite(Date.parse(g.kickoff))))activity=active.some(g=>date(g.kickoff)===date(now))?'GAME_DAY':'NON_GAME_DAY';
 }
 const newlyClosed=closureApproved&&s.weeks.some(w=>w.entry.status==='CLOSED'&&w.entry.authority==='OFFICIAL'&&Date.parse(w.entry.validUntil)>now&&previous?.snapshot?.weeks.find(p=>p.week===w.week)?.entry.status!=='CLOSED');
 if(newlyClosed)activity='CLOSURE';
 const intervalMs=intervals[activity];return {activity,intervalMs,nextCheckAt:new Date(now+intervalMs).toISOString(),sourceObservedAt:s.generatedAt,scoreUpdatedAt:null,scoresLive:null,liveGameReported:activity==='LIVE',scheduler:'OWNER_PRIVATE_PUBLISHER_NOT_INSTALLED',publicationEnabled:false};
}
module.exports={plan,intervals};
