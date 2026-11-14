# Match Center layout and Week10 disclosure — local fix, native read boundary

## Scope and repository checkpoint

Owner authorized local UI correction,read-only disclosure investigation,tests,memory
and focused LOCAL commits only. No push,deploy,live configuration,Form,Sheet,trigger,
score,state change or forced publication authorized. Read current AGENTS,START_HERE,
latest handoff/SYNC and final accuracy evidence; memory validation/restart archive
restoration PASS. Starting HEAD3f8fc6c,clean develop; no unrelated working changes.
Accuracy release remains complete,not repeated. No production writer was invoked.

## Issue1 — responsive final score overlap fixed locally

Root cause: website/styles.css:989–1019 used flex rows. The team identity could shrink
against a non-reserved score/status area; the later winner rule enlarges score to34px,
while the card padding leaves little width. Long labels and WINNER painted into one
another. Reproduced against original CSS: new geometry test fails at320px with
'score/name/logo/status overlap'. No score or team data was changed to fix it.

Commit b9c43b1 changes ONLY website/styles.css and new tests/match-result-layout.test.cjs.
Grid reserves logo/wrapping-name and intrinsic score/status columns. Score and outcome
are vertically distinct; long text wraps within its own area. Original colors,winner
border/highlight,score weight and loss styles remain. Removed obsolete mobile flex
layout override. Actual renderer markup is tested using synthetic long Washington
Commanders/New York Giants labels,without changing underlying scores.

Browser320/360/390/430/768/1440,cold+repeat: rectangles for name/logo/score/status are
contained and pairwise disjoint; no page overflow;WINNER label,border and bold score
preserved. Original CSS RED,corrected CSS GREEN. This is a local fix,NOT deployed.

## Issue2 — public deadline proof exists; source remains withheld

Current production read evidence2026-11-14T02:57:42UTC (Nov13,18:57Pacific):
API22 unchanged,READY,23roster,ROSTER_FINAL_V1. Public snapshot remains
`e1d4c6f4c73ec614bdfa797344fbd82eb2e38eeb82dca2efac1a7c190a5024e4`,
generated01:51:44UTC,expires07:51:38UTC. Remote snapshot-only tip
`c03c053c6e6165110cad3d458474a3ac0617d470`,read by GET,not fetched/integrated.
Pages run43544425722 verify/deploySUCCESS; earlier failed retry is historical and
resolved. Installed publisher matches reviewed generator EXACTLY,hash
`e2385205e586f19e02b2e55e8b2c7790731fed4adb71423466f07a7edadedcea`.
No evidence of current Pages failure; private clock executions/state not inspected.

Verified public facts:

- Control activeWeek10,CLOSED. Cutoff2026-11-13T00:15Z (Nov12,16:15Pacific),opening
  kickoff01:15Z. Both match existing Week10 grant; no deadline changes are needed.
- Static deadlineDisclosures ALREADY contains PP4_WEEK10_DEADLINE_V1. All14 Week10
  kickoff records verified at capture; opening WAS/NYG FINAL,other13pending.
- Static Week10 entry OFFICIAL/CLOSED but picks and votes physically ABSENT. W10 table
  WITHHELD/CLOSURE_UNVERIFIED; retention weeks exclude10; M3/season cover only through9.
- API22 intentionally has deadlineDisclosure OFF and closedAttestations only1–9,
  seasonWeeks1–9,no explicit closure10. It therefore has Week10 UNKNOWN/UNVERIFIED,
  null game kickoffs and no picks/votes. This is the configured API authorization
  boundary,not a browser failure. It does not by itself explain the private fallback's
  withholding,since that fallback separately enables approved deadline disclosure.
- Private publisher fallback already enables deadlineDisclosure:true and grant10
  (tools/snapshots/cloud-package.cjs:37–47). Its completeness gate compares parsed
  response-game columns with required Results slate (tools/api/legacy-provider.cjs:74–84).
  Projector also requires verified entry/disclosure,complete slate and approved aliases
  (tools/projector/project-competition.cjs:86–113).
- Retention includes a deadline-authorized week ONLY when its SOURCE has arrays for
  picks AND votes (tools/snapshots/retention.cjs:27–28). Its restrict step overwrites
  withheld reasons with CLOSURE_UNVERIFIED (line12). Because W10 is also absent from
  original public aggregateStandings (generated from the pre-retention source),the
  pre-retention source did NOT supply an AVAILABLE W10. Passing the deadline alone
  cannot manufacture submitted picks or a complete authorized source table.
- Frontend website/app.js:422 and465 truthfully renders the withheld data; there is
  nothing safe for a browser-only fix to reveal. No disclosure bypass/cache trick.

The exact native gate failure (incomplete/mismatched columns,alias validation or other
source verification) is NOT independently established. A bounded Responses row1-only
Sheets GET with existing credentials returned403;no raw header/player data was read
or logged. Do not label missing submissions,unmapped players,or a failed trigger as
proven causes. An entirely missing week alone is NOT a reason to reduce denominators
or invent picks. Week10 is already authorized after the pinned cutoff,subject to its
existing source/identity checks; no new privacy rule is proposed. Votes/selections may
be published only after those guards pass,not merely because the clock has passed.

## Verification and protected results

Commit0b52245 extends tests/week10-readiness.test.cjs: valid deadline but absent source
picks/votes stays WITHHELD; pre-deadline exposure,wrong control cutoff and expired
proof are rejected; valid after-cutoff source yields selections/votes while11+stays
withheld. Existing synthetic coverage verifies OPEN-after-deadline behavior and period
arithmetic. No privacy condition or scoring code changed.

Full suite418PASS,0fail/skip,including snapshot/schema/integrity/privacy,API/static
parity,scoring/qualification/prizes and browser suites. Isolated synthetic test staging
matches CI; original ignored generated packages/seals restored afterwards.

Fresh read-only live parity audit PASS:38live files match approved published artifact,
23IDs/aliases intact,9weekly/2closedmonthly and matching running/season scopes agree.
All protected aggregate table values AND order,months/prizes,picks/votes and frozen
Weeks1–8 history match pre-accuracy baseline EXACT. Season136for all23;Isaias/Pancho
83/136,61.0%. No data edit,publisher execution,regeneration,workflow dispatch or remote
Git write. NFL sync,Forms,closing automation and existing per-game cutoffs untouched.

## Exact next owner boundary

1. Review/authorize a ONE-TIME read-only diagnostic in the EXISTING PRIVATE PUBLISHER
   project,not the original API project. Staged complete source:
   tmp/match-center-review/Week10DisclosureReadOnly.gs,
   function pp4InspectWeek10DisclosureReadOnly. NOT installed or executed in production.
   Uses existing permissions; requires active/effective configured owner. Reads normal
   API/schedule/context/Form status through installed reviewed fallback; no state,
   publishing,trigger,configuration,Form/Sheet writes or token transmission. Additional
   context read compares only Week10 slate/header counts. Output only sourceState,
   allowlisted reason,expected/header/missing/extra/duplicate counts,presence booleans,
   writes0. No names,IDs,phones,selections or raw exceptions.3synthetic safety/output
   cases and ES2020 checkPASS. Source SHA256:
   `43cfd152750efef60116164459c7ce234c9b1f9cd588345bd9a89adb8655cd5a`.
   Owner reviews entire staged file first; if approved,run ONCE,share safe receipt,
   remove temporary file. Do not run pp4CloudSnapshotTick/setup/score functions instead.
2. Use that receipt to identify the exact native gate and propose only its narrow fix.
   Any actual native change,privacy approval or production regeneration/publication
   requires NEW explicit authorization. Do not loosen completeness/alias verification,
   grant10 merely because it is CLOSED,or reset clock/publisher state.
3. UI fix publication is also separately pending. Before a normal approved push/static
   release,inspect and preserve newer remote snapshot history; local public-data is
   older and must NOT overwrite the live snapshot. No fetch/merge/push now.

## Artifacts and restart

Ignored tmp/match-center-review/:read-only API/static/deployment captures,source-gates,
header403receipt,38livefiles,seals/parity report,layout-red/green/full-test logs and
staged read-only diagnostic/synthetic safety check. Private raw evidence/configuration
excluded from Git/restart archive. Only code/test commits above plus focused memory
checkpoint are local. Application JSON/snapshots and backend source unchanged.

Restart: read AGENTS,START_HERE,SYNC and this report;verify latest memory receipt and
Git. Do not repeat completed accuracy rollout or the scored-data investigation. The
safe local UI work is done; Week10 remains at an identified private-source read
boundary,with uncertainty explicitly retained. Current authorization does not permit
installing the staged diagnostic,deploying CSS or publishing any snapshot.

## Subsequent safety review and metadata-only replacement

The original Week10DisclosureReadOnly.gs above is BLOCKED:its broad-helper reads
exceeded minimum necessary access. It remains unchanged and must NOT be installed.
See [replacement review](WEEK10_METADATA_DIAGNOSTIC_REVIEW.md) for the NEW
Week10DisclosureMetadataReadOnly.gs and pp4InspectWeek10DisclosureMetadataOnce.
Metadata-only revision is local,static-tested,not installed or executed. Matching
metadata returnsINSUFFICIENT_EVIDENCE,not permission to inspect submissions/registry.
