# U1-C60 CMMS naming correction

25 October 2026 | B-24 / D-206 | Local synthetic prototype verification

The external maintenance app is **CMMS**. Its existing domain and URLs remain **zmms.lk**. The EQ & FAC Maintenance app keeps its own name. The user's naming request is implemented in editable runtime code, current contracts/documentation, mockups and tools.

Changes cover Fleet freshness/counts/status explanations, crane status and Maintenance panels in Flat/3D, Daily work and its export columns, EQ status/history/dialogs, Admin mapping/sync/settings/health, accessibility text and the shared prototype notice. The duplicate former-name alias in the daily-work heading is simplified to **CMMS daily jobs (read-only)**.

Technical references now use `cmms` / `Cmms`: fixture state, source enums, object fields, error keys, CSS/data selectors, contract types/configuration/routes and test tools. The module is `artifacts/prototypes/p02-ui/js/cmms.js`; both script loading and the P03 static-server allow-list reference it. The local Admin route is `/admin/eq/cmms`. This prototype has no persisted business data or deployed connector requiring migration.

Updated current documentation includes `docs/API_CONTRACT.md`, `DATA_CONTRACT.md`, `ARCHITECTURE.md`, `UX_SPEC.md`, project records and `docs/SOW_V2.md` / `.docx`, along with prototype READMEs, local mockups, CLAUDE.md and AGENTS.md. The latter records the user-authorized naming override for older protected wording. The complete initial text-file list and module rename are in `source-audit.json`.

## Preserved records and scope

- No change to source authorities under `documents/` or `As-bulit drawing/`, dated evidence, old screenshots or exact past prompts. All 985 protected/historical files present at the start retain their hashes. Historical names/filenames remain valid; read them using B-24's naming correction.
- Existing site-domain occurrences are preserved. Domain allow-lists and network checks continue to recognize `www.zmms.lk`, including the escaped domain in a regular expression.
- Stable acceptance IDs ZM01-ZM07 and source-question IDs remain unchanged so protected-checklist references resolve.
- The prior pending C59 fleet files/evidence and demo-start scripts are retained. Unrelated files present at the start are checked against the initial hash inventory.
- U1 remains open, incomplete and unapproved; P04/P05 remain Not started. Retain C60 during temporary-wrapper removal under D-204. No live CMMS access, Portal source edit, authentication/database integration or deployment.

## Verification

| Check | Actual result and evidence |
| --- | --- |
| V2 contract coverage | 15/15 PASS, `contracts.json` |
| R02B payload isolation and FAC KPI regression | 10/10 PASS, `r02b-regression.json` |
| Affected P02B browser cases | 13/13 PASS across the initial run and targeted reruns: C04, D02, E01, F01-F06, L01-L04. Includes 120 role/route hygiene views, failed-sync isolation, automatic/manual status, mapping/upsert, read-only daily rows/filters and role-denied Admin routes |
| Naming/browser integration audit | 16/16 PASS across nine page views: Fleet, Daily work, EQ status, Admin CMMS, Flat/3D crane panels, phone Daily work, FAC Dashboard/Jobs. Correct export columns, Admin link and viewport fit; identical Flat/3D Maintenance panel text; no runtime errors or nonlocal requests. `browser-name-audit.json` and six screenshots |
| Syntax | 30 changed JavaScript/Python files checked; no errors. `source-audit.json` |
| Name/domain/source scan | No residual old-name reference outside the actual domain/domain regex or the verbatim user-request record in editable text. Existing domain occurrences preserved; protected and unrelated initial files unchanged. `source-audit.json` |
| Word copy | Both before/after copies rendered with the documents skill's `render_docx.py`; 18 pages before/after, identical extracted page text after normalizing only the name/old alias. Only `word/document.xml` changed inside the DOCX. All pages visually inspected in six contact sheets; the affected daily-work page inspected at full size. Rendered QA intermediates remain under ignored `tmp/` |
| Whitespace | `git diff --check` PASS |

The initial browser run was 10/13: E01 expected a duplicate Special jobs heading removed by earlier compact-board work, F05 looked for the prototype notice inside `main` instead of the existing global banner, and L02 flagged the public hidden-history sentinel in C34's test. The first targeted rerun passed E01/F05, while L02 then matched the scanner's own escaped sentinel pattern. The final exact-literal exclusion resolves that self-match; L02 PASS with 40 local requests and no secret-pattern hits. Only the exact public sentinel is exempted; possible secret values are no longer printed. Prior results remain in `browser-regression.json` and `browser-rerun.json`; final network result is `network-rerun.json`.

Commands:

```text
python -I tools/p01b/check_contract_coverage_v2.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/U1/cmms-name-c60/contracts.json
node tools/p02b/check_r02b_round2.mjs docs/evidence/U1/cmms-name-c60/r02b-regression.json
node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/cmms-name-c60/browser-regression.json --only=C04,D02,E01,F,L01,L02,L03,L04
node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/cmms-name-c60/browser-rerun.json --only=E01,F05,L02
node tools/p02b/check_p02b.mjs http://127.0.0.1:5312/index.html docs/evidence/U1/cmms-name-c60/network-rerun.json --only=L02
node tmp/cmms-browser-audit.mjs
<bundled Python> tmp/audit_cmms.py
<bundled Python> <documents-skill>/render_docx.py docs/SOW_V2.docx --output_dir tmp/cmms-sow-render --emit_pdf
<bundled Python> <documents-skill>/render_docx.py tmp/cmms-sow-before.docx --output_dir tmp/cmms-sow-before-render --emit_pdf
git diff --check
```

Runtime: Codex primary agent, direct user naming request; no phase delegation or independent R verdict. Recommended affected-prototype Repair profile remains the pack's P02/P02B profile; actual model/effort not independently inspected. Starting HEAD `f7493e3` on `main`; changes are uncommitted. Formal working-app/target/production acceptance remains NOT RUN. Next: continue U1 review and preserve accepted C60 changes through the temporary presentation cleanup.
