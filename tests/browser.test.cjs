'use strict';
// No npm dependencies: Chrome DevTools Protocol over Node's built-in WebSocket.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const {STAGE,verify}=require('../tools/security/public-artifact.cjs');
const {createScenario}=require('./support/monthly-scenarios.cjs');
const presentation=require('../tools/presentation/package.cjs');
const apiPages=require('../tools/api/pages-artifact.cjs');
const {example:legacyApiExample}=require('./support/pp3-api-example.cjs');
const apiEndpoint='https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec';
const {liveSheetExample}=require('./support/live-sheet-example.cjs');
const {createSheetDashboard}=require('../tools/presentation/sheet-dashboard.cjs');
const {dashboardScenario}=require('./support/dashboard-scenarios.cjs');
const {createMatchScenario}=require('./support/match-scenarios.cjs');
const {validate}=require(path.join(STAGE,'preview-data.js'));
const scenarioBase=JSON.parse(fs.readFileSync(path.join(STAGE,'fixtures/preview.json'),'utf8'));
const invalidPredictionScenario=createScenario('decisive',scenarioBase);
invalidPredictionScenario.weeks[3].standings[0].tiebreakPrediction='invalid';
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
 let fault='',scenario='',privateAssets=null,apiReply=null;const external=[],errors=[],apiRequests=[];
 const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!['index.html','app.js','preview-data.js','styles.css','config.js','fixtures/preview.json'].includes(name)){res.writeHead(404).end();return;}
  if(privateAssets){if(!Object.hasOwn(privateAssets,name)){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html'}).end(privateAssets[name]);return;}
  if(name==='fixtures/preview.json'&&scenario){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(validate(scenario.startsWith('match:')?createMatchScenario(scenario.slice(6),scenarioBase):createScenario(scenario,scenarioBase))));return;}
  if(name==='fixtures/preview.json'&&fault){res.writeHead(fault==='missing'?404:200,{'Content-Type':'application/json'}).end(fault==='missing'?'':(fault==='malformed'?'{':JSON.stringify(fault==='invalid-prediction'?invalidPredictionScenario:{synthetic:false})));return;}
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
    if(apiReply&&url===apiEndpoint+'?action=dashboard4'){
     apiRequests.push(url);send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origin}],body:Buffer.from(JSON.stringify(apiReply)).toString('base64')},m.sessionId).catch(e=>errors.push(e.message));return;
    }
    const local=url.startsWith(origin+'/');
    if(!local)external.push(url);
    send(local?'Fetch.continueRequest':'Fetch.failRequest',local?{requestId:m.params.requestId}:{requestId:m.params.requestId,errorReason:'BlockedByClient'},m.sessionId).catch(e=>errors.push(e.message));
   }
   if(m.method==='Network.requestWillBeSent' && !m.params.request.url.startsWith(origin+'/') && !m.params.request.url.startsWith('about:') && !(apiReply&&m.params.request.url===apiEndpoint+'?action=dashboard4'))external.push(m.params.request.url);
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
  assert(await p.evaluate("document.getElementById('submitPicks').disabled && !document.getElementById('submitPicks').hasAttribute('href')"));
  assert(await p.evaluate("document.getElementById('dashboardResultsWeek').textContent.includes('Recent finals')"));
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
  assert(await p.evaluate("document.getElementById('prizeSummary').textContent.includes('Payment status unavailable')"));
  assert(await p.evaluate("document.querySelector('#weeklyPrizeBody tr').textContent.includes('Allocation each: $10.00')"));
  assert(await p.evaluate("document.querySelectorAll('#weeklyPrizeBody tr')[1].textContent.includes('ROLLOVER CONFIRMED')"));
  assert(await p.evaluate("document.querySelectorAll('#weeklyPrizeBody tr')[4].textContent.includes('PROJECTED')"));
  assert(await p.evaluate("document.getElementById('overviewProgress').textContent.includes('0 of 2 games FINAL')"));

  for(const route of routes){
   await navigate(p,route);
   const target=route.includes('/')?route.split('/')[1]:({'overview':'dashboard','match-center':'picks'}[route]||route);
   assert(await p.evaluate(`document.getElementById('${target}').textContent.trim().length>20`));
  }
  await p.evaluate("document.querySelector('[data-prize-period=\"M1\"]').click()");
  await until(p,"document.getElementById('monthlyPeriodSelect').value==='M1' && location.hash==='#standings/monthly'");
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
    assert(await p.evaluate(`document.documentElement.scrollWidth <= ${width} + 1 && innerWidth <= ${width} + 1`),`Horizontal page overflow: ${route} at ${width}`);
   }
  }
  await navigate(p,'match-center');
  for(const week of [5,6,7]){
   await p.evaluate(`document.getElementById('weekSelect').value='${week}';document.getElementById('weekSelect').dispatchEvent(new Event('change'))`);
   await until(p,"document.getElementById('pickPercentages').textContent.includes('officially closed')");
   assert.equal(await p.evaluate("document.querySelectorAll('#pickPercentages .vote-option, #playerPicksBody .pick-cell, #playerPickCards .player-pick-card').length"),0);
   assert(!await p.evaluate("/\\d+ submission/.test(document.getElementById('picksSubmissionCount').textContent)"));
   assert(await p.evaluate("document.getElementById('playerSelect').disabled && document.getElementById('playerSelect').options.length===1"));
   assert.equal(await p.evaluate("document.querySelectorAll('#picks .vote-bar, #picks .player-prediction, #picks .match-comparison').length"),0);
   assert(!await p.evaluate("document.getElementById('picks').innerHTML.includes('Synthetic Comet')"));
  }
  for(const week of [1,2,3,4]){
   await p.evaluate(`document.getElementById('weekSelect').value='${week}';document.getElementById('weekSelect').dispatchEvent(new Event('change'))`);
   await until(p,`document.getElementById('picksSubmissionCount').textContent.includes('for Week ${week}')`);
   assert(await p.evaluate("document.querySelectorAll('#playerPicksBody .pick-cell').length>0"));
   assert(await p.evaluate("document.querySelectorAll('#pickPercentages .vote-option').length>0"));
   assert.equal(await p.evaluate("document.querySelectorAll('#playerPickCards .player-pick-card').length"),4);
   assert.equal(await p.evaluate("document.querySelectorAll('#matchGameResults .team-result-score').length"),4);
   if(week===1){
    assert(await p.evaluate("document.querySelectorAll('#playerPickCards .selection-choice.correct').length>0 && document.querySelectorAll('#playerPickCards .selection-choice.wrong').length>0"));
    assert(await p.evaluate("document.querySelector('#matchGameResults .vote-bar').getAttribute('aria-label').includes('Bears: 50%')"));
   }
   if(week===3)assert.equal(await p.evaluate("document.querySelectorAll('#playerPickCards .correct, #playerPickCards .wrong, #playerPicksBody .correct, #playerPicksBody .wrong').length"),0);
   if(week===4){
    assert.equal(await p.evaluate("document.querySelectorAll('#playerPickCards .player-prediction').length"),4);
    assert(await p.evaluate("document.querySelector('#playerPickCards .player-prediction').textContent.includes('40 combined points')"));
    assert(!await p.evaluate("document.getElementById('pickPercentages').textContent.includes('TIEBREAKER TRANSPARENCY')"));
   }
  }
  await p.evaluate("document.getElementById('playerSelect').value='Synthetic Comet';document.getElementById('playerSelect').dispatchEvent(new Event('change'))");
  assert.equal(await p.evaluate("document.querySelectorAll('#playerPickCards .player-pick-card').length"),1);
  assert(await p.evaluate("document.querySelector('#playerPickCards .player-pick-card').open"));
  await p.evaluate("document.getElementById('matchSelect').value='Bears vs Lions';document.getElementById('matchSelect').dispatchEvent(new Event('change'))");
  assert.equal(await p.evaluate("document.querySelectorAll('#matchGameResults .game-result-card').length"),1);
  await p.evaluate("document.querySelector('#matchGameResults .match-comparison summary').click()");
  assert(await p.evaluate("document.querySelector('#matchGameResults .match-comparison').open"));
  assert.equal(await p.evaluate("document.querySelectorAll('#matchGameResults .match-comparison li').length"),4);
  await p.evaluate("document.getElementById('weekSelect').value='1';document.getElementById('weekSelect').dispatchEvent(new Event('change'))");
  await until(p,"document.getElementById('picksSubmissionCount').textContent.includes('for Week 1')");
  assert(await p.evaluate("document.getElementById('previousWeek').disabled"));
  await p.evaluate("document.getElementById('nextWeek').click()");
  await until(p,"document.getElementById('picksSubmissionCount').textContent.includes('for Week 2')");
  await p.evaluate("document.getElementById('previousWeek').click()");
  await until(p,"document.getElementById('picksSubmissionCount').textContent.includes('for Week 1')");
  await p.evaluate("document.getElementById('weekSelect').value='5';document.getElementById('weekSelect').dispatchEvent(new Event('change'))");
  await until(p,"document.getElementById('picksSubmissionCount').textContent==='Synthetic entry status: OPEN'");
  assert.equal(await p.evaluate("document.querySelectorAll('#pickPercentages .vote-option, #playerPicksBody .pick-cell, #playerPickCards .player-pick-card').length"),0);
  assert(await p.evaluate("document.querySelector('#matchGameResults .kickoff-note').textContent.includes('Synthetic kickoff')"));
  assert(await p.evaluate("document.querySelectorAll('#matchGameResults .kickoff-note')[1].textContent.includes('unavailable')"));
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
    for(const route of ['overview','match-center','prizes']){
     await navigate(p,route);await p.evaluate('scrollTo(0,0)');
     const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},p.sessionId);
     fs.writeFileSync(path.join(process.env.PP_SCREENSHOT_DIR,`${route}-${width}.png`),Buffer.from(shot.data,'base64'));
    }
   }
  }
  for(const name of ['zero-votes','one-sided','pending-scores']){
   scenario='match:'+name;const example=await page('#match-center');
   await until(example,"document.getElementById('status')?.textContent.startsWith('Synthetic data loaded')");
   const week=name==='pending-scores'?3:1;
   await example.evaluate(`document.getElementById('weekSelect').value='${week}';document.getElementById('weekSelect').dispatchEvent(new Event('change'))`);
   await until(example,`document.getElementById('picksSubmissionCount').textContent.includes('for Week ${week}')`);
   assert.equal(await example.evaluate("document.querySelectorAll('#matchGameResults .game-result-card:first-of-type .vote-option').length"),2);
   assert(!await example.evaluate("/NaN|undefined|Infinity/.test(document.getElementById('picks').textContent)"));
   if(name==='zero-votes'){
    assert(await example.evaluate("document.querySelector('#matchGameResults .game-result-card').textContent.includes('No valid votes yet')"));
    assert.deepEqual(await example.evaluate("[...document.querySelectorAll('#matchGameResults .game-result-card:first-of-type .vote-share')].map(el=>el.textContent.trim())"),['0% · 0 votes','0% · 0 votes']);
   }
   if(name==='one-sided'){
    assert(await example.evaluate("document.querySelector('#matchGameResults .vote-winner').textContent.includes('Bears') && document.querySelector('#matchGameResults .vote-winner').textContent.includes('0%')"));
    assert(await example.evaluate("document.querySelector('#matchGameResults .vote-popular').parentElement.textContent.includes('Lions')"));
   }
   if(name==='pending-scores'){
    assert.equal(await example.evaluate("document.querySelectorAll('#picks .team-winner, #playerPickCards .correct, #playerPickCards .wrong, #playerPicksBody .correct, #playerPicksBody .wrong').length"),0);
    assert(await example.evaluate("document.querySelector('#matchGameResults .game-result-card').textContent.includes('Scores provisional')"));
   }
   await example.evaluate("document.getElementById('playerSelect').value='Synthetic Comet';document.getElementById('playerSelect').dispatchEvent(new Event('change'));document.querySelector('#matchGameResults .match-comparison summary').click()");
   assert(await example.evaluate("document.querySelector('#playerPickCards .player-pick-card').open"));
   for(const width of [375,768,1280]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600},example.sessionId);
    assert(await example.evaluate(`document.documentElement.scrollWidth<=${width}+1 && innerWidth<=${width}+1`),`${name} at ${width}`);
    if(process.env.PP_SCREENSHOT_DIR && width!==768){
     await example.evaluate("document.getElementById('matchGameResults').scrollIntoView()");
     const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},example.sessionId);
     fs.writeFileSync(path.join(process.env.PP_SCREENSHOT_DIR,`${name}-match-${width}.png`),Buffer.from(shot.data,'base64'));
     if(width===375){
      await example.evaluate("document.getElementById('playerPickCards').scrollIntoView()");
      const playerShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},example.sessionId);
      fs.writeFileSync(path.join(process.env.PP_SCREENSHOT_DIR,`${name}-player-${width}.png`),Buffer.from(playerShot.data,'base64'));
     }
    }
   }
   await send('Target.closeTarget',{targetId:example.targetId});
  }
  // These explicitly named, test-only response scenarios never modify the public fixture.
  for(const [name,state,winner] of [
   ['in-progress','IN PROGRESS',''],['clear-leader','MONTHLY CHAMPION','Synthetic Comet'],
   ['decisive','MONTHLY CHAMPION','Synthetic Comet'],['equal-distance','UNRESOLVED TIE',''],
   ['no-eligible','NO ELIGIBLE TIEBREAKER',''],['awaiting-score','AWAITING FINAL SCORE',''],
   ['zero-completed','IN PROGRESS',''],['not-closed','IN PROGRESS',''],
   ['one-eligible','MONTHLY CHAMPION','Synthetic Comet'],['zero-prediction','MONTHLY CHAMPION','Synthetic Comet']
  ]){
   scenario=name;const example=await page('#standings/monthly');
   await until(example,"document.getElementById('status')?.textContent.startsWith('Synthetic data loaded')");
   await example.evaluate("document.getElementById('monthlyPeriodSelect').value='M1';document.getElementById('monthlyPeriodSelect').dispatchEvent(new Event('change'))");
   await until(example,`document.getElementById('monthlyPrizeCallout').dataset.state==='${state}' && document.getElementById('monthlyTitle').textContent==='Month 1 Standings'`);
   assert.equal(await example.evaluate("document.getElementById('monthlyPrizeCallout').dataset.winner"),winner,name);
   assert.equal(await example.evaluate("document.getElementById('championState').textContent"),state,name);
   assert.equal(await example.evaluate("document.getElementById('championHeading').dataset.winner"),winner,name);
   assert.equal(await example.evaluate("document.querySelector('#periodCards .period-card').dataset.status"),state,name);
   assert.equal(await example.evaluate("document.querySelector('#periodCards .period-card').dataset.winner"),winner,name);
   assert(await example.evaluate("document.querySelector('#periodCards .period-card').textContent.includes('Payment status unavailable')"));

   assert.equal(await example.evaluate("document.querySelector('#monthlyStandingsBody tr').children.length"),5);
   if(name==='decisive'){
    const text=await example.evaluate("document.getElementById('monthlyPrizeCallout').textContent");
    for(const fragment of ['FINAL combined score: 38','off by 2','prediction: 4 points','Winning prediction','40','44'])assert(text.includes(fragment),fragment);
    assert.equal(await example.evaluate("document.querySelectorAll('#monthlyStandingsBody .rank-first').length"),2);
    assert.equal(await example.evaluate("document.querySelectorAll('#monthlyStandingsBody .is-champion').length"),1);
   }
   if(name==='decisive'){
    await navigate(example,'match-center');
    await example.evaluate("document.getElementById('weekSelect').value='4';document.getElementById('weekSelect').dispatchEvent(new Event('change'))");
    await until(example,"document.getElementById('picksSubmissionCount').textContent.includes('for Week 4')");
    await example.evaluate("document.getElementById('playerSelect').value='Synthetic Comet';document.getElementById('playerSelect').dispatchEvent(new Event('change'))");
    assert(await example.evaluate("document.querySelector('#playerPickCards .player-prediction').textContent.includes('Actual FINAL combined score: 38. Off by 2.')"));
    await navigate(example,'standings/monthly');
   }
   if(name==='equal-distance'){
    assert.equal(await example.evaluate("document.querySelectorAll('#monthlyStandingsBody .is-unresolved').length"),2);
    assert.equal(await example.evaluate("document.querySelectorAll('#monthlyStandingsBody .is-champion').length"),0);
   }
   if(['awaiting-score','not-closed','in-progress','zero-completed'].includes(name))assert.equal(await example.evaluate("document.querySelectorAll('#monthlyPrizeCallout .champion-comparison').length"),0);
   if(name==='not-closed')assert(!await example.evaluate("/Winning prediction|combined points/.test(document.getElementById('monthlyPrizeCallout').textContent)"));
   if(name==='zero-completed')assert.equal(await example.evaluate("document.querySelector('#monthlyStandingsBody .accuracy-indicator').textContent"),'—');
   for(const width of [375,768,1280]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600},example.sessionId);
    for(const route of ['standings/monthly','overview']){
     await navigate(example,route);
     assert(await example.evaluate(`document.documentElement.scrollWidth <= ${width} + 1 && innerWidth <= ${width} + 1`),`${name} at ${width}`);
     if(process.env.PP_SCREENSHOT_DIR && ['decisive','equal-distance'].includes(name) && width!==768){
      await example.evaluate('scrollTo(0,0)');
      const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},example.sessionId);
      fs.writeFileSync(path.join(process.env.PP_SCREENSHOT_DIR,`${name}-${route.replace('/','-')}-${width}.png`),Buffer.from(shot.data,'base64'));
     }
    }
   }
   // Changing back to an unfinished period must clear the previous champion everywhere.
   await navigate(example,'standings/monthly');
   await example.evaluate("document.getElementById('monthlyPeriodSelect').value='M2';document.getElementById('monthlyPeriodSelect').dispatchEvent(new Event('change'))");
   await until(example,"document.getElementById('monthlyPrizeCallout').dataset.state==='IN PROGRESS'");
   assert.equal(await example.evaluate("document.getElementById('championHeading').dataset.winner"),'');
   assert.equal(await example.evaluate("document.querySelectorAll('#monthlyStandingsBody .is-champion').length"),0);
   await send('Target.closeTarget',{targetId:example.targetId});
  }
  scenario='';
  for(const name of ['decisive','missing-alias','unknown']){
   privateAssets=dashboardScenario(name);const owner=await page('#overview');
   await until(owner,"document.getElementById('status')?.textContent.startsWith('Owner verification data loaded')");
   assert(await owner.evaluate("document.querySelector('.preview-label').textContent.includes('Owner Verification')"));
   assert(await owner.evaluate("document.getElementById('submitPicks').disabled"));
   for(const route of ['overview','match-center','standings/weekly','standings/monthly','standings/season','prizes']){
    await navigate(owner,route);for(const width of [375,768,1280]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600},owner.sessionId);assert(await owner.evaluate(`document.documentElement.scrollWidth<=${width}+1`));}
   }
   await navigate(owner,'match-center');
   if(name==='decisive'){
    assert(await owner.evaluate("document.getElementById('championHeading').textContent.includes('Approved Atlas')"));
    assert(await owner.evaluate("document.querySelectorAll('#pickPercentages .vote-option').length>0"));
    assert(await owner.evaluate("document.getElementById('playerPickCards').textContent.includes('Approved Cedar')"));
   }else{
    assert.equal(await owner.evaluate("document.querySelectorAll('#pickPercentages .vote-option, #playerPickCards .player-pick-card, #playerPicksBody .pick-cell').length"),0);
    assert(await owner.evaluate("document.getElementById('picksSubmissionCount').textContent.includes('unavailable')"));
    assert(!await owner.evaluate("document.getElementById('picks').textContent.includes('0 votes') || document.getElementById('picks').textContent.includes('0 submission')"));
   }
   if(name==='decisive'){await send('Emulation.setVirtualTimePolicy',{policy:'advance',budget:310000},owner.sessionId);await until(owner,"document.getElementById('status').textContent.includes('snapshot expired')");await send('Emulation.setVirtualTimePolicy',{policy:'advance'},owner.sessionId);await navigate(owner,'guide/faq');await navigate(owner,'match-center');assert.equal(await owner.evaluate("document.querySelectorAll('#picks .vote-option, #picks .player-pick-card').length"),0);}
   await send('Target.closeTarget',{targetId:owner.targetId});privateAssets=null;
  }
  {
   const live=liveSheetExample(),now=Date.now(),at=new Date(now).toISOString(),untilTime=new Date(now+300000).toISOString();live.policy.now=now;live.cfg.authority=live.authority;
   live.authority.capture.observedAt=at;live.authority.capture.validUntil=untilTime;live.authority.closures.forEach(c=>{c.checkedAt=at;c.validUntil=untilTime;});for(const d of live.authority.decisions.values())d.verifiedAt=at;for(const a of live.authority.accounting.values())a.verifiedAt=at;for(const r of live.matrix.Responses.slice(1))r[0]=at;
   const read=createSheetDashboard(()=>live.cfg,()=>live.sheets,Date.now),first=read();assert.equal(first.state,'READY');
   const stub=`<script>window.__viewErrors=[];console.error=(e)=>window.__viewErrors.push(e.stack||String(e));window.__rpcCalls=0;window.__rpcFail=false;window.__rpcReply=${JSON.stringify(first).replace(/</g,'\\u003c')};window.google={script:{get run(){let ok,bad;return {withSuccessHandler(f){ok=f;return this},withFailureHandler(f){bad=f;return this},getPerfectPickDashboard(){window.__rpcCalls++;setTimeout(()=>window.__rpcFail?bad(Error('PRIVATE_RPC_DETAIL')):ok(window.__rpcReply),0)}}}}};</script>`;
   privateAssets={'index.html':presentation.renderHtml().replace('<script>('+require('../tools/presentation/live-client.js').startLiveClient.toString(),stub+'<script>('+require('../tools/presentation/live-client.js').startLiveClient.toString())};
   const connected=await page('#match-center');await until(connected,"document.getElementById('status').textContent.startsWith('Competition data loaded')");assert.equal(await connected.evaluate('window.__rpcCalls'),1);
   assert.equal(await connected.evaluate("document.querySelectorAll('#playerPickCards .player-pick-card').length"),2);assert(await connected.evaluate("document.getElementById('championHeading').textContent.includes('Synthetic Comet')"));
   for(const width of [375,768,1280]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600},connected.sessionId);for(const route of ['overview','match-center','standings/weekly','standings/monthly','standings/season','prizes','guide/faq']){await navigate(connected,route);assert(await connected.evaluate(`document.documentElement.scrollWidth<=${width}+1`));}}
   live.matrix.Results[1][6]='24';const updated=read();assert.equal(updated.state,'READY');await connected.evaluate('window.__rpcReply='+JSON.stringify(updated));await connected.evaluate("document.getElementById('refreshResults').click()");await until(connected,'window.__rpcCalls===2');await until(connected,"document.getElementById('status').textContent.startsWith('Competition data loaded')");
   await navigate(connected,'match-center');await connected.evaluate("document.getElementById('weekSelect').value='1';document.getElementById('weekSelect').dispatchEvent(new Event('change'))");await until(connected,"document.getElementById('picksSubmissionCount').textContent.includes('for Week 1')");assert(await connected.evaluate("document.getElementById('matchGameResults').textContent.includes('24')"));
   await connected.evaluate("window.__rpcFail=true;document.getElementById('refreshResults').click()");await until(connected,"document.getElementById('status').textContent.includes('unavailable')");assert.equal(await connected.evaluate("document.querySelectorAll('#picks .player-pick-card, #picks .vote-option').length"),0);assert.equal(await connected.evaluate("document.querySelectorAll('[data-winner]').length"),0);assert(!await connected.evaluate("document.getElementById('main-content').textContent.includes('PRIVATE_RPC_DETAIL')"));
   await connected.evaluate("window.__rpcFail=false;document.getElementById('refreshResults').click()");try{await until(connected,"document.getElementById('status').textContent.startsWith('Competition data loaded')");}catch(e){throw Error(e.message+' state='+await connected.evaluate("JSON.stringify({errors:window.__viewErrors,calls:window.__rpcCalls,status:document.getElementById('status').textContent})"));}assert.equal(await connected.evaluate("document.querySelectorAll('#playerPickCards .player-pick-card').length"),2);
   await send('Target.closeTarget',{targetId:connected.targetId});privateAssets=null;
  }
  {
   const api=legacyApiExample();api.e.policy.now=Date.now();const at=new Date(api.e.policy.now).toISOString(),expires=new Date(api.e.policy.now+120000).toISOString();
   api.cfg.authority=api.e.authority;api.e.authority.closures.forEach(c=>{c.checkedAt=at;c.validUntil=expires;});for(const d of api.e.authority.decisions.values())d.verifiedAt=at;for(const a of api.e.authority.accounting.values())a.verifiedAt=at;
   api.matrix.Responses.slice(1).forEach(r=>r[0]=at);apiReply=api.get();assert.equal(apiReply.schema,'PP4_JSON_V1');
   privateAssets=apiPages.render({endpoint:apiEndpoint,publicationApproved:true});const connected=await page('#match-center');
   await until(connected,"document.getElementById('status').textContent.startsWith('Competition data loaded')");assert.equal(apiRequests.length,1);
   assert(await connected.evaluate("document.getElementById('championHeading').textContent.includes('Avery A.')"));
   assert.equal(await connected.evaluate("document.querySelectorAll('#playerPickCards .player-pick-card').length"),2);
   assert(await connected.evaluate("[...document.querySelectorAll('.accuracy-indicator')].every(e=>e.title.includes('submitted picks with FINAL results'))"));
   assert(await connected.evaluate("(()=>{const e=document.querySelector('#playerPickCards .selection-choice.wrong');return e && getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)' && e.textContent.includes('Incorrect');})()"));
   for(const width of [375,768,1280]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600},connected.sessionId);for(const route of ['overview','match-center','standings/weekly','standings/monthly','standings/season','prizes','guide/rules']){await navigate(connected,route);assert(await connected.evaluate(`document.documentElement.scrollWidth<=${width}+1`));}}
   api.cfg.authority=null;apiReply=api.get();await connected.evaluate("document.getElementById('refreshResults').click()");await until(connected,"document.getElementById('status').textContent.startsWith('Competition data loaded') && document.querySelectorAll('#playerPickCards .player-pick-card').length===0");
   await navigate(connected,'match-center');assert.equal(await connected.evaluate("document.querySelectorAll('#picks .vote-option').length"),0);assert(!await connected.evaluate("document.getElementById('main-content').textContent.includes('Avery A.')"));assert.equal(apiRequests.length,2);
   await send('Target.closeTarget',{targetId:connected.targetId});privateAssets=null;apiReply=null;
  }
  for(const mode of ['missing','invalid','malformed','invalid-prediction']){
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
