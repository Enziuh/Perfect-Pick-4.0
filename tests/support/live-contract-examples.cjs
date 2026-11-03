'use strict';
// Entirely invented contract examples. Not included in browser/public artifacts.
const {VERSION}=require('../../tools/contracts/live-contract.cjs');
const AT='2026-10-01T12:00:00.000Z',UNTIL='2026-10-01T12:05:00.000Z';
const COMET='p_example01',MAPLE='p_example02',G1='g_example01',G2='g_example02';
function example(scenario='decisive'){
 const aliases=new Map([[COMET,'Synthetic Comet'],[MAPLE,'Synthetic Maple']]);
 const entry=()=>({status:'CLOSED',authority:'OFFICIAL',revision:1,checkedAt:AT,validUntil:UNTIL,deadline:null});
 const weeks=[1,2].map(week=>({week,entry:entry(),picks:[
  {player:COMET,alias:aliases.get(COMET),selections:[{game:week===1?G1:G2,team:week===1?'CHI':'BUF'}]},
  {player:MAPLE,alias:aliases.get(MAPLE),selections:[{game:week===1?G1:G2,team:week===1?'DET':'KC'}]}
 ]}));
 weeks[1].picks[0].prediction={game:G2,total:40};weeks[1].picks[1].prediction={game:G2,total:scenario==='unresolved'?36:44};
 if(scenario==='no-eligible')weeks[1].picks.forEach(p=>p.prediction.total=null);
 if(scenario==='zero-votes')weeks[0].picks.forEach(p=>p.selections=[]);
 const games=[{game:G1,week:1,home:'CHI',away:'DET',kickoff:null,status:'FINAL',homeScore:20,awayScore:17,winner:'HOME',verifiedAt:AT},
  {game:G2,week:2,home:'KC',away:'BUF',kickoff:null,status:'FINAL',homeScore:21,awayScore:17,winner:'HOME',verifiedAt:AT}];
 if(scenario==='zero-completed')games.forEach(g=>{g.status='PENDING';g.homeScore=null;g.awayScore=null;g.winner=null;});
 if(scenario==='pending'){games[1].status='PENDING';games[1].homeScore=null;games[1].awayScore=null;games[1].winner=null;}
 for(const w of weeks){
  const g=games[w.week-1];const counts=[g.home,g.away].map(team=>w.picks.filter(p=>p.selections.some(s=>s.team===team)).length);const total=counts[0]+counts[1];
  w.votes=[{game:g.game,total,teams:[g.home,g.away].map((team,i)=>({team,count:counts[i],basisPoints:total?(i===0?Math.round(counts[0]/total*10000):10000-Math.round(counts[0]/total*10000)):0}))}];
 }
 const rank=rows=>{rows.sort((a,b)=>b.points-a.points);let prior=null,r=0;return rows.map((row,i)=>{if(row.points!==prior)r=i+1;prior=row.points;return {...row,rank:r,accuracyBasisPoints:row.completedGames?Math.round(row.points/row.completedGames*10000):null};});};
 const standings=weeks.map(w=>({scope:'WEEKLY',key:'W'+w.week,weeks:[w.week],state:'AVAILABLE',rows:rank(w.picks.map(p=>{const g=games[w.week-1];const completed=g.status==='FINAL'?p.selections.length:0;return {player:p.player,alias:p.alias,rank:0,points:completed&&p.selections[0].team===g.home?1:0,completedGames:completed,totalPicks:p.selections.length};}))}));
 const aggregate=()=>rank([...aliases].map(([player,alias])=>({player,alias,rank:0,points:standings[0].rows.find(r=>r.player===player).points+standings[1].rows.find(r=>r.player===player).points,completedGames:standings[0].rows.find(r=>r.player===player).completedGames+standings[1].rows.find(r=>r.player===player).completedGames,totalPicks:standings[0].rows.find(r=>r.player===player).totalPicks+standings[1].rows.find(r=>r.player===player).totalPicks})));
 standings.push({scope:'MONTHLY',key:'M1',weeks:[1,2],state:'AVAILABLE',rows:aggregate()},{scope:'SEASON',key:'S2026',weeks:[1,2],state:'AVAILABLE',rows:aggregate()});
 const month={key:'M1',startWeek:1,endWeek:2,competitionComplete:true,designatedGame:G2,state:'MONTHLY CHAMPION',winner:COMET,actualTotal:38,method:'COMBINED_POINTS',comparisons:weeks[1].picks.map(p=>({player:p.player,prediction:p.prediction.total,difference:p.prediction.total===null?null:Math.abs(p.prediction.total-38)}))};
 if(scenario==='unresolved'){month.state='UNRESOLVED TIE';month.winner=null;}
 if(scenario==='no-eligible'){month.state='NO ELIGIBLE TIEBREAKER';month.winner=null;}
 if(scenario==='zero-votes'){month.winner=MAPLE;month.actualTotal=null;month.method='POINTS';delete month.comparisons;}
 if(scenario==='pending'){month.state='AWAITING FINAL SCORE';month.winner=null;month.actualTotal=null;month.method='NONE';delete month.comparisons;}
 if(['in-progress','zero-completed'].includes(scenario)){month.competitionComplete=false;month.state='IN PROGRESS';month.winner=null;month.actualTotal=null;month.method='NONE';delete month.comparisons;}
 const prizes=standings.map(s=>({key:s.key,currency:'USD',poolCents:s.scope==='SEASON'?null:1000,poolState:s.scope==='SEASON'?'UNAVAILABLE':'CONFIRMED',allocationState:'PENDING',paymentState:'UNKNOWN'}));
 if(scenario==='unknown'||scenario==='missing-alias'){
  if(scenario==='unknown'){weeks[1].entry.status='UNKNOWN';weeks[1].entry.authority='UNVERIFIED';delete weeks[1].picks;delete weeks[1].votes;}
  for(const s of standings)if(scenario==='missing-alias'||s.weeks.includes(2)){s.state='WITHHELD';s.reason=scenario==='unknown'?'CLOSURE_UNVERIFIED':'MISSING_ALIAS';delete s.rows;}
  if(scenario==='missing-alias')weeks.forEach(w=>{delete w.picks;delete w.votes;});
  month.state='IN PROGRESS';month.winner=null;month.actualTotal=null;month.method='NONE';delete month.comparisons;
 }
 const snapshot={version:VERSION,revision:1,generatedAt:AT,state:'READY',season:2026,scoringBasis:'SUBMITTED_FINAL_PICKS',weeks,games,standings,months:[month],prizes};
 const trust={aliasCompleteness:new Map(weeks.map(w=>[w.week,scenario!=='missing-alias'])),now:Date.parse(AT),maxAgeMs:300000,aliases,closures:new Map(weeks.map(w=>[w.week,structuredClone(w.entry)])),prizes:new Map(prizes.map(p=>[p.key,structuredClone(p)]))};
 if(scenario==='missing-alias')trust.aliases.delete(COMET);
 return {snapshot,trust};
}
module.exports={example,AT,UNTIL,COMET,MAPLE,G1,G2};
