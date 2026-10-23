# U1 documentation reconciliation - 24 October 2026

## Scope and outcome

Reviewed the current records, the committed shared-viewer implementation (`4a8b270`, `7d773fa`), and their existing local prototype evidence. The user's explicit instruction is that all adjustments remain U1 and U1 is not completed. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED.** P04 is Not started; formal application acceptance remains NOT RUN.

This is a documentation review by the active Codex agent, not an independent R checkpoint or a new browser acceptance run. No runtime behavior changed. Source authorities under `documents/` and `As-bulit drawing/` were read-only. The unrelated RTG handover modification is excluded.

## Findings corrected

- Main status and approval tables lagged at rounds 9 and 8 and omitted current commit references. Both now include C32/C33, the 24 October clarification, and the explicit open U1 gate.
- D-168 and UX section 26 described a camera-preserving Reset, superseded by C33. D-171..D-173 and UX section 27 now record Flat default/Reset, physical-area isolation and the yard/sea levels. The stale Reset source comment was corrected; executable code is unchanged.
- Handover now distinguishes completed individual repairs from the incomplete checkpoint and identifies the latest committed fleet/viewer work. Historical run statements remain historical; unresolved source issues and the deferred FAC restyle are not closed.
- Prototype READMEs now identify the current Flat default and dropdown, both relevant check scripts, and U1's open status. The obsolete direct-file startup instruction was replaced with the HTTP-server requirement for modules/model assets.

## Verification boundary

Source review confirmed the Flat default, Reset's `view: 'flat'`, the manifest-container dropdown, isolation state, and decorative yard/sea levels against the current implementation. Existing `flat-isolation/checks.json` contains 18/18 passes and `flat-isolation/regression.json` contains 11/11 passes. These are prior local synthetic prototype results, not reruns in this documentation pass; the full chronology and limitations remain in the original reports.

Documentation consistency checks verified: both authoritative U1 rows stay incomplete/unapproved; P04 stays Not started; D-171..D-173 are unique; all four referenced commits resolve; referenced review/evidence/run files exist; prior evidence counts match. `git diff --check` and JavaScript syntax checking pass. Staging is restricted to these records, prototype READMEs and the comment correction. No deployment, production acceptance or user approval is implied.

## Next step

Continue U1 user walkthrough and requested refinements. Record explicit U1 approval only when the user gives it; do not start P04 based on repair commits or passing checks.
