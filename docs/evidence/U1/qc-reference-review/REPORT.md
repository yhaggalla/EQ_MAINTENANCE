# QC model reference review (CICT-J526A-STS draft v1, revision 13)

Phase A (review) 11 November 2026; Phase B (U1-C76 / D-226, model revision 14) 12 November 2026 after the user's answers. U1 remains NOT APPROVED.

Final build verified 12 November 2026 with the preview servers restarted on the user's answer: all captures retaken and looked at, offline and browser checks rerun (see "Phase B results").

## What was compared

| Reference | How | Result |
| --- | --- | --- |
| J526A00 p1 side, both end views and plan | Aligned orthographic captures in the `tools/p03/alignment.json` frames, drawing linework overlaid at 400 dpi | Silhouette, rail origin, main elevations, stays, braces, legs, tie beam, gantry, stair tower, elevator side, trolley / cabin / headblock at outreach all sit on the linework. Differences are D1-D4, D7-D9 below |
| J526A3000 p1 (machinery house) | Page at 200 dpi, plan and sections A-A / B-B zoomed | D1, D2, D10 |
| J526A4000 p1 (gantry cable reel) | Page at 150 / 300 dpi, view A zoomed | D4 |
| Photos | `documents/images.jpg`, `documents/images2.jpg`, cover photo in `cover.pdf` (all show CICT QCs, crane 01 legible) | D5, D6. Logo end wall, A/C row, stair tower and elevator on -Z agree with the model |
| Provenance table | Every estimated / approximate-location value against the sheets above; landmark table section 2 | 4 estimates resolved (D1-D4). All 17 landmarks pass; note D11 |

Not usable as crane references: `documents/Image_20261105154656.jpg` (whiteboard), the two `.codex-remote-attachments` JPGs (UI screenshots), `QC JPEG.jpg` / `QC PNG.png` (rasters of the J526A00 sheet itself, covered by the overlay).

**Coverage limit.** The trolley, headblock, TLS, reeving, gantry bogies, elevator and cabin interior were rebuilt from their own sheets in C17, C18, C65, C66, C71, C72, C74 and C75. In this review they were checked against the J526A00 overlays only, not re-read against J526A0200, J526A0600, J526A1000, J526A1200, J526A2000-2300, J526A3100 or J526A5100.

## Discrepancy table

| # | Area / node key | Model now | Reference says | Evidence image | Severity | Confidence | Proposed fix | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | `container.machinery-house` and everything in it; `machineryHouseCentreZ` | House centre Z = +850 (walls -8.25 .. +9.95). Main hoist reducer, drums, boom hoist, trolley drive and transformers carry the same offset, so the hoist drums are not centred on the +/-2600 rope lanes | J526A3000 p1 plan: 9200 + 9000 split at section line C with the girders (6300) centred under it; electrical room and A/C units on the 9200 side (-Z). Walls are -9.2 .. +9.0, centre -100. J526A00 landside end view and plan both draw the house centred. The landside-wall door then lands on the drawing door | `D1-J526A3000-plan.png`, `D1-house-end-ls-overlay.png`, `D1-house-plan-overlay.png` | dimensional (0.95 m) | High | `machineryHouseCentreZ` = -100, drawing-derived. Shift every house-internal Z parameter and the house parts in `reference-components.mjs` by -950 so the layout inside the house is unchanged | fixed |
| D2 | `structure.machinery-house.enclosure` roof; `machineryHouseRoofRise` | Gable rise 1200 (ridge 59.3 m) | J526A3000 p1 A-A / B-B: shallow two-pitch roof, rise scaled 0.4-0.5 m over the 10500 span, handrail on the roof. J526A00 side view read of the ridge (about 59.2 m) is the older, coarser source | `D2-J526A3000-AA.png`, `D2-house-side-overlay.png` | detail | Medium (scaled, not printed) | Rise 450, kind stays estimated, source A-A. Eaves unchanged (floor + 5100) | fixed |
| D3 | `cabinHomeRearX`; fixed boarding walkway in `container.access` | -30000, estimated, "pending exact stop dimension" (C75 open point) | J526A00 p1 side view prints **7250** from the landside rail to the hoist centre at the parked trolley position, with the cabin (item 18) drawn there. With the model's own 2500 + 3000 cabin offsets the cabin rear face is at -28250; the cabin outline scales to about -29.2 .. -25.2 including its rear platform | `D3-J526A00-cabin-home.png` | dimensional (1.75 m) | High for the 7250; medium for the rear-face derivation | `cabinHomeRearX` = -28250, drawing-derived; walkway end follows. Display pose stays at outreach. Refines C75, does not change the entrance side | fixed |
| D4 | `gantry.cable-reel.main`; `cableReelDia` | Dia 5800 estimated; drum drawn 0.9 m thick with its plane at X = +1000 | J526A4000 p1 view A: reel dia **5600**; reel plane **1225** seaside of the rail centreline on cranes 01, 03 .. 11 (1065 on even cranes); thin monospiral disc. 7885 and 2121 already match | `D4-cable-reel.png` | dimensional | High | Dia 5600 measured; plane at X = +1225 (new parameter, odd-crane value, even value in the note); disc thinned to about 0.3 m (estimated) | fixed |
| D5 | Portal tie beam and legs (no node; decal) | No markings | Photos: white "01", "SWL UNDER SPREADER / SWL UNDER CARGO BEAM" text, "SMOKING IS STRICTLY PROHIBITED" and a white ZPMC panel on the tie beam; "01" on the waterside leg. J526A00 side view item 32 shows the same nameplate beam | `D5-photo-cover-vs-model.png`, `D5-photo-images2-vs-model.png` | cosmetic | High that it exists; no approved ZPMC artwork in the repo | See question 1 | fixed (text + plain white panel, user answer) |
| D6 | `gantry.cable-reel.main` colour | Dark grey | Cover photo: reel painted red-orange with open spokes | `D5-photo-cover-vs-model.png` | cosmetic | Medium (one photo, taken at the builder's yard) | See question 2 | no change (user: keep dark grey) |
| D7 | `access.stair.a-frame` | Zig-zag stands about 1.2 m further landside of the A-frame leg than drawn | J526A00 p1 side view: flights hug the leg | `D7-aframe-hinge-overlay.png` | detail | Medium | Pull the stair in by about 1.2 m (estimated) | fixed (flights now run along the rails, as the end view draws them) |
| D8 | `access.walkway.girder-boom` near the hinge and the landside leg | Straight walkway only | J526A00 p1 side view: raised walkway frames stepping over the boom hinge and around the landside leg top | `D7-aframe-hinge-overlay.png`, `before-side-overlay.png` | detail | Medium; shape scaled only | Leave open unless wanted: needs geometry merged into the existing walkway mesh (0 draw calls spare) | fixed (user: include) |
| D9 | Portal upper beams and sill beams, end views | Square inner corners | J526A00 p1 end views: haunched inner corners | `before-end-ws-pair.png` | cosmetic | Medium | Leave open (silhouette within tolerance) | fixed (user: include) |
| D10 | `machineryHouseSeasideWallX` | -31600 estimated | J526A3000 p1 A-A / B-B: wall is (1200) landside of the landside upper sill beam; the beam width is not printed on this sheet, so the value cannot be closed (scaled about -31.8) | `D2-J526A3000-AA.png` | dimensional (about 0.2 m) | Low | No change; note the 1200 in the parameter source | open |
| D11 | Landmark "overall height" | 84.056 (passes at 0.84 %) | 83356 marker. `structure.a-frame.head` is exactly 83.356; the extra 0.7 m is the aircraft light and anemometer above it | provenance section 2 | none (reporting) | High | Measure the landmark on the head node so it reads 0 %. No geometry change | fixed (user: fix it): landmark measured on `structure.a-frame.head`, reads 83.356, 0 % |

Nothing was found that contradicts a user-confirmed decision (C27 load cells, C71 TLS, C72 fitted parts, C73 / C74 busbar on +Z, C74 cabin, C75 entrance on -Z). D3 refines the C75 open point with a printed dimension.

## Grouping

- **(a) Drawing-backed, proposed for Phase B:** D1, D3, D4 (printed dimensions); D2, D7 (scaled from a detail view); D11 (check only).
- **(b) Photo-only or needing an answer:** D5, D6.
- **(c) Conflicts with a confirmed decision:** none.
- **Left open, no change proposed:** D8, D9, D10.

## Questions for the user (answered, see below)

1. D5: add the portal markings? Options: "01" and the SWL / no-smoking text only (generated lettering, no logo); also a plain white panel where the ZPMC plate is; or leave the beam blank. A real ZPMC logo needs artwork you supply.
2. D6: paint the gantry cable reel red like the cover photo, or keep it dark grey?
3. D1 moves the whole machinery house and its contents 0.95 m toward -Z. This changes most house meshes, so the C71-C75 "unrelated meshes unchanged" comparisons will report them as changed by intent. Proceed?
4. D8 / D9: leave open, or include them (they must be merged into existing meshes to stay at 230 draw calls)?

## Tool notes found during the review

- `tools/p03/alignment.json` and `tools/p03/compose_comparisons.py` still point at `As-bulit drawing/` in the repo root; the folder is now `Drawings and manuals/As-bulit drawing/`. The overlays here were composed with a scratch copy of the composer (`tmp/qc-review-compose.py`).
- `node tools/p03/capture.mjs --u1` wrote all 15 model captures, then stopped in its P03 UI walkthrough (`window.__qc` undefined on the 5313 page). The model captures are unaffected.

## User answers (12 November 2026)

1. D5 markings: **text plus a plain white panel**. 2. D6 reel colour: **keep dark grey**. 3. D1 house shift: **proceed**. 4. D8 / D9: **include both**.

Later the same day: restart the servers and finish; crane number **follows the selected crane**; **fix D11**.

During Phase B the user also said: "make the draw-call budget to 350" and "i have seen several floating items (items which are not connected to anything and just floating) in the model earlier (eg; machine house, back reach etc..).. check for those and correct it".

## Phase B results (U1-C76, revision 14)

### What changed

| Item | Change | Source edits |
| --- | --- | --- |
| D1 | House walls -9.2 .. +9.0 (`machineryHouseCentreZ` -100, drawing-derived). Main hoist reducer on the crane centreline (`mainHoistDriveZ` 0); every other house drive, the transformers, service crane, hatch and the 42 workbook parts in the house moved -850 with it, so the layout inside the house is unchanged and the drums are symmetric about the +/-2600 rope lanes | `params.json`; `build.mjs` (`HDZ`) |
| D2 | Roof rise 450 (estimated, J526A3000 A-A) | `params.json` |
| D3 | `trolleyParkFromLandsideRail` 7250 (measured, new); `cabinHomeRearX` -28250 (drawing-derived); the fixed boarding walkway now ends there | `params.json` |
| D4 | Reel dia 5600 (measured), plane 1225 seaside of the rail (`cableReelPlaneFromRail`, new, odd-crane value), disc 300 wide (estimated); support and bearing arm moved landside of the disc; reel accessories follow the plane | `params.json`; `build.mjs`; `fitted-components.mjs` |
| D5 | Decal `container.portal.markings`: lettering band on both tie beams (generated Arial Bold lettering, plain white panel at the ZPMC plate, SWL 65T / 75T from the J526A00 particulars). **Crane number follows the selected crane** (user answer): separate decal `container.portal.crane-number` on both tie beams and both waterside legs with a blank placeholder texture; the viewer draws the number from the equipment code (`setCraneNumber`). Checked: QC01 shows 01, QC02 shows 02; a bare GLB shows no number | `build.mjs`; `textures/portal-markings.png` and `portal-number-blank.png` from `tools/u1/make_portal_markings.py`; `tools/model-generator/lib/scene-builder.mjs` (decal role in the node extras); `artifacts/prototypes/p03-qc-model/js/viewer.mjs`; `artifacts/prototypes/p02-ui/js/qc-viewer.mjs` |
| D11 | Overall-height landmark measured on the A-frame head | `tools/model-generator/generate.mjs` |
| D7 | A-frame stair: 8 flights in two lanes running along the rails beside leg A, final flight to the apex platform; apex handrail opening moved | `params.json`; `build.mjs` |
| D8 | Girder / boom walkway stops at the portal upper beams and steps over them (flights to the portal-top platform at the hinge; flight, deck and a descent to the house walkway at the landside beam); portal-top rails open at the stair heads | `params.json`; `build.mjs` |
| D9 | Haunches under both upper portal beams and on both sill beams | `params.json`; `build.mjs` |
| Budget | Draw-call budget 230 -> 350 on the user's instruction | `tools/model-generator/generate.mjs` |
| Validator | Checks each declared texture against the embedded images (it compared every texture with the first image only, which fails as soon as there are two) | `tools/model-generator/validate.mjs` |

### Floating-part sweep (user request during Phase B)

New tool `tools/u1/find_floating_parts.mjs`: splits every mesh and instance into connected pieces and reports each group of pieces that touches nothing connected to the main structure (30 mm tolerance; hidden optional attachments skipped).

Revision 13: **33 detached pieces in 29 parts** (`floating-before-rev13.json`). Revision 14: **0** (`floating-after-rev14.json`).

| Area | Part | Was | Now |
| --- | --- | --- | --- |
| Machinery house | Main hoist drum brakes A / B, boom hoist drum brake (and every other disc brake) | Thruster cylinder stood free beside the caliper | Lever arm from caliper to thruster (brake helper) |
| Machinery house | Drum-brake switches 1 / 2, motor absolute encoder, boom-hoist drum bearing seat, service-crane oil point | 0.12-1.3 m from anything | Seated on the thruster, the motor end, a floor-to-shaft pedestal and the service-crane hoist |
| Back reach | Girder-tail service crane hoist block and hook | Hung between the runway beams with no crab | Crab beam between the runway beams |
| A-frame / apex | Aircraft light, anemometer, apex lever switch, equalizer sheave, boom latch hook thruster, stowage pins 1 / 2 and their switches | In the air above or beside the apex | On the guard-frame rail / handrail; sheave bracket on the platform; latch frame cantilevered from the leg-top node (shape estimated, J526A6200 not read) |
| Trolley | Buffers 1-4 (keyed parts) and the four frame buffer tubes, weight lever switch, cable-reel oil point | Tubes 125 mm clear of the frame; keyed buffers a second cylinder below them; switch and oil point 0.3-0.65 m from anything | Bracket on the side-frame plate; keyed buffer on its tube; switch under the frame; oil point on the reel drive |
| Spreader | Electrical box | 60 mm clear of the main beams | Widened to sit on them |
| Portal / gantry / access | Portal-top handrail bars (no posts), anti-creeper oil point, elevator oil point | Free bars; 0.18 / 0.34 m from anything | Rails with posts; on the sill face; on the car roof |

Limit: at a 5 mm tolerance the finder still lists several hundred pieces with 10-25 mm drawing gaps (seat cushions, cab louvres and similar). They read as attached at any normal view distance and were left alone.

### Checks on the final build

| Check | Result |
| --- | --- |
| `node tools/model-generator/validate.mjs` | 26 / 26 PASS |
| `node tools/p03/check_bindings.mjs` | 11 / 11 PASS (copy of the first C76 run in `binding-validation.json`) |
| `node tools/u1/model_diff.mjs` vs Git HEAD (revision 13) | 0 added, 0 removed, 0 identity changes; 112 nodes with changed bounds, label or hotspot point (`model-revision-diff.json`) |
| `node tools/u1/check_reference_c76.mjs` (new; baseline = saved revision 13) | 19 / 19 PASS (`scope-and-dimensions.json`): identities and instance maps; only named meshes changed; TLS, busbar, cabin, trolley sheaves, headblock and load cells byte-identical; rope vertices outside the house unchanged; D1-D9 dimensions; floating parts 0; budgets |
| `node tools/u1/find_floating_parts.mjs` | 0 islands (33 in revision 13) |

Browser checks on the final build (servers on 5312 / 5313):

| Check | Revision 14 (final) | Revision 13 (same day, same working tree) | Reading |
| --- | --- | --- | --- |
| `check_unified_viewer.mjs` (base 5312) | 11 / 11 on one run, 10 / 11 on the next (step 03 "distorted view after resize"); earlier C76 builds gave 10 / 11 with step 02 failing | 11 / 11 on one run | Timing-dependent steps with fixed waits: step 02 reads the Technical tab 500 ms after the click, and its load time measured 0.3-1.1 s on both revisions. Content is identical once loaded. Check not changed |
| `check_flat_isolation.mjs` | Stops at "Flat default, rotation locked" (run before the sweep) | Same | Fails identically on revision 13: UI drift, not the model |
| `check_u1_c34.mjs` | 5 / 22 (run before the sweep) | 5 / 22 | Same failures on revision 13 (missing `tab-maintenance`, `view-flat`, `labels` controls) |
| `tools/p03/check_model_prototype.mjs --gpu hardware`, `check_no_webgl.mjs` | Harness exception: `window.__qc` undefined | Same error in the Phase A capture on revision 13 | The 5313 page no longer exposes `__qc`; pre-existing |
| `check_cabin_c75`, `check_cabin_c74`, `check_busbar_c73`, `check_floating_c72`, `check_backreach_c71` | Scope assertions fail | c74, c73, c72 and c71 already fail on revision 13; c75 passed | Each compares byte-for-byte with its own earlier baseline, so any later revision that touches another mesh fails it. Their subjects are covered by `check_reference_c76.mjs` (byte-identical). Checks not changed |

Looked at on the final build: the four aligned overlays, the 11 perspective close-ups (`after/D*.png`, `after/photo-angle.png`), and the viewer shots `after/ui-*.png` (crane number on QC01 and QC02, apex fittings, machinery-house brakes, boom hoist, trolley buffers, back reach, whole crane in Technical). The girder-tail service hoist is small in its shot; its attachment rests on the finder result. Flat mode was not looked at separately (its check is one of the pre-existing failures).

### Budgets

| Counter | Revision 13 | Revision 14 | Budget |
| --- | --- | --- | --- |
| Triangles (all modes) | 92 490 | 95 490 | 150 000 |
| Draw calls (all modes) | 230 | 232 | 350 (was 230) |
| `scene.glb` bytes | 3 910 668 | 4 109 872 | 8 388 608 |
| Nodes | 410 | 410 | |

### Evidence

`comparison/` (Phase A, revision 13 against the references), `after/` (final revision 14: aligned views `model-*.png`, close-ups `D*.png`, viewer shots `ui-*.png`), `model-revision-diff.json`, `scope-and-dimensions.json`, `floating-before-rev13.json`, `floating-after-rev14.json`, `binding-validation.json`, `regression/`.

## Before state

Captures of revision 13: `tmp/qc-review-before/` (scratch). Counters: 92 490 triangles, 230 / 230 draw calls, 3 910 668 bytes, 410 nodes.

## U1-C77 follow-up (revision 15, 12 November 2026)

User answers: read J526A6200 and J526A0100 and correct the boom latch and D10; repair the stale checks; use the artwork added as `documents/zpmc flag.jpg` for the ZPMC plate ("enhance the same art work and add it"); commit everything.

### Model

| Item | Reference | Change |
| --- | --- | --- |
| Boom latch (stowage device) | J526A62 (J526A6200 p1): hook spacing 5750, 2700 to the pylon centre, hook centre 850 above the safety latch platform, lever 1900 / 1300, balancing box 340 x 540, two hooks. The sheet does not give the platform elevation. J526A00 side view draws a braced platform on the waterside of the A-frame at about 62.2 m (scaled from a 1000 dpi crop) | New key `boom.latch.frame` (031, A-frame): cross beam between the A-frame legs, two latch platforms, lever supports, hook levers and balancing boxes. The latch parts (hook thruster, stowage pins 1 / 2 and their switches, stowage limit switches) moved from the apex (about 78.6 m, supported by no sheet) to the latch. The C76 apex latch frame is withdrawn. **Platform elevation 62.2 m is an estimate**; the hook direction (lever toward the A-frame) is read from the lever lengths fitting the platform, not printed |
| D10 house seaside wall | J526A3000 A-A / B-B: wall (1200) from the landside upper sill beam. J526A010100 (J526A0100 p3) section D-D: beam 1330 wide | `machineryHouseSeasideWallX` -31865, drawing-derived (-30000 - 665 - 1200). House shell, frame, drives, transformers, cabinets, hatch, service crane and the workbook parts moved -265 with it. **D10 closed** |
| Portal upper beams | J526A010100 sections C-C / D-D: 1330 wide; view A prints 3350 for the landside beam zone (view B 2850 waterside) | Beams 1330 wide (were 1600); landside zone 3350 (was 2850); the walkway crossing at the landside beam follows the new faces |
| ZPMC plate | `documents/zpmc flag.jpg` supplied by the user (420 x 420 JPEG) | Decal `container.portal.zpmc-plate` on both tie beams with `textures/zpmc-plate.png` (1024 x 400). The artwork is cropped, enlarged with Lanczos resampling and rebuilt as the logo blue on white with a contrast curve; nothing is redrawn. The plain panel is removed from the lettering strip. Sharpness is limited by the source file |

### Check repairs (user: "Repair them")

| Check | Cause | Repair |
| --- | --- | --- |
| `tools/p02b/check_unified_viewer.mjs` | Fixed 500 / 400 ms waits; the panel query and canvas resize take 0.3-1.1 s under software WebGL | Steps 02 and 03 wait for the panel to finish loading / the aspect to settle (up to 5 s). Assertions unchanged |
| `tools/p02b/check_flat_isolation.mjs` | Flat mode was removed with the simplified equipment view (commit cb0fc59) | The two Flat assertions test the 3D default and the crane framing instead; the `view-3d` / `view-flat` clicks are removed. Area-isolation assertions unchanged |
| `tools/p02b/check_u1_c34.mjs` | No Flat mode, no Maintenance tab (C63), three label modes instead of one toggle (C66), Special heading now a count | Tests the 3D view, the three remaining tabs, `labels-selected` / `labels-key`, a perspective Reset and the phone layout by projection. Other assertions unchanged |
| `tools/p03/check_model_prototype.mjs`, `tools/p03/check_no_webgl.mjs` | The standalone P03 page is a redirect to the shared viewer since U1-C32, so `window.__qc` never exists | They detect the redirect and report SUPERSEDED (exit 0) instead of crashing. They do not test anything now; coverage is `check_unified_viewer.mjs` |
| `tools/p03/capture.mjs` | Same retired page in its UI walkthrough | Skips the walkthrough after the model captures and still writes its log |
| `tools/p03/alignment.json` | Drawing folder moved | `pdf` path now `Drawings and manuals/As-bulit drawing/...` |

### Checks on revision 15

| Check | Result |
| --- | --- |
| `node tools/model-generator/validate.mjs` | 26 / 26 PASS |
| `node tools/p03/check_bindings.mjs` | 11 / 11 PASS |
| `node tools/u1/model_diff.mjs` vs Git HEAD (revision 13) | 1 added (`boom.latch.frame`), 0 removed, 0 identity changes |
| `node tools/u1/check_reference_c77.mjs` (new; baseline = saved revision 14 in `tmp/qc-rev14-final`) | 15 / 15 PASS (`scope-and-dimensions-c77.json`) |
| `node tools/u1/find_floating_parts.mjs` | 0 islands (`floating-after-rev15.json`) |
| `check_unified_viewer.mjs` (base 5312) | 11 / 11 on three consecutive runs |
| `check_flat_isolation.mjs` | 19 / 19 |
| `check_u1_c34.mjs` | 22 / 22 |
| `tools/p03` browser checks | SUPERSEDED (not a pass) |
| `check_reference_c76.mjs` | Not rerun: it asserts revision 14 and 410 nodes, so it is a per-revision check like the C71-C75 ones |

Looked at on revision 15 in the viewer: `after/ui-C77-zpmc-plate-b.png` (plate and crane number 02 on QC02), `ui-C77-latch.png`, `ui-C77-house-wall.png`. The `-a`, `-latch-side` and `-whole` shots were written but not opened. The aligned drawing overlays in `after/model-*.png` are still revision 14: the preview servers were stopped by the system for low memory before they could be retaken, and were not restarted.

### Budgets

| Counter | Revision 13 | Revision 14 | Revision 15 | Budget |
| --- | --- | --- | --- | --- |
| Triangles | 92 490 | 95 490 | 96 102 | 150 000 |
| Draw calls | 230 | 232 | 237 | 350 |
| `scene.glb` bytes | 3 910 668 | 4 109 872 | 4 214 372 | 8 388 608 |
| Nodes | 410 | 410 | 411 | |

### Still open

- Boom latch platform elevation (62.2 m, scaled) and hook direction: confirm on site or from a sheet that dimensions the platform.
- The portal upper beam is modelled as one box over the printed 2850 / 3350 zone; the 2000 / 2500 box section inside that zone is not drawn separately.
- Aligned overlays of revision 15 not retaken.
