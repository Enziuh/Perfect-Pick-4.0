# Performance baseline

Published frontend22ea053, latest develop checkpoint d65fc1c. Rollback22ea053.
Measured before changing application source. Existing API18 unchanged.

## Reproduction

`node tools/performance/browser-profile.cjs https://enziuh.github.io/Perfect-Pick-4.0/ tmp/performance/live-baseline.json`

Chrome Chrome/156.0.8078.80, headless, CPU4x slowdown;40ms network latency,10Mbps down/5Mbps up, device scale1,1000px height. One cold and one repeat sample per width, fresh temporary profile, cache cleared per viewport; repeat uses another page in the same browser cache. No persisted competition data. Cold/repeat API reads remain fresh.

Values are observed single samples, not percentiles or causal estimates; Apps Script/network latency varies. LCP is last candidate at usable+200ms before interaction. Load is navigation loadEventEnd (static page), usable is first competition-data-loaded status. Script/layout are CDP durations on a fresh target through that point. Interactions measured inside browser through readiness and two animation frames; no protocol-polling time added.

|Width/visit|FCP ms|LCP ms|Page load ms|Dashboard usable ms|API requests|Bytes|JS ms|Layout/style ms|Standings ms|CLOSED week ms|Week switch ms|Player ms|Matrix ms|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|1440/cold|984|984|1390|16687|1|95532|39|111|29|110|97|34|43|
|1440/repeat|164|164|179|11863|1|16585|36|109|75|106|74|28|56|
|768/cold|328|328|522|14363|1|79158|36|113|37|134|104|36|36|
|768/repeat|164|164|177|7397|1|14668|34|108|71|109|70|26|44|
|390/cold|568|568|968|12404|1|59204|38|110|29|88|55|45|38|
|390/repeat|156|156|175|13546|1|14673|35|109|40|104|70|36|52|

## Verified findings

- One coalesced API request initially; zero additional API requests for measured interactions. There is no redundant request reduction to claim. Backend time/data volume cannot be reduced by changing frontend endpoints under this scope.
- Initial Overview has1875 DOM elements and94 image elements. It renders Match Center/weekly results, all prize periods and standings even while hidden. It does not render all272 game cards, but duplicates current/recent results in inactive sections.
- Selecting CLOSED Week8 eagerly builds322 matrix pick cells despite the optional matrix remaining collapsed; player cards and matchup comparisons also populate collapsed details.
- Browser HTTP caching reduces repeat static transfer, while every fresh page still needs a validated API response. Player data is not persisted.
- API response/freshness still controls data availability; static-shell FCP is much earlier than usable data.
- No runtime errors in six measured visits. All benchmark captures containing actual competition data remain Git-ignored and private.

A fixed-input, frozen-time test-only replay will isolate rendering gains from upstream latency if live before/after request times differ. It will not change public clock/evidence, create a proxy/API, or make simulated freshness claims.
