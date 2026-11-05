'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {bundle}=require('./bundle.cjs');
const {compactJavaScript,compactCss}=require('../performance/static-assets.cjs');
const {TEAM_FILES,validateLogo}=require('../security/team-assets.cjs');
const {approvedPlayerDestination}=require('../presentation/form-entry.cjs');
const {FILES,inventory}=require('../security/public-artifact.cjs');
const {assertNoPrivateReferences}=require('../verification/local-target.cjs');
const ROOT=path.resolve(__dirname,'../..'),STAGE=path.join(ROOT,'.preview-public');
function render(config){
 if(!config||!['endpoint,publicationApproved','endpoint,form,publicationApproved'].includes(Object.keys(config).sort().join(','))||config.publicationApproved!==true||!/^https:\/\/script\.google\.com\/macros\/s\/AKfycb[A-Za-z0-9_-]{14,194}\/exec$/.test(config.endpoint))throw Error('Explicit reviewed public API approval required');
 if(JSON.stringify(inventory(path.join(ROOT,'website'),'',false))!==JSON.stringify([...FILES].sort()))throw Error('Unexpected frontend source input');
 if(config.form!==undefined&&!approvedPlayerDestination(config.form))throw Error('Explicit verified player Form link required');
 const assets=Object.fromEntries(FILES.map(f=>[f,fs.readFileSync(path.join(ROOT,'website',f),'utf8')]));
 assets['config.js']='Object.freeze(window.PERFECT_PICK_JSON='+JSON.stringify({endpoint:config.endpoint,...(config.form?{form:config.form}:{})})+');\n';
 assets['preview-data.js']='('+bundle(path.join(__dirname,'browser-client.cjs'))+').install(window,window.PERFECT_PICK_JSON);\n';
 assets['index.html']=assets['index.html'].replace("connect-src 'self'", "connect-src 'self' https://script.google.com https://script.googleusercontent.com").replaceAll('Perfect Pick 4.0 — Synthetic Preview','Perfect Pick 4.0 — Competition').replaceAll('SYNTHETIC COMPETITION','READ-ONLY COMPETITION').replace('Synthetic preview · Invented aliases and results · No live submissions','Competition results · Official Form remains the entry method').replace('Synthetic deadline example; official closure controls disclosure.','Official entry status controls disclosure.').replace('Monthly 1st Place Pool (50%)','Monthly prize pool').replace('Waiting for synthetic competition data.','Awaiting validated competition data.').replace('Synthetic accounting only.','Estimated pools only; not collected funds.').replace('<div id="deadlineNotice"','<p id="sourceStatusNote" class="muted"></p><div id="deadlineNotice"').replace('</div>\n<section id="overview"','<button id="refreshResults" class="submit-picks" type="button">Refresh results</button></div>\n<section id="overview"');
 assets['app.js']=compactJavaScript(assets['app.js']);assets['preview-data.js']=compactJavaScript(assets['preview-data.js']);assets['styles.css']=compactCss(assets['styles.css']);
 return assets;
}
function verify(dir,config,seal=true){
 if(JSON.stringify(inventory(dir))!==JSON.stringify([...FILES].sort()))throw Error('Exact reviewed asset allowlist required');
 const expected=render(config),hashes={};
 for(const f of FILES){const s=fs.readFileSync(path.join(dir,f),'utf8');if(s!==expected[f])throw Error('Artifact differs from reviewed source');
  // Only the exact owner-approved public routing URL is permitted. It is not a credential.
  // All private/historical IDs, contacts, tokens and other endpoints remain prohibited.
  if(TEAM_FILES.includes(f))validateLogo(s);
  assertNoPrivateReferences(TEAM_FILES.includes(f)?s.replace('http://www.w3.org/2000/svg','SVG_NAMESPACE'):f==='config.js'?s.replace(config.endpoint,'APPROVED_PUBLIC_ROUTING_URL').replace(config.form?.url||'APPROVED_FORM_NOT_CONFIGURED','APPROVED_PLAYER_FORM_ROUTING_URL'):s);
  hashes[f]=crypto.createHash('sha256').update(s).digest('hex');
 }
 if(seal&&(!fs.lstatSync(dir+'.seal.json').isFile()||fs.lstatSync(dir+'.seal.json').isSymbolicLink()))throw Error('Invalid artifact seal');
 if(seal&&JSON.stringify(hashes)!==fs.readFileSync(dir+'.seal.json','utf8'))throw Error('Artifact seal mismatch');return hashes;
}
function stage(config,dir=STAGE){
 const contents=render(config);if(fs.existsSync(dir)&&JSON.stringify(inventory(dir))!==JSON.stringify([...FILES].sort()))throw Error('Unexpected staging input');
 fs.mkdirSync(path.join(dir,'fixtures'),{recursive:true});fs.mkdirSync(path.join(dir,'assets/teams'),{recursive:true});for(const f of FILES)fs.writeFileSync(path.join(dir,f),contents[f]);
 const hashes=verify(dir,config,false);if(fs.existsSync(dir+'.seal.json')&&(!fs.lstatSync(dir+'.seal.json').isFile()||fs.lstatSync(dir+'.seal.json').isSymbolicLink()))throw Error('Invalid artifact seal');fs.writeFileSync(dir+'.seal.json',JSON.stringify(hashes));verify(dir,config);return hashes;
}
function environment(){if(process.env.PP4_API_PUBLICATION_APPROVAL!=='APPROVED_PUBLIC_API_V1')throw Error('Live publication not approved');const config={endpoint:process.env.PP4_PUBLIC_API_URL,publicationApproved:true};if(process.env.PP4_PUBLIC_FORM_URL){if(process.env.PP4_FORM_PUBLICATION_APPROVAL!=='APPROVED_OFFICIAL_FORM_V1')throw Error('Form publication not approved');config.form={url:process.env.PP4_PUBLIC_FORM_URL,verified:true,approvedForPlayers:true};}return config;}
if(require.main===module){try{const cfg=environment();if(process.argv[2]==='stage')stage(cfg);else if(process.argv[2]==='verify')verify(STAGE,cfg);else throw Error();console.log('PASS: reviewed API Pages artifact, exact reviewed files, privacy scan and integrity seal.');}catch{console.error('API Pages publication BLOCKED: missing approval/configuration or failed artifact validation.');process.exitCode=1;}}
module.exports={render,stage,verify};
