# Static JSON prototype measurements

Published rollback e6e3e92; static is local/fabricated only. Same Chrome156, CPU4x,
40ms latency,10Mbps down/5Mbps up, device scale1/height1000 as the earlier profiler.
One cold and repeat sample per width; clear HTTP cache per width (not all DNS/TLS
connections), new tab for repeat. No concurrent tests during these final timings.
Times are observed samples, not percentiles or promised production gains.

## Current live API versus local static prototype

Live uses actual competition; prototype uses fabricated23 players,272 games,121
FINAL/151 scheduled,8 CLOSED weeks,9 OPEN,18 total weeks. Data scopes/prize outcomes
are deliberately fabricated, not claims of live equivalence. Live FCP includes real
Internet/CDN/DNS/redirect conditions; static is compressed loopback under throttling.
These are NOT identical-host/dataset end-to-end measurements. They establish prototype
feasibility, not proof of real-snapshot activation safety or exact production speedup.

|Width/visit|Live usable ms|Local static usable ms|Live FCP ms|Static FCP ms|Live bytes|Static bytes|
|---|---:|---:|---:|---:|---:|---:|
|1440/cold|18810.3|553.1|1128.0|284.0|95038|79563|
|1440/repeat|15419.7|379.4|164.0|228.0|19913|15468|
|390/cold|13451.8|545.0|396.0|256.0|58838|52464|
|390/repeat|15580.0|417.9|180.0|244.0|14667|15468|

## Same-input controlled comparison

Both use the current dashboard and identical fabricated source under the same local
shell hosting/throttling. API is a CDP-intercepted fixed200ms response, not Google;
static is a real same-origin gzip request. Test clock frozen to original fabricated
capture time for both; public runtime never freezes time or extends proof. CDP
intercepted API bytes are uncompressed and not bandwidth-equivalent to Google gzip;
do NOT claim production transfer reduction from those controlled byte totals.

|Width/visit|Controlled API usable ms|Static usable ms|Difference ms|Observed improvement|
|---|---:|---:|---:|---:|
|1440/cold|645.7|553.1|92.6|14.3%|
|1440/repeat|510.1|379.4|130.7|25.6%|
|768/cold|667.5|574.4|93.1|13.9%|
|768/repeat|501.2|392.3|108.9|21.7%|
|390/cold|660.1|545.0|115.1|17.4%|
|390/repeat|495.7|417.9|77.8|15.7%|

|Width/visit|Standings ms|CLOSED week ms|Week switch ms|Player ms|Matrix ms|API calls|Static JSON calls|Interaction API calls|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|1440/cold|28.4|134.7|70.5|42.9|53.8|0|1|0|
|1440/repeat|85.7|81.7|44.9|41.1|44.5|0|1|0|
|768/cold|31.2|124.2|68.5|35.7|49.8|0|1|0|
|768/repeat|89.1|91.8|47.2|31.8|47.0|0|1|0|
|390/cold|31.9|101.7|48.7|40.6|40.9|0|1|0|
|390/repeat|64.4|86.2|37.0|50.1|53.7|0|1|0|

One static JSON request per visit, zero Google requests and zero interaction API
requests. Cache:no-store intentionally prevents a persistent protected-data cache;
repeat benefits from HTTP-cached frontend/SVGs, not stale disclosure. Matrix starts
with0 cells, opens345 cells for23 players/15 games. No new requests on player/week
changes. All figures/raw numeric samples are in the three adjacent STATIC_*JSON files.
Bytes are CDP loadingFinished sums through usable+200ms, not full TLS/DNS/redirect
transport overhead. No real API data was stored in these measurement files.

The prototype is materially faster than observed live waits and faster than the
controlled200ms path in these samples. A real sanitized snapshot, authorized retained
CLOSED evidence and production hosting measurements are still required before source
activation. Current120s proof window and absent durable production identity store
remain blockers; the live API architecture stays active. Reproduce with
`node tools/snapshots/benchmark.cjs`; live measurement uses the existing public profiler
with captureDir omitted. No hidden data or raw records are benchmark outputs.
