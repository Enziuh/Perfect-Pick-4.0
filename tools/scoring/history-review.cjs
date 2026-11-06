'use strict';
// Private in-memory comparison. The returned report is COUNTS ONLY.
const late=require('./late-entry.cjs');
const {createParser}=require('../verification/timestamps.cjs');
const {normalizePhone}=require('../compatibility/pp3-identity.cjs');
const scoreNumber=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:typeof v==='string'&&/^\d+$/.test(v.trim())&&Number.isSafeInteger(Number(v))?Number(v):null;
function ranks(rows){const sorted=[...rows].sort((a,b)=>b.points-a.points);let prior=null,rank=0;return new Map(sorted.map((r,i)=>{if(r.points!==prior)rank=i+1;prior=r.points;return [r.identity,rank];}));}
function totals(weeks,which){const sums=new Map();for(const w of weeks)for(const [identity,r]of w[which]){const n=sums.get(identity)||{identity,points:0,completedGames:0};n.points+=r.points;n.completedGames+=r.completedGames;sums.set(identity,n);}return sums;}
function changedRanks(before,after){const a=ranks(before.values()),b=ranks(after.values());return [...new Set([...a.keys(),...b.keys()])].filter(k=>a.get(k)!==b.get(k)).length;}
function review({now,timezone,rawResponses,context,evidence,oldLatest,oldScore,normalizeGame,normalizeTeam,prediction,periods}){
 if(!Array.isArray(periods)||periods.length>12||periods.some(p=>!/^M[1-9][0-9]?$/.test(p.key)))throw Error('Invalid review period');
 const parse=createParser(timezone).parse,internal=[],reports=[];let invalidTimestamps=0;
 const native=[];for(const r of rawResponses){try{const timestamp=parse(r.Timestamp),identity=normalizePhone(r['Phone Number']);if(identity&&Date.parse(timestamp)<=now)native.push({r,timestamp,identity});else invalidTimestamps++;}catch{invalidTimestamps++;}}
 for(let week=1;week<=9;week++){
  const cols=context.games.filter(g=>g.week===week),lookup=context.resultLookup[week]||{};
  const games=cols.map(c=>{const r=lookup[normalizeGame(c.game)];const final=String(r?.status).toLowerCase()==='final',a=scoreNumber(r?.team1Score),b=scoreNumber(r?.team2Score),winner=normalizeTeam(r?.winner||''),teams=[normalizeTeam(r?.team1||''),normalizeTeam(r?.team2||'')];return {game:c.game,status:final?'FINAL':'PENDING',winner,teams,verifiedResult:!final||a!==null&&b!==null&&winner===(a===b?normalizeTeam('Tie'):a>b?teams[0]:teams[1])};});
  // Owner-directed non-retroactivity: use the exact production selection and score.
  // Historical deadline reconstruction is deliberately neither required nor attempted.
  if(week<=8){
   const original=new Map();for(const row of Object.values(oldLatest).filter(s=>s.week===week)){const r=oldScore(row,cols,context.playerRegistry,context.resultLookup);original.set(row.phone,{identity:row.phone,points:r.points,completedGames:r.completedGames,totalPicks:r.totalPicks,perfectWeek:r.perfectWeek,submission:row});}
   internal.push({week,original,next:new Map(original),games});
   reports.push({week,state:'PRESERVED_LEGACY',reason:'OWNER_APPROVED_NO_RETROACTIVE_SCORING',affectedPlayers:0,affectedGames:0,pointsDelta:0,rankChanges:0});continue;
  }
  const candidates=new Map();let invalidSelections=0;
  for(const value of native){if(!cols.some(c=>String(value.r[c.header]??'').trim()))continue;const selections=cols.map(c=>({game:c.game,pick:String(value.r[c.header]??'').trim()?normalizeTeam(value.r[c.header]):null}));if(selections.some(s=>s.pick&&!games.find(g=>g.game===s.game)?.teams.includes(s.pick))){invalidSelections++;continue;}const rows=candidates.get(value.identity)||[];rows.push({identity:value.identity,timestamp:value.timestamp,selections,response:value.r,prediction:{value:prediction(value.r,week).prediction}});candidates.set(value.identity,rows);}
  const ev=evidence.get(week),known=games.filter(g=>late.cutoff(g.game,ev,now,300000)!==null).length;
  const original=new Map();for(const s of Object.values(oldLatest).filter(s=>s.week===week)){const r=oldScore(s,cols,context.playerRegistry,context.resultLookup);original.set(s.phone,{identity:s.phone,points:r.points,completedGames:r.completedGames,totalPicks:r.totalPicks,perfectWeek:r.perfectWeek,submission:s});}
  const base={week,players:candidates.size,submissionRecords:[...candidates.values()].reduce((n,a)=>n+a.length,0),duplicateRecords:[...candidates.values()].reduce((n,a)=>n+Math.max(0,a.length-1),0),scheduledGames:games.length,finalGames:games.filter(g=>g.status==='FINAL').length,verifiedKickoffs:(ev?.schedule||[]).filter(s=>s.verified===true&&s.revision===ev.revision&&late.instant(s.kickoff)!==null).length,verifiedCutoffs:known,weeklyDeadlineAvailable:late.instant(ev?.deadline)!==null,deadlineVerified:late.cutoff(ev?.firstGame,ev,now,300000)!==null,invalidSelections,invalidResults:games.filter(g=>!g.verifiedResult).length,resultGames:Object.keys(lookup).length,state:'BLOCKED',reason:games.length?'UNVERIFIED_CUTOFF':'NO_RESPONSE_GAME_COLUMNS',affectedPlayers:null,affectedGames:null,pointsDelta:null,pointsAdded:null,pointsRemoved:null,accuracyDenominatorDelta:null,rankChanges:null,lateFirstEntries:null,prohibitedResubmissions:null,changedRetainedEntries:null,missedSelections:null,perfectWeekChanges:null,weeklyPrizeEligibilityChanges:null,rolloverWouldChange:null};
  if(!games.length||known!==games.length||invalidSelections||Object.keys(lookup).length!==games.length||games.some(g=>!g.verifiedResult)){if(Object.keys(lookup).length!==games.length)base.reason='INCOMPLETE_GAME_COLUMNS';if(invalidSelections)base.reason='INVALID_SELECTIONS';if(games.some(g=>!g.verifiedResult))base.reason='INVALID_FINAL_RESULT';reports.push(base);internal.push({week,original,next:null});continue;}
  const next=new Map(),changedGames=new Set();let affected=0,pointsDelta=0,pointsAdded=0,pointsRemoved=0,denominatorDelta=0,lateFirst=0,prohibited=0,retainedChanges=0,missed=0,perfectChanges=0;
  try{
   for(const [identity,rows] of candidates){const selected=late.selectEntry(rows,ev,now,300000);if(!selected.entry)continue;const row=selected.entry,r=late.score(row,games,ev,now,300000),before=original.get(identity);next.set(identity,{...r,identity,submission:row});if(selected.state==='LATE FIRST ENTRY')lateFirst++;
    const deadline=late.cutoff(ev.firstGame,ev,now,300000);prohibited+=rows.filter(v=>Date.parse(v.timestamp)>deadline&&v!==row).length;
    missed+=r.selections.filter(s=>s.eligibility==='MISSED_DEADLINE').length;
    const sourceChanged=!!before&&(JSON.stringify(cols.map(c=>normalizeTeam(before.submission.response[c.header]||'')))!==JSON.stringify(row.selections.map(s=>s.pick||''))||String(prediction(before.submission.response,week).prediction??'')!==String(prediction(row.response,week).prediction??''));if(sourceChanged)retainedChanges++;
    const p=before?.points??0,d=before?.completedGames??0;pointsDelta+=r.points-p;denominatorDelta+=r.completedGames-d;if((before?.perfectWeek??false)!==r.perfectWeek)perfectChanges++;
    if(!before||sourceChanged||r.points!==p||r.completedGames!==d||r.totalPicks!==before.totalPicks)affected++;
    for(const g of games){const previousPick=before?normalizeTeam(before.submission.response[cols.find(c=>c.game===g.game).header]||''):'';const oldCompleted=!!previousPick&&g.status==='FINAL'&&!!g.winner,oldCorrect=oldCompleted&&previousPick===g.winner;const s=r.selections.find(s=>s.game===g.game);const completed=s.eligibility==='ELIGIBLE'&&!!s.pick&&g.status==='FINAL';if(!oldCorrect&&s.state==='CORRECT')pointsAdded++;if(oldCorrect&&s.state!=='CORRECT')pointsRemoved++;if(oldCorrect!==(s.state==='CORRECT')||oldCompleted!==completed)changedGames.add(g.game);}
   }
   if([...original.keys()].some(k=>!next.has(k)))throw Error('Missing retained entry');
   Object.assign(base,{state:'COMPARED',reason:null,affectedPlayers:affected,affectedGames:changedGames.size,pointsDelta,pointsAdded,pointsRemoved,accuracyDenominatorDelta:denominatorDelta,rankChanges:changedRanks(original,next),lateFirstEntries:lateFirst,prohibitedResubmissions:prohibited,changedRetainedEntries:retainedChanges,missedSelections:missed,perfectWeekChanges:perfectChanges});
   if(base.finalGames===games.length){const a=[...original.values()].filter(r=>r.perfectWeek).length,b=[...next.values()].filter(r=>r.perfectWeek).length;base.rolloverWouldChange=(a===0)!==(b===0);const before=new Set([...original].filter(([,r])=>r.perfectWeek).map(([k])=>k)),after=new Set([...next].filter(([,r])=>r.perfectWeek).map(([k])=>k));base.weeklyPrizeEligibilityChanges=[...new Set([...before,...after])].filter(k=>before.has(k)!==after.has(k)).length;}
   internal.push({week,original,next,games});
  }catch{base.state='BLOCKED';base.reason='AMBIGUOUS_OR_INCOMPLETE_ENTRIES';for(const k of ['affectedPlayers','affectedGames','pointsDelta','pointsAdded','pointsRemoved','accuracyDenominatorDelta','rankChanges','lateFirstEntries','prohibitedResubmissions','changedRetainedEntries','missedSelections','perfectWeekChanges','weeklyPrizeEligibilityChanges','rolloverWouldChange'])base[k]=null;internal.push({week,original,next:null});}
  reports.push(base);
 }
 function champion(parts,which,period){
  const sum=totals(parts,which),rows=[...sum.values()].sort((a,b)=>b.points-a.points);
  if(!rows.length||parts.some(w=>w.games.some(g=>g.status!=='FINAL')))return {state:'IN_PROGRESS',winner:null};
  const leaders=rows.filter(r=>r.points===rows[0].points);if(leaders.length===1)return {state:'MONTHLY_CHAMPION',winner:leaders[0].identity};
  const last=parts.find(w=>w.week===period.endWeek),g=last.games.find(g=>normalizeGame(g.game)===normalizeGame(period.game||'')),r=g?context.resultLookup[period.endWeek][normalizeGame(g.game)]:null;
  const score=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:typeof v==='string'&&/^\d+$/.test(v.trim())&&Number.isSafeInteger(Number(v))?Number(v):null;
  const a=score(r?.team1Score),b=score(r?.team2Score);if(!g||a===null||b===null)return {state:'UNVERIFIED_TIEBREAK',winner:null};
  const eligible=[];for(const leader of leaders){const entry=last[which].get(leader.identity)?.submission;if(!entry)continue;const when=which==='next'?entry.timestamp:entry.timestamp;
   if(which==='next'&&period.endWeek>=9){const timing=late.predictionEligibility(when,g.game,evidence.get(period.endWeek),now,300000);if(timing==='UNVERIFIED_CUTOFF')return {state:'UNVERIFIED_TIEBREAK',winner:null};if(timing!=='ELIGIBLE')continue;}
   const total=score(prediction(entry.response,period.endWeek).prediction);if(total!==null)eligible.push({identity:leader.identity,difference:Math.abs(total-a-b)});
  }
  if(!eligible.length)return {state:'NO_ELIGIBLE_TIEBREAKER',winner:null};const min=Math.min(...eligible.map(r=>r.difference)),tied=eligible.filter(r=>r.difference===min);return {state:tied.length===1?'MONTHLY_CHAMPION':'UNRESOLVED_TIE',winner:tied.length===1?tied[0].identity:null};
 }
 const periodReports=periods.filter(p=>p.startWeek<=9).map(p=>{
  const span=internal.filter(w=>w.week>=p.startWeek&&w.week<=p.endWeek),comparable=span.length===Math.min(p.endWeek,9)-p.startWeek+1&&span.every(w=>w.next!==null),complete=p.endWeek<=9&&comparable;
  const before=complete?champion(span,'original',p):null,after=complete?champion(span,'next',p):null,final=complete&&span.every(w=>w.games.every(g=>g.status==='FINAL'));
  let poolDeltaCents=null;if(final&&p.ruleMode==='NEW'&&Number.isFinite(p.weeklyEntry)&&Number.isFinite(p.monthlyWinnerPct)){
   const rollover=which=>span.reduce((n,w)=>n+([...w[which].values()].some(r=>r.perfectWeek)?0:Math.round(p.weeklyEntry*100)*23),0);
   poolDeltaCents=Math.round(rollover('next')*p.monthlyWinnerPct/100)-Math.round(rollover('original')*p.monthlyWinnerPct/100);
  }
  const championChanged=before&&after&&!/UNVERIFIED|IN_PROGRESS/.test(before.state+after.state)?before.state!==after.state||before.winner!==after.winner:null;
  return {key:p.key,state:p.endWeek<=8?'PRESERVED_LEGACY':complete?'COMPARED':p.endWeek>9?'IN_PROGRESS':'UNVERIFIED_CUTOFF',rankChanges:comparable?changedRanks(totals(span,'original'),totals(span,'next')):null,championStateBefore:before?.state??null,championStateAfter:after?.state??null,championChanged,estimatedMonthlyPoolDeltaCents:poolDeltaCents,prizeChanged:poolDeltaCents!==null&&championChanged!==null?poolDeltaCents!==0||championChanged:null};
 });
 const complete=internal.every(w=>w.next!==null);
 return {schema:'PP41_PRIVATE_IMPACT_COUNTS_V1',state:complete?'COMPARED':'PARTIAL',weeks:reports,periods:periodReports,season:{state:complete?'COMPARED':'UNVERIFIED_CUTOFF',rankChanges:complete?changedRanks(totals(internal,'original'),totals(internal,'next')):null},invalidTimestamps,submissionTimestampSource:'NATIVE_VALUES',publicDisclosureApproved:false,productionWrites:0};
}
module.exports={review};
