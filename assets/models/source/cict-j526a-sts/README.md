# CICT-J526A-STS scene source (model version 1)

Editable source of the QC model for the ZPMC J526A drawing family ("Sri Lanka CICT 12 STS Cranes"). Prepared in P03. The template is **not assigned to any equipment**: an EQ Maintenance Admin associates a verified model with each real QC (DATA_CONTRACT s10.5).

| File | Purpose |
| --- | --- |
| `params.json` | Every dimension used by the model, in millimetres, each with its kind (measured / drawing-derived / estimated / approximate-location), source sheet and note |
| `build.mjs` | Scene definition: assemblies, semantic node keys, classification, containers, hotspots, instanced positions and provenance. Edit this to change geometry |
| `../../../../tools/model-generator/` | Generic pipeline (kit, scene builder, exporter, validator); three.js pinned at 0.186.1 with a lockfile |

## Coordinate system

Metres, Y up. +X along the boom toward the water; Z along the rails. Origin on the top of the **waterside** rail at the crane's transverse centreline, so the landside rail is at X = -30. Side `a` = +Z (right-hand side when standing landside and looking at the water), side `b` = -Z. `ws` = waterside, `ls` = landside.

## Build, validate and inspect

Requires Node.js 22.12 or later (P03 used 24.15.0) and the generator dependencies (`npm ci` in `tools/model-generator`, which installs three 0.186.1 from the lockfile).

```powershell
cd F:\CODEX\EQ_MAINTENANCE\tools\model-generator
npm ci                                   # once; installs three 0.186.1 exactly
cd F:\CODEX\EQ_MAINTENANCE
node tools/model-generator/generate.mjs  # -> artifacts/models/cict-j526a-sts-scene/1/
node tools/model-generator/validate.mjs  # registration checks (DATA_CONTRACT s10.4); exit 1 on failure
node tools/p03/check_bindings.mjs        # binding rules B1-B8 with synthetic equipment, reorder and version-2 simulation
```

Outputs in `artifacts/models/cict-j526a-sts-scene/1/`: `scene.glb` (binary glTF 2.0, no external URIs, `EXT_mesh_gpu_instancing` for the 32 gantry wheels and 16 gantry drives), `manifest.json` (nodes, classification, provenance, bounds, instanceMaps, counters, budgets), `provenance.md` (dimension/provenance table and landmark check), `landmarks.json`, `checksums.json` (source and output sha256).

## Determinism

The GLB and the manifest are byte-identical for the same inputs, generator files, three version and Git commit (checked in P03 by generating twice into separate folders). The manifest records `generator.sourceCommit` and `sourceDirty`, so a regeneration after a commit changes only those manifest fields; `scene.glb` does not depend on Git state. Nothing reads the clock or random numbers. A different three.js exporter version may change GLB bytes without changing geometry; pin and record it.

## Identity rules (do not break)

- One maintenance position = one glTF node named by its semantic key, with `extras.nodeKey` equal to the key. Instanced positions are resolved only through `instanceMaps` (carrier node name + ordered key list).
- A key that has been bound to an active position must keep its meaning in later versions. Renaming or splitting a node requires an explicit Admin mapping; history is never moved by label, order or index (`tools/p03/check_bindings.mjs` demonstrates the refusal).
- Containers (`container.*`) are spatial groups only and carry no classification. Decorative context (rails, quay) carries none either.
- Hotspots mark a submechanism whose exact geometry or location is not established and bind to the sub instance, never to a position; they are labelled approximate. Since revision 3 each is drawn as a simple part that looks like the component (`manifest.nodes[].hotspot.representation = 'simplified-part'`); internal ones stay technical-mode only, external ones (floodlights, spreader corners, wheel brakes, cab A/C, tail hydraulic units) show in both modes.

## Changing the model

1. Change or add a parameter in `params.json` with its source and kind; never type an unexplained number into `build.mjs` without declaring it in the node provenance.
2. Change `build.mjs`; keep keys stable.
3. Run generate, validate and check_bindings; review `provenance.md` and the aligned comparison images (`node tools/p03/capture.mjs` then `python -I -X utf8 tools/p03/compose_comparisons.py`, with the prototype server running).
4. A changed GLB is a new model version once any equipment binding is active (immutable versions, DATA_CONTRACT s10.1).

## Revision 2 of draft v1 (U1 repair, 22 October 2026)

The draft was revised in place (manifest `revision: 2`) because no equipment binding is active (rule 4 above applies once a binding is active). No key was removed or renamed and no kind, classification or instancing changed; 12 nodes were added and two hotspots (111 skew system, 022 trolley tension) moved to the new `container.back-reach` at the girder tail. Report: `docs/evidence/U1/repair/model-revision-diff.json` (`node tools/u1/model_diff.mjs`). Count parameters (`unit: "count"`) are read with `N()` in `build.mjs`. The CICT logo texture is embedded by `generate.mjs` (see `textures/README.md`); decals are listed in `manifest.decals`, are not maintenance identities, and pick as their container.

## Revision 3 of draft v1 (U1 round 2, 22 October 2026)

Revised in place again (manifest `revision: 3`; no equipment binding is active). No key added, removed or renamed; kinds, classification and instancing unchanged (`node tools/u1/model_diff.mjs --out docs/evidence/U1/repair-r2/model-revision-diff.json`: 0 added, 0 removed, 0 identity changes). Geometry corrections from J526A0200, J526A2000 (Detail I), J526A2300, J526A5000 and J526A5100: load cells at the boom-tip rope-end anchors (U1-C12), girder-tail upper and lower platforms with stairs (U1-C13), apex platform, guide sheaves, fall-sheave groups and two boom sheave blocks (U1-C14), floodlight fittings under the girder and boom (U1-C15), elevator outboard of landside leg B with landings and every location ball replaced by a simplified part (U1-C16). `SceneBuilder.hotspot(key, o, build)` takes an optional builder for that part. New parameters are marked "U1 round 2" in `params.json`; the stair-tower flight count per segment was recounted (1 / 4 / 10 / 2). Draw calls (all modes) 194 of the 200 budget.
