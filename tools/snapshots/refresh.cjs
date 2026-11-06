'use strict';
// Explicitly invoked preparation only. No timers, uploads, workflow dispatch,
// credentials or Google calls at import. Existing3.0 writers remain the only writers.
const crypto=require('node:crypto'),path=require('node:path');
const {generate}=require('./publisher.cjs'),artifact=require('./artifact.cjs');
const {plan}=require('./activity.cjs');
const {contentHash}=require('./content.cjs');
const {validate}=require('./schema.cjs'),{POLICY,SCORE_MAX_AGE_MS}=require('./retention-policy.cjs');
function createRefresh({registry,backupAndVerify,readSource,approvedAliases,archive,clock=Date.now,outputRoot}){
 let pending=null;
 async function prepare(config={}){
  if(config.prepareEnabled!==true)return {state:'DISABLED'};
  if(config.publicationEnabled!==false)throw Error('Publication is disabled');
  if(pending)return pending;
  pending=(async()=>{
   const fail=()=>{throw Error('Snapshot preparation blocked');};
   try{
    if(!(approvedAliases instanceof Map)||!registry||!archive||typeof backupAndVerify!=='function'||!Number.isInteger(config.expectedGames)||!Number.isInteger(config.expectedWeeks)||config.expectedGames<1||config.expectedWeeks<1||config.expectedRosterSize!==approvedAliases.size)fail();
    const previous=await archive.load();const now=clock();
    if(previous){validate(previous,Date.parse(previous.capturedAt));if(Date.parse(previous.generatedAt)>now)fail();}
    const privateState=registry.load(),reply=await readSource();
    if(reply.snapshot.games.length!==config.expectedGames||reply.snapshot.weeks.length!==config.expectedWeeks)fail();
    const result=generate(reply,privateState.store,clock(),{approvedAliases,retention:{policy:POLICY},preserveIds:true}),file=result.file;
    if(file.payload.aliases.length!==config.expectedRosterSize)fail();
    // The approved historical baseline must remain complete. A new CLOSED week
    // without separate approval is stripped, never silently added to this list.
    for(const week of POLICY.weeks.filter(w=>w<=config.expectedWeeks))if(!file.retention.weeks.includes(week))fail();
    if(previous){
     if(file.payload.snapshot.season!==previous.payload.snapshot.season||file.payload.snapshot.revision<previous.payload.snapshot.revision||Date.parse(file.generatedAt)<Date.parse(previous.generatedAt)||file.payload.activeWeek<previous.payload.activeWeek)fail();
     const keys=f=>f.payload.snapshot.games.map(g=>g.game).sort().join(',');if(keys(file)!==keys(previous))fail();
     for(const old of previous.payload.snapshot.weeks){const next=file.payload.snapshot.weeks.find(w=>w.week===old.week);if(!next)fail();
      if(file.retention.weeks.includes(old.week)&&old.picks){for(const p of old.picks){const n=next.picks?.find(n=>n.player===p.player);if(!n||n.selections.length<p.selections.length)fail();}}
     }
    }
    const refreshPlan=plan(reply,clock());
    if(config.skipUnchanged===true&&previous&&contentHash(previous)===contentHash(file)&&Date.parse(previous.expiresAt)-clock()>refreshPlan.intervalMs){
     return {state:'UNCHANGED_NOT_PUBLISHED',nextRunAt:refreshPlan.nextCheckAt,refreshPlan};
    }
    // Persist identity additions in the private Google registry, then verify an
    // independent encrypted recovery copy BEFORE exposing a local public candidate.
    let generation=privateState.generation;
    if(JSON.stringify(privateState.store)!==JSON.stringify(result.store))generation=registry.save(result.store,generation).generation;
    const checked=registry.load();if(checked.generation!==generation||JSON.stringify(checked.store)!==JSON.stringify(result.store))fail();
    const backup=await backupAndVerify(checked);if(!backup||backup.verified!==true||backup.generation!==generation)fail();
    const dir=path.join(outputRoot,'generation-'+crypto.randomBytes(10).toString('hex'));artifact.stage(file,dir,clock());artifact.verify(dir,clock());
    await archive.commit(file);return {state:'PREPARED_NOT_PUBLISHED',players:file.payload.aliases.length,games:file.payload.snapshot.games.length,nextRunAt:plan(reply,clock()).nextCheckAt,refreshPlan:plan(reply,clock())};
   }catch{throw Error('Snapshot preparation blocked');}
  })().finally(()=>{pending=null;});return pending;
 }
 return Object.freeze({prepare,intervalMs:SCORE_MAX_AGE_MS,unattended:false,publication:false});
}
module.exports={createRefresh};
