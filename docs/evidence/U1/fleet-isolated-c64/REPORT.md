# U1-C64 Fleet Isolated card repair

28 October 2026. Affected phase P02/P02B under the open U1 checkpoint. Builder outcome: implementation complete; **final 63/63 focused + 68/68 affected C63 browser PASS (131/131)**; fresh independent review pending. U1 NOT APPROVED; P04/P05 Not started. Exact extracted Bootstrap/Master/Repair/request: `docs/runs/Repair-U1-C64-20261028.md`. User decision D-212 permits only the narrow Isolated-card motion exception to C63.

## Request and correction

The attached annotation marks the asymmetric red left strip. Inspected the supplied local image using view_image before work. Reproduced the old rendering in Chrome: left border 3 px, right border 1 px, animation none, no normal-layout Pause. See `before.json` / `before.png`.

Removed that 3 px override. All cards use the existing uniform 1 px boundary. Active Isolated cards animate only background-color, from #fff5f6 to #f6dce1 and back over one 2.5-second ease-in-out cycle. No fading, scaling, text animation, geometry change, decoration or explanatory legend. Existing artwork/status badge/text remain readable. Ready and retired cards and the Table stay static.

The shared Pause / Resume control is compact in normal and TV toolbars, keyboard-operable and uses aria-pressed. Its existing per-session pause state gates card motion and TV page rotation across filter/search/rerender/refresh/navigation. motion=off suppresses motion; reduced-motion CSS disables the pulse. One matchMedia listener observes live preference changes, refreshes the effective control and resets the TV rotation clock without discarding user pause. The existing one-second Fleet timer also reconciles the effective pause class/control only if mismatched, protecting against delayed browser media-query change events without adding a timer or continuously rerendering cards. No status/persistence, fixture, model, CMMS, Portal or job-workflow code changed.

## Actual checks and evidence

Run from `F:\CODEX\EQ_MAINTENANCE`, Node v24.15.0, local Chrome CDP with software WebGL and isolated temporary browser profiles. Existing localhost 5312 preview reused initially. When it later stopped, a hidden Start-Process restart was rejected by tool policy; the direct `node artifacts/prototypes/p02-ui/serve.mjs 5312` tool session started successfully and was left running. No live system or external service involved.

| Command/check | Actual result | Evidence |
| --- | --- | --- |
| `node tools/p02b/check_u1_c64_browser.mjs` | Final 63/63 PASS, exit 0 | `browser-checks.json`; earlier `attempt-2-pass.json`; screenshots/ |
| `node tools/p02b/check_u1_c63_browser.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/fleet-isolated-c64/c63-regression` | 68/68 PASS, exit 0 | `c63-regression/browser-checks.json` |
| `node --check artifacts/prototypes/p02-ui/js/views-fleet.js` | PASS, exit 0 | Final local command output |
| `node --check tools/p02b/check_u1_c64_browser.mjs` | PASS, exit 0 | Final local command output |
| `node --check tools/p02b/check_u1_c63_browser.mjs` | PASS, exit 0 | Final local command output |
| `git diff --check` | PASS, exit 0; only the existing LF-to-CRLF informational notice | Final local command output |
| Parent protected-file check | 114 baseline hashes unchanged, changedFiles [], unrelated drawing status preserved | `protected-check.json` |
| Visual inspection using view_image | PASS for the request image and generated normal/phone/tablet/TV/reduced-motion/light/tint frames listed below | screenshot files |

Focused checks derive card membership/status from the current shared register. They cover 1920x1080 and 1366x768 desktop, 820x1180 tablet, 375x812 and 320x812 phones, 1920x1080 and 1366x768 TV; no horizontal page overflow, unclipped KPIs, 44 px phone Pause and no TV page scroll; stable card geometry/opacity/transform; normal links and read-only TV cards; Ready -> Isolated -> Ready via manual UI with audit retained; static retired Isolated and Table; paused filter/search/refresh/rerender; TV Pause/Resume card/page rotation; motion=off; live reduced motion in normal/TV and user-pause retention; absent CMMS/external traffic and console errors. Actual animation duration, fixed 0/1250/2500 ms Web Animations sampling and an animationiteration event distinguish real motion from screenshot-only evidence. Defined animation phase captures set only currentTime on the real CSS animation, not new keyframes or source state.

The affected C63 assertion retains integration/data/obsolete-control/traffic removal checks while allowing only active Isolated 2.5-second card animation; Ready/retired remain static and effective pause must pause it. The rest of the C63 suite is unchanged and checks four-KPI reconciliation, retired exclusion, Table, removed Daily/Admin links, three crane tabs, keyboard/default behavior, 15 Flat/3D comparisons, manual status reload/audit/role restrictions, registration and retained EQ/FAC routes. No unaffected full persistence or model suites were rerun for this presentation-only repair.

Earlier attempts are disclosed: focused attempt 1 passed 35 checks and failed a wall-clock animation-sampling assertion, retained as `attempt-1.json`; the same runtime then passed the full 55-check suite, `attempt-2-pass.json`. The timing test was improved to observe an actual 2.5-second animationiteration at startup plus fixed-phase keyframes, avoiding a fragile sample across the app's 60-second refresh rerender. One C63 concurrent run stopped at 6 passing checks with an unsettled CDP top-level await; `c63-attempt-1.json` records only those six, not a completed pass. Its sequential rerun passed 68/68. Two later focused startup attempts performed zero assertions because the 5312 listener had stopped (ReferenceError EQ undefined, then readiness timeout); `attempt-3-startup.json` records the zero-check attempt. The successful preview restart enabled the final run. No failed attempt is counted as a completed passing suite.

The next focused attempt passed the real 2.5-second animationiteration and 44 further checks but failed live reduced-motion TV control reconciliation (`attempt-4-media.json`: 45/46). This was investigated as a real state-delivery issue: the emulated preference immediately updated CSS and matchMedia.matches, stopping card motion/page rotation, while the browser delayed delivery of the MediaQueryList change event. `media-delivery-probe.json` and `media-settle-probe.json` show the normal control taking 625 ms in one probe and a TV control staying stale beyond 3 seconds. The correction uses the existing one-second timer to reconcile only a mismatched motion class/control; user pause remains authoritative. The harness now waits up to 3 seconds for that actual asynchronous reconciliation, still checking the resulting animation/control state; it does not bypass or force the listener. The 150 ms fixed wait was too short, and relying only on that delayed listener could leave visible control state stale. Final reruns cover this correction.

The final 63/63 run also deliberately suppresses the media-query change listener in a fresh browser document while retaining native CSS and matchMedia.matches. The existing one-second timer reconciles on its next tick in normal and all TV layouts, before the multi-page-only guard. Measured event-suppressed settling: 850 ms normal (search focus retained), 600 ms multi-page TV and 621 ms single-page TV (Exit focus retained). Resuming motion resets lastFlip; the measured flip ages were 418/279/155 ms respectively, preventing an immediate overdue rotation. A separate assertion proves explicit user pause survives the suppressed-event reduced-motion round trip. This is a nominal one-second reconciliation bound subject to browser timer scheduling, not a hard real-time guarantee. CSS motion suppression and the page-rotation predicate read the preference immediately.

The initial wall-clock assertion's exact failure cause was not captured; it is not asserted to be a product restart defect. The final real animationiteration proof records elapsedTime=2.5, the same connected element, increasing animation time, unchanged dimensions, opacity 1 and transform none. The final affected C63 suite was rerun after the timer correction and passed 68/68 with exit 0. Both final Chrome sessions closed cleanly; the preview server remains in direct tool session 96665.

Inspected with view_image: supplied request image; `screenshots/fleet-1366.png`, `fleet-375.png`, `fleet-320.png`, `fleet-820.png`, `fleet-1920-tv.png`, `fleet-1366-tv.png`, `pulse-light.png`, `pulse-tint.png`, `reduced-motion.png`. Long phone screenshots use the CDP driver's 4000 px capture limit; automated population/layout checks cover the entire current DOM beyond that crop. TV screenshots show individual measured pages; they do not claim all equipment fits on one page. Text and Isolated badges remain visible at both pulse extremes, uniform borders have no left stripe, and toolbar controls fit the reviewed layouts.

## Affected acceptance mapping

| Acceptance/requirement | C64 result and boundary |
| --- | --- |
| U1-C64 / D-212, S02 | Uniform card boundary and active-Isolated-only complete 2.5 s cycle; focused browser evidence. |
| AM03 / S02/S20 | Later explicit request supersedes only the blanket no-card-motion clause. Scoped pulse, static Ready/retired/Table and retained FAC reduced motion checked; CMMS remains removed. |
| AM02 / S20 | No integration object/state/controls or external CMMS traffic; focused and affected C63 browser checks. |
| AM05/AM06 / S03/S21 | Existing manual UI transition starts/stops pulse and records history; C63 reload/refresh/role checks retained. Persistence implementation unchanged. |
| AM10 / S02/S03 | Shared-register population and retained KPI reconciliation/filtering/retired exclusion in affected C63 suite. |
| AM11 / S02/S16 | Desktop/tablet/phone/TV layout, compact control/touch, reduced motion, live changes, paused rotation and read-only TV evidence. |
| Remaining 97-case formal ledger | C63 applicability review remains historical; no new all-case formal acceptance claim. Real working-app/server/SQL/Portal/file/IIS/production cases NOT RUN. |

## Files, runtime and next step

Builder changes: `artifacts/prototypes/p02-ui/css/eq-fleet.css`, `artifacts/prototypes/p02-ui/js/views-fleet.js`, `tools/p02b/check_u1_c64_browser.mjs`, `tools/p02b/check_u1_c63_browser.mjs`; current `docs/HANDOVER.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/UX_SPEC.md` section 57 and `docs/MANAGEMENT_FEEDBACK.md`; this evidence folder. Parent separately owns the current AGENTS/CLAUDE/DECISIONS/regression README and review records. Original drawing deletions/untracked Drawings and manuals folder are preserved, unstaged. No protected documents/, drawings, status persistence, model asset or unrelated runtime edit.

Recommended profile: Repair Codex gpt-6.1-sol/high or Claude claude-opus-5-5/high. Runtime record: client **Codex subagent eq-build-opus-high**, model **Codex-opus-5-5**, effort **high (per agent definition)**, no fallback/escalation. Branch main; starting HEAD `e3f8445a58ba1217078109007a40089178d2bc79`. Builder performs no commit/push and issues no independent R verdict. No business question blocks repair. Next is fresh independent R02B recheck, then U1 walkthrough/required wrapper cleanup TD07-TD08 before explicit U1 approval. P04/P05 remain Not started.
