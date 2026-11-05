# U1-C70: QC tree from the component workbook

5 November 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C70-20261105.md` | D-220

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.** Synthetic prototype data; the workbook's replacement dates and brands are not imported.

## What changed

- **Import** (`tools/u1/import_qc_components.py`, deterministic): reads the workbook QC01 sheet (QC01-QC14 identical in B:D, checked), the location columns of the component sheets and the "QC ALL Components" manual list, plus the scene manifest; writes `assets/reference/qc-component-hierarchy.json` (DATA s3.4a), `assets/models/source/cict-j526a-sts/reference-components.mjs` and `artifacts/prototypes/p02-ui/js/qc-hierarchy.js`.
- **Hierarchy**: 136 workbook parts (14 existing parts renamed, 122 added), 100 manual-list parts added (non-Excel), 68 manual rows already covered by existing or workbook parts, 3 skipped (generic hydraulic pump / cylinder / valve types). Every other system part is kept and filed by key or approved code. Approved codes stay on every part for jobs and filters; RTG/ES and the approved list are unchanged.
- **Model** (scene revision 8): 222 new parts located from the workbook locations (LHS / gate house end = -Z), the drawings and the manual, drawn as simple shapes in one instanced carrier per area (Technical mode, "Approx." badge). Validation 26/26 PASS (`model-validation.json`), 224 / 230 draw calls, 87,842 triangles, landmarks within tolerance; P03 bindings 11/11 (`binding-validation.json`).
- **Prototype**: workbook tree (assemblies first, then 05/07/08/12/13/15/16), muted non-workbook parts, tick "Excel items only" (tree and 3D labels), group selection (URL `grp`, breadcrumb, Assembly / Sub assembly panel, Technical tab, 3D highlight), group read scope in spare parts / special jobs / badges, workbook 3D labels (assemblies > sub assemblies > parts; larger units labelled first), old main/sub/part links kept. Position ids unchanged (new template rows appended; model-only parts keep their `mp-` ids).

## Workbook sub assemblies

| Assembly | Sub assembly | Workbook parts | of which existing | Approved code |
| --- | --- | --- | --- | --- |
| Trolley | Trolley Sheaves | 4 | 0 | 021 |
| Trolley | Trolley Wheels | 4 | 4 | 021 |
| Trolley | Trolley Wheel Bearing | 4 | 0 | 021 |
| Trolley | Trolley Drive Mechanism | 3 | 2 | 021 |
| Trolley | Cabin | 1 | 1 | 141 |
| Main Hoist | Hoist Sheaves | 16 | 0 | 011 |
| Main Hoist | Hoist Drive Mechanism | 7 | 2 | 011 |
| Main Hoist | Spreader Cable Reel | 5 | 1 | 014 |
| Main Hoist | Load Handling | 1 | 0 | 062 |
| Catenary | Catenary Sheaves | 8 | 0 | 021 |
| Catenary | Front Catenary | 8 | 0 | 021 |
| Catenary | Rear Catenary | 8 | 0 | 021 |
| Catenary | Wire Rope | 1 | 1 | 024 |
| Gantry | Sea Side Wheel Brake | 8 | 0 | 041 |
| Gantry | Land Side Wheel Brake | 8 | 0 | 041 |
| Gantry | Gantry Cable Reel | 2 | 1 | 042 |
| Boom | Boom Hoist | 4 | 1 | 031 |
| Boom | Boom and Girder | 20 | 1 | 021 |
| Backreach | Skew System | 6 | 0 | 111 |
| Backreach | Anti Snag System | 4 | 0 | 022 |
| Apex | Safety System | 2 | 0 | 151 |
| Apex | Other | 1 | 0 | 031 |
| Other | Oil Replacement | 11 | 0 | per part |

## Existing parts renamed to the workbook names

| Key | Earlier model label | Workbook name |
| --- | --- | --- |
| trolley.wheel.ls-b.1 | Trolley wheel LS-B | Trolley Wheel 1 |
| trolley.wheel.ws-b.1 | Trolley wheel WS-B | Trolley Wheel 2 |
| trolley.wheel.ws-a.1 | Trolley wheel WS-A | Trolley Wheel 3 |
| trolley.wheel.ls-a.1 | Trolley wheel LS-A | Trolley Wheel 4 |
| trolley-drive.reducer.main | Trolley drive reducer | Trolley Reducer |
| trolley.rope.set.main | Trolley rope set (2 ropes; path simplified away from the trolley) | Trolley Wire Rope |
| cabin.operator.seat | Operator seat (tip-up chair) | Operator Seat |
| hoist.drive.reducer.main | Main hoist reducer (SEW ML3PSF130E) | Hoist Reducer |
| hoist.rope.set.main | Main hoist rope set (4 ropes, 8 falls; path simplified away from the trolley) | Hoist Wire Rope |
| trolley.spreader-cable-reel | Spreader cable reel (Cavotec T5.1, monospiral dia 2200) and drive | SCR Drum |
| trolley.catenary-rope.set.main | Catenary trolley rope set (2 lanes; path simplified) | Catenary Rope |
| gantry.cable-reel.main | Gantry HV cable reel | GCR Cable Reel |
| boom.rope.set.main | Boom hoist rope set (simplified path) | Boom Wire Rope |
| trolley.rail.hinge-joint | Trolley rail joint at the boom hinge (short rails, gap 6 +/- 2) | Short Rail |

## Placement notes

- Trolley / catenary sheaves, rail carpets, catenary wheels and bearings: workbook location columns (back reach / boom end, LHS / RHS, front / back catenary, gate house / SAGT end, carpet lengths 10/20/20 m girder and 20/20/20/10 m boom).
- Hoist sheaves: 4 back reach (tail sheaves, one per rope), 8 trolley ((i) landside shaft, (ii) seaside shaft), 4 head block (corner order), matching the model's 4 + 8 + 4.
- Gantry wheel brakes 1-8 per side: J526A0600 (JLQ115.00-KH, 4 per corner between the sub-bogies), numbered from the gate house end.
- Oil-change rows: service points at their unit (reducers, elevator, disc-brake HPU, service crane, GCR, SCR, TLS power unit); gantry reducers share one marker at drive WS-B 1.

## Open points for the user (assumptions marked "to confirm")

- **Q-C70-1 Short Rail / Long Rail:** Short Rail is mapped to the existing hinge-joint short rails; Long Rail is drawn on the boom side of the hinge joint. Which pieces do the workbook rows mean?
- **Q-C70-2 Rest Plate / Base Plate:** Left/Right Rest Plate and Base Plate are drawn under the hinge-joint rails (rest = boom side, base = girder side). Please confirm their actual location.
- **Q-C70-3 Numbering:** Trolley wheels/bearings and headblock sheaves use the catenary-wheel corner order (1 back gate house, 2 front gate house, 3 front SAGT, 4 back SAGT); trolley sheaves (i)/(ii) = landside/seaside shaft; TLS cylinders 01-04 from the gate house end. Please confirm.
- **Q-C70-4 Anti creeper:** The Anti creeper oil row is placed at the seaside gate-house corner sill beam (rail clamp / anti-creep hydraulics). Please confirm the unit.

## Checks (actual results)

| Check | Result |
| --- | --- |
| check_u1_c70.mjs (new) | 12/12 PASS (`checks.json`); first run 11/12: QC03 lacked the 8 workbook parts that only the 3D binding created; fixed by adding them to the J526A template with their existing `mp-` ids |
| model validate.mjs | 26/26 PASS; first generation failed the overall-height landmark (anemometer / A-frame jib above the apex marker); parts lowered within tolerance |
| P03 check_bindings.mjs | 11/11 PASS (dated `docs/evidence/P03/binding-validation.json` restored; this run kept here) |
| check_u1_c69.mjs | 17/17 PASS |
| check_u1_c68.mjs | 13/13 PASS |
| check_u1_c66.mjs | 14/14 PASS (step 02 now clicks Main Hoist > Hoist Drive Mechanism) |
| check_unified_viewer.mjs | 11/11 PASS (steps 02/04/07 use the workbook rows and labels); intermediate run 10/11 until part labels were ordered largest first |
| check_u1_c63_model.mjs | 55/55 PASS |
| check_u1_c63_browser.mjs | 68/68 PASS (one earlier run stopped at check 10 reading `EQ` during navigation; rerun alone passed) |
| check_u1_c50.mjs / check_u1_c50_browser.mjs | 49/49, 23/23 PASS |
| check_u1_c35.mjs | 11/11 PASS |
| check_flat_isolation.mjs | 19/19 PASS |
| check_r02b_round2.mjs | PASS |
| check_u1_c51.mjs | Stops at check 20 exactly as on HEAD (known C63 storage guard in the Node harness, recorded at C68) |

Screenshots: `01-tree-all-items.png`, `02-excel-only-hoist-drive.png`, `03-trolley-wheel-bearings.png`, `04-gantry-labels.png`, `05-phone-tree.png`, and `placements/` (hoist sheaves, trolley sheaves, front catenary, seaside wheel brakes, boom and girder, skew system, apex safety, oil points).
