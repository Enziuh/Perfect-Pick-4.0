# Frontend redesign · Phase 1

## Scope

Five URL-aware destinations preserve the eight original capabilities:
Overview (Dashboard), Match Center (Picks and result cards), Standings
(Weekly/Monthly/Season), Prizes, and Guide (Rules/FAQ). Legacy section IDs remain
inside the new shell to retain working rendering and selectors. Legacy hash links
are mapped to their corresponding new destinations. Hash navigation works under a
GitHub Pages project path, survives refresh, and supports history and shared links.

Navigation uses native links with aria-current, visible keyboard focus, a skip
link, arrow/Home/End focus movement, and focus on the destination heading after
navigation. Subviews use link navigation, not partially implemented ARIA tabs.

## Design conventions

Warm-white backgrounds, deep navy navigation, emerald highlights and restrained
team accents. System fonts only. Reusable CSS conventions: page-header,
section-heading-row, panel, card, player-pick-card, champion-spotlight,
accuracy-indicator, state-message and privacy-state. Tables scroll in named,
focusable regions instead of widening the page. Native details/summary player
cards complement the preserved comparison matrix. The exact six-file publication
allowlist is unchanged; the scanner additionally recognizes only enumerated local
navigation fragments. No external assets, framework or new package dependency.

## Approved presentation rules

- Accuracy = correct picks / completed FINAL games × 100. Zero completed games
  display an em dash. Show at most one decimal place. Accuracy never changes rank.
- Individual picks and all voting percentages/counts remain unavailable unless
  the applicable entry status explicitly equals CLOSED. Clock time cannot unlock
  them. Fixtures and adapter enforce this before rendering; presentation adds a
  second fail-closed boundary. Only approved synthetic aliases are used.
- A monthly tiebreak compares the absolute difference between valid predicted
  combined points and the designated game's actual FINAL combined score, among
  players tied for first on ranking points. Missing/invalid predictions are
  ineligible. Equally close valid predictions remain UNRESOLVED pending manual
  decision. Do not award a champion or payout while unresolved. Never modify
  ranking points using a tiebreak outcome.
- Preserve existing scoring, prize calculations, rollover rules and amounts.

Historical Phase 1 behavior (superseded by FRONTEND_PHASE_2.md): the champion
spotlight was explicitly non-awarding. Existing fixtures have
no finalized monthly period. It shows current period, pool, and progress/confirmation
status. Full champion resolution, final-score prediction comparisons, and payout
integration are deliberately deferred; no live payout calculation is introduced.
The player card adds the existing revealed prediction to player context while the
original transparency panel remains available.

## Verification and next phases

Browser checks cover five destinations and eight original capabilities, subviews,
refresh/shared links/back navigation, native Enter/Tab and arrow focus, all three
responsive widths, privacy states, results/picks/predictions, accuracy and safe
fixture failures. The security and artifact gates remain mandatory. Screenshot
capture is available through PP_SCREENSHOT_DIR and never enters the public artifact.

Future phases can refine matchup/voting visualization, full monthly champion state
resolution, prize presentation and player exploration. Live integration requires
separate authorization and server-side enforcement of the privacy contract in
PRIVACY_AND_PREVIEW.md. Existing backend identity/reveal behavior is not approved
for public 4.0 use. No backend source, fixtures, adapter, workflow, or production
service is modified by this design phase.
