/* Jobs workspace (Pending / Current / Completed board or tabs, filters, actions) and the job record page.
   Actions go through EQ.api, the same rule path as the forms. There is deliberately no drag-and-drop: every move is a button. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const ui = (EQ.jobsUI = { q: '', tab: 'pending' });
  const KIND = { repair: 'Repair', replacement: 'Replacement' };
  const STAT = { pending: 'Pending', current: 'Current', completed: 'Completed' };

  function statusTag(j) {
    if (j.isCancelled) return h('span', { class: 'tag red' }, 'Cancelled');
    return h('span', { class: 'tag ' + (j.workStatus === 'completed' ? 'green' : j.workStatus === 'current' ? 'gold' : '') }, STAT[j.workStatus] + (j.reopenCount ? ' (reopened)' : ''));
  }

  function actions(j, ctx) {
    const acts = [];
    const w = EQ.perm.write(), a = EQ.perm.admin();
    const eq = EQ.eq(j.equipmentId);
    const live = !j.isCancelled && j.workStatus !== 'completed';
    acts.push(h('a', { class: 'btn btn-sm', href: '#/eq/jobs/special/' + j.id }, icon('eye'), 'Open'));
    if (live && w) {
      acts.push(h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.jobForm({ job: j }) }, icon('edit'), 'Edit'));
      if (j.workStatus === 'pending') acts.push(h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.moveJob(j.id, 'current'); EQ.toast(r.ok ? 'Started ' + j.number : r.message, 'Prototype: in memory only.'); } }, 'Start'));
      else acts.push(h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.moveJob(j.id, 'pending'); EQ.toast(r.ok ? j.number + ' returned to Pending' : r.message, 'Prototype: in memory only.'); } }, 'Return to Pending'));
      acts.push(h('button', { type: 'button', class: 'btn-sm primary', onClick: () => EQ.dlg.complete(j) }, icon('check-circle'), 'Complete...'));
      const c = EQ.perm.cancel(j);
      acts.push(h('button', { type: 'button', class: 'btn-sm danger-btn', 'aria-disabled': c.ok ? null : 'true', 'aria-describedby': c.ok ? null : 'why-' + j.id, onClick: () => { if (c.ok) EQ.dlg.cancel(j); } }, icon('cancel'), 'Cancel...'));
      if (!c.ok) ctx.why = c.why;
    }
    if (j.workStatus === 'completed' && !j.isCancelled && a) acts.push(h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.reason({ title: 'Reopen ' + j.number, message: 'Reopening makes the job Current again. Committed installations stay committed and are never undone by reopening.', confirm: 'Reopen job', onSubmit: (r) => EQ.api.reopenJob(j.id, r) }) }, 'Reopen (Admin)...'));
    if (!w && !a) ctx.readonly = true;
    return acts;
  }

  function card(j) {
    const eq = EQ.eq(j.equipmentId);
    const ctx = {};
    const acts = actions(j, ctx);
    return h('article', { class: 'job' + (j.isCancelled ? ' cancelled' : ''), 'aria-label': j.number + ' ' + j.title },
      h('div', { class: 'row between' }, h('a', { href: '#/eq/jobs/special/' + j.id, class: 'mono' }, j.number), h('span', null, h('span', { class: 'tag' }, KIND[j.kind]), ' ', statusTag(j), j.priority === 'high' ? h('span', { class: 'tag gold', style: 'margin-left:.25rem' }, 'High priority') : null)),
      h('h3', null, j.title),
      h('div', { class: 'meta' }, h('span', null, h('a', { href: '#/eq/equipment/' + eq.id }, eq.code)), h('span', null, EQ.targetLabel(j))),
      h('div', { class: 'meta' },
        j.workStatus === 'completed' ? h('span', null, 'Completed ' + EQ.fmtDate(j.completedOn)) : h('span', null, j.plannedOn ? 'Planned ' + EQ.fmtDate(j.plannedOn) : 'No planned date'),
        j.responsible ? h('span', null, 'Responsible: ' + j.responsible) : null, h('span', null, 'Created by ' + (j.createdBy === EQ.user().id ? 'you' : EQ.userName(j.createdBy))),
        j.lines.length ? h('span', null, EQ.plural(j.lines.length, 'replacement line')) : null),
      j.isCancelled ? h('div', { class: 'meta' }, h('span', null, 'Cancelled by ' + EQ.userName(j.cancelledBy) + ' at ' + EQ.fmtInstantShort(j.cancelledUtc) + '. Reason: ' + j.cancelReason)) : null,
      h('div', { class: 'acts' }, acts),
      ctx.why ? h('div', { class: 'why', id: 'why-' + j.id }, 'Cancel unavailable: ' + ctx.why) : null);
  }

  function filtered(q) {
    const S = EQ.state;
    const res = EQ.readJobs(); // simulated GET /jobs: eq.jobs.view on the live matrix (D-139)
    if (!res.ok) return res;
    let list = res.items.filter((j) => q.includeCancelled === '1' || !j.isCancelled);
    if (q.equipment) list = list.filter((j) => j.equipmentId === q.equipment);
    if (q.type) list = list.filter((j) => EQ.eq(j.equipmentId).typeCode === q.type);
    if (q.kind) list = list.filter((j) => j.kind === q.kind);
    if (q.main) list = list.filter((j) => { const m = j.mainId && EQ.eq(j.equipmentId).mains.find((x) => x.id === j.mainId); return m && m.code === q.main; });
    const df = q.dateField === 'completed' ? 'completedOn' : 'plannedOn';
    if (q.from && q.dateField) list = list.filter((j) => j[df] && j[df] >= q.from);
    if (q.to && q.dateField) list = list.filter((j) => j[df] && j[df] <= q.to);
    if (ui.q) list = list.filter((j) => (j.number + ' ' + j.title + ' ' + EQ.eq(j.equipmentId).code).toLowerCase().includes(ui.q.toLowerCase()));
    return list;
  }

  /** Special jobs board (SOW V2 s4.3): used inside the EQ Jobs tab; the page header, the shared filters (equipment, type, date range,
   *  search) and the data-state banners are provided by the EQ Jobs wrapper (views-eqjobs.js). */
  EQ.specialBoard = function specialBoard(q) {
    const S = EQ.state;
    const page = h('div', { class: 'special-board stack' });
    const setQ = (patch) => EQ.nav('/eq/jobs/special', { ...q, ...patch });
    const mainsUsed = EQ.catalog.mains;
    const sel = (id, label, key, options, any) => { const s = h('select', { id, 'data-fk': id, onChange: (e) => setQ({ [key]: e.target.value }) }, h('option', { value: '' }, any), options.map(([v, l]) => h('option', { value: v, selected: q[key] === v ? true : null }, l))); return h('div', { class: 'field' }, h('label', { for: id }, label), s); };
    page.appendChild(h('form', { class: 'panel filters', role: 'search', 'aria-label': 'Special job filters', onSubmit: (e) => e.preventDefault() },
      sel('flt-kind', 'Kind', 'kind', [['repair', 'Repair'], ['replacement', 'Replacement']], 'All kinds'),
      sel('flt-main', 'Main mechanism', 'main', mainsUsed.map((m) => [m.code, m.code + ' ' + m.name]), 'All mechanisms'),
      sel('flt-df', 'Apply date range to', 'dateField', [['planned', 'Planned date'], ['completed', 'Completion date']], 'Not applied to special jobs'),
      h('label', { class: 'check', style: 'min-height:2.5rem' }, h('input', { type: 'checkbox', checked: q.includeCancelled === '1' ? true : null, 'data-fk': 'flt-canc', onChange: (e) => setQ({ includeCancelled: e.target.checked ? '1' : '' }) }), 'Include cancelled'),
      h('div', { class: 'field' }, h('span', { class: 'label', id: 'jl' }, 'Layout'), h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'jl' }, ['board', 'tabs'].map((v) => h('button', { type: 'button', 'aria-pressed': (q.layout || 'board') === v ? 'true' : 'false', 'data-fk': 'jl-' + v, onClick: () => setQ({ layout: v }) }, v === 'board' ? 'Board' : 'Tabs'))))));

    const list = filtered(q);
    if (!Array.isArray(list)) { EQ.access.refreshSession('403 ' + list.code); setTimeout(() => EQ.rerender(), 0); return EQ.views.forbidden('eq.jobs.view', '/eq/jobs/special', list.code); }
    const cols = ['pending', 'current', 'completed'];
    const by = (s) => list.filter((j) => !j.isCancelled && j.workStatus === s).sort((a, b) => (s === 'completed' ? EQ.cmp(b.completedOn || '', a.completedOn || '') : EQ.cmp(a.plannedOn || '9999', b.plannedOn || '9999')));
    const layout = q.layout || 'board';
    const tab = ui.tab;
    const column = (s) => h('section', { class: 'panel col', id: 'col-' + s, 'aria-labelledby': 'colh-' + s, hidden: layout === 'tabs' && tab !== s ? true : null },
      h('header', null, h('h2', { id: 'colh-' + s }, STAT[s]), h('span', { class: 'tag' }, String(by(s).length))),
      h('div', { class: 'col-body' }, by(s).length ? by(s).map(card) : h('p', { class: 'muted small', style: 'margin:0' }, 'No ' + STAT[s].toLowerCase() + ' jobs match these filters.')));
    if (layout === 'tabs') {
      page.appendChild(h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Work status', style: 'margin:0 0 .5rem' }, cols.map((s) => h('button', { type: 'button', role: 'tab', 'aria-selected': tab === s ? 'true' : 'false', 'aria-controls': 'col-' + s, 'data-fk': 'jt-' + s, onClick: () => { ui.tab = s; EQ.rerender(); } }, STAT[s] + ' (' + by(s).length + ')'))));
      page.appendChild(h('div', null, cols.map(column)));
    } else page.appendChild(h('div', { class: 'board' }, cols.map(column)));
    const canc = list.filter((j) => j.isCancelled);
    if (q.includeCancelled === '1') page.appendChild(h('section', { class: 'panel col', style: 'margin-top:.7rem', 'aria-labelledby': 'colh-c' }, h('header', null, h('h2', { id: 'colh-c' }, 'Cancelled'), h('span', { class: 'tag' }, String(canc.length))), h('div', { class: 'col-body' }, canc.length ? canc.map(card) : h('p', { class: 'muted small', style: 'margin:0' }, 'No cancelled jobs match.'))));
    else page.appendChild(h('p', { class: 'small muted' }, 'Cancelled jobs are hidden from the three columns. Tick Include cancelled to see them.'));
    return page;
  };

  EQ.views.job = function job(id) {
    const res = EQ.readJob(id); // simulated GET /jobs/{id}: eq.jobs.view on the live matrix (D-139)
    if (!res.ok && res.status === 403) { EQ.access.refreshSession('403 ' + res.code); setTimeout(() => EQ.rerender(), 0); return EQ.views.forbidden('eq.jobs.view', '/eq/jobs/special', res.code); }
    const j = res.ok ? res.job : null;
    const page = h('div', { class: 'page' });
    if (!j) { page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, 'No job with this link exists (404).'))); return page; }
    const eq = EQ.eq(j.equipmentId);
    const ctx = {};
    page.appendChild(h('nav', { 'aria-label': 'Breadcrumb' }, h('ol', { class: 'breadcrumb', style: 'margin-bottom:.6rem' }, h('li', null, h('a', { href: '#/eq/jobs/special' }, 'Jobs')), h('li', null, h('span', { 'aria-current': 'page' }, j.number)))));
    page.appendChild(h('header', { class: 'panel eq-head' }, h('div', null, h('p', { class: 'eyebrow' }, KIND[j.kind] + ' job'), h('h1', null, j.number, statusTag(j))), h('div', { class: 'facts' }, h('strong', null, j.title)), h('div', { class: 'actions' }, actions(j, ctx).filter((_, i) => i > 0))));
    if (ctx.why) page.appendChild(h('p', { class: 'small muted' }, 'Cancel unavailable: ' + ctx.why));
    const kv = (rows) => h('dl', { class: 'kv' }, rows.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
    page.appendChild(h('div', { class: 'grid-2', style: 'align-items:start;margin-top:.7rem' },
      h('section', { class: 'panel panel-pad stack' }, h('h2', null, 'Details'), kv([
        ['Equipment', h('a', { href: '#/eq/equipment/' + eq.id }, eq.code)], ['Target', EQ.targetLabel(j)], ['Kind', KIND[j.kind]], ['Priority', j.priority || 'Not set'],
        ['Planned', j.plannedOn ? EQ.fmtDate(j.plannedOn) : 'Not set'], ['Responsible', j.responsible || 'Not set'], ['Created', EQ.fmtInstant(j.createdUtc) + ' by ' + EQ.userName(j.createdBy)], ['Version', String(j.version)],
        j.workStatus === 'completed' ? ['Completed on', EQ.fmtDate(j.completedOn) + ' (business date)'] : null, j.completionNote ? ['Completion note', j.completionNote] : null, j.description ? ['Description', j.description] : null,
        j.isCancelled ? ['Cancelled', EQ.fmtInstant(j.cancelledUtc) + ' by ' + EQ.userName(j.cancelledBy) + ': ' + j.cancelReason] : null]),
        h('div', { class: 'notice info' }, icon('info'), h('p', null, eq.code + ' operational status is ' + EQ.STATUS[EQ.statusKey(eq.status)].label + '. This job does not change it.'))),
      h('section', { class: 'panel panel-pad stack' }, h('h2', null, 'Progress and corrections'), h('ul', { class: 'tl' }, [...j.events].reverse().map((e) => h('li', { class: 'status' }, h('strong', null, e.kind), h('span', { class: 'when' }, EQ.fmtInstant(e.at) + ' by ' + EQ.userName(e.by)), e.note ? h('span', null, e.note) : null))),
        j.corrections.length ? h('div', { class: 'stack' }, h('h3', null, 'Admin corrections (prior values retained)'), j.corrections.map((c) => h('div', { class: 'nonwork' }, h('strong', null, 'Correction ' + c.n + ': ' + c.reason), c.items.map((it) => h('div', null, it.field + ': ', h('s', null, it.before), ' → ', h('strong', null, it.after))), h('span', { class: 'small muted' }, EQ.userName(c.by) + ', ' + EQ.fmtInstant(c.at))))) : null)));
    page.appendChild(h('section', { class: 'panel panel-pad stack', style: 'margin-top:.7rem' }, h('h2', null, 'Replacement lines'),
      j.lines.length ? h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Position', 'Installed', 'Serial', 'Quantity', 'Replaced on', 'Removed'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, j.lines.map((l) => { const p = EQ.pos(l.positionId); return h('tr', null, h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + eq.id + '?main=' + p.mainId + '&sub=' + p.subId + '&part=' + p.id }, p.name)), h('td', null, l.item.desc), h('td', null, l.item.serial || 'Unknown'), h('td', null, l.qty + ' ' + l.uom), h('td', null, EQ.fmtDate(l.replacedOn)), h('td', null, l.removedKnown ? (l.removedDesc || '') + (l.removedSerial ? ' (serial ' + l.removedSerial + ')' : '') : 'Unknown')); }))))
        : h('p', { class: 'muted small', style: 'margin:0' }, j.kind === 'repair' ? 'Repair jobs take no replacement lines.' : 'No replacement lines yet. Lines are entered when the job is completed.')));
    page.appendChild(h('section', { class: 'panel panel-pad stack', style: 'margin-top:.7rem' }, h('h2', null, 'Work evidence'), h('p', { class: 'muted small', style: 'margin:0' }, 'Evidence attachments (JPEG, PNG, PDF) are readable by all three roles and uploadable by Admin and EQ Team only. Upload and protected download are built in P08; this prototype shows no files.')));
    return page;
  };
})(window.EQ);
