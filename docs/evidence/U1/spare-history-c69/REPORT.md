# U1-C69: spare-part History in the crane view; Spare parts condition first in EQ Jobs

5 November 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C69-20261105.md` | D-218, follow-up D-219

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.** Synthetic prototype data only; replacements saved in the check are in memory.

## What changed

- **History on Spare part status cards** (`js/panel-tabs.js`, `js/views-equipment.js`, `js/spares.js`, `css/equipment-dashboard.css`). Every registered card has History beside Update condition (read-only roles see History alone). After the follow-up (D-219) it opens a **floating panel over the 3D model** (about 360 px, top-right of the stage, sized to its content, scrolling inside); the model stays visible and can be rotated/zoomed beside it, and the viewer session and URL are unchanged:
  - header: part name, equipment, part type, main/sub code, condition tag, icon close button;
  - compact 2 x 2 summary: In service since (with duration), Replacements, Expected life, Next replacement (days to go, red when overdue, amber when due soon);
  - Installations, newest first, as plain rows with dividers (no coloured edge strips): period ("15 Mar 2018 – 16 Oct 2026" / "– present"), Original / Current, item, brand · part no. · S/N, service length and source (special job link or register entry; recorder and time in the tooltip);
  - Register changes (collapsed): every register revision with before/after values, the same plain rows as EQ Jobs;
  - Open in Jobs.
  It stays open across Flat/3D and Overall/Technical. Close, Escape, pressing History again or Reset closes it and returns focus to the History button (phone/tablet: to Details); a selection, area or equipment change closes it. On phone/tablet History closes the Details drawer and the panel spans the stage width. Saving Update condition while it is open refreshes it. RTG/ES and viewer fallbacks show it over the viewport. It needs `eq.jobs.view`, the same as the register history in Jobs (D-139); without it History is not offered and the data call returns 403.
- **Flag chips filter** (D-219). Crane view: "N registered / N overdue / N due soon" are toggle buttons that show all, only overdue or only due-soon cards; they combine with the panel search, survive re-renders (kept per equipment and selection, in memory), a second press shows all and a zero-count chip is disabled. EQ Jobs > Spare parts condition: the same chips set the existing Flag filter (URL `flag=`), with counts of the whole selection.
- **EQ Jobs order and default** (`js/views-eqjobs.js`, `js/app.js`, `js/access.js`): Spare parts condition, Projects/Special, EQ status. The Jobs navigation, bare `#/eq/jobs`, unknown tab names, the landing fallback and remembered Jobs routes open Spare parts condition. `#/eq/jobs/daily` still falls back to Projects/Special with the removal notice (AM07).
- The register change-log rendering moved into `EQ.panelTabs.spareChangeLog` (plain rows) so EQ Jobs and the crane view share it.
- Contracts/specs: DATA_CONTRACT s14 table, s18.1, s18.2; API_CONTRACT s4.16, s4.17; UX_SPEC s14 and s16; revision-summary line in API/ARCHITECTURE/DATA/IMPLEMENTATION_PLAN/PORTAL_INTEGRATION_PLAN/UX_SPEC. `documents/` and `docs/SOW_V2.md` not edited (supersession recorded in D-218).

## Checks (actual results)

Final state after the D-219 follow-up:

| Check | Result |
| --- | --- |
| check_u1_c69.mjs (new) | 17/17 PASS (`checks.json`); the first follow-up run had one test-side miss (H8 still queried the removed list class), corrected and rerun |
| check_u1_c63_model.mjs | 55/55 PASS |
| check_r02b_round2.mjs | PASS |
| check_u1_c50.mjs | 49/49 PASS |
| check_u1_c50_browser.mjs | 23/23 PASS |
| check_u1_c35.mjs | 11/11 PASS |
| check_u1_c63_browser.mjs | 68/68 PASS (AM07 daily redirect retained) |
| check_unified_viewer.mjs | 11/11 PASS. Before the follow-up, one of four runs failed step 02 on the Projects/Special tab, whose text it compares 500 ms after a Flat/3D switch while that tab loads lazily (timing; that tab is unchanged here) |
| check_u1_c66.mjs | 14/14 PASS |
| check_u1_c64_browser.mjs | Not rerun after the follow-up (Fleet untouched). Before it: 63/63 on rerun; its first check (one Fleet pulse `animationiteration` within 8 s) timed out in 2 of 3 runs with the change and in 1 of 3 runs on unmodified HEAD |
| `__protoAudit()` (equipment page with History open and a chip filter pressed; EQ Jobs with flag=overdue) | 0 issues, 0 console errors |

Screenshots: `01-jobs-default-spare-parts.png` (EQ Jobs opened from `#/eq/jobs`), `02-crane-history-gearbox-a.png` (Main hoist gearbox A, Original), `03-crane-history-after-replacement.png` (after a replacement saved with the history open), `04-phone-history.png` (390 px, from the Details drawer), `05-crane-chip-filter-overdue.png` (overdue chip pressed).
