/* =========================================================
   ACTIVE WEEK / RANKS
   ========================================================= */

function getActiveWeek_(games, resultLookup) {
  const weeks = [
    ...new Set(
      games.map(g => g.week)
    )
  ].sort((a, b) => a - b);

  for (const week of weeks) {
    const weekGames = games.filter(g => g.week === week);

    if (!weekGames.length) continue;

    const allFinal = weekGames.every(game => {
      const result = resultLookup[week]?.[normalizeGame_(game.game)] || null;

      return (
        result &&
        normalizeText_(result.status) === 'final'
      );
    });

    if (!allFinal) {
      return week;
    }
  }

  return weeks.length ? weeks[weeks.length - 1] : 1;
}

function addRanks_(standings) {
  let previousPoints = null;
  let previousRank = 0;

  return standings.map((player, index) => {
    const rank =
      previousPoints !== null && player.points === previousPoints
        ? previousRank
        : index + 1;

    previousPoints = player.points;
    previousRank = rank;

    return {
      ...player,
      rank
    };
  });
}

/* =========================================================
   CACHE
   ========================================================= */

function clearPerfectPick3_0Caches() {
  const cache = CacheService.getScriptCache();

  cache.remove(`pp3:summary:${PP3.SEASON}`);
  cache.remove(`pp3:overall:${PP3.SEASON}`);
  cache.remove(`pp3:prizes:${PP3.SEASON}`);

  for (let week = 1; week <= 18; week++) {
    cache.remove(`pp3:week:${PP3.SEASON}:${week}`);
  }
}

function rebuildPerfectPick3_0Caches() {
  clearPerfectPick3_0Caches();

  buildSummary_();
  buildOverall_();
  buildPrizeDashboard_();
}

function handleFormSubmit3_0_(e) {
  clearPerfectPick3_0Caches();
}

function handleSpreadsheetEdit3_0_(e) {
  const sheetName = e?.range?.getSheet()?.getName();

  if (
    [
      PP3.RESULTS_SHEET,
      PP3.PLAYERS_SHEET,
      PP3.RULES_SHEET,
      PP3.WEEKLY_PRIZE_SHEET,
      PP3.TIEBREAK_RULES_SHEET,
      PP3.FORM_CONTROL_SHEET
    ].includes(sheetName)
  ) {
    clearPerfectPick3_0Caches();
  }
}

/* =========================================================
   TRIGGERS
   ========================================================= */

function setupTriggers3_0() {
  const ss = getSpreadsheet_();

  const managed = new Set([
    'handleFormSubmit3_0_',
    'handleSpreadsheetEdit3_0_',
    'rebuildPerfectPick3_0Caches',
    'syncNFLResults3_0'
  ]);

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (managed.has(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp
    .newTrigger('handleFormSubmit3_0_')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  ScriptApp
    .newTrigger('handleSpreadsheetEdit3_0_')
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  [6, 12, 18, 23].forEach(hour => {
    ScriptApp
      .newTrigger('rebuildPerfectPick3_0Caches')
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();
  });

  [
    [ScriptApp.WeekDay.THURSDAY, 22],
    [ScriptApp.WeekDay.SUNDAY, 14],
    [ScriptApp.WeekDay.SUNDAY, 18],
    [ScriptApp.WeekDay.SUNDAY, 22],
    [ScriptApp.WeekDay.MONDAY, 22],
    [ScriptApp.WeekDay.TUESDAY, 7]
  ].forEach(([day, hour]) => {
    ScriptApp
      .newTrigger('syncNFLResults3_0')
      .timeBased()
      .onWeekDay(day)
      .atHour(hour)
      .everyWeeks(1)
      .inTimezone(PP3.TIMEZONE)
      .create();
  });
}

/* =========================================================
   TESTS
   ========================================================= */

function testPerfectPick3_0Connection() {
  const ss = getSpreadsheet_();
  Logger.log(`Connected to: ${ss.getName()} (${ss.getId()})`);
}

function testPerfectPick3_0Prizes() {
  Logger.log(JSON.stringify(buildPrizeDashboard_(), null, 2));
}

function testPerfectPick3_0Week1() {
  Logger.log(JSON.stringify(buildWeek_(1), null, 2));
}

function testPerfectPick3_0MonthlyPayouts() {
  const data = buildPrizeDashboard_();

  const current = (data.periods || []).find(
    p => p.periodKey === data.currentPeriod
  );

  if (!current) {
    throw new Error('Current prize period not found.');
  }

  const result = {
    period: current.displayName,
    monthlyWinnerPool: current.monthlyWinnerPool,
    standings: current.standings,
    estimatedMonthlyWinnings: current.estimatedMonthlyWinnings
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/* =========================================================
   PRIVACY + HELPERS
   ========================================================= */

function toPublicName_(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'Player';
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function assertNoForbiddenKeys_(value, path = 'root') {
  const forbidden = new Set([
    'phone',
    'phonenumber',
    'phone_number',
    'email',
    'emailaddress',
    'email_address',
    'timestamp',
    'response',
    'rawresponse',
    'formresponse',
    'responseid',
    'privateid',
    'sheetid',
    'spreadsheetid'
  ]);

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoForbiddenKeys_(item, `${path}[${index}]`)
    );
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      if (forbidden.has(String(key).toLowerCase())) {
        throw new Error(`Privacy check failed: forbidden field ${path}.${key}`);
      }

      assertNoForbiddenKeys_(child, `${path}.${key}`);
    });
  }
}

function normalizeGame_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s+vs\.?\s+/g, ' vs ');
}

function normalizePhone_(value) {
  let phone = String(value || '').replace(/\D/g, '');

  if (phone.length === 11 && phone.startsWith('1')) {
    phone = phone.substring(1);
  }

  return phone;
}

function normalizeTeam_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .pop();
}

function normalizeText_(value) {
  return String(value || '').trim().toLowerCase();
}

function parseTimestamp_(value) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

function numberOr_(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalNumber_(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function yesNo_(value) {
  return ['YES', 'Y', 'TRUE', '1'].includes(
    String(value || '').trim().toUpperCase()
  );
}

function roundMoney_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getCachedOrBuild_(key, ttlSeconds, builder) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const second = cache.get(key);

    if (second) {
      return JSON.parse(second);
    }

    const data = builder();
    assertNoForbiddenKeys_(data);

    const json = JSON.stringify(data);

    if (json.length < 95000) {
      cache.put(key, json, ttlSeconds);
    }

    return data;
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
   ESPN BACKFILL
   ========================================================= */

function getESPNCurrentNFLWeek3_0_() {
  const url =
    'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' +
    '?dates=' + encodeURIComponent(String(PP3.SEASON)) +
    '&seasontype=2' +
    '&limit=100';

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { Accept: 'application/json' }
  });

  const code = response.getResponseCode();

  if (code < 200 || code >= 300) {
    throw new Error(
      'ESPN current-week request failed (' +
      code +
      '): ' +
      response.getContentText().slice(0, 500)
    );
  }

  const json = JSON.parse(response.getContentText() || '{}');
  const week = Number(json?.week?.number || 0);

  if (week >= 1 && week <= 18) {
    return week;
  }

  const ctx = loadContext_();
  const submittedWeeks = getWeeksSubmittedFromResponses3_0_(ctx.responses, ctx.games);

  if (submittedWeeks.length) {
    return Math.max(...submittedWeeks);
  }

  return 1;
}

function getWeeksSubmittedFromResponses3_0_(responses, games) {
  const weeks = new Set();

  responses.forEach(response => {
    getWeeksSubmitted_(response, games).forEach(week => weeks.add(week));
  });

  return [...weeks];
}

function backfillAllNFLResults3_0() {
  const throughWeek = getESPNCurrentNFLWeek3_0_();
  const results = [];

  for (let week = 1; week <= throughWeek; week++) {
    results.push(syncNFLResultsForWeek3_0_(week, false));
  }

  clearPerfectPick3_0Caches();

  const summary = {
    ok: true,
    source: 'ESPN',
    throughWeek,
    weeks: results
  };

  Logger.log(JSON.stringify(summary, null, 2));
  return summary;
}

function runBackfillAllNFLResults() {
  return backfillAllNFLResults3_0();
}

function testNFLWeek1() {
  return testNFLWeek3_0(1);
}

function testNFLWeek2() {
  return testNFLWeek3_0(2);
}

function testNFLWeek3() {
  return testNFLWeek3_0(3);
}

function syncNFLWeek1() {
  return syncNFLWeek3_0(1);
}

function syncNFLWeek2() {
  return syncNFLWeek3_0(2);
}

function syncNFLWeek3() {
  return syncNFLWeek3_0(3);
}

function backfillNFLWeeks1And2() {
  const week1 = syncNFLWeek3_0(1);
  const week2 = syncNFLWeek3_0(2);

  const result = { week1, week2 };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
