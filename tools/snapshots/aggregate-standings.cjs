'use strict';
// Owner-approved aggregate totals only. No selection, eligibility, prediction or vote fields.
const keys=['player','alias','rank','points','completedGames','totalPicks','accuracyBasisPoints'];
const exact=(o,k)=>o&&Object.keys(o).sort().join(',')===[...k].sort().join(',');
const fail=()=>{throw Error('Public aggregate standings unavailable');};
function project(payload){return payload.snapshot.standings.filter(t=>t.state==='AVAILABLE').map(t=>({key:t.key,rows:t.rows.map(r=>Object.fromEntries(keys.filter(k=>Object.hasOwn(r,k)).map(k=>[k,r[k]])))}));}
function apply(tables,payload,model){
 if(!Array.isArray(tables)||tables.length>30)fail();const seen=new Set(),aliases=new Map(payload.aliases.map(a=>[a.player,a.alias]));
 for(const table of tables){
  const source=payload.snapshot.standings.find(t=>t.key===table?.key);if(!exact(table,['key','rows'])||!source||seen.has(table.key)||!Array.isArray(table.rows)||table.rows.length>1000)fail();seen.add(table.key);
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
  if(source.scope==='MONTHLY'){const p=model.prizes.periods.find(p=>p.periodKey===table.key);if(p)p.standings=rows;}
  if(source.scope==='SEASON')model.prizes.overallStandings=rows;
 }
 return model;
}
module.exports={project,apply};
