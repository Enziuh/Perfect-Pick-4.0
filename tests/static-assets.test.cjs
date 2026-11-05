'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {compactJavaScript,compactCss}=require('../tools/performance/static-assets.cjs');
test('JS compaction preserves AST, template whitespace, regexp, ASI and runtime behavior',()=>{
 for(const code of ['globalThis.value=(()=>{return\n{a:1};})();','globalThis.value=` a\n b ${1+2} `;','// comment\nglobalThis.value=/a\\/b/.test("a/b");','globalThis.value=1+ +2;/* comment */','globalThis.value=(()=>{const x=1;return x/*newline\n*/+2;})();']){const a={},b={};vm.runInNewContext(code,a);vm.runInNewContext(compactJavaScript(code),b);assert.deepEqual(JSON.stringify(a.value),JSON.stringify(b.value));}
 const src=fs.readFileSync('website/app.js','utf8');assert(compactJavaScript(src).length<src.length);
});
test('CSS compaction preserves quoted content, escapes and selector separation',()=>{
 const src='/* note */\n a :hover { content: "x  y/* literal */"; --a: 1  2; }';const out=compactCss(src);assert(out.includes('a :hover'));assert(out.includes('"x  y/* literal */"'));assert.throws(()=>compactCss('/* missing'));assert.throws(()=>compactCss('a{content:"missing'));
});
