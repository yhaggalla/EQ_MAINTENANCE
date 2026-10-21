/* Fleet dashboard: QC / RTG / ES groups, status counts, search/filter, freshness, links. No WebGL canvases, ever. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const ui = (EQ.fleetUI = { q: '' });
  const TYPE_LABEL = { QC: 'Quay cranes (QC)', RTG: 'Rail/rubber-tyred gantry cranes (RTG)', ES: 'ES equipment' };

  function freshness() {
    const S = EQ.state;
    const stale = S.data === 'stale' || S.data === 'error';
    return h('div', { class: 'freshness' },
      h('span', null, icon('clock'), ' Data refreshed ', h('strong', null, EQ.fmtTime(stale ? S.lastGoodAt : S.refreshedAt)), ' Asia/Colombo'),
      h('span', null, 'Auto-refresh every 60 s and after every change'),
      h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'refresh', onClick: () => EQ.refresh(true) }, icon('refresh'), 'Refresh now'));
  }
  function staleBanner() {
    const S = EQ.state;
    if (S.data === 'stale') return h('div', { class: 'notice warn', role: 'status' }, icon('wifi-off'), h('div', null,
      h('p', null, h('strong', null, 'Showing the last good data from ' + EQ.fmtTime(S.lastGoodAt) + '. '), 'The refresh at ' + EQ.fmtTime(S.failedAt || Date.now()) + ' failed (network). Statuses may be out of date; nothing has been reset to Ready.'),
      h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Try again'), h('span', { class: 'small' }, 'Prototype: choose "Normal" in Prototype controls to simulate recovery.'))));
    return null;
  }
  function thumb(type) { return h('span', { class: 'thumb', 'aria-hidden': 'true', title: 'Type thumbnail (not a model)' }, icon(type.toLowerCase())); }

  function eqCard(e) {
    const dur = EQ.inStatusFor(e);
    const open = EQ.openJobs(e.id).length;
    return h('a', { class: 'eq-card' + (e.lifecycle === 'retired' ? ' retired' : ''), href: '#/equipment/' + e.id, 'aria-label': e.code + ', ' + EQ.STATUS[EQ.statusKey(e.status)].label },
      thumb(e.typeCode),
      h('span', { class: 'code' }, e.code, e.lifecycle === 'retired' ? h('span', { class: 'tag' }, 'Retired') : null),
      h('span', null, EQ.statusBadge(e.status)),
      h('span', { class: 'meta' }, dur != null ? 'In ' + EQ.STATUS[e.status].label + ' for ' + EQ.duration(dur) : 'No status reported yet'),
      h('span', { class: 'meta', style: 'grid-column:1 / -1' },
        EQ.plural(open, 'open job'), ' · Updated ', EQ.fmtInstantShort(e.lastActivity), ' · ',
        EQ.verified(e) ? e.modelCode : (e.typeCode === 'QC' ? 'No verified model' : 'No 3D in stage 1')));
  }
  function table(list) {
    return h('div', { class: 'panel table-wrap' }, h('table', null,
      h('caption', { class: 'sr-only' }, 'Equipment, status and last update'),
      h('thead', null, h('tr', null, ['Equipment', 'Type', 'Status', 'Time in status', 'Open jobs', 'Last updated', 'Model'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, list.map((e) => { const d = EQ.inStatusFor(e); return h('tr', { class: e.lifecycle === 'retired' ? 'inactive' : '' },
        h('th', { scope: 'row' }, h('a', { href: '#/equipment/' + e.id }, e.code), e.lifecycle === 'retired' ? ' (retired)' : ''),
        h('td', null, e.typeCode), h('td', null, EQ.statusBadge(e.status)), h('td', null, d != null ? EQ.duration(d) : 'Not reported'),
        h('td', null, String(EQ.openJobs(e.id).length)), h('td', null, EQ.fmtInstantShort(e.lastActivity)), h('td', null, EQ.verified(e) ? e.modelCode : 'None verified')); }))));
  }

  EQ.views.fleet = function fleet(q) {
    const S = EQ.state;
    const type = q.type || 'all', stat = q.status || '', retired = q.lifecycle === 'all';
    const setQ = (patch) => EQ.nav('/fleet', { type: 'all', status: '', lifecycle: '', ...q, ...patch });
    const page = h('div', { class: 'page' });
    page.appendChild(h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'eyebrow' }, 'Fleet overview'), h('h1', null, 'Fleet'),
      h('p', null, 'Operational status is reported manually by the EQ Team. There is no live telemetry. Equipment that has never been set shows Unreported, not Ready.')),
      EQ.perm.admin() ? h('button', { type: 'button', onClick: () => EQ.dlg.newEquipment() }, icon('plus'), 'Register equipment') : null));

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
    page.appendChild(freshness());
    const sb = staleBanner(); if (sb) page.appendChild(sb);

    const typed = all.filter((e) => type === 'all' || e.typeCode === type);
    const counts = EQ.fleetCounts(typed);
    const card = (k, n, active) => h('button', { type: 'button', class: 'count-card', 'aria-pressed': stat === k ? 'true' : 'false', 'data-fk': 'cc-' + k, 'aria-label': EQ.STATUS[k].label + ': ' + n + (stat === k ? ', filter on' : ''), onClick: () => setQ({ status: stat === k ? '' : k }) },
      h('span', { class: 'lbl' }, EQ.statusBadge(k === 'unreported' ? null : k)), h('span', { class: 'n' }, String(n)));
    page.appendChild(h('div', { class: 'count-strip', role: 'group', 'aria-label': 'Status counts (active equipment; select to filter)' },
      card('readyForOps', counts.readyForOps), card('breakdown', counts.breakdown), card('maintenance', counts.maintenance), card('unreported', counts.unreported),
      h('div', { class: 'count-card', style: 'cursor:default' }, h('span', { class: 'lbl' }, 'Active equipment'), h('span', { class: 'n' }, String(counts.total)), h('span', { class: 'small muted' }, 'Retired items are excluded'))));

    const search = h('input', { type: 'search', id: 'fq', 'data-fk': 'fq', value: ui.q, autocomplete: 'off', placeholder: 'Code, name or model' });
    search.addEventListener('input', () => { ui.q = search.value; EQ.rerender(); });
    page.appendChild(h('div', { class: 'panel filters' },
      h('div', { class: 'field' }, h('span', { class: 'label', id: 'tl' }, 'Equipment type'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'tl' }, ['all', 'QC', 'RTG', 'ES'].map((t) => h('button', { type: 'button', 'aria-pressed': type === t ? 'true' : 'false', 'data-fk': 'type-' + t, onClick: () => setQ({ type: t }) }, t === 'all' ? 'All types' : t)))),
      h('div', { class: 'field grow' }, h('label', { for: 'fq' }, 'Search equipment'), search),
      h('label', { class: 'check', style: 'min-height:2.5rem' }, h('input', { type: 'checkbox', checked: retired ? true : null, 'data-fk': 'ret', onChange: (e) => setQ({ lifecycle: e.target.checked ? 'all' : '' }) }), 'Include retired'),
      h('div', { class: 'field' }, h('span', { class: 'label', id: 'vl' }, 'Layout'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'vl' }, ['cards', 'table'].map((v) => h('button', { type: 'button', 'aria-pressed': (q.layout || 'cards') === v ? 'true' : 'false', 'data-fk': 'lay-' + v, onClick: () => setQ({ layout: v }) }, v === 'cards' ? 'Cards' : 'Table')))),
      stat ? h('button', { type: 'button', class: 'btn-sm', onClick: () => setQ({ status: '' }) }, icon('x'), 'Clear status filter') : null));

    const match = (e) => (retired || e.lifecycle === 'active')
      && (!stat || EQ.statusKey(e.status) === stat)
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
    if (!shown) page.appendChild(h('div', { class: 'panel empty' }, icon('search'), h('p', null, 'Nothing matches. '), h('button', { type: 'button', class: 'btn-sm', onClick: () => { ui.q = ''; EQ.nav('/fleet', {}); } }, 'Clear all filters')));
    return page;
  };
})(window.EQ);
