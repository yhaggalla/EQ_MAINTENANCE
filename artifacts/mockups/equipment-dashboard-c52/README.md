# Equipment workspace - proposed dashboard styling

24 October 2026. Visual mockup delivered for review before implementation. That initial delivery changed no application files, business rules, source authorities or U1 approval status and created no commit. The user subsequently approved implementation, UI review and commit. This directory is retained as the approved design reference; implementation evidence is in `docs/evidence/U1/equipment-style-c52/REPORT.md`.

## What felt inconsistent

- Saturated left borders on every special-job card, inside another outlined panel.
- Job numbers given stronger link emphasis than job titles, with Repair/Replacement shown as extra badges.
- Repeated equipment heading, Special jobs heading/count, tab badge and status badge row in one narrow panel.
- Several tightly packed segmented controls and camera buttons competing in the viewer header.
- Dashed technical labels in Overall mode competing with the visible main assemblies.
- Blue-tinted outlines/backgrounds and heading colour that differ from the existing warm-neutral dashboard cards.

## Proposed arrangement

Use the existing dashboard tokens from `artifacts/prototypes/p02-ui/css/eq-fleet.css`: warm `#f2f2ee` page, white cards, `#e2e4de` borders, dark `#1b2733` text, restrained shadows and 14 px major corners. Keep the navy/gold application shell. Gold identifies the selected tab/tree row; green and amber identify labelled statuses.

Keep one equipment summary and one operational-status label. Give viewer modes/area the top row, with camera/label controls below the model. Overall shows key part labels; full technical labels remain available through the existing Technical mode/tree in the approved implementation. The crane image is a screenshot of the actual current drawing-derived model, not an invented replacement model.

Use one compact information header with the four existing tabs, search and a single status-filter row. Remove coloured job-card edges. Lead with clickable job titles, show kind/target as plain metadata and keep completion/plan dates plus current matching-position summaries. The repeated equipment heading, extra Special jobs heading and visible job-number links are omitted. Record numbers remain in hover titles in the mockup and remain in job details/search in the implementation. View in Jobs remains the route to the complete scoped record list. Do not add private progress/history data to the current-state panel.

## Files and review boundary

- `mockup-desktop.png`: full proposed desktop workspace, 1680 px wide.
- `mockup-details.png`: readable close-up of the proposed information/job panel.
- `index.html`: standalone interactive visual mockup. Job filters, search and label toggling demonstrate the layout; application actions display a mockup-only notice.
- `crane-source.png`: the original model viewport captured in a disposable headless browser with labels/work markers switched off. Geometry and paint are unchanged.
- `capture-source.mjs`, `capture-mockup.mjs`, `source-capture.json`, `preview-checks.json`: reproducible captures and basic presentation checks.

Serve this directory at localhost:5317. Current mockup browser checks: no desktop horizontal overflow, five initial job cards, working sample status filter/search/label toggle and no browser errors. Desktop and detail screenshots visually inspected. These are presentation checks, not new application or production acceptance evidence. The implementation report records the subsequent responsive, real-control, selection/Flat/3D and current-state permission checks. The mockup-only controls remain demonstrations.

User request: "this screen still shows typical AI created look areas.. find those and rearrange it to tally with dashboard UI styles.. give me a mockup view before implementing.." The two attached screenshots are visual references only. Subsequent authorization: "do the implementation.. review the UI.. then commit.." Approval covers this layout adjustment; U1 remains open and unapproved.
