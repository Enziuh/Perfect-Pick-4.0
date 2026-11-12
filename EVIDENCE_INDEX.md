# Evidence index

Evidence labels: LOCAL = inspected repository fact; HISTORICAL = prior documented
report; OWNER = owner statement, not independent runtime verification; UNKNOWN =
not established. A passing historical test is not a test run in this session.

| ID | Classification / date | Source and limits |
|---|---|---|
| E-BASE | LOCAL, 2026-11-12 | Git baseline 5732be11e63ee43bdbc2e1350f255f34396c926e; clean develop, matches local origin/develop; no fetch performed. |
| E-ARCH | LOCAL source, historical assertions | [Architecture](docs/architecture/FRONTEND_PHASE_1.md), [API](docs/architecture/GITHUB_PAGES_API.md), [workflow](.github/workflows/pages.yml). Describes source, not live deployment. |
| E-LATE | HISTORICAL | [Late-entry checkpoint](docs/migration/LATE_ENTRY_PROGRESS.md), [rules](docs/architecture/LATE_ENTRY_RULES.md). Contains evolving/superseded states; no new scoring investigation performed. |
| E-RECOVERY | HISTORICAL, 2026-11-08 | [Recovery](docs/operations/SOURCE_ROLLOVER_RECOVERY.md), [progress](docs/performance/STATIC_SNAPSHOT_PROGRESS.md). Cloud repair remained pending in latest local record. |
| E-FORM-OLD | HISTORICAL, 2026-11-08 | [Form review](docs/operations/WEEK10_REOPEN.md). Prepared operation is not proof of execution. |
| E-OWNER-1109 | OWNER, event 2026-11-09; recorded 2026-11-12 | Owner states Week10 Form accepting responses, active week10, Form Control OPEN, one closing trigger installed/configuration reviewed for November12 2026 4:15PM PST. No successful future trigger execution verified. Source: owner's Phase1 approval message in this session; no independent receipt captured. |
| E-SCORING-REPORT | OWNER, recorded 2026-11-12 | Season denominators135 versus136; missed/late picks suspected. Root cause UNKNOWN. See research status. |
| E-PRIVATE | LOCAL existence only | Ignored backups/, tmp/, .preview-public/, .verification-package/ and seals exist. Contents not exhaustively audited or copied. Private evidence may be unavailable on another machine. |

Commit IDs resolve in local Git; identifiers are not evidence of deployed state.
Integrity manifests verify bytes against the selected checkpoint, not truth,
completeness, authorization, or absence of every possible secret.
