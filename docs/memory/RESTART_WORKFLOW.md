# Checkpoint and restart workflow

Use Python3; no new dependency. Run from an existing project checkout:

```
python3 tools/memory/checkpoint.py validate
python3 tools/memory/checkpoint.py build tmp/memory-restart/checkpoint.zip
python3 tools/memory/checkpoint.py verify tmp/memory-restart/checkpoint.zip
```

Build requires a clean committed tree and refuses to replace the archive. Use a new
filename for each checkpoint. Keep archive and adjacent receipt together. Compare
the receipt SHA-256 through a trusted separate channel when transferring. Hashes
detect byte changes; someone replacing archive and receipt can forge both. No
cryptographic signature, secret scanner or full-history security audit is claimed.

## Scope and restoration

The package explicitly includes the seven memory documents, AGENTS.md, this workflow,
the memory tool, tracked docs/*.md recursively, the optional explicitly allowlisted
docs/memory/release/ARTIFACT_MANIFEST.json (sanitized hashes only), and the Pages
workflow as reference. No other JSON evidence or private artifact is swept in.
MANIFEST.json records exact paths, SHA-256 and finalized commit. The external receipt
records archive hash and commit, avoiding self-reference. Build verifies restoration
in a fresh temporary directory. It does not overwrite an existing checkout.

This is a portable continuity package, NOT a full source backup, Git bundle or
runnable application. Git history has not been exhaustively audited for secrets;
therefore it is excluded. Obtain the corresponding source checkout separately under
owner authorization, compare its HEAD with the receipt, run validation, and compare
memory bytes before copying anything. Never extract over unrelated working changes.
All original history remains in the existing repository. Supporting documents can
reference source/private artifacts absent from this package; those require the
original checkout/private environment. Archived workflow text must never be installed
or dispatched automatically.

Excluded: .git/, application/backend source, public JSON/player data, credentials,
.clasp.json, environment files, private configuration, raw responses, private mappings,
ignored evidence, backups/, tmp/, generated upload/publication packages and seals,
non-Markdown measurements and external temporary logs. No ignored artifacts are read
or exported. Documentation can contain historical public identifiers/URLs; this is
not a claim that every historical document has undergone a fresh privacy audit.
Keep packages local/private unless separately reviewed for sharing.

## Synchronization and integrity

Checkpoint after 3–5 substantial commits, major decisions, phase transitions, and
before new agent sessions. Inspect status/diffs, update evidence and handoff, append
changelog entries, validate, stage named files, commit, then build and verify.
Do not fetch/push/merge/deploy without separate authorization. Remote and runtime
status remain unknown until independently checked under authorized scope.

Compare existing tracked file hashes against the pre-session baseline, allowing only
explicit intended edits. Preserve prior AGENTS.md bytes as an exact prefix. Verify
append-only files retain earlier content as a prefix; corrections use new entries.
On future checkpoints, compare against the previous trusted checkpoint commit.
Review staged diff and whitespace checks before commit. Keep the generated receipt
outside the committed checkpoint; no document can contain its own final commit hash.

## Reusable restart prompt

> Read AGENTS.md and START_HERE.md, then verify SYNC_STATE.json against Git and the
> restart manifest/receipt. Review RESEARCH_STATUS.md and the latest AGENT_HANDOFFS.md
> entry. Report discrepancies before editing. Treat historical runtime claims and
> approvals as historical evidence. Preserve unrelated changes and private artifacts.
> Continue only within the currently approved phase. Phase2 requires separate owner
> authorization. Do not fetch, push, merge, deploy, or modify production services
> without separate approval.

## Authorization metadata maintenance

The integrity validator checks that phase2Authorized is a boolean; it does not force
it false. Record the current owner-approved scope in SYNC_STATE.json and handoffs.
Validation is an integrity check, not authorization to execute commands or deploy.
The initial false-only check was specific to Phase1 and is superseded here.

Workflow/job decimal identifiers are not treated as abbreviated Git hashes during
reference validation. Full40-character hashes and hexadecimal abbreviations with
letters still resolve against local Git. This permits recording real workflow IDs.
