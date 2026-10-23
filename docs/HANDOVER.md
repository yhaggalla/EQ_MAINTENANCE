# Handover

Rolling handover for CICT EQ Maintenance. Each phase appends its record; the newest is first.

## 24 October 2026 - U1-C35 selected spare-part condition repair

**U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 is Not started.** Baseline `aaa84ad` on `main`. Active Codex agent; model/effort not independently recorded; no delegated or independent R review. Exact prompt: `docs/runs/Repair-U1-C35-20261024.md`.

Reproduced the user's Spreader frame case: the part was already registered with no condition. Its Add action opened an empty position picker because Add excludes registered positions. Registered cards now offer Update condition using the existing dialog; a selected registered part no longer offers Add. Unregistered selected parts still use Add and refresh into a registered card after saving. Legacy Add calls with an already registered position open its condition dialog. Existing role/data validation and prior-value history remain intact. No persistence or model change.

Source: `artifacts/prototypes/p02-ui/js/{panel-tabs,views-eqjobs}.js`; checks: `tools/p02b/check_u1_c35.mjs`. The focused browser flow covers immediate 3D/Flat updates, Original/replacement/amendment, invalid/cancel, new registration, isolation, area/Jobs consistency and read-only denial. Results, prior regressions and screenshots: `docs/evidence/U1/spare-panel-c35/REPORT.md`. The unrelated RTG handover edit is excluded. Next: continue U1 walkthrough/refinements; await explicit approval before P04.

## 24 October 2026 - U1-C34 viewer refinements

**U1 is IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED.** These adjustments extend the same checkpoint; P04 is Not started. Baseline `37ff115` on `main`; this record and the C34 implementation are committed together. Active Codex agent; no delegated phase or independent R verdict, model/effort not independently recorded. Exact request: `docs/runs/Repair-U1-C34-20261024.md`.

Fixed physical-area tabs: the old container branch always rendered the Technical parts list. All four tabs now render independently. Projects/Special and its badge use the area's included position targets/replacement lines, deduplicated and passed through the existing current-state projection; hidden work stays excluded. Spare parts and its badge use registered included positions. Maintenance remains equipment-level ZMMS daily work. Technical lists the area's parts; selecting one retains isolation. Areas are filters, not new maintenance/history owners. The heading now says Physical area.

The desktop toolbar is one compact row with an inline area selector, accessible zoom controls and unchanged touch-target sizes. It wraps on phones. Sea has static world-space wave detail and a quay coping strip, keeping the 5 m drop. Initial view remains Flat. Per the latest 3D reference, Reset now preserves the current camera mode: 3D restores the reference three-quarter angle/framing, Flat restores the full side elevation. Isolated areas/parts refit when dimensions change; tab rerenders at the same dimensions do not refit the camera. These Reset semantics supersede C33's forced-Flat rule (D-177).

Verification and visual review are recorded in `docs/evidence/U1/viewer-refinements-c34/REPORT.md`. Current browser checks use synthetic data and software WebGL; formal application acceptance remains NOT RUN. Source drawings, GLB/manifest and unrelated RTG work remain outside this change. Next: continue U1 walkthrough/refinements; await explicit U1 approval before P04. Deferred FAC restyling and open source issues are unchanged.

## 24 October 2026 - current U1 status and documentation review

**U1 is IN PROGRESS / CHANGES REQUESTED: NOT COMPLETE and NOT APPROVED.** All adjustments through U1-C33, including the fleet changes, shared 3D / Flat viewer, Flat default, framing, yard/sea context and area isolation, remain U1 work. Passing prototype checks and committed repairs do not close the checkpoint. Continue the U1 walkthrough and requested refinements; P04 remains Not started and requires explicit user approval recorded in `docs/DECISIONS.md`.

Current committed implementation: EQ Fleet refinements `86018c9`, slower Breakdown/Maintenance pulses (2.5 s / 3.5 s) `32081d0`, shared viewer `4a8b270`, Flat default and physical-area isolation `7d773fa`. These are U1 adjustments. Older entries below retain their run-time results and Git state; their "repair complete" wording does not complete U1. The newer C33 Reset and dropdown rules supersede C32's camera-preserving Reset and earlier controls.

This pass reconciled the checkpoint tables, decisions D-171..D-173, UX rules, prototype READMEs and a stale Reset code comment against the committed source and evidence. No runtime behavior changed. Prior C33 evidence records 18/18 focused checks and 11/11 shared-viewer regressions; those browser checks were not rerun for this documentation-only correction. Review details and validation: `docs/evidence/U1/document-review-20261024.md`. Exact request: `docs/runs/U1-document-review-20261024.md`.

Next: continue the U1 walkthrough and refinements. FAC Dashboard restyle still awaits the user's EQ review; source issues such as U-27 remain open. No independent R verdict, production acceptance or user approval is claimed. The unrelated `rtg-workbench/HANDOVER.md` edit is excluded.

---



## 24 October 2026 - U1-C33: default Flat and area isolation

User request: default Flat; fill the available viewport on default/reset; extend yard/sea with sea 5 m below rail; replace physical-assembly buttons with a dropdown that isolates the chosen area and all included parts.

Implemented: Flat is the default and Reset returns to the full Flat crane. Full-crane camera framing uses crane bounds (excluding scenery) with 8% margin, adapts to viewport aspect and refits on resize. The Isolate area dropdown replaces both the machinery-house-only control and bottom chips; all 11 manifest containers open in Technical mode, fitted with their descendant parts. Part selection retains isolation; selecting an unrelated mechanism exits it. Whole crane exits isolation; Reset also restores labels and clears selection. The environment is hidden during isolation.

The extended yard and sea are decorative viewer context, outside maintenance identity and camera bounds. Rail/yard level is y=0; sea surface is y=-5 m per the user. The quay edge remains at x=5.3 m as in the existing drawing context; horizontal extents are illustrative. Crane GLB, manifest and original source authorities are unchanged.

Checks: `node tools/p02b/check_flat_isolation.mjs` (18 assertions: default, framing, levels, 11 areas, part selection, reset, phone width, no browser errors). Shared-viewer regression: 11/11 after replacing the old isolate-button test with the dropdown and applying the new Reset rule. Desktop and isolated-area screenshots inspected. Evidence: `docs/evidence/U1/flat-isolation/`. Local synthetic prototype only; U1 approval remains pending, no production acceptance or deployment.


## Repair-U1 round 9 (U1-C32: shared 3D / Flat viewer) - 23 October 2026

User explicitly requested review of completed work through `32081d0`, one shared viewer, recheck and commit. Executed by the active Codex agent; model/effort not independently exposed. D-168..D-170, UX_SPEC s26, exact request in `docs/runs/Repair-U1-C32-20261023.md`.

The equipment page owns the reviewed revision-6 crane model and one renderer. 3D enables perspective orbit; Flat locks a side orthographic camera with pan/zoom. The existing tree, stable selection IDs and four panels are shared. Old P03 links redirect by semantic key. All 144 model positions are reachable; existing record IDs stay intact. Source drawings and model geometry were not changed.

Verification: shared-viewer suite 11/11; P02B 63 unique checks with K01 corrected/rerun (80 layout combinations); round-8 9 unique checks with the intentionally replaced equipment comparison moved to the new suite; model validation 26/26, bindings 11/11; normal-port redirect and all-position audit clean. Initial obsolete-assertion failures are retained and explained in **`docs/evidence/U1/unified-viewer/REPORT.md`**. Local synthetic prototype only; no production acceptance or independent R review claimed.

Open `http://127.0.0.1:5312/#/eq/equipment/eq-qc-demo-01`. Next: repeat U1 user walkthrough; no U1 approval recorded and no P04 work started. The existing RTG handover edit is unrelated and excluded from this commit.

---

## Repair-U1 round 8 (U1-C28..U1-C31, EQ Fleet dashboard) - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Repair inheriting P02B: Codex gpt-6.1-sol/high or Claude Code claude-opus-5-5/high |
| Client | Claude Code subagent eq-build-opus-high; exact prompt `docs/runs/Repair-U1r8-20261023-1832.md` (orchestrator-owned) |
| Model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. The orchestrator reported a usage-limit interruption; the on-disk work was checked and completed |

### Outcome

Repair complete for U1-C28..U1-C31 on the **EQ Fleet dashboard only**; the FAC Dashboard restyle waits for the user's review of the EQ result. U1 was not repeated or approved by this run. Full report: `docs/evidence/U1/repair-r8-20261023.md`. Requirement IDs: U1-C28..C31 (with U1-C02), S02, S03, OPS01, OPS02, VIS06, VIS10, FDB03/FDB05 (TV pattern).

- U1-C28: TV mode `#/eq/fleet?tv=1` for every role that can see EQ Fleet: no top bar, large type, read-only (cards not links; only Pause and Exit TV mode), Esc exits, same 60 s poll, filters in the address kept, measured paging (10 s) when the fleet does not fit (D-163).
- U1-C29: in-house flat SVG illustrations of the QC (J526A proportions, CICT red), RTG and ES on cards, group headers and the KPI tile (D-164; ES colour U-37).
- U1-C30: Breakdown cards blink rose (1.2 s) and Maintenance cards amber (2.4 s), solid / dashed stripe, badge text kept, no layout movement; Pause blinking, reduced motion and `motion=off` give a steady highlight; also in TV (D-165).
- U1-C31: flat pastel restyle with a KPI tile row, scoped to EQ Fleet through new `--pa-*`/`--blink-*` tokens; FAC and the other screens computed-style identical to the committed prototype (D-166).

### Files changed

Prototype: `artifacts/prototypes/p02-ui/{index.html,README.md}`, `artifacts/prototypes/p02-ui/js/{app.js,views-fleet.js}`, new `artifacts/prototypes/p02-ui/js/fleet-art.js`, new `artifacts/prototypes/p02-ui/css/eq-fleet.css`. Tests: new `tools/p02b/check_u1_r8.mjs`, new `tools/u1/capture_u1r8.mjs`, `tools/p02/check_prototype.mjs` (U1-C01 assertion moved, D-167), `tools/p02b/check_contrast_v2.py` (+31 pairs). Records: `docs/{DECISIONS,UX_SPEC,IMPLEMENTATION_STATUS,HANDOVER}.md`. Evidence: `docs/evidence/U1/repair-r8-20261023.md`, `docs/evidence/U1/repair-r8/` (check and regression JSON, before-run JSON, contrast output, 17 screenshots, capture index).

### Checks run and actual results

| Check | Result |
| --- | --- |
| `tools/p02b/check_u1_r8.mjs` (with `--head` committed copy on :5322) | 9/9 PASS (before, against the committed prototype: 0/8) |
| `tools/p02/check_prototype.mjs` | 59/59 PASS (one earlier run 58/59: view-reset timing read in U1R2-C10-C11, passed on rerun and on the final run) |
| `tools/p02b/check_p02b.mjs`; `check_u1_r5.mjs`; `check_u1_r6.mjs`; `check_p03_panel.mjs`; `check_r02b_round2.mjs` | 63/63; 11/11; 9/9; 8/8; 10/10 PASS |
| `tools/p02b/check_contrast_v2.py` | 53/53 pairs pass |
| `smoke.mjs`, `node --check` | clean |
| Screenshots `tools/u1/capture_u1r8.mjs` (inspected) | `r8-01..r8-12` in `docs/evidence/U1/repair-r8/` |

Prototype evidence only: synthetic in-memory data, simulated persona, no authentication, database, live ZMMS, target environment or production. Formal acceptance remains NOT RUN.

### Open issues and impact

- U-37: CICT ES paint colour not in the sources (generic yellow). Visual only.
- FAC Dashboard restyle pending the user's EQ review (by instruction). TV ordering of Breakdown/Maintenance first is a review question.
- Carried over: U-27; `tools/p03/check_no_webgl.mjs` stale assertion (P10).

### Git and boundaries

Branch `main`, HEAD `fa90fd7`; repair uncommitted for the orchestrator. `rtg-workbench/` and `RTG drawings/` were not edited; the pre-existing `rtg-workbench/HANDOVER.md` modification was left alone. No `documents/`, Portal, deployment, SQL or ZMMS contact. Every tool output was written to `docs/evidence/U1/repair-r8/` with explicit output paths; no other committed evidence file was overwritten. Servers on 5312/5313 were running from disk for every run; a scratchpad HEAD copy on 5322 was used only for the before-run and the FAC comparison.

### Next prompt

**U1 user checkpoint, repeated**: review of the EQ Fleet round 8 result (screenshots `docs/evidence/U1/repair-r8/`); on approval of the EQ look, a further round restyles the FAC Dashboard the same way. The user's decision is recorded in DECISIONS s4 before P04.

---

## Repair-U1 round 7 (U1-C27) - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Repair inheriting P03/P02: Codex gpt-6.1-sol/high or Claude Code claude-opus-5-5/high |
| Client | Claude Code subagent eq-build-opus-high; exact prompt `docs/runs/Repair-U1r7-20261023-1650.md` (orchestrator-owned) |
| Model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None |

### Outcome

Repair complete for U1-C27 (closes U-36). U1 was not repeated or approved by this run. Full report: `docs/evidence/U1/repair-r7-20261023.md`. Requirement IDs: U1-C27 (with U1-C25, U1-C08), VIS01-VIS03, VIS09, S04.

- 3D model draft v1 revision 6 (in place, no binding active): the 013 load cells are in-line on the horizontal cross-over of the main hoist ropes at the very end of the boom (point 0.3 m inboard of the boom end, previously about 2.6 m), two per rope side, one junction box and signal cable per side; technical mode, "Location approximate" (D-161). Key, kind, classification, parent and binding unchanged; `hoist.rope.set.main` geometry unchanged; `loadCellInlineFromTip` replaced by the estimated `loadCellCrossoverZ`.
- Flat view: the horizontal hoist rope line ends in the load cell at the boom end, with junction box and cable; label "Load cell (in the horizontal hoist rope at the boom tip end, approx.)".
- Checks: only R6-04/R6-05 of `check_u1_r6.mjs` moved to the new position rule (D-162). U1-C01..C26 unchanged.

### Files changed

`assets/models/source/cict-j526a-sts/{build.mjs,params.json,README.md}`; regenerated `artifacts/models/cict-j526a-sts-scene/1/{scene.glb,manifest.json,checksums.json,provenance.md}`; `artifacts/prototypes/p02-ui/js/preview.js`; `tools/p02b/check_u1_r6.mjs`; new `tools/u1/capture_u1r7.mjs`; `docs/DECISIONS.md` (D-161, D-162, round 7 supersession, U-36 closed, U1 row), `docs/UX_SPEC.md` (s24), `docs/IMPLEMENTATION_STATUS.md`, this handover; evidence `docs/evidence/U1/repair-r7-20261023.md` and `docs/evidence/U1/repair-r7/`.

### Checks run and actual results

| Check | Result |
| --- | --- |
| R6-04/R6-05 (new rule) before the change | 0/2 PASS (reproduction, `repair-r7/u1-r7-before.json`) |
| `tools/p02b/check_u1_r6.mjs` | 9/9 PASS |
| Model: generate, determinism, `validate.mjs`, `check_bindings.mjs`, `model_diff.mjs` | revision 6, draw calls 196/200, GLB identical on regeneration; all PASS (validated); 11/11; 0 added / 0 removed / 1 changed / 0 identity changes |
| `tools/p03/check_model_prototype.mjs --gpu swiftshader`; `tools/p02b/check_p03_panel.mjs` | 41/41; 8/8 PASS |
| `tools/p02/check_prototype.mjs`; `tools/p02b/check_u1_r5.mjs`; `tools/p02b/check_p02b.mjs` | 59/59; 11/11; 63/63 PASS |
| `node --check`, `git diff --check` (excluding `rtg-workbench/`) | clean |
| Close-ups `tools/u1/capture_u1r7.mjs` (inspected) | 3D boom-tip end (3), 3D page with 013 selected, flat view close-up and overview; one favicon 404 on the first capture page load |

Prototype and model evidence only: synthetic in-memory data, simulated persona, no authentication, database, live ZMMS, target environment or production. Formal acceptance remains NOT RUN.

### Open issues and impact

- The exact load-cell point and hardware are not on the supplied sheets; the cells stay "Location approximate" (estimate `loadCellCrossoverZ`). Visual only.
- U-27 stays open (STS45 spreader drawing to be supplied by the user).
- Carried over: `tools/p03/check_no_webgl.mjs` stale assertion (P10); prototype gaps listed in round 6.

### Git and boundaries

Branch `main`, HEAD `5580b10`; repair uncommitted for the orchestrator. `rtg-workbench/` and `RTG drawings/` were not edited or included; the pre-existing `rtg-workbench/HANDOVER.md` modification was left alone. No `documents/`, Portal, deployment, SQL or ZMMS contact. All tool outputs went to `docs/evidence/U1/repair-r7/`; no other committed evidence file was overwritten. Prototype servers on 5312/5313 were running (from disk) for every browser check and capture.

### Next prompt

**U1 user checkpoint, repeated**: walkthrough of the round 7 load-cell position (boom tip end, flat and 3D) with the earlier U1 items. The user's decision is recorded in DECISIONS s4 before P04.

---

## Repair-U1 round 6 (U1-C23..U1-C26) - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Repair inheriting P01B/P02B/P03: Codex gpt-6.1-sol/high or Claude Code claude-opus-5-5/high |
| Client | Claude Code subagent eq-build-opus-high; exact prompt `docs/runs/Repair-U1r6-20261023-1453.md` (orchestrator-owned) |
| Model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. The run stopped once at an API usage limit and was resumed by the orchestrator; the on-disk work was checked and completed |

### Outcome

Repair complete for U1-C23, U1-C24, U1-C25 and U1-C26. U1 was not repeated or approved by this run. Full report: `docs/evidence/U1/repair-r6-20261023.md`.

- U1-C23: the crane-view Projects/Special tab (flat and 3D) lists open and completed special jobs of the selection, newest first; cancelled jobs are counted only; `CurrentSpecialJob` adds only `completedOn` and `listedOn` (D-155).
- U1-C24: FAC Dashboard lanes list every active, shown job; done-not-due jobs are the last group "Done, up to date" with their next due date (D-156).
- U1-C25: the 013 load cell is drawn in-line in the horizontal main hoist ropes at the boom tip, in the model (draft v1 revision 5, keys, kinds and classification unchanged) and in the flat view; the rope-end anchors stay with the boom-tip sheaves (D-157). Reading question U-36.
- U1-C26: a shared "Show on dashboard / 3D" switch per special job (`eq.work`: Admin, EQ Team) and "Show on dashboard" per FAC job (`fac.work`: Admin, FAC Team), audited; hidden jobs leave the FAC Dashboard, the crane view and fleet counts and stay in Jobs, history and exports (D-158, D-159). Default shown (orchestrator default).
- U1-C01..C22 and the R02B repairs are unchanged; regression checks below.

### Files changed

Prototype: `artifacts/prototypes/p02-ui/js/{access,fac,fixtures,panel-tabs,preview,store,views-eqjobs,views-equipment,views-fac,views-facjobs,views-fleet,views-jobs}.js`, `artifacts/prototypes/p02-ui/README.md`. Model: `assets/models/source/cict-j526a-sts/{build.mjs,params.json,README.md}`; regenerated `artifacts/models/cict-j526a-sts-scene/1/{scene.glb,manifest.json,provenance.md,landmarks.json,checksums.json}`. Contracts/records: `docs/{DATA_CONTRACT,API_CONTRACT,UX_SPEC,ARCHITECTURE,DECISIONS,IMPLEMENTATION_STATUS,HANDOVER}.md`. Tests: new `tools/p02b/check_u1_r6.mjs`; adapted `tools/p02b/check_p02b.mjs` (B05, C02, C03), `tools/p02b/check_r02b_round2.mjs`, `tools/p02b/check_p03_panel.mjs` (P3-07) (D-160). Evidence: `docs/evidence/U1/repair-r6-20261023.md`, `docs/evidence/U1/repair-r6/` (check JSON, before-run JSON, regression JSON, model validation, binding and diff reports, contract coverage, 9 screenshots).

### Checks run and actual results

| Check | Result |
| --- | --- |
| `tools/p02b/check_u1_r6.mjs` | 9/9 PASS (before, against a HEAD copy: 0/9) |
| `tools/p02b/check_p02b.mjs` full suite | 63/63 PASS after B05/C02/C03 were moved to the U1-C23 rule (first run 60/63) |
| `tools/p02b/check_p03_panel.mjs` | 8/8 PASS (21 flat/3D comparisons; first run 7/8 on the old P3-07 wording) |
| `tools/p02b/check_u1_r5.mjs`; `tools/p02b/check_r02b_round2.mjs`; `tools/p02/check_prototype.mjs` | 11/11, 10/10, 59/59 PASS |
| Model: generate, determinism, `validate.mjs`, `check_bindings.mjs`, `model_diff.mjs` | revision 5, draw calls 196/200, GLB identical on regeneration; 26/26; 11/11; 0 added / 0 removed / 2 changed / 0 identity changes |
| `tools/p03/check_model_prototype.mjs --gpu swiftshader` | 41/41 PASS |
| `tools/p03/check_no_webgl.mjs` | pass false: fallback and tree work, but its P03-era text assertion expects "04" in the info panel, which opens on Maintenance since P02B; viewer code unchanged by this repair |
| Contract coverage V1 / V2 | 9/9, 15/15 PASS |
| `smoke.mjs`, `node --check`, `git diff --check` (excluding `rtg-workbench/`) | clean |

Prototype and contract evidence only: synthetic in-memory data, simulated persona, no authentication, database, live ZMMS, target environment or production. Formal acceptance remains NOT RUN.

### Open issues and impact

- U-36: reading of "boom tip horizontal cable" (along-boom horizontal hoist ropes, built; or the equalising cross-over rope). Visual only; user at the U1 repeat.
- U-27 stays open (STS45 spreader drawing to be supplied by the user).
- Prototype gaps: no `display` list filters; FAC switch without a version check; the 3D page does not see switches set in the P02 page (separate in-memory pages).
- `tools/p03/check_no_webgl.mjs` needs its assertion updated in P10.

### Git and boundaries

Branch `main`, HEAD `6d4b64d`; repair uncommitted for the orchestrator. `rtg-workbench/` and `RTG drawings/` were not read, edited or included; the pre-existing `rtg-workbench/HANDOVER.md` modification was left alone. No `documents/`, Portal, deployment, SQL or ZMMS contact. `check_bindings.mjs` overwrote `docs/evidence/P03/binding-validation.json` by default; the file was restored from git and the result kept in `repair-r6/`. Servers on 5312/5313 were started from disk (twice, after the usage-limit stop); a HEAD copy served on 5322/5323 from the scratchpad was used only for the before-run.

### Next prompt

**U1 user checkpoint, repeated**: walkthrough of round 6 (completed jobs in Projects/Special, Up to date FAC rows, load cell position with U-36, Show on dashboard / 3D switches) with the earlier U1 items. The user's decision is recorded in DECISIONS s4 before P04.

---

## Repair-U1 round 5 (U1-C20..U1-C22) - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Repair inheriting P01B/P02B: Codex gpt-6.1-sol/high or Claude Code claude-opus-5-5/high |
| Client | Claude Code subagent eq-build-opus-high; exact prompt `docs/runs/Repair-U1r5-20261023-1028.md` (orchestrator-owned) |
| Model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. Resume of a first run that stopped at an API usage limit; its uncommitted partial work was inspected, kept and completed. U1-C22 was added by the user after that run |

### Outcome

Repair complete for U1-C20, U1-C21 and U1-C22. U1 was not repeated or approved by this run. Full report: `docs/evidence/U1/repair-r5-20261023.md`.

- U1-C20: EQ Jobs has four tabs: Special/Projects, Daily work (CMMS), EQ status, Spare parts condition (D-147). Crane-view Maintenance "Open in Jobs" opens Daily work (CMMS).
- U1-C21: "Add special job" everywhere, including the crane view for the whole equipment (D-148). EQ Team and Admin add spare parts with their first condition from Spare parts condition and the crane-view Spare parts tab (`eq.work`, D-149). This changes SOW V2 s4.6 / APPROVED_REQUIREMENTS, recorded as a supersession in DECISIONS; DATA s16, API s4.18 (`POST /equipment/{equipmentId}/spare-parts`) and the Access matrix wording follow. `documents/` was not edited.
- U1-C22: Admin add/adjust in Mechanism catalogue, Main-part positions, Specifications and Spare parts, audited with previous values kept (D-150..D-153). Codes never change. `10` is never created, `061` Spreader / `062` Headblock names are fixed and `048`/`063` stay reserved. Positions are added as drafts, and their key and parent freeze on confirmation. Drawing observations are never edited. A retired spare-part type is not offered for new parts.
- The R02B repairs (hidden-tab gating, current-state DTO, ZMMS sample consistency, FAC KPI) and U1-C01..C19 are unchanged; regression checks below.

### Files changed

Prototype: `artifacts/prototypes/p02-ui/js/{access,dialogs,panel-tabs,spares,store,views-admin,views-admin2,views-eqjobs,views-equipment}.js`, `artifacts/prototypes/p02-ui/README.md`. Contracts/records: `docs/{DATA_CONTRACT,API_CONTRACT,UX_SPEC,ARCHITECTURE,DECISIONS,IMPLEMENTATION_STATUS,HANDOVER}.md`. Tests: new `tools/p02b/check_u1_r5.mjs`; `tools/p02b/check_p02b.mjs` (E01 adapted to the four tabs); `tools/p02/check_prototype.mjs` (C12 label list extended). Evidence: `docs/evidence/U1/repair-r5-20261023.md`, `docs/evidence/U1/repair-r5/` (check JSON, regression JSON, contract coverage JSON, 8 screenshots, the first run's `u1-r5-before.json`).

### Checks run and actual results

| Check | Result |
| --- | --- |
| `tools/p02b/check_u1_r5.mjs` | 11/11 PASS |
| `tools/p02b/check_p02b.mjs` full suite | 63/63 PASS after E01 was adapted. The first full run was 62/63, with E01 failing on the superseded one-page layout |
| `tools/p02b/check_p03_panel.mjs` | 8/8 PASS (21 flat/3D comparisons) |
| `tools/p02b/check_r02b_round2.mjs` | 10/10 PASS |
| `tools/p02b/smoke.mjs` | completed without error output |
| Contract coverage V1 / V2 | 9/9, 15/15 PASS |
| `node --check` (changed JS), `git diff --check` (excluding `rtg-workbench/`) | clean |

All of this is prototype and contract evidence only: synthetic in-memory data, a simulated persona and no authentication, database, live ZMMS, target environment or production. Formal acceptance remains NOT RUN. Not rerun: the old P02 suite (pre-P02B routes), contrast (no CSS change) and the P03 model checks (model unchanged).

### Open issues and impact

- U-35 (DECISIONS s3): should every delivered mechanism name be locked? As built, only `061`/`062` are locked and other names can be renamed with audit, with the source label kept. The user decides at the U1 repeat; this does not block anything.
- Template-level position editing is in the contract (API s4.13) but not in the prototype.
- The P03 3D page does not show in-memory Admin specification edits made in the P02 page. In production both views read API s4.16.

### Git and boundaries

Branch `main`, HEAD `faf40d0`; repair uncommitted for the orchestrator. `rtg-workbench/` and `RTG drawings/` were not read, edited or included; the pre-existing `rtg-workbench/HANDOVER.md` modification is someone else's work and was left alone. No `documents/`, Portal, deployment, SQL or ZMMS contact. The prototype servers on 5312/5313 were down at the start and were started from disk with `serve.mjs`.

### Next prompt

**U1 user checkpoint, repeated**: a walkthrough of round 5 (four EQ Jobs tabs, Add special job / Add spare part, Admin add/adjust) together with the earlier U1 items. The user's decision is recorded in DECISIONS s4 before P04.

---

## R02B independent PASS after round-2 repair - 23 October 2026

### Runtime and outcome

Recommended profile: Codex gpt-6-astra/high or Claude Code claude-opus-5-5/high. Actual client: Codex orchestrator with fresh-context `eq-review-opus-high`; high configured effort, actual runtime model identity not independently exposed. No fallback/escalation. Exact prompt: `docs/runs/R02B-20261023-0950.md`.

**VERDICT: PASS**, reviewed `main` at `0da3bd53ec3fd748b4792e32b4b294873817b855`. Full unchanged report: `docs/evidence/R02B/review-20261023-0957.md`; durable sanitised outputs and inspected screenshots: `docs/evidence/R02B/review-20261023-0957/`. Both previous findings are resolved. Independent browser probes confirm hidden reopened-job history is withheld across equipment/main/sub/part scopes while source history remains intact, and FAC on-time arithmetic reconciles for five filtered populations. No new proven defect or blocking question.

### Fresh verification and limits

Fresh V1/V2 contract coverage 9/9 + 15/15; round-2 VM probes 10/10; affected browser B05/H01/H12 3/3; boundary browser checks B02/B04/F01-F05/G01/G03/H06/H08/H09 12/12; shared-panel checks 8/8 including 21 flat/3D comparisons. Independent browser checks and two visually inspected filtered dashboard screenshots also pass. Existing `tools/p01/check_contract_coverage.py`, `tools/p01b/check_contract_coverage_v2.py`, `tools/p02b/check_r02b_round2.mjs`, `tools/p02b/check_p02b.mjs --only=<affected or boundary IDs>` and `tools/p02b/check_p03_panel.mjs` were used; JSON outputs record the selected checks. The initial independent arithmetic probe had incorrect expected Civil counts; its recorded correction and reference-derived 35/6 counts are preserved together with the initial artifact.

Full P02/P02B/P03 model-browser suites were not rerun. Unchanged model/generator/viewer-core and U1 drill-down/reset/folding evidence remain prior evidence; fresh panel checks cover the affected surfaces. This is local synthetic prototype/contract evidence, not real authentication, database, live ZMMS, hardware, target-environment or production acceptance. Formal application acceptance remains NOT RUN. Acceptance IDs evaluated are listed in full in the report (access, ZMMS, spare parts, FAC/dashboard, history/jobs, viewer/layout and U1 changes).

### Records, boundaries and next step

Orchestrator changes only: this handover, status ledger, exact prompt, full review report, evidence README and ten allowlisted reviewer artifacts. No implementation, source-authority, Portal, RTG/model or production edits. Pre-existing RTG handover edit remains unstaged with its baseline SHA-256 unchanged. Review records are committed separately after recording; reviewed baseline remains `0da3bd5`. Existing localhost fixture listeners on 5312/5313 were reused.

**Next: U1 user checkpoint** for the combined EQ/FAC prototype and QC model. No U1 approval was given, `docs/DECISIONS.md` is unchanged, and P04 was not started. U-31 (open-only Projects/Special with completed/cancelled counts), U-33 (ZMMS spreader-code mapping) and P07B live discovery questions retain their documented impact; no new decision blocks U1.

---

## Repair-R02B round 2 - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended inherited profile | R02B: Codex gpt-6-astra/high or Claude Code claude-opus-5-5/high |
| Client | Codex subagent eq-build-opus-high; exact prompt `docs/runs/Repair-R02B-20261023-0938.md` (orchestrator-owned) |
| Agent-definition model / effort | Codex-opus-5-5; high (per agent definition). Actual execution model identity was not independently exposed; the configured name is not runtime proof |
| Fallback / escalation | None |

### Outcome and changes

Repair complete for both findings of `docs/evidence/R02B/review-20261023-0933.md`. R02B was not repeated or passed by this run; U1 remains pending. Full reproduction, acceptance matrix and exact changed-file list: `docs/evidence/R02B/repair-round2-20261023/REPAIR_REPORT.md`.

1. Finding 1: `currentSpecial` now projects detached allowlisted current-state job fields and matching position IDs only. Reopened jobs keep their previous completion/events/corrections in the stored record. The shared crane card displays position names rather than historical replacement details. API/DATA define a separate `CurrentSpecialJob` DTO, not `JobSummary` or a full replacement line (D-145). B05 checks a reopened payload and history retention, alongside denied reads and hidden links.
2. Finding 2: the FAC on-time cycle population now uses the same discipline/type/mode/PIC predicates as the board. Electrical returns null, 0/0; Civil inspection returns 71%, 5/7. Existing rolling-date/state eligibility is preserved; KPI focus narrows rows only. API/DATA clarify this (D-146). H12 checks visible results and the VM independently checks numerator/denominator and nonempty mode/PIC combinations.

Requirement/acceptance support: ACC02, S19, S07, HIS06; FDB01, S27; U1-C08/U1-C19 panel parity. All formal application acceptance cases remain NOT RUN.

### Files changed

Prototype: `artifacts/prototypes/p02-ui/js/{store,panel-tabs,fac}.js`. Contracts/records: `docs/{API_CONTRACT,DATA_CONTRACT,DECISIONS,IMPLEMENTATION_STATUS,HANDOVER}.md`. Tests: `tools/p02b/check_p02b.mjs`, new `tools/p02b/check_r02b_round2.mjs`. Evidence: `docs/evidence/R02B/repair-round2-20261023/` (report, six JSON outputs and one inspected screenshot). The exact run prompt is separately maintained by the orchestrator.

### Fresh checks and actual results

| Check | Result |
| --- | --- |
| Focused VM reproduction before edits | Exit 1: 4 pass / 5 fail of 9; both reported defects reproduced |
| Final focused VM regression | Exit 0: 10/10 pass, including detached references, source-history retention, filter arithmetic and zero/nonempty populations |
| `check_p02b.mjs --only=B05,H01,H12` | Exit 0: 3/3 pass, Chrome 155.0.8059.85 |
| `check_p03_panel.mjs` | Exit 0: 8/8 pass, software WebGL; 21 flat/3D comparisons |
| V2 / V1 contract coverage | Exit 0: 15/15 and 9/9 pass |
| Electrical screenshot | Captured without console errors; inspected 18 active jobs and no on-time percentage |
| `git diff --check` | Exit 0; no whitespace errors, LF/CRLF notices only |
| Pre-existing RTG handover SHA-256 | Unchanged: `9F8235251E29FB03D67C615DCF8EC955A3FDF993AF1D19DF9516362CAA7F3226` |

Exact commands and outputs are in the repair report. Evidence is contract/source and synthetic prototype only. No real authentication, database, live ZMMS, target-environment or production verification. Full P02/P02B/P03 model-browser suites and model/binding checks were not rerun; their previous results remain prior evidence. Geometry, model assets, generator and viewer core are unchanged by this repair.

### Git, boundaries and open issues

Branch `main`, baseline HEAD `ff6b77c`; repair uncommitted for orchestrator review/commit. Preserved the pre-existing `rtg-workbench/HANDOVER.md` edit. No source-authority, Portal, RTG, other-app or production changes. Healthy existing fixture listeners on ports 5312/5313 reused; no new server started.

No repair blocker or new business question. U-31/U-33 and P07B discovery retain their existing scope/impact. Next prompt: **R02B V2 contracts and prototype review, repeated in a fresh independent context**, then U1 only after PASS. No later phase started.

---

## R02B independent repeat review - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6-astra / high; Claude Code claude-opus-5-5 / high |
| Actual client | Codex orchestrator delegating to fresh-context `eq-review-opus-high`; exact prompt `docs/runs/R02B-20261023-0909.md` |
| Actual model / effort | Not independently exposed by the reviewer runtime; selected agent definition configures high effort. The profile name is not proof of the runtime model |
| Fallback / escalation | None; same prescribed reviewer role |

### Outcome

**VERDICT: NEEDS FIXES.** Reviewed repair commit `e48b38d` on `main`. Full unchanged reviewer report: `docs/evidence/R02B/review-20261023-0933.md`. Durable sanitised outputs: `docs/evidence/R02B/review-20261023-0933/` (README maps original scratch paths). No implementation edits were made by this review.

1. High: `EQ.currentSpecial` returns the raw reopened job, including previous completion fields, events and corrections, while EQ Jobs is disabled. Project an allowlisted current-state summary and test its payload (ACC02, S19, S07, HIS06). Earlier finding 1 is incomplete.
2. Medium: FAC on-time KPI uses all jobs when the dashboard is filtered. Filter its eligible completion population and handle a zero denominator (FDB01, S27).

Previous findings 2-7 are resolved within the reviewed scope. All formal real-application acceptance cases remain NOT RUN. The next step is **repair R02B**, then a fresh R02B review. U1 approval and P04 have not been reached.

### Checks and evidence boundary

Fresh independent checks: V2 coverage 15/15, V1 9/9, model validator 26/26, bindings 11/11, contrast 22/22, P02B 63 unique passing checks across valid runs, stable P02 59/59, P03 four-tab panel 8/8. The initial listeners disappeared during testing: four affected P02B checks were rerun successfully after restart; P02 received a complete stable rerun. Interrupted-run failures are retained and labelled as environmental failures. The full 41-check P03 model browser suite was **not rerun**; earlier results are prior evidence. Model/generator/viewer-core diff from `e5a4eec` is empty, and the live QC overview rendered. No live ZMMS, authentication, database, deployment or production acceptance was performed.

Commands: phase prompt extracted with `powershell -NoProfile -ExecutionPolicy Bypass -File tools/extract-phase.ps1 -Phase R02B`; reviewer ran existing `tools/p01[b]/check_contract_coverage[_v2].py`, `tools/model-generator/validate.mjs`, `tools/p03/check_bindings.mjs`, `tools/p02b/check_contrast_v2.py`, `tools/p02b/check_p02b.mjs`, `tools/p02/check_prototype.mjs`, `tools/p02b/check_p03_panel.mjs`, with sanitised outputs in the evidence directory. Two independent unchanged-script probes reproduce the findings. Full evaluated requirement/acceptance IDs are in the report; U1-C01..C19 checks performed found no regressions.

### Records and Git

Changed by the orchestrator: this handover, `docs/IMPLEMENTATION_STATUS.md`, exact run prompt, full review report, evidence README and the nine reviewer-allowlisted JSON outputs. Branch `main`; reviewed HEAD `e48b38d`; review records committed separately after recording. `docs/DECISIONS.md` is unchanged because no new user decision was given. Original source authorities, Portal, runtime implementation and unrelated RTG work were preserved. Pre-existing `rtg-workbench/HANDOVER.md` edit remains unstaged, with its pre-review SHA-256 unchanged.

Reviewer's owned localhost fixture servers: P02 port 5312 (PID 3364, session 14498); P03 port 5313 (PID 10448, session 39276). These are time-specific process references, not deployment state; recheck availability before reuse.

Open business questions U-31/U-33 and P07B ZMMS discovery remain documented and do not block the repair. No new business information is needed for either finding.

---

## Repair-R02B Findings 1-7 of the R02B review - 23 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-opus-5-5, high, adaptive thinking (Repair profile; R02B/P01B profile inherited) |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt in `docs/runs/Repair-R02B-20261023-0600.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None |

### Outcome

Repair complete for findings 1-7 of `docs/evidence/R02B/review-20261023-0157.md` (blocking 1 plus 2-7, user instruction). Contracts and prototype only; synthetic data; no database, ZMMS, Portal or deployment action. R02B was not repeated by this run. Details, reproduction and proof: `docs/evidence/R02B/repair-20261023.md`.

### Finding IDs and changes

1. EQ Jobs data (`/jobs`, board counts, job record, attachments, EQ work evidence, position technical sheet) need `eq.jobs.view`; the crane view reads only `current-state/*` (open summaries + counts, `openInJobs` null without Jobs). FAC Jobs list and full cycles need `fac.jobs.view`; the job detail stays readable with the dashboard feature for active jobs only (dashboard row click, route `/fac/dashboard/jobs/{id}`). Prototype gates the same reads on the live matrix; checks B05, B06 (D-139, D-140).
2. Synthetic ZMMS fixtures rebuilt on a scheduled-run time model; automatic rows replayed per run with no reason and with causes; RTG-DEMO-06 keeps yesterday's cause; created times in the past; check L04 (D-142).
3. DATA s15.7 step 6: only an evaluation with a computed value is applied, else "awaiting today's ZMMS sync"; check F06 (D-141).
4. P02B evidence count corrected (10 adapted assertions); P02 C18 marked and strengthened; C27 asserts the selected part's record (D-144).
5. Stale "not committed / main-fpkbjt" records corrected to `e5a4eec` on `main`.
6. Dashboard: two-line ticker with full names, larger due-load labels, ticker/proof/due load on the first 1920 x 1080 screen (D-143, UX_SPEC s21).
7. FAC export = FAC Jobs only (dashboard Export button only with FAC Jobs); P03 viewer links open P02 as Management (P3-06).

Requirement/acceptance IDs touched (all still NOT RUN; prototype evidence only): ACC02, ACC03, FAC11, FAC12, AUTH03, ZM05, ZM06, HIS06, S07, S19, S21, S27, FDB02-FDB05.

### Files changed

Contracts/docs: `docs/API_CONTRACT.md`, `docs/DATA_CONTRACT.md`, `docs/ARCHITECTURE.md` (route table, D-96), `docs/DECISIONS.md` (D-96 text, D-139..D-144), `docs/UX_SPEC.md` (s21), `docs/evidence/P02B/P02B_EVIDENCE.md` (findings 4, 5), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md` (this entry; P02B entry corrected).
Prototype P02: `artifacts/prototypes/p02-ui/js/store.js`, `panel-tabs.js`, `views-equipment.js`, `views-jobs.js`, `views-eqjobs.js`, `zmms.js`, `fac.js`, `views-fac.js`, `views-facjobs.js`, `app.js`, `css/v2.css`. Prototype P03: `artifacts/prototypes/p03-qc-model/js/app.mjs`.
Checks: `tools/p02b/check_p02b.mjs` (+B05, B06, F06, L04), `tools/p02b/check_p03_panel.mjs` (P3-06), `tools/p02/check_prototype.mjs` (C18, C27).
New evidence: `docs/evidence/R02B/repair-20261023.md`, `docs/evidence/R02B/repair-20261023/` (check JSON, reproduction before/after, contrast, coverage, 6 screenshots).
Untouched: `documents/`, `As-bulit drawing/`, `RTG drawings/` and `rtg-workbench/` (another session's work, not read; its `HANDOVER.md` modification predates this run), the model and its generator, `F:\CODEX\CICT-ENG_MAIN_PAGE` (clean at `47f7bd9`).

### Checks run and results (after the last change unless noted)

| Check | Result |
| --- | --- |
| `node tools/p02b/check_p02b.mjs` | 63/63 PASS |
| `node tools/p02/check_prototype.mjs` | 59/59 PASS (one earlier run 58/59: U1R2-C10-C11 floating-point viewBox after Reset, untouched code; rerun passed) |
| `node tools/p02b/check_p03_panel.mjs` | 8/8 PASS (before the final dashboard-export tweak, which it does not exercise) |
| `node tools/p03/check_model_prototype.mjs --gpu swiftshader` | 41/41 PASS (same note) |
| `python -I tools/p02b/check_contrast_v2.py` | 22 pairs, 0 below threshold |
| `python -I tools/p01b/check_contract_coverage_v2.py` / `tools/p01/check_contract_coverage.py` | 15/15 / 9/9 |
| Reproduction probe on the unrepaired prototype vs the repaired one | findings 1 and 2 reproduced before, absent after (`repro-before-e5a4eec.json`, `repro-after-repair.json`) |

Evidence type: contract review and headless-browser checks of the synthetic prototype. No authenticated, target-environment or production verification.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-31, U-33, U-34, UX-4..UX-7 | Unchanged confirmation items | U1 repeat / P07B |
| ZMMS export file | R02B unresolved question (download within the read-only boundary; whether the committed export stays tracked) | Owner decision; not blocking |
| U1R2-C10-C11 | Floating-point viewBox comparison can flake | Add a tolerance in P10 |
| D-02 | .NET 10 SDK not installed | Blocks P04 only |

No genuinely missing business information blocks the repeat of R02B.

### Git

Branch `main`, HEAD `ce7fc4d`; all Repair-R02B changes are uncommitted (the orchestrator commits).

### Next prompt

**R02B V2 contracts and prototype review, repeated** (read-only, fresh context; Claude Code claude-opus-5-5, high). Start both servers (`node artifacts/prototypes/p02-ui/serve.mjs 5312`, `node artifacts/prototypes/p03-qc-model/serve.mjs 5313`). The U1 repeat follows a PASS.

---

## P02B V2 prototype - 22 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-sonnet-5-5, high, adaptive thinking |
| Actual client | Claude Code subagent eq-build-sonnet-high (delegated by the orchestrator; prompt in `docs/runs/P02B-20261022-2202.md`) |
| Actual model / effort | claude-sonnet-5-5; effort high (per agent definition) |
| Fallback / escalation | None. This run resumed a first P02B run on the user's Windows machine that stopped on a usage limit; its partial work (commit 5895126) was inspected, found sound and completed |

### Outcome

P02B complete at prototype level: the P02 prototype and the P03 viewer page now cover SOW V2 and the P01B contracts with **synthetic in-memory data only** (no persistence, no sign-in, no ZMMS contact). U1-C19 is built: the crane-view right panel has exactly four tabs (Maintenance, Projects/Special, Technical, Spare parts), no work history, in the flat view and in the 3D viewer, with the same data and text (21 views compared). Evidence level: headless-browser checks on the prototype and screenshots; no acceptance case was executed.

### Requirement IDs addressed (prototype support only)

S02, S03, S07, S08, S16, S18-S29 as UI/behaviour prototypes; supporting evidence for HIS02, HIS05, HIS06, ACC01-ACC05, ZM01-ZM03, ZM05-ZM07, SP01-SP04, FAC01-FAC11 (rules simulated), FDB01-FDB06 (not FDB05's 30 minutes), OPS02. All stay NOT RUN against the real app.

### Files changed (this run; committed afterwards by the orchestrator as `e5a4eec` on `main`)

Prototype P02: `artifacts/prototypes/p02-ui/css/v2.css`, `js/panel-tabs.js` (jobMini moved here, link base), `js/views-equipment.js`, `js/views-fleet.js`, `js/views-fac.js`, `js/views-admin2.js` (import row-by-row table, matrix checkbox fix), `js/zmms.js` (fixture consistency, header), `README.md`.
Prototype P03: `artifacts/prototypes/p03-qc-model/index.html`, `js/app.mjs` (four tabs, shared data layer), `js/data.mjs` (own jobs removed), `serve.mjs` (read-only `/p02/js/` whitelist), `css/p03.css`, new `css/p03-panel.css`, `README.md`.
Tools: `tools/p02/check_prototype.mjs` and `tools/p03/check_model_prototype.mjs` (adapted assertions, hardened waits); new `tools/p02b/check_p02b.mjs`, `check_p03_panel.mjs`, `capture.mjs`, `check_contrast_v2.py`.
Docs: `docs/UX_SPEC.md` (s13-s20), `docs/DECISIONS.md` (D-129..D-138, U-33, U-34), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`, `docs/evidence/P02B/` (report, JSON results, 48 screenshots). Kept from the first run (commit 5895126): `access.js`, `fac.js`, `fac-ref.js`, `spares.js`, `zmms.js`, `views-eqjobs.js`, `views-facjobs.js`, `app.js` routing and `tools/p02b/{build_fac_ref,dbg,shot,smoke}.mjs`.
Untouched: `documents/`, `As-bulit drawing/`, `RTG drawings/`, `rtg-workbench/` (another session's work, not read), the Portal repository (not available here).

### Checks run and results

| Check | Result |
| --- | --- |
| `node tools/p02b/check_p02b.mjs` | 59/59 PASS |
| `node tools/p02b/check_p03_panel.mjs` (SwiftShader) | 8/8 PASS |
| `node tools/p02/check_prototype.mjs` (regression, 10 adapted assertions; "5" corrected by Repair-R02B) | 59/59 PASS |
| `node tools/p03/check_model_prototype.mjs --gpu swiftshader` (regression) | 41/41 PASS in the final run; two earlier runs after the viewer change failed 3 and 2 timing-sensitive checks (fixed 200 ms waits; the waits now follow the rendered frame); the baseline passed once |
| Contrast: P02 37 pairs; V2 22 token pairs | all at or above threshold |
| Screenshots | 48, no console errors |

Not run or not possible here: real GPU WebGL, a screen reader, a phone camera, .xlsx export (CSV stand-in), 30-minute TV-mode memory run, anything against the real Portal, database or ZMMS.

### What is synthetic

Everything except the mechanism catalogue, the source parameters and the FAC job list (114 jobs and issues from the reference JSON). Synthetic: all equipment and codes, positions, special jobs, users, ZMMS daily jobs, runs and mappings (shaped like the real export, values invented), spare-part register, commissioning dates, FAC progress, holds, photos, updates, PIC links, Admin-entered due dates and the Access-matrix changes.

### The user's ZMMS export (D-134, U-34)

`documents/Daily All Running Jobs_CMMS-LK-2026-10-22.xls` (read only, structure only): 24 named columns plus a blank action column, 48 rows, one job date; job types CM, PM, Defect, BreakDown, WireRope; statuses Initialized, Added To Daily, Re-Added to Daily, Hold, Completed; priorities Low, Medium, High; equipment codes of two letters and three digits (QC, RT, ES, SQ spreaders, SF, SK, WS, RS). The synthetic fixtures use that layout with invented codes, descriptions and numbers. This is file-level evidence; P07B confirms against the live page. The job-type to Breakdown/Maintenance mapping stays an Admin choice (Q11); the mapping shown in Admin is an illustration.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-31 | Projects/Special lists open jobs only (counts for the rest) | Confirm at the U1 repeat |
| U-33 | Spreaders (SQ codes) are separate equipment in ZMMS but part 061 of a crane here | Left in the unmatched queue in the prototype; Admin or user decides |
| U-34 | The export answers only part of U-29; login, paging, date selection, empty-day marker, rate limits stay for P07B | Parser stays provisional |
| UX-4..UX-7 | Maintenance list is equipment-level; completed jobs not listed; spreader codes; dashboard lists exclude jobs completed and not yet due | For R02B and the U1 repeat |
| P03 flaky waits | Software WebGL frame time varies 100-350 ms | Harden or use a GPU run in P10 |
| D-02 | .NET 10 SDK not installed | Blocks P04 only |

No missing business information blocks R02B.

### Git

Repository `/home/user/EQ_MAINTENANCE` (F:\CODEX\EQ_MAINTENANCE). The run worked on branch `main-fpkbjt` from base 5895126; the orchestrator committed the result on `main` as `e5a4eec` (record corrected by Repair-R02B, finding 5).

### Next prompt

**R02B V2 contracts and prototype review** (read-only, Claude Code claude-opus-5-5 high). Then the U1 repeat (user checkpoint, round 4 and the V2 prototype).

---

## P01B V2 contracts addendum - 22 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6-astra, high; Claude Code claude-opus-5-5, high, adaptive thinking |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt in `docs/runs/P01B-20261022-2120.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None |

### Outcome

P01B complete: the P01 contracts are extended for SOW V2 revision 4 (requirements v2.0, S01-S29). Contract documents only; no application, prototype or Portal implementation was edited, no database or external system (ZMMS included) was contacted. Every P01/R01 rule not listed in `docs/DECISIONS.md` "P01B supersessions" still holds. The orchestrator note U1-C19 is built into the crane-view current-state contract (exactly four tabs: Maintenance, Projects/Special, Technical, Spare parts; DATA s18.1, API s4.16, D-122). Details: `docs/evidence/P01B/P01B_EVIDENCE.md`.

### Requirement IDs addressed

S18-S29 specified; S02, S03, S07, S08, S09, S11, S15 updated for V2; all mapped to components and acceptance cases in `docs/ARCHITECTURE.md` s15 (94 cases incl. ACC01-ACC05, ZM01-ZM08, SP01-SP04, FAC01-FAC12, FDB01-FDB06, HIS06). Every acceptance case remains NOT RUN.

### Files changed

Modified:
- `docs/ARCHITECTURE.md` (s1-s7, s9-s16; new s17 ZMMS connector runtime)
- `docs/DATA_CONTRACT.md` (s1-s9, s11-s13; new s14-s20)
- `docs/API_CONTRACT.md` (s1-s4.15, s5, s7; new s4.16-s4.27)
- `docs/PORTAL_INTEGRATION_PLAN.md` (fourth role and display name only: s2, s3.1-s3.3, s4, s5.2, s7, s8)
- `docs/DECISIONS.md` (D-89..D-128, P01B supersessions, U-29..U-32)
- `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md` (this entry)

New:
- `docs/evidence/P01B/P01B_EVIDENCE.md`, `docs/evidence/P01B/contract-coverage-v2.json`
- `tools/p01b/check_contract_coverage_v2.py`

Untouched: `documents/`, `As-bulit drawing/`, `RTG drawings/`, `rtg-workbench/` (another session's work, not read), `docs/UX_SPEC.md` (P02B updates it), prototypes, `F:\CODEX\CICT-ENG_MAIN_PAGE` (read-only `git log/status` only: `47f7bd9`, clean).

### Checks run and results

| Check | Result |
| --- | --- |
| `python -I tools/p01b/check_contract_coverage_v2.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/P01B/contract-coverage-v2.json` | 15/15 passed (first run 14/15 from a checker defect on the `F:x` notation example, fixed in the checker) |
| `python -I tools/p01/check_contract_coverage.py ... --out tmp/p01-coverage-after-p01b.json` | 9/9 passed |
| Mermaid validator on the 5 new or changed diagrams | 5/5 valid (the s17 sequence first failed on semicolons inside messages; fixed) |

Evidence type: source review and scripted document checks only. No application tests, browser verification, target-environment verification or production acceptance exist.

### Key contract decisions (for R02B)

1. Access matrix (DATA s6, s14): twelve features; only the 13 toggleable cells can be stored; the evaluator ignores anything else, so no ceiling can be widened; enforced on API, exports, files and page routes (the SPA shell returns 403, D-93); propagation within 60 s (D-92); audited.
2. Automatic status (DATA s4.2, s15.7): nothing changes until Admin enables it with every seen value mapped (D-97); a correction holds for its Asia/Colombo day, also against a run that started before midnight, and ends at the first successful sync of a later day (D-95); a failed or partial run changes nothing (one transaction per run, D-99); Back to automatic never invents a value (D-96).
3. ZMMS connector (DATA s15, ARCHITECTURE s17): login + daily all-job list only, host allow-list, configuration key names only, no raw page storage, single-run app lock, retry/backoff without lockout-risking login retries; fields provisional until P07B (DATA s20).
4. Spare parts (DATA s16): register is the current view of the one installation history; Replacement completion writes it in the same transaction from the line's fields (D-106); direct entries create `baselineRecorded`/`conditionReplacement` events (D-105); predictions computed, never stored; "Not recorded" until recorded.
5. FAC (DATA s17): rolling and lazily created period cycles; due dates in Asia/Colombo calendar months/days from recorded completion dates; completion confirmation; same-day undo of the author's latest update; job-level hold; staged, re-encoded photos; stateless import preview with a hash, locked by the first progress.
6. Read models (DATA s18): crane four tabs with no history; EQ Jobs tab three parts; FAC Dashboard one ETag-revalidated summary for the 60 s poll.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-29 | ZMMS page structure unknown (ZQ-01..ZQ-13, DATA s20) | Parser, fields and value vocabularies provisional until P07B; not blocking P02B (synthetic data) |
| U-30 | Facility sheet gaps (rows 21, 55, 57 frequency; 80/82; 12; 14; duplicates) | Imported per DATA s17.9 and shown in the preview; Admin completes after import (Q5); not blocking |
| U-31 | U1-C19 "all the projects" read as all **open** special jobs in scope (history stays in Jobs, S07) | Confirm at the U1 repeat; listing completed jobs in the panel would be a scope change |
| U-32 | Outbound HTTPS from the IIS server to ZMMS; always-running app pool (D-103) | P12 prerequisites |
| D-02 | .NET 10 SDK still not installed | Blocks P04 only |
| U-13, U-16..U-18, PI-5 | Unchanged P05 rollout items | As before |

No genuinely missing business information blocks the next phase; U-31 is a confirmation for the U1 walkthrough, not a blocker.

### Git

Repository `F:\CODEX\EQ_MAINTENANCE`, branch `main`, base `c27a474`. P01B files are committed by this run as one commit on `main` (not pushed); `rtg-workbench/` and `RTG drawings/` stay uncommitted and untouched.

### Next prompt

**P02B V2 prototype** (Claude Code profile claude-sonnet-5-5, high). It must implement U1-C19 from DATA s18.1 / API s4.16, then R02B, then the U1 repeat.

---

## Repair-U1 round 3 User changes U1-C17..U1-C18 - 22 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-opus-5-5, high, adaptive thinking (Repair profile; P03 profile inherited) |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the orchestrator; prompt in `docs/runs/Repair-U1r3-20261022.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. Run in a Linux cloud container (`/home/user/EQ_MAINTENANCE`, branch `main-xqosal`), no hardware GPU: all browser checks and renders used SwiftShader; PowerShell absent (node/python used); `F:\CODEX\CICT-ENG_MAIN_PAGE` not available and not needed |

### Outcome

Repair complete for U1-C17 (trolley, sheaves, wheels, rope paths to J526A0200 / J526A2100) and U1-C18 (headblock to J526A1200, spreader remodelled) in the P03 model (draft v1 revision 4) and, where it draws these parts, the P02 flat view. Prototype-only, synthetic data; no production code, database, Portal change or deployment. Not committed (orchestrator instruction). U1 was not repeated by this run. Details and proof: `docs/evidence/U1/repair-r3-20261022.md`.

### Change IDs

- U1-C17: open trolley frame and centre body; 4 wheels (one per corner, dia 630 at 2370 / 2070 on the 6300 rails) instead of 8; four sheave shafts at 900 with two dia 1000 sheaves each (sets A/B per rope side, waterside pair staggered 80); trolley-rope equalizer sheaves at the 2560 / 2260 rope lines (new position, 021 proposed); spreader cable reel (new position, 014); main hoist loops per the drawing (4 ropes, 8 falls) and trolley ropes on the J526A2100 1050 / 950 lanes (tip and tail trolley-rope sheaves moved to 1050). Flat view redrawn to the same proportions with four appended template positions. Checks P03 `u1r3-trolley-spreader-content`, P02 `U1R3-C17-C18`; overlays `repair-r3/comparison/trolley-plan-overlay.png`, `trolley-side-overlay.png`.
- U1-C18: headblock per J526A1200 (1210 beam, 1640 box, 2090 guards, sheaves at 1010 / 970, fence to 1670, twistlocks dia 140 at 950); spreader as an STS45-type telescopic spreader (main frame 1300 beam spacing from DT1500F, landing castings under the headblock twistlocks, arms, end beams, twistlocks at ISO 40 ft corners, flippers, power pack). The STS45 drawing is not in the supplied set, so the spreader body is estimated (U-27). Pairs `headblock-end-pair.png`, `headblock-front-pair.png`, `before-after-15-spreader.png`.

Requirement IDs touched (prototype evidence only; acceptance cases remain NOT RUN): S04, S05, S06, S12 (kept keys; removed nonexistent draft positions, D-84), S14, S16; supports VIS01-VIS06, VIS08-VIS10.

### Files changed

Modified:
- Model source/pipeline: `assets/models/source/cict-j526a-sts/build.mjs`, `params.json` (rev 4, new "U1 round 3" parameters, `trolleyWheelPairPitch` removed), `README.md`; `tools/model-generator/generate.mjs` (colour-factor rounding)
- Generated model: `artifacts/models/cict-j526a-sts-scene/1/` (`scene.glb`, `manifest.json`, `provenance.md`, `landmarks.json`, `checksums.json`)
- P02: `artifacts/prototypes/p02-ui/js/preview.js`, `js/fixtures.js`, `css/app.css`, `README.md`
- P03: `artifacts/prototypes/p03-qc-model/README.md`
- Checks/tools: `tools/p02/cdp.mjs`, `tools/p03/cdp.mjs` (Linux Chromium path, `EQ_CHROME`, `--no-sandbox` on Linux), `tools/p02/check_prototype.mjs` (+`U1R3-C17-C18`), `tools/p03/check_model_prototype.mjs` (+`u1r3-trolley-spreader-content`)
- Records: `docs/DECISIONS.md` (D-83..D-88, U-27, U-28, U1 row), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`

New:
- `tools/u1/capture_u1r3_model.mjs`, `tools/u1/capture_u1r3_ui.mjs`, `tools/u1/compose_u1r3.py`
- `docs/evidence/U1/repair-r3-20261022.md`; `docs/evidence/U1/repair-r3/` (check JSON, model diff, capture logs, `closeups/` 16, `screenshots/` 10, `comparison/` 6)

Untouched: `documents/`, `As-bulit drawing/`, `RTG drawings/`, `mockups/`, `.claude/`, earlier evidence folders. Scratch outputs in `tmp/u1r3-det-a`, `tmp/u1r3-det-b` (git-ignored).

### Checks run and results (after the last change; SwiftShader only)

| Check | Result |
| --- | --- |
| `generate.mjs` x3 | identical GLB sha256 `af9d1338...f9a369` (2,546,744 bytes) and manifest; 54,146 triangles; draw calls 196 (Overall 147, Technical 195) of 200; no landmark failure |
| `validate.mjs` | 26/26, validated |
| `check_bindings.mjs` | 11/11 |
| `tools/u1/model_diff.mjs` | 2 added, 4 removed (`trolley.wheel.*.2`), 0 identity changes |
| `check_model_prototype.mjs --gpu swiftshader` | 41/41 twice on the final model (one earlier run on an intermediate build had 2 click-timing failures, reruns passed; reported in the evidence) |
| `check_no_webgl.mjs` | pass |
| `tools/p02/check_prototype.mjs` | 59/59 |
| `tools/p02/check_contrast.py` | 37 pairs, 0 below threshold |
| captures and comparisons | 16 + 9 + 6 images, reviewed; no console errors (favicon 404 only) |

Evidence type: drawing reading, scripted model checks and headless SwiftShader browser checks with synthetic data. No hardware-GPU, authenticated, target-environment or production verification. SwiftShader orbit 8.9 fps (software rendering, not the reference device).

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-27 | STS45 spreader drawing not supplied; spreader body estimated from interfaces | Visual; ask the user at the U1 repeat whether to supply it (not blocking) |
| U-28 | Several trolley readings scaled (equalizer Z, reel, sheave height, buffer Z, body width); rope lane grazes the simplified girder box | Visual only |
| D-84 / D-85 | Four nonexistent draft wheel positions removed; sheave sets stay per rope side, per-shaft split proposed for Admin | P06 Admin review |
| Platform | GLB colour factors now rounded, so this Linux build and a Windows rebuild should give the same bytes; not re-verified on Windows in this run | Re-run `generate.mjs` once on the workstation to confirm |
| Perf | No hardware-GPU measurement in this run | Measure on the reference desktop in P11 |
| Earlier | U-19, U-20..U-26, D-61, D-02 unchanged | As before |

No genuinely missing business information blocks the repeat of U1. Question for the user at the walkthrough (optional): supply the STS45 (Bromma) spreader GA if the spreader must match it exactly (U-27).

### Git

Branch `main-xqosal`, HEAD `fdade57`; all round-3 changes were uncommitted at hand-back. Committed on that branch as `4b336e6`, then merged into local `main` (with round 2 records and the SOW V2 draft) on 22 October 2026.

### Next prompt

**U1 user checkpoint, repeated** (user walkthrough of the P02 prototype on port 5312 and the P03 model on port 5313: `node artifacts/prototypes/p02-ui/serve.mjs 5312`, `node artifacts/prototypes/p03-qc-model/serve.mjs 5313`). The user's approval or further changes are recorded in `docs/DECISIONS.md` s4 before P04 starts.

---

## Repair-U1 round 2 User changes U1-C09..U1-C16 - 22 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-opus-5-5, high, adaptive thinking (P03 profile inherited) |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/Repair-U1r2-20261022-1003.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. The run was interrupted once by an API rate limit; the orchestrator resumed it and the work on disk was checked (the user had meanwhile committed the partial work as `1ff226b "EQ_maintanance"`) and completed |

### Outcome

Repair complete for U1-C09..U1-C16 in both the P02 flat view and the P03 3D model (draft v1 revision 3). Prototype-only, synthetic data; no production code, database, Portal change or deployment. The final edits after `1ff226b` are uncommitted (left for the orchestrator). U1 was not repeated by this run.

### Change IDs (details and proof: `docs/evidence/U1/repair-r2-20261022.md`)

- U1-C09: labels never disappear after a tree selection (fallback to the selection's level or tier 1; edge-pinned labels with arrows); flat view gained parts for 07, 13, 16. Checks P02 `U1R2-C09`, P03 `u1r2-labels-persist-after-tree-selection`.
- U1-C10: Reset = whole equipment, labels on, tree folded back, full view (mode and aligned view kept), both views. Checks P02 `U1R2-C10-C11`, P03 `u1r2-reset-whole-equipment`.
- U1-C11: fold icons work both ways on the selected mechanism (flat ancestors expanded only on selection change). Checks P02 `U1R2-C10-C11`, P03 `u1r2-tree-fold-both-ways`.
- U1-C12: load cells as load pins in the main hoist rope-end anchors at the boom tip (J526A2000 Detail I; user's arrows). Close-up `repair-r2/closeups/c12-loadcell-boom-tip.png`.
- U1-C13: girder-tail upper and lower platforms with centre stair and side flights (J526A5000 item 5); mid-air ladder removed. Close-ups `c13-*`.
- U1-C14: apex platform, stay-pin block, guide sheaves, fall-sheave groups, guard frame (top 83.356 m); boom hoist reeving to two boom blocks at Z2/Z3 (J526A2300). Close-ups `c14-*`, side overlay.
- U1-C15: 20 floodlight fittings under the girder and boom edges. Close-ups `c15-*`.
- U1-C16: elevator outboard of landside leg B along the rail with car, door, drive, mast, ties and landings (J526A5100); every location ball replaced by a simple part (19 hotspots, identities unchanged). Close-ups `c16-*`; P03 `u1r2-model-content`, P02 `U1R2-C12-C16`.

Requirement IDs touched (prototype evidence only; acceptance cases remain NOT RUN): S04, S05, S06, S12 (IDs preserved), S16; supports VIS01-VIS06, VIS08-VIS10.

### Files changed (since `da409ca`; most are inside `1ff226b`)

Modified:
- P02: `artifacts/prototypes/p02-ui/css/app.css`, `js/fixtures.js` (5 positions appended), `js/preview.js`, `js/views-equipment.js`, `README.md`
- P03 prototype: `artifacts/prototypes/p03-qc-model/css/p03.css`, `index.html`, `js/app.mjs`, `js/viewer.mjs`, `README.md`
- Model source and pipeline: `assets/models/source/cict-j526a-sts/build.mjs`, `params.json` (revision 3, new "U1 round 2" parameters), `README.md`; `tools/model-generator/lib/scene-builder.mjs` (hotspot part builder), `lib/kit.mjs` (emissive material option)
- Generated model: `artifacts/models/cict-j526a-sts-scene/1/` (`scene.glb`, `manifest.json`, `provenance.md`, `checksums.json`)
- Checks/tools: `tools/p02/check_prototype.mjs` (C30 updated for the new Reset, +3 round-2 checks, arrow-stripping label reader), `tools/p03/check_model_prototype.mjs` (toolbar check updated for the new Reset, transition-aware settle, +4 round-2 checks), `tools/p03/check_no_webgl.mjs` (optional report path), `tools/u1/model_diff.mjs` (`--out`, modes/representation), `tools/u1/capture_u1.mjs` (`--out`, arrow-tolerant label match)
- Records: `docs/DECISIONS.md` (D-73..D-82, U-23..U-26, U1 row), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`

New:
- `tools/u1/capture_u1r2_model.mjs`, `tools/u1/capture_u1r2_ui.mjs`, `tools/u1/repro_r2_flat.mjs`, `tools/u1/repro_r2_3d.mjs`
- `artifacts/u1r2-captures/` (33 renders)
- `docs/evidence/U1/repair-r2-20261022.md`, `docs/evidence/U1/repair-r2/` (check JSON, model diff, capture logs, `closeups/` 18, `screenshots/` 15, `screenshots-3d/`, `comparison/` 12)

Untouched: `documents/`, `As-bulit drawing/`, `mockups/`, `RTG drawings/` (appeared during the run; not used), P02/P03 phase evidence and round-1 `docs/evidence/U1/repair/` (one P03 evidence file overwritten by a tool default was restored from Git), `F:\CODEX\CICT-ENG_MAIN_PAGE`.

### Checks run and results (after the last change)

| Check | Result |
| --- | --- |
| `generate.mjs` x3 (artifact + `tmp/u1r2-det-a`, `-b`) | identical GLB sha256 `fe35835e...869b` and manifest `8b0cfe74...7568`; 2,196,484 bytes; 46,522 triangles; draw calls 194 all modes (Overall 145 / Technical 193); no landmark failure |
| `validate.mjs` | 26/26, validated |
| `check_bindings.mjs` | 11/11 |
| `tools/u1/model_diff.mjs --base da409ca` | 0 added, 0 removed, 0 identity changes, 37 geometry/label/representation changes |
| `check_model_prototype.mjs` hardware / SwiftShader | 40/40 / 40/40 |
| `check_no_webgl.mjs` | pass |
| `tools/p02/check_prototype.mjs` | 58/58 |
| `tools/p02/check_contrast.py` | 37 pairs, 0 below threshold (edge arrow 6.73:1 computed separately) |
| close-ups, UI screenshots, aligned captures and comparisons | 18 + 14 + 33 + 12 images, no console errors besides a favicon 404; reviewed |

Evidence type: scripted model checks and headless-browser checks on this workstation with synthetic data. Measured: hardware orbit 60.2 fps, usable 697 ms after navigation; SwiftShader 11.7 fps (software rendering, not the reference device). Test expectations changed only where the user changed the behaviour (Reset clears the selection, U1-C10); stated in the evidence s4.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-23 | Load-cell hardware not identified on the sheets; boom-tip anchors chosen from the user's arrows | Visual; confirm at the U1 repeat |
| U-24 | Floodlight count/spacing estimated | Visual |
| U-25 | Elevator side re-read from J526A5100 (differs from P03) | Visual; confirm at the U1 repeat |
| U-26 | Apex guard frame, platform extents and fall counts simplified | Visual |
| Perf | SwiftShader orbit below 30 fps; draw calls 194 of the provisional 200 | Measure on the reference desktop in P11; little headroom for more parts |
| Repository | `1ff226b` (user commit) included `RTG drawings/` PDFs (about 24 MB) and the agent config folders; later edits uncommitted | Orchestrator/user |
| Earlier | U-19..U-22, D-61 proposals, D-02 (.NET 10 SDK) unchanged | As before |

No genuinely missing business information blocks the U1 repeat; the user may confirm U-23 and U-25 during the walkthrough.

### Git

Branch `main`, HEAD `1ff226b` (user commit "EQ_maintanance" containing most of this repair); remaining edits (status, handover, evidence report wording, pinned model diff) uncommitted. This run did not commit.

### Next prompt

**U1 user checkpoint, repeated** (walkthrough of the P02 prototype on port 5312 and the P03 model on port 5313; start both servers). The user's approval or further changes are recorded in `docs/DECISIONS.md` s4 before P04 starts.

---

## Repair-U1 User changes U1-C01..U1-C08 - 22 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-opus-5-5, high, adaptive thinking (P03 profile inherited) |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/Repair-U1-20261021-2206.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. The run was interrupted once by an API rate limit; the orchestrator resumed it and the partial work on disk was checked and completed. The prototype servers had stopped and were restarted |

### Outcome

Repair complete for U1-C01..U1-C08 in both the P02 flat view and the P03 3D model (draft v1, revision 2). Prototype-only, synthetic data; no production code, database, Portal change or deployment. Not committed (orchestrator instruction). U1 was not repeated by this run.

### Change IDs (details and proof: `docs/evidence/U1/repair-20261022.md`)

- U1-C01: new ship-to-shore QC icon (P02). Check P02 `U1-C01`.
- U1-C02: compact fleet; heading block removed, status meaning kept in a compact note; whole synthetic fleet on one 1366 x 768 screen. Check P02 `U1-C02`.
- U1-C03: back-reach area, CICT logo (Portal artwork embedded in the GLB, -Z house end wall, Overall only) and stairs in both views. Checks P03 `u1-model-content`, P02 `U1-C03`, validator `decals-embedded-and-not-identities`.
- U1-C04: reeving paths per the J526A00 diagrams, stair tower re-oriented and aligned to J526A5000 / end views, back-reach equipment, machinery-house layout re-read from J526A3000 (boom-hoist motor side, offsets, A/C units, railings, doors, hatch), recognisable equipment shapes. Overlays `repair/comparison/side-overlay.png`, `end-ls-overlay.png`.
- U1-C05: Isolate (was disabled in Overall), Fit (no-op without selection and in aligned views), aligned views (no pan/zoom, no framing, reset left them) fixed. Check P03 `u1-toolbar-controls-work`.
- U1-C06: cab remodelled from J526A3100 with seat and consoles as new positions. Screenshot `repair/screenshots/p03-05-qc02-cabin-parts.png`, close-up in `repair/comparison/site-photo-closeups.png`.
- U1-C07: tier 1 > 2 > 3 clickable drill-down labels in 3D and flat, QC-DEMO-01 and -02. Checks P03 `u1-label-drilldown-q01/q02`, `u1-label-drag-orbits`; P02 `U1-C07`.
- U1-C08: flat gained Isolate machinery house and Labels; same drill-down, sync and content as 3D. Check P02 `U1-C05-C08`.

Requirement IDs touched (prototype evidence only; acceptance cases remain NOT RUN): S02, S04, S05, S06, S07, S12 (IDs preserved), S16; supports VIS01-VIS06, VIS08-VIS10.

### Files changed

Modified:
- P02: `artifacts/prototypes/p02-ui/css/app.css`, `js/fixtures.js` (9 positions appended), `js/preview.js`, `js/util.js`, `js/views-equipment.js`, `js/views-fleet.js`, `README.md`
- P03 prototype: `artifacts/prototypes/p03-qc-model/css/p03.css`, `index.html`, `js/app.mjs`, `js/viewer.mjs`, `README.md`
- Model source and pipeline: `assets/models/source/cict-j526a-sts/build.mjs`, `params.json`, `README.md`; `tools/model-generator/generate.mjs` (texture embedding, decals, revision, shell-based house-length landmark), `lib/kit.mjs` (`texturedQuad`, `stairFlight`, `railing`, alphaTest/texture), `lib/scene-builder.mjs` (`containerDecal`), `validate.mjs` (decal check)
- Generated model: `artifacts/models/cict-j526a-sts-scene/1/` (`scene.glb`, `manifest.json`, `provenance.md`, `landmarks.json`, `checksums.json`)
- Checks/tools: `tools/p02/check_prototype.mjs` (+5 U1 checks), `tools/p03/check_model_prototype.mjs` (+5 U1 checks), `tools/p03/capture.mjs` and `compose_comparisons.py` (output options, `--u1` / `--site u1`; defaults unchanged)
- Records: `docs/DECISIONS.md` (D-65..D-72, U-20..U-22, U1 row), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`

New:
- `assets/models/source/cict-j526a-sts/textures/cict-logo.png` and `README.md`; `artifacts/prototypes/p02-ui/img/cict-logo.png` (both copied unchanged from the Portal source, read only)
- `tools/u1/capture_u1.mjs`, `tools/u1/model_diff.mjs`
- `artifacts/u1-captures/` (33 renders)
- `docs/evidence/U1/repair-20261022.md`, `docs/evidence/U1/repair/` (check JSON, model diff, 12 comparison images, `screenshots/` 19, `screenshots-3d/` 19, capture logs)

Untouched: `documents/` (including the new user photos, read only), `As-bulit drawing/`, `mockups/`, `.claude/`, P02/P03 phase evidence folders (outputs written to `docs/evidence/U1/repair/` instead; two P03 evidence files overwritten by tool defaults were restored from Git), `F:\CODEX\CICT-ENG_MAIN_PAGE` (read only; `git status` clean).

### Checks run and results (after the last change)

| Check | Result |
| --- | --- |
| `generate.mjs` x3 (artifact + two scratch folders) | identical GLB sha256 `177f9dad...e01a`, 1,714,480 bytes; 38,318 triangles; draw calls Overall 121 / Technical 176; no landmark failure |
| `validate.mjs` | 26/26, validated |
| `check_bindings.mjs` | 11/11 |
| `tools/u1/model_diff.mjs` | 12 added, 0 removed, 0 identity changes |
| `check_model_prototype.mjs` hardware / SwiftShader | 36/36 / 36/36 |
| `check_no_webgl.mjs` | pass |
| `tools/p02/check_prototype.mjs` | 55/55 |
| `tools/p02/check_contrast.py` | 37 pairs, 0 below threshold |
| captures and comparisons (`capture.mjs --u1`, `compose_comparisons.py --site u1`, `tools/u1/capture_u1.mjs`) | 33 + 12 + 19 images, no console errors; side and landside-end overlays reviewed |

Evidence type: scripted model checks and headless-browser checks on this workstation with synthetic data. Measured: hardware orbit 57 fps, usable 265 ms after navigation; SwiftShader orbit 14.9 fps (was 27.9; software rendering, not the reference device).

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-20 | Logo only on the -Z house end wall (other wall not photographed) | Visual; confirm at the U1 repeat |
| U-21 | U1 photos are AI-processed; P03 site photos no longer in `documents/` | Appearance only |
| U-22 | Cab floor elevation GA vs J526A0200 | Visual only |
| Perf | SwiftShader orbit below 30 fps | Measure on the reference desktop in P11 |
| Repository | Untracked `documents/ChatGPT Image*.png` (user's), `mockups/`, and the new repair outputs are uncommitted | Orchestrator/user commits |
| Earlier | U-19, D-61 proposals, D-02 (.NET 10 SDK) unchanged | As before |

No genuinely missing business information blocks the repeat of U1; no question for the user is pending beyond confirming U-20 during the walkthrough.

### Git

Branch `main`, HEAD `18f03b0`; all Repair-U1 changes are **uncommitted** (orchestrator instruction: do not commit).

### Next prompt

**U1 user checkpoint, repeated** (user walkthrough of the P02 prototype on port 5312 and the P03 model on port 5313; start both servers). The user's approval or further changes are recorded in `docs/DECISIONS.md` s4 before P04 starts.

---

## P03 QC model prototype from drawings - 21 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6-astra, xhigh; Claude Code claude-opus-5-5, high, adaptive thinking |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/P03-20261021-1541.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None. The first run was interrupted (API connection error) when it started its final check run; the orchestrator resumed P03 in a new run of the same agent, which inspected the partial work on disk, completed it and ran every check once |

### Outcome

P03 complete. A drawing-derived, interactive CICT-J526A-STS model (version 1, draft, not assigned to any real QC) with editable source, deterministic generator, GLB, node manifest, provenance/dimension table, synthetic equipment bindings, an interactive prototype linked from the P02 review flow, aligned drawing comparisons and a performance/fallback report. No production code, database, Portal change or deployment.

### Requirement IDs addressed (prototype evidence only; acceptance cases remain NOT RUN)

S04, S05, S06, S07 (synthetic history), S12 (separate position IDs per equipment for one template), S14 (source-linked parameters, U-01/U-02 shown as conflicts), S16 (keyboard tree, fallbacks, 1366 and 390 px layouts), S17 (reproducible model, measured counters). Supports VIS01, VIS02, VIS03, VIS04, VIS05, VIS06, VIS08, VIS09, VIS10 at prototype level. VIS07 (RTG/ES and unverified QC) remains covered by the P02 prototype only.

### Files changed

New:
- Model source: `assets/models/source/cict-j526a-sts/` (`params.json`, `build.mjs`, `README.md` with build/export instructions and tool versions)
- Generator and validator: `tools/model-generator/` (`generate.mjs`, `validate.mjs`, `lib/kit.mjs`, `lib/scene-builder.mjs`, `package.json`, `package-lock.json`; `node_modules/` is git-ignored and restored by `npm ci`)
- Generated model: `artifacts/models/cict-j526a-sts-scene/1/` (`scene.glb`, `manifest.json`, `provenance.md`, `landmarks.json`, `checksums.json`)
- Prototype: `artifacts/prototypes/p03-qc-model/` (`index.html`, `capture.html`, `css/p03.css`, `js/app.mjs`, `js/viewer.mjs`, `js/data.mjs`, `serve.mjs`, `README.md`, vendored `vendor/three/` 0.186.1 with licence)
- Check/capture tools: `tools/p03/` (`check_model_prototype.mjs`, `check_bindings.mjs`, `check_no_webgl.mjs`, `capture.mjs`, `cdp.mjs`, `alignment.json`, `compose_comparisons.py`)
- Raw renders: `artifacts/p03-captures/` (9 PNG)
- Evidence: `docs/evidence/P03/P03_EVIDENCE.md`, `registration-validation.json`, `binding-validation.json`, `browser-checks-hardware.json`, `browser-checks-swiftshader.json`, `no-webgl-check.json`, `p02-regression-checks.json`, `capture-log.json`, `comparison/` (12 PNG), `screenshots/` (19 PNG)

Modified: `artifacts/prototypes/p02-ui/js/views-equipment.js` ("Open 3D model (P03)" link on QC-DEMO-01/02 detail), `docs/DECISIONS.md` (D-55 to D-64, U-19, notes on U-04/U-05/U-06/U-11), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`.

Untouched: `documents/` (including the ten new site photos, read only), `As-bulit drawing/`, `mockups/` (not P03 output; not used), `.claude/`, `F:\CODEX\CICT-ENG_MAIN_PAGE`.

### Checks run and results (resumed run, after the last change)

| Check | Result |
| --- | --- |
| `npm ci` in `tools/model-generator` | three 0.186.1 installed from the lockfile |
| `node tools/model-generator/generate.mjs` (plus two runs into scratch folders) | `scene.glb` sha256 `3a4d0ee4...7ce4` and `manifest.json` sha256 `e957d867...44fe` identical in all three outputs; 662,784 bytes |
| `node tools/model-generator/validate.mjs` | 25/25 pass, status `validated`, exit 0 (includes gauge 30 m, overall height 83.356 m and not 63 m, landmarks within 1 %, budgets) |
| `node tools/p03/check_bindings.mjs` | 11/11 pass, exit 0 |
| `node tools/p03/capture.mjs` (Intel UHD 630, headless Chrome 155) | 27 captures, then `python -I -X utf8 tools/p03/compose_comparisons.py` wrote 12 comparison images |
| `node tools/p03/check_model_prototype.mjs --gpu hardware` | 31/31 pass, exit 0 |
| `node tools/p03/check_model_prototype.mjs --gpu swiftshader` | 31/31 pass, exit 0 |
| `node tools/p03/check_no_webgl.mjs` (Chrome with WebGL disabled) | pass, 0 canvases, tree selection works, exit 0 |
| `node tools/p02/check_prototype.mjs http://127.0.0.1:5312/ docs/evidence/P03/p02-regression-checks.json` | 50/50 pass, exit 0 |
| Visual review in the resumed run of the regenerated side, end-ws and top overlays, model close-ups and site-photo close-ups | Linework still coincides (the resumed run changed colours only); end-ls reviewed in the first run only |

Evidence type: source review, scripted model checks and headless-browser checks on this workstation, with synthetic bindings. No authenticated, target-environment or production verification. Performance figures are workstation measurements, not the agreed office reference desktop/LAN.

Measured: 13,656 triangles / 91 draw calls (Overall), 18,384 / 134 (Technical); GLB 647 KiB; 10 s orbit 60.1 fps hardware, 27.9 fps SwiftShader; model usable 301 ms after navigation (hardware, loopback). All within the provisional budgets except that SwiftShader software rendering is below 30 fps (not the reference device).

### Site photos

Ten photos `documents/Image_20261021165608.jpg` to `Image_20261021170007.jpg` appeared during the first run. The resumed run used them for appearance only (D-62): headblock and spreader yellow, walkways/stairs/platforms red, light house on a red deck; `comparison/site-photo-closeups.png` pairs two of them with model close-ups. They were not used for dimensions and were not modified or moved.

### Approximations (summary; full list in evidence s7)

Girder elevation interpretation (U-19); fixed display pose; house position/roof and internal equipment positions scaled, simple shapes; electrical cabinets not identified (U-11); several hotspots with unestablished locations; trolley wheel count and sheave sizes estimated; simplified reeving; lacing pattern and member sections simplified; gantry drive shapes generic; access simplified; spreader from ISO dimensions (U-10); classification proposals for Admin review (D-61); logos, hazard striping and small fittings omitted.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-19 | Girder/trolley-rail elevation interpretation (about 1.9 m alternative) | Visual only; labelled; confirm technically when convenient |
| U-10, U-11 | Missing spreader/slip-contact drawings; electrical cabinet identities | Positions stay approximate hotspots |
| D-61 | Classification proposals (012/032 drum brakes, sheaves, 046, 151, 121) | Admin confirms in P06 |
| D-02 | .NET 10 SDK not installed | Blocks P04 only |
| Repository | Untracked `documents/Image_20261021*.jpg` (about 45 MB) and `mockups/` are not P03 output; a blanket `git add -A` would commit them | Orchestrator/user decides whether to track them |

No genuinely missing business information blocks R02; no question for the user is pending.

### Git

Repository `F:\CODEX\EQ_MAINTENANCE`, branch `main`, HEAD `0dbb1c8`; P03 changes are **uncommitted** (left for the orchestrator to commit). Regenerating the model after a commit changes only the manifest's `generator.sourceCommit`/`sourceDirty` fields; `scene.glb` is unaffected.

### Next prompt

**R02 UX and model fidelity review** (read-only, fresh context; Claude Code claude-opus-5-5, high). Start both servers (`node artifacts/prototypes/p03-qc-model/serve.mjs`, `node artifacts/prototypes/p02-ui/serve.mjs`); read `docs/evidence/P03/P03_EVIDENCE.md` first. U1 follows a PASS.

---

## P02 Reviewable UI prototype - 21 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-sonnet-5-5, high, adaptive thinking |
| Actual client | Claude Code subagent eq-build-sonnet-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/P02-20261021-1419.md`) |
| Actual model / effort | claude-sonnet-5-5; effort high (per agent definition) |
| Fallback / escalation | None. The run was interrupted once by an API rate limit and resumed by the orchestrator; the partial work on disk was checked and completed |

### Outcome

P02 complete. A runnable, clearly synthetic interface prototype with connected fleet, QC/RTG/ES equipment, jobs, job record and Admin screens; `docs/UX_SPEC.md`; evidence under `docs/evidence/P02/`. No production code, no Portal or other repository change, no database, no deployment.

### Requirement IDs addressed (design and prototype evidence only; acceptance cases remain NOT RUN)

S02, S03, S05-S09 and S16 as UX; S10 and S11 as screens and permission states; S12 (separate per-equipment positions, shown with two QCs sharing a template); S13 (conflict, atomic completion and retry behaviour demonstrated in simulated rules); S14 (parameter conflicts, protected-drawing wording). Supports VIS06, VIS07, VIS08, OPS01, OPS02, HIS01, HIS02, HIS04, HIS05, JOB03, JOB12, JOB13 at prototype level only.

### Files changed

New: `docs/UX_SPEC.md`; `docs/evidence/P02/P02_EVIDENCE.md`, `automated-checks.json`, `contrast-report.json`, `screenshots/` (70 PNG); `artifacts/prototypes/p02-ui/` (`index.html`, `README.md`, `serve.mjs`, `css/app.css`, `js/*.js` including generated `catalog.js` and `params.js`); `tools/p02/` (`build_catalog.py`, `check_prototype.mjs`, `check_contrast.py`, `cdp.mjs`, `capture.mjs`).
Modified: `docs/DECISIONS.md` (D-45 to D-54), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`.
Untouched: `documents/`, `As-bulit drawing/`, `tmp/`, `.claude/`, `F:\CODEX\CICT-ENG_MAIN_PAGE` (read only for design tokens). An untracked `mockups/eq-maintenance-demo-20261021/` folder appeared in the workspace during the run; it was not created by P02 (only its folder listing was seen), and was not modified or relied on.

### Checks run and results

| Check | Result |
| --- | --- |
| `python -I tools/p02/build_catalog.py` (asserts 16 main, 43 sub, 41 active, 048/063 inactive, no main 10, 061 Spreader, 062 Headblock, both gantry observations, no overall-height parameter) | passed |
| `node tools/p02/check_prototype.mjs` (Chrome 155 headless, 50 checks) | 50 PASS, 0 FAIL at the last run (after fixing 7 failures found in the first full run: a missing icon text alternative, SVG click in the test driver, dialog Escape handling, focus trap, a duplicate id, skip-link focus and the focus-ring test) |
| `python -I tools/p02/check_contrast.py` | 37 pairs, 0 below threshold (two defects fixed first, see evidence s4) |
| `node tools/p02/capture.mjs` | 70 screenshots, no console errors |

Evidence type: automated checks of a prototype in a real headless browser plus visual review. No target-environment, authenticated, database or production verification exists. Not tested: real devices, touch, screen readers, performance.

### What works in the prototype

Fleet with QC/RTG/ES groups, status counts and filters, search, freshness, table/card layouts; QC detail with ARIA tree, URL-driven selection shared by tree, breadcrumb, assembly buttons and scene, Overall/Technical, fit/reset, work markers, legend, history/technical panel with scoped history and the stale-response guard; RTG/ES and unverified-model states; jobs board and tabs; add/edit/complete/cancel/status forms with validation, conflict and unsaved-changes handling; replacement-position selection; Admin equipment, applicability, catalogue, positions, specifications, bindings preview; Management read-only and EQ Team writer states; loading, empty, invalid, conflict, stale/error, Unreported, non-WebGL states; desktop, tablet and phone layouts.

### Still synthetic or unproven

All data and rules are fixtures held in memory (reload resets); the model area is an SVG placeholder (illustrative heights); no authentication, persistence, protected files, polling, WebGL, performance or device testing.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| UX-1 | `JobSummary` lacks `reopenCount`/`committedLineCount` for explaining the cancel rule before a request | P07 contract note; not blocking |
| D-02 | .NET 10 SDK not installed | Blocks P04 only |
| U1 prompts | Four review questions in UX_SPEC s12 (placeholder acceptability, Management view of Admin, cancelled-work placement, fleet density) | Answer at the U1 checkpoint after R02 |
| Others | Unchanged from P01 (U-01..U-18, PI-5) | none new |

No genuinely missing business information blocks P03; no question for the user is pending.

### Git

Repository `F:\CODEX\EQ_MAINTENANCE`, branch `main`, HEAD `2db3653`; P02 changes are **uncommitted** (left for the orchestrator/user to commit).

### Next prompt

**P03 QC model prototype** (Claude Code claude-opus-5-5, high), then R02 and the U1 checkpoint. Integrate the P03 model into the P02 review flow where practical by replacing `js/preview.js` behind the same selection contract (UX_SPEC s10).

---

## Repair-R01 Contract repair after R01 NEEDS FIXES - 21 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-opus-5-5, high, adaptive thinking (R01 profile inherited) |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/Repair-R01-20261021-1403.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None |

### Outcome

Repair complete for all findings of `docs/evidence/R01/review-20261021-1357.md` (blocking F1, plus F2, F3, F4 and the F5 nits, per the user instruction). Documents-only; no application code, Portal file or other repository was changed. R01 was not re-run by this repair.

### Finding IDs and changes

- F1: invariant J6 and reopened-job rules (no EQ Team cancel; Admin cancel only after voiding committed lines; no kind change to repair; no target excluding committed lines; re-completion with zero new lines; CompletedOn vs committed ReplacedOn; `duplicate_position` for a committed position); test cases DATA s5.5; D-43.
- F2: idempotency record re-checked under the job lock before the version check (DATA s5.1 step 3, s8; API s1.5); D-44.
- F3: back-entry limit and Admin date-order re-entry procedure (DATA I2, s5.4); D-42.
- F4: PORTAL_INTEGRATION_PLAN R-3 generalised, R-6 added for `scripts/final-identity-live-deploy.ps1` l.71-74; PI-2, U-17, ARCHITECTURE P-02 updated.
- F5: semantic key frozen from confirmation (DATA and API aligned, 409 `position_key_frozen`); alternate keys declared for every composite FK, SceneBindingEntry tied to its equipment; SOURCE_MAP D-17 -> D-11; stale P01 Git note annotated.

Requirement/acceptance IDs touched (design only, all still NOT RUN): JOB03, JOB05, JOB06, JOB09, JOB12, HIS03, ADM03, VIS05; Portal deployment risk PI-2 (no acceptance ID).

### Files changed

Modified: `docs/DATA_CONTRACT.md`, `docs/API_CONTRACT.md`, `docs/PORTAL_INTEGRATION_PLAN.md`, `docs/ARCHITECTURE.md` (s13 D-42..D-44, s16 P-02), `docs/DECISIONS.md` (D-42..D-44, U-17), `docs/SOURCE_MAP.md` (s5 reference), `tools/p01/check_contract_coverage.py` (decision range D-19..D-44), `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`.
New: `docs/evidence/R01/repair-20261021-1403.md`, `docs/evidence/R01/repair-contract-coverage.json`.
Untouched: `documents/`, `As-bulit drawing/`, `tmp/`, `.claude/`, `F:\CODEX\CICT-ENG_MAIN_PAGE` (read-only, clean at `47f7bd9`).

### Checks run and results

| Check | Result |
| --- | --- |
| `python -I tools/p01/check_contract_coverage.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/R01/repair-contract-coverage.json` | 9/9 passed, exit 0 |
| `python -I tools/p00/validate_mechanisms.py` (regression) | 215/215 passed |
| Mermaid validation of the edited DATA s4.1 diagram | valid |
| Portal `git status --short` | clean |

Evidence type: source review and scripted document checks only. No automated application tests, browser, target-environment or production verification exist.

### Open issues and impact

No new blocking issue. Open items from P01 (D-02, U-13, U-16, U-17, U-18, PI-5, U-01..U-03, U-07, U-08) are unchanged in impact. No question for the user is pending.

### Git

Branch `main`, HEAD `e21e90a`; Repair-R01 changes are uncommitted (left for the orchestrator/user to commit).

### Next prompt

**R01 Scope and architecture review, repeated** (read-only, fresh context; Claude Code claude-opus-5-5, high). P02 follows only after PASS.

---

## P01 Architecture, data, API and authorization contracts - 21 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6-astra, high; Claude Code claude-opus-5-5, high, adaptive thinking |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/P01-20261021-1314.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None |

### Outcome

P01 complete: four reviewable contract documents plus evidence. No application, Portal or other-repository implementation was edited, as the phase requires.

### Requirement IDs addressed

S01-S17 specified and mapped to owning components and acceptance cases (`docs/ARCHITECTURE.md` s15; all 58 acceptance IDs mapped). No acceptance case executed; all remain NOT RUN.

### Files changed

New:
- `docs/ARCHITECTURE.md`
- `docs/DATA_CONTRACT.md`
- `docs/API_CONTRACT.md`
- `docs/PORTAL_INTEGRATION_PLAN.md`
- `docs/evidence/P01/P01_EVIDENCE.md`
- `docs/evidence/P01/contract-coverage.json`
- `tools/p01/check_contract_coverage.py`

Modified:
- `docs/DECISIONS.md` (D-19 to D-41 added; U-16 to U-18 added; header note)
- `docs/IMPLEMENTATION_STATUS.md` (P01 complete, R01 next, requirement/open-issue notes)
- `docs/HANDOVER.md` (this entry)

Untouched: `documents/`, `As-bulit drawing/`, `tmp/`, `.claude/`, `F:\CODEX\CICT-ENG_MAIN_PAGE` (still `feature/option-b-provisioning-and-login-redesign` / `47f7bd9`), UMMS, PayPrep, Safety repositories (read only).

### Checks run and results

| Check | Result |
| --- | --- |
| `python -I tools/p01/check_contract_coverage.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/P01/contract-coverage.json` | 9/9 passed (first run found VIS05 unmapped; fixed) |
| Mermaid validation of all 7 diagrams | 7/7 valid |
| `dotnet --list-sdks` | 8.0.426 only (.NET 10 SDK still required before P04) |
| Portal and consumer source inspection (read-only) | Recorded in `docs/PORTAL_INTEGRATION_PLAN.md` s1 and s5.1 |

Evidence type: source review and scripted document checks only. No automated application tests, browser verification, target-environment verification or production acceptance exist.

### Key contract decisions (for R01)

1. One ASP.NET Core 10 host serves SPA, `/eq-maintenance/api/v1`, protected files/models and `/eq-maintenance/internal/provisioning`; separate EQ SQL Server database; protected file store outside web roots.
2. Equipment-specific instances and positions with composite foreign keys that include `EquipmentId`, so cross-equipment relationships are impossible in the database.
3. Two position kinds (`serialized`, `quantityLot` with lots); append-only installation events with per-position sequence; corrections may void only the latest event at a position, and new events cannot be inserted before a later one.
4. Completion is one transaction with an idempotency record, row-version checks and `UPDLOCK` on the job and positions.
5. Model contract: semantic node keys, manifest schema, exact-key equipment bindings with explicit Admin remapping, containers separated from coded mechanisms, union-bounds focus, overall/technical modes, fallbacks.
6. Portal onboarding: CictEng.Auth 0.3.0, a disabled registry row delivered by a new Identity migration, gate G1 (every validating consumer on 0.3.0) before enablement, reverse-order rollback, and regression cases RC-1 to RC-17.

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| D-02 | .NET 10 SDK not installed | Blocks P04 only |
| U-13 | Deployed `CictEng.Auth` versions unknown | Gate G1 before EQ enablement; not blocking local work |
| U-16 | No path to add a new app to an existing Identity database | P05 item I-5 |
| U-17 | Portal root deploy would delete an EQ child folder | P05 items R-1/R-2 |
| U-18 | access-status ignores the application enabled flag | P05 item PI-6 |
| PI-5 | Safety package bump is outside P05's write boundary | Patch proposal; AUTH07 rollout exit stays unmet until its owner applies it |
| U-01 to U-03, U-07, U-08 | Source conflicts and unknown fleet/applicability | Modelled as data; not blocking |

No genuinely missing business information blocks the next phase; no question for the user is pending. Optional later user decision: enable delegated EQ role administration (D-37, off by default).

### Git

Repository `F:\CODEX\EQ_MAINTENANCE`, branch `main`, HEAD `c326b62`. P01 changes are **uncommitted** (left for the orchestrator/user to commit). (Later note, Repair-R01: P01 was committed as `14e86d1`; this line was accurate when written.)

### Next prompt

**R01 Scope and architecture review** (read-only, fresh context; Claude Code profile claude-opus-5-5, high). If PASS, P02 follows; if NEEDS FIXES, Repair then repeat R01.

---

## P00 Source discovery and implementation plan - 21 October 2026

### Runtime record

| Item | Value |
| --- | --- |
| Recommended profile | Codex gpt-6.1-sol, high; Claude Code claude-opus-5-5, high, adaptive thinking |
| Actual client | Claude Code subagent eq-build-opus-high (delegated by the `/eq-phase` orchestrator; prompt logged in `docs/runs/P00-20261021-1248.md`) |
| Actual model / effort | claude-opus-5-5; effort high (per agent definition) |
| Fallback / escalation | None |

### Outcome

P00 complete. The workspace is documents-only (no app, no Git). No application code or scaffold was created, as the phase requires.

### Requirement IDs addressed

Planning coverage for S01-S17 (`docs/IMPLEMENTATION_PLAN.md` s2). Source validation supporting SRC01-SRC03, SRC05, VIS02 inputs. No acceptance case executed.

### Files created (all new; nothing existing was modified)

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DECISIONS.md`
- `docs/SOURCE_MAP.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/HANDOVER.md`
- `docs/evidence/P00/P00_EVIDENCE.md`
- `docs/evidence/P00/taxonomy-validation.json`
- `docs/evidence/P00/drawing-register-check.json`
- `tools/p00/validate_mechanisms.py`
- `tools/p00/verify_drawing_register.py`
- `tools/p00/render_drawing_page.py`
- `artifacts/p00-drawing-crops/` (7 PNG crops of drawing pages, about 1.3 MB)

No file in `documents/`, `As-bulit drawing/`, `tmp/`, `.claude/` or the Portal repository was changed.

### Checks run and results

| Check | Result |
| --- | --- |
| `python -I tools/p00/validate_mechanisms.py --out ...` | 215/215 passed, exit 0 |
| `python -I tools/p00/verify_drawing_register.py --out ...` | 38/38 PDFs, 162/162 pages, 0 checksum or page-count mismatches, exit 0 |
| Visual review of 13 key drawing pages and 2 photos | Done; two new source discrepancies (U-02, U-03) |
| Toolchain inventory (dotnet, node, npm, git, sqlcmd, SQL Express, Python libs, Blender) | Recorded in evidence s5 |
| Version facts from Microsoft support policy, NuGet and npm | Recorded in evidence s6 |
| Portal read-only inspection | Shared contract 0.2.1, validator, issuer, registry, provisioning; analysis in plan s5 |

Evidence type: source review and scripted source validation only. No automated application tests, browser verification, target-environment verification or production acceptance exist.

### Key conclusions for P01

1. Runtime: new EQ app on .NET 10 LTS (support to Nov 2028); .NET 8 ends 10 Nov 2026. A .NET 10 SDK must be installed before P04 (only SDK 8.0.426 is present).
2. Frontend: React 19.3 / Fiber 9.8.1 / drei 10.7.9 / three 0.186.1 / Vite 8.3.3 / TypeScript 6.0.3 (TypeScript 7 is incompatible with typescript-eslint).
3. Model pipeline: deterministic TypeScript procedural generator -> GLB + manifest (no Blender/CAD available).
4. Shared token: one multi-audience token; any consumer with an older contract rejects the whole token of a user holding an EQ role. All consumers must accept the new contract before the issuer is allowed to emit EQ claims (plan s5).
5. Taxonomy reference data is correct as supplied. Two parameter conflicts (gantry speed, trolley motor rating) and several interpretation items remain open (DECISIONS s3).

### Open issues and impact

| ID | Issue | Impact |
| --- | --- | --- |
| U-01, U-02, U-03 | Source parameter conflicts | Displayed as conflicts; not blocking |
| U-07, U-08 | Real fleet identifiers and applicability unknown | Admin inputs; synthetic fixtures for development |
| U-13 | Deployed `CictEng.Auth` versions unknown | P05/P12 compatibility matrix; target check needed before rollout |
| U-14 | ASP.NET Core 10 Hosting Bundle on target unverified | P12 prerequisite |
| U-15 | Neighbouring apps on .NET 8 (EOL 10 Nov 2026) | Outside EQ scope; reported to the user |

No genuinely missing business information blocks the next phase; no question for the user is pending.

### Git

The EQ workspace is not a Git repository (no branch/commit). Recommendation D-17: initialise Git at P04 start. Portal repo observed at `feature/option-b-provisioning-and-login-redesign` / `47f7bd9`, unchanged.

### Next prompt

**P01 Architecture and contract design** (Claude Code profile: claude-opus-5-5, high), followed by R01.
