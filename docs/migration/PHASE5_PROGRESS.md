# Phase 5A — resumable contract audit

Status: COMPLETE — Phase 5A source audit only. Live integration NOT approved. Documentation-only, local source inspection; no service calls.
Branch: develop. Audited baseline/checkpoint parent: 6cd85d1. The documentation
commit containing this checkpoint is its checkpoint revision (see Git log).
No Phase 5B work authorized or started.

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

## Phase 5B and later — small independent gates, NOT STARTED

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

## Remaining work and exact next action

Phase 5A is complete; Phase 5B awaits authorization. Next action: owner reviews the
contract/disclosure blockers and authorizes Phase 5B step 1 only (offline contract
specification). Do not connect real data, alter synthetic publication, run backend
functions, or start custom picks. Remote settings, historical closure evidence,
alias approval registry and production parity remain explicitly unverified.

Checkpoint branch: develop; parent 6cd85d1. To identify its final documentation
commit use Git log for this file; a self-referential commit hash is not embedded.
