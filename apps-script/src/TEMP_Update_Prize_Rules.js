/**
 * PERFECT PICK 3.0 - ONE-TIME PRIZE RULE MIGRATION
 *
 * Run TEMP_apply5050PrizeRules() once after replacing the Apps Script files.
 * It updates the existing Prize Rules sheet to the new 50/50 structure and
 * creates/seeds the Tiebreak Rules sheet if needed.
 *
 * Safe to delete or comment out after it runs successfully.
 */

function TEMP_apply5050PrizeRules() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.RULES_SHEET);
  if (!sheet) throw new Error('Prize Rules sheet not found.');

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  if (!values.length) throw new Error('Prize Rules sheet is empty.');

  const headers = values[0].map(h => String(h || '').trim());
  const idx = headerIndex_(headers);
  const required = ['Period Key', 'Monthly Winner %', 'Season %'];
  const missing = required.filter(h => idx[h] === undefined);
  if (missing.length) throw new Error('Prize Rules is missing: ' + missing.join(', '));

  let updated = 0;
  for (let r = 1; r < values.length; r++) {
    const periodKey = String(values[r][idx['Period Key']] || '').trim();
    if (!periodKey) continue;

    sheet.getRange(r + 1, idx['Monthly Winner %'] + 1).setValue(50);
    sheet.getRange(r + 1, idx['Season %'] + 1).setValue(50);

    ['Season 1st %', 'Season 2nd %', 'Season 3rd %'].forEach(header => {
      if (idx[header] !== undefined) {
        sheet.getRange(r + 1, idx[header] + 1).clearContent();
      }
    });

    if (idx['Notes'] !== undefined) {
      const noteCell = sheet.getRange(r + 1, idx['Notes'] + 1);
      const oldNote = String(noteCell.getDisplayValue() || '').trim();
      const newNote = '50/50 monthly/season split; season payout structure TBD';
      if (!oldNote.includes(newNote)) {
        noteCell.setValue(oldNote ? oldNote + '; ' + newNote : newNote);
      }
    }

    updated++;
  }

  // Ensure the tiebreak sheet uses the final week of each prize period.
  ensureSheetWithHeaders_(ss, PP3.TIEBREAK_RULES_SHEET, [
    'Week',
    'Question Label',
    'Tiebreak Game',
    'Event ID',
    'Actual Total',
    'Status',
    'Method',
    'Notes'
  ]);

  const tiebreakSheet = ss.getSheetByName(PP3.TIEBREAK_RULES_SHEET);
  if (tiebreakSheet && tiebreakSheet.getLastRow() > 1) {
    tiebreakSheet.getRange(2, 1, tiebreakSheet.getLastRow() - 1, tiebreakSheet.getLastColumn()).clearContent();
  }
  seedTiebreakRules3_0_();
  refreshTiebreakRules3_0_();

  clearPerfectPick3_0Caches();

  const result = {
    ok: true,
    periodsUpdated: updated,
    monthlyWinnerPercent: 50,
    seasonPercent: 50,
    seasonPayoutStructure: 'TBD',
    tiebreakMethod: 'Combined Points',
    tiebreakAffectsWinnerLogic: true,
    tiebreakWeeks: [4, 8, 12, 16, 18]
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
