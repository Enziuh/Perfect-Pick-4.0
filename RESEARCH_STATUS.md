# Research status

Phase1 and investigation are complete. The owner's final per-game clarification
supersedes strict weekly proposals. Local accuracy implementation is complete and
verified; production activation/push/deployment remain unauthorized.

## Verified locally

Existing architecture, test tooling, operational documents and Git history were
inventoried. The seven memory filenames were absent. README.md and PROJECT.md were
empty. Initial working tree was clean on develop at E-BASE.

## Owner-reported historical operational evidence

On November9 2026 the Week10 Google Form was confirmed accepting responses; active
week was10; Form Control reported OPEN. One closing trigger was installed and its
configuration reviewed for November12 2026 at4:15PM PST. No successful future trigger
execution was verified. These are owner reports, not independently verified current
runtime facts. No live checks or production operations were performed for Phase1.

## Pending scoring investigation — do not implement

Owner reported Season Standings Games Final denominators135 versus136. Missed or
late picks are suspected contributors, not an established cause. Investigate Apps
Script, API payloads, caches and frontend only after separate Phase2 authorization.

Intended rule: every eligible player shares the finalized-game denominator for the
relevant weekly, monthly or season competition period. Missed picks earn zero but
remain in the denominator. Accuracy = correct picks / total finalized games ×100.
Verify eligibility histories, missing submissions, partially complete weeks and late
submissions before deciding the applicable game set. Preserve rankings, prizes and
tiebreakers. Correct the authoritative source rather than mask data in the UI.

A late-pick fairness notice is requested near Form instructions/deadline information:
“If you submit your picks after a game has started, that game cannot earn you points.
Any games already underway must be treated as incorrect picks, regardless of which
team you select.” Existing enforcement must be verified before changes. No new rule
or notice is approved for implementation by the Phase1 authorization.

## Unknown / deferred

Current Form/trigger execution, cloud publisher health, installed source, deployed
version and live cache state remain unverified. Older operational commands must not
be rerun to establish continuity. Private runtime configuration is not recoverable
from public documentation alone. Historical tests were not rerun as application code
is unchanged. Future phases require their own authorization and verification.

## Phase2 investigation completed — 2026-11-12

[Findings and implementation proposal](docs/memory/SCORING_INVESTIGATION.md).
Confirmed source/contract exclusion of missed/nonblank-ineligible FINAL picks explains
the mismatch mechanism. Historical committed snapshot shows Isaias76/127 versus
Pancho R.76/128, with Isaias's FINAL Week9 JAX/BAL pick MISSED_DEADLINE. Exact later
83-point capture/current runtime remains unverified. Existing100 focused tests pass
under current semantics. Earlier pending-investigation text records the original
request; this finding supersedes its unknown mechanism status, not its approval gate.
Membership history, retroactive scope, legacy endpoint parity and monthly completion
safeguards require decisions. No application or production changes were made.

## Implementation preflight stopped at evidence boundary

[Boundary report and historical migration proposal](docs/memory/SCORING_IMPLEMENTATION_BOUNDARY.md).
Reliable eligibility dates/period membership were not established in examined local
sources. Do not substitute first submission, alias registry or prize counts.
Whole frozen standings rows are compared by the historical guard; review the explicit
versioned migration proposal before changing counters. Notice's strict “before”
wording conflicts with existing equality-is-eligible scorer. No app/test edits made.
Earlier pending approval statements above describe historical task states.

## Resume: owner roster confirmation and Week9 activation conflict

Owner attests unchanged established roster since Week1; previous eligibility-date
question is resolved as policy. Historical23-record alias approval/capture sets match
one-to-one; current live registry not independently verified. Owner selected Week9
for new all-week deadline. Counterfactual on both available November8 captures removes
48 already-earned points from11 entrants and changes13 weekly ranks, conflicting
with retained historical safeguards. Week10 picks are withheld, not proven absent.
[Full evidence, transition decision and gated plan](docs/memory/WEEK9_ACTIVATION_CONFLICT.md).
No app/test edits or new regression suite. Do not proceed without explicit historical
exception/prospective boundary. Earlier boundary reports remain historical records.

## Final local implementation verified

[Implementation report](docs/memory/SCORING_IMPLEMENTATION_REPORT.md).
Owner confirms unchanged23-person Week1 roster; existing per-game scorer/precedence
is preserved. No strict Week9/Week11 policy. Authoritative derived accuracy version
counts all FINAL games while retaining original points, ranks, qualification,
champions, tiebreaks and prizes. All-absent weeks get zero-point roster rows.
Final full416/416, no failures/skips, including five-width Chrome regression;
contract-focused70/70 and9 new unit/integration regressions also pass.
Pinned historical snapshot and generated packages/seals unchanged. New provider
requires exact23-person live registry/approved alias correspondence before opt-in.
Current live source/registry/cache status remains unverified, not a local blocker:
activation is deferred until reviewed fresh source/artifacts and separate approval.
Old memory entries describe historical gates and are superseded by this checkpoint.
