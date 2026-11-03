'use strict';
// Explicit test-only examples. Never served or packaged in the public preview.
function rank(rows) {
 rows.sort((a,b)=>b.points-a.points || a.name.localeCompare(b.name));
 rows.forEach((p,i)=>{p.rank=i && rows[i-1].points===p.points?rows[i-1].rank:i+1;});
 return rows;
}
function aggregate(weeks,includeTotal=false) {
 const totals=new Map();
 for(const week of weeks)for(const p of week.standings){
  const row=totals.get(p.name)||{name:p.name,points:0,completedGames:0,...(includeTotal?{totalPicks:0}:{})};
  row.points+=p.points;row.completedGames+=p.completedGames;if(includeTotal)row.totalPicks+=p.totalPicks;
  totals.set(p.name,row);
 }
 return rank([...totals.values()]);
}
function createScenario(name,base) {
 const data=structuredClone(base);
 if(name==='in-progress')return data;
 const monthlyWeeks=data.weeks.slice(0,4);
 for(const week of monthlyWeeks.slice(2)){
  for(const result of week.results)Object.assign(result,{status:'Final',team1Score:21,team2Score:17,winner:result.team1});
  for(const player of week.standings){
   if(player.name==='Synthetic Comet'||(name!=='clear-leader' && player.name==='Synthetic Maple')){
    player.picks.forEach(pick=>{pick.pick=week.results.find(r=>r.game===pick.game).team1;});
   }
  }
 }
 const target=monthlyWeeks[3];
 const game=target.results.find(r=>r.game===data.prizes.periods[0].tiebreakRule.game);
 if(name==='equal-distance')Object.assign(game,{team1Score:21,team2Score:21,winner:'Tie'});
 if(name==='zero-prediction')Object.assign(game,{team1Score:0,team2Score:0,winner:'Tie'});
 if(name==='awaiting-score')Object.assign(game,{status:'Pending',winner:'',team1Score:'',team2Score:''});
 for(const p of target.standings){
  if(name==='no-eligible')p.tiebreakPrediction='';
  if(name==='one-eligible' && p.name==='Synthetic Maple')p.tiebreakPrediction='';
  if(name==='zero-prediction' && p.name==='Synthetic Comet')p.tiebreakPrediction='0';
  p.tiebreakSubmitted=p.tiebreakPrediction!=='';
 }
 if(name==='zero-completed')for(const week of monthlyWeeks)for(const result of week.results)Object.assign(result,{status:'Pending',winner:'',team1Score:'',team2Score:''});
 for(const week of monthlyWeeks){
  for(const p of week.standings){
   for(const pick of p.picks){
    const r=week.results.find(r=>r.game===pick.game);
    Object.assign(pick,{winner:r.winner,status:r.status,correct:r.status==='Final' && r.winner?pick.pick===r.winner:null});
   }
   p.points=p.picks.filter(p=>p.correct===true).length;
   p.completedGames=p.picks.filter(p=>p.correct!==null).length;
   p.perfectWeek=p.points===week.games.length && p.completedGames===week.games.length && p.totalPicks===week.games.length;
  }
  rank(week.standings);
  const finalized=week.results.every(r=>r.status==='Final');
  const perfectWinners=finalized?week.standings.filter(p=>p.perfectWeek).map(p=>p.name):[];
  week.outcome={finalized,status:finalized?(perfectWinners.length?'winner':'rollover'):'pending',perfectWinners};
 }
 for(const row of data.prizes.weekly){
  const week=data.weeks[row.week-1];row.finalized=week.outcome.finalized;
  row.perfectPickWinnerNames=[...week.outcome.perfectWinners];row.perfectPickWinners=row.perfectPickWinnerNames.length;
  row.perfectPayoutEach=row.perfectPickWinners?row.weeklyPot/row.perfectPickWinners:0;
  row.rolloverToMonthly=row.finalized && !row.perfectPickWinners?row.weeklyPot:0;
 }
 for(const period of data.prizes.periods){
  const weeks=data.weeks.slice(period.startWeek-1,period.endWeek);
  period.standings=aggregate(weeks);period.leaders=period.standings.filter(p=>p.points===period.standings[0]?.points).map(p=>p.name);
  period.allWeeksFinalized=weeks.every(w=>w.outcome.finalized);
  period.monthlyPot=data.prizes.weekly.filter(w=>w.week>=period.startWeek && w.week<=period.endWeek).reduce((n,w)=>n+w.rolloverToMonthly,0);
  period.monthlyWinnerPool=period.monthlyPot/2;period.seasonContribution=period.monthlyPot/2;
  const result=data.weeks[period.endWeek-1].results.find(r=>r.game===period.tiebreakRule.game);
  period.tiebreakRule.status=result.status;
  period.tiebreakRule.actualTotal=result.status==='Final'?Number(result.team1Score)+Number(result.team2Score):'';
 }
 data.prizes.overallStandings=aggregate(data.weeks,true);
 data.prizes.confirmedSeasonPot=data.prizes.periods.filter(p=>p.allWeeksFinalized).reduce((n,p)=>n+p.seasonContribution,0);
 data.prizes.projectedSeasonPot=data.prizes.periods.reduce((n,p)=>n+p.seasonContribution,0);
 // Closed-period data never enters the active, open week's standings.
 data.prizes.currentWeekStandings=[];
 if(name==='not-closed'){
  // Server-side privacy projection: remove selections from the response entirely.
  target.entriesStatus='OPEN';target.standings=[];target.tiebreak.revealed=false;
  target.outcome.perfectWinners=[];
  const row=data.prizes.weekly[3];row.perfectPickWinnerNames=[];row.perfectPickWinners=0;row.perfectPayoutEach=0;
 }
 return data;
}
module.exports={createScenario};
