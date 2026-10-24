# U1-C41 compact Jobs workspaces - 24 October 2026

Removed visible EQ/FAC Jobs introductory blocks, the repeated Special jobs heading and explanatory paragraphs. Accessible h1 headings remain. EQ Export/Add now share the secondary filters; FAC layout/count/export/add share one toolbar below its filters. FAC filters still collapse on phones, while toolbar actions remain reachable. Loading/error/empty banners and meaningful record warnings remain.

The shared Show checkbox is at the top right of EQ/FAC cards and in the FAC list. Its explanation appears on hover or keyboard focus and is associated through aria-describedby. Direct job links retain a compact control in the header; the old Details explanation is removed. The existing versioned EQ visibility setter and audited FAC setter are unchanged. Read-only roles retain compact state text.

Focused browser verification at local `127.0.0.1:5312` with synthetic fixtures:

- EQ board and Tabs layouts render the control and moved actions. Hiding EQJ-2026-000105 keeps it in Jobs; reopening shows the unchecked state, incremented version and a hidden-from-dashboard event. Restored it through the same control.
- Hiding current job EQJ-2026-000104 removes it from the crane Projects/Special panel, leaves three open jobs and no Hoist open-job marker, while Jobs retains the card. Restored it from the card.
- FAC initially has 114 dashboard jobs and 7 overdue. Hiding Caisson joint Inspection reduces these to 113 and 6 and removes its dashboard link. Jobs still has 114 records; list search finds the hidden job. Its detail shows the unchecked setting and a timeline edit. Restored it.
- Management sees 19 EQ and 27 FAC My work visibility states with zero editable switches and no Add buttons. No permission changes were made.
- At 1670x900 the removed intro blocks are absent and actions align with the filters/layout controls. At 375x812 the document width is 360 px, Show has a 44 px target, and date fields fit their 147.4 px grid cells. FAC Export/Add are each 44 px high outside the collapsed filters.
- Keyboard focus displays the described tooltip. The phone tooltip is 304 px wide, from x20.4 to x324.4, within the viewport.
- JavaScript syntax checks pass. Export handlers and filter data paths were retained; no new export-download or full regression suite was run for this layout change.

Evidence: `eq-desktop.jpg`, `eq-phone.jpg`, `eq-phone-card.jpg`, `fac-desktop.jpg`, `fac-phone.jpg`, `fac-tooltip.jpg`, and the two user reference images. These captures record C41; FAC card styling and quick actions are subsequently refined in C42.

Runtime: `js/views-jobs.js`, `js/views-eqjobs.js`, `js/views-facjobs.js`, new `css/jobs.css`, and stylesheet/script references in `index.html`, under `artifacts/prototypes/p02-ui/`. Previous C38-C40 changes remain. Local synthetic prototype verification only. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 is Not started.**
