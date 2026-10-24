# U1 temporary management walkthrough scope revision

24 October 2026 | Documentation task only | User-requested targeted SOW V2/prompt-pack exception to ordinary source protection

User request:

> Change the V2 scope, prompt pack and required documents for a temporary management workflow. At http://127.0.0.1:5312/ show the same ENG Portal login screen, with no username/password setup or checking when login is pressed. Then show the same Portal screen with the three UMMS, PayPrep and Safety cards as placeholders and a new EQ & FAC Maintenance card opening the app's default screen. Do not implement Portal administration, user creation or other Portal features. This is a temporary step before U1 approval; remove the temporary login/Portal before approval so only the currently committed version passes through U1.

Execution interpretation: revise the documents in this turn; do not implement runtime code. The current clean committed app is `8303f8b8a55f41983bdcc77363ddbf13d2892383`, through U1-C58. Portal source is a read-only appearance reference, clean at `47f7bd9d8296fda56114d8239e10ae9ad7850460`. No clarification was needed. Permanent V2 functionality and real P05 integration remain required.

Deliverables: synchronized SOW V2 revision 5 Markdown/DOCX copies, prompt pack 2.1 with the temporary specification and build/removal prompts, eight separate temporary checks, mandatory baseline restoration before U1 approval, updated project/UX/Portal/architecture/implementation records, checksummed manifest and a new versioned ZIP. U1 remains open; temporary BUILD not started; TD01-TD08 NOT RUN. No formal phase or review executed.

Verification record: `docs/evidence/U1/temp-management-scope-20261024/REPORT.md` and `checks.json`. Word artifact edits followed the documents skill using the bundled Python/Node runtimes. The packaged renderer was attempted, then hidden Word PDF export and bundled Poppler were used because LibreOffice is unavailable. Final 17-page visual review completed. All phase/helper prompts extracted via `tools/extract-phase.ps1`; no phase was run.
