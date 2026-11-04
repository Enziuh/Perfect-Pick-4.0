'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {liveSheetExample}=require('./support/live-sheet-example.cjs');
const {createLegacyProvider}=require('../tools/api/legacy-provider.cjs');
const {decode,install}=require('../tools/api/browser-client.cjs');
const extension=require('../tools/api/json-extension.cjs'),pages=require('../tools/api/pages-artifact.cjs');
const endpoint='https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec';
const {example}=require('./support/pp3-api-example.cjs');
test('existing PP3 context and prize builders feed Results to Pages with private scopes withheld',()=>{
 const x=example(),r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const model=decode(r,x.e.policy.now);assert.equal(model.matchViews[1]['Bears vs Lions'].scores[0],'20');assert.equal(model.weeks[0].visibility,'WITHHELD');assert.equal(model.matchViews[1]['Bears vs Lions'].votes,null);assert.deepEqual(model.prizes.overallStandings,[]);assert(!JSON.stringify(r).includes('PRIVATE_'));assert(!JSON.stringify(r).includes(x.e.authority.aliases[0].privateKey));assert.deepEqual(x.e.denied.attempts,[]);
});
test('approved CLOSED and alias authority reuse PP3 latest entry and points-first monthly tiebreaker',()=>{
 const x=example();x.cfg.authority=x.e.authority;let r=x.get();assert.equal(r.schema,'PP4_JSON_V1');let m=decode(r,x.e.policy.now);assert.equal(m.weeks[0].standings.length,2);assert.equal(m.resolutions.M1.winner,'Avery A.');assert.equal(m.matchViews[1]['Bears vs Lions'].votes.total,2);
 const row=structuredClone(x.matrix.Responses[1]);row[0]=new Date(x.e.policy.now+1).toISOString();row[3]='Lions';x.matrix.Responses.push(row);x.e.policy.now+=2;r=x.get();m=decode(r,x.e.policy.now);assert.equal(m.weeks[0].standings.find(p=>p.name==='Avery A.').points,0);assert.equal(m.weeks[0].standings.length,2);
});
test('projected points, completed picks and perfect weeks match the original scoring functions',()=>{
 const x=example();x.cfg.authority=x.e.authority;const row=structuredClone(x.matrix.Responses[1]);row[0]=new Date(x.e.policy.now+1).toISOString();row[2]='1'+row[2];row[3]='Lions';x.matrix.Responses.push(row);x.e.policy.now+=2;
 const ctx=x.deps.context(),latest=Object.values(x.sandbox.getLatestSubmissionPerWeek_(ctx.responses,ctx.games));const model=decode(x.get(),x.e.policy.now);
 for(const entry of latest){const old=x.sandbox.scoreSubmissionForWeek_(entry,ctx.games.filter(g=>g.week===entry.week),ctx.playerRegistry,ctx.resultLookup),approved=x.e.authority.aliases.find(a=>a.privateKey===entry.phone),current=model.weeks.find(w=>w.week===entry.week).standings.find(p=>p.name===approved.alias);assert.equal(current.points,old.points);assert.equal(current.completedGames,old.completedGames);assert.equal(current.totalPicks,old.totalPicks);const week=model.weeks.find(w=>w.week===entry.week);assert.equal(week.results.every(g=>g.status==='Final')&&current.points===week.games.length&&current.completedGames===week.games.length&&current.totalPicks===week.games.length,old.perfectWeek);}
});
test('only a reviewed player-facing Form URL creates an entry link; closed status disables it',()=>{
 const x=example();x.cfg.form={url:'https://docs.google.com/forms/d/e/FABRICATED_PLAYER_FORM/viewform',verified:true,approvedForPlayers:true};assert.equal(decode(x.get(),x.e.policy.now).form.available,true);x.cfg.authority=x.e.authority;assert.equal(decode(x.get(),x.e.policy.now).form.available,false);x.cfg.form.url=x.cfg.form.url.replace('viewform','edit');assert.equal(x.get().form,null);
});
test('missing aliases, unknown closure and stale closure never publish picks or vote information',()=>{
 for(const change of [a=>a.aliases=[],a=>a.closures=[],a=>a.closures.forEach(c=>c.status='UNKNOWN'),a=>a.closures.forEach(c=>c.validUntil=c.checkedAt)]){const x=example();x.cfg.authority=structuredClone(x.e.authority);change(x.cfg.authority);const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const m=decode(r,x.e.policy.now);assert.equal(m.weeks[0].visibility,'WITHHELD');assert.equal(m.matchViews[1]['Bears vs Lions'].votes,null);}
});
test('a reported reopened current Form overrides an older CLOSED proof without granting disclosure itself',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.matrix['Form Control'][1][5]='OPEN';const model=decode(x.get(),x.e.policy.now);assert.equal(model.weeks[1].visibility,'WITHHELD');assert.equal(model.matchViews[2]['Chiefs vs Bills'].votes,null);assert.equal(model.prizes.formControl.reportedStatus,'OPEN');assert.equal(model.resolutions.M1.winner,null);
});
test('monthly equal distances stay unresolved, blank predictions ineligible and points/ranks unchanged',()=>{
 for(const missing of [false,true]){const x=example();x.cfg.authority=x.e.authority;const actual=Number(x.matrix.Results[2][6])+Number(x.matrix.Results[2][7]);let n=0;for(const row of x.matrix.Responses.slice(1))if(row[4])row[5]=missing?'':String(actual+(n++===0?-1:1));
 const model=decode(x.get(),x.e.policy.now);assert.equal(model.resolutions.M1.status,missing?'NO ELIGIBLE TIEBREAKER':'UNRESOLVED TIE');assert.equal(model.resolutions.M1.winner,null);assert(model.prizes.periods[0].standings.every(p=>p.rank===1));assert.equal(model.prizes.periods[0].paymentState,'UNKNOWN');}
});
test('publication is disabled by default and private configuration extras never enter JSON',()=>{
 let reads=0;const get=createLegacyProvider({config:()=>null,context(){reads++;throw Error();}});assert.equal(get().state,'DISABLED');assert.equal(reads,0);
 const x=example();x.cfg.form={url:'PRIVATE_URL',notes:'PRIVATE_SECRET'};assert.equal(x.get().form,null);x.cfg.publicationApproved=false;assert.equal(x.get().state,'UNAVAILABLE');
});
test('strict client contract rejects extra fields, invalid Final scores, premature picks and injected identities',()=>{
 const x=example(),r=x.get();for(const change of [r=>r.notes='PRIVATE',r=>r.snapshot.notes='PRIVATE',r=>r.snapshot.games[0].homeScore=null,r=>r.snapshot.weeks[0].picks=[],r=>r.aliases.push({player:'bad',alias:'PRIVATE',phone:'PRIVATE'})]){const copy=structuredClone(r);change(copy);assert.throws(()=>decode(copy,x.e.policy.now));}
});
test('extension is disabled by default; additive router leaves all five existing actions unchanged',()=>{
 const code=extension.render();const x=example();const ctx=vm.createContext({...x.e.denied.globals});vm.runInContext(code,ctx);assert.equal(typeof ctx.buildPerfectPick4Dashboard_,'function');assert.equal(ctx.doGet,undefined);assert.equal(ctx.perfectPick4JsonConfig_(),null);
 const original=fs.readFileSync(path.join(__dirname,'../apps-script/src/00_Config_Setup.js'),'utf8');const patched=extension.route(original);assert.equal(patched.replace(extension.ROUTE,"  if (action === 'health') {"),original);assert.throws(()=>extension.route(patched));
 const out=vm.createContext({ContentService:{MimeType:{JSON:'JSON'},createTextOutput(text){return {setMimeType(){return JSON.parse(text);}};}}});vm.runInContext(patched,out);
 Object.assign(out,{assertNoForbiddenKeys_(){},getCachedOrBuild_(key,ttl,fn){return fn();},buildSummary_:()=>({kind:'summary'}),buildOverall_:()=>({kind:'overall'}),buildWeek_:w=>({kind:'week',week:w}),buildPrizeDashboard_:()=>({kind:'prizes'})});
 for(const action of ['summary','overall','week','prizes'])assert.equal(out.doGet({parameter:{action,week:2}}).kind,action);assert.equal(out.doGet({parameter:{action:'health'}}).ok,true);assert.equal(out.doGet({parameter:{action:'dashboard4'}}).state,'UNAVAILABLE');assert.deepEqual(x.e.denied.attempts,[]);
});
test('API publication remains explicit, exact six-file, sealed and rejects altered assets',()=>{
 assert.throws(()=>pages.render({endpoint,publicationApproved:false}));assert.throws(()=>pages.render({endpoint:endpoint+'?token=x',publicationApproved:true}));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pp-json-pages-'));fs.rmdirSync(dir);try{pages.stage({endpoint,publicationApproved:true},dir);pages.verify(dir,{endpoint,publicationApproved:true});fs.appendFileSync(path.join(dir,'app.js'),'\n// altered');assert.throws(()=>pages.verify(dir,{endpoint,publicationApproved:true}));}finally{fs.rmSync(dir,{recursive:true,force:true});fs.rmSync(dir+'.seal.json',{force:true});}
});
test('browser fetches only the fixed reviewed JSON action, coalesces and recovers without raw failures',async()=>{
 const x=example(),events={},calls=[],intervals=[],root={AbortController,Event:class{constructor(type){this.type=type;}},setTimeout:(fn,ms)=>{if(ms<2000)queueMicrotask(fn);return 1;},clearTimeout(){},setInterval(fn){intervals.push(fn);},document:{hidden:false,getElementById:()=>null,addEventListener(name,fn){events[name]=fn;},dispatchEvent(){}},fetch:async(url,options)=>{calls.push({url,options});return {ok:true,url:endpoint,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(x.get())};}};
 const real=Date.now,now=x.e.policy.now;Date.now=()=>now;try{install(root,{endpoint});await Promise.all([root.PerfectPickPreview.get('prizes'),root.PerfectPickPreview.get('week','&week=1')]);assert.equal(calls.length,1);assert.equal(calls[0].url,endpoint+'?action=dashboard4');assert.equal(calls[0].options.credentials,'omit');root.fetch=async()=>{throw Error('PRIVATE_FAILURE');};await intervals[0]();assert((await root.PerfectPickPreview.get('prizes')).weekly.length>0);/* Fresh cached disclosure stays valid; expiry still fails closed. */Date.now=()=>now+120001;await intervals[0]();await assert.rejects(()=>root.PerfectPickPreview.get('prizes'),{message:'Competition data unavailable'});}finally{Date.now=real;}
});
module.exports={example,endpoint};

test('approved aliases are never enumerated before verified disclosure or for unused players',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.closures=[];
 let r=x.get();assert.deepEqual(r.aliases,[]);assert(!JSON.stringify(r).includes('Avery A.'));
 const copy=structuredClone(r);copy.aliases=[{player:'p_unused000',alias:'Unused U.'}];assert.throws(()=>decode(copy,x.e.policy.now));
});
test('raw registry names and unapproved/incorrectly formatted aliases cannot authorize player publication',()=>{
 for(const alias of ['Raw Full Name','Avery','PRIVATE_NAME','Avery A.']){
  const x=example();x.cfg.authority=x.e.authority;x.e.authority.aliases[0].alias=alias;
  x.e.authority.aliases[0].approved=false;
  const r=x.get();assert(r.state==='UNAVAILABLE'||r.snapshot.weeks.every(w=>!w.picks));
 }
});
test('original overall and monthly points, completed submitted picks and shared ranks match approved JSON',()=>{
 const x=example();x.cfg.authority=x.e.authority;
 // A partial submission counts only its selected FINAL games, never all NFL games.
 const extra=['W1 | Packers vs Vikings'];x.matrix.Responses[0].push(...extra);
 x.matrix.Responses.slice(1).forEach(r=>r.push(''));
 x.matrix.Results.push([1,'Packers vs Vikings','Packers','Vikings','Packers','Final',20,10]);
 const ctx=x.deps.context();ctx.playerRegistry=Object.fromEntries(x.e.authority.aliases.map(a=>[a.privateKey,a.alias]));
 const oldOverall=x.sandbox.buildOverallFromContext_(ctx).standings;
 const oldMonth=x.sandbox.getPeriodStandings_(ctx,1,2);
 const m=decode(x.get(),x.e.policy.now);
 for(const [actual,expected] of [[m.prizes.overallStandings,oldOverall],[m.prizes.periods[0].standings,oldMonth]]){
  assert.equal(actual.length,expected.length);
  for(const old of expected){const row=actual.find(r=>r.name===old.name);assert(row);for(const k of ['rank','points','completedGames'])assert.equal(row[k],old[k]);}
 }
 assert.equal(m.weeks[0].standings[0].completedGames,1);assert.equal(m.weeks[0].results.length,2);
});
test('season never silently drops an unverified created week from original aggregation scope',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.closures=x.e.authority.closures.filter(c=>c.week===1);
 const r=x.get(),season=r.snapshot.standings.find(s=>s.scope==='SEASON');assert.deepEqual(season.weeks,[1,2]);assert.equal(season.state,'WITHHELD');assert.equal(decode(r,x.e.policy.now).prizes.overallStandings.length,0);
});
test('JSON-compatible private decision and pool approvals reuse the existing validated projector',()=>{
 const x=example();x.cfg.authority=x.e.authority;
 x.e.authority.decisions=[...x.e.authority.decisions].map(([key,value])=>({key,...value}));
 x.e.authority.poolStates=[{key:'W1',state:'CONFIRMED'},{key:'M1',state:'PROJECTED'},{key:'S2026',state:'CONFIRMED'}];
 const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const m=decode(r,x.e.policy.now);assert.equal(m.resolutions.M1.winner,'Avery A.');assert.equal(m.prizeViews[1].pool,10);assert.equal(m.prizeViews[1].allocationEach,null);assert.equal(m.prizes.periods[0].paymentState,'UNKNOWN');
});
test('weekly allocations need separate fresh owner approval and original perfect-week payout facts',()=>{
 for(const mode of ['approved','missing','stale','unknown-closure','missing-alias','wrong-revision']){
  const x=example();x.cfg.authority=x.e.authority;x.e.authority.poolStates=[{key:'W1',state:'CONFIRMED'}];
  const approval={week:1,snapshotRevision:1,verifiedAt:new Date(x.e.policy.now).toISOString(),approved:true};
  x.e.authority.allocationApprovals=mode==='missing'?[]:[approval];
  if(mode==='stale')approval.verifiedAt=new Date(x.e.policy.now-120001).toISOString();
  if(mode==='wrong-revision')approval.snapshotRevision=2;
  if(mode==='unknown-closure')x.e.authority.closures=[];
  if(mode==='missing-alias')x.e.authority.aliases=[];
  const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const p=r.snapshot.prizes.find(p=>p.key==='W1');
  assert.equal(p.paymentState,'UNKNOWN');
  if(mode==='approved'){assert.equal(p.allocationState,'CONFIRMED');assert.equal(p.allocations.length,1);assert(p.allocations.every(a=>a.cents===1000));assert.equal(decode(r,x.e.policy.now).prizeViews[1].allocationEach,10);}
  else assert(!Object.hasOwn(p,'allocations'));
 }
});
test('private JSON authority duplicates/extras and unknown pool states fail closed',()=>{
 for(const setup of [a=>a.poolStates=[{key:'W1',state:'CONFIRMED',notes:'PRIVATE'}],a=>a.poolStates=[{key:'W1',state:'CONFIRMED'},{key:'W1',state:'PROJECTED'}],a=>a.poolStates=[{key:'W1',state:'PAID'}],a=>a.decisions=[{key:'M1',complete:true}]]){
  const x=example();x.cfg.authority=x.e.authority;setup(x.e.authority);assert.equal(x.get().state,'UNAVAILABLE');
 }
});
test('only explicitly approved no-perfect rollovers import the actual legacy amount and destination',()=>{
 for(const approved of [false,true]){
  const x=example();x.cfg.authority=x.e.authority;
  x.matrix.Responses.slice(1).forEach(r=>{if(r[3])r[3]='Lions';});
  x.e.authority.poolStates=[{key:'W1',state:'CONFIRMED'},{key:'M1',state:'CONFIRMED'}];
  if(approved)x.e.authority.rolloverApprovals=[{week:1,to:'M1',snapshotRevision:1,verifiedAt:new Date(x.e.policy.now).toISOString(),approved:true}];
  const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const p=r.snapshot.prizes.find(p=>p.key==='W1');
  if(approved){assert.deepEqual(p.rollover,{to:'M1',cents:1000});assert.equal(p.paymentState,'UNKNOWN');const model=decode(r,x.e.policy.now);assert.equal(model.prizeViews[1].rollover,10);assert.equal(model.prizes.periods[0].monthlyWinnerPool,5);}
  else assert(!Object.hasOwn(p,'rollover'));
 }
});
test('reading approved allocations never mutates private owner configuration',()=>{
 const x=example();x.cfg.authority=x.e.authority;
 x.e.authority.allocationApprovals=[{week:1,snapshotRevision:1,verifiedAt:new Date(x.e.policy.now).toISOString(),approved:true}];
 const before=structuredClone(x.cfg.authority);assert.equal(x.get().schema,'PP4_JSON_V1');assert.deepEqual(x.cfg.authority,before);
});
