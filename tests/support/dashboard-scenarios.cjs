'use strict';
const {example,AT,UNTIL}=require('./live-contract-examples.cjs');
const {createPrivateDashboard}=require('../../tools/presentation/private-dashboard.cjs');
function dashboardScenario(name){
 const e=example(name),now=Date.now(),at=new Date(now).toISOString(),until=new Date(now+300000).toISOString();
 e.snapshot=JSON.parse(JSON.stringify(e.snapshot).replaceAll(AT,at).replaceAll(UNTIL,until));e.trust.now=now;e.trust.closures=new Map(e.snapshot.weeks.map(w=>[w.week,{...w.entry}]));
 const renamed=new Map([['Synthetic Comet','Approved Atlas'],['Synthetic Maple','Approved Cedar']]);
 e.snapshot.standings.forEach(s=>s.rows?.forEach(r=>r.alias=renamed.get(r.alias)));e.snapshot.weeks.forEach(w=>w.picks?.forEach(r=>r.alias=renamed.get(r.alias)));e.trust.aliases=new Map([...e.trust.aliases].map(([key,alias])=>[key,renamed.get(alias)]));
 return createPrivateDashboard(e.snapshot,e.trust,{activeWeek:2});
}
module.exports={dashboardScenario};
