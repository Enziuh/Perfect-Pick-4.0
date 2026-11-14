# GitHub verify failures and Week10 — independent issues, local corrections prepared

## Scope/checkpoint

Starting local HEAD86b6c3f,clean develop. Read project continuity and verified memory
checkpoint. Owner authorized investigation,local code/config/tests/commits only. No
push/deploy,Apps Script/Form/Sheet/state/trigger/publication changes. Completed Match
Center layout b9c43b1 and layout regression remain byte-exact;no related score edits.
No fetch/merge or remote Git mutation;newer remote snapshot/history preserved.

## Today's exact GitHub evidence

Nov13 Pacific means2026-11-13T08:00Z throughNov14T08:00Z;checked through04:10UTC.
Retrieved ALL61frontend workflow records and ALL92repository workflow records (not
truncated pages;oldestNov3). Today:6frontend runs,5success,1failure;4monitor runs all
success. UTCNov13 onward also has only ONEfailed frontend run. Notifications may be
multiple/delayed,but GitHub API does not establish multiple failed runs today. No
email/notification account was inspected. Future distinct failures need their run URL,
not a huge log paste.

[Failed run43543074590](https://github.com/Enziuh/Perfect-Pick-4.0/actions/runs/43543074590)
createdNov13,17:51:50Pacific;completed17:53:21. Verifyjob132287865487FAILED,
deployjob132288295677SKIPPED because needs:verify. run_attempt1.

First failing STEP:Required offline security and browser tests,after successful
checkout,Node22setup and exact synthetic artifact validation. First failing TEST:
tests/accuracy-browser.test.cjs:4,15.6seconds after start. Node result414PASS/3FAIL,
exit1. These are all three test failures,not one test:

| Test file | Exact error | Watchdog reference |
|---|---|---|
| tests/accuracy-browser.test.cjs | Chrome startup timeout | tools/performance/browser-profile.cjs:12 |
| tests/browser.test.cjs | Chrome startup failed; publication BLOCKED | tests/browser.test.cjs:60 |
| tests/deadline-browser.test.cjs | Chrome startup timeout | tools/performance/browser-profile.cjs:12 |

Both watchdogs wait15seconds for Chrome's DevTools startup endpoint. Two tests use
shared CDP helper;browser.test has its own startup implementation. No Playwright.
Main browser test's explicit binary-exists check passed;missing executable was not
reported. No application/scoring/privacy/schema assertion produced these failures.
Build approved public static profile,final artifact verify/upload and deploy were
SKIPPED,not reported as successful or as freshness/privacy errors. Browser-dependent
privacy tests remained required and correctly blocked publication when Chrome failed.

## ALL failed-run annotations

Check-run API confirms verify annotations_count3 and deploy annotations_count0.
Complete messages (not just selected errors):

1. **warning**, path `.github`, line2–2;title/raw_details empty.

   > Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/

2. **failure**, path `.github`, line2557–2557;title/raw_details empty.

   > Process completed with exit code 1.

3. **notice**, path `.github`, line1–1;title/raw_details empty.

   > "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026. For more information, see https://github.com/actions/runner-images/issues/14748"

Deprecation/migration warnings also appear on successful checks;they are not the
exit1root cause. The actions' runtime warning is separate from tests' configuredNode22.
No action upgrade or sandbox/security disabling was added to address these warnings.

## Comparison with last successful deployment/root-cause limits

[Successful retry43544425722](https://github.com/Enziuh/Perfect-Pick-4.0/actions/runs/43544425722)
created18:06:29Pacific;verify/deploySUCCESS18:08:37;417testsPASS,0fail/skip.
BOTH runs use EXACT SAME code/snapshot commit:
`c03c053c6e6165110cad3d458474a3ac0617d470`.
No code/config/snapshot change between failure and success. Existing publisher's
reviewed bounded retry produced success;no retry/dispatch performed in this session.

Failed verify runner:ubuntu-26.04 image20261111.196.1.
Successful verify runner:ubuntu-26.04 image20261101.186.1.
Same runner application2.338.2,DIFFERENT runner image builds. Thus environment changed
while application stayed identical. Chrome version was not logged,so a specific Chrome
regression,sandbox/permission failure,kernel fault or missing dependency cannot be
claimed. Exact established failure is browser startup exceeding its15second readiness
watchdog during default parallel test-file execution. Concurrent Chrome launch/CPU
contention is a plausible contributing configuration risk,not a measured OS root cause.
No hidden resource metrics/stderr evidence was invented.

Local commit5ae7d8d updates .github/workflows/pages.yml:35–43:

- Record /usr/bin/google-chrome --version so future incidents expose actual runtime.
- Run COMPLETE suite with node --test --test-concurrency=1 tests/*.test.cjs.
  Serializes browser test FILES,avoiding simultaneous Chrome startups among them.

No tests/assertions removed,no timeouts increased,no new retry,no skip/continue-on-error,
no --no-sandbox,privacy/freshness/contract/publication gate change. This is startup
hardening,not a claim of a proven Linux infrastructure repair. Local serial full426suite
PASS;GitHub Linux/Node22 confirmation of this new workflow still requires approved push/
run. Local test host is macOS,Node26.12.1;do not conflate with actual Linux CI evidence.
YAML parses;unchanged downstream artifact verify/upload and deploy dependency retained.

## Relation to Week10

The failed run delayed ONE publication attempt. It DOES NOT explain persistent Week10
withholding:the SAME snapshot subsequently passed all417tests and deployed successfully,
and still contains no Week10 picks/votes. Current read-only public capture04:10UTC:
API22sameURL,READY,ROSTER_FINAL_V1,23players. Public snapshot hash
`e1d4c6f4c73ec614bdfa797344fbd82eb2e38eeb82dca2efac1a7c190a5024e4`,
generated01:51:44UTC,expires07:51:38UTC,fresh at capture.38livefile hashes,privacy/schema/
integrity/API-static matching-period parityPASS. Historical/core points,ranks/order,
winners,qualification,tiebreaks and prizes EXACT pre-release baseline. All23season136;
Isaias/Pancho83/136,61.0%. No new production snapshot was generated by the assistant.

Week10 already has the pinned deadline-disclosure proof and schedule metadata. Private
publisher source did not supply an AVAILABLE W10 before retention. API22scope explicitly
ends9;publisher has its separate approved10fallback. Retention masks native withholding
reason as CLOSURE_UNVERIFIED. Frontend is correctly preserving disclosure safeguards.
See [existing source analysis](MATCH_CENTER_WEEK10_REVIEW.md). Fixing browser startup
alone cannot grant source completeness,alias authority or new disclosure permission.

## Owner diagnostic receipt and narrow local correction

Owner reported INSUFFICIENT_EVIDENCE / METADATA_READ_OR_SCHEMA_UNVERIFIED. This is
OWNER-REPORTED,not independently reproduced. It signifies the diagnostic's generic
catch path,not a production snapshot-schema rejection or proof of bad player data.
No full safe receipt/version hash was provided;owner said output was2500lines. Asked
NOT to send huge logs/private data or rerun the old diagnostic. GitHub logs retrieved
directly instead. Do not equate that log's size with exposure or infer wrong function
without evidence. No request for private rows or expanded permissions.

Review found a local diagnostic compatibility issue:column_ matched '^'+label+'$',
but established backend trims header whitespace. A legitimately padded metadata header
could therefore yield the generic catch result. Its presence in production is NOT
verified. Commit e4f23f8 changes only local diagnostic renderer/static tests:

- Anchor searches to optional surrounding whitespace,matching native header trimming.
- Add fixed-enum stage to its ONEsanitized JSON receipt. Existing generic catch keeps
  safe reason,but now identifies OPEN_WORKBOOK,CONTROL_* ,RESULTS_* ,RESPONSE_* or
  CONSISTENCY_CHECK. No raw exceptions/values,extra private reads or network operations.

8static safety testsPASS,including call allowlist,unchanged11bounded getRange sites,
no context/registry/config loaders or submission reads,no mutators/dynamic calls,
fixed stage labels and whitespace-header compatibility. No diagnostic evaluation or
Apps Script execution in this session. Prior7static-test result remains historical.

NEW owner-review artifact (NOT installed/executed):
`tmp/workflow-week10-review/Week10DisclosureMetadataReadOnly.v2.gs`
wrapper remains pp4InspectWeek10DisclosureMetadataOnce.
SHA256:
`0599ee49536a802637904c429a561d80fba5b52d8de9d83b13e82e57cb66a11e`.
Previous6b0eartifact and blocked43cfartifact are preserved,not silently overwritten.
Review full new source before any owner-approved installation. If authorized later,
replace ONLY the TEMPORARY diagnostic file,not publisher/source/manifest. Do not add
duplicate wrapper definitions if the temporary file still exists. Run wrapper once,
share ONEsanitized JSON line (stage+reason suffice to locate failed metadata operation),
then remove ONLY temporary file. Do not run clock/installers or send2500lines.
No action is requested until owner reviews the candidate;no blind diagnostic retry.
If metadata matches but source/alias gates remain uninspected,INSUFFICIENT_EVIDENCE
still applies and no broader read is authorized. All previous minimum-read limits
and correct private-publisher/owner bindings are unchanged. No live header repair.

## Verification/commits/next boundary

Full SERIAL426testsPASS,0fail/skip;322.2seconds locally. Includes existing layout,
allprivacy/disclosure/schema/history/prize/scoring/parity regressions and new8static
metadata tests. Original ignored generated packages/seals restored after test setup.
YAML and memory references/append-only history validated. No production app/score or
local public-data/backend-reference changes;no Form/trigger/state/football automation
writes. Actual CI tests417pass on last successful run are distinct historical evidence.

Local focused commits5ae7d8d(CI hardening),e4f23f8(diagnostic observability/normalization);
focused memory checkpoint/package follows. No push,dispatch,deploy or remote merge.
Local tracking origin is older than actual remote snapshot observed through GET;never
push over it or replace public-data with older local snapshot. Preserve newer snapshot
history in an owner-approved integration before any normal push/static release.

Next required owner approval for applying CI change:normal remote integration/push and
existing verify/static-publication workflow,including preserved local UI fix if using
this develop branch. Do not assume verification workflow is deployment-free;its deploy
job follows successful gates. No backend redeployment,Form/state reset or trigger work
needed. Week10 exact native gate still needs a SAFE narrowly scoped diagnostic receipt;
new staged stage-labelled source is reviewable,not remotely installed. No immediate
rollback or forced publication needed. Missing private evidence is not permission to
bypass disclosure or invent a root cause.

Private/ignored evidence:tmp/workflow-week10-review/ contains ALLrun/job/annotation
responses,failed/success logs,public/API metadata captures,seals/liveparity report,
serial-full-tests.log and new private diagnostic artifact. Portable package includes
this sanitized report/manifest,not raw private API/source linkage,credentials or logs.
Restart from AGENTS/START_HERE/SYNC/latest handoff;do not repeat accuracy rollout or
reinstall/retry publisher. New production action requires explicit applicable approval.
