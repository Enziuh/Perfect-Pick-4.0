'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const {validate}=require('../../website/preview-data.js');
const ROOT=path.resolve(__dirname,'../..');
const {TEAM_FILES,validateLogo}=require('./team-assets.cjs');
const FILES=Object.freeze(['index.html','styles.css','config.js','preview-data.js','app.js','fixtures/preview.json',...TEAM_FILES]);
const STAGE=path.join(ROOT,'.preview-public');
function assert(ok,message){if(!ok)throw new Error(message);}
function inventory(dir,prefix='',strict=true) {
  const out=[];
  assert(!fs.lstatSync(dir).isSymbolicLink(),'Symlink directory rejected');
  for(const name of fs.readdirSync(dir)) {
    const relative=prefix+name,full=path.join(dir,name),stat=fs.lstatSync(full);
    assert(!stat.isSymbolicLink(),'Symlink rejected');
    if(stat.isDirectory()) {assert(!strict || ['fixtures','assets','assets/teams'].includes(relative),'Unexpected directory rejected');out.push(...inventory(full,relative+'/',strict));}
    else {assert(stat.isFile(),'Special file rejected');out.push(relative);}
  }
  return out.sort();
}
function knownIdentifiers() {
  // Read only local tracked history. Values never appear in logs or reports.
  const git=(...args)=>cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const ids=new Set();
  const source=fs.readFileSync(path.join(ROOT,'apps-script/src/00_Config_Setup.js'),'utf8');
  for(const m of source.matchAll(/SHEET_ID\s*:\s*['"]([^'"]+)/g))ids.add(m[1]);
  const refs=['main','develop'].map(name=>{try {git('rev-parse','--verify',name);return name;}catch{return 'origin/'+name;}});
  const commits=git('rev-list',...refs).trim().split('\n');
  assert(commits.length>0,'History scan incomplete');
  for(const commit of commits){
    for(const name of ['website/config.js','apps-script/.clasp.json','apps-script/src/00_Config_Setup.js']){
      if(!git('ls-tree','--name-only',commit,'--',name).trim())continue;
      const s=git('show',`${commit}:${name}`);
      for(const m of s.matchAll(/(?:"scriptId"\s*:\s*"|SHEET_ID\s*:\s*['"])([^'"\s]+)/g))ids.add(m[1]);
      for(const m of s.matchAll(/https:\/\/script\.google\.com\/macros\/s\/([^/'"\s]+)/g))ids.add(m[1]);
    }
  }
  assert(ids.size>=2,'Required infrastructure scan incomplete');
  return [...ids];
}
function verify(dir=STAGE,enforceSeal=false) {
  assert(JSON.stringify(inventory(dir))===JSON.stringify([...FILES].sort()),'Artifact allowlist mismatch');
  const ids=knownIdentifiers(),hashes={};
  const banned=[/https?:\/\//i,/["'(]\s*\/\//,/\b(?:script|docs|sheets|forms)\.google\./i,/\bespn\./i,/sourceMappingURL/i,/-----BEGIN .*PRIVATE KEY-----/,/\b(?:gh[pousr]_|github_pat_|AIza|ya29\.)[\w.-]+/,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,/(?<!\d)(?:\+1[- .]?)?\(?\d{3}\)?[- .]\d{3}[- .]\d{4}(?!\d)/,/(?:\b(?:api[_-]?key|client[_-]?secret|refresh[_-]?token|access[_-]?token|password)\b)\s*[=:]/i,/\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon|serviceWorker|importScripts)\b/];
  for(const file of FILES){
    const bytes=fs.readFileSync(path.join(dir,file));let s=bytes.toString('utf8');if(TEAM_FILES.includes(file)){validateLogo(s);s=s.replace('http://www.w3.org/2000/svg','SVG_NAMESPACE');}
    assert(!bytes.includes(0),'Binary content rejected');
    assert(!banned.some(p=>p.test(s)) && !ids.some(id=>s.includes(id)),'Prohibited artifact content: '+file);
    if(file!=='preview-data.js')assert(!/\bfetch\s*\(/.test(s),'Unexpected network adapter');
    hashes[file]=crypto.createHash('sha256').update(bytes).digest('hex');
  }
  const adapter=fs.readFileSync(path.join(dir,'preview-data.js'),'utf8');
  assert((adapter.match(/\bfetch\s*\(/g)||[]).length===1 && adapter.includes("root.fetch('./fixtures/preview.json'"),'Fixture-only adapter required');
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert(html.includes("connect-src 'self'")&&html.includes("form-action 'none'")&&html.includes("default-src 'none'"),'Isolation policy missing');
  const fragments=new Set(['#main-content','#overview','#match-center','#standings','#standings/weekly','#standings/monthly','#standings/season','#prizes','#guide','#guide/rules','#guide/faq']);
  for(const m of html.matchAll(/(src|href)="([^"]+)"/g))assert(FILES.includes(m[2].split('?')[0]) || (m[1]==='href' && fragments.has(m[2])),'Unapproved asset reference');
  assert(!/<(?:iframe|form|object|embed)\b/i.test(html),'Active external content rejected');
  validate(JSON.parse(fs.readFileSync(path.join(dir,'fixtures/preview.json'),'utf8')));
  if(enforceSeal) assert(JSON.stringify(hashes)===fs.readFileSync(path.join(ROOT,'.preview-public.seal.json'),'utf8'),'Artifact changed after staging');
  return hashes;
}
function stage(){
  assert(JSON.stringify(inventory(path.join(ROOT,'website'),'',false))===JSON.stringify([...FILES].sort()),'Unexpected website input');
  fs.mkdirSync(path.join(STAGE,'fixtures'),{recursive:true});
  fs.mkdirSync(path.join(STAGE,'assets/teams'),{recursive:true});
  for(const file of FILES)fs.copyFileSync(path.join(ROOT,'website',file),path.join(STAGE,file));
  const hashes=verify();
  fs.writeFileSync(path.join(ROOT,'.preview-public.seal.json'),JSON.stringify(hashes));
}
// Tests live outside the publication source to keep the directory allowlist exact.
if(require.main===module){
  const command=process.argv[2];
  if(command==='stage')stage();else assert(command==='verify','Use stage or verify');
  const hashes=verify(STAGE,true);
  console.log('PASS: exact reviewed frontend/logo artifact; fixture schema, isolation policy, secret and historical identifier scans.');
  console.log(JSON.stringify(hashes,null,2));
}
module.exports={FILES,STAGE,verify,stage,inventory};
