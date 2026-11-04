'use strict';
// Private owner configuration only. No I/O, identity derivation, renewal or publication.
function configuredMap(value,kind){
 if(value===undefined)return new Map();
 if(value instanceof Map)return new Map(value);
 if(!Array.isArray(value)||value.length>50)throw Error('Invalid private authority');
 const map=new Map();
 for(const row of value){
  const keys=kind==='pool'?['key','state']:kind==='decision'?['key','snapshotRevision','complete','verifiedAt']:['key','snapshotRevision','verifiedAt','value'];
  if(!row||Object.keys(row).sort().join(',')!==keys.sort().join(',')||!/^([WM][1-9][0-9]?|S20[0-9]{2})$/.test(row.key)||map.has(row.key))throw Error('Invalid private authority');
  const {key,...evidence}=row;map.set(key,kind==='pool'?row.state:evidence);
 }
 return map;
}
function requireDisplayAliases(records){
 if(!Array.isArray(records)||records.some(r=>typeof r?.alias!=='string'||!/^[A-Za-z]+(?:['-][A-Za-z]+)* [A-Z]\.$/.test(r.alias)))throw Error('Explicit first-name and last-initial approval required');
 return records;
}
function approvedAllocationWeeks(records,revision,now,maxAgeMs){
 if(records===undefined)return new Set();
 if(!Array.isArray(records)||records.length>18)throw Error('Invalid allocation approval');
 const out=new Set();
 for(const r of records){
  if(!r||Object.keys(r).sort().join(',')!=='approved,snapshotRevision,verifiedAt,week'||!Number.isInteger(r.week)||r.week<1||r.week>18||out.has(r.week))throw Error('Invalid allocation approval');
  const at=Date.parse(r.verifiedAt);
  if(r.approved!==true||r.snapshotRevision!==revision||!Number.isFinite(at)||new Date(at).toISOString()!==r.verifiedAt||at>now||now-at>maxAgeMs)continue;
  out.add(r.week);
 }
 return out;
}
function approvedRollovers(records,revision,now,maxAgeMs){
 if(records===undefined)return new Map();
 if(!Array.isArray(records)||records.length>18)throw Error('Invalid rollover approval');
 const weeks=approvedAllocationWeeks(records.map(r=>{if(!r||!/^M[1-9][0-9]?$/.test(r.to))throw Error('Invalid rollover approval');const {to,...approval}=r;return approval;}),revision,now,maxAgeMs);
 return new Map(records.filter(r=>weeks.has(r.week)).map(r=>[r.week,r.to]));
}
module.exports={configuredMap,requireDisplayAliases,approvedAllocationWeeks,approvedRollovers};
