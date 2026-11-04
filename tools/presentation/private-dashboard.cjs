'use strict';
// In-memory owner-only assembly. No server, endpoint, snapshot export, file write or deployment.
const fs=require('node:fs'),path=require('node:path');
const {FILES}=require('../security/public-artifact.cjs');
const {createOwnerDiagnostic}=require('../verification/owner-connection.cjs');
const {createDashboardModel,createViewAdapter}=require('./contract-dashboard.cjs');
function createPrivateDashboard(snapshot,trust,context){
 const model=createDashboardModel(snapshot,trust,context);
 const assets=Object.fromEntries(FILES.filter(f=>f!=='fixtures/preview.json').map(f=>[f,fs.readFileSync(path.resolve(__dirname,'../../website',f),'utf8')]));
 const encoded=JSON.stringify(model).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 assets['preview-data.js']=`(function(){const model=${encoded};Object.defineProperty(window,'PerfectPickPreview',{value:(${createViewAdapter.toString()})(model,()=>Date.now())});setTimeout(()=>{document.querySelectorAll('.legacy-section').forEach(panel=>{if(!['rules','faq'].includes(panel.id))panel.textContent='Verified snapshot expired. Reverification required.';});for(const id of ['championHeading','championSummary','championState','status']){const element=document.getElementById(id);element.textContent='Verified snapshot expired. Reverification required.';delete element.dataset.winner;}},Math.max(0,model.expiresAt-Date.now()));})();`;
 assets['index.html']=assets['index.html'].replaceAll('Perfect Pick 4.0 — Synthetic Preview','Perfect Pick 4.0 — Owner Verification').replace('SYNTHETIC COMPETITION','PRIVATE VALIDATED SNAPSHOT').replace('2026 SEASON',snapshot.season+' SEASON').replace('Synthetic deadline example; official closure controls disclosure.','Official entry status controls disclosure.').replace('Monthly 1st Place Pool (50%)','Monthly prize pool');
 if(model.form.available){
  const escaped=model.form.url.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  assets['index.html']=assets['index.html'].replace('<button id="submitPicks" class="submit-picks" type="button" disabled aria-describedby="submitPicksNote">Submit Picks</button>',`<a id="submitPicks" class="submit-picks" href="${escaped}" target="_blank" rel="noopener noreferrer" aria-describedby="submitPicksNote">Submit Picks ↗</a>`).replace('Official entry link unavailable in this preview. Owner verification required.',model.form.message);
 }
 return Object.freeze(assets);
}
// Explicit private owner-process integration. No HTTP route or Google invocation on import.
function createOwnerDashboard(loadPrivateConfig,getSheets,clock,context){
 if(context?.authorizedPrivateInspection!==true)throw Error('Private owner inspection authorization required');
 let assets=null;
 const diagnostic=createOwnerDiagnostic(loadPrivateConfig,getSheets,clock,(snapshot,trust)=>{
  assets=createPrivateDashboard(snapshot,trust,context);
 });
 return ()=>{assets=null;const report=diagnostic();return {report,assets:report.schema==='VALID'?assets:null};};
}
module.exports={createPrivateDashboard,createOwnerDashboard};
