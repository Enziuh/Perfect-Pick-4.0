'use strict';
const {decode}=require('../api/browser-client.cjs');
const ID=/^p_[a-f0-9]{32}$/;
const fail=()=>{throw Error('Public snapshot unavailable');};
// Scalar allowlists only; no source spread/copy. Unknown fields are rejected by
// the original exact contract BEFORE projection and by this shape after it.
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(o,k)).map(k=>[k,o[k]]));
function projectReply(r,map){
 const player=id=>{const v=map.get(id);if(!ID.test(v||''))fail();return v;};
 const s=r.snapshot;
 return {schema:r.schema,activeWeek:r.activeWeek,control:pick(r.control,['activeWeek','firstGame','firstKickoff','picksClose','reportedStatus']),form:r.form===null?null:pick(r.form,['url','verified','approvedForPlayers']),aliases:r.aliases.map(a=>({player:player(a.player),alias:a.alias})),snapshot:{
  ...pick(s,['version','revision','generatedAt','state','season','scoringBasis']),
  games:s.games.map(g=>pick(g,['game','week','home','away','kickoff','status','homeScore','awayScore','winner','verifiedAt'])),
  weeks:s.weeks.map(w=>({...pick(w,['week']),entry:pick(w.entry,['status','authority','revision','checkedAt','validUntil','deadline']),
   ...(w.picks?{picks:w.picks.map(p=>({player:player(p.player),alias:p.alias,selections:p.selections.map(t=>pick(t,['game','team'])),...(p.prediction?{prediction:pick(p.prediction,['game','total'])}:{})}))}:{}),
   ...(w.votes?{votes:w.votes.map(v=>({...pick(v,['game','total']),teams:v.teams.map(t=>pick(t,['team','count','basisPoints']))}))}:{})})),
  standings:s.standings.map(t=>({...pick(t,['scope','key','weeks','state','reason']),...(t.rows?{rows:t.rows.map(r=>({...pick(r,['alias','rank','points','completedGames','totalPicks','accuracyBasisPoints']),player:player(r.player)}))}:{})})),
  months:s.months.map(m=>({...pick(m,['key','startWeek','endWeek','competitionComplete','designatedGame','state','actualTotal','method']),winner:m.winner===null?null:player(m.winner),...(m.comparisons?{comparisons:m.comparisons.map(c=>({player:player(c.player),...pick(c,['prediction','difference'])}))}:{})})),
  prizes:s.prizes.map(p=>({...pick(p,['key','currency','poolCents','poolState','allocationState','paymentState','projectedPoolCents','estimatedRolloverCents']),
   ...(p.allocations?{allocations:p.allocations.map(a=>({player:player(a.player),cents:a.cents}))}:{}),...(p.rollover?{rollover:pick(p.rollover,['to','cents'])}:{}),
   ...(p.funding?{funding:pick(p.funding,['rolloverCents','monthlyPrizeCents','seasonContributionCents','monthlyShareBasisPoints','seasonShareBasisPoints'])}:{}),
   ...(p.estimateBasis?{estimateBasis:pick(p.estimateBasis,['kind','participantsPerWeek'])}:{})}))}};
}
function scanText(text,forbidden=[]){
 // Names/game labels/form responder URL are approved separately by the existing
 // contract. Broad transport/credential/contact markers are never public data.
 if(typeof text!=='string'||text.length>2000000)fail();
 const contacts=text.replace(/"p_[a-f0-9]{32}"/g,'"PUBLIC_RANDOM_ID"');
 if(/\b(?:phone|privateKey|sourceKey|rawResponses?|submissionId|access_token|refresh_token|password|secret)\b|PRIVATE_/i.test(text)||/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)||/-----BEGIN|\b(?:ya29\.|ghp_|github_pat_|AIza)/.test(text)||/\b(?:sheets|script)\.google\.|\/spreadsheets\//i.test(text)||/(?<!\d)(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}(?!\d)/.test(contacts)||forbidden.some(v=>typeof v==='string'&&v.length>=6&&text.includes(v)))fail();
}
function validate(file,now){
 try{
  if(!file||Object.keys(file).sort().join(',')!=='expiresAt,generatedAt,payload,schema'||file.schema!=='PP4_STATIC_V1'||file.generatedAt!==file.payload.snapshot.generatedAt)fail();
  const model=decode(file.payload,now);if(file.expiresAt!==new Date(model.expiresAt).toISOString()||now>=model.expiresAt)fail();
  for(const a of file.payload.aliases)if(!ID.test(a.player))fail();
  // Prove every player reference is in the randomly assigned public namespace.
  const ids=new Map(file.payload.aliases.map(a=>[a.player,a.player]));
  if(JSON.stringify(projectReply(file.payload,ids))!==JSON.stringify(file.payload))fail();
  scanText(JSON.stringify(file));return model;
 }catch{fail();}
}
module.exports={projectReply,scanText,validate};
