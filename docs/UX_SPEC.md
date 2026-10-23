# UX specification

Prepared in P02 on 21 October 2026; extended in P02B on 22 October 2026 to SOW V2 and the P01B contracts (sections 13-19 below; where they differ from sections 1-12, **sections 13-19 win**). Status: **design contract for R02B and the U1 repeat checkpoint**, backed by a runnable prototype (`artifacts/prototypes/p02-ui`, run instructions in its README) and the P03 viewer page for the 3D right panel. Authorities: `documents/prompt-pack/APPROVED_REQUIREMENTS.md` s4, s5, s7, `QC_3D_MODELLING_BRIEF.md` s5, `docs/DATA_CONTRACT.md`, `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md` s6-s7. Decisions made here are D-45 to D-54 (P02) and D-129 to D-138 (P02B) in `docs/DECISIONS.md`.

**What is real and what is not.** Real: the mechanism catalogue (16 main, 43 sub, 41 active, 048/063 inactive, no main 10, 061 Spreader, 062 Headblock) and the drawing observations (J526A00 family, including the unresolved 46 / 45.5 m/min gantry-speed conflict). Synthetic and labelled so on every page: all equipment (`*-DEMO-*`), positions, jobs, history, users, ZMMS daily jobs and sync runs, spare-part register, FAC progress, photos and updates, and the simulated server rules. The only real data in P02B besides the mechanism catalogue is the FAC job list (114 jobs from `reference/fac-job-list.json`, with their issues). The QC viewer area is an SVG schematic placeholder, not the P03 model. Nothing is persisted, no sign-in exists, and the role switch is a simulation; a reload restores the fixtures.

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
4. Does the Fleet group row layout scan well at 1366 x 768 for the real fleet size (unknown to this project, see U-07)?


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
| **Projects/Special** | the **open** special jobs (Pending, Current) of the selection with matching lines; counts "N open / N completed / N cancelled"; completed jobs are counted, not listed (U-31 reading); Add job for this selection for writers | whole equipment: all; mechanism or submechanism: direct and descendant work, de-duplicated; part: exact position; **Open in Jobs** opens the scoped history |
| **Technical** | specification summary of the selected area: equipment (type, model association, commissioning date, major parameters), mechanism or submechanism (definition, original label, source-linked parameters), part (identity, semantic key, kind, installed item now without past events, provenance, sources) with the 63 m total-lift and the 46 / 45.5 m/min conflict notes | selection |
| **Spare parts** | current register rows of designated positions inside the selection: condition (Original / Replaced / Not recorded), brand, model/part no., serial, replaced date, expected life and its source, next predicted replacement with "calendar estimate, not a condition assessment", Overdue / Due soon flags; a non-designated part says "Not a major spare part" | selection; **Open in Jobs** opens the register scoped to it, where the history is kept |

No tab shows completed jobs, installation events, status changes or correction history. Late responses for a previous selection are discarded (HIS05): each tab body carries `data-echo` = equipment | tab | scope | target. The machinery-house container keeps its own explanation instead of tab content. In the 3D page **Open in Jobs** and job numbers open the P02 prototype in a new tab (the production app links within itself). Phone and tablet: the panel is the **Details** drawer.

## 15 Fleet and equipment header additions (S02, S03, S21)

Fleet card: type icon, code, status badge, "For 2 d 4 h" or "No status reported yet", open special jobs, **source tag Auto or Manual** and **ZMMS n** (today's count; nothing for unmapped equipment). Filters add **Status source** (All, Auto, Manual); the freshness line adds "ZMMS data from <time>" with a stale marker when the latest run failed or no success within the stale window. The status-meaning note is a compact info chip ("Automatic status from ZMMS") whose full text is the tooltip and a screen-reader text. Equipment header: Auto (ZMMS) / Manual tag with its meaning, **Correct status** (mapped equipment) or **Update status** (unmapped), and **Back to automatic** while a manual correction holds. The correction dialog needs a reason for every correction of an automatic status and says it holds for the rest of today.

## 16 EQ Jobs tab in three parts (S08; DATA s18.2)

Sub-navigation: **Special & daily jobs**, **EQ status**, **Spare parts condition**; shared filters (equipment, type QC/RTG/ES, From, To, search) are kept in the URL (search text is not).

1. **Special & daily jobs**: the special jobs board (Pending / Current / Completed, Include cancelled, scoped history opened by Open in Jobs) first; below it the section **Daily maintenance jobs (from ZMMS, read-only)** with "ZMMS data from", a synthetic-rows notice, default range today, From/To for earlier days (every synced day is kept), rows marked "No longer in the ZMMS list" when absent from a later complete run, no controls inside the table, unmatched equipment never listed here (Admin only).
2. **EQ status**: one row per active equipment with status, source and mode text, since, reason, "Manual until", causing ZMMS jobs and **Correct...** / **Update...** and **Back to automatic** for writers; below it the status history across equipment (when, equipment, change, source ZMMS sync #n or User, actor or System, reason, causing jobs). Management has no buttons.
3. **Spare parts condition**: register rows (equipment/part, condition, brand/model/serial, replaced, expected life, next predicted replacement, flag, remarks), flag filter, **History** per part (every revision with before -> after, source, reason, job link) and **Update...** for writers (Record Original, Record replacement, Amend current, Edit remarks). A Replacement special job completion shows the condition notice and writes the register in the same commit.

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

- **Spare parts**: spare-part types with default expected life (months, blank = none), a position list per equipment with designation, type and per-equipment life override (1-600 months), reason, and the resulting prediction.
- **ZMMS**: health (last successful sync, latest run, next scheduled, failed runs), sync times and stale window with validation, **Sync now** with a simulated outcome selector (success, login failure, layout change, timeout, HTTP error; a failed run changes nothing), recent runs (including a synthetic failed run), equipment mapping with an ignore entry and Retire, the unmatched queue with Map or ignore, **job type and job status mapping** (effects Breakdown / Maintenance / No effect / Unmapped and Open / Closed; automatic status cannot be switched on while a seen value is unmapped), and the status evaluation of the latest successful run (computed status, why not applied, causing jobs). The mapping effects shown are illustrative; the real choice is the Admin's after the first real data (Q11).
- **Master list**: all FAC jobs, filter and search, add, edit, deactivate (reason) and reactivate; never deleted.
- **Import preview**: counts (111 sheet rows, 114 jobs), the opening-state summary, issues by type with sheet rows and the way each is saved, the known source issues (U-30), the frequencies in the sheet, and a collapsible table of **every job as it would be saved** (blank quantity 1, blank PIC/mode/date stay blank, calculated first due date, opening state, issues); Confirm is simulated and a re-run is refused once progress exists.
- **Lists and settings**: due-soon window, refresh seconds, dashboard scroll speed (validated), frequencies with intervals (tri-annually 4 months, bi-annually 6 months), disciplines and types.

## 20 Contract observations from P02B

| ID | Observation | Proposed handling |
| --- | --- | --- |
| UX-4 | The Maintenance tab shows the same ZMMS list for every selection because ZMMS jobs are equipment-level (DATA s18.1). A user may read this as a defect | the tab says so in one sentence; keep it, confirm at the U1 repeat |
| UX-5 | U-31: Projects/Special lists open jobs only and counts the rest. If the user wants completed special jobs listed too, S07 changes | decide at the U1 repeat (U-31) |
| UX-6 | The real export has equipment codes such as QC002 and spreader codes SQ0xx; spreaders are separate equipment in ZMMS but a part of the crane here | spreader codes stay in the unmatched queue or are mapped by Admin to the crane; P07B/P06 decide (U-33) |
| UX-7 | FAC dashboard lanes show 18 / 55 / 36 listed jobs; jobs completed earlier and not yet due are counted in the ring and KPIs but not listed (D-119) | revisit at U1 if managers expect them listed |

## 21 Repair-R02B changes (23 October 2026)

- **Crane view with the EQ Jobs tab switched off** (D-139): the four tabs keep their current-state content; Projects/Special still lists the open special jobs and the open/completed/cancelled counts, but job numbers are plain text, no tab shows "Open in Jobs" (a short note says the EQ Jobs tab is not available for the role), the header's open-job count is not a link and no job card shows correction history. With the tab on, nothing changes.
- **FAC dashboard row, ticker item and proof caption** (D-140): they open the FAC Jobs record when the user holds FAC Jobs; otherwise the read-only dashboard detail `#/fac/dashboard/jobs/{id}` (same fields, current cycle, previous cycles and timeline; no actions, no picture upload, no photo removal; breadcrumb back to FAC Dashboard). The dashboard **Export** button appears only when the user holds both Export and FAC Jobs, because the export is the FAC Jobs list's export.
- **Dashboard readability** (R02B finding 6): ticker items are two lines (time, who and quantity; then the full job name), 30 em wide, so names are readable (the longest sheet name, 69 characters, still ends with an ellipsis and a tooltip); the due-load chart is drawn flatter (720 x 140) with larger week, count and bar labels (about 14 px at 1920 x 1080 and 18 px in TV mode); on screens at least 1200 x 900 the lanes and the bottom row share the height so the ticker, latest proof and due load are on the first 1920 x 1080 screen with four rows still visible per lane.
- **Status cause text**: an automatic Breakdown/Maintenance shows "Caused by ZMMS job N in the plan of <date>"; an automatic Ready for OPS shows "Not in the ZMMS plan for <date>"; the status history shows the sync run and its plan date, with no reason for automatic rows.
