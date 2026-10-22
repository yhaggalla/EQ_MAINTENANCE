# Prompt pack validation

Validated 22 October 2026 (pack 2.0). Overall: PASS (57/57 checks).

This report validates the instruction pack and its reference data. It does not claim that the application, a QC model or any application acceptance test has been implemented or executed. Earlier phase results (P00-P03, R01, R02) are recorded in `docs/` and are not re-validated here.

- Build phases: 18 (P00-P13, P01B, P02B, P07B, P08B).
- Read-only review checkpoints: 6 (R01-R05, R02B).
- Bootstrap, Repair and Resume prompts: present.
- Model recommendations: 27 explicit Codex/Claude profiles, matched against every copied prompt and the guide.
- Future acceptance cases: 94; all start NOT RUN.
- Requirements: S01-S29, all mapped to acceptance cases.
- Facility job list: 111 sheet rows -> 114 jobs in `reference/fac-job-list.json`, checksum-linked to the source sheet.
- Mechanism catalogue, drawing register and parameter observations: unchanged since pack 1.2 (checksums), so their 1.2 content checks still apply.

## Checks completed

- PASS: Exactly 18 build prompts: P00, P01, P02, P03, P01B, P02B, P04, P05, P06, P07, P07B, P08, P08B, P09, P10, P11, P12, P13
- PASS: Exactly six review prompts: R01, R02, R02B, R03, R04, R05
- PASS: Bootstrap prompt present
- PASS: Repair prompt present
- PASS: Resume prompt present
- PASS: Master control present
- PASS: One text block per phase plus Bootstrap, Repair and Resume
- PASS: 27 model profiles, profileCount 27
- PASS: Every prompt has a profile and every profile a prompt
- PASS: Every copied prompt embeds its profile model and effort
- PASS: Model guide covers all 27 profiles
- PASS: Pack model table covers all 27 profiles
- PASS: U1 follows R02B and U2 follows P11 in the run order
- PASS: P07B follows P07 and P08B follows P08
- PASS: 94 unique acceptance IDs (found 94)
- PASS: All S01-S29 appear in the acceptance mapping
- PASS: Requirements define S01-S29
- PASS: Acceptance cases are explicitly not executed
- PASS: Markdown fences balanced: ACCEPTANCE_CHECKLIST.md
- PASS: Markdown fences balanced: APPROVED_REQUIREMENTS.md
- PASS: Markdown fences balanced: CHANGELOG.md
- PASS: Markdown fences balanced: EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md
- PASS: Local link resolves: EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md -> MODEL_AND_EFFORT_GUIDE.md
- PASS: Markdown fences balanced: MODEL_AND_EFFORT_GUIDE.md
- PASS: Markdown fences balanced: PACK_VALIDATION.md
- PASS: Markdown fences balanced: QC_3D_MODELLING_BRIEF.md
- PASS: Markdown fences balanced: README.md
- PASS: Local link resolves: README.md -> CHANGELOG.md
- PASS: Local link resolves: README.md -> MODEL_AND_EFFORT_GUIDE.md
- PASS: Local link resolves: README.md -> EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md
- PASS: Local link resolves: README.md -> EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md
- PASS: Local link resolves: README.md -> MODEL_AND_EFFORT_GUIDE.md
- PASS: Local link resolves: README.md -> reference/phase-model-settings.json
- PASS: Local link resolves: README.md -> APPROVED_REQUIREMENTS.md
- PASS: Local link resolves: README.md -> reference/fac-job-list.json
- PASS: Local link resolves: README.md -> QC_3D_MODELLING_BRIEF.md
- PASS: Local link resolves: README.md -> ACCEPTANCE_CHECKLIST.md
- PASS: Local link resolves: README.md -> reference/mechanisms-approved.json
- PASS: Local link resolves: README.md -> reference/mechanisms-original.txt
- PASS: Local link resolves: README.md -> reference/drawing-register.json
- PASS: Local link resolves: README.md -> reference/major-parameters.json
- PASS: Local link resolves: README.md -> ../EQ_MAINTENANCE_REQUIREMENTS_REVIEW.md
- PASS: Unchanged since pack 1.2 (checksum): reference/mechanisms-approved.json
- PASS: Unchanged since pack 1.2 (checksum): reference/mechanisms-original.txt
- PASS: Unchanged since pack 1.2 (checksum): reference/drawing-register.json
- PASS: Unchanged since pack 1.2 (checksum): reference/major-parameters.json
- PASS: Original source unchanged: documents/SOW.docx
- PASS: Original source unchanged: documents/images.jpg
- PASS: Original source unchanged: documents/images2.jpg
- PASS: fac-job-list.json source checksum matches documents/Facility- Dashboard.xlsx
- PASS: fac-job-list.json: 114 jobs from 111 sheet rows
- PASS: Every imported job has quantity >= 1
- PASS: Tri-annually = 4 months, bi-annually = 6 months
- PASS: documents/SOW_V2.docx present
- PASS: documents/SOW_V2.md present
- PASS: documents/SOW_V2.md matches the confirmed docs/SOW_V2.md
- PASS: tools/extract-phase.ps1 extracts all 24 phase prompts plus Repair and Resume

## Review boundaries

- Content was checked for consistency with SOW V2 revision 4 and the user's answers Q1-Q14, and with the earlier scope and review decisions.
- The ZMMS page structure is unknown until P07B reads it with the configured account; the pack marks those fields provisional.
- No application build, browser acceptance, ZMMS access, target IIS verification, production SQL access or deployment was performed during pack authoring.
