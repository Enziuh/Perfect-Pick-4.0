'use strict';
const {projectCompetition}=require('../projector/project-competition.cjs');
const {validatePublic}=require('../contracts/live-contract.cjs');
const evidence=require('../verification/owner-evidence.cjs');
const {normalizePhone}=require('../compatibility/pp3-identity.cjs');
const {mapApprovedPrizeFacts}=require('../compatibility/legacy-prize-facts.cjs');
const {TEAM_NAMES}=require('../presentation/contract-dashboard.cjs');
const {approvedPlayerDestination}=require('../presentation/form-entry.cjs');
// Additive facade over the EXISTING PP3 context, latest-submission and prize builders.
// No service access, writer, replacement identity registry or score-sync implementation.
function createLegacyProvider(deps){
 return function read(){
  try{
   const cfg=deps.config();if(cfg?.enabled!==true)return {state:'DISABLED'};
   if(cfg.publicationApproved!==true)throw Error();
   const now=deps.now(),at=new Date(now).toISOString(),revision=cfg.revision;
   if(!Number.isSafeInteger(revision)||revision<0)throw Error();
   const ctx=deps.context(),prizes=deps.prizes(ctx),games=[],definitions=new Map();
   const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ').replace(/\s+vs\.?\s+/g,' vs ');
   const team=v=>{const matches=Object.entries(TEAM_NAMES).filter(([abbr,name])=>norm(v)===abbr.toLowerCase()||norm(v).split(' ').pop()===norm(name).split(' ').pop());if(matches.length!==1)throw Error();return matches[0][0];};
   for(const [week,lookup] of Object.entries(ctx.resultLookup))for(const r of Object.values(lookup)){
    const w=Number(week),home=team(r.team1),away=team(r.team2);
    if(!Number.isInteger(w)||w<1||w>18||home===away||norm(r.game)!==norm(r.team1+' vs '+r.team2))throw Error();
    definitions.set(w+'|'+norm(r.game),{week:w,game:'g_w'+String(w).padStart(2,'0')+home.toLowerCase()+away.toLowerCase()+'x',home,away});
    games.push({week:w,game:r.game,team1:r.team1,team2:r.team2,winner:r.winner,status:r.status,team1Score:r.team1Score,team2Score:r.team2Score,verifiedAt:at});
   }
   const weeks=[...new Set(games.map(g=>g.week))].sort((a,b)=>a-b);
   const maxAgeMs=120000;
   const policy={now,revision,maxAgeMs,aliases:new Map(),closures:new Map(),completeWeeks:new Map(),games:definitions,teams:new Map(Object.entries(TEAM_NAMES).map(([a,n])=>[n,a])),periods:[],decisions:new Map(),accounting:new Map(),seasonWeeks:weeks};
   const authority=cfg.authority;
   if(authority){
    policy.aliases=evidence.aliases(authority.aliases,revision,normalizePhone);
    policy.closures=evidence.closures(authority.closures,{revision,now,maxAgeMs});
    if(['OPEN','UPCOMING'].includes(prizes.formControl?.status))policy.closures.delete(Number(prizes.formControl.activeWeek));
    policy.decisions=authority.decisions||new Map();policy.accounting=authority.accounting||new Map();
   }
   policy.periods=(prizes.periods||[]).map(p=>({key:p.periodKey,startWeek:p.startWeek,endWeek:p.endWeek,designatedGame:p.tiebreakRule?.method==='Combined Points'?definitions.get(p.endWeek+'|'+norm(p.tiebreakRule.game))?.game??null:null}));
   const latest=policy.closures.size?Object.values(deps.latest(ctx.responses,ctx.games)):[];
   const selected=weeks.filter(w=>policy.closures.has(w));if(selected.length)policy.seasonWeeks=selected;
   const source={revision,observedAt:at,season:prizes.season,games,weeks:weeks.map(week=>{
    const closed=policy.closures.has(week),columns=ctx.games.filter(g=>g.week===week),required=games.filter(g=>g.week===week);
    const complete=closed&&columns.length===required.length&&required.every(g=>columns.some(c=>norm(c.game)===norm(g.game)));
    policy.completeWeeks.set(week,complete);
    return {week,submissions:complete?latest.filter(s=>s.week===week).map(s=>{
     if(!Number.isFinite(s.timestamp)||s.timestamp<=0)throw Error();
     const p=policy.periods.find(p=>p.endWeek===week&&p.designatedGame),r=p?games.find(g=>definitions.get(week+'|'+norm(g.game))?.game===p.designatedGame):null;
     const t=deps.prediction(s.response,week);
     return {identity:normalizePhone(s.phone),timestamp:new Date(s.timestamp).toISOString(),selections:columns.map(g=>({game:g.game,pick:s.response[g.header]})),prediction:r?{game:r.game,value:t.prediction}:null};
    }):[]};
   })};
   // Preserve PP3 pots/overrides/NEW rollover/shares; require explicit accounting approval.
   if(authority?.poolStates instanceof Map){const rollovers=new Map((prizes.weekly||[]).filter(w=>w.finalized&&w.rolloverToMonthly>0).map(w=>[w.week,w.periodKey]));policy.accounting=mapApprovedPrizeFacts(prizes,{revision,verifiedAt:at,pools:authority.poolStates,rollovers});}
   const snapshot=projectCompetition(source,policy);if(snapshot.state!=='READY')throw Error();
   const trust={now,maxAgeMs,aliases:new Map([...policy.aliases.values()].map(a=>[a.player,a.alias])),closures:new Map([...policy.closures].map(([w,c])=>[w,c.entry])),aliasCompleteness:new Map(snapshot.weeks.map(w=>[w.week,Array.isArray(w.picks)])),prizes:new Map(snapshot.prizes.map(p=>[p.key,p]))};
   validatePublic(snapshot,trust);
   const activeWeek=Number(prizes.activeWeek);if(!weeks.includes(activeWeek))throw Error();
   const c=prizes.formControl||{},first=games.find(g=>norm(g.game)===norm(c.firstGame)&&g.week===Number(c.activeWeek));
   const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v?v:'';
   const control={activeWeek,firstGame:first?TEAM_NAMES[team(first.team1)]+' vs '+TEAM_NAMES[team(first.team2)]:'',firstKickoff:iso(c.firstKickoff),picksClose:iso(c.picksClose),reportedStatus:['OPEN','CLOSED','UPCOMING'].includes(c.status)?c.status:'UNKNOWN'};
   return {schema:'PP4_JSON_V1',snapshot,control,aliases:[...trust.aliases].map(([player,alias])=>({player,alias})),activeWeek,form:approvedPlayerDestination(cfg.form)?{url:cfg.form.url,verified:true,approvedForPlayers:true}:null};
  }catch{return {state:'UNAVAILABLE'};}
 };
}
module.exports={createLegacyProvider};
