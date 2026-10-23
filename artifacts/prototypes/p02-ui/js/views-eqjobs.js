/* EQ Jobs tab in four tabs (U1-C20, supersedes the SOW V2 s4.2 three-part layout; DATA_CONTRACT s18.2): Special/Projects |
   Daily work (CMMS) | EQ status | Spare parts condition. Shared filters (equipment, type, date range, search) are kept in the URL across
   the tabs. Work history lives here, not in the crane view: the scoped history (DATA s9) opens with equipment + scope + target ("Open in
   Jobs"). EQ Team and Admin add special jobs and spare parts here (U1-C21). Synthetic data only. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const kit = () => EQ._dlg;

  const PARTS = [['special', 'Special/Projects'], ['daily', 'Daily work (CMMS)'], ['status', 'EQ status'], ['spare-parts', 'Spare parts condition']];
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
  function dailyRows(q) {
    const z = EQ.state.D.zmms, today = EQ.todayColombo();
    const from = q.from || (q.to ? '0000-01-01' : today), to = q.to || (q.from ? '9999-12-31' : today);
    const ids = new Set(eqList(q).map((e) => e.id));
    const needle = (EQ.jobsUI.q || '').toLowerCase();
    return z.jobs.filter((j) => j.match === 'matched' && ids.has(j.equipmentId) && j.date >= from && j.date <= to && (!needle || (j.jobNo + ' ' + j.desc + ' ' + j.equipmentText + ' ' + EQ.eq(j.equipmentId).code).toLowerCase().includes(needle)))
      .sort((a, b) => EQ.cmp(b.date, a.date) || EQ.cmp(a.equipmentText, b.equipmentText) || EQ.cmp(a.jobNo, b.jobNo));
  }
  EQ.dailyRows = dailyRows;
  const DAILY_COLUMNS = ['Job date', 'Job ID', 'CWO No', 'Equipment (app code)', 'ZMMS equipment', 'Equipment type', 'Department', 'Job type', 'Job status', 'Priority', 'Created', 'Description', 'Staff of Mech Tech', 'Hours of Mech Tech', 'Staff of Elec Tech', 'Hours of Elec Tech', 'Reported fault', 'Corrective action', 'Source state'];
  EQ.eqExport = function eqExport(kind, q) {
    const deny = EQ.access.srv('export.excel') || EQ.access.srv('eq.jobs.view'); if (deny) return deny;
    if (kind === 'daily') return { ok: true, columns: DAILY_COLUMNS, rows: dailyRows(q).map((j) => [j.date, j.jobNo, j.cwo, EQ.eq(j.equipmentId).code, j.equipmentText, j.eqType, j.dept, j.typeText, j.statusText, j.priority, j.created, j.desc, j.mechStaff, j.mechHours, j.elecStaff, j.elecHours, j.fault, j.corrective, j.sourceState]) };
    if (kind === 'spare') { const rows = spareRows(q); return { ok: true, columns: ['Equipment', 'Type', 'Main', 'Sub', 'Position', 'Spare-part type', 'Condition', 'Brand', 'Model/part no.', 'Serial', 'Replaced date', 'Expected life (months)', 'Next predicted replacement', 'Flag', 'Remarks'], rows: rows.map((r) => [r.eq.code, r.eq.typeCode, r.mainCode, r.subCode, r.pos.name, r.typeName, r.condition || 'Not recorded', r.brand || '', r.model || '', r.serial || '', r.replacedOn || '', r.lifeMonths == null ? '' : r.lifeMonths, r.predicted || r.why, r.flag || '', r.remarks]) }; }
    const jobs = EQ.state.D.jobs.filter((j) => eqList(q).some((e) => e.id === j.equipmentId));
    return { ok: true, columns: ['Number', 'Equipment', 'Kind', 'Title', 'Work status', 'Cancelled', 'Planned date', 'Completed date', 'Shown on dashboard / 3D'], rows: jobs.map((j) => [j.number, EQ.eq(j.equipmentId).code, j.kind, j.title, j.workStatus, j.isCancelled ? 'Yes' : '', j.plannedOn || '', j.completedOn || '', EQ.shownOnDashboard(j) ? 'Yes' : 'No']) }; // U1-C26: hidden jobs stay in the export
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

  // ---------------------------------------------------------------- page
  EQ.views.eqJobs = function eqJobs(part, id, q) {
    const S = EQ.state;
    if (part === 'special' && id) return EQ.views.job(id);
    if (!PARTS.some((p) => p[0] === part)) part = 'special';
    const page = h('div', { class: 'page eqjobs-page' });
    const setQ = (patch, p2) => EQ.nav('/eq/jobs/' + (p2 || part), { ...q, ...patch });
    const keepShared = Object.fromEntries(SHARED.filter((k) => q[k]).map((k) => [k, q[k]]));
    page.appendChild(h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'eyebrow' }, 'EQ'), h('h1', null, 'Jobs'),
      h('p', null, 'Special/Projects work entered by the EQ Team, the daily work read from ZMMS (CMMS.LK), the EQ status with its manual corrections, and the condition of major spare parts. Work history is kept here; the crane view shows only the current state.'))));
    page.appendChild(h('nav', { class: 'subtabs', 'aria-label': 'EQ Jobs parts' }, PARTS.map(([k, label]) => h('a', { href: '#/eq/jobs/' + k + (Object.keys(keepShared).length ? '?' + new URLSearchParams(keepShared).toString() : ''), 'aria-current': k === part ? 'page' : null, 'data-fk': 'jp-' + k }, label))));

    if (S.data === 'loading') { page.appendChild(h('div', { 'aria-busy': 'true', role: 'status', class: 'board' }, [1, 2, 3].map(() => h('div', { class: 'skeleton', style: 'height:16rem' })))); return page; }
    if (S.data === 'error') { page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'Jobs could not be loaded. '), 'Nothing is shown as completed or pending without data.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'))))); return page; }
    if (S.data === 'stale') page.appendChild(h('div', { class: 'notice warn', role: 'status', style: 'margin-bottom:.6rem' }, icon('wifi-off'), h('p', null, 'Showing last good data from ' + EQ.fmtTime(S.lastGoodAt) + '; the latest refresh failed.')));
    if (S.data === 'empty') { page.appendChild(h('div', { class: 'panel empty' }, icon('list'), h('h2', null, 'No jobs yet'), h('p', null, 'Jobs appear here once equipment is registered and the EQ Team creates work. History starts at go-live; earlier work can be entered manually with past business dates.'))); return page; }

    // shared filters
    const search = h('input', { type: 'search', id: 'jq', 'data-fk': 'jq', value: EQ.jobsUI.q, placeholder: 'Number, title, equipment or part', autocomplete: 'off' });
    search.addEventListener('input', () => { EQ.jobsUI.q = search.value; EQ.rerender(); });
    const selF = (id, label, key, options, any) => { const s = h('select', { id, 'data-fk': id, onChange: (e) => setQ({ [key]: e.target.value }) }, h('option', { value: '' }, any), options.map(([v, l]) => h('option', { value: v, selected: q[key] === v ? true : null }, l))); return h('div', { class: 'field' }, h('label', { for: id }, label), s); };
    page.appendChild(h('form', { class: 'panel filters', role: 'search', 'aria-label': 'Shared EQ Jobs filters', onSubmit: (e) => e.preventDefault() },
      selF('flt-eq', 'Equipment', 'equipment', S.D.equipment.map((e) => [e.id, e.code]), 'All equipment'),
      selF('flt-type', 'Type', 'type', [['QC', 'QC'], ['RTG', 'RTG'], ['ES', 'ES']], 'All types'),
      h('div', { class: 'field' }, h('label', { for: 'flt-from' }, 'From'), h('input', { type: 'date', id: 'flt-from', 'data-fk': 'flt-from', value: q.from || '', onChange: (e) => setQ({ from: e.target.value }) })),
      h('div', { class: 'field' }, h('label', { for: 'flt-to' }, 'To'), h('input', { type: 'date', id: 'flt-to', 'data-fk': 'flt-to', value: q.to || '', onChange: (e) => setQ({ to: e.target.value }) })),
      h('div', { class: 'field grow' }, h('label', { for: 'jq' }, 'Search'), search),
      h('button', { type: 'button', class: 'btn-sm', onClick: () => { EQ.jobsUI.q = ''; EQ.nav('/eq/jobs/' + part, {}); } }, 'Clear filters')));

    if (part === 'special') special(page, q, setQ);
    else if (part === 'daily') daily(page, q);
    else if (part === 'status') statusPart(page, q);
    else sparePart(page, q, setQ);
    return page;
  };

  // ---------------------------------------------------------------- tab 1: Special/Projects (manual, SOW V2 s4.3)
  function special(page, q, setQ) {
    const head = h('div', { class: 'row between', style: 'margin-bottom:.5rem' }, h('h2', null, 'Special jobs'), h('div', { class: 'row' },
      EQ.access.has('export.excel') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'export-special', onClick: () => { const r = EQ.eqExport('special', q); if (r.ok) { EQ.downloadCsv('eq-special-jobs.csv', r.columns, r.rows); EQ.toast('Exported ' + r.rows.length + ' special job(s)', 'Prototype stand-in: CSV, not the server-generated .xlsx.'); } } }, icon('download'), 'Export') : null,
      EQ.perm.write() ? h('button', { type: 'button', class: 'primary', 'data-fk': 'add-job', onClick: () => EQ.dlg.jobForm({ equipmentId: q.equipment || '' }) }, icon('plus'), 'Add special job') : h('span', { class: 'tag gold' }, 'Read-only: you cannot create or change special jobs')));
    page.appendChild(head);
    page.appendChild(h('p', { class: 'small muted', style: 'margin:0 0 .5rem' }, 'Major or non-routine work entered by hand, bound to one equipment and to the whole equipment, a main mechanism, a submechanism or a part. The daily work read from ZMMS is in the Daily work (CMMS) tab.'));
    // scoped history (Open in Jobs from the crane view)
    if (q.equipment && EQ.eq(q.equipment)) {
      const eq = EQ.eq(q.equipment);
      const sc = q.scope && q.target ? { level: q.scope, id: q.target } : { level: 'equipment', id: null };
      const valid = sc.level === 'equipment' || (sc.level === 'part' && EQ.pos(sc.id) && EQ.pos(sc.id).equipmentId === eq.id) || (sc.level === 'sub' && eq.subs.some((s) => s.id === sc.id)) || (sc.level === 'main' && eq.mains.some((m) => m.id === sc.id));
      if (q.scope) {
        if (!valid) page.appendChild(h('div', { class: 'notice warn', role: 'status' }, icon('alert'), h('p', null, 'The link selects a target that does not belong to ' + eq.code + ' (422 target_not_in_equipment). Showing the equipment only.')));
        else {
          const sel = sc.level === 'part' ? EQ.eqv.resolveSel(eq, { part: sc.id }) : sc.level === 'sub' ? EQ.eqv.resolveSel(eq, { sub: sc.id }) : EQ.eqv.resolveSel(eq, { main: sc.id });
          page.appendChild(h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'sh-h', style: 'margin-bottom:.8rem' },
            h('div', { class: 'row between' }, h('h2', { id: 'sh-h' }, 'History of ' + EQ.eqv.scopeLabel(eq, sel)), h('div', { class: 'row' },
              EQ.perm.write() && eq.lifecycle === 'active' ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-job-scope', onClick: () => EQ.dlg.jobForm({ equipmentId: eq.id, prefill: sel }) }, icon('plus'), 'Add special job here') : null,
              h('a', { class: 'btn btn-sm', href: '#/eq/jobs/special?' + new URLSearchParams({ ...Object.fromEntries(SHARED.filter((k) => q[k]).map((k) => [k, q[k]])), equipment: eq.id }).toString(), 'data-fk': 'clear-scope' }, icon('x'), 'Clear scope'))),
            EQ.eqv.historyTab(eq, sel, sc)));
        }
      }
    }
    page.appendChild(EQ.specialBoard(q));
  }

  // ---------------------------------------------------------------- tab 2: Daily work (CMMS), the read-only ZMMS daily jobs (SOW V2 s4.4)
  function daily(page, q) {
    const rows = dailyRows(q);
    const today = EQ.todayColombo();
    const range = q.from || q.to ? (q.from ? fmtD(q.from) : 'start') + ' to ' + (q.to ? fmtD(q.to) : 'today') : 'today only (' + fmtD(today) + ')';
    const fresh = EQ.zmms.freshness();
    page.appendChild(h('section', { class: 'panel panel-pad stack', id: 'daily', 'aria-labelledby': 'dj-h' },
      h('div', { class: 'row between' }, h('h2', { id: 'dj-h' }, 'Daily work from CMMS (ZMMS daily jobs, read-only)'),
        h('div', { class: 'row' }, h('span', { class: 'zmms-fresh' + (fresh.stale ? ' stale' : ''), 'data-fk': 'zmms-fresh' }, icon(fresh.stale ? 'alert' : 'sync'), EQ.zmms.freshLabel(), fresh.stale ? h('strong', null, ' · stale') : null),
          EQ.access.has('export.excel') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'export-daily', onClick: () => { const r = EQ.eqExport('daily', q); if (r.ok) { EQ.downloadCsv('zmms-daily-jobs.csv', r.columns, r.rows); EQ.toast('Exported ' + r.rows.length + ' daily job(s)', 'Prototype stand-in: CSV, not the server-generated .xlsx.'); } } }, icon('download'), 'Export') : null)),
      h('p', { class: 'small muted', style: 'margin:0' }, 'Showing ' + range + '. ' + rows.length + ' job(s). Daily work comes from the ZMMS (CMMS.LK) daily all-job list, read twice a day; it is never entered or changed in this app and is linked to the equipment only, never to a mechanism or part. Every synced day is kept: set From and To above to see earlier days. Unmatched equipment appears only in Admin > EQ > ZMMS.'),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Synthetic rows. The columns follow the real daily export profiled on 22 Oct 2026 (a file export, not the live page); the exact field list is fixed in P07B.')),
      fresh.stale ? h('div', { class: 'notice warn', role: 'status' }, icon('alert'), h('p', null, 'The latest ZMMS sync failed or is overdue. The previous data is kept unchanged and no status was changed.')) : null,
      rows.length ? dailyTable(rows) : h('div', { class: 'nonwork' }, h('strong', null, 'No ZMMS daily jobs for this selection'), 'Nothing matches the equipment, type, date range and search above. This is not evidence that no work was done.')));
  }
  function dailyTable(rows) {
    const staff = (a, b) => (a === '-' ? '-' : a + ' / ' + b + ' h');
    return h('div', { class: 'table-wrap daily-wrap' }, h('table', { class: 'daily-table' },
      h('caption', { class: 'sr-only' }, 'ZMMS daily jobs, read-only'),
      h('thead', null, h('tr', null, ['Date', 'Job ID', 'Equipment', 'Job type', 'Status', 'Priority', 'Description', 'Mech / Elec staff and hours'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, rows.slice(0, 150).map((j) => {
        const eq = EQ.eq(j.equipmentId);
        return h('tr', { class: j.sourceState === 'absentFromSource' ? 'inactive' : '', 'data-zjob': j.jobNo },
          h('td', null, fmtD(j.date)), h('th', { scope: 'row' }, h('span', { class: 'mono' }, j.jobNo), j.cwo && j.cwo !== '0' ? h('div', { class: 'small muted' }, 'CWO ' + j.cwo) : null),
          h('td', null, h('a', { href: '#/eq/equipment/' + eq.id }, eq.code), h('div', { class: 'small muted' }, j.equipmentText + ' · ' + j.eqType)),
          h('td', null, h('span', { class: 'tag' }, j.typeText)), h('td', null, h('span', { class: 'tag ' + (/completed/i.test(j.statusText) ? 'green' : /hold/i.test(j.statusText) ? 'red' : 'gold') }, j.statusText), j.sourceState === 'absentFromSource' ? h('div', { class: 'small' }, h('span', { class: 'tag dashed' }, 'No longer in the ZMMS list')) : null),
          h('td', null, j.priority),
          h('td', null, j.desc, h('details', { class: 'small' }, h('summary', null, 'More fields'), h('dl', { class: 'kv' }, [['Created', j.created], ['Department', j.dept], ['Reported fault', j.fault || '-'], ['Fault description', j.faultDesc || '-'], ['Corrective action', j.corrective || '-'], ['Work done summary', j.workDone || '-'], ['Job instruction', j.instruction || '-'], ['Status remarks', j.statusRemarks || '-']].map(([k, v]) => [h('dt', null, k), h('dd', null, v)])))),
          h('td', null, 'Mech ' + staff(j.mechStaff, j.mechHours), h('div', null, 'Elec ' + staff(j.elecStaff, j.elecHours))));
      }))));
  }

  // ---------------------------------------------------------------- tab 3: EQ status
  const SOURCE_LABEL = { automatic: 'Automatic (ZMMS sync)', overrideEnded: 'Correction ended (ZMMS sync)', backToAutomatic: 'Back to automatic', manualCorrection: 'Manual correction', manualStatus: 'Manual status' };
  function statusPart(page, q) {
    const list = eqList(q).filter((e) => e.lifecycle === 'active');
    const fresh = EQ.zmms.freshness();
    page.appendChild(h('div', { class: 'row between', style: 'margin:.2rem 0 .5rem' }, h('h2', null, 'EQ status board'), h('span', { class: 'zmms-fresh' + (fresh.stale ? ' stale' : '') }, icon(fresh.stale ? 'alert' : 'sync'), EQ.zmms.freshLabel(), fresh.stale ? h('strong', null, ' · stale') : null)));
    page.appendChild(h('div', { class: 'notice info' }, icon('info'), h('p', null, "After each ZMMS sync the status follows the day's plan: a breakdown job means Breakdown, a maintenance job means Maintenance, equipment not in the plan is Ready for OPS. An EQ Team correction needs a reason, shows Manual for the rest of the day, holds over the second sync and ends at the first successful sync of the next day, or earlier with Back to automatic. Equipment not linked to ZMMS keeps a manual status.")));
    page.appendChild(h('div', { class: 'panel table-wrap' }, h('table', { class: 'status-board' },
      h('caption', { class: 'sr-only' }, 'EQ status board, one row per active equipment'),
      h('thead', null, h('tr', null, ['Equipment', 'Status', 'Source', 'Since', 'Reason', 'Manual until', 'Causing ZMMS jobs', 'Actions'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, list.map((e) => {
        const m = EQ.zmms.mode(e);
        return h('tr', { 'data-eq': e.id },
          h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + e.id }, e.code)), h('td', null, EQ.statusBadge(e.status)),
          h('td', null, h('span', { class: 'src ' + (m.label === 'Auto' ? 'auto' : 'manual') }, m.label), h('div', { class: 'small muted' }, m.long)),
          h('td', null, e.statusSince ? EQ.fmtInstantShort(e.statusSince) : 'Never set'), h('td', null, e.statusReason || '-'),
          h('td', null, e.overrideOn ? fmtD(e.overrideOn) + (e.overrideOn >= EQ.todayColombo() ? ' (today)' : ' (expired)') : '-'),
          h('td', null, e.statusCauses && e.statusCauses.length && e.statusSource === 'zmms' ? [e.statusCauses.map((c) => h('span', { class: 'tag mono', style: 'margin-right:.2rem' }, c)), h('div', { class: 'small muted' }, 'Plan of ' + fmtD(e.statusPlanDate))] : EQ.zmms.causeText(e) || '-'),
          h('td', null, EQ.perm.write() ? h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'correct-' + e.id, onClick: () => EQ.dlg.status(e) }, e.zmmsMapped ? 'Correct...' : 'Update...'), e.zmmsMapped && e.overrideOn ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'auto-' + e.id, onClick: () => { const r = EQ.zmms.backToAutomatic(e.id); EQ.toast(r.ok ? e.code + ' is back to automatic' + (r.awaiting ? " (awaiting today's ZMMS sync)" : '') : r.message, 'Prototype: in memory only.'); } }, 'Back to automatic') : null) : h('span', { class: 'small muted' }, 'Read-only')));
      })))));
    // history across equipment
    const ids = new Set(eqList(q).map((e) => e.id));
    const from = q.from || '0000-01-01', to = q.to || '9999-12-31';
    const hist = EQ.state.D.statusChanges.filter((c) => ids.has(c.equipmentId) && EQ.todayOf(c.at) >= from && EQ.todayOf(c.at) <= to).sort((a, b) => EQ.cmp(b.at, a.at));
    page.appendChild(h('section', { class: 'panel panel-pad stack', style: 'margin-top:1rem', 'aria-labelledby': 'sth-h' },
      h('h2', { id: 'sth-h' }, 'Status history ', h('span', { class: 'tag' }, String(hist.length))),
      hist.length ? h('div', { class: 'table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Status changes with source'), h('thead', null, h('tr', null, ['When', 'Equipment', 'Change', 'Source', 'By', 'Reason', 'Causing ZMMS jobs'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, hist.map((c) => h('tr', { 'data-sc': c.id }, h('td', null, EQ.fmtInstantShort(c.at)), h('th', { scope: 'row' }, EQ.eq(c.equipmentId).code),
          h('td', null, c.prev ? EQ.STATUS[c.prev].label + ' → ' : 'First: ', EQ.statusBadge(c.status)),
          h('td', null, h('span', { class: 'src ' + (c.source === 'zmms' ? 'auto' : 'manual') }, c.source === 'zmms' ? 'ZMMS sync' + (c.runId ? ' #' + c.runId : '') : 'User'), h('div', { class: 'small muted' }, (SOURCE_LABEL[c.kind] || c.kind) + (c.planDate ? ' · plan of ' + fmtD(c.planDate) : ''))),
          h('td', null, c.source === 'zmms' ? 'System' : EQ.userName(c.by)), h('td', null, c.reason || '-'), h('td', null, c.causes && c.causes.length ? c.causes.join(', ') : c.source === 'zmms' && c.status === 'readyForOps' && c.planDate ? 'Not in the ZMMS plan for ' + fmtD(c.planDate) : '-')))))) : h('div', { class: 'nonwork' }, h('strong', null, 'No status changes in this selection'), 'Nothing is inferred from before tracking began.')));
  }
  EQ.todayOf = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date(iso));

  // ---------------------------------------------------------------- tab 4: spare parts condition
  const FLAGS = { overdue: ['Overdue', 'red'], dueSoon: ['Due soon', 'gold'] };
  const histOpen = new Set();
  function sparePart(page, q, setQ) {
    const rows = spareRows(q);
    const c = EQ.spares.counts(rows);
    const sc = scopeFromQ(q);
    page.appendChild(h('div', { class: 'row between', style: 'margin:.2rem 0 .5rem' }, h('h2', null, 'Major spare parts: condition register'), h('div', { class: 'row' },
      EQ.access.has('export.excel') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'export-spare', onClick: () => { const r = EQ.eqExport('spare', q); if (r.ok) { EQ.downloadCsv('spare-part-register.csv', r.columns, r.rows); EQ.toast('Exported ' + r.rows.length + ' register row(s)', 'Prototype stand-in: CSV, not the server-generated .xlsx.'); } } }, icon('download'), 'Export') : null,
      EQ.perm.write() ? h('button', { type: 'button', class: 'primary', 'data-fk': 'add-spare', onClick: () => addSpareDialog({ equipmentId: q.equipment || '', main: q.main || '', sub: q.sub || '', part: q.part || '' }) }, icon('plus'), 'Add spare part') : null)));
    page.appendChild(h('div', { class: 'row', role: 'group', 'aria-label': 'Register summary' },
      h('span', { class: 'tag' }, rows.length + ' registered'), h('span', { class: 'tag ' + (c.overdue ? 'red' : '') }, c.overdue + ' overdue'), h('span', { class: 'tag ' + (c.dueSoon ? 'gold' : '') }, c.dueSoon + ' due soon'),
      sc ? h('span', { class: 'tag dashed' }, 'Scoped to the selection from the crane view ', h('a', { href: '#/eq/jobs/spare-parts?' + new URLSearchParams(Object.fromEntries(SHARED.filter((k) => q[k]).map((k) => [k, q[k]]))).toString() }, 'clear')) : null,
      h('label', { class: 'field', style: 'display:flex;gap:.4rem;align-items:center;margin-left:auto' }, h('span', { class: 'label', style: 'margin:0' }, 'Flag'), h('select', { 'data-fk': 'flt-flag', 'aria-label': 'Filter by flag', onChange: (e) => setQ({ flag: e.target.value }) }, [['', 'All'], ['overdue', 'Overdue'], ['dueSoon', 'Due soon'], ['notRecorded', 'Condition not recorded']].map(([v, l]) => h('option', { value: v, selected: (q.flag || '') === v ? true : null }, l))))));
    page.appendChild(h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Next predicted replacement = replaced date + expected life in months; an Original part counts from the commissioning date. It is a calendar estimate, not a condition assessment. With an unknown date or life no prediction is shown. Due soon = within ' + EQ.state.D.spare.dueSoonDays + ' days (Admin setting).')));
    if (!rows.length) { page.appendChild(h('div', { class: 'panel empty' }, icon('cube'), h('p', null, 'No major spare parts match. ' + (EQ.perm.write() ? 'Use Add spare part to register one.' : 'The EQ Team or an Admin adds them.')))); return; }
    page.appendChild(h('div', { class: 'panel table-wrap' }, h('table', { class: 'spare-table' },
      h('caption', { class: 'sr-only' }, 'Spare-part condition register'),
      h('thead', null, h('tr', null, ['Equipment / part', 'Condition', 'Brand · model · serial', 'Replaced', 'Expected life', 'Next predicted replacement', 'Flag', 'Remarks', 'Actions'].map((c2) => h('th', { scope: 'col' }, c2)))),
      h('tbody', null, rows.flatMap((r) => {
        const open = histOpen.has(r.posId);
        const main = h('tr', { class: r.flag === 'overdue' ? 'overdue-row' : '', 'data-pos': r.posId },
          h('th', { scope: 'row' }, h('a', { href: '#/eq/equipment/' + r.equipmentId + '?main=' + r.pos.mainId + '&sub=' + r.pos.subId + '&part=' + r.posId + '&panel=spareParts' }, r.eq.code), h('div', null, r.pos.name), h('div', { class: 'small muted' }, r.typeName + ' · ' + r.mainCode + '/' + r.subCode)),
          h('td', null, r.condition ? h('span', { class: 'tag ' + (r.condition === 'replaced' ? 'green' : '') }, r.condition === 'replaced' ? 'Replaced' : 'Original') : h('span', { class: 'tag dashed' }, 'Not recorded')),
          h('td', null, r.condition ? [r.brand || 'Unknown brand', h('div', { class: 'small muted' }, (r.model || 'no part no.') + ' · ' + (r.serial || 'serial unknown'))] : '-'),
          h('td', null, r.replacedOn ? fmtD(r.replacedOn) : r.condition === 'original' ? 'Original' : '-'),
          h('td', null, r.lifeMonths != null ? r.lifeMonths + ' mo' : 'Not set', r.lifeSource === 'override' ? h('div', { class: 'small muted' }, 'equipment override') : null),
          h('td', null, r.predicted ? [fmtD(r.predicted), h('div', { class: 'small muted' }, r.daysTo < 0 ? Math.abs(r.daysTo) + ' d ago' : 'in ' + r.daysTo + ' d')] : h('span', { class: 'small muted' }, r.why)),
          h('td', null, r.flag ? h('span', { class: 'tag ' + FLAGS[r.flag][1] }, icon(r.flag === 'overdue' ? 'alert' : 'clock'), ' ' + FLAGS[r.flag][0]) : '-'),
          h('td', null, r.remarks || '-'),
          h('td', null, h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn-sm', 'aria-expanded': open ? 'true' : 'false', 'data-fk': 'hist-' + r.posId, onClick: () => { if (open) histOpen.delete(r.posId); else histOpen.add(r.posId); EQ.rerender(); } }, icon('history'), 'History'),
            EQ.perm.write() ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'cond-' + r.posId, onClick: () => spareDialog(r) }, icon('edit'), 'Update...') : null)));
        const out = [main];
        if (open) {
          const hist = EQ.spares.history(r.posId);
          out.push(h('tr', { class: 'hist-row' }, h('td', { colspan: 9 }, h('div', { class: 'stack' }, h('strong', null, 'History of ' + r.pos.name + ' (' + r.eq.code + ')'),
            hist.length ? h('ul', { class: 'tl' }, hist.map((x) => h('li', { class: 'status' }, h('div', { class: 'row between' }, h('strong', null, 'Revision ' + x.rev + ' · ' + ({ jobCompletion: 'Replacement special job completed', registerOriginal: 'Original recorded', registerReplacement: 'Replacement recorded', registerAmend: 'Current item amended', registerRemarks: 'Remarks edited', registerAdd: 'Added to the register', designation: 'Designation changed', correction: 'Admin correction' }[x.source] || x.source)), h('span', { class: 'when' }, EQ.fmtInstantShort(x.at) + ' by ' + EQ.userName(x.by))),
              x.before ? h('span', { class: 'small' }, 'Before: ', h('s', null, fmtState(x.before))) : h('span', { class: 'small muted' }, 'Before: nothing recorded'), h('span', { class: 'small' }, 'After: ', h('strong', null, fmtState(x.after))), x.reason ? h('span', { class: 'when' }, 'Reason: ' + x.reason) : null, x.jobId ? h('span', { class: 'when' }, 'Job: ', h('a', { href: '#/eq/jobs/special/' + x.jobId }, (EQ.job(x.jobId) || {}).number || x.jobId)) : null))) : h('div', { class: 'nonwork' }, h('strong', null, 'No history'), 'Nothing has been recorded for this part.')))));
        }
        return out;
      })))));
  }
  function fmtState(s) {
    if (!s) return 'removed';
    const des = s.typeId ? 'designated (' + (EQ.spares.typeOf(s.typeId) || {}).name + (s.lifeOverride != null ? ', ' + s.lifeOverride + ' months for this equipment' : ', part-type life') + ')' : null;
    if (des && !('condition' in s)) return des;
    return [des, s.condition ? s.condition : 'not recorded', s.replacedOn ? 'replaced ' + EQ.fmtDate(s.replacedOn) : null, s.brand, s.model, s.serial ? 'serial ' + s.serial : null, s.remarks ? 'remarks: ' + s.remarks : null].filter(Boolean).join(' · ');
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
          h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Adds a main-part position of one equipment to its major spare-part register and records its first condition; the entry starts its own history. EQ Team and Admin can add parts (U1-C21). Spare-part types and their default expected life are Admin settings; changing the type of an added part or removing it from the register is done by an Admin in Admin > EQ > Spare parts. Prototype: kept in memory only.')),
          h('div', { class: 'grid-2' },
            K.field('as-eq', 'Equipment', K.select(st, 'equipmentId', eqs.map((e) => ({ value: e.id, label: e.code })), () => { st.mainId = st.subId = st.posId = ''; st.cond = null; api.render(); }, 'Choose equipment'), { required: true }),
            K.field('as-main', 'Main mechanism', K.select(st, 'mainId', mains, () => { st.subId = st.posId = ''; st.cond = null; api.render(); }, eq ? 'All main mechanisms' : 'Choose equipment first'), { hint: 'Narrows the position list.' }),
            K.field('as-sub', 'Submechanism', K.select(st, 'subId', subs, () => { const s = eq && eq.subs.find((x) => x.id === st.subId); if (s) st.mainId = s.mainId; st.posId = ''; st.cond = null; api.render(); }, eq ? 'All submechanisms' : 'Choose equipment first'), {}),
            K.field('as-pos', 'Main-part position', K.select(st, 'posId', positions.map((p) => ({ value: p.id, label: p.name })), () => { const p = EQ.pos(st.posId); if (p) { st.mainId = p.mainId; st.subId = p.subId; } st.cond = null; api.render(); }, !eq ? 'Choose equipment first' : positions.length ? 'Choose a position' : 'No position left to add here'), { required: true, error: errors.posId, hint: eq ? 'Confirmed (active) positions of ' + eq.code + ' that are not yet in its register.' : null })),
          recorded ? h('div', { class: 'notice info', 'data-fk-note': 'recorded' }, icon('info'), h('p', null, 'Recorded at this position now: ' + recorded.installed.desc + (recorded.businessDate ? ', replaced ' + fmtD(recorded.businessDate) : ', original') + '. It cannot be recorded as Original again; keep it or record a replacement.')) : null,
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
