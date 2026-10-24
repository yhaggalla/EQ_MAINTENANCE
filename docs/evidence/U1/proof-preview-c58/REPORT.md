# U1-C58 - larger proof preview - 24 October 2026

Enlarged the desktop/TV image column and made the photo fill the existing figure height with `object-fit: contain`. The full photo remains visible without stretching/cropping. At 1920 normal, the visible photo grows from 96x60 to approximately 176x110 (3.37 times the area). Card stays 152 px, row 152 px, main feed 392 px. At 1366 normal the image is about 161x101 in the same 152 px card. TV retains 144/128 px cards; phone image/card/row and 44 px controls are unchanged.

Runtime change: `artifacts/prototypes/p02-ui/css/fac-dashboard.css` only. Prior pending work preserved. Records: HANDOVER, DECISIONS D-202, UX section 52, IMPLEMENTATION_STATUS and exact run request.

One-off review with existing `tools/p03/cdp.mjs`: **20/20 local browser checks**, `checks.json`, no browser errors. `before.json` records the original measurements. Covered 1920x1080/1366x768 normal and TV, 375x812 phone; actual visible image area, containment, unchanged card/row/feed/button dimensions, every photo caption, Previous/Next navigation, no clipping/horizontal overflow, TV without page scrolling. Normal narrow screens retain existing page scrolling. Reviewed `proof-1920.png` and `tv-1366.png`; captures for all five layouts are in this folder. `git diff --check` passes (existing LF/CRLF notices only). No data or JavaScript change, so unrelated data/workflow suites were not repeated.

Direct Codex refinement with the previously loaded UI/UX skill; actual model/effort not independently recorded. No delegated phase/independent R verdict, no production changes. Local synthetic prototype only; changes uncommitted. U1 open/unapproved; P04 Not started.
