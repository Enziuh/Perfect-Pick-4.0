# Perfect Pick 4.1 late-entry rules (not activated)

Owner-approved gameplay policy; production API18, original PP3 functions and published
Pages remain unchanged. The opt-in dashboard4 calculator and UI require a reviewed
production release. Static publication and the refresh worker remain OFF.

## Entry selection and cutoffs

The private normalized phone remains the identity join; approved aliases/public IDs
are reused unchanged. No names or submission order determine identity.

For a valid weekly entry, at least one valid team selection must exist. Invalid or
future timestamps and invalid team selections are excluded. Latest valid entry at or
before the official weekly deadline counts. Any later replacement is ignored. When
there is no valid on-time entry, retain the earliest valid late entry, regardless of
source array order. Equal-time conflicting submissions block the week for audit;
identical duplicates do not change choices. Original records are never edited/deleted.

Opening game: the configured official weekly deadline, not a calculated hour offset.
Every other game: authoritative scheduled kickoff. Equality is eligible, strictly
later is MISSED DEADLINE. Unknown/expired/mismatched/duplicate schedule evidence or
unresolved rescheduling yields UNVERIFIED CUTOFF, never guessed eligibility. A verified
revised schedule is used only with its explicit matching evidence revision; a changed
opening-game order or unresolved postponed game requires owner review. Result update
and submission processing times are never schedule evidence.

The existing ESPN read-only fetch/parser can supply event.date and team matching;
no sync function, trigger or ESPN writer is invoked. Missing archived official weekly
deadlines are not reconstructed from current Form Control, missing Form questions or
historical week numbers. First-game identity must be explicitly available. Configured
timezone is PP3.TIMEZONE; use native Sheet Date values/serials and the existing strict
timezone parser, rejecting ambiguous/nonexistent local strings. Never use legacy
new Date(displayedTimestamp) for the new scoring path.

## Scoring, accuracy, prizes and tiebreakers

Eligible selected winner in a FINAL game: CORRECT,1 point. Eligible selected loser
(including a drawn result): INCORRECT,0. Eligible nonfinal: PENDING,no points. A late
selection (including no selected team) is MISSED DEADLINE,0,never correct. No weekly
entry is NO SUBMISSION. An unselected game on an otherwise valid entry is NO PICK,
with no point/vote.
Missing cutoff is UNVERIFIED CUTOFF,eligibility withheld,not an incorrect prediction.

Accuracy = eligible correct FINAL picks / eligible submitted FINAL picks ×100.
Exclude missed, unknown-cutoff, unselected and nonfinal games from denominator. Zero
denominator is an em dash. Weekly/monthly/season aggregate the same counters; shared
ranks remain points-based. Perfect Week requires ALL games eligible, selected, FINAL
and correct. Only eligible submitted team picks enter vote counts/percentages.

Unverified cutoffs block monthly confirmation. Points remain unchanged by tiebreakers.
A clear finalized points leader needs no prediction decision. Existing rules define
closest absolute combined-score difference but NO late-entry prediction cutoff.
Pending the owner's decision, late-first predictions are withheld as timing unverified;
if relevant tied leaders include them, no monthly champion/payout is confirmed. No
new tiebreaker deadline has been invented. The owner decision is pending separately.

Pool arithmetic/23-participant estimate assumption stay unchanged. Legacy accounting
allocations are not reauthorized under a new scorer. Only estimates are calculated;
unknown cutoff evidence also prevents estimated finalized rollover claims. No payment
tracking or settled-payout claims added. Original PP3 public actions still provide
legacy scoring for comparison; the proposed dashboard4-only path is explicitly marked
with the new scoring basis and must not be described as parity with unchanged PP3.

## Local implementation and activation contract

`tools/scoring/late-entry.cjs`: pure selection/eligibility/scoring; no Google services.
`native-responses.cjs`: private bounded native reads of Timestamp A and Phone/pick
columns C onward; Name B values never read; field allowlist, no raw public records. Non-allowlisted columns are not read.
`readPerfectPick4Cutoffs_` in generated additive JSON extension reuses ONLY existing
readFormControl_/fetchESPNNFLWeek3_0_/parseESPNNFLEvent3_0_/normalizeNFLTeamKey3_0_.
It reads current configured deadline only for the matching active week. Historical
weeks require private `lateEntryDeadlines:[{week,firstGame,deadline}]`, where firstGame
is the existing public matchup key and deadline is an evidence-backed UTC instant.
This read path is NOT installed or executed. Existing writer source stays untouched.

The updated client requests `action=dashboard4&rules=LATE_ENTRY_V1` at the SAME URL.
API18 ignores the new parameter and returns legacy data. The prepared narrow router
upgrade passes the existing event to dashboard4; the new extension requires BOTH this
client parameter and the approved server flag. Requests without the parameter keep
legacy semantics even after server activation, protecting cached4.0 clients. No new
API action, endpoint or original-action change is introduced.

Server config must opt in with `lateEntryRules:'LATE_ENTRY_V1'`. Without this exact
flag, original latest-entry/scoring output is unchanged and no new native/schedule
reader is invoked. Missing evidence in enabled mode fails closed. Test injection may
provide private lateEntryEvidence; the generated Google extension obtains fresh
schedule evidence through existing ESPN reads, using PP3.TIMEZONE.

`pp4-public/1` adds discriminated scoringBasis ELIGIBLE_SUBMITTED_FINAL_PICKS. Only
this basis permits per-selection eligibility ELIGIBLE/MISSED_DEADLINE/UNVERIFIED_CUTOFF;
one record per scheduled game is required, with nullable team for a missing pick.
Prediction timing may be UNVERIFIED_CUTOFF only with total:null. No submission times,
phones, keys or raw records are public. Validator reconciles eligible-only points,
denominators and voting. Static projection allowlists these fields but is NOT enabled.

The opt-in reader also verifies actual linked Form acceptance/responder identity.
If the current Form is open, inaccessible or mismatched, current-week disclosure is
withheld even when Form Control still says CLOSED. Reopening never changes cutoffs.

Frontend cards, matchup lists and optional matrix share missed/unknown/no-entry states;
missed team labels are crossed out, 0 points and accessible MISSED DEADLINE text
(short MISSED on mobile). Rules/FAQ are hidden unless the validated adapter explicitly
reports ELIGIBLE_SUBMITTED_FINAL_PICKS, so API18 never announces active4.1 rules.

Before activation: complete a bounded private native-timestamp/identity comparison with
verified historical deadlines and schedule revisions. `compare-late-entry.cjs` returns
only affected-entry counts and aggregate point/denominator/Perfect Week deltas; missing
cutoffs produce BLOCKED,not zero changes. Review all affected weeks before approving
retroactive scoring. Decide late monthly prediction eligibility. Then explicitly approve
the tested additive dashboard4 production candidate (extension plus narrow event-forwarding
routing patch) AND synchronized Pages release. Both client generations remain usable;
Rules/FAQ become active only when the validated new scoring basis is returned.
Preserve immutable18, editor backup, URL/access settings and original actions for
rollback. Do not deploy frontend rules alone, reopen Forms, install triggers or enable
static publication. Real schedule-reader latency/error behavior still needs authorized
staging validation; fabricated tests are not proof of live compatibility.
