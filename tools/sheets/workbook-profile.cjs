'use strict';
// Owner-supplied workbook coordinates, not fabricated column permutations.
function workbookLayout(season,responseGames=[],predictions=[]){
 return {season,results:{sheet:'Results',firstRow:2,columns:['Week','Game','Team 1','Team 2','Winner','Status','Team 1 Score','Team 2 Score'].map((header,i)=>({header,column:i+1}))},responses:{sheet:'Responses',firstRow:2,timestamp:{header:'Timestamp',column:1},identity:{header:'Phone Number',column:3},games:responseGames.map(d=>({...d})),predictions:predictions.map(d=>({...d}))}};
}
function minimalStructureConfig(privateSettings={}){
 return {activation:{enabled:false,soleOwnerReviewed:false,noPublicExecutionReviewed:false,readOnlyGrantsReviewed:false,notBefore:null,expiresAt:null,...privateSettings.activation},mode:'STRUCTURE',identityFormat:'PP3_PHONE',capture:null,captureAuthorityReviewed:false,
 competition:{target:privateSettings.target??null,timeZone:privateSettings.timeZone??null,revision:0,maxAgeMs:300000,layout:workbookLayout(privateSettings.season??2026),policy:{games:new Map(),teams:new Map(),periods:[],seasonWeeks:[],decisions:new Map(),accounting:new Map()},aliases:[],closures:[]}};
}
module.exports={workbookLayout,minimalStructureConfig};
