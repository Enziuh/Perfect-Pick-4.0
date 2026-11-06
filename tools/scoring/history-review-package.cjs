'use strict';
const path=require('node:path');const {bundle}=require('../api/bundle.cjs');const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const NAME='pp41ReviewScoringImpact';
function fake(){return {captureVersion:1,mode:'FABRICATED',report:{schema:'PP41_PRIVATE_IMPACT_COUNTS_V1',state:'CAPTURE_TEST',weeks:[{week:9,state:'COMPARED',affectedPlayers:2,affectedGames:1}],productionWrites:0},padding:'FABRICATED_COMPLETE_CAPTURE_'.repeat(1200),endMarker:'PP41_CAPTURE_COMPLETE'};}
function render(){const source=`
function pp41ImpactConfig_(){return null;}
function ${NAME}(){
 try{
  const c=pp41ImpactConfig_();if(!c||!c.enabled||!c.ownerEmail)throw Error('Disabled');
  if(Session.getActiveUser().getEmail()!==c.ownerEmail||Session.getEffectiveUser().getEmail()!==c.ownerEmail)return {state:'BLOCKED',reason:'OWNER_IDENTITY_UNAVAILABLE',productionWrites:0};
  if(c.mode==='FABRICATED')return ${JSON.stringify(fake())};
  if(c.mode!=='LIVE')throw Error('Disabled');
  const core=${bundle(path.join(__dirname,'history-review.cjs'))};
  const nativeReader=${bundle(path.join(__dirname,'native-responses.cjs'))};
  const schedules=${bundle(path.join(__dirname,'schedule-evidence.cjs'))};
  const ctx=loadContext_(),sheet=ctx.ss.getSheetByName(PP3.RESPONSE_SHEET),raw=nativeReader.readNativeResponses(sheet,ctx.games.map(function(g){return g.header;}));
  const controlSheet=ctx.ss.getSheetByName('Form Control');if(!controlSheet||controlSheet.getLastRow()<2||controlSheet.getLastRow()>19)throw Error('Unavailable');
  const control=controlSheet.getRange(1,1,controlSheet.getLastRow(),8).getValues();
  const headers=['Active Week','Section','First Game','First Kickoff','Picks Close','Status','Deadline Rule','Updated'];if(!headers.every(function(h,i){return control[0][i]===h;}))throw Error('Unavailable');
  const parser=(${bundle(path.resolve(__dirname,'../verification/timestamps.cjs'))}).createParser(PP3.TIMEZONE);
  const defs=ctx.games.filter(function(g){return g.week>=1&&g.week<=9;}).map(function(g){const r=ctx.resultLookup[g.week]&&ctx.resultLookup[g.week][normalizeGame_(g.game)];return {week:g.week,game:g.game,home:r?r.team1:'',away:r?r.team2:''};});
  const evidence=new Map(),fetchFailures=[];
  for(let week=9;week<=9;week++){
   const rows=control.slice(1).filter(function(r){return Number(r[0])===week;});let firstGame=null,deadline=null;
   if(rows.length===1){const row=rows[0],found=defs.filter(function(g){return g.week===week&&normalizeGame_(g.game)===normalizeGame_(row[2]);});if(found.length===1){firstGame=found[0].game;try{deadline=parser.parse(row[4]);}catch(_){}}}
   let events=[];try{events=fetchESPNNFLWeek3_0_(week).map(parseESPNNFLEvent3_0_);}catch(_){fetchFailures.push(week);}
   evidence.set(week,schedules.buildScheduleEvidence({week:week,deadline:null,firstGame:firstGame,hardCutoff:true,revision:1,verifiedAt:new Date().toISOString(),timezone:PP3.TIMEZONE,definitions:defs,events:events,normalizeTeam:normalizeNFLTeamKey3_0_}));
  }
  const rules=readPrizeRules_(ctx.ss),tiebreaks=readTiebreakRules_(ctx.ss);
  const report=core.review({now:Date.now(),timezone:PP3.TIMEZONE,rawResponses:raw,context:ctx,evidence:evidence,oldLatest:getLatestSubmissionPerWeek_(ctx.responses,ctx.games),oldScore:scoreSubmissionForWeek_,normalizeGame:normalizeGame_,normalizeTeam:normalizeTeam_,prediction:getTiebreakPredictionForWeek_,periods:rules.map(function(p){return {key:p.periodKey,startWeek:p.startWeek,endWeek:p.endWeek,game:tiebreaks[p.endWeek]?tiebreaks[p.endWeek].game:null,ruleMode:p.ruleMode,weeklyEntry:p.weeklyEntry,monthlyWinnerPct:p.monthlyWinnerPct};})});
  const after=loadContext_(),afterNative=nativeReader.readNativeResponses(sheet,after.games.map(function(g){return g.header;})),afterControl=controlSheet.getRange(1,1,controlSheet.getLastRow(),8).getValues();
  if(JSON.stringify(raw)!==JSON.stringify(afterNative)||JSON.stringify(control)!==JSON.stringify(afterControl)||JSON.stringify(ctx.games)!==JSON.stringify(after.games)||JSON.stringify(ctx.responses)!==JSON.stringify(after.responses)||JSON.stringify(ctx.playerRegistry)!==JSON.stringify(after.playerRegistry)||JSON.stringify(ctx.resultLookup)!==JSON.stringify(after.resultLookup))return {captureVersion:1,mode:'LIVE',report:{state:'BLOCKED',reason:'SOURCE_CHANGED_DURING_REVIEW',productionWrites:0},endMarker:'PP41_CAPTURE_COMPLETE'};
  report.snapshotStable=true;report.scheduleFetchFailures=fetchFailures;
  report.configuredTimezoneMatchesSheet=ctx.ss.getSpreadsheetTimeZone()===PP3.TIMEZONE;
  let accepting=null,matching=false;try{const link=ctx.ss.getFormUrl();if(link){const f=FormApp.openByUrl(link);accepting=f.isAcceptingResponses();matching=f.getPublishedUrl()===c.responderUrl;}}catch(_){}
  const current=control[1];report.form={activeWeek:Number(current[0]),controlStatus:['OPEN','CLOSED','UPCOMING'].indexOf(String(current[5]))>=0?String(current[5]):'UNKNOWN',acceptingResponses:typeof accepting==='boolean'?accepting:null,responderMatchesVerified:matching};
  return {captureVersion:1,mode:'LIVE',report:report,endMarker:'PP41_CAPTURE_COMPLETE'};
 }catch(_){return {state:'BLOCKED',reason:'READ_ONLY_REVIEW_UNAVAILABLE',productionWrites:0};}
}
`;checkAppsScriptCompatibility(source,'TemporaryScoringImpactReview.gs');return source;}
module.exports={NAME,render,fake};
