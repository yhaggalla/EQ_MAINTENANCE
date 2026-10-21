# EQ Maintenance requirements review

Review date: 21 October 2026

This review prepares the scope for an implementation prompt pack. It does not implement the application. The user answered all five scope questions on 21 October 2026; the confirmed decisions appear in the final section and in `prompt-pack\APPROVED_REQUIREMENTS.md`.

## Sources and review coverage

- Primary requirements: `F:\CODEX\EQ_MAINTENANCE\documents\SOW.docx`.
- Engineering sources: `F:\CODEX\EQ_MAINTENANCE\As-bulit drawing`.
- Mechanism authority: the user's pasted table, supplied as `C:\Users\yasas\.codex\attachments\a5844806-c0da-4578-b072-6070309475ea\Pasted text.txt`.
- Appearance references: `documents\images.jpg` and `documents\images2.jpg`. Both show CICT quay cranes with red structural members and a light machinery-house enclosure.
- Portal context: read-only inspection of `F:\CODEX\CICT-ENG_MAIN_PAGE\README.md`, selected architecture passages, and the Portal frontend package manifest. This verified the local project's separate-app pattern and central Identity service. No live Portal or production database was accessed.

The drawing folder contains 38 PDFs with 162 PDF pages. The drawing register lists 125 drawing entries; several supplied PDFs bundle multiple drawings. The review indexed every supplied PDF and visually inspected the general arrangement, subsidiary list, main hoist, trolley arrangement, and gantry drive overview sheets. It did not verify every fabrication detail on every page.

The SOW was read through its OOXML text and embedded image; text in drawing shapes was also extracted. Rendering the Word document was unavailable because the packaged renderer could not locate LibreOffice. No claim about the Word page layout is made.

The cover identifies this as the as-built drawing set for **CICT 12 STS cranes**. Do not assume that it describes every current QC, RTG, or ES, or assign its parameters to equipment without a verified model-family association.

## Confirmed product requirements

1. Deliver a separate EQ Maintenance web app as part of ENG Portal.
2. Provide a fleet dashboard with equipment grouped by type. The SOW illustrates QC, RTG, and ES groups; these are layout examples rather than an approved fleet register.
3. Show each equipment item's current operational status: Ready for OPS, Breakdown, or Maintenance.
4. Give management a clear fleet overview with graphical status indicators.
5. Open the selected equipment in a movable 3D view with named major parts.
6. Selecting a main mechanism focuses its 3D view and opens its replacement history in a right-side panel.
7. Selecting a submechanism supports the same drill-down interaction.
8. Allow users to switch between an overall equipment view and a technical view.
9. Provide a dedicated EQ Team work area for pending, current, and completed work, associated with the relevant equipment and mechanism hierarchy.
10. Allow Admin to maintain equipment, jobs, main mechanisms, submechanisms, and main parts.
11. Provide three roles: Admin, Management view, and EQ Team. EQ Team can create and complete jobs; Admin can manage and correct them, with history recorded.
12. Use the supplied drawings and CICT appearance references to establish the crane shape and colours.
13. Stage 1 needs major technical parameters; it does not require every mechanical or fabrication parameter in the drawings.
14. Use the user's supplied main-mechanism and submechanism codes as the classification authority.

## Mechanism classification

The pasted table has two independent sets of four columns placed side by side. Read both halves and attach continuation descriptions to the previous submechanism in the same half. Do not merge descriptions across the left and right halves.

It contains 16 main mechanisms and 43 supplied subcodes. Forty subcodes have a nonblank name, including the ambiguous label `lp` for `061`. Three subcodes have no name: `048`, `062`, and `063`.

| Main code | Supplied main mechanism | Supplied subcodes |
| --- | --- | --- |
| 01 | Hoist | 011, 012, 013, 014, 015 |
| 02 | Trolley | 021, 022, 023, 024, 025 |
| 03 | Boom | 031, 032, 033 |
| 04 | Gantry | 041, 042, 043, 044, 045, 046, 047, 048 |
| 05 | Control Power | 051 |
| 06 | Spreader | 061, 062, 063, 064 |
| 07 | Driver System | 071 |
| 08 | PLC | 081 |
| 09 | Engine | 091, 092, 093, 094 |
| 11 | Skew system | 111 |
| 12 | HV system | 121 |
| 13 | Lighting | 131 |
| 14 | Cabin | 141 |
| 15 | Auxiliary system | 151, 152, 153, 154, 155 |
| 16 | Emergency mechanism | 161 |
| 17 | Other | 171 |

Keep codes as text to preserve leading zeroes. There is no supplied main code `10`. Do not renumber the list or invent a mechanism for that gap.

Handling confirmed by the user on 21 October 2026:

- Keep `048` and `063` as inactive reserved entries because their names and descriptions are blank.
- Name `061` Spreader while retaining the original `lp` label in source metadata.
- Name `062` Headblock based on its supplied description, while recording that the name was inferred and then confirmed by the user.
- Keep other source labels and descriptions available even where the UI uses a corrected display spelling.
- Configure applicability by equipment type and, when necessary, by equipment model. Do not assume an STS crane has gantry tyres or a diesel engine merely because these entries exist in the shared classification.
- Keep the business classification separate from the 3D scene tree. Structural members, machinery-house enclosures, and visual groups must not force changes to the approved codes.

Use the hierarchy `equipment -> main mechanism instance -> submechanism instance -> main part instance`. Definitions may be shared between equipment templates; installed components and their repair/replacement history must remain specific to each equipment item and component position.

## Major technical baseline from the general arrangement

The following values were visually verified in the particulars table on PDF page 1 of `J526A00（structure parameters）.pdf`, drawing number `J526A00`.

| Parameter | Drawing value | Stage 1 use |
| --- | --- | --- |
| SWL under spreader | 65 t | Equipment specifications |
| SWL under cargo beam | 75 t | Equipment specifications, distinct lifting arrangement |
| Rail gauge | 30 m | Major model geometry and specifications |
| Outreach | 70 m | Major model geometry and specifications |
| Backreach | 20 m | Major model geometry and specifications |
| Lift height above rail | 45 m | Specifications and visual reference |
| Total lift height | 63 m | Specifications; do not mislabel as overall crane height |
| Main hoist speed at 65 t under spreader | 75 m/min | Optional technical details, with load condition |
| Main hoist speed at 50 t under spreader | 90 m/min | Optional technical details, with load condition |
| Main hoist speed with empty spreader | 180 m/min | Optional technical details, with load condition |
| Trolley speed | 244 m/min | Optional technical details |
| Gantry speed | 46 m/min | Optional technical details; source conflict below |
| Boom hoisting | 0 to 80 degrees in less than 5 min | Optional technical details |
| Main hoist motors | 2 x 450 kW | Major assembly specification |
| Trolley motor | 1 x 275 kW | Major assembly specification |
| Gantry motors | 16 x 20 kW | Major assembly specification |
| Boom hoist motor | 1 x 375 kW | Major assembly specification |
| Rail type | QU120 | Equipment specifications |
| Power supply | 11 kV +/-10%, 3-phase, 50 Hz +/-2% | Equipment specifications |

The overview table gives gantry speed as 46 m/min; the main-data table on PDF page 1 of `J526A0600.pdf` gives 45.5 m/min. Preserve both source observations and resolve the intended display value during technical validation. Do not silently overwrite one value or claim that the difference is an approved rounding rule.

Store values with units, source drawing/page, verification status, and model applicability. Drawing ratings are static specifications, not live sensor readings or evidence of current operating condition. Unknown current values must remain unknown.

## Initial drawing mapping

This maps reference documents to the supplied classification. It is not a claim that every drawing is a separate submechanism or that detailed 3D geometry already exists.

| Drawing reference | Relevant supplied classification | Modeling or record purpose |
| --- | --- | --- |
| J526A00; J526A0100 | Multiple mechanisms; structural main parts | Overall proportions, frame, legs, girders, boom, structural members |
| J526A0300; J526A2000 | 01 Hoist; 011 Hoist; 015 steel rope | Hoist drive, motors, drums, reeving |
| J526A0200; J526A0400; J526A2100; J526A2200 | 02 Trolley; 021, 022, 023, 024 as applicable | Trolley assembly and travel/reeving systems |
| J526A0500; J526A2300; J526A6200; J526A6300 | 03 Boom; 031, 032, 033 as applicable | Boom hoist, reeving, stowage and anti-collision records |
| J526A0600; J526A4000; J526A6000; J526A6100 | 04 Gantry; 041, 042 as applicable | Bogies, drives, cable reel, anchoring and tie-down |
| J526A1200 | 06 Spreader; 062 Headblock | Headblock assembly |
| J526A1300 | Additional lifting-attachment main part; exact parent to confirm | Cargo beam; do not assume it is identical to the over-high hanger in 064 |
| J526A3100; J526A3200; J526A3300 | 14 Cabin; 141 | Cabins and operating stations |
| J526A5000 | 15 Auxiliary system; 151 | Platforms, access stairs and rails; structural members need explicit part assignments |
| J526A5100 | 15 Auxiliary system; 153 Elevator | Elevator records and visual location |
| J526A1600; J526A7000; J526A7100 | 15 Auxiliary system; 151, subject to final part mapping | Service cranes, compressor and auxiliary locations |
| J526A1400 | 16 Emergency mechanism; 161 | Emergency drive |
| J526A7400 | Cross-cutting, assigned to the relevant mechanism | Limit-switch positions; avoid a duplicate mechanism taxonomy |
| Sheave.pdf; ZT2-015022 - Trolley wheel.pdf | Main parts under their relevant installed assemblies | Component reference and replacement position |

The supplied folder does not contain an editable GLB, glTF, FBX, OBJ, STEP, or Blender model. PDF/raster drawings are references for creating geometry, not ready-to-use interactive models.

## Stage 1 design recommendations

These recommendations support the confirmed scope. They are technical implementation choices rather than additional user-requested modules.

- Fleet dashboard: use lightweight equipment silhouettes or thumbnails, textual status labels, counts and filters. Load a full interactive 3D scene on an equipment detail page, avoiding a separate heavy scene for every fleet tile.
- Equipment detail: mechanism tree at left, primary 3D viewport in the centre, selected-part details and work history at right. Support breadcrumbs, reset view, fit selection, visible labels, and overall/technical modes.
- Provide a list/tree route to the same equipment and part records for keyboard users and devices where 3D rendering is unavailable.
- Preserve the CICT crane paint appearance. Use outlines, badges and a clear legend for job/status overlays so red structural paint cannot be mistaken for Breakdown status.
- Model only major assemblies and identifiable replacement positions in stage 1. Omit fabrication bolts, exact gear teeth, weld details, and exhaustive electrical internals unless a specific tracked part requires them.
- A hidden device, such as a PLC or inverter, can use an interior assembly view or a clearly labelled location hotspot. Do not fabricate detailed manufacturer geometry from an absent source.
- Give scene nodes stable identifiers mapped to database component instances. Model display names and array indices are not persistent business identifiers.
- Keep fleet operational status independent from job lifecycle. A completed job must not automatically mark equipment Ready for OPS without an explicit agreed rule.
- Keep part replacement events separate from free-text job notes. Capture installed position, removed/installed part details where known, completion date, responsible user, and linked job/evidence. Do not invent serial numbers or installation dates.
- Record who changed operational status or completed/corrected work and when. Concurrent updates must not silently discard another user's changes.
- Technical drawings and photos need authenticated access when the application is deployed. Use the existing Portal authentication contract after inspecting its current implementation.
- Keep app records and migrations within the EQ Maintenance app's own data boundary. Portal app registration and central role grants are a separately identifiable integration step.

## External references inspected

- The SOW's SketchUp 3D Warehouse reference could not be fetched through the research tool because the site returned 403. Its geometry and availability were not verified.
- The SOW's [TurboSquid reference](https://www.turbosquid.com/3d-models/harbor-crane-contains-3d-model-1562481) was inspected. Treat it as a visual reference; no model has been purchased, downloaded or approved for this project.
- The [CICT equipment page](https://www.cict.lk/index.php/equipements) was found during reference research. Public fleet counts are not a substitute for the user's equipment register or proof that this drawing family fits every item.
- The [Three.js documentation](https://threejs.org/docs/) was inspected for the scene hierarchy, picking and model-loader approach. Final library versions and compatibility must be checked when the implementation stack is selected.

## Confirmed decisions

1. **Stage 1 equipment coverage:** QC 3D first, with QC/RTG/ES supported in the fleet register and dashboard. Full RTG and ES 3D models are deferred.
2. **Portal integration:** a separate app integrated with existing ENG Portal login, role, database-technology and IIS hosting patterns.
3. **Job permissions:** EQ Team can create and complete repair/replacement jobs; Admin can manage and correct them, with history recorded. There is no additional Admin completion-approval step.
4. **Incomplete mechanism entries:** preserve codes, leave 10 unassigned, keep 048/063 inactive, name 061 Spreader and 062 Headblock, and configure applicability by equipment type.
5. **3D inputs and detail:** build simplified models from the supplied drawings, preserving accurate overall shape and major assemblies with simplified internal components for drill-down.

The implementation prompt pack is in `F:\CODEX\EQ_MAINTENANCE\documents\prompt-pack`. It covers scope, mechanism seed definitions, model/part mapping, data and authorization contracts, UI prototypes, staged build prompts, review checkpoints, acceptance scenarios, and deployment preparation. Production changes are outside this prompt-pack authoring request.

## Pre-implementation review decisions (21 October 2026)

A second review of the SOW and prompt pack confirmed four further decisions: no EAM/Maximo work-order reference or synchronisation; no historical bulk import; QC main parts derived from the drawings and confirmed by Admin; EQ Team may cancel uncompleted jobs they created, with Admin cancelling any and correcting completed work. Prompt pack 1.2 records these decisions and adds user checkpoints U1 and U2. See `prompt-pack\CHANGELOG.md`.
