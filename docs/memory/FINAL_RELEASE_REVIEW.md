# Perfect Pick4.1 accuracy release — final owner review

## Status and authorization

Source checkpoint609e259; clean starting develop. Memory/package verified. Owner
reported VERIFIED registryPlayers23,approvedAliases23,oneToOne true,writes0. Accepted
as completed owner verification, not rerun. Refreshed original editor source contains
neither diagnostic nor logging wrapper; editor files match prior capture exactly.
Production API remains v20; no accuracy flags, source updates or publication applied.

Owner requires explicit final review before automatic deployment. Accordingly all
release stages are prepared/tested locally; compatible website publication, live
publisher/API update and activation remain pending final approval. No fetch, merge,
push, deploy, Form/Sheet/trigger/ESPN or private production configuration write.
Existing read-only API GETs were used for fresh source evidence; no diagnostic,
setup, score-write, trigger or cache-write function was invoked.

## Exact release artifacts

Under ignored tmp/accuracy-release-final/ (private source/config files stay local):

- current/: refreshed APIv20, current editor/publisher, deployment/rollback metadata,
  public baseline, private source capture. No source baseline was overwritten.
- staged/website-compatible/ and sibling seal: compatible readers with unchanged
  current production snapshot, no flags active.
- staged/PerfectPick4_Json.compatible.private.gs and00_Config_Setup.route-compatible.private.gs:
  narrow compatible API module/route patch, existing deployed config and all unrelated
  editor files preserved. Full candidate is api-compatible-project.private.json.
- staged/PerfectPick4_Json.activate.private.gs and api-activate-project.private.json:
  same release, only adds accuracyRules ROSTER_FINAL_V1 and rosterFromWeek1 true.
- staged/CloudSnapshotPublisher.compatible.gs: dual-compatible validator/reader with
  already-tested fallback propagation fix ef5300f. Preserve all Properties/IDs/timers.
- staged/API editor/deployment and publisher rollback files: refreshed source/metadata.
  Local restoration and legacy weekly/overall/prize VM parity pass.
- accuracy-candidate-v2/:38-file EXACT proposed accuracy website artifact; sibling
  .seal.json hashes every file. Source/scoring proof timestamps are not renewed.
- candidate-v2-receipt.json, candidate-v2-browser.json/log, full-tests.log,
  current/source-api-for-candidate-v2.private.json and
  current/source-for-candidate-v2.private.json: private verification evidence.

[Sanitized final manifest](release/ARTIFACT_MANIFEST.json) records source/artefact
hashes, counts, protected-result checks and the prior preparation manifest.
Private artifacts are not embedded in the portable restart package.

Final snapshot SHA256:
`eced05a40d618e0006aff7f0030c6c3504246f63c8796e93e7c1fb7fe82f5b35`

Source generated2026-11-12T20:00:44.595Z; expires2026-11-13T02:00:35.228Z
(Nov12,6:00:35PM PST). Validate actual freshness before publication; regenerate from
fresh read-only source if stale or scope/results have changed. Never extend expiry.
This is LOCAL regeneration only; repository public-data/snapshot.json and live public
snapshot remain unchanged. No production configuration was activated to build it.

## Coverage/order compatibility caught and resolved

APIv20's explicit season scope is Weeks1–9. Existing installed publisher fallback
uses created-week scope through10; since10 is withheld its static season is a running
Weeks1–9 aggregate. Current source and public baseline agree per-player, but order
within shared ranks differs between the old API's table and static running table.
The initial local v1 candidate accidentally followed direct API geometry, changing
static tied-row order. It is superseded and MUST NOT be published.

V2 mirrors the existing publisher's explicit scope from the current published
baseline, not eligibility inferred from submissions. Source proof/game/pick data is
unchanged. The original API-scoped DTO is retained separately for parity/audit.
Core season state/coverage is reconciled using existing verified weekly availability,
then the unchanged public contract validates it. No new scope, disclosure permission
or scoring rule is introduced. Future actual publisher uses its unchanged native
context/created-week scope. If that scope changes before execution, refresh/review
rather than silently reuse this pinned candidate.

V2's entire original aggregateStandings, monthly decisions and prize records exactly
match CURRENT public baseline values and ordering. API/static arithmetic compares
identities within available/covered scopes, not private/public-ID tied display order.
Existing API scope/privacy limitations remain; this release does not expand raw API
closure grants. The native website publisher continues its existing authorized scope.

## Verified examples and safeguards

| Case | Before | After |
|---|---|---|
| Fresh source Isaias | 83/135,61.5% | 83/136,61.0% |
| Fresh source Pancho R. | 83/136,61.0% | unchanged83/136,61.0% |
| Pinned November8 Isaias | 76/127 | 76/128 |
| Pinned November8 Pancho R. | 76/128 | unchanged76/128 |

All23 current roster members have136 FINAL season games. Original submitted/eligible
FINAL counters remain distinct and preserved. Existing per-game eligibility/picks,
points, exact current static rank/order/shared ranks, monthly/weekly outcomes,
champions, predictions/tiebreaks, prizes and qualification records are unchanged.
HistoricalEquality passes; original immutable evidence/hashes remain unchanged.

Missing/blank/late entries and full missed weeks are covered in synthetic regressions;
no fabricated real submission was added. Original all-missing monthly qualification
still yields no new champion. Games not FINAL do not manufacture a completion.
Opening game locks one hour before kickoff; other games at kickoff, equality remains
eligible. No strict all-week/Week11 policy. This follows the final per-game
clarification and preserves existing late-entry settings/earned points.

Fairness notice is present in exact staged UI: late locked games earn0 even for
winning selections; future unlocked games stay eligible; missed/late games count
against accuracy. No Form instructions or deadline/closing automation changed.

## Tests actually completed

- Full suite417/417 PASS,0fail/skip: regression, contracts, snapshot/schema,
  historical preservation, privacy/security, compatibility, rollback/fallback and
  browser tests. Includes known76/127→128 and same136 denominators, blank/late/missing
  week examples, point/rank/qualification/tiebreak/prize invariants.
- Exact final V2 production-facing artifact:360/390/430/768/1440, cold+repeat PASS.
  Fairness notice, player cards, matchup missed indicators, season table136 for all23,
  zero API requests/runtime errors and no overflow.
- Fresh API/static weekly/available monthly and season calculations match by player;
  static running-period calculations match the same covered weekly API inputs.
  Comparison uses original capture clock, never re-labels evidence as fresh.
- Current public core table/month/prize comparison EXACT; stable source before/after
  scoring records, IDs/aliases, core counters, qualified winners and tiebreaks exact.
- Updated rollback byte restoration and legacy endpoint VM comparison PASS.
- Pre-existing generated public/verification packages and seals restored byte-for-byte
  after tests. No raw private data entered tracked files or public staged payload.

## Actual changes and next stages

No application source changed in this final-review turn; existing implementation
commits96f1663,73698e4,e64f28e and publisher fix ef5300f are the reviewed release code.
Only memory/handoff/manifest records change locally. Fresh artifacts/logs are ignored.

After explicit approval, follow [staged release actions](PRODUCTION_RELEASE_PREPARATION.md)
with these updates: registry gate is complete; do not rerun/install diagnostic; use
fresh tmp/accuracy-release-final/ artifacts and V2 candidate, not prior v1 or expired
preparation snapshots. Remote18 snapshot-only commits still require approved fetch/
merge preserving history before push. Stop if actual remote changes differ.

Approval must explicitly cover compatible reader/publisher/API source publication,
then two-field activation and the existing clock's regeneration/publication. Push is
not assumed inert because the existing publisher can dispatch Pages. No user-facing
production step has been executed yet. Existing deployment URL/access/identity,
Form/Sheets schema/football automation, registry IDs and Properties must stay intact.

Rollback: restore captured API deployment v20 first; KEEP dual-compatible readers
and publisher until a fresh legacy-format snapshot is confirmed, then restore the
captured publisher and previous readers. Restore only the two changed editor files
if needed, respecting intervening edits. Never roll back live data, reset registry,
change triggers/deadlines, or republish an expired snapshot. Local rollback exactness
is tested; no live rollback was executed.
