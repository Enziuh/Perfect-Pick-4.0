'use strict';
const {fabricated}=require('./projector-examples.cjs');
const {writeDenyingServices}=require('./write-denying-services.cjs');
function liveSheetExample(){
 const e=fabricated(),calls=[],denied=writeDenyingServices();const {source,policy}=e;
 const contacts=['0'.repeat(9)+'1','0'.repeat(9)+'2'],privateKeys=[...policy.aliases.keys()];
 const matrix={Results:[['Week','Game','Team 1','Team 2','Winner','Status','Team 1 Score','Team 2 Score'],...source.games.map(g=>[g.week,g.game,g.team1,g.team2,g.winner,g.status,g.team1Score,g.team2Score])],
 'Form Control':[['Active Week','Section','First Game','First Kickoff','Picks Close','Status','Deadline Rule','Updated'],[2,'Week 2','Chiefs vs Bills','','','CLOSED','PRIVATE_NOTE','']],
 'Prize Rules':[['Period Key','Display Name','Start Week','End Week'],['M1','PRIVATE_LABEL',1,2]],
 'Tiebreak Rules':[['Week','Tiebreak Game','','','','Method'],[2,'Chiefs vs Bills','','','','Combined Points']],
 Responses:[['Timestamp','Name','Phone Number','W1 | Bears vs Lions','W2 | Chiefs vs Bills','WK 2 Tie Breaker — Chiefs vs Bills — Enter Combined Score']]};
 for(const w of source.weeks)for(const r of w.submissions)matrix.Responses.push([r.timestamp,'PRIVATE_NAME',contacts[privateKeys.indexOf(r.identity)],w.week===1?r.selections[0].pick:'',w.week===2?r.selections[0].pick:'',w.week===2?r.prediction?.value??'':'']);
 const cfg={enabled:true,ownerAccessReviewed:true,readOnlyGrantsReviewed:true,target:'FABRICATED_TARGET',timeZone:'America/Los_Angeles',season:2026,expectedGameCount:2,activeWeek:null,maxAgeMs:300000,responseLastColumn:6,form:null,authority:null};
 const authority={revision:1,aliases:[...policy.aliases].map(([key,a])=>({privateKey:contacts[privateKeys.indexOf(key)],...a,revision:1})),closures:[...policy.closures].map(([week,c])=>({week,snapshotRevision:1,closureRevision:c.entry.revision,status:'CLOSED',mechanism:'OWNER_VERIFIED_CLOSURE',verifiedClosed:true,checkedAt:c.entry.checkedAt,validUntil:c.entry.validUntil,deadline:null})),decisions:policy.decisions,accounting:policy.accounting,capture:{revision:1,observedAt:source.observedAt,validUntil:new Date(policy.now+300000).toISOString(),resultRows:source.games.length,responseRows:matrix.Responses.length-1,quiescent:true}};
 let fault=null;
 const batchGet=(target,options)=>{
  if(target!==cfg.target)throw Error('Wrong target');calls.push(structuredClone(options));
  if(options.valueRenderOption!=='UNFORMATTED_VALUE'||options.dateTimeRenderOption!=='SERIAL_NUMBER'||options.majorDimension!=='ROWS'||options.fields!=='valueRanges(range,majorDimension,values)')throw Error('Unsafe options');
  if(fault)fault(matrix,calls.length);
  return {valueRanges:options.ranges.map(range=>{
   const m=range.match(/^'([^']+)'!([A-Z]+)(\d+):([A-Z]+)(\d+)$/);if(!m||!matrix[m[1]])throw Error('Unexpected range');const col=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
   const first=Number(m[3]),last=Number(m[5]),start=col(m[2]),end=col(m[4]);if(last>1001||end>1023)throw Error('Read budget');
   const values=Array.from({length:last-first+1},(_,i)=>Array.from({length:end-start+1},(_,j)=>matrix[m[1]][first+i-1]?.[start+j]??''));
   while(values.length&&values.at(-1).every(v=>v===''))values.pop();for(const row of values)while(row.length&&row.at(-1)==='')row.pop();
   return {range,majorDimension:'ROWS',values};
  })};
 };
 const sheets={Spreadsheets:{Values:new Proxy({batchGet},{get(t,k){if(k==='batchGet')return t[k];denied.attempts.push(String(k));throw Error('Write denied');}})}};
 return {cfg,authority,matrix,calls,denied,sheets,policy,setFault:f=>fault=f};
}
module.exports={liveSheetExample};
