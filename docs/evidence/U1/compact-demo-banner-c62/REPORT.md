# U1-C62 - compact demo banner

26 October 2026. Removed only the user-quoted long synthetic-data/persistence/sign-in/CMMS/persona sentence from the shared demo banner in P02 `js/app.js`. The PROTOTYPE label and Prototype controls button remain; fixture provenance and documented prototype limitations remain. Exact request: `docs/runs/Repair-U1-C62-20261026.md`. D-210 / UX section 55 / MF-02.

Local browser checks: **13/13 PASS**, `checks.json`. EQ Fleet and FAC Dashboard at 1920x1080 and 375x812: sentence absent, label/button present, content rendered, no horizontal overflow, controls open/close with correct accessible expanded state, no browser errors. Banner is about 41.6 px high at both sizes. Phone Fleet screenshot reviewed; desktop/phone captures retained. Initial browser attempt found no page because port 5312 was stopped; restarted the workspace's existing static server hidden on localhost, then all checks passed. No app defect was inferred from the stopped server.

`node --check` passes for the changed app script and two existing regression tools; `git diff --check` passes. The old P02/P02B assertions that required the removed sentence now check the retained PROTOTYPE notice/controls. Full historical suites were not rerun for this text-only change. Runtime, auth, persistence, fixture, role and CMMS behavior are unchanged; no live systems or deployment involved.

Direct Codex U1 refinement; no phase delegation or independent review verdict. The user subsequently requested "commit it.."; the accompanying local checkpoint includes C62 runtime, regression assertions, documentation and verification records. Retain this accepted refinement through U1-T01 REMOVE. **U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED; P04/P05 Not started.**
