# CICT EQ Maintenance interactive HTML mockup

Created in a new, isolated folder on 21 October 2026. No pre-existing app, prompt-pack, drawing, configuration or project-ledger files were edited for this mockup.

## Open the mockup

Double-click `index.html` in Microsoft Edge or Google Chrome. You can also use `Open mockup.cmd`.

The HTML embeds its styles, application code, Three.js viewer, dummy records, five drawing references and the supplied crane photograph. It does not need npm, an application server, an internet connection or the rest of the repository to run. The file is approximately 7 MB because the original reference PDFs are included.

All equipment, work, installed serials, dates, people and operational statuses shown in the demo are synthetic. The embedded drawings/photos are source references supplied for this project. The model is a simplified visual mockup informed by the drawings; it is not a verified production model or an engineering assessment.

## Working interactions

- Fleet dashboard: 18 dummy equipment items (6 QC, 8 RTG, 4 ES), operational-status counts, equipment-type/status/search filters, sorting, card/list views, readiness snapshot and recent activity.
- QC explorer: true interactive 3D, pointer selection, main/sub/part tree selection, focused camera, orbit/pan/zoom, camera presets, reset/fit, labels, selective Technical cutaway, screenshot download and full-screen controls where the browser permits.
- Technical/work panel: scoped work history, installed position details, major reference parameters and drawing previews. QCs sharing one scene have independent records and serials.
- RTG/ES: complete record, mechanism, work and replacement navigation, with their full 3D models explicitly deferred.
- Work orders: create/edit, start, complete, record replacement positions and new serials, add several replacement lines, cancel permitted uncompleted work, filter by equipment/priority/search and switch board/table views.
- Equipment status: set Ready for OPS, Maintenance or Breakdown with an appropriate reason and optional linked work. Completing work does not change operational status automatically.
- Work evidence: attach a PDF/PNG/JPEG/WebP up to 1 MB each to the local demo, preview supported images and download attachments.
- Replacement history: exact equipment/part position, removed and new serials, quantities, linked work and JSON export. Reopening/recompleting work retains its replacement events without duplicating them.
- Admin: add/edit/retire/reactivate equipment; inspect/add/edit coded definitions; add/edit/deactivate part positions; configure equipment-type applicability; and inspect/export the activity log. Original codes are preserved in the initial dataset; 048/063 start inactive and code 10 is not assigned.
- Role switch: Admin, EQ Team and Management presentations. Management controls are read-only; EQ Team can update work/status and cancel its own uncompleted work; Admin can correct/reopen completed records.
- Browser persistence: local demo changes survive reloads; full dummy-data JSON export and Reset demo data are available.

Role switching is a browser-only interaction simulation. This mockup implements no server authentication, central Portal login, database, live equipment feed or production authorization boundary.

## Suggested walkthrough

1. Open Fleet overview and select QC01, or use Explore QC01.
2. Expand Hoist, select submechanism 011, then Hoist motor A. Compare its history with the same position on QC03.
3. Switch Overall/Technical modes and use Side/End/Top camera views. Click a major assembly or its label.
4. From a selected position choose Add work here, create a Replacement job, start it, and complete it with a new dummy serial and completion note.
5. Check the replacement history and current position. QC01 remains Maintenance until you explicitly update its operational status.
6. Switch to Management and see the read-only controls. Switch back to Admin to try the register, catalogue, parts and applicability screens.
7. Open Document library and preview/download an embedded reference.
8. Export your demo changes, or Reset demo data to return to the original fixtures.

## Persistence and isolation

The mockup uses only the localStorage key `cict-eq-maintenance-isolated-mockup-20261021-v1`. It does not read or write any real app's keys, SQL records or server files. Browser storage capacity/policies vary; the UI reports storage failures and allows a JSON export. Clearing the demo resets only this mockup's synthetic dataset.

All authored files, temporary build dependencies and QA artifacts are within `F:\CODEX\EQ_MAINTENANCE\mockups\eq-maintenance-demo-20261021`. The development phase ledger and another agent's existing files were left untouched. This is not an implementation phase of the production app.

## Source files

- `app.js`: navigation, forms, role simulation and browser-only workflows.
- `demo-data.js`: synthetic fleet, work, positions and histories.
- `reference-data.js`: a copied snapshot of the approved mechanism/parameter definitions.
- `crane-viewer-corrected.js`: current drawing-informed Three.js geometry and selection/camera behaviour (revision 2).
- `crane-viewer.js`: retained first-revision geometry; the standalone build no longer uses this file.
- `styles.css`: responsive interface styles.
- `page-template.html`: HTML template for the standalone build.
- `assets/`: local copies of supplied source references.
- `vendor/`: bundled Three.js and its licence/source metadata.
- `build_demo.py`: regenerates `index.html` from these files using Python's standard library.
- `prepare_demo.py`: originally prepared a local Three.js bundle and source-reference copies. It is not needed to open the finished HTML.
- `qa/`: browser screenshots and the executed workflow report.

The standalone ZIP contains the HTML, this guide, third-party licence and verification evidence. Editable source remains in this isolated workspace folder.

## QC model corrections

The five browser annotations are addressed in revision 2: twin box girders and corrected portal/mast outline; stepped eight-wheel travelling units; gantry focus restricted to lower mechanisms; a transverse telescopic spreader with four corner locks and a separate headblock; and a visible pitched-roof machinery house. The house opens only for internal Technical drill-down and restores its exterior on returning to whole equipment.

See `MODEL_CORRECTIONS.md` and `qa/annotation-fix/` for the annotation mapping, source references, revised views and dedicated verification report.
