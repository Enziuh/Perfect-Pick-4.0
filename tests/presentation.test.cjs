'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {STAGE}=require('../tools/security/public-artifact.cjs');
const path=require('node:path');
test('approved accuracy presentation uses FINAL completed games, with zero shown as an em dash',()=>{
 // Exercise the actual pure presentation function shipped in the sealed artifact.
 const source=fs.readFileSync(path.join(STAGE,'app.js'),'utf8');
 const start=source.indexOf('  function formatAccuracy('),end=source.indexOf('  function accuracyHtml(',start);
 assert(start>=0 && end>start);
 const accuracy=vm.runInNewContext(`(${source.slice(start,end).trim()})`);
 for(const [correct,finalGames,expected] of [[0,0,'—'],[0,4,'0%'],[4,4,'100%'],[3,4,'75%'],[2,3,'66.7%'],[1,8,'12.5%'],[5,4,'—'],[-1,4,'—'],[NaN,4,'—']])assert.equal(accuracy(correct,finalGames),expected);
});
