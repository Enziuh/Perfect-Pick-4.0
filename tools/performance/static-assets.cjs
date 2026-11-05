'use strict';
// Build-time whitespace/comment compaction. Readable sources stay unchanged.
// Existing pinned parser proves the JavaScript AST is identical; no mangling/dependency.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const parser=path.resolve(__dirname,'../vendor/acorn/acorn.cjs');
function compactJavaScript(source){
 if(crypto.createHash('sha256').update(fs.readFileSync(parser)).digest('hex')!=='fdb08546776ec6228b03e8d02b40d4ab3255bae5f401adba7ff5dad927ac5c9c')throw Error('Static parser integrity failure');
 const acorn=require(parser),options={ecmaVersion:'latest',sourceType:'script'},tokens=acorn.tokenizer(source,options);let result='',end=0;
 for(;;){const t=tokens.getToken();if(t.type.label==='eof')break;const gap=source.slice(end,t.start);if(result&&gap)result+=/[\r\n\u2028\u2029]/.test(gap)?'\n':' ';result+=source.slice(t.start,t.end);end=t.end;}
 const normalize=(key,value)=>key==='start'||key==='end'?undefined:value;
 assert.equal(JSON.stringify(acorn.parse(source,options),normalize),JSON.stringify(acorn.parse(result,options),normalize),'Static JS semantics changed');return result+'\n';
}
function compactCss(source){
 let result='',quote=null,space=false;
 for(let i=0;i<source.length;i++){
  const c=source[i];if(quote){result+=c;if(c==='\\'){result+=source[++i]||'';}else if(c===quote)quote=null;continue;}
  if(c==='/'&&source[i+1]==='*'){const end=source.indexOf('*/',i+2);if(end<0)throw Error('Incomplete CSS comment');i=end+1;space=true;continue;}
  if(/\s/.test(c)){space=true;continue;}
  if(space&&result&&!/[{};>]/.test(c)&&!/[{};>]/.test(result.at(-1)))result+=' ';space=false;result+=c;if(c==='"'||c==="'")quote=c;
 }
 if(quote)throw Error('Incomplete CSS string');return result.trim()+'\n';
}
module.exports={compactJavaScript,compactCss};
