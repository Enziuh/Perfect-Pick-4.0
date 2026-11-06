'use strict';
var PerfectPickTimestamp = (function(){
  const fail=()=>{throw Error('Unverifiable submission time');};
  const day=86400000,epoch=Date.UTC(1899,11,30);
  function createParser(timeZone){
    let formatter;
    try{if(typeof timeZone!=='string'||!timeZone)fail();formatter=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});formatter.format(new Date(0));}catch{fail();}
    const parts=ms=>Object.fromEntries(formatter.formatToParts(new Date(ms)).filter(p=>['year','month','day','hour','minute','second'].includes(p.type)).map(p=>[p.type,Number(p.value)]));
    function instant(ms){if(!Number.isFinite(ms))fail();const date=new Date(ms);if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<1900||date.getUTCFullYear()>2200)fail();return date.toISOString();}
    function localToIso(wall){
      const nominal=Date.UTC(wall.year,wall.month-1,wall.day,wall.hour,wall.minute,wall.second,wall.millisecond);
      const d=new Date(nominal);
      if(d.getUTCFullYear()!==wall.year||d.getUTCMonth()+1!==wall.month||d.getUTCDate()!==wall.day||d.getUTCHours()!==wall.hour||d.getUTCMinutes()!==wall.minute||d.getUTCSeconds()!==wall.second)fail();
      instant(nominal);
      const offsets=new Set();
      for(let delta=-36;delta<=36;delta+=6){const probe=Math.floor((nominal+delta*3600000)/1000)*1000,p=parts(probe);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-probe);}
      const matches=[];
      for(const offset of offsets){const candidate=nominal-offset,p=parts(candidate);if(['year','month','day','hour','minute','second'].every(k=>p[k]===wall[k]))matches.push(candidate);}
      if(matches.length!==1)fail(); // Reject both nonexistent spring times and ambiguous fall times.
      return instant(matches[0]);
    }
    function parse(value){
      try{
        if(Object.prototype.toString.call(value)==='[object Date]')return instant(Date.prototype.getTime.call(value));
        if(typeof value==='number'){
          if(!Number.isFinite(value)||value<0)fail();
          const wall=new Date(epoch+Math.round(value*day));instant(wall.getTime());
          return localToIso({year:wall.getUTCFullYear(),month:wall.getUTCMonth()+1,day:wall.getUTCDate(),hour:wall.getUTCHours(),minute:wall.getUTCMinutes(),second:wall.getUTCSeconds(),millisecond:wall.getUTCMilliseconds()});
        }
        if(typeof value!=='string')fail();
        if(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)){
          const result=instant(Date.parse(value));if(result!==value)fail();return result;
        }
        // Explicit English Sheets display format; never browser-local Date parsing.
        const display=value.replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ').trim();
        const human=display.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4}) at (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/i);
        if(human){
          const months=['january','february','march','april','may','june','july','august','september','october','november','december'],days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
          const h=Number(human[5]);if(h<1||h>12)fail();
          const wall={year:Number(human[4]),month:months.indexOf(human[2].toLowerCase())+1,day:Number(human[3]),hour:h%12+(human[8].toUpperCase()==='PM'?12:0),minute:Number(human[6]),second:Number(human[7]),millisecond:0};
          if(new Date(Date.UTC(wall.year,wall.month-1,wall.day)).getUTCDay()!==days.indexOf(human[1].toLowerCase()))fail();
          return localToIso(wall);
        }
        const m=value.match(/^(\d{4})-(\d\d)-(\d\d)[ T](\d\d):(\d\d):(\d\d)(?:\.(\d{3}))?$/);if(!m)fail();
        return localToIso({year:Number(m[1]),month:Number(m[2]),day:Number(m[3]),hour:Number(m[4]),minute:Number(m[5]),second:Number(m[6]),millisecond:Number(m[7]||0)});
      }catch{fail();}
    }
    return Object.freeze({parse,timeZone});
  }
  return Object.freeze({createParser});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PerfectPickTimestamp;
