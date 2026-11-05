# Current U1 prototype regression checks

28 October 2026, U1-C63 / SOW V2 revision 7. Run from the workspace root with Node; browser checks use the existing loopback `serve.mjs 5312` listener and `http://127.0.0.1:5312/index.html` as their base argument. Use an explicit new output folder when reviewing, so historical evidence is not overwritten. Each browser runner has its own CDP port. No external CMMS, backend, SQL, real authentication or production acceptance is involved.

| Active check | Purpose |
| --- | --- |
| check_u1_c63_model.mjs [output JSON] | Two statuses, explicit initialization, validation/audit, synthetic permissions, retries/conflicts, independent stores, quotas/reset/baseline time, part-date independence |
| check_u1_c63_browser.mjs [base] [output folder] | Eight management outcomes, seven layouts, filtered KPIs, saved links, keyboard/touch, 15 Flat/3D comparisons, manual UI/reload and retained routes |
| check_u1_c63_tabs.mjs [base] [output JSON] | Actual same-origin simultaneous browser tabs: unrelated/same-equipment writes, registration collisions, retirement, reset, storage quotas and no-Web-Locks fallback |
| check_r02b_round2.mjs [output JSON] | Reopened-history allowlists, detached payloads and FAC KPI population isolation |
| check_u1_c50.mjs [output JSON] | Existing special-job progress/completion/replacement/history/permission rules |
| check_u1_c50_browser.mjs [base] [output folder] | Actual progress/edit/completion/repair/replacement/phone/permission interactions |
| check_u1_c51.mjs [output JSON] | Shared type-wide Project/special-job identity and scope rules |
| check_u1_c51_browser.mjs [base] [output folder] | Shared-job forms/cards/progress/future members and phone/read-only behavior |
| check_u1_c57.mjs [base] [output folder] | Retained FAC charts/proof/filter/phone/TV behavior |
| check_u1_c35.mjs [base] [output folder] | Selected spare Add/Update/history/permission behavior |
| check_unified_viewer.mjs [base] [output folder] | Shared Flat/3D selection/camera/lifecycle, legacy link, phone/keyboard and model/WebGL failure paths |

The C50 browser runner derives job/action expectations from the current shared job register instead of old fixture counts. C51 registration explicitly supplies one of the two statuses and uses the returned stable ID. The viewer runner resolves legacy QC links with URL(base), avoiding a malformed index.htmlqc URL. These corrections retain their functional assertions.

Older dated P02/P02B/U1 regression scripts are preserved as historical evidence. In particular check_p02b.mjs, check_p03_panel.mjs, check_u1_r8.mjs and check_u1_c59.mjs contain withdrawn CMMS/three-status/six-KPI/four-tab expectations; they are not current acceptance or an instruction to restore removed behavior. Earlier check_prototype/capture scripts also describe their original UI snapshots. Relevant retained behaviors are covered by the active checks above; inspect the full 97-case applicability ledger for remaining future-working-app cases. No meaningful check is silently deleted or counted as passed.

U1 remains NOT APPROVED. The temporary wrapper and TD07-TD08 cleanup are a separate gate; no build phase is advanced by these checks.

28 October 2026 U1-C64 / D-212 follow-up: the user's later instruction restores a 2.5-second background pulse only for active Isolated Fleet equipment and removes the thick left-edge strip. `check_u1_c64_browser.mjs` covers the presentation, timing, motion preferences, Pause and retained manual transitions. The affected C63 layout assertion now permits this narrowly specified motion while continuing to reject CMMS/source/sync controls. C63's dated results remain evidence of its original no-blinking snapshot; formal working-app acceptance remains NOT RUN. See `docs/evidence/U1/fleet-isolated-c64/REPORT.md` for the current focused checks.
29 October 2026 U1-C65 / D-213: model revision 7 adds the trolley-runway area (12 areas in `check_flat_isolation.mjs`) and the Technical-tab component data. `tools/u1/capture_c65.mjs [outDir]` captures the new parts and area panels and reports rendered data groups and browser errors. Pass an explicit output folder to `check_flat_isolation.mjs` (argument 2); `tools/p03/check_bindings.mjs` always writes `docs/evidence/P03/binding-validation.json`, so copy and restore that dated file after a run. Results: `docs/evidence/U1/qc-technical-c65/REPORT.md`.

29 October 2026 U1-C66: `check_u1_c66.mjs [base] [output folder]` covers the three label modes, automatic mode changes and the Technical switch on part selection. `check_unified_viewer.mjs` step 05 asserts the label modes in place of the withdrawn on/off toggle. Results: `docs/evidence/U1/label-modes-c66/REPORT.md`.

29 October 2026 U1-C68: `check_u1_c68.mjs [base] [output folder]` covers the component parameters in the parameter model (groups, sources, conflicts, Admin decision, Admin filter, read-only roles). `check_u1_c51.mjs` currently stops at its 20th check in the Node harness (409 `local_status_changed` from the C63 storage guard); this predates U1-C68 and is recorded in `docs/evidence/U1/parameter-model-c68/REPORT.md`.

5 November 2026 U1-C69 / D-218: `check_u1_c69.mjs [base] [output folder]` covers History on crane-view Spare part status cards (floating panel over the model, content, no edge strips, focus, closing rules, permissions, RTG, phone), the flag-chip filters (crane view and EQ Jobs) and Spare parts condition as the first/default EQ Jobs tab. `check_u1_c64_browser.mjs` check 1 (Fleet pulse iteration within 8 s) is timing-sensitive in the headless container on HEAD as well; rerun it alone. Results: `docs/evidence/U1/spare-history-c69/REPORT.md`.

5 November 2026 U1-C70 / D-220: `check_u1_c70.mjs [base] [output folder]` covers the QC tree from the component workbook (workbook names, assemblies first, RTG unchanged), the "Excel items only" tick, group selection (URL, breadcrumb, panel, Technical tab, 3D highlight), placement orientation (LHS / gate house end = -Z), group read scope, workbook 3D labels, old main/sub/part links, QC03 draft positions and phone. `check_unified_viewer.mjs` steps 02/04/07 and `check_u1_c66.mjs` step 02 now navigate the workbook rows (Main Hoist > Hoist Drive Mechanism > Main hoist motor A; Trolley) instead of the withdrawn 01 > 011 tree rows; their assertions are otherwise unchanged. After editing the workbook import, rerun `python -I tools/u1/import_qc_components.py`, `node tools/model-generator/generate.mjs` and `validate.mjs`. Results: `docs/evidence/U1/qc-workbook-c70/REPORT.md`.
