'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {STAGE}=require('../tools/security/public-artifact.cjs');
const {buildMatchView,validate}=require(path.join(STAGE,'preview-data.js'));
const base=JSON.parse(fs.readFileSync(path.join(STAGE,'fixtures/preview.json'),'utf8'));
const {createMatchScenario}=require('./support/match-scenarios.cjs');
test('Final results determine correct/incorrect picks without changing points or ranks',()=>{
 const data=structuredClone(base),before=JSON.stringify(data),week=data.weeks[0];
 const model=buildMatchView(week,week.games[0]);
 assert.equal(model.winner,'Bears');assert.equal(model.isFinal,true);
 assert.equal(model.selections.find(p=>p.name==='Synthetic Comet').state,'correct');
 assert.equal(model.selections.find(p=>p.name==='Synthetic Harbor').state,'wrong');
 assert.equal(JSON.stringify(data),before);
 const tie=buildMatchView(data.weeks[1],data.weeks[1].games[0]);
 assert.equal(tie.winner,'Tie');assert(tie.selections.every(p=>p.state==='wrong'));
});
test('scheduled/in-progress/nonfinal states cannot award correctness, even with stale pick flags',()=>{
 for(const status of ['Pending','Scheduled','In Progress']){
  const week=structuredClone(base.weeks[2]);week.results[0].status=status;week.results[0].winner='Bears';
  week.standings.forEach(p=>{p.picks[0].correct=true;p.picks[0].status='Final';});
  const model=buildMatchView(week,week.games[0]);assert.equal(model.isFinal,false);assert.equal(model.winner,'');assert(model.selections.every(p=>p.state==='pending'));
 }
 const d=validate(createMatchScenario('pending-scores',base));
 const model=buildMatchView(d.weeks[2],d.weeks[2].games[0]);assert.deepEqual(model.scores,['7','0']);assert(model.selections.every(p=>p.state==='pending'));
});
test('both teams, zero votes and zero-percent winners are represented accurately',()=>{
 for(const name of ['zero-votes','one-sided']){
  const d=validate(createMatchScenario(name,base)),model=buildMatchView(d.weeks[0],d.weeks[0].games[0]);
  assert.equal(model.votes.teams.length,2);
  assert.deepEqual(model.votes.teams.map(p=>p.percentage),name==='zero-votes'?[0,0]:[0,100]);
  assert.deepEqual(model.votes.teams.map(p=>p.count),name==='zero-votes'?[0,0]:[0,4]);
  assert.equal(model.winner,'Bears');assert(!JSON.stringify(model).includes('NaN'));
 }
 const week=structuredClone(base.weeks[0]);week.standings.pop();
 week.standings.forEach((p,i)=>{p.picks[0].pick=i?'Lions':'Bears';});
 const model=buildMatchView(week,week.games[0]);assert.deepEqual(model.votes.teams.map(p=>p.percentage),[33.3,66.7]);
 assert.equal(model.votes.teams.reduce((n,p)=>n+p.percentage,0),100);
});
test('unconfirmed closure stops before selection data is read or exposed',()=>{
 for(const entriesStatus of ['OPEN','UNKNOWN','UPCOMING',undefined,'closed']){
  const week={...base.weeks[0],entriesStatus};
  Object.defineProperty(week,'standings',{get(){throw new Error('Private selections read');}});
  const model=buildMatchView(week,week.games[0],{picksClose:'2000-01-01'});
  assert.equal(model.votes,null);assert.deepEqual(model.selections,[]);
 }
});
test('kickoff appears only for an explicitly supplied matching week and matchup',()=>{
 const control=base.prizes.formControl,week=base.weeks[4];
 assert.equal(buildMatchView(week,control.firstGame,control).kickoff,control.firstKickoff);
 assert.equal(buildMatchView(week,week.games[1],control).kickoff,'');
 assert.equal(buildMatchView(base.weeks[0],control.firstGame,control).kickoff,'');
 assert.equal(buildMatchView(week,control.firstGame,{...control,firstKickoff:''}).kickoff,'');
 const missing=structuredClone(week);missing.results=[];assert.equal(buildMatchView(missing,week.games[0]).status,'Unavailable');
});
test('strict fixtures reject ambiguous identities, votes, scores and unsupported live-status fields',()=>{
 for(const mutate of [
  d=>d.weeks[0].standings.push(structuredClone(d.weeks[0].standings[0])),
  d=>d.weeks[0].standings[0].picks[0].pick='Chiefs',
  d=>d.weeks[0].standings[0].picks[1].game=d.weeks[0].games[0],
  d=>d.weeks[0].results[1].game=d.weeks[0].results[0].game,
  d=>d.weeks[0].results[0].team1Score=0.5,
  d=>d.weeks[0].results[0].status='In Progress',
  d=>d.weeks[0].results[0].kickoff='2099-10-01T23:00:00.000Z'
 ]){const d=structuredClone(base);mutate(d);assert.throws(()=>validate(d));}
});
