# U1-C74: opposite-girder busbar and operator cabin

9 November 2026. Local model draft v1 revision 12. U1 remains NOT APPROVED; no phase advancement or deployment.

The user requested moving the busbar/connection to the other boom girder, checking the cabin against the drawings, and adding the seat, joysticks and panels. This follows the explicit confirmation that the busbar runs under the boom and the power/communication connection is carried by the cabin.

## Drawing review and changes

Read J526A3100 page 1 in full and at enlarged A-A, B-B, C-C, front and plan views; checked J526A0200 page 1 for the cabin's relationship to the trolley. Reviewed drawing crops are in `sources/`. The user's marked screenshot is the problem reference, not a dimensional authority.

- Moved the complete busbar/contact assembly from the -Z to the +Z boom girder. Mirrored the carrier arm, brace, contact stem and short leads. The cabin bracket sits on the fixed upright forward of the side door, instead of across its opening. Busbar longitudinal limits and drop are retained.
- Rebuilt the 3000 x 2200 cabin. C-C establishes the 2400 floor-to-ceiling height; B-B's 2673 is the mounting-top height and must not be used as the enclosure height. Used the 2100 x 1940 mounting pitch and 110 rear offset, with four dampers and connected hanger members.
- Corrected the raked windscreen and side glazing to meet their shared front posts. The visor is separate from the front-glass rake. Added the broad fixed windscreen, upper hinged pane, single central wiper, side sliding panes and glazed side door. Corrected the front floor window to rise toward the front, with open footrest slats and framed side floor panes.
- Rebuilt the suspended seat with cushion, backrest, headrest, armrests, suspension bellows and footrest; added twin joystick consoles, buttons and instrument faces.
- Added C-C's 600 x 1800 reel-control cabinet and 1400 x 2000 CAB/spreader cabinet at the rear, plus B-B's auxiliary side station. Three existing monitor records now own rectangular cabin-mounted displays with attached ceiling supports; screen faces belong to their own selectable monitor instances. Static screen markings are illustrative, not live crane data.
- Replaced the unsupported cylinder below the cabin with a linear floor-window light on the front frame. Moved the indicator box and access switches onto the cabin, preserving their existing records. The rear 900 walkway, 4600 platform span and 850 x 1445 side return now reach the side door; the rear ladder reaches a connected upper access platform. The A/C condenser sits on the rear platform clear of the door route.

Editable geometry is in `assets/models/source/cict-j526a-sts/cabin.mjs`, integrated by `build.mjs`; drawing parameters are in `params.json`. The generated workbook import is untouched; `fitted-components.mjs` corrects the two access-switch locations after import. The new module is included in generated source checksums.

The existing estimated 47.8 m display floor elevation remains. Seat/vendor profiles, frame sections, controls, monitor placement, upper access connection, busbar section/end stations and contact hardware remain simplified or estimated. The J526A4100 detail sheet is not supplied; this repair implements the user's confirmed side and installation relationship. No precise electrical conductor count is asserted.

## Verification

| Check | Result |
| --- | --- |
| Model/schema/dimensions/budgets | 26/26 PASS |
| Binding invariants | 11/11 PASS |
| C74 identity, placement and scope | 6/6 PASS |
| Browser checksum, modes, physical picking and errors | 6/6 PASS |
| Repeat generation | Identical GLB SHA-256 |
| Unaffected complete meshes | 148 byte-identical |
| Unaffected instances in changed trolley carrier | 17 transforms and bounds identical; carrier base geometry identical |

All 410 keys, 375 positions, classifications and parent relationships remain. TLS/back-reach, ropes, other trolley hardware, boom structure and gantry are unchanged. No fixture/catalogue applicability or viewer runtime changes were needed. Earlier unrelated workspace changes remain intact.

The browser loaded the actual local application model with a verified checksum and zero missing geometry/errors. Real mouse clicks resolved the seat, consoles and monitor face to their retained identities. Close interior picking uses the same viewer in a full-canvas harness, with its minimum orbit distance temporarily reduced only in the harness. The first attempt retained the 2 m camera minimum and clicked the outer cab instead; corrected camera setup passed. This is a local geometry/viewer check, not production acceptance or a new in-app interior camera mode.

GLB: 3,888,000 bytes; 92,070 triangles; 230/230 estimated draw calls. SHA-256 `75f101a617e6350a93dbd636871a9d8df3bd123b2a027a2437c500c7f2a2f93b`.

Reviewed final captures: `01-cabin-and-opposite-busbar.png`, `02-cabin-front.png`, `03-cabin-interior.png`, `04-side-door-and-connection.png`, `05-busbar-under-opposite-girder.png`.

Reproduce from repository root:

```powershell
node tools/model-generator/generate.mjs
node tools/model-generator/validate.mjs --out docs/evidence/U1/cabin-c74/validation.json
node tools/p03/check_bindings.mjs --out docs/evidence/U1/cabin-c74/binding-validation.json
node tools/u1/check_cabin_c74.mjs tmp/cabin-c74-before
node tools/u1/capture_cabin_c74.mjs
```

The scope check needs the saved revision 11 baseline; browser capture needs the local demo server on port 5312. Reproducibility was checked against generation into `tmp/cabin-c74-repeat`.
