'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {assets}=require('../tools/snapshots/local-preview.cjs'),{profile}=require('../tools/performance/browser-profile.cjs'),accuracy=require('../tools/scoring/roster-accuracy.cjs');
test('derived accuracy browser: standings, overview, player cards, matrix, fairness notice and responsive layout',{timeout:180000},async()=>{
 const file=require('./support/accuracy-history.cjs').historical();file.payload.snapshot.accuracy=accuracy.create(file.payload.snapshot,file.payload.aliases);
 const files=assets(file),dir=fs.mkdtempSync(path.join(os.tmpdir(),'pp-accuracy-browser-'));
 const app=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.replace('/Perfect-Pick-4.0/','')||'index.html';if(!Object.hasOwn(files,name))return res.writeHead(404).end();res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':'text/html');res.end(files[name]);});
 await new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',resolve);});
 try{await profile({url:'http://127.0.0.1:'+app.address().port+'/Perfect-Pick-4.0/',output:path.join(dir,'report.json'),widths:[360,390,430,768,1440],clockAt:Date.parse(file.capturedAt)+1000,inspect:async(evaluate,width,sample)=>{
  assert.equal(sample.apiRequests,0);assert.equal(sample.runtimeErrors,0);assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  assert(await evaluate("!document.getElementById('lateFairnessHeading').parentElement.hidden"));
  assert(await evaluate("document.getElementById('lateFairnessHeading').parentElement.textContent.includes('that game earns zero points')"));
  assert(await evaluate("document.querySelector('#overviewLeaderCards .overview-leader-card,.overview-leader-grid .leader-card')!==null"));
  await evaluate(`new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Week9 not ready')),10000);const o=new MutationObserver(()=>{if(document.getElementById('picksSubmissionCount').textContent.includes('for Week 9')){o.disconnect();clearTimeout(t);resolve(true);}});o.observe(document,{subtree:true,childList:true,characterData:true});document.getElementById('weekSelect').value='9';document.getElementById('weekSelect').dispatchEvent(new Event('change'));})`);
  await evaluate("document.getElementById('playerSelect').value=[...document.getElementById('playerSelect').options].find(o=>o.textContent==='Isaias').value;document.getElementById('playerSelect').dispatchEvent(new Event('change'));");
  assert(await evaluate("document.getElementById('playerPickCards').textContent.includes('85.7%')"));
  await evaluate(`new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Matrix not ready')),10000),o=new MutationObserver(check);function check(){if([...document.querySelectorAll('#playerPicksBody tr')].some(r=>r.textContent.includes('Isaias'))){o.disconnect();clearTimeout(t);resolve(true);}}o.observe(document,{subtree:true,childList:true});document.getElementById('pickMatrix').open=true;check();})`);
  assert(await evaluate("[...document.querySelectorAll('#playerPicksBody tr')].find(r=>r.querySelector('th')?.textContent.includes('Isaias')).textContent.includes('85.7%')"));
  await evaluate(`new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Season not ready')),10000),o=new MutationObserver(check);function check(){if(document.getElementById('seasonStandingsBody').textContent.includes('Isaias')){o.disconnect();clearTimeout(t);resolve(true);}}o.observe(document,{subtree:true,childList:true});location.hash='#standings/season';check();})`);
  assert(await evaluate("[...document.querySelectorAll('#seasonStandingsBody tr')].find(r=>r.textContent.includes('Isaias')).textContent.includes('59.4%')"));
  assert(await evaluate("[...document.querySelectorAll('.accuracy-indicator')].every(n=>n.title==='Correct picks divided by all FINAL competition games')"));
 }});}finally{app.closeAllConnections();await new Promise(r=>app.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
