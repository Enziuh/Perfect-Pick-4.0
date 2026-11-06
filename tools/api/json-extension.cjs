'use strict';
const fs=require('node:fs'),path=require('node:path');
const {bundle}=require('./bundle.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const {assertNoPrivateReferences}=require('../verification/local-target.cjs');
const ROUTE="  if (action === 'dashboard4') {\n    data = typeof buildPerfectPick4Dashboard_ === 'function' ? buildPerfectPick4Dashboard_(e) : {state:'UNAVAILABLE'};\n  } else if (action === 'health') {";
function route(source){const needle="  if (action === 'health') {";if(source.split(needle).length!==2||source.includes("action === 'dashboard4'"))throw Error('Unexpected PP3 router');return source.replace(needle,ROUTE);}
function upgradeRoute(source){
 const old="typeof buildPerfectPick4Dashboard_ === 'function' ? buildPerfectPick4Dashboard_() : {state:'UNAVAILABLE'}";
 if(source.split(old).length!==2)throw Error('Unexpected existing dashboard4 router');
 return source.replace(old,old.replace('buildPerfectPick4Dashboard_()','buildPerfectPick4Dashboard_(e)'));
}
const CUTOFF_READER=`
function readPerfectPick4Cutoffs_(ctx,definitions,weeks){
 const c=perfectPick4JsonConfig_(),control=readFormControl_(ctx.ss),defs=Array.from(definitions.values());
 return weeks.map(function(week){
  const current=Number(control.activeWeek)===week;
  const found=current?Array.from(definitions).find(function(pair){return pair[0]===week+'|'+String(control.firstGame).trim().toLowerCase().replace(/\\s+/g,' ');}):null;
  const firstGame=found?found[1].game:null;
  let events=[];try{events=fetchESPNNFLWeek3_0_(week).map(parseESPNNFLEvent3_0_);}catch(_){}
  return PerfectPick4Json_.buildScheduleEvidence({week:week,deadline:null,hardCutoff:true,firstGame:firstGame,revision:c.revision,verifiedAt:new Date().toISOString(),timezone:PP3.TIMEZONE,definitions:defs,events:events,normalizeTeam:normalizeNFLTeamKey3_0_});
 });
}
`;
function render(){const source='var PerfectPick4Json_='+bundle(path.join(__dirname,'legacy-provider.cjs'))+';\nfunction perfectPick4JsonConfig_(){return null;}\nfunction buildPerfectPick4Dashboard_(e){return PerfectPick4Json_.createLegacyProvider({config:function(){const c=perfectPick4JsonConfig_();if(c && c.lateEntryRules===\'LATE_ENTRY_V1\' && (!e || !e.parameter || e.parameter.rules!==\'LATE_ENTRY_V1\')){const legacy=Object.assign({},c);delete legacy.lateEntryRules;return legacy;}return c;},now:function(){return Date.now();},context:loadContext_,prizes:buildPrizeDashboardFromContext_,latest:getLatestSubmissionPerWeek_,prediction:getTiebreakPredictionForWeek_,score:scoreSubmissionForWeek_,timezone:function(ctx){return ctx.ss.getSpreadsheetTimeZone();},cutoffEvidence:readPerfectPick4Cutoffs_,formState:function(ctx){const link=ctx.ss.getFormUrl();if(!link)return null;const f=FormApp.openByUrl(link),c=perfectPick4JsonConfig_();return {acceptingResponses:f.isAcceptingResponses(),responderMatchesVerified:c.form&&c.form.verified===true&&c.form.approvedForPlayers===true&&f.getPublishedUrl()===c.form.url};},nativeResponses:function(ctx){return PerfectPick4Json_.readNativeResponses(ctx.ss.getSheetByName(PP3.RESPONSE_SHEET),ctx.games.map(function(g){return g.header;}));}})();}\n';checkAppsScriptCompatibility(source+CUTOFF_READER,'JSON extension');assertNoPrivateReferences(source+CUTOFF_READER);return source+CUTOFF_READER;}
if(require.main===module){const dir=path.resolve(__dirname,'../../tmp/json-api-extension');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'PerfectPick4_Json.gs'),render(),{mode:0o600});console.log('Prepared disabled additive JSON extension; no upload, execution or deployment.');}
module.exports={render,route,upgradeRoute,ROUTE};
