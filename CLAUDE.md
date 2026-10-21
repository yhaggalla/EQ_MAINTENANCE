# CICT EQ Maintenance

Implementation is driven by the prompt pack in `documents/prompt-pack/`. Its README, APPROVED_REQUIREMENTS.md and the Master control in EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md are the authorities; this file only explains the agent setup.

## How phases are run
- Orchestrated: start `claude` in this folder and type `/eq-phase next`. Each phase is delegated to a subagent in `.claude/agents/` whose frontmatter sets the pack's model and effort.
- Fresh session per phase: `.\tools\run-phase.ps1 <PHASE>` launches Claude Code with that phase's model/effort from `reference/phase-model-settings.json`.
- One phase per run. A review (R01-R05) must PASS before later phases. NEEDS FIXES -> repair -> repeat the same review.
- User checkpoints: U1 after R02 (prototype + QC model) and U2 after P11 (working-app walkthrough). The user's approval is recorded in docs/DECISIONS.md before the next phase starts.

## Project records
- Status ledger: docs/IMPLEMENTATION_STATUS.md. Decisions: docs/DECISIONS.md. Handover: docs/HANDOVER.md.
- Evidence: docs/evidence/<phase>/. Generated outputs: artifacts/. Exact prompts used per run: docs/runs/.

## Hard boundaries
- `documents/` and `As-bulit drawing/` are source authorities: never edit, move or delete them.
- Existing Portal source F:\CODEX\CICT-ENG_MAIN_PAGE is read-only except in P05.
- No deployment, live IIS changes, shared/production SQL, package publishing or printed secrets.
