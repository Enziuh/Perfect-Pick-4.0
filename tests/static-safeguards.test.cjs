'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {snapshotExample}=require('./support/static-snapshot-example.cjs'),{generate}=require('../tools/snapshots/publisher.cjs'),{validate}=require('../tools/snapshots/schema.cjs'),{decode}=require('../tools/api/browser-client.cjs');
const {POLICY,SCORE_MAX_AGE_MS,authorized}=require('../tools/snapshots/retention-policy.cjs');
const identity=require('../tools/snapshots/identity-store.cjs'),{registry,PREFIX}=require('../tools/snapshots/private-registry.cjs'),backup=require('../tools/snapshots/encrypted-backup.cjs');
function example(){const reply=snapshotExample(),now=Date.parse(reply.snapshot.generatedAt),approval={approvedAliases:new Map(reply.aliases.map(a=>[a.player,a.alias])),retention:{}};const result=generate(reply,{version:1,entries:[]},now,approval);return {reply,now,approval,...result};}
function memoryRegistry(){const values=new Map(),calls=[];let owner=true,held=false;
 const properties={getProperty(k){assert(k.startsWith(PREFIX));calls.push('read');return values.get(k)??null;},setProperty(k,v){assert(k.startsWith(PREFIX));assert(held);calls.push('write');values.set(k,v);}};
 const service=registry({assertOwner:()=>owner,properties,lock:{waitLock(n){assert.equal(n,10000);assert(!held);held=true;},releaseLock(){held=false;}},digest:t=>crypto.createHash('sha256').update(t).digest('hex')});
 return {values,calls,service,set owner(v){owner=v;}};
}
test('durable owner policy is independent of unchanged120s proof;23-player272-game model parity survives3h',()=>{
 const s=example(),before=decode(s.reply,s.now),after=validate(s.file,s.now+10800000);
 assert.equal(s.file.schema,'PP4_STATIC_V2');assert.deepEqual(s.file.retention.weeks,[1,2,3,4,5,6,7,8]);assert.equal(s.file.payload.snapshot.games.length,272);assert.equal(s.store.entries.length,23);
 for(const field of ['weeks','matchViews','prizeViews','resolutions','form'])assert.deepEqual(after[field],before[field]);
 assert.equal(after.prizes.overallStandings.length,23);assert.deepEqual(after.prizes.overallStandings,before.prizes.overallStandings);
 assert.deepEqual(s.file.payload.snapshot.weeks.map(w=>w.entry),s.reply.snapshot.weeks.map(w=>w.entry));assert.deepEqual(s.file.payload.snapshot.games,s.reply.snapshot.games);
 assert.throws(()=>decode(s.file.payload,s.now+10800000)); // API token remains expired, never broadened.
 assert.equal(after.expiresAt,s.now+SCORE_MAX_AGE_MS);assert.throws(()=>validate(s.file,s.now+SCORE_MAX_AGE_MS));
});
test('missing/expired retention withholds all protected values, names, aggregates and decisions physically',()=>{
 const s=example();for(const retention of [{policy:null},{authorizationUntil:new Date(s.now-1).toISOString()}]){
  const {file}=generate(s.reply,s.store,s.now,{...s.approval,retention});const m=validate(file,s.now+600000);assert.deepEqual(file.payload.aliases,[]);
  assert(file.payload.snapshot.weeks.every(w=>!Object.hasOwn(w,'picks')&&!Object.hasOwn(w,'votes')));assert(file.payload.snapshot.standings.every(t=>!Object.hasOwn(t,'rows')));assert(file.payload.snapshot.months.every(m=>m.winner===null&&!m.comparisons));assert(m.weeks.every(w=>w.standings.length===0));assert(!JSON.stringify(file).includes('ExampleA'));
 }
 const limited=generate(s.reply,s.store,s.now,{...s.approval,retention:{authorizationUntil:new Date(s.now+3600000).toISOString()}}).file;assert(validate(limited,s.now+300000));assert.throws(()=>validate(limited,s.now+3600000));
 assert(!authorized(1,s.reply.snapshot.weeks[0].entry,2026,s.now,{...POLICY,validUntil:new Date(s.now-1).toISOString()}));
});
test('new OPEN or newly CLOSED week never gains retention from a deadline, API token or payload claim',()=>{
 const s=example();assert(!Object.hasOwn(s.file.payload.snapshot.weeks[8],'picks'));
 // A newly CLOSED week still lacks owner disclosure approval: direct policy check.
 const closed={...s.reply.snapshot.weeks[0].entry};assert(!authorized(9,closed,2026,s.now));assert(!authorized(1,closed,2027,s.now));
 for(const mutate of [f=>f.retention.weeks.push(9),f=>f.retention.policyId='unapproved-policy',f=>f.retention.revision++,f=>f.retention.validUntil=new Date(s.now-1).toISOString(),f=>f.payload.snapshot.weeks[0].entry.status='OPEN',f=>f.capturedAt=new Date(s.now+600000).toISOString(),f=>f.expiresAt=new Date(s.now+86400000).toISOString()]){const file=structuredClone(s.file);mutate(file);assert.throws(()=>validate(file,s.now+200000));}
 const active=structuredClone(s.reply);active.activeWeek=8;active.control.activeWeek=8;active.control.reportedStatus='OPEN';const {file}=generate(active,s.store,s.now,s.approval);assert(!file.retention.weeks.includes(8));assert(!Object.hasOwn(file.payload.snapshot.weeks[7],'picks'));assert(!Object.hasOwn(file.payload.snapshot.weeks[7],'votes'));
});
test('private Google property registry saves stable IDs with lock, verified backup and recoverable high-water generation',()=>{
 const s=example(),r=memoryRegistry();assert.throws(()=>r.service.load());const receipt=r.service.save(s.store,0);assert.equal(receipt.players,23);assert(receipt.backupVerified);assert.deepEqual(r.service.load().store,s.store);
 const more=identity.assign(s.store,['p_fabricatednew01']).store;r.service.save(more,1);assert.deepEqual(r.service.load().store,more);
 r.values.set(PREFIX+'PRIMARY','corrupted');assert.throws(()=>r.service.load());r.service.recover(2);assert.deepEqual(r.service.load().store,more);
 // Losing latest backup cannot roll back to an older map and silently rotate IDs.
 r.values.delete(PREFIX+'BACKUP_A');r.values.set(PREFIX+'PRIMARY','corrupted');assert.throws(()=>r.service.recover(1));
 const key=crypto.randomBytes(32),encrypted=backup.encrypt(more,key),recovered=backup.decrypt(encrypted,key);assert.deepEqual(recovered,more);r.service.restore(recovered,2,{verifiedRecovery:true});assert.deepEqual(r.service.load().store,more);
 assert(!JSON.stringify(receipt).includes(s.store.entries[0].sourceKey));assert(!JSON.stringify(receipt).includes(s.store.entries[0].publicId));
});
test('owner boundary, corruption, failed write and unexpected generation block private registry without raw errors',()=>{
 const s=example(),r=memoryRegistry();r.owner=false;assert.throws(()=>r.service.save(s.store,0));assert.equal(r.calls.length,0);r.owner=true;r.service.save(s.store,0);
 const changed=structuredClone(s.store);changed.entries[0].publicId='p_'+'a'.repeat(32);assert.throws(()=>r.service.save(changed,1));assert.throws(()=>r.service.save(s.store,0));
 r.values.set(PREFIX+'BACKUP_B','PRIVATE_SECRET');assert.throws(()=>r.service.load(),{message:'Private registry unavailable'});assert.throws(()=>r.service.recover(1));
 assert.throws(()=>r.service.restore(s.store,1));
});
test('encrypted independent recovery contains no plain identities; wrong key, tampering and bad envelopes fail closed',()=>{
 const s=example(),key=crypto.randomBytes(32),file=backup.encrypt(s.store,key),text=JSON.stringify(file);
 for(const e of s.store.entries){assert(!text.includes(e.sourceKey));assert(!text.includes(e.publicId));}assert.deepEqual(backup.decrypt(file,key),s.store);
 assert.throws(()=>backup.decrypt(file,crypto.randomBytes(32)));assert.throws(()=>backup.decrypt({...file,ciphertext:Buffer.from('PRIVATE_SECRET').toString('base64')},key));assert.throws(()=>backup.decrypt({...file,extra:'PRIVATE_SECRET'},key));
});
test('owner helper is disabled, ES2020 compatible, editor-only and absent from all static assets',()=>{
 const source=require('../tools/snapshots/private-registry-package.cjs').render(),context=vm.createContext({});vm.runInContext(source,context);assert.equal(context.pp4PrivateRegistryConfig_(),null);assert.throws(()=>context.pp4PrivateRegistry_(),/disabled/);assert.throws(()=>context.pp4InitializePrivateRegistry_(),/initialization unavailable/);
 context.pp4PrivateRegistryConfig_=()=>({enabled:true,ownerOnlyEditorReviewed:true,ownerEmail:''});context.Session={getActiveUser:()=>({getEmail:()=>''}),getEffectiveUser:()=>({getEmail:()=>''})};assert.throws(()=>context.pp4PrivateRegistry_(),/disabled/);
 context.pp4PrivateRegistryConfig_=()=>({enabled:true,ownerOnlyEditorReviewed:true,ownerEmail:'owner@example.invalid'});assert.throws(()=>context.pp4PrivateRegistry_(),/owner required/);
 assert(!/function\s+(?:doGet|doPost)|SpreadsheetApp|FormApp|newTrigger|UrlFetchApp|deleteProperty|deleteAllProperties/.test(source));
 const assets=require('../tools/snapshots/local-preview.cjs').assets(example().file);for(const text of Object.values(assets)){assert(!text.includes(PREFIX));assert(!text.includes('PropertiesService'));assert(!text.includes('ownerEmail'));}
});
module.exports={example,memoryRegistry};
test('newly verified CLOSED Week9 still physically withholds picks/votes/predictions until a new owner release',()=>{
 const s=example(),reply=structuredClone(s.reply),week=reply.snapshot.weeks[8],games=reply.snapshot.games.filter(g=>g.week===9),previous=reply.snapshot.weeks[7];
 week.entry={...previous.entry};week.picks=previous.picks.map(p=>({...p,selections:p.selections.map((t,i)=>({game:games[i].game,team:t.team})),prediction:{game:games.at(-1).game,total:p.prediction.total}}));week.votes=previous.votes.map((v,i)=>({...v,game:games[i].game}));reply.control.reportedStatus='CLOSED';
 const table=reply.snapshot.standings.find(t=>t.key==='W9');table.state='AVAILABLE';delete table.reason;table.rows=reply.aliases.map(a=>({...a,rank:1,points:0,completedGames:0,totalPicks:games.length,accuracyBasisPoints:null}));
 assert(decode(reply,s.now));const {file}=generate(reply,s.store,s.now,s.approval);assert(!Object.hasOwn(file.payload.snapshot.weeks[8],'picks'));assert(!Object.hasOwn(file.payload.snapshot.weeks[8],'votes'));assert(!Object.hasOwn(file.payload.snapshot.standings.find(t=>t.key==='W9'),'rows'));assert(!file.retention.weeks.includes(9));validate(file,s.now+3600000);
});
test('six-hour preparation is disabled by default; successful durable backup precedes sealed candidate and atomic history commit',async()=>{
 const {createRefresh}=require('../tools/snapshots/refresh.cjs'),local=require('../tools/snapshots/local-state.cjs'),s=example(),r=memoryRegistry(),root=path.resolve('tmp/retention-publisher-'+crypto.randomBytes(6).toString('hex'));fs.mkdirSync(root,{recursive:true,mode:0o700});r.service.save(s.store,0);let reads=0,source=s.reply,failBackup=false;
 const key=crypto.randomBytes(32),writeBackup=local.independentBackup(path.join(root,'private/recovery.json'),async()=>key),history=local.archive(path.join(root,'private/last-good.json'),()=>s.now);
 const publisher=createRefresh({registry:r.service,backupAndVerify:state=>{if(failBackup)throw Error('PRIVATE_SECRET');return writeBackup(state);},readSource:async()=>{reads++;return source;},approvedAliases:s.approval.approvedAliases,archive:history,clock:()=>s.now,outputRoot:path.join(root,'candidates')});
 const config={prepareEnabled:true,publicationEnabled:false,expectedGames:272,expectedWeeks:18,expectedRosterSize:23};
 try{
  assert.deepEqual(await publisher.prepare(),{state:'DISABLED'});assert.equal(reads,0);assert.equal(publisher.intervalMs,21600000);assert.equal(publisher.unattended,false);
  const [a,b]=await Promise.all([publisher.prepare(config),publisher.prepare(config)]);assert.deepEqual(a,b);assert.equal(reads,1);assert.equal(a.state,'PREPARED_NOT_PUBLISHED');assert.equal((await history.load()).retention.weeks.length,8);
  const good=fs.readFileSync(path.join(root,'private/last-good.json'),'utf8'),publicDirs=fs.readdirSync(path.join(root,'candidates'));
  assert.equal(fs.statSync(path.join(root,'private/recovery.json')).mode&0o777,0o600);assert(!fs.readFileSync(path.join(root,'private/recovery.json'),'utf8').includes(s.store.entries[0].sourceKey));
  failBackup=true;await assert.rejects(publisher.prepare(config),{message:'Snapshot preparation blocked'});assert.equal(fs.readFileSync(path.join(root,'private/last-good.json'),'utf8'),good);assert.deepEqual(fs.readdirSync(path.join(root,'candidates')),publicDirs);failBackup=false;
  source=structuredClone(s.reply);source.snapshot.games.pop();await assert.rejects(publisher.prepare(config));assert.equal(fs.readFileSync(path.join(root,'private/last-good.json'),'utf8'),good);
  source=structuredClone(s.reply);source.snapshot.generatedAt=new Date(s.now-120001).toISOString();await assert.rejects(publisher.prepare(config));
  await assert.rejects(publisher.prepare({...config,publicationEnabled:true}));assert.deepEqual(r.service.load().store,s.store);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('retained monthly points-first/tiebreaker results and unresolved equal distances remain identical',()=>{
 const {example:legacy}=require('./support/pp3-api-example.cjs'),now=Date.UTC(2026,10,5,12);
 for(const mode of ['decisive','equal','missing']){
  const x=legacy();x.e.policy.now=now;x.cfg.authority=x.e.authority;for(const c of x.e.authority.closures){c.checkedAt=new Date(now).toISOString();c.validUntil=new Date(now+120000).toISOString();}for(const c of x.e.authority.decisions.values())c.verifiedAt=new Date(now).toISOString();
  if(mode!=='decisive'){let i=0;const actual=Number(x.matrix.Results[2][6])+Number(x.matrix.Results[2][7]);for(const row of x.matrix.Responses.slice(1))if(row[4])row[5]=mode==='missing'?'':String(actual+(i++===0?-1:1));}
  const reply=x.get(),before=decode(reply,now),{file}=generate(reply,{version:1,entries:[]},now,{approvedAliases:new Map(reply.aliases.map(a=>[a.player,a.alias])),retention:{}}),after=validate(file,now+10800000);
  assert.deepEqual(after.resolutions,before.resolutions);assert.deepEqual(after.prizes.periods,before.prizes.periods);assert.equal(after.resolutions.M1.status,mode==='decisive'?'MONTHLY CHAMPION':mode==='equal'?'UNRESOLVED TIE':'NO ELIGIBLE TIEBREAKER');
 }
});

test('private owner/lock failures cannot expose underlying exception text',()=>{
 for(const boundary of ['owner','lock']){
  const service=registry({assertOwner:()=>{if(boundary==='owner')throw Error('PRIVATE_SECRET');return true;},properties:{},lock:{waitLock(){throw Error('PRIVATE_SECRET');},releaseLock(){}},digest:()=>''});
  assert.throws(()=>service.load(),{message:'Private registry unavailable'});
 }
});

test('independent backup generation is authenticated and cannot be relabeled to bypass recovery high-water',()=>{
 const s=example(),key=crypto.randomBytes(32),file=backup.encrypt(s.store,key,{generation:1});
 assert.deepEqual(backup.decrypt(file,key,{expectedGeneration:1}),s.store);
 assert.throws(()=>backup.decrypt(file,key,{expectedGeneration:2}));
 assert.throws(()=>backup.decrypt({...file,generation:2},key,{expectedGeneration:2}));
});
