/* U1-C29: flat equipment illustrations for the EQ Fleet dashboard (cards, group headers, KPI tiles, TV mode).
   Drawn in-house for this prototype as plain SVG (no copied, traced or generated stock art). Flat fills, no gradients.
   - QC: ship-to-shore quay crane in side elevation at about 1 unit = 1 m from the J526A drawing family (rail gauge 30 m,
     outreach 70 m and boom 75.9 m from the waterside rail, girder tail 31 m behind the landside rail, girder underside
     50.5 m, apex about 83 m); CICT red structure and a light machinery house (documents/images.jpg, images2.jpg).
     A container ship is drawn under the boom for recognition only.
   - RTG: rubber-tyred gantry in span view (legs, top girder, trolley, operator cab, spreader, container rows, tyres,
     e-house); red structure as seen on the yard cranes in documents/images.jpg. Proportions are typical, not measured.
   - ES: empty container stacker (empty handler) in side view (mast, side-pick spreader, empty container, elevated cab,
     counterweight, wheels). Yellow body: generic; the CICT ES colour is not in the sources.
   Every visual part is a <g data-part="..."> so checks and reviewers can see what is drawn. Strings are static and
   author-controlled (same rule as EQ.icon). These are illustrations of the equipment type, not models of a unit. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h;
  // flat palette (CICT paint from UX_SPEC s5; the rest muted pastels for context)
  const RED = '#c7261c', RED_D = '#9e1d15', HOUSE = '#f4f5f3', HOUSE_L = '#c9cfd4', STEEL = '#3d464f', ROPE = '#59636d';
  const GLASS = '#cfe0eb', NAVY = '#24384c', WATER = '#d6e6f0', QUAY = '#d9dcdf', TYRE = '#2b3036', HUB = '#a3abb3';
  const C1 = '#6f8fb2', C2 = '#d2ab72', C3 = '#86a99b', C4 = '#aeb6be', C5 = '#c9886a';
  const box = (x, y, w, hh, fill, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${fill}"${extra || ''}/>`;
  // container seen from the side (long, corrugated) or from the door end (bars)
  const cSide = (x, y, w, hh, fill) => box(x, y, w, hh, fill, ' rx=".3"') + `<path d="${Array.from({ length: Math.max(1, Math.floor(w / 2.4)) - 1 }, (_, i) => 'M' + (x + (i + 1) * (w / Math.floor(w / 2.4))).toFixed(1) + ' ' + (y + 0.6) + 'v' + (hh - 1.2)).join('')}" stroke="#fff" stroke-opacity=".35" stroke-width=".35"/>`;
  const cEnd = (x, y, w, hh, fill) => box(x, y, w, hh, fill, ' rx=".4"') + `<path d="M${x + w * 0.5} ${y + 0.8}v${hh - 1.6}M${x + w * 0.25} ${y + 1.2}v${hh - 2.4}M${x + w * 0.75} ${y + 1.2}v${hh - 2.4}" stroke="#fff" stroke-opacity=".45" stroke-width=".5"/>` + box(x, y, w, hh, 'none', ' rx=".4" stroke="#000" stroke-opacity=".12" stroke-width=".5"');

  const QC = {
    vb: '0 0 140 90',
    parts: [
      ['water', box(0, 86, 74, 4, WATER)],
      ['quay', box(72, 86, 68, 4, QUAY) + box(72, 85.4, 68, 0.8, '#b9bec3')],
      ['ship', `<path d="M1 71h66l-3.5 15H4z" fill="${NAVY}"/><path d="M2.2 75h63.6" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>`
        + [[3, C1, 3], [10, C2, 4], [17, C4, 4], [24, C3, 3], [31, C1, 4], [38, C5, 2], [45, C2, 3], [52, C3, 4], [59, C4, 2]].map(([x, f, n]) => Array.from({ length: n }, (_, k) => cEnd(x, 71 - (k + 1) * 3.1, 6.6, 3, k === n - 1 && n > 2 ? C4 : f)).join('')).join('')],
      ['rails-and-bogies', box(70.5, 81, 15, 3.4, RED_D, ' rx=".6"') + box(100.5, 81, 15, 3.4, RED_D, ' rx=".6"') + [72.5, 76.5, 80.5, 84.5 - 1, 102.5, 106.5, 110.5, 114.5 - 1].map((x) => `<circle cx="${x}" cy="85" r="1.25" fill="${TYRE}"/>`).join('')],
      ['legs', `<path d="M76.3 81V35.8h3.6V81zM106.3 81V35.8h3.6V81z" fill="${RED}"/>`],
      ['portal', box(76.3, 35.8, 33.6, 3.4, RED) + box(79.9, 58, 26.4, 2.6, RED) + `<path d="M79.9 39.2l5 0-5 6zM106.3 39.2l-5 0 5 6z" fill="${RED}"/>`],
      ['boom-and-girder', `<path d="M2 33h137.5v3H5.5L2 34.6z" fill="${RED}"/><path d="M6 34.5h132" stroke="${RED_D}" stroke-width=".5"/>`],
      ['a-frame', `<path d="M78.2 33 83.4 3.3h2.2L80.6 33zM106.4 33 85.4 3.3h2.4L109 33z" fill="${RED}"/>` + box(82.6, 2.3, 5.6, 2, RED_D, ' rx=".4"')],
      ['forestays', `<path d="M84.5 4.2 50 33M84.5 4.2 15.5 33" stroke="${RED}" stroke-width="1.6" stroke-linecap="round"/>`],
      ['backstay', `<path d="M86.5 4.2 133 33" stroke="${RED}" stroke-width="1.6" stroke-linecap="round"/>`],
      ['machinery-house', box(111.5, 25.4, 25, 7.6, HOUSE, ` stroke="${HOUSE_L}" stroke-width=".5"`) + box(111.5, 25, 25, 1, '#dfe3e6') + box(128.6, 26.9, 6.4, 3.4, '#2d5f9b', ' rx=".3"') + `<path d="M114 29.5h12" stroke="${HOUSE_L}" stroke-width=".6"/>`],
      ['trolley', box(35.5, 36, 11, 2.8, STEEL, ' rx=".4"')],
      ['cab', box(37.8, 38.8, 6.4, 4.2, HOUSE, ` stroke="${HOUSE_L}" stroke-width=".4" rx=".4"`) + box(38.4, 40.6, 5.2, 1.4, NAVY, ' rx=".2"')],
      ['hoist-ropes', `<path d="M38.6 38.8V54.2M43.4 38.8V54.2" stroke="${ROPE}" stroke-width=".55"/>`],
      ['spreader', box(34.6, 54.2, 12.8, 1.6, STEEL, ' rx=".3"')],
      ['container', cSide(35, 55.8, 12, 3.4, C1)],
    ],
  };
  const RTG = {
    vb: '0 0 140 90',
    parts: [
      ['ground', box(0, 86, 140, 4, QUAY) + `<path d="M98 88h10M114 88h8" stroke="#fff" stroke-width=".8"/>`],
      ['container-rows', [[33, [C1, C2, C4, C3]], [43.4, [C3, C1, C2]], [53.8, [C2, C4, C1, C5]], [64.2, [C4, C3]], [74.6, [C5, C1, C2]], [85, [C1, C2, C3, C4]]].map(([x, fs]) => fs.map((f, k) => cEnd(x, 86 - (k + 1) * 10.4, 9.8, 10.2, f)).join('')).join('')],
      ['truck', box(97.5, 80, 13, 3, STEEL, ' rx=".5"') + box(98.5, 75.6, 5, 4.6, '#5d7286', ' rx=".6"') + `<circle cx="100" cy="84.6" r="1.5" fill="${TYRE}"/><circle cx="108" cy="84.6" r="1.5" fill="${TYRE}"/>`],
      ['legs', `<path d="M21 78V12h6.5v66zM112.5 78V12h6.5v66z" fill="${RED}"/><path d="M24.2 16v58M115.8 16v58" stroke="${RED_D}" stroke-width=".6" stroke-dasharray="1.6 1.4"/>`],
      ['sill-beams', box(16, 74, 17, 5, RED_D, ' rx=".8"') + box(107, 74, 31, 5, RED_D, ' rx=".8"')],
      ['tyres', [17.5, 25.5, 108.5, 116.5].map((x) => box(x, 79, 6, 7.4, TYRE, ' rx="1.6"') + box(x + 1.6, 81.4, 2.8, 2.6, HUB, ' rx=".6"')).join('')],
      ['girder', box(16, 8.5, 108, 5.5, RED, ' rx=".4"') + `<path d="M18 11.2h104" stroke="${RED_D}" stroke-width=".5"/>`],
      ['trolley', box(56, 2.6, 22, 6, HOUSE, ` stroke="${HOUSE_L}" stroke-width=".5" rx=".6"`) + box(56, 7.2, 22, 1.4, STEEL)],
      ['cab', box(79, 14, 7.6, 6.4, HOUSE, ` stroke="${HOUSE_L}" stroke-width=".4" rx=".5"`) + box(79.8, 16.4, 6, 2.2, NAVY, ' rx=".3"')],
      ['hoist-ropes', `<path d="M60.5 14V30.4M73.5 14V30.4" stroke="${ROPE}" stroke-width=".6"/>`],
      ['spreader', box(57, 30.4, 20, 1.8, STEEL, ' rx=".4"')],
      ['container', cEnd(62.1, 32.2, 9.8, 10.2, C2)],
      ['e-house', box(123.5, 58.4, 13.5, 15.6, HOUSE, ` stroke="${HOUSE_L}" stroke-width=".5" rx=".6"`) + `<path d="M126 62h9M126 64.5h9M126 67h9" stroke="${HOUSE_L}" stroke-width=".7"/>`],
    ],
  };
  const ESY = '#e2ac2c', ESY_D = '#c48f17';
  const ES = {
    vb: '0 0 124 90',
    parts: [
      ['ground', box(0, 86, 124, 4, QUAY)],
      ['container-stack', [C1, C3, C4, C2].map((f, k) => cEnd(2, 86 - (k + 1) * 13.2, 13, 13, f)).join('') + [C2, C5, C1].map((f, k) => cEnd(17, 86 - (k + 1) * 13.2, 13, 13, f)).join('')],
      ['mast', box(41, 7, 3, 72, STEEL) + box(45, 7, 3, 72, STEEL) + `<path d="M41 14h7M41 30h7M41 46h7M41 62h7" stroke="${STEEL}" stroke-width="1.2"/>` + box(40, 5.6, 9, 2.2, STEEL, ' rx=".5"')],
      ['spreader', box(36.5, 20, 6, 10, ESY_D, ' rx=".6"') + box(15, 25.6, 24, 2.6, STEEL, ' rx=".5"') + box(16, 28.2, 2, 3, STEEL) + box(29, 28.2, 2, 3, STEEL)],
      ['container', cEnd(16.5, 29.8, 13, 13, C4)],
      ['chassis', `<path d="M48 60h62l6 4v12H48z" fill="${ESY}"/>` + box(48, 72.6, 68, 3.4, ESY_D)],
      ['counterweight', `<path d="M92 50h22l4 6v10H92z" fill="${ESY_D}"/><path d="M98 53v8M102 53v8M106 53v8M110 53v8" stroke="#000" stroke-opacity=".18" stroke-width=".9"/>` + box(103, 41, 2.2, 9.5, STEEL)],
      ['cab', `<path d="M58 34h22v26H56z" fill="${ESY}"/>` + `<path d="M60 37h8.4v10H59.4zM70.4 37h7.4v10h-7.4z" fill="${GLASS}"/>` + box(56.8, 32, 24, 2.4, ESY_D, ' rx=".5"')],
      ['wheels', `<circle cx="60" cy="77" r="9" fill="${TYRE}"/><circle cx="60" cy="77" r="3.6" fill="${HUB}"/><circle cx="104" cy="78" r="8" fill="${TYRE}"/><circle cx="104" cy="78" r="3.2" fill="${HUB}"/>`],
    ],
  };
  const ART = { QC, RTG, ES };
  const NAMES = { QC: 'Ship-to-shore quay crane', RTG: 'Rubber-tyred gantry crane', ES: 'Empty container stacker' };
  EQ.FLEET_ART_PARTS = Object.fromEntries(Object.entries(ART).map(([k, a]) => [k, a.parts.map((p) => p[0])]));
  /** Flat illustration of an equipment type. Decorative (aria-hidden) unless a label is given. */
  EQ.fleetArt = function fleetArt(type, opts) {
    const a = ART[type] || ART.QC, o = opts || {};
    const s = h('svg', { class: 'eq-art eq-art-' + type.toLowerCase() + (o.cls ? ' ' + o.cls : ''), viewBox: a.vb, preserveAspectRatio: 'xMidYMax meet', 'data-art': type, 'aria-hidden': o.label ? null : 'true', role: o.label ? 'img' : null, 'aria-label': o.label || null, focusable: 'false' });
    s.innerHTML = a.parts.map(([k, svg]) => '<g data-part="' + k + '">' + svg + '</g>').join(''); // static, author-controlled strings only
    return s;
  };
  EQ.fleetArtName = (type) => NAMES[type] || type;
})(window.EQ);
