# CICT EQ Maintenance

Current management revision (28 October 2026, U1-C63, implementation confirmed and completed): display **EQ & FAC Asset Management**, remove CMMS/daily EQ maintenance/sync/automatic status features, and use only persistent manual **Ready for OPS** / **Isolated** (category **Long term isolated EQ**). Follow SOW V2 revision 7, prompt pack 2.3 and `docs/MANAGEMENT_SCOPE_REVISION_20261028.md`; they supersede conflicting older status/UI/CMMS rules. Later explicit U1-C64 / D-212: remove the isolated Fleet card's thick left strip and add a 2.5-second background pulse for active Isolated cards, respecting reduced motion, motion=off and Pause. Only this overrides the earlier blanket no-blinking rule; Ready and retired cards stay static. **U1 remains NOT APPROVED; do not advance phases.** Keep technical identifiers, roles, equipment codes and history. The user authorized the targeted C63 SOW V2/prompt-pack documentation update despite normal documents/ protection; other source materials remain protected.

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
