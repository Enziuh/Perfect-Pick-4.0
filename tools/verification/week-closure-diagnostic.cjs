'use strict';
const {checkAppsScriptCompatibility}=require('./gas-compatibility.cjs');
const NAME='pp4InspectWeek9ClosureReadOnly';
function render(){const source=`
// Temporary owner-editor metadata check only. No responses, identities or writers.
function pp4Week9InspectionConfig_(){return null;}
function ${NAME}(){
 const c=pp4Week9InspectionConfig_();
 if(!c || typeof c.ownerEmail!=='string' || typeof c.responderUrl!=='string')throw Error('Week closure inspection disabled');
 if(Session.getActiveUser().getEmail()!==c.ownerEmail || Session.getEffectiveUser().getEmail()!==c.ownerEmail)throw Error('Verified owner required');
 try{
  const ss=SpreadsheetApp.openById(PP3.SHEET_ID),sheet=ss.getSheetByName('Form Control');
  if(!sheet)throw Error('Unavailable');
  const rows=sheet.getRange(1,1,2,8).getValues();
  const expected=['Active Week','Section','First Game','First Kickoff','Picks Close','Status','Deadline Rule','Updated'];
  const columnsValid=rows.length===2 && expected.every((h,i)=>rows[0][i]===h);
  if(!columnsValid)throw Error('Unavailable');
  const activeWeek=Number(rows[1][0]),status=String(rows[1][5]).trim().toUpperCase();
  const link=ss.getFormUrl();if(!link)throw Error('Unavailable');
  const form=FormApp.openByUrl(link),acceptingResponses=form.isAcceptingResponses(),responderMatchesVerified=form.getPublishedUrl()===c.responderUrl;
  const coherent=activeWeek===9 && responderMatchesVerified && status==='CLOSED' && acceptingResponses===false;
  const report={state:coherent?'CLOSURE_CONFIRMED':'BLOCKED',columnsValid,activeWeek:Number.isInteger(activeWeek)&&activeWeek>=1&&activeWeek<=18?activeWeek:null,formControlStatus:['OPEN','CLOSED','UPCOMING'].indexOf(status)>=0?status:'UNKNOWN',acceptingResponses:typeof acceptingResponses==='boolean'?acceptingResponses:null,responderMatchesVerified,readRows:2,readColumns:8,diagnosticWrites:0};
  console.log(JSON.stringify(report));return report;
 }catch(_){throw Error('Week closure inspection unavailable; no private values logged');}
}
`;checkAppsScriptCompatibility(source,'TemporaryWeek9ClosureInspection.gs');return source;}
module.exports={NAME,render};
