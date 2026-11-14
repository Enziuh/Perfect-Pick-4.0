'use strict';
// Temporary owner-console telemetry. No service/data reads, persistence or endpoints.
const STAGES=Object.freeze(['CONTEXT','PRIZES','GAME_MAPPING','ALIASES','FORM','SCHEDULE','SUBMISSIONS','REPLACEMENT','SOURCE','PROJECTION','PUBLIC_VALIDATION','COMPLETE']);
const STATES=Object.freeze(['UNVERIFIED','WITHHELD','AVAILABLE','UNAVAILABLE']);
const REASONS=Object.freeze(['NOT_INSPECTED','CLOSURE_UNVERIFIED','INCOMPLETE','MISSING_ALIAS','SOURCE_VALIDATION_FAILED','NONE','UNKNOWN']);
const FLAGS=Object.freeze(['formIdentityVerified','formClosed','closurePresent','deadlineVerified','scheduleVerified','sourceComplete','aliasesVerified','submissionsProcessed','replacementProcessed','publicValidated']);
function observe(callback,event){try{if(typeof callback==='function')callback(event);}catch{/* Never change source processing. */}}
function create({enabled=false,until=0,now=()=>0,sink=()=>{}}={}){
 let active=false,done=false,receipt={week:10,stage:'CONTEXT',state:'UNVERIFIED',reason:'NOT_INSPECTED',flags:{}};
 try{const t=now();active=enabled===true&&Number.isSafeInteger(until)&&until>t&&until-t<=86400000;}catch{}
 function record(event){if(!active||done)return;try{
  const stage=event.stage,state=event.state,reason=event.reason;
  if(STAGES.includes(stage))receipt.stage=stage;
  if(STATES.includes(state))receipt.state=state;
  if(typeof reason==='string')receipt.reason=REASONS.includes(reason)?reason:'UNKNOWN';
  for(const key of FLAGS){const value=event[key];if(typeof value==='boolean')receipt.flags[key]=value;}
 }catch{}}
 function finish(){if(!active||done)return;done=true;try{const t=now();if(t>=until)return;sink(JSON.stringify(receipt));}catch{}}
 return Object.freeze({record,finish});
}
module.exports={create,observe,STAGES,STATES,REASONS,FLAGS};
