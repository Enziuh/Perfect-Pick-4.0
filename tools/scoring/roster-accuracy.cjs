'use strict';
// Versioned derived statistics. Original scoring/qualification records stay immutable.
const VERSION='ROSTER_FINAL_V1';
const {safeAlias}=require('../compatibility/pp3-display-name.cjs');
const {finalizedGameCount}=require('./late-entry.cjs');
const exact=(v,keys)=>v&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
function roster(records){
 if(!Array.isArray(records)||!records.length||records.length>1000)throw Error('Complete approved roster required');
 const ids=new Set(),names=new Set();
 for(const r of records){if(!exact(r,['player','alias'])||!/^p_[a-z0-9]{8,32}$/.test(r.player)||!safeAlias(r.alias)||ids.has(r.player)||names.has(r.alias))throw Error('Ambiguous accuracy roster');ids.add(r.player);names.add(r.alias);}
 return records.map(r=>({player:r.player,alias:r.alias})).sort((a,b)=>a.player.localeCompare(b.player));
}
function create(snapshot,records){
 const approved=roster(records),aliases=new Map(approved.map(r=>[r.player,r.alias]));
 for(const t of snapshot.standings)for(const r of t.rows||[])if(aliases.get(r.player)!==r.alias)throw Error('Scored player outside accuracy roster');
 for(const w of snapshot.weeks)for(const r of w.picks||[])if(aliases.get(r.player)!==r.alias)throw Error('Selection outside accuracy roster');
 return {version:VERSION,fromWeek:1,roster:approved,weeks:snapshot.weeks.map(w=>({week:w.week,completedGames:finalizedGameCount(snapshot.games.filter(g=>g.week===w.week))}))};
}
function validate(snapshot,aliases){
 if(!snapshot.accuracy)return;
 const a=snapshot.accuracy;if(!exact(a,['version','fromWeek','roster','weeks'])||a.version!==VERSION||a.fromWeek!==1||JSON.stringify(a)!==JSON.stringify(create(snapshot,a.roster)))throw Error('Invalid derived accuracy contract');
 if(a.roster.some(r=>aliases.get(r.player)!==r.alias)||a.roster.length!==aliases.size)throw Error('Accuracy roster authority mismatch');
}
function rows(snapshot,table){
 const a=snapshot.accuracy;if(!a)return table.rows;
 const weeks=table.coveredWeeks||table.weeks;
 if(!Array.isArray(weeks)||new Set(weeks).size!==weeks.length)throw Error('Accuracy period coverage required');
 const completedGames=weeks.reduce((n,w)=>{const v=a.weeks.find(x=>x.week===w);if(!v)throw Error('Unknown accuracy week');return n+v.completedGames;},0);
 const source=new Map(table.rows.map(r=>[r.player,r])),order=new Map(table.rows.map((r,i)=>[r.player,i]));
 const result=a.roster.map(p=>{const r=source.get(p.player);return {...p,points:r?.points??0,completedGames,qualificationCompletedGames:r?.completedGames??0,totalPicks:r?.totalPicks??0,accuracyBasisPoints:completedGames?Math.round((r?.points??0)/completedGames*10000):null};}).sort((a,b)=>b.points-a.points||(order.get(a.player)??1001)-(order.get(b.player)??1001)||a.player.localeCompare(b.player));
 let last=null,rank=0;return result.map((r,i)=>{if(last!==r.points)rank=i+1;last=r.points;const old=source.get(r.player);if(old&&old.rank!==rank)throw Error('Protected rank changed');return {...r,rank};});
}
function applyModel(model,snapshot,tables=snapshot.standings){
 if(!snapshot.accuracy)return model;
 for(const t of tables){if(!t.rows)continue;const source=snapshot.standings.find(s=>s.key===t.key);if(!source)throw Error('Unknown accuracy period');
 const derived=rows(snapshot,{...source,...t}).map(r=>({name:r.alias,rank:r.rank,points:r.points,completedGames:r.completedGames,qualificationCompletedGames:r.qualificationCompletedGames,totalPicks:r.totalPicks,accuracyBasisPoints:r.accuracyBasisPoints}));
 if(source.scope==='WEEKLY'){const w=model.weeks.find(w=>'W'+w.week===t.key);if(w&&(w.visibility==='AVAILABLE'||w.aggregateAvailable)){w.standings=derived.map(r=>({...w.standings.find(p=>p.name===r.name),...r,picks:w.standings.find(p=>p.name===r.name)?.picks||[]}));w.accuracyBasis=VERSION;if(w.week===model.prizes.activeWeek)model.prizes.currentWeekStandings=w.standings;}}
 if(source.scope==='MONTHLY'){const p=model.prizes.periods.find(p=>p.periodKey===t.key);if(p)p.standings=derived;}
 if(source.scope==='SEASON')model.prizes.overallStandings=derived;
 }
 model.prizes.accuracyBasis=VERSION;return model;
}
module.exports={VERSION,roster,create,validate,rows,applyModel};
