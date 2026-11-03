# Future 4.0 integration contract — requirements, not implemented

No live adapter, submission form, production change or deployment is authorized by
Phase 4. Existing Google Form, linked Sheet, triggers and Apps Script remain intact.
The synthetic schema is not permission to copy the current API into public hosting.

## Read API acceptance criteria

Provide a versioned, internally consistent snapshot: schema version, season/week,
period boundaries, generation time, freshness/error state and snapshot revision.
Explicitly project public fields server-side; reject unknown fields and unsafe
labels. Use approved aliases only, never names derived from contacts. Any opaque
public player ID must be independent of private identity/contact/submission keys.
Phones, emails, raw submissions, submission IDs/timestamps, administrative/payment
notes, credentials and private infrastructure identifiers are never public.

- Games: unique matchup identifier, approved team labels, authoritative kickoff,
  explicit normalized game status and score availability. Only FINAL coherent
  scores determine correct picks; distinguish unavailable scores from zero.
- Entry windows: week-bound official OPEN/CLOSED/UNKNOWN/UPCOMING status, server
  deadline with time zone and snapshot revision. Only exact official CLOSED
  releases picks, predictions, submission/selection counts or voting. Omit these
  fields before closure, including derived aggregates, caches, errors and exports.
  Unknown/stale closure evidence fails closed. Clock expiry alone never releases.
- Players/picks: approved aliases, validated selected team/matchup, submission
  eligibility and valid prediction availability after closure only. Private
  identity mappings stay server-side. Authoritative resubmission selection must
  precede scoring; duplicate/invalid submissions cannot inflate voting.
- Rankings: authoritative weekly/monthly/season points, shared ranks, completed
  FINAL games and approved participation totals. Accuracy is correct / FINAL
  completed games, zero denominator unavailable. No tiebreak changes points/ranks.
- Monthly decisions: inclusive period completion, all required FINAL evidence,
  designated game and combined score, eligible tied-first predictions, absolute
  errors and explicit decision status. Equal closest predictions remain unresolved;
  no eligible prediction cannot award a champion. Manual decisions require a
  private authorized audit trail and an approved public outcome/revision, never
  exposing the administrative notes. Reconcile the shared frontend resolver with
  backend contract tests before replacing synthetic data.
- Accounting: currency/unit, authoritative pool amounts, confirmed versus projected
  basis, weekly allocations, monthly/season shares, rollover source/destination,
  finalization/revision and payment state separate from champion state. Distinguish
  unknown, pending, approved allocation and paid with explicit evidence. No missing
  amount defaults to zero; no winner/rollover/payment inferred from placeholders.
  Publish only approved aggregate allocations/payment state, never transfer details.

Test every endpoint and cache path with open/closed/unknown/stale/malformed data;
prove no concealed data in JSON/DOM/logs. Use synthetic/sanitized contract fixtures
in an isolated nonproduction backend, no copied private submissions. Review real
sharing/access configuration separately. Integration requires explicit authorization,
backend privacy enforcement, versioned adapter review, all security/browser gates,
artifact inspection and separate publication approval. Preview must stay synthetic
until those conditions are satisfied; never add a query/storage fallback to live.

## Future custom Submit Picks — separate approved implementation required

No Google sign-in or player accounts. Use a private high-entropy invitation code
or single-purpose invitation link, issued/revoked by an authorized administrator.
Server stores a token hash and private participant mapping; approved public alias
is explicit. Invitation values are credentials, never bundled in browser assets,
fixtures, source control, analytics or public API responses.

Exchange invitation proof for a short-lived Secure/HttpOnly/SameSite session;
avoid persistent query-string credentials, referrer leakage and logging. Apply
server-side authorization on every read/write, HTTPS, CSRF protection, rate limits,
expiry/revocation, replay controls and generic errors. A bearer invitation provides
possession-based access, not proof of real identity; document that limitation.

Server validates the applicable week, allowed matchups/teams, complete selections,
prediction type/range and official deadline using server time. Atomically accept
or reject submissions; enforce idempotency and an explicitly approved resubmission
policy (which accepted revision counts, cutoff behavior, confirmation/recovery).
Client clocks, hidden inputs and frontend checks cannot authorize writes. Return
minimal private confirmation; never expose another player's entries. Store private
submission/audit data outside public projections. Server-side secrets only.

Before implementation owner must approve invitation delivery/recovery, resubmission
rules, eligibility/abuse handling and isolated storage migration. Do not silently
change existing Form or Sheet structure. Preserve the existing Form unchanged until
a separately authorized migration, parallel verification and rollback plan pass.
