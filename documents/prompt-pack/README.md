# CICT EQ & FAC Maintenance prompt pack

Prepared 21 October 2026 from the user's SOW, QC drawing set, mechanism table and confirmed clarification answers. Updated to version 2.0 on 22 October 2026 from SOW V2 revision 4 and the facility job list.

Revision 1.1 adds explicit Codex and Claude model/effort recommendations for every build phase, review and helper prompt.

Revision 1.2 records four pre-implementation review decisions, adds user checkpoints U1 and U2, makes job cancellation a required behaviour and aligns the pack with the Claude Code runner in this workspace.

Version 2.0 adds the SOW V2 scope: EQ and FAC sections, the FAC Team role and the in-app Access matrix, the FAC master list, FAC Dashboard and FAC Jobs, the EQ Jobs tab in three parts, ZMMS daily jobs with automatic status, and the spare-part condition register. It adds phases P01B, P02B, R02B (before U1), P07B and P08B, keeps the completed P00-P03, R01 and R02 work valid, and grows the acceptance checklist to 94 cases. See [the changelog](CHANGELOG.md).

The pack is ready to guide implementation. It contains no implemented application, generated crane model or executed application acceptance results.

## Start here

Open [the model and effort guide](MODEL_AND_EFFORT_GUIDE.md), then [the implementation prompt pack](EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md). In a coding assistant working in `F:\CODEX\EQ_MAINTENANCE`, select the phase's recommended model/effort in the client, paste its **Bootstrap prompt**, then **P00**. Continue in the printed run order, one phase at a time. Each prompt contains its own settings recommendation; prompt text does not change actual runtime settings.

The pack provides 18 build phases (P00-P13 plus P01B, P02B, P07B, P08B), six read-only review checkpoints (R01-R05 plus R02B), and reusable Repair and Resume prompts. The full scope and invariants are held in the accompanying documents rather than left to memory between chats. A new chat should receive Bootstrap before its selected phase.

## Your confirmed scope

- QC interactive 3D first; QC, RTG and ES in the fleet register/dashboard and work records.
- A separate app integrated with ENG Portal authentication, central roles, SQL Server technology and IIS hosting patterns.
- EQ Team creates and completes jobs; Admin manages and corrects them with recorded history. No additional completion-approval workflow.
- Preserve supplied codes; main 10 remains unassigned; 048/063 inactive; 061 Spreader; 062 Headblock; applicability configurable by equipment type/model.
- Build simplified models from the drawings with accurate overall proportions, major assemblies and useful simplified internal drill-down.
- No EAM/Maximo work-order reference or sync, and no historical bulk import; history starts at go-live.
- QC main parts are derived from the drawings and confirmed by Admin before use.
- EQ Team can cancel uncompleted jobs they created; Admin cancels any and corrects completed work.
- V2: two sections, EQ and FAC, displayed as "EQ & FAC Maintenance"; Portal roles Admin, Management, EQ Team, FAC Team; tab visibility and optional rights in Admin > Access.
- V2 EQ: special jobs bound to main/sub/part, ZMMS daily jobs read by login twice a day, automatic status with a current-day manual correction, spare-part condition with predicted replacement, no history in the crane view.
- V2 FAC: master list seeded from the facility sheet, frequencies and cycles, quantity progress with optional photos, a moving management dashboard and a phone-first FAC Jobs tab.

## Files

| File | Use |
| --- | --- |
| [Implementation prompt pack](EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md) | Bootstrap, run order, master rules, copy-and-paste build/review prompts |
| [Models and effort by phase](MODEL_AND_EFFORT_GUIDE.md) | Separate Codex/Claude recommendations, exact controls, rationale, fallback and escalation |
| [Machine-readable model profiles](reference/phase-model-settings.json) | 27 profiles covering Bootstrap, 18 build phases, six reviews, Repair and Resume |
| [Approved requirements](APPROVED_REQUIREMENTS.md) | Scope S01-S29, roles and Access matrix, work/status rules, ZMMS, spare parts, FAC, history identity, technical defaults and completion criteria |
| [Facility job list](reference/fac-job-list.json) | Normalised seed of the 111-row facility sheet (114 jobs), frequency list and known source issues |
| [QC modelling brief](QC_3D_MODELLING_BRIEF.md) | Drawing sources, geometry/fidelity, scene bindings, interaction, performance budgets and deliverables |
| [Acceptance checklist](ACCEPTANCE_CHECKLIST.md) | Specific future verification cases and minimum end-to-end demonstration |
| [Approved mechanism data](reference/mechanisms-approved.json) | Seed/reference definitions, source labels, descriptions, parents and active/reserved states |
| [Original mechanism text](reference/mechanisms-original.txt) | Exact copy of the user's two-column-group pasted source |
| [Drawing register](reference/drawing-register.json) | 38 source PDF files, 162 PDF pages, checksums and candidate mechanism mappings |
| [Major parameter observations](reference/major-parameters.json) | Source-linked J526A values, units/conditions and unresolved gantry-speed discrepancy |
| PACK_VALIDATION.md and PACK_MANIFEST.json | Pack consistency results and packaged-file/source checksums |

Keep these files together. The original SOW, SOW V2, facility sheet, drawings and photos remain in this workspace and are referenced by the prompts; the ZIP does not duplicate the large drawing corpus. Reference JSON is planning/seed input, not a command to migrate or populate an unknown database.

## Source limits that matter during implementation

The cover refers to the original 12 STS cranes. It does not establish today's fleet register or compatibility with every QC. The initial model family remains unassigned to real equipment until the appropriate Admin/technical association is established.

The general arrangement gives total lift height as 63 m; that is not overall crane height. Gantry speed is 46 m/min in the overview and 45.5 m/min in the gantry-drive sheet; both observations are preserved. Simplified internals must not be presented as exact vendor geometry.

The current local Portal contract has explicit registered audiences and roles. App onboarding needs a compatibility-tested shared-auth/issuer/provisioning/launcher change, not just an extra navigation tile. P05 handles the local integration; its review explicitly checks existing consumer compatibility.

The technical stack recommendation is React/TypeScript/Vite/Three.js with ASP.NET Core/EF Core and SQL Server. P00 selects current compatible versions and evaluates a supported LTS runtime for the new app without incidentally upgrading neighbouring applications.

## Review and operational boundary

The R prompts inspect evidence without editing. A failing review leads to a concrete repair and a repeat review, not a silent scope change. Run each review in a fresh, independent context; the Claude Code runner in this workspace (see `CLAUDE.md` at the workspace root) does this automatically. U1 and U2 are user checkpoints, not agent prompts.

Build prompts cover local implementation, disposable test data, authenticated browser verification and release preparation. Live IIS changes, production migrations, actual account grants, package publishing and model purchases are not executed by this prompt-pack authoring task. A later operational instruction must identify the intended action/environment.

The earlier source review is [EQ Maintenance requirements review](../EQ_MAINTENANCE_REQUIREMENTS_REVIEW.md). The standalone ZIP retains this note as context; the earlier review itself is outside the prompt-pack folder.
