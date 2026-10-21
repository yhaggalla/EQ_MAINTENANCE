# Prompt pack validation

Validated 21 October 2026 (pack 1.2).

This report validates the instruction pack and its reference data. It does not claim that the application, a QC model or any application acceptance test has been implemented or executed.

- Build phases: 14 (P00-P13).
- Read-only review checkpoints: 5 (R01-R05).
- Bootstrap, Repair and Resume prompts: present.
- Model recommendations: 22 explicit Codex/Claude profiles; matched against every copied prompt and guide coverage.
- Future acceptance cases: 58; all start NOT RUN. JOB12 (cancellation) and JOB13 (status reason/time in status) are required.
- Approved catalogue: 16 main mechanisms, 43 subcodes, 41 active and two inactive reserved entries.
- Drawing register: 38 source PDFs, 162 PDF pages; existing source checksums verified.
- Major parameter observations preserve the unresolved gantry-speed conflict and do not assign a model to real equipment.
- Markdown local links and prompt fences checked.

## Checks completed

- PASS: Exact 16 main-code set and 43 expected subcodes.
- PASS: All codes preserve leading zeroes and parent relationships.
- PASS: 41 active subcodes; exactly 048 and 063 reserved and inactive.
- PASS: Approved Spreader/Headblock labels; main 10 remains absent.
- PASS: Separate hoist/trolley/boom rope definitions preserved.
- PASS: Original mechanism source copy matches its recorded checksum.
- PASS: Both source column groups independently match approved code sets.
- PASS: Continued descriptions retained across representative mechanisms.
- PASS: Drawing register has 38 PDFs and 162 total PDF pages.
- PASS: Every indexed drawing exists with its recorded checksum.
- PASS: Major parameter units/values and assignment limits retained.
- PASS: Gantry speed conflict is unresolved with both observations retained.
- PASS: All parameter source files/pages resolve to supplied drawings.
- PASS: Exactly 14 build prompts P00-P13 and five review prompts R01-R05.
- PASS: Bootstrap Repair and Resume prompts are present.
- PASS: All prompt blocks have balanced fences.
- PASS: All 22 build/review/helper/bootstrap model profiles are present.
- PASS: Recommended model IDs and effort values are explicit and supported.
- PASS: Every copied prompt embeds the matching model and effort profile.
- PASS: Human model/effort guide covers the same 22 profiles.
- PASS: Runtime settings distinguished from prompt text and no machine settings applied.
- PASS: Acceptance IDs are unique and explicitly not executed.
- PASS: All S01-S17 requirements appear in the acceptance mapping.
- PASS: Markdown fences balanced: ACCEPTANCE_CHECKLIST.md.
- PASS: Markdown fences balanced: APPROVED_REQUIREMENTS.md.
- PASS: Markdown fences balanced: CHANGELOG.md.
- PASS: Markdown fences balanced: EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md.
- PASS: Local document link resolves: EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md -> MODEL_AND_EFFORT_GUIDE.md.
- PASS: Markdown fences balanced: MODEL_AND_EFFORT_GUIDE.md.
- PASS: Markdown fences balanced: PACK_VALIDATION.md.
- PASS: Markdown fences balanced: QC_3D_MODELLING_BRIEF.md.
- PASS: Markdown fences balanced: README.md.
- PASS: Local document link resolves: README.md -> CHANGELOG.md.
- PASS: Local document link resolves: README.md -> MODEL_AND_EFFORT_GUIDE.md.
- PASS: Local document link resolves: README.md -> EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md.
- PASS: Local document link resolves: README.md -> EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md.
- PASS: Local document link resolves: README.md -> MODEL_AND_EFFORT_GUIDE.md.
- PASS: Local document link resolves: README.md -> reference/phase-model-settings.json.
- PASS: Local document link resolves: README.md -> APPROVED_REQUIREMENTS.md.
- PASS: Local document link resolves: README.md -> QC_3D_MODELLING_BRIEF.md.
- PASS: Local document link resolves: README.md -> ACCEPTANCE_CHECKLIST.md.
- PASS: Local document link resolves: README.md -> reference/mechanisms-approved.json.
- PASS: Local document link resolves: README.md -> reference/mechanisms-original.txt.
- PASS: Local document link resolves: README.md -> reference/drawing-register.json.
- PASS: Local document link resolves: README.md -> reference/major-parameters.json.
- PASS: Local document link resolves: README.md -> ../EQ_MAINTENANCE_REQUIREMENTS_REVIEW.md.
- PASS: Original SOW and appearance references remain present.
- PASS: Review decisions recorded in requirements.
- PASS: Run order includes user checkpoints U1 after R02 and U2 after P11.
- PASS: No application scaffold was created by prompt-pack authoring.

## Review boundaries

- Content was checked for consistency against the five scope answers, four review answers, source-derived classification and reviewed drawing particulars.
- All source PDFs were indexed; the source review identifies which overview sheets were visually examined. This is not a complete fabrication-drawing audit.
- The SOW was read as text/shapes and its embedded image. Word page rendering was unavailable because LibreOffice was not available to the packaged renderer.
- No application build, browser acceptance, generated-model comparison, target IIS verification, production SQL access or deployment was performed during pack authoring.
- The pack contains technical implementation defaults. Current runtime/package patches and actual Portal consumer versions must be checked during P00/P05.
