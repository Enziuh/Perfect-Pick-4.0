# Phase 2 scoring investigation — 2026-11-12

Scope: owner authorized investigation only in this session. No application edits,
network/API calls, Google access, deployment, cache clearing, or production writes.
Source checkpoint: 3c27adf. Phase1 package validation/restoration passed before work.
The latest owner instruction superseded the earlier Phase1-only authorization.

## Finding and confidence

CONFIRMED in local source and committed historical public data: Games Final is a
count of eligible submitted FINAL picks, not finalized competition games. The
frontend correctly divides by that smaller count. This conflicts with the owner's
new intended denominator. This is a contract/policy mismatch upstream of rendering,
not a floating-point or rounding defect. Existing documentation explicitly specified
this exclusion and tests enforce it. Current installed cloud source and the exact
83/135 versus83/136 runtime capture were not independently inspected.

The committed public snapshot was generated 2026-11-08T22:23:05.019Z and expired
2026-11-09T04:22:57.726Z. It is historical evidence only. In that snapshot:

| Scope | Isaias points / completed | Pancho R. points / completed |
|---|---|---|
| Week9 | 6 / 6 | 7 / 7 |
| Season | 76 / 127 | 76 / 128 |

Both have identical121 completed games in Weeks1–8. Isaias has a nonblank Week9
JAX/BAL selection marked MISSED_DEADLINE, FINAL, while Pancho R. has no Week9
eligibility exceptions. Thus one finalized missed-deadline game explains the exact
one-game difference in this committed capture. Week9 has7 FINAL games at capture;
all23 weekly entries are present,11 missed-deadline selections across participants.
The owner-reported later83/135 and83/136 percentages calculate correctly as61.5%
and61.0%, but its additional games/submission history are not available here.

## Authoritative data flow and references

References below are source lines at3c27adf, not proof of installed runtime bytes.

1. Imported PP3 scorer: apps-script/src/10_Prizes_Scoring.js:364–428 skips blank
   selections at390, increments completed only for a submitted pick with winner and
   FINAL status at406–409. No submission-time cutoff check exists in that function.
   Weekly entrants at246–261 come from actual submissions. Monthly525–562 and
   season474–520 sum these player-specific counters.
2. apps-script/src/20_Data.js:67–96 retains latest response per player/week with any
   nonblank game answer. Entirely blank or absent weekly entries do not exist as
   standings rows. Players registry at99 onward supplies names, not effective-dated
   competition membership. Prize active-player counts are not an eligibility roster.
3. tools/api/legacy-provider.cjs:69–83 builds normalized weekly inputs; native
   timestamps, aliases, closure/completeness and configured season weeks drive the
   read-only projection. It invokes projectCompetition at122. Legacy PP3 score is
   still injected for historical prize checks at110–118; blindly altering that
   original scorer would broaden scope beyond the negotiated4.1 dashboard.
4. tools/projector/project-competition.cjs:94–114 retains actual entrants and applies
   late policy;129–132 filters nonblank ELIGIBLE selections before counting FINAL.
   aggregate at142–151 sums only rows that exist; missing weeks add no denominator.
   Month and season construction at200/207 uses that same aggregation. Ranked at
  27–33 uses points only, then public ID ordering; accuracy does not determine rank.
5. tools/scoring/late-entry.cjs:40–44 has the same eligible-submitted denominator;
   no entry returns0/0 at41. This pure helper is not the only calculation to fix:
   the projector repeats the counting logic directly.
6. tools/contracts/live-contract.cjs:107–135 enforces totalPicks>=completedGames and
   recomputes completed from eligible nonblank picks. Its scoringBasis is
   ELIGIBLE_SUBMITTED_FINAL_PICKS (projector183). A denominator-only patch fails
   contract reconciliation unless semantics/versioning are updated together.
7. tools/snapshots/schema.cjs:17 preserves counters; cloud-projector.cjs:5–13 decodes,
   remaps and validates, without fixing scoring. retention.cjs:21–32 exports approved
   aggregates. aggregate-standings.cjs:7–12 sums AVAILABLE covered weeks for running
   M3/season;23–27 also assumes totalPicks>=completedGames. Thus partial-period and
   privacy-filtered aggregates inherit the defect. coveredWeeks must remain explicit.
8. tools/presentation/contract-dashboard.cjs:13 maps counters unchanged.
   website/app.js:203–220 renders points/completedGames (one decimal), with an
   outdated submitted-picks tooltip at210. Overview353, player cards526 and match
   matrix576 reuse accuracy. Entire missing entries render Not Submitted with em
   dashes at576 instead of a zero row with shared denominator.

## Existing late/missing treatment and eligibility limits

LATE_ENTRY_V1 applies from Week9 by default (late-entry.cjs:3–4). Historical activation
of API20 and unchanged legacy API actions is recorded in
[late-entry progress](../migration/LATE_ENTRY_PROGRESS.md), lines253–290.
[Existing rules](../architecture/LATE_ENTRY_RULES.md), lines44–60 explicitly exclude
missed/unselected/unverified picks from accuracy; its initial not-activated heading
is superseded by that later activation record.

Entry retention: latest valid on-time weekly entry wins; if none, earliest valid
late entry wins. Subsequent late replacements cannot improve picks/predictions.
Conflicting equal-time entries block (late-entry.cjs:23–30). Timestamp/selection
validation can discard invalid candidates; unknown/malformed teams fail projection,
not automatically become legitimate submitted picks (projector77–85,96–102).

Opening-game cutoff is one hour BEFORE verified kickoff; other games use verified
kickoff (late-entry.cjs:14–20). Equality is eligible (32). Known late games get
MISSED_DEADLINE and zero irrespective of selected team (42). Unknown/stale schedule,
unresolved reschedule or missing evidence yields UNVERIFIED_CUTOFF and zero verified
points, not proof that the entrant was late. Native timestamp parser and bounded
read are in tools/scoring/native-responses.cjs and tools/verification/timestamps.cjs.
Monthly retained prediction has its own designated-game kickoff cutoff (33–38).
These checks automatically invalidate affected picks in the negotiated dashboard
calculator; they do not edit Form responses or depend on choosing the losing team.
Legacy PP3 actions remain a separate, timestamp-unchecked calculation path.

Partial valid weekly entries remain rows; missing picks get no points/votes and
reduce denominators. Entirely absent/blank weeks omit the participant's weekly row;
monthly/season totals sum only weeks with a row. Static missingAliases is a display
comparison against public aliases (retention53), not verified period membership.
There is no effective-dated eligibility roster in the examined projection policy.
The committed capture has all23 entrants in Weeks1–9; that does not prove identical
eligibility histories for every participant/week, future week, or absent entrant.

## Caching assessment

Imported PP3 configuration has120-second summary/week/prize and180-second overall
TTLs (00_Config_Setup.js:42–45); getCachedOrBuild_ is in40_Cache_Helpers.js:308–334.
The additive dashboard4 route is generated separately in tools/api/json-extension.cjs
and calls the provider directly; the provider reconstructs projected counters.
API browser-client.cjs:47 requests dashboard4 with LATE_ENTRY_V1 and no-store.
Static browser-client.cjs:10–16,25 uses an in-memory model, same-origin no-store
fetches, bounded refresh and expiry clearing. No cache code inspected recomputes or
normalizes denominators. Caches can preserve older payloads but do not explain the
confirmed per-player mismatch already encoded in source and snapshot.
Cloud stableContent/historicalEqual guards (cloud-projector.cjs:15–20;
cloud-publisher.cjs:35–36) compare counters/history. A new contract must update these
checks deliberately; never disable integrity/expiry checks to force publication.
Current CDN/API/cache/cloud health is unverified; no cache rebuild/clear was run.

## Affected views and notice location

All weekly standings with blanks/missed deadlines, monthly and season sums, running
M3/season covered-week tables, overview leader accuracy, player cards and matchup
matrix accuracy can differ. Completed game counts remain correctly zero until FINAL;
future weeks and undisclosed weeks must not be silently counted or leaked.

Existing Guide panel website/index.html:197–205 already explains cutoffs and automatic
zero points, with related FAQ250–256. Put a concise fairness notice adjacent to the
Submit Picks/deadline panel (around43–48), link to that Guide section, and align Guide
accuracy wording plus tooltip. Existing Form instructions should be inspected
read-only in a separately scoped future step before proposing any Form text edit.
No current Form contents were verified. Notice must preserve the opening game's
one-hour-early cutoff and exact-cutoff eligibility; the proposed generic kickoff
wording alone omits that stricter existing rule.

## Recommended correction and decisions before implementation

Correct authoritative4.0/4.1 projection and public contract first. Separate
competition finalized-game denominator from selected/eligible-pick counts. Keep
points/eligibility, vote counts, entry retention, perfect-week all-games requirement,
monthly prediction and payout logic unchanged. Prefer a versioned explicit
finalized-game field/basis (or carefully migrated completedGames) over redefining
actual totalPicks to satisfy an obsolete inequality. Do not patch only frontend.

Owner decisions still needed:

- Exact eligibility membership/effective start and end for weekly/monthly/season,
  entirely absent weeks, new entrants and withdrawals. Do not infer from23 prize
  participants or alias availability. Eligible missing entrants need zero-point rows.
- Whether denominator/accuracy-only corrections apply retroactively to Weeks1–8.
  Existing freeze includes standings; preserve points/champions/prizes regardless.
  Any newly discovered late-point violation in legacy weeks requires separate review.
- Authoritative4.1 dashboard-only scope versus deliberate parity updates to original
  PP3 endpoints. Avoid changing legacy writers/prize code incidentally.
- FINAL ties, cancellations/voids, postponed games and unknown cutoff evidence: count
  only verified finalized games included in competition; retain fail-closed points
  and monthly confirmation holds. Specify handling where timing cannot be verified.
- Confirm notice wording preserves opening cutoff and equality semantics.

## Regression matrix and risks

Add missed deadline, blank pick, invalid selection/time and wholly absent week cases;
same83 points with135/136 historical counters should become same eligible period
count and same accuracy. Cover pre-membership exclusions, late joiners/withdrawals,
partial/in-progress weeks, all FINAL, zero FINAL, ties and rescheduled/void games.
Test exact opening cutoff/kickoff and1ms late, timezone/DST, protected on-time and
first-late retention, stale/missing evidence, unknown-cutoff holds and predictions.

Exercise helper AND projector, API route negotiation, contract rejection of stale
basis, monthly/season and running coveredWeeks aggregation, static retention/parity,
ID/privacy preservation, cache refresh/expiry, all affected browser views and copy.
Assert identical points/shared ranks, perfect winners, prizes/rollovers and monthly
tiebreak outcomes before/after for existing entrants. Added zero rows can affect
zero-point rank groups and participation-dependent computations; test separately.
Audit monthly-decision.cjs:5: changing completedGames from0 topositive can pass a
completion guard and change champion state even when points stay unchanged. Retain
unverified-cutoff/tiebreak holds and do not award a winner due solely to new counters.

Changes must not touch score synchronization, weekly setup, Form structure/routing,
response data, deadlines, trigger lifecycle or production cache rebuild operations.
No need to alter those mechanisms for a presentation denominator contract. Fresh
capture parity and actual installed-source verification remain prerequisites for a
future deployment recommendation, not actions authorized by this investigation.

## Precise proposed implementation sequence — requires approval

1. Resolve scope/membership/retroactivity decisions; privately verify authoritative
   installed API source and bounded relevant game/entry evidence under agreed access.
2. Add failing synthetic regression cases and record unchanged rank/prize baselines.
3. Introduce canonical per-period finalized-game counting and approved membership;
   create eligible absent-player zero rows; preserve independent pick counters and
   all existing points, deadline and prediction decisions. Update helper/projector.
4. Version/reconcile API basis, validators, aggregate tables and static projection;
   migrate historical guards explicitly only within approved accuracy scope.
5. Update frontend bindings/copy, zero-denominator handling and fairness notice.
   No Form edit without separately reviewed text/scope authorization.
6. Run focused/full offline regressions, browser responsive checks, security/artifact
   gates and fresh API/snapshot parity. Verify automatic scoring/deadline source is
   unchanged; live execution remains unproven until observed separately.
7. Record evidence and focused commits; prepare exact immutable deployment artifacts,
   rollback and controlled cache renewal instructions. Stop for explicit deployment
   approval. Never rerun setup, reinstall triggers or alter production records.

## Checks actually run

100/100 existing tests passed: node --test tests/late-entry.test.cjs
 tests/projector.test.cjs tests/live-contract.test.cjs tests/static-v20.test.cjs.
Log: /tmp/pp-phase2-investigation-tests.log (local ephemeral, excluded from package).
These validate CURRENT semantics, including assertions of the unwanted denominator;
they do not prove the proposed fix. No new test/application files were written.
Read-only synthetic calls demonstrated that removing a weekly entry omits its row
and reduces its monthly/season denominator from2 to1 while the other stays2.
Phase1 archive SHA/inventory/temporary restoration and commit/link checks passed.
No live data, browser, full application suite or current installed-source check run.
