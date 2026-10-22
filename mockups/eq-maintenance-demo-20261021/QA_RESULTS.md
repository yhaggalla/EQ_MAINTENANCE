# Mockup verification

Verified on 21 October 2026 using Microsoft Edge, headless, with software WebGL.

**44 checks passed; no failed checks remain.** The main 27-check suite ran directly from the standalone HTML under file:// with browser network access disabled. It recorded no uncaught browser errors and no external HTTP(S) requests. Nine additional checks covered the remaining viewer controls, form validation, multi-position completion, Admin correction and the no-WebGL fallback. These suites passed after the model replacement. Eight dedicated annotation checks also passed, including rechecking the final cutaway/camera refinement. See MODEL_CORRECTIONS.md for the five changes.

## Verified behaviour

- Initial fixture: 18 equipment, 20 work orders, 16 main codes, 43 subcodes with 41 active.
- Fleet search, type/status filters, sorting and card/list navigation.
- Actual 3D rendering, ray picking, tree drill-down, camera views/zoom, labels, technical mode, PNG export and full screen.
- Exact equipment/position histories, including independent records for QCs sharing a model.
- Work create/edit/start/complete/cancel, replacement serial updates, duplicate-position validation, multiple replacement lines and retained correction/reopening history.
- Explicit operational-status changes and required Maintenance/Breakdown reasons.
- Local evidence image upload/preview/download; embedded source PDF and photograph preview/download without internet.
- Admin register add/edit/retire/reactivate, main/subcode creation, applicability, part creation/edit/deactivation, activity log and exports.
- Management read-only presentation, EQ Team own-work cancellation, persistence across reload and reset confined to the mockup dataset.
- Desktop at 1600 x 1060 and mobile at 390 x 844; no horizontal overflow in the tested mobile fleet and explorer; modal fits the phone viewport.
- Work navigation and new-work form remain usable when WebGL is disabled.

## Boundaries

This is a browser-only interaction mockup using synthetic operational records. Portal SSO, server-side permissions, SQL persistence, multiuser concurrency, production hosting and verified CAD geometry are outside this artifact. Browser role switching simulates presentation and workflow rules. The crane geometry illustrates major assemblies using the supplied references.

All changes are confined to the isolated mockup folder. The other agent's app, source drawings and project-ledger files were left untouched. The five drawing copies and photograph match their source bytes (see REFERENCE_INTEGRITY.json).

## Evidence

- qa/WORKFLOW_RESULTS.json: 27 executed workflow checks.
- qa/ADDITIONAL_RESULTS.json: 9 additional executed checks.
- qa/annotation-fix/ANNOTATION_RESULTS.json: 8 model/annotation checks.
- qa/annotation-fix/01-revised-perspective.png through 07-revised-mobile.png: corrected crane, gantry, spreader, house and cutaway views.
- qa/REFERENCE_INTEGRITY.json: SHA-256 comparison for the six copied references.
- qa/01-fleet-desktop.png through qa/08-no-webgl-fallback.png: browser captures.

The development scripts remain next to the HTML in the isolated folder. The ZIP below is the portable viewing package; index.html alone is sufficient to run the mockup in a browser.
