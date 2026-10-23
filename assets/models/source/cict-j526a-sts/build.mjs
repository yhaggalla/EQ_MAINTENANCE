// CICT-J526A-STS scene definition, version 1 (P03). Editable model source.
// Run through tools/model-generator/generate.mjs, which supplies the kit, builder and parameter reader.
// Units: metres. Axes: Y up, +X along the boom toward waterside, Z along the rails. Origin: top of the waterside
// rail on the crane transverse centreline (landside rail at X = -30). 'a' = +Z side, 'b' = -Z side.
// Every dimension comes from params.json (with provenance) or is declared here as an estimate in the node provenance.

export function buildCrane({ kit, SceneBuilder, Materials, P, THREE }) {
  const { box, boxMinMax, tube, cyl, beam, taper, gableRoof, sheave, texturedQuad, stairFlight, railing } = kit;
  const src = (drawing, pdfPage, note) => ({ drawing, pdfPage, note });
  const N = (id) => { const v = P(id); return Array.isArray(v) ? v.map((x) => Math.round(x * 1000)) : Math.round(v * 1000); }; // count parameters (unit 'count')
  // Site appearance references used in the U1 repair (appearance only, never dimensions). The user-supplied photos in
  // documents/ named "ChatGPT Image Oct 21, 2026, *.png" are AI-processed versions of CICT site photos.
  const PHOTO = (name, note) => src('site photo ' + name, null, note + ' (AI-processed appearance reference, not a dimension source)');

  const mats = new Materials({
    paint: { color: '#d22a33', roughness: 0.55, metalness: 0.15, role: 'CICT structural red (photos images.jpg / images2.jpg; user site photos in documents/)' },
    houseWall: { color: '#eef1f3', roughness: 0.8, role: 'light machinery-house enclosure (photos)' },
    houseRoof: { color: '#d4dade', roughness: 0.8, role: 'house roof' },
    grating: { color: '#a9262d', roughness: 0.9, role: 'walkways, stairs and platforms: red, slightly darker than the structure (site photos)' },
    cabBody: { color: '#e6e1d2', roughness: 0.6, role: 'operator cab body: oyster white (J526A3100 painting scheme RAL1013 ceiling; site photo 09_14_34 PM)' },
    cabFrame: { color: '#4a5560', roughness: 0.5, metalness: 0.4, role: 'cab window frames, posts and hanger (neutral)' },
    cabGlass: { color: '#6fa3bd', roughness: 0.08, metalness: 0.1, opacity: 0.38, role: 'cab glazing, light green/blue tint (J526A3100 table 2), translucent so the seat is visible' },
    seat: { color: '#24282c', roughness: 0.8, role: 'operator seat and console tops (black)' },
    acUnit: { color: '#d7dbde', roughness: 0.7, role: 'air-conditioning units (neutral)' },
    hydraulic: { color: '#c7ccd1', roughness: 0.25, metalness: 0.8, role: 'hydraulic cylinder rods (chrome)' },
    logo: { color: '#ffffff', roughness: 0.7, alphaTest: 0.5, texture: 'textures/cict-logo.png', role: 'CICT logo artwork from the Portal source (F:/CODEX/CICT-ENG_MAIN_PAGE src/portal-web/src/assets/cict-logo.png, sha256 d7af90fb...9965)' },
    steel: { color: '#8c949b', roughness: 0.45, metalness: 0.6, role: 'rail / wheel steel' },
    machinery: { color: '#5d6873', roughness: 0.6, metalness: 0.3, role: 'motor / reducer (neutral, vendor colour not established)' },
    drum: { color: '#a7b0b8', roughness: 0.4, metalness: 0.6, role: 'rope drum' },
    brake: { color: '#3d454d', roughness: 0.6, metalness: 0.3, role: 'brake (neutral)' },
    rope: { color: '#2b2e31', roughness: 0.8, metalness: 0.2, role: 'steel rope' },
    cabinet: { color: '#cdd2d7', roughness: 0.7, role: 'electrical cabinet (neutral)' },
    transformer: { color: '#7d8a94', roughness: 0.7, metalness: 0.2, role: 'transformer / switchgear (neutral)' },
    cabin: { color: '#e6e9ec', roughness: 0.6, role: 'operator cabin body' },
    spreader: { color: '#e0b020', roughness: 0.6, metalness: 0.2, role: 'headblock and spreader yellow (P03 site photo Image_20261021165637.jpg, crane 01, no longer in documents/; the U1 photo 08_44_08 PM agrees; spreaders are interchangeable, U-09; STS45 drawing not supplied, U-10)' },
    concrete: { color: '#c3c5c0', roughness: 0.95, role: 'quay context (decorative)' },
    hotspot: { color: '#0a8fb5', roughness: 0.4, opacity: 0.85, role: 'qualified location marker (not equipment); unused since U1 round 2 (every marker is drawn as a simplified part)' },
    lamp: { color: '#3a4046', roughness: 0.5, metalness: 0.5, role: 'floodlight housings, sensor heads and hydraulic units (neutral dark grey)' },
    lens: { color: '#fff4cf', roughness: 0.2, emissive: '#fff1b8', emissiveIntensity: 0.55, role: 'floodlight lens (pale, slightly emissive so the fitting reads as a light; not a live state)' },
    flipper: { color: '#e8742a', roughness: 0.6, metalness: 0.2, role: 'spreader flippers, orange (U1 photo 08_44_08 PM)' },
    panel: { color: '#2f6d8e', roughness: 0.5, role: 'cabinet name/indicator panel (neutral blue, not a status colour)' },
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
  S.position('access.walkway.tie-beam', { parentKey: P_, sub: '151', category: 'structural', label: 'Tie-beam walkways and handrails', prov: 'estimated', sources: [s00('side view: handrail on top of the portal tie beam (item 32 nameplate beam)'), PHOTO('08_43_55 PM / 09_14_50 PM', 'railing along the top of the tie beam')] },
    (g) => {
      for (const s of [1, -1]) {
        const y = TIE_BOT + 3.0;
        g.add('grating', boxMinMax([XLS + 0.7, y, s * ZL - 0.8], [XWS - 0.7, y + 0.05, s * ZL + 0.8]));
        for (const zz of [s * ZL - 0.78, s * ZL + 0.78]) g.add('paint', ...railing([XLS + 0.7, y, zz], [XWS - 0.7, y, zz], { step: 2.5 }));
      }
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
  // U1 round 2 (U1-C16): drawn as festoon cable carriages on a short rail under the -Z girder box instead of a ball.
  // Representative only: the slip-contact / cable system drawing (J526A4100) is not supplied, so rail side, length
  // and carriage count are estimates.
  const ZFE = -ZG;
  S.hotspot('trolley.cable-system.main', { parentKey: 'container.girder', sub: '023', point: [-20, G_BOT - 0.8, ZFE], radius: 0.7, label: 'Trolley cable transport / sliding-contact system (representative festoon carriages; location approximate)', sources: [src('J526A00', 2, 'item J526A4100 slip-contact system listed; drawing not supplied (U-10)'), s00('item 15 catenary trolley rope reeving diagram (cable trolleys)')] },
    (g) => {
      g.add('lamp', boxMinMax([-24.5, G_BOT - 0.32, ZFE - 0.1], [-15.5, G_BOT, ZFE + 0.1]), boxMinMax([-24.5, G_BOT - 0.36, ZFE - 0.16], [-15.5, G_BOT - 0.32, ZFE + 0.16])); // I-section rail
      const cx = [-22.5, -20, -17.5];
      for (const x of cx) {
        g.add('lamp', boxMinMax([x - 0.3, G_BOT - 0.72, ZFE - 0.2], [x + 0.3, G_BOT - 0.42, ZFE + 0.2])); // carriage body
        for (const dx of [-0.2, 0.2]) g.add('lamp', cyl([x + dx, G_BOT - 0.38, ZFE], 'z', 0.06, 0.36, 8)); // running wheels
      }
      for (let i = 0; i < cx.length - 1; i++) for (const dz of [-0.1, 0.1]) { // sagging cable loops between carriages
        const a = cx[i], b = cx[i + 1]; const pts = [];
        for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([a + (b - a) * t, G_BOT - 0.72 - 0.9 * Math.sin(Math.PI * t), ZFE + dz]); }
        for (let k = 0; k < pts.length - 1; k++) g.add('rope', tube(pts[k], pts[k + 1], 0.035, 6));
      }
    });

  // ---------- back-reach area (U1 repair): girder tail equipment behind the machinery house ----------
  // Sources: J526A00 p1 side view (item 7 anti-snag/LST device at the tail, festoon and cab service platform), J526A1000
  // (anti-snag and trim/list/skew device), J526A5000 p1 (items 5 and 8), J526A7100 (outdoor service crane, Detail C/View A').
  S.container('container.back-reach', { parentKey: 'container.girder', label: 'Back-reach area (girder tail)', prov: 'drawing-derived', sources: [s00('side view: 31000 behind the landside rail; items 7 and 30 at the tail'), src('J526A5000', 1, 'tail platform (5) and festoon and cab service platform (8)')] });
  const BR = 'container.back-reach';
  const ZR = 2.6; // main hoist rope planes (+/-), as in the trolley and headblock sheaves
  const XAS0 = XTAIL + P('antiSnagFromTail'); const XAS1 = XAS0 + P('antiSnagDeviceLength');
  const rTS = P('antiSnagSheaveDia') / 2; const yTS = G_TOP + 0.35 + rTS;
  const xTS = [XAS0 + 0.6 + rTS, XAS0 + 0.6 + rTS + P('antiSnagSheaveSpacing')];
  // U1 round 2 (U1-C13): the P03/U1 inclined ladder ended in mid-air below the girder. Re-read from J526A5000 p1 (side
  // view and plan at the tail, item 5 "Platform of girder"): an upper tail platform on top of the girders and a lower end
  // platform beyond the girder end at about girder-underside level, joined by a stair; the outer girder walkways
  // also reach the end platform by short flights. Platform sizes, deck level and stair runs are scaled (estimated).
  const ENDP = P('tailEndPlatformLength'); const yEP = G_BOT + P('tailEndPlatformDeckAboveGirderUnderside');
  S.position('access.platform.girder-tail', { parentKey: BR, sub: '151', category: 'structural', label: 'Girder-tail platforms (upper tail platform, lower end platform) with stairs and handrails', prov: 'estimated', sources: [src('J526A5000', 1, 'item 5 platform of girder: tail platform on the girders, end platform beyond the girder end at girder-underside level, centre stair between them and short flights from the outer walkways; scaled'), s00('side view: tail platform and inclined stair at the girder end')] },
    (g) => {
      const x0 = XTAIL, x1 = XTAIL + P('tailPlatformLength'); const zw = ZG + GW / 2 + 0.9;
      // upper tail platform on the girders (deck at girder top), open towards the walkways on +X
      g.add('grating', boxMinMax([x0, G_TOP - 0.1, -zw], [x1, G_TOP, zw]));
      g.add('paint', ...railing([x0, G_TOP, zw], [x1, G_TOP, zw]), ...railing([x0, G_TOP, -zw], [x1, G_TOP, -zw]));
      for (const s of [1, -1]) g.add('paint', ...railing([x0, G_TOP, s * 0.55], [x0, G_TOP, s * (ZG + GW / 2 + 0.05)], { step: 1.2 })); // end rail with openings for the three stairs
      // lower end platform beyond the girder end, hung from the girder end plate (deck at about girder-underside level)
      const xe0 = XTAIL - ENDP, xe1 = XTAIL; const ze = ZG + GW / 2 + 0.9;
      g.add('grating', boxMinMax([xe0, yEP - 0.08, -ze], [xe1, yEP, ze]));
      g.add('paint', boxMinMax([xe0, yEP - 0.3, -ze], [xe0 + 0.12, yEP - 0.08, ze]), boxMinMax([xe0, yEP - 0.3, -ze], [xe1, yEP - 0.08, -ze + 0.12]), boxMinMax([xe0, yEP - 0.3, ze - 0.12], [xe1, yEP - 0.08, ze])); // edge beams
      g.add('paint', ...railing([xe0, yEP, -ze], [xe0, yEP, ze]), ...railing([xe0, yEP, ze], [xe1 - 1.9, yEP, ze]), ...railing([xe0, yEP, -ze], [xe1 - 1.9, yEP, -ze]));
      for (const s of [1, -1]) for (const z of [s * ZG]) g.add('paint', beam([xe0 + 0.3, yEP - 0.3, z], [XTAIL, G_BOT + 1.2, z], 0.16, 0.16)); // diagonal hangers to the girder end
      // centre stair: lower end platform -> upper tail platform (lands at the end-rail opening)
      const cs = stairFlight([XTAIL - P('tailEndStairRun'), yEP, 0], [XTAIL + 0.05, G_TOP, 0], 1.0);
      g.add('grating', ...cs.grating); g.add('paint', ...cs.paint);
      // short flights from the outer girder walkways down to the end platform (one each side)
      for (const s of [1, -1]) {
        const z = s * (ZG + GW / 2 + 0.45);
        const f = stairFlight([XTAIL - P('tailEndStairRun') + 0.2, yEP, z], [XTAIL + 0.25, G_TOP - 0.1, z], 0.7);
        g.add('grating', ...f.grating); g.add('paint', ...f.paint);
      }
    });
  S.position('reeving.anti-snag-tls.device', { parentKey: BR, sub: '111', classificationNote: 'J526A1000 anti-snag and trim/list/skew device (hydraulic cylinders acting on the hoist-rope tail sheaves): 111 Skew system proposed; Admin to confirm', category: 'component', label: 'Anti-snag and trim/list/skew device (cylinders and levers)', prov: 'drawing-derived', sources: [src('J526A1000', 1, 'overall 3754; cylinders bore 200 / rod 140 / stroke 1400; lever arms carrying the rope sheaves; frame shape simplified'), s00('item 7 at the girder tail')] },
    (g) => {
      for (const s of [1, -1]) {
        const z = s * ZR;
        g.add('paint', boxMinMax([XAS0, G_TOP, z - 0.8], [XAS1, G_TOP + 0.35, z + 0.8])); // base frame on the girder
        for (const dz of [-0.55, 0.55]) {
          g.add('paint', beam([xTS[0], yTS, z + dz], [XAS0 + 0.3, G_TOP + 2.55, z + dz], 0.18, 0.3)); // lever arm to the cylinder pivot
          g.add('steel', tube([XAS0 + 0.3, G_TOP + 2.55, z + dz], [xTS[1] + 0.6, G_TOP + 0.6, z + dz], 0.1, 12)); // cylinder barrel (dia 200)
          g.add('hydraulic', tube([xTS[1] + 0.6, G_TOP + 0.6, z + dz], [xTS[1] + 1.35, G_TOP + 0.4, z + dz], 0.07, 10)); // rod (dia 140)
          g.add('paint', boxMinMax([XAS0 + 0.1, G_TOP + 0.35, z + dz - 0.12], [XAS0 + 0.5, G_TOP + 2.7, z + dz + 0.12])); // pivot post
        }
      }
    });
  S.position('reeving.sheave.girder-tail', { parentKey: BR, sub: '011', classificationNote: 'Hoist-rope tail sheaves on the anti-snag levers: 011 (hoist, "roller") proposed as for the boom-tip sheaves; Admin to confirm', category: 'component', label: 'Main hoist rope tail sheaves (girder tail)', prov: 'estimated', sources: [src('J526A1000', 1, 'two sheaves per lever, 2200 apart; diameter scaled'), s00('main hoist rope reeving diagram: ropes turn at the tail sheaves and return to the trolley')] },
    (g) => { for (const s of [1, -1]) for (const x of xTS) for (const dz of [-0.2, 0.2]) g.add('steel', sheave([x, yTS, s * ZR + dz], 'z', P('antiSnagSheaveDia'), 0.16)); });
  const rTT = P('trolleyTailSheaveDia') / 2; const xTT = XTAIL + 0.9; const yTT = RAIL_T + 0.05 + rTT;
  S.position('reeving.sheave.trolley-tail', { parentKey: BR, sub: '021', classificationNote: 'Trolley-rope return sheaves: 021 proposed (trolley); Admin to confirm', category: 'component', label: 'Trolley rope tail sheaves and tensioner frame', prov: 'estimated', sources: [s00('trolley rope reeving diagram: return sheaves with tensioners at the tail end'), src('J526A2100', 1, 'Detail III tension device and C-C: 1050 to the boom centreline, symmetrically; sheave size scaled')] },
    (g) => {
      // U1 round 3: tension-device sheaves on the trolley rope lanes 1050 either side of the centreline (J526A2100 C-C, Detail III)
      for (const z of [-P('trolleyRopeLaneZ'), P('trolleyRopeLaneZ')]) g.add('steel', sheave([xTT, yTT, z], 'z', 2 * rTT, 0.14));
      g.add('paint', boxMinMax([xTT - 0.6, G_TOP, -P('trolleyRopeLaneZ') - 0.3], [xTT + 0.6, yTT - rTT - 0.05, P('trolleyRopeLaneZ') + 0.3]), boxMinMax([xTT + 0.5, G_TOP, -0.12], [xTT + 1.6, G_TOP + 0.5, 0.12]));
    });
  S.position('auxiliary.service-crane.girder-tail', { parentKey: BR, sub: '151', category: 'component', label: 'Outdoor service crane at the girder tail (1 t man-hold lift)', prov: 'drawing-derived', sources: [src('J526A7100', 1, 'Detail C: frame 2780 high, 1540 beyond the girder end; View A: 6050 wide; B1 HSZ1 1 t lift; member sizes estimated')] },
    (g) => {
      const hw = P('tailServiceCraneWidth') / 2; const yb = G_TOP + P('tailServiceCraneHeight'); const xo = XTAIL - P('tailServiceCraneOverhang');
      const xp = [XTAIL + 0.6, XTAIL + 0.6 + P('tailServiceCranePostSpacing')];
      for (const s of [1, -1]) {
        for (const x of xp) g.add('paint', boxMinMax([x - 0.15, G_TOP, s * hw - 0.15], [x + 0.15, yb, s * hw + 0.15]));
        g.add('paint', beam([xp[1], G_TOP + 0.6, s * hw], [xp[0], yb - 0.3, s * hw], 0.12, 0.12));
        g.add('paint', boxMinMax([xo, yb - 0.3, s * 1.2 - 0.12], [xp[1] + 0.15, yb, s * 1.2 + 0.12])); // runway beams cantilevered beyond the tail
      }
      for (const x of xp) g.add('paint', boxMinMax([x - 0.15, yb - 0.35, -hw - 0.15], [x + 0.15, yb, hw + 0.15]));
      g.add('machinery', boxMinMax([xo + 0.2, yb - 0.75, -0.35], [xo + 0.8, yb - 0.3, 0.35]), cyl([xo + 0.5, yb - 1.2, 0], 'y', 0.08, 0.9, 8)); // hoist block and hook
    });
  const XFP0 = XTAIL + P('festoonPlatformStartFromTail'); const XFP1 = XFP0 + P('festoonPlatformLengthX');
  const yFP = G_BOT - P('festoonPlatformDrop'); const zFP0 = -(ZG - GW / 2) + 0.1, zFP1 = zFP0 + 2.0;
  S.position('access.platform.festoon-cab-service', { parentKey: BR, sub: '151', category: 'structural', label: 'Festoon and cab service platform (hanging, back-reach)', prov: 'estimated', sources: [src('J526A5000', 1, 'item 8 J526A5008 festoon and cab service platform'), s00('side view: hanging platform where the cab parks at the back-reach limit; drop and side estimated')] },
    (g) => {
      g.add('grating', boxMinMax([XFP0, yFP - 0.08, zFP0], [XFP1, yFP, zFP1]));
      for (const x of [XFP0 + 0.1, XFP1 - 0.1]) for (const z of [zFP0 + 0.1, zFP1 - 0.1]) g.add('paint', boxMinMax([x - 0.08, yFP, z - 0.08], [x + 0.08, G_BOT, z + 0.08])); // hangers
      g.add('paint', ...railing([XFP0, yFP, zFP1], [XFP1, yFP, zFP1]), ...railing([XFP0, yFP, zFP0], [XFP0, yFP, zFP1]), ...railing([XFP1, yFP, zFP0], [XFP1, yFP, zFP1]));
      const st = stairFlight([XFP1 - 0.5, yFP, zFP0 + 0.5], [XFP1 - 2.6, G_BOT - 0.05, zFP0 + 0.5], 0.6);
      g.add('grating', ...st.grating); g.add('paint', ...st.paint);
    });

  // ---------- walkways along girder and boom (15/151) ----------
  S.position('access.walkway.girder-boom', { sub: '151', category: 'structural', label: 'Girder and boom walkways with handrails', prov: 'estimated', sources: [s00('walkways and handrails along both sides of girder and boom; widths scaled'), src('J526A5000', null, 'not detailed in P03')] },
    (g) => {
      for (const s of [1, -1]) {
        const z0 = s * (ZG + GW / 2), z1 = s * (ZG + GW / 2 + 0.9);
        const [zmin, zmax] = z0 < z1 ? [z0, z1] : [z1, z0];
        g.add('grating', boxMinMax([XTAIL + 0.3, G_TOP - 0.1, zmin], [XTIP - 1, G_TOP, zmax])); // U1 round 2: starts after the tail stair head
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
  S.position('reeving.sheave.boom-tip', { parentKey: B_, sub: '011', classificationNote: 'Sheaves carrying hoist rope: 011 (hoist mechanism, "roller") proposed; Admin to confirm', category: 'component', label: 'Boom-tip hoist rope sheaves and rope-end anchors', prov: 'estimated', sources: [s00('main hoist reeving diagram'), src('J526A2000', null, 'reeving sheet not detailed in P03'), src('J526A2000', 1, 'Detail I (1:20): rope clamp device (2, 2 off) on an anchor pin 480 above the boom top; anchors kept here since U1 round 6 (the 013 load cell moved to the horizontal rope, U1-C25)')] },
    // U1 round 3: trolley-rope sheave units at 1050 either side of the boom centreline, dia 830 (J526A2100 Detail I, A-A)
    (g) => { for (const z of [-2.6, 2.6, -P('trolleyRopeLaneZ'), P('trolleyRopeLaneZ')]) g.add('steel', sheave([XTIP - 0.9, G_TOP + 0.6, z], 'z', Math.abs(z) > 2 ? 1.2 : P('trolleyTipSheaveDia'), 0.18)); g.add('paint', boxMinMax([XTIP - 1.8, G_TOP, -3.0], [XTIP - 0.1, G_TOP + 0.3, 3.0]));
      // U1 round 6 (U1-C25): the J526A2000 Detail I rope-end anchors (cheek plates, plain anchor pin, rope clamp body; one per rope side)
      // drawn in round 2 as part of the load-cell hotspot stay here as reeving hardware, without the load-cell sensor heads.
      const xA = XTIP - P('ropeAnchorPinFromTip'), yA = G_TOP + P('ropeAnchorPinAboveBoomTop');
      for (const s of [1, -1]) {
        const z = s * 2.6;
        g.add('paint', boxMinMax([xA - 0.32, G_TOP + 0.3, z - 0.32], [xA + 0.32, yA + 0.18, z - 0.24]), boxMinMax([xA - 0.32, G_TOP + 0.3, z + 0.24], [xA + 0.32, yA + 0.18, z + 0.32])); // anchor cheek plates
        g.add('steel', cyl([xA, yA, z], 'z', 0.07, 0.64, 14), boxMinMax([xA - 0.95, yA - 0.09, z - 0.12], [xA - 0.05, yA + 0.09, z + 0.12])); // anchor pin and rope clamp body
      }
    });
  // U1 round 2 (U1-C15): floodlight fittings under both outer edges of the boom and the rear girder, aimed down and
  // outward, instead of one ball under the boom. Count and spacing are not dimensioned in the drawings (estimated);
  // the site photos show dark fittings hanging under the girder.
  const FLX = P('floodlightStationsX'); const zFL = ZG + GW / 2;
  S.hotspot('auxiliary.lighting.boom', { sub: '131', modes: ['overall', 'technical'], point: [(FLX[0] + FLX[FLX.length - 1]) / 2, G_BOT - 0.5, 0], radius: 0.6, label: `Boom and girder floodlights (${2 * FLX.length} fittings; count and positions estimated)`, sources: [src('J526A00', 1, 'floodlight positions not dimensioned'), PHOTO('08_44_14 PM / 09_14_39 PM', 'dark floodlight fittings hanging under the girder')] },
    (g) => {
      for (const x of FLX) for (const s of [1, -1]) {
        const z0 = s * (zFL - 0.15);
        g.add('lamp', boxMinMax([x - 0.06, G_BOT - 0.28, z0 - 0.06], [x + 0.06, G_BOT, z0 + 0.06])); // hanger from the box underside
        g.add('lamp', cyl([x, G_BOT - 0.33, z0], 'x', 0.05, 0.62, 8)); // trunnion bracket
        // housing tilted about 35 degrees outward-down; lens on the front face
        const a = [x, G_BOT - 0.33, z0]; const dir = [0, -0.57, s * 0.82];
        const p = (t) => [a[0] + dir[0] * t, a[1] + dir[1] * t, a[2] + dir[2] * t];
        g.add('lamp', beam(p(-0.12), p(0.22), 0.55, 0.42, [1, 0, 0]));
        g.add('lens', beam(p(0.22), p(0.25), 0.48, 0.36, [1, 0, 0]));
        g.add('lamp', beam(p(-0.2), p(-0.12), 0.3, 0.2, [1, 0, 0])); // ballast/driver box at the back
      }
    });

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
  // U1 round 2 (U1-C14): apex re-read from J526A5000 p1 (side view: "Platform of APEX", item 2 J526A5002, a deck with
  // handrails about 1.9 m landside and 3.3 m waterside of the A-frame centreline, stay pins below the deck), J526A2300
  // p1 (boom hoist rope reeving: Detail I guide sheave on top, 50 waterside of the centreline; View A sheave units
  // 4256.5 overall with inner groups 2600 apart) and J526A00 p1 (apex marker 83356 = top of the sheave guard frame).
  // The P03/U1 head was a solid block with two railing frames; it is now: leg-top node, stay-pin head block, apex
  // platform with handrails, guide sheaves with their frames on the platform, fall-sheave groups under the
  // waterside cantilever and a guard frame over the sheaves. Member sizes and the deck level are estimated.
  const yAP = PIN_Y + P('apexPlatformAbovePins'); const APL = P('apexPlatformLandside'), APW = P('apexPlatformWaterside'); const APZ = ZA + P('apexPlatformBeyondLegZ');
  const ZGS = P('apexGuideSheaveSpacingZ') / 2; const rGS = P('apexGuideSheaveDia') / 2; const xGS = XMAST + 0.05; const yGS = yAP + 0.15 + rGS;
  const ZFI = P('apexFallGroupInnerSpacingZ') / 2; const ZFO = P('apexFallGroupOuterZ'); const xFG = XMAST + 1.5; const yFG = yAP - 0.85; const rFG = P('boomBlockSheaveDia') / 2;
  S.position('structure.a-frame.head', { parentKey: A_, sub: '151', category: 'structural', label: 'A-frame head, apex platform and sheave guard frame', prov: 'drawing-derived', sources: [s0100('head 2300 wide; structural top 54000 + 25640; stay pins at the apex detail (1650)'), src('J526A5000', 1, 'item 2 platform of apex: deck and handrails, about 1.9 m landside / 3.3 m waterside of the centreline; scaled'), s00('apex marker 83356 = top of the sheave guard frame (U-06 interpretation); member sizes estimated')] },
    (g) => {
      g.add('paint', boxMinMax([XMAST - 1.15, AF_TOP - 1.4, -ZA - 0.9], [XMAST + 1.15, AF_TOP, ZA + 0.9])); // leg-top node joining both legs
      g.add('paint', boxMinMax([XMAST - 0.9, AF_TOP, -ZA - 0.55], [XMAST + 0.9, yAP - 0.12, ZA + 0.55])); // head block carrying the stay pins
      for (const s of [1, -1]) {
        g.add('paint', boxMinMax([XMAST + 0.9, PIN_Y - 0.9, s * ZA - 0.32], [XMAST + 2.05, PIN_Y + 0.75, s * ZA + 0.32])); // forestay lug plates
        g.add('paint', boxMinMax([XMAST - 1.55, PIN_Y - 0.7, s * ZA - 0.3], [XMAST - 0.9, PIN_Y + 0.5, s * ZA + 0.3])); // backstay / rear-brace lug plates
        g.add('paint', cyl([XMAST + 1.65, PIN_Y, s * ZA], 'z', 0.16, 0.9, 12), cyl([XMAST - 1.2, PIN_Y, s * ZA], 'z', 0.16, 0.85, 12)); // stay pins
      }
      // apex platform: deck on cantilever beams, handrails (J526A5002)
      g.add('grating', boxMinMax([XMAST - APL, yAP - 0.08, -APZ], [XMAST + APW, yAP, APZ]));
      for (const z of [-APZ + 0.15, -ZA, 0, ZA, APZ - 0.15]) g.add('paint', beam([XMAST - APL, yAP - 0.12, z], [XMAST + APW, yAP - 0.12, z], 0.14, 0.3));
      for (const x of [XMAST - APL + 0.1, XMAST + APW - 0.1]) g.add('paint', beam([x, yAP - 0.45, -APZ], [x, yAP - 0.45, APZ], 0.16, 0.3));
      for (const s of [1, -1]) g.add('paint', beam([XMAST + APW - 0.2, yAP - 0.5, s * ZA], [XMAST + 0.9, PIN_Y - 0.6, s * ZA], 0.18, 0.22)); // waterside cantilever struts
      g.add('paint', ...railing([XMAST - APL, yAP, -APZ], [XMAST + APW, yAP, -APZ]), ...railing([XMAST + APW, yAP, -APZ], [XMAST + APW, yAP, APZ]),
        ...railing([XMAST - APL, yAP, -APZ], [XMAST - APL, yAP, APZ]), ...railing([XMAST - APL, yAP, APZ], [XMAST - 0.75, yAP, APZ])); // opening on the +Z side at the stair head
      // guard frame over the guide sheaves: posts and top rails, top = apex marker 83356
      const gx = [XMAST - P('apexGuardLandside'), XMAST + P('apexGuardWaterside')]; const gz = ZGS + 0.5;
      for (const x of gx) for (const z of [-gz, gz]) g.add('paint', boxMinMax([x - 0.07, yAP, z - 0.07], [x + 0.07, APEX, z + 0.07]));
      for (const z of [-gz, gz]) g.add('paint', boxMinMax([gx[0] - 0.07, APEX - 0.14, z - 0.07], [gx[1] + 0.07, APEX, z + 0.07]), boxMinMax([gx[0] - 0.05, yAP + 1.1, z - 0.05], [gx[1] + 0.05, yAP + 1.18, z + 0.05]));
      for (const x of gx) g.add('paint', boxMinMax([x - 0.07, APEX - 0.14, -gz], [x + 0.07, APEX, gz]));
    });
  S.position('boom.sheave.apex', { parentKey: A_, sub: '031', category: 'component', label: 'Apex boom-hoist sheaves (guide sheaves and fall-sheave groups)', prov: 'estimated', sources: [src('J526A2300', 1, 'Detail I: guide sheave on top, 50 waterside of the centreline; View A: sheave units 1-4 and equaliser unit 5, groups 2600 apart, 4256.5 overall; diameters about 950 / 850 / 810 / 700 read from the views; positions scaled'), s00('boom hoist rope reeving diagram')] },
    (g) => {
      for (const s of [1, -1]) {
        // guide sheave (rope from the drum over the top to the falls) with its two frame plates on the platform
        g.add('steel', ...sheave([xGS, yGS, s * ZGS], 'z', 2 * rGS, 0.22, 24));
        for (const dz of [-0.2, 0.2]) g.add('steel', boxMinMax([xGS - rGS * 0.75, yAP, s * ZGS + dz - 0.03], [xGS + rGS * 0.75, yGS + 0.12, s * ZGS + dz + 0.03]));
        // fall-sheave groups hanging under the waterside cantilever: inner group of 4 (to the Z2 boom block) and outer
        // group of 3 (to the Z3 boom block), each with side plates up to the deck beams
        for (const [zc, nS] of [[s * ZFI, 4], [s * ZFO, 3]]) {
          const w = 0.17; const z0 = zc - ((nS - 1) * w) / 2;
          for (let k = 0; k < nS; k++) g.add('steel', ...sheave([xFG, yFG, z0 + k * w], 'z', 2 * rFG, 0.12, 20));
          for (const dz of [-(nS * w) / 2 - 0.04, (nS * w) / 2 + 0.04]) g.add('steel', boxMinMax([xFG - rFG - 0.1, yFG - rFG * 0.6, zc + dz - 0.03], [xFG + rFG + 0.1, yAP - 0.12, zc + dz + 0.03]));
          g.add('steel', cyl([xFG, yFG, zc], 'z', 0.09, nS * w + 0.2, 10)); // shaft
        }
      }
    });
  S.position('access.stair.a-frame', { parentKey: A_, sub: '151', category: 'structural', label: 'A-frame access stair', prov: 'estimated', sources: [s00('waterside end view: zig-zag stair beside A-frame leg A'), src('J526A5000', 1, 'View Q and item 2 platform of apex; flight count approximate; final flight to the apex platform added in U1 round 2')] },
    (g) => {
      // U1 repair: real flights (treads, stringers, handrails) and landings instead of solid slabs; route unchanged.
      const n = N('aFrameStairFlights'); const h = (AF_TOP - 1.4 - TOP_WS) / n;
      for (let i = 0; i < n; i++) {
        const y0 = TOP_WS + i * h; const t = i / n; const zc = ZL - (ZL - ZA) * (t + 0.5 / n) + 1.4;
        const dir = i % 2 === 0 ? 1 : -1;
        const f = stairFlight([XMAST - 1.4 - 1.3 * dir, y0 + 0.05, zc], [XMAST - 1.4 + 1.3 * dir, y0 + h, zc], 0.75);
        g.add('grating', ...f.grating); g.add('paint', ...f.paint);
        const xl = XMAST - 1.4 + 1.3 * dir;
        g.add('grating', boxMinMax([xl - 0.5 * dir, y0 + h - 0.05, zc - 0.55], [xl + 0.7 * dir, y0 + h + 0.03, zc + 0.55]));
        g.add('paint', ...railing([xl + 0.7 * dir, y0 + h, zc - 0.55], [xl + 0.7 * dir, y0 + h, zc + 0.55], { step: 1.1, mid: false }));
      }
      // U1 round 2: final flight from the top landing up to the apex platform, landing at its +Z edge (the P03/U1
      // stair stopped 1.4 m below the A-frame top and did not reach the head)
      const yTop = AF_TOP - 1.4; const zt = ZL - (ZL - ZA) * (1 - 0.5 / n) + 1.4; const dirN = n % 2 === 0 ? 1 : -1;
      const xs = XMAST - 1.4 - 1.3 * dirN, xe = XMAST - 0.75;
      const ff = stairFlight([xs, yTop + 0.05, zt], [xe, yAP, zt], 0.75);
      g.add('grating', ...ff.grating); g.add('paint', ...ff.paint);
      g.add('grating', boxMinMax([xe, yAP - 0.06, APZ - 0.1], [xe + 1.3, yAP, zt + 0.55])); // stair-head landing joining the platform
      g.add('paint', ...railing([xe + 1.3, yAP, APZ], [xe + 1.3, yAP, zt + 0.55], { step: 0.8 }), ...railing([xe, yAP, zt + 0.55], [xe + 1.3, yAP, zt + 0.55], { step: 0.8 }));
    });

  // ---------- machinery house (container; light enclosure) ----------
  const HX1 = P('machineryHouseSeasideWallX'); const HX0 = HX1 - P('machineryHouseDepthX');
  const HZC = P('machineryHouseCentreZ'); const HZ0 = HZC - P('machineryHouseLengthZ') / 2; const HZ1 = HZC + P('machineryHouseLengthZ') / 2;
  const FL = P('machineryHouseFloorElevation'); const WALL = FL + P('machineryHouseWallHeight');
  S.container('container.machinery-house', { label: 'Machinery house', enclosure: true, prov: 'drawing-derived', sources: [src('J526A3000', 1, '18200 x 10500, walls 5100; position on the girder scaled from J526A00 / J526A0100')] });
  const MH = 'container.machinery-house';
  S.containerShell(MH, (g) => { // walls, gable roof, roof-edge railings and doors (U1 repair: railings and doors added)
    const t = 0.1;
    g.add('houseWall', boxMinMax([HX0, FL, HZ0], [HX0 + t, WALL, HZ1]), boxMinMax([HX1 - t, FL, HZ0], [HX1, WALL, HZ1]),
      boxMinMax([HX0, FL, HZ0], [HX1, WALL, HZ0 + t]), boxMinMax([HX0, FL, HZ1 - t], [HX1, WALL, HZ1]));
    g.add('houseRoof', gableRoof(HX0, HX1, HZ0, HZ1, WALL, P('machineryHouseRoofRise')));
    g.add('paint', ...railing([HX0 - 0.25, WALL, HZ0 - 0.25], [HX1 + 0.25, WALL, HZ0 - 0.25], { step: 2.2 }), ...railing([HX0 - 0.25, WALL, HZ1 + 0.25], [HX1 + 0.25, WALL, HZ1 + 0.25], { step: 2.2 }),
      ...railing([HX0 - 0.25, WALL, HZ0 - 0.25], [HX0 - 0.25, WALL, HZ1 + 0.25], { step: 2.2 }), ...railing([HX1 + 0.25, WALL, HZ0 - 0.25], [HX1 + 0.25, WALL, HZ1 + 0.25], { step: 2.2 }));
    // personnel doors from the J526A3000 plan (+Z end wall near the seaside corner; landside wall at the electrical room)
    g.add('cabFrame', boxMinMax([-34.75, FL, HZ1 - 0.02], [-33.85, FL + 2.1, HZ1 + 0.03]), boxMinMax([HX0 - 0.03, FL, -4.75], [HX0 + 0.02, FL + 2.1, -3.85]));
  });
  // CICT logo on the -Z end wall (the wall with the outdoor A/C units), as in the site photos; Overall mode only.
  {
    const w = P('logoWidth'); const h = w * 509 / 512; const xc = HX1 - P('logoCentreFromSeasideWall');
    const y1 = WALL - P('logoTopBelowEaves'); const y0 = y1 - h; const z = HZ0 - 0.02;
    S.containerDecal(MH, 'logo-cict', { modes: ['overall'], label: 'CICT logo (machinery-house end wall facing -Z; placement approximate)', prov: 'estimated', sources: [PHOTO('08_44_14 PM / 09_14_39 PM', 'logo on the light house end wall above the A/C units'), src('Portal source', null, 'src/portal-web/src/assets/cict-logo.png, exact artwork')], note: 'Visual identity mark only; not a maintenance position. The opposite end wall is not shown in the photos and carries no logo here.' },
      (g) => g.add('logo', texturedQuad([xc + w / 2, y0, z], [xc - w / 2, y0, z], [xc - w / 2, y1, z], [xc + w / 2, y1, z])));
  }
  S.position('structure.machinery-frame', { parentKey: MH, sub: '151', category: 'structural', label: 'Machinery frame, floor and house walkways', prov: 'drawing-derived', sources: [s0100('machinery frame J526A0107 (item 7) in plan'), src('J526A3000', 1, '1000 seaside / 1200 landside walkways; end platform for the A/C units (B1-B7); service-crane floor hatch 3575 x 2000')] },
    (g) => {
      g.add('paint', boxMinMax([HX0 - 1.2, G_TOP, HZ0 - 0.3], [HX1 + 1.0, FL - 0.15, HZ0 + 0.3]), boxMinMax([HX0 - 1.2, G_TOP, HZ1 - 0.3], [HX1 + 1.0, FL - 0.15, HZ1 + 0.3]));
      for (const x of [HX0, (HX0 + HX1) / 2, HX1]) g.add('paint', boxMinMax([x - 0.3, G_TOP, HZ0], [x + 0.3, FL - 0.15, HZ1]));
      g.add('grating', boxMinMax([HX0 - 1.2, FL - 0.15, HZ0 - 1.3], [HX1 + 1.0, FL, HZ1 + 0.3]));
      for (const x of [HX0 - 1.15, HX1 + 0.95]) g.add('paint', ...railing([x, FL, HZ0 - 1.3], [x, FL, HZ1 + 0.3], { step: 2.0 }));
      g.add('paint', ...railing([HX0 - 1.2, FL, HZ0 - 1.25], [HX1 + 1.0, FL, HZ0 - 1.25], { step: 2.0 }), ...railing([HX0 - 1.2, FL, HZ1 + 0.25], [HX1 + 1.0, FL, HZ1 + 0.25], { step: 2.0 }));
      // service-crane floor hatch frame (J526A3000: service area 3575 x 2000 next to the main transformer)
      const [hz, hx] = P('serviceHatch'); const hcz = 7.5, hcx = -36.3;
      g.add('paint', boxMinMax([hcx - hx / 2 - 0.08, FL, hcz - hz / 2 - 0.08], [hcx + hx / 2 + 0.08, FL + 0.06, hcz - hz / 2]), boxMinMax([hcx - hx / 2 - 0.08, FL, hcz + hz / 2], [hcx + hx / 2 + 0.08, FL + 0.06, hcz + hz / 2 + 0.08]),
        boxMinMax([hcx - hx / 2 - 0.08, FL, hcz - hz / 2], [hcx - hx / 2, FL + 0.06, hcz + hz / 2]), boxMinMax([hcx + hx / 2, FL, hcz - hz / 2], [hcx + hx / 2 + 0.08, FL + 0.06, hcz + hz / 2]));
    });
  S.position('machinery-house.service-crane', { parentKey: MH, sub: '151', category: 'component', label: 'Machinery-house service crane', modes: ['technical'], prov: 'approximate-location', sources: [src('J526A3000', 1, 'service crane area and runway'), src('J526A1600', null, 'service crane sheet not detailed')] },
    (g) => {
      for (const x of [HX0 + 0.5, HX1 - 0.5]) g.add('machinery', boxMinMax([x - 0.15, WALL - 0.75, HZ0 + 0.3], [x + 0.15, WALL - 0.45, HZ1 - 0.3]));
      g.add('machinery', boxMinMax([HX0 + 0.5, WALL - 1.05, 7.3], [HX1 - 0.5, WALL - 0.75, 7.7]), boxMinMax([-36.7, WALL - 1.6, 7.1], [-35.9, WALL - 1.05, 7.9]));
    });
  S.position('auxiliary.air-conditioning.outdoor-units', { parentKey: MH, sub: '152', category: 'component', label: 'Machinery-house A/C outdoor units (B1-B7)', prov: 'approximate-location', sources: [src('J526A3000', 1, 'items B1-B7 outside the electrical-room end wall'), PHOTO('08_44_14 PM', 'row of A/C outdoor units on the platform below the logo')] },
    (g) => {
      const n = N('houseAcUnits'); const x0 = HX0 + 1.1, x1 = HX1 - 1.1;
      for (let i = 0; i < n; i++) {
        const x = x0 + (x1 - x0) * (i / (n - 1));
        g.add('acUnit', boxMinMax([x - 0.42, FL, HZ0 - 0.75], [x + 0.42, FL + 0.66, HZ0 - 0.38]));
        g.add('cabFrame', cyl([x, FL + 0.36, HZ0 - 0.765], 'z', 0.22, 0.03, 16));
      }
    });

  // Equipment shapes (U1 repair): recognisable but simplified; vendor shapes not established.
  const motor = (g, c, axis, r, len, driveDir) => { // body, end bells, fan cowl (non-drive end), terminal box, feet, shaft
    const i = { x: 0, y: 1, z: 2 }[axis]; const at = (d) => { const p = [...c]; p[i] += d; return p; };
    g.add('machinery', cyl(c, axis, r, len, 20), cyl(at(driveDir * (len / 2 + 0.04)), axis, r * 0.9, 0.08, 20), cyl(at(-driveDir * (len / 2 + 0.2)), axis, r * 0.88, 0.4, 20));
    const ft = [r * 1.6, 0, r * 1.6]; ft[i] = len * 0.8;
    g.add('machinery', box([c[0], c[1] + r * 0.95, c[2]], [axis === 'x' ? len * 0.3 : 0.35, 0.22, axis === 'z' ? len * 0.3 : 0.35]));
    g.add('machinery', boxMinMax([c[0] - ft[0] / 2, FL, c[2] - ft[2] / 2], [c[0] + ft[0] / 2, c[1] - r * 0.55, c[2] + ft[2] / 2]));
    g.add('steel', cyl(at(driveDir * (len / 2 + 0.25)), axis, 0.09, 0.35, 10));
  };
  const reducer = (g, a, b) => { // lower casing and stepped upper casing with stiffening ribs
    const [x0, y0, z0] = a, [x1, y1, z1] = b; const ym = y0 + (y1 - y0) * 0.62;
    g.add('machinery', boxMinMax([x0, y0, z0], [x1, ym, z1]), boxMinMax([x0 + (x1 - x0) * 0.18, ym, z0 + 0.05], [x1 - (x1 - x0) * 0.18, y1, z1 - 0.05]));
    for (const t of [0.3, 0.7]) g.add('machinery', boxMinMax([x0 + (x1 - x0) * t - 0.04, y0, z0 - 0.04], [x0 + (x1 - x0) * t + 0.04, ym, z1 + 0.04]));
  };
  const drum = (g, c, r, len) => { // shell, flanges, wound rope band
    g.add('drum', cyl(c, 'z', r, len, 26), cyl([c[0], c[1], c[2] - len / 2 + 0.03], 'z', r + 0.1, 0.06, 26), cyl([c[0], c[1], c[2] + len / 2 - 0.03], 'z', r + 0.1, 0.06, 26));
    g.add('rope', cyl(c, 'z', r + 0.035, len * 0.55, 26));
  };
  const brake = (g, c, r) => { // disc on the shaft, caliper pair and thruster (axis z)
    g.add('brake', cyl(c, 'z', r, 0.12, 22));
    for (const s of [1, -1]) g.add('brake', boxMinMax([c[0] - 0.14, c[1] + r * 0.55, c[2] + s * 0.08], [c[0] + 0.14, c[1] + r + 0.12, c[2] + s * 0.26]));
    g.add('brake', cyl([c[0] + r * 0.8, c[1] + r + 0.25, c[2]], 'y', 0.09, 0.45, 10), boxMinMax([c[0] - 0.25, FL, c[2] - 0.2], [c[0] + 0.25, c[1] - r * 0.6, c[2] + 0.2]));
  };

  // Main hoist (01): J526A0300 arrangement, drums along Z, motors 1600 seaside of the drum axis.
  // U1 repair: reducer centre, motor and high-speed brake offsets along Z re-read from the J526A3000 plan.
  const HXD = P('mainHoistDriveX'); const HXM = HXD + P('mainHoistMotorOffset'); const HZ = P('mainHoistDriveZ');
  const yDrum = FL + P('mainHoistDrumAxisHeight'); const yMot = FL + P('mainHoistMotorAxisHeight');
  const DL = P('mainHoistDrumLength'); const DSPAN = P('mainHoistDrumHalfSpan');
  const hoistSrc = (note) => [src('J526A0300', 1, note), src('J526A3000', 1, 'position inside the house scaled from the plan (re-read in the U1 repair)')];
  const TECH = ['technical'];
  const MZO = P('mainHoistMotorZOffset'); const BZO = P('mainHoistHsBrakeZOffset');
  S.position('hoist.drive.reducer.main', { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: 'Main hoist reducer (SEW ML3PSF130E)', prov: 'approximate-location', sources: hoistSrc('one central reducer; ratio 18.551; casing shape simplified') },
    (g) => reducer(g, [HXD - 0.7, FL, HZ - 0.43], [HXM + 0.6, FL + 2.0, HZ + 0.43]));
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    const zDrum = HZ + s * (DSPAN - DL / 2);
    S.position(`hoist.drive.drum.${side}`, { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: `Main hoist drum ${side.toUpperCase()}`, prov: 'approximate-location', sources: hoistSrc('drum dia 1180, length 3616, 4208 from reducer centre to drum end') },
      (g) => drum(g, [HXD, yDrum, zDrum], P('mainHoistDrumDia') / 2, DL));
    S.position(`hoist.drive.motor.${side}`, { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: `Main hoist motor ${side.toUpperCase()} (450 kW)`, prov: 'approximate-location', sources: hoistSrc('2 x 450 kW Yaskawa BDK-1KMU; motor axis 1600 from drum axis; body size estimated') },
      (g) => motor(g, [HXM, yMot, HZ + s * MZO], 'z', 0.5, 1.4, -s));
    S.position(`hoist.drive.brake.hs.${side}`, { parentKey: MH, sub: '011', category: 'component', modes: TECH, label: `Main hoist high-speed brake ${side.toUpperCase()}`, prov: 'approximate-location', sources: hoistSrc('YP41-Ed4500 disc brake, disc dia 900 between motor and reducer') },
      (g) => brake(g, [HXM, yMot, HZ + s * BZO], P('mainHoistHsBrakeDiscDia') / 2));
    S.position(`hoist.emergency.brake.${side}`, { parentKey: MH, sub: '012', classificationNote: 'Low-speed drum (emergency) brake, SB315 hydraulic: 012 "hoist emergency braker" proposed; Admin to confirm', category: 'component', modes: TECH, label: `Main hoist drum (emergency) brake ${side.toUpperCase()}`, prov: 'approximate-location', sources: hoistSrc('SB315 low-speed brake, 2 x 254520 Nm; disc dia 2300 at the outer drum end') },
      (g) => brake(g, [HXD, yDrum, HZ + s * (DSPAN + 0.1)], P('mainHoistBrakeDiscDia') / 2));
  }
  // U1 round 2 (U1-C16): emergency drive drawn as a small motor and reducer on a frame on top of the main hoist reducer
  // (the P03 marker point); J526A1400 not read in detail, so position and sizes are approximate.
  S.hotspot('emergency.drive.main', { parentKey: MH, sub: '161', point: [HXD + 0.8, FL + 2.6, HZ], radius: 0.5, label: 'Emergency hoist drive (37 kW motor and FH220 reducer; position approximate)', sources: [src('J526A0300', 1, 'emergency mechanism data: 37 kW, FH220 reducer'), src('J526A1400', null, 'emergency drive sheet not detailed')] },
    (g) => {
      g.add('machinery', boxMinMax([HXD + 0.05, FL + 2.0, HZ - 0.38], [HXD + 1.85, FL + 2.1, HZ + 0.38])); // mounting frame on the reducer casing
      reducer(g, [HXD + 0.15, FL + 2.1, HZ - 0.28], [HXD + 0.85, FL + 2.75, HZ + 0.28]);
      g.add('machinery', cyl([HXD + 1.35, FL + 2.38, HZ], 'x', 0.24, 0.85, 16), cyl([HXD + 1.86, FL + 2.38, HZ], 'x', 0.21, 0.18, 16), box([HXD + 1.35, FL + 2.66, HZ], [0.26, 0.12, 0.22]));
      g.add('machinery', cyl([HXD + 0.9, FL + 2.38, HZ], 'x', 0.06, 0.12, 8)); // coupling
    });

  // Trolley drive (02/021): rope-towed trolley, drive in the house (J526A04 / J526A0400). U1 repair: plan re-read.
  const TXD = P('trolleyDriveX'); const yT = FL + 0.8; const TDZ = P('trolleyDriveDrumCentreZ'); const TDL = P('trolleyDriveDrumLength');
  const TMX = P('trolleyDriveMotorX'); const TMZ = P('trolleyDriveMotorZ'); const TRZ = P('trolleyDriveReducerZ');
  const tSrc = (note) => [src('J526A0400', 1, note + ' (title block J526A04)'), src('J526A3000', 1, 'position scaled from the plan (re-read in the U1 repair)')];
  S.position('trolley-drive.drum.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive drum', prov: 'approximate-location', sources: tSrc('drum dia 920; length scaled from the plan') },
    (g) => drum(g, [TXD, yT, TDZ], P('trolleyDriveDrumDia') / 2, TDL));
  S.position('trolley-drive.reducer.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive reducer', prov: 'approximate-location', sources: tSrc('reducer FH955.21.A6A-00; casing simplified') },
    (g) => reducer(g, [TXD - 1.0, FL, TRZ - 0.39], [TXD + 1.0, FL + 1.4, TRZ + 0.39]));
  S.position('trolley-drive.brake.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive brake', prov: 'approximate-location', sources: tSrc('brake between motor and reducer; size estimated') },
    (g) => brake(g, [TMX, yT, TRZ - 0.78], 0.35));
  S.position('trolley-drive.motor.main', { parentKey: MH, sub: '021', category: 'component', modes: TECH, label: 'Trolley drive motor (275 / 270 kW, U-02)', prov: 'approximate-location', sources: tSrc('1 motor; rating 270 kW on J526A04 vs 275 kW on J526A00 (U-02)') },
    (g) => motor(g, [TMX, yT, TMZ], 'z', 0.45, 1.2, 1));

  // Boom hoist (03): drum dia 1530, SEW ML4PSF120X, motor 375 kW, motor brake and drum brake. U1 repair: the motor
  // stands landside of the drum (P03 had it seaside); drum length and reducer position re-read from the J526A3000 plan.
  const BXD = P('boomHoistX'); const yB = FL + 1.0; const BDZ = P('boomHoistDrumCentreZ'); const BDL = P('boomHoistDrumLength');
  const BMX = P('boomHoistMotorX'); const BMZ = P('boomHoistMotorZ'); const BRZ = P('boomHoistReducerZ');
  const bSrc = (note) => [src('J526A0500', 1, note + ' (title block J526A05)'), src('J526A3000', 1, 'position scaled from the plan (re-read in the U1 repair)')];
  S.position('boom-hoist.drum.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist drum', prov: 'approximate-location', sources: bSrc('drum dia 1530; two-section drum, length scaled from the plan') },
    (g) => drum(g, [BXD, yB, BDZ], P('boomHoistDrumDia') / 2, BDL));
  S.position('boom-hoist.reducer.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist reducer (SEW ML4PSF120X)', prov: 'approximate-location', sources: bSrc('ratio 100.56; casing simplified') },
    (g) => reducer(g, [BMX - 0.5, FL, BRZ - 0.47], [BXD + 0.45, FL + 2.1, BRZ + 0.47]));
  S.position('boom-hoist.motor.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist motor (375 kW)', prov: 'approximate-location', sources: bSrc('1 x 375 kW; landside of the drum next to the reducer') },
    (g) => motor(g, [BMX, FL + 0.75, BMZ], 'z', 0.45, 1.3, 1));
  S.position('boom-hoist.brake.hs.main', { parentKey: MH, sub: '031', category: 'component', modes: TECH, label: 'Boom hoist motor brake', prov: 'approximate-location', sources: bSrc('motor (high-speed) brake between motor and reducer') },
    (g) => brake(g, [BMX, FL + 0.75, BMZ + 0.65 + 0.3], 0.4));
  S.position('boom-hoist.emergency.brake.main', { parentKey: MH, sub: '032', classificationNote: 'Drum brake (2 x 254.52 kN.m): 032 "boom emergency braker" proposed; Admin to confirm', category: 'component', modes: TECH, label: 'Boom hoist drum (emergency) brake', prov: 'approximate-location', sources: bSrc('drum brake 2 x 254.52 kN.m at the drum end') },
    (g) => brake(g, [BXD, yB, BDZ - BDL / 2 - 0.12], 1.05));

  // HV equipment (12/121): sizes from the J526A3000 labels; U1 repair: positions re-read from the plan.
  const hv = (key, label, size, pos, note) => S.position(key, { parentKey: MH, sub: '121', category: 'electrical', modes: TECH, label, prov: 'approximate-location', sources: [src('J526A3000', 1, note)] },
    (g) => {
      g.add('transformer', box([pos[0], FL + size[1] / 2, pos[1]], [size[2], size[1], size[0]]));
      g.add('cabFrame', box([pos[0], FL + size[1] + 0.06, pos[1]], [size[2] * 0.7, 0.12, size[0] * 0.7])); // cable box / lifting lugs
    });
  const mt = P('mainTransformerSize'); const at = P('auxTransformerSize'); const sw = P('switchgearSize');
  hv('electrical.hv.main-transformer', 'Main transformer', mt, P('mainTransformerPos'), 'Main Trans. 2200 x 1450 x 2294H; plan position scaled');
  hv('electrical.hv.aux-transformer', 'Auxiliary transformer', at, P('auxTransformerPos'), 'Aux. Trans. 1500 x 1200 x 1650H; plan position scaled');
  hv('electrical.hv.switchgear', 'HV switchgear', sw, P('switchgearPos'), 'Switch gear 1950 x 1500 x 2300H; plan position scaled');

  // Electrical room (container) with an unlabelled cabinet line-up and qualified hotspots.
  const ER = HZ0 + P('electricalRoomWidthZ');
  S.container('container.electrical-room', { parentKey: MH, label: 'Electrical room', enclosure: true, prov: 'approximate-location', sources: [src('J526A3000', 1, 'electrical room along the -Z end wall; cabinet identities not legible (U-11)')] });
  S.containerShell('container.electrical-room', (g) => g.add('houseWall', boxMinMax([HX0, FL, ER - 0.05], [HX1, WALL, ER + 0.05])));
  S.decorative('electrical.cabinets.lineup', { parentKey: 'container.electrical-room', modes: TECH, label: 'Electrical cabinet line-up (identities not established)', prov: 'approximate-location', sources: [src('J526A3000', 1, 'two cabinet rows numbered 71-76; individual identities not legible (U-11)')] },
    (g) => {
      g.add('cabinet', boxMinMax([-40.9, FL, HZ0 + 0.55], [-33.4, FL + 2.2, HZ0 + 1.15]), boxMinMax([-40.5, FL, ER - 1.0], [-33.6, FL + 2.2, ER - 0.4]));
      for (let x = -40.4; x < -33.5; x += 0.8) g.add('cabFrame', boxMinMax([x - 0.015, FL + 0.1, HZ0 + 1.15], [x + 0.015, FL + 2.1, HZ0 + 1.17]), boxMinMax([x - 0.015, FL + 0.1, ER - 1.02], [x + 0.015, FL + 2.1, ER - 1.0])); // cabinet door joints
    });
  const ERH = 'container.electrical-room';
  // U1 round 2 (U1-C16): the electrical hotspots are drawn as cabinet sections of the line-up (slightly proud of it, with
  // door joints, handles and a name panel) instead of balls. Which bays they are is not established (U-11).
  const cabinetBays = (g, x0, x1, z0, z1, face) => {
    g.add('cabinet', boxMinMax([x0, FL, z0], [x1, FL + 2.24, z1]));
    const zf = face > 0 ? z1 : z0; const t = face * 0.02;
    for (let x = x0 + 0.8; x < x1 - 0.05; x += 0.8) g.add('panel', boxMinMax([x - 0.015, FL + 0.08, Math.min(zf, zf + t)], [x + 0.015, FL + 2.16, Math.max(zf, zf + t)]));
    for (let x = x0 + 0.4; x < x1; x += 0.8) {
      g.add('panel', boxMinMax([x - 0.22, FL + 1.55, Math.min(zf, zf + t)], [x + 0.22, FL + 1.85, Math.max(zf, zf + t)]));
      g.add('panel', boxMinMax([x + 0.28, FL + 0.95, Math.min(zf, zf + 2 * t)], [x + 0.31, FL + 1.25, Math.max(zf, zf + 2 * t)])); // handle
    }
  };
  S.hotspot('electrical.drives.main', { parentKey: ERH, sub: '071', point: [-37.0, FL + 1.1, ER - 0.7], radius: 0.5, label: 'Drive / inverter cabinets (cabinet section shown; which bays not established)', sources: [src('J526A3000', 1, 'cabinet row (71x labels); identities not established (U-11)')] },
    (g) => cabinetBays(g, -38.22, -35.78, ER - 1.02, ER - 0.38, -1));
  S.hotspot('electrical.plc.main', { parentKey: ERH, sub: '081', point: [-35.0, FL + 1.1, HZ0 + 0.85], radius: 0.5, label: 'PLC cabinet (cabinet bay shown; which bay not established)', sources: [src('J526A3000', 1, 'electrical room; exact cabinet not established (U-11)')] },
    (g) => cabinetBays(g, -35.42, -34.58, HZ0 + 0.53, HZ0 + 1.17, 1));
  S.hotspot('electrical.control-power.main', { parentKey: ERH, sub: '051', point: [-39.4, FL + 1.1, HZ0 + 0.85], radius: 0.5, label: 'Control power cabinet (cabinet bay shown; which bay not established)', sources: [src('J526A3000', 1, 'electrical room; exact cabinet not established (U-11)')] },
    (g) => cabinetBays(g, -39.82, -38.98, HZ0 + 0.53, HZ0 + 1.17, 1));
  S.hotspot('auxiliary.air-conditioning.electrical-room', { parentKey: ERH, sub: '152', point: [HX0 + 0.25, WALL - 0.95, HZ0 + 1.7], radius: 0.45, label: 'Electrical-room air conditioning (wall unit shown; location approximate)', sources: [src('J526A3000', 1, 'A/C units not individually located')] },
    (g) => {
      g.add('acUnit', boxMinMax([HX0 + 0.1, WALL - 1.2, HZ0 + 1.2], [HX0 + 0.38, WALL - 0.75, HZ0 + 2.2]));
      for (let k = 0; k < 4; k++) g.add('acUnit', boxMinMax([HX0 + 0.38, WALL - 1.17 + k * 0.035, HZ0 + 1.25], [HX0 + 0.4, WALL - 1.155 + k * 0.035, HZ0 + 2.15])); // outlet louvres
    });
  S.position('auxiliary.compressor', { parentKey: MH, sub: '151', category: 'component', modes: TECH, label: 'Air compressor', prov: 'approximate-location', sources: [src('J526A3000', 1, 'compressor at the seaside corner of the plan'), src('J526A7000', null, 'compressor sheet not detailed')] },
    (g) => { g.add('machinery', boxMinMax([HX1 - 1.4, FL, ER + 0.3], [HX1 - 0.4, FL + 1.1, ER + 1.2])); g.add('acUnit', cyl([HX1 - 0.9, FL + 1.35, ER + 0.75], 'z', 0.25, 0.8, 14)); });

  // ---------- trolley (02), cabin (14) ----------
  const XT = P('trolleyPositionX');
  S.container('container.trolley', { label: 'Trolley and operator cabin', prov: 'drawing-derived', sources: [src('J526A0200', 1, 'trolley arrangement; display position at the outreach limit (not a measurement)')] });
  const T_ = 'container.trolley';
  // U1 round 3 (U1-C17): trolley rebuilt from J526A0200 (trolley arrangement 1:40; p2 subsidiary list) and J526A2100.
  // P03-U1r2 had a solid deck box hiding the sheaves, 8 wheels (2 per corner), two dia 630 "sheaves" at Z = 0 that are
  // really the wheel circles of the side view, and one sheave per side at each hoist shaft. The drawing gives:
  // - 4 wheels dia 630 (p2 item 2, ZT2-020936-00 x 4), one per corner on the rails (gauge 6300), axles 2370 landside
  //   and 2070 waterside of the trolley (hoist) centre (plan);
  // - 4 main hoist sheave shafts (p2 items 3 and 4, 2 off each), 900 either side of the centre, each with 2 sheaves
  //   dia 1000 / groove 900 at 165 (C-C, D-D; item 18, 8 sheaves) between side-frame plates 620 apart; the waterside
  //   pair is staggered 80 along the shaft so ropes passing one shaft run between the sheaves of the other;
  // - an open centre body 1840 + 1540 long between the girders, 990 below the rail (side view: V-braced faces), with
  //   the spreader cable reel (item 11) inside; buffers 400 (B1, 4 off) beyond the 2560 / 2260 trolley-rope lines;
  // - 4 horizontal trolley-rope equalizer sheaves dia 640 (E-E; items 14 and 16) at the two trolley ends.
  // Positions scaled from the views are 'estimated' in params.json; sheave covers (item 13) are omitted so the sheaves
  // stay visible.
  const RT = RAIL_T;
  const XBL = XT - P('trolleyBufferFaceLandside'), XBW = XT + P('trolleyBufferFaceWaterside'); const BUF = P('trolleyBufferLength');
  const TL0 = XBL, TL1 = XBW; // trolley extremities (buffer faces); the cab hanger and the trolley-rope ends refer to them
  const XF0 = XBL + BUF, XF1 = XBW - BUF; // structural frame ends = trolley-rope (equalizer) lines, 2560 / 2260 (side view)
  const XB0 = XT - P('trolleyBodyLandside'), XB1 = XT + P('trolleyBodyWaterside'); const ZTB = P('trolleyBodyWidthZ') / 2;
  const YFT = RT + P('trolleyFrameTopAboveRail'); const YBB = RT - P('trolleyBodyBelowRail');
  const ZH = P('hoistRopeLaneZ'); const PS = P('trolleySheaveFramePlateSpacing') / 2;
  const SO = P('trolleyMainSheaveOffset'); const yTSh = RT + P('trolleyMainSheaveCentreAboveRail'); const rTG = P('trolleyMainSheaveGrooveDia') / 2;
  const sPair = P('trolleyMainSheavePairSpacing'), sStag = P('trolleyMainSheaveShaftStagger');
  // sheave lanes, offset from the side-frame centre plane (positive = outboard): LS shaft -0.1225 / +0.0425, WS shaft -0.0425 / +0.1225
  const LANE_LS = [-sStag / 2 - sPair / 2, -sStag / 2 + sPair / 2], LANE_WS = [sStag / 2 - sPair / 2, sStag / 2 + sPair / 2];
  const XAX_LS = XT - P('trolleyWheelAxleLandside'), XAX_WS = XT + P('trolleyWheelAxleWaterside'); const rw = P('trolleyWheelDia') / 2;
  const XEQ_L = XT - P('trolleyEqualizerSheaveXLandside'), XEQ_W = XT + P('trolleyEqualizerSheaveXWaterside'); const ZEQ = P('trolleyEqualizerSheaveZ');
  const yTR = RT + P('trolleyRopeAboveRail'); const ZTR = P('trolleyRopeLaneZ');
  const RT2 = 0.032; // display radius of the ropes on the trolley sheaves (keeps them clear of the neighbouring sheaves); U1 round 6: declared here, used by the reeving and the 013 load cell
  const trSrc = (note) => [src('J526A0200', 1, note), src('J526A0200', 2, 'subsidiary list')];
  S.position('trolley.frame', { parentKey: T_, sub: '021', category: 'structural', label: 'Trolley frame', prov: 'drawing-derived', sources: trSrc('side view 400 + 2560 / 2260 + 400 (trolley-rope lines and buffers B1), 990 body below the rail, frame top about 600 above the rail; plan 1840 / 1540 centre body, wheel boxes at the corners; C-C / D-D 620 between the side-frame plates; member sections and bracing simplified') },
    (g) => {
      for (const s of [1, -1]) {
        // side frames: two plates 620 apart about the rope lane, with top flanges; open between the plates for the sheaves
        for (const zc of [ZH - PS, ZH + PS]) {
          g.add('paint', boxMinMax([XF0, RT + 0.05, s * zc - 0.015], [XF1, YFT, s * zc + 0.015]));
          g.add('paint', boxMinMax([XF0, YFT - 0.03, s * zc - 0.07], [XF1, YFT, s * zc + 0.07]));
        }
        for (const x of [XF0 + 0.03, XT, XF1 - 0.03]) g.add('paint', boxMinMax([x - 0.02, RT + 0.05, s * (ZH - PS)], [x + 0.02, YFT, s * (ZH + PS)])); // diaphragms between the plates
        // horizontal bracing between the centre body and the side frame (plan)
        g.add('paint', beam([XB0, YFT - 0.1, s * ZTB], [XT - 0.15, YFT - 0.1, s * (ZH - PS)], 0.14, 0.18), beam([XT - 0.15, YFT - 0.1, s * (ZH - PS)], [XB1, YFT - 0.1, s * ZTB], 0.14, 0.18));
        // buffers (B1, 400) beyond the 2560 / 2260 trolley-rope lines (Z position estimated)
        for (const [x0, x1] of [[XBL, XF0], [XF1, XBW]]) {
          const zb = s * (ZH - PS - 0.25);
          g.add('steel', tube([x0, RT + 0.35, zb], [x1, RT + 0.35, zb], 0.11, 12));
          const xh = x0 === XBL ? XBL + 0.02 : XBW - 0.02; g.add('steel', cyl([xh, RT + 0.35, zb], 'x', 0.16, 0.04, 14));
        }
      }
      // end beams between the side frames, just outboard of the centre body and inboard of the equalizer U-turns
      const XE0 = XEQ_L + P('trolleyEqualizerSheaveDia') / 2 + 0.04, XE1 = XEQ_W - P('trolleyEqualizerSheaveDia') / 2 - 0.04;
      for (const [x0, x1] of [[XE0, XB0], [XB1, XE1]]) g.add('paint', boxMinMax([x0, RT + 0.05, -(ZH - PS)], [x1, YFT, ZH - PS]));
      // open centre body between the girders: corner posts, top and bottom chords, V-braced side faces (side view)
      const xV = XT + P('spreaderCableReelX');
      for (const s of [1, -1]) {
        for (const x of [XB0, XB1]) g.add('paint', boxMinMax([x - 0.1, YBB, s * ZTB - 0.1], [x + 0.1, YFT, s * ZTB + 0.1]));
        g.add('paint', boxMinMax([XB0, YBB, s * ZTB - 0.1], [XB1, YBB + 0.25, s * ZTB + 0.1]), boxMinMax([XB0, YFT - 0.25, s * ZTB - 0.1], [XB1, YFT, s * ZTB + 0.1]));
        g.add('paint', beam([XB0 + 0.1, YFT - 0.2, s * ZTB], [xV, YBB + 0.2, s * ZTB], 0.12, 0.16), beam([xV, YBB + 0.2, s * ZTB], [XB1 - 0.1, YFT - 0.2, s * ZTB], 0.12, 0.16));
      }
      for (const x of [XB0, XB1]) g.add('paint', boxMinMax([x - 0.1, YBB, -ZTB], [x + 0.1, YBB + 0.25, ZTB]));
      // wheel brackets at the four corners (wheel between cheek plates, bracket tied to the side frame)
      for (const s of [1, -1]) for (const xw of [XAX_LS, XAX_WS]) {
        for (const dz of [-0.12, 0.12]) g.add('paint', boxMinMax([xw - 0.33, RT + 0.28, s * ZG + dz - 0.015], [xw + 0.33, RT + 0.68, s * ZG + dz + 0.015])); // cheek plates above the axle line, wheel visible below
        g.add('paint', boxMinMax([xw - 0.33, RT + 0.62, s * (ZH + PS)], [xw + 0.33, RT + 0.68, s * (ZG + 0.15)]));
      }
      // brackets carrying the horizontal trolley-rope equalizer sheaves outboard of the end beams
      g.add('paint', boxMinMax([XEQ_L - 0.36, RT + 0.17, -(ZEQ + 0.36)], [XE0, RT + 0.24, ZEQ + 0.36]), boxMinMax([XE1, RT + 0.17, -(ZEQ + 0.36)], [XEQ_W + 0.36, RT + 0.24, ZEQ + 0.36]));
      // cab hanger posts from the landside end beam down to the cab hanger frame
      for (const z of [-0.8, 0.8]) g.add('paint', boxMinMax([XB0 - 0.17, G_BOT + 0.27, z - 0.07], [XB0 - 0.03, RT + 0.05, z + 0.07]));
    });
  for (const [corner, xw, s] of [['ls-a', XAX_LS, 1], ['ls-b', XAX_LS, -1], ['ws-a', XAX_WS, 1], ['ws-b', XAX_WS, -1]]) {
    // one wheel per corner (keys ending .1 kept; the P03 '.2' wheels did not exist and were removed in U1 round 3)
    S.position(`trolley.wheel.${corner}.1`, { parentKey: T_, sub: '021', category: 'component', label: `Trolley wheel ${corner.toUpperCase()}`, prov: 'measured', sources: [src('J526A0200', 1, 'dia 630 in the side view; axle ' + (xw < XT ? '2370 landside' : '2070 waterside') + ' of the trolley centre (plan); on the trolley rail (gauge 6300)'), src('J526A0200', 2, 'item 2 trolley wheel assembly ZT2-020936-00, quantity 4'), src('ZT2-015022', 1, 'trolley wheel drawing')] },
      (g) => {
        const c = [xw, RT + rw, s * ZG];
        g.add('steel', cyl(c, 'z', rw, 0.12, 24), cyl([xw, RT + rw, s * ZG - 0.07], 'z', rw + 0.035, 0.025, 24), cyl([xw, RT + rw, s * ZG + 0.07], 'z', rw + 0.035, 0.025, 24)); // tread and double flanges
        g.add('steel', cyl(c, 'z', 0.07, 0.42, 10)); // axle
        for (const dz of [-0.17, 0.17]) g.add('steel', box([xw, RT + rw + 0.04, s * ZG + dz], [0.34, 0.26, 0.08])); // bearing housings on the cheek plates
      });
  }
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`trolley.sheave.set.${side}`, { parentKey: T_, sub: '021', classificationNote: 'Trolley-mounted hoist sheaves: 021 proposed; Admin to confirm. Each set = the landside and waterside sheave shaft assemblies on one rope side (J526A0200 items 3 and 4); Admin may split it per shaft in P06', category: 'component', label: `Trolley main hoist sheaves, side ${side.toUpperCase()} (2 shafts x 2 sheaves)`, prov: 'drawing-derived', sources: trSrc('shafts 900 either side of the trolley centre (side view); sheaves dia 1000 / groove 900, 165 apart, 620 between the frame plates, waterside pair offset 80 (C-C, D-D); centre about 350 above the rail (scaled)') },
      (g) => {
        for (const [x, lanes] of [[XT - SO, LANE_LS], [XT + SO, LANE_WS]]) {
          for (const off of lanes) g.add('steel', ...sheave([x, yTSh, s * (ZH + off)], 'z', P('trolleyMainSheaveDia'), 0.07, 28));
          g.add('steel', cyl([x, yTSh, s * ZH], 'z', 0.075, 2 * PS + 0.08, 12)); // shaft through both frame plates
          for (const dz of [-(PS + 0.05), PS + 0.05]) g.add('steel', box([x, yTSh, s * ZH + dz], [0.3, 0.3, 0.07])); // bearing housings
        }
      });
  }
  S.position('trolley.sheave.equalizer', { parentKey: T_, sub: '021', classificationNote: 'Trolley-rope equalizer sheaves: 021 proposed (trolley); Admin to confirm', category: 'component', label: 'Trolley rope equalizer sheaves (4)', prov: 'estimated', sources: [...trSrc('section E-E: dia 640 / 550, vertical shaft dia 110 (items 14 and 16, 4 off each); positions scaled from the plan'), src('J526A2100', 1, 'trolley rope lanes 1050 either side of the boom centreline')] },
    (g) => {
      for (const x of [XEQ_L, XEQ_W]) for (const z of [-ZEQ, ZEQ]) {
        g.add('steel', ...sheave([x, yTR, z], 'y', P('trolleyEqualizerSheaveDia'), 0.09, 24));
        g.add('steel', cyl([x, yTR + 0.02, z], 'y', 0.055, 0.34, 10), cyl([x, yTR + 0.12, z], 'y', 0.12, 0.03, 12)); // shaft and retainer
      }
    });
  // Spreader cable reel (014; J526A0200 item 11, 1245 kg): hidden outline inside the centre body in the side view; reel
  // and drive sizes and the cable route are estimated. The spreader cable hangs from the reel to the headblock cable
  // attachment (J526A1200 item 7).
  {
    const xR = XT + P('spreaderCableReelX'); const yR = RT - P('spreaderCableReelCentreBelowRail'); const rR = P('spreaderCableReelDia') / 2;
    const yHBtop = P('liftAboveRail') + 1.0 + 0.12 + 0.55; // headblock beam top (display pose, see the headblock below)
    S.position('trolley.spreader-cable-reel', { parentKey: T_, sub: '014', category: 'component', label: 'Spreader cable reel and drive (size approximate)', prov: 'approximate-location', sources: [...trSrc('item 11 spreader cable reel arrangement (1245 kg), hidden outline in the centre body of the side view; reel diameter and drive scaled or estimated'), src('J526A1200', 1, 'item 7 cable attachment on the headblock')] },
      (g) => {
        g.add('drum', cyl([xR, yR, 0], 'z', rR * 0.56, 0.62, 24));
        for (const z of [-0.33, 0.33]) g.add('drum', cyl([xR, yR, z], 'z', rR, 0.035, 32)); // reel flanges
        g.add('drum', cyl([xR, yR, 0], 'z', 0.07, 1.2, 10)); // axle
        g.add('machinery', box([xR, yR, -0.72], [0.45, 0.45, 0.24]), cyl([xR, yR, -1.0], 'z', 0.17, 0.32, 14)); // reducer and motor
        g.add('rope', tube([xR - rR * 0.56, yR, 0], [XT, yHBtop + 0.5, 0], 0.035, 8)); // spreader cable down to the headblock
      });
  }
  // Operator cab (14/141), remodelled in the U1 repair from J526A3100 (trolley operator's cab, 1:20): 3000 long,
  // 2200 wide, 2673 high; sloping front glass with a 310 visor, front floor window 826, side sliding windows, hinged
  // door 1900 on the walkway side, cab walkway 900 with handrails and ladder, four damper hangers to the trolley.
  const CX1 = XT - P('cabinOffsetLandside'); const CX0 = CX1 - P('cabinLengthX'); const CW = P('cabinWidthZ') / 2;
  const CY0 = P('cabinFloorElevation'); const CY1 = CY0 + P('cabinBodyHeight');
  const FW = P('cabFloorWindowLength'); const yW0 = CY0 + 0.95; const yW1 = CY1 - 0.35; const OV = P('cabinFrontOverhang');
  const cabSrc = [src('J526A3100', 1, '3000 x 2200 x 2673; windows, floor window 826, visor 310, door 1900, walkway 900, 4 dampers; frame members simplified'), src('J526A0200', 1, 'cab 2500 landside of the hoist centre'), src('J526A00', 1, 'cab floor about 47.8 m in the side view at the outreach position'), PHOTO('09_14_34 PM', 'light cab with blue-tinted glazing hanging under the trolley')];
  S.position('cabin.operator.main', { parentKey: T_, sub: '141', category: 'component', label: 'Operator cabin', prov: 'drawing-derived', sources: cabSrc },
    (g) => {
      const zi = CW - 0.03;
      // floor (rear part) and sloping front floor window
      g.add('cabBody', boxMinMax([CX0, CY0, -CW], [CX1 - FW, CY0 + 0.1, CW]));
      g.add('cabGlass', beam([CX1 - FW, CY0 + 0.06, 0], [CX1, CY0 - 0.2, 0], 2 * CW - 0.08, 0.04));
      // sloping front glass (leans out at the top) with frame, transom and wipers
      const fb = [CX1, CY0 - 0.2], ft = [CX1 + OV - 0.05, yW1];
      g.add('cabGlass', beam([fb[0], fb[1], 0], [ft[0], ft[1], 0], 2 * CW - 0.08, 0.04, [1, 0, 0]));
      for (const z of [-zi, zi]) g.add('cabFrame', beam([fb[0], fb[1], z], [ft[0], ft[1], z], 0.08, 0.08, [1, 0, 0]));
      const tm = (t) => [fb[0] + (ft[0] - fb[0]) * t, fb[1] + (ft[1] - fb[1]) * t];
      for (const t of [0.0, 0.42, 1.0]) { const p = tm(t); g.add('cabFrame', boxMinMax([p[0] - 0.04, p[1] - 0.04, -CW], [p[0] + 0.04, p[1] + 0.04, CW])); }
      for (const z of [-0.45, 0.45]) { const p = tm(0.55), q = tm(0.85); g.add('cabFrame', beam([p[0] + 0.03, p[1], z], [q[0] + 0.03, q[1], z + 0.12], 0.025, 0.025)); }
      // side walls: lower panel, front low side window, window band, top band, posts; door on the +Z (walkway) side
      for (const s of [1, -1]) {
        const zz = [s * CW - 0.025, s * CW + 0.025];
        g.add('cabBody', boxMinMax([CX0, CY0, zz[0]], [CX1 - FW - 0.2, yW0, zz[1]]), boxMinMax([CX0, yW1, zz[0]], [CX1 + OV - 0.05, CY1, zz[1]]));
        g.add('cabGlass', boxMinMax([CX1 - FW - 0.2, CY0 - 0.1, zz[0]], [CX1, yW0, zz[1]]), boxMinMax([s > 0 ? CX0 + 1.05 : CX0 + 0.12, yW0, zz[0]], [CX1, yW1, zz[1]]));
        for (const x of [CX0 + 0.04, CX0 + 1.0, CX1 - FW - 0.2, CX1 - 0.04]) g.add('cabFrame', boxMinMax([x - 0.04, CY0 - 0.05, s * CW - 0.05], [x + 0.04, CY1, s * CW + 0.05]));
        g.add('cabFrame', boxMinMax([CX0, yW0 - 0.04, s * CW - 0.05], [CX1, yW0 + 0.04, s * CW + 0.05]), boxMinMax([CX0, yW1 - 0.04, s * CW - 0.05], [CX1, yW1 + 0.04, s * CW + 0.05]));
      }
      g.add('cabFrame', boxMinMax([CX0 + 0.12, CY0 + 0.02, CW + 0.02], [CX0 + 0.96, CY0 + P('cabDoorHeight'), CW + 0.06])); // hinged door
      g.add('cabGlass', boxMinMax([CX0 + 0.25, CY0 + 1.05, CW + 0.065], [CX0 + 0.83, CY0 + 1.75, CW + 0.08]));
      // rear wall with a small window, roof with front visor and gutter
      g.add('cabBody', boxMinMax([CX0 - 0.05, CY0, -CW], [CX0, CY1, CW]));
      g.add('cabGlass', boxMinMax([CX0 - 0.07, yW0 + 0.2, -0.6], [CX0 - 0.05, yW1 - 0.1, 0.1]));
      g.add('cabBody', boxMinMax([CX0 - 0.08, CY1, -CW - 0.06], [CX1 + OV, CY1 + 0.08, CW + 0.06]));
      g.add('cabFrame', boxMinMax([CX1 + OV - 0.06, CY1 - 0.12, -CW - 0.06], [CX1 + OV + 0.02, CY1 + 0.1, CW + 0.06]));
      // four damper hangers and the hanger frame tied back to the trolley body
      const yH = G_BOT + 0.05;
      for (const x of [CX0 + 0.3, CX1 - 0.4]) for (const z of [-0.8, 0.8]) { g.add('cabFrame', boxMinMax([x - 0.06, CY1 + 0.08, z - 0.06], [x + 0.06, yH, z + 0.06])); g.add('steel', cyl([x, (CY1 + yH) / 2 + 0.02, z], 'y', 0.11, 0.12, 12)); }
      // U1 round 3: the hanger frame reaches the hanger posts under the landside end beam of the rebuilt trolley
      for (const z of [-0.8, 0.8]) g.add('cabFrame', boxMinMax([CX0, yH, z - 0.08], [XB0 - 0.02, yH + 0.22, z + 0.08]));
      for (const x of [CX0 + 0.3, CX1 - 0.4, XB0 - 0.1]) g.add('cabFrame', boxMinMax([x - 0.08, yH, -0.9], [x + 0.08, yH + 0.22, 0.9]));
      // cab walkway (900) at the landside end with handrails, and the access ladder up to the hanger frame
      const WX0 = CX0 - P('cabWalkwayWidth');
      g.add('grating', boxMinMax([WX0, CY0 - 0.06, -CW - 0.15], [CX0 - 0.05, CY0, CW + 0.15]));
      g.add('paint', ...railing([WX0, CY0, -CW - 0.15], [WX0, CY0, CW + 0.15], { step: 1.1 }), ...railing([WX0, CY0, CW + 0.15], [CX0 - 0.05, CY0, CW + 0.15], { step: 0.9 }), ...railing([WX0, CY0, -CW - 0.15], [CX0 - 0.05, CY0, -CW - 0.15], { step: 0.9 }));
      for (const z of [-CW + 0.05, -CW + 0.5]) g.add('paint', boxMinMax([WX0 + 0.12, CY0, z - 0.025], [WX0 + 0.17, yH + 0.22, z + 0.025]));
      for (let y = CY0 + 0.3; y < yH; y += 0.3) g.add('paint', boxMinMax([WX0 + 0.12, y - 0.015, -CW + 0.05], [WX0 + 0.17, y + 0.015, -CW + 0.5]));
      // the A/C unit on the walkway beside the cab is the 152 hotspot 'cabin.air-conditioning' (U1 round 2)
    });
  const XS = CX1 - P('cabSeatFromFront');
  S.position('cabin.operator.seat', { parentKey: T_, sub: '141', category: 'component', label: 'Operator seat (tip-up chair)', prov: 'estimated', sources: [src('J526A3100', 1, 'item 10 tip-up chair installation (ZT2-031511) facing the front and floor windows; size estimated')] },
    (g) => {
      g.add('cabFrame', boxMinMax([XS - 0.15, CY0 + 0.1, -0.15], [XS + 0.15, CY0 + 0.45, 0.15]));
      g.add('seat', boxMinMax([XS - 0.3, CY0 + 0.45, -0.28], [XS + 0.28, CY0 + 0.58, 0.28]), beam([XS - 0.32, CY0 + 0.55, 0], [XS - 0.42, CY0 + 1.25, 0], 0.52, 0.12), box([XS - 0.44, CY0 + 1.36, 0], [0.1, 0.2, 0.32]));
    });
  S.position('cabin.operator.consoles', { parentKey: T_, sub: '141', category: 'component', label: 'Operator control consoles and joysticks', prov: 'approximate-location', sources: [src('J526A3100', 1, 'auxiliary control station and seat consoles; vendor shapes not established')] },
    (g) => {
      for (const s of [1, -1]) {
        const zz = [s * 0.33, s * 0.6].sort((a, b) => a - b);
        g.add('cabFrame', boxMinMax([XS - 0.25, CY0 + 0.1, zz[0]], [XS + 0.35, CY0 + 0.7, zz[1]]));
        g.add('seat', boxMinMax([XS - 0.25, CY0 + 0.7, zz[0]], [XS + 0.35, CY0 + 0.74, zz[1]]), cyl([XS + 0.15, CY0 + 0.84, s * 0.46], 'y', 0.025, 0.2, 8), box([XS + 0.15, CY0 + 0.96, s * 0.46], [0.07, 0.07, 0.07]));
      }
      g.add('cabFrame', boxMinMax([CX0 + 0.1, CY0 + 0.1, -CW + 0.1], [CX0 + 0.55, CY0 + 1.4, -CW + 0.75])); // auxiliary control station at the rear corner
    });
  // U1 round 2 (U1-C16): the cab A/C box (P03 had it inside the cab node plus a ball marker) is now the 152 part itself.
  S.hotspot('cabin.air-conditioning', { parentKey: T_, sub: '152', modes: ['overall', 'technical'], point: [CX0 - P('cabWalkwayWidth') / 2 - 0.05, CY0 + 0.31, 0.75], radius: 0.4, label: 'Cabin air conditioning unit (location from the plan, size approximate)', sources: [src('J526A3100', 1, 'A/C unit beside the cab on the walkway side (plan); exact unit not detailed'), src('J526A0200', 1, 'A/C unit beside the cabin in plan')] },
    (g) => {
      const WX0 = CX0 - P('cabWalkwayWidth');
      g.add('acUnit', boxMinMax([WX0 + 0.25, CY0, 0.35], [CX0 - 0.1, CY0 + 0.62, CW + 0.05]));
      g.add('steel', cyl([(WX0 + CX0) / 2 + 0.07, CY0 + 0.63, (0.35 + CW) / 2 + 0.02], 'y', 0.2, 0.03, 16)); // condenser fan grille
      for (let k = 0; k < 5; k++) g.add('steel', boxMinMax([WX0 + 0.27, CY0 + 0.1 + k * 0.09, CW + 0.05], [CX0 - 0.12, CY0 + 0.12 + k * 0.09, CW + 0.07])); // side louvres
    });
  // U1 round 2 (U1-C16): the trim/list/skew hydraulic power unit is drawn as a tank, motor-pump and accumulators on the
  // tail platform beside the anti-snag/TLS device (J526A1000 does not locate the power unit: position approximate).
  S.hotspot('trolley.skew-system.main', { parentKey: BR, sub: '111', modes: ['overall', 'technical'], point: [XTAIL + 3.5, G_TOP + 0.6, -1.3], radius: 0.45, label: 'Trim/list/skew hydraulic power unit (position approximate; J526A1000 device at the girder tail)', sources: [src('J526A1000', 1, 'anti-snag and L/S/T device at the girder tail (GA item 7); cylinders 200/140 x 1400; hydraulic power unit not located')] },
    (g) => {
      const x0 = XTAIL + 2.8, x1 = XTAIL + 4.2, z0 = -1.7, z1 = -0.9;
      g.add('lamp', boxMinMax([x0, G_TOP, z0], [x1, G_TOP + 0.75, z1])); // oil tank
      g.add('lamp', cyl([x0 + 0.45, G_TOP + 0.98, (z0 + z1) / 2], 'x', 0.18, 0.6, 14), cyl([x0 + 0.95, G_TOP + 0.98, (z0 + z1) / 2], 'x', 0.13, 0.35, 12)); // motor and pump
      for (const x of [x1 - 0.35, x1 - 0.15]) g.add('steel', cyl([x, G_TOP + 1.1, z1 - 0.2], 'y', 0.09, 0.7, 12)); // accumulators
      g.add('steel', tube([x1, G_TOP + 0.5, (z0 + z1) / 2], [XAS0 + 0.6, G_TOP + 0.5, -ZR + 0.6], 0.03, 6), tube([x1, G_TOP + 0.6, (z0 + z1) / 2], [XAS0 + 0.6, G_TOP + 0.6, ZR - 0.6], 0.03, 6)); // pressure lines to the cylinders
    });
  // U1 round 7 (U1-C27): the user marked the place on a reference image ("Use this referance place for load cells.. image is just to
  // show the place", docs/evidence/U1/r7-loadcell-location-reference.jpg): the outermost waterside end of the boom. Round 6 (U1-C25)
  // had put in-line load cells about 2.6 m inboard on the horizontal rope runs; round 2 (U1-C12) at the Detail I rope-end anchors.
  // The 013 load cells are now in-line load cells (tension links with clevis ends) in the main hoist rope where it reaches the boom-tip
  // end: on the horizontal cross-over of the main hoist ropes at the very end of the boom (same expressions as the cross-over in
  // hoist.rope.set.main, whose geometry is unchanged), two per rope side just inboard of the main hoist tip sheaves, with one junction
  // box per side and its signal cable to the boom deck. The sheets (J526A2000 Detail I) do not fix the point or the hardware, so the
  // representation stays "location approximate" (technical mode). The Detail I rope-end anchors stay in reeving.sheave.boom-tip.
  const XLC = XTIP - 0.3, YLC = G_TOP + 0.6; // tip cross-over of the main hoist ropes, as in hoist.rope.set.main
  const ZLC = P('loadCellCrossoverZ'); // load-cell centres either side of the boom centreline (estimated)
  S.hotspot('hoist.loadcell.main', { parentKey: B_, sub: '013', point: [XLC, YLC, 0], radius: 0.45, label: 'Load cell system (in-line load cells in the horizontal main hoist rope at the boom tip end; point and hardware not fixed on the sheets)', sources: [src('J526A2000', 1, 'Detail I: main hoist rope ends at the boom tip; the load-cell point is not shown. Placement from the user answer to U-23 ("load cell is connected in boom tip horizontal cable") and the user reference image of the place (U1 round 7, U1-C27: the boom tip end); points on the tip cross-over estimated'), src('J526A0300', 1, 'load-cell position not shown on the reviewed sheets')] },
    (g) => {
      for (const s of [1, -1]) {
        for (const zc of ZLC) {
          const z = s * zc;
          g.add('lamp', tube([XLC, YLC, z - 0.2], [XLC, YLC, z + 0.2], 0.085, 12)); // load cell body (tension link) around the rope
          g.add('steel', tube([XLC, YLC, z - 0.3], [XLC, YLC, z - 0.2], 0.055, 10), tube([XLC, YLC, z + 0.2], [XLC, YLC, z + 0.3], 0.055, 10)); // clevis / rope-socket ends
        }
        const zb = s * (ZLC[0] + ZLC[1]) / 2;
        g.add('lamp', boxMinMax([XLC - 0.12, YLC + 0.16, zb - 0.17], [XLC + 0.12, YLC + 0.36, zb + 0.17])); // junction box above the two cells
        for (const zc of ZLC) g.add('lamp', tube([XLC, YLC + 0.08, s * zc], [XLC, YLC + 0.2, zb + Math.sign(s * zc - zb) * 0.12], 0.018, 6)); // sensor leads
        g.add('lamp', tube([XLC - 0.12, YLC + 0.26, zb], [XLC - 0.7, G_TOP + 0.35, zb], 0.02, 6)); // signal cable to the boom deck
      }
    });
  S.hotspot('trolley.tension.main', { parentKey: BR, sub: '022', modes: ['overall', 'technical'], point: [xTT, yTT, 0], radius: 0.45, label: 'Trolley rope tensioning cylinders (position approximate; tensioners at the girder-tail end)', sources: [s00('trolley rope reeving diagram: tensioners at the tail end'), src('J526A2100', null, 'trolley reeving sheet not detailed')] },
    (g) => {
      for (const s of [1, -1]) {
        const z = s * P('trolleyRopeLaneZ'); // U1 round 3: on the trolley rope lanes (J526A2100 C-C)
        g.add('steel', tube([XTAIL + 0.15, yTT, z], [xTT - 0.25, yTT, z], 0.08, 12)); // cylinder barrel anchored at the end stop
        g.add('steel', tube([xTT - 0.25, yTT, z], [xTT + 0.05, yTT, z], 0.045, 10)); // rod to the sheave carriage
        g.add('lamp', boxMinMax([xTT - 0.12, yTT - 0.15, z - 0.1], [xTT + 0.12, yTT + 0.15, z + 0.1])); // carriage block on the sheave axle
      }
      g.add('lamp', boxMinMax([xTT + 0.55, G_TOP + 0.5, -0.45], [xTT + 1.25, G_TOP + 0.95, 0.45])); // small hydraulic unit on the tensioner base
    });

  // ---------- headblock (06/062) and spreader (06/061) ----------
  S.container('container.headblock-spreader', { label: 'Headblock and spreader', prov: 'drawing-derived', sources: [src('J526A1200', 1, 'headblock 5200 x 2090'), src('J526A00', 1, 'display pose with spreader underside at 45 m lift height')] });
  const HB = 'container.headblock-spreader';
  // Display pose: spreader underside at the 45 m lift height (J526A00 side view); headblock stacked above it.
  // U1 round 3 (U1-C18): headblock re-read from J526A1200 (1:15) and spreader remodelled (P03-U1r2 drew a flat bar
  // arrangement). Headblock: main beam 1210 wide between two sheave boxes (J526A1201) at 5200, 5440 overall; two dia
  // 1000 sheaves per box at 1010, 970 above the base, guards (item 10); fence (item 6) to 1670; junction box (4) and
  // cable attachment (7); twistlock mechanism (11, 2 off) with dia 140 twistlocks at 950 under each sheave box.
  // Spreader (STS45, Bromma; its drawing is NOT in the supplied set, U-10): a main frame of two longitudinal beams
  // (1300 apart: DT1500F spreader trailer cradles) with cross members and the four landing points for the headblock
  // twistlocks (950 x 5200), two telescopic arms per end, end beams across the container width, corner twistlocks at
  // the ISO 1161 40 ft corner-fitting centres (11985 x 2259) and orange flippers; hydraulic power pack and electrical
  // box on the main frame. Member sections, heights and the arm arrangement are estimated.
  const yHB0 = P('liftAboveRail') + 1.0 + 0.12; const yHS = yHB0 + P('headblockSheaveCentreAboveBase'); const span = P('headblockSheaveSpan') / 2;
  const HL = P('headblockOverallLength') / 2; const HFW = P('headblockFrameWidth') / 2; const HBW = P('headblockWidth') / 2; const yHT = yHB0 + P('headblockOverallHeight');
  const HTX = P('headblockTwistlockSpanX') / 2; const HSP = P('headblockSheavePitch') / 2;
  S.position('headblock.frame', { parentKey: HB, sub: '062', category: 'component', label: 'Headblock frame', prov: 'drawing-derived', sources: [src('J526A1200', 1, 'structure J526A1202 1210 wide between the sheave boxes (5200, 5440 overall); fence item 6 to 1670; junction box item 4; cable attachment item 7; member depth scaled')] },
    (g) => {
      g.add('spreader', boxMinMax([XT - HFW, yHB0 + 0.05, -(span - 0.2)], [XT + HFW, yHB0 + 0.55, span - 0.2])); // main beam
      for (const s of [1, -1]) g.add('spreader', boxMinMax([XT - HFW, yHB0 + 0.3, s * (span - 0.2)], [XT + HFW, yHB0 + 0.55, s * HL])); // beam ends over the sheave boxes
      for (const x of [XT - HFW + 0.03, XT + HFW - 0.03]) g.add('spreader', ...railing([x, yHB0 + 0.55, -(span - 0.3)], [x, yHB0 + 0.55, span - 0.3], { h: yHT - yHB0 - 0.55, step: 1.0 })); // fence
      g.add('machinery', boxMinMax([XT + 0.1, yHB0 + 0.55, -1.75], [XT + 0.55, yHB0 + 0.95, -1.05])); // junction box
      g.add('machinery', tube([XT, yHB0 + 0.55, 0], [XT, yHB0 + 0.9, 0], 0.07, 10), tube([XT, yHB0 + 0.9, 0], [XT, yHB0 + 1.05, 0], 0.07, 12, 0.22)); // cable attachment with guide funnel
    });
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`headblock.sheave-box.${side}`, { parentKey: HB, sub: '062', category: 'component', label: `Headblock sheave box ${side.toUpperCase()} (2 sheaves, twistlocks)`, prov: 'measured', sources: [src('J526A1200', 1, 'sheave box J526A1201 (2 off), 2090 wide; sheaves ZT2-013069 dia 1000 / 900 at 1010, 970 above the base; guards item 10; twistlock mechanism item 11 (2 off), twistlocks dia 140 at 950')] },
      (g) => {
        const z0 = s * span;
        g.add('spreader', boxMinMax([XT - P('headblockTwistlockHousingWidth') / 2, yHB0, z0 - 0.2], [XT + P('headblockTwistlockHousingWidth') / 2, yHB0 + 0.45, z0 + 0.2])); // box body over the twistlock housings (1640)
        for (const dz of [-0.14, 0.14]) g.add('spreader', boxMinMax([XT - HBW, yHB0 + 0.3, z0 + dz - 0.015], [XT + HBW, yHS - 0.2, z0 + dz + 0.015])); // sheave guard skirts, 2090 over the guards; upper part of the sheaves left open
        for (const dx of [-HSP, HSP]) {
          g.add('steel', ...sheave([XT + dx, yHS, z0], 'z', P('headblockSheaveDia'), 0.1, 28));
          g.add('steel', cyl([XT + dx, yHS, z0], 'z', 0.08, 0.34, 12)); // sheave shaft
        }
        for (const dx of [-HTX, HTX]) {
          g.add('steel', box([XT + dx, yHB0 + 0.1, z0], [0.3, 0.2, 0.3])); // twistlock housing
          g.add('steel', tube([XT + dx, yHB0, z0], [XT + dx, yHB0 - 0.11, z0], P('headblockTwistlockDia') / 2, 12), box([XT + dx, yHB0 - 0.14, z0], [0.18, 0.06, 0.11])); // twistlock and head
        }
      });
  }
  const SPL = P('spreaderLength40ft') / 2; const SPW = P('spreaderWidth') / 2; const ySp0 = P('liftAboveRail'); const ySp1 = yHB0 - 0.12;
  const SML = P('spreaderMainFrameLength') / 2; const SMB = P('spreaderMainBeamSpacing') / 2; const SEB = P('spreaderEndBeamWidthX') / 2;
  S.position('spreader.frame', { parentKey: HB, sub: '061', category: 'component', label: 'Spreader (STS45 telescopic, 40 ft setting)', prov: 'estimated', sources: [src('J526A00', 2, 'item 35 STS45 (Bromma), (12+4) for 12 cranes; spreader drawing not supplied (U-10)'), src('J526A1200', 1, 'headblock twistlocks 950 x 5200 land on the spreader main frame'), src('DT1500F', 1, 'spreader trailer: cradles 1300 apart, 3600 between cradle pairs'), src('ISO 1161', null, '40 ft corner-fitting centres 11985 x 2259'), src('J526A00', 1, 'underside at lift height 45 m in the display position')] },
    (g) => {
      const yb0 = ySp0 + 0.22, yb1 = ySp1 - 0.1; // main-frame beam depth
      for (const s of [1, -1]) g.add('spreader', boxMinMax([XT + s * SMB - 0.21, yb0, -SML], [XT + s * SMB + 0.21, yb1, SML])); // longitudinal main beams
      for (const zs of [1, -1]) {
        g.add('spreader', boxMinMax([XT - SMB - 0.21, yb1 - 0.3, zs * span - 0.22], [XT + SMB + 0.21, yb1, zs * span + 0.22])); // cross member under the headblock landing points
        g.add('spreader', boxMinMax([XT - SMB, yb0, zs * SML - 0.25], [XT + SMB, yb1 - 0.05, zs * SML])); // main-frame end plates
        for (const dx of [-HTX, HTX]) g.add('steel', box([XT + dx, ySp1 - 0.06, zs * span], [0.28, 0.12, 0.28])); // headblock landing castings
        // telescopic arms: two per end, sliding in the main beams, to the end beam
        for (const s of [1, -1]) g.add('spreader', boxMinMax([XT + s * SMB - 0.15, ySp0 + 0.3, zs * (SML - 1.2)], [XT + s * SMB + 0.15, ySp0 + 0.68, zs * (SPL - 0.25)]));
        // end beam across the container width, with the arm sockets
        g.add('spreader', boxMinMax([XT - SEB, ySp0, zs * SPL - 0.25], [XT + SEB, ySp0 + 0.78, zs * SPL + 0.25])); // underside = lift height in the display pose
        g.add('spreader', boxMinMax([XT - SMB - 0.25, ySp0 + 0.25, zs * (SPL - 0.25)], [XT + SMB + 0.25, ySp0 + 0.72, zs * (SPL - 0.7)]));
      }
      g.add('spreader', boxMinMax([XT - SMB, yb1 - 0.2, -0.2], [XT + SMB, yb1, 0.2])); // centre cross member
      g.add('machinery', boxMinMax([XT - 0.42, yb0 + 0.05, 0.45], [XT + 0.42, yb1 + 0.2, 1.75])); // hydraulic power pack
      g.add('machinery', boxMinMax([XT - 0.38, yb0 + 0.05, -1.7], [XT + 0.38, yb1 + 0.1, -0.6])); // electrical box
    });
  for (const [k, zs, xs] of [['a-ws', 1, 1], ['a-ls', 1, -1], ['b-ws', -1, 1], ['b-ls', -1, -1]]) {
    // U1 round 2 (U1-C16): corner casting, twistlock and raised orange flipper instead of a ball. U1 round 3: twistlock on
    // the ISO 1161 40 ft corner-fitting centre (11985 x 2259) at the end-beam corner; sizes estimated (U-10).
    const tx = XT + xs * SPW, tz = zs * SPL;
    S.hotspot(`spreader.twistlock.${k}`, { parentKey: HB, sub: '061', modes: ['overall', 'technical'], point: [tx, ySp0 - 0.1, tz], radius: 0.35, label: `Spreader twistlock / flipper corner ${k.toUpperCase()} (hardware representative)`, sources: [src('ISO 1161', null, '40 ft corner-fitting centres 11985 x 2259'), src('J526A00', 2, 'STS45 spreader drawing not supplied (U-10)'), PHOTO('08_44_08 PM', 'orange flippers at the spreader corners')] },
      (g) => {
        const xo = XT + xs * (SEB + 0.04), zo = zs * (SPL + 0.29); // outer faces of the end beam corner
        g.add('steel', boxMinMax([tx - xs * 0.22, ySp0 - 0.03, tz - zs * 0.25], [XT + xs * SEB, ySp0 + 0.32, zs * (SPL + 0.25)])); // corner box
        g.add('steel', cyl([tx, ySp0 - 0.1, tz], 'y', 0.065, 0.16, 12), box([tx, ySp0 - 0.2, tz], [0.18, 0.07, 0.12])); // twistlock cone and head
        g.add('steel', cyl([tx, ySp0 + 0.42, tz], 'y', 0.11, 0.2, 12)); // twistlock rotary actuator
        g.add('flipper', boxMinMax([xo, ySp0 + 0.25, tz - zs * 0.55], [xo + xs * 0.03, ySp0 + 1.0, zo])); // side flipper (raised)
        g.add('flipper', boxMinMax([tx - xs * 0.55, ySp0 + 0.25, zo], [xo + xs * 0.03, ySp0 + 1.0, zo + zs * 0.03])); // end flipper (raised)
        g.add('steel', cyl([xo, ySp0 + 0.3, tz], 'z', 0.06, 0.3, 10)); // flipper hinge / actuator
      });
  }

  // ---------- reeving (ropes are thin; viewer applies a 0.5 m minimum fit extent) ----------
  // U1 repair: paths follow the J526A00 reeving diagrams. Main hoist: drums -> girder-tail sheaves (anti-snag levers)
  // -> trolley landside sheaves -> headblock -> trolley -> boom-tip sheaves, with the equalising cross-over at the tip.
  // Trolley: drum -> boom-tip sheaves -> trolley waterside end, and drum -> girder-tail tensioner sheaves -> trolley
  // landside end. Boom hoist: drum -> apex sheaves -> multi-fall between the apex and the boom sheave blocks.
  const R = 0.05; // display radius (actual 31.5 / 25 / 35.5 mm ropes would be invisible at crane scale)
  const poly = (g, pts, r = R) => { for (let i = 0; i < pts.length - 1; i++) g.add('rope', tube(pts[i], pts[i + 1], r, 6)); };
  // U1 round 3 (U1-C17): the trolley part of both rope paths follows J526A0200 / J526A2100.
  // Main hoist, per rope side: two ropes. Rope 1 (landside loop) runs from the girder-tail sheave over landside-shaft
  // sheave 1, down the inner side to the landside headblock sheave, under it, up the outer side to landside-shaft
  // sheave 2 and over its top to the boom tip (side view: 1400 -> 1005 and 400 -> 5 from the centre). Rope 2 passes
  // between the landside sheaves and makes the same loop on the waterside shaft and headblock sheave. 4 ropes, 8 trolley
  // sheaves, 4 headblock sheaves, 8 falls (J526A0200 reeving sketch; J526A00 reeving diagram).
  // Trolley rope: drum -> boom-tip sheave unit (1050 either side of the centreline) -> waterside end of the trolley,
  // around the two horizontal equalizer sheaves (U-turn to the other lane) and back; likewise at the landside end via
  // the girder-tail tension device (J526A2100 Detail I, Detail III, A-A, C-C; J526A0200 E-E).
  const arcPts = (cx, cy, r, a0, a1, z0, z1, n = 8) => { const out = []; for (let k = 0; k <= n; k++) { const t = k / n; const a = a0 + (a1 - a0) * t; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + (z1 - z0) * t]); } return out; };
  S.position('hoist.rope.set.main', { sub: '015', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Main hoist rope set (4 ropes, 8 falls; path simplified away from the trolley)', prov: 'estimated', sources: [s00('main hoist rope reeving diagram: 4 ropes from 2 drums over the girder-tail sheaves, trolley and headblock to the boom tip'), src('J526A0200', 1, 'main hoist rope reeving sketch and side view: each rope loops once between a trolley shaft (2 sheaves) and one headblock sheave'), src('J526A0300', 1, 'IWRC 6xWS(36) dia 31.5'), src('J526A1000', 1, 'tail sheaves on the anti-snag levers'), src('J526A2000', null, 'boom-tip anchors (Detail I); path simplified')] },
    (g) => {
      const rr = rTG + RT2; const rh = P('headblockSheaveDia') / 2 - 0.05 + RT2; const yTop = yTSh + rr;
      for (const s of [1, -1]) {
        const zr = s * ZR; const zD = HZ + s * (DSPAN - DL / 2);
        // [tail offset, shaft x, lanes (in, out), headblock sheave x, tip offset]
        for (const [dzT, xs, lanes, xh, dzTip] of [[-0.15, XT - SO, LANE_LS, XT - HSP, -0.15], [0.15, XT + SO, LANE_WS, XT + HSP, 0.15]]) {
          const zT = zr + s * dzT; const zIn = s * (ZH + lanes[0]); const zOut = s * (ZH + lanes[1]); const zTip = zr + s * dzTip;
          // drum -> girder-tail sheaves -> trolley shaft top
          poly(g, [[HXD - 0.3, yDrum - 0.55, zD + s * dzT * 4], [HX0 - 0.4, G_TOP + 0.5, zT], [xTS[1], yTS + rTS, zT], [xTS[0], yTS + rTS, zT], [xTS[0] - rTS, yTS, zT], [xTS[0], yTS - rTS, zT], [xs, yTop, zIn]]);
          // over sheave 1 and down its +X side (the rope arrives heading +X), around the headblock sheave, up the -X side
          // and over sheave 2 (landside loop: inner side down, outer side up; waterside loop: outer side down, inner side up)
          const down = arcPts(xs, yTSh, rr, Math.PI / 2, 0, zIn, zIn, 6); // top -> +X side
          const hbIn = [xh + rh, yHS, zr], hbOut = [xh - rh, yHS, zr];
          const under = arcPts(xh, yHS, rh, 0, -Math.PI, zr, zr, 10); // +X side -> under -> -X side
          const up = arcPts(xs, yTSh, rr, Math.PI, Math.PI / 2, zOut, zOut, 6); // -X side -> top
          poly(g, [...down, hbIn], RT2); poly(g, under, RT2); poly(g, [hbOut, ...up], RT2);
          // out to the boom-tip sheaves
          poly(g, [[xs, yTop, zOut], [XTIP - 0.9, G_TOP + 1.2, zTip], [XTIP - 0.3, G_TOP + 0.6, zTip]]);
        }
      }
      for (const dz of [-0.15, 0.15]) g.add('rope', tube([XTIP - 0.3, G_TOP + 0.6, -ZR + dz], [XTIP - 0.3, G_TOP + 0.6, ZR + dz], R, 6)); // equalising cross-over at the tip (simplified)
    });
  S.position('trolley.rope.set.main', { sub: '024', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Trolley rope set (2 ropes; path simplified away from the trolley)', prov: 'estimated', sources: [s00('trolley rope reeving diagram: drum to the boom-tip and girder-tail sheaves, back to both ends of the trolley'), src('J526A2100', 1, 'ropes B1 (landside) and B2 (waterside) dia 25; sheave unit and tension device 1050 either side of the boom centreline'), src('J526A0200', 1, 'equalizer sheaves at both trolley ends (E-E); trolley rope about 310 above the rail (scaled)'), src('J526A0400', 1, 'rope dia 25')] },
    (g) => {
      const tipX = XTIP - 0.9, tipY = G_TOP + 0.6, rTip = P('trolleyTipSheaveDia') / 2 - 0.04 + RT2; const rE = P('trolleyEqualizerSheaveDia') / 2 - 0.045 + 0.025;
      const zP = P('trolleyRopePassingLaneZ'); const rT = 0.035; // passing run 950 from the centreline (over the trolley), return run 1050
      for (const t of [1, -1]) {
        const z = t * ZTR;
        const yApp = tipY + rTip - 0.02; // passing run reaches the sheave-unit top just before the tip
        poly(g, [[TXD + 0.3, yT - 0.4, TDZ + 0.9], [HX1 + 0.4, G_TOP + 0.6, t * zP], [tipX - 3, yApp, t * zP], [tipX, tipY + rTip, z], [tipX + rTip, tipY, z], [tipX, tipY - rTip, z], [XEQ_W, yTR, z]], rT);
        poly(g, [[TXD - 0.3, yT - 0.4, TDZ - 0.9], [HX0 - 0.4, G_TOP + 0.6, t * zP], [xTT + 3, yTT + rTT - 0.02, t * zP], [xTT, yTT + rTT, z], [xTT - rTT, yTT, z], [xTT, yTT - rTT, z], [XEQ_L, yTR, z]], rT);
      }
      // U-turns around the equalizer sheaves: landside end on their +X (inboard) side, waterside end on their -X side
      for (const [xe, dir] of [[XEQ_L, 1], [XEQ_W, -1]]) {
        const pts = [];
        for (let k = 0; k <= 6; k++) { const th = (Math.PI / 2) * (k / 6); pts.push([xe + dir * rE * Math.sin(th), yTR, ZEQ + rE * Math.cos(th)]); }
        for (let k = 0; k <= 6; k++) { const th = Math.PI / 2 + (Math.PI / 2) * (k / 6); pts.push([xe + dir * rE * Math.sin(th), yTR, -ZEQ + rE * Math.cos(th)]); }
        poly(g, pts, RT2); // starts at (xe, +1050) where the incoming run ends, ends at (xe, -1050)
      }
    });
  // U1 round 2 (U1-C14): boom hoist reeving re-read from J526A2300 p1. Drum -> guide sheave on the apex platform ->
  // fall-sheave groups under the apex cantilever -> falls to TWO boom sheave blocks: B-B at Z2 (28000 from the
  // waterside rail, sheave 1350 above the girder top, 1425 from the boom centreline) and C-C at Z3 (62500, 1200,
  // 1690). Fall counts per side (4 inner, 3 outer) follow the View A sheave groups; paths simplified.
  const yBI = G_TOP + P('forestayInnerBracket'), yBO = G_TOP + P('forestayOuterBracket'); const zBI = P('boomBlockInnerZ'), zBO = P('boomBlockOuterZ');
  S.position('boom.rope.set.main', { sub: '033', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Boom hoist rope set (simplified path)', prov: 'estimated', sources: [src('J526A2300', 1, 'drum -> apex guide sheave -> falls between the apex sheave groups and the boom blocks at B-B (Z2) and C-C (Z3); falls per side simplified to 4 + 3'), s00('boom hoist rope reeving diagram'), src('J526A0500', 1, 'rope dia 35.5')] },
    (g) => {
      for (const s of [1, -1]) {
        const zg = s * ZGS;
        // drum to the landside side of the guide sheave, wrap over the top, down the waterside to the fall groups
        const arc = []; for (let k = 0; k <= 8; k++) { const a = Math.PI - (Math.PI * 0.75) * (k / 8); arc.push([xGS + rGS * Math.cos(a), yGS + rGS * Math.sin(a), zg]); }
        poly(g, [[BXD, yB + 0.77, BDZ + s * 1.7], ...arc]);
        const last = arc[arc.length - 1];
        poly(g, [last, [xFG, yFG + rFG, s * ZFI]]); poly(g, [last, [xFG, yFG + rFG, s * ZFO]]);
        for (let k = 0; k < 4; k++) { const dz = (k - 1.5) * 0.17; g.add('rope', tube([xFG + rFG * 0.6, yFG - rFG * 0.6, s * ZFI + dz], [XZ2, yBI + 0.25, s * zBI + dz], R * 0.9, 6)); }
        for (let k = 0; k < 3; k++) { const dz = (k - 1) * 0.17; g.add('rope', tube([xFG + rFG * 0.6, yFG - rFG * 0.6, s * ZFO + dz], [XZ3, yBO + 0.25, s * zBO + dz], R * 0.9, 6)); }
      }
    });
  S.position('boom.sheave.boom-block', { parentKey: B_, sub: '031', category: 'component', label: 'Boom hoist sheave blocks on the boom (Z2 and Z3)', prov: 'estimated', sources: [src('J526A2300', 1, 'sections B-B (28000, 1350, 1425 to the boom centreline) and C-C (62500, 1200, 1690); cross-beam and side plates simplified'), s00('boom hoist rope reeving diagram')] },
    (g) => {
      for (const [x, y, zb, nS] of [[XZ2, yBI, zBI, 4], [XZ3, yBO, zBO, 3]]) {
        const w = 0.17; const rB = P('boomBlockSheaveDia') / 2;
        for (const s of [1, -1]) {
          const z0 = s * zb - ((nS - 1) * w) / 2;
          for (let k = 0; k < nS; k++) g.add('steel', ...sheave([x, y, z0 + k * w], 'z', 2 * rB, 0.1));
          for (const dz of [-(nS * w) / 2 - 0.05, (nS * w) / 2 + 0.05]) g.add('paint', boxMinMax([x - rB - 0.1, y - 0.15, s * zb + dz - 0.03], [x + rB + 0.1, y + rB + 0.45, s * zb + dz + 0.03]));
        }
        g.add('paint', boxMinMax([x - 0.3, y + rB + 0.35, -ZG - 0.3], [x + 0.3, y + rB + 0.7, ZG + 0.3])); // cross-beam between the girder brackets
        for (const s of [1, -1]) g.add('paint', boxMinMax([x - 0.3, G_TOP, s * ZG - 0.3], [x + 0.3, y + rB + 0.7, s * ZG + 0.3])); // bracket posts
      }
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
    // U1 round 2 (U1-C16): wheel brake drawn as a brake housing with thruster and two shoe arms between the middle wheels
    // of the corner (count and exact location not confirmed).
    S.hotspot(`gantry.wheel-brake.${c.id}`, { parentKey: GA_, sub: '046', modes: ['overall', 'technical'], classificationNote: 'Wheel brake JLQ115 (115 kN): 046 wheel clamp device proposed; 041 also mentions gantry brake; Admin to confirm', point: [c.X0 + 0.55, 1.2, c.Zc], radius: 0.35, label: `Gantry wheel brake ${c.id.toUpperCase()} (count/location approximate)`, sources: [src('J526A0600', 1, 'wheel brake JLQ115.00-KH, item 12; count per corner not confirmed')] },
      (g) => {
        g.add('brake', boxMinMax([c.X0 + 0.36, 0.9, c.Zc - 0.28], [c.X0 + 0.75, 1.5, c.Zc + 0.28]));
        g.add('brake', cyl([c.X0 + 0.6, 1.72, c.Zc], 'y', 0.08, 0.44, 10)); // thruster
        for (const dz of [-0.24, 0.24]) g.add('brake', boxMinMax([c.X0 + 0.33, 0.35, c.Zc + dz - 0.03], [c.X0 + 0.41, 0.95, c.Zc + dz + 0.03]));
      });
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
  S.position('access.stair.landside-leg-b', { parentKey: AC, sub: '151', category: 'structural', label: 'Stair tower, landside leg B', prov: 'estimated', sources: [src('J526A5000', 1, 'View P: switch-back flights outboard of leg B with landings A 6500, B 15615, C 47845 and 53430; side view: stair on the landside face of the leg'), s00('landside end view: zig-zag stair outside leg B up to 53430')] },
    (g) => {
      // U1 repair: the P03 flights ran along X across the leg; J526A5000 View P shows them running along Z outboard of
      // leg B (switch-back), on the landside face of the leg in the side view. Two flight lanes side by side in X.
      const lv = P('elevatorLandings'); const levels = [0, ...lv]; const per = N('stairFlightsPerSegment');
      // zIn: J526A5000 View P / J526A00 landside end view put the inner landings over leg B itself (the tower stands on the
      // landside face of the leg, so it overlaps the leg in Z, not in X); the outer landings about 3.1 m beyond the leg axis.
      const zIn = ZLB + 0.3, zOut = zIn - P('stairTowerRunZ'); const fw = P('stairFlightWidth');
      const xFace = XLS - 0.665; const xA = xFace - 0.15 - fw / 2, xB = xA - fw - 0.15; const xBack = xFace - P('stairTowerDepthX');
      let k = 0;
      for (let seg = 0; seg < per.length; seg++) {
        const y0 = levels[seg], y1 = levels[seg + 1], n = per[seg], h = (y1 - y0) / n;
        for (let i = 0; i < n; i++, k++) {
          const out = k % 2 === 0; const x = out ? xA : xB;
          const ya = y0 + i * h, yb = ya + h;
          // U1 round 2: the first flight from the ground is longer and starts inboard (J526A5000 View P: one flight to landing A)
          const zStart = k === 0 ? zIn - 0.5 + P('stairFirstFlightExtraRun') : out ? zIn - 0.5 : zOut + 0.5;
          const f = stairFlight([x, ya, zStart], [x, yb, out ? zOut + 0.5 : zIn - 0.5], fw);
          g.add('grating', ...f.grating); g.add('paint', ...f.paint);
          const zl = out ? zOut : zIn - 0.5; // landing at the top of this flight
          g.add('grating', boxMinMax([xBack, yb - 0.06, out ? zOut : zIn - 0.5], [xFace - 0.05, yb, out ? zOut + 0.5 : zIn]));
          // outer landing rail; left open at the elevator landing levels, where the elevator landing platform joins (U1 round 2)
          const elevLevel = lv.some((v) => Math.abs(v - yb) < 0.05);
          if (out) g.add('paint', ...(elevLevel ? [] : railing([xBack, yb, zl], [xFace - 0.05, yb, zl], { step: 0.9 })), ...railing([xBack, yb, zl], [xBack, yb, zl + 0.5], { step: 0.5, mid: false }));
        }
      }
      // corner posts of the tower and tie-backs to the leg
      for (const x of [xBack, xFace - 0.05]) g.add('paint', boxMinMax([x - 0.06, 0, zOut - 0.06], [x + 0.06, lv[3] + 1.1, zOut + 0.06]));
      for (const y of lv) g.add('paint', boxMinMax([xBack, y - 0.25, zOut], [xFace - 0.05, y - 0.1, zIn]));
    });
  // U1 round 2 (U1-C16): elevator corrected from J526A5100 p1. "Location of the elevator" (plan) puts it outboard of
  // landside leg B along the rail (-Z), on the leg's X line, not on the seaside face; section C-C (1:30): envelope
  // 1735 along the rail from the leg face, car 1000 x 1000 inside, rack mast against the leg, drive unit between, car
  // door on the outer (-Z) face; landings 6500 / 15615 / 47845 / 53430 flush with the stair-tower platforms (note 2);
  // mast top 53430 + 3000. Mast section, car wall thickness, foundation height and tie spacing are estimated.
  const LEGF = -ZL - LEG[1] / 2; const lv = P('elevatorLandings'); const car = P('elevatorCar');
  const zM0 = LEGF - P('elevatorMastDepthZ'), zM1 = LEGF; const zC1 = LEGF - P('elevatorCarFromLegFace'), zC0 = zC1 - car[2] - 0.12; const xC = XLS; const hwC = car[0] / 2 + 0.06;
  const yF = P('elevatorFoundationHeight'); const yMT = lv[3] + 3.0;
  S.position('access.elevator.mast', { parentKey: AC, sub: '153', category: 'structural', label: 'Elevator mast (rack, ties to leg B) and landing platforms', prov: 'drawing-derived', sources: [src('J526A5100', 1, 'SC40 rack-and-pinion lift outboard of landside leg B along the rail (location plan, C-C); landings 6500 / 15615 / 47845 / 53430 flush with the stair platforms; mast top 53430 + 3000; supports 1-3 to the leg; mast section and tie spacing estimated')] },
    (g) => {
      g.add('paint', boxMinMax([xC - 0.55, yF - 0.35, zM0 - 0.3], [xC + 0.55, yF, zM1])); // foundation frame (item 1)
      for (const dx of [-0.3, 0.3]) g.add('steel', cyl([xC + dx, (yF + yMT) / 2, (zM0 + zM1) / 2], 'y', 0.06, yMT - yF, 10)); // mast chords
      g.add('steel', boxMinMax([xC - 0.06, yF, zM0 - 0.04], [xC + 0.06, yMT, zM0 + 0.02])); // rack on the car side
      for (let y = yF + 1.5; y < yMT; y += 1.5) g.add('steel', boxMinMax([xC - 0.32, y - 0.03, zM0 + 0.02], [xC + 0.32, y + 0.03, zM1 - 0.02])); // mast lacing
      for (let y = yF + 3.0; y < yMT - 0.5; y += P('elevatorTieSpacing')) g.add('paint', boxMinMax([xC - 0.08, y - 0.08, zM1 - 0.05], [xC + 0.08, y + 0.08, LEGF + 0.15])); // ties to the leg (supports 1-3)
      g.add('paint', boxMinMax([xC - 0.45, yMT - 0.08, zM0 - 0.1], [xC + 0.45, yMT, zM1])); // top frame (item 2)
      // landing platforms in front of the car door, joined to the stair-tower platforms on the landside
      const zL1 = zC0 - 0.05, zL0 = zL1 - P('elevatorLandingDepthZ'); const xL0 = XLS - 0.665 - P('stairTowerDepthX'), xL1 = xC + hwC + 0.15;
      for (const y of lv) {
        g.add('grating', boxMinMax([xL0, y - 0.08, zL0], [xL1, y, zL1]));
        g.add('paint', boxMinMax([xL0, y - 0.3, zL0], [xL1, y - 0.08, zL0 + 0.12]), boxMinMax([xL1 - 0.12, y - 0.3, zL0], [xL1, y - 0.08, zL1])); // edge beams
        g.add('paint', ...railing([xL0, y, zL0], [xL1, y, zL0], { step: 1.2 }), ...railing([xL1, y, zL0], [xL1, y, zC1 + 0.05], { step: 1.0 }));
        g.add('paint', boxMinMax([xL0, y - 0.3, zL0], [xL0 + 0.12, y - 0.08, zL1])); // support to the stair tower
      }
    });
  S.position('access.elevator.car', { parentKey: AC, sub: '153', category: 'component', label: 'Elevator car and drive unit (shown at the first landing)', prov: 'measured', sources: [src('J526A5100', 1, 'SC40, 400 kg / 4 persons, 0.7 m/s, 11 kW; car 1000 x 1000 x 2150 inside; door on the outer face (C-C); first landing 6500; wall, roof and drive-unit sizes estimated')] },
    (g) => {
      const y0 = lv[0], y1 = y0 + car[1] + 0.3;
      g.add('cabin', boxMinMax([xC - hwC, y0, zC0], [xC + hwC, y1, zC1])); // car body
      g.add('cabFrame', boxMinMax([xC - 0.42, y0 + 0.05, zC0 - 0.03], [xC + 0.42, y0 + 2.05, zC0 + 0.01])); // door on the outer face
      g.add('cabFrame', boxMinMax([xC - hwC - 0.02, y0 - 0.15, zC0 - 0.02], [xC + hwC + 0.02, y0, zC1 + 0.02])); // floor frame
      g.add('paint', ...railing([xC - hwC, y1, zC0], [xC + hwC, y1, zC0], { step: 1.1, h: 1.0 }), ...railing([xC - hwC, y1, zC0], [xC - hwC, y1, zC1], { step: 1.0, h: 1.0 }), ...railing([xC + hwC, y1, zC0], [xC + hwC, y1, zC1], { step: 1.0, h: 1.0 })); // roof guard rail
      // drive unit between car and mast: two motors with brakes driving the pinions on the rack
      g.add('machinery', boxMinMax([xC - 0.4, y0 + 0.4, zC1], [xC + 0.4, y0 + 1.9, zM0 - 0.05]));
      for (const y of [y0 + 0.75, y0 + 1.55]) g.add('machinery', cyl([xC + 0.62, y, (zC1 + zM0) / 2], 'x', 0.16, 0.45, 12));
    });

  return { builder: S, materials: mats, landmarks: {
    railGauge: XWS - XLS, outreach: OUT, backreach: BACK, hingeX: XHINGE, boomTipX: XTIP, girderTailX: XTAIL,
    trolleyRail: RAIL_T, portalTopWaterside: TOP_WS, portalTopLandside: TOP_LS, aFrameTop: AF_TOP, apexStayPin: PIN_Y,
    overallHeight: APEX, liftAboveRail: P('liftAboveRail'), legCentreSpacing: 2 * ZL, bogieOverall: 2 * (ZB + 5.6),
    tieBeamUnderside: TIE_BOT, machineryHouse: { x: [HX0, HX1], z: [HZ0, HZ1], floor: FL, eaves: WALL },
  } };
}
