'use strict';
// Local assembly for VM verification only; returns code, writes/uploads nothing.
const fs=require('node:fs'),path=require('node:path');
function buildOfflineBundle(){
 const files={contract:'../contracts/live-contract.cjs',monthly:'../projector/monthly-decision.cjs',projector:'../projector/project-competition.cjs',adapter:'sheets-read-adapter.cjs'};
 const dependencies={projector:{'../contracts/live-contract.cjs':'contract','./monthly-decision.cjs':'monthly'}};
 const factories=Object.entries(files).map(([name,file])=>JSON.stringify(name)+':function(module,require){\n'+fs.readFileSync(path.resolve(__dirname,file),'utf8')+'\n}').join(',\n');
 return `(function(root){'use strict';const factories={${factories}},links=${JSON.stringify(dependencies)},cache={};function load(id){if(!Object.hasOwn(factories,id))throw Error('Unapproved dependency');if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;factories[id](module,name=>load(links[id]?.[name]));return module.exports;}root.PerfectPick4ReadOnly=Object.freeze({create:load('adapter').create,projectCompetition:load('projector').projectCompetition});})(globalThis);`;
}
module.exports={buildOfflineBundle};
