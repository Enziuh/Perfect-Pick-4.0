'use strict';
// Digest only allowlisted PUBLIC content, never private identity data.
const crypto=require('node:crypto');
function contentHash(file){const volatile=new Set(['generatedAt','verifiedAt','checkedAt','validUntil']);return crypto.createHash('sha256').update(JSON.stringify({retention:file.retention??null,payload:JSON.parse(JSON.stringify(file.payload,(key,value)=>volatile.has(key)?undefined:value))})).digest('hex');}
module.exports={contentHash};
