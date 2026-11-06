# Static snapshot progress

## CURRENT TASK — v20 polish/static adaptation; timestamp blocker verified

Resume baseline4dc41f1 (published3a9c331/API20). Owner requested frontend wording
polish plus existing static-system adaptation; real static publication/worker remain
OFF. Read the FINAL late-entry checkpoint; do not repeat registry initialization.

New Responses display format exposed a legacy dependency: original response context
uses getDisplayValues(), parseTimestamp_ calls new Date(displayText), and the new
weekday/month/"at" format is rejected. Native Week9 timestamps remain a separate
getValues() path, but invalid historical timestamp0 causes the complete dashboard4
provider to fail closed. Actual public v20 returned UNAVAILABLE and the live browser
could not reach usable state. No fabricated performance baseline is substituted.
Direct bounded timestamp-type read using existing credentials failed403
accessNotConfigured; no service, OAuth or Sheet setting was changed. Underlying cell
types therefore remain unverified (do not assert every cell is a Date).

Prepared LOCAL ONLY: explicit timezone English-format/Unicode-space parser regressions
and an opt-in nativeTimestampCompatibility context normalization. This matches native
rows privately, replaces only in-memory Timestamp values with their authoritative
instants, retains original historical entry selection and does not write the Sheet.
Prepared extension reads the Sheet's actual timezone. Production20 remains unchanged.
Any Google upload/test/promotion of this narrow compatibility fix needs owner approval;
static publication cannot bypass an unavailable live source.

Safe frontend wording corrections underway: remove obsolete initial three-hour text,
neutral loading copy and synthetic-picks/Picks-tab FAQ wording. Preserve synthetic
labels in the synthetic profile and all internal diagnostic terminology.

Exact next work: run new timestamp checks; complete local v20 snapshot contract,
retention/refresh tests and conservative freshness metadata; benchmark equivalent
captured real public data with explicit frozen-clock/replay limitations. Do not claim
current live v20 usable-time metrics while it is unavailable. Request one consolidated
activation approval including the timestamp repair and existing private publisher
access gap; do not request or expose registry mappings.


## REGISTRY INITIALIZED AND CLEANED — no further initialization

Owner confirmed successful REGISTRY_INITIALIZATION_VERIFIED receipt:23 unique IDs,
generation1, exact mapping preserved, cloud read-back and backup recovery successful,
both owner checks passed. Record this as OWNER-EXECUTED runtime evidence, not an agent
execution. Do NOT initialize/recover/save again or regenerate/rotate IDs.

Completed safe source-only cleanup: compared remote against verified-init-candidate,
removed TemporaryOwnerRegistryInitialization (including private bootstrap), verified
all temporary initialization/bootstrap/consent/inspection function names absent from
Google function index. Restored EXACT reviewed OwnerIdentityRegistry with null config
(DISABLED). Explicit five-scope manifest/all other files/access/deployments unchanged.
No Properties APIs were accessed or modified by cleanup; initialized durable records
remain separate from source. Backups and macOS Keychain key untouched. Production18,
ESPN/Forms/Sheets/scoring/Pages and publisher/static delivery unchanged.
Private receipt: activation/cleanup-verified.private.json and safe owner execution
receipt cloud-initialization-owner-receipt.private.json outside repository.

A SEPARATE Week9 metadata diagnostic was subsequently added for the owner's new closure
investigation: TemporaryWeek9ClosureInspection / pp4InspectWeek9ClosureReadOnly.
This does not access registry Properties or enable the registry. All existing cleaned
staging files unchanged. See migration checkpoint's WEEK9 CLOSURE INVESTIGATION entry.
Remove that new temporary file after its safe owner receipt; do not rerun registry setup.

Static activation remains OFF. Durable registry initialization is complete per owner
receipt; unattended authorized publisher access still requires validation before final
static refresh/publication approval. Do not confuse Week9 live disclosure with previously
approved historical1–8 static retention. No new static retention/disclosure approval9.
Validation: full321/321 PASS, zero failed/skipped; artifact/privacy/security stage PASS.
Registry source hash/function-index cleanup assertions passed; no Properties API used.

## CURRENT HOLD POINT — owner identity/empty namespace VERIFIED; initialization READY

Resumef40a183. Owner supplied successful editor reports: OWNER_IDENTITY_VERIFIED,
emailScopeAuthorized/activeOwnerMatches/effectiveOwnerMatches true, writes0; read-only
inspection READY/NAMESPACE_EMPTY_NO_INITIALIZATION_WRITES, valid23 bootstrap,
factory/digest/lock available, stable namespace and all four keys absent, writes0.
These establish no persistent initialization records existed at that inspection.
Do not repeat consent or read-only diagnosis. Owner expressly authorized one-time
initialization with the SAME preserved23 IDs; no rotations/new IDs.

Completed preparation in SAME private staging: exact current-source hashes verified;
restored the exact previously reviewed configured OwnerIdentityRegistry helper from
private consent-before backup (both owner guards unchanged); initializer and23-entry
private input byte-identical to reviewed source/unchanged outside-repo mapping.
Removed TemporaryRegistryConsent and TemporaryRegistryReadOnlyInspection after
successful owner verification. Manifest retains exact five approved scopes. Every
other staging file, access/deployments and production18 deployment unchanged.
Google function index confirms pp4InitializePrivateRegistryOnce is selectable.
No function execution/registry writes performed by this preparation upload.

READ-ONLY encrypted recovery verification COMPLETE: existing original AES-GCM export
and existing independent generation1 recovery export each decrypted to EXACT23-ID
mapping, unique23. Existing macOS Keychain key retrieved privately, not changed;
key buffers cleared. No exports/maps moved into Git and no backups overwritten.
Private receipts/source snapshots: activation/verified-init-{before,candidate,ready}
.private.json outside repository. prerequisite-inspection-candidate updated to exact
current source; do not restore an older candidate or inferred manifest.

EXACT NEXT OWNER ACTION: reload existing private staging editor; open
TemporaryOwnerRegistryInitialization.gs; select pp4InitializePrivateRegistryOnce;
Run ONCE. No new authorization expected. Send ONLY the safe JSON receipt:
REGISTRY_INITIALIZATION_VERIFIED, players23/uniqueIds23/generation1,
exactIdsPreserved/cloudReadBack/cloudBackupRecovery/activeOwner/effectiveOwner true.
If it fails, STOP without retry. No source/map/ID/key screenshots or private values.
This is actual authorized initialization, not another diagnostic or consent step.
Native editor execution cannot be safely replaced by direct-token HTTP because that
context lacks the required active-owner identity. No bypass/new endpoint is permitted.

CLOUD INITIALIZATION/PERSISTENCE/RECOVERY STILL PENDING until that receipt. Do not
claim completed Google registry, enable publisher, or request publication yet.
After receipt: compare current source against verified-init-candidate; restore reviewed
DISABLED helper and remove temporary initialization/input, keeping explicit approved
manifest and all other files unchanged. Verify temporary function index removed,
deployments unchanged, Properties untouched by cleanup. Record generation1 success
privately, retain encrypted independent recovery files/Keychain key, then prepare
ONE activation request for real sanitized static snapshots and six-hour refresh.
That final request must also identify any unproven unattended publisher access to the
private registry; never place mapping or key in Actions/secrets/artifacts. Existing
historical1–8 retention approval stands; new weeks still require independent CLOSED
and disclosure authority. No API18/Sheet/Form/trigger/Pages/publisher changes.

Focused15/15 tests PASS (initializer/consent/prerequisites/scopes), syntax compatibility
included; full316/316 PASS, zero failed/skipped; artifact/privacy/security stage PASS.
Git whitespace checks PASS. Latest source remains f40a183; this checkpoint records
only authorized staging preparation and pending one-time owner execution.
This task changes only the resumable tracked checkpoint, no frontend/backend source.

## CURRENT HOLD POINT — interactive editor email consent required (initialization DISABLED)

Resume1409e0a. Owner's second report has ACTIVE_EMAIL_SCOPE_REQUIRED,
emailScopeAuthorized:false,authorizationStatusKnown:true,diagnosticWrites0.
Exact implementation reviewed: getAuthorizationInfo(FULL,[userinfo.email]) queries
ONLY the email scope, so that scope is definitively ungranted for the executing user.
It does NOT prove any of the other four scopes missing. Explicit manifest is verified
current and unchanged. getAuthorizationInfo observes consent; it does not request it.
No more inferred-scope/HTTP/debugger experiments or unrelated consent functions.

INSTALLED temporary public-named editor helper, Google function index VERIFIED:
TemporaryRegistryConsent.gs / pp4CompletePrivateRegistryConsent.
It calls ScriptApp.requireScopes(FULL,[userinfo.email]) OUTSIDE catch, preserving
Google's supported IDE interruption and interactive consent prompt. It requests only
the already-approved missing scope, never prints a URL/token/email or reads registry.
After consent, it rechecks authorized scopes and both exact owner identities, returning
only safe booleans/state. No identity fallback/bypass. No extra scope/deployment/route.

Registry writes DISABLED during troubleshooting: only OwnerIdentityRegistry changed
among existing files; its reviewed owner guards/config/core are preserved, but its
returned capability is now frozen {load} ONLY. No save/recover/restore is exposed.
Existing initialization entry points cannot write through this factory; do NOT run
them. All23 IDs, private input, encrypted backups and Keychain key unchanged. Source
backup/candidate outside Git: activation/consent-{before,candidate}.private.json;
prerequisite-inspection-candidate.private.json updated to exact current hashes.
Manifest/all other staging files and exact production18/access/deployments unchanged.
Installation executes no registry function, consent flow, live read or initialization.

EXACT OWNER ACTION: reload existing private staging editor; select file
TemporaryRegistryConsent.gs, function pp4CompletePrivateRegistryConsent, Run.
Complete Google's interactive review using the authorized owner account; allow email
identity access. STOP if permissions outside the five approved scopes are requested.
If execution paused for consent, run the SAME helper again after approval. Send only
JSON with OWNER_IDENTITY_VERIFIED/emailScopeAuthorized/activeOwnerMatches/
effectiveOwnerMatches true. Then run pp4InspectPrivateRegistryReadOnly ONCE and send
only its safe JSON. Do NOT initialize. This verifies scope/owner before bounded
read-only namespace inspection. Prior failed initializer write status is still unknown
until namespaceInspected:true; consent helper has no Properties access at all.

After successful owner report, remove ONLY TemporaryRegistryConsent using exact
current-source hash precondition and verify index removal/source preservation. Keep
registry read-only; restoring initialization capabilities requires the later explicit
initialization step. Do not blindly use old restore scripts/candidates or undo explicit
approved manifest. No publisher/static/Pages activation. Current checkpoint waits
for interactive owner action, which cannot be completed by source upload or local OAuth.

Implementation: tools/snapshots/registry-consent-package.cjs; four fabricated tests
prove interactive interruption not swallowed, email-only request, strict owner checks,
redacted output, read-only facade and concurrent/unreviewed source refusal. ES2020 gate
included. Google supported flow:
https://developers.google.com/apps-script/reference/script/script-app#requirescopesauthmode,-oauthscopes

Validation: focused4/4 PASS; complete316/316 PASS, zero failed/skipped.
Artifact/privacy/security stage PASS; ES2020/syntax/whitespace checks PASS.
No tests weakened. No production or public change. Safe source/checkpoint ready
for normal develop commit/push; next unfinished task is owner interactive consent.

## CURRENT HOLD POINT — explicit approved identity scope installed; owner grant/read-only report pending

Resume from e494629, preserving all local commits. Owner's diagnostic returned
ACTIVE_EMAIL_SCOPE_REQUIRED; both identity reads failed, namespaceInspected false,
diagnosticWrites0. False bootstrap/factory flags mean NOT INSPECTED, not invalid input.
Verified current staging source matched the prior saved candidate. Manifest had NO
oauthScopes field: scope inference was still being used. The runtime report proves
userinfo.email unavailable to that execution; metadata alone cannot distinguish failed
inference from an ungranted/granular consent scope. Earlier disabled-helper execution
stopped before Session access and did NOT prove identity authorization effective.
Do not claim wrong owner, corrupt registry or verified cloud initialization.

Minimal authorized correction APPLIED in EXISTING private staging only: explicit
manifest lists the four previously reviewed staging permissions (spreadsheets, forms,
script.scriptapp, script.external_request) plus already-approved userinfo.email. All
other manifest settings preserved. Only appsscript and TemporaryRegistryReadOnlyInspection
changed; every other file including private bootstrap/initializer/owner checks unchanged.
Added bounded getAuthorizationInfo(FULL,[userinfo.email]).getAuthorizedScopes() probe;
output ONLY emailScopeAuthorized/authorizationStatusKnown booleans. No consent URL,
email, private record or token is returned. Both exact active/effective owner checks
still precede all private input/Properties reads. No helper/init executed by this task.
Google index confirms pp4InspectPrivateRegistryReadOnly remains selectable. Existing
MYSELF/USER_ACCESSING staging settings and exact production18 deployment unchanged.

EXACT NEXT OWNER ACTION: reload the same private staging editor; select
TemporaryRegistryReadOnlyInspection.gs / pp4InspectPrivateRegistryReadOnly, Run once.
If prompted, grant only the already-approved email permission alongside existing four;
STOP if Google requests anything outside those five scopes. Send only logged JSON.
Do NOT run initializer yet. The diagnostic will verify actual grant, both owner matches,
and bounded namespace integrity without writes. Earlier failed initializer's persistent
write status remains UNKNOWN until that report; latest diagnostic made zero writes.
No IDs regenerated, no backup/key changed, no publisher/static/Pages activation.

Implementation: tools/snapshots/registry-scopes.cjs pins approved scope list, rejecting
unreviewed scopes; registry-prerequisites-package.cjs adds safe authorization probe.
Tests cover manifest preservation, unknown-scope rejection, granted/ungranted/unknown
scope reports, no namespace access when identity fails, redaction and ES2020 syntax.
Private before/installed receipts and current updated candidate are OUTSIDE Git under
Application Support/Perfect Pick/Private Registry/activation/identity-scope-*.private.json.
Cleanup must preserve this approved explicit manifest while restoring disabled helper
and removing both temporary files; do NOT blindly restore the old inferred manifest.

References: https://developers.google.com/apps-script/reference/base/session confirms
userinfo.email is required for both Session identity methods;
https://developers.google.com/apps-script/reference/script/authorization-info documents
the read-only authorized-scope probe. A metadata read cannot verify a user grant.
Validation: focused8/8 PASS; full312/312 PASS, zero failed/skipped after rerun
with loopback permissions (initial sandbox run had three browser EPERM errors).
Artifact/privacy/security stage PASS; syntax and git diff whitespace checks PASS.
No test was skipped or disabled. Latest tested implementation39ac977 committed and
pushed to develop successfully. Prior checkpoint commits preserved and synchronized;
GitHub commit_refs_rules failure cleared on normal push. No force/history/rule changes.
Working tree clean after implementation commit; this follow-up only records receipt.

## CURRENT HOLD POINT — failed initialization needs READ-ONLY runtime report

Owner ran pp4InitializePrivateRegistryOnce once; execution ended at the generic catch
(line18) with Private registry initialization blocked. That catch redacts the underlying
exception; it does NOT establish the failed guard or prove zero/partial writes.
Do not guess that the namespace is empty or claim initialization/recovery succeeded.

Read-only source inspection COMPLETE: current remote files exactly match the saved
initialization candidate. Configuration enabled, owner-review flag true, configured
owner equals verified project creator, bootstrap present/strictly valid with23 entries,
initializer unchanged. This rules out disabled/stale configuration and missing/invalid
static input in the inspected source. The runtime actor/Properties state remains unknown.
No IDs regenerated, backups/key untouched. API18/deployments/access/manifest unchanged.

Installed ONLY one additional read-only diagnostic file in the SAME private staging:
TemporaryRegistryReadOnlyInspection.gs
public function pp4InspectPrivateRegistryReadOnly
Google function index VERIFIED the function. Every pre-existing file, including the
initializer and reviewed owner/registry security checks, is unchanged. No initializer
or registry operation was invoked by installation. No new route, scope or deployment.

This diagnostic returns/logs ONLY fixed prerequisite codes, identity availability/match
booleans, counts, property-presence and integrity booleans. It never returns emails,
source keys, public IDs, maps, hashes, records or raw errors. Both owner checks MUST
pass before bootstrap/Properties reads. It reads only PRIMARY/BACKUP_A/BACKUP_B/HIGH_WATER
in the registry namespace, checks a stable double-read, then verifies the reviewed
core's read-only load when records are otherwise valid. There are NO setters,
initialization, recovery, deletion, HTTP, Sheet/Form/score/trigger/publication operations.
The diagnosticWrites field is0 by construction and tested. It distinguishes wrong
owner/scope/context, empty vs partial namespace, malformed/checksum/mapping/high-water/
backup failures, JSON-order-only mismatch and blocked core-load conditions. It also
checks the unchanged helper factory, a known PUBLIC digest probe, and acquisition/
release of the existing ScriptLock before returning empty-namespace readiness;
lock state is transient and no Properties/data is written.

EXACT OWNER ACTION (not consent or another initialization attempt): in the SAME Google
profile used for the failed run, open TemporaryRegistryReadOnlyInspection.gs, select
pp4InspectPrivateRegistryReadOnly and Run once. Send ONLY the logged JSON report.
Do NOT rerun initialization or change accounts/config until that report is captured.
If ownership fails the diagnostic correctly stops before namespace inspection; do not
weaken it to read the registry under a different actor. Private OWNER_ACTION.md updated.

BLOCKER: native browser control remains unavailable; runtime inspection cannot safely
be executed automatically through the known-failing direct-token active-owner context.
Do not repeat HTTP/authorization experiments or request unrelated scopes for execution
logs. A safe owner-editor result is required to identify the actual root cause and
verify whether the failed run wrote any persistent registry keys. Initializer source
is not changed as an unverified attempt to make it pass.

After report: use the exact fixed code/flags to apply the MINIMUM verified correction,
retain every owner/checksum/expected-generation/mapping/backup check, confirm any
partial state and preserve original IDs. Prepare any necessary next bounded editor
operation and verify its index/tests before requesting it. No random IDs may be
regenerated and no namespace may be reset/cleared. Do not infer a historical cause if
current evidence only shows a recovered/transient state.

Private metadata/source backup/receipt OUTSIDE repo:
Application Support/Perfect Pick/Private Registry/activation/
failed-init-current-source.private.json and prerequisite-inspection-{before,candidate,
installed}.private.json. No mapping/key moved back into repo. The later cleanup must
remove BOTH temporary initialization/input and read-only inspection, restore the
reviewed disabled helper and leave durable Properties intact. Existing restore script
expects the prior candidate; update/verify its expected hash against the read-only
inspection candidate before cleanup, never overwrite concurrent edits blindly.

Validation: focused6/6 diagnostic tests PASS; full310/310 regression tests PASS, zero
failed/skipped; artifact/privacy/security staging PASS. Other new tests from prior
steps retained. No production or frontend change, no static/publication/publisher
activation. Exact runtime root cause and prior write status are NOT YET VERIFIED.
Latest local tested implementation:a6d571b (310/310 PASS). Remote develop last
accepted3943dfa. Two normal pushes were rejected by GitHub with fatal error in
commit_refs_rules; no force push/rule/credential changes were attempted. Preserve the
local branch and newer private inspection candidate; do not reset to the older remote.
This remote synchronization issue does not block the already-installed read-only
inspection. Retry a normal push after GitHub recovers; never bypass rules.


## CURRENT HOLD POINT — authorized editor initialization prepared (no repeat consent)

Owner confirmed pp4AuthorizePrivateRegistry ran and stopped with the expected
Private registry disabled error. Existing private health now returns authorized JSON.
Removed authorization wrapper; verified its function index entry disappeared and the
exact reviewed disabled helper/all baseline staging files were restored. No need to
repeat that authorization step. Production18/deployments/access/manifest unchanged.

A bounded private HTTP setup attempt then failed CLOSED at ACTIVE_OWNER_AVAILABLE
before any registry read/write. Direct token-authenticated HTTP cannot establish the
required active owner for this request; do not weaken the reviewed two-owner checks.
The temporary POST handler/configuration were removed and exact reviewed disabled
source restored, with Properties untouched. No HTTP diagnostic or new route remains.
Native browser control is still unavailable (no apps/browsers; native startup failure).
Reading execution metadata also returned403 with existing credentials; no new scopes
were requested to inspect logs. Do not repeat either failed transport or consent.

To complete the authorized initialization, ONE bounded owner-editor function is now
installed in the SAME private staging project:
file TemporaryOwnerRegistryInitialization.gs
function pp4InitializePrivateRegistryOnce (no trailing underscore)
Google function metadata VERIFIED this public-named function. No visual UI claim.
The helper's authorized private configuration binds both active/effective identities
to the verified project creator. All existing staging files except this configuration
are byte-identical; manifests, access, deployments and production API18 are unchanged.
Authorization wrapper/temporary POST are absent. No function was executed by upload.

Initializer uses the EXACT preserved23-ID input, supplied ONLY inside the private
Google project and outside-repository private setup candidate (never Git/source in
this repo or logs). No phone or recovery key is in that input/source. The key stays
in macOS Keychain. It only saves an empty private registry at generation1, refuses a
different existing mapping, reads back exact IDs, recovers the latest verified cloud
backup and checks exact IDs again. All owner checks precede property access. It logs
ONLY a fixed safe counts/booleans receipt after all checks succeed. No ID generator,
Sheet/Form/score/trigger/deployment/publication API or HTTP handler is present.

EXACT OWNER ACTION: open the existing private staging editor; select
TemporaryOwnerRegistryInitialization.gs, choose pp4InitializePrivateRegistryOnce,
Run once. Send ONLY the logged REGISTRY_INITIALIZATION_VERIFIED JSON receipt, with
players23/uniqueIds23/generation1 and exactIdsPreserved/cloudReadBack/cloudBackupRecovery/
activeOwner/effectiveOwner all true. This is actual initialization, NOT authorization.
No manual mapping/key copy is needed. Private OWNER_ACTION.md has the exact link.
Do not run unrelated functions or send screenshots/source containing private input.

CLOUD REGISTRY IS STILL PENDING until that execution succeeds. Local23-ID uniqueness,
identity stability and authenticated encrypted backup/recovery remain verified. Do
not claim cloud persistence, final publication readiness, or activate the six-hour
publisher/real-static Pages yet. All are OFF; live e6e3e92/API18 remain unchanged.

After successful safe receipt: verify unchanged private candidate/source and restore
using tmp/private-registry-init/editor-init.mjs restore. It removes ONLY temporary
initialization/input/config and restores the exact reviewed disabled helper, leaving
all durable registry Properties untouched. This operation refuses concurrent edits.
Then re-verify independent Keychain backup against the unchanged outside-repo mapping,
update cloud-generation/durability receipts privately and prepare the final static
snapshot publication/refresh activation request. No further alias/retention approval
or backend architecture work is required.

Private setup receipts/backups/candidates are OUTSIDE repository under
~/Library/Application Support/Perfect Pick/Private Registry/activation/
editor-init-{before,candidate,installed}.private.json, cloud-restored.private.json.
These contain private configuration/input; NEVER copy into Git/Actions/artifacts.
The existing outside-repo mapping/recovery files and Keychain key are unchanged.

Validation: new focused4/4 fail-closed transport tests and3/3 editor-initializer tests
PASS. Full304/304 regression tests PASS, zero failed/skipped; privacy/artifact/security
stage PASS. New tracked generators contain null bootstrap/defaults and fabricated
tests only. Latest tested implementation:ed0c327 (304/304 PASS); public rollback unchanged.


## CURRENT HOLD POINT — temporary public-named authorization wrapper

The earlier instruction to select pp4PrivateRegistry_ in the Run dropdown was WRONG.
Google's Apps Script product-manager documentation confirms trailing underscores hide
helper functions from that dropdown:
https://googleappsscript.blogspot.com/2010/06/hiding-helper-functions.html
Do not repeat that instruction or ask the owner to run unrelated legacy functions.

Temporary public name: pp4AuthorizePrivateRegistry (no trailing underscore).
Installed ONLY as an appended function in OwnerIdentityRegistry in the existing
owner-only staging project. Reviewed helper prefix is byte-identical, provider stays
null/DISABLED; all other staging files/manifest, deployment/access settings and
production18 deployment are verified unchanged. No new file, route, deployment,
trigger, service/scope or private data was added to Google beyond this authorized
function. No registry operation, initialization, write or publication was invoked.

Wrapper behavior: require config EXACTLY null; call only pp4PrivateRegistry_. The
reviewed helper then throws Private registry disabled BEFORE Session, Properties,
lock or any read/write. Enabled/modified configuration is rejected before calling
helper. Function cannot call the initializer, save/load/recover, Form/Sheet operations,
writers, triggers or HTTP publishing. It adds no scopes beyond the already-approved
helper. Four new focused tests prove these boundaries, ES2020 parsing and exact cleanup.

Server verification: Google's functionSet index includes pp4AuthorizePrivateRegistry
as a top-level function (alongside the three private underscore helpers). This confirms
Google recognizes the installed wrapper; it is NOT a screenshot/observation of the
editor dropdown. UI verification remains UNAVAILABLE: native control again returned
no browsers/apps with a native connection startup failure. Honor the owner's explicit
condition: do not ask them to RUN it while representing the dropdown as verified.
The exact intended name is recorded above; no unrelated function is suggested.

Private operation script (no embedded IDs/secrets):
tmp/private-registry-init/wrapper.mjs add|remove
It reads the existing private backup outside repo, verifies installer owner/target,
compares all source/deployment baselines, applies ONLY the temporary append, and
verifies Google's function index. Private source backup/receipt is outside repo under
Application Support/Perfect Pick/Private Registry/activation/
(authorization-wrapper-add-before.private.json, authorization-wrapper-add.private.json).
No map or key was read/changed for this operation. Previous real23-ID recovery remains
verified and stored outside repo with key in macOS Keychain.

EXACT NEXT STEP: recover editor UI control and verify pp4AuthorizePrivateRegistry is
actually offered, or accept an owner-provided observation of the dropdown. Only then
request that exact function for consent. It is expected to stop disabled, writing
nothing. After owner authorization confirmation, run the prepared remove operation;
it refuses concurrent edits and restores the exact reviewed disabled helper while
leaving durable Properties untouched. Verify remote source and function index after
cleanup. Do not remove the wrapper prematurely before authorization, initialize the
registry, or enable publisher/Pages during this authorization-only task.

Validation: focused4/4 wrapper tests PASS; full297/297 regressions PASS, zero
failed/skipped; artifact/security staging PASS. Production/API18 and Pages remain unchanged. Registry cloud
initialization is still NOT complete. Latest passing implementation:fb5606c (297/297).


## CURRENT HOLD POINT — private helper installed; Google owner consent needed

Resumed from0aba609 plus the preserved local outside-repository backup changes.
Owner has now approved the helper's userinfo.email scope effect. No further scope
approval is being requested. Production API18, all existing staging files/manifest,
staging access/execution settings and all deployments are verified unchanged except
for the exact ONE added OwnerIdentityRegistry file. Only-myself/USER_ACCESSING staging
was verified via existing metadata; authenticated installer matches project creator.
Helper source equals the reviewed ES2020 generator; provider remains null/DISABLED.
No diagnostic route, new deployment, trigger or production code change was made.

REAL local recovery completed before this resume and rechecked: all23 existing128-bit
IDs preserved/unique. Mapping moved to owner-only Application Support outside repo;
authenticated-generation AES-256-GCM exports decrypt/recover EXACT same records.
Recovery key is in macOS Keychain only, never source/Git/Google/Actions. Outside files
are0600 under0700 private directories. New production backup code rejects exports
inside repo before accessing a key; fabricated tests explicitly opt into test paths.
The old ignored map path now contains a NON-DATA tombstone; do not delete it or rerun
legacy initialization. It deliberately fails closed rather than creating replacement IDs.

Private files (outside repository, do not copy into Git/workflow artifacts):
~/Library/Application Support/Perfect Pick/Private Registry/
- identity-map.private.json (unchanged23 IDs)
- identity-recovery-generation-1.enc.json and independent-recovery-generation-1.private.json
  (verified encrypted exports; generation1 is intended bootstrap, NOT initialized cloud)
- local/outside recovery verification receipts; activation/ contains staging source
  backup/candidate, installed receipt, authorization status and OWNER_ACTION.md.
The prepared candidate/staging backup include private source/configuration and remain
outside the repository. No mapping or recovery key is stored in staging source.

BLOCKER: native browser control returned no browsers and a native connection startup
failure. A read-only existing staging health request returned an HTML authorization
page, not a registry response. No registry operation was invoked. Existing local OAuth
owner identity is verified, but Google runtime consent/effective-owner verification
and private Properties initialization/persistence/recovery ARE STILL PENDING.
Do not claim Google durability or static-publication readiness yet.

EXACT OWNER ACTION: open the existing staging editor using the private link in
activation/OWNER_ACTION.md, select pp4PrivateRegistry_, Run, and complete Google's
Review permissions flow for the approved email scope plus the four previously reviewed
staging scopes. Stop on any unrelated scope. A Private registry disabled error AFTER
consent is expected: configuration deliberately remains disabled and writes nothing.
Tell the agent consent is complete. No mapping/key needs to be pasted for this step.

After consent: continue from the saved source/candidate without repeating audits or
reconciliation. Configure only the authorized private helper; initialize from the
outside-repo23-ID map; verify active/effective owner, exact persisted IDs and backup/
recovery, then disable setup/remove bootstrap as appropriate while preserving primary/
backup Properties. Do not invent routes/new deployments or silently broaden the reviewed
helper. If browser control remains unavailable, state the minimum owner UI action;
never bypass owner authentication. Six-hour publisher and real-static Pages remain OFF.

Validation on this resume: full293/293 tests PASS, zero failed/skipped; artifact/security
stage PASS. This includes the new default ban on repository recovery exports. The prior
full293 run also passed; no backend/frontend behavior was edited on this resume.
Safe storage enforcement/test/checkpoint committed and pushed as e875c76 (293/293 PASS).
Public rollback remains e6e3e92/API18; no publisher or static activation occurred.


## CURRENT CHECKPOINT — approved retention safeguards complete locally

Supersedes the earlier pending-retention decision below. Owner approved historical
retention for season2026 Weeks1–8 only. Baseline c68b376; public rollback still
 e6e3e92/API18, unchanged. Latest tested implementation commit:1595fc9 (292/292 PASS).

Implemented: PP4_STATIC_V2, independent durable owner-policy record, immutable
120s capture validation, separate six-hour score/display freshness; physical removal
of unapproved/expired scopes, aggregates/decisions/allocations/unused aliases. Week9
OPEN or newly CLOSED still has no static release. Actual previously verified season
2026/Weeks1–8 checked from the existing private parity receipt/generation; no new
production read or reconciliation. Existing23 random IDs were loaded/validated only,
not changed. No real map or snapshot was uploaded, committed or published.

Private storage: owner-only Script Properties primary/rotating backups/high-water
recovery implementation, ES2020 editor helper disabled by default, authenticated
AES-256-GCM independent export with authenticated generation and restricted atomic
verified backup/preserved
previous copy. Tests recover EXACT same IDs after corruption and block older recovery,
rotation, unauthorized owner/lock access, malformed source and leaking exceptions.
These were fabricated service/file tests. REAL private Google registry and secure
backup key ARE NOT initialized. Existing development map alone remains insufficient.

Permission gate: helper's active/effective owner check requires userinfo.email per
Google's Session documentation; no grant/manifest edit/upload/execution occurred.
The four previously reviewed staging scopes are not silently broadened. Need separate
owner approval for this additional scope if absent and private-helper installation
into the EXISTING owner-only staging project, plus secure backup-key provisioning.
No production API18 changes are required or proposed.

Six-hour worker: explicit coalesced prepare-only function, DISABLED by default,
publication hard-disabled. Validates freshness,272 games/18 weeks, approved roster,
complete historical coverage and monotonic source/references; verifies private
registry/recovery before exact38-file sealed local candidate and atomic last-good
archive update. Failure preserves existing historical records, never renews their
score freshness. Cadence6h with2-minute preparation lead. No timer, Google trigger,
workflow, secret, polling loop or unattended publisher is installed. Private registry
publisher access must be verified after owner setup; do not claim an unconnected local
mirror is a durable production store.

Validation COMPLETE: full292/292 tests PASS, zero failed/skipped. All existing
regressions plus owner/backup/retention/transition/failure tests; static browser at
360/390/430/768/1440 and retained browser at390/1440 after3h; all32 SVGs,23 players,
272 games, lazy matrix, OPEN confidentiality, expiry DOM clearing, monthly decisive/
equal/missing tiebreaker parity and sealed artifact scans. Synthetic staging/security
and existing API publication checks PASS. Conservative ES2020 helper compatibility
PASS. Source performance remains sub-second locally: retained cold579–617ms,
repeat384–417ms in final fabricated samples,0 Google requests. Numerical report in
STATIC_SAFEGUARDS_MEASUREMENTS.json; no new live API timing claim.

Prepared ignored helper: tmp/static-snapshot-safeguards/OwnerIdentityRegistry.gs
plus source.seal.json. It is disabled, contains no real owner/project/mapping, and
has no HTTP/Form/Sheet/trigger/ESPN operation. Real23-ID map remains under the prior
restricted ignored tmp/static-snapshots-private location. No private values in Git,
logs, public artifacts, scopes or this checkpoint. See STATIC_SNAPSHOT_SAFEGUARDS.md
for exact owner-controlled initialization/recovery and permission source references.

EXACT NEXT ACTION: obtain the one narrow private setup/scope approval above; verify
existing staging ownership/access and scope request, preserve source, install ONLY
the reviewed private helper, initialize the unchanged23 IDs, independently back up/
restore-test them privately and verify publisher access. Stop if Google requests any
unapproved scope. Then prepare/verify a fresh real retained candidate and request
FINAL static Pages publication approval. Do not repeat completed audits, parity,
reconciliation, redesign or API migration. No public/static deployment authorized yet.


Baseline/published rollback: e6e3e92; latest prior checkpoint666abee on develop.
No public source switch, real capture, API update, credentials, Google resource change,
or deployment performed. Existing Pages API profile and38-file artifact unchanged.

## Milestone1 — implemented and focused tests passed

- `tools/snapshots/identity-store.cjs`: CSPRNG128-bit public IDs, collision rejection,
  persistent private source-reference/public-ID association. No phone read/hash/name-
  based ID. Development map restricted to ignored tmp,0600 atomic writes, no symlinks.
  Source references are private; never bundle or upload the mapping. Durable production
  storage, access control, backup and publisher availability are NOT established.
- `publisher.cjs`/`schema.cjs`: strict original API decode BEFORE explicit nested
  projection, exact reviewed alias roster, remap every player reference, validate again,
  public-output contact/credential/marker scan, sealed immutable local generations.
  Failed generation never replaces a good directory. Read-only dashboard4 capture
  helper is opt-in and bounded; not executed against real data.
- `browser-client.cjs`/`local-preview.cjs`: isolated same-origin static adapter and
  explicitly local fabricated preview, unchanged5 destinations. No automatic API
  fallback after validation failure; existing api build remains explicit rollback.
  No browser persistence; coalesced requests, bounded retries, immediate expiry clearing.
- Schema `PP4_STATIC_V1`: generatedAt, expiresAt, validated PP4_JSON_V1 payload.
  Single file initially: existing aggregate/monthly validation needs complete scopes;
  splitting before measurements would duplicate data or defer cross-scope validation.
  Full matrix/player UI remains lazy. All player IDs are p_ plus32 random hex digits.
- Focused8/8 tests: parity, collision/entropy, alias approval, private/contact/raw-field
  rejection, OPEN/unknown/expired closure, missing aliases, paths/symlinks/seal/partial
  failures, coalescing/retries/no API bypass and bounded source capture.

## Critical activation limits

Existing contract maximum age is120s. This prototype DOES NOT renew/extend any proof
or alter API18. Four-daily publication is incompatible with this current window.
Static public files are cacheable/copyable beyond display expiry; display expiry is
not revocation. An explicit owner retention decision for irreversible publication of
approved CLOSED scopes is required before any real static publication, followed by
reviewed separate static-validity implementation/tests. Do not poll API every120s.

No mapping is production-durable yet. No unattended job/secret/workflow change is
installed. Production identity continuity across seasons requires durable linkage
of existing API references to reconciled identities; unchanged source references
reuse IDs, changed source references require private reconciliation, never name guessing.

## Exact next action

Continue locally: fabricate a23-player/full-slate compatible envelope, benchmark the
unchanged dashboard against same-origin JSON under existing CDP conditions, add real
browser/privacy/expiry/mobile tests, run full suite and artifact checks, record results.
Then consolidate durable mapping/retention/final publication approvals. Never publish
fabricated results or actual player mappings. Latest passing commit follows this entry.

## Final milestone — prototype/parity complete, awaiting activation decisions

Supersedes the unfinished next action above. Latest passing milestone f454720;
final tested source/checkpoint commit follows this entry. Rollback/published frontend
remains e6e3e92 (no deployment or production/source-profile change).

Completed:
- Full fabricated workload272 games/23 players,8 CLOSED/10 undisclosed weeks;
  original scoring, aliases, champion/tie/prize contracts and responsive5 destinations
  preserved. Exact static candidate38-file inventory excludes the unused fixture,
  includes one data/snapshot.json, self-only CSP, original32 logos and sealed bytes.
  Candidate remains local/test labeled and is NOT wired to the Pages workflow.
- Browser360/390/430/768/1440 cold+repeat: no page overflow/external service fetch,
  all32 SVGs decode under /Perfect-Pick-4.0/, matrix0 cells before open then345 cells,
 23 player rows, CLOSED selection/prediction/votes intact; OPEN Week9 values absent.
  Refresh failure retains only unexpired success; expiry clears protected DOM.
- Full279/279 tests PASS, zero failed/skipped, after final implementation. Includes
  all existing scoring/privacy/browser/API/security/package/artifact suites and13
  additional static checks (12 unit/artifact +1 multi-viewport browser). Synthetic
  publication stage/privacy/history/seal checks PASS; existing API-profile tests PASS.
- Source capture is bounded20s/2MB, only existing dashboard4 GET, safe generic errors.
  CSPRNG IDs/collisions/approved roster/private paths, unknown fields, partial failure,
  source revision rollback, initial missing/invalid/expired data all tested. Explicit
  verified cross-season source rekey retains the same random public ID.
- Final sequential measurements: STATIC_SNAPSHOT_MEASUREMENTS.md and numeric JSON.
  Cold local static about545–574ms, repeat379–418ms, zero Google requests. Same-input
  controlled200ms API cold646–668ms (static observed14–18% faster); not a real-Google
  latency simulation. Current actual live cold13.45–18.81s, repeat15.42–15.58s; datasets
  and CDN/loopback conditions differ, so no exact real-data speedup is claimed.

Bounded REAL private verification subsequently completed successfully (read-only
existing public dashboard4; no new permissions/credentials or private registry read).
Matched the existing owner-approved private roster of23; generated independent IDs
only in ignored restricted development storage. Source-to-projected dashboard model
parity PASS for weeks, matchViews, prizes, prizeViews, resolutions and Form. Actual
read272 games/121 FINAL,8 eligible CLOSED weeks,10 withheld/unverified scopes. No
phone access needed. API18 unchanged. No source/private values printed or committed.
Private receipt/development map/local generation remain under
`tmp/static-snapshots-private/` (Git-ignored, restricted file/parent permissions).
This is NOT a durable production identity store or a release-approved snapshot.
Snapshot expiry remains original120s; do not publish that expired generation.

## Exact remaining decisions / resume

1. Owner authorizes and verifies durable owner-only encrypted/backed-up identity
   storage, recovery and availability to the authorized publisher. Migrate the
   development map rather than generating new IDs. Keep it outside Git/GitHub.
2. Owner decides explicit irreversible retention for approved CLOSED historical
   snapshots, scope/week list and display freshness. Static files may be cached or
   copied after expiry. Without that decision, retain API or results-only static;
   NEVER silently extend the existing120s evidence to six hours.
3. Once those decisions are implemented/tested, present a fresh validated real static
   artifact for final Pages activation approval. No new OAuth/client/backend needed.
   Proposed publication cadence every6h after existing3.0 score updates, only reading
   already-updated public dashboard4. No schedule or real publication enabled now.

Resume exactly here: keep live e6e3e92/API18 working; do NOT repeat the audit, private
reconciliation or measurements. Review the three decisions in
STATIC_SNAPSHOT_DESIGN.md, implement only the approved retention/storage mechanism,
reuse the private random map, revalidate fresh source/parity, run279+ tests and prepare
one explicit final static-profile release approval. Do not dispatch Pages yet.
Files touched: tools/snapshots/*, tests/static*.test.cjs,
tests/support/static-snapshot-example.cjs, tools/performance/browser-profile.cjs,
and docs/performance/STATIC_* only. No website/API/backend/workflow edits.

Last successful implementation commit:38554cc on develop. Final279/279 regression
run and private real-source parity are complete; all non-sensitive source is ready
for push. Documentation-only checkpoint follows. Publication remains UNCHANGED/API18;
no static deployment is authorized. Resume with the three owner decisions above.

### v20 preparation milestone — tested, not activated

Prepared native-timestamp compatibility and columnA count-only inspection; five
fabricated timestamp tests cover Unicode spaces, Sheet-timezone vs host-timezone,
DST ambiguity/nonexistence, native subseconds, exact cutoffs and original/first-late
selection. Private one-file extension candidate is sealed against20 outside Git and
has NOT been uploaded. No original source, trigger, Form, Sheet or OAuth change.

Static projection negotiates LATE_ENTRY_V1 and preserves all v20 scoring/eligibility
fields without recomputation. Production-oriented preparation requires existing IDs;
missing mapping entries block instead of generating replacements.23 generation1 IDs
and both independent encrypted recoveries were privately verified; cloud helper stays
disabled and was not read/modified. Current unattended cloud access remains unproven.

Durable output retains ONLY Weeks1–8; Week9 picks/predictions/votes and dependent
player aggregates are absent. Full original v20 DTO parity was verified separately
using the short-lived last-known-good public capture in a restricted frozen-clock
benchmark. That is not a fresh live read, new publication authority or replacement
for the unavailable API. No actual records/maps/keys have entered Git or Pages.

Adaptive15m LIVE /30m game-day /6h non-game-day scheduling is preparation-only;
unknown evidence uses a conservative interval, never invents LIVE from elapsed kickoff.
Underlying score-write timestamp remains unknown; generation/observation/publication
are distinguished. Static client uses bounded same-origin refresh, no API fallback,
memory-only cache and expiry clearing. Unchanged content skips generation churn while
previous authority is valid, including retention policy in the content comparison.

Full371/371 tests PASS, zero failed/skipped, plus artifact/security stage. Logs:
/private/tmp/pp-v20-final-all-tests.log and pp-v20-final-stage.log.
Measurements and limits: STATIC_V20_MEASUREMENTS.md. Same real captured v20 input,
fixed200ms API replay vs static: desktop cold724ms vs599ms; mobile685ms vs555ms.
These are local replay observations, NOT current live speedup. Static JSON17,927 gzip
bytes. Actual live API currently UNAVAILABLE, so live usable-time comparison is blocked.

Frontend corrections verified against actual error-state DOM: obsolete three-hour
initial text and synthetic-picks/Picks-tab FAQ were visible. Local source now uses
opening-game cutoff/Match Center wording, neutral loading, clearer unavailable status
and prize-pool labels. No layout redesign or scoring calculation changed.

Next: commit/push passing safe changes; deploy ONLY frontend polish with existing API
profile, verify CI/deploy and actual DOM at five widths/all32 logos. API20 remains
untouched/unavailable pending separate timestamp-compatibility approval. Real static
publication and adaptive publisher remain OFF. Preserve published3a9c331 as rollback.
Then consolidate owner approval for the narrow timestamp repair/type verification;
static activation must wait for fresh parity/performance, explicit Week9 retention
(if full current/season views desired), and private publisher access/input approval.

Frontend milestone ba8c16c committed/pushed; API-profile Pages run42253115006 verify
and deploy SUCCESS. No static data or Apps Script source was uploaded. The existing
API20 timestamp blocker is unchanged by that frontend-only release. Final small UI
correction clears stale entry badges/deadline timers on unavailable data and avoids
an endless initial Checking label. Full371/371 tests passed again, zero failed/skipped:
/private/tmp/pp-v20-status-all-tests.log. Next publish this tested status correction
through the same api profile, then verify actual rendered error-state copy/layouts.

Final privacy review preserved retention expiry separately from volatile API tokens in
the unchanged-content digest. A shortened authorization now forces revalidation rather
than being treated as unchanged observation time. No publisher was enabled. Full371
regressions passed again, zero failed/skipped:
/private/tmp/pp-v20-retention-final-tests.log. Latest frontend status source2699043;
final static-helper correction/checkpoint commit follows before api-profile dispatch.

Latest tested source137935b is published via run42255482532 (verify/deploy SUCCESS).
Final player-facing provenance cleanup removes read-only/validated loading jargon
from the public renderer and clarifies the player selector introduction. Internal
schema/diagnostic wording is preserved. Full371/371 PASS again, no failures/skips:
/private/tmp/pp-v20-copy-all-tests.log. Final api-profile publication follows; no
backend upload, static JSON, private mapping or publisher scheduling is authorized.

Final outage polish preserves the separately approved public responder link even if
competition data cannot load, labelled Open official Form / check availability there.
This does NOT assert OPEN, reopen a Form or disclose any player data. Default unavailable
handlers still remove untrusted links; only the owner-approved canonical config URL
is restored afterward. Unknown deadlines say unavailable, not falsely not scheduled.
New browser coverage verifies this outage scenario, privacy clearing, stopped loading,
all five destinations and360/390/430/768/1440 widths. Full372/372 PASS, zero failed/skipped:
/private/tmp/pp-v20-release3-all-tests.log. Production20 and static publication unchanged.
