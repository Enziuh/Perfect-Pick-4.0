'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');const {example}=require('./support/pp3-api-example.cjs');const {decode}=require('../tools/api/browser-client.cjs');
test('assumed23 pools do not change actual submissions, ranks or scores, and are never collected funds',()=>{
 const x=example();x.cfg.authority=x.e.authority;const before=x.get();x.cfg.prizeParticipants=23;const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');assert.deepEqual(r.snapshot.standings,before.snapshot.standings);assert.deepEqual(r.snapshot.weeks,before.snapshot.weeks);const p=r.snapshot.prizes.find(p=>p.key==='W1');assert.equal(p.poolCents,11500);assert.equal(p.poolState,'PROJECTED');assert.equal(p.estimateBasis.participantsPerWeek,23);assert.equal(p.allocationState,'UNAVAILABLE');assert.equal(p.paymentState,'UNKNOWN');assert(!p.allocations&&!p.rollover);assert.equal(decode(r,x.e.policy.now).prizes.estimateBasis.kind,'ASSUMED_NOT_COLLECTED');
});
test('estimated rollover and original monthly shares use23, never private payment records',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.cfg.prizeParticipants=23;x.matrix.Responses.slice(1).forEach(r=>{if(r[3])r[3]='Lions';});const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const p=r.snapshot.prizes.find(p=>p.key==='W1'),m=r.snapshot.prizes.find(p=>p.key==='M1');assert.equal(p.estimatedRolloverCents,11500);assert.equal(m.poolCents,5750);assert.equal(m.funding.seasonContributionCents,5750);assert.equal(m.poolState,'PROJECTED');assert(!m.allocations);const model=decode(r,x.e.policy.now);assert.equal(model.prizeViews[1].rollover,115);assert.equal(model.prizes.periods[0].monthlyWinnerPool,57.5);
});
test('open/unknown entry scopes never disclose outcome-based estimated rollovers or voting',()=>{
 const x=example();x.cfg.prizeParticipants=23;const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');assert(r.snapshot.prizes.filter(p=>p.key[0]==='W').every(p=>p.poolCents===11500&&p.estimatedRolloverCents===null));assert(r.snapshot.weeks.every(w=>!w.picks&&!w.votes));assert.equal(r.snapshot.prizes.find(p=>p.key==='M1').poolCents,null);
});
test('updating assumed count changes estimates only and invalid counts fail closed',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.cfg.prizeParticipants=24;assert.equal(x.get().snapshot.prizes[0].poolCents,12000);for(const n of [0,-1,1.5,'23',1001]){x.cfg.prizeParticipants=n;assert.equal(x.get().state,'UNAVAILABLE');}
});
