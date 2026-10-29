# U1-C66 follow-up: label modes and Technical on part selection

29 October 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C66-20261029.md` (follow-up) | D-215

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.** Local synthetic prototype only; no independent R verdict.

## Behaviour

- The viewer tool bar "Labels: on / off" toggle is replaced by a Labels group with three modes: **Key parts** (overview labels: key assemblies in Overall, every main mechanism in Technical, the parts of an isolated area; plus the selected part or mechanism), **Selection** (the selected part with its related labels, as before), **Selected only** (only the selected part or mechanism; nothing when nothing is selected). Labels are never all hidden.
- Default and Reset / Whole equipment / area: Key parts. Selecting a mechanism: Selection. Selecting a part (tree, scene, label, breadcrumb, area list): Selected only. A page opened on a part or mechanism link starts in the same mode. The user can change the mode at any time; camera switches keep it.
- Selecting a part while the view is Overall moves to Technical, so parts drawn only in Technical are shown and fitted instead of the "no visible representation" notice.
- The selected label keeps the U1-C66 highlight. Phone: 44 px buttons, no page overflow.

Files: `artifacts/prototypes/p02-ui/js/qc-viewer.mjs` (label candidates and the Labels group), `js/views-equipment.js` (select(), Reset, initial mode), `css/equipment-dashboard.css`, `index.html` (cache keys). Test: `tools/p02b/check_u1_c66.mjs`; `check_unified_viewer.mjs` step 05 now asserts the label modes instead of the removed on/off toggle (same intent: label setting persists across camera switches and Reset restores the default).

## Checks (actual results)

| Check | Result |
| --- | --- |
| check_u1_c66.mjs | 14/14 PASS (`checks.json`, screenshots) |
| check_unified_viewer.mjs (step 05 updated) | 11/11 PASS |
| check_flat_isolation.mjs | 19/19 PASS |
| check_u1_c35.mjs | 11/11 PASS |
| check_u1_c63_browser.mjs | 68/68 PASS |
| Direct link `pkey=trolley_catenary_waterside` | Selected only, one label, 0 errors |

The first parallel C66 run failed in the test itself (it read `EQ.qc` before the viewer module had loaded); the poll was made null-safe and the run repeated: 14/14.
