# Perfect Pick 4.1 late-entry checkpoint

Baseline/rollback source:4266fb4 on develop. Published website/API18 were NOT changed.
Latest passing implementation:4bfc261 (346/346 PASS), committed/pushed to develop.
Initial late-entry implementation:8191922 (341/341 PASS).
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

Implementation/test milestone COMPLETE;4bfc261 committed and pushed normally.
Approved late prediction cutoff is implemented; no policy question remains.
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

## Owner scope correction — no retroactive scoring (current work)

The latest owner instruction SUPERSEDES earlier historical-deadline reconstruction:
Weeks 1–8 retain their original selections, scores, standings, champions and prize
outcomes. Do not reconstruct or require historical deadlines for those weeks.
The reviewed production facade rejects an effective start before Week 9; historical
records continue through the original latest-entry path and carry LEGACY eligibility.
The new opening cutoff is exactly one hour before the verified first scheduled kickoff;
subsequent games use their own verified kickoff. Stored older deadline values cannot
silently override this rule. No official Week 9 results may change without review.

The private bounded review has verified native response timestamps and authoritative
schedule parsing. An actual ESPN minute-precision ISO timestamp exposed a draft parser
incompatibility; corrected with explicit-zone/calendar validation, including regression
coverage. Actual player-level/OPEN-week impact findings remain only in the designated
private, non-repository review directory. No private review data is committed here.
A previous review requiring historical deadlines is now superseded; recompute only
Week 9 while preserving the exact original Weeks 1–8 aggregate contributions.

Current local work: explicit effective-week contract, legacy eligibility preservation,
hard-one-hour cutoff, private counts-only review helper, original zero-score prediction
normalization and fabricated regressions. Production API18, original routes/writers,
Form, Sheet, triggers, registry Properties, Pages and static publication remain unchanged.
Pending: final focused/full tests, Week 9-only private comparison, coordinated candidate
verification, safe commit/push and explicit production activation approval.

## Final Week 9-only review and release preparation

Supersedes the earlier historical-evidence blocker and retrospective-review instructions.
The owner explicitly prohibited retroactive changes to Weeks 1–8. Private comparison
now copies their original entry/scoring contributions unchanged; historical monthly
champions and prize calculations are unchanged. The Week 9 review is COMPLETE with
all required kickoff/cutoff evidence verified, native timestamps valid, no invalid
selection/result records and a stable repeated-read snapshot. It identified a real
impact requiring owner review; it is NOT approval to alter official scoring.
Actual player/open-week counts, point/rank deltas and source metadata remain outside
Git in the restricted private activation/scoring-impact-nonretroactive directory.
Do not copy those receipts or underlying records into Git, Pages, artifacts or logs.

At the final bounded review, actual Form acceptance and Form Control both confirmed
closure. This observation is snapshot-specific, not ongoing authority or blanket
publication approval. Existing CLOSED evidence and approved-alias gates still apply.
The temporary owner-only review route was removed; exact staging source restoration,
unchanged production editor/deployment18 and untouched registry Properties verified.
No production writer, trigger setup, Form change, Sheet change or deployment occurred.

Verification: 36/36 focused tests and full357/357 PASS, zero failed/skipped, including
browser/privacy/scoring/champion/registry/static/security regressions and responsive
360/390/430/768/1440 checks. Initial sandbox invocation could not bind localhost;
complete rerun with authorized local Chrome servers passed. Strict artifact validators
were not changed. Log:/private/tmp/pp41-nonretroactive-all-tests.log.

Coordinated local candidate sealed against immutable production18: ONLY
00_Config_Setup routing and PerfectPick4_Json extension differ; every other source
file and manifest unchanged. Temporary diagnostics/private registry code excluded.
Existing API-profile Pages artifact verifies exactly38 allowlisted assets, including
32 supplied logos. Generated candidate/configuration remain outside Git; new scoring
is disabled pending approval. The Pages candidate is at the isolated local path
/private/tmp/pp41-nonretroactive-api-pages; its seal must be reverified before use.
The private readiness receipt is under activation/scoring-impact-nonretroactive-release.
An earlier private artifact directory acquired macOS metadata; strict verification
correctly rejected it. The isolated artifact passed without ignoring extra files.

Exact next step: present the private Week 9 impact summary to the owner. Obtain one
explicit approval covering Week 9 scoring impact, dashboard4-only API update from18
and synchronized Pages4.1 activation. Effective scope is Week9 onward; Weeks1–8 remain
legacy. First validate the opt-in production-shaped candidate in authorized private
staging, preserving/restoring editor source. Preserve immutable18 and deployed Pages
as rollback targets, same API URL/access/identity, original actions/writers/triggers.
No production upload/activation, new scope, static publication or refresh-worker enable
is authorized by this checkpoint. Do not repeat historical deadline reconstruction,
identity setup, previous private captures or completed scoring/UI implementation.

Validated implementation commit: cd154c7 (develop), full357 tests passing. This
checkpoint follow-up records the resumable commit; no runtime/source change follows
that verification. Resume with `git switch develop` and read this final section;
next operation is owner review/approval of the private Week9 impact and coordinated
release, not a repeat read or a production deployment.

## Owner-approved production activation — in progress

Owner approved the reviewed Week9 scoring impact, dashboard4-only API promotion and
coordinated Pages4.1 release. Weeks1–8 remain protected legacy results. The existing
production18 deployment and its exact editor source have recoverable private backups;
previous published Pages rollback is e6e3e92e7668930217b7e0bb4cba9e8f5f55923e.
The existing Pages artifact was downloaded privately for rollback reference.

Full357/357 regression tests PASS again, zero failures/skips, before activation.
Log:/private/tmp/pp41-production-tests.log. No tests, routes or publication allowlists
were weakened. The clean candidate still differs from immutable18 only in
00_Config_Setup's dashboard4 event-forwarding branch and PerfectPick4_Json; original
writer/ESPN/Form source and manifest remain byte-identical to18.

Private activation configuration limits new scoring to Week9 onward. The owner's
conditional Week9 activation is represented privately only after matching official
Form Control CLOSED and independently observed linked Form not accepting responses.
Runtime linked-Form/responder verification remains mandatory and withholds current-week
protected data on reopening, mismatch or access failure. No future week disclosure is
approved. Season scope may include the specifically approved Week9 contribution;
Weeks1–8 source selections, ranks, champions and prize outcomes remain unchanged.
Actual source configuration, identities, endpoints and per-player records stay outside
Git. Existing private staging will be restored exactly after read-only candidate tests.
No production promotion is considered successful until metadata, original actions,
privacy, scoring and published desktop/mobile browser checks pass. Static publisher
and static delivery remain disabled. If a coordinated check fails, restore18 and the
previous working Pages release; do not change scoring records, Forms or triggers.

### Staging-caught clock ordering corrected before promotion

The first activation test correctly stopped before production: schedule evidence read
inside the request was timestamped after the provider's original scoring clock, so it
was treated as future-dated and eligibility was unverified. The provider now takes a
post-schedule-read scoring clock. Genuine future evidence is still rejected; no clock
skew allowance, privacy bypass or relaxed freshness window was added. A fabricated
regression covers both delayed valid observation and truly future-dated evidence.

Updated full358/358 tests PASS, zero failures/skips, including local browser tests.
Log:/private/tmp/pp41-production-clock-tests.log. Production remains18 during this
correction; staging source was restored exactly. Next: retest the corrected candidate
against the approved private Week9 impact before creating/promoting its clean version.

Corrected private staging verified the owner-approved Week9 point/rank adjustment
against legacy calculations, with unchanged Weeks1–8 and all five original actions
passing. The private conditional Week9 configuration includes only that verified
closed week and its season contribution; future weeks remain unapproved. A final
privacy guard also checks current Form acceptance for legacy-query clients when the
activation configuration requires it, preventing stale Form Control from unlocking
reopened current-week picks in either client generation. A fabricated regression
covers closed, reopened and inaccessible-Form cases. Final exact-candidate staging
and full-suite verification precede any production promotion.

Final full359/359 PASS, zero failures/skips, including scoring, privacy, compatibility,
browser, logos, responsive layouts and artifact integrity. Log:
/private/tmp/pp41-final-activation-tests.log. Static tests use fabricated local data;
static delivery and unattended publication remain disabled in production.
