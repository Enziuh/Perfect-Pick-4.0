'use strict';
// Pure Google-side projection. Existing IDs only; no entropy, filesystem or recovery material.
const {validate:identity}=require('./identity-contract.cjs'),{decode}=require('../api/browser-client.cjs');
const {projectReply,scanText}=require('./schema.cjs'),{create}=require('./retention.cjs'),{production}=require('./production-policy.cjs');
function project(reply,store,now,approvedAliases,{deadlineDisclosure=false,verifiedClosedRollover=false}={}){
 try{
  identity(store);if(store.entries.length!==23||!(approvedAliases instanceof Map)||reply.aliases.some(a=>approvedAliases.get(a.player)!==a.alias))throw Error();
  const records=deadlineDisclosure?require('../disclosure/weekly-deadline.cjs').records(reply,now):[];decode(reply,now,records);const ids=new Map(store.entries.map(e=>[e.sourceKey,e.publicId]));
  if(reply.aliases.some(a=>!ids.has(a.player)))throw Error();
  const payload=projectReply(reply,ids),model=decode(payload,now,records),v1={schema:'PP4_STATIC_V1',generatedAt:payload.snapshot.generatedAt,expiresAt:new Date(model.expiresAt).toISOString(),payload};
  const file=production(create(v1,now,{publicAggregates:true,deadlineDisclosures:records,...(verifiedClosedRollover?{policy:require('./retention-policy.cjs').CLOSED_POLICY}:{})}),now);
  scanText(JSON.stringify(file),store.entries.map(e=>e.sourceKey));return file;
 }catch{throw Error('Cloud public projection blocked');}
}
function historicalEqual(a,b,{verifiedClosedRollover=false}={}){
 const view=f=>({games:f.payload.snapshot.games.filter(g=>g.week<=8).map(({verifiedAt,...g})=>g),weeks:f.payload.snapshot.weeks.filter(w=>w.week<=8).map(w=>({week:w.week,picks:w.picks,votes:w.votes})),tables:f.aggregateStandings.filter(t=>/^W[1-8]$/.test(t.key)||['M1','M2'].includes(t.key)),months:f.payload.snapshot.months.filter(m=>m.endWeek<=8),prizes:f.payload.snapshot.prizes.filter(p=>/^W[1-8]$/.test(p.key)||['M1','M2'].includes(p.key))});
 if(JSON.stringify(view(a))!==JSON.stringify(view(b)))return false;
 if(!verifiedClosedRollover)return true;
 const sa=a.payload.snapshot,sb=b.payload.snapshot;
 const frozen=sa.weeks.filter(w=>w.week>=9&&w.week<b.payload.activeWeek&&w.entry.status==='CLOSED'&&a.aggregateStandings.some(t=>t.key==='W'+w.week)&&sa.games.some(g=>g.week===w.week)&&sa.games.filter(g=>g.week===w.week).every(g=>g.status==='FINAL')).map(w=>w.week);
 const keys=new Set(frozen.map(w=>'W'+w));for(const m of sa.months)if(m.endWeek>=9&&m.endWeek<b.payload.activeWeek&&a.aggregateStandings.some(t=>t.key===m.key)&&sa.games.filter(g=>g.week>=m.startWeek&&g.week<=m.endWeek).every(g=>g.status==='FINAL'))keys.add(m.key);
 const facts=f=>({games:f.payload.snapshot.games.filter(g=>frozen.includes(g.week)).map(({verifiedAt,...g})=>g),weeks:f.payload.snapshot.weeks.filter(w=>frozen.includes(w.week)).map(w=>({week:w.week,picks:w.picks,votes:w.votes})),tables:f.aggregateStandings.filter(t=>keys.has(t.key)),months:f.payload.snapshot.months.filter(m=>keys.has(m.key)),prizes:f.payload.snapshot.prizes.filter(p=>keys.has(p.key))});
 return JSON.stringify(facts(a))===JSON.stringify(facts(b));
}
function stableContent(file){const volatile=new Set(['observedAt','generatedAt','verifiedAt','checkedAt','validUntil']);return JSON.stringify({deadlineDisclosures:file.deadlineDisclosures?.map(({observedAt,...r})=>r)||[],retention:file.retention,aggregateStandings:file.aggregateStandings,payload:JSON.parse(JSON.stringify(file.payload,(k,v)=>volatile.has(k)?undefined:v))});}
module.exports={project,historicalEqual,stableContent};
