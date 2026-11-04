'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {liveSheetExample}=require('./support/live-sheet-example.cjs');
const {createSheetDashboard}=require('../tools/presentation/sheet-dashboard.cjs');
const pkg=require('../tools/presentation/package.cjs');
const service=e=>createSheetDashboard(()=>e.cfg,()=>e.sheets,()=>e.policy.now);
test('fresh Results feed existing Match Center without closure/aliases; private scopes withheld',()=>{
 const e=liveSheetExample(),reply=service(e)();assert.equal(reply.state,'READY');const m=reply.model;assert.equal(m.prizes.activeWeek,2);assert.equal(m.weeks.length,2);assert.equal(m.matchViews[1]['Bears vs Lions'].scores[0],'20');assert.equal(m.matchViews[1]['Bears vs Lions'].winner,'Bears');assert.equal(m.matchViews[1]['Bears vs Lions'].votes,null);assert.equal(m.weeks[0].visibility,'WITHHELD');assert.equal(m.prizes.overallStandings.length,0);assert.equal(m.prizes.currentWeeklyPot,null);assert(e.calls.every(c=>c.ranges.every(r=>!r.includes('Responses')&&!r.includes('Players')&&!r.includes('Ledger'))));assert(!JSON.stringify(reply).includes('PRIVATE_'));assert(!JSON.stringify(reply).includes('FABRICATED_TARGET'));assert.deepEqual(e.denied.attempts,[]);
});
test('persistent service reads current 3.0 updates every request and changes revision-derived view without writers',()=>{
 const e=liveSheetExample(),get=service(e);const a=get();e.matrix.Results[1][6]='24';const b=get();assert.equal(a.model.matchViews[1]['Bears vs Lions'].scores[0],'20');assert.equal(b.model.matchViews[1]['Bears vs Lions'].scores[0],'24');assert.deepEqual(e.denied.attempts,[]);
});
test('independent CLOSED/alias/capture evidence enables picks, all rankings and shared monthly resolution',()=>{
 const e=liveSheetExample();e.cfg.authority=e.authority;const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.weeks[0].visibility,'AVAILABLE');assert.equal(r.model.weeks[0].standings.length,2);assert.equal(r.model.matchViews[1]['Bears vs Lions'].votes.total,2);assert.equal(r.model.resolutions.M1.winner,'Synthetic Comet');assert.equal(r.model.prizes.overallStandings.length,2);assert.equal(r.model.prizes.currentWeeklyPot,10);assert.equal(r.model.prizeViews[2].payment,'Payment status unavailable');assert(e.calls.every(c=>c.ranges.every(r=>!r.startsWith("'Responses'!B")&&!r.includes('Players')&&!r.includes('Ledger'))));assert(!JSON.stringify(r).includes('PRIVATE_'));assert.deepEqual(e.denied.attempts,[]);
});
test('unknown/revoked/stale/missing evidence cannot expose player records, predictions or zero-vote claims',()=>{
 for(const mutate of [e=>e.cfg.authority.closures=[],e=>e.cfg.authority.aliases=[],e=>e.cfg.authority.closures[0].status='UNKNOWN',e=>e.cfg.authority.capture.validUntil=e.cfg.authority.capture.observedAt,e=>e.cfg.authority.aliases[0].approved=false]){
  const e=liveSheetExample();e.cfg.authority=structuredClone(e.authority);mutate(e);const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.weeks[0].visibility,'WITHHELD');assert.equal(r.model.matchViews[1]['Bears vs Lions'].votes,null);assert.deepEqual(r.model.weeks[0].standings,[]);
 }
});
test('current Form Control CLOSED flag and expired deadline alone never authorize disclosure',()=>{
 const e=liveSheetExample();e.matrix['Form Control'][1][4]='2020-01-01T00:00:00.000Z';const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.weeks[1].entriesStatus,'UNKNOWN');assert.equal(r.model.weeks[1].visibility,'WITHHELD');
});
test('disabled/misconfigured delivery never accesses Google; incomplete/inconsistent FINAL results fail closed',()=>{
 let calls=0;assert.equal(createSheetDashboard(()=>null,()=>{calls++;},Date.now)().state,'DISABLED');assert.equal(calls,0);
 for(const mutate of [e=>e.cfg.expectedGameCount=3,e=>e.matrix.Results[1][6]='',e=>e.matrix.Results[1][4]='Lions',e=>e.matrix.Results[0][2]='PRIVATE_HEADER',e=>e.cfg.ownerAccessReviewed=false]){const e=liveSheetExample();mutate(e);assert.equal(service(e)().state,'UNAVAILABLE');}
 const e=liveSheetExample();e.setFault((matrix,n)=>{if(n===2)matrix.Results[1][6]='24';});assert.equal(service(e)().state,'UNAVAILABLE');
});
test('presentation artifact is sealed exact two files, owner-only, minimal scope; default RPC ignores arguments',()=>{
 const contents=pkg.render(),m=JSON.parse(contents['appsscript.json']);assert.deepEqual(m.webapp,{access:'MYSELF',executeAs:'USER_ACCESSING'});assert.deepEqual(m.oauthScopes,['https://www.googleapis.com/auth/spreadsheets.readonly']);assert(!m.executionApi);assert(!m.dependencies.libraries);
 const e=liveSheetExample(),context=vm.createContext({...e.denied.globals,Map,Set,Date,Error,Sheets:new Proxy({}, {get(){throw Error('Native access denied');}}),HtmlService:{createHtmlOutput(html){return {setTitle(){return html;}};}}});vm.runInContext(contents['Verification.gs'],context);assert.equal(context.getPerfectPickDashboard({enabled:true,target:'PRIVATE'}).state,'DISABLED');assert(context.doGet().includes('google.script.run'));assert.equal(context.doPost,undefined);assert.deepEqual(e.denied.attempts,[]);
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'pp-presentation-'));try{pkg.stage(dir);pkg.verify(dir);fs.writeFileSync(path.join(dir,'extra.json'),'{}');assert.throws(()=>pkg.verify(dir));}finally{fs.rmSync(dir,{recursive:true,force:true,maxRetries:10});fs.rmSync(dir+'.seal.json',{force:true});}
 for(const alter of [m=>m.webapp.access='ANYONE_ANONYMOUS',m=>m.oauthScopes.push('EDIT'),m=>m.executionApi={access:'ANYONE'}]){const changed=JSON.parse(contents['appsscript.json']);alter(changed);assert.throws(()=>pkg.inspect({...contents,'appsscript.json':JSON.stringify(changed)}));}
});
test('actual generated RPC bridge renders fresh fabricated Results using the existing frontend bundle',()=>{
 const e=liveSheetExample();const script=pkg.render()['Verification.gs'].replace('// Return null keeps both the page data service and all Sheet reads disabled.\n return null;','// Return null keeps both the page data service and all Sheet reads disabled.\n return fabricatedConfig;');assert.notEqual(script,pkg.render()['Verification.gs']);
 const Clock=class extends Date {static now(){return e.policy.now;}};const context=vm.createContext({...e.denied.globals,Map,Set,Date:Clock,Error,Sheets:e.sheets,fabricatedConfig:e.cfg});vm.runInContext(script,context);const reply=context.getPerfectPickDashboard();assert.equal(reply.state,'READY');assert.equal(reply.model.matchViews[2]['Chiefs vs Bills'].winner,'Chiefs');assert.deepEqual(e.denied.attempts,[]);
});
test('two-letter team abbreviations produce valid independent public keys',()=>{
 const e=liveSheetExample();e.matrix.Results[1]=[1,'Packers vs Patriots','Packers','Patriots','Packers','Final',14,10];const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.matchViews[1]['Packers vs Patriots'].winner,'Packers');
});
test('future weeks without Form columns do not block current approved closed-week standings',()=>{
 const e=liveSheetExample();e.cfg.authority=e.authority;e.cfg.expectedGameCount=3;e.authority.capture.resultRows=3;e.matrix.Results.push([3,'Packers vs Patriots','Packers','Patriots','','Pending','','']);const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.weeks[0].visibility,'AVAILABLE');assert.equal(r.model.weeks[2].visibility,'WITHHELD');assert.equal(r.model.prizes.overallStandings.length,2);assert.equal(r.model.prizes.seasonCoverage,'1, 2');assert(e.calls.every(c=>c.ranges.every(r=>!r.startsWith("'Responses'!G"))));
});
test('approved accounting reads actual source columns, calculates verified pools/rollovers, never payments',()=>{
 const e=liveSheetExample();e.cfg.authority=e.authority;e.cfg.expectedGameCount=3;e.authority.capture.resultRows=3;e.cfg.responseLastColumn=7;e.matrix.Results.push([1,'Packers vs Patriots','Packers','Patriots','Packers','Final',14,10]);e.matrix.Responses[0].push('W1 | Packers vs Patriots');
 e.matrix['Prize Rules']=[['Period Key','Display Name','Start Week','End Week','Rule Mode','Weekly Entry','Monthly Winner %','Season %','','','','Include In Season'],['M1','PRIVATE_LABEL',1,2,'NEW',5,50,50,'','','','YES']];
 e.matrix['Weekly Prize Results']=[['Week','Period Key','Active Players','PRIVATE_UNUSED','PRIVATE_UNUSED','PRIVATE_UNUSED','Override Weekly Pot','Notes'],[1,'M1',2,'','','','','PRIVATE_NOTE'],[2,'M1',2,'','','','','PRIVATE_NOTE']];
 e.authority.poolStates=new Map([['W1','CONFIRMED'],['W2','CONFIRMED'],['M1','CONFIRMED'],['S2026','CONFIRMED']]);const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.prizeViews[1].rollover,10);assert.equal(r.model.prizes.currentMonthlyPot,10);assert.equal(r.model.prizes.projectedMonthlyWinnerPool,5);assert.equal(r.model.prizes.confirmedSeasonPot,5);assert.equal(r.model.prizeViews[1].payment,'Payment status unavailable');assert(!JSON.stringify(r).includes('PRIVATE_'));assert(e.calls.every(c=>c.ranges.every(r=>!r.includes('Ledger')&&!r.includes('N1')&&!r.includes('H1:H20'))));
});
test('approved official Form destination works without falsely declaring the entry window OPEN',()=>{
 const e=liveSheetExample();e.cfg.form={url:'https://docs.google.com/forms/d/e/FABRICATED_PLAYER_FORM/viewform',verified:true,approvedForPlayers:true};const r=service(e)();assert.equal(r.state,'READY');assert.equal(r.model.form.available,true);assert(r.model.form.message.includes('Check entry availability'));assert.equal(r.model.weeks[1].entriesStatus,'UNKNOWN');e.cfg.form.url=e.cfg.form.url.replace('viewform','edit');assert.equal(service(e)().model.form.available,false);
});
