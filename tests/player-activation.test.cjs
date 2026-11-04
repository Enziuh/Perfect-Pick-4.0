'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {example}=require('./support/pp3-api-example.cjs');
const {toPublicName,policyAlias}=require('../tools/compatibility/pp3-display-name.cjs');
const {registryAliases}=require('../tools/api/player-authority.cjs');
const evidence=require('../tools/verification/owner-evidence.cjs');
const {decode,install}=require('../tools/api/browser-client.cjs');
const pages=require('../tools/api/pages-artifact.cjs');
const form={url:'https://docs.google.com/forms/d/e/FABRICATED_PLAYER_FORM/viewform',verified:true,approvedForPlayers:true};
const endpoint='https://script.google.com/macros/s/AKfycb_FABRICATED_PUBLIC_JSON_ROUTE/exec';
test('display names exactly match original PP3: single words, accents, multiple words and initials',()=>{
 const x=example();for(const raw of ['Avery','Zoë',' José Núñez ','Avery Middle Atlas',"O’Neil",'  Blake   Birch  ']){assert.equal(toPublicName(raw),x.sandbox.toPublicName_(raw));assert(policyAlias(toPublicName(raw)));}
 assert.equal(toPublicName('Avery'),'Avery');assert.equal(toPublicName('Avery Middle Atlas'),'Avery A.');assert(!policyAlias('Raw Full Name'));assert(!policyAlias('name@example.test'));assert(!policyAlias('555-123-4567'));assert(!policyAlias('<script>'));assert(!policyAlias('Avery\u202e'));
});
test('one-word approved names flow through strict projector/client with CLOSED privacy unchanged',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.aliases[0].alias='Avery';x.e.authority.aliases[1].alias='Zoë';let r=x.get(),m=decode(r,x.e.policy.now);assert(m.weeks[0].standings.some(p=>p.name==='Zoë'));
 x.e.authority.closures=[];r=x.get();assert.deepEqual(r.aliases,[]);assert(r.snapshot.weeks.every(w=>!w.picks&&!w.votes));
});
test('registry approval joins normalized phones privately without auto-approving or guessing names',()=>{
 const x=example(),records=x.e.authority.aliases.map((a,i)=>({sourceLabel:i?'Blake':'Avery A.',player:a.player,alias:i?'Blake':'Avery A.',approved:false,revision:1}));
 const registry=Object.fromEntries(x.e.authority.aliases.map((a,i)=>[a.privateKey,i?'Blake':'Avery Atlas']));assert.deepEqual(registryAliases(registry,records,1),[]);
 records.forEach(a=>a.approved=true);const mapped=registryAliases(registry,records,1);assert.equal(mapped.length,2);assert.equal(mapped[1].alias,'Blake');assert(!Object.hasOwn(records[0],'privateKey'));
 assert.throws(()=>registryAliases({...registry,'7777777777':'Avery Another'},records,1));records[0].alias='Avery B.';assert.throws(()=>registryAliases(registry,records,1));
});
test('server registry approvals reuse existing original context and keep phones out of responses',()=>{
 const x=example();const context=x.deps.context;x.deps.context=()=>({...context(),playerRegistry:Object.fromEntries(x.e.authority.aliases.map((a,i)=>[a.privateKey,i?'Blake':'Avery Atlas']))});x.cfg.authority={...x.e.authority,aliases:undefined,registryAliases:x.e.authority.aliases.map((a,i)=>({sourceLabel:i?'Blake':'Avery A.',player:a.player,alias:i?'Blake':'Avery A.',approved:true,revision:1}))};delete x.cfg.authority.aliases;
 const r=x.get();assert.equal(r.schema,'PP4_JSON_V1');assert(r.aliases.some(a=>a.alias==='Blake'));for(const a of x.e.authority.aliases)assert(!JSON.stringify(r).includes(a.privateKey));
 x.cfg.authority.registryAliases.forEach(a=>a.approved=false);assert.deepEqual(x.get().aliases,[]);
});
test('only explicitly attested week 8 gets closure; current OPEN week 9 and weeks 1–7 do not',()=>{
 const now=Date.parse('2026-11-04T18:00:00.000Z'),record={week:8,revision:1,attestedAt:'2026-11-04T17:59:00.000Z',status:'CLOSED',approved:true},context={revision:1,now,maxAgeMs:120000};
 const out=evidence.attestations([record],context,{activeWeek:9,status:'OPEN'});assert.deepEqual([...out.keys()],[8]);assert.equal(out.get(8).entry.checkedAt,new Date(now).toISOString());assert.equal(out.get(8).entry.validUntil,new Date(now+120000).toISOString());
 for(const control of [{activeWeek:8,status:'OPEN'},{activeWeek:8,status:'UPCOMING'},{activeWeek:9,status:'UNKNOWN'},{}])assert.equal(evidence.attestations([record],context,control).size,0);
 for(const change of [r=>r.approved=false,r=>r.status='UNKNOWN',r=>r.revision=2,r=>r.attestedAt='2027-01-01T00:00:00.000Z']){const copy={...record};change(copy);assert.equal(evidence.attestations([copy],context,{activeWeek:9,status:'OPEN'}).size,0);}
 assert.throws(()=>evidence.attestations([record,record],context,{activeWeek:9,status:'OPEN'}));
});
test('rechecking an authoritative owner decision never extends a cached snapshot or closed proof',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.closures=[];x.e.authority.closedAttestations=[{week:1,revision:1,attestedAt:new Date(x.e.policy.now-86400000).toISOString(),status:'CLOSED',approved:true}];x.matrix['Form Control'][1][5]='OPEN';
 const reply=x.get();assert.equal(reply.snapshot.weeks[0].entry.status,'CLOSED');assert.equal(reply.snapshot.weeks[1].entry.status,'UNKNOWN');assert(!reply.snapshot.weeks[1].picks);assert(reply.snapshot.weeks[0].picks);assert.throws(()=>decode(reply,x.e.policy.now+120001));
 x.e.authority.closedAttestations[0].approved=false;assert(!x.get().snapshot.weeks[0].picks);
});
test('explicit season coverage is labeled and never exposes an open week or silently changes points',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.closures=x.e.authority.closures.filter(c=>c.week===1);x.e.authority.seasonWeeks=[1];let r=x.get();const scope=r.snapshot.standings.find(s=>s.scope==='SEASON');assert.deepEqual(scope.weeks,[1]);assert.equal(scope.state,'AVAILABLE');assert.equal(decode(r,x.e.policy.now).prizes.seasonCoverage,'1');assert(!r.snapshot.weeks[1].picks);
 x.e.authority.seasonWeeks=[1,2];assert.equal(x.get().snapshot.standings.find(s=>s.scope==='SEASON').state,'WITHHELD');x.e.authority.seasonWeeks=[1,1];assert.equal(x.get().state,'UNAVAILABLE');
});
test('monthly completion derives from original configured slates and FINAL results, respecting holds',()=>{
 const x=example();x.cfg.authority=x.e.authority;x.e.authority.decisions=new Map();assert.equal(decode(x.get(),x.e.policy.now).resolutions.M1.status,'MONTHLY CHAMPION');x.matrix.Results[2][5]='Pending';assert.equal(decode(x.get(),x.e.policy.now).resolutions.M1.winner,null);
});
test('verified official Form publication requires exact allowlisting and never discloses picks',()=>{
 const cfg={endpoint,publicationApproved:true,form};const assets=pages.render(cfg);assert(assets['config.js'].includes(form.url));assert.throws(()=>pages.render({...cfg,form:{...form,approvedForPlayers:false}}));assert.throws(()=>pages.render({...cfg,form:{...form,url:form.url.replace('viewform','edit')}}));assert.throws(()=>pages.render({...cfg,form:{...form,url:form.url+'?secret=x'}}));
});
test('reviewed frontend Form link works with results-only API without approving names or closure',async()=>{
 const x=example(),elements={},root={AbortController,Event:class{},setTimeout:()=>1,clearTimeout(){},setInterval(){},document:{hidden:false,dispatchEvent(){},addEventListener(){},getElementById:id=>elements[id]||null},fetch:async()=>({ok:true,url:endpoint,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(x.get())})};
 const real=Date.now;Date.now=()=>x.e.policy.now;try{install(root,{endpoint,form});const data=await root.PerfectPickPreview.get('prizes');assert.deepEqual(data.overallStandings,[]);assert.equal(data.formControl.status,'UNKNOWN');assert.equal((await root.PerfectPickPreview.get('week','&week=1')).visibility,'WITHHELD');}finally{Date.now=real;}
});
test('owner-approved outcome scopes reuse original payout/rollover calculations only for eligible CLOSED weeks',()=>{
 for(const rollover of [false,true]){
  const x=example();x.cfg.authority=x.e.authority;x.e.authority.poolStates=[{key:'W1',state:'CONFIRMED'},{key:'M1',state:'CONFIRMED'}];x.e.authority.calculatedOutcomeWeeks=[1];
  if(rollover)x.matrix.Responses.slice(1).forEach(r=>{if(r[3])r[3]='Lions';});
  let r=x.get();assert.equal(r.schema,'PP4_JSON_V1');const p=r.snapshot.prizes.find(p=>p.key==='W1');assert.equal(p.paymentState,'UNKNOWN');assert.equal(p.allocationState,'CONFIRMED');if(rollover)assert.equal(p.rollover.cents,1000);else assert.equal(p.allocations[0].cents,1000);
  x.e.authority.closures=[];r=x.get();assert(!r.snapshot.prizes.find(p=>p.key==='W1').allocations);assert(!r.snapshot.prizes.find(p=>p.key==='W1').rollover);
 }
});
