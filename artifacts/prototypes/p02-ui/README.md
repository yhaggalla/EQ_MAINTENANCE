# CICT EQ & FAC Maintenance - P02 / P02B interface prototype

Static review prototype. **Synthetic data only. Nothing is saved, there is no sign-in, there is no live ZMMS connection, and the persona switch is a simulation of the Portal role assignment.** P02B (22 October 2026) extended it to SOW V2: EQ | FAC sections, Access matrix, the four-tab crane panel (U1-C19), EQ Jobs in three parts, ZMMS daily jobs and automatic status, the spare-part register, the FAC Dashboard and FAC Jobs (114 jobs from `reference/fac-job-list.json`) and the matching Admin screens.

## Run

```powershell
node artifacts/prototypes/p02-ui/serve.mjs        # http://127.0.0.1:5312/
```

or open `artifacts/prototypes/p02-ui/index.html` directly (classic scripts, no modules, no CDN, no build step).

Useful links (query parameters set the simulation; the hash is the route):

| Link | Shows |
| --- | --- |
| `?role=<persona>` | persona: `admin`, `management`, `eqTeam`, `facTeam`, `eqfac` (EQ Team + FAC Team), `noAccess` (all tabs off) |
| `#/eq/fleet`, `#/eq/jobs/special|daily|status|spare-parts` (four tabs, U1-C20), `#/eq/equipment/<id>?panel=maintenance|special|technical|spareParts` | EQ section |
| `?role=management#/fac/dashboard` (`&data=stale` / `error` / `empty`, `?tv=1`, `?motion=off`, `?discipline=..&type=..&focus=overdue`) | FAC Dashboard |
| `?role=facTeam#/fac/jobs` (`?view=board|list`), `#/fac/jobs/fj-2` | FAC Jobs |
| `?role=admin#/admin/access`, `#/admin/fac/master-list|import|settings`, `#/admin/eq/zmms|spare-parts` | Admin |
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

Checks: `node tools/p02/check_prototype.mjs` (needs the server above and Chrome or Edge), `python -I tools/p02/check_contrast.py`,
screenshots: `node tools/p02/capture.mjs`. See `docs/evidence/P02/P02_EVIDENCE.md`.

U1 repair (22 October 2026): compact Fleet page without the heading block (status meaning kept in the "Manual status, no telemetry" note), new QC icon, flat schematic with back-reach area, CICT logo (`img/cict-logo.png`, copied unchanged from the Portal source), stairs, cab seat/consoles, tier 1 > 2 > 3 drill-down labels and Isolate machinery house / Labels controls matching the P03 3D view. Evidence: `docs/evidence/U1/repair-20261022.md`.

U1 round 2 (22 October 2026): labels stay on the schematic after any tree selection (edge-pinned with an arrow when outside the frame; a notice when the selection has nothing drawn, e.g. 17 Other); Reset returns to the whole equipment with labels on, the tree folded back and the full view; fold icons work on the selected mechanism; schematic gained the boom-tip load cells, floodlight fittings, the elevator at the landside leg with its landings, the apex platform and sheaves, two boom blocks, the girder-tail end platform with its stair and cabinets/parts instead of dashed circles (five template positions appended: floodlights, drive cabinets, emergency drive, apex sheaves, boom blocks; existing IDs unchanged). Evidence: `docs/evidence/U1/repair-r2-20261022.md`.

U1 round 3 (22 October 2026): the trolley, cab position, headblock, spreader and main hoist falls in the schematic are drawn at the J526A0200 / J526A1200 side-elevation proportions (trolley centre x = 94; spreader seen end-on, its 40 ft length runs along the rails); four template positions appended (trolley sheaves A and B, trolley-rope equalizer sheaves, spreader cable reel 014; 014 added to the J526A applicability candidates; template revision 4; existing IDs unchanged); the minimum fitted width is 16 m (was 34 m) and a fit stays at least 4 m narrower than the reset view. Evidence: `docs/evidence/U1/repair-r3-20261022.md`.

## P02B (22 October 2026)

New files: `css/v2.css`; `js/access.js` (personas, Access matrix, landing), `js/zmms.js` (synthetic ZMMS daily jobs, runs, automatic status, mappings; shaped like the real export, invented values), `js/spares.js` (spare-part register), `js/fac.js` and generated `js/fac-ref.js` (`node tools/p02b/build_fac_ref.mjs`; FAC rules and the 114 reference jobs, synthetic progress/photos/updates), `js/panel-tabs.js` (the four crane-panel tabs, also used by the P03 viewer page), `js/views-eqjobs.js`, `js/views-fac.js`, `js/views-facjobs.js`, `js/views-admin2.js`. Checks: `node tools/p02b/check_p02b.mjs`, `node tools/p02b/check_p03_panel.mjs` (both servers, SwiftShader), `node tools/p02/check_prototype.mjs` (regression; assertions of superseded V1 behaviour are marked "P02B adapted"), `node tools/p02b/capture.mjs` (screenshots). Evidence: `docs/evidence/P02B/`.

U1 round 6 (23 October 2026): the crane-view Projects/Special tab lists open and completed special jobs, newest first (U1-C23); the FAC Dashboard lists jobs completed earlier and not yet due again as a last "Done, up to date" group (U1-C24); the schematic draws the 013 load cell in the horizontal main hoist rope at the boom tip (U1-C25); special jobs (job record) and FAC jobs (FAC job detail) have a shared "Show on dashboard / 3D" or "Show on dashboard" switch for Admin and the owning team, hidden jobs leave the dashboards, the crane view and the fleet-card counts and stay in Jobs and exports (U1-C26). Checks: `node tools/p02b/check_u1_r6.mjs` (needs both servers). See `docs/evidence/U1/repair-r6-20261023.md`.
