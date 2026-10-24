# U1-C36 compact equipment summary - 24 October 2026

## Change and review

Baseline `efd1c6d` on `main`. Compacted the equipment name/summary card, as requested; the blue app navigation is unchanged. The old wrapping flex layout placed long metadata and the action buttons on extra rows. The equipment-only `eq-summary` grid now uses an inline type/name/status row with actions, then compact metadata below. Source explanation is retained on the source chip's tooltip and in Maintenance, rather than repeated inline. Timing/since, model, freshness, manual reason and open-work link remain visible. Phone actions keep 44 px targets.

The `.eq-head` class is also used on EQ/FAC job records, so its original styles and breakpoints were preserved; only the equipment card adds `eq-summary`. No action handler, permission, data, model, camera or navigation change. Sources: `artifacts/prototypes/p02-ui/css/app.css`, `artifacts/prototypes/p02-ui/js/views-equipment.js`.

## Actual verification

One-off Chrome 155 browser measurements and interaction checks were used; no new layout test script or broad suite was added. Captures: `desktop.png`, `phone.png` (visually inspected). Measurements: `before.json`, `after.json`.

| Viewport width | Before height | After height | Saved |
| --- | --- | --- | --- |
| 1920 | 120.5 px | 69.9 px | 50.6 px / 42% |
| 1670 | 120.5 px | 69.9 px | 50.6 px / 42% |
| 1366 | 84.4 px | 69.9 px | 14.5 px / 17% |
| 390 | 248.1 px | 172.9 px | 75.3 px / 30% |

All four sizes retain contained text/actions without page overflow. Blue app navigation height, background colour, padding and font size match before/after at each size. Nine interaction/regression checks passed (`checks.json`): status and Add job dialogs, scoped open-work link, manual reason and Back to automatic at desktop/phone, Management read-only state, original EQ/FAC job-header layouts, and no browser errors. JS syntax and `git diff --check` pass.

The local preview server was stopped at first inspection and restarted for these measurements. Initial measurement/fixture attempts did not produce acceptance results; only the final completed measurements/checks are reported. Verification is local synthetic prototype behavior, not real app/production acceptance; formal acceptance remains NOT RUN.

## Checkpoint

Recorded as D-179 / UX section 30. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED.** P04 is Not started. Exact prompt: `docs/runs/Repair-U1-C36-20261024.md`. Source authorities, Portal and unrelated RTG work remain excluded.
