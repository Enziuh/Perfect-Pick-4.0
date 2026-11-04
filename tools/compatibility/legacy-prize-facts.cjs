'use strict';
// Pure import of independently owner-approved 3.0 accounting facts. No recalculation or ledger inference.
function cents(value){
 if(value===null||value===undefined||value==='')return null;
 if(!['string','number'].includes(typeof value))throw Error('Invalid accounting facts');
 const text=String(value).trim();if(!/^\d+(?:\.\d{1,2})?$/.test(text))throw Error('Invalid accounting facts');
 const [whole,fraction='']=text.split('.'),n=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid accounting facts');return n;
}
function mapApprovedPrizeFacts(facts,context){
 const fail=()=>{throw Error('Invalid accounting facts');};
 if(!Number.isSafeInteger(context?.revision)||context.revision<0||!Number.isFinite(Date.parse(context.verifiedAt))||new Date(context.verifiedAt).toISOString()!==context.verifiedAt||!(context.pools instanceof Map)||!(context.rollovers instanceof Map))fail();
 const out=new Map();
 const make=(key,raw)=>{
  if(out.has(key))fail();const approved=context.pools.get(key),amount=cents(raw);
  if(approved!==undefined&&!['CONFIRMED','PROJECTED'].includes(approved))fail();
  const value={key,currency:'USD',poolCents:approved&&amount!==null?amount:null,poolState:approved&&amount!==null?approved:'UNAVAILABLE',allocationState:'UNAVAILABLE',paymentState:'UNKNOWN'};
  out.set(key,{snapshotRevision:context.revision,verifiedAt:context.verifiedAt,value});return value;
 };
 if(!Array.isArray(facts.weekly)||!Array.isArray(facts.periods)||facts.weekly.length>18||facts.periods.length>12)fail();
 for(const row of facts.weekly){
  if(!Number.isInteger(row.week)||row.week<1||row.week>18)fail();const p=make('W'+row.week,row.weeklyPot),to=context.rollovers.get(row.week);
  if(to!==undefined){
   const period=facts.periods.find(m=>m.periodKey===to&&row.week>=m.startWeek&&row.week<=m.endWeek);
   const rollover=cents(row.rolloverToMonthly);
   if(!period||period.ruleMode!=='NEW'||p.poolState!=='CONFIRMED'||row.finalized!==true||rollover===null||rollover!==p.poolCents)fail();
   // Explicit rollover approval attests a finalized no-perfect outcome; validator independently checks it.
   p.allocationState='CONFIRMED';p.allocations=[];p.rollover={to,cents:rollover};
  }
 }
 for(const row of facts.periods){
  if(!/^M[1-9][0-9]?$/.test(row.periodKey))fail();const p=make(row.periodKey,row.monthlyWinnerPool);
  if(row.ruleMode==='NEW'&&p.poolState!=='UNAVAILABLE'){
   const rollover=cents(row.monthlyPot),monthly=cents(row.monthlyWinnerPool),season=cents(row.seasonContribution),monthlyBps=cents(row.monthlyWinnerPct),seasonBps=cents(row.seasonPct);
   if([rollover,monthly,season,monthlyBps,seasonBps].every(n=>n!==null)){
    if(monthlyBps+seasonBps>10000||monthly+season>rollover)fail();
    p.funding={rolloverCents:rollover,monthlyPrizeCents:monthly,seasonContributionCents:season,monthlyShareBasisPoints:monthlyBps,seasonShareBasisPoints:seasonBps};
   }
  }
  // monthlyPayoutEach, projectedMonthlyPayoutEach and payment/notes fields are deliberately ignored.
 }
 if(!Number.isInteger(facts.season)||facts.season<2000||facts.season>2200)fail();
 const season=make('S'+facts.season,facts.confirmedSeasonPot);
 if(context.pools.has('S'+facts.season)){const projected=cents(facts.projectedSeasonPot);if(projected!==null)season.projectedPoolCents=projected;}
 return out;
}
module.exports={cents,mapApprovedPrizeFacts};
