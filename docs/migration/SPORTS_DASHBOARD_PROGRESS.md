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
