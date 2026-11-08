'use strict';
// Prepared owner operation only; no upload/execution or infrastructure identifiers.
function render(){return `function pp4ReopenExistingWeek10AfterReview(){
 const closureReviewConfirmed = false; // owner sets true ONLY after trigger/native-close review
 if(!closureReviewConfirmed)throw Error('Closure review required; no changes made');
 const deadline='2026-11-13T00:15:00.000Z',kickoff='2026-11-13T01:15:00.000Z';
 const properties=PropertiesService.getScriptProperties();
 if(properties.getProperty('PP_ACTIVE_WEEK')!=='10'||properties.getProperty('PP_FORM_STATUS')!=='OPEN'||properties.getProperty('PP_DEADLINE_ISO')!==deadline||properties.getProperty('PP_FIRST_KICKOFF_ISO')!==kickoff||Date.now()>=Date.parse(deadline))throw Error('Week10 stored configuration mismatch; no changes made');
 const ss=getSpreadsheet_(),control=readFormControl_(ss);
 if(control.activeWeek!==10||control.status!=='OPEN'||control.picksClose!==deadline||control.firstKickoff!==kickoff)throw Error('Week10 Form Control mismatch; no changes made');
 const handlers=ScriptApp.getProjectTriggers().map(t=>t.getHandlerFunction());
 if(handlers.filter(h=>h==='PP_closeFormAtDeadline_').length!==1||handlers.some(h=>h!=='PP_closeFormAtDeadline_'&&/close|repair/i.test(h)))throw Error('Closing automation needs review; no changes made');
 const form=PP_getLinkedForm_(ss),content=PP_verifyWeekContent_(form,10,14);
 if(!content.ok)throw Error('Week10 content mismatch; no changes made');
 if(typeof form.supportsAdvancedResponderPermissions==='function'&&form.supportsAdvancedResponderPermissions()&&!form.isPublished())throw Error('Form unpublished; no changes made');
 if(form.isAcceptingResponses())return {state:'ALREADY_OPEN',week:10,writes:0};
 form.setAcceptingResponses(true); // ONLY mutation; no Properties/Sheet/routing/trigger writes
 if(!form.isAcceptingResponses())throw Error('Acceptance not confirmed; do not rerun blindly');
 const report={state:'WEEK10_ACCEPTING_RESPONSES',week:10,gameQuestions:14,deadline:deadline,writes:1};console.log(JSON.stringify(report));return report;
}
`;}
module.exports={render};
