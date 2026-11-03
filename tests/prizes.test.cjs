"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {STAGE}=require('../tools/security/public-artifact.cjs');
const {buildWeeklyPrize}=require(path.join(STAGE,'preview-data.js'));
const data=JSON.parse(fs.readFileSync(path.join(STAGE,'fixtures/preview.json')));
test('weekly allocations distinguish confirmed winners, rollovers and missing payment data',()=>{
 const winner=buildWeeklyPrize(data.prizes.weekly[0],data.weeks[0]);
 assert.equal(winner.status,'WINNERS CONFIRMED');assert.equal(winner.allocationEach,10);
 assert.deepEqual(winner.winners,['Synthetic Comet','Synthetic Maple']);
 assert.equal(winner.payment,'Payment status unavailable');assert.equal(winner.rollover,null);
 const rollover=buildWeeklyPrize(data.prizes.weekly[1],data.weeks[1]);
 assert.equal(rollover.status,'ROLLOVER CONFIRMED');assert.equal(rollover.rollover,20);
 const missing=structuredClone(data.prizes.weekly[0]);delete missing.perfectPayoutEach;delete missing.weeklyPot;
 assert.equal(buildWeeklyPrize(missing,data.weeks[0]).allocationEach,null);
 assert.equal(buildWeeklyPrize(missing,data.weeks[0]).pool,null);
 assert.equal(buildWeeklyPrize({...missing,weeklyPot:0},data.weeks[0]).pool,0);
});
test('unconfirmed results and non-CLOSED periods cannot reveal prize winners',()=>{
 for(const entriesStatus of ['OPEN','UNKNOWN','UPCOMING',undefined]){
  const week={entriesStatus,get outcome(){throw Error('private read');}};
  const view=buildWeeklyPrize(data.prizes.weekly[0],week);
  assert.deepEqual(view.winners,[]);assert.equal(view.allocationEach,null);assert.equal(view.rollover,null);
 }
 const week=structuredClone(data.weeks[0]);week.results[0].status='Pending';
 assert.deepEqual(buildWeeklyPrize(data.prizes.weekly[0],week).winners,[]);
 week.results[0].status='Final';week.results[0].team1Score='';
 assert.deepEqual(buildWeeklyPrize(data.prizes.weekly[0],week).winners,[]);
 assert.deepEqual(buildWeeklyPrize({...data.prizes.weekly[0],week:2},data.weeks[0]).winners,[]);
 const row={...data.prizes.weekly[1],rolloverToMonthly:19};
 assert.equal(buildWeeklyPrize(row,data.weeks[1]).rollover,null);
 const mismatch={...data.prizes.weekly[0],perfectPickWinnerNames:['Synthetic Harbor']};
 assert.deepEqual(buildWeeklyPrize(mismatch,data.weeks[0]).winners,[]);
});
test('actual week loader coalesces concurrent reads and retries failed reads',async()=>{
 const source=fs.readFileSync(path.join(STAGE,'app.js'),'utf8');
 const start=source.indexOf('  async function loadWeek('),end=source.indexOf('  function setStatus(',start);
 let calls=0,fail=false;
 const load=vm.runInNewContext(`(${source.slice(start,end).trim()})`,{weekCache:new Map(),get:async()=>{calls++;await Promise.resolve();if(fail)throw Error('fixture unavailable');return {week:1};}});
 const results=await Promise.all([load(1),load(1),load(1)]);
 assert.equal(calls,1);assert.equal(results[0],results[2]);
 fail=true;await assert.rejects(load(2));fail=false;await load(2);assert.equal(calls,3);
});

test('currency formatting reuses one formatter and never converts unavailable amounts to zero',()=>{
 const source=fs.readFileSync(path.join(STAGE,'app.js'),'utf8');
 const start=source.indexOf('  const currencyFormatter'),end=source.indexOf('  async function get(',start);
 let constructions=0;
 const money=vm.runInNewContext(`(()=>{${source.slice(start,end)}return money;})()`,{Intl:{NumberFormat:function(...args){constructions++;return new Intl.NumberFormat(...args);}}});
 for(let i=0;i<100;i++)assert.equal(money(20),'$20.00');
 assert.equal(constructions,1);assert.equal(money(0),'$0.00');
 for(const value of [null,undefined,'20',NaN,-1])assert.equal(money(value),'Unavailable');
});
