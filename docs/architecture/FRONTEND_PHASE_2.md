# Phase 2 · Monthly Champion and standings

## Shared resolver and UI contract

`resolveMonthlyChampion(period, weeks)` in website/preview-data.js is pure and
exported by the existing validated synthetic adapter. It returns status, reason,
confirmed winner or null, monthly points, point leaders, verified designated game
and actual total, eligible/ineligible comparisons, winning difference and margin.
It never mutates scores, ranks, fixtures, financial amounts or external state.
No additional published file, external service, dependency or live adapter exists.
The six-file publication allowlist and fail-closed deployment gates are unchanged.

Monthly standings and the Overview spotlight reuse one cached resolution for the
selected monthly period. Changing periods immediately clears the old winner;
stale asynchronous loads cannot restore a previous period's champion. Overview
follows the same selected period as Monthly standings. Weekly and Season views
remain available. Monthly rows now include completed FINAL games and accuracy;
leader/champion badges do not reorder rows or break shared ranks.

## Evidence required to confirm a champion

- Exactly one weekly snapshot for every inclusive configured period week.
- Explicit CLOSED entry status for each applicable week; an elapsed deadline is
  not authorization to reveal predictions or confirm a prize result.
- Nonempty, unambiguous scheduled matchups with FINAL results, nonnegative integer
  scores (including zero), and a winner consistent with those scores.
- Confirmed period and weekly finalization flags. A flag alone is insufficient.
- Approved unique aliases, valid monthly totals, and monthly point/completed-game
  sums consistent with the supplied weekly standings. This reconciliation checks
  consistency without replacing the existing backend scoring calculation.
- At least one completed FINAL game in the public standings.

The point leaders are derived from maximum monthly points, not rank array order,
alphabetical order, stale `leaders` metadata, or prediction distance. One unique
points leader is confirmed only after the above conditions are met.

For shared point leaders, verify the configured period-ending designated game,
Combined Points method, enabled tiebreaker and revealed predictions. Never use
an arbitrary last result or trust a stale configured actual-total field. The
actual total comes from the uniquely matching FINAL weekly result.

Synthetic predictions use the existing contract: an exact string of 1–3 decimal
digits, including "0". Blank, whitespace, negative, fractional, nonfinite,
boolean, numeric-typed, absent or malformed values are ineligible in the resolver.
The adapter additionally rejects malformed fixture fields before any rendering;
invalid records must not be smuggled through schema changes. This synthetic bound
is not a new production Form rule; future live normalization must be approved.

Compare absolute distance among eligible tied first-place players only. A unique
closest prediction confirms a champion. Equal minimum distances remain unresolved,
regardless of order. One eligible prediction can win; its runner-up margin is
unavailable. No eligible prediction produces no champion. The UI shows approved
aliases, monthly points, designated game/FINAL actual total, valid predictions,
distances, the winning prediction, and the difference in distance from the next
closest eligible prediction. Invalid raw text is never displayed.

## Display states

- IN PROGRESS: incomplete/unconfirmed evidence, no completed standings, reconciliation
  needed, or closure/prediction-publication metadata not confirmed.
- AWAITING FINAL SCORE: the only outstanding game is the designated tiebreaker, or
  its unique FINAL evidence cannot be established. Rankings may still change.
- MONTHLY CHAMPION: one points leader or one uniquely closest eligible prediction.
- UNRESOLVED TIE: equal minimum distances; manual decision pending; no award.
- NO ELIGIBLE TIEBREAKER: all tied leaders missing/invalid; manual decision pending.

Predictions/comparisons do not enter resolver output or the DOM before explicit
closure. In-progress and unavailable states never reuse an old winner. Existing
closed-week Match Center selections, predictions and voting remain functional.

## Test data and verification

The published website/fixtures/preview.json remains unchanged and honestly
unfinished. `tests/support/monthly-scenarios.cjs` supplies separately identified,
test-only scenarios. It creates its own final results, scores the invented picks,
aggregates standings/shared ranks and consistent pool metadata. Browser tests
serve these examples on localhost only; there is no production or scenario switch
in the published application. The helper and tests are excluded by the exact
publication allowlist.

Coverage includes unfinished/zero-completed periods, clear points leader, decisive
prediction, equal distance, missing and invalid predictions, one eligible player,
zero-valued scores/prediction, pending designated game, open/unknown/missing closure,
missing/duplicate evidence, stale totals, permutation invariance and nonmutation.
Browser regressions check matching Overview/Monthly state, explanations, comparisons,
rank preservation, cleared champions on period changes, responsive layouts, existing
navigation, fixture failures, privacy and zero external page requests.

## Backend and financial boundary

Champion display is not a payment calculation, prize-ledger entry or declaration
that money has been disbursed. Existing pool amounts and payout placeholders are
unchanged; the preview does not invent real-world monthly winnings. The live API
currently lacks an authoritative confirmed champion/payment contract and must not
be connected to this preview. A separately approved backend phase must enforce
approved aliases, per-week official closure and public-data allowlists server-side,
provide consistent finalized snapshots and designated-game metadata, define manual
tie-decision authority/audit, and record any actual payouts independently of ranks.
No Apps Script, Google Form/Sheet, trigger, property, deployment or production
behavior is modified by Phase 2. Phase 3 requires separate approval.
