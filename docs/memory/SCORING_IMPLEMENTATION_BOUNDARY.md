# Scoring implementation — evidence boundary

Owner approved local implementation in the latest session, subject to stopping for
missing eligibility evidence or frozen-result conflicts. This supersedes the prior
investigation-only approval gate. Deployment, push, live Apps Script modifications,
production data/snapshot writes and automation changes remain prohibited.

## Preflight completed

Starting HEAD4206886a2993c37547f3b505ac83c1a4dee0a798 on develop, clean working tree;
no unrelated changes. Read AGENTS.md, restart/memory records and investigation.
Investigation commit exists. Phase2 investigation archive receipt and restoration
passed; manifest checkpoint equals HEAD and every packaged byte matches checkout.
No fetch or live service access performed. Earlier memory approval statements are
historical and superseded by the latest owner message, not a conflicting instruction.

## Stop condition reached before code/test edits

The examined local sources do not establish effective-dated competition membership:

- apps-script/src/20_Data.js:99–115 reads Phone and Display Name only.
- tools/api/player-authority.cjs:22–35 validates identity/alias approvals, without
  membership dates or eligible game/week intervals.
- tools/api/legacy-provider.cjs:46–58 constructs projection authority without such
  records. Competition period start/end weeks are not player eligibility dates.
- tools/projector/project-competition.cjs:94–114 builds entrants from submissions;
  that cannot prove membership for an entirely absent week or a later joiner.

The historical public snapshot having23 entries in Weeks1–9 is not a membership
attestation. No conclusion is made about private live records not inspected here.
Need owner-verified complete eligible roster, eligibility start/end (or explicit
per-game/week membership), season/competition scope, exceptions and provenance.
Use existing public IDs/aliases in tracked records; keep private joins outside Git.
For intraweek starts, specify eligibility against game kickoff/cutoff and timezone;
do not invent dates from first picks, registry presence or prize participant counts.

A second boundary is the historical migration guard:
 tools/snapshots/cloud-projector.cjs:15–17 compares full frozen W1–W8/M1/M2 rows.
Thus changed denominators/accuracy would be rejected even if every point, rank,
champion and prize is unchanged. The approval permits historical corrections only
when reliable evidence permits and requires a proposal on safeguard conflict.
No guard has been weakened or edited.

## Proposed migration for owner review

1. Supply/identify reliable membership evidence and approved bounded read-only access
   if evidence exists only in private live systems. Establish completeness and exact
   period/game scope before modifying standings membership.
2. Preserve original frozen artifacts byte-for-byte. Capture their trusted hashes
   and protected-result baselines without copying private submissions into Git.
3. Introduce a versioned accuracy projection with explicit membership provenance,
   separate eligible-finalized denominator, and original eligible-submitted FINAL
   count retained for qualification. Keep actual totalPicks distinct.
4. Make historical correction an explicit migration from the pinned original to a
   new artifact. Require exact equality of identities/order, points/ranks, original
   winner/champion/tiebreak records, prize allocations/payment facts and original
   picks/votes. Allow only approved denominator/accuracy fields to differ. Reject
   absent/extra membership or any protected change; never overwrite the baseline or
   bypass existing guard globally. Missing entrants require separately documented
   expected membership/order comparisons rather than silently adding zero rows.
5. Decouple monthly qualification and validator from accuracy using the retained
   original submitted-FINAL metric: monthly-decision.cjs:5 and live-contract.cjs:148.
   Audit perfect-week/rollover checks in prize-estimates.cjs:14,
   contract-dashboard.cjs:39 and live-contract.cjs:182–210; preserve exact outcomes.
6. Version API scoring basis and snapshot validation; reconcile aggregate counters
   and cache/version handling. Legacy PP3 and production snapshots stay unchanged.
7. Only then execute the approved failing-test→implementation→protected-result
   comparison stages from the investigation report; prepare separately approved
   immutable deployment/rollback instructions after local verification.

A proposed synthetic expectation is83/136=61.0% for both example players IF reliable
membership proves both eligible for those136 games. This has NOT been implemented
or established as the correct game set from current runtime evidence.

## Notice wording discrepancy

Approved text says later picks must arrive “before kickoff.” Existing authoritative
late-entry.cjs:32 accepts timestamp EQUAL to cutoff (<=), including kickoff for later
games. The prior approved gameplay rule and exact-boundary tests also accept equality.
Recommend “at or before kickoff” to describe current enforcement, while retaining the
opening game's one-hour-early deadline. Do not change the scorer to strict-before
without a separately explicit rule decision. Approved accuracy sentence would also
be premature while the denominator correction is blocked. No notice installed.

## Outcome and restart

No implementation, new failing tests, application suite runs, before/after protected
result proof or deployment artifact produced at this boundary. Prior100/100 results
belong to the investigation, not this session. Only memory records changed; preserve
all existing code/tests, private evidence/configuration, snapshots and Git history.

Resume when membership evidence and historical migration review resolve these gates.
Local implementation approval remains recorded subject to those conditions; no push,
deployment or live operation is authorized. Recheck Git/memory integrity and inspect
new evidence before proceeding. No need to rerun Form setup or modify any trigger.
