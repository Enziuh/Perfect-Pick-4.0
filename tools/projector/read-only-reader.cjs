'use strict';
const {projectCompetition}=require('./project-competition.cjs');
// No actions or native service objects. The caller must authorize the actual reader.
function projectFromReader(reader,policy) {
  let read;
  try {
    if(!reader || typeof reader!=='object' || Reflect.ownKeys(reader).length!==1 || !Object.hasOwn(reader,'readSnapshot'))throw Error();
    read=Object.getOwnPropertyDescriptor(reader,'readSnapshot').value;
    if(typeof read!=='function' || read.constructor.name==='AsyncFunction')throw Error();
  }catch{throw Error('Invalid read-only interface');}
  let snapshot;
  try{snapshot=read.call(reader);}catch{return projectCompetition(null,policy);}
  return projectCompetition(snapshot,policy);
}
module.exports={projectFromReader};
