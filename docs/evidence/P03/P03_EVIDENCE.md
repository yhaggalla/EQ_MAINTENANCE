# P03 evidence: QC model prototype from drawings

Phase P03, 21 October 2026. Client: Claude Code subagent eq-build-opus-high (claude-opus-5-5, effort high). The first run was interrupted at its final check run; a resumed run applied the site-photo appearance refinement (s3), regenerated the model and ran every check below once more. All figures are from the resumed run. Everything below is a local prototype with **synthetic** equipment, bindings and history. Evidence types are labelled: source review, scripted checks, headless-browser checks on this workstation. There is no authenticated, target-environment or production verification.

## 1 What was built

| Deliverable | Location |
| --- | --- |
| Editable model source: parameter file (mm, provenance per value) and scene definition | `assets/models/source/cict-j526a-sts/params.json`, `build.mjs`, `README.md` (build/export instructions, tool versions, determinism) |
| Deterministic generator and registration validator (Node, three 0.186.1 pinned with lockfile) | `tools/model-generator/` (`generate.mjs`, `validate.mjs`, `lib/kit.mjs`, `lib/scene-builder.mjs`, `package.json`, `package-lock.json`) |
| Runtime asset, node manifest, dimension/provenance table, landmark check, checksums | `artifacts/models/cict-j526a-sts-scene/1/` (`scene.glb`, `manifest.json`, `provenance.md`, `landmarks.json`, `checksums.json`) |
| Interactive prototype (viewer core, page, synthetic bindings, localhost server, vendored three.js) | `artifacts/prototypes/p03-qc-model/` |
| P02 review-flow integration | `artifacts/prototypes/p02-ui/js/views-equipment.js`: "Open 3D model (P03)" link on QC-DEMO-01/02 detail, passing equipment, main/sub and the part's semantic key |
| Check, capture and comparison tools | `tools/p03/` (`check_bindings.mjs`, `check_model_prototype.mjs`, `check_no_webgl.mjs`, `capture.mjs`, `compose_comparisons.py`, `alignment.json`, `cdp.mjs`) |
| Aligned drawing/model comparisons | `docs/evidence/P03/comparison/` (side, end-ws, end-ls, top: overlay and pair; perspective vs photo; site-photo close-ups; perspective overall/technical) |
| Interaction walkthrough and fallback screenshots | `docs/evidence/P03/screenshots/` (17 PNG) and `capture-log.json` |
| Check reports | `registration-validation.json`, `binding-validation.json`, `browser-checks-hardware.json`, `browser-checks-swiftshader.json`, `no-webgl-check.json`, `p02-regression-checks.json` |

Raw model renders used by the comparisons are in `artifacts/p03-captures/`.

## 2 Sources inspected visually

J526A00 p1 (general arrangement: side view, both end views, plan, machinery-house plan, reeving diagrams, particulars) at 150-600 dpi, including zoomed crops of reference points; J526A0100 p1 (structure GA: legs, sills, portal beams, girder, boom, stays, A-frame, slope triangles, sections, plan); J526A0200 p1 (trolley arrangement, cabin, sheaves, headblock relation); J526A0300 p1 (main hoist drive); J526A0600 p1 (gantry arrangement and bogie side view); J526A1200 p1 (headblock); J526A3000 p1 (machinery house plan, sections and equipment labels); J526A5100 p1 (elevator location and landings); photos `documents/images.jpg`, `images2.jpg`; site photos `documents/Image_20261021165608.jpg` to `Image_20261021170007.jpg` (10 photos that appeared in the workspace during the first run; used in the resumed run for appearance only, never for dimensions). Not read in detail (features kept estimated or as hotspots): J526A0400/0500 beyond P00 data, J526A1000, J526A1400, J526A1600, J526A2000-2300 reeving sheets, J526A3100-3300 cabins, J526A4000 reel, J526A5000 walkways, J526A6000-6300, J526A7000/7100, Sheave.pdf, ZT2-015022.

## 3 Geometry and fidelity (VIS01, VIS02)

Coordinate system (D-11): metres, Y up, +X toward waterside along the boom, Z along the rails, origin on the waterside rail top at the crane centreline; `a` = +Z, `b` = -Z.

Landmark check (`artifacts/models/cict-j526a-sts-scene/1/landmarks.json`, all pass, tolerance 1 % for measured/derived inputs):

| Landmark | Source | Model |
| --- | --- | --- |
| Rail gauge | 30000 (J526A00, J526A0100) | 30.000 m |
| Outreach (hoist centre at outreach limit) | 70000 | 70.000 m |
| Backreach + girder tail | 20000 + 11000 | 31.000 m |
| Boom tip from hinge line | 75900 (J526A0100) | 75.900 m |
| Overall height, boom lowered | apex marker 83356 (J526A00) | 83.356 m |
| A-frame structural top | 5000 + 49000 + 25640 = 79640 | 79.640 m |
| Portal top waterside / landside | 54000 / 54250 | 54.000 / 54.250 m |
| Girder underside | 50500 (interpretation, U-19) | 50.500 m |
| Spreader underside in display pose | lift above rail 45000 | 45.000 m |
| Tie-beam clearance | 12500 | 12.500 m |
| Leg centres (end view) | 20400 | 20.400 m |
| Gantry overall | 27000 | 27.000 m |
| Headblock sheave-box span | 5200 (J526A1200) | 5.200 m |

**63 m is never used as height.** The validator also asserts that the overall height differs from 63 m and matches the 83.356 m marker.

Aligned comparisons: the model was rendered orthographically in exactly the pixel frame of J526A00 p1 at 400 dpi (26.6 px/m from the 30 m gauge, origin on the waterside rail line and rail level; `tools/p03/alignment.json`). In the side overlay the legs, lean of the waterside leg, 12.5 m tie beam, diagonal brace, backstays, rear braces, both forestays, Z2/Z3 attachment points, A-frame and apex, girder/boom band, machinery-house footprint and boom tip coincide with the drawing linework. End views match leg spacing, sill, bogie groups, A-frame convergence, cable reel position (waterside view, -Z) and the stair/elevator leg (landside view, -Z). The plan matches the portal rectangle, girder/boom width, house footprint and the waterside reel. The first P03 iteration placed the girder 1.9 m too low (50.5 m read as trolley rail); the overlay showed it, and the reinterpretation (girder underside at 50.5 m) made the backstay, rear-brace and forestay lines coincide with the drawing (D-57; source issue U-19).

Appearance: CICT red structure (`#d22a33`); walkways, stairs and platforms a slightly darker red (`#a9262d`, site photos 165608 and 165846 show red stairs, platforms and handrails); light machinery house on a red deck; grey machinery inside the house; headblock and spreader yellow (`#e0b020`, site photo 165637 of crane 01; spreaders are interchangeable, U-09); light cabin body with dark glazing; logos and text panels omitted. Checked in `comparison/perspective-photo-pair.png` (against `images2.jpg`) and `comparison/site-photo-closeups.png` (machinery house against 165846, trolley/cabin/headblock/spreader against 165637), appearance only (D-62).

## 4 Node manifest and identity (VIS05, VIS09)

168 nodes: 135 positions (32 gantry wheels and 16 gantry drives instanced through `instanceMaps`), 19 hotspots, 10 containers, 4 decorative. Provenance kinds over nodes: 77 drawing-derived, 7 measured, 24 estimated, 60 approximate-location. Classification by main: 04: 57, 15: 35, 02: 18, 03: 14, 01: 12, 06: 8, 12: 3, and one node each for 05, 07, 08, 11, 13, 14, 16. No node uses 043/044/045/09x, 048 or 063. Full list with sources: `artifacts/models/cict-j526a-sts-scene/1/provenance.md`.

| Check | Result |
| --- | --- |
| `node tools/model-generator/validate.mjs` (DATA_CONTRACT s10.4: schema, units, sha256/bytes, glTF names exactly once, keyed nodes in manifest, key grammar, parents/cycles, classification active under its main, no inactive codes, no tyre/steer/diesel on the QC, finite bounds, hotspot point/radius/qualifier, instance maps, no external URIs, gauge 30 m, height not 63 m, budgets, landmarks) | 25/25 PASS, status `validated` |
| `node tools/p03/check_bindings.mjs` (B2-B8 for QC-DEMO-01/02; hotspots to sub instances; two equipment independent; reversed glTF node order resolves all 120 keyed nodes identically while 114 of them change index; instanced wheel via map; simulated v2 with a renamed key, a removed node and a new node: 2 orphans reported, identical-label rename **not** matched, activation refused, explicit Admin mapping + noVisual then activates without changing position IDs) | 11/11 PASS |
| Generator determinism (generated twice into separate scratch folders and compared with the artifact) | `scene.glb` sha256 `3a4d0ee4...7ce4` identical three times; `manifest.json` sha256 `e957d867...44fe` identical three times |

## 5 Interaction (VIS03, VIS04, VIS06, VIS08, VIS10)

`node tools/p03/check_model_prototype.mjs` in headless Chrome 155: **31/31 PASS** with the Intel UHD Graphics 630 (ANGLE D3D11) and **31/31 PASS** with SwiftShader (both exit 0). Covered: model + manifest load with in-browser sha256 verification and no missing nodes; tree main -> sub -> part with breadcrumb, URL and tree synchronisation; scene pick of motor A returns the same position ID as the tree; through a transparent enclosure the ray reaches internals, never the container; Overall-mode house click selects only the spatial group; instanced wheel pick resolves via `instanceMaps`; decorative and background clicks keep the selection; a drag cancels a running transition; a newer selection wins; thin rope fit stays finite; a hidden selection leaves the camera unchanged with a notice; Overall hides internals and Technical ghosts the enclosure; QC-DEMO-02 shows a different position ID and history for the same node; deep-link reload; back/forward; keyboard tree; labels decluttered (no overlaps, at most 22); reduced motion makes focus instant; creating and disposing six extra viewers leaves the canvas count unchanged; fallbacks for no-WebGL, failed model request and context loss keep the tree usable; 390 px layout without horizontal scroll; the P02 link opens the same selection and reports a placeholder-only key instead of guessing.

`node tools/p03/check_no_webgl.mjs` with Chrome started `--disable-webgl --disable-3d-apis`: fallback shown, zero canvases, tree selection of 04 Gantry works: PASS.

P02 regression after the integration change: `node tools/p02/check_prototype.mjs http://127.0.0.1:5312/ docs/evidence/P03/p02-regression-checks.json` 50/50 PASS (report written to the P03 folder; the P02 evidence is unchanged).

Walkthrough screenshots (`screenshots/`, recaptured in the resumed run by `node tools/p03/capture.mjs`, 27 captures): 01 overall; 02 main 01 Hoist; 03 sub 011; 04 motor A on QC-DEMO-01 with exact-position history; 05 same node on QC-DEMO-02; 06 machinery house as a spatial group; 07 isolated house internals; 08 transparent house; 09 instanced gantry wheel; 10 thin rope set; 11 spreader with corner markers; 12 aligned side/end/top in the UI; 13-14 fallbacks; 15 1366x768; 16 phone; 17 real no-WebGL.

## 6 Performance against the provisional budgets (brief s6)

| Measure | Budget | Actual |
| --- | --- | --- |
| Triangles, normal (Overall) scene | <= 150,000 | 13,656 (Technical 18,384) |
| Draw calls | <= 200 | 91 Overall, 134 Technical (renderer.info) |
| GLB size | <= 8 MiB | 662,784 bytes (647 KiB), no compression, no textures |
| 10 s orbit | >= 30 fps on the reference desktop | 60.1 fps (vsync-bound, worst frame 16.9 ms) on Intel UHD 630 / D3D11, headless Chrome 155, canvas 997 x 941; 27.9 fps (worst frame 50 ms) with SwiftShader software rendering |
| Usable model | <= 5 s on office/LAN | model 138 ms, ready 301 ms after navigation (hardware); 1187 / 1673 ms (SwiftShader); loopback server |

These are workstation measurements, not the agreed office reference desktop or the target LAN, and nothing was authenticated. The budget is not changed. Rendering is on demand (frames only for controls, transitions, selection and mode changes).

## 7 Honest list of approximations

1. **Girder level interpretation (U-19)**: 50500 is read as the girder underside (trolley rail 52.42 m). It fits the side view and the stay slopes; the alternative (trolley rail at 50.5 m from lift 45 m plus the J526A0200 stack) differs by about 1.9 m.
2. **Display pose**: trolley at the 70 m outreach limit, spreader underside at 45 m, 40 ft spreader setting, boom lowered, elevator car at the first landing. Not live state; the raised boom (129.34 m marker) is not modelled.
3. **Machinery house**: position on the girder, floor 53.0 m, roof rise and centre offset are scaled estimates (+/-0.5 m); walls and plan size are measured.
4. **House internals**: main hoist, trolley drive and boom hoist units, transformers and switchgear use measured diameters/sizes where printed (drums 1180/920/1530, transformer and switchgear labels) but their positions are scaled from the J526A3000 plan and their shapes are simple cylinders/boxes. Boom-hoist motor placement and drum lengths of trolley/boom hoist are estimates. Vendor shapes are not represented.
5. **Electrical room**: cabinet identities are not legible (U-11); a neutral cabinet line-up is decorative and drives (071), PLC (081), control power (051) and A/C (152) are approximate hotspots.
6. **Hotspots without established location**: load cell (013, marker at the trolley for navigation), trolley tension (022), cable/slip-contact system (023, J526A4100 not supplied), skew system (111), floodlights (131), cabin A/C (152), emergency drive (161), gantry wheel brakes (046, one per corner, count unconfirmed), spreader twistlock/flipper corners (061).
7. **Trolley**: 8 wheels (2 per corner) read from the plan, pair pitch scaled; wheel class 630 assumed; frame shape simplified; cabin floor 47.8 m and width scaled from the GA (J526A0200's 3285 rail-to-floor relation not used, see U-19).
8. **Reeving**: rope paths for hoist, trolley and boom ropes are simplified visual paths with a 0.05 m display radius; sheave diameters at boom tip, apex and trolley are estimates; catenary trolleys are not modelled.
9. **Structure detail**: boom lacing panel points are scaled from the J526A0100 plan (the GA plan shows a slightly different X pattern); member sections are simple boxes/tubes from the printed sections; hangers, plan braces' elevation, A-frame head shape and rear-brace diameter are estimates; no fabrication detail.
10. **Gantry**: drive units are generic motor/reducer blocks on the -X side of each sub-bogie (side and shape simplified); cable reel diameter scaled (5.8 m) and its X offset estimated.
11. **Access**: landside stair tower (leg B outside face) and A-frame stair are simplified flights; walkways/handrails along girder and boom are generic; J526A5000 not read.
12. **Spreader**: STS45 drawing not supplied (U-10); overall 12.19 x 2.44 m frame from ISO dimensions; yellow colour taken from one site photo of crane 01 (spreaders are interchangeable, U-09); shape is a simplified frame, not the Bromma product.
13. **Classification proposals for Admin review** (B-08): drum brakes as 012/032, sheaves as 011/021/031, wheel brakes as 046, compressor and service crane as 151, transformers/switchgear as 121.
14. **Context**: quay slab and its edge at 5.3 m are illustrative; omitted: logos and text panels (the CICT house logo, crane numbers, ZPMC and safety panels in the site photos), yellow/black hazard striping on the sills and bogies, outdoor service-crane jibs on the house, anti-collision devices, anchors/tie-downs, lighting fixtures.

## 8 Requirement and acceptance coverage

Prototype-level evidence for S04, S05, S06, S07 (synthetic history), S12 (separate position IDs per equipment), S14 (source-linked parameters and conflicts U-01/U-02 shown as conflicts), S16 (keyboard, fallbacks, layouts) and S17 (reproducible model, measured counters). Acceptance cases supported at prototype level only (all remain formally NOT RUN until P10/P11): VIS01, VIS02, VIS03, VIS04, VIS05, VIS06, VIS08, VIS09, VIS10.
