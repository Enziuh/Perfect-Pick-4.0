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
