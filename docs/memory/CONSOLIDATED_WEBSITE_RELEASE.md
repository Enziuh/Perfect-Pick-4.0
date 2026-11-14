# Consolidated website release — verified locally, stop before publication

## Current scope and readiness

Owner authorized consolidation/local verification and snapshot-only remote integration,
not push/publication or private-project changes. Started clean develop706f9e8;prior
memory/restart verified. No repeated scoring investigation or backend deployment.

Release code/snapshot candidate:557c7c8c4e1983971341657e5a578dd20bca9f5c.
Locally READY;new Linux CI run and deployment remain at owner approval boundary.
Only changed deployed public file is styles.css. Other37files,including snapshot,
index/app/config/readers/logos and fairness notice are BYTE-UNCHANGED.

Consolidated source scope relative to current origin/develop:

| Non-memory file | Purpose/commit |
|---|---|
| website/styles.css | Responsive score/name/logo/status grid,b9c43b1 |
| .github/workflows/pages.yml | Serial test files + Chrome version receipt,5ae7d8d |
| tests/match-result-layout.test.cjs | Geometric overlap regression,b9c43b1 |
| tests/week10-readiness.test.cjs | Keep absent/unverified source picks private,0b52245 |
| tools/verification/week10-disclosure-metadata.cjs | Generic LOCAL diagnostic renderer,248db91/e4f23f8 |
| tests/week10-disclosure-metadata.test.cjs |8static privacy/safety tests,248db91/e4f23f8 |

Memory-only changes also included:START_HERE,PROJECT_HISTORY,EVIDENCE_INDEX,
RESEARCH_STATUS,AGENT_HANDOFFS,CHANGELOG,SYNC_STATE;docs/memory/ACCURACY_PRODUCTION_EXECUTION,
ACCURACY_PUBLICATION_VERIFIED,MATCH_CENTER_WEEK10_REVIEW,WEEK10_METADATA_DIAGNOSTIC_REVIEW,
WORKFLOW_FAILURES_WEEK10,this CONSOLIDATED_WEBSITE_RELEASE report and release/
ARTIFACT_MANIFEST.json. No additional frontend diagnostic feature is needed:diagnostic
is PRIVATE Apps Script editor work,not a public website module. No generated private
.gs/source/config or credentials enter Git or38-file publication allowlist.

Existing accuracy/backend behavior remains unchanged. No Apps Script/API/publisher
source/config deployment is in this release;no Week10 privacy grant or pick publication,
Form/trigger/ESPN/scoring/deadline change. Do not turn consolidation into backend work.

## Remote preservation, freshness and integrity

Authorized fetch found ONE new remote commit,c03c053c6e6165110cad3d458474a3ac0617d470,
changing ONLY public-data/snapshot.json. Individually inspected commit and validated
snapshot schema/privacy/identity/freshness/history and exact protected core tables.
Clean non-destructive merge557c7c8 preserved both parents/history and ALL local commits.
No force/reset/rebase;no conflict;no unrelated remote change. Remote tip rechecked by
ls-remote at04:34UTC and unchanged. Working tree clean before memory update.

Snapshot SHA256:
`e1d4c6f4c73ec614bdfa797344fbd82eb2e38eeb82dca2efac1a7c190a5024e4`
Generated2026-11-14T01:51:44.219Z;expires2026-11-14T07:51:38.618Z
(Nov13,23:51:38Pacific). Fresh at final local verification. Do not publish expired
artifact or extend timestamps. Future release must fetch/reinspect newer snapshot-only
commits and restage/reseal latest verified data if tip/data/freshness changed.

Existing production snapshot was COPIED byte-exact into the local artifact,not
regenerated or published. ROSTER_FINAL_V1,23IDs/aliases preserved. Frozen Weeks1–8 and
all protected aggregate rows/order,monthly outcomes,qualification,tiebreaks/prizes
exact pre-release baseline. API22 still READY,same deploymentURL/access;season136for
all23,Isaias/Pancho83/136,61.0%. Week10 remains withheld under existing source gates.
Current successful live Pages run remains43544425722,417tests;not this new candidate.

Private ignored tmp/consolidated-release/:

- website/ and website.seal.json:EXACT38-file release artifact.
- rollback-public/ and rollback-public.seal.json:EXACT38current live files fetched/
  hashed before publication;not a stale repository copy.
- rollback-restoration-test/:candidate restored using ONLY captured styles.css;
  all38hashes EXACT old capture,snapshot unchanged.
- release-receipt.json/final-readiness.json:scope,freshness,seals and local checks.
- integration-preflight.json,capture-receipt.json and verification-receipt.json:
  GET-only production/GitHub/registry namespace/integrity/parity evidence.

Candidate seal SHA256:
`261297a08684e89312710c38c3eddfb0649240e853a8a0183f46541dd6538a36`
Rollback seal SHA256:
`088b8cd836cd5b185f8f31e87f44e7f093621a59c68e5933179b01142b4b1889`

## Verification actually completed

- Complete426test suite on merged code/snapshot with test-concurrency1:426PASS,0fail/
  skip;359.1seconds. Includes privacy,contract/schema,snapshot/history/integrity,
  API/static parity,cutoffs,qualification,ranking/prizes and all browser regressions.
  Isolated synthetic staging matched CI;previous ignored generated files/seals restored.
- Exact sealed production-facing candidate:320/360/390/430/768/1440,cold+repeat,
  12samplesPASS,0runtime errors/API requests. ACTUAL captured Week10 WAS/NYG final
  card scores unchanged,one winner with team color,disjoint/contained logo/name/score/
  status,no horizontal overflow. Week10 player selection disabled and voting withheld
  message preserved;no unauthorized picks exposed.
- Initial supplemental browser harness incorrectly waited for an AVAILABLE submission
  label on WITHHELD Week10 and timed out. Corrected harness waits for rendered week/
  cards;rerunPASS. No app or data change was made to satisfy that test;initial evidence
  retained. General426suite independently passes.
-38livefile rollback hashes,artifact schema/privacy/freshness,sealsPASS. API/static
  nineweekly/twoclosedmonthly and matching running/season scopes agree. All protected
  values/order/identities/qualification/prizes EXACT. No source counter semantics change.
- Rollback artifact simulation restores38exact hashes by reversing ONLY public CSS.
  Non-mutating reverse-patch checks for b9c43b1 and5ae7d8d pass independently.
- Workflow YAML parses;new tests/validators remain mandatory,no skips/timeout increases,
  sandbox disabling or retries added. Snapshot/data file is exact remote Git blob.

Linux boundary:hostmacOS/Node26.12.1;Docker,Podman,act and local Linux runner are not
available. Existing GitHub workflow can test only a pushed ref and deploys automatically
AFTER successful verification. No unpublished candidate Linux run can be claimed or
safely dispatched under current no-push/no-publication scope. Historical417Linux/Node22
success is separate evidence.426newcandidateLinux/Node22 verification is the first
required gate in an OWNER-APPROVED normal push/static workflow;deploy stays skipped
if ANYverification fails. Do not add an unrelated CI architecture phase or install a
new runtime solely to conceal this boundary.

## Private diagnostic access — direct API execution unavailable

Read-only Apps Script metadata inspection04:26UTC established:

- Existing PRIVATE cloud-publisher has0EXECUTION_APIdeployments,1existingWEB_APP,
  no pagination/hidden deployment page.
- Installed TEMPORARY file is named **pp4InspectWeek10DisclosureMetadataOnce**
  (Apps Script displays .gs). Its source hash is prior6b0e57... version,NOstage labels.
- Revised e4f23f8 candidate is NOT installed. Existing webdoGet has fixed competition
  routes and no diagnostic dispatch hook;no doPost/generic function executor.

Therefore no supported existing Script Execution API/web route can run the revised
function. Do not create an API-executable deployment,broaden scopes,add HTTP dispatch,
run the clock instead,or exploit editor internals. No production function executed.
No further browser permission/install exploration is needed to establish this boundary.

Revised source reviewed/tested8ASTchecks:
`tmp/workflow-week10-review/Week10DisclosureMetadataReadOnly.v2.gs`
SHA2560599ee49536a802637904c429a561d80fba5b52d8de9d83b13e82e57cb66a11e.
Wrapper **pp4InspectWeek10DisclosureMetadataOnce**. It reads only bounded Week10
header/Results/control metadata,not source submissions/phones/registry/config/other
week records;logsONEfixed-shape sanitized JSON with safe stage/reason/counts,writes0.
It can identify a metadata header/completeness blocker or the failed metadata-read
stage. It CANNOT prove alias/submission/private projection gates;matching metadata
returnsINSUFFICIENT_EVIDENCE. Do not promise it will necessarily identify every native
Week10 blocker or treat generic failure as proof of corrupted player data.

ONE precise owner action at the private execution boundary:

> In the existing PRIVATE publisher project,open the already-existing TEMPORARY
> pp4InspectWeek10DisclosureMetadataOnce.gs file. Replace ONLY its contents with the
> reviewed stage-labelled v2 source above,save,select pp4InspectWeek10DisclosureMetadataOnce
> and Run ONCE. Share ONLY the JSON receipt (stage/reason,not2500lines). Remove ONLY
> that temporary diagnostic file after collecting the receipt. Do not add another file,
> alter publisher/helpers/manifest,deploy,change Properties/permissions/triggers or run
> setup/scoring/clock functions.

This is replacement/execution of an existing temporary file,NOT another script/project
installation. It is an owner action,NOT performed/assumed authorized for the assistant.
If returnedINSUFFICIENT_EVIDENCE,stop at that scope;no automatic private-data expansion.

## Exact release approval scope and actions — NOT performed

Owner confirmation must cover normal snapshot-preserving integration/push and existing
Pages workflow profileSTATIC,conditionally publishing ONLY the compatible website
artifact after all verification gates. It does NOT cover private diagnostic replacement,
backend/API/Forms/triggers/scoring changes or snapshot generation. Consolidation scope
is the CSS fix+CI reliability change with local compatible diagnostic tooling/tests.

After explicit approval:

1. git fetch origin develop;inspect EACH newly fetched commit. Integrate only clean
   snapshot-only changes,keep newer production data. Stop on unexpected files/conflicts.
   Re-run necessary freshness/privacy/history/compatibility checks and restage EXACT
   artifact if snapshot changed;never substitute an expired local capture.
2. Verify clean intended tree,artifact seal/expiry/rollback hashes and reviewed scope.
3. Normal non-force push:git push origin develop. Existing publisher can dispatch the
   workflow later;push is not promised inert. Approval must cover intended publication.
4. Existing workflow ONLY:

```sh
gh workflow run pages.yml --repo Enziuh/Perfect-Pick-4.0 --ref develop -f profile=static
```

5. Record actual ref/run;LinuxNode22runs full serial426suite,then profile/schema/privacy/
   freshness checks before artifact upload. Deploy ONLY on success;never bypass gates.
6. Verify actual38livehashes,sealed scope/snapshot,desktop/mobile score/winner alignment,
   accuracy136/current coverage and all protected outcomes. Do not claim publication
   from queued CI or a previous417run. Update memory/restart with actual final result.

Rollback if later approved/needed:preserve current/newer snapshot and all other code;
focused git revert b9c43b1 reverses CSS/layout-test commit,leaving CI hardening and
privacy logic. CI-only reversal5ae7d8d is separate if actually needed. Reverse-patch
checks passed,not applied. Normal commit/push/static workflow with fresh currentdata
and existing integrity gates;no reset/force/history rewrite. Artifact CSS restoration
simulation proves38bytes equivalent for this current snapshot. Do NOT upload old
snapshot if newer one exists or capture has expired. API22/publisher rollback is NOT
part of a website-only release;backend stayed unchanged.

## Continuity/exclusions

Merge557c7c8 contains reviewed layoutb9c43b1,CI5ae7d8d,privacy0b52245,diagnostic
248db91/e4f23f8 and existing memory commits. No implementation rewritten. This report/
root status/manifest are the only new local documentation after merge. Final focused
memory commit and private restart archive follow. Raw private .gs/project captures,
credentials,registry linkage,rollback files/generated packages remain ignored/local;
portable package carries sanitized review/evidence hashes only. Working tree clean at
checkpoint. Stop before push/deploy and before private diagnostic source/execution.

## Subsequent owner-approved publication — COMPLETE

Prior pending/stop-before-publication state above is historical.
[Finalpublication](CONSOLIDATED_WEBSITE_PUBLISHED.md):normalpushd7d6c1d,run43558486370
Linux426PASSbeforedeploy,38livehashes/6widthsPASS,CSSonlydelta,snapshotunchanged,
protectedresultsEXACT. No backend/privateprojectchanges or diagnosticexecution.
Do not repeat deployment;separateWeek10privateboundaryremainsunchanged.
