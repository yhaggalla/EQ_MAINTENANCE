# P00 evidence

Date 21 October 2026. All checks below were actually run in this phase; outputs are in this folder or in `artifacts/p00-drawing-crops/`. Kind of evidence: source review and scripted source validation only. No application exists, so there are no application tests, browser checks or target-environment checks.

## 1 Workspace inventory

| Check | Command / method | Result |
| --- | --- | --- |
| Git state | `git status` in `F:\CODEX\EQ_MAINTENANCE` | `fatal: not a git repository` - workspace is not under Git |
| Existing code | file listing excluding `As-bulit drawing/` | Documents-only: no `package.json`, `.sln`, `.csproj` or model assets. Present: `.claude/` runner (agents, settings, `eq-phase` skill), `CLAUDE.md`, `tools/run-phase.ps1`, `tools/extract-phase.ps1`, `docs/runs/P00-20261021-1248.md`, `documents/` (SOW, photos, prompt pack v1.2, pack ZIPs, requirements review), `tmp/` (pack-authoring scratch and v1.1 backup) |
| Governing instructions | `CLAUDE.md` (workspace), user global `CLAUDE.md` | No `AGENTS.md`. Workspace `CLAUDE.md` restates the pack's boundaries |
| Stray files to exclude from future imports | listing | `documents/~$SOW.docx` (Office lock file), `As-bulit drawing/Thumbs.db` |

## 2 Taxonomy validation

Command: `python -I tools/p00/validate_mechanisms.py --out docs/evidence/P00/taxonomy-validation.json`

Output (exit code 0):

```text
215/215 checks passed
left-half subcodes (26): 011 012 013 014 015 021 022 023 024 025 031 032 033 041 042 043 044 045 046 047 048 051 061 062 063 064
right-half subcodes (17): 071 081 091 092 093 094 111 121 131 141 151 152 153 154 155 161 171
continued descriptions (parts): 011:2, 021:2, 031:3, 041:2, 061:4, 081:2, 111:2, 121:2, 131:2, 151:3, 153:2
descriptions byte-identical to simple part join: 43/43
```

Interpretation: see `docs/SOURCE_MAP.md` s3.

## 3 Drawing register verification

Command: `python -I tools/p00/verify_drawing_register.py --out docs/evidence/P00/drawing-register-check.json`

Output (exit code 0):

```text
PDFs on disk: 38 (register 38); pages 162 (register 162)
checksum/page mismatches: 0
non-PDF / unregistered files on disk: J526A00_002.jpg, J526A00_002.png, QC JPEG.jpg, QC PNG.png, Thumbs.db
```

The PDFs have almost no text layer (only the register PDF and two sheet pages yield drawing numbers), so drawing numbers were read visually from title blocks.

## 4 Drawing pages visually reviewed

Rendered with PyMuPDF at 100-300 dpi (helper `tools/p00/render_drawing_page.py`). Pages read: register PDF p1-2 (text), `cover.pdf` p1, J526A00 p1 (full sheet plus side-view, end-view and particulars crops) and p2 (subsidiary list), J526A0100 p1 (structure GA, side view at 300 dpi), J526A0200 p1, J526A0300 p1 (and main-data crop), J526A0400 p1 (and main-data crop), J526A0500 p1, J526A0600 p1 (side view, gantry arrangement and main-data crops), J526A1200 p1, J526A3000 p1; photos `documents/images.jpg`, `documents/images2.jpg`. Observations and page references: `docs/SOURCE_MAP.md` s4-s5.

Saved crops in `artifacts/p00-drawing-crops/`: `J526A00_p1_full.png`, `J526A00_p1_particulars.png`, `J526A0100_p1_side-view.png`, `J526A0300_p1_main-data.png`, `J526A0400_p1_main-data.png`, `J526A0600_p1_main-data.png`, `J526A0600_p1_gantry-arrangement.png`.

Findings beyond the pack's reference data:

- Trolley motor 275 kW on J526A00 p1 vs 270 kW on J526A0400 p1 (new conflict U-02).
- Main hoist motor speed 750/900/1800 rpm (J526A00) vs 750/1800 rpm application speed (J526A0300) (U-03).
- Under-rail lift 18 m (J526A0300) explains total lift 63 m = 45 + 18.
- Gantry: four corners x eight 800 mm wheels, four drive units per corner (16 x 20 kW).
- Spreader STS45 (Bromma), 16 for 12 cranes: spreaders are interchangeable (U-09).
- J526A4100 and J526A7200 appear in the subsidiary list but no PDF was supplied (U-10).
- `major-parameters.json`: all 20 entries match the J526A00 particulars table.

## 5 Toolchain

| Command | Result |
| --- | --- |
| `dotnet --list-sdks` | `8.0.426` |
| `dotnet --list-runtimes` | AspNetCore.App 8.0.32; NETCore.App 7.0.20, 8.0.32, 10.0.13; WindowsDesktop.App 7.0.20, 8.0.32, 10.0.13 |
| `node --version` / `npm --version` | v24.15.0 / 11.12.1 |
| `git --version` | 2.54.0.windows.1 |
| `sqlcmd -?` | SQL Server Command Line Tool 16.0.4305.5 |
| `sc query MSSQL$SQLEXPRESS` | RUNNING |
| `sqlcmd -S .\SQLEXPRESS -E -C -Q "SELECT SERVERPROPERTY('ProductVersion'), SERVERPROPERTY('Edition'); SELECT name FROM sys.databases"` (read-only metadata) | 16.0.4305.5, Express Edition (64-bit). Existing databases include `CictEngIdentityDev`, `CictEngIdentityLocalPreview`, `CictSafetyDevelopment`, `CictSafetyLocalPreview`, `EngineeringPaymentAssistant`, `PayPrep`, `UrgentMaterialsAppDb` and many `*Tests_<guid>` databases. No `EqMaintenance*` database exists |
| `python --version`; PyMuPDF; pypdf | 3.12.1; 1.28.0; 6.14.2 |
| Blender | not found (`where blender` empty; `bpy` not importable) |

## 6 Primary-source version facts (fetched 21 Oct 2026)

- Microsoft .NET support policy (https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core): .NET 10 LTS, latest patch 10.0.13 (13 Oct 2026), end of support 14 Nov 2028; .NET 9 STS and .NET 8 LTS both end support 10 Nov 2026.
- NuGet flat-container index: `Microsoft.EntityFrameworkCore.SqlServer` and `Microsoft.AspNetCore.Authentication.JwtBearer` latest 10.0.13 (8.x line latest 8.0.32).
- npm registry (`npm view`): latest react 19.3.1, three 0.186.1, @react-three/fiber 9.8.2 (14 Oct), drei 10.7.9, vite 8.3.5, typescript 7.0.2; typescript-eslint 8.72.0 peer `typescript >=4.8.4 <6.1.0`; fiber peers `react >=19 <19.4`, `three >=0.156`; drei 10.7.9 peers react ^19 and fiber ^9; vite 8.3 engines `node ^20.19.0 || >=22.12.0`. Candidate set restricted to releases at least 14 days old: see DECISIONS D-04.

## 7 Portal inspection (read-only)

Repository `F:\CODEX\CICT-ENG_MAIN_PAGE`: `git status -sb` -> branch `feature/option-b-provisioning-and-login-redesign`, no changes; `git log` HEAD `47f7bd9`. Files read: `README.md`, `Directory.Build.props` (net8.0), `src/CictEng.Auth/*` (contract 0.2.1, validator, package README), `src/CictEng.Identity/Authentication/IdentityAccessTokenService.cs` (token issuance), `Persistence/IdentityCatalogSeeder.cs` (registry), `Provisioning/IAppProvisioningConnector.cs`, `HttpAppConvergenceConnector.cs`, `SafetyProvisioningConnector.cs`, `scripts/portal-local.ps1` header (configuration secrets not printed), `src/portal-web/package.json`, grep of `docs/DEPLOYMENT_GUIDE_IIS.md`. Consumer references found read-only in UMMS, PayPrep and Safety `.csproj` files. No configuration secret values were opened or printed. Analysis: `docs/IMPLEMENTATION_PLAN.md` s5.
