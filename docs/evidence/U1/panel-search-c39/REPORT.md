# U1-C39 compact information-panel searches - 24 October 2026

Added a 32 px search row directly beneath the four equipment tabs. Phone input and clear button are 44 px. Queries match all words without case sensitivity, with a shown/total count, clear button and Escape-to-clear. Each equipment/scope/tab stores its query in memory; filtering updates only the existing panel DOM. No new data requests, expanded history, store mutation, camera/model change or permissions change.

Sources: `artifacts/prototypes/p02-ui/js/panel-tabs.js`, `js/views-equipment.js`, `css/app.css`. Record cards, technical specifications, drawings and physical-area parts are marked as filterable items. Technical key/value pairs filter together; qualifications remain within matching items. Status context, scope counts and actions stay available. Prior FAC work and unrelated RTG edits were preserved.

## Actual local verification

Focused interactions and DOM measurements in the local in-app browser, using synthetic fixtures at `http://127.0.0.1:5312/`. No new broad test suite was added.

| Check | Observation |
| --- | --- |
| Placement/density | Search begins below the tab strip; 32 px desktop row with no overlap. Phone input and clear button are each 44 px. |
| Maintenance | `motor` shows job 900101 only, 1/2; equipment status remains visible. Unmatched text shows a no-match message. Clear restores two jobs and focus to the input. |
| Projects/Special | `HOIST motor` shows two of seven scoped jobs, preserving current/completed labels and links. |
| Technical | `lift` shows two of 15 searchable items, retaining the 45 m/63 m values and total-lift-height qualification. |
| Technical mechanism | Selecting 04 Gantry starts with a separate blank query. `speed` keeps both source observations (46 and 45.5 m/min) and the unresolved-conflict warning. |
| Spare parts | `SYN-HM-450` shows only the two registered main-hoist motors, 2/10, with Update condition actions. Escape restores all ten. |
| Per-tab / camera memory | Projects/Special retains `HOIST motor` after visiting Technical and after switching to 3D. Maintenance retains `motor`, 1/2, across Flat/3D. |
| Physical area | Machinery house starts with its own blank query. `motor` shows five of 29 included part positions; matching part links still work. |
| Part / async loading | Opening Main hoist motor A starts its own query. `position` entered while loading survives the response and shows only Position ID, 1/14. |
| Phone | 375x812 drawer fits without horizontal page overflow (360 px document width). Search works and Escape clears text while keeping the drawer open. |
| Management | Spare search returns the same two motors with zero Update condition or Add spare buttons. |
| Browser diagnostics | No warning/error entries returned after final Flat/3D interaction. |
| Syntax / whitespace | Both changed JavaScript files pass `node --check`; `git diff --check` passes. |

An initial automation fill raced the existing 260 ms panel-loading rerender; waiting for the loaded record allowed verification. This was not counted as a successful interaction. Whole-equipment Technical search for `gantry` correctly matched nothing because that tab initially shows major parameters, not mechanism-specific parameters; Gantry was then selected to verify its scoped specification search.

Saved evidence: `desktop.jpg`, `panel.jpg`, `phone.jpg`, and user `reference.png`. Actual OS/production/authenticated-server acceptance and broad model/browser regressions were not run. Search query state is intentionally local/in-memory, as is the prototype. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 is Not started.**
