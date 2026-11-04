'use strict';
// Deployment profile for the EXISTING 4.0 UI/backend. Builds locally; never uploads or deploys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {buildOfflineBundle}=require('../sheets/offline-bundle.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const {assertNoPrivateReferences}=require('../verification/local-target.cjs');
const {createViewAdapter}=require('./contract-dashboard.cjs');
const {startLiveClient}=require('./live-client.js');
const ROOT=path.resolve(__dirname,'../..'),STAGE=path.join(ROOT,'tmp/presentation-package');
const FILES=['Verification.gs','appsscript.json'];
const need=v=>{if(!v)throw Error('Presentation package rejected');};
function safePath(file){let current=path.resolve(file);while(current!==path.dirname(current)){if(fs.existsSync(current))need(!fs.lstatSync(current).isSymbolicLink());current=path.dirname(current);}}
function renderHtml(){
 const read=name=>fs.readFileSync(path.join(ROOT,'website',name),'utf8');
 let html=read('index.html');
 // HtmlService supplies the Google iframe sandbox and RPC bootstrap. Pages retains its strict CSP.
 html=html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]+>/,'');
 html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+read('styles.css')+'</style>');
 html=html.replace(/<script src="config.js"><\/script><script src="preview-data.js"><\/script><script src="app.js"><\/script>/,
  '<script>('+startLiveClient.toString()+')(window,('+createViewAdapter.toString()+'));<\/script><script>'+read('app.js').replace(/<\/script/gi,'<\\/script')+'<\/script>');
 html=html.replaceAll('Perfect Pick 4.0 — Synthetic Preview','Perfect Pick 4.0 — Competition').replaceAll('SYNTHETIC COMPETITION','READ-ONLY COMPETITION').replace('Synthetic preview · Invented aliases and results · No live submissions','Read-only competition data · Official Form remains the entry method').replace('Synthetic deadline example; official closure controls disclosure.','3.0 deadline information; independent closure evidence controls disclosure.').replace('Monthly 1st Place Pool (50%)','Monthly prize pool').replace('Waiting for synthetic competition data.','Monthly standings require verified closure and approved aliases.');
 html=html.replace('<div id="deadlineNotice"','<p id="sourceStatusNote" class="muted"></p><div id="deadlineNotice"');
 html=html.replace('</div>\n<section id="overview"', '<button id="refreshResults" class="submit-picks" type="button">Refresh results</button></div>\n<section id="overview"');
 need(html.includes('refreshResults')&&!html.includes('src="preview-data.js"')&&!html.includes('fixtures/preview.json'));return html;
}
function render(){
 const bundle=buildOfflineBundle({presentation:true}).replace(/\}\)\(globalThis\);$/,'})(privateRoot);');
 const backend='var PerfectPickPresentation_=(function(){const privateRoot={};\n'+bundle+'\nreturn Object.freeze({getDashboard:privateRoot.PerfectPick4ReadOnly.createSheetDashboard(privateRoot.PerfectPick4ReadOnly.loadPresentationConfig,function(){return Sheets;},function(){return Date.now();})});})();\n';
 checkAppsScriptCompatibility(backend,'Presentation backend');
 const script=backend+'var PerfectPickHtml_='+JSON.stringify(renderHtml())+';\nfunction doGet(){return HtmlService.createHtmlOutput(PerfectPickHtml_).setTitle("Perfect Pick 4.0");}\nfunction getPerfectPickDashboard(){return PerfectPickPresentation_.getDashboard();}\n';
 const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../verification/package-manifest.json'),'utf8'));
 manifest.webapp={access:'MYSELF',executeAs:'USER_ACCESSING'};
 return {'Verification.gs':script,'appsscript.json':JSON.stringify(manifest,null,2)+'\n'};
}
function inspect(contents){
 need(JSON.stringify(Object.keys(contents).sort())===JSON.stringify([...FILES].sort()));const expected=render();need(FILES.every(f=>contents[f]===expected[f]));
 checkAppsScriptCompatibility(contents['Verification.gs'],'Presentation.gs');
 const source=contents['Verification.gs'].split('var PerfectPickHtml_=')[0];
 need(!/\b(?:SpreadsheetApp|FormApp|ScriptApp|PropertiesService|UrlFetchApp|DriveApp|ContentService|Session|Logger|console)\s*[.(]/.test(source));
 need(!/\.(?:setValues?|appendRow|batchUpdate|update|clearContents|newTrigger|deleteSheet|insertSheet)\s*\(/.test(source));
 need(!/\b(?:doPost|onOpen|onEdit|onFormSubmit|syncNFL\w*|setupPerfectPick\w*)\s*\(/.test(source));
 for(const f of FILES)assertNoPrivateReferences(contents[f]);
 const m=JSON.parse(contents['appsscript.json']);need(m.webapp.access==='MYSELF'&&m.webapp.executeAs==='USER_ACCESSING');need(m.oauthScopes.length===1&&m.oauthScopes[0].endsWith('/spreadsheets.readonly'));
 return Object.fromEntries(FILES.map(f=>[f,crypto.createHash('sha256').update(contents[f]).digest('hex')]));
}
function verify(dir=STAGE){safePath(dir);need(!fs.lstatSync(dir).isSymbolicLink());need(JSON.stringify(fs.readdirSync(dir).sort())===JSON.stringify([...FILES].sort()));const contents={};for(const f of FILES){const file=path.join(dir,f);need(fs.lstatSync(file).isFile()&&!fs.lstatSync(file).isSymbolicLink());contents[f]=fs.readFileSync(file,'utf8');}const hashes=inspect(contents);need(!fs.lstatSync(dir+'.seal.json').isSymbolicLink());need(JSON.stringify(hashes)===fs.readFileSync(dir+'.seal.json','utf8'));return hashes;}
function stage(dir=STAGE){safePath(dir);if(fs.existsSync(dir)){need(!fs.lstatSync(dir).isSymbolicLink());need(fs.readdirSync(dir).every(f=>FILES.includes(f)));}else fs.mkdirSync(dir,{recursive:true});const contents=render();inspect(contents);for(const f of FILES){const file=path.join(dir,f);if(fs.existsSync(file))need(!fs.lstatSync(file).isSymbolicLink()&&fs.lstatSync(file).isFile());fs.writeFileSync(file,contents[f],{mode:0o600});}if(fs.existsSync(dir+'.seal.json'))need(!fs.lstatSync(dir+'.seal.json').isSymbolicLink());fs.writeFileSync(dir+'.seal.json',JSON.stringify(inspect(contents)),{mode:0o600});return verify(dir);}
if(require.main===module){try{need(process.argv.length===3&&['stage','verify'].includes(process.argv[2]));const hashes=process.argv[2]==='stage'?stage():verify();console.log(JSON.stringify({package:'PASS',access:'MYSELF',data:'DISABLED_BY_DEFAULT',files:FILES,hashes}));}catch{console.error('Presentation package verification failed');process.exitCode=1;}}
module.exports={FILES,STAGE,renderHtml,render,inspect,stage,verify};
