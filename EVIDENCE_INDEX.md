# Evidence index

Evidence labels: LOCAL = inspected repository fact; HISTORICAL = prior documented
report; OWNER = owner statement, not independent runtime verification; UNKNOWN =
not established. A passing historical test is not a test run in this session.

| ID | Classification / date | Source and limits |
|---|---|---|
| E-BASE | LOCAL, 2026-11-12 | Git baseline 5732be11e63ee43bdbc2e1350f255f34396c926e; clean develop, matches local origin/develop; no fetch performed. |
| E-ARCH | LOCAL source, historical assertions | [Architecture](docs/architecture/FRONTEND_PHASE_1.md), [API](docs/architecture/GITHUB_PAGES_API.md), [workflow](.github/workflows/pages.yml). Describes source, not live deployment. |
| E-LATE | HISTORICAL | [Late-entry checkpoint](docs/migration/LATE_ENTRY_PROGRESS.md), [rules](docs/architecture/LATE_ENTRY_RULES.md). Contains evolving/superseded states; no new scoring investigation performed. |
| E-RECOVERY | HISTORICAL, 2026-11-08 | [Recovery](docs/operations/SOURCE_ROLLOVER_RECOVERY.md), [progress](docs/performance/STATIC_SNAPSHOT_PROGRESS.md). Cloud repair remained pending in latest local record. |
| E-FORM-OLD | HISTORICAL, 2026-11-08 | [Form review](docs/operations/WEEK10_REOPEN.md). Prepared operation is not proof of execution. |
| E-OWNER-1109 | OWNER, event 2026-11-09; recorded 2026-11-12 | Owner states Week10 Form accepting responses, active week10, Form Control OPEN, one closing trigger installed/configuration reviewed for November12 2026 4:15PM PST. No successful future trigger execution verified. Source: owner's Phase1 approval message in this session; no independent receipt captured. |
| E-SCORING-REPORT | OWNER, recorded 2026-11-12 | Season denominators135 versus136; missed/late picks suspected. Root cause UNKNOWN. See research status. |
| E-PRIVATE | LOCAL existence only | Ignored backups/, tmp/, .preview-public/, .verification-package/ and seals exist. Contents not exhaustively audited or copied. Private evidence may be unavailable on another machine. |

Commit IDs resolve in local Git; identifiers are not evidence of deployed state.
Integrity manifests verify bytes against the selected checkpoint, not truth,
completeness, authorization, or absence of every possible secret.

| E-PHASE2 | LOCAL source + historical snapshot, 2026-11-12 | [Investigation](docs/memory/SCORING_INVESTIGATION.md), source checkpoint3c27adf;100/100 focused tests; current runtime unverified. |

E-PHASE2 is an additional evidence record; it does not convert historical runtime
claims into current verification. No private raw data was copied into memory.

Additional evidence E-IMPLEMENTATION-BOUNDARY: LOCAL source inspection at4206886,
latest owner conditional approval; [report](docs/memory/SCORING_IMPLEMENTATION_BOUNDARY.md).
No reliable membership dates established from inspected local registry/policy;
no claim about unseen private live records. No new application tests run.

E-WEEK9-CONFLICT: LOCAL read-only counterfactual and historical capture evidence,
source61c4d00. [Report](docs/memory/WEEK9_ACTIVATION_CONFLICT.md). Both November8
captures show48 earned points/13 weekly ranks affected by strict Week9 rule.
Owner roster attestation and Week9 selection are session statements, not independent
runtime checks. No private identities or response records copied into memory.

E-ACCURACY-IMPLEMENTED: LOCAL source/tests, final per-game owner clarification in this
session. [Implementation report](docs/memory/SCORING_IMPLEMENTATION_REPORT.md) and
[versioned contract](docs/architecture/ROSTER_ACCURACY_V1.md). Immutable historical
Git fixture and original artifact hash pinned; no current runtime claims. Full suite
416/416; new browser covers360/390/430/768/1440 cold+repeat; exact protected-result
comparisons and original snapshot/generated-package preservation pass. Ephemeral
logs under /tmp/ are not part of the portable package or permanent evidence recovery.

E-PRIVATE-PREVIEW: local synthetic projector/Chrome checks at source c378fc7;
[preview record](docs/memory/PRIVATE_ACCURACY_PREVIEW.md).23 synthetic aliases,
41/41 focused tests,390/1440 cold/repeat verified. Logs/scripts remain ignored locally;
no real player data or current production status is represented.

E-RELEASE-PREP: current read-only Google/GitHub/Pages capture, local rollback and34
compatibility tests. [Release plan](docs/memory/PRODUCTION_RELEASE_PREPARATION.md),
[sanitized hashes](docs/memory/release/ARTIFACT_MANIFEST.json). Source ef5300f.
Remote commit references are verified through GitHub GET, not fetched into local Git.
Raw source/config/registry approvals remain ignored/private; current actual Players
join is unverified after403. No live rollback or activation claimed.

E-FINAL-REVIEW: owner VERIFIED23-way roster receipt and read-only source/editor capture;
[review](docs/memory/FINAL_RELEASE_REVIEW.md), [manifest](docs/memory/release/ARTIFACT_MANIFEST.json).
Current83/135 versus83/136 source now directly verified, corrected locally to83/136.
417 tests and5-width V2 artifact pass. Diagnostic not rerun and absent from captured
editor. API/static parity is by matching identity/covered period; prior raw API and
native running-table coverage/order distinctions are preserved, not hidden.
No live writes/deployments. Raw proofs/config/mappings remain ignored/private.

E-STAGE1-INTEGRATION: [handoff](docs/memory/STAGE1_INTEGRATION.md), merge0a13035,
fetched remote28ff44c. Exact remote snapshot bytes, both histories and local code
preserved;34 compatibility tests and schema/privacy/history checksPASS. Log is local
/tmp/pp-stage1-compatibility.log; no production operation or diagnostic rerun.

E-STAGE2-WEBSITE: [review](docs/memory/STAGE2_WEBSITE_APPROVAL.md).Current remote
objects checked through GitHub GET, not fetched into Git. Five commits individually
snapshot-only; current public snapshot/38-file rollback captured; unchanged-data
compatible artifact sealed.34 tests/mobile+desktopPASS. No live change or activation.

E-STAGE2-PUBLISHED: [completion](docs/memory/STAGE2_PUBLICATION_COMPLETE.md), code
5a7da37 and run43494274078 verify/deploySUCCESS.417CI+34local tests;38 live file hashes
exact at19:43UTC with unchanged snapshot. Mobile/desktopPASS,accuracyOFF. Raw logs/
captures ignored locally. No backend/automation changes or diagnostic execution.

E-ACCURACY-PRODUCTION: [execution](docs/memory/ACCURACY_PRODUCTION_EXECUTION.md).
API21/22 metadata+source receipts,legacy endpoint parity,23runtime roster,417 tests,
fresh real-source candidate and rollback in ignored tmp/accuracy-production-execution/.
Public400a4ba/run43498535843 and38 live hashes verified; accuracy site not yet verified.
Private source/config/IDs excluded. Google403/Firefox denial receipts are permission
limitations, not evidence of failed scoring or successful corrected publication.

E-ACCURACY-LIVE-VERIFIED: [final report](docs/memory/ACCURACY_PUBLICATION_VERIFIED.md).
Actual public snapshot/GitHub hash match,38files,API22/23players136final,covered-scope
parity and live5-width browser PASS. Run43544425722 verify/deploySUCCESS,417CI tests.
Protected outcomes EXACT; raw read-only receipts/logs in ignored verification folder.
No regeneration/redeployment/state/trigger changes; remote observed by GET only.

E-MATCH-CENTER-W10: [report](docs/memory/MATCH_CENTER_WEEK10_REVIEW.md). b9c43b1
layout fix/new geometric browser regression;0b52245 deadline/source privacy cases.
418testsPASS,38livehash/periodparity/protected resultsEXACT. Raw read-only captures,
originalCSS red/green logs,403header receipt and staged safe-output diagnostic in
ignored tmp/match-center-review/. Exact private source failure not independently
verified; no diagnostic installation/execution or production write.

E-W10-METADATA-DIAGNOSTIC: [review](docs/memory/WEEK10_METADATA_DIAGNOSTIC_REVIEW.md).
248db91 generic renderer+7AST safety tests;13focused checksPASS. Bound source/receipt
in ignored tmp/match-center-review/. No function evaluation/production execution or
installation. Old blocked artifact SHA preserved. Runtime cause remains unverified.

E-CI-W10-FAILURES: [consolidated report](docs/memory/WORKFLOW_FAILURES_WEEK10.md).
Alltodayruns/jobs/annotations and failed/successlogs in ignoredworkflow-week10-review.
43543074590failed3Chromestartups;43544425722sameSHApassed417+deployed. All3verify
annotations retrieved,0deploy.5ae7d8d/e4f23f8localfixes;426serial+8ASTPASS. Fresh
38livefile/parity/privacy/protected recordsauditPASS. Week10 nativecauseunverified.

E-CONSOLIDATED-WEBSITE: [release report](docs/memory/CONSOLIDATED_WEBSITE_RELEASE.md).
557c7c8merge,426tests,12actual-artifactbrowser samples,38sealedcandidate/rollbackfiles,
37unchanged+snapshotexact andprotectedresults/parityPASS. Ignoredconsolidated-release
receiptsincludeGET-onlydeployment/sourceaccesscheck:0APIEXEC,existingv1tempfile,v2
notinstalled;existingwebroutehasnoexecutionhook. No push/deploy/run/statechanges.

E-CONSOLIDATED-PUBLISHED: [completion](docs/memory/CONSOLIDATED_WEBSITE_PUBLISHED.md).
d7d6c1dnormalpush;43558486370Linux426PASS,verifycompletedbeforedeploy.38livehashesexact,
CSSonlydelta,37unchangedincludingsnapshot;12livebrowsersamples/6widthsPASS. Private
ignoredconsolidated-publication receiptsincludeCIordering,fulljobs/log,livefiles,and
postAPI/static/protectedresultsaudit. No backend/state/Forms/triggers/diagnosticwrites.
