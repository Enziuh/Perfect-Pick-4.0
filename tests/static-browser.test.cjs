'use strict';
const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {run}=require('../tools/snapshots/benchmark.cjs');
test('static-only browser: 23 players, lazy matrix, OPEN confidentiality, same-origin logos, expiry and five responsive widths',{timeout:180000},async()=>{
 const out=path.resolve('tmp/static-browser-test-'+crypto.randomBytes(6).toString('hex'));
 try{await run({out,widths:[360,390,430,768,1440],compare:false,check:true});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});

test('retained historical browser: mobile/desktop at3h preserve CLOSED picks, expiry clears stale scores, OPEN data absent',{timeout:180000},async()=>{
 const out=path.resolve('tmp/retained-static-browser-'+crypto.randomBytes(6).toString('hex'));
 try{await run({out,widths:[390,1440],compare:false,check:true,retained:true});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});
