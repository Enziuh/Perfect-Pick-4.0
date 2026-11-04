# 3.0 workbook compatibility — focused implementation

Status: source/owner-layout compatibility implemented and tested with fabricated
inputs; no real workbook values or Google resource accessed. Layout coordinates
below are owner-supplied facts corroborated by the source's header names, NOT a
claim that a live STRUCTURE run succeeded. Redacted example phones are intentional
redactions, never evidence of a production defect. No original 3.0 code executed,
modified, imported into the verification package or used to access Google.

## Source parity and corrected differences

- 20_Data.js:28–65 / 00_Config_Setup.js:37: legacy scans headers using
  PP3.GAME_HEADER_REGEX. 4.0 retains a bounded owner-reviewed column manifest;
  it does not scan full rows or turn arbitrary question text into public fields.
  workbook-profile.cjs now fixes Results A Week, B Game, C Team 1, D Team 2,
  E Winner, F Status, G Team 1 Score, H Team 2 Score; Responses A Timestamp,
  C Phone Number. Name B is excluded. Weekly matchup/prediction descriptors must
  be explicitly supplied for later VERIFY from their real columns after C.
  Existing permuted-column fixture remains an alternate-layout regression ONLY.
- 40_Cache_Helpers.js:258–265: normalizePhone removes nondigits and drops one
  leading 1 only for eleven digits. New pp3-identity.cjs applies exactly that
  private join behavior in PP3_PHONE mode; it does not require ten digits or
  generate public keys. Safe numeric cells are accepted without guessing lost
  leading zeros. Unsafe numeric/object representations reject. EXACT_TEXT remains
  for prior fabricated fixtures; actual owner profile selects PP3_PHONE.
- 20_Data.js:67–94: nonempty game selections establish a weekly entry; greatest
  timestamp wins per normalized phone/week, with later source row winning exact
  timestamp equality. The projector now chooses this entry BEFORE validating its
  selected teams, so a superseded invalid pick cannot poison a later valid entry.
  A bad latest pick still withholds its scope; never resurrect an older entry or
  merge picks from multiple submissions. Blank picks in another week do not erase
  that week's earlier entry. Invalid/ambiguous timestamps still fail closed rather
  than copying legacy parseTimestamp_'s invalid-to-epoch-zero behavior.
- 20_Data.js:97–116 / 10_Prizes_Scoring.js:364–380 / 40_Cache_Helpers.js:202–212:
  3.0 reads Players Phone/Display Name, falls back to submitted Name, and derives
  a public first-name/last-initial label. NONE of those authorizes 4.0 publication.
  Owner-supplied alias approvals use the same normalized private phone key, an
  independently provisioned public key, explicit alias, approved:true and revision.
  Duplicate normalized keys/public keys/aliases reject. First name + last initial
  is supported, including ONE terminal period, max 48 ASCII characters. No name
  derivation or submitted/registry-name fallback was added. Players remains unread.
- 40_Cache_Helpers.js:250–273: normalized matchup whitespace/case and vs/vs.
  punctuation agree; team comparison uses the final nickname word through the
  approved canonical team map. Multiple labels for the SAME canonical team are
  allowed; conflicting canonical mappings fail closed. Raw team text never public.
- 10_Prizes_Scoring.js:364–429: one point for a matching selected FINAL winner;
  pending scores never award correctness. Perfect Week requires gameCount > 0 and
  points == completedGames == totalPicks == scheduled weekly game count. Missing
  picks cannot qualify. 4.0's validator additionally requires coherent numeric
  FINAL scores/winner, so incomplete or contradictory FINAL rows are unavailable,
  not silently coerced, zero-filled or repaired in production.
- 40_Cache_Helpers.js:34 and 10_Prizes_Scoring.js:474–564: shared competition ranks
  and points/completed totals aggregate over the UNION of participants, including
  those entering only some weeks. Equal-point display ordering may use independent
  public keys in 4.0 instead of 3.0 names; ranks stay 1,1,3 and order never decides
  a champion. No default entry is created for a missing weekly submission.
  includeInSeason affects source prize contributions, not automatic exclusion of
  ranking points; the owner must choose explicit comparable covered weeks.

## Accuracy and monthly decisions

Accuracy is correct picks / submitted picks with a completed FINAL result, NOT
all completed NFL games. Two FINAL games, only one selected correctly: 100% pick
accuracy with one completed pick, but NOT a perfect week; schedule coverage would
be 50% and is a different metric. Zero completed picks shows an em dash. FINAL
NFL ties with a nonblank Tie winner count as completed picks and neither selected
team is correct. Blank/inconsistent FINAL winners/scores are a 4.0 validation
blocker rather than permission to invent finality. References: scoring lines
400–407 and contract SUBMITTED_FINAL_PICKS/weekly reconciliation.

Monthly standings remain points-first. The existing shared projector/validator
resolver applies the designated FINAL game's actual combined score to tied-first
players' valid predictions. Missing/invalid values stay ineligible (not zero),
equal minimum distances stay unresolved, and ranks/points do not change. No manual
winner or payout is invented. Source 3.0 prize builder lines 69–100 contains monthly
zero payout placeholders, not resolved champion or settled-accounting records.

## Approved prize-fact import

legacy-prize-facts.cjs is pure and read-only. It maps authorized 3.0 weeklyPot,
rolloverToMonthly, monthlyPot, monthlyWinnerPool, seasonContribution, share percents,
confirmedSeasonPot and projectedSeasonPot to the existing accounting contract.
Money is normalized exactly to integer cents (up to two decimal places); no binary
rounding, recomputed entry counts or automatic 50/50 split. Weekly activePlayers
and pot overrides in the original builder (10_Prizes_Scoring.js:14–23) come from
accounting, NOT inferred response/approved-alias counts. The already-computed pot
fact is the input; no identity-bearing winner names/notes are copied.

Caller must independently approve per-scope PROJECTED/CONFIRMED pools and any
final no-perfect NEW-rule rollover destination at the matching revision/time.
Unapproved facts remain UNAVAILABLE. Rollover requires equal full approved pot,
explicit destination/period, finalized evidence and independently verified
no-perfect outcome; the existing projector/contract rejects inconsistent finality,
perfect winners or funding. Monthly funding copies actual reported shares/amounts;
inconsistent or overallocated source facts reject rather than changing rules.
No allocations are inferred except approved empty no-perfect rollover allocations.
Monthly payout placeholders and any raw payment-state field are ignored. Payment
stays UNKNOWN. No ledger settlement, monthly payout or season distribution invented.
This helper DOES NOT read Prize Rules/Weekly Prize Results/Prize Ledger. Those tabs
require a separately reviewed bounded read/fact-authority plan before real import.

## Privacy and deliberate stricter behavior

10_Prizes_Scoring.js:450–472 permits old-week/deadline-based prediction disclosure.
4.0 NEVER copies it: official fresh revision-bound CLOSED evidence for every
requested VERIFY week remains mandatory. Unknown/reopened/stale evidence withholds
picks, predictions, votes and related standings. Alias approval/completeness is
independent of closure. Results and accounting have their own validation authority.

A redacted/blank private identity cannot be reverse-engineered or replaced by a
name. Real VERIFY requires usable owner-approved joins; sample redactions simply
cannot validate identity parity. 4.0 blocks unidentified/partial records instead
of copying legacy's silent empty-phone skipping. This is an intentional disclosure/
completeness guard, NOT a diagnosis of real missing production phones. The minimal
STRUCTURE run never reads phone values, names or submissions, so redaction is
irrelevant to that first header-only check.

## Exact minimal first STRUCTURE configuration

The bundled private provider can now use minimalStructureConfig. Its default
remains return null. ONLY in the remote isolated owner editor, under separate
configuration authorization, replace return null with the following. All nulls
are deliberately incomplete PRIVATE placeholders; leave disabled until exact
read authorization. No real IDs/contacts/aliases belong in Git, logs or chat.

```js
return minimalStructureConfig({
  target: null,       // OWNER privately supplies the actual Sheet target
  timeZone: null,     // OWNER confirms actual Sheet/competition IANA timezone
  season: 2026,
  activation: {
    enabled: false,
    soleOwnerReviewed: false,
    noPublicExecutionReviewed: false,
    readOnlyGrantsReviewed: false,
    notBefore: null,  // OWNER-approved canonical UTC activation window
    expiresAt: null   // canonical UTC; maximum window five minutes
  }
});
```

The factory has the real Results A–H profile and only Responses A/C headers,
empty games/teams/periods/aliases/closure maps and no capture authority. STRUCTURE
now allows that empty game manifest; VERIFY still rejects it. Revision 0 and the
five-minute freshness budget are inert header-check defaults, not source revision
or completeness claims. No matchup labels/phone mappings/prize facts need inventing.

After NEW owner upload authorization: verify the package/seal and exact three-file
ignored inventory with the documented Node preflight, then upload ONLY
Verification.gs and appsscript.json from tmp/verification-upload to the separate
4.0 project. No legacy src upload/deploy. Owner privately confirms target, sole
editor/no public execution/triggers/libraries, and effective spreadsheets.readonly
scope. Separately authorize configuring the private placeholders and ONE
verifyPerfectPick4Package_ STRUCTURE execution/OAuth review. It performs one
restricted two-tab metadata read and one batch of TEN header cells; NO body rows,
Name/Players/other-tab reads, writers, Forms, triggers or public response. Inspect
ONLY the fixed private diagnostic report; restore return null immediately afterward.

Do not run any of these operations automatically. Until that successful real
header check, live coordinates/timezone/OAuth/runtime remain owner-reported or
unverified. A later VERIFY needs actual bounded weekly/prediction descriptors,
independent credible capture authority, approved normalized aliases and historical
CLOSED evidence. Public browser transport, prize authority/parity, official Form
URL and publication remain separate gates. 3.0 alone owns all production writers:
50_Form_Weekly_Setup.js:103/367 and 30_ESPN_NFL.js:38 are references, not imports.
