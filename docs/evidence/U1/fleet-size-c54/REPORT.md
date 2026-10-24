# U1-C54 fleet quantity update - 24 October 2026

User-confirmed quantities: **14 QCs, 46 RTGs, 7 ES units; 67 total**. Requirement coverage: S01, S02, S03, S08, S10, S20/S21 selector coverage, S29 shared-job export regression. Local prototype only.

The single fixture register now generates missing members and orders them by type/code. Fifty rows were added to the old 17-row fixture; RTG-DEMO-07 changed from the retired example to active/Unreported, giving 67 active members. All 51 newly active members have no invented reported status, model, confirmed positions, commissioning dates, history or ZMMS mappings. Existing IDs, positions and 20 demonstration jobs remain. Prototype codes stay explicit; user-confirmed counts do not establish real identifiers/models/condition and do not cap later registration.

All runtime consumers already derive their populations from that register: Fleet total/type/status KPIs, cards/table/search/type filters, measured TV pages, Admin, EQ status, all four Jobs equipment filters, job creation/shared type scopes/exports, and Admin ZMMS mapping choices. These consumers required no separate hardcoded count change. Spare-part choices retain their confirmed-position prerequisite. FAC remains at 114 jobs.

## Verification

| Command / check | Result |
| --- | --- |
| `node tools/p02b/check_u1_c54.mjs` | 37/37 focused VM/browser checks, zero browser errors; `checks.json` |
| `node tools/p02b/check_u1_c51.mjs docs/evidence/U1/fleet-size-c54/fleet-job-model-regression.json` | 41/41 existing shared-job rules |
| `node tools/p02b/check_u1_c51_browser.mjs http://127.0.0.1:5312/ docs/evidence/U1/fleet-size-c54/fleet-job-browser-regression` | 20/20 existing shared-job browser checks, no browser errors |
| `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/fleet-size-c54/r02b-regression.json` | 10/10 current-state DTO/FAC KPI regressions |
| `node --check` on the changed fixture and all three changed/new test scripts; `git diff --check` | Pass; existing Git LF/CRLF notices only |

Focused checks cover exact active populations/codes/uniqueness, unknown-value preservation, existing job/position identity, reconciled status counts, each type's shared job on every member exactly once and export once, reset/FAC preservation, dashboard/table/Admin, all four Jobs filters, full status board, type-filtered job choices, creating work on ES-DEMO-07, mapping choices, last-member detail fallbacks, read-only Management and phone search. TV checks cover every member exactly once by its assigned page and verify page fit/no scrolling at both 1920x1080 and 1366x768. Screenshots: `fleet-1920.png`, `fleet-tv-1920.png`, `fleet-tv-1366.png`, `fleet-phone.png`; visually inspected. Snapshot status totals: 7 Ready, 3 Breakdown, 3 Maintenance, 54 Unreported = 67; these are synthetic review states.

During check development, corrected three test assumptions: the fixture holds 20 jobs including cancellation (19 visible cards), Fleet table is split across type groups, and new-job creation requires explicit Kind selection. The final focused run passes. Existing `check_prototype.mjs` now sets up retirement explicitly for its retired-status refusal scenario; `check_u1_r8.mjs` expects 14 QCs. Those historical full browser suites were not rerun.

## Files and boundary

- Runtime: `artifacts/prototypes/p02-ui/js/fixtures.js`.
- Verification: new `tools/p02b/check_u1_c54.mjs`, adjusted `tools/p02/check_prototype.mjs` and `tools/p02b/check_u1_r8.mjs`, this evidence folder.
- Project records: `docs/DECISIONS.md` (B-21/D-198/U-07), `docs/DATA_CONTRACT.md` section 12, `docs/UX_SPEC.md` section 48/review prompt, `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`, prototype `README.md`, `docs/runs/Repair-U1-C54-20261024.md`.

Direct Codex U1 refinement, no delegated phase/independent R verdict; actual runtime model/effort not independently recorded. Branch `main`, starting HEAD `7f7b40e`, changes uncommitted. Existing pending EQ/FAC/RTG changes preserved. Protected sources, Portal, live IIS, shared/production SQL and ZMMS were not changed/contacted. Local in-memory simulated-role/browser verification only; no production authentication, database persistence, live mapping or deployment acceptance. **U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED; P04 Not started.**
