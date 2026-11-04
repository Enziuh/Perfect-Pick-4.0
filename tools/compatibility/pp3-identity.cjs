'use strict';
// Private join normalization from 3.0. Never a public player key or alias source.
function normalizePhone(value){
 if(typeof value!=='string'&&!(typeof value==='number'&&Number.isSafeInteger(value)))throw Error('Invalid private identity');
 let digits=String(value||'').replace(/\D/g,'');
 if(digits.length===11&&digits.startsWith('1'))digits=digits.substring(1);
 return digits;
}
function identityNormalizer(format){
 if(format==='PP3_PHONE')return normalizePhone;
 if(format==='EXACT_TEXT')return value=>{if(typeof value!=='string'||!value.length)throw Error('Invalid private identity');return value;};
 throw Error('Invalid private identity mode');
}
module.exports={normalizePhone,identityNormalizer};
