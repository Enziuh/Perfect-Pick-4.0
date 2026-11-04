# Phase 5 — resumable migration checkpoint

Latest state: see **Player-facing completion** at the end. Earlier phase/activation
entries are historical; they do not supersede current owner authorization or the
published results-only baseline. No live player-feature activation is authorized.

Current status: Phase 5A COMPLETE; Phase 5B COMPLETE; Phase 5C COMPLETE; Phase 5D-1 COMPLETE; controlled-verification preparation COMPLETE; isolated package preparation COMPLETE; owner reports disabled package uploaded; functional native connector and validated dashboard bridge IMPLEMENTED/tested offline, 3.0/workbook compatibility COMPLETE offline; packaged read entry DISABLED by default. Real reads and live integration NOT approved.
Branch: develop. Audited baseline/checkpoint parent: 6cd85d1. The documentation
commit containing this checkpoint is its checkpoint revision (see Git log).
Phases 5B, 5C and 5D-1 authorized only within their recorded offline/fabricated
scopes. Phase 5D-2, actual source access and publication are not authorized.
Phase 5B baseline: develop at 7e2f8c1. No service calls or backend execution.

## Verified findings so far

- `apps-script/src/00_Config_Setup.js:50-99`: GET dispatch allows health,
  summary (default), week, overall and prizes. No caller authentication here;
  actual deployment access remains unverified. Week validation only rejects falsy
  numeric input, rather than enforcing an integer season-week range.
- `apps-script/src/20_Data.js:5-85`: context loads response rows, registry and results;
  latest submission is selected by private normalized contact key per week and
  timestamp (equal timestamp selects the later encountered row). Never export that
  key, raw response or timestamp.
- `apps-script/src/10_Prizes_Scoring.js:232-332`: weekly response has games,
  results, outcome, standings/picks and tiebreak metadata, but no entriesStatus.
  Picks are not gated by official closure; only prediction text is conditionally
  hidden. This cannot be directly connected to the public 4.0 frontend.
- `apps-script/src/10_Prizes_Scoring.js:1-162`: prize response resembles the preview
  dashboard but includes weekly notes/override fields and nested tiebreak metadata
  unsuitable for passthrough. Monthly payout fields are zero placeholders, not
  payment records or a resolved monthly champion.
- `apps-script/src/20_Data.js:174-236`: Form Control reads only the current record;
  it does not establish authoritative historical closure for every requested week.

## Completed checks

Read AGENTS.md and LIVE_INTEGRATION_READINESS.md completely. Confirmed clean
starting develop branch and baseline commit. Inspected dispatch and primary
read/build paths without executing backend functions or opening private config.

## Contract mapping — VERIFIED locally

Paths below are repository-relative; findings describe local code, not deployed parity.

- Transport: existing GET health/summary/week/overall/prizes returns a bare JSON
  object (`00_Config_Setup.js:50-99,347-379`). Preview accepts only prizes and
  week through one fixed bundled fixture (`website/preview-data.js:213-228`).
  No version/revision/error/freshness contract exists in the legacy response.
- Games/results: weekly games and results map directly by matchup text; fields
  game, team1/team2, winner, status, team1Score/team2Score match conceptually.
  Legacy scores are display strings, including blanks (`20_Data.js:118-172`);
  preview requires integer numbers or blank (`website/preview-data.js:25-35`).
  Normalize scores without converting missing values to zero. Detect duplicate
  normalized matchups: the legacy lookup overwrites duplicates. Stable public
  game keys, per-game kickoff/live states and coherent snapshot revision are gaps.
- Picks: rank/name/points/completedGames/totalPicks/perfectWeek/picks and prediction
  fields match the presentation model (`10_Prizes_Scoring.js:270-332`). Missing
  entriesStatus, unrestricted selection text and pre-closure disclosure block use.
  Normalize valid teams/matchups and reject unknown values before projection.
- Aliases: registry reads a contact-to-display-name mapping (`20_Data.js:97-116`),
  then scoring falls back to submitted names and derives abbreviated real names
  (`10_Prizes_Scoring.js:364-380`; `40_Cache_Helpers.js:202-212`). This is NOT
  an approved alias registry. Missing approval must suppress identity-bearing
  publication, never automatically substitute or derive an alias.
- Weekly/monthly/season standings: weekly response, periods[].standings and
  overallStandings supply matching rank/name/points/completedGames shapes; season
  additionally totalPicks (`10_Prizes_Scoring.js:474-564`). Shared competition
  ranks use points, with name only sorting equal-point display rows
  (`40_Cache_Helpers.js:34-52`). Preserve points and shared ranks.
- Scoring: one point for a selected team matching a nonblank FINAL winner;
  completedGames counts only submitted selections with such a result, not every
  scheduled game (`10_Prizes_Scoring.js:364-429`). Missing picks therefore affect
  denominator semantics; verify the intended accuracy interpretation with owner
  before any change. Current 4.0 accuracy uses supplied completedGames
  (`website/app.js:187-195`). FINAL flags alone finalize old weekly outcomes
  (`10_Prizes_Scoring.js:334-362`); 4.0 additionally requires coherent scores for
  championship/prize confirmation (`website/preview-data.js:97-211`). Missing
  scores, contradictory winners, NFL ties and incomplete submissions need parity
  cases, not automatic recalculation or rule changes.
- Tiebreakers: metadata maps from period.tiebreakRule and weekly.tiebreak, with
  predictions on weekly player rows. Legacy exposes raw prediction strings and
  configured actualTotal, but no monthly champion decision. Zero payout fields
  are deliberate placeholders (`10_Prizes_Scoring.js:69-100,432-472`). Preview
  resolver requires every period week CLOSED/final, reconciled monthly points,
  designated FINAL game and valid predictions, then absolute distance; equal
  closest remains unresolved (`website/preview-data.js:109-193`). Do not use
  stale configured totals, alphabetical order or ranked payout helpers to award
  this championship. Prediction range/normalization for live data needs approval.
- Prizes: weekly pools/allocations/rollovers, monthly shares and season confirmed/
  projected totals map closely (`10_Prizes_Scoring.js:1-162`). Drop weekly notes,
  override input and nested tiebreak event linkage/notes. Existing computed pool
  is usable only after authorized validation; never publish its private override
  provenance. No payment ledger, manual tie-decision revision or real monthly
  allocation exists. Season payout structure is explicitly unavailable.
- Preview is deliberately NOT a general live validator: four invented aliases,
  two matchups per week, fixed labels/dates/season, 18 weeks/five periods,
  entry amount and 50/50 shares are fixture constants
  (`website/preview-data.js:4-55`). Do not relabel real data as synthetic or relax
  this validator. A separately reviewed live contract/adapter is required.

## Read-only migration path — proposed, not executed

Minimum business-data read chain: a dedicated 4.0 reader -> authorized read-only
source snapshot -> equivalent of loadContext_ -> pure scoring/aggregation ->
closure/alias-checked public projection -> strict response validation. Existing
GET builders read Sheet data; their cache wrapper writes only project cache/locks
(`40_Cache_Helpers.js:308-340`), not Sheet/Form content. They do not need Form
mutation or score synchronization. Current active week is earliest unfinished
scheduled week, not necessarily Form Control's activeWeek (`40_Cache_Helpers.js:5-31`);
reconcile mismatch explicitly rather than overwriting either value.

A separate Script project does NOT isolate data if its reader still opens the
same production Sheet (`20_Data.js:24-26`). Do not deploy the full copied project
as a safe reader. First implement/test a minimal reader against invented in-memory
or sandbox inputs. Future access to existing data needs separate owner approval,
reviewed source linkage, effective least-privilege authorization and a write-free
call graph. Verify supported read-only scopes/client API before choosing an Apps
Script service; do not assume SpreadsheetApp grants read-only credentials.
Production score updates remain owned by 3.0. No new 4.0 automation/triggers.

## Functions excluded from any reader/comparison surface — VERIFIED

- Setup/seeding/schema writes: setupPerfectPick3_0, seed/refresh rule helpers and
  ensureSheetWithHeaders_ (`00_Config_Setup.js:102-345`); active one-time prize
  migration (`TEMP_Update_Prize_Rules.js:11-50`).
- Results column creation/sync and wrappers (`30_ESPN_NFL.js:6-374,688-713`);
  testNFLWeek3_0/testNFLResults3_0 call column creation even for dryRun=true
  (`30_ESPN_NFL.js:55-123`). Backfill/sync wrappers
  (`40_Cache_Helpers.js:397-452`) also excluded. External sports fetch/test helpers
  are unnecessary for a Sheet-only comparison. TEMP_Rebuild_Results.js contains
  a disabled block-commented rebuild/backup program; never enable it.
- Form creation/routing/open/close, control writes, property writes and close
  trigger management (`50_Form_Weekly_Setup.js:103-427,612-852,959-1023`),
  setupWeek wrappers (:1138-1152), repairWeek7Automation (:1189 onward), legacy
  trigger cleanup (:1095-1115), and setupTriggers3_0
  (`40_Cache_Helpers.js:103-161`). Exclude indirect callers as well as direct writes.
- Cache clear/rebuild and form/edit handlers mutate project cache; exclude from
  public dispatch even though they are not Sheet writes. Diagnostic functions can
  log response content; do not use them for private-data comparisons.
- Existing doGet does not dispatch these mutators; do not invent an arbitrary
  function-name router. Manifest requests anonymous web access executing as the
  deployer (`apps-script/src/appsscript.json:6-9`); actual remote deployment,
  grants, triggers and source parity are REQUIRES VALIDATION, not inspected.

## Server public allowlist and disclosure gate — REQUIRED future design

Construct fresh typed DTOs; never spread source rows or rely on forbidden-key
blacklists. Existing blacklist checks names only and permits sensitive values in
notes/free text (`40_Cache_Helpers.js:214-247`).

Allow only: schemaVersion/snapshotRevision/generatedAt/freshness, season/week and
period key/boundaries/approved label; approved public game key/team names/status/
kickoff/scores; week-bound authoritative entriesStatus/deadline; approved alias
(optional unrelated public opaque key); rank/points/completedGames; authorized
finalization/champion state and reason code; currency, approved pool/share amounts,
projection/finalization status, rollover amount/source/destination, allocation and
explicit unknown/pending/paid state where supported. Public wording comes from
controlled labels, not spreadsheet notes or raw question headers.

Only with fresh authoritative CLOSED for the exact applicable week: individual
picks, valid predictions/submitted indicators, participation/selection counts,
voting breakdowns (approved team, count, percentage and valid-selection denominator),
private-entry-derived totalPicks/perfect flags and related summaries.
Rebuild monthly/season public aggregates from eligible closed periods/weeks or
withhold affected aggregates; open-week participation must not leak via totals.
Champion comparison requires all relevant periods closed; unresolved never pays.

Reject/suppress contact details, raw submissions, private identity keys, submission
identifiers/timestamps, notes, private linkage, credentials and free-text errors.
Reject unmapped aliases; do not hash contacts for public identity. Official closure
must be evidenced per week with revision/freshness and administrative authority.
The current one-row Form Control plus project-local properties is insufficient
for historical proof: old reveal logic accepts earlier weeks or elapsed deadline
(`10_Prizes_Scoring.js:450-472`). Close automation does verify actual Form closure
before updating status (`50_Form_Weekly_Setup.js:367-427`), but this source evidence
is not proof it executed successfully. Never infer closure from age or kickoff.

Apply the same projection to EVERY endpoint, error, summary/export and cache.
Key/version caches by disclosure state, alias approvals and snapshot; revalidate
before serving cached sensitive data, especially reopen/revoke transitions.
Current cache keys lack those dimensions (`00_Config_Setup.js:61-90`). Unknown,
missing, conflicting or stale authority returns a safe unavailable public result.

## Safe 3.0 versus 4.0 comparison — proposed

First use invented fixtures only: run pure legacy scoring and new projection/
resolver in a sandbox with service stubs that throw on writes, external calls or
logging. No backend functions were executed in Phase 5A. Cases: final/pending/tied
scores, blank versus zero scores, contradictory final metadata, missing picks,
latest/equal-time resubmissions, shared ranks, all monthly decision states,
no-perfect rollover, pot override effect, missing accounting and non-CLOSED states.

For later explicitly authorized real-data validation, use a protected server-side
same-revision in-memory snapshot and request-local random comparison handles;
never commit/download raw responses, contact maps, stable identity hashes or
prediction-level differences. Compare points, completed counts, rank groups,
weekly perfect outcomes, monthly/season aggregation, pools and rollover totals.
Distinguish expected privacy suppression/stricter finality checks from scoring
regressions. Legacy provides no resolved monthly champion/payment oracle: compare
against approved rules and manually verified final evidence, not zero placeholders.
Output only redacted check IDs/pass-fail and non-identifying aggregate mismatch
counts (suppress small-group amounts if identifying). No aliases, game selections,
raw exceptions or private keys in logs/checkpoint/public artifacts. Stop on any
unexpected mismatch; do not repair live results or change rules automatically.

## Original Phase 5A proposed gates — historical plan

The owner subsequently authorized the expanded offline Phase 5B specification,
examples and validation tests recorded below. Remote/read integration gates remain
unstarted; this original plan is not current execution status.

1. Approve versioned DTO/disclosure specification, alias ownership and historical
   closure evidence source. Resolve denominator/prediction constraints without
   changing existing rules. Acceptance: explicit decisions, no real-data access.
2. Implement pure server projection/normalization offline with fabricated inputs
   and write-denying service stubs. Acceptance: unknown-field/value rejection,
   approved aliases only, all closure/cache transitions, no private outputs/logs.
3. Build isolated 4.0 minimal reader against a synthetic sandbox source. Acceptance:
   no mutation helpers/triggers, least-privilege review, bounded week validation,
   coherent revision and schema tests. No public deployment or production reads.
4. Obtain separate approval for controlled production read-only comparison;
   validate remote project/access/linkage privately. Acceptance: approved parity
   cases, redacted mismatch report, confirmed historical closure and aliases.
5. Separately review a live adapter/frontend contract and hosting boundary.
   Acceptance: FINAL-only scoring/champion parity, all existing UI/privacy/security
   tests plus live-contract tests, freshness/invalidation and safe error behavior.
   Keep a separate synthetic entry/artifact with no live toggle or fallback.
6. Only after explicit integration/publication approvals: verify exact public
   responses/artifact, access settings, cache behavior and rollback to synthetic.
   Accounting absent => unavailable; custom submissions remain a separate project.

## Completed checks / checkpoint verification

All nine requested Phase 5A audit areas are covered above. Read-only local source
tracing confirms the minimum read chain and dangerous indirect write paths. No
remote project/configuration, live data, Form/Sheet, properties, triggers or API
was accessed. No clasp, backend execution, upload or deployment occurred. Existing
frontend/runtime/fixtures/workflow/tests were not changed. Full runtime tests were
not rerun for this documentation-only audit; previous test success is not new
Phase 5A execution evidence. Checkpoint passed content/privacy and historical-identifier scans plus a Git
scope check: only this authorized document changed. No new personal data or private identifiers recorded.

## Phase 5A handoff — superseded by Phase 5B completion below

At the Phase 5A checkpoint, Phase 5B awaited authorization. Next action: owner reviews the
contract/disclosure blockers and authorizes Phase 5B step 1 only (offline contract
specification). Do not connect real data, alter synthetic publication, run backend
functions, or start custom picks. Remote settings, historical closure evidence,
alias approval registry and production parity remain explicitly unverified.

Checkpoint branch: develop; parent 6cd85d1. To identify its final documentation
commit use Git log for this file; a self-referential commit hash is not embedded.

## Phase 5B — completed offline contract specification

Branch: develop. Checkpoint parent: 7e2f8c1. The commit containing this update is
its final checkpoint revision; use Git log for this path rather than a circular
self-referential commit hash. At that checkpoint Phase 5C had not started; see its
subsequently authorized completion below.

### Deliverables and verified coverage

- `docs/architecture/LIVE_DATA_CONTRACT_V1.md`: normative required/optional fields,
  versioned READY/UNAVAILABLE snapshots, source/closure revisions and freshness,
  numeric score normalization, exact FINAL coherence, approved aliases, weekly/
  monthly/season ranks and legacy denominator semantics, monthly decisions,
  authoritative cent-based prize accounting and redacted comparison protocol.
- `tools/contracts/live-contract.cjs`: separate I/O-free executable specification.
  Strict unknown-key rejection at every nested record; rejects private fields
  instead of stripping/pass-through. Trusted approval/completeness/closure and
  accounting maps are server-owned inputs, never request/public authorization.
  Missing approval or unverifiable closure cannot release picks, predictions,
  participation or voting. Affected standings are withheld; no invented winners,
  score zeroes or payment status. This is NOT a reader or production API change.
- `tests/support/live-contract-examples.cjs`: nine invented scenarios, including
  pending, unknown closure, missing alias, no eligible prediction, equal-distance
  tie, zero votes and zero completed games. No downloaded/sanitized private data.
- `tests/live-contract.test.cjs`: 30 offline tests, including recursive forbidden
  fields, expired/reopened closure, stale/incoherent scores, rejected self-asserted
  approvals, counts/share reconciliation, rank/aggregate consistency, evidence-
  backed prize accounting/rollover, redacted comparison failures and deterministic
  ordering. Monthly states/winners match the approved frontend resolver on all
  nine synthetic examples. No Apps Script code is executed by these tests.

### Test/check results

- `node --test tests/*.test.cjs`: 62 passed, 0 failed, 0 skipped (30 new + 32 existing).
  Includes browser navigation/responsive/privacy/network isolation, champion,
  picks/voting, prize, security and artifact-tamper regressions.
- `node tools/security/public-artifact.cjs verify`: exact existing six-file artifact
  and external seal pass, including historical private-identifier/security scan.
- New module/example syntax checks and Git whitespace check pass. Final content/
  historical-identifier and modification-scope scans pass across all five changed/
  new files; the contract module has no service/network/logging capability.
- Website, synthetic fixture/adapter, Apps Script, publication scanner and Pages
  workflow unchanged. No dependency install, service request, live read, backend
  execution, clasp, upload or deployment. No custom submission work.

### Remaining blockers (not silently resolved by specification)

Owner-approved alias registry/complete mapping, historical official closure evidence
and freshness budget; explicit missing-pick accuracy wording and valid prediction
constraints; authoritative accounting and independent monthly decision oracle;
least-privilege isolated reader and same-revision source proof. Remote settings,
permissions and deployed 3.0 behavior remain unverified. Full-month standings in
v1 are deliberately withheld if any configured week lacks closure; an early-month
closed-weeks-only extension needs explicit review. No zero payout placeholder is
accepted as payment evidence. Contract validation cannot establish source truth.

### Exact next resumable task

Wait for owner authorization for Phase 5C. Resume instruction:
"Read AGENTS.md, PHASE5_PROGRESS.md and LIVE_DATA_CONTRACT_V1.md. Begin only the
authorized Phase 5C offline read-only projection/reader design against fabricated
inputs, using write-denying service stubs and the Phase 5B contract tests. Do not
access production, modify the synthetic website/workflow, deploy, or build custom
submissions. Resolve the recorded authority/alias/denominator/accounting decisions
before any real-data integration."

Phase 5B completion did not authorize further work. The subsequent owner request
authorized only the fabricated-input Phase 5C recorded below, not publication.

## Phase 5C — completed isolated fabricated-input projector

Branch: develop. Baseline/checkpoint parent: 061edcc. Final checkpoint revision is
this document's containing commit (Git log), avoiding a self-referential hash.
Phase 5D is NOT started or authorized. No production data was used or requested.

### Completed implementation and compatibility

- `tools/projector/project-competition.cjs`: pure legacy-shaped source -> strict
  contract-v1 snapshot, with explicit allowlists, normalized numeric scores/team/
  matchup/status labels, alias approvals, per-week official closure, complete-read
  evidence, latest private submission selection, FINAL-only points, shared ranks,
  weekly/monthly/season aggregation, voting and authoritative accounting projection.
  Global alias collisions cannot merge different participants across weeks.
- `tools/projector/monthly-decision.cjs`: isolated deterministic points-first
  decisions. Required finality/lifecycle evidence; missing/invalid predictions
  ineligible; equal closest unresolved. Never changes ranks, points or payouts.
- `tools/projector/read-only-reader.cjs`: one synchronous readSnapshot capability;
  no action dispatch, setup, sync, native service or write function. No legacy
  Apps Script import. Future real reader permissions still require independent
  review; this interface cannot make arbitrary injected code read-only.
- `tests/support/projector-examples.cjs`: fabricated legacy-shaped Results and
  private submission records plus independent fabricated policy/evidence. No real
  contact information or production linkage. Unknown private fields never copied.
- `tests/support/write-denying-services.cjs`: VM-native services/network/logging
  deny operations and record attempted calls, including swallowed exceptions.
  Tests also guard source/policy objects and Maps against mutation.
- `tests/support/projector-frontend-needs.cjs`: test-only structural mapping into
  existing frontend pure Match Center/champion components; not a live adapter.
  Source fixture/contract equivalence and semantic component needs are tested.
- `docs/architecture/READ_ONLY_PROJECTOR.md`: interfaces, input/evidence provenance,
  privacy/failure behavior, compatibility gaps and remaining authorization gates.

### Privacy, scoring and evidence guarantees verified offline

No private submissions are read before verified CLOSED. Unknown, expired, mismatched
revision or missing closure becomes UNKNOWN/WITHHELD; passed deadlines are not
closure evidence. Missing/ambiguous aliases or incomplete/malicious selections
withhold complete affected scopes, not misleading partial rankings/counts. No
name/contact fallback, raw identifiers, notes or free-text exceptions are returned.

Missing/stale score or snapshot evidence returns a safe unavailable envelope;
zero is distinct from absence. Missing/stale accounting remains unavailable with
UNKNOWN payment; legacy zero payout placeholders are ignored. Explicit approved
rollover/funding evidence is preserved without recomputing financial rules.
Contradictory paid unresolved outcomes fail closed. Missing completion evidence
cannot confirm a champion. Reopened/revoked evidence cannot reuse a cached response;
the projector has no cache. No real-world permissions or source truth is certified.

### Test results and safety checks

- `node --test tests/*.test.cjs`: 93 passed, 0 failed, 0 skipped (31 projector tests
  plus 62 existing). Covers nine fabricated scenarios, poisoned private getters,
  missing/expired/reopened closure, invalid records, source-order ties, blank/zero/
  stale FINAL scores, approved aliases, cross-week identity collisions, rankings,
  champion decisions, accounting/rollover, write denial and frontend data needs.
- Existing browser navigation/responsive/privacy/external-network isolation,
  scoring/champion, contract schema, publication security and integrity tests pass.
- `node tools/security/public-artifact.cjs verify`: unchanged exact six-file
  artifact/seal passes, including historical-identifier scans. No staging rebuild
  or publication required. New module syntax and Git whitespace checks pass.
- Final scope and private-content/history scans pass across all nine changed/
  untracked files; projector service/logging-isolation scan passes; no real identities, endpoints or private identifiers are recorded.
- Website, synthetic adapter/fixture, Phase 5B validator/specification, existing
  Apps Script, publication scanner and Pages workflow unchanged. No dependencies,
  production reads, clasp, Apps Script execution/upload/deploy, settings changes,
  custom picks form or production 3.0/main modifications.

### Remaining live-integration blockers

All Phase 5B authority decisions remain: approved complete alias mapping, historical
closure proof/freshness budget, source completeness/revision guarantees, private
normalization/deduplication ingestion, missing-pick denominator wording, prediction
eligibility range, authorized accounting/payment ledger and completion oracle.
No actual Google reader, access permissions or deployed-backend parity was tested.

Frontend compatibility is SEMANTIC, not drop-in transport compatibility. In
particular, current synthetic Match Center assumes approved alias completeness:
CLOSED with an empty withheld standings list yields zero voting in that old pure
model. The v1 projector correctly omits votes and marks standings WITHHELD. A
future separately reviewed adapter/UI disclosure state must preserve unavailable
instead of manufacturing zero. New alias handling, status casing, public game keys,
integer cents/nulls, prediction bounds, per-game kickoff and accounting transport
also need explicit integration. Do not bypass the strict synthetic validator or
switch the published preview to live data to resolve these gaps.

### Exact next resumable action

Wait for Phase 5D authorization. Resume instruction:
"Read AGENTS.md, PHASE5_PROGRESS.md, READ_ONLY_PROJECTOR.md and the v1 contract.
Review the unresolved evidence/alias/accounting decisions and the CLOSED-but-
withheld frontend disclosure gap. Plan only the owner-authorized Phase 5D scope;
keep inputs fabricated and the synthetic website unchanged unless separately
approved. Do not access production, run Apps Script/clasp, deploy or build custom
submissions."

Phase 5C completion did not authorize later work. The subsequent owner request
authorized only the fabricated-input Phase 5D-1 recorded below, not live publication.

## Phase 5D-1 — completed isolated Sheets read adapter

Branch: develop. Baseline/checkpoint parent: 96ff853. Final checkpoint revision is
this file's containing commit (see Git log). Phase 5D-2 has NOT started.

### Completed work

- `tools/sheets/sheets-read-adapter.cjs`: Apps Script-compatible injected namespace;
  create returns only readPublicSnapshot. Only values.batchGet is called on the
  injected Sheets interface. Bounded Results/Responses header/range allowlists,
  header verification before data reads, row guards, canonical response-range/
  dimension validation, per-week CLOSED selection/prediction filtering and fresh
  pre/post revision/completeness/quiescence evidence. No raw source/metadata output.
- Public responses pass through the unchanged Phase 5C projector and Phase 5B
  validator. No fresh closed evidence => no picks/predictions/votes. No approved
  aliases => affected scopes WITHHELD. No lifecycle/payment evidence => unknown,
  pending or unavailable, never inferred from old flags/zero payout placeholders.
- `tools/sheets/offline-bundle.cjs`: in-memory assembly of only the reader and
  existing pure modules. VM checks run without Node globals or native services.
  No file, upload, deployment or copied production Apps Script is assembled.
- `tests/support/sheets-example.cjs`: fabricated spreadsheet matrices with legacy
  column shapes and injected read-only Values service, evidence and codecs.
- `tests/sheets-reader.test.cjs`: 24 reader tests, including expected shapes,
  missing/moved columns, absent aliases, unknown/mixed/expired closure, truncated/
  reordered/overflowing ranges, revision and concurrent-data changes, expired
  capture, blank/zero/invalid scores, explicit timestamp/identity handling, denied
  writes, private-field/metadata getters and Apps Script-style VM assembly.
- `docs/architecture/SHEETS_READ_ADAPTER.md`: exact interface and access limits,
  future owner authorization procedure, least-privilege read scope, capture/time
  blockers, and browser/CORS guidance without JSONP or insecure proxy workarounds.
  Only official public developer documentation was browsed; no competition service.

### Verification results

- `node --test tests/*.test.cjs`: 117 passed, 0 failed, 0 skipped (24 new + 93 prior).
  Includes privacy, scoring, champion resolution, contract, projector, browser
  navigation/responsive/network isolation and publication security/integrity.
- `node tools/security/public-artifact.cjs verify`: exact unchanged six-file public
  artifact and seal pass; no staging rebuild or deployment. Module syntax and
  whitespace checks pass. Final content/history and scope review across all six changed/new files pass;
  injected-service boundary scan passes; no real identities, secrets or linkage recorded.
- Existing website/adapter/fixtures, contract/projector modules, Apps Script source,
  Pages workflow/settings and production 3.0/main unchanged. No dependency install,
  Google account/data access, Forms/Properties/triggers, clasp, native Apps Script
  execution, upload, deployment or custom picks work.

### Remaining prerequisites for any real verification

The actual Values response does not prove atomicity, row completeness or a coherent
source revision. Repeated equal reads and blank boundary guards detect some races,
not ABA changes or data after gaps. An independently credible capture mechanism or
approved immutable private snapshot remains REQUIRED; constant fake evidence or
refreshing timestamps is not acceptable. The existing production system does not
become safe to read by changing the local Script target.

Owner must privately review account/target access, approved closed weeks and bounded
ranges (including shared-row identity/time access), alias registry, historical
closure authority, source/game mappings, lifecycle/accounting evidence and freshness.
A real private identity normalizer and tested timezone/DST-aware submission-serial
codec are required; test codecs are fabricated, not production implementations.
Actual Apps Script runtime behavior, OAuth grants and browser/CORS behavior remain
unverified. The synthetic frontend still needs its future explicit CLOSED-but-
withheld disclosure boundary and reviewed versioned adapter. No live mode enabled.

### Exact next resumable action

Wait for explicit Phase 5D-2 authorization. Resume instruction:
"Read AGENTS.md, PHASE5_PROGRESS.md, SHEETS_READ_ADAPTER.md and the v1 contract.
Confirm the owner-authorized Phase 5D-2 scope and resolve capture/revision authority,
approved aliases/closure, source layout and identity/time codecs first. Do not
read the real target or run/upload Apps Script unless that precise action is newly
approved. Preserve synthetic Pages; no deployment or custom picks form. Record
only non-identifying check outcomes and blockers in this checkpoint."

Phase 5D-1 is complete; Phase 5D-2 and production integration remain unauthorized.

## Controlled verification preparation — complete locally; real read disabled

Branch: develop. Baseline/checkpoint parent: a33b114. The containing commit is this
checkpoint revision (see Git log). Current authorization covers fabricated local
implementation/testing only. No real-read, Google authorization, Apps Script upload/
execution, public integration or deployment is authorized or performed.

### Completed preparation and precise read scope

- `tools/verification/timestamps.cjs`: pure configured-timezone parser for Apps
  Script Date instants, canonical UTC ISO, explicit local calendar strings and
  Sheets serials. America/Los_Angeles matches reference competition configuration;
  owner still must confirm actual Sheet timezone. DST gaps/folds reject ambiguous
  wall times; explicit instants preserve their UTC value. No host-timezone guess,
  locale parsing, external service or silent fallback. Actual Apps Script Intl
  support remains unverified and must pass fabricated runtime tests before use.
- `tools/verification/owner-evidence.cjs`: explicit owner-approved private-join to
  independently provisioned public-key/alias Maps; exact fields/revision, duplicate
  rejection, no raw-name derivation. Fresh, revision-bound, independently owner-
  verified CLOSED records only; elapsed deadlines cannot create disclosure authority.
  These typed records are NOT proof of actual owner identity or verified history.
- `tools/verification/offline-report.cjs`: data-only private review summary. Returns
  only fixed state/validation/check codes, aggregate game/week/scope counts and
  discrepancy-category count. No player identities/counts, contact data, selections,
  predictions, points, money, notes, IDs, timestamps, errors or raw snapshots.
  Missing baseline/oracle, withheld scopes or invalid/unavailable data cannot pass.
- `tools/verification/disabled-entry.cjs`: verifyRealCompetitionReadOnly_ ALWAYS
  returns DISABLED. No service/read capability or enabling flag/token/callback.
  Owner authorization and remote isolation cannot be proven here, so no executable
  real-read path is enabled. Trailing underscore is not relied on as authentication.
- Existing exact read scope confirmed: Results' eight score/matchup fields, plus
  Responses Timestamp/Phone Number and approved CLOSED-week selection/prediction
  columns only. Headers precede bounded bodies; no Name, notes, Players, ledger,
  Form Control, Forms, Properties, triggers, score sync or setup imports/calls.
  Existing 5D-1 partial/revision/header/freshness rejection is reused unchanged.
- `tools/sheets/offline-bundle.cjs` now assembles these extra pure helpers in memory
  alongside the existing approved modules. No Node globals or native Google access
  in the VM runtime; no file/upload/deployment. Real-read entry remains disabled.
- `docs/architecture/FIRST_LIVE_VERIFICATION.md`: precise field inventory, timezone/
  evidence rules, private owner report contract, conditional first-read procedure,
  stop/rollback plan and unverified isolation/source-authority requirements.

### Test and review results

- `node --test tests/*.test.cjs`: 138 passed, 0 failed, 0 skipped (21 new + 117 prior).
- New tests cover Pacific winter/summer/DST boundaries, missing/invalid dates,
  serial fractions, direct/cross-realm Dates, host timezone independence, unavailable
  Intl, explicit alias/closure/revision authority, realistic fabricated serials
  through the reader/projector, redacted discrepancy reports, stale/incomplete/
  inconsistent captures, missing oracles, withheld scopes, disabled entry bypass
  attempts, write-denying VM services and unchanged publication membership.
- Existing privacy, scoring, champion, contract, reader/projector, snapshot,
  browser/responsive/external-network isolation and artifact-security checks pass.
- `node tools/security/public-artifact.cjs verify`: unchanged exact six-file
  artifact/seal passes. Module syntax/Git whitespace checks pass. Final review/scans across all eight changed/new files pass: diff/scope,
  untracked content, private-content/history and native-capability boundaries; no real identities, endpoints, keys or private configuration recorded.
- Existing website, synthetic fixture/adapter, contract, read adapter, projector,
  Apps Script source, production 3.0, main and Pages configuration unchanged.
  No dependencies installed, actual Sheet/Form/API/Properties/trigger access,
  clasp, Apps Script execution/upload/deploy or custom picks work.

### Blockers before any first real read

Real account/editor/deployment/trigger isolation, minimal OAuth scope and actual
Apps Script runtime have not been inspected. Independent credible capture revision/
completeness/quiescence or an approved immutable snapshot remains mandatory; equal
reads and guard rows cannot prove atomicity/ABA safety. No such authority is created
by these helpers. Owner must approve actual bounded coordinates, private identity
normalization, complete alias mapping, weekly closure history, timezone/input format,
source freshness, completion/accounting evidence and comparison oracle. Resolve
missing-pick denominator/prediction eligibility constraints before live parity.

The CLOSED-but-withheld frontend zero-vote presentation gap remains a later public
integration blocker. No live adapter or owner-report endpoint exists in Pages.
A private comparison result cannot authorize publication or certify source truth.

### Exact next resumable action

Owner reviews FIRST_LIVE_VERIFICATION.md and the recorded blockers, then gives NEW
explicit approval for the precise next isolated assembly/runtime or actual read
operation. Until then keep verifyRealCompetitionReadOnly_ disabled. Resume:
"Read AGENTS.md, PHASE5_PROGRESS.md and FIRST_LIVE_VERIFICATION.md. Confirm the
newly approved scope and owner isolation/capture/alias/closure/timezone evidence.
Do not read a real Sheet, upload/execute Apps Script or change permissions without
that exact authorization. Keep all data ephemeral and report only fixed outcomes/
counts; preserve synthetic Pages and production resources. Stop on any mismatch."

No first real Google read is authorized or conducted automatically by this work.

## Isolated verification package — complete locally; upload/read blocked

Branch: develop. Baseline/checkpoint parent: bbfaa11. Final checkpoint revision is
this file's containing commit (Git log). Current authorization is preparation only;
no upload, OAuth authorization, Apps Script execution/deployment or real read.

### Constructed package and exclusions

- `.verification-package/` is an ignored local two-file artifact: Verification.gs
  and appsscript.json. External ignored seal: .verification-package.seal.json.
  No target/configuration, credentials, real data, fixtures or other assets.
- `tools/verification/package.cjs` builds/verifies the exact inventory, approved
  source assembly, source-path symlinks, explicit manifest, private/reference scans,
  forbidden capabilities and SHA-256 seal. Unexpected configuration files, maps,
  archives, directories, symlinks or changed bytes fail closed. No upload command.
- `tools/verification/package-manifest.json`: V8, reference Pacific timezone,
  exception logging NONE, sole spreadsheets.readonly scope and Sheets v4 advanced
  service. No webapp/executionApi, libraries, Drive/write/Form/trigger scopes.
- Required read adapter, projector/monthly logic, contract, timestamps, evidence
  and redacted-report code are enclosed in a private scope. No global create/read
  library API is exported. Only the permanently disabled diagnostic is accessible:
  verifyPerfectPick4Package_ returns DISABLED via the existing no-capability entry.
  Owner claims, flags, callbacks or global configuration cannot enable it.
- No legacy score-sync/backfill, ensure-columns/setup/seeding, Form automation,
  trigger operations, prize migration, Apps Script native writer/logging/network
  service, doGet/doPost or anonymous handler is included. Pure code only; actual
  Sheets read methods remain injected capabilities for a separately reviewed future
  activation. No existing contract, projector, reader or frontend changes.
- `.gitignore` excludes the local package/seal. No change to the six-file Pages
  allowlist/workflow. Tracked sources reconstruct the package without committing
  generated duplicates or any private target file.

### Target verification — explicit limits

`tools/verification/local-target.cjs` inspects the existing ignored local linkage
and main/develop local history, never runs clasp or contacts Google. VERIFIED
locally: configuration is present, ignored/untracked and distinct from historical
3.0 linkage. No identifier or identifier digest is logged/stored in this checkpoint
or package. Remote identity is OWNER_CONFIRMATION_REQUIRED, readyForUpload:false.
This is separation evidence only, NOT proof that it is the intended separate 4.0
project. Owner must privately compare Project Settings identity and inventory the
remote code, owner/editor access, versions/deployments, triggers and libraries.
Missing/invalid/tracked/unignored/legacy-equal linkage cannot pass local assessment.

### Offline verification

- `node --test tests/*.test.cjs`: 149 passed, 0 failed, 0 skipped (11 new + 138 prior).
- `tests/verification-package.test.cjs`: exact script/manifest, strict scope and
  no endpoints, forbidden function/service exclusions, no native calls on load or
  diagnostic, disabled behavior despite purported config, private library closure,
  permission escalation rejection, extra-file/symlink/tamper/seal rejection,
  status-only local target assessment and unchanged synthetic publication.
- `node tools/verification/package.cjs stage` and `verify`: local two-file package
  and seal pass; diagnostic DISABLED; readyForUpload:false. Actual files inspected.
- `node tools/verification/package.cjs target`: local separation confirmed, remote
  owner confirmation still required. No actual Script ID appears in output.
- `node tools/security/public-artifact.cjs verify`: unchanged synthetic six-file
  artifact and seal pass. Syntax/whitespace checks pass. Final scope and private-content/current-and-historical-linkage review across all
  seven changed/new files pass; detector literals and fabricated negative tests
  were reviewed as code/test inputs, not production secrets.
- Website/production 3.0/main, copied Apps Script, Forms/Sheets, Properties, triggers,
  public configuration and deployment workflow unchanged. No dependencies installed,
  real data access, clasp operation, OAuth flow, Apps Script upload/execution/deploy,
  permissions/visibility change or custom picks work. Only public documentation
  was browsed for manifest/scopes; no competition service was accessed.

### Unresolved security/data-integrity blockers

Remote 4.0 identity and owner isolation, effective existing grants, actual runtime/
Intl behavior, actual header coordinates/timezone, identity normalization and complete
approved alias mappings, historical authoritative CLOSED evidence, credible capture
revision/completeness/quiescence, accounting/completion/oracle evidence and the
frontend CLOSED-but-withheld behavior remain unresolved. Equal repeated reads and
blank guards do not create snapshot authority or ABA safety. No production cell,
metadata, revision tab or trigger is changed to manufacture it. No private policy
or target is shipped, and the diagnostic cannot access real data as packaged.

### Exact owner-controlled next action

Owner reviews ISOLATED_VERIFICATION_PACKAGE.md, the two local files, hashes/seal
and passing checks. Privately confirm the intended separate 4.0 target and clean
owner-only remote isolation WITHOUT publishing its identifier or changing resources.
Then provide NEW specific approval before any future upload, isolated synthetic
runtime execution or OAuth authorization. Keep the diagnostic disabled; real-read
activation/configuration and the first bounded read each need separate review and
explicit authorization after source-authority/alias/closure gates are resolved.

Resume instruction: "Read AGENTS.md, PHASE5_PROGRESS.md and
ISOLATED_VERIFICATION_PACKAGE.md. Confirm the newly approved operation and remote
4.0 isolation privately; do not use the copied apps-script directory or run clasp,
upload, authorize, deploy or read real data without precise new authorization.
Keep private configuration outside Git/package/Pages and preserve production."

Preparation complete does NOT mean ready to upload, deploy, authorize or read.

## Isolated upload directory — prepared locally; upload NOT performed

Branch: develop. Baseline/checkpoint parent: 34af9f6. Owner now confirms the separate
4.0 project exists, its editor is empty, and the local target is correct. The agent
has not inspected Google; previous local-only target caveats are historical.

Prepared `/Users/manny/orca/projects/NFL-Perfect-Pick/tmp/verification-upload`.
Exact allowed inventory: Verification.gs, appsscript.json, .clasp.json. All ignored
by the existing tmp/ rule and untracked. Code/manifest bytes match the original
verified two-file package and external seal. Private configuration is mode 0600,
contains only the copied owner-confirmed target plus rootDir dot, and matches the
existing local target without printing or storing any identifier in documentation.
Original apps-script/.clasp.json retains rootDir src and is byte-unchanged; copied
production backend source is not selected or modified. No private policy/Sheet IDs.

Manifest remains the sole spreadsheet read-only scope, no public HTTP handlers,
write services/calls, score sync, setup, Forms, trigger installers or legacy code.
The diagnostic and hidden read libraries remain disabled/unexposed. Only offline
Node checks were run, with denied services; no Google/Apps Script execution, OAuth,
clasp operation, upload, deployment or real read. Website/Pages unchanged.

Validation: original package integrity/privacy checks pass; isolated payload
inspection and exact seal-hash match pass; private config target/rootDir/permissions
and exact three-file Git-ignored inventory pass.
`node --test tests/verification-package.test.cjs tests/security.test.cjs`: 17 passed,
0 failed, 0 skipped. Original package verification and unchanged six-file Pages
artifact/seal verification pass. Documented Node preflight is tested separately,
without running the future clasp command. Only two safe documentation files change.

Remaining blockers: actual isolated runtime/Intl and effective scope verification,
credible capture revision/completeness, real coordinates/timezone/private identity
normalization, approved aliases/historical closure, completion/accounting/oracles
and future frontend privacy transport. The owner-confirmed target is no longer a
missing owner decision; no additional remote verification is claimed.

Exact next owner action: review the upload directory and documented checks, then
provide NEW explicit authorization for a source-only upload. FUTURE command, only
from the exact isolated directory: `clasp push`. Full commands are recorded in
ISOLATED_VERIFICATION_PACKAGE.md. Do not execute/authorize the diagnostic, deploy,
activate live data or conduct a real read as part of that upload.

This task authorized local copying and documentation only. No actual upload.

## Apps Script upload parse failure — correction complete (offline)

Baseline develop includes local checkpoint b839168 (ahead of origin at task start).
Owner reports isolated source upload failed: Unexpected token = at Verification.gs
line 133. Reproduced offline using pinned Acorn ES2020 parser: the actual generated
line contains ES2021 logical assignment total.hasTotals &&= ... from
tools/contracts/live-contract.cjs:130. Node-only syntax/VM checks missed it.
Source conditional replacement preserves short-circuit behavior; packaged hasOwn
uses also move to ES2020 hasOwnProperty.call. Build-time independent parser/AST
gate added to both rendering and inspection. Eight new compatibility regressions
cover later syntax/APIs, parser integrity failure, conservative runtime execution
and missing-total validation. Acorn 8.15.0 is pinned, MIT licensed, vendored for
offline development only, and excluded from both upload and Pages artifacts.

Regenerated .verification-package and its external integrity seal; refreshed only
the two payload files in tmp/verification-upload. Exact inventory remains
Verification.gs, appsscript.json and ignored .clasp.json. Private clasp configuration
is byte-unchanged, rootDir dot, mode 0600 and matches the owner-confirmed separate
4.0 target. Manifest unchanged: spreadsheet read-only scope, diagnostic DISABLED,
no writes, Forms, triggers, public HTTP handlers or real services enabled.

Checks: node --test tests/*.test.cjs: 157 passed, 0 failed, 0 skipped. Includes
browser isolation/responsiveness, privacy, scoring, contract, package and artifact
checks. Targeted compatibility/package/contract run: 49 passed. Sealed package
verification, exact three-file documented Node upload preflight, unchanged six-file
Pages integrity verification and private-reference scan of all changed/untracked
files pass. Normal apps-script/src, frontend and deployment workflow unchanged.

Checkpoint branch develop, baseline b839168; final correction commit is the commit
containing this section. Reviewed prior local b839168: documentation only; both
that checkpoint and focused fix are authorized for push after checks.

Exact next owner-controlled action: review this correction and repeat documented
preflight in docs/architecture/ISOLATED_VERIFICATION_PACKAGE.md, then retry only
the source upload from tmp/verification-upload using clasp push if authorized.
The agent must not run that command. Actual Google parser/runtime acceptance is
still unverified; conservative ES2020 checks are not a Google runtime emulator.
Do not execute/enable the diagnostic, authorize data access, deploy or conduct a
real read. All existing live-verification/evidence blockers remain unchanged.
No retry, clasp operation, Google execution or real-data access by the agent.

## First owner-authorized read preparation — complete offline; execution blocked

Branch develop; baseline e221380. Checkpoint revision is this section's containing
commit (Git log). Owner reports corrected source-only upload succeeded in the
separate 4.0 project with only verification code/manifest. This is owner-provided
status, not remote inspection. Diagnostic remains DISABLED; website synthetic-only.
This task authorizes local preparation/tests only, not OAuth, upload or real reads.

Completed:
- tools/verification/prepared-diagnostic.cjs: pure injected coordinator; exact
  private config/evidence fields, explicit approved alias and CLOSED builders,
  configured timestamp parser, two-stage authorization seam, bounded existing
  reader/projector and independent public-contract revalidation. Missing/invalid
  authorization/config/closure/alias approval/capture blocks before Sheets calls.
  Capture revision/bounds must remain identical across three evidence observations;
  no broadening between consent and actual read. Unmapped entrants/partial headers/
  scores/stale snapshots remain withheld or unavailable, with generic errors.
- Report exact fields state/validation/readiness/counts only; aggregate game/week/
  scope counts, no player counts, names/aliases, contacts, raw picks/predictions,
  notes, secret IDs, points/money, targets, ranges, timestamps or exception text.
  VALIDATED_READ is schema validation only; private comparison still required.
  No parity assertion, guessed payout, winner or closure evidence is manufactured.
- tools/sheets/offline-bundle.cjs and tools/verification/package.cjs include the
  coordinator only within the existing private closure. Actual globally reachable
  verifyPerfectPick4Package_ and verifyRealCompetitionReadOnly_ remain unconditionally
  DISABLED. No native Sheets connector, config loader, enable flag, writes, Forms,
  trigger installers, HTTP handlers, public endpoints or extra OAuth scopes added.
- FIRST_LIVE_VERIFICATION.md: precise private inputs, intended minimal owner-only
  bridge/authorization design, evidence requirements, four-call maximum Sheets
  read plan, private redacted-result inspection and rollback. ISOLATED_VERIFICATION_PACKAGE.md
  records current owner upload status and local-only prepared assembly changes.

Tests/checks:
- node --test tests/*.test.cjs: 166 passed, 0 failed, 0 skipped (9 new).
- New tests: normal fabricated read/report allowlist; absent/denied/throwing/fake
  authorization; absent/malformed config, alias and CLOSED evidence; stale/missing/
  changed capture; exact bounded single-column reads excluding Name/notes; missing
  entrant aliases, inconsistent headers, partial scores/timestamps; private error
  suppression; write-denying VM execution; packaged coordinator inaccessible and
  disabled entry immune to purported owner arguments/global config.
- Existing browser/responsive/network isolation, scoring/champion/prize, privacy,
  contract, read adapter, package-integrity and ES2020 compatibility checks pass.
- Regenerated ignored .verification-package plus external seal; updated only two
  verified payloads in tmp/verification-upload. Exact inventory Verification.gs,
  appsscript.json and ignored .clasp.json; private clasp bytes unchanged, target
  matches owner-confirmed 4.0, rootDir dot, mode 0600. Read-only manifest unchanged.
  Documented Node preflight and sealed-source assembly checks pass. Unchanged
  six-file Pages artifact/seal, private-reference scans of every changed/untracked
  file and Git whitespace checks pass. This does NOT
  update the remote uploaded package and does NOT authorize a new upload.

Outstanding gates before real data:
- Native owner-only bridge and Google authorization are deliberately unimplemented.
  Injected authorize callbacks are trusted test seams, NOT authentication proof.
  Owner must privately establish sole-editor/project/deployment/trigger isolation
  and actual effective read-only grants. No new identity/email scope is proposed.
- Actual Sheet coordinates/timezone/identity normalization and Apps Script Intl
  runtime parity, independent credible revision/completeness/quiescence authority,
  complete approved aliases and fresh historical CLOSED/reopen evidence are still
  required. Equal reads/static bounds/fresh timestamps do not create authority.
- Missing lifecycle/accounting/champion oracle and denominator/prediction decisions
  prevent related parity claims. Existing public integration/privacy blockers stay.
  No live adapter, custom submissions, public deployment or 3.0 change is included.

Exact next owner-controlled action:
Privately review FIRST_LIVE_VERIFICATION.md's prepared-coordinator procedure and
supply only confirmation that owner isolation, effective scopes, actual coordinate/
timezone and independent capture/alias/closure gates have been established. Never
paste private values in chat/Git. Then explicitly authorize focused implementation
and review of the private owner-only bridge/config assembly. Keep the uploaded
entry disabled until that review passes. Any subsequent exact upload, fabricated
runtime/OAuth test and one bounded real read require their own precise owner
approval. Do not execute a diagnostic or conduct the first read automatically.
Resume: "Read AGENTS.md, PHASE5_PROGRESS.md and FIRST_LIVE_VERIFICATION.md. Confirm
which remaining owner-only bridge/evidence gate is newly authorized. Preserve the
sealed disabled package and synthetic Pages; do not access Google services,
upload, authorize or read actual data without exact new approval."

## Functional native read connection — implemented; real execution NOT performed

Branch develop; baseline 0673329. Checkpoint revision is this section's containing
commit (Git log). Current task authorizes connector implementation/offline tests,
commit and push only. No real access, OAuth, upload, execution or deployment.

Completed implementation:
- tools/verification/owner-connection.cjs implements the actual native service
  bridge, using Advanced Sheets Spreadsheets.get and Values.batchGet. IMPORTANT:
  Google's SpreadsheetApp.openById requires editing scope, incompatible with the
  explicit read-only requirement. Advanced Sheets is used instead; the existing
  sole spreadsheets.readonly scope and service manifest are BYTE-UNCHANGED.
- tools/verification/private-owner-config.cjs defaults to return null; private
  provider lives inside the generated package closure. No globals/arguments,
  Script Properties, target hardcoding or enable request parameter. Default entry
  remains DISABLED without touching Sheets. Owner activation requires private
  remote source configuration, explicit isolation/read-only review and a canonical
  time window of at most five minutes. One activated attempt per execution context;
  repeated Apps Script executions reset memory, so owner must disable after use.
- STRUCTURE first-run mode reads only restricted two-tab metadata and selected
  single-cell headers. No contact, timestamp, selection or prediction body cells,
  no projector publication. Reports only counts/fixed labels; row counts unknown.
- VERIFY requires approved alias configuration, authoritative CLOSED history and
  independently credible capture/revision/completeness evidence before native
  access. It reuses the existing Phase 5D adapter, projector, timestamp parser,
  coordinator and strict contract validation. Exact layout descriptor keys reject
  injected sheet overrides. Target, columns, bounded rows, request options and
  four-call reader budget are enforced by the native wrapper. Metadata/header
  preflight makes total maximum one metadata + five values requests. No writes,
  Forms, triggers, sync, prize updates, private-data output/logging or HTTP handlers.
- Native report contains fixed state/readiness/schema/evidence/time compatibility,
  expected/discovered tab counts, expected/matched column counts and validated
  bounded record counts only. Sensitive header strings, player aliases/names,
  contacts, picks, notes, IDs, timestamps, raw DTOs and exceptions never returned.
  Mismatched headers can expose safe numeric progress but no header text.
  READY_FOR_PRIVATE_COMPARISON is not parity or publication approval.
- tools/sheets/offline-bundle.cjs and tools/verification/package.cjs integrate the
  bridge privately; global namespace still exposes only diagnostic. Entry ignores
  arguments and returns a report local for private debugger inspection. The pure
  legacy disabled helper remains disabled; no live frontend or backend 3.0 change.
- FIRST_LIVE_VERIFICATION.md documents exact private fields, source-only upload,
  remote-only provider activation, minimal grant review, STRUCTURE then separately
  authorized VERIFY, report inspection and return-null rollback. Current section
  supersedes historical native-bridge TODOs. ISOLATED_VERIFICATION_PACKAGE.md updated.

Offline verification results:
- node --test tests/*.test.cjs: 177 passed, 0 failed, 0 skipped (11 new).
- New fabricated tests exercise actual generated native bridge end-to-end via
  private-source test compilation, default disabled/global/argument bypass denial,
  missing authorization/config, unknown closure, absent/unmapped aliases, stale/
  partial/changing snapshots, exact read-only API calls, denied mutation/services,
  private error/header suppression, layout overrides, fixed output shape, header-
  only STRUCTURE operation and per-context attempt/window limits. No existing
  security/privacy tests removed, changed or skipped; no dependency added.
- Package stage/verify and Acorn ES2020 grammar/API compatibility pass. External
  seal refreshed; local upload payloads match it. Inventory remains Verification.gs,
  appsscript.json and ignored .clasp.json; private clasp bytes unchanged, same
  owner-confirmed 4.0 target/rootDir dot/mode 0600. Documented Node preflight passes.
  Only the two project payload files are uploadable; no clasp command was run.
- Existing browser/responsive/navigation/network isolation, privacy, scoring,
  champion/prizes, contract and artifact-security checks pass. Current/historical
  private-reference scans of all eight changed/untracked files and Git whitespace
  checks pass. Normal Apps Script source, public synthetic website, six-file
  allowlist/workflow, main and 3.0 untouched.

Remaining owner actions/blockers:
Owner must privately verify intended separate target, sole-editor/no-deployment/
trigger/library isolation and minimal effective grants. This is Google's editor
access boundary, not authentication proven by config booleans. Actual runtime/
metadata/column/timezone parity and private identity format remain unverified.
STRUCTURE needs reviewed column descriptors and explicit one-read authorization;
VERIFY additionally requires complete aliases, historical closure/reopen evidence
and credible independent revision/completeness/quiescence authority. Static config
attestations/equal repeated reads/guards/capacities do NOT establish source authority.
No source authority is manufactured by this connector. Missing accounting,
completion/oracles block related parity claims; no automatic comparison or live
publication. Uploaded remote code is NOT updated by this local generation.

Exact next owner-controlled action/resume:
Review FIRST_LIVE_VERIFICATION.md's Functional native connection section and
explicitly authorize uploading ONLY tmp/verification-upload/Verification.gs and
appsscript.json to the separate 4.0 project after the documented Node preflight.
Future owner-only command is clasp push FROM tmp/verification-upload, not src.
Do not deploy. Then verify manifest/effective grants and sole-owner isolation,
privately configure the remote provider for STRUCTURE, and obtain NEW explicit
first-read authorization before executing verifyPerfectPick4Package_ once. Inspect
only the redacted report privately and immediately restore return null. No real
read is authorized automatically by upload, configuration or these passing tests.
Resume: "Read AGENTS.md, PHASE5_PROGRESS.md and FIRST_LIVE_VERIFICATION.md. Confirm
the exact newly authorized owner operation. Connector is implemented; do not redo
planning, bypass evidence, access Google, upload, authorize or run a diagnostic
without the specific next approval. Keep public Pages synthetic and preserve 3.0."

## Form entry point and validated dashboard bridge — implementation checkpoint

Branch develop; baseline 638d241. Current task permits development/testing/commit/
push only. Actual reads, Apps Script upload/run, OAuth, publication and deployment
still require separate owner approval. No real Form/Sheet/3.0 interaction occurred.

Milestone 1 COMPLETE: approved local configuration inspected without printing IDs.
No verified canonical player-facing URL exists in apps-script/config or the local
setup reference. No URL was guessed from IDs/backups or downloaded. Submit Picks
now appears in the existing deadline card, disabled with an owner-verification
explanation. Owner must privately provide the official published player view URL
and explicitly approve navigation. Strict private Form-link validation rejects
edit/admin, short redirects, alternate hosts, prefilling/query strings, fragments,
unknown fields and non-fresh/non-official/non-OPEN status. Public assets contain
no external URL; no custom submission form or production Form changes.

Milestone 2 COMPLETE: tools/presentation/contract-dashboard.cjs maps strictly
validated v1 records to Overview, Match Center, Weekly/Monthly/Season Standings,
Prizes and the retained Guide/navigation. Approved aliases and points/ranks are
preserved; FINAL-only correctness, vote basis points, shared monthly decisions,
unknown accounting and payment status remain authoritative. Explicit activeWeek
context is required; neither last/highest week nor time guesses choose authority.
CLOSED-but-withheld now renders unavailable rather than zero votes/submissions.
No duplicate winner algorithm or financial rule is introduced.

Milestone 3 COMPLETE: optional trusted consumeValidated handoff in prepared
coordinator/native connector, only after public-contract validation. Default
packaged diagnostic supplies no consumer; globals/arguments cannot enable one.
Private owner-process assembly in tools/presentation/private-dashboard.cjs connects
that handoff to the approved interface entirely in memory, with no HTTP listener,
endpoint, file write or deployment. Browser adapter fetches nothing; invalid/stale
snapshots fail closed and expired private content is cleared. Normal six-file
synthetic fixture adapter remains the only published data source. Private context
flags are not authentication; actual owner access/transport must be verified.

Milestone 4 COMPLETE: node --test tests/*.test.cjs: 189 passed, 0 failed,
0 skipped (12 new). Includes native fake connector-to-consumer/model/asset path,
Form URL/OPEN authority/freshness rejection, strict schema/aliases, zero versus
withheld votes, pending results, monthly ties, unsupported money, source expiry,
private browser navigation after expiry, all destinations and mobile/tablet/desktop
checks with renamed fabricated approved aliases. Existing tests retained. A new
virtual-time test required resuming Chrome's simulated clock after expiry; fixed
without removing expiry/navigation assertions, then the full suite passed.

No actual 3.0 comparison has been run. Existing deterministic comparator is reused
with fabricated same-revision examples. Real normalization/baseline and independently
approved champion/accounting oracles are missing; no actual MATCH is claimed.

Final verification: both artifact seals/inventories and ES2020 package checks
pass; upload payloads refreshed with ignored private target config unchanged.
Six-file publication allowlist, synthetic config/fixture, CSP and manual-only
workflow remain unchanged. Current/historical private-reference and whitespace
checks cover all modified/untracked files. No real credentials or identifiers.

Exact continuation: Owner next supplies canonical public
player URL privately and separately authorizes the existing isolated source upload,
then a precise STRUCTURE/OAuth verification as documented. Do not read real data,
change 3.0/Forms/Sheets/triggers, publish an endpoint or deploy Pages automatically.
Full steps: docs/architecture/WORKFLOW_DASHBOARD_INTEGRATION.md and
FIRST_LIVE_VERIFICATION.md. Authenticated real browser transport remains an explicit
security/access gate; no JSONP/public snapshot workaround was implemented.

Additional boundary: the current native VERIFY mode deliberately requires CLOSED
evidence for all requested weeks. The new view bridge handles valid OPEN/UNKNOWN
contract outputs without selections, but current-week OPEN results/control transport
needs a reviewed read plan/evidence before activation. No inferred OPEN status or
elapsed-deadline closure is introduced. Private consumer assembly is in-process
only, not an authenticated browser delivery implementation or a public endpoint.

## Focused 3.0/workbook compatibility — implementation complete offline

Branch develop; baseline 66adb55. Checkpoint revision is the containing commit.
Owner-supplied layout/source analysis only; no live workbook access or original
3.0 function execution. Intentional example phone redactions are NOT production
identity defects. No personal workbook records/IDs/configuration stored here.

Implemented findings:
- tools/sheets/workbook-profile.cjs: actual owner-supplied Results Week A/Game B/
  Team 1 C/Team 2 D/Winner E/Status F/scores G-H; Responses Timestamp A, private
  Phone Number C. No Name B/Players reads. Old permuted fixture retained as a
  configurable-layout regression, not a live default. Weekly/prediction columns
  after C require explicit private descriptors for VERIFY, never guessed letters.
- tools/compatibility/pp3-identity.cjs and native coordinator/evidence integration:
  PP3_PHONE mode mirrors digit stripping/eleven-digit leading-1 removal from
  40_Cache_Helpers.js:258. Responses and approved registry keys use identical
  normalization; collisions/empty approval keys reject. No public phone-derived
  keys, submitted-name fallback or automatic approval. Explicit first+last-initial
  aliases (one optional terminal period) now validate consistently in v1/projector/
  owner evidence. Players registry display names alone never authorize publication.
- Projector: latest timestamped nonempty weekly entry selected BEFORE chosen-pick
  validation; equal timestamps use later source order as in 20_Data.js:67. Older
  invalid superseded picks do not invalidate a later valid entry; bad latest picks
  do not resurrect older entries. Matchup vs/vs. and last-word canonical team
  matching now follow 3.0 while rejecting conflicting approved mappings.
- Scoring/ranks: Final-only one-point rules, missing-pick exclusion from completed
  pick denominator, complete-perfect-week requirement and union-of-participants
  monthly/season aggregates retained. Tiebreakers never alter points/ranks.
  Accuracy is correct / completed SUBMITTED FINAL picks, not all completed NFL
  games. A missing pick prevents Perfect Week even with 100% submitted-pick accuracy.
- tools/compatibility/legacy-prize-facts.cjs: pure approved fact mapping for existing
  weekly pots, NEW-rule rollovers, monthly funding shares and confirmed/projected
  season pools. Exact cents; no inferred active-player counts or recalculated splits.
  Explicit per-scope accounting/rollover approval needed; projector/validator check
  finality/no-perfect/accounting consistency. Ignore notes, name-bearing records,
  monthly payout placeholders and raw payment flags. No settled payments or monthly
  allocation invented. No new financial tab reads; approved facts remain a later
  capture/import gate.
- Native STRUCTURE now permits empty game/period manifests. Bundled factory
  minimalStructureConfig returns disabled/null private placeholders with TEN known
  header cells only. No aliases, phone values, capture/closure evidence or guessed
  game columns needed for first metadata/header verification. VERIFY retains all
  prior gates and read-only scope. Private provider still returns null by default.
- Documentation: PP3_COMPATIBILITY.md records precise source references, actual
  versus alternate layouts, deliberate stricter validation/privacy differences,
  exact factory usage and owner-controlled next action. FIRST_LIVE_VERIFICATION.md
  and LIVE_DATA_CONTRACT_V1.md updated for minimal profile and approved alias syntax.

Tests: 205 passed, 0 failed/skipped (16 new) via node --test tests/*.test.cjs.
New fabricated regressions cover real layout order, normalized duplicates/timestamp
order, superseded/latest invalid picks, private aliases/collisions/redaction,
FINAL-only accuracy versus schedule coverage, sparse period participation, team/
matchup spelling, monthly ties, approval-gated cents/rollovers, strict contract
validation and first STRUCTURE header-only access. Existing browser/responsive/
network isolation, privacy, scoring, package, syntax and artifact checks pass.
Final package/seal refresh, ES2020 parser gate, source/native capability inspection,
private-reference scans and owner upload preflight PASS. Ignored upload inventory
remains Verification.gs, appsscript.json and .clasp.json; private target bytes,
rootDir dot and mode 0600 unchanged. Sole read-only manifest scope unchanged.
Public six-file artifact/seal and Git whitespace checks PASS; all modified and
untracked files reviewed. Additional tests reject coercible accounting objects
and exercise the bundled minimal factory in a fabricated native-service VM.
No dependencies added or existing tests weakened. Original apps-script/src,
website, fixture/adapter, publication workflow, main and 3.0 are unchanged.

Remaining deliberate differences/blockers:
3.0's invalid timestamp-to-zero and silent empty-phone skips are NOT copied: 4.0
blocks ambiguous/unidentifiable captures instead of fabricating completeness. This
says nothing about actual production phones; redacted examples cannot prove private
identity parity. Coherent numeric FINAL scores and explicit aliases/CLOSED authority
remain mandatory. Old-week/deadline disclosure (10_Prizes_Scoring.js:450) is NEVER
used. 3.0 writers/setup/sync/triggers remain untouched and excluded. No real score,
accounting or identity parity has been certified; Sheet coordinates/timezone/runtime
must still pass the authorized header read. Public Pages stays synthetic unchanged.

Exact next owner action/resume:
Review PP3_COMPATIBILITY.md's minimalStructureConfig example. Explicitly authorize
uploading ONLY the sealed Verification.gs/appsscript.json from tmp/verification-upload
(after documented Node preflight) to the separate owner-only 4.0 project. Do not use
apps-script/src or deploy. Privately fill target/timezone and fresh activation window
in the REMOTE provider; review sole-editor/no-public-deployment/no-trigger/library
isolation and effective spreadsheets.readonly scope. Then separately authorize ONE
verifyPerfectPick4Package_ STRUCTURE execution/OAuth review, inspect only the fixed
report and restore return null. No read is performed or authorized automatically.
Later VERIFY needs actual matchup/prediction descriptors, independent capture authority,
normalized approved aliases and historical CLOSED evidence; public transport/Form URL/
financial fact authority and publication remain separate gates. Resume at this owner
header-only action, not another broad audit or a production-writing operation.

## Integrated dashboard delivery — completed locally, activation pending

Checkpoint branch: develop. Starting commit: 149dac2. The focused integration
commit containing this checkpoint is the next descendant (resolve with
`git log -1 --format=%h -- docs/migration/PHASE5_PROGRESS.md`). No production
resource, Apps Script upload/execution, OAuth, or website deployment was performed.

Owner-reported live evidence supersedes the preceding STRUCTURE next step:
separate 4.0 STRUCTURE and Results A1:H400 reads succeeded, reporting 272 games,
121 final and 151 pending. Diagnostic disabled afterward. Do not repeat them.
The ignored redacted workbook was inspected locally: Results A-H, response Wn
question columns through week 9, monthly predictions at ending-week questions,
Tiebreak Rules designation B versus Question Label I, and prize-rule/accounting
columns verified. Phone redactions are intentional, never production defects.
No raw workbook rows, names, contacts or private identifiers were copied to Git.

Implemented:
- tools/presentation/sheet-dashboard.cjs: persistent native Sheets v4 bounded
  delivery -> existing reader/projector/validator/dashboard bridge. Stable
  repeated Results reads, real Result team/order/header mapping, actual Form
  Control context and prize period/tiebreak designations. Results-only works
  without aliases/closure/capture; private scopes stay unavailable.
- Independent approved alias/CLOSED/capture/decision gates reuse Phase 5 modules.
  Future uncreated Form columns no longer block current approved closed weeks.
  Latest private normalized-phone/week submissions and Final-only points retained.
  Season coverage explicitly labels included weeks; no invented missing periods.
- Optional approved financial import reads actual pot overrides/active-player
  counts, allocation shares and NEW rollovers; never Ledger names/notes, settled
  payments or monthly prize allocations. Unsupported accounting stays unknown.
- tools/presentation/package.cjs + live-config.cjs: exact two-file sealed build
  of the EXISTING UI and same backend, disabled by default. Owner-only HtmlService
  and google.script.run transport avoids anonymous JSON/CORS/JSONP. Manifest fixes
  MYSELF/USER_ACCESSING, Sheets v4, sole spreadsheets.readonly scope. No writers,
  Form actions, triggers or legacy operations. No private configuration in client.
- live-client.js + website/app.js: all five destinations share current validated
  data, onload/manual/six-hour/return-to-tab refresh. No server triggers installed.
  Failure/expiry clears protected DOM and retries safely. Fixed retry cleanup
  preserving nested Match Center nodes; listener setup no longer accumulates.
- Official player Form button accepts privately verified canonical published URL;
  no locally established published URL, so default remains unavailable. A link is
  navigation only, not OPEN evidence; official Form remains the entry authority.
- READ_ONLY_DASHBOARD.md gives exact minimal activation/rollback and private
  configuration placeholders; FIRST_LIVE_VERIFICATION.md points to current action.

Completed checks:
- `node --test tests/*.test.cjs`: 219 passed, zero failed/skipped. Fabricated native
  service/RPC tests, writer-denying stubs, CLOSED/alias/capture revocation, real
  column mappings, two-letter team keys, future absent response columns, approved
  prize funding, Form URL checks and refresh/recovery covered. All prior contract,
  scoring/monthly decisions, privacy, ES2020 Apps Script grammar, integrity/security,
  browser external-network isolation and 375/768/1280 layouts retained and passed.
- Ignored workbook passed in-memory integration: 272 games, five periods, private
  records withheld. No production reads or generated real-data snapshots.
- Presentation stage/seal and owner-only manifest checks pass. Default diagnostic
  package regenerated separately. Public six-file Pages allowlist/workflow and
  synthetic adapter/fixtures remain intact; no new dependencies.
- tmp/presentation-upload contains only Verification.gs, appsscript.json, ignored
  local .clasp.json. Target matches owner-verified separate 4.0 target; rootDir dot,
  mode 0600; payload matches seal. Workbook/upload/private config stay ignored.

Remaining approval/configuration gates:
Actual owner-only HtmlService/OAuth/runtime behavior and real scoring/identity/
financial parity are not certified by offline tests. Owner must supply target,
timezone, expected count and verified player-facing Form URL privately. Real
player display additionally requires approved aliases, independent fresh CLOSED
and capture evidence; monthly champions need completion/decision authority;
financial publication needs accounting approval. Read timestamps do not prove when
3.0 last synchronized scores. Six-hour refresh runs only while the page is open;
no server scheduled snapshot or duplicate sync is installed. Public release/access
review and any real-data publication remain explicit separate approval gates.

Exact next owner action / resume:
Review docs/architecture/READ_ONLY_DASHBOARD.md and authorize uploading ONLY the
sealed presentation Verification.gs/appsscript.json from tmp/presentation-upload
to the SAME separate 4.0 project, replacing the prior diagnostic-only code. Do not
use apps-script/src. After approval, owner runs `cd tmp/presentation-upload` then
`clasp push`; this task does not run it. Owner privately configures the remote
provider, reviews sole read-only grant and separately authorizes owner-only web-app
deployment plus dashboard reads. Then privately compare results/ranks against 3.0;
never publish raw records or grant aliases/closure automatically. Keep Pages
synthetic. Rollback disables deployment/restores null provider; 3.0 unaffected.
Resume at owner activation/verification, not another audit, STRUCTURE read, CSV
preview or custom submission form.

## Return to final GitHub Pages / existing JSON API integration

Branch develop; starting commit 567d6e1. This entry supersedes the preceding
HtmlService activation as the final hosting direction. That owner-only deployment
is a testing reference only and was not modified in this task.

Completed implementation:
- Reused original doGet/ContentService JSON architecture and PP3 context,
  latest-submission, result lookup and prize builders. Original frontend calls
  prizes and lazy week; health/summary/overall contracts also verified from source.
- tools/api/legacy-provider.cjs produces an allowlisted validated public snapshot;
  tools/api/json-extension.cjs generates one disabled additive API extension.
  apps-script/extensions/PP4_JSON_ROUTE.patch adds dashboard4 without changing any
  existing response branch, cache, writer, Form routine or trigger. Original src
  is untouched; patch tested in memory against the actual router.
- Actual contract differences requiring the small addition: CLOSED-only disclosure,
  explicit alias approval rather than name fallback, future Results games before
  response questions exist, monthly champion/tiebreak decisions and unknown payments.
  Existing API has a forbidden-key filter; no production disclosure was assumed or
  queried. Reported OPEN/reopened control denies current-week disclosure even when
  an older CLOSED proof exists. Missing aliases withhold rather than fabricate zero.
- tools/api/browser-client.cjs connects the existing redesigned app to the same
  fixed Apps Script /exec URL and dashboard4 action. Strict validation, 120-second
  freshness, coalescing, timeout/expiry/error clearing, optional verified Form link;
  no JSONP, client secrets, alternate-URL switch or raw legacy fallback.
- tools/api/pages-artifact.cjs builds/verifies exact six-file API publication
  profile. Manual develop-only Pages workflow defaults to synthetic; API profile
  requires explicit public endpoint approval, all tests, privacy scan and unchanged
  sealed artifact. Original synthetic controls are retained, not weakened.
- docs/architecture/GITHUB_PAGES_API.md documents original action/field contracts,
  actual incompatibilities and minimum owner-approved activation. No new platform,
  backend project, dependencies or architecture phase.

Validation: 231 tests passed, zero failed/skipped, via node --test tests/*.test.cjs.
Includes actual original scoring/latest-submission function parity, monthly ties/
invalid predictions/shared ranks, approved identities, reopened/unknown/stale closure,
no contact/raw record leaks, generated ES2020 extension, unchanged legacy routes,
JSON CORS transport with fabricated intercepted responses, all five destinations,
375/768/1280 layouts, original browser isolation and artifact/security checks.
Original redacted workbook structural findings reused; redacted phones intentionally
not treated as production defects. Workbook and private activation inputs stay ignored.

Exact next action: review GITHUB_PAGES_API.md and authorize only the additive
extension/route in the EXISTING working JSON API project and an update of its
existing deployment/version, retaining its URL. Do not use the current separate
4.0 clasp target or bulk-upload src. Privately configure results-only publication
approval; do not approve aliases/closure/accounting automatically. Then separately
approve a bounded sanitized JSON/CORS verification and manual API-profile Pages
publication. Existing public API URL recovered locally into ignored activation
configuration with publicationApproved false; no endpoint or private value in Git.
Actual live JSON/CORS/competition parity remains unverified until authorized API
activation. No production interaction, upload, execution, deployment, GitHub settings
change, new trigger, Sheet/Form change or actual-data publication occurred here.

## Player-facing completion — local work in progress (2026-11-04)

Supersedes historical activation instructions above. Last successful published
commit: 3d0af3a on develop. Owner-authorized results-only API version 17 and Pages
publication succeeded previously; this task does not change either deployment.
Historical verified counts (272/121 FINAL/151 pending) are not a freshness guarantee.

Completed first milestone: existing PP3 source/builders and ignored redacted workbook
headers rechecked locally, without live calls or copying private records. Existing
JSON week/overall/prizes shapes contain scores/standings/picks/pot computations;
original actions were successfully live-tested in the preceding authorized activation.
This task adds no raw legacy browser fallback. Existing dashboard4 already provides
weekly/monthly/season tables, player cards/votes, and shared champion resolution.
Local fixes now restrict envelope aliases to actually disclosed CLOSED-week records,
require explicit approved first-name/last-initial labels at the JSON boundary, retain
the original created-response-week season scope, and support explicit fresh weekly
allocation approvals using original PP3 perfect-week/payout calculations. No payments
or monthly payout placeholders are promoted to settled accounting. Private JSON
arrays can configure existing decision/accounting maps without client configuration.
Accuracy tooltip now states submitted FINAL picks; incorrect picks retain X with
neutral styling. Tests/activation gate completion recorded in the next entry.

Touched: tools/api/{legacy-provider,player-authority,browser-client,json-extension}.cjs,
website/{app.js,styles.css}, tests/json-api.test.cjs, tests/browser.test.cjs,
tests/support/pp3-api-example.cjs, and this checkpoint. Only local source changes.
Next: finish fabricated regressions, run the complete suite and both artifact checks,
then commit/push passing changes. No production upload or Pages dispatch authorized.

Second completed milestone: 20 focused JSON integration regressions PASS (including
8 new tests), using actual original PP3 functions in a fabricated service sandbox.
Verified overall/monthly rank/point/completed-pick parity with a partially selected
slate; explicit allocation approval maps original payout amounts to approved public
keys; rollover requires separate fresh approval and validated full-pot destination.
Tests reject invalid aliases/unused public alias enumeration, missing/reopened/
unknown/stale closure, wrong-revision allocation authority and malicious private
configuration. Existing equal-distance/missing-prediction champion regressions pass.
The GITHUB_PAGES_API.md activation appendix records exact existing configuration
shapes and remaining approvals. No actual aliases/phones/URLs/IDs are recorded here.
Full suite, final artifact validation, commit/push and next-step status follow below.

Final local validation milestone: COMPLETE. `node --test tests/*.test.cjs`:
240 passed, 0 failed/skipped (21 focused JSON tests, 9 added). Browser tests retain
all previous assertions and add incorrect-pick neutral styling and submitted-FINAL
accuracy-label checks. Fabricated aliases in the JSON helper now use invented
first-name/last-initial labels; generic synthetic previews remain unchanged.
Owner configuration non-mutation regression passes. All existing monthly champion,
points/ranks, picks/votes, Form-link, revocation/expiry, desktop/tablet/mobile,
network isolation, read-only denial, grammar/security and artifact tests pass.

`public-artifact.cjs stage/verify` PASS. Disabled extension regenerated locally;
Apps Script ES2020 compatibility and private-reference inspection PASS. Local API
artifact stage/verify/seal PASS, exact six-file inventory unchanged. Compared with
the published baseline build: only styles.css, preview-data.js (JSON client bundle)
and app.js differ. Config/endpoint, index.html, synthetic fixture, workflow and
original apps-script/src are unchanged. Git whitespace check and complete modified/
untracked-file review PASS. No dependencies added. No network service reads,
clasp/OAuth/source upload, deployment/API changes, Sheet/Form/trigger modifications,
real player capture or public player-data publication performed in this task.

Status: player integration candidate is implemented/tested locally; LIVE player
features remain BLOCKED on owner evidence/approval. Approved alias records and
independent fresh historical CLOSED evidence have not been supplied. Do not derive
aliases from names, infer closure, renew static evidence automatically, fabricate
payments or claim real player/accounting parity. Verified canonical player Form URL
is still absent; Submit Picks remains safely disabled. Monthly tables/champions
remain withheld/pending until configured period evidence permits disclosure.

Exact resume: read this latest entry and GITHUB_PAGES_API.md's player-feature
appendix, then use `git log -1 --format=%h -- tools/api/legacy-provider.cjs` to identify
the tested implementation commit. Request the owner's private approval inputs and
explicit authorization for narrowly scoped player parity verification / additive
extension upload using active production baseline 17, preserving unpublished editor
source. Do not repeat the source/workbook audit, STRUCTURE/Results connectivity
checks, create infrastructure, rerun score/Form setup, or dispatch Pages yet.
After separately authorized validation of aliases/CLOSED/scoring/monthly/prizes,
request separate player-data publication and Pages activation approval. Keep the
current results-only version 17 / published commit 3d0af3a working until then.

Last successful implementation commit: **619d1de**, develop. Tests: 240/240 PASS;
local candidate ready for private evidence review, NOT authorized for deployment.
This documentation-only checkpoint commit follows the implementation commit.
Resume instruction: continue from 619d1de using the exact owner-evidence/approval
step above; do not restart implementation or activate player publication automatically.

## Activation-blocker consolidation (2026-11-04)

Resumed from develop 61be980 / tested implementation 619d1de. Read-only local
blocker review complete; no frontend/API code, deployment, production resource or
permission changes. One concise checklist is now
`docs/architecture/PLAYER_ACTIVATION_APPROVAL.md` (source references included).

Verified: Form link is dynamic, not a locally configured published responder URL;
original source, saved baseline/editor/activation config and ignored reference
workbook contained no verified responder URL. Linked Form metadata can supply it
in the next authorized read; owner need not invent/copy an edit URL or run diagnostics.
Normal scheduled/manual closure verifies response acceptance before writing current
CLOSED markers. Form Control/Script Properties overwrite current-week state, and
repair paths exist; no local historical closure archive was found. Current markers
alone cannot independently prove historical closure or current response acceptance.
No live Form/Sheet/Properties/execution-history read was performed.

Private owner review prepared ONLY under ignored `tmp/player-activation-review/`,
directory mode 0700 and private JSON mode 0600. `aliases-review.private.json` has
23 reference registry-label drafts, all approved:false, no phone values; five draft
labels repeat. Actual normalized joins/duplicate-player reconciliation cannot be
established from intentionally redacted phones. No aliases approved, inferred as
publication authority, committed or published; no private values copied here.

Reference comparison: M1 weeks 1–4 has 64 coherent FINAL games; M2 weeks 5–8 has
57; later periods are incomplete. Five NEW periods use configured 50/50 shares and
include season funding. Weeks 4/8 designated games have FINAL scores, while stored
Actual Total is blank; existing resolver uses Results scores, so no owner-supplied
combined total or score repair is needed. These are reference-only facts, not a
freshness guarantee or certification of real player winners. Existing PP3 prize
reader uses active-player count/override, not raw winner-name/finalized columns;
source outcomes drive weekly shares/NEW rollovers. No monthly payment/season
payout authority inferred. Redacted identities cannot certify winners/rollovers.

Remaining: one owner authorization for bounded private existing-system reads;
actual alias/identity approval; positive historical closure evidence or explicit
scoped owner attestation if retained records are absent; permitted publication
scopes/accounting exceptions; conditional controlled release approval. Do NOT ask
for manual recomputation of rule-based scores/pools or repeat connectivity checks.
The existing freshness gate still expires manual evidence; reliable historical
reverification has NOT been established, so continuous player disclosure cannot yet
be claimed ready. No static timestamp may be silently renewed.

Exact next step: owner reviews the four items in PLAYER_ACTIVATION_APPROVAL.md.
After explicit read authorization, automatically retrieve linked published Form URL,
current acceptance/control, private registry joins and necessary bounded competition
facts; reconcile privately and report only counts/exceptions. Do not invoke writer
or diagnostic helpers that enumerate/manage triggers. Only unresolved identity,
historical closure, tie/accounting exceptions need owner judgment. Release remains
blocked until separately authorized and evidence/security/parity checks pass; API17
and the published results-only site remain unchanged. No new architecture phase.

Checks for this documentation-only checkpoint: 37/37 relevant JSON/PP3 compatibility
regressions PASS, 0 failed/skipped; both safe documents pass private-reference scan;
Git whitespace check PASS. Ignored private review inventory/modes verified; no private
review contents staged. Files touched in Git: this checkpoint and
PLAYER_ACTIVATION_APPROVAL.md only. Latest full implementation suite remains
240/240 at 619d1de; no runtime changes require reimplementation or deployment.

## Owner-authorized bounded verification — PARTIAL / access exception

2026-11-04; resumed develop 7c283ae. Owner explicitly approved the checklist's
bounded private read, including necessary identities/weekly predictions/rules/
accounting comparison. This read permission persists; do not request it again for
the same unfinished scope. No upload/deployment/new OAuth/publication authorized.
Last tested runtime implementation remains 619d1de (full suite 240/240); no code
changes in this verification task.

Completed against existing read-only JSON actions:
- Successful prizes/overall plus weeks 1–9 comparison; actual active week reported 9.
  All 23 API display labels unique. Original overall equals prize overall; season
  equals weekly score/completed-submitted-pick totals; all five monthly aggregates
  match their covered weekly totals. This is API label-level parity only: private
  phone joins, source quiescence/revision and last score-sync freshness NOT verified.
- M1 complete with a single points leader; M2 complete with two points leaders and
  a decisive combined-score tiebreaker. No equal-distance owner decision required.
  M3–M5 incomplete. No real winner, identity, picks or prediction logged here.
- Weekly count/entry/override-pot arithmetic, monthly shares, season contributions,
  confirmed/projected season totals all match original JSON computations, no tested
  arithmetic exceptions. No settled payment/accounting authority fabricated.
- Ignored actual-API alias review prepared: 23 draft labels, zero duplicates;
  six labels have only one name component and need an owner-approved initial after
  registry verification. Every approval remains false. API-derived labels are NOT
  verified registry identities. Reference draft collisions are not a production
  finding and are superseded for API display review only.

Concrete blocker: local Google grant has drive.file/metadata and script-management
scopes but no dedicated Sheet/Form-body scope. Authorized minimal Sheets v4 metadata
probe returned HTTP403 accessNotConfigured (service disabled for the local OAuth
client's project), before returning any rows. File-specific access remains untested.
No connector document session is connected. Enabling service/changing credentials/
new OAuth would cross the read-only authorization boundary and was NOT performed.
No browser credentials extracted. No source/deployment/Sheet/Form/trigger changes.

Therefore still UNVERIFIED: linked Form's actual responder URL and acceptance,
actual Players normalized-phone joins, historical closure records, direct financial
row provenance. No historical CLOSED week or public alias approved; current Form
Control status alone is not a grant. Existing static evidence expires normally.

Private results are ONLY under ignored tmp/player-activation-review/, directory
0700, private JSON0600: api-summary.private.json, api-reconciliation.private.json,
prize-facts.private.json, aliases-live-api-review.private.json and read-access.private.json.
No contacts/raw picks/notes stored in reconciliation; valid numeric leader comparisons
and original API-derived labels remain private. An earlier rejected API-response batch
is recorded privately; the successful summary supersedes that attempt. No repeat of
completed comparisons is needed unless source revision changes or new exceptions arise.

Exact resume: restore an existing authorized bounded Sheets/Form metadata connection,
or obtain explicit owner authorization for necessary access configuration (no new
backend/hosting). Then use the already approved scope to obtain linked published Form
URL, current acceptance/control, actual registry joins and retained historical closure
records privately. Resolve the six missing-initial draft labels and obtain alias
approval; seek explicit historical attestation ONLY for weeks lacking retained positive
proof. Retain fail-closed expiry and no deadline inference. No owner recalculation or
M2 tie decision needed. Follow PLAYER_ACTIVATION_APPROVAL.md's remaining conditional
publication/release item only after evidence/parity checks pass; version17 and Pages
remain unchanged. This task is NOT claimed complete beyond the JSON comparisons.

Post-read checks: 37/37 relevant JSON/PP3 compatibility tests PASS, no failed/skipped.
Private draft approvals/permissions and Git ignore status checked. Only safe checklist/
checkpoint documentation is intended for Git; no private records/URLs/IDs/grants.

## Existing Apps Script connection diagnosis — no production changes

Resumed from develop d4f99a5. Identified the exact credential class used by the
failed probe: initAuth(default) selects clasp's Google-provided default OAuth
client (verified with installed clasp getOAuthClientType, fingerprint saved only
privately). This is distinct from the working Apps Script service authorization.
No new API service, Cloud project, OAuth client, credentials or grants configured.
Do not misdiagnose accessNotConfigured as a failure of 3.0's Sheet or score updates.

Current read-only source/manifest/deployment checks:
- Existing 4.0 owner-reference runtime has Sheets v4 enabled, sole
  spreadsheets.readonly manifest grant and MYSELF / USER_ACCESSING access. AST
  inspection confirms only two top-level functions: doGet/getPerfectPickDashboard.
  No callable generic reader/player diagnostic/Form metadata getter exists; its
  sanitized model cannot supply the still-private phone join or responder URL.
- Existing isolated staging runtime still has MYSELF / USER_ACCESSING access.
  Prior recorded four-scope owner consent includes Sheets and Forms, sufficient
  services for the required read operations without a new OAuth scope. Current
  staging source has no private identity/Form diagnostic route/helper. No writer,
  Form setup/close, score sync, trigger function or diagnostic was executed.
- No source was uploaded/changed and no deployment was created/modified. This was
  management metadata/source inspection only; no live Sheet/Form rows were read.
  Current published 4.0 and production17 remain untouched.

Remaining boundary and exact owner action: approve ONE temporary bounded editor-only
read diagnostic in the EXISTING private staging project, plus ONE owner execution
under its existing grants. This requires a remote staging source addition, so it
was not performed under read-only authorization. No HTTP route/new deployment,
production source edit, new Cloud/OAuth project, scope expansion or trigger/writer
is necessary. After approval, prepare/review the exact helper locally, read linked
Form metadata and minimum Players/response joins/current control/identified closure
records privately, then retain only safe ignored reconciliation output. Stop on any
new consent request. Existing generic read authorization persists; only the source
addition/one-execution boundary needs approval. Do not rebuild infrastructure or
repeat completed 3.0 arithmetic comparisons.

Previous successful results retained: season/monthly/weekly parity and prize
arithmetic verified, M1 clear leader, M2 decisive tiebreaker; no manual tie decision
needed. Actual Players phone joins/Form URL and historical CLOSED still unverified.
Six existing single-name draft labels need private initial review; zero aliases or
historical weeks approved. No private identifiers/names/values are in this checkpoint.

Private diagnostic records: tmp/player-activation-review/existing-connection.private.json
and entrypoint-check.private.json, mode0600; no credentials or source payload saved.
Files touched in Git only: this checkpoint and PLAYER_ACTIVATION_APPROVAL.md.

Checks: 37/37 relevant offline JSON/PP3 compatibility tests PASS, zero failed/skipped;
safe-document private-reference scan and Git whitespace checks PASS. Private diagnostic
files remain Git-ignored. Checkpoint is BLOCKED on the precise staging source/one-run
approval above, not on another audit or new infrastructure. Runtime code unchanged.

## One approved editor diagnostic — capture failure; exact restore COMPLETE

Owner approved one temporary bounded staging diagnostic and one execution, with
removal/restoration required. Starting checkpoint 0589b5c; production API17 and
published Pages remain unchanged. Do not repeat the execution without new approval.

Performed in the existing private staging project only:
- Saved full recoverable source/manifest and deployment metadata backup, plus
  production editor/deployment hashes. Verified staging source against the saved
  clean seal and MYSELF / USER_ACCESSING access before adding one temporary file.
  No existing file, manifest, router, deployment, OAuth scope or trigger changed.
- Diagnostic read only Players A:B, Responses timestamp A/private phone C (bounded
  to 1001 rows), linked Form published URL/acceptance, Form Control A1:H2 and tab
  names for known history titles. Existing normalization used; no raw phones,
  submissions or registry full names in its report. No logging or persistent writes.
  Fake-service bounds/privacy/error masking and Apps Script ES2020 tests passed.
- Executed verifyPlayerActivationOwner ONCE via the existing staging editor debugger;
  no new consent requested. Reached the report breakpoint after bounded reads. The
  visible report preview showed PRIVATE_OWNER_REVIEW_ONLY, proving its linked-Form
  responder validation passed, but its long JSON-string value was truncated by the
  debugger UI. The full report could not be saved before the paused execution timed
  out at 360.634 seconds. Browser retained responses did not recover the report.
  This is an agent report-capture failure, not an authorization/service failure.
- One incidental staging doGet/summary read also completed when an editor keyboard
  shortcut was used before selecting the diagnostic. No writer, synchronization,
  Form-control or trigger function was selected or executed. Use browser Reload
  button, not that keyboard shortcut, in future editor automation.
- Removed the temporary file immediately after timeout. Server readback confirms
  EXACT pre-operation staging file hashes/manifest, unchanged staging deployments,
  unchanged production editor and unchanged API17 deployment. Browser refreshed
  afterward; temporary file/function absent. No second diagnostic execution attempted.

Results NOT certified: actual Form URL was fetched/validated inside runtime but not
retained; registry reconciliation count and individual alias matches were not captured;
historical closure count not recovered. Do not label the 23 prior API drafts as
registry-verified. Six single-name candidates remain unresolved, all approvals false.
No new historical CLOSED proof, payment or public identity authority is established.
Prior verified scoring/monthly champion/prize arithmetic remains valid within its
recorded snapshot; do not repeat those comparisons merely because report capture failed.

Private recovery/diagnostic files only under ignored
`tmp/player-activation-review/editor-diagnostic/` (0700; JSON/backup files0600):
backup.private.json, candidate-hashes.private.json, upload.private.json,
restored.private.json, execution-outcome.private.json. No secret/ID/report values
copied into Git. Local TemporaryOwnerRead.gs now has a prepared, fabricated-tested
bounded chunked private report (160-character chunks, maximum90) to avoid the UI's
string truncation; this corrected capture candidate was NOT uploaded or executed.

Exact resume: request approval for ONE additional same-scope diagnostic execution
using the corrected private capture. No new scope/project/client/deployment is needed.
Use a fresh staging source backup; prior operation's backup must remain preserved.
Read the small report chunks immediately, end execution before the six-minute limit,
save only to the ignored private review location and restore staging exactly again.
Do not reinterpret prior one-run approval as permission to retry. Production/Pages
changes and player publication remain unauthorized. Remaining owner decisions stay
alias approval (including six initials), historical attestation only where proof is
absent, and eventual separately controlled release.

Final checks for this attempt: original and corrected capture candidates pass
fabricated bounded-read/privacy/error/ES2020 checks; 37/37 relevant regressions PASS,
zero failed/skipped. Documentation private-reference scan and Git whitespace checks
PASS. Only the safe checklist/checkpoint are committed. Operational result remains
REPORT_CAPTURE_FAILED_AND_STAGING_RESTORED, not successful identity verification.

## Additional-run preflight — NOT EXECUTED

Owner conditionally approved one additional run only if complete direct-to-private-file
capture is verified before execution, without debugger/console previews. Inspection
found the prepared chunked candidate still depends on debugger capture and therefore
FAILS that prerequisite. No source upload, diagnostic execution, permission/deployment
change or new data read occurred. The additional execution authorization is UNUSED.

Minimum next owner decision: permit a temporary diagnostic-only routing branch in
the EXISTING MYSELF/USER_ACCESSING staging HEAD test endpoint (not production), so
its full JSON response can be saved directly to the ignored private file and checked
before exact source restoration. This changes the earlier editor-only boundary;
it was not performed automatically. No new deployment/project/OAuth client/scope is
proposed. If approved, preflight the complete file-capture mechanism with fabricated
data FIRST, then use the already-approved one additional execution; do not request
another duplicate execution approval. Existing Form URL/registry/closure findings
remain uncertified as recorded above. Production/Pages remain untouched.
