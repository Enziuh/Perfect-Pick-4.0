'use strict';
// Owner-approved aggregate totals only. No selection, eligibility, prediction or vote fields.
const keys=['player','alias','rank','points','completedGames','totalPicks','accuracyBasisPoints'];
const exact=(o,k)=>o&&Object.keys(o).sort().join(',')===[...k].sort().join(',');
const fail=()=>{throw Error('Public aggregate standings unavailable');};
function runningTables(payload){
 const s=payload.snapshot;return s.standings.filter(t=>(t.key==='M3'||t.scope==='SEASON')&&t.state==='WITHHELD').flatMap(period=>{
 const parts=period.weeks.map(w=>s.standings.find(t=>t.key==='W'+w)).filter(t=>t?.state==='AVAILABLE'&&s.weeks.some(w=>'W'+w.week===t.key&&Array.isArray(w.picks)&&Array.isArray(w.votes)));
 if(!parts.length)return [];
 const totals=new Map();for(const part of parts)for(const r of part.rows){const x=totals.get(r.player)||{player:r.player,alias:r.alias,points:0,completedGames:0,totalPicks:0};x.points+=r.points;x.completedGames+=r.completedGames;x.totalPicks+=r.totalPicks??0;totals.set(r.player,x);}
 let rank=0,last=null;const rows=[...totals.values()].sort((a,b)=>b.points-a.points||a.player.localeCompare(b.player)).map((r,i)=>{if(last!==r.points)rank=i+1;last=r.points;return {player:r.player,alias:r.alias,rank,points:r.points,completedGames:r.completedGames,totalPicks:r.totalPicks,accuracyBasisPoints:r.completedGames?Math.round(r.points/r.completedGames*10000):null};});
 return [{key:period.key,rows,coveredWeeks:parts.flatMap(t=>t.weeks)}];
 });
}
function project(payload,{running=payload}={}){return payload.snapshot.standings.filter(t=>t.state==='AVAILABLE').map(t=>({key:t.key,rows:t.rows.map(r=>Object.fromEntries(keys.filter(k=>Object.hasOwn(r,k)).map(k=>[k,r[k]])))})).concat(runningTables(running));}
function apply(tables,payload,model){
 if(!Array.isArray(tables)||tables.length>30)fail();const seen=new Set(),aliases=new Map(payload.aliases.map(a=>[a.player,a.alias]));
 for(const table of tables){
  const source=payload.snapshot.standings.find(t=>t.key===table?.key);if(!(exact(table,['key','rows'])||exact(table,['key','rows','coveredWeeks']))||!source||seen.has(table.key)||!Array.isArray(table.rows)||table.rows.length>1000)fail();seen.add(table.key);
  if(source.key==='M3'&&source.state==='WITHHELD'&&!Object.hasOwn(table,'coveredWeeks'))fail();
  if(Object.hasOwn(table,'coveredWeeks')){const expected=runningTables(payload).find(t=>t.key===table.key);if(!expected||JSON.stringify(expected)!==JSON.stringify(table))fail();}
  const players=new Set(),max=payload.snapshot.games.filter(g=>source.weeks.includes(g.week)).length;let last=null,rank=0;
  table.rows.forEach((r,i)=>{if(!r||!exact(r,keys.filter(k=>Object.hasOwn(r,k)))||!['player','alias','rank','points','completedGames'].every(k=>Object.hasOwn(r,k))||aliases.get(r.player)!==r.alias||players.has(r.player))fail();players.add(r.player);
   for(const k of ['rank','points','completedGames'])if(!Number.isSafeInteger(r[k])||r[k]<0)fail();
   if(r.points>r.completedGames||r.completedGames>max||last!==null&&r.points>last)fail();if(last!==r.points)rank=i+1;if(r.rank!==rank)fail();last=r.points;
   if(r.totalPicks!==undefined&&(!Number.isSafeInteger(r.totalPicks)||r.totalPicks<r.completedGames||r.totalPicks>max))fail();
   if(r.accuracyBasisPoints!==undefined&&r.accuracyBasisPoints!==(r.completedGames?Math.round(r.points/r.completedGames*10000):null))fail();
  });
  if(source.state==='AVAILABLE'&&JSON.stringify(table.rows)!==JSON.stringify(project(payload).find(t=>t.key===table.key).rows))fail();
  const rows=table.rows.map(r=>({name:r.alias,rank:r.rank,points:r.points,completedGames:r.completedGames,totalPicks:r.totalPicks??null}));
  if(source.scope==='WEEKLY'){const w=model.weeks.find(w=>'W'+w.week===table.key);if(w&&w.visibility!=='AVAILABLE'){w.standings=rows;w.aggregateAvailable=true;if(w.week===model.prizes.activeWeek)model.prizes.currentWeekStandings=rows;}}
  if(source.scope==='MONTHLY'){const p=model.prizes.periods.find(p=>p.periodKey===table.key);if(p){p.standings=rows;if(table.coveredWeeks)p.runningWeeks=[...table.coveredWeeks];}}
  if(source.scope==='SEASON'){model.prizes.overallStandings=rows;if(table.coveredWeeks)model.prizes.seasonRunningWeeks=[...table.coveredWeeks];}
 }
 return model;
}
module.exports={project,apply,runningTables};
