# U1-C38 FAC Dashboard restyle - 24 October 2026

Reviewed the running EQ Fleet and FAC Dashboard, then compared the supplied `reference.jpg`. EQ already provided warm grey/white cards, modest shadows, compact typography and clear figure hierarchy. FAC had more coloured bands, crowded labels and table-like moving rows. FAC now follows the EQ structure, using yellow selectively from the reference. It remains the synthetic P02/P02B prototype.

## Changes

- Eight number-first KPI cards precede a separate filter bar. Counts and click handlers are unchanged; secondary captions are shortened.
- Three discipline columns have neutral headings and yellow completion rings. Each moving row is now a separate white card with image/icon, name/metadata, status/due and progress/hold reason. Quantity progress is yellow; statuses retain text and icons.
- The updates ticker becomes a quiet white strip with a yellow label. Proof carousel and due-load chart use the same card style. Chart segments retain E/M/C labels.
- Existing scrolling/pause, keyboard, ticker, photo rotation, refresh, static list, phone combined list, reduced-motion page mode and TV controls are retained. Fixed row pitch includes the gap, preserving motion calculations.
- `css/fac-dashboard.css` scopes the restyle. `js/views-fac.js` changes card markup/order/captions, `js/app.js` selects a dashboard-only page background, and `index.html` loads the stylesheet. EQ/FAC job styles, shared data helpers and source authorities are untouched.

## Verification actually performed

Used the local in-app browser at `http://127.0.0.1:5312/` with the prototype's synthetic persona. These were focused browser inspections/interactions and DOM measurements, not an independent review or a broad automated suite.

| Check | Observed result |
| --- | --- |
| EQ/FAC visual comparison | Inspected both before changes; inspected revised normal and TV views against the reference. |
| Normal desktop, 1920x1080 | Eight KPIs align left. Three 336 px lane viewports use 112 px row pitch. Supporting panels end at 1067.6 px; due-load note is contained after reducing its chart height. No horizontal page overflow. |
| Normal desktop, 1366x768 | Four KPI columns, three lanes; no horizontal page or job-card overflow. Page scroll is expected in normal mode. |
| TV, 1920x1080 | Page scroll dimensions 1920x1080; supporting panels end at 1069.6 px. Navigation/filters hidden, larger text, all dashboard sections visible. |
| TV, 1366x768 | Page scroll dimensions 1366x768; supporting panels end at 760.0 px. Exit TV restores normal mode. |
| Phone, 375x812 | Two KPI columns, wrapping tools, two-column filters, static combined list and no lanes. Scroll width 360 px, no horizontal overflow or job-card overflow. Inspected job cards after scrolling. |
| Tablet, 768x1024 | Discipline lanes stack in one column without horizontal page overflow. Removed an overly spacious tablet-only card rule found during inspection. |
| Motion | Normal mode produces changing vertical lane transforms and horizontal ticker transforms. Pause produces stable transforms on a subsequent read; Resume restores motion. Row offsets rescale on viewport resize, preserving row anchors. |
| Static view | `motion=off`, empty track transforms, duplicate lists hidden, lane viewports scroll manually. |
| Reduced-motion preview | `motion=reduced` produces `data-motion=flip`, numbered pages, discrete lane jumps and an unmoving ticker. Observed Page 1 followed by Page 6 after working on other checks. Actual OS preference toggling was not exercised. |
| Filters and KPI action | Civil + Inspection + Overdue shows only four matching overdue Civil jobs, with selected KPI and all filters in the URL. Clear filters restores the population. |
| Filtered on-time figure | Civil inspections: 71%, 5 of 7 cycles, 35 active jobs. Unfiltered: 75%, 6 of 8 cycles, 114 active jobs. |
| Refresh and photo controls | Refresh retained 114 moving-list jobs, figures 114/14/7/2/7/5/75%/4 of 14, pause state and updated time. Next photo changed Photo 6 of 12 to Photo 7 of 12. |
| Syntax / whitespace | `node --check` for both changed JavaScript files and `git diff --check` passed. |

Saved captures: `desktop.jpg`, `tv-1920.jpg`, `tv-1366.jpg`, `phone.jpg`. User reference: `reference.jpg`. Runtime has no bundler/build step. No backend, production, real authentication, database or live ZMMS verification was performed. No claim of full regression-suite or formal acceptance execution is made. The old four-visible-rows density oracle is superseded by D-181's larger card presentation.

The separately committed C37 panel cleanup (`9c4ea49`) and pre-existing RTG handover change were preserved. This work did not edit `documents/`, drawings, Portal, model geometry or production systems. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 remains Not started.**
