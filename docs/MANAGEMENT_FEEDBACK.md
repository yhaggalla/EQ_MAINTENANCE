# Management walkthrough feedback register

24 October 2026 | SOW V2 revision 6 | Prompt pack 2.2 | B-23 / D-204

No specific management change requests have been recorded yet. This register defines how to record them; it does not invent approvals or requirements.

For each request record: ID/date, original comment, EQ/FAC screen or Portal area, requested outcome, acceptance criteria, user decision, affected SOW/UX/data/API/pack records, U1-C ID or future phase, implementation/evidence, and the cleaned app checkpoint containing it. Decisions are Pending decision, Accepted for U1, Deferred (with target phase/reason), or Rejected (with reason). Accepted changes become Implemented/verified only when evidence exists; user U1 approval remains separate.

EQ/FAC requests accepted by the user follow the existing U1 refinement/Repair process. Update affected requirements before implementing a scope change, demonstrate the result again and retain it after wrapper removal. Production work remains in its gated phases. Login/Portal feedback is recorded as Deferred to P05 actual Portal integration or the relevant later phase; it does not expand this temporary demo and does not block U1.

Before U1 approval, remove only the temporary login/Portal layer. Verify the initial app baseline plus all accepted EQ/FAC refinements, check each accepted request against its criteria, resolve or explicitly defer pending requests, and record the exact cleaned commit/tree. Cleanup must preserve accepted refinements even in files shared with temporary wiring.

| ID/date | Request and area | Required outcome / acceptance criteria | User decision | U1-C ID / future phase | Requirements / evidence / cleaned checkpoint |
| --- | --- | --- | --- | --- | --- |
