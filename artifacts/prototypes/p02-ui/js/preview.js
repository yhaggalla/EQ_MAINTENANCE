/* LOW-COST QC PREVIEW PLACEHOLDER (P02, revised in the U1 repair).
   This is an inline SVG side-elevation schematic, NOT the P03 Three.js model and NOT a verified geometry source.
   - Horizontal spans use the verified baseline (rail gauge 30 m, outreach 70 m, backreach 20 m; rear girder 31 m behind
     the landside rail). Schematic x = metres from the waterside rail + 50 (landside rail x = 20, girder tail x = -11).
   - Vertical proportions are ILLUSTRATIVE: 63 m is total lift height, not crane height (the P03 model has the
     drawing-derived heights).
   - Landside is left, waterside (boom side) is right, matching the J526A00 general arrangement.
   U1 repair: back-reach area (girder-tail platform, anti-snag/TLS device and tail sheaves, outdoor service crane,
   festoon and cab service platform), the CICT logo on the machinery house, the stair tower on the landside leg and the
   A-frame stair, cab seat and consoles, machinery house narrowed to its 10.5 m drawing width, and tier 1 > 2 > 3
   drill-down labels (same behaviour as the P03 3D view). It still proves one selection model (tree = scene = URL). */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h;
  const Y = (hh) => 88 - hh; // metres above rail -> svg y
  const BASE = { x: -14, y: 2, w: 144, h: 106 };
  const view = (EQ.sceneView = { ...BASE });
  let anim = null;

  const rect = (x, h0, h1, w, cls, extra) => h('rect', { x, y: Y(h1), width: w, height: h1 - h0, class: cls, ...(extra || {}) });
  const circ = (cx, hh, r, cls) => h('circle', { cx, cy: Y(hh), r, class: cls });
  const line = (x1, h1, x2, h2, cls) => h('line', { x1, y1: Y(h1), x2, y2: Y(h2), class: cls });
  const poly = (pts, cls) => h('polygon', { points: pts.map(([x, hh]) => x + ',' + Y(hh)).join(' '), class: cls });
  const pline = (pts, cls) => h('polyline', { points: pts.map(([x, hh]) => x + ',' + Y(hh)).join(' '), class: cls, fill: 'none' });
  // zig-zag stair between x0..x1 from h0 to h1 with n flights, landings as short horizontal strokes
  const zigzag = (x0, x1, h0, h1, n) => {
    const pts = []; for (let i = 0; i <= n; i++) pts.push([i % 2 ? x1 : x0, h0 + (h1 - h0) * i / n]);
    const land = []; for (let i = 1; i <= n; i++) { const x = i % 2 ? x1 : x0; const hh = h0 + (h1 - h0) * i / n; land.push(line(x - 0.45, hh, x + 0.45, hh, 'sc-stair-land')); }
    return [h('polyline', { points: pts.map(([x, hh]) => x + ',' + Y(hh)).join(' '), class: 'sc-stair', fill: 'none' }), ...land];
  };
  const hitArea = (x0, h0, x1, h1) => rect(x0, h0, h1, x1 - x0, 'sc-hitpad');

  // Machinery house (10.5 m wide in the J526A3000 drawing), on the girder; internals are schematic.
  const HX0 = 7.9, HX1 = 18.4, HB = 51, HT = 58.1, HR = 59.3;

  /** Scene element specs. key = semantic node key (never a DB id). anchor = label/marker location. tech = Technical-only. */
  function specs() {
    return [
      { key: 'gantry.bogie.landside.a', label: 'Gantry bogie, landside', anchor: [25, 3.5], build: () => [rect(15, 0.5, 3.5, 10, 'sc-grey'), circ(17, 1.2, 1.1, 'sc-tech'), circ(23, 1.2, 1.1, 'sc-tech')] },
      { key: 'gantry.bogie.waterside.a', label: 'Gantry bogie, waterside', anchor: [55, 3.5], build: () => [rect(45, 0.5, 3.5, 10, 'sc-grey'), circ(47, 1.2, 1.1, 'sc-tech'), circ(53, 1.2, 1.1, 'sc-tech')] },
      { key: 'structure.portal.landside.leg.a', label: 'Portal landside leg', anchor: [21.5, 30], build: () => [poly([[18.6, 3.5], [21.4, 3.5], [21.8, 49], [18.2, 49]], 'sc-paint')] },
      { key: 'structure.portal.waterside.leg.a', label: 'Portal waterside leg', anchor: [51.6, 30], build: () => [poly([[48.6, 3.5], [51.4, 3.5], [51.8, 49], [48.2, 49]], 'sc-paint')] },
      { key: 'gantry.cable-reel.main', label: 'Gantry cable reel', anchor: [30, 9], build: () => [circ(27.5, 6.5, 3.1, 'sc-tech'), circ(27.5, 6.5, 1, 'sc-grey')] },
      { key: 'access.elevator.car', label: 'Elevator', anchor: [54, 30], build: () => [rect(52.4, 4, 48.5, 1.8, 'sc-house')] },
      // U1-C03: stair tower on the landside face of the landside leg (J526A5000 View P: switch-back flights up to 53.4 m)
      { key: 'access.stair.landside-leg-b', label: 'Stair tower, landside leg', anchor: [17.2, 40], build: () => [hitArea(15.5, 3.6, 18.2, 53.4), ...zigzag(15.9, 18.0, 0, 53.4, 17), line(15.6, 0, 15.6, 53.4, 'sc-stair-post')] },
      { key: 'structure.girder.rear.main', label: 'Fixed rear girder', anchor: [2, 51], build: () => [rect(-11, 49, 51, 61, 'sc-paint')] },
      { key: 'boom.main.girder', label: 'Boom girder', anchor: [118, 51], build: () => [rect(50, 49, 51, 74, 'sc-paint')] },
      { key: 'structure.mast.main', label: 'Mast / A-frame', anchor: [53.5, 62], build: () => [poly([[43, 51], [53.2, 51], [49.4, 79.4], [47.6, 79.4]], 'sc-paint'), line(48.5, 79.4, -11, 51, 'sc-paint-line')] },
      { key: 'access.stair.a-frame', label: 'A-frame access stair', anchor: [45.6, 70], build: () => [hitArea(44.3, 51.5, 47.3, 77), ...zigzag(44.6, 46.9, 51.6, 76.6, 8)] },
      { key: 'boom.rope.set.main', label: 'Boom stays / rope set', anchor: [88, 62], rope: true, build: () => [line(48.5, 79, 100, 51, 'sc-rope'), line(48.5, 79, 122, 51, 'sc-rope')] },
      // U1-C04: main hoist ropes run back to the girder-tail sheaves, then forward to the trolley and headblock
      { key: 'hoist.rope.set.main', label: 'Main hoist rope set', anchor: [94, 36], rope: true, build: () => [line(12.4, 52.7, -8.05, 52.75, 'sc-rope'), line(-8.05, 51.65, 93.4, 52.6, 'sc-rope'), line(93.4, 52.6, 92.9, 21.2, 'sc-rope'), line(93.4, 52.6, 95.1, 21.2, 'sc-rope')] },
      { key: 'trolley.rope.set.main', label: 'Trolley rope set', anchor: [60, 51.6], rope: true, dash: true, build: () => [line(-10.1, 51.5, 124, 51.5, 'sc-rope')] },
      { key: 'trolley.frame', label: 'Trolley frame', anchor: [98, 54.5], build: () => [rect(86, 51, 54.5, 12, 'sc-paint')] },
      { key: 'cabin.operator.main', label: 'Operator cabin', anchor: [89.2, 49], build: () => [rect(86.5, 44.5, 49, 5.5, 'sc-house'), rect(87.3, 46.2, 47.8, 3.6, 'sc-tech')] },
      { key: 'cabin.operator.seat', label: 'Operator seat', anchor: [90.2, 46.5], build: () => [poly([[89.6, 45.2], [90.7, 45.2], [90.7, 45.6], [90.1, 45.6], [89.9, 47.0], [89.5, 47.0]], 'sc-seat')] },
      { key: 'cabin.operator.consoles', label: 'Operator consoles', anchor: [91.4, 46.2], build: () => [rect(90.9, 44.9, 45.8, 0.9, 'sc-grey'), line(91.35, 45.8, 91.35, 46.3, 'sc-rope')] },
      { key: 'headblock.frame', label: 'Headblock', anchor: [95.6, 21.2], build: () => [rect(92.4, 19.2, 21.2, 3.2, 'sc-paint')] },
      { key: 'spreader.frame', label: 'Spreader frame', anchor: [100, 19], build: () => [rect(89, 17.6, 19.2, 11, 'sc-paint')] },
      // U1-C03 back-reach area (J526A00 item 7, J526A1000, J526A5000 items 5 and 8, J526A7100)
      { key: 'access.platform.girder-tail', label: 'Girder-tail platform', anchor: [-9.5, 52.2], build: () => [rect(-12.2, 51, 51.15, 5.7, 'sc-grate'), pline([[-12.2, 52.1], [-6.5, 52.1]], 'sc-rail'), line(-12.2, 51, -12.2, 52.1, 'sc-rail'), line(-11.6, 49, -10.4, 51, 'sc-rail')] },
      { key: 'reeving.anti-snag-tls.device', label: 'Anti-snag / TLS device', anchor: [-7.2, 53.7], build: () => [rect(-9.2, 51, 51.35, 3.75, 'sc-paint'), rect(-9.1, 51.35, 53.7, 0.4, 'sc-paint'), line(-8.9, 53.55, -8.05, 52.2, 'sc-lever'), line(-8.9, 53.55, -5.2, 51.6, 'sc-cyl')] },
      { key: 'reeving.sheave.girder-tail', label: 'Hoist rope tail sheaves', anchor: [-6.95, 52.8], build: () => [circ(-8.05, 52.2, 0.55, 'sc-tech'), circ(-5.85, 52.2, 0.55, 'sc-tech')] },
      { key: 'auxiliary.service-crane.girder-tail', label: 'Outdoor service crane (tail)', anchor: [-10.8, 54], build: () => [rect(-10.55, 51, 53.8, 0.3, 'sc-paint'), rect(-9.15, 51, 53.8, 0.3, 'sc-paint'), rect(-12.54, 53.5, 53.8, 3.84, 'sc-paint'), line(-12.0, 53.5, -12.0, 52.6, 'sc-rope')] },
      { key: 'access.platform.festoon-cab-service', label: 'Festoon and cab service platform', anchor: [-4.2, 46.6], build: () => [line(-6.3, 49, -6.3, 46.6, 'sc-rail'), line(-2.1, 49, -2.1, 46.6, 'sc-rail'), rect(-6.4, 46.45, 46.6, 4.4, 'sc-grate'), pline([[-6.4, 47.6], [-2.0, 47.6]], 'sc-rail'), line(-2.6, 46.6, -4.4, 49, 'sc-rail')] },
      // Technical-only internals and approximate hotspots (positions inside the 10.5 m house; layout schematic)
      { key: 'hoist.drive.motor.a', label: 'Hoist motor A', tech: true, anchor: [9.1, 53.6], build: () => [rect(8.3, 51.6, 53.6, 1.6, 'sc-tech')] },
      { key: 'hoist.drive.gearbox.a', label: 'Gearbox A', tech: true, anchor: [10.55, 53.4], build: () => [rect(10.0, 51.6, 53.4, 1.1, 'sc-tech')] },
      { key: 'hoist.drive.drum.a', label: 'Hoist drum A', tech: true, anchor: [12.45, 54.2], build: () => [rect(11.25, 51.6, 54.2, 2.4, 'sc-tech'), line(11.6, 52.9, 13.3, 52.9, 'sc-deco')] },
      { key: 'hoist.emergency.brake.a', label: 'Emergency brake A', tech: true, anchor: [14.1, 54], build: () => [rect(13.75, 52, 54, 0.7, 'sc-grey')] },
      { key: 'hoist.drive.motor.b', label: 'Hoist motor B', tech: true, anchor: [15.4, 53.6], build: () => [rect(14.6, 51.6, 53.6, 1.6, 'sc-tech')] },
      { key: 'trolley.wheel.position.a', label: 'Trolley wheel A', tech: true, anchor: [89, 52.5], build: () => [circ(88.2, 51.7, 1, 'sc-tech')] },
      { key: 'trolley.wheel.position.b', label: 'Trolley wheel B', tech: true, anchor: [97, 52.5], build: () => [circ(96.4, 51.7, 1, 'sc-tech')] },
      { key: 'hoist.loadcell.main', label: 'Load cell (approx.)', tech: true, hotspot: true, anchor: [95.6, 54.2], build: () => [circ(94.6, 53.6, 0.95, 'sc-hot')] },
      { key: 'electrical.plc.main', label: 'PLC (approx.)', tech: true, hotspot: true, anchor: [17.4, 57.6], build: () => [circ(17.2, 57.0, 0.8, 'sc-hot')] },
      { key: 'electrical.control-power.main', label: 'Control power (approx.)', tech: true, hotspot: true, anchor: [17.4, 55.4], build: () => [circ(17.2, 54.8, 0.8, 'sc-hot')] },
      { key: 'electrical.hv.switchgear', label: 'HV switchgear (approx.)', tech: true, hotspot: true, anchor: [9.2, 58.0], build: () => [circ(9.2, 57.2, 0.8, 'sc-hot')] },
    ];
  }
  EQ.sceneKeys = () => specs().map((s) => s.key);
  EQ.sceneKeyLabel = (k) => specs().find((s) => s.key === k)?.label || k;
  EQ.sceneSpec = (k) => specs().find((s) => s.key === k) || null;

  /** Assembly chips = text alternative to hover labels; each selects a submechanism (union of its bound positions) or the container. */
  EQ.assemblyChips = [
    { id: 'portal', label: 'Portal frame', sub: '151' },
    { id: 'house', label: 'Machinery house (container)', container: 'machinery-house' },
    { id: 'boom', label: 'Boom', sub: '031' },
    { id: 'trolley', label: 'Trolley', sub: '021' },
    { id: 'cabin', label: 'Operator cabin', sub: '141' },
    { id: 'spreader', label: 'Spreader', sub: '061' },
    { id: 'headblock', label: 'Headblock', sub: '062' },
    { id: 'gantry', label: 'Gantry bogies', sub: '041' },
    { id: 'hoist', label: 'Main hoist', main: '01', tech: true },
    { id: 'skew', label: 'Back-reach anti-snag / TLS', sub: '111' },
  ];

  /**
   * Build the scene SVG.
   * opts: {mode, iso, getPos(key)->position|undefined, selectedKeys:Set, work:Map(key->count)|null, showWork, onPick(key), onContainer(), containerSel}
   */
  EQ.buildScene = function buildScene(opts) {
    const tech = opts.mode === 'technical';
    const hasSel = opts.selectedKeys.size > 0;
    const svg = h('svg', { id: 'scene-svg', class: 'scene ' + (tech ? 'mode-technical' : 'mode-overall') + (opts.iso ? ' iso' : ''), viewBox: [view.x, view.y, view.w, view.h].join(' '), role: 'group', 'aria-label': 'Schematic side view of a quay crane, landside left, waterside right. Placeholder, not the verified 3D model. Use the mechanism tree or the assembly buttons for the same selection.' });
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // Decorative context (not selectable)
    svg.appendChild(h('g', { class: 'deco', 'aria-hidden': 'true' },
      h('rect', { x: -14, y: Y(0), width: 69.5, height: 24, fill: '#d3dae0' }),
      h('rect', { x: 55.5, y: Y(-16), width: 75, height: 8, fill: '#b9d6e8' }),
      line(55.5, 0, 55.5, -16, 'sc-deco'),
      rect(19.6, 0, 0.8, 0.5, null, { fill: '#38444e' }), rect(49.6, 0, 0.8, 0.5, null, { fill: '#38444e' }),
      line(21.6, 12, 48.4, 12.8, 'sc-paint-line'), line(21.6, 12.6, 48.4, 47, 'sc-paint-line'),
      pline([[21.6, 15.4], [48.4, 15.4]], 'sc-rail'), // tie-beam handrail (U1)
      circ(50, 50, 0.9, 'sc-grey'),
      h('text', { x: -14, y: Y(-5), class: 'sc-text' }, 'LANDSIDE'),
      h('text', { x: 100, y: Y(-12.5), class: 'sc-text' }, 'WATERSIDE (boom side)'),
      h('text', { x: 58, y: Y(-18.2), class: 'sc-text small' }, 'Water level approximate, illustrative'),
      h('text', { x: 28, y: Y(-3), class: 'sc-text small' }, 'Rail gauge 30 m'),
      line(20, -1.2, 50, -1.2, 'sc-deco'),
      h('text', { x: -12.6, y: Y(44.2), class: 'sc-text small' }, 'Back-reach 20 m + 11 m tail'),
      line(-11, 45.4, 20, 45.4, 'sc-deco'),
    ));
    // Machinery house (container: spatial group only, never a mechanism). U1: drawn 10.5 m wide with a gable roof and
    // the CICT logo (photos show it on the -Z end wall; drawn on this elevation for identification, placement approximate).
    const house = h('g', { class: 'sc-hit house' + (opts.containerSel ? ' sel' : ''), 'data-container': 'machinery-house', 'data-fk': 'sc-house', tabindex: 0, role: 'button', 'aria-label': 'Machinery house, spatial container. Enter lists the positions it contains; it is not a mechanism.', 'aria-pressed': opts.containerSel ? 'true' : 'false' },
      h('title', null, 'Machinery house (container, not a mechanism)'),
      h('rect', { x: HX0, y: Y(HT), width: HX1 - HX0, height: HT - HB, class: 'sc-house' + (tech ? ' xray' : '') }),
      h('polygon', { points: [[HX0 - 0.3, HT], [(HX0 + HX1) / 2, HR], [HX1 + 0.3, HT]].map(([x, hh]) => x + ',' + Y(hh)).join(' '), class: 'sc-roof' + (tech ? ' xray' : '') }),
      h('image', { href: 'img/cict-logo.png', x: HX0 + 1.1, y: Y(57.3), width: 3.4, height: 3.38, class: 'sc-logo overall-only', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' }),
      pline([[HX0 - 0.6, HB + 1.1], [HX1 + 0.6, HB + 1.1]], 'sc-rail'));
    house.addEventListener('click', () => opts.onContainer());
    house.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onContainer(); } });
    // Order: structure first, then ropes, then house, then technical internals (so x-ray internals stay pickable)
    const all = specs();
    const add = (s) => {
      const pos = opts.getPos(s.key);
      const sel = opts.selectedKeys.has(s.key);
      const inHouse = s.tech && s.anchor[0] > HX0 - 1 && s.anchor[0] < HX1 + 1 && s.anchor[1] > 50;
      const g = h('g', {
        class: 'sc-hit' + (s.tech ? ' tech-only' : '') + (sel ? ' sel' : '') + (hasSel && !sel ? ' dim' : '') + (pos ? '' : ' unbound') + (inHouse ? ' in-house' : ''),
        'data-key': s.key, 'data-fk': 'sc-' + s.key, role: 'button', 'aria-label': s.label + (pos ? '' : ' (not bound to a position for this equipment)') + (sel ? ', selected' : ''), 'aria-pressed': sel ? 'true' : 'false',
      });
      if (pos) g.setAttribute('tabindex', '0'); else g.setAttribute('aria-disabled', 'true');
      g.appendChild(h('title', null, s.label + (s.hotspot ? ' - Location approximate / simplified representation' : '')));
      if (s.rope) {
        const kids = s.build();
        // fat transparent hit areas so thin ropes remain selectable and fit-able
        kids.forEach((k) => { const c = k.cloneNode(); c.setAttribute('class', ''); c.setAttribute('stroke', 'transparent'); c.setAttribute('stroke-width', '2.6'); g.appendChild(c); });
        kids.forEach((k) => { if (s.dash) k.setAttribute('stroke-dasharray', '1.2 .8'); g.appendChild(k); });
      } else s.build().forEach((k) => g.appendChild(k));
      if (pos) {
        const act = () => opts.onPick(s.key);
        g.addEventListener('click', act);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      }
      return g;
    };
    all.filter((s) => !s.tech && !s.rope).forEach((s) => svg.appendChild(add(s)));
    all.filter((s) => !s.tech && s.rope).forEach((s) => svg.appendChild(add(s)));
    svg.appendChild(house);
    all.filter((s) => s.tech).forEach((s) => svg.appendChild(add(s)));
    svg.appendChild(h('g', { 'aria-hidden': 'true' },
      h('text', { x: HX0 - 0.5, y: Y(61.6), class: 'sc-text small tech-only' }, 'Machinery house (enclosure shown transparent)'),
      h('text', { x: HX0, y: Y(50), class: 'sc-text small tech-only' }, 'Internals: layout schematic'),
    ));
    // Open-work markers (separate from paint and from operational status)
    if (opts.showWork && opts.work) {
      const g = h('g', { class: 'work-markers' });
      all.forEach((s) => {
        const n = opts.work.get(s.key); if (!n || (s.tech && !tech)) return;
        g.appendChild(h('g', null, h('title', null, n + ' open job(s) at ' + s.label), circ(s.anchor[0], s.anchor[1] + 1.2, 1.5, 'sc-work'), h('text', { x: s.anchor[0], y: Y(s.anchor[1] + 1.2) + .75, class: 'sc-work-t' }, String(n))));
      });
      svg.appendChild(g);
    }
    attachPanZoom(svg);
    svg.style.setProperty('--k', (view.w / 900).toFixed(4));
    if (window.ResizeObserver) new ResizeObserver(() => { setK(svg); EQ.layoutSceneLabels(); }).observe(svg);
    return svg;
  };

  // ---------------- tier labels (U1-C07/C08): same drill-down as the P03 3D view ----------------
  // Candidates are set by the equipment view: [{id, keys, text, tier, selected, work, next}]. Each label is anchored on
  // the representative element of its key set; labels never cover each other (stacked with a leader line if needed).
  let labelCands = []; let labelsOn = true; let onLabel = null; let curMode = 'overall';
  EQ.setSceneLabels = (cands, { on = true, mode = 'overall', onClick } = {}) => { labelCands = cands || []; labelsOn = on; curMode = mode; onLabel = onClick; requestAnimationFrame(() => EQ.layoutSceneLabels()); };
  EQ.layoutSceneLabels = function layoutSceneLabels() {
    const svg = document.getElementById('scene-svg'); const layer = document.getElementById('scene-labels');
    if (!svg || !layer) return;
    layer.textContent = '';
    if (!labelsOn || !labelCands.length) return;
    const ctm = svg.getScreenCTM(); const lr = layer.getBoundingClientRect(); if (!ctm || !lr.width) return;
    const toPx = (x, hh) => { const p = svg.createSVGPoint(); p.x = x; p.y = Y(hh); const q = p.matrixTransform(ctm); return { x: q.x - lr.left, y: q.y - lr.top }; };
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lines.setAttribute('class', 'sc-leaders'); lines.setAttribute('width', lr.width); lines.setAttribute('height', lr.height); layer.appendChild(lines);
    const placed = [];
    const hit = (r) => placed.some((q) => r.x < q.x + q.w + 4 && r.x + r.w + 4 > q.x && r.y < q.y + q.h + 2 && r.y + r.h + 2 > q.y);
    for (const c of [...labelCands].sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
      const sp = c.keys.map((k) => EQ.sceneSpec(k)).filter(Boolean); if (!sp.length) continue;
      const vis = sp.filter((s) => !s.tech || curMode === 'technical'); const use = vis.length ? vis : sp; const hidden = !vis.length;
      let best = use[0];
      if (use.length > 2) { let bd = Infinity; for (const s of use) { const d = use.reduce((a, t) => a + Math.hypot(s.anchor[0] - t.anchor[0], s.anchor[1] - t.anchor[1]), 0); if (d < bd) { bd = d; best = s; } } }
      const a = toPx(best.anchor[0], best.anchor[1]);
      if (a.x < 0 || a.y < 0 || a.x > lr.width || a.y > lr.height) continue;
      const el = document.createElement('button'); el.type = 'button'; el.tabIndex = -1;
      el.className = 'sc-label' + (c.selected ? ' sel' : '') + (c.tier ? ' tier' + c.tier : '') + (hidden ? ' hidden-in-mode' : '');
      el.dataset.id = c.id; el.dataset.fk = 'lbl-' + c.id;
      el.textContent = c.text;
      if (hidden) { const b = document.createElement('span'); b.className = 'sc-label-badge'; b.textContent = 'Technical'; el.appendChild(b); }
      if (c.work) { const b = document.createElement('span'); b.className = 'sc-label-work'; b.textContent = c.work; el.appendChild(b); }
      el.title = c.hint || c.text;
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onLabel && onLabel(c, hidden); });
      layer.appendChild(el);
      const lw = el.offsetWidth, lh = el.offsetHeight; let r = null;
      const tries = [[0, 0]]; for (let k = 1; k <= 7; k++) tries.push([0, -k], [0, k], [1, -k], [-1, -k], [1, k], [-1, k]);
      for (const [dx, dy] of tries) {
        const cand = { x: a.x - lw / 2 + dx * (lw / 2 + 6), y: a.y - lh - 6 + dy * (lh + 3), w: lw, h: lh };
        if (cand.x < 2 || cand.x + lw > lr.width - 2 || cand.y < 2 || cand.y + lh > lr.height - 2) continue;
        if (!hit(cand)) { r = cand; r.moved = dx !== 0 || dy !== 0; break; }
      }
      if (!r) { el.remove(); continue; }
      el.style.transform = `translate(${Math.round(r.x)}px, ${Math.round(r.y)}px)`;
      if (r.moved) {
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y); ln.setAttribute('x2', Math.min(Math.max(a.x, r.x), r.x + lw)); ln.setAttribute('y2', r.y + (a.y > r.y ? lh : 0));
        lines.appendChild(ln);
      }
      placed.push(r);
    }
  };

  /** union bounds of the visible elements for the keys (thin items get a minimum extent) */
  EQ.boundsOfKeys = (svg, keys) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    keys.forEach((k) => {
      const el = svg.querySelector('[data-key="' + k + '"]');
      if (!el || el.classList.contains('unbound')) return;
      if (el.classList.contains('tech-only') && !svg.classList.contains('mode-technical')) return;
      let b; try { b = el.getBBox(); } catch (e) { return; }
      if (!isFinite(b.x) || (b.width === 0 && b.height === 0)) return;
      const padx = Math.max(0, (0.5 - b.width) / 2), pady = Math.max(0, (0.5 - b.height) / 2);
      x0 = Math.min(x0, b.x - padx); y0 = Math.min(y0, b.y - pady); x1 = Math.max(x1, b.x + b.width + padx); y1 = Math.max(y1, b.y + b.height + pady);
    });
    return isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  };
  EQ.containerBounds = () => ({ x: HX0 - 0.4, y: Y(HR + 0.2), w: HX1 - HX0 + 0.8, h: HR - HB + 0.4 });

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clampView = (v) => {
    const w = Math.min(Math.max(v.w, 10), BASE.w), hh = w * (BASE.h / BASE.w);
    return { x: Math.min(Math.max(v.x, BASE.x - 4), BASE.x + BASE.w - w + 4), y: Math.min(Math.max(v.y, BASE.y - 4), BASE.y + BASE.h - hh + 4), w, h: hh };
  };
  /** Keep label/marker size constant in screen pixels: --k = user units per CSS pixel. */
  function setK(el) { const w = el.getBoundingClientRect().width || 900; el.style.setProperty('--k', (view.w / w).toFixed(4)); }
  function apply(v) {
    Object.assign(view, v);
    const el = document.getElementById('scene-svg');
    if (el) { el.setAttribute('viewBox', [view.x, view.y, view.w, view.h].join(' ')); setK(el); EQ.layoutSceneLabels(); }
  }
  /** Fit to bounds (instant when the user prefers reduced motion). A newer call or a drag cancels a running transition. */
  EQ.fitBounds = (b) => {
    cancelAnim();
    if (!b) return false;
    // padding: 70 % for small selections, at most 20 m for long ones (e.g. the full rope path) so a fit never equals a reset
    const w = Math.min(Math.max(Math.min(b.w * 1.7, b.w + 20), 34), BASE.w), hh = w * (BASE.h / BASE.w);
    animateTo(clampView({ x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - hh / 2, w, h: hh }));
    return true;
  };
  function animateTo(target) {
    if (reduced()) { apply(target); return; }
    const from = { ...view }, t0 = performance.now(), dur = 320;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      apply({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e });
      anim = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim = requestAnimationFrame(step);
  }
  function cancelAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }
  EQ.resetView = () => { cancelAnim(); animateTo({ ...BASE }); };
  EQ.zoomView = (f) => { cancelAnim(); const cx = view.x + view.w / 2, cy = view.y + view.h / 2; const w = view.w * f; apply(clampView({ x: cx - w / 2, y: cy - (w * BASE.h / BASE.w) / 2, w, h: 0 })); };
  function attachPanZoom(svg) {
    let drag = null;
    svg.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('.sc-hit')) return; // let picks through
      cancelAnim(); drag = { x: e.clientX, y: e.clientY, v: { ...view } };
      svg.setPointerCapture(e.pointerId); svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = svg.getBoundingClientRect(), k = drag.v.w / r.width;
      apply(clampView({ x: drag.v.x - (e.clientX - drag.x) * k, y: drag.v.y - (e.clientY - drag.y) * k, w: drag.v.w, h: 0 }));
    });
    const end = () => { drag = null; svg.classList.remove('dragging'); };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); EQ.zoomView(e.deltaY > 0 ? 1.12 : 0.89); }, { passive: false });
  }
})(window.EQ);
