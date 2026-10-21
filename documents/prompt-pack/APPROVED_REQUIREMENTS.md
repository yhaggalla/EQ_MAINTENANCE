# CICT EQ Maintenance approved requirements

Version 1.1 | 21 October 2026 | Planning and implementation contract, including pre-implementation review decisions

## 1 Purpose and authority

Build a separate Engineering Portal application that lets management see fleet readiness and lets the EQ Team record major repair and replacement work against equipment and its components. A selectable QC model connects the visual equipment to the same records used in the mechanism tree and work history.

This contract combines the supplied SOW, the user's mechanism table, the engineering references, and the user's five answers on 21 October 2026. It is not a request to reproduce every fabrication parameter or operate physical equipment.

Authority order: later explicit user instructions; the confirmed decisions below; supplied SOW and mechanism source; drawing observations; documented technical defaults in this pack. Where the SOW's broad all-equipment illustration differs from the confirmed staging, the confirmed staging wins. Never reinterpret legacy notes in the Portal repository as current deployment evidence.

The five confirmed decisions are:

| Decision | Confirmed choice |
| --- | --- |
| Stage 1 | QC interactive 3D first; QC, RTG and ES in the equipment register and fleet dashboard |
| Integration | Separate app using existing ENG Portal authentication, roles, SQL Server technology and IIS application patterns |
| Work permissions | EQ Team creates and completes jobs; Admin manages and corrects them; retain history; no extra completion approval |
| Classification | Preserve codes; no main 10; 048 and 063 inactive; 061 Spreader; 062 Headblock; applicability configurable by equipment type |
| Models | Create simplified models from drawings, with accurate overall shape, major assemblies and simplified internal drill-down |

Four further decisions were confirmed on 21 October 2026 during the pre-implementation review:

| Decision | Confirmed choice |
| --- | --- |
| EAM/Maximo link | None in stage 1: no work-order reference field and no synchronisation. Jobs are standalone app records |
| Historical data | No bulk import. History starts at go-live; earlier work may be entered manually as completed jobs with past business dates |
| QC main parts | Derive the initial QC main-part positions from the as-built drawings; Admin reviews and edits the list before any history is recorded |
| Job cancellation | EQ Team can cancel uncompleted jobs they created, with a reason; Admin can cancel any uncompleted job; only Admin corrects or reopens completed work |

## 2 Scope and acceptance identifiers

| ID | Required result |
| --- | --- |
| S01 | Configurable QC/RTG/ES equipment register, model families and active/retired state |
| S02 | Fleet overview with equipment-type groups, searchable equipment, current status, status counts and last-update information |
| S03 | Exactly three operational statuses: Ready for OPS, Breakdown and Maintenance; unreported initial status stays visibly unset |
| S04 | Authenticated, selectable QC overview model with named major assemblies, orbit/pan/zoom and reset/fit controls |
| S05 | Equipment -> main mechanism -> submechanism -> main part navigation, with the same selection accessible through a tree |
| S06 | Overall and Technical modes; Technical mode reveals useful simplified internals and verified specifications |
| S07 | Selecting a mechanism, submechanism or part focuses it and loads scoped repair/replacement history in the right panel |
| S08 | Jobs workspace with Pending, Current and Completed work; equipment, classification and date filters |
| S09 | EQ Team can create, edit active work, progress and complete repair/replacement jobs and change operational status |
| S10 | Admin manages equipment, applicability, mechanisms, parts, model bindings and specifications, and makes audited corrections |
| S11 | Management is read-only across fleet, equipment details and permitted work evidence |
| S12 | Separate equipment-specific part positions and replacement events; retain previous installations/history |
| S13 | Auditable status transitions and material job/replacement changes, safe concurrent edits and atomic completion |
| S14 | Source-linked major technical parameters and authenticated access to supporting drawings/photos |
| S15 | Central Portal sign-in, explicit app/role registration, appropriate local profile provisioning and same-origin routing |
| S16 | Responsive, keyboard-accessible normal workflows with a useful non-3D fallback |
| S17 | Testable local implementation, reproducible model assets, measured performance and a reviewable release package |

RTG and ES detail pages still provide specifications, the applicable mechanism tree, work records, replacement history and evidence. Show a suitable thumbnail and a clear statement that their 3D view is not available in stage 1. Do not substitute a QC model and present it as an RTG or ES.

Stage 1 excludes live PLC/SCADA/IoT feeds, remote equipment control, structural stress calculations, load/safety certification, predictive maintenance, Maximo/EAM work-order references or synchronisation, bulk import of historical work records, procurement/stock control, full preventive-maintenance scheduling, costs/budgets, public user registration, and full RTG/ES 3D authoring. These are not implied by a graphical maintenance dashboard.

## 3 Classification and installed positions

The authoritative machine-readable definition is `reference/mechanisms-approved.json`. It contains 16 main mechanisms and 43 subcodes, of which 41 are selectable active definitions and two are inactive reserved entries. Preserve the original source separately in `reference/mechanisms-original.txt`.

- Store `01`, `011`, etc. as strings, never integers. A subcode is unique within this catalogue and retains its supplied parent.
- Do not invent main mechanism 10, fill unused slots, or merge the three separate steel-rope definitions 015, 024 and 033.
- Keep 048 and 063 inactive and unselectable for new records until an Admin gives them an explicit definition. Existing identifiers never change.
- The approved display names for 061 and 062 are Spreader and Headblock. Retain the original labels in metadata.
- Admin can add later definitions without renumbering existing entries. Used definitions are deactivated rather than deleted; historical work remains readable.
- Applicability belongs to equipment type/model templates. Editing a template does not silently rewrite installed component instances or old jobs.
- New equipment types remain Admin-configurable. Their future 3D assets are a separate capability.

The shared classification and a crane scene are different structures. For example, a machinery-house visual group contains parts from several mechanisms. Selecting an enclosing mesh must not invent a new main mechanism or assign every contained part the same maintenance identity.

Use equipment-specific instances. `QC-DEMO-01 / 011 / motor-A` and `QC-DEMO-02 / 011 / motor-A` have independent history even if they use the same template and geometry.

A main part is a maintainable position, such as a particular motor, brake, drum, gearbox, sheave, wheel, rope set, PLC cabinet or structural member. A replacement changes the installed item at that position; it does not erase the position or rename all previous work. Unknown serial numbers, original installation dates and model applicability remain unknown.

Assign structural members as main parts without creating a new main code: frame/legs/fixed structural access under 15/151 where consistent with its supplied steel-structure description; boom members under 03/031. Keep one maintenance identity per member, with additional visual grouping where useful. This is a technical default and is editable by Admin before history is recorded.

The initial QC position list is derived from the as-built drawings (the P03 node manifest and the P06 model template) and is presented to Admin as a reviewable template with source references. It becomes the installed-position set of a real QC only after Admin confirms it; before history exists Admin may add, rename or deactivate positions.

## 4 Roles and permissions

| Action | Admin | EQ Team | Management |
| --- | --- | --- | --- |
| Read fleet, equipment, work and allowed documents | Yes | Yes | Yes |
| Create jobs and update Pending/Current work | Yes | Yes | No |
| Complete a valid job and its replacement lines | Yes | Yes | No |
| Set equipment operational status | Yes | Yes | No |
| Correct or reopen completed work, with reason/history | Yes | No | No |
| Cancel an uncompleted job, with reason | Yes, any job | Yes, jobs they created | No |
| Add/update equipment, templates, classifications and main parts | Yes | No | No |
| Set applicability, specifications and model bindings | Yes | No | No |
| Attach work evidence | Yes | Yes, to accessible work | No |
| Alter central identities or grant arbitrary Portal roles | No implicit right | No | No |

Admin here means EQ Maintenance Admin. It does not automatically mean PortalAdmin. Central account/role provisioning continues to follow the Portal's current administrative contract. Add delegated EQ role administration only if the existing central delegation mechanism supports it without widening authority.

All app records are visible to the three app roles in stage 1; there is no invented departmental approval chain or per-equipment restriction. Enforce this matrix server-side, including attachment endpoints and deep links. A hidden button is not authorization. No second production login or local password database is required.

## 5 Operational status and work lifecycle

Operational state and work state are independent:

- Operational status is Ready for OPS, Breakdown or Maintenance. New equipment has no reported operational status until an authorized user sets one; a neutral Unreported display is not a fourth operational status.
- Every operational-status change records actor and time. A short reason is mandatory for Breakdown and Maintenance and optional for Ready for OPS. The change may reference a related job on the same equipment. Fleet and equipment views show how long the equipment has been in its current status, computed only from recorded status history; equipment never set shows no duration, and nothing is inferred from before tracking began.
- Work status is Pending, Current or Completed. Pending work can move to Current or be recorded directly as Completed for work already performed, if required completion information is supplied.
- Completing a job never automatically marks the equipment Ready for OPS. Changing operational status is an explicit action.
- Admin may reopen/correct completed work with a mandatory reason and an immutable record of the prior values. Do not destroy replacement history when a job is reopened.
- A completed replacement cannot be silently undone by reopening its job. Use an explicit audited correction that recomputes the installed position consistently and refuses to overwrite a later replacement.
- An uncompleted job can be cancelled with a mandatory reason: by EQ Team for jobs they created and by Admin for any job. Record who cancelled it and when. Keep it out of the three normal work columns and available through an Include cancelled filter; never turn it into completed work or delete its history. A completed job cannot be cancelled; use the Admin correction path.

Job defaults: equipment; scope target (equipment/main/sub/part); title; Repair or Replacement kind; description; planned date if known; optional responsible person; work status; actual completion date and completion note when completed. Priority may be a simple optional field, not a new approval workflow.

Each job belongs to exactly one equipment item. Ancestors must belong to that equipment. An equipment-level job has no invented component target and appears at equipment level; it is not repeated in every mechanism. A replacement line must resolve an actual main-part position under that equipment. A job can have multiple replacement lines on the same equipment; reject duplicate lines for the same position in one completion operation.

Replacement details: part position, removed item where known, installed item description, model/part number and serial if known, quantity/UOM appropriate to the position, replacement date, linked job and optional evidence. Use a quantity-bearing installation/lot representation for rope sets and similar multi-item positions where necessary; do not assume every position is a single serialized motor. Original/removed item may be explicitly Unknown. Do not invent a serial number, initial service date or opening installation.

Use a database transaction for job completion, installation changes and audit records. Use request identifiers or equivalent idempotency protection for retried completion commands, plus concurrency tokens for updates. Repeating a successful command must not duplicate an installation or a replacement event.

Record audit instants in UTC and show them in Asia/Colombo. Preserve actual work dates as business dates when no exact event time is supplied. An audit timestamp is not proof of the physical replacement time. Do not fabricate downtime history before tracking began.

Current fleet counts are valid stage 1 indicators. MTBF, MTTR, availability percentages, structural health scores and economic remaining life require additional definitions/data and are not stage 1 promises.

## 6 History and source parameters

Main-mechanism history includes work targeted directly at it and at its descendants. Submechanism history follows the same rule. Part history is exact-position history. De-duplicate jobs with multiple descendant replacement lines so the job count and timeline do not multiply. Show the matching lines within a job.

History must distinguish repair, replacement, job progress and operational status. A selected-part technical sheet shows its identity, position, latest known installation, verified parameters, references and timeline. Show empty history as No work recorded, never proof that a component is original or healthy.

`reference/major-parameters.json` records observations from the J526A00 drawing family. These are not an approved seed assignment to the current fleet. Store parameter code/name, value or source observations, unit, operating condition, drawing/page, verification state, model applicability and optional Admin correction history.

Required initial fields are lifting capacities, rail gauge, outreach, backreach and lift height. Major motor ratings, speeds, rail type and incoming supply can be available in Technical mode. Do not turn every drawing dimension, bolt torque or fabrication tolerance into a required form field.

The drawing's 63 m is total lift height, not overall crane height. General-arrangement gantry speed is 46 m/min while J526A0600 reports 45.5 m/min; keep this unresolved source conflict visible until an authorized technical decision records the intended value. It need not block unrelated features.

The cover refers to 12 STS cranes. Do not infer current fleet counts, specific QC identifiers, service dates or compatibility of later crane models from it. Admin registers actual equipment and assigns a verified model template. Development examples must be clearly synthetic and isolated from production seed commands.

## 7 Screens and interaction

1. Fleet: type tabs/groups, Ready/Breakdown/Maintenance/Unreported counts, search, status filters, compact equipment cards or rows, last updated, and links to details. At desktop sizes the whole fleet should be easy to survey; scrolling/filtering is acceptable for larger registers. Do not render one interactive canvas per card.
2. Equipment: header with code/type/status and update action for writers; mechanism tree; centre viewport; right details/history panel; breadcrumb; Overall/Technical toggle; current jobs and specifications.
3. Jobs: Pending/Current/Completed tabs or board, filters, add/edit form, completion dialog, replacement position selection and work evidence. Moving a card must still enforce the same server rules as the form.
4. Admin: equipment/model templates, applicability, the coded mechanism list, installed positions, source specifications and model-binding validation. Reserve central identity administration for the Portal.

Use existing Portal visual tokens and recognizable navigation where available. Use restrained colours, clear typography, visible focus, labelled controls, and status text/icons as well as colour. Keep the actual red crane paint in normal mode; selection or work overlays have a separate legend. Management's read-only state must be clear without disabling navigation.

Desktop target: 1920x1080 with usable behaviour at 1366x768. Tablet: collapse the tree/panel into accessible drawers. At phone width, prioritize fleet/job forms and the text hierarchy, with 3D optional. A 3D context loss must not remove access to records.

## 8 Technical implementation defaults

These are recommended choices to verify in Prompt P00, not user requests to upgrade neighbouring applications.

- React + TypeScript + Vite frontend; Three.js with compatible React Three Fiber/Drei packages for the model viewer. Prefer React 19/Fiber 9 for an independent new app if shared-component constraints allow; React 18/Fiber 8 is an explicit compatibility alternative. Pin the selected compatible set.
- ASP.NET Core and EF Core with SQL Server, using a supported LTS runtime. Prefer .NET 10 for a new October 2026 app after proving SDK, shared-auth package and eventual hosting compatibility. Do not copy net8.0 from the current Portal without evaluating its lifecycle, and do not upgrade the Portal as an incidental change.
- One deployable EQ host serving its SPA and API; clear application/domain/data boundaries within that app, not microservices.
- Separate EQ-owned database and migrations on SQL Server. Use external runtime configuration, no embedded credentials and no automatic shared/live migrations.
- Protected files outside public static roots; authenticated handlers for source drawings, work photos and technical models. Bundle needed fonts, icons, decoders and dependencies for intranet use.
- Prefer reproducible procedural Three.js geometry or an authored/exported GLB pipeline, selected after checking tools. Both must produce stable semantic mappings and the same visual result; a PNG is not an interactive model.
- Poll lightweight fleet data at a configurable interval, with a 60-second default plus refresh after writes. No push infrastructure is required in stage 1. Show freshness and preserve last good data with a stale/error indicator on failures.

Proposed technical identifiers, to use unless an actual collision is found:

| Item | Proposed value |
| --- | --- |
| Application code | eq-maintenance |
| Browser base path | /eq-maintenance |
| Public API base | /eq-maintenance/api |
| Token audience | urn:cict-eng:eq-maintenance |
| Roles | eq-maintenance:admin; eq-maintenance:management; eq-maintenance:eq-team |
| Local binding claim if required by the current Portal contract | cict:binding:eq-maintenance:local_user_id |

The existing Portal's shared validation library has explicit registered audiences/roles. Central issuance, the shared contract, launcher registry, profile provisioning and every relevant consumer must be tested together. An old validator can reject a shared token containing an unknown new audience or role. Do not weaken that validation to onboard this app; plan compatible consumer packages and rollout sequencing instead.

## 9 Definition of stage 1 completion

S01-S17 must be implemented or have an explicit user-approved scope change, and the required acceptance cases in `ACCEPTANCE_CHECKLIST.md` must have evidence. Real data persistence, role enforcement, drill-down history and replacement transaction behaviour are required; attractive fixtures alone are not completion.

The QC model must be recognizably matched to the supplied general arrangement in side/end/top views, with source-based proportions and working main/sub/part navigation. Simplified internals are labelled where dimensions or vendor shapes are not established.

Finish with a working local build, test results, visual evidence, source/model manifest, unresolved technical-source issues, and a prepared IIS release/rollback package. Building that package does not establish production or engineering acceptance. A later explicitly authorized deployment must verify authenticated user outcomes in the target environment.

## 10 Reference notes

The local source review is `F:\CODEX\EQ_MAINTENANCE\documents\EQ_MAINTENANCE_REQUIREMENTS_REVIEW.md`. Core originals remain in `documents\SOW.docx` and `As-bulit drawing`; do not edit those to make an implementation easier.

Technical references checked on 21 October 2026:

- [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core): .NET 10 LTS is supported through 14 November 2028; .NET 8 support ends 10 November 2026. Recheck at implementation time.
- [React Three Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation): match the Fiber and React major versions.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [Object3D](https://threejs.org/docs/pages/Object3D.html), and [Raycaster](https://threejs.org/docs/pages/Raycaster.html): model loading, scene hierarchy and picking.
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance): demand rendering and shared resources.
