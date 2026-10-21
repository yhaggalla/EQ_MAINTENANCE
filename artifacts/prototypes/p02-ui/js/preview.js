/* LOW-COST QC PREVIEW PLACEHOLDER (P02).
   This is an inline SVG side-elevation schematic, NOT the P03 Three.js model and NOT a verified geometry source.
   - Horizontal spans use the verified baseline (rail gauge 30 m, outreach 70 m, backreach 20 m; rear girder extends further behind the landside rail).
   - Vertical proportions are ILLUSTRATIVE: overall height is not established (63 m is total lift height, not crane height).
   - Landside is left, waterside (boom side) is right, matching the J526A00 general arrangement.
   It exists to prove one selection model (tree = scene = URL), Overall/Technical modes, focus/fit, labels without hover,
   a separate legend, and fallbacks, with zero WebGL canvases. P03 replaces it; P10 binds the real viewer to the same contract. */
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

  /** Scene element specs. key = semantic node key (never a DB id). anchor = marker location. tech = Technical-only. */
  function specs() {
    return [
      { key: 'gantry.bogie.landside.a', label: 'Gantry bogie, landside', anchor: [25, 3.5], build: () => [rect(15, 0.5, 3.5, 10, 'sc-grey'), circ(17, 1.2, 1.1, 'sc-tech'), circ(23, 1.2, 1.1, 'sc-tech')] },
      { key: 'gantry.bogie.waterside.a', label: 'Gantry bogie, waterside', anchor: [55, 3.5], build: () => [rect(45, 0.5, 3.5, 10, 'sc-grey'), circ(47, 1.2, 1.1, 'sc-tech'), circ(53, 1.2, 1.1, 'sc-tech')] },
      { key: 'structure.portal.landside.leg.a', label: 'Portal landside leg', anchor: [21.5, 30], build: () => [poly([[18.6, 3.5], [21.4, 3.5], [21.8, 49], [18.2, 49]], 'sc-paint')] },
      { key: 'structure.portal.waterside.leg.a', label: 'Portal waterside leg', anchor: [51.6, 30], build: () => [poly([[48.6, 3.5], [51.4, 3.5], [51.8, 49], [48.2, 49]], 'sc-paint')] },
      { key: 'gantry.cable-reel.main', label: 'Gantry cable reel', anchor: [30, 9], build: () => [circ(27.5, 6.5, 3.1, 'sc-tech'), circ(27.5, 6.5, 1, 'sc-grey')] },
      { key: 'access.elevator.car', label: 'Elevator', anchor: [54, 30], build: () => [rect(52.4, 4, 48.5, 1.8, 'sc-house')] },
      { key: 'structure.girder.rear.main', label: 'Fixed rear girder', anchor: [-8, 51], build: () => [rect(-11, 49, 51, 61, 'sc-paint')] },
      { key: 'boom.main.girder', label: 'Boom girder', anchor: [118, 51], build: () => [rect(50, 49, 51, 74, 'sc-paint')] },
      { key: 'structure.mast.main', label: 'Mast / A-frame', anchor: [53.5, 62], build: () => [poly([[43, 51], [53.2, 51], [49.4, 79.4], [47.6, 79.4]], 'sc-paint'), line(48.5, 79.4, -11, 51, 'sc-paint-line')] },
      { key: 'boom.rope.set.main', label: 'Boom stays / rope set', anchor: [88, 62], rope: true, build: () => [line(48.5, 79, 100, 51, 'sc-rope'), line(48.5, 79, 122, 51, 'sc-rope')] },
      { key: 'hoist.rope.set.main', label: 'Main hoist rope set', anchor: [94, 36], rope: true, build: () => [line(21, 52.6, 93.4, 52.6, 'sc-rope'), line(93.4, 52.6, 92.9, 21.2, 'sc-rope'), line(93.4, 52.6, 95.1, 21.2, 'sc-rope')] },
      { key: 'trolley.rope.set.main', label: 'Trolley rope set', anchor: [60, 56], rope: true, dash: true, build: () => [line(21, 55.7, 98, 55.7, 'sc-rope')] },
      { key: 'trolley.frame', label: 'Trolley frame', anchor: [98, 54.5], build: () => [rect(86, 51, 54.5, 12, 'sc-paint')] },
      { key: 'cabin.operator.main', label: 'Operator cabin', anchor: [92.2, 49], build: () => [rect(86.5, 44.5, 49, 5.5, 'sc-house'), rect(87.3, 46.2, 47.8, 3.6, 'sc-tech')] },
      { key: 'headblock.frame', label: 'Headblock', anchor: [95.6, 21.2], build: () => [rect(92.4, 19.2, 21.2, 3.2, 'sc-paint')] },
      { key: 'spreader.frame', label: 'Spreader frame', anchor: [100, 19], build: () => [rect(89, 17.6, 19.2, 11, 'sc-paint')] },
      // Technical-only internals and approximate hotspots
      { key: 'hoist.drive.motor.a', label: 'Hoist motor A', tech: true, anchor: [7.2, 54.2], build: () => [rect(4.2, 51.6, 54.2, 3, 'sc-tech')] },
      { key: 'hoist.drive.gearbox.a', label: 'Gearbox A', tech: true, anchor: [9.4, 54.2], build: () => [rect(7.4, 51.6, 54.2, 2, 'sc-tech')] },
      { key: 'hoist.drive.drum.a', label: 'Hoist drum A', tech: true, anchor: [13.8, 55], build: () => [rect(9.8, 51.6, 55, 4, 'sc-tech'), line(10.4, 53.3, 13.2, 53.3, 'sc-deco')] },
      { key: 'hoist.emergency.brake.a', label: 'Emergency brake A', tech: true, anchor: [15.4, 54], build: () => [rect(14.1, 52, 54, 1.4, 'sc-grey')] },
      { key: 'hoist.drive.motor.b', label: 'Hoist motor B', tech: true, anchor: [18.8, 54.2], build: () => [rect(15.8, 51.6, 54.2, 3, 'sc-tech')] },
      { key: 'trolley.wheel.position.a', label: 'Trolley wheel A', tech: true, anchor: [89, 52.5], build: () => [circ(88.2, 51.7, 1, 'sc-tech')] },
      { key: 'trolley.wheel.position.b', label: 'Trolley wheel B', tech: true, anchor: [97, 52.5], build: () => [circ(96.4, 51.7, 1, 'sc-tech')] },
      { key: 'hoist.loadcell.main', label: 'Load cell (approx.)', tech: true, hotspot: true, anchor: [95.6, 54.2], build: () => [circ(94.6, 53.6, 0.95, 'sc-hot')] },
      { key: 'electrical.plc.main', label: 'PLC (approx.)', tech: true, hotspot: true, anchor: [20.8, 58], build: () => [circ(19.7, 57.2, 0.95, 'sc-hot')] },
      { key: 'electrical.control-power.main', label: 'Control power (approx.)', tech: true, hotspot: true, anchor: [20.8, 55.4], build: () => [circ(19.7, 54.8, 0.95, 'sc-hot')] },
      { key: 'electrical.hv.switchgear', label: 'HV switchgear (approx.)', tech: true, hotspot: true, anchor: [13, 58.6], build: () => [circ(11.8, 57.6, 0.95, 'sc-hot')] },
    ];
  }
  EQ.sceneKeys = () => specs().map((s) => s.key);
  EQ.sceneKeyLabel = (k) => specs().find((s) => s.key === k)?.label || k;

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
  ];

  /**
   * Build the scene SVG.
   * opts: {mode, getPos(key)->position|undefined, selectedKeys:Set, work:Map(key->count)|null, showWork, onPick(key), onContainer(), containerSel}
   */
  EQ.buildScene = function buildScene(opts) {
    const tech = opts.mode === 'technical';
    const hasSel = opts.selectedKeys.size > 0;
    const svg = h('svg', { id: 'scene-svg', class: 'scene ' + (tech ? 'mode-technical' : 'mode-overall'), viewBox: [view.x, view.y, view.w, view.h].join(' '), role: 'group', 'aria-label': 'Schematic side view of a quay crane, landside left, waterside right. Placeholder, not the verified 3D model. Use the mechanism tree or the assembly buttons for the same selection.' });
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // Decorative context (not selectable)
    svg.appendChild(h('g', { class: 'deco', 'aria-hidden': 'true' },
      h('rect', { x: -14, y: Y(0), width: 69.5, height: 24, fill: '#d3dae0' }),
      h('rect', { x: 55.5, y: Y(-16), width: 75, height: 8, fill: '#b9d6e8' }),
      line(55.5, 0, 55.5, -16, 'sc-deco'),
      rect(19.6, 0, 0.5, 0.8, null, { fill: '#38444e' }), rect(49.6, 0, 0.5, 0.8, null, { fill: '#38444e' }),
      line(21.6, 12, 48.4, 12.8, 'sc-paint-line'), line(21.6, 12.6, 48.4, 47, 'sc-paint-line'),
      h('polyline', { points: Array.from({ length: 13 }, (_, i) => (i % 2 ? 18.4 : 16) + ',' + Y(4 + 2 * i)).join(' '), fill: 'none', class: 'sc-deco' }),
      circ(50, 50, 0.9, 'sc-grey'),
      h('text', { x: -12, y: Y(-5), class: 'sc-text' }, 'LANDSIDE'),
      h('text', { x: 100, y: Y(-12.5), class: 'sc-text' }, 'WATERSIDE (boom side)'),
      h('text', { x: 58, y: Y(-18.2), class: 'sc-text small' }, 'Water level approximate, illustrative'),
      h('text', { x: 28, y: Y(-3), class: 'sc-text small' }, 'Rail gauge 30 m'),
      line(20, -1.2, 50, -1.2, 'sc-deco'),
    ));
    // Machinery house (container: spatial group only, never a mechanism)
    const house = h('g', { class: 'sc-hit' + (opts.containerSel ? ' sel' : ''), 'data-container': 'machinery-house', 'data-fk': 'sc-house', tabindex: 0, role: 'button', 'aria-label': 'Machinery house, spatial container. Enter lists the positions it contains; it is not a mechanism.', 'aria-pressed': opts.containerSel ? 'true' : 'false' },
      h('title', null, 'Machinery house (container, not a mechanism)'),
      h('rect', { x: 3, y: Y(59), width: 18.5, height: 8, class: 'sc-house' + (tech ? ' xray' : '') }));
    house.addEventListener('click', () => opts.onContainer());
    house.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onContainer(); } });
    const gHouse = [];
    // Order: structure first, then ropes, then house, then technical internals (so x-ray internals stay pickable)
    const all = specs();
    const add = (s) => {
      const pos = opts.getPos(s.key);
      const sel = opts.selectedKeys.has(s.key);
      const g = h('g', {
        class: 'sc-hit' + (s.tech ? ' tech-only' : '') + (sel ? ' sel' : '') + (hasSel && !sel ? ' dim' : '') + (pos ? '' : ' unbound'),
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
    // Always-visible labels for major assemblies (priority-declustered by fixed placement)
    const lab = (x, hh, t, techOnly) => h('text', { x, y: Y(hh), class: 'sc-text' + (techOnly ? ' tech-only' : ' overall-only') }, t);
    svg.appendChild(h('g', { 'aria-hidden': 'true' },
      lab(4, 60.6, 'Machinery house'), lab(-12, 46.6, 'Rear girder'), lab(51.5, 76, 'Mast / A-frame'), lab(106, 62, 'Boom stays'), lab(108, 46.6, 'Boom'),
      lab(99.5, 53, 'Trolley'), lab(72, 46, 'Cabin'), lab(101, 18.2, 'Spreader'), lab(22.6, 40, 'Portal'), lab(33, 6, 'Gantry'),
      h('text', { x: 3, y: Y(63), class: 'sc-text tech-only' }, 'Machinery house (enclosure shown transparent)'),
      h('text', { x: 3.5, y: Y(50), class: 'sc-text small tech-only' }, 'Internals: layout approximate / simplified'),
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
    if (window.ResizeObserver) new ResizeObserver(() => setK(svg)).observe(svg);
    return svg;
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
  EQ.containerBounds = () => ({ x: 3, y: Y(59), w: 18.5, h: 8 });

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
    if (el) { el.setAttribute('viewBox', [view.x, view.y, view.w, view.h].join(' ')); setK(el); }
  }
  /** Fit to bounds (instant when the user prefers reduced motion). A newer call or a drag cancels a running transition. */
  EQ.fitBounds = (b) => {
    cancelAnim();
    if (!b) return false;
    const w = Math.min(Math.max(b.w * 1.7, 34), BASE.w), hh = w * (BASE.h / BASE.w);
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
