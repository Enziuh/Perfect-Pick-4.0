# Frontend performance checkpoint

Current phase: baseline COMPLETE; optimization not yet started.
Branch: develop; baseline application/published rollback22ea053; prior checkpointd65fc1c.
Verified latest successful Pages run41930970941, published22ea053. Working tree was clean.

Completed: dependency-free CDP profiling tool, six real-site cold/repeat samples at1440,
768,390px; fixed40ms/10Mbps/5Mbps/CPU4x conditions. Raw numeric metrics in
baseline-measurements.json; method, results and verified costs in PERFORMANCE_BASELINE.md.
No private API URLs/IDs/names/captures in tracked reports. Captures ignored under tmp/.
Initial API requests1, interaction API requests0, DOM1875, images94; CLOSED-week selection
builds322 collapsed matrix cells. Upstream response time dominates usable latency.

Checks: profiler syntax and actual headless run PASS, zero browser exceptions in six
samples. Existing application/tests unchanged; no production operations/deployment.
Files: tools/performance/browser-profile.cjs and docs/performance/ baseline/progress.

Exact next action: implement active-destination rendering and lazy matrix/player/
matchup-detail construction in website/app.js, retain expiry clearing for ALL hidden
protected content, bounded caches and epoch guards. Then regression tests and controlled
same-input replay plus live remeasurement. Do not rerun the completed baseline/audit.
Remaining: rendering/cache changes, focused/full tests, honest before/after comparison,
push tested frontend, existing manual api workflow, actual live/privacy/logo checks,
results report/final checkpoint. Backend18/scoring/closure/prizes remain unchanged.

Milestone1 COMPLETE: deferred player-card contents, matchup comparison lists and full
matrix until native details opens; selecting one player renders only that player.
Bounded same-week built flags avoid rebuilding on reopen; deferred paths call the
existing adapter expiry check before reusing content. No contract/scoring changes.
Focused full browser regression PASS, including all privacy/expiry/alias/matrix tests.
Tests first assert no hidden matrix/pick details are built, then explicitly open the
controls and retain all existing correctness/prediction/scrolling assertions.
Files website/app.js, tests/browser.test.cjs. Next: active-destination rendering,
all-hidden-private-content invalidation on refresh/expiry, stale async guards; then
controlled replay/performance comparison and complete suite. Not deployed yet.

Milestone2 COMPLETE / ready for publication: active destinations only, scoped generation
and selection guards, eight bounded rendered-view jobs, and all-hidden-protected-DOM
invalidation on model replacement/expiry. Lightweight internal availability metadata
avoids cloning18 historical pick arrays to label controls; no API contract changed.
Rapid navigation no longer renders the same Match Center week twice. Selected week,
month, player, matchup and destination retained, subject to new disclosure validation.
Snapshot watermark rejects older generatedAt/revision responses; concurrent forced
refreshes emit one update; malformed response notices differ from network failures.

Static build compaction uses existing pinned Acorn AST equivalence and exact browser
CSS-rule equality. No new dependencies; unchanged38-file publication inventory. First
CSS attempt changed serialized var() comma whitespace; it was rejected by the added
strict test, corrected and rerun, not published or bypassed. All266 tests PASS, no skips,
including every original width plus360/390/430/1440, lazy controls, cache reuse/revocation,
stale responses, all original scoring/champion/prize/privacy/artifact/logo checks.

Final isolated fixed-input comparison: initial DOM1875→822, matrix pre-open322→0;
median CLOSED-week switch86.5→53.35ms. Cold usable median771.1→730.9ms with fixed200ms
API response; real API latency is not represented by that controlled figure. Numeric
before/after reports in controlled-*.json and PERFORMANCE_RESULTS.md. Earlier calibration
concurrent with tests was discarded to ignored tmp/performance/under-load. Initial live
baseline remains untouched. Files modified: website/app.js, browser-client.cjs,
pages-artifact.cjs, performance tooling, browser/loading/static tests and these reports.

Latest passing implementation will be the following commit. Baseline22ea053 retained
as rollback. Next exact action: push tested candidate; manual existing Pages workflow
profile=api; inspect actual38-file artifact, run actual site privacy/scoring/logo/mobile
checks and same live profiler to after-measurements.json; regenerate results and record
published commit/run. No backend/Sheet/Form/trigger/OAuth/deployment-setting operation.

Candidate7049dbb pushed. First run42072966965 failed CLOSED before upload/deploy:265
passed, browser functional assertions passed but teardown recorded two "Fetch domain
is not enabled" protocol errors from late lazy-image interception after Fetch.disable.
Live site remains22ea053. Harness now KEEPS network blocking through Target.closeTarget,
asserts successful closure, and audits only exact closed-session cancellation messages
against acknowledged closed sessions. All actual runtime/network errors and zero-external
request assertions remain unchanged. Replay profiler also keeps interception through
closure, avoiding any accidental live request at teardown. No application change.
Full suite rerun required, then commit/push the harness fix and retry existing workflow.

## PERFORMANCE RELEASE COMPLETE

Latest passing/published frontend e6e3e92 (application7049dbb; lazy milestone f8caccd).
Existing manual api Pages run42074208911 SUCCESS:266/266 CI tests, zero skipped/failed;
local full266 also passed. Failed run42072966965 never uploaded/deployed. Deployment
uses unchanged API18 URL and exact38-file artifact; no production backend operations.
Rollback remains22ea053. Latest checkpoint commit follows this entry.

Actual public-site check PASS at360/390/430/768/1440: all five destinations, real272
NFL games/121 FINAL at that read,32 displayed scores equal API, weekly/monthly/season
rankings and shared champion/tiebreaker decisions,23 approved CLOSED Week8 players,
correct/incorrect picks, predictions, votes and comparisons. Matrix starts with0 cells,
builds23 rows only on open; totals/accuracy/predictions exactly match API. Selected
player details and matchup lists build on demand. Week9/future unverified scopes have
no picks/predictions/voting exposure. Official Form link and estimated pools retained.
Zero runtime errors/unexpected external requests/fixture fetches. All32 original SVG
paths decode. Actual published38 files byte-match reviewed artifact with privacy and
integrity validation; no private records/configuration in artifacts.

Final measurements COMPLETE: live after-measurements.json collected sequentially with
same browser/throttling as untouched numeric baseline, without concurrent test work.
PERFORMANCE_RESULTS.md contains full tables, absolute differences and meaningful
percentages; all raw numeric observations retained. Controlled rendering: cold usable
771.1→730.9ms (5.2%), initial DOM1875→822 (-56.2%), CLOSED-week opening141.3→88ms,
week switching86.5→53.35ms; no matrix cells built before opening. Real-site observed
week-switch median72.2→48.2ms (33.2%). Initial API calls remain1, interaction API calls0.
Live data-ready times are mixed (cold desktop16.7→17.2s, tablet14.4→15.3s, mobile12.4→
10.7s); no universal network/startup gain is claimed. Unchanged Apps Script/Internet
response wait dominates (10–17s observed), while script execution is about34–41ms.
Sub-frame differences and slower samples remain visible. Full TLS/DNS/unreported
redirect overhead is unavailable; the CDP byte-metric label was clarified without
changing numeric baseline observations. No backend permissions/update requested.

Caches: memory-only18 week/5 month/8 rendered-view maxima and one selected matrix;
all hidden protected DOM/cache entries reset on a new validated model or expiry.
Old generatedAt/revision responses rejected, forced refresh coalesced, expired proof
never extended. No local/session storage, new endpoints, database, proxy, service
worker, analytics or framework. Replay server is loopback STATIC test assets only;
fixed snapshot stays ignored/private and browser interception prevents Google reads.

All authorized frontend improvements completed. No remaining functional/deployment
blocker. Known scope limit: the existing API response wait cannot be eliminated by
these frontend changes; no scoring/privacy weakening used to mask it. Exact resume:
start here, keep e6e3e92/API18 working. Do not repeat the baseline, optimize the backend,
or begin unrelated redesign. New owner-directed work only. Reports are in this folder;
private validation receipts/screenshots/captures remain ignored under tmp/performance/.

Final checkpoint validation: full266/266 local tests passed again after adding explicit
refresh-on-Guide coverage for destination/week/month/player/matchup preservation. No
runtime/publication-source changes since published e6e3e92. Final documentation/tool
commit records numeric after-measurements and transport-metric limitations only, plus
this additional browser regression. No second deployment needed for these files.
