'use strict';
// Temporary editor entry only; never a web route or part of Pages.
const {render}=require('./private-registry-package.cjs');
const {checkAppsScriptCompatibility}=require('../verification/gas-compatibility.cjs');
const NAME='pp4AuthorizePrivateRegistry';
const SOURCE=`
// TEMPORARY: remove after owner consent; no initialization or data operations.
function pp4AuthorizePrivateRegistry() {
 if (pp4PrivateRegistryConfig_() !== null) throw Error('Registry must remain disabled');
 return pp4PrivateRegistry_();
}
`;
function append(source){if(source!==render())throw Error('Exact disabled reviewed helper required');const result=source+SOURCE;checkAppsScriptCompatibility(result,'OwnerIdentityRegistry.gs');return result;}
function remove(source){if(source!==render()+SOURCE)throw Error('Unexpected staging helper changes; stop before cleanup');return render();}
module.exports={NAME,SOURCE,append,remove};
