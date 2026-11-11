# U1-C73: boom busbar and cabin connection

9 November 2026. Local prototype/model correction, draft v1 revision 11. U1 remains NOT APPROVED; no phase advancement or deployment.

The user corrected the identification and installation relationship: power and communication use the slipring connection with the cabin; the busbar runs beneath the boom. This supersedes the earlier generic festoon interpretation of the highlighted shape. J526A00 sheet 2 lists J526A4100, and the mechanical manual chapter 1 section 1.5.3 / Figure 1-48 describes the slip-contact system. These references establish the system but do not dimension this model arrangement. The installation relationship in this repair comes from the user's explicit confirmation.

## Correction

- Removed the short sample rail, three generic carriages and hanging cable loops previously drawn at X=-24.5 to -15.5 beneath the fixed rear girder.
- Added a continuous supported busbar channel under the boom, with a contact shoe, braced arm, connection box and short power/communication leads attached to the cabin. The cabin connection derives its position from the existing cabin dimensions and display pose.
- Retained `trolley.cable-system.main`, its hotspot kind and classification 023. Its area parent is now `container.trolley-runway`; this keeps the combined stationary busbar/moving connection system together. Both Overall and Technical modes show it. No maintenance position was added, deleted or renamed.
- Only `build.mjs` and six new estimated placement parameters in `params.json` define the change. Model artifacts regenerated. Source documents, approved catalogue, fixtures and unrelated work were not modified.

The busbar is represented by one enclosure and an indicative contact strip; the strip does not assert an actual conductor count. Channel section, gate-house-side position, 300 mm drop, 3500 mm support pitch, end stations, contact-shoe shape and cabin mount dimensions are estimates. The model depicts the user's confirmed relationship, not a dimensionally verified J526A4100 installation or an electrical design.

## Verification

| Check | Result |
| --- | --- |
| Model/schema/dimensions/budgets | 26/26 PASS |
| Binding invariants | 11/11 PASS |
| C73 identity, placement and scope | 3/3 PASS |
| Browser checksum, visibility, physical picking and errors | 4/4 PASS |
| Repeat generation | Byte-identical GLB |
| Preserved geometry | 153 other meshes and their transforms byte-identical |

All 410 identities, 375 positions and classifications remain. The cabin, C71 TLS, C72 corrections and all rope meshes are byte-identical to revision 10. Only the targeted assembly mesh changes. GLB: 3,766,776 bytes; 89,850 triangles; 228/230 draw calls; SHA-256 `5fa7b6599d42da80e14db6d575ffbd73b24133c729b8d96d9f4efad7461322c8`.

The same viewer resolves an actual mouse click on the contact shoe to the retained system key. Existing synthetic QC fixtures do not instantiate sub-mechanism 023; application-level work-record selection for this reference hotspot remains subject to that pre-existing applicability setup. This geometry correction does not silently change it. No browser/resource errors occurred.

Reviewed captures: `01-cabin-connection.png`, `02-busbar-under-boom.png`, `03-old-festoon-removed.png`.

Reproduce with `node tools/model-generator/generate.mjs`, `node tools/model-generator/validate.mjs --out docs/evidence/U1/busbar-c73/validation.json`, `node tools/p03/check_bindings.mjs --out docs/evidence/U1/busbar-c73/binding-validation.json`, `node tools/u1/check_busbar_c73.mjs tmp/busbar-c73-before`, and `node tools/u1/capture_busbar_c73.mjs` (local server on port 5312). The scope test requires the saved revision 10 baseline.
