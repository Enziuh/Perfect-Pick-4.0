# Cloud static publisher — PUBLIC_WRITE investigation; trigger OFF


## Current incident — PUBLIC_WRITE; publication retry/clock remain OFF

Owner entered private token/config and ran the first tick once at11:42AM Pacific.
No snapshot commit was created. develop has no protection/ruleset blocker, but the
original blanket rethrow discarded the exact error. Do NOT diagnose a specific HTTP
status or permission failure from PUBLIC_WRITE alone. Source/registry/privacy/history
checks passed; dispatch had not yet executed.

At19:52Z only the private publisher file was updated with tested, redacted HTTP
classification and finer state/write boundaries. No execution/retry or configuration/
registry/trigger change. API20/editor and all other staging source/manifest/access
remain unchanged.18 targeted tests PASS; new sealed candidate is local ignored
 tmp/cloud-publisher-public-write-fix (source and adjacent seal).

Run **pp4InspectCloudGitHubReadOnly** once in the owner editor and share only its
safe JSON report (GET-only,zero writes/attempts). It does not prove write permission.
Review the existing fine-grained token privately: Enziuh resource owner, only
Perfect-Pick-4.0 repository, Contents Read/write and Actions Read/write. Correct only
missing already-approved settings. No Workflows/Admin/all-repository grant. Never
send secrets or overwrite registry/state. If these settings are already correct,
leave them unchanged and use diagnostic evidence before another write.

After verification/correction, prepare ONE owner-run pp4CloudSnapshotTick. Updated
errors distinguish GITHUB_HTTP_403_TOKEN_PERMISSION_DENIED,401 authentication,409
SHA conflict,422 validation,branch policy/rate-limit and local intent/pending save
boundaries. Raw GitHub responses/headers/request IDs are never logged. Successful
GETs and repository push-role metadata cannot establish fine-grained write access.
[GitHub troubleshooting](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api)
explains permission errors and required-permission headers; headers list endpoint
requirements, not the token's actual grants. The [Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)
requires Contents write; Actions write is used later for dispatch, not this PUT.

Public monitor remains active (main796efdef; first run42278582488 passed). Snapshot
is healthy at current inspection and expiresNov6,4:39PM Pacific; no immediate rollback
required, but refresh/approved API rollback must precede expiry. No first cloud
publication or scheduled publisher execution is verified yet.

## Decision and boundary

Use the EXISTING private Apps Script project that holds the generation1 registry.
Add only CloudSnapshotPublisher.gs. Its owner-created clock runs in Google's cloud;
no Mac, Keychain, browser session, new project, web deployment or public endpoint.
API20 and existing competition writers/triggers remain unchanged.

Google reads the existing `dashboard4&rules=LATE_ENTRY_V1` source inside Google,
validates its contract, maps source references using the existing read-only Properties
registry, then reuses schema/retention/aggregate projection and production policy.
The source response is NOT a durable-public snapshot: in particular it can contain
Week9 selections and private source references. These never cross to GitHub.
Only the resulting PP4_STATIC_V2 public file may cross that boundary. Projection
is byte-equivalent to the existing publisher for equal input/time/mapping.

Protected retention remains **Weeks1–8 ONLY**. Week9/future picks, predictions,
votes and per-game eligibility are absent even if a Form reports CLOSED. Approved
aggregate standings, schedule/results, aliases/random IDs and supported estimated
pools remain. No source scoring is recomputed. No new IDs are generated; missing IDs,
approvals, stale source proof, altered history or unsupported fields block publication.

## Prepared files

- tools/snapshots/cloud-package.cjs: builds/checks an additive, disabled Apps Script
  file; sealed local candidate tmp/cloud-publisher-package-final/CloudSnapshotPublisher.gs.
  Adjacent `.seal.json` stays local. This is NOT a standalone project/clasp root.
- cloud-projector.cjs: pure projection using existing contract/retention logic.
- cloud-publisher.cjs: injected cloud state machine; no import-time execution.
- production-policy.cjs: unchanged production gate shared by Google/local/CI.
- public-monitor.cjs: reads ONLY public Pages JSON; no API/registry/credential access.
- cloud-monitor.workflow.yml: inert candidate, not under .github/workflows.

**Do not clasp-push the one-file folder over the existing project.** Preserve the
entire existing staging editor/manifest and add the single reviewed file. The
current private registry helper may remain disabled: cloud publication uses its
existing storage format through a read-only property adapter, under a global lock.
No registry setter/recovery/initialization method is available through that adapter.

## Smallest activation requiring owner approval

1. Verify existing private-project editor access and back up staging source; add the
   sealed one-file candidate,
   preserve all existing files/manifest and registry Properties. Do NOT touch the
   production API20 editor/deployment. No new Apps Script web deployment is needed.
2. Create one fine-grained GitHub token limited to Enziuh/Perfect-Pick-4.0, with
   **Contents: read/write**, **Actions: read/write**, automatic Metadata: read.
   No Administration, Workflows-write or other repositories. The token can write
   repository contents, not just one file: document this residual capability.
   Store it ONLY in private staging Script Properties as PP4_CLOUD_GITHUB_TOKEN.
   Never put it or private mappings/recovery exports into GitHub Secrets/Actions.
   Choose an owner-reviewed finite expiration; record renewal privately. No token
   has been created or stored yet.
3. Privately set PP4_CLOUD_SNAPSHOT_CONFIG with enabled:true,
   cloudPublicationApproved:true, ownerEmail, existing endpoint, approvedAliases
   (23 existing `{player,alias}` source-reference approvals), and initially
   installPublisherTriggerApproved:false. Reuse established approvals; no name
   inference, new IDs or mapping transfer. Missing config returns DISABLED.
4. Review existing OAuth manifest. Required services use existing approved
   script.external_request, script.scriptapp and userinfo.email permissions. No
   direct Sheet/Form permission is used by this addition. Preserve inherited
   manifest content; if Google requests anything beyond approved scopes, stop.
5. Owner executes pp4CloudSnapshotTick once, then checks the existing Pages workflow
   and a subsequent tick verifies downloaded bytes. First cloud publication is
   intentionally exercised even if initial data is unchanged. Verify all23 IDs,
   historical/Week9 aggregate parity, protected omission and the public file hash.
6. Only after that successful end-to-end test set installPublisherTriggerApproved:true
   and run pp4InstallCloudSnapshotClock. It creates ONLY pp4CloudSnapshotTick every
   15minutes; an existing matching clock is reused, duplicates block. Other triggers
   are neither invoked nor modified. The tick authenticates the effective owner;
   the installer checks both active/effective owner. Installable triggers execute
   as their creator; an active interactive user is not required for a clock tick.
7. For independent expiry monitoring, approve adding ONLY the candidate monitor
   workflow to `.github/workflows/static-monitor.yml` on default **main**. No other
   main change is needed. It checks out develop with contents-read/no persisted
   credentials, inspects public JSON every15minutes, and cannot publish or call
   the raw API. Confirm GitHub failure notifications and Apps Script trigger failure
   notifications reach the owner. The monitor is now installed and its first run passed.

The existing pages.yml stays manual/develop-only. Google commits sanitized JSON to
public-data/snapshot.json on develop using the Contents API with optimistic SHA,
then dispatches pages.yml with profile=static. GitHub receives public data only and
still runs the complete tests, exact38-file allowlist, schema/privacy and seal gates
before upload; the deploy job never rebuilds it. No new runner credential is needed.

## Cadence, crash recovery and monitoring

The Google clock wakes approximately every15minutes. Private state holds due times,
public hashes/commit references and fixed error codes, never responses or mappings.
The existing activity planner selects15min for verified LIVE,30min for verified game
 days,6h otherwise, conservatively30min for unknown evidence. Next due is also at
least30minutes before current six-hour expiry to allow CI/CDN delay. A clock can be
late; neither platform provides an exact-time SLA. Never infer LIVE from elapsed
kickoff or imply a fresh snapshot refreshed the underlying ESPN scores.

After the first verified cloud deployment, unchanged data skips commits/dispatches
only while prior lifetime safely covers the next check. A new generation is needed
before expiry even if scores are unchanged. Underlying score-write time remains
unknown unless API20 provides it; observation, generation and verification are
separate. Immutable public `publishedAt` remains null; never manufacture timestamps.

An exclusive Google lock prevents concurrent writes. Public-only intent is saved
before PUT: after interruption, compare remote public hash/SHA to resume the commit
or retry a failed write. An expired pending candidate is NEVER re-dispatched:
missed-clock recovery obtains a fresh source generation using the same IDs. Missing
dispatch retries on the next clock. Pending CI does
not produce a success receipt. One bounded retry is allowed for failed CI while
freshness margin permits; further failures halt and alert. Success requires CI
success AND a downloaded, valid public snapshot with the exact expected hash.
Unknown state/history/ID changes never silently overwrite the baseline. Source or
network failures preserve last-good deployment and retry at later clock ticks.

Native trigger failures throw fixed labels (no response/error text) so Google's
failure notifications work. Public-only monitor fails for missing/invalid/expired
JSON or less than15minutes remaining. Independent monitor catches a stopped clock,
credential expiry and Pages failures without access to private Google data. GitHub
scheduled runs may be delayed or disabled after60days of public-repo inactivity;
owner notifications must be enabled. No unconditional availability claim is made:
if both providers fail, expired data remains unavailable rather than disclosed.

## Cost and quotas

No paid hosting service is introduced. Repository visibility was read-only verified
PUBLIC with default main; standard GitHub-hosted public-repository Actions are free.
A future PRIVATE change needs billing/Pages-plan review. The public monitor plans
96 short jobs/day; deploys occur only on material changes or required freshness
renewal. Private-repository included usage and overages depend on the owner's plan.
See [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Google's published consumer quotas include20,000 URLFetch calls/day,50,000 Properties
operations/day,90minutes/day trigger runtime and6minutes/execution (Workspace differs).
At96 publisher wake-ups/day, due work uses roughly6–10 HTTP calls/run, under1,000/day
before retries. Six-hour idle cadence usually does4–5 generations/day; live activity
can increase that. A20-second source read across96 runs is32minutes/day before other
work; actual duration/shared account quotas require observation, not a guarantee.
Private registry remains within existing property-size constraints and is not copied.
See [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).

References: [trigger identity/failures](https://developers.google.com/apps-script/guides/triggers/installable),
[workflow dispatch permissions](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event),
[Contents API permissions](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents),
[GitHub schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Disable / rollback

Set private config enabled:false; after approval remove ONLY pp4CloudSnapshotTick's
clock if installed. Leave registry Properties/backups, existing triggers and API20
untouched. Revoke the publisher token if compromised. Pause the monitor separately
if an intentional rollback removes static files. Restore the existing API profile:
`gh workflow run pages.yml --ref develop -f profile=api`; require verify/deploy success
and inspect real site. Known-good API frontend baseline6d1adea. Public snapshot
history/caches cannot be revoked by rollback. No force push/history rewrite.
