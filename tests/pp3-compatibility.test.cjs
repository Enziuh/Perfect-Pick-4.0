'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalizePhone}=require('../tools/compatibility/pp3-identity.cjs');
const {workbookLayout,minimalStructureConfig}=require('../tools/sheets/workbook-profile.cjs');
const {aliases}=require('../tools/verification/owner-evidence.cjs');
const {projectCompetition}=require('../tools/projector/project-competition.cjs');
const {create}=require('../tools/sheets/sheets-read-adapter.cjs');
const {createOwnerDiagnostic}=require('../tools/verification/owner-connection.cjs');
const {mapApprovedPrizeFacts,cents}=require('../tools/compatibility/legacy-prize-facts.cjs');
const {fabricated,validationTrust}=require('./support/projector-examples.cjs');
const {sheetsExample}=require('./support/sheets-example.cjs');
const {validatePublic}=require('../tools/contracts/live-contract.cjs');
const digits='0'.repeat(9)+'1',other='0'.repeat(9)+'2';
const formatted=value=>'+1 ('+value.slice(0,3)+') '+value.slice(3,6)+'-'+value.slice(6);
test('private phone normalization matches 3.0 digit stripping and optional leading US country digit',()=>{
 for(const value of [digits,formatted(digits),'1'+digits,' '+digits+' '])assert.equal(normalizePhone(value),digits);
 assert.equal(normalizePhone('REDACTED'),'');assert.equal(normalizePhone(''),'');assert.equal(normalizePhone('12'), '12');assert.throws(()=>normalizePhone({}));
});
test('approval is explicit; normalized collisions reject; first name plus initial period is supported',()=>{
 const record={privateKey:formatted(digits),player:'p_approved01',alias:'Invented A.',approved:true,revision:1};
 assert.equal(aliases([record],1,normalizePhone).get(digits).alias,'Invented A.');
 for(const r of [{...record,approved:false},{...record,alias:'Unapproved..'},{...record,privateKey:'REDACTED'}])assert.throws(()=>aliases([r],1,normalizePhone));
 assert.throws(()=>aliases([record,{...record,privateKey:digits,player:'p_approved02',alias:'Invented B.'}],1,normalizePhone));
});
test('verified Results A-H profile reads correct teams/status/scores and Responses A/C; Name/Players never read',()=>{
 const e=sheetsExample();
 e.matrix.Results=[['Week','Game','Team 1','Team 2','Winner','Status','Team 1 Score','Team 2 Score','Notes'],...e.source.games.map(g=>[g.week,g.game,g.team1,g.team2,g.winner,g.status,g.team1Score,g.team2Score,'FABRICATED_PRIVATE'])];
 const layout=workbookLayout(2026,e.layout.responses.games,e.layout.responses.predictions);
 const result=create(e.dependencies,e.target,layout,e.policy).readPublicSnapshot();assert.equal(result.state,'READY');assert.equal(result.games[0].home,'CHI');assert.equal(result.games[0].homeScore,20);assert.equal(result.games[0].status,'FINAL');
 assert(e.calls.every(c=>c.options.ranges.every(r=>!r.startsWith("'Players'")&&!r.startsWith("'Responses'!B")&&!r.startsWith("'Results'!I"))));assert.deepEqual(e.denied.attempts,[]);
});
test('native normalized phones merge resubmissions across formatting; latest pick replaces rather than combines',()=>{
 const e=sheetsExample();const layout=workbookLayout(2026,e.layout.responses.games,e.layout.responses.predictions);e.matrix.Results=[layout.results.columns.map(c=>c.header),...e.source.games.map(g=>[g.week,g.game,g.team1,g.team2,g.winner,g.status,g.team1Score,g.team2Score])];
 const identities=[...e.policy.aliases.keys()];for(const row of e.matrix.Responses.slice(1)){row[0]=new Date(e.policy.now).toISOString();row[2]=row[2]===identities[0]?formatted(digits):other;}
 const duplicate=e.matrix.Responses[1].slice();duplicate[2]=digits;duplicate[3]='Lions';e.matrix.Responses.push(duplicate);e.proof.responseRows++;
 const config={activation:{enabled:true,soleOwnerReviewed:true,noPublicExecutionReviewed:true,readOnlyGrantsReviewed:true,notBefore:new Date(e.policy.now-1).toISOString(),expiresAt:new Date(e.policy.now+60000).toISOString()},mode:'VERIFY',identityFormat:'PP3_PHONE',capture:{...e.proof},captureAuthorityReviewed:true,competition:{target:e.target,timeZone:'America/Los_Angeles',revision:1,maxAgeMs:300000,layout,policy:Object.fromEntries(['games','teams','periods','seasonWeeks','decisions','accounting'].map(k=>[k,e.policy[k]])),aliases:[...e.policy.aliases].map(([key,a])=>({privateKey:key===identities[0]?digits:other,...a,revision:1})),closures:[...e.policy.closures].map(([week,c])=>({week,snapshotRevision:1,closureRevision:c.entry.revision,status:'CLOSED',mechanism:'OWNER_VERIFIED_CLOSURE',verifiedClosed:true,checkedAt:c.entry.checkedAt,validUntil:c.entry.validUntil,deadline:null}))}};
 let projected;
 const sheets={Spreadsheets:{get(){return {properties:{timeZone:'America/Los_Angeles'},sheets:['Results','Responses'].map(title=>({properties:{title,gridProperties:{rowCount:1100,columnCount:20}}}))};},Values:e.dependencies.values}};
 const r=createOwnerDiagnostic(()=>config,()=>sheets,()=>e.state.clock,s=>{projected=s;})();assert.equal(r.state,'VALIDATED_READ');const rows=projected.standings.find(s=>s.key==='W1').rows;assert.equal(rows.length,2);assert.equal(rows.find(r=>r.player===e.policy.aliases.get(identities[0]).player).points,0);assert(!JSON.stringify(projected).includes(digits));assert(!JSON.stringify(r).includes(digits));assert.deepEqual(e.denied.attempts,[]);
});
test('latest-per-week validation ignores superseded invalid picks but never falls back from an invalid latest entry',()=>{
 const {source,policy}=fabricated();const row=source.weeks[0].submissions[0];source.weeks[0].submissions.unshift({...structuredClone(row),timestamp:'2026-10-01T11:59:00.000Z',selections:[{game:row.selections[0].game,pick:'Invalid superseded value'}]});
 let p=projectCompetition(source,policy);assert.equal(p.standings[0].state,'AVAILABLE');
 source.weeks[0].submissions.push({...structuredClone(row),selections:[{game:row.selections[0].game,pick:'Invalid latest value'}]});p=projectCompetition(source,policy);assert.equal(p.standings[0].state,'WITHHELD');
});
test('accuracy counts submitted FINAL picks; missing picks do not become completed games or perfect weeks',()=>{
 const {source,policy}=fabricated();const g={...source.games[0],game:'Bears vs Packers',team2:'Packers'};source.games.push(g);policy.teams.set('Packers','GB');policy.games.set('1|Bears vs Packers',{week:1,game:'g_missing01',home:'CHI',away:'GB'});
 const p=projectCompetition(source,policy);assert.equal(p.state,'READY');const first=p.standings.find(t=>t.key==='W1').rows[0];assert.equal(first.points,1);assert.equal(first.completedGames,1);assert.equal(first.totalPicks,1);assert.equal(first.accuracyBasisPoints,10000);assert.equal(p.games.filter(g=>g.week===1&&g.status==='FINAL').length,2);assert.notEqual(first.totalPicks,2);validatePublic(p,validationTrust(policy,p));
});
test('points-first monthly decision and equal distances preserve shared ranks; deadline never authorizes disclosure',()=>{
 for(const scenario of ['decisive','unresolved','no-eligible','unknown']){const {source,policy}=fabricated(scenario);const p=projectCompetition(source,policy);assert.equal(p.state,'READY');if(scenario==='decisive')assert.equal(p.months[0].state,'MONTHLY CHAMPION');if(scenario==='unresolved'){assert.equal(p.months[0].winner,null);assert.equal(p.months[0].state,'UNRESOLVED TIE');assert(p.standings.find(t=>t.key==='M1').rows.every(r=>r.rank===1));}if(scenario==='unknown'){assert(!p.weeks[1].picks);assert(!p.weeks[1].votes);}}
});
test('redacted example identities are not invented or treated as production defects',()=>{
 const e=sheetsExample();e.matrix.Responses[1][2]='REDACTED';e.dependencies.identityKey=normalizePhone;const p=create(e.dependencies,e.target,e.layout,e.policy).readPublicSnapshot();assert.equal(p.state,'UNAVAILABLE');assert(!JSON.stringify(p).includes('REDACTED'));assert(!JSON.stringify(p).includes('production defect'));
});
test('minimal STRUCTURE config checks ten known headers with zero response body reads or alias/closure guesses',()=>{
 const c=minimalStructureConfig();assert.equal(c.activation.enabled,false);assert.equal(c.competition.target,null);assert.equal(c.competition.timeZone,null);assert.equal(c.identityFormat,'PP3_PHONE');assert.deepEqual(c.competition.aliases,[]);
 const e=sheetsExample();const config=minimalStructureConfig({target:e.target,timeZone:'America/Los_Angeles',activation:{enabled:true,soleOwnerReviewed:true,noPublicExecutionReviewed:true,readOnlyGrantsReviewed:true,notBefore:new Date(e.policy.now-1).toISOString(),expiresAt:new Date(e.policy.now+10000).toISOString()}});e.matrix.Results=[config.competition.layout.results.columns.map(c=>c.header)];
 const sheets={Spreadsheets:{get(){return {properties:{timeZone:'America/Los_Angeles'},sheets:['Results','Responses'].map(title=>({properties:{title,gridProperties:{rowCount:100,columnCount:8}}}))};},Values:e.dependencies.values}};
 const r=createOwnerDiagnostic(()=>config,()=>sheets,()=>e.state.clock)();assert.equal(r.state,'STRUCTURE_CHECKED');assert.equal(r.structure.expectedColumns,10);assert.equal(r.closure,'UNVERIFIED');assert.equal(r.aliases,'UNVERIFIED');assert.equal(e.calls.length,1);assert(e.calls[0].options.ranges.every(r=>/1:[A-Z]+1$/.test(r)));assert.deepEqual(e.denied.attempts,[]);
});
test('approved pool/rollover mapping preserves cents and ignores monthly payout/payment placeholders and notes',()=>{
 const facts={season:2026,weekly:[{week:1,weeklyPot:'20.29',rolloverToMonthly:'20.29',finalized:true,notes:'FABRICATED_PRIVATE'}],periods:[{periodKey:'M1',startWeek:1,endWeek:4,ruleMode:'NEW',monthlyPot:'20.29',monthlyWinnerPool:'10.14',seasonContribution:'10.14',monthlyWinnerPct:50,seasonPct:50,monthlyPayoutEach:0,paymentState:'PAID'}],confirmedSeasonPot:0,projectedSeasonPot:'10.14'};
 const context={revision:1,verifiedAt:'2026-10-01T12:00:00.000Z',pools:new Map([['W1','CONFIRMED'],['M1','PROJECTED'],['S2026','CONFIRMED']]),rollovers:new Map([[1,'M1']])};const map=mapApprovedPrizeFacts(facts,context);assert.equal(map.get('W1').value.poolCents,2029);assert.equal(map.get('W1').value.rollover.cents,2029);assert.equal(map.get('M1').value.poolCents,1014);assert.equal(map.get('M1').value.paymentState,'UNKNOWN');assert.equal(map.get('M1').value.allocationState,'UNAVAILABLE');assert.equal(map.get('S2026').value.poolCents,0);assert.equal(map.get('S2026').value.projectedPoolCents,1014);assert(!JSON.stringify([...map]).includes('FABRICATED_PRIVATE'));assert.equal(cents('0.29'),29);assert.throws(()=>cents('0.001'));context.pools.clear();context.rollovers.clear();assert.equal(mapApprovedPrizeFacts(facts,context).get('W1').value.poolCents,null);
});
test('mapped approved rollover/funding facts pass the existing projector and strict accounting validator',()=>{
 const {source,policy}=fabricated();
 for(const [week,team2,away,game] of [[1,'Packers','GB','g_added001'],[2,'Broncos','DEN','g_added002']]){
  const original=source.games.find(g=>g.week===week),label=original.team1+' vs '+team2;
  source.games.push({...original,game:label,team2});policy.games.set(week+'|'+label,{week,game,home:week===1?'CHI':'KC',away});policy.teams.set(team2,away);
 }
 const facts={season:2026,weekly:[1,2].map(week=>({week,weeklyPot:20,rolloverToMonthly:20,finalized:true})),periods:[{periodKey:'M1',startWeek:1,endWeek:2,ruleMode:'NEW',monthlyPot:40,monthlyWinnerPool:20,seasonContribution:20,monthlyWinnerPct:50,seasonPct:50}],confirmedSeasonPot:20,projectedSeasonPot:20};
 policy.accounting=mapApprovedPrizeFacts(facts,{revision:1,verifiedAt:new Date(policy.now).toISOString(),pools:new Map([['W1','CONFIRMED'],['W2','CONFIRMED'],['M1','CONFIRMED'],['S2026','CONFIRMED']]),rollovers:new Map([[1,'M1'],[2,'M1']])});
 const p=projectCompetition(source,policy);assert.equal(p.state,'READY');assert.equal(p.prizes.find(p=>p.key==='M1').poolCents,2000);assert.equal(p.prizes.find(p=>p.key==='W1').rollover.cents,2000);assert.equal(p.months[0].state,'MONTHLY CHAMPION');assert.equal(p.prizes.find(p=>p.key==='M1').allocationState,'UNAVAILABLE');validatePublic(p,validationTrust(policy,p));
});
test('approved initial aliases and vs punctuation survive projection without submitted-name fallbacks',()=>{
 const {source,policy}=fabricated();const entries=[...policy.aliases];entries.forEach(([key,a],i)=>policy.aliases.set(key,{...a,alias:i?'Invented B.':'Invented A.'}));source.games[0].game=source.games[0].game.replace(' vs ',' vs. ');source.weeks[0].submissions[0].selections[0].game=source.games[0].game;
 const p=projectCompetition(source,policy);assert.equal(p.state,'READY');assert(p.standings[0].rows.some(r=>r.alias==='Invented A.'));assert(!JSON.stringify(p).includes('FABRICATED_PRIVATE'));validatePublic(p,validationTrust(policy,p));
 policy.aliases.delete(entries[0][0]);const withheld=projectCompetition(source,policy);assert.equal(withheld.standings[0].state,'WITHHELD');assert(!withheld.weeks[0].picks);
});
test('3.0 last-word team matching accepts full team names only through approved canonical mappings',()=>{
 const {source,policy}=fabricated();source.games[0].team1='Chicago Bears';source.games[0].winner='CHICAGO BEARS';source.weeks[0].submissions[0].selections[0].pick='Chicago Bears';policy.teams.set('Chicago Bears','CHI');const p=projectCompetition(source,policy);assert.equal(p.state,'READY');assert.equal(p.standings[0].rows[0].points,1);assert.equal(p.weeks[0].picks[0].selections[0].team,'CHI');
 policy.teams.set('Conflicting Bears','DET');assert.equal(projectCompetition(source,policy).state,'UNAVAILABLE');
});
test('period and season aggregates use the union of participating identities without creating missing entries',()=>{
 const {source,policy}=fabricated();source.weeks[0].submissions[1].selections=[];
 const p=projectCompetition(source,policy);assert.equal(p.state,'READY');assert.equal(p.standings.find(t=>t.key==='W1').rows.length,1);assert.equal(p.standings.find(t=>t.key==='W2').rows.length,2);assert.equal(p.standings.find(t=>t.key==='M1').rows.length,2);assert.equal(p.standings.find(t=>t.key==='S2026').rows.length,2);validatePublic(p,validationTrust(policy,p));
});
test('accounting normalization rejects coercible objects/arrays and never reads private custom stringifiers',()=>{
 let touched=false;for(const value of [[10],true,{toString(){touched=true;return '10';}},NaN,Infinity,-1])assert.throws(()=>cents(value));assert.equal(touched,false);
});
test('generated package owner-private factory can execute the minimal ten-header STRUCTURE profile offline',()=>{
 const vm=require('node:vm'),pkg=require('../tools/verification/package.cjs');const e=sheetsExample(),settings={target:e.target,timeZone:'America/Los_Angeles',activation:{enabled:true,soleOwnerReviewed:true,noPublicExecutionReviewed:true,readOnlyGrantsReviewed:true,notBefore:new Date(e.policy.now-1).toISOString(),expiresAt:new Date(e.policy.now+10000).toISOString()}};
 e.matrix.Results=[workbookLayout(2026).results.columns.map(c=>c.header)];
 const sheets={Spreadsheets:{get(){return {properties:{timeZone:'America/Los_Angeles'},sheets:['Results','Responses'].map(title=>({properties:{title,gridProperties:{rowCount:100,columnCount:8}}}))};},Values:e.dependencies.values}};
 const script=pkg.render()['Verification.gs'].replace('// BEGIN OWNER-PRIVATE CONFIGURATION (remote isolated editor only)\n return null;','// BEGIN OWNER-PRIVATE CONFIGURATION (remote isolated editor only)\n return minimalStructureConfig(fabricatedSettings);');
 assert.notEqual(script,pkg.render()['Verification.gs']);const Clock=class extends Date {static now(){return e.policy.now;}};
 const context=vm.createContext({...e.denied.globals,Map,Set,Date:Clock,Error,Sheets:sheets,fabricatedSettings:settings});vm.runInContext(script,context);const result=context.verifyPerfectPick4Package_();assert.equal(result.state,'STRUCTURE_CHECKED');assert.equal(result.structure.matchedColumns,10);assert.equal(e.calls.length,1);assert.deepEqual(e.denied.attempts,[]);
});
