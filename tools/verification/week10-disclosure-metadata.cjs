'use strict';
// Local renderer only. Never installs, executes, or contacts Apps Script.
function render(ownerDigest,projectDigest){
 if(!/^[a-f0-9]{64}$/.test(ownerDigest)||!/^[a-f0-9]{64}$/.test(projectDigest))throw Error('Pinned owner/project digests required');
 return String.raw`// REVIEWED LOCAL CANDIDATE ONLY: existing PRIVATE cloud-publisher project.
// No broad loaders, roster/config reads, network, source scoring or publishing.
function pp4InspectWeek10DisclosureMetadataOnce() {
  const receipt = pp4ReadWeek10DisclosureMetadata_();
  console.log(JSON.stringify(receipt));
  return receipt;
}
function pp4ReadWeek10DisclosureMetadata_() {
  const receipt = {state:'INSUFFICIENT_EVIDENCE', week:10, stage:'OWNER_CHECK',
    reason:'SOURCE_AND_ALIAS_GATES_NOT_INSPECTED', expectedGameHeaders:14,
    observedGameHeaders:null, missingGameHeaders:null, extraGameHeaders:null,
    duplicateGameHeaders:null, controlStatus:'NOT_INSPECTED',
    deadlineStatus:'NOT_INSPECTED', publicationFlags:'NOT_INSPECTED', writes:0};
  try {
    const active = Session.getActiveUser().getEmail();
    const effective = Session.getEffectiveUser().getEmail();
    function digest_(value) {
      return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
        value, Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
    }
    if (!active || active!==effective || digest_(active)!=='OWNER_DIGEST_PLACEHOLDER') {
      receipt.state='BLOCKED'; receipt.reason='OWNER_REQUIRED'; return receipt;
    }
    receipt.stage='PROJECT_CHECK';
    if (digest_(ScriptApp.getScriptId())!=='PROJECT_DIGEST_PLACEHOLDER') {
      receipt.state='BLOCKED'; receipt.reason='PRIVATE_PUBLISHER_PROJECT_REQUIRED'; return receipt;
    }
    receipt.stage='SEASON_CHECK';
    if (PP3.SEASON!==2026) { receipt.reason='SEASON_NOT_APPROVED'; return receipt; }
    receipt.stage='OPEN_WORKBOOK';
    const ss = getSpreadsheet_(); // Existing helper: only opens the configured workbook.
    receipt.stage='LOCATE_METADATA_SHEETS';
    const responses = ss.getSheetByName(PP3.RESPONSE_SHEET);
    const results = ss.getSheetByName(PP3.RESULTS_SHEET);
    const control = ss.getSheetByName(PP3.FORM_CONTROL_SHEET);
    if (!responses || !results || !control) throw Error('metadata');
    receipt.stage='CHECK_METADATA_DIMENSIONS';
    const responseCols = responses.getLastColumn();
    const resultCols = results.getLastColumn(), resultRows = results.getLastRow();
    const controlCols = control.getLastColumn();
    if (!Number.isInteger(responseCols) || responseCols<1 || responseCols>1024 ||
        !Number.isInteger(resultCols) || resultCols<2 || resultCols>32 ||
        !Number.isInteger(resultRows) || resultRows<2 || resultRows>1001 ||
        !Number.isInteger(controlCols) || controlCols<4 || controlCols>32) throw Error('bounds');
    function find_(range,pattern,caseSensitive=false) {
      return range.createTextFinder(pattern).useRegularExpression(true)
        .matchEntireCell(false).matchCase(caseSensitive).findAll();
    }
    function column_(sheet,cols,label) {
      const matches=find_(sheet.getRange(1,1,1,cols),'^\\s*'+label+'\\s*$',true);
      if (matches.length!==1 || matches[0].getRow()!==1) throw Error('header');
      const col=matches[0].getColumn();
      if (col<1 || col>cols) throw Error('column');
      return col;
    }
    function instant_(value) {
      if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
      if (typeof value==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
          Number.isFinite(Date.parse(value))) return value;
      return null;
    }
    receipt.stage='CONTROL_ACTIVE_WEEK_HEADER';
    const activeColumn=column_(control,controlCols,'Active Week');
    receipt.stage='CONTROL_ACTIVE_WEEK_VALUE';
    if (Number(control.getRange(2,activeColumn,1,1).getValue())!==10) {
      receipt.reason='ACTIVE_WEEK_NOT_10'; return receipt;
    }
    receipt.stage='CONTROL_KICKOFF_HEADER';
    const kickoffColumn=column_(control,controlCols,'First Kickoff');
    receipt.stage='CONTROL_DEADLINE_HEADER';
    const deadlineColumn=column_(control,controlCols,'Picks Close');
    receipt.stage='CONTROL_STATUS_HEADER';
    const statusColumn=column_(control,controlCols,'Status');
    receipt.stage='CONTROL_KICKOFF_VALUE';
    const kickoff=instant_(control.getRange(2,kickoffColumn,1,1).getValue());
    receipt.stage='CONTROL_DEADLINE_VALUE';
    const cutoff=instant_(control.getRange(2,deadlineColumn,1,1).getValue());
    receipt.stage='CONTROL_STATUS_VALUE';
    const status=String(control.getRange(2,statusColumn,1,1).getValue()).trim().toUpperCase();
    receipt.controlStatus=['OPEN','CLOSED','UPCOMING','UNKNOWN'].includes(status)?status:'UNKNOWN';
    receipt.stage='CONTROL_APPROVAL_CHECK';
    if (kickoff!=='2026-11-13T01:15:00.000Z' || cutoff!=='2026-11-13T00:15:00.000Z') {
      receipt.reason='CONTROL_DOES_NOT_MATCH_APPROVED_WEEK10'; return receipt;
    }
    receipt.deadlineStatus=Date.now()>=Date.parse(cutoff)?'PASSED':'NOT_PASSED';
    receipt.stage='RESULTS_WEEK_HEADER';
    const weekColumn=column_(results,resultCols,'Week');
    receipt.stage='RESULTS_GAME_HEADER';
    const gameColumn=column_(results,resultCols,'Game');
    receipt.stage='RESULTS_WEEK10_SEARCH';
    const weekCells=find_(results.getRange(2,weekColumn,resultRows-1,1),'^10$');
    if (weekCells.length!==14) { receipt.reason='EXPECTED_SLATE_NOT_CONFIRMED'; return receipt; }
    function norm_(v) { return String(v).trim().toLowerCase().replace(/\s+/g,' ').replace(/\s+vs\.?\s+/g,' vs '); }
    receipt.stage='RESULTS_WEEK10_GAME_LABELS';
    const wanted=[];
    for (const cell of weekCells) {
      const row=cell.getRow();
      if (cell.getColumn()!==weekColumn || row<2 || row>resultRows) throw Error('row');
      const game=norm_(results.getRange(row,gameColumn,1,1).getDisplayValue());
      if (!game || game.length>160) throw Error('game');
      wanted.push(game);
    }
    if (new Set(wanted).size!==14) { receipt.reason='EXPECTED_SLATE_NOT_CONFIRMED'; return receipt; }
    // Server-side search returns only W10 header cells. Never read submission rows.
    receipt.stage='RESPONSE_WEEK10_HEADER_SEARCH';
    const headerCells=find_(responses.getRange(1,1,1,responseCols),'^\s*W0*10\s*\|');
    if (headerCells.length>32) throw Error('headers');
    receipt.stage='RESPONSE_WEEK10_HEADER_LABELS';
    const actual=[];
    for (const cell of headerCells) {
      if (cell.getRow()!==1 || cell.getColumn()<1 || cell.getColumn()>responseCols) throw Error('cell');
      const text=String(cell.getDisplayValue()).trim();
      if (text.length>200) throw Error('header');
      const match=text.match(/^W(\d+)\s*\|\s*(.+)$/i);
      if (!match || Number(match[1])!==10) throw Error('header');
      actual.push(norm_(match[2]));
    }
    receipt.stage='CONSISTENCY_CHECK';
    if (responses.getLastColumn()!==responseCols || results.getLastRow()!==resultRows ||
        results.getLastColumn()!==resultCols ||
        Number(control.getRange(2,activeColumn,1,1).getValue())!==10 ||
        instant_(control.getRange(2,kickoffColumn,1,1).getValue())!==kickoff ||
        instant_(control.getRange(2,deadlineColumn,1,1).getValue())!==cutoff) throw Error('changed');
    receipt.stage='COMPLETE';
    receipt.observedGameHeaders=actual.length;
    receipt.missingGameHeaders=wanted.filter(g=>!actual.includes(g)).length;
    receipt.extraGameHeaders=actual.filter(g=>!wanted.includes(g)).length;
    receipt.duplicateGameHeaders=actual.length-new Set(actual).size;
    if (receipt.missingGameHeaders || receipt.extraGameHeaders || receipt.duplicateGameHeaders) {
      receipt.state='VERIFIED_METADATA_BLOCKER'; receipt.reason='GAME_HEADER_MISMATCH';
    } else if (receipt.deadlineStatus==='NOT_PASSED') {
      receipt.state='VERIFIED_METADATA_BLOCKER'; receipt.reason='DEADLINE_NOT_PASSED';
    }
    return receipt;
  } catch (_) {
    receipt.state='INSUFFICIENT_EVIDENCE'; receipt.reason='METADATA_READ_OR_SCHEMA_UNVERIFIED';
    receipt.observedGameHeaders=null; receipt.missingGameHeaders=null;
    receipt.extraGameHeaders=null; receipt.duplicateGameHeaders=null;
    return receipt;
  }
}
`.replace('OWNER_DIGEST_PLACEHOLDER',ownerDigest).replace('PROJECT_DIGEST_PLACEHOLDER',projectDigest);
}
module.exports={render};
