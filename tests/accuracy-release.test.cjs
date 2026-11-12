'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {snapshotExample}=require('./support/static-snapshot-example.cjs');
const accuracy=require('../tools/scoring/roster-accuracy.cjs');
const {render}=require('../tools/snapshots/cloud-package.cjs');
test('publisher fallback inherits validated accuracy opt-in and keeps legacy sources disabled without property writes',()=>{
 const original=render(),marker=' const result=provider.createLegacyProvider';assert.equal(original.split(marker).length,2);
 const instrumented=original.replace(marker,' return cfg;\n'+marker),reply=snapshotExample(),now=Date.parse(reply.snapshot.generatedAt),Clock=class extends Date{static now(){return now;}};
 const ctx=vm.createContext({Date:Clock});vm.runInContext(instrumented,ctx);
 const config={approvedAliases:reply.aliases};const call=()=>{ctx.replyJSON=JSON.stringify(reply);ctx.configJSON=JSON.stringify(config);return vm.runInContext('pp4CloudDeadlineSource_(JSON.parse(replyJSON),JSON.parse(configJSON))',ctx);};const old=call();assert.equal(old.accuracyRules,undefined);assert.equal(old.rosterFromWeek1,undefined);
 reply.snapshot.accuracy=accuracy.create(reply.snapshot,reply.aliases);
 const next=call();assert.equal(next.accuracyRules,'ROSTER_FINAL_V1');assert.equal(next.rosterFromWeek1,true);assert.equal(next.lateEntryRules,'LATE_ENTRY_V1');assert.equal(next.lateEntryStartWeek,9);
 reply.snapshot.accuracy.version='UNKNOWN';assert.throws(()=>call());
});
