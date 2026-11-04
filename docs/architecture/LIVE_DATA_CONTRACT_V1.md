# Phase 5B — public read contract v1 (offline specification)

Status: specified and exercised offline; NOT connected, deployed or approved for
real data. Uses Phase 5A findings in docs/migration/PHASE5_PROGRESS.md, without
repeating that audit. No production interfaces, identifiers or data are fixtures.
The current six-file synthetic website and its validator remain unchanged.

`tools/contracts/live-contract.cjs` is the executable specification, not an Apps
Script implementation, reader, API endpoint or browser adapter. It has no I/O,
logging, mutation service or dependencies. `tests/support/live-contract-examples.cjs`
constructs nine invented examples; tests use an explicit fixed clock and invented
approval/evidence maps. None of these files are published to Pages.

## Exact transport and primitive rules

Use a single coherent read snapshot. This specifies payloads, not endpoint URLs,
authentication, a live fetch mechanism or a submission service. Every object rejects
unknown own keys recursively, including notes, extensions and internal linkage.
No object spreading from source data. Reject the whole candidate before publishing
if invalid; never log its payload or return raw exception text. The only validator
error is `Invalid public contract`. A future server constructs a safe unavailable
response after validation failure; this validator does not sanitize or repair data.

Notation below: all fields required unless `?`; `null` explicitly means unknown,
not zero/false. Optional means omit the property, never undefined in serialized JSON.
An empty collection means verified none; it must never stand for withheld data.

- Counters/points/scores/money: nonnegative safe JSON integers, never numeric strings,
  NaN, Infinity, fractions or booleans. Revision is a public nonsecret counter.
- Time: canonical UTC ISO string with millisecond precision; validate calendar time.
  Source revision changes on corrections, entry-state/alias/accounting changes.
- Week: integer 1–18. Season: integer 2000–2200 (transport guard, not a rule change).
- Public player/game keys: `p_` / `g_` followed by 8–32 lowercase alphanumerics.
  Provision independent public keys; never reuse/harden/hash contacts, response,
  spreadsheet, script or provider event identifiers. Approval registry validates
  exact player-key/alias pairing; a label-format check is insufficient approval.
- Alias: explicitly approved label, 1–48 ASCII letters/digits/spaces/hyphens,
  beginning with a letter, optionally ending with one terminal period to support
  the owner-approved first-name/last-initial format. A missing mapping withholds identity-bearing scopes;
  no real-name fallback, abbreviation or contact hash. No submitted/registry name is automatically converted or approved. This targeted
  format extension preserves strict alias mapping and all other v1 fields.
- Team: canonical NFL abbreviations enumerated in the executable specification;
  two different valid teams per matchup. No arbitrary spreadsheet strings.
- Competition keys: W1–W18; M1–M99; S plus a four-digit season. These are public
  labels, never infrastructure or internal database identifiers.

`normalizeScore` is a separate import-normalization rule: blank/whitespace/null/
absent => null; trimmed decimal integer strings => validated integer, including
"0" => 0. Reject negative/fractional/exponential/hex/unsafe values. Public JSON
itself must already contain normalized numbers. Invalid known FINAL evidence is
unavailable; do not invent a score or silently turn FINAL into a different status.
Predictions are normalized nonnegative safe integers or null; invalid/missing
legacy prediction strings become ineligible null in a future projection, never
zero. No new gameplay prediction range is introduced here; owner review of actual
Form eligibility constraints remains a live-integration prerequisite.

## Envelope

Required: `version: "pp4-public/1"`, `revision`, `generatedAt`, `state`.

- READY additionally requires `season`, `scoringBasis: "SUBMITTED_FINAL_PICKS"`,
  `weeks[]`, `games[]`, `standings[]`, `months[]`, `prizes[]`. No `reason`.
- UNAVAILABLE requires `reason`: STALE, UNVERIFIED, INVALID_RESULTS, MISSING_ALIAS,
  or INCONSISTENT. No READY fields, stale payload, cached names, notes or details.
  Generate this envelope freshly even when its underlying data is stale.

Each timestamp must be at/before the trusted evaluation clock. The server supplies
`maxAgeMs` outside the public/request payload; examples use five minutes, not an
approved production freshness policy. Generated time and game verification time
must be within that budget. Timestamp checks alone do not prove source truth:
a future server must read coherent authoritative revisions and establish trust.
An old final score may be republished only after fresh authoritative verification,
not by refreshing its timestamp without checking the underlying result.

## Weeks and authoritative entry evidence

Week record: `week`, `entry`; optional `picks[]`, `votes[]` only after CLOSED.
`entry` requires `status: OPEN|CLOSED|UNKNOWN|UPCOMING`,
`authority: OFFICIAL|UNVERIFIED`, `revision`, `checkedAt`, `validUntil`,
`deadline: timestamp|null`. Closure must match trusted server evidence for the
exact week, have OFFICIAL authority, fresh checkedAt and an unexpired validUntil.
The executable validator receives that evidence in a separate server-owned Map;
it cannot be accepted from query parameters, a browser, or the public JSON itself.

A production closure service must establish successful official closure for the
applicable entry period, preserve per-week historical evidence, bind its revision
to the snapshot and detect reopen/revoke. Neither elapsed deadline, kickoff,
older-week ordering, current Form Control row, copied Script Properties nor the
literal word CLOSED independently proves historical closure. Ambiguous/stale/
conflicting evidence returns UNKNOWN/WITHHELD or an unavailable envelope.
A false CLOSED claim is rejected, not silently trusted. Non-CLOSED evidence may
be unavailable/stale only when it authorizes no disclosure; show UNKNOWN when
fresh OPEN/UPCOMING authority cannot be established.

Cache keys must include snapshot, closure and alias-approval revisions. Revalidate
state/freshness before every sensitive response, including cache hits, exports,
errors and alternate actions. Reopen/approval revocation invalidates affected
cached data immediately. Validate all response paths server-side, not just the UI.

## Games/results

Game: `game`, `week`, `home`, `away`, `kickoff: timestamp|null`,
`status: SCHEDULED|IN_PROGRESS|PENDING|FINAL`, `homeScore: integer|null`,
`awayScore: integer|null`, `winner: HOME|AWAY|TIE|null`, `verifiedAt`.

Keys unique, week present in weeks. FINAL requires both numeric scores, a safe
combined total and the exactly consistent winner (including a tie). Every other
status requires winner null; any supplied scores are provisional and award no
correctness or points. Use PENDING when the legacy source cannot distinguish live
states. Do not fabricate kickoff, records, scores or SCHEDULED/IN_PROGRESS status.
Game metadata is public independently of entry closure; selections are not.

## Player picks, predictions and voting

After explicit CLOSED only:

- Pick row: `player`, `alias`, `selections[]`; optional `prediction`.
- Selection: `game`, `team`, matching this week's actual matchup; unique per player
  and game. Each approved player appears at most once after authoritative private
  deduplication/resubmission selection. No submission identity/timestamp is public.
- Prediction: `game`, `total: integer|null`; designated game in the same week.
  Null is ineligible. No raw question text, entered free text or private keys.
- Vote row: `game`, `total`, `teams[2]`. Each team entry: `team`, `count`,
  `basisPoints`. Counts reconcile exactly to valid published selections, one vote
  per approved player/game. Both teams required, including zero counts. For votes,
  home share = round(home / total × 10000), away = 10000 − home; at zero total both
  shares zero. Percentage = basisPoints / 100. Counts never mean winning chances.
  Votes require the complete matching published selection set, not partial rows. The trusted
context must separately attest aliasCompleteness per week; false/missing forbids
picks/votes and AVAILABLE standings even if an unapproved player was omitted
from the candidate. This attestation comes from source validation, not the request.

Before CLOSED omit these properties entirely, even empty arrays, submitted flags,
counts, predictions, hidden JSON, attributes, summaries or download content. If
any required alias is unapproved, omit the entire affected player set and voting;
do not drop that person and publish a misleading partial ranking or denominator.

## Weekly/monthly/season standings

Scope record: `scope: WEEKLY|MONTHLY|SEASON`, `key`, unique nonempty `weeks[]`,
`state: AVAILABLE|WITHHELD`; AVAILABLE requires `rows[]` and forbids reason;
WITHHELD requires `reason: CLOSURE_UNVERIFIED|MISSING_ALIAS|INCOMPLETE`, no rows.
Weekly key matches its one week; season key matches season. All contributing weeks
must be CLOSED to publish AVAILABLE. Season-to-date may list only contributing
closed weeks, clearly labeled as a partial season. Do not award a season payout
until all 18 weeks have finalized. Monthly scopes cover the full period defined
below; withhold when any configured week lacks closure, rather than leak entries.
This conservative v1 policy may withhold early monthly standings; changing to a
closed-weeks-only partial-month contract requires an explicit reviewed extension.

Row: `player`, `alias`, `rank`, `points`, `completedGames`;
optional `totalPicks`, `accuracyBasisPoints` (integer or null).
Points <= completedGames <= totalPicks when present. Descending points determine
competition ranks 1,1,3; equal-point order never chooses a champion. Weekly completed
counts cannot exceed final matchups. When picks are supplied, points/completed
counts must reconcile to those selections and FINAL results; NFL ties count as
completed selections with neither team correct. Monthly/season totals reconcile
exactly to included AVAILABLE weekly rows, preserving the same participants.

`SUBMITTED_FINAL_PICKS` explicitly preserves legacy completedGames semantics:
only submitted selections with a nonblank FINAL winner count in its denominator.
Accuracy = points/completedGames; zero => null/em dash. Basis points use round(ratio
×10000), display may round further. This does not authorize changing the legacy
denominator to all scheduled games. The approved presentation wording and missing-
pick behavior require owner confirmation before live integration. Tiebreakers
never change points, completed counts or ranks.

## Monthly decisions

Record: `key`, `startWeek`, `endWeek`, `competitionComplete`, `designatedGame`
(public key or null), `state`, `winner` (player key or null), `actualTotal`
(integer or null), `method: NONE|POINTS|COMBINED_POINTS`; conditional `comparisons[]`.
Every monthly scope has exactly one decision; its weeks exactly cover the inclusive
period. competitionComplete is a verified competition-lifecycle marker, not
permission to skip FINAL checks or an alias of legacy allWeeksFinalized. A designated game must be in the ending week. No month-name/order shortcut.

The offline validator derives the required decision from snapshot evidence:

1. Incomplete period marker, unverified closure/standings/configuration or no
   completed standings => IN PROGRESS, no winner/comparisons, method NONE.
2. Only designated game unfinished => AWAITING FINAL SCORE; never award yet.
3. All required games coherent FINAL, all weeks CLOSED and totals reconciled:
   unique points leader => MONTHLY CHAMPION, method POINTS.
4. Tied first-place leaders: compare eligible predictions for the designated FINAL
   game to actual home+away score. Required comparisons contain every tied leader:
   `player`, `prediction: integer|null`, `difference: integer|null`. Invalid/missing
   predicts null, ineligible. Uniquely lowest absolute distance wins, method
   COMBINED_POINTS. Equal minima => UNRESOLVED TIE. None eligible => NO ELIGIBLE
   TIEBREAKER. No name, array or submission-order fallback.

Only step 4 publishes actualTotal/comparisons. No comparisons while protected or
unfinished. Champion's approved alias/points come from the monthly standings;
winning error/margin can be derived from comparisons. No payment is implied.
Manual tie decisions require a separately approved audited extension; v1 leaves
these ties unresolved and cannot award a monthly allocation.

## Prize accounting

Record: `key` matching a standings scope, `currency: USD`,
`poolCents: integer|null`, `poolState: UNAVAILABLE|PROJECTED|CONFIRMED`,
`allocationState: UNAVAILABLE|PENDING|CONFIRMED`, `paymentState: UNKNOWN|UNPAID|PAID`;
conditional `allocations[]`, optional `rollover`, `projectedPoolCents` and `funding`.
Optional projectedPoolCents is integer/null, independently authoritative; it allows
a confirmed season pool and a distinct projected season total in the same record.
Optional monthly funding requires rolloverCents, monthlyPrizeCents,
seasonContributionCents, monthlyShareBasisPoints and seasonShareBasisPoints.
Amounts are integer cents; shares are integer basis points summing to at most
10000. Monthly prize amount matches the pool, allocated shares cannot exceed
rollover funding. Every field requires accounting evidence; no new split is derived.

UNAVAILABLE pool requires null; other pools require numeric cents. No floating
currency arithmetic or missing-to-zero conversion. A future legacy importer must
normalize approved monetary decimals exactly to cents with explicit rounding
policy; Phase 5B does not implement or change financial calculations.

Every non-null pool or confirmed accounting/payment/rollover assertion must match
the trusted server-owned approved public accounting projection for that scope.
The underlying private ledger/provenance is never returned. Evidence is not the
same as candidate response self-assertion. Missing evidence => unavailable/pending/
UNKNOWN. Legacy zero monthly payout placeholders never count as evidence.

CONFIRMED allocations require CLOSED/final scopes and CONFIRMED pool; allocations
are `{player,cents}`, approved participants only, unique, sum <= pool. Weekly
allocations name exactly the perfect-pick winners (points/completed/total picks
all equal scheduled matchup count). Monthly allocation has one confirmed champion
and no unresolved tie. Season allocation additionally needs all 18 weeks final;
its distribution must be authorized accounting evidence, never invented ratios.
UNPAID/PAID requires both confirmed allocation and authoritative ledger evidence;
UNKNOWN never means unpaid. Payment details and transaction linkage stay private.

Rollover: `{to,cents}`, only from confirmed final weekly no-perfect outcome to its
containing monthly scope, full approved weekly pool, confirmed empty allocations,
unknown payment state. Evidence must authorize the applicable rule; no OLD/NEW
financial rule is inferred or rewritten. Unavailable rollovers are omitted rather
than reported as zero. Monthly pool and season contribution are separate scope
accounting facts; confirm projected/confirmed amounts independently of champions.
A ledger refinement for contribution provenance can be reviewed later; no private
notes or arbitrary extra ledger fields are allowed in v1.

## Deterministic private comparison contract

`comparePublic` compares two validated normalized public snapshots at the same
season/revision. It accepts separate trusted candidate evidence via candidateTrust
when the two independently normalized accounting projections differ, so a valid
calculation discrepancy can be reported rather than bypassing evidence checks.
Canonical sorts ignore row order while retaining competition
ranks, points, completed counts and public player pairing. Future legacy mapping
must happen in a protected process using same-revision source evidence, no public
legacy endpoint calls. Use request-local random comparison handles/approved public
keys for pairing; never hash contact data or log mappings. Inputs may only be
authorized ephemeral values; nothing is persisted by the comparator.

Checks are fixed codes SCORES, RANKINGS, PRIZES, CHAMPIONS; each returns MATCH,
MISMATCH or NOT_COMPARABLE. Scores compare matchup/team/status/score/winner;
rankings compare scope/weeks/participants/points/rank/completed/total picks;
prizes compare cents, accounting statuses, allocations and rollover destination;
champions compare period completion/designated game/state/winner/actual score/
method/prediction distances. Aliases, freshness timestamps and optional accuracy
are not scoring comparison keys. Invalid candidates fail validation before a
comparison, with only the generic error; they are not falsely reported MATCH.

Different season/revision or unavailable input => NOT_COMPARABLE. Legacy lacks a
resolved monthly champion/payment oracle: champion check is NOT_COMPARABLE by
default; only an independently approved rules/manual-evidence oracle can enable it.
No missing oracle can silently produce an overall MATCH. Overall MISMATCH wins,
else any NOT_COMPARABLE wins, else MATCH. Comparison output includes only fixed
codes/states—no aliases, keys, values, predictions, money, raw exceptions or diffs.
Treat publication suppression, stricter finality and absent accounting as explicit
non-parity conditions, not reasons to alter game rules or repair production data.

## Required gates still open

Owner approval of alias registry, historical closure authority/freshness policy,
missing-pick denominator wording, live prediction constraints, accounting and
independent champion oracle. A future isolated read-only reader and source-revision
proof need separate authorization/testing; this validator does not establish
Google permissions, remote deployment parity or real-world correctness. No
production data is certified by offline synthetic success. Preserve current
synthetic artifact/runtime until a separately reviewed integration is approved.
Custom submissions, backend execution, deployment and Phase 5C are not started.
