# CICT EQ Maintenance

Implementation is driven by the prompt pack in `documents/prompt-pack/`. Its README, APPROVED_REQUIREMENTS.md and the Master control in EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md are the authorities; this file only explains the agent setup.

Current naming decision (25 October 2026, U1-C60): the external maintenance app is **CMMS**. Its domain remains **zmms.lk**; preserve every existing site URL. Apply this naming correction when reading older protected sources, prompts and evidence. See `docs/DECISIONS.md` B-24 / D-206.

Equipment naming (25 October 2026, U1-C61): **QC01-QC14**, **RTG01-RTG46**, **ES01-ES07**, with no separators in the business code. Preserve stable record IDs and equipment-specific history. The prototype's operating data/model associations remain synthetic despite the approved code format. See B-25 / D-207.

## How phases are run
- Orchestrated: start `Codex` in this folder and type `/eq-phase next`. Each phase is delegated to a subagent in `.Codex/agents/` whose frontmatter sets the pack's model and effort.
- Fresh session per phase: `.\tools\run-phase.ps1 <PHASE>` launches Codex with that phase's model/effort from `reference/phase-model-settings.json`.
- One phase per run. A review (R01-R05) must PASS before later phases. NEEDS FIXES -> repair -> repeat the same review.
- User checkpoints: U1 after R02 (prototype + QC model) and U2 after P11 (working-app walkthrough). The user's approval is recorded in docs/DECISIONS.md before the next phase starts.

## Project records
- Status ledger: docs/IMPLEMENTATION_STATUS.md. Decisions: docs/DECISIONS.md. Handover: docs/HANDOVER.md.
- Evidence: docs/evidence/<phase>/. Generated outputs: artifacts/. Exact prompts used per run: docs/runs/.

## Hard boundaries
- `documents/` and `As-bulit drawing/` are source authorities: never edit, move or delete them.
- Existing Portal source F:\CODEX\CICT-ENG_MAIN_PAGE is read-only except in P05.
- No deployment, live IIS changes, shared/production SQL, package publishing or printed secrets.
