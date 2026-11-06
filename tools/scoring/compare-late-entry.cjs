'use strict';
// Owner-only, normalized private inputs. Output contains counts/deltas, NEVER identities.
const late=require('./late-entry.cjs');
function compareWeeklyEntries(rows,games,evidence,now,maxAgeMs){
 if(games.some(g=>late.cutoff(g.game,evidence,now,maxAgeMs)===null))return {state:'BLOCKED',reason:'UNVERIFIED_CUTOFF',affectedEntries:null};
 const groups=new Map();for(const r of rows){if(typeof r.identity!=='string'||!r.identity||late.instant(r.timestamp)===null||!r.selections?.some(s=>s.pick))continue;const a=groups.get(r.identity)||[];a.push(r);groups.set(r.identity,a);}
 let affectedEntries=0,entrySelectionChanges=0,pointsDelta=0,denominatorDelta=0,perfectWeekChanges=0;
 for(const entries of groups.values()){
  const old=entries.reduce((a,b)=>late.instant(b.timestamp)>=late.instant(a.timestamp)?b:a),chosen=late.selectEntry(entries,evidence,now,maxAgeMs).entry;
  if(!chosen)return {state:'BLOCKED',reason:'INVALID_ENTRY',affectedEntries:null};
  const completed=old.selections.filter(s=>s.pick&&games.find(g=>g.game===s.game)?.status==='FINAL'),oldPoints=completed.filter(s=>s.pick===games.find(g=>g.game===s.game).winner).length;
  const next=late.score(chosen,games,evidence,now,maxAgeMs),changed=JSON.stringify(old)!==JSON.stringify(chosen),oldPerfect=games.length>0&&oldPoints===games.length&&completed.length===games.length&&old.selections.filter(s=>s.pick).length===games.length;
  if(changed)entrySelectionChanges++;if(oldPerfect!==next.perfectWeek)perfectWeekChanges++;
  if(changed||oldPoints!==next.points||completed.length!==next.completedGames||oldPerfect!==next.perfectWeek)affectedEntries++;
  pointsDelta+=next.points-oldPoints;denominatorDelta+=next.completedGames-completed.length;
 }
 return {state:'COMPARED',entries:groups.size,affectedEntries,entrySelectionChanges,pointsDelta,denominatorDelta,perfectWeekChanges};
}
module.exports={compareWeeklyEntries};
