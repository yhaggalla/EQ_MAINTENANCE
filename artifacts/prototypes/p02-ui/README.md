# CICT EQ Maintenance - P02 interface prototype

Static review prototype. **Synthetic data only. Nothing is saved, there is no sign-in, and the role switch is a simulation.**

## Run

```powershell
node artifacts/prototypes/p02-ui/serve.mjs        # http://127.0.0.1:5312/
```

or open `artifacts/prototypes/p02-ui/index.html` directly (classic scripts, no modules, no CDN, no build step).

Useful links (query parameters set the simulation; the hash is the route):

| Link | Shows |
| --- | --- |
| `?role=eqTeam#/fleet` | Fleet dashboard as EQ Team (writer) |
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
