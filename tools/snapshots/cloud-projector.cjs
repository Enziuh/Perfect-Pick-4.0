'use strict';
// Pure Google-side projection. Existing IDs only; no entropy, filesystem or recovery material.
const {validate:identity}=require('./identity-contract.cjs'),{decode}=require('../api/browser-client.cjs');
const {projectReply,scanText}=require('./schema.cjs'),{create}=require('./retention.cjs'),{production}=require('./production-policy.cjs');
function project(reply,store,now,approvedAliases,{deadlineDisclosure=false}={}){
 try{
  identity(store);if(store.entries.length!==23||!(approvedAliases instanceof Map)||reply.aliases.some(a=>approvedAliases.get(a.player)!==a.alias))throw Error();
  const records=deadlineDisclosure?require('../disclosure/weekly-deadline.cjs').records(reply,now):[];decode(reply,now,records);const ids=new Map(store.entries.map(e=>[e.sourceKey,e.publicId]));
  if(reply.aliases.some(a=>!ids.has(a.player)))throw Error();
  const payload=projectReply(reply,ids),model=decode(payload,now,records),v1={schema:'PP4_STATIC_V1',generatedAt:payload.snapshot.generatedAt,expiresAt:new Date(model.expiresAt).toISOString(),payload};
  const file=production(create(v1,now,{publicAggregates:true,deadlineDisclosures:records}),now);
  scanText(JSON.stringify(file),store.entries.map(e=>e.sourceKey));return file;
 }catch{throw Error('Cloud public projection blocked');}
}
function historicalEqual(a,b){
 const view=f=>({games:f.payload.snapshot.games.filter(g=>g.week<=8).map(({verifiedAt,...g})=>g),weeks:f.payload.snapshot.weeks.filter(w=>w.week<=8).map(w=>({week:w.week,picks:w.picks,votes:w.votes})),tables:f.aggregateStandings.filter(t=>/^W[1-8]$/.test(t.key)||['M1','M2'].includes(t.key)),months:f.payload.snapshot.months.filter(m=>m.endWeek<=8),prizes:f.payload.snapshot.prizes.filter(p=>/^W[1-8]$/.test(p.key)||['M1','M2'].includes(p.key))});
 return JSON.stringify(view(a))===JSON.stringify(view(b));
}
function stableContent(file){const volatile=new Set(['observedAt','generatedAt','verifiedAt','checkedAt','validUntil']);return JSON.stringify({deadlineDisclosures:file.deadlineDisclosures?.map(({observedAt,...r})=>r)||[],retention:file.retention,aggregateStandings:file.aggregateStandings,payload:JSON.parse(JSON.stringify(file.payload,(k,v)=>volatile.has(k)?undefined:v))});}
module.exports={project,historicalEqual,stableContent};
