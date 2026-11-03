'use strict';
// Test-only structural bridge. Never loaded by website or exposed as a live adapter.
function componentInputs(snapshot) {
  const names={CHI:'Bears',DET:'Lions',KC:'Chiefs',BUF:'Bills'};
  const label=g=>names[g.home]+' vs '+names[g.away];
  const games=new Map(snapshot.games.map(g=>[g.game,g]));
  const rows=(snapshot,key)=>snapshot.standings.find(s=>s.key===key)?.rows || [];
  const weeks=snapshot.weeks.map(w=>({week:w.week,entriesStatus:w.entry.status,
    games:snapshot.games.filter(g=>g.week===w.week).map(label),
    results:snapshot.games.filter(g=>g.week===w.week).map(g=>({game:label(g),team1:names[g.home],team2:names[g.away],status:g.status==='FINAL'?'Final':'Pending',winner:g.winner==='HOME'?names[g.home]:g.winner==='AWAY'?names[g.away]:g.winner==='TIE'?'Tie':'',team1Score:g.homeScore??'',team2Score:g.awayScore??''})),
    outcome:{finalized:snapshot.games.filter(g=>g.week===w.week).every(g=>g.status==='FINAL')},
    tiebreak:{enabled:true,revealed:w.entry.status==='CLOSED',game:label(games.get(snapshot.months[0].designatedGame))},
    standings:rows(snapshot,'W'+w.week).map(r=>{
      const p=w.picks?.find(p=>p.player===r.player),prediction=p?.prediction?.total;
      return {name:r.alias,rank:r.rank,points:r.points,completedGames:r.completedGames,totalPicks:r.totalPicks,
        picks:(p?.selections||[]).map(s=>({game:label(games.get(s.game)),pick:names[s.team]})),
        tiebreakPrediction:prediction==null?'':String(prediction)};
    })}));
  const m=snapshot.months[0];
  const period={startWeek:m.startWeek,endWeek:m.endWeek,allWeeksFinalized:m.competitionComplete&&snapshot.games.every(g=>g.status==='FINAL'),standings:rows(snapshot,m.key).map(r=>({name:r.alias,points:r.points,completedGames:r.completedGames})),tiebreakRule:{week:m.endWeek,game:label(games.get(m.designatedGame)),method:'Combined Points'}};
  return {weeks,period};
}
module.exports={componentInputs};
