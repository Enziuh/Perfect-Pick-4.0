'use strict';
const {createParser}=require('../verification/timestamps.cjs');
// Owner-only caller injects the target. Timestamp column A only; no private rows returned.
function inspect(sheet,timezone){
 const count=sheet.getLastRow();if(!Number.isInteger(count)||count<1||count>1001)throw Error('Timestamp inspection unavailable');
 if(sheet.getRange(1,1,1,1).getValues()[0][0]!=='Timestamp')throw Error('Timestamp inspection unavailable');
 const result={state:'TIMESTAMP_TYPES_VERIFIED',records:count-1,nativeDates:0,numericSerials:0,textValues:0,validInstants:0,invalidInstants:0,displaySecondsAgree:0,subsecondsPreserved:0,writes:0};if(count===1)return result;
 const range=sheet.getRange(2,1,count-1,1),native=range.getValues(),display=range.getDisplayValues(),parser=createParser(timezone);if(native.length!==count-1||display.length!==count-1)throw Error('Timestamp inspection unavailable');
 for(let i=0;i<native.length;i++){const value=native[i][0],kind=Object.prototype.toString.call(value);if(kind==='[object Date]')result.nativeDates++;else if(typeof value==='number')result.numericSerials++;else if(typeof value==='string')result.textValues++;try{const instant=Date.parse(parser.parse(value));result.validInstants++;if(instant%1000)result.subsecondsPreserved++;try{if(Math.floor(Date.parse(parser.parse(display[i][0]))/1000)===Math.floor(instant/1000))result.displaySecondsAgree++;}catch{}}catch{result.invalidInstants++;}}
 if(sheet.getLastRow()!==count)throw Error('Timestamp inspection unavailable');return result;
}
module.exports={inspect};
