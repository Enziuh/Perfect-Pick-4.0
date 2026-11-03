/*
=================================================================
PERFECT PICK 3.0
TEMP - REBUILD RESULTS FROM ESPN
=================================================================

THIS FILE IS CURRENTLY DISABLED ON PURPOSE.

The rebuild already completed successfully, so these functions are
commented out to prevent accidentally rebuilding the Results sheet.

IF YOU EVER NEED TO RUN THIS AGAIN:

1. Remove the opening comment marker immediately before
   TEMP_rebuildResultsFromESPN().

2. Remove the closing comment marker at the very bottom of this file.

3. Save the Apps Script project.

4. Run:

   TEMP_testEntireESPNSchedule

   first.

5. If the test looks correct, run:

   TEMP_rebuildResultsFromESPN

6. When finished, add the comment markers back again to disable
   this file.

IMPORTANT:
TEMP_rebuildResultsFromESPN creates a backup of the current Results
sheet before rebuilding it.

=================================================================
*/

/*

function TEMP_rebuildResultsFromESPN() {
  const ss = getSpreadsheet_();
  const resultsSheet = ss.getSheetByName(PP3.RESULTS_SHEET);

  if (!resultsSheet) {
    throw new Error('Could not find Results sheet.');
  }

  TEMP_backupResultsSheet_(ss, resultsSheet);

  const allRows = [];

  for (let week = 1; week <= 18; week++) {
    const events = TEMP_fetchESPNWeek_(week);

    Logger.log(
      'Week ' +
      week +
      ': ' +
      events.length +
      ' ESPN events'
    );

    events.forEach(event => {
      const row = TEMP_parseESPNEvent_(event, week);
      if (row) allRows.push(row);
    });

    Utilities.sleep(250);
  }

  if (!allRows.length) {
    throw new Error(
      'ESPN returned zero NFL games. Results sheet was NOT rebuilt.'
    );
  }

  allRows.sort((a, b) => {
    if (a.week !== b.week) {
      return a.week - b.week;
    }

    return (
      new Date(a.eventDate).getTime() -
      new Date(b.eventDate).getTime()
    );
  });

  const headers = [
    'Week',
    'Game',
    'Team 1',
    'Team 2',
    'Winner',
    'Status',
    'Team 1 Score',
    'Team 2 Score',
    'Last Updated',
    'Source',
    'Event ID',
    'Manual Override'
  ];

  const output = allRows.map(game => [
    game.week,
    game.game,
    game.team1,
    game.team2,
    game.winner,
    game.status,
    game.team1Score,
    game.team2Score,
    new Date(),
    'ESPN',
    game.eventId,
    ''
  ]);

  resultsSheet.clearContents();

  resultsSheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  resultsSheet
    .getRange(2, 1, output.length, headers.length)
    .setValues(output);

  resultsSheet.setFrozenRows(1);

  resultsSheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold');

  clearPerfectPick3_0Caches();

  const weekCounts = {};

  allRows.forEach(game => {
    weekCounts[game.week] =
      (weekCounts[game.week] || 0) + 1;
  });

  const result = {
    ok: true,
    source: 'ESPN',
    season: PP3.SEASON,
    gamesWritten: allRows.length,
    weekCounts: weekCounts
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function TEMP_backupResultsSheet_(ss, sourceSheet) {
  const timestamp = Utilities.formatDate(
    new Date(),
    PP3.TIMEZONE || 'America/Los_Angeles',
    'yyyyMMdd-HHmmss'
  );

  let backupName = 'Results Backup ' + timestamp;
  backupName = backupName.substring(0, 99);

  const backup = sourceSheet.copyTo(ss);
  backup.setName(backupName);

  Logger.log('Created backup: ' + backupName);
  return backup;
}

function TEMP_fetchESPNWeek_(week) {
  const url =
    'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' +
    '?dates=' + encodeURIComponent(String(PP3.SEASON)) +
    '&seasontype=2' +
    '&week=' + encodeURIComponent(String(week)) +
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
      'ESPN Week ' +
      week +
      ' request failed. HTTP ' +
      code +
      ': ' +
      response.getContentText().slice(0, 500)
    );
  }

  const json = JSON.parse(response.getContentText());
  return Array.isArray(json.events) ? json.events : [];
}

function TEMP_parseESPNEvent_(event, week) {
  if (!event) return null;

  const competitions = Array.isArray(event.competitions)
    ? event.competitions
    : [];

  if (!competitions.length) return null;

  const competition = competitions[0];
  const competitors = Array.isArray(competition.competitors)
    ? competition.competitors
    : [];

  const home = competitors.find(c => c.homeAway === 'home');
  const away = competitors.find(c => c.homeAway === 'away');

  if (!home || !away) return null;

  const team1 = TEMP_getTeamName_(away);
  const team2 = TEMP_getTeamName_(home);

  if (!team1 || !team2) return null;

  const statusType =
    competition?.status?.type ||
    event?.status?.type ||
    {};

  const status = TEMP_getStatus_(statusType);

  let team1Score = '';
  let team2Score = '';

  if (status === 'Final' || status === 'In Progress') {
    team1Score = TEMP_score_(away.score);
    team2Score = TEMP_score_(home.score);
  }

  let winner = '';

  if (
    status === 'Final' &&
    team1Score !== '' &&
    team2Score !== ''
  ) {
    if (Number(team1Score) > Number(team2Score)) {
      winner = team1;
    } else if (Number(team2Score) > Number(team1Score)) {
      winner = team2;
    } else {
      winner = 'Tie';
    }
  }

  return {
    week: Number(week),
    game: team1 + ' vs ' + team2,
    team1: team1,
    team2: team2,
    winner: winner,
    status: status,
    team1Score: team1Score,
    team2Score: team2Score,
    eventDate: String(event.date || ''),
    eventId: String(event.id || '')
  };
}

function TEMP_getTeamName_(competitor) {
  const team = competitor?.team || {};

  const name = String(team.name || '').trim();
  if (name) return name;

  const shortName = String(team.shortDisplayName || '').trim();
  if (shortName) return shortName;

  return TEMP_teamNameFromAbbreviation_(team.abbreviation);
}

function TEMP_teamNameFromAbbreviation_(abbreviation) {
  const map = {
    ARI: 'Cardinals',
    ATL: 'Falcons',
    BAL: 'Ravens',
    BUF: 'Bills',
    CAR: 'Panthers',
    CHI: 'Bears',
    CIN: 'Bengals',
    CLE: 'Browns',
    DAL: 'Cowboys',
    DEN: 'Broncos',
    DET: 'Lions',
    GB: 'Packers',
    HOU: 'Texans',
    IND: 'Colts',
    JAX: 'Jaguars',
    JAC: 'Jaguars',
    KC: 'Chiefs',
    LV: 'Raiders',
    LAC: 'Chargers',
    LAR: 'Rams',
    LA: 'Rams',
    MIA: 'Dolphins',
    MIN: 'Vikings',
    NE: 'Patriots',
    NO: 'Saints',
    NYG: 'Giants',
    NYJ: 'Jets',
    PHI: 'Eagles',
    PIT: 'Steelers',
    SF: '49ers',
    SEA: 'Seahawks',
    TB: 'Buccaneers',
    TEN: 'Titans',
    WAS: 'Commanders',
    WSH: 'Commanders'
  };

  return (
    map[
      String(abbreviation || '')
        .trim()
        .toUpperCase()
    ] || ''
  );
}

function TEMP_getStatus_(statusType) {
  const completed = Boolean(statusType?.completed);
  const state = String(statusType?.state || '').toLowerCase();
  const name = String(statusType?.name || '').toUpperCase();
  const description = String(
    statusType?.description ||
    statusType?.shortDetail ||
    statusType?.detail ||
    ''
  ).toLowerCase();

  if (
    completed ||
    state === 'post' ||
    name === 'STATUS_FINAL' ||
    description.includes('final')
  ) {
    return 'Final';
  }

  if (state === 'in' || name.includes('IN_PROGRESS')) {
    return 'In Progress';
  }

  if (description.includes('postpon')) return 'Postponed';
  if (description.includes('cancel')) return 'Cancelled';

  return 'Pending';
}

function TEMP_score_(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  const score = Number(value);
  return Number.isFinite(score) ? score : '';
}

function TEMP_testEntireESPNSchedule() {
  const summary = {};
  let total = 0;

  for (let week = 1; week <= 18; week++) {
    const events = TEMP_fetchESPNWeek_(week);

    const valid = events
      .map(event => TEMP_parseESPNEvent_(event, week))
      .filter(Boolean);

    summary['Week ' + week] = valid.length;
    total += valid.length;

    Utilities.sleep(250);
  }

  const result = {
    totalGames: total,
    weeks: summary
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

*/
