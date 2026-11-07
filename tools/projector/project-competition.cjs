'use strict';
const late=require('../scoring/late-entry.cjs');
const {safeAlias}=require('../compatibility/pp3-display-name.cjs');
const {VERSION,normalizeScore,validatePublic} = require('../contracts/live-contract.cjs');
const {monthlyDecision} = require('./monthly-decision.cjs');
const integer = value => Number.isSafeInteger(value) && value >= 0;
const requireValue = value => { if (!value) throw Error('Invalid fabricated source'); };
function timestamp(value) {
  requireValue(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value));
  const ms = Date.parse(value);
  requireValue(Number.isFinite(ms) && new Date(ms).toISOString() === value);
  return ms;
}
const fresh = (value,policy) => {try {const ms=timestamp(value);return ms<=policy.now && policy.now-ms<=policy.maxAgeMs;}catch{return false;}};
const array = (value,max=1000) => {requireValue(Array.isArray(value) && value.length<=max);return value;};
const unique = values => requireValue(new Set(values).size === values.length);
function entryProjection(evidence, policy) {
  const unknown = {status:'UNKNOWN',authority:'UNVERIFIED',revision:0,checkedAt:new Date(policy.now).toISOString(),validUntil:new Date(policy.now).toISOString(),deadline:null};
  try {
    const e = evidence.entry;
    if (evidence.snapshotRevision !== policy.revision || e.authority !== 'OFFICIAL' || !fresh(e.checkedAt,policy) || timestamp(e.validUntil)<=policy.now) return unknown;
    if (!['OPEN','CLOSED','UPCOMING'].includes(e.status) || !integer(e.revision)) return unknown;
    if(e.deadline!==null)timestamp(e.deadline);
    return {status:e.status,authority:'OFFICIAL',revision:e.revision,checkedAt:e.checkedAt,validUntil:e.validUntil,deadline:e.deadline};
  } catch {return unknown;}
}
function ranked(rows) {
  rows.sort((a,b) => b.points-a.points || a.player.localeCompare(b.player));
  let prior=null, rank=0;
  return rows.map((row,i) => {
    if(row.points!==prior)rank=i+1;prior=row.points;
    return {player:row.player,alias:row.alias,rank,points:row.points,completedGames:row.completedGames,totalPicks:row.totalPicks,
      accuracyBasisPoints:row.completedGames ? Math.round(row.points/row.completedGames*10000) : null};
  });
}
const normalizedLabel = label => {requireValue(typeof label==='string');return label.trim().toLowerCase().replace(/\s+/g,' ').replace(/\s*\|\s*/g,'|').replace(/\s+vs\.?\s+/g,' vs ');};
function approvedTeam(value,policy) {
  if(typeof value!=='string')return undefined;
  const nickname=normalizedLabel(value).split(' ').pop();
  const matches=[...new Set([...policy.teams].filter(([name])=>normalizedLabel(name).split(' ').pop()===nickname).map(([,team])=>team))];
  requireValue(matches.length<=1);return matches[0];
}
function gameDefinition(week,label,policy) {
  if(typeof label!=='string')return undefined;
  const wanted=normalizedLabel(`${week}|${label}`);
  const matches=[...policy.games].filter(([name])=>normalizedLabel(name)===wanted);
  requireValue(matches.length<=1);return matches[0]?.[1];
}
function gamesProjection(source, policy, weeks) {
  const records = array(source.games,400);
  const byLabel = new Map();
  for (const row of records) {
    const label = normalizedLabel(`${row.week}|${row.game}`);
    requireValue(!byLabel.has(label));byLabel.set(label,row);
  }
  const definitions = [...policy.games.entries()].filter(([,g]) => weeks.includes(g.week));
  requireValue(definitions.length === records.length);
  return definitions.map(([label,definition]) => {
    const row = byLabel.get(normalizedLabel(label));requireValue(row && row.week===definition.week);
    requireValue(approvedTeam(row.team1,policy)===definition.home && approvedTeam(row.team2,policy)===definition.away);
    requireValue(fresh(row.verifiedAt,policy));
    const statuses = new Map([['final','FINAL'],['pending','PENDING'],['scheduled','SCHEDULED'],['in progress','IN_PROGRESS']]);
    const status = statuses.get(normalizedLabel(row.status));requireValue(status);
    const homeScore=normalizeScore(row.team1Score), awayScore=normalizeScore(row.team2Score);
    let winner=null;
    if(status==='FINAL'){
      requireValue(homeScore!==null && awayScore!==null && integer(homeScore+awayScore));
      winner = homeScore===awayScore ? 'TIE' : homeScore>awayScore ? 'HOME' : 'AWAY';
      const expected = winner==='TIE' ? 'Tie' : winner==='HOME' ? definition.home : definition.away;
      requireValue((typeof row.winner==='string'&&normalizedLabel(row.winner)==='tie'?'Tie':approvedTeam(row.winner,policy))===expected);
    }
    // Ignore raw correctness/winner flags for nonfinal games.
    return {game:definition.game,week:definition.week,home:definition.home,away:definition.away,
      kickoff:row.kickoff ?? null,status,homeScore,awayScore,winner,verifiedAt:row.verifiedAt};
  });
}
function selectionsProjection(row, week, policy, games) {
  const selections=[];
  for(const raw of array(row.selections,32)) {
    if((typeof raw.pick==='string'&&raw.pick.trim()==='') || raw.pick===null || raw.pick===undefined)continue;
    const definition=gameDefinition(week,raw.game,policy),team=approvedTeam(raw.pick,policy);
    requireValue(definition && games.some(g=>g.game===definition.game) && [definition.home,definition.away].includes(team));
    selections.push({game:definition.game,team});
  }
  unique(selections.map(s=>s.game));return selections;
}
function weeklyProjection(rawWeek, entry, policy, games) {
  const base={scope:'WEEKLY',key:'W'+rawWeek.week,weeks:[rawWeek.week],state:'WITHHELD',reason:'CLOSURE_UNVERIFIED'};
  if(entry.status!=='CLOSED'&&!policy.deadlineDisclosures?.has(rawWeek.week))return {table:base,complete:false}; // Do not read submissions before closure.
  if(policy.completeWeeks.get(rawWeek.week)!==true)return {table:{...base,reason:'INCOMPLETE'},complete:false};
  try {
    const latest=new Map(),candidates=new Map();
    const lateRules=late.applies(policy,rawWeek.week),cutoffs=policy.lateEntryEvidence?.get(rawWeek.week);
    for(const raw of array(rawWeek.submissions)) {
      requireValue(typeof raw.identity==='string' && raw.identity.length>0);
      if(!array(raw.selections,32).some(s=>s.pick!==null&&s.pick!==undefined&&String(s.pick).trim()!==''))continue;
      let when;try{when=timestamp(raw.timestamp);requireValue(when<=policy.now);}catch(e){if(lateRules)continue;throw e;} // Same legacy rule: no game selections means no weekly entry.
      if(lateRules){try{selectionsProjection(raw,rawWeek.week,policy,games);}catch{continue;}const items=candidates.get(raw.identity)||[];items.push(raw);candidates.set(raw.identity,items);continue;}
      const previous=latest.get(raw.identity);
      if(!previous || when>=previous.when)latest.set(raw.identity,{raw,when});
    }
    if(lateRules)for(const [identity,items] of candidates){const chosen=late.selectEntry(items,cutoffs,policy.now,policy.maxAgeMs);if(chosen.entry)latest.set(identity,{raw:chosen.entry,when:timestamp(chosen.entry.timestamp),entryState:chosen.state});}
    for(const candidate of latest.values())candidate.selections=selectionsProjection(candidate.raw,rawWeek.week,policy,games);
    const approvals=[];
    for(const identity of latest.keys()){
      const a=policy.aliases.get(identity);
      if(!a || a.approved!==true || !/^p_[a-z0-9]{8,32}$/.test(a.player) || !safeAlias(a.alias))return {table:{...base,reason:'MISSING_ALIAS'},complete:false};
      const collisions=[...policy.aliases.values()].filter(other=>other?.approved===true && (other.player===a.player || other.alias===a.alias));
      if(collisions.length!==1)return {table:{...base,reason:'MISSING_ALIAS'},complete:false};
      approvals.push(a);
    }
    if(new Set(approvals.map(a=>a.player)).size!==approvals.length || new Set(approvals.map(a=>a.alias)).size!==approvals.length)return {table:{...base,reason:'MISSING_ALIAS'},complete:false};
    const picks=[...latest.values()].map(({raw,selections,entryState},i)=>{
      if(lateRules)selections=games.filter(g=>g.week===rawWeek.week).map(g=>({game:g.game,team:selections.find(s=>s.game===g.game)?.team??null,eligibility:late.eligibility(raw.timestamp,g.game,cutoffs,policy.now,policy.maxAgeMs)}));
      if(!lateRules&&policy.lateEntryRules===late.RULE)selections=selections.map(s=>({...s,eligibility:'LEGACY'}));
      const a=approvals[i],pick={player:a.player,alias:a.alias,selections};
      const period=policy.periods.find(p=>p.endWeek===rawWeek.week && p.designatedGame!==null);
      if(period){
        let total=null;
        try{if(gameDefinition(rawWeek.week,raw.prediction?.game,policy)?.game===period.designatedGame)total=normalizeScore(raw.prediction.value);}catch{/* Missing/invalid predictions are ineligible, never zero. */}
        // Owner-approved: retained entry prediction is eligible through designated kickoff.
        const timing=lateRules?(entryState==='UNVERIFIED CUTOFF'?'UNVERIFIED_CUTOFF':late.predictionEligibility(raw.timestamp,period.designatedGame,cutoffs,policy.now,policy.maxAgeMs)):null;
        if(lateRules&&timing!=='ELIGIBLE')total=null;
        pick.prediction={game:period.designatedGame,total,...(policy.lateEntryRules===late.RULE?{eligibility:lateRules?timing:'LEGACY'}:{})};
      }
      return pick;
    }).sort((a,b)=>a.player.localeCompare(b.player));
    const rows=ranked(picks.map(p=>{
      const eligible=p.selections.filter(s=>(!lateRules||s.eligibility==='ELIGIBLE')&&s.team!==null);
      const completed=eligible.filter(s=>games.find(g=>g.game===s.game).status==='FINAL');
      const correct=completed.filter(s=>{const g=games.find(g=>g.game===s.game);return s.team===(g.winner==='HOME'?g.home:g.winner==='AWAY'?g.away:null);});
      return {player:p.player,alias:p.alias,points:correct.length,completedGames:completed.length,totalPicks:eligible.length};
    }));
    const votes=games.filter(g=>g.week===rawWeek.week).map(g=>{
      const counts=[g.home,g.away].map(team=>picks.filter(p=>p.selections.some(s=>s.game===g.game && s.team===team && (!lateRules||s.eligibility==='ELIGIBLE'))).length);
      const total=counts[0]+counts[1],home=total?Math.round(counts[0]/total*10000):0;
      return {game:g.game,total,teams:[g.home,g.away].map((team,i)=>({team,count:counts[i],basisPoints:total?(i===0?home:10000-home):0}))};
    });
    return {table:{scope:'WEEKLY',key:base.key,weeks:base.weeks,state:'AVAILABLE',rows},picks,votes,complete:true,tiebreakUnverifiedPlayers:lateRules?picks.filter(p=>p.prediction?.eligibility==='UNVERIFIED_CUTOFF').map(p=>p.player):[],cutoffUnverified:lateRules&&picks.some(p=>p.selections.some(s=>s.eligibility==='UNVERIFIED_CUTOFF'))};
  }catch{return {table:{...base,reason:'INCOMPLETE'},complete:false};}
}
function aggregate(scope,key,weeks,tables) {
  const parts=weeks.map(week=>tables.find(t=>t.key==='W'+week));
  const unavailable=parts.find(part=>!part || part.state!=='AVAILABLE');
  if(unavailable || parts.some(part=>!part))return {scope,key,weeks:[...weeks],state:'WITHHELD',reason:unavailable?.reason || 'INCOMPLETE'};
  const totals=new Map();
  for(const part of parts)for(const r of part.rows){
    const total=totals.get(r.player)||{player:r.player,alias:r.alias,points:0,completedGames:0,totalPicks:0};
    total.points+=r.points;total.completedGames+=r.completedGames;total.totalPicks+=r.totalPicks;totals.set(r.player,total);
  }
  return {scope,key,weeks:[...weeks],state:'AVAILABLE',rows:ranked([...totals.values()])};
}
function accountingProjection(key,policy) {
  const unavailable={key,currency:'USD',poolCents:null,poolState:'UNAVAILABLE',allocationState:'UNAVAILABLE',paymentState:'UNKNOWN'};
  const affected=key[0]==='W'?late.applies(policy,Number(key.slice(1))):key[0]==='M'?policy.periods.some(p=>p.key===key&&late.applies(policy,p.endWeek)):policy.seasonWeeks.some(w=>late.applies(policy,w));
  if(affected)return unavailable; // Legacy accounting is not reauthorized by a scoring update.
  const evidence=policy.accounting.get(key);
  if(!evidence || evidence.snapshotRevision!==policy.revision || !fresh(evidence.verifiedAt,policy))return unavailable;
  const raw=evidence.value;
  const result={key,currency:raw.currency,poolCents:raw.poolCents??null,poolState:raw.poolState??'UNAVAILABLE',allocationState:raw.allocationState??'UNAVAILABLE',paymentState:raw.paymentState??'UNKNOWN'};
  if(raw.allocations!==undefined)result.allocations=array(raw.allocations).map(a=>({player:a.player,cents:a.cents}));
  if(raw.rollover!==undefined)result.rollover={to:raw.rollover.to,cents:raw.rollover.cents};
  if(raw.projectedPoolCents!==undefined)result.projectedPoolCents=raw.projectedPoolCents;
  if(raw.funding!==undefined){const f=raw.funding;result.funding={rolloverCents:f.rolloverCents,monthlyPrizeCents:f.monthlyPrizeCents,seasonContributionCents:f.seasonContributionCents,monthlyShareBasisPoints:f.monthlyShareBasisPoints,seasonShareBasisPoints:f.seasonShareBasisPoints};}
  return result;
}
function projectCompetition(source,policy) {
  // Policy is a server-owned capability, never request or source-row authority.
  let generatedAt;
  try {
    requireValue(policy && integer(policy.now) && integer(policy.revision) && integer(policy.maxAgeMs) && policy.maxAgeMs>0);
    generatedAt=new Date(policy.now).toISOString();timestamp(generatedAt);
  }catch{throw Error('Invalid projector policy');}
  const unavailable=reason=>({version:VERSION,revision:policy.revision,generatedAt,state:'UNAVAILABLE',reason});
  try {
    for(const field of ['aliases','closures','completeWeeks','games','teams','decisions','accounting'])requireValue(policy[field] instanceof Map);
    if(!source || !source.observedAt)return unavailable('UNVERIFIED');
    if(!fresh(source.observedAt,policy))return unavailable('STALE');
    if(source.revision!==policy.revision)return unavailable('INCONSISTENT');
    const rawWeeks=array(source.weeks,18),numbers=rawWeeks.map(w=>w.week);unique(numbers);
    let games;try{games=gamesProjection(source,policy,numbers);}catch{return unavailable('INVALID_RESULTS');}
    if(policy.lateEntryRules===late.RULE)requireValue(Number.isInteger(policy.lateEntryStartWeek??9)&&(policy.lateEntryStartWeek??9)>=1&&(policy.lateEntryStartWeek??9)<=18);
    const snapshot={...(policy.lateEntryRules===late.RULE?{lateEntryStartWeek:policy.lateEntryStartWeek??9}:{}),version:VERSION,revision:policy.revision,generatedAt,state:'READY',season:source.season,scoringBasis:policy.lateEntryRules===late.RULE?'ELIGIBLE_SUBMITTED_FINAL_PICKS':'SUBMITTED_FINAL_PICKS',weeks:[],games,standings:[],months:[],prizes:[]};
    const unverifiedTiebreakWeeks=new Map(),unverifiedCutoffWeeks=new Set();
    const trust={deadlineDisclosures:policy.deadlineDisclosures||new Map(),now:policy.now,maxAgeMs:policy.maxAgeMs,aliases:new Map(),closures:new Map(),aliasCompleteness:new Map(),prizes:new Map()};
    for(const rawWeek of rawWeeks){
      const entry=entryProjection(policy.closures.get(rawWeek.week),policy);
      const projected=weeklyProjection(rawWeek,entry,policy,games);
      if(projected.tiebreakUnverifiedPlayers?.length)unverifiedTiebreakWeeks.set(rawWeek.week,projected.tiebreakUnverifiedPlayers);
      if(projected.cutoffUnverified)unverifiedCutoffWeeks.add(rawWeek.week);
      const publicWeek={week:rawWeek.week,entry};
      if(projected.complete){publicWeek.picks=projected.picks;publicWeek.votes=projected.votes;for(const p of projected.picks)trust.aliases.set(p.player,p.alias);}
      snapshot.weeks.push(publicWeek);snapshot.standings.push(projected.table);
      trust.closures.set(rawWeek.week,entry);trust.aliasCompleteness.set(rawWeek.week,projected.complete);
    }
    const periods=array(policy.periods,12);unique(periods.map(p=>p.key));unique(periods.map(p=>p.endWeek));
    for(const period of periods){
      requireValue(Number.isInteger(period.startWeek)&&Number.isInteger(period.endWeek)&&period.endWeek>=period.startWeek&&period.startWeek>=1&&period.endWeek<=18);
      const weeks=Array.from({length:period.endWeek-period.startWeek+1},(_,i)=>period.startWeek+i);
      const table=aggregate('MONTHLY',period.key,weeks,snapshot.standings);snapshot.standings.push(table);
      const evidence=policy.decisions.get(period.key);
      const leaders=table.rows?.filter(r=>r.points===table.rows[0]?.points)||[];
      const tiebreakUnknown=leaders.length>1&&leaders.some(r=>unverifiedTiebreakWeeks.get(period.endWeek)?.includes(r.player));
      const complete=!weeks.some(w=>unverifiedCutoffWeeks.has(w)) && !tiebreakUnknown && evidence?.snapshotRevision===policy.revision && evidence?.complete===true && fresh(evidence?.verifiedAt,policy);
      snapshot.months.push(monthlyDecision(period,complete,snapshot,table));
    }
    snapshot.standings.push(aggregate('SEASON','S'+source.season,array(policy.seasonWeeks,18),snapshot.standings));
    for(const table of snapshot.standings){const prize=accountingProjection(table.key,policy);snapshot.prizes.push(prize);trust.prizes.set(table.key,prize);}
    validatePublic(snapshot,trust);
    return snapshot;
  }catch{return unavailable('INCONSISTENT');}
}
module.exports={projectCompetition};
