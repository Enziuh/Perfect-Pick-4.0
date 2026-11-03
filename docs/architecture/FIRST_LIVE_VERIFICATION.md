# Controlled verification preparation — local, fabricated inputs only

Current implementation: functional native read connector, DISABLED by default.
See the final "Functional native connection" section for current owner steps;
earlier preparation sections are retained as historical design/evidence context.

Status: preparation complete; FIRST REAL READ DISABLED. No owner authorization,
remote isolation, Google permissions or production source correctness has been
established. This document is a conditional procedure, not authorization to run it.
Current synthetic Pages and production 3.0 remain untouched.

## Verified read-path inventory

The configured layout is described by server-owned column descriptors in
`tools/sheets/sheets-read-adapter.cjs`; actual column positions have NOT been
verified against the real spreadsheet. Only these fields may be requested:

- Results tab, row 1 headers and bounded data from row 2: Week, Game, Team 1,
  Team 2, Winner, Status, Team 1 Score, Team 2 Score.
- Responses tab, only for officially CLOSED requested weeks: Timestamp, Phone
  Number (private identity join only), approved `Wn | matchup` columns and the
  applicable `WK n Tie Breaker...` column. A named prediction column must exist
  even if an individual prediction cell is blank/invalid.
- No Name, Players, notes, provider event IDs, Form Control, Prize Rules, ledger,
  Forms, Properties or trigger metadata. Prize facts and lifecycle completion
  remain separately approved policy evidence, never derived from hidden tabs.

Eight synthetic result-column positions are tested (Week A, Game B, Winner C,
Status D, Team 1 E, Team 2 F, scores G/H); these are EXAMPLES, not live positions.
The fabricated Responses columns are Timestamp A, Name B (not read), private join C,
week-one pick D, week-two pick E, prediction F, notes G (not read). Actual selected
coordinates must be checked privately by the owner before configuration.

The adapter first verifies selected header cells, then makes bounded column reads.
Results Week and Responses Timestamp have a one-row overflow guard. No broad
ranges, metadata enumeration or raw row export. Values.batchGet is the sole
injected Sheets operation. The complete assembly imports only the existing
contract/projector and pure preparation helpers, never legacy Apps Script code.
No ensure-columns, score-sync, setup, Form, trigger, diagnostic, doGet or doPost is
called or installed. Write-denying VM tests detect even swallowed service attempts.
The injected implementation and real OAuth grants remain a separate manual gate:
read-only interface names alone cannot prove an arbitrary callback is safe.

## Timestamp parser and competition timezone

`tools/verification/timestamps.cjs` exposes createParser(explicitTimeZone).parse.
The competition reference configuration uses America/Los_Angeles. The owner must
confirm the actual spreadsheet timezone and input representation match that
configuration without changing either production timezone. No default timezone.

Accepted forms:

- Apps Script Date values are instants; preserve their epoch milliseconds and
  return canonical UTC ISO. Never reinterpret their local display a second time.
- Exact UTC ISO with milliseconds and Z is validated and preserved.
- Sheets numeric serials use the 1899-12-30 calendar origin, with the fractional
  day rounded to millisecond resolution. They represent wall-clock fields in the
  explicitly configured zone, not UTC milliseconds or host-local time.
- Explicit local calendar strings YYYY-MM-DD HH:mm:ss[.SSS] (or T separator)
  resolve through that zone. Locale strings and offset-free format guesses are
  rejected. Input dates are limited to 1900–2200 and exact calendar values.

DST offsets are determined using Intl.DateTimeFormat parts around the candidate
calendar time. Spring nonexistent times and fall repeated/ambiguous wall times
are rejected, never assigned an arbitrary offset. A Date/UTC instant at that same
fall time is unambiguous and accepted. A rejected serial/local value blocks the
reader rather than selecting the wrong latest submission. Winter/summer, DST
edges, leap dates, milliseconds, cross-realm Dates and different host timezones
are tested. No timezone database or external service is fetched.

Actual Apps Script Intl/formatToParts support and parity still need owner testing
in the isolated runtime with fabricated cases BEFORE a real read. Unsupported
Intl/zone fails closed, with no host-timezone fallback. The existing Values adapter
returns numeric serials; direct Date support is available for another explicitly
reviewed private ingestion path, not a reason to broaden its response shape.

## Owner-controlled alias and CLOSED evidence

`tools/verification/owner-evidence.cjs` constructs the projector's existing Maps
from explicit owner records. These are private server configuration inputs, never
browser/request JSON, public fixtures or proof of the owner's identity.

Alias record: privateKey, player (independent public key), alias, approved:true,
revision. All fields required, unknown fields rejected. Exact approval/revision,
unique private key/public key/alias and safe display labels are required. No real
name abbreviation, contact hashing or automatic approval. Empty/unmapped players
remain withheld. The owner must deliberately approve each alias and private join
normalization; a registry of real names is not an approval registry.

Closure record: week, snapshotRevision, closureRevision, status, mechanism,
verifiedClosed, checkedAt, validUntil, deadline (null or canonical timestamp).
Only CLOSED + OWNER_VERIFIED_CLOSURE + verifiedClosed:true, matching snapshot
revision, fresh checkedAt and unexpired validity creates official closure evidence.
Other records provide no disclosure authority. Missing records are UNKNOWN;
duplicate/conflicting week declarations reject the evidence set. Elapsed deadline,
old-week ordering, game kickoff or a current Form Control flag never substitutes
for verified closure. Deadline is informational, not a release switch.

Before signing off a real closure record, the owner must independently confirm
that the applicable official weekly entry period was closed and remains closed.
Historical periods need historical authority, not today's Form state. No program
in this preparation accesses a Form or changes its status. Reopen/revocation must
invalidate records/caches immediately. A literal mechanism/boolean or constructed
Map is NOT cryptographic provenance; remote owner identity/isolation is unverified.
Private configuration must stay outside Git, Pages, logs, browser state, chat and
public response payloads. No Script Properties are read or modified in this task.

## Snapshot and error handling

Reuse the 5D-1 adapter and 5C projector: independent trusted high-water row counts,
revision/capture validity and quiescence are required before reading. Selected
headers precede body reads. Both header/body passes must agree, pre/post evidence
must match, and completion-time freshness must still hold. Missing columns, partial
or reordered results, changed revisions, stale verification or source inconsistencies
return unavailable. Missing FINAL scores never become zero. Unknown aliases/closure
withhold identity-bearing scopes. Missing accounting never becomes paid/unpaid.

Equal reads, guard rows, a constant counter or an updated timestamp do not establish
a transaction, completeness after gaps or protection from ABA changes. A genuinely
credible capture mechanism or separately approved immutable private snapshot is
still REQUIRED. This preparation does not manufacture one or modify production
cells/triggers to implement one. Without it, stop before a real read.

## Owner review report and disabled entry point

`tools/verification/offline-report.cjs` accepts data only; it invokes no reader,
callback or service. It validates inputs and returns only state, validation,
counts (weeks/games/final games/available scopes/withheld scopes), fixed comparison
check codes/states and discrepancy-category count. No player counts, aliases,
keys, raw selections/predictions, points, money, notes, timestamps, target/range
identifiers, error text or per-player differences. It does not log/persist inputs.

Missing/unavailable/invalid data, missing baseline, withheld scopes, revision
mismatch or an unavailable champion oracle cannot become VERIFIED_OFFLINE. A
rules oracle must be independently approved; a legacy zero monthly payout is not
one. VERIFIED_OFFLINE means the supplied fabricated/authorized snapshots matched;
it never certifies authorization or actual production correctness. Report aggregate
counts are for PRIVATE owner review, never a public endpoint or Pages asset.

`tools/verification/disabled-entry.cjs` exposes verifyRealCompetitionReadOnly_().
It ALWAYS returns DISABLED / OWNER_AUTHORIZATION_AND_ISOLATION_REQUIRED. It has no
service dependency, reader, target, flag, token, property, callback or enable switch.
Purported owner/request arguments cannot cause a read. The trailing underscore is
not treated as authentication. The offline bundle exposes the same disabled result
and no HTTP handlers. Actual remote project isolation and owner authorization are
not proven, so enabling a real verification entry is deliberately unimplemented.

## Exact conditional first-read procedure — owner must approve each boundary

1. Review this checkpoint/code, the exact intended private target, requested closed
   weeks, field coordinates, bounded row counts, timeframe and comparison plan.
   Give NEW explicit authorization for the precise real read; local preparation
   approval is insufficient. Do not paste private identifiers/records into Git/chat.
2. Privately inventory the isolated 4.0 verification project: owner/editor access,
   deployed versions, bound scripts, triggers, libraries and HTTP handlers. This
   task has not inspected or changed them. If public execution/other editors or
   unsafe copied 3.0 functions cannot be excluded, STOP. Do not run the old doGet,
   test/dry-run sync helpers, setup or refresh functions. Do not push the existing
   apps-script directory merely because its ignored clasp target is new.
3. Review a clean, minimal assembly and explicit spreadsheets.readonly scope.
   No broad write, Drive-write, Form, Properties or trigger-management operations.
   A separately authorized owner operation is required for any upload/assembly
   execution or Google authorization; nothing here uploads or changes settings.
   No web app or public verification endpoint. Keep all configuration owner-private.
4. In that isolated runtime, verify fabricated timestamp/DST cases, the actual
   column manifest, dependency call graph, denied writes and generic error/report
   behavior. Confirm Sheet timezone privately; test identity normalization without
   logging contacts. Do not silently parse locale-formatted timestamps.
5. Establish independently credible revision/completeness/capture authority,
   explicit aliases, per-week closure history, lifecycle decisions and accounting
   evidence. Resolve the recorded missing-pick accuracy/prediction constraints.
   If a trustworthy immutable capture requires any new production action, STOP
   and obtain specific approval; do not create snapshots/tabs or pause automation.
6. Only after all gates AND the exact owner authorization, a separately reviewed
   owner-only manual runner may perform one bounded verification. Its implementation
   is still disabled here. Never persist raw rows/snapshots/maps, log exceptions or
   return projector DTOs from that runner. Compare same-revision private normalized
   inputs; output only the report's fixed codes/counts. No production changes.
7. Review every mismatch/withheld/unavailable outcome privately. Record only generic
   check outcomes/blockers in PHASE5_PROGRESS.md. Do not change scores, standings,
   rules, aliases or payouts automatically. No public frontend connection follows
   from a successful private comparison; that requires separate approval.

## Stop and rollback

On unexpected access, write attempt, stale/incomplete capture, alias/closure doubt,
private output, runtime mismatch or any comparison discrepancy: stop immediately.
Do not retry with wider permissions, bypass a check, fix Sheet data or enable sync.
Discard in-memory data; retain only a non-identifying failure/check code. Keep the
real-read entry disabled and synthetic Pages serving the existing sealed artifact.
No production data rollback should be needed because no writes are permitted.
If a separately authorized owner session was opened, the owner can end it and
review/revoke only its verification grant/private assembly under separate approval;
do not alter existing production grants or resources as an automatic cleanup step.
If anything was accidentally exposed, stop sharing/logging, preserve a redacted
incident record, and request specific incident-remediation authorization. Do not
rotate credentials, rewrite history or change production settings automatically.

## Prepared coordinator — first owner-authorized read is still blocked

Owner now reports a successful source-only upload of the corrected isolated
package to the separate 4.0 project, containing only verification code/manifest.
This is owner-provided status, not remote inspection or permission to execute.
Local entry `verifyPerfectPick4Package_()` and delegated
`verifyRealCompetitionReadOnly_()` STILL return DISABLED unconditionally.

`tools/verification/prepared-diagnostic.cjs` adds runPreparedDiagnostic(dependencies,
config), a pure, injected coordinator exercised ONLY with fabricated inputs. It
reuses the bounded adapter, projector, strict contract, timestamp parser and owner
evidence builders. The generated package hides it inside privateRoot; only the
unchanged disabled diagnostic is globally reachable. No native Sheets connector,
configuration reader, enable flag, logging or live entry is supplied. Passing owner
claims/configuration to the existing entry cannot activate it.

### Smallest future activation (design; not implemented or authorized)

Use a separately reviewed, owner-editor-only manual call in the separate 4.0
project. Keep the public diagnostic disabled; no webapp, API executable, HTTP
handler, trigger, library export, custom function or browser transport. Do not
rely on a trailing underscore, boolean, shared token or an alias Map as owner
authentication. The project owner must privately establish sole-editor access and
absence of deployed/public entry paths, triggers and libraries. If this cannot be
proven, DO NOT activate. The current package intentionally has no activation path.

A minimal future bridge would privately inject ONLY:

- values.batchGet: a fixed wrapper around Sheets.Spreadsheets.Values.batchGet;
  no general service object, SpreadsheetApp, writes or arbitrary function dispatch.
- now: trusted clock; identityKey: explicitly reviewed private identity normalization.
- readEvidence(target): independent credible revision/completeness authority for
  that exact target/capture. Do not read extra tabs/metadata to improvise evidence.
- authorize(stage, scope): trusted owner-session capability, not a config/request
  callback. It must verify sole-owner isolation, reviewed effective read-only
  grants, exact target, column layout, weeks, timezone, freshness policy, revision,
  capture bounds and time-limited single-use approval. PREFLIGHT runs before any
  evidence callback; BOUNDED_READ includes the exact capture before Sheets access.

The injectable callback is a test seam, NOT implemented Google authentication or
proof of source authority. A caller controlling callbacks already controls all
service capabilities. No claim of proven real authorization follows from its tests.
New bridge code, private assembly validation, upload and execution each need their
own precise owner authorization. Do not switch the existing diagnostic with a flag.

### Exact private inputs — outside Git, Pages, logs and chat

Coordinator config has EXACTLY target, timeZone, revision, maxAgeMs, layout,
policy, aliases and closures; unknown top-level keys reject. No private config
file is generated or committed. Future private assembly location/storage requires
review; this task does not read/write Script Properties or add a config loader.

- target: privately verified spreadsheet identity, separate from the 4.0 script
  target. timeZone: confirmed competition/Sheet IANA zone; no default. maxAgeMs:
  explicitly approved positive freshness budget; revision: nonnegative safe integer
  changed for results, alias/closure/accounting corrections. Neither is evidence
  merely because it is configured. Numeric/local timestamps use the existing
  configured-zone parser; ambiguous DST/local formats stop rather than guess.
- layout: season, Results and Responses descriptors as specified above and in
  SHEETS_READ_ADAPTER.md. Exact real tab/column/header coordinates remain UNVERIFIED.
  Results selects only Week, Game, Team 1, Team 2, Winner, Status and the two scores.
  Responses selects Timestamp, private Phone Number join, approved weekly matchup
  columns and designated monthly-ending prediction columns. Never Name/notes.
  Columns are single-column ranges, row 1 headers then bounded rows from row 2.
- policy has EXACTLY games, teams, periods, seasonWeeks, decisions and accounting.
  Maps explicitly bind legacy matchup/team labels to independent public game/team
  keys; periods define start/end weeks and designated game; seasonWeeks defines
  included scope. Decisions need revision/freshness-bound completion evidence;
  accounting needs independently approved cents/status evidence per contract.
  Empty decisions/accounting Maps mean unknown, never fabricated winners/payment.
- aliases: each record is privateKey, player, alias, approved:true, revision.
  Every alias is separately owner-approved; public keys independent of contacts.
  Exact duplicates, invalid approval or no aliases block before reading. A missing
  entrant discovered in a bounded read withholds its affected player scope; the
  diagnostic never returns its identity or a partial player list.
- closures: each record is week, snapshotRevision, closureRevision, status,
  mechanism, verifiedClosed, checkedAt, validUntil, deadline (nullable). Exact
  CLOSED + OWNER_VERIFIED_CLOSURE + verifiedClosed:true, matching revision, fresh
  checkedAt and unexpired validity is required for EVERY requested week before
  ANY Sheet read in this coordinator. Unknown/open/unverified/history guesses
  block; elapsed deadlines/old weeks never count. Owner must independently prove
  historical closure and revocation/reopen handling, not merely set these literals.
- readEvidence returns EXACTLY revision, observedAt, validUntil, resultRows,
  responseRows and quiescent:true. Results bound 1–400; Responses bound 0–1000.
  Both timestamps canonical/fresh; revision matches policy. Independent approved
  provenance is mandatory. All three evidence observations (authorization preflight,
  adapter before/after) must match, including bounds. No widening after approval.
  Static numbers/equal reads/guard cells/fresh timestamps cannot prove authority.

### Report and read budget

After preflight the existing adapter issues at most four Values.batchGet calls:
headers then bodies, repeated once. It reads only descriptor-selected columns and
adds one overflow guard to Results Week and Responses Timestamp. Headers/columns,
responses, freshness and capture consistency are checked; no metadata enumeration,
full-sheet export or fallback read. The extra evidence preflight makes three
independent evidence checks; the future implementation must also be bounded and
read-only. Rejected preconditions issue ZERO Sheets calls. Header/partial/stale/
conversion failures stop with a generic redacted result; no automatic retries.

The projector validates; the coordinator validates again against approved aliases,
closure/accounting policy and completion-time freshness. Its aliasCompleteness
trust allows complete sets only: the projector independently suppresses affected
scopes when an unmapped entrant exists. It never returns the projection itself.
Exact result keys are state, validation, readiness, counts. Counts keys are weeks,
games, finalGames, availableScopes, withheldScopes. All are nonnegative integers.
States BLOCKED/INCOMPLETE/VALIDATED_READ and readiness NOT_ESTABLISHED/WITHHELD/
PRIVATE_COMPARISON_REQUIRED are fixed labels. VALIDATED_READ means schema-valid
bounded input only, NOT 3.0 parity, production truth, authorization or publication
approval. No baseline/oracle comparison is invented; use the existing data-only
redacted comparator later with separately authorized ephemeral same-revision inputs.
No player counts/names/aliases, contacts, IDs, ranges, timestamps, raw picks,
predictions, points, money, notes, payloads or exception messages are returned.

### Exact owner-controlled continuation and rollback

1. Review this design; privately verify the separate 4.0 target, sole owner/editor
   access, no deployments/public execution, triggers, unsafe source or libraries.
   Keep current disabled upload; DO NOT run a real read yet.
2. Privately inspect existing Sheet headers/timezone only under separately explicit
   authorization; no metadata/header discovery is authorized here. Resolve precise
   coordinates, identity normalization, independent capture/revision/completeness,
   complete alias approvals and CLOSED history. If authority cannot be established
   without production changes, STOP and request a separate capture plan.
3. Request a focused implementation/review of the private bridge described above,
   with those gates resolved. Then approve exact private assembly bytes, target,
   bounded ranges/row limits, weeks, revision, time window and one execution. No
   upload/execution is implied by this preparation. Never upload apps-script/src.
4. Before authorizing that future execution, review manifest AND effective grants
   in the isolated owner's UI: ONLY spreadsheets.readonly, no broad spreadsheet,
   Drive, Forms, external-request or identity/email scope. The only advanced
   service is Sheets v4. No OAuth flow occurred here. Resolve stale grants for the
   verification project separately; never change production grants automatically.
   Test fabricated Intl/DST/runtime and denial cases there before real input.
5. Only after NEW authorization for the precise first read, manually execute the
   reviewed owner-only runner once in the isolated editor. Inspect ONLY its returned
   redacted report privately using a debugger breakpoint AFTER the coordinator
   returns. Do not add Logger/console, persist output, expand raw inner frames,
   publish an endpoint, paste personal data or screenshot private config. Stop on
   BLOCKED/INCOMPLETE; do not bypass checks or widen permissions/ranges.
6. Record only fixed outcomes/counts/blockers in the checkpoint; do not certify
   parity without independently normalized same-revision baseline/oracle evidence.
   Discard ephemeral inputs; remove the temporary private bridge/config and restore
   the sealed disabled package under separate approval. End the owner session;
   review/revoke only verification-specific grants if separately approved. No Sheet
   rollback is needed because writes are prohibited. Never modify 3.0 resources.

Remaining real-read blockers: unproven owner-only bridge/remote effective scopes,
actual coordinates/timezone/runtime parity, credible independent capture authority,
alias/history closure approval and exact one-read authorization. Missing accounting,
completion and champion oracle block the corresponding parity claims. Synthetic
Pages and all public-live-integration blockers remain unchanged.

## Functional native connection — current implementation (supersedes bridge TODOs)

The owner connection is now IMPLEMENTED in tools/verification/owner-connection.cjs,
assembled privately by the existing builder. No real read or upload occurred in
this task. Earlier sections describe historical preparation; the current entry is
DISABLED BY DEFAULT rather than permanently incapable of activation. The pure
legacy verifyRealCompetitionReadOnly_ helper remains unconditionally disabled.

Important platform constraint: SpreadsheetApp.openById requires the spreadsheet
editing scope in Google's official reference. It cannot satisfy the requested
readonly manifest. This implementation therefore uses the existing Apps Script
Advanced Sheets v4 service, with ONLY spreadsheets.readonly. No SpreadsheetApp,
extra OAuth scope, UrlFetch workaround or access token is introduced.
Official references: [SpreadsheetApp scope](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openById(String)),
[metadata GET](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get),
[bounded values GET](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet).

### Implemented execution boundary

verifyPerfectPick4Package_ ignores arguments and uses a private source provider,
loadPrivateOwnerConfig, whose shipped implementation returns null. It does not
read global variables, request inputs, Script Properties, files or Sheet cells for
configuration. Absent/disabled configuration returns the existing DISABLED status
without resolving Sheets. No HTTP handlers, deployed execution API, triggers or
public frontend changes. Nothing is enabled by uploading the default package.

Owner-only access relies on Google project/editor access control: the owner MUST
privately confirm sole-editor access, no deployments/API execution/libraries or
triggers and minimal effective grants. Config booleans attest that review; they
are NOT independent identity authentication. An editor controlling source can
change any guard. No email/identity scope is requested. If that project isolation
cannot be established, leave null and do not execute. No remote settings were
inspected or changed here.

The diagnostic permits only one ACTIVATED attempt per execution context and a
maximum five-minute activation window; every metadata/value call and completion
checks the window. Each new Apps Script execution has fresh memory, so this is
NOT persistent single-use across runs. Owner must disable private configuration
immediately after the authorized run and never schedule or repeatedly invoke it.
No Properties/locks/counters or production mutations enforce persistent state.

### Private source configuration (never commit or share)

Only in the OWNER'S REMOTE ISOLATED EDITOR, replace return null between the
BEGIN/END OWNER-PRIVATE CONFIGURATION comments with a returned plain object.
Do not edit the local sealed package, normal apps-script/src or tracked provider
with private values. No extra .gs/config file is required. The exact top-level keys:

- activation: exactly enabled, soleOwnerReviewed, noPublicExecutionReviewed,
  readOnlyGrantsReviewed, notBefore and expiresAt. Booleans must be true for a
  read. Canonical UTC timestamps bound the specifically approved run; interval
  at most five minutes, now inside it. Keep enabled false until actual authorization.
- mode: STRUCTURE for the first read; VERIFY only for a separately authorized full
  bounded verification. No arbitrary actions or write mode.
- competition: exactly the prior coordinator config: target, timeZone, revision,
  maxAgeMs, layout, policy, aliases, closures. Exact layout and policy descriptors
  still apply. Use confirmed real column coordinates, not synthetic letters.
  A valid game/team/period descriptor layout is required even in STRUCTURE mode;
  headers are matched against that bounded manifest, not auto-discovered wholesale.
  aliases/closures may be empty arrays in STRUCTURE mode. Target and all private
  aliases/joins belong ONLY in the private remote provider. No names are derived.
- capture: null for STRUCTURE without source authority, otherwise the exact
  revision/observedAt/validUntil/resultRows/responseRows/quiescent evidence object
  documented above. captureAuthorityReviewed: explicit owner confirmation of
  independently credible source authority; never set true merely to pass a test.
- identityFormat: EXACT_TEXT only. Raw text must match the privately approved
  alias registry key exactly. No name fallback, automatic phone conversion or
  guessing leading zeroes. Confirm actual private join representation beforehand.

Owner-configured capture evidence is immutable for this execution and rechecked
by the existing adapter. It is NOT a dynamic revision source: live changes inside
an independently guaranteed quiescent window must be ruled out externally. A
constant configured revision, three equal attestations, equal reads, guards or
metadata capacities do not prove source completeness/atomicity. VERIFY stays
blocked unless the owner has genuine independent authority for the exact target,
bounds, revision and time window. No mechanism modifies production to create it.
Missing accounting/decision evidence stays unknown; it never means zero or paid.

### First-run reads and privacy-safe result

STRUCTURE reads one metadata request restricted to Results/Responses A1, with
fields limited to spreadsheet timezone and selected sheets' title/grid capacities;
no grid data, sheet IDs, document title or extra tabs. It then reads ONLY the exact
selected single header cells with a values field mask. No timestamp/contact/pick/
prediction body cells. Unknown titles/headers are compared privately, never echoed.
The result reports expected/discovered tab COUNTS and expected/matched column
COUNTS, never actual tab/header strings. Any mismatch returns fixed BLOCKED output.
Timezone is MATCH only when actual metadata matches the configured parser zone.
Timestamp compatibility remains NOT_CHECKED until real bounded timestamp records
are validated in VERIFY; timezone match alone is not timestamp evidence.

VERIFY first requires capture authority, fresh revision/bounds, approved aliases
and authoritative CLOSED evidence for every selected week. It performs the same
metadata/header check, then the existing coordinator/adapter/projector/validator
pipeline through a wrapper enforcing exact target, reviewed ranges/options,
no duplicate ranges, row limits and at most four additional values calls. Total
maximum: one metadata call and five values calls. Known-tab single-column paths
only; one overflow guard per primary Results Week/Responses Timestamp column.
Response field masks omit spreadsheet ID and all metadata except required fields.

Exact report keys: state, structure, records, timeZone, timestamps, closure,
aliases, revision, schema, comparison. No player-level DTO is ever returned.
Structure has expectedTabs/discoveredTabs/expectedColumns/matchedColumns counts.
Records has results/responses (null unless validated), completeness fixed label.
Raw response-row counts are PRIVATE diagnostics, never player counts/unique player
identities and never public website data. STRUCTURE always leaves row counts null,
completeness UNVERIFIED and comparison BLOCKED; sheet capacity is not a record count.
VERIFY returns authority-supplied bounded counts only after contract validation;
unavailable/partial/alias-incomplete results cannot pass comparison readiness.
READY_FOR_PRIVATE_COMPARISON means a valid bounded read, NOT actual 3.0 parity,
payout correctness or public release authorization. No names, aliases, contacts,
private IDs, timestamps, header text, raw picks/predictions, notes or errors escape.
No logging/persistence, endpoint or browser response exists. A blocked read may
hide partial progress deliberately rather than return private error details.

### Exact owner-controlled sequence — no operation authorized automatically

1. Review code/tests, then explicitly authorize a source-only upload to the separate
   owner-only 4.0 project. Recheck the documented Node preflight, target/rootDir dot
   and exact ignored inventory. Future commands, NOT executed in this task:
   from repository root run node tools/verification/package.cjs verify, run the
   documented isolated Node preflight, then change directory to
   /Users/manny/orca/projects/NFL-Perfect-Pick/tmp/verification-upload and run
   clasp push ONLY under that upload authorization. Do not deploy or use src.
   Uploadable project files are ONLY Verification.gs and appsscript.json;
   local ignored .clasp.json is configuration, not an uploaded script asset.
2. Privately verify the uploaded manifest and actual effective grants: ONLY
   spreadsheets.readonly; reject editing, Drive, Forms, external request or identity
   scopes. Advanced Sheets v4 must be enabled. If authorization asks for more, STOP.
   Owner-only project review must pass before entering any private config.
3. Under NEW explicit first STRUCTURE-read authorization, privately fill the remote
   provider with confirmed descriptors and a fresh short activation window. Leave
   capture null, aliases/closures empty when unavailable; no evidence fabrication.
   Review the private delta only (provider change), preserving all other code and
   manifest. Active private code intentionally differs from the public/default
   integrity seal; the generic local inspector rejects private variants. Do NOT
   weaken that inspector or copy private code to Git/local publication artifacts.
4. Manually run verifyPerfectPick4Package_ once from that owner editor, accepting
   ONLY the reviewed read-only authorization. Use a debugger breakpoint at the
   entry's return report line to inspect ONLY report privately. Never log output,
   expand raw frames, screenshot configuration, schedule execution or deploy.
   Disable the private provider immediately afterward. No real read was done here.
5. Resolve any structure/timezone mismatch privately without editing the source
   Sheet. For VERIFY, separately obtain capture authority, approved alias registry,
   exact CLOSED history, freshness/revocation and identity/time codec approval.
   Obtain NEW authorization for those exact bounds/week/revision/window, then
   activate VERIFY and repeat the single manual inspection/disable sequence.
   If any evidence is missing, retain STRUCTURE/disabled mode; do not bypass gates.
6. Rollback is owner-controlled restoration of return null in the remote provider
   (or separately approved re-upload of the sealed disabled two-file package),
   ending the session and reviewing only verification-specific grants. No data
   writes occurred, so no production data rollback is needed. Do not alter 3.0,
   Forms, triggers or existing production grants. Record only redacted outcomes.
