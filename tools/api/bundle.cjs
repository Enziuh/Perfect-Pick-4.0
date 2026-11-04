'use strict';
const fs=require('node:fs'),path=require('node:path');
function bundle(entry){
 const modules={},links={};function visit(file){file=path.resolve(file);if(modules[file])return;modules[file]=fs.readFileSync(file,'utf8');links[file]={};for(const m of modules[file].matchAll(/require\(['"]([^'"]+)['"]\)/g)){if(!m[1].startsWith('.'))throw Error('Nonlocal dependency rejected');const target=path.resolve(path.dirname(file),m[1]);links[file][m[1]]=target;visit(target);}}
 visit(entry);const ids=new Map(Object.keys(modules).map((f,i)=>[f,'m'+i]));
 return `(function(){const factories={${Object.entries(modules).map(([f,s])=>JSON.stringify(ids.get(f))+':function(module,require){\n'+s+'\n}').join(',')}},links=${JSON.stringify(Object.fromEntries(Object.entries(links).map(([f,l])=>[ids.get(f),Object.fromEntries(Object.entries(l).map(([r,t])=>[r,ids.get(t)]))])))},cache={};function load(id){if(!factories[id])throw Error('Dependency rejected');if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;factories[id](module,n=>load(links[id][n]));return module.exports;}return load(${JSON.stringify(ids.get(path.resolve(entry)))});})()`;
}
module.exports={bundle};
