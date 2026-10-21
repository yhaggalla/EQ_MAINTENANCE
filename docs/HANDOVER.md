# Handover

Rolling handover for CICT EQ Maintenance. Each phase appends its record; the newest is first.

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

Repository `F:\CODEX\EQ_MAINTENANCE`, branch `main`, HEAD `c326b62`. P01 changes are **uncommitted** (left for the orchestrator/user to commit).

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
