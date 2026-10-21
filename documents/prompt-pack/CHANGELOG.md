# Prompt pack changelog

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
