# U1-C68: component data folded into the parameter model

29 October 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C68-20261029.md` | D-217

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.**

## What changed

- The U1-C65 component data no longer live in a separate prototype dataset. `assets/reference/qc-component-parameters.json` is the supplementary observations file that `import-parameters` reads with `major-parameters.json` (DATA_CONTRACT s3.8 / s8): 26 registered source documents (drawings and manuals with repository paths), 220 component definitions, 231 observations, each with one or more references (document, PDF page, locator), and 27 groups with explicit area and part-key targets.
- Existing reference codes are reused, not duplicated: main hoist / boom hoist / trolley motor ratings, hoist speeds, lift height, trolley speed, boom hoisting time and SWL under spreader / cargo beam gain the drawing and manual sources as further observations. U-02 (trolley motor 275 / 270 / 275 kW) stays an unresolved conflict. The former C65 text rows that described conflicts became real conflicts (machinery-house service crane 10 t J526A1600 vs 12 t manual 1.6.1), resolvable by Admin with a reason, with the observations kept visible.
- `tools/p02/build_catalog.py` merges the file into `params.js` (`EQ.sourceParams`, `EQ.paramSources`, `EQ.paramGroups`) and validates unique codes, defined group codes, registered references with existing files, sourced observations, and area and part keys present in the model manifest. `catalog.js` regenerates unchanged.
- Technical tab: area isolation, part and sub-mechanism selections show the groups through the parameter rules (Admin value -> single observed value -> unresolved conflict), each row with its references; Admin gets "Resolve with a reason" on conflicts; Management and EQ Team see but cannot decide. Admin > Specifications gains a Show filter (reference / conflicts / Admin-entered / each component group / all 240). `js/component-specs.js` is removed.
- Contracts: DATA_CONTRACT s3.8 adds component parameters, ParameterObservationSource, Document kind `sourceManual`, ParameterGroup / Member / Target and the display rules; the s8 import row is updated; API_CONTRACT s4.10 adds `GET /equipment/{id}/parameter-groups`; SOURCE_MAP s5.4.

## Checks (actual results)

| Check | Result |
| --- | --- |
| build_catalog.py (validations) | PASS: 240 parameters, 27 groups, 26 sources; catalog.js unchanged |
| check_u1_c68.mjs (new) | 13/13 PASS |
| check_u1_c63_model.mjs | 55/55 PASS |
| check_r02b_round2.mjs | PASS |
| check_u1_c50.mjs | 49/49 PASS |
| check_u1_c35.mjs | 11/11 PASS |
| check_unified_viewer.mjs | 11/11 PASS |
| check_flat_isolation.mjs | 19/19 PASS |
| check_u1_c66.mjs | 14/14 PASS (after making its page-ready poll null-safe; the first run read `EQ` during navigation) |
| check_u1_c63_browser.mjs | 68/68 PASS (rerun alone; a run in parallel with C66 stopped after 3 checks) |
| capture_c65.mjs | 15 captures; groups render for 9 parts and 5 areas; 0 browser errors (`captures/`) |
| check_u1_c51.mjs | **FAIL, pre-existing**: stops at check 20 because `createEquipment` returns 409 `local_status_changed` (the C63 cross-tab storage guard) in the Node harness; the same failure occurs on HEAD 0c47727 in a clean worktree, unrelated to parameters |

The first C68 run had two test-side errors (wrong search-input selector; a fresh page load loses the in-memory prototype decision, so three open conflicts is correct on the Admin page); both were corrected in the test and the run repeated: 13/13. Admin decisions in the prototype are in memory, as for other prototype data.
