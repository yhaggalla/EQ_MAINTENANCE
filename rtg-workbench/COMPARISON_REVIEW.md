# Drawing comparison review

The five views in `evidence/comparisons/` use actual exported geometry loaded by Three.js, orthographic cameras, and the source raster crops. Every `*-comparison.png` shows source, registered model and blue transparent overlay side by side. Orange circles are the two manual registration datums. `alignment.json` records camera, source/model pixel coordinates, motion pose, asset checksum and uniform transform.

Only **one uniform scale and a translation** are applied. No source stretching, perspective warp, mirroring, silhouette fitting or nonrigid correction is used. The source drawing pixels remain unchanged. Manual raster registration is approximate (about ±3 px on GA; ±8 px on trolley views). It does not replace direct dimension checks. Drawing labels, containers and hidden-line details are intentionally still visible in the source overlay.

| View | Registration | Findings and final status |
|---|---|---|
| GA front | 23.47 m support planes on ground; h=3 m display pose | Support centres, overall frame proportions and rail level correlate. Girders, top walkway rail heights, member widths and detailed wheel housings differ. Cabin now favors the detailed trolley view and sits above its small-GA silhouette. **Provisional** |
| GA stair side | 7.9 m equalizer centres on ground; h=21.2 m | Main zigzag stair direction corrected; major landing elevations and tapered leg placement correlate. Upper/lower access turns, carrier geometry, outer guards and local clearances remain approximate. **Provisional** |
| Trolley front | 6.4 m wheel/rail gauge, wheel-axis datum; h=21.2 m | Nominal gauge/drum diameter and motor offset relationship correlate. Raised cabin body better matches the detailed glazing elevation and width. Source headblock pose differs; it is not forced to match by exceeding the model travel limit. Full reeving is unresolved. **Provisional** |
| Trolley side | 4.05 m wheel-centre separation from2.025+2.025; wheel-axis datum | Wheel centres, cab forward/length envelope and sloping front glazing correlate. Walkway extents, vertical mounting offsets and the depicted suspended-load pose differ. **Provisional** |
| Trolley plan | 6.4 m gauge and centreline; true top camera | Frame/axle relationships and eight-group drum layout visible. Four horizontal guides changed from a generic symmetric arrangement to staggered positions traced from the plan. Source projection direction/machinery handedness remains ambiguous; motor/reducer/lead placement is not certified. **Provisional** |

The overlays exposed real errors and were used to correct the model. They also show why this package is not described as an exact replica. Numeric export checks pass for the explicit dimension table; visual equivalence for all shapes, internals and relative positions is **not** established. Original issued JL28600/JL28606/JL2860603 and vendor drawings are needed to remove those qualifications.

The detailed screenshots `trolley-detail.png`, `cabin-detail.png` and `cabin-cutaway.png` use the photo-referenced CICT finish without selection paint. The previous neutral inspection finish was replaced after the user supplied appearance photographs. The ordinary interactive screenshots include real selection/status overlays, which can change apparent colours. The source PDF remains accessible separately from the demonstration.
