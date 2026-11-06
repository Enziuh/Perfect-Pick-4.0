'use strict';
// Public input only. Private publisher validates/remaps before this file ever enters Git.
const fs=require('node:fs'),path=require('node:path'),artifact=require('./artifact.cjs');
const ROOT=path.resolve(__dirname,'../..'),STAGE=path.join(ROOT,'.preview-public'),INPUT=path.join(ROOT,'public-data/snapshot.json');
const {production}=require('./production-policy.cjs');
function verify(now=Date.now()){production(JSON.parse(fs.readFileSync(INPUT,'utf8')),now);const hashes=artifact.verify(STAGE,now,true);if(fs.readFileSync(path.join(STAGE,'data/snapshot.json'),'utf8')!==fs.readFileSync(INPUT,'utf8'))throw Error('Snapshot input changed');return hashes;}
function stage(now=Date.now()){
 if(fs.lstatSync(INPUT).isSymbolicLink())throw Error('Unsafe public input');const file=production(JSON.parse(fs.readFileSync(INPUT,'utf8')),now),temp=path.join(ROOT,'tmp/static-pages-'+require('node:crypto').randomBytes(8).toString('hex'));artifact.stage(file,temp,now,true);
 if(fs.existsSync(STAGE)&&fs.lstatSync(STAGE).isSymbolicLink())throw Error('Unsafe staging directory');
 fs.rmSync(STAGE,{recursive:true,force:true});fs.rmSync(STAGE+'.seal.json',{force:true});fs.renameSync(temp,STAGE);fs.renameSync(temp+'.seal.json',STAGE+'.seal.json');return verify(now);
}
if(require.main===module){try{if(process.argv[2]==='stage')stage();else if(process.argv[2]==='verify')verify();else throw Error();console.log('PASS: exact static artifact, historical scope, public schema, privacy and integrity.');}catch{console.error('Static publication BLOCKED: invalid, stale, incomplete or unsafe artifact.');process.exitCode=1;}}
module.exports={production,stage,verify,INPUT,STAGE};
