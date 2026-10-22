# RTG standalone modelling run — 22 October 2026

All new source, evidence and generated assets stay under `rtg-workbench/`. Existing source, QC work, phase/checkpoint records, drawings, Portal and live systems remain untouched.

1. Inventory both manuals with hashes/page counts; visually read project configuration, dimensioned general/trolley arrangements and relevant mechanisms. Keep contradictions and unavailable geometry explicit.
2. Build a parameter-driven, metre-exported GLB using the installed Three.js 0.186.1. Use a neutral inspection material until RTG appearance is established. Publish parameter provenance and coverage beside the model.
3. Implement a reusable demand-rendered viewer with controlled equipment selection/bindings and a local HTTP demo. Preserve the existing identity grammar; catalogue applicability is source-qualified and synthetic only.
4. Exercise export, binding isolation, actual browser loading, controls, motion, fallback and cleanup. Produce orthographic evidence and source comparisons; report deviations and unverified source gaps without an exactness claim.

## Compatibility findings

- The actual dependency is Three.js 0.186.1 in `tools/model-generator/package-lock.json`. The React/TypeScript host is planned; P04 has not started.
- The current `QcViewer` API is an imperative Three.js class (`load`, `setSelection`, `setMode`, `setIsolate`, `fitKeys`, `resetView`, `dispose`). A new RTG module can implement the same pattern and expose TypeScript declarations for the future host.
- Stage 1 explicitly excludes full RTG 3D (`APPROVED_REQUIREMENTS` sections 2 and 7); `DATA_CONTRACT` 10.5 B1 and 10.9 prevent RTG binding/display. This run does not change them or register/activate a model.
- Existing `tools/model-generator/validate.mjs` is QC-specific despite its general title: rejects 043/044/045/09x, dereferences QC rail keys, requires 30 m gauge and 83.356 m height. A separate RTG validation report must state these incompatibilities, not change QC validation or imply registration acceptance.
- Manifest example provenance `approximate` conflicts with its enumerated values. Use the enumerated `measured`, `drawing-derived`, `estimated`, `approximate-location`. Unavailable dimensions remain null in the source register, never disguised as measured.
