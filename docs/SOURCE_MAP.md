# Source map

Prepared in P00, 21 October 2026. It links the approved requirements, the coded mechanism catalogue, the as-built drawing pages and the QC model-family assumptions. All drawing observations below were read from the local PDFs in `As-bulit drawing/` (never edited). Values are drawing observations for model family `CICT-J526A-STS`; they are **not** an assignment to any current crane.

Verification labels used here:

- **Read (P00)**: visually read in P00 from a page rendered at legible resolution (render helper `tools/p00/render_drawing_page.py`; selected crops in `artifacts/p00-drawing-crops/`).
- **Registered only**: present and checksummed in `reference/drawing-register.json`; not yet visually reviewed. P03 reads the remaining sheets it needs.
- **Interpretation**: a reading of what a dimension refers to. P03 must confirm it against the aligned view before using it as model input.

## 1 Authorities and their files

| Authority | Local file | Notes |
| --- | --- | --- |
| Original SOW | `documents/SOW.docx` | Text read in P00 through its OOXML. Its QC01-QC04/RT01-RT05/ES01-ES05 labels are an illustrative mock-up, not a fleet register. Its blue/white crane image is an interaction illustration, not the paint authority. `documents/~$SOW.docx` is an Office lock file and is not a source. |
| Approved requirements | `documents/prompt-pack/APPROVED_REQUIREMENTS.md` | S01-S17, roles, lifecycle, technical defaults |
| QC modelling brief | `documents/prompt-pack/QC_3D_MODELLING_BRIEF.md` | Geometry contract, semantic keys, interaction, budgets |
| Acceptance checklist | `documents/prompt-pack/ACCEPTANCE_CHECKLIST.md` | Case IDs SRC/AUTH/ADM/JOB/HIS/VIS/FILE/OPS |
| Mechanism catalogue | `documents/prompt-pack/reference/mechanisms-approved.json` | Validated in P00 against `mechanisms-original.txt` (section 3) |
| Major parameters | `documents/prompt-pack/reference/major-parameters.json` | Re-read in P00; two additional conflicts found (section 5) |
| Drawing register | `documents/prompt-pack/reference/drawing-register.json` | 38 PDFs / 162 pages; checksums and page counts re-verified in P00 |
| Appearance | `documents/images.jpg`, `documents/images2.jpg`, cover photo in `As-bulit drawing/cover.pdf` | Red structure, light/white machinery house with blue CICT sign, "01" and ZPMC marks on portal beam |
| Portal integration | `F:\CODEX\CICT-ENG_MAIN_PAGE` (read-only until P05) | Inspected at branch `feature/option-b-provisioning-and-login-redesign`, commit `47f7bd9`, clean working tree |

## 2 Requirement-to-source map

| Requirement | Primary sources | Owning phases | Acceptance cases |
| --- | --- | --- | --- |
| S01 register, families, active/retired | APPROVED_REQUIREMENTS s2-s3, s6; SOW fleet mock-up (illustrative only) | P01, P06, P09 | ADM01, ADM04, SRC06, VIS07 |
| S02 fleet overview | SOW text and image; requirements s7.1 | P02, P09 | OPS01, OPS02, JOB13 |
| S03 three operational statuses + Unreported | SOW; requirements s5 | P01, P07, P09 | JOB02, JOB13, OPS01 |
| S04 selectable QC model | J526A00 p1, J526A0100 p1, brief s2-s5, photos | P03, P10 | VIS01, VIS02, VIS04, VIS06, VIS08, VIS09, OPS03 |
| S05 equipment -> main -> sub -> part | mechanisms-approved.json; drawings in section 4 | P01, P06, P10 | SRC01-SRC03, ADM02, ADM03, VIS03 |
| S06 Overall/Technical modes | brief s5; J526A3000 machinery house | P03, P10 | VIS03, VIS04 |
| S07 scoped history | requirements s6 | P01, P08, P10 | HIS01-HIS05 |
| S08 jobs workspace | SOW EQ-team tab; requirements s5, s7.3 | P02, P07 | JOB01, JOB03, JOB12 |
| S09 EQ Team work and status | requirements s4-s5 | P07 | JOB01-JOB13, AUTH03 |
| S10 Admin management and corrections | requirements s3-s4 | P06, P07 | ADM01-ADM06, JOB09 |
| S11 Management read-only | requirements s4 | P04, P05, P07, P08 | AUTH02, AUTH03, FILE02 |
| S12 equipment-specific positions and replacements | requirements s3, s5 | P01, P06, P07 | ADM02, JOB04-JOB06, JOB09, JOB10, HIS01, HIS03 |
| S13 audit, concurrency, atomic completion | requirements s5 | P01, P07 | JOB05-JOB09, JOB11, AUTH06 |
| S14 source parameters and protected drawings | major-parameters.json; drawing register; section 5 below | P06, P08 | SRC05, ADM06, FILE01-FILE05 |
| S15 Portal sign-in, roles, provisioning | Portal `src/CictEng.Auth`, `src/CictEng.Identity` (section 7) | P01, P05 | AUTH01-AUTH07 |
| S16 responsive, accessible, non-3D fallback | requirements s7 | P02, P09, P10, P11 | OPS02, VIS07, VIS08 |
| S17 tests, reproducible models, performance, release | brief s6-s7 | P03, P11, P12 | VIS09, VIS10, OPS03-OPS06 |

## 3 Mechanism catalogue validation result

Independent re-parse by `tools/p00/validate_mechanisms.py` (does not reuse the pack-authoring parser). Result: **215/215 checks passed**; report `docs/evidence/P00/taxonomy-validation.json`.

- Source SHA-256 `95dbcc18...9c48d6` matches `sourceSha256` in the approved JSON.
- 16 main codes; main `10` absent and listed in `unassignedMainCodes`.
- 43 subcodes; 41 active; `048` and `063` inactive and reserved (blank source name and description; display name `null`).
- All codes are JSON strings with leading zeroes (`01`, `011`, ...).
- Left four-column group: mains 01-06, subcodes 011-015, 021-025, 031-033, 041-048, 051, 061-064 (26). Right group: mains 07-09 and 11-17, subcodes 071, 081, 091-094, 111, 121, 131, 141, 151-155, 161, 171 (17). No description crossed between halves.
- Continued descriptions joined in source order: 011 (2 rows), 021 (2), 031 (3), 041 (2), 061 (4), 081 (2), 111 (2), 121 (2), 131 (2), 151 (3), 153 (2). All 43 descriptions equal the simple in-half join of their rows.
- Parents and source names match for every subcode. `061` displays Spreader with source label `lp`; `062` displays Headblock with blank source label; both carry `nameDecision: user_confirmed_2026-10-21`.
- Rope definitions stay separate: `015` (parent 01), `024` (parent 02) and `033` (parent 03), each named `steel rope`.

Observation for P01/P06: main `06` and sub `061` are both displayed "Spreader". This is the approved naming; UIs show the code with the name so the two levels stay distinguishable.

## 4 Drawing sources by model assembly and mechanism

Drawing numbers below are those printed in each sheet's title block. Note that several title blocks abbreviate the register number (J526A0400 prints `J526A04`, J526A0500 prints `J526A05`).

| Visual assembly / record area | Drawing (file, PDF page) | Status | Candidate mechanism codes (review candidates, not installed assignments) |
| --- | --- | --- | --- |
| Crane general arrangement, particulars, machinery-house plan, reeving diagrams | J526A00, `J526A00（structure parameters）.pdf` p1 | Read (P00) | all |
| Subsidiary list (37 items) | J526A00, same file p2 (raster; also `J526A00_002.png`) | Read (P00) | n/a |
| Structure GA: legs, sills, portal beams, girder, boom, stays, A-frame, sections | J526A0100(1/2), `J526A0100.pdf` p1 | Read (P00) | 15/151 (frame, legs, girder, A-frame, stays), 03/031 (boom) |
| Structure detail sheets (frame, A-frame, legs, sill beams, girder, boom sections, hinge) | `J526A0100.pdf` p2-p64 (register items 3-41) | Registered only | 15/151, 03/031 |
| Trolley arrangement (frame, wheels, sheaves, suspended operator cabin) | J526A0200, `J526A0200.pdf` p1 | Read (P00) | 02/021, 022, 024; 14/141 |
| Trolley frame and wheel assembly sheets | `J526A0200.pdf` p2-p7; `ZT2-015022 - Trolley wheel.pdf` | Registered only | 02/021 |
| Main hoist drive | J526A0300, `J526A0300.pdf` p1 | Read (P00) | 01/011, 012, 015; 16/161 (emergency mechanism data) |
| Trolley drive (rope-towed; drive in machinery house) | J526A04, `J526A0400.pdf` p1 | Read (P00) | 02/021, 024 |
| Boom hoist drive | J526A05, `J526A0500.pdf` p1 | Read (P00) | 03/031, 032, 033 |
| Gantry drive, bogies, gantry arrangement | J526A0600, `J526A0600.pdf` p1 | Read (P00) | 04/041 |
| Driving/driven wheel assemblies, gantry wheel | `J526A0600.pdf` p2-p5 | Registered only | 04/041 |
| TLS and snag protection | J526A1000 | Registered only | 11/111, 01/011 |
| Headblock (5200 x 2090 overall; twin sheaves; twistlock mechanism item 11) | J526A1200, `J526A1200.pdf` p1 | Read (P00) | 06/062 |
| Cargo beam (separate attachment; parent unresolved) | J526A1300 | Registered only | none assigned; not assumed to be 064 |
| Emergency drive | J526A1400 | Registered only | 16/161 |
| Rope re-reeving device | J526A1500 | Registered only | 01/02/03 rope positions |
| Machinery-house service crane | J526A1600 | Registered only | 15/151 |
| Main hoist, trolley, catenary trolley, boom reeving | J526A2000, J526A2100, J526A2200, J526A2300 | Registered only (reeving diagrams on J526A00 p1 read) | 015, 024, 033 |
| Machinery house enclosure and equipment layout | J526A3000, `J526A3000.pdf` p1 | Read (P00) | spatial container: 01, 02, 03, 07, 08, 12, 15/152 contents |
| Operator, boom and checker cabins | J526A3100, J526A3200, J526A3300 | Registered only | 14/141 |
| High-voltage cable reel | J526A4000 (item 21 on J526A00 end view) | Registered only | 04/042; 12/121 supply |
| Platforms, stairs, walkways | J526A5000 (18 pages) | Registered only | 15/151 |
| Elevator | J526A5100 | Registered only | 15/153 |
| Anchor, tie-down, boom stowage, boom anti-collision | J526A6000, J526A6100, J526A6200, J526A6300 | Registered only | 04/041 (anchor/tie-down per 041 description); 03/031 |
| Air compressor, outdoor service crane | J526A7000, J526A7100 | Registered only | 15/151 |
| Nameplate arrangement | J526A7300 | Registered only | appearance reference |
| Limit-switch arrangement | J526A7400 | Registered only | cross-cutting; assign to owning mechanism |
| Embedded parts | J526AM00 | Registered only | quay reference, not a crane position |
| Sheave component drawings | `Sheave.pdf` (6 pages: ZT2-013069, ZT2-012665, ZT2-013047, ZT2-013022, ZT2-012947-J526A, ZT2-012932 per register PDF) | Registered only | rope-system sheave positions under 01/02/03 |
| Spreader trailer | DT1500F | Registered only | 15 (ground equipment; not a crane-mounted position) |

Subsidiary-list items without a supplied PDF: J526A4100 (slip contact / trolley cable supply system), J526A7200 (lubrication system layout), STS45 spreader (Bromma), ZM2-16530-00-J526A dry test weight. The register PDF also lists many sub-drawings (for example J526A0302 drum, J526A2002 rope clamp) that exist only inside the bundled PDFs or not at all; P03 records the exact page when it uses one.

## 5 Dimension and parameter observations (model family CICT-J526A-STS)

Coordinates proposed for the model (see DECISIONS D-11; corrected from D-17 by Repair-R01, F5): metres, Y up, X along the boom positive toward waterside, Z along the rails (gantry travel). Origin at the top of the **waterside** rail on the crane's transverse centreline. The landside rail is then at X = -30.

### 5.1 Overall geometry

| Observation | Value (mm unless noted) | Source | Status / interpretation |
| --- | --- | --- | --- |
| Rail gauge | 30000 (30000 +/-5 on J526A0100) | J526A00 p1 particulars and side view; J526A0100 p1 | Read; exact model input |
| Outreach | 70000 from waterside rail | J526A00 p1; J526A0100 p1 | Read; exact |
| Backreach | 20000 from landside rail | J526A00 p1; J526A0100 p1 | Read; exact |
| Girder tail beyond backreach | 11000 (31000 from landside rail to girder end) | J526A0100 p1 (11000 + 20000); J526A00 p1 (31000) | Read |
| Boom beyond outreach | 4000 (J526A00); boom length 75900 measured from a point 2000 landside of the waterside rail (J526A0100) | J526A00 p1; J526A0100 p1 | Read; reference point of 75900 = Interpretation |
| Girder/boom reference height | 50500 above rail | J526A00 p1; J526A0100 p1 | Read; which surface (girder underside vs trolley rail) = Interpretation for P03 |
| Lift height above rail | 45000 | J526A00 p1; J526A0300 p1 | Read |
| Lift below rail | 18 m | J526A0300 p1 main data | Read; 45 + 18 = 63 m matches total lift |
| Total lift height | 63 m | J526A00 p1 | Read. **Not overall crane height** |
| Below-rail dimension on GA side view | 16000 | J526A00 p1 | Read; meaning unresolved (U-04) |
| Portal lower beam clearance | 12500 above rail | J526A00 p1; J526A0100 p1 | Read |
| Sill/bogie connection height | 3700 above rail (structure); 5000 to sill top in end views | J526A0100 p1; J526A00 p1 | Read |
| Waterside leg | inclined, 2000 horizontal offset over 37060; lower vertical segment 7800 | J526A0100 p1 | Read |
| Portal height, waterside end view | 5000 + 49000 to portal top | J526A00 p1 and J526A0100 p1 view B (labelled WATERSIDE) | Read |
| Portal height, landside end view | 5000 + 49250 | J526A00 p1 and J526A0100 p1 view A (labelled LANDSIDE) | Read; differs from waterside by 250 (U-05) |
| A-frame above portal (waterside end) | 25640 | J526A00 p1; J526A0100 p1 view B | Read |
| A-frame apex marker | elevation 83356 | J526A00 p1 side view | Read; 5000 + 49000 + 25640 = 79640 to structural top, so 83356 likely includes apex sheave/head (U-06) |
| Raised boom tip marker | elevation 129340 | J526A00 p1 | Read; boom-up position, for silhouette only |
| Distance between legs (end view) | clear >= 18300; 20400 between leg centrelines (20400 +/-3) | J526A00 p1; J526A0100 p1 | Read |
| Bogie group spacing along rail | 15800 between bogie group centres; 21050; 27000 overall | J526A00 p1; J526A0600 p1 | Read |
| Girder/boom box width | 6300 +/-3 | J526A0100 p1 | Read |
| Machinery house | 18200 x 10500 enclosure (GA plan 9200 + 9000 by 11500 incl. walkways); height about 5100 | J526A3000 p1; J526A00 p1 | Read |
| Stays and A-frame members | back-stay tube dia 1000 x 14; diagonal frame brace dia 1200 x 14; rear tie dia 500 x 10; segment lengths 26948/28888, 15800/21300/30116, 18000/19617 | J526A0100 p1 | Read |
| End-view platform levels (landside) | 6500, 15615, 47845, 53430 | J526A00 p1 | Read; level references for stairs/platforms |
| Cable reel | dia about 2121 hub-to-rim mark; centre 7885 above rail | J526A00 p1 end view, item 21 | Read; precise geometry from J526A4000 in P03 |
| Gantry travel distance | +/-400 m | J526A00 p1 particulars | Read; not in major-parameters.json (informational) |

### 5.2 Assemblies

| Assembly | Observation | Source | Status |
| --- | --- | --- | --- |
| Gantry | 4 corner groups; each 8 wheels dia 800 in four 2-wheel sub-bogies (wheel pitch 1050, sub-bogie spacing 1500, 1250 end); 4 drive units per corner (16 x 20 kW Yaskawa FEK C21 0U); one wheel brake type per arrangement (115 kN); buffers 500 mm stroke | J526A0600 p1 side view, plan "Gantry arrangement", main data | Read; driven vs idle wheel per sub-bogie to be confirmed from p2-p5 |
| Main hoist | 2 motors 450 kW (Yaskawa BDK-1KMU), one central SEW reducer ML3PSF130E-1600 (ratio 18.551), 2 drums dia 1180, 2 high-speed brakes, low-speed (drum) brakes 2 x 254520 Nm, rope IWRC 6xWS(36) dia 31.5; emergency drive motor 37 kW | J526A0300 p1 | Read |
| Trolley drive | 1 motor (power 270 kW on this sheet), reducer FH955.21.A6A-00, drum dia 920, rope dia 25; located in machinery house (rope-towed trolley) | J526A04 (`J526A0400.pdf` p1) | Read; motor rating conflicts with GA (U-02) |
| Boom hoist | 1 motor 375 kW, SEW ML4PSF120X (ratio 100.56), drum dia 1530, motor brake and drum brake (2 x 254.52 kN.m), rope dia 35.5 | J526A05 (`J526A0500.pdf` p1) | Read |
| Trolley | Frame about 6300 wide (end view), wheel span 5200; operator cabin suspended on landside of trolley; main hoist sheaves on trolley; wheel diameters 630/710 listed in the tolerance table | J526A0200 p1 | Read at overview level; wheel count and exact frame dimensions for P03 |
| Headblock | 5200 overall sheave span (5440/5521 overall), 2090 wide, two sheaves dia 1000, twistlock mechanism | J526A1200 p1 | Read |
| Spreader | STS45 (Bromma) per subsidiary list item 35, quantity "(12+4) for 12 cranes" | J526A00 p2 | Read; implies interchangeable spreaders (U-09) |
| Machinery house content | main hoist drive, trolley drive, boom hoist drive, main transformer (2200 x 1450 x 2294), auxiliary transformer, switch gear, electrical-room cabinets, service crane, compressor, work table | J526A3000 p1; J526A00 p1 plan | Read at layout level; cabinet identities not individually labelled legibly in P00 |

### 5.3 Parameter reconciliation with `major-parameters.json`

All 20 entries were compared with the J526A00 p1 particulars table (crop `artifacts/p00-drawing-crops/J526A00_p1_particulars.png`): every value, unit and condition matches. Additional observations not in the JSON and to be added as observations in P06:

| Code proposal | Observations | Status |
| --- | --- | --- |
| gantry-speed | 46 m/min (J526A00 p1) vs 45.5 m/min (J526A0600 p1) | Already recorded as unresolved conflict (U-01) |
| trolley-motor-power | 275 kW (J526A00 p1) vs 270 kW (J526A04 = `J526A0400.pdf` p1 main data) | **New unresolved conflict** (U-02). The JSON carries only 275 |
| main-hoist-motor-speed | 750/900/1800 rpm (J526A00 p1) vs application speed 750/1800 rpm (J526A0300 p1) | **New observation difference** (U-03) |
| lift-below-rail | 18 m (J526A0300 p1) | New, consistent with 63 m total |
| gantry-travel-distance | +/-400 m (J526A00 p1) | New, informational |
| gantry-wheel-diameter | 800 mm (J526A0600 p1) | New, technical |
| max-wheel-load | 87 t working; 106 t non-working (J526A0600 p1) | New, technical |
| main-hoist-rope | IWRC 6xWS(36)-B dia 31.5, breaking strength 672 kN (J526A0300 p1) | New, technical |
| boom-hoist-rope | dia 35.5 mm, breaking strength 975 kN (J526A0500 p1) | New, technical |
| trolley-rope | dia 25 mm (J526A0400 p1) | New, technical |

## 6 Model-family assumptions

1. The initial template is named `CICT-J526A-STS`, model version 1 (P03). It represents the ZPMC J526A drawing family for the original "CICT 12 STS cranes" (cover, subsidiary list "1 for 12 cranes"). It is not assigned to any equipment item until Admin records a verified association (SRC06).
2. Waterside is the boom side; the A-frame sits over the waterside portal; the machinery house sits on the landside girder within the backreach zone; the operator cabin hangs from the trolley on its landside. Source: J526A00 p1, J526A0100 p1 view labels, J526A0200 p1 L.S./W.S. labels, J526A3000 p1 "Seaside" arrows.
3. The trolley is rope-towed: its drive is in the machinery house (J526A0400). The model therefore places trolley drive positions (motor, reducer, drum, brake) inside the machinery house, and trolley wheels/frame on the trolley.
4. Applicability candidates for this QC family (for Admin review; unknown is not "not applicable"):
   - Likely applicable: 01 (011-015), 02 (021-025, catenary trolley and trolley chain to confirm), 03 (031-033), 04/041 and 042, 046 (wheel brakes are present on J526A0600 as rail-clamp style "wheel brake"; confirm whether 046 or 041 owns them), 05/051, 06 (061, 062, 064 over-high hanger if fitted), 07/071, 08/081, 11/111 (TLS on J526A1000), 12/121, 13/131, 14/141, 15 (151, 152, 153; 154/155 unknown), 16/161, 17/171.
   - Likely not applicable to this electric rail-mounted crane: 043 gantry steer, 044 gantry tire, 045 gantry turn, 09 Engine (091-094). P06 records these as "not applicable (candidate, Admin to confirm)" for the J526A template, never deleted from the shared catalogue.
   - 047 gantry chain: unknown.
5. Maintenance positions with physical counts supported by drawings so far (P03/P06 refine; Admin confirms before history): main hoist 2 motors, 1 reducer, 2 drums, 2 high-speed brakes, 2 drum brakes; boom hoist 1 motor, 1 reducer, 1 drum, 1 motor brake, 1 drum brake; trolley drive 1 motor, 1 reducer, 1 drum, 1 brake; gantry 16 drive units across 4 corners, 32 wheels; headblock 1 frame and 2 sheaves; separate rope-set positions for 015, 024 (trolley and catenary as separate positions to confirm) and 033. Electrical cabinets (071/081/121) are located in the machinery house/electrical room only at area level; they become "Location approximate" hotspots until a sheet establishes exact positions.

## 7 Portal integration sources (read-only in P00)

| Item | Location (CICT-ENG_MAIN_PAGE) | Observation |
| --- | --- | --- |
| Shared contract | `src/CictEng.Auth/SharedAuthContract.cs`, version 0.2.1, `net8.0`, JwtBearer 8.0.15 | Explicit audience list (portal, umms, payprep, safety), 19 role codes, empty permission registry, binding claims for umms/payprep/safety |
| Profile validator | `src/CictEng.Auth/SharedAccessTokenProfileValidator.cs` | Rejects a token if **any** `aud` value or **any** role is not in the consumer's compiled registry; requires each namespaced role's matching audience |
| Issuer | `src/CictEng.Identity/Authentication/IdentityAccessTokenService.cs` | One multi-audience token per session; emits an app's audience/roles only if the app and role are enabled in the registry, present in the issuer's compiled contract and, for apps with a binding claim, a Ready projection exists |
| Registry seed | `src/CictEng.Identity/Persistence/IdentityCatalogSeeder.cs` | Applications: portal `/`, umms `/umms`, payprep `/payprep`, safety `/safety`; no `eq-maintenance` entry or path collision |
| Provisioning | `src/CictEng.Identity/Provisioning/` | `IAppProvisioningConnector` desired-state convergence; `HttpAppConvergenceConnector` PUTs `internal/provisioning/users/{subjectId}` and checks revision, state hash, roles, active flag; Safety connector is the closest pattern for EQ |
| Portal web | `src/portal-web/package.json` | React 18.3.1, Vite 8.1.5; no shared component package, so EQ can choose React 19 independently |
| Local runner | `scripts/portal-local.ps1` | Starts all apps and re-seeds the Identity preview database; uses existing local UMMS/PayPrep databases. P05 must not run it unmodified against those databases |
| Deployment note | `docs/DEPLOYMENT_GUIDE_IIS.md` | Records an ASP.NET Core 8 Hosting Bundle on the target (document claim, not live proof) |
