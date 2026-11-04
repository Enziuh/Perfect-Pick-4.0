'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {example,COMET,MAPLE}=require('./support/live-contract-examples.cjs');
const {createDashboardModel,createViewAdapter,compareDashboard}=require('../tools/presentation/contract-dashboard.cjs');
const {createPrivateDashboard}=require('../tools/presentation/private-dashboard.cjs');
const {formEntry}=require('../tools/presentation/form-entry.cjs');
function build(name='decisive'){const e=example(name);return {...e,model:createDashboardModel(e.snapshot,e.trust,{activeWeek:2})};}
test('validated contract supplies every destination without changing scoring or authoritative champion decisions',async()=>{
 const {snapshot,trust,model}=build(),adapter=createViewAdapter(model,()=>trust.now),p=await adapter.get('prizes');assert.equal(p.activeWeek,2);assert.equal(p.overallStandings[0].points,1);assert.equal(p.currentWeeklyPot,10);assert.equal(p.confirmedSeasonPot,null);assert.equal(model.resolutions.M1.winner,'Synthetic Comet');assert.equal(adapter.resolveMonthlyChampion(p.periods[0],model.weeks).actualTotal,38);assert.deepEqual(snapshot,example().snapshot);assert.equal((await adapter.get('week','&week=2')).standings.find(r=>r.name==='Synthetic Comet').tiebreakPrediction,'40');
});
test('CLOSED but withheld is unavailable, never empty voting or zero submissions',()=>{
 const {model}=build('missing-alias');for(const week of model.weeks){assert.equal(week.entriesStatus,'CLOSED');assert.equal(week.visibility,'WITHHELD');assert.deepEqual(week.standings,[]);for(const m of Object.values(model.matchViews[week.week])){assert.equal(m.votes,null);assert.deepEqual(m.selections,[]);}}
});
test('zero votes and pending games remain distinct from withheld data',()=>{
 const zero=build('zero-votes').model;assert.equal(zero.matchViews[1]['Bears vs Lions'].votes.total,0);assert.equal(zero.weeks[0].visibility,'AVAILABLE');const pending=build('pending').model;assert(pending.matchViews[2]['Chiefs vs Bills'].selections.every(s=>s.state==='pending'));assert.equal(pending.resolutions.M1.status,'AWAITING FINAL SCORE');
});
test('unresolved and invalid tiebreakers preserve shared ranks and do not award money',()=>{
 for(const scenario of ['unresolved','no-eligible','unknown']){const {model}=build(scenario);assert.equal(model.resolutions.M1.winner,null);assert.equal(model.prizeViews[2].allocationEach,null);assert.equal(model.prizeViews[2].payment,'Payment status unavailable');}
});
test('strict validator rejects unauthorized fields, incorrect aliases and stale snapshots before assembly',()=>{
 for(const mutate of [e=>e.snapshot.notes='PRIVATE',e=>e.snapshot.weeks[0].picks[0].alias='Unapproved',e=>e.trust.now+=600000]){const e=example();mutate(e);assert.throws(()=>createDashboardModel(e.snapshot,e.trust,{activeWeek:2}));assert.throws(()=>createPrivateDashboard(e.snapshot,e.trust,{activeWeek:2}));}
});
test('view adapter expires and refuses unknown resources, without fallback or network',async()=>{
 const {model,trust}=build();let now=trust.now;const api=createViewAdapter(model,()=>now);await assert.rejects(api.get('health'));now=model.expiresAt;await assert.rejects(api.get('prizes'));assert.throws(()=>api.buildMatchView(model.weeks[0],'Bears vs Lions'));
});
test('Form entry requires canonical owner-approved player URL and fresh official OPEN evidence',()=>{
 const {snapshot,trust}=example();const entry={...snapshot.weeks[0].entry,status:'OPEN'},approved={verified:true,approvedForPlayers:true,url:'https://docs.google.com/forms/d/e/FABRICATED_PUBLIC_FORM/viewform'};assert.equal(formEntry(approved,entry,trust.now,trust.maxAgeMs).available,true);
 for(const config of [null,{...approved,verified:false},{...approved,url:approved.url.replace('viewform','edit')},{...approved,url:approved.url+'?entry.1=private'},{...approved,url:'https://forms.gle/FABRICATED'},{...approved,url:'javascript:alert(1)'},{...approved,url:'https://docs.google.com.evil.invalid/forms/d/e/a/viewform'}])assert.equal(formEntry(config,entry,trust.now,trust.maxAgeMs).available,false);
 for(const status of ['CLOSED','UNKNOWN','UPCOMING'])assert.equal(formEntry(approved,{...entry,status},trust.now,trust.maxAgeMs).available,false);assert.equal(formEntry(approved,{...entry,authority:'UNVERIFIED'},trust.now,trust.maxAgeMs).available,false);assert.equal(formEntry(approved,entry,Date.parse(entry.validUntil),trust.maxAgeMs).available,false);
});
test('private assembly excludes raw contract, trust and fixture data; public artifact remains synthetic',()=>{
 const e=example();const assets=createPrivateDashboard(e.snapshot,e.trust,{activeWeek:2});assert(!assets['fixtures/preview.json']);assert(assets['index.html'].includes('Owner Verification'));assert(assets['index.html'].includes('id="submitPicks"'));assert(!assets['preview-data.js'].includes('snapshotRevision'));assert(!assets['preview-data.js'].includes(COMET));assert(!assets['preview-data.js'].includes(MAPLE));assert(!assets['preview-data.js'].includes('fetch('));assert.equal(require('../tools/security/public-artifact.cjs').FILES.length,6);
});
test('privacy-safe comparison reports scores/rankings/prizes/champions without identities',()=>{
 const {snapshot,trust}=example();const report=compareDashboard(snapshot,structuredClone(snapshot),trust,{legacyChampionOracle:true});assert.equal(report.state,'MATCH');assert(!JSON.stringify(report).includes('Synthetic'));assert(report.checks.every(c=>['SCORES','RANKINGS','PRIZES','CHAMPIONS'].includes(c.code)));assert.equal(compareDashboard(snapshot,snapshot,trust).state,'NOT_COMPARABLE');
});
test('full read coordinator delivers only validated DTOs to a private dashboard consumer',()=>{
 const {sheetsExample}=require('./support/sheets-example.cjs');const {runPreparedDiagnostic}=require('../tools/verification/prepared-diagnostic.cjs');
 const e=sheetsExample();for(const row of e.matrix.Responses.slice(1))row[0]=new Date(e.policy.now).toISOString();
 const config={target:e.target,timeZone:'America/Los_Angeles',revision:e.policy.revision,maxAgeMs:e.policy.maxAgeMs,layout:e.layout,policy:Object.fromEntries(['games','teams','periods','seasonWeeks','decisions','accounting'].map(k=>[k,e.policy[k]])),aliases:[...e.policy.aliases].map(([privateKey,a])=>({privateKey,...a,revision:e.policy.revision})),closures:[...e.policy.closures].map(([week,c])=>({week,snapshotRevision:c.snapshotRevision,closureRevision:c.entry.revision,status:'CLOSED',mechanism:'OWNER_VERIFIED_CLOSURE',verifiedClosed:true,checkedAt:c.entry.checkedAt,validUntil:c.entry.validUntil,deadline:c.entry.deadline}))};
 let model=null;const dependencies={...e.dependencies,authorize:()=>true,consumeValidated(snapshot,trust){model=createDashboardModel(snapshot,trust,{activeWeek:2});assert(!JSON.stringify(snapshot).includes('fabricated-entry'));}};
 assert.equal(runPreparedDiagnostic(dependencies,config).state,'VALIDATED_READ');assert.equal(model.resolutions.M1.winner,'Synthetic Comet');assert.deepEqual(e.denied.attempts,[]);
 model=null;config.closures=[];assert.equal(runPreparedDiagnostic(dependencies,config).state,'BLOCKED');assert.equal(model,null);
 const {createOwnerDashboard}=require('../tools/presentation/private-dashboard.cjs');let called=false;assert.throws(()=>createOwnerDashboard(()=>{called=true;},()=>{},Date.now,{}));assert.equal(called,false);
});
test('official Form link is assembled only from separately trusted fresh OPEN evidence',()=>{
 const e=example('unknown');e.snapshot.weeks[1].entry.status='OPEN';e.snapshot.weeks[1].entry.authority='OFFICIAL';e.trust.closures.set(2,structuredClone(e.snapshot.weeks[1].entry));
 const context={activeWeek:2,form:{verified:true,approvedForPlayers:true,url:'https://docs.google.com/forms/d/e/FABRICATED_PUBLIC_FORM/viewform'}};
 const assets=createPrivateDashboard(e.snapshot,e.trust,context);assert(assets['index.html'].includes('rel="noopener noreferrer"'));assert(assets['index.html'].includes('FABRICATED_PUBLIC_FORM'));assert(!assets['index.html'].includes('/edit'));
 e.trust.closures.delete(2);assert.equal(createDashboardModel(e.snapshot,e.trust,context).form.available,false);
 e.snapshot.weeks[1].entry.checkedAt='2020-01-01T00:00:00.000Z';e.trust.closures.set(2,structuredClone(e.snapshot.weeks[1].entry));const stale=createDashboardModel(e.snapshot,e.trust,context);assert.equal(stale.form.available,false);assert.equal(stale.weeks[1].entriesStatus,'UNKNOWN');
});
