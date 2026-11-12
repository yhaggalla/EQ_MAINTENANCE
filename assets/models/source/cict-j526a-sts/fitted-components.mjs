// U1-C72: workbook identities refer to fitted assemblies, not a second set of display proxies.
// Keep corrections separate from the read-only workbook import so an import cannot undo placement fixes.
export function fitComponents({ S, kit, THREE, P, components, context: C }) {
  const { cyl, sheave, box, tube } = kit;
  const byKey = new Map(components.map(c => [c.key, c])), special = new Set(), edits = new Map();
  const source = (drawing, note) => ({ drawing, pdfPage: 1, note: 'U1-C72: ' + note });
  const tr = p => new THREE.Matrix4().makeTranslation(...p);
  const metadata = (key, drawing, note, prov = 'approximate-location') => {
    const c = byKey.get(key); if (!c) throw Error('Missing component ' + key);
    return { ...c, prov, sources: [...c.sources, source(drawing, note)] };
  };
  const instances = (name, parentKey, list, draw) => {
    for (const c of list) special.add(c.key);
    S.instanced(name, { parentKey, modes: ['overall', 'technical'] }, draw, list);
  };
  const trolley = [];
  for (let n = 1; n <= 4; n++) for (const [suffix, x, lanes] of [['i', C.XT - C.SO, C.LANE_LS], ['ii', C.XT + C.SO, C.LANE_WS]]) {
    const s = n <= 2 ? -1 : 1, lane = n === 1 || n === 4 ? 1 : 0;
    trolley.push({ ...metadata(`trolley.hoist-sheave.${n}-${suffix}`, 'J526A0200', 'Owns one of the eight existing dia 1000 sheaves on four shafts; no duplicate proxy. Shaft height scaled; workbook numbering retained.', 'drawing-derived'),
      matrix: tr([x, C.yTSh, s * (C.ZH + lanes[lane])]) });
  }
  instances('trolley.hoist-sheaves.instanced', 'container.trolley', trolley,
    g => g.add('steel', ...sheave([0, 0, 0], 'z', P('trolleyMainSheaveDia'), .07, 28)));
  const headblock = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z], i) => ({
    ...metadata('headblock.hoist-sheave.' + (i + 1), 'J526A1200', 'Owns one existing dia 1000 sheave; 1010 pitch, 970 above base, two sheaves per box; no duplicate proxy.', 'drawing-derived'),
    matrix: tr([C.XT + x * C.HSP, C.yHS, z * C.span])
  }));
  instances('headblock.hoist-sheaves.instanced', 'container.headblock-spreader', headblock,
    g => g.add('steel', ...sheave([0, 0, 0], 'z', P('headblockSheaveDia'), .1, 28)));
  const buffers = C.corners.map((c, i) => ({
    ...metadata('gantry.buffers.' + (i + 1), 'J526A0600', 'Buffer replaces the old bogie buffer solid; centre 1310 above rail, mounted to the outer equalizer. Envelope simplified.', 'drawing-derived'),
    matrix: tr([c.X0, 1.31, c.Zc + c.s * 5.275])
  }));
  instances('gantry.buffers.instanced', 'container.gantry', buffers,
    g => g.add('machinery', cyl([0, 0, 0], 'z', .14, .65, 16), cyl([0, 0, 0], 'z', .18, .06, 16)));

  // The workbook lists interchangeable attachments. It does not establish that they are fitted or stored here.
  const optional = ['spreader.over-height-adapter', 'spreader.hook-beam', 'spreader.hook-beam.hook'].map(key => {
    special.add(key); const c = byKey.get(key);
    return { ...c, modes: [], qualifier: 'Optional attachment; not fitted in this displayed spreader arrangement. Its records remain available.',
      matrix: new THREE.Matrix4().compose(new THREE.Vector3(...c.shape.c), new THREE.Quaternion(...c.shape.q).normalize(), new THREE.Vector3(...c.shape.s)) };
  });
  S.instanced('reference.unfitted-attachments.instanced', { parentKey: 'container.headblock-spreader', modes: [] },
    g => g.add('refPart', box([0, 0, 0], [1, 1, 1])), optional);

  // The assembly bounds include the hanging cable. Use the actual reel datum, not the bounds centre.
  const xR = C.XT + P('spreaderCableReelX'), yR = C.RT - P('spreaderCableReelCentreBelowRail');
  const key = 'trolley.spreader-cable'; special.add(key);
  S.position(key, { ...metadata(key, 'Cavotec SC-121216-ME2a', 'Wound cable and descending run share the existing reel datum; the floating duplicate disc is removed.'), modes: ['overall', 'technical'] },
    g => g.add('rope', cyl([xR, yR, 0], 'z', .62, .04, 24), tube([xR - .62, yR, 0], [C.XT, C.yHB0 + 1.05, 0], .035, 8)));
  const move = (key, c, drawing, note, extra = {}) => edits.set(key, { ...metadata(key, drawing, note), ...extra, shape: { ...byKey.get(key).shape, c, ...extra.shape } });
  move('trolley.spreader-cable-reel.main-reducer-bearing', [xR, yR, -.58], 'J526A0200', 'Bearing on the reel drive, using its centre datum; detailed bearing envelope approximate.');
  move('trolley.spreader-cable-reel.pre-reducer-bearing', [xR, yR, -.86], 'J526A0200', 'Bearing on the reel drive, using its centre datum; detailed bearing envelope approximate.');
  move('trolley.spreader-cable-reel.bollard-damper', [xR - .57, yR - .72, 0], 'J526A0200', 'Damper on the descending cable below the reel; location/envelope approximate.');
  for (let i = 1; i <= 4; i++) move('trolley.rope-clamp.' + i,
    [C.XT + (i <= 2 ? -P('trolleyEqualizerSheaveXLandside') : P('trolleyEqualizerSheaveXWaterside')), C.RT + P('trolleyRopeAboveRail'), (i % 2 ? -1 : 1) * P('trolleyRopeLaneZ')],
    'J526A2100', 'Clamp aligned with the trolley rope at the equalizer, rather than hovering above it; envelope simplified.');
  for (let i = 1; i <= 2; i++) {
    move('trolley.limit.boom-end-lever-switches.' + i, [74.3, C.G_TOP + .125, i === 1 ? -3 : 3], 'J526A0200', 'Switch base seated on the boom top beside the rail; exact switch location approximate.');
    move('trolley.limit.proximity-switches.' + i, [i === 1 ? 69.9 : 72.9, C.G_TOP + .06, -3.55], 'J526A0200', 'Proximity sensor seated on the girder top, clear of the running rail; exact location approximate.');
    const s = i === 1 ? -1 : 1;
    move('boom.collision.trip-wires.' + i, [(C.tripX0 + C.tripX1) / 2, C.G_BOT - .4, s * C.tripZ], 'J526A6300', '69600 support spacing; 1800 outboard of the girder outer face, 400 below the girder underside. Longitudinal datum estimated; dia 5 wire exaggerated to dia 20 for visibility.',
      { shape: { s: [.02, P('collisionWireSpan'), .02] } });
    move('boom.collision.switches.' + i, [C.tripX0, C.G_TOP + .43, s * (C.ZG + C.GW / 2 + .05)], 'J526A6300', 'Switch on the rear support upright; not at an unsupported cable end. Small envelope simplified.');
    move('gantry.buffer.limit-switches.' + i, [.30, 1.75, s * (C.ZB + 4.65)], 'J526A0600', 'Switch at the outer equalizer, with its base on the frame; exact location approximate.');
  }
  C.corners.forEach((c, i) => move('gantry.obstacle-sensors.' + (i + 1), [c.X0 + .36, .55, c.Zc + c.s * 4.55], 'J526A0600', 'Obstacle sensor fixed to the outer sub-bogie side plate; envelope and location approximate.'));
  move('auxiliary.jib-cranes.1', [73.9, C.G_TOP + .9, 2.9], 'J526A0100', 'Mast base seated on the boom girder; small jib envelope/location remain approximate.');
  move('auxiliary.jib-cranes.2', [C.XMAST + C.APW - .4, C.yAP + .8, C.APZ - .4], 'J526A5000', 'Mast base seated on the apex platform; parent corrected to A-frame; envelope/location approximate.', { parentKey: 'container.a-frame' });
  move('auxiliary.obstruction-lights.1', [C.XTIP - .4, C.G_TOP + .175, C.ZG], 'J526A0100', 'Light base seated on the boom-end girder; exact mounting detail approximate.');
  move('auxiliary.obstruction-lights.2', [C.XTAIL + .3, C.G_TOP + .175, 0], 'J526A0100', 'Light base seated on the rear end diaphragm; parent corrected to girder.', { parentKey: 'container.girder' });
  const zR = -(C.ZL + P('cableReelOffsetFromLeg')), gY = P('cableReelCentreHeight');
  const xReel = P('cableReelPlaneFromRail'); // U1-C76 (D4): accessories follow the reel plane (was X = 1.0)
  move('gantry.cable-reel.coupling', [xReel + .48, gY, zR], 'J526A00', 'Coupling meets the reel shaft at its centre; envelope approximate.');
  move('gantry.cable-reel.slip-rings', [xReel - .9, gY, zR], 'J526A00', 'Slip-ring assembly seated on the inboard shaft; envelope approximate.');
  // These are rectangular housings, not elliptical discs. Their back faces meet the sill/leg faces.
  const housings = [['gantry.rail-brake-hpu', [.955, 4.1, -6]], ['gantry.ground-control-station', [-28.89, 7.2, -10.85]]].map(([key, c]) => {
    special.add(key); const part = metadata(key, 'J526A0100', 'Housing attached to the adjacent sill/leg face; mounting position and envelope approximate.');
    return { ...part, matrix: new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion(), new THREE.Vector3(...part.shape.s)) };
  });
  S.instanced('gantry.mounted-housings.instanced', { parentKey: 'container.portal', modes: ['technical'] },
    g => g.add('refPart', box([0, 0, 0], [1, 1, 1])), housings);
  C.cabAccessSwitches.forEach((c,i)=>move('cabin.access-gate.switches.'+(i+1),c,'J526A3100','C74: mounted on the side-door jamb, replacing an unsupported proxy outside the cab; switch dimensions/location approximate.'));
  return { special, correct: c => edits.get(c.key) || c };
}
