/**
 * PERFECT PICK 3.0 - Standalone Apps Script
 *
 * PRIVATE: Do not upload this file to GitHub.
 *
 * Data sources:
 *   Responses             - Google Form player picks
 *   Players               - player registry
 *   Results               - actual game winners/status
 *   Prize Rules           - prize periods/rules
 *   Weekly Prize Results  - manual Active Players (+ optional override/notes)
 *
 * Public endpoints:
 *   ?action=health
 *   ?action=summary
 *   ?action=week&week=1
 *   ?action=overall
 *   ?action=prizes
 */

const PP3 = {
  SHEET_ID: '1bw_FLTlIa0_BE4H1cE_pSOCRAp4uQ8VtARd90WCjf1o',
  SEASON: 2026,

  RESPONSE_SHEET: 'Responses',
  PLAYERS_SHEET: 'Players',
  RESULTS_SHEET: 'Results',
  RULES_SHEET: 'Prize Rules',
  WEEKLY_PRIZE_SHEET: 'Weekly Prize Results',
  LEDGER_SHEET: 'Prize Ledger',
  TIEBREAK_RULES_SHEET: 'Tiebreak Rules',
  FORM_CONTROL_SHEET: 'Form Control',

  TIMESTAMP_COLUMN: 'Timestamp',
  NAME_COLUMN: 'Name',
  PHONE_COLUMN: 'Phone Number',
  GAME_HEADER_REGEX: /^W(\d+)\s*\|\s*(.+)$/i,

  DEFAULT_ACTIVE_PLAYERS: 23,
  DEFAULT_WEEKLY_ENTRY: 5,

  TIMEZONE: 'America/Los_Angeles',

  SUMMARY_CACHE_SECONDS: 120,
  WEEK_CACHE_SECONDS: 120,
  OVERALL_CACHE_SECONDS: 180,
  PRIZE_CACHE_SECONDS: 120
};

function doGet(e) {
  const action = String(e?.parameter?.action || 'summary').toLowerCase();
  let data;

  if (action === 'health') {
    data = {
      ok: true,
      app: 'Perfect Pick 3.0',
      season: PP3.SEASON,
      generatedAt: new Date().toISOString()
    };
  } else if (action === 'summary') {
    data = getCachedOrBuild_(
      `pp3:summary:${PP3.SEASON}`,
      PP3.SUMMARY_CACHE_SECONDS,
      buildSummary_
    );
  } else if (action === 'week') {
    const week = Number(e?.parameter?.week);

    if (!week) {
      throw new Error('Missing or invalid week parameter.');
    }

    data = getCachedOrBuild_(
      `pp3:week:${PP3.SEASON}:${week}`,
      PP3.WEEK_CACHE_SECONDS,
      () => buildWeek_(week)
    );
  } else if (action === 'overall') {
    data = getCachedOrBuild_(
      `pp3:overall:${PP3.SEASON}`,
      PP3.OVERALL_CACHE_SECONDS,
      buildOverall_
    );
  } else if (action === 'prizes') {
    data = getCachedOrBuild_(
      `pp3:prizes:${PP3.SEASON}`,
      PP3.PRIZE_CACHE_SECONDS,
      buildPrizeDashboard_
    );
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  assertNoForbiddenKeys_(data);

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupPerfectPick3_0() {
  const ss = getSpreadsheet_();

  ensureSheetWithHeaders_(ss, PP3.RULES_SHEET, [
    'Period Key',
    'Display Name',
    'Start Week',
    'End Week',
    'Rule Mode',
    'Weekly Entry',
    'Monthly Winner %',
    'Season %',
    'Season 1st %',
    'Season 2nd %',
    'Season 3rd %',
    'Include In Season',
    'Locked',
    'Notes'
  ]);

  ensureSheetWithHeaders_(ss, PP3.WEEKLY_PRIZE_SHEET, [
    'Week',
    'Period Key',
    'Active Players',
    'Perfect Pick Winners',
    'Perfect Pick Winner Names',
    'Finalized',
    'Override Weekly Pot',
    'Notes'
  ]);

  ensureSheetWithHeaders_(ss, PP3.LEDGER_SHEET, [
    'Timestamp',
    'Type',
    'Period Key',
    'Week',
    'Description',
    'Amount',
    'Winner(s)',
    'Notes'
  ]);

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

  seedPrizeRules3_0_();
  seedTiebreakRules3_0_();
  seedWeeklyPrizeRows3_0_();
  ensureNFLResultColumns3_0_();
  setupTriggers3_0();

  Logger.log('Perfect Pick 3.0 setup complete.');
}

function seedPrizeRules3_0_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.RULES_SHEET);

  if (sheet.getLastRow() > 1) return;

  const rows = [
    ['M1', 'Month 1', 1, 4, 'NEW', PP3.DEFAULT_WEEKLY_ENTRY, 50, 50, '', '', '', 'YES', 'NO', '50/50 monthly/season split; season payout structure TBD'],
    ['M2', 'Month 2', 5, 8, 'NEW', PP3.DEFAULT_WEEKLY_ENTRY, 50, 50, '', '', '', 'YES', 'NO', '50/50 monthly/season split; season payout structure TBD'],
    ['M3', 'Month 3', 9, 12, 'NEW', PP3.DEFAULT_WEEKLY_ENTRY, 50, 50, '', '', '', 'YES', 'NO', '50/50 monthly/season split; season payout structure TBD'],
    ['M4', 'Month 4', 13, 16, 'NEW', PP3.DEFAULT_WEEKLY_ENTRY, 50, 50, '', '', '', 'YES', 'NO', '50/50 monthly/season split; season payout structure TBD'],
    ['M5', 'Month 5', 17, 18, 'NEW', PP3.DEFAULT_WEEKLY_ENTRY, 50, 50, '', '', '', 'YES', 'NO', 'Short final period; 50/50 monthly/season split; season payout structure TBD']
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedTiebreakRules3_0_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.TIEBREAK_RULES_SHEET);
  if (!sheet) return;

  // Only the final week of each prize period needs a monthly tiebreak question.
  const tiebreakWeeks = [4, 8, 12, 16, 18];

  // If the sheet already has data, refresh the matchup metadata instead of duplicating rows.
  if (sheet.getLastRow() > 1) {
    refreshTiebreakRules3_0_();
    return;
  }

  const rows = tiebreakWeeks.map(week => [
    week,
    `WK ${week} Tie Breaker — Final Game — Enter Combined Score`,
    '',
    '',
    '',
    'Pending',
    'Combined Points',
    'Used only if the prize period ends with multiple players tied for 1st place'
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  refreshTiebreakRules3_0_();
}

function refreshTiebreakRules3_0_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.TIEBREAK_RULES_SHEET);
  const resultsSheet = ss.getSheetByName(PP3.RESULTS_SHEET);
  if (!sheet || !resultsSheet) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(h => String(h || '').trim());
  const idx = headerIndex_(headers);

  const required = ['Week', 'Question Label', 'Tiebreak Game', 'Event ID', 'Actual Total', 'Status', 'Method', 'Notes'];
  const missing = required.filter(h => idx[h] === undefined);
  if (missing.length) throw new Error('Tiebreak Rules is missing columns: ' + missing.join(', '));

  const resultValues = resultsSheet.getRange(1, 1, resultsSheet.getLastRow(), resultsSheet.getLastColumn()).getDisplayValues();
  const resultHeaders = resultValues[0].map(h => String(h || '').trim());
  const rIdx = headerIndex_(resultHeaders);
  const requiredResult = ['Week', 'Game', 'Team 1 Score', 'Team 2 Score', 'Status', 'Event ID'];
  const missingResult = requiredResult.filter(h => rIdx[h] === undefined);
  if (missingResult.length) throw new Error('Results is missing columns: ' + missingResult.join(', '));

  const tiebreakWeeks = [4, 8, 12, 16, 18];
  const existingRows = {};
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues().forEach((row, i) => {
      const week = Number(row[idx['Week']]);
      if (week) existingRows[week] = { rowNumber: i + 2, row };
    });
  }

  tiebreakWeeks.forEach(week => {
    // Results is already ordered by kickoff time. The last row for the week is the final scheduled game.
    const games = resultValues.slice(1).filter(row => Number(row[rIdx['Week']]) === week && String(row[rIdx['Game']] || '').trim());
    const lastGame = games.length ? games[games.length - 1] : null;

    const game = lastGame ? String(lastGame[rIdx['Game']] || '').trim() : '';
    const eventId = lastGame ? String(lastGame[rIdx['Event ID']] || '').trim() : '';
    const status = lastGame ? String(lastGame[rIdx['Status']] || 'Pending').trim() : 'Pending';
    const score1 = lastGame ? String(lastGame[rIdx['Team 1 Score']] ?? '').trim() : '';
    const score2 = lastGame ? String(lastGame[rIdx['Team 2 Score']] ?? '').trim() : '';
    const actualTotal = status.toLowerCase() === 'final' && score1 !== '' && score2 !== ''
      ? Number(score1) + Number(score2)
      : '';
    const questionLabel = game
      ? `WK ${week} Tie Breaker — ${game} — Enter Combined Score`
      : `WK ${week} Tie Breaker — Final Game — Enter Combined Score`;

    const values = new Array(headers.length).fill('');
    values[idx['Week']] = week;
    values[idx['Question Label']] = questionLabel;
    values[idx['Tiebreak Game']] = game;
    values[idx['Event ID']] = eventId;
    values[idx['Actual Total']] = actualTotal;
    values[idx['Status']] = status || 'Pending';
    values[idx['Method']] = 'Combined Points';
    values[idx['Notes']] = 'Used only if the prize period ends with multiple players tied for 1st place';

    if (existingRows[week]) {
      sheet.getRange(existingRows[week].rowNumber, 1, 1, headers.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }
  });
}

function seedWeeklyPrizeRows3_0_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.WEEKLY_PRIZE_SHEET);

  if (sheet.getLastRow() > 1) return;

  const rules = readPrizeRules_(ss);
  const rows = [];

  for (let week = 1; week <= 18; week++) {
    const rule = findRuleForWeek_(rules, week);

    rows.push([
      week,
      rule?.periodKey || '',
      PP3.DEFAULT_ACTIVE_PLAYERS,
      '',
      '',
      '',
      '',
      ''
    ]);
  }

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // Brand-new / empty sheet: write the complete header row.
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(value => String(value || '').trim());

  // If the existing first row is completely blank, replace it with the
  // requested headers rather than appending after blank columns.
  if (currentHeaders.every(value => !value)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  // Existing sheets may predate newly-added columns. Append only headers
  // that are actually missing. This lets migrations upgrade a live sheet
  // without requiring the user to delete/recreate it.
  const missingHeaders = headers.filter(
    header => !currentHeaders.includes(String(header).trim())
  );

  if (missingHeaders.length) {
    sheet
      .getRange(1, sheet.getLastColumn() + 1, 1, missingHeaders.length)
      .setValues([missingHeaders]);
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function buildSummary_() {
  const ctx = loadContext_();
  const prizes = buildPrizeDashboardFromContext_(ctx);

  return {
    app: 'Perfect Pick 3.0',
    season: PP3.SEASON,
    activeWeek: getActiveWeek_(ctx.games, ctx.resultLookup),
    formControl: readFormControl_(ctx.ss),
    currentPeriod: prizes.currentPeriod,
    currentRuleMode: prizes.currentRuleMode,
    currentWeeklyPot: prizes.currentWeeklyPot,
    currentMonthlyPot: prizes.currentMonthlyPot,
    projectedMonthlyWinnerPool: prizes.projectedMonthlyWinnerPool,
    projectedSeasonPot: prizes.projectedSeasonPot,
    generatedAt: new Date().toISOString()
  };
}

function buildWeek_(week) {
  const ctx = loadContext_();
  return buildWeekFromContext_(week, ctx);
}

function buildOverall_() {
  const ctx = loadContext_();
  return buildOverallFromContext_(ctx);
}

function buildPrizeDashboard_() {
  const ctx = loadContext_();
  return buildPrizeDashboardFromContext_(ctx);
}
