# CICT EQ & FAC Maintenance implementation prompt pack

Version 2.2 | 24 October 2026 | SOW V2 revision 6 temporary pre-U1 management walkthrough; revision 4 permanent scope: EQ and FAC sections, feature permissions, ZMMS daily jobs, automatic status, spare-part condition; approved stage 1 scope, review decisions, user checkpoints and per-phase model settings

Build an independently deployable ENG Portal app, displayed as "EQ & FAC Maintenance", with two sections. EQ: fleet readiness, special maintenance jobs, ZMMS daily jobs, automatic status, spare-part condition and component replacement history, with QC interactive 3D and QC/RTG/ES register/dashboard/workflows. FAC: facility inspection/service jobs with a moving management dashboard. The user's answers to the scope, review and SOW V2 questions are recorded in `APPROVED_REQUIREMENTS.md`.

This is an implementation instruction pack, not an implemented app. Use the supplied drawings to create the QC geometry and use the supplied coded mechanism hierarchy to classify records.

## How to run the pack

1. Read `README.md`, `APPROVED_REQUIREMENTS.md` and `MODEL_AND_EFFORT_GUIDE.md`. Select the model/effort assigned to the phase.
2. In a coding assistant with workspace access, paste the Bootstrap prompt below once, followed by P00. Continue with one labelled prompt at a time in the run order.
3. At a review checkpoint, run its review prompt in a fresh, independent context. The Claude Code runner in this workspace (`/eq-phase` or `tools\run-phase.ps1`, described in `CLAUDE.md`) does this with the phase's model and effort; in any other client, open a fresh chat manually.
4. Resolve blocking findings using the Repair prompt, then repeat the failed checkpoint. Do not skip a checkpoint because builds are green.
5. If context is lost, use the Resume prompt. Preserve the phase ledger and handover rather than restarting or rebuilding completed stages.
6. Stop at the user checkpoints U1 (after R02B) and U2 (after P11). They are not agent prompts: the user inspects the result and records approval or change requests in `docs/DECISIONS.md`. Do not start the next phase until that approval is recorded. Change requests go through Repair against the affected phase.

For a fresh coding chat, paste Bootstrap again before the selected phase. Each phase assumes the master control and linked local documents are available. Finish only the selected phase; do not turn one pasted phase into an unbounded all-stage run.

### Run order

| Order | Prompt | Result |
| --- | --- | --- |
| 1 | P00 | Source discovery and implementation plan |
| 2 | P01 | Architecture, data, API and authorization contracts |
| 3 | R01 | Scope and architecture review |
| 4 | P02 | Reviewable UI prototype |
| 5 | P03 | Drawing-grounded QC model prototype |
| 6 | R02 | UX and model-fidelity review |
| 7 | P01B | V2 contracts addendum: sections, Access matrix, FAC, ZMMS, automatic status, spare parts |
| 8 | P02B | V2 prototype: section switch, FAC Dashboard and FAC Jobs, EQ Jobs in three parts, crane view without history |
| 9 | R02B | V2 contracts and prototype review |
| 10 | U1 | User checkpoint: complete temporary management walkthrough and remove its full layer; retain accepted EQ/FAC refinements and verify cleaned app, then inspect EQ/FAC prototype and QC model; explicit approval or changes |
| 11 | P04 | Runnable application foundation |
| 12 | P05 | Portal authentication and provisioning integration |
| 13 | R03 | Identity and existing-app compatibility review |
| 14 | P06 | Database, catalogue, equipment, Access matrix and Admin workflows |
| 15 | P07 | Special jobs, status and replacement workflows, spare-part condition |
| 16 | P07B | ZMMS daily jobs and automatic status |
| 17 | P08 | Protected drawings, attachments and scoped history |
| 18 | P08B | FAC jobs, cycles, progress and photos |
| 19 | P09 | Real-data fleet dashboard, equipment detail and FAC Dashboard |
| 20 | P10 | Production-code QC viewer and current-state drill-down |
| 21 | R04 | Full workflow, data isolation and file-access review (EQ, ZMMS and FAC) |
| 22 | P11 | Acceptance tests, accessibility and measured performance |
| 23 | U2 | User checkpoint: walk through the working local app using the minimum demonstration script; approve or request changes |
| 24 | P12 | Local release package, migration and rollback preparation |
| 25 | R05 | Release-readiness review |
| 26 | P13 | Resolve accepted findings and deliver final handover |

The 18 build prompts are P00-P13 plus the V2 additions P01B, P02B, P07B and P08B. The six R prompts (R01-R05 and R02B) are review-only. U1 and U2 are user checkpoints with no agent prompt. Repair and Resume are reusable helper prompts. P00-P03, R01 and R02 were completed under pack 1.2; their results stay valid and P01B/P02B extend them.

### Temporary work inside the open U1 checkpoint

Follow `TEMP_MANAGEMENT_WALKTHROUGH.md` for U1-T01 BUILD and REMOVE. These are bounded tasks under the existing affected-prototype Repair workflow, not additional permanent phases or a substitute for P05. The temporary build is not started by this documentation revision. Before U1 approval, TD07-TD08 must prove that every temporary entry screen/asset/hook/state was removed while accepted EQ/FAC refinements since `8303f8b8a55f41983bdcc77363ddbf13d2892383` were retained. Record the cleaned app commit/tree and request evidence; defer login/Portal feedback to P05. Preserve these historical instructions after removal. No phase/profile count changes.

## Models and effort by phase

Choose one platform per phase. These are recommended starting settings, not a claim that both providers are required or that a prompt changes the active model. Select the actual model/effort in the client. High and Extra high are not equivalent capability/cost measures across providers.

See [the model and effort guide](MODEL_AND_EFFORT_GUIDE.md) for rationale, exact client controls, fallbacks, escalation and current official documentation. Full machine-readable profiles are in `reference/phase-model-settings.json`. Model names/control support were checked on 21 October 2026; availability depends on your client/account.

| Prompt | Codex model | Codex effort | Claude model | Claude effort |
| --- | --- | --- | --- | --- |
| Bootstrap | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| P00 | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| P01 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| R01 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P02 | GPT-6.1 Sol | High | Claude Sonnet 5.5 | High |
| P03 | GPT-6 Astra | Extra high (`xhigh`) | Claude Opus 5.5 | High |
| R02 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P01B | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P02B | GPT-6.1 Sol | High | Claude Sonnet 5.5 | High |
| R02B | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P04 | GPT-6.1 Sol | High | Claude Sonnet 5.5 | Medium |
| P05 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| R03 | GPT-6 Astra | Extra high (`xhigh`) | Claude Opus 5.5 | Extra high (`xhigh`) |
| P06 | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| P07 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P07B | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P08 | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| P08B | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| P09 | GPT-6.1 Sol | High | Claude Sonnet 5.5 | Medium |
| P10 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| R04 | GPT-6 Astra | Extra high (`xhigh`) | Claude Opus 5.5 | Extra high (`xhigh`) |
| P11 | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| P12 | GPT-6.1 Sol | High | Claude Sonnet 5.5 | High |
| R05 | GPT-6 Astra | High | Claude Opus 5.5 | High |
| P13 | GPT-6.1 Sol | High | Claude Sonnet 5.5 | High |
| Repair (inherit stronger affected-phase settings) | GPT-6.1 Sol | High | Claude Opus 5.5 | High |
| Resume | GPT-6.1 Sol | Medium | Claude Sonnet 5.5 | Medium |

Use Resume only to recover context; switch to the selected build/review profile before doing its work. Complex corrective work in P13/Repair inherits the affected phase profile. Max/Ultra are not defaults. Compare increased effort against High using actual acceptance cases.

## Bootstrap prompt

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

You are the senior full-stack developer and technical 3D designer implementing CICT EQ & FAC Maintenance (technical code eq-maintenance).

Work in F:\CODEX\EQ_MAINTENANCE. Read applicable AGENTS.md or CLAUDE.md instructions and inspect the current working tree before edits. Follow later explicit user instructions over this pack.

Read these local documents before carrying out a phase:
F:\CODEX\EQ_MAINTENANCE\documents\prompt-pack\APPROVED_REQUIREMENTS.md
F:\CODEX\EQ_MAINTENANCE\documents\prompt-pack\QC_3D_MODELLING_BRIEF.md
F:\CODEX\EQ_MAINTENANCE\documents\prompt-pack\ACCEPTANCE_CHECKLIST.md
F:\CODEX\EQ_MAINTENANCE\documents\prompt-pack\MODEL_AND_EFFORT_GUIDE.md
F:\CODEX\EQ_MAINTENANCE\documents\prompt-pack\EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md

Use these authorities:
- Original SOW (V1): F:\CODEX\EQ_MAINTENANCE\documents\SOW.docx
- SOW V2 revision 6 (section 2A temporary walkthrough; permanent revision 4 scope retained; wins over V1 where they differ): F:\CODEX\EQ_MAINTENANCE\documents\SOW_V2.docx (same text: SOW_V2.md)
- Facility job list: F:\CODEX\EQ_MAINTENANCE\documents\Facility- Dashboard.xlsx, normalised in documents\prompt-pack\reference\fac-job-list.json
- Engineering references: F:\CODEX\EQ_MAINTENANCE\As-bulit drawing
- Approved taxonomy and original pasted list: documents\prompt-pack\reference
- Appearance photos: documents\images.jpg and documents\images2.jpg
- Existing Portal integration source: F:\CODEX\CICT-ENG_MAIN_PAGE

The five business decisions are settled: QC 3D first; QC/RTG/ES fleet support; separate Portal-integrated app; EQ Team creates/completes jobs with Admin correction/history; preserve the approved mechanism codes and names; build simplified but proportionally accurate QC geometry and useful simplified internals. The pre-implementation review decisions are also settled: no EAM/Maximo work-order reference or synchronisation; no bulk import of historical records; QC main parts derived from the drawings for Admin review; EQ Team may cancel uncompleted jobs they created, with a reason. The SOW V2 decisions are settled too (APPROVED_REQUIREMENTS s1): EQ and FAC sections; Portal roles Admin, Management, EQ Team and FAC Team with an in-app Access matrix; FAC master list seeded from the supplied sheet; FAC frequencies and next-due rules; EQ Jobs tab in three parts; ZMMS daily jobs read by login twice a day; automatic status with a current-day manual correction; spare-part condition with expected-life prediction; no history in the crane view. Do not ask those questions again.

Apply the Master control below to every build/review prompt. Execute only the phase supplied with this Bootstrap. Make reasonable routine technical choices and document them. Ask only for genuinely missing business information that cannot be resolved from the sources, while continuing independent authorized work. Do not invent exact geometry, fleet facts, current condition or deployment success.
```

## Master control

### Scope and workspace rules

- Complete the selected phase with reviewable deliverables. Preserve unrelated work and original drawings/SOW. Do not implement deferred RTG/ES 3D, live telemetry or a full CMMS because the app has a maintenance name.
- P00-P04 inspect the Portal read-only. P05 is the explicitly identified local Portal integration phase; use narrowly scoped changes in the Portal repository and this app. Other existing app repositories remain read-only unless a later user instruction authorizes a necessary compatibility fix there.
- If shared-token compatibility requires changes beyond those two repositories, prepare the exact consumer/version dependency and concrete patch proposal; finish all independent EQ work. Do not weaken validation or claim integration is complete while an existing consumer will reject the token.
- Local builds, fixtures, prototypes and disposable development/test databases are part of implementation. Use a dedicated database name and prove the target is disposable before migrations or seed operations. No startup migration or fleet/status seeding against an unknown connection.
- These prompts prepare local source and releases. Do not deploy, change live IIS, issue SQL against shared/production records, publish packages, or purchase external models unless a later user instruction explicitly authorizes that action.
- Keep all credentials, connection strings, keys and runtime tokens outside source and outputs. Never print them. Central authentication owns credentials; the EQ app does not create another production password flow.
- ZMMS (https://www.zmms.lk) is the only external system the app reads. Only P07B and later checks of it contact ZMMS, only through the connector with the account from runtime configuration, only the login and the daily all-job list, and never write. Every other phase and every automated test uses sanitised fixtures. The ZMMS account is never requested in chat, committed, printed or stored in evidence.
- Use existing source patterns where compatible, but recheck current contracts and dependency/runtime support. Do not treat old handover claims as live proof. Do not upgrade neighbouring apps incidentally.

### Temporary presentation exception and U1 removal gate

SOW V2 revision 6 section 2A and `TEMP_MANAGEMENT_WALKTHROUGH.md` authorize only a local presentation shell at port 5312. Show the existing Portal login design, accept blank/arbitrary input without validation or credential requests, show three inert existing-app cards plus EQ & FAC Maintenance, then enter the unchanged prototype default. No Portal administration/users/roles/password features or real authentication/integration; the Portal source remains read-only. Preserve existing EQ/FAC behaviour and use the manifest-based isolation/removal procedure.

Before recording U1 approval, remove all temporary screens, copied assets, wiring, bypass state/flags and hooks; verify direct EQ/FAC entry and reconcile the cleaned app with initial baseline `8303f8b8a55f41983bdcc77363ddbf13d2892383` plus accepted EQ/FAC U1 refinements (TD07-TD08). Preserve accepted changes even in mixed files; record the exact cleaned commit/tree. Login/Portal feedback is deferred to P05; see `docs/MANAGEMENT_FEEDBACK.md` in the EQ workspace. Retain docs/evidence and unrelated work. This narrow prototype exception does not relax permanent authentication/file-access rules or complete P05. A management demonstration, passing temporary checks or this document revision is not U1 approval.

### Persistence and evidence

Create and maintain `docs/IMPLEMENTATION_STATUS.md`, `docs/DECISIONS.md` and `docs/HANDOVER.md` as part of P00 and subsequent phases. Use `docs/evidence/<phase>/` for concise reports and `artifacts/` for generated visual/model/test outputs. Keep secrets and large temporary files out of commits.

Every phase handover records: recommended profile, actual model/effort if known, client and any fallback/escalation; requirement IDs; exact files changed; commands/checks and results; UI/model evidence where relevant; open issues and their impact; current branch/commit if Git exists; and the next prompt. Distinguish source review, automated tests, local authenticated browser verification, target-environment verification and production acceptance. A screenshot, HTTP 200, mock fixture or successful build alone does not prove the whole workflow.

Do not claim a test was run if it was only specified. Report the actual failure/limitation and complete independent work. Run appropriate checks once changes settle; repeat or broaden them when new changes or a specific risk justify it. Avoid concurrent full .NET builds using the same outputs.

### Data and visual invariants

- Codes are strings. Exactly 16 supplied main codes and 43 supplied subcodes, with 048/063 inactive. Main 10 stays absent. Approved names: 061 Spreader and 062 Headblock.
- Definitions/templates are not installed positions. Maintenance history belongs to stable equipment-specific instances.
- Model scene nodes map through stable semantic keys and equipment bindings. No history keyed by a mesh array index or label.
- Operational status is independent of job status. No automatic Ready for OPS on job completion.
- Replacement completion is atomic and retry-safe; corrections preserve prior values and subsequent installation events.
- Use actual CICT appearance and drawing proportions. Total lift height 63 m is not overall crane height. Keep source conflicts/approximate internals qualified.
- Management is read-only in the API. Enforce writer/Admin permissions and the Access matrix on every relevant endpoint, export and file link, not just tabs. The matrix never widens a Portal role ceiling.
- A ZMMS sync that fails or is partial changes no stored data or status. A manual status correction lasts for the current Asia/Colombo day only.
- The crane view shows current state, not work history; scoped history lives in the EQ Jobs tab under the same identity and de-duplication rules.
- FAC progress never exceeds the job quantity; corrections keep prior values; next due derives from recorded completion dates, not from typed sheet values.
- All drawing, model and work-evidence access must obey the app's authentication/authorization boundary.

### Review decision format

For every R prompt, use read-only review. Return actionable findings ordered by severity with file/line or precise artifact evidence, trigger, consequence and needed correction. Explicitly distinguish a proven bug from an unresolved question. Finish with PASS or NEEDS FIXES and the acceptance IDs evaluated. Blocking defects include wrong scope, broken history identity, authorization bypass, data corruption, fabricated verification, a generic/misidentified QC model and incompatible shared-token rollout. Do not invent findings to fill a quota.

## P00 Source discovery and implementation plan

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P00 under the Bootstrap and Master control. This phase is source discovery and planning; do not scaffold the app yet.

Read the approved requirements and the existing requirements review. Inventory the current workspace, governing instructions, Git state and any existing code. Preserve existing work. If this is still a documents-only workspace, say so rather than assuming a React project exists.

Validate reference/mechanisms-approved.json against mechanisms-original.txt and the confirmed decisions. Confirm 16 main codes, 43 subcodes, 41 active, two reserved, string codes, preserved parent relationships and the three separate rope categories. Verify both four-column halves and continued descriptions were parsed correctly.

Read relevant full drawing pages at legible resolution. Use the drawing register to locate overall structure, hoist, trolley, boom, gantry and headblock references. Record source page/drawing numbers. Confirm the first template's scope and the major parameter observations; retain the gantry-speed conflict rather than choosing a value silently.

Inspect the current Portal README, shared-auth contract/profile validator, Identity issuer, application/role registry and provisioning connector patterns. Read them as current local code, not production evidence. Do not print configuration secrets. Identify existing consumers of the shared validation contract and the impact of adding an audience/role.

Check installed tools and supported version compatibility. Recommend a supported ASP.NET Core/EF Core LTS runtime with SQL Server and a compatible React/Vite/Three.js/Fiber set. Evaluate .NET 10 for this new app without upgrading the Portal. Decide a reproducible procedural or editable-asset model pipeline from available tools. Use primary documentation for current version facts.

Produce:
1. docs/IMPLEMENTATION_PLAN.md with scope S01-S17, phase order, dependencies and exact local validation boundaries.
2. docs/DECISIONS.md separating confirmed business choices, routine implementation defaults and unresolved source facts.
3. docs/SOURCE_MAP.md linking requirements, taxonomy, drawing pages and model-family assumptions.
4. Initial IMPLEMENTATION_STATUS.md and HANDOVER.md, marking P00 complete only when its evidence exists.

Resolve routine choices yourself. Missing current fleet identifiers or per-model applicability should become configurable Admin inputs and clearly marked development fixtures; do not block the architecture waiting for a production fleet export.
Finish with the plan, evidence locations, unresolved blockers if any and P01 as the next step.
```

## P01 Architecture and contract design

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P01 under the Bootstrap and Master control. Complete reviewable technical contracts before implementation.

Design one independently deployable EQ app with an ASP.NET Core host, React/TS frontend, SQL Server persistence, protected evidence storage and a Three.js-based QC viewer. Record the selected runtime/package compatibility, app base path and local same-origin development plan. Keep architecture proportionate; do not split this into microservices.

Specify entities and invariants for equipment types/model templates, equipment, main/sub definitions and instances, maintainable part positions, current installation/installation history, jobs and replacement lines/events, operational-status history, source parameters/observations, protected documents, model versions/node bindings, user projections and audit. Decide how quantity-based positions differ from serialized positions. Freeze stable keys and deletion/deactivation rules.

Specify the exact three-role server matrix from the approved requirements, central subject/local profile contract, idempotent provisioning, concurrency responses and allowed job/status transitions. The completed-work correction operation must preserve history and refuse to overwrite later physical installation events.

Write an API contract with endpoints, authorization, request/response shapes, pagination/filtering, errors, concurrency tokens and completion idempotency. Cover fleet summary, equipment/status, hierarchy, Admin catalog, jobs, completion/correction, history, technical parameters and protected file retrieval. Scope all targets to their equipment and de-duplicate descendant rollups.

Write the model contract: semantic position keys, equipment-instance bindings, model/version validation, main/sub/part picking, group union bounds, overall/technical modes and fallback. Separate spatial containers from coded mechanisms.

Design Portal onboarding using the current registered audience/role and profile-provisioning patterns. Proposed code/path: eq-maintenance and /eq-maintenance. Identify every registration/issuer/validator/launcher/local-runner/package touchpoint and token-compatibility dependency. Preserve strict validation. Include old-consumer/new-token regression cases and a compatible rollout sequence.

Produce docs/ARCHITECTURE.md, docs/DATA_CONTRACT.md, docs/API_CONTRACT.md and docs/PORTAL_INTEGRATION_PLAN.md with the needed diagrams/tables. Record technical defaults and map every S requirement to owning components and acceptance cases. Do not edit app or Portal implementation in this phase.
Finish with R01-ready evidence, concrete tradeoffs and the next prompt.
```

## R01 Scope and architecture review

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute R01 as a read-only review under the Master control. Review P00/P01 outputs against the original sources, confirmed answers and approved requirements.

Check scope coverage S01-S17, appropriate stage 1 limits, exact taxonomy counts/codes, configurable applicability and fleet/model assignment, source parameter provenance, equipment-specific positions, quantity-based replacements, history preservation, role enforcement, transaction/idempotency/concurrency design and model-binding stability.

Check that same-origin paths and central auth are concrete, and that new audiences/roles cannot be emitted into shared tokens without accounting for old consumer validators. Reject an invented standalone login, permissive token parser or unqualified zero-impact onboarding claim.

Verify that unresolved exact geometry, current fleet identifiers and the speed discrepancy are honestly modelled without blocking unrelated implementation. Reject assumptions that 63 m is overall crane height or that the 12-crane drawing family applies to every QC.

Report evidence-based findings and PASS/NEEDS FIXES. No source edits. If PASS, P02 is next. If NEEDS FIXES, name the smallest corrections and use Repair before repeating R01.
```

## P02 Reviewable UI prototype

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-sonnet-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P02 under the Bootstrap and Master control. Create a reviewable interface prototype before implementing the production workflows.

Use the Portal's current visual patterns/tokens where available. Design for management fleet scanning and quick EQ Team entry, with restrained industrial styling and readable text. Do not turn this into a marketing landing page.

Create connected prototype views for:
- Fleet dashboard with QC/RTG/ES groups, status counts, search/filter, last update and equipment links.
- QC detail with mechanism tree, central 3D area, overall/technical controls, breadcrumbs and right-side history/technical panel.
- RTG/ES detail with complete record navigation and an honest stage-1 3D-unavailable state.
- Pending/Current/Completed jobs with add/edit/complete forms and replacement-position selection.
- Admin equipment/catalog/applicability/main-part/specification screens.

Use explicitly labelled synthetic fixtures, including two QCs sharing a template but having different part history. Show Management read-only and EQ Team writer states. Include loading, empty, invalid, conflict, stale/error, Unreported status and non-WebGL states. Do not imply persistence or completed authentication in the prototype.

Expose a low-cost QC preview area or a clearly labelled prototype placeholder until P03 supplies the model. Keep real crane paint separate from operational-status colour. Avoid one WebGL canvas per fleet card, hover-only labels or colour-only status.

Create desktop and tablet/phone layouts, test keyboard focus/form labels, and document the 1366x768 and 1920x1080 layouts. Store the runnable prototype and screenshots under artifacts/prototypes and docs/evidence/P02. Use normal workspace-local tools rather than publishing externally.

Write docs/UX_SPEC.md with navigation, permission states, selection/history rules and responsive behaviour. Make the design concrete and easy to review; do not stop at a prose design proposal. Finish with what works in the prototype, what is still synthetic, and P03 next.
```

## P03 QC model prototype from drawings

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort xhigh.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P03 under the Bootstrap and Master control. Read QC_3D_MODELLING_BRIEF.md in full and create the first real interactive QC model prototype.

Inspect the relevant source sheets visually. Build the initial J526A STS model family using the verified geometry pipeline. Preserve the 30 m rail gauge, 70 m outreach, 20 m backreach and source-derived elevations. Derive overall height from drawing dimensions; never reuse 63 m total lift as overall crane height.

Model the recognizable frame, mast, stays, fixed girder, hinged boom, trolley/cabin, machinery house, principal hoist drives/drums, reeving, gantry bogies, headblock/spreader and major access features. Use simplified internal motors/brakes/reducers/cabinets and qualified hotspots where exact dimensions are absent. Omit fabrication detail. Apply CICT red/light-house appearance from supplied photos.

Build stable semantic position keys and a node manifest independent of runtime mesh IDs. Demonstrate main, sub and main-part selection, focus/reset, overall and technical modes, transparent-house or isolated-internals view and tree synchronization. Use synthetic equipment bindings without claiming real history or current fleet assignment.

Produce editable source/generator, reproducible build/export instructions, runtime asset(s), provenance/dimension table, node manifest and aligned side/end/top/perspective comparison images. Record actual triangles/draw calls/asset size and compare with the provisional budgets. Provide a functional fallback if the device cannot render 3D.

Do not replace this with a generic purchased crane, a flat image plane or a simple box silhouette. If a dimension is unreadable, keep that feature a labelled estimate and record the unresolved source; complete the supported geometry.

Store model source under an intentional assets/models/source or equivalent directory, generated assets separately, and evidence under docs/evidence/P03. Integrate the prototype into the P02 review flow if practical without implementing production business logic.
Finish with R02-ready visual evidence and an honest list of approximations.
```

## R02 UX and model fidelity review

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute R02 as a read-only review under the Master control. Inspect the runnable prototype and model visually, not just its component code.

Compare aligned side/end/top views against readable drawing pages. Check rail spacing, front/back reach, portal/mast/boom proportions, cabin and machinery-house relationship, headblock/spreader, bogies and CICT paint. Check major source dimensions and the distinction between total lift and overall height.

Exercise main -> sub -> part selection from the tree and the scene, camera cancellation/reset, label usability, technical internals and missing-WebGL fallback. Inspect stable semantic keys and bindings. Look for duplicate maintenance identities, invented manufacturer internals, inferred equipment applicability, a generic crane and status colours that confuse the red paint.

Evaluate management scanning, EQ Team entry effort, read-only presentation, responsive panels, keyboard navigation, synthetic-data labels and loading/empty/conflict/error states. Do not require every bolt or vendor internals; enforce the agreed major-assembly scope.

Report concrete findings with screenshot/artifact and code evidence, then PASS/NEEDS FIXES. No edits. PASS means the reviewed design/model can go on to P01B, P02B and R02B, after which the U1 user checkpoint reviews them together; it is not business or engineering certification. If changes are needed, use Repair and repeat this review.
```

## P01B V2 contracts addendum

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P01B under the Bootstrap and Master control. Extend the reviewed P01 contracts for SOW V2 revision 4 before any V2 prototype or code. This is a contract phase: do not edit app or Portal implementation.

Read documents\SOW_V2.md (same text as SOW_V2.docx), APPROVED_REQUIREMENTS.md version 2.0 (sections 1, 2, 4, 5, 5A, 5B, 6A, 7 and 8), reference\fac-job-list.json and the existing docs\ARCHITECTURE.md, DATA_CONTRACT.md, API_CONTRACT.md, PORTAL_INTEGRATION_PLAN.md, UX_SPEC.md and DECISIONS.md. Keep every P01/R01 decision that V2 does not change. Where V2 changes one, record the superseded rule and its replacement in DECISIONS.md.

Specify entities, invariants, stable keys, transitions and endpoints for:
- Sections and navigation: EQ and FAC route trees under /eq-maintenance, section switch, landing rules, display name "EQ & FAC Maintenance".
- Roles and feature permissions: the fourth role eq-maintenance:fac-team; the Access matrix as a server-evaluated policy (role ceilings, optional rights and defaults from APPROVED_REQUIREMENTS s4, audit, propagation within 60 seconds) applied to routes, API, exports and files. The matrix can never widen a ceiling.
- EQ: special jobs (the V1 jobs, rules unchanged); operational status with its source (ZMMS or manual), the current-day manual correction and its end at the next day's first successful sync, Back to automatic, and the ZMMS jobs that caused an automatic change; major spare-part selection, expected life, equipment commissioning date, condition register and its append-only history; how a Replacement special-job completion writes the condition together with the V1 installation events in one transaction.
- ZMMS: connector boundary (configuration key names without values, schedule, single-run lock, timeouts, retry/backoff), sync-run record, daily-job record keyed by ZMMS job number and date, equipment mapping and unmatched queue, job-type/status mapping, fail-closed parsing, and the rule that a failed or partial run changes nothing. Fields that only the real page can fix are marked provisional for P07B.
- FAC: job master, frequency list, cycles, progress updates, hold, photos, one-time and continuous kinds, Done today/this week, due computation in Asia/Colombo calendar days/months, same-day undo, Admin correction, import preview/confirm/re-run rules for fac-job-list.json, Excel export columns.
- FAC Dashboard read model: one summary endpoint sized for a 60-second poll (KPIs, lane lists in display order, ticker, latest-proof thumbnails, 8-week due load) with ETag or equivalent cheap revalidation.
- Crane view: a current-state query for the right panel. The scoped, de-duplicated history queries of P01 move to the EQ Jobs tab endpoints unchanged in their rules.

Update the Portal integration plan for the fourth role and the display name only; P05 has not started. Update the requirement-to-component-to-acceptance map for S01-S29 and the acceptance IDs in ACCEPTANCE_CHECKLIST.md.

Produce updated docs\ARCHITECTURE.md, DATA_CONTRACT.md, API_CONTRACT.md, PORTAL_INTEGRATION_PLAN.md and a short report in docs\evidence\P01B\ listing every changed contract section. Finish with the questions only the real ZMMS page can answer and P02B as the next step.
```

## P02B V2 prototype

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-sonnet-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P02B under the Bootstrap and Master control. Extend the reviewed P02 prototype, and the P03 viewer prototype where its right panel is affected, to SOW V2 and the P01B contracts. Synthetic in-memory data only; do not imply persistence, authentication or a live ZMMS connection.

Create or update connected views:
- Top bar with the EQ | FAC section switch and per-section tabs, shown for Admin, Management, EQ Team, FAC Team, a user holding EQ Team and FAC Team, and a user whose tabs are all switched off.
- Crane view right panel with the current state only (open special jobs, spare-part condition, specifications, Open in Jobs) in both the flat view and the 3D viewer prototype. Keep the U1-C01..C18 behaviour and flat/3D parity (U1-C08).
- EQ Fleet cards with the status source (Auto/Manual) and today's ZMMS daily-job count; replace the "manual status, no telemetry" note with the automatic-status meaning.
- EQ Jobs tab in three parts: special jobs with the read-only ZMMS daily jobs below them and "ZMMS data from"; EQ status with correction, Back to automatic and history; spare-parts condition register with due-soon/overdue flags and per-part history.
- FAC Dashboard per SOW V2 5.5: KPI strip, three moving discipline lanes, live ticker, latest-proof carousel, 8-week due load, TV mode, Pause, reduced-motion page flip, filters in the URL, phone layout, stale/error state. Load the 114 jobs from reference\fac-job-list.json plus clearly labelled synthetic progress, photos and updates.
- FAC Jobs per 5.6: My work, board/list, one-tap actions, the update-progress form with camera upload on a phone, hold, job detail with timeline and previous cycles, one-time job form, export button.
- Admin: Access matrix, FAC master list and the import preview showing the JSON's issues, ZMMS equipment mapping, job-type mapping, sync times and health (including a synthetic failed run), major spare-part selection and expected life.

Make the moving dashboard genuinely readable for management: a measured, steady scroll speed, no layout jump when data refreshes, no keyboard focus trap in the moving lists or ticker, and a static accessible alternative for moving content. Check 1920x1080 TV mode, 1366x768, tablet and phone.

Update docs\UX_SPEC.md (sections, Access states, crane-view panel, EQ Jobs parts, FAC screens, motion rules). Store screenshots and browser-check results under docs\evidence\P02B. Rerun the existing P02 and P03 prototype checks so the U1 changes do not regress. Finish with what is synthetic and R02B next.
```

## R02B V2 contracts and prototype review

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute R02B as a read-only review under the Master control. Review P01B and P02B against SOW V2 revision 4, APPROVED_REQUIREMENTS.md version 2.0 and the earlier R01/R02 results. Inspect the runnable prototype, not only its code.

Check that every SOW V2 item has a contract and a prototype screen. Check that the Access matrix cannot widen a role ceiling (Management write, FAC Team EQ write, EQ Team FAC write, non-Admin Admin) and that server enforcement is specified for routes, API, exports and files.

Check the ZMMS design: the account stays out of source, logs, browser and evidence; it reads only the daily job list; parsing fails closed; a failed or partial run changes no data or status; the current-day manual correction holds over the second sync and ends at the next day's first successful sync (Asia/Colombo midnight); no status changes before the job-type mapping is set.

Check that special-job completion and the spare-part register stay atomic with the V1 installation identity, that the predicted replacement never invents a date, and that the crane view shows no history while the Jobs tab keeps the scoped, de-duplicated history. Check FAC due computation, cycles, undo/correction and import rules against the confirmed answers. Check that the dashboard is readable by management at a glance, pauses, respects reduced motion and has an accessible alternative. Confirm that U1-C01..C18 behaviour did not regress.

Report findings and PASS/NEEDS FIXES. No edits. PASS means the V2 design and the reviewed QC model can go to the U1 user checkpoint together; it is not business approval. If changes are needed, use Repair and repeat this review.
```

## P04 Runnable app foundation

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-sonnet-5-5; effort medium; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P04 under the Bootstrap and Master control. Build the application foundation using the reviewed architecture and prototypes.

Create the selected ASP.NET Core/EF Core solution and React/TS/Vite app with pinned compatible 3D dependencies. Use a single deployable host, clear domain/application/data modules and a normal test structure. Do not install an unsupported runtime merely to match an old README. Preserve the Portal's existing runtime/source.

Implement /eq-maintenance path handling, API base paths, SPA deep-link fallback and safe asset resolution. Build the shell/navigation, shared error/loading forms, data-client boundary and server authorization policies for the four roles and the Access matrix, and the EQ | FAC section shell with per-section tabs. Normal runtime endpoints must not contain a developer authentication bypass; test authentication handlers belong only to automated test hosts.

Create the minimal subject-bound user projection/persistence needed for P05 integration and an explicit disposable local database setup. Keep connections external and startup migrations/seeding disabled. Define the protected storage abstraction and safe configuration validation.

Wire lint/typecheck/build, backend tests and a local validation command. Provide development configuration examples with placeholders only. Check direct deep-link reloads, asset URLs and HTTP error behaviour under a subpath.

Use the reviewed prototype as a visual guide. Any fixture-only adapter must be confined to a clearly separate prototype/test build and never presented as a real production workflow.

Produce a runnable foundation, version rationale, local start/stop instructions that affect only task-owned processes, and checks under docs/evidence/P04. Finish with P05 and any concrete integration prerequisites.
```

## P05 Portal sign-in and profile integration

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P05 under the Bootstrap and Master control. Implement narrow local integration in EQ_MAINTENANCE and CICT-ENG_MAIN_PAGE using the current Portal contracts. This phase does not deploy or alter shared/live accounts/databases.

Register the new app code, the /eq-maintenance launch path with the display name "EQ & FAC Maintenance", the audience and exactly four role codes (admin, management, eq-team, fac-team). Add the local binding claim and subject-keyed provisioning/convergence connector if required by the existing pattern. Implement the EQ-side protected provisioning endpoint and idempotent local profile convergence with desired revisions/state hashes or the current equivalent contract. Never match people by display name or accept a browser-submitted identity binding.

Use the existing shared cookie/JWKS validation and CSRF/Origin protections. Handle session recovery, refresh, must-change-password, expiration, logout, validated internal return targets and app-denied states using current Portal patterns. Credentials/tokens remain server-side/HttpOnly; the CSRF value follows the Portal's memory-only browser handling. No new production login screen.

Add registry-driven launcher visibility and server authorization. An EQ Admin is not a PortalAdmin and cannot grant cross-app privileges. Keep unknown audiences/roles rejected. Test wrong audience, wrong/no app role, disabled identity/projection, stale provisioning, missing binding where required, malformed tokens and CSRF failures.

Audit shared-token compatibility: a token carrying EQ audience/roles must still validate appropriately for every existing app under its intended validation-library version. Capture the actual consumer version matrix. Prepare compatible shared-library packages and exact rollout sequencing. Do not emit a token shape that breaks deployed old consumers, and do not remove their validation checks to make a demo work.

Keep modifications to existing app repositories out of this phase. If a consumer upgrade outside the two allowed repositories is required, finish the EQ/Portal implementation and prepare a concrete patch/dependency proposal; clearly leave the cross-app compatibility exit unmet until that authorized dependency is resolved.

Use isolated local Identity/EQ databases and generated local-only provisioning credentials; do not reuse real credentials or run an existing fleet of local apps if their runner performs unrelated seeding. Verify same-origin Portal -> EQ sign-in, profile creation, role-specific access, direct deep links and return navigation with synthetic test users.

Run focused shared-contract/issuer/provisioning/launcher tests and necessary existing-contract regressions sequentially. Record exact changed files in each repository, source/package versions, checks and the integration boundary. Finish with R03-ready evidence; do not claim production sign-in acceptance.
```

## R03 Identity and compatibility review

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort xhigh.
Claude Code: claude-opus-5-5; effort xhigh; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute R03 as a read-only review under the Master control. Review the P04/P05 source changes, test evidence and an authenticated local Portal -> EQ walkthrough.

Verify audience/role registration, scoped claims, trusted subject/binding, idempotent provisioning/revisions, disabled-user handling, launcher visibility, must-change-password/session expiry/logout, safe return targets, CSRF/Origin protection and server-side Admin/EQ Team/FAC Team/Management policies, including Access-matrix evaluation that never widens a role ceiling. Confirm no local production password flow or runtime auth bypass was added.

Test/inspect an old-consumer/new-token scenario. Identify actual validation versions and reject a rollout that adds globally unknown audiences/roles before consumers can accept the registered contract. Confirm no widened validation, cross-app grant escalation, incidental neighbouring-app edits or secret material in artifacts.

Inspect subpath routing and signed-in deep links; HTTP 200 or a visible launcher tile alone is insufficient. Distinguish local success from external compatibility dependencies and production verification.

Return findings and PASS/NEEDS FIXES without edits. If PASS, P06 is next. Unresolved necessary cross-repository upgrades are a concrete unmet exit, not permission to silently bypass this checkpoint.
```

## P06 Persistent catalogue equipment and Admin workflows

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P06 under the Bootstrap and Master control. Implement the approved data contract, SQL Server migrations and real Admin catalogue workflows.

Build the domain tables/indexes/constraints for equipment types/model templates, equipment, main/sub instances, maintainable positions, parameter observations, model versions and semantic bindings, with the job/history entities needed by the next phase. Retain the user projection already integrated in P05. Use application-level invariants plus appropriate relational constraints; do not rely on client filtering for equipment-parent consistency.

Create an explicit idempotent mechanism import from reference/mechanisms-approved.json. Verify exactly 16 main codes and 43 subcodes; 048/063 stay inactive, 061 is Spreader, 062 is Headblock and main 10 does not appear. Preserve source metadata and string codes. Never overwrite Admin edits without an explicit conflict/report decision. No automatic startup seeding.

Implement Admin APIs/UI for equipment types/models, equipment, applicability, main/sub templates, installed part positions, source parameters and model bindings. Used definitions deactivate without breaking history. Template edits do not recreate installed positions or silently cascade to past work. Enforce unique equipment codes and stable position keys at the correct scope. Generate the initial QC main-part position template from the P03 node manifest and drawing sources, present it to Admin as a reviewable list with source references, and instantiate it on a QC only after Admin confirmation.

Import drawing-family parameter observations only as unassigned model-reference data. Admin explicitly associates a validated model/template to an equipment item. Keep unknown current status unset, preserve the 46/45.5 gantry-speed conflict and label 63 m as total lift. Do not seed public website fleet counts or infer real equipment codes.

Populate a separate development/test fixture set with conspicuously synthetic QCs, RTG and ES, including two QCs sharing geometry but with distinct position IDs. Keep example status and history out of normal reference imports and release migrations.

Test taxonomy import/retry, deactivation, applicability, duplicate codes, forged cross-equipment parent IDs, preserving existing instances after template updates, source-conflict display, reserved-code rejection and Admin-only writes. Exercise the Admin screens against the real disposable SQL Server database.

Implement the V2 Admin settings from the P01B contract: the Access matrix (defaults, ceilings, audit, propagation) with server enforcement tests for all four roles; major spare-part selection per template and position, expected life per part type with per-position override, and the optional equipment commissioning date; ZMMS equipment mapping, job-type/status mapping, sync times and the health view shell (the connector itself is P07B). The FAC master list and import are P08B.

Generate reviewed migration SQL/rollback notes and record the exact disposable database validation. Finish with S01/S10/S14/S19 evidence and P07 next.
```

## P07 Jobs operational status and replacements

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P07 under the Bootstrap and Master control. Implement real special-job repair/replacement work, equipment-status workflows and the spare-part condition register end to end. The jobs in this prompt are the V2 special jobs; the EQ Jobs tab holds them, the EQ status part and the spare-parts part.

Build the job workspace, create/edit forms, Pending/Current/Completed views, equipment/target filters and role-appropriate actions. EQ Team and Admin can create and complete work; Management cannot write. Admin corrects/reopens completed work with a reason and retained prior values. Implement cancellation of uncompleted jobs with a mandatory reason: EQ Team for jobs they created, Admin for any job. Use the separate cancellation marker and Include cancelled filter, not a fourth normal work column or a hard delete. Completed work cannot be cancelled.

Validate equipment and target hierarchy on the server. Support equipment-level general work without copying it into every mechanism. Require a specific main-part position for each replacement line; permit multiple positions on the same equipment and reject duplicate lines for the same position. Handle explicitly unknown removed parts and optional serials without fabricating opening history.

Commit job completion, replacement/installation changes and audit in a transaction. Enforce concurrency tokens and idempotency so double-clicks, network retries and parallel requests cannot duplicate replacement events or overwrite a later installed part. A transaction failure must not leave a job Completed with missing installations, or an installation changed with no completed work/audit record.

Implement the spare-part condition register (APPROVED_REQUIREMENTS s5B): direct updates by EQ Team/Admin with append-only history, next predicted replacement from replaced date or commissioning date plus expected life (none when the date is unknown), due-soon/overdue flags, and the pre-filled condition form saved inside the same transaction as a Replacement special-job completion.

Implement explicit operational-status changes with source, actor/time, a mandatory reason for Breakdown and Maintenance and for any manual correction of an automatic status, the current-day correction marker and Back to automatic (its end at the next day's sync is completed in P07B), an optional link to a related job on the same equipment, current state and history. Expose time in current status computed only from recorded history. Keep operational status independent from job progress. Ready for OPS, Breakdown and Maintenance are the only selected operational values; do not treat new/unreported equipment as Ready. Show update freshness.

Use Asia/Colombo for displayed business dates and UTC for audit instants. Validate completion dates, preserve date-only knowledge where exact times are absent, and do not overwrite actual work date with entry time. Do not require a new Admin completion approval.

Provide Admin correction operations that retain superseded values. Reopening a completed replacement job must not silently reverse the physical installation; an explicit correction cannot erase or overwrite a later replacement.

Test actual database persistence after reload; role denials; target mismatch; Pending -> Completed historical entry; double submission; two concurrent editors; partial transaction failure; multicomponent completion; quantity-based position behaviour; correction/reopen after a later replacement; cancellation by the creator, by another EQ Team user (denied), by Admin and of completed work (denied); status changes without a required reason or with another equipment's job (rejected); and explicit Ready-status independence.

Record API and authenticated browser evidence, then update the acceptance matrix. Finish with P07B next.
```

## P07B ZMMS daily jobs and automatic status

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P07B under the Bootstrap and Master control. Implement the read-only ZMMS connector, daily-job storage, equipment mapping, sync health and automatic status (APPROVED_REQUIREMENTS s5A).

Account: the user supplies the ZMMS account out of band into the local runtime configuration (user secrets or environment variables, using the key names in the P01B contract). Never ask for it in chat, write it to a repository file, print it, place it in a URL, test, fixture or evidence, or echo it in an error. If it is not configured, build and test everything against fixtures and mark the live checks BLOCKED with the configuration key names needed.

Discovery with the configured account, only through the connector code or a throwaway diagnostic using the same HTTP client, never an interactive browser session: sign in, read today's daily all-job page and record the page structure, columns, paging/date parameters and equipment text formats. Save a sanitised fixture with people's names replaced, no session cookies and no account. Fix the provisional field list in docs\DATA_CONTRACT.md. Read nothing else on ZMMS and submit no form other than the login. Prove whether the page needs script execution before considering a headless browser.

Implement: a hosted background service with two Admin-set daily times (default 06:00 and 14:00 Asia/Colombo) and Sync now; a single-run lock; timeouts; retry with backoff; session handling; a parser that fails closed on unexpected structure; upsert by ZMMS job number and date in one transaction per run; the sync-run record and Admin health view; equipment mapping and the unmatched queue; the job-type/status mapping (empty at first, so no status changes until Admin sets it); automatic status per mapped active equipment from the day's plan; the end of the P07 current-day manual correction at the next day's first successful sync; the ZMMS jobs that caused each change; "ZMMS data from" freshness on Fleet and Jobs; the read-only daily-job list below special jobs with filters and kept history.

Test with fixtures: normal day, empty day, two syncs on one day, a correction held over the second sync and ended the next day, Back to automatic, unmatched equipment, unmapped job types, login failure, timeout, changed layout, partial page, duplicate rows, a repeated run, concurrent Sync now, the Asia/Colombo midnight boundary, retired equipment, and Management/EQ Team denial of the Admin ZMMS settings. Assert that the account never appears in logs, responses or stored records. If the account is configured, run one live read-only sync, compare the stored rows with the parsed page totals and record the result without personal data.

Finish with evidence under docs\evidence\P07B, S20/S21 status, and P08 next.
```

## P08 Protected evidence and scoped history

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P08 under the Bootstrap and Master control. Connect drawings, photos, work evidence and precise maintenance history.

Implement authenticated document registration/storage/streaming for source drawings, model references and job evidence. Keep original files immutable and outside public static serving. Validate extensions, MIME/signatures, size limits and generated storage keys. Use role/record authorization on upload, metadata, preview and download. Avoid browser-provided filesystem paths, path traversal and arbitrary external file fetches. Do not expose technical files via a guessable wwwroot URL.

Register supplied references through an explicit controlled import with checksums and drawing/page metadata. Do not upload/import Thumbs.db, temporary Office lock files or machine-specific source metadata. Link relevant drawings to model templates/components; preserve originals and report missing sources.

Implement equipment, main-mechanism, submechanism and part history queries. A mechanism includes its direct work and descendant work; a part is exact-position history. De-duplicate a job with multiple matching replacement lines, showing those lines within its record. Do not include another equipment item's matching code/mesh-name history.

Show current installation and prior replacement events without losing removed-item details or superseded corrections. Separate repair/replacement, job progression and equipment operational-status history. Show no records as an empty history, not a healthy/original-part assertion.

Integrate the work evidence uploader and technical drawing preview/download into the real UI, including loading/denial/missing-file states. Support range requests safely if the PDF/model viewer requires them. Drawings/photos/models continue to require the normal authenticated session after deep linking.

Test direct unauthenticated and wrong-role access, arbitrary guessed IDs, target-equipment mismatch, traversal/oversized/mislabeled files, missing file recovery, duplicate drawing import, Management download vs upload permissions, descendant query de-duplication and exact-position history after several replacements.

Serve these history queries from the EQ Jobs tab endpoints (special jobs, status history, spare-part history); the crane view does not show history. Make the protected storage reusable for FAC job and completion photos in P08B.

Finish with storage/import instructions, permission and history evidence, and P08B next.
```

## P08B FAC jobs cycles progress and photos

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P08B under the Bootstrap and Master control. Implement FAC persistence and workflows end to end on the protected-storage foundation from P08 (APPROVED_REQUIREMENTS s6A, SOW V2 5.1-5.4, 5.6, 5.7).

Build the FAC tables and migrations from the P01B contract: disciplines, types, frequency list, jobs, cycles, progress updates, holds, photos, corrections and audit. Implement the Admin import: load reference\fac-job-list.json, show the preview with every issue, save only on Admin confirmation, allow a re-run over the imported set until the first progress, and record the source checksum. Do not invent PIC, quantities or dates beyond the confirmed rules (blank quantity imports as 1).

Implement the FAC Jobs tab: My work, board/list by status, filters and search kept in the URL, one-tap Update progress, Done today, Done this week and Hold, the phone-first update form with camera capture, job detail with timeline and previous cycles, one-time jobs, Admin master-list management and the optional FAC Team rights from the Access matrix, and Excel export.

Rules: next due for recurring jobs from the completion date in calendar months/days (Asia/Colombo); due soon and overdue; daily/weekly cycles; one-time jobs close; continuous jobs have no due date; completed quantity never exceeds the job quantity; completion confirmation; same-day undo of the user's own last update; Admin correction with a reason and kept values; idempotent update requests and concurrency tokens. Photos: signature check, 10 MB limit, 5 per update, resize and thumbnail, protected streaming, same-day removal by the uploader and Admin removal with a reason.

Test against the real disposable SQL Server: every frequency including month-end dates (31 January + 1 month) and leap years, running-hours and as-required jobs, import preview/confirm/re-run and refusal after progress, partial and full progress, over-quantity rejection, double submit, two users updating one cycle, undo refused after midnight, Admin correction history, hold reason, photo type/size/traversal/unauthorised access, Management and EQ Team write denials, FAC Team denied Admin pages and master-list writes until Access grants it, and export contents.

Finish with evidence under docs\evidence\P08B, S23-S26/S28/S29 status, and P09 next.
```

## P09 Fleet dashboard and real equipment detail

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-sonnet-5-5; effort medium; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P09 under the Bootstrap and Master control. Replace prototype fixtures with real application data for the fleet dashboard, the equipment detail pages and the FAC Dashboard.

Implement the FAC Dashboard from the P01B read model and the reviewed P02B design (SOW V2 5.5): KPI strip with filter clicks, three discipline lanes as continuously moving lists in the required order, live ticker, latest-proof carousel with protected thumbnails, 8-week due load, TV mode, Pause, reduced-motion page flip, filters in the URL, phone layout, a static accessible alternative, 60-second refresh with revalidation and visible stale state. Data refreshes must not reset the scroll position or jump the layout. Show fleet cards with the status source and today's ZMMS daily-job count, and apply the section switch, landing rules and Access matrix to every page.

Implement QC/RTG/ES groups, equipment search, operational-status filter, active/retired handling, compact card/row display, status labels/icons/legend, time in current status, counts and last-update/freshness. Calculate each equipment once; open jobs and multiple replacement lines must not multiply fleet totals. Exclude retired equipment by default while allowing history lookup.

Use lightweight thumbnails/silhouettes on the fleet page, not separate live 3D canvases. Support a configurable lightweight refresh, defaulting to 60 seconds, plus refresh after successful writes. Keep last good values visibly stale on request failure rather than setting everything Ready or clearing the fleet. Cancel obsolete requests when filters/equipment change.

Implement equipment detail with real mechanism tree, equipment-specific part positions, specifications/source links and the right-side current-state panel (open special jobs, spare-part condition, specifications, Open in Jobs to the scoped history). Do not show work history in this view. Use the existing shared selection/URL state contract so the forthcoming model viewer can attach without creating a second data source.

For RTG/ES, provide the full register/technical/work/history interface with an honest stage-1 3D-unavailable state and suitable type thumbnail. New QC items without verified model binding get the same record-first fallback instead of silently borrowing the wrong model family.

Check Management and EQ Team layouts, deep-link/back behaviour, 1920x1080 and 1366x768 usability, tablet panel collapse and phone work forms. Only show writer actions to authorized roles while keeping API denials independent.

Test mixed statuses including unset, automatic and manual, empty register, large synthetic fleet, stale responses, concurrent refresh/status edit, page reload, deep-link filters and state-specific counts. For the FAC Dashboard test KPI reconciliation with the FAC Jobs list, lane order, pause/reduced motion, refresh without jumps, TV mode at 1920x1080 and an empty or failed refresh. Capture authenticated real-data browser evidence. Finish with P10 next.
```

## P10 QC viewer and maintenance drill-down

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P10 under the Bootstrap and Master control. Promote the reviewed P03 model into the real app and connect it to persisted equipment/component data.

Bind the correct versioned QC model template to each verified equipment item. Load models through the protected asset boundary. Resolve scene semantic positions through equipment-instance bindings, keeping the two synthetic QCs' history separate despite shared model geometry.

Implement Overall and Technical modes, tree/scene bidirectional selection, main -> sub -> part breadcrumbs, union-bounds camera focus, orbit/pan/zoom, reset/fit, useful labels and appropriate simplified internals or qualified hotspots for hidden systems. Cancel stale model/history requests and camera transitions when selection/equipment changes; the right panel must never show the previous component's work as current selection.

Selecting main/sub/part shows its current state in the right panel (open special jobs, current spare-part condition, source-linked parameters) and an Open in Jobs link that opens the EQ Jobs tab with the same direct-and-descendant or exact-position history query and selection. Do not show work history in the crane view. Expose add-special-job navigation for writers using the selected target, without inventing a part when the current selection is only a group.

Use a clear selection/work overlay legend while preserving normal CICT red paint. Avoid fabricated component health scores, live-telemetry labels or real crane movement controls. Simplified internals must remain recognizable and honestly qualified.

Implement missing-binding/version mismatch reporting, authenticated asset errors, WebGL-unavailable/context-loss fallbacks, reduced-motion behaviour and disposal/shared-resource management. A new model version may not silently reassign history by mesh order/name.

Test picking, keyboard/tree equivalence, deep-link selection reload, rapid equipment switching, transparent-enclosure picking, thin/empty bounds, repeated navigation resource counts, installed-part changes after a real completion and stale/out-of-order network responses. Verify the actual saved records through the real API.

Produce a narrated-by-text interaction evidence report plus screenshots and counters under docs/evidence/P10. Finish with R04-ready evidence; do not claim engineering certification or production verification.
```

## R04 Workflow data and access review

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort xhigh.
Claude Code: claude-opus-5-5; effort xhigh; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute R04 as a read-only review under the Master control. Use the actual local app, real disposable SQL Server records and authenticated test roles where available.

Follow one complete scenario: Admin registers a QC/model and positions; EQ Team sets Maintenance, creates a replacement special job, starts/completes it with evidence and the pre-filled spare-part condition; Management finds the same work through fleet -> QC -> main -> sub -> exact part and Open in Jobs; equipment stays Maintenance until an explicit authorized Ready update or a later successful ZMMS sync for mapped equipment. Repeat on another QC with the same model to prove history isolation. Check RTG/ES record workflows without QC model substitution.

Run the ZMMS fixtures through two syncs and a day change with a manual correction in between, a failed run and an unmatched equipment; confirm no status change from a failed run or before the job-type mapping exists, and that no account material appears anywhere. Run a FAC scenario: Admin imports the list, FAC Team logs partial and full progress with photos on a phone viewport, a recurring cycle rolls to its next due date, Management sees it move on the dashboard; attempt FAC writes as Management and EQ Team, Admin pages as FAC Team, and Access-matrix changes that would widen a ceiling.

Inspect and exercise database transactions, idempotent retry, conflicting edits, correction/reopen after a later replacement, template changes/deactivation and exact vs descendant history de-duplication. Confirm immutable prior installation and audit records, unknown initial values and date semantics.

Attempt Management writes and unauthenticated/guessed file/model URLs, forged equipment/component IDs and traversal-style upload paths. Review server authorization, protected evidence storage and direct deep-link routing. Check code and tests; a disabled UI button alone is not evidence.

Inspect 3D binding identity, request cancellation, out-of-order history results, model-version migration safeguards and fallback. Reject generic geometry, wrong crane proportions, fabricated source facts or success claims based only on fixture data.

Report reproducible findings with evidence and PASS/NEEDS FIXES. No edits. Map findings to acceptance IDs and state which cases could not be verified. After fixes and a passing review, continue to P11.
```

## P11 Acceptance accessibility and performance

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P11 under the Bootstrap and Master control. Complete the acceptance evidence for the actual implementation; do not add unrelated modules or rewrite working features merely to expand the test suite.

Run the relevant backend, SQL Server integration, frontend type/lint/build and browser tests. Use ACCEPTANCE_CHECKLIST.md as the contract. Add meaningful tests for uncovered business invariants, authorization/identity boundaries, replacement retries/concurrency/transaction rollback, history scoping, protected assets, subpaths and selection/request races.

Exercise all four roles, the Access matrix, the two-QC isolation scenario, the ZMMS fixture scenarios and the FAC workflows in an authenticated browser. Verify persistence after restart/reload. Mark real automated results, manual local checks and unexecuted target-environment checks distinctly. Use synthetic development data only.

Review keyboard access, visible focus, form labels/errors, status text/icons, screen-reader-friendly tree/record alternatives, reduced motion, desktop/tablet/phone layouts and 3D fallback. Fix material problems and capture evidence.

Measure the FAC Dashboard's summary payload, refresh cost and animation smoothness in TV mode over at least 30 minutes without memory growth. Measure the QC viewer against its provisional triangle/draw-call/asset-size/load/orbit budgets on a recorded desktop/browser. Check demand rendering and resource behaviour over repeated navigation. Profile query/payload costs with a representative synthetic fleet and work history. Tune the observed bottlenecks rather than claiming FPS from an API test or silently changing budgets.

Check same-origin/intranet operation without external fonts/decoders/textures, production build fixture exclusion, error/freshness behaviour, model missing/corrupt cases and source-file authorization. Perform regression checks required by actual shared-contract changes without concurrent builds sharing outputs.

Produce docs/TEST_REPORT.md and a completed acceptance evidence table, exact commands/results, visual/performance evidence and a prioritized remaining-issues list. State any unmet required acceptance case honestly; do not mark it Passed because a review prompt was supplied.

If required local behaviour is working, finish with the U2 user checkpoint next (the user walks through the minimum demonstration script), then P12. Otherwise use Repair for concrete failures.
```

## P12 Release package and deployment preparation

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-sonnet-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute P12 under the Bootstrap and Master control. Create a reproducible local release package and operational documents. Do not deploy, change IIS, run shared/live SQL migrations or issue real role grants in this phase.

Build/publish the EQ app for the selected supported runtime. Package the SPA, host, required model assets, same-origin dependencies, version/checksum manifest and configuration templates without credentials or development fixtures. Keep source drawings and uploaded evidence under the protected storage boundary; document controlled transfer/import separately rather than copying them into public wwwroot.

Prepare reviewed migration SQL and explicit mechanism/reference import commands, database/storage backup requirements, forward and rollback procedures, service-account/storage permissions, configuration ownership and app-path routing. Preserve uploads/data across a binary rollback. Explain any irreversible migration and avoid pretending a destructive down migration is a safe rollback after new business records exist.

Document the proposed /eq-maintenance IIS application, dedicated pool, selected .NET hosting prerequisites, source/package version compatibility and same-origin /auth connectivity. Verify available local facts, list target prerequisites still unverified, and do not assume a Hosting Bundle or production path exists from an old README.

Prepare the coordinated Portal/shared-auth rollout manifest from P05, including consumer versions required before the new shared audience/roles are issued. Specify explicit registry/provisioning activation steps and rollback order. Keep existing app routes, app pools, configuration and data outside this EQ package.

Create docs/DEPLOYMENT_PREPARATION.md, docs/ROLLBACK.md, docs/ADMIN_GUIDE.md, docs/EQ_TEAM_GUIDE.md, docs/FAC_TEAM_GUIDE.md, docs/MANAGEMENT_GUIDE.md (including TV mode) and a release manifest identifying exact commit/build/model/schema versions and checksums. The guides cover equipment/applicability setup, Unreported and automatic status, ZMMS mapping and sync health, the Access matrix, special-job completion, replacement positions, spare-part condition, the FAC import and progress updates, corrections and source-conflict handling. Document the ZMMS account as a target configuration item supplied by its owner, with key names only.

Prepare a target acceptance script/checklist that verifies authenticated Portal launch, all four role behaviours and the Access matrix, fleet status, a live read-only ZMMS sync, the FAC Dashboard in TV mode, real 3D selection/history, protected files, restart/deep-link behaviour and neighbouring-app sign-in after a later authorized release. HTTP health endpoints alone are insufficient.

Finish with artifact paths, what was actually validated locally, unmet deployment prerequisites and R05-ready evidence. Do not mark stage 1 deployed.
```

## R05 Release readiness review

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6-astra; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.

Execute R05 as a read-only review under the Master control. Review final source, release/model/schema manifests, acceptance results and deployment/rollback documents.

Check S01-S29 against actual evidence. Confirm the package excludes credentials (including any ZMMS account), ZMMS page fixtures with personal data, test auth, synthetic production fleet/history and uncontrolled public technical files. Verify exact binary/asset/schema versions, build reproducibility, .NET/runtime prerequisites, /eq-maintenance routing and protected storage/import setup.

Review shared-auth consumer compatibility and rollout/rollback ordering. Review database migrations and backup/rollback limits, especially preservation of uploaded evidence and business records created after release. Reject a plan that upgrades the issuer before dependent consumers can accept the registered contract.

Inspect local browser/model/performance evidence, deferred scope and unresolved drawing-source issues. A prepared package is not proof of production acceptance; target-environment checks must remain clearly pending until actually performed.

Return actionable findings and PASS/NEEDS FIXES with release artifact references. No edits or deployment. If PASS, use P13 for the final handover; otherwise Repair and repeat the relevant checks/review.
```

## P13 Final corrections and handover

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-sonnet-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.
For corrective code work, inherit the affected phase/review profile when stronger than this default.

Execute P13 under the Bootstrap and Master control. Resolve any remaining in-scope review findings already authorized for correction, run the affected checks and refresh the relevant review evidence. Do not broaden scope or start deployment.

Reconcile the implementation ledger, source mappings, decisions, acceptance matrix and release manifest with the actual final code/assets. Remove stale claims and clearly mark any unmet requirement rather than declaring completion because the phase list ended.

Deliver docs/HANDOVER.md with:
- Implemented scope S01-S29 and actual proof for the primary management, EQ Team and FAC Team flows, the ZMMS sync and the Access matrix.
- Exact local start/test/build steps, selected runtime/package versions and clean configuration requirements.
- Portal integration changes/dependencies and all repository boundaries touched.
- Mechanism seed/applicability rules, installed-position/replacement semantics and Admin correction rules.
- QC model source/export instructions, source geometry approximations and binding/version contract.
- Known source conflicts, missing model associations and required target-environment checks.
- Local release package paths, versions/checksums, deployment/rollback documents and the next explicitly scoped operational action.

If required local acceptance is complete, state that stage 1 is locally implemented and release preparation is complete. If any required behaviour remains unmet, state the concrete remaining work and do not label stage 1 complete. Production/engineering acceptance remains separate.
```

## Repair prompt

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort high.
Claude Code: claude-opus-5-5; effort high; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.
For corrective code work, inherit the affected phase/review profile when stronger than this default.

Read the Bootstrap, Master control, approved requirements, latest handover and the failed phase/review report. Fix the concrete blocking findings for the current stage.

Reproduce each finding, identify its cause, make the smallest coherent correction and preserve unrelated work, taxonomy, component identities and existing history. Use the selected phase's repository boundaries. Do not weaken authentication, remove meaningful tests, fabricate geometry/records or change acceptance expectations to make a check pass.

Run affected checks and the necessary regression cases. Update the phase evidence, acceptance matrix and handover. Report the finding IDs, changes, proof and remaining issues. Do not run or pass the failed review yourself; stop after the repair so that review is repeated independently before advancing. Do not deploy or run later feature phases automatically.
```

## Resume prompt

```text
Execution recommendation (choose one platform; select in client controls):
Codex: gpt-6.1-sol; reasoning effort medium.
Claude Code: claude-sonnet-5-5; effort medium; adaptive thinking.
These recommendations do not switch the actual runtime model or effort.
After context recovery, switch to the next selected phase profile before doing its work.

Resume CICT EQ & FAC Maintenance in F:\CODEX\EQ_MAINTENANCE.

Read applicable workspace instructions and:
documents\prompt-pack\APPROVED_REQUIREMENTS.md
documents\prompt-pack\EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md
documents\prompt-pack\QC_3D_MODELLING_BRIEF.md
documents\prompt-pack\ACCEPTANCE_CHECKLIST.md
documents\prompt-pack\MODEL_AND_EFFORT_GUIDE.md
docs\IMPLEMENTATION_STATUS.md
docs\DECISIONS.md
docs\HANDOVER.md

Inspect current files/Git state and the latest evidence before acting. Preserve user changes. Identify the last phase with demonstrated completion and the next incomplete selected phase; do not infer completion from file existence or stale summaries. Do not repeat the answered scope and review questions. Check docs\DECISIONS.md for recorded U1/U2 user approvals before advancing past them. For U1-T01, read TEMP_MANAGEMENT_WALKTHROUGH.md and require TD07-TD08 evidence that the temporary layer is fully removed and the cleaned app reflects initial reference 8303f8b8a55f41983bdcc77363ddbf13d2892383 plus accepted EQ/FAC changes before recording or relying on U1 approval. Preserve accepted edits; defer login/Portal feedback to P05 and record the exact cleaned app commit/tree.

Briefly state current scope, completed evidence, remaining blockers and the next phase. Continue only the user's selected phase; if no phase is named, continue the next incomplete phase under the pack's normal repository/production boundaries. Keep development, authenticated local, target and production verification claims separate.
```

## What this pack deliberately leaves configurable

Current equipment identifiers/counts, per-model applicability, installed-position inventories, initial operational status, unknown service/serial/commissioning data, major spare-part selection and expected life, ZMMS equipment and job-type mappings, sync times, the Access matrix and the blanks in the facility job list are Admin inputs. Exact crane-family assignment and unresolved drawing observations require source-backed technical decisions. They do not authorize synthetic facts to enter production seed data.

Model choice, local ports and exact package patches are implementation decisions to resolve from installed tools and current primary documentation in P00. The pack specifies architecture and compatibility constraints, not an arbitrary unverified patch-version lockfile.
