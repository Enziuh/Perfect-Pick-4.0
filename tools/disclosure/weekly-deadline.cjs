'use strict';
// Owner-approved Weeks9–10 only. Dates verified against configured Form Control + opening schedule.
const POLICY='PP4_WEEK9_DEADLINE_V1',DEADLINE='2026-11-06T00:15:00.000Z',KICKOFF='2026-11-06T01:15:00.000Z';
const GRANTS=Object.freeze([{week:9,policyId:POLICY,deadline:DEADLINE,firstKickoff:KICKOFF},{week:10,policyId:'PP4_WEEK10_DEADLINE_V1',deadline:'2026-11-13T00:15:00.000Z',firstKickoff:'2026-11-13T01:15:00.000Z'}]);
const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
function valid(r,s,now){
 const grant=GRANTS.find(g=>g.week===r?.week);
 if(!grant||!r||Object.keys(r).sort().join(',')!=='deadline,firstKickoff,observedAt,policyId,week'||r.policyId!==grant.policyId||s.season!==2026||r.deadline!==grant.deadline||r.firstKickoff!==grant.firstKickoff||r.observedAt!==s.generatedAt||!iso(r.observedAt)||Date.parse(r.observedAt)>now||now-Date.parse(r.observedAt)>120000||now<Date.parse(r.deadline))return false;
 const games=s.games.filter(g=>g.week===r.week);return games.length>0&&games.every(g=>iso(g.kickoff)&&iso(g.verifiedAt)&&Date.parse(g.verifiedAt)<=now&&now-Date.parse(g.verifiedAt)<=120000)&&Math.min(...games.map(g=>Date.parse(g.kickoff)))===Date.parse(grant.firstKickoff)&&Date.parse(grant.firstKickoff)-Date.parse(grant.deadline)===3600000;
}
function record(reply,now,week=9){if(reply.control?.activeWeek!==undefined&&(!Number.isInteger(reply.control.activeWeek)||reply.control.activeWeek<1||reply.control.activeWeek>18))return null;const grant=GRANTS.find(g=>g.week===week);if(!grant)return null;const s=reply.snapshot,r={policyId:grant.policyId,week,deadline:grant.deadline,firstKickoff:grant.firstKickoff,observedAt:s.generatedAt};if(!valid(r,s,now))return null;if((reply.control.activeWeek??reply.activeWeek)===week&&(reply.control.picksClose!==grant.deadline||reply.control.firstKickoff!==grant.firstKickoff))return null;return r;}
function records(reply,now){return GRANTS.map(g=>record(reply,now,g.week)).filter(Boolean);}
function trusted(records,s,now){if(!Array.isArray(records)||records.length>GRANTS.length)throw Error('Deadline disclosure unavailable');const map=new Map();for(const r of records){if(!valid(r,s,now)||map.has(r.week))throw Error('Deadline disclosure unavailable');map.set(r.week,r);}return map;}
const permitted=(trust,week,s)=>Boolean(trust?.deadlineDisclosures?.get(week)&&valid(trust.deadlineDisclosures.get(week),s,trust.now));
module.exports={POLICY,DEADLINE,KICKOFF,GRANTS,valid,record,records,trusted,permitted};
