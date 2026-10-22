# Models and effort by phase

Version 2.0 | Verified 21 October 2026, phases added 22 October 2026 | Codex and Claude Code alternatives

Use one platform for each phase. The Codex and Claude columns are alternatives; running both is not required. The table is a quality-oriented starting recommendation based on the phase's work and failure consequences, not a benchmark result for this application. Preserve the same scope, sources and acceptance criteria regardless of provider.

These recommendations are also included inside every copy-and-paste prompt. Select the model and effort in your client before running it. Writing a model name inside a prompt does not switch the actual model or change its runtime reasoning effort.

## Phase recommendations

In the Codex column, Sol means **GPT-6.1 Sol** (`gpt-6.1-sol`), and Astra means **GPT-6 Astra** (`gpt-6-astra`). In the Claude column, Opus means **Claude Opus 5.5** (`claude-opus-5-5`), and Sonnet means **Claude Sonnet 5.5** (`claude-sonnet-5-5`). Full identifiers are recorded in `reference/phase-model-settings.json` and the individual prompts.

| Phase | Work | Codex model | Codex effort | Claude model | Claude effort | Reason for this assignment |
| --- | --- | --- | --- | --- | --- | --- |
| Bootstrap | Load scope and sources | Sol | High | Opus | High | Inherit the P00 discovery profile; Bootstrap is not a separate build phase. |
| P00 | Source review and implementation plan | Sol | High | Opus | High | Drawings, the two-sided taxonomy and existing Portal contracts need careful reconciliation. |
| P01 | Architecture and data/API contracts | Astra | High | Opus | High | Resolve persistent component identity, replacement rules and authentication dependencies together. |
| R01 | Scope and architecture review | Astra | High | Opus | High | Check the proposed contracts against the user's scope before code locks them in. |
| P02 | UI prototype | Sol | High | Sonnet | High | Concrete screen and interaction work with established scope and visual review. |
| P03 | QC model prototype | Astra | Extra high (`xhigh`) | Opus | High | Spatial source interpretation, semantic model mapping and a reproducible geometry pipeline. |
| R02 | UX and model fidelity review | Astra | High | Opus | High | Compare actual views with drawings and inspect interaction/identity behaviour. |
| P01B | V2 contracts addendum | Astra | High | Opus | High | Same contract work as P01 for the access, ZMMS, spare-part and FAC rules. |
| P02B | V2 prototype | Sol | High | Sonnet | High | Concrete screens on settled contracts, like P02, including the moving dashboard. |
| R02B | V2 contracts and prototype review | Astra | High | Opus | High | Check access ceilings, ZMMS safety and FAC rules before code locks them in. |
| P04 | Runnable app foundation | Sol | High | Sonnet | Medium | Bounded scaffolding and subpath setup after the architecture is defined. |
| P05 | Portal identity integration | Astra | High | Opus | High | Trusted profiles, shared-token compatibility and cross-application regressions. |
| R03 | Identity and compatibility review | Astra | Extra high (`xhigh`) | Opus | Extra high (`xhigh`) | Examine authorization and rollout failure paths before other workflows depend on them. |
| P06 | Database, catalogue and Admin | Sol | High | Opus | High | Implement explicit schemas and seed rules while preserving installed identities. |
| P07 | Jobs, status and replacements | Astra | High | Opus | High | Transactions, retries, concurrency and later-installation corrections interact. |
| P07B | ZMMS daily jobs and automatic status | Astra | High | Opus | High | Fail-closed parsing of an unknown page, credentials handling and time-boundary status rules. |
| P08 | Protected evidence and history | Sol | High | Opus | High | File authorization, source provenance and exact/descendant query scope. |
| P08B | FAC jobs, cycles and photos | Sol | High | Opus | High | Calendar due rules, idempotent progress, corrections and protected photos. |
| P09 | Fleet and detail UI | Sol | High | Sonnet | Medium | Connect well-specified views to established APIs and test freshness/counts. |
| P10 | Real QC viewer and drill-down | Astra | High | Opus | High | Coordinate spatial selection, stable records, camera state and asynchronous history. |
| R04 | Full workflow and data/access review | Astra | Extra high (`xhigh`) | Opus | Extra high (`xhigh`) | Probe data isolation, replacement integrity and protected resource access end to end. |
| P11 | Acceptance and performance | Sol | High | Opus | High | Execute and interpret tests, real browser behaviour and measured rendering costs. |
| P12 | Release and rollback preparation | Sol | High | Sonnet | High | Package an established implementation and reconcile operational dependencies. |
| R05 | Release readiness review | Astra | High | Opus | High | Independently assess versions, evidence, migration and rollout/rollback consistency. |
| P13 | Final corrections and handover | Sol | High | Sonnet | High | Reconcile final artifacts; complex fixes inherit the affected phase's stronger profile. |
| Repair | Correct a concrete finding | Sol by default; inherit affected phase | High by default; inherit higher effort | Opus | High by default; inherit higher effort | Auth, data-integrity and geometry defects use the originating phase/review profile. |
| Resume | Recover state and identify next work | Sol | Medium | Sonnet | Medium | Read the ledger and handover; switch to the next selected phase's profile before implementation. |

User checkpoints U1 (after R02B) and U2 (after P11) are human reviews and have no model profile.

The increased effort in P03/R03/R04 is an initial judgment for these difficult tasks. Compare its actual usefulness against High on representative cases and reduce it if it adds delay without improving the required result. No phase defaults to Max or Ultra. Those settings are optional escalation choices after a concrete failure demonstrates a need.

## Applying the settings

### Codex

Use the available model/reasoning controls in Codex. Extra high corresponds to the configuration value `xhigh`. Client, plan and workspace policy can limit which choices are visible. A missing choice is not evidence that a differently named model is equivalent. [Official model guidance](https://learn.chatgpt.com/docs/models), [reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning).

For Codex CLI, the following is an example of a session-specific selection; change the two values to match the phase:

```powershell
codex --model gpt-6.1-sol --config 'model_reasoning_effort="high"'
```

The corresponding configuration keys are `model` and `model_reasoning_effort`. This pack does not write your personal or project Codex settings. [Official developer settings](https://learn.chatgpt.com/docs/developer-settings), [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).

### Claude Code

Select a full model identifier and set effort through the supported controls, for example:

```powershell
claude --model claude-opus-5-5 --effort high
```

In an existing Claude Code session, `/model` selects the model and `/effort high` sets the level. Confirm the resulting setting in the session display; account/organization restrictions can apply. [Claude Code model configuration](https://code.claude.com/docs/en/model-config).

Opus 5.5 uses adaptive thinking and its documented default effort is Medium, so select the table's High explicitly when recommended. For API-driven runners the effort field is `output_config.effort`; it is separate from the thinking mode. [Claude effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort).

If using Claude's chat UI instead of Claude Code, choose the model and thinking controls actually available there. Do not assume its UI exposes every Code/API effort level or that writing High in the message applies a numeric/API setting. Note an unavailable setting in the handover and preserve the phase's acceptance criteria.

## Escalation and fallback

- Start with the assigned profile. Repeating a failed attempt with a longer prompt is not automatically a better strategy: preserve the reproducer and identify the actual missing capability or information first.
- For a routine Sol/Sonnet phase that repeatedly fails a demonstrated edge case, move to the available Astra/Opus profile at High and keep the same acceptance case.
- For P03/R03/R04 or a difficult repair, try higher supported effort only if the failure appears reasoning-related. Missing source dimensions, inaccessible files and an unavailable test database need evidence/input/environment repair, not more thinking.
- If Opus still fails a demanding reasoning task after a controlled effort comparison, Claude Fable 5.1 at High is an optional alternative when available. It is not the default for this pack. [Anthropic model-selection guidance](https://platform.claude.com/docs/en/models/overview).
- If Astra is unavailable, Sol at High is a practical starting fallback; evaluate Extra high if required checks remain weak. If the specified Claude release is unavailable, choose an accessible supported model and verify its supported controls rather than silently assuming the same effort calibration. Record the actual replacement and result.
- A fresh review context is useful. If both platforms are available, using the other provider for a review is optional; it does not replace evidence or authorize automatic delegation.

## Handover requirements

For each executed phase record the recommended profile, actual selected model, actual effort if known, client, any fallback/escalation and the resulting verification evidence. If the runtime setting cannot be inspected, write Unverified rather than claiming that the prompt changed it.

The same effort name is not a measure of equal reasoning, cost or quality across providers or model generations. These are phase-specific recommendations, not guaranteed capability equivalences.

The machine-readable profile reference is `reference/phase-model-settings.json`. Recheck official model names, client support and account access when execution begins; the source verification date for this revision is 21 October 2026.
