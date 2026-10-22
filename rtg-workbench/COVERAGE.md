# Assembly coverage and fidelity

All assemblies remain **provisional geometry**. “Verified” below applies only to the stated count, nominal dimension or relationship. Detailed original drawings were not supplied. The user explicitly authorized visible assumptions on 22 October 2026 when parameters are missing or inconsistent.

| Assembly | Established evidence | Model representation | Unresolved / required source |
|---|---|---|---|
| Main frame | Two box girders, four legs, two sills, 23.47 m span; M14 p20/22 | Separate tapered welded members, flange edges, top braces | Sections, total/rail height, diaphragms, connection plates: JL28600/03 |
| Running rails / stops | 80 mm square rails, 6.4 m gauge, 18.5 m travel; p16/20/21 | Two rails, four buffers, bracket envelopes | Stop geometry and exact stopping clearance |
| Tyres / rims | Eight tyres, nominal approximate Ø1860; p17 | Eight rounded tyres with tread, rims, hubs and fasteners | Unloaded profile, manufacturer tread, exact rim/width |
| Equalizers / carriers | Four pairs, 2.8 m pair pitch, 7.9 m equalizer base; p20/24 | Profiled beams, shafts and wheel forks | JL28601 A/B exact sections/pins |
| Gantry drives | Four driven outer wheels, four 25 kW drives; p17/23 | Motors, reducers, chain guard and sprocket envelopes | Real motor housings, chain strand path and chain tooth forms |
| Steering / bearings | Eight-wheel steerable arrangement; p24 | Slewing bearing rings, cylinders and link bars | Pivots, lock geometry and strokes; **animation disabled** |
| Trolley frame / wheels | Four Ø500 wheels, 6.4 m gauge, 4.05 m derived base; p16/21 | I-section frame, four wheels/axles, guide rollers | Local plate sections, bearing seats and welding details |
| Trolley drives | Two direct wheel drives, 15 kW each; p12/16 | Two separate drive housings | Vendor reducer/motor case geometry |
| Hoist drum | One Ø1200 barrel, eight groove groups; p16/25 | Rotating barrel, eight band regions, shaft supports | Actual helical groove pitch/profile, dead wraps and spooling; rings are visual indication |
| Motor / reducer / brakes | One 180 kW motor/reducer, two brakes; p16/25 | Separate motor/fan, reducer, brake discs/calipers, coupling shafts | Exact casing, shaft elevations and brake models |
| Sheaves / ropes | Twelve trolley sheaves, eight rope routes, four paired terminations; p26/27 and M13 p193 | Eight oriented fall sheaves, four staggered horizontal guides; eight animated attached falls | Exact shaft coordinates and full continuous wrap/guide tangencies; source plan orientation ambiguous |
| Headblock | Separate frame, basket and adjustment devices; p21/28 | 5.0 m end references, 5.38 m rope-terminal span, basket, turnbuckle envelopes | Mounting pin geometry, suspension height relative to spreader |
| Spreader | Electric telescopic arrangement, 20/40 ft; p13/28 | Retracted beams, four twistlocks/flippers, headblock links | Supplier-specific body, flipper pivots and telescopic mechanism; **telescope/skew disabled** |
| Cabin | Travels with trolley; approx. 2.2 × 2.0 m body; M13 p11, M14 p21/34 | Sloping glass, door, roof, suspension, ladder, side landing; 2.4 m length / 1 m forward datum | Floor elevation assumed 24.850 m to favor detailed trolley view; GA silhouette differs |
| Cabin interior / cooling | Seat, paired consoles, wiper and AC; p34 | Simplified visible technical-mode interior and roof AC | Vendor seats/controls, exact AC mounting and detail |
| Energy chain | IGUS project carrier; p36 | Constant-length U of 104 links, tray and trolley connection | Anchor positions, exact cross-section and bend radius assumed; current 0.3 m radius is illustrative |
| Power installation | Diesel + lithium battery; p12/14/15 | Power-room shell and distinct engine/generator/battery **qualified markers** | Detailed generator, battery racks, cooling/exhaust: **not modelled as vendor internals** |
| Electrical room | Above sill; p36 | Enclosure, access door/louvres; control/drive/PLC **qualified markers** | Cabinet schedule, internal mounting and exact placements |
| Stairs / upper access | Stair-side route and girder walkways; p20 | Corrected zigzag direction, treads, landings, rails and cabin ladder | Flight/tread counts and local connection detail estimated; JL28604 required |
| Lighting / sensors | Trolley floodlight callout; p21. Generic limit-device discussion p29-34 | Simplified trolley lights | Additional exact sensor/light mounts **missing**, not fabricated |
| Identity / finish | Seven user-supplied CICT photographs; readable CICT/ZPMC/40.5t markings | Red steel, white cabin/rooms, yellow spreader, safety stripes and flag artwork | **Photo-referenced**; colour codes, fine logo details and flag placement remain approximate. See APPEARANCE.md |
| Generic variants | Manual contains sixteen-wheel, four-rope, other drive/feed arrangements | **Inapplicable**, excluded | No mixing generic alternatives into this model |

All 121 semantic nodes have source references and qualifications; 103 are candidate maintainable positions, eight are qualified area markers, and ten are spatial containers. These are standalone demonstration candidates. Real applicability and maintainable-position granularity require Admin confirmation. A detailed motor and its parent assembly must not automatically create duplicate real maintenance positions.

Actual nominal dimensions are checked from imported mesh vertices and transforms in `evidence/validation/accuracy.json`. Primitive-level construction and source annotations are in `model/1/geometry-parameters.json`. Any literal thickness, bolt size, guide location or similar value not promoted in the explicit dimension table remains an estimate.
