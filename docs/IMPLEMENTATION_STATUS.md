# Implementation status

Ledger of phases in the prompt-pack run order. A phase is marked complete only when its evidence exists. Last updated: 22 October 2026 (Repair-U1 round 2).

## Phase ledger

| Order | Phase | Status | Date | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | P00 Source discovery and implementation plan | **Complete** | 2026-10-21 | `docs/evidence/P00/`, `artifacts/p00-drawing-crops/`, `docs/IMPLEMENTATION_PLAN.md`, `docs/SOURCE_MAP.md`, `docs/DECISIONS.md` | Documents-only workspace confirmed; taxonomy 215/215 checks; register 38 PDFs/162 pages, 0 mismatches |
| 2 | P01 Architecture and contracts | **Complete** | 2026-10-21 | `docs/ARCHITECTURE.md`, `docs/DATA_CONTRACT.md`, `docs/API_CONTRACT.md`, `docs/PORTAL_INTEGRATION_PLAN.md`, `docs/evidence/P01/` | Contracts only, no code; coverage check 9/9; 7/7 diagrams valid |
| 3 | R01 Scope and architecture review | **PASS** | 2026-10-21 | `docs/evidence/R01/review-20261021-1357.md`, `docs/evidence/R01/repair-20261021-1403.md`, `docs/evidence/R01/review-20261021-1418.md` | First review NEEDS FIXES (F1-F5), repaired, repeat review PASS; N1-N6 carried forward to P07 |
| 4 | P02 UI prototype | **Complete** | 2026-10-21 | `artifacts/prototypes/p02-ui/`, `docs/UX_SPEC.md`, `docs/evidence/P02/` | Synthetic, in-memory prototype; 50/50 browser checks, 37/37 contrast pairs, 70 screenshots; QC viewer is an SVG placeholder |
| 5 | P03 QC model prototype | **Complete** | 2026-10-21 | `docs/evidence/P03/`, `assets/models/source/cict-j526a-sts/`, `tools/model-generator/`, `artifacts/models/cict-j526a-sts-scene/1/`, `artifacts/prototypes/p03-qc-model/` | Drawing-derived CICT-J526A-STS v1 (168 nodes, 135 positions); validator 25/25, bindings 11/11, browser checks 31/31 hardware and 31/31 SwiftShader, no-WebGL pass, P02 regression 50/50; synthetic bindings only |
| 6 | R02 UX and model-fidelity review | **PASS** | 2026-10-21 | `docs/evidence/R02/review-20261021-2052.md` | 6 non-blocking findings (phone status badge, viewer loading state, label clipping, prototype data shortcuts, fleet error time, which QC view to judge) carried to P06/P10 |
| 7 | U1 User checkpoint | **CHANGES REQUESTED (round 2), repaired** | 2026-10-22 | `docs/DECISIONS.md` s4, `docs/evidence/U1/`, `docs/evidence/U1/repair-r2-20261022.md` | Round 1 U1-C01..C08 repaired (3129a73); round 2 U1-C09..C16 repaired (model draft v1 rev 3; P02 58/58, P03 40/40 hardware and SwiftShader); next: repeat U1 (user walkthrough) |
| 8 | P04 App foundation | Not started | | | Needs .NET 10 SDK (D-02) |
| 9 | P05 Portal integration | Not started | | | Only phase allowed to edit the Portal repo |
| 10 | R03 Identity and compatibility review | Not started | | | |
| 11 | P06 Database, catalogue, Admin | Not started | | | |
| 12 | P07 Jobs, status, replacements | Not started | | | |
| 13 | P08 Protected evidence and history | Not started | | | |
| 14 | P09 Fleet and equipment detail | Not started | | | |
| 15 | P10 QC viewer and drill-down | Not started | | | |
| 16 | R04 Workflow/data/access review | Not started | | | |
| 17 | P11 Acceptance and performance | Not started | | | |
| 18 | U2 User checkpoint | Not reached | | | |
| 19 | P12 Release preparation | Not started | | | |
| 20 | R05 Release-readiness review | Not started | | | |
| 21 | P13 Final handover | Not started | | | |

## Requirement status

All S01-S17 are **specified (P01 contracts), not implemented**. Ownership and acceptance mapping: `docs/ARCHITECTURE.md` s15 (supersedes the P00 table in `docs/IMPLEMENTATION_PLAN.md` s2 where they differ).

## Acceptance cases

Every case in `documents/prompt-pack/ACCEPTANCE_CHECKLIST.md` is **NOT RUN**. P00 performed source validation that supports, but does not execute, SRC01-SRC03 (catalogue content verified at file level; no database import exists yet) and SRC05 (both gantry-speed observations confirmed in the drawings). P03 produced prototype-level evidence (synthetic bindings, headless browser on this workstation) supporting VIS01-VIS06 and VIS08-VIS10; they stay NOT RUN until executed against the real app in P10/P11. Repair-U1 re-ran the prototype checks on the revised model (draft v1 rev 2) and added drill-down, toolbar and model-content checks; Repair-U1 round 2 did the same for draft v1 rev 3 (labels after tree selection, Reset, folds, round-2 model content); still prototype-level evidence only.

## Open source issues

U-01 to U-26 in `docs/DECISIONS.md` s3 (U-20 to U-22 added in Repair-U1, U-23 to U-26 in Repair-U1 round 2) (U-16 to U-18 added in P01, all planned P05 Portal items; U-19 girder/trolley-rail elevation interpretation added in P03). None blocks R02. D-02 (.NET 10 SDK missing, rechecked in P01) blocks P04 until installed.

2026-10-21 R01 VERDICT: NEEDS FIXES (eq-review-opus-high) - docs/evidence/R01/review-20261021-1357.md; next: repair R01
2026-10-21 Repair-R01 complete (eq-build-opus-high) - F1-F5 fixed in DATA/API/PORTAL contracts, D-42..D-44 added; evidence docs/evidence/R01/repair-20261021-1403.md; next: repeat R01
2026-10-21 R01 VERDICT: PASS (eq-review-opus-high) - docs/evidence/R01/review-20261021-1418.md; carry N1-N6 to P07; next: P02
2026-10-21 P02 complete (eq-build-sonnet-high) - UX_SPEC.md, prototype and evidence in docs/evidence/P02; decisions D-45..D-54; UX-1 carried to P07; next: P03
2026-10-21 P03 complete (eq-build-opus-high) - QC model v1, generator, manifest, prototype and evidence in docs/evidence/P03; decisions D-55..D-64, U-19; site photos documents/Image_20261021*.jpg used for appearance only; next: R02
2026-10-21 R02 VERDICT: PASS (eq-review-opus-high) - docs/evidence/R02/review-20261021-2052.md; next: U1 user checkpoint
2026-10-21 U1 CHANGES REQUESTED by user: U1-C01..C08 (QC icon, compact fleet, back reach/logo/stairs, 3D re-check, toolbar buttons, operator cabin, tier 1>2>3 label drill-down in both views); next: repair U1
2026-10-22 Repair-U1 complete (eq-build-opus-high) - U1-C01..C08 fixed in the P02 flat view and the P03 model/viewer; decisions D-65..D-72, U-20..U-22; evidence docs/evidence/U1/repair-20261022.md; not committed; next: repeat U1 user checkpoint
2026-10-22 U1 CHANGES REQUESTED (round 2) by user: U1-C09..C16 (tree/labels/reset/fold in both views, load cell position, girder-tail stair, apex, floodlights, elevator, replace ball markers); next: repair U1
2026-10-22 Repair-U1 round 2 complete (eq-build-opus-high) - U1-C09..C16 fixed in the P02 flat view and the P03 model/viewer (draft v1 rev 3); decisions D-73..D-82, U-23..U-26; evidence docs/evidence/U1/repair-r2-20261022.md; not committed by this run; next: repeat U1 user checkpoint
