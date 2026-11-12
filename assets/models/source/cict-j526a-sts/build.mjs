// CICT-J526A-STS scene definition, version 1 (P03). Editable model source.
// Run through tools/model-generator/generate.mjs, which supplies the kit, builder and parameter reader.
// Units: metres. Axes: Y up, +X along the boom toward waterside, Z along the rails. Origin: top of the waterside
// rail on the crane transverse centreline (landside rail at X = -30). 'a' = +Z side, 'b' = -Z side.
// Every dimension comes from params.json (with provenance) or is declared here as an estimate in the node provenance.

// U1-C70 (D-220): parts from the QC component workbook and the manual list, placed by tools/u1/import_qc_components.py.
import { REFERENCE_COMPONENTS } from './reference-components.mjs';
import { tlsLayout, drawTlsFrame, drawTlsCylinder } from './backreach.mjs';
import { fitComponents } from './fitted-components.mjs';
import { cabinModel } from './cabin.mjs';

export function buildCrane({ kit, SceneBuilder, Materials, P, THREE }) {
  const { box, boxMinMax, tube, cyl, beam, taper, gableRoof, sheave, texturedQuad, stairFlight, railing } = kit;
  const src = (drawing, pdfPage, note) => ({ drawing, pdfPage, note });
  const N = (id) => { const v = P(id); return Array.isArray(v) ? v.map((x) => Math.round(x * 1000)) : Math.round(v * 1000); }; // count parameters (unit 'count')
  // U1-C66 rope geometry in the X-Y plane of a sheave (axis z): wraps are arcs, free runs are tangent lines.
  const ARC = (cx, cy, r, a0, a1, z, n = 10) => { const o = []; for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * (k / n); o.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); } return o; };
  const tanFrom = (px, py, cx, cy, r, sign) => { // tangent point on circle (c, r) for a line from p; sign picks the side
    const b = Math.atan2(py - cy, px - cx), a = Math.acos(Math.min(1, r / Math.hypot(px - cx, py - cy))); return b + sign * a; };
  const tanOuter = (x1, y1, r1, x2, y2, r2, sign) => { // external tangent normal angle between two circles
    const u = Math.atan2(y2 - y1, x2 - x1), t = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / Math.hypot(x2 - x1, y2 - y1)))); return u + sign * t; };
  const onC = (cx, cy, r, a, z) => [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
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
    cabGlass: { color: '#6fa3bd', roughness: 0.08, metalness: 0.1, opacity: 0.18, role: 'cab glazing, light green/blue tint (J526A3100 table 2), translucent so the seat is visible' },
    seat: { color: '#24282c', roughness: 0.8, role: 'operator seat and console tops (black)' },
    acUnit: { color: '#d7dbde', roughness: 0.7, role: 'air-conditioning units (neutral)' },
    hydraulic: { color: '#c7ccd1', roughness: 0.25, metalness: 0.8, role: 'hydraulic cylinder rods (chrome)' },
    markings: { color: '#ffffff', roughness: 0.7, alphaTest: 0.5, texture: 'textures/portal-markings.png', role: 'U1-C76 portal markings: generated white lettering and a plain white panel (tools/u1/make_portal_markings.py); no vendor artwork' },
    zpmcPlate: { color: '#ffffff', roughness: 0.7, texture: 'textures/zpmc-plate.png', role: 'U1-C77 ZPMC plate: user-supplied artwork documents/zpmc flag.jpg, cleaned and enlarged by tools/u1/make_portal_markings.py' },
    craneNumber: { color: '#ffffff', roughness: 0.7, alphaTest: 0.5, texture: 'textures/portal-number-blank.png', role: 'U1-C76 crane-number decal: blank placeholder; the viewer draws the selected crane number on it' },
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
    refPart: { color: '#6f7d8a', roughness: 0.5, metalness: 0.35, role: 'U1-C70 workbook / manual parts drawn as simple located shapes (neutral; not a vendor or status colour)' },
    cabInstrument: {color:'#ffffff',roughness:.55,role:'Cabin instrument housings and static illustrative screens; vertex colours, not live status'},
  });
  mats.get('cabInstrument').vertexColors = true;
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
  const TOP_WS = P('portalTopWaterside'); const TOP_LS = P('portalTopLandside'); const UB = P('portalUpperBeamDepth'); const UBW = P('portalUpperBeamWidth'); // U1-C77: 1330 (J526A010100 C-C / D-D)
  const TIE_BOT = P('portalTieBeamUnderside'); const TIE_C = P('portalTieBeamCentre');
  const AF_TOP = TOP_WS + P('aFrameHeight');
  const ZA = P('aFrameTopSpacing') / 2;
  const PIN_Y = G_TOP + P('backstayFootAboveGirder') + P('backstayRise'); // apex stay pin, from the backstay slope
  const XBS = XLS - P('backstayFootFromLandsideRail');
  const APEX = P('apexMarker');
  const ZB = P('bogieGroupSpacing') / 2;
  const tripX0 = XHINGE + P('collisionRearSupportFromHinge'), tripX1 = tripX0 + P('collisionWireSpan');
  const tripZ = ZG + GW / 2 + P('collisionWireOutboard');
  const REEL_X = XWS + P('cableReelPlaneFromRail'); // U1-C76 (D4): gantry cable reel plane, seaside of the waterside rail

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
    const UBe = end === 'landside' ? P('portalUpperBeamDepthLandside') : UB; // U1-C77: view A prints 3350 for the landside beam zone
    S.position(`structure.portal.${end}.sill-beam`, { parentKey: P_, sub: '151', category: 'structural', label: `Sill beam, ${end}`, prov: 'drawing-derived', sources: [s0100('3700 + 2600; length 2625 + 15800 + 2625'), src('J526A00', 1, '21050')] },
      (g) => {
        g.add('paint', boxMinMax([X0 - 0.665, SILL_PIN, -P('sillLength') / 2], [X0 + 0.665, SILL_TOP, P('sillLength') / 2]));
        const [hr, hh] = P('sillHaunch'); // U1-C76 (D9): haunched inner corners (J526A00 end views, scaled)
        for (const s of [1, -1]) { const zi = s * (ZL - LEG[1] / 2); g.add('paint', taper([X0, SILL_TOP, zi - s * hr / 2], [LEG[0], hr], [X0, SILL_TOP + hh, zi - s * 0.01], [LEG[0], 0.02])); }
      });
    for (const [side, s] of [['a', 1], ['b', -1]]) {
      const Z = s * ZL;
      if (end === 'landside') {
        S.position(`structure.portal.landside.leg.${side}`, { parentKey: P_, sub: '151', category: 'structural', label: `Landside leg ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('vertical leg on the landside rail; knuckle 3700 + 2600; leg top under the landside upper beam')] },
          (g) => g.add('paint',
            taper([X0, SILL_TOP, Z], LEG, [X0 + 0.6, TIE_BOT, Z], [2.6, 2.5]),
            boxMinMax([X0 - 0.665, TIE_BOT, Z - 1.25], [X0 + 0.665, top - UBe, Z + 1.25])));
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
    S.position(`structure.portal.${end}.upper-beam`, { parentKey: P_, sub: '151', category: 'structural', label: `Upper portal beam, ${end}`, prov: 'drawing-derived', sources: [s0100(end === 'waterside' ? 'view B: 5000 + 49000 to top; depth 2850' : 'view A: 5000 + 49250 to top (U-05); 3350'), src('J526A0100', 3, 'J526A010100 sections C-C / D-D: box 1330 wide (U1-C77)')] },
      (g) => {
        const Xb = end === 'waterside' ? XMAST : XLS;
        g.add('paint', boxMinMax([Xb - UBW / 2, top - UBe, -ZL - 1.25], [Xb + UBW / 2, top, ZL + 1.25]));
        for (const s of [1, -1]) g.add('paint', boxMinMax([Xb - 0.4, G_TOP, s * ZG - 0.4], [Xb + 0.4, top - UBe, s * ZG + 0.4])); // girder hangers
        const [hr, hd] = P('portalHaunch'); // U1-C76 (D9): haunched inner corners under the upper beam (J526A00 end views, scaled)
        for (const s of [1, -1]) { const zi = s * (ZL - 1.25); g.add('paint', taper([Xb, top - UBe - hd, zi - s * 0.01], [UBW, 0.02], [Xb, top - UBe, zi - s * hr / 2], [UBW, hr])); }
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
  // U1-C76 (D5): white markings on the outer faces of the portal tie beams and "01" on the waterside legs, as in the
  // cover photo and documents/images2.jpg. Decal only (not a maintenance identity; picks as the portal container).
  {
    const uvQuad = (bl, br, tr, tl, u0, v0, u1, v1) => { const q = new THREE.BufferGeometry();
      q.setAttribute('position', new THREE.Float32BufferAttribute([...bl, ...br, ...tr, ...tl], 3));
      q.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u1, v0, u0, v0], 2)); q.setIndex([0, 1, 2, 0, 2, 3]); q.computeVertexNormals(); return q; };
    const [mL, mH] = P('portalMarkingStrip'); const xc = (XLS + XWS) / 2, yc = TIE_BOT + 1.5, zf = ZL + 0.8 + 0.02;
    const [lw, lh, ly] = P('portalLegMarking'); const yK = SILL_TOP + P('watersideLegLowerVertical');
    const xLeg = (y) => XWS + (XMAST - XWS) * (y - yK) / P('watersideLegLeanHeight') + LEG[0] / 2 + 0.02; // seaside face of the leaning leg
    S.containerDecal(P_, 'markings', { label: 'Portal markings (SWL and no-smoking lettering; placement approximate)', prov: 'estimated',
      sources: [src('cover.pdf photo / documents/images2.jpg', null, 'crane 01: lettering band on the tie beams; sizes scaled from the photo'), s00('side view item 32 nameplate beam; particulars SWL 65t under spreader, 75t under cargo beam')],
      note: 'Visual marks only; not a maintenance position. Lettering is generated; the ZPMC plate and the crane number are separate decals. The crane number is a separate decal filled by the viewer.' },
      (g) => {
        // -Z face (seen from -Z: waterside on the left) uses row A; +Z face (landside on the left) uses row B
        g.add('markings', uvQuad([xc + mL / 2, yc - mH / 2, -zf], [xc - mL / 2, yc - mH / 2, -zf], [xc - mL / 2, yc + mH / 2, -zf], [xc + mL / 2, yc + mH / 2, -zf], 0, 0, 1, 160 / 512));
        g.add('markings', uvQuad([xc - mL / 2, yc - mH / 2, zf], [xc + mL / 2, yc - mH / 2, zf], [xc + mL / 2, yc + mH / 2, zf], [xc - mL / 2, yc + mH / 2, zf], 0, 176 / 512, 1, 336 / 512));
      });
    // U1-C77: ZPMC plate from the artwork the user supplied (documents/zpmc flag.jpg), on both tie beams at the landside end.
    const [pw, ph, px] = P('zpmcPlate');
    S.containerDecal(P_, 'zpmc-plate', { label: 'ZPMC plate (maker mark on the portal tie beams; placement approximate)', prov: 'estimated',
      sources: [src('documents/zpmc flag.jpg', null, 'artwork supplied by the user 12 Nov 2026; cleaned and enlarged, not redrawn'), src('cover.pdf photo / documents/images2.jpg', null, 'white ZPMC plate at the landside end of the lettering band; size and position scaled')],
      note: 'Visual mark only; not a maintenance position.' },
      (g) => {
        g.add('zpmcPlate', uvQuad([px + pw / 2, yc - ph / 2, -zf - 0.004], [px - pw / 2, yc - ph / 2, -zf - 0.004], [px - pw / 2, yc + ph / 2, -zf - 0.004], [px + pw / 2, yc + ph / 2, -zf - 0.004], 0, 0, 1, 1));
        g.add('zpmcPlate', uvQuad([px - pw / 2, yc - ph / 2, zf + 0.004], [px + pw / 2, yc - ph / 2, zf + 0.004], [px + pw / 2, yc + ph / 2, zf + 0.004], [px - pw / 2, yc + ph / 2, zf + 0.004], 0, 0, 1, 1));
      });
    // Crane number: separate decal with a blank placeholder texture. The viewer draws the selected crane's number on it
    // (user answer 12 Nov 2026: the number follows the selected crane); a bare GLB shows no number.
    const [nw, nh, nxB, nxA] = P('portalBeamNumber');
    S.containerDecal(P_, 'crane-number', { role: 'crane-number', label: 'Crane number (drawn by the viewer for the selected crane; placement approximate)', prov: 'estimated',
      sources: [src('cover.pdf photo / documents/images2.jpg', null, 'crane number on the tie-beam lettering band and on the waterside legs; sizes and positions scaled from the photo')],
      note: 'Visual mark only; not a maintenance position. The model holds a blank placeholder; the number comes from the selected equipment code at run time.' },
      (g) => {
        g.add('craneNumber', uvQuad([nxB + nw / 2, yc - nh / 2, -zf - 0.005], [nxB - nw / 2, yc - nh / 2, -zf - 0.005], [nxB - nw / 2, yc + nh / 2, -zf - 0.005], [nxB + nw / 2, yc + nh / 2, -zf - 0.005], 0, 0, 1, 1));
        g.add('craneNumber', uvQuad([nxA - nw / 2, yc - nh / 2, zf + 0.005], [nxA + nw / 2, yc - nh / 2, zf + 0.005], [nxA + nw / 2, yc + nh / 2, zf + 0.005], [nxA - nw / 2, yc + nh / 2, zf + 0.005], 0, 0, 1, 1));
        for (const s of [1, -1]) g.add('craneNumber', uvQuad([xLeg(ly - lh / 2), ly - lh / 2, s * ZL + lw / 2], [xLeg(ly - lh / 2), ly - lh / 2, s * ZL - lw / 2], [xLeg(ly + lh / 2), ly + lh / 2, s * ZL - lw / 2], [xLeg(ly + lh / 2), ly + lh / 2, s * ZL + lw / 2], 0, 0, 1, 1));
      });
  }
  S.position('access.platform.portal-top', { parentKey: P_, sub: '151', category: 'structural', label: 'Portal-top platform and handrails (waterside)', prov: 'estimated', sources: [src('J526A00', 1, 'waterside end view platform at portal top'), src('J526A5000', null, 'walkway sheets not detailed in P03')] },
    (g) => {
      g.add('grating', boxMinMax([XMAST - 2.2, TOP_WS, -ZL - 2.2], [XMAST + 2.2, TOP_WS + 0.1, ZL + 2.2]));
      const zLane = ZG + GW / 2 + 0.45; // U1-C76 (D8): rail openings where the girder / boom walkway stairs arrive; rails now have posts (the bare bars stood free)
      for (const x of [XMAST - 2.15, XMAST + 2.15]) for (const [za, zb] of [[-ZL - 2.2, -zLane - 0.5], [-zLane + 0.5, zLane - 0.5], [zLane + 0.5, ZL + 2.2]]) g.add('paint', ...railing([x, TOP_WS + 0.1, za], [x, TOP_WS + 0.1, zb], { step: 2.0 }));
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
      // U1-C65: the trolley rails are their own positions (trolley.rail.*, container.trolley-runway)
      for (const s of [1, -1]) g.add('paint', boxMinMax([XTAIL, G_BOT, s * ZG - GW / 2], [XHINGE - 0.3, G_TOP, s * ZG + GW / 2]));
      for (const x of [XTAIL + 0.3, XBS, -42.1, XLS, XMAST - 15, XMAST]) g.add('paint', boxMinMax([x - 0.3, G_BOT, -ZG], [x + 0.3, G_BOT + 0.9, ZG]));
      g.add('paint', boxMinMax([XTAIL, G_BOT, -ZG - GW / 2], [XTAIL + 0.4, G_TOP, ZG + GW / 2])); // end diaphragm; U1-C67: flush with the girder top (it stood 0.5 m proud across the tail stairs; the trolley end stops are in trolley.rail.girder)
    });
  // ---------- back-reach area (U1 repair): girder tail equipment behind the machinery house ----------
  // Sources: J526A00 p1 side view (item 7 anti-snag/LST device at the tail, festoon and cab service platform), J526A1000
  // (anti-snag and trim/list/skew device), J526A5000 p1 (items 5 and 8), J526A7100 (outdoor service crane, Detail C/View A').
  S.container('container.back-reach', { parentKey: 'container.girder', label: 'Back-reach area (girder tail)', prov: 'drawing-derived', sources: [s00('side view: 31000 behind the landside rail; items 7 and 30 at the tail'), src('J526A5000', 1, 'tail platform (5) and festoon and cab service platform (8)')] });
  const BR = 'container.back-reach';
  const TLS = tlsLayout(P);
  const ZR = 2.6; // main hoist rope planes (+/-), as in the trolley and headblock sheaves
  // Pre-C71 coordinates are retained ONLY for cutting the original rope runs at the area boundary.
  // Physical TLS geometry uses TLS above; 2200 is lever travel, never spacing of the new sheaves.
  const XAS0 = XTAIL + P('antiSnagFromTail');
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
  S.position('reeving.anti-snag-tls.device', { parentKey: BR, sub: '111', classificationNote: 'J526A1000 anti-snag and trim/list/skew device: 111 Skew system proposed; Admin to confirm', category: 'component', label: 'Anti-snag / TLS fixed supports and four pendulum levers', prov: 'drawing-derived', qualifier: 'Drawing-derived mechanism; mounting datum and plate profiles estimated', sources: [src('J526A1000', 1, 'U1-C71: normal operation, pivot height 3055, pry bar 3504, rod eye radius 2565, cylinder pin span 2212; four sheaves across Z in pairs 605 apart at +/-2450. The 2200 dimension is lever travel, not longitudinal sheave spacing.'), src('J526A1000', 2, 'four pry bars and four hydraulic cylinders, two main supports'), s00('item 7 at the girder tail; exact mounting datum qualified in params.json')] },
    (g) => drawTlsFrame(g, TLS, kit, P));
  S.position('reeving.sheave.girder-tail', { parentKey: BR, sub: '011', classificationNote: 'Hoist-rope tail sheaves on the anti-snag levers: 011 (hoist, "roller") proposed as for the boom-tip sheaves; Admin to confirm', category: 'component', label: 'Main hoist rope tail sheave axles (four independent TLS levers)', prov: 'drawing-derived', sources: [src('J526A1000', 1, 'U1-C71: four sheaves dia 1000 (B-B), two transverse pairs 605 apart with pair centres +/-2450. The four individually selectable sheaves carry the rims; this retained assembly key carries their axles.'), s00('main hoist rope reeving diagram: ropes turn at the tail sheaves and return to the trolley')] },
    (g) => { for (const z of TLS.zs) g.add('steel', cyl(TLS.at(TLS.sheave,z), 'z', .07, .42, 16)); });
  const rTT = P('trolleyTailSheaveDia') / 2; const xTT = XTAIL + 0.9; const yTT = RAIL_T + P('trolleyRopeAboveRail') + rTT; // U1-C66: sheave bottom at the trolley-rope return height
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
      g.add('paint', boxMinMax([xo + 0.35, yb - 0.32, -1.32], [xo + 0.65, yb - 0.2, 1.32])); // U1-C76: crab beam between the runway beams (the hoist block hung free)
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
      // U1-C76 (D8): the walkway does not pass through the portal upper beams. It stops each side of them and steps
      // over: at the boom hinge up to the portal-top platform, at the landside leg top over the beam to the house walkway
      // (J526A00 side view; flight runs and the house-side descent are scaled estimates).
      const RUN = P('portalCrossingStairRun'); const xW0 = XMAST - 2.2, xW1 = XMAST + 2.2, xL0 = XLS - UBW / 2, xL1 = XLS + UBW / 2; const xHW = P('machineryHouseSeasideWallX'); // U1-C77: beam 1330 wide, house wall 1200 beyond it
      const yHouseWalk = P('machineryHouseFloorElevation');
      const segs = [[XTAIL + 0.3, xL0], [xL1 + RUN, xW0 - RUN], [xW1 + RUN, XTIP - 1]];
      for (const s of [1, -1]) {
        const z0 = s * (ZG + GW / 2), z1 = s * (ZG + GW / 2 + 0.9);
        const [zmin, zmax] = z0 < z1 ? [z0, z1] : [z1, z0]; const zm = (z0 + z1) / 2;
        const zr = s * (ZG + GW / 2 + 0.88);
        for (const [xa, xb] of segs) {
          g.add('grating', boxMinMax([xa, G_TOP - 0.1, zmin], [xb, G_TOP, zmax])); // U1 round 2: starts after the tail stair head
          g.add('paint', boxMinMax([xa === XTAIL + 0.3 ? XTAIL : xa, G_TOP + 1.05, zr - 0.03], [xb, G_TOP + 1.11, zr + 0.03]));
        }
        for (let x = XTAIL + 1; x < XTIP - 1; x += 3) if (segs.some(([xa, xb]) => x > xa && x < xb)) g.add('paint', boxMinMax([x - 0.03, G_TOP, zr - 0.03], [x + 0.03, G_TOP + 1.08, zr + 0.03]));
        const flights = [stairFlight([xW0 - RUN, G_TOP, zm], [xW0, TOP_WS + 0.1, zm], 0.75), stairFlight([xW1 + RUN, G_TOP, zm], [xW1, TOP_WS + 0.1, zm], 0.75),
          stairFlight([xL1 + RUN, G_TOP, zm], [xL1, TOP_LS + 0.05, zm], 0.75),
          stairFlight([(xL0 + xHW) / 2, yHouseWalk, zm + s * 2.0], [(xL0 + xHW) / 2, TOP_LS + 0.05, zm + s * 0.45], 0.7)]; // down to the house seaside walkway
        for (const f of flights) { g.add('grating', ...f.grating); g.add('paint', ...f.paint); }
        g.add('grating', boxMinMax([xHW, TOP_LS, zm - 0.45], [xL1, TOP_LS + 0.05, zm + 0.45])); // deck over the landside upper beam
        g.add('paint', ...railing([xHW, TOP_LS + 0.05, zm - s * 0.45], [xL1, TOP_LS + 0.05, zm - s * 0.45], { step: 1.2 }), ...railing([xL0 - 0.1, TOP_LS + 0.05, zm + s * 0.45], [xL1, TOP_LS + 0.05, zm + s * 0.45], { step: 1.2 }),
          ...railing([xHW, TOP_LS + 0.05, zm - 0.45], [xHW, TOP_LS + 0.05, zm + 0.45], { step: 0.9 }));
      }
    });

  // ---------- boom (03/031) ----------
  S.container('container.boom', { label: 'Boom and forestays', prov: 'drawing-derived', sources: [s0100('boom J526A0105; 75900; Z2 28000; Z3 +34500')] });
  const B_ = 'container.boom';
  const XZ2 = XHINGE + P('forestayInnerBoomX'); const XZ3 = XZ2 + P('forestayOuterBoomSpacing');
  const ZFS = ZG + 0.42; // U1-C66: forestay brackets and boom-block posts on the outer part of the girder top, clear of the trolley rail
  S.position('boom.main.girder', { parentKey: B_, sub: '031', category: 'structural', label: 'Boom main girder (twin boxes and lacing)', prov: 'drawing-derived', sources: [s0100('75900 from the hinge line; outreach 70000; plan lacing nodes scaled'), s00('70000 outreach'), src('J526A6300', 1, 'C72: anti-collision wire supports at 69600 spacing; sections A-A/B-B, 1800 outboard and 400 below the girder. Rear datum and member sections estimated.')] },
    (g) => {
      for (const s of [1, -1]) {
        g.add('paint', boxMinMax([XHINGE + 0.3, G_BOT, s * ZG - GW / 2], [XTIP - 4, G_TOP, s * ZG + GW / 2]));
        g.add('paint', boxMinMax([XTIP - 4, G_BOT + 0.7, s * ZG - GW / 2], [XTIP, G_TOP, s * ZG + GW / 2]));
        g.add('paint', boxMinMax([XZ2 - 0.4, G_TOP, s * ZFS - 0.18], [XZ2 + 0.4, G_TOP + P('forestayInnerBracket'), s * ZFS + 0.18])); // U1-C66: outboard of the trolley rail
        g.add('paint', boxMinMax([XZ3 - 0.4, G_TOP, s * ZFS - 0.18], [XZ3 + 0.4, G_TOP + P('forestayOuterBracket'), s * ZFS + 0.18]));
      }
      const nodes = [0.6, 10.4, 19.7, XZ2, 38.4, 46.3, 54.2, XZ3]; // plan lacing panel points, scaled from J526A0100 plan
      for (let i = 0; i < nodes.length - 1; i++) {
        const s = i % 2 === 0 ? 1 : -1;
        g.add('paint', tube([nodes[i], G_BOT + 0.35, s * (ZG - GW / 2)], [nodes[i + 1], G_BOT + 0.35, -s * (ZG - GW / 2)], 0.2, 8));
      }
      for (const x of [XHINGE + 0.6, XZ2, XZ3, XTIP - 0.4]) g.add('paint', boxMinMax([x - 0.3, G_BOT + 0.1, -ZG], [x + 0.3, G_BOT + 0.8, ZG]));
      // C72: triangular trip-wire brackets connected to the outer girder faces (J526A6300).
      for (const s of [-1, 1]) for (const [x, rise] of [[tripX0, .730], [tripX1, .135]]) {
        const z = s * (ZG + GW / 2), tip = [x, G_BOT - .4, s * tripZ];
        g.add('paint', beam([x, G_BOT + .4, z], tip, .07, .07), beam([x, G_TOP + rise, z], tip, .07, .07),
          beam([x, G_BOT + .4, z], [x, G_TOP + rise, z], .09, .09));
      }
    });
  for (const [side, s] of [['a', 1], ['b', -1]]) {
    S.position(`boom.hinge.${side}`, { parentKey: B_, sub: '031', category: 'component', label: `Boom hinge ${side.toUpperCase()}`, prov: 'estimated', sources: [s0100('detail III hinge assembly (item 8); pin placed on the waterside-rail line')] },
      (g) => g.add('machinery', cyl([XHINGE, G_BOT + 0.9, s * ZG], 'z', 0.55, 1.5, 18), boxMinMax([XHINGE - 0.8, G_BOT, s * ZG - 0.4], [XHINGE + 0.8, G_BOT + 1.5, s * ZG + 0.4])));
    S.position(`boom.forestay.inner.${side}`, { parentKey: B_, sub: '031', category: 'structural', label: `Inner forestay ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('Z2 at 28000; segments 18000 + 19617; slope 27540 / 30000; bar section S1-S1')] },
      (g) => g.add('paint', beam([XMAST + P('forestayApexPinOffsetWaterside'), PIN_Y, s * ZA], [XZ2, G_TOP + P('forestayInnerBracket'), s * ZFS], 0.3, 0.3)));
    S.position(`boom.forestay.outer.${side}`, { parentKey: B_, sub: '031', category: 'structural', label: `Outer forestay ${side.toUpperCase()}`, prov: 'drawing-derived', sources: [s0100('Z3 = Z2 + 34500; segments 15800 + 21300 + 30116; slope 27480 / 64500; bar section S2-S2')] },
      (g) => g.add('paint', beam([XMAST + P('forestayApexPinOffsetWaterside'), PIN_Y + 0.3, s * ZA], [XZ3, G_TOP + P('forestayOuterBracket'), s * ZFS], 0.35, 0.42)));
  }
  S.position('reeving.sheave.boom-tip', { parentKey: B_, sub: '011', classificationNote: 'Sheaves carrying hoist rope: 011 (hoist mechanism, "roller") proposed; Admin to confirm', category: 'component', label: 'Boom-tip hoist rope sheaves and rope-end anchors', prov: 'estimated', sources: [s00('main hoist reeving diagram'), src('J526A2000', null, 'reeving sheet not detailed in P03'), src('J526A2000', 1, 'Detail I (1:20): rope clamp device (2, 2 off) on an anchor pin 480 above the boom top; anchors kept here since U1 round 6 (the 013 load cell moved to the horizontal rope, U1-C25)')] },
    // U1 round 3: trolley-rope sheave units at 1050 either side of the boom centreline, dia 830 (J526A2100 Detail I, A-A)
    // U1-C66: one main hoist sheave per rope (the two rope lanes 150 either side of 2600), and the trolley-rope sheaves raised on
    // pedestals so that their bottoms are at the trolley-rope return height (level run to the trolley equalizer sheaves).
    (g) => {
      for (const s of [1, -1]) for (const dz of [-0.15, 0.15]) g.add('steel', ...sheave([XTIP - 0.9, G_TOP + 0.6, s * (2.6 + dz)], 'z', 1.2, 0.12, 28));
      for (const s of [1, -1]) g.add('steel', cyl([XTIP - 0.9, G_TOP + 0.6, s * 2.6], 'z', 0.08, 0.6, 10)); // hoist sheave shafts
      const rTp = P('trolleyTipSheaveDia') / 2, yTp = RAIL_T + P('trolleyRopeAboveRail') + rTp - 0.04 + 0.032;
      for (const s of [1, -1]) {
        const z = s * P('trolleyRopeLaneZ');
        g.add('steel', ...sheave([XTIP - 0.9, yTp, z], 'z', 2 * rTp, 0.14, 28), cyl([XTIP - 0.9, yTp, z], 'z', 0.05, 0.4, 10));
        for (const dz of [-0.13, 0.13]) g.add('paint', boxMinMax([XTIP - 1.2, G_TOP + 0.3, z + dz - 0.02], [XTIP - 0.6, yTp, z + dz + 0.02])); // pedestal cheeks
      }
      g.add('paint', boxMinMax([XTIP - 1.8, G_TOP, -3.0], [XTIP - 0.1, G_TOP + 0.3, 3.0]));
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

  // ---------- trolley runway (U1-C65): trolley rails and the catenary trolley system ----------
  // J526A0104 (J526A0100 p44, trolley rail 1:30): A75 rails at 6300 +/-3 gauge on 8 mm ZGD190 rubber pads, YB33c clip pairs
  // at 600, girder rail 60200 and boom rail 74600 joined at the boom hinge by short rails J526A010401 (gap 6 +/- 2), end
  // stops (item 8) 250 beyond the rail ends. The rails were steel strips inside the girder and boom nodes until U1-C65.
  // J526A2200 set (catenary trolley rope reeving, J526A2201 boom-tip sheave, J526A2203 tensioner, J526A220400 landside and
  // J526A220500 seaside catenary trolleys): two catenary trolleys run on the same rails and carry the main hoist ropes on
  // roller boxes and the trolley ropes on guide idlers; display positions are their outreach positions on p1 (scaled).
  S.container('container.trolley-runway', { label: 'Trolley rails and catenary trolleys', prov: 'drawing-derived', sources: [src('J526A0100', 44, 'J526A0104 trolley rail'), src('J526A2200', 1, 'catenary trolley rope reeving system')] });
  const TR_ = 'container.trolley-runway';
  const RH = P('trolleyRailHeight'), RHW = P('trolleyRailHeadWidth') / 2, RFW = P('trolleyRailFootWidth') / 2, PAD = P('trolleyRailPadThickness');
  const RB = RAIL_T - RH; // rail foot underside; bedding (support plate, steel pad, rubber pad) fills G_TOP..RB
  const XJ0 = XHINGE - P('trolleyRailHingeJoint'), XJ1 = XHINGE + P('trolleyRailHingeJoint'); // short rails either side of the hinge
  const XRG0 = XHINGE - P('trolleyRailGirderLength'), XRB1 = XHINGE + P('trolleyRailBoomLength');
  const railRun = (g, x0, x1, clips = true) => { // A75 profile, rubber pad, bedding plate and clip pairs on both rails
    for (const s of [1, -1]) {
      const z = s * ZG;
      g.add('steel', boxMinMax([x0, G_TOP, z - 0.13], [x1, RB - PAD, z + 0.13])); // rail support plate / steel pad
      g.add('rope', boxMinMax([x0, RB - PAD, z - 0.095], [x1, RB, z + 0.095])); // ZGD190 rubber pad (190 wide)
      g.add('steel', boxMinMax([x0, RB, z - RFW], [x1, RB + 0.02, z + RFW]), boxMinMax([x0, RB + 0.02, z - 0.02], [x1, RAIL_T - 0.03, z + 0.02]), boxMinMax([x0, RAIL_T - 0.03, z - RHW], [x1, RAIL_T, z + RHW]));
      if (clips) for (let x = x0 + 0.3; x < x1 - 0.2; x += P('trolleyRailClipPitch')) for (const d of [-1, 1]) g.add('steel', box([x, RB + 0.03, z + d * (RFW + 0.035)], [0.09, 0.05, 0.08]));
    }
  };
  const endStop = (g, x) => { for (const s of [1, -1]) g.add('steel', box([x, G_TOP + 0.14, s * ZG], [0.03, 0.275, 0.25])); }; // item 8, -30 x 250 x 275
  const railSrc = (note) => [src('J526A0100', 44, 'J526A0104 trolley rail: ' + note)];
  S.position('trolley.rail.girder', { parentKey: TR_, sub: '021', classificationNote: 'Trolley rails: 021 trolley mechanism ("roller") proposed; Admin to confirm', category: 'component', label: 'Trolley rails on the girder (A and B, A75, 60.2 m)', prov: 'measured', sources: railSrc('item 3 A75 rail 2 off, 60200 from the hinge joint to the tail end, 6300 +/-3 gauge; ZGD190 rubber pad (item 5) 8 x 190; YB33c clip pairs (item 9) at 600; end stop (item 8) 250 beyond the rail end; clip and pad shapes simplified') },
    (g) => { railRun(g, XRG0, XJ0); endStop(g, XRG0 - P('trolleyRailEndBeyond')); });
  S.position('trolley.rail.boom', { parentKey: TR_, sub: '021', classificationNote: 'Trolley rails: 021 trolley mechanism ("roller") proposed; Admin to confirm', category: 'component', label: 'Trolley rails on the boom (A and B, A75, 74.6 m)', prov: 'measured', sources: railSrc('item 2 A75 rail 2 off, 74600 from the hinge joint toward the boom tip, 6300 +/-3 gauge; ZGD190 rubber pad (item 6) 8 x 190; YB33c clip pairs at 600; end stop (item 8) 250 beyond the rail end; clip and pad shapes simplified') },
    (g) => { railRun(g, XJ1, XRB1); endStop(g, XRB1 + P('trolleyRailEndBeyond')); });
  S.position('trolley.rail.hinge-joint', { parentKey: TR_, sub: '021', classificationNote: 'Rail joint at the boom hinge: 021 proposed; Admin to confirm', category: 'component', label: 'Trolley rail joint at the boom hinge (short rails, gap 6 +/- 2)', prov: 'measured', sources: railSrc('short rails J526A010401 (item 1, 4 off, 1500) either side of the boom hinge centreline; joint gap 6 +/- 2 (Detail IV); fix blocks J526A010402 (item 12) and YB55c / YB1313a clips (items 10 / 11) at the joint; steel pads -7.5 x 190 x 800 (item 4)') },
    (g) => {
      railRun(g, XJ0, XHINGE - 0.003, false); railRun(g, XHINGE + 0.003, XJ1, false); // 6 mm joint gap at the hinge
      for (const s of [1, -1]) for (const x of [XJ0 + 0.3, XJ0 + 0.75, XHINGE - 0.4, XHINGE + 0.4, XJ1 - 0.75, XJ1 - 0.3]) for (const d of [-1, 1]) g.add('steel', box([x, RB + 0.035, s * ZG + d * (RFW + 0.045)], [0.15, 0.06, 0.1])); // heavier joint clips and fix blocks
    });
  // Catenary trolleys (J526A220400 / J526A220500): a low cross frame over the rail gauge, two wheels dia 320 at 1050 on each
  // rail, a main-hoist rope roller box over each rope side (1168.5 high), guide idlers on the trolley-rope lanes (2100 apart)
  // and the catenary rope sheave (dia 516) on each catenary rope lane. Frame sections and roller sizes are simplified.
  // U1-C66: every support sits exactly under the rope it carries: the hoist-rope rollers under the straight hoist-rope runs of
  // the display pose, the idlers under the trolley-rope return run (trolleyRopeAboveRail) and the catenary sheaves at the
  // catenary rope heights; the cross frame stays below all rope runs.
  const ZHR = P('hoistRopeLaneZ'), ZTRL = P('trolleyRopeLaneZ'), ZCAT = P('catenaryRopeLaneZ'); const rCW = P('catenaryWheelDia') / 2;
  const RH_R = 0.05, RC_R = 0.035; // display radii of the hoist and catenary ropes (as in the reeving section)
  const yTRR = RAIL_T + P('trolleyRopeAboveRail'); // trolley-rope return run height (equalizer sheaves on the trolley)
  const rCS = P('catenarySheaveDia') / 2, yCSC = RAIL_T + 0.3 + rCS; // catenary trolley sheave centre
  const yCatTop = yCSC + rCS + RC_R, yCatBot = yCSC - rCS - RC_R; // catenary rope top and bottom runs
  // hoist-rope heights of the display pose at a catenary trolley (straight runs: tail sheave bottom -> trolley shaft top -> tip sheave top)
  const XTd = P('trolleyPositionX'), SOd = P('trolleyMainSheaveOffset');
  const yHTop = RAIL_T + P('trolleyMainSheaveCentreAboveRail') + P('trolleyMainSheaveGrooveDia') / 2 + 0.032;
  const lerpY = (x, x0, y0, x1, y1) => y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  const hoistRopeY = (x) => x < XTd ? lerpY(x, xTS[1], yTS - rTS, XTd - SOd, yHTop) : lerpY(x, XTd + SOd, yHTop, XTIP - 0.9, G_TOP + 1.2);
  const catTrolley = (g, xc, ropeClamp = false) => {
    const pw = P('catenaryWheelPitch') / 2; const yRT = hoistRopeY(xc) - RH_R; // top of the hoist-rope roller
    const yIdl = yTRR - RC_R - 0.08; // idler centre, rope resting on top
    for (const s of [1, -1]) {
      for (const dx of [-pw, pw]) { g.add('steel', cyl([xc + dx, RAIL_T + rCW, s * ZG], 'z', rCW, 0.09, 18), cyl([xc + dx, RAIL_T + rCW, s * ZG], 'z', 0.05, 0.3, 8)); } // wheels on the rail
      g.add('paint', boxMinMax([xc - pw - 0.25, RAIL_T + 0.22, s * ZG - 0.17], [xc + pw + 0.25, RAIL_T + 0.42, s * ZG + 0.17])); // wheel box over the rail
      const zr = s * ZHR;
      for (const dz of [-0.25, 0.25]) g.add('paint', boxMinMax([xc - 0.33, RAIL_T, zr + dz - 0.02], [xc + 0.33, RAIL_T + P('catenaryRollerHeight'), zr + dz + 0.02])); // roller box side plates
      g.add('paint', boxMinMax([xc - 0.33, RAIL_T + P('catenaryRollerHeight') - 0.06, zr - 0.27], [xc + 0.33, RAIL_T + P('catenaryRollerHeight'), zr + 0.27])); // roller box top
      g.add('steel', cyl([xc, yRT - 0.13, zr], 'z', 0.13, 0.46, 14), cyl([xc, yRT - 0.13, zr], 'z', 0.04, 0.5, 8)); // hoist-rope support roller under both ropes of the side
      g.add('steel', cyl([xc, yIdl, s * ZTRL], 'z', 0.08, 0.24, 12)); // trolley-rope guide idler
      for (const dz of [-0.14, 0.14]) g.add('paint', boxMinMax([xc - 0.1, RAIL_T + 0.1, s * ZTRL + dz - 0.015], [xc + 0.1, yIdl, s * ZTRL + dz + 0.015])); // idler cheeks
      g.add('steel', ...sheave([xc, yCSC, s * ZCAT], 'z', 2 * rCS, 0.08, 20)); // catenary rope sheave
      for (const dz of [-0.07, 0.07]) g.add('paint', boxMinMax([xc - 0.12, RAIL_T + 0.1, s * ZCAT + dz - 0.015], [xc + 0.12, yCSC, s * ZCAT + dz + 0.015])); // sheave cheeks
    }
    g.add('paint', boxMinMax([xc - 0.33, RAIL_T, -ZG + 0.15], [xc + 0.33, RAIL_T + 0.1, ZG - 0.15])); // low cross frame, below every rope run
    if (ropeClamp) for (const s of [1, -1]) g.add('paint', boxMinMax([xc + 0.3, RAIL_T, s * ZCAT - 0.07], [xc + 0.57, yCatBot - 0.055, s * ZCAT + 0.07])); // bracket for the catenary rope end clamp
  };
  const catSrc = (dwg, note) => [src('J526A2200', 4, dwg + ': ' + note), src('J526A2200', 1, 'catenary trolley rope reeving system; display position = outreach position, scaled')];
  S.position('trolley.catenary.landside', { parentKey: TR_, sub: '021', classificationNote: 'Catenary trolley: 021 trolley mechanism proposed (the 022 description names the "cate trolley" rope tension); Admin to confirm', category: 'component', label: 'Landside catenary trolley (on the girder / boom rails)', prov: 'drawing-derived', sources: catSrc('J526A220400', 'landside catenary trolley 1781.3 kg: wheel assemblies J526A220401 x 4 (dia 320, 1050 pitch), rollers AJR01b x 4, guide idlers (items 3, 5, 6), sheave assemblies J526A220403 x 2, slap blocks UHMWPE; frame 4960, gauge 6300 +/-3; roller and idler heights follow the rope runs (U1-C66)') },
    (g) => catTrolley(g, P('catenaryLandsideX')));
  S.position('trolley.catenary.waterside', { parentKey: TR_, sub: '021', classificationNote: 'Catenary trolley: 021 trolley mechanism proposed; Admin to confirm', category: 'component', label: 'Seaside catenary trolley (on the boom rails)', prov: 'drawing-derived', sources: [src('J526A2200', 5, 'J526A220500: seaside catenary trolley 1680.2 kg: wheel assemblies J526A220401 x 4, rollers AJR01b x 4, guide idlers J526A220501 / 220404 / 220405, sheave assemblies J526A220403 x 2; 5350 over the roller boxes, 1168.5 high, gauge 6300 +/-3; roller and idler heights follow the rope runs (U1-C66)'), src('J526A2200', 1, 'display position = outreach position between the main trolley and the boom tip, scaled')] },
    (g) => catTrolley(g, P('catenaryWatersideX'), true));
  // Boom-tip catenary sheave at the catenary trolley sheave height so the rope runs stay level (U1-C66).
  const rCT = P('catenaryTipSheaveDia') / 2; const xCT = XTIP - 1.35, yCT = yCSC;
  S.position('reeving.sheave.catenary-boom-tip', { parentKey: TR_, sub: '021', classificationNote: 'Catenary rope sheaves: 021 proposed; Admin to confirm', category: 'component', label: 'Boom-tip catenary rope sheaves (2 sets, dia 500)', prov: 'drawing-derived', sources: [src('J526A2200', 2, 'J526A2201 sheave assembly, 2 per crane, 137.5 kg: sheave ZT2-013022 dia 500 / 550, bearings NJ2214EC x 2, shaft dia 70, support J526A220101, sheave cover; 1500 either side of the boom centreline, installed symmetrically; position along the tip scaled')] },
    (g) => { for (const s of [1, -1]) { g.add('steel', ...sheave([xCT, yCT, s * ZCAT], 'z', 2 * rCT, 0.15, 22)); g.add('paint', boxMinMax([xCT - 0.25, G_TOP + 0.3, s * ZCAT - 0.14], [xCT + 0.25, yCT, s * ZCAT - 0.1]), boxMinMax([xCT - 0.25, G_TOP + 0.3, s * ZCAT + 0.1], [xCT + 0.25, yCT, s * ZCAT + 0.14])); } });
  // Catenary rope tensioner (J526A2203, 2 per crane, 395 kg) at the girder tail (J526A2200 Detail A): support post on the girder
  // at the tail end, lever carrying two sheaves dia 500 and a tension cylinder (1123 closed, stroke 600). U1-C66: the rope from
  // the landside catenary trolley runs under both sheaves, turns over the landside one and ends at a rope clamp on a bracket.
  const rTN = 0.25, xTN = XTAIL + 1.6, yTN = yCatBot + RC_R + rTN, xTNL = xTN - 0.56; // waterside sheave, landside sheave
  const xTP = XTAIL + 0.5, yTP = G_TOP + 1.15; const xTA = xTN + 0.65; // support post, rope clamp bracket
  S.position('trolley.catenary.tensioner', { parentKey: BR, sub: '022', category: 'component', label: 'Catenary rope tensioners (2 sets, cylinder stroke 600)', prov: 'drawing-derived', sources: [src('J526A2200', 3, 'J526A2203 catenary trolley rope tensioner device, 2 per crane, 395 kg: support J526A220301, tension cylinder (item 2, stroke 600), sheave assembly ZT2-013022 dia 500, adjustable limit switch supports, limit switches B4 x 2; 1500 either side of the girder centreline'), src('J526A2200', 1, 'Detail A at the girder tail: 1294 (stroke 600), 1723, 749, initial position; position along the tail and rope end clamp simplified')] },
    (g) => {
      for (const s of [1, -1]) {
        const z = s * ZCAT;
        g.add('paint', boxMinMax([xTP - 0.12, G_TOP, z - 0.1], [xTP + 0.12, yTP + 0.1, z + 0.1])); // support post (J526A220301)
        for (const dz of [-0.1, 0.1]) g.add('paint', beam([xTP, yTP, z + dz], [xTN, yTN, z + dz], 0.1, 0.14)); // lever plates either side of the sheaves
        for (const x of [xTNL, xTN]) g.add('steel', ...sheave([x, yTN, z], 'z', 2 * rTN, 0.08, 18), cyl([x, yTN, z], 'z', 0.035, 0.22, 8)); // sheave pair
        g.add('steel', tube([xTP + 0.1, G_TOP + 0.35, z + 0.14], [xTP + 0.75, yTP - 0.05, z + 0.14], 0.065, 10)); // cylinder barrel
        g.add('hydraulic', tube([xTP + 0.75, yTP - 0.05, z + 0.14], [(xTP + xTN) / 2 + 0.2, (yTP + yTN) / 2 + 0.05, z + 0.14], 0.03, 8)); // rod to the lever
        g.add('paint', boxMinMax([xTA - 0.08, G_TOP, z - 0.08], [xTA + 0.08, yTN + rTN + RC_R + 0.06, z + 0.08])); // rope clamp bracket
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
        ...railing([XMAST - APL, yAP, -APZ], [XMAST - APL, yAP, APZ]), ...railing([XMAST - P('aFrameStairFromMast') + 0.9, yAP, APZ], [XMAST + APW, yAP, APZ], { step: 1.2 })); // U1-C76: opening on the +Z side at the stair head (stair moved beside the leg)
      // guard frame over the guide sheaves: posts and top rails, top = apex marker 83356
      const gx = [XMAST - P('apexGuardLandside'), XMAST + P('apexGuardWaterside')]; const gz = ZGS + 0.5;
      for (const x of gx) for (const z of [-gz, gz]) g.add('paint', boxMinMax([x - 0.07, yAP, z - 0.07], [x + 0.07, APEX, z + 0.07]));
      for (const z of [-gz, gz]) g.add('paint', boxMinMax([gx[0] - 0.07, APEX - 0.14, z - 0.07], [gx[1] + 0.07, APEX, z + 0.07]), boxMinMax([gx[0] - 0.05, yAP + 1.1, z - 0.05], [gx[1] + 0.05, yAP + 1.18, z + 0.05]));
      for (const x of gx) g.add('paint', boxMinMax([x - 0.07, APEX - 0.14, -gz], [x + 0.07, APEX, gz]));
      // U1-C76 floating-part sweep: the equalizer sheave stood free; bracket on the platform (shape estimated).
      for (const s of [1, -1]) g.add('paint', boxMinMax([XMAST - 0.34, yAP, s * 0.11 - 0.02], [XMAST - 0.06, yAP + 1.56, s * 0.11 + 0.02]));
      g.add('paint', cyl([XMAST - 0.2, yAP + 1.5, 0], 'z', 0.05, 0.3, 10));
    });
  // U1-C77: boom stowage device (safety latch) from J526A62: two hook levers 5750 apart, hook centre 2700 from the A-frame
  // centre and 850 above the latch platform, lever 1900 + 1300 with a balancing box. The platform elevation is not on that
  // sheet; it is scaled from the braced platform J526A00 draws on the A-frame (estimated). Replaces the apex placement.
  const LZ = P('boomLatchHookSpacing') / 2, LXH = XMAST + P('boomLatchFromPylon'), LYP = P('boomLatchPlatformElevation'), LYH = LYP + P('boomLatchHookAbovePlatform');
  const [LL1, LL2] = P('boomLatchLever'); const LXS = LXH - LL1, LXB = LXS - LL2;
  S.position('boom.latch.frame', { parentKey: A_, sub: '031', category: 'structural', label: 'Boom latch platform, supports and hook levers (boom stowage device)', prov: 'drawing-derived',
    sources: [src('J526A6200', 1, 'J526A62: hook spacing 5750, 2700 to the pylon centre, hook centre 850 above the platform, lever 1900 / 1300, balancing box 340 x 540; hook, support and thruster shapes simplified'), s00('side view: braced platform on the A-frame at about 62.2 m; elevation scaled, not printed')] },
    (g) => {
      const zLeg = ZL - (ZL - ZA) * (LYP - 0.35 - TOP_WS) / P('aFrameHeight');
      g.add('paint', boxMinMax([XMAST - 0.25, LYP - 0.6, -zLeg], [XMAST + 0.25, LYP - 0.1, zLeg])); // cross beam between the A-frame legs
      for (const s of [1, -1]) {
        const z = s * LZ;
        g.add('grating', boxMinMax([XMAST - 0.5, LYP - 0.1, z - 0.9], [LXH - 0.35, LYP, z + 0.9])); // latch platform
        g.add('paint', beam([LXH - 0.5, LYP - 0.15, z], [XMAST + 0.2, LYP - 1.6, z], 0.12, 0.16)); // knee brace
        g.add('paint', boxMinMax([XMAST + 0.1, LYP - 1.7, z - 0.1], [XMAST + 0.3, LYP - 0.6, z + 0.1]));
        g.add('paint', ...railing([XMAST - 0.5, LYP, z + s * 0.88], [LXH - 0.35, LYP, z + s * 0.88], { step: 1.2 }), ...railing([XMAST - 0.5, LYP, z - s * 0.88], [LXH - 0.35, LYP, z - s * 0.88], { step: 1.2 }));
        g.add('paint', boxMinMax([LXS - 0.2, LYP, z - 0.2], [LXS + 0.2, LYH - 0.1, z + 0.2])); // lever support (item 7)
        g.add('steel', beam([LXH + 0.25, LYH, z], [LXB, LYH, z], 0.12, 0.22), cyl([LXH, LYH, z], 'z', 0.0675, 0.5, 14), cyl([LXS, LYH, z], 'z', 0.07, 0.48, 14)); // lever with hook shaft dia 135 and pivot
        g.add('steel', boxMinMax([LXH + 0.15, LYH - 0.32, z - 0.06], [LXH + 0.4, LYH + 0.12, z + 0.06])); // hook nose
        g.add('machinery', boxMinMax([LXB - 0.17, LYH - 0.3, z - 0.27], [LXB + 0.17, LYH + 0.25, z + 0.27])); // balancing box 340 x 540
      }
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
  S.position('access.stair.a-frame', { parentKey: A_, sub: '151', category: 'structural', label: 'A-frame access stair', prov: 'estimated', sources: [s00('waterside end view: zig-zag stair beside A-frame leg A, flights along the rails; side view: stair about 0.7-2.2 m landside of the A-frame centreline (U1-C76)'), src('J526A5000', 1, 'View Q and item 2 platform of apex; flight count approximate; final flight to the apex platform added in U1 round 2')] },
    (g) => {
      // U1-C76 (D7): J526A00 draws the zig-zag in the waterside END view, so the flights run along the rails (Z) in two
      // lanes side by side just landside of A-frame leg A; the earlier flights ran along X and stood about 1.2 m too far
      // landside. Flight count unchanged; lane positions, run and the two tower posts are scaled estimates.
      const n = N('aFrameStairFlights'); const h = (AF_TOP - 1.4 - TOP_WS) / n;
      const xS = XMAST - P('aFrameStairFromMast'), zc = P('aFrameStairCentreZ'), hr = P('aFrameStairRunZ') / 2, lane = 0.42;
      for (let i = 0; i < n; i++) {
        const y0 = TOP_WS + i * h; const dir = i % 2 === 0 ? -1 : 1; const x = xS + (i % 2 === 0 ? lane : -lane);
        const f = stairFlight([x, y0 + 0.05, zc - hr * dir], [x, y0 + h, zc + hr * dir], 0.7);
        g.add('grating', ...f.grating); g.add('paint', ...f.paint);
        const zl = zc + hr * dir, ze = zl + 0.9 * dir; // landing across both lanes beyond the flight head
        g.add('grating', boxMinMax([xS - 0.9, y0 + h - 0.05, Math.min(zl, ze)], [xS + 0.85, y0 + h + 0.03, Math.max(zl, ze)]));
        g.add('paint', ...railing([xS - 0.9, y0 + h, ze], [xS + 0.85, y0 + h, ze], { step: 0.9, mid: false }));
      }
      const yTop = AF_TOP - 1.4;
      for (const z of [zc - hr - 0.45, zc + hr + 0.45]) g.add('paint', boxMinMax([xS - 1.02, TOP_WS, z - 0.06], [xS - 0.9, yTop + 1.0, z + 0.06])); // tower posts on the portal-top platform
      // final flight from the top landing to the +Z edge of the apex platform
      const ff = stairFlight([xS + lane, yTop + 0.05, zc + hr], [xS + lane, yAP, APZ], 0.7);
      g.add('grating', ...ff.grating); g.add('paint', ...ff.paint);
    });

  // ---------- machinery house (container; light enclosure) ----------
  const HX1 = P('machineryHouseSeasideWallX'); const HX0 = HX1 - P('machineryHouseDepthX');
  const HZC = P('machineryHouseCentreZ'); const HZ0 = HZC - P('machineryHouseLengthZ') / 2; const HZ1 = HZC + P('machineryHouseLengthZ') / 2;
  const FL = P('machineryHouseFloorElevation'); const WALL = FL + P('machineryHouseWallHeight');
  // U1-C76 (D1): the house contents were laid out with the main hoist reducer at Z = +0.85; J526A3000 puts it on the crane
  // centreline. HDZ moves the remaining absolute Z values (service crane, hatch, workbook parts) with the hoist datum.
  const HDZ = P('mainHoistDriveZ') - 0.85;
  const HDX = P('machineryHouseSeasideWallX') + 31.6; // U1-C77 (D10): absolute X values in the house were laid out with the seaside wall at -31.6
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
    g.add('cabFrame', boxMinMax([HDX - 34.75, FL, HZ1 - 0.02], [HDX - 33.85, FL + 2.1, HZ1 + 0.03]), boxMinMax([HX0 - 0.03, FL, HZC - 5.6], [HX0 + 0.02, FL + 2.1, HZC - 4.7]));
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
      // U1-C66: frame cross-members only outboard of the trolley rails, so the rails and the rope runs under the house stay clear
      for (const x of [HX0, (HX0 + HX1) / 2, HX1]) g.add('paint', boxMinMax([x - 0.3, G_TOP, HZ0], [x + 0.3, FL - 0.15, -ZG - 0.15]), boxMinMax([x - 0.3, G_TOP, ZG + 0.15], [x + 0.3, FL - 0.15, HZ1]));
      g.add('grating', boxMinMax([HX0 - 1.2, FL - 0.15, HZ0 - 1.3], [HX1 + 1.0, FL, HZ1 + 0.3]));
      // U1-C66: rope openings in the end-walkway handrails where the hoist and trolley ropes leave the house
      const ropeGaps = { [HX0 - 1.15]: [[-3.0, -2.2], [-1.25, -0.65], [0.65, 1.25], [2.2, 3.0]], [HX1 + 0.95]: [[-1.25, -0.65], [0.65, 1.25]] };
      for (const x of [HX0 - 1.15, HX1 + 0.95]) {
        let z0 = HZ0 - 1.3;
        for (const [a, b] of [...ropeGaps[x], [HZ1 + 0.3, HZ1 + 0.3]]) { if (a - z0 > 0.3) g.add('paint', ...railing([x, FL, z0], [x, FL, a], { step: 2.0 })); z0 = b; }
      }
      g.add('paint', ...railing([HX0 - 1.2, FL, HZ0 - 1.25], [HX1 + 1.0, FL, HZ0 - 1.25], { step: 2.0 }), ...railing([HX0 - 1.2, FL, HZ1 + 0.25], [HX1 + 1.0, FL, HZ1 + 0.25], { step: 2.0 }));
      // service-crane floor hatch frame (J526A3000: service area 3575 x 2000 next to the main transformer)
      const [hz, hx] = P('serviceHatch'); const hcz = HDZ + 7.5, hcx = HDX - 36.3; // U1-C76: follows the hoist datum
      g.add('paint', boxMinMax([hcx - hx / 2 - 0.08, FL, hcz - hz / 2 - 0.08], [hcx + hx / 2 + 0.08, FL + 0.06, hcz - hz / 2]), boxMinMax([hcx - hx / 2 - 0.08, FL, hcz + hz / 2], [hcx + hx / 2 + 0.08, FL + 0.06, hcz + hz / 2 + 0.08]),
        boxMinMax([hcx - hx / 2 - 0.08, FL, hcz - hz / 2], [hcx - hx / 2, FL + 0.06, hcz + hz / 2]), boxMinMax([hcx + hx / 2, FL, hcz - hz / 2], [hcx + hx / 2 + 0.08, FL + 0.06, hcz + hz / 2]));
    });
  S.position('machinery-house.service-crane', { parentKey: MH, sub: '151', category: 'component', label: 'Machinery-house service crane (10 t)', modes: ['technical'], prov: 'approximate-location', sources: [src('J526A3000', 1, 'service crane area and runway'), src('J526A1600', 1, 'main data list: 10 t, 6/12 m/min, 57.5 m lift; span 9740, runway 16000; 7509 kg; runway and bridge shapes simplified (U1-C65)')] },
    (g) => {
      for (const x of [HX0 + 0.5, HX1 - 0.5]) g.add('machinery', boxMinMax([x - 0.15, WALL - 0.75, HZ0 + 0.3], [x + 0.15, WALL - 0.45, HZ1 - 0.3]));
      g.add('machinery', boxMinMax([HX0 + 0.5, WALL - 1.05, HDZ + 7.3], [HX1 - 0.5, WALL - 0.75, HDZ + 7.7]), boxMinMax([HDX - 36.7, WALL - 1.6, HDZ + 7.1], [HDX - 35.9, WALL - 1.05, HDZ + 7.9]));
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
    g.add('brake', boxMinMax([c[0] + 0.1, c[1] + r + 0.03, c[2] - 0.05], [c[0] + r * 0.8 + 0.05, c[1] + r + 0.12, c[2] + 0.05])); // U1-C76: lever arm from the caliper to the thruster (the thruster stood free)
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
  S.hotspot('emergency.drive.main', { parentKey: MH, sub: '161', point: [HXD + 0.8, FL + 2.6, HZ], radius: 0.5, label: 'Emergency hoist drive (37 kW motor and FH220 reducer; position approximate)', sources: [src('J526A0300', 1, 'emergency mechanism data: 37 kW, FH220 reducer'), src('J526A1400', 1, 'emergency device main data: 37 kW, 1480 rpm, ratio 30.852; main hoist chain 17/35, 2.35 m/min at 65 t; boom hoist chain 17/25, 76.47 min; stored on top of the main hoist / boom hoist reducer when not in use (U1-C65)')] },
    (g) => {
      g.add('machinery', boxMinMax([HXD + 0.05, FL + 2.0, HZ - 0.38], [HXD + 1.85, FL + 2.1, HZ + 0.38])); // mounting frame on the reducer casing
      reducer(g, [HXD + 0.15, FL + 2.1, HZ - 0.28], [HXD + 0.85, FL + 2.75, HZ + 0.28]);
      g.add('machinery', cyl([HXD + 1.35, FL + 2.38, HZ], 'x', 0.24, 0.85, 16), cyl([HXD + 1.86, FL + 2.38, HZ], 'x', 0.21, 0.18, 16), box([HXD + 1.35, FL + 2.66, HZ], [0.26, 0.12, 0.22]));
      g.add('machinery', cyl([HXD + 0.9, FL + 2.38, HZ], 'x', 0.06, 0.12, 8)); // coupling
    });
  // U1-C65: wire rope re-reeving device (J526A1500; manual ch. 1.6.3 "mounted over the main hoist"): two driving re-reeving
  // machines WRR04A-J526A (take-up / feed reels with motor 5.5 kW and reducer i = 187) on supports J526A1501 either side of the
  // main hoist; reel size and height approximate.
  S.position('auxiliary.rope-reeving.machinery-house', { parentKey: MH, sub: '151', classificationNote: 'Rope re-reeving device (maintenance equipment): 151 auxiliary equipment proposed; Admin to confirm', category: 'component', modes: TECH, label: 'Wire rope re-reeving device (2 driving reels, 5.5 kW)', prov: 'approximate-location', sources: [src('J526A1500', 1, 'rope re-reeving system 4930 kg: driving re-reeving machines WRR04A-J526A x 2 (2020.8 kg), guide sheaves WRRA02 x 2, re-reeving rollers WRRA01a x 4, platform J526A1502, supports J526A1501; main data motor 5.5 kW 1500 rpm, reducer XWEJC5.5-8190B-187 (i = 187), drum 8.02 rpm; supports 3992 either side of the centreline; reels drawn above the main hoist, size and height approximate')] },
    (g) => {
      const rR = P('reReevingDrumDia') / 2; const x = HXD - 1.15; const y = FL + 3.1; // between the drums and the landside wall, above the drums
      for (const s of [1, -1]) {
        const z = HZ + s * (P('reReevingSpacingZ') / 2 + 0.1);
        g.add('drum', cyl([x, y, z], 'z', rR, 0.9, 22), cyl([x, y, z - 0.47], 'z', rR + 0.08, 0.04, 22), cyl([x, y, z + 0.47], 'z', rR + 0.08, 0.04, 22));
        g.add('rope', cyl([x, y, z], 'z', rR + 0.03, 0.6, 22));
        g.add('machinery', boxMinMax([x - 0.25, y - 0.3, z + s * 0.55 - 0.2], [x + 0.25, y + 0.3, z + s * 0.55 + 0.2]), cyl([x, y, z + s * 0.95], 'z', 0.18, 0.4, 14)); // reducer and 5.5 kW motor
        for (const dz of [-0.5, 0.5]) for (const [xa, xb] of [[x - rR - 0.12, x - rR], [x + rR, x + rR + 0.12]]) g.add('machinery', boxMinMax([xa, y - 0.15, z + dz - 0.06], [xb, WALL - 0.05, z + dz + 0.06])); // U1-C66: hangers from the wall and roof (J526A1501 supports), clear of the drum ropes below
        g.add('machinery', boxMinMax([x - rR - 0.15, y - 0.25, z - 0.55], [x + rR + 0.15, y - 0.15, z + 0.55])); // platform frame
      }
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
      g.add('cabinet', boxMinMax([HDX - 40.9, FL, HZ0 + 0.55], [HDX - 33.4, FL + 2.2, HZ0 + 1.15]), boxMinMax([HDX - 40.5, FL, ER - 1.0], [HDX - 33.6, FL + 2.2, ER - 0.4]));
      for (let x = HDX - 40.4; x < HDX - 33.5; x += 0.8) g.add('cabFrame', boxMinMax([x - 0.015, FL + 0.1, HZ0 + 1.15], [x + 0.015, FL + 2.1, HZ0 + 1.17]), boxMinMax([x - 0.015, FL + 0.1, ER - 1.02], [x + 0.015, FL + 2.1, ER - 1.0])); // cabinet door joints
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
  S.hotspot('electrical.drives.main', { parentKey: ERH, sub: '071', point: [HDX - 37.0, FL + 1.1, ER - 0.7], radius: 0.5, label: 'Drive / inverter cabinets (cabinet section shown; which bays not established)', sources: [src('J526A3000', 1, 'cabinet row (71x labels); identities not established (U-11)')] },
    (g) => cabinetBays(g, HDX - 38.22, HDX - 35.78, ER - 1.02, ER - 0.38, -1));
  S.hotspot('electrical.plc.main', { parentKey: ERH, sub: '081', point: [HDX - 35.0, FL + 1.1, HZ0 + 0.85], radius: 0.5, label: 'PLC cabinet (cabinet bay shown; which bay not established)', sources: [src('J526A3000', 1, 'electrical room; exact cabinet not established (U-11)')] },
    (g) => cabinetBays(g, HDX - 35.42, HDX - 34.58, HZ0 + 0.53, HZ0 + 1.17, 1));
  S.hotspot('electrical.control-power.main', { parentKey: ERH, sub: '051', point: [HDX - 39.4, FL + 1.1, HZ0 + 0.85], radius: 0.5, label: 'Control power cabinet (cabinet bay shown; which bay not established)', sources: [src('J526A3000', 1, 'electrical room; exact cabinet not established (U-11)')] },
    (g) => cabinetBays(g, HDX - 39.82, HDX - 38.98, HZ0 + 0.53, HZ0 + 1.17, 1));
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
          const xm = x0 === XBL ? XF0 : XF1; g.add('steel', boxMinMax([xm - 0.06, RT + 0.27, Math.min(zb, s * (ZH - PS))], [xm + 0.06, RT + 0.43, Math.max(zb, s * (ZH - PS))])); // U1-C76: buffer bracket on the side-frame plate (the buffer stood free)
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
      // U1-C66: posts carrying the catenary rope end clamps at both trolley ends, on the catenary rope lanes
      for (const x of [XF0, XF1]) for (const z of [-ZCAT, ZCAT]) g.add('paint', boxMinMax([x - 0.08, RT + 0.05, z - 0.07], [x + 0.08, yCatTop - 0.055, z + 0.07]));
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
        for (const x of [XT - SO, XT + SO]) {
          // C72: the eight individually keyed sheaves own these rims; this assembly retains shafts/housings.
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
    // U1-C65: drum re-read from the Cavotec reel manual (SC-121216-ME2a): vertical monospiral VM922-38G, inner dia 900, outer
    // dia 2200, 38 compartment width, so the reel is a narrow wheel; drive module T5.1 with two 5.5 kW motors beside it.
    S.position('trolley.spreader-cable-reel', { parentKey: T_, sub: '014', category: 'component', label: 'Spreader cable reel (Cavotec T5.1, monospiral dia 2200) and drive', prov: 'approximate-location', sources: [...trSrc('item 11 spreader cable reel arrangement (1245 kg), hidden outline in the centre body of the side view; position scaled'), src('Cavotec SC-121216-ME2a', 1, 'reel T5.1.NCC(2x5kW).4 VM922-38G KV26/4S/FC/R + BD5000N: drum inner dia 900, outer dia 2200, width 38; 2 x 5.5 kW; drive module and motor layout simplified'), src('J526A1200', 1, 'item 7 cable attachment on the headblock')] },
      (g) => {
        g.add('drum', cyl([xR, yR, 0], 'z', 0.45, 0.1, 24)); // monospiral core, inner dia 900
        for (const z of [-0.05, 0.05]) g.add('drum', cyl([xR, yR, z], 'z', rR, 0.02, 32)); // full-wheel flanges, outer dia 2200
        g.add('drum', cyl([xR, yR, 0], 'z', 0.07, 1.2, 10)); // axle
        g.add('machinery', box([xR, yR, -0.72], [0.45, 0.45, 0.24]), cyl([xR, yR, -1.0], 'z', 0.17, 0.32, 14)); // reducer and motor
        // C72: the existing wound/hanging cable is owned by trolley.spreader-cable below (no duplicate disc).
      });
  }
  // U1-C74: drawing-grounded cab envelope/interior; existing display pose and semantic keys retained.
  const CX1 = XT - P('cabinOffsetLandside'), CX0 = CX1 - P('cabinLengthX'), CW = P('cabinWidthZ') / 2;
  const CY0 = P('cabinFloorElevation'), CY1 = CY0 + P('cabinBodyHeight');
  const CAB = cabinModel({kit, THREE, P, x0:CX0, y0:CY0, halfWidth:CW, hangerEnd:XB0, hangerY:G_BOT+.05, railY:RT});
  const cabSrc = [src('User correction 2026-11-09',null,'C75: cabin entrance and home boarding interface are on the elevator (-Z) side; supersedes C74 side interpretation.'),src('J526A3100', 1, 'U1-C74: plan 3000 x 2200; C-C 2400 internal height and rear cabinets; B-B 2673 mounting top, 2100 x 1940 mounting pitch; A-A sloping front/floor glazing; 900 rear and 850 side walkway. Sections, instruments and seat profile simplified.'), src('J526A0200', 1, 'cab 2500 landside of hoist centre; existing display pose retained'), src('J526A00', 1, 'cab floor about 47.8 m at outreach display pose, estimated')];
  S.position('cabin.operator.main', { parentKey:T_, sub:'141', category:'component', label:'Operator cabin', prov:'drawing-derived', sources:cabSrc }, CAB.shell);
  // U1-C73 / D-223: user confirms the busbar is under the boom and the power/communication
  // slipring connection is carried by the cabin. Replaces the unrelated three-carriage festoon sample.
  // J526A4100 is listed but its detail sheet is absent: section, side offset, end stations and bracket sizes are estimates.
  const busX0 = XHINGE + P('busbarStartFromHinge'), busX1 = XTIP - P('busbarEndInset');
  const busY = G_BOT - P('busbarDrop'), busZ = ZG; // C74: opposite (+Z) boom girder, explicitly requested by user
  const contactX = CX0 + P('busbarCabConnectionFromRear'), contactY = CY1 - P('busbarCabConnectionBelowRoof');
  const contactZ = CW + .12;
  S.hotspot('trolley.cable-system.main', { parentKey: TR_, sub: '023', modes: ['overall', 'technical'],
    point: [contactX, contactY, contactZ], radius: .7,
    label: 'Boom busbar and cabin power / communication slipring connection',
    qualifier: 'Arrangement confirmed by user; opposite girder side confirmed; dimensions and mounting details approximate',
    sources: [src('User confirmation 2026-11-09', null, 'Busbar runs under the boom; power and communication slipring connection is with the cabin. Supersedes the generic festoon representation. C74: user requests the opposite (+Z) boom girder; connection mirrored with the busbar.'),
      src('J526A00', 2, 'item 22 J526A4100 slip contact system; detail sheet not supplied (U-10)'),
      src('ZPMC mechanical manual chapter 1', 29, 'section 1.5.3, Figure 1-48: power/control cable carrying system travelling with the trolley; figure does not establish the model dimensions')] },
    (g) => {
      // Continuous protected busbar channel beneath the straight boom girder. One indicative contact strip;
      // this is not a claim about the actual electrical conductor count or vendor section.
      g.add('lamp', boxMinMax([busX0, busY + .07, busZ - .14], [busX1, busY + .12, busZ + .14]));
      for (const dz of [-.12, .12]) g.add('lamp', boxMinMax([busX0, busY - .11, busZ + dz - .025], [busX1, busY + .09, busZ + dz + .025]));
      g.add('steel', boxMinMax([busX0, busY - .045, busZ - .06], [busX1, busY, busZ + .06]));
      for (let x = busX0; x <= busX1; x += P('busbarSupportPitch')) g.add('lamp', box([x, (G_BOT + busY + .12) / 2, busZ], [.09, G_BOT - busY - .12, .20]));
      g.add('lamp', box([busX1, (G_BOT + busY + .12) / 2, busZ], [.09, G_BOT - busY - .12, .20]));
      // Cabin-mounted connection box and braced carrier arm; contact shoe meets the channel slot above it.
      g.add('lamp', box([contactX, contactY, contactZ], [.42, .48, .28]));
      g.add('steel', beam([contactX, contactY, contactZ], [contactX, contactY, busZ], .07, .09),
        beam([contactX, contactY - .42, CW + .02], [contactX, contactY, busZ - .12], .05, .06));
      g.add('lamp', box([contactX, busY - .15, busZ], [.50, .22, .18]));
      g.add('steel', tube([contactX, contactY, busZ], [contactX, busY - .15, busZ], .045, 12)); // shoe stem to carrier arm
      g.add('steel', box([contactX, busY - .045, busZ], [.36, .07, .09]));
      // Two schematic short leads represent power and communication, attached at both ends; no hanging festoon loops.
      for (const dx of [-.10, .10]) g.add('lamp', tube([contactX + dx, busY - .24, busZ - .05], [contactX + dx, contactY - .14, contactZ + .16], .018, 8),
        tube([contactX + dx, contactY - .14, contactZ + .16], [contactX + dx, contactY, contactZ], .018, 8));
    });
  S.position('cabin.operator.seat', {parentKey:T_,sub:'141',category:'component',label:'Operator seat with suspension, headrest and footrest',prov:'drawing-derived',sources:[src('J526A3100',1,'U1-C74: item 10 chair installation, A-A/B-B and plan; faces front/floor windows. Cushion and suspension profiles scaled, not vendor fabrication geometry.')]}, CAB.seat);
  S.position('cabin.operator.consoles', {parentKey:T_,sub:'141',category:'component',label:'Twin joystick consoles, rear control cabinets and auxiliary panel',prov:'drawing-derived',sources:[src('J526A3100',1,'U1-C74: plan twin seat consoles; C-C 600 x 1800 reel panel and 1400 x 2000 CAB/spreader panel, 400/405 depth; B-B auxiliary station. Controls and screen faces illustrative, not live status.')]}, CAB.consoles);
  // U1 round 2 (U1-C16): the cab A/C box (P03 had it inside the cab node plus a ball marker) is now the 152 part itself.
  S.hotspot('cabin.air-conditioning', { parentKey: T_, sub: '152', modes: ['overall', 'technical'], point: [CX0 - P('cabWalkwayWidth') / 2 - 0.05, CY0 + 0.31, 0.65], radius: 0.4, label: 'Cabin air conditioning unit (location from the plan, size approximate)', sources: [src('J526A3100', 1, 'A/C unit beside the cab on the walkway side (plan); exact unit not detailed'), src('J526A0200', 1, 'A/C unit beside the cabin in plan')] },
    (g) => {
      const WX0 = CX0 - P('cabWalkwayWidth');
      g.add('acUnit', boxMinMax([WX0 + 0.25, CY0, 0.25], [CX0 - 0.1, CY0 + 0.62, 1.05]));
      g.add('steel', cyl([(WX0 + CX0) / 2 + 0.07, CY0 + 0.63, 0.65], 'y', 0.2, 0.03, 16)); // condenser fan grille
      for (let k = 0; k < 5; k++) g.add('steel', boxMinMax([WX0 + 0.27, CY0 + 0.1 + k * 0.09, 1.05], [CX0 - 0.12, CY0 + 0.12 + k * 0.09, 1.07])); // side louvres
    });
  // U1 round 2 (U1-C16): the trim/list/skew hydraulic power unit is drawn as a tank, motor-pump and accumulators on the
  // tail platform beside the anti-snag/TLS device (J526A1000 does not locate the power unit: position approximate).
  S.hotspot('trolley.skew-system.main', { parentKey: BR, sub: '111', modes: ['overall', 'technical'], point: [XTAIL + 3.5, G_TOP + 0.6, -0.45], radius: 0.45, label: 'Trim/list/skew hydraulic power unit (position approximate; J526A1000 device at the girder tail)', sources: [src('J526A1000', 1, 'anti-snag and L/S/T device at the girder tail (GA item 7); cylinders 200/140 x 1400; hydraulic power unit not located')] },
    (g) => {
      const x0 = XTAIL + 2.8, x1 = XTAIL + 4.2, z0 = -0.85, z1 = -0.05; // U1-C66: between the centreline and the trolley-rope lane, clear of the catenary rope lane
      g.add('lamp', boxMinMax([x0, G_TOP, z0], [x1, G_TOP + 0.75, z1])); // oil tank
      g.add('lamp', cyl([x0 + 1.12, G_TOP + 0.98, (z0 + z1) / 2], 'x', 0.13, 0.35, 12)); // pump; C71 motor and coupling are individually selectable below
      for (const x of [x1 - 0.35, x1 - 0.15]) g.add('steel', cyl([x, G_TOP + 1.1, z1 - 0.2], 'y', 0.09, 0.7, 12)); // accumulators
      for(const z of TLS.zs) g.add('steel', tube([x1,G_TOP+.45,(z0+z1)/2],[TLS.anchor[0]+.35,TLS.datum+.1,z],.018,6)); // simplified lines to the four TLS supports
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
  S.hotspot('trolley.tension.main', { parentKey: BR, sub: '022', modes: ['overall', 'technical'], point: [xTT, yTT, 0], radius: 0.45, label: 'Trolley rope tensioning cylinders (position approximate; tensioners at the girder-tail end)', sources: [s00('trolley rope reeving diagram: tensioners at the tail end'), src('J526A2100', 3, 'J526A2103 tension device, 2 per crane, 937.3 kg each: cylinder dia 140 / rod 100 / stroke 600, working 25 MPa, test 37.5 MPa; limit switches XCKJ10541H29C x 2; 1050 to the girder centreline; cylinder layout still simplified (U1-C65)')] },
    (g) => {
      for (const s of [1, -1]) {
        const z = s * (P('trolleyRopeLaneZ') + 0.17); // U1 round 3: on the trolley rope lanes (J526A2100 C-C); U1-C66: beside the sheave, not through it
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
          // C72: the four individually keyed headblock sheaves own these rims; shafts remain here.
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
      g.add('machinery', boxMinMax([XT - 0.46, yb0 + 0.05, -1.7], [XT + 0.46, yb1 + 0.1, -0.6])); // electrical box (U1-C76: widened 80 mm each side to sit on the main beams)
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
  // U1-C66 rope paths: every free run is a straight line tangent to the sheaves it joins and every wrap is an arc of the
  // sheave's rope-centre radius (no chords across sheaves, no rope through structure). Ropes leave the house through the
  // end-wall openings above the floor and return under the house floor.
  const ropeExitY = FL + 0.25; // rope openings in the house end walls, above the walkway gratings
  S.position('hoist.rope.set.main', { sub: '015', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Main hoist rope set (4 ropes, 8 falls; path simplified away from the trolley)', prov: 'estimated', sources: [s00('main hoist rope reeving diagram: 4 ropes from 2 drums over the girder-tail sheaves, trolley and headblock to the boom tip'), src('J526A0200', 1, 'main hoist rope reeving sketch and side view: each rope loops once between a trolley shaft (2 sheaves) and one headblock sheave'), src('J526A0300', 1, 'IWRC 6xWS(36) dia 31.5'), src('J526A1000', 1, 'tail sheaves on the anti-snag levers, one per rope (U1-C66)'), src('J526A2000', null, 'boom-tip anchors (Detail I); path simplified')] },
    (g) => {
      const rr = rTG + RT2; const rh = P('headblockSheaveDia') / 2 - 0.05 + RT2; const yTop = yTSh + rr;
      const tX = XTIP - 0.9, tY = G_TOP + 0.6, tR = 0.6; // boom-tip hoist sheaves (rope centre on the sheave rim)
      for (const s of [1, -1]) {
        const zr = s * ZR; const zD = HZ + s * (DSPAN - DL / 2);
        // [tail offset (tail sheave index), shaft x, lanes (in, out), headblock sheave x]
        for (const [dzT, iT, xs, lanes, xh] of [[-0.15, 1, XT - SO, LANE_LS, XT - HSP], [0.15, 0, XT + SO, LANE_WS, XT + HSP]]) {
          const zT = zr + s * dzT; const zIn = s * (ZH + lanes[0]); const zOut = s * (ZH + lanes[1]);
          // drum -> end-wall opening -> over the top of its own tail sheave, around the landside half -> under the house to the trolley
          const xS = xTS[iT]; const pE = [HX0 - 0.4, ropeExitY];
          const aIn = tanFrom(pE[0], pE[1], xS, yTS, rTS, 1), aOut = tanFrom(xs, yTop, xS, yTS, rTS, -1) + 2 * Math.PI;
          // C71: preserve both original free runs outside the back reach. Splice only at XTAIL + 7 m;
          // do not move the machinery-house exits, trolley, headblock or boom reeving.
          const oldIn=onC(xS,yTS,rTS,aIn,zT), oldOut=onC(xS,yTS,rTS,aOut,zT), cut=XTAIL+7;
          const cutAt=(a,b)=>{const t=(cut-a[0])/(b[0]-a[0]);return a.map((v,i)=>v+t*(b[i]-v));};
          const enter=cutAt([pE[0],pE[1],zT],oldIn), leave=cutAt(oldOut,[xs,yTop,zIn]);
          const zNew=s*(P('tlsPairCentreZ')+(dzT>0?1:-1)*P('tlsPairSpacing')/2);
          const [sx,sy]=TLS.sheave, ai=tanFrom(enter[0],enter[1],sx,sy,rTS,1), ao=tanFrom(leave[0],leave[1],sx,sy,rTS,-1)+2*Math.PI;
          poly(g, [[HXD - 0.3, yDrum - 0.55, zD + s * dzT * 4], [pE[0], pE[1], zT], enter,
            ...ARC(sx,sy,rTS,ai,ao,zNew,14),leave,[xs,yTop,zIn]]);
          // over trolley sheave 1, around the headblock sheave, over trolley sheave 2 (unchanged from U1 round 3)
          const down = arcPts(xs, yTSh, rr, Math.PI / 2, 0, zIn, zIn, 6);
          const hbIn = [xh + rh, yHS, zr], hbOut = [xh - rh, yHS, zr];
          const under = arcPts(xh, yHS, rh, 0, -Math.PI, zr, zr, 10);
          const up = arcPts(xs, yTSh, rr, Math.PI, Math.PI / 2, zOut, zOut, 6);
          poly(g, [...down, hbIn], RT2); poly(g, under, RT2); poly(g, [hbOut, ...up], RT2);
          // out to its boom-tip sheave: tangent onto the top, around the seaside quarter to the equalising cross-over
          const zTip = zr + s * dzT; const aT = tanFrom(xs, yTop, tX, tY, tR, -1);
          poly(g, [[xs, yTop, zOut], ...ARC(tX, tY, tR, aT, 0, zTip, 8)]);
        }
      }
      for (const dz of [-0.15, 0.15]) g.add('rope', tube([XTIP - 0.3, G_TOP + 0.6, -ZR + dz], [XTIP - 0.3, G_TOP + 0.6, ZR + dz], R, 6)); // equalising cross-over at the tip (simplified)
    });
  S.position('trolley.rope.set.main', { sub: '024', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Trolley rope set (2 ropes; path simplified away from the trolley)', prov: 'estimated', sources: [s00('trolley rope reeving diagram: drum to the boom-tip and girder-tail sheaves, back to both ends of the trolley'), src('J526A2100', 1, 'ropes B1 (landside) and B2 (waterside) dia 25; sheave unit and tension device 1050 either side of the boom centreline'), src('J526A0200', 1, 'equalizer sheaves at both trolley ends (E-E); trolley rope about 310 above the rail (scaled)'), src('J526A0400', 1, 'rope dia 25')] },
    (g) => {
      const rTp = P('trolleyTipSheaveDia') / 2, rTip = rTp - 0.04 + RT2; const tipX = XTIP - 0.9, tipY = yTR + rTip; // sheave bottom = return-run height
      const rE = P('trolleyEqualizerSheaveDia') / 2 - 0.045 + 0.025;
      const zP = P('trolleyRopePassingLaneZ'); const rT = 0.035; // passing run 950 from the centreline (over the trolley), return run 1050
      // passing run: house opening -> lane change over the last 3 m -> tangent onto the sheave top -> half wrap -> level return run
      const run = (pE, cx, cy, r, sign, aEnd, xEq, z, zp) => {
        const a0 = tanFrom(pE[0], pE[1], cx, cy, r, sign); const t = onC(cx, cy, r, a0, z);
        const k = 3 / Math.hypot(t[0] - pE[0], t[1] - pE[1]); const m = [t[0] + (pE[0] - t[0]) * k, t[1] + (pE[1] - t[1]) * k, zp];
        return [[pE[0], pE[1], zp], m, ...ARC(cx, cy, r, a0, aEnd, z, 14), [xEq, yTR, z]];
      };
      for (const t of [1, -1]) {
        const z = t * ZTR;
        poly(g, [[TXD + 0.3, yT - 0.4, TDZ + 0.9], ...run([HX1 + 0.4, ropeExitY], tipX, tipY, rTip, -1, -Math.PI / 2, XEQ_W, z, t * zP)], rT);
        poly(g, [[TXD - 0.3, yT - 0.4, TDZ - 0.9], ...run([HX0 - 0.4, ropeExitY], xTT, yTT, rTT, 1, 1.5 * Math.PI, XEQ_L, z, t * zP)], rT);
      }
      // U-turns around the equalizer sheaves: landside end on their +X (inboard) side, waterside end on their -X side
      for (const [xe, dir] of [[XEQ_L, 1], [XEQ_W, -1]]) {
        const pts = [];
        for (let k = 0; k <= 6; k++) { const th = (Math.PI / 2) * (k / 6); pts.push([xe + dir * rE * Math.sin(th), yTR, ZEQ + rE * Math.cos(th)]); }
        for (let k = 0; k <= 6; k++) { const th = Math.PI / 2 + (Math.PI / 2) * (k / 6); pts.push([xe + dir * rE * Math.sin(th), yTR, -ZEQ + rE * Math.cos(th)]); }
        poly(g, pts, RT2); // starts at (xe, +1050) where the incoming run ends, ends at (xe, -1050)
      }
    });
  // U1-C65 / U1-C66: catenary trolley ropes (J526A2200 p1 reeving sketch; J526A1500 names a catenary tow rope and a hold-back
  // rope). Landside lane: rope clamp at the tail -> over both tensioner sheaves, around the landside one -> under the house ->
  // around the seaside half of the landside catenary trolley sheave -> main trolley landside end. Seaside lane: main trolley
  // seaside end -> over the seaside catenary trolley sheave -> around the boom-tip sheave -> back to a clamp on the seaside
  // catenary trolley. The multi-part reeving (ropes B1-B8) is simplified to these runs, 1500 either side of the centreline.
  S.position('trolley.catenary-rope.set.main', { sub: '024', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Catenary trolley rope set (2 lanes; path simplified)', prov: 'estimated', sources: [src('J526A2200', 1, 'catenary trolley reeving system sketch (ropes B1-B8 between the catenary trolleys, the main trolley, the boom-tip sheaves and the tail tensioners); runs simplified'), src('J526A2200', 2, 'J526A2201 boom-tip sheaves 1500 from the centreline'), src('J526A2200', 3, 'J526A2203 tail tensioners 1500 from the centreline'), src('J526A1500', 1, 'catenary tow rope and catenary hold back rope')] },
    (g) => {
      const xL = P('catenaryLandsideX'), xW = P('catenaryWatersideX'); const rc = rCS + RC_R, rn = rTN + RC_R, rt = rCT + RC_R;
      const clamp = (x, y, z) => g.add('rope', box([x, y, z], [0.24, 0.11, 0.11]));
      for (const s of [1, -1]) {
        const z = s * ZCAT;
        poly(g, [[xTA, yTN + rn, z], [xTN, yTN + rn, z], ...ARC(xTNL, yTN, rn, Math.PI / 2, 1.5 * Math.PI, z, 12), [xTN, yCatBot, z], ...ARC(xL, yCSC, rc, -Math.PI / 2, Math.PI / 2, z, 14), [XF0, yCatTop, z]], RC_R);
        poly(g, [[XF1, yCatTop, z], [xW, yCatTop, z], ...ARC(xCT, yCT, rt, Math.PI / 2, -Math.PI / 2, z, 14), [xW + 0.45, yCatBot, z]], RC_R);
        clamp(xTA, yTN + rn, z); clamp(XF0, yCatTop, z); clamp(XF1, yCatTop, z); clamp(xW + 0.45, yCatBot, z);
      }
    });
  // U1 round 2 (U1-C14): boom hoist reeving re-read from J526A2300 p1. Drum -> guide sheave on the apex platform ->
  // fall-sheave groups under the apex cantilever -> falls to TWO boom sheave blocks: B-B at Z2 (28000 from the
  // waterside rail, sheave 1350 above the girder top, 1425 from the boom centreline) and C-C at Z3 (62500, 1200,
  // 1690). Fall counts per side (4 inner, 3 outer) follow the View A sheave groups; paths simplified.
  // U1-C66: the drum rope is tangent to the guide sheave and wraps over it, the run to each fall group is the common tangent
  // of the two sheaves, and every fall is tangent to its apex and boom-block sheaves (alternate falls on the two sides).
  const yBI = G_TOP + P('forestayInnerBracket'), yBO = G_TOP + P('forestayOuterBracket'); const zBI = P('boomBlockInnerZ'), zBO = P('boomBlockOuterZ');
  S.position('boom.rope.set.main', { sub: '033', positionKind: 'quantityLot', uom: 'rope', category: 'ropeSet', label: 'Boom hoist rope set (simplified path)', prov: 'estimated', sources: [src('J526A2300', 1, 'drum -> apex guide sheave -> falls between the apex sheave groups and the boom blocks at B-B (Z2) and C-C (Z3); falls per side simplified to 4 + 3'), s00('boom hoist rope reeving diagram'), src('J526A0500', 1, 'rope dia 35.5')] },
    (g) => {
      const rB = P('boomBlockSheaveDia') / 2;
      for (const s of [1, -1]) {
        const zg = s * ZGS; const pD = [BXD, yB + 0.77, BDZ + s * 1.7];
        const a0 = tanFrom(pD[0], pD[1], xGS, yGS, rGS, -1);
        const nGF = [1, -1].map((sg) => tanOuter(xGS, yGS, rGS, xFG, yFG, rFG, sg)).find((n) => Math.cos(n) > 0); // seaside common tangent
        let aEnd = nGF; while (aEnd > a0) aEnd -= 2 * Math.PI;
        poly(g, [pD, ...ARC(xGS, yGS, rGS, a0, aEnd, zg, 14)]);
        const last = onC(xGS, yGS, rGS, nGF, zg);
        for (const zf of [s * ZFI, s * ZFO]) poly(g, [last, onC(xFG, yFG, rFG, nGF, zf)]);
        for (const [x, y, zb, zfg, nF] of [[XZ2, yBI, zBI, ZFI, 4], [XZ3, yBO, zBO, ZFO, 3]]) {
          const u = Math.atan2(y - yFG, x - xFG);
          for (let k = 0; k < nF; k++) {
            const dz = (k - (nF - 1) / 2) * 0.17; const n = u + (k % 2 ? -1 : 1) * Math.PI / 2;
            g.add('rope', tube(onC(xFG, yFG, rFG, n, s * zfg + dz), onC(x, y, rB, n, s * zb + dz), R * 0.9, 6));
          }
        }
      }
    });
  // U1-C66: the cross-beam moved to the seaside of the sheaves (above the trolley path) so the falls, arriving from the apex
  // landside and above, do not pass through it, and the bracket posts stand on the outer part of the girder top, clear of the trolley rail.
  S.position('boom.sheave.boom-block', { parentKey: B_, sub: '031', category: 'component', label: 'Boom hoist sheave blocks on the boom (Z2 and Z3)', prov: 'estimated', sources: [src('J526A2300', 1, 'sections B-B (28000, 1350, 1425 to the boom centreline) and C-C (62500, 1200, 1690); cross-beam and side plates simplified'), s00('boom hoist rope reeving diagram')] },
    (g) => {
      for (const [x, y, zb, nS] of [[XZ2, yBI, zBI, 4], [XZ3, yBO, zBO, 3]]) {
        const w = 0.17; const rB = P('boomBlockSheaveDia') / 2; const xb = x + rB + 0.3; const zp = ZG + 0.42; const yb0 = y + rB * 0.4, yb1 = y + rB + 0.7;
        for (const s of [1, -1]) {
          const z0 = s * zb - ((nS - 1) * w) / 2;
          for (let k = 0; k < nS; k++) g.add('steel', ...sheave([x, y, z0 + k * w], 'z', 2 * rB, 0.1));
          g.add('steel', cyl([x, y, s * zb], 'z', 0.07, nS * w + 0.2, 10)); // shaft
          for (const dz of [-(nS * w) / 2 - 0.05, (nS * w) / 2 + 0.05]) g.add('paint', boxMinMax([x - rB - 0.1, y - 0.15, s * zb + dz - 0.03], [xb + 0.15, yb1, s * zb + dz + 0.03])); // side plates to the cross-beam
        }
        g.add('paint', boxMinMax([xb - 0.15, yb0, -zp - 0.18], [xb + 0.15, yb1, zp + 0.18])); // cross-beam seaside of the sheaves, above the trolley path
        for (const s of [1, -1]) g.add('paint', boxMinMax([xb - 0.15, G_TOP, s * zp - 0.18], [xb + 0.15, yb1, s * zp + 0.18])); // bracket posts outboard of the rail
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
        // C72: buffer mounting plate connected to the secondary equalizer, centre 1310 above rail.
        // The individual buffer key owns the cylinder (one buffer per corner, no second floating proxy).
        g.add('paint', boxMinMax([c.X0 - .22, 1.08, c.Zc + c.s * 4.65], [c.X0 + .22, 1.54, c.Zc + c.s * 4.98]));
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
  S.position('gantry.cable-reel.main', { parentKey: GA_, sub: '042', category: 'component', label: 'Gantry HV cable reel', prov: 'drawing-derived', sources: [s00('waterside end view item 21: centre 7885 above rail, 2121 outboard of the leg; side view 1225(1065)'), src('J526A4000', 1, 'U1-C76: view A reel dia 5600, reel plane 1225 seaside of the rail centreline on odd cranes (1065 even); disc width, hub, guide support and upper cable route are simplified, not fabrication dimensions')] },
    (g) => {
      const zc = -(ZL + P('cableReelOffsetFromLeg')); const xc = REEL_X; const yc = P('cableReelCentreHeight');
      // U1-C76 (D4): dia 5600 monospiral disc in the 1225 plane (J526A4000 view A); hub and drive stay simplified
      g.add('machinery', cyl([xc, yc, zc], 'x', P('cableReelDia') / 2, P('cableReelDiscWidth'), 32), cyl([xc, yc, zc], 'x', 0.75, 0.7, 20));
      g.add('paint', boxMinMax([xc - 0.9, SILL_PIN, zc + 0.6], [xc - 0.25, yc + 0.3, zc + 1.6]), boxMinMax([xc - 0.9, yc - 0.3, zc - 0.3], [xc - 0.25, yc + 0.3, zc + 0.6]), cyl([xc - 0.2, yc, zc], 'x', 0.35, 1.2, 12)); // U1-C76: support and bearing arm landside of the thin disc
      g.add('paint', boxMinMax([xc - .30, 3.72, zc - 1.35], [xc + .30, 3.80, zc + 1.2])); // guide shelf tied into reel support
      for (const x of [xc - .30, xc + .30]) g.add('paint', box([x, 3.85, zc - 1.2], [.06, .25, .3])); // guide bearing cheeks
      g.add('machinery', tube([xc, yc - P('cableReelDia') / 2, zc], [xc, 3.97, zc - 1.2], .05, 10)); // continuous run to guide
    });

  // ---------- access: landside stair tower and elevator (15) ----------
  S.container('container.access', { label: 'Stairs and elevator (landside leg B)', prov: 'drawing-derived', sources: [src('J526A5100', 1, 'elevator location plan and landings 6500 / 15615 / 47845 / 53430'), s00('landside end view stair')] });
  const AC = 'container.access';
  const ZLB = -ZL;
  // U1-C67: the elevator car door line and the landing in front of it (J526A5100 C-C; note 2: every elevator landing is flush
  // with the stair platform of that level). At the four elevator levels the stair tower's outer landing is extended out to this
  // line and the elevator landing continues it on the seaside, as one platform with one outer handrail.
  const zDoor = -ZL - LEG[1] / 2 - P('elevatorCarFromLegFace') - P('elevatorCar')[2] - 0.12; const zE0 = zDoor - P('elevatorLandingDepthZ');
  S.position('access.stair.landside-leg-b', { parentKey: AC, sub: '151', category: 'structural', label: 'Stair tower, landside leg B', prov: 'estimated', sources: [src('J526A5000', 1, 'C75 adds elevator-side cabin home boarding access at third landing; exact home station and route offsets estimated. View P: switch-back flights outboard of leg B with landings A 6500, B 15615, C 47845 and 53430; side view: stair on the landside face of the leg'), s00('landside end view: zig-zag stair outside leg B up to 53430')] },
    (g) => {
      // U1 repair: the P03 flights ran along X across the leg; J526A5000 View P shows them running along Z outboard of
      // leg B (switch-back), on the landside face of the leg in the side view. Two flight lanes side by side in X.
      // C75: fixed third-landing access, separate from the travelling cabin platform.
      // Home station/route offsets are provisional; elevator side and boarding relationship user-confirmed.
      const homeRear=P('cabinHomeRearX'), by=P('elevatorLandings')[2], zGate=-P('cabPlatformSpanZ')+P('cabinWidthZ')/2;
      const routeX=XLS-1.35, routeZ=-ZL-2.5, dockX=homeRear-P('cabWalkwayWidth')/2;
      g.add('paint',boxMinMax([routeX-.45,by-.10,routeZ],[routeX+.45,by,zGate-.45]),boxMinMax([routeX-.45,by-.10,zGate-.9],[dockX+.45,by,zGate]));
      for(const x of [routeX-.45,routeX+.45])g.add('paint',...railing([x,by,routeZ],[x,by,zGate-.9],{step:1.2}));
      g.add('paint',...railing([routeX-.45,by,zGate-.9],[dockX+.45,by,zGate-.9],{step:1.2}),...railing([routeX-.45,by,zGate],[dockX-.45,by,zGate],{step:1}));
      // Suspended fixed platform: hanger rods attach to the fixed girder, not to the moving cabin.
      for(const x of [routeX-.4,routeX+.4])g.add('paint',beam([x,by-.18,routeZ],[x,by-.18,zGate-.45],.10,.20),beam([x,by-.1,zGate-.45],[x,G_BOT,-ZG],.065,.065));
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
          const elevLevel = lv.some((v) => Math.abs(v - yb) < 0.05);
          const zl0 = out && elevLevel ? Math.min(zOut, zE0) : zl; // U1-C67: extended to the elevator door line at the elevator levels
          g.add('grating', boxMinMax([xBack, yb - 0.06, out ? zl0 : zIn - 0.5], [xFace - 0.05, yb, out ? zOut + 0.5 : zIn]));
          if (out && elevLevel) g.add('paint', boxMinMax([xBack, yb - 0.3, zl0], [xFace - 0.05, yb - 0.06, zl0 + 0.12]), boxMinMax([xBack, yb - 0.3, zl0], [xBack + 0.12, yb - 0.06, zOut + 0.5])); // edge beams of the extension
          // outer landing rail (at the elevator levels along the extended edge; it continues on the elevator landing)
          if (out) g.add('paint', ...railing([xBack, yb, zl0], [xFace - 0.05, yb, zl0], { step: 0.9 }), ...railing([xBack, yb, zl0], [xBack, yb, zl + 0.5], { step: 0.5, mid: false }));
        }
      }
      // corner posts of the tower and tie-backs to the leg
      // U1-C67: one outer corner post on the landside edge; the seaside one stood in the passage to the elevator landings
      g.add('paint', boxMinMax([xBack - 0.06, 0, zOut - 0.06], [xBack + 0.06, lv[3] + 1.1, zOut + 0.06]));
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
      // U1-C67: landing in front of the car door, continuing the stair-tower landing of the same level on its seaside (flush,
      // same depth, one outer handrail); before, a separate platform overlapped the stair landing and its flights.
      const zL1 = zDoor - 0.02, zL0 = zE0; const xL0 = XLS - 0.665 - 0.05, xL1 = xC + hwC + 0.15;
      for (const y of lv) {
        g.add('grating', boxMinMax([xL0, y - 0.06, zL0], [xL1, y, zL1]));
        g.add('paint', boxMinMax([xL0, y - 0.3, zL0], [xL1, y - 0.06, zL0 + 0.12]), boxMinMax([xL1 - 0.12, y - 0.3, zL0], [xL1, y - 0.06, zL1])); // edge beams
        g.add('paint', ...railing([xL0, y, zL0], [xL1, y, zL0], { step: 0.75 }), ...railing([xL1, y, zL0], [xL1, y, zC1 + 0.05], { step: 1.0 }));
        g.add('paint', boxMinMax([xL1 - 0.1, y - 0.3, zL1 - 0.1], [xL1 - 0.02, y - 0.06, zM1])); // tie to the mast frame
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

  // ---------- U1-C70 (D-220): QC component workbook and manual-list parts not drawn above ----------
  // Remaining small parts are approximate located shapes in Technical mode on a shared unit cylinder. One instanced carrier per
  // area keeps the draw-call budget and keeps area isolation working (the carrier sits in the area container).
  {
    // C71 replaces eight approximate back-reach proxies with actual selectable TLS geometry.
    // Semantic keys and equipment-position identities stay unchanged; only these carriers are remapped.
    const fitted=fitComponents({S,kit,THREE,P,components:REFERENCE_COMPONENTS,context:{XT,SO,LANE_LS,LANE_WS,yTSh,ZH,HSP,yHS,span,corners,RT,yHB0,G_TOP,G_BOT,tripX0,tripX1,tripZ,ZG,GW,ZB,XMAST,APW,APZ,yAP,XTIP,XTAIL,ZL,cabAccessSwitches:CAB.accessSwitches}});
    const special=new Set(fitted.special), byKey=new Map(REFERENCE_COMPONENTS.map(c=>[c.key,c]));
    const cabinHousings=CAB.instruments.filter(p=>p.key!=='cabin.floor-window-lighting').map(({key,c,s})=>{
      special.add(key);const part=byKey.get(key);
      return {...part,modes:['overall','technical'],qualifier:'Cabin-mounted equipment; detailed shape and instrument layout approximate',
        sources:[...part.sources,src('J526A3100',1,'U1-C74: rectangular cabin equipment mounted inside the shell; indicator at front floor, lighting at floor-window edge; monitor count from manual list, positions estimated')],
        matrix:new THREE.Matrix4().compose(new THREE.Vector3(...c),new THREE.Quaternion(),new THREE.Vector3(...s))};
    });
    S.instanced('cabin.mounted-instruments.instanced',{parentKey:T_,modes:['overall','technical']},g=>g.add('cabInstrument',...CAB.instrumentGeometry()),cabinHousings);
    const floorLight=CAB.instruments.find(p=>p.key==='cabin.floor-window-lighting');special.add(floorLight.key);
    S.position(floorLight.key,{...byKey.get(floorLight.key),modes:['overall','technical'],sources:[...byKey.get(floorLight.key).sources,src('J526A3100',1,'C74: linear fixture mounted at the front floor-window frame, replacing an unsupported flattened cylinder below the cabin; exact lamp section estimated')]},g=>g.add('cabBody',box(floorLight.c,floorLight.s)));
    const tlsInstances=(prefix,point)=>TLS.zs.map((z,i)=>{
      const key=prefix+(i+1), c=byKey.get(key); special.add(key);
      const angle=prefix.includes('cylinder')?Math.atan2(TLS.unit[1],TLS.unit[0]):0;
      return {...c,prov:'drawing-derived', qualifier:'Drawing-derived mechanism; mounting datum estimated',
        sources:[...c.sources,src('J526A1000',1,'U1-C71 normal-operation geometry, ordered from gate house (-Z); see params.json')],
        matrix:new THREE.Matrix4().compose(new THREE.Vector3(...TLS.at(point,z)),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle),new THREE.Vector3(1,1,1))};
    });
    S.instanced('reeving.tls-cylinders.instanced',{parentKey:BR,modes:['overall','technical'],prov:'drawing-derived'},
      g=>drawTlsCylinder(g,kit,P),tlsInstances('reeving.tls-cylinder.',TLS.eye));
    S.instanced('reeving.tls-sheaves.instanced',{parentKey:BR,modes:['overall','technical'],prov:'drawing-derived'},
      g=>g.add('steel',...sheave([0,0,0],'z',P('antiSnagSheaveDia'),.16,28)),tlsInstances('reeving.hoist-sheave.back-reach.',TLS.sheave));
    for(const [key,x,r,len] of [['reeving.tls-pump.motor',XTAIL+3.25,.18,.6],['reeving.tls-pump.coupling-insert',XTAIL+3.64,.10,.16]]) {
      special.add(key); const c=byKey.get(key);
      S.position(key,{...c,parentKey:BR,modes:['overall','technical'],prov:'approximate-location',
        sources:[...c.sources,src('J526A1000',1,'C71: motor/coupling located on the existing hydraulic power pack; pack location and motor envelope remain approximate')]},
        g=>g.add('machinery',cyl([x,G_TOP+.98,-.45],'x',r,len,18)));
    }
    const houseParents = new Set(['container.machinery-house', 'container.electrical-room']);
    const reelRef = { 'gantry.cable-reel.cable': REEL_X - 0.65, 'gantry.cable-reel.guide-roller': REEL_X - 0.65, 'gantry.oil-point.cable-reel': REEL_X - 1.0 }; // U1-C76 (D4)
    // U1-C76 floating-part sweep (tools/u1/find_floating_parts.mjs): workbook parts that touched nothing are seated on
    // their assembly. d = offset from the placed centre, c = new centre, s = new scale; all remain approximate locations.
    const xR76 = XT + P('spreaderCableReelX'), yR76 = RT - P('spreaderCableReelCentreBelowRail');
    const seat = {
      'auxiliary.apex.aircraft-light': { d: [-0.8, 0, 0], n: 'on the landside top rail of the apex guard frame' },
      'auxiliary.apex.anemometer': { d: [-0.8, 0, 0], n: 'on the landside top rail of the apex guard frame' },
      'boom.limit.apex-lever-switch': { d: [0, -0.43, 0], n: 'on the apex platform handrail' },
      // U1-C77: boom latch parts follow the J526A62 latch on its platform (they were at the apex)
      'boom.latch.hook-thruster': { c: [LXH - 0.9, LYP + 0.25, LZ], n: 'on the latch platform under the hook lever (J526A62 thruster B7; one keyed part, two fitted)' },
      'boom.stowage-pins.1': { c: [LXH, LYH, -LZ], n: 'at the latch hook shaft, gate-house side (J526A62: hooks 5750 apart, 2700 from the pylon centre)' }, 'boom.stowage-pins.2': { c: [LXH, LYH, LZ], n: 'at the latch hook shaft, SAGT side (J526A62)' },
      'boom.stowage-pins.switches.1': { c: [LXH - 0.25, LYH + 0.15, -LZ], n: 'on the hook lever at its stowage pin' }, 'boom.stowage-pins.switches.2': { c: [LXH - 0.25, LYH + 0.15, LZ], n: 'on the hook lever at its stowage pin' },
      'boom.limit.stowage-switches': { c: [LXS + 0.3, LYP + 0.1, -LZ + 0.5], n: 'on the latch platform beside the lever support (J526A62 limit switch support, item 3)' },
      'access.elevator.oil-point': { d: [0, -0.76, 0], n: 'on the elevator car roof' },
      'boom-hoist.drum-bearing-seat': { c: [BXD, FL + 0.45, BDZ - BDL / 2 - 0.6], s: [0.45, 0.9, 0.2], n: 'pedestal from the floor to the drum shaft' },
      'hoist.drive.motor-absolute-encoder': { d: [0, 0, -0.13], n: 'on the motor non-drive end' },
      'hoist.limit.drum-brake-switches.1': { d: [-0.16, 0, 0], n: 'on the drum-brake thruster' }, 'hoist.limit.drum-brake-switches.2': { d: [-0.16, 0, 0], n: 'on the drum-brake thruster' },
      'machinery-house.oil-point.service-crane': { c: [HDX - 36.3, WALL - 1.05 + 0.08, HDZ + 7.5], n: 'on the service-crane hoist' },
      'gantry.oil-point.anti-creeper': { d: [-0.19, 0, 0], n: 'on the sill-beam face' },
      'trolley.limit.weight-lever-switch': { d: [0, 0.66, -0.13], n: 'under the trolley frame' },
      'trolley.oil-point.spreader-cable-reel': { c: [xR76, yR76 + 0.2, -0.72], n: 'on the spreader cable reel drive' },
    };
    for (const c of REFERENCE_COMPONENTS.filter((c) => /^trolley\.buffers\.\d$/.test(c.key))) seat[c.key] = { c: [c.shape.c[0] + (c.shape.c[0] < XT ? 0.1 : -0.1), RT + 0.35, Math.sign(c.shape.c[2]) * (ZH - PS - 0.25)], n: 'on its buffer tube of the trolley frame (the keyed buffer was a second cylinder below it)' };
    const seated = (c) => { const f = seat[c.key]; if (!f) return c; const p = f.c || [c.shape.c[0] + f.d[0], c.shape.c[1] + f.d[1], c.shape.c[2] + f.d[2]];
      return { ...c, shape: { ...c.shape, c: p, ...(f.s ? { s: f.s } : {}) }, sources: [...c.sources, src('U1-C76 floating-part sweep', null, 'seated ' + f.n + '; location approximate')] }; };
    const correctedReference = REFERENCE_COMPONENTS.filter(c=>!special.has(c.key)).map(fitted.correct).map(c=>{
      if (houseParents.has(c.parentKey) && !(seat[c.key] && seat[c.key].c)) return { ...c, shape: { ...c.shape, c: [c.shape.c[0] + HDX, c.shape.c[1], c.shape.c[2] + HDZ] } }; // U1-C76 (D1), U1-C77 (D10)
      if (reelRef[c.key] !== undefined) return { ...c, shape: { ...c.shape, c: [c.shape.c[0] + reelRef[c.key], c.shape.c[1], c.shape.c[2]] } };
      const m=c.key.match(/^reeving\.tls-cylinder\.(transducers|pressure-switches)\.(\d)$/);
      if(!m)return c;
      const z=TLS.zs[Number(m[2])-1], along=m[1]==='transducers'?P('tlsCylinderBodyEnd')-.15:P('tlsExposedRod')+.15;
      return {...c,shape:{...c.shape,c:[TLS.eye[0]+TLS.unit[0]*along,TLS.eye[1]+TLS.unit[1]*along+.20,z]},
        sources:[...c.sources,src('J526A1000',1,'U1-C71 sensor follows its corrected cylinder; small sensor shape and attachment remain approximate')]};
    }).map(seated);
    const byParent = new Map();
    for (const c of correctedReference) { const k = c.parentKey || ''; if (!byParent.has(k)) byParent.set(k, []); byParent.get(k).push(c); }
    for (const [pk, list] of [...byParent.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      S.instanced(`reference.${pk ? pk.slice('container.'.length) : 'crane'}.instanced`, { parentKey: pk || null, modes: ['technical'], prov: 'approximate-location' },
        (g) => g.add('refPart', cyl([0, 0, 0], 'y', 0.5, 1, 12)),
        list.map((c) => ({ key: c.key, label: c.label, sub: c.sub, parentKey: pk || null, category: c.category, positionKind: c.positionKind, uom: c.uom,
          sources: c.sources, classificationNote: c.classificationNote,
          matrix: new THREE.Matrix4().compose(new THREE.Vector3(...c.shape.c), new THREE.Quaternion(...c.shape.q), new THREE.Vector3(...c.shape.s)) })));
    }
  }

  return { builder: S, materials: mats, landmarks: {
    railGauge: XWS - XLS, outreach: OUT, backreach: BACK, hingeX: XHINGE, boomTipX: XTIP, girderTailX: XTAIL,
    trolleyRail: RAIL_T, portalTopWaterside: TOP_WS, portalTopLandside: TOP_LS, aFrameTop: AF_TOP, apexStayPin: PIN_Y,
    overallHeight: APEX, liftAboveRail: P('liftAboveRail'), legCentreSpacing: 2 * ZL, bogieOverall: 2 * (ZB + 5.6),
    tieBeamUnderside: TIE_BOT, machineryHouse: { x: [HX0, HX1], z: [HZ0, HZ1], floor: FL, eaves: WALL },
  } };
}
