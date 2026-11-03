# Phase 4 — prize presentation, polish and integration readiness

## Implemented boundary

The six published files, synthetic fixture, strict schema, five destinations,
scoring, shared ranks and monthly resolver are preserved. No dependency added.
Prizes uses the same cached monthly decisions as Overview/Monthly standings.
Period links select the applicable monthly view. Champion confirmation never
means payment, and unresolved decisions never generate a payout.

Weekly presentation requires matching week, explicit CLOSED, finalized weekly
metadata and complete FINAL scores consistent with the winning teams. Winner
aliases must match the weekly outcome and approved alias list. Show only the
provided per-player allocation; no client payout calculation. A rollover is
confirmed only for a final no-winner outcome with an explicit full-pot rollover.
Inconsistent/missing allocation evidence is unavailable, not zero. Pending pools
are projected. Missing payment records always mean payment status unavailable,
never paid or unpaid. Zero payout placeholders cannot establish payment status.
Season confirmed/projected amounts come directly from fixture fields; no invented
season payout percentages. Monthly pools are provisional until reported finalized.

Overview prioritizes deadline, public FINAL game progress and weekly standings
context, and the most recent finalized week when the current slate has no finals.
Open-week standings show an informative unavailable state. Prize funding
details now live in Prizes; Overview retains compact summaries. Historical winner
rows reuse closure-checked weekly models, without transient unverified aliases.
Participation counts in Prizes are protected before explicit closure.

## Performance and accessibility

Source profiling found one currency formatter construction per amount and a week
cache that populated only after an asynchronous read. Regression measurements on
the actual shipped functions: 100 format calls now construct one formatter;
three concurrent reads of one week perform one adapter read rather than three.
Failed reads evict their cache entry and can retry. Initial standings, prize and
active-week work starts concurrently; all share the same immutable validated
fixture and promise cache. At most one clone per week per page session; Prizes
needs all weekly snapshots to verify historical allocations. There is still one
same-origin fixture request, no new transfer or polling. No wall-clock loading
speed claim is made; this fixture is small and production latency is unmeasured.
A future mutable/live adapter must add snapshot versioning/invalidation rather
than reuse this session cache unchanged.

Touch controls and native summaries have 44px minimum height; prize status pills
wrap, allocations have readable separate lines, reduced-motion preferences are
respected. Existing focus, skip link, keyboard/URL navigation and named scroll
regions remain. Tests exercise all routes at 375/768/1280 pixels, missing/invalid
fixtures, privacy, champion agreement and no external browser requests.

## Acceptance and limitations

Tests cover missing/zero amounts, weekly winner allocations, valid/inconsistent
rollovers, no pre-closure reads, stale final evidence, cache concurrency/retry,
formatter reuse and matching monthly champion states across three destinations.
The published fixture remains honestly unfinished. Final-month examples exist
only in test support, not a runtime preview switch. Payment/accounting completeness
and assistive-technology usability require future backend/manual validation.
Deployment remains manual and requires separate owner approval/settings review.
See LIVE_INTEGRATION_READINESS.md before any real-data integration.
