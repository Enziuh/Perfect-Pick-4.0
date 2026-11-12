'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fabricated,validationTrust}=require('./support/projector-examples.cjs');
const {projectCompetition}=require('../tools/projector/project-competition.cjs');
const {createDashboardModel}=require('../tools/presentation/contract-dashboard.cjs');
function example(mode){const x=fabricated();x.policy.accuracyRoster=[...x.policy.aliases.values()].map(({player,alias})=>({player,alias}));if(mode==='absent')x.source.weeks[0].submissions.shift();const s=projectCompetition(x.source,x.policy);return {x,s};}
test('roster accuracy includes missed whole weeks without modifying protected scoring records',()=>{
 const {x,s}=example('absent');assert.equal(s.state,'READY');assert.equal(s.accuracy.version,'ROSTER_FINAL_V1');
 const m=createDashboardModel(s,validationTrust(x.policy,s),{activeWeek:1});
 assert.equal(m.weeks[0].standings.length,2);assert(m.weeks[0].standings.every(r=>r.completedGames===1));
 assert(m.prizes.overallStandings.every(r=>r.completedGames===2));
 const zero=m.weeks[0].standings.find(r=>r.points===0&&r.qualificationCompletedGames===0);assert(zero);
 assert.equal(s.standings.find(t=>t.key==='W1').rows.length,1);
});
test('versioned accuracy changes no points, ranks, champion or prize source',()=>{
 const {x,s}=example();delete x.policy.accuracyRoster;const original=projectCompetition(x.source,x.policy),derived=structuredClone(s);delete derived.accuracy;assert.deepEqual(derived,original);
});
const accuracy=require('../tools/scoring/roster-accuracy.cjs');
const late=require('../tools/scoring/late-entry.cjs');
const {validatePublic}=require('../tools/contracts/live-contract.cjs');
const {decode}=require('../tools/api/browser-client.cjs');
const {projectReply,validate:validateStatic}=require('../tools/snapshots/schema.cjs');
const {historicalEqual}=require('../tools/snapshots/cloud-projector.cjs');
const fs=require('node:fs');
const {historical}=require('./support/accuracy-history.cjs');
test('pinned historical version derives weekly/monthly/season and running accuracy; all frozen results and original bytes preserved',()=>{
 const productionBytes=fs.readFileSync('public-data/snapshot.json');
 const original=historical(),file=structuredClone(original),now=Date.parse(file.capturedAt),s=file.payload.snapshot;
 const before=validateStatic(original,now);s.accuracy=accuracy.create(s,file.payload.aliases);
 const after=validateStatic(file,now);
 for(const key of ['prizeViews','resolutions','matchViews'])assert.deepEqual(after[key],before[key]);
 assert(historicalEqual(original,file));
 assert.deepEqual(file.aggregateStandings,original.aggregateStandings);
 assert.deepEqual(s.months,original.payload.snapshot.months);assert.deepEqual(s.prizes,original.payload.snapshot.prizes);assert.deepEqual(s.standings,original.payload.snapshot.standings);
 for(const [beforeRows,afterRows] of [[before.prizes.overallStandings,after.prizes.overallStandings],...before.weeks.map(w=>[w.standings,after.weeks.find(a=>a.week===w.week).standings]),...before.prizes.periods.map(p=>[p.standings,after.prizes.periods.find(a=>a.periodKey===p.periodKey).standings])]){
  assert.deepEqual(afterRows.map(r=>[r.name,r.points,r.rank]),beforeRows.map(r=>[r.name,r.points,r.rank]));
  for(const r of afterRows){const old=beforeRows.find(a=>a.name===r.name);assert.equal(r.qualificationCompletedGames,old.completedGames);assert.equal(r.totalPicks,old.totalPicks);}
 }
 const isaias=after.prizes.overallStandings.find(r=>r.name==='Isaias'),pancho=after.prizes.overallStandings.find(r=>r.name==='Pancho R.');
 assert.equal(isaias.points,76);assert.equal(pancho.points,76);assert.equal(isaias.completedGames,128);assert.equal(pancho.completedGames,128);assert.equal(isaias.qualificationCompletedGames,127);
 assert(after.prizes.periods.find(p=>p.periodKey==='M3').standings.every(r=>r.completedGames===7));
 assert.deepEqual(fs.readFileSync('public-data/snapshot.json'),productionBytes);
 const stripped=structuredClone(file);delete stripped.payload.snapshot.accuracy;assert.deepEqual(stripped,original);
});
test('API/static remapping parity including zero-pick roster members and fail-closed unknown versions/counters',()=>{
 const original=historical(),f=structuredClone(original),now=Date.parse(f.capturedAt);f.payload.snapshot.accuracy=accuracy.create(f.payload.snapshot,f.payload.aliases);
 const direct=decode(f.payload,now,f.deadlineDisclosures||[]),staticModel=validateStatic(f,now);
 const weekly=direct.weeks.find(w=>w.week===9).standings;assert.deepEqual(weekly,staticModel.weeks.find(w=>w.week===9).standings);
 const map=new Map(f.payload.aliases.map((r,i)=>[r.player,'p_'+String(i+1).padStart(32,'0')]));
 const remapped=projectReply(f.payload,map);assert.deepEqual(decode(remapped,now,f.deadlineDisclosures||[]).weeks.map(w=>w.standings),direct.weeks.map(w=>w.standings));
 for(const mutate of [s=>s.accuracy.version='UNKNOWN',s=>s.accuracy.weeks[8].completedGames++,s=>s.accuracy.roster.push(s.accuracy.roster[0]),s=>s.accuracy.roster.pop(),s=>s.accuracy.extra=true]){const bad=structuredClone(f);mutate(bad.payload.snapshot);assert.throws(()=>validateStatic(bad,now));}
 assert.doesNotThrow(()=>validateStatic(original,now));assert.throws(()=>validateStatic(f,Date.parse(f.expiresAt)));
});
test('blank/invalid whole entry, wrong/on-time/late picks and incomplete evidence retain points but share FINAL denominator',()=>{
 for(const scenario of ['blank','invalid','partial','unknown']){
  const x=fabricated();x.policy.accuracyRoster=[...x.policy.aliases.values()].map(({player,alias})=>({player,alias}));
  if(scenario==='blank')x.source.weeks[0].submissions[0].selections[0].pick='';
  if(scenario==='invalid'){x.policy.lateEntryRules=late.RULE;x.policy.lateEntryStartWeek=1;x.policy.lateEntryEvidence=new Map();x.source.weeks[0].submissions[0].selections[0].pick='INVALID TEAM';}
  if(scenario==='partial'){const g=x.source.games[0];g.status='Pending';g.winner='';g.team1Score='';g.team2Score='';}
  if(scenario==='unknown'){x.policy.lateEntryRules=late.RULE;x.policy.lateEntryStartWeek=1;x.policy.lateEntryEvidence=new Map();}
  const s=projectCompetition(x.source,x.policy);assert.equal(s.state,'READY');const model=createDashboardModel(s,validationTrust(x.policy,s),{activeWeek:1});
  assert(model.weeks[0].standings.every(r=>r.completedGames===(scenario==='partial'?0:1)));
  delete x.policy.accuracyRoster;const old=projectCompetition(x.source,x.policy),copy=structuredClone(s);delete copy.accuracy;assert.deepEqual(copy,old);
 }
});
test('only FINAL games count; scheduled/postponed/canceled/unknown games do not manufacture completions',()=>{
 assert.equal(late.finalizedGameCount(['FINAL','SCHEDULED','POSTPONED','CANCELED','IN_PROGRESS','UNKNOWN'].map(status=>({status}))),1);
 const {x,s}=example();for(const bad of [[],[s.accuracy.roster[0],s.accuracy.roster[0]]])assert.throws(()=>accuracy.create(s,bad));
 const modified=structuredClone(s);modified.accuracy.weeks[0].completedGames=99;assert.throws(()=>validatePublic(modified,validationTrust(x.policy,s)));
});
test('per-game cutoff points and entry replacement stay unchanged at exact deadline and one second later',()=>{
 const now=Date.parse('2026-11-10T12:00:00Z'),games=[{game:'first',status:'FINAL',winner:'CHI'},{game:'later',status:'FINAL',winner:'CHI'}];
 const e={verified:true,revision:1,verifiedAt:new Date(now).toISOString(),timezone:'America/Los_Angeles',firstGame:'first',deadline:'2026-11-06T00:15:00Z',schedule:[{game:'first',kickoff:'2026-11-06T01:15:00Z',verified:true,revision:1},{game:'later',kickoff:'2026-11-08T18:00:00Z',verified:true,revision:1}]};
 const entry=timestamp=>({timestamp,selections:games.map(g=>({game:g.game,pick:'CHI'}))});
 const on=entry(e.deadline),after=entry('2026-11-06T00:15:01Z');assert.equal(late.score(on,games,e,now,120000).points,2);assert.equal(late.score(after,games,e,now,120000).points,1);assert.equal(late.finalizedGameCount(games),2);
 assert.equal(late.selectEntry([on,after],e,now,120000).entry,on);assert.equal(late.selectEntry([after,entry('2026-11-07T00:00:00Z')],e,now,120000).entry,after);
 assert.equal(late.score(entry('2026-11-08T18:00:00Z'),games,e,now,120000).points,1);assert.equal(late.score(entry('2026-11-08T18:00:01Z'),games,e,now,120000).points,0);
 const shifted=structuredClone(e);shifted.schedule[0].kickoff='2026-11-06T02:15:00Z';assert.equal(late.cutoff('first',shifted,now,120000),null);
});
test('API provider validates complete 23-person registry/aliases before opting into corrected accuracy',()=>{
 const x=require('./support/pp3-api-example.cjs').example();const aliases=x.e.authority.aliases,headers=x.matrix.Responses[0],phone=headers.indexOf('Phone Number');
 for(let i=2;i<23;i++){const privateKey=String(5550000000+i),row=[...x.matrix.Responses[1]];row[phone]=privateKey;x.matrix.Responses.push(row);aliases.push({privateKey,player:'p_roster'+String(i).padStart(8,'0'),alias:'Roster '+String.fromCharCode(65+i)+'.',approved:true,revision:1});}
 const context=x.deps.context;x.deps.context=()=>({...context(),playerRegistry:Object.fromEntries(aliases.map(a=>[a.privateKey,a.alias]))});x.cfg.authority=x.e.authority;
 const baseline=x.get();assert.equal(baseline.schema,'PP4_JSON_V1');x.cfg.accuracyRules=accuracy.VERSION;x.cfg.rosterFromWeek1=true;
 const reply=x.get();assert.equal(reply.schema,'PP4_JSON_V1');assert.equal(reply.snapshot.accuracy.roster.length,23);
 const original=structuredClone(reply);delete original.snapshot.accuracy;assert.deepEqual(original,baseline);
 assert.equal(decode(reply,x.e.policy.now).prizes.accuracyBasis,accuracy.VERSION);
 x.cfg.rosterFromWeek1=false;assert.equal(x.get().state,'UNAVAILABLE');x.cfg.rosterFromWeek1=true;
 x.deps.context=()=>({...context(),playerRegistry:{}});assert.equal(x.get().state,'UNAVAILABLE');
});
test('entire roster missing a finalized week remains zero-point membership without qualifying a monthly champion',()=>{
 const x=fabricated();x.source.weeks.forEach(w=>{w.submissions=[];});x.policy.accuracyRoster=[...x.policy.aliases.values()].map(({player,alias})=>({player,alias}));
 const s=projectCompetition(x.source,x.policy);assert.equal(s.state,'READY');assert(s.months.every(m=>m.state==='IN PROGRESS'&&m.winner===null));
 const m=createDashboardModel(s,validationTrust(x.policy,s),{activeWeek:1});
 assert(m.weeks.every(w=>w.standings.length===2&&w.standings.every(r=>r.points===0&&r.completedGames===1&&r.qualificationCompletedGames===0&&r.totalPicks===0)));
 assert(m.prizes.overallStandings.every(r=>r.points===0&&r.completedGames===2&&r.rank===1));
});
