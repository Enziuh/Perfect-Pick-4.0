/* =========================================================
   PERFECT PICK 3.0
   50_Form_Weekly_Setup.gs
   =========================================================

   WEEKLY WORKFLOW
   ---------------------------------------------------------
   1) checkWeekN()
   2) previewWeekN()
   3) setupWeekN()

   setupWeekN() will:
   - refuse to run if that week already exists
   - read games from Results in exact row order
   - find the first NFL kickoff from ESPN
   - set picks deadline = first kickoff - 3 hours
   - create the weekly section and required matchup questions
   - add a required combined-points tiebreaker on W4/W8/W12/W16/W18
   - route Section 1 to the new week
   - open the form
   - store active-week/deadline state
   - create/update the Form Control sheet
   - create one one-time close trigger
   - verify the setup

   IMPORTANT
   ---------------------------------------------------------
   - Add choice images manually after generation.
   - Do not use Google Forms native expiration.
   - This file expects getSpreadsheet_() to exist in the main
     Perfect Pick Apps Script project.
   ========================================================= */

const PP_WEEKLY_FORM = {
  RESULTS_SHEET: 'Results',
  FORM_CONTROL_SHEET: 'Form Control',
  MIN_WEEK: 4,
  MAX_WEEK: 18,
  NFL_SEASON: 2026,
  ESPN_SEASON_TYPE: 2,
  DEADLINE_HOURS_BEFORE_KICKOFF: 1,
  TIME_ZONE: 'America/Los_Angeles',
  TIEBREAK_WEEKS: [4, 8, 12, 16, 18],
  ESPN_URL: 'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  CLOSE_TRIGGER_FUNCTION: 'PP_closeFormAtDeadline_',
  ITEM_DELAY_MS: 750,
  FORM_RETRY_ATTEMPTS: 4,
  FORM_RETRY_BASE_DELAY_MS: 1500,
  CLOSED_MESSAGE: 'Perfect Pick entries for this week are closed.',
  TIEBREAKER_DESCRIPTION:
    'Enter the total combined points you think both teams will score. Required for all players; only used if there is a tie for 1st place at the end of the prize period.'
};


function PP_retryFormOperation_(fn, label) {
  const maxAttempts = PP_WEEKLY_FORM.FORM_RETRY_ATTEMPTS;
  const baseDelay = PP_WEEKLY_FORM.FORM_RETRY_BASE_DELAY_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      const message = String(
        error && error.message ? error.message : error
      );

      const retryable =
        message.includes('Failed to edit the form') ||
        message.includes('Service invoked too many times') ||
        message.includes('Internal error') ||
        message.includes('Temporary');

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const waitMs = baseDelay * attempt;

      Logger.log(
        (label || 'Google Forms operation') +
        ' failed on attempt ' +
        attempt +
        '/' +
        maxAttempts +
        ': ' +
        message +
        '. Retrying in ' +
        waitMs +
        ' ms.'
      );

      Utilities.sleep(waitMs);
    }
  }

  throw new Error((label || 'Google Forms operation') + ' failed after retries.');
}

function PP_retryFormRead_(fn, label) {
  return PP_retryFormOperation_(fn, label || 'Google Forms read');
}

function setupPerfectPickWeek(week) {
  const weekNumber = Number(week);
  PP_validateWeekNumber_(weekNumber);

  Logger.log('=========================================');
  Logger.log('STARTING WEEK ' + weekNumber + ' SETUP');
  Logger.log('=========================================');

  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);

  // Remove any legacy test-close trigger before touching the live form.
  PP_cleanupLegacyTestCloseTriggers_();

  Logger.log('Step 1/10 — Checking for existing Week ' + weekNumber + '...');
  PP_assertWeekDoesNotExist_(form, weekNumber);
  Logger.log('Duplicate check passed.');

  Logger.log('Step 2/10 — Reading Week ' + weekNumber + ' from Results...');
  const games = PP_getGamesForWeek_(ss, weekNumber);
  if (!games.length) {
    throw new Error('STOPPED — No games found in Results for Week ' + weekNumber + '. Nothing was created.');
  }
  Logger.log('Found ' + games.length + ' games.');

  Logger.log('Step 3/10 — Checking ESPN kickoff schedule...');
  const kickoffInfo = PP_getFirstKickoffForWeek_(weekNumber, games);
  const deadline = new Date(
    kickoffInfo.firstKickoff.getTime() -
      PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF * 60 * 60 * 1000
  );

  Logger.log('First game: ' + kickoffInfo.firstGame);
  Logger.log('First kickoff: ' + PP_formatDateTime_(kickoffInfo.firstKickoff));
  Logger.log('Picks close: ' + PP_formatDateTime_(deadline));

  if (deadline.getTime() <= Date.now()) {
    throw new Error(
      'STOPPED — Week ' + weekNumber + ' deadline has already passed: ' +
      PP_formatDateTime_(deadline) + '. Nothing was created.'
    );
  }

  Logger.log('Step 4/10 — Creating Week ' + weekNumber + ' section and questions...');
  const weekSection = PP_retryFormOperation_(
    function () {
      return form.addPageBreakItem();
    },
    'Create Week ' + weekNumber + ' section'
  );

  PP_retryFormOperation_(
    function () {
      weekSection.setTitle('Week ' + weekNumber);
    },
    'Set Week ' + weekNumber + ' section title'
  );

  // PageBreak navigation applies to the page BEFORE this page break.
  // This prevents the previous weekly section from flowing into the new week.
  PP_retryFormOperation_(
    function () {
      weekSection.setGoToPage(FormApp.PageNavigationType.SUBMIT);
    },
    'Set Week ' + weekNumber + ' section navigation'
  );
  Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);

  games.forEach(function (game, index) {
    const title = 'W' + weekNumber + ' | ' + game.game;
    const question = PP_retryFormOperation_(
      function () {
        return form.addMultipleChoiceItem();
      },
      'Create Week ' + weekNumber + ' game question ' + (index + 1)
    );

    PP_retryFormOperation_(
      function () {
        question.setTitle(title);
      },
      'Set title for Week ' + weekNumber + ' game question ' + (index + 1)
    );

    PP_retryFormOperation_(
      function () {
        question.setChoices([
          question.createChoice(game.team1),
          question.createChoice(game.team2)
        ]);
      },
      'Set choices for Week ' + weekNumber + ' game question ' + (index + 1)
    );

    PP_retryFormOperation_(
      function () {
        question.setRequired(true);
      },
      'Require Week ' + weekNumber + ' game question ' + (index + 1)
    );

    Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);

    const storedTitle = String(
      PP_retryFormRead_(
        function () {
          return question.getTitle();
        },
        'Verify title for Week ' + weekNumber + ' game question ' + (index + 1)
      ) || ''
    ).trim();
    if (storedTitle !== title) {
      throw new Error(
        'Week ' + weekNumber + ' creation stopped while creating game ' +
        (index + 1) + '. Expected title "' + title +
        '" but Google Forms returned "' + storedTitle + '".'
      );
    }
  });

  let tiebreakTitle = '';
  if (PP_WEEKLY_FORM.TIEBREAK_WEEKS.includes(weekNumber)) {
    const finalGame = games[games.length - 1];
    tiebreakTitle = PP_addTiebreakQuestion_(form, weekNumber, finalGame);
    Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);
  }
  Logger.log('Week ' + weekNumber + ' questions created.');

  Logger.log('Step 5/10 — Verifying Week ' + weekNumber + ' form content...');
  const contentCheck = PP_verifyWeekContent_(form, weekNumber, games.length);
  if (!contentCheck.ok) {
    throw new Error(
      'Week ' + weekNumber + ' content verification failed: ' +
      contentCheck.problems.join(' | ')
    );
  }
  Logger.log('Week content verified: ' + contentCheck.gameQuestions + ' game questions.');

  Logger.log('Step 6/10 — Routing Section 1 to Week ' + weekNumber + '...');
  PP_routeSection1ToWeek_(form, weekSection);
  Logger.log('Section 1 now routes to Week ' + weekNumber + '.');

  Logger.log('Step 7/10 — Opening form...');
  PP_openForm_(form);
  if (!form.isAcceptingResponses()) {
    throw new Error('Week ' + weekNumber + ' was created, but the Google Form is not accepting responses.');
  }
  Logger.log('Form is accepting responses.');

  Logger.log('Step 8/10 — Saving active-week information...');
  PropertiesService.getScriptProperties().setProperties({
    PP_ACTIVE_WEEK: String(weekNumber),
    PP_FIRST_GAME: kickoffInfo.firstGame,
    PP_FIRST_KICKOFF_ISO: kickoffInfo.firstKickoff.toISOString(),
    PP_DEADLINE_ISO: deadline.toISOString(),
    PP_FORM_STATUS: 'OPEN'
  });

  Logger.log('Step 9/10 — Creating/updating Form Control...');
  PP_writeFormControl_(ss, {
    week: weekNumber,
    section: 'Week ' + weekNumber,
    firstGame: kickoffInfo.firstGame,
    firstKickoff: kickoffInfo.firstKickoff,
    deadline: deadline,
    status: 'OPEN'
  });
  Logger.log('Form Control updated.');

  Logger.log('Step 10/10 — Creating close trigger...');
  PP_replaceCloseTrigger_(deadline);
  Logger.log('Close trigger created.');
  PP_refreshPublicCaches_();

  const verification = PP_verifyAutomation_(ss, form, weekNumber, deadline);
  if (!verification.ok) {
    throw new Error(
      'Week ' + weekNumber + ' was created, but automation verification failed: ' +
      verification.problems.join(' | ')
    );
  }

  const result = {
    ok: true,
    week: weekNumber,
    gamesCreated: games.length,
    tiebreakCreated: Boolean(tiebreakTitle),
    tiebreakTitle: tiebreakTitle,
    firstGame: kickoffInfo.firstGame,
    firstKickoff: PP_formatDateTime_(kickoffInfo.firstKickoff),
    picksClose: PP_formatDateTime_(deadline),
    deadlineRule: PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF + ' hours before first kickoff',
    formAcceptingResponses: PP_retryFormRead_(
      function () {
        return form.isAcceptingResponses();
      },
      'Read form accepting-responses state'
    ),
    formControlCreated: true,
    closeTriggerCreated: true,
    section1RoutesTo: 'Week ' + weekNumber,
    verified: true
  };

  Logger.log('=========================================');
  Logger.log('WEEK ' + weekNumber + ' SETUP COMPLETE');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('=========================================');
  return result;
}

function PP_openForm_(form) {
  try {
    if (
      typeof form.supportsAdvancedResponderPermissions === 'function' &&
      PP_retryFormRead_(
        function () {
          return form.supportsAdvancedResponderPermissions();
        },
        'Check advanced responder permissions'
      ) &&
      typeof form.isPublished === 'function' &&
      typeof form.setPublished === 'function' &&
      !PP_retryFormRead_(
        function () {
          return form.isPublished();
        },
        'Check form publish state'
      )
    ) {
      PP_retryFormOperation_(
        function () {
          form.setPublished(true);
        },
        'Publish Google Form'
      );

      Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);
    }
  } catch (error) {
    Logger.log('Publish-state check skipped: ' + error.message);
  }

  PP_retryFormOperation_(
    function () {
      form.setAcceptingResponses(true);
    },
    'Open Google Form for responses'
  );

  Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);

  const accepting = PP_retryFormRead_(
    function () {
      return form.isAcceptingResponses();
    },
    'Verify Google Form is accepting responses'
  );

  if (!accepting) {
    throw new Error('Google Form could not be opened for responses.');
  }
}

function PP_closeFormAtDeadline_() {
  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);
  const properties = PropertiesService.getScriptProperties();
  const activeWeek = Number(properties.getProperty('PP_ACTIVE_WEEK'));
  const deadlineIso = properties.getProperty('PP_DEADLINE_ISO');

  if (!deadlineIso) {
    throw new Error('No Perfect Pick deadline is currently stored.');
  }

  const deadline = new Date(deadlineIso);
  const now = new Date();

  if (now.getTime() < deadline.getTime()) {
    Logger.log('Close trigger fired before the stored deadline. Form remains open.');
    return;
  }

  PP_retryFormOperation_(
    function () {
      form.setAcceptingResponses(false);
    },
    'Close Google Form at deadline'
  );

  Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);

  if (
    PP_retryFormRead_(
      function () {
        return form.isAcceptingResponses();
      },
      'Verify Google Form is closed'
    )
  ) {
    throw new Error('Attempted to close the Google Form, but it is still accepting responses.');
  }

  try {
    PP_retryFormOperation_(
      function () {
        form.setCustomClosedFormMessage(
          'Week ' + activeWeek + ' picks are closed. The deadline was ' +
          PP_formatDateTime_(deadline) + '.'
        );
      },
      'Set closed-form message for Week ' + activeWeek
    );
  } catch (error) {
    Logger.log('Form closed successfully, but custom closed message could not be updated: ' + error.message);
  }

  properties.setProperty('PP_FORM_STATUS', 'CLOSED');
  PP_updateFormControlStatus_(ss, 'CLOSED');
  PP_refreshPublicCaches_();
  Logger.log(
    'Week ' + activeWeek + ' form closed successfully at ' +
    PP_formatDateTime_(now)
  );
}

function PP_assertWeekDoesNotExist_(form, week) {
  const found = [];
  const sectionRegex = new RegExp('^Week\\s+' + week + '$', 'i');
  const gameRegex = new RegExp('^W' + week + '\\s*\\|', 'i');
  const tieRegex = new RegExp('^WK\\s*' + week + '\\s+Tie\\s*Breaker', 'i');

  form.getItems().forEach(function (item) {
    const title = String(item.getTitle() || '').trim();
    if (sectionRegex.test(title) || gameRegex.test(title) || tieRegex.test(title)) {
      found.push(title || '[UNTITLED ITEM]');
    }
  });

  if (found.length) {
    throw new Error(
      'STOPPED — Week ' + week + ' already exists in the Google Form. ' +
      'Nothing was changed. Found: ' + found.slice(0, 8).join(' | ')
    );
  }
}

function PP_getGamesForWeek_(ss, week) {
  const sheet = ss.getSheetByName(PP_WEEKLY_FORM.RESULTS_SHEET);
  if (!sheet) throw new Error('Results sheet was not found.');
  if (sheet.getLastRow() < 2) throw new Error('Results sheet contains no games.');

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(function (value) { return String(value || '').trim(); });
  const weekCol = headers.indexOf('Week');
  const gameCol = headers.indexOf('Game');
  const team1Col = headers.indexOf('Team 1');
  const team2Col = headers.indexOf('Team 2');

  if (weekCol === -1 || gameCol === -1 || team1Col === -1 || team2Col === -1) {
    throw new Error('Results must contain Week, Game, Team 1, and Team 2 columns.');
  }

  const games = [];
  values.slice(1).forEach(function (row, index) {
    if (Number(row[weekCol]) !== week) return;

    const game = String(row[gameCol] || '').trim();
    const team1 = String(row[team1Col] || '').trim();
    const team2 = String(row[team2Col] || '').trim();

    if (!game || !team1 || !team2) {
      throw new Error(
        'Invalid Results information on row ' + (index + 2) +
        ' for Week ' + week + '.'
      );
    }

    games.push({
      row: index + 2,
      game: game,
      team1: team1,
      team2: team2
    });
  });

  return games;
}

function PP_getFirstKickoffForWeek_(week, resultsGames) {
  const url =
    PP_WEEKLY_FORM.ESPN_URL +
    '?dates=' + PP_WEEKLY_FORM.NFL_SEASON +
    '&seasontype=' + PP_WEEKLY_FORM.ESPN_SEASON_TYPE +
    '&week=' + week;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const responseCode = response.getResponseCode();
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('ESPN request failed for Week ' + week + '. HTTP ' + responseCode + '.');
  }

  const data = JSON.parse(response.getContentText());
  const events = Array.isArray(data.events) ? data.events : [];
  if (!events.length) throw new Error('ESPN returned no games for Week ' + week + '.');

  const expectedMatchups = new Map();
  resultsGames.forEach(function (game) {
    expectedMatchups.set(PP_makeMatchupKey_(game.team1, game.team2), game);
  });

  const matchedEvents = [];
  events.forEach(function (event) {
    if (!event || !event.date) return;
    const competition = event.competitions && event.competitions[0];
    if (!competition || !Array.isArray(competition.competitors)) return;

    const teams = competition.competitors
      .map(function (competitor) {
        const team = competitor.team || {};
        return team.displayName || team.shortDisplayName || team.name || '';
      })
      .filter(Boolean);

    if (teams.length !== 2) return;

    const matchupKey = PP_makeMatchupKey_(teams[0], teams[1]);
    const resultGame = expectedMatchups.get(matchupKey);
    if (!resultGame) return;

    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) return;

    matchedEvents.push({
      date: eventDate,
      game: resultGame.game,
      eventId: String(event.id || '')
    });
  });

  if (matchedEvents.length !== resultsGames.length) {
    throw new Error(
      'ESPN/Results validation failed for Week ' + week +
      '. Results has ' + resultsGames.length +
      ' games but ESPN matched ' + matchedEvents.length +
      '. Nothing was changed.'
    );
  }

  matchedEvents.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
  const earliest = matchedEvents[0];
  return {
    firstKickoff: earliest.date,
    firstGame: earliest.game,
    eventId: earliest.eventId,
    matchedGames: matchedEvents.length
  };
}

function PP_normalizeTeamName_(value) {
  const raw = String(value || '').trim().toLowerCase();
  const aliases = {
    'arizona cardinals': 'cardinals',
    'atlanta falcons': 'falcons',
    'baltimore ravens': 'ravens',
    'buffalo bills': 'bills',
    'carolina panthers': 'panthers',
    'chicago bears': 'bears',
    'cincinnati bengals': 'bengals',
    'cleveland browns': 'browns',
    'dallas cowboys': 'cowboys',
    'denver broncos': 'broncos',
    'detroit lions': 'lions',
    'green bay packers': 'packers',
    'houston texans': 'texans',
    'indianapolis colts': 'colts',
    'jacksonville jaguars': 'jaguars',
    'kansas city chiefs': 'chiefs',
    'las vegas raiders': 'raiders',
    'los angeles chargers': 'chargers',
    'los angeles rams': 'rams',
    'miami dolphins': 'dolphins',
    'minnesota vikings': 'vikings',
    'new england patriots': 'patriots',
    'new orleans saints': 'saints',
    'new york giants': 'giants',
    'new york jets': 'jets',
    'philadelphia eagles': 'eagles',
    'pittsburgh steelers': 'steelers',
    'san francisco 49ers': '49ers',
    'seattle seahawks': 'seahawks',
    'tampa bay buccaneers': 'buccaneers',
    'tennessee titans': 'titans',
    'washington commanders': 'commanders'
  };
  return aliases[raw] || raw;
}

function PP_makeMatchupKey_(teamA, teamB) {
  return [PP_normalizeTeamName_(teamA), PP_normalizeTeamName_(teamB)]
    .sort()
    .join('|');
}

function PP_addTiebreakQuestion_(form, week, finalGame) {
  const title =
    'WK ' + week + ' Tie Breaker — ' +
    finalGame.team1 + ' vs ' + finalGame.team2 +
    ' — Total Combined Points';

  const question = PP_retryFormOperation_(
    function () {
      return form.addTextItem();
    },
    'Create Week ' + week + ' tiebreaker'
  );

  PP_retryFormOperation_(
    function () {
      question.setTitle(title);
    },
    'Set Week ' + week + ' tiebreaker title'
  );

  PP_retryFormOperation_(
    function () {
      question.setHelpText(PP_WEEKLY_FORM.TIEBREAKER_DESCRIPTION);
    },
    'Set Week ' + week + ' tiebreaker help text'
  );

  PP_retryFormOperation_(
    function () {
      question.setRequired(true);
    },
    'Require Week ' + week + ' tiebreaker'
  );

  const validation = FormApp.createTextValidation()
    .requireNumber()
    .setHelpText('Enter the total points only. Example: if you predict 27-24, enter 51.')
    .build();

  PP_retryFormOperation_(
    function () {
      question.setValidation(validation);
    },
    'Set Week ' + week + ' tiebreaker validation'
  );

  if (
    String(
      PP_retryFormRead_(
        function () {
          return question.getTitle();
        },
        'Verify Week ' + week + ' tiebreaker title'
      ) || ''
    ).trim() !== title
  ) {
    throw new Error('Tiebreaker question was created but its title could not be verified.');
  }
  return title;
}

function PP_verifyWeekContent_(form, week, expectedGameCount) {
  let sectionCount = 0;
  let gameQuestionCount = 0;
  let tiebreakCount = 0;
  const untitledItems = [];
  const sectionRegex = new RegExp('^Week\\s+' + week + '$', 'i');
  const gameRegex = new RegExp('^W' + week + '\\s*\\|', 'i');
  const tieRegex = new RegExp('^WK\\s*' + week + '\\s+Tie\\s*Breaker', 'i');

  form.getItems().forEach(function (item, index) {
    const title = String(item.getTitle() || '').trim();
    if (sectionRegex.test(title)) sectionCount++;
    if (gameRegex.test(title)) gameQuestionCount++;
    if (tieRegex.test(title)) tiebreakCount++;
    if (
      !title &&
      (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE ||
       item.getType() === FormApp.ItemType.TEXT)
    ) {
      untitledItems.push(index);
    }
  });

  const problems = [];
  if (sectionCount !== 1) {
    problems.push('Expected 1 Week ' + week + ' section; found ' + sectionCount + '.');
  }
  if (gameQuestionCount !== expectedGameCount) {
    problems.push(
      'Expected ' + expectedGameCount + ' Week ' + week +
      ' matchup questions; found ' + gameQuestionCount + '.'
    );
  }

  const shouldHaveTiebreak = PP_WEEKLY_FORM.TIEBREAK_WEEKS.includes(week);
  if (shouldHaveTiebreak && tiebreakCount !== 1) {
    problems.push('Expected 1 tiebreaker; found ' + tiebreakCount + '.');
  }
  if (!shouldHaveTiebreak && tiebreakCount !== 0) {
    problems.push('Unexpected tiebreaker found.');
  }
  if (untitledItems.length) {
    problems.push('Untitled question items were found at form indexes: ' + untitledItems.join(', '));
  }

  return {
    ok: problems.length === 0,
    sectionCount: sectionCount,
    gameQuestions: gameQuestionCount,
    tiebreakCount: tiebreakCount,
    untitledItems: untitledItems,
    problems: problems
  };
}

function PP_routeSection1ToWeek_(form, targetWeekSection) {
  const pageBreaks = form.getItems(FormApp.ItemType.PAGE_BREAK);
  if (!pageBreaks.length) {
    throw new Error('No page-break sections were found in the Google Form.');
  }

  // The first page break begins Week 1 and controls routing after Section 1.
  const week1PageBreak = pageBreaks[0].asPageBreakItem();

  PP_retryFormOperation_(
    function () {
      week1PageBreak.setGoToPage(targetWeekSection);
    },
    'Route Section 1 to active week'
  );
}

function PP_writeFormControl_(ss, data) {
  let sheet = ss.getSheetByName(PP_WEEKLY_FORM.FORM_CONTROL_SHEET);
  if (!sheet) sheet = ss.insertSheet(PP_WEEKLY_FORM.FORM_CONTROL_SHEET);

  const headers = [[
    'Active Week',
    'Section',
    'First Game',
    'First Kickoff',
    'Picks Close',
    'Status',
    'Deadline Rule',
    'Updated'
  ]];

  const row = [[
    data.week,
    data.section,
    data.firstGame,
    data.firstKickoff,
    data.deadline,
    data.status,
    PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF + ' hours before first kickoff',
    new Date()
  ]];

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(2, 1, 1, row[0].length).setValues(row);
  sheet.getRange(2, 4, 1, 2).setNumberFormat('ddd, mmm d, yyyy h:mm AM/PM');
  sheet.getRange(2, 8).setNumberFormat('mmm d, yyyy h:mm:ss AM/PM');
  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();

  const storedWeek = Number(sheet.getRange(2, 1).getValue());
  if (storedWeek !== Number(data.week)) {
    throw new Error('Form Control verification failed after writing Week ' + data.week + '.');
  }
}

function PP_updateFormControlStatus_(ss, status) {
  const sheet = ss.getSheetByName(PP_WEEKLY_FORM.FORM_CONTROL_SHEET);
  if (!sheet) throw new Error('Form Control sheet does not exist.');
  sheet.getRange(2, 6).setValue(status);
  sheet.getRange(2, 8).setValue(new Date());
  SpreadsheetApp.flush();
}

function PP_replaceCloseTrigger_(deadline) {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === PP_WEEKLY_FORM.CLOSE_TRIGGER_FUNCTION) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  return ScriptApp.newTrigger(PP_WEEKLY_FORM.CLOSE_TRIGGER_FUNCTION)
    .timeBased()
    .at(deadline)
    .create();
}

function PP_verifyAutomation_(ss, form, week, deadline) {
  const problems = [];
  const acceptingResponses = PP_retryFormRead_(
    function () {
      return form.isAcceptingResponses();
    },
    'Verify form accepting-responses state'
  );

  if (!acceptingResponses) problems.push('Form is not accepting responses.');

  const controlSheet = ss.getSheetByName(PP_WEEKLY_FORM.FORM_CONTROL_SHEET);
  if (!controlSheet) {
    problems.push('Form Control sheet is missing.');
  } else {
    const storedWeek = Number(controlSheet.getRange(2, 1).getValue());
    const storedDeadline = controlSheet.getRange(2, 5).getValue();
    const storedStatus = String(controlSheet.getRange(2, 6).getValue() || '').trim();

    if (storedWeek !== week) problems.push('Form Control Active Week is incorrect.');
    if (!(storedDeadline instanceof Date) || isNaN(storedDeadline.getTime())) {
      problems.push('Form Control deadline is missing or invalid.');
    } else if (Math.abs(storedDeadline.getTime() - deadline.getTime()) > 1000) {
      problems.push('Form Control deadline does not match calculated deadline.');
    }
    if (storedStatus !== 'OPEN') problems.push('Form Control status is not OPEN.');
  }

  const closeTriggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === PP_WEEKLY_FORM.CLOSE_TRIGGER_FUNCTION;
  });
  if (closeTriggers.length !== 1) {
    problems.push('Expected exactly 1 close trigger; found ' + closeTriggers.length + '.');
  }

  const properties = PropertiesService.getScriptProperties();
  if (Number(properties.getProperty('PP_ACTIVE_WEEK')) !== week) {
    problems.push('Stored active week is incorrect.');
  }
  if (properties.getProperty('PP_DEADLINE_ISO') !== deadline.toISOString()) {
    problems.push('Stored deadline is incorrect.');
  }
  if (properties.getProperty('PP_FORM_STATUS') !== 'OPEN') {
    problems.push('Stored form status is not OPEN.');
  }

  return {
    ok: problems.length === 0,
    problems: problems,
    closeTriggerCount: closeTriggers.length
  };
}

function previewPerfectPickWeek(week) {
  const weekNumber = Number(week);
  PP_validateWeekNumber_(weekNumber);

  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);
  PP_assertWeekDoesNotExist_(form, weekNumber);

  const games = PP_getGamesForWeek_(ss, weekNumber);
  const kickoffInfo = PP_getFirstKickoffForWeek_(weekNumber, games);
  const deadline = new Date(
    kickoffInfo.firstKickoff.getTime() -
      PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF * 60 * 60 * 1000
  );

  const result = {
    week: weekNumber,
    games: games.map(function (game) { return 'W' + weekNumber + ' | ' + game.game; }),
    gameCount: games.length,
    firstGame: kickoffInfo.firstGame,
    firstKickoff: PP_formatDateTime_(kickoffInfo.firstKickoff),
    picksClose: PP_formatDateTime_(deadline),
    deadlineRule: '3 hours before first kickoff',
    tiebreak: PP_WEEKLY_FORM.TIEBREAK_WEEKS.includes(weekNumber),
    willCreateFormControl: true,
    willCreateCloseTrigger: true
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function checkPerfectPickWeek(week) {
  const weekNumber = Number(week);
  PP_validateWeekNumber_(weekNumber);
  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);

  const matches = [];
  const sectionRegex = new RegExp('^Week\\s+' + weekNumber + '$', 'i');
  const gameRegex = new RegExp('^W' + weekNumber + '\\s*\\|', 'i');
  const tieRegex = new RegExp('^WK\\s*' + weekNumber + '\\s+Tie\\s*Breaker', 'i');

  form.getItems().forEach(function (item) {
    const title = String(item.getTitle() || '').trim();
    if (sectionRegex.test(title) || gameRegex.test(title) || tieRegex.test(title)) {
      matches.push({ type: String(item.getType()), title: title });
    }
  });

  const result = {
    week: weekNumber,
    exists: matches.length > 0,
    matchingItems: matches.length,
    items: matches
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function PP_checkAutomationStatus() {
  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);
  const properties = PropertiesService.getScriptProperties();
  const sheet = ss.getSheetByName(PP_WEEKLY_FORM.FORM_CONTROL_SHEET);
  const closeTriggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === PP_WEEKLY_FORM.CLOSE_TRIGGER_FUNCTION;
  });

  const result = {
    formAcceptingResponses: PP_retryFormRead_(
      function () {
        return form.isAcceptingResponses();
      },
      'Check automation form status'
    ),
    activeWeek: properties.getProperty('PP_ACTIVE_WEEK') || '',
    firstGame: properties.getProperty('PP_FIRST_GAME') || '',
    firstKickoff: PP_formatIsoProperty_(properties.getProperty('PP_FIRST_KICKOFF_ISO')),
    picksClose: PP_formatIsoProperty_(properties.getProperty('PP_DEADLINE_ISO')),
    storedStatus: properties.getProperty('PP_FORM_STATUS') || '',
    formControlSheetExists: Boolean(sheet),
    closeTriggerCount: closeTriggers.length
  };

  if (sheet) {
    result.formControl = {
      activeWeek: sheet.getRange(2, 1).getDisplayValue(),
      section: sheet.getRange(2, 2).getDisplayValue(),
      firstGame: sheet.getRange(2, 3).getDisplayValue(),
      firstKickoff: sheet.getRange(2, 4).getDisplayValue(),
      picksClose: sheet.getRange(2, 5).getDisplayValue(),
      status: sheet.getRange(2, 6).getDisplayValue()
    };
  }

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function PP_forceOpenForm() {
  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);
  PP_openForm_(form);

  if (
    !PP_retryFormRead_(
      function () {
        return form.isAcceptingResponses();
      },
      'Verify manually opened form'
    )
  ) {
    throw new Error('Google Form is still not accepting responses.');
  }

  PropertiesService.getScriptProperties().setProperty('PP_FORM_STATUS', 'OPEN');
  if (ss.getSheetByName(PP_WEEKLY_FORM.FORM_CONTROL_SHEET)) {
    PP_updateFormControlStatus_(ss, 'OPEN');
  }
  PP_refreshPublicCaches_();
  Logger.log('Perfect Pick form manually opened.');
}

function PP_forceCloseForm() {
  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);
  PP_retryFormOperation_(
    function () {
      form.setAcceptingResponses(false);
    },
    'Manually close Google Form'
  );

  Utilities.sleep(PP_WEEKLY_FORM.ITEM_DELAY_MS);

  if (
    PP_retryFormRead_(
      function () {
        return form.isAcceptingResponses();
      },
      'Verify manually closed form'
    )
  ) {
    throw new Error('Google Form is still accepting responses.');
  }

  try {
    PP_retryFormOperation_(
      function () {
        form.setCustomClosedFormMessage('Perfect Pick entries are currently closed.');
      },
      'Set manual closed-form message'
    );
  } catch (error) {
    Logger.log('Form closed, but custom message could not be updated: ' + error.message);
  }

  PropertiesService.getScriptProperties().setProperty('PP_FORM_STATUS', 'CLOSED');
  if (ss.getSheetByName(PP_WEEKLY_FORM.FORM_CONTROL_SHEET)) {
    PP_updateFormControlStatus_(ss, 'CLOSED');
  }
  PP_refreshPublicCaches_();
  Logger.log('Perfect Pick form manually closed.');
}

function PP_refreshPublicCaches_() {
  if (typeof clearPerfectPick3_0Caches === 'function') {
    clearPerfectPick3_0Caches();
  }
}

function PP_getLinkedForm_(ss) {
  const formUrl = ss.getFormUrl();
  if (!formUrl) {
    throw new Error('This spreadsheet does not appear to have a linked Google Form.');
  }
  return FormApp.openByUrl(formUrl);
}

function PP_validateWeekNumber_(week) {
  if (
    !Number.isInteger(week) ||
    week < PP_WEEKLY_FORM.MIN_WEEK ||
    week > PP_WEEKLY_FORM.MAX_WEEK
  ) {
    throw new Error(
      'Week must be a whole number between ' +
      PP_WEEKLY_FORM.MIN_WEEK + ' and ' + PP_WEEKLY_FORM.MAX_WEEK + '.'
    );
  }
}

function PP_formatDateTime_(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  return Utilities.formatDate(
    date,
    PP_WEEKLY_FORM.TIME_ZONE,
    'EEE, MMM d, yyyy h:mm a z'
  );
}

function PP_formatIsoProperty_(value) {
  if (!value) return '';
  return PP_formatDateTime_(new Date(value));
}

function PP_listCurrentFormSections() {
  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);
  const sections = form.getItems(FormApp.ItemType.PAGE_BREAK).map(function (item, index) {
    const pageBreak = item.asPageBreakItem();
    let navigation = '';
    try {
      navigation = String(pageBreak.getPageNavigationType());
    } catch (error) {
      navigation = 'Unable to read';
    }
    return {
      section: index + 2,
      title: pageBreak.getTitle(),
      navigation: navigation
    };
  });
  Logger.log(JSON.stringify(sections, null, 2));
  return sections;
}

/* =========================================================
   TRIGGER SAFETY / DIAGNOSTICS
   ---------------------------------------------------------
   Legacy PP_testCloseForm_ triggers are no longer used because
   they could close the live form without updating Form Control
   or PP_FORM_STATUS.
   ========================================================= */

function PP_cleanupLegacyTestCloseTriggers_() {
  let removed = 0;

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'PP_testCloseForm_') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  if (removed > 0) {
    Logger.log('Removed ' + removed + ' legacy PP_testCloseForm_ trigger(s).');
  }

  return removed;
}

function PP_cleanupLegacyTestCloseTriggers() {
  const removed = PP_cleanupLegacyTestCloseTriggers_();
  Logger.log(JSON.stringify({ ok: true, removedLegacyTestCloseTriggers: removed }, null, 2));
  return removed;
}

function PP_debugAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  const result = triggers.map(function (trigger) {
    return {
      handlerFunction: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType()),
      triggerSource: String(trigger.getTriggerSource()),
      uniqueId: trigger.getUniqueId()
    };
  });

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/* =========================================================
   WRAPPERS
   ========================================================= */

function setupWeek4()  { return setupPerfectPickWeek(4); }
function setupWeek5()  { return setupPerfectPickWeek(5); }
function setupWeek6()  { return setupPerfectPickWeek(6); }
function setupWeek7()  { return setupPerfectPickWeek(7); }
function setupWeek8()  { return setupPerfectPickWeek(8); }
function setupWeek9()  { return setupPerfectPickWeek(9); }
function setupWeek10() { return setupPerfectPickWeek(10); }
function setupWeek11() { return setupPerfectPickWeek(11); }
function setupWeek12() { return setupPerfectPickWeek(12); }
function setupWeek13() { return setupPerfectPickWeek(13); }
function setupWeek14() { return setupPerfectPickWeek(14); }
function setupWeek15() { return setupPerfectPickWeek(15); }
function setupWeek16() { return setupPerfectPickWeek(16); }
function setupWeek17() { return setupPerfectPickWeek(17); }
function setupWeek18() { return setupPerfectPickWeek(18); }

function previewWeek4()  { return previewPerfectPickWeek(4); }
function previewWeek5()  { return previewPerfectPickWeek(5); }
function previewWeek6()  { return previewPerfectPickWeek(6); }
function previewWeek7()  { return previewPerfectPickWeek(7); }
function previewWeek8()  { return previewPerfectPickWeek(8); }
function previewWeek9()  { return previewPerfectPickWeek(9); }
function previewWeek10() { return previewPerfectPickWeek(10); }
function previewWeek11() { return previewPerfectPickWeek(11); }
function previewWeek12() { return previewPerfectPickWeek(12); }
function previewWeek13() { return previewPerfectPickWeek(13); }
function previewWeek14() { return previewPerfectPickWeek(14); }
function previewWeek15() { return previewPerfectPickWeek(15); }
function previewWeek16() { return previewPerfectPickWeek(16); }
function previewWeek17() { return previewPerfectPickWeek(17); }
function previewWeek18() { return previewPerfectPickWeek(18); }

function checkWeek4()  { return checkPerfectPickWeek(4); }
function checkWeek5()  { return checkPerfectPickWeek(5); }
function checkWeek6()  { return checkPerfectPickWeek(6); }
function checkWeek7()  { return checkPerfectPickWeek(7); }
function checkWeek8()  { return checkPerfectPickWeek(8); }
function checkWeek9()  { return checkPerfectPickWeek(9); }
function checkWeek10() { return checkPerfectPickWeek(10); }
function checkWeek11() { return checkPerfectPickWeek(11); }
function checkWeek12() { return checkPerfectPickWeek(12); }
function checkWeek13() { return checkPerfectPickWeek(13); }
function checkWeek14() { return checkPerfectPickWeek(14); }
function checkWeek15() { return checkPerfectPickWeek(15); }
function checkWeek16() { return checkPerfectPickWeek(16); }
function checkWeek17() { return checkPerfectPickWeek(17); }
function checkWeek18() { return checkPerfectPickWeek(18); }




function repairWeek7Automation() {
  const weekNumber = 7;

  const ss = getSpreadsheet_();
  const form = PP_getLinkedForm_(ss);

  // Remove any legacy test-close trigger before repairing live automation.
  PP_cleanupLegacyTestCloseTriggers_();

  Logger.log('=========================================');
  Logger.log('REPAIRING WEEK ' + weekNumber + ' AUTOMATION');
  Logger.log('=========================================');

  // 1. Read the existing Week 7 games from Results.
  const games = PP_getGamesForWeek_(ss, weekNumber);

  if (!games.length) {
    throw new Error(
      'No Week ' + weekNumber + ' games were found in Results.'
    );
  }

  Logger.log('Found ' + games.length + ' Week ' + weekNumber + ' games.');

  // 2. Confirm the Week 7 form section already exists.
  const pageBreaks = form.getItems(FormApp.ItemType.PAGE_BREAK);

  let weekSection = null;

  pageBreaks.forEach(function(item) {
    const pageBreak = item.asPageBreakItem();
    const title = String(pageBreak.getTitle() || '').trim();

    if (title === 'Week ' + weekNumber) {
      weekSection = pageBreak;
    }
  });

  if (!weekSection) {
    throw new Error(
      'Week ' + weekNumber + ' section was not found in the Google Form.'
    );
  }

  Logger.log('Week ' + weekNumber + ' form section found.');

  // 3. Get Week 7 kickoff information from ESPN.
  const kickoffInfo = PP_getFirstKickoffForWeek_(
    weekNumber,
    games
  );

  const deadline = new Date(
    kickoffInfo.firstKickoff.getTime() -
    PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF *
      60 *
      60 *
      1000
  );

  Logger.log(
    'First game: ' +
    kickoffInfo.firstGame
  );

  Logger.log(
    'First kickoff: ' +
    PP_formatDateTime_(kickoffInfo.firstKickoff)
  );

  Logger.log(
    'Picks close: ' +
    PP_formatDateTime_(deadline)
  );

  // 4. Route Section 1 into the existing Week 7 section.
  PP_routeSection1ToWeek_(
    form,
    weekSection
  );

  Logger.log(
    'Section 1 now routes to Week ' +
    weekNumber +
    '.'
  );

  // 5. Determine whether Week 7 should currently be open.
  const now = new Date();
  const shouldBeOpen =
    now.getTime() < deadline.getTime();

  if (shouldBeOpen) {
    PP_openForm_(form);
  } else {
    PP_retryFormOperation_(
      function () {
        form.setAcceptingResponses(false);
      },
      'Repair Week ' + weekNumber + ': close form'
    );

    try {
      PP_retryFormOperation_(
        function () {
          form.setCustomClosedFormMessage(
        'Week ' +
        weekNumber +
        ' picks are closed. The deadline was ' +
        PP_formatDateTime_(deadline) +
        '.'
          );
        },
        'Repair Week ' + weekNumber + ': set closed-form message'
      );
    } catch (error) {
      Logger.log(
        'Could not update closed-form message: ' +
        error.message
      );
    }
  }

  const status =
    shouldBeOpen
      ? 'OPEN'
      : 'CLOSED';

  Logger.log(
    'Correct form status: ' +
    status
  );

  // 6. Repair Script Properties.
  PropertiesService
    .getScriptProperties()
    .setProperties({
      PP_ACTIVE_WEEK:
        String(weekNumber),

      PP_FIRST_GAME:
        kickoffInfo.firstGame,

      PP_FIRST_KICKOFF_ISO:
        kickoffInfo.firstKickoff.toISOString(),

      PP_DEADLINE_ISO:
        deadline.toISOString(),

      PP_FORM_STATUS:
        status
    });

  Logger.log(
    'Script Properties updated to Week ' +
    weekNumber +
    '.'
  );

  // 7. Rewrite Form Control.
  PP_writeFormControl_(
    ss,
    {
      week: weekNumber,
      section: 'Week ' + weekNumber,
      firstGame: kickoffInfo.firstGame,
      firstKickoff: kickoffInfo.firstKickoff,
      deadline: deadline,
      status: status
    }
  );

  Logger.log(
    'Form Control updated to Week ' +
    weekNumber +
    '.'
  );

  // 8. Remove the old close trigger.
  ScriptApp
    .getProjectTriggers()
    .forEach(function(trigger) {
      if (
        trigger.getHandlerFunction() ===
        PP_WEEKLY_FORM.CLOSE_TRIGGER_FUNCTION
      ) {
        ScriptApp.deleteTrigger(trigger);
      }
    });

  // 9. Create a new close trigger only if the deadline is still ahead.
  if (shouldBeOpen) {
    PP_replaceCloseTrigger_(deadline);

    Logger.log(
      'New Week ' +
      weekNumber +
      ' close trigger created.'
    );
  } else {
    Logger.log(
      'Week ' +
      weekNumber +
      ' deadline has already passed, so no close trigger was created.'
    );
  }

  // 10. Clear website/API caches.
  PP_refreshPublicCaches_();

  SpreadsheetApp.flush();

  const result = {
    ok: true,
    week: weekNumber,
    games: games.length,
    firstGame: kickoffInfo.firstGame,
    firstKickoff:
      PP_formatDateTime_(
        kickoffInfo.firstKickoff
      ),
    picksClose:
      PP_formatDateTime_(
        deadline
      ),
    status: status,
    formAcceptingResponses:
      PP_retryFormRead_(
        function () {
          return form.isAcceptingResponses();
        },
        'Repair Week ' + weekNumber + ': verify form status'
      ),
    section1RoutesTo:
      'Week ' + weekNumber
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  Logger.log(
    '========================================='
  );

  Logger.log(
    'WEEK ' +
    weekNumber +
    ' AUTOMATION REPAIR COMPLETE'
  );

  Logger.log(
    '========================================='
  );

  return result;
}
