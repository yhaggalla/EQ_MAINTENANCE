# U1-C37 crane-panel text cleanup - 24 October 2026

## Change and review

Baseline `8799b6b` on `main`. The user's `reference.jpg` circles the Maintenance automatic-status source/cause paragraph. Removed that paragraph and similar repeated tutorials: panel scope/history introductions, per-spare calendar-estimate footnotes, the scene-binding implementation notice and the prototype drawing-handler paragraph. Physical-area Technical now starts with a compact included-position count instead of an explanation box.

Current records, status/source badges, freshness time, visible stale indicator, manual correction reason, counts, actions, part identity, source references and unresolved source conflicts remain. The 63 m qualification is shortened to "Total lift height, not overall crane height." Supplementary source/estimate/reference details use native tooltips. Cause data/history remain in EQ Jobs; no values, records or history were removed. Runtime edits are limited to `js/panel-tabs.js` and `js/views-equipment.js` under the P02 UI prototype. No store, API, permission, camera, model or persistence change.

## Actual verification

Fresh local tests against `http://127.0.0.1:5312/`, Chrome 155.0.8059.85. Viewer checks use SwiftShader; panel-only checks use the existing no-WebGL driver. The preview includes pre-existing, unrelated FAC working changes; those files are excluded from this commit.

| Check | Result | Evidence |
| --- | --- | --- |
| `node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/ docs/evidence/U1/panel-cleanup-c37/panel-regression.json --only=C` | 9/9 | `panel-regression.json` |
| `node tools/p02b/check_u1_c34.mjs http://127.0.0.1:5312/ docs/evidence/U1/panel-cleanup-c37/area-regression` | 21/21 | `area-regression/checks.json` |
| `node tools/p02b/check_u1_c35.mjs http://127.0.0.1:5312/ docs/evidence/U1/panel-cleanup-c37/spare-regression` | 11/11 | `spare-regression/checks.json` |
| One-off CDP visual/data checks | 10/10 | `visual-checks.json`, desktop/phone captures |
| JavaScript syntax and whitespace review | PASS | `node --check` on the two runtime files and two changed check helpers; `git diff --check` |

Existing regression assertions changed only where they required superseded prose. They continue comparing actual daily-job IDs, special-job populations, source-linked specifications, predictions, scopes and keyboard/response behavior. The area spare assertion now additionally compares the actual position-ID list with the register's expected scoped rows.

Focused checks confirm removal of the circled explanation, preservation of both daily jobs and source/freshness, actual special cards/counts/actions, spare updates, 63 m qualification and both gantry-speed observations in their proper scopes, part identity without implementation prose, visible manual reason and stale warning, contained phone details and no browser errors. Inspected `maintenance-desktop.png`, `spareParts-desktop.png`, `technical-desktop.png` and `maintenance-phone.png`; other captures document the remaining tabs and existing workflows.

The first one-off smoke attempt had two invalid assertions: it queried a nonexistent special-card attribute and expected mechanism-specific gantry speed values in the whole-equipment major-parameter view. Preserved that attempt in `visual-checks-initial.json`; corrected the selectors/scopes and reran all 10 checks successfully without a runtime change. Existing suites passed on their first runs.

No broad, unrelated fleet/FAC suites or formal application acceptance run is claimed. This is local synthetic prototype evidence, not authenticated production verification, an independent R verdict or user acceptance.

## Checkpoint and exclusions

Recorded as D-180 / UX section 31. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED.** P04 is Not started. Exact prompt: `docs/runs/Repair-U1-C37-20261024.md`.

Source authorities and Portal untouched. Pre-existing FAC edits to `index.html`, `js/app.js`, `js/views-fac.js`, new `css/fac-dashboard.css`, RTG handover changes and the remote-attachment folder remain outside this commit. No deployment or live-system contact.
