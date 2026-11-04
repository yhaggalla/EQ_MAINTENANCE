// Authoring dimensions are millimetres. Only the export builder converts to metres.
// A read dimension does not make an entire simplified assembly exact.
const dim = (value, document, pdfPage, figure, endpoints, kind = 'measured', confidence = 'high', note = '') => ({ value, unit: 'mm', document, pdfPage, figure, endpoints, kind, confidence, note });
export const dimensions = {
  span: dim(23470,'M14',20,'Fig 2-1 / JL28600','left/right gantry support centre planes in X; confirmed by table 2-2 p15'),
  base: dim(7900,'M14',20,'Fig 2-1 / JL28600','front/rear equalizer pivot centres in Z; not outer tyre centres'),
  bogiePitch: dim(2800,'M14',20,'Fig 2-1 / JL28600','two tyre axle centres within one equalizer'),
  gauge: dim(6400,'M14',21,'Fig 2-2 / JL28606','two trolley rail/wheel running centre planes in Z'),
  trolleyBase: dim(4050,'M14',21,'Fig 2-2 / JL28606 plan','front/rear trolley wheel axle centres along X; 2025 + 2025','drawing-derived','medium'),
  cabFrontOffset: dim(1000,'M14',21,'Fig 2-2 / JL28606 side','trolley centre plane X=0 to cabin forward glazing envelope','measured','medium','Raster dimension; excludes roof gutter and frame thickness.'),
  cabBodyLength: dim(2400,'M14',21,'Fig 2-2 / JL28606 side','forward glazing envelope to rear cabin wall reference plane','measured','medium'),
  trolleyTravel: dim(18500,'M14',20,'Fig 2-1 / JL28600','extreme operating trolley centre positions in X'),
  trolleyEndInset: dim(2485,'M14',20,'Fig 2-1 / JL28600','gantry support centre to extreme trolley centre; (23470-18500)/2','drawing-derived'),
  lift: dim(21200,'M14',15,'Table 2-2; JL28600','ground to spreader lifting interface at highest position; not structural height'),
  tyreDiameter: dim(1860,'M14',17,'Table 2-5','effective rolling diameter; source explicitly approximately 1860','measured','medium','Working diameter is approximate, not unloaded tyre envelope.'),
  trolleyWheelDiameter: dim(500,'M14',16,'Table 2-4','trolley wheel rolling diameter'),
  railSection: dim(80,'M14',16,'Table 2-4','square trolley rail side; confirmed M13 p11'),
  drumDiameter: dim(1200,'M14',16,'Table 2-3','nominal drum barrel diameter'),
  ropeDiameter: dim(28,'M14',16,'Table 2-3','nominal rope diameter; M13 p8 agrees; M13 p13 says 29','measured','medium','Conflict C03 remains unresolved.'),
  railHeight: dim(27754,'M14',20,'Fig 2-1 / JL28600','ground to top of trolley rail; tentative raster reading','estimated','low','Last digits and exact arrow termination require original JL28600. Not an established exact dimension.'),
  totalHeightRead: dim(null,'M14',20,'Fig 2-1 / JL28600','ground to highest trolley feature','unavailable','low','Approximate TOTAL HEIGHT annotation is not unambiguously legible; do not use as exact input.'),
  cabHeight: dim(2200,'M13',11,'section 4','cab exterior bottom to roof','measured','medium','Text gives approximately 2.2 m.'),
  cabWidth: dim(2000,'M13',11,'section 4','cab transverse width','measured','medium','Text gives 2 m; other shape dimensions estimated from M14 p21,34.'),
  headblockRopeSpan: dim(5380,'M14',21,'Fig 2-2 / JL28606','outer headblock rope attachment centres along Z','measured','medium','5380 raster read; exact pin geometry unavailable.'),
  headblockFrameSpan: dim(5000,'M14',21,'Fig 2-2 / JL28606','headblock end-frame reference lines along Z','measured','medium'),
  // Table 2-5: chain 160SW pitch 50.80 mm, sprocket ratio 58/17. Pitch diameter = p / sin(180°/N).
  wheelSprocketPitchDiameter: dim(Number((50.8/Math.sin(Math.PI/58)).toFixed(1)),'M14',17,'Table 2-5','58-tooth wheel sprocket pitch circle','drawing-derived','high','Derived from pitch 50.80 mm and 58 teeth; tooth form not modelled.'),
  driveSprocketPitchDiameter: dim(Number((50.8/Math.sin(Math.PI/17)).toFixed(1)),'M14',17,'Table 2-5','17-tooth reducer output sprocket pitch circle','drawing-derived','high','Derived from pitch 50.80 mm and 17 teeth; tooth form not modelled.'),
};
// All below are deliberately estimates, with source-linked primitive-level recipes exported
// to geometry-parameters.json. They are not fabrication dimensions or hidden internals.
export const estimates = {
  girderDepth: 2050, girderWidth: 900, girderLength: 24600,
  sillTop: 4440, sillDepth: 800, sillWidth: 850, sillLength: 8900,
  legBottomWidthX: 700, legTopWidthX: 1150, legBottomWidthZ: 700, legTopWidthZ: 850,
  braceY: 22100, braceDiameter: 180,
  tyreWidth: 560, tyreRimDiameter: 1050,
  trolleyBase: 4050, trolleyFrameDepth: 480, trolleyFrameWidth: 5900,
  trolleyFrameLength: 4850, trolleyFloor: 28004,
  drumLength: 2900, drumCentreY: 28870, drumCentreZ: 0,
  motorCentreZ: 1565, sheaveDiameter: 840, guideSheaveDiameter: 840, sheaveWidth: 100,
  // Rope-centre pitch diameters: 30 × rope Ø, the drum rule stated on p25; plan circles read ≈ Ø0.87 m.
  // Reeving layout read from JL28606 front/side views (vertical end-pair ropes ≈ ±2.65 m in Z, side diagonals from
  // ≈ ±2.35 m in X) and constrained by the trolley frame: fall sheaves sit inside the end beams and crane girders.
  // Four turning jacks (user, 4 November 2026; M13 p19, M14 p66). No jack drawing supplied: rated for a quarter of
  // the crane weight with margin (manual uses 50 t jacks at the wheels), Ø300 body, Ø180 rod, pad 300 mm above ground.
  turningJack: { offsetX: 850, bodyRadius: 150, rodRadius: 90, bodyBottomY: 1300, padTopY: 360, padThickness: 60, padSize: 620, bracketWidth: 420 },
  reeving: {
    grooveX: [172.5, 517.5, 862.5, 1207.5],  // ± eight groove-group centres on the 2.9 m drum, 345 mm pitch
    endSheaveX: 1780, endSheaveZ: 2640,      // end-pair fall sheaves (shaft along Z), inside end beams / girders
    sideSheaveZ: 2100,                        // side-pair fall sheaves (shaft along X) at their groove X
    ropeTerminalZ: 2690,                      // 5380 / 2 headblock rope terminal span (M14 p21)
    endRopeX: 600, endRopeY: 2050,            // end-pair rope sockets above the headblock (V links in side view)
    sideRopeZ: 300, sideRopeY: 1900,          // side-pair rope sockets (V links in front view)
    sidePinX: 600, pinY: 1460,                // edge-midpoint pins; headblock width ≈ 1410 in side view
  },
  cabCentreX: 2200, cabCentreZ: 0, cabFloor: 24850, cabLength: 2400,
  headblockWidth: 1200, headblockDepth: 430, spreaderDepth: 680,
  spreaderLength: 6050, spreaderWidth: 2440, spreaderFrameCentreY: 360,
  hoistHome: 5000, hoistMinDemo: 1000, hoistMaxDemo: 21200,
  eRoomWidth: 2200, eRoomLength: 4200, eRoomHeight: 2800,
  powerRoomWidth: 2300, powerRoomLength: 4300, powerRoomHeight: 2200,
  railHeightApproxTolerance: 300,
};
export const sources = {
  structure: { document:'M14', pdfPage:20, figure:'Fig 2-1 / JL28600; Fig 2-3 p22', note:'Counts and topology verified; member profiles and connection thicknesses scaled estimates. M13 p71,246-249 corroborate shape.' },
  gantry: { document:'M14', pdfPage:24, figure:'Fig 2-5 / 2-6; JL28601 listed on p20', note:'Four driven outer wheels per project p17/23. Equalizer, carrier, bearing, steering, chain and guards simplified from eight-wheel views.' },
  trolley: { document:'M14', pdfPage:21, figure:'Fig 2-2 / JL28606', note:'Arrangement + direct double wheel drive; dimensions not explicitly in the dimension table are visual estimates. M13 p72 repeats this drawing.' },
  hoist: { document:'M14', pdfPage:25, figure:'Fig 2-10; JL2860608 listed p21', note:'One motor/reducer/drum, two brakes; shapes estimated. Eight groove GROUPS from p16 override generic four-group prose; pitch unavailable.' },
  ropes: { document:'M14', pdfPage:27, figure:'Fig 2-14; JL2860603 listed p21', note:'Eight routes, twelve trolley sheaves, four paired edge terminations. Exact sheave-axis coordinates and drum departure tangencies unresolved; schematic paths.' },
  spreader: { document:'M14', pdfPage:28, figure:'Fig 2-18; JL28606 p21; M13 p24', note:'Separate headblock and electric telescopic spreader. Retracted visual envelope only; no supplier manufacturing dimensions. Cylinders/turnbuckles are qualified simplified forms.' },
  cabin: { document:'M14', pdfPage:34, figure:'Fig 2-35; JL2860606 listed p21; M13 p11', note:'Cab follows trolley. Angled lower glazing, door, support, seat and two consoles. Shape/offset except stated approximate height and width estimated.' },
  electrical: { document:'M14', pdfPage:36, figure:'Fig 2-42; JL28607 listed p20', note:'E-room above sill. Cabinet identities and exact placement unavailable; qualified area markers only.' },
  power: { document:'M14', pdfPage:14, figure:'section 2.1.2; JL28609 listed p20', note:'Diesel plus lithium battery verified. Power-room envelope estimated from GA. Vendor internals and battery mounting not established; area markers only.' },
  chain: { document:'M14', pdfPage:36, figure:'Fig 2-43/44; M13 p23', note:'Project IGUS 5050RHD.30.300.0. Exact guide, bend radius and fixed-end geometry unavailable; dynamic path illustrative.' },
  access: { document:'M14', pdfPage:20, figure:'Fig 2-1 / JL28600; JL28604 listed', note:'Access route follows stair-side silhouette. Flight rise/run, tread count, rails and landing dimensions estimated; original JL28604 required.' },
  lights: { document:'M14', pdfPage:21, figure:'Fig 2-2 / JL28606 item 11', note:'Trolley floodlight shown; exact fitting shape/other crane lighting locations unavailable.' },
  // Revision 2 (300-part model, 4 November 2026). Each entry names the page that establishes the part.
  frameDetail: { document:'M14', pdfPage:22, figure:'Pic 2-3 gantry frame', note:'Girders, rails, buffers, tapered legs, brace bar and sill beam with end lugs. The buffer support doubles as the lifting ear. Rail fixing by clips or welding; clip pitch, joint plates and gussets estimated.' },
  bogieDetail: { document:'M14', pdfPage:24, figure:'Fig 2-5 / 2-6 eight-wheel drive and idle bogies; p23', note:'Labelled lock-pin cylinder, equalizer, drive device, slewing bearing, small/large sprockets, driven/driving wheels, guard, steering cylinder, anti-collision switch, link rod and protective frame. Shapes and offsets scaled estimates.' },
  gantryChain: { document:'M14', pdfPage:17, figure:'Table 2-5; Fig 2-5 p24', note:'Double-strand bush roller chain 160SW pitch 50.80 mm, ratio 58/17. Sprocket pitch circles derived; tooth form, chain path and guard plates simplified.' },
  hoistDrive: { document:'M14', pdfPage:25, figure:'Fig 2-10 hoist driving mechanism; p26 switches', note:'Motor, high-speed coupling, reducer with oil indicator/breather, two high-speed brakes, drum coupling and bearing seat. Motor encoder plus overspeed and cam limit switches on the drum shaft end (p26). Casings estimated.' },
  trolleyItems: { document:'M14', pdfPage:21, figure:'JL28606 item list (items 7, 9, 10, 11, 12, 13); p38 anchor/guide/buffer text', note:'Over-height limit, trolley anchor devices (two per p38), side rollers, centralized lubrication, spreader cable reel and trolley connect box are listed; their exact shapes and mounting points are estimated.' },
  gaItems: { document:'M14', pdfPage:20, figure:'JL28600 item list (items 5, 10, 12, 13)', note:'Name plate arrangement, limit switch assembly, hydraulic station and GPS/RCMS support are listed on the general arrangement; positions read approximately from the views, fittings estimated.' },
  safety: { document:'M14', pdfPage:14, figure:'section 2.1.2 main features; p23', note:'Wind speed indicator, anti-collision device on four corners, lighting and signal apparatus and gantry-travel alarm are stated. Device models and mounting positions are not given; locations estimated.' },
  eroom: { document:'M14', pdfPage:36, figure:'Fig 2-42 E-room; Fig 2-43/2-44 energy chain', note:'E-room on sill with platform/guard rail and two air conditionings; leg-mounted lamp visible. Stainless steel chain guide and L bracket with floating connection. Dimensions estimated from photographs.' },
  jacking: { document:'M13', pdfPage:19, figure:'section 8.1-8.2 gantry traveling; M14 p66 tyre inspection; user statement 4 November 2026', note:'Each tyred wheel is rotated about its centre by 16° and 90° under non-operational conditions (M13 p19), and turning tyres without the jack-up device wears them (M14 p66). The user confirmed four jacks per RTG for turning. No jack drawing, rating, stroke or mounting was supplied: position between the two tyres of each bogie, size and retracted pose are estimates.' },
  reeving: { document:'M14', pdfPage:27, figure:'Fig 2-14 8 ropes reeving; p26 text; JL28606 front/side views p21', note:'Topology from the text and Fig 2-14: ropes clamped on the drum, 12 trolley sheaves (8 fall + 4 horizontal guides), pairs joined through turnbuckles at the four headblock edge midpoints as four isosceles triangles. Fall planes and positions read from the trolley views; groove assignment, sheave shaft coordinates and diameters are estimates. Top/bottom drum leads follow from all ropes winding in together.' },
  busbar: { document:'PHOTO:IMG_20171109_140808.jpg / IMG_20171109_141902.jpg / IMG_20171109_141914.jpg; M14', pdfPage:12, figure:'User site photographs; Table 2-1 supply types', note:'Photographs show a DZD-230 self-connecting busbar power collector fitted to the crane. M14 Table 2-1 lists low-voltage contact-bus supply as a type, while the original project option was diesel generator + lithium battery. Retrofit status, side and geometry are photo-estimated.' },
};
