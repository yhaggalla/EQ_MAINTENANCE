# U1-C67: elevator landings and similar access clashes

29 October 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C66-20261029.md` (C67 section) | D-216

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.**

## Fault

At each elevator level (6500 / 15615 / 47845 / 53430) the model had two platforms: the stair tower's small outer landing and a separate elevator landing that started at the back of the stair tower, overlapped the stair landing by about 0.1 m and hung about 0.9 m outboard of it, with its own handrails running across the stair. J526A5100 note 2 requires every elevator landing to be flush with the stair platform of that level.

## Correction (model draft v1 revision 7, regenerated in place; no binding active, keys unchanged)

- At the four elevator levels the stair tower's outer landing extends out to the line in front of the car door (car door line minus the 1000 landing depth), with edge beams; the elevator landing now starts at the stair tower's seaside edge and continues it on the seaside at the same level and depth: one flush platform, one outer handrail, a side handrail along the car, and a tie to the mast frame.
- The stair tower's seaside outer corner post, which would stand in the passage between the stair and the elevator landings, is removed; the landside corner post stays.
- Similar check across the access structures (girder tail, festoon platform, A-frame stair, portal-top platform, cab walkway, tie-beam walkways): the girder end diaphragm stood 0.5 m above the girder top across the full width, so all three girder-tail stairs passed through it. It now finishes flush with the girder top (the trolley end stops are part of `trolley.rail.girder` since U1-C65). No other clash found in these views.

`model_diff.mjs` against Git HEAD (C65 + C66 + C67): 10 added, 0 removed, 24 changed, 0 identity changes.

## Checks (actual results)

validate.mjs 26/26 PASS; check_bindings.mjs 11/11 PASS (dated P03 output restored); unified viewer 11/11; flat isolation 19/19; C66 label modes 14/14; C63 browser 68/68 (`regression/`). Before / after captures: `before-*.png`, `after-*.png`, 0 browser errors.
