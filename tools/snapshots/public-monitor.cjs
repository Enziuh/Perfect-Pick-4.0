'use strict';
// Public CDN ONLY; never accepts an API URL, credential or registry input.
const {production}=require('./production-policy.cjs');
async function monitor(fetcher=fetch,now=Date.now()){
 try{
  const url='https://enziuh.github.io/Perfect-Pick-4.0/data/snapshot.json';let file;
  for(let n=0;n<3;n++)try{const r=await fetcher(url,{redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok||r.url!==url||!/^application\/json\b/i.test(r.headers.get('content-type')||''))throw Error();const reader=r.body.getReader(),chunks=[];let size=0;try{for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>2000000)throw Error();chunks.push(v.value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}file=JSON.parse(Buffer.concat(chunks).toString('utf8'));break;}catch{if(n===2)throw Error();}
  production(file,now);const remainingMinutes=Math.floor((Date.parse(file.expiresAt)-now)/60000);if(remainingMinutes<15)throw Error();return {state:'HEALTHY',remainingMinutes};
 }catch{throw Error('Public snapshot missing, invalid, expired or nearing expiry');}
}
if(require.main===module)monitor().then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('FAIL: public snapshot health; investigate cloud publisher/Pages. No private inputs inspected.');process.exitCode=1;});
module.exports={monitor};
