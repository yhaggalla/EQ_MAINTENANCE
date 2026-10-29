# U1-C66: selected-label highlight and rope paths

29 October 2026 | Direct U1 refinement (Claude Code, Opus 5.5) | Request: `docs/runs/Repair-U1-C66-20261029.md` | D-214

**U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED. P04/P05 Not started.** Local synthetic prototype only; no independent R verdict.

## Selected part label

The selected part's viewer label is a filled chip in the selection blue with white 13 px bold text, a white inner ring and a yellow outer ring, drawn above the other labels (z-index 3); its leader line is drawn in the selection colour. Other labels stay 11 px on pale backgrounds. Measured in headless Chrome for Main hoist motor A and the seaside catenary trolley: exactly one `.qc-label.sel`, background rgb(22,119,255), text white, 13 px / 700. Files: `artifacts/prototypes/p02-ui/css/equipment-dashboard.css`, `artifacts/prototypes/p03-qc-model/js/viewer.mjs` (leader class). Captures `label-*.png`.

## Rope paths (model draft v1 revision 7, regenerated in place; no binding active)

Every free rope run is now a straight line tangent to the sheaves it joins and every wrap is an arc at the rope-centre radius. Before, wraps were straight chords across the sheaves, ropes passed beside or through parts, and one catenary rope ended in mid-air.

| Area | Change |
| --- | --- |
| Boom tip | One main hoist sheave per rope lane (2 per side at 2450 / 2750 from the centreline); the ropes previously ran beside a single sheave. Tangent arrival and arc to the equalising cross-over (load-cell geometry unchanged). Trolley-rope sheaves raised on pedestals so their bottoms are at the trolley-rope return height: level return run to the trolley equalizer sheaves. Catenary rope wraps the boom-tip catenary sheave and ends at a clamp on a bracket of the seaside catenary trolley. |
| Trolley | Catenary rope end clamps on posts at both trolley ends. |
| Catenary trolleys | Low cross frame below every rope run; hoist-rope rollers at the height of the hoist-rope runs, idlers under the trolley-rope return run, catenary sheaves at the catenary rope heights; roller boxes on the hoist rope lanes. |
| Girder tail | One anti-snag tail sheave per hoist rope (4 in total, manual 1.3.1.4), so no rope runs through another sheave; base frame kept below the ropes. Trolley-rope tail sheave level with the return run; tension cylinders beside the sheaves. Catenary tensioner rebuilt: post at the tail end, lever with two sheaves, rope under both sheaves, around the landside one, to a rope clamp. Trim/list/skew power unit moved between the centreline and the trolley-rope lane. |
| Machinery house | Ropes leave through end-wall openings above the walkways (handrail gaps at the rope lanes) and return under the floor; frame cross-members only outboard of the trolley rails; re-reeving reels hung from the wall and roof instead of floor posts that crossed the drum ropes. |
| Apex and boom blocks | Drum rope tangent to the apex guide sheave; common tangent from the guide sheave to the fall groups; each fall tangent to its apex and boom-block sheaves (alternating sides). Boom-block cross-beam moved above the trolley path, seaside of the sheaves, so falls no longer pass through it; block posts and forestay brackets moved outboard of the trolley rail. |

`node tools/u1/model_diff.mjs` against Git HEAD (covers C65 + C66): 10 added, 0 removed, 21 changed, 0 identity changes; hotspot points moved for `trolley.skew-system.main` and `trolley.tension.main`. Draw calls 213 / 230, triangles 76814 / 150000.

## Checks (actual results)

| Check | Result |
| --- | --- |
| generate.mjs | no landmark failures |
| validate.mjs | 26/26 PASS |
| check_bindings.mjs | 11/11 PASS (dated P03 output restored from Git) |
| check_unified_viewer.mjs | 11/11 PASS |
| check_flat_isolation.mjs | 19/19 PASS |
| check_u1_c35.mjs | 11/11 PASS |
| check_u1_c63_browser.mjs | 68/68 PASS |
| capture_ropes.mjs / capture_label_c66.mjs | 0 browser errors; views inspected |

Rope review views: `user-view`, `tip-*`, `trolley-*`, `tail-*`, `house-exit`, `hinge-catenary`, `apex*`, `boom-blocks*` (labels off). Software WebGL in headless Chrome.

## Limits and open items

- Rope paths remain simplified (single run per catenary lane; equalising cross-over drawn straight).
- Observation, not changed: with the estimated machinery-house floor (53.0) the trolley top (about 53.3) would not pass under the house or under the boom-hoist sheave blocks at Z2/Z3 (sheave bottoms about 53.25); the display pose has the trolley at outreach, so this is not visible. Confirming the house floor and boom-block heights from J526A3000 / J526A2300 would resolve it.
