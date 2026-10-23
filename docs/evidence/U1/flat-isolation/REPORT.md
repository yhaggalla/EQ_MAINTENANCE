

## 24 October 2026 - U1-C33: default Flat and area isolation

User request: default Flat; fill the available viewport on default/reset; extend yard/sea with sea 5 m below rail; replace physical-assembly buttons with a dropdown that isolates the chosen area and all included parts.

Implemented: Flat is the default and Reset returns to the full Flat crane. Full-crane camera framing uses crane bounds (excluding scenery) with 8% margin, adapts to viewport aspect and refits on resize. The Isolate area dropdown replaces both the machinery-house-only control and bottom chips; all 11 manifest containers open in Technical mode, fitted with their descendant parts. Part selection retains isolation; selecting an unrelated mechanism exits it. Whole crane exits isolation; Reset also restores labels and clears selection. The environment is hidden during isolation.

The extended yard and sea are decorative viewer context, outside maintenance identity and camera bounds. Rail/yard level is y=0; sea surface is y=-5 m per the user. The quay edge remains at x=5.3 m as in the existing drawing context; horizontal extents are illustrative. Crane GLB, manifest and original source authorities are unchanged.

Checks: `node tools/p02b/check_flat_isolation.mjs` (18 assertions: default, framing, levels, 11 areas, part selection, reset, phone width, no browser errors). Shared-viewer regression: 11/11 after replacing the old isolate-button test with the dropdown and applying the new Reset rule. Desktop and isolated-area screenshots inspected. Evidence: `docs/evidence/U1/flat-isolation/`. Local synthetic prototype only; U1 approval remains pending, no production acceptance or deployment.
