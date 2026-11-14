# Consolidated website release — published and verified

## Final result

Owner explicitly approved consolidated CSS/layout and CI reliability publication.
Release completed November13 2026,20:52Pacific (November14 04:52UTC). No material
blocker/unexpected remote changes. No additional production approval is needed for
this completed website release. Do not repeat deployment or start unrelated work.

[Live website](https://enziuh.github.io/Perfect-Pick-4.0/)
[Successful workflow43558486370](https://github.com/Enziuh/Perfect-Pick-4.0/actions/runs/43558486370)

Published/pushed source commit:
`d7d6c1d0e36f7ae77fca0e3ed32442053aa0e244`

Normal non-force push c03c053→d7d6c1d succeeded. Authorized fetch found no newer
remote commits;all current snapshot data preserved. Merge557c7c8 and reviewed layout
b9c43b1/CI5ae7d8d plus tests/supporting documentation remain in history. No source was
rewritten for publication. Existing workflow dispatched ONCE with profile=static.
No retry,force push,reset,backend upload,APIdeployment or snapshot regeneration.

## Linux verification preceded deployment

Actual GitHub run on ubuntu-26.04,Node22.23.4,Chrome157.0.8103.50:

-426testsPASS,0fail,0skip with test-file concurrency1.
- Verify completed2026-11-14T04:51:58Z.
- Deploy started04:52:02Z,completed04:52:12Z,SUCCESS.
- Static profile build and final artifact verification succeeded;API profile skipped.
- All verification/privacy/freshness/upload/deployment gates remained mandatory.

Run metadata/step ordering proves Linux verification completed BEFORE deployment.
No 'queued means deployed' assumption or historical417test count substituted. Existing
runtime deprecation/migration warnings did not fail this run;no unrelated action/
runner upgrades or browser sandbox weakening occurred.

## Exact deployed content and layout

All38deployed files matched approved candidate seal at04:53:20UTC. Exactly ONEfile
changed:styles.css. The remaining37files are BYTE-UNCHANGED,including data/snapshot.json
and36other website files. App/config/index/static readers/logos/fairness notice unchanged.
Private diagnostic .gs files/tools are NOT in public artifact;no diagnostic interface
was added to the website. Repo-only generic tooling/tests were not installed remotely.

Snapshot SHA256 before AND after:
`e1d4c6f4c73ec614bdfa797344fbd82eb2e38eeb82dca2efac1a7c190a5024e4`
Generated2026-11-14T01:51:44.219Z,expires07:51:38.618Z;fresh at publication/verification.
The approved artifact was NOT expired;no regeneration or timestamp renewal needed.
Candidate seal:
`261297a08684e89312710c38c3eddfb0649240e853a8a0183f46541dd6538a36`

LIVE browser320/360/390/430/768/1440,cold+repeat,12samplesPASS:actual Week10 WAS/NYG
final card scores unchanged,one correctly highlighted winner/team color,logo/name/
score/status rectangles disjoint and contained,no horizontal overflow.0runtime errors,
0APIrequests;public static delivery intact. Week10 player control/voting remains
withheld,not forced visible. Tested actual deployed bytes/live URL,not synthetic preview.

## Protected competition behavior

Fresh post-publication API/static parity/history/privacy audit PASS at04:53:40UTC:

- API22 READY,same deployment URL/access;ROSTER_FINAL_V1 unchanged.
-23approved identities/aliases unchanged,season GamesFinal136for all23.
- Isaias83/136,61.0%;Pancho R.83/136,61.0%.
- Matching weekly/monthly/season/running-period arithmetic exact.
- Original core points,ranks/order,weekly/monthly outcomes,qualification counters,
  tiebreak/prize/month records and frozen Weeks1–8 match protected baseline EXACT.
- Public namespace/schema/privacy/freshness validators PASS;no private player data.

No Apps Script source/deployment/configuration,Forms,Sheets,deadlines,triggers,
score-sync settings,publisher state or private player records were modified. No private
diagnostic,publisher tick,setup or writer function was invoked. Only reviewed GET-only
API/deployment metadata reads were used for verification.
No privacy rule changed;Week10 selections physically absent in unchanged snapshot.
The separate Week10 native-source/diagnostic investigation remains at its prior
owner-access boundary and was NOT advanced under website-only publication approval.
There is no outstanding owner action for THIS website release.

## Rollback and evidence

Previously tested rollback remains intact,not executed:

- tmp/consolidated-release/rollback-public/38files and sibling seal captured exact
  preceding public website. SealSHA256:
  088b8cd836cd5b185f8f31e87f44e7f093621a59c68e5933179b01142b4b1889.
- Candidate CSS reversal simulation restores all38preceding hashes;non-mutating
  reverse-patch checks for b9c43b1 and5ae7d8d passed. No backend rollback required.
- If a later owner-approved rollback is needed,preserve the CURRENT/newer snapshot,
  focused-revert CSS/layout commit b9c43b1,verify with fresh data,normal push/static
  workflow. CI-only rollback5ae7d8d is separate if actually required. Never force/reset,
  overwrite newer data or republish expired captured snapshot. See original
  [consolidation/rollback procedure](CONSOLIDATED_WEBSITE_RELEASE.md).

Ignored tmp/consolidated-publication/ holds preflight/public/API/deployment captures,
normal-push/dispatch receipt,workflow jobs/full log/watch,Linux ordering receipt,
all38actual live files and seal-match receipt,12livebrowser samples and post/
read-only protected-results audit. Private captures/credentials/.gs/IDs remain excluded
from Git and restart package. Raw logs are evidence,not deployable/private export.

Memory-only local checkpoint/normal synchronization follows this report. No second
Pages dispatch is needed for documentation. Working tree is committed/clean at final
checkpoint;portable archive validates inventory,hashes and safe restoration. The
receipt records its exact finalized commit outside Git to avoid self-reference.
Next session:read AGENTS/START_HERE/SYNC/latest handoff;use this final report instead
of repeating old pending/deployment instructions. Further production/unrelated work
requires a new applicable authorization.
