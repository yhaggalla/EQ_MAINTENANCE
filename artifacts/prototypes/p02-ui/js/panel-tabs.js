/* U1-C63: three scoped current-state tabs; full work/history remains in Jobs. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const P = (EQ.panelTabs = {});
  /** Link prefix: empty in the P02 flat view; the P03 viewer page sets it to the P02 prototype URL so Open in Jobs and job numbers open there. */
  P.base = '';
  const ext = () => (P.base ? { target: '_blank', rel: 'noopener' } : {});
  P.TABS = [['spareParts', 'Spare part status', 'Spare part status'], ['special', 'Projects/Special', 'Projects/Special'], ['technical', 'Technical', 'Technical']];
  P.KEYS = P.TABS.map((t) => t[0]);

  // U1-C39: filter only the rendered, permission-scoped panel. Never query a wider job/history population.
  P.filterPanel = function filterPanel(body, query, tab) {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matches = (text) => words.every((word) => text.toLocaleLowerCase().includes(word));
    const items = [...body.querySelectorAll('[data-panel-search-item]')].map((el) => ({ nodes: [el], text: el.textContent + ' ' + (el.dataset.jobNumber || '') }));
    // Technical key/value fields filter as pairs; spare-part fields stay with their parent card.
    body.querySelectorAll('dl.kv').forEach((dl) => {
      if (dl.closest('[data-panel-search-item]')) return;
      [...dl.children].filter((el) => el.tagName === 'DT').forEach((dt) => {
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName === 'DD') items.push({ nodes: [dt, dd], text: dt.textContent + ' ' + dd.textContent });
      });
    });
    let shown = 0;
    items.forEach(({ nodes, text }) => {
      const heading = tab === 'technical' ? nodes[0].closest('.sec')?.querySelector(':scope > h3')?.textContent || '' : '';
      const visible = nodes[0].dataset.statusMatch !== 'false' && matches(heading + ' ' + text);
      nodes.forEach((node) => { node.hidden = !visible; });
      if (visible) shown += 1;
    });
    body.querySelectorAll('.sec').forEach((section) => {
      const members = items.filter((item) => section.contains(item.nodes[0]));
      section.hidden = words.length > 0 && members.length > 0 && members.every((item) => item.nodes[0].hidden);
    });
    let empty = body.querySelector('.panel-search-empty');
    if (!empty) { empty = h('p', { class: 'panel-search-empty small muted', hidden: true }, 'No matches in this selection.'); body.prepend(empty); }
    empty.textContent = body.querySelector('.current-special') ? 'No jobs match these filters.' : 'No matches in this selection.';
    empty.hidden = !items.length || shown > 0 || (!words.length && !body.querySelector('.current-special'));
    const result = body.querySelector('.special-result');
    if (result) result.textContent = shown === items.length ? EQ.plural(shown, 'special job') : shown + ' of ' + items.length + ' special jobs';
    return { shown, total: items.filter(({ nodes }) => nodes[0].dataset.statusMatch !== 'false').length, loading: !!body.querySelector('[aria-busy="true"]') };
  };

  const scopeParams = (eq, scope) => (scope.level === 'equipment' || scope.level === 'area' ? { equipment: eq.id } : { equipment: eq.id, scope: scope.level, target: scope.id });
  P.jobsLink = (eq, scope, tab) => {
    const qs = new URLSearchParams();
    if (tab === 'spareParts') { const p = scopeParams(eq, scope); qs.set('equipment', eq.id); if (scope.level === 'main') qs.set('main', scope.id); if (scope.level === 'sub') qs.set('sub', scope.id); if (scope.level === 'part') qs.set('part', scope.id); return P.base + '#/eq/jobs/spare-parts?' + qs.toString(); }
    Object.entries(scopeParams(eq, scope)).forEach(([k, v]) => qs.set(k, v));
    return P.base + '#/eq/jobs/special?' + qs.toString();
  };
  /** EQ Jobs links are offered only when the session holds eq.jobs.view (Repair-R02B finding 1, D-139): with the Jobs tab switched off
   *  the link would only lead to the 403 page, and the job records behind it are refused by the server anyway. */
  P.jobsAllowed = () => EQ.access.has('eq.jobs.view');
  const openInJobs = (eq, scope, tab) => (P.jobsAllowed() ? h('a', { class: 'btn btn-sm', href: P.jobsLink(eq, scope, tab), 'data-fk': 'open-in-jobs-' + tab, ...ext() }, icon('ext'), scope.level === 'area' ? 'Open equipment in Jobs' : 'Open in Jobs')
    : h('p', { class: 'small muted', style: 'margin:0', 'data-fk': 'jobs-tab-off-' + tab }, 'The EQ Jobs tab is not available for your role, so earlier work and job records are not shown.'));

  /** Current-state tab badges: eligible open special jobs and spare-part overdue / due-soon counts. */
  P.summary = function summary(eq, scope) {
    const cs = EQ.currentSpecial(eq.id, scope);
    const open = cs.ok ? cs.openJobs.length : 0;
    const rows = EQ.spares.rows(eq.id, scope.level === 'equipment' ? null : scope);
    const c = EQ.spares.counts(rows);
    return { special: open, spare: c };
  };

  const tag = (t, cls, title) => h('span', { class: 'tag' + (cls ? ' ' + cls : ''), title }, t);


  /** One job card. opts.current: crane-view use (current-state summary only, API s4.16): no correction history, and the job title is a
   *  link only when the session holds eq.jobs.view (D-139). The EQ Jobs tab calls it without opts and keeps the full card. */
  P.jobMini = function jobMini(j, lines, opts) {
    opts = opts || {};
    if (opts.current) {
      const state = j.workStatus === 'completed' ? 'Completed' : j.workStatus === 'current' ? 'Current' : 'Pending';
      const fullTarget = EQ.targetLabel(j);
      const target = j.level === 'part' && lines?.length ? EQ.targetLabel({ ...j, level: 'main', subId: null, positionId: null }) : fullTarget;
      const title = P.jobsAllowed() ? h('a', { class: 'current-job-title', href: P.base + '#/eq/jobs/special/' + j.id, title: j.number + ' · Open job details', ...ext() }, j.title)
        : h('strong', { class: 'current-job-title', title: j.number }, j.title);
      return h('li', { class: 'eq-current-card', 'data-current-job': j.workStatus, 'data-panel-search-item': '', 'data-job-number': j.number, 'aria-label': j.number + ' ' + j.title },
        h('div', { class: 'current-job-head' }, title, h('span', { class: 'current-job-status ' + (j.workStatus === 'completed' ? 'completed' : 'open') }, j.workStatus === 'completed' ? icon('check-circle') : null, state)),
        h('p', { class: 'current-job-meta', title: fullTarget }, h('span', { class: 'current-job-kind' }, EQ.JOB_KIND[j.kind]), ' · ' + target),
        h('p', { class: 'current-job-date' }, icon('clock'), j.workStatus === 'completed' ? 'Completed ' + EQ.fmtDate(j.completedOn) : j.plannedOn ? 'Planned ' + EQ.fmtDate(j.plannedOn) : 'No planned date'),
        lines && lines.length ? h('ul', { class: 'current-matching' }, lines.map(l => h('li', null, icon('wrench'), EQ.pos(l.positionId).name))) : null);
    }
    const num = opts.current && !P.jobsAllowed() ? h('span', { class: 'mono', 'data-fk': 'job-num-' + j.id }, j.number) : h('a', { href: P.base + '#/eq/jobs/special/' + j.id, ...ext() }, j.number);
    return h('li', { class: j.workStatus === 'completed' ? '' : 'open', 'data-panel-search-item': '' },
      h('div', { class: 'row between' }, num, h('span', null, h('span', { class: 'tag' }, EQ.JOB_KIND[j.kind]), ' ', h('span', { class: 'tag ' + (j.workStatus === 'completed' ? 'green' : 'gold') }, j.isCancelled ? 'Cancelled' : j.workStatus === 'completed' ? 'Completed' : j.workStatus === 'current' ? 'Current' : 'Pending'))),
      h('strong', null, j.title),
      h('span', { class: 'when' }, 'Target: ' + EQ.targetLabel(j)),
      j.workStatus === 'completed' ? h('span', { class: 'when' }, 'Completed on ' + EQ.fmtDate(j.completedOn) + ' (business date)' + (!opts.current && j.corrections && j.corrections.length ? ' · Corrected ' + j.corrections.length + ' time(s)' : '')) : h('span', { class: 'when' }, j.plannedOn ? 'Planned ' + EQ.fmtDate(j.plannedOn) : 'No planned date'),
      j.isCancelled ? h('span', { class: 'when' }, 'Cancelled by ' + EQ.userName(j.cancelledBy) + ': ' + j.cancelReason) : null,
      lines && lines.length ? h('ul', { class: 'lines' }, lines.map((l) => { const p = EQ.pos(l.positionId); return opts.current ? h('li', null, 'Matching position: ' + p.name) : h('li', null, p.name + ': installed ' + l.item.desc + (l.item.serial ? ' (serial ' + l.item.serial + ')' : ' (serial unknown)') + ', ' + l.qty + ' ' + l.uom + ', ' + EQ.fmtDate(l.replacedOn) + (l.removedKnown ? '; removed ' + (l.removedDesc || 'item') + (l.removedSerial ? ' (serial ' + l.removedSerial + ')' : '') : '; removed item Unknown')); })) : null,
      !opts.current && j.corrections.length ? h('details', null, h('summary', { class: 'small' }, 'Correction history (prior values kept)'), j.corrections.map((c) => h('div', { class: 'small', style: 'margin-top:.3rem' }, 'Correction ' + c.n + ' by ' + EQ.userName(c.by) + ', ' + EQ.fmtInstantShort(c.at) + ': ' + c.reason, c.items.map((it) => h('div', null, it.field + ': ', h('s', null, it.before), ' → ', h('strong', null, it.after)))))) : null);
  };

  const specialFilters = new Map();
  P.special = function special(eq, sel, scope) {
    const box = h('div', { class: 'stack current-special' });
    // Filter only the existing detached current-state DTO. Cancelled details stay in Jobs.
    const cs = EQ.currentSpecial(eq.id, scope);
    if (!cs.ok) { box.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, cs.message))); return box; }
    const list = cs.jobs, key = eq.id + '|' + scope.level + '|' + (scope.id || '');
    let selected = specialFilters.get(key) || 'all';
    const matches = j => selected === 'all' || (selected === 'open' ? j.workStatus !== 'completed' : j.workStatus === 'completed');
    const filters = h('div', { class: 'special-filters', role: 'group', 'aria-label': 'Special job status filters' },
      [['all', 'All', cs.counts.pending + cs.counts.current + cs.counts.completed], ['open', 'Open', cs.openJobs.length], ['completed', 'Completed', cs.counts.completed]].map(([value, label, count]) => h('button', {
        type: 'button', 'data-fk': 'special-filter-' + value, 'aria-pressed': String(selected === value),
        onClick: () => {
          selected = value; specialFilters.set(key, value);
          filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fk === 'special-filter-' + value)));
          box.querySelectorAll('[data-current-job]').forEach(node => { node.dataset.statusMatch = String(value === 'all' || (value === 'open' ? node.dataset.currentJob !== 'completed' : node.dataset.currentJob === 'completed')); });
          box.dispatchEvent(new Event('panel-filter-change', { bubbles: true }));
        } }, label, h('b', null, String(count)))),
      P.jobsAllowed() ? h('a', { href: P.jobsLink(eq, scope, 'special') + '&includeCancelled=1', title: 'View cancelled jobs in Jobs', 'data-fk': 'cancelled-in-jobs', ...ext() }, 'Cancelled ', h('b', null, String(cs.counts.cancelled)))
        : h('span', { title: 'Cancelled job details require access to Jobs.' }, 'Cancelled ', h('b', null, String(cs.counts.cancelled))));
    box.appendChild(filters);
    box.appendChild(list.length ? h('ul', { class: 'tl current-job-list', 'data-fk': 'special-list' }, list.map(r => {
      const card = P.jobMini(r.job, r.matchingLines, { current: true }); card.dataset.statusMatch = String(matches(r.job)); return card;
    })) : h('div', { class: 'nonwork' }, h('strong', null, 'No special jobs')));
    if (cs.moreCompleted) box.appendChild(h('p', { class: 'small muted', 'data-fk': 'more-completed' }, 'Only the ' + EQ.CURRENT_COMPLETED_LIMIT + ' most recent completed jobs are listed here; the rest are in Jobs.'));
    box.appendChild(h('div', { class: 'special-footer' }, h('span', { class: 'special-result', role: 'status', 'aria-live': 'polite' }, EQ.plural(list.length, 'special job')),
      P.jobsAllowed() ? h('a', { href: P.jobsLink(eq, scope, 'special'), 'data-fk': 'open-in-jobs-special', ...ext() }, 'View in Jobs', icon('ext')) : null));
    // Keep the selected-scope add action; the header's Add action always starts at whole equipment.
    if (scope.level !== 'equipment' && EQ.perm.write() && eq.lifecycle === 'active' && EQ.dlg?.jobForm) box.appendChild(h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-for-sel', onClick: () => EQ.dlg.jobForm({ equipmentId: eq.id, prefill: sel }) }, icon('plus'), 'Add special job here'));
    return box;
  };

  const FLAG = { overdue: ['Overdue', 'red'], dueSoon: ['Due soon', 'gold'] };
  const spareFilters = new Map();
  P.sparePartRow = function sparePartRow(r, o) {
    o = o || {};
    const cond = r.condition === 'original' ? ['Original', ''] : r.condition === 'replaced' ? ['Replaced', 'green'] : ['Not recorded', 'dashed'];
    return h('li', { class: r.flag === 'overdue' ? 'open overdue' : r.flag === 'dueSoon' ? 'open' : '', 'data-pos': r.posId, 'data-panel-search-item': '' },
      h('div', { class: 'row between' }, h('strong', null, r.pos.name), h('span', null, tag(cond[0], cond[1]), r.flag ? [' ', tag(FLAG[r.flag][0], FLAG[r.flag][1])] : null)),
      h('span', { class: 'when' }, r.typeName + (r.mainCode ? ' · ' + r.mainCode + ' / ' + r.subCode : '')),
      r.condition ? h('dl', { class: 'kv' },
        h('dt', null, 'Brand'), h('dd', null, r.brand || 'Unknown'), h('dt', null, 'Model / part no.'), h('dd', null, r.model || 'Unknown'), h('dt', null, 'Serial'), h('dd', null, r.serial || 'Unknown'),
        h('dt', null, 'Replaced'), h('dd', null, r.replacedOn ? EQ.fmtDate(r.replacedOn) : r.condition === 'original' ? 'Not replaced (Original)' : 'Unknown'),
        h('dt', null, 'Expected life'), h('dd', null, r.lifeMonths != null ? r.lifeMonths + ' months (' + (r.lifeSource === 'override' ? 'set for this equipment' : 'part type default') + ')' : 'Not set'),
        h('dt', { title: 'Calendar estimate from expected life, not a condition assessment.' }, 'Next predicted replacement'), h('dd', null, r.predicted ? EQ.fmtDate(r.predicted) + (r.daysTo != null ? (r.daysTo < 0 ? ' (' + Math.abs(r.daysTo) + ' d ago)' : ' (in ' + r.daysTo + ' d)') : '') : r.why))
        : h('span', { class: 'small muted' }, r.why),
      r.remarks ? h('span', { class: 'small' }, 'Remarks: ' + r.remarks) : null);
  };
  P.spare = function spare(eq, sel, scope) {
    const box = h('div', { class: 'stack' });
    const rows = EQ.spares.rows(eq.id, scope.level === 'equipment' ? null : scope);
    const c = EQ.spares.counts(rows);
    const canUpdate = EQ.perm.write() && eq.lifecycle === 'active' && EQ.dlg?.spare;
    // U1-C69: History opens the replacement history over the viewer (host page sets onSpareHistory); same permission as the Jobs register history.
    const canHistory = !!P.onSpareHistory && P.jobsAllowed();
    if (scope.level === 'part' && !rows.length) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'Not a major spare part')));
    else if (!rows.length) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'No major spare parts in this selection')));
    else {
      // U1-C69: the summary chips filter the cards (All / Overdue / Due soon); combined with the panel search like the special-job filters.
      const fkey = eq.id + '|' + scope.level + '|' + (scope.id || '');
      let flag = spareFilters.get(fkey) || 'all';
      if (flag !== 'all' && !rows.some((r) => r.flag === flag)) flag = 'all';
      const match = (f, v) => v === 'all' || f === v;
      const apply = (v) => {
        flag = v; spareFilters.set(fkey, v);
        chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.flag === v)));
        list.querySelectorAll('li[data-pos]').forEach((li) => { li.dataset.statusMatch = String(match(li.dataset.flag, v)); li.hidden = !match(li.dataset.flag, v); });
        box.dispatchEvent(new Event('panel-filter-change', { bubbles: true }));
      };
      const chip = (v, text, n, cls) => h('button', { type: 'button', class: 'tag spare-flag' + (cls ? ' ' + cls : ''), 'data-flag': v, 'data-fk': 'spare-flag-' + v, 'aria-pressed': String(flag === v),
        disabled: v !== 'all' && !n ? true : null, title: v === 'all' ? 'Show all registered parts' : 'Show only ' + text + ' parts',
        onClick: () => apply(v !== 'all' && flag === v ? 'all' : v) }, n + ' ' + text);
      const chips = h('div', { class: 'row spare-flags', role: 'group', 'aria-label': 'Filter spare parts by flag' }, chip('all', 'registered', rows.length), chip('overdue', 'overdue', c.overdue, c.overdue ? 'red' : ''), chip('dueSoon', 'due soon', c.dueSoon, c.dueSoon ? 'gold' : ''));
      box.appendChild(chips);
      const list = h('ul', { class: 'tl' });
      box.appendChild(list);
      list.append(...rows.map((r) => {
        const row = P.sparePartRow(r);
        row.dataset.flag = r.flag || 'none'; row.dataset.statusMatch = String(match(row.dataset.flag, flag)); row.hidden = !match(row.dataset.flag, flag);
        const open = canHistory && P.spareHistoryOpen?.(r.posId);
        const actions = [
          canUpdate ? h('button', { type: 'button', class: 'btn-sm',
            'data-fk': 'update-spare-' + r.posId, 'aria-label': 'Update condition for ' + r.pos.name,
            onClick: () => EQ.dlg.spare(EQ.spares.row(r.posId)) }, icon('edit'), 'Update condition') : null,
          canHistory ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'spare-history-' + r.posId, 'aria-label': 'Replacement history of ' + r.pos.name,
            'aria-expanded': open ? 'true' : 'false', 'aria-controls': open ? 'sp-history' : null,
            onClick: () => P.onSpareHistory(eq, r.posId) }, icon('history'), 'History') : null].filter(Boolean);
        if (actions.length) row.appendChild(h('div', { class: 'row spare-actions' }, actions));
        return row;
      }));
    }
    // U1-C21: EQ Team and Admin add a spare part, pre-filled with the equipment and the selection (a part is pre-selected when it can be added)
    const selectedRegistered = scope.level === 'part' && rows.some((r) => r.posId === sel.part);
    const addSpare = !selectedRegistered && EQ.perm.write() && eq.lifecycle === 'active' && EQ.dlg && EQ.dlg.addSpare ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-spare', onClick: () => EQ.dlg.addSpare({ equipmentId: eq.id, main: sel.main || '', sub: sel.sub || '', part: sel.part || '' }) }, icon('plus'), 'Add spare part') : null;
    box.appendChild(h('div', { class: 'row' }, openInJobs(eq, scope, 'spareParts'), addSpare));
    return box;
  };

  // ---------------------------------------------------------------- spare-part history (EQ Jobs register rows and the U1-C69 crane-view History panel)
  P.SPARE_SOURCE = { jobCompletion: 'Replacement special job completed', registerOriginal: 'Original recorded', registerReplacement: 'Replacement recorded', registerAmend: 'Current item amended', registerRemarks: 'Remarks edited', registerAdd: 'Added to the register', designation: 'Designation changed', correction: 'Admin correction' };
  P.spareState = function spareState(s) {
    if (!s) return 'removed';
    const des = s.typeId ? 'designated (' + (EQ.spares.typeOf(s.typeId) || {}).name + (s.lifeOverride != null ? ', ' + s.lifeOverride + ' months for this equipment' : ', part-type life') + ')' : null;
    if (des && !('condition' in s)) return des;
    return [des, s.condition ? s.condition : 'not recorded', s.replacedOn ? 'replaced ' + EQ.fmtDate(s.replacedOn) : null, s.brand, s.model, s.serial ? 'serial ' + s.serial : null, s.remarks ? 'remarks: ' + s.remarks : null].filter(Boolean).join(' · ');
  };
  const jobRef = (jobId) => { const num = (EQ.job(jobId) || {}).number || jobId; return P.jobsAllowed() ? h('a', { href: P.base + '#/eq/jobs/special/' + jobId, ...ext() }, num) : h('span', { class: 'mono' }, num); };
  /** Register revisions, newest first (before/after values kept): plain rows, shared by EQ Jobs and the crane-view History panel. */
  P.spareChangeLog = (hist) => (hist.length ? h('ul', { class: 'sp-log' }, hist.map((x) => h('li', null,
    h('div', { class: 'sp-log-head' }, h('strong', null, 'Revision ' + x.rev + ' · ' + (P.SPARE_SOURCE[x.source] || x.source)), h('span', { class: 'sp-meta' }, EQ.fmtInstantShort(x.at) + ' · ' + EQ.userName(x.by))),
    h('p', null, h('span', { class: 'sp-k' }, 'Before'), x.before ? h('s', null, P.spareState(x.before)) : h('span', { class: 'sp-meta' }, 'nothing recorded')),
    h('p', null, h('span', { class: 'sp-k' }, 'After'), P.spareState(x.after)),
    x.reason ? h('p', { class: 'sp-meta' }, 'Reason: ' + x.reason) : null,
    x.jobId ? h('p', { class: 'sp-meta' }, 'Job ', jobRef(x.jobId)) : null)))
    : h('div', { class: 'nonwork' }, h('strong', null, 'No history'), 'Nothing has been recorded for this part.'));
  const span = (m) => (m == null ? null : m < 1 ? 'under 1 month' : m < 12 ? EQ.plural(m, 'month') : Math.floor(m / 12) + ' yr' + (m % 12 ? ' ' + (m % 12) + ' mo' : ''));
  /** U1-C69: replacement history of one registered part, a floating panel over the model. onClose closes it (close button or Escape). */
  P.spareHistory = function spareHistory(eq, posId, onClose) {
    const res = EQ.spares.replacementHistory(posId);
    const close = h('button', { type: 'button', class: 'sp-history-close', 'data-fk': 'sp-history-close', 'aria-label': 'Close replacement history', title: 'Close (Esc)', onClick: onClose }, icon('x'));
    const box = h('section', { class: 'sp-history', id: 'sp-history', 'aria-labelledby': 'sp-history-title', 'data-pos': posId,
      onKeydown: (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.preventDefault(); e.stopPropagation(); onClose(); } } });
    if (!res.ok) { box.append(h('header', { class: 'sp-history-head' }, h('div', { class: 'sp-history-titles' }, h('h2', { id: 'sp-history-title', tabindex: '-1' }, 'Replacement history')), close), h('div', { class: 'sp-history-body' }, h('p', { class: 'notice error', role: 'alert' }, res.message))); return box; }
    const r = res.row, current = res.periods[0];
    const cond = r.condition === 'original' ? ['Original', ''] : r.condition === 'replaced' ? ['Replaced', 'green'] : ['Not recorded', 'dashed'];
    box.appendChild(h('header', { class: 'sp-history-head' },
      h('div', { class: 'sp-history-titles' }, h('p', { class: 'sp-history-kicker' }, 'Replacement history'), h('h2', { id: 'sp-history-title', tabindex: '-1' }, r.pos.name),
        h('p', { class: 'sp-history-sub' }, h('span', null, eq.code + ' · ' + r.typeName + (r.mainCode ? ' · ' + r.mainCode + '/' + r.subCode : '')), tag(cond[0], cond[1]))),
      close));
    const stat = (label, value, sub, cls, title) => h('div', { class: 'sp-stat' + (cls ? ' ' + cls : '') }, h('dt', { title }, label), h('dd', null, value, sub ? h('span', { class: 'sp-stat-sub' }, sub) : null));
    const since = !current ? ['-', null] : current.from ? [EQ.fmtDate(current.from), [current.original ? 'Commissioning' : null, span(current.months)].filter(Boolean).join(' · ')] : ['Unknown', 'Commissioning date not set'];
    const body = h('div', { class: 'sp-history-body' },
      h('dl', { class: 'sp-history-stats' },
        stat('In service since', since[0], since[1]),
        stat('Replacements', String(res.replacements)),
        stat('Expected life', r.lifeMonths != null ? r.lifeMonths + ' months' : 'Not set', r.lifeSource === 'override' ? 'Set for this equipment' : null),
        stat('Next replacement', r.predicted ? EQ.fmtDate(r.predicted) : 'No estimate', r.predicted ? (r.daysTo < 0 ? Math.abs(r.daysTo) + ' d overdue' : 'in ' + r.daysTo + ' d') : r.why.replace(/^No prediction \((.*)\)$/, '$1'), r.flag, 'Calendar estimate from expected life, not a condition assessment.')));
    const oldest = res.periods[res.periods.length - 1];
    body.appendChild(h('section', { class: 'sp-history-sec', 'aria-labelledby': 'sp-inst-h' }, h('h3', { id: 'sp-inst-h' }, 'Installations', h('span', { class: 'sp-count' }, String(res.periods.length))),
      res.periods.length ? h('ol', { class: 'sp-inst', 'aria-label': 'Installations, newest first' }, res.periods.map((p) => h('li', { 'data-event': p.eventId, class: p.current ? 'current' : null },
        h('div', { class: 'sp-inst-head' }, h('strong', null, (p.from ? EQ.fmtDate(p.from) : 'Commissioning') + ' – ' + (p.to ? EQ.fmtDate(p.to) : 'present')),
          h('span', { class: 'sp-state' + (p.current ? ' current' : '') }, [p.original ? 'Original' : null, p.current ? 'Current' : null].filter(Boolean).join(' · ') || null)),
        h('p', null, p.installed.desc),
        h('p', { class: 'sp-meta' }, [p.installed.mfr || 'Unknown brand', p.installed.partNo || 'no part no.', 'S/N ' + (p.installed.serial || 'unknown')].join(' · ')),
        p === oldest && !p.original ? h('p', { class: 'sp-meta' }, 'Previous item: ' + (p.removedKnown ? (p.removedDesc || 'recorded') + (p.removedSerial ? ' (S/N ' + p.removedSerial + ')' : '') : 'not recorded')) : null,
        h('p', { class: 'sp-meta', title: 'Recorded ' + EQ.fmtInstantShort(p.recordedUtc) + ' by ' + EQ.userName(p.recordedBy) }, p.months != null ? span(p.months) + ' in service · ' : '', p.jobId ? ['Job ', jobRef(p.jobId)] : 'Register entry'))))
        : h('p', { class: 'sp-meta' }, 'No installation recorded. ' + r.why)));
    body.appendChild(h('details', { class: 'sp-history-log' }, h('summary', null, 'Register changes', h('span', { class: 'sp-count' }, String(res.changes.length))), P.spareChangeLog(res.changes)));
    box.append(body, h('footer', { class: 'sp-history-foot' }, h('a', { href: P.jobsLink(eq, { level: 'part', id: posId }, 'spareParts'), 'data-fk': 'sp-history-jobs', ...ext() }, 'Open in Jobs', icon('ext'))));
    return box;
  };
})(window.EQ);
