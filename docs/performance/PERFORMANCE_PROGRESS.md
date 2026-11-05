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
