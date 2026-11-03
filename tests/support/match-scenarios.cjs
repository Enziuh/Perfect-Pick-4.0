'use strict';
const {refreshScores}=require('./monthly-scenarios.cjs');
// Test-only data; no alternate adapter or scenario switch ships in the website.
function createMatchScenario(name,base){
 const data=structuredClone(base);
 const week=data.weeks[name==='pending-scores'?2:0];
 if(name==='zero-votes')for(const player of week.standings){
  player.picks=player.picks.filter(p=>p.game!==week.games[0]);player.totalPicks=player.picks.length;
 }
 if(name==='one-sided')for(const player of week.standings)player.picks[0].pick='Lions';
 if(name==='pending-scores')Object.assign(week.results[0],{status:'Pending',winner:'',team1Score:7,team2Score:0});
 refreshScores(data);
 if(name==='pending-scores')for(const player of week.standings){
  // Defensive rendering must not trust stale per-pick flags over the Pending result.
  player.picks[0].correct=true;player.picks[0].status='Final';player.picks[0].winner=player.picks[0].pick;
 }
 return data;
}
module.exports={createMatchScenario};
