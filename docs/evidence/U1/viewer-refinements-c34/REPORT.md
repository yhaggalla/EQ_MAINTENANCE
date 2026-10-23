# U1-C34 viewer refinements - 24 October 2026

## Outcome

The four requested refinements are implemented in the local synthetic QC prototype: working isolated-area tabs, a compact inline desktop toolbar, revised sea context and the supplied default/reset 3D composition. Initial view remains Flat; Reset preserves the active camera mode. The source GLB and manifest are unchanged. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED.** P04 is Not started.

Baseline: `37ff115` on `main`. Exact request: `docs/runs/Repair-U1-C34-20261024.md`; supplied screenshots: `reference-controls.png`, `reference-3d.png`. Active Codex agent; runtime model/effort not independently recorded. This is a U1 repair/review, not an independent R verdict.

## Review findings and changes

1. The equipment panel's container branch rendered `containerTab()` for every tab. It now uses the regular tab dispatcher with an area filter. Projects/Special includes exact position targets and committed replacement lines at included positions, deduplicated through the existing current-state projection; hidden jobs and private history fields remain excluded. Spare parts and badges use registered included positions. Maintenance retains equipment-level ZMMS daily work. Technical lists included parts. Areas do not become record owners, and broad equipment/mechanism jobs are not inferred to belong to them. Jobs links explicitly open the equipment list.
2. The area label and dropdown wrapped because the select occupied the whole flex row. They now remain inline. Desktop controls fit one compact row with accessible names, 44 px button targets, Fit and + / minus zoom controls. On phones the controls wrap and the inline area field gets its own row; a narrow desktop toolbar can scroll internally without overflowing the page.
3. Sea now has restrained static, world-space wave detail, waterline variation and a quay coping strip. Yard/rail top remains 0 m and sea top -5 m. No external images, continuous animation, picking targets or GLB changes. Decorative context is excluded from crane fitting and hidden during isolation.
4. 3D home follows the supplied three-quarter view, boom to the right, with quay/sea below. Framing uses individual assembly bounds and the current aspect ratio. The reference is an image, not a recorded numerical camera pose, so visual acceptance remains with the user. Reset restores that 3D home while preserving 3D; Flat Reset restores the full fixed side view. Labels/tree folds restore and selections/isolation clear. This supersedes C33's forced-Flat Reset.
5. Visual review found isolated geometry clipping after a landscape-to-phone resize. Resize now refits isolated areas/selected positions; unchanged dimensions no longer refit on tab rerenders. Final screenshots wait for camera transitions to settle.

## Verification

| Check | Result / evidence |
| --- | --- |
| `node tools/p02b/check_u1_c34.mjs` | 21/21 PASS, `checks.json`: four tabs across all 11 areas, scope exclusions and replacement-line deduplication, withheld private fields, part selection retaining isolation, inline controls, reference 3D home and Reset, Flat Reset, levels/context, keyboard tabs, phone/landscape framing and no browser errors |
| `node tools/p02b/check_flat_isolation.mjs http://127.0.0.1:5312/ docs/evidence/U1/viewer-refinements-c34/flat-regression` | 18/18 PASS, `flat-regression/checks.json`; Reset expectation updated to latest active-camera rule |
| `node tools/p02b/check_unified_viewer.mjs http://127.0.0.1:5312/ docs/evidence/U1/viewer-refinements-c34/shared-regression` | 11/11 PASS, `shared-regression/viewer-checks.json`: model/camera/panels, labels/tree, deep/legacy links, keyboard, no-WebGL, load/context failure recovery, disposal |
| `node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/ docs/evidence/U1/viewer-refinements-c34/panel-regression.json --only=C` | 9/9 PASS, normal equipment/main/sub/part panel scopes, safe current content, keyboard and late-response discard |
| `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/viewer-refinements-c34/record-boundary.json` | 10/10 PASS, isolated VM current-state projection/access-history boundary and filtered FAC KPI regression |
| Syntax / whitespace | Nine changed JS/MJS files passed `node --check`; `git diff --check` passed |
| Model integrity | GLB SHA256 `01fb0ae0a2c66029928bb6b8be9f31229e68ae9ed27f03aeddc6801993531b9a`; no model/manifest/source-authority diff |

Browser: Chrome 155 with software WebGL, plus a real unavailable-WebGL browser in the shared regression. Desktop Flat and 3D/reference, isolated back-reach and phone screenshots were visually inspected. Main evidence: `flat-desktop.png`, `3d-desktop.png`, `3d-reference.png`, `isolated-back-reach.png`, `phone.png`.

The initial old Flat regression failed its first assertion while using a fixed two-second startup wait. That helper now waits for actual viewer readiness; the rerun passes all 18 assertions. Initial result retained as `flat-regression/initial-timing-result.json`. An earlier C34 run passed before the visual resize finding; its result is retained as `checks-before-resize-review.json`. The final C34 run adds geometry/framing assertions after resize and waits for settled camera captures. A shared-viewer rerun initially returned 10/11 because the hoist-part click check sampled a label during camera movement. The label was confirmed reachable in both views; the check now waits for the actual transition/placed label and still performs the original real click drill-down. Final rerun is 11/11; the intermediate result is retained as `shared-regression/intermediate-label-timing-result.json`. Historical evidence directories were not overwritten; helpers now accept a separate output directory.

## Boundaries and next step

These are local synthetic prototype checks. No production authentication, database, live ZMMS, real mobile hardware or hardware-GPU performance acceptance was executed. Formal application acceptance remains NOT RUN. No deployment, Portal/source-authority edits or phase advancement. The pre-existing `rtg-workbench/HANDOVER.md` edit is excluded.

Continue the U1 walkthrough/refinements and record explicit user approval only when given. Deferred FAC styling and open source issues remain open.
