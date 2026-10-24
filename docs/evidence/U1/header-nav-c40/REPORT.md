# U1-C40 equipment header navigation - 24 October 2026

Fleet is now the first button-styled link in the top summary card, before Correct status and Add special job. The duplicate equipment name below the card is removed. At whole-equipment scope the desktop toolbar row disappears. Selected scopes keep useful breadcrumbs with a Whole equipment root link. Phone drawer controls remain. Runtime changes are limited to `js/views-equipment.js` and the summary-action selectors in `css/app.css` under `artifacts/prototypes/p02-ui/`.

Focused local browser checks at `127.0.0.1:5312`, using synthetic EQ Team fixtures:

- At 1670x900, actions appear as Fleet / Correct status / Add special job, all 32 px high. No whole-equipment breadcrumb is rendered; the desktop toolbar is hidden and the viewer grid begins 6.4 px below the summary card.
- Switching Flat/3D keeps the same action order and removed breadcrumb.
- Selecting Hoist retains Whole equipment / Hoist (01), without the equipment code. Whole equipment returns to the unselected crane.
- The new Fleet link navigates to `#/eq/fleet` and renders the EQ Fleet page.
- At 375x812, all three actions are 44 px high; Mechanisms and Details remain visible, with no horizontal page overflow (document width 360 px).
- JavaScript syntax (`node --check`) and `git diff --check` pass. No new test suite was added for this presentation/navigation adjustment.

Evidence: `desktop.jpg`, `phone.jpg`, and the annotated user `reference.png`. Prior FAC/search changes and the unrelated RTG handover remain preserved. No data, permission, model, Portal, source authority or production changes. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 is Not started.**
