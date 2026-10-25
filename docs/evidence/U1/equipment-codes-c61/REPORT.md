# U1-C61 equipment business codes

25 October 2026 | B-25 / D-207 | Local synthetic prototype

All 67 equipment business codes now follow the user's requested format: **QC01-QC14**, **RTG01-RTG46**, **ES01-ES07**. The single equipment register feeds Fleet/cards/table/TV, Admin, EQ Jobs and status, selectors, exports, spare-part records and CMMS mapping choices. Crane headings/tree labels use the same records in Flat and 3D. Current examples, local mockups, capture/check tools and editable contracts/SOW copies use the new names.

Stable record IDs are retained, including existing equipment URLs and equipment-specific mechanism/part/job/replacement/history relationships. The fixture IDs are now built from their stable type/key rather than the editable business code. CMMS and spare-part setup resolve a code through the equipment register before looking up its ID. External CMMS source codes and mappings remain unchanged; the site is still **zmms.lk**. Approved names do not verify synthetic condition, model, serial or work data. DevelopmentFixture provenance and the prototype notice remain explicit.

## Documents and source boundaries

Updated AGENTS.md, current project records, DATA/ARCHITECTURE/UX contracts, prototype READMEs and `docs/SOW_V2.md` / `.docx`. B-25 / D-207 supersede the previous instruction to retain demo-format business codes. The code-format portion of U-07 is answered; other fleet facts stay open. The original quote in U1-C07 and the exact current request retain their original spelling.

All 1,000 protected/historical files present at the start of C61 keep their hashes, including `documents/`, `As-bulit drawing/`, dated evidence and exact past prompts. AGENTS.md records the current naming override for reading older protected material. Historical screenshot filenames and record IDs are not business labels and stay stable.

## Actual checks

| Check | Result / evidence |
| --- | --- |
| Canonical register and stable associations | 67 canonical codes, 170 positions and 20 special jobs. Equipment IDs/keys/origins, position identities, job/line relationships, CMMS mappings/daily-row associations, spare-part designations/history and status identity/causes match the prior fixture data after normalizing only the code. `source-and-identity-audit.json` |
| Exact staged fleet/selector regression | **37/37 PASS**, `staged-c54/checks.json`: all 67 in register/cards/selectors, shared type-scoped jobs/exports, job creation for ES07, mapping choices, unknown-model fallbacks, TV paging at two sizes, phone RTG46 search, Management write refusal, no browser errors |
| Exact staged naming/browser audit | **20/20 PASS**, `staged-names/checks.json`: canonical population, origin notice, seven app/Admin routes, all four Jobs filters, daily export codes, Flat/3D QC01 identity, phone QC14/RTG46/ES07 search, no browser errors. Screenshots reviewed |
| Affected staged P02B cases | **11/11 PASS** across `staged-p02b.json` and `staged-e01-final.json`: C04/D02/E01/F01-F06/L02/L04. Failed-sync isolation, mappings/upsert, manual override expiry, read-only/filtered daily work, Admin restrictions, status history/causes and local-only network boundary retained |
| Staged R02B regression | **10/10 PASS**, `staged-r02b.json`: hidden/reopened-history payload boundary, reference isolation and FAC filtered KPI behaviour |
| Model bindings | **11/11 PASS**, `bindings.json`: QC01/QC02 retain separate part/history identities and exact-key geometry bindings |
| V2 contract consistency | **15/15 PASS**, `contracts.json` |
| Staged source syntax / residual old labels | 36 JavaScript/module files checked; no syntax errors. No former business-code labels outside protected records or exact original quotes. `source-and-identity-audit.json` |
| Word document | Bundled documents renderer, 18 pages; approved ranges and unchanged CMMS domain present. All pages visually inspected in six contact sheets. QA intermediates remain under ignored `tmp/c61-sow-render/` |
| Git whitespace | `git diff --cached --check` PASS |

The initial working browser audit's three phone checks read the status badge appended to `.code`, rather than the first text node containing the code. The corrected staged audit passes all three. Initial P02B E01 still expected an RTG hyphen; it was updated to the canonical two-digit format and passes on the final rerun. `staged-e01-rerun.json` retains an intermediate retry using the old copied harness; `staged-e01-final.json` is the passing refreshed result. No app behaviour was changed to satisfy those stale assertions.

## Commit scope and verification boundary

The user authorized a local commit. C60 CMMS naming and C61 equipment naming are committed together. The three files containing pre-existing C59 KPI work were staged from HEAD with only the naming corrections: Fleet CSS, Fleet renderer and C54 check. The C59 hunks, its untracked tool/evidence and the demo-startup helpers remain outside the commit and are preserved in the working tree.

To test the commit independently of those pending edits, exported the Git index with `git checkout-index` into ignored `tmp/c61-index/`, served that copy at **127.0.0.1:5320**, and ran the staged checks above. Runtime text files in the final index are compared with that tested copy; `staged-runtime-audit.json` records the hashes. The user's existing server at port 5312 continues to use the working tree. The temporary 5320 listener is stopped after verification.

Main commands (from the staged-copy directory where stated):

```text
node tools/p02b/check_u1_c54.mjs http://127.0.0.1:5320/index.html <root>/docs/evidence/U1/equipment-codes-c61/staged-c54
node tools/p02b/check_p02b.mjs http://127.0.0.1:5320/index.html <root>/docs/evidence/U1/equipment-codes-c61/staged-p02b.json --only=C04,D02,E01,F,L02,L04
node tools/p02b/check_p02b.mjs http://127.0.0.1:5320/index.html <root>/docs/evidence/U1/equipment-codes-c61/staged-e01-final.json --only=E01
node tools/p02b/check_r02b_round2.mjs <root>/docs/evidence/U1/equipment-codes-c61/staged-r02b.json
node tmp/c61-runtime-audit.mjs http://127.0.0.1:5320/index.html docs/evidence/U1/equipment-codes-c61/staged-names
node tools/p03/check_bindings.mjs --out docs/evidence/U1/equipment-codes-c61/bindings.json
python -I tools/p01b/check_contract_coverage_v2.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/U1/equipment-codes-c61/contracts.json
<bundled Python> <documents-skill>/render_docx.py docs/SOW_V2.docx --output_dir tmp/c61-sow-render --emit_pdf
<bundled Python> tmp/audit_c61.py
git diff --cached --check
```

Direct user-requested refinement by the Codex primary agent; no phase delegation or independent R verdict. Actual model/effort not independently inspected. Starting HEAD `f7493e3` on `main`. All evidence is local and synthetic; formal working-app/target/production acceptance remains NOT RUN. No live CMMS, real authentication/database, Portal source edit, deployment or push. U1 remains open/incomplete/unapproved; P04/P05 Not started. Preserve C60/C61 during temporary-wrapper removal under D-204.
