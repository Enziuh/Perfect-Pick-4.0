'use strict';
// Pure private-store shape; safe to assemble in an owner-only Apps Script helper.
const PUBLIC_ID=/^p_[a-f0-9]{32}$/;
function validate(store){
 if(!store||Object.keys(store).sort().join(',')!=='entries,version'||store.version!==1||!Array.isArray(store.entries)||store.entries.length>10000)throw Error('Invalid private identity store');
 const sources=new Set(),ids=new Set();
 for(const e of store.entries){if(!e||Object.keys(e).sort().join(',')!=='publicId,sourceKey'||typeof e.sourceKey!=='string'||!/^p_[a-z0-9]{8,32}$/.test(e.sourceKey)||!PUBLIC_ID.test(e.publicId)||sources.has(e.sourceKey)||ids.has(e.publicId)||e.sourceKey===e.publicId)throw Error('Invalid private identity store');sources.add(e.sourceKey);ids.add(e.publicId);}
 if([...ids].some(id=>sources.has(id)))throw Error('Invalid private identity store');
 return store;
}
module.exports={PUBLIC_ID,validate};
