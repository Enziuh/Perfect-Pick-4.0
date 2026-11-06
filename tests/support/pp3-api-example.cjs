'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {liveSheetExample}=require('./live-sheet-example.cjs');
const {createLegacyProvider}=require('../../tools/api/legacy-provider.cjs');
function example(){
 const e=liveSheetExample();e.authority.aliases.forEach((a,i)=>{a.alias=i===0?'Avery A.':'Blake B.';});const matrix=structuredClone(e.matrix);
 matrix['Prize Rules']=[['Period Key','Display Name','Start Week','End Week','Rule Mode','Weekly Entry','Monthly Winner %','Season %','Season 1st %','Season 2nd %','Season 3rd %','Include In Season','Locked','Notes'],['M1','Month 1',1,2,'NEW',5,50,50,'','','','YES','NO','PRIVATE_NOTE']];
 matrix['Weekly Prize Results']=[['Week','Period Key','Active Players','Perfect Pick Winners','Perfect Pick Winner Names','Finalized','Override Weekly Pot','Notes'],[1,'M1',2,'','','','','PRIVATE_NOTE'],[2,'M1',2,'','','','','PRIVATE_NOTE']];
 const sandbox=vm.createContext({...e.denied.globals,console:{log(){throw Error('No logs');}}});
 for(const f of ['00_Config_Setup.js','20_Data.js','10_Prizes_Scoring.js','30_ESPN_NFL.js','40_Cache_Helpers.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../../apps-script/src',f),'utf8'),sandbox);
 const ss={getSheetByName(name){const rows=matrix[name];if(!rows)return null;return {getLastRow:()=>rows.length,getLastColumn:()=>rows[0].length,getRange(r,c,n,m){const values=rows.slice(r-1,r-1+n).map(row=>Array.from({length:m},(_,i)=>row[c-1+i]??''));return {getDisplayValues:()=>values.map(r=>r.map(String)),getValues:()=>values};}};}};
 const context=()=>({ss,resultLookup:sandbox.getResultLookup_(ss),games:sandbox.readResponseSheet_(ss.getSheetByName('Responses')).games,responses:sandbox.readResponseSheet_(ss.getSheetByName('Responses')).responses,playerRegistry:{}});
 const cfg={enabled:true,publicationApproved:true,revision:1,authority:null};
 const deps={config:()=>cfg,now:()=>e.policy.now,context,prizes:sandbox.buildPrizeDashboardFromContext_,latest:sandbox.getLatestSubmissionPerWeek_,prediction:sandbox.getTiebreakPredictionForWeek_,score:sandbox.scoreSubmissionForWeek_};
 return {e,matrix,sandbox,cfg,deps,get:createLegacyProvider(deps)};
}
function lateExample(){
 const x=example(),m=x.matrix;
 m.Results.slice(1).forEach(r=>r[0]+=8);m['Form Control'][1][0]+=8;m['Form Control'][1][1]='Week 10';
 m['Tiebreak Rules'].slice(1).forEach(r=>r[0]+=8);m['Prize Rules'].slice(1).forEach(r=>{r[2]+=8;r[3]+=8;});m['Weekly Prize Results'].slice(1).forEach(r=>r[0]+=8);
 m.Responses[0]=m.Responses[0].map(h=>h.replace(/^W(\d+)(\s*\|)/,(_,n,s)=>'W'+(Number(n)+8)+s).replace(/^WK\s*(\d+)(\s+Tie)/,(_,n,s)=>'WK '+(Number(n)+8)+s));
 x.e.authority.closures.forEach(c=>c.week+=8);return x;
}
module.exports={example,lateExample};
