# Perfect Pick 4.1 late-entry checkpoint

Baseline/rollback source:4266fb4 on develop. Published website/API18 were NOT changed.
Latest passing implementation:8191922 (341/341 PASS), committed/pushed to develop.
Latest tested full baseline before this work:321 tests. Do not resume registry setup or
Week9 diagnostics as part of this scoring task; their checkpoints remain separate.

## Implemented locally (not activated)

- Pure cutoff/entry/scoring module: latest valid on-time entry is protected; first valid
  late entry retained; equal-time conflicts fail closed; no regeneration of player IDs.
- Native timestamp/phone/pick reader with explicit bounds/field allowlist; configured
  timezone parsing; strict DST handling, no legacy displayed-timestamp date guessing.
- Opt-in existing dashboard4 path, new discriminated scoring basis, exact validation,
  eligible-only points/accuracy/voting, shared ranks and period aggregation. Default
  legacy API behavior preserved. Original apps-script/src files untouched.
- Read-only schedule evidence reuses original ESPN event.date/parser; no writer/trigger
  changes or extra endpoint. Current official deadline read from matching Form Control;
  historical official deadlines require independently verified archive, not guesses.
- Missed-deadline crossed-out labels,0 points and mobile MISSED; correct/incorrect/
  pending and unverified/no-submission states stay distinct. Existing32 logos preserved.
- Rules/FAQ include Thursday/Friday/Sunday examples and reopening/resubmission policy.
  These sections stay hidden unless validated data declares eligibility-aware scoring.
- Estimated23-participant pools unchanged; old accounting not silently reapproved.
  Unknown cutoffs block finalized rollover/monthly confirmation. Owner-approved monthly
  prediction cutoff is the designated game kickoff, inclusive, for the retained entry.
  After kickoff is ineligible; unverifiable entry/kickoff evidence remains unknown.
- Existing dashboard4 query negotiates rules=LATE_ENTRY_V1; server must also explicitly
  opt in. Narrow router proposal forwards its existing event only. Old clients/API18
  retain legacy output; new Rules remain hidden on legacy responses. No new endpoint.
- Future static allowlist preserves eligibility metadata; publisher/static remain OFF.

Files: tools/scoring/*; tools/api/{legacy-provider,json-extension,browser-client}.cjs;
tools/projector/project-competition.cjs; tools/contracts/live-contract.cjs;
tools/presentation/contract-dashboard.cjs; tools/compatibility/prize-estimates.cjs;
tools/sheets/offline-bundle.cjs; tools/snapshots/schema.cjs;
tools/verification/package.cjs; website/{app.js,styles.css,index.html};
tests/{late-entry,projector,browser}.test.cjs; docs/architecture/LATE_ENTRY_RULES.md.

## Historical impact and remaining evidence

Inspected existing redacted reference PRIVATELY/read-only. It does not supply a complete
historical kickoff/deadline evidence set; deliberately redacted identity keys cannot
support per-player entry reconciliation. This is NOT a production missing-phone defect.
No verified real player/week impact counts available; do NOT report zero changes or
apply retroactively. Existing public API lacks timestamps/cutoffs to establish parity.
Need bounded owner-authorized native Responses/private identity comparison plus archived
weekly deadlines and authoritative schedule revisions. No actual private records or
identifiers have been copied into Git/public artifacts.

Owner decision RECEIVED: a late first-entry prediction may count at or before the
designated game's verified official kickoff. Implemented in pure scoring, projector,
strict validator, player/matrix display and gated Rules/FAQ. It cannot be changed by a
later prohibited resubmission. Shared ranks/points and equal-distance unresolved ties
remain unchanged. No further tiebreaker policy approval is needed. Production/history
review and deployment authorization remain pending. Original3.0 actions remain legacy
references; only dashboard4 opt-in has new rules.

## Verification complete

Previous full341/341 PASS, zero failed/skipped, in isolated validation worktree:
/private/tmp/pp4-late-entry-validation. Source-only scratch copy; no private datasets.
Previous20 focused late-entry tests PASS; full suite includes browser missed labels/matrix/
comparison,360/390/430/768/1440 widths, Rules/FAQ basis gating, old API compatibility,
retry/coalescing/privacy/scoring/champion/registry/static artifact regressions.
Artifact/privacy/security stage and syntax/whitespace checks PASS. Exact publication
allowlist unchanged;32 supplied SVG logos retained. No production source/workflow edits.

Two earlier failures were resolved without weakening assertions: browser test now waits
for async week load before selecting a lazy player; reliability mocks assert the new
EXACT negotiated query URL. macOS was also injecting .DS_Store BETWEEN artifact checks
in the watched main repo. Instrumentation confirmed this; unchanged strict validators
passed all tests in the isolated checkout. No metadata/extra files are ignored by
publication checks. No security test was skipped or disabled.

Files also include tests/json-api.test.cjs and tests/loading-reliability.test.cjs,
which assert the explicit new query rather than broadening network permissions.
Final logs:/private/tmp/pp4-late-entry-all-tests.log and pp4-late-entry-stage.log.

## Exact next step

Implementation/test milestone COMPLETE;8191922 committed and pushed normally.
No API upload, Google execution, Pages deployment or static publication occurred.
Resume in ORIGINAL project on develop, not the detached validation worktree. Read this
checkpoint and LATE_ENTRY_RULES.md; do not rebuild completed scoring/UI or rerun consent.
Tiebreaker decision implemented: designated-game kickoff, inclusive, on retained entry.
Do not ask it again. Final346-test verification complete; continue only with
missing historical evidence and explicit controlled deployment approval.

Obtain missing authoritative historical weekly deadlines and schedule revisions, then
run bounded private native-entry comparison using compare-late-entry.cjs. Missing
cutoffs must remain BLOCKED; no verified affected-player/week counts exist yet. Review
all scoring/denominator/Perfect Week/prize differences before retroactive activation.
Current Week9 authoritative closure remains a separate unresolved disclosure checkpoint;
late eligibility never grants disclosure or attests that week closed.

Only afterward request explicit production approval: additive PerfectPick4_Json update
plus its narrow event-forwarding route patch, using immutable18/editor backups, same
URL/access/identity and untouched original routes/writers/ESPN/Form automation. Test
both legacy query and negotiated4.1 output in authorized staging before promotion.
Coordinated Pages release then activates the already-gated Rules/FAQ with new scoring;
API18 can still serve the new frontend safely with legacy rules hidden. No new host/API
or permissions required by prepared source. Do NOT deploy, enable static publication,
reopen a Form or change triggers on the basis of this local milestone.

## Current follow-up validation

Owner-approved late-prediction update has25 focused tests PASS, including before/exact/
after kickoff, missing/postponed evidence, protected on-time/first-late predictions,
equal-distance unresolved ties, unchanged points/shared ranks and OPEN privacy.
Final full346/346 PASS, zero failed/skipped, plus artifact/privacy/security checks.
Syntax and whitespace checks PASS. Logs:/private/tmp/pp4-late-tiebreak-all-tests.log
and pp4-late-tiebreak-stage.log. No live operation or deployment.
