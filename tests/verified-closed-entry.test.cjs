'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../tools/disclosure/verified-closed-entry.cjs');
const now=Date.parse('2026-11-14T12:00:00.000Z'),first='2026-11-13T01:15:00.000Z',deadline='2026-11-13T00:15:00.000Z';
function input(){return {week:10,revision:1,now,maxAgeMs:120000,control:{activeWeek:10,status:'CLOSED',firstKickoff:first,picksClose:deadline},form:{responderMatchesVerified:true,acceptingResponses:false},schedule:{week:10,verified:true,revision:1,verifiedAt:new Date(now).toISOString(),timezone:'America/Los_Angeles',firstGame:'g_w10first',deadline,schedule:[{game:'g_w10first',kickoff:first,revision:1,verified:true},{game:'g_w10second',kickoff:'2026-11-15T18:00:00.000Z',revision:1,verified:true}]}};}
test('current verified closed week requires exact official deadline, Form identity and full schedule',()=>{
 const i=input(),before=JSON.stringify(i),result=c.current(i);assert.equal(result.entry.status,'CLOSED');assert.equal(result.entry.deadline,deadline);assert.equal(result.snapshotRevision,1);assert.equal(JSON.stringify(i),before);
 for(const mutate of [i=>i.control.status='OPEN',i=>i.control.activeWeek=11,i=>i.form.acceptingResponses=true,i=>i.form.responderMatchesVerified=false,i=>i.control.picksClose=first,i=>i.control.firstKickoff=deadline,i=>i.now=Date.parse(deadline)-1,i=>i.schedule.verified=false,i=>i.schedule.verifiedAt=new Date(now-120001).toISOString(),i=>i.schedule.schedule[1].verified=false,i=>i.schedule.schedule[1].unresolvedReschedule=true,i=>i.schedule.schedule[1].kickoff=null,i=>i.schedule.revision=2,i=>i.schedule.schedule.push({...i.schedule.schedule[0]}),i=>i.week=19]){const x=input();mutate(x);assert.equal(c.current(x),null);}
});
test('future weeks follow the same closed-period conditions, not a Week10 allowlist',()=>{
 const x=input();x.week=x.control.activeWeek=x.schedule.week=11;assert.equal(c.current(x).entry.status,'CLOSED');x.control.status='UPCOMING';assert.equal(c.current(x),null);
});
test('published closure history preserves past facts but cannot close current/future weeks',()=>{
 const records=[{week:9,observedAt:new Date(now-1000).toISOString(),deadline},{week:10,observedAt:new Date(now-1000).toISOString(),deadline}];const p={activeWeek:10,revision:2,now,maxAgeMs:120000},result=c.history(records,p);assert.deepEqual([...result.keys()],[9]);assert.equal(result.get(9).snapshotRevision,2);assert.equal(result.get(9).entry.status,'CLOSED');
 for(const bad of [[...records,records[0]],[{...records[0],week:19}],[{...records[0],observedAt:new Date(now+1).toISOString()}],[{...records[0],secret:'forbidden'}]])assert.throws(()=>c.history(bad,p));
});
test('only validated captured published CLOSED periods become durable history facts',()=>{
 const r=require('./support/static-snapshot-example.cjs').snapshotExample(),at=Date.parse(r.snapshot.generatedAt),{generate}=require('../tools/snapshots/publisher.cjs');const file=generate(r,{version:1,entries:[]},at,{approvedAliases:new Map(r.aliases.map(a=>[a.player,a.alias])),retention:{publicAggregates:true}}).file;
 const original=JSON.stringify(file),facts=c.publishedFacts(file,at+86400000);assert.deepEqual(facts.map(f=>f.week),[1,2,3,4,5,6,7,8]);assert(facts.every(f=>Object.keys(f).sort().join(',')==='deadline,observedAt,week'));assert.equal(JSON.stringify(file),original);
 assert.throws(()=>c.publishedFacts(file,at-1));const forged=structuredClone(file);forged.payload.snapshot.weeks[8].entry.status='CLOSED';assert.throws(()=>c.publishedFacts(forged,at+1));
});
