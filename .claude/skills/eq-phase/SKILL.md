---
name: eq-phase
description: Run the next (or a named) CICT EQ Maintenance prompt-pack phase by delegating it to the subagent with the pack's model and effort. Use when the user types /eq-phase.
argument-hint: next | P00..P13 | P01B | P02B | P07B | P08B | R01..R05 | R02B | U1 | U2 | repair <R0x|P0x|U1|U2> | resume | status
disable-model-invocation: true
---

# Run one EQ Maintenance prompt-pack phase

Argument: `$ARGUMENTS`

You are the orchestrator. You do not implement or review anything yourself; you pick the phase, hand its exact prompt to the right subagent, record the outcome, and stop.

## Phase to agent map (Claude Code column of documents/prompt-pack/reference/phase-model-settings.json)

| Phase | Subagent | Model / effort |
| --- | --- | --- |
| P00, P01, P01B, P03, P05, P06, P07, P07B, P08, P08B, P10, P11 | eq-build-opus-high | Opus 5.5 / high |
| P02, P02B, P12, P13 | eq-build-sonnet-high | Sonnet 5.5 / high |
| P04, P09, Resume | eq-build-sonnet-medium | Sonnet 5.5 / medium |
| R01, R02, R02B, R05 | eq-review-opus-high | Opus 5.5 / high |
| R03, R04 | eq-review-opus-xhigh | Opus 5.5 / xhigh |
| Repair after R03 or R04 | eq-build-opus-xhigh | Opus 5.5 / xhigh |
| Repair after anything else | eq-build-opus-high | Opus 5.5 / high |

Run order (pack 2.0): P00, P01, R01, P02, P03, R02, P01B, P02B, R02B, **U1**, P04, P05, R03, P06, P07, P07B, P08, P08B, P09, P10, R04, P11, **U2**, P12, R05, P13.

U1 reviews the QC model (with its round 1-3 repairs) and the V2 prototype together; its affected phases are P02, P02B and P03.

U1 and U2 are user checkpoints, not agent work (see step 4a).

## Steps

1. **Pick the phase.**
   - `status`: read docs/IMPLEMENTATION_STATUS.md and the latest review reports, summarise where the project stands and what `/eq-phase next` would run. Stop.
   - `next`: read docs/IMPLEMENTATION_STATUS.md and docs/HANDOVER.md (if they exist). The next phase is the first in the run order without demonstrated completion. If the latest report of a review says `VERDICT: NEEDS FIXES`, next is `repair <that review>`; after a repair, next is that same review again. If no docs exist, next is P00. Tell the user which phase you chose and why in one line.
   - A named phase: use it.
2. **Gate.** Do not start a phase if an earlier review in the run order has no PASS report in docs/evidence/<R>/, or an earlier user checkpoint has no `U1 APPROVED` / `U2 APPROVED` line in docs/DECISIONS.md. Say which gate is missing and stop, unless the user explicitly overrides in this message.
3. **Extract the prompt verbatim.** Run:
   `powershell -NoProfile -ExecutionPolicy Bypass -File tools/extract-phase.ps1 -Phase <ID>` (use `Repair` or `Resume` for those).
   Never paraphrase, shorten or summarise the output.
4a. **User checkpoint (U1 or U2).** Do not delegate. U1: point the user to the runnable prototype, model screenshots and the R02 report (docs/evidence/P02, P03, R02; artifacts/). U2: give the user the minimum demonstration script from ACCEPTANCE_CHECKLIST.md and how to start the local app (docs/evidence/P11, docs/TEST_REPORT.md). Ask the user to approve or list changes. On approval, append `<date> U1|U2 APPROVED by user: <their note>` to docs/DECISIONS.md and stop. On change requests, record them under `<date> U1|U2 CHANGES REQUESTED` in docs/DECISIONS.md, then the next step is `repair <U1|U2>` (affected phase P02/P03 for U1, the relevant feature phase for U2), followed by the checkpoint again.
4. **Delegate** with the Agent tool to the mapped subagent and wait for its result (foreground). The task message is the extracted text, unchanged. For a repair, append:
   `=== REPAIR TARGET === Affected: <R/P id>. Failed review report: <path>. Fix the blocking findings in that report, then stop.`
   For a repair after U1/U2, the failed report is the change list in docs/DECISIONS.md; use eq-build-opus-high.
   Do not pass a `model` or `effort` override; the subagent definition carries them.
5. **Record.**
   - Build phase or repair: check that docs/HANDOVER.md and docs/evidence/<phase>/ were updated. If not, say so plainly.
   - Review: write the reviewer's full report to `docs/evidence/<R>/review-<yyyyMMdd-HHmm>.md` and append `<date> <R> VERDICT: <PASS|NEEDS FIXES> (<agent>)` to docs/IMPLEMENTATION_STATUS.md.
5a. **Commit.** After recording (and after a U1/U2 decision is written), commit the phase on the current branch: `git add -A`, then `git commit -m "<phase>: <one-line outcome>"` with the attribution trailer. Check `git status` first and never commit secrets or files `.gitignore` excludes. Do not push.
6. **Report and stop.** Give the user: phase, agent/model/effort used, outcome or verdict, the top blocking findings or open questions, and the next command (`/eq-phase next`). Run one phase per invocation; never chain into the next phase. If the subagent recorded open business questions, show them so the user can answer before continuing.
