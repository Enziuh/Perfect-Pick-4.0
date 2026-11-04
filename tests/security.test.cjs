'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {validate,APPROVED_ALIASES}=require('../website/preview-data.js');
const {verify,STAGE,FILES}=require('../tools/security/public-artifact.cjs');
const fixture=JSON.parse(fs.readFileSync(path.join(STAGE,'fixtures/preview.json')));
test('fixture is strictly synthetic and covers all entry/result states',()=>{
 validate(fixture);
 assert.deepEqual(fixture.aliases,APPROVED_ALIASES);
 for(const state of ['CLOSED','OPEN','UNKNOWN','UPCOMING'])assert(fixture.weeks.some(w=>w.entriesStatus===state));
 assert(fixture.weeks.some(w=>w.outcome.perfectWinners.length>1));
 assert(fixture.weeks.some(w=>w.results.some(r=>r.winner==='Tie')));
 assert(fixture.weeks.some(w=>w.tiebreak.revealed && w.results.some(r=>r.status==='Pending')));
});
test('unknown keys, identities, malformed data and premature disclosure rejected',()=>{
 for(const mutate of [d=>d.notes='private',d=>d.prizes.periods[0].displayName='Unapproved label',d=>d.prizes.projectedSeasonPot=10000000000,d=>d.aliases[0]='Unapproved',d=>d.weeks[0].standings[0].name='Unapproved',d=>d.weeks[4].standings.push(d.weeks[0].standings[0]),d=>d.weeks[5].tiebreak.revealed=true,d=>d.prizes.currentWeekStandings.push(d.weeks[0].standings[0]),d=>delete d.weeks[0].entriesStatus,d=>d.weeks[0].results[0].team1Score='<img>']){
  const copy=structuredClone(fixture);mutate(copy);assert.throws(()=>validate(copy));
 }
});
test('adapter uses one fixed fixture URL and refuses alternate resources',async()=>{
 const requested=[];
 const context={fetch:async(url,opts)=>{requested.push([url,opts]);return {ok:true,json:async()=>structuredClone(fixture)};},structuredClone};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(STAGE,'preview-data.js'),'utf8'),context);
 await context.PerfectPickPreview.get('prizes');await context.PerfectPickPreview.get('week','&week=1');
 await assert.rejects(()=>context.PerfectPickPreview.get('week','&week=1&api=external'));
 assert.equal(requested.length,1);assert.equal(requested[0][0],'./fixtures/preview.json');assert.equal(requested[0][1].redirect,'error');
});
test('staged artifact rejects unexpected files, symlinks and prohibited content',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pp-stage-test-'));
 try{
  fs.cpSync(STAGE,temp,{recursive:true});verify(temp);
  for(const name of ['extra.json','bundle.js.map','archive.zip','.env']){
   fs.writeFileSync(path.join(temp,name),'test');assert.throws(()=>verify(temp));fs.unlinkSync(path.join(temp,name));
  }
  fs.symlinkSync(path.join(temp,'config.js'),path.join(temp,'link.js'));assert.throws(()=>verify(temp));fs.unlinkSync(path.join(temp,'link.js'));
  for(const markup of ['<a href="#unapproved">Invalid route</a>','<script src="#overview"></script>']){
   const p=path.join(temp,'index.html'),old=fs.readFileSync(p);fs.appendFileSync(p,markup);assert.throws(()=>verify(temp));fs.writeFileSync(p,old);
  }
  for(const marker of ['https://example.invalid/blocked','-----BEGIN PRIVATE KEY-----','api_key: "synthetic"']){
   const p=path.join(temp,'config.js'),old=fs.readFileSync(p);fs.appendFileSync(p,'\n// '+marker);assert.throws(()=>verify(temp));fs.writeFileSync(p,old);
  }
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
 assert.equal(FILES.length,38);assert.equal(FILES.filter(f=>f.startsWith('assets/teams/')).length,32);
});
test('manual deployment remains develop-only and verification precedes upload',()=>{
 const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/pages.yml'),'utf8');
 assert(workflow.includes('workflow_dispatch:'));
 assert.equal((workflow.match(/if: github.ref == 'refs\/heads\/develop'/g)||[]).length,2);
 assert(workflow.includes('permissions: {}'));
 assert(workflow.includes('persist-credentials: false'));
 assert(workflow.includes('fetch-depth: 0'));
 assert(workflow.includes('ref: ${{ github.sha }}'));
 assert(!/continue-on-error|pull_request_target|\bpush:/.test(workflow));
 assert(workflow.indexOf('node --test')<workflow.indexOf('public-artifact.cjs verify'));
 assert(workflow.indexOf('public-artifact.cjs verify')<workflow.indexOf('actions/upload-pages-artifact'));
 const deploy=workflow.slice(workflow.indexOf('\n  deploy:'));
 assert(deploy.includes('needs: verify'));assert(!/uses:\s*actions\/checkout|^\s*run:/m.test(deploy));
});
test('artifact seal rejects modifications even when content remains otherwise valid',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pp-seal-test-'));
 try{
  fs.cpSync(STAGE,temp,{recursive:true});verify(temp,true);
  fs.appendFileSync(path.join(temp,'styles.css'),'\n/* changed */\n');
  assert.throws(()=>verify(temp,true),/changed after staging/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
