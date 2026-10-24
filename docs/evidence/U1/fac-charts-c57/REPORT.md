# U1-C57 - full-width charts and approved third card - 24 October 2026

The user requested a larger due-load plot without a larger card, then selected Completion trend as the third card. Implemented Latest proof / Completion trend / Due in the next 8 weeks, three equal columns on desktop/TV and stacked on narrower screens. Normal desktop remains 152 px high and the 1920 main feed remains 392 px; TV remains 144 px at 1920 and 128 px at 1366. Phone charts are 120 px, below the prior due-card height of 122.64 px. Pre-change measurements are in `before.json`.

The chart renderer uses the actual SVG viewport dimensions after layout, eliminating the fixed-aspect-ratio whitespace. Due bars occupy over 90% of the available plot width; labels retain pixel sizes without stretching. Zero data stays zero, with dates retained and no invalid geometry. Accessible chart summaries, equivalent data tables and discipline titles/legends remain. Resize/refresh uses the existing render path, not a new timer.

Completion trend counts recorded completed scheduled-job cycles in the prior three full Monday-Sunday weeks plus the current week through the Asia/Colombo business date. Count cycles once rather than quantities/progress events, exclude recurring Daily/Weekly checks and future completions, and return four explicit zero weeks when empty. Apply shown-job population and discipline/type/mode/PIC/search filters, including historical completions after deactivation; KPI focus continues to narrow lanes only. Return aggregate dates/counts only. Current synthetic fixture totals are 2, 1, 3, 2 across those four weeks.

## Verification

| Check | Result |
| --- | --- |
| `node tools/p02b/check_u1_c57.mjs` | 34/34 VM/browser checks; `checks.json`; zero browser errors |
| `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/fac-charts-c57/r02b-regression.json` | 10/10 prior DTO/FAC KPI regressions |
| `node --check` on `js/fac.js`, `js/views-fac.js` and the new check script; `git diff --check` | Pass, existing LF/CRLF notices only |

Independent aggregation oracle covers date boundaries, future/period exclusion, hidden/deactivated jobs, populated mode/PIC/combined filters, empty/wildcard search and feature denial. Browser checks cover 1920/1366 desktop and TV, 375 phone, exact card/feed heights against the pre-change baseline, chart coverage/label bounds/proportions, no overflow/card clipping, resize redraw, live search, proof navigation and every photo caption in both TV sizes. Reviewed `dashboard-1920.png`, `tv-1366.png` and scrolled `dashboard-375.png`; other captures are in this folder. Normal narrow screens still use page scrolling; TV has none.

## Files and boundary

Runtime: `artifacts/prototypes/p02-ui/js/fac.js`, `js/views-fac.js`, `css/fac-dashboard.css`. Verification: `tools/p02b/check_u1_c57.mjs`, this evidence folder. Records: prototype README, DATA section 18.4, API section 4.25, UX section 51, DECISIONS D-201, HANDOVER, IMPLEMENTATION_STATUS and exact run request.

Existing pending edits preserved; protected source folders unchanged. Direct Codex U1 refinement with the previously loaded UI/UX skill; actual model/effort not independently recorded, no delegated phase/independent R verdict. Local synthetic in-memory/browser evidence only; production authentication/persistence/live ZMMS/deployment acceptance NOT RUN. Changes uncommitted. U1 remains open/unapproved; P04 Not started.
