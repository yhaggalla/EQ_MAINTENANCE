# P01B evidence - V2 contracts addendum

Date 22 October 2026. Kind of evidence: **source review and scripted document-consistency checks only**. P01B extends the reviewed P01 contracts for SOW V2 revision 4 (requirements v2.0, S01-S29). No application, prototype or Portal file was edited; no database, ZMMS page or external system was contacted. Every acceptance case in `ACCEPTANCE_CHECKLIST.md` (94, version 2.0) remains NOT RUN.

## 1 Inputs read

`documents/SOW_V2.md` (revision 4); `documents/prompt-pack/APPROVED_REQUIREMENTS.md` 2.0 (s1, s2, s4, s5, s5A, s5B, s6A, s7, s8 and the rest); `ACCEPTANCE_CHECKLIST.md` 2.0; the P01B, P02B, R02B, P07B, P08 and P08B prompts of the pack; `reference/fac-job-list.json` (structure, 114 jobs, 12 frequencies, 7 known source issues); the header row of `documents/Facility- Dashboard.xlsx` (read only, for the export columns); `reference/major-parameters.json` (no mechanism links, hence D-123); `docs/ARCHITECTURE.md`, `DATA_CONTRACT.md`, `API_CONTRACT.md`, `PORTAL_INTEGRATION_PLAN.md`, `UX_SPEC.md`, `DECISIONS.md` (including U1-C19), `IMPLEMENTATION_STATUS.md`, `HANDOVER.md`, R01 review notes N1-N6. Portal repository: `git log -1` and `git status` only (still `feature/option-b-provisioning-and-login-redesign`, `47f7bd9`, clean). The uncommitted `rtg-workbench/` folder was not read or touched (orchestrator note).

## 2 Changed contract sections

### docs/DATA_CONTRACT.md

| Section | Change |
| --- | --- |
| header | P01B addendum note and changed-section list |
| s1 | Business day (Asia/Colombo), week, calendar-month rule, feature-check convention, new DataOrigin values |
| s2 | V2 entity diagram (Access, ZMMS, spare parts, FAC); EQ/FAC separation |
| s3.2 | PositionTemplate.SparePartTypeId |
| s3.3 | CurrentStatusSource, ManualOverrideOn; CommissionedOn as the S22 commissioning date; invariant E5 (derived status mode) |
| s3.4 | PartPosition spare-part designation, type and life override |
| s3.5 | InstallationEvent kind `conditionReplacement`, SparePartEntryId; I3 extended; new I5 |
| s3.6 | Jobs are the EQ special jobs (rules unchanged); J4 extended for ZMMS |
| s3.7 | OperationalStatusChange Source/Kind/SyncRunId/OverrideOn; OperationalStatusChangeCause; invariants O1-O3 |
| s3.9 | Document kinds `facPhoto`, `facPhotoThumbnail`; FAC photo rules pointer |
| s3.11 | Four role codes |
| s3.12 | V2 audit actions |
| s4.2 | Status mode state diagram and the V2 command/event table (correction, Back to automatic, syncs, mapping, retirement) |
| s5.1 | Step 6a: spare-part register written in the completion transaction; V2 commands use the same lock/idempotency order; corrections recompute the register |
| s6 | Four-role feature matrix (Fixed / Toggle / No), rules R1-R4; supersedes the three-role table |
| s7 | Provisioning accepts only the four role codes |
| s8 | Concurrency rows for sync vs correction, Sync now, register actions, FAC updates, matrix edits |
| s9 | Scoped history now served to the EQ Jobs tab; crane view uses s18.1 |
| s11 | Stable keys for every V2 entity |
| s12 | FAC master-list import and ZMMS (not an import) |
| s13 | V2 enforcement rows |
| s14 (new) | Sections, tabs, landing, No-access page; AccessPolicyVersion/Entry/Change; evaluation; enforcement points (API, exports, files, page routes); propagation and audit |
| s15 (new) | ZMMS connector boundary, configuration key names (no values), daily-job record keyed by (job number, date), equipment mapping and unmatched queue, schedule/single-run lock/timeouts/retry, fail-closed parsing and all-or-nothing runs, automatic status algorithm with the current-day correction, job-type/status value mapping |
| s16 (new) | Spare-part types, designation, expected life, prediction and flags, register actions, completion write, derivation, entities |
| s17 (new) | FAC lists, job master, cycles (rolling/period), due computation (Asia/Colombo, calendar months), progress, Done today/this week, completion confirmation, same-day undo, hold, photos, import preview/confirm/re-run, Admin correction and due date, displayed status, settings |
| s18 (new) | Read models: crane current state in the four U1-C19 tabs, EQ Jobs tab parts, fleet additions, FAC Dashboard summary with ETag, FAC Jobs |
| s19 (new) | Excel exports and their columns (FAC columns follow the sheet header) |
| s20 (new) | ZMMS fields provisional until P07B: questions ZQ-01 to ZQ-13 |

### docs/API_CONTRACT.md

| Section | Change |
| --- | --- |
| header | P01B addendum note |
| s1.1 | V2 enums including the twelve feature keys |
| s1.2, s1.6 | `feature_disabled`, `not_update_author` and all V2 error codes |
| s1.7 | Dashboard and fleet ETags, photo and export caching |
| s2 | Feature policies `EqSession`, `F:<feature>`, `AnyFeature`; mapping of the superseded `EqRead`/`EqWrite`/`EqAdmin` |
| s3 | StatusSummary source/mode/override/causes |
| s4.1 | Session: display name, four roles, `access` block (features, sections, landing, noAccess), V2 capabilities, 60-second refresh |
| s4.2 | Fleet: `zmmsToday`, ZMMS freshness, status source |
| s4.3 | Status history with source/kind/causes (Jobs tab); correction rules; new Back to automatic command |
| s4.4-s4.15 | Every endpoint's policy restated as a feature policy; position installation history moved to `eq.jobs.view`; s4.13/s4.14 policy stated (R01 N4) |
| s4.6 | History consumed by the EQ Jobs tab only |
| s4.7 | `reopenCount`, `committedLineCount` (UX-1) |
| s4.8 | `conditionRemarks` on completion lines; register write in the same transaction |
| s4.9 | File policies by document kind |
| s4.16-s4.27 (new) | Crane current state (four tabs + summary); EQ Jobs tab queries; register commands; Admin spare parts and EQ settings; Admin ZMMS; Admin Access matrix; FAC queries, commands, photos, Dashboard; Admin FAC (import, lists, settings, corrections, due date); Excel exports |
| s5 | Provisioning `appRoleCodes` with four codes |
| s7 | V2 endpoint-to-acceptance rows |

### docs/ARCHITECTURE.md

| Section | Change |
| --- | --- |
| header | P01B note; document map |
| s1 | ZMMS node and connector edge; outbound statement |
| s2 | Display name, four roles, sections, outbound |
| s3 | V2 feature folders; FAC isolated from EQ types (architecture test); fixtures folder |
| s4 | Candidate HTML parser, Excel writer and image library (pinned in their phases) |
| s5 | Feature policies; SPA fallback route check (403 shell); hosted service |
| s6 | V2 route table with features; redirects of P01 paths; polling of session/dashboard; moving dashboard and phone-first FAC notes |
| s7 | Right panel = four current-state tabs; no canvas on FAC pages |
| s9 | FAC photo and staging layout; no ZMMS page storage |
| s10 | V2 tables, single-row settings, app lock |
| s11 | ZMMS off by default; fixtures and fake clock |
| s12 | ZMMS account, outbound HTTP, exports, authorization |
| s13 | D-89 to D-128 |
| s14 | V2 tradeoffs |
| s15 | Ownership map S01-S29 with all 94 acceptance IDs |
| s16 | U-29, U-32, D-103 |
| s17 (new) | ZMMS connector runtime sequence and rules |

### docs/PORTAL_INTEGRATION_PLAN.md (fourth role and display name only)

Header note; s2 display name "EQ & FAC Maintenance" and four roles; s3.1 A-1 (four role codes, 23 registry codes), A-4; s3.2 I-1, I-5 (four roles, display name), I-10; s3.3 W-2, W-4; s4 sequence and messages; s5.2 RC-4, RC-8, RC-15 (V2 routes), new RC-18 (FAC Team token) and RC-19 (fac-team grant/revoke convergence), AUTH07 condition; s7 synthetic users `fac-team-demo`, `eq-fac-team-demo` and walkthrough; s8 four non-delegable roles. Everything else (code, audience, binding claim, disabled registry row, gate G1, rollback) unchanged.

### docs/DECISIONS.md

Header; s2 "P01B additions" D-89 to D-128; s2 "P01B supersessions" (15 superseded rules with their replacements); s3 U-29 (ZMMS page), U-30 (facility sheet gaps), U-31 (U1-C19 Projects/Special reading), U-32 (outbound HTTPS and app-pool settings).

Not changed: `docs/UX_SPEC.md` (P02B updates it from these contracts), the prototypes, `documents/`, `As-bulit drawing/`, the Portal repository.

## 3 Checks run

| Check | Command / method | Result |
| --- | --- | --- |
| V2 contract coverage | `python -I tools/p01b/check_contract_coverage_v2.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/P01B/contract-coverage-v2.json` | First run 14/15: the feature-key check counted the notation examples `F:x`/`F:x|y` in API s2 as features (checker defect, fixed by ignoring one-letter tokens). Final run **15/15 passed**: 94 acceptance IDs mapped; S01-S29 rows; D-19..D-44 and D-89..D-128 in ARCHITECTURE s13 and once in DECISIONS; cross-references resolve; taxonomy facts; four role codes and the display name present; no secret or ZMMS-account value; S18-S29 and all V2 acceptance IDs referenced in DATA/API; DATA s6 matrix equals SOW V2 s3.2 (13 toggles, defaults, no Management write, no cross-section writes, Admin pages Admin-only); API feature policies use only the twelve keys; fac-job-list.json facts; four crane tabs in DATA s18.1 and API s4.16 |
| P01 checker still passes | `python -I tools/p01/check_contract_coverage.py --root F:/CODEX/EQ_MAINTENANCE --out tmp/p01-coverage-after-p01b.json` | **9/9 passed** (output in ignored `tmp/`) |
| Mermaid syntax of new/changed diagrams | Mermaid validator on DATA s2 V2 ER, DATA s4.2 state diagram, ARCHITECTURE s1 flowchart, ARCHITECTURE s17 sequence, PORTAL s4 sequence | First validation of the s17 sequence failed (semicolons inside messages are statement separators); semicolons replaced by commas there and in the s1 labels; all **5/5 valid** afterwards. Unchanged P01 diagrams were validated in P01 |
| Portal state | `git -C F:/CODEX/CICT-ENG_MAIN_PAGE log -1`, `status --short`, `branch --show-current` | `47f7bd9`, clean, `feature/option-b-provisioning-and-login-redesign` (unchanged since P01) |

## 4 Questions only the real ZMMS page can answer (for P07B)

ZQ-01 login mechanics (route, fields, anti-forgery token, cookie, captcha/second factor); ZQ-02 server-rendered or script-filled list; ZQ-03 which date the page shows and how a date is chosen; ZQ-04 paging and displayed totals; ZQ-05 exact columns and formats; ZQ-06 equipment text format; ZQ-07 job type and status vocabularies; ZQ-08 carried-over job numbers and whether closed jobs stay listed; ZQ-09 whether a breakdown raised during the day appears by the 14:00 sync; ZQ-10 the empty-day marker; ZQ-11 encoding and displayed time zone; ZQ-12 displayed account name or personal data to sanitise; ZQ-13 acceptable request rate and lockout policy. Environment (P12): outbound HTTPS from the IIS server to `www.zmms.lk`. Details: `docs/DATA_CONTRACT.md` s20; tracked as U-29 and U-32.

## 5 Points for R02B attention

1. Access matrix: only 13 toggleable cells are storable; the evaluator ignores anything else, so a ceiling cannot be widened even by a stored row (DATA s6 R1, s14).
2. Page routes return the SPA shell with 403 when a signed-in user lacks the tab's feature (D-93).
3. Automatic status: no change before Admin enables it with every seen value mapped (D-97); a correction holds for the business day including a sync that started before midnight (`ManualOverrideOn >= run date`); it ends at the first **successful** sync of a later day; Back to automatic never invents a value (D-96).
4. Register: one installation history for jobs and direct entries (`conditionReplacement`, D-105); predictions computed, never stored; "Not recorded" until recorded.
5. Crane view: four tabs, none returning history; Projects/Special lists open jobs only and counts the rest (D-122, U-31 for the U1 repeat).
6. FAC: period cycles created lazily (no midnight job); confirmation before completion; same-day undo of the author's latest update; import preview stateless with a hash; re-run locked by the first progress.

## 6 Next

P02B V2 prototype (it must implement U1-C19 from these contracts), then R02B, then the U1 repeat.
