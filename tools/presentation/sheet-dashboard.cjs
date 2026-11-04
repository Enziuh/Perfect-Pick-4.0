'use strict';
// Persistent read-only delivery using existing projector/validator/reader. No production writers.
const {projectCompetition}=require('../projector/project-competition.cjs');
const {cents,mapApprovedPrizeFacts}=require('../compatibility/legacy-prize-facts.cjs');
const {validatePublic,normalizeScore}=require('../contracts/live-contract.cjs');
const {create}=require('../sheets/sheets-read-adapter.cjs');
const {workbookLayout}=require('../sheets/workbook-profile.cjs');
const {normalizePhone}=require('../compatibility/pp3-identity.cjs');
const {createParser}=require('../verification/timestamps.cjs');
const evidence=require('../verification/owner-evidence.cjs');
const {createDashboardModel,TEAM_NAMES}=require('./contract-dashboard.cjs');
const {approvedPlayerDestination}=require('./form-entry.cjs');
const need=v=>{if(!v)throw Error('Unavailable');};
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const stamp=v=>{const n=Date.parse(v);need(typeof v==='string'&&Number.isFinite(n)&&new Date(n).toISOString()===v);return n;};
const normalize=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ').replace(/\s+vs\.?\s+/g,' vs ');
const nickname=v=>normalize(v).split(' ').pop();
const team=v=>{const found=Object.entries(TEAM_NAMES).find(([abbr,name])=>normalize(v)===abbr.toLowerCase()||nickname(v)===nickname(name));need(found);return found[0];};
const resultHeaders=['Week','Game','Team 1','Team 2','Winner','Status','Team 1 Score','Team 2 Score'];
const fields='valueRanges(range,majorDimension,values)';
function captureReady(p,revision,now,maxAgeMs,resultRows){
 try{return p&&p.revision===revision&&p.quiescent===true&&p.resultRows===resultRows&&integer(p.responseRows)&&p.responseRows<=1000&&now-stamp(p.observedAt)>=0&&now-stamp(p.observedAt)<=maxAgeMs&&stamp(p.validUntil)>now;}catch{return false;}
}
function accountingFacts(answer,snapshot,policy,season){
 const a=answer.valueRanges.map(v=>v.values);need(a.length===5);
 need(a[0][0][0]==='Period Key'&&JSON.stringify(a[1][0])===JSON.stringify(['Start Week','End Week','Rule Mode','Weekly Entry','Monthly Winner %','Season %'])&&a[2][0][0]==='Include In Season'&&JSON.stringify(a[3][0])===JSON.stringify(['Week','Period Key','Active Players'])&&a[4][0][0]==='Override Weekly Pot');
 const rules=a[0].slice(1).map((r,i)=>({key:r[0],start:Number(a[1][i+1]?.[0]),end:Number(a[1][i+1]?.[1]),mode:String(a[1][i+1]?.[2]??'').trim().toUpperCase(),entry:a[1][i+1]?.[3],monthly:a[1][i+1]?.[4],season:a[1][i+1]?.[5],include:['YES','TRUE','Y','1'].includes(String(a[2][i+1]?.[0]).toUpperCase())})).filter(r=>r.key);
 for(const r of rules)need(/^M[1-9][0-9]?$/.test(r.key)&&Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=1&&r.end<=18&&r.start<=r.end&&['NEW','OLD'].includes(r.mode)&&cents(r.monthly)!==null&&cents(r.season)!==null&&cents(r.monthly)+cents(r.season)<=10000);
 const rollovers=new Map();
 const weekly=snapshot.weeks.map(w=>{
  const rule=rules.find(r=>w.week>=r.start&&w.week<=r.end);const i=a[3].findIndex((row,index)=>index>0&&Number(row[0])===w.week);
  let pot=null;if(i>0&&rule){const override=a[4][i]?.[0];if(override!==undefined&&override!==null&&String(override).trim()!=='')pot=cents(override);else {const count=a[3][i][2],entry=cents(rule.entry);if((typeof count==='number'||typeof count==='string'&&/^\d+$/.test(count.trim()))&&integer(Number(count))&&entry!==null){pot=Number(count)*entry;need(integer(pot));}}}
  const games=snapshot.games.filter(g=>g.week===w.week),table=snapshot.standings.find(t=>t.key==='W'+w.week),finalized=games.length>0&&games.every(g=>g.status==='FINAL');
  let rollover=null;if(!finalized)rollover=0;else if(table?.state==='AVAILABLE'){const perfect=table.rows.filter(r=>r.points===games.length&&r.completedGames===games.length&&r.totalPicks===games.length);rollover=rule?.mode==='NEW'&&!perfect.length?pot:0;if(rule?.mode==='NEW'&&!perfect.length&&pot!==null)rollovers.set(w.week,rule.key);}
  return {week:w.week,weeklyPot:pot===null?null:pot/100,rolloverToMonthly:rollover===null?null:rollover/100,finalized};
 });
 const periods=rules.map(r=>{const span=weekly.filter(w=>w.week>=r.start&&w.week<=r.end),known=span.length===r.end-r.start+1&&span.every(w=>w.rolloverToMonthly!==null);const pot=known?span.reduce((n,w)=>n+cents(w.rolloverToMonthly),0):null;const monthly=pot===null?null:Math.round(pot*cents(r.monthly)/10000),contribution=pot===null?null:r.include?Math.round(pot*cents(r.season)/10000):0;return {periodKey:r.key,startWeek:r.start,endWeek:r.end,ruleMode:r.mode,monthlyPot:pot===null?null:pot/100,monthlyWinnerPool:monthly===null?null:monthly/100,seasonContribution:contribution===null?null:contribution/100,monthlyWinnerPct:r.monthly,seasonPct:r.season,complete:span.every(w=>w.finalized)};});
 const known=periods.every(p=>p.seasonContribution!==null);return {season,weekly,periods,rollovers,confirmedSeasonPot:known?periods.filter(p=>p.complete).reduce((n,p)=>n+cents(p.seasonContribution),0)/100:null,projectedSeasonPot:known?periods.reduce((n,p)=>n+cents(p.seasonContribution),0)/100:null};
}
function createSheetDashboard(loadConfig,getSheets,clock){
 return function getDashboard(){
  try{
   const cfg=loadConfig();if(!cfg||cfg.enabled!==true)return {state:'DISABLED'};
   need(cfg.ownerAccessReviewed===true&&cfg.readOnlyGrantsReviewed===true&&typeof cfg.target==='string'&&cfg.target.length>0&&typeof cfg.timeZone==='string');
   need(integer(cfg.season)&&cfg.season>=2000&&cfg.season<=2200&&integer(cfg.expectedGameCount)&&cfg.expectedGameCount>0&&cfg.expectedGameCount<=398);
   const now=clock();need(integer(now));const parse=createParser(cfg.timeZone).parse;
   const maxAgeMs=cfg.maxAgeMs??21600000;need(integer(maxAgeMs)&&maxAgeMs>0&&maxAgeMs<=21600000);
   const sheets=getSheets();let nativeCalls=0;
   const read=ranges=>{need(++nativeCalls<=12);return sheets.Spreadsheets.Values.batchGet(cfg.target,{ranges,majorDimension:'ROWS',valueRenderOption:'UNFORMATTED_VALUE',dateTimeRenderOption:'SERIAL_NUMBER',fields});};
   const grid=answer=>{need(Array.isArray(answer.valueRanges)&&answer.valueRanges.length===1);const v=answer.valueRanges[0];need(v.majorDimension==='ROWS'&&/^'?Results'?!A1:H400$/.test(v.range));need(Array.isArray(v.values)&&v.values.length<=400);return v.values;};
   const first=grid(read(["'Results'!A1:H400"])),second=grid(read(["'Results'!A1:H400"]));need(JSON.stringify(first)===JSON.stringify(second));
   need(JSON.stringify(first[0])===JSON.stringify(resultHeaders));need(!first[399]?.some(v=>v!==''&&v!==null));
   const rows=first.slice(1).filter(row=>row.some(v=>v!==''&&v!==null));need(rows.length===cfg.expectedGameCount);
   let revision=0;const at=new Date(now).toISOString();
   const definitions=new Map(),games=rows.map(row=>{
    need(row.length<=8);const week=typeof row[0]==='string'&&/^\d+$/.test(row[0].trim())?Number(row[0]):row[0];need(Number.isInteger(week)&&week>=1&&week<=18&&typeof row[1]==='string');
    const home=team(row[2]),away=team(row[3]);need(home!==away);
    const game='g_w'+String(week).padStart(2,'0')+home.toLowerCase()+away.toLowerCase()+'x';const label=normalize(row[1]);need(!definitions.has(week+'|'+label));
    const parts=label.split(' vs ');need(parts.length===2&&team(parts[0])===home&&team(parts[1])===away);
    definitions.set(week+'|'+label,{week,game,home,away});
    return {week,game:row[1],team1:row[2],team2:row[3],winner:row[4]??'',status:row[5]??'Pending',team1Score:row[6]??'',team2Score:row[7]??'',verifiedAt:at};
   });
   const weeks=[...new Set(games.map(g=>g.week))].sort((a,b)=>a-b);
   let activeWeek=cfg.activeWeek,control=null;
   try{
    const controls=read(["'Form Control'!A1:A2","'Form Control'!C1:F2"]).valueRanges;
    need(controls.length===2&&controls[0].values[0][0]==='Active Week'&&JSON.stringify(controls[1].values[0])===JSON.stringify(['First Game','First Kickoff','Picks Close','Status']));
    const r=controls[1].values[1],w=Number(controls[0].values[1]?.[0]);need(weeks.includes(w));activeWeek=w;
    const time=v=>v===undefined||v===null||v===''?null:parse(v);
    const firstGame=games.find(g=>g.week===w&&normalize(g.game)===normalize(r[0]));
    control={activeWeek:w,firstGame:firstGame?TEAM_NAMES[team(firstGame.team1)]+' vs '+TEAM_NAMES[team(firstGame.team2)]:'',firstKickoff:time(r[1]),picksClose:time(r[2]),reportedStatus:['OPEN','CLOSED','UNKNOWN','UPCOMING'].includes(String(r[3]).toUpperCase())?String(r[3]).toUpperCase():'UNKNOWN'};
    // Raw status, elapsed deadlines and current-week ordering NEVER create CLOSED evidence.
   }catch{control=null;}
   need(weeks.includes(activeWeek));
   const periods=[];
   try{
    const a=read(["'Prize Rules'!A1:A20","'Prize Rules'!C1:D20"]).valueRanges;need(a.length===2&&a[0].values[0][0]==='Period Key'&&JSON.stringify(a[1].values[0])===JSON.stringify(['Start Week','End Week']));
    for(let i=1;i<a[0].values.length;i++){const key=a[0].values[i]?.[0];if(!key)continue;const range=a[1].values[i];need(/^M[1-9][0-9]?$/.test(key)&&Array.isArray(range));const start=Number(range[0]),end=Number(range[1]);need(Number.isInteger(start)&&Number.isInteger(end)&&start>=1&&end<=18&&start<=end);if(Array.from({length:end-start+1},(_,n)=>start+n).every(w=>weeks.includes(w)))periods.push({key,startWeek:start,endWeek:end,designatedGame:null});}
   }catch{periods.length=0;}
   try{
    const rules=read(["'Tiebreak Rules'!A1:B20","'Tiebreak Rules'!F1:F20"]).valueRanges;const a=rules[0].values;need(JSON.stringify(a[0])===JSON.stringify(['Week','Tiebreak Game'])&&rules[1].values[0][0]==='Method');
    for(const period of periods){const matches=a.slice(1).filter(r=>Number(r[0])===period.endWeek);if(matches.length===1&&normalize(rules[1].values[a.indexOf(matches[0])]?.[0])==='combined points'&&typeof matches[0][1]==='string')period.designatedGame=definitions.get(period.endWeek+'|'+normalize(matches[0][1]))?.game??null;}
   }catch{} // Missing designation cannot produce a tiebreak champion.
   const publicRevisionInput=JSON.stringify([games.map(g=>({week:g.week,home:team(g.team1),away:team(g.team2),status:normalize(g.status),scores:[normalizeScore(g.team1Score),normalizeScore(g.team2Score)],winner:normalize(g.status)==='final'?(normalize(g.winner)==='tie'?'TIE':team(g.winner)):null})),periods,control,cfg.authority?.revision??0]);let hi=2246822519,lo=2166136261;for(let i=0;i<publicRevisionInput.length;i++){hi=Math.imul(hi^publicRevisionInput.charCodeAt(i),3266489917)>>>0;lo=Math.imul(lo^publicRevisionInput.charCodeAt(i),16777619)>>>0;}revision=(hi&2097151)*4294967296+lo;
   const teams=new Map(Object.entries(TEAM_NAMES).map(([abbr,name])=>[name,abbr]));
   const policy={revision,now,maxAgeMs,aliases:new Map(),closures:new Map(),completeWeeks:new Map(),games:definitions,teams,periods,decisions:new Map(),accounting:new Map(),seasonWeeks:weeks};
   let snapshot=projectCompetition({revision,observedAt:at,season:cfg.season,games,weeks:weeks.map(week=>({week}))},policy);
   const authority=cfg.authority;
   try{
   if(authority){
    // Independent owner evidence is verified at its own revision, then server-bound to these fresh results.
    need(integer(authority.revision));policy.aliases=evidence.aliases(authority.aliases,authority.revision,normalizePhone);
    const closures=evidence.closures(authority.closures,{revision:authority.revision,now,maxAgeMs});
    for(const [w,c] of closures)policy.closures.set(w,{snapshotRevision:revision,entry:c.entry});
    const closedWeeks=weeks.filter(w=>policy.closures.has(w));if(closedWeeks.length)policy.seasonWeeks=closedWeeks;
    for(const p of periods){const d=authority.decisions?.get(p.key);if(d&&d.snapshotRevision===authority.revision&&now-stamp(d.verifiedAt)>=0&&now-stamp(d.verifiedAt)<=maxAgeMs)policy.decisions.set(p.key,{...d,snapshotRevision:revision});}
    for(const [key,fact] of authority.accounting||[]){if(fact.snapshotRevision===authority.revision)policy.accounting.set(key,{...fact,snapshotRevision:revision});}
   }
   const capture=authority?.capture;
   if(capture&&policy.closures.size&&policy.aliases.size){
    need(capture.revision===authority.revision&&capture.quiescent===true&&integer(capture.responseRows)&&capture.responseRows<=1000&&capture.resultRows===cfg.expectedGameCount&&now-stamp(capture.observedAt)>=0&&now-stamp(capture.observedAt)<=maxAgeMs&&stamp(capture.validUntil)>now);
    need(Number.isInteger(cfg.responseLastColumn)&&cfg.responseLastColumn>=4&&cfg.responseLastColumn<=1024);
    let number=cfg.responseLastColumn,col='';while(number){number--;col=String.fromCharCode(65+number%26)+col;number=Math.floor(number/26);}
    const a=read(["'Responses'!D1:"+col+'1']).valueRanges[0].values;need(a.length===1&&a[0].length<=cfg.responseLastColumn-3);
    const columns=[],predictions=[];
    a[0].forEach((header,i)=>{if(typeof header!=='string')return;const match=header.trim().match(/^W(\d+)\s*\|\s*(.+)$/i);if(match){const week=Number(match[1]),definition=definitions.get(week+'|'+normalize(match[2]));need(definition);columns.push({week,game:match[2].trim(),header,column:i+4});return;}const tie=header.trim().match(/^WK\s*(\d+)\s+Tie\s*Breaker\b/i);if(tie){const week=Number(tie[1]),period=periods.find(p=>p.endWeek===week&&p.designatedGame);if(period){const game=games.find(g=>definitions.get(g.week+'|'+normalize(g.game))?.game===period.designatedGame);predictions.push({week,game:game.game,header,column:i+4});}}});
    const layout=workbookLayout(cfg.season,columns,predictions);
    const result=create({values:{batchGet(target,options){need(target===cfg.target);return read(options.ranges);}},projectCompetition,now:clock,readEvidence(){return {...capture,revision};},identityKey:normalizePhone,submissionTime:parse},cfg.target,layout,policy).readPublicSnapshot();
    if(result.state==='READY'&&JSON.stringify(result.games.map(({verifiedAt,...g})=>g))===JSON.stringify(snapshot.games.map(({verifiedAt,...g})=>g)))snapshot=result;
   }
   }catch{policy.aliases=new Map();policy.closures=new Map();policy.accounting=new Map();}
   need(snapshot.state==='READY');
   if(authority?.poolStates instanceof Map&&authority.poolStates.size&&captureReady(authority.capture,authority.revision,now,maxAgeMs,cfg.expectedGameCount)){
    try{
     const ranges=["'Prize Rules'!A1:A20","'Prize Rules'!C1:H20","'Prize Rules'!L1:L20","'Weekly Prize Results'!A1:C20","'Weekly Prize Results'!G1:G20"];
     const a=read(ranges),b=read(ranges);need(JSON.stringify(a)===JSON.stringify(b));
     const facts=accountingFacts(a,snapshot,policy,cfg.season);
     const approved=mapApprovedPrizeFacts(facts,{revision,verifiedAt:at,pools:authority.poolStates,rollovers:facts.rollovers});
     const priced={...snapshot,prizes:snapshot.standings.map(table=>approved.get(table.key)?.value||snapshot.prizes.find(p=>p.key===table.key))};
     const moneyTrust={now,maxAgeMs,aliases:new Map([...policy.aliases.values()].map(a=>[a.player,a.alias])),closures:new Map([...policy.closures].map(([w,c])=>[w,c.entry])),aliasCompleteness:new Map(snapshot.weeks.map(w=>[w.week,Array.isArray(w.picks)])),prizes:new Map(priced.prizes.map(p=>[p.key,p]))};
     validatePublic(priced,moneyTrust);snapshot=priced;
    }catch{} // Unsupported accounting never hides valid game results or invents payment facts.
   }
   const finished=clock();need(integer(finished)&&finished>=now&&finished-now<=60000);
   const trust={now:finished,maxAgeMs,aliases:new Map([...policy.aliases.values()].map(a=>[a.player,a.alias])),closures:new Map([...policy.closures].map(([w,c])=>[w,c.entry])),aliasCompleteness:new Map(snapshot.weeks.map(w=>[w.week,Array.isArray(w.picks)])),prizes:new Map(snapshot.prizes.map(p=>[p.key,p]))};
   validatePublic(snapshot,trust);
   const model=createDashboardModel(snapshot,trust,{activeWeek,form:cfg.form});
   const destination=approvedPlayerDestination(cfg.form);if(destination&&model.form.available!==true&&snapshot.weeks.find(w=>w.week===activeWeek).entry.status!=='CLOSED')model.form={available:true,url:destination,label:'Submit Picks',message:'Official Form · Check entry availability on the Form.'};
   if(control)Object.assign(model.prizes.formControl,control);
   model.expiresAt=Math.min(model.expiresAt,now+maxAgeMs);
   return {state:'READY',model};
  }catch{return {state:'UNAVAILABLE'};}
 };
}
module.exports={createSheetDashboard};
