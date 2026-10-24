# U1-C42 editable card controls and plain FAC cards - 24 October 2026

FAC Jobs cards now use a plain white surface, equal 1 px neutral borders, modest corners and neutral icon backgrounds. The coloured status stripe is removed. Status/due text and compact pills retain their operational meaning. Dashboard motion/TV styling is outside this change.

Show remains an editable checkbox directly on each card for FAC Team/Admin and EQ writers in their respective section. The earlier Show: On screenshot was the read-only representation used by Management/other read-only roles; those roles still cannot mutate records. The preview is left as FAC Team.

Quick edit is available from FAC cards and list rows, using existing forms and command permissions. FAC Team's progress action opens quantity, work date, note and photos. Where job-details editing is allowed (master-list permission, or an eligible own one-time job before updates), Quick edit opens the job-details form; Update progress remains separate there. Held/finished-cycle restrictions remain. EQ's existing card Edit action remains. No role defaults or permission matrix were changed.

Focused local browser observations:

- FAC Team board has 33 editable visibility checkboxes in its initially rendered cards. Toggling Caisson joint Inspection updates its hidden badge on the card and can be restored without opening the job.
- Computed left/right borders are both 1 px and rgb(213, 224, 232); no status-coloured edge remains.
- FAC Team Quick edit opens the progress dialog from the board. Saving quantity 1 and a test note changes Caisson joint Inspection from 0/3 to 1/3 (33%) while the URL remains `#/fac/jobs?view=board`.
- Admin Quick edit opens the job-details dialog. Saving a test remark closes the form without navigation; reopening shows the saved remark. Admin list rows expose 40 Quick edit buttons in the initial page.
- At 375x812, document width is 360 px, and Show and Quick edit targets are both 44 px high. Filters remain collapsed by default and actions remain outside them.
- Test visibility changes were restored. Reloading the synthetic prototype discarded the progress/remark test edits and restored the reference fixtures. No shared or production records were changed.

Evidence: final `fac-desktop.jpg`, `fac-phone.jpg`, and the user's `reference-show.png` / `reference-card.png`. Syntax and whitespace checks are recorded with the combined C41/C42 handover. These are local prototype checks, not an independent R review or production acceptance. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 is Not started.**
