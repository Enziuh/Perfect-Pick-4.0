# Research status

As of 2026-11-12, Phase1 is complete and the separately authorized Phase2 investigation
is complete. Implementation and deployment remain unauthorized.

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
