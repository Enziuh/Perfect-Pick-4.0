# Perfect Pick 4.0 — Codex Development Instructions

## 1. Project Overview

Perfect Pick is a football prediction game with weekly, monthly, and season-long competitions.

Version 4.0 is a major website redesign focused on improving user experience, performance, organization, responsiveness, and visual presentation.

The existing Version 3.0 website and Google Apps Script API have been imported as the starting baseline.

**Primary objective:** Build a modern, polished, fast, mobile-friendly Version 4.0 website without breaking existing gameplay, data, or production services.

## 2. Project Structure

- `website/` — Existing frontend, including `index.html`, `app.js`, `styles.css`, and `config.js`.
- `apps-script/src/` — Existing Google Apps Script backend source.
- `apps-script/config/` — Future backend configurations.
- `apps-script/tests/` — Backend tests.
- `docs/` — Architecture, API, feature, design, and migration documentation.
- `tools/` — Development scripts and utilities.
- `backups/` — Local backups, excluded from Git.
- `README.md` — Project overview.
- `AGENTS.md` — Instructions for Codex.

Maintain a clean, modular, understandable project structure.

Do not reorganize the existing frontend until its dependencies and functionality have been reviewed.

## 3. GitHub and Branch Management

GitHub repository: `https://github.com/Enziuh/Perfect-Pick-4.0`

Branches:

- `main` — Stable Version 4.0 baseline.
- `develop` — Active development.

Rules:

1. Perform development on `develop` or dedicated feature branches created from `develop`.
2. Never push directly to `main` without explicit approval.
3. Inspect existing changes before editing.
4. Keep commits focused and descriptive.
5. Never force-push, reset shared branches, or delete history without approval.
6. Explain significant modifications and testing results.
7. Preserve working functionality unless a change is explicitly requested.

## 4. Production Safety — Critical

The existing Perfect Pick 3.0 system is live and must remain operational.

It includes:

- Google Apps Script API
- Google Forms
- Google Sheets
- Score synchronization
- Scheduled triggers
- Form opening and closing automation
- Player selections and competition results

**The Apps Script source in this repository is initially a reference copy of the production backend.**

Unless explicitly authorized:

- Do not execute `clasp push`, `clasp deploy`, or `clasp undeploy`.
- Do not create, delete, or modify production triggers.
- Do not modify live Google Forms or Sheets.
- Do not change production Script Properties.
- Do not run functions that update scores, forms, results, or player data.
- Do not change existing production API deployments.
- Do not overwrite the production backend.

The local `apps-script/.clasp.json` may point to the production 3.0 script and is intentionally excluded from Git.

Treat all write operations against the live backend as prohibited until explicit approval is given.

Read-only inspection of source code and API response structures is permitted. Do not assume an API request is read-only merely because it uses HTTP GET; verify its behavior first.

## 5. Website Development

The website is the primary development focus.

Initial frontend files:

- `website/index.html`
- `website/app.js`
- `website/styles.css`
- `website/config.js`

Priorities:

1. Modern, polished visual design.
2. Mobile-first responsive layout.
3. Faster initial loading and efficient data fetching.
4. Clear navigation between game sections.
5. Reusable UI components.
6. Consistent typography, spacing, colors, and styling.
7. Accessible interactions and readable content.
8. Smooth, restrained animations.
9. Clear loading, error, and empty states.
10. Maintainable code architecture.

The existing website may be substantially redesigned or rebuilt after the current functionality and API integration have been documented.

Do not introduce a new framework, build system, or major dependency without explaining the benefits and migration implications.

## 6. Gameplay Features

Preserve the existing game functionality and business rules unless explicitly instructed otherwise.

Areas to understand and maintain include:

- Weekly football picks
- Player selections
- Team voting percentages
- Game schedules and results
- Correct and incorrect pick indicators
- Weekly standings
- Monthly standings
- Season-long rankings
- Pick accuracy percentages
- Tiebreaker predictions
- Prize and pot calculations
- NFL score updates
- Current and historical game data

Scoring and tiebreaker rules must be derived from the current backend implementation and verified before modification.

Do not invent new scoring rules or change winner calculations without approval.

## 7. User Experience Goals

The redesigned website should prioritize:

**Picks**

- Compact matchup cards.
- Clear team selections.
- Team voting percentages.
- Team colors for completed game results.
- Correct and incorrect pick indicators.
- Player tiebreaker information integrated where appropriate.

**Weekly Results**

- Readable weekly rankings.
- Correct pick totals and accuracy percentages.
- Clear current-week context.

**Monthly Competition**

- Monthly rankings, scoring, and prize information.
- Tiebreaker handling based on verified backend rules.

**Season Competition**

- Overall rankings and accuracy percentages.
- Season-long performance and prize information.

These are initial design goals, not permission to change gameplay logic. Validate available data and requirements before implementing features.

## 8. API Integration

The existing Google Apps Script API supplies website data.

Before modifying API integration:

1. Inspect the frontend request structure.
2. Identify API endpoints and query parameters.
3. Document response formats.
4. Identify dependencies between frontend pages and backend functions.
5. Verify how errors and stale data are handled.

Prefer minimizing unnecessary API requests and improving perceived loading speed.

Do not expose API credentials, personal player information, or private configuration.

Do not replace production API URLs without explicit approval.

## 9. Code Quality

- Prefer clear and maintainable code.
- Use descriptive names and small, focused functions.
- Avoid duplicated logic.
- Remove obsolete code only after confirming it is unused.
- Separate data processing from UI rendering when practical.
- Validate external data before rendering.
- Avoid unsafe HTML injection.
- Handle network errors gracefully.
- Maintain responsive behavior across screen sizes.
- Keep external dependencies minimal.

## 10. Testing and Verification

Before considering a task complete:

1. Check the files changed.
2. Run available tests and relevant syntax checks.
3. Verify the feature behaves as requested.
4. Check for responsive-layout regressions when practical.
5. Confirm existing scoring and ranking behavior has not changed unintentionally.
6. Confirm no production deployment or write operation occurred.
7. Report any areas that could not be tested.

Never claim testing was completed unless it was actually performed.

## 11. Working With the Project Owner

For each substantial development request:

1. Review the relevant existing implementation.
2. Summarize the proposed approach.
3. Implement the requested changes.
4. Test what can reasonably be tested.
5. Summarize the changes, results, and unresolved issues.

Do not repeatedly request approval for routine local changes.

Explicit approval is required before production deployments, destructive operations, changes to gameplay rules, or other potentially irreversible actions.

## 12. Long-Term Direction

Perfect Pick 4.0 should evolve toward:

- A polished and maintainable frontend.
- Faster loading and efficient data updates.
- Reliable game results.
- Consistent scoring and tiebreaker behavior.
- Clear weekly, monthly, and season-long competition views.
- Easy future feature development.
- Safe GitHub-based development and deployment.
- Minimal operational complexity.

**Current development priority: Website Version 4.0 redesign. Keep the existing production backend functioning unchanged.**

## 13. Google Forms and Google Sheets Integration

The existing Perfect Pick production system uses Google Forms
for player submissions and Google Sheets for storing game data.

Production workflow:
- Players submit weekly picks through Google Forms.
- Form submissions are recorded in a linked Google Sheet.
- Google Apps Script reads and processes spreadsheet data.
- Apps Script handles scoring, results, and scheduled automation.
- The website retrieves data through the Apps Script API.

Additional requirements:
1. Preserve all existing Google Form and Sheet connections.
2. Never modify production spreadsheet data without approval.
3. Do not modify spreadsheet structure, columns, or formulas.
4. Do not modify Google Form questions or response destinations.
5. Preserve existing submission and scoring functionality.
6. Understand spreadsheet data structures before proposing API changes.
7. Do not expose player submission data or private information.
8. Prefer read-only inspection when investigating integrations.
9. Do not assume the repository contains all spreadsheet formulas,
   script properties, triggers, or external configuration.

Current priority:
Redesign the website using the existing production data sources.
Do not change Google Forms, Google Sheets, or production automation
unless explicitly authorized.

## 14. Project continuity

After reading these instructions, read [START_HERE.md](START_HERE.md) before work.
Follow its evidence and handoff workflow without weakening any restrictions above.
Historical instructions and approvals do not authorize repeating production actions.
