'use strict';
// Pure coordinator. No native services or executable owner bridge. Packaged entry stays disabled.
const {create}=require('../sheets/sheets-read-adapter.cjs');
const {projectCompetition}=require('../projector/project-competition.cjs');
const {validatePublic}=require('../contracts/live-contract.cjs');
const ownerEvidence=require('./owner-evidence.cjs');
const {createParser}=require('./timestamps.cjs');
const need=value=>{if(!value)throw Error('Verification blocked');};
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const exact=(value,keys)=>need(value&&typeof value==='object'&&Reflect.ownKeys(value).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(value,k)));
const blocked=()=>({state:'BLOCKED',validation:'NOT_RUN',readiness:'NOT_ESTABLISHED',counts:{weeks:0,games:0,finalGames:0,availableScopes:0,withheldScopes:0}});
function runPreparedDiagnostic(dependencies,config){
 try{
  // These functions are trusted capabilities from a FUTURE reviewed owner-only bridge,
  // never request callbacks or proof supplied by the configuration itself.
  need(dependencies&&typeof dependencies.authorize==='function'&&typeof dependencies.now==='function');
  exact(config,['target','timeZone','revision','maxAgeMs','layout','policy','aliases','closures']);
  need(typeof config.target==='string'&&config.target.length>0&&integer(config.revision)&&integer(config.maxAgeMs)&&config.maxAgeMs>0);
  const now=dependencies.now();need(integer(now));
  const parser=createParser(config.timeZone);
  exact(config.policy,['games','teams','periods','seasonWeeks','decisions','accounting']);
  const policy={...config.policy,revision:config.revision,now,maxAgeMs:config.maxAgeMs,
   aliases:ownerEvidence.aliases(config.aliases,config.revision,dependencies.identityKey),closures:ownerEvidence.closures(config.closures,{revision:config.revision,now,maxAgeMs:config.maxAgeMs}),completeWeeks:new Map()};
  need(policy.games instanceof Map&&policy.games.size>0&&policy.games.size<=400&&policy.aliases.size>0);
  const weeks=[...new Set([...policy.games.values()].map(g=>g.week))].sort((a,b)=>a-b);
  need(weeks.length>0&&weeks.every(w=>policy.closures.has(w)));
  need(typeof dependencies.readEvidence==='function'&&typeof dependencies.identityKey==='function');
  let evidenceCalls=0,first;
  function evidence(target){
   need(target===config.target);const value=dependencies.readEvidence(target);
   exact(value,['revision','observedAt','validUntil','resultRows','responseRows','quiescent']);
   need(value.revision===config.revision&&value.quiescent===true&&integer(value.resultRows)&&value.resultRows>0&&value.resultRows<=400&&integer(value.responseRows)&&value.responseRows<=1000);
   const observed=Date.parse(value.observedAt),until=Date.parse(value.validUntil);
   need(new Date(observed).toISOString()===value.observedAt&&new Date(until).toISOString()===value.validUntil&&observed<=now&&now-observed<=config.maxAgeMs&&until>now);
   evidenceCalls++;if(evidenceCalls===1)first={...value};else need(Object.keys(first).every(key=>value[key]===first[key]));
   return value;
  }
  // Preflight authorization BEFORE even an independent evidence callback is invoked.
  // Owner bridge must enforce account/project isolation, exact scope and single-use approval.
  const scope={target:config.target,revision:config.revision,weeks,layout:config.layout,timeZone:config.timeZone,maxAgeMs:config.maxAgeMs};
  need(dependencies.authorize('PREFLIGHT',scope)===true);
  evidence(config.target);
  // Exact reviewed column coordinates and authoritative high-water bounds are part of consent.
  need(dependencies.authorize('BOUNDED_READ',{...scope,capture:first})===true);
  const reader=create({values:dependencies.values,projectCompetition,now:dependencies.now,readEvidence:evidence,identityKey:dependencies.identityKey,submissionTime:parser.parse},config.target,config.layout,policy);
  const snapshot=reader.readPublicSnapshot();
  const ended=dependencies.now();need(integer(ended)&&ended>=now);
  const trust={now:ended,maxAgeMs:config.maxAgeMs,aliases:new Map([...policy.aliases.values()].map(a=>[a.player,a.alias])),closures:new Map([...policy.closures].map(([w,e])=>[w,e.entry])),aliasCompleteness:new Map(weeks.map(w=>[w,true])),prizes:new Map([...policy.accounting].map(([key,e])=>[key,e.value]))};
  validatePublic(snapshot,trust);
  if(snapshot.state!=='READY')return {state:'INCOMPLETE',validation:'UNAVAILABLE',readiness:'NOT_ESTABLISHED',counts:blocked().counts};
  // Trusted in-process owner consumer only; the packaged entry supplies no consumer.
  // Validation rejects private fields; raw source records/target never reach this callback.
  if(typeof dependencies.consumeValidated==='function')dependencies.consumeValidated(snapshot,trust);
  const counts={weeks:snapshot.weeks.length,games:snapshot.games.length,finalGames:snapshot.games.filter(g=>g.status==='FINAL').length,availableScopes:snapshot.standings.filter(s=>s.state==='AVAILABLE').length,withheldScopes:snapshot.standings.filter(s=>s.state==='WITHHELD').length};
  return {state:counts.withheldScopes?'INCOMPLETE':'VALIDATED_READ',validation:'VALID',readiness:counts.withheldScopes?'WITHHELD':'PRIVATE_COMPARISON_REQUIRED',counts};
 }catch{return blocked();}
}
module.exports={runPreparedDiagnostic};
