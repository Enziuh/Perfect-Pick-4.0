# API v20 static preparation measurements

Current production usable-time/FCP/LCP baseline: **unavailable**. The actual API
returns UNAVAILABLE after the Responses display-format change; no usable dashboard
or live performance improvement is claimed. Actual error-state DOM was checked at
360/390/430/768/1440: no page overflow; obsolete three-hour and synthetic-picks FAQ
copy was observed and corrected locally.

## Equivalent captured-real-data comparison

Both profiles use the SAME last verified real v20 dataset and preserved random IDs,
272 games/23 approved aliases, same dashboard assets, Chrome156,4x CPU,40ms latency,
10Mbps down/5Mbps up. Clock is frozen at the ORIGINAL valid capture instant only
in the restricted local test; no proof is renewed. Static full Week9 data exists
only in that short-lived local benchmark; durable candidates physically omit it.
API is a fixed200ms CDP replay, NOT current Google latency. API replay bytes are
uncompressed; static is gzip loopback. Those transport totals are NOT a production
transfer comparison. One cold/repeat observation per width, not percentiles. A trial
gzip CDP fulfillment did not decode correctly and was discarded/reverted.

|Viewport/visit|API replay usable ms|Static usable ms|Difference ms|Observed local change|
|---|---:|---:|---:|---:|
|1440/cold|723.6|598.7|124.9|17.3%|
|1440/repeat|545.6|476.5|69.1|12.7%|
|390/cold|685.4|555.1|130.3|19.0%|
|390/repeat|508.4|398.4|110.0|21.6%|

|Viewport/visit|Standings ms|Week switch ms|Player view ms|Matrix ms|Google requests|Static JSON requests|Transferred bytes*|
|---|---:|---:|---:|---:|---:|---:|---:|
|1440/cold|40.1|65.6|93.4|63.3|0|1|91684|
|1440/repeat|36.4|58.8|42.3|48.3|0|1|25041|
|390/cold|40.6|51.4|45.8|37.8|0|1|65643|
|390/repeat|38.2|51.1|30.5|38.4|0|1|25041|

*CDP bytes through usable+200ms, including visible assets. JSON is327,920 raw bytes /
17,927 gzip bytes; zero Google calls on static, zero extra requests on interactions.
Matrix is empty until opened. Filter/navigation/rendering remain on demand.

These measurements show the existing static path is viable with real captured data.
They do NOT establish a current live API comparison or a GitHub Pages load-time
guarantee. After timestamp repair, repeat fresh equivalent-data live and CDN checks;
a provisional cold usable target under2s should be tested, not promised.
Numeric samples remain in ignored tmp/performance/v20-comparable-final, without
raw submissions, contacts, mappings or recovery keys in this report. No real data
was published and the live source remains API20.
