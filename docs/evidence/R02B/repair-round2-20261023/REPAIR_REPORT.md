# Repair-R02B round 2 - 23 October 2026

Outcome: **complete for repair findings 1 and 2; independent R02B repeat pending**. This run does not review or pass R02B. Baseline: `main` / `ff6b77c`; findings: `docs/evidence/R02B/review-20261023-0933.md`. Changes are uncommitted for the orchestrator.

Runtime: client **Codex subagent eq-build-opus-high**. Agent-definition model **Codex-opus-5-5**, effort **high (per agent definition)**; actual execution model identity was not independently exposed and the configured profile is not proof of that identity. Recommended inherited profile: R02B Codex gpt-6-astra/high or Claude Code claude-opus-5-5/high. No fallback or escalation. Exact run prompt: `docs/runs/Repair-R02B-20261023-0938.md`.

## Reproduction, cause and correction

1. **Finding 1 (High): Fleet current-state exposed hidden history.** In an isolated Node VM, load the unchanged prototype scripts at baseline, reopen completed `job-101` as Admin, disable Management EQ Jobs, and read Fleet current-state as Management. History refuses with 403, but `currentSpecial` returned the original job and replacement-line objects. The allowlist and detached-reference checks fail; description, completion fields and nested event/correction/installation data remain accessible. `probes-before.json` records the pre-edit result (five failures among nine checks, including this finding and finding 2).

   `store.js` now constructs an explicit current-state value: job id/number, equipment and target IDs, kind, title, Pending/Current state, planned date, and matching position IDs only. It also copies the scope value. No stored job, line, nested item or caller scope reference crosses this read. Reopened source records keep completion/event/correction information. `panel-tabs.js` renders matching position names only in current cards; full replacement details remain available in the Jobs history card. API s4.16 defines `CurrentSpecialJob` separately from `JobSummary` and `ReplacementLineView`; DATA s18.1 records the same rule (D-145).

   B05 now reopens the actual fixture job, checks the exact returned job/position keys and source-history retention, and exercises denied reads plus the four rendered crane tabs. The focused VM also mutates returned values to prove storage/reference isolation.

2. **Finding 2 (Medium): FAC on-time KPI ignored filters.** The same baseline VM reports Electrical active jobs = 18 but on-time = 75%, 6/8 despite zero eligible Electrical rolling completions. Cause: the active board population used `filterJobs`, while the on-time window iterated all stored jobs.

   `fac.js` now computes one population using all existing discipline/type/mode/PIC predicates, then derives active jobs and the eligible completion window from that population. Zero cycles returns null percentage and 0/0. Existing date-window, period exclusion and completed-job state eligibility stay intact; KPI focus still narrows lane rows only. DATA s18.4 and API s4.25 clarify those semantics (D-146).

   H12 now verifies visible Electrical no-percentage behavior and Civil inspection = 71%, 5/7. Independent VM calculations check all four filters, combined predicates, and nonempty mode/PIC subsets. Mode and PIC variation is confined to the probe VM; committed source fixtures are unchanged.

## Fresh checks actually run

All paths below are relative to this repository; all checks used synthetic fixtures.

| Command | Actual result | Evidence |
| --- | --- | --- |
| `node tools/p02b/check_r02b_round2.mjs docs/evidence/R02B/repair-round2-20261023/probes-before.json` (before implementation edits) | Exit 1; 4 pass, 5 fail of 9. Both findings reproduced | `probes-before.json` |
| `node tools/p02b/check_r02b_round2.mjs docs/evidence/R02B/repair-round2-20261023/probes-after.json` | Exit 0; 10/10 pass. Final probe adds nonempty mode/PIC/combined coverage beyond the nine pre-edit checks | `probes-after.json` |
| `node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/ docs/evidence/R02B/repair-round2-20261023/p02b-affected.json --only=B05,H01,H12` | Exit 0; 3/3 pass, Chrome 155.0.8059.85 | `p02b-affected.json` |
| `node tools/p02b/check_p03_panel.mjs docs/evidence/R02B/repair-round2-20261023/p03-panel.json` | Exit 0; 8/8 pass, software WebGL. Includes 21 flat/3D tab-selection text comparisons | `p03-panel.json` |
| `python -I tools/p01b/check_contract_coverage_v2.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/R02B/repair-round2-20261023/contracts-v2.json` | Exit 0; 15/15 pass | `contracts-v2.json` |
| `python -I tools/p01/check_contract_coverage.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/R02B/repair-round2-20261023/contracts-v1.json` | Exit 0; 9/9 pass | `contracts-v1.json` |
| `node tools/p02b/shot.mjs docs/evidence/R02B/repair-round2-20261023/electrical-no-eligible-cycles.png management 'fac/dashboard?discipline=electrical'` | Exit 0; no console errors. Image inspected: 18 active jobs, on-time dash and "no cycles completed yet", Electrical selected | PNG |
| `git diff --check` | Exit 0; no whitespace errors (Git emitted existing LF/CRLF notices) | Local command output |
| `Get-FileHash rtg-workbench/HANDOVER.md -Algorithm SHA256` | Matches baseline `9F8235251E29FB03D67C615DCF8EC955A3FDF993AF1D19DF9516362CAA7F3226` | Local command output |

The full 59-check P02, 63-check P02B and 41-check P03 model browser suites, model validation and bindings were **not rerun**. Their results in the independent review are prior evidence. This repair changes only the shared current-state reader/card and FAC filter population, so fresh checks target those behaviors and panel parity. Geometry, generator, model assets and viewer core have no repair changes.

## Acceptance matrix (prototype/contract support only)

| IDs | Fresh support | Formal application acceptance |
| --- | --- | --- |
| ACC02, S19, S07, HIS06 | Finding 1 VM probes, B05 payload/route/UI checks; distinct DTO in API/DATA | NOT RUN |
| FDB01, S27 | Finding 2 independent filter arithmetic, H01/H12 visible KPI checks; inspected screenshot | NOT RUN |
| U1-C08, U1-C19 | P03 panel suite 8/8 including 21 flat/3D comparisons | NOT RUN; user checkpoint remains pending |
| Existing V1/V2 contract mappings | Coverage 9/9 and 15/15 | NOT RUN |

## Exact files changed by this repair

- `artifacts/prototypes/p02-ui/js/store.js`
- `artifacts/prototypes/p02-ui/js/panel-tabs.js`
- `artifacts/prototypes/p02-ui/js/fac.js`
- `docs/API_CONTRACT.md`
- `docs/DATA_CONTRACT.md`
- `docs/DECISIONS.md` (D-145, D-146)
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/HANDOVER.md`
- `tools/p02b/check_p02b.mjs` (B05, H12)
- `tools/p02b/check_r02b_round2.mjs` (new)
- This directory's `REPAIR_REPORT.md`, `probes-before.json`, `probes-after.json`, `p02b-affected.json`, `p03-panel.json`, `contracts-v1.json`, `contracts-v2.json`, `electrical-no-eligible-cycles.png`.

The orchestrator owns the separately added exact prompt file. Pre-existing RTG handover edits were preserved. Source authorities (`documents/`, `As-bulit drawing/`), Portal, other application repositories and runtime credentials were not changed. Existing localhost fixture listeners on 5312/5313 were reused; no server state was changed by this run beyond browser-local synthetic fixture actions.

## Limits, open issues and next prompt

No new business question or repair blocker. Existing U-31/U-33 walkthrough/mapping and P07B ZMMS discovery questions retain their prior impact. These are simulated permissions and source contracts: no authenticated application, database transaction, protected production file, live ZMMS, target-environment or production acceptance was verified. No deployment, IIS change, shared SQL or publishing occurred.

Next prompt: **R02B V2 contracts and prototype review, repeated in a fresh independent context**. U1 follows only after PASS; this repair does not grant U1 approval or start P04.
