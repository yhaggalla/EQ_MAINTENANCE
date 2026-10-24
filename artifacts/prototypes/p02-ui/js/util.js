/* Utilities: DOM builder, icons, formatting. No external dependencies; nothing is fetched. */
window.EQ = window.EQ || {};
(function (EQ) {
  const SVGNS = 'http://www.w3.org/2000/svg';

  /** h(tag, attrs, ...children). Text is always inserted as text nodes (no innerHTML). */
  EQ.h = function h(tag, attrs, ...kids) {
    const svg = /^(svg|g|path|rect|circle|line|polyline|polygon|text|use|title|defs|ellipse|tspan|image)$/.test(tag);
    const el = svg ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value' && !svg) { el.value = v; el.setAttribute('value', v); }
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return el;
  };
  const h = EQ.h;

  /* ---- Icons (inline sprite, 24x24 stroke icons drawn for this prototype) ---- */
  const ICONS = {
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
    'octagon-x': '<path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z"/><path d="m9 9 6 6m0-6-6 6"/>',
    'wrench': '<path d="M14.5 6.5a4 4 0 0 0 5 5l-9.7 9.7a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5a4 4 0 0 1 5-3.2l-2.4 2.4.6 2 2 .6 2.4-2.4a4 4 0 0 1-3.2 5"/>',
    'dashed': '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M9.5 9.7a2.6 2.6 0 0 1 5 .8c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>',
    'search': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    'filter': '<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
    'chevron-r': '<path d="m9 6 6 6-6 6"/>', 'chevron-d': '<path d="m6 9 6 6 6-6"/>',
    'lock': '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    'alert': '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2h.01"/>',
    'x': '<path d="m6 6 12 12M18 6 6 18"/>', 'plus': '<path d="M12 5v14M5 12h14"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'file': '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h5M9.5 15.5h5"/>',
    'refresh': '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4"/>',
    'edit': '<path d="m4 20 1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/>',
    'list': '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    'tree': '<path d="M4 5h6M4 12h6M4 19h6M10 5v14M10 12h4m-4 7h4M14 9h6v6h-6zM14 16h6v4h-6z"/>',
    'panel': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    'home': '<path d="m4 11 8-7 8 7v9h-5v-6H9v6H4z"/>',
    'gear': '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    'cube': '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    'eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    'zoom-in': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/>',
    'zoom-out': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8 11h6"/>',
    'fit': '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    'reset': '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    'cancel': '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    'history': '<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M12 8v4l3 2"/>',
    'wifi-off': '<path d="M3 3l18 18M8.5 12.9a6 6 0 0 1 3-1.3M5 9.5a10 10 0 0 1 4-2.2M15.5 7.5A10 10 0 0 1 19 9.5M12 17h.01"/>',
    // U1-C01: ship-to-shore quay crane in side elevation: portal legs and tie beam, girder and boom reaching out over the
    // water, A-frame apex with backstay and forestay, trolley rope and spreader, rails.
    'qc': '<path d="M1.5 10h21M5 20.5V10M10 20.5V10M5 15.5h5M3.5 20.5h3M8.5 20.5h3"/><path d="M7 10 8.5 3.5 10 10M8.5 3.5 1.5 10M8.5 3.5 22.5 10"/><path d="M17.5 10v4.5M15.6 14.5h3.8"/>',
    'rtg': '<path d="M3 17h18M5 17V6M19 17V6M3 6h18M9 6v5h6V6M8 21h2m4 0h2"/>',
    'es': '<rect x="4" y="8" width="16" height="8" rx="2"/><path d="M8 16v3M16 16v3M7 8V5h10v3M10 12h4"/>',
    'download': '<path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/>',
    // P02B additions
    'board': '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="16" y="4" width="5" height="16" rx="1"/>',
    'pause': '<path d="M8 5v14M16 5v14"/>', 'play': '<path d="m8 5 11 7-11 7z"/>',
    'tv': '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 21h6M12 17v4"/>',
    'camera': '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
    'flag': '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
    'chart': '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    'sync': '<path d="M4 12a8 8 0 0 1 13.5-5.8L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.5 5.8L4 16M4 20v-4h4"/>',
    'sliders': '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6"/>',
    'ext': '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    'inspect': '<circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M8 10.5l2 2 3-4"/>',
    'service': '<path d="M14.5 6.5a4 4 0 0 0 5 5l-9.7 9.7a2.1 2.1 0 0 1-3-3z"/><path d="M5 5l3 3"/>',
    'hold': '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
    'undo': '<path d="M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6"/>',
    'arrow-r': '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    'grid': '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  };
  EQ.icon = function icon(name, cls) {
    const s = h('svg', { class: 'icon' + (cls ? ' ' + cls : ''), viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    s.innerHTML = ICONS[name] || ICONS.info; // static, author-controlled strings only
    return s;
  };

  /* ---- Time: audit instants are shown in Asia/Colombo (UTC+05:30); business dates are plain dates ---- */
  const tzDT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  const tzT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  EQ.fmtInstant = (d) => (d ? tzDT.format(new Date(d)).replace(',', '') + ' (Asia/Colombo)' : '');
  EQ.fmtInstantShort = (d) => (d ? tzDT.format(new Date(d)).replace(',', '') : '');
  EQ.fmtTime = (d) => tzT.format(new Date(d));
  EQ.fmtDate = (iso) => {
    if (!iso) return 'Date unknown';
    const [y, m, dd] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
  };
  EQ.todayColombo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
  EQ.duration = (ms) => {
    const m = Math.max(0, Math.floor(ms / 60000));
    const d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
    if (d > 0) return d + ' d ' + hh + ' h';
    if (hh > 0) return hh + ' h ' + mm + ' min';
    return mm + ' min';
  };

  /* ---- Operational status model: exactly three statuses plus a neutral Unreported display ---- */
  EQ.STATUS = {
    readyForOps: { label: 'Ready for OPS', icon: 'check-circle' },
    breakdown: { label: 'Breakdown', icon: 'octagon-x' },
    maintenance: { label: 'Maintenance', icon: 'wrench' },
    unreported: { label: 'Unreported', icon: 'dashed' },
  };
  EQ.statusKey = (s) => s || 'unreported';
  EQ.statusBadge = (s, big) => {
    const k = EQ.statusKey(s), def = EQ.STATUS[k];
    return h('span', { class: 'badge st-' + k + (big ? ' lg' : '') }, EQ.icon(def.icon), def.label);
  };

  EQ.uid = (() => { let n = 1000; return (p) => (p || 'x') + '-' + (++n); })();
  EQ.byId = (arr, id) => arr.find((x) => x.id === id);
  EQ.plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
  EQ.cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
})(window.EQ);
