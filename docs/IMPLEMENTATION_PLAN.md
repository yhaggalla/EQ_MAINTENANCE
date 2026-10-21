# Implementation plan

Prepared in P00 on 21 October 2026 for CICT EQ Maintenance stage 1. Authorities: the prompt pack in `documents/prompt-pack/` (README, APPROVED_REQUIREMENTS, Master control). Decisions referenced as B-xx, D-xx and U-xx are in `docs/DECISIONS.md`; source references are in `docs/SOURCE_MAP.md`.

## 1 Starting state

- `F:\CODEX\EQ_MAINTENANCE` is a **documents-only workspace**: no application source, no `package.json`, no `.sln`, no model asset and no Git repository. It contains the source authorities (`documents/`, `As-bulit drawing/`), the Claude Code runner (`.claude/`, `tools/run-phase.ps1`, `tools/extract-phase.ps1`, `CLAUDE.md`), the run log `docs/runs/`, and pack-authoring scratch in `tmp/` (preserved, not an authority).
- P00 added only documentation, evidence and read-only validation helpers (`tools/p00/`). No app scaffold exists yet; that starts in P02 (prototype) and P04 (runnable foundation).
- The Portal repository `F:\CODEX\CICT-ENG_MAIN_PAGE` is at branch `feature/option-b-provisioning-and-login-redesign`, commit `47f7bd9`, clean working tree. It was read, not changed.

## 2 Scope S01-S17

| ID | Stage 1 deliverable | Built in | Verified in | Key acceptance cases |
| --- | --- | --- | --- | --- |
| S01 | Configurable QC/RTG/ES register, model families/templates, active/retired equipment | P01 contract, P06 | R04, P11 | ADM01, ADM04, SRC06, VIS07 |
| S02 | Fleet overview: type groups, search, status counts, last update, no per-card canvas | P02 prototype, P09 | R02, R04, P11 | OPS01, OPS02, VIS10 |
| S03 | Exactly three operational statuses plus visible Unreported; status history and time-in-status | P01, P07, P09 | R04, P11 | JOB02, JOB13, OPS01 |
| S04 | Authenticated selectable QC model `CICT-J526A-STS`, named assemblies, orbit/pan/zoom, reset/fit | P03 prototype, P10 production | R02, R04, P11 | VIS01, VIS02, VIS04, VIS06, VIS08, VIS09, OPS03 |
| S05 | Equipment -> main -> sub -> main part navigation; tree and scene share one selection | P01, P06, P10 | R02, R04 | SRC01-SRC03, ADM02, ADM03, VIS03 |
| S06 | Overall and Technical modes with simplified internals and verified specifications | P03, P10 | R02, R04 | VIS03, VIS04 |
| S07 | Scoped history panel (direct + descendant; exact part) | P01, P08, P10 | R04 | HIS01-HIS05 |
| S08 | Jobs workspace: Pending/Current/Completed, Include cancelled, filters | P02, P07 | R04, P11 | JOB01, JOB03, JOB12 |
| S09 | EQ Team create/edit/progress/complete/cancel-own; set operational status | P07 | R04, P11 | JOB01-JOB13, AUTH03 |
| S10 | Admin: equipment, applicability, catalogue, positions, parameters, bindings, corrections | P06, P07 | R04, P11 | ADM01-ADM06, JOB09 |
| S11 | Management read-only, enforced server-side | P04 policies, P05, P07, P08 | R03, R04 | AUTH02, AUTH03, FILE02 |
| S12 | Equipment-specific positions, installations and replacement events | P01, P06, P07 | R04 | ADM02, JOB04-JOB06, JOB09, JOB10, HIS01, HIS03 |
| S13 | Audit, concurrency tokens, idempotent atomic completion, audited correction | P01, P07 | R04, P11 | JOB05-JOB09, JOB11, AUTH06 |
| S14 | Source-linked parameters with observations/conflicts; protected drawings/photos | P06, P08 | R04, P11 | SRC05, ADM06, FILE01-FILE05 |
| S15 | Central Portal sign-in, registered app/audience/roles, subject-keyed provisioning, same-origin routing | P01 plan, P05 | R03 | AUTH01-AUTH07 |
| S16 | Responsive, keyboard-accessible workflows; useful non-3D fallback | P02, P09, P10 | R02, P11 | OPS02, VIS07, VIS08 |
| S17 | Tests, reproducible model build, measured performance, release/rollback package | P03, P11, P12 | R05 | VIS09, VIS10, OPS03-OPS06 |

Out of scope for stage 1 (APPROVED_REQUIREMENTS s2): live PLC/SCADA/IoT, remote control, structural calculations or certification, predictive maintenance, EAM/Maximo references or sync, historical bulk import, procurement/stock, full PM scheduling, costs, public registration, RTG/ES 3D.

## 3 Phase order and dependencies

| Order | Phase | Depends on | Exit gate |
| --- | --- | --- | --- |
| 1 | P00 source discovery and plan | pack documents | This plan, DECISIONS, SOURCE_MAP, status, handover, evidence (done) |
| 2 | P01 architecture, data, API, authorization and Portal-integration contracts | P00 | ARCHITECTURE, DATA_CONTRACT, API_CONTRACT, PORTAL_INTEGRATION_PLAN written; every S mapped |
| 3 | R01 scope/architecture review | P00, P01 | PASS (else Repair + repeat R01) |
| 4 | P02 UI prototype (synthetic fixtures, no persistence claims) | R01 PASS | Runnable prototype + screenshots, UX_SPEC |
| 5 | P03 QC model prototype from drawings | R01 PASS; P02 shell for integration if practical | Generator, GLB, manifest, provenance table, aligned views, counters |
| 6 | R02 UX and model-fidelity review | P02, P03 | PASS |
| 7 | U1 user checkpoint | R02 PASS | User approval recorded in DECISIONS s4 |
| 8 | P04 runnable app foundation (.NET 10 SDK installed first, D-02) | U1 | Builds/tests green; subpath, policies, disposable DB tooling |
| 9 | P05 Portal sign-in and provisioning (only phase that edits the Portal repo) | P04 | Local Portal -> EQ sign-in; compatibility matrix and rollout plan |
| 10 | R03 identity and compatibility review | P05 | PASS; unresolved cross-repo upgrade = explicit unmet exit |
| 11 | P06 database, catalogue, equipment, Admin | R03 PASS | Migrations, idempotent imports, Admin UI on disposable SQL Server |
| 12 | P07 jobs, status, replacements | P06 | Transactions, idempotency, concurrency, corrections, cancellation tested |
| 13 | P08 protected evidence and scoped history | P07 | File authorization and history queries tested |
| 14 | P09 real-data fleet and equipment detail | P08 | Real API data, counts, freshness, fallbacks |
| 15 | P10 production QC viewer and drill-down | P09, P03 asset | Scene/tree/history binding with persisted identities |
| 16 | R04 workflow/data/access review | P06-P10 | PASS |
| 17 | P11 acceptance, accessibility, performance | R04 PASS | TEST_REPORT, acceptance evidence table |
| 18 | U2 user checkpoint (minimum demonstration script) | P11 | User approval recorded |
| 19 | P12 release and rollback preparation | U2 | Package, manifests, deployment/rollback/guide docs (no deployment) |
| 20 | R05 release-readiness review | P12 | PASS |
| 21 | P13 final corrections and handover | R05 PASS | Final handover; honest completion statement |

## 4 Repository and validation boundaries

### 4.1 Repository write boundaries

| Repository | P00-P04 | P05 | P06-P13 |
| --- | --- | --- | --- |
| `F:\CODEX\EQ_MAINTENANCE` (except `documents/`, `As-bulit drawing/`) | write | write | write |
| `documents/`, `As-bulit drawing/` | read only, always | read only | read only |
| `F:\CODEX\CICT-ENG_MAIN_PAGE` | read only | narrow writes: shared contract, issuer registry/seed, EQ provisioning connector, launcher registry, tests, local runner option | read only unless a later user instruction |
| UMMS `F:\CODEX\EAM_emmergancy_mat_tracker_WEBAPP`, PayPrep `F:\CODEX\PAYMENT_AUTOMATION_V2\PayPrep_Assistant`, Safety `F:\CODEX\RECTIFICATION_PROGRESS_TRACKER` | read only | read only; required upgrades become a patch/dependency proposal | read only |

### 4.2 Exact local validation boundaries

| Kind of check | Allowed | Not allowed |
| --- | --- | --- |
| Source/document review | Any local file read; drawing renders to the scratchpad or `artifacts/` | Editing source authorities |
| Builds and unit tests | `dotnet build/test`, `npm ci/lint/test/build` inside this workspace (and in the Portal repo in P05 only); one full .NET build at a time per output folder | Concurrent builds sharing outputs |
| Database | `.\SQLEXPRESS` databases named `EqMaintenanceDisposable_*` created by EQ tooling and carrying the EQ marker table (D-08); throwaway test databases created and dropped by test fixtures | Any SQL against existing databases (`CictEng*`, `UrgentMaterials*`, `PayPrep`, `EngineeringPaymentAssistant`, `CictSafety*`, others); startup migrations; seeding an unknown target |
| Identity integration (P05) | An isolated, newly named local Identity database and synthetic users; generated local-only provisioning credentials kept under an ignored runtime folder | Re-seeding `CictEngIdentityLocalPreview` or binding to existing UMMS/PayPrep databases through the stock `portal-local.ps1 start`; real credentials |
| Browser verification | Local processes on 127.0.0.1 ports started by this task (D-09) and stopped afterwards | Shared/production hosts; the internal IIS site at `10.96.40.224` |
| Release (P12) | Build a local package and manifests | Deploying, IIS changes, live migrations, role grants, publishing packages, buying models |

Evidence types are reported separately: source review, automated tests, local authenticated browser verification, target-environment verification and production acceptance. Only the first three can occur before an authorized deployment.

## 5 Shared-token compatibility (input to P01/P05)

Findings from the local Portal source (SOURCE_MAP s7):

1. The Identity issuer writes **one** access token per session into one shared cookie (`CictEng.Access.Dev` over HTTP, `__Host-CictEng.Access` over HTTPS). Its `aud` array contains `urn:cict-eng:portal` plus every enabled application for which the user holds an enabled role (and, for apps with a binding claim, a Ready provisioning projection). Its `cict:roles` array contains all of those roles.
2. Every consumer's `SharedAccessTokenProfileValidator` rejects the **entire token** if any `aud` value or any role code is absent from that consumer's compiled `SharedAuthContract`. Unknown extra claims (for example a new binding claim) are not checked.
3. Projects referencing the contract found locally: Identity (validates Portal-audience tokens in `Authentication/IdentityRuntimeExtensions.cs` and issues tokens; project reference), Portal.Host (project reference; reads only the audience count, no token validation found), UMMS API and PayPrep API (source `ProjectReference` into the Portal repo's `src/CictEng.Auth`), Safety API (NuGet package `CictEng.Auth` 0.2.1). Deployed versions are not established (U-13).

Impact: if the issuer starts emitting `urn:cict-eng:eq-maintenance` and `eq-maintenance:*` roles while any deployed validating consumer still runs a contract without them, **every user granted an EQ role is rejected by that consumer** (UMMS, PayPrep or Safety). Identity issues and validates with the same compiled contract, so it is updated in the same release. Users without an EQ role are unaffected because their tokens do not change.

Required approach (P05 implements and tests locally; P12 sequences the real rollout):

1. Add the EQ audience, three role codes, `ApplicationCodeForAudience` entry and binding claim to `CictEng.Auth` as a new version (proposed 0.3.0) without relaxing any check.
2. Rebuild every consumer against the new contract **before** EQ issuance is enabled: Identity and Portal.Host (Portal repo), UMMS and PayPrep (their source references pick up the change on rebuild but still require their owners' rebuild and redeploy), Safety (package bump in its repo, outside P05's write boundary, so a patch proposal).
3. Only after all consumers accept the contract: register and enable the `eq-maintenance` application and roles in the Identity registry, then grant roles. Rollback reverses the order (revoke grants / disable application first, then roll back binaries).
4. P05 adds regression tests: an old-contract validator receiving an EQ-bearing token (expected rejection, documenting the hazard), a new-contract validator for each audience accepting it, and the issuer refusing to emit EQ claims while the application is disabled.
5. Integration is not claimed complete while any intended consumer would reject the token (Master control).

## 6 Toolchain and version baseline

| Item | Installed / available on 21 Oct 2026 | Plan |
| --- | --- | --- |
| .NET SDK | 8.0.426 only | Install .NET 10 SDK before P04 (D-01, D-02) |
| .NET runtimes | NETCore.App 7.0.20, 8.0.32, 10.0.13; AspNetCore.App 8.0.32 only | ASP.NET Core 10 runtime arrives with the SDK |
| Node / npm | 24.15.0 / 11.12.1 | Use as is (D-05) |
| SQL Server | Express 2022 16.0.4305.5 at `.\SQLEXPRESS`, running; `sqlcmd` 16 | Disposable `EqMaintenanceDisposable_*` databases only (D-08) |
| Python | 3.12.1 with PyMuPDF 1.28.0, pypdf 6.14.2, Pillow | Drawing renders and source validation helpers |
| Git | 2.54.0 (workspace not a repo) | Initialise in P04 (D-17) |
| Blender / CAD | not installed | Procedural TypeScript generator (D-10) |
| Frontend packages | see D-04 | P04 pins and locks after clean install |

## 7 Risks

| Risk | Impact | Mitigation | Phase |
| --- | --- | --- | --- |
| Shared-token rollout breaks existing consumers for EQ-role users | High | Section 5 sequencing and tests; no validator weakening | P01, P05, R03, P12 |
| `CictEng.Auth` (net8.0, JwtBearer 8.0.15) used from a net10.0 host | Medium | Prove build and validation tests under ASP.NET Core 10 in P05; otherwise propose a multi-targeted contract package | P04, P05 |
| Target IIS lacks ASP.NET Core 10 Hosting Bundle (U-14) | Medium | Listed as target prerequisite; not assumed | P12 |
| Neighbouring apps' .NET 8 end of support on 10 Nov 2026 (U-15) | Outside EQ scope | Reported only | n/a |
| Drawing-derived geometry misread or over-precise | Medium | Provenance table with measured/derived/estimated labels; R02 aligned-view comparison | P03, R02 |
| Fixture data mistaken for real fleet | Medium | Synthetic `*-DEMO-*` codes, separate fixture command, excluded from release | P06, P12 |
| Spreaders move between cranes (U-09) | Low | Position-based installation model (D-16) | P01, P06 |

## 8 Evidence locations

- P00 evidence: `docs/evidence/P00/` (summary `P00_EVIDENCE.md`, `taxonomy-validation.json`, `drawing-register-check.json`).
- Drawing reference crops: `artifacts/p00-drawing-crops/` (reproducible with `tools/p00/render_drawing_page.py`).
- Later phases: `docs/evidence/<phase>/`, generated outputs under `artifacts/`, exact prompts under `docs/runs/`.
