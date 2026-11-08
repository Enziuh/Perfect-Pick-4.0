# Week 10 public test — owner activation package

Status: preparation verified; Form changes and private publisher installation NOT
performed. The live historical/Week9 website remains functional. This is not approval
to open the Form or execute its writer workflow.

## Verified plan

See WEEK10_FORM_PLAN.json: all14 matchups and their existing Results order independently
match the NFL2026 ESPN scoreboard used by the original backend. Opening game is the
Chargers/Ravens matchup, last in existing Results order; retain that order. Cutoff
selection uses earliest verified kickoff, not question position.

- Opening kickoff: Thursday November12,2026,17:15 America/Los_Angeles (Nov13,01:15Z).
- Official cutoff: Thursday November12,16:15 Pacific (Nov13,00:15Z), inclusive for picks.
- Existing linked Form URL and Name/Phone identity questions stay unchanged.
- Fourteen required choices use `W10 | <exact Results Game value>` and original
  Team1/Team2 values. No historical submission/question deletion or cleanup.
- Week10 is NOT a designated tiebreak week; original monthly tiebreak question remains
  on Week12. Do not add an invented Week10 prediction question.

Read-only verification found the CURRENT ORIGINAL PROJECT EDITOR offset is1hour;
immutable API20 still contains the historical3hour constant. Do not upload local
apps-script/src or redeploy API20. Temporary adapter handles either reviewed1/3hour
editor state and restores it after the normal setup call, including exceptions.

## 1. Compatible frontend first

Deploy reviewed develop with existing Pages static profile, retaining the already
approved live snapshot. Old historical/Week9-only V2 remains compatible. No real
Week10 data is published during preparation.

## 2. Existing private registry project — publisher ONLY

Prepared file: `tmp/cloud-publisher-week10-approved/CloudSnapshotPublisher.gs`
SHA256: `648edf3f4ca02dcb4385fcb98819c81c5cfb580b4e0352f5bba2e312e883fc9a`.
Adjacent seal stays local; no manifest/clasp files are uploadable.

After owner approves installation, privately back up installed CloudSnapshotPublisher,
replace ONLY that file, save. Keep PP4_CLOUD_SNAPSHOT_CONFIG (including existing
`deadlineDisclosure:true`), credential,23IDs,registry/backups and clock untouched.
No deployment, OAuth change or clock installer. Run pp4CloudSnapshotTick once after
installation approval, then independently verify its snapshot/Pages. NOT_DUE/CI-ack
is valid: preserve nextRunAt/state and let the existing clock reach its next due run.

The updated allowlist authorizes ONLY9 and10 after their separately pinned verified
cutoffs. Before10cutoff its picks/predictions/votes remain physically absent, even if
its Form is closed. Missing players never block eligible disclosure.11+ remains
withheld. Actual Form Control activeWeek is distinguished from the competition week
so normal week transitions do not revoke approved9 history or guess10closure.

Month3 running rows sum EXISTING available authorized weekly points and completed-pick
denominators, with shared ranks; coveredWeeks is validated against the public weekly
records. No future/unavailable week contributes. Historical month outcomes remain
unchanged. Champions/tiebreakers/prizes stay pending until their original finalization
rules are met. Season running totals similarly preserve approved history while a new
week is OPEN. API20/scoring formulas are not modified.

## 3. ORIGINAL football project — preferred EXISTING workflow, no new source

The live editor was verified to have DEADLINE_HOURS_BEFORE_KICKOFF:1. Preserve it;
no new file, upload, deployment, source replacement or permission is required here.

1. Owner select existing **previewWeek10** and run. This is read-only. Confirm14
   matchup questions/Results order against WEEK10_FORM_PLAN.json, openingNov12,17:15
   Pacific,computed picksCloseNov12,16:15Pacific and no Week10 tiebreak question.
   Stop on a duplicate existingWeek10 or any mismatch. The inherited preview result
   may still label deadlineRule as3hours in text; actual computed picksClose must be
  16:15. That stale diagnostic string is not authority to change the cutoff.
2. **Separate approval is still required to open/create Week10.** At the intended
   normal transition (prefer after Week9 games conclude), owner run existing
   **setupWeek10 once**, ONLY after the computed preview above is correct. The existing
   workflow creates the section/14required questions, routes entry to10, opens the
   existing Form, updates active FormControl and replaces its ordinary one-time Form
   closing trigger. It also removes legacy TEST-close triggers per existing workflow.
   These writer effects must be expressly approved; no manual Week9close/reopen,
   ESPNsync,scoring writer or publisher-clock installer is requested.
3. Verify official responder has correct14questions/choices/order; FormControl10
   deadlineNov12,16:15Pacific,original URL,correct normal close trigger,historical9
   responses preserved. Do not run setup twice or repair partial setup by deleting
   historical data. If preview is wrong, STOP; do not run it with the immutableAPI20
   source's old3hour offset or replace the restored unpublished editor source.

Optional strict guard adapter (NOT necessary with the verified current editor):
`tmp/week10-form-owner-candidate/Week10OwnerSetup.gs`, SHA256
`88853e322a0992583f29a4ca3a924855bce07ab0eea324584e5252387e13683f`.
It is prepared/tested/disabled, NOT installed. If owner explicitly chooses its added
row-order/instant guards, adding its temporary file requires separate approval:
pp4PreviewWeek10OneHour reads only,pp4SetupWeek10OneHourApproved is blocked unless its
own approval flag is enabled. The latter calls the SAME existing setupWeek10 with
one-hour runtime offset and restores config. It is not a replacement backend or a
prerequisite for the preferred existing workflow above. Remove temporary file after
use if ever installed; never modify registry Properties or duplicate triggers.

## Acceptance and rollback

Before cutoff, downloadable static10 has no protected fields; prior weeks/season and
Month3 running coverage remain available. At/after cutoff, verify actual accepted10
entries,Missing labels,eligible-only votes/MISSED DEADLINE,stable23IDs,privacy and
Pages success. Unfinished month remains IN PROGRESS with no award.

Before each owner operation keep the previous source privately. For publisher failure,
restore its prior file and preserve state/clock; use existing approved static/API-backed
frontend rollback6d1adea if necessary. Never extend expired evidence or assume rollback
removes public cache/history. Form setup is not a transactional operation: on partial
failure stop for owner inspection, do not delete/recreate data or repeat blindly.

## Reviewed preview-label correction (prepared only, not applied)

Current editor configuration/calculations already use1hour. In
previewPerfectPickWeek, replace ONLY `deadlineRule: '3 hours before first kickoff'` with:

```javascript
deadlineRule: PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF +
  (PP_WEEKLY_FORM.DEADLINE_HOURS_BEFORE_KICKOFF === 1 ? ' hour' : ' hours') +
  ' before first kickoff',
```

This affects the returned diagnostic text only. FormControl,storeddeadline,trigger
and4.1eligibility do not consume this field. Exact current function was locally
reproduced and patched:14games and16:15Pacific unchanged. No production source edit
has been applied. No API20redeployment,trigger recreation,Form opening or Sheet edit
is required for this correction. Obsolete3hour introductory comment can be corrected
separately; it is not executable logic. Opening still requires explicit owner approval.
