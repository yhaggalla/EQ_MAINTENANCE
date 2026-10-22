# CICT RTG modelling workbench

An isolated, editable ZP12-1874 RTG model, interactive browser demo and reusable EQ viewer adapter. **This task writes only inside `rtg-workbench`.** Unrelated QC/U1 and prompt-pack changes occurred during the run and were preserved; the baseline comparison records them. The two RTG source PDFs remain unchanged. Geometry is provisional where manuals are incomplete or inconsistent; assumptions are documented and shown in the technical sheet.

## Open the delivered result

- Main workbench: **http://127.0.0.1:5314/**
- Independent adapter host: **http://127.0.0.1:5314/examples/host.html**
- Start paused. Use the mechanism tree or model picking, Overall/Technical mode, view selector, fit, isolate/hide/show, enclosure transparency and motion sliders.
- Trolley, cabin and hoist travel together. The headblock/spreader rise together; the eight rope falls stay attached. Motion is a visual study. The source-qualified technical sheet is available for each main mechanism/assembly.
- CICT photo-referenced red/white/yellow paint, striped guards, capacity and ZPMC signs are embedded in the GLB. The supplied CICT company flag artwork is embedded unchanged. See `APPEARANCE.md` for sources and qualifications.

The server is loopback-only. If it is no longer running:

```powershell
Set-Location F:\CODEX\EQ_MAINTENANCE\rtg-workbench
npm ci --ignore-scripts --no-audit --no-fund
npm start
```

Node22.12+ is declared; this delivery was executed with Node24.15.0. Three.js is pinned to0.186.1. No CAD application, CDN, remote texture service or browser Windows-file access is required. Browser assets are local npm modules. A fresh machine needs npm access/cache for the pinned packages. Original PDFs are read-only and optionally served from the sibling `RTG drawings` folder; rendered source crops and audit evidence are included in this package.

## Rebuild and verify

Stop the demo server before regenerating the asset set, then:

```powershell
npm run build
npm run validate
npm run typecheck
npm start
```

In a second terminal, from this folder:

```powershell
npm run test:browser
node tools/host-check.mjs
node tools/capture-comparisons.mjs
node tools/capture-appearance.mjs
python -X utf8 tools/overlay-comparisons.py
```

Browser verification requires Playwright and installed Chrome/Edge. The test helper first looks for a local Playwright package, then the inspected Codex bundled runtime path. On another machine, install Playwright as a development tool or adapt `tools/browser-runtime.mjs`. PDF re-auditing requires Python/PyMuPDF and the original PDFs; analytical overlay composition requires Pillow. These are authoring/verification tools, not runtime viewer requirements.

`source/parameters.mjs` is the editable dimension/assumption table; `build-model.mjs` and `geometry.mjs` are the deterministic construction source. Every construction recipe is exported in millimetres, with primitive vertex ranges in GLB extras for independent exported-geometry checks. Scene positions are explicitly converted to metres. Change both the source audit and validation expectations when a source interpretation changes. The approved catalogue snapshot is read-only reference input for this package.

## Package contents

| Path | Purpose |
|---|---|
| `model/1/scene.glb` | Versioned binary model; 121 semantic nodes |
| `model/1/manifest.json` | Draft v1 manifest, bounds, provenance and motion envelope |
| `model/1/checksums.json` | SHA-256/size for seven generated outputs |
| `model/1/parameters.json`, `geometry-parameters.json`, `technical-specifications.json` | Dimension table, construction provenance and host-readable technical values |
| `model/1/bindings.synthetic.json` | Two synthetic RTGs, explicit independent position identities and history |
| `viewer/` | Importable Three.js adapter, TypeScript declarations and minimal host CSS |
| `examples/` | Independent working host and type-checked future React bridge |
| `SOURCE_AUDIT.md`, `COVERAGE.md`, `COMPARISON_REVIEW.md` | Source authority, conflicts, assumptions, completeness and visual comparison findings |
| `APPEARANCE.md`, `source/appearance.mjs`, `source/artwork/` | Photo-referenced paint/signs, flag source, editable placement and included artwork/font licensing |
| `INTEGRATION.md` | Usage contract and exact future EQ scope/binding/validator/fallback work |
| `evidence/validation/`, `evidence/browser/`, `evidence/comparisons/` | Executed results, measurements, screenshots and calibrated overlays |
| `HANDOVER.md` | Concise acceptance boundary and measured results |

The package is importable by its local folder or npm local dependency (`@cict/rtg-workbench`); it is private and has not been published. Read `INTEGRATION.md` before registering it with any actual EQ equipment. The current approved stage1 application still excludes RTG3D.
