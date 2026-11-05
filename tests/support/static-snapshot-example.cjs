'use strict';
// Fully fabricated272-game,23-player workload. No live capture or private dataset.
const {TEAM_NAMES}=require('../../tools/presentation/contract-dashboard.cjs');
function snapshotExample(now=Date.UTC(2026,10,5,12)){
 const at=new Date(now).toISOString(),until=new Date(now+120000).toISOString(),teams=Object.keys(TEAM_NAMES),aliases=Array.from({length:23},(_,i)=>({player:'p_fabricated'+String(i).padStart(3,'0'),alias:'Example'+String.fromCharCode(65+i)}));
 const games=[],weeks=[],standings=[],months=[],prizes=[];let count=0;
 const basis={kind:'ASSUMED_NOT_COLLECTED',participantsPerWeek:23};
 for(let week=1;week<=18;week++){
  const n=week<=2?16:15;
  for(let i=0;i<n;i++){const final=count++<121;games.push({game:'g_example'+String(week).padStart(2,'0')+String(i).padStart(2,'0'),week,home:teams[i*2],away:teams[i*2+1],kickoff:null,status:final?'FINAL':'SCHEDULED',homeScore:final?24:null,awayScore:final?17:null,winner:final?'HOME':null,verifiedAt:at});}
  const slate=games.filter(g=>g.week===week),closed=week<=8;
  const entry={status:closed?'CLOSED':week===9?'OPEN':'UPCOMING',authority:closed?'OFFICIAL':'UNVERIFIED',revision:1,checkedAt:at,validUntil:until,deadline:null};
  const picks=aliases.map((a,p)=>({...a,selections:slate.map((g,j)=>({game:g.game,team:(p+j)%3?g.home:g.away})),prediction:{game:slate.at(-1).game,total:35+p}}));
  const votes=slate.map(g=>{const home=picks.filter(p=>p.selections.find(s=>s.game===g.game).team===g.home).length;const bp=Math.round(home/23*10000);return {game:g.game,total:23,teams:[{team:g.home,count:home,basisPoints:bp},{team:g.away,count:23-home,basisPoints:10000-bp}]};});
  weeks.push({week,entry,...(closed?{picks,votes}:{})});
  const rows=picks.map(p=>{const completed=p.selections.filter(s=>games.find(g=>g.game===s.game).status==='FINAL');const points=completed.filter(s=>s.team===games.find(g=>g.game===s.game).home).length;return {player:p.player,alias:p.alias,rank:0,points,completedGames:completed.length,totalPicks:p.selections.length,accuracyBasisPoints:completed.length?Math.round(points/completed.length*10000):null};});
  standings.push({scope:'WEEKLY',key:'W'+week,weeks:[week],state:closed?'AVAILABLE':'WITHHELD',...(closed?{rows:rank(rows)}:{reason:'CLOSURE_UNVERIFIED'})});
  prizes.push({key:'W'+week,currency:'USD',poolCents:11500,poolState:'PROJECTED',allocationState:'UNAVAILABLE',paymentState:'UNKNOWN',estimateBasis:{...basis},estimatedRolloverCents:null});
 }
 function rank(rows){rows.sort((a,b)=>b.points-a.points||a.alias.localeCompare(b.alias));let last=null,rank=0;return rows.map((r,i)=>{if(last!==r.points)rank=i+1;last=r.points;return {...r,rank};});}
 function aggregate(key,scope,ws){const available=ws.every(w=>w<=8),rows=aliases.map(a=>{const parts=standings.filter(s=>s.scope==='WEEKLY'&&ws.includes(s.weeks[0])).flatMap(s=>s.rows||[]).filter(r=>r.player===a.player);const points=parts.reduce((n,r)=>n+r.points,0),completedGames=parts.reduce((n,r)=>n+r.completedGames,0);return {...a,rank:0,points,completedGames,totalPicks:parts.reduce((n,r)=>n+r.totalPicks,0),accuracyBasisPoints:completedGames?Math.round(points/completedGames*10000):null};});standings.push({key,scope,weeks:ws,state:available?'AVAILABLE':'WITHHELD',...(available?{rows:rank(rows)}:{reason:'CLOSURE_UNVERIFIED'})});}
 for(let i=0;i<5;i++){const startWeek=i*4+1,endWeek=Math.min(startWeek+3,18),key='M'+(i+1);aggregate(key,'MONTHLY',Array.from({length:endWeek-startWeek+1},(_,n)=>n+startWeek));months.push({key,startWeek,endWeek,competitionComplete:false,designatedGame:games.filter(g=>g.week===endWeek).at(-1).game,state:'IN PROGRESS',winner:null,actualTotal:null,method:'NONE'});prizes.push({key,currency:'USD',poolCents:null,poolState:'UNAVAILABLE',allocationState:'UNAVAILABLE',paymentState:'UNKNOWN'});}
 aggregate('S2026','SEASON',[1,2,3,4,5,6,7,8]);prizes.push({key:'S2026',currency:'USD',poolCents:null,poolState:'UNAVAILABLE',allocationState:'UNAVAILABLE',paymentState:'UNKNOWN'});
 return {schema:'PP4_JSON_V1',activeWeek:9,control:{activeWeek:9,firstGame:'',firstKickoff:'',picksClose:'',reportedStatus:'OPEN'},form:null,aliases,snapshot:{version:'pp4-public/1',revision:1,generatedAt:at,state:'READY',season:2026,scoringBasis:'SUBMITTED_FINAL_PICKS',games,weeks,standings,months,prizes}};
}
module.exports={snapshotExample};
