# U1-C32 shared crane viewer - 23 October 2026

## Outcome and scope

Baseline reviewed: `32081d0` on `main` (round-8 slower blink follow-up), confirmed from the user's screenshot and Git history. Implemented one equipment-page viewer using the existing P03 revision-6 GLB, manifest and QcViewer core. **3D / Flat** changes only the camera: perspective orbit versus fixed orthographic side elevation. The tree, selection, four panels, labels and work markers share the P02 data/route state. Model geometry and hashes are unchanged.

The old P03 entry translates saved part links by semantic key and redirects into the shared page. Existing P02 position IDs and records are retained. Model positions missing from the earlier schematic fixture are appended with stable equipment-specific semantic IDs. The model's proposed `032` emergency-brake classification is included in the synthetic applicability so all 144 positions remain reachable; production classification confirmation is still required by the model source. Spatial-group panels use the manifest descendants. Flat preserves pan/zoom and disables rotation. Reset keeps the selected camera mode.

Local P02 server now serves the viewer/vendor/model assets from the same origin, with read-only GET/HEAD handling, traversal protection and malformed-path handling. One renderer is retained across tree/panel/camera changes and disposed when leaving the equipment page. Failure states retain records, including real unavailable-WebGL, blocked-GLB and lost-context cases.

No deployment, production database, Portal changes or external ZMMS traffic. Existing unrelated `rtg-workbench/HANDOVER.md` changes were excluded. U1 approval remains pending; P04 is not started. This is a user-requested Repair, not a fresh independent R checkpoint.

## Verification

- `node tools/p02b/check_unified_viewer.mjs http://127.0.0.1:5312/`: **11/11 PASS**, Chrome 155, software WebGL plus a separate no-WebGL browser. Tests one model/canvas, stable renderer across switches, tree/scene drill-down, all four panel contents, fixed-side drag/pan/zoom, resize aspect ratio, labels/work/isolation/reset, equipment identity, deep links/reload, legacy links, phone/landscape, keyboard, disposal, context-loss retry and model-load failure retry. `viewer-checks.json`.
- `node tools/p02b/check_p02b.mjs http://127.0.0.1:5324/ docs/evidence/U1/unified-viewer/p02b-checks.json`: **62/63 initially passed**. K01 expected zero canvases on every page, and one FAC page was sampled before its heading rendered. K01 now waits for route/model readiness and asserts exactly one canvas on QC detail, zero elsewhere. Targeted rerun on 5325 with `--only=K01`: **1/1 PASS**, **80 route/size/persona combinations**; `p02b-layout-current.json`. Thus all **63 unique P02B checks have passing evidence**, with the initial failure retained.
- Final equipment-panel rerun on 5312 with `--only=C`: **9/9 PASS**, `p02b-panels-current.json` (C01-C09), covering the shared panels after the `032` applicability correction.
- `node tools/p02b/check_u1_r8.mjs http://127.0.0.1:5325/ docs/evidence/U1/unified-viewer/round8-checks.json --head=http://127.0.0.1:5322/`: **8/9 initially passed**, including actual 2.5/3.5-second blink timings, TV behavior, illustrations and fleet accessibility. R8-09 correctly detected the deliberately changed equipment page. Its superseded equipment comparison is now covered by U1-C32; all unaffected routes remain in the exact style comparison. R8-09 rerun: **1/1 PASS**, FAC Dashboard normal/TV, FAC Jobs, FAC job detail and EQ Jobs all have zero style differences versus archived `32081d0`. All **9 unique round-8 checks have passing current evidence**. Initial result retained.
- `node tools/model-generator/validate.mjs`: **26/26 PASS** (asset hash, schema, hierarchy, classifications, geometry bounds, landmarks and budgets).
- `node tools/p03/check_bindings.mjs`: **11/11 PASS**; output copied to this folder as `binding-validation.json`, historical P03 output preserved. These are the existing manifest binding checks; the new browser suite and local-entry audit additionally check the actual unified page bindings.
- Normal-address smoke: old `5313/?eq=eq-qc-demo-02&part=pp-q02-049&view=side&panel=technical` resolves to `5312`, Flat, QC-DEMO-02, motor A, existing position `pp-q02-007`; **144 model positions, zero unmapped, zero duplicate position IDs, zero browser errors**. `local-entry-check.json`.
- `node --check` on changed JS/MJS and `git diff --check`: passed. Desktop and phone screenshots visually inspected: `3d-desktop.png`, `flat-desktop.png`, `flat-phone.png`.

Early focused-test runs exposed incorrect test selectors/old fixture IDs and a missing directory-index mapping for `/qc/`; those were corrected before the final successful run. A final audit also found the omitted `032` position and a favicon 404 on the legacy page; both were repaired and rechecked.

The historical P02 SVG / standalone P03 page suites were not reported as current passes. Production authentication, database behavior, hardware GPU performance and real mobile devices were not tested. Formal application acceptance cases remain NOT RUN.

## Try it

`http://127.0.0.1:5312/#/eq/equipment/eq-qc-demo-01`

Select a main mechanism, submechanism and part; select any information tab; switch between 3D and Flat. Flat stays aligned while zooming/panning. Reset returns to the full crane in the current camera mode. The local server on 5312 was restarted with the updated asset routes; 5313 remains a compatibility entry.
