'use strict';
// Native read bridge; services and private source config are lazy, never request inputs.
const {runPreparedDiagnostic}=require('./prepared-diagnostic.cjs');
const {create}=require('../sheets/sheets-read-adapter.cjs');
const {projectCompetition}=require('../projector/project-competition.cjs');
const ownerEvidence=require('./owner-evidence.cjs');
const {createParser}=require('./timestamps.cjs');
const need=v=>{if(!v)throw Error('Verification blocked');};
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const exact=(v,keys)=>need(v&&typeof v==='object'&&!Array.isArray(v)&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(v,k)));
const stamp=v=>{need(typeof v==='string');const n=Date.parse(v);need(Number.isFinite(n)&&new Date(n).toISOString()===v);return n;};
const column=n=>{need(Number.isInteger(n)&&n>=1&&n<=1024);let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
const range=(sheet,c,first,last)=>`'${sheet}'!${column(c)}${first}:${column(c)}${last}`;
const META_FIELDS='properties(timeZone),sheets(properties(title,gridProperties(rowCount,columnCount)))';
const VALUE_FIELDS='valueRanges(range,majorDimension,values)';
function empty(state='BLOCKED'){
 return {state,structure:{expectedTabs:2,discoveredTabs:0,expectedColumns:0,matchedColumns:0},records:{results:null,responses:null,completeness:'UNVERIFIED'},timeZone:'UNVERIFIED',timestamps:'NOT_CHECKED',closure:'UNVERIFIED',aliases:'UNVERIFIED',revision:'UNVERIFIED',schema:'NOT_CHECKED',comparison:'BLOCKED'};
}
function createOwnerDiagnostic(loadPrivateConfig,getSheets,now,consumeValidated=null){
 let attempted=false;
 return function diagnostic(){
  if(attempted)return empty();
  let result=empty();
  try{
   const privateConfig=loadPrivateConfig();
   if(privateConfig===null)return {state:'DISABLED',reason:'OWNER_AUTHORIZATION_AND_ISOLATION_REQUIRED'};
   exact(privateConfig,['activation','mode','competition','capture','captureAuthorityReviewed','identityFormat']);
   const a=privateConfig.activation;
   exact(a,['enabled','soleOwnerReviewed','noPublicExecutionReviewed','readOnlyGrantsReviewed','notBefore','expiresAt']);
   if(a.enabled!==true)return {state:'DISABLED',reason:'OWNER_AUTHORIZATION_AND_ISOLATION_REQUIRED'};
   attempted=true;
   need(a.soleOwnerReviewed===true&&a.noPublicExecutionReviewed===true&&a.readOnlyGrantsReviewed===true);
   const started=now(),from=stamp(a.notBefore),until=stamp(a.expiresAt);
   need(integer(started)&&from<=started&&until>started&&until-from<=300000);
   const active=()=>{const t=now();need(integer(t)&&t>=started&&t<until);return t;};
   need(['STRUCTURE','VERIFY'].includes(privateConfig.mode)&&privateConfig.identityFormat==='EXACT_TEXT');
   const c=privateConfig.competition;
   exact(c,['target','timeZone','revision','maxAgeMs','layout','policy','aliases','closures']);
   need(typeof c.target==='string'&&c.target.length>=1&&integer(c.revision)&&integer(c.maxAgeMs)&&c.maxAgeMs>0);
   exact(c.policy,['games','teams','periods','seasonWeeks','decisions','accounting']);
   exact(c.layout,['season','results','responses']);
   exact(c.layout.results,['sheet','firstRow','columns']);
   exact(c.layout.responses,['sheet','firstRow','timestamp','identity','games','predictions']);
   c.layout.results.columns.forEach(d=>exact(d,['header','column']));
   for(const d of [c.layout.responses.timestamp,c.layout.responses.identity])exact(d,['header','column']);
   for(const d of [...c.layout.responses.games,...c.layout.responses.predictions])exact(d,['week','game','header','column']);
   const parser=createParser(c.timeZone);parser.parse('2026-01-15T12:00:00.000Z');
   const policy={...c.policy,now:started,revision:c.revision,maxAgeMs:c.maxAgeMs,aliases:ownerEvidence.aliases(c.aliases,c.revision),closures:ownerEvidence.closures(c.closures,{revision:c.revision,now:started,maxAgeMs:c.maxAgeMs}),completeWeeks:new Map()};
   // Validate the existing exact layout without invoking a service or projector.
   create({values:{batchGet(){throw Error('No read during configuration validation');}},projectCompetition,readEvidence(){throw Error('No evidence read during validation');},identityKey:v=>v,submissionTime:parser.parse,now:active},c.target,c.layout,policy);
   const descriptors=[...c.layout.results.columns.map(d=>({...d,sheet:'Results'})),...[c.layout.responses.timestamp,c.layout.responses.identity,...c.layout.responses.games,...c.layout.responses.predictions].map(d=>({...d,sheet:'Responses'}))];
   need(descriptors.length<=450);result.structure.expectedColumns=descriptors.length;
   const weeks=[...new Set([...policy.games.values()].map(g=>g.week))];
   need(weeks.length>0);
   result.closure=weeks.every(w=>policy.closures.has(w))?'AVAILABLE':'UNVERIFIED';
   result.aliases=policy.aliases.size?'CONFIGURED_NOT_YET_VERIFIED':'UNVERIFIED';
   let capture=null;
   if(privateConfig.capture!==null){
    const p=privateConfig.capture;exact(p,['revision','observedAt','validUntil','resultRows','responseRows','quiescent']);
    if(privateConfig.captureAuthorityReviewed===true&&p.revision===c.revision&&p.quiescent===true&&integer(p.resultRows)&&p.resultRows>0&&p.resultRows<=400&&integer(p.responseRows)&&p.responseRows<=1000&&stamp(p.observedAt)<=started&&started-stamp(p.observedAt)<=c.maxAgeMs&&stamp(p.validUntil)>started){capture={...p};result.revision='AVAILABLE';}
   }
   if(privateConfig.mode==='VERIFY')need(capture&&result.closure==='AVAILABLE'&&policy.aliases.size>0);
   const sheets=getSheets();active();
   const metadata=sheets.Spreadsheets.get(c.target,{ranges:["'Results'!A1","'Responses'!A1"],fields:META_FIELDS,includeGridData:false});
   need(Array.isArray(metadata.sheets)&&metadata.sheets.length===2);
   const tabs=new Map();
   for(const s of metadata.sheets){const p=s.properties;need(['Results','Responses'].includes(p.title)&&!tabs.has(p.title));need(integer(p.gridProperties.rowCount)&&integer(p.gridProperties.columnCount));tabs.set(p.title,p.gridProperties);}
   result.structure.discoveredTabs=tabs.size;need(metadata.properties.timeZone===c.timeZone);result.timeZone='MATCH';
   for(const d of descriptors)need(d.column<=tabs.get(d.sheet).columnCount);
   if(capture){need(capture.resultRows+2<=tabs.get('Results').rowCount&&capture.responseRows+2<=tabs.get('Responses').rowCount);}
   const headers=descriptors.map(d=>range(d.sheet,d.column,1,1));
   active();const answer=sheets.Spreadsheets.Values.batchGet(c.target,{ranges:headers,majorDimension:'ROWS',valueRenderOption:'UNFORMATTED_VALUE',dateTimeRenderOption:'SERIAL_NUMBER',fields:VALUE_FIELDS});
   need(Array.isArray(answer.valueRanges)&&answer.valueRanges.length===descriptors.length);
   // Header ranges can be returned as a single cell by the API. Compare normalized forms.
   const normalized=value=>{need(typeof value==='string');const parts=value.replace(/'/g,'').replace(/\$/g,'').split('!');need(parts.length===2);const cells=parts[1].split(':');need(cells.length<=2&&(!cells[1]||cells[0]===cells[1]));return parts[0]+'!'+cells[0];};
   result.schema='HEADER_MISMATCH';
   answer.valueRanges.forEach((v,i)=>{need(normalized(v.range)===normalized(headers[i])&&v.majorDimension==='ROWS'&&Array.isArray(v.values)&&v.values.length===1&&v.values[0].length===1&&v.values[0][0]===descriptors[i].header);result.structure.matchedColumns++;});
   active();result.schema='HEADERS_MATCH';
   if(privateConfig.mode==='STRUCTURE'){result.state='STRUCTURE_CHECKED';return result;}
   const allowed=new Set(headers);
   for(const d of descriptors){const count=d.sheet==='Results'?capture.resultRows:capture.responseRows,guard=d.header==='Week'||d.header==='Timestamp';if(count||guard)allowed.add(range(d.sheet,d.column,2,count+1+Number(guard)));}
   let calls=0;
   const values={batchGet(target,options){active();need(target===c.target&&++calls<=4);exact(options,['ranges','majorDimension','valueRenderOption','dateTimeRenderOption']);need(Array.isArray(options.ranges)&&options.ranges.length>0&&options.ranges.length<=descriptors.length&&new Set(options.ranges).size===options.ranges.length&&options.ranges.every(r=>allowed.has(r)));need(options.majorDimension==='ROWS'&&options.valueRenderOption==='UNFORMATTED_VALUE'&&options.dateTimeRenderOption==='SERIAL_NUMBER');return sheets.Spreadsheets.Values.batchGet(target,{...options,fields:VALUE_FIELDS});}};
   const report=runPreparedDiagnostic({values,now:active,consumeValidated,identityKey:v=>{need(typeof v==='string'&&v.length>0);return v;},readEvidence(target){active();need(target===c.target&&stamp(capture.validUntil)>now());return {...capture};},authorize(stage,scope){active();return ['PREFLIGHT','BOUNDED_READ'].includes(stage)&&scope.target===c.target&&scope.revision===c.revision;}},c);
   active();
   result.state=report.state;result.schema=report.validation;
   if(report.validation==='VALID'){
    result.records={results:capture.resultRows,responses:capture.responseRows,completeness:report.state==='VALIDATED_READ'?'VALIDATED_BOUNDED_CAPTURE':'INCOMPLETE'};
    result.timestamps=report.state==='VALIDATED_READ'?'COMPATIBLE':'UNVERIFIED';result.aliases=report.state==='VALIDATED_READ'?'VERIFIED_FOR_CAPTURE':'INCOMPLETE';
   }
   result.comparison=report.state==='VALIDATED_READ'?'READY_FOR_PRIVATE_COMPARISON':'BLOCKED';return result;
  }catch{return {...result,state:'BLOCKED',records:{results:null,responses:null,completeness:'UNVERIFIED'},comparison:'BLOCKED'};}
 };
}
module.exports={createOwnerDiagnostic,META_FIELDS,VALUE_FIELDS};
