'use strict';
// Intentionally no dependencies, credentials, callbacks, switches or read capability.
function verifyRealCompetitionReadOnly_(){
 return Object.freeze({state:'DISABLED',reason:'OWNER_AUTHORIZATION_AND_ISOLATION_REQUIRED'});
}
if(typeof module!=='undefined'&&module.exports)module.exports=Object.freeze({verifyRealCompetitionReadOnly_});
