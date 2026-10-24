# Temporary management walkthrough scope revision evidence

24 October 2026 | SOW V2 revision 5 | Prompt pack 2.1 | U1-T01 / B-22 / D-203

Outcome: requested temporary workflow is documented. BUILD not started; TD01-TD08 NOT RUN. U1 remains IN PROGRESS / NOT APPROVED; P04/P05 remain Not started. Runtime source and the Portal reference repository are unchanged at their inspected commits.

The temporary flow is root port 5312 -> existing Portal login appearance, accepting blank/arbitrary input -> matching launcher with three inert existing-app cards plus EQ & FAC Maintenance -> current app default. Full temporary-layer removal and verification against app baseline `8303f8b8a55f41983bdcc77363ddbf13d2892383` are required before recording U1 approval.

## Verification

PASS: 34/34 scoped documentation, source, extraction and packaging checks; detailed results in `checks.json`. All 26 phase/helper extractions include the removal gate. The original 94 acceptance cases and 27 model profiles are preserved. Pack metadata lists 15 hashed files plus its manifest; the new versioned ZIP contains all 16. Original drawings, V1 SOW, source photos/workbook/reference data and older ZIPs remain unchanged.

Word QA: the packaged renderer failed because `soffice.exe` is unavailable. A separate hidden Word COM instance exported the final DOCX; bundled Poppler `pdftoppm.exe -r 110 -png` rendered 17 pages. All 17 final page images were inspected, including section 2A on page 2 and the updated checkpoint/decision rows. Text is readable without clipping/overlap. Existing table structure/source list retained. Title/heading text is black with no title rule. Both DOCX copies match SHA-256 `7ebfd132cda8896136bcf85584518fb13f237c6da6d2c9a6ae3e25ab4c8c1909`. QA intermediates remain under ignored `tmp/management-scope-render/`.

Pack ZIP: `documents/EQ_MAINTENANCE_PROMPT_PACK_v2_1.zip`, SHA-256 `b0690c3e5f51ff8348a71a05472847eaeb559d1c7134390f9e701833e0f7d469`.

## Boundary

No browser workflow or real authentication test was performed: the temporary layer does not exist yet. No application build, new R verdict, U1 approval, Portal edit, external app/ZMMS access, database operation, live IIS change, deployment or package publication. No Git commit was created. Markdown/DOCX sources, pack instructions/metadata and project records were updated only. Exact request/context is recorded in `docs/runs/U1-temp-management-scope-20261024.md`.
