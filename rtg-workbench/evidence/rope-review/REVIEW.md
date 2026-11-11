# Rope and spreader cable review - revision 2.8, 5 November 2026

The highlighted outboard spool and angular cable run did not match the supplied CICT photographs. The fixed cable also intersected the hoist-drum envelope. This review updates the same standalone model; the 300 selectable node keys and synthetic binding identities are preserved.

## Evidence read

- M14, PDF pages 16, 21, 26-28: nominal drum/rope data, JL28606 arrangement, eight-rope topology, twelve trolley sheaves and paired headblock terminations.
- M13, PDF page 13: eight groove groups, ordered rope lengths and the unresolved 29 mm versus M14's 28 mm diameter conflict. The existing 28 mm visual choice remains qualified.
- WA-04/06/07/08: low deck guide sheaves, inclined rope leads, dark wound drum and clamp groups.
- WA-15/17: an open yellow storage basket, guide cage, centre cone and coiled electrical cable.
- WA-19: under-trolley cable runs. No supplied view establishes the old large outboard motorised spool or its across-drum cable route.

Original PDFs and photos are unchanged. Source crops and the photo register accompany the package.

## Corrections

1. Replaced the unsupported spool with a compact fixed cable-feed envelope and hollow red bellmouth below the trolley. The supply cable follows a smooth under-deck route with approximately 0.29 m clearance from the conservative wound-drum envelope. Mounting details and SCF1 internals remain estimated. The legacy `hoist.spreader-cable.reel` key is intentionally retained, with its label and geometry corrected.
2. The electrical drop ends at the basket guide eye and joins a curved cable segment feeding the stored coils. The basket is hollow, not a capped solid cylinder. The moving span stays attached through the full displayed hoist range. Stored coil count is illustrative, not a cable-storage simulation.
3. Lowered the four guide sheaves to the deck area and inclined them to their drum leads. Their quarter-turn wraps and outgoing leads share the same sheave planes. The estimated pitch diameter remains 840 mm; guide angles are geometric assumptions, not measured site angles.
4. The eight fall ropes lie in the same planes as their fall sheaves and paired headblock pins. Their sheave wraps end at the live tangent, and the sockets/turnbuckles pivot at the pins to remain collinear. This removes both the extra fixed-wrap tail and the former sharp rope-to-socket bends.
5. Replaced bright drum rings with eight dark wound-rope groups and clamp details. Ten displayed turns per group and their pitch are visual assumptions. Drum rotation uses mean free-length change including the moving wrap; exact groove payout and dead wraps remain unresolved.
6. Cleared the rope routes through the model's motor/brake bases, guide bearing supports and oversized leg-head plates. The latter now follow the girder width. These are corrections to estimated model envelopes, not changes to a certified crane design.
7. Fixed an existing extra-argument bug that discarded drum/trolley-wheel motion metadata and the cabin enclosure marker. Gantry travel and steering remain disabled.

## Verification and limits

`node tools/check-reeving.mjs` reads the generated GLB in the real viewer. It checks 15 combinations of five lift positions (1, 5, 12, 18, 21.2 m) and three trolley positions (-9.25, 0, +9.25 m). It compares actual world-space rope ends, wrap endpoints and socket tips, checks fall-plane alignment and tangency, and scans centrelines plus four radial offsets against exported triangle surfaces. Other sheaves are included; intended contacts with each rope's own sheaves/socket and the cable's own feed are excluded. See `checks.json` for results and asset hash.

This is a targeted visual/geometric regression check, not a complete solid-interference analysis or rigging certification. Shaft coordinates, groove assignment, direct-lead fleet angles, exact guide arrangement and vendor cable-feed details still require issued JL2860603/SCF1 drawings. Rope totals in the manual are not reproduced by the illustrated exposed lengths. Main EQ application integration remains outside this standalone revision.


Executed result: **PASS** for all 15 poses, with no targeted surface intersections. Maximum wrap-to-span join error was 0.000000796 m; socket and cable endpoint errors were below 1e-12 m. Asset/contract checks 14/14, dimensions 20/20, browser checks 24/24, strict types, independent host, embedded artwork and deterministic rebuild checks passed. All 315 semantic keys/classifications (300 selectable parts) are unchanged; both manuals and all 28 new photo originals match their recorded hashes.
