# Performance results

Frontend-only; API18, hosting, scoring, aliases, closure evidence and23-participant prize assumptions unchanged. Rollback frontend22ea053. Publication verification is recorded in PERFORMANCE_PROGRESS.md.

## Controlled before/after comparison

Chrome156, CPU4x,40ms/10Mbps/5Mbps,1440/768/390px. Sequential runs with no concurrent test workloads. Same approved public snapshot,200ms browser-only intercepted response, frozen capture clock; static loopback assets only, no proxy/API. This isolates rendering from Apps Script latency and makes no live-freshness claim. Cold rows are median of three widths; interaction rows median of six cold/repeat visits. Single samples per cell, not production percentiles. Sub-frame timing differences are reported but not treated as meaningful gains. Raw data: controlled-before.json / controlled-after.json.

|Metric|Before|After|Before minus after|Improvement|
|---|---:|---:|---:|---:|
|Cold FCP (ms)|300|284|16|sub-frame|
|Cold LCP (ms)|300|284|16|sub-frame|
|Cold static page load (ms)|478.3|455.7|22.6|4.7%|
|Cold dashboard usable (ms)|771.1|730.9|40.2|5.2%|
|Initial API requests (count)|1|1|0|0%|
|Cold bytes through usable (bytes)|427129|423375|3754|0.9%|
|Repeat dashboard usable (ms)|534.7|503.3|31.4|5.9%|
|JS execution at usable (ms)|40.8|37|3.8|sub-frame|
|Layout/style at usable (ms)|126.7|117.3|9.4|sub-frame|
|Open standings (ms)|62|44.7|17.4|28%|
|Open CLOSED-week player view (ms)|141.3|88|53.3|37.7%|
|Switch CLOSED weeks (ms)|86.5|53.4|33.2|38.3%|
|Select one player (ms)|39.6|40.2|-0.6|sub-frame|
|First matrix opening (ms)|47.3|43.7|3.6|sub-frame|
|Initial DOM elements (count)|1875|822|1053|56.2%|
|Initial image elements (count)|94|34|60|63.8%|
|Matrix cells before user opens it (count)|322|0|322|100%|

Positive deltas mean less time/data/work. The first matrix now constructs on demand instead of prebuilding hidden rows; reopening the same authorized week reuses them. No capability was removed. First-request API count was already1; there is no redundant-request reduction to claim. Wire payload still includes the API’s full competition snapshot; no alternative endpoint was introduced.

## Live site before/after

Same browser/network/CPU settings and visit order as PERFORMANCE_BASELINE.md. HTTP cache cleared per viewport; DNS/TLS connections may remain warm within a browser run. Actual Apps Script and Internet timings fluctuate between runs. These are observed values, not attributed frontend speedups.

Post-publication live measurements pending; no deployment is claimed yet.

## Caching, logos and integrity

- One in-flight API request and at most three20s attempts with400/1200ms backoff. Existing proactive refresh/freshness bounds retained. Older generatedAt/revision responses cannot overwrite newer accepted data; invalid data and network outages have distinct non-sensitive notices.
- In-memory caches only: at most18 week promises, configured monthly periods (currently5), eight destination/subview render jobs and one selected-week matrix. All reset on a new validated model or expiry; hidden player content is cleared too. No local/session storage, service worker or cross-session player cache.
- Historical FINAL results reuse the current validated model and rendered view. Their disclosure authority is never extended beyond the existing maximum120s snapshot window. The API does not offer independently refreshable public scores vs player scopes; changing that is outside this frontend task.
- All32 supplied SVGs and mappings preserved (268245 bytes total source assets); stable dimensions, object-fit containment and native lazy loading retained. Removing hidden detail markup avoids unnecessary image elements; browser HTTP caching coalesces repeated same-origin logo URLs. Hosting cache headers are not modified.
- API-profile static JS removes comments/extra whitespace with the existing pinned Acorn parser proving identical AST; CSS compaction must preserve every browser-parsed CSS rule. Readable sources remain intact; no new dependency, asset or build framework.38-file publication allowlist/seal remains exact.
- Initial API/Sheet wait remains the main live bottleneck. This task does not alter it or claim an unavailable metric as a gain.
