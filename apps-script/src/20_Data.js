/* =========================================================
   DATA LOADING
   ========================================================= */

function loadContext_() {
  const ss = getSpreadsheet_();
  const responseSheet = ss.getSheetByName(PP3.RESPONSE_SHEET);
  if (!responseSheet) {
    throw new Error(`Could not find "${PP3.RESPONSE_SHEET}" sheet.`);
  }

  const responseData = readResponseSheet_(responseSheet);

  return {
    ss,
    games: responseData.games,
    responses: responseData.responses,
    weeks: [...new Set(responseData.games.map(g => g.week))].sort((a, b) => a - b),
    playerRegistry: getPlayerRegistry_(ss),
    resultLookup: getResultLookup_(ss)
  };
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(PP3.SHEET_ID);
}

function readResponseSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    return { headers: [], games: [], responses: [] };
  }

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  const headers = values[0].map(h => String(h || '').trim());
  const games = [];

  headers.forEach((header, columnIndex) => {
    if (!header) return;
    const match = header.match(PP3.GAME_HEADER_REGEX);
    if (!match) return;

    games.push({
      header,
      columnIndex,
      week: Number(match[1]),
      game: match[2].trim()
    });
  });

  const responses = values
    .slice(1)
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const response = {};
      headers.forEach((header, index) => {
        if (header) response[header] = row[index];
      });
      return response;
    });

  return { headers, games, responses };
}

function getLatestSubmissionPerWeek_(responses, games) {
  const latest = {};

  responses.forEach(response => {
    const phone = normalizePhone_(response[PP3.PHONE_COLUMN]);
    if (!phone) return;

    const timestamp = parseTimestamp_(response[PP3.TIMESTAMP_COLUMN]);
    const weeks = getWeeksSubmitted_(response, games);

    weeks.forEach(week => {
      const key = `${phone}|${week}`;
      if (!latest[key] || timestamp >= latest[key].timestamp) {
        latest[key] = { phone, week, timestamp, response };
      }
    });
  });

  return latest;
}

function getWeeksSubmitted_(response, games) {
  const weeks = new Set();
  games.forEach(game => {
    const value = String(response[game.header] || '').trim();
    if (value) weeks.add(game.week);
  });
  return [...weeks];
}

function getPlayerRegistry_(ss) {
  const sheet = ss.getSheetByName(PP3.PLAYERS_SHEET);
  const registry = {};
  if (!sheet || sheet.getLastRow() < 2) return registry;

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(h => String(h || '').trim());
  const phoneCol = headers.indexOf('Phone');
  const nameCol = headers.indexOf('Display Name');

  if (phoneCol === -1 || nameCol === -1) return registry;

  values.slice(1).forEach(row => {
    const phone = normalizePhone_(row[phoneCol]);
    const name = String(row[nameCol] || '').trim();
    if (phone && name) registry[phone] = name;
  });

  return registry;
}

function getResultLookup_(ss) {
  const sheet = ss.getSheetByName(PP3.RESULTS_SHEET);
  const lookup = {};
  if (!sheet || sheet.getLastRow() < 2) return lookup;

  const values = sheet
    .getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn())
    .getDisplayValues();

  const headers = values[0].map(h => String(h || '').trim());

  const weekCol = headers.indexOf('Week');
  const gameCol = headers.indexOf('Game');
  const team1Col = headers.indexOf('Team 1');
  const team2Col = headers.indexOf('Team 2');
  const winnerCol = headers.indexOf('Winner');
  const statusCol = headers.indexOf('Status');
  const team1ScoreCol = headers.indexOf('Team 1 Score');
  const team2ScoreCol = headers.indexOf('Team 2 Score');

  if (weekCol === -1 || gameCol === -1) {
    throw new Error('Results sheet must contain Week and Game columns.');
  }

  values.slice(1).forEach(row => {
    const week = Number(row[weekCol]);
    const game = String(row[gameCol] || '').trim();
    if (!week || !game) return;

    const team1 = team1Col >= 0 ? String(row[team1Col] || '').trim() : '';
    const team2 = team2Col >= 0 ? String(row[team2Col] || '').trim() : '';
    const winner = winnerCol >= 0 ? String(row[winnerCol] || '').trim() : '';
    const status = statusCol >= 0 ? String(row[statusCol] || '').trim() : '';

    // Keep blank scores blank. Number('') would incorrectly turn them into 0.
    const team1Score =
      team1ScoreCol >= 0 ? String(row[team1ScoreCol] ?? '').trim() : '';
    const team2Score =
      team2ScoreCol >= 0 ? String(row[team2ScoreCol] ?? '').trim() : '';

    if (!lookup[week]) lookup[week] = {};

    lookup[week][normalizeGame_(game)] = {
      game,
      team1,
      team2,
      winner,
      status,
      team1Score,
      team2Score
    };
  });

  return lookup;
}

function readFormControl_(ss) {
  const sheet = ss.getSheetByName(PP3.FORM_CONTROL_SHEET);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      activeWeek: 0,
      section: '',
      firstGame: '',
      firstKickoff: '',
      picksClose: '',
      status: '',
      deadlineRule: '',
      updated: ''
    };
  }

  const values = sheet
    .getRange(1, 1, Math.min(sheet.getLastRow(), 2), sheet.getLastColumn())
    .getValues();

  const headers = values[0].map(h => String(h || '').trim());
  const row = values[1] || [];
  const idx = headerIndex_(headers);

  const asIso = value => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString();
    }

    const text = String(value || '').trim();
    if (!text) return '';

    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  };

  return {
    activeWeek: idx['Active Week'] !== undefined
      ? numberOr_(row[idx['Active Week']], 0)
      : 0,
    section: idx['Section'] !== undefined
      ? String(row[idx['Section']] || '').trim()
      : '',
    firstGame: idx['First Game'] !== undefined
      ? String(row[idx['First Game']] || '').trim()
      : '',
    firstKickoff: idx['First Kickoff'] !== undefined
      ? asIso(row[idx['First Kickoff']])
      : '',
    picksClose: idx['Picks Close'] !== undefined
      ? asIso(row[idx['Picks Close']])
      : '',
    status: idx['Status'] !== undefined
      ? String(row[idx['Status']] || '').trim().toUpperCase()
      : '',
    deadlineRule: idx['Deadline Rule'] !== undefined
      ? String(row[idx['Deadline Rule']] || '').trim()
      : '',
    updated: idx['Updated'] !== undefined
      ? asIso(row[idx['Updated']])
      : ''
  };
}

function readPrizeRules_(ss) {
  const sheet = ss.getSheetByName(PP3.RULES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(h => String(h || '').trim());
  const idx = headerIndex_(headers);

  return values.slice(1)
    .filter(row => String(row[idx['Period Key']] || '').trim())
    .map(row => ({
      periodKey: String(row[idx['Period Key']] || '').trim(),
      displayName: String(row[idx['Display Name']] || '').trim(),
      startWeek: Number(row[idx['Start Week']]),
      endWeek: Number(row[idx['End Week']]),
      ruleMode: String(row[idx['Rule Mode']] || '').trim().toUpperCase(),
      weeklyEntry: numberOr_(row[idx['Weekly Entry']], PP3.DEFAULT_WEEKLY_ENTRY),
      monthlyWinnerPct: numberOr_(row[idx['Monthly Winner %']], 50),
      seasonPct: numberOr_(row[idx['Season %']], 50),
      season1Pct: numberOr_(row[idx['Season 1st %']], 60),
      season2Pct: numberOr_(row[idx['Season 2nd %']], 25),
      season3Pct: numberOr_(row[idx['Season 3rd %']], 15),
      includeInSeason: yesNo_(row[idx['Include In Season']]),
      locked: yesNo_(row[idx['Locked']]),
      notes: String(row[idx['Notes']] || '').trim()
    }))
    .sort((a, b) => a.startWeek - b.startWeek);
}

function readWeeklyPrizeRows_(ss) {
  const sheet = ss.getSheetByName(PP3.WEEKLY_PRIZE_SHEET);
  const lookup = {};
  if (!sheet || sheet.getLastRow() < 2) return lookup;

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(h => String(h || '').trim());
  const idx = headerIndex_(headers);

  values.slice(1).forEach(row => {
    const week = Number(row[idx['Week']]);
    if (!week) return;

    lookup[week] = {
      periodKey: String(row[idx['Period Key']] || '').trim(),
      activePlayers: numberOr_(row[idx['Active Players']], 0),
      overrideWeeklyPot: row[idx['Override Weekly Pot']],
      notes: String(row[idx['Notes']] || '').trim()
    };
  });

  return lookup;
}


function readTiebreakRules_(ss) {
  const sheet = ss.getSheetByName(PP3.TIEBREAK_RULES_SHEET);
  const lookup = {};
  if (!sheet || sheet.getLastRow() < 2) return lookup;

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(h => String(h || '').trim());
  const idx = headerIndex_(headers);

  values.slice(1).forEach(row => {
    const week = Number(row[idx['Week']]);
    if (!week) return;

    lookup[week] = {
      week,
      questionLabel: idx['Question Label'] !== undefined ? String(row[idx['Question Label']] || '').trim() : '',
      game: idx['Tiebreak Game'] !== undefined ? String(row[idx['Tiebreak Game']] || '').trim() : '',
      eventId: idx['Event ID'] !== undefined ? String(row[idx['Event ID']] || '').trim() : '',
      actualTotal: idx['Actual Total'] !== undefined ? String(row[idx['Actual Total']] || '').trim() : '',
      status: idx['Status'] !== undefined ? String(row[idx['Status']] || 'Pending').trim() : 'Pending',
      method: idx['Method'] !== undefined ? String(row[idx['Method']] || 'Combined Points').trim() : 'Combined Points',
      notes: idx['Notes'] !== undefined ? String(row[idx['Notes']] || '').trim() : ''
    };
  });

  return lookup;
}

function findRuleForWeek_(rules, week) {
  return rules.find(r => week >= r.startWeek && week <= r.endWeek) || null;
}

function headerIndex_(headers) {
  const out = {};
  headers.forEach((h, i) => out[h] = i);
  return out;
}
