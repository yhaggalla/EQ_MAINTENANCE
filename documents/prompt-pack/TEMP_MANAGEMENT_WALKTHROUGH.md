# Temporary management walkthrough before U1 approval

Pack 2.2 | 24 October 2026 | U1-T01 | SOW V2 revision 6 section 2A | B-22/B-23, D-203/D-204

Status: **REQUIREMENTS DOCUMENTED; BUILD NOT STARTED; TD01-TD08 NOT RUN.** U1 remains IN PROGRESS / NOT APPROVED; P04 and P05 remain Not started. This document supplies two bounded tasks: build the temporary presentation, then remove it before U1 approval. It adds no permanent phase or production authentication exception.

## Purpose and baseline

Management needs to see the local journey: `http://127.0.0.1:5312/` -> Portal-style login -> Portal-style launcher -> EQ & FAC Maintenance -> existing EQ/FAC prototype. All work stays in the EQ workspace and uses synthetic prototype data.

The initial reference app is commit **8303f8b8a55f41983bdcc77363ddbf13d2892383**, `Checkpoint U1 EQ/FAC refinements through C58`, committed on 24 October 2026. Its initial persona is EQ Team (`eqTeam` in `js/store.js`); a fresh default entry lands on EQ Fleet. Preserve its existing persona controls and landing behaviour after entry. Calling this a management walkthrough does not change the default persona to Management or grant real rights.

The Portal is a read-only appearance reference: `F:\CODEX\CICT-ENG_MAIN_PAGE`, observed at commit `47f7bd9d8296fda56114d8239e10ae9ad7850460`, clean on 24 October 2026. Inspect `src/portal-web/src/App.tsx` (`LoginPage`, `LauncherPage`, `PortalLayout`), `src/portal-web/src/styles.css`, local branding assets and icons. Recheck reference source state when implementing and record any drift. Reuse its actual design; do not invent a different login or launcher. No real identity, registry, session, provisioning or app API is needed.

## Management feedback and the app submitted to U1

Record management requests in `docs/MANAGEMENT_FEEDBACK.md`. For EQ/FAC requests, capture the ID, affected screen/workflow, required outcome and acceptance criteria. The user decides Accepted for U1, Deferred or Rejected; an unconfirmed request remains Pending decision. Management's request or a successful presentation does not constitute user U1 approval.

Accepted EQ/FAC changes are normal U1 refinements. Link each to the next available U1-C change ID and DECISIONS entry; update affected scope/UX/data/API requirements and prompt-pack instructions where the requirement changes. Implement and verify the prototype change using the existing U1/Repair process, then show it again. Keep application changes and temporary-wrapper edits in separate patches/checkpoints. Changes needing real persistence, identity, integration or production work remain requirements for the appropriate gated phases; record and obtain acceptance of scope additions before implementing them.

Login-screen and Portal feedback, including their cards/layout, accounts, roles and real authentication, is deferred to P05 actual Portal integration and relevant later work/review. Log the feedback and desired outcome now; do not build those improvements into the temporary presentation. Fixing a defect that prevents its already-specified login -> launcher -> app path is allowed without adding Portal scope.

The U1 target is the initial committed app **plus all accepted EQ/FAC refinements**, with the temporary wrapper removed. Cleanup must not roll back those refinements, even if they share a file with temporary wiring. If there are no accepted app changes, runtime should match the initial commit; otherwise, every remaining difference must be traceable to an accepted U1 change and evidence. Before approval, resolve or explicitly defer remaining requests and record the exact cleaned commit/tree being reviewed. Deferred Portal feedback does not block U1.

## Temporary requirements

| ID | Required behaviour |
| --- | --- |
| TEMP01 | A fresh visit to `http://127.0.0.1:5312/` shows the existing ENG Portal login design, using local branding/layout/styles and the same visible username/password fields and sign-in control. |
| TEMP02 | Clicking login/sign-in always proceeds to the launcher with empty fields, a single filled field or arbitrary text. Remove required/pattern/length/custom-validation blockers from this temporary form. No credential configuration, verification, network request, storage or logging. |
| TEMP03 | The launcher matches the current Portal screen and displays all three existing app cards: UMMS / Urgent Materials Monitor, PayPrep Assistant, Safety Inspection & Rectification Tracker. They are visual placeholders; clicks must not navigate to or contact the live apps. |
| TEMP04 | A fourth card, EQ & FAC Maintenance, uses the same card style and opens the existing prototype default screen (EQ Fleet for the unchanged fresh default EQ Team persona). The wrapper preserves existing EQ/FAC behaviour; accepted EQ/FAC refinements are separate U1 changes and remain after cleanup. |
| TEMP05 | No Portal administration, account/user creation, role assignment, password management, provisioning, real authentication or other Portal feature. Do not edit the Portal repository or connect UMMS, PayPrep, Safety, SQL or ZMMS. Retain the localhost-only server binding. |
| TEMP06 | Remove the entire temporary layer before recording U1 approval. Preserve accepted EQ/FAC refinements and direct EQ/FAC entry; remove only temporary files, copied assets, state, flags and server/launch hooks. Keep historical docs/evidence. The eligible U1 app is the initial baseline plus accepted app refinements, without the wrapper. |

The new login is a presentation transition and establishes no authenticated session. Retain the existing prototype's synthetic-data context. Any extra notice needed to avoid implying real authentication should be short and must not change the Portal layout. Presentation-only cards may be non-navigating controls with an accessible placeholder explanation; no other app launch is required.

## Isolation and removal record

Before the first temporary runtime edit, create `docs/evidence/U1/temp-management-walkthrough/BASELINE.json` with the baseline commit above, current worktree state, and the complete list of runtime files to be changed or added. For baseline files record their Git blob IDs and SHA-256 values; for additions mark them temporary. Include entry HTML, scripts, CSS, copied assets, launch/server configuration and any storage key that the implementation introduces. Record additional touched files before changing them. Also retain the precise temporary patch per touched file and list accepted EQ/FAC patches/change IDs separately; file hashes alone cannot distinguish mixed edits. Keep the temporary layer in a dedicated directory where practical and minimize entrypoint changes.

If current runtime files differ from the initial baseline, preserve them and reconcile each difference with accepted U1 changes. Unexplained or conflicting edits must be resolved without overwriting them. Do not reset/clean the repository or delete unrelated work. Undo only the manifest-listed temporary patch hunks; a whole-file checkout from the initial commit is prohibited when it would discard an accepted EQ/FAC change. Preserve shared assets required by the accepted app; remove only assets owned solely by the temporary wrapper.

At removal, compare the cleaned app with the initial commit plus the accepted EQ/FAC change register, covering tracked runtime paths in `artifacts/prototypes/p02-ui/` and `artifacts/prototypes/p03-qc-model/` (excluding README/documentation updates). Classify every remaining difference as an accepted U1 refinement and link its verification; exact initial-commit equality is required only where no accepted app change applies. Also compare any runtime/model/server/launch paths outside those directories touched by this task. Check for added files, copied assets, temporary imports, routes, bypass/feature flags and storage keys. A disabled flag is not removal. Delete only state owned by the temporary layer. Store the final diff/hash comparison, direct-entry browser results and cleanup report in the evidence directory. The changed SOW, prompt-pack and historical records are intentionally retained.

## Temporary verification cases

These eight cases are separate from the 94 permanent stage 1 acceptance cases. All are **NOT RUN** until implemented and verified. Record method, viewport, actual outcome, console/network results, date and evidence path per case. TD01-TD06 verify the demonstration build; TD07-TD08 verify removal and the U1 gate.

| Case | Requirements | Required check | Status |
| --- | --- | --- | --- |
| TD01 | TEMP01 | Open the root URL in a fresh browser context. Compare the login against rendered local Portal source/reference at 1920x1080 and 1366x768; check a 375px phone view for usable fields and no page overflow. | NOT RUN |
| TD02 | TEMP02 | Independently submit both fields blank, username only, password only, and arbitrary values (including text outside real login constraints). Each proceeds; no browser/custom validity blocker, credential request, credential storage or logged values. | NOT RUN |
| TD03 | TEMP03 | Visually compare the launcher with the existing Portal. Exactly four app cards appear: UMMS, PayPrep, Safety and EQ & FAC Maintenance; retain current labels/branding and card styling. | NOT RUN |
| TD04 | TEMP03/TEMP05 | Click each existing-app card and inspect navigation/network activity: it stays within the presentation and never contacts a working app. Portal administration/user/password/role/provisioning features are absent or inactive and make no requests. | NOT RUN |
| TD05 | TEMP04 | Click EQ & FAC Maintenance. Confirm fresh-default EQ Fleet, unchanged default persona, then browse EQ Jobs, equipment Flat/3D, FAC Dashboard/TV and FAC Jobs; use the existing prototype controls for permitted work. No app workflow or synthetic-permission regression. | NOT RUN |
| TD06 | TEMP01-TEMP05 | Repeat the fresh root -> blank login -> four cards -> EQ/FAC path. Check keyboard entry/focus, console/network errors, local assets and localhost-only serving. Record Portal repository status unchanged and no external service connection. | NOT RUN |
| TD07 | TEMP06 | After the presentation, remove all manifest-listed temporary files/assets/hooks/state. Compare runtime against the initial baseline plus accepted EQ/FAC changes; prove no temporary route, bypass, dormant flag or wrapper-owned file/asset remains. Verify all accepted refinements survive, including mixed-file edits; preserve unrelated work and history. | NOT RUN |
| TD08 | TEMP06 | Start a fresh browser context after cleanup. Root URL opens the cleaned EQ/FAC default directly, with no login or launcher; repeat affected EQ/FAC/viewer checks and accepted-change acceptance criteria. Record the exact cleaned commit/tree, accepted change IDs and cleanup evidence in DECISIONS/HANDOVER before requesting or recording explicit U1 approval. | NOT RUN |

TD01-TD06 passing does not approve U1. TD07 and TD08 must pass before an approval is recorded. If the user asks to approve while the layer is present, first complete its already-required removal and verification, then record approval against the cleaned app including accepted EQ/FAC refinements. Do not interpret this document request or a successful management presentation as approval.

## Build task prompt

Use Bootstrap and Master control from the main prompt pack plus the existing Repair profile for the affected P02/P02B prototype. No new `/eq-phase next` slot is added. In an orchestrated phase run, follow its existing delegation/profile rules; these recommendations do not select a runtime model. Read this entire document and the current ledger/decisions/handover first.

```text
Implement U1-T01 BUILD only: the temporary management walkthrough defined in
documents/prompt-pack/TEMP_MANAGEMENT_WALKTHROUGH.md and SOW V2 section 2A.
Record initial baseline 8303f8b8a55f41983bdcc77363ddbf13d2892383 and create the touched-file
manifest before runtime edits. Inspect current Git state and preserve unrelated work.
Use the existing Portal source read-only for its login and launcher appearance.
At 127.0.0.1:5312 show login, then the four-card Portal, then the unchanged EQ/FAC
default screen. Blank/arbitrary inputs proceed without credential checks or requests.
UMMS/PayPrep/Safety cards are placeholders. No other Portal features or integration.
Keep all new assets/wiring local, isolated and fully removable; preserve the app.
Run TD01-TD06 with browser/network/visual evidence and affected prototype checks.
Record actual results, changed-file manifest, source state and remaining removal task.
Stop after this temporary build. Do not approve U1 or start P04/P05.
```

## Removal task prompt

Use the same affected-prototype Repair profile and current project records. Removal is mandatory before U1 approval and does not need another authorization for the already-specified cleanup.

```text
Execute U1-T01 REMOVE only. Read the temporary walkthrough specification and its
BASELINE.json/touched-file manifest. Preserve all unrelated work and documentation.
Remove the temporary login, launcher, four-card wiring, copied assets, storage keys,
flags and server/launch hooks. Undo only temporary patch hunks; retain every accepted
EQ/FAC refinement and any shared asset it needs. Never reset/clean the repository
or restore whole files from 8303f8b8a55f41983bdcc77363ddbf13d2892383 over accepted app edits.
Reconcile the cleaned app with that initial commit plus accepted U1 changes; run TD07
and TD08 with fresh-context direct-entry and affected EQ/FAC/viewer verification.
Keep evidence/history and update ledger, decisions and handover truthfully.
Only explicit user U1 approval against the cleaned app plus accepted refinements closes U1. P04 remains
gated until that approval is recorded. Do not implement any production phase.
```
