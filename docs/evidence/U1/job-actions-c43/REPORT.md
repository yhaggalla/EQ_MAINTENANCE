# U1-C43 single-row EQ/FAC job actions - 24 October 2026

FAC and EQ card action rows no longer wrap. Scoped spacing/type sizes keep desktop buttons 32 px high; phone controls remain at least 44 by 44 px. FAC phone actions use text labels without redundant icons. The progress action is labelled Update progress, matching the user's reference; Quick edit remains a separate job-details action where existing permissions allow it. Show is unchanged.

EQ cards use labelled icon buttons for Open, Edit and Cancel, with full titles and accessible names. Start remains text, Return to Pending is visibly Pending with its full accessible name/title, and Complete is concise text. Detail-page actions retain their full labels. Permission checks, cancellation explanations and all command/dialog handlers remain.

Focused local browser observations with synthetic fixtures:

- At 1670x900, all 33 initially rendered FAC action rows and all 19 EQ rows occupy one line with no row overflow. Maximum action-row height is 36 px including focus padding.
- The referenced Fire pump house / pump controls inspection card has Done today, Update progress and Hold on one line. Update progress still opens its quantity/date/note/photo form directly from the board; cancelled the form without changing progress. Show was toggled off/on and restored on the card.
- At 375x812, all 33 FAC and all 19 EQ rows remain one line with no row overflow. The minimum button dimension is 44 px, maximum row height 48 px including padding, and document width 360 px. The referenced FAC row fits its 289 px width.
- EQ's compact Edit button opens the existing edit form for the selected job; cancelled without changes. Accessible Open/Edit/Cancel names and disabled-cancellation explanations remain in the rendered cards.
- At 320 px, all EQ rows remain one line and the page remains 320 px wide. Eleven rows with five actions pan locally, preserving button size and keyboard reachability rather than wrapping or overflowing the page.
- JavaScript syntax checks and scoped whitespace checks pass. No new test suite was added for this presentation change.

The existing localhost server stopped during verification. Confirmed no listener on 5312, restarted the same read-only `serve.mjs` bound to 127.0.0.1 in a hidden process, and resumed in a fresh in-app browser tab because the old tab was stuck on its connection-error document. Startup log: `server.log`; `server-error.log` is empty. No IIS, firewall, production or shared data changes.

Evidence: `fac-desktop.jpg`, `fac-phone.jpg`, `eq-desktop.jpg`, `eq-phone.jpg`, and the user's `reference.png`. Runtime files under `artifacts/prototypes/p02-ui/`: `css/jobs.css`, `js/views-jobs.js`, `js/views-facjobs.js`, and versioned includes in `index.html`. Previous C38-C42 work and unrelated edits remain preserved. The preview returns to FAC Team / Board with cleared search and temporary viewport overrides reset.

**U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 is Not started.** This is local prototype verification, not an independent R verdict or production acceptance.
