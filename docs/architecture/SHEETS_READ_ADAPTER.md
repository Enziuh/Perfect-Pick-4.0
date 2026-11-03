# Phase 5D-1 — injected Sheets read adapter (fabricated tests only)

Prepared locally. No Google account, real Sheet, Form, Script Property, trigger,
Apps Script execution/upload or deployment was accessed. Production and the
six-file synthetic Pages preview remain unchanged. Phase 5D-2 needs approval.

## Interface and assembly

`tools/sheets/sheets-read-adapter.cjs` exposes an Apps Script V8-style namespace
`PerfectPickSheetsReadAdapter.create(dependencies, privateTarget, layout, policy)`.
The resulting object has one method: `readPublicSnapshot()`. No raw source, rows,
metadata, target reference, setup function or write action is returned.

Dependencies are explicit: values.batchGet, readEvidence, now, identityKey,
submissionTime, and the unchanged Phase 5C projectCompetition function. The
projector applies its privacy/scoring projection and unchanged Phase 5B validator
before any public response. Provider exceptions become value-free unavailable
responses; configuration errors are generic. No dynamic endpoint/action router,
Google globals, persistence, logging, JSONP or browser live mode is implemented.

The eventual narrow service wrapper can call the Advanced Sheets Values batchGet
read method. It must not receive write scopes or expose other service methods.
An injected function alone cannot prove the implementation behind it is harmless;
the actual wrapper and every evidence/codec dependency require independent review.

`tools/sheets/offline-bundle.cjs` assembles only the adapter, Phase 5B validator and
two Phase 5C pure modules into a string, without files/uploads. VM tests run it
without Node globals and with native service/network/logging operations denied.
Its small private module loader has only fixed local dependency links. This is
local assembly evidence, not proof of an actual Apps Script deployment or runtime
parity. Do not upload the copied production backend or run clasp against it.

## Existing layout and minimum fields

The source layout comes from `apps-script/src/20_Data.js:28-95,118-172` and the
column constants in `00_Config_Setup.js:24-37`; this phase does not re-audit them.
Layout configuration is server-owned, reviewed column numbers, not user ranges.
Only Results and Responses tabs are accepted, data beginning at row 2.

- Results: Week, Game, Team 1, Team 2, Winner, Status, Team 1 Score, Team 2 Score.
- Responses, only when at least one requested week has verified CLOSED: Timestamp,
  Phone Number (private join only), that week's `Wn | matchup` selection columns,
  and its designated period-ending `WK n Tie Breaker...` column when applicable.
- Never fetch Name, notes, raw response exports, provider event IDs, Players,
  Form Control, Prize Rules, prize/ledger tabs, Forms, Properties or triggers.
  Alias approval, official historical closure, configured periods and authoritative
  accounting remain independent trusted evidence; none is inferred from those tabs.

Headers are fetched in explicitly bounded individual column cells and verified
before any body request. Column descriptors must cover the reviewed slate and
required prediction fields, without duplicate columns. Only bounded A1 ranges
are permitted, never full columns/tabs, wildcard discovery or metadata enumeration.
Unknown closure skips Responses entirely. Mixed closure reads only CLOSED-week
pick/prediction columns. Identity/timestamp column spans can include rows that
submitted only other weeks; those private cells remain ephemeral and do not create
entries or votes for a closed week without a valid selection. The owner must approve
that minimal shared-row join access before any actual verification.

Rows are independently attested: up to 400 results and 1000 responses. Week and
Timestamp have one additional blank boundary guard. Unexpected boundary data,
empty required keys, missing headers, range count/order/dimensions, duplicates or
short identity/timestamp coverage reject the capture. The API legitimately omits
trailing empty cells; optional picks/scores are padded as blank, not fabricated
zero. Final-score validation still rejects missing FINAL scores. A guard is not
proof that no data exists past a gap; complete high-water row bounds are required.

## Revision, freshness and completeness are prerequisites

Injected readEvidence must supply revision, observedAt, validUntil, resultRows,
responseRows and quiescent:true for the exact private target and requested capture.
Revision must match the trusted Phase 5C policy. Evidence is checked before and
after two header/body read passes (normally four batchGet calls). Both pass values
must match in private memory, without hashes or values being logged. The clock is
checked again after reads; elapsed expiry/staleness cannot be hidden by a fixed
start time. Any failure returns UNAVAILABLE, with no private provider error.

These checks detect races but do not create a transaction or revision authority.
The Sheets Values response does not supply the required authoritative capture
revision/completeness/quiescence assertion. Equal reads cannot detect every ABA
change. A caller-provided constant revision, guessed row count, a fresh timestamp,
last-modified date or current Form Control row is insufficient production proof.
Until a trustworthy capture mechanism or approved immutable private snapshot is
available, live verification is BLOCKED. No metadata writes, new revision cells,
paused triggers or production changes are implemented or authorized to solve this.

Score verifiedAt is the independently attested capture observation time, meaning
that these values were verified in that capture; it never changes the game status
or invents a result. It is not copied from an old Sheet update time or fabricated
by refreshing an unchecked score. Missing snapshot/closure/accounting evidence
keeps the same unavailable/WITHHELD behavior defined in Phases 5B/5C.

## Private identity and time handling

No real identity/contact data is in tests. The private identityKey dependency must
be owner-reviewed to reproduce the approved legacy join normalization; it cannot
derive a public alias. Explicit approved alias mappings still gate every player
record and dependent standings/voting. Missing mappings do not produce partial
rankings. No identities, timestamps or source labels are passed through to output.

Requests use UNFORMATTED_VALUE with SERIAL_NUMBER dates. Numeric scores pass through
the projector's strict normalization, preserving zero versus blank. Submission
serials require an injected submissionTime codec with the known spreadsheet time
zone, locale/format and daylight-saving behavior. The fabricated test codec maps
one invented serial to a fixed ISO timestamp; it is NOT a production converter.
Ambiguous strings/unmapped serials fail, never use host-local Date parsing guesses.
A tested real codec and private identity normalizer remain Phase 5D-2 prerequisites.

Prizes are not recalculated from entry counts or zero payout placeholders. Existing
trusted accounting evidence is preserved by Phase 5C, otherwise amounts/payment
remain unavailable/UNKNOWN. No prize cells, score fields, formatting or tabs change.

## Owner procedure for a later explicitly authorized verification

1. Review this code, contract and checkpoint; separately authorize the precise
   target, field/range bounds, closed weeks and private handling. First validate a
   synthetic sandbox. Do not use the ignored clasp target as evidence of safety.
2. Prepare an isolated reviewed 4.0-only assembly, without production 3.0 setup,
   sync, repair, cache, Form or trigger code. Owner confirms the Google account,
   intended private target and existing access privately; never put identifiers,
   credentials or alias/contact maps in Git, Pages, shell output or logs.
3. Review enabling only the Advanced Sheets read service and an explicit manifest
   scope ending `spreadsheets.readonly`. Reject broad spreadsheet-write, Drive-write,
   Form, trigger-management or unrelated grants; do not inherit auto-discovered
   scopes from copied code. OAuth scope is not limited to particular columns: the
   adapter allowlist and account's existing access are additional boundaries.
   Do not change Google sharing or permissions as part of this phase.
4. Establish credible revision/completeness/capture authority, approved aliases,
   historical official closure evidence, timestamp/identity codecs and policy
   freshness. Without these, stop; do not manufacture evidence to obtain READY.
5. Only after new explicit authorization, the owner may approve a one-time private
   read verification using this assembly. No web app, trigger installation or
   production source upload is required by this plan. A private comparison runner
   must emit only contract check codes/states; no snapshots, keys, aliases, contacts,
   ranges, raw exceptions or per-player differences. Keep data ephemeral and do not
   save exports in the repository or public artifacts. No such runner was executed.
6. Review parity and all withheld/unavailable outcomes before authorizing any next
   integration. Retain synthetic Pages throughout. Source access, Apps Script
   assembly/execution, public API deployment and public release are distinct gates.

## Browser/CORS readiness — no workaround implemented

The current browser permits only its same-origin synthetic fixture. A private
Google Sheets/OAuth reader belongs on the server; no credentials or approval maps
may be shipped to a static GitHub Pages client. Do not switch CSP or add live mode.

Future JSON delivery must be tested from the actual approved Pages origin, through
any redirect, with correct response content type, CORS headers, credentials policy,
cache revision/expiry and unavailable states. A successful private server read or
command-line GET does not prove a browser may read the response. Apps Script
ContentService redirects content; do not assume arbitrary CORS header control or
that public access settings solve CORS. Do not use no-cors (opaque/unreadable),
JSONP/script tags, a public CORS proxy, URL credentials or browser OAuth secrets.
If direct delivery cannot meet the approved security/CORS requirements, separately
review a server-side gateway with explicit origin/authentication policy and the
same server-side public projection. No gateway, endpoint or deployment is built.
The existing CLOSED-but-withheld zero-vote frontend gap remains a release blocker.

Official references consulted for this preparation (documentation only):
[Sheets batchGet](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet),
[Advanced Sheets service](https://developers.google.com/apps-script/advanced/sheets),
[Content service redirects and JSONP cautions](https://developers.google.com/apps-script/guides/content).
