'use strict';
// Classify privately received GitHub errors; NEVER return body/message/headers/URLs.
const REASONS=Object.freeze(['AUTHENTICATION_FAILED','TOKEN_PERMISSION_DENIED','ACCESS_POLICY','BRANCH_POLICY','RATE_LIMIT','STALE_SHA','CONFLICT','VALIDATION_REJECTED','REQUEST_REJECTED','SERVER_ERROR','REDIRECT_REFUSED']);
function rejection(status,body){
 let message='';try{const parsed=JSON.parse(body);if(typeof parsed.message==='string')message=parsed.message;}catch{}
 let reason='REQUEST_REJECTED';
 if(status>=300&&status<400)reason='REDIRECT_REFUSED';else if(status===401)reason='AUTHENTICATION_FAILED';
 else if(/rate limit|abuse detection/i.test(message)||status===429)reason='RATE_LIMIT';
 else if(/protected branch|repository rule|GH013|pull request/i.test(message))reason='BRANCH_POLICY';
 else if(/resource not accessible by (?:personal access token|integration)/i.test(message))reason='TOKEN_PERMISSION_DENIED';
 else if(/SAML|SSO|organization.*(?:policy|approval)/i.test(message))reason='ACCESS_POLICY';
 else if(/sha.*(?:does not match|mismatch)|(?:does not match|mismatch).*sha/i.test(message))reason='STALE_SHA';
 else if(status===409)reason='CONFLICT';else if(status===422)reason='VALIDATION_REJECTED';else if(status>=500)reason='SERVER_ERROR';
 const safe=Number.isInteger(status)&&status>=100&&status<=599?status:500;
 return Object.assign(Error('GitHub operation rejected'),{safeCode:'GITHUB_HTTP_'+safe+'_'+reason});
}
function safeCode(error){const code=error?.safeCode;if(typeof code!=='string')return null;const m=code.match(/^GITHUB_HTTP_[1-5][0-9]{2}_([A-Z_]+)$/);return m&&REASONS.includes(m[1])?code:null;}
module.exports={rejection,safeCode};
