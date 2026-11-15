'use strict';
// Pure shared production scope: suitable for Apps Script, CI and local validation.
const {validate}=require('./schema.cjs');
function production(file,now){
 const rollover=file.retention?.policyId==='pp4-verified-closed-2026-1'&&file.retention?.revision===1;
 if(file.schema!=='PP4_STATIC_V2'||(!rollover&&(file.retention.policyId!=='pp4-historical-2026-1'||file.retention.revision!==1||!['[1,2,3,4,5,6,7,8]','[1,2,3,4,5,6,7,8,9]','[1,2,3,4,5,6,7,8,9,10]'].includes(JSON.stringify(file.retention.weeks))))||!Array.isArray(file.aggregateStandings))throw Error('Approved static production scope required');
 validate(file,now);
 if(rollover&&file.retention.weeks.some((w,i)=>w!==i+1))throw Error('Closed period history must be contiguous');
 const s=file.payload.snapshot;if(rollover)for(const w of s.weeks.filter(w=>file.retention.weeks.includes(w.week)&&w.week>=9)){if(!w.entry.deadline||Date.parse(w.entry.deadline)>now||s.games.filter(g=>g.week===w.week).some(g=>g.kickoff===null)||w.picks?.some(p=>p.selections.some(s=>s.eligibility==='UNVERIFIED_CUTOFF')))throw Error('Verified closed schedule required');}
 for(const w of s.weeks)if(w.week>=9&&!(rollover&&w.entry.status==='CLOSED'&&w.entry.authority==='OFFICIAL')&&!file.deadlineDisclosures?.some(r=>r.week===w.week)&&(Object.hasOwn(w,'picks')||Object.hasOwn(w,'votes')))throw Error('Protected week publication blocked');
 for(const m of s.months)if(m.endWeek>=9&&(m.comparisons||m.winner!==null||m.method!=='NONE')){const span=Array.from({length:m.endWeek-m.startWeek+1},(_,i)=>m.startWeek+i);if(!rollover||m.competitionComplete!==true||!span.every(w=>file.retention.weeks.includes(w)&&s.weeks.find(x=>x.week===w)?.entry.status==='CLOSED')||s.games.filter(g=>span.includes(g.week)).some(g=>g.status!=='FINAL'))throw Error('Protected monthly decision blocked');}
 if(file.payload.aliases.length!==23||s.games.length!==272)throw Error('Incomplete production snapshot');
 return file;
}
module.exports={production};
