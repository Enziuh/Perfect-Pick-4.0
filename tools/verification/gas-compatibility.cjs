'use strict';
// Build-time gate only. This module/parser is never assembled into Apps Script.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const PARSER_HASH='fdb08546776ec6228b03e8d02b40d4ab3255bae5f401adba7ff5dad927ac5c9c';
function parser(){
 const file=path.resolve(__dirname,'../vendor/acorn/acorn.cjs');
 if(fs.lstatSync(file).isSymbolicLink()||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==PARSER_HASH)throw Error('Compatibility parser integrity failure');
 const acorn=require(file);if(acorn.version!=='8.15.0')throw Error('Compatibility parser version mismatch');return acorn;
}
function checkAppsScriptCompatibility(source,label='script'){
 let tree;
 try{tree=parser().parse(source,{ecmaVersion:2020,sourceType:'script',locations:true});}
 catch(error){
  if(error.loc)throw Error(`ES2020 syntax rejected in ${label} at ${error.loc.line}:${error.loc.column}`);
  throw Error('Required compatibility parser unavailable or invalid');
 }
 const laterMethods=new Set(['at','replaceAll','findLast','findLastIndex','toSorted','toReversed','toSpliced','with']);
 function walk(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='MemberExpression'){
   const method=node.computed?node.property.value:node.property.name;
   const object=node.object.type==='Identifier'?node.object.name:null;
   if(laterMethods.has(method)||(object==='Object'&&['hasOwn','groupBy'].includes(method))||(object==='Map'&&method==='groupBy')||(object==='Promise'&&method==='any'))throw Error(`Post-2020 runtime API rejected in ${label} at ${node.loc.start.line}:${node.loc.start.column}`);
  }
  for(const [key,value] of Object.entries(node)){if(['loc','start','end'].includes(key))continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}
 }
 walk(tree);return {grammar:'ECMAScript 2020',runtimeProfile:'CONSERVATIVE_ES2020',parser:'Acorn 8.15.0'};
}
module.exports={checkAppsScriptCompatibility};
