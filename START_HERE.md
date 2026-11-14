# Start here

Read [AGENTS.md](AGENTS.md) first. Then read [research status](RESEARCH_STATUS.md),
[sync state](SYNC_STATE.json), and the latest [handoff](AGENT_HANDOFFS.md).
Use [evidence index](EVIDENCE_INDEX.md) and [history](PROJECT_HISTORY.md) for provenance.

## Current authorization

Consolidated WEBSITE release READY LOCALLY;STOP before push/publication/private execution.
[Exact scope,verification,rollback and owner action](docs/memory/CONSOLIDATED_WEBSITE_RELEASE.md).
557c7c8 cleanly integrates ONLY newer remote snapshot c03c053;all local fixes preserved.
38-file candidate changesONLYstyles.css;37others/snapshotBYTE-UNCHANGED.426fulltestsPASS,
12browser samples/sixwidthsPASS,privacy/parity/protected resultsEXACT. Artifact expires
Nov14 07:51:38UTC(Nov13 23:51Pacific);revalidate/restage if stale orremoteadvances.
No localLinuxruntime;newGitHubCI needsapprovedpush and existingworkflowcanpublish.
Privatepublisher0API-executabledeployments;oldtemporarydiagnosticinstalled,v2absent.
Oneowneraction:replacecontents of EXISTING temporary pp4InspectWeek10DisclosureMetadataOnce.gs
withreviewedv2,runwrapperonce,shareONLYJSON,removeONLYtemporaryfile. No newinstallation,
APIdeployment,scope/trigger/state/score/Form change. No push/deploy/publication occurred.

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
