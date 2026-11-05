'use strict';
// Existing staging permissions plus the owner's explicitly approved identity scope.
const EMAIL_SCOPE='https://www.googleapis.com/auth/userinfo.email';
const SCOPES=Object.freeze(['spreadsheets','forms','script.scriptapp','script.external_request','userinfo.email'].map(s=>'https://www.googleapis.com/auth/'+s));
function explicitManifest(manifest){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))throw Error('Invalid staging manifest');
 if(manifest.oauthScopes!==undefined&&(!Array.isArray(manifest.oauthScopes)||manifest.oauthScopes.some(s=>!SCOPES.includes(s))))throw Error('Unreviewed staging scope');
 return {...manifest,oauthScopes:[...SCOPES]};
}
module.exports={EMAIL_SCOPE,SCOPES,explicitManifest};
