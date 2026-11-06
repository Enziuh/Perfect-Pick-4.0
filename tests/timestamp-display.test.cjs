'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createParser}=require('../tools/verification/timestamps.cjs'),late=require('../tools/scoring/late-entry.cjs');
const parser=createParser('America/Los_Angeles');
test('readable Sheets timestamps use authoritative Pacific timezone for all approved whitespace variants',()=>{
 for(const space of [' ','\u00a0','\u202f'])assert.equal(parser.parse('Thursday, November 5, 2026 at 6:54:26'+space+'PM'),'2026-11-06T02:54:26.000Z');
 assert.equal(parser.parse(new Date('2026-11-06T02:54:26.123Z')),'2026-11-06T02:54:26.123Z');
 for(const value of ['Wednesday, November 5, 2026 at 6:54:26 PM','Thursday, November 5, 2026 at 13:54:26 PM','Sunday, March 8, 2026 at 2:30:00 AM','Sunday, November 1, 2026 at 1:30:00 AM'])assert.throws(()=>parser.parse(value));
 assert.equal(parser.parse('Sunday, March 8, 2026 at 3:30:00 AM'),'2026-03-08T10:30:00.000Z');
});
test('formatted and native instants preserve exact cutoff and protected original/first-late entry policy',()=>{
 const now=Date.parse('2026-11-07T12:00:00Z'),e={verified:true,revision:1,verifiedAt:new Date(now).toISOString(),timezone:parser.timeZone,firstGame:'opening',deadline:'2026-11-06T00:15:00.000Z',schedule:[{game:'opening',kickoff:'2026-11-06T01:15:00Z',verified:true,revision:1}]};
 const row=t=>({timestamp:parser.parse(t),selections:[{game:'opening',pick:'CHI'}]});const exact=row('Thursday, November 5, 2026 at 4:15:00 PM'),after=row('Thursday, November 5, 2026 at 4:15:01\u202fPM');assert.equal(late.eligibility(exact.timestamp,'opening',e,now,120000),'ELIGIBLE');assert.equal(late.eligibility(after.timestamp,'opening',e,now,120000),'MISSED_DEADLINE');assert.equal(late.selectEntry([after,exact],e,now,120000).entry,exact);assert.equal(late.selectEntry([row('Friday, November 6, 2026 at 1:00:00 PM'),after],e,now,120000).entry,after);
});
test('prepared compatibility normalizes authoritative native instants only in memory; original Sheet display remains unchanged',()=>{
 const x=require('./support/pp3-api-example.cjs').example();x.cfg.authority=x.e.authority;const baseline=x.get();const native=x.matrix.Responses.slice(1).map(r=>Object.fromEntries(x.matrix.Responses[0].map((h,i)=>[h,h==='Timestamp'?new Date(r[i]):r[i]])));x.matrix.Responses.slice(1).forEach(r=>r[0]='Thursday, November 5, 2026 at 6:54:26\u202fPM');assert.equal(x.get().state,'UNAVAILABLE');x.cfg.nativeTimestampCompatibility=true;x.deps.timezone=()=>parser.timeZone;x.deps.nativeResponses=()=>native;const r=x.get();assert.equal(r.snapshot.state,'READY');assert.deepEqual(r.snapshot.standings,baseline.snapshot.standings);assert.deepEqual(r.snapshot.months,baseline.snapshot.months);assert.deepEqual(r.snapshot.prizes,baseline.snapshot.prizes);assert(x.matrix.Responses.slice(1).every(r=>r[0].includes('\u202f')));
});
test('display parsing is independent of the operating-system/browser timezone',()=>{
 const cp=require('node:child_process'),path=require('node:path'),script=`const p=require(${JSON.stringify(path.resolve('tools/verification/timestamps.cjs'))}).createParser('America/Los_Angeles');process.stdout.write(p.parse('Thursday, November 5, 2026 at 6:54:26\u202fPM'));`;
 for(const TZ of ['UTC','Asia/Tokyo','America/New_York'])assert.equal(cp.execFileSync(process.execPath,['-e',script],{encoding:'utf8',env:{...process.env,TZ}}),'2026-11-06T02:54:26.000Z');
});
test('bounded owner type inspection returns only counts and preserves native subseconds despite readable display',()=>{
 const {inspect}=require('../tools/scoring/timestamp-health.cjs'),time=new Date('2026-11-06T02:54:26.123Z'),calls=[],sheet={getLastRow:()=>2,getRange:(...args)=>{calls.push(args);return args[0]===1?{getValues:()=>[['Timestamp']]}:{getValues:()=>[[time]],getDisplayValues:()=>[['Thursday, November 5, 2026 at 6:54:26\u202fPM']]};}};
 const r=inspect(sheet,'America/Los_Angeles');assert.equal(r.nativeDates,1);assert.equal(r.validInstants,1);assert.equal(r.displaySecondsAgree,1);assert.equal(r.subsecondsPreserved,1);assert.equal(r.writes,0);assert.deepEqual(calls,[[1,1,1,1],[2,1,1,1]]);assert(!JSON.stringify(r).includes('2026-'));assert.equal(time.toISOString(),'2026-11-06T02:54:26.123Z');
});
test('standard 24-hour display and a Sheet filter do not change native timestamp inspection or omit filtered records',()=>{
 const {inspect}=require('../tools/scoring/timestamp-health.cjs');
 const values=[[new Date('2026-11-06T02:54:26.123Z')],[new Date('2026-11-06T03:00:00Z')]],display=[['11/5/2026 18:54:26'],['11/5/2026 19:00:00']],calls=[];
 const sheet={getLastRow:()=>3,isRowHiddenByFilter(){throw Error('Filtered rows must not be excluded');},getFilter(){throw Error('No filter changes or visible-row reads');},getRange(...args){calls.push(args);return args[0]===1?{getValues:()=>[['Timestamp']]}:{getValues:()=>values,getDisplayValues:()=>display};}};
 const before=values.map(r=>r[0].toISOString()),result=inspect(sheet,'America/Los_Angeles');
 assert.equal(result.records,2);assert.equal(result.nativeDates,2);assert.equal(result.validInstants,2);assert.equal(result.invalidInstants,0);assert.equal(result.subsecondsPreserved,1);assert.equal(result.writes,0);assert.deepEqual(calls,[[1,1,1,1],[2,1,2,1]]);assert.deepEqual(values.map(r=>r[0].toISOString()),before);
});
