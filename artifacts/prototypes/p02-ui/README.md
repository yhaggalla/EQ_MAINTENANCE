# CICT EQ & FAC Maintenance - P02 / P02B interface prototype

**C59 equipment-icon correction:** QC/RTG/ES illustrations now appear above type/count pairs on the total and three status cards, following the user's clarification. Small label icons remain. Evidence: `docs/evidence/U1/fleet-equipment-icons-c59/REPORT.md` (27/27 focused checks); D-209. Preserve through temporary-wrapper cleanup.

**Fleet KPIs (U1-C59, 25 October 2026):** total and Ready for OPS / Breakdown / Maintenance show active, type-scoped QC/RTG/ES counts. Six small label icons retain space for summaries; percentage and Unreported columns are narrower. Normal filters/keyboard behavior and read-only TV paging remain. Checks: `node tools/p02b/check_u1_c59.mjs` (27/27) plus fleet regression (37/37); evidence: `docs/evidence/U1/fleet-summary-c59/REPORT.md`. Preserve during temporary-wrapper removal. U1 remains open/unapproved.

**Temporary management walkthrough (U1-T01 BUILD complete, 24 October 2026):** fresh `http://127.0.0.1:5312/` -> Portal-style login -> four cards -> EQ & FAC Maintenance. Press Sign in with blank/any input; UMMS/PayPrep/Safety are inert placeholders. No authentication or external connection. The app remains unchanged at `/index.html`, retaining EQ Team / EQ Fleet fresh default, last permitted route and persona controls; explicit existing EQ/FAC/P03 links remain compatible. TD01-TD06 pass (62/62 browser assertions); TD07-TD08 are NOT RUN. Evidence/removal manifest: `docs/evidence/U1/temp-management-walkthrough/REPORT.md` and `BASELINE.json`. Remove only temporary server hunks and `temp-management/` additions before U1 approval; preserve accepted app refinements against initial reference `8303f8b8a55f41983bdcc77363ddbf13d2892383` and retain docs/evidence. Login/Portal feedback stays deferred to P05. U1 remains unapproved; P04/P05 Not started.

**FAC charts (U1-C57):** `#/fac/dashboard` now has three bottom cards: Latest proof, Completion trend · 4 weeks and Due in the next 8 weeks. Existing desktop/TV row heights are retained; charts fill the measured plot width with readable labels. The trend counts completed scheduled-job cycles across three prior calendar weeks plus this week to date, by discipline, following dashboard filters/search/Show; Daily/Weekly checks are excluded. Narrow screens stack the cards. Checks: `node tools/p02b/check_u1_c57.mjs`; evidence: `docs/evidence/U1/fac-charts-c57/REPORT.md`. Local synthetic prototype; U1 remains incomplete/unapproved.

**Fleet quantities (U1-C54, 24 October 2026):** 14 QCs, 46 RTGs and 7 ES units (67 active demo members). `js/fixtures.js` holds the single baseline used by Fleet/dashboard totals, cards/table/TV paging, Admin, EQ status, Jobs filters/forms/shared type scopes and CMMS mapping choices. Codes remain `QC01..14`, `RTG01..46`, `ES01..07`; new members start Unreported without model/positions/history/mappings. RTG07 is now active/Unreported; retirement is tested explicitly. Existing demo identities/history remain. Quantities do not cap Admin registration. Check: `node tools/p02b/check_u1_c54.mjs`; evidence: `docs/evidence/U1/fleet-size-c54/REPORT.md`. Earlier small-fleet descriptions below are historical. U1 remains incomplete/unapproved.

> **Current entry (U1-C32..C37; U1 NOT COMPLETE / NOT APPROVED):** Run `node artifacts/prototypes/p02-ui/serve.mjs 5312` and open `http://127.0.0.1:5312/#/eq/equipment/eq-qc-demo-01`. One renderer/model now supplies 3D and fixed-side Flat modes within the equipment page. Flat is the default. Reset restores the whole crane in the current Flat/3D mode; 3D starts/resets to the supplied three-quarter reference. Isolate area opens any of the 11 physical containers with its included parts and four working, scoped information tabs. Yard/rail is at 0 m and sea at -5 m; this decorative context is hidden in isolation. The P03 entry redirects saved links to that page. Older separate-page/SVG descriptions and tests below are historical; current checks are `tools/p02b/check_unified_viewer.mjs` and `tools/p02b/check_flat_isolation.mjs` and `tools/p02b/check_u1_c34.mjs`. Registered selected spare parts use Update condition; unregistered ones use Add spare part (C35). Panels now omit repeated explanatory paragraphs while retaining actual records, status/source/freshness, manual reasons and stale indicators (C37). These adjustments remain U1 work; P04 is Not started. The P03 model, renderer and capture helpers remain shared source/evidence assets.


Static review prototype. **Synthetic data only. Nothing is saved, there is no sign-in, there is no live CMMS connection, and the persona switch is a simulation of the Portal role assignment.** P02B (22 October 2026) extended it to SOW V2: EQ | FAC sections, Access matrix, the four-tab crane panel (U1-C19), EQ Jobs in three parts, CMMS daily jobs and automatic status, the spare-part register, the FAC Dashboard and FAC Jobs (114 jobs from `reference/fac-job-list.json`) and the matching Admin screens.

## Run

**FAC style update (U1-C38):** `#/fac/dashboard` now follows EQ Fleet's warm neutral/white cards with yellow accents from the supplied reference. TV and moving lanes/ticker are retained. Review evidence: `docs/evidence/U1/fac-dashboard-c38/REPORT.md`. Earlier notes that FAC restyling is deferred are superseded. U1 remains incomplete/unapproved.

**Equipment panel search (U1-C39):** all four information tabs have a compact search beneath the tabs. Searches filter the current rendered selection, remember each tab/scope's query in memory and work in both Flat and 3D. Evidence: `docs/evidence/U1/panel-search-c39/REPORT.md`. U1 remains incomplete/unapproved.

**Equipment navigation (U1-C40):** Fleet is now in the top card before Correct status. The repeated equipment-name breadcrumb is removed; selected-scope breadcrumbs and phone drawer controls remain. Evidence: `docs/evidence/U1/header-nav-c40/REPORT.md`. U1 remains incomplete/unapproved.

**Compact Jobs and card edits (U1-C41/C42):** EQ/FAC Jobs omit the visible introductory blocks; actions sit beside filters/layout controls. Show is editable directly on writer cards, with hover/focus details. FAC cards use plain neutral borders and Quick edit opens the existing authorized form without leaving the board/list. Read-only roles retain state text. Preview with `?role=facTeam#/fac/jobs?view=board`. Evidence: `docs/evidence/U1/jobs-cleanup-c41/REPORT.md` and `docs/evidence/U1/jobs-cleanup-c42/REPORT.md`. U1 remains incomplete/unapproved.

**Single-row card actions (U1-C43):** EQ/FAC action buttons stay on one compact line, with 32 px desktop heights and 44 px phone targets. FAC uses the explicit Update progress label; EQ uses labelled compact action icons. Very narrow rows pan locally. Show and existing permissions are preserved. Evidence: `docs/evidence/U1/job-actions-c43/REPORT.md`. U1 remains incomplete/unapproved.

```powershell
node artifacts/prototypes/p02-ui/serve.mjs        # http://127.0.0.1:5312/
```

Use the HTTP server above for the current shared viewer (ES modules and model assets). Direct file opening is not a supported full-viewer review path. No CDN or build step is required.

Useful links (query parameters set the simulation; the hash is the route):

| Link | Shows |
| --- | --- |
| `?role=<persona>` | persona: `admin`, `management`, `eqTeam`, `facTeam`, `eqfac` (EQ Team + FAC Team), `noAccess` (all tabs off) |
| `#/eq/fleet` (`?tv=1` TV mode, `&motion=off` no blinking, U1-C28/C30), `#/eq/jobs/special|daily|status|spare-parts` (four tabs, U1-C20), `#/eq/equipment/<id>?panel=maintenance|special|technical|spareParts` | EQ section |
| `?role=management#/fac/dashboard` (`&data=stale` / `error` / `empty`, `?tv=1`, `?motion=off`, `?discipline=..&type=..&focus=overdue`) | FAC Dashboard |
| `?role=facTeam#/fac/jobs` (`?view=board|list`), `#/fac/jobs/fj-2` | FAC Jobs |
| `?role=admin#/admin/access`, `#/admin/fac/master-list|import|settings`, `#/admin/eq/cmms|spare-parts` | Admin |
| `?role=eqTeam#/fleet` | P02 path, redirects to `/eq/fleet` |
| `?role=management#/fleet` | Same, Management read-only |
| `?role=eqTeam#/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&mode=technical` | QC detail, motor A selected |
| `?role=eqTeam#/equipment/eq-qc-demo-02?main=mi-q02-01&sub=si-q02-011&part=pp-q02-007` | Same template, different equipment, different history |
| `?role=eqTeam#/jobs` | Pending / Current / Completed board |
| `?role=admin#/admin/positions?equipment=eq-qc-demo-03` | Admin: draft positions awaiting confirmation |
| `&data=stale` / `&data=error` / `&data=empty` / `&data=loading` | Data states |
| `&viewer=nowebgl` / `contextlost` / `loadfailed` / `loading` | Viewer fallback states |
| `&controls=1` | Opens the Prototype controls panel |

## Layout of this folder

- `index.html`, `css/app.css` - shell and styles (tokens mirror the ENG Portal).
- `js/catalog.js`, `js/params.js` - **generated** real reference data (`python -I tools/p02/build_catalog.py`).
- `js/fixtures.js` - **synthetic** fleet, positions, jobs and history (`-DEMO-` codes only).
- `js/store.js` - in-memory store and the simulated server rules (permissions, validation, atomic completion, idempotency).
- `js/preview.js` - the SVG placeholder for the QC viewer (not the P03 model, no WebGL).
- `js/views-*.js`, `js/dialogs.js`, `js/app.js` - screens, forms, router, prototype controls.
- `js/fleet-art.js`, `css/eq-fleet.css` - U1 round 8: in-house flat QC/RTG/ES illustrations and the EQ Fleet restyle, blink and TV mode (scoped to the EQ Fleet page; FAC unchanged).

Checks: `node tools/p02/check_prototype.mjs` (needs the server above and Chrome or Edge), `python -I tools/p02/check_contrast.py`,
screenshots: `node tools/p02/capture.mjs`. See `docs/evidence/P02/P02_EVIDENCE.md`.

U1 repair (22 October 2026): compact Fleet page without the heading block (status meaning kept in the "Manual status, no telemetry" note), new QC icon, flat schematic with back-reach area, CICT logo (`img/cict-logo.png`, copied unchanged from the Portal source), stairs, cab seat/consoles, tier 1 > 2 > 3 drill-down labels and Isolate machinery house / Labels controls matching the P03 3D view. Evidence: `docs/evidence/U1/repair-20261022.md`.

U1 round 2 (22 October 2026): labels stay on the schematic after any tree selection (edge-pinned with an arrow when outside the frame; a notice when the selection has nothing drawn, e.g. 17 Other); Reset returns to the whole equipment with labels on, the tree folded back and the full view; fold icons work on the selected mechanism; schematic gained the boom-tip load cells, floodlight fittings, the elevator at the landside leg with its landings, the apex platform and sheaves, two boom blocks, the girder-tail end platform with its stair and cabinets/parts instead of dashed circles (five template positions appended: floodlights, drive cabinets, emergency drive, apex sheaves, boom blocks; existing IDs unchanged). Evidence: `docs/evidence/U1/repair-r2-20261022.md`.

U1 round 3 (22 October 2026): the trolley, cab position, headblock, spreader and main hoist falls in the schematic are drawn at the J526A0200 / J526A1200 side-elevation proportions (trolley centre x = 94; spreader seen end-on, its 40 ft length runs along the rails); four template positions appended (trolley sheaves A and B, trolley-rope equalizer sheaves, spreader cable reel 014; 014 added to the J526A applicability candidates; template revision 4; existing IDs unchanged); the minimum fitted width is 16 m (was 34 m) and a fit stays at least 4 m narrower than the reset view. Evidence: `docs/evidence/U1/repair-r3-20261022.md`.

## P02B (22 October 2026)

New files: `css/v2.css`; `js/access.js` (personas, Access matrix, landing), `js/cmms.js` (synthetic CMMS daily jobs, runs, automatic status, mappings; shaped like the real export, invented values), `js/spares.js` (spare-part register), `js/fac.js` and generated `js/fac-ref.js` (`node tools/p02b/build_fac_ref.mjs`; FAC rules and the 114 reference jobs, synthetic progress/photos/updates), `js/panel-tabs.js` (the four crane-panel tabs, also used by the P03 viewer page), `js/views-eqjobs.js`, `js/views-fac.js`, `js/views-facjobs.js`, `js/views-admin2.js`. Checks: `node tools/p02b/check_p02b.mjs`, `node tools/p02b/check_p03_panel.mjs` (both servers, SwiftShader), `node tools/p02/check_prototype.mjs` (regression; assertions of superseded V1 behaviour are marked "P02B adapted"), `node tools/p02b/capture.mjs` (screenshots). Evidence: `docs/evidence/P02B/`.

U1 round 6 (23 October 2026): the crane-view Projects/Special tab lists open and completed special jobs, newest first (U1-C23); the FAC Dashboard lists jobs completed earlier and not yet due again as a last "Done, up to date" group (U1-C24); the schematic draws the 013 load cell in the horizontal main hoist rope at the boom tip (U1-C25); special jobs (job record) and FAC jobs (FAC job detail) have a shared "Show on dashboard / 3D" or "Show on dashboard" switch for Admin and the owning team, hidden jobs leave the dashboards, the crane view and the fleet-card counts and stay in Jobs and exports (U1-C26). Checks: `node tools/p02b/check_u1_r6.mjs` (needs both servers). See `docs/evidence/U1/repair-r6-20261023.md`.

U1 round 8 (23 October 2026, EQ Fleet only): flat pastel restyle with a KPI tile row (U1-C31), in-house SVG illustrations of the QC, RTG and ES on cards, group headers and the KPI tile (U1-C29), Breakdown cards blink rose (2.5 s) and Maintenance cards amber (3.5 s) with a Pause blinking control and a steady highlight under reduced motion (U1-C30), and a read-only TV mode `#/eq/fleet?tv=1` with Pause, Esc / Exit TV mode and paging when the fleet does not fit (U1-C28). The FAC Dashboard is restyled only after the user reviews the EQ result. Checks: `node tools/p02b/check_u1_r8.mjs [url] [out] --head=<committed copy url>`; screenshots `node tools/u1/capture_u1r8.mjs`. See `docs/evidence/U1/repair-r8-20261023.md`.
