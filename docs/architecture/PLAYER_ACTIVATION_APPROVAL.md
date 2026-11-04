# Existing-system player activation — one owner checklist

Prepared from develop 61be980; implementation remains 619d1de. Local/reference
inspection only. API 17 and published results-only Pages are unchanged.

## Verified facts; no new owner decision needed

- The official Form is dynamically resolved from the existing Sheet by
  `PP_getLinkedForm_` (`50_Form_Weekly_Setup.js:1031–1036`). No canonical responder
  URL literal exists in the inspected original source, saved baseline/editor/private
  activation configuration or reference workbook. Do not turn an administrative
  URL/ID into a guessed responder link. An authorized metadata read can retrieve
  the linked Form's published URL; no new Form or owner Terminal diagnostic is needed.
- Normal scheduled close checks `isAcceptingResponses()` before recording CLOSED
  (`50_Form_Weekly_Setup.js:367–425`); manual close also verifies it (:988–1022).
  Current-week markers exist in Form Control Status/Updated and Script Properties
  PP_ACTIVE_WEEK/PP_FORM_STATUS. They are corroborating records, not immutable
  historical closure proof: other repair/manual paths exist, and current status
  can change. Form Control is cleared/replaced (:746–782), status updates replace
  its timestamp (:785–790), and properties are overwritten for the next week.
  The API reads only the current row (`20_Data.js:174–236`). No local historical
  closure archive was found; execution-success logs may corroborate a specified
  week if retained, but have not been accessed. FINAL scores, old weeks, trigger
  presence and deadlines never substitute for verified closure.
- Players Phone/Display Name is the existing private join/label registry
  (`20_Data.js:97–116`). Legacy first-name/last-initial formatting is at
  `40_Cache_Helpers.js:202–212`; it does not grant publication approval.
  Ignored `tmp/player-activation-review/aliases-review.private.json` contains 23
  local-reference draft labels, no phone values, all approved:false, and five
  repeated draft labels. Redacted phone values prevent identity reconciliation;
  they are intentional, not a production defect. Drafts are not API configuration.
- The local reference has coherent FINAL results for M1 weeks 1–4 (64 games) and
  M2 weeks 5–8 (57 games); later periods are unfinished. All five configured periods
  use NEW rules, 50/50 monthly/season shares and Include In Season YES. These are
  dated reference facts, not live finalization decisions or winner assertions.
  Designated weeks 4/8 games are FINAL; stored tiebreak Actual Total is blank.
  Use their coherent Results scores, as the existing resolver already does.
- Prize arithmetic is already specified by `10_Prizes_Scoring.js:14–38,45–100,
  121–137`: existing active-player count/override supplies weekly pot; FINAL perfect
  weeks pay the computed weekly share; NEW finalized no-perfect weeks roll over;
  configured shares fund monthly/season pools. Re-read and reconcile these facts,
  rather than asking the owner to recompute each amount. Weekly Prize Results
  winner/finalized columns are not authority in its reader (`20_Data.js:266–295`):
  source scoring determines them. Monthly payout zeroes are placeholders (:95–100),
  and season payout structure is unspecified (:156). No settled payment is established.

## Owner checklist — only unresolved permission or judgment

- [x] Owner authorized ONE bounded private read/review of existing linked Form published
  URL/current acceptance state, current Form Control, Players join/display columns,
  Results, configured Prize/Tiebreak Rules, necessary Weekly Prize Results count/
  override fields and approved weeks' response timestamp/join/pick/prediction fields.
  No writer/setup/sync/trigger function, permission expansion, unrelated notes or
  raw public response. Retrieve facts automatically; report only validation counts.
- [ ] Privately approve exact unique display aliases after checking actual private
  joins. Review the ignored drafts locally; do not post names/phones in chat/Git.
  Approve historical CLOSED weeks using retained positive closure evidence if
  available; otherwise explicitly attest the relevant weeks and resolve any reopening
  ambiguity. Do not approve all older weeks merely because time passed. Unproven
  weeks remain withheld. Existing 120-second freshness/revision gates remain:
  static approval records must expire, never acquire fabricated fresh timestamps.
  A retained history/reverification source must be established before claiming
  persistent disclosure is ready; none was independently verified in this task.
- [ ] Approve publication scopes for verified standings/picks/votes/champions and
  existing calculated pools/weekly allocations/rollovers. Completion, amounts and
  score comparisons should be verified from source facts in the authorized read,
  not supplied as guesses. Owner judgment is needed only for unresolved equal-distance
  ties, identity/alias conflicts, accounting exceptions or facts absent from records.
  Keep all payment states UNKNOWN and unsupported distributions unavailable.
- [ ] After evidence and private parity/security checks pass, authorize ONE controlled
  additive release using existing API/URL and Pages api profile, preserving editor
  backups, routes/writers and rollback version 17. No release is authorized by this
  checklist itself; no further redesign/infrastructure work is needed. Abort on
  failed checks; reopen only the specific unresolved exception for owner decision.


## Authorized verification outcome — 2026-11-04

The owner approved the bounded read. Do not request the same read authorization
again after access is restored. No upload, permission expansion or publication was
approved. Existing JSON API comparisons succeeded; direct Sheet/Form work is partial.

- Existing prizes/overall and weeks 1–9 reconcile: 23 unique API display labels;
  overall versus prize overall MATCH; season versus summed weekly totals MATCH;
  all five monthly aggregates MATCH. This is label-level consistency, not verified
  private phone identity parity or a quiescent-source/fresh-score guarantee.
- M1 results are complete with one points leader. M2 results are complete with two
  leaders and a decisive combined-score tiebreaker, no equal-distance exception.
  M3–M5 remain incomplete. No names/predictions/winners are approved for publication.
- Weekly pool/override arithmetic, monthly allocations, season contributions and
  confirmed/projected season-pool arithmetic reconcile with existing API facts.
  No tested arithmetic exception; no settled-payment or missing-ledger conclusion.
- Private actual-API alias drafts are in ignored
  `tmp/player-activation-review/aliases-live-api-review.private.json`: 23 labels,
  zero duplicates, six single-part labels that cannot supply a last initial. All
  approved:false. These supersede redacted-reference drafts for display review,
  but they are not verified Players-registry/phone mappings. Do not invent initials.
- Direct bounded Sheets metadata request returned HTTP403 accessNotConfigured:
  Sheets API is disabled for the local OAuth client's project. No rows were
  returned. The existing local grant was inspected without granting permissions;
  it has no dedicated Sheets/Form-body scope. Whether existing drive.file access
  suffices for this target remains unverified because service availability failed
  first. No connected document session is available. Do not enable APIs, expand
  scopes, copy browser credentials, bulk-export the workbook or modify deployment
  to work around this boundary.
- Consequently linked responder URL, actual Players joins, direct historical closure
  records and Form acceptance remain UNVERIFIED. No historical week has been granted
  authoritative CLOSED status. Restore an already authorized bounded Sheet/Form
  metadata connection; any new grant or service configuration needs owner approval.

Remaining owner items are the direct-access exception, approval of the privately
reconciled aliases (including six missing-initial cases), historical closure facts
not established by retained records, and conditional publication/release approval.
Do not ask the owner to recompute verified arithmetic or decide the already-decisive
M2 tiebreaker. Preserve current freshness gates; no automatic static-proof renewal.

## Existing-runtime access diagnosis — resumed from d4f99a5

Read-only management queries confirmed the failure belongs to the **Google-provided
clasp default OAuth client**, selected by initAuth userKey default, not to the
competition's Apps Script runtime. Its client fingerprint is recorded privately;
no client/Script/Sheet identifier or token is recorded here. Do not create a client
or Cloud project or try to fix this by altering the working competition project.

The existing separate 4.0 owner reference has Sheets v4 enabled, exactly the
spreadsheets.readonly manifest grant, and MYSELF / USER_ACCESSING deployment access.
Its only top-level functions are doGet and getPerfectPickDashboard. The RPC is a
sanitized presentation surface, not an arbitrary Sheets reader or metadata executor.
It has no existing published-Form getter or player-identity diagnostic. Reusing its
credentials outside Apps Script or passing extra RPC arguments is not authorized.

The **already-existing isolated staging** project remains MYSELF / USER_ACCESSING.
Its prior owner-approved consent covers spreadsheets, forms, script.scriptapp and
script.external_request. Its source has the existing health/summary/week/overall/
prizes/dashboard4 routes, but no private player-verification entry point. Existing
JSON results cannot reconstruct phone joins or the linked Form's responder metadata.
Do not execute a writer or change production to fill that gap.

Smallest remaining owner action: explicitly authorize a temporary, bounded,
editor-only read diagnostic in that SAME private staging project and ONE owner
execution, using its existing Sheets/Forms grants. Scope: linked Form published
URL/acceptance, Players A:B, necessary response timestamp/private join columns,
current Form Control and specifically identified retained closure records. Private
joins stay server-side; only safe review output goes to the designated ignored
private location. No HTTP route, new deployment, production editor/deployment change,
new OAuth client/project, scope expansion, trigger or writer is required/proposed.
The diagnostic source addition is a remote editor change and is NOT authorized or
performed by the current read-only task. Prepare/review its exact source before any
approved upload. If Google requests new consent, stop rather than grant it.

Until that separate source/one-execution approval, the Form URL/actual registry joins
remain blocked. The existing approved read scope remains valid. Do not repeat scoring/
prize comparisons or ask for a manual M2 decision. The six single-name candidates,
all 23 alias approvals, unproven historical closure and eventual publication approval
remain the same private review items; none was approved by this diagnosis.
