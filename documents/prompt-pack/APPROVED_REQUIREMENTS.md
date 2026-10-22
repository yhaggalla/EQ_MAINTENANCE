# CICT EQ & FAC Maintenance approved requirements

Version 2.0 | 22 October 2026 | Planning and implementation contract: stage 1 EQ scope, pre-implementation review decisions and the SOW V2 additions (FAC section, feature permissions, ZMMS daily jobs, automatic status, spare-part condition)

## 1 Purpose and authority

Build a separate Engineering Portal application, displayed as **EQ & FAC Maintenance**, with two main sections:

- **EQ**: management sees fleet readiness; the EQ Team records special (major) repair and replacement work against equipment and its components, corrects the operational status and keeps the condition of major spare parts. Daily maintenance jobs and the automatic operational status come from ZMMS. A selectable QC model connects the visual equipment to the same records used in the mechanism tree.
- **FAC**: facility maintenance (electrical, mechanical and civil inspections and services across the terminal). The FAC Team updates progress on a master job list; management follows it on a constantly moving dashboard.

This contract combines the supplied SOW (V1), SOW V2 revision 4 (confirmed by the user on 22 October 2026), the user's mechanism table, the facility job list, the engineering references, and the user's answers. It is not a request to reproduce every fabrication parameter or operate physical equipment.

Authority order: later explicit user instructions; the confirmed decisions below; SOW V2 (`documents/SOW_V2.docx`, same text in `documents/SOW_V2.md`) over SOW V1 where they differ; supplied mechanism source and facility job list; drawing observations; documented technical defaults in this pack. Where the SOW's broad all-equipment illustration differs from the confirmed staging, the confirmed staging wins. Never reinterpret legacy notes in the Portal repository as current deployment evidence.

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

SOW V2 decisions, confirmed on 22 October 2026 (SOW V2 section 9). Where they differ from the rows above, they win:

| Decision | Confirmed choice |
| --- | --- |
| Sections | Two main sections, EQ and FAC, with a section switch; display name "EQ & FAC Maintenance"; technical identifiers stay `eq-maintenance` |
| Roles | Main roles assigned in the Portal: Admin, Management, EQ Team and the new FAC Team. Feature access (tab visibility and optional rights) is adjusted in app Admin under the role ceilings |
| FAC master list | Admin manages it; Admin can grant that right to FAC Team. Seeded once from `documents/Facility- Dashboard.xlsx` with a reviewable preview; blanks are imported and completed in Admin |
| FAC frequencies | Tri-annually = every 4 months; bi-annually = every 6 months; the user picks the frequency from an Admin-maintained list when adding a job; next due counted from the actual completion date, for recurring jobs only |
| FAC daily checks | One-tap "Done today" / "Done this week" for daily and weekly jobs |
| Management | Read-only in both sections; tab visibility adjustable in Admin |
| EQ Jobs tab | Three parts: special jobs (manual, bound to main/sub/part) with ZMMS daily jobs listed below them; EQ status; condition of major spare parts. History lives in the Jobs tab, not in the crane view |
| ZMMS | Read the ZMMS daily all-job list (`https://www.zmms.lk/?r=job/daily-alljob`) twice a day (Admin-set times, plus Sync now). ZMMS is CICT-owned; the user, as its owner, agrees to login-based reading; ZMMS has no API. Read-only; account kept out of source and documents |
| Automatic status | Status set from the day's ZMMS plan (breakdown job -> Breakdown, maintenance job -> Maintenance, not in the plan -> Ready for OPS); the job-type mapping is set in Admin after the first real data. A manual correction lasts for the current day only |
| Spare parts | Admin selects which part positions are major spare parts; next predicted replacement = replaced date + expected life in months; Original parts count from the equipment commissioning date |

## 2 Scope and acceptance identifiers

| ID | Required result |
| --- | --- |
| S01 | Configurable QC/RTG/ES equipment register, model families and active/retired state |
| S02 | Fleet overview with equipment-type groups, searchable equipment, current status, status counts and last-update information |
| S03 | Exactly three operational statuses: Ready for OPS, Breakdown and Maintenance; unreported initial status stays visibly unset; every status shows its source (automatic from ZMMS or manual) |
| S04 | Authenticated, selectable QC overview model with named major assemblies, orbit/pan/zoom and reset/fit controls |
| S05 | Equipment -> main mechanism -> submechanism -> main part navigation, with the same selection accessible through a tree |
| S06 | Overall and Technical modes; Technical mode reveals useful simplified internals and verified specifications |
| S07 | Selecting a mechanism, submechanism or part focuses it and shows its current state in the right panel (open special jobs, current spare-part condition, specifications) with an "Open in Jobs" link to its scoped history; no work history in the crane view |
| S08 | EQ Jobs tab in three parts: special jobs (Pending, Current, Completed) with the ZMMS daily jobs listed below them, EQ status, and spare-part condition; equipment, type, classification and date filters; the full scoped history is kept here |
| S09 | EQ Team can create, edit active work, progress and complete special repair/replacement jobs, correct the operational status and update spare-part condition |
| S10 | Admin manages equipment, applicability, mechanisms, parts, model bindings and specifications, and makes audited corrections |
| S11 | Management is read-only across fleet, equipment details and permitted work evidence |
| S12 | Separate equipment-specific part positions and replacement events; retain previous installations/history |
| S13 | Auditable status transitions and material job/replacement changes, safe concurrent edits and atomic completion |
| S14 | Source-linked major technical parameters and authenticated access to supporting drawings/photos |
| S15 | Central Portal sign-in, explicit app/role registration, appropriate local profile provisioning and same-origin routing |
| S16 | Responsive, keyboard-accessible normal workflows with a useful non-3D fallback |
| S17 | Testable local implementation, reproducible model assets, measured performance and a reviewable release package |
| S18 | Two main sections, EQ and FAC, with a section switch, per-section tabs, a shared Admin, display name "EQ & FAC Maintenance" and last-used landing page |
| S19 | Feature-permission matrix in Admin > Access: per-role tab visibility and optional rights within the Portal role ceilings, enforced on the server, audited |
| S20 | ZMMS daily-job import: login-based, read-only, twice a day at Admin-set times plus Sync now; equipment mapping; every synced day kept; sync health shown; account outside source, logs and browser |
| S21 | Automatic EQ status from the day's ZMMS plan with an Admin job-type mapping; manual correction with a reason lasting the current day; status history with its source |
| S22 | Major spare-part condition register per equipment: Original/Replaced, brand, model/part no., serial, replaced date, expected life, next predicted replacement, due-soon/overdue flags, change history |
| S23 | FAC master job list with the short field set, deactivate-not-delete, and a one-time reviewable import of the supplied facility job list |
| S24 | FAC frequencies and cycles: Admin-maintained frequency list, next due from completion for recurring jobs, due-soon/overdue flags, one-time and continuous kinds, Done today/this week |
| S25 | FAC progress: Pending/In progress/Completed/On hold, quantity-based progress updates with note/photos, same-day undo, Admin correction with reason |
| S26 | FAC pictures: optional job picture and optional completion pictures (up to 5 per update), camera capture on phones, protected storage |
| S27 | FAC Dashboard for management: KPI strip, three discipline lanes as continuously moving lists, live updates ticker, latest-proof photo carousel, 8-week due load, TV mode, reduced-motion fallback, 60-second refresh |
| S28 | FAC Jobs tab for the FAC Team: My work, status board/list with filters, one-tap actions, job detail with timeline and previous cycles, one-time jobs, phone-first update form |
| S29 | Excel export of filtered EQ and FAC lists for roles allowed to export |

RTG and ES detail pages still provide specifications, the applicable mechanism tree, current state and links to their work records, replacement history and evidence in the Jobs tab. Show a suitable thumbnail and a clear statement that their 3D view is not available in stage 1. Do not substitute a QC model and present it as an RTG or ES.

Stage 1 excludes live PLC/SCADA/IoT feeds, remote equipment control, structural stress calculations, load/safety certification, predictive maintenance beyond the simple expected-life date of S22, Maximo/EAM work-order references or synchronisation, bulk import of historical work records, procurement/stock control, full preventive-maintenance scheduling for EQ, costs/budgets, public user registration, and full RTG/ES 3D authoring. These are not implied by a graphical maintenance dashboard.

SOW V2 further excludes: writing anything to ZMMS; reading ZMMS pages other than the daily job list; linking ZMMS daily jobs to mechanisms or parts; predictions from running hours, sensors or AI; spare-part stock and purchasing; FAC email/SMS/WhatsApp reminders; automatic running-hour readings; contractor management; detailed per-item inspection checklists; maps/GIS; links from FAC jobs to EQ equipment; offline mode.

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

### 4.1 Portal roles (ceilings)

PortalAdmin assigns one or more of four roles in the ENG Portal. A user holding several roles gets the union of their rights.

| Portal role | Code | Ceiling |
| --- | --- | --- |
| Admin | eq-maintenance:admin | Everything in both sections, plus app Admin |
| Management | eq-maintenance:management | Read-only in both sections |
| EQ Team | eq-maintenance:eq-team | EQ work (special jobs, status correction, spare-part condition, EQ evidence); read FAC |
| FAC Team | eq-maintenance:fac-team | FAC work (progress, hold, photos, one-time jobs); read EQ |

| Action | Admin | EQ Team | FAC Team | Management |
| --- | --- | --- | --- | --- |
| Read fleet, equipment, work and allowed documents (subject to tab visibility) | Yes | Yes | Yes | Yes |
| Create special jobs and update Pending/Current EQ work | Yes | Yes | No | No |
| Complete a valid special job and its replacement lines | Yes | Yes | No | No |
| Correct the equipment operational status (manual, current day) | Yes | Yes | No | No |
| Update spare-part condition | Yes | Yes | No | No |
| Correct or reopen completed EQ work, with reason/history | Yes | No | No | No |
| Cancel an uncompleted special job, with reason | Yes, any job | Yes, jobs they created | No | No |
| Update FAC progress, Done today, hold, completion photos | Yes | No | Yes | No |
| Add FAC one-time jobs | Yes | No | Optional (default on) | No |
| Manage the FAC master list (recurring jobs) | Yes | No | Optional (default off) | No |
| Correct FAC cycles, remove any photo, with reason | Yes | No | No | No |
| Export to Excel | Yes | Optional (default on) | Optional (default on) | Optional (default on) |
| Add/update equipment, templates, classifications, main parts, spare-part selection and expected life | Yes | No | No | No |
| Set applicability, specifications, model bindings, ZMMS mapping and sync settings | Yes | No | No | No |
| Attach EQ work evidence | Yes | Yes, to accessible work | No | No |
| Change the Access matrix | Yes | No | No | No |
| Alter central identities or grant arbitrary Portal roles | No implicit right | No | No | No |

Admin here means EQ & FAC Maintenance Admin. It does not automatically mean PortalAdmin. Central account/role provisioning continues to follow the Portal's current administrative contract; the four roles are not delegable in stage 1.

### 4.2 Feature permissions (Admin > Access)

App Admin adjusts a per-role on/off matrix (SOW V2 3.2). Defaults: every view tab (EQ Fleet and equipment detail, EQ Jobs, FAC Dashboard, FAC Jobs) is on for every role; the optional rights above have the defaults shown.

- A toggle applies to a role, never to an individual user, and can only narrow a role or switch on an optional right listed above. It can never give Management write access, give any right above the Portal role's ceiling, or make anyone an app Admin. Admin rights are fixed on.
- The server enforces the matrix on every page route, API endpoint, export and file/photo link. A hidden tab or button is not authorization.
- Every matrix change records actor, time and old -> new values and takes effect at the user's next refresh (within 60 seconds).
- A user whose tabs are all off sees a "No access - contact the EQ & FAC Maintenance Admin" page, not an error.

There is no invented departmental approval chain or per-equipment/per-discipline restriction. No second production login or local password database is required.

## 5 Operational status and work lifecycle

Operational state and work state are independent:

- Operational status is Ready for OPS, Breakdown or Maintenance. New equipment has no reported operational status until the first ZMMS sync that covers it (if mapped) or an authorized user sets one; a neutral Unreported display is not a fourth operational status.
- For ZMMS-mapped equipment the status is automatic (section 5A). A manual correction overrides it for the current Asia/Colombo day only. Equipment with no ZMMS mapping keeps manual status as below.
- Every operational-status change records its source (ZMMS sync or user), actor where there is one, and time. A short reason is mandatory for a manual Breakdown or Maintenance and for every manual correction of an automatic status; optional for a manual Ready for OPS. The change may reference a related job on the same equipment. Fleet and equipment views show how long the equipment has been in its current status, computed only from recorded status history; equipment never set shows no duration, and nothing is inferred from before tracking began.
- Work status is Pending, Current or Completed. Pending work can move to Current or be recorded directly as Completed for work already performed, if required completion information is supplied.
- Completing a job never automatically marks the equipment Ready for OPS. Status changes come only from a successful ZMMS sync (mapped equipment) or an explicit user action.
- Admin may reopen/correct completed work with a mandatory reason and an immutable record of the prior values. Do not destroy replacement history when a job is reopened.
- A completed replacement cannot be silently undone by reopening its job. Use an explicit audited correction that recomputes the installed position consistently and refuses to overwrite a later replacement.
- An uncompleted job can be cancelled with a mandatory reason: by EQ Team for jobs they created and by Admin for any job. Record who cancelled it and when. Keep it out of the three normal work columns and available through an Include cancelled filter; never turn it into completed work or delete its history. A completed job cannot be cancelled; use the Admin correction path.

Job defaults: equipment; scope target (equipment/main/sub/part); title; Repair or Replacement kind; description; planned date if known; optional responsible person; work status; actual completion date and completion note when completed. Priority may be a simple optional field, not a new approval workflow.

Each job belongs to exactly one equipment item. Ancestors must belong to that equipment. An equipment-level job has no invented component target and appears at equipment level; it is not repeated in every mechanism. A replacement line must resolve an actual main-part position under that equipment. A job can have multiple replacement lines on the same equipment; reject duplicate lines for the same position in one completion operation.

Replacement details: part position, removed item where known, installed item description, model/part number and serial if known, quantity/UOM appropriate to the position, replacement date, linked job and optional evidence. Use a quantity-bearing installation/lot representation for rope sets and similar multi-item positions where necessary; do not assume every position is a single serialized motor. Original/removed item may be explicitly Unknown. Do not invent a serial number, initial service date or opening installation.

Use a database transaction for job completion, installation changes and audit records. Use request identifiers or equivalent idempotency protection for retried completion commands, plus concurrency tokens for updates. Repeating a successful command must not duplicate an installation or a replacement event.

Record audit instants in UTC and show them in Asia/Colombo. Preserve actual work dates as business dates when no exact event time is supplied. An audit timestamp is not proof of the physical replacement time. Do not fabricate downtime history before tracking began.

Current fleet counts are valid stage 1 indicators. MTBF, MTTR, availability percentages, structural health scores and economic remaining life require additional definitions/data and are not stage 1 promises. The S22 predicted replacement date is a simple calendar rule, not a remaining-life assessment, and is labelled as such.

In V2 the jobs above are the EQ **special jobs**: major or non-routine work entered by hand and bound to one equipment and to its equipment level, main mechanism, submechanism or main part. Completing a Replacement special job opens the spare-part condition form for the selected part, pre-filled (section 5B); saving it is part of the same atomic completion.

## 5A ZMMS daily jobs and automatic status

- Source: the ZMMS (CMMS.LK) daily all-job list, `https://www.zmms.lk/?r=job/daily-alljob`. ZMMS is a CICT-owned app without an API or export; its owner (the user) has agreed that this app signs in with a dedicated account and reads that page. The page requires a login (checked 22 October 2026).
- A server-side connector signs in and reads the list twice a day at Admin-set times (defaults 06:00 and 14:00 Asia/Colombo) and on Admin "Sync now". It only reads; it submits no ZMMS form other than the login, follows no link outside the daily job list and never writes to ZMMS.
- The account is runtime configuration (environment, user secrets or the protected configuration store of the host). It never appears in source, tests, fixtures, documents, logs, error messages, the browser or evidence. Automated tests use sanitised recorded page fixtures, never the live site.
- Each record keeps at least the ZMMS job number, job date, ZMMS equipment text, description or type and job status; the exact field list is fixed from the real page in the ZMMS phase. Records are upserted by ZMMS job number and date, so repeated syncs do not duplicate them. Every synced day is kept.
- Equipment is matched through an Admin mapping table (ZMMS equipment text or code -> app equipment). Unmatched rows are kept and listed in Admin for mapping, never dropped or guessed.
- Daily jobs are read-only, linked to the equipment only (not to a mechanism or part), and listed in the EQ Jobs tab below the special jobs with the same filters.
- Sync health: each run records start/end, rows read, rows new/updated, unmatched rows and failure reason. Admin sees the history; users see "ZMMS data from <date time>". A failed sync, a login failure or a page layout that no longer matches the parser keeps the previous data, records a failure, retries with backoff and warns Admin. It never saves partial or wrongly parsed rows and never changes statuses from a failed run.
- Automatic status after a successful sync, for each mapped active equipment, from that Asia/Colombo day's plan: an open job whose type/status maps to Breakdown -> Breakdown; else one that maps to Maintenance -> Maintenance; else Ready for OPS. The ZMMS job-type/status mapping is Admin configuration set after the first real data; until it is set, the sync stores daily jobs but changes no status.
- A manual correction (reason mandatory) shows "Manual" and holds for the rest of that day, including over that day's second sync. The first successful sync of the next day returns the equipment to automatic status. "Back to automatic" ends it earlier.
- Each status change records its source, the sync run or user, and the ZMMS jobs that caused it.

## 5B Condition of major spare parts

- Admin marks which installed main-part positions are major spare parts (per template, adjustable per equipment). Each equipment has its own register over its own position instances (section 3 identity rules apply).
- Fields: condition (Original or Replaced), brand, model/part number (optional), serial number (optional), replaced date (blank for Original), expected life in months, next predicted replacement, remarks.
- Expected life is set per part type by Admin and can be overridden per equipment position. Next predicted replacement = replaced date + expected life; for an Original part the equipment commissioning date (an optional Admin field on the equipment) is used; if that date is unknown, no prediction is shown. Never fabricate a commissioning or replacement date.
- Flags: overdue past the predicted date; due soon within 90 days (Admin setting).
- The EQ Team updates the register directly or through a completed Replacement special job. Each change keeps the previous values (an append-only condition history per position), visible in the spare-parts part of the Jobs tab. The installation/replacement-event rules of section 5 remain the underlying identity model; the register is their current-state view plus the additional condition fields.

## 6 History and source parameters

Main-mechanism history includes work targeted directly at it and at its descendants. Submechanism history follows the same rule. Part history is exact-position history. De-duplicate jobs with multiple descendant replacement lines so the job count and timeline do not multiply. Show the matching lines within a job.

History must distinguish repair, replacement, job progress and operational status. A selected-part technical sheet shows its identity, position, latest known installation, verified parameters, references and timeline. Show empty history as No work recorded, never proof that a component is original or healthy.

`reference/major-parameters.json` records observations from the J526A00 drawing family. These are not an approved seed assignment to the current fleet. Store parameter code/name, value or source observations, unit, operating condition, drawing/page, verification state, model applicability and optional Admin correction history.

Required initial fields are lifting capacities, rail gauge, outreach, backreach and lift height. Major motor ratings, speeds, rail type and incoming supply can be available in Technical mode. Do not turn every drawing dimension, bolt torque or fabrication tolerance into a required form field.

The drawing's 63 m is total lift height, not overall crane height. General-arrangement gantry speed is 46 m/min while J526A0600 reports 45.5 m/min; keep this unresolved source conflict visible until an authorized technical decision records the intended value. It need not block unrelated features.

The cover refers to 12 STS cranes. Do not infer current fleet counts, specific QC identifiers, service dates or compatibility of later crane models from it. Admin registers actual equipment and assigns a verified model template. Development examples must be clearly synthetic and isolated from production seed commands.

## 6A FAC section

The FAC section is specified in SOW V2 section 5, which is part of this contract. Summary of the binding rules:

- **Job fields (S23)**: discipline (Electrical, Mechanical, Civil; Admin-extendable), type (Inspection or Service), job name, frequency, quantity (default 1), kind (Recurring default, One-time, Continuous), PIC (FAC Team user or typed name, optional), in-house/outsource (optional), last done date (optional), job picture (optional), remarks (optional), active. Calculated, never typed: next due, completed/pending quantity, % complete, status, days overdue. Jobs are deactivated, never deleted.
- **Import (S23)**: `reference/fac-job-list.json` is the normalised seed derived from `documents/Facility- Dashboard.xlsx` (111 sheet rows, 114 jobs after splitting three two-frequency rows). Admin sees a preview with every row's saved form and its issues; nothing is saved until Admin confirms; the import can be repeated over the imported set until the first progress is recorded. Blank quantity imports as 1; blank PIC/mode/dates stay blank; sheet status and percentages are not imported as typed values but set the opening cycle state (Completed rows with a last date open their next cycle; Pending rows with a completed quantity open In progress; the row 14 remark opens On hold). Known source issues are listed in the JSON and shown in the preview.
- **Frequencies and cycles (S24)**: the Admin list in the JSON (Daily 1 day, Weekly 7 days, Monthly 1, Quarterly 3, Tri-annually 4, Bi-annually 6, Annually 12, Once in 2/3/5 years 24/36/60 calendar months; Running hours: next due entered at completion; As required: no due date). Recurring: next due = last done date + interval in calendar months/days; completing a cycle sets last done = completion date and opens the next cycle as Pending. One-time closes on completion. Continuous has no due date and is tracked by quantity until marked completed. Due soon = within 7 days (Admin setting); daily jobs are due today; overdue = past due and the cycle not completed. A job without a last done date has no due date until its first completion or an Admin-entered date. Daily/weekly jobs get one-tap Done today / Done this week; their cycles are the day/week.
- **Progress (S25)**: statuses Pending, In progress, Completed, On hold (reason mandatory); flags Due soon and Overdue computed on top. The normal action is one update form: quantity done now or All done, date (default today, not in the future), optional note, optional photos. Completed quantity never exceeds the job quantity. Reaching it completes the cycle after a confirmation. Every update is an append-only timeline entry (who, when, +quantity, note, photos). A user may undo their own last update on the same day; Admin corrects any cycle with a reason and the previous values are kept. Updates are idempotent per request and use concurrency tokens.
- **Pictures (S26)**: job picture optional, one per job, replaceable; completion pictures optional, up to 5 per update. JPG/PNG up to 10 MB each, validated by signature, resized (long edge 1920 px) with thumbnails, stored in the protected storage, shown only to users allowed to view FAC. The uploader can remove their own photo the same day; Admin any photo with a reason; removals recorded.
- **Dashboard (S27)** and **FAC Jobs (S28)**: as SOW V2 5.5 and 5.6, including the order of the moving lists (Overdue, On hold, In progress, Due soon, Pending, completed in the last 7 days), pause on hover/focus/Pause button, page-flip every 8 s under reduced motion, TV mode signed in as a normal Management user (no anonymous view), 60-second refresh with "Updated hh:mm" and a stale-data warning, filters kept in the URL, phone layout without auto-scroll, and the phone-first update form with camera capture.
- **Export (S29)**: filtered FAC lists export to .xlsx with the source sheet's columns plus the calculated ones; filtered EQ special-job, daily-job and spare-part lists export likewise.

## 7 Screens and interaction

0. Top bar: section switch (EQ | FAC), the tabs of the current section, Admin for Admin; only permitted sections/tabs are shown; the switch is hidden when only one section is permitted. Landing: last used section/tab; first visit EQ Fleet for EQ Team, Management and Admin, FAC Dashboard for FAC Team.
1. Fleet: type tabs/groups, Ready/Breakdown/Maintenance/Unreported counts, search, status filters, compact equipment cards or rows showing status source (Auto/Manual) and today's ZMMS daily-job count, last updated, and links to details. At desktop sizes the whole fleet should be easy to survey; scrolling/filtering is acceptable for larger registers. Do not render one interactive canvas per card.
2. Equipment: header with code/type/status (with source) and status-correction action for writers; mechanism tree; centre viewport; right current-state panel (open special jobs, spare-part condition, specifications, "Open in Jobs"); breadcrumb; Overall/Technical toggle. No work history in this view.
3. EQ Jobs: three parts. (a) Special jobs: Pending/Current/Completed tabs or board, add/edit form, completion dialog, replacement position selection, work evidence, cancelled filter, scoped history by equipment/main/sub/part; below them the read-only ZMMS daily jobs with "ZMMS data from" freshness. (b) EQ status: current status per equipment with source, correction and Back to automatic, status history. (c) Spare parts condition: register per equipment with flags and per-part history. Shared filters: equipment, type, date range, search. Moving a card must still enforce the same server rules as the form.
4. FAC Dashboard and FAC Jobs: section 6A.
5. Admin: EQ settings (equipment/model templates, applicability, the coded mechanism list, installed positions, major spare-part selection and expected life, source specifications, model-binding validation, ZMMS mapping, job-type mapping, sync times and health), FAC settings (master list, import preview, disciplines, types, frequencies, due-soon window, refresh interval, dashboard scroll speed, cycle corrections) and Access (section 4.2). Reserve central identity administration for the Portal.

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
- Run the ZMMS connector as a hosted background service inside the single EQ host (no separate scheduler or service), with one run at a time, a timeout, and a parser that fails closed on an unexpected page. Use only the .NET HTTP client and an HTML parser library selected in the ZMMS phase; no headless browser unless the page cannot be read without script execution, which the ZMMS phase must prove first.
- Poll lightweight fleet data at a configurable interval, with a 60-second default plus refresh after writes. No push infrastructure is required in stage 1. Show freshness and preserve last good data with a stale/error indicator on failures.

Proposed technical identifiers, to use unless an actual collision is found:

| Item | Proposed value |
| --- | --- |
| Application code | eq-maintenance |
| Browser base path | /eq-maintenance |
| Public API base | /eq-maintenance/api |
| Token audience | urn:cict-eng:eq-maintenance |
| Display name | EQ & FAC Maintenance |
| Roles | eq-maintenance:admin; eq-maintenance:management; eq-maintenance:eq-team; eq-maintenance:fac-team |
| Local binding claim if required by the current Portal contract | cict:binding:eq-maintenance:local_user_id |

The existing Portal's shared validation library has explicit registered audiences/roles. Central issuance, the shared contract, launcher registry, profile provisioning and every relevant consumer must be tested together. An old validator can reject a shared token containing an unknown new audience or role. Do not weaken that validation to onboard this app; plan compatible consumer packages and rollout sequencing instead.

## 9 Definition of stage 1 completion

S01-S29 must be implemented or have an explicit user-approved scope change, and the required acceptance cases in `ACCEPTANCE_CHECKLIST.md` must have evidence. Real data persistence, role enforcement, drill-down history and replacement transaction behaviour are required; attractive fixtures alone are not completion.

The QC model must be recognizably matched to the supplied general arrangement in side/end/top views, with source-based proportions and working main/sub/part navigation. Simplified internals are labelled where dimensions or vendor shapes are not established.

Finish with a working local build, test results, visual evidence, source/model manifest, unresolved technical-source issues, and a prepared IIS release/rollback package. Building that package does not establish production or engineering acceptance. A later explicitly authorized deployment must verify authenticated user outcomes in the target environment.

## 10 Reference notes

The local source review is `F:\CODEX\EQ_MAINTENANCE\documents\EQ_MAINTENANCE_REQUIREMENTS_REVIEW.md`. Core originals remain in `documents\SOW.docx`, `documents\SOW_V2.docx`, `documents\Facility- Dashboard.xlsx` and `As-bulit drawing`; do not edit those to make an implementation easier.

Technical references checked on 21 October 2026:

- [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core): .NET 10 LTS is supported through 14 November 2028; .NET 8 support ends 10 November 2026. Recheck at implementation time.
- [React Three Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation): match the Fiber and React major versions.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [Object3D](https://threejs.org/docs/pages/Object3D.html), and [Raycaster](https://threejs.org/docs/pages/Raycaster.html): model loading, scene hierarchy and picking.
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance): demand rendering and shared resources.
