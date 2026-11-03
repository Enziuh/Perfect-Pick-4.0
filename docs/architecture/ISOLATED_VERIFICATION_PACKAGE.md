# Isolated verification package — preparation only

Status: local package built and checked; diagnostic DISABLED; NOT approved for
upload, OAuth authorization, Apps Script execution, deployment or a real read.
Use with FIRST_LIVE_VERIFICATION.md. No production resource was accessed/changed.

## Exactly two files

Run `node tools/verification/package.cjs stage` to reconstruct the ignored local
`.verification-package/` folder. It contains only:

- Verification.gs: the reviewed contract, projector/monthly decision, range reader,
  timestamp parser, explicit owner-evidence builders, data-only redacted report,
  and disabled diagnostic. No legacy source, tests, fixtures, private configuration
  or Node/filesystem tooling is included.
- appsscript.json: explicit spreadsheets.readonly scope only, V8, reference Pacific
  timezone, exceptions not logged, and only the Sheets v4 advanced service. No webapp,
  executionApi, libraries, add-on or anonymous endpoint configuration.

A Sheets API namespace includes write methods, but the package never calls them;
its manifest requests no write permissions. Read/projector/evidence/report modules
are enclosed in a private package scope: no global create/read library API is
exported. The sole exported capability is the permanently disabled diagnostic. OAuth is an additional boundary, not
proof that an arbitrary injected implementation is harmless. The actual account's
existing grants and remote project still need owner inspection.

Verify with `node tools/verification/package.cjs verify`. The external ignored
`.verification-package.seal.json` seals the exact bytes. Verification checks the
exact inventory, source assembly, manifest and scope, source-path symlinks, forbidden
capabilities, endpoint/credential patterns, and known current/historical private
identifiers without logging their values. Unexpected files, private target config,
archives, maps, directories and symlinks fail closed. Do not add configuration to
this directory. Rebuilding replaces the local review artifact and requires renewed
byte review; it never uploads. Do not rebuild/modify a verified future upload
artifact after approval. Protect builder/source/test reviews: scanning is defense
in depth, not protection against every malicious source modification.

The package is outside apps-script/src and outside the unchanged six-file Pages
allowlist. Both generated directory and seal are Git-ignored. Reproducible source,
manifest template and checks are tracked; private target/configuration are not.
This is an independently assembleable Apps Script project payload, not an enabled
live service. It has no clasp configuration, upload command or deployment workflow.

## Disabled diagnostic and strict exclusions

The sole top-level diagnostic is verifyPerfectPick4Package_(). It always delegates
to the existing no-capability disabled entry and returns only DISABLED with the
fixed authorization/isolation-required reason. No flags, passed callbacks, owner
claims, global configuration, Script Properties or target IDs can enable a read.
The underscore is a convention, not the authentication mechanism; absence of a
read capability is the current safety boundary.

No doGet/doPost, onOpen/onEdit/onFormSubmit, score synchronization/backfill,
ensure-columns/setup/seeding, Form automation, trigger installation, prize
migration, Drive access, logging or external-request capability is assembled.
SpreadsheetApp, FormApp, ScriptApp, PropertiesService and UrlFetchApp calls are
excluded. Only the injected read adapter and pure calculations are present.
VM tests deny native services, writes and network/logging attempts. They execute
local JavaScript, not Apps Script or OAuth. Actual V8/Intl parity remains unverified.

## Target assessment — partial local verification only

`node tools/verification/package.cjs target` reads the existing ignored local
linkage and local Git history, without running clasp or contacting Google. It
returns statuses only, never an identifier or identifier digest.

VERIFIED locally for this task: configuration exists, is ignored/untracked, and
its target differs from the historical imported 3.0 target. Remote identity is
OWNER_CONFIRMATION_REQUIRED, and readyForUpload is always false. A different ID
cannot prove it is the intended standalone Perfect Pick 4.0 API project. No target
linkage is copied to the package or created by this tool. Missing/malformed,
tracked, unignored, legacy-equal or unverifiable history fails target assessment.
The generic package can be checked in CI without a private target file; its safety
never depends on assuming a particular ignored local identifier is correct.

Owner must privately compare the intended 4.0 project's Project Settings identifier
with the local configuration, confirm the account/project name and independence
from 3.0, and inventory editors, existing versions/deployments, bound resources,
triggers, libraries and old source. Do not print, screenshot into Git or paste the
identifier into this checkpoint. If legacy/public/write code remains in that
remote project, STOP; do not overwrite/delete it or deploy this package on top.
A clean-package manifest does not remove unsafe pre-existing deployments/triggers.
No remote inspection or setting change is authorized/performed by this task.

## Owner-controlled next steps — no implicit authorization

1. Review these two exact local files, hashes/seal and passing test evidence. Do not
   use the copied apps-script directory as an upload root. Keep the real-read entry
   disabled. Confirm the separate 4.0 identity and remote isolation privately.
2. Obtain NEW explicit approval for any future upload and synthetic-only runtime
   test, separately from OAuth authorization or real data access. No such command
   or operation is part of this package-preparation task. An owner-only editor
   diagnostic is intended, never an anonymous web app or API executable deployment.
3. Before any authorized import, inspect the exact manifest and actual project's
   requested/effective permissions in the owner UI. The only requested scope must
   end spreadsheets.readonly; reject full spreadsheet, Drive, Forms, external-
   request, trigger-management or unrelated scopes. Inspect stale prior grants;
   do not automatically revoke/change production grants. No authorization flow was
   started here. Test fabricated cases in the isolated runtime before a real read.
4. Determine actual column coordinates privately by viewing existing headers only,
   without editing cells, tabs, formulas, formatting or Forms. Select the bounded
   Results/Responses fields listed in FIRST_LIVE_VERIFICATION.md; do not export
   rows or assume fabricated example letters match production. Confirm source
   timezone and identity normalization, not guessed locale/date conversions.
5. Establish independent credible revision/completeness/quiescence evidence or an
   explicitly approved immutable capture. Bounded repeat reads and guard rows do
   not prove atomicity/ABA safety; a constant counter, guessed row count or fresh
   timestamp is not sufficient. No revision columns, metadata writes, copied tabs,
   changed formulas or paused triggers are permitted to manufacture authority.
   If source authority cannot be established read-only, keep real verification
   blocked and ask for a separately reviewed capture plan.
6. Separately approve complete alias mappings, authoritative weekly CLOSED history,
   accounting/completion evidence and comparison oracles. Keep all private values
   outside Git, this package, public artifacts and logs. There is intentionally no
   shipped config stub, automatic Script Properties lookup or request-based override.
   Future real-read activation/configuration requires a separate code and security
   review; importing this disabled package cannot activate it.
7. Only after those gates, NEW authorization may cover the precise bounded real
   read. No first real read is automatically authorized by this document, package,
   successful diagnostic, explicit scope or passing offline test.

If any gate fails, retain the disabled diagnostic and synthetic Pages, discard
private in-memory data, and record only non-identifying blocker/check outcomes.
Production needs no rollback because no writes are permitted. Any verification-
only grant/private assembly cleanup needs separate owner approval; never change
3.0 grants/resources, rewrite history or rotate credentials automatically.

Open blockers: remote target/owner isolation, effective scopes, actual runtime and
column/timezone parity, capture revision/completeness authority, approved aliases,
historical closure, accounting/oracle evidence, and the future frontend CLOSED-but-
withheld disclosure gap. This package resolves none by assumption.

Official manifest references reviewed (documentation only):
[Manifest structure](https://developers.google.com/apps-script/manifest),
[Advanced-service dependencies](https://developers.google.com/apps-script/manifest/dependencies),
[Explicit narrow scopes](https://developers.google.com/apps-script/concepts/scopes).
