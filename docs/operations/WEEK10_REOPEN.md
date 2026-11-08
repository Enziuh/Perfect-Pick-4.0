# Existing Week10 Form closed — conditional owner-only reopen

Owner read-only receipts: oneWeek10section,14questions,no duplicates; Properties and
FormControl agreeWeek10/OPEN,kickoffNov12,17:15Pacific,deadline16:15Pacific,one close
trigger. ActualForm.isAcceptingResponses=false. Setup must NOT be rerun.

Fresh current-editor source reviewed read-only:
- PP_closeFormAtDeadline_ reads PP_DEADLINE_ISO and returns BEFORE setters while now
  is beforedeadline. Exactfunction locally executed against fabricated services:
  futureWeek10deadline causes0writes. Wrong/early trigger firing alone should not
  close the Form under the CURRENT stored configuration.
- PP_replaceCloseTrigger_ creates .at(deadline),but the installed trigger's actual
  target is NOT exposed by AppsScript Trigger's getter API. One trigger + correct
  Properties do not prove its installed date. No live trigger was changed/queried
  through a new diagnostic or new permission.
- PP_forceCloseForm and repairWeek7Automation can close the Form. The latter uses
  Week7's pastdeadline; do not run it forWeek10. Both normal close and force-close
  normally write CLOSED status,so OPEN/OPEN flags do not identify the closer; a
  partial execution,manual/native action or publish-state change remains possible.
- Publishing-state changes can overwrite response acceptance (official Forms API).
  Source alone cannot rule out native settings,another owner/project's trigger,
  add-ons or manual action. Exact initiating cause remains UNPROVEN.

## Owner read-only checks FIRST

In the ORIGINAL football project's Triggers page, inspect the existing
PP_closeFormAtDeadline_ clock's scheduled date/time (edit/details view, CANCEL without
saving): expected November12,2026,16:15America/Los_Angeles,or November13,00:15UTC.
Review all other handlers for close/force-close/repair/test-close actions; do not
change or duplicate any trigger. Review recent closing executions for a preceding
failure or olddeadline action. Check Form publish/response acceptance settings for
any competing close rule or add-on,if present. Do not change publication/access rules.
Report only targetdate/time/handler and any conflicting mechanism,not privateIDs.
If schedule/automation conflict is found,STOP and request its specific correction;
do not reopen into an unverified immediate-close loop.

## Prepared single-file owner operation — NOT installed or executed

`tmp/week10-reopen-owner/Week10Reopen.gs`
SHA256 `38187831c1504858b24f1d4b5d62a81b8b5bb64517b82f9f18ca3fee16cfd9f3`.
No manifest,clasp file,deployment,credential or permission change required.

After owner confirms the above checks,add ONLY this temporary file to the ORIGINAL
project,preserving all existing editor files. Set its LOCAL function variable
closureReviewConfirmed=true and run **pp4ReopenExistingWeek10AfterReview** ONCE.
It checks storedweek/status/UTCcutoff+kickoff,matchingFormControl,one official close
handler,no suspicious closing/repair handler,14questions and publication state.
The ONLY mutation is `form.setAcceptingResponses(true)`. Existing broad
PP_forceOpenForm is deliberately NOT used: it also writes Properties/FormControl
and refreshes caches. No questions,routing,URL,deadline,Sheet,Properties,trigger,
API20,publisher or scoring operation is changed by this prepared helper.

Success receipt: WEEK10_ACCEPTING_RESPONSES,gameQuestions14,writes1; an already-open
Form returnsALREADY_OPEN,writes0. Unexpectedunpublishedstate/postconditionfailure:
STOP,no automaticpublishing or blindrerun. Verify the SAME official responder URL
loads14Week10matchups and permits entry WITHOUT submitting a test/real response.
Rerun existing read-onlyPP_checkAutomationStatus: acceptingtrue,week10,unchanged
Nov12,16:15deadline/OPEN flags/one trigger. Then remove ONLY the temporary helper.

Tests4/4PASS,AppsScript syntaxPASS; wrongdeadline/expiredtime,conflicts,content,
unpublishedstate block before mutation. Failedpostcondition is reported. No actual
Google reopen performed; accepting status is NOT confirmedtrue pending owner action.

Sources: https://developers.google.com/apps-script/reference/script/trigger
and https://developers.google.com/apps-script/reference/forms/form#setAcceptingResponses(Boolean)
