# CICT EQ Maintenance - P03 QC model prototype

> **Current entry (U1-C32..C36; U1 NOT COMPLETE / NOT APPROVED):** Run `node artifacts/prototypes/p02-ui/serve.mjs 5312` and open `http://127.0.0.1:5312/#/eq/equipment/eq-qc-demo-01`. One renderer/model now supplies 3D and fixed-side Flat modes within the equipment page. Flat is the default. Reset restores the whole crane in the current Flat/3D mode; 3D starts/resets to the supplied three-quarter reference. Isolate area opens any of the 11 physical containers with its included parts and four working, scoped information tabs. Yard/rail is at 0 m and sea at -5 m; this decorative context is hidden in isolation. The P03 entry redirects saved links to that page. Older separate-page/SVG descriptions and tests below are historical; current checks are `tools/p02b/check_unified_viewer.mjs` and `tools/p02b/check_flat_isolation.mjs` and `tools/p02b/check_u1_c34.mjs`. Registered selected spare parts use Update condition; unregistered ones use Add spare part (C35). These adjustments remain U1 work; P04 is Not started. The P03 model, renderer and capture helpers remain shared source/evidence assets.


Interactive Three.js prototype of the drawing-derived CICT-J526A-STS model (version 1). **Synthetic equipment, bindings and history only. Nothing is saved, there is no sign-in, and the QC-DEMO association is not a fleet fact.**

## Run

```powershell
node artifacts/prototypes/p03-qc-model/serve.mjs     # http://127.0.0.1:5313/
```

The page needs HTTP (ES modules and an import map), so `file://` does not work. three.js 0.186.1 is vendored under `vendor/three/` (MIT licence included); the generated model is served from `artifacts/models` under `/models/`; the catalogue and parameter references come read-only from `documents/prompt-pack/reference` under `/ref/`. No CDN, no network access.

| Link | Shows |
| --- | --- |
| `/?eq=eq-qc-demo-01` | Overall mode, full-crane view |
| `/?eq=eq-qc-demo-01&main=mi-q01-01&mode=technical` | Main 01 Hoist: union of bound positions |
| `/?eq=eq-qc-demo-01&sub=si-q01-011&mode=technical` | Sub 011 |
| `/?eq=eq-qc-demo-01&part=pp-q01-041&mode=technical` | Main hoist motor A on QC-DEMO-01 |
| `/?eq=eq-qc-demo-02&part=pp-q02-041&mode=technical` | Same model node on QC-DEMO-02: different position ID and history |
| `/?eq=eq-qc-demo-01&mode=technical&iso=1` | Machinery house isolated |
| `/?eq=eq-qc-demo-01&container=machinery-house` | Spatial group selection (not a mechanism) |
| `&view=side` / `end-ws` / `end-ls` / `top` | Aligned orthographic views |
| `&viewer=nowebgl` / `loadfail` / `contextlost` | Fallback simulations |
| `capture.html?view=side&cx=..&cy=..&w=..&h=..` | Bare render used for the drawing comparisons |

From the P02 prototype (`node artifacts/prototypes/p02-ui/serve.mjs`), the QC-DEMO-01/02 detail page has an **Open 3D model (P03)** link that opens this page with the same equipment, main/sub selection and part (passed as its semantic key; a P02 placeholder key that is not in the drawing-derived template is reported, never guessed).

## Files

- `js/viewer.mjs` - viewer core (`QcViewer`): loading with sha256 check, picking policy, modes, isolation, union-bounds focus with occlusion-aware direction, interruptible transitions, labels with decluttering, aligned orthographic views, disposal.
- `js/app.mjs` - page: URL selection state shared by tree, breadcrumb, scene and panel; synthetic history panel; fallbacks.
- `js/data.mjs` - synthetic equipment, exact-key bindings and synthetic jobs.
- `serve.mjs` - localhost static server.

Checks: `node tools/p03/check_model_prototype.mjs --gpu hardware|swiftshader`, `node tools/p03/check_no_webgl.mjs`; captures: `node tools/p03/capture.mjs`; comparisons: `python -I -X utf8 tools/p03/compose_comparisons.py`. Evidence: `docs/evidence/P03/P03_EVIDENCE.md`.

## U1 repair (22 October 2026)

- Labels drill down: whole equipment shows tier 1 (main mechanisms), a click shows tier 2 (submechanisms of that main), a click shows tier 3 (parts and location markers). The same `select()` as the tree is used, so tree, breadcrumb, URL and history follow. A label whose items are inside the structure is dashed with a "Technical" badge; clicking it switches to Technical. Labels do not take pointer events: a click without a drag is routed to the label under the pointer, and an orbit drag that starts on a label still orbits.
- Toolbar: Isolate machinery house is always enabled (from Overall it switches to Technical); Fit selection fits the whole crane or the isolated house when nothing is selected, and fits the selection in aligned views too; Reset view resets the current view (an aligned view stays aligned); aligned views keep right-drag pan and wheel zoom.
- Model draft v1 rev 2: back-reach area, CICT logo decal (Overall only), stair tower re-oriented, remodelled cab with seat and consoles, reeving paths, machinery-house layout. Evidence: `docs/evidence/U1/repair-20261022.md`.

## U1 round 2 (22 October 2026)

- Labels stay after any tree selection (U1-C09): the level below the selection is labelled; if it has nothing bound, the selection's own level is labelled with the selection highlighted, else the main mechanisms. A label whose item is outside the view is pinned to the viewport edge with a direction arrow (dotted border) and still drills down when clicked.
- Reset (U1-C10/C11) now returns to the whole equipment: no selection, container or isolation, labels on, tree folded to its initial state, full view of the current view type (Overall/Technical and the aligned-view choice are kept). Fold icons collapse and expand any mechanism, including the selected one.
- Model draft v1 rev 3: load cells as load pins in the main hoist rope-end anchors at the boom tip, girder-tail platforms and stairs, apex platform with guide sheaves and two boom hoist sheave blocks, floodlight fittings under the girder and boom, elevator outboard of landside leg B with landings, and every location ball replaced by a simple part (tree rows "Representative part"). Evidence: `docs/evidence/U1/repair-r2-20261022.md`.

## U1 round 3 (22 October 2026)

- Model draft v1 rev 4 (U1-C17, U1-C18): trolley rebuilt to J526A0200 / J526A2100 (4 wheels, four sheave shafts with two sheaves each, open frame and centre body, trolley-rope equalizer sheaves, spreader cable reel 014, rope paths over the sheaves); headblock to J526A1200; spreader remodelled as an STS45-type telescopic spreader (main frame, arms, end beams, ISO 40 ft twistlocks, flippers). Evidence: `docs/evidence/U1/repair-r3-20261022.md`.
- `tools/p03/cdp.mjs` also finds the Playwright Chromium on Linux (or `EQ_CHROME`) and adds `--no-sandbox` there; the Windows paths are unchanged.


## P02B (22 October 2026): four-tab right panel (U1-C19)

The right panel is now four current-state tabs - Maintenance (today's ZMMS daily jobs), Projects/Special, Technical, Spare parts - with no work history, the same tabs and data as the flat P02 view (`?panel=maintenance|special|technical|spareParts`). The data layer and the renderer are the P02 scripts (`../p02-ui/js`, served read-only under `/p02/js/` by `serve.mjs`); the page behaves as a read-only Management view, and Open in Jobs opens the P02 prototype (port 5312) in a new tab, so start both servers. The page's own synthetic jobs were removed. Checks: `node tools/p02b/check_p03_panel.mjs`; the P03 browser checks were adapted where they asserted history in the panel and wait for the next rendered frame instead of a fixed 200 ms.
