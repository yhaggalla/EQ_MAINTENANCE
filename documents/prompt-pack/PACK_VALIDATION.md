# Prompt pack validation

## Current revision 2.2 checked 24 October 2026

PASS: 19/19 focused clarification checks plus final manifest/archive integrity checks. SOW V2 revision 6 retains accepted EQ/FAC management feedback while login/Portal feedback is deferred to actual P05 integration. TD07-TD08 require selective temporary-layer removal; no whole-file rollback over accepted refinements. Runtime remains unchanged; temporary BUILD not started, TD01-TD08 NOT RUN, U1 not approved.

- PASS: SOW revision 6 and pack version 2.2 current
- PASS: Markdown and Word scope mirrors match
- PASS: EQ/FAC request handling records decision, criteria, changes and verification
- PASS: Portal feedback deferred to actual integration
- PASS: Mixed-file cleanup preserves accepted app refinements
- PASS: Cleaned U1 app is initial baseline plus accepted changes
- PASS: TD07 and TD08 verify selective removal and accepted changes
- PASS: No actual management requests or approvals invented
- PASS: User clarification recorded as B-23 and D-204
- PASS: Affected project records carry preservation rule
- PASS: Six temporary requirements and eight NOT RUN cases retained
- PASS: 94 permanent acceptance cases retained
- PASS: 27 execution profiles retained
- PASS: All 26 phase/helper extractions carry accepted-change preservation
- PASS: New scope and decision prose synchronized into Word
- PASS: Existing Word tables retained and final page renders available
- PASS: App/model/tool runtime unchanged; Portal remains read-only
- PASS: Whitespace check passes
- PASS: Pack Markdown fences balanced and local links resolve

Word was exported in a separate hidden Word instance and rendered with bundled Poppler; all 17 final pages were visually reviewed. Full historical authoring and application acceptance checks were not repeated. Evidence: docs/evidence/U1/management-feedback-scope-20261024/.

## Historical revision 2.1 validation retained

## Current revision 2.1 checked 24 October 2026

PASS: 31/31 documentation/source consistency checks, plus archive/manifest integrity checked after packaging. This is a scoped documentation revision for SOW V2 revision 5. It does not repeat the full historical 57-check authoring review or establish application acceptance. The original report below is retained as a dated record.

Temporary runtime BUILD is Not started. TD01-TD08 are NOT RUN. U1 remains IN PROGRESS / NOT APPROVED; P04/P05 are Not started. The 94 permanent acceptance cases, S01-S29, 18 build phases, six reviews and 27 model profiles remain intact.

- PASS: App baseline is the current committed checkpoint
- PASS: Prototype/model/runtime/tool sources unchanged (README documentation excluded)
- PASS: Portal source remains clean at its inspected reference commit
- PASS: SOW revision 5 Markdown copies identical
- PASS: SOW revision 5 DOCX copies identical
- PASS: SOW identifies confirmed permanent scope and the new temporary request
- PASS: Temporary requirement IDs exactly TEMP01-TEMP06
- PASS: Temporary cases exactly TD01-TD08; all NOT RUN
- PASS: Blank/single-field/arbitrary login and credential handling specified
- PASS: All four required cards and existing-app placeholder boundary specified
- PASS: Existing default persona and landing preserved
- PASS: Removal, baseline, no dormant flags, unrelated work and history preservation specified
- PASS: Bounded build and removal prompts present
- PASS: Requirements and Master control carry the temporary U1 removal gate
- PASS: Run order retains all 18 builds and six reviews
- PASS: 94 unique permanent acceptance cases retained
- PASS: Permanent requirements S01-S29 retained
- PASS: All 27 model profiles preserved; only pack version changed
- PASS: All 26 build/review/helper extractions include the removal gate
- PASS: All pack Markdown fences balanced
- PASS: Every pack Markdown local link resolves
- PASS: Decision IDs B-22 and D-203 recorded without closing U1
- PASS: Status and handover record documented-only work and the removal prerequisite
- PASS: All 11 existing Word tables and FAC list dimensions preserved
- PASS: All new scope-section prose and bullets present in Word
- PASS: Word title/heading style is black and title has no rule
- PASS: Word PDF export and all 17 page PNGs available; visually reviewed
- PASS: V1 SOW, appearance photos and facility workbook original hashes unchanged
- PASS: All 38 source drawing checksums unchanged
- PASS: Source reference data unchanged (Git line-ending normalization applied)
- PASS: Whitespace check passes

The packaged DOCX renderer could not run because LibreOffice is unavailable. Microsoft Word exported the final DOCX to PDF in a separate hidden instance; bundled Poppler rendered all 17 pages, which were visually reviewed. SOW Markdown/DOCX mirrors match. QA intermediates are in the local ignored `tmp/management-scope-render/` directory.

No runtime source, Portal repository, original V1 SOW, drawing, facility workbook or source reference data was changed. No live app access, database work, deployment or phase approval occurred. Evidence: `docs/evidence/U1/temp-management-scope-20261024/REPORT.md` in the EQ workspace.

## Historical revision 2.0 validation retained from 22 October 2026

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
