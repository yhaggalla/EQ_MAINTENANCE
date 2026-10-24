# U1-C46 clear interface explanations

24 October 2026. Direct Codex U1 refinement. Replaced the EQ status paragraph with three labelled points: From ZMMS, Manual correction, No ZMMS link. The user then extended the request to similar long descriptions across the interface.

Applied 65 focused copy/markup adjustments across ten runtime modules: `access.js`, `dialogs.js`, `views-admin.js`, `views-admin2.js`, `views-eqjobs.js`, `views-equipment.js`, `views-fac.js`, `views-facjobs.js`, `views-fleet.js` and `views-jobs.js`, all under `artifacts/prototypes/p02-ui/js/`. Before/after details: `copy-changes.json`.

Long rule explanations now use short labelled points, while ordinary hints use concise sentences. Topics include status correction, spare-part estimates and registration, completion/cancellation, FAC forms, catalogue/positions/specifications, Access, import and ZMMS setup. Source and prototype qualifications remain. Internal phase references and completion request keys were removed from relevant guidance. Actual job descriptions, technical/source observations, workflow handlers, validations, feature keys and role ceilings are unchanged.

## Verification actually performed

- Focused headless Chrome smoke checks: **39/39 PASS** on the working preview at localhost:5312 (`browser-checks.json`). Covered 19 routes, six read-only dialog inspections, rule/warning retention, four phone layouts, source-data fingerprint preservation and no browser errors.
- The same **39/39 PASS** on a temporary HEAD-plus-staged-runtime copy at localhost:5316 (`commit-content-checks.json`), including the final Access-label changes. Existing P03 module dependencies were exposed read-only. Earlier uncommitted U1 presentation edits are excluded from that copy.
- Final Access-label check confirms all four shortened labels, 12 feature entries retained, no visible U1 phase references and no browser errors (`access-label-checks.json`). This is a display check; permission logic was not changed.
- Existing regression: `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/status-copy-c46/r02b-regression.json` — **10/10 PASS**.
- Changed JavaScript syntax and staged Git whitespace checks pass. Desktop status, Access and catalogue screenshots and phone status capture are retained. Status and Access desktop captures were visually inspected.

No new repository tests were added for these copy changes. Verification scripts ran from temporary files and the existing browser/regression harness. No production, real authentication, database, live ZMMS or formal application acceptance checks. No delegated phase or independent R verdict; actual runtime model/effort not independently recorded. Earlier uncommitted U1 and RTG edits remain outside the commit. Source authority folders and Portal are unchanged. **U1 remains IN PROGRESS, NOT COMPLETE and NOT APPROVED; P04 Not started.**
