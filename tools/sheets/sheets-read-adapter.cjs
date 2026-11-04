'use strict';
// Apps Script V8-compatible namespace; inject all services. No global Google access.
var PerfectPickSheetsReadAdapter = (function () {
  const fail=()=>{throw Error('Invalid read snapshot');};
  const need=value=>{if(!value)fail();};
  const integer=value=>Number.isSafeInteger(value)&&value>=0;
  const stamp=value=>{need(typeof value==='string');const ms=Date.parse(value);need(Number.isFinite(ms)&&new Date(ms).toISOString()===value);return ms;};
  const fresh=(value,p)=>{try{const t=stamp(value);return t<=p.now&&p.now-t<=p.maxAgeMs;}catch{return false;}};
  const normalize=value=>{need(typeof value==='string');return value.trim().replace(/\s+/g,' ').toLowerCase().replace(/\s+vs\.?\s+/g,' vs ');};
  const fields=['Week','Game','Team 1','Team 2','Winner','Status','Team 1 Score','Team 2 Score'];
  function column(number){need(Number.isInteger(number)&&number>=1&&number<=1024);let out='';while(number){number--;out=String.fromCharCode(65+number%26)+out;number=Math.floor(number/26);}return out;}
  function range(sheet,col,first,last){return `'${sheet}'!${column(col)}${first}:${column(col)}${last}`;}
  function canonicalRange(value){
    need(typeof value==='string');const m=value.match(/^'?([A-Za-z ]+)'?!\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/);need(m);
    return [m[1],m[2],Number(m[3]),m[4]||m[2],Number(m[5]||m[3])].join('|');
  }
  function clonePolicy(p){return {now:p.now,revision:p.revision,maxAgeMs:p.maxAgeMs,aliases:p.aliases,closures:p.closures,games:p.games,teams:p.teams,decisions:p.decisions,accounting:p.accounting,periods:p.periods,seasonWeeks:p.seasonWeeks,completeWeeks:new Map()};}
  function closureAllowed(e,p){try{return e.snapshotRevision===p.revision&&e.entry.status==='CLOSED'&&e.entry.authority==='OFFICIAL'&&integer(e.entry.revision)&&fresh(e.entry.checkedAt,p)&&stamp(e.entry.validUntil)>p.now;}catch{return false;}}
  function create(dependencies,target,layout,policy){
    let project,read,evidence;
    try{
      project=dependencies.projectCompetition;read=dependencies.values.batchGet.bind(dependencies.values);evidence=dependencies.readEvidence;
      need(typeof project==='function'&&typeof read==='function'&&typeof evidence==='function'&&typeof target==='string'&&target.length>0);
      need(integer(policy.now)&&integer(policy.revision)&&integer(policy.maxAgeMs)&&policy.maxAgeMs>0);
      for(const name of ['aliases','closures','games','teams','decisions','accounting'])need(policy[name] instanceof Map);
      need(layout.results.sheet==='Results'&&layout.responses.sheet==='Responses');
      need(layout.results.firstRow===2&&layout.responses.firstRow===2);
      need(layout.results.columns.length===fields.length);
      layout.results.columns.forEach((c,i)=>{need(c.header===fields[i]);column(c.column);});
      need(new Set(layout.results.columns.map(c=>c.column)).size===fields.length);
      need(layout.responses.identity.header==='Phone Number'&&layout.responses.timestamp.header==='Timestamp');
      const responseColumns=[layout.responses.identity.column,layout.responses.timestamp.column];responseColumns.forEach(column);
      const mapped=[...policy.games.entries()];
      const required=mapped.filter(([,g])=>closureAllowed(policy.closures.get(g.week),policy));
      need(layout.responses.games.length<=mapped.length&&required.every(([label,g])=>layout.responses.games.some(c=>c.week===g.week&&normalize(c.week+'|'+c.game)===normalize(label))));
      for(const c of layout.responses.games){column(c.column);responseColumns.push(c.column);const m=c.header.trim().match(/^W(\d+)\s*\|\s*(.+)$/i);need(m&&Number(m[1])===c.week&&normalize(m[2])===normalize(c.game));need(mapped.some(([label,g])=>g.week===c.week&&normalize(label)===normalize(c.week+'|'+c.game)));}
      need(new Set(layout.responses.games.map(c=>normalize(c.week+'|'+c.game))).size===layout.responses.games.length);
      for(const c of layout.responses.predictions){column(c.column);responseColumns.push(c.column);need(new RegExp('^WK\\s*'+c.week+'\\s+Tie\\s*Breaker\\b','i').test(c.header.trim()));const matches=[...policy.games].filter(([label,g])=>g.week===c.week&&normalize(label)===normalize(c.week+'|'+c.game));need(matches.length===1);const game=matches[0][1];need(game&&policy.periods.some(p=>p.endWeek===c.week&&p.designatedGame===game.game));}
      need(new Set(responseColumns).size===responseColumns.length);
      need(new Set(layout.responses.predictions.map(c=>c.week)).size===layout.responses.predictions.length);
      const expected=policy.periods.filter(p=>p.designatedGame!==null&&closureAllowed(policy.closures.get(p.endWeek),policy)).map(p=>p.endWeek).sort((a,b)=>a-b);
      need(JSON.stringify([...new Set(expected)])===JSON.stringify(layout.responses.predictions.filter(p=>closureAllowed(policy.closures.get(p.week),policy)).map(p=>p.week).sort((a,b)=>a-b)));
      need(typeof dependencies.identityKey==='function'&&typeof dependencies.submissionTime==='function'&&typeof dependencies.now==='function');
    }catch{throw Error('Invalid Sheets reader configuration');}
    function readPublicSnapshot(){
      let safePolicy;
      try{
        safePolicy=clonePolicy(policy);
        const started=dependencies.now();need(integer(started)&&started>=policy.now);safePolicy.now=started;
        const before=evidence(target);
        need(before&&before.revision===policy.revision&&fresh(before.observedAt,safePolicy)&&stamp(before.validUntil)>safePolicy.now&&before.quiescent===true);
        need(integer(before.resultRows)&&before.resultRows<=400&&integer(before.responseRows)&&before.responseRows<=1000);
        const weeks=[...new Set([...policy.games.values()].map(g=>g.week))].sort((a,b)=>a-b);
        const closed=weeks.filter(w=>closureAllowed(policy.closures.get(w),safePolicy));
        const plans=[];
        function add(sheet,descriptor,count,guard){
          const start=2,last=start+count-1+Number(guard);
          plans.push({kind:'header',range:range(sheet,descriptor.column,1,1),descriptor});
          if(count||guard)plans.push({kind:'body',range:range(sheet,descriptor.column,start,last),descriptor,count,guard});
        }
        layout.results.columns.forEach(c=>add('Results',c,before.resultRows,c.header==='Week'));
        const selected=closed.length?[layout.responses.timestamp,layout.responses.identity,
          ...layout.responses.games.filter(c=>closed.includes(c.week)),...layout.responses.predictions.filter(c=>closed.includes(c.week))]:[];
        selected.forEach(c=>add('Responses',c,before.responseRows,c.header==='Timestamp'));
        function pass(){
          const all=new Map();
          for(const group of [plans.filter(p=>p.kind==='header'),plans.filter(p=>p.kind==='body')]){
          if(!group.length)continue;
          const answer=read(target,{ranges:group.map(p=>p.range),majorDimension:'ROWS',valueRenderOption:'UNFORMATTED_VALUE',dateTimeRenderOption:'SERIAL_NUMBER'});
          need(Array.isArray(answer.valueRanges)&&answer.valueRanges.length===group.length);
          answer.valueRanges.forEach((v,i)=>{
            const p=group[i];need(canonicalRange(v.range)===canonicalRange(p.range)&&v.majorDimension==='ROWS');
            const values=v.values===undefined?[]:v.values;need(Array.isArray(values));
            const limit=p.kind==='header'?1:p.count+Number(p.guard);need(values.length<=limit);
            const cells=values.map(row=>{need(Array.isArray(row)&&row.length<=1);const value=row.length?row[0]:'';need(value===null||['string','number','boolean'].includes(typeof value));if(typeof value==='number')need(Number.isFinite(value));return value??'';});
            if(p.kind==='header')need(cells.length===1&&cells[0]===p.descriptor.header);
            if(p.guard)need(cells[p.count]===undefined||cells[p.count]==='');
            const size=p.kind==='header'?1:p.count;all.set(p,Array.from({length:size},(_,n)=>cells[n]??''));
          });
          }
          return plans.map(p=>all.get(p));
        }
        const first=pass(),second=pass(),after=evidence(target);
        // Equality is a race detector, never a substitute for authoritative revision/completeness.
        need(JSON.stringify(first)===JSON.stringify(second));
        for(const key of ['revision','observedAt','validUntil','resultRows','responseRows','quiescent'])need(before[key]===after[key]);
        const ended=dependencies.now();need(integer(ended)&&ended>=started);safePolicy.now=ended;
        need(fresh(after.observedAt,safePolicy)&&stamp(after.validUntil)>safePolicy.now);
        function body(sheet,descriptor){const i=plans.findIndex(p=>p.kind==='body'&&p.descriptor===descriptor&&p.range.startsWith("'"+sheet+"'!"));return i<0?[]:first[i];}
        const resultColumns=layout.results.columns.map(c=>body('Results',c));
        const games=Array.from({length:before.resultRows},(_,i)=>{
          const row=resultColumns.map(c=>c[i]);need(row[0]!==''&&row[1]!=='');
          const week=typeof row[0]==='string'&&/^\d+$/.test(row[0])?Number(row[0]):row[0];need(Number.isInteger(week)&&week>=1&&week<=18);
          return {week,game:row[1],team1:row[2],team2:row[3],winner:row[4],status:row[5],team1Score:row[6],team2Score:row[7],verifiedAt:before.observedAt};
        });
        const source={revision:before.revision,observedAt:before.observedAt,season:layout.season,games,weeks:weeks.map(week=>({week}))};
        if(closed.length){
          const identities=body('Responses',layout.responses.identity),times=body('Responses',layout.responses.timestamp);
          for(let i=0;i<before.responseRows;i++)need(identities[i]!==''&&times[i]!=='');
          for(const week of closed){
            const columns=layout.responses.games.filter(c=>c.week===week),prediction=layout.responses.predictions.find(c=>c.week===week);
            source.weeks.find(w=>w.week===week).submissions=Array.from({length:before.responseRows},(_,i)=>{
              const selections=columns.map(c=>({game:c.game,pick:body('Responses',c)[i]}));
              const row={identity:dependencies.identityKey(identities[i]),timestamp:dependencies.submissionTime(times[i]),selections};
              need(typeof row.identity==='string'&&row.identity.length>0);stamp(row.timestamp);
              if(prediction)row.prediction={game:prediction.game,value:body('Responses',prediction)[i]};return row;
            });
            safePolicy.completeWeeks.set(week,true);
          }
        }
        return project(source,safePolicy);
      }catch{return project(null,safePolicy||policy);}
    }
    return Object.freeze({readPublicSnapshot});
  }
  return Object.freeze({create});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PerfectPickSheetsReadAdapter;
