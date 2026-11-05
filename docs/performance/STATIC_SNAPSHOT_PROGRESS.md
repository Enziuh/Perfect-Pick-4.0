# Static snapshot progress

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
