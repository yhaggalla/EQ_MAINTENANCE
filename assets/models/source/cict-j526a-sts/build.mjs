// CICT-J526A-STS scene definition, version 1 (P03). Editable model source.
// Run through tools/model-generator/generate.mjs, which supplies the kit, builder and parameter reader.
// Units: metres. Axes: Y up, +X along the boom toward waterside, Z along the rails. Origin: top of the waterside
// rail on the crane transverse centreline (landside rail at X = -30). 'a' = +Z side, 'b' = -Z side.
// Every dimension comes from params.json (with provenance) or is declared here as an estimate in the node provenance.

export function buildCrane({ kit, SceneBuilder, Materials, P, THREE }) {
  const { box, boxMinMax, tube, cyl, beam, taper, gableRoof, sheave } = kit;
  const src = (drawing, pdfPage, note) => ({ drawing, pdfPage, note });

  const mats = new Materials({
    paint: { color: '#d22a33', roughness: 0.55, metalness: 0.15, role: 'CICT structural red (photos images.jpg / images2.jpg; site photos documents/Image_20261021*.jpg)' },
    houseWall: { color: '#eef1f3', roughness: 0.8, role: 'light machinery-house enclosure (photos)' },
    houseRoof: { color: '#d4dade', roughness: 0.8, role: 'house roof' },
    grating: { color: '#a9262d', roughness: 0.9, role: 'walkways, stairs and platforms: red, slightly darker than the structure (site photos Image_20261021165608.jpg, Image_20261021165846.jpg)' },
    steel: { color: '#8c949b', roughness: 0.45, metalness: 0.6, role: 'rail / wheel steel' },
    machinery: { color: '#5d6873', roughness: 0.6, metalness: 0.3, role: 'motor / reducer (neutral, vendor colour not established)' },
    drum: { color: '#a7b0b8', roughness: 0.4, metalness: 0.6, role: 'rope drum' },
    brake: { color: '#3d454d', roughness: 0.6, metalness: 0.3, role: 'brake (neutral)' },
    rope: { color: '#2b2e31', roughness: 0.8, metalness: 0.2, role: 'steel rope' },
    cabinet: { color: '#cdd2d7', roughness: 0.7, role: 'electrical cabinet (neutral)' },
    transformer: { color: '#7d8a94', roughness: 0.7, metalness: 0.2, role: 'transformer / switchgear (neutral)' },
    cabin: { color: '#e6e9ec', roughness: 0.6, role: 'operator cabin body' },
    glass: { color: '#3a5468', roughness: 0.2, metalness: 0.4, role: 'cabin glazing' },
    spreader: { color: '#e0b020', roughness: 0.6, metalness: 0.2, role: 'headblock and spreader yellow (site photo Image_20261021165637.jpg, crane 01; spreaders are interchangeable, U-09; STS45 drawing not supplied, U-10)' },
    concrete: { color: '#c3c5c0', roughness: 0.95, role: 'quay context (decorative)' },
    hotspot: { color: '#0a8fb5', roughness: 0.4, opacity: 0.85, role: 'qualified location marker (not equipment)' },
  });
  const S = new SceneBuilder(mats, 'cict-j526a-sts-scene');

  // ---------- parameters (metres) ----------
  const G = P('railGauge'); const XWS = 0; const XLS = -G;
  const OUT = P('outreach'); const BACK = P('backreach');
  const XTAIL = XLS - BACK - P('girderTailBeyondBackreach');
  const XHINGE = P('hingeX'); const XTIP = XHINGE + P('boomLength');
  const XMAST = XWS - P('mastOffsetLandside');
  const G_BOT = P('girderUndersideElevation');             // 50500 interpreted as girder underside (U-19)
  const G_TOP = G_BOT + P('girderDepth'); const RAIL_T = G_TOP + 0.12; // trolley rail on top of the girder boxes
  const ZG = P('girderRailSpacing') / 2; const GW = P('girderBoxWidth');
  const ZL = P('legCentreSpacing') / 2;
  const SILL_PIN = P('sillPinElevation'); const SILL_TOP = SILL_PIN + P('sillDepth');
  const TOP_WS = P('portalTopWaterside'); const TOP_LS = P('portalTopLandside'); const UB = P('portalUpperBeamDepth');
  const TIE_BOT = P('portalTieBeamUnderside'); const TIE_C = P('portalTieBeamCentre');
  const AF_TOP = TOP_WS + P('aFrameHeight');
  const ZA = P('aFrameTopSpacing') / 2;
  const PIN_Y = G_TOP + P('backstayFootAboveGirder') + P('backstayRise'); // apex stay pin, from the backstay slope
  const XBS = XLS - P('backstayFootFromLandsideRail');
  const APEX = P('apexMarker');
  const ZB = P('bogieGroupSpacing') / 2;

  const s0100 = (note) => src('J526A0100', 1, note);
  const s00 = (note) => src('J526A00', 1, note);
  const LEG = [1.33, 2.5]; // section E-E / J-J reading (X, Z)

  // ---------- context (decorative) ----------
  S.decorative('gantry.rail.waterside', { label: 'Waterside crane rail (context)', prov: 'measured', sources: [s00('rail gauge 30 m; rail type QU120')] },
    (g) => g.add('steel', boxMinMax([XWS - 0.06, -0.17, -45], [XWS + 0.06, 0, 45])));
  S.decorative('gantry.rail.landside', { label: 'Landside crane rail (context)', prov: 'measured', sources: [s00('rail gauge 30 m')] },
    (g) => g.add('steel', boxMinMax([XLS - 0.06, -0.17, -45], [XLS + 0.06, 0, 45])));
  S.decorative('gantry.quay.reference', { label: 'Quay surface (context, illustrative)', prov: 'estimated', sources: [s00('5300 from waterside rail to the quay-edge fender symbol; quay extent illustrative')] },
    (g) => g.add('concrete', boxMinMax([-66, -0.9, -32], [5.3, -0.17, 32])));

  // ---------- portal frame (15/151) ----------
  S.container('container.portal', { label: 'Portal frame', prov: 'drawing-derived', sources: [s0100('views A/B and side view'), s00('side and end views')] });
  const P_ = 'container.portal';
  for (const [end, X0, top] of [['waterside', XWS, TOP_WS], ['landside', XLS, TOP_LS]]) {
    S.position(`structure.portal.${end}.sill-beam`, { parentKey: P_, sub: '151', category: 'structural', label: `Sill beam, ${end}`, prov: 'drawing-derived', sources: [s0100('3700 + 2600; length 2625 + 15800 + 2625'), src('J526A00', 1, '21050')] },
      (g) => g.add('paint', boxMinMax([X0 - 0.665, SILL_PIN, -P('sillLength') / 2], [X0 + 0.665, SILL_TOP, P('sillLength') / 2])));
    for (const [side, s] of [['a', 1], ['b', -1]]) {
      const Z = s * ZL;
      if (end === 'landside') {
        S.position(`structure.portal.landside.leg.${side}`, { parentKey: P_, sub: '151', category: 'structural', label: `Landside leg ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('vertical leg on the landside rail; knuckle 3700 + 2600; leg top under the landside upper beam')] },
          (g) => g.add('paint',
            taper([X0, SILL_TOP, Z], LEG, [X0 + 0.6, TIE_BOT, Z], [2.6, 2.5]),
            boxMinMax([X0 - 0.665, TIE_BOT, Z - 1.25], [X0 + 0.665, top - UB, Z + 1.25])));
      } else {
        // 7800 vertical lower part, then 2000 lean over 37060 to the A-frame line (X = -2)
        const yKnee = SILL_TOP + P('watersideLegLowerVertical');
        S.position(`structure.portal.waterside.leg.${side}`, { parentKey: P_, sub: '151', category: 'structural', label: `Waterside leg ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('7800 vertical lower part; 2000 lean over 37060 to the A-frame line')] },
          (g) => g.add('paint',
            taper([X0, SILL_TOP, Z], LEG, [X0 - 0.6, TIE_BOT, Z], [2.6, 2.5]),
            boxMinMax([X0 - 0.665, TIE_BOT, Z - 1.25], [X0 + 0.665, yKnee, Z + 1.25]),
            taper([X0, yKnee, Z], LEG, [XMAST, yKnee + P('watersideLegLeanHeight'), Z], LEG)));
      }
    }
    S.position(`structure.portal.${end}.upper-beam`, { parentKey: P_, sub: '151', category: 'structural', label: `Upper portal beam, ${end}`, prov: 'drawing-derived', sources: [s0100(end === 'waterside' ? 'view B: 5000 + 49000 to top; depth 2850' : 'view A: 5000 + 49250 to top (U-05)')] },
      (g) => {
        const Xb = end === 'waterside' ? XMAST : XLS;
        g.add('paint', boxMinMax([Xb - 0.8, top - UB, -ZL - 1.25], [Xb + 0.8, top, ZL + 1.25]));
        for (const s of [1, -1]) g.add('paint', boxMinMax([Xb - 0.4, G_TOP, s * ZG - 0.4], [Xb + 0.4, top - UB, s * ZG + 0.4])); // girder hangers
      });
  }
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    const Z = s * ZL;
    S.position(`structure.portal.tie-beam.${side}`, { parentKey: P_, sub: '151', category: 'structural', label: `Portal tie beam ${side.toUpperCase()} (12.5 m clearance)`, prov: 'drawing-derived', sources: [s0100('underside 12500; centre 3700 + 10400; section L-L')] },
      (g) => g.add('paint', boxMinMax([XLS, TIE_BOT, Z - 0.8], [XWS, TIE_BOT + 3.0, Z + 0.8])));
    S.position(`structure.portal.diagonal.${side}`, { parentKey: P_, sub: '151', category: 'structural', label: `Portal diagonal brace ${side.toUpperCase()}`, prov: 'measured', sources: [s0100('dia 1200 x 14; slope 37060 / 28000')] },
      (g) => g.add('paint', tube([XLS, TIE_C, Z], [XLS + P('diagonalBraceRun'), TIE_C + P('watersideLegLeanHeight'), Z], P('diagonalBraceDia') / 2, 16)));
    S.position(`structure.portal.plan-brace.${side}`, { parentKey: P_, sub: '151', category: 'structural', label: `Horizontal plan brace ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('plan: dia 800 x 12, 5126 / 15000; elevation estimated')] },
      (g) => g.add('paint', tube([XMAST - P('planBraceRun'), G_BOT + 1.2, s * ZG], [XMAST, TOP_WS - UB + 0.4, s * (ZG + P('planBraceLateral'))], P('planBraceDia') / 2, 12)));
  }
  S.position('access.platform.portal-top', { parentKey: P_, sub: '151', category: 'structural', label: 'Portal-top platform and handrails (waterside)', prov: 'estimated', sources: [src('J526A00', 1, 'waterside end view platform at portal top'), src('J526A5000', null, 'walkway sheets not detailed in P03')] },
    (g) => {
      g.add('grating', boxMinMax([XMAST - 2.2, TOP_WS, -ZL - 2.2], [XMAST + 2.2, TOP_WS + 0.1, ZL + 2.2]));
      for (const x of [XMAST - 2.15, XMAST + 2.15]) g.add('paint', boxMinMax([x - 0.03, TOP_WS + 1.05, -ZL - 2.2], [x + 0.03, TOP_WS + 1.11, ZL + 2.2]));
    });

  // ---------- rear girder (15/151) ----------
  S.container('container.girder', { label: 'Fixed rear girder', prov: 'drawing-derived', sources: [s0100('girder J526A0102; 11000 + 20000 behind the landside rail')] });
  S.position('structure.girder.rear.main', { parentKey: 'container.girder', sub: '151', category: 'structural', label: 'Fixed rear girder (twin box girders)', prov: 'drawing-derived', sources: [s0100('31000 landside of the landside rail; boxes 1090 wide x 1800 deep at 6300 rail centres (Z1-Z1)'), s00('31000')] },
    (g) => {
      for (const s of [1, -1]) {
        g.add('paint', boxMinMax([XTAIL, G_BOT, s * ZG - GW / 2], [XHINGE - 0.3, G_TOP, s * ZG + GW / 2]));
        g.add('steel', boxMinMax([XTAIL + 0.3, G_TOP, s * ZG - 0.06], [XHINGE - 0.3, RAIL_T, s * ZG + 0.06]));
      }
      for (const x of [XTAIL + 0.3, XBS, -42.1, XLS, XMAST - 15, XMAST]) g.add('paint', boxMinMax([x - 0.3, G_BOT, -ZG], [x + 0.3, G_BOT + 0.9, ZG]));
      g.add('paint', boxMinMax([XTAIL, G_BOT, -ZG - GW / 2], [XTAIL + 0.4, G_TOP + 0.5, ZG + GW / 2])); // end stop
    });
  S.hotspot('trolley.cable-system.main', { parentKey: 'container.girder', sub: '023', point: [-20, G_BOT - 0.8, 0], radius: 0.7, label: 'Trolley cable transport / sliding-contact system (location approximate)', sources: [src('J526A00', 2, 'item J526A4100 slip-contact system listed; drawing not supplied (U-10)')] });

  // ---------- walkways along girder and boom (15/151) ----------
  S.position('access.walkway.girder-boom', { sub: '151', category: 'structural', label: 'Girder and boom walkways with handrails', prov: 'estimated', sources: [s00('walkways and handrails along both sides of girder and boom; widths scaled'), src('J526A5000', null, 'not detailed in P03')] },
    (g) => {
      for (const s of [1, -1]) {
        const z0 = s * (ZG + GW / 2), z1 = s * (ZG + GW / 2 + 0.9);
        const [zmin, zmax] = z0 < z1 ? [z0, z1] : [z1, z0];
        g.add('grating', boxMinMax([XTAIL, G_TOP - 0.1, zmin], [XTIP - 1, G_TOP, zmax]));
        const zr = s * (ZG + GW / 2 + 0.88);
        g.add('paint', boxMinMax([XTAIL, G_TOP + 1.05, zr - 0.03], [XTIP - 1, G_TOP + 1.11, zr + 0.03]));
        for (let x = XTAIL + 1; x < XTIP - 1; x += 3) g.add('paint', boxMinMax([x - 0.03, G_TOP, zr - 0.03], [x + 0.03, G_TOP + 1.08, zr + 0.03]));
      }
    });

  // ---------- boom (03/031) ----------
  S.container('container.boom', { label: 'Boom and forestays', prov: 'drawing-derived', sources: [s0100('boom J526A0105; 75900; Z2 28000; Z3 +34500')] });
  const B_ = 'container.boom';
  const XZ2 = XHINGE + P('forestayInnerBoomX'); const XZ3 = XZ2 + P('forestayOuterBoomSpacing');
  S.position('boom.main.girder', { parentKey: B_, sub: '031', category: 'structural', label: 'Boom main girder (twin boxes and lacing)', prov: 'drawing-derived', sources: [s0100('75900 from the hinge line; outreach 70000; plan lacing nodes scaled'), s00('70000 outreach')] },
    (g) => {
      for (const s of [1, -1]) {
        g.add('paint', boxMinMax([XHINGE + 0.3, G_BOT, s * ZG - GW / 2], [XTIP - 4, G_TOP, s * ZG + GW / 2]));
        g.add('paint', boxMinMax([XTIP - 4, G_BOT + 0.7, s * ZG - GW / 2], [XTIP, G_TOP, s * ZG + GW / 2]));
        g.add('steel', boxMinMax([XHINGE + 0.3, G_TOP, s * ZG - 0.06], [XTIP - 0.6, RAIL_T, s * ZG + 0.06]));
        g.add('paint', boxMinMax([XZ2 - 0.4, G_TOP, s * ZG - 0.35], [XZ2 + 0.4, G_TOP + P('forestayInnerBracket'), s * ZG + 0.35]));
        g.add('paint', boxMinMax([XZ3 - 0.4, G_TOP, s * ZG - 0.35], [XZ3 + 0.4, G_TOP + P('forestayOuterBracket'), s * ZG + 0.35]));
      }
      const nodes = [0.6, 10.4, 19.7, XZ2, 38.4, 46.3, 54.2, XZ3]; // plan lacing panel points, scaled from J526A0100 plan
      for (let i = 0; i < nodes.length - 1; i++) {
        const s = i % 2 === 0 ? 1 : -1;
        g.add('paint', tube([nodes[i], G_BOT + 0.35, s * (ZG - GW / 2)], [nodes[i + 1], G_BOT + 0.35, -s * (ZG - GW / 2)], 0.2, 8));
      }
      for (const x of [XHINGE + 0.6, XZ2, XZ3, XTIP - 0.4]) g.add('paint', boxMinMax([x - 0.3, G_BOT + 0.1, -ZG], [x + 0.3, G_BOT + 0.8, ZG]));
    });
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`boom.hinge.${side}`, { parentKey: B_, sub: '031', category: 'component', label: `Boom hinge ${side.toUpperCase()}`, prov: 'estimated', sources: [s0100('detail III hinge assembly (item 8); pin placed on the waterside-rail line')] },
      (g) => g.add('machinery', cyl([XHINGE, G_BOT + 0.9, s * ZG], 'z', 0.55, 1.5, 18), boxMinMax([XHINGE - 0.8, G_BOT, s * ZG - 0.4], [XHINGE + 0.8, G_BOT + 1.5, s * ZG + 0.4])));
    S.position(`boom.forestay.inner.${side}`, { parentKey: B_, sub: '031', category: 'structural', label: `Inner forestay ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('Z2 at 28000; segments 18000 + 19617; slope 27540 / 30000; bar section S1-S1')] },
      (g) => g.add('paint', beam([XMAST + P('forestayApexPinOffsetWaterside'), PIN_Y, s * ZA], [XZ2, G_TOP + P('forestayInnerBracket'), s * ZG], 0.3, 0.3)));
    S.position(`boom.forestay.outer.${side}`, { parentKey: B_, sub: '031', category: 'structural', label: `Outer forestay ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('Z3 = Z2 + 34500; segments 15800 + 21300 + 30116; slope 27480 / 64500; bar section S2-S2')] },
      (g) => g.add('paint', beam([XMAST + P('forestayApexPinOffsetWaterside'), PIN_Y + 0.3, s * ZA], [XZ3, G_TOP + P('forestayOuterBracket'), s * ZG], 0.35, 0.42)));
  }
  S.position('reeving.sheave.boom-tip', { parentKey: B_, sub: '011', classificationNote: 'Sheaves carrying hoist rope: 011 (hoist mechanism, "roller") proposed; Admin to confirm', category: 'component', label: 'Boom-tip hoist rope sheaves', prov: 'estimated', sources: [s00('main hoist reeving diagram'), src('J526A2000', null, 'reeving sheet not detailed in P03')] },
    (g) => { for (const z of [-2.6, 2.6, -0.35, 0.35]) g.add('steel', sheave([XTIP - 0.9, G_TOP + 0.6, z], 'z', Math.abs(z) > 1 ? 1.2 : 0.9, 0.18)); g.add('paint', boxMinMax([XTIP - 1.8, G_TOP, -3.0], [XTIP - 0.1, G_TOP + 0.3, 3.0])); });
  S.hotspot('auxiliary.lighting.boom', { parentKey: B_, sub: '131', point: [40, G_BOT - 0.6, 0], radius: 0.6, label: 'Boom/girder floodlights (location approximate)', sources: [src('J526A00', 1, 'floodlight positions not dimensioned')] });

  // ---------- A-frame / mast (15/151) ----------
  S.container('container.a-frame', { label: 'A-frame (mast) and backstays', prov: 'drawing-derived', sources: [s0100('view B 25640; top spacing 6948; backstay slope 27640 / 53000'), s00('apex marker 83356')] });
  const A_ = 'container.a-frame';
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`structure.a-frame.leg.${side}`, { parentKey: A_, sub: '151', category: 'structural', label: `A-frame front leg ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('view B: dia 1200 x 14; 6726 inward over 24740 rise from the portal top')] },
      (g) => g.add('paint', tube([XMAST, TOP_WS - 0.5, s * ZL], [XMAST, TOP_WS + 24.74 + 0.4, s * ZA], P('aFrameLegDia') / 2, 16)));
    S.position(`structure.a-frame.rear-brace.${side}`, { parentKey: A_, sub: '151', category: 'structural', label: `A-frame rear brace ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('slope 28040 / 27375 from the apex to the landside leg top; diameter estimated 1000')] },
      (g) => g.add('paint', tube([XMAST, PIN_Y, s * ZA], [XMAST - P('rearBraceRun'), PIN_Y - P('rearBraceRise'), s * ZG], 0.5, 14)));
    S.position(`structure.backstay.${side}`, { parentKey: A_, sub: '151', category: 'structural', label: `Backstay ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('dia 1000 x 14; foot 25000 behind landside rail, 600 above girder; slope 27640 / 53000; segments 26948 + 28888')] },
      (g) => { g.add('paint', tube([XMAST, PIN_Y, s * ZA], [XBS, G_TOP + P('backstayFootAboveGirder'), s * ZG], P('backstayDia') / 2, 14)); g.add('paint', boxMinMax([XBS - 0.6, G_TOP, s * ZG - 0.3], [XBS + 0.6, G_TOP + 0.9, s * ZG + 0.3])); });
    const xt = XLS - 0.45; const yt = G_TOP + P('backstayFootAboveGirder') + (xt - XBS) / P('backstayRun') * P('backstayRise');
    S.position(`structure.backstay.tie.${side}`, { parentKey: A_, sub: '151', category: 'structural', label: `Backstay tie ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('dia 500 x 10 vertical tie at 450 landside of the landside leg')] },
      (g) => g.add('paint', tube([xt, G_TOP, s * (ZG + (ZA - ZG) * ((xt - XBS) / (XMAST - XBS)))], [xt, yt, s * (ZG + (ZA - ZG) * ((xt - XBS) / (XMAST - XBS)))], 0.25, 10)));
  }
  S.position('structure.a-frame.head', { parentKey: A_, sub: '151', category: 'structural', label: 'A-frame head and apex', prov: 'drawing-derived', sources: [s0100('head 2300 wide; structural top 54000 + 25640'), s00('apex marker 83356 = top of head; head shape estimated (U-06)')] },
    (g) => {
      g.add('paint', boxMinMax([XMAST - 1.15, AF_TOP - 1.4, -ZA - 0.9], [XMAST + 1.15, AF_TOP, ZA + 0.9]));
      for (const s of [1, -1]) {
        g.add('paint', boxMinMax([XMAST - 1.15, AF_TOP, s * ZA - 0.65], [XMAST + 1.15, AF_TOP + 2.2, s * ZA + 0.65]));
        g.add('paint', boxMinMax([XMAST + 1.0, AF_TOP - 1.4, s * ZA - 0.4], [XMAST + 2.0, PIN_Y + 0.8, s * ZA + 0.4])); // forestay lugs
      }
      g.add('grating', boxMinMax([XMAST - 1.4, AF_TOP + 2.2, -ZA - 0.9], [XMAST + 1.4, AF_TOP + 2.3, ZA + 0.9]));
      for (const x of [XMAST - 1.35, XMAST + 1.35]) for (const z of [-ZA - 0.85, ZA + 0.85]) g.add('paint', boxMinMax([x - 0.04, AF_TOP + 2.3, z - 0.04], [x + 0.04, APEX, z + 0.04]));
      for (const z of [-ZA - 0.85, ZA + 0.85]) g.add('paint', boxMinMax([XMAST - 1.39, APEX - 0.08, z - 0.04], [XMAST + 1.39, APEX, z + 0.04]));
    });
  S.position('boom.sheave.apex', { parentKey: A_, sub: '031', category: 'component', label: 'Apex boom-hoist sheaves', prov: 'estimated', sources: [s00('boom hoist rope reeving diagram'), src('J526A2300', null, 'reeving sheet not detailed in P03')] },
    (g) => { for (const z of [-1.3, 1.3]) g.add('steel', sheave([XMAST + 0.2, AF_TOP + 1.0, z], 'z', 1.5, 0.25)); });
  S.position('access.stair.a-frame', { parentKey: A_, sub: '151', category: 'structural', label: 'A-frame access stair', prov: 'estimated', sources: [s00('waterside end view: zig-zag stair beside A-frame leg A')] },
    (g) => {
      const n = 6; const h = (AF_TOP - 1.4 - TOP_WS) / n;
      for (let i = 0; i < n; i++) {
        const y0 = TOP_WS + i * h; const t = i / n; const zc = ZL - (ZL - ZA) * (t + 0.5 / n) + 1.4;
        const dir = i % 2 === 0 ? 1 : -1;
        g.add('grating', beam([XMAST - 1.4 - 1.3 * dir, y0 + 0.1, zc], [XMAST - 1.4 + 1.3 * dir, y0 + h, zc], 0.8, 0.12));
        g.add('grating', boxMinMax([XMAST - 2.9, y0 + h - 0.05, zc - 0.5], [XMAST - 2.4, y0 + h + 0.05, zc + 0.5]));
      }
    });

  // ---------- machinery house (container; light enclosure) ----------
  const HX1 = P('machineryHouseSeasideWallX'); const HX0 = HX1 - P('machineryHouseDepthX');
  const HZC = P('machineryHouseCentreZ'); const HZ0 = HZC - P('machineryHouseLengthZ') / 2; const HZ1 = HZC + P('machineryHouseLengthZ') / 2;
  const FL = P('machineryHouseFloorElevation'); const WALL = FL + P('machineryHouseWallHeight');
  S.container('container.machinery-house', { label: 'Machinery house', enclosure: true, prov: 'drawing-derived', sources: [src('J526A3000', 1, '18200 x 10500, walls 5100; position on the girder scaled from J526A00 / J526A0100')] });
  const MH = 'container.machinery-house';
  S.containerShell(MH, (g) => { // walls and gable roof
    const t = 0.1;
    g.add('houseWall', boxMinMax([HX0, FL, HZ0], [HX0 + t, WALL, HZ1]), boxMinMax([HX1 - t, FL, HZ0], [HX1, WALL, HZ1]),
      boxMinMax([HX0, FL, HZ0], [HX1, WALL, HZ0 + t]), boxMinMax([HX0, FL, HZ1 - t], [HX1, WALL, HZ1]));
    g.add('houseRoof', gableRoof(HX0, HX1, HZ0, HZ1, WALL, P('machineryHouseRoofRise')));
  });
  S.position('structure.machinery-frame', { parentKey: MH, sub: '151', category: 'structural', label: 'Machinery frame, floor and house walkways', prov: 'drawing-derived', sources: [s0100('machinery frame J526A0107 (item 7) in plan'), src('J526A3000', 1, '1000 seaside / 1200 landside walkways')] },
    (g) => {
      g.add('paint', boxMinMax([HX0 - 1.2, G_TOP, HZ0 - 0.3], [HX1 + 1.0, FL - 0.15, HZ0 + 0.3]), boxMinMax([HX0 - 1.2, G_TOP, HZ1 - 0.3], [HX1 + 1.0, FL - 0.15, HZ1 + 0.3]));
      for (const x of [HX0, (HX0 + HX1) / 2, HX1]) g.add('paint', boxMinMax([x - 0.3, G_TOP, HZ0], [x + 0.3, FL - 0.15, HZ1]));
      g.add('grating', boxMinMax([HX0 - 1.2, FL - 0.15, HZ0 - 0.3], [HX1 + 1.0, FL, HZ1 + 0.3]));
      for (const x of [HX0 - 1.15, HX1 + 0.95]) g.add('paint', boxMinMax([x - 0.03, FL + 1.05, HZ0 - 0.3], [x + 0.03, FL + 1.11, HZ1 + 0.3]));
    });
  S.position('machinery-house.service-crane', { parentKey: MH, sub: '151', category: 'component', label: 'Machinery-house service crane', modes: ['technical'], prov: 'approximate-location', sources: [src('J526A3000', 1, 'service crane area and runway'), src('J526A1600', null, 'service crane sheet not detailed')] },
    (g) => {
      for (const x of [HX0 + 0.5, HX1 - 0.5]) g.add('machinery', boxMinMax([x - 0.15, WALL - 0.75, HZ0 + 0.3], [x + 0.15, WALL - 0.45, HZ1 - 0.3]));
      g.add('machinery', boxMinMax([HX0 + 0.5, WALL - 1.05, 3.6], [HX1 - 0.5, WALL - 0.75, 4.0]), boxMinMax([-35.6, WALL - 1.6, 3.4], [-34.8, WALL - 1.05, 4.2]));
    });

  // Main hoist (01): J526A0300 arrangement, drums along Z, motors 1600 seaside of the drum axis.
  const HXD = P('mainHoistDriveX'); const HXM = HXD + P('mainHoistMotorOffset'); const HZ = 0.5;
  const yDrum = FL + P('mainHoistDrumAxisHeight'); const yMot = FL + P('mainHoistMotorAxisHeight');
  const DL = P('mainHoistDrumLength'); const DSPAN = P('mainHoistDrumHalfSpan');
  const hoistSrc = (note) => [src('J526A0300', 1, note), src('J526A3000', 1, 'position inside the house scaled from the plan')];
  const TECH = ['technical'];
  S.position('hoist.drive.reducer.main', { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: 'Main hoist reducer (SEW ML3PSF130E)', prov: 'approximate-location', sources: hoistSrc('one central reducer; ratio 18.551; casing shape simplified') },
    (g) => g.add('machinery', boxMinMax([HXD - 0.7, FL, HZ - 0.485], [HXM + 0.6, FL + 2.0, HZ + 0.485])));
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    const zDrum = HZ + s * (DSPAN - DL / 2);
    S.position(`hoist.drive.drum.${side}`, { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: `Main hoist drum ${side.toUpperCase()}`, prov: 'approximate-location', sources: hoistSrc('drum dia 1180, length 3616, 4208 from reducer centre to drum end') },
      (g) => g.add('drum', cyl([HXD, yDrum, zDrum], 'z', P('mainHoistDrumDia') / 2, DL, 24)));
    S.position(`hoist.drive.motor.${side}`, { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: `Main hoist motor ${side.toUpperCase()} (450 kW)`, prov: 'approximate-location', sources: hoistSrc('2 x 450 kW Yaskawa BDK-1KMU; motor axis 1600 from drum axis; body size estimated') },
      (g) => g.add('machinery', cyl([HXM, yMot, HZ + s * 2.6], 'z', 0.5, 1.4, 20), boxMinMax([HXM - 0.55, FL, HZ + s * 2.6 - 0.6], [HXM + 0.55, yMot - 0.3, HZ + s * 2.6 + 0.6])));
    S.position(`hoist.drive.brake.hs.${side}`, { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: `Main hoist high-speed brake ${side.toUpperCase()}`, prov: 'approximate-location', sources: hoistSrc('YP41-Ed4500 disc brake, disc dia 900 between motor and reducer') },
      (g) => g.add('brake', cyl([HXM, yMot, HZ + s * 1.45], 'z', P('mainHoistHsBrakeDiscDia') / 2, 0.12, 20), boxMinMax([HXM + 0.35, FL, HZ + s * 1.45 - 0.25], [HXM + 0.75, yMot + 0.3, HZ + s * 1.45 + 0.25])));
    S.position(`hoist.emergency.brake.${side}`, { parentKey: MH, sub: '012', classificationNote: 'Low-speed drum (emergency) brake, SB315 hydraulic: 012 "hoist emergency braker" proposed; Admin to confirm', category: 'component', modes: TECH, label: `Main hoist drum (emergency) brake ${side.toUpperCase()}`, prov: 'approximate-location', sources: hoistSrc('SB315 low-speed brake, 2 x 254520 Nm; disc dia 2300 at the outer drum end') },
      (g) => g.add('brake', cyl([HXD, yDrum, HZ + s * (DSPAN + 0.1)], 'z', P('mainHoistBrakeDiscDia') / 2, 0.1, 24), boxMinMax([HXD - 0.4, FL, HZ + s * (DSPAN + 0.1) - 0.3], [HXD + 0.4, FL + 0.9, HZ + s * (DSPAN + 0.1) + 0.3])));
  }
  S.hotspot('emergency.drive.main', { parentKey: MH, sub: '161', point: [HXD + 0.8, FL + 2.6, HZ], radius: 0.5, label: 'Emergency hoist drive (37 kW; location approximate)', sources: [src('J526A0300', 1, 'emergency mechanism data: 37 kW, FH220 reducer'), src('J526A1400', null, 'emergency drive sheet not detailed')] });

  // Trolley drive (02/021): rope-towed trolley, drive in the house (J526A04 / J526A0400).
  const TXD = P('trolleyDriveX'); const yT = FL + 0.8;
  const tSrc = (note) => [src('J526A0400', 1, note + ' (title block J526A04)'), src('J526A3000', 1, 'position scaled from the plan')];
  S.position('trolley-drive.drum.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive drum', prov: 'approximate-location', sources: tSrc('drum dia 920; length estimated') },
    (g) => g.add('drum', cyl([TXD, yT, 0.55], 'z', P('trolleyDriveDrumDia') / 2, 3.0, 22)));
  S.position('trolley-drive.reducer.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive reducer', prov: 'approximate-location', sources: tSrc('reducer FH955.21.A6A-00; casing simplified') },
    (g) => g.add('machinery', boxMinMax([TXD - 0.6, FL, -1.85 - 0.5], [TXD + 0.6, FL + 1.4, -1.85 + 0.5])));
  S.position('trolley-drive.brake.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive brake', prov: 'approximate-location', sources: tSrc('brake between motor and reducer; size estimated') },
    (g) => g.add('brake', cyl([TXD, yT, -2.55], 'z', 0.35, 0.12, 18)));
  S.position('trolley-drive.motor.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive motor (275 / 270 kW, U-02)', prov: 'approximate-location', sources: tSrc('1 motor; rating 270 kW on J526A04 vs 275 kW on J526A00 (U-02)') },
    (g) => g.add('machinery', cyl([TXD, yT, -3.3], 'z', 0.45, 1.2, 20)));

  // Boom hoist (03): drum dia 1530, SEW ML4PSF120X, motor 375 kW, motor brake and drum brake.
  const BXD = P('boomHoistX'); const yB = FL + 1.0;
  const bSrc = (note) => [src('J526A0500', 1, note + ' (title block J526A05)'), src('J526A3000', 1, 'position scaled from the plan')];
  S.position('boom-hoist.drum.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist drum', prov: 'approximate-location', sources: bSrc('drum dia 1530; length estimated') },
    (g) => g.add('drum', cyl([BXD, yB, 0.6], 'z', P('boomHoistDrumDia') / 2, 6.0, 26)));
  S.position('boom-hoist.reducer.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist reducer (SEW ML4PSF120X)', prov: 'approximate-location', sources: bSrc('ratio 100.56; casing simplified') },
    (g) => g.add('machinery', boxMinMax([BXD - 0.9, FL, 3.7], [BXD + 0.9, FL + 2.1, 4.9])));
  S.position('boom-hoist.motor.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist motor (375 kW)', prov: 'approximate-location', sources: bSrc('1 x 375 kW; placement beside the reducer estimated') },
    (g) => g.add('machinery', cyl([BXD + 1.05, FL + 0.75, 2.9], 'z', 0.45, 1.3, 20)));
  S.position('boom-hoist.brake.hs.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist motor brake', prov: 'approximate-location', sources: bSrc('motor (high-speed) brake') },
    (g) => g.add('brake', cyl([BXD + 1.05, FL + 0.75, 3.7], 'z', 0.4, 0.12, 18)));
  S.position('boom-hoist.emergency.brake.main', { parentKey: MH, sub: '032', classificationNote: 'Drum brake (2 x 254.52 kN.m): 032 "boom emergency braker" proposed; Admin to confirm', category: 'component', modes: TECH, label: 'Boom hoist drum (emergency) brake', prov: 'approximate-location', sources: bSrc('drum brake 2 x 254.52 kN.m at the drum end') },
    (g) => g.add('brake', cyl([BXD, yB, 0.6 - 3.1], 'z', 1.05, 0.1, 24), boxMinMax([BXD - 0.4, FL, -2.8], [BXD + 0.4, FL + 0.8, -2.2])));

  // HV equipment (12/121): sizes from the J526A3000 labels; positions scaled from the plan.
  const hv = (key, label, size, cx, cz, note) => S.position(key, { parentKey: MH, sub: '121', category: 'electrical', modes: TECH, label, prov: 'approximate-location', sources: [src('J526A3000', 1, note)] },
    (g) => g.add('transformer', box([cx, FL + size[1] / 2, cz], [size[2], size[1], size[0]])));
  const mt = P('mainTransformerSize'); const at = P('auxTransformerSize'); const sw = P('switchgearSize');
  hv('electrical.hv.main-transformer', 'Main transformer', mt, -38.1, 7.5, 'Main Trans. 2200 x 1450 x 2294H; plan position scaled');
  hv('electrical.hv.aux-transformer', 'Auxiliary transformer', at, -32.9, 5.6, 'Aux. Trans. 1500 x 1200 x 1650H; plan position scaled');
  hv('electrical.hv.switchgear', 'HV switchgear', sw, -32.95, 7.9, 'Switch gear 1950 x 1500 x 2300H; plan position scaled');

  // Electrical room (container) with an unlabelled cabinet line-up and qualified hotspots.
  const ER = HZ0 + P('electricalRoomWidthZ');
  S.container('container.electrical-room', { parentKey: MH, label: 'Electrical room', enclosure: true, prov: 'approximate-location', sources: [src('J526A3000', 1, 'electrical room along the -Z end wall; cabinet identities not legible (U-11)')] });
  S.containerShell('container.electrical-room', (g) => g.add('houseWall', boxMinMax([HX0, FL, ER - 0.05], [HX1, WALL, ER + 0.05])));
  S.decorative('electrical.cabinets.lineup', { parentKey: 'container.electrical-room', modes: TECH, label: 'Electrical cabinet line-up (identities not established)', prov: 'approximate-location', sources: [src('J526A3000', 1, 'two cabinet rows numbered 71-76; individual identities not legible (U-11)')] },
    (g) => { g.add('cabinet', boxMinMax([-40.9, FL, HZ0 + 0.55], [-33.4, FL + 2.2, HZ0 + 1.15]), boxMinMax([-40.5, FL, ER - 1.0], [-33.6, FL + 2.2, ER - 0.4])); });
  const ERH = 'container.electrical-room';
  S.hotspot('electrical.drives.main', { parentKey: ERH, sub: '071', point: [-37.0, FL + 2.7, ER - 0.7], radius: 0.5, label: 'Drive / inverter cabinets (location approximate)', sources: [src('J526A3000', 1, 'cabinet row (71x labels); identities not established (U-11)')] });
  S.hotspot('electrical.plc.main', { parentKey: ERH, sub: '081', point: [-35.0, FL + 2.7, HZ0 + 0.85], radius: 0.5, label: 'PLC cabinet (location approximate)', sources: [src('J526A3000', 1, 'electrical room; exact cabinet not established (U-11)')] });
  S.hotspot('electrical.control-power.main', { parentKey: ERH, sub: '051', point: [-39.4, FL + 2.7, HZ0 + 0.85], radius: 0.5, label: 'Control power (location approximate)', sources: [src('J526A3000', 1, 'electrical room; exact cabinet not established (U-11)')] });
  S.hotspot('auxiliary.air-conditioning.electrical-room', { parentKey: ERH, sub: '152', point: [HX0 + 0.5, WALL - 0.9, HZ0 + 1.7], radius: 0.45, label: 'Electrical-room air conditioning (location approximate)', sources: [src('J526A3000', 1, 'A/C units not individually located')] });
  S.position('auxiliary.compressor', { parentKey: MH, sub: '151', category: 'component', modes: TECH, label: 'Air compressor', prov: 'approximate-location', sources: [src('J526A3000', 1, 'compressor at the seaside corner of the plan'), src('J526A7000', null, 'compressor sheet not detailed')] },
    (g) => g.add('machinery', boxMinMax([HX1 - 1.4, FL, ER + 0.3], [HX1 - 0.4, FL + 1.1, ER + 1.2])));

  // ---------- trolley (02), cabin (14) ----------
  const XT = P('trolleyPositionX');
  S.container('container.trolley', { label: 'Trolley and operator cabin', prov: 'drawing-derived', sources: [src('J526A0200', 1, 'trolley arrangement; display position at the outreach limit (not a measurement)')] });
  const T_ = 'container.trolley';
  const TL0 = XT - P('trolleyFrameLengthX') / 2 - 0.15; const TL1 = XT + P('trolleyFrameLengthX') / 2 - 0.15;
  S.position('trolley.frame', { parentKey: T_, sub: '021', category: 'structural', label: 'Trolley frame', prov: 'drawing-derived', sources: [src('J526A0200', 1, 'frame 400 + 2560 + 2260 + 400 long, 5475 wide; 851 above rail; body between the girders')] },
    (g) => {
      g.add('paint', boxMinMax([TL0, RAIL_T + 0.35, -P('trolleyFrameWidthZ') / 2 - 0.5], [TL1, RAIL_T + 0.85, P('trolleyFrameWidthZ') / 2 + 0.5]));
      g.add('paint', boxMinMax([TL0 + 0.3, G_BOT, -(ZG - GW / 2) + 0.15], [TL1 - 0.3, RAIL_T + 0.35, (ZG - GW / 2) - 0.15]));
      for (const s of [1, -1]) g.add('paint', boxMinMax([TL0, RAIL_T + 0.1, s * ZG - 0.45], [TL1, RAIL_T + 0.4, s * ZG + 0.45]));
      for (const x of [XT - 2.56, XT + 2.26]) g.add('steel', sheave([x, RAIL_T + 0.55, 0], 'z', 0.63, 0.16));
    });
  const pitch = P('trolleyWheelPairPitch') / 2; const rw = P('trolleyWheelDia') / 2;
  for (const [corner, xa, s] of [['ls-a', XT - P('trolleyWheelAxleLandside'), 1], ['ls-b', XT - P('trolleyWheelAxleLandside'), -1], ['ws-a', XT + P('trolleyWheelAxleWaterside'), 1], ['ws-b', XT + P('trolleyWheelAxleWaterside'), -1]]) {
    [1, 2].forEach((n) => {
      const x = xa + (n === 1 ? -pitch : pitch);
      S.position(`trolley.wheel.${corner}.${n}`, { parentKey: T_, sub: '021', category: 'component', label: `Trolley wheel ${corner.toUpperCase()} ${n}`, prov: 'estimated', sources: [src('J526A0200', 1, 'axles 2370 / 2070 from trolley centre; 2 wheels per corner read from plan (count to be confirmed)'), src('ZT2-015022', 1, 'trolley wheel drawing')] },
        (g) => g.add('steel', cyl([x, RAIL_T + rw, s * ZG], 'z', rw, 0.16, 20), cyl([x, RAIL_T + rw, s * ZG], 'z', 0.09, 0.5, 8)));
    });
  }
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`trolley.sheave.set.${side}`, { parentKey: T_, sub: '021', classificationNote: 'Trolley-mounted hoist sheaves: 021 proposed; Admin to confirm', category: 'component', label: `Trolley main hoist sheave set ${side.toUpperCase()}`, prov: 'estimated', sources: [src('J526A0200', 1, 'items 13, sheave centres 900 either side; diameter scaled')] },
      (g) => { for (const dx of [-P('trolleyMainSheaveOffset'), P('trolleyMainSheaveOffset')]) g.add('steel', sheave([XT + dx, RAIL_T + 0.35, s * 2.6], 'z', P('trolleyMainSheaveDia'), 0.2)); });
  }
  const CX1 = XT - P('cabinOffsetLandside'); const CX0 = CX1 - P('cabinLengthX'); const CW = P('cabinWidthZ') / 2;
  const CY0 = P('cabinFloorElevation'); const CY1 = CY0 + P('cabinBodyHeight');
  S.position('cabin.operator.main', { parentKey: T_, sub: '141', category: 'component', label: 'Operator cabin', prov: 'drawing-derived', sources: [src('J526A0200', 1, 'cabin 3000 long, 2500 landside of hoist centre; height and width scaled'), src('J526A00', 1, 'cabin floor about 47.8 m in the side view at the outreach position'), src('J526A3100', null, 'cabin sheet not detailed')] },
    (g) => {
      g.add('cabin', boxMinMax([CX0, CY0 + 1.1, -CW], [CX1, CY1, CW]), boxMinMax([CX0, CY0, -CW], [CX0 + 0.9, CY0 + 1.1, CW]));
      g.add('glass', boxMinMax([CX0 + 0.9, CY0, -CW + 0.05], [CX1 - 0.05, CY0 + 1.1, CW - 0.05]), boxMinMax([CX1 - 0.04, CY0 + 1.2, -CW + 0.2], [CX1 + 0.02, CY1 - 0.4, CW - 0.2]));
      g.add('paint', boxMinMax([CX0 + 0.2, CY1, -0.3], [CX0 + 0.5, RAIL_T + 0.35, 0.3]), boxMinMax([CX1 - 0.5, CY1, -0.3], [CX1 - 0.2, RAIL_T + 0.35, 0.3]));
    });
  S.hotspot('cabin.air-conditioning', { parentKey: T_, sub: '152', point: [CX0 + 0.4, CY1 + 0.3, CW - 0.4], radius: 0.4, label: 'Cabin air conditioning (location approximate)', sources: [src('J526A0200', 1, 'A/C unit beside the cabin in plan; exact unit not detailed')] });
  S.hotspot('trolley.skew-system.main', { parentKey: T_, sub: '111', point: [XT + 1.5, RAIL_T + 1.2, -1.8], radius: 0.45, label: 'Trim/list/skew system (location approximate)', sources: [src('J526A1000', null, 'TLS and snag protection; sheet not detailed in P03')] });
  S.hotspot('hoist.loadcell.main', { parentKey: T_, sub: '013', point: [XT - 1.5, RAIL_T + 1.2, -1.8], radius: 0.45, label: 'Load cell system (location not established; marker at trolley for navigation)', sources: [src('J526A0300', 1, 'load-cell position not shown on the reviewed sheets')] });
  S.hotspot('trolley.tension.main', { parentKey: T_, sub: '022', point: [XT, RAIL_T + 1.2, 1.8], radius: 0.45, label: 'Trolley rope tensioning (location approximate)', sources: [src('J526A2100', null, 'trolley reeving sheet not detailed in P03')] });

  // ---------- headblock (06/062) and spreader (06/061) ----------
  S.container('container.headblock-spreader', { label: 'Headblock and spreader', prov: 'drawing-derived', sources: [src('J526A1200', 1, 'headblock 5200 x 2090'), src('J526A00', 1, 'display pose with spreader underside at 45 m lift height')] });
  const HB = 'container.headblock-spreader';
  // Display pose: spreader underside at the 45 m lift height (J526A00 side view); headblock stacked above it.
  const yHB0 = P('liftAboveRail') + 1.0 + 0.12; const yHS = yHB0 + 0.97; const span = P('headblockSheaveSpan') / 2;
  S.position('headblock.frame', { parentKey: HB, sub: '062', category: 'component', label: 'Headblock frame', prov: 'drawing-derived', sources: [src('J526A1200', 1, 'structure J526A1202; 5200 sheave-box span, 1210 frame width, 970 to sheave centre')] },
    (g) => { g.add('spreader', boxMinMax([XT - 0.6, yHB0, -span], [XT + 0.6, yHB0 + 0.55, span])); g.add('steel', boxMinMax([XT - 0.5, yHB0 - 0.12, -span + 0.2], [XT + 0.5, yHB0, -span + 0.6]), boxMinMax([XT - 0.5, yHB0 - 0.12, span - 0.6], [XT + 0.5, yHB0, span - 0.2])); });
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`headblock.sheave-box.${side}`, { parentKey: HB, sub: '062', category: 'component', label: `Headblock sheave box ${side.toUpperCase()} (2 sheaves)`, prov: 'measured', sources: [src('J526A1200', 1, 'sheave box J526A1201 (2 off); sheaves dia 1000 at 1010 centres; width 2090')] },
      (g) => {
        g.add('spreader', boxMinMax([XT - P('headblockWidth') / 2, yHB0 + 0.2, s * span - 0.35], [XT + P('headblockWidth') / 2, yHB0 + 0.75, s * span + 0.35]));
        for (const dx of [-0.505, 0.505]) g.add('steel', sheave([XT + dx, yHS, s * span], 'z', P('headblockSheaveDia'), 0.16));
      });
  }
  const SPL = P('spreaderLength40ft') / 2; const SPW = P('spreaderWidth') / 2; const ySp0 = P('liftAboveRail'); const ySp1 = yHB0 - 0.12;
  S.position('spreader.frame', { parentKey: HB, sub: '061', category: 'component', label: 'Spreader (STS45, 40 ft setting)', prov: 'estimated', sources: [src('J526A00', 2, 'item 35 STS45 (Bromma), (12+4) for 12 cranes; spreader drawing not supplied (U-10)'), src('J526A00', 1, 'underside at lift height 45 m in the display position')] },
    (g) => {
      g.add('spreader', boxMinMax([XT - 0.75, ySp0 + 0.15, -3.0], [XT + 0.75, ySp1, 3.0]));
      for (const s of [1, -1]) g.add('spreader', boxMinMax([XT + s * 0.6 - 0.25, ySp0 + 0.3, -SPL + 0.3], [XT + s * 0.6 + 0.25, ySp0 + 0.75, SPL - 0.3]));
      for (const s of [1, -1]) g.add('spreader', boxMinMax([XT - SPW, ySp0, s * SPL - 0.3], [XT + SPW, ySp0 + 0.8, s * SPL + 0.3]));
    });
  for (const [k, zs, xs] of [['a-ws', 1, 1], ['a-ls', 1, -1], ['b-ws', -1, 1], ['b-ls', -1, -1]]) {
    S.hotspot(`spreader.twistlock.${k}`, { parentKey: HB, sub: '061', point: [XT + xs * (SPW - 0.25), ySp0 - 0.1, zs * (SPL - 0.15)], radius: 0.35, label: `Spreader twistlock / flipper corner ${k.toUpperCase()} (location representative)`, sources: [src('J526A00', 2, 'STS45 spreader drawing not supplied (U-10); ISO corner positions')] });
  }

  // ---------- reeving (ropes are thin; viewer applies a 0.5 m minimum fit extent) ----------
  const R = 0.05; // display radius (actual 31.5 / 25 / 35.5 mm ropes would be invisible at crane scale)
  S.position('hoist.rope.set.main', { sub: '015', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Main hoist rope set (simplified path)', prov: 'estimated', sources: [s00('main hoist rope reeving diagram'), src('J526A0300', 1, 'IWRC 6xWS(36) dia 31.5'), src('J526A2000', null, 'reeving sheet not detailed; path simplified')] },
    (g) => {
      for (const s of [1, -1]) {
        const zr = s * 2.6;
        g.add('rope', tube([HXD, yDrum + 0.6, zr - s * 0.2], [HX1 + 0.5, RAIL_T + 0.6, zr], R, 6), tube([HX1 + 0.5, RAIL_T + 0.6, zr], [XT - 1.45, RAIL_T + 0.6, zr], R, 6));
        g.add('rope', tube([XT + 1.45, RAIL_T + 0.6, zr], [XTIP - 1.5, G_TOP + 1.2, zr], R, 6));
        for (const [xt, xh] of [[XT - 1.45, XT - 1.0], [XT - 0.35, XT - 0.0], [XT + 0.35, XT + 0.0], [XT + 1.45, XT + 1.0]]) g.add('rope', tube([xt, RAIL_T + 0.35, zr], [xh, yHS, zr], R, 6));
      }
    });
  S.position('trolley.rope.set.main', { sub: '024', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Trolley rope set (simplified path)', prov: 'estimated', sources: [s00('trolley rope reeving diagram'), src('J526A0400', 1, 'rope dia 25'), src('J526A2100', null, 'reeving sheet not detailed; path simplified')] },
    (g) => {
      for (const z of [-0.35, 0.35]) {
        g.add('rope', tube([TXD, yT + 0.5, z + 0.2], [TXD + 0.3, RAIL_T + 0.25, z], R, 6));
        g.add('rope', tube([XTAIL + 0.6, RAIL_T + 0.25, z], [TL0, RAIL_T + 0.25, z], R, 6), tube([TL1, RAIL_T + 0.25, z], [XTIP - 0.9, RAIL_T + 0.25, z], R, 6));
      }
    });
  S.position('boom.rope.set.main', { sub: '033', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Boom hoist rope set (simplified path)', prov: 'estimated', sources: [s00('boom hoist rope reeving diagram'), src('J526A0500', 1, 'rope dia 35.5'), src('J526A2300', null, 'reeving sheet not detailed; path simplified')] },
    (g) => {
      for (const z of [-1.3, 1.3]) {
        g.add('rope', tube([BXD, yB + 0.76, 0.6 + z], [XMAST + 0.2, AF_TOP + 1.75, z], R, 6));
        for (const dz of [-0.12, 0.12]) g.add('rope', tube([XMAST + 0.9, AF_TOP + 0.6, z + dz], [XZ3 - 0.6, G_TOP + 1.6, s3(z) + dz], R, 6));
      }
      function s3(z) { return Math.sign(z) * (ZG - 0.6); }
    });

  // ---------- gantry (04) ----------
  S.container('container.gantry', { label: 'Gantry bogies, drives and cable reel', prov: 'drawing-derived', sources: [src('J526A0600', 1, 'gantry arrangement and side view'), s00('15800 / 21050 / 27000')] });
  const GA_ = 'container.gantry';
  const wheelDz = [-4.35, -3.3, -1.8, -0.75, 0.75, 1.8, 3.3, 4.35]; // 1050 pitch, 1500 sub-bogie gaps (J526A0600)
  const subDz = [-3.825, -1.275, 1.275, 3.825];
  const corners = [];
  for (const [end, X0] of [['ws', XWS], ['ls', XLS]]) for (const [side, s] of [['a', 1], ['b', -1]]) corners.push({ id: `${end}-${side}`, X0, Zc: s * ZB, s });
  const wheelInst = []; const driveInst = [];
  const rG = P('gantryWheelDia') / 2;
  for (const c of corners) {
    S.position(`gantry.bogie.${c.id}`, { parentKey: GA_, sub: '041', category: 'component', label: `Gantry bogie set ${c.id.toUpperCase()} (equalizers and sub-bogies)`, prov: 'drawing-derived', sources: [src('J526A0600', 1, '4 two-wheel sub-bogies, 2 secondary and 1 main equalizer; 1250 / 1050 / 1500 spacing; buffer stroke 500')] },
      (g) => {
        for (const dz of subDz) g.add('paint', boxMinMax([c.X0 - 0.36, 0.84, c.Zc + dz - 0.95], [c.X0 + 0.36, 1.18, c.Zc + dz + 0.95]), boxMinMax([c.X0 + 0.16, 0.25, c.Zc + dz - 0.95], [c.X0 + 0.32, 0.84, c.Zc + dz + 0.95])); // sub-bogie frame above the wheels, side plate on the outer (+X) face only
        for (const dz of [-2.55, 2.55]) g.add('paint', boxMinMax([c.X0 - 0.3, 1.2, c.Zc + dz - 2.2], [c.X0 + 0.3, 1.85, c.Zc + dz + 2.2]));
        g.add('paint', boxMinMax([c.X0 - 0.35, 1.95, c.Zc - 3.3], [c.X0 + 0.35, 3.0, c.Zc + 3.3]), boxMinMax([c.X0 - 0.25, 3.0, c.Zc - 0.25], [c.X0 + 0.25, SILL_PIN, c.Zc + 0.25]));
        g.add('machinery', boxMinMax([c.X0 - 0.2, 0.7, c.Zc + c.s * 4.95], [c.X0 + 0.2, 1.1, c.Zc + c.s * 5.6])); // buffer (ends at the 27000 overall line)
      });
    wheelDz.forEach((dz, i) => wheelInst.push({ key: `gantry.wheel.${c.id}.${i + 1}`, label: `Gantry wheel ${c.id.toUpperCase()} ${i + 1}`, matrix: new THREE.Matrix4().makeTranslation(c.X0, rG, c.Zc + dz) }));
    subDz.forEach((dz, i) => driveInst.push({ key: `gantry.drive.${c.id}.${i + 1}`, label: `Gantry drive unit ${c.id.toUpperCase()} ${i + 1} (20 kW motor, reducer, brake)`, matrix: new THREE.Matrix4().makeTranslation(c.X0, rG, c.Zc + dz) }));
    S.hotspot(`gantry.wheel-brake.${c.id}`, { parentKey: GA_, sub: '046', classificationNote: 'Wheel brake JLQ115 (115 kN): 046 wheel clamp device proposed; 041 also mentions gantry brake; Admin to confirm', point: [c.X0 + 0.7, 1.4, c.Zc], radius: 0.35, label: `Gantry wheel brake ${c.id.toUpperCase()} (count/location approximate)`, sources: [src('J526A0600', 1, 'wheel brake JLQ115.00-KH, item 12; count per corner not confirmed')] });
  }
  S.instanced('gantry.wheels.instanced', { parentKey: GA_, sub: '041', category: 'component', prov: 'drawing-derived', sources: [src('J526A0600', 1, '8 wheels dia 800 per corner, 32 total')] },
    (g) => g.add('steel', cyl([0, 0, 0], 'x', rG, 0.2, 20), cyl([0, 0, 0], 'x', 0.12, 0.62, 8)), wheelInst);
  S.instanced('gantry.drives.instanced', { parentKey: GA_, sub: '041', category: 'component', prov: 'approximate-location', sources: [src('J526A0600', 1, '16 x 20 kW Yaskawa FEK C21 0U, reducer FKR460.96.D1B-00, one per sub-bogie; side and shape simplified')] },
    (g) => g.add('machinery', boxMinMax([-0.75, -0.25, -0.35], [-0.32, 0.45, 0.35]), cyl([-0.62, 0.62, 0.35], 'z', 0.2, 0.75, 14), cyl([-0.62, 0.62, -0.1], 'z', 0.16, 0.08, 12)), driveInst);
  S.position('gantry.cable-reel.main', { parentKey: GA_, sub: '042', category: 'component', label: 'Gantry HV cable reel', prov: 'estimated', sources: [s00('waterside end view item 21: centre 7885 above rail, 2121 outboard of the leg; diameter scaled'), src('J526A4000', null, 'reel sheet not detailed')] },
    (g) => {
      const zc = -(ZL + P('cableReelOffsetFromLeg')); const xc = XWS + 1.0; const yc = P('cableReelCentreHeight');
      g.add('machinery', cyl([xc, yc, zc], 'x', P('cableReelDia') / 2, 0.9, 32));
      g.add('paint', boxMinMax([xc - 0.6, SILL_PIN, zc + 0.6], [xc + 0.2, yc + 0.3, zc + 1.6]), cyl([xc - 0.2, yc, zc], 'x', 0.35, 1.2, 12));
    });

  // ---------- access: landside stair tower and elevator (15) ----------
  S.container('container.access', { label: 'Stairs and elevator (landside leg B)', prov: 'drawing-derived', sources: [src('J526A5100', 1, 'elevator location plan and landings 6500 / 15615 / 47845 / 53430'), s00('landside end view stair')] });
  const AC = 'container.access';
  const ZLB = -ZL;
  S.position('access.stair.landside-leg-b', { parentKey: AC, sub: '151', category: 'structural', label: 'Stair tower, landside leg B', prov: 'estimated', sources: [s00('landside end view: zig-zag stair outside leg B up to 53430'), src('J526A5000', null, 'stair sheets not detailed')] },
    (g) => {
      const top = P('elevatorLandings')[3]; const n = 14; const h = top / n; const z0 = ZLB - 1.25 - 0.1, z1 = z0 - 1.6;
      for (let i = 0; i < n; i++) {
        const dir = i % 2 === 0 ? 1 : -1; const zc = (z0 + z1) / 2 + dir * 0.4;
        g.add('grating', beam([XLS - 1.6 * dir, i * h + 0.1, zc], [XLS + 1.6 * dir, (i + 1) * h, zc], 0.75, 0.1, [0, 0, 1]));
        const xe = XLS + 1.6 * dir; // landing at the top of this flight
        g.add('grating', boxMinMax([xe - 0.6, (i + 1) * h - 0.05, z1], [xe + 0.6, (i + 1) * h + 0.05, z0]));
      }
      g.add('paint', boxMinMax([XLS - 1.75, 0, z1 - 0.05], [XLS - 1.65, top + 1.1, z1 + 0.05]), boxMinMax([XLS + 1.65, 0, z1 - 0.05], [XLS + 1.75, top + 1.1, z1 + 0.05]));
    });
  const EX = XLS + 0.665 + 0.23 + 0.5;
  S.position('access.elevator.mast', { parentKey: AC, sub: '153', category: 'structural', label: 'Elevator mast (rack and supports)', prov: 'drawing-derived', sources: [src('J526A5100', 1, 'SC40 rack-and-pinion lift on the seaside face of landside leg B; top 53430 + 3000')] },
    (g) => g.add('steel', boxMinMax([XLS + 0.68, 0, ZLB - 0.35], [XLS + 0.9, P('elevatorLandings')[3] + 3.0, ZLB + 0.35])));
  const car = P('elevatorCar');
  S.position('access.elevator.car', { parentKey: AC, sub: '153', category: 'component', label: 'Elevator car (shown at the first landing)', prov: 'measured', sources: [src('J526A5100', 1, 'car 1000 x 1000 x 2150; first landing 6500')] },
    (g) => g.add('cabin', box([EX, P('elevatorLandings')[0] + car[1] / 2, ZLB], car)));

  return { builder: S, materials: mats, landmarks: {
    railGauge: XWS - XLS, outreach: OUT, backreach: BACK, hingeX: XHINGE, boomTipX: XTIP, girderTailX: XTAIL,
    trolleyRail: RAIL_T, portalTopWaterside: TOP_WS, portalTopLandside: TOP_LS, aFrameTop: AF_TOP, apexStayPin: PIN_Y,
    overallHeight: APEX, liftAboveRail: P('liftAboveRail'), legCentreSpacing: 2 * ZL, bogieOverall: 2 * (ZB + 5.6),
    tieBeamUnderside: TIE_BOT, machineryHouse: { x: [HX0, HX1], z: [HZ0, HZ1], floor: FL, eaves: WALL },
  } };
}
