'use strict';
// Public, auditable owner decision. This is retention permission, NOT an API token.
// New weeks/seasons need a separately reviewed owner decision; deadlines never add one.
const POLICY=Object.freeze({id:'pp4-historical-2026-1',revision:1,season:2026,approvedOn:'2026-11-05',decision:'OWNER_STATIC_SNAPSHOT_SAFEGUARDS',weeks:Object.freeze([1,2,3,4,5,6,7,8]),validUntil:null});
const SCORE_MAX_AGE_MS=21600000;
function authorized(week,entry,season,at,policy=POLICY,until=policy?.validUntil){
 return Boolean(policy&&Number.isFinite(Date.parse(policy.approvedOn+'T00:00:00.000Z'))&&Date.parse(policy.approvedOn+'T00:00:00.000Z')<=at&&policy.season===season&&policy.weeks.includes(week)&&entry?.status==='CLOSED'&&entry.authority==='OFFICIAL'&&(policy.validUntil===null||Date.parse(policy.validUntil)>at)&&(until===null||Number.isFinite(Date.parse(until))&&Date.parse(until)>at));
}
module.exports={POLICY,SCORE_MAX_AGE_MS,authorized};
