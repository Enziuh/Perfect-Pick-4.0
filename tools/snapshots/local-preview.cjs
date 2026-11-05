'use strict';
// Not a publication profile. Build an ignored local static browser preview only.
const fs=require('node:fs'),path=require('node:path');
const pages=require('../api/pages-artifact.cjs'),{bundle}=require('../api/bundle.cjs');
const {compactJavaScript}=require('../performance/static-assets.cjs');
function assets(file){
 const endpoint='https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec';
 const out=pages.render({endpoint,publicationApproved:true});delete out['fixtures/preview.json'];
 out['config.js']='Object.freeze(window.PERFECT_PICK_STATIC={snapshot:"./data/snapshot.json"});';
 out['preview-data.js']=compactJavaScript('('+bundle(path.join(__dirname,'browser-client.cjs'))+').install(window,window.PERFECT_PICK_STATIC);');
 out['index.html']=out['index.html'].replace(' https://script.google.com https://script.googleusercontent.com','').replace('<p id="sourceStatusNote"', '<p id="staticSnapshotNotice" class="muted" role="status">Awaiting a validated static snapshot.</p><p id="sourceStatusNote"').replaceAll('Perfect Pick 4.0 — Competition','Perfect Pick 4.0 — LOCAL FABRICATED SNAPSHOT').replace('Competition results · Official Form remains the entry method','LOCAL TEST ONLY · Fabricated data · Not live competition');
 out['data/snapshot.json']=JSON.stringify(file);return out;
}
module.exports={assets};
