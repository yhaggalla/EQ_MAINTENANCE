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
- Hotspots mark a submechanism whose exact geometry or location is not established; they are technical-mode only and labelled approximate.

## Changing the model

1. Change or add a parameter in `params.json` with its source and kind; never type an unexplained number into `build.mjs` without declaring it in the node provenance.
2. Change `build.mjs`; keep keys stable.
3. Run generate, validate and check_bindings; review `provenance.md` and the aligned comparison images (`node tools/p03/capture.mjs` then `python -I -X utf8 tools/p03/compose_comparisons.py`, with the prototype server running).
4. A changed GLB is a new model version once any equipment binding is active (immutable versions, DATA_CONTRACT s10.1).
