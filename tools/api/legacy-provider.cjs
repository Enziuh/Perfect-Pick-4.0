'use strict';
const late=require('../scoring/late-entry.cjs');
const {createParser}=require('../verification/timestamps.cjs');
const {readNativeResponses}=require('../scoring/native-responses.cjs');
const {buildScheduleEvidence}=require('../scoring/schedule-evidence.cjs');
const {projectCompetition}=require('../projector/project-competition.cjs');
const {validatePublic}=require('../contracts/live-contract.cjs');
const evidence=require('../verification/owner-evidence.cjs');
const {normalizePhone}=require('../compatibility/pp3-identity.cjs');
const {configuredMap,requireDisplayAliases,approvedAllocationWeeks,approvedRollovers,registryAliases}=require('./player-authority.cjs');
const {estimatePrizes}=require('../compatibility/prize-estimates.cjs');
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
   if(cfg.lateEntryRules!==undefined){if(cfg.lateEntryRules!==late.RULE||!(Array.isArray(cfg.lateEntryEvidence)||typeof deps.cutoffEvidence==='function'))throw Error();if(typeof deps.timezone!=='function'||typeof deps.nativeResponses!=='function')throw Error();policy.timeParser=createParser(deps.timezone());if((cfg.lateEntryEvidence||[]).some(e=>e.timezone!==policy.timeParser.timeZone))throw Error();policy.lateEntryRules=late.RULE;policy.lateEntryEvidence=new Map((cfg.lateEntryEvidence||[]).map(e=>[e.week,e]));if(policy.lateEntryEvidence.size!==(cfg.lateEntryEvidence||[]).length)throw Error();}
   const authority=cfg.authority;
   if(authority){
    if(authority.aliases!==undefined&&authority.registryAliases!==undefined)throw Error();
    const approvals=authority.registryAliases!==undefined?registryAliases(ctx.playerRegistry,authority.registryAliases,revision):authority.aliases;
    policy.aliases=evidence.aliases(requireDisplayAliases(approvals),revision,normalizePhone);
    policy.closures=evidence.closures(authority.closures,{revision,now,maxAgeMs});
    for(const [week,record] of evidence.attestations(authority.closedAttestations||[],{revision,now,maxAgeMs},prizes.formControl)){if(policy.closures.has(week))throw Error();policy.closures.set(week,record);}
    if(['OPEN','UPCOMING'].includes(prizes.formControl?.status))policy.closures.delete(Number(prizes.formControl.activeWeek));
    policy.decisions=configuredMap(authority.decisions,'decision');policy.accounting=configuredMap(authority.accounting,'accounting');
   }
   policy.periods=(prizes.periods||[]).map(p=>({key:p.periodKey,startWeek:p.startWeek,endWeek:p.endWeek,designatedGame:p.tiebreakRule?.method==='Combined Points'?definitions.get(p.endWeek+'|'+norm(p.tiebreakRule.game))?.game??null:null}));
   let observedForm=null;
   if(policy.lateEntryRules===late.RULE){try{observedForm=deps.formState(ctx);}catch{}if(observedForm?.responderMatchesVerified!==true||observedForm.acceptingResponses!==false)policy.closures.delete(Number(prizes.formControl?.activeWeek));}
   if(policy.lateEntryRules===late.RULE&&typeof deps.cutoffEvidence==='function'){const records=deps.cutoffEvidence(ctx,definitions,[...policy.closures.keys()]);if(!Array.isArray(records)||records.length>18||records.some(e=>e.timezone!==policy.timeParser.timeZone))throw Error();policy.lateEntryEvidence=new Map(records.map(e=>[e.week,e]));if(policy.lateEntryEvidence.size!==records.length)throw Error();}
   const latest=policy.closures.size?(policy.lateEntryRules===late.RULE?deps.nativeResponses(ctx).flatMap(response=>{let time;try{time=Date.parse(policy.timeParser.parse(response.Timestamp));}catch{return [];}if(!Number.isFinite(time)||time<=0||time>now)return [];return [...new Set(ctx.games.filter(g=>String(response[g.header]??'').trim()).map(g=>g.week))].map(week=>({phone:normalizePhone(response['Phone Number']),week,timestamp:time,response})).filter(r=>r.phone);}):Object.values(deps.latest(ctx.responses,ctx.games))):[];
   // Match the original season scope: every created response-game week, not just disclosed weeks.
   const seasonWeeks=[...new Set(ctx.games.map(g=>g.week))].sort((a,b)=>a-b);
   if(seasonWeeks.length)policy.seasonWeeks=seasonWeeks;
   if(authority?.seasonWeeks!==undefined){const selected=authority.seasonWeeks;if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||!selected.every(w=>seasonWeeks.includes(w)))throw Error();policy.seasonWeeks=[...selected];}
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
   // Configured period bounds + complete original slates + coherent FINAL results
   // determine completion; explicit owner holds still take precedence.
   for(const period of policy.periods){
    const span=Array.from({length:period.endWeek-period.startWeek+1},(_,i)=>period.startWeek+i);
    if(!policy.decisions.has(period.key)&&prizes.periods.find(p=>p.periodKey===period.key)?.allWeeksFinalized===true&&span.every(w=>policy.closures.has(w)&&policy.completeWeeks.get(w)&&games.some(g=>g.week===w)&&games.filter(g=>g.week===w).every(g=>norm(g.status)==='final')))policy.decisions.set(period.key,{snapshotRevision:revision,complete:true,verifiedAt:at});
   }
   // Preserve PP3 pots/overrides/NEW rollover/shares; require explicit accounting approval.
   const calculated=cfg.prizeParticipants===undefined&&policy.lateEntryRules!==late.RULE?(authority?.calculatedOutcomeWeeks||[]):[];
   if(!Array.isArray(calculated)||new Set(calculated).size!==calculated.length||!calculated.every(w=>weeks.includes(w)))throw Error();
   // Owner authorizes calculation scopes, not payment facts. Reverify the original
   // finalized outcome against current CLOSED/completeness/alias evidence each read.
   const qualified=calculated.filter(week=>policy.closures.has(week)&&policy.completeWeeks.get(week)&&prizes.weekly.find(w=>w.week===week)?.finalized===true&&latest.filter(s=>s.week===week).every(s=>policy.aliases.has(normalizePhone(s.phone))));
   if(cfg.prizeParticipants===undefined&&authority?.poolStates!==undefined){
    const rollovers=approvedRollovers(authority.rolloverApprovals,revision,now,maxAgeMs);
    for(const week of qualified){const row=prizes.weekly.find(w=>w.week===week);if(row.perfectPickWinners===0&&row.rolloverToMonthly>0){if(rollovers.has(week)&&rollovers.get(week)!==row.periodKey)throw Error();rollovers.set(week,row.periodKey);}}
    policy.accounting=mapApprovedPrizeFacts(prizes,{revision,verifiedAt:at,pools:configuredMap(authority.poolStates,'pool'),rollovers});
   }
   // Explicit, fresh allocation approval is separate from pool approval. Reuse PP3's
   // scored perfect-week result and payout amount, never its derived winner names.
   const allocationWeeks=approvedAllocationWeeks(cfg.prizeParticipants===undefined&&policy.lateEntryRules!==late.RULE?authority?.allocationApprovals:undefined,revision,now,maxAgeMs);
   qualified.forEach(week=>allocationWeeks.add(week));
   for(const week of allocationWeeks){
    const account=policy.accounting.get('W'+week),row=prizes.weekly.find(w=>w.week===week);
    const input=source.weeks.find(w=>w.week===week);
    if(!policy.completeWeeks.get(week)||account?.value.poolState!=='CONFIRMED'||!row?.finalized||typeof deps.score!=='function')continue;
    const entries=latest.filter(s=>s.week===week),columns=ctx.games.filter(g=>g.week===week);
    if(!input||entries.some(s=>!policy.aliases.has(normalizePhone(s.phone))))continue;
    const perfect=entries.filter(s=>deps.score(s,columns,ctx.playerRegistry,ctx.resultLookup).perfectWeek);
    if(!perfect.length)continue;
    if(perfect.length!==row.perfectPickWinners)throw Error();
    const {cents}=require('../compatibility/legacy-prize-facts.cjs');
    const each=cents(row.perfectPayoutEach);if(each===null||each*perfect.length>account.value.poolCents)throw Error();
    policy.accounting.set('W'+week,{...account,value:{...account.value,allocationState:'CONFIRMED',allocations:perfect.map(s=>({player:policy.aliases.get(normalizePhone(s.phone)).player,cents:each}))}});
   }
   if(cfg.prizeParticipants!==undefined)policy.accounting=new Map();
   if(policy.lateEntryRules===late.RULE){for(const g of source.games){const d=definitions.get(g.week+'|'+norm(g.game));const e=policy.lateEntryEvidence.get(g.week);const matches=e?.schedule?.filter(s=>s.game===d?.game)||[];g.kickoff=late.verified(e,now,maxAgeMs)&&matches.length===1&&matches[0].verified===true&&matches[0].revision===e.revision&&matches[0].unresolvedReschedule!==true&&late.instant(matches[0].kickoff)!==null?new Date(late.instant(matches[0].kickoff)).toISOString():null;}policy.accounting=new Map();}
   const snapshot=projectCompetition(source,policy);if(snapshot.state!=='READY')throw Error();
   if(cfg.prizeParticipants!==undefined)snapshot.prizes=estimatePrizes(snapshot,prizes,cfg.prizeParticipants);
   const trust={now,maxAgeMs,aliases:new Map([...policy.aliases.values()].map(a=>[a.player,a.alias])),closures:new Map([...policy.closures].map(([w,c])=>[w,c.entry])),aliasCompleteness:new Map(snapshot.weeks.map(w=>[w.week,Array.isArray(w.picks)])),prizes:new Map(snapshot.prizes.map(p=>[p.key,p]))};
   validatePublic(snapshot,trust);
   const activeWeek=Number(prizes.activeWeek);if(!weeks.includes(activeWeek))throw Error();
   const c=prizes.formControl||{},first=games.find(g=>norm(g.game)===norm(c.firstGame)&&g.week===Number(c.activeWeek));
   const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v?v:'';
   const control={activeWeek,firstGame:first?TEAM_NAMES[team(first.team1)]+' vs '+TEAM_NAMES[team(first.team2)]:'',firstKickoff:iso(c.firstKickoff),picksClose:iso(c.picksClose),reportedStatus:policy.lateEntryRules===late.RULE?(observedForm?.responderMatchesVerified===true&&observedForm.acceptingResponses===true?'OPEN':observedForm?.responderMatchesVerified===true&&observedForm.acceptingResponses===false&&c.status==='CLOSED'?'CLOSED':'UNKNOWN'):['OPEN','CLOSED','UPCOMING'].includes(c.status)?c.status:'UNKNOWN'};
   return {schema:'PP4_JSON_V1',snapshot,control,aliases:[...new Map(snapshot.weeks.flatMap(w=>(w.picks||[]).map(p=>[p.player,p.alias])))].map(([player,alias])=>({player,alias})),activeWeek,form:approvedPlayerDestination(cfg.form)?{url:cfg.form.url,verified:true,approvedForPlayers:true}:null};
  }catch{return {state:'UNAVAILABLE'};}
 };
}
module.exports={createLegacyProvider,readNativeResponses,buildScheduleEvidence};
