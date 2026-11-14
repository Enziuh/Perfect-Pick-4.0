# Project history

Reconstructed 2026-11-12 from local Git and existing records. This is a milestone
index, not a complete deployment ledger. Runtime claims require separate evidence.

| Commit | Milestone | Evidence |
|---|---|---|
| 22ac8c2 | Initial repository | Local Git |
| deb6666 | Imported 3.0 backend | Local Git |
| 44b7d50 | Imported frontend baseline | Local Git |
| bd03928 | Synthetic preview and privacy safeguards | Local Git |
| 156d9dd | Frontend navigation/design | docs/architecture/FRONTEND_PHASE_1.md |
| 3a9c331 | Late-entry activation checkpoint | docs/migration/LATE_ENTRY_PROGRESS.md |
| 16148e1 | Source rollover/static recovery | docs/operations/SOURCE_ROLLOVER_RECOVERY.md |
| a3fb872 | Recovery verification; cloud fix pending | docs/performance/STATIC_SNAPSHOT_PROGRESS.md |
| 5732be1 | Guarded Week10 reopen prepared | docs/operations/WEEK10_REOPEN.md |

2026-11-09: owner-reported operational update supersedes the older report of the
Form not accepting responses, but does not independently establish current status.
See E-OWNER-1109 in [evidence index](EVIDENCE_INDEX.md).

2026-11-12: owner approved memory setup only; scoring issue remains pending.
Original Git history and all prior documentation remain preserved.

## Final local accuracy correction

Owner final clarification preserves existing per-game deadlines and supersedes strict
weekly proposals. Local commits96f1663 (versioned roster accuracy),73698e4 (UI/notice),
896aae3 (memory authorization validator),e64f28e (metadata validation hardening).
Final416/416 regressions passed. No source deployment, snapshot publication, push or
production write. See [report](docs/memory/SCORING_IMPLEMENTATION_REPORT.md).

Release preparation: ef5300f adds validated accuracy propagation through existing
publisher fallback. APIv20/editor/publisher and public assets captured read-only;
new source artifacts and rollback staged privately. Current registry verification
is pending owner receipt after direct-read403. No remote integration or deployment.

Final review: owner registry check completed, temporary diagnostic confirmed absent;
fresh read-only source independently verifies83/135→83/136 correction. Local V2
artifact preserves current static table ordering/coverage;417 tests and5-width
browser checks pass. Production remains APIv20 with flags off pending final review.

Stage1 owner-authorized snapshot-only integration completed at0a13035. Both remote
28ff44c and local6dd89d4 retained;34 tests and integrity checks passed. Local only.

Stage2 website review: Stage1 verified; five newer snapshot-only remote commits
identified read-only. Compatible current-data artifact/rollback prepared; no integration,
push or publication executed.34 tests and mobile/desktop checks passed.

Stage2 WEBSITE ONLY published from5a7da37, workflow43494274078SUCCESS.417CI tests,
34 targeted tests and live browser/file integrity checksPASS; snapshot unchanged.
Corrected scoring remains inactive pending separate Stage3 approval.

## November13 — accuracy production backend activation

Owner-authorized publisher compatibility update/API21 then API22 activation completed.
417 tests,23runtime roster,protected records and legacy endpointsPASS. Static accuracy
publication not verified: publisher-state permission blocked; current400a4ba legacy
snapshot preserved. [Exact continuation](docs/memory/ACCURACY_PRODUCTION_EXECUTION.md).

## November13 — accuracy release live verification complete

Scheduled publisher produced ROSTER_FINAL_V1; Pages run43544425722SUCCESS.38files,
API/static period parity,23players136final,5-width browsersPASS.417CI testsPASS.
Protected results EXACT. [Final evidence](docs/memory/ACCURACY_PUBLICATION_VERIFIED.md).
Verification only; no redeploy/state/trigger/production or remote Git writes.

## November13 — Match Center layout and Week10 disclosure review

Local b9c43b1 reserves score/name/logo/status regions; original320overlap reproduced.
0b52245 extends Week10 privacy guards.418testsPASS. Public deadline proof10 already
exists,but source unavailable; exact native reason requires private read access403.
[Report/boundary](docs/memory/MATCH_CENTER_WEEK10_REVIEW.md). No production change.

## November13 — minimum-metadata Week10 diagnostic ready locally

248db91 replaces broad-loader approach with bounded header/Results/control searches
and owner/project guard. Old diagnostic BLOCKED,unchanged.13focused checksPASS,7new
static tests;no diagnostic execution/production call. [Review](docs/memory/WEEK10_METADATA_DIAGNOSTIC_REVIEW.md).

## November13 — CI startup failures isolated;local hardening ready

[Evidence/allannotations](docs/memory/WORKFLOW_FAILURES_WEEK10.md). Failed43543074590
had3Chrome startup errors(414pass/3fail),not snapshot/privacy assertions;identical-SHA
retry43544425722succeeded.5ae7d8d serializes tests/logsChrome version;426localPASS.
e4f23f8 adds safe diagnosticstage/headertrim;owner generic metadata failure doesnot
identify Week10 source cause. No push/deploy/state/automation changes.

## November13 — consolidated website release prepared

557c7c8 cleanmerge preserves newerremote snapshot and alllocal fixes.38-file artifact
changesONLYCSS;426fulltests/12browser samplesPASS.37files/snapshotunchanged;rollback
38hashes/simulationPASS. [Scope/actions](docs/memory/CONSOLIDATED_WEBSITE_RELEASE.md).
No push/pub. PrivatepublisherhasnoAPIexecutiondeployment;oldtemporarydiagnosticexists,
v2absent. Oneowneraction updates/runs existingtemporaryfile,notanotherinstallation.

## November13 — consolidated website published/verified

Owner-approved normalpushd7d6c1d/staticrun43558486370succeeded. Linux426PASSbefore
deploy;38livehashesexact,ONLYCSSdelta,37remainingfilesunchanged(including
snapshot). Live6widths/12samplesPASS;protectedresultsEXACT. [Finalevidence](docs/memory/CONSOLIDATED_WEBSITE_PUBLISHED.md). No backend/privateprojectchanges.
