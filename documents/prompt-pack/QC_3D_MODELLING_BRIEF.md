# QC model and interaction brief

Version 1.1 | 22 October 2026 | Stage 1 model authoring and verification; V2: the right panel shows current state, and work history opens in the EQ Jobs tab

## 1 Intended result

Create a useful, recognizably CICT STS crane model for maintenance navigation. Match the overall arrangement and major assemblies in the supplied drawings. Represent maintainable internal parts with simple shapes where detailed dimensions are not established. Make every selectable maintenance position resolve to the same equipment-specific record as its tree entry.

The model is a visual maintenance reference. It is not a structural calculation model, an as-measured survey, a live equipment simulation or a control interface. Do not add live movement or telemetry labels to manually updated maintenance data.

This is QC-only 3D authoring for stage 1. RTG and ES retain complete normal register/work/history interfaces without full models.

## 2 Source hierarchy and model family

Start with `F:\CODEX\EQ_MAINTENANCE\As-bulit drawing\J526A00（structure parameters）.pdf`, PDF page 1, drawing J526A00. This sheet gives side/end/top views, a machinery-house arrangement, reeving diagrams and major particulars. Page 2 contains the subsidiary list. The raster general arrangement is also available as `QC PNG.png` / `QC JPEG.jpg`; `J526A00_002.png` contains the subsidiary list.

Next inspect only the relevant sheets in the following documents at readable resolution. Use the drawing number printed on the sheet, not an assumed match between its PDF page number and the register entry number.

| Source | Purpose |
| --- | --- |
| J526A0100.pdf | Frame, legs, fixed girders, boom, stays and rail arrangement; bundled 64-page document |
| J526A0200.pdf | Trolley frame, wheels, sheaves, cabin relationship |
| J526A0300.pdf | Main hoist drive arrangement and major motors/drums/brakes |
| J526A0400.pdf | Trolley drive arrangement |
| J526A0500.pdf | Boom hoist drive |
| J526A0600.pdf | Gantry bogies, wheels and drive layout |
| J526A1000.pdf | Anti-snag and trim/list/skew device reference |
| J526A1200.pdf | Headblock |
| J526A1300.pdf | Cargo beam; a separate attachment, not automatically the 064 over-high hanger |
| J526A1400.pdf | Emergency drive |
| J526A2000.pdf; J526A2100.pdf; J526A2200.pdf; J526A2300.pdf | Hoist, trolley, catenary trolley and boom reeving |
| J526A3000.pdf | Machinery-house enclosure and arrangement |
| J526A3100.pdf; J526A3200.pdf; J526A3300.pdf | Operating cabins |
| J526A4000.pdf | Gantry high-voltage cable reel |
| J526A5000.pdf | Major walkways, platforms and stairs; omit exhaustive grating fabrication |
| J526A5100.pdf | Elevator |
| J526A6000.pdf; J526A6100.pdf; J526A6200.pdf; J526A6300.pdf | Anchors, tie-down, boom stowage and anti-collision locations |
| Sheave.pdf; ZT2-015022 - Trolley wheel.pdf | Recognizable replacement component shapes |

The indexed folder is not a native CAD/3D asset library. Create geometry explicitly and keep the generator or editable authoring source. A screenshot on a plane is not a substitute for a selectable three-dimensional crane.

The cover describes the original 12 STS crane project. Name the initial template descriptively, for example `CICT-J526A-STS`, with a model version. Do not claim it represents QC13/QC14 or assign it to all current QCs without an Admin-confirmed model association.

The supplied photos at `documents\images.jpg` and `documents\images2.jpg` control the general CICT paint appearance: red structural members and a light machinery-house enclosure. The blue/white crane illustration embedded in the SOW illustrates the interaction concept; its paint is not the CICT paint authority.

Internet reference models are visual references only. Do not purchase, download or embed a third-party crane as though it were this verified model. Keep the supplied CICT identity marks exact when an approved usable source asset is available; otherwise omit an illegible logo rather than invent a flag or emblem.

## 3 Geometry and fidelity contract

Use metres in the scene and explicitly convert millimetre drawing dimensions. Define and document one coordinate system, such as Y up, X along the boom toward waterside, and Z across the crane. Mark waterside/landside in the model documentation and screenshots. Derive the base origin consistently from the rail plane and crane centreline.

Visually verified baseline values are rail gauge 30 m, outreach 70 m and backreach 20 m. Lift above rail is 45 m and total lift is 63 m; total lift is not the crane's overall height. Derive mast/portal/boom elevations from readable dimensioned views rather than setting overall height to 63 m.

Measured/source dimensions are exact input parameters at the stated source precision. Model landmarks derived from them should be within 1% of those inputs. For proportions not dimensioned in the reviewed sheet, record an explicit visual estimate and allow a provisional 5% silhouette tolerance against aligned reference views. These are proposed model-QA targets, not a claim about drawing or equipment tolerances.

Build the following minimum content:

| Visual assembly | Minimum stage 1 geometry | Maintenance association |
| --- | --- | --- |
| Portal frame | Distinct waterside/landside legs, sill/cross beams and main braces | Structural main parts under 15/151 by default |
| Mast/A-frame | Characteristic height, main members and stay anchors | Structural main parts under 15/151 |
| Fixed rear girder | Main length, cross framing and end features | Structural main parts under 15/151 |
| Boom | Correct reach, hinge, main girder/truss members and main stays | 03/031 and relevant 033 rope positions |
| Main hoist | Major drive units, paired drums, motors, reducers and braking locations | 01/011, 012, 013 and 015 as applicable |
| Trolley | Separate frame, wheels and recognizable suspended cabin relationship | 02/021, with 022/023/024 as applicable |
| Reeving | Simplified visible rope paths and principal sheaves | Separate hoist, trolley and boom rope positions |
| Gantry | Correct rail relationship and recognizable multi-wheel bogies/drive groups | 04/041; reel under 042 |
| Headblock/spreader | Distinct headblock, spreader frame and principal twistlock/flipper locations | 06/062 and 06/061 |
| Machinery house | Enclosure, light paint, access points; technical view reveals simplified equipment | Enclosing visual group containing multiple maintenance identities |
| Cabin and access | Operator cabin and characteristic major stairs/platforms/elevator location | 14/141 and relevant 15/151/153 |
| Electrical/auxiliary | Recognizable cabinets/reel/transformer or location hotspots where supported | 05, 07, 08, 12, 13, 15 and 16 by actual applicability |

Do not give this QC tyres, steering cylinders or a diesel generator just because those entries occur in the common mechanism table. Applicability must be checked for this model. Do not render unavailable vendor internals as exact product geometry.

Omit individual bolts, weld beads, exact gear teeth, detailed cable cores, every grating aperture and complete switch wiring. A wheel or sheave can use a simple profile with a readable shaft/hub. Repeat geometry using shared resources where it does not destroy picking identity.

## 4 Scene and maintenance identities

Keep a model definition, node manifest and versioned equipment-binding layer. A model template uses stable semantic position keys such as:

```text
structure.portal.waterside.leg.a
structure.portal.landside.leg.a
boom.main.girder
hoist.drive.motor.a
hoist.drive.motor.b
hoist.drive.drum.a
trolley.frame
trolley.wheel.position.a
gantry.bogie.waterside.a
spreader.frame
headblock.frame
electrical.plc.main
```

These keys illustrate the naming scheme; actual positions must follow the verified arrangement. Do not infer physical counts from the example keys.

The manifest records each semantic key, scene node/group names, geometry provenance, classification code where applicable, parent visual group, picking behaviour, bounds/camera hint and whether it is a physical assembly, simplified representation or location hotspot.

The equipment binding resolves `(equipmentId, modelVersion, semanticPositionKey)` to a stable component-instance ID. A mesh name, runtime UUID, array offset or instancing index is not a database primary key. Instanced picking must resolve `instanceId` through an explicit versioned lookup, not persist it as the maintenance identity.

The mapping must support one maintenance position represented by several meshes and a group containing positions from several mechanisms. Selecting a main mechanism computes the union of its bound positions for highlight/focus. A spatial container does not automatically own every maintenance record inside it.

Replacing a model version must report orphaned and changed mappings. Retain the existing installed-position IDs and history. Admin must explicitly repair bindings before a new model version becomes active; do not migrate history by fuzzy display-name matching.

Do not seed an electrical hotspot into an arbitrary exact location if the supplied drawing does not establish it. It can be attached to the documented machinery-house area and labelled Location approximate / simplified representation.

## 5 Interaction contract

- Overall mode: normal CICT appearance, major named assemblies and a clear selected equipment status badge outside the geometry.
- Technical mode: optional enclosure transparency/isolation and simplified internals, useful labels and source-linked parameters. Keep unverified details visibly qualified.
- Main mechanism selection: highlight its bound geometry, fit the camera to its union bounds, synchronize the tree and show its current state in the right panel (open special jobs, spare-part condition, parameters); Open in Jobs shows its direct/descendant history in the EQ Jobs tab.
- Submechanism selection: focus its representation or clearly labelled location hotspot, synchronize the breadcrumb and load its narrower current state.
- Main part selection: show exact installed position, current installation and spare-part condition; Open in Jobs shows the exact-position timeline.
- Pointer selection and tree selection use one state model. Back/forward/deep links reproduce the same equipment and component selection.
- Camera movement must not fight orbit controls. Cancel an in-progress focus transition when a newer selection or user drag begins. Respect reduced-motion preferences.
- Empty/background click must not clear an unsaved job form without a normal unsaved-changes decision. A ray through an enclosing transparent mesh should follow a documented picking policy.
- Reset returns to a useful full-crane view. Fit selection handles thin ropes, empty bounds and hidden groups without clipping or jumping to infinity.
- Prevent label overlap through priority/decluttering; hover-only labels are insufficient. Selection and labels must also be accessible through the tree.

Normal red paint must not imply Breakdown. Use a separate status legend and overlays such as an outline, icon and adjacent text. Show open-work counts and the selected history period without inventing component health ratings. Completed replacement markers, if used, must make their date/filter explicit.

## 6 Performance and deployment targets

The following are initial engineering budgets to measure and tune on a recorded office PC/browser. They are not established performance measurements:

- No WebGL canvases on the fleet dashboard; one active canvas in an equipment detail view.
- Target no more than 150,000 visible triangles and 200 draw calls for the normal QC scene; justify and record a changed budget if needed for recognizable geometry.
- Target a compact overview asset of at most 8 MiB if using GLB. Lazy-load detailed internals; procedural geometry must also report equivalent asset/code and runtime costs.
- Target at least 30 FPS during a ten-second orbit on the agreed reference desktop. Record device/GPU, browser, resolution and actual results.
- Target a usable model within five seconds on the recorded office/LAN test setup. Keep a responsive skeleton and tree available while geometry loads.
- Render on demand while idle; request frames during camera transitions, control changes and overlays. Avoid per-frame React state updates and decorative perpetual motion.
- Reuse geometries/materials and selectively instance repetitive parts, preserving selection mappings. Avoid huge transparent scenes and unnecessary shadow maps.
- Dispose unshared GPU resources and event listeners on navigation. After repeated equipment navigation, demonstrate that active renderers/listeners and resource counts do not grow without bound. Do not dispose shared cached resources still in use.
- Handle unsupported WebGL, context loss, failed model loads and missing bindings with a usable component tree and work panel.
- Serve assets and any compression decoders from the app's approved same-origin paths. Do not depend on external CDNs, third-party texture URLs or browser access to local Windows paths.

If using GLB, the preferred product asset has no uncontrolled external resource references. Keep source and deployed asset checksums, authoring units and bounds in a manifest. Verify caching/version invalidation and authenticated model-file requests under the `/eq-maintenance` path.

## 7 Required model deliverables

1. Editable geometry source or deterministic generator, with reproducible build/export instructions and selected tool versions.
2. Overview asset/runtime scene plus any separate technical assembly assets.
3. Dimension/provenance table distinguishing measured, drawing-derived and approximate geometry.
4. Stable node manifest and equipment-binding validation report.
5. Side, end, top and perspective screenshots aligned with drawing reference views, plus machinery-house technical view.
6. An interaction walkthrough proving main -> sub -> part focus, exact equipment-specific history and reset behaviour.
7. Performance report with actual counters and fallback evidence.

The model/design review passes only when the crane silhouette, rail layout, boom proportions, cabin and machinery-house relationship are recognizably matched to the source. A generic port crane with the right paint does not satisfy this brief. Unknown manufacturer detail does not justify fabricating exact internals.

Implementation references: [Three.js Object3D](https://threejs.org/docs/pages/Object3D.html), [Raycaster](https://threejs.org/docs/pages/Raycaster.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), and [React Three Fiber scaling guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance). Verify current APIs against the pinned dependency versions before coding.
