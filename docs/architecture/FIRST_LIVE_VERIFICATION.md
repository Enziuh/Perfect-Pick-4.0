# Controlled verification preparation — local, fabricated inputs only

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
