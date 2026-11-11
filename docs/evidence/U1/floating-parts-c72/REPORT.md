# U1-C72: QC floating-part correction

6 November 2026. Local prototype repair, draft model v1 revision 10. U1 remains NOT APPROVED; no phase advancement or deployment.

## Finding

The C70 workbook import created separate display proxies for components already drawn inside assemblies. Several proxies used an assembly's overall bounds instead of the component's physical datum. In particular, the spreader cable reel bounds included its descending cable, so derived accessories appeared below the reel. Optional over-height/hook attachments were drawn beside the spreader without evidence that they were fitted or stored there. Several small switches, masts and gantry fittings had no connection to their supporting structure.

## Drawing review

Protected drawings were read only. Page-one renders are retained in `sources/`:

- **J526A0200:** eight trolley hoist sheaves on four shafts; dia 1000, 165 spacing within each pair, shafts 900 either side of the trolley centre. Existing drawing-derived shaft locations retained.
- **J526A1200:** four headblock sheaves, two per box; dia 1000, 1010 pitch, centres 970 above the base. Existing boxes and shafts retained.
- **J526A0600:** gantry bogie/buffer arrangement; buffer centre 1310 above rail and the 27000 buffer-to-buffer envelope.
- **J526A6300:** two boom anti-collision trip wires, supports 69600 apart; A-A/B-B show triangular brackets, wire 1800 outboard of the girder face and 400 below its underside. Rear support top 730 and front support top 135 above the girder. The wire is dia 5 in the source; the model uses dia 20 for visibility.

Other fitting placements use the established model datums and existing source references. Their exact mounting dimensions remain approximate; no claim of newly verified fabrication detail is made.

## Implemented repair

- `fitted-components.mjs` applies explicit overrides after the reference list is loaded. Eight trolley and four headblock sheave keys now own the actual drawing-derived sheave geometry. The old assembly rims and extra proxy discs are removed; shafts, housings and identity records remain.
- Four individual gantry buffers replace the old buffer solids and their disconnected proxies. Mounting plates connect them to the outer bogies.
- The spreader-cable key owns the existing wound and descending cable geometry. Bearings and the cable damper use the actual reel centre instead of the assembly bounds.
- Trip-wire triangles connect the wires to the boom. Small boom sensors, obstruction lights and jib masts are seated on structure. Trolley rope clamps align with their ropes. Gantry obstacle sensors meet the bogie side plates, and the guide roller has a shelf and an upper cable connection to the reel. Two portal housings are rectangular and meet their supporting faces.
- The A-frame jib and rear obstruction light are assigned to their physical area containers, correcting their previous boom parent.
- Three optional-attachment records retain their keys and tree/history access but have no display mode in this assembled-spreader configuration. The viewer respects an explicitly empty mode list and explains the absence when a part is selected. This does not establish whether an attachment is fitted to any real crane.

The new request expands the previous back-reach-only repair to the highlighted trolley/spreader, boom and gantry parts. C71 back-reach/TLS geometry is preserved: **41 back-reach records are identical**, and all four main hoist/trolley/catenary/boom rope meshes are byte-identical to revision 9. In total, **130 meshes outside the explicitly repaired assemblies remain byte-identical**. All **410 semantic keys / 375 positions** retain their kinds, classifications, position kinds and units; only the two stated area parents change. Rendering instance indices are implementation mappings, not maintenance identities.

The component workbook, generated reference list/hierarchy and unrelated RTG changes were not edited. Source drawings and other protected documents were not modified.

## Verification

| Check | Result |
| --- | --- |
| Model/schema/dimensions/budgets | 26/26 PASS |
| Equipment binding and identity invariants | 11/11 PASS |
| C72 geometry fit and preservation | 7/7 PASS |
| C72 browser checks | 5/5 PASS |
| C70 workbook/tree/part/phone regression | 12/12 PASS |
| C66 labels/selection/mode/phone regression | 14/14 PASS |
| Repeated generation | Byte-identical GLB |
| Rendering budget | 228/230 draw calls, 90,130 triangles, 3,777,156 bytes |

Browser verification includes revision/checksum, no missing nodes, correct fitted/optional visibility in both modes, optional-part record selection, and an actual mouse pick on an individually mapped headblock sheave. The mesh-picking check uses the same viewer in a full-canvas instance so application resizing cannot move the test camera. The application route/tree/selection behavior is checked separately by the C70/C66 regressions. No browser script/resource errors occurred.

Visual evidence: `01-optional-attachment-record.png`, `02-trolley-headblock.png`, `03-trolley-above.png`, `04-gantry-end.png`, `05-cable-guide.png`, `06-boom-trip-wire.png`, `07-tls-preserved.png`.

GLB SHA-256: `763e3a570e0240cc9f79e0634f1397197b0064352068a4b862ad26497cf08d61`.

## Reproduction and limits

```powershell
node tools/model-generator/generate.mjs
node tools/model-generator/validate.mjs --out docs/evidence/U1/floating-parts-c72/validation.json
node tools/p03/check_bindings.mjs --out docs/evidence/U1/floating-parts-c72/binding-validation.json
node tools/u1/check_floating_c72.mjs tmp/floating-c72-before
node tools/u1/capture_floating_c72.mjs
node tools/p02b/check_u1_c70.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/floating-parts-c72/c70-regression
node tools/p02b/check_u1_c66.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/floating-parts-c72/c66-regression
```

The scope check expects the saved revision 9 baseline in `tmp/floating-c72-before`. Captures require the local server on port 5312. Existing classification/numbering questions remain open. Small housings, sensors, guide supports, jib envelopes, exact trip-wire longitudinal datum and unreviewed components remain simplified or estimated. This repair is local visual/model validation, not production or as-built acceptance.
