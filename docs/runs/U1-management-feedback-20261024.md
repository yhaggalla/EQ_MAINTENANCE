# Management feedback handling clarification

24 October 2026 | Documentation clarification only

User follow-up: "if management requests any changes, how to deal with it? except login screen and portal changes, those will be handled separately in future phases when doing actual portal integration.."

Clarification applied: accepted EQ/FAC requests become normal U1 refinements and remain after the temporary login/Portal layer is removed. Record requests, the user's decision, acceptance criteria, affected requirements, verification and cleaned checkpoint in docs/MANAGEMENT_FEEDBACK.md. Login/Portal feedback is logged for actual P05 integration/relevant later phases. Cleanup must undo only temporary patches, preserving accepted app changes even in shared files. Initial commit 8303f8b remains a reference, not a requirement to discard accepted improvements. The user still explicitly approves the cleaned EQ/FAC app at U1.

SOW V2 revision 6, pack 2.2 and related records updated. No runtime implementation, management request implementation, phase execution, U1 approval, Portal source edit or deployment. Earlier scope evidence and v2_1 ZIP retained as history; current evidence: docs/evidence/U1/management-feedback-scope-20261024/.
