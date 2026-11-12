/* Jobs workspace (Pending / Current / Completed board or tabs, filters, actions) and the job record page.
   Actions go through EQ.api, the same rule path as the forms. There is deliberately no drag-and-drop: every move is a button. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const ui = (EQ.jobsUI = { q: '', tab: 'pending' });
  const KIND = EQ.JOB_KIND;
  const STAT = { pending: 'Pending', current: 'Current', completed: 'Completed' };

  function statusTag(j) {
    if (j.isCancelled) return h('span', { class: 'tag red' }, 'Cancelled');
    return h('span', { class: 'tag ' + (j.workStatus === 'completed' ? 'green' : j.workStatus === 'current' ? 'gold' : '') }, STAT[j.workStatus] + (j.reopenCount ? ' (reopened)' : ''));
  }

  function actions(j, ctx, compact = false) {
    const acts = [];
    const w = EQ.perm.write(), a = EQ.perm.admin();
    const eq = EQ.eq(j.equipmentId);
    const live = !j.isCancelled && j.workStatus !== 'completed';
    if (live && w) {
      acts.push(h('button', { type: 'button', class: 'btn-sm' + (compact ? ' job-act-icon' : ''), title: compact ? 'Edit job' : null, onClick: () => EQ.dlg.jobForm({ job: j }) }, icon('edit'), h('span', { class: compact ? 'sr-only' : null }, 'Edit')));
      acts.push(h('button', { type: 'button', class: 'btn-sm primary', 'data-fk': 'job-progress-' + j.id, onClick: () => EQ.dlg.jobProgress(j) }, icon('plus'), 'Update progress'));
      if (j.workStatus === 'pending') acts.push(h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.moveJob(j.id, 'current'); EQ.toast(r.ok ? 'Started ' + j.number : r.message, 'Prototype: in memory only.'); } }, 'Start'));
      else acts.push(h('button', { type: 'button', class: 'btn-sm', title: compact ? 'Return to Pending' : null, 'aria-label': compact ? 'Return to Pending' : null, onClick: () => { const r = EQ.api.moveJob(j.id, 'pending'); EQ.toast(r.ok ? j.number + ' returned to Pending' : r.message, 'Prototype: in memory only.'); } }, compact ? 'Pending' : 'Return to Pending'));
      acts.push(h('button', { type: 'button', class: 'btn-sm', title: compact ? 'Complete job' : null, onClick: () => EQ.dlg.complete(j) }, compact ? null : icon('check-circle'), compact ? 'Complete' : 'Complete...'));
      const c = EQ.perm.cancel(j);
      acts.push(h('button', { type: 'button', class: 'btn-sm danger-btn' + (compact ? ' job-act-icon' : ''), title: c.ok ? 'Cancel job' : 'Cancel unavailable: ' + c.why, 'aria-disabled': c.ok ? null : 'true', 'aria-describedby': c.ok ? null : 'why-' + j.id, onClick: () => { if (c.ok) EQ.dlg.cancel(j); } }, icon('cancel'), h('span', { class: compact ? 'sr-only' : null }, 'Cancel...')));
      if (!c.ok) ctx.why = c.why;
    }
    if (j.workStatus === 'completed' && !j.isCancelled && a) acts.push(h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.reason({ title: 'Reopen ' + j.number, message: 'Reopening makes the job Current again. Committed installations stay committed and are never undone by reopening.', confirm: 'Reopen job', onSubmit: (r) => EQ.api.reopenJob(j.id, r) }) }, 'Reopen (Admin)...'));
    if (!w && !a) ctx.readonly = true;
    return acts;
  }

  /** Shared visibility (U1-C26/C41). Compact card control; explanations appear on hover/focus.
   *  Writers use the same audited server command; read-only roles see the state as text. */
  EQ.displaySwitch = function displaySwitch(o) {
    const id = 'vis-' + o.id;
    const note = 'Show ' + o.name + ' on ' + o.where + ' for everyone. Turn off to hide it; ' + o.hiddenNote + '. Shared setting; changes are audited.' + (o.canSet ? '' : ' Read-only for your role.');
    const help = h('span', { class: 'vis-help', role: 'tooltip', id: id + '-note' }, note);
    // o.eye (U1-C79, EQ job cards): an eye icon replaces the word "Show"; the switch and its tooltip are unchanged.
    const word = o.eye ? icon('eye') : h('span', null, 'Show');
    if (!o.canSet) return h('span', { class: 'vis-switch vis-state' + (o.eye ? ' vis-eye' : ''), tabindex: '0', 'data-fk': 'vis-state-' + o.id, 'aria-describedby': id + '-note' }, o.eye ? word : 'Show: ', h('strong', null, o.shown ? 'On' : 'Off'), help);
    return h('label', { class: 'check vis-switch' + (o.eye ? ' vis-eye' : ''), for: id },
      h('input', { type: 'checkbox', role: 'switch', id, 'data-fk': id, checked: o.shown ? true : null, 'aria-label': 'Show ' + o.name, 'aria-describedby': id + '-note',
        onChange: (e) => { const r = o.onChange(e.target.checked); if (!r.ok) { e.target.checked = o.shown; EQ.toast(r.message); } else EQ.toast((e.target.checked ? 'Shown on ' : 'Hidden from ') + o.where + ': ' + o.name, 'Shared setting; audited. Prototype: in memory only.'); } }),
      word, help);
  };
  const jobSwitch = (j, eye) => EQ.displaySwitch({ id: j.id, eye, shown: EQ.shownOnDashboard(j), canSet: EQ.perm.write(), where: 'the crane view (flat and 3D), its labels and the fleet cards', name: j.number, hiddenNote: 'it stays in Jobs, history and exports',
    onChange: (show) => EQ.api.setJobVisibility(j.id, { show, version: j.version }) });
  const hiddenTag = (j) => (EQ.shownOnDashboard(j) ? null : h('span', { class: 'tag dashed', 'data-fk': 'hidden-tag', style: 'margin-left:.25rem', title: 'Hidden from the crane view (flat and 3D) and the fleet cards; it stays in Jobs, history and exports (U1-C26)' }, 'Hidden'));

  /** compact (U1-C79 cards): one line; the update date and the latest note move to the tooltip. */
  function progressSummary(job, compact) {
    const p = EQ.jobProgress(job), known = p.percent != null;
    const tip = compact ? [p.workDate ? 'Updated ' + EQ.fmtDate(p.workDate) : 'Progress not updated yet', p.note].filter(Boolean).join(' · ') : null;
    return h('div', { class: 'eq-job-progress' + (p.percent === 100 ? ' is-complete' : '') + (compact ? ' compact' : ''), 'data-progress': known ? p.percent : 'unknown', title: tip },
      h('div', { class: 'prog' }, h('span', { class: 'bar', role: 'progressbar', 'aria-label': job.title + ' progress', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': known ? p.percent : null, 'aria-valuetext': known ? p.percent + ' percent' : 'Not recorded' }, h('i', { style: 'width:' + (known ? p.percent : 0) + '%' })), h('span', { class: 'qty' }, known ? p.percent + ' %' : '—')),
      !compact && p.workDate ? h('span', { class: 'small muted' }, 'Updated ' + EQ.fmtDate(p.workDate)) : null,
      !compact && p.note ? h('p', { class: 'eq-progress-note small', title: p.note }, p.note) : null);
  }

  /** U1-C79 compact card actions: one main button (Update progress) and a "more" menu for the rest; same EQ.api / dialog paths. */
  function cardActions(j) {
    const w = EQ.perm.write(), a = EQ.perm.admin();
    const live = !j.isCancelled && j.workStatus !== 'completed';
    const item = (label, fk, onClick, extra) => h('button', { type: 'button', role: 'menuitem', 'data-fk': fk, onClick: (e) => { e.target.closest('details')?.removeAttribute('open'); onClick(); }, ...(extra || {}) }, label);
    const items = [];
    if (live && w) {
      items.push(item([icon('edit'), 'Edit details'], 'job-edit-' + j.id, () => EQ.dlg.jobForm({ job: j })));
      if (j.workStatus === 'pending') items.push(item([icon('play'), 'Start'], 'job-start-' + j.id, () => { const r = EQ.api.moveJob(j.id, 'current'); EQ.toast(r.ok ? 'Started ' + j.number : r.message, 'Prototype: in memory only.'); }));
      else items.push(item([icon('history'), 'Return to Pending'], 'job-pending-' + j.id, () => { const r = EQ.api.moveJob(j.id, 'pending'); EQ.toast(r.ok ? j.number + ' returned to Pending' : r.message, 'Prototype: in memory only.'); }));
      items.push(item([icon('check-circle'), 'Complete...'], 'job-complete-' + j.id, () => EQ.dlg.complete(j)));
      const c = EQ.perm.cancel(j);
      items.push(item([icon('cancel'), 'Cancel...'], 'job-cancel-' + j.id, () => { if (c.ok) EQ.dlg.cancel(j); }, { class: 'danger', 'aria-disabled': c.ok ? null : 'true', title: c.ok ? null : 'Cancel unavailable: ' + c.why }));
    }
    if (j.workStatus === 'completed' && !j.isCancelled && a) items.push(item([icon('refresh'), 'Reopen (Admin)...'], 'job-reopen-' + j.id, () => EQ.dlg.reason({ title: 'Reopen ' + j.number, message: 'Reopening makes the job Current again. Committed installations stay committed and are never undone by reopening.', confirm: 'Reopen job', onSubmit: (r) => EQ.api.reopenJob(j.id, r) })));
    const menu = items.length ? h('details', { class: 'more-menu' }, h('summary', { class: 'btn btn-sm', 'data-fk': 'job-more-' + j.id, title: 'More actions', 'aria-label': 'More actions for ' + j.number }, icon('more')),
      h('div', { class: 'menu', role: 'menu', 'aria-label': 'Actions for ' + j.number }, items)) : null;
    // a job without a main action (completed: Admin Reopen only) keeps its menu in the card header, so no row is spent on it
    const primary = live && w ? h('button', { type: 'button', class: 'btn-sm primary', 'data-fk': 'job-progress-' + j.id, onClick: () => EQ.dlg.jobProgress(j) }, icon('plus'), 'Update progress') : null;
    return primary ? { row: h('div', { class: 'acts' }, primary, menu), head: null } : { row: null, head: menu };
  }
  // one open "more" menu at a time; a click elsewhere closes it
  document.addEventListener('click', (e) => { document.querySelectorAll('details.more-menu[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); }); });

  function card(j) {
    const eq = EQ.eq(j.equipmentId);
    const done = j.workStatus === 'completed';
    const acts = cardActions(j);
    const info = [j.number, KIND[j.kind] + ' job', 'Created by ' + (j.createdBy === EQ.user().id ? 'you' : EQ.userName(j.createdBy)), j.responsible ? 'Responsible: ' + j.responsible : null, j.lines.length ? EQ.plural(j.lines.length, 'replacement line') : null].filter(Boolean).join(' · ');
    return h('article', { class: 'job compact' + (j.isCancelled ? ' cancelled' : ''), 'aria-label': j.number + ' ' + j.title, 'data-job': j.id },
      h('div', { class: 'job-top' }, h('h3', null, h('a', { class: 'job-name', href: '#/eq/jobs/special/' + j.id, title: info }, j.title)),
        h('div', { class: 'job-marks' }, h('span', { class: 'tag', title: KIND[j.kind] + ' job' }, KIND[j.kind]), j.isCancelled || j.reopenCount ? statusTag(j) : null, j.priority === 'high' ? h('span', { class: 'tag gold', title: 'High priority' }, 'High') : null, hiddenTag(j), jobSwitch(j, true), acts.head)),
      h('div', { class: 'meta' }, h('span', null, EQ.isFleetJob(j) ? EQ.jobEquipmentLabel(j) : h('a', { href: '#/eq/equipment/' + eq.id }, eq.code)), h('span', { class: 'target' }, EQ.targetLabel(j)),
        h('span', { class: 'when' }, done ? 'Done ' + EQ.fmtDate(j.completedOn) : j.plannedOn ? 'Planned ' + EQ.fmtDate(j.plannedOn) : 'No planned date')),
      j.isCancelled ? h('div', { class: 'meta', title: 'Cancelled by ' + EQ.userName(j.cancelledBy) + ' at ' + EQ.fmtInstantShort(j.cancelledUtc) }, h('span', null, 'Reason: ' + j.cancelReason)) : null,
      progressSummary(j, true),
      acts.row);
  }

  function filtered(q) {
    const S = EQ.state;
    const res = EQ.readJobs(); // simulated GET /jobs: eq.jobs.view on the live matrix (D-139)
    if (!res.ok) return res;
    let list = res.items.filter((j) => q.includeCancelled === '1' || !j.isCancelled);
    if (q.equipment) list = list.filter((j) => EQ.jobApplies(j, q.equipment));
    if (q.type) list = list.filter((j) => (j.equipmentTypeCode || EQ.eq(j.equipmentId).typeCode) === q.type);
    if (q.kind) list = list.filter((j) => j.kind === q.kind);
    if (q.main) list = list.filter((j) => { const m = j.mainId && EQ.eq(j.equipmentId).mains.find((x) => x.id === j.mainId); return m && m.code === q.main; });
    if (q.prio === 'high') list = list.filter((j) => j.priority === 'high');
    // U1-C79: one date range - planned date for Pending/Current (and cancelled) jobs, completion date for Completed jobs
    if (q.from || q.to) list = list.filter((j) => { const d = j.workStatus === 'completed' && !j.isCancelled ? j.completedOn : j.plannedOn; return d && (!q.from || d >= q.from) && (!q.to || d <= q.to); });
    if (ui.q) list = list.filter((j) => (j.number + ' ' + j.title + ' ' + EQ.jobEquipmentLabel(j) + ' ' + EQ.jobEquipment(j).map((e) => e.code).join(' ')).toLowerCase().includes(ui.q.toLowerCase()));
    return list;
  }

  EQ.specialJobs = filtered;

  /** Special jobs board (SOW V2 s4.3) inside the EQ Jobs tab (views-eqjobs.js places the parts). U1-C79: returns
   *  { tiles, fields, body } - Fleet-style status tiles (they replace the Board/Tabs layout and the Include cancelled box),
   *  the board's own filter fields for the shared filter bar, and the Pending / Current / Completed columns. */
  EQ.specialBoard = function specialBoard(q) {
    const setQ = (patch) => EQ.nav('/eq/jobs/special', { ...q, ...patch });
    const list = filtered(q);
    if (!Array.isArray(list)) { EQ.access.refreshSession('403 ' + list.code); setTimeout(() => EQ.rerender(), 0); return { tiles: h('div'), fields: null, body: EQ.views.forbidden('eq.jobs.view', '/eq/jobs/special', list.code) }; }
    const sel = (id, label, key, options, any) => h('div', { class: 'field' }, h('label', { for: id }, label), h('select', { id, 'data-fk': id, onChange: (e) => setQ({ [key]: e.target.value }) }, h('option', { value: '' }, any), options.map(([v, l]) => h('option', { value: v, selected: q[key] === v ? true : null }, l))));
    const fields = [sel('flt-kind', 'Kind', 'kind', Object.entries(KIND), 'All kinds'),
      sel('flt-main', 'Mechanism', 'main', EQ.catalog.mains.map((m) => [m.code, m.code + ' ' + m.name]), 'All mechanisms'),
      ...EQ.jobsDateFields(q, setQ, 'Pending and Current jobs: planned date. Completed jobs: completion date.')];

    const cols = ['pending', 'current', 'completed'];
    const ws = cols.includes(q.ws) ? q.ws : '';
    const by = (s) => list.filter((j) => !j.isCancelled && j.workStatus === s).sort((a, b) => (s === 'completed' ? EQ.cmp(b.completedOn || '', a.completedOn || '') : EQ.cmp(a.plannedOn || '9999', b.plannedOn || '9999')));
    const noPrio = q.prio ? filtered({ ...q, prio: '' }) : list;
    const high = noPrio.filter((j) => !j.isCancelled && j.workStatus !== 'completed' && j.priority === 'high').length;
    const cancN = (q.includeCancelled === '1' ? list : filtered({ ...q, includeCancelled: '1' })).filter((j) => j.isCancelled).length;
    const MARK = { pending: 'clock', current: 'wrench', completed: 'check-circle' };
    const tiles = EQ.jobsTiles('Special job counts (select to filter)', [
      ...cols.map((s) => ({ k: s, n: by(s).length, text: STAT[s], icon: MARK[s], fk: 'jws-' + s, pressed: ws === s, title: 'Show only ' + STAT[s] + ' jobs', onClick: () => setQ({ ws: ws === s ? '' : s }) })),
      { k: 'high', n: high, text: 'High priority (open)', icon: 'alert', fk: 'jprio-high', pressed: q.prio === 'high', title: 'Show only high-priority jobs', onClick: () => setQ({ prio: q.prio === 'high' ? '' : 'high' }) },
      { k: 'cancelled', n: cancN, text: 'Cancelled', icon: 'cancel', fk: 'flt-canc', pressed: q.includeCancelled === '1', title: 'Cancelled jobs are hidden; select to list them below the board', onClick: () => setQ({ includeCancelled: q.includeCancelled === '1' ? '' : '1' }) }]);

    const body = h('div', { class: 'special-board stack' });
    const column = (s) => h('section', { class: 'panel col', id: 'col-' + s, 'aria-labelledby': 'colh-' + s },
      h('header', null, h('h2', { id: 'colh-' + s }, STAT[s]), h('span', { class: 'g-n' }, String(by(s).length))),
      h('div', { class: 'col-body' }, by(s).length ? by(s).map(card) : h('p', { class: 'muted small', style: 'margin:0' }, 'No ' + STAT[s].toLowerCase() + ' jobs match these filters.')));
    body.appendChild(h('div', { class: 'board' + (ws ? ' one' : '') }, (ws ? [ws] : cols).map(column)));
    const canc = list.filter((j) => j.isCancelled);
    if (q.includeCancelled === '1') body.appendChild(h('section', { class: 'panel col', 'aria-labelledby': 'colh-c' }, h('header', null, h('h2', { id: 'colh-c' }, 'Cancelled'), h('span', { class: 'g-n' }, String(canc.length))), h('div', { class: 'col-body' }, canc.length ? canc.map(card) : h('p', { class: 'muted small', style: 'margin:0' }, 'No cancelled jobs match.'))));
    return { tiles, fields, body };
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
    page.appendChild(h('header', { class: 'panel eq-head' }, h('div', null, h('p', { class: 'eyebrow' }, KIND[j.kind] + ' job'), h('h1', null, j.number, statusTag(j), hiddenTag(j))), h('div', { class: 'facts' }, h('strong', null, j.title)), h('div', { class: 'actions' }, jobSwitch(j), actions(j, ctx))));
    if (ctx.why) page.appendChild(h('p', { class: 'small muted' }, 'Cancel unavailable: ' + ctx.why));
    page.appendChild(h('section', { class: 'panel panel-pad', 'aria-label': 'Job progress', style: 'margin-top:.7rem' }, progressSummary(j)));
    const kv = (rows) => h('dl', { class: 'kv' }, rows.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
    page.appendChild(h('div', { class: 'grid-2', style: 'align-items:start;margin-top:.7rem' },
      h('section', { class: 'panel panel-pad stack' }, h('h2', null, 'Details'), kv([
        ['Equipment', EQ.isFleetJob(j) ? h('div', { class: 'stack' }, h('strong', null, EQ.jobEquipmentLabel(j)), h('span', { class: 'small muted' }, 'Includes equipment added later. One shared progress and completion.'), EQ.jobEquipment(j).map((e) => h('a', { href: '#/eq/equipment/' + e.id }, e.code))) : h('a', { href: '#/eq/equipment/' + eq.id }, eq.code)], ['Target', EQ.targetLabel(j)], ['Kind', KIND[j.kind]], ['Priority', j.priority || 'Not set'],
        ['Planned', j.plannedOn ? EQ.fmtDate(j.plannedOn) : 'Not set'], ['Responsible', j.responsible || 'Not set'], ['Created', EQ.fmtInstant(j.createdUtc) + ' by ' + EQ.userName(j.createdBy)], ['Version', String(j.version)],
        j.workStatus === 'completed' ? ['Completed on', EQ.fmtDate(j.completedOn) + ' (business date)'] : null, j.completionNote ? ['Completion note', j.completionNote] : null, j.description ? ['Description', j.description] : null,
        j.isCancelled ? ['Cancelled', EQ.fmtInstant(j.cancelledUtc) + ' by ' + EQ.userName(j.cancelledBy) + ': ' + j.cancelReason] : null]),
        h('div', { class: 'notice info' }, icon('info'), h('p', null, EQ.isFleetJob(j) ? 'Equipment statuses are independent of this shared job.' : eq.code + ' operational status is ' + EQ.STATUS[EQ.statusKey(eq.status)].label + '. This job does not change it.'))),
      h('section', { class: 'panel panel-pad stack' }, h('h2', null, 'Progress and corrections'), h('ul', { class: 'tl' }, [...j.events].reverse().map((e) => h('li', { class: 'status' }, h('strong', null, e.kind === 'progressUpdated' ? 'Progress updated · ' + e.percent + ' %' : e.kind), h('span', { class: 'when' }, EQ.fmtInstant(e.at) + ' by ' + EQ.userName(e.by) + (e.workDate ? ' · Work date ' + EQ.fmtDate(e.workDate) : '')), e.note ? h('span', null, e.note) : null))),
        j.corrections.length ? h('div', { class: 'stack' }, h('h3', null, 'Admin corrections (prior values retained)'), j.corrections.map((c) => h('div', { class: 'nonwork' }, h('strong', null, 'Correction ' + c.n + ': ' + c.reason), c.items.map((it) => h('div', null, it.field + ': ', h('s', null, it.before), ' → ', h('strong', null, it.after))), h('span', { class: 'small muted' }, EQ.userName(c.by) + ', ' + EQ.fmtInstant(c.at))))) : null)));
    page.appendChild(h('section', { class: 'panel panel-pad stack', style: 'margin-top:.7rem' }, h('h2', null, 'Replacement lines'),
      j.lines.length ? h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Position', 'Installed', 'Serial', 'Quantity', 'Replaced on', 'Removed'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, j.lines.map((l) => { const p = EQ.pos(l.positionId); return h('tr', null, h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + p.equipmentId + '?main=' + p.mainId + '&sub=' + p.subId + '&part=' + p.id }, (EQ.isFleetJob(j) ? EQ.eq(p.equipmentId).code + ' · ' : '') + p.name)), h('td', null, l.item.desc), h('td', null, l.item.serial || 'Unknown'), h('td', null, l.qty + ' ' + l.uom), h('td', null, EQ.fmtDate(l.replacedOn)), h('td', null, l.removedKnown ? (l.removedDesc || '') + (l.removedSerial ? ' (serial ' + l.removedSerial + ')' : '') : 'Unknown')); }))))
        : h('p', { class: 'muted small', style: 'margin:0' }, j.kind === 'repair' ? 'Repair jobs take no replacement lines.' : j.kind === 'project' ? 'No replacement lines recorded. They are optional for projects.' : 'No replacement lines yet. Lines are entered when the job is completed.')));
    page.appendChild(h('section', { class: 'panel panel-pad stack', style: 'margin-top:.7rem' }, h('h2', null, 'Work evidence'), h('p', { class: 'muted small', style: 'margin:0' }, "JPEG, PNG and PDF evidence: all three roles can view; EQ Team and Admin can upload. Files are not available in this prototype.")));
    return page;
  };
})(window.EQ);
