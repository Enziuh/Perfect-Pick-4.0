# Implemented safeguards (local, not activated)

Production/Pages remains unchanged at e6e3e92 using API18. No Google resource,
permission, deployment, trigger or production writer was changed. No new project,
OAuth client, hosting service, database, public endpoint or credential was created.

## Durable retention decision

The owner's2026-11-05 approval is recorded in `tools/snapshots/retention-policy.cjs`:
policy pp4-historical-2026-1/revision1/season2026, Weeks1–8 only, indefinite historical
retention. This Git-auditable decision explicitly accepts that public copies/caches
cannot be fully recalled. It authorizes neither future weeks nor unapproved aliases.
No deadline, completed game, old week number or API token creates a new release.

`PP4_STATIC_V2` separates:
- original generatedAt and capturedAt, unchanged captured API evidence and game dates;
- owner retention policy/revision, actual eligible week list and optional shorter end;
- scoreValidUntil (oldest source/game verification plus6h) and effective display expiry.

Generation requires the original API120s validator to succeed at actual capture time.
The captured payload retains its original evidence dates. Browser validation checks
that immutable capture at its recorded time, then independently checks owner retention
and current score/display freshness. It never changes Date.now, reissues a token,
updates checkedAt or pretends a120s token is valid for6h. Default API decoder, contract,
scoring, accuracy, rankings, monthly points-first/tiebreaker handling remain untouched.

Missing/expired permission physically removes picks, predictions, votes, approved alias
lists, affected weekly/monthly/season rows, champion comparisons/winners and related
allocations. Valid approved non-identifying pool/estimate facts remain; unknown values
are not converted to zero. A newly CLOSED Week9 still gets no static disclosure. An
explicit OPEN current control overrides historical disclosure in newly built files.
No stale OPEN data or raw/private fields are hidden in HTML, attributes or JSON.

Scores/entry status are labeled as of the source observation, with six-hour refresh
wording. At hard display expiry the adapter clears model/DOM; retained archived files
may remain cached under the owner policy. Keeping historical files does not authorize
showing stale scores as current or imply that cached files can be revoked.

## Private Google identity registry: implemented, NOT initialized

`private-registry.cjs` is an injected Apps Script-compatible private registry. It stores
only existing opaque source-player references and independently generated128-bit IDs;
no phone read is needed. The original23-ID development map must be migrated, never
regenerated. Existing source identity matching remains in3.0. Explicit verified source
rekey can preserve an ID across seasons; silent rotations/deletions are rejected.

Primary and two rotating backup slots live in the EXISTING private staging project's
Script Properties, under a dedicated PP4_PRIVATE_RANDOM_IDS namespace. Script locks,
expected generations, read-back checksums and a high-water marker prevent concurrent
lost writes, accidental reset or recovery to an older ID assignment. Incomplete writes
block use until explicit recovery. Existing properties are never enumerated/deleted.
Records above8500 ASCII bytes fail closed rather than exceeding Google's property
value limit ([Google quotas](https://developers.google.com/apps-script/guides/services/quotas)).
All project editors can access Script Properties: private owner-only editor ACL review
is REQUIRED, in addition to application checks. Do not install in the production API.

`private-registry-package.cjs` produces one disabled editor-only helper, conservatively
ES2020-checked. It has no doGet/doPost, web-app routing, trigger, Form, Sheet or NFL
operations. No actual account or project ID is in source. Its null configuration
blocks all Google access by default. Only after authorized private configuration can
it verify both active/effective owner and obtain the private Properties/lock services.
Initialization returns counts/generation/backup outcome, never the map, IDs or hashes.
Raw service and malformed-bootstrap exceptions are replaced by safe fixed errors.

PERMISSION GATE: the explicit owner identity check uses Session user email. Google
documents `https://www.googleapis.com/auth/userinfo.email` for these methods
([Session authorization](https://developers.google.com/apps-script/reference/base/session)).
It is additional to the four previously reviewed staging scopes unless already granted.
No consent was requested/granted and no manifest was edited. Confirm the private
project's current grants, obtain separate owner approval for this narrow scope if
absent, and STOP if any broader permission is requested. No production scope changes.

## Independent encrypted recovery

`encrypted-backup.cjs` authenticates an independent export using AES-256-GCM and an
injected256-bit key. The high-water generation is cryptographically authenticated
with the ciphertext; relabeling an older export fails authentication. That key must live in the owner's existing secure key store,
separately from ciphertext; there is no default key, source secret or Actions secret.
`local-state.cjs` writes restricted0600 encrypted exports outside the repository in owner-only
Application Support (repository paths require an explicit fabricated-test opt-in),
verifies decrypt/read-back BEFORE promotion, and retains the previous encrypted copy.
Wrong keys, modified ciphertext, private-field extras and partial writes fail closed.

Fabricated tests demonstrate loss/corruption of primary, recovery from the latest
Google-style backup, rejection of older generations and recovery from authenticated
independent ciphertext with the EXACT same IDs. Real Google primary/backup and secure
key provisioning are NOT yet performed. The existing23 real IDs remain unchanged in
the prior restricted ignored development file. An ignored local file alone is not
being represented as a durable production store.

## Refresh preparation (no unattended installation)

`refresh.cjs` coalesces explicit preparations; default is DISABLED. Publication is
hard-disabled. It accepts injected private registry, independent backup/key access,
a fixed reviewed dashboard4 reader, approved roster and restricted archive.

On each preparation it requires fresh source validation, configured272-game/18-week
structure, existing approved roster and eligible historical coverage; compares against
the last good snapshot's season/revision/slate and records; privately persists IDs and
verifies recovery; then stages/scans/seals the exact38-file local public candidate.
Only after validation does the last-good archive advance atomically. Invalid, stale,
incomplete or failed generations leave last-good history unchanged, without extending
its freshness. Already-approved historical records remain privately preserved even
when a new generation fails. No source or private map is sent to GitHub/Pages/Actions.

Cadence metadata is6h, with a2-minute preparation lead before score expiry to allow
source latency/verification. There is no timer, Google trigger, polling loop or upload
in this module. Connecting the owner publisher to the live private registry and secure
key store must be verified after private setup; do not substitute a stand-alone local
map or a self-asserted readiness flag. No unattended job is installed. Existing3.0
ESPN/Form triggers remain the only production automation. Static/browser failures
never fall back to an API in a way that bypasses disclosure.

## Exact next authorized setup (requires permission approval first)

1. Privately verify the EXISTING staging project is separate from production, editor
   ACLs are owner-only, and saved source/access settings are preserved. No new project
   or web-app deployment. Add only prepared OwnerIdentityRegistry.gs to that project.
2. Obtain separate approval for userinfo.email if not already granted. Never modify
   production API18, its manifest, URL or deployment. Configure the helper privately
   with enabled:true, ownerOnlyEditorReviewed:true and the actual ownerEmail. No real
   configuration belongs in Git or public packages.
3. Supply the unchanged existing23-ID map privately as the helper's namespaced
   BOOTSTRAP property. Initialize once via the private editor entry; inspect only the
   safe23-player/generation/backup receipt. Verify read-back privately, then keep the
   helper disabled outside the owner setup/recovery operation. Never dump Properties.
4. Provision the independent backup key in the owner's existing secure store; create
   and decrypt-test an encrypted recovery export, comparing IDs privately. Confirm
   durable Google access, recovery/key availability and the owner's publisher bridge
   before scheduling. No private configuration/mapping can enter a workflow artifact.
5. Prepare a fresh real candidate locally using the existing map/approved policy,
   confirm parity/security and request FINAL real-static Pages activation approval.
   Existing Pages workflow remains api-only/synthetic; no static publication or new
   job is enabled here. Owner approval remains necessary to publish real snapshots.


## Initialization authorization / current actual state

The owner has approved installation and the exact userinfo.email scope effect. The
reviewed disabled helper is now installed in the EXISTING private staging project;
all original source/manifest/deployment/access settings are unchanged, production18
is unchanged, and no registry operation has run. Current project scopes are inferred;
adding this helper introduces owner-email access but no unrelated service. Native
browser control is unavailable and the staging endpoint requires owner browser
authorization. Follow the private OWNER_ACTION.md outside the repository; the current
checkpoint records the exact consent action. Do not request the same scope approval
again or claim cloud initialization before execution/read-back actually succeeds.

Actual23-ID local recovery is verified. The real mapping and encrypted exports now
live outside the repository; Keychain holds the key. The former ignored development
map is only a fail-closed tombstone, preventing accidental replacement-ID generation.
This local result is NOT proof that the Google primary/backups have been initialized.
