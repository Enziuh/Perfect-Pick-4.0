'use strict';
// Data-only validation. Short links/edit links require owner verification elsewhere.
function approvedPlayerDestination(config){
 if(!config||Object.keys(config).sort().join(',')!=='approvedForPlayers,url,verified'||config.verified!==true||config.approvedForPlayers!==true||typeof config.url!=='string'||!/^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/.test(config.url))return null;
 return config.url;
}
function formEntry(config,entry,now,maxAgeMs){
 const unavailable={available:false,label:'Submit Picks',message:'Official entry link unavailable. Owner verification required.'};
 if(!config||Object.keys(config).sort().join(',')!=='approvedForPlayers,url,verified'||config.verified!==true||config.approvedForPlayers!==true||!entry||entry.status!=='OPEN'||entry.authority!=='OFFICIAL')return unavailable;
 try{
  if(typeof config.url!=='string'||!/^https:\/\/docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/.test(config.url))return unavailable;
  if(!Number.isSafeInteger(maxAgeMs)||maxAgeMs<=0||!Number.isSafeInteger(now)||now-Date.parse(entry.checkedAt)>maxAgeMs||Date.parse(entry.checkedAt)>now||Date.parse(entry.validUntil)<=now||!Number.isFinite(Date.parse(entry.checkedAt)))return unavailable;
  return {available:true,label:'Submit Picks',message:'Continue to the official entry Form.',url:config.url};
 }catch{return unavailable;}
}
module.exports={formEntry,approvedPlayerDestination};
