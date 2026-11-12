# Start here

Read [AGENTS.md](AGENTS.md) first. Then read [research status](RESEARCH_STATUS.md),
[sync state](SYNC_STATE.json), and the latest [handoff](AGENT_HANDOFFS.md).
Use [evidence index](EVIDENCE_INDEX.md) and [history](PROJECT_HISTORY.md) for provenance.

## Current authorization

Owner approved local scoring/accuracy work and confirmed the same roster since
Week1, with no joins/withdrawals. Owner selected Week9 as strict weekly-rule origin.
Preflight found a protected-result conflict: applying that rule to captured Week9
entries removes48 earned points and changes13 weekly ranks. Read
[activation conflict](docs/memory/WEEK9_ACTIVATION_CONFLICT.md). Stop until an explicit
grandfather/prospective enforcement boundary resolves this conflict. No application
edits made. No push/deployment/live Apps Script/Form/data/automation changes authorized.

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
