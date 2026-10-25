/* Fleet dashboard: QC / RTG / ES groups, status counts, search/filter, freshness, links. No WebGL canvases, ever.
   U1 round 8: flat pastel restyle with a KPI tile row (U1-C31), in-house equipment illustrations (U1-C29, js/fleet-art.js),
   Breakdown and Maintenance cards that blink in two colours with a Pause control and a steady reduced-motion state (U1-C30),
   and a read-only TV mode at #/eq/fleet?tv=1 (U1-C28). */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  // paused: Pause control (stops the blink and the TV page rotation; data refresh continues). tvPage/tvPages: TV paging.
  const ui = (EQ.fleetUI = { q: '', paused: false, tvPage: 0, tvPages: 1, lastFlip: Date.now() });
  const TYPE_LABEL = { QC: 'Quay cranes (QC)', RTG: 'Rail/rubber-tyred gantry cranes (RTG)', ES: 'ES equipment' };
  const TYPE_SHORT = { QC: 'QC', RTG: 'RTG', ES: 'ES' };
  const BLINK = { breakdown: 'breakdown', maintenance: 'maintenance' }; // only these two statuses blink (U1-C30)
  const TV_FLIP_S = 10; // TV page rotation when the fleet does not fit one screen
  EQ.FLEET_BLINK = { breakdown: { periodS: 1.2 }, maintenance: { periodS: 2.4 } }; // < 3 flashes per second (WCAG 2.3.1)

  // U1-C02: the large "Fleet overview" heading block is gone; its meaning is kept in this compact note.
  // P02B (SOW V2 s4.5): the "manual status, no telemetry" note is replaced by the automatic-status meaning.
  const STATUS_NOTE = "Auto (CMMS): Breakdown job → Breakdown; maintenance job → Maintenance; no planned job → Ready for OPS.\nManual correction: reason required; ends at the first successful sync after today.\nUnlinked equipment: manual status. No recorded status: Unreported.";
  function statusNote() {
    return h('span', { class: 'status-note', tabindex: '0', title: STATUS_NOTE, 'aria-describedby': 'status-note-text', 'data-fk': 'status-note' }, icon('info'), 'Automatic status from CMMS', h('span', { id: 'status-note-text', class: 'sr-only' }, STATUS_NOTE));
  }
  const motionOff = (q) => q.motion === 'off';
  const paused = (q) => ui.paused || motionOff(q);
  function pauseBtn(q, tv) {
    const p = paused(q);
    return h('button', { type: 'button', class: 'btn-sm pa-btn', 'data-fk': 'blink-pause', 'aria-pressed': p ? 'true' : 'false', disabled: motionOff(q) ? true : null,
      title: motionOff(q) ? 'Motion is off for this screen (motion=off in the address)' : 'Breakdown cards blink rose and Maintenance cards blink amber. Pause shows them as a steady highlight' + (tv ? ' and stops the page rotation; the data keeps refreshing.' : '.'),
      'aria-label': p ? (tv ? 'Resume the blinking and the page rotation' : 'Resume blinking') : (tv ? 'Pause the blinking and the page rotation' : 'Pause blinking'),
      onClick: () => { ui.paused = !ui.paused; ui.lastFlip = Date.now(); EQ.rerender(); } }, icon(p ? 'play' : 'pause'), tv ? (p ? 'Resume' : 'Pause') : (p ? 'Resume blinking' : 'Pause blinking'));
  }
  function tvBtn(q) {
    return h('button', { type: 'button', class: 'btn-sm pa-btn', 'data-fk': 'fleet-tv', title: 'Full-screen, read-only wall display of this fleet view', onClick: () => { ui.tvPage = 0; ui.lastFlip = Date.now(); EQ.nav('/eq/fleet', { type: q.type, status: q.status, source: q.source, motion: q.motion, tv: '1' }); try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* fullscreen is optional */ } } }, icon('tv'), 'TV mode');
  }
  function exitTv(q) {
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ }
    EQ.nav('/eq/fleet', { ...q, tv: '' });
  }
  function freshness() {
    const S = EQ.state;
    const stale = S.data === 'stale' || S.data === 'error';
    return h('div', { class: 'freshness' },
      h('span', { title: 'Auto-refresh every 60 s and after every change' }, icon('clock'), ' Refreshed ', h('strong', null, EQ.fmtTime(stale ? S.lastGoodAt : S.refreshedAt)), ' Asia/Colombo'),
      cmmsFresh(),
      statusNote());
  }
  function refreshBtn() {
    return h('button', { type: 'button', class: 'btn-sm pa-btn', 'data-fk': 'refresh', onClick: () => EQ.refresh(true) }, icon('refresh'), 'Refresh');
  }
  function cmmsFresh() {
    const f = EQ.cmms.freshness();
    return h('span', { class: 'cmms-fresh' + (f.stale ? ' stale' : ''), 'data-fk': 'cmms-fresh', title: f.stale ? 'The latest CMMS sync failed or is overdue. Previous data and statuses are kept; nothing was changed.' : 'Read-only CMMS daily-job list, two syncs a day' },
      icon(f.stale ? 'alert' : 'sync'), EQ.cmms.freshLabel(), f.stale ? h('strong', null, ' · stale: latest sync ' + (f.latestOutcome === 'failed' ? 'failed (' + f.failureCode + ')' : 'overdue')) : null);
  }
  function staleBanner() {
    const S = EQ.state;
    if (S.data === 'stale') return h('div', { class: 'notice warn', role: 'status' }, icon('wifi-off'), h('div', null,
      h('p', null, h('strong', null, 'Showing the last good data from ' + EQ.fmtTime(S.lastGoodAt) + '. '), 'The refresh at ' + EQ.fmtTime(S.failedAt || Date.now()) + ' failed (network). Statuses may be out of date; nothing has been reset to Ready.'),
      h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Try again'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls to simulate recovery.'))));
    return null;
  }
  function thumb(type) { return h('span', { class: 'thumb', 'aria-hidden': 'true', title: EQ.fleetArtName(type) + ' (illustration, not a model)' }, EQ.fleetArt(type)); }

  // U1-C02: compact card (at most 60 px high) so the fleet fits one screen; the update time and model stay in the card
  // title and in the table layout. U1-C30: Breakdown / Maintenance cards blink (class blink-*, data-blink).
  function srcTag(e) {
    const m = EQ.cmms.mode(e);
    return h('span', { class: 'src ' + (m.label === 'Auto' ? 'auto' : 'manual'), title: m.long }, m.label);
  }
  function eqCard(e, tv) {
    const dur = EQ.inStatusFor(e);
    const open = EQ.shownOpenJobs(e.id).length; // U1-C26: jobs switched off for the dashboard / 3D are not counted on the fleet card
    const m = EQ.cmms.mode(e);
    const zc = EQ.cmms.todayCount(e);
    const k = EQ.statusKey(e.status);
    const blink = e.lifecycle === 'active' ? BLINK[k] : null;
    const model = EQ.verified(e) ? e.modelCode : (e.typeCode === 'QC' ? 'No verified model' : 'No 3D in stage 1');
    const label = e.code + ', ' + EQ.STATUS[k].label + ', status source ' + m.label + (zc != null ? ', ' + zc + ' CMMS daily jobs today' : ', not linked to CMMS');
    const attrs = { class: 'eq-card st-card-' + k + (blink ? ' blink blink-' + blink : '') + (e.lifecycle === 'retired' ? ' retired' : ''), 'data-blink': blink || null, 'data-eq': e.id, title: e.name + ' · ' + m.long + (zc != null ? ' · ' + zc + ' CMMS job(s) today' : '') + ' · Updated ' + EQ.fmtInstantShort(e.lastActivity) + ' · ' + model };
    const durTxt = dur != null ? 'For ' + EQ.duration(dur) : 'No status reported yet';
    const kids = tv ? [
      thumb(e.typeCode),
      h('span', { class: 'code' }, e.code),
      h('span', { class: 'st-line' }, EQ.statusBadge(e.status, true), h('span', { class: 'dur' }, dur != null ? durTxt : 'Never set')),
      h('span', { class: 'meta' }, open + ' open · ', srcTag(e), zc != null ? h('span', { class: 'zc', 'data-cmms-today': String(zc) }, ' · CMMS ' + zc + ' today') : h('span', { class: 'zc-none' }, ' · not in CMMS'))]
      : [
        thumb(e.typeCode),
        h('span', { class: 'code' }, e.code, e.lifecycle === 'retired' ? h('span', { class: 'tag' }, 'Retired') : null, EQ.statusBadge(e.status)),
        h('span', { class: 'meta' }, durTxt, ' · ' + open + ' open · ', srcTag(e), zc != null ? h('span', { class: 'zc', 'data-cmms-today': String(zc) }, ' · CMMS ' + zc) : null)];
    // TV mode is a display: no links into the editing screens (U1-C28)
    return tv ? h('div', { ...attrs, role: 'listitem', 'aria-label': label }, ...kids) : h('a', { ...attrs, href: '#/eq/equipment/' + e.id, 'aria-label': label }, ...kids);
  }
  function table(list) {
    return h('div', { class: 'panel table-wrap' }, h('table', null,
      h('caption', { class: 'sr-only' }, 'Equipment, status and last update'),
      h('thead', null, h('tr', null, ['Equipment', 'Type', 'Status', 'Source', 'CMMS jobs today', 'Time in status', 'Open special jobs', 'Last updated', 'Model'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, list.map((e) => { const d = EQ.inStatusFor(e); return h('tr', { class: e.lifecycle === 'retired' ? 'inactive' : '' },
        h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + e.id }, e.code), e.lifecycle === 'retired' ? ' (retired)' : ''),
        h('td', null, e.typeCode), h('td', null, EQ.statusBadge(e.status)), h('td', null, srcTag(e), ' ', EQ.cmms.mode(e).key === 'manualUnmapped' ? h('span', { class: 'small muted' }, 'not linked to CMMS') : null), h('td', null, EQ.cmms.todayCount(e) == null ? '-' : String(EQ.cmms.todayCount(e))), h('td', null, d != null ? EQ.duration(d) : 'Not reported'),
        h('td', null, String(EQ.shownOpenJobs(e.id).length)), h('td', null, EQ.fmtInstantShort(e.lastActivity)), h('td', null, EQ.verified(e) ? e.modelCode : 'None verified')); }))));
  }

  // ------------------------------------------------------------------ KPI tile row (U1-C31)
  const ST_ICON = { readyForOps: 'check-circle', breakdown: 'octagon-x', maintenance: 'wrench', unreported: 'dashed' };
  function kpiRow(typed, counts, stat, setQ, tv) {
    const byType = ['QC', 'RTG', 'ES'].map((t) => [t, typed.filter((e) => e.typeCode === t && e.lifecycle === 'active').length]).filter(([, n]) => n > 0);
    const pct = counts.total ? Math.round((counts.readyForOps / counts.total) * 100) : 0;
    const R = 15.915; // circumference 100
    const donut = h('svg', { class: 'donut', viewBox: '0 0 40 40', role: 'img', 'aria-label': 'Ready for OPS: ' + counts.readyForOps + ' of ' + counts.total + ' active, ' + pct + ' percent' },
      h('circle', { cx: '20', cy: '20', r: String(R), fill: 'none', class: 'd-track', 'stroke-width': '5' }),
      h('circle', { cx: '20', cy: '20', r: String(R), fill: 'none', class: 'd-val', 'stroke-width': '5', 'stroke-dasharray': pct + ' ' + (100 - pct), 'stroke-dashoffset': '25' }));
    const tile = (k, n) => {
      const kids = [h('span', { class: 'k-top' }, h('span', { class: 'n' }, String(n)), h('span', { class: 'k-ic ic-' + k, 'aria-hidden': 'true' }, icon(ST_ICON[k]))), h('span', { class: 'lbl' }, EQ.STATUS[k].label)];
      if (tv) return h('div', { class: 'count-card kpi kpi-' + k, 'data-kpi': k }, ...kids);
      return h('button', { type: 'button', class: 'count-card kpi kpi-' + k, 'data-kpi': k, 'aria-pressed': stat === k ? 'true' : 'false', 'data-fk': 'cc-' + k, 'aria-label': EQ.STATUS[k].label + ': ' + n + (stat === k ? ', filter on' : ''), title: 'Show only ' + EQ.STATUS[k].label, onClick: () => setQ({ status: stat === k ? '' : k }) }, ...kids);
    };
    return h('div', { class: 'count-strip kpi-row', role: 'group', 'aria-label': tv ? 'Status counts (active equipment)' : 'Status counts (active equipment; select to filter)' },
      h('div', { class: 'count-card total kpi kpi-total', 'data-kpi': 'total', title: 'Active equipment; retired items are excluded' },
        h('span', { class: 'k-top' }, h('span', { class: 'n' }, String(counts.total)), h('span', { class: 'k-types' }, byType.map(([t, n]) => h('span', { class: 'k-type', title: EQ.fleetArtName(t) + ': ' + n }, EQ.fleetArt(t), h('b', null, String(n)), h('span', { class: 'sr-only' }, ' ' + TYPE_SHORT[t]))))),
        h('span', { class: 'lbl' }, 'Active equipment')),
      h('div', { class: 'count-card kpi kpi-share', 'data-kpi': 'share', title: 'Ready for OPS as a share of the active equipment shown, now' }, h('span', { class: 'k-top' }, donut, h('span', { class: 'n' }, pct + ' %')), h('span', { class: 'lbl' }, 'Ready for OPS now')),
      tile('readyForOps', counts.readyForOps), tile('breakdown', counts.breakdown), tile('maintenance', counts.maintenance), tile('unreported', counts.unreported));
  }
  function groupHead(t, c, tv, n) {
    return h('header', null, h('span', { class: 'g-art', 'aria-hidden': 'true' }, EQ.fleetArt(t)), h('h2', { id: 'fg-' + t }, TYPE_LABEL[t]), h('span', { class: 'g-n' }, String(n)),
      h('span', { class: 'mini-counts', 'aria-label': 'Counts for ' + t },
        [['readyForOps', 'check-circle'], ['breakdown', 'octagon-x'], ['maintenance', 'wrench'], ['unreported', 'dashed']].map(([k, ic]) => h('span', { class: 'badge st-' + k, title: EQ.STATUS[k].label + ': ' + c[k], 'aria-label': EQ.STATUS[k].label + ': ' + c[k] }, icon(ic), String(c[k])))),
      t !== 'QC' && !tv ? h('span', { class: 'tag dashed' }, '3D not available in stage 1') : null);
  }

  // ------------------------------------------------------------------ TV mode (U1-C28)
  function tvHead(q) {
    const S = EQ.state, stale = S.data === 'stale';
    return h('header', { class: 'tvf-head' },
      h('h1', null, 'EQ Fleet'), h('span', { class: 'tag syn' }, 'Synthetic data'),
      h('span', { class: 'tvf-updated' + (stale ? ' stale' : ''), 'data-fk': 'tv-updated' }, icon('clock'), 'Updated ' + EQ.fmtTime(stale || S.data === 'error' ? S.lastGoodAt : S.refreshedAt).slice(0, 5) + ' Asia/Colombo · refreshes every 60 s' + (stale ? ' · STALE' : '')),
      S.data === 'normal' || stale ? cmmsFresh() : null,
      h('span', { class: 'tvf-tools' }, pauseBtn(q, true), h('button', { type: 'button', class: 'btn-sm pa-btn primary', 'data-fk': 'fleet-tv-exit', onClick: () => exitTv(q) }, icon('x'), 'Exit TV mode')));
  }
  function tvFoot() {
    return h('footer', { class: 'tvf-foot' }, h('span', null, icon('info'), "Status is automatic from today's CMMS daily jobs; an EQ Team correction holds for today. Unreported means never set, not Ready."), h('span', { class: 'tvf-pager', 'data-fk': 'tv-pager', 'aria-live': 'off' }));
  }
  function applyTvPage(root) {
    const body = root && root.querySelector('.tvf-body'); if (!body) return;
    const pages = ui.tvPages; if (ui.tvPage >= pages) ui.tvPage = 0;
    body.querySelectorAll('.eq-card').forEach((c) => { c.hidden = pages > 1 && Number(c.dataset.page) !== ui.tvPage; });
    body.querySelectorAll('.fleet-group').forEach((g) => { g.hidden = pages > 1 && !g.querySelector('.eq-card:not([hidden])'); });
    const pg = root.querySelector('[data-fk="tv-pager"]');
    if (pg) pg.textContent = pages > 1 ? 'Page ' + (ui.tvPage + 1) + ' of ' + pages + (paused(EQ.route.query) ? ' · paused' : ' · next page in ' + Math.max(1, Math.ceil(TV_FLIP_S - (Date.now() - ui.lastFlip) / 1000)) + ' s') : '';
  }
  /** Splits the cards into pages when the fleet does not fit one screen (measured, never a page scroll in TV mode). */
  function paginate(root) {
    const body = root.querySelector('.tvf-body'); if (!body || !root.isConnected) return;
    const cards = [...body.querySelectorAll('.eq-card')];
    cards.forEach((c) => { c.hidden = false; c.dataset.page = '0'; }); body.querySelectorAll('.fleet-group').forEach((g) => { g.hidden = false; });
    ui.tvPages = 1;
    if (body.scrollHeight <= body.clientHeight + 1) { applyTvPage(root); return; }
    let avail = body.clientHeight;
    for (let attempt = 0; attempt < 5; attempt++) {
      cards.forEach((c) => { c.hidden = false; }); body.querySelectorAll('.fleet-group').forEach((g) => { g.hidden = false; });
      const bt = body.getBoundingClientRect().top + body.scrollTop;
      let page = 0, start = 0;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect(), top = r.top + body.scrollTop - bt, bottom = r.bottom + body.scrollTop - bt;
        const g = c.closest('.fleet-group'), gh = g.querySelector('header').getBoundingClientRect().height + 8;
        if (i > 0 && bottom - start > avail) { page += 1; start = top - gh; }
        c.dataset.page = String(page);
      });
      ui.tvPages = page + 1;
      body.scrollTop = 0;
      let fits = true;
      for (let p = 0; p < ui.tvPages && fits; p++) { ui.tvPage = p; applyTvPage(root); if (body.scrollHeight > body.clientHeight + 1) fits = false; }
      if (fits) break;
      avail = Math.floor(avail * 0.9);
    }
    ui.tvPage = Math.min(ui.tvPageWanted || 0, ui.tvPages - 1);
    applyTvPage(root);
  }
  // one timer for the TV page rotation (no timer per render)
  setInterval(() => {
    const root = document.querySelector('.fleet-page.tv-fleet');
    if (!root || ui.tvPages < 2) return;
    if (!paused(EQ.route.query) && Date.now() - ui.lastFlip >= TV_FLIP_S * 1000) { ui.tvPage = (ui.tvPage + 1) % ui.tvPages; ui.tvPageWanted = ui.tvPage; ui.lastFlip = Date.now(); }
    applyTvPage(root);
  }, 1000);
  window.addEventListener('resize', () => { if (document.querySelector('.fleet-page.tv-fleet')) EQ.rerender(); });
  EQ.fleetTvState = () => ({ page: ui.tvPage, pages: ui.tvPages, paused: paused(EQ.route.query) });

  EQ.views.fleet = function fleet(q) {
    const S = EQ.state;
    const tv = q.tv === '1';
    const type = q.type || 'all', stat = q.status || '', retired = !tv && q.lifecycle === 'all', src = q.source || '';
    const setQ = (patch) => EQ.nav('/eq/fleet', { type: 'all', status: '', lifecycle: '', source: '', ...q, ...patch });
    const page = h('div', { class: 'page fleet-page pa' + (tv ? ' tv-fleet' : '') + (paused(q) ? ' blink-paused' : ''), 'data-blink-state': paused(q) ? 'paused' : 'on' });
    if (!tv) page.appendChild(h('h1', { class: 'sr-only' }, 'Fleet')); // the visible heading block was removed in U1-C02
    else page.appendChild(tvHead(q));

    if (S.data === 'loading') {
      page.appendChild(h('div', { 'aria-busy': 'true', role: 'status' }, h('span', { class: 'sr-only' }, 'Loading fleet'), h('div', { class: 'count-strip kpi-row' }, [1, 2, 3, 4, 5, 6].map(() => h('div', { class: 'skeleton', style: 'height:4.4rem' }))), h('div', { class: 'card-grid' }, Array.from({ length: 8 }, () => h('div', { class: 'skeleton', style: 'height:3.6rem' })))));
      return page;
    }
    if (S.data === 'error') {
      if (!tv) page.appendChild(h('div', { class: 'fleet-bar' }, freshness(), h('span', { class: 'fb-tools' }, refreshBtn())));
      page.appendChild(h('div', { class: 'panel panel-pad' }, h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'The fleet could not be loaded. '), 'No data is available to show. Nothing is displayed as Ready for OPS when the status is unknown.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls.'))))));
      return page;
    }
    const all = S.data === 'empty' ? [] : S.D.equipment;
    if (!all.length) {
      page.appendChild(h('div', { class: 'panel empty' }, icon('list'), h('h2', null, 'No equipment is registered yet'),
        h('p', null, EQ.perm.admin() ? 'Register the first QC, RTG or ES item. It will start as Unreported.' : 'An EQ Maintenance Admin registers the equipment. Until then there is nothing to show here.'),
        EQ.perm.admin() && !tv ? h('button', { type: 'button', class: 'primary', onClick: () => EQ.dlg.newEquipment() }, 'Register equipment') : null));
      return page;
    }
    const sb = staleBanner(); if (sb) page.appendChild(sb);

    const typed = all.filter((e) => type === 'all' || e.typeCode === type);
    const counts = EQ.fleetCounts(typed);
    if (!tv) page.appendChild(h('div', { class: 'fleet-bar' }, freshness(), h('span', { class: 'fb-tools' }, refreshBtn(), pauseBtn(q, false), tvBtn(q))));
    page.appendChild(h('div', { class: 'fleet-top' }, kpiRow(typed, counts, stat, setQ, tv)));

    if (!tv) {
      const search = h('input', { type: 'search', id: 'fq', 'data-fk': 'fq', value: ui.q, autocomplete: 'off', placeholder: 'Code, name or model' });
      search.addEventListener('input', () => { ui.q = search.value; EQ.rerender(); });
      page.appendChild(h('div', { class: 'panel filters' },
        h('div', { class: 'field' }, h('span', { class: 'label', id: 'tl' }, 'Equipment type'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'tl' }, ['all', 'QC', 'RTG', 'ES'].map((t) => h('button', { type: 'button', 'aria-pressed': type === t ? 'true' : 'false', 'data-fk': 'type-' + t, onClick: () => setQ({ type: t }) }, t === 'all' ? 'All types' : t)))),
        h('div', { class: 'field' }, h('span', { class: 'label', id: 'sl' }, 'Status source'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'sl' }, [['', 'All'], ['auto', 'Auto'], ['manual', 'Manual']].map(([v, l]) => h('button', { type: 'button', 'aria-pressed': src === v ? 'true' : 'false', 'data-fk': 'src-' + (v || 'all'), onClick: () => setQ({ source: v }) }, l)))),
        h('div', { class: 'field grow' }, h('label', { for: 'fq' }, 'Search equipment'), search),
        h('label', { class: 'check', style: 'min-height:2.5rem' }, h('input', { type: 'checkbox', checked: retired ? true : null, 'data-fk': 'ret', onChange: (e) => setQ({ lifecycle: e.target.checked ? 'all' : '' }) }), 'Include retired'),
        h('div', { class: 'field' }, h('span', { class: 'label', id: 'vl' }, 'Layout'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'vl' }, ['cards', 'table'].map((v) => h('button', { type: 'button', 'aria-pressed': (q.layout || 'cards') === v ? 'true' : 'false', 'data-fk': 'lay-' + v, onClick: () => setQ({ layout: v }) }, v === 'cards' ? 'Cards' : 'Table')))),
        stat ? h('button', { type: 'button', class: 'btn-sm', onClick: () => setQ({ status: '' }) }, icon('x'), 'Clear status filter') : null,
        EQ.perm.admin() ? h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.newEquipment() }, icon('plus'), 'Register equipment') : null));
    }

    const match = (e) => (retired || e.lifecycle === 'active')
      && (!stat || EQ.statusKey(e.status) === stat)
      && (!src || (src === 'auto' ? EQ.cmms.mode(e).label === 'Auto' : EQ.cmms.mode(e).label === 'Manual'))
      && (tv || !ui.q || (e.code + ' ' + e.name + ' ' + (e.modelCode || '')).toLowerCase().includes(ui.q.toLowerCase()));
    const types = type === 'all' ? ['QC', 'RTG', 'ES'] : [type];
    const host = tv ? h('div', { class: 'tvf-body' }) : page;
    let shown = 0;
    types.forEach((t) => {
      const list = typed.filter((e) => e.typeCode === t).filter(match);
      shown += list.length;
      const c = EQ.fleetCounts(typed.filter((e) => e.typeCode === t));
      if (tv && !list.length) return;
      host.appendChild(h('section', { class: 'fleet-group g-' + t.toLowerCase(), 'aria-labelledby': 'fg-' + t },
        groupHead(t, c, tv, list.length),
        list.length ? (!tv && (q.layout || 'cards') === 'table' ? table(list) : h('div', { class: 'card-grid', role: tv ? 'list' : null }, list.map((e) => eqCard(e, tv)))) : h('div', { class: 'panel empty' }, 'No ' + t + ' equipment matches these filters.')));
    });
    if (tv) {
      page.appendChild(host);
      if (!shown) host.appendChild(h('div', { class: 'panel empty' }, 'No equipment matches the filters in the address of this TV view.'));
      page.appendChild(tvFoot());
      requestAnimationFrame(() => paginate(page));
    } else if (!shown) page.appendChild(h('div', { class: 'panel empty' }, icon('search'), h('p', null, 'Nothing matches. '), h('button', { type: 'button', class: 'btn-sm', onClick: () => { ui.q = ''; EQ.nav('/eq/fleet', {}); } }, 'Clear all filters')));
    return page;
  };
})(window.EQ);
