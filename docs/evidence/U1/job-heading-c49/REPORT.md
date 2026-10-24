# U1-C49 first-row EQ card title

24 October 2026. Moved the linked job heading into the first card row alongside kind/status/priority and Show. Scoped flex rules in `css/v2.css` keep the title and bounded badge group separate, allowing full text to wrap without overlap. `js/views-jobs.js` keeps all metadata, links and actions; source job descriptions are untouched.

Focused headless Chrome verification at localhost:5312: all 19 titles are first in their header row; header areas align without overlap; Show remains available; keyboard Enter opens the same record; Tabs share the header; 375 px phone layout fits without page overflow; no browser errors. Before/after measurements: `before-heights.json` and `checks.json`. First example card is 22.84 px shorter; 18 cards are shorter and one changes by less than 1 px due to wrapping. Desktop screenshot inspected; phone capture retained. JavaScript syntax and staged whitespace checks pass. No new repository tests for this small layout change.

Only this request is staged; earlier uncommitted U1/RTG work is preserved. Direct Codex adjustment, no delegated phase/independent R verdict; actual runtime model/effort not independently recorded. Local synthetic prototype only. U1 remains IN PROGRESS, NOT COMPLETE and NOT APPROVED; P04 Not started.
