'use strict';
// Exact PP3 presentation rule; formatting NEVER authorizes publication or identity.
function toPublicName(value){
 const parts=String(value||'').trim().split(/\s+/).filter(Boolean);
 if(!parts.length)return 'Player';
 return parts.length===1?parts[0]:parts[0]+' '+parts[parts.length-1].charAt(0).toUpperCase()+'.';
}
function safeAlias(value){
 return typeof value==='string'&&value.length>0&&value.length<=48&&value.trim()===value&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069<>@]/.test(value)&&!/(?:https?:\/\/|www\.)/i.test(value)&&!/(?:\d[\d\s().+-]{5,}\d)/.test(value);
}
function policyAlias(value){
 if(!safeAlias(value))return false;
 const parts=value.split(/\s+/);
 return parts.length===1||parts.length===2&&parts[1].endsWith('.')&&parts[1].slice(0,-1)===parts[1].slice(0,-1).toUpperCase()&&parts[1].slice(0,-1).length<=2;
}
module.exports={toPublicName,safeAlias,policyAlias};
