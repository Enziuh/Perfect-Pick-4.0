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
