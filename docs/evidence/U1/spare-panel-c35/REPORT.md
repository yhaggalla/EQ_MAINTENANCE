# U1-C35 selected spare-part condition repair - 24 October 2026

## Reproduction and fix

Baseline `aaa84ad` on `main`. The supplied screenshot shows Spreader frame (`pp-q01-022`) already registered but with condition Not recorded. Reproduced in Chrome: Add spare part opened a blank position picker with only No position left to add here. The selected position was excluded because Add accepts only unregistered positions. Evidence: `reproduction-before.json`, `reference.png`.

Registered cards now show Update condition using the existing Jobs condition dialog for that exact position. The selected registered part no longer offers Add; unregistered selections still offer Add, prefilled with the current position. Legacy Add calls targeting an already registered selected position open its condition dialog. Successful saves use the existing notification flow to refresh the selected card, dates/prediction/flags, area aggregates and Jobs without changing selection, camera or isolation. The register keeps one identity per position and preserves prior values in history. No data mutation rules, role ceilings, Admin-only type/life settings, model or persistence changes.

Sources: `artifacts/prototypes/p02-ui/js/panel-tabs.js`, `views-eqjobs.js`. Check: `tools/p02b/check_u1_c35.mjs`. Records: DECISIONS D-178, UX_SPEC section 29, current ledger/handover, prototype READMEs and `docs/runs/Repair-U1-C35-20261024.md`. Active Codex agent; model/effort not independently recorded. No delegated or independent R verdict.

## Verification

| Command | Result / evidence |
| --- | --- |
| `node tools/p02b/check_u1_c35.mjs` | 11/11 PASS, `checks.json`: unscoped Add chooser, correct selected-part action, invalid-save isolation, immediate Original/replacement saves in 3D, date/prediction/history, cancellation, legacy entry, Admin amendment in Flat, adding a new selected part while isolated, area/Jobs agreement and Management denial; zero browser errors |
| `node tools/p02b/check_u1_r5.mjs http://127.0.0.1:5312/ docs/evidence/U1/spare-panel-c35/add-regression.json --only=R5-04,R5-05,R5-06` | 3/3 PASS: registration transaction/validation, existing Add workflow and role/access boundaries |
| `node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/ docs/evidence/U1/spare-panel-c35/panel-regression.json --only=C` | 9/9 PASS: all existing normal-scope panel, safe-current-content, keyboard, links and late-response checks |
| `node --check` on both changed source scripts and the new check | PASS |
| `git diff --check` | PASS |

Chrome 155, local synthetic fixture/persona data; the focused flow used software WebGL. Visually inspected `selected-replacement.png`: the same selected Spreader frame shows Replaced, saved brand/model/date, expected life and next prediction, plus Update condition. `selected-original.png` and `selected-new-part.png` record the other successful save states. One initial R5 launcher attempt exited before producing browser/check output; no passing result is attributed to it. Its retry produced all three recorded passes.

No broad viewer/model suite was rerun because the geometry, renderer, route and camera code are unchanged. No production authentication, database or real ZMMS connection was tested. Data remains in memory for the current page view, as before; reload restores fixtures. Formal application acceptance remains NOT RUN.

## Checkpoint status

**U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED.** P04 is Not started. This is a U1 refinement; continue the user walkthrough. Source authorities, Portal and unrelated RTG handover edits are excluded.
