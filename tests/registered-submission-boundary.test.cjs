'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {fabricated}=require('./support/projector-examples.cjs'),{projectCompetition}=require('../tools/projector/project-competition.cjs');
function fixture(){const x=fabricated();x.policy.accuracyRoster=[...x.policy.aliases.values()].map(({player,alias})=>({player,alias}));return x;}
test('unregistered submission cannot withhold or alter a complete approved roster period',()=>{
 const x=fixture(),clean=projectCompetition(x.source,x.policy);x.source.weeks[0].submissions.push({...structuredClone(x.source.weeks[0].submissions[0]),identity:'UNREGISTERED_FAKE_PRIVATE_VALUE'});
 const result=projectCompetition(x.source,x.policy);assert.deepEqual(result,clean);assert(!JSON.stringify(result).includes('UNREGISTERED_FAKE_PRIVATE_VALUE'));
});
test('entirely missed roster member still has zero correct picks and all finalized games despite an outsider',()=>{
 const x=fixture();x.source.weeks[0].submissions.shift();const clean=projectCompetition(x.source,x.policy);x.source.weeks[0].submissions.push({identity:'UNREGISTERED_FAKE_PRIVATE_VALUE',selections:null,timestamp:'INVALID'});assert.deepEqual(projectCompetition(x.source,x.policy),clean);
});
test('missing alias approval remains fail-closed without a complete explicit roster authority',()=>{
 const x=fabricated('missing-alias'),r=projectCompetition(x.source,x.policy);assert.equal(r.standings.find(t=>t.key==='W1').reason,'MISSING_ALIAS');
 const y=fixture();y.policy.accuracyRoster.pop();y.source.weeks[0].submissions.push({...structuredClone(y.source.weeks[0].submissions[0]),identity:'UNREGISTERED_FAKE_PRIVATE_VALUE'});const s=projectCompetition(y.source,y.policy);assert(s.state==='UNAVAILABLE'||s.standings.find(t=>t.key==='W1').state==='WITHHELD');
});
test('API with all23 registry approvals rejects outside submissions without changing valid points, ranks, qualification or prizes',()=>{
 const x=require('./support/pp3-api-example.cjs').lateExample(),aliases=x.e.authority.aliases,phone=x.matrix.Responses[0].indexOf('Phone Number');
 for(let i=2;i<23;i++){const key=String(5550000000+i),row=[...x.matrix.Responses[1]];row[phone]=key;x.matrix.Responses.push(row);aliases.push({privateKey:key,player:'p_roster'+String(i).padStart(8,'0'),alias:'Roster '+String.fromCharCode(65+i)+'.',approved:true,revision:1});}
 const context=x.deps.context;x.deps.context=()=>({...context(),playerRegistry:Object.fromEntries(aliases.map(a=>[a.privateKey,a.alias]))});Object.assign(x.cfg,{authority:x.e.authority,accuracyRules:'ROSTER_FINAL_V1',rosterFromWeek1:true,prizeParticipants:23});const initial=x.get(),at=new Date(x.e.policy.now).toISOString();x.cfg.lateEntryRules='LATE_ENTRY_V1';x.cfg.lateEntryEvidence=initial.snapshot.weeks.map(w=>({week:w.week,verified:true,revision:1,verifiedAt:at,timezone:'America/Los_Angeles',firstGame:initial.snapshot.games.find(g=>g.week===w.week).game,deadline:new Date(x.e.policy.now-7200000).toISOString(),schedule:initial.snapshot.games.filter(g=>g.week===w.week).map(g=>({game:g.game,kickoff:new Date(x.e.policy.now-3600000).toISOString(),verified:true,revision:1}))}));x.deps.formState=()=>({acceptingResponses:false,responderMatchesVerified:true});x.deps.timezone=()=> 'America/Los_Angeles';x.deps.nativeResponses=ctx=>require('../tools/scoring/native-responses.cjs').readNativeResponses(ctx.ss.getSheetByName('Responses'),ctx.games.map(g=>g.header));x.matrix.Responses.slice(1).forEach(r=>r[0]=new Date(x.e.policy.now-10800000));
 const before=x.get();assert.equal(before.snapshot.accuracy.roster.length,23);const row=[...x.matrix.Responses.find((r,i)=>i>0&&String(r[x.matrix.Responses[0].findIndex(h=>/^W10\b/.test(h))]||'').trim())];row[phone]='5559999999';x.matrix.Responses.push(row);const after=x.get();assert.deepEqual(after,before);assert(after.snapshot.weeks.every(w=>Array.isArray(w.picks)));
});
