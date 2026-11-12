# Phase2 accuracy implementation and verification

## Approved final rule

Owner's final clarification supersedes all strict weekly-rule proposals and the
Week9 activation conflict. Preserve per-game late-entry scoring: opening game locks
one hour before kickoff, other games at kickoff, equality eligible. No Week11
policy, new activation boundary, point removal, deadline/Form/trigger change.
Owner attests the same23-player roster since Week1, no joins/withdrawals. Historical
local approvals and capture aliases matched23 unique approved identities/aliases.
The actual opt-in provider checks full registry/approved identity correspondence
before producing corrected data; current live registry was not accessed here.

## Correction and protected invariants

Root cause: weekly scoring counted only selected eligible FINAL picks; aggregation
summed those player-specific denominators. Missing picks/weeks and late games
therefore inflated accuracy. New ROSTER_FINAL_V1 is generated and validated in the
authoritative projector, independently of the original scoring/qualification tables.
See [contract and architecture](../architecture/ROSTER_ACCURACY_V1.md).

Original core tables remain auditable and frozen. snapshot.accuracy records complete
approved roster membership and authoritative FINAL counts per week. Shared derivation
applies period/covered-week counts to API/static models, retains original counters as
qualificationCompletedGames and totalPicks, and creates zero rows for absent roster
members. Existing points/ranks/order are preserved or projection fails closed.
Monthly decisions and prize qualification use original records before derivation.

The new data format is opt-in, not active in production: accuracyRules ROSTER_FINAL_V1
and rosterFromWeek1 true in reviewed server-private config. No private configuration,
API deployment, production snapshot or original PP3 endpoint was changed locally.

Pinned historical evidence: bff774117824e0de752c1095f2e0b3a14e21eac6 snapshot,
SHA256 ae42e71f94331199eb678d67baade8f26148e19f722a3db7926b29519034e2f9.
Tests load immutable Git evidence, allowing later normal snapshot refreshes without
silently changing the baseline. No original artifact is overwritten, renewed or used
as a fresh live publication. historicalEqual and protected-result comparators remain
unchanged, including Weeks1–8/M1/M2 guards.

| Historical November8 display | Before | Derived correction |
|---|---|---|
| Isaias season | 76/127,59.8% | 76/128,59.4%; qualification count127 retained |
| Pancho R. season | 76/128,59.4% | 76/128,59.4% |
| Isaias Week9 | 6/6,100% | 6/7,85.7%; points6 unchanged |
| Running Month3 | Per-player6 or7 FINAL picks | All roster members7 FINAL games |

The owner's later83/135,61.5% versus83/136,61.0% example becomes83/136,61.0% for both
under the approved136-game scope. That later/current production capture is unverified.

Historical test asserts exact unchanged core snapshots after removing only the new
metadata, exact original bytes, exact monthly decisions/prizes, exact UI prizeViews,
resolutions and matchup outcomes, and equal name/points/rank sequence for every
existing weekly/monthly/season row. Original historical guard still passes. An
all-absent roster can show correct denominators without qualifying a new champion.
Added zero rows preserve existing shared ranks; they do not invent accepted entries,
predictions or eligible votes. Known invalid candidates retain existing rejection
semantics and earn no new points; unknown cutoff/score evidence remains fail-closed.
Only FINAL statuses count; elapsed kickoff, postponed/canceled or scheduled status
cannot manufacture a completion. Unsupported source statuses keep existing rejection.

## Files changed

Authoritative/contract and adapters:
- tools/scoring/roster-accuracy.cjs (new)
- tools/scoring/late-entry.cjs (add independent FINAL count; existing scorer unchanged)
- tools/projector/project-competition.cjs
- tools/contracts/live-contract.cjs
- tools/api/legacy-provider.cjs
- tools/api/browser-client.cjs
- tools/presentation/contract-dashboard.cjs
- tools/snapshots/schema.cjs
- tools/snapshots/retention.cjs

Website: website/index.html and website/app.js.
Tests: tests/accuracy-roster.test.cjs, tests/accuracy-browser.test.cjs,
tests/support/accuracy-history.cjs (new immutable-history helper).
Architecture: docs/architecture/ROSTER_ACCURACY_V1.md.
Memory: START_HERE.md, PROJECT_HISTORY.md, EVIDENCE_INDEX.md, RESEARCH_STATUS.md,
AGENT_HANDOFFS.md, CHANGELOG.md, SYNC_STATE.json and this report.
Supporting memory tool: tools/memory/checkpoint.py and docs/memory/RESTART_WORKFLOW.md;
validator now checks a boolean rather than forcing the initial Phase1 approval false.
No apps-script/src, production public-data, private config, workflow or trigger edits.

## Fairness notice and compatibility

Near Submit Picks/deadline, with Guide link:

Late Picks & Fairness

If you submit picks after a game's cutoff, that game earns zero points—even if you
select the winning team. Picks for games that have not reached their cutoff remain
eligible.

The week's opening game locks one hour before kickoff. All other games lock at their
scheduled kickoff.

Missed and late picks count as incorrect when calculating accuracy.

Notice and corrected Guide accuracy copy are gated on negotiated per-game scoring
and ROSTER_FINAL_V1. Old payloads keep their original tooltip/accuracy semantics;
new clients accept both formats. Unknown/malformed versions, wrong counts, incomplete
or duplicate rosters are rejected. Public remapping includes all roster references.
API/static weekly parity and static running-period derivation are tested. Existing
coveredWeeks disclosure, freshness/expiry checks, source timestamps, historical
freezes, privacy allowlists and cache intervals are retained. New metadata changes
stableContent, avoiding an unchanged-publication skip on activation. No cache clear,
trigger reset or expiry extension was performed. No persistent player cache added.

## Verification record

New regressions:9 unit/integration tests plus1 browser test. Cases include correct
and wrong picks, blanks/invalid candidates, partial FINAL results, whole-week and
whole-roster absences, zero-point ranks, equal-point different-history participants,
exact/one-second-after cutoffs, protected replacements, kickoff changes, unknown
schedule evidence, nonfinal/canceled/postponed counts, all scopes/running scopes,
historical Weeks1–8, qualification isolation, complete23-person provider registry,
old/new payload parity/remapping/expiry and malformed metadata rejection.

Initial red test reproduced missing-week failure. First full run415 tests had one
legacy owner RPC failure (414 passed); conditional loading fixed it, dedicated RPC
suite12/12 passed. Subsequent full run416/416 passed. After immutable-fixture and
malformed-metadata hardening, final targeted contract/projector/accuracy suite70/70
passed. Final full416/416 passed,0failed/skipped, including the Git-pinned fixture and
all5 browser widths. See the latest AGENT_HANDOFFS.md entry.
Five-width standalone Chrome test360/390/430/768/1440, cold+repeat, passed with zero
API requests/runtime errors and no overflow; inspected notice, overview leaders,
player cards, matrix and season accuracy. Existing full-suite responsive/privacy
checks also pass. Browser checks are local frozen-clock historical replay, not live.

Ephemeral logs (not committed): /tmp/pp-accuracy-red.log,
/tmp/pp-accuracy-full.log, /tmp/pp-accuracy-full-final.log,
/tmp/pp-accuracy-unit-final.log, /tmp/pp-accuracy-contract-final.log,
/tmp/pp-accuracy-browser-final.log, /tmp/pp-accuracy-verified.log.
Generated pre-existing public/verification packages and seals were preserved before
test staging and are restored byte-for-byte after validation; test artifacts remain
separate under ignored tmp/. No private evidence was exported to the restart package.

## Deployment plan — separate authorization required

1. Review this source, pinned hashes, exact release commit, logs and unchanged
   protected results. Obtain explicit scope approval for any fresh bounded live
   registry/source/API reads; verify current registry23 and aliases without export.
2. Under separately approved read scope, capture current installed API/publisher
   bytes, deployment metadata, approved private config, public artifact and rollback
   hashes privately. Compare against local generator before preparing exact upload
   deltas. Preserve source-specific fixes not present in repository; do not replace
   live files wholesale with a generic disabled template.
3. Prepare and review compatible frontend/static-reader and publisher-validator
   artifacts FIRST, keeping accuracyRules absent. Validate they consume current old
   payloads and preserve source grants, registry, private properties and existing
   timer. No initializer, trigger reinstall or new deadline needed.
4. After explicit push/publication approval, release those compatible readers using
   the existing reviewed Pages profile. Do not dispatch synthetic over a live site.
   Verify exact deployed bytes, old-data display, health and responsive behavior.
5. Separately approve the narrow additive API module update and private config
   accuracyRules:'ROSTER_FINAL_V1', rosterFromWeek1:true. Keep LATE_ENTRY_V1,
   existing identity/closure/disclosure authority and all original writer functions.
   Recheck the actual23-key registry; mismatch must stop activation. No legacy PP3
   endpoint migration, Form edit or trigger/score synchronization action.
6. Generate a NEW derived snapshot from fresh validated source with existing public
   IDs. Never republish this expired November8 test capture. Keep original snapshots
   and qualification tables/hashes. Compare points/ranks/champions/prizes/tiebreaks,
   per-game eligibility, accuracy/coverage and privacy between API/new static artifact.
   Require historicalEqual success; do not suppress it or monitoring failures.
7. Obtain final artifact publication approval, publish via the existing static
   workflow/publisher, verify exact bytes/cache transition and public views, then
   observe the existing scheduled publisher/monitor. No broad cache rebuild or
   score-write function. Record actual status rather than assume trigger success.
8. Rollback: restore reviewed prior reader/API/publisher artifacts and prior config
   flag state, preserving all response data/deadlines/triggers. Disable only the new
   feature through a separately approved config reversal. Do not extend old expired
   snapshot validity or clear private registry state to force rollback.

Exact live upload/dispatch commands are intentionally not fabricated: current live
source/deployment/publisher identity and approved release artifacts have not been
verified in this local-only task. The plan above defines the concrete order and
required invariants; actual commands must reference owner-reviewed fresh artifacts.
