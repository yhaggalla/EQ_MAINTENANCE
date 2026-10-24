/* P02B / U1-C19: the crane-view right panel is current state only, in exactly four tabs (DATA_CONTRACT s18.1, API s4.16):
   Maintenance (today's ZMMS daily jobs), Projects/Special (open and completed special jobs in the selected scope; U1-C23 makes this
   tab the one exception to "no history in the crane view"), Technical (specification summary of the selected area) and Spare parts
   (current register rows in scope). Other work history (events, corrections, installations, status changes, earlier ZMMS days) lives
   in the EQ Jobs tab ("Open in Jobs"). Jobs switched off with "Show on dashboard / 3D" are not shown here (U1-C26). Used by both shared-viewer cameras; physical areas filter to their included positions (U1-C34). */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const P = (EQ.panelTabs = {});
  /** Link prefix: empty in the P02 flat view; the P03 viewer page sets it to the P02 prototype URL so Open in Jobs and job numbers open there. */
  P.base = '';
  const ext = () => (P.base ? { target: '_blank', rel: 'noopener' } : {});
  P.TABS = [['maintenance', 'Maintenance', 'Maintenance'], ['special', 'Projects/Special', 'Projects/Special'], ['technical', 'Technical', 'Technical'], ['spareParts', 'Spare parts', 'Spare parts']];
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
    if (tab === 'maintenance') { const t = EQ.todayColombo(); qs.set('equipment', eq.id); qs.set('from', t); qs.set('to', t); return P.base + '#/eq/jobs/daily?' + qs.toString(); } // U1-C20: Daily work (CMMS) tab
    Object.entries(scopeParams(eq, scope)).forEach(([k, v]) => qs.set(k, v));
    return P.base + '#/eq/jobs/special?' + qs.toString();
  };
  /** EQ Jobs links are offered only when the session holds eq.jobs.view (Repair-R02B finding 1, D-139): with the Jobs tab switched off
   *  the link would only lead to the 403 page, and the job records behind it are refused by the server anyway. */
  P.jobsAllowed = () => EQ.access.has('eq.jobs.view');
  const openInJobs = (eq, scope, tab) => (P.jobsAllowed() ? h('a', { class: 'btn btn-sm', href: P.jobsLink(eq, scope, tab), 'data-fk': 'open-in-jobs-' + tab, ...ext() }, icon('ext'), scope.level === 'area' ? 'Open equipment in Jobs' : 'Open in Jobs')
    : h('p', { class: 'small muted', style: 'margin:0', 'data-fk': 'jobs-tab-off-' + tab }, 'The EQ Jobs tab is not available for your role, so earlier work and job records are not shown.'));

  /** Tab badges (summary query): today's ZMMS job count, open special jobs, spare parts overdue / due soon. */
  P.summary = function summary(eq, scope) {
    const cs = EQ.currentSpecial(eq.id, scope);
    const open = cs.ok ? cs.openJobs.length : 0;
    const rows = EQ.spares.rows(eq.id, scope.level === 'equipment' ? null : scope);
    const c = EQ.spares.counts(rows);
    return { maintenance: eq.zmmsMapped ? EQ.zmms.todayJobs(eq.id).length : null, special: open, spare: c };
  };

  const tag = (t, cls, title) => h('span', { class: 'tag' + (cls ? ' ' + cls : ''), title }, t);


  /** One ZMMS daily job as a compact card (fields follow the real export; values are synthetic). */
  P.dailyJobCard = function dailyJobCard(j) {
    const staff = (st, hr) => (st === '-' ? '-' : st + ' staff, ' + hr + ' h');
    return h('li', { class: /completed/i.test(j.statusText) ? '' : 'open', 'data-zjob': j.jobNo, 'data-panel-search-item': '' },
      h('div', { class: 'row between' }, h('span', { class: 'mono' }, 'Job ' + j.jobNo + (j.cwo && j.cwo !== '0' ? ' · CWO ' + j.cwo : '')), h('span', null, tag(j.typeText), ' ', tag(j.statusText, /completed/i.test(j.statusText) ? 'green' : /hold/i.test(j.statusText) ? 'red' : 'gold'), ' ', tag(j.priority, j.priority === 'High' ? 'red' : ''))),
      h('strong', null, j.desc),
      h('span', { class: 'when' }, 'Equipment ' + j.equipmentText + ' (' + j.eqType + ', ' + j.dept + ') · created ' + j.created),
      h('span', { class: 'when' }, 'Mech: ' + staff(j.mechStaff, j.mechHours) + ' · Elec: ' + staff(j.elecStaff, j.elecHours)),
      j.fault ? h('span', { class: 'when' }, 'Fault: ' + j.fault + (j.corrective ? ' · Corrective: ' + j.corrective : '')) : null,
      j.statusRemarks ? h('span', { class: 'when' }, 'Status remark: ' + j.statusRemarks) : null);
  };

  P.maintenance = function maintenance(eq, scope) {
    const box = h('div', { class: 'stack' });
    const mode = EQ.zmms.mode(eq);
    const fresh = EQ.zmms.freshness();
    box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Equipment status'),
      h('div', { class: 'row' }, EQ.statusBadge(eq.status), tag(mode.label === 'Auto' ? 'Auto (ZMMS)' : 'Manual', mode.label === 'Auto' ? '' : 'gold', mode.long)),
      eq.statusReason && mode.label !== 'Auto' ? h('span', { class: 'small' }, 'Reason: ' + eq.statusReason) : null));
    if (!eq.zmmsMapped) {
      box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'Not linked to ZMMS')));
    } else {
      const jobs = EQ.zmms.todayJobs(eq.id);
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, "Today's ZMMS daily jobs ", tag(String(jobs.length))),
        h('div', { class: 'row small muted' }, EQ.zmms.freshLabel(), fresh.stale ? tag('Stale', 'gold', 'The latest sync failed or is overdue.') : null),
        jobs.length ? h('ul', { class: 'tl' }, jobs.map((j) => P.dailyJobCard(j))) : h('div', { class: 'nonwork' }, h('strong', null, 'No ZMMS job today'))));
    }
    box.appendChild(openInJobs(eq, scope, 'maintenance'));
    return box;
  };

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
    if (scope.level === 'part' && !rows.length) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'Not a major spare part')));
    else if (!rows.length) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'No major spare parts in this selection')));
    else {
      box.appendChild(h('div', { class: 'row', role: 'group', 'aria-label': 'Spare part flags in this scope' }, tag(rows.length + ' registered'), tag(c.overdue + ' overdue', c.overdue ? 'red' : ''), tag(c.dueSoon + ' due soon', c.dueSoon ? 'gold' : '')));
      box.appendChild(h('ul', { class: 'tl' }, rows.map((r) => {
        const row = P.sparePartRow(r);
        if (canUpdate) row.appendChild(h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn-sm',
          'data-fk': 'update-spare-' + r.posId, 'aria-label': 'Update condition for ' + r.pos.name,
          onClick: () => EQ.dlg.spare(EQ.spares.row(r.posId)) }, icon('edit'), 'Update condition')));
        return row;
      })));
    }
    // U1-C21: EQ Team and Admin add a spare part, pre-filled with the equipment and the selection (a part is pre-selected when it can be added)
    const selectedRegistered = scope.level === 'part' && rows.some((r) => r.posId === sel.part);
    const addSpare = !selectedRegistered && EQ.perm.write() && eq.lifecycle === 'active' && EQ.dlg && EQ.dlg.addSpare ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-spare', onClick: () => EQ.dlg.addSpare({ equipmentId: eq.id, main: sel.main || '', sub: sel.sub || '', part: sel.part || '' }) }, icon('plus'), 'Add spare part') : null;
    box.appendChild(h('div', { class: 'row' }, openInJobs(eq, scope, 'spareParts'), addSpare));
    return box;
  };
})(window.EQ);
