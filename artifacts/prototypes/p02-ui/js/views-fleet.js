/* EQ Fleet: four reconciled KPIs, manual statuses, Isolated card pulse and read-only TV paging. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  // paused: Pause control (stops the blink and the TV page rotation; data refresh continues). tvPage/tvPages: TV paging.
  const ui = (EQ.fleetUI = { q: '', paused: false, tvPage: 0, tvPages: 1, lastFlip: Date.now() });
  const TYPE_LABEL = { QC: 'Quay cranes (QC)', RTG: 'Rail/rubber-tyred gantry cranes (RTG)', ES: 'ES equipment' };
  const TV_FLIP_S = 10; // TV page rotation when the fleet does not fit one screen

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const motionOff = q => q.motion === 'off' || reducedMotion?.matches;
  const paused = q => ui.paused || motionOff(q);
  function pauseBtn(q) {
    const p = paused(q);
    return h('button', { type: 'button', class: 'btn-sm pa-btn', 'data-fk': 'tv-page-pause', 'aria-pressed': String(p), disabled: motionOff(q) || null,
      title: motionOff(q) ? 'Motion is off' : 'Pause or resume Isolated card pulses and TV page rotation',
      'aria-label': motionOff(q) ? 'Motion is off' : (p ? 'Resume' : 'Pause') + ' Isolated card pulses and TV page rotation',
      onClick: () => { ui.paused = !ui.paused; ui.lastFlip = Date.now(); EQ.rerender(); } }, icon(p ? 'play' : 'pause'), motionOff(q) ? 'Motion off' : (p ? 'Resume' : 'Pause'));
  }
  function tvBtn(q) {
    return h('button', { type: 'button', class: 'btn-sm pa-btn', 'data-fk': 'fleet-tv', title: 'Full-screen, read-only wall display of this fleet view', onClick: () => { ui.tvPage = 0; ui.lastFlip = Date.now(); EQ.nav('/eq/fleet', { type: q.type, status: q.status, q: ui.q || q.q, motion: q.motion, tv: '1' }); try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* fullscreen is optional */ } } }, icon('tv'), 'TV mode');
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
      EQ.manual.warning ? h('span', { class: 'stale', role: 'status' }, EQ.manual.warning) : null);
  }
  function refreshBtn() {
    return h('button', { type: 'button', class: 'btn-sm pa-btn', 'data-fk': 'refresh', onClick: () => EQ.refresh(true) }, icon('refresh'), 'Refresh');
  }
  function staleBanner() {
    const S = EQ.state;
    if (S.data === 'stale') return h('div', { class: 'notice warn', role: 'status' }, icon('wifi-off'), h('div', null,
      h('p', null, h('strong', null, 'Showing the last good data from ' + EQ.fmtTime(S.lastGoodAt) + '. '), 'The refresh at ' + EQ.fmtTime(S.failedAt || Date.now()) + ' failed (network). Statuses may be out of date; nothing has been reset to Ready.'),
      h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Try again'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls to simulate recovery.'))));
    return null;
  }
  function thumb(type) { return h('span', { class: 'thumb', 'aria-hidden': 'true', title: EQ.fleetArtName(type) + ' (illustration, not a model)' }, EQ.fleetArt(type)); }

  function eqCard(e, tv) {
    const dur = EQ.inStatusFor(e), open = EQ.shownOpenJobs(e.id).length, k = EQ.statusKey(e.status);
    const model = EQ.verified(e) ? e.modelCode : (e.typeCode === 'QC' ? 'No verified model' : 'No 3D in stage 1');
    // Spare parts past their predicted replacement date (same rule as the equipment Spare part status tab).
    const spareOver = e.lifecycle === 'active' && EQ.spares ? EQ.spares.counts(EQ.spares.rows(e.id)).overdue : 0;
    const over = spareOver ? h('span', { class: 'tag red spare-over', 'data-spare-overdue': String(spareOver), title: spareOver + ' spare part' + (spareOver === 1 ? '' : 's') + ' overdue for replacement' }, icon('alert'), ' Overdue ' + spareOver) : null;
    const label = e.code + ', ' + EQ.statusLabel(e.status) + (spareOver ? ', ' + spareOver + ' spare part' + (spareOver === 1 ? '' : 's') + ' overdue' : '');
    const attrs = { class: 'eq-card st-card-' + k + (e.lifecycle === 'retired' ? ' retired' : ''), 'data-eq': e.id, title: e.name + ' · Updated ' + EQ.fmtInstantShort(e.lastActivity) + ' · ' + model };
    const durTxt = dur != null ? 'For ' + EQ.duration(dur) : 'Recorded duration unavailable';
    const kids = tv ? [thumb(e.typeCode), h('span', { class: 'code' }, e.code), h('span', { class: 'st-line' }, EQ.statusBadge(e.status, true), h('span', { class: 'dur' }, durTxt)), h('span', { class: 'meta' }, open + ' open'), over]
      : [thumb(e.typeCode), h('span', { class: 'code' }, e.code, e.lifecycle === 'retired' ? h('span', { class: 'tag' }, 'Retired') : null, EQ.statusBadge(e.status)), h('span', { class: 'meta' }, durTxt + ' · ' + open + ' open'), over];
    return tv ? h('div', { ...attrs, role: 'listitem', 'aria-label': label }, ...kids) : h('a', { ...attrs, href: '#/eq/equipment/' + e.id, 'aria-label': label }, ...kids);
  }
  function table(list) {
    return h('div', { class: 'panel table-wrap' }, h('table', null,
      h('caption', { class: 'sr-only' }, 'Equipment, manual status and recorded update'),
      h('thead', null, h('tr', null, ['Equipment','Type','Status','Time in status','Open special jobs','Last updated','Model'].map(c => h('th', { scope: 'col' }, c)))),
      h('tbody', null, list.map(e => h('tr', { class: e.lifecycle === 'retired' ? 'inactive' : '' },
        h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + e.id }, e.code), e.lifecycle === 'retired' ? ' (retired)' : ''),
        h('td', null, e.typeCode), h('td', null, EQ.statusBadge(e.status)), h('td', null, EQ.duration(EQ.inStatusFor(e) || 0)),
        h('td', null, String(EQ.shownOpenJobs(e.id).length)), h('td', null, EQ.fmtInstantShort(e.lastActivity)), h('td', null, EQ.verified(e) ? e.modelCode : 'No verified model'))))));
  }

  // ------------------------------------------------------------------ KPI tile row (U1-C31)
  function kpiRow(typed, counts, stat, setQ, tv) {
    const marks = { total: 'list', share: 'chart', readyForOps: 'check-circle', isolated: 'octagon-x' };
    const label = (k, text) => h('span', { class: 'lbl' }, icon(marks[k], 'k-label-icon'), h('span', null, text));
    const active = typed.filter((e) => e.lifecycle === 'active');
    const types = ['QC', 'RTG', 'ES'].filter((t) => active.some((e) => e.typeCode === t));
    const byType = (status) => types.map((t) => [t, active.filter((e) => e.typeCode === t && (!status || EQ.statusKey(e.status) === status)).length]);
    const summaryText = (status) => byType(status).map(([t, n]) => t + ': ' + n).join(', ');
    const summary = (status) => h('span', { class: 'k-types', 'aria-label': 'Equipment type counts' }, byType(status).map(([t, n]) => h('span', { class: 'k-type', 'data-eq-type': t, 'aria-label': t + ': ' + n, title: EQ.fleetArtName(t) + ': ' + n }, EQ.fleetArt(t), h('span', { class: 'k-type-count' }, h('span', { class: 'k-code' }, t), h('b', null, String(n))))));
    const pct = counts.total ? Math.round((counts.readyForOps / counts.total) * 100) + ' %' : '—';
    const tile = (k, n) => {
      const breakdown = true;
      const kids = [h('span', { class: 'k-top' }, h('span', { class: 'n' }, String(n)), breakdown ? summary(k) : null), label(k, EQ.STATUS[k].category || EQ.STATUS[k].label)];
      if (tv) return h('div', { class: 'count-card kpi kpi-' + k, 'data-kpi': k }, ...kids);
      return h('button', { type: 'button', class: 'count-card kpi kpi-' + k, 'data-kpi': k, 'aria-pressed': stat === k ? 'true' : 'false', 'data-fk': 'cc-' + k, 'aria-label': EQ.STATUS[k].label + ': ' + n + (breakdown ? ', ' + summaryText(k) : '') + (stat === k ? ', filter on' : ''), title: 'Show only ' + EQ.STATUS[k].label + (breakdown ? ' · ' + summaryText(k) : ''), onClick: () => setQ({ status: stat === k ? '' : k }) }, ...kids);
    };
    return h('div', { class: 'count-strip kpi-row', role: 'group', 'aria-label': tv ? 'Status counts (active equipment)' : 'Status counts (active equipment; select to filter)' },
      h('div', { class: 'count-card total kpi kpi-total', 'data-kpi': 'total', title: 'Active equipment; retired items are excluded' },
        h('span', { class: 'k-top' }, h('span', { class: 'n' }, String(counts.total)), summary()),
        label('total', 'Active equipment')),
      h('div', { class: 'count-card kpi kpi-share', 'data-kpi': 'share', title: 'Ready for OPS: ' + counts.readyForOps + ' of ' + counts.total + ' active equipment, ' + pct + ' percent' }, h('span', { class: 'k-top' }, h('span', { class: 'n' }, pct)), label('share', 'Ready for OPS')),
      tile('readyForOps', counts.readyForOps), tile('isolated', counts.isolated));
  }
  function groupHead(t, c, tv, n) {
    return h('header', null, h('span', { class: 'g-art', 'aria-hidden': 'true' }, EQ.fleetArt(t)), h('h2', { id: 'fg-' + t }, TYPE_LABEL[t]), h('span', { class: 'g-n' }, String(n)),
      h('span', { class: 'mini-counts', 'aria-label': 'Counts for ' + t },
        [['readyForOps', 'check-circle'], ['isolated', 'octagon-x']].map(([k, ic]) => h('span', { class: 'badge st-' + k, title: EQ.STATUS[k].label + ': ' + c[k], 'aria-label': EQ.STATUS[k].label + ': ' + c[k] }, icon(ic), String(c[k])))),
      t !== 'QC' && !tv ? h('span', { class: 'tag dashed' }, '3D not available in stage 1') : null);
  }

  // ------------------------------------------------------------------ TV mode (U1-C28)
  function tvHead(q) {
    const S = EQ.state, stale = S.data === 'stale';
    return h('header', { class: 'tvf-head' },
      h('h1', null, 'EQ Fleet'), h('span', { class: 'tag syn' }, 'Synthetic data'),
      h('span', { class: 'tvf-updated' + (stale ? ' stale' : ''), 'data-fk': 'tv-updated' }, icon('clock'), 'Updated ' + EQ.fmtTime(stale || S.data === 'error' ? S.lastGoodAt : S.refreshedAt).slice(0, 5) + ' Asia/Colombo · refreshes every 60 s' + (stale ? ' · STALE' : '')),
      h('span', { class: 'tvf-tools' }, pauseBtn(q, true), h('button', { type: 'button', class: 'btn-sm pa-btn primary', 'data-fk': 'fleet-tv-exit', onClick: () => exitTv(q) }, icon('x'), 'Exit TV mode')));
  }
  function tvFoot() {
    return h('footer', { class: 'tvf-foot' }, h('span', null, icon('info'), "Equipment status is updated manually. Long term isolated EQ counts equipment marked Isolated."), h('span', { class: 'tvf-pager', 'data-fk': 'tv-pager', 'aria-live': 'off' }));
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
  // One timer: reconcile live motion preference (change events can be delayed), then TV paging.
  setInterval(() => {
    const root = document.querySelector('.fleet-page');
    const control = root?.querySelector('[data-fk="tv-page-pause"]');
    if (root && (root.classList.contains('fleet-motion-paused') !== !!paused(EQ.route.query)
      || (control && control.disabled !== !!motionOff(EQ.route.query)))) {
      ui.lastFlip = Date.now(); EQ.rerender(); return;
    }
    if (!root?.classList.contains('tv-fleet') || ui.tvPages < 2) return;
    if (!paused(EQ.route.query) && Date.now() - ui.lastFlip >= TV_FLIP_S * 1000) { ui.tvPage = (ui.tvPage + 1) % ui.tvPages; ui.tvPageWanted = ui.tvPage; ui.lastFlip = Date.now(); }
    applyTvPage(root);
  }, 1000);
  window.addEventListener('resize', () => { if (document.querySelector('.fleet-page.tv-fleet')) EQ.rerender(); });
  reducedMotion?.addEventListener('change', () => {
    ui.lastFlip = Date.now();
    if (document.querySelector('.fleet-page')) EQ.rerender();
  });
  EQ.fleetTvState = () => ({ page: ui.tvPage, pages: ui.tvPages, paused: paused(EQ.route.query) });

  EQ.views.fleet = function fleet(q) {
    const S = EQ.state;
    const tv = q.tv === '1';
    const type = ['QC','RTG','ES'].includes(q.type) ? q.type : 'all', stat = ['readyForOps','isolated'].includes(q.status) ? q.status : '', retired = !tv && q.lifecycle === 'all';
    if (q.q != null) ui.q = q.q;
    const setQ = (patch) => EQ.nav('/eq/fleet', { type: 'all', status: '', lifecycle: '', ...q, ...patch });
    const page = h('div', { class: 'page fleet-page pa' + (tv ? ' tv-fleet' : '') + (paused(q) ? ' fleet-motion-paused' : '') });
    if (!tv) page.appendChild(h('h1', { class: 'sr-only' }, 'Fleet')); // the visible heading block was removed in U1-C02
    else page.appendChild(tvHead(q));

    if (S.data === 'loading') {
      page.appendChild(h('div', { 'aria-busy': 'true', role: 'status' }, h('span', { class: 'sr-only' }, 'Loading fleet'), h('div', { class: 'count-strip kpi-row' }, [1, 2, 3, 4].map(() => h('div', { class: 'skeleton', style: 'height:4.4rem' }))), h('div', { class: 'card-grid' }, Array.from({ length: 8 }, () => h('div', { class: 'skeleton', style: 'height:3.6rem' })))));
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
        h('p', null, EQ.perm.admin() ? 'Register the first QC, RTG or ES item and explicitly choose its initial status.' : 'An Asset Management Admin registers the equipment. Until then there is nothing to show here.'),
        EQ.perm.admin() && !tv ? h('button', { type: 'button', class: 'primary', onClick: () => EQ.dlg.newEquipment() }, 'Register equipment') : null));
      return page;
    }
    const sb = staleBanner(); if (sb) page.appendChild(sb);

    const typed = all.filter(e => (type === 'all' || e.typeCode === type) && (!ui.q || (e.code + ' ' + e.name + ' ' + (e.modelCode || '')).toLowerCase().includes(ui.q.toLowerCase())));
    const counts = EQ.fleetCounts(typed);
    if (!tv) page.appendChild(h('div', { class: 'fleet-bar' }, freshness(), h('span', { class: 'fb-tools' }, refreshBtn(), pauseBtn(q), tvBtn(q))));
    page.appendChild(h('div', { class: 'fleet-top' }, kpiRow(typed, counts, stat, setQ, tv)));

    if (!tv) {
      const search = h('input', { type: 'search', id: 'fq', 'data-fk': 'fq', value: ui.q, autocomplete: 'off', placeholder: 'Code, name or model' });
      search.addEventListener('input', () => { ui.q = search.value; EQ.rerender(); });
      page.appendChild(h('div', { class: 'panel filters' },
        h('div', { class: 'field' }, h('span', { class: 'label', id: 'tl' }, 'Equipment type'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'tl' }, ['all', 'QC', 'RTG', 'ES'].map((t) => h('button', { type: 'button', 'aria-pressed': type === t ? 'true' : 'false', 'data-fk': 'type-' + t, onClick: () => setQ({ type: t }) }, t === 'all' ? 'All types' : t)))),
        h('div', { class: 'field grow' }, h('label', { for: 'fq' }, 'Search equipment'), search),
        h('label', { class: 'check', style: 'min-height:2.5rem' }, h('input', { type: 'checkbox', checked: retired ? true : null, 'data-fk': 'ret', onChange: (e) => setQ({ lifecycle: e.target.checked ? 'all' : '' }) }), 'Include retired'),
        h('div', { class: 'field' }, h('span', { class: 'label', id: 'vl' }, 'Layout'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'vl' }, ['cards', 'table'].map((v) => h('button', { type: 'button', 'aria-pressed': (q.layout || 'cards') === v ? 'true' : 'false', 'data-fk': 'lay-' + v, onClick: () => setQ({ layout: v }) }, v === 'cards' ? 'Cards' : 'Table')))),
        stat ? h('button', { type: 'button', class: 'btn-sm', onClick: () => setQ({ status: '' }) }, icon('x'), 'Clear status filter') : null,
        EQ.perm.admin() ? h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.newEquipment() }, icon('plus'), 'Register equipment') : null));
    }

    const match = (e) => (retired || e.lifecycle === 'active')
      && (!stat || EQ.statusKey(e.status) === stat)
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
