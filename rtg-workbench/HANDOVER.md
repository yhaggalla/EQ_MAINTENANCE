# RTG workbench handover — 22 October 2026

The separate RTG package is complete for local review, including the subsequent CICT appearance update. It includes an editable deterministic model, versioned GLB/manifest, source audit, interactive viewer, typed integration adapter, independent host example, drawing comparisons and executed validation evidence. Model geometry remains provisional where the two mechanical manuals omit or contradict dimensions.

## Review and use

- Interactive demo: **http://127.0.0.1:5314/**
- Independent adapter host: **http://127.0.0.1:5314/examples/host.html**
- Downloadable local package: `dist/rtg-workbench-0.1.0.zip` (all archived files checked on readback; see `dist/package-verification.json`).
- Model: `model/1/scene.glb`; manifest and explicit synthetic equipment bindings are beside it.
- Editable source: `source/parameters.mjs`, `source/build-model.mjs`, `source/geometry.mjs`.
- Future EQ integration requirements and import examples: `INTEGRATION.md`.

The loopback server was left running at delivery. To restart from this folder, run `npm ci --ignore-scripts --no-audit --no-fund` if dependencies are absent, then `npm start`. Node 22.12+ is required. See `README.md` for build and verification commands. The archive excludes dependencies, original authority PDFs and runtime logs; source crops and audit evidence are included. Source-PDF links require the original sibling `RTG drawings` folder.

## Corrections and source decisions

The current appearance follows the seven supplied photographs: red steelwork, white cabin/rooms, yellow spreader, black/yellow guard panels, 40.5t capacity and ZPMC signs. The CICT company flag uses the subsequently supplied `04a76ac3-a3c0-494b-bbc9-2f5859c38600.png`, embedded unchanged in the GLB and displayed through a flag-shaped mesh that excludes the surrounding checkerboard. There is no national flag. Colours and panel dimensions remain photographic estimates. See `APPEARANCE.md` and `evidence/appearance/`.

The trolley uses the manual's 6,400 mm rail gauge, four 500 mm wheels and two direct drives. Its 4,050 mm wheelbase is a medium-confidence drawing interpretation. Trolley, hoist machinery and suspended cabin travel together through the 18,500 mm operating range. The headblock/spreader move vertically and the eight rope falls remain attached throughout motion. The model includes the single 1,200 mm hoist drum with eight groove groups, motor, reducer, brakes, guide sheaves and supports.

The cabin now has the detailed drawing's sloping front, glazing, suspension, access landing and internal controls. Its vertical mounting position favors the detailed trolley drawing over the small general arrangement. Staggered guide positions, staircase orientation and the moving energy-chain clearance were corrected through visual review. Five calibrated orthographic source/model overlays are supplied in `evidence/comparisons/`.

Verified/manual values and assumptions are separate in the technical sheet and `SOURCE_AUDIT.md`. The selected rope diameter is 28 mm from the 2014 manual, with the older 29 mm conflict retained. Rail elevation, cabin mounting, some section sizes and sheave diameters remain estimates. Upper rope leads are schematic; exact reeving, vendor internals, machinery handedness and issued drawing dimensions remain unresolved. Steering, telescope and skew animation are disabled where reliable pivots or limits are unavailable. `COVERAGE.md` and `COMPARISON_REVIEW.md` record these limits. Passing dimensional checks does not establish complete drawing equivalence or manufacturing suitability.

## Executed evidence

| Check | Result and boundary |
|---|---|
| Asset and contract validation | 11 checks passed; 121 semantic nodes, construction provenance and unchanged embedded flag bytes checked against the exported asset and approved catalogue snapshot |
| Dimensions | 18 exported-geometry measurements passed; source confidence remains separate from numerical export accuracy |
| Deterministic rebuild | Two consecutive builds produced identical hashes for all seven generated outputs |
| Browser behavior | 24 checks passed, no page errors; selection, tree, visibility, coupled motion, A/B identity isolation, fallbacks, mobile layout and disposal |
| Independent host | Import/mount, host loader, controlled selection, isolated histories and cleanup passed |
| TypeScript | Strict adapter declarations and React bridge example passed; actual React runtime was not exercised |
| Visual review | Five source/model registrations and three detail views captured; remaining differences explicitly classified as provisional |

On local headless Chrome 155 using Intel UHD Graphics 630 / ANGLE D3D11, a 1,035 × 648 render viewport at DPR 1 measured **60.07 FPS animation** and **60.07 FPS orbit** over separate eight-second samples. Initial overview used 87,908 triangles and 131 draw calls, with 245.2 ms model load and 888 ms whole-page readiness. The paused viewer rendered zero frames during the 600 ms idle observation. These measurements describe this local test, not a production performance guarantee. Repeated reloads retained one canvas/label layer; final disposal removed renderer resources, listeners and animation callbacks.

The GLB is 5,203,048 bytes, including the original CICT artwork. Its SHA-256 is:

```text
67ff0dfdcda384f7aca8a0199739edb38b53e6ccc95ba1ba4f9ff1a99bbeb3ab
```

Evidence: `evidence/validation/report.json`, `accuracy.json`, `reproducibility.json`, `typecheck.json`; `evidence/browser/results.json`, `host-results.json`; `evidence/comparisons/alignment.json`; and `evidence/appearance/results.json`. GLB verification used local structural checks and Three.js import, not the official Khronos validator. Node geometry validation verifies embedded PNG bytes and uses a texture placeholder; the browser decodes and renders the real embedded artwork, verified at 1,254 × 1,254 pixels on both girder faces.

## Existing-project boundary

All writes for this task were confined to `rtg-workbench/`. The two RTG source PDFs are unchanged. Concurrent QC/U1 and prompt-pack work changed files outside this folder during the run; it was preserved and is recorded in `evidence/validation/existing-files-preserved.json`. This task did not modify existing application code, advance a phase, commit, deploy, publish, or access production services.

The model and adapter are reusable for future EQ Maintenance integration. Actual application integration is **not complete**: the current approved stage-1 scope still excludes RTG 3D, the existing validator is QC-specific, and real equipment-to-position bindings must be provided explicitly. The demo's two equipment records and work histories are synthetic. Real authentication, fleet data, the production EQ host and production performance were not tested. Follow the concrete activation steps in `INTEGRATION.md` when application changes are authorized.
