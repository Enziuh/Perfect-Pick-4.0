'use strict';
// Pure private scoring. No services, logs, identity generation or deadline inference.
const RULE='LATE_ENTRY_V1';
function instant(value){
 try{if(Object.prototype.toString.call(value)==='[object Date]')value=Date.prototype.toISOString.call(value);
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?(?:Z|[+-]\d\d:\d\d)$/.test(value))return null;
 const [year,month,day,hour,minute,second]=value.match(/\d+/g).slice(0,6).map(Number),wall=new Date(Date.UTC(year,month-1,day,hour,minute,second));
 if(wall.getUTCFullYear()!==year||wall.getUTCMonth()+1!==month||wall.getUTCDate()!==day||wall.getUTCHours()!==hour||wall.getUTCMinutes()!==minute||wall.getUTCSeconds()!==second)return null;
 const n=Date.parse(value);return Number.isFinite(n)?n:null;}catch{return null;}
}
function verified(e,now,maxAgeMs){try{return e?.verified===true&&Number.isSafeInteger(e.revision)&&e.revision>=0&&instant(e.verifiedAt)!==null&&instant(e.verifiedAt)<=now&&now-instant(e.verifiedAt)<=maxAgeMs&&typeof e.timezone==='string'&&!!new Intl.DateTimeFormat('en',{timeZone:e.timezone});}catch{return false;}}
function cutoff(game,evidence,now,maxAgeMs){
 if(!verified(evidence,now,maxAgeMs)||!evidence.firstGame||!Array.isArray(evidence.schedule))return null;
 const matches=evidence.schedule.filter(g=>g.game===game);if(matches.length!==1)return null;
 const first=evidence.schedule.filter(g=>g.game===evidence.firstGame);if(first.length!==1||first[0].verified!==true||first[0].revision!==evidence.revision||first[0].unresolvedReschedule===true||instant(first[0].kickoff)===null)return null;
 const row=matches[0];if(row.verified!==true||row.revision!==evidence.revision||row.unresolvedReschedule===true||instant(row.kickoff)===null)return null;
 if(game===evidence.firstGame){const deadline=instant(evidence.deadline);return deadline!==null&&deadline<=instant(row.kickoff)?deadline:null;}
 return instant(row.kickoff)>=instant(first[0].kickoff)?instant(row.kickoff):null;
}
function fingerprint(row){return JSON.stringify({selections:[...row.selections].map(s=>[s.game,s.pick??null]).sort(),prediction:row.prediction??null});}
function selectEntry(rows,evidence,now,maxAgeMs){
 const valid=rows.filter(r=>instant(r.timestamp)!==null&&instant(r.timestamp)<=now&&Array.isArray(r.selections)&&r.selections.some(s=>typeof s.pick==='string'&&s.pick.trim()));
 if(!valid.length)return {entry:null,state:'NO SUBMISSION',ignored:rows.length};
 const deadline=verified(evidence,now,maxAgeMs)?cutoff(evidence.firstGame,evidence,now,maxAgeMs):null;
 const ontime=deadline===null?[]:valid.filter(r=>instant(r.timestamp)<=deadline),pool=ontime.length?ontime:valid;
 const chosenTime=(ontime.length?Math.max:Math.min)(...pool.map(r=>instant(r.timestamp))),tied=pool.filter(r=>instant(r.timestamp)===chosenTime);
 if(new Set(tied.map(fingerprint)).size!==1)throw Error('Ambiguous equal-time submissions');
 return {entry:tied[0],state:deadline===null?'UNVERIFIED CUTOFF':ontime.length?'ON TIME':'LATE FIRST ENTRY',ignored:valid.length-1};
}
function eligibility(timestamp,game,evidence,now,maxAgeMs){const time=instant(timestamp),limit=cutoff(game,evidence,now,maxAgeMs);return time===null||limit===null?'UNVERIFIED_CUTOFF':time<=limit?'ELIGIBLE':'MISSED_DEADLINE';}
function score(entry,games,evidence,now,maxAgeMs){
 if(!entry)return {state:'NO SUBMISSION',points:0,completedGames:0,totalPicks:0,perfectWeek:false,selections:[]};
 const selections=games.map(g=>{const matches=entry.selections.filter(s=>s.game===g.game);if(matches.length>1)throw Error('Duplicate selection');const pick=matches[0]?.pick??null,eligible=eligibility(entry.timestamp,g.game,evidence,now,maxAgeMs);const state=eligible==='MISSED_DEADLINE'?'MISSED DEADLINE':eligible==='UNVERIFIED_CUTOFF'?'UNVERIFIED CUTOFF':!pick?'NO PICK':g.status!=='FINAL'?'PENDING':pick===g.winner?'CORRECT':'INCORRECT';return {game:g.game,pick,eligibility:eligible,state,points:state==='CORRECT'?1:0};});
 const eligible=selections.filter(s=>s.eligibility==='ELIGIBLE'&&s.pick),completed=eligible.filter(s=>games.find(g=>g.game===s.game).status==='FINAL'),points=selections.reduce((n,s)=>n+s.points,0);
 return {points,completedGames:completed.length,totalPicks:eligible.length,perfectWeek:games.length>0&&points===games.length&&completed.length===games.length&&eligible.length===games.length,selections};
}
module.exports={RULE,instant,verified,cutoff,selectEntry,eligibility,score};
