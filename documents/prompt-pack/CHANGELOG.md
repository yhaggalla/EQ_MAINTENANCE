# Prompt pack changelog

## 2.0 | 22 October 2026 | SOW V2 revision 4

The user confirmed SOW V2 revision 4 (`documents/SOW_V2.docx`, same text in `documents/SOW_V2.md`) and the facility job list `documents/Facility- Dashboard.xlsx`. Their decisions are recorded in `APPROVED_REQUIREMENTS.md` section 1.

| Area | Change |
| --- | --- |
| Requirements | Version 2.0. S03, S07, S08, S09 changed; S18-S29 added (sections, Access matrix, ZMMS, automatic status, spare parts, FAC list, cycles, progress, pictures, FAC Dashboard, FAC Jobs, export). New sections 4.2 (Access), 5A (ZMMS and automatic status), 5B (spare parts), 6A (FAC). Four roles; display name "EQ & FAC Maintenance"; technical code unchanged |
| Run order | New phases P01B (V2 contracts), P02B (V2 prototype) and R02B (their review) before U1, so U1 reviews the QC model and the V2 prototype together; P07B (ZMMS) after P07; P08B (FAC jobs) after P08. P00-P03, R01 and R02 stay valid |
| Prompts | Bootstrap lists SOW V2 and the facility list and the settled V2 decisions; Master control adds the ZMMS boundary (only P07B contacts ZMMS; account never requested, committed or printed) and V2 invariants; P04-P06, P09-P13, R03-R05 extended for four roles, the Access matrix, FAC and ZMMS; P07 covers special jobs and spare parts; P08/P10 move history from the crane view to the EQ Jobs tab |
| Acceptance | 94 cases: ACC01-05, ZM01-08, SP01-04, FAC01-12, FDB01-06 and HIS06 added; AUTH03, JOB02 and VIS03 adjusted; demonstration steps 9-12 added |
| Reference | `reference/fac-job-list.json`: normalised seed of the 111 sheet rows (114 jobs), frequency list and known source issues |
| Model brief | Version 1.1: right panel shows current state; history opens in the EQ Jobs tab |
| Profiles | 27 profiles (P01B, P02B, R02B, P07B, P08B added) |
| Runner | `tools/extract-phase.ps1` accepts the B phases; the `/eq-phase` map and run order are updated |

## 1.2 | 21 October 2026 | Pre-implementation review

Reviewed the SOW, requirements review, every pack document and the reference data against each other. The mechanism catalogue parsing, drawing register and parameter observations were re-checked and are unchanged.

Decisions confirmed by the user and recorded in `APPROVED_REQUIREMENTS.md` section 1:

- No EAM/Maximo work-order reference field or synchronisation in stage 1.
- No bulk import of historical work. History starts at go-live; earlier work can be entered manually as completed jobs with past dates.
- QC main-part positions are derived from the as-built drawings and confirmed by Admin before any history is recorded.
- EQ Team can cancel uncompleted jobs they created, with a reason. Admin can cancel any uncompleted job. Only Admin corrects or reopens completed work.

Changes:

| Area | Change |
| --- | --- |
| Requirements | Added the four decisions; cancellation is now required (was an optional default); status changes need a reason for Breakdown and Maintenance and may link a job on the same equipment; fleet and equipment views show time in current status from recorded history; drawing-derived position template needs Admin confirmation |
| Run order | Added user checkpoints U1 (prototype and QC model, after R02) and U2 (working-app walkthrough, after P11). Approval is recorded in `docs/DECISIONS.md` |
| Prompts | Bootstrap reads AGENTS.md or CLAUDE.md and lists the new settled decisions; P06 adds the reviewable position template; P07 adds cancellation and status-reason rules and tests; P09 shows time in status; R02 and P11 hand over to U1/U2; Repair no longer re-runs its own review; Resume checks U1/U2 approvals |
| Acceptance | JOB12 is now required (EQ Team/Admin cancellation rules); added JOB13 (status reason, related job, time in status). 58 cases |
| Runner | README and run instructions point to the Claude Code runner (`/eq-phase`, `tools\run-phase.ps1`) |

Open source facts, unchanged and still to be settled by the user when convenient: the gantry speed (46 m/min on J526A00 vs 45.5 m/min on J526A0600), the real equipment register, and which current QCs the J526A drawing family covers.

## 1.1 | 21 October 2026

Added per-phase Codex and Claude model/effort recommendations.

## 1.0 | 21 October 2026

Initial pack.
