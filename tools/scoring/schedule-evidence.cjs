'use strict';
// Parsed output from existing PP3 ESPN reader; never use score-update timestamps.
const {instant}=require('./late-entry.cjs');
function buildScheduleEvidence({week,deadline,firstGame,revision,verifiedAt,timezone,definitions,events,normalizeTeam,hardCutoff=false}){
 if(!Array.isArray(events)||typeof normalizeTeam!=='function')throw Error('Schedule evidence unavailable');
 const schedule=definitions.filter(g=>g.week===week).map(g=>{
  const teams=[normalizeTeam(g.home),normalizeTeam(g.away)].sort().join('|');
  const matches=events.filter(e=>e&&[e.homeKey,e.awayKey].sort().join('|')===teams);
  const event=matches.length===1?matches[0]:null,unresolved=!!event&&/postpon|cancel|suspend|delay/i.test(String(event.statusName)+' '+String(event.statusDescription));
  const kickoff=event&&instant(event.date)!==null?new Date(instant(event.date)).toISOString():null;
  return {game:g.game,kickoff,revision,verified:!!event&&kickoff!==null&&!unresolved,unresolvedReschedule:unresolved};
 });
 if(hardCutoff){
  if(!schedule.length||schedule.some(s=>!s.verified)){firstGame=null;deadline=null;}
  else{const minimum=Math.min(...schedule.map(s=>instant(s.kickoff))),first=schedule.filter(s=>instant(s.kickoff)===minimum),chosen=first.length===1?first[0]:first.find(s=>s.game===firstGame);firstGame=chosen?.game??null;deadline=chosen?new Date(minimum-3600000).toISOString():null;}
 }
 return {week,deadline,firstGame,revision,verifiedAt,timezone,verified:instant(deadline)!==null&&schedule.some(s=>s.game===firstGame&&s.verified),schedule};
}
module.exports={buildScheduleEvidence};
