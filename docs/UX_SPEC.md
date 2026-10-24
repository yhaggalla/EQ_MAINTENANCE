# UX specification

Current status (24 October 2026): **U1 IN PROGRESS; NOT COMPLETE / NOT APPROVED.** Sections 26-28 define the current shared viewer and supersede earlier separate-page/SVG, camera Reset and physical-area control descriptions. All refinements remain U1 work; P04 is Not started.

Prepared in P02 on 21 October 2026; extended in P02B on 22 October 2026 to SOW V2 and the P01B contracts (sections 13-19 below; where they differ from sections 1-12, **sections 13-19 win**). Status: **design contract for R02B and the U1 repeat checkpoint**, backed by a runnable prototype (`artifacts/prototypes/p02-ui`, run instructions in its README) with the shared equipment-page viewer for both camera modes (sections 26-28). Authorities: `documents/prompt-pack/APPROVED_REQUIREMENTS.md` s4, s5, s7, `QC_3D_MODELLING_BRIEF.md` s5, `docs/DATA_CONTRACT.md`, `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md` s6-s7. Decisions made here are D-45 to D-54 (P02) and D-129 to D-138 (P02B) in `docs/DECISIONS.md`.

**What is real and what is not.** Real: the mechanism catalogue (16 main, 43 sub, 41 active, 048/063 inactive, no main 10, 061 Spreader, 062 Headblock) and the drawing observations (J526A00 family, including the unresolved 46 / 45.5 m/min gantry-speed conflict). Synthetic and labelled so on every page: all equipment (`*-DEMO-*`), positions, jobs, history, users, ZMMS daily jobs and sync runs, spare-part register, FAC progress, photos and updates, and the simulated server rules. The only real data in P02B besides the mechanism catalogue is the FAC job list (114 jobs from `reference/fac-job-list.json`, with their issues). The QC viewer now uses the drawing-derived P03 model in both Flat and 3D modes (U1-C32/C33); its equipment bindings remain synthetic. Nothing is persisted, no sign-in exists, and the role switch is a simulation; a reload restores the fixtures.

## 1 Roles and permission states

The UI reads capabilities (`GET /session`, API s4.1) and the prototype simulates them with a role switch. The server remains the authority: in the prototype every action goes through one rule layer (`js/store.js`) so a button, a form and a direct call behave identically, and the checks prove refusals for Management (403) on every write.

| Capability | Admin | EQ Team | Management | How the UI shows it |
| --- | --- | --- | --- | --- |
| Read fleet, equipment, history, jobs, parameters | yes | yes | yes | all screens, no restriction |
| Add / edit / start / return job, complete job and lines | yes | yes | no | buttons absent for Management (not merely disabled); the persistent chip "Read-only access" in the top bar and "Read-only: Management cannot change records" in the equipment header explain why |
| Set operational status | yes | yes | no | "Update status" absent for Management |
| Cancel uncompleted job | any | own jobs only; never a reopened (previously completed) job | no | button shown with `aria-disabled` and a visible reason line when not allowed ("EQ Team can cancel only jobs they created ..."); Admin cancel of a reopened job needs its committed lines voided first |
| Reopen / correct completed work | yes | no | no | "Reopen (Admin)..." only for Admin; correction records (before/after, reason, actor) are shown to everyone |
| Equipment, models, catalogue, positions, specifications, bindings | yes | no | no | Admin top-bar link only for Admin; a direct link by another role shows a "403 - EQ Maintenance Admin only" explanation, because hiding the tab is not the control |
| Attach work evidence | yes | yes | no | evidence panel states the rule; upload itself is P08 |
| Central identity / Portal role administration | none | none | none | absent; the Admin intro says it is managed in the Portal |

Management is never blocked from navigation: it can open every screen, filter, select, read history and technical sheets and use the 3D placeholder.

## 2 Navigation and routes

> **P02B:** the single top bar of this section is replaced by the EQ | FAC section switch with per-section tabs (section 13). The P02 paths below still resolve and redirect to `/eq/...` (D-89).

Top bar (Portal pattern: navy bar, gold CICT mark, gold underline for the current page): **Fleet**, **Jobs**, **Admin** (Admin only), user/role chip, read-only chip. The skip link is the first focus stop. Routes (hash routes in the prototype; the same paths under `/eq-maintenance` in production, ARCHITECTURE s6):

| Route | Screen | URL state |
| --- | --- | --- |
| `/fleet` | Fleet dashboard | `type`, `status`, `lifecycle=all`, `layout=table` |
| `/equipment/{id}` | Equipment detail | `main`, `sub`, `part` (instance IDs), `mode=technical`, `panel=technical`, `container=machinery-house` |
| `/jobs` | Jobs workspace | `status`, `equipment`, `type`, `kind`, `main`, `dateField`, `from`, `to`, `includeCancelled=1`, `layout=tabs` |
| `/jobs/{id}` | Job record | none |
| `/admin/{equipment,models,catalog,positions,parameters,bindings}` | Admin sections | `equipment` |

Rules: every query value uses only `[A-Za-z0-9_-]` (D-20: the Portal return-URL validator rejects `%`), so selection survives a sign-in redirect; free-text search is not in the URL. A link to an ID that does not belong to the equipment (`part=` of another crane) shows a notice and the whole-equipment view (the server would answer 422 `target_not_in_equipment`). A route change moves focus to the page and announces the page name in a polite live region; a selection change inside the equipment screen keeps focus where it was (the tree item stays focused).

## 3 Screens

### 3.1 Fleet dashboard (S02, S03, S16)

- (P02B) The "manual status, no telemetry" note is replaced by the automatic-status meaning (section 15): status follows today's ZMMS plan (Auto), an EQ Team correction holds for the day (Manual), unmapped equipment keeps a manual status, never-set equipment shows **Unreported**, not Ready. Each card shows the source and today's ZMMS job count.
- Freshness line: "Data refreshed hh:mm:ss Asia/Colombo", "Auto-refresh every 60 s and after every change", **Refresh now**.
- Status count strip: Ready for OPS, Breakdown, Maintenance, Unreported (each a toggle button with `aria-pressed` that filters) plus "Active equipment" with "Retired items are excluded". Counts follow the type filter but not the status filter or search, so they reconcile with the groups (API s4.2). Each equipment is counted once.
- Filters: equipment type (All, QC, RTG, ES), search (code, name, model), include retired, layout Cards or Table.
- Groups: QC, RTG, ES sections with their own mini counts (icon, number and an `aria-label` such as "Maintenance: 2"). RTG and ES groups carry "3D not available in stage 1".
- Card: type icon (not a model, no canvas), code, status badge (icon + text + colour), "In Maintenance for 2 d 4 h" computed only from recorded status history or "No status reported yet", open job count, last update (Asia/Colombo), model code or "No verified model" / "No 3D in stage 1", link to the equipment. Retired cards are dashed and tagged.
- Table layout carries the same fields for scanning and screen readers.
- No WebGL canvas anywhere on the fleet (checked: zero canvases on every route).

### 3.2 Equipment detail (S04-S07, S14)

Header: eyebrow "QC equipment", code, status badge, time in status and since-time, the reason for Breakdown/Maintenance, model association, link "N open jobs"; writers get **Update status** and **Add job**. Below it: breadcrumb (Fleet / code / main / sub / part), on tablet and phone the **Mechanisms** and **Details** drawer buttons.

Three regions at desktop width:

1. **Mechanism tree** (left): "Whole equipment" > 16-code mechanism > submechanism > part position. Only mechanisms applicable to the equipment's model appear. Each node shows its code, name and an "N open" count. A filter box narrows the tree. Draft positions carry a "draft" tag.
2. **Model area** (centre): Overall / Technical toggle, zoom in/out, Fit, Reset, "Open-work markers", status badge outside the geometry, a tag "Placeholder schematic, not the P03 model", a collapsible legend, and an **Assemblies** button row that selects the same things as the scene (Portal frame, Machinery house (container), Boom, Trolley, Operator cabin, Spreader, Headblock, Gantry bogies, Main hoist).
3. **Right panel**: scope title and kind, and (P02B, U1-C19) exactly four current-state tabs **Maintenance**, **Projects/Special**, **Technical**, **Spare parts**; **no work history** (section 14). The History tab of P02 is replaced.

RTG and ES use the same layout. The model area says "3D view not available in stage 1" (never a QC picture), the tree, history, technical sheet and a records summary remain. A QC without a verified model association says "No verified model association" and offers Admins a link to associate one.

### 3.3 Jobs workspace (S08, S09)

- Header text: moving a job uses the same rules as the forms; completing never changes operational status. **Add job** for writers.
- Filters: equipment, type, kind, main mechanism, date field (planned or completion), from, to, search, **Include cancelled**. Layout **Board** (default; stacks to one column below 1280 px) or **Tabs** (Pending, Current, Completed with counts, one column visible at a time).
- Job card: number, kind tag, status tag, title, equipment link, target path, planned or completion date, responsible, creator ("you" for the signed-in user), replacement-line count, cancel details when cancelled. Actions as buttons (no drag and drop): Open, Edit, Start / Return to Pending, Complete..., Cancel..., Reopen (Admin...).
- Cancelled jobs leave the three columns and appear in a separate Cancelled section when included; never as Completed.

### 3.4 Job record

Details (target, kind, priority, planned, responsible, creator, version, completion data), a note that the job does not change equipment status, progress timeline, Admin corrections with prior values, replacement lines (links to the exact position history), and the evidence statement.

### 3.5 Admin (S10)

Sub navigation with six sections. **Equipment**: register, verify model association (needs a note; creates draft positions), retire (refused while uncompleted jobs exist), duplicate codes refused, new equipment starts Unreported with no model, serial or date. **Models and applicability**: per model, applicable / not applicable / unknown for every catalogue definition (unknown is never treated as applicable; 048/063 locked), explanation that editing raises the template revision only. **Mechanism catalogue**: real data with counts, "Main 10 intentionally absent", original labels, deactivate/activate (never delete), reserved entries unusable. **Main-part positions**: per equipment, semantic key (lock once confirmed), kind, state, provenance and source; draft banner with Confirm all / Confirm ticked (B-08); identity check showing one template resolving to separate position IDs for two QCs. **Specifications**: drawing observations with conflict states and a reason-required resolve dialog. **Model bindings**: validation preview (exact-key matching only, orphans, no-visual entries, draft positions block activation); nothing can be activated in the prototype.

## 4 Selection and history rules

One selection state (the URL: `main`, `sub`, `part`, or `container`) is written by the tree, the breadcrumb, the Assemblies buttons and the scene, and read by all of them (S05, S07). Back and forward restore it.

| Action | Result |
| --- | --- |
| Click a tree node, breadcrumb crumb, assembly button or scene element | same `select()`: URL updated, tree node selected, scene highlight, right panel scope, breadcrumb |
| Select a main mechanism | highlights the union of its bound positions; camera fits the union; history includes work at the main and all descendants |
| Select a submechanism | same at sub level (union of its positions) |
| Select a part | exact-position history; installed item now; installation events (voided ones kept and marked) |
| Click the machinery house | spatial container: no maintenance selection, camera fits the house, panel lists contained positions grouped by mechanism, each a link; it is never a mechanism and owns no history (DATA s10.10) |
| Select something with no visible representation in the current mode | camera does not move; a notice says so and suggests Technical mode |
| Click empty background | does nothing to the selection; an open job form is a modal dialog, so an unsaved form is never lost by a background click |
| Newer selection or a drag during a camera move | the running transition is cancelled; with reduced motion the fit is instant |

Scope rules (DATA s9), implemented and checked in the prototype: a job appears once per result with its matching lines; an equipment-level job appears only at equipment level; part scope is exact-position so a same-named position elsewhere never leaks in; cancelled jobs are excluded unless "Include cancelled jobs" is ticked. Sections: Installed now (part scope), Open work, Completed work, Installation events (part), Operational status changes (equipment scope). Empty results say **No work recorded** and, for a part, **Installed item unknown**, and state that this is not evidence the item is original, healthy or never replaced.

Out-of-order protection (HIS05): each history request is keyed by equipment, scope and target; a response renders only if its key is still the current selection, otherwise it is discarded and logged. The panel shows "Loading history for <selection>..." with skeletons while pending.

## 5 Visual language

- Operational status always appears as **icon + text + colour** in a badge: Ready for OPS (check circle, green), Breakdown (octagon X, red), Maintenance (wrench, amber), Unreported (dashed circle, grey, dashed border). Only these four exist; Unreported is a display state, not a fourth status.
- Crane appearance is separate: red structural paint and a light machinery house exist only inside the model area. Selection is a dashed navy outline with a glow; open work is a gold circle with the job count (tooltip and tab-reachable list in the tree); location-approximate items are dashed circles. The legend has three groups (Appearance, Selection and work, Operational status) and states that red paint is never a Breakdown indication. The status badge sits outside the geometry.
- Labels are always visible (never hover-only): fixed-position assembly labels at constant pixel size at every zoom, plus the Assemblies buttons and the tree. Technical mode adds internal labels and the note "Internals: layout approximate / simplified".
- Provenance wording is exact: "Location approximate / simplified representation" for hotspot-type positions; parameters say "visually read from the drawing, not independently verified"; 63 m is shown as total lift height with "not the overall height of the crane"; the gantry speed shows both observations until an Admin decision.

## 6 State catalogue

| State | Where | Treatment |
| --- | --- | --- |
| Loading | fleet, equipment, jobs, viewer, history | skeleton blocks with `aria-busy` and a status message; tree and records remain reachable when only the viewer loads |
| Empty | fleet (no equipment), jobs, history | explanation and, for Admin, a register action; "No work recorded" |
| Invalid input | all forms | linked error summary (role alert, focused), per-field messages with `aria-invalid` and `aria-describedby`, nothing saved |
| Conflict (409) | job edit | current values beside the user's edit; keep my edits on the current version, or reload current values |
| Stale | fleet, jobs, equipment | last good data stays, banner "Showing the last good data from hh:mm", retry; nothing is reset to Ready |
| Error | fleet, jobs, equipment | no data shown, explicit "could not be loaded", retry |
| Unreported | fleet, equipment | badge "Unreported", "No status reported yet", no duration |
| Non-WebGL, context lost, model request failed | model area | message and Retry/Restore where meaningful; tree, history and permitted work stay fully usable |
| No verified model | QC | message; no model facts assumed |
| RTG / ES | detail | "3D view not available in stage 1", type icon only |
| Draft positions | equipment, admin | tree tag, notice, cannot be targeted, scene binds nothing |
| Retired | fleet, equipment | excluded from counts by default; no new jobs or status changes |

## 7 Forms

All forms are native modal dialogs with a header, scrolling body and footer; Escape and the close button ask "Discard unsaved changes?" when the form is dirty; Tab stays inside the dialog. Server-style errors (`422`, `409`) map to fields.

- **Add / edit job**: equipment, kind (radio), title, description, scope target (Whole equipment / Main / Sub / Part with cascading selects limited to the equipment's active positions), planned date, priority, responsible, initial status. Editing locks equipment. No EAM/Maximo field exists (B-06).
- **Complete job**: completion date (business date, not in the future, Asia/Colombo), completion note, replacement lines for Replacement jobs (position chosen from the active positions inside the job target, grouped by submechanism; removed item Unknown or known; installed item description, manufacturer, part number, serial that may stay unknown, quantity fixed at 1 ea for serialized positions and free for lot positions, replacement date, note), Add/Remove line, evidence statement, a warning that completing never changes status, and the retry-safe request key. Duplicate positions, positions of another equipment, lines older than the latest event at that position and an invalid line together with a valid one all fail without saving anything. The submit button shows a busy state to prevent a double submit.
- **Cancel**: reason required.
- **Update status**: three statuses, reason required for Breakdown and Maintenance, optional related open job of the same equipment, "takes effect at server time, cannot be back-dated", the same status is refused.

## 8 Responsive behaviour

Breakpoints: three-column desktop at 1280 px and above, drawers below 1280 px, phone layout below 768 px.

| Size | Equipment screen | Other screens |
| --- | --- | --- |
| **1920 x 1080** (measured) | tree 330 px, model area about 904 px, right panel 440 px inside a 1760 px content width; whole crane, legend row and the first history cards visible without scrolling the page | fleet: five cards per row, the six-item QC and RTG groups wrap to a second row, page about 1370 px tall (one scroll to survey all 16 active items); jobs board three columns; admin tables full width |
| **1366 x 768** (measured) | tree 260 px, model area about 616 px, right panel 340 px; header compacted to two lines; the whole crane silhouette and the Overall/Technical, zoom, Fit, Reset and work-marker controls are visible in the first screen | fleet: five narrower cards per row, page about 1415 px tall (the count strip, filters and the QC group are in the first screen); jobs board three columns; admin tables scroll inside their panel |
| **Tablet** (1024 x 768, 768 x 1024) | model area full width; **Mechanisms** and **Details** open drawers (closed drawers are `visibility: hidden`, so they are not tab stops); Escape closes and returns focus to the opener; a scrim closes on tap | jobs board becomes one column; admin sub-navigation becomes a horizontal strip |
| **Phone** (390 x 844) | header stacks, drawers as above, the model area is optional content below the header (preview can be skipped); records and forms come first in the reading order | fleet is one card per row; dialogs are full screen; job and completion forms are fully usable |

No page overflows horizontally at any tested size (checked at 1920, 1366, 1024, 768 and 390 px wide).

## 9 Accessibility

- Skip link first; one `h1` per page; landmarks (banner region, main, nav, aside) with names.
- Tree: ARIA tree (`tree`, `treeitem`, `group`, `aria-level`, `aria-expanded`, `aria-selected`), roving tabindex; Up/Down move, Right expands then enters, Left collapses or goes to the parent, Home/End, Enter or Space selects. Tree is the keyboard alternative to the scene.
- Scene elements are focusable buttons with accessible names and `aria-pressed`; the Assemblies buttons duplicate the major ones. There is no pointer-only or hover-only function.
- Focus indicator: two-tone ring (2 px navy line plus 4 px Portal gold ring), so it keeps at least 3:1 on both light surfaces and the navy bar.
- Every input, select and textarea has a visible label; hints and errors are tied by `aria-describedby`; required fields are marked and `aria-required`.
- Colour is never the only signal for status, selection, errors or work markers. Contrast: 37 declared pairs checked, all at or above their thresholds (`docs/evidence/P02/contrast-report.json`).
- Reduced motion: camera fits are instant and shimmer and drawer transitions are disabled.
- Text size: body 16 px, 1.45 line height; standard controls 40 px high, compact buttons 34 px (above the 24 px minimum target size of WCAG 2.2 AA).

## 10 Viewer placeholder contract (for P03 and P10)

What P03 and P10 keep: one selection model and URL parameters; node keys as the only scene identity (the placeholder resolves `data-key` -> equipment binding -> position ID); Overall/Technical semantics; container policy; union-bounds fit with a 0.5 m minimum extent for thin items and a "no visible representation" notice; constant-size labels, decluttering and the Assemblies buttons; the legend; open-work markers by position; fallback states; zero canvases outside the equipment detail; the history request guard. What the real viewer replaces: the SVG geometry (illustrative vertical proportions; horizontal spans use the verified 30 m gauge, 70 m outreach, 20 m backreach), and the pointer-to-selection code with Three.js raycasting.

## 11 Contract observations from this phase

| ID | Observation | Proposed handling |
| --- | --- | --- |
| UX-1 | `JobSummary` (API s2) has `createdBy` but no field telling the UI that a job was previously completed (reopened) or holds committed lines. The UI wants to explain "EQ Team cannot cancel a reopened job" before a failing request | add `reopenCount` (or `previouslyCompleted`) and `committedLineCount` to `JobSummary` in P07; not a blocker, the 409 `job_previously_completed` still protects the rule |
| UX-2 | The fleet response (`openJobs: { pending, current }`) and tree counts (`openJobCount`) cover every count the prototype shows | none |
| UX-3 | "Add job for this selection" and the job form need the selected ancestors; the position and instance IDs already carry them | none |

## 12 Review prompts for the U1 checkpoint

1. Is a placeholder schematic acceptable until P03 delivers the Three.js model, and is the "Assemblies" button row the right text alternative to hover labels?
2. Should Management also see the Admin screens read-only, or is the 403 explanation enough? (Requirement s4 grants Management read of fleet, equipment, work and documents, not Admin configuration.)
3. Is "Include cancelled" in the History panel and the Jobs filter the right place, or should cancelled work have its own view?
4. Does the Fleet group row layout scan well at 1366 x 768 for the user-confirmed fleet quantities (14 QC, 46 RTG, 7 ES; U1-C54, section 48)? Real per-unit identities/models remain under U-07.


---

# P02B additions (SOW V2, P01B contracts, U1-C19)

Prototype-level design contract. Everything below is synthetic and in memory: no persistence, no sign-in (the persona switch simulates the Portal role assignment), no live ZMMS connection. Evidence: `docs/evidence/P02B/`.

## 13 Sections, tabs, personas and Access states (S18, S19; DATA s14)

Top bar: CICT mark and **EQ & FAC Maintenance**, the **EQ | FAC** section switch, the tabs of the current section, **Admin** (only with `admin.access`), the persona chip and the persistent **Read-only access** chip for read-only users. EQ tabs: **Fleet**, **Jobs**. FAC tabs: **FAC Dashboard**, **FAC Jobs**. Routes: `/eq/fleet`, `/eq/equipment/{id}`, `/eq/jobs/{special|status|spare-parts}`, `/fac/dashboard`, `/fac/jobs`, `/fac/jobs/{id}`, `/admin/{eq|fac|access}/...`.

| Persona (simulated Portal roles) | Switch | Tabs | Landing on first visit | Notes |
| --- | --- | --- | --- | --- |
| Admin | EQ, FAC | Fleet, Jobs, FAC Dashboard, FAC Jobs, Admin | EQ Fleet | all rights fixed on |
| Management | EQ, FAC | the four view tabs | EQ Fleet | read-only chip in both sections; no write control anywhere |
| EQ Team | EQ, FAC | the four view tabs | EQ Fleet | works in EQ, reads FAC |
| FAC Team | EQ, FAC | the four view tabs | **FAC Dashboard** | works in FAC, reads EQ |
| EQ Team + FAC Team | EQ, FAC | the four view tabs | EQ Fleet | union of rights |
| All tabs switched off (Management with the four view tabs off) | hidden | none | **No access** page | "No access - contact the EQ & FAC Maintenance Admin", explicitly "not an error"; no 403 shell |

Rules: the switch is hidden when only one section is permitted; a switch link opens the last used tab of that section; the last used tab route (path only, no query or record data) is kept in `localStorage` under `eq-maintenance:last-route:<profile>` and used when still permitted, otherwise the role default, otherwise the first permitted tab; blocked or failing storage falls back to the role default (checked). A switched-off tab that is opened by link answers **403 feature_disabled** with an explanation; Admin pages for a non-Admin answer **403 forbidden_role**. The UI re-reads its session at most every 60 seconds, on a persona switch and after a 403 `feature_disabled`; the simulated server reads the live matrix on every call, so a switched-off tab is blocked before the UI has caught up (ACC02).

**Access matrix (Admin > Access)**: 12 features by four roles. Cell states: **Always** (fixed by the Portal role, green lock tag), **Not allowed** (above the role ceiling, dashed tag, no control), **On/Off** (checkbox with a visible On/Off word; 13 toggleable cells). Save is atomic with the matrix version (409 on a stale version) and an optional reason; a request containing a non-toggleable cell is refused as a whole (422 `access_cell_not_toggleable`); the change log lists version, time, actor, role, feature and old -> new. A "check the ceiling" panel sends refused changes on purpose.

## 14 Crane view right panel: current state only (S07, U1-C19, HIS06; D-122)

Exactly four tabs in a `tablist` (arrow keys, Home/End, roving tab stop; the active tab is the `panel` URL parameter; default Maintenance), in the flat view and in the 3D viewer page, with the same data and the same wording (parity is checked by comparing the rendered text of 7 selections x 3 tabs). The tab names are always shown in full in a four-column grid (a count badge sits at the corner); they never scroll away.

| Tab | Shows | Scope |
| --- | --- | --- |
| **Maintenance** | the equipment's status with its source (Auto (ZMMS) or Manual) and causing ZMMS jobs; **today's** ZMMS daily jobs of the equipment as read-only cards (job number, CWO, type, status, priority, description, created, department and equipment type, mechanical and electrical staff and hours, fault and corrective text when present); "ZMMS data from <time>" with a stale marker; for unmapped equipment "Not linked to ZMMS" | equipment-level (ZMMS jobs are not linked to mechanisms or parts): the same list for any selection, and the tab says so; no earlier days; **Open in Jobs** opens the Jobs tab filtered to the equipment and today |
| **Projects/Special** | the **open and completed** special jobs (Pending, Current, Completed) of the selection with matching positions, newest first (U1-C23; completed cards show only "Completed on <date>"); counts "N open / N completed / N cancelled"; cancelled jobs are counted, not listed; jobs switched off with "Show on dashboard / 3D" are not shown or counted (U1-C26); **Add special job** for writers, pre-filled with the equipment and the selection (whole equipment included, U1-C21) | whole equipment: all; mechanism or submechanism: direct and descendant work, de-duplicated; part: exact position; **Open in Jobs** opens the scoped history |
| **Technical** | specification summary of the selected area: equipment (type, model association, commissioning date, major parameters), mechanism or submechanism (definition, original label, source-linked parameters), part (identity, semantic key, kind, installed item now without past events, provenance, sources) with the 63 m total-lift and the 46 / 45.5 m/min conflict notes | selection |
| **Spare parts** | current register rows of designated positions inside the selection: condition (Original / Replaced / Not recorded), brand, model/part no., serial, replaced date, expected life and its source, next predicted replacement with "calendar estimate, not a condition assessment", Overdue / Due soon flags; a non-designated part says "Not a major spare part"; **Add spare part** for writers (EQ Team and Admin, U1-C21), pre-filled with the equipment and selection (a non-designated part is pre-selected) | selection; **Open in Jobs** opens the register scoped to it, where the history is kept |

No tab shows installation events, status changes, completion notes, job progress or correction history; completed special jobs appear only in Projects/Special (U1-C23, the one exception to "no history in the crane view"). Late responses for a previous selection are discarded (HIS05): each tab body carries `data-echo` = equipment | tab | scope | target. The machinery-house container keeps its own explanation instead of tab content. In the 3D page **Open in Jobs** and job numbers open the P02 prototype in a new tab (the production app links within itself). Phone and tablet: the panel is the **Details** drawer.

## 15 Fleet and equipment header additions (S02, S03, S21)

Fleet card: type icon, code, status badge, "For 2 d 4 h" or "No status reported yet", open special jobs, **source tag Auto or Manual** and **ZMMS n** (today's count; nothing for unmapped equipment). Filters add **Status source** (All, Auto, Manual); the freshness line adds "ZMMS data from <time>" with a stale marker when the latest run failed or no success within the stale window. The status-meaning note is a compact info chip ("Automatic status from ZMMS") whose full text is the tooltip and a screen-reader text. Equipment header: Auto (ZMMS) / Manual tag with its meaning, **Correct status** (mapped equipment) or **Update status** (unmapped), and **Back to automatic** while a manual correction holds. The correction dialog needs a reason for every correction of an automatic status and says it holds for the rest of today.

## 16 EQ Jobs tab in four tabs (S08; DATA s18.2; U1-C20)

Sub-navigation: **Special/Projects**, **Daily work (CMMS)**, **EQ status**, **Spare parts condition** (U1-C20 splits the former "Special & daily jobs" part; it supersedes the SOW V2 s4.2 layout). Shared filters (equipment, type QC/RTG/ES, From, To, search) are kept in the URL across the tabs (search text is not). The legacy route `#/eq/jobs` opens Special/Projects.

1. **Special/Projects**: manual special jobs only (SOW V2 s4.3): the board (Pending / Current / Completed, Include cancelled, scoped history opened by Open in Jobs), **Add special job** for writers (also **Add special job here** inside a scoped history, pre-filled with that scope), edit / start / complete / cancel as before. A one-line note points to the Daily work (CMMS) tab.
2. **Daily work (CMMS)**: the read-only ZMMS (CMMS.LK) daily jobs (SOW V2 s4.4) with "ZMMS data from", a synthetic-rows notice, default range today, From/To for earlier days (every synced day is kept), rows marked "No longer in the ZMMS list" when absent from a later complete run, no controls inside the table, unmatched equipment never listed here (Admin only), Export. The crane-view Maintenance tab's **Open in Jobs** opens this tab for the equipment and today.
3. **EQ status**: one row per active equipment with status, source and mode text, since, reason, "Manual until", causing ZMMS jobs and **Correct...** / **Update...** and **Back to automatic** for writers; below it the status history across equipment (when, equipment, change, source ZMMS sync #n or User, actor or System, reason, causing jobs). Management has no buttons.
4. **Spare parts condition**: register rows (equipment/part, condition, brand/model/serial, replaced, expected life, next predicted replacement, flag, remarks), flag filter, **History** per part (every revision with before -> after, source, reason, job link) and **Update...** for writers (Record Original, Record replacement, Amend current, Edit remarks). **Add spare part** (EQ Team and Admin, U1-C21): equipment, main / sub filter, main-part position (active and not yet in the register), spare-part type, expected life (blank = type default), condition (Original / Replaced, or Keep the recorded installation), fitted/replaced date, item description, brand, model/part no., serial, remarks; the entry starts its history ("Added to the register"). A Replacement special job completion shows the condition notice and writes the register in the same commit.

## 17 FAC screens (S23-S28; SOW V2 5.5, 5.6)

**FAC Dashboard** (management): title with "Updated hh:mm Asia/Colombo - refreshes every 60 s", Pause, Static view, Export (when permitted), Refresh, TV mode; filters Discipline, Type, In-house/Outsource, PIC (all in the URL, with KPI focus); **KPI strip** of eight figures (active, completed this cycle, in progress, on hold, overdue, due in 7 d, on time 30 d, today's checks) where the five that describe job states (completed, in progress, on hold, overdue, due soon) are buttons that filter the lanes (`focus=`, in the URL); **three discipline lanes** (Electrical, Mechanical, Civil) each with a completion ring and rows in the order Overdue, On hold, In progress, Due soon, Pending, then completed in the last 7 days (type icon, name, frequency, PIC, mode, progress bar with quantity and %, status pill with icon + text, due countdown, picture or icon); **live ticker**; **latest-proof carousel** (previous, pause, next, "Photo n of m"); **due load** (8 weeks stacked by discipline, with a text table for screen readers); a collapsible **static list** of every job. Synthetic data is labelled (tag in the title and a note at the foot).

**FAC Jobs**: view switch **My work** (default; overdue, due soon and in-progress, own PIC first with a "Yours" tag), **Board** (Pending, In progress, On hold, Completed this cycle) and **List**; filters Discipline, Type, In-house/Outsource, PIC, Frequency, Kind, Flag, Status (list), search, all in the URL; **one-tap actions**: Done today / Done this week (period jobs), Update progress, Hold / Release; the **Update progress** form (quantity or All done, work date, note, photos with a camera-capturing file input `capture=environment`, up to 5, JPG/PNG, 10 MB; confirmation dialog when the quantity completes the cycle; next due date field for running-hours jobs); hold dialog with a mandatory reason; **job detail** (fields, job picture, current cycle, undo, Admin correction, timeline with who/when/quantity/note/photos, previous cycles with on time / late by n d); **Add one-time job** (FAC Team default on) and **Add recurring job** (only when the master-list right is granted); **Export** (CSV stand-in for the server .xlsx) of exactly the filtered rows. Management sees no action buttons and a read-only tag. On a phone the filters fold, cards are one column, tap targets are 44 px and the update form is full screen.

## 18 Motion and readability rules for moving content (S27; FDB02-FDB06)

- **Steady, measured speed**: the lanes scroll at the Admin setting in px/s (default 20, range 5-80) scaled by the measured row height; frame time is clamped; the loop is seamless (the list is repeated once, the copy is `aria-hidden` and has no tab stops). Measured: declared and measured speed match within 1 % (about 15 rows a minute at the default) with no window deviating by more than 20 %. The ticker moves horizontally at 2.5 times that speed.
- **Stops**: a lane stops while the pointer is over it or focus is inside it; the ticker likewise; the **Pause** button stops all motion and the carousel. Releasing resumes. A background tab does not animate.
- **No layout jump**: the dashboard DOM is built once and patched in place on every refresh. Unchanged rows keep their nodes, boxes keep their rectangles (checked to 0.6 px), the scroll anchor row keeps its place when rows above change, and fixed row heights with clamped text (name 2 lines, hold reason 2 lines) keep the scroll arithmetic exact. A changed row glows for a few seconds and moves to its new group; a new update slides into the ticker with a glow.
- **No focus trap**: one tab stop per lane and one for the ticker (roving tabindex; arrows, Home/End inside); Tab continues to the proof controls, the static list and the rest of the page; Shift+Tab walks back.
- **Static accessible alternative**: skip link "Skip the moving lists to the static list", a collapsible table of every dashboard job in dashboard order with links, and the **Static view** button (`motion=off`) which removes all transforms.
- **Reduced motion**: `prefers-reduced-motion` switches the lanes to a page flip every 8 seconds with a "Page n of m" indicator, the ticker and the carousel stay static, glow becomes a static highlight.
- **TV mode** (`tv=1`): navigation and filters hidden, larger text, whole dashboard in one screen at 1920 x 1080 (and at 1366 x 768 with a compact bottom row), Exit TV mode, signed in as a normal Management user (a role without the tab sees the No access page).
- **Phone** (< 768 px): KPI strip and one combined list without auto-scroll; tablet: lanes in one column.
- **Stale and error**: a failed refresh keeps the last data with "Updated hh:mm ... STALE" and a warning banner; an error shows no data and never presents jobs as completed; empty explains the import.

## 19 Admin additions (S10, S19-S23; ARCHITECTURE s6)

Sub-navigation groups **EQ settings** (Equipment, Models and applicability, Mechanism catalogue, Main-part positions, Specifications, Model bindings, **Spare parts**, **ZMMS**), **FAC settings** (**Master list**, **Import preview**, **Lists and settings**) and **Access** (Access matrix, section 13).

- **Mechanism catalogue** (U1-C22): **Add main mechanism** (new two-digit code, name, description), **Add submechanism** / **Add sub** per main (main code plus one digit, name, description), **Edit** on every main and sub (name and description; `061` Spreader and `062` Headblock show a lock and keep their names), Activate/Deactivate on mains and subs, "Added by Admin" / "Renamed by Admin" tags and a **Catalogue changes** list with before -> after. Counts stay "16 main / 43 sub" for the delivered catalogue plus "n added by Admin".
- **Main-part positions** (U1-C22): **Add position** (draft, this equipment only: name, submechanism, binding key, kind serialized / quantity lot with unit, source reference) and **Edit** per row (name and source always; key and mechanism disabled once confirmed; kind and unit disabled once history exists), plus a **Position changes** list.
- **Specifications** (U1-C22): **Add specification** (name, value, unit, condition, use Major / Technical, optional main mechanism, source, reason) labelled "Admin-entered"; **Set value... / Change value... / New value...** on every non-conflict row and **Resolve...** on conflicts (value, source, reason); **Edit** on Admin-entered rows; "Earlier values and edits" under a row. Drawing observations are never edited.
- **Spare parts**: spare-part types with default expected life (months, blank = none), **Add type**, rename in place and **Retire / Reactivate** (U1-C22); **Add spare part** and per-position **Add with condition** / **Edit entry** (the register actions of EQ Jobs); a position list per equipment with designation, type and per-equipment life override (1-600 months), reason, and the resulting prediction. EQ Team and Admin can also add spare parts from EQ Jobs and the crane view (U1-C21).
- **ZMMS**: health (last successful sync, latest run, next scheduled, failed runs), sync times and stale window with validation, **Sync now** with a simulated outcome selector (success, login failure, layout change, timeout, HTTP error; a failed run changes nothing), recent runs (including a synthetic failed run), equipment mapping with an ignore entry and Retire, the unmatched queue with Map or ignore, **job type and job status mapping** (effects Breakdown / Maintenance / No effect / Unmapped and Open / Closed; automatic status cannot be switched on while a seen value is unmapped), and the status evaluation of the latest successful run (computed status, why not applied, causing jobs). The mapping effects shown are illustrative; the real choice is the Admin's after the first real data (Q11).
- **Master list**: all FAC jobs, filter and search, add, edit, deactivate (reason) and reactivate; never deleted.
- **Import preview**: counts (111 sheet rows, 114 jobs), the opening-state summary, issues by type with sheet rows and the way each is saved, the known source issues (U-30), the frequencies in the sheet, and a collapsible table of **every job as it would be saved** (blank quantity 1, blank PIC/mode/date stay blank, calculated first due date, opening state, issues); Confirm is simulated and a re-run is refused once progress exists.
- **Lists and settings**: due-soon window, refresh seconds, dashboard scroll speed (validated), frequencies with intervals (tri-annually 4 months, bi-annually 6 months), disciplines and types.

## 20 Contract observations from P02B

| ID | Observation | Proposed handling |
| --- | --- | --- |
| UX-4 | The Maintenance tab shows the same ZMMS list for every selection because ZMMS jobs are equipment-level (DATA s18.1). A user may read this as a defect | the tab says so in one sentence; keep it, confirm at the U1 repeat |
| UX-5 | U-31: Projects/Special lists open jobs only and counts the rest. If the user wants completed special jobs listed too, S07 changes | closed 23 Oct: the user wants completed jobs listed (U1-C23, section 23) |
| UX-6 | The real export has equipment codes such as QC002 and spreader codes SQ0xx; spreaders are separate equipment in ZMMS but a part of the crane here | spreader codes stay in the unmatched queue or are mapped by Admin to the crane; P07B/P06 decide (U-33) |
| UX-7 | FAC dashboard lanes show 18 / 55 / 36 listed jobs; jobs completed earlier and not yet due are counted in the ring and KPIs but not listed (D-119) | closed 23 Oct: "dont hide"; they are listed last as "Done, up to date" (U1-C24, section 23) |

## 21 Repair-R02B changes (23 October 2026)

- **Crane view with the EQ Jobs tab switched off** (D-139): the four tabs keep their current-state content; Projects/Special still lists the open special jobs and the open/completed/cancelled counts, but job numbers are plain text, no tab shows "Open in Jobs" (a short note says the EQ Jobs tab is not available for the role), the header's open-job count is not a link and no job card shows correction history. With the tab on, nothing changes.
- **FAC dashboard row, ticker item and proof caption** (D-140): they open the FAC Jobs record when the user holds FAC Jobs; otherwise the read-only dashboard detail `#/fac/dashboard/jobs/{id}` (same fields, current cycle, previous cycles and timeline; no actions, no picture upload, no photo removal; breadcrumb back to FAC Dashboard). The dashboard **Export** button appears only when the user holds both Export and FAC Jobs, because the export is the FAC Jobs list's export.
- **Dashboard readability** (R02B finding 6): ticker items are two lines (time, who and quantity; then the full job name), 30 em wide, so names are readable (the longest sheet name, 69 characters, still ends with an ellipsis and a tooltip); the due-load chart is drawn flatter (720 x 140) with larger week, count and bar labels (about 14 px at 1920 x 1080 and 18 px in TV mode); on screens at least 1200 x 900 the lanes and the bottom row share the height so the ticker, latest proof and due load are on the first 1920 x 1080 screen with four rows still visible per lane.
- **Status cause text**: an automatic Breakdown/Maintenance shows "Caused by ZMMS job N in the plan of <date>"; an automatic Ready for OPS shows "Not in the ZMMS plan for <date>"; the status history shows the sync run and its plan date, with no reason for automatic rows.

## 22 U1 round 5 changes (23 October 2026)

- **U1-C20**: EQ Jobs has four tabs; Special/Projects (manual) and Daily work (CMMS) (read-only ZMMS) are separate (section 16). Crane-view Maintenance "Open in Jobs" opens Daily work (CMMS).
- **U1-C21**: "Add special job" is the label everywhere (Special/Projects, scoped history, crane-view Projects/Special tab for the whole equipment and any selection, equipment header). EQ Team and Admin add spare parts from Spare parts condition and the crane-view Spare parts tab; Management and FAC Team see neither action and the server refuses them.
- **U1-C22**: Admin adds and adjusts items in Mechanism catalogue, Main-part positions, Specifications and Spare parts (section 19); every change is audited and keeps the previous values.

## 23 U1 round 6 changes (23 October 2026)

- **U1-C23** (answer to U-31): the crane-view **Projects/Special** tab (flat view and 3D page) lists the open **and completed** special jobs of the selection, newest first (completion date for completed jobs, creation date for open ones), each job once; a completed card shows "Completed on <date> (business date)" and its matching positions, never the completion note, corrections or installation details. Cancelled jobs stay a count; at most the 50 most recent completed jobs are listed, with a note when more exist in Jobs. Counts "N open / N completed / N cancelled" are unchanged.
- **U1-C24** (answer to UX-7, "dont hide"): the FAC Dashboard lanes list every active job. Jobs completed earlier than 7 days ago that are not yet due again form the last group, **Done, up to date**, with a green pill and "Next due <date>" (the year is shown when the date is not in the current year) or "No due date". The lane header reads "N in the list · N active".
- **U1-C25** (answer to U-23): the 013 load cell is drawn in the horizontal main hoist rope at the boom tip: in the flat view an in-line link on the rope just landside of the tip with its junction box and signal cable; in the 3D model (draft v1 rev 5) in-line load cells on the four horizontal hoist ropes about 2.6 m from the tip with one junction box per rope side. Labelled "Location approximate". The rope-end anchors stay drawn with the boom-tip sheaves.
- **U1-C26**: every special job and every FAC job has a **Show on dashboard / 3D** (special jobs) or **Show on dashboard** (FAC jobs) switch (`role="switch"`, with a one-line note of where the job appears). One shared setting: what one user switches, everyone sees (Management and TV mode included). Who can switch it: Admin for all jobs; EQ Team for special jobs (job record); FAC Team for FAC jobs (FAC job detail). Management, and the other team, see the state as read-only text. A hidden job carries a "Hidden from dashboard / 3D" or "Hidden from dashboard" tag in the Jobs tabs and stays there, in the history, the job record and the exports (new column "Shown on dashboard"). It disappears from the FAC Dashboard (KPIs, lanes, ticker, latest proof, due load, TV mode, the dashboard-only detail), from the crane view (Projects/Special list and counts, tab badge, tree and label work badges, flat and 3D) and from the fleet-card open-job count. ZMMS/CMMS daily work has no switch. Default for every job: shown.

## 24 U1 round 7 change (23 October 2026)

- **U1-C27** (user reference image of the place; closes U-36): the 013 load cells are at the **boom tip end**. Flat view: the horizontal hoist rope line ends in the in-line load cell at the end of the boom, with its junction box and signal cable. 3D model (draft v1 rev 6): in-line load cells on the horizontal cross-over of the main hoist ropes at the very end of the boom, two per rope side, one junction box per side. Technical mode only; labelled "Location approximate" (D-161). Supersedes the U1-C25 position about 2.6 m inboard.

## 25 U1 round 8 changes: EQ Fleet dashboard (23 October 2026)

Scope: the EQ Fleet dashboard only (`#/eq/fleet`). The FAC Dashboard keeps its current look until the user has reviewed the EQ result (U1-C31); the new rules live in `css/eq-fleet.css`, scoped to the EQ Fleet page, and change no existing token (D-166).

- **Look (U1-C31)**: flat and pastel, professional: light warm neutral page, white cards and tiles with 12-14 px radius and soft shadows, dark slate ink for figures and the selected segment, restrained status accents. No gradients, glow, neon, glass or blur. Order: freshness line (Refreshed, Refresh, ZMMS data from, status-meaning chip) with the blink legend, **Pause blinking** and **TV mode** on the right; **KPI tile row** (Active equipment with the three illustrations and counts; Ready for OPS share now, a donut plus the figure, derived from the shown counts; Ready for OPS, Breakdown, Maintenance, Unreported tiles that remain the filter buttons with `aria-pressed`); filters panel; QC, RTG and ES groups. U1-C02 density is kept: cards are at most 60 px high and the whole synthetic fleet fits one 1366 x 768 screen. Tablet: three KPI columns; phone: KPI tiles in two columns (Active and Ready share full width), one card column.
- **Illustrations (U1-C29)**: in-house flat SVGs of a ship-to-shore quay crane (J526A proportions, CICT red, light machinery house), a rubber-tyred gantry crane and an empty container stacker on the cards, group headers and the Active equipment tile (D-164). They are decorative (`aria-hidden`); the type is in the group heading and the card text.
- **Motion: blink (U1-C30)**: active Breakdown cards pulse rose (2.5 s cycle, solid left stripe) and Maintenance cards pulse amber (3.5 s cycle, dashed left stripe), whole card, also in TV mode; Ready for OPS, Unreported and retired cards are still. Below 3 flashes per second; only background, border colour and an inset ring change, so the layout never moves. The status stays as the icon + text badge and in the card's accessible name. **Pause blinking** (`aria-pressed`) and **Pause** in TV stop it and show a steady highlight; `prefers-reduced-motion: reduce` and `motion=off` in the address show the same steady highlight (fill, ring and stripe) without animation; with `motion=off` the control is disabled and shown pressed (D-165).
- **TV mode (U1-C28)**: `#/eq/fleet?tv=1`, also opened by the **TV mode** button with the current type, status and source filters (full screen is requested). Top bar hidden, visible title "EQ Fleet", "Updated hh:mm Asia/Colombo - refreshes every 60 s" on the same poll, ZMMS freshness, KPI tiles, groups, larger type (code 24 px, KPI figures about 46 px, card text 16 px at 1920 x 1080), a footer with the status meaning and the blink legend. Read-only for every role that can see EQ Fleet: cards are not links and there are no filters, search, layout switch or Register button; only **Pause** and **Exit TV mode**; **Esc** also exits. The whole synthetic fleet fits one 1920 x 1080 screen; when a fleet does not fit (measured, e.g. at 1366 x 768 or with a larger fleet) the cards are split into pages that each fit, with "Page n of m" and a turn every 10 s; the KPI tiles stay on every page; Pause stops the turn, the data keeps refreshing (D-163). A role without EQ Fleet gets the 403 / No access page and no TV.


## 26 U1-C32: one crane viewer (23 October 2026)

This section supersedes the SVG viewport and separate P03 page descriptions in sections 5 and 10 and the separate flat/3D implementation requirement. The QC equipment detail now has a **3D / Flat** button group using one drawing-derived model. Flat is a fixed side elevation (landside left, waterside right), with rotation disabled and pan/zoom retained. 3D restores perspective orbit. Overall/Technical is a separate display choice. Tree, selected equipment/part, information tab, labels, isolation and work-marker settings stay shared across the camera switch.

The four tabs remain Maintenance, Projects/Special, Technical and Spare parts. Reset clears selection/isolation, restores labels and folds the tree, keeping the current Flat/3D camera mode (U1-C34 / section 28), Overall/Technical and the active tab. Zoom and Fit are explicit buttons as well as pointer gestures. The mode is addressable as `view=flat` or `view=3d` in the equipment route; reload and saved links preserve it. The Isolate area dropdown opens a physical area with its manifest descendants (section 27); these containers are separate from the maintenance mechanism hierarchy.

Only the two reviewed synthetic QC bindings offer the model. Unverified/other equipment retains its records-only fallback. Both camera modes need WebGL; unavailable graphics, failed model loading and context loss retain tree/panel access, with Retry for load/context failures. No second drawing is loaded as a fallback. The model and renderer are disposed on leaving the equipment page. No canvas is allocated for fleet/FAC/jobs routes. Legacy P03 links redirect into the shared detail using exact semantic keys.

Local prototype only; existing drawing approximations and synthetic fixture notices apply. Production acceptance remains NOT RUN.


## 27 U1-C33: default Flat and area isolation (24 October 2026)

User request: default Flat; fill the available viewport on default/reset; extend yard/sea with sea 5 m below rail; replace physical-assembly buttons with a dropdown that isolates the chosen area and all included parts.

As implemented for C33 (Reset superseded by section 28 / C34): Flat is the default and Reset returns to the full Flat crane. Full-crane camera framing uses crane bounds (excluding scenery) with 8% margin, adapts to viewport aspect and refits on resize. The Isolate area dropdown replaces both the machinery-house-only control and bottom chips; all 11 manifest containers open in Technical mode, fitted with their descendant parts. Part selection retains isolation; selecting an unrelated mechanism exits it. Whole crane exits isolation; Reset also restores labels and clears selection. The environment is hidden during isolation.

The extended yard and sea are decorative viewer context, outside maintenance identity and camera bounds. Rail/yard level is y=0; sea surface is y=-5 m per the user. The quay edge remains at x=5.3 m as in the existing drawing context; horizontal extents are illustrative. Crane GLB, manifest and original source authorities are unchanged.

Checks: `node tools/p02b/check_flat_isolation.mjs` (18 assertions: default, framing, levels, 11 areas, part selection, reset, phone width, no browser errors). Shared-viewer regression: 11/11 after replacing the old isolate-button test with the dropdown and applying the new Reset rule. Desktop and isolated-area screenshots inspected. Evidence: `docs/evidence/U1/flat-isolation/`. Local synthetic prototype only; U1 approval remains pending, no production acceptance or deployment.

## 28 U1-C34: area tabs, compact toolbar, sea and 3D home (24 October 2026)

All four tabs work for a selected physical area. Maintenance shows today's equipment-level ZMMS work with source/freshness (compact panel copy per section 31). Projects/Special lists open and completed jobs targeted at included part positions or with committed replacement lines at those positions, each job once, with the existing hidden-work exclusions and current-state fields. Spare parts shows registered included positions. Counts match those lists. Technical lists included parts by mechanism; selecting a part retains isolation and opens the part's own scope. Empty areas show the relevant empty-state message. A physical area does not acquire a history identity; jobs targeted only at whole equipment or broad mechanisms are not assigned to an area by inference.

Desktop: one compact control row, with Isolate area and its dropdown inline, Fit, labelled + / minus zoom buttons, Reset, Labels and Open work. Accessible names preserve the full actions; button targets remain 44 px. On phones the controls wrap and the inline area field occupies a separate row. Any narrow-desktop overflow scrolls within the toolbar, not the page.

Flat is still the initial default. Entering 3D starts at the supplied three-quarter view with boom to the right and the quay/sea below. Reset preserves the current camera mode: 3D returns to that reference framing; Flat returns to the full side elevation. Selection/isolation clear, labels turn on and tree folds reset; display mode and panel tab stay selected. This supersedes C33's forced-Flat Reset. Framing responds to aspect ratio, including selected/isolated areas after resize.

Yard/rail stays at 0 m; sea stays at -5 m. The water surface now has restrained static wave detail and waterline colour, with a quay coping strip. Context is decorative, unpickable, excluded from crane bounds and hidden in isolation. No crane geometry, source authority or manifest change. U1 remains incomplete and unapproved. Current local prototype evidence: `docs/evidence/U1/viewer-refinements-c34/REPORT.md`.

## 29 U1-C35: update a spare part from the selected view (24 October 2026)

An already registered selected part shows **Update condition** in its spare-part card, including when its condition is Not recorded. This opens the same condition dialog used in Jobs, for that exact equipment-specific position: record Original when appropriate, record a replacement, amend the current item, or edit remarks. Saving closes the dialog and refreshes the current card, dates, predicted replacement and flags from shared state, without navigation or a duplicate registration. Selection, camera mode and area isolation remain intact. Previous values stay in the register's history. Cancel and invalid submissions leave records unchanged.

An unregistered selected part retains **Add spare part**, prefilled with the selected position; after saving, its card shows the new state and Update condition. Whole-equipment, mechanism and area summaries keep Add for registering other positions and offer Update condition on each registered card. Management remains read-only; EQ Team/Admin write permissions and Admin-only type/life settings remain as specified. This is in-memory prototype behavior; reload restores fixtures. U1 remains incomplete/unapproved. Evidence: `docs/evidence/U1/spare-panel-c35/REPORT.md`.

## 30 U1-C36: compact equipment summary card (24 October 2026)

Only the equipment name/summary card is compacted. Desktop uses a small identity/status row with actions at the right and a full-width metadata row underneath. Type, name, status, duration/since, model, freshness, manual reason and open-work link remain visible; the source explanation remains on the source chip's tooltip, avoiding a repeated long sentence in the header (Maintenance copy further shortened by section 31). Smaller padding, typography and status badge reduce height. Phones wrap metadata and actions inside the card and retain 44 px action targets. Manual-correction and read-only states remain supported. Blue app navigation and EQ/FAC job headers are unchanged. U1 remains incomplete/unapproved. Evidence: `docs/evidence/U1/compact-header-c36/REPORT.md`.

## 31 U1-C37: concise crane information panels (24 October 2026)

The user's annotated Maintenance paragraph identifies the text to clean up: repeated explanations about automatic status, scoping, history locations and prototype implementation. Maintenance now shows status/source badges, meaningful manual reason when present, today's actual equipment jobs and the last-success time. A compact Stale badge remains visible when required. Remove the automatic source/cause paragraph and repeated equipment-level scoping/footer text; causes and historical details remain in EQ Jobs.

Projects/Special leads with scoped counts and job cards. Spare parts leads with counts and current registered parts, dates, predictions, missing-data reasons and Update/Add actions. Remove introductory tutorials and repeated estimate footnotes; Next predicted replacement retains its calendar-estimate qualification in a tooltip. Empty selections keep concise factual labels. Technical retains identity, values, drawing references and unresolved conflicts, including both gantry-speed observations and the total-lift-height qualification. Remove implementation-binding and drawing-handler paragraphs; source/family/reference qualifications use compact labels and tooltips. Physical areas show the included-position count and the real grouped part links.

These presentation rules apply to the same four panels in Flat and 3D without changing their data scopes, current-state projection or permissions. Global prototype provenance remains visible. U1 remains incomplete/unapproved; P04 is Not started. Evidence: `docs/evidence/U1/panel-cleanup-c37/REPORT.md`.

## 32 U1-C38: FAC Dashboard follows the EQ style (24 October 2026)

Use EQ Fleet's warm grey page, separate white rounded cards, subtle borders/shadows, dark figures and compact headings. The supplied image informs the selective yellow accents: progress bars, completion rings and the TV control. Avoid coloured discipline header bands, full tinted rows, decorative gradients and oversized introductory copy. All eight existing figures remain, now above the filters, with a number-first layout. Desktop uses three discipline columns with individual job cards; each card keeps its picture/icon, two-line name, frequency/PIC/mode, status/due and quantity progress or hold reason. Full names and metadata remain in accessible labels/tooltips.

Retain continuous vertical movement, the updates ticker, pause/resume, keyboard handling, photo carousel and 60-second refresh. Static view and the full table remain available. Reduced-motion mode uses discrete pages; phones show a static combined list. TV hides navigation/filters and uses larger type in a bounded grid, including proof and the eight-week due load on one 1920x1080 or 1366x768 screen. Normal wide desktop shows three cards per lane; this replaces the older four-row density target while preserving all jobs in the moving loop. Smaller normal screens scroll vertically. Colours/styles are scoped to FAC Dashboard; shared shell, EQ and FAC Jobs retain their styles. Evidence: `docs/evidence/U1/fac-dashboard-c38/REPORT.md`. U1 remains incomplete/unapproved.

## 33 U1-C39: compact search below all four information tabs (24 October 2026)

Maintenance, Projects/Special, Technical and Spare parts share a single-row search immediately below the tabs. It has a contextual placeholder/accessible label, a small shown/total count when searching and an accessible clear button. Desktop fields are 32 px high; phones retain 44 px targets. Filter locally on input without rebuilding the viewer. Match all words without case sensitivity against each displayed job/part record or technical field; do not retrieve additional history. Technical labels and values stay paired, and source qualifications remain with matching specifications. Hide groups with no matching items and show a concise no-match message. Status context, total scope badges and actions are retained.

Each equipment/scope/tab keeps an independent in-memory query; camera changes and refreshes reuse it, while another scope starts with its own value. Clear and Escape restore the panel; Escape with text does not close the phone drawer. The same implementation serves Flat and 3D. Evidence: `docs/evidence/U1/panel-search-c39/REPORT.md`. U1 remains incomplete/unapproved.

## 34 U1-C40: Fleet in the equipment summary (24 October 2026)

Place the Fleet navigation link, styled as a button, immediately before Correct status in the top equipment card. Remove the repeated equipment-code breadcrumb and its empty desktop row when the whole equipment is selected. For a selected mechanism, part or physical area, keep useful ancestor breadcrumbs and a Whole equipment root link. Keep phone Mechanisms/Details controls reachable. Fleet uses the same compact desktop and 44 px phone heights as adjacent actions. Both Flat and 3D use this header. Evidence: `docs/evidence/U1/header-nav-c40/REPORT.md`. U1 remains incomplete/unapproved.

## 35 U1-C41: compact EQ/FAC Jobs workspaces (24 October 2026)

Remove visible page introductions and redundant section headings/descriptions; retain accessible h1/region names. EQ starts with its four tabs and shared filters, followed by special-job filters with Export/Add aligned at the right. FAC keeps collapsible filters and a layout/count/action toolbar below them; phone actions remain outside the collapsed filters. Phone fields use two columns with full-width search and no intrinsic date-field overflow.

Put the shared visibility checkbox at the top right of job cards, visibly labelled Show, and in the FAC list. Explain its shared dashboard/3D effects, audit and retained history/export in a tooltip on hover or keyboard focus, associated with the control through aria-describedby. Keep compact controls in detail headers for direct links, removing the old block below Details. Read-only roles see Show: On/Off. Reuse existing audited setters and query scopes. Phone targets are 44 px. Evidence: `docs/evidence/U1/jobs-cleanup-c41/REPORT.md`. U1 remains incomplete/unapproved.

## 36 U1-C42: plain FAC cards and direct quick edits (24 October 2026)

FAC cards use equal thin neutral borders without status-coloured left stripes, modest corners and neutral icon backgrounds. Retain meaningful status/due labels and progress. Writers can toggle Show from the card; a read-only state must not be mistaken for writer mode. Leave review previews in FAC Team mode when demonstrating editable FAC work.

Quick edit opens the existing authorized form without navigating away: progress/date/note/photos for FAC work, or job details where master-list or eligible own one-time editing is already allowed. When Quick edit edits job details, Update progress stays separate. Preserve held/finished-cycle restrictions, independent capabilities and existing EQ card Edit. Saving refreshes the card in the same board/list view. Evidence: `docs/evidence/U1/jobs-cleanup-c42/REPORT.md`. U1 remains incomplete/unapproved.

## 37 U1-C43: one-row EQ/FAC card actions (24 October 2026)

Keep all card actions on a single compact line. Desktop controls are 32 px high; phones retain at least 44 by 44 px targets. FAC phone buttons use clear text labels without redundant icons. EQ Open/Edit/Cancel use labelled icons with tooltips; Start/Pending/Complete remain concise text, and Pending retains its full Return to Pending accessible name. Keep full detail-page labels. Preserve disabled cancellation explanations and all dialog/command behavior. Extremely narrow rows may pan horizontally within the card instead of wrapping or widening the page.

Retain the explicit Update progress label, replacing C42's progress-form Quick edit alias. Keep Quick edit for job details where authorized and leave Show unchanged. Evidence: `docs/evidence/U1/job-actions-c43/REPORT.md`. U1 remains incomplete/unapproved.

## 38 U1-C44: compact FAC filters and manual lane scrolling (24 October 2026)

Keep the filter row hidden by default with no reserved height. Put a 44 px labelled filter icon in the toolbar; expose expanded state, the controlled form and active-criteria count. Collapse without clearing criteria; Escape collapses and returns focus. Retain visible labels for Discipline, Type, In-house/Outsource and PIC when expanded. Add Search jobs without a visible syntax hint (user follow-up): case-insensitive substring matching, `*` any text and `?` one character; punctuation otherwise literal. Search job description/number, PIC and discipline/type/mode/frequency/remarks; combine with existing filters and use the same population for all dashboard blocks and export.

Each discipline viewport accepts vertical wheel scrolling independently while hovered or paused. At a boundary allow the page to scroll; preserve browser zoom gestures. Static view scrolls natively, reduced-motion mode moves by discrete pages and phones retain the combined static list. Keep keyboard roving focus, auto-resume after pointer leave and TV layout. Evidence: `docs/evidence/U1/fac-controls-c44/REPORT.md`. U1 remains incomplete/unapproved.

## 39 U1-C45: completed FAC progress colour (24 October 2026)

In FAC Dashboard, completed quantity bars and their quantity/percentage text use the same green as Completed/Done status labels when done reaches a positive target. Partial progress keeps yellow; zero targets do not imply completion. Apply to discipline lanes, duplicate moving rows and the phone combined list. Keep job statuses, quantities and FAC Jobs styling unchanged. Evidence: `docs/evidence/U1/fac-completed-c45/REPORT.md`. U1 remains open and unapproved.

## 40 U1-C46: short, clear interface explanations (24 October 2026)

Fixed help text should explain one idea per sentence. Use short labelled points when several rules must stay visible, including automatic/manual status, replacement estimates, role limits, catalogue/position editing and import constraints. Keep action labels consistent with their buttons. Retain important warnings and prototype/source qualifications; do not shorten actual job descriptions or technical observations. Keep internal phase IDs, implementation details and request keys out of ordinary guidance. Desktop and phone copy must wrap inside its notice. Evidence: `docs/evidence/U1/status-copy-c46/REPORT.md`. U1 remains open and unapproved.

## 41 U1-C47: spare-register action row (24 October 2026)

Keep History and Update side by side in the spare-register Actions cell. Allow enough intrinsic width for both buttons without shrinking or wrapping their labels. On narrow screens the existing table wrapper scrolls horizontally. Management retains History only. Evidence: `docs/evidence/U1/spare-actions-c47/REPORT.md`. U1 remains open and unapproved.

## 42 U1-C48: EQ job-card links (24 October 2026)

Use each EQ job title as the job-details link, like FAC Jobs. Remove the separate card number link; retain numbers in record headings, search and accessible card identity. Omit the visible cancellation-unavailable paragraph on cards. Keep its reason available through the Cancel tooltip and screen-reader description, without changing cancellation eligibility. Apply to Board and Tabs; retain Show, status/kind badges, actions and detail-page information. Evidence: `docs/evidence/U1/job-links-c48/REPORT.md`. U1 remains open and unapproved.

## 43 U1-C49: first-row EQ job titles (24 October 2026)

Place the linked title first in each EQ card header, with badges and Show to its right. The title can wrap naturally, while badges wrap within a bounded group. Keep full names, clear separation, keyboard links and existing controls on desktop and phone. Board and Tabs share the same header. Evidence: `docs/evidence/U1/job-heading-c49/REPORT.md`. U1 remains open and unapproved.

## 44 U1-C50: EQ special-job progress (24 October 2026)

Cards and details show a compact percentage bar, latest work date and note (up to two lines on cards, full history in details). Completed progress uses green. Pending starts at 0%; existing Current jobs without a recorded estimate show Not updated. Keep the first-row title link as the route to details and remove the separate Open job details action. Preserve Show, badges, metadata, existing edit/state controls and one-row actions with local panning on narrow screens.

Update progress is the primary action for writable, active, noncancelled jobs. Require a whole percentage from 0 to 100, work date and note. At 100%, the same form becomes completion, requiring existing replacement-position/item/quantity/date fields when relevant; repairs take no replacement lines. Completed cards have no progress action. Partial updates start Pending work when above zero, preserve operational equipment status and append previous/new estimates with actor/date/note. Show clear field errors and preserve typed values on stale-version conflicts. Read-only users see summaries without mutation controls. Reopened jobs retain history/installations, clear their active estimate, and can re-complete with committed lines without duplicates. Prototype data remains in memory for the current page view; evidence uploads are not implemented. Evidence: `docs/evidence/U1/job-progress-c50/REPORT.md`. U1 remains open and unapproved.

## 45 U1-C51: Projects and shared type-wide jobs (24 October 2026)

Add Project to Kind, filters, cards and current-state panels. Put labelled EQ type and Equipment fields first in Add special job. Selecting a type filters Equipment to active members plus All [type] equipment; changing type clears prior equipment/component targets. Keep individual equipment selection and its existing component scope. All equipment uses whole-equipment scope and a short notice: one shared job, shared progress/completion, including equipment added later. The same choices fit phones and retain keyboard/label/error behavior.

Type-wide jobs have one Jobs card/count/export entry with an All [type] equipment label and member count. Each active member's current-state page shows the same job and title/detail route. Shared detail links current members and explains future inclusion. Progress, completion, Show, cancellation and reopening update the one record across pages. Later equipment sees the existing shared state, including completion; it gets no invented installation. Scope/type cannot change after creation. Retired equipment is outside the live type scope and open shared work prevents member retirement. Project replacement lines are optional; Replacement keeps required lines and Repair takes none. Fleet replacement choices identify equipment codes and real positions, with atomic scope validation. Keep prior progress, role/creator permissions, one-row actions and the current-state/history boundary. Evidence: `docs/evidence/U1/fleet-jobs-c51/REPORT.md`. U1 remains open and unapproved.

## 46 U1-C52: equipment workspace dashboard styling (24 October 2026)

Use the approved mockup's existing dashboard palette: warm-neutral page, white cards, equal neutral borders, dark text, restrained shadows and navy/gold shell. Keep one compact equipment identity/status/source/model summary with existing actions. Use a quieter selected tree row and neutral count badges. Place Flat/3D, Overall/Technical and area selection above the model, with label/work/camera controls below. Overall starts with six key assembly labels; Technical and selected scopes retain all relevant labels. Preserve geometry, camera interaction, selection, isolation, source qualification and legend.

Consolidate the information tabs, search and one All/Open/Completed filter row into a sticky header. Hide repeated whole-equipment headings visually on desktop while retaining accessible names and visible selected-scope context. Use independent neutral title-first special-job cards; kind/target is plain metadata and status is explicitly labelled. Keep dates and current matching positions. Store record numbers in search, accessible link identity, tooltips and details. Search and status filtering combine in place and retain criteria across Flat/3D; announce results and no matches. Cancelled is a count/link to the existing authorized Jobs list, not an expansion of current-state data. View in Jobs/title links and scoped Add retain existing permissions. Do not add private progress/history to these panels.

Phone Mechanisms/Details drawers remain opaque, full height and closable with 44 px targets and no page overflow. Keep reduced motion, keyboard tab/title navigation and Escape search clearing. Apply the same neutral borders to RTG current-job summaries while preserving its model availability boundary. Evidence: `docs/evidence/U1/equipment-style-c52/REPORT.md`; approved mockup: `artifacts/mockups/equipment-dashboard-c52/`. U1 remains open and unapproved.

## 47 U1-C53: fleet toolbar cleanup (24 October 2026)

Omit the Breakdown/Maintenance cards-blink legend from the normal fleet toolbar and TV footer. Put Refresh first in the right-aligned action group, followed by Pause blinking and TV mode; wrapped phone actions remain right-aligned. Keep the left-side refreshed timestamp, ZMMS freshness and automatic-status explanation. Error-state Refresh uses the same placement; TV remains read-only with its existing Pause/Exit controls. Actual card blinking and pause/reduced-motion rules are unchanged. Evidence: `docs/evidence/U1/fleet-toolbar-c53/REPORT.md`. U1 remains open and unapproved.

## 48 U1-C54: complete fleet quantities (24 October 2026)

Use 14 QC, 46 RTG and 7 ES members (67 active in the default prototype), ordered numerically within type. Fleet cards/table, the total/type/status KPIs, search, type filters, EQ status board, all four EQ Jobs equipment filters, job creation, shared type-scoped membership, Admin equipment and ZMMS mapping choices read the same register. Normal mode can scroll; TV retains measured paging with all 67 members reachable without page scrolling at 1920x1080 and 1366x768. Phone search reaches the last member of each type with no horizontal page overflow. No layout-specific equipment totals are hardcoded.

Keep explicit demo codes until real identifiers are verified. Added equipment and the former retired RTG 07 example start active/Unreported with no assumed model/part positions/history/commissioning date/ZMMS mapping. Existing demonstration records retain their identities. Equipment-level jobs are available immediately; component/spare-part work still requires verified model/confirmed positions. The 67-member population supersedes earlier measured 17-row/16-active fixture descriptions, not the retained historical evidence. The register remains configurable with later additions and retirement. Evidence: `docs/evidence/U1/fleet-size-c54/REPORT.md`. U1 remains open and unapproved.

## 49 U1-C55: compact FAC dashboard header (24 October 2026)

Remove the duplicate visible FAC Dashboard title and its Prototype, synthetic progress badge. Retain a screen-reader h1 and the refresh timestamp, with no extra timestamp margin. Normal top padding is 8 px; keep the existing action sizes, wrapping, dashboard sections and TV layout. The shared header remains compact in TV mode. Evidence: `docs/evidence/U1/fac-heading-c55/REPORT.md`. U1 remains open/unapproved.

## 50 U1-C56: compact proof/due-load cards and taller feeds (24 October 2026)

Omit the visible due-load explanatory footnote. Latest proof uses an image at left with controls/photo count above the caption at right; the controls no longer consume a separate full-width row below the image. Desktop photo controls are 28x28 px with accessible names, keyboard behavior and focus rings; phone/coarse-pointer controls stay 44x44 px and the photo count can wrap. Captions and job links remain readable. Shorten the normal desktop bottom row to 152 px and increase main feed height by 56 px at 1920x1080; TV uses 144/128 px bottom rows at 1920/1366 while its feed grid takes remaining space. Keep normal narrow-screen page scrolling, chart data/legend, all carousel actions and current filters. Evidence: `docs/evidence/U1/fac-bottom-c56/REPORT.md`. U1 remains open/unapproved.

## 51 U1-C57: full-width charts and three-card row (24 October 2026)

User-approved order: Latest proof / Completion trend · 4 weeks / Due in the next 8 weeks. Use three equal columns on desktop/TV with the existing 152 px normal and 144/128 px TV row heights. Main feeds retain their C56 height. Normal screens below 1200 px and phone TV stack cards; each phone chart is 120 px high. Keep proof controls beside the image and readable captions within the narrower card.

Both SVG charts use actual plot width/height after layout; bars span the available horizontal space and labels keep their pixel sizes rather than shrinking/stretching in a fixed-ratio box. Resize and refresh redraw geometry without resetting the feed offsets. Preserve chart accessible names, eight due weeks, four completion weeks, discipline legend/segment titles and equivalent screen-reader tables. Empty searches render zero weeks, not fabricated bars or percentages. Trend definition and filters: DATA section 18.4 / D-201; current week is explicitly week-to-date in the heading tooltip and accessible chart name. No new footer guidance. Evidence: `docs/evidence/U1/fac-charts-c57/REPORT.md`. U1 remains open/unapproved.

## 52 U1-C58: larger proof photo within fixed card (24 October 2026)

Desktop/TV proof figures fill their available height with a responsive left image column, bounded between 128 and 184 px in normal/tall layouts. Short TV layouts use a smaller share to retain readable full captions. Images use contain sizing, preserving the whole photo and its proportions. Controls/count stay above the caption at right, with existing sizes and actions. Card/row/feed heights stay fixed; phones retain their earlier dimensions and touch targets. Evidence: `docs/evidence/U1/proof-preview-c58/REPORT.md`. U1 remains open/unapproved.
