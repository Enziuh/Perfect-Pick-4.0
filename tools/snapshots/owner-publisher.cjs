'use strict';
// Runs ONLY on the authorized owner Mac. Never run in GitHub Actions.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict'),{isDeepStrictEqual}=require('node:util');
const {target,atomic}=require('./local-state.cjs'),{validate}=require('./schema.cjs'),{generate,readPublicApi}=require('./publisher.cjs'),{production}=require('./pages-artifact.cjs'),{contentHash}=require('./content.cjs'),{plan}=require('./activity.cjs');
const ROOT=path.resolve(__dirname,'../..'),HOME=path.join(os.homedir(),'Library/Application Support/Perfect Pick/Private Registry'),CONFIG=path.join(HOME,'static-publisher.private.json'),STATE=path.join(HOME,'static-publisher-state.private.json');
function exec(command,args,options={}){return cp.execFileSync(command,args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe'],...options});}
function privateInputs(){
 const cfg=JSON.parse(fs.readFileSync(target(CONFIG),'utf8'));assert.equal(cfg.approved,true);assert.equal(cfg.expectedPlayers,23);assert.equal(cfg.expectedGames,272);
 const found=exec('/usr/bin/security',['find-generic-password','-a','PerfectPickOwner','-s','PerfectPickStaticSnapshotRecoveryV1','-w']);const key=Buffer.from(found.trim(),'hex');let store;
 try{store=require('./encrypted-backup.cjs').decrypt(JSON.parse(fs.readFileSync(target(path.join(HOME,'identity-recovery-generation-1.enc.json')))),key,{expectedGeneration:1});const independent=JSON.parse(fs.readFileSync(target(path.join(HOME,'independent-recovery-generation-1.private.json'))));assert(isDeepStrictEqual(store,require('./encrypted-backup.cjs').decrypt(independent.backup,key,{expectedGeneration:1})));assert(isDeepStrictEqual(store,JSON.parse(fs.readFileSync(target(path.join(HOME,'identity-map.private.json'))))));assert.equal(store.entries.length,23);}finally{key.fill(0);}
 return {cfg,store};
}
function publicParity(reply,file,store){
 const map=new Map(store.entries.map(e=>[e.sourceKey,e.publicId])),wanted=require('./schema.cjs').projectReply(reply,map),actual=file.payload.snapshot;
 assert(isDeepStrictEqual(actual.games,wanted.snapshot.games));assert(isDeepStrictEqual(file.aggregateStandings,require('./aggregate-standings.cjs').project(wanted)));
 for(const week of actual.weeks){if(week.week<=8)assert(isDeepStrictEqual(week,wanted.snapshot.weeks.find(w=>w.week===week.week)));else assert(!week.picks&&!week.votes);}
 assert(file.payload.aliases.every(a=>store.entries.some(e=>e.publicId===a.player)));
}
function nextRefreshAt(reply,file,now){
 const next=Math.min(Date.parse(plan(reply,now).nextCheckAt),Date.parse(file.expiresAt)-1800000);
 if(!Number.isFinite(next)||next<=now)throw Error('Fresh publication window required');return new Date(next).toISOString();
}
async function run({publish=false,force=false}={}){
 if(process.env.GITHUB_ACTIONS)throw Error('Owner environment required');
 const lock=path.join(HOME,'static-publisher.lock');target(CONFIG);try{fs.mkdirSync(lock,{mode:0o700});}catch{throw Error('Publisher already running or lock requires owner inspection');}
 try{
  let previous=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(target(STATE))):null;
  if(previous?.state==='QUEUED'){
   const runs=JSON.parse(exec('gh',['run','list','--workflow','pages.yml','--branch','develop','--commit',previous.commit,'--json','databaseId,status,conclusion','--limit','5']));
   if(!runs.length||runs[0].status!=='completed')return {state:'WAITING_FOR_VERIFICATION'};assert.equal(runs[0].conclusion,'success');
   const response=await fetch('https://enziuh.github.io/Perfect-Pick-4.0/data/snapshot.json',{cache:'no-store',signal:AbortSignal.timeout(20000)});assert(response.ok);const text=await response.text();production(JSON.parse(text),Date.now());assert.equal(require('node:crypto').createHash('sha256').update(text).digest('hex'),previous.snapshotHash);
   const deployment=JSON.parse(exec('gh',['run','view',String(runs[0].databaseId),'--json','jobs'])).jobs.find(j=>j.name==='deploy'&&j.conclusion==='success');assert(deployment&&Number.isFinite(Date.parse(deployment.completedAt)));
   previous={...previous,state:'VERIFIED',lastPublishedAt:deployment.completedAt,lastVerifiedAt:new Date().toISOString()};atomic(STATE,previous);
  }
  if(!force&&previous?.nextRunAt&&Date.parse(previous.nextRunAt)>Date.now())return {state:'NOT_DUE'};
  const {cfg,store}=privateInputs();const aliases=new Map(cfg.approvedAliases.map(a=>[a.player,a.alias]));assert.equal(aliases.size,23);
  const reply=await readPublicApi({endpoint:cfg.endpoint,approved:true,rules:'LATE_ENTRY_V1'}),now=Date.now(),result=generate(reply,store,now,{approvedAliases:aliases,preserveIds:true,retention:{publicAggregates:true}}),file=production(result.file,now);assert(isDeepStrictEqual(result.store,store));publicParity(reply,file,store);
  const refreshPlan=plan(reply,now),nextRunAt=nextRefreshAt(reply,file,now),old=fs.existsSync(path.join(ROOT,'public-data/snapshot.json'))?JSON.parse(fs.readFileSync(path.join(ROOT,'public-data/snapshot.json'))):null;
  if(old){for(const w of file.payload.snapshot.weeks.filter(w=>w.week<=8)){const prior=old.payload.snapshot.weeks.find(p=>p.week===w.week);assert(isDeepStrictEqual(w.picks,prior?.picks));assert(isDeepStrictEqual(w.votes,prior?.votes));}for(const table of file.aggregateStandings.filter(t=>/^W[1-8]$/.test(t.key)||['M1','M2'].includes(t.key)))assert(isDeepStrictEqual(table,old.aggregateStandings.find(t=>t.key===table.key)));}
  if(old&&contentHash(old)===contentHash(file)&&Date.parse(old.expiresAt)-now>refreshPlan.intervalMs+900000){atomic(STATE,{state:'UNCHANGED',nextRunAt,lastPublishedAt:previous?.lastPublishedAt??null});return {state:'UNCHANGED',nextRunAt};}
  const stage=path.join(ROOT,'tmp/static-owner-candidate-'+require('node:crypto').randomBytes(8).toString('hex'));require('./artifact.cjs').stage(file,stage,now,true);require('./artifact.cjs').verify(stage,now,true);
  // Validate only generated public material before atomic promotion into Git input.
  fs.mkdirSync(path.join(ROOT,'public-data'),{recursive:true});const dest=path.join(ROOT,'public-data/snapshot.json'),pending=dest+'.pending';fs.writeFileSync(pending,JSON.stringify(file),{mode:0o600,flag:'wx'});try{validate(JSON.parse(fs.readFileSync(pending)),Date.now());fs.renameSync(pending,dest);}finally{fs.rmSync(pending,{force:true});}
  if(!publish)return {state:'PREPARED',players:23,games:272,files:38,retainedWeeks:file.retention.weeks,nextRunAt};
  assert.equal(cfg.publicationApproved,true);assert.equal(exec('git',['branch','--show-current']).trim(),'develop');assert.equal(exec('git',['remote','get-url','origin']).trim(),'https://github.com/Enziuh/Perfect-Pick-4.0.git');
  // Never carry unrelated local changes into an unattended release.
  const changes=exec('git',['status','--porcelain','--untracked-files=all']).split('\n').filter(Boolean);assert(changes.every(line=>line.slice(3)==='public-data/snapshot.json'));
  exec('node',['tools/snapshots/pages-artifact.cjs','stage']);exec('node',['tools/snapshots/pages-artifact.cjs','verify']);
  exec('git',['add','--','public-data/snapshot.json']);exec('git',['commit','-m','Refresh validated public competition snapshot']);exec('git',['push','origin','develop']);exec('gh',['workflow','run','pages.yml','--ref','develop','-f','profile=static']);
  // Queued is not deployed. Owner monitoring must verify Actions and CDN receipt.
  atomic(STATE,{state:'QUEUED',snapshotHash:require('node:crypto').createHash('sha256').update(JSON.stringify(file)).digest('hex'),commit:exec('git',['rev-parse','HEAD']).trim(),nextRunAt,lastPublishedAt:previous?.lastPublishedAt??null,queuedAt:new Date().toISOString()});
  return {state:'QUEUED',nextRunAt};
 }finally{fs.rmdirSync(lock);}
}
if(require.main===module)run({publish:process.argv.includes('--publish'),force:process.argv.includes('--force')}).then(r=>console.log(JSON.stringify(r))).catch(()=>{console.error('Private publisher BLOCKED; no private details logged. Last deployed snapshot unchanged.');process.exitCode=1;});
module.exports={run,publicParity,nextRefreshAt};
