# U1-C59 - Fleet KPI summaries and compact icons

25 October 2026. Direct entry: `http://127.0.0.1:5312/index.html?role=eqTeam#/eq/fleet`. Local synthetic prototype only.

## Requested result

The user requested QC/RTG/ES summaries on Ready for OPS, Breakdown and Maintenance, smaller percentage/Unreported cards if needed, a pre-U1 record and a commit. The later "add KPI icons" instruction supersedes removing every icon. The final strip uses six small 14 px decorative icons beside visible labels; large icon bubbles, equipment illustrations and the percentage donut are removed from the KPI strip. Equipment illustrations below it remain.

Active equipment and the three status cards show text type/count pairs, including explicit zero status counts. Summaries use the same active, type-scoped population as their headline counts. Search/source/status filters retain existing KPI scoping. Percentage remains Ready divided by active total, with zero denominator handled. Percentage and Unreported get narrower desktop columns; phone layout uses a full-width total and paired remaining cards. TV remains read-only and paginated.

Fresh baseline: 67 active (QC 14 / RTG 46 / ES 7); Ready 7 (2 / 3 / 2), Breakdown 3 (1 / 1 / 1), Maintenance 3 (2 / 1 / 0), Unreported 54, Ready 10 percent. These are synthetic operating statuses, not verified fleet conditions.

## Verification

Commands from the repository root:

```powershell
node tools/p02b/check_u1_c59.mjs
node tools/p02b/check_u1_c54.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/fleet-summary-c59/fleet-size-regression
git diff --check
```

- Focused browser checks: **27/27 PASS**, `checks.json`. Six compact, aria-hidden icons; all summary/headline counts reconciled independently with the register; desktop narrow-card proportions; no clipping/page overflow; normal 1920/1366/375/320 and TV 1920/1366; no TV page scrolling; type/status filtering and keyboard toggle; new equipment, accepted/rejected status edits, retirement and management write denial; no browser errors.
- Shared fleet regression: **37/37 PASS**, `fleet-size-regression/checks.json`. Covers requested quantities, stable unique identities, synthetic/unreported new members, shared selectors and fleet jobs/status/Admin/TV populations. Narrowed its total type selector so added status summaries do not contaminate the baseline total assertion. Current CMMS and equipment-code changes are included in both runs.
- Screenshots inspected: normal 1920, phone 320 and TV 1366; remaining captures retained. Initial compact-TV label wrapping was corrected with share-card padding. JavaScript syntax and whitespace checked before commit.
- Pre-commit review: all three changed/new JavaScript files pass `node --check`; whitespace check passes; targeted secret-pattern scan across 14 pending text files found no candidates. No protected source or Portal file is staged.

## Scope and handover

Runtime changes: `js/views-fleet.js` and `css/eq-fleet.css` under P02. Test changes: new `tools/p02b/check_u1_c59.mjs`, scoped C54 assertion. No fixture, role, model, shared-viewer, FAC, wrapper or startup changes. Existing committed CMMS naming and QC01/RTG01/ES01 formats remain.

The work began at `f7493e3`; separate authorized naming/startup commits advanced HEAD to `8682da0` while C59 stayed pending. The accompanying C59 checkpoint captures remaining work. Retain C59 runtime hunks through U1-T01 REMOVE and repeat relevant checks against the cleaned app; cleaned checkpoint/TD07-TD08 remain pending. D-208, UX section 54, feedback MF-01.

No production, authentication, shared database, live CMMS, Portal source, deployment or independent R review verification. **U1 remains IN PROGRESS / NOT COMPLETE / NOT APPROVED; P04/P05 Not started.**
