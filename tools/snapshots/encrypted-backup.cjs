'use strict';
// Independent offline recovery copy. The256-bit key is injected from a separately
// access-controlled owner store; this module never saves or logs a key.
const crypto=require('node:crypto');
const {validate}=require('./identity-contract.cjs');
const AAD=Buffer.from('PP4_PRIVATE_ID_BACKUP_V1');
function encrypt(store,key,{generation=null}={}){
 validate(store);if(generation!==null&&(!Number.isSafeInteger(generation)||generation<1))throw Error('Private backup unavailable');if(!Buffer.isBuffer(key)||key.length!==32)throw Error('Private backup unavailable');
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.concat([AAD,Buffer.from(':'+String(generation))]));
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(store),'utf8'),cipher.final()]);
 return {version:1,generation,algorithm:'AES-256-GCM',iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
}
function decrypt(file,key,{expectedGeneration=null}={}){
 try{if(!Buffer.isBuffer(key)||key.length!==32||!file||Object.keys(file).sort().join(',')!=='algorithm,ciphertext,generation,iv,tag,version'||file.version!==1||file.algorithm!=='AES-256-GCM'||file.generation!==expectedGeneration||file.generation!==null&&(!Number.isSafeInteger(file.generation)||file.generation<1))throw Error();
 const decode=s=>{if(typeof s!=='string'||s.length>2000000)throw Error();const b=Buffer.from(s,'base64');if(b.toString('base64')!==s)throw Error();return b;};
 const iv=decode(file.iv),tag=decode(file.tag);if(iv.length!==12||tag.length!==16)throw Error();const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(Buffer.concat([AAD,Buffer.from(':'+String(expectedGeneration))]));decipher.setAuthTag(tag);
 return validate(JSON.parse(Buffer.concat([decipher.update(decode(file.ciphertext)),decipher.final()]).toString('utf8')));
 }catch{throw Error('Private backup unavailable');}
}
module.exports={encrypt,decrypt};
