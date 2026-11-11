# U1-C75 elevator-side cabin entrance

U1-C75 / D-225, 9 November 2026: cabin entrance and boarding platform corrected to elevator (-Z) side, with a distinct access gate; A/C and auxiliary side equipment follow the mirrored layout. Added fixed access from the third elevator/stair landing to a representative cabin home boarding interface. Busbar stays on +Z. Current cabin/trolley display remains at outreach; the home stopping coordinate is provisional, not drawing-verified. Revision 13; all 410 identities/classifications/parents retained, 151 unrelated meshes including busbar/TLS/ropes byte-identical. Model 26/26, bindings 11/11, browser 6/6 and scope assertions pass; 230/230 draw calls. Evidence: docs/evidence/U1/cabin-c75/REPORT.md. U1 NOT APPROVED; no deployment or phase advancement.

## Source review and limits

Reviewed J526A5100 p1 (elevator at landside leg B, third landing 47845), J526A5000 p1 and its page overview, enlarged J526A5008 on PDF p9 (girder-end access, not evidence of an exact cabin home stop), and the previously reviewed J526A3100 cabin plan. Drawings remain untouched. User confirmation determines the entrance side, superseding the C74 +Z interpretation.

The door, side return and boarding arm now face -Z; reversed triangle winding preserves outward faces after mirroring. A distinct closed boarding gate replaces the fixed end railing. The A/C and auxiliary panel swap sides to keep the door route clear; access-switch records move to the door jamb. Seat, monitor identities and busbar geometry remain unchanged.

A fixed walkway branches from the third stair/elevator landing around the landside face of the leg and terminates at a representative home boarding interface. Its exact route offsets and supports are simplified. `cabinHomeRearX=-30000` is an estimated rear-face stopping station, NOT a measured home coordinate. The third landing is 47.845 m; the retained display cabin floor is approximately 47.8 m. This is a schematic boarding relationship, not a fabrication or clearance-certified design. The moving cabin stays in the existing outreach pose; there is no second cabin and no new home animation/preset.

## Verification

Model 26/26; binding 11/11; browser 6/6; scope assertions pass. All 410 keys/classifications/parents preserved. 151 unrelated mesh geometry/transforms, including busbar, TLS and ropes, are byte-identical to revision 12. Actual mouse selection of seat, consoles and monitor still works. 92,490 triangles, 230/230 draw calls, 3,910,668 bytes. SHA-256: `7cc263ed0510912230c48f75d89b3f066148a3fe0440046d12ea201c7e66b273`.

Reviewed `01-elevator-side-door.png` and `02-home-access.png`. The overhead capture `03-home-access-plan.png` is obstructed by the existing machinery-house structure and is not useful evidence of route clearance. Local browser checks only; no production acceptance.

Commands: `node tools/model-generator/generate.mjs`; `node tools/model-generator/validate.mjs --out docs/evidence/U1/cabin-c75/validation.json`; `node tools/p03/check_bindings.mjs --out docs/evidence/U1/cabin-c75/bindings.json`; `node tools/u1/check_cabin_c75.mjs`; `node tools/u1/capture_cabin_c75.mjs` (local server 5312). Scope baseline: `tmp/cabin-c75-before`.
