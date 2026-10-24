# U1-C44 FAC filters, wildcard search and wheel scrolling

24 October 2026. Direct Codex refinement of the local P02/P02B synthetic prototype, S16/S27/S29. No delegated phase or independent R verdict; runtime model/effort not independently recorded.

The filter icon now occupies the toolbar, with filters hidden by default and no empty row. It exposes its expanded state and active count to assistive technology. Clicking toggles the row; Escape collapses it and restores focus. Criteria remain active while collapsed. Wildcard search combines with the existing filters, is case-insensitive and uses `*` for any text and `?` for one character. Other punctuation is literal, with a greedy glob matcher rather than dynamic regular expressions. Search covers job description/number, PIC, discipline/type/mode/frequency and remarks. All dashboard blocks share the filtered job population, including the on-time numerator/denominator and permission-gated export.

Each lane now handles vertical wheel input while its moving track is paused on hover/focus or by Pause. Wheel movement is bounded to the lane and leaves page scrolling available at its boundaries; leaving the pointer resumes existing automatic motion. Static native scrolling, reduced-motion discrete pages, Ctrl/Meta-wheel browser behavior, phone combined list and TV layout are retained.

## Verification actually performed

Follow-up requested by the user: removed the visible wildcard syntax hint below Search jobs, its now-unused `aria-describedby` reference and helper-text style. A focused local browser check confirmed both helper/reference are absent, `fire*pump` still returns two jobs, and there are no browser errors; JavaScript syntax also passes.

- `node tools/p02b/check_u1_c44.mjs`: **26/26 PASS**, using a disposable headless Chrome profile against `http://127.0.0.1:5312/`. Includes default collapse and expansion, input focus, combined `*`/`?` search, literal punctuation, zero matches, nonempty and empty on-time cycles, ticker/proof scopes, changing search before export, Clear filters, Escape/focus, real wheel down/up in all three lanes, isolation while paused/hovered, wheel units, browser zoom and boundary propagation, auto-resume, native static scrolling, emulated OS reduced motion, TV footer fit, 375 px phone and landscape fit, and no browser errors. `checks.json` records the results.
- `node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/fac-controls-c44/r02b-regression.json`: **10/10 PASS**, covering existing current-state payload isolation and filtered FAC on-time calculations.
- The same 26 browser checks also pass against a temporary copy containing HEAD plus only this request's staged runtime files, using port 5316. `commit-content-checks.json` records that separate run; it confirms the commit works without the earlier uncommitted FAC restyle. The unchanged P03 vendor files were exposed read-only to satisfy the prototype's existing module imports.
- Screenshots inspected: `desktop-collapsed.png`, `desktop-expanded-search.png`, `tv.png`, `phone.png`. Annotated user references are retained alongside them.
- JavaScript syntax and Git whitespace checks pass. No bundler/build is required for this static prototype.

Runtime files: `js/views-fac.js`, `js/fac.js`, `js/util.js`, `index.html`, new `css/fac-dashboard-controls.css` under `artifacts/prototypes/p02-ui/`. Repeatable browser verification: `tools/p02b/check_u1_c44.mjs`. Project records: `docs/DECISIONS.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/HANDOVER.md`, `docs/UX_SPEC.md`; exact request: `docs/runs/Repair-U1-C44-20261024.md`.

Earlier uncommitted C38-C43 and RTG work is preserved outside this commit; the new controls stylesheet also works with the committed original FAC presentation. No source authority, Portal, production, IIS, SQL or live ZMMS changes. This is local prototype verification, not application/production acceptance. **U1 remains IN PROGRESS / CHANGES REQUESTED, NOT COMPLETE and NOT APPROVED; P04 remains Not started.**
