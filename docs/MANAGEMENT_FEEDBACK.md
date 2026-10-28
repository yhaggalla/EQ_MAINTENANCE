# Management walkthrough feedback register

28 October 2026 final U1-C63 result: all eight management changes implemented; 342/342 authored checks across 11 suites passed; fresh independent fallback R02B review PASS with all findings closed. All 97 formal cases reviewed; working-app acceptance NOT RUN. Evidence: `docs/evidence/U1/asset-management-c63/REPORT.md`; independent report: `docs/evidence/R02B/review-20261028-U1-C63.md`. U1 NOT APPROVED; P04/P05 Not started; TD07-TD08 cleanup pending.




28 October 2026 MF-04 / U1-C64 / D-212: user requests removal of the annotated thick left red strip and Isolated card blinking every 2.5 seconds. Implemented in the local Fleet with uniform boundaries, background-only pulse for active Isolated equipment, static Ready/retired cards, compact normal/TV Pause and live reduced motion / motion=off. Manual status and CMMS removal retained. Final browser checks 63/63 focused + 68/68 affected C63 PASS; syntax/whitespace and screenshot inspection PASS. Evidence: `docs/evidence/U1/fleet-isolated-c64/REPORT.md`; UX section 57. Fresh independent review pending; U1 NOT APPROVED. Preserve on temporary-wrapper removal; cleaned checkpoint/TD07-TD08 pending.

28 October 2026 MF-03 / U1-C63: implementation confirmed and completed in the synthetic prototype; independent final review recorded separately. All eight outcomes have direct prototype coverage. Prior awaiting-confirmation notes are historical. U1 remains NOT APPROVED; temporary-wrapper cleanup and cleaned-app TD07-TD08 remain pending. See `docs/evidence/U1/asset-management-c63/` for the 97-case applicability ledger, current checks and review findings/repairs.

28 October 2026: MF-03 / U1-C63 documents the eight management changes; implementation awaits user confirmation and U1 is NOT APPROVED. Earlier completed rows remain historical; supersede their Maintenance/Unreported/sync/blink requirements where revision 7 conflicts.

24 October 2026 | SOW V2 revision 6 | Prompt pack 2.2 | B-23 / D-204

Accepted EQ/FAC requests are recorded below. Completion of a refinement does not approve the U1 checkpoint.

For each request record: ID/date, original comment, EQ/FAC screen or Portal area, requested outcome, acceptance criteria, user decision, affected SOW/UX/data/API/pack records, U1-C ID or future phase, implementation/evidence, and the cleaned app checkpoint containing it. Decisions are Pending decision, Accepted for U1, Deferred (with target phase/reason), or Rejected (with reason). Accepted changes become Implemented/verified only when evidence exists; user U1 approval remains separate.

EQ/FAC requests accepted by the user follow the existing U1 refinement/Repair process. Update affected requirements before implementing a scope change, demonstrate the result again and retain it after wrapper removal. Production work remains in its gated phases. Login/Portal feedback is recorded as Deferred to P05 actual Portal integration or the relevant later phase; it does not expand this temporary demo and does not block U1.

Before U1 approval, remove only the temporary login/Portal layer. Verify the initial app baseline plus all accepted EQ/FAC refinements, check each accepted request against its criteria, resolve or explicitly defer pending requests, and record the exact cleaned commit/tree. Cleanup must preserve accepted refinements even in files shared with temporary wiring.

| ID/date | Request and area | Required outcome / acceptance criteria | User decision | U1-C ID / future phase | Requirements / evidence / cleaned checkpoint |
| --- | --- | --- | --- | --- | --- |
| MF-01 / 2026-10-25 | EQ Fleet: add type summaries to status cards and compact the strip; later "add KPI icons"; "continue.. then commit.." | QC/RTG/ES counts reconcile to active type-scoped headlines; six small label icons; compact percentage/Unreported; desktop/phone/TV fit and filtering retained | Accepted for U1; implemented/verified | U1-C59 / D-208 | UX section 54; exact request in `docs/runs/Repair-U1-C59-20261025.md`; `docs/evidence/U1/fleet-summary-c59/REPORT.md`, 27/27 + 37/37. Retain Fleet JS/CSS refinements on REMOVE. Accompanying checkpoint contains implementation; cleaned app checkpoint / TD07-TD08 pending. |
| MF-01 follow-up / 2026-10-25 | "?? no icons?" after C59 checkpoint | Show QC/RTG/ES equipment illustrations with the type counts, retaining compact layout and small status icons | Accepted for U1; corrected/verified | U1-C59 / D-209 | UX section 54; `docs/evidence/U1/fleet-equipment-icons-c59/REPORT.md`, 27/27 including visible matching artwork assertions. Preserve on REMOVE; cleaned checkpoint pending. |
| MF-02 / 2026-10-26 | Remove the quoted synthetic-data/sign-in/CMMS/persona sentence from demo view | Sentence absent in EQ/FAC banner; PROTOTYPE and working controls retained | Accepted for U1; implemented/verified | U1-C62 / D-210 | UX section 55; `docs/evidence/U1/compact-demo-banner-c62/REPORT.md`, 13/13 desktop/phone browser checks. Included in accompanying user-requested local checkpoint; preserve on REMOVE, cleaned checkpoint pending. |

| MF-03 / 2026-10-28 | Eight management changes: name, CMMS/automatic/blinking removal, two manual statuses/Long term isolated EQ, crane tab order/default, Jobs Daily work removal/manual status and four Fleet KPIs | All eight outcomes and AM01-AM11 in docs/MANAGEMENT_SCOPE_REVISION_20261028.md; preserve retained EQ/FAC/IDs/history; confirm implementation separately | Documentation requested; implementation awaiting confirmation; U1 NOT APPROVED | U1-C63 / B-26 / D-211; affected U1 Repair after confirmation | SOW V2 r7; pack 2.3; current contracts; docs/evidence/U1/asset-scope-20261028/REPORT.md. New runtime checks NOT RUN; cleaned checkpoint pending. |
