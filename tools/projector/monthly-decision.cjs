'use strict';
// Contract-v1 decision only: never changes points, ranks, money or external state.
function monthlyDecision(period, complete, snapshot, table) {
  const result = {key:period.key,startWeek:period.startWeek,endWeek:period.endWeek,
    competitionComplete:complete,designatedGame:period.designatedGame,state:'IN PROGRESS',winner:null,actualTotal:null,method:'NONE'};
  if (!complete || table.state !== 'AVAILABLE' || !table.rows.some(row => row.completedGames > 0)) return result;
  const games = snapshot.games.filter(game => table.weeks.includes(game.week));
  const designated = games.find(game => game.game === period.designatedGame);
  const unfinished = games.filter(game => game.status !== 'FINAL');
  if (unfinished.length) {
    if (designated && unfinished.length === 1 && unfinished[0] === designated) result.state = 'AWAITING FINAL SCORE';
    return result;
  }
  if (!table.weeks.every(week => games.some(game => game.week === week))) return result;
  const leaders = table.rows.filter(row => row.points === table.rows[0].points);
  if (leaders.length === 1) return {...result,state:'MONTHLY CHAMPION',winner:leaders[0].player,method:'POINTS'};
  if (!designated) return result;
  const actual = designated.homeScore + designated.awayScore;
  const picks = snapshot.weeks.find(week => week.week === designated.week).picks;
  const comparisons = leaders.map(row => {
    const prediction = picks.find(pick => pick.player === row.player)?.prediction;
    const total = prediction?.game === designated.game ? prediction.total : null;
    return {player:row.player,prediction:total ?? null,difference:total == null ? null : Math.abs(total-actual)};
  });
  const eligible = comparisons.filter(row => row.difference !== null);
  const minimum = eligible.length ? Math.min(...eligible.map(row => row.difference)) : null;
  const closest = eligible.filter(row => row.difference === minimum);
  return {...result,state:closest.length === 1 ? 'MONTHLY CHAMPION' : closest.length ? 'UNRESOLVED TIE' : 'NO ELIGIBLE TIEBREAKER',
    winner:closest.length === 1 ? closest[0].player : null,actualTotal:actual,method:'COMBINED_POINTS',comparisons};
}
module.exports = {monthlyDecision};
