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
