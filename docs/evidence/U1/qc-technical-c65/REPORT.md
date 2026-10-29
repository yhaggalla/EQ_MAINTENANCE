# U1-C65: QC flat/3D view and technical parameters from the supplied drawings and manuals

29 October 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request and answers: `docs/runs/Repair-U1-C65-20261029.md` | D-213

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.** Local synthetic prototype only; no independent R verdict.

## What changed

### Model (draft v1, revision 6 -> 7; no equipment binding is active)

`node tools/u1/model_diff.mjs --out docs/evidence/U1/qc-technical-c65/model-revision-diff.json`: **10 added, 0 removed, 11 changed, 0 identity changes**. 188 nodes, 153 positions, 19 hotspots, 12 containers.

| Added key | Sub | Source |
| --- | --- | --- |
| container.trolley-runway "Trolley rails and catenary trolleys" | - | J526A0104, J526A2200 |
| trolley.rail.girder (A75, 60.2 m, pads, clip pairs at 600, end stops) | 021 | J526A0104 (J526A0100 p44) |
| trolley.rail.boom (A75, 74.6 m) | 021 | J526A0104 |
| trolley.rail.hinge-joint (short rails, gap 6 +/-2, joint clips) | 021 | J526A0104 |
| trolley.catenary.landside / trolley.catenary.waterside | 021 | J526A220400 / J526A220500 |
| reeving.sheave.catenary-boom-tip (2 sets, dia 500) | 021 | J526A2201 |
| trolley.catenary.tensioner (back-reach; 2 sets, stroke 600) | 022 | J526A2203 |
| trolley.catenary-rope.set.main (path simplified) | 024 | J526A2200 p1 |
| auxiliary.rope-reeving.machinery-house (2 driving reels, 5.5 kW; location approximate) | 151 | J526A1500 |

Changed: the rail strips leave `structure.girder.rear.main` and `boom.main.girder`; measured corrections anti-snag tail sheave 1100 (estimated) -> **1000** (J526A1000 B-B), trolley-rope tension sheave 800 -> **830** (J526A2103), spreader cable reel 1600 -> **2200** monospiral (Cavotec SC-121216-ME2a), with the dependent rope paths; label/source updates for the 10 t machinery-house service crane (J526A1600), emergency drive (J526A1400) and trolley-rope tension cylinders (J526A2103). Classifications on new nodes are proposals for Admin (as D-61). Display poses of the catenary trolleys are their outreach positions scaled from J526A2200 p1.

Budgets: draw calls **213 / 230** (limit raised from the provisional 200 on the user's answer, D-213), triangles 70154 / 150000, GLB 3378192 bytes / 8 MiB. `validate.mjs` 26/26 PASS (landmarks within tolerance), `check_bindings.mjs` 11/11 PASS.

### Technical tab

New `artifacts/prototypes/p02-ui/js/component-specs.js`: 27 sourced data groups (226 rows; wire ropes appear on the rope-set parts). Isolating an area shows its groups above the included parts; selecting a part shows the groups for that part after its position data. Groups per area: machinery house 9 (house, main hoist, boom hoist, trolley drive, emergency drives, re-reeving device, service crane, disc-brake hydraulics, compressed air); headblock and spreader 3 (spreader, headblock, cargo beam); trolley 5 (trolley, wheel, sheaves, spreader cable reel, cab); trolley rails and catenary trolleys 5 (rails, fixing and joints, tolerances and inspection, catenary trolleys, catenary ropes / sheaves / tensioners); back reach 5 (anti-snag TLS, trolley rope tension device, catenary tensioners, multi-function hydraulics, outdoor service crane). Every group and any differing row cite drawing / manual page. Rows are searchable with the existing panel search. Conflicts are shown, not resolved: trolley motor 270 kW (J526A0400) vs 275 kW (manual; open U-02); service crane 10 t (J526A1600) vs 12 t (manual text). Chapter 1 of the ZPMC manual states its example crane is KICT; its tables agree with the J526A drawings where cross-checked and are cited as the manual. The STS45 spreader drawing and spreader manual are still not supplied (U-10), so spreader rows are crane-level only. Lubrication frequency columns in manual table 2-13 are not machine-readable, so only lubricants, point counts and printed oil-change intervals are given.

Runtime files: `js/component-specs.js` (new), `js/views-equipment.js`, `css/equipment-dashboard.css`, `index.html` (include and cache keys). Model files: `assets/models/source/cict-j526a-sts/{build.mjs,params.json,README.md}`, `tools/model-generator/generate.mjs` (budget), regenerated `artifacts/models/cict-j526a-sts-scene/1/*`. Capture tool: `tools/u1/capture_c65.mjs`.

## Checks run (actual results)

| Check | Result |
| --- | --- |
| node tools/model-generator/generate.mjs | 188 nodes, 213 draw calls, no landmark failures |
| node tools/model-generator/validate.mjs | 26/26 PASS |
| node tools/p03/check_bindings.mjs | 11/11 PASS (output copy `regression/binding-validation.json`) |
| node tools/u1/capture_c65.mjs | 15 captures, all groups rendered for 9 parts and 5 areas, 0 browser errors |
| check_unified_viewer.mjs | 11/11 PASS (`regression/unified-viewer`) |
| check_flat_isolation.mjs | 19/19 PASS, now 12 areas (`regression/flat-isolation`) |
| check_u1_c35.mjs | 11/11 PASS |
| check_u1_c63_browser.mjs | 68/68 PASS (`regression/c63-browser`) |
| node --check on component-specs.js / views-equipment.js | PASS |

`check_flat_isolation.mjs` and `check_bindings.mjs` write into dated evidence by default; their new outputs were copied here and the dated files restored from Git unchanged. Screenshots 01-15 inspected (catenary trolleys between the trolley and boom tip and at the hinge, rail clips and joint, tail tensioner, re-reeving reels above the main hoist, panel layout). Software WebGL in headless Chrome; no real sign-in, database, IIS or production acceptance.

## Limits and open items

- Catenary rope runs between the trolleys are a single simplified run per lane; the B1-B8 multi-part reeving is not drawn.
- Re-reeving reel size and height, catenary tensioner position along the tail, and catenary display positions are scaled or approximate (provenance recorded per node).
- Existing fixture positions keep their original names (for example `pp-q01-045` "Spreader cable reel and drive"); only the model labels changed.
- Unrelated untracked `outputs/20261029-qc01-hierarchy/` (created before this work) is left untouched.
