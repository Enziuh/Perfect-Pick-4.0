'use strict';
// Public input only. Private publisher validates/remaps before this file ever enters Git.
const fs=require('node:fs'),path=require('node:path'),artifact=require('./artifact.cjs');
const {validate}=require('./schema.cjs');
const ROOT=path.resolve(__dirname,'../..'),STAGE=path.join(ROOT,'.preview-public'),INPUT=path.join(ROOT,'public-data/snapshot.json');
function production(file,now){
 if(file.schema!=='PP4_STATIC_V2'||file.retention.policyId!=='pp4-historical-2026-1'||file.retention.revision!==1||JSON.stringify(file.retention.weeks)!=='[1,2,3,4,5,6,7,8]'||!Array.isArray(file.aggregateStandings))throw Error('Approved static production scope required');
 validate(file,now);
 const s=file.payload.snapshot;for(const w of s.weeks)if(w.week>=9&&(Object.hasOwn(w,'picks')||Object.hasOwn(w,'votes')))throw Error('Protected week publication blocked');
 for(const m of s.months)if(m.endWeek>=9&&(m.comparisons||m.winner!==null||m.method!=='NONE'))throw Error('Protected monthly decision blocked');
 if(file.payload.aliases.length!==23||s.games.length!==272)throw Error('Incomplete production snapshot');
 return file;
}
function verify(now=Date.now()){production(JSON.parse(fs.readFileSync(INPUT,'utf8')),now);const hashes=artifact.verify(STAGE,now,true);if(fs.readFileSync(path.join(STAGE,'data/snapshot.json'),'utf8')!==fs.readFileSync(INPUT,'utf8'))throw Error('Snapshot input changed');return hashes;}
function stage(now=Date.now()){
 if(fs.lstatSync(INPUT).isSymbolicLink())throw Error('Unsafe public input');const file=production(JSON.parse(fs.readFileSync(INPUT,'utf8')),now),temp=path.join(ROOT,'tmp/static-pages-'+require('node:crypto').randomBytes(8).toString('hex'));artifact.stage(file,temp,now,true);
 if(fs.existsSync(STAGE)&&fs.lstatSync(STAGE).isSymbolicLink())throw Error('Unsafe staging directory');
 fs.rmSync(STAGE,{recursive:true,force:true});fs.rmSync(STAGE+'.seal.json',{force:true});fs.renameSync(temp,STAGE);fs.renameSync(temp+'.seal.json',STAGE+'.seal.json');return verify(now);
}
if(require.main===module){try{if(process.argv[2]==='stage')stage();else if(process.argv[2]==='verify')verify();else throw Error();console.log('PASS: exact static artifact, historical scope, public schema, privacy and integrity.');}catch{console.error('Static publication BLOCKED: invalid, stale, incomplete or unsafe artifact.');process.exitCode=1;}}
module.exports={production,stage,verify,INPUT,STAGE};
