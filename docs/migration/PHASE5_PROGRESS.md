# Phase 5 — resumable migration checkpoint

Current status: Phase 5A COMPLETE; Phase 5B COMPLETE; Phase 5C COMPLETE; Phase 5D-1 COMPLETE; controlled-verification preparation COMPLETE; isolated package preparation COMPLETE; owner reports disabled package uploaded; functional native connector and validated dashboard bridge IMPLEMENTED/tested offline, packaged read entry DISABLED by default. Real reads and live integration NOT approved.
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
