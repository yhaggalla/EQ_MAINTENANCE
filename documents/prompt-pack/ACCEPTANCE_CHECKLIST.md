# Stage 1 acceptance checklist

Version 1.1 | 21 October 2026

These are checks for the future implementation, not results from this prompt-pack authoring task. **Every implementation case starts as NOT RUN.** Do not mark a case passed from a design document, a fixture-only screenshot or a supplied test prompt.

During implementation create an evidence table with `case ID`, `status`, `test/manual method`, `environment/database`, `artifact or test name`, `actual result`, `date` and `remaining issue`. Allowed statuses are NOT RUN, PASS, FAIL, BLOCKED and N/A with a concrete reason. A required stage 1 case cannot become N/A merely because it was not implemented.

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
| AUTH03 | S09/S10/S11 | Management attempts direct API writes for status, job creation/completion, attachments and Admin configuration. All fail. EQ Team succeeds for work/status and fails for catalogue changes/completed-work correction. Admin succeeds only within its app authority. |
| AUTH04 | S15 | Provision/retry/update/deactivate the same subject through the central convergence contract. Exactly one local profile persists, stale revisions cannot override current state and no display-name matching or browser-defined binding grants access. |
| AUTH05 | S15 | Test expired session, refresh, must-change-password, logout and unsafe/external return URLs. Current Portal behaviour is preserved, users see actionable state and no credentials/tokens enter browser storage or logs. |
| AUTH06 | S13/S15 | Attempt unsafe requests with missing/bad CSRF or cross-origin context. The current Portal security contract is enforced without a Development runtime bypass. Test auth exists only inside automated test hosts. |
| AUTH07 | S15/S17 | Validate the new shared token against the actual intended versions of Portal/UMMS/PayPrep/Safety consumers, including old consumers. Document the matrix and any required upgrade sequence. No new audience/role is enabled in an incompatible rollout and strict validation is preserved. |

## Register and Admin

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| ADM01 | S01/S10 | Admin creates/edits QC, RTG and ES equipment with distinct codes/model assignments. Duplicate codes are refused; data persists after reload/restart. New operational status remains visibly Unreported until explicitly set. |
| ADM02 | S05/S10/S12 | Instantiate two QCs from one template. Their motors/ropes/wheels have distinct equipment-specific position IDs. Changing a template or a mesh label does not recreate positions or transfer existing history. |
| ADM03 | S05/S10 | Submit another equipment's main/sub/part ID or an invalid ancestor combination directly to the API. Reject it; no orphaned or cross-equipment relationship is saved. |
| ADM04 | S10/S12 | Deactivate a used definition or retire an equipment item. New selection is restricted appropriately, normal fleet totals exclude retired items, and existing jobs/part history remain accessible. |
| ADM05 | S10/S13 | Repeat catalogue/reference imports and attempt an import over Admin-edited data. No duplicates or silent overwrites occur; conflicts are surfaced with a deliberate resolution path. |
| ADM06 | S10/S14 | Admin edits/resolves a source parameter with a reason. Source observations remain available, the chosen value has applicable model scope, and old work/model history is not rewritten. |

## Work operational status and replacements

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| JOB01 | S08/S09 | EQ Team creates Pending work, moves it to Current and completes it with valid notes/date. It persists and appears in the correct tab after reload. Direct Pending -> Completed supports already-performed work with valid completion data. |
| JOB02 | S03/S09/S13 | Set Maintenance, complete a job, then inspect fleet status. It remains Maintenance until an explicit authorized status change to Ready for OPS. Each status change records actor/time/reason and is visible to Management. |
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
| JOB13 | S02/S03/S13 | Set Breakdown or Maintenance without a reason: the server rejects it. Set it with a reason and an optional related job on the same equipment; a job from another equipment is rejected. Fleet and equipment views show time in current status from recorded history; equipment never set shows Unreported with no duration. |

## History and installed identity

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| HIS01 | S07/S12 | Record different replacements at the same semantic motor position in two QCs sharing a model. Scene selection, tree selection and direct history API each return only the selected equipment's records. |
| HIS02 | S07/S08 | A main/sub selection includes direct and descendant work. A multicomponent job appears once with its matching lines. A part selection shows exact-position history; another rope category's same display name does not leak into it. |
| HIS03 | S07/S12/S13 | Replace the same position twice and make an audited correction. Prior removed/installed items, original events and correction records remain readable; latest known installation is computed consistently. |
| HIS04 | S07/S14 | Select a component with no work and incomplete source data. Show empty/unknown states without asserting healthy, original, never replaced or an inferred installation date. |
| HIS05 | S07/S16 | Rapidly switch selected parts/equipment while delaying API responses. Out-of-order results cannot show an old component's history in the new selection panel; errors identify the current request/target. |

## QC model and interaction

| ID | Requirement | Action and expected result |
| --- | --- | --- |
| VIS01 | S04 | Compare aligned side/end/top views with source sheets. The CICT frame/mast/boom/girder, cabin/house and bogie relationships are recognizable. Source dimensions meet the model brief's declared tolerance; qualified estimates remain declared. |
| VIS02 | S04/S14 | Inspect units and geometry/provenance manifest. Rail gauge is 30 m, outreach 70 m, backreach 20 m for this drawing family. Overall height comes from appropriate source dimensions, not 63 m total lift. |
| VIS03 | S05/S06/S07 | Select main -> sub -> part via scene and tree. Both routes select the same persisted identities, update breadcrumbs, focus useful bounds and show the same scoped history. Technical mode exposes useful simplified internals/source details. |
| VIS04 | S04/S06/S16 | Exercise reset/fit, orbit during camera transition, transparent enclosure picking, thin ropes and hidden/empty groups. No unbounded camera jumps, fighting controls or unreachable selected parts occur. Reduced motion is respected. |
| VIS05 | S04/S05/S12 | Reorder scene nodes/change a model version. Existing part histories remain bound by semantic position. Orphaned mappings are reported and cannot silently become another component through index/name guessing. |
| VIS06 | S02/S04/S16 | Inspect normal CICT paint and job/status overlays. Red structural paint is distinct from Breakdown indication; status uses text/icons and a legend. There is no fabricated live movement/control or structural health score. |
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
| OPS01 | S02/S03 | Use a mixed active/retired/unreported synthetic fleet and jobs with multiple lines. Each active equipment counts once; all counts/filter combinations reconcile. A failed refresh visibly preserves stale last-good data rather than fabricating Ready statuses. |
| OPS02 | S02/S08/S16 | Use keyboard and screen-reader-friendly controls, visible focus and form errors at 1920x1080, 1366x768, tablet and phone sizes. Text/tree workflows remain useful without mouse picking or hover-only labels. |
| OPS03 | S04/S17 | On a recorded office desktop/browser, measure triangles, draw calls, overview asset size, initial usable load, ten-second orbit FPS and idle rendering. Compare with the provisional brief budgets and record actual values/limitations rather than invented passes. |
| OPS04 | S15/S16/S17 | Reload nested /eq-maintenance routes, use back/forward, sign out/in and run with external internet unavailable. Required assets/decoders/fonts come from approved same-origin resources; normal local routing and protected API access work. |
| OPS05 | S17 | Build the release from a clean dependency restore and inspect its manifest/package. No credentials, test auth, fixture-only adapters or synthetic production fleet/history are included. Migrations/seeds are explicit and the configured target is never assumed disposable. |
| OPS06 | S17 | Rehearse documented release/rollback on an isolated target if available. Preserve business records/uploads and version relationships; record any untested real IIS/hosting/auth-consumer prerequisites. Preparing a package is not reported as production deployment. |

## Minimum demonstration script

Use clearly synthetic `QC-DEMO-01`, `QC-DEMO-02`, `RTG-DEMO-01` and `ES-DEMO-01`, not assumed real fleet records.

1. Admin registers/assigns the correct model and distinct positions to the two QCs.
2. EQ Team marks QC-DEMO-01 Maintenance with a reason, creates a replacement at its selected hoist motor and completes it with evidence.
3. Verify QC-DEMO-01 stays Maintenance, the installed item/history persists, and a retried completion creates no duplicate.
4. Management opens the fleet, then QC -> Hoist -> Hoist -> motor through the 3D view and sees exactly that replacement. The tree opens the same record.
5. Open QC-DEMO-02 at the same visual motor; QC-DEMO-01 history is absent.
6. Attempt the same writes as Management; verify server denials.
7. EQ Team explicitly sets Ready for OPS; fleet refresh and status history agree.
8. Open RTG/ES, then simulate unavailable WebGL; their permitted record/work interfaces and QC tree fallback remain useful.

## Exit interpretation

Required local cases must have actual evidence before calling stage 1 locally complete. Optional cases or device-specific budgets may carry a documented, concrete decision; essential user workflows and data/security invariants cannot be waived by the implementation agent.

Production/IIS/user acceptance and engineering verification of model-family applicability are separately recorded. Their pending status does not invalidate a truthful completed local implementation, but it prevents a claim that the app is already deployed or approved for every real crane.
