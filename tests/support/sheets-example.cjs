'use strict';
const {fabricated}=require('./projector-examples.cjs');
const {projectCompetition}=require('../../tools/projector/project-competition.cjs');
const {writeDenyingServices}=require('./write-denying-services.cjs');
const {AT,UNTIL}=require('./live-contract-examples.cjs');
function sheetsExample(scenario='decisive'){
 const {source,policy}=fabricated(scenario),denied=writeDenyingServices(),calls=[];
 const matrix={Results:[['Week','Game','Winner','Status','Team 1','Team 2','Team 1 Score','Team 2 Score','Notes','Event ID'],...source.games.map(g=>[g.week,g.game,g.winner,g.status,g.team1,g.team2,g.team1Score,g.team2Score,'FABRICATED_PRIVATE','FABRICATED_PRIVATE'])],
  Responses:[['Timestamp','Name','Phone Number','W1 | Bears vs Lions','W2 | Chiefs vs Bills','WK 2 Tie Breaker — Chiefs vs Bills — Enter Combined Score','Notes']]};
 for(const w of source.weeks)for(const r of w.submissions||[])matrix.Responses.push([12345,'FABRICATED_PRIVATE',r.identity,w.week===1?r.selections[0]?.pick||'':'',w.week===2?r.selections[0]?.pick||'':'',w.week===2?r.prediction?.value||'':'','FABRICATED_PRIVATE']);
 const layout={season:2026,results:{sheet:'Results',firstRow:2,columns:[['Week',1],['Game',2],['Team 1',5],['Team 2',6],['Winner',3],['Status',4],['Team 1 Score',7],['Team 2 Score',8]].map(([header,column])=>({header,column}))},
  responses:{sheet:'Responses',firstRow:2,timestamp:{header:'Timestamp',column:1},identity:{header:'Phone Number',column:3},games:[{week:1,game:'Bears vs Lions',header:'W1 | Bears vs Lions',column:4},{week:2,game:'Chiefs vs Bills',header:'W2 | Chiefs vs Bills',column:5}],predictions:[{week:2,game:'Chiefs vs Bills',header:'WK 2 Tie Breaker — Chiefs vs Bills — Enter Combined Score',column:6}]}};
 const proof={revision:1,observedAt:AT,validUntil:UNTIL,quiescent:true,resultRows:source.games.length,responseRows:matrix.Responses.length-1};
 const state={read:0,evidence:0,clock:policy.now,transform:null,onEvidence:null,onRead:null};
 const batchGet=(target,options)=>{
  calls.push({target,options:structuredClone(options)});state.read++;
  const valueRanges=options.ranges.map(range=>{
   const m=range.match(/^'([^']+)'!([A-Z]+)(\d+):\2(\d+)$/);if(!m)throw Error('Disallowed fabricated range');
   const col=[...m[2]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1,first=Number(m[3]),last=Number(m[4]);
   const values=Array.from({length:last-first+1},(_,i)=>{const v=matrix[m[1]][first+i-1]?.[col];return v===undefined||v===''?[]:[v];});
   while(values.length&&!values.at(-1).length)values.pop();
   return {range,majorDimension:'ROWS',values};
  });
  const result={valueRanges};Object.defineProperty(result,'spreadsheetId',{get(){throw Error('Metadata must not be read');}});
  if(state.onRead)state.onRead(matrix,state.read);return state.transform?state.transform(result,state.read):result;
 };
 const values=new Proxy(Object.create(null),{get(_target,method){return method==='batchGet'?batchGet:denied.globals.SpreadsheetApp[String(method)];},set(){throw Error('Write denied');}});
 const dependencies={values,projectCompetition,now:()=>state.clock,readEvidence(){state.evidence++;return state.onEvidence?state.onEvidence(structuredClone(proof),state.evidence):structuredClone(proof);},identityKey:value=>{if(typeof value!=='string')throw Error('Unverified identity format');return value;},submissionTime:value=>{if(value!==12345)throw Error('Unverified timestamp conversion');return AT;}};
 return {source,policy,layout,matrix,proof,calls,state,dependencies,denied,target:'FABRICATED_TARGET'};
}
module.exports={sheetsExample};
