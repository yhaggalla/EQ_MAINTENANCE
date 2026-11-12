/* U1-C63 EQ Jobs: Spare parts condition (first/default, U1-C69) | Special/Projects | EQ status. No daily external work or automatic status.
   Shared filters (equipment, type, date range, search) are kept in the URL across
   the tabs. Work history lives here, not in the crane view: the scoped history (DATA s9) opens with equipment + scope + target ("Open in
   Jobs"). EQ Team and Admin add special jobs and spare parts here (U1-C21). Synthetic data only. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const kit = () => EQ._dlg;

  const PARTS = [['spare-parts', 'Spare parts condition'], ['special', 'Special/Projects'], ['status', 'EQ status']]; // U1-C69: Spare parts condition first and default
  const SHARED = ['equipment', 'type', 'from', 'to'];
  const fmtD = (iso) => EQ.fmtDate(iso);

  /** CSV stand-in for the server-generated .xlsx (P08B): formula-safe cells, filtered rows only. */
  EQ.downloadCsv = function downloadCsv(name, columns, rows) {
    const esc = (v) => { const t = String(v == null ? '' : v); const u = /^[=+\-@\t\r]/.test(t) ? "'" + t : t; return /[",\n]/.test(u) ? '"' + u.replace(/"/g, '""') + '"' : u; };
    const csv = [columns, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    try { const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); const a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); } catch (e) { /* download blocked: the rows remain on screen */ }
    return csv;
  };

  // ---------------------------------------------------------------- queries
  function eqList(q) {
    return EQ.state.D.equipment.filter((e) => (!q.type || e.typeCode === q.type) && (!q.equipment || e.id === q.equipment));
  }
  EQ.eqExport = function eqExport(kind, q) {
    const deny = EQ.access.srv('export.excel') || EQ.access.srv('eq.jobs.view'); if (deny) return deny;
    if (kind === 'spare') { const rows = spareRows(q); return { ok: true, columns: ['Equipment', 'Type', 'Main', 'Sub', 'Position', 'Spare-part type', 'Condition', 'Brand', 'Model/part no.', 'Serial', 'Replaced date', 'Expected life (months)', 'Next predicted replacement', 'Flag', 'Remarks'], rows: rows.map((r) => [r.eq.code, r.eq.typeCode, r.mainCode, r.subCode, r.pos.name, r.typeName, r.condition || 'Not recorded', r.brand || '', r.model || '', r.serial || '', r.replacedOn || '', r.lifeMonths == null ? '' : r.lifeMonths, r.predicted || r.why, r.flag || '', r.remarks]) }; }
    if (!['special','spare'].includes(kind)) return { ok: false, status: 404, code: 'export_not_found', message: 'This export is not available.' };
    const jobs = EQ.specialJobs(q); if (!Array.isArray(jobs)) return jobs;
    return { ok: true, columns: ['Number', 'Equipment', 'Kind', 'Title', 'Work status', 'Cancelled', 'Planned date', 'Completed date', 'Shown on dashboard / 3D'], rows: jobs.map((j) => [j.number, EQ.jobEquipmentLabel(j), j.kind, j.title, j.workStatus, j.isCancelled ? 'Yes' : '', j.plannedOn || '', j.completedOn || '', EQ.shownOnDashboard(j) ? 'Yes' : 'No']) }; // U1-C26: hidden jobs stay in the export
  };
  function spareRows(q) {
    const sc = scopeFromQ(q);
    const ids = new Set(eqList(q).map((e) => e.id));
    let rows = EQ.spares.allRows((r) => ids.has(r.equipmentId));
    if (sc) rows = rows.filter((r) => (sc.level === 'main' ? r.pos.mainId === sc.id : sc.level === 'sub' ? r.pos.subId === sc.id : r.posId === sc.id));
    if (q.flag === 'notRecorded') rows = rows.filter((r) => !r.condition); else if (q.flag) rows = rows.filter((r) => r.flag === q.flag);
    const needle = (EQ.jobsUI.q || '').toLowerCase();
    if (needle) rows = rows.filter((r) => (r.pos.name + ' ' + r.typeName + ' ' + r.eq.code).toLowerCase().includes(needle));
    return rows;
  }
  function scopeFromQ(q) { return q.part ? { level: 'part', id: q.part } : q.sub ? { level: 'sub', id: q.sub } : q.main ? { level: 'main', id: q.main } : null; }

  // ---------------------------------------------------------------- page (U1-C79: Fleet-style layout - tiles, one filter bar, groups)
  const TYPES = ['QC', 'RTG', 'ES'];
  const TYPE_LABEL = { QC: 'Quay cranes (QC)', RTG: 'Rubber-tyred gantry cranes (RTG)', ES: 'ES equipment' };
  const TIP = {
    'spare-parts': 'Major spare parts per equipment: condition, fitted date and the predicted replacement date.',
    special: 'Projects and special work entered manually for equipment, a mechanism or a part.',
    status: 'Manual Ready for OPS / Isolated status of every active equipment, with its history.',
  };

  /** Fleet-style KPI tiles. defs: [{ k, n, text, icon, title, pressed, onClick, fk }] - a tile with onClick is a filter button. */
  function tiles(label, defs) {
    return h('div', { class: 'count-strip kpi-row jobs-kpis', role: 'group', 'aria-label': label }, defs.map((d) => {
      const kids = [h('span', { class: 'k-top' }, h('span', { class: 'n' }, String(d.n))), h('span', { class: 'lbl' }, icon(d.icon, 'k-label-icon'), h('span', null, d.text))];
      if (!d.onClick) return h('div', { class: 'count-card kpi kpi-' + d.k, 'data-kpi': d.k, title: d.title }, ...kids);
      return h('button', { type: 'button', class: 'count-card kpi kpi-' + d.k, 'data-kpi': d.k, 'data-fk': d.fk, 'aria-pressed': d.pressed ? 'true' : 'false', title: d.title,
        'aria-label': d.text + ': ' + d.n + (d.pressed ? ', filter on' : ''), onClick: d.onClick }, ...kids);
    }));
  }
  EQ.jobsTiles = tiles;

  /** The one filter bar of every Jobs tab: type, equipment, tab fields, search, clear, then the tab actions on the right. */
  function filterBar(q, part, setQ, o) {
    const S = EQ.state;
    const type = TYPES.includes(q.type) ? q.type : '';
    const search = h('input', { type: 'search', id: 'jq', 'data-fk': 'jq', value: EQ.jobsUI.q, placeholder: o.placeholder, autocomplete: 'off' });
    search.addEventListener('input', () => { EQ.jobsUI.q = search.value; EQ.rerender(); });
    const eqs = S.D.equipment.filter((e) => !type || e.typeCode === type);
    const active = Object.keys(q).some((k) => q[k] && !['removed'].includes(k)) || !!EQ.jobsUI.q;
    return h('form', { class: 'panel filters jobs-filters', role: 'search', 'aria-label': 'EQ Jobs filters', onSubmit: (e) => e.preventDefault() },
      h('div', { class: 'field' }, h('span', { class: 'label', id: 'jtl' }, 'Type'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'jtl' },
        ['', ...TYPES].map((t) => h('button', { type: 'button', 'aria-pressed': type === t ? 'true' : 'false', 'data-fk': 'jtype-' + (t || 'all'),
          onClick: () => setQ({ type: t, equipment: t && q.equipment && EQ.eq(q.equipment)?.typeCode !== t ? '' : q.equipment || '' }) }, t || 'All')))),
      h('div', { class: 'field' }, h('label', { for: 'flt-eq' }, 'Equipment'), h('select', { id: 'flt-eq', 'data-fk': 'flt-eq', onChange: (e) => setQ({ equipment: e.target.value }) },
        h('option', { value: '' }, 'All equipment'), eqs.map((e) => h('option', { value: e.id, selected: q.equipment === e.id ? true : null }, e.code)))),
      o.fields || null,
      h('div', { class: 'field grow' }, h('label', { for: 'jq' }, 'Search'), search),
      active ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'clear-filters', title: 'Clear all filters on this tab', onClick: () => { EQ.jobsUI.q = ''; EQ.nav('/eq/jobs/' + part, {}); } }, icon('x'), 'Clear') : null,
      o.actions ? h('div', { class: 'jobs-toolbar-actions' }, o.actions) : null);
  }
  EQ.jobsDateFields = (q, setQ, tip) => [
    h('div', { class: 'field', title: tip }, h('label', { for: 'flt-from' }, 'From'), h('input', { type: 'date', id: 'flt-from', 'data-fk': 'flt-from', value: q.from || '', onChange: (e) => setQ({ from: e.target.value }) })),
    h('div', { class: 'field', title: tip }, h('label', { for: 'flt-to' }, 'To'), h('input', { type: 'date', id: 'flt-to', 'data-fk': 'flt-to', value: q.to || '', onChange: (e) => setQ({ to: e.target.value }) }))];
  const exportBtn = (fk, kind, q, file, what) => (EQ.access.has('export.excel') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': fk, title: 'Download the rows shown as a spreadsheet', onClick: () => { const r = EQ.eqExport(kind, q); if (r.ok) { EQ.downloadCsv(file, r.columns, r.rows); EQ.toast('Exported ' + r.rows.length + ' ' + what, 'Prototype stand-in: CSV, not the server-generated .xlsx.'); } } }, icon('download'), 'Export') : null);

  EQ.views.eqJobs = function eqJobs(part, id, q) {
    const S = EQ.state;
    if (part === 'special' && id) return EQ.views.job(id);
    if (!PARTS.some((p) => p[0] === part)) part = 'spare-parts';
    const page = h('div', { class: 'page eqjobs-page pa' });
    if (q.removed) page.appendChild(h('p', { class: 'notice info', role: 'status' }, 'That view has been removed. Projects and special work remain available here.'));
    const setQ = (patch, p2) => EQ.nav('/eq/jobs/' + (p2 || part), { ...q, ...patch, removed: '' });
    const keepShared = Object.fromEntries(SHARED.filter((k) => q[k]).map((k) => [k, q[k]]));
    page.appendChild(h('h1', { class: 'sr-only' }, 'EQ Jobs'));
    page.appendChild(h('nav', { class: 'subtabs', 'aria-label': 'EQ Jobs parts' }, PARTS.map(([k, label]) => h('a', { href: '#/eq/jobs/' + k + (Object.keys(keepShared).length ? '?' + new URLSearchParams(keepShared).toString() : ''), 'aria-current': k === part ? 'page' : null, 'data-fk': 'jp-' + k, title: TIP[k] }, label))));

    if (S.data === 'loading') { page.appendChild(h('div', { 'aria-busy': 'true', role: 'status' }, h('div', { class: 'count-strip kpi-row jobs-kpis' }, [1, 2, 3, 4].map(() => h('div', { class: 'skeleton', style: 'height:4.4rem' }))), h('div', { class: 'skeleton', style: 'height:16rem;margin-top:.6rem' }))); return page; }
    if (S.data === 'error') { page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'Jobs could not be loaded. '), 'Nothing is shown as completed or pending without data.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'))))); return page; }
    if (S.data === 'stale') page.appendChild(h('div', { class: 'notice warn', role: 'status', style: 'margin-bottom:.6rem' }, icon('wifi-off'), h('p', null, 'Showing last good data from ' + EQ.fmtTime(S.lastGoodAt) + '; the latest refresh failed.')));
    if (S.data === 'empty') { page.appendChild(h('div', { class: 'panel empty' }, icon('list'), h('h2', null, 'No jobs yet'), h('p', null, "Register equipment and add jobs to start. Earlier work can be entered with its original completion date; no history is imported."))); return page; }

    if (part === 'special') special(page, q, setQ);
    else if (part === 'status') statusPart(page, q, setQ);
    else sparePart(page, q, setQ);
    return page;
  };

  // ---------------------------------------------------------------- Special/Projects (manual, SOW V2 s4.3)
  function special(page, q, setQ) {
    const actions = [exportBtn('export-special', 'special', q, 'eq-special-jobs.csv', 'special job(s)'),
      EQ.perm.write() ? h('button', { type: 'button', class: 'btn-sm primary', 'data-fk': 'add-job', onClick: () => EQ.dlg.jobForm({ equipmentId: q.equipment || '', equipmentTypeCode: q.type || '' }) }, icon('plus'), 'Add special job') : h('span', { class: 'tag gold', title: 'Your role can view jobs but not change them' }, 'Read-only')];
    const board = EQ.specialBoard(q);
    page.appendChild(board.tiles);
    page.appendChild(filterBar(q, 'special', setQ, { placeholder: 'Number, title, equipment or part', fields: board.fields, actions }));
    // scoped history (Open in Jobs from the crane view)
    if (q.equipment && EQ.eq(q.equipment) && q.scope) {
      const eq = EQ.eq(q.equipment);
      const sc = q.target ? { level: q.scope, id: q.target } : { level: 'equipment', id: null };
      const valid = sc.level === 'equipment' || (sc.level === 'part' && EQ.pos(sc.id) && EQ.pos(sc.id).equipmentId === eq.id) || (sc.level === 'sub' && eq.subs.some((s) => s.id === sc.id)) || (sc.level === 'main' && eq.mains.some((m) => m.id === sc.id));
      if (!valid) page.appendChild(h('div', { class: 'notice warn', role: 'status' }, icon('alert'), h('p', null, 'The link selects a target that does not belong to ' + eq.code + ' (422 target_not_in_equipment). Showing the equipment only.')));
      else {
        const sel = sc.level === 'part' ? EQ.eqv.resolveSel(eq, { part: sc.id }) : sc.level === 'sub' ? EQ.eqv.resolveSel(eq, { sub: sc.id }) : EQ.eqv.resolveSel(eq, { main: sc.id });
        page.appendChild(h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'sh-h', style: 'margin-bottom:.6rem' },
          h('div', { class: 'row between' }, h('h2', { id: 'sh-h' }, 'History of ' + EQ.eqv.scopeLabel(eq, sel)), h('div', { class: 'row' },
            EQ.perm.write() && eq.lifecycle === 'active' ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-job-scope', onClick: () => EQ.dlg.jobForm({ equipmentId: eq.id, prefill: sel }) }, icon('plus'), 'Add special job here') : null,
            h('a', { class: 'btn btn-sm', href: '#/eq/jobs/special?' + new URLSearchParams({ ...Object.fromEntries(SHARED.filter((k) => q[k]).map((k) => [k, q[k]])), equipment: eq.id }).toString(), 'data-fk': 'clear-scope' }, icon('x'), 'Clear scope'))),
          EQ.eqv.historyTab(eq, sel, sc)));
      }
    }
    page.appendChild(board.body);
  }

  // ---------------------------------------------------------------- manual EQ status: Fleet-style groups, Isolated first
  let histOpenStatus = false;
  function statusPart(page, q, setQ) {
    const needle = (EQ.jobsUI.q || '').toLowerCase();
    const stat = ['readyForOps', 'isolated'].includes(q.status) ? q.status : '';
    const base = eqList(q).filter((e) => e.lifecycle === 'active' && (!needle || (e.code + ' ' + e.name + ' ' + EQ.statusLabel(e.status) + ' ' + (e.statusReason || '')).toLowerCase().includes(needle)));
    const counts = EQ.fleetCounts(base);
    page.appendChild(tiles('Status counts (select to filter)', ['readyForOps', 'isolated'].map((k) => ({ k, n: counts[k], text: EQ.STATUS[k].category || EQ.STATUS[k].label, icon: EQ.STATUS[k].icon || (k === 'isolated' ? 'octagon-x' : 'check-circle'),
      fk: 'jst-' + k, pressed: stat === k, title: 'Show only ' + EQ.STATUS[k].label + ' equipment. Status is set manually by the EQ Team or an Admin.', onClick: () => setQ({ status: stat === k ? '' : k }) }))));
    page.appendChild(filterBar(q, 'status', setQ, { placeholder: 'Code, name, status or reason', fields: EQ.jobsDateFields(q, setQ, 'Applies to the status history only') }));
    if (EQ.manual.warning) page.appendChild(h('div', { class: 'notice warn', role: 'status' }, EQ.manual.warning));
    const list = base.filter((e) => !stat || EQ.statusKey(e.status) === stat);
    const order = (e) => (EQ.statusKey(e.status) === 'isolated' ? 0 : 1);
    const types = TYPES.filter((t) => list.some((e) => e.typeCode === t));
    if (!types.length) page.appendChild(h('div', { class: 'panel empty' }, icon('search'), h('p', null, 'No equipment matches these filters.')));
    types.forEach((t) => {
      const rows = list.filter((e) => e.typeCode === t).sort((a, b) => order(a) - order(b) || EQ.cmp(a.code, b.code));
      const c = EQ.fleetCounts(base.filter((e) => e.typeCode === t));
      page.appendChild(h('section', { class: 'fleet-group g-' + t.toLowerCase(), 'aria-labelledby': 'sg-' + t },
        h('header', null, h('span', { class: 'g-art', 'aria-hidden': 'true' }, EQ.fleetArt(t)), h('h2', { id: 'sg-' + t }, TYPE_LABEL[t]), h('span', { class: 'g-n' }, String(rows.length)),
          h('span', { class: 'mini-counts' }, [['readyForOps', 'check-circle'], ['isolated', 'octagon-x']].map(([k, ic]) => h('span', { class: 'badge st-' + k, title: EQ.STATUS[k].label + ': ' + c[k] }, icon(ic), String(c[k]))))),
        h('div', { class: 'panel table-wrap' }, h('table', { class: 'status-board' },
          h('caption', { class: 'sr-only' }, 'Manual status of ' + TYPE_LABEL[t] + ', Isolated first'),
          h('thead', null, h('tr', null, ['Equipment', 'Status', 'In status', 'Reason', 'Updated by', ''].map((col, i) => h('th', { scope: 'col', class: i === 5 ? 'act-col' : null }, col || h('span', { class: 'sr-only' }, 'Actions'))))),
          h('tbody', null, rows.map((e) => h('tr', { 'data-eq': e.id, class: EQ.statusKey(e.status) === 'isolated' ? 'iso-row' : null },
            h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + e.id, title: e.name }, e.code)), h('td', null, EQ.statusBadge(e.status)),
            h('td', { title: 'Since ' + EQ.fmtInstantShort(e.statusSince) }, EQ.duration(EQ.inStatusFor(e) || 0)), h('td', { class: 'reason' }, e.statusReason || '—'), h('td', { class: 'small muted' }, EQ.userName(e.statusBy)),
            h('td', { class: 'act-col' }, EQ.perm.write() ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'correct-' + e.id, onClick: () => EQ.dlg.status(e) }, icon('edit'), 'Update') : null))))))));
    });
    const ids = new Set(base.map((e) => e.id)), from = q.from || '0000-01-01', to = q.to || '9999-12-31';
    const hist = EQ.state.D.statusChanges.filter((c) => ids.has(c.equipmentId) && EQ.todayOf(c.at) >= from && EQ.todayOf(c.at) <= to).sort((a, b) => EQ.cmp(b.at, a.at));
    const det = h('details', { class: 'panel status-hist', open: histOpenStatus ? true : null, 'data-fk': 'status-history' },
      h('summary', null, h('h2', { id: 'sth-h' }, 'Status history'), h('span', { class: 'g-n' }, String(hist.length))),
      hist.length ? h('div', { class: 'table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Recorded manual status and labelled legacy events'), h('thead', null, h('tr', null, ['When', 'Equipment', 'Change', 'By', 'Reason', 'Related job'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, hist.map((c) => h('tr', { 'data-sc': c.id }, h('td', null, EQ.fmtInstantShort(c.at)), h('th', { scope: 'row' }, EQ.eq(c.equipmentId).code),
          h('td', null, c.prev ? EQ.statusLabel(c.prev) + ' → ' : 'First: ', EQ.statusBadge(c.status), c.legacy ? h('span', { class: 'tag', style: 'margin-left:.3rem', title: 'Recorded before manual status was introduced' }, 'Legacy') : null),
          h('td', null, c.by ? EQ.userName(c.by) : 'Recorded legacy source'), h('td', null, c.reason || '—'), h('td', null, c.relatedJobId && EQ.job(c.relatedJobId) ? h('a', { href: '#/eq/jobs/special/' + c.relatedJobId }, EQ.job(c.relatedJobId).number) : '—'))))))
        : h('p', { class: 'muted small', style: 'margin:.5rem .8rem' }, 'No status changes in this selection.'));
    det.addEventListener('toggle', () => { histOpenStatus = det.open; });
    page.appendChild(det);
  }
  EQ.todayOf = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date(iso));

  // ---------------------------------------------------------------- Spare parts condition: compact table grouped by equipment
  const FLAGS = { overdue: ['Overdue', 'red'], dueSoon: ['Due soon', 'gold'] };
  const histOpen = new Set();
  const RULE = 'Next replacement = fitted date + expected life (Original parts count from the commissioning date). No date or life: no estimate. Calendar estimate only, not a condition assessment.';
  function sparePart(page, q, setQ) {
    const rows = spareRows(q);
    const all = q.flag ? spareRows({ ...q, flag: '' }) : rows; // U1-C69: tile counts stay those of the whole selection
    const c = EQ.spares.counts(all), notRec = all.filter((r) => !r.condition).length;
    const pick = (v) => () => setQ({ flag: v && q.flag === v ? '' : v });
    page.appendChild(tiles('Spare-part flags (select to filter)', [
      { k: 'registered', n: all.length, text: 'Registered', icon: 'list', fk: 'jflag-all', pressed: !q.flag, title: 'Show all registered major spare parts', onClick: pick('') },
      { k: 'overdue', n: c.overdue, text: 'Overdue', icon: 'alert', fk: 'jflag-overdue', pressed: q.flag === 'overdue', title: 'Next predicted replacement date has passed. ' + RULE, onClick: pick('overdue') },
      { k: 'dueSoon', n: c.dueSoon, text: 'Due soon', icon: 'clock', fk: 'jflag-dueSoon', pressed: q.flag === 'dueSoon', title: 'Replacement predicted within ' + EQ.state.D.spare.dueSoonDays + ' days (Admin setting). ' + RULE, onClick: pick('dueSoon') },
      { k: 'notRecorded', n: notRec, text: 'Not recorded', icon: 'dashed', fk: 'jflag-notRecorded', pressed: q.flag === 'notRecorded', title: 'Condition not recorded yet, so there is no replacement estimate', onClick: pick('notRecorded') }]));
    const sc = scopeFromQ(q);
    page.appendChild(filterBar(q, 'spare-parts', setQ, { placeholder: 'Part, part type or equipment',
      fields: sc ? h('span', { class: 'tag dashed', title: 'Opened from the crane view selection' }, 'Scoped selection ', h('a', { href: '#/eq/jobs/spare-parts?' + new URLSearchParams(Object.fromEntries(SHARED.filter((k) => q[k]).map((k) => [k, q[k]]))).toString() }, 'clear')) : null,
      actions: [exportBtn('export-spare', 'spare', q, 'spare-part-register.csv', 'register row(s)'),
        EQ.perm.write() ? h('button', { type: 'button', class: 'btn-sm primary', 'data-fk': 'add-spare', onClick: () => addSpareDialog({ equipmentId: q.equipment || '', main: q.main || '', sub: q.sub || '', part: q.part || '' }) }, icon('plus'), 'Add spare part') : null] }));
    if (!rows.length) { page.appendChild(h('div', { class: 'panel empty' }, icon('cube'), h('p', null, 'No major spare parts match. ' + (EQ.perm.write() ? 'Use Add spare part to register one.' : 'The EQ Team or an Admin adds them.')))); return; }
    const w = EQ.perm.write(), COLS = 8;
    const groups = [];
    rows.forEach((r) => { const g = groups[groups.length - 1]; if (g && g.eq.id === r.equipmentId) g.rows.push(r); else groups.push({ eq: r.eq, rows: [r] }); });
    const head = [['Part', null], ['Condition', null], ['Brand · model', 'Serial number on hover'], ['Fitted', 'Replacement date; Original parts count from the commissioning date'], ['Life', 'Expected life in months (* = equipment override)'], ['Next replacement', RULE], ['Flag', null], ['', null]];
    page.appendChild(h('div', { class: 'panel table-wrap' }, h('table', { class: 'spare-table compact' },
      h('caption', { class: 'sr-only' }, 'Spare-part condition register, grouped by equipment'),
      h('thead', null, h('tr', null, head.map(([t, tip], i) => h('th', { scope: 'col', title: tip, class: i === 7 ? 'act-col' : null }, t || h('span', { class: 'sr-only' }, 'Actions'))))),
      h('tbody', null, groups.flatMap((g) => {
        const gc = EQ.spares.counts(g.rows);
        const out = [h('tr', { class: 'grp-row' }, h('th', { colspan: COLS, scope: 'colgroup' }, h('span', { class: 'g-art', 'aria-hidden': 'true' }, EQ.fleetArt(g.eq.typeCode)),
          h('a', { href: '#/eq/equipment/' + g.eq.id, class: 'grp-code' }, g.eq.code), h('span', { class: 'g-n', title: 'Registered major spare parts shown' }, String(g.rows.length)),
          gc.overdue ? h('span', { class: 'grp-flag over', title: gc.overdue + ' overdue' }, icon('alert'), String(gc.overdue)) : null,
          gc.dueSoon ? h('span', { class: 'grp-flag soon', title: gc.dueSoon + ' due soon' }, icon('clock'), String(gc.dueSoon)) : null))];
        g.rows.forEach((r) => {
          const open = histOpen.has(r.posId);
          const tipPart = [r.typeName, r.mainCode + '/' + r.subCode, r.remarks ? 'Remarks: ' + r.remarks : null].filter(Boolean).join(' · ');
          out.push(h('tr', { class: r.flag === 'overdue' ? 'overdue-row' : '', 'data-pos': r.posId },
            h('th', { scope: 'row', title: tipPart }, h('a', { href: '#/eq/equipment/' + r.equipmentId + '?main=' + r.pos.mainId + '&sub=' + r.pos.subId + '&part=' + r.posId + '&panel=spareParts' }, r.pos.name),
              r.remarks ? h('span', { class: 'rem-ic', tabindex: '0', role: 'img', 'aria-label': 'Remarks: ' + r.remarks, title: r.remarks }, icon('file')) : null),
            h('td', null, r.condition ? h('span', { class: 'tag ' + (r.condition === 'replaced' ? 'green' : '') }, r.condition === 'replaced' ? 'Replaced' : 'Original') : h('span', { class: 'tag dashed' }, 'Not recorded')),
            h('td', { title: r.condition ? 'Serial: ' + (r.serial || 'unknown') + (r.desc ? ' · ' + r.desc : '') : null }, r.condition ? [r.brand || 'Unknown brand', r.model ? h('span', { class: 'muted' }, ' · ' + r.model) : null] : '—'),
            h('td', { title: r.condition === 'original' ? (r.commissionedOn ? 'Commissioned ' + fmtD(r.commissionedOn) : 'Commissioning date unknown') : null }, r.replacedOn ? fmtD(r.replacedOn) : r.condition === 'original' ? 'Original' : '—'),
            h('td', { title: r.lifeSource === 'override' ? 'Equipment override of the part-type default' : r.lifeMonths == null ? 'Expected life not set (Admin > EQ > Spare parts)' : 'Part-type default' }, r.lifeMonths != null ? r.lifeMonths + ' mo' + (r.lifeSource === 'override' ? '*' : '') : '—'),
            h('td', { title: r.predicted ? null : r.why }, r.predicted ? [fmtD(r.predicted), h('span', { class: 'small muted' }, ' · ' + (r.daysTo < 0 ? Math.abs(r.daysTo) + ' d ago' : 'in ' + r.daysTo + ' d'))] : h('span', { class: 'muted' }, '—')),
            h('td', null, r.flag ? h('span', { class: 'tag ' + FLAGS[r.flag][1] }, icon(r.flag === 'overdue' ? 'alert' : 'clock'), ' ' + FLAGS[r.flag][0]) : null),
            h('td', { class: 'act-col' }, h('div', { class: 'row-acts' },
              h('button', { type: 'button', class: 'btn-sm icon-btn', 'aria-expanded': open ? 'true' : 'false', 'data-fk': 'hist-' + r.posId, title: (open ? 'Hide' : 'Show') + ' change history', onClick: () => { if (open) histOpen.delete(r.posId); else histOpen.add(r.posId); EQ.rerender(); } }, icon('history'), h('span', { class: 'sr-only' }, 'History')),
              w ? h('button', { type: 'button', class: 'btn-sm icon-btn', 'data-fk': 'cond-' + r.posId, title: 'Update condition (replacement, amendment or remarks)', onClick: () => spareDialog(r) }, icon('edit'), h('span', { class: 'sr-only' }, 'Update condition')) : null))));
          if (open) out.push(h('tr', { class: 'hist-row' }, h('td', { colspan: COLS }, h('div', { class: 'stack' }, h('strong', null, 'History of ' + r.pos.name + ' (' + r.eq.code + ')'), EQ.panelTabs.spareChangeLog(EQ.spares.history(r.posId))))));
        });
        return out;
      })))));
  }
  function spareDialog(r) {
    const K = kit();
    const hasHist = !!r.condition;
    const st = { action: hasHist ? 'replacement' : 'original', desc: r.desc || '', brand: r.brand || '', model: r.model || '', serial: r.serial || '', replacedOn: '', remarks: r.remarks || '', reason: '' };
    let errors = {};
    const api = K.openDialog({ build(api) {
      const act = [['original', 'Record Original', !hasHist], ['replacement', 'Record replacement', hasHist], ['amend', 'Amend current item', hasHist], ['remarks', 'Edit remarks only', true]].filter((a) => a[2]);
      return {
        title: 'Update condition - ' + r.pos.name + ' (' + r.eq.code + ')',
        body: [K.writerGuard(),
          h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Current: ' + (r.condition ? (r.condition === 'replaced' ? 'Replaced ' + fmtD(r.replacedOn) : 'Original') + ', ' + (r.brand || 'unknown brand') : 'Condition not recorded') + '. Each change keeps the previous values in the history. Prototype: kept in memory only.')),
          K.radios(st, 'action', 'sp-act', act.map((a) => ({ value: a[0], label: a[1] })), () => api.render(), 'Action *', null),
          st.action !== 'remarks' ? K.field('sp-desc', 'Item description', K.input(st, 'desc', { maxlength: 200 }), { required: st.action !== 'amend', error: errors.desc }) : null,
          st.action !== 'remarks' ? h('div', { class: 'grid-2' }, K.field('sp-brand', 'Brand', K.input(st, 'brand', { maxlength: 100 }), {}), K.field('sp-model', 'Model / part number', K.input(st, 'model', { maxlength: 100 }), {}), K.field('sp-serial', 'Serial number (optional)', K.input(st, 'serial', { maxlength: 100 }), {})) : null,
          st.action === 'replacement' ? K.field('sp-date', 'Replaced on', K.input(st, 'replacedOn', { type: 'date' }), { required: true, error: errors.replacedOn, hint: 'Business date, not in the future, not before the latest recorded replacement.' }) : null,
          st.action === 'amend' ? K.field('sp-reason', 'Reason for the amendment', K.area(st, 'reason', { rows: 2 }), {}) : null,
          K.field('sp-remarks', 'Remarks', K.area(st, 'remarks', { rows: 2, maxlength: 2000 }), {})],
        foot: K.footButtons(api, 'Save condition', () => {
          const P = EQ.spares;
          const res = st.action === 'original' ? P.recordOriginal(r.posId, st) : st.action === 'replacement' ? P.recordReplacement(r.posId, st) : st.action === 'amend' ? P.amend(r.posId, st) : P.setRemarks(r.posId, st.remarks);
          if (res.ok) { api.close(res); EQ.toast('Condition saved for ' + r.pos.name, 'Prototype: kept in memory only; the previous values are in the history.'); } else { errors = res.fields || { desc: res.message }; if (!Object.keys(res.fields || {}).length) EQ.toast(res.message); api.render(); }
        }),
      };
    } });
    return api;
  }
  EQ.dlg.spare = spareDialog;

  /** Add spare part (U1-C21; DATA s16.3; API s4.18 POST /equipment/{id}/spare-parts): EQ Team and Admin (eq.work) choose the equipment
   *  and the main-part position, then type, condition, fitted/replaced date, brand and expected life. The entry starts its history.
   *  prefill = { equipmentId, main, sub, part } from the Spare parts tab filters or the crane-view selection. */
  function addSpareDialog(prefill) {
    const K = kit(), P = EQ.spares;
    prefill = prefill || {};
    // U1-C35: a selected registered position needs its condition updated, not an empty Add form.
    const selected = EQ.pos(prefill.part);
    if (selected && selected.equipmentId === prefill.equipmentId && P.isMajor(selected.id)) return spareDialog(P.row(selected.id));
    const st = { equipmentId: prefill.equipmentId || '', mainId: prefill.main || '', subId: prefill.sub || '', posId: '', typeId: '', lifeMonths: '', cond: null, replacedOn: '', desc: '', brand: '', model: '', serial: '', remarks: '' };
    const eq0 = EQ.eq(st.equipmentId);
    if (eq0 && prefill.part && P.addable(eq0.id).some((p) => p.id === prefill.part)) { const pp = EQ.pos(prefill.part); st.posId = pp.id; st.mainId = pp.mainId; st.subId = pp.subId; }
    let errors = {}, message = null;
    const api = K.openDialog({ build(api) {
      const eq = EQ.eq(st.equipmentId);
      const eqs = EQ.state.D.equipment.filter((e) => e.lifecycle === 'active' && EQ.positionsOf(e.id).some((p) => p.state === 'active'));
      const mains = eq ? eq.mains.map((m) => ({ value: m.id, label: m.code + '  ' + EQ.defLabel(m.code) })) : [];
      const subs = eq ? eq.subs.filter((s) => !st.mainId || s.mainId === st.mainId).map((s) => ({ value: s.id, label: s.code + '  ' + EQ.defLabel(s.code) })) : [];
      const positions = eq ? P.addable(eq.id, st.mainId, st.subId).sort((a, b) => EQ.cmp(a.name, b.name)) : [];
      const pos = st.posId ? EQ.pos(st.posId) : null;
      const recorded = pos ? EQ.state.D.events.filter((e) => e.positionId === pos.id && !e.voided).sort((a, b) => a.seq - b.seq).slice(-1)[0] : null;
      const types = P.types().filter((t) => t.active);
      const type = P.typeOf(st.typeId);
      const condOpts = recorded ? [{ value: '', label: 'Keep the recorded installation' }, { value: 'replaced', label: 'Replaced (record the replacement)' }] : [{ value: 'original', label: 'Original' }, { value: 'replaced', label: 'Replaced' }];
      const itemFields = st.cond !== '';
      return {
        title: 'Add spare part' + (eq ? ' - ' + eq.code : ''),
        body: [K.writerGuard(),
          message ? h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, message)) : null,
          h('div', { class: 'notice info' }, icon('info'), h('div', { class: 'stack', style: 'gap:.3rem' }, h('p', null, h('strong', null, "Add a part: "), "Choose a position and record its first condition. Each equipment keeps its own register and history."), h('p', null, h('strong', null, "Admin settings: "), "Part types, default life, type changes and removal are managed in Admin > EQ > Spare parts."), h('p', null, h('strong', null, "Prototype: "), "Changes are not saved."))),
          h('div', { class: 'grid-2' },
            K.field('as-eq', 'Equipment', K.select(st, 'equipmentId', eqs.map((e) => ({ value: e.id, label: e.code })), () => { st.mainId = st.subId = st.posId = ''; st.cond = null; api.render(); }, 'Choose equipment'), { required: true }),
            K.field('as-main', 'Main mechanism', K.select(st, 'mainId', mains, () => { st.subId = st.posId = ''; st.cond = null; api.render(); }, eq ? 'All main mechanisms' : 'Choose equipment first'), { hint: 'Narrows the position list.' }),
            K.field('as-sub', 'Submechanism', K.select(st, 'subId', subs, () => { const s = eq && eq.subs.find((x) => x.id === st.subId); if (s) st.mainId = s.mainId; st.posId = ''; st.cond = null; api.render(); }, eq ? 'All submechanisms' : 'Choose equipment first'), {}),
            K.field('as-pos', 'Main-part position', K.select(st, 'posId', positions.map((p) => ({ value: p.id, label: p.name })), () => { const p = EQ.pos(st.posId); if (p) { st.mainId = p.mainId; st.subId = p.subId; } st.cond = null; api.render(); }, !eq ? 'Choose equipment first' : positions.length ? 'Choose a position' : 'No position left to add here'), { required: true, error: errors.posId, hint: eq ? 'Confirmed (active) positions of ' + eq.code + ' that are not yet in its register.' : null })),
          recorded ? h('div', { class: 'notice info', 'data-fk-note': 'recorded' }, icon('info'), h('p', null, "Current item:" + recorded.installed.desc + (recorded.businessDate ? ', replaced ' + fmtD(recorded.businessDate) : ', original') + '. It cannot be recorded as Original again; keep it or record a replacement.')) : null,
          h('div', { class: 'grid-2' },
            K.field('as-type', 'Spare-part type', K.select(st, 'typeId', types.map((t) => ({ value: t.id, label: t.name + (t.defaultLife != null ? ' (' + t.defaultLife + ' months)' : ' (no default life)') })), () => { const t = P.typeOf(st.typeId); if (t && !st.desc) st.desc = t.name; api.render(); }, types.length ? 'Choose a type' : 'No types: an Admin adds them'), { required: true, error: errors.typeId }),
            K.field('as-life', 'Expected life (months)', K.input(st, 'lifeMonths', { type: 'number', min: 1, max: 600, step: 1, placeholder: type && type.defaultLife != null ? 'type default ' + type.defaultLife : 'type default' }), { error: errors.lifeMonths, hint: 'Leave blank to use the part-type default. A value here applies to this equipment only.' })),
          K.radios(st, 'cond', 'as-cond', condOpts, () => api.render(), 'Condition *', errors.condition),
          st.cond === 'replaced' ? K.field('as-date', 'Fitted / replaced date', K.input(st, 'replacedOn', { type: 'date' }), { required: true, error: errors.replacedOn, hint: 'Business date, not in the future' + (recorded && recorded.businessDate ? ', not before ' + fmtD(recorded.businessDate) : '') + '. An Original part counts from the commissioning date of the equipment.' }) : null,
          itemFields ? K.field('as-desc', 'Item description', K.input(st, 'desc', { maxlength: 200 }), { required: true, error: errors.desc }) : null,
          itemFields ? h('div', { class: 'grid-2' }, K.field('as-brand', 'Brand', K.input(st, 'brand', { maxlength: 100 }), {}), K.field('as-model', 'Model / part number (optional)', K.input(st, 'model', { maxlength: 100 }), {}), K.field('as-serial', 'Serial number (optional)', K.input(st, 'serial', { maxlength: 100 }), {})) : null,
          K.field('as-remarks', 'Remarks', K.area(st, 'remarks', { rows: 2, maxlength: 2000 }), {})],
        foot: K.footButtons(api, 'Add spare part', () => {
          errors = {}; message = null;
          if (!st.posId) { errors.posId = 'Choose the main-part position.'; api.render(); return; }
          const res = P.add({ equipmentId: st.equipmentId, posId: st.posId, typeId: st.typeId, lifeMonths: st.lifeMonths, condition: st.cond == null ? 'none' : st.cond, replacedOn: st.replacedOn, desc: st.desc, brand: st.brand, model: st.model, serial: st.serial, remarks: st.remarks });
          if (res.ok) { const p = EQ.pos(st.posId); api.close(res); EQ.toast('Added ' + p.name + ' to the spare-part register of ' + EQ.eq(st.equipmentId).code, 'Prototype: kept in memory only; the entry starts its history.'); }
          else { errors = res.fields || {}; message = Object.keys(errors).length ? null : res.message + (res.code ? ' (' + res.status + ' ' + res.code + ')' : ''); api.render(); }
        }),
      };
    } });
    return api;
  }
  EQ.dlg.addSpare = addSpareDialog;
})(window.EQ);
