'use strict';
// A fabricated legacy-shaped source. No production inputs or private mappings.
const {example,AT,COMET,MAPLE}=require('./live-contract-examples.cjs');
function fabricated(scenario='decisive') {
  const {snapshot,trust}=example(scenario);
  const names=new Map([['CHI','Bears'],['DET','Lions'],['KC','Chiefs'],['BUF','Bills']]);
  const identities=new Map([[COMET,'fabricated-entry-a'],[MAPLE,'fabricated-entry-b']]);
  const label=g=>names.get(g.home)+' vs '+names.get(g.away);
  const source={revision:1,observedAt:AT,season:2026,
    games:snapshot.games.map(g=>({week:g.week,game:label(g),team1:names.get(g.home),team2:names.get(g.away),status:g.status==='FINAL'?'Final':'Pending',team1Score:g.homeScore===null?'':String(g.homeScore),team2Score:g.awayScore===null?'':String(g.awayScore),winner:g.winner==='HOME'?names.get(g.home):g.winner==='AWAY'?names.get(g.away):g.winner==='TIE'?'Tie':'',verifiedAt:g.verifiedAt,notes:'FABRICATED_PRIVATE_MARKER'})),
    weeks:snapshot.weeks.map(w=>({week:w.week,submissions:(w.picks||[]).map(p=>({identity:identities.get(p.player),timestamp:AT,name:'FABRICATED_PRIVATE_MARKER',notes:'FABRICATED_PRIVATE_MARKER',selections:p.selections.map(s=>({game:label(snapshot.games.find(g=>g.game===s.game)),pick:names.get(s.team),correct:true})),prediction:p.prediction?{game:label(snapshot.games.find(g=>g.game===p.prediction.game)),value:p.prediction.total===null?'invalid fabricated prediction':String(p.prediction.total)}:null}))})),
    prizes:{monthlyPayoutEach:0,notes:'FABRICATED_PRIVATE_MARKER'}};
  const policy={revision:1,now:Date.parse(AT),maxAgeMs:300000,
    aliases:new Map([...identities].map(([publicKey,identity])=>[identity,{player:publicKey,alias:trust.aliases.get(publicKey),approved:trust.aliases.has(publicKey)}])),
    teams:new Map([...names].map(([key,name])=>[name,key])),
    games:new Map(snapshot.games.map(g=>[`${g.week}|${label(g)}`,{week:g.week,game:g.game,home:g.home,away:g.away}])),
    completeWeeks:new Map(snapshot.weeks.map(w=>[w.week,true])),
    closures:new Map([...trust.closures].map(([week,entry])=>[week,{snapshotRevision:1,entry}])),
    periods:snapshot.months.map(m=>({key:m.key,startWeek:m.startWeek,endWeek:m.endWeek,designatedGame:m.designatedGame})),
    decisions:new Map(snapshot.months.map(m=>[m.key,{snapshotRevision:1,verifiedAt:AT,complete:m.competitionComplete}])),
    seasonWeeks:[1,2],accounting:new Map([...trust.prizes].map(([key,value])=>[key,{snapshotRevision:1,verifiedAt:AT,value}]))};
  // Missing approval must be demonstrated against an actual fabricated entrant.
  if(scenario==='missing-alias'){
    const original=fabricated('decisive');original.policy.aliases.delete('fabricated-entry-a');return original;
  }
  return {source,policy};
}
function validationTrust(policy,snapshot) {
  return {now:policy.now,maxAgeMs:policy.maxAgeMs,
    aliases:new Map([...policy.aliases.values()].filter(a=>a.approved).map(a=>[a.player,a.alias])),
    closures:new Map([...policy.closures].map(([week,e])=>[week,e.entry])),
    aliasCompleteness:new Map(snapshot.weeks?.map(w=>[w.week,Object.hasOwn(w,'picks')])||[]),
    prizes:new Map([...policy.accounting].map(([key,e])=>[key,e.value]))};
}
module.exports={fabricated,validationTrust};
