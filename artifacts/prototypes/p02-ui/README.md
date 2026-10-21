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
