# GitHub Pages + existing Apps Script JSON API

Final hosting is GitHub Pages. The owner-only HtmlService deployment remains a
private testing reference, not the final site. No replacement Sheet, Form,
identity registry, scoring automation, hosting service or backend project is needed.

## Existing contract, verified from source and the baseline frontend

`apps-script/src/00_Config_Setup.js:50` routes `doGet` through ContentService JSON:
- `?action=health`: ok, app, season, generatedAt.
- `?action=summary` (also default): season, activeWeek, formControl, period/pot
  summaries, generatedAt. Cached 120 seconds.
- `?action=week&week=N`: season, week, games, results, outcome, tiebreak, standings.
  Results have game/team1/team2/winner/status/team1Score/team2Score. Standings
  have rank/name/points/completedGames/totalPicks/perfectWeek/picks and tiebreak
  fields. Cached 120 seconds. Week is a required numeric parameter.
- `?action=overall`: season and standings (rank/name/points/completedGames/totalPicks).
  Cached 180 seconds.
- `?action=prizes`: season/activeWeek/formControl, current-period summaries,
  weekly pot/outcome rows, periods with monthly standings and tiebreak rules,
  overallStandings and season pool totals. Cached 120 seconds.

The original main-branch frontend calls `prizes` once and `week&week=N` lazily,
using a week Promise cache and fetch GET/no-store. Score/form/edit handlers already
invalidate those server caches; existing scheduled 3.0 writers remain untouched.
`assertNoForbiddenKeys_` explicitly excludes contact/raw-response/private-ID keys.
The existing API is not presumed unsafe or broken. Specific source-contract gaps
against the separately approved 4.0 requirements are:
- `10_Prizes_Scoring.js:274`: weekly picks are returned without an explicit CLOSED
  check. Prediction disclosure at :450 also accepts older weeks/passed deadlines.
  Frontend hiding cannot undo delivery to a browser. No actual production response
  or actual disclosure was queried during this task.
- :380 and `40_Cache_Helpers.js:163`: registry/submitted-name fallback derives a
  display name automatically, rather than proving owner approval of an alias.
- `20_Data.js:57` discovers only already-created response questions; Results has
  the full schedule, so future games need the existing result lookup too.
- Prize dashboard computes pools/rollovers, not a confirmed monthly champion or
  settled monthly payment. Missing scores remain blank, never zero.

## Implemented compatible addition

`tools/api/json-extension.cjs` generates **one disabled** `PerfectPick4_Json.gs`
extension, using the existing context, latest-submission and prize builders.
`apps-script/extensions/PP4_JSON_ROUTE.patch` adds **one** `dashboard4` branch to
`doGet`. All existing branches/responses/caches remain byte-for-byte intact after
removing that branch. The route fails unavailable if the extension is absent.
The original src files have deliberately not been patched or uploaded automatically.

The extension reuses the existing 4.0 projector/validator/monthly resolver. Its
strict `PP4_JSON_V1` envelope contains only snapshot, approved public aliases,
activeWeek, strictly allowlisted deadline/game/status context, and a validated optional player-facing Form link. No contacts, raw
responses, Sheet/Script IDs, free-text questions/notes, internal keys or payment
assumptions. Unknown/unverified closure never reveals picks/predictions/votes.
Reported Form Control status provides context only; it never grants CLOSED disclosure.
An unapproved entrant withholds the affected scope rather than showing zero votes.
FINAL-only scores, normalized private phone/week latest selection, perfect-week
requirements, shared ranks and points-first combined-score tiebreak rules remain.
Equal prediction distances stay unresolved; missing predictions are ineligible;
points/ranks never change to choose a champion. Accounting is approved separately.

The Pages API profile uses the existing five-destination app with a replacement
`preview-data.js` JSON transport. It validates before rendering, shares/coalesces
one snapshot across destinations, expires data at 120 seconds, clears stale/private
DOM on failures, has a 20-second request timeout, supports manual/return-to-tab
refresh and six-hour refresh. Snapshot expiry can refresh sooner. No localStorage,
query-string endpoint switch, JSONP, credential-bearing fetch or raw legacy fallback.
It uses only the reviewed fixed `?action=dashboard4` URL and Google's JSON redirect
origin. CORS/runtime still requires verification after an authorized API update.

## Minimum activation (NOT performed)

1. Owner approves this narrow extension of the **existing 3.0 JSON API**. Run
   `node tools/api/json-extension.cjs` locally; review the generated ignored
   `tmp/json-api-extension/PerfectPick4_Json.gs` and the checked-in route patch.
   Add that single file and route branch to the actual existing API project;
   retain all existing files, manifest, Sheet/Form links and writer triggers.
   Do not use the current clasp target: it points to the separate owner-only 4.0
   reference project. Do not bulk-upload `apps-script/src` or execute setup/sync.
2. Privately edit the added `perfectPick4JsonConfig_` provider in that API editor:

```js
return {
  enabled: true,
  publicationApproved: true, // only after explicit approval of results publication
  revision: 1,
  authority: null,
  form: null
};
```

   This results-only mode reads the existing context/Results/prize-period structure,
   but publishes no player standings/picks/voting or unsupported accounting. No
   Sheet identifier or new scopes are needed: reuse existing PP3 configuration.
   Approved player/accounting authority follows the existing owner-evidence shapes
   in LIVE_DATA_CONTRACT_V1.md. Alias/closure decisions must not be fabricated or
   automatically renewed; stale/missing proof withholds data. Authority includes
   approved alias records, explicit independently verified weekly CLOSED evidence,
   verified monthly completion decisions and optional scope-approved poolStates.
   Source revision and evidence must agree; freshness is 120 seconds. A future
   automatic authority source requires separate verification, not deadline inference.
3. After approval, update the **existing** JSON deployment/version, retaining its
   existing URL/access/execution model and writer operations. Do not create another
   deployment/platform. Verify only the sanitized action, JSON Content-Type/CORS,
   approved Results output, no protected fields and correctness against 3.0.
4. Owner separately authorizes Pages publication. Configure the repository variable
   `PP4_PUBLIC_API_URL` with the reviewed existing public /exec URL and
   `PP4_API_PUBLICATION_APPROVAL=APPROVED_PUBLIC_API_V1`. A public API URL is routing
   information, observable by design; it must never contain a token/private Sheet
   or Script ID. No actual endpoint is committed. Select `profile: api` in the
   manual develop-only Pages workflow. It runs all offline/browser checks first,
   builds the exact six-file reviewed profile, scans/seals it and verifies the
   unchanged artifact before upload. Missing approval/configuration fails closed.
   No API request or runtime rebuild occurs in deployment. Use GitHub environment
   required owner review for publishing. Default profile remains synthetic rollback.

No upload, deployment, production request, repository-variable update or GitHub
setting change was performed. Original 3.0 and the owner reference deployment are
unchanged. Real end-to-end scores cannot be certified before approved activation.
