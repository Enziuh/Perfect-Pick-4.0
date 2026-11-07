'use strict';
const {decode}=require('../api/browser-client.cjs');
const {POLICY,SCORE_MAX_AGE_MS,authorized}=require('./retention-policy.cjs');
const fail=()=>{throw Error('Retained snapshot unavailable');};
const iso=t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&new Date(t).toISOString()===t;
const exact=(o,keys)=>o&&Object.keys(o).sort().join(',')===keys.split(',').sort().join(',');
function permitted(policy){return policy===null||JSON.stringify(policy)===JSON.stringify(POLICY);}
function restrict(payload,allowed){
 const p=structuredClone(payload),s=p.snapshot;
 for(const w of s.weeks)if(!allowed.has(w.week)){delete w.picks;delete w.votes;}
 const withheld=new Set();
 for(const t of s.standings)if(t.weeks.some(w=>!allowed.has(w))){t.state='WITHHELD';t.reason='CLOSURE_UNVERIFIED';delete t.rows;withheld.add(t.key);}
 for(const m of s.months)if(withheld.has(m.key)){m.state='IN PROGRESS';m.winner=null;m.actualTotal=null;m.method='NONE';delete m.comparisons;}
 for(const prize of s.prizes)if(withheld.has(prize.key)){
  prize.allocationState='UNAVAILABLE';prize.paymentState='UNKNOWN';delete prize.allocations;delete prize.rollover;
  if(Object.hasOwn(prize,'estimatedRolloverCents'))prize.estimatedRolloverCents=null;
 }
 const used=new Set(s.weeks.flatMap(w=>(w.picks||[]).map(p=>p.player)));p.aliases=p.aliases.filter(a=>used.has(a.player));
 return p;
}
function create(v1,now,{policy=POLICY,authorizationUntil=policy?.validUntil??null,publicAggregates=false,deadlineDisclosures=[]}={}){
 // Validate source at the ACTUAL capture time, while its original short-lived
 // evidence is valid. No proof/game timestamp is modified or renewed.
 const {validate}=require('./schema.cjs');validate(v1,now,deadlineDisclosures);
 if(!permitted(policy)||authorizationUntil!==null&&!iso(authorizationUntil))fail();
 const deadlineMap=require('../disclosure/weekly-deadline.cjs').trusted(deadlineDisclosures,v1.payload.snapshot,now);
 const allowed=new Set(v1.payload.snapshot.weeks.filter(w=>authorized(w.week,w.entry,v1.payload.snapshot.season,now,policy,authorizationUntil)&&!(w.week===v1.payload.activeWeek&&v1.payload.control.reportedStatus!=='CLOSED')&&Array.isArray(w.picks)&&Array.isArray(w.votes)).map(w=>w.week));
 for(const [week]of deadlineMap){const w=v1.payload.snapshot.weeks.find(w=>w.week===week);if(Array.isArray(w?.picks)&&Array.isArray(w?.votes))allowed.add(week);}
 const payload=restrict(v1.payload,allowed),scoreValidUntil=new Date(Math.min(Date.parse(payload.snapshot.generatedAt),...payload.snapshot.games.map(g=>Date.parse(g.verifiedAt)))+SCORE_MAX_AGE_MS).toISOString();
 const expiresAt=new Date(Math.min(Date.parse(scoreValidUntil),allowed.size&&authorizationUntil!==null?Date.parse(authorizationUntil):Infinity)).toISOString();
 const retention={policyId:policy?.id??null,revision:policy?.revision??0,weeks:[...allowed].sort((a,b)=>a-b),validUntil:authorizationUntil};
 const file={...(deadlineDisclosures.length?{deadlineDisclosures}:{}),...(publicAggregates?{aggregateStandings:require('./aggregate-standings.cjs').project(v1.payload)}:{}),schema:'PP4_STATIC_V2',generatedAt:payload.snapshot.generatedAt,capturedAt:new Date(now).toISOString(),scoreValidUntil,expiresAt,retention,freshness:{sourceObservedAt:payload.snapshot.generatedAt,scoreUpdatedAt:null,generatedAt:new Date(now).toISOString(),publishedAt:null},payload};validateRetained(file,now);return file;
}
function validateRetained(file,now){
 try{
  const shape={...file};delete shape.aggregateStandings;delete shape.deadlineDisclosures;
  if(!(exact(shape,'schema,generatedAt,capturedAt,scoreValidUntil,expiresAt,retention,payload')||exact(shape,'schema,generatedAt,capturedAt,scoreValidUntil,expiresAt,retention,freshness,payload'))||file.schema!=='PP4_STATIC_V2'||!Number.isSafeInteger(now)||!iso(file.generatedAt)||!iso(file.capturedAt)||!iso(file.scoreValidUntil)||!iso(file.expiresAt)||file.generatedAt!==file.payload.snapshot.generatedAt)fail();
  if(file.freshness){const f=file.freshness;if(!exact(f,'sourceObservedAt,scoreUpdatedAt,generatedAt,publishedAt')||f.sourceObservedAt!==file.generatedAt||f.generatedAt!==file.capturedAt||f.scoreUpdatedAt!==null||f.publishedAt!==null)fail();}
  const captured=Date.parse(file.capturedAt);if(captured>now||captured<Date.parse(file.generatedAt))fail();
  const r=file.retention;if(!exact(r,'policyId,revision,weeks,validUntil')||!Array.isArray(r.weeks)||new Set(r.weeks).size!==r.weeks.length||JSON.stringify(r.weeks)!==JSON.stringify([...r.weeks].sort((a,b)=>a-b))||r.validUntil!==null&&!iso(r.validUntil))fail();
  const policy=r.policyId===null&&r.revision===0?null:r.policyId===POLICY.id&&r.revision===POLICY.revision?POLICY:undefined;if(policy===undefined)fail();
  const deadlineRecords=Object.hasOwn(file,'deadlineDisclosures')?file.deadlineDisclosures:[];if(!Array.isArray(deadlineRecords))fail();if(deadlineRecords.length&&JSON.stringify(require('../disclosure/weekly-deadline.cjs').record(file.payload,captured))!==JSON.stringify(deadlineRecords[0]))fail();const deadlineMap=require('../disclosure/weekly-deadline.cjs').trusted(deadlineRecords,file.payload.snapshot,captured);
  const allowed=new Set(r.weeks);for(const week of allowed){const w=file.payload.snapshot.weeks.find(w=>w.week===week);if(!w||!(authorized(week,w.entry,file.payload.snapshot.season,now,policy,r.validUntil)||deadlineMap.has(week))||week===file.payload.activeWeek&&file.payload.control.reportedStatus!=='CLOSED'&&!deadlineMap.has(week))fail();}
  // The public payload must already be physically stripped of every unapproved
  // protected field, including aggregate rows/decisions/allocations and unused aliases.
  if(JSON.stringify(restrict(file.payload,allowed))!==JSON.stringify(file.payload))fail();
  const {projectReply,scanText}=require('./schema.cjs');
  const ids=new Map(file.payload.aliases.map(a=>[a.player,a.player]));if([...ids.keys()].some(id=>!/^p_[a-f0-9]{32}$/.test(id))||JSON.stringify(projectReply(file.payload,ids))!==JSON.stringify(file.payload))fail();scanText(JSON.stringify(file));
  // Validate the immutable captured source and all scoring/cross-scope rules at
  // its recorded observation time. API decode's120s policy remains UNCHANGED.
  // Display after that point is authorized only by the independent policy above.
  const model=decode(file.payload,captured,deadlineRecords);
  if(deadlineRecords.length){model.prizes.disclosurePolicy=deadlineRecords[0].policyId;model.prizes.playerAliases=file.payload.aliases.map(a=>a.alias);for(const w of model.weeks)if(deadlineMap.has(w.week)){w.missingAliases=Array.isArray(file.payload.snapshot.weeks.find(p=>p.week===w.week).picks)?file.payload.aliases.filter(a=>!file.payload.snapshot.weeks.find(p=>p.week===w.week).picks?.some(p=>p.player===a.player)).map(a=>a.alias):[];}}
  if(Object.hasOwn(file,'aggregateStandings'))require('./aggregate-standings.cjs').apply(file.aggregateStandings,file.payload,model);
  const scoreExpiry=Math.min(Date.parse(file.generatedAt),...file.payload.snapshot.games.map(g=>Date.parse(g.verifiedAt)))+SCORE_MAX_AGE_MS;
  const expiry=Math.min(scoreExpiry,allowed.size&&r.validUntil!==null?Date.parse(r.validUntil):Infinity);
  if(file.scoreValidUntil!==new Date(scoreExpiry).toISOString()||file.expiresAt!==new Date(expiry).toISOString()||now>=expiry)fail();
  model.expiresAt=expiry;model.prizes.staticFreshness={scoresAsOf:file.generatedAt,sourceObservedAt:file.generatedAt,scoreUpdatedAt:null,generatedAt:file.capturedAt,publishedAt:null,scoresValidUntil:file.scoreValidUntil,retentionPolicy:r.policyId};return model;
 }catch{fail();}
}
module.exports={create,validateRetained,restrict};
