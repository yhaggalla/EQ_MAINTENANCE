# CICT RTG appearance update

The user supplied seven photographs and the CICT flag image in `RTG drawings/`, and requested their actual CICT colours and painted signs. These sources replace the earlier neutral inspection finish. Mechanical dimensions and semantic identities are unchanged; the visible collision guard panels are newly represented from the photographs.

| Feature | Source and interpretation | Implementation |
|---|---|---|
| Main frame, trolley and access steel | `maxresdefault.jpg`, `images (1).jpg`, three `IMG_20171109_*.jpg` close views | Red paint, base sRGB `#cc1930` |
| Cabin and room enclosures | `maxresdefault.jpg`, `images (1).jpg` | Off-white, `#e7ecee`; grey-blue glazing |
| Spreader/headblock | `maxresdefault.jpg`, `images.jpg`, `images (1).jpg` | Yellow, `#e7b52d`; exposed shafts and ropes retain metal/dark finishes |
| Wheel collision guards | `images (1).jpg`, `IMG_20171109_141902.jpg`, `IMG_20171109_141914.jpg`, and user's annotated missing-guard screenshot | Matching black/yellow end and side panels on all eight tyre guards; inner guards added at the user's request, sizes estimated |
| Capacity sign | `maxresdefault.jpg`, `story-11.webp` | Black **40.5t** on a white panel, both outer girder faces |
| CICT flag/sign | `04a76ac3-a3c0-494b-bbc9-2f5859c38600.png`; panel placement from `maxresdefault.jpg` | The actual supplied blue flag, white CICT lettering and gold emblem/staff, embedded unchanged; white backing panel |
| ZPMC sign | `maxresdefault.jpg`, `images (1).jpg` | Green **ZPMC** lettering on white; small unreadable text/emblem detail is not invented |

The colour values are visual matches to photographs under different lighting, not verified RAL/coating specifications. Capacity and ZPMC lettering are reconstructed from readable text using the bundled Helvetiker vector font; ZPMC fine artwork remains approximate. CICT lettering and its emblem come directly from the user's image. Multiple fleet numbers are visible in the photos, so none is baked into this reusable model or treated as a real equipment binding. The two demonstration equipment identities remain synthetic.

The flag identity follows the user's clarification, **CICT flag**, and the image subsequently added to the source folder. The original 1,254 × 1,254 PNG bytes are embedded directly in the GLB and checked against the supplied file. Its surrounding checkerboard is excluded by the shape of the display mesh and its UV coordinates; the original PNG is not retouched or regenerated. Sign dimensions and exact placements remain photo-based estimates. No national flag is included. Font source for the other text is [Three.js r186](https://github.com/mrdoob/three.js/tree/r186/examples/fonts); its licence accompanies the local font file.

`source/appearance.mjs` controls the palette, sign dimensions and placement. `source/artwork/` stores an unchanged copy of the supplied flag PNG, derived outline and font. `tools/prepare-appearance.py` regenerates only its display outline and source register. `tools/embed-artwork.mjs` embeds the PNG in the GLB BIN chunk. Normal model builds use local files and need no external network. The GLB contains vertex colours, sign geometry and its single embedded image, with no external texture or runtime font dependencies. Decorative surfaces belong to existing structural assemblies, preserving picking, isolation, equipment history and all 121 semantic node keys.

`evidence/appearance/source-register.json` records the original photo and flag hashes. `cict-overview.png`, `beam-signs.png`, `rear-signs.png` and `wheel-guards.png` show the exported model in the browser. The raw inspection crops are evidence of limited photo resolution, not enhanced source artwork. `results.json` records embedded colouring, two decoded 1,254 × 1,254 CICT images and unchanged semantic-node count. Node geometry validation uses a texture placeholder after verifying the embedded PNG bytes; the browser performs the actual decode and rendering. The general browser checks and 18 dimensional checks were rerun after the appearance update.
