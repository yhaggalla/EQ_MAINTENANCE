# U1-T01 BUILD - temporary management walkthrough

24 October 2026 | **BUILD COMPLETE** | TEMP01-TEMP05 implemented; TEMP06 removal pending.

A fresh `http://127.0.0.1:5312/` shows the ENG Portal login design. Sign in accepts blank fields, either field alone or arbitrary input without reading/checking values. The form resets and is discarded, then the launcher shows UMMS, PayPrep, Safety and EQ & FAC Maintenance. The existing three cards are inert accessible placeholders. EQ/FAC opens unchanged `/index.html`, retaining its EQ Team / EQ Fleet fresh default, last permitted route and persona controls. Explicit existing EQ/FAC/legacy hashes forward to that document, preserving saved P03 links; the plain fresh root starts login.

No Portal administration, account/role/password management, provisioning, session, credential API, SQL or ZMMS connection was added. Theme and password visibility are local presentation controls. No storage keys, cookies or flags were introduced. The fixed launcher identity is presentation text; entered values never become a displayed identity.

## Runtime record

| Item | Record |
| --- | --- |
| Recommended profile | Affected P02/P02B Repair: Codex gpt-6.1-sol/high; Claude Code claude-opus-5-5/high |
| Client | Codex subagent eq-build-opus-high |
| Model / effort | Codex-opus-5-5; high (per agent definition), not independently inspected |
| Fallback / escalation | None |
| Initial app / starting Git | `main`, `8303f8b8a55f41983bdcc77363ddbf13d2892383` |
| Portal reference | `47f7bd9d8296fda56114d8239e10ae9ad7850460`, clean before/after |
| IDs | TEMP01-TEMP06; TD01-TD08; B-22/B-23, D-203/D-204/D-205 |
| Verification | Local synthetic prototype, headless Chrome/CDP, software WebGL, static source-rendered Portal reference |

## Source fidelity

Read applicable AGENTS/phase/UI-UX instructions, Bootstrap authorities, temporary specification, current records and Git state before runtime edits. Existing dirty SOW/prompt-pack/project-record revisions were preserved. This BUILD changed no source document, drawing or Portal file.

The appearance reference uses exact return JSX from Portal `LoginPage`, `LauncherPage`, `PortalLayout`, `PortalIcon` and branding, rendered with the Portal's installed ReactDOMServer and safe fixed fixtures. Original stylesheet, logo and background were copied unchanged. Reference rendering did not execute AuthProvider, effects, API imports or a backend. Registry labels came from `IdentityCatalogSeeder.cs`, including Safety Inspection and Rectification Tracker. This is a source-rendered local comparison, not authenticated/live Portal verification.

Login/reference captures at 1920x1080, 1366x768 and 375x812 were inspected. Frame/panel/field/button geometry and styles match exactly at all widths; the short demonstration notice replaces the source's session claim. Launcher captures retain source header/welcome/card/icon/footer styles and responsiveness, adding the fourth card, omitting administration/account actions and replacing real-access claims with presentation explanations. The UI/UX skill's generic palette/fonts were not substituted for the supplied design. Dark login and entered EQ/FAC captures were also inspected.

## Temporary acceptance matrix

| Case | Actual result | Evidence |
| --- | --- | --- |
| TD01 | **PASS**: fresh login; source geometry/style at 1920/1366/375; 44px+ fields, local branding and no horizontal overflow | `checks.json`, `reference-login-*.png`, `login-*.png` |
| TD02 | **PASS**: blank, username only, password only and values beyond real length limits independently proceed; no validation blockers, requests, console values, storage writes or cookies; fields discarded | `checks.json`, `network.json` |
| TD03 | **PASS**: exactly four correct cards; source card styles and desktop/phone visual comparison | `checks.json`, `reference-launcher-*.png`, `launcher-*.png` |
| TD04 | **PASS**: three placeholders stay in presentation with no requests; Portal administration/account/password/role/provisioning actions absent | `checks.json`, `network.json` |
| TD05 | **PASS**: EQ Team/Fleet default, 67 equipment, EQ Jobs/dialog, checked Flat/3D, FAC Dashboard/TV, FAC Jobs using existing FAC Team controls and saved EQ/FAC/P03 links | `checks.json`, entered-app captures and regression reports |
| TD06 | **PASS**: fresh new browser profile repeats blank-login/cards/app with keyboard; focus/labels, theme/reveal, local assets, no browser errors; localhost-only listener; Portal unchanged | `checks.json`, `network.json`, `listener.json`, `source-state.json` |
| TD07 | **NOT RUN**: future REMOVE task; temporary layer intentionally remains | Manifest/patches are removal inputs, not removal evidence |
| TD08 | **NOT RUN**: cleaned-app verification and exact cleaned commit/tree still required | U1 remains unapproved |

TD01-TD06: **62/62 browser assertions passed**. Reverse-patch dry-runs do not satisfy TD07/TD08.

## Commands and results

| Check | Actual result |
| --- | --- |
| `node tools/u1/check_temp_management.mjs` | 62/62 passed; no console/runtime errors; local GET document/asset traffic only |
| `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/temp-management-walkthrough/r02b-regression.json` | 10/10 passed: current-state/history boundary and filtered FAC KPI |
| `node tools/p02b/check_u1_c51.mjs docs/evidence/U1/temp-management-walkthrough/fleet-job-regression.json` | 41/41 passed: shared fleet jobs/identity/rules |
| `node tools/p02b/check_u1_c57.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/temp-management-walkthrough/fac-regression` | 34/34 passed: FAC aggregation/charts/proof/TV/browser |
| `node tools/p02b/check_unified_viewer.mjs http://127.0.0.1:5312/ docs/evidence/U1/temp-management-walkthrough/viewer-regression-final` | 11/11 passed: shared model/panels, selection, Flat/3D, legacy semantic links, phone/keyboard and fallback/lifecycle |
| `node --check` on `serve.mjs`, `temp-management/walkthrough.js`, `tools/u1/check_temp_management.mjs` | All exit 0 |
| Initial-baseline comparison | 49 existing non-document P02/P03 runtime files unchanged in Git-normalized content, excluding patched server; 24 CRLF-only differences separately classified; 0 unexplained differences |
| Portal CSS/logo/background byte comparison | Copied unchanged; hashes in `source-state.json` |
| `git apply --reverse --check` on seven runtime patches and helper patch | 8/8 passed; dry-run only; no removals |
| `Get-NetTCPConnection -LocalPort 5312 -State Listen` | Only `127.0.0.1:5312`, snapshot retained |
| Portal Git status / HEAD | Clean / unchanged `47f7bd9...` |
| `git diff --check` | Exit 0 |

Earlier attempts are retained truthfully. `checks-initial-harness.json` records 56/60: the harness assumed a select instead of the existing radio persona control, inspected focus shadow on the parent instead of the input, and reused normal app last-route storage while asserting a fresh default. Correcting selectors/assertions and using a fresh browser profile required no app edits. Final result is 62/62. The two earlier viewer runs passed 10/11 because the suite appends `qc/` to its base; `/index.html` produced `/index.htmlqc/` and a timeout. The correct root-base run passes 11/11. Temporary explicit-hash forwarding preserves root/P03 bookmarks. Earlier failed attempts were not represented as passing runs.

The first server start encountered EADDRINUSE from an existing workspace P02 process. Its command was verified, then that local prototype was restarted to load the routing. No IIS/external server changed.

Orchestrator staging check: source/document whitespace passes with the stored `patches/**` data excluded. The raw reversible patches intentionally contain unified-diff blank context markers and Git binary-patch separator lines, which `git diff --cached --check` otherwise flags as text whitespace. They are preserved exactly; their reverse-apply dry-run passed 8/8. A targeted secret-marker scan of the new runtime, helper and evidence found no candidate files. The accompanying local checkpoint includes the earlier user-authorized SOW/prompt-pack revisions and this BUILD; no push or phase advancement.

## Changed files and removal

`BASELINE.json` was created before runtime edits, recording initial commit, dirty state, source reference, seven runtime paths, baseline blob/SHA-256, addition ownership, hooks/state and accepted-change register. `TOUCHED_FILES.json` stores post-build hashes/sizes; `patches/` retains precise reversible text/binary patches. No accepted EQ/FAC app refinement was added in this BUILD.

Modified runtime: `artifacts/prototypes/p02-ui/serve.mjs`, root mapping and copied-background JPEG MIME type only.

Added runtime under `artifacts/prototypes/p02-ui/temp-management/`: `index.html`, `walkthrough.js`, `walkthrough.css`, `portal-source.css`, `assets/cict-logo.png`, `assets/cict-umms-background.jpg`. Existing app entry, scripts, CSS, models and P03 source are untouched.

Added supporting helper: `tools/u1/check_temp_management.mjs`, accounted for in the manifest. Updated records: `docs/IMPLEMENTATION_STATUS.md`, `docs/DECISIONS.md`, `docs/HANDOVER.md`, prototype `README.md`. Exact task provenance: `docs/runs/U1-T01-BUILD-20261024.md`. Evidence, including passive source-reference snapshots, stays in this directory. The ignored scratch source-rendering generator is not a launch hook or shipped artifact.

At REMOVE, undo only temporary server hunks and delete the six owned runtime additions and helper. Preserve later accepted EQ/FAC refinements, shared assets, mixed-file edits and all docs/evidence. No wrapper storage exists to delete. Reconcile every remaining runtime difference against accepted U1 changes, record the exact cleaned commit/tree, then run TD07-TD08 before explicit U1 approval. Current reverse-checks do not authorize discarding later changes.

## Remaining work and limits

No business question blocks BUILD. The presentation is ready. Log EQ/FAC management feedback in `docs/MANAGEMENT_FEEDBACK.md`; accepted app refinements remain after cleanup. Login/Portal feedback is deferred to P05.

U1 is **IN PROGRESS / NOT COMPLETE / NOT APPROVED**. P04/P05 remain **Not started**. No independent R verdict is issued. Real authentication/integration, production API/database, live ZMMS, target hardware/environment, IIS/deployment and production acceptance are **NOT RUN**.

Next bounded task after presentation/refinements: **U1-T01 REMOVE**, TD07-TD08, then explicit U1 review/approval. Do not start P04/P05 in this run.
