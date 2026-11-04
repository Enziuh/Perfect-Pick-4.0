# Owner-only testing reference

Final frontend hosting is GitHub Pages using the existing Apps Script JSON API.
See [GITHUB_PAGES_API.md](GITHUB_PAGES_API.md) for the implemented final transport
and narrow compatible API addition. The HtmlService profile below is retained
only as a private testing reference; do not create another deployment for it.

The existing five-destination UI is packaged for the **separate 4.0 Apps Script
project**, using its already installed Sheets v4 service. HtmlService serves the
same frontend; `google.script.run.getPerfectPickDashboard()` returns the existing
validated dashboard model. This avoids a public JSON endpoint, JSONP, CORS proxy,
client credentials, or private Sheet configuration in browser assets. GitHub
Pages remains the unchanged synthetic transport/rollback; it does not fetch real
data. No additional competition engine, CSV preview, or score updater is used.

## Owner activation (approval required; not executed by development tools)

1. Locally run `node tools/presentation/package.cjs stage` then
   `node tools/presentation/package.cjs verify`. The generated package/seal and
   `tmp/presentation-upload` are ignored. Upload inventory is exactly
   `Verification.gs`, `appsscript.json`, and ignored local `.clasp.json`; only the
   first two are Apps Script source. Confirm the ignored target equals the
   owner-verified separate **4.0** project and rootDir is `.`. Never upload from
   `apps-script/src`.
2. Approve replacing the previous diagnostic-only package in that separate
   project with this presentation package. From `tmp/presentation-upload`, the
   owner may run `clasp push` **only after this explicit approval**. Source is
   disabled by default; upload alone cannot read a Sheet. No upload was performed.
3. In the remote editor only, replace `loadPresentationConfig`'s `return null`
   with the following private configuration. Never copy the populated provider
   into Git, a generated shared artifact, or the public frontend.

```js
return {
  enabled: true,
  ownerAccessReviewed: true,
  readOnlyGrantsReviewed: true,
  target: '<OWNER_PRIVATE_SPREADSHEET_TARGET>',
  timeZone: '<OWNER_CONFIRMED_IANA_TIMEZONE>',
  season: 2026,
  expectedGameCount: 272,
  maxAgeMs: 21600000,
  form: null,
  authority: null
};
```

4. Review advanced service Sheets v4 and the **sole** OAuth scope
   `spreadsheets.readonly`. Verify no triggers, libraries, legacy writers or
   additional deployments exist. Separately approve the first dashboard read and
   owner-only web-app deployment: **access MYSELF, executeAs USER_ACCESSING**.
   The manifest fixes these settings; the package verifier rejects anonymous
   access. Review the actual deployment dialog/effective grants; stop if the
   platform cannot provide this isolation. Visit the owner-only app to load real
   results. Do not repeat the already successful STRUCTURE/results diagnostics.
5. For Submit Picks, privately supply `form: {url: '<VERIFIED_CANONICAL_PLAYER_URL>',
   verified: true, approvedForPlayers: true}`. Only a canonical published
   `docs.google.com/forms/d/e/.../viewform` link is accepted, never an editor or
   unverified short link. The local sources do not establish a verified published
   URL, so the shipped button is disabled. A configured link is navigation only:
   the official Form controls acceptance; unknown status never grants disclosure.
6. Validate real results against 3.0 privately before considering public release.
   A public deployment or publication of any real player information requires
   separate approval/security review. Current owner-only package intentionally
   cannot be used as an anonymous real-data API.

## Reads and disclosure

Results `A1:H400` are read twice and compared; expected game count, exact headers,
FINAL numeric scores and stable output are required. Form Control `A1:A2,C1:F2`
provides current-week/deadline context, **not closure authority**. Prize Rules
`A1:A20,C1:D20` provides periods; Tiebreak Rules `A1:B20,F1:F20` provides the
ending-week designated combined-score game. No player identity tab, notes,
Ledger, event IDs, administrative columns or raw records are returned.

Protected data reuses `owner-evidence.cjs`, `sheets-read-adapter.cjs`, the existing
projector, contract validator and dashboard bridge. Private `authority` requires:
- An owner-controlled integer revision and approved alias records (private phone
  join -> approved public key and alias), never a submitted-name fallback.
- Independently verified, fresh weekly CLOSED evidence. Elapsed deadlines, older
  weeks and Form Control's reported status cannot replace this evidence.
- Fresh independent quiescent capture evidence: revision, observedAt, validUntil,
  resultRows and responseRows. Also privately configure `responseLastColumn` as
  an integer bound, maximum 1024. Header discovery reads D onward only; the reader
  reads timestamp/phone/approved question columns, never Name. Weeks without
  CLOSED evidence need no response columns and remain withheld. Latest normalized
  phone/week submission, Final-only scoring and shared ranks reuse existing code.
- Existing verified decision evidence for monthly finalization; absent evidence
  cannot award a champion. Partial season coverage is explicitly labeled.

Use the existing documented evidence shapes in FIRST_LIVE_VERIFICATION.md and
LIVE_DATA_CONTRACT_V1.md; all populated mappings remain private. Revoked, stale,
missing or mismatched evidence withholds protected records; it never blocks the
independent scores-only path. Redacted workbook phones are not production defects.
The workbook contains response columns through week 9, not future uncreated Form
questions. Tiebreak question headers use `WK n Tie Breaker`; designated game is
Tiebreak Rules column B, while Question Label is I.

Optional `authority.poolStates` is a Map of approved scope -> CONFIRMED/PROJECTED.
With fresh capture evidence, repeated bounded Prize Rules `A1:A20,C1:H20,L1:L20`
and Weekly Prize Results `A1:C20,G1:G20` reads supply entry/override funding,
NEW-rule rollovers and shares. Payment status remains UNKNOWN; no payment or
monthly allocation is inferred. Unsupported accounting is unavailable. Financial
and identity parity require owner verification before publication.

## Freshness, failure and rollback

On load/manual refresh/return after six hours, the server freshly reads the Sheet.
An open tab refreshes every six hours (approximately four/day); no new server
trigger or duplicate 3.0 sync is installed. Closed tabs perform no scheduled read.
Read timestamps mean capture freshness, not proof of when 3.0 last synchronized
NFL scores. Two identical reads detect changes during capture; they do not prove
source completeness by themselves. Protected capture still needs independent
owner evidence. An invocation exceeding 60 seconds fails unavailable. Bad reads
clear displayed private data and permit manual retry without raw error details.

Rollback: disable/archive the new owner-only deployment and restore the remote
provider to `return null`. The synthetic Pages site remains available. Source-only
re-upload requires rebuilding the sealed package and will reset private settings;
retain settings only in the owner's secure private storage. 3.0, the Form, Sheet,
triggers and existing production deployments remain unchanged.

Offline verification: `node --test tests/*.test.cjs`,
`node tools/security/public-artifact.cjs stage`,
`node tools/security/public-artifact.cjs verify`, and presentation stage/verify.
These prove fabricated data handling/package restrictions, not remote OAuth,
HtmlService behavior or real identity/accounting parity. No new dependencies.
