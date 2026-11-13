# Stage2 compatible website — approval review only

## Verified checkpoint

Starting9b3462061644aafc40b72f4191ea8d722c42e062, clean develop. Integration merge
0a13035 has local6dd89d4 and remote28ff44c as parents. All19 Stage1 remote commits
changed only public-data/snapshot.json. Working snapshot hash matches Stage1 receipt.
Local tracking status17ahead/0behind is correct for origin/develop28ff44c; it is NOT
current remote status. Memory/package validation passed. No investigation repeated.

## Current remote and freshness

GitHub GET-only review on2026-11-13 found remote
f6d7cc7e26f77edede3577aa3178c38a7a61ecff, FIVE commits beyond fetched28ff44c. Each was
individually inspected and changes only public-data/snapshot.json; no unexpected
remote code/config/workflow changes. No fetch or merge was performed in this review.
Latest successful Pages run43442108638 matches that tip (2026-11-13T14:24:21Z).

Stage1 working snapshot and both older release artifacts are EXPIRED and must not be
published or have proof timestamps renewed. Current remote/live snapshot:

- Generated2026-11-13T14:22:16.712Z; expires2026-11-13T20:22:01.684Z
  (Nov13,12:22:01PM PST).
- SHA256 db41a4ff7245d011d25372b0167ab3453751808cfa47f161abb09e1fd2972ad4.
-23 approved IDs/aliases preserved; frozen Weeks1–8/M1/M2 equality passes.
- No ROSTER_FINAL_V1 metadata. No source flags set by this operation.

Prepared tmp/stage2-publication-review/website-compatible/ with38 files and sibling
seal from this EXISTING snapshot. Staged JSON is byte-identical to downloaded remote
JSON: no production snapshot was regenerated. Exact artifact/schema/privacy/freshness
checksPASS;34 targeted testsPASS,0fail/skip. Chrome390/1440 cold+repeatPASS: legacy data
loads, old counter semantics preserved, no API calls/runtime errors/overflow; corrected
accuracy notice stays gated until the separately approved data activation.

GET-only capture of CURRENT38 public files is at rollback-public/ with sibling seal.
Its snapshot matches remote hash above. Raw artifacts remain ignored/local.

## Exact Stage2 actions — pending separate owner approval

This task's Stage2 means WEBSITE ONLY. The older release document's section named
Stage2 installs an Apps Script publisher; that is NOT authorized by this website
stage. No Google source/config/API update or accuracy activation is included here.

1. Recheck clean tree and current remote immediately before executing. If reviewed
   remote tip changed, inspect/revalidate before integration; stop on code changes,
   conflict or stale data. Owner approval must include the new snapshot-only merge:

```
git fetch origin develop
git log --name-only --format='%h %s' 28ff44c5a206d885ac2be051336ad3f727f7edfe..origin/develop
git diff --name-only 28ff44c5a206d885ac2be051336ad3f727f7edfe..origin/develop
git merge-tree --write-tree HEAD origin/develop
git merge --no-ff origin/develop -m 'Integrate current snapshot for compatible website publication'
```

Expected reviewed tipf6d7cc7; only snapshot data may change. Never force/reset. Verify
new working snapshot equals fetched remote bytes, both histories remain ancestors,
and source/23-ID/privacy/frozen-history/freshness checks pass. Do not publish a stale
snapshot or generate replacement scoring data as part of this stage.

2. Validate exact static build locally in a separate ignored staging directory or
   preserve existing generated packages before using the normal staging command.
   Repeat the targeted checks as necessary:

```
node --test tests/accuracy-release.test.cjs tests/cloud-snapshots.test.cjs tests/accuracy-roster.test.cjs tests/deadline-disclosure.test.cjs tests/source-rollover.test.cjs tests/week10-readiness.test.cjs
```

CI builds/seals the real static profile and runs its full suite. The observed snapshot
must still be fresh through publication; otherwise wait for/read the existing
publisher's ordinary fresh output and review/stage that unchanged file. Do not alter
expiry or invoke production regeneration functions under Stage2 approval.

3. After explicit push AND compatible website publication approval:

```
git push origin develop
gh workflow run pages.yml --repo Enziuh/Perfect-Pick-4.0 --ref develop -f profile=static
```

The existing publisher can dispatch Pages too: push is not promised inert. Never
select synthetic profile. If push is non-fast-forward, STOP/review fresh remote,
never force. Track the resulting exact commit/run; read-only status commands:

```
gh run list --repo Enziuh/Perfect-Pick-4.0 --workflow pages.yml --branch develop --limit 5
gh run watch <RUN_ID> --repo Enziuh/Perfect-Pick-4.0 --exit-status
```

4. Verify successful verify/deploy jobs, exact live asset bytes/valid fresh data,
   desktop/mobile behavior, old payload compatibility and accuracy NOT activated.
   Stop before publisher/API updates, config flags or new scoring/snapshot generation.

## Stage2 rollback boundary

Current deployed files are captured/sealed under tmp/stage2-publication-review/
rollback-public/. Prior source reference is remote f6d7cc7; hashes are evidence, not
permission to republish its snapshot after expiry. Keep current valid snapshot data
and all newer automated commits. Restore prior reader SOURCE in a new focused revert
commit (including its related code/tests as needed), verify, then use the same static
workflow under rollback approval. No shared-history reset or force-push. Preserve
historical docs and record rollback rather than deleting audit evidence.

No API, publisher, configuration, Form, trigger, scoring or ESPN rollback is required
for WEBSITE-ONLY Stage2. The fuller APIv20 rollback procedure remains for separately
approved later stages. If newer code changes make the reader revert conflict, stop
rather than overwrite unrelated work. No rollback was executed during this review.

## Handoff

Stage2 review is prepared. Only memory records changed; application source and
public-data/snapshot.json untouched. No fetch, merge, push, deploy, publication,
ROSTER_FINAL_V1 activation or production data/config/source write. Next approval is
for snapshot-only reintegration plus push and compatible STATIC WEBSITE publication
ONLY. Current copied artifact expires at the time above and must be revalidated.
