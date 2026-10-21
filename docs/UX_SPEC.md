# UX specification

Prepared in P02 on 21 October 2026. Status: **design contract for R02 and the U1 user checkpoint**, backed by a runnable prototype (`artifacts/prototypes/p02-ui`, run instructions in its README). Authorities: `documents/prompt-pack/APPROVED_REQUIREMENTS.md` s4, s5, s7, `QC_3D_MODELLING_BRIEF.md` s5, `docs/DATA_CONTRACT.md`, `docs/API_CONTRACT.md`, `docs/ARCHITECTURE.md` s6-s7. Decisions made here are D-45 to D-54 in `docs/DECISIONS.md`.

**What is real and what is not.** Real: the mechanism catalogue (16 main, 43 sub, 41 active, 048/063 inactive, no main 10, 061 Spreader, 062 Headblock) and the drawing observations (J526A00 family, including the unresolved 46 / 45.5 m/min gantry-speed conflict). Synthetic and labelled so on every page: all equipment (`*-DEMO-*`), positions, jobs, history, users and the simulated server rules. The QC viewer area is an SVG schematic placeholder, not the P03 model. Nothing is persisted, no sign-in exists, and the role switch is a simulation; a reload restores the fixtures.

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

- Header text states the facts that matter: status is reported manually, there is no live telemetry, never-set equipment shows **Unreported**, not Ready.
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
3. **Right panel**: scope title and kind, tabs **History** and **Technical** (below).

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
