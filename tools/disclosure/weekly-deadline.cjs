'use strict';
// Owner-approved Week9 only. Dates verified against configured Form Control + opening schedule.
const POLICY='PP4_WEEK9_DEADLINE_V1',DEADLINE='2026-11-06T00:15:00.000Z',KICKOFF='2026-11-06T01:15:00.000Z';
const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
function valid(r,s,now){
 if(!r||Object.keys(r).sort().join(',')!=='deadline,firstKickoff,observedAt,policyId,week'||r.policyId!==POLICY||r.week!==9||s.season!==2026||r.deadline!==DEADLINE||r.firstKickoff!==KICKOFF||r.observedAt!==s.generatedAt||!iso(r.observedAt)||Date.parse(r.observedAt)>now||now-Date.parse(r.observedAt)>120000||now<Date.parse(r.deadline))return false;
 const games=s.games.filter(g=>g.week===9);return games.length>0&&games.every(g=>iso(g.kickoff)&&iso(g.verifiedAt)&&Date.parse(g.verifiedAt)<=now&&now-Date.parse(g.verifiedAt)<=120000)&&Math.min(...games.map(g=>Date.parse(g.kickoff)))===Date.parse(KICKOFF)&&Date.parse(KICKOFF)-Date.parse(DEADLINE)===3600000;
}
function record(reply,now){const s=reply.snapshot,r={policyId:POLICY,week:9,deadline:DEADLINE,firstKickoff:KICKOFF,observedAt:s.generatedAt};if(!valid(r,s,now))return null;if(reply.activeWeek===9&&(reply.control.picksClose!==DEADLINE||reply.control.firstKickoff!==KICKOFF))return null;return r;}
function trusted(records,s,now){if(!Array.isArray(records)||records.length>1)throw Error('Deadline disclosure unavailable');const map=new Map();for(const r of records){if(!valid(r,s,now)||map.has(r.week))throw Error('Deadline disclosure unavailable');map.set(r.week,r);}return map;}
const permitted=(trust,week,s)=>Boolean(trust?.deadlineDisclosures?.get(week)&&valid(trust.deadlineDisclosures.get(week),s,trust.now));
module.exports={POLICY,DEADLINE,KICKOFF,valid,record,trusted,permitted};
