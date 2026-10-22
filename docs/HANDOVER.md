# Handover

Rolling handover for CICT EQ Maintenance. Each phase appends its record; the newest is first.

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

### Files changed (this run; not committed)

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
| `node tools/p02/check_prototype.mjs` (regression, 5 adapted assertions) | 59/59 PASS |
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

Repository `/home/user/EQ_MAINTENANCE` (F:\CODEX\EQ_MAINTENANCE), branch `main-fpkbjt`, base commit 5895126; all P02B changes of this run are uncommitted (the orchestrator commits).

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
