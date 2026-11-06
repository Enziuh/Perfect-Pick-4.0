# API v20 static preparation measurements

## LIVE static Pages release — verified November6,2026

Published commit7b93c23; workflow42273079410 verify/deploy SUCCESS,377/377 tests
PASS,zero skips/failures. All38 downloaded files matched the reviewed artifact
byte-for-byte. Production now uses same-origin PP4_STATIC_V2 JSON with historical
protected retention1–8 only; Week9 safe aggregates remain, protected data is absent.
This is REAL GitHub Pages/Google CDN delivery, not loopback/replay. Same Chrome156,
40ms/10Mbps/4xCPU method as earlier live API baseline; one sample per width/visit,
not percentiles or guaranteed future latency. Static source contains fewer protected
records because Week9 retention is NOT authorized; aggregate totals remain identical.

|Viewport/visit|Usable ms|FCP ms|LCP ms|Page load ms|Bytes*|Google requests|JSON requests|
|---|---:|---:|---:|---:|---:|---:|---:|
|1440/cold|1075.4|556.0|556.0|713.9|101167|0|1|
|1440/repeat|425.0|192.0|192.0|214.5|20141|0|1|
|768/cold|742.4|340.0|340.0|530.8|74005|0|1|
|768/repeat|419.4|188.0|188.0|207.9|20142|0|1|
|390/cold|732.4|364.0|364.0|522.1|69414|0|1|
|390/repeat|396.4|172.0|172.0|196.0|20143|0|1|

|Viewport/visit|Standings ms|Week switch ms|Player View ms|Compare matrix ms|
|---|---:|---:|---:|---:|
|1440/cold|35.2|66.6|79.6|46.6|
|1440/repeat|37.5|57.3|38.9|55.0|
|768/cold|38.0|67.2|56.4|76.6|
|768/repeat|41.3|65.8|33.8|42.2|
|390/cold|38.6|47.6|45.4|54.3|
|390/repeat|35.8|50.8|31.7|40.1|

*CDP encoded bytes through usable+200ms including visible assets; excludes complete
TLS/DNS/redirect overhead. Snapshot340,242 bytes raw/18,716 gzip. API baseline cold
usable15,199ms desktop/17,313ms mobile versus actual static1,075ms/732ms: observed
92.9%/95.8% improvement. Different observations/time/authorized disclosure scope mean
this is not a statistical experiment or promise. Stable template FCP/LCP precede
asynchronous data readiness; usable time is the meaningful player-facing improvement.

Zero runtime exceptions/interaction API calls; matrix lazy until opened. Actual DOM
checked at1440/768/390 across all five destinations,32 logos, Form link, historical
player views and comparison,21 Week9 aggregate/23 season rows and absent Week9 picks/
votes. Five-width real-candidate local preflight also completed successfully. Live
same-origin refresh was separately verified to preserve route/week/player, with no
Google calls. That additional mobile cold/repeat probe measured1509ms/416ms usable,
showing real single-run variability rather than guaranteeing the faster sample.
Malformed-response/expiry fail-closed behavior passed the existing browser suite;
no production fault was injected. No unsafe API fallback exists. Browser/source
receipts remain ignored in tmp/performance/static-production-live.

Scheduler is prepared but NOT loaded: Mac sleeps after1minute; awake/logged-in/network/
Keychain availability requires owner confirmation before reliable unattended use.
First snapshot expires2026-11-07T00:39:05.315Z (Nov6,4:39PM Pacific); refresh needs
completion before expiry. No automated refresh is claimed. Underlying ESPN/Sheets
score-write time remains unknown, distinct from source observation/generation and
actual Actions deployment completion2026-11-06T18:43:24Z. API20/writers untouched.


## Fresh recovered API20 versus matching static data — November6,2026

API20 is healthy following the owner's restoration of standard timestamp display.
No backend repair was uploaded. Both comparison profiles use the same frontend
assets hosted on the same gzip loopback server, Chrome156,40ms network latency,
10Mbps down/5Mbps up and4x CPU slowdown. The API profile makes REAL Google API20
requests; static reads same-origin JSON. No CDP replay or frozen clock was used.
All four API captures match the fresh source apart from verification timestamps.
Projection/decoded model parity passed; all23 existing random IDs are preserved.
Cold uses cleared HTTP cache; repeat uses a new page with retained HTTP cache.
One observation per viewport/visit; sequential runs, not percentiles or an SLA.

|Viewport/visit|Live Google usable ms|Local static usable ms|Saved ms|Observed reduction|
|---|---:|---:|---:|---:|
|1440/cold|15269.3|593.6|14675.7|96.1%|
|1440/repeat|13373.5|427.7|12945.8|96.8%|
|390/cold|13711.0|589.9|13121.1|95.7%|
|390/repeat|14460.2|429.5|14030.7|97.0%|

|Viewport/visit|API/static FCP ms|API/static LCP ms|API/static page load ms|API/static transferred bytes|
|---|---:|---:|---:|---:|
|1440/cold|264.0/276.0|264.0/276.0|379.6/400.3|88477/91768|
|1440/repeat|256.0/236.0|256.0/236.0|255.5/251.4|25359/25026|
|390/cold|276.0/260.0|276.0/260.0|396.1/397.8|62154/65727|
|390/repeat|244.0/240.0|244.0/240.0|262.8/254.8|23417/25026|

Static does not reduce this already-small API transfer: the benefit is avoiding
Google request latency. Each visit makes one API request OR one static JSON request;
interactions make zero extra requests in either profile. Static JSON is327,920 raw /
17,929 gzip bytes. Reported bytes are CDP encoded bytes through usable+200ms, not
complete TLS/DNS/redirect overhead. LCP is last observed before interactions.

|Viewport/visit|Static standings ms|Week switch ms|Player ms|Matrix ms|API/static JS ms|API/static layout ms|
|---|---:|---:|---:|---:|---:|---:|
|1440/cold|36.5|66.1|77.2|64.3|38.2/38.2|119.0/123.7|
|1440/repeat|35.0|67.3|50.9|54.9|36.1/35.8|132.7/128.0|
|390/cold|48.4|62.3|50.1|49.5|40.1/42.9|134.4/125.6|
|390/repeat|52.0|63.7|30.4|43.7|40.8/35.4|134.6/130.7|

Matrix cells remain unbuilt until Compare All Players opens. Both profiles retain
working23-player views, standings and week switching. Zero runtime exceptions;
static desktop/mobile checks found no page-wide overflow. This is a restricted
local full-model benchmark, not a production static deployment. Its Week9 records
were used only during the original short-lived API proof. Durable1–8 candidate
physically strips Week9 protected data and dependent aggregates. Full current-season
static feature parity therefore still requires separate Week9 retention approval.

## Actual published API-backed website

The existing Pages website was measured separately, with real Google responses under
the same browser throttling. Different asset hosting prevents treating this table
as the controlled comparison above.

|Viewport|Cold usable ms|Repeat usable ms|Cold FCP/LCP ms|Cold bytes|
|---|---:|---:|---:|---:|
|1440|15199.0|14171.9|644.0/644.0|93656|
|768|15487.4|16924.7|572.0/572.0|66276|
|390|17312.9|13206.8|324.0/324.0|62612|

All six published samples loaded real competition data, had zero runtime exceptions
and no interaction API requests. Local static subsecond observations are NOT a
GitHub Pages load guarantee; final CDN checks require approved static publication.
Underlying ESPN/Sheets score-write time is unavailable inAPI20, so observed capture
and generation times are not presented as score freshness. No real JSON was published.
Numeric reports/captures are ignored under tmp/performance/restored-v20-live and
restored-v20-comparable. Private registry material remains outside the repository.

## Earlier controlled replay — historical, superseded by fresh comparison



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
guarantee. The fresh comparison above supersedes the former live-data blocker; final CDN checks require approval;
a provisional cold usable target under2s should be tested, not promised.
Numeric samples remain in ignored tmp/performance/v20-comparable-final, without
raw submissions, contacts, mappings or recovery keys in this report. No real data
was published and the live source remains API20.
