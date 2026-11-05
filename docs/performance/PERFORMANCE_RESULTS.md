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

|Width/visit|FCP before→after ms|LCP before→after ms|Static load before→after ms|Usable before→after ms|API calls before→after|Bytes before→after|
|---|---:|---:|---:|---:|---:|---:|
|1440/cold|984→572|984→572|1390.3→733|16686.8→17208.2|1→1|95532→108212|
|1440/repeat|164→172|164→172|178.6→185.6|11862.9→11901.3|1→1|16585→22008|
|768/cold|328→520|328→520|521.7→928.1|14363.1→15272.1|1→1|79158→78726|
|768/repeat|164→164|164→164|176.9→180.2|7397.2→10923.2|1→1|14668→14658|
|390/cold|568→288|568→288|967.7→487.8|12404.1→10697.1|1→1|59204→58725|
|390/repeat|156→200|156→200|175.1→224.1|13546.4→15443.1|1→1|14673→14661|

|Width/visit|Week switch ms B→A|Standings ms B→A|CLOSED week ms B→A|Player ms B→A|Matrix ms B→A|JS ms B→A|Style/layout ms B→A|
|---|---:|---:|---:|---:|---:|---:|---:|
|1440/cold|97.4→48.6|29.1→43|110.1→117.1|33.9→49.8|42.6→48.7|39.1→36.4|110.8→113.4|
|1440/repeat|74.2→47.7|74.6→73.8|105.9→101.6|28.4→42.6|55.9→45.8|35.9→34|109.1→116.8|
|768/cold|104.1→73.4|37.3→27.9|133.8→78.3|35.8→43.1|36.2→51.7|35.7→37.4|113.3→125.2|
|768/repeat|70.2→47.8|71.4→64.3|108.7→90.1|25.9→32.8|43.8→57.2|33.7→35.7|108.4→109.5|
|390/cold|55.2→40.7|28.9→29.2|87.6→82.2|44.6→42.3|37.9→66.6|38→37.1|109.7→111.4|
|390/repeat|70→67.3|39.9→71.1|104.4→87.3|35.6→38.8|52.1→46|35.5→41.1|108.5→144.7|

Live interaction medians (six observed visits, not population percentiles):

|Metric|Before ms|After ms|Difference ms|Improvement|
|---|---:|---:|---:|---:|
|weekSwitch|72.2|48.2|24|33.2%|
|standings|38.6|53.6|-15.1|sub-frame|
|closedWeek|107.3|88.7|18.6|17.3%|
|player|34.8|42.4|-7.7|sub-frame|
|matrix|43.2|50.2|-7|sub-frame|

Live cold dashboard readiness was mixed: desktop16.7→17.2s, tablet14.4→15.3s, mobile12.4→10.7s. Do not interpret these API-bound single samples as a universal startup improvement. Script execution remained about34–41ms and page task work below400ms; seconds-long response waits dominate. No API/backend optimization or unsafe persistent player cache was attempted.

Bytes are the browser-reported sum of CDP Network.loadingFinished encodedDataLength. Full transport overhead including TLS/DNS and any unreported redirect/header bytes is unavailable; the early baseline JSON method label saying redirects included was overly broad. Numeric observations are unchanged.

## Caching, logos and integrity

- One in-flight API request and at most three20s attempts with400/1200ms backoff. Existing proactive refresh/freshness bounds retained. Older generatedAt/revision responses cannot overwrite newer accepted data; invalid data and network outages have distinct non-sensitive notices.
- In-memory caches only: at most18 week promises, configured monthly periods (currently5), eight destination/subview render jobs and one selected-week matrix. All reset on a new validated model or expiry; hidden player content is cleared too. No local/session storage, service worker or cross-session player cache.
- Historical FINAL results reuse the current validated model and rendered view. Their disclosure authority is never extended beyond the existing maximum120s snapshot window. The API does not offer independently refreshable public scores vs player scopes; changing that is outside this frontend task.
- All32 supplied SVGs and mappings preserved (268245 bytes total source assets); stable dimensions, object-fit containment and native lazy loading retained. Removing hidden detail markup avoids unnecessary image elements; browser HTTP caching coalesces repeated same-origin logo URLs. Hosting cache headers are not modified.
- API-profile static JS removes comments/extra whitespace with the existing pinned Acorn parser proving identical AST; CSS compaction must preserve every browser-parsed CSS rule. Readable sources remain intact; no new dependency, asset or build framework.38-file publication allowlist/seal remains exact.
- Initial API/Sheet wait remains the main live bottleneck. This task does not alter it or claim an unavailable metric as a gain.
