/* FAC Dashboard (SOW V2 s5.5, DATA_CONTRACT s18.4). A persistent component: the DOM is built once and patched in place on every
   data refresh, so the scroll offsets, the layout and the focus are never reset (no layout jump). Moving lists are driven by
   requestAnimationFrame at a measured speed (px/s) from the Admin setting; they pause on hover, on keyboard focus and with the
   Pause button; prefers-reduced-motion switches to an 8 s page flip; a static view and a collapsed full table are the accessible
   alternatives. Keyboard: one tab stop per lane and for the ticker (roving tabindex), so there is no focus trap.
   SYNTHETIC: all progress, photos and users are fictional (labelled on the page). */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const F = () => EQ.fac;
  const dash = (EQ.dash = { root: null, q: null, model: null, lastGood: null, paused: false, staticMode: false, raf: null, last: 0, hover: false, focus: false, lanes: {}, ticker: null, proof: { i: 0, clock: 0 }, signature: {}, mql: null, phone: false, reduced: false, speedScale: 1, stats: { frames: 0 } });
  const FLIP_S = 8, PROOF_S = 6;
  const LANE_CODES = [['electrical', 'Electrical'], ['mechanical', 'Mechanical'], ['civil', 'Civil']];
  const STATUS_ICON = { overdue: 'octagon-x', onHold: 'hold', inProgress: 'clock', dueSoon: 'flag', pending: 'dashed', completed: 'check-circle', recent: 'check-circle' };
  const GROUP_CLASS = { overdue: 'g-overdue', onHold: 'g-hold', inProgress: 'g-prog', dueSoon: 'g-soon', pending: 'g-pend', recent: 'g-done' };

  // ---------------------------------------------------------------- shared row pieces (also used by FAC Jobs)
  EQ.facPill = function facPill(status, overdue, dueSoon) {
    const k = overdue ? 'overdue' : status === 'completed' ? 'completed' : status;
    const label = overdue ? 'Overdue' : F().STATUS_NAME[status];
    return h('span', { class: 'pill st-' + k }, icon(STATUS_ICON[k] || 'dashed'), label);
  };
  EQ.facBar = function facBar(done, target, pct) {
    return h('span', { class: 'prog' }, h('span', { class: 'bar', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.min(100, pct) + '%' })), h('span', { class: 'qty' }, done + '/' + target + ' · ' + pct + ' %'));
  };
  function rowLabel(r) {
    return r.name + '. ' + F().TYPE_NAME[r.type] + ', ' + r.freq + (r.pic !== 'Unassigned' ? ', PIC ' + r.pic : '') + (r.mode ? ', ' + r.mode : '') + '. ' + (r.overdue ? 'Overdue' : F().STATUS_NAME[r.status]) + ', ' + r.done + ' of ' + r.target + ' done, ' + r.pct + ' percent. ' + r.dueLabel + (r.holdReason ? '. On hold: ' + r.holdReason : '') + '.';
  }
  function rowEl(r, o) {
    o = o || {};
    const a = h('a', { class: 'row-link', href: F().jobHref(r.id), 'aria-label': rowLabel(r), tabindex: o.tab0 ? '0' : '-1', 'data-key': r.key },
      h('span', { class: 'thumb' }, r.thumb ? h('img', { src: r.thumb, alt: '', loading: 'lazy' }) : icon(r.type === 'inspection' ? 'inspect' : 'service')),
      h('span', { class: 'main' },
        h('span', { class: 'name', title: r.name }, r.name),
        h('span', { class: 'meta' }, icon(r.type === 'inspection' ? 'inspect' : 'service'), F().TYPE_NAME[r.type] + ' · ' + r.freq + ' · ' + r.pic + (r.mode ? ' · ' + r.mode : '')),
        r.holdReason ? h('span', { class: 'hold-reason' }, 'On hold: ' + r.holdReason) : EQ.facBar(r.done, r.target, r.pct)),
      h('span', { class: 'side' }, EQ.facPill(r.status, r.overdue, r.dueSoon), h('span', { class: 'due due-' + r.dueKind }, r.dueLabel)));
    const li = h('li', { class: 'frow ' + (GROUP_CLASS[r.group] || ''), 'data-key': r.key, 'data-sig': r.sig }, a);
    if (o.disc) li.querySelector('.meta').appendChild(h('span', { class: 'disc d-' + r.discipline }, F().DISC_NAME[r.discipline]));
    return li;
  }

  // ---------------------------------------------------------------- persistent DOM
  function ring(pct) {
    const r = 15.5, c = 2 * Math.PI * r;
    return h('svg', { class: 'ring', viewBox: '0 0 40 40', role: 'img', 'aria-label': pct + ' percent of jobs completed' },
      h('circle', { cx: 20, cy: 20, r, fill: 'none', 'stroke-width': 5, class: 'ring-bg' }), h('circle', { cx: 20, cy: 20, r, fill: 'none', 'stroke-width': 5, class: 'ring-fg', 'stroke-dasharray': (c * pct / 100).toFixed(1) + ' ' + c.toFixed(1), transform: 'rotate(-90 20 20)' }),
      h('text', { x: 20, y: 24, 'text-anchor': 'middle', class: 'ring-t' }, pct + '%'));
  }
  function build() {
    const root = h('div', { class: 'fac-dash', 'data-motion': 'scroll' });
    const lanesEl = h('section', { class: 'lanes', 'aria-label': 'Job lanes by discipline' });
    dash.lanes = {};
    LANE_CODES.forEach(([code, name]) => {
      const list = h('ol', { class: 'lane-list', 'aria-label': name + ' jobs in dashboard order', role: 'list' });
      const dup = h('ol', { class: 'lane-list dup', 'aria-hidden': 'true', role: 'presentation' });
      const track = h('div', { class: 'lane-track' }, list, dup);
      const view = h('div', { class: 'lane-view' }, track);
      const title = h('h2', { id: 'lane-h-' + code }, name), cnt = h('span', { class: 'lane-count' }), pageInd = h('span', { class: 'page-ind', hidden: true }), ringHost = h('span', { class: 'ring-host' });
      const el = h('section', { class: 'lane d-' + code, 'aria-labelledby': 'lane-h-' + code, 'data-lane': code }, h('header', null, ringHost, h('div', { class: 'lane-title' }, title, cnt), pageInd), view);
      const L = { code, name, el, view, track, list, dup, cnt, pageInd, ringHost, offset: 0, page: 0, flip: 0, rowH: 80, T: 0, moving: false, rows: new Map(), rowsB: new Map(), keys: [], rovingKey: null, hover: false, focus: false, sigOfRing: '' };
      view.addEventListener('pointerenter', () => { L.hover = true; });
      view.addEventListener('pointerleave', () => { L.hover = false; });
      el.addEventListener('focusin', () => { L.focus = true; });
      el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) L.focus = false; });
      list.addEventListener('keydown', (e) => laneKey(L, e));
      dash.lanes[code] = L; lanesEl.appendChild(el);
    });
    // combined list (phone): one list, no auto-scroll
    const combined = h('section', { class: 'combined', 'aria-label': 'All jobs in dashboard order' }, h('h2', null, 'Jobs'), h('ol', { class: 'combined-list', role: 'list' }));
    // ticker
    const tList = h('ol', { class: 'tick-list', 'aria-label': 'Latest progress updates', role: 'list' }), tDup = h('ol', { class: 'tick-list dup', 'aria-hidden': 'true', role: 'presentation' });
    const tTrack = h('div', { class: 'tick-track' }, tList, tDup), tView = h('div', { class: 'tick-view' }, tTrack);
    const ticker = h('section', { class: 'ticker', 'aria-label': 'Live ticker: latest progress updates' }, h('span', { class: 'live-badge' }, icon('sync'), 'LIVE'), tView);
    dash.ticker = { el: ticker, view: tView, track: tTrack, list: tList, dup: tDup, offset: 0, itemW: 380, T: 0, moving: false, items: new Map(), itemsB: new Map(), hover: false, focus: false, rovingKey: null };
    tView.addEventListener('pointerenter', () => { dash.ticker.hover = true; }); tView.addEventListener('pointerleave', () => { dash.ticker.hover = false; });
    ticker.addEventListener('focusin', () => { dash.ticker.focus = true; }); ticker.addEventListener('focusout', (e) => { if (!ticker.contains(e.relatedTarget)) dash.ticker.focus = false; });
    tList.addEventListener('keydown', (e) => tickKey(e));
    // bottom row: proof + due load
    const proof = h('section', { class: 'proof', 'aria-roledescription': 'carousel', 'aria-label': 'Latest proof: newest completion photos' });
    const load = h('section', { class: 'load', 'aria-labelledby': 'load-h' }, h('h2', { id: 'load-h' }, 'Due in the next 8 weeks'), h('div', { class: 'load-chart' }), h('p', { class: 'small muted load-note' }));
    const bottom = h('div', { class: 'dash-bottom' }, proof, load);
    const staticAlt = h('details', { class: 'static-alt', id: 'dash-static' }, h('summary', { 'data-fk': 'static-summary' }, 'Static list of all dashboard jobs (no motion, for screen readers and keyboard use)'), h('div', { class: 'static-body' }));
    const head = h('header', { class: 'dash-head' }, h('div', { class: 'dash-title' }, h('h1', null, 'FAC Dashboard'), h('span', { class: 'tag gold proto-tag' }, 'Prototype, synthetic progress'), h('p', { class: 'updated', 'aria-live': 'off' })), h('div', { class: 'dash-tools' }));
    const skip = h('a', { class: 'skip-dash', href: '#dash-static', onClick: (e) => { e.preventDefault(); staticAlt.open = true; root.querySelector('[data-fk="static-summary"]').focus(); staticAlt.scrollIntoView({ block: 'center' }); } }, 'Skip the moving lists to the static list');
    root.append(skip, head, h('div', { class: 'dash-banner' }), h('form', { class: 'dash-filters', role: 'search', 'aria-label': 'Dashboard filters', onSubmit: (e) => e.preventDefault() }), h('section', { class: 'kpis', 'aria-label': 'Key figures' }), lanesEl, combined, ticker, bottom, staticAlt, h('p', { class: 'overlay-note small muted' }));
    dash.refs = { head, tools: head.querySelector('.dash-tools'), updated: head.querySelector('.updated'), banner: root.querySelector('.dash-banner'), filters: root.querySelector('.dash-filters'), kpis: root.querySelector('.kpis'), combined, proof, load, staticAlt, note: root.querySelector('.overlay-note') };
    dash.root = root; dash.proof = { i: 0, clock: 0, key: null, paused: false, sig: '' };
    return root;
  }

  // ---------------------------------------------------------------- keyboard (roving tab stop: Tab leaves the lane)
  function laneKey(L, e) {
    const links = [...L.list.querySelectorAll('.row-link')];
    const i = links.indexOf(document.activeElement); if (i < 0) return;
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : null;
    if (to == null) return;
    e.preventDefault();
    const j = Math.max(0, Math.min(links.length - 1, to));
    setRoving(L, links, j); links[j].focus({ preventScroll: true }); reveal(L, j);
  }
  function setRoving(L, links, j) { links.forEach((a, k) => a.setAttribute('tabindex', k === j ? '0' : '-1')); L.rovingKey = links[j] && links[j].dataset.key; }
  function reveal(L, idx) {
    if (dash.staticMode) { const li = L.list.children[idx]; if (li) li.scrollIntoView({ block: 'nearest' }); return; }
    const top = idx * L.rowH, vh = L.view.clientHeight;
    if (L.moving && (top < L.offset || top + L.rowH > L.offset + vh)) L.offset = Math.max(0, Math.min(L.T - 1, top - L.rowH));
    if (dash.reduced) L.page = Math.floor(idx / Math.max(1, Math.floor(vh / L.rowH)));
    paint(L);
  }
  function tickKey(e) {
    const T = dash.ticker; const links = [...T.list.querySelectorAll('.tick-link')]; const i = links.indexOf(document.activeElement); if (i < 0) return;
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : null; if (to == null) return;
    e.preventDefault(); const j = Math.max(0, Math.min(links.length - 1, to));
    links.forEach((a, k) => a.setAttribute('tabindex', k === j ? '0' : '-1')); T.rovingKey = links[j].dataset.key; links[j].focus({ preventScroll: true });
    const left = j * T.itemW; if (T.moving && (left < T.offset || left + T.itemW > T.offset + T.view.clientWidth)) T.offset = Math.max(0, left - T.itemW); paintTicker();
  }

  // ---------------------------------------------------------------- patch (no reset, anchor kept)
  function syncList(listEl, cache, rows, make, glowKeys, isCopy) {
    const want = new Set(rows.map((r) => r.key));
    cache.forEach((v, k) => { if (!want.has(k)) { v.el.remove(); cache.delete(k); } });
    let prev = null;
    rows.forEach((r) => {
      let c = cache.get(r.key);
      if (!c || c.sig !== r.sig) {
        const fresh = make(r);
        if (c) { const had = c.el.contains(document.activeElement) ? c.el.querySelector('a') && c.el.querySelector('a').getAttribute('tabindex') : null; const focused = c.el.contains(document.activeElement); c.el.replaceWith(fresh); if (focused) { const a = fresh.querySelector('a'); if (a) { a.setAttribute('tabindex', '0'); a.focus({ preventScroll: true }); } } } else if (glowKeys && !isCopy) glowKeys.add(r.key);
        if (c && glowKeys && !isCopy) glowKeys.add(r.key);
        c = { el: fresh, sig: r.sig }; cache.set(r.key, c);
        if (!fresh.parentNode) listEl.insertBefore(fresh, prev ? prev.nextSibling : listEl.firstChild);
      }
      if (prev ? c.el.previousSibling !== prev : listEl.firstChild !== c.el) listEl.insertBefore(c.el, prev ? prev.nextSibling : listEl.firstChild);
      prev = c.el;
    });
  }
  function patchLane(L, lane) {
    const rows = lane.rows;
    const anchorIdx = L.rowH ? Math.floor(L.offset / L.rowH) : 0, frac = L.rowH ? (L.offset - anchorIdx * L.rowH) / L.rowH : 0;
    const anchorKey = L.keys[anchorIdx];
    const glow = new Set(); const hadRows = L.rows.size > 0;
    syncList(L.list, L.rows, rows, (r) => { const li = rowEl(r, { tab0: false }); return li; }, glow, false);
    syncList(L.dup, L.rowsB, rows, (r) => { const li = rowEl(r); li.querySelector('a').setAttribute('tabindex', '-1'); return li; }, null, true);
    if (!hadRows) glow.clear();
    L.keys = rows.map((r) => r.key);
    // roving tab stop: keep the current one when it still exists, else the first row
    const links = [...L.list.querySelectorAll('.row-link')];
    const keep = links.findIndex((a) => a.dataset.key === L.rovingKey);
    setRoving(L, links, keep >= 0 ? keep : 0);
    // measure and keep the anchor row where it was (no jump when rows are added, removed or reordered above)
    const li0 = L.list.firstElementChild; if (li0) L.rowH = li0.getBoundingClientRect().height || L.rowH;
    L.T = L.keys.length * L.rowH;
    if (anchorKey && L.keys.includes(anchorKey)) L.offset = L.keys.indexOf(anchorKey) * L.rowH + frac * L.rowH;
    if (L.T > 0) L.offset = L.offset % L.T;
    glow.forEach((k) => { [L.rows.get(k), L.rowsB.get(k)].forEach((c) => c && c.el.classList.add('glow')); setTimeout(() => { [L.rows.get(k), L.rowsB.get(k)].forEach((c) => c && c.el.classList.remove('glow')); }, 5000); });
    L.cnt.textContent = rows.length + ' in the list · ' + lane.total + ' active';
    const rs = lane.pct + '|' + lane.completed + '|' + lane.total;
    if (L.sigOfRing !== rs) { L.sigOfRing = rs; L.ringHost.replaceChildren(ring(lane.pct)); }
  }
  function patchTicker(items) {
    const T = dash.ticker;
    const mk = (it, copy) => {
      const when = EQ.fmtTime(it.at).slice(0, 5);
      const txt = it.kind === 'hold' ? 'put on hold' : it.kind === 'release' ? 'released' : '+' + it.qty + (it.completed ? ' · completed' : '');
      const a = h('a', { class: 'tick-link' + (it.completed ? ' done' : ''), href: F().jobHref(it.jobId), 'data-key': it.key, tabindex: '-1', 'aria-label': when + ' ' + it.who + ', ' + it.jobName + ', ' + txt.replace('·', ',') }, h('span', { class: 'tk-t' }, when), h('span', { class: 'tk-w' }, it.who.replace('Synthetic ', '')), h('span', { class: 'tk-j', title: it.jobName }, it.jobName), h('span', { class: 'tk-q' }, it.completed ? icon('check-circle') : null, txt));
      if (copy) a.setAttribute('tabindex', '-1');
      return h('li', { class: 'tick', 'data-key': it.key, 'data-sig': it.key }, a);
    };
    const hadFirst = T.items.size > 0;
    const add = items.filter((it) => !T.items.has(it.key));
    const rows = items.map((it) => ({ ...it, sig: it.key }));
    syncList(T.list, T.items, rows.map((r) => ({ ...r, key: r.key })), (r) => mk(r, false), null, true);
    syncList(T.dup, T.itemsB, rows, (r) => mk(r, true), null, true);
    const w = T.list.firstElementChild ? T.list.firstElementChild.getBoundingClientRect().width : T.itemW; if (w) T.itemW = w;
    if (hadFirst && add.length) { T.offset += add.length * T.itemW; add.forEach((it) => { const c = T.items.get(it.key); if (c) { c.el.classList.add('glow'); setTimeout(() => c.el.classList.remove('glow'), 8000); } }); }
    T.T = items.length * T.itemW;
    if (T.T) T.offset = T.offset % T.T;
    const links = [...T.list.querySelectorAll('.tick-link')]; const k = links.findIndex((a) => a.dataset.key === T.rovingKey); links.forEach((a, i) => a.setAttribute('tabindex', i === (k >= 0 ? k : 0) ? '0' : '-1')); T.rovingKey = links[k >= 0 ? k : 0] && links[k >= 0 ? k : 0].dataset.key;
  }

  function kpiTiles(m, q) {
    const k = m.kpi;
    const T = (id, label, value, cap, focus, cls) => ({ id, label, value, cap, focus, cls });
    return [T('active', 'Active jobs', k.active, 'in the master list'), T('completed', 'Completed', k.completed, 'this cycle', 'completed', 'ok'), T('inProgress', 'In progress', k.inProgress, 'part of the quantity done', 'inProgress'), T('onHold', 'On hold', k.onHold, 'needs a reason', 'onHold', 'hold'),
      T('overdue', 'Overdue', k.overdue, 'past the due date', 'overdue', 'bad'), T('dueSoon', 'Due in ' + m.settings.dueSoonDays + ' d', k.dueSoon, 'rolling jobs; daily and weekly are in checks', 'dueSoon', 'soon'),
      T('ontime', 'On time, 30 d', k.onTimePct == null ? '-' : k.onTimePct + ' %', k.onTimePct == null ? 'no cycles completed yet' : k.onTimeOk + ' of ' + k.onTimeN + ' cycles'), T('checks', "Today's checks", k.checksDone + ' of ' + k.checksTotal, 'daily jobs done today')];
  }
  function patchKpis(m, q) {
    const host = dash.refs.kpis;
    const tiles = kpiTiles(m, q);
    if (host.children.length !== tiles.length) {
      host.replaceChildren(...tiles.map((t) => {
        const inner = [h('span', { class: 'k-l' }, ''), h('span', { class: 'k-n' }, ''), h('span', { class: 'k-c' }, '')];
        return t.focus ? h('button', { type: 'button', class: 'kpi k-' + (t.cls || ''), 'data-kpi': t.id, 'data-fk': 'kpi-' + t.id, onClick: () => { const cur = EQ.route.query.focus; EQ.nav('/fac/dashboard', { ...EQ.route.query, focus: cur === t.focus ? '' : t.focus }); } }, ...inner)
          : h('div', { class: 'kpi k-' + (t.cls || '') + ' static', 'data-kpi': t.id, role: 'group' }, ...inner);
      }));
    }
    tiles.forEach((t, i) => {
      const el = host.children[i]; const [l, n, c] = el.children;
      if (l.textContent !== t.label) l.textContent = t.label; const nv = String(t.value); if (n.textContent !== nv) n.textContent = nv; if (c.textContent !== t.cap) c.textContent = t.cap;
      if (t.focus) { el.setAttribute('aria-pressed', q.focus === t.focus ? 'true' : 'false'); el.setAttribute('aria-label', t.label + ': ' + nv + (q.focus === t.focus ? ', filter on' : ', show only these in the lists')); }
      else el.setAttribute('aria-label', t.label + ': ' + nv + ', ' + t.cap);
    });
  }
  function patchFilters(m, q) {
    const f = dash.refs.filters;
    const sig = JSON.stringify([q.discipline, q.type, q.mode, q.pic, q.focus]);
    if (f.dataset.sig === sig) return; f.dataset.sig = sig;
    const set = (patch) => EQ.nav('/fac/dashboard', { ...EQ.route.query, ...patch });
    const pics = [...new Set(EQ.state.D.fac.jobs.map((x) => x.picName).filter(Boolean))];
    const sel = (id, label, key, opts, any) => h('div', { class: 'field' }, h('label', { for: id }, label), h('select', { id, 'data-fk': id, onChange: (e) => set({ [key]: e.target.value }) }, h('option', { value: '' }, any), opts.map(([v, l]) => h('option', { value: v, selected: q[key] === v ? true : null }, l))));
    f.replaceChildren(...[sel('df-d', 'Discipline', 'discipline', LANE_CODES, 'All disciplines'), sel('df-t', 'Type', 'type', [['inspection', 'Inspection'], ['service', 'Service']], 'All types'), sel('df-m', 'In-house / Outsource', 'mode', [['inHouse', 'In-house'], ['outsource', 'Outsource']], 'All'),
      sel('df-p', 'PIC', 'pic', [['me', 'Me (' + EQ.user().name + ')'], ...pics.map((p) => [p, p]), ['unassigned', 'Unassigned']], 'Everyone'),
      q.focus ? h('span', { class: 'tag gold' }, 'Showing: ' + ({ completed: 'Completed', inProgress: 'In progress', onHold: 'On hold', overdue: 'Overdue', dueSoon: 'Due soon' }[q.focus])) : null,
      h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.nav('/fac/dashboard', EQ.route.query.tv ? { tv: '1' } : {}) }, 'Clear filters')].filter(Boolean));
  }
  function patchTools(m, q) {
    const T = dash.refs.tools;
    const tv = q.tv === '1';
    const sig = [dash.paused, dash.staticMode, tv, dash.reduced].join('|');
    if (T.dataset.sig === sig) return; T.dataset.sig = sig;
    T.replaceChildren(...[
      h('button', { type: 'button', class: 'btn-sm', 'aria-pressed': dash.paused ? 'true' : 'false', 'data-fk': 'dash-pause', 'aria-label': dash.paused ? 'Resume the moving lists' : 'Pause the moving lists', onClick: () => { dash.paused = !dash.paused; patchTools(dash.model, EQ.route.query); } }, icon(dash.paused ? 'play' : 'pause'), dash.paused ? 'Resume' : 'Pause'),
      h('button', { type: 'button', class: 'btn-sm', 'aria-pressed': dash.staticMode ? 'true' : 'false', 'data-fk': 'dash-static', onClick: () => { dash.staticMode = !dash.staticMode; EQ.nav('/fac/dashboard', { ...EQ.route.query, motion: dash.staticMode ? 'off' : '' }); } }, icon('list'), 'Static view'),
      EQ.access.has('export.excel') && EQ.access.has('fac.jobs.view') && !tv ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'dash-export', title: 'Exports the FAC Jobs list with the dashboard filters (needs the FAC Jobs tab, D-140)', onClick: () => { const r = F().exportRows({ discipline: q.discipline, type: q.type, mode: q.mode, pic: q.pic }); if (r.ok) { EQ.downloadCsv('fac-dashboard-jobs.csv', r.columns, r.rows); EQ.toast('Exported ' + r.rows.length + ' filtered job(s)', 'Prototype stand-in: CSV, not the server-generated .xlsx.'); } else EQ.toast(r.message); } }, icon('download'), 'Export') : null,
      h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'dash-refresh', onClick: () => EQ.refresh(true) }, icon('refresh'), 'Refresh'),
      tv ? h('button', { type: 'button', class: 'btn-sm primary', 'data-fk': 'dash-tv', onClick: () => { try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ } EQ.nav('/fac/dashboard', { ...EQ.route.query, tv: '' }); } }, icon('x'), 'Exit TV mode')
        : h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'dash-tv', onClick: () => { EQ.nav('/fac/dashboard', { ...EQ.route.query, tv: '1' }); try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* fullscreen is optional */ } } }, icon('tv'), 'TV mode')].filter(Boolean));
  }
  function patchBottom(m) {
    // proof carousel
    const P = dash.refs.proof, ps = m.proof;
    const sig = ps.map((p) => p.key).join(',');
    if (dash.proof.sig !== sig) {
      const curKey = dash.proof.key; dash.proof.sig = sig;
      let i = ps.findIndex((p) => p.key === curKey); if (i < 0) i = 0; dash.proof.i = i;
      P.replaceChildren(h('h2', null, 'Latest proof'), h('figure', { class: 'proof-fig' }, h('img', { class: 'proof-img', alt: '' }), h('figcaption', { class: 'proof-cap' })),
        h('div', { class: 'proof-ctl' }, h('button', { type: 'button', class: 'btn-sm', 'aria-label': 'Previous photo', 'data-fk': 'proof-prev', onClick: () => stepProof(-1) }, icon('arrow-r', 'flip')), h('button', { type: 'button', class: 'btn-sm', 'aria-pressed': 'false', 'data-fk': 'proof-pause', 'aria-label': 'Pause the photo rotation', onClick: () => { dash.proof.paused = !dash.proof.paused; paintProof(); } }, icon('pause')), h('button', { type: 'button', class: 'btn-sm', 'aria-label': 'Next photo', 'data-fk': 'proof-next', onClick: () => stepProof(1) }, icon('arrow-r')), h('span', { class: 'proof-n small muted', 'aria-live': 'off' })));
      P.addEventListener('pointerenter', () => { dash.proof.hover = true; }); P.addEventListener('pointerleave', () => { dash.proof.hover = false; }); P.addEventListener('focusin', () => { dash.proof.focus = true; }); P.addEventListener('focusout', () => { dash.proof.focus = false; });
    }
    paintProof();
    // due load
    const W = 720, Hh = 140, pad = 26, bw = 60, gap = (W - pad * 2 - bw * 8) / 7; // Repair-R02B finding 6: flatter chart, so its labels render larger in the same box
    const max = Math.max(4, ...m.dueLoad.map((w) => w.electrical + w.mechanical + w.civil));
    const lsig = JSON.stringify(m.dueLoad);
    const host = dash.refs.load.querySelector('.load-chart');
    if (host.dataset.sig !== lsig) {
      host.dataset.sig = lsig;
      const bars = []; let tot = 0;
      m.dueLoad.forEach((w, i) => {
        const x = pad + i * (bw + gap); let y = Hh - 34; const t = w.electrical + w.mechanical + w.civil; tot += t;
        [['electrical', 'E'], ['mechanical', 'M'], ['civil', 'C']].forEach(([d, ch]) => { const n = w[d]; if (!n) return; const ht = (n / max) * (Hh - 70); y -= ht; bars.push(h('rect', { x, y, width: bw, height: ht, class: 'lb d-' + d, 'data-d': d }), ht > 16 ? h('text', { x: x + bw / 2, y: y + ht / 2 + 5, 'text-anchor': 'middle', class: 'lb-t' }, ch + n) : null); });
        bars.push(h('text', { x: x + bw / 2, y: Hh - 38 - (t / max) * (Hh - 70) - 4, 'text-anchor': 'middle', class: 'lb-total' }, String(t)), h('text', { x: x + bw / 2, y: Hh - 12, 'text-anchor': 'middle', class: 'lb-wk' }, EQ.fmtDate(w.start).replace(/ \d{4}$/, '')));
      });
      host.replaceChildren(h('svg', { viewBox: '0 0 ' + W + ' ' + Hh, class: 'load-svg', role: 'img', 'aria-label': 'Jobs due per week for the next 8 weeks, ' + tot + ' in total, stacked by discipline' }, ...bars.filter(Boolean)),
        h('div', { class: 'load-legend' }, LANE_CODES.map(([c, n]) => h('span', null, h('i', { class: 'sw-d d-' + c }), n[0] + ' ' + n))),
        h('div', { class: 'sr-only' }, h('table', null, h('caption', null, 'Jobs due per week, next 8 weeks'), h('thead', null, h('tr', null, ['Week starting', 'Electrical', 'Mechanical', 'Civil'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, m.dueLoad.map((w) => h('tr', null, h('th', { scope: 'row' }, w.start), h('td', null, String(w.electrical)), h('td', null, String(w.mechanical)), h('td', null, String(w.civil))))))));
    }
    dash.refs.load.querySelector('.load-note').textContent = 'Rolling jobs with a due date; overdue jobs, daily and weekly checks are not included.';
  }
  function stepProof(d) { const n = dash.model.proof.length; if (!n) return; dash.proof.i = (dash.proof.i + d + n) % n; dash.proof.clock = 0; paintProof(); }
  function paintProof() {
    const P = dash.refs.proof, ps = dash.model.proof; const i = Math.min(dash.proof.i, Math.max(0, ps.length - 1));
    const p = ps[i];
    const img = P.querySelector('.proof-img'), cap = P.querySelector('.proof-cap'), n = P.querySelector('.proof-n');
    if (!img) return;
    if (!p) { img.removeAttribute('src'); cap.textContent = 'No completion photos yet.'; n.textContent = ''; return; }
    dash.proof.key = p.key;
    if (img.getAttribute('src') !== p.src) img.setAttribute('src', p.src);
    img.alt = 'Completion photo for ' + p.jobName + (p.synthetic ? ' (synthetic placeholder image)' : '');
    cap.replaceChildren(h('a', { href: F().jobHref(p.jobId) }, p.jobName), ' · ' + EQ.fmtDate(p.workDate) + ' · ' + p.who + (p.synthetic ? ' · synthetic photo' : ''));
    n.textContent = 'Photo ' + (i + 1) + ' of ' + ps.length;
    const pb = P.querySelector('[data-fk="proof-pause"]'); if (pb) { pb.setAttribute('aria-pressed', dash.proof.paused ? 'true' : 'false'); pb.replaceChildren(icon(dash.proof.paused ? 'play' : 'pause')); pb.setAttribute('aria-label', dash.proof.paused ? 'Resume the photo rotation' : 'Pause the photo rotation'); }
  }
  function patchStatic(m) {
    const body = dash.refs.staticAlt.querySelector('.static-body');
    const sig = m.lanes.map((l) => l.rows.map((r) => r.sig).join(';')).join('||');
    if (body.dataset.sig === sig) return; body.dataset.sig = sig;
    body.replaceChildren(h('div', { class: 'table-wrap' }, h('table', null, h('caption', null, 'All dashboard jobs, in dashboard order, by discipline'),
      h('thead', null, h('tr', null, ['Discipline', 'Job', 'Frequency', 'PIC', 'Progress', 'Status', 'Due'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, m.lanes.flatMap((l) => l.rows.map((r) => h('tr', null, h('td', null, l.name), h('th', { scope: 'row' }, h('a', { href: F().jobHref(r.id) }, r.name)), h('td', null, r.freq), h('td', null, r.pic), h('td', null, r.done + '/' + r.target + ' (' + r.pct + ' %)'), h('td', null, r.overdue ? 'Overdue' : F().STATUS_NAME[r.status]), h('td', null, r.dueLabel))))))));
  }
  function patchCombined(m) {
    const ol = dash.refs.combined.querySelector('ol');
    const all = m.lanes.flatMap((l) => l.rows).sort((a, b) => F().GROUPS.indexOf(a.group) - F().GROUPS.indexOf(b.group) || b.daysOverdue - a.daysOverdue || EQ.cmp(a.dueOn || '9999', b.dueOn || '9999'));
    if (!dash.combCache) dash.combCache = new Map();
    syncList(ol, dash.combCache, all.map((r) => ({ ...r })), (r) => { const li = rowEl(r, { disc: true }); li.querySelector('a').setAttribute('tabindex', '0'); return li; }, null, true);
  }

  // ---------------------------------------------------------------- motion
  const speedNow = () => (dash.model ? dash.model.settings.scrollPxPerSec : 20) * dash.speedScale;
  function paint(L) {
    if (dash.phone) return;
    if (dash.staticMode) { L.track.style.transform = ''; return; }
    if (dash.reduced) { const per = Math.max(1, Math.floor(L.view.clientHeight / L.rowH)); const pages = Math.max(1, Math.ceil(L.keys.length / per)); L.page = L.page % pages; L.track.style.transform = 'translateY(' + (-L.page * per * L.rowH) + 'px)'; L.pageInd.hidden = pages < 2; L.pageInd.textContent = 'Page ' + (L.page + 1) + ' of ' + pages; return; }
    L.track.style.transform = L.moving ? 'translateY(' + (-L.offset).toFixed(2) + 'px)' : '';
  }
  function paintTicker() { const T = dash.ticker; T.track.style.transform = T.moving && !dash.staticMode && !dash.reduced ? 'translateX(' + (-T.offset).toFixed(2) + 'px)' : ''; }
  function applyMode() {
    const r = dash.root; if (!r) return;
    const mode = dash.phone ? 'combined' : dash.staticMode ? 'static' : dash.reduced ? 'flip' : 'scroll';
    r.dataset.motion = mode;
    Object.values(dash.lanes).forEach((L) => {
      const vh = L.view.clientHeight;
      L.moving = mode === 'scroll' && L.T > vh + 1 && L.keys.length > 0;
      L.dup.hidden = !(mode === 'scroll' && L.moving);
      if (mode !== 'scroll') L.offset = mode === 'static' ? L.offset : 0;
      L.pageInd.hidden = mode !== 'flip';
      paint(L);
    });
    const T = dash.ticker; T.moving = mode === 'scroll' && T.T > T.view.clientWidth + 1; T.dup.hidden = !T.moving; paintTicker();
  }
  function frame(t) {
    if (!dash.root || !dash.root.isConnected) { dash.raf = null; return; }
    dash.raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, Math.max(0, (t - (dash.last || t)) / 1000)); dash.last = t;
    dash.stats.frames += 1;
    if (document.hidden) return;
    const sp = speedNow();
    Object.values(dash.lanes).forEach((L) => {
      const stopped = dash.paused || L.hover || L.focus;
      if (dash.root.dataset.motion === 'scroll' && L.moving && !stopped) { L.offset += sp * dt; if (L.offset >= L.T) L.offset -= L.T; paint(L); }
      else if (dash.root.dataset.motion === 'flip' && !stopped) { L.flip += dt; if (L.flip >= FLIP_S) { L.flip = 0; L.page += 1; paint(L); } }
    });
    const T = dash.ticker;
    if (dash.root.dataset.motion === 'scroll' && T.moving && !(dash.paused || T.hover || T.focus)) { T.offset += sp * 2.5 * dt; if (T.offset >= T.T) T.offset -= T.T; paintTicker(); }
    const pr = dash.proof;
    if (!dash.phone && !dash.reduced && !dash.paused && !pr.paused && !pr.hover && !pr.focus && dash.model && dash.model.proof.length > 1) { pr.clock += dt; if (pr.clock >= PROOF_S) { pr.clock = 0; stepProof(1); } }
  }
  EQ.dashState = () => ({ mode: dash.root && dash.root.dataset.motion, paused: dash.paused, speed: speedNow(), lanes: Object.fromEntries(Object.entries(dash.lanes).map(([k, L]) => [k, { offset: L.offset, T: L.T, rowH: L.rowH, moving: L.moving, rows: L.keys.length, page: L.page, keys: L.keys.slice(0, 3), viewH: L.view.clientHeight }])), ticker: { offset: dash.ticker.offset, T: dash.ticker.T, moving: dash.ticker.moving, items: dash.ticker.items.size }, frames: dash.stats.frames, proofIndex: dash.proof.i, phone: dash.phone, reduced: dash.reduced });
  EQ.dashStep = (secs) => { const dt = secs; const sp = speedNow(); Object.values(dash.lanes).forEach((L) => { if (L.moving) { L.offset = (L.offset + sp * dt) % L.T; paint(L); } }); };

  // ---------------------------------------------------------------- view
  EQ.views.facDashboard = function facDashboard(q) {
    const S = EQ.state;
    if (S.data === 'loading') { dash.root = null; return h('div', { class: 'page', 'aria-busy': 'true', role: 'status' }, h('span', { class: 'sr-only' }, 'Loading the FAC Dashboard'), h('div', { class: 'skeleton', style: 'height:5rem;margin-bottom:.7rem' }), h('div', { class: 'board' }, [1, 2, 3].map(() => h('div', { class: 'skeleton', style: 'height:24rem' })))); }
    let m;
    if (S.data === 'stale' && dash.lastGood) m = dash.lastGood;
    else {
      if (S.data === 'error') { dash.root = null; return h('div', { class: 'page' }, h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'The FAC Dashboard could not be loaded. '), 'No data is shown; nothing is presented as completed without data.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls.'))))); }
      const fq = { discipline: q.discipline, type: q.type, mode: q.mode, pic: q.pic, focus: q.focus };
      m = F().dashboard(fq);
      if (!m.ok) { EQ.access.refreshSession('403 ' + m.code); dash.root = null; setTimeout(() => EQ.rerender(), 0); return EQ.views.forbidden('fac.dashboard.view', '/fac/dashboard', m.code); }
      if (S.data !== 'stale') dash.lastGood = m;
    }
    if (S.data === 'empty') { dash.root = null; return h('div', { class: 'page' }, h('div', { class: 'panel empty' }, icon('board'), h('h2', null, 'No FAC jobs yet'), h('p', null, 'An Admin imports the master job list in Admin > FAC > Import. Until then the dashboard has nothing to show.'))); }
    dash.q = q;
    if (!dash.root || !dash.root.isConnected) { build(); }
    dash.model = m;
    dash.paused = dash.paused && true;
    dash.staticMode = q.motion === 'off';
    dash.mql = dash.mql || window.matchMedia('(prefers-reduced-motion: reduce)');
    dash.reduced = (dash.mql.matches || q.motion === 'reduced') && !dash.staticMode;
    const pm = window.matchMedia('(max-width: 767px)'); dash.phone = pm.matches;
    const tv = q.tv === '1'; dash.root.classList.toggle('tv', tv); dash.root.classList.toggle('static-mode', dash.staticMode); dash.root.classList.toggle('phone', dash.phone);
    // refresh header, stale state, kpis, filters, lanes, ticker, bottom, tables
    const stale = S.data === 'stale';
    dash.refs.updated.textContent = 'Updated ' + EQ.fmtTime(stale ? S.lastGoodAt : S.refreshedAt).slice(0, 5) + ' Asia/Colombo · refreshes every ' + m.settings.refreshSeconds + ' s' + (stale ? ' · STALE' : '');
    dash.refs.updated.classList.toggle('stale', stale);
    dash.refs.banner.replaceChildren(...(stale ? [h('div', { class: 'notice warn', role: 'status' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'Showing the last good data from ' + EQ.fmtTime(S.lastGoodAt).slice(0, 5) + '. '), 'The refresh at ' + EQ.fmtTime(S.failedAt || Date.now()).slice(0, 5) + ' failed. Progress may be out of date; nothing has been reset.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Try again'))))] : []));
    patchTools(m, q); patchFilters(m, q); patchKpis(m, q);
    m.lanes.forEach((l) => { const L = dash.lanes[l.code]; if (L) { L.el.hidden = false; patchLane(L, l); } });
    LANE_CODES.forEach(([c]) => { if (!m.lanes.some((l) => l.code === c)) dash.lanes[c].el.hidden = true; });
    document.getElementById('app').dataset.lanes = String(m.lanes.length);
    patchCombined(m); patchTicker(m.ticker); patchBottom(m); patchStatic(m);
    dash.refs.note.textContent = 'SYNTHETIC PROGRESS: the ' + m.kpi.active + ' jobs and their frequencies come from the supplied sheet (reference/fac-job-list.json); every progress update, completion photo, hold made in the app, PIC-to-user link and ' + m.syntheticOverlay.dueDates + ' Admin-entered due dates are fictional prototype data. Nothing is saved.';
    // fit: pause lanes shorter than the view, measure after layout
    requestAnimationFrame(() => { Object.values(dash.lanes).forEach((L) => { const li0 = L.list.firstElementChild; if (li0) { const rh = li0.getBoundingClientRect().height; if (rh) { L.rowH = rh; L.T = L.keys.length * rh; } } }); const T = dash.ticker; const w = T.list.firstElementChild ? T.list.firstElementChild.getBoundingClientRect().width : 0; if (w) { T.itemW = w; T.T = T.items.size * w; } dash.speedScale = Math.max(0.8, (Object.values(dash.lanes)[0].rowH || 80) / 80); applyMode(); });
    if (!dash.raf) { dash.last = 0; dash.raf = requestAnimationFrame(frame); }
    return dash.root;
  };
  window.addEventListener('resize', () => { if (dash.root && dash.root.isConnected) EQ.rerender(); });
  // reduced-motion preference changes apply without a reload
  try { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { if (dash.root && dash.root.isConnected) EQ.rerender(); }); } catch (e) { /* older engines */ }

  EQ.views.noAccess = function noAccess() {
    return h('div', { class: 'page' }, h('div', { class: 'panel empty noaccess' }, icon('lock'), h('h1', null, 'No access'), h('p', null, 'Your Portal role is recognised, but no tab of EQ & FAC Maintenance is switched on for it.'),
      h('p', { class: 'strong' }, 'No access - contact the EQ & FAC Maintenance Admin.'), h('p', { class: 'small muted' }, 'This is not an error. The Admin can switch tabs on in Admin > Access; the change reaches you within 60 seconds.')));
  };
  EQ.views.forbidden = function forbidden(feature, path, code) {
    const row = EQ.access.FEATURES.find((f) => f[0] === feature);
    const roles = EQ.access.persona().roles;
    const toggled = roles.some((r) => EQ.access.CEIL[feature][r] === 'T1' || EQ.access.CEIL[feature][r] === 'T0');
    return h('div', { class: 'page' }, h('div', { class: 'panel panel-pad stack', role: 'alert' }, h('h1', null, '403 - ' + (feature === 'admin.access' ? 'EQ Maintenance Admin only' : 'This tab is not available for your role')),
      h('p', null, feature === 'admin.access' ? 'The Admin pages are for the app Admin. A hidden link is not the control: the server refuses this route and every Admin request for your role (403 forbidden_role).' : toggled ? 'The feature "' + (row ? row[1] : feature) + '" is switched off for your role in Admin > Access (403 feature_disabled). Ask the app Admin if you need it.' : 'No role you hold allows "' + (row ? row[1] : feature) + '" (403 forbidden_role).'),
      h('p', null, h('a', { href: '#' + EQ.access.landing() }, 'Go to your landing page'))));
  };
})(window.EQ);
