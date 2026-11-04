'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {startLiveClient}=require('../tools/presentation/live-client.js');
const {createViewAdapter}=require('../tools/presentation/contract-dashboard.cjs');
const {createSheetDashboard}=require('../tools/presentation/sheet-dashboard.cjs');
const {liveSheetExample}=require('./support/live-sheet-example.cjs');
function client(){
 const e=liveSheetExample(),listeners={},events=[],intervals=[],timeouts=[];let count=0,fail=false,fetches=0;
 const root={Event:class {constructor(type){this.type=type;}},setInterval(fn,delay){intervals.push({fn,delay});},setTimeout(fn,delay){timeouts.push({fn,delay});return timeouts.length;},clearTimeout(){},fetch(){fetches++;throw Error();},document:{hidden:false,addEventListener(type,fn){(listeners[type]??=[]).push(fn);},dispatchEvent(event){events.push(event.type);for(const fn of listeners[event.type]||[])fn(event);},getElementById(){return null;}}};
 const get=createSheetDashboard(()=>e.cfg,()=>e.sheets,()=>e.policy.now);
 root.google={script:{get run(){let success,failure;return {withSuccessHandler(fn){success=fn;return this;},withFailureHandler(fn){failure=fn;return this;},getPerfectPickDashboard(){count++;queueMicrotask(()=>fail?failure(Error('PRIVATE_RPC_DETAIL')):success(get()));}};}}};
 const Clock=class extends Date {static now(){return e.policy.now;}};vm.runInNewContext('('+startLiveClient.toString()+')(root,createViewAdapter)',{root,createViewAdapter,Date:Clock,Error,Object,Number,Promise});
 return {root,e,events,intervals,timeouts,get count(){return count;},get fetches(){return fetches;},set fail(v){fail=v;}};
}
test('one RPC populates all view requests; refresh runs every six hours without external fetch',async()=>{
 const c=client();await Promise.all([c.root.PerfectPickPreview.get('prizes'),c.root.PerfectPickPreview.get('week','&week=1')]);assert.equal(c.count,1);assert.equal(c.intervals[0].delay,21600000);c.e.matrix.Results[1][6]='24';await c.intervals[0].fn();assert.equal(c.count,2);assert(c.events.includes('perfectpick:refresh'));assert.equal(c.root.PerfectPickPreview.buildMatchView({week:1},'Bears vs Lions').scores[0],'24');assert.equal(c.fetches,0);
});
test('RPC failures clear prior data, hide raw errors and recover with a later explicit refresh',async()=>{
 const c=client();await c.root.PerfectPickPreview.get('prizes');c.fail=true;await c.intervals[0].fn();assert(c.events.includes('perfectpick:unavailable'));await assert.rejects(c.root.PerfectPickPreview.get('prizes'),{message:'Competition data unavailable'});c.fail=false;await c.intervals[0].fn();assert.equal((await c.root.PerfectPickPreview.get('prizes')).activeWeek,2);assert.equal(c.fetches,0);
});
