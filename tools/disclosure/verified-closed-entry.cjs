'use strict';
// Pure evidence processing. No services, private records, writers or publication.
const late=require('../scoring/late-entry.cjs');
function entry(week,deadline,revision,now,maxAgeMs){return {snapshotRevision:revision,entry:{status:'CLOSED',authority:'OFFICIAL',revision,checkedAt:new Date(now).toISOString(),validUntil:new Date(now+maxAgeMs).toISOString(),deadline}};}
function current({week,control,form,schedule,revision,now,maxAgeMs}){
 if(!Number.isInteger(week)||week<1||week>18||Number(control?.activeWeek)!==week||control.status!=='CLOSED'||form?.responderMatchesVerified!==true||form.acceptingResponses!==false||!late.verified(schedule,now,maxAgeMs)||schedule.week!==week||schedule.revision!==revision||!schedule.firstGame||!Array.isArray(schedule.schedule)||!schedule.schedule.length)return null;
 const first=schedule.schedule.filter(g=>g.game===schedule.firstGame);
 if(first.length!==1||schedule.schedule.some(g=>g.verified!==true||g.unresolvedReschedule===true||g.revision!==revision||late.instant(g.kickoff)===null))return null;
 const kickoff=late.instant(first[0].kickoff),deadline=late.instant(schedule.deadline);
 if(deadline===null||kickoff===null||kickoff!==Math.min(...schedule.schedule.map(g=>late.instant(g.kickoff)))||deadline!==kickoff-3600000||late.instant(control.picksClose)!==deadline||late.instant(control.firstKickoff)!==kickoff||now<deadline)return null;
 return entry(week,new Date(deadline).toISOString(),revision,now,maxAgeMs);
}
function opened({week,control,form,schedule,revision,now,maxAgeMs}){
 if(!Number.isInteger(week)||week<1||week>18||Number(control?.activeWeek)!==week||control.status!=='OPEN'||form?.responderMatchesVerified!==true||form.acceptingResponses!==true||!late.verified(schedule,now,maxAgeMs)||schedule.week!==week||schedule.revision!==revision)return null;
 const first=schedule.schedule?.filter(g=>g.game===schedule.firstGame)||[];
 if(first.length!==1||schedule.schedule.some(g=>!g.verified||g.unresolvedReschedule||g.revision!==revision||late.instant(g.kickoff)===null)||late.instant(control.picksClose)!==late.instant(schedule.deadline)||late.instant(control.firstKickoff)!==late.instant(first[0].kickoff))return null;
 const result=entry(week,control.picksClose,revision,now,maxAgeMs);result.entry.status='OPEN';return result;
}
function publishedFacts(file,now){
 // Revalidate immutable captured evidence at its original capture time. This does
 // not renew scores or selections; only past CLOSED authorization facts are used.
 const captured=Date.parse(file?.capturedAt);if(!Number.isSafeInteger(captured)||captured>now)throw Error('Published closure unavailable');
 require('../snapshots/retention.cjs').validateRetained(file,captured);
 if(file.payload.snapshot.season!==2026)throw Error('Published closure unavailable');
 return file.payload.snapshot.weeks.filter(w=>file.retention.weeks.includes(w.week)&&w.entry.status==='CLOSED'&&w.entry.authority==='OFFICIAL'&&Array.isArray(w.picks)&&Array.isArray(w.votes)&&file.payload.snapshot.standings.some(t=>t.key==='W'+w.week&&t.state==='AVAILABLE')).map(w=>({week:w.week,observedAt:file.capturedAt,deadline:w.entry.deadline}));
}
function history(records,{activeWeek,revision,now,maxAgeMs}){
 if(!Number.isInteger(activeWeek)||activeWeek<1||activeWeek>18||!Number.isSafeInteger(revision)||revision<0||!Number.isSafeInteger(now)||!Number.isSafeInteger(maxAgeMs)||maxAgeMs<1||!Array.isArray(records)||records.length>18)throw Error('Published closure unavailable');const seen=new Set(),out=new Map();
 for(const r of records){if(!r||Object.keys(r).sort().join(',')!=='deadline,observedAt,week'||!Number.isInteger(r.week)||r.week<1||r.week>18||seen.has(r.week)||late.instant(r.observedAt)===null||Date.parse(r.observedAt)>now||r.deadline!==null&&late.instant(r.deadline)===null)throw Error('Published closure unavailable');if(r.week>=9&&(r.deadline===null||Date.parse(r.deadline)>Date.parse(r.observedAt)||Date.parse(r.deadline)>now))throw Error('Published closure unavailable');seen.add(r.week);if(r.week<activeWeek)out.set(r.week,entry(r.week,r.deadline,revision,now,maxAgeMs));}
 return out;
}
module.exports={current,opened,publishedFacts,history};
