# P02 evidence: interface prototype

Date: 21 October 2026. Evidence type: **automated checks of a static prototype in a real browser, visual review of screenshots, and scripted contrast calculation**. This is not production, not a database-backed application and not authenticated; no acceptance case in `ACCEPTANCE_CHECKLIST.md` changes status (all remain NOT RUN).

## 1 Deliverables

| Item | Location |
| --- | --- |
| Runnable prototype (no build step, no dependencies, no CDN) | `artifacts/prototypes/p02-ui/` (`index.html`, `css/`, `js/`, `serve.mjs`, `README.md`) |
| UX specification | `docs/UX_SPEC.md` |
| Screenshots, 70 files | `docs/evidence/P02/screenshots/{d1920,d1366,tablet,phone}/` |
| Automated browser checks, 50 | `docs/evidence/P02/automated-checks.json` (script `tools/p02/check_prototype.mjs`) |
| Contrast report, 37 pairs | `docs/evidence/P02/contrast-report.json` (script `tools/p02/check_contrast.py`) |
| Real-data generator | `tools/p02/build_catalog.py` (writes `js/catalog.js`, `js/params.js` from the reference JSON, with the Master-control invariants asserted) |
| Support scripts | `tools/p02/cdp.mjs` (DevTools driver), `tools/p02/capture.mjs` (screenshots) |

## 2 Environment

Chrome 155.0.8059.85 headless (DevTools protocol), Windows 11, Node 24.15.0, Python 3.12.1, prototype served by `serve.mjs` on `127.0.0.1:5312`. Time zone for display is Asia/Colombo through `Intl`. Viewports tested: 1920x1080, 1366x768, 1024x768, 768x1024, 390x844 (mobile emulation). No real GPU or recorded reference PC; no performance claim is made (the placeholder has no canvas).

## 3 Automated checks (all 50 PASS at the last run)

| IDs | What was checked | Result |
| --- | --- | --- |
| C01 x3 | 18 routes as Admin, EQ Team and Management: no console errors, every control and link has an accessible name, no duplicate ids, one `h1`, **zero canvases** | PASS |
| C02-C04 | Fleet counts reconcile with cards for every status filter (active 16: ready 7, breakdown 3, maintenance 3, unreported 3; 17 with retired); Unreported has no duration and is not counted Ready; every badge has icon and text | PASS |
| C05-C07 | Tree, breadcrumb, URL and scene share one selection (main via tree, part via scene); back/forward restore it; a sub selection highlights exactly its bound positions | PASS |
| C08-C11 | Same template, two QCs: motor A history separate (QC-DEMO-01 SYN-0001 only; QC-DEMO-02 SYN-0009 and SYN-0017; same key, different position IDs); scope rules (descendants de-duplicated, equipment-level job not repeated, exact part scope); No work recorded / Installed item unknown wording; late history responses discarded (log shows DISCARDED) | PASS |
| C12-C16 | Management has no write controls and a persistent read-only chip; simulated server refuses 9 Management writes (403) and 6 Admin-only writes for EQ Team (403); Admin screens return a 403 explanation to other roles; cancel rules (own only, Admin any, completed never, reopened protected); cancelled jobs hidden and shown with reason and actor | PASS |
| C17-C23 | Completion through the dialog commits once, equipment stays Maintenance, a retry with the same key replays without duplicating; validation summary linked and focused; atomic: a valid plus an invalid line commits nothing; out-of-order date, serialized quantity, foreign-equipment line and future date refused; lot quantity "2 rope" kept; status rules (reason, same status, foreign job, retired); 409 conflict with the user's edit preserved; dirty-form guard; no EAM/Maximo field | PASS |
| C24-C26 | Skip link is the first Tab stop; tree keyboard (Down, Right, Enter); five dialogs (add job, complete, edit, cancel, status) keep focus inside across 40 Tab presses and all six dialogs including register equipment have no unlabelled control; two-tone focus ring present on nav links, buttons, inputs, chips, tabs and tree items | PASS |
| C27-C33 | Viewer states (no WebGL, context lost, load failed, loading): message shown, tree, history and Add job still work, no canvas; RTG/ES say 3D not available, QC without verified model shows no scene; machinery house is a container selecting nothing; Fit/Reset change the viewBox, thin rope gets the minimum extent; reduced motion makes the fit instant, a newer selection supersedes a running one; Overall hides internals, Technical shows them, legend separates paint from status; work markers switch off | PASS |
| C34-C39 | Catalogue 16/43/41, 048/063 inactive and unusable, no main 10, 061 Spreader (original label "lp"), 062 Headblock; applicability edit raises revision only; duplicate equipment code refused, new equipment Unreported/unassigned, retire refused with open jobs, draft positions untargetable until confirmed; both gantry-speed values and both trolley-motor values visible, total lift marked not overall height, resolution keeps observations; resolution Admin-only with reason; bindings preview rules | PASS |
| C40-C42 | Stale/error/empty/loading on fleet, equipment and jobs; banner on every page, nothing in browser storage, reload restores fixtures; every equipment code is a `-DEMO-` fixture marked DevelopmentFixture | PASS |
| C43 x5, C44 | No horizontal overflow at five sizes on fleet, equipment, jobs, admin, RTG; panels inline at 1920 (model area 904 px) and 1366 (616 px), drawers at 1024, 768 and 390 with Escape and focus return; phone shows one card column and full-screen dialogs | PASS |

Limits of these checks: they test the prototype's simulated rules and DOM, not the production API, database, token validation or WebGL viewer. Focus order was verified for the skip link, tree, dialogs and ring styling, not with a screen reader. Screen-reader announcements (live regions, tree semantics) were reviewed in markup only.

## 4 Contrast

`python -I tools/p02/check_contrast.py`: 37 declared colour pairs, 0 below threshold (text at least 4.5:1; focus ring inner line, selection outline and input borders at least 3:1). Two defects were found and fixed during the phase: the Portal's single gold focus ring is 2.4:1 on white, so the prototype uses a two-tone ring; and the form border token was 2.2:1, now 3.9:1. The calculation uses CSS tokens, not rendered pixels.

## 5 Screenshot index

Naming `NN-name.png`. Full-page captures except equipment and dialog scenes (viewport size).

| NN | Scene | Sizes |
| --- | --- | --- |
| 01-02 | Fleet as EQ Team and as Management (read-only) | 1920, 1366, tablet, phone (01) |
| 03 | Fleet filtered to QC + Maintenance | 1920 |
| 04-07 | Fleet stale, empty (Admin), loading, error | 1920 |
| 08-09 | QC overview and main-hoist selection | 1920; 08 also 1366, tablet, phone |
| 10 | QC motor A, Technical mode (also tablet drawers a/b/c, phone) | 1920, 1366, tablet, phone |
| 11 | QC-DEMO-02 same motor, different history | 1920 |
| 12-14 | Technical panel with parameters (Management), machinery-house container, Management read-only equipment | 1920 (12, 14 also 1366) |
| 15-16 | Viewer fallbacks: no WebGL, model request failed | 1920 |
| 17-19 | QC without verified model, QC with draft positions (Admin), Unreported equipment | 1920 (17 also phone) |
| 20-21 | RTG and ES detail with the stage-1 3D-unavailable state | 1920 (20 also 1366) |
| 22-25 | Jobs board (EQ Team), Management read-only, include cancelled, job record with an Admin correction | 1920 (22 also 1366, tablet, phone) |
| 26-30 | Dialogs: add job invalid, complete replacement, complete invalid, version conflict, status reason required | 1920 (27, 28 also 1366; 26, 27 phone; 27 tablet) |
| 31 | Cancel unavailable with the visible reason (other creator) | 1920 |
| 32-38 | Admin equipment, models/applicability, catalogue, positions (draft), specifications (conflicts), bindings, 403 for EQ Team | 1920 (32 tablet; 33, 35 1366) |
| 39 | Prototype controls panel | 1920 |
| 40-41 | Visible keyboard focus: tree item, form field | 1920 (40 also 1366) |

## 6 Problems found and fixed during the phase

Placeholder labels scaled with zoom (now constant pixel size); status overlay covered the crane (moved out of the geometry); stair outline used the wrong axis; version-conflict, dialog Escape and focus-trap behaviour depended on browser heuristics (explicit handling added); duplicate element id between the jobs filter and the job form; fleet mini-badges had no text alternative; first page load stole focus from the skip link; 1366x768 first screen was too tall (compact header, shorter control labels).

## 7 What is still synthetic or unproven

All fleet data, positions, jobs, history, users and rules are fixtures. The model area is a labelled SVG placeholder with illustrative vertical proportions; the P03 model, picking, raycasting, performance budgets and WebGL context handling are not exercised. No persistence, authentication, CSRF, protected files, concurrency against a database or real polling exists. The actual fleet size is unknown (U-07), so density at 1366x768 is shown with 16 synthetic active items only. Screen-reader behaviour and real tablet touch input were not tested on devices.
