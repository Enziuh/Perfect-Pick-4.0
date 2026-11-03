'use strict';
// Tests can detect even a denied attempt swallowed by an application catch block.
function writeDenyingServices() {
  const attempts=[];
  const deny=name=>(..._args)=>{attempts.push(name);throw Error('Service operation denied');};
  const service=name=>new Proxy(Object.create(null),{get:(_target,method)=>deny(name+'.'+String(method)),set:()=>{deny(name+'.assignment')();}});
  const globals=Object.fromEntries(['SpreadsheetApp','FormApp','ScriptApp','PropertiesService','CacheService','LockService','UrlFetchApp','Logger','console'].map(name=>[name,service(name)]));
  globals.fetch=deny('fetch');
  const reader=snapshot=>Object.freeze({readSnapshot:()=>snapshot});
  return {globals,attempts,reader};
}
module.exports={writeDenyingServices};
