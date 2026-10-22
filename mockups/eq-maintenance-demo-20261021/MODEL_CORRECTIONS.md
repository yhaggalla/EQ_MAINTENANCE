# QC model revision 2

The five user annotations have been applied to the isolated HTML mockup. The main application's files, source drawings and the other agent's implementation records were not modified.

| Annotation | Correction | Drawing/reference inspected |
| --- | --- | --- |
| 1: overall crane differs from drawing | Replaced the side lattice with twin box girders and plan bracing; corrected the portal, tapered A-frame, rear girder extent, boom supports and narrower exterior stair. Side, end and perspective camera views fit the actual model. | J526A00 general arrangement; J526A0100 page 1; supplied CICT photograph |
| 2: lower assembly is wrong | Replaced the large solid housings with four articulated eight-wheel units: paired lower beams, intermediate equalizers and upper saddle, smaller drives and steel wheels. The model uses the drawing's 800 mm wheel diameter. | J526A0600 page 1; J526A0100 page 1 |
| 3: gantry means only the lower mechanism | Static rails are separate scenery and cannot be selected. Mechanism 04 focuses the travelling gear and its associated lower mechanisms, excluding the tall portal structure. | User's marked region; J526A0600 |
| 4: spreader is wrong | Reoriented the long axis across trolley travel, parallel with the gantry rails. Added telescoping members, end beams, four corner twistlocks and guide arms. The separate compact headblock has paired sheaves and aligned rope drops. | General arrangement and J526A1200. Spreader is a simplified container-spreader representation; the supplied package does not contain manufacturer spreader CAD. |
| 5: machinery house missing | Added a recognizable pitched-roof house, cladding, doors, louvres and switchgear annex. Whole-equipment Overall and Technical views both keep it visible. Internal selections remove roof/wall panels while retaining the frame; returning to whole equipment restores them. | J526A3000 page 1; general arrangement; supplied photograph |

The coded mechanisms and equipment-specific work histories are retained. This remains a simplified stage-1 visual model of major assemblies; it is not dimensionally certified CAD.

## Verification

The original 27-workflow and 9-additional-check suites passed after replacing the model. Eight new checks specifically cover the annotations, house cutaway/restoration, mobile display and offline operation. The final camera/cutaway refinement was rechecked with those eight model checks and visual review of the resulting screenshots.

Evidence is in `qa/annotation-fix/ANNOTATION_RESULTS.json` and the numbered screenshots next to it. The preview and standalone HTML use `crane-viewer-corrected.js`; `crane-viewer.js` is retained solely as the previous revision.
