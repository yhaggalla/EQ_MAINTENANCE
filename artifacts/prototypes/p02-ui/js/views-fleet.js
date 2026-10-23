/* Fleet dashboard: QC / RTG / ES groups, status counts, search/filter, freshness, links. No WebGL canvases, ever. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const ui = (EQ.fleetUI = { q: '' });
  const TYPE_LABEL = { QC: 'Quay cranes (QC)', RTG: 'Rail/rubber-tyred gantry cranes (RTG)', ES: 'ES equipment' };

  // U1-C02: the large "Fleet overview" heading block is gone; its meaning is kept in this compact note.
  // P02B (SOW V2 s4.5): the "manual status, no telemetry" note is replaced by the automatic-status meaning.
  const STATUS_NOTE = "Status is set automatically from today's ZMMS daily jobs (Auto): a breakdown job means Breakdown, a maintenance job means Maintenance, equipment not in the day's plan is Ready for OPS. The EQ Team can correct it with a reason (Manual); the correction holds for the current day and the equipment returns to automatic at the first sync of the next day. Equipment not linked to ZMMS keeps a manual status. Equipment that has never been set shows Unreported, not Ready.";
  function statusNote() {
    return h('span', { class: 'status-note', tabindex: '0', title: STATUS_NOTE, 'aria-describedby': 'status-note-text', 'data-fk': 'status-note' }, icon('info'), 'Automatic status from ZMMS', h('span', { id: 'status-note-text', class: 'sr-only' }, STATUS_NOTE));
  }
  function freshness() {
    const S = EQ.state;
    const stale = S.data === 'stale' || S.data === 'error';
    return h('div', { class: 'freshness' },
      h('span', { title: 'Auto-refresh every 60 s and after every change' }, icon('clock'), ' Refreshed ', h('strong', null, EQ.fmtTime(stale ? S.lastGoodAt : S.refreshedAt)), ' Asia/Colombo'),
      h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'refresh', onClick: () => EQ.refresh(true) }, icon('refresh'), 'Refresh'),
      zmmsFresh(),
      statusNote());
  }
  function zmmsFresh() {
    const f = EQ.zmms.freshness();
    return h('span', { class: 'zmms-fresh' + (f.stale ? ' stale' : ''), 'data-fk': 'zmms-fresh', title: f.stale ? 'The latest ZMMS sync failed or is overdue. Previous data and statuses are kept; nothing was changed.' : 'Read-only ZMMS daily-job list, two syncs a day' },
      icon(f.stale ? 'alert' : 'sync'), EQ.zmms.freshLabel(), f.stale ? h('strong', null, ' · stale: latest sync ' + (f.latestOutcome === 'failed' ? 'failed (' + f.failureCode + ')' : 'overdue')) : null);
  }
  function staleBanner() {
    const S = EQ.state;
    if (S.data === 'stale') return h('div', { class: 'notice warn', role: 'status' }, icon('wifi-off'), h('div', null,
      h('p', null, h('strong', null, 'Showing the last good data from ' + EQ.fmtTime(S.lastGoodAt) + '. '), 'The refresh at ' + EQ.fmtTime(S.failedAt || Date.now()) + ' failed (network). Statuses may be out of date; nothing has been reset to Ready.'),
      h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Try again'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls to simulate recovery.'))));
    return null;
  }
  function thumb(type) { return h('span', { class: 'thumb', 'aria-hidden': 'true', title: 'Type thumbnail (not a model)' }, icon(type.toLowerCase())); }

  // U1-C02: compact card (about half the height of the P02 card) so more equipment fits on screen; the update time and
  // model stay available in the card title and in the table layout.
  function srcTag(e) {
    const m = EQ.zmms.mode(e);
    return h('span', { class: 'src ' + (m.label === 'Auto' ? 'auto' : 'manual'), title: m.long }, m.label);
  }
  function eqCard(e) {
    const dur = EQ.inStatusFor(e);
    const open = EQ.shownOpenJobs(e.id).length; // U1-C26: jobs switched off for the dashboard / 3D are not counted on the fleet card
    const m = EQ.zmms.mode(e);
    const zc = EQ.zmms.todayCount(e);
    const model = EQ.verified(e) ? e.modelCode : (e.typeCode === 'QC' ? 'No verified model' : 'No 3D in stage 1');
    return h('a', { class: 'eq-card' + (e.lifecycle === 'retired' ? ' retired' : ''), href: '#/eq/equipment/' + e.id, 'aria-label': e.code + ', ' + EQ.STATUS[EQ.statusKey(e.status)].label + ', status source ' + m.label + (zc != null ? ', ' + zc + ' ZMMS daily jobs today' : ', not linked to ZMMS'), title: e.name + ' · ' + m.long + (zc != null ? ' · ' + zc + ' ZMMS job(s) today' : '') + ' · Updated ' + EQ.fmtInstantShort(e.lastActivity) + ' · ' + model },
      thumb(e.typeCode),
      h('span', { class: 'code' }, e.code, e.lifecycle === 'retired' ? h('span', { class: 'tag' }, 'Retired') : null, EQ.statusBadge(e.status)),
      h('span', { class: 'meta' }, dur != null ? 'For ' + EQ.duration(dur) : 'No status reported yet', ' · ' + open + ' open · ', srcTag(e), zc != null ? h('span', { class: 'zc', 'data-zmms-today': String(zc) }, ' · ZMMS ' + zc) : null));
  }
  function table(list) {
    return h('div', { class: 'panel table-wrap' }, h('table', null,
      h('caption', { class: 'sr-only' }, 'Equipment, status and last update'),
      h('thead', null, h('tr', null, ['Equipment', 'Type', 'Status', 'Source', 'ZMMS jobs today', 'Time in status', 'Open special jobs', 'Last updated', 'Model'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, list.map((e) => { const d = EQ.inStatusFor(e); return h('tr', { class: e.lifecycle === 'retired' ? 'inactive' : '' },
        h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + e.id }, e.code), e.lifecycle === 'retired' ? ' (retired)' : ''),
        h('td', null, e.typeCode), h('td', null, EQ.statusBadge(e.status)), h('td', null, srcTag(e), ' ', EQ.zmms.mode(e).key === 'manualUnmapped' ? h('span', { class: 'small muted' }, 'not linked to ZMMS') : null), h('td', null, EQ.zmms.todayCount(e) == null ? '-' : String(EQ.zmms.todayCount(e))), h('td', null, d != null ? EQ.duration(d) : 'Not reported'),
        h('td', null, String(EQ.shownOpenJobs(e.id).length)), h('td', null, EQ.fmtInstantShort(e.lastActivity)), h('td', null, EQ.verified(e) ? e.modelCode : 'None verified')); }))));
  }

  EQ.views.fleet = function fleet(q) {
    const S = EQ.state;
    const type = q.type || 'all', stat = q.status || '', retired = q.lifecycle === 'all', src = q.source || '';
    const setQ = (patch) => EQ.nav('/eq/fleet', { type: 'all', status: '', lifecycle: '', source: '', ...q, ...patch });
    const page = h('div', { class: 'page fleet-page' });
    page.appendChild(h('h1', { class: 'sr-only' }, 'Fleet')); // the visible heading block was removed in U1-C02

    if (S.data === 'loading') {
      page.appendChild(h('div', { 'aria-busy': 'true', role: 'status' }, h('span', { class: 'sr-only' }, 'Loading fleet'), h('div', { class: 'count-strip' }, [1, 2, 3, 4, 5].map(() => h('div', { class: 'skeleton', style: 'height:4rem' }))), h('div', { class: 'card-grid' }, Array.from({ length: 8 }, () => h('div', { class: 'skeleton', style: 'height:6.2rem' })))));
      return page;
    }
    if (S.data === 'error') {
      page.appendChild(freshness());
      page.appendChild(h('div', { class: 'panel panel-pad' }, h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'The fleet could not be loaded. '), 'No data is available to show. Nothing is displayed as Ready for OPS when the status is unknown.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls.'))))));
      return page;
    }
    const all = S.data === 'empty' ? [] : S.D.equipment;
    if (!all.length) {
      page.appendChild(h('div', { class: 'panel empty' }, icon('list'), h('h2', null, 'No equipment is registered yet'),
        h('p', null, EQ.perm.admin() ? 'Register the first QC, RTG or ES item. It will start as Unreported.' : 'An EQ Maintenance Admin registers the equipment. Until then there is nothing to show here.'),
        EQ.perm.admin() ? h('button', { type: 'button', class: 'primary', onClick: () => EQ.dlg.newEquipment() }, 'Register equipment') : null));
      return page;
    }
    const sb = staleBanner(); if (sb) page.appendChild(sb);

    const typed = all.filter((e) => type === 'all' || e.typeCode === type);
    const counts = EQ.fleetCounts(typed);
    const card = (k, n, active) => h('button', { type: 'button', class: 'count-card', 'aria-pressed': stat === k ? 'true' : 'false', 'data-fk': 'cc-' + k, 'aria-label': EQ.STATUS[k].label + ': ' + n + (stat === k ? ', filter on' : ''), onClick: () => setQ({ status: stat === k ? '' : k }) },
      h('span', { class: 'lbl' }, EQ.statusBadge(k === 'unreported' ? null : k)), h('span', { class: 'n' }, String(n)));
    page.appendChild(h('div', { class: 'fleet-top' },
      h('div', { class: 'count-strip', role: 'group', 'aria-label': 'Status counts (active equipment; select to filter)' },
        card('readyForOps', counts.readyForOps), card('breakdown', counts.breakdown), card('maintenance', counts.maintenance), card('unreported', counts.unreported),
        h('div', { class: 'count-card total', title: 'Active equipment; retired items are excluded' }, h('span', { class: 'lbl' }, 'Active'), h('span', { class: 'n' }, String(counts.total)))),
      freshness()));

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

    const match = (e) => (retired || e.lifecycle === 'active')
      && (!stat || EQ.statusKey(e.status) === stat)
      && (!src || (src === 'auto' ? EQ.zmms.mode(e).label === 'Auto' : EQ.zmms.mode(e).label === 'Manual'))
      && (!ui.q || (e.code + ' ' + e.name + ' ' + (e.modelCode || '')).toLowerCase().includes(ui.q.toLowerCase()));
    const types = type === 'all' ? ['QC', 'RTG', 'ES'] : [type];
    let shown = 0;
    types.forEach((t) => {
      const list = typed.filter((e) => e.typeCode === t).filter(match);
      shown += list.length;
      const c = EQ.fleetCounts(typed.filter((e) => e.typeCode === t));
      page.appendChild(h('section', { class: 'fleet-group', 'aria-labelledby': 'fg-' + t },
        h('header', null, h('h2', { id: 'fg-' + t }, TYPE_LABEL[t]), h('span', { class: 'mini-counts', 'aria-label': 'Counts for ' + t },
          [['readyForOps', 'check-circle'], ['breakdown', 'octagon-x'], ['maintenance', 'wrench'], ['unreported', 'dashed']].map(([k, ic]) => h('span', { class: 'badge st-' + k, title: EQ.STATUS[k].label + ': ' + c[k], 'aria-label': EQ.STATUS[k].label + ': ' + c[k] }, icon(ic), String(c[k])))),
          t !== 'QC' ? h('span', { class: 'tag dashed' }, '3D not available in stage 1') : null),
        list.length ? ((q.layout || 'cards') === 'table' ? table(list) : h('div', { class: 'card-grid' }, list.map(eqCard))) : h('div', { class: 'panel empty' }, 'No ' + t + ' equipment matches these filters.')));
    });
    if (!shown) page.appendChild(h('div', { class: 'panel empty' }, icon('search'), h('p', null, 'Nothing matches. '), h('button', { type: 'button', class: 'btn-sm', onClick: () => { ui.q = ''; EQ.nav('/eq/fleet', {}); } }, 'Clear all filters')));
    return page;
  };
})(window.EQ);
