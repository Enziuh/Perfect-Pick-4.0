/* =========================================================
   PERFECT PICK 3.0
   ESPN NFL RESULTS
   ========================================================= */

function ensureNFLResultColumns3_0_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.RESULTS_SHEET);

  if (!sheet) {
    throw new Error(`Missing sheet: ${PP3.RESULTS_SHEET}`);
  }

  const required = [
    'Team 1 Score',
    'Team 2 Score',
    'Last Updated',
    'Source',
    'Event ID',
    'Manual Override'
  ];

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getDisplayValues()[0]
    .map(h => String(h || '').trim());

  const missing = required.filter(h => !headers.includes(h));

  if (!missing.length) return;

  sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  sheet.getRange(1, lastCol + 1, 1, missing.length).setFontWeight('bold');
}


function syncNFLResults3_0() {
  ensureNFLResultColumns3_0_();

  const ctx = loadContext_();
  const activeWeek = getActiveWeek_(ctx.games, ctx.resultLookup);
  const result = syncNFLResultsForWeek3_0_(activeWeek, false);

  Logger.log(JSON.stringify(result, null, 2));

  if (result.updatedRows > 0) {
    clearPerfectPick3_0Caches();
  }

  return result;
}


function testNFLWeek3_0(week) {
  ensureNFLResultColumns3_0_();

  const weekNumber = Number(week);

  if (!weekNumber) {
    throw new Error('A valid week number is required.');
  }

  const result = syncNFLResultsForWeek3_0_(weekNumber, true);

  Logger.log(JSON.stringify(result, null, 2));

  return result;
}


function syncNFLWeek3_0(week) {
  ensureNFLResultColumns3_0_();

  const weekNumber = Number(week);

  if (!weekNumber) {
    throw new Error('A valid week number is required.');
  }

  const result = syncNFLResultsForWeek3_0_(weekNumber, false);

  Logger.log(JSON.stringify(result, null, 2));

  if (result.updatedRows > 0) {
    clearPerfectPick3_0Caches();
  }

  return result;
}


function testNFLResults3_0() {
  ensureNFLResultColumns3_0_();

  const ctx = loadContext_();
  const activeWeek = getActiveWeek_(ctx.games, ctx.resultLookup);
  const result = syncNFLResultsForWeek3_0_(activeWeek, true);

  Logger.log(JSON.stringify(result, null, 2));

  return result;
}


function syncNFLResultsForWeek3_0_(week, dryRun) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(PP3.RESULTS_SHEET);

  if (!sheet || sheet.getLastRow() < 2) {
    throw new Error('Results sheet has no game rows.');
  }

  ensureNFLResultColumns3_0_();

  const range = sheet.getRange(
    1,
    1,
    sheet.getLastRow(),
    sheet.getLastColumn()
  );

  const display = range.getDisplayValues();
  const headers = display[0].map(h => String(h || '').trim());
  const idx = headerIndex_(headers);

  const required = [
    'Week',
    'Game',
    'Winner',
    'Status',
    'Team 1 Score',
    'Team 2 Score',
    'Last Updated',
    'Source',
    'Event ID',
    'Manual Override'
  ];

  const missing = required.filter(h => idx[h] === undefined);

  if (missing.length) {
    throw new Error(
      `Results sheet is missing columns: ${missing.join(', ')}`
    );
  }

  const team1Idx = idx['Team 1'];
  const team2Idx = idx['Team 2'];

  const espnEvents = fetchESPNNFLWeek3_0_(week);
  const parsedEvents = espnEvents
    .map(parseESPNNFLEvent3_0_)
    .filter(Boolean);

  const summary = {
    ok: true,
    source: 'ESPN',
    dryRun: Boolean(dryRun),
    week: Number(week),
    espnEventsReturned: espnEvents.length,
    parsedEvents: parsedEvents.length,
    checkedRows: 0,
    matchedRows: 0,
    updatedRows: 0,
    skippedManualRows: 0,
    unmatchedRows: [],
    changes: []
  };

  for (let r = 1; r < display.length; r++) {
    const row = display[r];

    if (Number(row[idx['Week']]) !== Number(week)) {
      continue;
    }

    const gameLabel = String(row[idx['Game']] || '').trim();

    if (!gameLabel) {
      continue;
    }

    summary.checkedRows++;

    if (isManualOverride3_0_(row[idx['Manual Override']])) {
      summary.skippedManualRows++;
      continue;
    }

    let team1 =
      team1Idx !== undefined
        ? String(row[team1Idx] || '').trim()
        : '';

    let team2 =
      team2Idx !== undefined
        ? String(row[team2Idx] || '').trim()
        : '';

    if (!team1 || !team2) {
      const parsed = parseTeamsFromGame3_0_(gameLabel);

      team1 = team1 || parsed.team1;
      team2 = team2 || parsed.team2;
    }

    if (!team1 || !team2) {
      summary.unmatchedRows.push({
        row: r + 1,
        game: gameLabel,
        reason: 'Could not determine both teams.'
      });

      continue;
    }

    const event = findESPNNFLEvent3_0_(
      parsedEvents,
      team1,
      team2
    );

    if (!event) {
      summary.unmatchedRows.push({
        row: r + 1,
        game: gameLabel,
        reason: 'No matching ESPN NFL event found.'
      });

      continue;
    }

    const mapped = mapESPNEventToResult3_0_(
      event,
      team1,
      team2
    );

    if (!mapped) {
      summary.unmatchedRows.push({
        row: r + 1,
        game: gameLabel,
        reason:
          'ESPN event matched but could not be mapped to sheet teams.'
      });

      continue;
    }

    summary.matchedRows++;

    summary.changes.push({
      row: r + 1,
      game: gameLabel,
      eventId: event.eventId,
      espnEvent: event.name,
      team1Score: mapped.team1Score,
      team2Score: mapped.team2Score,
      winner: mapped.winner,
      status: mapped.status,
      espnStatus: event.statusDescription,
      source: 'ESPN'
    });

    if (dryRun) {
      continue;
    }

    const rowNumber = r + 1;

    const existingStatus = String(
      row[idx['Status']] || ''
    ).trim();

    let winnerToWrite = mapped.winner;
    let statusToWrite = mapped.status;

    /*
     * Safety:
     * never downgrade a game already marked Final.
     */
    if (
      existingStatus === 'Final' &&
      mapped.status !== 'Final'
    ) {
      winnerToWrite = String(
        row[idx['Winner']] || ''
      ).trim();

      statusToWrite = 'Final';
    }

    /*
     * Extra protection:
     * the Results sheet only allows Final or Pending.
     */
    statusToWrite =
      statusToWrite === 'Final'
        ? 'Final'
        : 'Pending';

    let changed = false;

    changed =
      setNFLCellIfChanged3_0_(
        sheet,
        rowNumber,
        idx['Team 1 Score'] + 1,
        mapped.team1Score
      ) || changed;

    changed =
      setNFLCellIfChanged3_0_(
        sheet,
        rowNumber,
        idx['Team 2 Score'] + 1,
        mapped.team2Score
      ) || changed;

    changed =
      setNFLCellIfChanged3_0_(
        sheet,
        rowNumber,
        idx['Winner'] + 1,
        winnerToWrite
      ) || changed;

    changed =
      setNFLCellIfChanged3_0_(
        sheet,
        rowNumber,
        idx['Status'] + 1,
        statusToWrite
      ) || changed;

    changed =
      setNFLCellIfChanged3_0_(
        sheet,
        rowNumber,
        idx['Source'] + 1,
        'ESPN'
      ) || changed;

    changed =
      setNFLCellIfChanged3_0_(
        sheet,
        rowNumber,
        idx['Event ID'] + 1,
        event.eventId
      ) || changed;

    if (changed) {
      sheet
        .getRange(
          rowNumber,
          idx['Last Updated'] + 1
        )
        .setValue(new Date());

      summary.updatedRows++;
    }
  }

  if (
    !dryRun &&
    summary.updatedRows > 0
  ) {
    clearPerfectPick3_0Caches();
  }

  return summary;
}


function fetchESPNNFLWeek3_0_(week) {
  const url =
    'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' +
    '?dates=' +
    encodeURIComponent(String(PP3.SEASON)) +
    '&seasontype=2' +
    '&week=' +
    encodeURIComponent(String(week)) +
    '&limit=100';

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      Accept: 'application/json'
    }
  });

  const code = response.getResponseCode();

  if (code < 200 || code >= 300) {
    throw new Error(
      'ESPN NFL request failed (' +
        code +
        '): ' +
        response
          .getContentText()
          .slice(0, 500)
    );
  }

  const text = response.getContentText();

  if (!text) {
    throw new Error(
      'ESPN returned an empty response.'
    );
  }

  const json = JSON.parse(text);

  return Array.isArray(json.events)
    ? json.events
    : [];
}


function parseESPNNFLEvent3_0_(event) {
  if (!event) {
    return null;
  }

  const competitions =
    Array.isArray(event.competitions)
      ? event.competitions
      : [];

  if (!competitions.length) {
    return null;
  }

  const competition = competitions[0];

  const competitors =
    Array.isArray(competition.competitors)
      ? competition.competitors
      : [];

  const home = competitors.find(
    c => c.homeAway === 'home'
  );

  const away = competitors.find(
    c => c.homeAway === 'away'
  );

  if (!home || !away) {
    return null;
  }

  const statusType =
    competition?.status?.type ||
    event?.status?.type ||
    {};

  return {
    eventId: String(
      event.id || ''
    ),

    name: String(
      event.name ||
      event.shortName ||
      ''
    ),

    date: String(
      event.date || ''
    ),

    homeKey:
      normalizeNFLTeamKey3_0_(
        home?.team?.abbreviation ||
        home?.team?.displayName ||
        home?.team?.shortDisplayName ||
        home?.team?.name
      ),

    awayKey:
      normalizeNFLTeamKey3_0_(
        away?.team?.abbreviation ||
        away?.team?.displayName ||
        away?.team?.shortDisplayName ||
        away?.team?.name
      ),

    homeScore:
      parseESPNScore3_0_(
        home.score
      ),

    awayScore:
      parseESPNScore3_0_(
        away.score
      ),

    completed:
      Boolean(
        statusType.completed
      ),

    state:
      String(
        statusType.state || ''
      ).toLowerCase(),

    statusName:
      String(
        statusType.name || ''
      ),

    statusDescription:
      String(
        statusType.description ||
        statusType.shortDetail ||
        statusType.detail ||
        ''
      )
  };
}


function findESPNNFLEvent3_0_(
  events,
  team1,
  team2
) {
  const team1Key =
    normalizeNFLTeamKey3_0_(team1);

  const team2Key =
    normalizeNFLTeamKey3_0_(team2);

  return (
    events.find(
      event =>
        (
          event.homeKey === team1Key &&
          event.awayKey === team2Key
        ) ||
        (
          event.homeKey === team2Key &&
          event.awayKey === team1Key
        )
    ) || null
  );
}


function mapESPNEventToResult3_0_(
  event,
  team1,
  team2
) {
  const team1Key =
    normalizeNFLTeamKey3_0_(team1);

  const team2Key =
    normalizeNFLTeamKey3_0_(team2);

  let team1Score = '';
  let team2Score = '';

  if (
    event.homeKey === team1Key &&
    event.awayKey === team2Key
  ) {
    team1Score = event.homeScore;
    team2Score = event.awayScore;

  } else if (
    event.homeKey === team2Key &&
    event.awayKey === team1Key
  ) {
    team1Score = event.awayScore;
    team2Score = event.homeScore;

  } else {
    return null;
  }

  const status =
    espnStatusToSheet3_0_(event);

  /*
   * Only final games should retain scores.
   * Pending includes scheduled, in-progress,
   * postponed and cancelled games.
   */
  if (status !== 'Final') {
    team1Score = '';
    team2Score = '';
  }

  let winner = '';

  if (
    status === 'Final' &&
    team1Score !== '' &&
    team2Score !== ''
  ) {
    if (
      Number(team1Score) >
      Number(team2Score)
    ) {
      winner = team1;

    } else if (
      Number(team2Score) >
      Number(team1Score)
    ) {
      winner = team2;

    } else {
      winner = 'Tie';
    }
  }

  return {
    team1Score,
    team2Score,
    winner,
    status
  };
}


/*
 * Results sheet accepts only:
 *
 *   Final
 *   Pending
 *
 * ESPN can return many more states,
 * including in-progress, postponed,
 * delayed and cancelled. Those remain
 * Pending in Perfect Pick until final.
 */
function espnStatusToSheet3_0_(event) {
  if (!event) {
    return 'Pending';
  }

  const description = String(
    event.statusDescription || ''
  ).toLowerCase();

  const statusName = String(
    event.statusName || ''
  ).toUpperCase();

  if (
    event.completed ||
    event.state === 'post' ||
    statusName === 'STATUS_FINAL' ||
    description.includes('final')
  ) {
    return 'Final';
  }

  return 'Pending';
}


function parseESPNScore3_0_(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : '';
}


function setNFLCellIfChanged3_0_(
  sheet,
  row,
  column,
  value
) {
  const cell =
    sheet.getRange(
      row,
      column
    );

  const existing =
    cell.getValue();

  const same =
    String(existing ?? '') ===
    String(value ?? '');

  if (same) {
    return false;
  }

  cell.setValue(value);

  return true;
}


function normalizeNFLTeamKey3_0_(team) {
  const raw = String(team || '')
    .trim()
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ');

  if (!raw) {
    return '';
  }

  const aliases =
    nflTeamAliasMap3_0_();

  if (aliases[raw]) {
    return aliases[raw];
  }

  const last =
    raw.split(' ').pop();

  return aliases[last] || '';
}


function nflTeamAliasMap3_0_() {
  const map = {};

  Object.entries(
    nflTeamMap3_0_()
  ).forEach(([key, info]) => {
    map[key] = key;

    map[
      info.full.toLowerCase()
    ] = key;

    map[
      info.nick.toLowerCase()
    ] = key;

    map[
      info.abbr.toLowerCase()
    ] = key;
  });

  map['ari'] = 'cardinals';
  map['atl'] = 'falcons';
  map['bal'] = 'ravens';
  map['buf'] = 'bills';
  map['car'] = 'panthers';
  map['chi'] = 'bears';
  map['cin'] = 'bengals';
  map['cle'] = 'browns';
  map['dal'] = 'cowboys';
  map['den'] = 'broncos';
  map['det'] = 'lions';
  map['gb'] = 'packers';
  map['hou'] = 'texans';
  map['ind'] = 'colts';
  map['jax'] = 'jaguars';
  map['jac'] = 'jaguars';
  map['kc'] = 'chiefs';
  map['lv'] = 'raiders';
  map['lac'] = 'chargers';
  map['la chargers'] = 'chargers';
  map['lar'] = 'rams';
  map['la'] = 'rams';
  map['la rams'] = 'rams';
  map['mia'] = 'dolphins';
  map['min'] = 'vikings';
  map['ne'] = 'patriots';
  map['no'] = 'saints';
  map['nyg'] = 'giants';
  map['nyj'] = 'jets';
  map['phi'] = 'eagles';
  map['pit'] = 'steelers';
  map['sf'] = '49ers';
  map['sfo'] = '49ers';
  map['san francisco'] = '49ers';
  map['niners'] = '49ers';
  map['sea'] = 'seahawks';
  map['tb'] = 'buccaneers';
  map['bucs'] = 'buccaneers';
  map['ten'] = 'titans';
  map['was'] = 'commanders';
  map['wsh'] = 'commanders';
  map['washington'] = 'commanders';

  return map;
}


function nflTeamMap3_0_() {
  return {
    cardinals: {
      full: 'Arizona Cardinals',
      nick: 'Cardinals',
      abbr: 'ARI'
    },

    falcons: {
      full: 'Atlanta Falcons',
      nick: 'Falcons',
      abbr: 'ATL'
    },

    ravens: {
      full: 'Baltimore Ravens',
      nick: 'Ravens',
      abbr: 'BAL'
    },

    bills: {
      full: 'Buffalo Bills',
      nick: 'Bills',
      abbr: 'BUF'
    },

    panthers: {
      full: 'Carolina Panthers',
      nick: 'Panthers',
      abbr: 'CAR'
    },

    bears: {
      full: 'Chicago Bears',
      nick: 'Bears',
      abbr: 'CHI'
    },

    bengals: {
      full: 'Cincinnati Bengals',
      nick: 'Bengals',
      abbr: 'CIN'
    },

    browns: {
      full: 'Cleveland Browns',
      nick: 'Browns',
      abbr: 'CLE'
    },

    cowboys: {
      full: 'Dallas Cowboys',
      nick: 'Cowboys',
      abbr: 'DAL'
    },

    broncos: {
      full: 'Denver Broncos',
      nick: 'Broncos',
      abbr: 'DEN'
    },

    lions: {
      full: 'Detroit Lions',
      nick: 'Lions',
      abbr: 'DET'
    },

    packers: {
      full: 'Green Bay Packers',
      nick: 'Packers',
      abbr: 'GB'
    },

    texans: {
      full: 'Houston Texans',
      nick: 'Texans',
      abbr: 'HOU'
    },

    colts: {
      full: 'Indianapolis Colts',
      nick: 'Colts',
      abbr: 'IND'
    },

    jaguars: {
      full: 'Jacksonville Jaguars',
      nick: 'Jaguars',
      abbr: 'JAX'
    },

    chiefs: {
      full: 'Kansas City Chiefs',
      nick: 'Chiefs',
      abbr: 'KC'
    },

    raiders: {
      full: 'Las Vegas Raiders',
      nick: 'Raiders',
      abbr: 'LV'
    },

    chargers: {
      full: 'Los Angeles Chargers',
      nick: 'Chargers',
      abbr: 'LAC'
    },

    rams: {
      full: 'Los Angeles Rams',
      nick: 'Rams',
      abbr: 'LAR'
    },

    dolphins: {
      full: 'Miami Dolphins',
      nick: 'Dolphins',
      abbr: 'MIA'
    },

    vikings: {
      full: 'Minnesota Vikings',
      nick: 'Vikings',
      abbr: 'MIN'
    },

    patriots: {
      full: 'New England Patriots',
      nick: 'Patriots',
      abbr: 'NE'
    },

    saints: {
      full: 'New Orleans Saints',
      nick: 'Saints',
      abbr: 'NO'
    },

    giants: {
      full: 'New York Giants',
      nick: 'Giants',
      abbr: 'NYG'
    },

    jets: {
      full: 'New York Jets',
      nick: 'Jets',
      abbr: 'NYJ'
    },

    eagles: {
      full: 'Philadelphia Eagles',
      nick: 'Eagles',
      abbr: 'PHI'
    },

    steelers: {
      full: 'Pittsburgh Steelers',
      nick: 'Steelers',
      abbr: 'PIT'
    },

    '49ers': {
      full: 'San Francisco 49ers',
      nick: '49ers',
      abbr: 'SF'
    },

    seahawks: {
      full: 'Seattle Seahawks',
      nick: 'Seahawks',
      abbr: 'SEA'
    },

    buccaneers: {
      full: 'Tampa Bay Buccaneers',
      nick: 'Buccaneers',
      abbr: 'TB'
    },

    titans: {
      full: 'Tennessee Titans',
      nick: 'Titans',
      abbr: 'TEN'
    },

    commanders: {
      full: 'Washington Commanders',
      nick: 'Commanders',
      abbr: 'WSH'
    }
  };
}


function parseTeamsFromGame3_0_(game) {
  const parts = String(
    game || ''
  ).split(
    /\s+vs\.?\s+/i
  );

  return {
    team1: String(
      parts[0] || ''
    ).trim(),

    team2: String(
      parts[1] || ''
    ).trim()
  };
}


function isManualOverride3_0_(value) {
  return [
    'YES',
    'Y',
    'TRUE',
    '1',
    'LOCK',
    'LOCKED'
  ].includes(
    String(value || '')
      .trim()
      .toUpperCase()
  );
}