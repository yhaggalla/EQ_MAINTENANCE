# U1-C50 EQ special-job progress

24 October 2026. Added an explicit overall percentage to EQ special jobs, following the user's confirmation. Each card and job detail shows a progress bar, percentage, latest work date and a two-line note. Completed progress uses the existing green completion colour. Pending starts at 0%; previously Current jobs show Not updated until a percentage is recorded. The job title opens details and the separate Open job details action is removed.

Update progress requires a whole percentage (0..100), work date and note. Saving 1..99% starts Pending work; 0% preserves the current work state. Selecting 100% changes the same form to completion and shows the existing required replacement fields when applicable. Repair jobs need no replacement lines. Existing Complete entry points remain and also record 100%. Reopened replacements can reuse committed lines without forcing another installation.

The simulated command checks live EQ work permission before replay, job state, equipment lifecycle, version, percentage, calendar date and note. Work dates cannot precede the latest progress/completion; replacement dates cannot exceed completion. Updates append actor/date/previous/new percentage/note to history and audit before/after summaries. Invalid or stale updates save nothing. Retries are job-scoped and do not duplicate progress, completion, installation or spare-register writes. Operational equipment status remains independent. Existing CurrentSpecial projections exclude progress fields and private notes.

## Verification

- Rule suite: **49/49** (`model-checks.json`), covering validation, read-only denial including replay, stale versions, history, atomic replacement/register updates, retries, reopening and the current-state DTO boundary.
- Headless Chrome: **23/23** on the working preview at localhost:5312 (`browser-checks.json`). Covers all 19 initial card summaries, 11 writable progress actions, six unknown Current values, required fields, validation correction/focus, partial saving, keyboard title navigation, 100% completion, conditional replacement fields, no partial writes, reopen/re-complete, a concurrent save, safe text rendering, session refresh, phone Tabs/action layout and Management/FAC read-only behavior. No browser errors.
- Isolated HEAD plus staged runtime preview at localhost:5316: **23/23** (`staged-browser-checks.json`). Excludes the older uncommitted UI changes from this commit's verification. Clean unchanged P03 files were supplied through a temporary junction for viewer imports.
- Existing R02B boundary/KPI regression: **10/10** (`r02b-regression.json`).
- JavaScript syntax and staged whitespace checks pass. Desktop form/cards, replacement form and 375 px phone screenshots inspected. Reference images are visual request context only.

Commands: `node tools/p02b/check_u1_c50.mjs`; `node tools/p02b/check_u1_c50_browser.mjs <base-url> <output-directory>`; `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/job-progress-c50/r02b-regression.json`. Source tests are committed with this change.

Runtime: P02 `js/store.js`, `js/dialogs.js`, `js/views-jobs.js`, `css/v2.css`. Contracts: `docs/API_CONTRACT.md`, `docs/DATA_CONTRACT.md`. Record: D-194 / UX section 44. Exact request and percentage confirmation: `docs/runs/Repair-U1-C50-20261024.md`.

Direct Codex U1 adjustment; no delegated phase or independent R verdict. Actual runtime model/effort not independently recorded. Synthetic in-memory prototype verification only: no production endpoint, database persistence, authentication, uploads, deployment, live IIS, shared SQL or ZMMS integration is claimed. Earlier uncommitted U1/RTG changes remain outside this commit. **U1 remains IN PROGRESS, NOT COMPLETE and NOT APPROVED; P04 Not started.**
