# Stage 1 acceptance checklist

Current scope: revision 7 / pack 2.3 / U1-C63. 97 active permanent cases are specified, NOT RUN against the working app. Implementation awaits confirmation; U1 NOT APPROVED. Prior prototype evidence does not pass new cases.

Version 2.3 | 28 October 2026 | 97 active permanent cases; eight temporary walkthrough cases separate

These are checks for the future implementation, not results from this prompt-pack authoring task. **Every implementation case starts as NOT RUN.** Do not mark a case passed from a design document, a fixture-only screenshot or a supplied test prompt.

During implementation create an evidence table with `case ID`, `status`, `test/manual method`, `environment/database`, `artifact or test name`, `actual result`, `date` and `remaining issue`. Allowed statuses are NOT RUN, PASS, FAIL, BLOCKED and N/A with a concrete reason. A required stage 1 case cannot become N/A merely because it was not implemented.

## Temporary pre-U1 presentation checks

See `TEMP_MANAGEMENT_WALKTHROUGH.md` for TD01-TD08. TD01-TD06 passed against the earlier temporary BUILD; TD07-TD08 cleanup remain NOT RUN. TD01-TD06 cover the local login/launcher presentation and unchanged EQ/FAC entry; TD07-TD08 require complete temporary-layer removal, retention of accepted EQ/FAC refinements since `8303f8b8a55f41983bdcc77363ddbf13d2892383` and direct app entry before U1 approval. These eight checks are not additions to the 97 active permanent cases, do not prove real authentication/Portal integration, and do not waive AUTH cases or P05. The minimum demonstration below remains the later working-app/U2 script.

## Source and classification

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| SRC01 | S05/S10 | Import the approved catalogue into an empty disposable SQL Server database. There are 16 main mechanisms, 43 subcodes, 41 active subcodes and two inactive reserved entries. Codes remain strings with leading zeroes. |
| SRC02 | S05/S10 | Inspect/search the catalogue and create-job selector. Main 10 is absent; 048/063 are inactive; 061 is Spreader and 062 Headblock; original labels/descriptions remain traceable. Reserved entries cannot be used for new targets. |
| SRC03 | S05/S10 | Read both halves of the original table and several continued descriptions, including 011, 031, 061, 081, 151 and 153. Their descriptions and parent codes match the approved JSON; 015/024/033 remain separate. |
| SRC04 | S01/S10 | Configure different applicability for a QC and RTG model. Inapplicable tyre/engine entries do not appear as installed QC systems, while the shared catalogue preserves them for suitable equipment. Unknown applicability is not silently assumed. |
| SRC05 | S14 | Open source parameters and linked drawing pages. Values have units, conditions and source references. 63 m reads Total lift height. Gantry speed retains both 46 and 45.5 m/min observations until an audited technical resolution. |
| SRC06 | S01/S14 | Create a new QC with no verified model association and inspect reference imports. It receives no invented family, current status, serial, service date or public-website fleet facts. The J526A template is not assigned to every QC automatically. |

## Authentication and permissions

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| AUTH01 | S15 | From the local same-origin Portal, sign in as a synthetic user with an EQ role and open its registry tile. EQ opens without another password; a valid direct /eq-maintenance equipment URL also restores the intended route. |
| AUTH02 | S11/S15 | Sign in without EQ access, with a wrong audience and without authentication. App data/files are denied by the server with the appropriate 401/403 behaviour. A visible route or manually added tile cannot grant access. |
| AUTH03 | S09/S10/S11 | Management attempts direct API writes for status, job creation/completion, attachments, FAC progress and Admin configuration. All fail. EQ Team succeeds for EQ work/status and fails for catalogue changes, completed-work correction and FAC writes. FAC Team succeeds for FAC progress and fails for EQ writes. Admin succeeds only within its app authority. |
| AUTH04 | S15 | Provision/retry/update/deactivate the same subject through the central convergence contract. Exactly one local profile persists, stale revisions cannot override current state and no display-name matching or browser-defined binding grants access. |
| AUTH05 | S15 | Test expired session, refresh, must-change-password, logout and unsafe/external return URLs. Current Portal behaviour is preserved, users see actionable state and no credentials/tokens enter browser storage or logs. |
| AUTH06 | S13/S15 | Attempt unsafe requests with missing/bad CSRF or cross-origin context. The current Portal security contract is enforced without a Development runtime bypass. Test auth exists only inside automated test hosts. |
| AUTH07 | S15/S17 | Validate the new shared token against the actual intended versions of Portal/UMMS/PayPrep/Safety consumers, including old consumers. Document the matrix and any required upgrade sequence. No new audience/role is enabled in an incompatible rollout and strict validation is preserved. |

## Register and Admin

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| ADM01 | S01/S03/S10 | Admin creates/edits QC/RTG/ES with distinct codes/model assignments and explicit initial Ready for OPS or Isolated. Reject duplicate codes, omitted/invalid/old status without partial writes. Current value/first audit event persist after reload/restart; no inferred Ready or Unreported. |
| ADM02 | S05/S10/S12 | Instantiate two QCs from one template. Their motors/ropes/wheels have distinct equipment-specific position IDs. Changing a template or a mesh label does not recreate positions or transfer existing history. |
| ADM03 | S05/S10 | Submit another equipment's main/sub/part ID or an invalid ancestor combination directly to the API. Reject it; no orphaned or cross-equipment relationship is saved. |
| ADM04 | S10/S12 | Deactivate a used definition or retire an equipment item. New selection is restricted appropriately, normal fleet totals exclude retired items, and existing jobs/part history remain accessible. |
| ADM05 | S10/S13 | Repeat catalogue/reference imports and attempt an import over Admin-edited data. No duplicates or silent overwrites occur; conflicts are surfaced with a deliberate resolution path. |
| ADM06 | S10/S14 | Admin edits/resolves a source parameter with a reason. Source observations remain available, the chosen value has applicable model scope, and old work/model history is not rewritten. |

## Work operational status and replacements

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| JOB01 | S08/S09 | EQ Team creates Pending work, moves it to Current and completes it with valid notes/date. It persists and appears in the correct tab after reload. Direct Pending -> Completed supports already-performed work with valid completion data. |
| JOB02 | S03/S09/S13 | Manually set Isolated with reason, complete/cancel/reopen work, cross midnight and reload/restart. It stays Isolated until explicit authorized Ready for OPS; actor/time/history persist; no job event changes status. |
| JOB03 | S08/S09 | Create an equipment-level job. It appears in equipment history and does not appear as a copy under every main mechanism. A targeted job uses the correct equipment/ancestor chain. |
| JOB04 | S09/S12 | Complete a replacement at one motor position with a known new item and unknown old serial. Current installation and history reflect exactly that position; an unknown removed serial/date remains unknown. |
| JOB05 | S12/S13 | Complete one job with several replacement lines on the same equipment. Every valid line commits once. Duplicate position lines and a line from another equipment are rejected without partial changes. |
| JOB06 | S12/S13 | Double-click/retry the same completion command and repeat it after a simulated network timeout. One completion/replacement set exists and the response is safely repeatable. |
| JOB07 | S13 | Two users edit/complete the same current job or position from the same version. One valid update wins; the other receives a useful conflict and reload/review path, without losing changes silently. |
| JOB08 | S12/S13 | Force a failure during replacement completion. Job state, installed-position changes and audit either all commit or all roll back. No Completed job lacks its committed replacement events. |
| JOB09 | S10/S12/S13 | Admin corrects completed work with a reason, then attempts to undo an older installation after a later replacement. Retain before/after history and reject an unsafe overwrite of the later installation. Reopening a job alone does not reverse the installation. |
| JOB10 | S12 | Exercise a quantity-bearing rope/set position and a single serialized motor position. Their quantities/UOM and installation semantics remain consistent; no assumption converts every set into one serialized item. |
| JOB11 | S09/S13 | Record a known historical work date without exact time. Display its business date correctly in Asia/Colombo and keep the UTC entry/audit timestamp distinct. Invalid completion data is rejected without claiming the work occurred at entry time. |
| JOB12 | S08/S09/S13 | EQ Team cancels an uncompleted job they created, with a reason. It leaves the normal three work columns, remains findable with Include cancelled, records actor/time/reason and is never hard-deleted or counted Completed. EQ Team cannot cancel another user's job or any completed job; Admin can cancel any uncompleted job; completed work uses the Admin correction path. |
| JOB13 | S02/S03/S13 | Reject Isolated without reason, wrong-scope related job and old/unknown status values. Valid manual choice records actor/time/history/duration. Registration/activation requires explicit Ready for OPS or Isolated and atomic first event; no Unreported or invented duration. |

## History and installed identity

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| HIS01 | S07/S12 | Record different replacements at the same semantic motor position in two QCs sharing a model. Scene selection, tree selection and direct history API each return only the selected equipment's records. |
| HIS02 | S07/S08 | A main/sub selection includes direct and descendant work. A multicomponent job appears once with its matching lines. A part selection shows exact-position history; another rope category's same display name does not leak into it. |
| HIS03 | S07/S12/S13 | Replace the same position twice and make an audited correction. Prior removed/installed items, original events and correction records remain readable; latest known installation is computed consistently. |
| HIS04 | S07/S14 | Select a component with no work and incomplete source data. Show empty/unknown states without asserting healthy, original, never replaced or an inferred installation date. |
| HIS06 | S07/S08 | Select a main, sub and part in the crane view. The right panel shows current state only, with no work history; Open in Jobs opens the EQ Jobs tab with the same direct/descendant or exact-position history as HIS02. |
| HIS05 | S07/S16 | Rapidly switch selected parts/equipment while delaying API responses. Out-of-order results cannot show an old component's history in the new selection panel; errors identify the current request/target. |

## QC model and interaction

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| VIS01 | S04 | Compare aligned side/end/top views with source sheets. The CICT frame/mast/boom/girder, cabin/house and bogie relationships are recognizable. Source dimensions meet the model brief's declared tolerance; qualified estimates remain declared. |
| VIS02 | S04/S14 | Inspect units and geometry/provenance manifest. Rail gauge is 30 m, outreach 70 m, backreach 20 m for this drawing family. Overall height comes from appropriate source dimensions, not 63 m total lift. |
| VIS03 | S05/S06/S07 | Select main -> sub -> part via scene and tree. Both routes select the same persisted identities, update breadcrumbs, focus useful bounds, show the same current state and open the same scoped history through Open in Jobs. Technical mode exposes useful simplified internals/source details. |
| VIS04 | S04/S06/S16 | Exercise reset/fit, orbit during camera transition, transparent enclosure picking, thin ropes and hidden/empty groups. No unbounded camera jumps, fighting controls or unreachable selected parts occur. Reduced motion is respected. |
| VIS05 | S04/S05/S12 | Reorder scene nodes/change a model version. Existing part histories remain bound by semantic position. Orphaned mappings are reported and cannot silently become another component through index/name guessing. |
| VIS06 | S02/S04/S16 | Inspect normal CICT paint and job/status overlays. Red structural paint is distinct from Isolated indication; status uses text/icons and a legend. There is no fabricated live movement/control or structural health score. |
| VIS07 | S01/S16 | Open RTG/ES and a QC without a verified model. Register, jobs, sources and component history remain usable. A QC mesh is never falsely displayed as RTG/ES. |
| VIS08 | S04/S16 | Disable WebGL, lose context or fail a model request. Users can still use tree/list navigation, read history and perform permitted work. Loading/error states do not trap the whole app. |
| VIS09 | S04/S17 | Build/export the model again from the delivered source/generator. Validate units, bounds, semantic mapping and version/checksum manifest; document deterministic vs tool-dependent output differences. |
| VIS10 | S02/S17 | Count active renderers: zero on fleet dashboard and one on detail. Repeated equipment navigation does not accumulate active canvases/listeners or unbounded unshared GPU resources. |

## Files security and evidence

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| FILE01 | S11/S14/S15 | Attempt unauthenticated direct drawing/photo/model URLs and guessed file IDs. Protected files are denied even when their names are known; no public static-root copy bypasses authentication. |
| FILE02 | S09/S14 | Upload valid permitted work evidence as EQ Team and read it as Management. EQ Team can attach to accessible work; Management can read/download but cannot upload or mutate metadata. |
| FILE03 | S13/S14 | Submit traversal filenames, disallowed MIME/signatures, oversized files and arbitrary filesystem/external URL requests. Reject safely without writing outside approved storage or fetching arbitrary sources. |
| FILE04 | S14 | Import a drawing twice and preview its protected PDF/model resources, including range requests if used. Checksums prevent duplicates; source drawing/page links remain correct and authorization remains enforced. |
| FILE05 | S14/S17 | Remove/misconfigure a referenced file in the disposable environment. Show an actionable unavailable state; do not expose the storage path/credentials or crash unrelated work/history. |

## Dashboard accessibility performance and release

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| OPS01 | S02/S03 | Use a mixed active/retired synthetic fleet with both explicit manual statuses and jobs with multiple lines. Each active equipment counts once; all counts/filter combinations reconcile. A failed refresh visibly preserves stale last-good data rather than fabricating Ready statuses. |
| OPS02 | S02/S08/S16 | Use keyboard and screen-reader-friendly controls, visible focus and form errors at 1920x1080, 1366x768, tablet and phone sizes. Text/tree workflows remain useful without mouse picking or hover-only labels. |
| OPS03 | S04/S17 | On a recorded office desktop/browser, measure triangles, draw calls, overview asset size, initial usable load, ten-second orbit FPS and idle rendering. Compare with the provisional brief budgets and record actual values/limitations rather than invented passes. |
| OPS04 | S15/S16/S17 | Reload nested /eq-maintenance routes, use back/forward, sign out/in and run with external internet unavailable. Required assets/decoders/fonts come from approved same-origin resources; normal local routing and protected API access work. |
| OPS05 | S17 | Build the release from a clean dependency restore and inspect its manifest/package. No credentials, test auth, fixture-only adapters or synthetic production fleet/history are included. Migrations/seeds are explicit and the configured target is never assumed disposable. |
| OPS06 | S17 | Rehearse documented release/rollback on an isolated target if available. Preserve business records/uploads and version relationships; record any untested real IIS/hosting/auth-consumer prerequisites. Preparing a package is not reported as production deployment. |

## Sections and access (V2)

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| ACC01 | S18 | Sign in as each role and as a user holding EQ Team and FAC Team. Each sees only permitted sections and tabs; the switch is hidden when one section is permitted; first-visit and last-used landing work; the app reads "EQ & FAC Asset Management". |
| ACC02 | S19 | Admin switches a view tab off for Management. It disappears at the next refresh (within 60 seconds) and its routes, API, exports and photo links return 403 for Management; switching it on restores access. Each change records actor, time and old -> new values. |
| ACC03 | S19 | Through the UI and the API, try to give Management a write right, FAC Team an EQ write, EQ Team a FAC write, or any role Admin pages. All are refused; Admin rights cannot be switched off. |
| ACC04 | S19/S23 | Grant FAC Team "manage master job list": a FAC Team user can add/edit recurring jobs. Revoke it: the same requests fail on the server. |
| ACC05 | S19 | A user whose tabs are all switched off sees the No access page, not an error or an empty shell. |

## Asset management revision 7

ZM01-ZM08 are RETIRED, excluded from active totals; CMMS import/automatic requirements are withdrawn. Historical evidence is retained. AM01-AM11 replace them: 97 active permanent cases (94 - 8 + 11). All new cases NOT RUN; eight temporary TD cases stay separate.

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| AM01 | S18 | Verify EQ & FAC Asset Management across app/title/launcher; technical routes/roles, IDs and equipment codes remain stable. |
| AM02 | S20 | Inspect host registration/config/dependencies/APIs/routes/Admin and network across EQ/FAC. No CMMS connector/account/scheduler/mappings/sync controls/health/messages/external request remains. Historical URLs/evidence stay intact. |
| AM03 | S02/S20 | No equipment/status-card blink/timer/pause-blinking control in normal/TV/reduced-motion views. FAC moving lists/pause/refresh/reduced motion remain functional. |
| AM04 | S02/S03/S21 | Current Breakdown categories/filters/exports become Long term isolated EQ, meaning manual Isolated. Only Ready for OPS/Isolated selectable; no threshold/Maintenance/Unreported. Preserve truthful labelled legacy history. |
| AM05 | S03/S09/S13/S21 | Create/activate with explicit status; reject omitted/invalid/legacy values atomically. Authorized changes record actor/time/reason/duration/history; Isolated reason required. Management/FAC Team denied. Existing old/blank prototype statuses require manual review. |
| AM06 | S03/S13/S21 | Both statuses persist across refresh/reload/restart/midnight/former sync times/job complete/cancel/reopen/FAC and part due events. No expiry/automatic mode/Back to automatic. Verify concurrent/retried commands and equipment independence. |
| AM07 | S08/S20 | Jobs has Projects/Special, EQ status, Spare parts condition only; no Daily work/imported rows/badges/filter/export or obsolete Admin routes. Old links resolve safely to permitted retained views; retained EQ/FAC history/actions work. |
| AM08 | S07/S22 | Flat/3D tabs: Spare part status first/default, Projects/Special, Technical. Fresh/equipment/selection/saved removed-tab states never reopen Maintenance; keyboard, scoped search/Add/Update/Open in Jobs remain usable. |
| AM09 | S07/S12/S22 | Compare all three Flat/3D payloads/content for equipment/main/sub/part/empty selections. Preserve accepted eligible work/current part/technical content, hidden-history allowlists and scoped Jobs links. No removed daily maintenance leaks. |
| AM10 | S02/S03 | Exactly four Fleet KPIs: Active, Ready percentage, Ready count, Long term isolated EQ count. Same documented type/search-scoped active population, correct type summaries; Ready + Isolated = active; empty ratio is dash; retired excluded. No Maintenance/Unreported cards/source selector. |
| AM11 | S02/S16/S27 | Review Fleet rearrangement at 1920x1080/1366x768/tablet/phone/TV: no removed-card gaps/clipping/overflow; keep equipment icons, filters, Cards/Table, accessibility and permissions. Retained FAC motion/TV works. |

## Spare-part condition (V2)

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| SP01 | S22 | Admin marks positions as major spare parts with an expected life; a per-position override works; another QC with the same template keeps its own register. |
| SP02 | S12/S13/S22 | Complete a Replacement special job: the pre-filled condition form saves in the same transaction. A forced failure rolls back job, installation and condition together; a retry creates no duplicate. |
| SP03 | S22 | Next predicted replacement = replaced date + expected life; Original parts use the commissioning date; with no commissioning date no prediction is shown; due-soon (90 days) and overdue flags are correct. |
| SP04 | S07/S22 | Edit a part's condition twice. The previous values stay in its history in the Jobs tab; the crane view shows only the current condition. |

## FAC jobs (V2)

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| FAC01 | S23 | Run the import preview from fac-job-list.json: 114 jobs with their issues shown per row and nothing saved before Admin confirms. Confirm, then re-run: no duplicates. After the first progress, a re-run is refused. |
| FAC02 | S23 | Imported values: blank quantity is 1; blank PIC, mode and dates stay blank; the three two-frequency rows are two jobs each; row 14 opens On hold with its remark; sheet percentages are not stored as typed values. |
| FAC03 | S24 | For each frequency, completing a recurring cycle sets last done and the next due date in calendar months/days (including 31 January + 1 month, a leap year and Asia/Colombo midnight). One-time closes; continuous has no due date; running-hours asks for the next due date; as-required has none. |
| FAC04 | S24 | Due soon (7 days), overdue and days overdue are correct; a job without a last done date shows no due date. |
| FAC05 | S24/S25 | Done today on a daily job and Done this week on a weekly job complete the current cycle once; repeating the tap does not double count. |
| FAC06 | S25 | Partial updates accumulate; an update that exceeds the quantity is rejected; reaching the quantity completes the cycle after confirmation; a future date is rejected. |
| FAC07 | S13/S25 | A double submit and two users updating one cycle give one correct result or a useful conflict. Same-day undo of the user's own last update works; undo the next day or of another user's update is refused; Admin correction with a reason keeps the prior values. |
| FAC08 | S25 | Hold requires a reason and shows On hold in the list and on the dashboard; releasing it returns the job to its previous status. |
| FAC09 | S26 | From a phone viewport upload a job picture and five completion photos. A sixth photo, an oversized file, a disguised type or a traversal name is rejected; photos are resized with thumbnails; unauthenticated and wrong-role URLs are denied; own same-day removal and Admin removal with a reason are recorded. |
| FAC10 | S28 | FAC Team's My work shows overdue, due-soon and in-progress jobs with their own PIC first; filters and search persist in the URL; job detail shows the timeline and previous cycles with on time/late. |
| FAC11 | S11/S19 | Management and EQ Team attempt FAC writes through the API; all fail. FAC Team attempts EQ writes and Admin pages; all fail. |
| FAC12 | S29 | Export a filtered FAC list and an EQ list. The file holds exactly the filtered rows, the source columns plus the calculated ones, and nothing from tabs the user cannot view. |

## FAC Dashboard (V2)

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| FDB01 | S27 | KPIs reconcile with the FAC Jobs list for the same filters; clicking a KPI applies its filter. |
| FDB02 | S27 | Each lane lists Overdue, On hold, In progress, Due soon, Pending, then jobs completed in the last 7 days, scrolling continuously and looping; a status change glows briefly and moves the job. |
| FDB03 | S16/S27 | Hover, keyboard focus and Pause stop the motion; with reduced motion requested the lists flip pages every 8 seconds; moving content has a static accessible alternative and no focus trap. |
| FDB04 | S27 | A 60-second refresh updates rows without resetting the scroll position or jumping the layout; a failed refresh keeps the last data with a warning and "Updated hh:mm". |
| FDB05 | S27 | TV mode at 1920x1080 hides navigation and enlarges text; it needs a normal signed-in Management user and there is no anonymous dashboard URL; 30 minutes of running show no memory growth. |
| FDB06 | S16/S27 | On a phone: KPIs and one combined list without auto-scroll; the latest-proof carousel shows only permitted thumbnails. |

## Minimum demonstration script

Use clearly synthetic `QC01`, `QC02`, `RTG01` and `ES01`, not assumed real fleet records, and the FAC list from `reference/fac-job-list.json` with synthetic progress.

1. Admin registers/assigns the correct model and distinct positions to the two QCs.
2. EQ Team marks QC01 Isolated with a reason, creates a replacement special job at its selected hoist motor and completes it with evidence and the pre-filled spare-part condition.
3. Verify QC01 stays Isolated, the installed item/history persists, and a retried completion creates no duplicate.
4. Management opens the fleet, then QC -> Hoist -> Hoist -> motor through the 3D view and sees the motor's current condition; Open in Jobs shows exactly that replacement. The tree opens the same record.
5. Open QC02 at the same visual motor; QC01 history is absent.
6. Attempt the same writes as Management; verify server denials.
7. EQ Team explicitly sets Ready for OPS; fleet refresh and status history agree.
8. Open RTG/ES, then simulate unavailable WebGL; their permitted record/work interfaces and QC tree fallback remain useful.
9. Demonstrate persistent manual Ready for OPS/Isolated, audit/permissions and absent CMMS/daily-work/blinking; no external access/account.
10. Admin previews and confirms the FAC import. FAC Team, on a phone viewport, logs partial progress with a photo, then completes a recurring job; its next due date rolls forward.
11. Management watches the FAC Dashboard in TV mode: the job moves to its new place, and the ticker and latest proof show the update.
12. Admin switches the FAC Jobs tab off for Management: the tab disappears and its API returns 403; switching it on restores it.

## Exit interpretation

Required local cases must have actual evidence before calling stage 1 locally complete. Optional cases or device-specific budgets may carry a documented, concrete decision; essential user workflows and data/security invariants cannot be waived by the implementation agent.

Production/IIS/user acceptance and engineering verification of model-family applicability are separately recorded. Their pending status does not invalidate a truthful completed local implementation, but it prevents a claim that the app is already deployed or approved for every real crane.
