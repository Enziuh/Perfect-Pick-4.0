'use strict';
// No npm dependencies: Chrome DevTools Protocol over Node's built-in WebSocket.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const {STAGE,verify}=require('../tools/security/public-artifact.cjs');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForChromeClose(closed,timeoutMs) {
 let timer;
 try {
  return await Promise.race([
   closed.then(()=>true),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);})
  ]);
 }finally{clearTimeout(timer);}
}
async function stopChrome(child,closed) {
 // Register `closed` immediately after spawn: exitCode stays null after a signal,
 // and `exit` does not guarantee that the child's stdio has closed.
 if(child.exitCode===null && child.signalCode===null) child.kill('SIGTERM');
 if(await waitForChromeClose(closed,5000)) return;
 child.kill('SIGKILL');
 if(!await waitForChromeClose(closed,5000)) throw new Error('Chrome did not close; temporary profile retained.');
}
test('isolated browser: five destinations, eight capabilities, closure privacy, URL, keyboard and responsive layout',{timeout:90000},async()=>{
 verify(STAGE,true);
 const chrome=process.env.CHROME_PATH || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/google-chrome');
 assert(fs.existsSync(chrome),'Required Chrome unavailable; publication BLOCKED');
 let fault='';const external=[],errors=[];
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!['index.html','app.js','preview-data.js','styles.css','config.js','fixtures/preview.json'].includes(name)){res.writeHead(404).end();return;}
  if(name==='fixtures/preview.json'&&fault){res.writeHead(fault==='missing'?404:200,{'Content-Type':'application/json'}).end(fault==='missing'?'':(fault==='malformed'?'{':JSON.stringify({synthetic:false})));return;}
  res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html'});res.end(fs.readFileSync(path.join(STAGE,name)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pp-chrome-'));
 const child=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--disable-default-apps','--disable-extensions','--disable-features=MediaRouter,OptimizationHints','about:blank'],{stdio:['ignore','ignore','pipe']});
 const closed=new Promise(resolve=>child.once('close',resolve));
 let socket,failure;
 try{
  const endpoint=await new Promise((resolve,reject)=>{
   let log='';const timer=setTimeout(()=>reject(new Error('Chrome startup failed; publication BLOCKED')),15000);
   child.on('error',reject);child.stderr.on('data',chunk=>{log+=chunk;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
   child.on('exit',()=>{clearTimeout(timer);reject(new Error('Chrome exited before tests; publication BLOCKED'));});
  });
  socket=new WebSocket(endpoint);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  let seq=0;const callbacks=new Map();
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;callbacks.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  socket.addEventListener('message',({data})=>{
   const m=JSON.parse(data);
   if(m.id){const p=callbacks.get(m.id);callbacks.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result);return;}
   if(m.method==='Fetch.requestPaused'){
    const url=m.params.request.url;
    const local=url.startsWith(origin+'/');
    if(!local)external.push(url);
    send(local?'Fetch.continueRequest':'Fetch.failRequest',local?{requestId:m.params.requestId}:{requestId:m.params.requestId,errorReason:'BlockedByClient'},m.sessionId).catch(e=>errors.push(e.message));
   }
   if(m.method==='Network.requestWillBeSent' && !m.params.request.url.startsWith(origin+'/') && !m.params.request.url.startsWith('about:'))external.push(m.params.request.url);
   if(m.method==='Runtime.exceptionThrown')errors.push('Uncaught browser exception');
  });
  async function page(route=''){
   const {targetId}=await send('Target.createTarget',{url:'about:blank'});
   const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
   await send('Runtime.enable',{},sessionId);await send('Page.enable',{},sessionId);await send('Network.enable',{},sessionId);await send('Fetch.enable',{patterns:[{urlPattern:'*'}]},sessionId);
   const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw new Error('Evaluation failed');return r.result.value;};
   await send('Page.navigate',{url:origin+'/'+route},sessionId);
   return {sessionId,targetId,evaluate};
  }
  async function until(p,expression){for(let i=0;i<100;i++){if(await p.evaluate(expression))return;await pause(50);}throw new Error('Browser expectation timed out: '+expression);}
  const p=await page();await until(p,"document.getElementById('status')?.textContent.startsWith('Synthetic data loaded')");
  const routes=['overview','match-center','standings/weekly','standings/monthly','standings/season','prizes','guide/rules','guide/faq'];
  async function navigate(p,route){
   await p.evaluate(`document.querySelector('a[href="#${route}"]').click()`);
   const [destination,subview]=route.split('/');
   await until(p,`location.hash==='#${route}' && !document.getElementById('${destination}').hidden${subview ? ` && !document.getElementById('${subview}').hidden` : ''}`);
   assert.equal(await p.evaluate('document.querySelectorAll(".destination:not([hidden])").length'),1);
   assert.equal(await p.evaluate('document.querySelectorAll(".primary-nav [aria-current=page]").length'),1);
  }
  assert.equal(await p.evaluate("document.querySelectorAll('.destination').length"),5);
  assert.equal(await p.evaluate("document.querySelectorAll('.legacy-section').length"),8);
  assert.equal(await p.evaluate("document.querySelectorAll('table').length"),6);
  assert(await p.evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return new Set(ids).size===ids.length;})()"));
  assert.equal(await p.evaluate("document.querySelectorAll('#periodCards .period-card').length"),5);
  assert.equal(await p.evaluate("document.querySelectorAll('#weeklyPrizeBody tr').length"),18);
  for(const route of routes){
   await navigate(p,route);
   const target=route.includes('/')?route.split('/')[1]:({'overview':'dashboard','match-center':'picks'}[route]||route);
   assert(await p.evaluate(`document.getElementById('${target}').textContent.trim().length>20`));
  }
  await navigate(p,'standings/monthly');
  await send('Page.reload',{},p.sessionId);
  await until(p,"document.getElementById('status')?.textContent.startsWith('Synthetic data loaded') && !document.getElementById('monthly').hidden && location.hash==='#standings/monthly'");
  const shared=await page('#guide/faq');
  await until(shared,"document.getElementById('status')?.textContent.startsWith('Synthetic data loaded') && !document.getElementById('faq').hidden");
  assert(await shared.evaluate("document.getElementById('faq').querySelectorAll('details').length>=12"));
  await send('Target.closeTarget',{targetId:shared.targetId});
  await navigate(p,'overview');await navigate(p,'prizes');
  await p.evaluate('history.back()');await until(p,"location.hash==='#overview' && !document.getElementById('overview').hidden");
  // Native links support Enter; arrow keys move focus without trapping Tab.
  await p.evaluate("document.querySelector('.primary-nav a').focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39},p.sessionId);
  assert.equal(await p.evaluate('document.activeElement.hash'),'#match-center');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13},p.sessionId);
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13},p.sessionId);
  await until(p,"location.hash==='#match-center' && !document.getElementById('match-center').hidden");
  assert(await p.evaluate("document.activeElement.matches('#match-center .page-header h1')"));
  await p.evaluate("document.querySelector('.primary-nav a').focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9},p.sessionId);
  assert.equal(await p.evaluate('document.activeElement.hash'),'#match-center');
  assert(await p.evaluate("[...document.styleSheets].some(sheet=>[...sheet.cssRules].some(rule=>rule.selectorText?.includes(':focus-visible')))"));
  await p.evaluate("document.querySelector('.skip-link').click()");
  assert.equal(await p.evaluate('document.activeElement.id'),'main-content');
  assert.equal(await p.evaluate('location.hash'),'#match-center');
  for(const width of [375,768,1280]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600},p.sessionId);
   for(const route of routes){
    await navigate(p,route);
    assert(await p.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),`Horizontal page overflow: ${route} at ${width}`);
   }
  }
  await navigate(p,'match-center');
  for(const week of [5,6,7]){
   await p.evaluate(`document.getElementById('weekSelect').value='${week}';document.getElementById('weekSelect').dispatchEvent(new Event('change'))`);
   await until(p,"document.getElementById('pickPercentages').textContent.includes('officially closed')");
   assert.equal(await p.evaluate("document.querySelectorAll('#pickPercentages .vote-option, #playerPicksBody .pick-cell, #playerPickCards .player-pick-card').length"),0);
   assert(!await p.evaluate("/\\d+ submission/.test(document.getElementById('picksSubmissionCount').textContent)"));
  }
  for(const week of [1,2,3,4]){
   await p.evaluate(`document.getElementById('weekSelect').value='${week}';document.getElementById('weekSelect').dispatchEvent(new Event('change'))`);
   await until(p,`document.getElementById('picksSubmissionCount').textContent.includes('for Week ${week}')`);
   assert(await p.evaluate("document.querySelectorAll('#playerPicksBody .pick-cell').length>0"));
   assert(await p.evaluate("document.querySelectorAll('#pickPercentages .vote-option').length>0"));
   assert.equal(await p.evaluate("document.querySelectorAll('#playerPickCards .player-pick-card').length"),4);
   assert.equal(await p.evaluate("document.querySelectorAll('#matchGameResults .team-result-score').length"),4);
   if(week===4){
    assert.equal(await p.evaluate("document.querySelectorAll('#playerPickCards .player-prediction').length"),4);
    assert(await p.evaluate("document.getElementById('pickPercentages').textContent.includes('TIEBREAKER TRANSPARENCY')"));
   }
  }
  await p.evaluate("document.getElementById('weekSelect').value='5';document.getElementById('weekSelect').dispatchEvent(new Event('change'))");
  await until(p,"document.getElementById('picksSubmissionCount').textContent==='Synthetic entry status: OPEN'");
  assert.equal(await p.evaluate("document.querySelectorAll('#pickPercentages .vote-option, #playerPicksBody .pick-cell, #playerPickCards .player-pick-card').length"),0);
  await navigate(p,'standings/weekly');
  await p.evaluate("document.getElementById('weeklyWeekSelect').value='1';document.getElementById('weeklyWeekSelect').dispatchEvent(new Event('change'))");
  await until(p,"document.getElementById('weeklyStandingsBody').textContent.includes('Synthetic')");
  assert(await p.evaluate("document.querySelectorAll('#weeklyGameResults .team-result-score').length===4"));
  assert.equal(await p.evaluate("document.querySelector('#weeklyStandingsBody .accuracy-indicator').textContent"),'100%');
  await p.evaluate("document.getElementById('weeklyWeekSelect').value='3';document.getElementById('weeklyWeekSelect').dispatchEvent(new Event('change'))");
  await until(p,"document.getElementById('weeklyTitle').textContent.includes('Week 3')");
  assert.equal(await p.evaluate("document.querySelector('#weeklyStandingsBody .accuracy-indicator').textContent"),'—');
  await navigate(p,'standings/monthly');
  await p.evaluate("document.getElementById('monthlyPeriodSelect').value='M1';document.getElementById('monthlyPeriodSelect').dispatchEvent(new Event('change'))");
  await until(p,"document.getElementById('monthlyStandingsBody').textContent.includes('Synthetic')");
  assert.equal(await p.evaluate("document.querySelector('#monthlyStandingsBody .accuracy-indicator').textContent"),'50%');
  await navigate(p,'standings/season');
  assert.equal(await p.evaluate("document.querySelector('#seasonStandingsBody .accuracy-indicator').textContent"),'50%');
  assert(await p.evaluate("document.getElementById('championSummary').textContent.includes('No prize has been awarded')"));
  if(process.env.PP_SCREENSHOT_DIR){
   fs.mkdirSync(process.env.PP_SCREENSHOT_DIR,{recursive:true});
   for(const width of [375,1280]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600},p.sessionId);
    for(const route of ['overview','match-center']){
     await navigate(p,route);await p.evaluate('scrollTo(0,0)');
     const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},p.sessionId);
     fs.writeFileSync(path.join(process.env.PP_SCREENSHOT_DIR,`${route}-${width}.png`),Buffer.from(shot.data,'base64'));
    }
   }
  }
  for(const mode of ['missing','invalid','malformed']){
   fault=mode;const broken=await page();await until(broken,"document.getElementById('status')?.textContent.includes('Synthetic preview unavailable')");
   assert(await broken.evaluate("document.getElementById('dashboard').textContent.includes('No external connection attempted')"));
   await navigate(broken,'guide/faq');
   assert(await broken.evaluate("document.getElementById('faq').querySelectorAll('details').length>=12"));
   await send('Target.closeTarget',{targetId:broken.targetId});
  }
  assert.deepEqual(external,[],'External request attempted');assert.deepEqual(errors,[]);
 }catch(error){failure=error;
 }finally{
  const cleanupErrors=[];
  try{if(socket)socket.close();}catch(error){cleanupErrors.push(error);}
  let chromeClosed=false;
  try{await stopChrome(child,closed);chromeClosed=true;}catch(error){cleanupErrors.push(error);}
  try{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}catch(error){cleanupErrors.push(error);}
  if(chromeClosed){
   try{
    // Chrome helpers can briefly finish profile writes after the parent closes.
    // Retry only Node's transient recursive-removal errors; exhaustion still fails.
    await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
   }catch(error){cleanupErrors.push(error);}
  }
  if(cleanupErrors.length) throw new AggregateError(failure?[failure,...cleanupErrors]:cleanupErrors,
   failure?'Browser assertions failed; cleanup also failed.':'Browser cleanup failed.',failure?{cause:failure}:undefined);
  if(failure) throw failure;
 }
});
