# Start here

Read [AGENTS.md](AGENTS.md) first. Then read [research status](RESEARCH_STATUS.md),
[sync state](SYNC_STATE.json), and the latest [handoff](AGENT_HANDOFFS.md).
Use [evidence index](EVIDENCE_INDEX.md) and [history](PROJECT_HISTORY.md) for provenance.

## Current authorization

Week10 metadata-only diagnostic READY LOCALLY FOR OWNER REVIEW;NOT installed/run.
[Safety review and exact steps](docs/memory/WEEK10_METADATA_DIAGNOSTIC_REVIEW.md).
Tool/static-test commit248db91. NEW pp4InspectWeek10DisclosureMetadataOnce uses bounded
Week10 header/Results/control metadata only;no context/registry/config/network reads.
Old Week10DisclosureReadOnly.gs remains BLOCKED.13focused testsPASS(7newstatic).
No production calls or remote Git operations. Existing layout fix b9c43b1 preserved;
accuracy deployment remains complete. Next boundary:owner review,one-time install/run
in existing PRIVATE publisher,share only sanitized JSON,remove only temporary file.
Matching metadata returns INSUFFICIENT_EVIDENCE;never broaden reads without approval.

## Repository map

- website/: frontend and synthetic preview.
- apps-script/src/: imported backend reference; not proof of installed source.
- tools/: API packaging, read-only projectors, scoring helpers, static publishing,
  contracts and security/verification tools. Inspect dependencies before changes.
- public-data/snapshot.json: committed public snapshot; not proof of current runtime.
- tests/: offline and browser checks; deployment workflow runs Node tests.
- docs/: architecture, migration, performance and operations evidence.
- .github/workflows/pages.yml: manually dispatched publication profiles. Do not run.
- Ignored backups/, tmp/, private linkage and generated packages: preserve locally;
  never bulk-copy into Git or a restart package.

README.md and PROJECT.md are empty legacy placeholders, intentionally preserved.
Existing progress documents contain superseded instructions. Resolve conflicts by
provenance and date; mark uncertainty rather than following an old resume command.

## Checkpoint cadence and synchronization

Checkpoint after 3–5 substantial commits, major decisions, phase transitions, and
before new AI-agent sessions. Recheck Git status; inspect changes before editing.
Update status/evidence/handoffs and append changelog entries. Stage named files only.
Create focused commits; create/verify the restart package from a clean committed tree.
Keep local checkpoint, remote synchronization, and deployment status separate.
Never auto-fetch/pull/merge/push or dispatch workflows. Remote sync requires separate
authorization; compare refs first and stop on divergence without resetting history.

Tool usage, integrity limits and restoration: [restart workflow](docs/memory/RESTART_WORKFLOW.md).
That reference is installed in the separate Phase 1 tooling stage.
