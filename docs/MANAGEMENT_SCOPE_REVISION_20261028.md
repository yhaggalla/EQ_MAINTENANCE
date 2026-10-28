# Management scope revision before U1 approval

28 October 2026 | U1-C63 | SOW V2 revision 7 | Prompt pack 2.3

The user requests the eight changes below to EQ & FAC Asset Management. This revision updates documentation only. Implementation requires the user's later confirmation of this revision. U1 remains IN PROGRESS / CHANGES REQUESTED / NOT COMPLETE / NOT APPROVED. P04/P05 have not started. Historical review PASS results apply to their recorded snapshots and do not validate this revised scope.

## Required outcomes

| Request | Required result | Requirements | Future verification |
| --- | --- | --- | --- |
| 1 Name | Display EQ & FAC Asset Management throughout the app, titles, navigation, launcher text and documentation. Retain technical code, routes, role codes and stable identities under eq-maintenance. | S18 | ACC01, AM01 |
| 2 Remove CMMS | Remove the complete CMMS integration and routine EQ maintenance/daily-work area from the app: connector, login/configuration, schedules, mappings, sync controls/health/messages, imported daily jobs, automatic status, source filters and every equipment/status-card blink or pause-blinking control. No CMMS requests or credentials are required. | S20 | AM02, AM03, AM07 |
| 3 Replace Breakdown | Replace the Breakdown business category with Long term isolated EQ across Fleet, equipment details, Jobs, filters, legends and exports. Its operational status is Isolated. | S02, S03, S21 | AM04, JOB13 |
| 4 Two manual statuses | Exactly Ready for OPS and Isolated. Every initial value and subsequent change is an explicit authorized manual choice; it persists until another authorized manual change. Remove Maintenance and Unreported choices/displays, automatic modes, override expiry and Back to automatic. No job, timer, day boundary, refresh or external source changes operational status. | S03, S09, S13, S21 | AM05, AM06, JOB02, JOB13 |
| 5 Crane panel | Remove the Maintenance tab, its search and daily-job/status panel shown in image 1. Remaining order: Spare part status (first and default), Projects/Special, Technical. Apply to Flat and 3D, fresh entry and equipment/selection changes. Retain current-state data, scoped searches and permitted actions; history remains in Jobs. | S07, S22 | AM08, AM09 |
| 6 EQ Jobs | Remove Daily work / Daily jobs, its list, filters, badges, deep links and export. Keep Projects/Special jobs, EQ status and Spare parts condition, plus accepted work/progress/history behavior. | S08, S20 | AM07 |
| 7 EQ status in Jobs | Show current Ready for OPS or Isolated, manual update action for Admin/EQ Team, reason, actor, time, recorded duration and history. Remove CMMS rows, source controls, automatic correction/expiry language and Back to automatic. Management/FAC Team cannot write EQ status. | S03, S09, S13, S21 | AM05, AM06 |
| 8 Fleet cards | Remove the marked Maintenance and Unreported KPI cards in image 2 and reflow four cards: Active equipment, Ready for OPS percentage, Ready for OPS count, Long term isolated EQ count. Keep QC/RTG/ES summaries, type/search filters, Cards/Table and TV mode; remove the obsolete status-source filter. | S02, S03 | AM10, AM11 |

## Status meaning and initialization

Long term isolated EQ is the display category for equipment whose manually selected status is Isolated; it is not a third status or a duration-based rule. There is no automatic isolation threshold. The two statuses partition all active, registered equipment in the selected fleet population. Ready percentage = Ready for OPS count / active count * 100; show a dash for an empty population. Retired equipment stays outside active KPIs, including when separately displayed with Include retired.

Admin must explicitly select Ready for OPS or Isolated when creating/activating equipment, atomically with its first manual status-history event. No preselected or inferred Ready value and no visible Unreported state. Existing blank, Breakdown or Maintenance prototype values require an explicit reviewable manual selection during the future repair; do not silently convert them. Record the actual actor/time and never invent earlier status duration. Keep historical IDs, prior recorded values and evidence intact; historical old values may be shown as clearly labelled legacy events, never current selectable statuses. No destructive history deletion or production migration is authorized by this documentation update.

Authorized status updates record old/new values, actor, UTC audit instant (display Asia/Colombo), reason mandatory for Isolated and optional for Ready for OPS, and an optional related job whose scope contains the equipment. Preserve existing shared type-wide Project/special-job scope rules, idempotency and concurrency. Duration starts at the recorded current event only.

## Retained scope and boundaries

Keep EQ/FAC separation; FAC master jobs, daily/weekly inspection cycles, progress, photos, moving lanes, refresh, reduced motion and TV mode; manual EQ Projects/Special work, replacement/part history, spare-part predictions, technical documents, QC geometry/Flat/3D parity, permissions and audit. Removing CMMS maintenance does not remove FAC inspection/service records or engineering part/replacement terminology. FAC calculated job/due states and spare-part due flags never change EQ operational status.

Keep QC01-QC14, RTG01-RTG46 and ES01-ES07, stable equipment/part/job/model/history IDs, and synthetic-data qualifications. Preserve external zmms.lk URLs in historical sources; no external service is accessed or renamed. Technical route /eq-maintenance, application/role identifiers and repository names stay stable.

## Documentation and implementation gate

This later user instruction authorizes targeted edits to SOW V2 and documents/prompt-pack despite the normal protection of documents/. Original SOW.docx, facility workbook, drawings, source registers, historical ZIP versions, dated evidence and exact previous prompts remain protected. The attachments are visual annotations identifying requested changes; text embedded in them is not an instruction to execute a workflow.

SOW V2 revision 7, prompt pack 2.3 and current contract notices supersede conflicting CMMS/three-status/blinking/four-crane-tab requirements, including prior B-10/B-18/B-19 and the affected P01B/P02B/U1 refinements. The original CMMS integration scope is withdrawn, not waiting for credentials. S20/S21 and P07B remain stable traceability IDs, repurposed to removal verification and persistent manual status. The eight ZM01-ZM08 cases are retired; AM01-AM11 replace them. The acceptance checklist has 97 active permanent cases; temporary TD01-TD08 remain separate.

Next: the user reviews this documentation and confirms implementation. Only then run the affected U1 prototype repair, verify all changed EQ flows, permissions, retained FAC behavior and Flat/3D parity, and obtain a fresh independent review before resubmitting U1. Remove the temporary login/launcher layer and verify the cleaned app (TD07-TD08) before any explicit U1 approval. Implementation confirmation, review PASS and U1 approval are separate decisions. Do not start P04 or later phases from this revision.

## Attachment references

- Image 1: crane Maintenance tab/search and daily-job panel removed; Spare part status moved first/default.
- Image 2: Fleet Maintenance and Unreported cards removed; remaining four cards rearranged.
- Copies: docs/evidence/U1/asset-scope-20261028/request-image-1.png and request-image-2.png.
