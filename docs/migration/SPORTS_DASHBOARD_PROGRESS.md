# Sports dashboard redesign checkpoint

## Scope and rollback

Branch: develop. Starting checkpoint b8e6c4f; last published implementation/rollback
frontend:6fad89d. Production API18 is unchanged and is NOT part of this frontend release.
No Apps Script/Sheet/Form/trigger/scoring/alias/prize calculation edits or execution.

## Implemented

- Navy #0B1425, elevated #17263D cards, gold #F5C451; compact score cards,
  responsive five-destination navigation, accessible focus and system fonts.
- Overview prioritizes official entry window/Submit Picks, verified top-three weekly
  or covered-season leaders (including shared ranks), estimated pools, upcoming games,
  recent finals and shared monthly champion status. No invented facts/records/kickoffs.
- Match Center: local team artwork/abbreviations, scores, team-color winner accents,
  FINAL/LIVE/pending labels, compact voting, correct/incorrect selections and predictions.
- Standings retain semantic tables, shared ranks, submitted-FINAL accuracy and champion
  logic; compact ranking rows with gold/silver/bronze accents, no mobile podium.
- Prizes retain original calculations and23-participant estimate labels; no payments.
- Fixed loading failure paths: previously one failed request immediately erased valid
  data and made further ordinary requests fail until explicit refresh; expiry also
  cleared the display before starting a replacement fetch. Now three20-second bounded
  attempts with400/1200ms backoff, request coalescing, proactive pre-expiry refresh,
  non-disruptive degraded status/manual retry and filter retention. Expired disclosure
  still clears all player data/champions; no stale privacy evidence is extended.

## Assets / exact publication change

Copied ONLY32 owner-supplied SVGs, originals untouched. All32 had suitable SVGs; no PNG
fallback/download/dependency needed. Removed XML/title/data metadata; converted local
class styles to presentation attributes, retaining paths/viewBox/clip geometry/colors
and transparent backgrounds. Strict SVG validator rejects active/unknown elements,
external resources, events/entities/links and unresolved fragment references.

Exact reviewed allowlist now38 files: original six frontend/fixture files PLUS32
assets/teams/{lowercase abbreviation}.svg, no broad directory publishing. Both synthetic
and API profile staging/seals/scans use this same explicit inventory. Historical backend
exclusion tests now assert38 and retain their exclusions; tests decode all32 real SVGs.

Source basename → canonical filename (all from owner's supplied SVG folder):

ARI cardinals; ATL falcons; BAL ravens; BUF bills; CAR panthers; CHI bears;
CIN bengals; CLE browns; DAL cowboys; DEN broncos; DET lions; GB packers;
HOU texans; IND colts; JAX jaguars; KC chiefs; LAC chargers; LAR rams;
LV raiders; MIA dolphins; MIN vikings; NE patriots; NO saints; NYG giants;
NYJ jets; PHI eagles; PIT steelers; SEA seahawks; SF49ers; TB buccaneers;
TEN titans; WAS commanders. Alternate bills2/bengals2 and NFL shield were not copied.
Paths are relative assets/teams/*.svg, verified under /Perfect-Pick-4.0/.

## Validation / exact next task

261/261 full tests passed after styling, asset inventory and recovery/filter tests;
zero skipped/failed. Image-aware browser harness now serves SVG MIME, decodes32 logos
and disables/drains CDP interception before closing pages with lazy images; it retains
all error/network/privacy assertions. Loading tests cover network/HTTP/HTML/malformed/
timeout failures, exact retry count/backoff, coalescing, recovery, fresh retention and
expiry denial. Existing scoring/champion/prize/security tests unchanged in substance.

Pre-publication loopback real-API browser check passed:272 games/121 FINAL at that read,
32 displayed score values match API, actual23-player standings and completed monthly
champions/tiebreaker display, Week9 protected, all five destinations at1440/768/375px,
zero runtime errors/unexpected external requests. All32 asset base paths decode.
Desktop/mobile screenshots inspected. Final source moves champion below entry/pool
summary and replaces internal architecture wording with player-facing copy.

Next: final full-suite + artifact scan after these final presentation-only edits;
review complete diff/untracked inputs, commit/push this frontend-only release. Then
run existing manual Pages workflow with api profile, inspect downloaded38-file artifact,
verify real published dashboard/logos/recovery/responsiveness; append deployment result
and exact published commit here. No production API operations or new permissions needed.

Final expiry regression caught champion nesting inside a legacy cleanup container;
corrected its layout boundary without changing/removing the expiry assertion.

Final release gate PASS:261/261, zero failures/skips. Overview includes explicit pool
assumption text; recent-week rollovers are labeled estimated rather than collected or
confirmed payment. Original20-second timeout retained per attempt (three attempts max).
No changes in apps-script/, scoring/contracts/projector/sheets/verification code or
workflow. Exact38-file API artifact privacy/SVG/integrity verification PASS. Full changed
and untracked inventory reviewed; only code/tests/docs and the32 mapped logos are staged.
Next unfinished operation: push tested frontend milestone and dispatch existing api
Pages workflow; verify downloaded artifact and actual published dashboard before marking
release complete. Rollback frontend remains6fad89d; production remainsAPI18 unchanged.

## RELEASE COMPLETE

Latest successful implementation/published commit:66e89d3 (develop).
Existing manual api-profile workflow41927746321 SUCCESS. CI261/261 PASS, zero failures
or skipped tests, all tests before artifact upload. No backend/config/workflow permission
changes. API18, existing API URL, original writers/triggers/Form/manual cleanup unchanged.

Downloaded actual Pages tar verified: EXACT38 reviewed files (six frontend +32 logos),
no links/unexpected directories/private inputs. Every actual public file was separately
fetched and byte-compared to the verified artifact:38/38 exact matches. SVG MIME types
and32/32 browser image decodes PASS under the actual /Perfect-Pick-4.0/ base path.

Published https://enziuh.github.io/Perfect-Pick-4.0/ verified at1440/768/375px: all five
destinations, zero horizontal overflow/runtime errors/unexpected network requests or
fixture fetches. Actual272 games/121 FINAL/151 pending at this read (not a future
freshness guarantee);32 displayed Week1 score values equal the existing API. Week8
shows23 approved player cards/voting; Week9 response/DOM withholds picks/predictions/
voting. Weekly/season tables show23 approved rows, completed M1/M2 champion decisions
match shared resolver and M2's finalized combined-score comparison is displayed.
Official Form link remains correct. Estimated23-participant pools clearly labeled;
no new payment tracking. Desktop/mobile screenshots reviewed.

No remaining release blocker. Frontend cannot make an unavailable upstream service
available: it retries only within bounded limits, preserves a still-valid snapshot,
and MUST withhold player details once privacy evidence expires. No stale disclosure
extension, offline private-data storage or fallback to raw legacy responses was added.

Rollback frontend commit remains6fad89d; API18 requires no rollback for this frontend
change. Exact resume: start here; maintain published66e89d3 and wait for a new owner
request. Do not repeat completed audits/integration/activation or modify the backend.
Local verification receipts/screenshots stay ignored in tmp/sports-dashboard/.

## Targeted game results / player comparison fixes — ready to publish

Resumed develop c3ae913 / published66e89d3. Exact live diagnosis: Match Center defaults
to active Week9 (OPEN). Public API18 intentionally represents its disclosure as UNKNOWN,
UNVERIFIED / WITHHELD, reason CLOSURE_UNVERIFIED. The old frontend incorrectly described
this expected OPEN-week state as incomplete evidence. There is NO missing closure,
alias approval/completeness, pick mapping or contract failure for Weeks1–8: fresh
live dashboard4 + unchanged decoder verified each CLOSED/OFFICIAL/AVAILABLE,23 players,
and matching game votes. Public browser confirmed selectedWeek9/disabled selector and
misleading text, then Week8's23 player cards/voting/standings worked. All23 designated
predictions exist in each period-ending Week4/8; other weeks have no designated monthly
tiebreaker, so no prediction is fabricated for them. No backend fix or approval needed.

Frontend-only changes: distinguish reported OPEN messaging from disclosure permission;
publicPicks CLOSED/visibility gate unchanged. Week selectors label Closed/Open/Private
using validated data, not dates. OPEN/unknown state offers direct button to the latest
eligible CLOSED week, with clear selected-week explanation. Expiry clears that shortcut.
Player selector, game-specific comparisons and predictions retain original trusted model.
Optional Compare All Players matrix gains existing correct totals/accuracy and eligible
period-ending predictions, semantic row headings/sticky names and contained scrolling.
Winner rows now full-row team-color tint/border, bold scores and explicit checkmark +
WINNER; losing rows secondary, ties/pending/live not falsely declared winners. Never
infer a winner from scores. Missing kickoff labels omitted; real kickoff/Pacific timezone
retained. Deadline explanation rewritten for players, actual configured time unchanged.

261/261 full tests PASS, zero failures/skips. Existing privacy/scoring/tiebreaker/API,
asset security/integrity and all32 SVG tests retained. Browser regressions explicitly
exercise OPEN→latest CLOSED shortcut, aliases/selector/predictions, matrix totals and
internal scrolling at375/768/1280px, winner labels, missing vs configured kickoff, missing
aliases and unknown closure/expiry. Replaced only obsolete exact UI-copy expectations
with requested player-facing wording and missing-kickoff omission checks; disclosure
assertions remain intact. No performance work, backend/source/contract/workflow/asset
inventory or production service changes. Exact38-file publication allowlist remains.

Next: commit/push these tested frontend files, dispatch existing manual api Pages
workflow, then verify actual published Week9 shortcut→Week8 picks/voting/comparisons/
predictions/matrix, winner styling and all32 logo paths. Backend remains18, no upload,
new permission/deployment or owner approval required. Frontend rollback66e89d3 preserved.

Targeted fix commit cf9e84c pushed. First Pages run41930492212 correctly BLOCKED upload/
deployment:260 passed,1 browser failure. Exact CI error was pre-DOM evaluation of
status.textContent in the owner-RPC page at browser.test.cjs:375 (Page.navigate had
acknowledged navigation before HTML parsed). It was NOT a production data/privacy or
layout failure. Browser page helper now explicitly waits for the status DOM node
before checking the same application-ready condition; no functional/security assertion
removed, skipped or relaxed. Local full rerun required before retrying workflow.
Published source stays66e89d3; backend18 unchanged throughout.
