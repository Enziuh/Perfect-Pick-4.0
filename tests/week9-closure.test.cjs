'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {example}=require('./support/pp3-api-example.cjs'),{decode}=require('../tools/api/browser-client.cjs');
function closureFixture({future=false,stuck=false}={}){
 const source=fs.readFileSync('apps-script/src/50_Form_Weekly_Setup.js','utf8');const start=source.indexOf('function PP_closeFormAtDeadline_()'),end=source.indexOf('\nfunction PP_assertWeekDoesNotExist_',start);assert(start>=0&&end>start);
 let accepting=true;const changes=[],props=new Map([['PP_ACTIVE_WEEK','9'],['PP_DEADLINE_ISO',new Date(Date.now()+(future?3600000:-3600000)).toISOString()]]),sheet={};
 const form={setAcceptingResponses:v=>{changes.push(['accepting',v]);if(!stuck)accepting=v;},isAcceptingResponses:()=>accepting,setCustomClosedFormMessage:()=>changes.push(['closedMessage'])};
 const c=vm.createContext({Date,getSpreadsheet_:()=>sheet,PP_getLinkedForm_:ss=>{assert.equal(ss,sheet);return form;},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>{props.set(k,v);changes.push([k,v]);}})},Logger:{log(){}},PP_WEEKLY_FORM:{ITEM_DELAY_MS:0},PP_retryFormOperation_:fn=>fn(),PP_retryFormRead_:fn=>fn(),Utilities:{sleep(){}},PP_formatDateTime_:()=>'',PP_updateFormControlStatus_:(ss,status)=>{assert.equal(ss,sheet);changes.push(['formControl',status]);},PP_refreshPublicCaches_:()=>changes.push(['refreshCaches'])});vm.runInContext(source.slice(start,end),c);return {c,changes,props};
}
test('original closing callback leaves early invocation open, and only verifies CLOSED after successful Form closure',()=>{
 const early=closureFixture({future:true});early.c.PP_closeFormAtDeadline_();assert.deepEqual(early.changes,[]);
 const due=closureFixture();due.c.PP_closeFormAtDeadline_();assert.deepEqual(due.changes.map(x=>x[0]),['accepting','closedMessage','PP_FORM_STATUS','formControl','refreshCaches']);assert.equal(due.props.get('PP_FORM_STATUS'),'CLOSED');assert.deepEqual(due.changes[3],['formControl','CLOSED']);
 const stuck=closureFixture({stuck:true});assert.throws(()=>stuck.c.PP_closeFormAtDeadline_(),/still accepting responses/);assert(!stuck.props.has('PP_FORM_STATUS'));assert(!stuck.changes.some(x=>x[0]==='formControl'));
});
test('CLOSED Form Control without an independently authorized week remains withheld; explicit matching evidence unlocks only that week',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.closures=[];x.e.authority.closedAttestations=[{week:1,revision:1,attestedAt:new Date(x.e.policy.now-1000).toISOString(),status:'CLOSED',approved:true}];
 // Two-week fabricated layout models historical attested scope and newly CLOSED active scope.
 x.matrix['Form Control'][1][5]='CLOSED';let reply=x.get(),model=decode(reply,x.e.policy.now);assert.equal(model.weeks[0].entriesStatus,'CLOSED');assert.equal(model.weeks[1].visibility,'WITHHELD');assert(!Object.hasOwn(reply.snapshot.weeks[1],'picks'));assert(!Object.hasOwn(reply.snapshot.weeks[1],'votes'));
 x.e.authority.closedAttestations.push({week:2,revision:1,attestedAt:new Date(x.e.policy.now-1000).toISOString(),status:'CLOSED',approved:true});reply=x.get();assert.equal(decode(reply,x.e.policy.now).weeks[1].visibility,'AVAILABLE');assert(reply.snapshot.weeks[1].picks.length>0);assert(reply.snapshot.weeks[1].votes.length>0);
 x.matrix['Form Control'][1][5]='OPEN';reply=x.get();assert.equal(decode(reply,x.e.policy.now).weeks[1].visibility,'WITHHELD');assert(!Object.hasOwn(reply.snapshot.weeks[1],'picks'));assert(!Object.hasOwn(reply.snapshot.weeks[1],'votes'));
});
