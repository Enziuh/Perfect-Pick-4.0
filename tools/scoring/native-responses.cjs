'use strict';
// Private bounded read: Timestamp A, Phone C and approved pick questions D onward.
// Name B is never read. No public response/logging or spreadsheet mutation.
function readNativeResponses(sheet,gameHeaders){
 if(!sheet||!Array.isArray(gameHeaders))throw Error('Native submission source unavailable');
 const rows=sheet.getLastRow(),cols=sheet.getLastColumn();if(!Number.isInteger(rows)||rows<1||rows>1001||!Number.isInteger(cols)||cols<3||cols>1024)throw Error('Native submission bounds unavailable');
 const headers=sheet.getRange(1,1,1,cols).getValues()[0];if(headers[0]!=='Timestamp'||headers[2]!=='Phone Number'||new Set(headers).size!==headers.length||gameHeaders.some(h=>!headers.includes(h)))throw Error('Native submission columns unavailable');
 if(rows===1)return [];
 const allowed=new Set(['Phone Number',...gameHeaders,...headers.filter(h=>typeof h==='string'&&/^WK\s+\d+\s+Tie\s+Breaker\b/i.test(h))]);
 const times=sheet.getRange(2,1,rows-1,1).getValues();if(times.length!==rows-1||times.some(r=>r.length!==1))throw Error('Native submission snapshot incomplete');
 const result=times.map(r=>({Timestamp:r[0]})),columns=headers.map((h,i)=>allowed.has(h)?i+1:null).filter(i=>i!==null),groups=[];
 for(const col of columns){const previous=groups[groups.length-1];if(previous&&previous.start+previous.length===col)previous.length++;else groups.push({start:col,length:1});}
 for(const group of groups){
  const values=sheet.getRange(2,group.start,rows-1,group.length).getValues();
  if(values.length!==rows-1||values.some(r=>r.length!==group.length))throw Error('Native submission snapshot incomplete');
  values.forEach((row,i)=>row.forEach((value,j)=>{result[i][headers[group.start-1+j]]=value;}));
 }
 if(sheet.getLastRow()!==rows||sheet.getLastColumn()!==cols)throw Error('Native submission snapshot changed');return result;
}
module.exports={readNativeResponses};
