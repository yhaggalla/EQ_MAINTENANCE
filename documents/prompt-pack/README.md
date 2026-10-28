# CICT EQ & FAC Asset Management prompt pack

Version 2.3 | 28 October 2026 | SOW V2 revision 7 | U1-C63

Management's eight changes are documented only. Implementation requires the user's later confirmation. U1 remains IN PROGRESS / CHANGES REQUESTED / NOT COMPLETE / NOT APPROVED; P04/P05 Not started. Existing review PASS results apply to earlier snapshots.

## Current scope

- Display EQ & FAC Asset Management; retain eq-maintenance technical paths/roles and stable equipment/part/work/history identities.
- Remove all CMMS/daily EQ maintenance integration, sync messages/settings/controls, automatic status and equipment-card blinking. No phase contacts CMMS or needs its account.
- Exactly Ready for OPS and Isolated, initialized explicitly and manually updated with persistent audit/history. Long term isolated EQ replaces Breakdown category; no timer threshold, Maintenance or Unreported current status.
- Crane tabs: Spare part status first/default, Projects/Special, Technical. EQ Jobs: Projects/Special, EQ status, Spare parts condition; no Daily work.
- Four Fleet KPIs: Active equipment, Ready for OPS percentage, Ready for OPS count, Long term isolated EQ count; rearrange responsively with retained type summaries/filters.
- Retain EQ/FAC roles/Access, manual EQ work/progress/replacements/spares/technical/history, FAC inspection/service cycles/progress/photos/moving dashboard/reduced motion/TV, QC-first staging and synthetic-data boundaries.

Complete change matrix and confirmation/initialization/legacy-history rules: [management scope revision](MANAGEMENT_SCOPE_REVISION_20261028.md).

## Run controls

Read [requirements](APPROVED_REQUIREMENTS.md), [implementation prompts](EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md), [acceptance](ACCEPTANCE_CHECKLIST.md), [model guide](MODEL_AND_EFFORT_GUIDE.md) and current project records. One phase per run, after its gates. Bootstrap/Master apply to extracted phases; Resume repeats the confirmation gate.

Retain 18 build prompts, six independent reviews and 27 model profiles. Repurpose P07B to CMMS removal/manual-status verification; S20/S21 retain IDs with revised scope. Retire ZM01-ZM08 and add AM01-AM11: 97 active permanent acceptance cases (94 - 8 + 11), all specified for future working-app acceptance. Eight temporary TD cases stay separate.

## Open U1 checkpoint

After user confirmation, perform the affected prototype Repair, verify requested outcomes and retained flows, obtain fresh independent review, then resubmit U1. No P04 until explicit U1 approval in DECISIONS.md. Remove temporary login/launcher and verify TD07-TD08 first; retain accepted app refinements. [Temporary walkthrough](TEMP_MANAGEMENT_WALKTHROUGH.md) BUILD is historically complete; removal pending. Old hashes/labels remain historical. Portal feedback stays deferred to actual P05 integration.

## Package records

[Changelog](CHANGELOG.md), [validation](PACK_VALIDATION.md), PACK_MANIFEST.json, [QC brief](QC_3D_MODELLING_BRIEF.md) and unchanged source reference data accompany the pack. SOW V2 Markdown/Word copies are synchronized. Original SOW/workbook/drawings, historical ZIPs/evidence/exact prompts remain protected; historical zmms.lk URLs unchanged. No external service is accessed.
