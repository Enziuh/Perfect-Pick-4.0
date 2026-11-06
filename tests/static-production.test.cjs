'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {generate}=require('../tools/snapshots/publisher.cjs'),{validate}=require('../tools/snapshots/schema.cjs'),{production}=require('../tools/snapshots/pages-artifact.cjs');
function candidate(){const r=require('./support/static-snapshot-example.cjs').snapshotExample(),now=Date.parse(r.snapshot.generatedAt),a={approvedAliases:new Map(r.aliases.map(a=>[a.player,a.alias])),retention:{publicAggregates:true}};return {...generate(r,{version:1,entries:[]},now,a),now,source:r};}
test('production retains only approved weeks while public aggregate standings contain no selection/prediction fields',()=>{
 const {file,now}=candidate();production(file,now);const model=validate(file,now);assert.equal(model.prizes.overallStandings.length,23);
 assert.deepEqual(file.retention.weeks,[1,2,3,4,5,6,7,8]);for(const w of file.payload.snapshot.weeks.filter(w=>w.week>=9)){assert(!w.picks&&!w.votes);assert.equal(model.weeks.find(x=>x.week===w.week).visibility,'WITHHELD');}
 for(const t of file.aggregateStandings)for(const row of t.rows)assert(!('selections'in row)&&!('prediction'in row)&&!('eligibility'in row));
 const rendered=require('../tools/snapshots/local-preview.cjs').assets(file,{production:true});assert(!rendered['index.html'].includes('LOCAL SNAPSHOT PREVIEW'));assert(rendered['index.html'].includes('Perfect Pick 4.1'));assert(!rendered['config.js'].includes('script.google'));assert.equal(Object.keys(rendered).length,38);
});
test('aggregate public allowlist rejects hidden fields, unknown aliases, bad ranks and accuracy without relaxing disclosure',()=>{
 for(const mutate of [f=>f.aggregateStandings[0].rows[0].prediction=42,f=>f.aggregateStandings[0].rows[0].selections=[],f=>f.aggregateStandings[0].rows[0].alias='PRIVATE_FAKE',f=>f.aggregateStandings[0].rows[0].rank=99,f=>f.aggregateStandings[0].rows[0].accuracyBasisPoints=99999,f=>f.payload.snapshot.weeks[8].picks=[],f=>f.retention.weeks.push(9),f=>f.unapproved='PRIVATE_FAKE']){const {file,now}=candidate();mutate(file);assert.throws(()=>production(file,now));}
});
test('production snapshot expires and full static artifact remains explicit with no network fallback',()=>{
 const {file,now}=candidate();assert.throws(()=>production(file,now+21600000));const wf=fs.readFileSync('.github/workflows/pages.yml','utf8');assert(wf.includes('options: [synthetic, api, static]'));assert(wf.indexOf('snapshots/pages-artifact.cjs verify')<wf.indexOf('actions/upload-pages-artifact'));assert(!wf.includes('schedule:'));
 assert(fs.readFileSync('tools/snapshots/owner-publisher.cjs','utf8').includes('if(process.env.GITHUB_ACTIONS)'));assert(!fs.readFileSync('tools/snapshots/browser-client.cjs','utf8').includes('script.google.com'));
});
test('owner refresh is scheduled before expiry with CI margin and rejects an expired publication window',()=>{
 const {file,now,source}=candidate(),{nextRefreshAt}=require('../tools/snapshots/owner-publisher.cjs');
 const next=Date.parse(nextRefreshAt(source,file,now));assert(next<=Date.parse(file.expiresAt)-1800000);assert(next>now);assert.throws(()=>nextRefreshAt(source,{...file,expiresAt:new Date(now).toISOString()},now));
});
