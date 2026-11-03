'use strict';
const {validatePublic,comparePublic}=require('../contracts/live-contract.cjs');
// Data-only helper for private review. No reader callbacks, I/O or logging.
function summarizeOffline(actual,expected,trust,options={}){
 const counts={weeks:0,games:0,finalGames:0,availableScopes:0,withheldScopes:0};
 try{
  validatePublic(actual,trust);
  if(actual.state!=='READY')return {state:'INCOMPLETE',counts,validation:'UNAVAILABLE',checks:[],discrepancies:0};
  counts.weeks=actual.weeks.length;counts.games=actual.games.length;counts.finalGames=actual.games.filter(g=>g.status==='FINAL').length;
  counts.availableScopes=actual.standings.filter(s=>s.state==='AVAILABLE').length;counts.withheldScopes=actual.standings.filter(s=>s.state==='WITHHELD').length;
  if(!expected)return {state:'INCOMPLETE',counts,validation:'VALID',checks:[],discrepancies:0};
  const comparison=comparePublic(actual,expected,trust,options);
  const discrepancies=comparison.checks.filter(c=>c.state==='MISMATCH').length;
  return {state:comparison.state==='MATCH'&&counts.withheldScopes===0?'VERIFIED_OFFLINE':comparison.state==='MISMATCH'?'DISCREPANCIES':'INCOMPLETE',counts,validation:'VALID',checks:comparison.checks,discrepancies};
 }catch{return {state:'INVALID',counts:{weeks:0,games:0,finalGames:0,availableScopes:0,withheldScopes:0},validation:'REJECTED',checks:[],discrepancies:0};}
}
module.exports={summarizeOffline};
