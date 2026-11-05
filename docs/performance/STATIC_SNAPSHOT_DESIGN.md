# Local static snapshot candidate

## Status and boundary

Local fabricated prototype only; live Pages remains e6e3e92 using unchanged API18.
No real snapshot, private map, endpoint, phone, registry, credential or new workflow
configuration was committed. No Apps Script/Sheet/Form/trigger/OAuth change.
`node tools/snapshots/benchmark.cjs` runs a loopback-only fabricated comparison;
`node --test tests/static*.test.cjs` runs focused checks (Chrome required).
The existing manual Pages workflow has no static profile and cannot publish this
candidate accidentally. The existing api profile remains the tested fallback/rollback;
there is no runtime fallback that bypasses failed static disclosure validation.

## Public contract / exact projection

`PP4_STATIC_V1` has exactly `schema`, `generatedAt`, `expiresAt`, `payload`.
Payload retains the exact PP4_JSON_V1 contract: schema, activeWeek, allowlisted
control/deadline context, independently verified responder Form link or null,
approved alias/public-ID pairs and the original public snapshot. `schema.cjs`
explicitly enumerates every allowed nested field; original strict decode runs
before projection and after identity replacement. It rejects unexpected fields
rather than silently copying them. No raw rows, private identities or source
reference can enter the output. Public fields include:

- Games: safe game key/week/team codes/kickoff or null/status/numeric scores or null/
  authoritative winner/verification time. No score or kickoff invention.
- Weeks: explicit official entry evidence, and only eligible CLOSED picks, combined-
  score predictions, recomputed/validated vote counts and basis-point percentages.
  Unknown/OPEN/missing/expired evidence omits protected values at the source boundary;
  a malformed source that includes them is rejected entirely.
- Weekly/monthly/season tables: scope, coverage, availability/reason, approved random
  ID/alias, shared rank, points, completed submitted FINAL picks, totalPicks, accuracy.
- Monthly decisions: completion/state, designated game, points-first champion or null,
  finalized total, method and eligible prediction/difference comparisons. All player
  references are replaced, including winners, comparisons and prize allocations.
- Prizes: original validated pool/estimate/rollover/funding/approved allocation fields.
  Missing money remains null/unavailable;23-participant estimates remain estimates.
  Existing paymentState UNKNOWN compatibility fields are not new payment tracking.

Initial single snapshot file avoids duplicated records and preserves whole-snapshot
standings/monthly/prize reconciliation. Current compressed fabricated JSON is small;
splitting would require independently verifiable partial-scope contracts, so it is
not introduced without a measured need. The existing UI still defers inactive views,
player details and matrix construction. All32 original SVGs remain same-origin.
Local static artifact has exact38 files: existing frontend/logo files excluding the
unused synthetic fixture, plus data/snapshot.json. CSP connect-src is self only.
The separate integrity seal lives outside that artifact. No source maps, symlinks,
extra directories, archives, mapping files or unexpected assets are accepted.

## Independent public identities

The private publisher consumes the sanitized API action, not Responses/Players or
phones. A source player reference is treated as a private opaque join, never exposed
in static files. `crypto.randomBytes(16)` generates128 independent random bits; no
hash, name, sequence or source-derived input generates public IDs. Collisions and
collisions with source keys are fatal. One mapping persists each public ID. Every
subsequent generation reuses it. Explicit verified private rekey handles a reconciled
cross-season source-key change without changing the public ID. Never join by name.
Old source keys must be removed from the reviewed current roster after a rekey;
coexisting ambiguous keys block publication rather than inventing identity continuity.

Prototype map storage is Git-ignored tmp,0600, with no symlink traversal and atomic
writes before exposing even a local generation. It is NOT production-durable.
A production registry must be owner-only, encrypted/backed up, restore-tested and
available to the authorized publisher across restarts/seasons. Proposed smallest
activation: use an owner-controlled backed-up private store on the publishing
computer; existing public dashboard4 needs no additional Google credential. Only
sanitized artifacts go to GitHub, never the store or raw source. Confirm existing
GitHub publisher authorization separately; do not create credentials automatically.

## Freshness, irreversible disclosure and schedule blocker

Current proof/snapshot lifetime is at most120s. The prototype validates actual source
and game timestamps and entry validUntil; it never rewrites them or renews proof.
An expired or older-revision static file fails closed; old success survives a failed
refresh only until its original expiry, then all protected/hidden content clears.
No persistent player cache/service worker exists. A page coalesces one same-origin
request; retries are bounded at3, with400/1200ms backoff and10s per attempt. No Google
request is made by the static browser. Manual/return-from-background/six-hour refresh
are available; expiry does not cause aggressive120s publication or API polling.

Display expiry cannot remove a copied/cached public JSON file. Consequently this
candidate is NOT ready for real publication or unattended four-daily use until the
owner explicitly authorizes an irreversible retention policy for selected approved
CLOSED historical scopes, or excludes protected player data entirely. Do not treat
existing short-lived API evidence as indefinite static-publication permission.
A future retention decision needs a reviewed independent static release record and
finite score/display-freshness rules; the current API contract must remain unchanged.
Do not use static picks for a scope requiring immediate revocation/reopening privacy.

After those decisions and tests: proposed cadence is every6h, following existing3.0
score updates where their times are known, using already-updated dashboard4 only.
No writer execution, new Google scopes or trigger. Skip invalid/partial/stale captures;
retain the last good generation without extending its authority. Generate to a new
immutable directory; validate the entire public artifact/seal immediately before a
separately approved Pages upload. No private mapping crosses that boundary. No such
schedule/upload is enabled now. Existing public API site remains the rollback.

## Exact activation approvals remaining

1. Authorize/verify durable, backed-up owner-only identity storage and the existing
   authorized publisher's access; keep its private roster/map outside Git/GitHub.
2. Decide whether selected approved CLOSED weeks may be irrevocably retained in
   cached public static files. Define which weeks and retention/display lifetime;
   future OPEN weeks always absent. Otherwise use results-only static publication.
3. After that implementation is tested, approve a bounded real capture/parity check,
   sanitized artifact review and final static-profile Pages activation. No production
   Apps Script update is required. Never bundle these approvals into OAuth or writers.

## Completed private real-source validation

After fabricated checks, one bounded existing public dashboard4 read was privately
projected against the existing23-record owner-approved alias roster. All six dashboard
model groups matched exactly;272 games/121 FINAL,8 eligible CLOSED weeks and10
undisclosed scopes. Random IDs and the sanitized development generation stayed in
Git-ignored restricted local storage. No phone/registry read or credential grant was
needed. This resolves basic source/model compatibility; it does not establish durable
production storage or extend120s disclosure authority. Reuse the development IDs when
migrating to the separately authorized durable store. No real publication performed.
