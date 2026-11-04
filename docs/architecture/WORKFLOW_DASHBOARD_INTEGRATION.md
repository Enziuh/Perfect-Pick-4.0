# Official Form / read-only dashboard bridge

Implemented locally and exercised with fabricated inputs only. This is NOT a
live website connection, an approved snapshot export or a public endpoint.
Public Pages remains the same six-file synthetic-only build. No real comparisons,
Google reads, uploads, OAuth authorization or deployment occurred.

## Working components

- website/index.html and styles.css: prominent accessible Submit Picks control in
  the existing deadline card. Default disabled, with an unavailable explanation.
  No Form URL is in public configuration, DOM, fixtures or assets.
- tools/presentation/form-entry.cjs: accepts exactly url/verified/approvedForPlayers.
  Only an owner-verified canonical HTTPS player view path, fresh official OPEN
  entry evidence and explicit freshness budget can create an enabled link.
  Administrative/edit paths, short redirects, alternate hosts, credentials,
  prefilling/query strings, fragments and unknown/closed entry states reject.
  No link is fetched, guessed from a Form ID or automatically approved.
- Approved local configuration inspection found NO canonical player-facing URL:
  apps-script/config contains no usable URL configuration; the imported setup
  reference contains no player view URL. No backups, private submissions, remote
  resources or Form IDs were used to infer one. The owner must privately supply
  the official canonical player-facing published URL and affirm it is the existing
  official entry Form and approved for player navigation. Do not commit it or
  paste private administrative URLs/IDs into the checkpoint. Short links need
  independent owner resolution/verification, never automatic redirect following.
- tools/presentation/contract-dashboard.cjs: strict v1 validation BEFORE producing
  the existing app's view objects. Approved aliases, ranks/points, FINAL-only
  states, basis-point votes, monthly decisions and accounting are copied from
  validated authoritative records, not recomputed using synthetic identity rules.
  All NFL team abbreviations map to local display names/team styling. Explicit
  activeWeek is required; it is not guessed from the highest week or elapsed time.
  Unknown money remains null; confirmation and payment remain separate. Monthly
  resolution comes from the shared validated backend decision, not a second winner
  algorithm. The existing comparator emits fixed checks/states, never values/names.
- tools/presentation/private-dashboard.cjs: in-memory private owner assembly of the
  five-destination interface, preserving local styles and navigation. It creates
  NO listener, endpoint, file, deployment or snapshot download. Asset payloads are
  intended only for an authorized owner process, not Pages; the ordinary publication
  gate rejects this adapter because it is not the fixed synthetic fixture loader.
  No real-data transport, browser API selector, URL override or storage setting
  has been added to the published website.
- createOwnerDashboard(loadPrivateConfig,getSheets,clock,context) wires the native
  connector to the validated model/assembly through an in-process consumer. Context
  requires authorizedPrivateInspection:true and explicit activeWeek. These are
  trusted process inputs, NOT authentication from a request. The caller must be
  independently owner-authorized. It returns report plus assets in memory only;
  no valid READY projection means no assets. A second attempt cannot reuse assets.
  getSheets is the existing native/injected read-only namespace, not a service with
  a new token/scope. The shipped Apps Script entry deliberately supplies NO consumer
  and therefore still returns diagnostics only. The Node asset assembler is not
  part of Apps Script or Pages and is not a newly enabled remote transport.
- Existing coordinator now permits a trusted in-process consumeValidated callback
  ONLY after strict public-contract validation. The native connector forwards it
  when privately constructed by the owner process; raw Sheet rows, private target
  or identity keys never reach it. Default packaged entry cannot accept a callback
  from arguments/globals/config. No web handler, export action, triggers or writes.

## Disclosure, lifecycle and rollback

CLOSED and available picks/votes are distinct. A CLOSED week can still be WITHHELD
for absent alias/completeness evidence. Such weeks have no player controls,
selections, predictions, counts or voting bars and never say 0 submissions/votes.
An explicitly AVAILABLE empty selection set can show genuine zero votes. Before
closure there is no synthetic/real placeholder data standing in for private picks.
The browser contract adapter does not fetch anything. It expires at the earliest
snapshot/result freshness limit or CLOSED-evidence validity; expired private pages
clear their content and require reverification. This is defense in depth, NOT a
server revocation mechanism or a reason to publish stale embedded data. Independent
reopen/revocation/access controls remain mandatory for any eventual public transport.

Private data mode says Owner Verification / validated snapshot, never a live feed
or synthetic data. Normal Pages remains prominently Synthetic Preview. No live
failure falls back to synthetic data under the same identity. Invalid/unavailable
snapshots are rejected before assembly, with no previous private page reused.
Rules/FAQ remain accessible; no custom submission experience is implemented.

## Verification and deployment sequence — separate approvals remain required

1. Privately provide/approve the canonical official player URL. Do not read a real
   Form just to discover it without separate owner authorization. Link publication
   is not implied; current synthetic artifact intentionally keeps the disabled state.
2. Follow FIRST_LIVE_VERIFICATION.md's exact owner-only target/grant/config review.
   Separately authorize source-only upload of Verification.gs and appsscript.json
   from tmp/verification-upload, after package verify and documented Node preflight.
   Local .clasp.json is ignored config only. Do NOT deploy an API or use legacy src.
3. Separately authorize one STRUCTURE execution/OAuth review under the existing
   read-only scope. Inspect only the redacted report; disable activation afterward.
   Confirm actual coordinates, source timezone and timestamp/join representation.
4. Establish credible independent capture revision/completeness/quiescence authority,
   explicit alias approval and authoritative historical CLOSED/reopen evidence.
   Fresh timestamps, repeated equal reads, guard cells or configured numbers alone
   do not prove these. Obtain separate authorization for exact bounded VERIFY read.
5. In an independently authorized private process/runtime, use the validated consumer
   to feed dashboard model/owner-only asset assembly. Review data privately and
   compare independently normalized SAME-REVISION 3.0 and 4.0 values with comparePublic.
   Scores/rankings/prizes/champions each report MATCH/MISMATCH/NOT_COMPARABLE. A
   separately approved champion oracle is required; the old monthly payout placeholder
   is not an oracle. No baseline was accessed and no real MATCH is claimed here.
   Missing-pick denominators, absent actual scores, missing payment/accounting and
   manual/unresolved ties remain explicit differences, never forced production edits.
6. Before ANY real browser transport or snapshot is exposed, independently verify
   authentication/access, private hosting, DTO allowlisting, freshness/revocation,
   CLOSED/alias gating and browser/CORS behavior. The connector-to-consumer interface
   is implemented; remote delivery/access enforcement and a real normalization/parity
   baseline remain unverified and are NOT enabled by the private assembler. No
   JSONP, arbitrary public fetch or anonymous API is introduced to bypass this gate.
7. Only after reviewed parity/privacy and NEW publication approval, prepare a
   separately reviewed live deployment artifact/transport. Do not broaden the
   current six-file synthetic gate or switch its data source to publish real data.
   GitHub Pages deployment itself requires NEW explicit authorization. Keep the
   sealed synthetic build as rollback. Restore return null in the owner-private
   provider and stop private sessions on any mismatch; do not alter production data.

Current limits: official Form URL absent; no real coordinates/closure/alias/capture
or score/payment parity verified; no authenticated browser transport/public API.
Production 3.0 continues owning scoring updates, Form control, prizes and triggers.

The existing native VERIFY mode remains CLOSED-only for requested weeks. The UI
bridge accepts validated OPEN/UNKNOWN outputs safely, but an actual OPEN-week
results/control read plan must be reviewed before enabling that future transport.
No fresh OPEN authority is invented from a deadline, and the Form link cannot be
enabled by a self-asserted OPEN field in a candidate JSON payload. Its independent
trusted entry must match and remain fresh; private-page lifetime includes that
entry's checkedAt budget and validity.
