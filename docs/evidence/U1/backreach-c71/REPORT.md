# U1-C71: QC back-reach TLS correction

Requested and implemented 5 November 2026; final handover 6 November 2026. Local prototype repair, model draft v1 revision 9. U1 remains IN PROGRESS / NOT APPROVED; P04/P05 not started. No deployment or independent R-checkpoint verdict.

## Drawing review

Read-only sources under `Drawings and manuals/As-bulit drawing/`:

- **J526A1000.pdf, sheet 1:** anti-snag / trim-list-skew mechanism, normal-operation side view, end view, plan, B-B and C-C. **Sheet 2:** four pry bars, four hydraulic cylinders, four hoist sheaves and two main supports.
- **J526A7100.pdf, sheet 1:** tail arrangement, Detail C and View A'/C'; used to check the relationship to the service crane and girder end.
- **J526A5000.pdf, sheet 1:** tail platform and hanging festoon/cab-service platform context.
- **J526A2100.pdf, sheet 3 (J526A2103)** and **J526A2200.pdf, sheet 3 (J526A2203):** checked to distinguish the trolley/catenary tensioners from the TLS mechanism. Their existing geometry is retained in this repair.

The previous TLS model interpreted the **2200** dimension as spacing between sheaves along X and drew long diagonal cylinders. The drawing shows lever travel in that view, with **two transverse pairs** of independent cylinders/sheaves: pair centres **+/-2450 mm**, paired axes **605 mm** apart. C70 had also added selectable cylinder/sheave proxies alongside the older assembly geometry.

The corrected mechanism uses the normal-operation relationships: upper pivot **3055 mm** above the local mounting datum, cylinder trunnion **800 mm**, horizontal pivot-to-trunnion **1945 mm**, upper pivot-to-rod eye **2565 mm**, upper pivot-to-sheave axle **3504 mm**, normal cylinder pin span **2212 mm**, rod diameter **140 mm**, stroke **1400 mm** and sheave outer diameter **1000 mm**. Four cylinders now attach to the four independent levers, with distinct barrels, rods, trunnions, end caps and eyes. The model shows one normal pose, not the alternate dashed travel positions from the drawing.

## Changes and scope

- `assets/models/source/cict-j526a-sts/backreach.mjs`: shared TLS layout and geometry; dimensions read from `params.json`.
- `build.mjs`: replaces the old TLS frame/cylinders and duplicate proxy sheaves, attaches sensors to their cylinders, places the motor/coupling on the existing power pack, and reconnects the four hoist ropes locally.
- The rope splice is at **X = -54 m**, seven metres inboard of the girder tail. Machinery-house exits, trolley, headblock, boom and all rope vertices beyond this boundary are preserved.
- `generate.mjs` adds the new source module to the checksum inventory. Revision 9 GLB/manifest/provenance/checksums regenerated.
- `tools/u1/check_backreach_c71.mjs` and `capture_backreach_c71.mjs`: focused scope/dimension and real browser selection checks.

**410 semantic keys remain, with no additions/removals or changes to kinds, parents, classifications, position kinds or units.** Existing equipment-specific positions/history keep their keys. The render carriers for the eight TLS cylinder/sheave parts and two power-pack parts change; removing their old proxies also shifts the remaining back-reach carrier indices (29 render mappings in total). `model-revision-diff.json` counts these under its broad `identityChanges` field; these are render-mapping changes, not renamed maintenance identities. The browser verifies direct mouse picking and separate QC01/QC02 position IDs.

C70 generated reference files and the workbook are untouched. C71 geometry overrides the affected proxies by their stable keys at build time, so a future reference import does not reinstate the old TLS geometry. The build must retain this override after the import.

## Qualifications

The exact installed mounting datum is not established by the inspected sheets. The **900 mm rise above the existing model deck** and **1300 mm inboard cylinder anchor** are explicitly estimated for the tail placement and rope clearance. The **450 mm fork offset**, cylinder outer shell/end envelope, support plates, hoses and sensor attachments are simplified/scaled. The **200 mm cylinder bore** is not treated as an external diameter. The hydraulic power-pack location remains approximate. These are visible provenance qualifications, not installation measurements or production acceptance.

The service crane, platforms, trolley/catenary tensioners and all other QC assemblies retain their previous geometry. Existing unrelated RTG/workbook edits and all protected source documents are untouched.

## Verification

| Check | Result |
| --- | --- |
| Model registration / dimensions / budgets | 26/26 PASS |
| Binding invariants | 11/11 PASS |
| C71 dimension, identity and geometry scope checks | 6/6 PASS |
| C71 real browser checks | 8/8 PASS |
| C70 workbook/tree/part/phone regression | 12/12 PASS |
| C66 labels, selection and mode regression | 14/14 PASS |
| Unrelated geometry | 139 meshes and their instance transforms byte-identical |
| Unrelated manifest records | 367 exactly unchanged |
| Hoist ropes outside back reach | All 5680 vertices preserved within 0.03 mm comparison tolerance |
| Repeat generation | Byte-identical GLB; see determinism.json |
| Model budget | 227/230 draw calls; 90,394 triangles; approximately 3.64 MiB |

Binding results are archived here in inding-validation.json; the historical P03 report is preserved.

Browser checks include checksum validation, no missing nodes, actual mouse clicks on each of the four cylinders, QC01/QC02 identity separation, Overall visibility and no browser errors. An initial multi-material instanced carrier was rejected by the existing picker; the final carrier uses one material and passes these checks without a viewer-code change.

Visual review: area UI, selected cylinder, contextual 3D, side/end/plan, and isolated TLS side detail. See `01-area-ui.png` through `07-tls-side-detail.png`, plus `before.png`. Source render excerpts are in `sources/`. Debug/intermediate captures are excluded.

Commands (server: `node artifacts/prototypes/p02-ui/serve.mjs 5312`):

```powershell
node tools/model-generator/generate.mjs
node tools/model-generator/validate.mjs --out docs/evidence/U1/backreach-c71/validation.json
node tools/p03/check_bindings.mjs
node tools/u1/check_backreach_c71.mjs tmp/backreach-c71-before
node tools/u1/capture_backreach_c71.mjs
node tools/p02b/check_u1_c70.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/backreach-c71/c70-regression
node tools/p02b/check_u1_c66.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/backreach-c71/c66-regression
```

The scope check requires a pre-edit `manifest.json` and `scene.glb`; the baseline revision is recorded in the run note. Reconstruct it from Git commit `8c792d16346d50616d3e804b9160f4ba49415885` if the ignored scratch copy is unavailable.

Next: user review of this bounded correction; U1 remains open. No phase advancement implied.
