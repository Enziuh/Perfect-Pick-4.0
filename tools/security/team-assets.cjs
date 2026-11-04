'use strict';
const TEAMS=Object.freeze('ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN NE NO NYG NYJ PHI PIT SEA SF TB TEN WAS'.split(' '));
const TEAM_FILES=Object.freeze(TEAMS.map(a=>'assets/teams/'+a.toLowerCase()+'.svg'));
function validateLogo(source){
 const need=ok=>{if(!ok)throw Error('Unsafe team SVG');};
 need(typeof source==='string'&&source.length>100&&source.length<70000);
 need(!/<!|<\?|&|\bon\w+\s*=|href|script|foreignObject|image|animation|@import/i.test(source));
 need((source.match(/xmlns="http:\/\/www.w3.org\/2000\/svg"/g)||[]).length===1);
 const clean=source.replace('xmlns="http://www.w3.org/2000/svg"','');need(!/https?:|data:|javascript:|\/\//i.test(clean));
 const tags=new Set(['svg','path','g','defs','clipPath','rect','polygon']);
 const attrs=new Set(['viewBox','d','fill','fill-rule','clip-rule','clip-path','stroke','stroke-width','stroke-miterlimit','stroke-linejoin','stroke-linecap','opacity','fill-opacity','stroke-opacity','transform','id','x','y','width','height','points']);
 let stripped=clean;const stack=[];const ids=new Set(),refs=[];
 for(const m of clean.matchAll(/<\/?([\w-]+)\b([^>]*)>/g)){
  need(tags.has(m[1]));stripped=stripped.replace(m[0],'');
  if(m[0].startsWith('</')){need(stack.pop()===m[1]);continue;}
  let text=m[2].replace(/\/\s*$/,'');
  for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)){need(attrs.has(a[1]));text=text.replace(a[0],'');if(a[1]==='id'){need(!ids.has(a[2]));ids.add(a[2]);}for(const u of a[2].matchAll(/url\(([^)]+)\)/g)){need(/^#[\w-]+$/.test(u[1]));refs.push(u[1].slice(1));}}
  need(!text.trim());if(!/\/\s*>$/.test(m[0]))stack.push(m[1]);
 }
 need(!stack.length&&!stripped.trim()&&refs.every(id=>ids.has(id))&&/^<svg\b[^>]*viewBox="[\d. -]+"/.test(source));return true;
}
module.exports={TEAMS,TEAM_FILES,validateLogo};
