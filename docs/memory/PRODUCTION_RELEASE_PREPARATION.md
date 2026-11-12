# Accuracy production release — staged, not deployed

## Status

Owner authorized release preparation and read-only capture only. Local checkpoint
4b046a0 was clean and its package verified. No fetch, merge, push, Apps Script
execution/update, version creation, deployment/config change, trigger/Form write,
production snapshot regeneration or publication occurred.

Release compatibility fix ef5300f preserves validated ROSTER_FINAL_V1 through the
publisher's reopened-week fallback. Previously the fallback rebuilt its private
provider config without the opt-in, silently dropping corrected accuracy. It now
inherits ONLY a validated source's accuracy version/roster consent; old sources
stay disabled. A red regression demonstrated the missing flag;34 targeted
compatibility/scoring/disclosure/rollover tests now pass,0fail/skip. Existing per-game
cutoffs, qualification, historical equality and scoring remain unchanged.

## Read-only current evidence — November12 2026,19:11:58UTC

- Existing API deployment version20; exact version source, current editor source,
  deployment metadata and manifests saved privately. Existing editor differs from
  version20 and has Week10 work. Candidate preserves all editor files except the
  intended module and dashboard route argument. Never upload a repository baseline
  over the current project or discard pending editor work.
- Installed publisher source SHA256:
  36c0b7c2f5f4d62bfc08f095c70d8cea98ebd28a3465763e095db05b638c06d6.
  Rollover repair is present; current accuracy support is absent.
- Most recent successful Pages run43247028789, commit
  32c0c9572f38cd4bb87fd8c757dd6cb1397f1f42. Read-only GitHub comparison:
  remote is18 commits beyond5732be1, affecting ONLY public-data/snapshot.json.
  Local origin/develop was not fetched or updated. Do not force-push over those
  published snapshots. Current capture's Git blob matches that exact remote commit.
- Public snapshot SHA256:
  f51e816f111ef3eb9d803c585077e11084673a26054f4069cc16681c87062ecc.
  Generated2026-11-12T15:21:55.779Z; expires2026-11-12T21:21:45.335Z;
  23 public aliases, no accuracy metadata. All38 deployed public files captured and
  hashed for rollback. This snapshot was COPIED unchanged into a compatible website
  artifact, not regenerated or renewed. Expired staging is blocked, never extended.
- Deployed API config: enabled/publicationApproved true, revision1,
  lateEntryRules LATE_ENTRY_V1, startWeek9, prizeParticipants23. Accuracy flags absent.
  Exact private config is captured, not printed/committed. Publisher Properties are
  identified by source but were NOT exported or changed; no Properties-read execution
  or new diagnostic was run remotely. All existing property values must be retained.

## Registry check — one remaining verification blocker

Deployed config has23 approved, unique source IDs/source labels/aliases; all23
aliases match the live public snapshot. Direct bounded Players column access returned
403 with existing credentials. This is NOT proof of a mapping failure and NOT an
independently verified current Players-sheet join. No OAuth access was broadened.

Prepared owner-only read diagnostic RosterReadOnlyCheck.private.gs is pinned to
captured DEPLOYED v20 approvals, so it does not mistakenly use the different current
editor's old config. It reads only bounded Phone/Display Name columns, detects
ambiguity/duplicates, and returns state/counts/oneToOne/writes0. No raw names or phones
are printed. Synthetic valid/duplicate/missing-approval cases3/3 pass. Installing or
running it in Apps Script still needs separate owner authorization. Expected receipt:

```
{state:'VERIFIED',registryPlayers:23,approvedAliases:23,oneToOne:true,writes:0}
```

An owner can instead privately verify the same23-way join through existing Sheets
UI. Report match/count only. Do not infer membership or approve a failed join.

## Local staged artifacts and seals

All raw sources/configuration are in ignored, permission-restricted
 tmp/accuracy-production-release/; never commit/share these private files.

- current/: deployed API v20, differing current editor, publisher source, deployment
  metadata, exact config, six primary public files,38-file website rollback and seals.
- staged/PerfectPick4_Json.compatible.private.gs: new validated module with EXACT v20
  config and original v20 wrappers; correction remains off.
- staged/00_Config_Setup.route-compatible.private.gs: current editor file, ONLY
  passes existing request e to dashboard4 (the deployed version already does this).
- staged/api-compatible-project.private.json: candidate preserving all other current
  editor files, including current Form/sync code and Week10 helper. No blanket reset.
- staged/PerfectPick4_Json.activate.private.gs and api-activate-project.private.json:
  same candidate with ONLY accuracyRules ROSTER_FINAL_V1 and rosterFromWeek1 true added.
- staged/CloudSnapshotPublisher.compatible.gs: dual-compatible validators + fallback
  fix. It reads existing private Properties/IDs; no new configuration or initializer.
- staged/RosterReadOnlyCheck.private.gs: future owner-only bounded read diagnostic.
  Do NOT install the generic RosterReadOnlyCheck.gs template (it is test input only).
- staged/website-compatible/:38 allowlisted files plus sibling seal; latest readers
  with byte-identical captured current production snapshot. No new source data.
- staged/api-editor-rollback.private.json, api-deployment-rollback.private.json and
  CloudSnapshotPublisher.rollback.private.gs: exact captured rollback material.
- staged/MANIFEST.private.json: SHA256 of candidates, configuration-bearing rollback
  files, roster diagnostic and website seal. [Sanitized manifest](release/ARTIFACT_MANIFEST.json)
  contains hashes/status only, never source/configuration/identity values.

Current artifacts pass SHA256/inventory, source generator equality, privacy scanning,
public contract/freshness and ES2020 checks. Test staging did not replace existing
local generated packages. Website rollback38 files match their capture seal.

## Tested rollback and protected results

Local simulated source rollback restores BOTH changed API editor files to exact
captured bytes; all other files and configuration are preserved. Removing the two
activation fields reproduces the compatible config. Publisher rollback matches exact
captured source; deployment rollback identifies v20 and unchanged access/identity.
VM execution using fabricated Sheets proves deployed v20, compatible and activation
candidates yield identical legacy weekly1/2, overall and prize outputs, with0 denied
native writes. Staged artifacts match their seals. No live rollback was executed.
The earlier pinned historical accuracy tests (included in34) still protect original
points/ranks/winners/tiebreaks/monthly qualification/prizes and immutable snapshots.

Rollback ORDER matters: keep new dual-compatible readers/publisher until a fresh
legacy-format snapshot is confirmed. Do not restore old readers while accuracy
metadata remains in public data. Never republish an expired captured snapshot.

## Exact staged commands / owner actions — future approval required

Execute one stage at a time; stop on mismatch, stale data, changed scope or failed
receipt. None of the live actions below was executed during preparation.

### Stage0 — review/read gate

Run local checks (no upload, push or regeneration):

```
node tmp/accuracy-production-release/verify-release.cjs
node tmp/accuracy-production-release/verify-rollback.cjs
node --test tests/accuracy-release.test.cjs tests/cloud-snapshots.test.cjs tests/accuracy-roster.test.cjs tests/deadline-disclosure.test.cjs tests/source-rollover.test.cjs tests/week10-readiness.test.cjs
```

First command correctly BLOCKS after the copied snapshot expires or any artifact
changes. That requires a fresh READ capture/staging, not renewed proof timestamps.
Get current23-way mapping receipt. If authorized to use the diagnostic: owner adds
ONLY RosterReadOnlyCheck.private.gs to the captured original project, runs
pp4CheckAccuracyRosterReadOnly once, reports fixed receipt and removes that temporary
file. Do not deploy the diagnostic or run setup/score/cache/trigger functions.
Confirm no installed sources/deployment changed since capture; preserve any new edits
rather than overwrite. Preserve all existing publisher Properties unchanged.

### Stage1 — integrate remote snapshot and approve compatible website publication

Requires separate fetch/merge AND push/publication authorization. Existing publisher
can dispatch Pages after a push, so push is NOT promised to be inert.

```
git fetch origin develop
git diff --name-only 5732be11e63ee43bdbc2e1350f255f34396c926e..origin/develop
git merge --no-ff origin/develop -m 'Preserve current published snapshot before accuracy release'
```

Expected remote change list is only public-data/snapshot.json; otherwise stop and
review. Preserve new remote snapshots. Repeat necessary checks and re-pin exact merge
commit/artifact hashes (only data should differ). Source commits ef5300f and the
completed local accuracy implementation must be included. Only after approved:

```
git push origin develop
gh workflow run pages.yml --repo Enziuh/Perfect-Pick-4.0 --ref develop -f profile=static
```

Do not use the synthetic profile. The workflow builds against the then-current
validated snapshot; stop if expired. Do not replace it with this expired capture.
Verify successful workflow and exact live compatible-reader bytes before proceeding.

### Stage2 — install compatible publisher, no accuracy activation

After explicit Apps Script source-change approval, in EXISTING private registry
project replace ONLY CloudSnapshotPublisher with staged/CloudSnapshotPublisher.compatible.gs.
Verify old hash/preconditions first; preserve all other files, private Properties,
23 IDs, token, existing timer and state. No initializer/trigger installer/OAuth change.
The existing clock may perform its ordinary approved work; do not run the tick as a
preparation action. Confirm compatibility with current legacy source before Stage3.

### Stage3 — prepare compatible API version, correction still off

After explicit source/version/deployment approval, original project's owner replaces
ONLY PerfectPick4_Json and00_Config_Setup using the two compatible private.gs files.
Keep all other current editor files byte-identical. Use existing Manage deployments,
Edit SAME deployment, select New version and retain execute-as/access settings exactly
as captured. Record the actual returned version number; do not guess21. Confirm
legacy endpoint/points/prize parity and metadata unchanged. No setup functions run.

### Stage4 — activate derived accuracy AND authorize next publication

This approval must cover API activation AND the existing scheduled publisher's next
regeneration/publication; they are coupled by the active clock. Otherwise stop.
Replace ONLY PerfectPick4_Json with activate.private.gs. Its sole config delta:

```
accuracyRules: 'ROSTER_FINAL_V1',
rosterFromWeek1: true
```

Keep every prior config value, LATE_ENTRY_V1 and per-game deadlines. Publish a new
version on SAME deployment, preserving metadata. Verify negotiated read
?action=dashboard4&rules=LATE_ENTRY_V1 has accuracy.version ROSTER_FINAL_V1 and correct
23-way mapping. Existing publisher regenerates from fresh source, preserves existing
public IDs, validates core historical tables/historicalEqual, privacy and parity, and
publishes under the existing workflow. No production snapshot was generated now.

At validation, compare old/new scoring on the SAME bounded source revision/results:
points, rank order/ties, predictions/tiebreaks, monthly qualification, champions,
prizes/allocations and original tables must match; only derived accuracy changes.
Count FINAL per coverage, zero missing weeks, keep eligible submitted counts distinct.
If results advance during comparison, take a stable fresh read; never waive mismatch.
Observe actual existing clock/monitor success rather than infer it from manual tests.

### Stage5 — rollback if required, separate authorization

1. Restore existing API deployment configuration to captured version20, preserving
   exact original deployment ID, execute-as and access. Do not create another URL.
2. Keep compatible readers AND compatible publisher installed while the next authorized
   ordinary publication produces a FRESH legacy-format snapshot with accuracy absent.
   Verify freshness, parity and successful publication; do not clear pending state,
   suppress monitors or overwrite private registry IDs.
3. Only after legacy snapshot is confirmed, restore ONLY CloudSnapshotPublisher from
   rollback.private.gs and restore prior reader source/profile. Captured38 website
   files are byte evidence, not permission to republish expired data.
4. If restoring editor, restore only the two changed files from the captured editor
   rollback JSON after verifying no intervening owner edits. Never restore whole
   deployed-v20 project over current Form/score-sync source. Do not remove unrelated
   Week10 work. No payout/data/trigger/Form rollback is needed because none changed.

## What remains

Artifacts are staged for review, not activated. Remaining verification: owner current
23-way registry receipt (direct Sheets403). Required approvals: temporary diagnostic
if used; remote integration/push and compatible website publication; narrow publisher/
API source+version changes; accuracy activation and next scheduled publication.
No broad investigation is required unless a concrete precondition mismatch appears.
Raw artifacts are excluded from the portable restart package; keep their local
permission-restricted directory. Memory package contains the checklist and hashes.
