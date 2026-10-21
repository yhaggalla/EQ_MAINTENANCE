# P01 evidence

Date 21 October 2026. Kind of evidence: **source review and scripted document-consistency checks only**. P01 writes contracts; no application code exists, so there are no application tests, browser checks, target-environment checks or production acceptance. Every acceptance case in `ACCEPTANCE_CHECKLIST.md` remains NOT RUN.

## 1 Deliverables

| File | Purpose |
| --- | --- |
| `docs/ARCHITECTURE.md` | Deployment unit, paths, modules, runtime/package set, pipeline, frontend/viewer, storage, persistence, local same-origin plan, defaults D-19 to D-41, tradeoffs, S01-S17 ownership map |
| `docs/DATA_CONTRACT.md` | Entities/invariants, lifecycles, completion/quantity/correction rules, exact role matrix, profile contract, concurrency/idempotency, history semantics, model contract, frozen keys and deletion rules, imports, enforcement map |
| `docs/API_CONTRACT.md` | Conventions, policies, shapes, all endpoint groups, error catalogue, provisioning and health endpoints |
| `docs/PORTAL_INTEGRATION_PLAN.md` | Current-contract evidence, touchpoint inventory (A/I/W/H/R/E items), consumer matrix, regression cases RC-1 to RC-17, rollout/rollback order, local integration plan |
| `tools/p01/check_contract_coverage.py` | Read-only consistency checker |
| `docs/evidence/P01/contract-coverage.json` | Checker output |

## 2 Checks run

| Check | Command / method | Result |
| --- | --- | --- |
| Workspace state | `git status`, `ls` in `F:\CODEX\EQ_MAINTENANCE` | Branch `main`, HEAD `c326b62` (P00 commit); only `docs/runs/P01-20261021-1314.md` untracked before P01 edits |
| Toolchain recheck | `dotnet --list-sdks` | `8.0.426` only: .NET 10 SDK still missing (D-02, P04 prerequisite) |
| Contract coverage | `python -I tools/p01/check_contract_coverage.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/P01/contract-coverage.json` | First run 8/9: VIS05 was missing from the ownership map (real gap, fixed by adding it to S04/S05/S12). Second run **9/9 passed**: 58 acceptance IDs all mapped; S01-S17 rows present; D-19..D-41 in ARCHITECTURE and DECISIONS; 42 cross-document section references resolve; taxonomy facts 16/43/41/2, reserved 048/063, no main 10, string codes, 061 Spreader, 062 Headblock, ropes 015/024/033 under 01/02/03; approved identifiers present; no secret patterns |
| Diagram syntax | Mermaid validator on all 7 diagrams (system context, module dependencies, model pipeline, ER overview, job state machine, identity sequence, rollout flow) | 7/7 valid |
| Portal read-only inspection | Read `src/CictEng.Auth/*`, Identity token service, catalog seeder, provisioning connectors/options/projection service, runtime registration, administration endpoints (launcher, access-status, delegation), return-URL validator, audit writer, `Program.cs`; Portal.Host `Program.cs`; portal-web `vite.config.ts`, `portalApi.ts`, `App.tsx` (launcher/icons/return); scripts `portal-local.ps1` (structure only, no secret values), `deploy-production-release.ps1`, `build-production-packages.ps1`; `docs/PRODUCTION_BOOTSTRAP_RUNBOOK.md`; `HANDOVER.md` Safety onboarding; test file names | Findings in PORTAL_INTEGRATION_PLAN s1; three new open items U-16, U-17, U-18 |
| Consumer inspection (read-only) | `.csproj` references in UMMS, PayPrep, Safety; Safety provisioning endpoint, credential filter, request-security middleware, access authorization handler, profile provisioner, web session client, bootstrap endpoint | Consumer matrix PORTAL_INTEGRATION_PLAN s5.1; EQ patterns copied from Safety |
| Reference data shape | Python read of `mechanisms-approved.json`, `major-parameters.json`, `drawing-register.json` | Used for DATA_CONTRACT s3.1, s3.8, s12 |

No file in `documents/`, `As-bulit drawing/`, `tmp/`, `.claude/`, the Portal repository or any other repository was modified. No configuration secret values were opened or printed (the local runner was read for structure and port/variable names only).

## 3 Findings worth R01 attention

1. Identity has no path to add a new application to an existing Identity database (U-16) -> P05 item I-5 (idempotent registry migration, application disabled).
2. Portal root deployment mirror-deletes unknown child folders (U-17) -> P05 items R-1/R-2 before any EQ deployment.
3. `access-status` ignores the application enabled flag (U-18) -> P05 PI-6.
4. Portal return-URL validator rejects `%`, which shapes EQ deep links (D-20).
5. `CictEng.Auth` 0.2.1 makes an EQ host fail at startup (unregistered audience); P04 therefore runs fail-closed until P05 delivers 0.3.0 (ARCHITECTURE s11 mode B).
6. Old consumers reject the whole token of any EQ-role user: rollout gated by a disabled registry row and gate G1 (PORTAL_INTEGRATION_PLAN s6). No zero-impact claim is made.
