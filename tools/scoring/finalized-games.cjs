'use strict';
// Shared denominator only. No submission eligibility, cutoff or scoring policy.
const finalizedGameCount=games=>games.filter(g=>g.status==='FINAL').length;
module.exports={finalizedGameCount};
