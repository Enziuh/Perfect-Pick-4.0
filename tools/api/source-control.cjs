'use strict';
// Narrow legacy rollover repair: discard mixed-week presentation metadata only.
// Never change scores, picks, proof timestamps or closure/disclosure evidence.
function normalizeSource(reply,now){
 const {decode}=require('./browser-client.cjs'),{TEAM_NAMES}=require('../presentation/contract-dashboard.cjs'),d=require('../disclosure/weekly-deadline.cjs'),c=reply?.control,s=reply?.snapshot,iso=v=>v===''||typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
 if(!c||Object.keys(c).sort().join(',')!=='activeWeek,firstGame,firstKickoff,picksClose,reportedStatus'||c.activeWeek!==reply.activeWeek||!['OPEN','CLOSED','UPCOMING','UNKNOWN'].includes(c.reportedStatus)||!iso(c.firstKickoff)||!iso(c.picksClose))throw Error('Source control unavailable');
 const label=g=>TEAM_NAMES[g.home]+' vs '+TEAM_NAMES[g.away];
 if(c.firstGame===''||s.games.some(g=>g.week===reply.activeWeek&&label(g)===c.firstGame)){decode(reply,now,d.records(reply,now));return reply;}
 const next=d.GRANTS.find(g=>g.week===10&&g.firstKickoff===c.firstKickoff&&g.deadline===c.picksClose);
 if(reply.activeWeek!==9||!next||!s.games.some(g=>g.week===10&&label(g)===c.firstGame))throw Error('Source control unavailable');
 const grant=d.GRANTS.find(g=>g.week===9),games=s.games.filter(g=>g.week===9),opening=games.find(g=>g.kickoff===grant.firstKickoff);
 const entry=s.weeks.find(w=>w.week===9)?.entry;
 if(!opening||!entry||entry.deadline!==null&&entry.deadline!==grant.deadline)throw Error('Source control unavailable');
 const clean={...reply,control:{activeWeek:9,firstGame:label(opening),firstKickoff:grant.firstKickoff,picksClose:grant.deadline,reportedStatus:'UNKNOWN'}};
 const records=d.records(clean,now);if(!records.some(r=>r.week===9))throw Error('Source control unavailable');decode(clean,now,records);return clean;
}
module.exports={normalizeSource};
