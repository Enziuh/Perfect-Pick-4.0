'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const wrapper=require('../tools/snapshots/authorization-wrapper.cjs'),{render}=require('../tools/snapshots/private-registry-package.cjs'),acorn=require('../tools/vendor/acorn/acorn.cjs');
test('temporary editor authorization entry is a public-named zero-argument function with only disabled-helper calls',()=>{
 const tree=acorn.parse(wrapper.SOURCE,{ecmaVersion:2020});assert.equal(tree.body.length,1);const fn=tree.body[0];assert.equal(fn.type,'FunctionDeclaration');assert.equal(fn.id.name,wrapper.NAME);assert(!wrapper.NAME.endsWith('_'));assert.deepEqual(fn.params,[]);
 const calls=[];function walk(n){if(!n||typeof n!=='object')return;if(n.type==='CallExpression'){assert.equal(n.callee.type,'Identifier');calls.push(n.callee.name);}for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(fn);
 assert.deepEqual(calls,['pp4PrivateRegistryConfig_','Error','pp4PrivateRegistry_']);assert(!/PropertiesService|Session|SpreadsheetApp|FormApp|ScriptApp|UrlFetchApp|doGet|doPost|\.save\(|\.load\(/.test(wrapper.SOURCE));
});
test('real disabled helper rejects wrapper before any Google service access or registry write',()=>{
 let calls=0;const denied=new Proxy({},{get(){calls++;throw Error('Unexpected service access');}});const context=vm.createContext({PropertiesService:denied,Session:denied,LockService:denied,Utilities:denied});vm.runInContext(wrapper.append(render()),context);
 assert.throws(()=>context[wrapper.NAME](),/Private registry disabled/);assert.equal(calls,0);assert.equal(context.pp4PrivateRegistryConfig_(),null);
});
test('wrapper refuses enabled or altered configuration before invoking registry helper',()=>{
 for(const config of [{enabled:true},{enabled:false},undefined]){let calls=0;const context=vm.createContext({pp4PrivateRegistryConfig_:()=>config,pp4PrivateRegistry_:()=>{calls++;}});vm.runInContext(wrapper.SOURCE,context);assert.throws(()=>context[wrapper.NAME](),/must remain disabled/);assert.equal(calls,0);}
});
test('cleanup restores exact reviewed source and stops on concurrent edits instead of overwriting them',()=>{
 const source=render(),candidate=wrapper.append(source);assert.equal(wrapper.remove(candidate),source);assert.throws(()=>wrapper.append(candidate));assert.throws(()=>wrapper.append(source+'\n// editor change'));assert.throws(()=>wrapper.remove(candidate+'\n// editor change'));
});
