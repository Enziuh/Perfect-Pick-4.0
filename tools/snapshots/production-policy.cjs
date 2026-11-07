'use strict';
// Pure shared production scope: suitable for Apps Script, CI and local validation.
const {validate}=require('./schema.cjs');
function production(file,now){
 if(file.schema!=='PP4_STATIC_V2'||file.retention.policyId!=='pp4-historical-2026-1'||file.retention.revision!==1||!['[1,2,3,4,5,6,7,8]','[1,2,3,4,5,6,7,8,9]'].includes(JSON.stringify(file.retention.weeks))||!Array.isArray(file.aggregateStandings))throw Error('Approved static production scope required');
 validate(file,now);
 const s=file.payload.snapshot;for(const w of s.weeks)if(w.week>=9&&!file.deadlineDisclosures?.some(r=>r.week===w.week)&&(Object.hasOwn(w,'picks')||Object.hasOwn(w,'votes')))throw Error('Protected week publication blocked');
 for(const m of s.months)if(m.endWeek>=9&&(m.comparisons||m.winner!==null||m.method!=='NONE'))throw Error('Protected monthly decision blocked');
 if(file.payload.aliases.length!==23||s.games.length!==272)throw Error('Incomplete production snapshot');
 return file;
}
module.exports={production};
