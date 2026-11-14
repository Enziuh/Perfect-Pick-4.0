# Start here

Read [AGENTS.md](AGENTS.md) first. Then read [research status](RESEARCH_STATUS.md),
[sync state](SYNC_STATE.json), and the latest [handoff](AGENT_HANDOFFS.md).
Use [evidence index](EVIDENCE_INDEX.md) and [history](PROJECT_HISTORY.md) for provenance.

## Current authorization

CI browser-startup investigation COMPLETE;local CI/diagnostic fixes tested,not shipped.
[Exact failures,all annotations,and Week10 boundary](docs/memory/WORKFLOW_FAILURES_WEEK10.md).
One failed frontend run today had3Chrome startup failures;identical-SHA retry succeeded.
5ae7d8d serializes test files/logsChrome version;426serialtestsPASS. e4f23f8 adds safe
metadata diagnostic stage and native-compatible trimmed headers;8static safety checks.
Owner's generic diagnostic failure does not establish Week10's private source cause.
No need to send2500lines or rerun olddiagnostic. New stage-labelled source staged for
review only,notinstalled/run. Layout b9c43b1 preserved. API22/publicsnapshot remain
verified/protected;no push/deploy/state/Form/trigger/data changes. New production
integration/push/publication and any owner diagnostic execution require approval.

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
