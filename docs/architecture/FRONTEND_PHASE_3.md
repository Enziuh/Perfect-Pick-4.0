# Phase 3 · Match Center, selections, voting and results

## User experience

The Phase 1 visual system and five destinations remain intact. Match Center now
combines game results, selection share and per-matchup comparison in spacious
cards, grouped into awaiting/final results. A matchup selector limits the visible
slate; previous/next buttons and the existing week selector navigate the season.
Player filtering opens one approved alias's full week. The optional full-week
matrix remains in an expandable, keyboard-accessible region, rather than being
the primary mobile experience. Native controls/details retain keyboard behavior
and existing route/history/focus handling.

Each card shows teams, available scores, explicit status and text WIN/LOSS/TIE
labels. Winning accents are distinct from popularity. Both teams appear in voting,
including a zero-percent winner. Selection share uses a proportional bar with a
full accessible text label and separately visible counts/percentages. With no
valid selections, both percentages/counts are zero and the track remains neutral.
The two displayed percentages sum to 100 for nonzero votes (one decimal maximum).
Votes count valid team selections per approved alias, not all response rows.

Player picks use team labels and restrained accents, with textual Correct (check),
Incorrect (X), or Pending. Each player's period-ending prediction, designated game,
actual FINAL combined score and absolute error (when available) appear with their
picks. Missing predictions never become zero. A link leads to the shared Phase 2
monthly champion decision; a weekly pick card cannot award a monthly championship.
The disconnected prediction-transparency block was removed, preserving its
information in the relevant player cards.

## Data and scoring boundary

`buildMatchView` in the existing preview adapter is a pure, shared presentation
model. A correct/incorrect selection requires an authoritative result with exact
Final status and a valid winning team (or Tie). Stale per-pick correctness/status
flags never override a Pending result. NFL ties retain the existing scoring
behavior: neither team selection is correct. This model does not mutate scoring
points, completed-game counts, ranks, pots or the monthly resolver.

Game result views in Overview/Weekly reuse the same public result card rendering.
They no longer infer game results from player submissions. Missing/ambiguous
result evidence cannot generate a winner. Strict fixture validation additionally
rejects duplicate aliases, duplicate/foreign matchup selections, invalid selected
teams, mismatched pick counts, ambiguous result rows and fractional scores.
No new fixture fields or runtime assets were introduced.

## Privacy

Before explicit CLOSED status, the view model returns before reading selection
fields: no selections, votes, percentages or counts enter its output. UI selectors
contain no participating aliases, and no selection/prediction/comparison markup
is generated. OPEN/UNKNOWN/UPCOMING/missing or differently cased status never
unlocks disclosure. Loading/week changes clear old picks, votes, aliases and
prediction markup immediately; stale asynchronous responses cannot restore them.

After closure, only approved synthetic aliases can appear. Predictions also need
confirmed revealed metadata. Closed fixture data is not hidden behind an open-week
UI: the strict adapter still requires selection-bearing rows to be absent from
non-CLOSED weekly responses. No embedded data, query/storage switch, live adapter,
external asset or production request was added. Existing deployment/security gates
and the exact six-file artifact allowlist are unchanged.

## Honest limitations and future backend requirements

The current synthetic/backend contract distinguishes only Pending and Final. It
does not supply scheduled versus in-progress status or kickoff times per matchup.
The preview therefore shows Pending without inventing a live state. When supplied,
nonfinal scores are explicitly provisional and never award a pick result. Actual
Scheduled/In Progress values are tested defensively by the pure model but remain
unsupported by the strict fixture schema, preventing a silent contract change.

Only the existing Form Control first-kickoff value is shown, and only for its exact
week and first matchup, visibly labeled synthetic. All other kickoff times display
unavailable. No team records, results, clocks or additional kickoff times are made
up. Publishing real per-game kickoff/live states requires a separately approved,
versioned backend contract and authoritative schedule source; never a browser call
to an external sports service.

## Regression coverage

The published synthetic fixture is unchanged. `tests/support/match-scenarios.cjs`
provides separate localhost-only zero-vote, one-sided voting, and provisional-score
examples; its shared test helper recomputes synthetic scoring/aggregate metadata.
No scenario switch is included in website assets.

Tests cover correct/incorrect/pending picks, Final versus Pending/Scheduled/In
Progress semantics, stale pick flags, zero votes, zero-percent winners, rounding,
closure checks before field reads, approved aliases, strict invalid-data rejection,
known/missing kickoff information, integrated final predictions, player/matchup
filters, previous/next week navigation and retained monthly champion regressions.
Browser tests also exercise mobile/tablet/desktop layouts, privacy DOM/attributes,
fixture failures, all destinations, keyboard/URL behavior and external network
isolation. Backend code, production services and the manual deployment workflow
remain untouched. Phase 4 requires separate approval.
