# Phase 5C — isolated fabricated-input projector

Implemented locally; NOT deployed, uploaded, connected to Google, or approved for
real data. No Apps Script file, browser asset, deployment workflow, contract-v1
schema or scoring rule was changed. No dependency added.

## Small read-only surface

- `tools/projector/project-competition.cjs`: `projectCompetition(source, policy)`.
  Pure projection; new public objects only, no mutation, persistence, network,
  logging, native Google services or dynamic action dispatch.
- `tools/projector/monthly-decision.cjs`: pure monthly decision helper. Points
  first, FINAL-only evidence, eligible combined-score distance, equal closest
  unresolved. Does not adjust rank, allocate funds or record a payment.
- `tools/projector/read-only-reader.cjs`: `projectFromReader(reader, policy)`.
  Reader exposes exactly one own data property, synchronous `readSnapshot`.
  Accessors, async functions and extra actions are rejected. Reader exceptions
  return a fresh UNAVAILABLE/UNVERIFIED envelope, without exception details.

The reader is a capability boundary, NOT a guarantee that arbitrary injected code
is harmless. Only fabricated in-memory readers exist here. Future implementation
must independently audit source access, OAuth scopes, coherent snapshots and
absence of writes; a copied backend/new Script target does not satisfy that gate.
No legacy setup, trigger, Form, cache, diagnostic or score-sync function is imported.

## Fabricated source shape

`tests/support/projector-examples.cjs` constructs private, invented legacy-shaped
inputs, distinct from already-public Phase 5B examples:

- Top level: revision, observedAt, season, games, weeks. Raw legacy prize objects
  may exist but are ignored; zero payout placeholders prove nothing.
- Game row: week, matchup label, team1/team2, status, winner, team1Score/team2Score,
  verifiedAt, optional kickoff. These resemble Results-sheet values: scores may
  be digit strings or blank. Fresh verifiedAt represents source verification,
  not a guessed refresh time or an unverified old Sheet update timestamp.
- Week: week number and submissions. Each private submission has an opaque join
  identity, timestamp, selections [{game,pick}], optional prediction {game,value}.
  No actual contact information or production identifiers are in examples.
- Raw names, phone/email fields, notes, arbitrary metadata, private IDs, stale
  per-pick correctness flags and unknown fields are never copied or used as public
  text. Poison-getter tests establish irrelevant private fields are not read.

A future authorized ingestion stage must explicitly map raw Sheet columns to this
internal shape and attest completeness, without downloading records into Git.
This stage is not implemented. The projector never opens the original Sheet/Form.

## Trusted policy (not browser/request authority)

Required: valid evaluation now, positive maxAgeMs, snapshot revision; server-owned
Maps aliases, closures, completeWeeks, games, teams, decisions, accounting;
configured periods and seasonWeeks. Missing/invalid context is a value-free policy
error or unavailable response, never fallback to a live service.

- aliases: private join key -> independently provisioned public player key,
  approved display alias, explicit approved:true. No name fallback or contact hash.
  Unapproved/colliding aliases withhold the entire affected weekly scope and all
  dependent aggregates. Source names cannot grant approval.
- games: approved private week/matchup label -> public game key/week/home/away.
  teams maps approved source spellings to canonical NFL abbreviations. Normalize
  case/whitespace, reject ambiguous/unknown mappings and duplicate result rows.
  The configured slate must match all supplied source result rows; never silently
  drop an unknown result. Missing/fractional/contradictory FINAL scores or missing/
  stale verification makes the response UNAVAILABLE/INVALID_RESULTS.
- closures: per week {snapshotRevision,entry}. Entry is contract-v1 official
  status/revision/checkedAt/validUntil/deadline. CLOSED only when exact official
  evidence is current, unexpired and bound to this snapshot revision. Otherwise
  UNKNOWN or verified OPEN/UPCOMING. Deadline alone never authorizes disclosure.
  The fresh UNKNOWN checkedAt describes this evaluation, not an invented official
  closure event; revision zero here means no verified closure revision.
- completeWeeks: explicit true only after a complete source read. If missing/false,
  selections and standings remain withheld; empty rows are not a substitute for
  an incomplete read. Projection determines alias completeness from all eligible
  fabricated entrants, rather than trusting a raw response flag.
- periods: public key, inclusive start/end weeks and approved designated game key
  (or null). decisions supplies complete:true, snapshotRevision and fresh verifiedAt
  for each competition lifecycle marker. Missing/unverified completion evidence
  leaves champion IN PROGRESS even if scores are FINAL. Ranking points unaffected.
- seasonWeeks: explicit included weeks, preserving v1 closure rules. If future
  weeks are included before closure, the scope is withheld; do not pretend the
  resulting subset represents final season standings.
- accounting: scope -> {snapshotRevision,verifiedAt,value}. Value contains only
  separately approved contract-v1 accounting facts in cents. Every output field
  is copied explicitly; notes and transaction/internal linkage are excluded.
  Missing/stale evidence yields unavailable amounts and UNKNOWN payment. Only
  explicit confirmed allocations/ledger state can establish UNPAID/PAID. Invalid
  or contradictory accounting (including a paid unresolved champion) fails closed.
  No payout, percentage split, currency conversion or rollover is invented.

This policy is fabricated in tests. Production alias approval, closure authority,
source revision, completeness, lifecycle completion, freshness and accounting
provenance are NOT established by constructing a Map or passing validation.

## Scoring, privacy and failure behavior

Before closure, weekly projection returns before touching submissions. Picks,
predictions, vote counts/percentages and associated participation are absent;
weekly/monthly/season scopes affected by withheld weeks stay WITHHELD. No hidden
JSON or cache stores a previous response. Reopen/approval revocation takes effect
on the next call; there is no session cache to retain private output.

Latest private submission per player/week wins; equal timestamps retain the last
encountered row, matching the Phase 5A documented legacy behavior. Selection-less
records do not become weekly entrants. Duplicate/invalid selected matchups or
unverifiable timestamps withhold that week's data, rather than publish a partial
ranking. Missing/invalid predictions normalize to ineligible null, never zero;
valid zero remains zero. Unknown fields are ignored on private input; unknown
fields in public output are rejected by the unchanged Phase 5B validator.

Points and completedGames are derived from valid submitted selections on coherent
FINAL games; NFL ties complete a selection and award neither team a point. Zero
completed games gives null accuracy. Shared ranks remain shared. Final status,
winner and score evidence cannot be inferred from per-pick flags. Source freshness
or revision failures produce only controlled unavailable envelopes. The public
projection is validated before return. Nothing logs private exceptions or values.

## Frontend compatibility: semantic, not wire-ready

Test-only `projector-frontend-needs.cjs` maps projected values into existing pure
Match Center and champion functions. Tests verify final/pending correctness,
counts, standings totals and champion states with the approved synthetic aliases.
Contract-v1 supplies their core information, but is intentionally not the old
prizes/week transport and cannot pass the fixed synthetic browser validator.

Future integration still requires a separately approved adapter/UI disclosure
boundary: CLOSED with unavailable aliases must NOT become a fake zero-vote field.
The current preview's pure Match Center model assumes validated alias completeness
and produces zero votes for an empty CLOSED standings list; a regression records
that limitation. Do not send withheld live data through it unchanged. Also resolve
public keys versus display names, NFL abbreviations versus labels, uppercase FINAL,
integer cents versus display currency, null versus old blank placeholders,
per-game kickoff, new aliases, explicit payment states and prediction eligibility
(the synthetic champion parser currently supports only 1–3 digit strings).
The current synthetic website remains exactly as approved; no live mode was added.

## Verification and resume boundary

`tests/projector.test.cjs` covers nine fabricated scenarios plus adversarial,
incomplete, privacy, alias, snapshot/score freshness, tied champion, source-order,
accounting and mutation tests. A VM loads only the three new projector modules and
contract validator; write-denying service stubs record even swallowed attempts.
Native Google/service/network/logging access is denied; source/policy objects and
Maps are also guarded against mutation. The explicit read-only interface exposes
no setup, sync, deploy or trigger action.

Run the full existing suite and verify the unchanged six-file artifact/seal before
commit. See PHASE5_PROGRESS.md for final counts and private-content review results.
Phase 5D, production access, a real reader, Apps Script upload/execution, frontend
live integration and custom submissions all require further authorization.
