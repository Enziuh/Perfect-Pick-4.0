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
