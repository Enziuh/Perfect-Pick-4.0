# Week9 activation conflict — local resume checkpoint

## Current owner decisions

The owner confirms the established roster is unchanged from Week1: no joins or
withdrawals; missing picks/weeks never remove eligibility. This resolves the prior
membership-date policy question. The owner approves versioned historical accuracy
correction while preserving points, rankings, qualification, winners, tiebreaks,
prizes, immutable snapshots and original hashes. No legacy PP3 endpoint change.

The new rule is a single official stored weekly cutoff, one hour before the first
scheduled kickoff; equality is eligible, later submissions earn zero for the week.
When asked the activation week, the owner answered “week 9” in the ongoing session.
Season2026 is the existing competition context, not a new season selection.
No instruction expressly revoked the protected historical-points/ranking requirement.

## Preflight and identity checks

Read AGENTS.md, current memory/handoffs, investigation, boundary report and restart
workflow. Starting61c4d005ebb581d9a9bbe78c193cbeb93db1e062 on develop, clean tree.
Boundary archive receipt/restoration, HEAD and every manifest file hash matched.
No fetch/push/live API, Google operation or production change.

Historical local private candidate registry approval contains23 records: all approved,
23 unique source labels,23 unique source IDs,23 unique aliases. Alias set matches all
23 unique IDs/aliases in the committed public snapshot and private API capture.
No identity values/private keys were printed or copied into tracked memory. These
checks validate historical approval/capture correspondence, not the current live
Players sheet. No raw actual registry rows are available in the inspected local JSON
captures; future authorized current-source verification must revalidate the join.
Do not treat the historical candidate as current deployment configuration.

## Confirmed historical conflict — stop before edits

Two local captures independently contain the same source scoring state:

| Capture | Generated UTC | Week9 FINAL games | Retained late entries | Earned points removed by all-week rule | Weekly ranks changed |
|---|---|---:|---:|---:|---:|
| Committed public snapshot | 2026-11-08T22:23:05.019Z | 7 | 11 | 48 | 13 |
| Historical private API capture | 2026-11-08T22:16:32.903Z | 7 | 11 | 48 | 13 |

These are two representations of historical evidence, not independent current runtime
observations. No raw private data is recorded here. Files:
public-data/snapshot.json and ignored tmp/readiness/api.private.json.

Method: identify earliest scheduled Week9 kickoff; select entrants whose opening-game
selection is MISSED_DEADLINE; count their ELIGIBLE selections matching FINAL winners.
All11 entrants have earned points in the capture; sum48. There are154 currently
eligible selected picks across these entries that the weekly rule would invalidate
(includes games not yet FINAL). Subtract captured correct points from their weekly
rows, re-sort by unchanged points/public-ID convention, recompute shared ranks:
13 rows have different rank numbers. This is a read-only in-memory counterfactual,
not a change to an artifact or a production result. Monthly/season points would also
lose those contributions; later completed games may increase the difference.

Week10 is present but picks are withheld in the available capture: zero disclosed
rows is NOT evidence that nobody submitted. Existing Week10 submissions and their
potential deltas cannot be determined from this capture. No active Form/deadline or
trigger was read or modified. Current runtime and later83-point example unverified.

The existing individual-game treatment is at late-entry.cjs:14–20,32,40–44 and
project-competition.cjs:113–132. Replacing those historical eligibility decisions
with Week9 all-week eligibility would violate protected points/ranking invariants.
The previous historical denominator-migration proposal remains approved in principle,
but cannot authorize this new removal of earned points.

## Decision needed to resume

Keep Week9 as the named policy origin only with an explicitly approved grandfather
boundary: identify and pin complete retained historical entries/results (including
Week9–10 and any subsequent affected entries) that keep prior scoring; specify the
exact prospective effective timestamp/entry revision or first not-yet-open week
for strict enforcement. Do not infer a grandfather cutoff from first submission,
current date, source capture time or the fact a game is unfinished. A November8
capture alone cannot safely freeze the later live Week9/10 results.

Alternatively choose a genuinely prospective week and preserve every earlier week.
No retroactive point removal is authorized by this checkpoint. Any decision to
change already-earned points/ranks would be a separate reversal of the explicit
historical protection and requires a fresh impact/prize review.

## Work completed / not completed

No app or test files edited. No fairness notice installed: a universal all-week claim
would contradict the protected existing Week9 behavior while transition is unresolved.
No new regression suite executed; investigation's100/100 is historical, not this run.
Read-only identity checks, manifest restoration and counterfactual checks completed.
Only continuity documents changed, with append-only handoff/changelog updates.
Existing code, snapshots, Forms, triggers, score sync and private evidence unchanged.
No implemented before/after accuracy or protected-result proof is claimed. The
83/136=61.0% common denominator remains the approved example, not current live data.

## Deployment plan — gated, no commands executed

Resolve grandfather/activation decision and complete historical evidence first.
Then local failing regressions, canonical roster denominator/versioned contract,
qualification isolation, API/static migration and truthful transitional notice;
run full protected-result/parity/privacy/browser checks. Pin immutable source and
new derived artifacts, preserve originals and rollback hashes. Present exact upload,
cache-version transition and Pages instructions only after concrete artifacts are
verified; require separate owner authorization for push, live API changes, publication
and any private historical read. No Form setup or trigger/deadline change needed.
