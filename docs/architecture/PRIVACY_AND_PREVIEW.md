# Stage 1 privacy contract and synthetic development preview

## Scope and safety boundary

Stage 1 replaces only the development website's data connection. Existing Apps
Script source, Google services, scoring rules and production automation remain
unchanged. No production adapter is shipped. The preview must never fall back to
live data. A missing/invalid local fixture is an error, not permission to connect.
The eight existing sections and existing visual layout remain in place.

The published six-file artifact is built by `node tools/security/public-artifact.cjs stage`.
Run `node --test tests/*.test.cjs`, then `node tools/security/public-artifact.cjs verify`.
Node 22+ and Chrome are required; no npm packages are needed. Set CHROME_PATH if
Chrome is not at the platform default. Browser absence/failure blocks release.
Serve `.preview-public` on localhost for manual review; never serve the repository
root. The test server binds loopback only. Browser tests intercept external page
requests and fail even on attempted connections. CSP additionally restricts
connections to the same origin, disallows Forms, embeds, and external scripts.
Fixtures use invented aliases; no production records were fetched or transformed.

## Exact publication file allowlist

- index.html
- styles.css
- config.js (synthetic mode label only)
- preview-data.js (one fixed same-origin JSON request)
- app.js
- fixtures/preview.json

The staging scanner rejects unknown files/directories, symlinks, special files,
archives/source maps (not allowlisted), external URL references, known historical
production identifiers, common credential patterns, and alternate network APIs.
Source directories may contain pre-existing empty scaffolding; no additional
source files may enter staging. SHA-256 seals are stored outside the artifact.
After staging, verification rejects changed bytes. Deployment consumes the uploaded
artifact without checkout or rebuild. Scanning is defense in depth, not proof
against a malicious maintainer; protect reviews, workflow files, tests and scanners.

## Public/private classification (future backend contract)

Only explicitly approved, typed properties may be public; reject unknown fields.

Public game fields: season, week, approved matchup/team labels, scores, normalized
status. Public competition fields: period key/label and boundaries, rank, points,
completed games, total picks where approved, perfect-week flag, approved aggregate
prize totals and rule percentages, finalization state, approved public winner aliases.
Public entry-window fields: applicable week, authoritative status, published kickoff
and closing time, public rule text and snapshot generation time. Do not expose
internal property names or identifiers. Accuracy requires an approved denominator.

Player identity: only explicitly approved display aliases and optional opaque public
IDs unrelated to contact information. Never derive aliases from names, phone
numbers, email addresses or hashes of those values. Alias + picks + participation +
winnings remains identifying within a group; public disclosure must be deliberate.
The Stage 1 approved synthetic aliases are Synthetic Comet, Synthetic Harbor,
Synthetic Maple and Synthetic Orbit. All are invented, not real player mappings.

Conditional public data: individual picks, per-team vote percentages/counts,
submission counts, prediction-submitted indicators, tiebreak predictions and errors.
Release these only after the applicable Form entry window is officially CLOSED.
A passed clock deadline, game kickoff, a missing status, or an assumed old week
is insufficient confirmation. Unknown/open/upcoming state fails closed. All
response paths, summaries, aggregates and caches must obey this rule. Do not
include concealed values in HTML, JSON, hidden DOM, downloads or logs.

Always private: phones, email, raw response objects/exports, submission IDs and
submission timestamps, internal identity keys, automatically derived real names,
registries/contact mappings, administrative notes, payment details, credentials,
production Script/Sheet/Form linkage, Script Properties and trigger identifiers.
Do not pass through entire spreadsheet/configuration objects. Explicitly construct
public response objects and validate string values as well as property names.

## Stage 1 enforcement versus future production enforcement

Fixtures physically omit player standings/picks for non-CLOSED weeks; both fixture
validation and UI rendering reject/withhold disclosure. The fixed adapter validates
all data before returning any response. Fixture labels are restricted to approved
constants, numeric values are bounded, and aliases are an exact allowlist. No query string, storage flag or configuration
can select live services. CSP permits same-origin fixture loading only; it is not
an authorization mechanism. Current production API privacy behavior is NOT changed
or certified by this work. Frontend hiding cannot secure a production API.

Before production integration: authorize an isolated backend change, implement
strict server-side public projections and authoritative closure checks on EVERY
endpoint, suppress all pre-closure derived voting/participation data, use approved
aliases, reject unknown fields/values, scope caches to disclosure state and invalidate
on state changes. Test open/closed/unknown/missing state, malformed submissions,
free-text leakage, alternate endpoints and cache transitions. Validate actual
Google sharing settings/deployment parity without copying private records into
fixtures. Obtain explicit production integration and release approval.

## Repository exposure record (values intentionally omitted)

Local audit of main/develop: production spreadsheet identifier remains in
apps-script/src/00_Config_Setup.js:22. Production API URL remains in the old
website/config.js history (frontend import 44b7d50). Script linkage was introduced
in apps-script/.clasp.json in deb6666 and removed in 7e6f0c4; its identifier remains
reachable in both branch histories. These are infrastructure identifiers, not
OAuth credentials. No credential or raw-player-data exposure was confirmed by
local scanning. Remote visibility, copies, historical artifacts and access logs
remain unverified. The Stage 1 scanner reads local history without logging values
and blocks those known identifiers in the publication artifact. Failure to read
required history blocks verification. No history rewrite or credential rotation
is authorized or performed.

## Owner-only GitHub configuration and release checklist

Intended repository visibility: PRIVATE. Intended eventual Pages visibility:
PUBLIC only with explicit approval, subject to account/organization plan support.
Do not assume private repository access protects a public Pages artifact. Confirm
hosting capability before enabling Pages; choose another approved hosting option
if necessary rather than making the repository public.

Owner must manually:
1. Review existing exposure and change repository visibility to private if needed.
2. Configure Pages for GitHub Actions; do not dispatch until release approval.
3. Restrict github-pages environment to develop, require an independent reviewer,
   prevent self-review and disallow administrator bypass where supported.
4. Protect develop/main, require reviews and security checks, disallow force pushes,
   and review workflow/scanner/test changes. No direct main development.
5. Restrict Actions permissions/actions; pin reviewed action revisions to immutable
   SHAs before release (current major tags require owner review/update).
6. Enable available secret scanning/push protection; assess historical artifacts,
   forks/caches and Google sharing/deployment settings separately.
7. Review exact staged artifact and passing evidence, then explicitly approve a
   public release. Local success alone does not authorize deployment.

Workflow is manual, develop-only, validation job contents:read, deployment job
pages:write/id-token:write, no persisted checkout credentials. No production
secrets are needed. The deployment job has no checkout/build steps. Environment
approval must be configured remotely; YAML cannot create the required reviewer.

Publication readiness requires all offline/security/browser checks passing on the
exact sealed artifact, verified owner settings and plan support, action revision
review, and explicit release approval. No deployment, visibility change, commit,
push, production request or backend mutation is part of Stage 1.
