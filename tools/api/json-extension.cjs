'use strict';
const fs=require('node:fs'),path=require('node:path');
const {bundle}=require('./bundle.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const {assertNoPrivateReferences}=require('../verification/local-target.cjs');
const ROUTE="  if (action === 'dashboard4') {\n    data = typeof buildPerfectPick4Dashboard_ === 'function' ? buildPerfectPick4Dashboard_() : {state:'UNAVAILABLE'};\n  } else if (action === 'health') {";
function route(source){const needle="  if (action === 'health') {";if(source.split(needle).length!==2||source.includes("action === 'dashboard4'"))throw Error('Unexpected PP3 router');return source.replace(needle,ROUTE);}
function render(){const source='var PerfectPick4Json_='+bundle(path.join(__dirname,'legacy-provider.cjs'))+';\nfunction perfectPick4JsonConfig_(){return null;}\nfunction buildPerfectPick4Dashboard_(){return PerfectPick4Json_.createLegacyProvider({config:perfectPick4JsonConfig_,now:function(){return Date.now();},context:loadContext_,prizes:buildPrizeDashboardFromContext_,latest:getLatestSubmissionPerWeek_,prediction:getTiebreakPredictionForWeek_})();}\n';checkAppsScriptCompatibility(source,'JSON extension');assertNoPrivateReferences(source);return source;}
if(require.main===module){const dir=path.resolve(__dirname,'../../tmp/json-api-extension');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'PerfectPick4_Json.gs'),render(),{mode:0o600});console.log('Prepared disabled additive JSON extension; no upload, execution or deployment.');}
module.exports={render,route,ROUTE};
