'use strict';
// Loopback STATIC test assets only. The browser intercepts its own API request;
// this server has no API route, proxy, snapshot data, or Google connection.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {FILES}=require('../security/public-artifact.cjs'),{render}=require('../api/pages-artifact.cjs');
const before=process.argv[2];if(!before)throw Error('Verified baseline artifact directory required');
const old=Object.fromEntries(FILES.map(f=>[f,fs.readFileSync(path.join(before,f),'utf8')]));
const context={window:{}};vm.runInNewContext(old['config.js'],context,{timeout:100});const cfg=context.window.PERFECT_PICK_JSON;
const current=render({endpoint:cfg.endpoint,publicationApproved:true,...(cfg.form?{form:cfg.form}:{})});
const server=http.createServer((req,res)=>{const m=new URL(req.url,'http://localhost').pathname.match(/^\/(before|after)\/Perfect-Pick-4\.0\/(.*)$/);const name=m?.[2]||'index.html',assets=m?.[1]==='before'?old:current;if(!m||!FILES.includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.json')?'application/json':'text/html');res.setHeader('Cache-Control',name==='index.html'?'no-cache':'public,max-age=600');res.end(assets[name]);});
server.listen(4791,'127.0.0.1',()=>console.log('Frozen static before/after assets ready on loopback4791; no API/proxy route'));
