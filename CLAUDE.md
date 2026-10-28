# CICT EQ Maintenance

Current management revision (28 October 2026, U1-C63): display **EQ & FAC Asset Management**, remove all CMMS/daily EQ maintenance/sync/automatic/card-blinking features, and use only persistent manual **Ready for OPS** / **Isolated** (category **Long term isolated EQ**). Follow SOW V2 revision 7, prompt pack 2.3 and `docs/MANAGEMENT_SCOPE_REVISION_20261028.md`; they supersede conflicting older status/UI/CMMS rules. **Documentation only until the user confirms implementation. U1 remains NOT APPROVED; do not advance phases.** Keep technical identifiers, roles, equipment codes and history. The user explicitly authorized this targeted SOW V2/prompt-pack documentation update despite normal documents/ protection; other source materials remain protected.

Implementation is driven by the prompt pack in `documents/prompt-pack/`. Its README, APPROVED_REQUIREMENTS.md and the Master control in EQ_MAINTENANCE_IMPLEMENTATION_PROMPT_PACK.md are the authorities; this file only explains the agent setup.

## How phases are run
- Orchestrated: start `claude` in this folder and type `/eq-phase next`. Each phase is delegated to a subagent in `.claude/agents/` whose frontmatter sets the pack's model and effort.
- Fresh session per phase: `.\tools\run-phase.ps1 <PHASE>` launches Claude Code with that phase's model/effort from `reference/phase-model-settings.json`.
- One phase per run. A review (R01-R05, R02B) must PASS before later phases. NEEDS FIXES -> repair -> repeat the same review.
- User checkpoints: U1 after R02B (EQ and FAC prototype + QC model) and U2 after P11 (working-app walkthrough). The user's approval is recorded in docs/DECISIONS.md before the next phase starts.

## Project records
- Status ledger: docs/IMPLEMENTATION_STATUS.md. Decisions: docs/DECISIONS.md. Handover: docs/HANDOVER.md.
- Evidence: docs/evidence/<phase>/. Generated outputs: artifacts/. Exact prompts used per run: docs/runs/.

## Hard boundaries
- `documents/` and `As-bulit drawing/` are source authorities: never edit, move or delete them. Exception: `documents/prompt-pack/` (and the SOW V2 copy) changes only on the user's explicit instruction; pack 2.0 was applied on 22 October 2026 on that instruction.
- CMMS integration is withdrawn. No phase contacts zmms.lk or requests an account; preserve historical external URLs. P07B verifies removal and manual status.
- Existing Portal source F:\CODEX\CICT-ENG_MAIN_PAGE is read-only except in P05.
- No deployment, live IIS changes, shared/production SQL, package publishing or printed secrets.
