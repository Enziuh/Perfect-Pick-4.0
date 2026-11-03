# Isolated verification package — preparation only

Current connector: implemented and offline-tested; private provider null/default
DISABLED. See final functional-native section for activation boundaries.

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

## Owner-confirmed target and isolated upload directory (later preparation)

Owner has now confirmed that the separate 4.0 project exists, its editor is empty,
and the existing local apps-script/.clasp.json targets it with rootDir src. This
is owner-provided confirmation; no remote inspection was conducted by the agent.
The prior OWNER_CONFIRMATION_REQUIRED status describes the earlier local-only
assessment, not a new contradiction of the owner's confirmation.

Prepared directory:
`/Users/manny/orca/projects/NFL-Perfect-Pick/tmp/verification-upload`

Its exact inventory is Verification.gs, appsscript.json and .clasp.json. The
existing tmp/ ignore rule excludes all three; no ignore rules were broadened. The
first two are byte-identical to the previously sealed .verification-package files.
The local .clasp.json has only scriptId (copied privately from the owner-confirmed
local configuration) and rootDir set to a single dot. Its permissions are 0600.
No identifier, config digest or private configuration is committed or printed.
The original apps-script/.clasp.json and every apps-script/src file are untouched.

IMPORTANT: rootDir is deliberately . in the isolated directory, NOT src. Do not
run an upload from apps-script/, the repository root or the sealed package source
directory. Do not copy any existing backend files, credentials, notes, tests,
private policy, spreadsheet linkage or extra assets into this upload directory.
Clasp consumes its local .clasp.json as target configuration; only the two reviewed
Apps Script project files should be sent. No clasp command has been executed.

### Exact future owner-controlled upload commands

Only after NEW explicit upload authorization and an immediate recheck of the exact
three-file inventory, matching target, rootDir dot and unchanged sealed bytes:

```sh
set -e
cd /Users/manny/orca/projects/NFL-Perfect-Pick
node tools/verification/package.cjs verify
node - <<'JS'
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const pkg = require('./tools/verification/package.cjs');
try {
  const dir = path.resolve('tmp/verification-upload');
  const allowed = ['.clasp.json', 'Verification.gs', 'appsscript.json'];
  const check = ok => { if (!ok) throw Error(); };
  check(fs.realpathSync(dir) === dir);
  check(JSON.stringify(fs.readdirSync(dir).sort()) === JSON.stringify(allowed.sort()));
  for (const name of allowed) {
    check(fs.lstatSync(path.join(dir, name)).isFile());
    const relative = path.relative(process.cwd(), path.join(dir, name));
    cp.execFileSync('git', ['check-ignore', '-q', '--', relative], {stdio: 'pipe'});
    check(!cp.execFileSync('git', ['ls-files', '--', relative], {encoding: 'utf8'}).trim());
  }
  const source = JSON.parse(fs.readFileSync('apps-script/.clasp.json', 'utf8'));
  const local = JSON.parse(fs.readFileSync(path.join(dir, '.clasp.json'), 'utf8'));
  check(pkg.inspectLocalTarget().localTarget === 'DISTINCT_FROM_HISTORICAL_LEGACY');
  check(JSON.stringify(Object.keys(local).sort()) === JSON.stringify(['rootDir', 'scriptId']));
  check(source.rootDir === 'src' && local.rootDir === '.' && local.scriptId === source.scriptId);
  check((fs.statSync(path.join(dir, '.clasp.json')).mode & 0o777) === 0o600);
  const contents = Object.fromEntries(pkg.FILES.map(name => [name, fs.readFileSync(path.join(dir, name), 'utf8')]));
  check(JSON.stringify(pkg.inspect(contents)) === JSON.stringify(pkg.verify()));
  console.log('Upload preflight PASS; target values withheld.');
} catch {
  console.error('Upload preflight FAILED; stop without uploading.');
  process.exit(1);
}
JS
cd /Users/manny/orca/projects/NFL-Perfect-Pick/tmp/verification-upload
clasp push
```

These are instructions for a FUTURE owner-authorized action, not permission to run
it now. Do not add --force, run from another directory, use deploy/run/pull, execute
the diagnostic, authorize OAuth or read data as part of that source upload. Stop
on any unexpected target, scope, file, manifest prompt or remote editor contents;
confirm what would change instead of overriding a warning. Upload authorization
does not imply execution, authorization, deployment, activation or real-read consent.

The manifest still requests only spreadsheets.readonly, with no webapp or API
execution endpoint. The disabled diagnostic has no exposed read capability even
with global config or claimed owner arguments. Remaining blockers are unchanged:
actual runtime/effective grants, independent capture/revision/completeness authority,
approved private aliases and historical CLOSED evidence, field/timezone/identity
parity, accounting/oracles and future frontend disclosure handling. No live mode.

## Owner upload ParseError correction and compatibility gate

Owner reports the source-only upload did not succeed: Unexpected token = at old
Verification.gs line 133. The exact rejected expression was
`total.hasTotals &&= row.totalPicks !== undefined`, originating from
`tools/contracts/live-contract.cjs:130`, copied by the generator. Logical assignment
is ES2021; modern Node parsed it, but the owner's Apps Script upload parser did not.

Fixed at source with `if (total.hasTotals) total.hasTotals = row.totalPicks !== undefined`,
preserving short-circuit behavior and missing-total validation. No ranks, points,
privacy rules or financial calculations change. Packaged Object.hasOwn calls were
also replaced by Object.prototype.hasOwnProperty.call in the contract/evidence
source and generated module-loader template, removing that post-2020 runtime API.
No generated file was patched independently of its originating source.

`tools/verification/gas-compatibility.cjs` now gates package rendering AND inspection
with Acorn 8.15.0 at ecmaVersion 2020 / script mode. It rejects logical assignment,
class fields, numeric separators, module syntax and other later grammar, plus an
AST check for selected post-2020 APIs. It reports only labels/line/column, not input
contents. Parser absence, wrong version or failed pinned-code integrity fails closed.

Acorn is vendored unmodified with MIT license and pinned provenance under
`tools/vendor/acorn/`; this is a development-only parser dependency. No runtime
package, Pages asset, npm install, workflow change or test-time network is needed.
It is excluded from Verification.gs. This independent grammar check supplements
Node VM tests; it does not impersonate or certify the actual Google engine.
VM regressions additionally remove Object.hasOwn, String.replaceAll, Array.at and
other selected newer built-ins while loading the disabled package and exercising
the fabricated reader/projector pipeline.

Regenerated the original package/seal and copied its two verified payload files
into the same ignored upload directory. Inventory remains exactly Verification.gs,
appsscript.json and .clasp.json. The private target configuration is byte-unchanged,
rootDir remains dot, target still matches the owner-confirmed 4.0 project, and the
manifest remains byte-unchanged/read-only. Only the diagnostic is exposed and it
still returns DISABLED; no handlers, writes or real services are enabled.

After passing the documented preflight again, the corrected package is prepared
for an OWNER-controlled source-only retry from tmp/verification-upload. No retry,
clasp operation, Google execution, OAuth flow or read was performed by the agent.
Actual Google acceptance/runtime parity remains unverified until that owner action.
Do not execute the diagnostic, authorize data access or deploy as part of a retry.

Technical references (public documentation only):
[Logical assignment is ES2021](https://v8.dev/features/logical-assignment),
[Apps Script V8 environment](https://developers.google.com/apps-script/guides/v8-runtime),
[Acorn parser options](https://github.com/acornjs/acorn/blob/8.15.0/acorn/README.md).

## Owner-reported successful upload; prepared private coordinator

Owner reports the corrected disabled package uploaded successfully to the separate
4.0 project. No remote inspection or execution is claimed. The new source assembly
also includes tools/verification/prepared-diagnostic.cjs INSIDE the private package
closure. It orchestrates injected, bounded read-only capabilities and returns only
fixed status/readiness/schema labels and aggregate game/week/scope counts. All
actual entry points stay DISABLED; the coordinator is neither globally exported
nor connected to native Google services. No configuration loader/enable switch.

See FIRST_LIVE_VERIFICATION.md's prepared-coordinator section for exact private
inputs, two-stage owner consent design, range/read budget, report schema, first-read
procedure and rollback. Authorization callbacks are trusted test seams, NOT proven
owner authentication. A native owner-only bridge and independent evidence source
remain deliberately unimplemented pending isolation/evidence review. Local package
regeneration/sealing does not update the owner's remote uploaded version. Existing
three-file upload copy must match the regenerated seal before any separately
approved future upload; no upload/read is authorized or performed by this work.

## Functional native read connector (current)

The isolated package now includes owner-connection.cjs and private-owner-config.cjs
inside its private module closure. The default provider returns null: uploaded
source remains DISABLED until owner-private REMOTE source configuration and
activation. Request arguments/global settings cannot activate it. Native access is
lazy and limited to Advanced Sheets Spreadsheets.get (restricted metadata) and
Spreadsheets.Values.batchGet (bounded columns), both covered by the UNCHANGED
spreadsheets.readonly manifest. SpreadsheetApp.openById was deliberately excluded
because its documented authorization requires editing permission. No scope broadened.

FIRST_LIVE_VERIFICATION.md's functional-native-connection section supersedes prior
"native bridge unimplemented" statements and explains exact private config,
STRUCTURE versus VERIFY, owner-only Google editor access boundary, five-minute
activation, per-execution attempt limit, manual disable and source-only upload.
The generic package seal covers only disabled nonprivate source. Owner-configured
remote private variants require private delta review and must never enter Git.
The exact local upload inventory remains two project payloads plus ignored clasp
configuration; no extra config asset, public handler, trigger or live frontend.
