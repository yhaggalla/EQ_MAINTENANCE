# U1-C63 implementation and verification

28 October 2026 | SOW V2 revision 7 | prompt pack 2.3 | local synthetic U1 prototype

All eight confirmed management changes are implemented and the final independent review is **PASS** with no outstanding actionable findings. **U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED.** P04/P05 have not started. The temporary management login/launcher is retained for this walkthrough; TD07-TD08 removal and cleaned-app verification remain required before explicit U1 approval.

## Result

| Requested change | Implemented result |
| --- | --- |
| App name | EQ & FAC Asset Management in app/title/launcher and current records; stable technical identifiers/routes/roles retained |
| Remove CMMS and routine EQ maintenance | Removed executable module, registrations, sync/mapping/settings/actions/messages, imported daily views/exports and automatic/override paths; zero external requests in browser checks |
| Replace Breakdown | Long term isolated EQ names the current manual Isolated category, with no automatic time threshold |
| Two manual statuses | Only Ready for OPS and Isolated; explicit initialization/change with actor/time/reason/history, validation, concurrency/retry behavior; old event values remain labelled legacy history |
| Crane panel | Spare part status first/default, then Projects/Special and Technical, in shared Flat/3D and phone drawer; Maintenance removed |
| EQ Jobs Daily work | Removed; Projects/Special, EQ status and Spare parts condition remain, with safe obsolete-link fallback |
| EQ status workspace | Manual action, reason/actor/time/duration/history; no sync/source/expiry/Back to automatic; job/date events do not set operational status |
| Fleet strip | Four responsive cards: Active equipment, Ready percentage, Ready count, Long term isolated EQ count. One active type/search population, retired excluded, empty ratio dash; card blinking removed |

The deliberately authored fixture register contains 67 synthetic units with explicit choices (61 Ready, 6 Isolated). These are not observations of the real fleet. Stable equipment, part, job and model associations were preserved. Initial event time is a fixed declared fixture-authoring instant; reload/reset does not rewrite the same event's audit time. Actual manually submitted changes and registrations use their actual command time.

## Manual-state persistence and review repairs

Manual EQ status/registration/retirement is stored only in the current browser. Other work, model changes, spare and FAC records remain in memory. This is not server authentication or production persistence.

Fresh independent review found and verified correction of four issues:

1. Stale tabs overwrote another tab's status/history. Commands now acquire a shared Web Lock, load latest saved manual state, validate current event/revision and merge unrelated work. Stale same-equipment writes conflict. A reset generation prevents old tabs resurrecting discarded snapshots. Actual simultaneous-tab tests cover updates, registration/code collisions and retirement.
2. Failed writes claimed to retain changes but the next restore lost them. Read/write failures now reject with 503 and roll back data/history/audit; retries after recovery produce one event. Failed resets preserve existing records. Browsers without Web Locks intentionally keep edits in-session, show a warning and do not write shared storage.
3. Untouched reload regenerated baseline status time/duration. The authored fixture instant is stable; real submitted changes retain actual timestamps.
4. A rejected-save dialog retained a mutated object and displayed the attempted value as Current. It now resolves live equipment on each render; the truthful current badge/time, entered choice/reason, error and recovery retry are verified through the real UI.

No in-memory model binding is persisted without its associated positions; syncing manual state keeps other local work/model data and monotonic last activity. Legacy status history and current-state payload allowlists/reference isolation remain intact.

## Executed checks

All **342 checks across 11 authored suites passed**. `final-test-summary.json` records their exact evidence paths and counts. Commands ran from the workspace with the bundled Node runtime; browser bases used `http://127.0.0.1:5312/index.html` and separate CDP ports.

| Suite | Result |
| --- | ---: |
| check_u1_c63_model.mjs | 55/55 |
| check_u1_c63_browser.mjs | 68/68 |
| check_u1_c63_tabs.mjs | 20/20 |
| check_u1_c50.mjs | 49/49 |
| check_u1_c51.mjs | 41/41 |
| check_r02b_round2.mjs | 10/10 |
| check_u1_c57.mjs, retained FAC charts/proof | 34/34 |
| check_u1_c35.mjs, selected spare actions/history | 11/11 |
| check_unified_viewer.mjs | 11/11 |
| check_u1_c50_browser.mjs | 23/23 |
| check_u1_c51_browser.mjs | 20/20 |

The original viewer timeout was a test URL joining error (`index.htmlqc/`); the harness now resolves the retained legacy route with URL(base), preserving its semantic-key assertion. C50's job/action expectations now derive from the current register; C51 explicitly selects initial status and uses the returned equipment ID. Prior failing snapshots were not counted as passing results.

The independent fallback reviewer separately reran model55, browser68, tabs18, boundary10, C50-model49 and C51-model41, plus 11 adversarial storage/retained-state checks, five actual FAC motion checks and four failed-dialog/recovery checks. The last two authored tab tests directly cover that independently verified dialog fix, bringing its final authored total to20. Full independent report: `docs/evidence/R02B/review-20261028-U1-C63.md`; preserved evidence/reproductions: `docs/evidence/R02B/u1-c63-independent-recheck/`.

UI verification includes 1920/1366 desktops, 820 tablet, 375/320 phones, 1920/1366 TV, reduced motion, keyboard tab order/defaults, 15 Flat/3D scope/panel comparisons, missing WebGL/model/context recovery, filtered/empty/retired KPIs, saved old links and actual manual forms/reload. Screenshots were inspected by the builder, parent and independent reviewer as recorded. FAC lanes/ticker movement, Pause, reduced-motion paging and phone static combined list were independently exercised. Main browser checks observed zero external runtime requests and zero console errors.

Edited JS/MJS syntax checks passed for 24 files; `git diff --check` passed. Original source/model hash comparison passed for 671 files; pre-existing drawing deletions and the untracked Drawings and manuals folder were preserved. Model geometry was not changed or newly recertified.

## All-case applicability and verification boundary

`ACCEPTANCE_REVIEW.md` and `acceptance-applicability.json` account for all 97 unique active checklist IDs and preserve each requirement/expected action exactly. Every formal working-app status remains **NOT RUN**; prototype assertions do not pass future Portal/server/SQL/file/IIS/performance/release acceptance. ZM01-ZM08 are withdrawn, not skipped implementation blockers. Active-versus-historical runners are documented in `tools/p02b/REGRESSION_README.md`.

No real sign-in, server authorization, SQL transaction, protected file pipeline, production persistence, live equipment assignment, IIS deployment, external CMMS access or production acceptance was executed. No P04/P05 advancement or U1 approval is implied.

## Runtime provenance and handover

Initial build profile: eq-build-opus-high per repository orchestration. That builder and the first designated independent reviewer reached a provider usage limit. The parent continued the necessary repairs directly; a fresh independent default-agent context completed the recheck with inherited runtime settings. Actual fallback model/effort identifiers were not exposed; this report does not claim the unavailable requested Opus reviewer profile.

Open `http://127.0.0.1:5312/index.html?role=eqTeam#/eq/fleet` for direct prototype entry, or the server root for the temporary presentation. If stopped, run `node artifacts/prototypes/p02-ui/serve.mjs 5312` from the workspace. No install/build is needed. Next: U1 walkthrough, temporary-layer removal preserving accepted refinements, cleaned-app TD07-TD08 verification, then explicit user U1 approval. The local checkpoint excludes unrelated drawing/source work; nothing is pushed or deployed by this repair.
