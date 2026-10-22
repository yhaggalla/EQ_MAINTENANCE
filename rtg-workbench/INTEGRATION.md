# Reusable viewer and future EQ integration

The importable module is `viewer/adapter.mjs`, with declarations in `viewer/adapter.d.mts` and CSS in `viewer/viewer.css`. It uses Three.js **0.186.1**, matching the inspected existing generator. The existing app stack was not modified. The Node authoring tools run separately; they are not browser dependencies.

`examples/host.html` / `host.mjs` is an independent host using the module directly. It supplies the loader, explicit equipment bindings, controlled selection and records. Run at `http://127.0.0.1:5314/examples/host.html`. `examples/RtgPanel.tsx` provides the corresponding React lifecycle bridge, with strict TypeScript checking using 5.9.3 / React 19 types. The React bridge has **not** been rendered in the actual EQ app. No iframe or second sign-in system is used.

```js
import { mountRtgViewer } from '@cict/rtg-workbench';
import '@cict/rtg-workbench/viewer.css';

const viewer = await mountRtgViewer(element, {
  modelUrl, manifestUrl, modelVersion, equipmentId, bindings,
  selection: hostSelection, mode: 'overall',
  loader: async (url, { signal, kind }) => {
    const response = await fetch(url, { signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Model request: ${response.status}`);
    return kind === 'manifest' ? response.json() : response.arrayBuffer();
  },
  onSelectionChange: next => updateHostSelection(next),
  onFallback: reason => showHostFallback(reason)
});
// On host state changes, send the authoritative state back to the adapter.
viewer.setState({ selection: hostSelection, mode, overlays });
// On unmount:
viewer.dispose();
```

The package accepts one immutable manifest/model version per load. `setEquipment` switches bindings while reusing geometry, resetting motion and clearing visibility changes. Model URL/version changes require a load or new mount. Explicit `setState` controls selection, mode and overlays; camera, fit, visibility, motion and disposal are separate methods. A selection event is a request to the host, not an independent viewer-owned selection/history store. Hover/paint is not equipment status. Grey normal paint, blue selection and amber synthetic work remain distinct.

Every position pick resolves the tuple `(equipmentId, modelVersion, nodeKey)` through a supplied binding to `positionId`; a hotspot resolves to `subInstanceId`. Container picks carry no maintenance identity. No runtime UUID, array index or mesh name becomes a record ID. The two synthetic fixtures use separate IDs and separate histories for the same geometry. They must never enter real reference registrations or production migrations.

The authenticated loader boundary is exercised with a local host loader and simulated HTTP 401/403 failures. There is no real authentication server in this package. Future requests must use the host's protected model endpoints and permissions; no credentials belong in this module or in model metadata.

## Exact prerequisites before enabling real RTG models

1. **Scope decision:** `documents/prompt-pack/APPROVED_REQUIREMENTS.md:84-86` explicitly keeps RTG/ES 3D unavailable in stage 1. Record a future scope approval through the existing project process. This package does not advance P04 or satisfy/close U1.
2. **Eligibility/binding:** `docs/DATA_CONTRACT.md:582` (B1) currently prohibits RTG/ES binding. Revise the rule only in the approved future phase, retain verified EquipmentModel association, approved applicability, explicit position/sub-instance bindings, version validation and atomic activation. Do not infer present fleet membership from ZP12-1874 manuals.
3. **Fallback policy:** `docs/DATA_CONTRACT.md:616` and `docs/ARCHITECTURE.md:178` unconditionally fall back for RTG/ES in stage 1. Future RTG eligibility must be conditional on the approved model association and active validated binding. Missing model/binding, 401/403/404, checksum/schema failure and WebGL/context loss must still preserve tree, technical sheet, history and permitted work.
4. **Validator separation:** `tools/model-generator/validate.mjs:71-72` rejects 043/044/045/091-094 specifically for QC. Lines119-123 dereference QC rail keys and expect 30 m gauge / 83.356 m height. Separate family-neutral schema/integrity checks from QC and RTG geometry profiles. Running that QC validator unchanged is not RTG validation. This package's validator checks RTG geometry and the existing approved catalogue without changing the QC tool.
5. **Contract discrepancy:** `docs/DATA_CONTRACT.md` has an example provenance value `approximate`; its supported list/current implementation use `approximate-location`. This package uses the supported enumeration and records unavailable values only in source audit data. No instancing is used, so `instanceMaps` is empty.
6. **Host route/state:** Wire into the planned `/eq-maintenance/equipment/{equipmentId}?main=&sub=&part=&mode=&panel=` page using host state, history, permissions and job actions. Translate the module's camelCase selection shape to the host DTOs; keep camera/visibility transient. Add a model-family-specific technical sheet rather than QC outreach/rail-gauge fields masquerading as RTG data.
7. **Registration and release:** After source/visual acceptance, register a real model version and checksum with the protected asset service, configure applicable mechanism templates, validate each equipment binding, and activate explicitly. This manifest remains `draft` and `standaloneOnly:true`; the synthetic model code is intentionally provisional. Replace proof fixtures with actual equipment data through host workflows.
8. **Host verification:** Test real React lifecycle, router back/forward, authorized and denied asset access, mobile input, context restoration, cache invalidation/version changes, role-based work actions, production asset paths and disposal in the real host. Standalone tests are not evidence of this integration or deployment.

Technical references inspected: [glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [R3F demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance). This viewer uses imperative Three.js with demand rendering; it does not require a second R3F canvas within the host's existing viewer.

Final compatibility refresh: unrelated work advanced the checkout to prompt pack2.0 (commit804fcb5) while this package was being built. The ledger now records round3 U1 repairs and the P01B/P02B/R02B V2 path. The RTG exclusion remains at APPROVED_REQUIREMENTS lines84-86; DATA_CONTRACT B1/fallback and the QC-specific validator checks remain applicable. No existing phase/decision/authority file was edited by this task.
