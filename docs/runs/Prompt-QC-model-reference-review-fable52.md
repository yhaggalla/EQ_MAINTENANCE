# Prompt: QC 3D model review against reference drawings and photos (Fable 5.2)

Run from `F:\CODEX\EQ_MAINTENANCE`:

```powershell
claude --model claude-fable-5-2
```

Then paste everything below the line. (Use `/effort high` or higher; this is a long, vision-heavy task.)

---

You are reviewing and adjusting the QC (ship-to-shore crane) 3D model in the CICT EQ Maintenance app. The model is **CICT-J526A-STS scene, draft v1 revision 13**, generated from source code. Your job: compare it carefully against the as-built drawings and the site photos, list every discrepancy, fix the ones the references support, regenerate, verify, and record the work. Work in this repository only.

## 1. Read first (in this order, before touching anything)

1. `CLAUDE.md` and `AGENTS.md`: project rules and hard boundaries.
2. `docs/HANDOVER.md`: the QC model section and the latest U1 entries (C65 to C75).
3. `documents/prompt-pack/QC_3D_MODELLING_BRIEF.md`: modelling rules, budgets and tolerances.
4. `assets/models/source/cict-j526a-sts/README.md`: coordinate system, build commands, **identity rules**.
5. `artifacts/models/cict-j526a-sts-scene/1/provenance.md`: every dimension with its kind (measured / drawing-derived / estimated / approximate-location) and source sheet; the landmark check in section 2.
6. `artifacts/models/cict-j526a-sts-scene/1/manifest.json`: `revisionNote` (full history of user-confirmed changes), `budgets`, `asset` counters.
7. `docs/DECISIONS.md`: the uncertainty register (`U-xx` rows) and decisions D-213, D-217, D-220 and later.

Coordinate system: metres, Y up, +X along the boom toward the water, Z along the rails. Origin is the top of the waterside rail on the crane centreline; the landside rail is X = -30. Side `a` = +Z, side `b` = -Z (gate-house / LHS end = -Z; the elevator and cabin entrance are on -Z; the busbar is on +Z).

## 2. Reference material (read-only)

**As-built drawings:** `Drawings and manuals/As-bulit drawing/` (drawing register: `AS-bulit drawing list.pdf`, also `documents/prompt-pack/reference/drawing-register.json`). Key sheets:

| Sheet | Covers |
| --- | --- |
| J526A00 (structure parameters), J526A00_002.png | General arrangement, side and end views, main dimensions, elevations |
| J526A0100 | Steel structure: legs, portal, boom, girder, A-frame, forestays, backstays, braces |
| J526A0104 / J526A2200 | Trolley rails, catenary trolley system |
| J526A0200, J526A2100, ZT2-015022 | Trolley, trolley sheaves, trolley wheel |
| J526A0300 / 0400 / 0500 | Main hoist, trolley drive, boom hoist machinery |
| J526A0600 | Gantry arrangement (bogies, wheels, drives) |
| J526A1000 | Back-reach / TLS (trim-list-skew) |
| J526A1200, DT1500F, Sheave.pdf | Headblock, sheaves |
| J526A1300 to J526A1600 | Machinery-house mechanisms, rope re-reeving |
| J526A2000, J526A2300 | Reeving, load cells, rope-end anchors |
| J526A3000 | Machinery house layout and sections |
| J526A3100 | Operator cabin |
| J526A3200 / 3300 / 4000 | Electrical rooms, cable/busbar systems |
| J526A5000 / 5100 | Platforms, ladders, stairs, elevator |
| J526A6000 to J526A6300, J526A7000 to J526A7400, J526AM00 | Remaining sheets: check the register for content before using |

Manuals: `Drawings and manuals/Mechanical manual/`, `Drawings and manuals/Cavotec manual for QC/`.

Existing drawing crops: `artifacts/p00-drawing-crops/`. To read a drawing in detail, rasterize the page into `tmp/` with `tools/p00/render_drawing_page.py` (or PyMuPDF, installed) at 200 dpi or more, then zoom into crops. Do not guess numbers you cannot read; say they are illegible.

**Photos** (open each and confirm it shows a CICT QC before using it):
- `Drawings and manuals/As-bulit drawing/QC JPEG.jpg`, `QC PNG.png`, and the cover photo in `cover.pdf`
- `documents/images.jpg`, `documents/images2.jpg`, `documents/Image_20261105154656.jpg`
- `.codex-remote-attachments/*/*/*.jpg` (user-supplied site photos)
- Earlier side-by-side comparisons: `docs/evidence/P03/comparison/`, `docs/evidence/U1/repair*/comparison/`

Appearance reference (SOURCE_MAP): red steel structure, light/white machinery house with the blue CICT sign, "01" and ZPMC marks on the portal beam.

**Precedence when sources disagree:** printed dimension on an as-built drawing > drawing-derived value > photo > estimate. A user-confirmed decision in the `revisionNote` / DECISIONS (for example C27 load cells, C71 TLS, C72 floating parts, C73 busbar under the boom on +Z, C74 cabin from J526A3100, C75 cabin entrance on the elevator (-Z) side) is **not** changed silently: if a reference contradicts it, report it and ask.

## 3. Phase A: review (no edits yet)

1. Start the viewer: `node artifacts/prototypes/p02-ui/serve.mjs 5312`, open `http://127.0.0.1:5312/#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&motion=off`. For bare aligned renders also start `node artifacts/prototypes/p03-qc-model/serve.mjs` (port 5313) and use `capture.html?view=side|end-ws|end-ls|top&cx=..&cy=..&w=..&h=..`; alignment frames are in `tools/p03/alignment.json`.
2. Capture the current model into `tmp/qc-review-before/`: aligned side, both ends and top views matched to the J526A00 crops, plus perspective views matched to each photo's camera angle (`node tools/p03/capture.mjs --u1 --shots-dir tmp/qc-review-before`, extra angles via the `tools/u1/capture_*.mjs` scripts as patterns).
3. Compare each capture against its drawing view or photo, area by area: overall silhouette and main elevations; legs, portal, sills and gantry; boom, girder, forestays, backstays, A-frame and apex; machinery house (size, position, roof, doors, sign); trolley, headblock, spreader; reeving and ropes; cabin and its access; elevator, stairs, platforms, walkways, handrails; catenary, busbar, cable reel; back-reach / TLS; lights, decals, colours.
4. Also check the provenance table: every `estimated` or `approximate-location` value that a drawing now resolves, and every landmark in provenance section 2 that misses its source value.
5. Produce a discrepancy table in `docs/evidence/U1/qc-reference-review/REPORT.md`:

| # | Area / node key | Model now | Reference says (sheet + view, or photo + feature) | Evidence image | Severity (major silhouette / dimensional / detail / cosmetic) | Confidence | Proposed fix |

Put the side-by-side comparison images in `docs/evidence/U1/qc-reference-review/comparison/` (pattern: `tools/p03/compose_comparisons.py`, `tools/u1/compose_u1r3.py`).

**Stop after Phase A and show me the table.** Separate the items into (a) high-confidence, drawing-backed fixes, (b) photo-only or ambiguous items needing my answer, (c) items that conflict with a previous user-confirmed decision. Ask your questions in one batch. Do not start Phase B until I answer.

## 4. Phase B: adjust (after my approval)

Label this change the next free U1-C number in `docs/DECISIONS.md` (expected U1-C76).

1. Save the current output first: copy `artifacts/models/cict-j526a-sts-scene/1/` to `tmp/qc-review-before-model/`.
2. Edit **source only**: `assets/models/source/cict-j526a-sts/params.json` (dimensions, with kind, source sheet and note for every changed value), `build.mjs`, `cabin.mjs`, `backreach.mjs`, `fitted-components.mjs`, `reference-components.mjs`. Never hand-edit `scene.glb`, `manifest.json`, `provenance.md`, `landmarks.json` or `checksums.json`.
3. Identity rules (from the source README): one maintenance position = one node named by its semantic key with `extras.nodeKey`; **never rename, remove or re-meaning an existing key**; instanced positions only through `instanceMaps`; `container.*` nodes are spatial groups only. A new part gets a new key.
4. Budgets: triangles <= 150 000, asset <= 8 MiB, draw calls <= 230. Revision 13 already uses **230 of 230 draw calls**, so any added geometry must be merged into an existing mesh/material or instanced carrier, or offset by a merge elsewhere. Do not raise a budget yourself; ask.
5. Spreader stays estimated (U-27: STS45 drawing not yet supplied). Electrical cabinet identities stay approximate (U-11) unless a drawing now makes them legible.
6. Regenerate and validate from the repo root:
   ```powershell
   node tools/model-generator/generate.mjs
   node tools/model-generator/validate.mjs
   node tools/p03/check_bindings.mjs
   node tools/u1/model_diff.mjs --out docs/evidence/U1/qc-reference-review/model-revision-diff.json
   ```
   The diff must show no removed or re-meaning keys.
7. Regression checks (P02 server on 5312, P03 server on 5313): `node tools/u1/check_cabin_c75.mjs`, `check_cabin_c74.mjs`, `check_busbar_c73.mjs`, `check_floating_c72.mjs`, `check_backreach_c71.mjs`, `node tools/p02b/check_unified_viewer.mjs`, `check_flat_isolation.mjs`, `check_u1_c34.mjs`, `node tools/p03/check_model_prototype.mjs --gpu hardware` (fall back to `swiftshader`), `node tools/p03/check_no_webgl.mjs`. Report every failure with its output; update a check only when the change was intended and say so.
8. Recapture the same views into `docs/evidence/U1/qc-reference-review/after/`, build before / after / reference comparisons, and **look at every image yourself** before calling an item fixed. Check also: no floating parts, no parts intersecting structure, labels and isolation still work, Flat mode still renders.

## 5. Records

Update, in the project's existing style: the REPORT (discrepancy table with a Status column: fixed / open / needs user / conflicts with decision), `docs/runs/Repair-U1-C76-<date>.md` (this request), `docs/DECISIONS.md` (new D-number for the change; close or update `U-xx` rows you resolved), `docs/HANDOVER.md`, `docs/IMPLEMENTATION_STATUS.md`, the revision line in `assets/models/source/cict-j526a-sts/README.md` and `artifacts/prototypes/p03-qc-model/README.md`, and the `revisionNote` source the generator reads (revision 14).

## 6. Hard boundaries

- `documents/` and `Drawings and manuals/` are read-only: never edit, move or delete them.
- **U1 remains NOT APPROVED.** Do not advance phases, do not mark U1 complete, do not start P04.
- No deployment, IIS, shared/production SQL, CMMS contact, package publishing or network downloads.
- Do not commit or push unless I ask.
- Keep scratch work (rasterized pages, crops, temporary captures) in `tmp/`.

## 7. Final answer

End with: how many discrepancies were found, fixed, left open and why; the new revision number; budget counters before/after (triangles, draw calls, bytes); check results with pass counts; and the questions still waiting on me.
