'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {STAGE}=require('../tools/security/public-artifact.cjs');
// Test the exact adapter included in the staged artifact, not a separate resolver.
const {resolveMonthlyChampion,validate}=require(path.join(STAGE,'preview-data.js'));
const base=JSON.parse(fs.readFileSync(path.join(STAGE,'fixtures/preview.json'),'utf8'));
const {createScenario}=require('./support/monthly-scenarios.cjs');
const resolve=d=>resolveMonthlyChampion(d.prizes.periods[0],d.weeks);
for(const [name,state,winner] of [
 ['in-progress','IN PROGRESS',null],['clear-leader','MONTHLY CHAMPION','Synthetic Comet'],
 ['decisive','MONTHLY CHAMPION','Synthetic Comet'],['equal-distance','UNRESOLVED TIE',null],
 ['no-eligible','NO ELIGIBLE TIEBREAKER',null],['awaiting-score','AWAITING FINAL SCORE',null],
 ['zero-completed','IN PROGRESS',null],['not-closed','IN PROGRESS',null],
 ['one-eligible','MONTHLY CHAMPION','Synthetic Comet'],['zero-prediction','MONTHLY CHAMPION','Synthetic Comet']]){
 test(`monthly scenario: ${name}`,()=>{
  const d=validate(createScenario(name,base)),before=JSON.stringify(d),r=resolve(d);
  assert.equal(r.status,state);assert.equal(r.winner,winner);assert.equal(JSON.stringify(d),before,'Resolver must not mutate scores, ranks, pots or inputs');
  if(name==='decisive'){
   assert.equal(r.actualTotal,38);assert.equal(r.winningDifference,2);assert.equal(r.margin,4);
   assert.deepEqual(r.comparisons.map(p=>[p.name,p.prediction,p.difference]),[['Synthetic Comet',40,2],['Synthetic Maple',44,6]]);
   assert.equal(d.prizes.periods[0].standings.filter(p=>p.rank===1).length,2);
  }
  if(name==='equal-distance')assert.deepEqual(r.comparisons.map(p=>p.difference),[2,2]);
  if(name==='no-eligible')assert(r.comparisons.every(p=>p.prediction===null && !p.eligible));
  if(name==='not-closed')assert.deepEqual(r.comparisons,[]);
  if(name==='one-eligible')assert.equal(r.margin,null);
  if(name==='zero-prediction')assert.equal(r.winningDifference,0);
  if(name==='zero-completed')assert(d.prizes.periods[0].standings.every(p=>p.completedGames===0));
 });
}
test('winner is independent of array/name ordering and stale leader metadata',()=>{
 const d=createScenario('decisive',base),expected=resolve(d);
 d.prizes.periods[0].standings.reverse();d.prizes.periods[0].leaders=['Synthetic Orbit'];
 d.weeks.reverse();d.weeks.forEach(w=>{w.standings.reverse();w.results.reverse();});
 assert.deepEqual(resolve(d),expected);
 const staleActual=createScenario('decisive',base);staleActual.prizes.periods[0].tiebreakRule.actualTotal=999;assert.equal(resolve(staleActual).actualTotal,38);
 const tie=createScenario('equal-distance',base);tie.prizes.periods[0].standings.reverse();tie.weeks[3].standings.reverse();
 assert.equal(resolve(tie).winner,null);
});
test('invalid, blank, and absent predictions are never coerced to zero',()=>{
 for(const invalid of ['', ' ', 'NaN','-1','1.5','Infinity','0x28',null,undefined,false,0]){
  const d=createScenario('decisive',base);
  d.weeks[3].standings.filter(p=>['Synthetic Comet','Synthetic Maple'].includes(p.name)).forEach(p=>{p.tiebreakPrediction=invalid;});
  const r=resolve(d);assert.equal(r.status,'NO ELIGIBLE TIEBREAKER');assert.equal(r.winner,null);assert(r.comparisons.every(p=>p.prediction===null));
  if(invalid!=='')assert.throws(()=>validate(d),'Strict adapter must reject malformed predictions before rendering');
 }
});
test('completion flags cannot fabricate completion or use an arbitrary last game',()=>{
 for(const mutate of [
  d=>{d.weeks[2].results[0].status='Pending';},d=>{d.prizes.periods[0].allWeeksFinalized=false;},
  d=>{d.weeks.splice(1,1);},d=>{d.weeks.push(structuredClone(d.weeks[0]));},
  d=>{d.prizes.periods[0].tiebreakRule.game='';},d=>{d.weeks[3].results[1].team1Score='';},
  d=>{d.weeks[3].results[1].team1Score=' ';},d=>{d.weeks[3].results[1].winner='';},
  d=>{d.weeks[3].tiebreak.revealed=false;},
  d=>{d.weeks[3].results[1].status='Pending';d.prizes.periods[0].tiebreakRule.actualTotal=38;d.prizes.periods[0].tiebreakRule.status='Final';},d=>{d.prizes.periods[0].standings[0].points++;},
  d=>{d.weeks[3].results.push(structuredClone(d.weeks[3].results[1]));}
 ]){
  const d=createScenario('decisive',base);mutate(d);assert.notEqual(resolve(d).status,'MONTHLY CHAMPION');assert.equal(resolve(d).winner,null);
 }
});
test('all non-CLOSED states fail closed before any prediction can enter the output',()=>{
 for(const state of ['OPEN','UNKNOWN','UPCOMING',undefined,'closed']){
  const d=createScenario('decisive',base);d.weeks[3].entriesStatus=state;
  d.weeks[3].standings.forEach(p=>{p.tiebreakPrediction='PRIVATE_TEST_MARKER';});
  const r=resolve(d);assert.equal(r.status,'IN PROGRESS');assert.equal(r.winner,null);assert.deepEqual(r.comparisons,[]);assert(!JSON.stringify(r).includes('PRIVATE_TEST_MARKER'));
 }
});
