# Source audit and limits

22 October 2026. These files describe the ZP12-1874 project, not the present fleet or the association of any named crane. All page references below are **one-based PDF pages**. Source checksums and all 437 page sizes/text-presence records are in `evidence/sources/source-register.json`.

| ID | Supplied document | PDF pages | Cover | Drawing references |
|---|---|---:|---|---|
| M13 | user manual (mechanical part).pdf |255|June 2013, ZP12-1874|JL28600 on PDF71 (printed 2-8); JL28606 on PDF72 (printed 2-9)|
| M14 | user manual for CICT 40 RTGs (mechanical).pdf |182|September 2014, ZP12-1874|JL28600 on PDF20 (printed 10), Fig2-1; JL28606 on PDF21 (printed 11), Fig2-2|

The two arrangement illustrations show the same project and drawing numbers. No legible revision entry or issued revision history establishes that every 2014 illustration supersedes the 2013 one. M14 PDF12 Table2-1 explicitly identifies the project options and warns that the manual also contains generic information. PDF page numbering, printed chapter numbering (which restarts), figure labels and drawing identifiers are stored separately; they are not interchangeable.

The cover, project configuration, parameter tables, general/trolley arrangements, frame, eight-wheel bogies, hoist/reeving, cabin, electrical room, chain and access illustrations were rendered and visually inspected. Enlarged crops retain the raster limitations. M13 PDF71/72 repeats the arrangement images without recovering missing resolution. Text extraction covers every page; this is an inventory, not a claim to have manually inspected every maintenance paragraph. Readable dimension-bearing drawings and relevant mechanism illustrations are the modelling basis. Generic maintenance illustrations have no automatic project applicability.

## Configuration and conflict log

| ID | Observation | Handling |
|---|---|---|
| C01 | M14 p12/13 and M13 p6 specify 6+1, one-over-six. M14 p15 says stacked7/pass6; M13 p7 says stacked6/pass7. | Preserve all readings. Do not infer crane structural height from container counts. |
| C02 | M14 p16 and M13 p8/13 give 8 groove groups; M14 p25 generic prose says4 and its callout legend disagrees with the numbered picture. | Eight band regions displayed; exact helical groove pitch/profile unavailable. Do not duplicate four-rope anti-sway hardware. |
| C03 | M14 p16/M13 p8 give28 mm rope; M13 p13 says29 mm. | Use table nominal28 for the provisional visual; flag conflict, no maintenance replacement advice. |
| C04 | M13 p7 and M14 p15 give205 kW engine; M13 p22 says150 kW. Alternator180 kW in M13,180 kVA in M14. | No reconciliation guessed; no power-based geometry. |
| C05 | M14 p23 discusses diagonal two-wheel drive then says this project has four driven wheels; p17 confirms4/8. | Four corners, outer wheel driven in each pair; eight-wheel illustration used,16-wheel type excluded. |
| C06 | M14 GA list calls item8 a festoon cable feeding system; M13 p23 and M14 p36 explicitly identify IGUS energy chain for this project. | Chain shown with provisional guide/bend; no combined festoon/chain installation. |
| C07 | M13 p8 trolley motor1650 rpm; M14 p16 says1740 rpm. | Retained in source text; demonstration wheel rotation is geometric, not inferred motor rpm. |
| C08 | GA overall-height raster and rail elevation last digits are not unambiguous. | Rail elevation27754 mm is a LOW confidence estimate, never included among exact-match assertions. Overall total-height annotation remains unavailable. |
| C09 | p27/28 include optional side shift and multiple hydraulic/electric variants. M13 p24 says electric telescopic spreader but adjusting cylinders on headblock. | Show a qualified headblock adjustment representation; disable steering, telescope and skew animation until pivots/limits/variant are confirmed. |
| C10 | User supplied seven CICT photos, clarified CICT company flag, and added its artwork PNG. | Photo-referenced red steel, white enclosures, yellow spreader, CICT flag/ZPMC/capacity signs and hazard guards. The supplied flag PNG is embedded unchanged. Paint values, ZPMC lettering and panel dimensions remain approximate. See APPEARANCE.md. |
| C11 | Uniform overlays show the cabin elevation and suspended headblock pose differ between the small GA and enlarged trolley arrangement. Plan projection / machinery handedness is also unclear. | Use the 1.0 m forward envelope and 2.4 m body-length dimensions; raise the assumed cabin floor to24.850 m to match the detailed trolley view. Keep a true top projection and document remaining plan/reeving differences. No warped reference or invented exact vertical offset. |
| C12 | Three user photographs (November 2017) show a DZD-230 self-connecting busbar power collector on the crane; M14 p12 lists the project supply as diesel generator + lithium battery, with low-voltage contact bus only as a listed type. | Model the collector as a **photo-referenced retrofit** (`electrical.busbar.*`), side and geometry estimated. Retain the manual's original power arrangement and its markers. Retrofit date, scope and fleet applicability are unconfirmed. |
| C13 | JL28606 item 9 lists one trolley anchor device assembly; M14 p38 says two anchor devices are set on both sides of the trolley frame. | Model two anchors (`trolley.anchor.rear/front`) following the explicit p38 text; treat the item-list quantity as an assembly count. |
| C15 | v1 drew rope leads as schematic segments that crossed the trolley and the side-pair falls leaned in two axes. M14 p26 text and Fig 2-14 fix the topology; the JL28606 front and side views fix the fall planes (end-pair ropes vertical at z ≈ ±2.65 m in the front view; diagonals from x ≈ ±2.35 m in the side view). | Revision 2.1 rebuilds the reeving as a tangent-continuous layout (see below). The manual's rope lengths (42.3 × 4, 43.5 × 2, 44.9 × 2) are not used as inputs, but the modelled free lengths fall into the same 4 + 2 + 2 groups in the same order, which supports the layout. Groove assignment and sheave coordinates remain estimates. |
| C16 | The user stated on 4 November 2026 that each RTG has four jacks for turning. The manuals describe 16° / 90° wheel turning (M13 p19) and a jack-up device for turning (M14 p66) but give no jack drawing; the supplied photographs show the wheel king-pin columns, not the jacks. | Model four turning jacks (`gantry.turning-jack.*`) at estimated positions between the tyres of each bogie. Rating, stroke and mounting require the vendor or as-built drawing. To keep the 300-part count, the welded sill-end lifting lugs became geometry of their sill beams. |
| C14 | M14 p14/23/26 and GA items 5/10/12/13 name devices (wind speed indicator, corner anti-collision devices, travel alarm, drum-shaft switches, motor encoder, name plates, limit switches, hydraulic station, GPS/RCMS support) without dimensions or mounting coordinates. | Add each as a separate selectable part at an **estimated** location with its source page; no vendor geometry is implied. |

## Revision 2 — 300-part breakdown (4 November 2026)

The user asked for the model to be perfected against the documents in `RTG drawings/` using 300 parts, updating the same model without integrating it into the main app. Both manuals' arrangement, frame, bogie, hoist, reeving, spreader, cabin, E-room and chain pages and all supplied photographs were re-inspected. Additions and splits are traced to new source entries in `source/parameters.mjs` (`frameDetail`, `bogieDetail`, `gantryChain`, `hoistDrive`, `trolleyItems`, `gaItems`, `safety`, `eroom`, `busbar`). Derived values added to the dimension table: 58-tooth and 17-tooth sprocket pitch diameters (Table 2-5). The brace bar now ends at clevises on the inner leg faces instead of inside the legs, and the cab hangers now hang from cantilever support beams instead of ending in free space. Conflicts C12–C14 above record the remaining interpretations.

## Revision 2.1 — reeving rebuilt (4 November 2026)

The user reported that the wire ropes were still wrong and asked for the documents to be analysed again. Re-read: M14 p26 (8-rope reeving text), p27 Fig 2-14 (vector figure, traced at 600 dpi), and JL28606 front, side and plan views at native resolution.

- **Topology (documented):** one end of each rope is clamped on the drum; the rope goes round the trolley sheaves; two ropes a group connect through adjusting turnbuckles to the midpoint of one of the headblock's four edges, forming four isosceles triangles. 12 sheaves = 8 fall + 4 horizontal guides.
- **Planes (read from JL28606):** end pairs hang in the X-Y planes z = ±2,640 mm and appear as vertical ropes at the headblock ends in the front view. Side pairs hang in the Y-Z planes of their drum grooves and form the V of diagonals in the front view.
- **Physical consistency (derived):** all eight ropes must wind in for one drum rotation, so leads toward +Z leave the drum bottom and leads toward −Z leave the top. Side-pair leads run straight from the drum into their fall sheaves. End-pair leads turn 90° on the four horizontal guides, which is why there are exactly four. Every straight lead is tangent to both circles it joins and lies in the plane of the sheave it enters.
- **Estimated:** groove assignment (±172.5 / ±517.5 / ±862.5 / ±1,207.5 mm), sheave shaft coordinates, Ø840 mm pitch diameters, socket and pin positions on the headblock. The trolley end beams moved to the frame ends (±2,425 mm), the machinery cross beams to the bearing/reducer lines (±1,640 mm), and the machinery base plates were raised so no frame member, base or grease line crosses a rope.

## Provenance and coordinate conventions

`source/parameters.mjs` is the editable dimension source. Generated `model/1/parameters.json` and `model/1/geometry-parameters.json` retain units, document, page, figure, local endpoints/centres and sizes, classification, confidence and qualifiers. Every primitive recipe inherits its semantic assembly source; recipe dimensions are **estimated** unless an explicit referenced dimension says otherwise. `measured` means a source dimension, not a site measurement. `drawing-derived` is arithmetic from source dimensions. `estimated` is a declared visual estimate. `approximate-location` is a qualified area marker. `unavailable` is allowed only in the audit parameter table, not invented as a fifth manifest provenance kind.

Authoring is millimetres; export explicitly divides coordinates and dimensions by1000 to metres. Right-handed +Y up, +X across span/trolley travel, +Z gantry travel. Origin is ground at the midpoint of the two equalizer-pivot rows and span. Front=+Z looking toward-Z; rear=-Z; left=-X and right=+X when viewed from front. The stair side is +X in this local convention; it is not asserted to be a fleet's operational left/right. No QC waterside axes apply.

Span endpoints are opposite support centre planes. Wheelbase endpoints are front/rear equalizer centres; the2800 mm tyre pitch means outer wheel-centre distance is10700 mm, not7900 mm. Trolley rail gauge is6400 mm. Trolley operating centres are ±9250 mm about span centre, with2485 mm to each gantry support centre. Lift21200 is ground to spreader lifting interface. Tyre1860 is approximate effective diameter.

## Required additional sources

1. Issued, readable JL28600/JL28603 structural arrangement and sections: confirm total/rail height, girder/leg/sill sections, connection geometry and exact clearances.
2. JL28606/JL2860602 trolley and JL2860603 reeving: sheave coordinates/axes, drum departure points, all rope terminations and clearances. The twelve-sheave count and eight-route topology are supported; exact routed geometry is not.
3. JL28601A/B wheel carriers/equalizers, steering and chain guards: pivot offsets, hydraulic geometry, limits and tyre unloaded profile.
4. JL28604 access drawings: exact stair flights, landings, tread/handrail dimensions and door openings.
5. JL2860606 cab and JL28609 power-room/vendor layouts: exact offsets, interior dimensions, generator cooling/exhaust and lithium battery placement.
6. Bromma spreader model/serial-specific drawings: telescopic travel, twistlock pitch, flipper pivots, headblock connection and adjustment mechanisms.
7. IGUS project layout and electrical room cabinet schedule; lighting/sensor installation drawings; measured paint codes and original identity-artwork masters (user-supplied appearance photos are now available).

The standalone model remains provisional until these material gaps are resolved. Export dimensional checks prove implementation of the readable dimensions; they do not certify an exact replica or a safe operating envelope.

## User-authorized visual assumptions and corrections

On22 October2026 the user confirmed that some technical data is unavailable or incorrect and authorized assumptions for the best visible result, specifically flagging the trolley, hoist, ropes and cabin. The final model uses that instruction to complete the visual assembly while retaining source qualifications. Revisions include a4.05 m trolley base, cabin forward/length reference planes, sloping cabin glazing and door, a cabin access landing/ladder, oriented fall-sheave grooves, staggered horizontal guide sheaves scaled from the plan, coupling shafts, headblock links and a moving energy carrier. A reversed stair-flight direction was corrected from the side overlay.

Revision 2.1: fall and guide sheaves use an estimated Ø840 mm rope-centre pitch diameter (30 × rope Ø, the drum rule on p25; plan circles read ≈ Ø0.87 m). These are **not newly established vendor parameters**. Fixed leads are tangent to the drum, guides and fall sheaves; the static wrap on each fall sheave extends to the departure point at maximum lift. Moving free spans use geometric tangency at the fall sheaves and their headblock sockets stay attached during motion. Fleet angle along the groove group and turnbuckle swing are not simulated. Drum rotation follows average free-span shortening and does not solve eight separate groove payout schedules. The constant-length energy-chain path uses an assumed0.3 m bend radius and12 m straight length.

The approved catalogue is frozen in `source/mechanisms-approved.snapshot.json` for reproducible standalone exports. It is a copy, not an edited authority. `source/technical-data.mjs` / generated `technical-specifications.json` carry human-readable source observations and unresolved entries for the demo/host technical sheet. Numerical values in the interface cite manual pages and separate assumptions from table values.
