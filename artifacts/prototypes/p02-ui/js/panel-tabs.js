/* P02B / U1-C19: the crane-view right panel is current state only, in exactly four tabs (DATA_CONTRACT s18.1, API s4.16):
   Maintenance (today's ZMMS daily jobs), Projects/Special (open special jobs in the selected scope), Technical (specification
   summary of the selected area) and Spare parts (current register rows in scope). No work history is shown here; the scoped history
   lives in the EQ Jobs tab ("Open in Jobs"). Used by the flat view; the P03 3D viewer page builds the same four tabs in its own module. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const P = (EQ.panelTabs = {});
  P.TABS = [['maintenance', 'Maintenance', 'Maintenance'], ['special', 'Projects/Special', 'Special'], ['technical', 'Technical', 'Technical'], ['spareParts', 'Spare parts', 'Spare parts']];
  P.KEYS = P.TABS.map((t) => t[0]);

  const scopeParams = (eq, scope) => (scope.level === 'equipment' ? { equipment: eq.id } : { equipment: eq.id, scope: scope.level, target: scope.id });
  P.jobsLink = (eq, scope, tab) => {
    const qs = new URLSearchParams();
    if (tab === 'spareParts') { const p = scopeParams(eq, scope); qs.set('equipment', eq.id); if (scope.level === 'main') qs.set('main', scope.id); if (scope.level === 'sub') qs.set('sub', scope.id); if (scope.level === 'part') qs.set('part', scope.id); return '#/eq/jobs/spare-parts?' + qs.toString(); }
    if (tab === 'maintenance') { const t = EQ.todayColombo(); qs.set('equipment', eq.id); qs.set('from', t); qs.set('to', t); return '#/eq/jobs/special?' + qs.toString() + '#daily'.replace('#', ''); }
    Object.entries(scopeParams(eq, scope)).forEach(([k, v]) => qs.set(k, v));
    return '#/eq/jobs/special?' + qs.toString();
  };
  const openInJobs = (eq, scope, tab) => h('a', { class: 'btn btn-sm', href: P.jobsLink(eq, scope, tab), 'data-fk': 'open-in-jobs-' + tab }, icon('ext'), 'Open in Jobs');

  /** Tab badges (summary query): today's ZMMS job count, open special jobs, spare parts overdue / due soon. */
  P.summary = function summary(eq, scope) {
    const open = EQ.history(eq.id, scope, false).open.length;
    const rows = EQ.spares.rows(eq.id, scope.level === 'equipment' ? null : scope);
    const c = EQ.spares.counts(rows);
    return { maintenance: eq.zmmsMapped ? EQ.zmms.todayJobs(eq.id).length : null, special: open, spare: c };
  };

  const tag = (t, cls) => h('span', { class: 'tag' + (cls ? ' ' + cls : '') }, t);


  /** One ZMMS daily job as a compact card (fields follow the real export; values are synthetic). */
  P.dailyJobCard = function dailyJobCard(j) {
    const staff = (st, hr) => (st === '-' ? '-' : st + ' staff, ' + hr + ' h');
    return h('li', { class: /completed/i.test(j.statusText) ? '' : 'open', 'data-zjob': j.jobNo },
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
      h('div', { class: 'row' }, EQ.statusBadge(eq.status), tag(mode.label === 'Auto' ? 'Auto (ZMMS)' : 'Manual', mode.label === 'Auto' ? '' : 'gold')),
      h('span', { class: 'small muted' }, mode.long + (eq.statusCauses && eq.statusCauses.length ? '. Caused by ' + eq.statusCauses.join(', ') : '')),
      eq.statusReason && mode.label !== 'Auto' ? h('span', { class: 'small' }, 'Reason: ' + eq.statusReason) : null));
    if (!eq.zmmsMapped) {
      box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'Not linked to ZMMS'), eq.code + ' has no ZMMS equipment mapping, so no daily jobs are listed and its status keeps the manual rule. An Admin links it in Admin > EQ > ZMMS.'));
    } else {
      const jobs = EQ.zmms.todayJobs(eq.id);
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, "Today's ZMMS daily jobs ", tag(String(jobs.length))),
        h('span', { class: 'small muted' }, EQ.zmms.freshLabel() + (fresh.stale ? ' (stale: the latest sync failed or is overdue)' : '') + '. Read-only; no earlier days here.'),
        jobs.length ? h('ul', { class: 'tl' }, jobs.map((j) => P.dailyJobCard(j))) : h('div', { class: 'nonwork' }, h('strong', null, 'No ZMMS job today'), "Not in today's plan" + (eq.status === 'readyForOps' ? ', so the automatic status is Ready for OPS.' : '.'))));
    }
    box.appendChild(h('p', { class: 'small muted', style: 'margin:0' }, 'ZMMS jobs belong to the whole equipment, not to a mechanism or part, so the same list shows for any selection. Earlier days are in Jobs.'));
    box.appendChild(openInJobs(eq, scope, 'maintenance'));
    return box;
  };

  P.special = function special(eq, sel, scope, jobMini) {
    const box = h('div', { class: 'stack' });
    const H = EQ.history(eq.id, scope, true);
    const rows = [...H.open, ...H.completed];
    const cancelled = rows.filter((r) => r.job.isCancelled).length;
    const completed = H.completed.filter((r) => !r.job.isCancelled).length;
    const open = H.open.filter((r) => !r.job.isCancelled);
    box.appendChild(h('p', { class: 'small muted', style: 'margin:0' }, scope.level === 'equipment' ? 'Open special jobs of ' + eq.code + ' (an equipment-level job appears once).' : scope.level === 'part' ? 'Open special jobs at this exact position.' : 'Open special jobs targeted here and at everything below it. A job with several lines appears once.'));
    box.appendChild(h('div', { class: 'row', role: 'group', 'aria-label': 'Special job counts in this scope' }, tag(open.length + ' open', open.length ? 'gold' : ''), tag(completed + ' completed'), tag(cancelled + ' cancelled')));
    box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Open special jobs ', tag(String(open.length))),
      open.length ? h('ul', { class: 'tl' }, open.map((r) => jobMini(r.job, r.matchingLines))) : h('div', { class: 'nonwork' }, h('strong', null, 'No open special jobs'), 'Nothing is Pending or Current in this scope. Completed work (' + completed + ') stays in the Jobs tab history; it is not repeated here.')));
    box.appendChild(h('div', { class: 'row' }, openInJobs(eq, scope, 'special'),
      EQ.perm.write() && eq.lifecycle === 'active' && (sel.part || sel.sub || sel.main) ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-for-sel', onClick: () => EQ.dlg.jobForm({ equipmentId: eq.id, prefill: sel }) }, icon('plus'), 'Add job for this selection') : null));
    return box;
  };

  const FLAG = { overdue: ['Overdue', 'red'], dueSoon: ['Due soon', 'gold'] };
  P.sparePartRow = function sparePartRow(r, o) {
    o = o || {};
    const cond = r.condition === 'original' ? ['Original', ''] : r.condition === 'replaced' ? ['Replaced', 'green'] : ['Not recorded', 'dashed'];
    return h('li', { class: r.flag === 'overdue' ? 'open overdue' : r.flag === 'dueSoon' ? 'open' : '', 'data-pos': r.posId },
      h('div', { class: 'row between' }, h('strong', null, r.pos.name), h('span', null, tag(cond[0], cond[1]), r.flag ? [' ', tag(FLAG[r.flag][0], FLAG[r.flag][1])] : null)),
      h('span', { class: 'when' }, r.typeName + (r.mainCode ? ' · ' + r.mainCode + ' / ' + r.subCode : '')),
      r.condition ? h('dl', { class: 'kv' },
        h('dt', null, 'Brand'), h('dd', null, r.brand || 'Unknown'), h('dt', null, 'Model / part no.'), h('dd', null, r.model || 'Unknown'), h('dt', null, 'Serial'), h('dd', null, r.serial || 'Unknown'),
        h('dt', null, 'Replaced'), h('dd', null, r.replacedOn ? EQ.fmtDate(r.replacedOn) : r.condition === 'original' ? 'Not replaced (Original)' : 'Unknown'),
        h('dt', null, 'Expected life'), h('dd', null, r.lifeMonths != null ? r.lifeMonths + ' months (' + (r.lifeSource === 'override' ? 'set for this equipment' : 'part type default') + ')' : 'Not set'),
        h('dt', null, 'Next predicted replacement'), h('dd', null, r.predicted ? EQ.fmtDate(r.predicted) + (r.daysTo != null ? (r.daysTo < 0 ? ' (' + Math.abs(r.daysTo) + ' d ago)' : ' (in ' + r.daysTo + ' d)') : '') : r.why))
        : h('span', null, 'Condition not recorded. This does not show that the part is original, healthy or never replaced. ', r.why),
      r.remarks ? h('span', { class: 'small' }, 'Remarks: ' + r.remarks) : null,
      r.predicted ? h('span', { class: 'when' }, 'Calendar estimate from expected life, not a condition assessment.') : null);
  };
  P.spare = function spare(eq, sel, scope) {
    const box = h('div', { class: 'stack' });
    const rows = EQ.spares.rows(eq.id, scope.level === 'equipment' ? null : scope);
    const c = EQ.spares.counts(rows);
    box.appendChild(h('p', { class: 'small muted', style: 'margin:0' }, 'Current condition of the major spare parts registered for ' + eq.code + (scope.level === 'equipment' ? '.' : ' in this selection.') + ' Earlier changes are kept in Jobs > Spare parts condition.'));
    if (scope.level === 'part' && !rows.length) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'Not a major spare part'), 'This position is not designated in the spare-part register of ' + eq.code + '. An Admin chooses the major spare parts in Admin > EQ > Spare parts.'));
    else if (!rows.length) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'No major spare parts in this selection'), 'Nothing here is designated in the register of ' + eq.code + '.'));
    else {
      box.appendChild(h('div', { class: 'row', role: 'group', 'aria-label': 'Spare part flags in this scope' }, tag(rows.length + ' registered'), tag(c.overdue + ' overdue', c.overdue ? 'red' : ''), tag(c.dueSoon + ' due soon', c.dueSoon ? 'gold' : '')));
      box.appendChild(h('ul', { class: 'tl' }, rows.map((r) => P.sparePartRow(r))));
    }
    box.appendChild(openInJobs(eq, scope, 'spareParts'));
    return box;
  };
})(window.EQ);
