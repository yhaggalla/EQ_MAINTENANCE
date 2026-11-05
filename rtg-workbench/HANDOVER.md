# RTG workbench handover — revision 2, 4 November 2026 (first delivery 22 October 2026)

The separate RTG package is complete for local review, including the subsequent CICT appearance update. It includes an editable deterministic model, versioned GLB/manifest, source audit, interactive viewer, typed integration adapter, independent host example, drawing comparisons and executed validation evidence. Model geometry remains provisional where the two mechanical manuals omit or contradict dimensions.


## Revision 2.7 — cab interior from site photos (5 November 2026)

The user reported that the cab looked empty. The seat and consoles existed but showed only in Technical mode. From cab photos WA-02/03, the interior is now visible in both modes:

- **Seat:** a black high-back suspension seat facing the spreader.
- **Consoles:** two stainless armrest consoles, each with a joystick and a grid of green, red, white and yellow push-buttons. The right console also has the red emergency stop.
- **New parts:** `cabin.hmi.main`, a stainless cabinet with HMI touchscreen and louvres at the rear corner, and `cabin.cctv.main`, a CCTV monitor hung from the front ceiling plus a small indicator panel.
- **Cab shell additions:** protective bars over the lower front glazing, rolled lilac blinds, a dark floor mat and the main-particular plate.

To keep exactly 300 parts, each girder's ZPMC maker sign is now part of its capacity-sign part. Sizes and positions are scaled from wide-angle photos. The GLB is 8.33 MB, about 57 KB under the 8 MiB budget, so further detail will need geometry savings elsewhere.

## Revision 2.6 — stair-side staircase rebuilt (5 November 2026)

The user marked the upper staircase areas for adjustment. The faults were:

- Turning flights shared one plane, so they cut through each other and their handrails crossed the landings.
- The upper flights were 60°+ ladders.
- The 24.8 m landing floated 1.3 m outside the leg with no support.
- The top landing sat inside the girder end and the cross walkway, whose handrail ran down its centre.

The staircase is now a switchback on the GA route:

- **Route:** ground → 4.44 m beyond the front sill → 7.8 m over the E-room platform → 14.8 m at the rear leg → 21.8 m at the front leg → 23.2 m cantilever landing beyond the front leg → the top walkway.
- **Lanes:** two 760 mm lanes side by side, so a flight that turns 180° never shares a plane with the next one.
- **Upper flights:** the long flights are about 50°, and the two upper flights match them, replacing the earlier 60°+ ladders.
- **Supports:** each landing has a frame and is braced to the nearest leg; the 7.8 m landing is posted to the E-room platform and the 23.2 m landing is cantilevered from the front leg.
- **Handrails:** only open where a flight or walkway connects.
- **Top landing:** sits outboard of the girder end and joins the cross walkway. That walkway's handrail moved from its centreline to its outer edge, with an opening at the stair.

Landing elevations 7.8, 14.8 and 21.8 m follow the GA. Lane offsets, the 23.2 m landing position and the bracing are estimates (SOURCE_AUDIT C20). The 4.44 → 7.8 m flight is still steep (~62°) because the GA places both landings at the front leg. Still 300 parts.

## Revision 2.5 — exhaust pipe routed up the leg (5 November 2026)

The user pointed out that the short exhaust stack on the power-room roof was wrong: the exhaust line connects to the RTG leg and goes up to the top. `auxiliary.exhaust.main` is now a Ø180 pipe. It leaves a roof outlet, crosses to the front −X leg, and climbs that leg's outboard face with clamps about every 3 m. It passes outside the girder end and rises through a sleeve in the cross walkway to a rain cap about 1.4 m above the rail level. The route stays off the girder sides, so it clears the trolley, fall sheaves, ropes and the chain trough at every travel position. The leg used, pipe size, clamp spacing and exit height are estimates; please confirm them on site. Still 300 parts.

## Revision 2.4 — ladder positions and spreader drop cable (5 November 2026)

The user marked the ladder positions on site photos and the model, said they were all wrong, and pointed out that the spreader drop cable was missing.

- **Drive-platform ladders (4):** they now climb the outboard side face at the outer end of each driven wheel, from the wheel guard to the platform, as in the marked photos (WA-20/23/24). Before, they were on the bogie end face. Each platform gained an outboard deck strip to receive its ladder, and the handrails were reshaped so they leave the ladder opening clear.
- **Power-room access:** the free-standing ground ladder beside the −X front bogie is removed, because no photo shows one there. `access.ladder.power-room` is now a ladder from the front −X drive platform up to a landing at the leg end, at room-platform level, joined by a walkway to the power-room platform. This route is an estimate based on the stacked leg-end platforms in WA-20/21; please confirm it on site.
- **Spreader drop cable:** new part `hoist.spreader-cable.drop`. It runs from the spreader cable reel along the trolley to a guide bellmouth under the trolley, then hangs vertically through the guide cage onto the cone in the headblock basket. The hanging span is driven by the hoist motion (viewer role `drop-cable`), so it stays attached at every lift height. To keep 300 parts, the energy chain's fixed-end anchor became part of the guide trough.
- **Motor cable:** the gantry-motor cable previously ended in mid-air beyond the sill. It now runs over the equalizer to the sill end face, and the terminal box faces the bogie centre.

## Revision 2.3 — site-photo adjustments (5 November 2026)

The user added 28 new site photographs of a CICT RTG to `RTG drawings/` and asked for the model to be adjusted to them. The originals are unchanged. Downscaled copies of the 15 photos used, plus the 2017 busbar photo, are in `evidence/sources/PHOTOS/` with a SHA-256 register of all 28 originals. Parts whose shape comes from a photo now cite it, and the demo shows that photo as the part's source evidence. Still 300 parts, still standalone.

- **Turning jacks (WA-23/24/26):** each jack is now centred under its equalizer, between the two tyres. It has a square guide sleeve, red barrel, chrome rod and a ribbed swivel foot about 0.2 m above the ground.
- **Drive corners (WA-20/24/25/26):** the drive now stands outboard at the outer end of the driven wheel and steers with it. The vertical grey motor has a red top cover, and the chain case is red. A service platform with handrail and a red end ladder were added: `access.drive-platform.*`, four parts. To keep 300 parts, the brace end clevises became geometry of their brace bars.
- **Wheels:** black rims with red hub caps, and a red cover on each driven sprocket.
- **Sheaves (WA-04/06/07):** all twelve are yellow with six lightening holes, rim flanges and a red hub.
- **Hoist motor (WA-05):** grey ribbed body, cream forced-cooling unit, and a top terminal box with power cables.
- **Trolley:**
  - The gearmotors are shaft-mounted on the wheel axle, with the motor along X and a red fan cowl, under the walkway deck (WA-11/13).
  - The connect box is now a tall stainless electrical cabinet (WA-05/13).
  - The energy chain's moving end hangs from a portal over the girder walkway (WA-11).
- **Headblock (WA-15/17):** the cable basket is a yellow bucket with a cable coil, a centre cone and a converging guide cage above.
- **Frame and rooms:**
  - The leg floodlights moved from 19.5 m to black LED panels at about 6.2 m, facing the travel direction (WA-25/26).
  - Steering hydraulic pipework runs along the outer sill faces, with drops to each bogie (WA-23/24/27).
  - The power room got two protective tie bars between the legs (WA-27).
- **Technical sheet:** it now includes the cab nameplate (WA-01): RC40.5t, ZP12-1874, licence TS2410724-2014, max wheel load under 41 t, group class U8/Q3/A8, CAT C7 and generator TYFZ18000-280L-G.
- **Size:** to stay within the 8 MiB GLB budget, drum groove rings and sheave detail use fewer segments.
- **Not changed:** the fleet number "06" in the photos is not adopted as an identity. Sign positions are unchanged because the photos disagree on them. Proportions read from wide-angle photos are approximate; see SOURCE_AUDIT C17.

## Revision 2.2 — turning jacks and full-model review (4 November 2026)

- **Turning jacks:** the user reported that the jack system was missing: an RTG needs four jacks to turn its wheels. There is now one hydraulic jacking cylinder per bogie, `gantry.turning-jack.*` (four in all). Each sits on a sill bracket between the two tyres, inboard of the steering cylinder, and is shown retracted. Its body, rod, pad and hoses are modelled; rating, stroke and mounting are estimated because no jack drawing was supplied (SOURCE_AUDIT C16). To keep exactly 300 parts, the four welded sill-end lifting lugs are now part of their sill beams.
- **Review method:** a primitive-level clash scan of the exported GLB, plus 14 rendered review views covering every assembly.
- **Fixes from the review:**
  - The gantry reducers were sunk into the equalizer ends; they now sit on top, with motor and small sprocket raised to match.
  - The equalizer pivot blocks no longer pass into the sills.
  - Steering was not mirrored: on the right-hand bogies the steering link ran through the chain guard and the guard rail through the wheel sprocket. Steering, link rod and jack are now inboard on both sides; chain drive and lock-pin cylinder are outboard.
  - The first stair flight ran through the right-front wheel fork and guard; the whole stair moved 350 mm outboard, and the top landing now meets the walkway level.
  - Smaller fixes: trolley gearmotors clear the wheel bearings, the reducer shaft cap no longer sits inside the drum, and the lock-pin cylinders clear the pivot-pin caps.
- **Still reported by the scan:** only intended contacts or nesting (rims in tyres, pins through beams, telescopic beams in the spreader frame, parts touching tapered legs).

## Revision 2.1 — wire-rope reeving rebuilt (4 November 2026)

The user reported that the wire ropes were still wrong. The reeving was re-derived from M14 p26–27 (text and Fig 2-14) and the JL28606 views, then rebuilt. It is still 300 parts and still standalone.

- **Topology:** each rope runs from the drum, round its sheaves, to the headblock. The pairs meet through turnbuckles at the four headblock edge midpoints, forming four isosceles triangles. There are 8 fall sheaves and 4 horizontal guides.
- **Leads:** each lead is tangent to the drum and its sheaves and lies in the plane of the sheave it enters. Four leads leave the drum bottom toward +Z and four leave the top toward −Z, so all eight wind in together. The four end-pair leads turn 90° on the guides. Nothing crosses the trolley.
- **Check against the manual:** the modelled free lengths split into the same groups as the manual's rope lengths, in the same order. Side pairs are 23.81 m × 4 (manual 42.3 × 4); end pairs are 24.54 m × 2 (manual 43.5 × 2) and 26.06 m × 2 (manual 44.9 × 2). The gaps between groups (0.73 m and 1.52 m) differ from the manual's (1.2 m and 1.4 m); dead wraps and drum storage are not modelled. `npm run validate` now checks this pattern and the four two-rope pins.
- **Moved to clear the ropes:** trolley end beams to the frame ends, machinery cross beams under the drum bearing and reducer, machinery bases raised, grease lines re-routed, and headblock beams at ±600 mm (≈1,410 mm wide as drawn).
- **Still estimated:** groove assignment, sheave shaft coordinates and diameters. See SOURCE_AUDIT C15.

## Revision 2 — 300-part model (4 November 2026)

The user asked for the RTG model to be perfected from the documents in `RTG drawings/`, with 300 parts, updating the same model and **not** integrating it into the main app. `model/1/` was regenerated in place. No file outside `rtg-workbench/` changed except a local `rtg-workbench` preview entry in `.claude/launch.json`. Nothing in the EQ application, prompt pack, phase records or `RTG drawings/` changed.

- **300 selectable parts:** 291 positions plus 9 qualified area markers, under 15 spatial containers (315 nodes). v1 had 121 nodes and 111 parts. Every part has a distinct label, a container parent, an approved sub-code and a source reference; `npm run validate` asserts the count.
- **Split into real components:**
  - Per wheel: tyre, rim/hub/studs, wheel fork, slewing bearing and protective frame.
  - Per bogie: equalizer, pivot pin, lock-pin cylinder, steering cylinder and link rod.
  - Per driven wheel: motor, reducer, chain + guard and 58-tooth sprocket.
  - Trolley: two girders, two end beams, two cross beams, four walkways, wheel bearings and drive brakes.
  - Hoist: drum coupling, bearing seat, machinery base, reducer oil fittings, fan, encoder, high-speed couplings, overspeed and cam limit switches.
  - Headblock: rope sockets, skew cylinders, connectors and junction box.
  - Spreader: flippers, telescopic drive, power pack and junction box.
  - Cab: door, support beams, four hangers, seat, two consoles and wiper.
  - Stairs: six flights and six landings.
  - Rooms: door, louvre, exhaust, radiator and fuel tank.
  - Name plates: capacity sign, maker sign and CICT flag panels.
- **Added from the documents:**
  - Girder-end lifting ears, sill lugs, leg knee and foot joints, rail clips and brace clevises (Pic 2-3).
  - Corner anti-collision switches and the steering hydraulic station (p23/24, GA item 12).
  - Trolley anchors, over-height limit, central lubrication, spreader cable reel and connect box (JL28606, p38).
  - Wind speed indicator, GPS/RCMS mast, travel limit switches, leg floodlights, travel beacons and travel horn (p14, GA items 10/13).
  - The second E-room air conditioner; the stainless chain trough, L bracket and fixed anchor (p36).
- **Added from the photos:** a DZD-230 busbar power collector (mounting frame, arm, collector head, hoses and terminal box). The photos show it fitted, but the manual lists the project option as diesel + battery (conflict C12). Treat it as an unconfirmed retrofit.
- **Corrections:**
  - Gantry chain sprockets now use the pitch diameters derived from Table 2-5 (17 T 276.5 mm, 58 T 938.3 mm).
  - The brace bar ends at clevises on the inner leg faces, not inside the legs.
  - The cab hangs from cantilever support beams instead of free-ending hangers.
  - The steering cylinders now clear the slewing bearings.
- **Budgets:** the draw-call budget was raised from 200 to 420 and the triangle budget from 150,000 to 200,000 to fit 300 pickable parts. Measured after revision 2.2: 121,304 triangles, 330 draw calls, 60 FPS.

All new locations without a source coordinate are estimates. Each one carries its source page and qualifier in the technical sheet and `geometry-parameters.json`. `SOURCE_AUDIT.md` (C12–C14) and `COVERAGE.md` list what is still unresolved.

## Review and use

- Interactive demo: **http://127.0.0.1:5314/**
- Independent adapter host: **http://127.0.0.1:5314/examples/host.html**
- Downloadable local package: `dist/rtg-workbench-0.1.0.zip` (all archived files checked on readback; see `dist/package-verification.json`).
- Model: `model/1/scene.glb`; manifest and explicit synthetic equipment bindings are beside it.
- Editable source: `source/parameters.mjs`, `source/build-model.mjs`, `source/geometry.mjs`.
- Future EQ integration requirements and import examples: `INTEGRATION.md`.

The loopback server was left running at delivery. To restart from this folder, run `npm ci --ignore-scripts --no-audit --no-fund` if dependencies are absent, then `npm start`. Node 22.12+ is required. See `README.md` for build and verification commands. The archive excludes dependencies, original authority PDFs and runtime logs; source crops and audit evidence are included. Source-PDF links require the original sibling `RTG drawings` folder.

## Corrections and source decisions

The current appearance follows the seven supplied photographs: red steelwork, white cabin/rooms, yellow spreader, black/yellow guard panels, 40.5t capacity and ZPMC signs. All eight tyres now have matching guard panels and supports; the four inner guards were added following the user's annotated missing-guard screenshot. The CICT company flag uses the subsequently supplied `04a76ac3-a3c0-494b-bbc9-2f5859c38600.png`, embedded unchanged in the GLB and displayed through a flag-shaped mesh that excludes the surrounding checkerboard. There is no national flag. Colours and panel dimensions remain photographic estimates. See `APPEARANCE.md` and `evidence/appearance/`.

The trolley uses the manual's 6,400 mm rail gauge, four 500 mm wheels and two direct drives. Its 4,050 mm wheelbase is a medium-confidence drawing interpretation. Trolley, hoist machinery and suspended cabin travel together through the 18,500 mm operating range. The headblock/spreader move vertically and the eight rope falls remain attached throughout motion. The model includes the single 1,200 mm hoist drum with eight groove groups, motor, reducer, brakes, guide sheaves and supports.

The cabin now has the detailed drawing's sloping front, glazing, suspension, access landing and internal controls. Its vertical mounting position favors the detailed trolley drawing over the small general arrangement. Staggered guide positions, staircase orientation and the moving energy-chain clearance were corrected through visual review. Five calibrated orthographic source/model overlays are supplied in `evidence/comparisons/`.

Verified/manual values and assumptions are separate in the technical sheet and `SOURCE_AUDIT.md`. The selected rope diameter is 28 mm from the 2014 manual, with the older 29 mm conflict retained. Rail elevation, cabin mounting, some section sizes and sheave diameters remain estimates. Since revision 2.1 the rope leads are tangent-continuous and follow the documented 8-rope topology; groove assignment, sheave shaft coordinates, vendor internals, machinery handedness and issued drawing dimensions remain unresolved. Steering, telescope and skew animation are disabled where reliable pivots or limits are unavailable. `COVERAGE.md` and `COMPARISON_REVIEW.md` record these limits. Passing dimensional checks does not establish complete drawing equivalence or manufacturing suitability.

## Executed evidence

| Check | Result and boundary |
|---|---|
| Asset and contract validation | 13 checks passed (adds the eight-rope reeving topology check); 315 semantic nodes including exactly 300 selectable parts, construction provenance and unchanged embedded flag bytes checked against the exported asset and approved catalogue snapshot |
| Dimensions | 20 exported-geometry measurements passed (adds both derived sprocket pitch diameters); source confidence remains separate from numerical export accuracy |
| Deterministic rebuild | Two consecutive builds produced identical hashes for all seven generated outputs |
| Browser behavior | 24 checks passed, no page errors; selection, tree, visibility, coupled motion, A/B identity isolation, fallbacks, mobile layout and disposal |
| Independent host | Import/mount, host loader, controlled selection, isolated histories and cleanup passed |
| TypeScript | Strict adapter declarations and React bridge example passed; actual React runtime was not exercised |
| Visual review | Five source/model registrations and three detail views captured; remaining differences explicitly classified as provisional |

On local headless Chrome 156 using Intel UHD Graphics 630 / ANGLE D3D11, a 1,035 × 648 render viewport at DPR 1 measured **59.97 FPS animation** and **60.01 FPS orbit** over separate eight-second samples (revision 2.7). Initial overview used 138,500 triangles and 334 draw calls, with 220 ms model load. These measurements describe this local test, not a production performance guarantee. Repeated reloads retained one canvas/label layer; final disposal removed renderer resources, listeners and animation callbacks.

The GLB is 8,331,644 bytes, including the original CICT artwork. Its SHA-256 is:

```text
03f92de1ed54f0f04bde7e171144b3f6f7c2246fc81182340b6fa1736c7ff748
```

Evidence: `evidence/validation/report.json`, `accuracy.json`, `reproducibility.json`, `typecheck.json`; `evidence/browser/results.json`, `host-results.json`; `evidence/comparisons/alignment.json`; and `evidence/appearance/results.json`. GLB verification used local structural checks and Three.js import, not the official Khronos validator. Node geometry validation verifies embedded PNG bytes and uses a texture placeholder; the browser decodes and renders the real embedded artwork, verified at 1,254 × 1,254 pixels on both girder faces.

## Existing-project boundary

All writes for this task were confined to `rtg-workbench/`. The two RTG source PDFs are unchanged. Concurrent QC/U1 and prompt-pack work changed files outside this folder during the run; it was preserved and is recorded in `evidence/validation/existing-files-preserved.json`. This task did not modify existing application code, advance a phase, commit, deploy, publish, or access production services.

The model and adapter are reusable for future EQ Maintenance integration. Actual application integration is **not complete**: the current approved stage-1 scope still excludes RTG 3D, the existing validator is QC-specific, and real equipment-to-position bindings must be provided explicitly. The demo's two equipment records and work histories are synthetic. Real authentication, fleet data, the production EQ host and production performance were not tested. Follow the concrete activation steps in `INTEGRATION.md` when application changes are authorized.
