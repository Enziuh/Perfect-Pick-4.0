'use strict';
// Pinned Git evidence, independent of later production snapshot refreshes. No network.
const {execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const COMMIT='bff774117824e0de752c1095f2e0b3a14e21eac6';
const SHA256='ae42e71f94331199eb678d67baade8f26148e19f722a3db7926b29519034e2f9';
function historical(){
 const bytes=execFileSync('git',['show',COMMIT+':public-data/snapshot.json'],{cwd:require('node:path').resolve(__dirname,'../..'),maxBuffer:2000000});
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==SHA256)throw Error('Pinned historical snapshot mismatch');
 return JSON.parse(bytes);
}
module.exports={historical,COMMIT,SHA256};
