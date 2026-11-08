'use strict';
const zlib=require('node:zlib'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {snapshotExample}=require('../../tests/support/static-snapshot-example.cjs');
const {generate}=require('./publisher.cjs'),{assets}=require('./local-preview.cjs');
const {render}=require('../api/pages-artifact.cjs'),{profile}=require('../performance/browser-profile.cjs');
async function server({retained=false}={}){
 const reply=snapshotExample(),now=Date.parse(reply.snapshot.generatedAt),approval={approvedAliases:new Map(reply.aliases.map(a=>[a.player,a.alias])),...(retained?{retention:{}}:{})},generated=generate(reply,{version:1,entries:[]},now,approval);
 const sources={static:assets(generated.file),api:render({endpoint:'https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec',publicationApproved:true})};
 const compressed=Object.fromEntries(Object.entries(sources).map(([profile,files])=>[profile,Object.fromEntries(Object.entries(files).map(([name,text])=>[name,zlib.gzipSync(text)]))]));
 const app=http.createServer((req,res)=>{const m=new URL(req.url,'http://localhost').pathname.match(/^\/(static|api)\/Perfect-Pick-4\.0\/(.*)$/),file=m?.[2]||'index.html';if(!m||!Object.hasOwn(sources[m[1]],file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');res.setHeader('Cache-Control',file==='data/snapshot.json'||file==='index.html'?'no-store':'public,max-age=600');res.setHeader('Content-Encoding','gzip');res.end(compressed[m[1]][file]);});
 await new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',resolve);});return {app,url:'http://127.0.0.1:'+app.address().port,reply,now};
}
async function inspect(evaluate,width,sample,{retained=false}={}){
 assert.equal(sample.runtimeErrors,0);assert.equal(sample.apiRequests,0);assert.equal(sample.snapshotRequests,1);assert.equal(sample.interactionApiRequests,0);assert.equal(sample.matrixCells,0);assert.equal(sample.closedWeekMatrixCells,0);
 assert(await evaluate("document.documentElement.scrollWidth <= innerWidth"),'Page overflow at '+width);
 assert.equal(await evaluate("document.querySelectorAll('#playerPicksBody tr').length"),23);
 assert.equal(await evaluate("document.querySelectorAll('#playerPicksBody .pick-cell').length"),345);
 assert(await evaluate("[...document.querySelectorAll('#playerPicksBody tr')].every(r=>r.querySelector('.pick-cell'))"));
 const evaluateWait=async(expression,ready)=>evaluate(`new Promise((resolve,reject)=>{const stop=setTimeout(()=>{o.disconnect();reject(Error('Check timeout'));},10000);const o=new MutationObserver(check);function check(){if(${ready}){o.disconnect();clearTimeout(stop);resolve(true);}}o.observe(document,{subtree:true,childList:true,attributes:true,characterData:true});${expression};check();})`);
 await evaluateWait("document.getElementById('weekSelect').value='9';document.getElementById('weekSelect').dispatchEvent(new Event('change'))","document.getElementById('picksSubmissionCount').textContent.includes('Week 9 is open')");
 assert.equal(await evaluate("document.querySelectorAll('#picks .pick-cell,#picks .player-pick-card,#picks .vote-option').length"),0);
 assert(!await evaluate("document.getElementById('picks').textContent.includes('ExampleA')"));
 const logos=await evaluate(`Promise.all(${JSON.stringify(Object.keys(require('../presentation/contract-dashboard.cjs').TEAM_NAMES))}.map(k=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth>0);i.onerror=()=>r(false);i.src='assets/teams/'+k.toLowerCase()+'.svg';})))`);assert(logos.every(Boolean));
 // Every browser fetch is same-origin. No API, analytics or third-party services.
 assert(await evaluate("performance.getEntriesByType('resource').every(r=>new URL(r.name).origin===location.origin)"));
 for(const dest of ['overview','standings/weekly','standings/monthly','standings/season','prizes','guide/rules']){await evaluateWait(`location.hash=${JSON.stringify('#'+dest)}`,`location.hash===${JSON.stringify('#'+dest)} && !document.getElementById(${JSON.stringify(dest.split('/')[0])}).hidden`);assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"));}
 if(retained)assert(await evaluate("document.getElementById('staticSnapshotNotice').textContent.includes('six hours')"));
 if(width===390){
  await evaluate("window.__originalSnapshotFetch=window.fetch;window.fetch=async()=>({ok:false,url:new URL('./data/snapshot.json',location.href).href,headers:{get:()=> 'application/json'},text:async()=> '{broken'})");
  await evaluateWait("document.getElementById('refreshResults').click()","document.getElementById('status').textContent.includes('Update unavailable') && !document.getElementById('refreshResults').disabled");
  assert(await evaluate("document.getElementById('main-content').textContent.includes('ExampleA')"));
  await evaluate("Date.now=()=>"+(Date.UTC(2026,10,5,12)+(retained?21600001:120001)));
  await evaluateWait("document.getElementById('refreshResults').click()","document.getElementById('status').textContent.includes('Competition data unavailable') && !document.getElementById('refreshResults').disabled");
  assert(!await evaluate("document.getElementById('main-content').textContent.includes('ExampleA')"));
  assert.equal(await evaluate("document.querySelectorAll('.pick-cell,.vote-option,.player-pick-card').length"),0);
 }

}
async function run({out='tmp/static-snapshot-benchmark',widths=[1440,768,390],compare=true,check=true,retained=false}={}){
 fs.mkdirSync(out,{recursive:true,mode:0o700});const s=await server({retained});
 const replay=path.join(out,'fabricated-api.private.json');fs.writeFileSync(replay,JSON.stringify(s.reply),{mode:0o600});
 try{
  if(compare)await profile({url:s.url+'/api/Perfect-Pick-4.0/',output:path.join(out,'controlled-api.json'),widths,replayFile:replay});
  await profile({url:s.url+'/static/Perfect-Pick-4.0/',output:path.join(out,'static.json'),widths,clockAt:s.now+(retained?10800000:1000),inspect:check?(e,w,v)=>inspect(e,w,v,{retained}):null});
 }finally{
  // The browser is already stopped. Drain its lingering HTTP sockets so cleanup
  // cannot hang after all assertions have passed (notably under Node26).
  s.app.closeAllConnections();await new Promise(resolve=>s.app.close(resolve));
 }
}
if(require.main===module)run().catch(()=>{console.error('Static snapshot browser benchmark failed');process.exitCode=1;});
module.exports={run,server,inspect};
