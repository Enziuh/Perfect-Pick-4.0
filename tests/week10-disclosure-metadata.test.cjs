'use strict';
// Static source/AST tests ONLY: never evaluate or invoke the Apps Script diagnostic.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {render}=require('../tools/verification/week10-disclosure-metadata.cjs'),{checkAppsScriptCompatibility}=require('../tools/verification/gas-compatibility.cjs'),acorn=require('../tools/vendor/acorn/acorn.cjs');
const source=render('a'.repeat(64),'b'.repeat(64)),tree=acorn.parse(source,{ecmaVersion:2020});
function nodes(node,type){if(!node||typeof node!=='object')return [];return [...(node.type===type?[node]:[]),...Object.values(node).flatMap(v=>Array.isArray(v)?v.flatMap(x=>nodes(x,type)):nodes(v,type))];}
const calls=nodes(tree,'CallExpression'),names=new Set(calls.map(n=>n.callee.type==='Identifier'?n.callee.name:n.callee.property?.name));
test('diagnostic source is ES2020 and has declarations only, with pinned owner/project bindings',()=>{
 assert.equal(checkAppsScriptCompatibility(source).grammar,'ECMAScript 2020');assert(tree.body.every(n=>n.type==='FunctionDeclaration'));
 assert.deepEqual(tree.body.map(n=>n.id.name),['pp4InspectWeek10DisclosureMetadataOnce','pp4ReadWeek10DisclosureMetadata_']);
 assert.throws(()=>render('', 'b'.repeat(64)));assert.throws(()=>render('a'.repeat(64), ''));
 const gate=source.indexOf("receipt.reason='PRIVATE_PUBLISHER_PROJECT_REQUIRED'");assert(gate>source.indexOf("receipt.reason='OWNER_REQUIRED'"));assert(gate<source.indexOf('getSpreadsheet_()'));assert(source.indexOf('PP3.SEASON!==2026')<source.indexOf('getSpreadsheet_()'));
});
test('all reachable call names are read-only or local; unknown, computed or dynamic calls are rejected',()=>{
 const allowed=new Set(['pp4ReadWeek10DisclosureMetadata_','log','stringify','getActiveUser','getEffectiveUser','getEmail','computeDigest','map','toString','slice','join','digest_','getScriptId','getSpreadsheet_','getSheetByName','getLastColumn','getLastRow','isInteger','Error','createTextFinder','useRegularExpression','matchEntireCell','matchCase','findAll','find_','getRange','getRow','getColumn','isFinite','getTime','toISOString','test','parse','column_','Number','getValue','instant_','String','trim','toUpperCase','includes','now','toLowerCase','replace','norm_','getDisplayValue','push','match','filter']);
 for(const call of calls){assert(['Identifier','MemberExpression'].includes(call.callee.type));if(call.callee.type==='MemberExpression')assert(!call.callee.computed);assert(allowed.has(call.callee.type==='Identifier'?call.callee.name:call.callee.property.name),'Unexpected call');}
 assert(nodes(tree,'NewExpression').every(n=>['Error','Set'].includes(n.callee.name)));
 assert(!/loadContext_|readResponseSheet_|getPlayerRegistry_|readNativeResponses|pp4CloudDeadlineSource_|pp4CloudSnapshotConfig_|PropertiesService|UrlFetchApp|FormApp|DriveApp|CacheService|LockService|fetch\s*\(|eval\s*\(|Function\s*\(/.test(source));
 assert(![...names].some(n=>/^(?:set|delete|clear|createTrigger|publish|deploy|repair|score|install)/i.test(n)));
});
test('existing spreadsheet helper dependency opens only configured workbook, without invoking context loaders',()=>{
 const data=acorn.parse(fs.readFileSync('apps-script/src/20_Data.js','utf8'),{ecmaVersion:2020});const helper=data.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='getSpreadsheet_');assert.equal(helper.body.body.length,1);const call=helper.body.body[0].argument;assert.equal(call.callee.object.name,'SpreadsheetApp');assert.equal(call.callee.property.name,'openById');assert.equal(call.arguments[0].object.name,'PP3');assert.equal(call.arguments[0].property.name,'SHEET_ID');
});
test('content reads use only selected single cells and bounded server-side metadata searches',()=>{
 const reads=calls.filter(n=>n.callee.property?.name==='getRange');assert.equal(reads.length,11);
 const response=reads.filter(n=>n.callee.object.name==='responses');assert.equal(response.length,1);assert.deepEqual(response[0].arguments.slice(0,3).map(n=>n.value),[1,1,1]);
 const results=reads.filter(n=>n.callee.object.name==='results');assert.equal(results.length,2);assert.equal(results[0].arguments[0].value,2);assert.equal(results[0].arguments[3].value,1);assert.equal(results[1].arguments[1].name,'gameColumn');assert.deepEqual(results[1].arguments.slice(2).map(n=>n.value),[1,1]);
 const control=reads.filter(n=>n.callee.object.name==='control');assert.equal(control.length,7);for(const r of control)assert.deepEqual([r.arguments[0].value,r.arguments[2].value,r.arguments[3].value],[2,1,1]);
 assert(!names.has('getValues')&&!names.has('getDisplayValues')&&!names.has('getDataRange'));
});
test('bounds and Week10 selection precede reading Game/header content; unrelated rows are not materialized',()=>{
 for(const bound of ['responseCols>1024','resultCols>32','resultRows>1001','controlCols>32','headerCells.length>32','weekCells.length!==14'])assert(source.includes(bound));
 assert(source.includes("results.getRange(2,weekColumn,resultRows-1,1),'^10$'"));assert(source.includes("responses.getRange(1,1,1,responseCols),'^\\s*W0*10\\s*\\|'"));
 assert(source.indexOf('resultRows>1001')<source.indexOf('find_(results.getRange'));
 assert(source.indexOf('row<2 || row>resultRows')<source.indexOf('results.getRange(row,gameColumn'));
 assert(source.indexOf('cell.getRow()!==1 || cell.getColumn()<1')<source.indexOf('String(cell.getDisplayValue())'));
 assert(source.includes('Number(match[1])!==10'));assert(source.includes('responses.getLastColumn()!==responseCols'));
});
test('only four active-week control cells can be read; no phone, name, response or registry columns',()=>{
 const labels=calls.filter(n=>n.callee.name==='column_').map(n=>n.arguments[2].value);assert.deepEqual(labels,['Active Week','First Kickoff','Picks Close','Status','Week','Game']);
 assert(source.indexOf("receipt.reason='ACTIVE_WEEK_NOT_10'")<source.indexOf("column_(control,controlCols,'First Kickoff')"));
 assert(!/Phone|Display Name|Timestamp|approvedAliases|registry|playerId|sourceKey/.test(source));
});
test('one dedicated wrapper logs only its fixed-shape sanitized receipt and never raw values/exceptions',()=>{
 const wrapper=tree.body[0];assert.equal(wrapper.body.body.length,3);const logs=calls.filter(n=>n.callee.object?.name==='console');assert.equal(logs.length,1);assert.equal(logs[0].callee.property.name,'log');assert.equal(logs[0].arguments[0].callee.property.name,'stringify');assert.equal(logs[0].arguments[0].arguments[0].name,'receipt');
 const receipt=nodes(tree.body[1],'VariableDeclarator').find(n=>n.id.name==='receipt').init;assert.deepEqual(receipt.properties.map(p=>p.key.name),['state','week','stage','reason','expectedGameHeaders','observedGameHeaders','missingGameHeaders','extraGameHeaders','duplicateGameHeaders','controlStatus','deadlineStatus','publicationFlags','writes']);assert.equal(receipt.properties.find(p=>p.key.name==='writes').value.value,0);
 for(const n of nodes(tree,'AssignmentExpression'))if(n.left.type==='MemberExpression'&&n.left.object.name==='receipt')assert.notEqual(n.left.property.name,'writes');
 assert(source.includes("publicationFlags:'NOT_INSPECTED'"));assert(source.includes("state:'INSUFFICIENT_EVIDENCE'"));assert(source.includes("reason:'SOURCE_AND_ALIAS_GATES_NOT_INSPECTED'"));assert(!source.includes("state='VERIFIED'"));
});

test('metadata failure stage contains only fixed labels; header search matches native trimmed headers',()=>{
 const stages=nodes(tree,'AssignmentExpression').filter(n=>n.left.type==='MemberExpression'&&n.left.object.name==='receipt'&&n.left.property.name==='stage');
 assert(stages.length>=20);for(const n of stages){assert.equal(n.right.type,'Literal');assert(/^[A-Z_0-9]+$/.test(n.right.value));}
 assert(stages.some(n=>n.right.value==='OPEN_WORKBOOK'));assert(stages.some(n=>n.right.value==='COMPLETE'));
 const header=nodes(tree,'FunctionDeclaration').find(n=>n.id.name==='column_');
 const pattern=nodes(header,'CallExpression').find(n=>n.callee.name==='find_').arguments[1];
 assert.equal(pattern.left.left.value,'^\\s*');assert.equal(pattern.right.value,'\\s*$');
 const re=new RegExp(pattern.left.left.value+'Active Week'+pattern.right.value);assert(re.test(' Active Week '));assert(re.test('Active Week'));assert(!re.test('Active Week Private'));
});
