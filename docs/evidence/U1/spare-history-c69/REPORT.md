# U1-C69: spare-part History in the crane view; Spare parts condition first in EQ Jobs

5 November 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C69-20261105.md` | D-218

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.** Synthetic prototype data only; replacements saved in the check are in memory.

## What changed

- **History on Spare part status cards** (`js/panel-tabs.js`, `js/views-equipment.js`, `js/spares.js`, `css/equipment-dashboard.css`). Every registered card has History beside Update condition (read-only roles see History alone). It lays the part's replacement history over the model stage, as marked in the user's screenshot, without rebuilding the 3D/Flat session or changing the URL:
  - facts: installed now (condition, brand, part no.), in service since (fitted date or commissioning), replacements recorded, expected life, next predicted replacement;
  - installation periods newest first: Original (as supplied) or Replaced <date>, item, brand / part no. / serial, in service from-to with the service length, removed date, source special job (linked) or register entry, recorder and time;
  - Register change log (collapsed): every register revision with before/after values, the same list the EQ Jobs register row shows;
  - Open in Jobs (Spare parts condition, scoped to the part).
  Close, Escape, pressing History again or Reset closes it and returns focus to the History button (phone/tablet: to Details). A selection, area, camera-mode or equipment change closes it. On phone/tablet History closes the Details drawer so the history is visible. Saving Update condition while it is open refreshes it. RTG/ES and viewer fallbacks show it over the viewport. It needs `eq.jobs.view`, the same as the register history in Jobs (D-139); without it History is not offered and the data call returns 403.
- **EQ Jobs order and default** (`js/views-eqjobs.js`, `js/app.js`, `js/access.js`): Spare parts condition, Projects/Special, EQ status. The Jobs navigation, bare `#/eq/jobs`, unknown tab names, the landing fallback and remembered Jobs routes open Spare parts condition. `#/eq/jobs/daily` still falls back to Projects/Special with the removal notice (AM07).
- The register change-log rendering moved from `views-eqjobs.js` into `EQ.panelTabs.spareChangeLog` / `spareState` (same markup) so both places share it.
- Contracts/specs: DATA_CONTRACT s14 table, s18.1, s18.2; API_CONTRACT s4.16, s4.17; UX_SPEC s14 and s16; revision-summary line in API/ARCHITECTURE/DATA/IMPLEMENTATION_PLAN/PORTAL_INTEGRATION_PLAN/UX_SPEC. `documents/` and `docs/SOW_V2.md` not edited (supersession recorded in D-218).

## Checks (actual results)

| Check | Result |
| --- | --- |
| check_u1_c69.mjs (new) | 15/15 PASS (`checks.json`) |
| check_u1_c63_model.mjs | 55/55 PASS |
| check_r02b_round2.mjs | PASS |
| check_u1_c50.mjs | 49/49 PASS |
| check_u1_c50_browser.mjs | 23/23 PASS |
| check_u1_c35.mjs | 11/11 PASS |
| check_u1_c63_browser.mjs | 68/68 PASS (AM07 daily redirect retained) |
| check_unified_viewer.mjs | 11/11 PASS in 3 of 4 runs; one run failed step 02 on the Projects/Special tab, whose text it compares 500 ms after a Flat/3D switch while that tab loads lazily (timing; that tab is unchanged here) |
| check_u1_c66.mjs | 14/14 PASS |
| check_u1_c64_browser.mjs | 63/63 PASS on rerun. Its first check (wait for one Fleet pulse `animationiteration` within 8 s) is flaky in this headless container: it timed out in 2 of 3 runs with the change and in 1 of 3 runs on unmodified HEAD; Fleet code is not touched |
| `__protoAudit()` (equipment page with History open; EQ Jobs) | 0 issues, 0 console errors |

Screenshots: `01-jobs-default-spare-parts.png` (EQ Jobs opened from `#/eq/jobs`), `02-crane-history-gearbox-a.png` (Main hoist gearbox A, Original), `03-crane-history-after-replacement.png` (after a replacement saved with the history open), `04-phone-history.png` (390 px, from the Details drawer).
