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

## Player features — local candidate after the results-only release

The results-only site is already published at commit 3d0af3a and the existing API
is version 17 (prior owner-authorized activation). Do not repeat initial setup or
create another API/hosting project. The following changes are local candidate
source only; the default extension provider still returns null. No upload,
production version change, live player read or Pages activation is authorized by
this development work.

Existing week/overall/prizes builders already provide the needed points, ranks,
completed submitted picks, period definitions, pool overrides and rollover amounts.
The sanitized extension continues using those original context/prize/latest-entry
functions, and now calls the original scoreSubmissionForWeek_ only to confirm
explicitly approved weekly perfect-winner allocations. Original API routes/writers
are not patched again. Existing JSON outputs were live-tested during results-only
activation; this task verifies additional player parity against those actual source
functions with fabricated records, not new live player requests.

Private perfectPick4JsonConfig_ authority (never browser/query configuration):

- aliases: existing records with privateKey, independent public player key, alias,
  approved:true and matching revision. Owner supplies each exact approved label;
  the JSON path preserves PP3: a one-word name as entered, or first name + last initial for multiple words (e.g. invented Avery A.).
  No registry/submitted-name fallback or automatic first-name derivation. These
  examples do not approve any actual entrant. The public alias envelope includes
  only players actually disclosed in validated CLOSED-week picks. The browser also
  rejects unused aliases or mismatched/incorrectly formatted labels.
- closures: existing OWNER_VERIFIED_CLOSURE records with week, snapshotRevision,
  closureRevision, status:CLOSED, verifiedClosed:true, checkedAt, validUntil,
  deadline. Evidence must match the revision and remain within the existing
  120-second freshness limit. Do not automatically renew checkedAt while reading
  static configuration. Form Control's current flag, older weeks and elapsed
  deadlines never create historical authority; OPEN/UPCOMING revokes current-week
  disclosure. The owner must supply an independently verified evidence source or
  accept that a manually verified preview expires. No Form access is added.
- decisions: existing Map or JSON array of {key, snapshotRevision, complete,
  verifiedAt}. Monthly completion authority remains independent of finalized
  scores. The shared resolver handles points-first winners, missing predictions
  and equal-distance unresolved ties; it never changes points/ranks or pays prizes.
- poolStates: existing Map or JSON array of {key, state}, with reviewed scope
  keys and state CONFIRMED or PROJECTED. Amounts come from original prize builders,
  not participant counts or guessed allocations. Unknown money remains unavailable.
- allocationApprovals: optional array of {week, snapshotRevision, verifiedAt,
  approved:true}, fresh within 120 seconds. Together with a confirmed approved pool,
  complete CLOSED scope, approved identities and finalized results, this permits
  original PP3 perfect-week winners/payoutEach to populate allocations. Legacy
  derived winner names/notes are never copied. Inconsistent counts, overallocated
  rounding or invalid amounts fail closed. Allocation is not payment.
- rolloverApprovals: optional array of {week, to, snapshotRevision, verifiedAt,
  approved:true}, where to is the verified monthly period key. Explicit fresh
  approval is required separately from pool approval. Original NEW-rule full-pot,
  finalized no-perfect amount/destination is reconciled by the contract validator.
- accounting: existing Map or JSON array of {key, snapshotRevision, verifiedAt,
  value}; this remains the explicit accounting route when poolStates is absent.
  Do not combine poolStates with unrelated accounting records: poolStates builds
  the whole imported pool projection. Monthly/season allocations and settled
  payments still require independently verified accounting records. PP3's monthly
  zero payout placeholders never authorize a payout or payment confirmation.
- form: existing {url, verified:true, approvedForPlayers:true} requires an actual
  owner-verified canonical player-facing /viewform URL. No verified local published
  URL was established; null keeps Submit Picks disabled. A link is not proof that
  entries are OPEN/CLOSED. Never substitute the administrative Form identifier.

Season totals retain all weeks discovered by the original response-game parser,
not an automatically selected closed-only subset. Any unverified submitted-week
scope withholds its season aggregate rather than misrepresenting partial totals.
Monthly tables retain the existing complete configured-period contract; incomplete
closure/alias evidence withholds the table, and missing completion proof prevents
champion confirmation. Future questions are never fabricated. Accuracy everywhere
uses points / completed submitted FINAL picks; zero completed picks displays an em
dash. Perfect Week additionally needs every scheduled game picked, FINAL and correct.

Minimum remaining activation: owner privately supplies/reviews alias, CLOSED,
completion, allocation/rollover/pool and verified Form-link evidence; separately
approves a privacy-safe player-level parity read and narrowly reviewed extension
update using the current production baseline while preserving unpublished editor
changes. Compare approved weekly/monthly/season totals, shared ranks, predictions,
champions and prize facts privately with original builders. Report discrepancies
as counts, never names/phones/picks. Only after these pass, separately approve
publishing player scopes and the existing api-profile Pages workflow. Current
version 17/results-only Pages continue operating throughout. No OAuth, trigger,
Sheet/Form changes, new platform or custom submission form is needed or authorized.


## Final activation correction / current owner scope

Original toPublicName_ preserves one word, including accents, and abbreviates multiple
words. Policy approval does not approve individual records. registryAliases records
{sourceLabel, player, alias, approved, revision} may replace phone-bearing aliases in
private configuration; exact unique approved labels join to the existing private
registry inside the server. No contact value reaches the response or owner review.

closedAttestations records {week, revision, attestedAt, status, approved} are a new
server-owned authority input. Only Week8 was explicitly attested by the owner. Each
snapshot verifies the current owner-record revision/time and current Form Control
coherence before emitting a finite-lived CLOSED entry; this is verification of an
explicit owner decision, not a claim of a fresh Form-read observation. Reopened,
unknown current control or revoked/unapproved/future/mismatched records fail closed.
Existing cached observations still expire and cannot be renewed implicitly. Weeks1–7
remain unverified, Week9 OPEN, and alias approval/publication remains separately gated.

Original configured periods, complete slates and FINAL results supply monthly completion
when all required privacy/integrity checks pass; explicit owner decision holds override.
Optional explicit seasonWeeks labels coverage rather than silently dropping open weeks.
calculatedOutcomeWeeks authorizes original finalized weekly allocations/NEW rollovers
only for complete CLOSED scopes with approved aliases and confirmed pool authority.
Amounts are reread/reconciled from original computations, never payments or guessed splits.

The frontend can independently link the metadata-verified official player Form without
exposing player records. PP4_PUBLIC_FORM_URL plus
PP4_FORM_PUBLICATION_APPROVAL=APPROVED_OFFICIAL_FORM_V1 enables only that exact canonical
/viewform route in config.js; edit/token URLs fail closed. This adds no fetch origin,
asset, submission handler or production operation. The exact six-file allowlist,
manual develop workflow and integrity checks remain. Original API17 remains results-only
until separately approved; the candidate changes only PerfectPick4_Json, not routing,
manifest, original actions or writers. Unapproved private configuration is not deployable.
