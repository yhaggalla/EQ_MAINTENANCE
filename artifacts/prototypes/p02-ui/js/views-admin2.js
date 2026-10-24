/* Admin shell for both sections (DATA_CONTRACT s6, s14-s17; SOW V2 s3.2, s4.4-s4.6, s5.7): EQ settings (the P02 sections plus spare-part
   selection and ZMMS mapping/health), FAC settings (master list, import preview, settings) and the Access matrix.
   SYNTHETIC: nothing is saved; no ZMMS connection exists; the import is previewed from the supplied reference JSON and cannot be confirmed here. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const K = () => EQ._dlg;
  const F = () => EQ.fac;
  const ui = (EQ.admin2UI = { draft: {}, reason: '', mlQ: '', mlDisc: '', mlShow: 30, impIssue: '', spareEq: 'eq-qc-demo-01', zmmsOut: 'succeeded', zmmsInject: false, accErr: null, accOk: null });
  const NAV = [
    ['eq', 'EQ settings', [['equipment', 'Equipment', 'list'], ['models', 'Models and applicability', 'cube'], ['catalog', 'Mechanism catalogue', 'tree'], ['positions', 'Main-part positions', 'wrench'], ['parameters', 'Specifications', 'file'], ['scene-bindings', 'Model bindings', 'gear'], ['spare-parts', 'Spare parts', 'cube'], ['zmms', 'ZMMS', 'sync']]],
    ['fac', 'FAC settings', [['master-list', 'Master job list', 'list'], ['import', 'Import preview', 'download'], ['settings', 'Lists and settings', 'sliders']]],
    ['access', 'Access', [['', 'Access matrix', 'lock']]],
  ];

  EQ.views.admin = function admin(area, section, q) {
    if (!['eq', 'fac', 'access'].includes(area)) area = 'eq';
    const page = h('div', { class: 'page' });
    page.appendChild(h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'eyebrow' }, 'EQ & FAC Maintenance Admin'), h('h1', null, 'Administration'), h('p', null, "Manage EQ, FAC and feature access here. User accounts and roles are managed in ENG Portal."))));
    const groups = NAV;
    const defaults = { eq: 'equipment', fac: 'master-list', access: '' };
    const items = (groups.find((g) => g[0] === area)[2]);
    const sec = items.some((x) => x[0] === section) ? section : defaults[area];
    let content;
    if (area === 'eq') content = ['spare-parts', 'zmms'].includes(sec) ? (sec === 'zmms' ? zmmsSection(q) : spareSection(q)) : EQ.adminEq.build(sec, q);
    else if (area === 'fac') content = sec === 'import' ? importSection() : sec === 'settings' ? facSettings() : masterList();
    else content = accessSection();
    const z = EQ.zmms.freshness();
    if (z.stale && area === 'eq') page.appendChild(h('div', { class: 'notice warn', role: 'status', 'data-fk': 'zmms-banner' }, icon('alert'), h('p', null, h('strong', null, 'ZMMS sync warning. '), 'The latest sync ' + (z.latestOutcome === 'failed' ? 'failed (' + z.failureCode + ')' : 'is overdue') + '. The previous daily jobs and every status are unchanged. See EQ settings > ZMMS.')));
    page.appendChild(h('div', { class: 'admin-layout' },
      h('nav', { class: 'panel subnav', 'aria-label': 'Admin sections' }, groups.flatMap(([a, label, list]) => [h('h2', { class: 'subnav-h' }, label), ...list.map(([k, l, ic]) => h('a', { href: '#/admin/' + a + (k ? '/' + k : ''), 'aria-current': a === area && k === sec ? 'page' : null, 'data-fk': 'an-' + a + (k ? '-' + k : '') }, icon(ic), l))])),
      h('div', { class: 'stack', style: 'min-width:0' }, content)));
    return page;
  };

  // ---------------------------------------------------------------- Access matrix
  function accessSection() {
    const A = EQ.state.D.access;
    const roles = ['admin', 'management', 'eqTeam', 'facTeam'];
    const head = h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Feature'), roles.map((r) => h('th', { scope: 'col' }, EQ.access.ROLES[r]))));
    const body = h('tbody', null, EQ.access.FEATURES.map(([f, label]) => h('tr', null,
      h('th', { scope: 'row' }, label, h('div', { class: 'small muted mono' }, f)),
      roles.map((r) => {
        const c = EQ.access.cell(r, f);
        if (c.kind === 'fixed') return h('td', { class: 'mx-fixed' }, h('span', { class: 'tag green' }, icon('lock'), ' Always'));
        if (c.kind === 'no') return h('td', { class: 'mx-no' }, h('span', { class: 'tag dashed', 'aria-label': EQ.access.ROLES[r] + ': ' + label + ': not allowed, above the role ceiling' }, 'Not allowed'));
        const dk = r + '|' + f; const on = Object.prototype.hasOwnProperty.call(ui.draft, dk) ? ui.draft[dk] : c.on;
        return h('td', { class: 'mx-toggle' }, h('label', { class: 'check mx-sw' }, h('input', { type: 'checkbox', 'data-switch': '1', checked: on ? true : null, 'data-fk': 'mx-' + r + '-' + f, 'aria-label': EQ.access.ROLES[r] + ': ' + label, onChange: (e) => { ui.draft[dk] = e.target.checked; if (ui.draft[dk] === c.on) delete ui.draft[dk]; ui.accErr = null; ui.accOk = null; EQ.rerender(); } }), on ? 'On' : 'Off'), c.on !== on ? h('div', { class: 'small' }, h('span', { class: 'tag gold' }, 'unsaved')) : null);
      }))));
    const pending = Object.keys(ui.draft).length;
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'Access matrix'), h('span', { class: 'tag' }, 'Version ' + A.version)),
      h('div', { class: 'notice info' }, icon('info'), h('div', { class: 'stack', style: 'gap:.3rem' }, h('p', null, h('strong', null, "Always: "), "Required by the Portal role; cannot be switched off."), h('p', null, h('strong', null, "Not allowed: "), "Outside the Portal role; cannot be switched on."), h('p', null, h('strong', null, "On/Off: "), "Applies to the entire role, not individual users."), h('p', null, h('strong', null, "Changes: "), "Logged and applied within 60 seconds. Disabled access also blocks direct links, exports and photos."))),
      h('div', { class: 'panel table-wrap matrix-wrap' }, h('table', { class: 'access-matrix' }, h('caption', { class: 'sr-only' }, 'Access matrix: features by role'), head, body)),
      ui.accErr ? h('div', { class: 'err-summary', role: 'alert', 'data-fk': 'acc-err' }, h('strong', null, ui.accErr)) : null, ui.accOk ? h('div', { class: 'notice ok', role: 'status' }, icon('check-circle'), h('p', null, ui.accOk)) : null,
      h('div', { class: 'row' }, h('div', { class: 'field grow', style: 'min-width:16rem' }, h('label', { for: 'acc-reason' }, 'Reason (optional)'), h('input', { id: 'acc-reason', 'data-fk': 'acc-reason', type: 'text', value: ui.reason, maxlength: 500, onInput: (e) => { ui.reason = e.target.value; } })),
        h('button', { type: 'button', class: 'primary', 'data-fk': 'acc-save', disabled: pending ? null : true, onClick: () => {
          const changes = Object.entries(ui.draft).map(([k, on]) => { const [role, ...f] = k.split('|'); return { role, feature: f.join('|'), on }; });
          const r = EQ.access.save(changes, A.version, ui.reason);
          if (r.ok) { ui.draft = {}; ui.reason = ''; ui.accErr = null; ui.accOk = 'Saved ' + r.changed + ' change(s) as version ' + r.version + '. Affected users see it at their next session read (within 60 seconds).'; } else { ui.accErr = r.message; EQ.toast(r.message); }
          EQ.rerender();
        } }, 'Save ' + (pending ? pending + ' change(s)' : 'changes')),
        h('button', { type: 'button', 'data-fk': 'acc-discard', disabled: pending ? null : true, onClick: () => { ui.draft = {}; ui.accErr = null; ui.accOk = null; EQ.rerender(); } }, 'Discard')),
      h('details', { class: 'panel panel-pad' }, h('summary', { 'data-fk': 'acc-try' }, 'Check the ceiling: try changes the server must refuse'),
        h('p', { class: 'small muted' }, 'Each button sends one change that is above a ceiling or fixed. The server refuses it as a whole (422 access_cell_not_toggleable) and nothing is stored.'),
        h('div', { class: 'row' }, [['management', 'eq.work', 'Management write right on EQ'], ['facTeam', 'eq.work', 'FAC Team write right on EQ'], ['eqTeam', 'fac.work', 'EQ Team write right on FAC'], ['facTeam', 'admin.access', 'FAC Team Admin pages'], ['admin', 'admin.access', 'Switch off an Admin right']].map(([role, feature, label]) => h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'try-' + role + '-' + feature, onClick: () => { const r = EQ.access.save([{ role, feature, on: role !== 'admin' }], A.version, 'ceiling check'); ui.accErr = r.ok ? 'Unexpected: the server accepted it.' : '422 refused: ' + r.message; EQ.rerender(); } }, label)))),
      h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'acl-h' }, h('h2', { id: 'acl-h' }, 'Change log ', h('span', { class: 'tag' }, String(A.changes.length))),
        A.changes.length ? h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Version', 'When', 'By', 'Role', 'Feature', 'Change', 'Reason'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, A.changes.map((c) => h('tr', null, h('td', null, String(c.version)), h('td', null, EQ.fmtInstantShort(c.at)), h('td', null, EQ.userName(c.by)), h('td', null, EQ.access.ROLES[c.role]), h('td', { class: 'mono' }, c.feature), h('td', null, (c.oldOn ? 'On' : 'Off') + ' → ' + (c.newOn ? 'On' : 'Off')), h('td', null, c.reason || '-')))))) : h('p', { class: 'small muted', style: 'margin:0' }, 'No change yet: every toggle is at its default.')));
  }

  // ---------------------------------------------------------------- FAC master list
  function masterList() {
    const jobs = EQ.state.D.fac.jobs;
    const canManage = EQ.access.has('fac.masterList.manage');
    const needle = ui.mlQ.toLowerCase();
    const list = jobs.filter((j) => (!ui.mlDisc || j.discipline === ui.mlDisc) && (!needle || (j.name + ' ' + j.number + ' ' + (j.sourceRow || '')).toLowerCase().includes(needle)));
    const search = h('input', { type: 'search', id: 'ml-q', 'data-fk': 'ml-q', value: ui.mlQ, placeholder: 'Job, number or sheet row', autocomplete: 'off', onInput: (e) => { ui.mlQ = e.target.value; ui.mlShow = 30; EQ.rerender(); } });
    const cnt = (d) => jobs.filter((j) => j.discipline === d).length;
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'FAC master job list'), canManage ? h('button', { type: 'button', class: 'primary', 'data-fk': 'ml-add', onClick: () => EQ.dlg.facJobForm({ kind: 'recurring' }) }, icon('plus'), 'Add job') : null),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, jobs.length + ' jobs loaded from the supplied sheet (Electrical ' + cnt('electrical') + ', Mechanical ' + cnt('mechanical') + ', Civil ' + cnt('civil') + '; ' + jobs.filter((j) => j.split != null).length + " jobs came from two-frequency rows). Deactivate jobs instead of deleting them. Due dates, status and completion percentages are calculated. Prototype changes are not saved.")),
      h('div', { class: 'panel filters' }, h('div', { class: 'field' }, h('label', { for: 'ml-d' }, 'Discipline'), h('select', { id: 'ml-d', 'data-fk': 'ml-d', onChange: (e) => { ui.mlDisc = e.target.value; ui.mlShow = 30; EQ.rerender(); } }, h('option', { value: '' }, 'All'), Object.entries(F().DISC_NAME).map(([v, l]) => h('option', { value: v, selected: ui.mlDisc === v ? true : null }, l)))), h('div', { class: 'field grow' }, h('label', { for: 'ml-q' }, 'Search'), search)),
      h('div', { class: 'panel table-wrap' }, h('table', { class: 'fac-list' }, h('caption', { class: 'sr-only' }, 'FAC master job list'),
        h('thead', null, h('tr', null, ['Number / row', 'Job', 'Discipline', 'Type', 'Frequency', 'Qty', 'Kind', 'PIC', 'In/Out', 'Last done', 'State', 'Actions'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, list.slice(0, ui.mlShow).map((j) => h('tr', { class: j.state !== 'active' ? 'inactive' : '', 'data-job': j.id },
          h('td', null, h('span', { class: 'mono' }, j.number), h('div', { class: 'small muted' }, j.sourceRow ? 'row ' + j.sourceRow + (j.split != null ? '.' + (j.split + 1) : '') : 'app')), h('th', { scope: 'row' }, h('a', { href: '#/fac/jobs/' + j.id }, j.name), j.issues.length ? h('div', { class: 'small muted' }, j.issues.map((i) => i.replace(/-/g, ' ')).join('; ')) : null),
          h('td', null, F().DISC_NAME[j.discipline]), h('td', null, F().TYPE_NAME[j.typeCode]), h('td', null, F().freqLabel(j)), h('td', null, String(j.quantity)), h('td', null, F().KIND_NAME[j.kind]), h('td', null, F().picDisplay(j)), h('td', null, j.mode ? F().MODE_NAME[j.mode] : '-'), h('td', null, j.lastDoneOn ? EQ.fmtDate(j.lastDoneOn) : '-'), h('td', null, j.state),
          h('td', null, canManage ? h('div', { class: 'row' }, j.state === 'active' ? [h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.facJobForm({ job: j }) }, 'Edit'), h('button', { type: 'button', class: 'btn-sm danger-btn', onClick: () => EQ.dlg.reason({ title: 'Deactivate ' + j.number, message: 'A deactivated job keeps its cycles, timeline and photos and accepts no update until it is reactivated.', confirm: 'Deactivate', danger: true, onSubmit: (r) => F().api.deactivate(j.id, r) }) }, 'Deactivate')] : h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = F().api.reactivate(j.id); EQ.toast(r.ok ? 'Reactivated ' + j.number : r.message); } }, 'Reactivate')) : '-'))))),
        list.length > ui.mlShow ? h('div', { class: 'panel-pad' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => { ui.mlShow += 40; EQ.rerender(); } }, 'Show 40 more (' + (list.length - ui.mlShow) + ' hidden)')) : null));
  }

  // ---------------------------------------------------------------- FAC import preview
  const ISSUE_TEXT = { 'no-last-done-date': 'No last done date: imported with no due date until the first completion or an Admin-entered date', 'quantity-blank-import-as-1': 'Quantity blank in the sheet: imported as 1, Admin corrects', 'split-from-multi-frequency-row': 'Two frequencies in one row: imported as two jobs', 'frequency-missing-or-unparsed': 'Frequency blank or not understood: "Frequency not set", needs a frequency from you', 'replacement-character-in-text': 'Broken character in the text: corrected on import', 'sheet-next-date-ignored': 'Sheet next date ignored: recalculated from the recorded completions', 'completed-quantity-at-target-on-pending-row': 'Completed quantity equals the job quantity on a Pending row: opens In progress awaiting confirmation' };
  const KNOWN_HANDLING = { 55: 'Needs frequency from you', 57: 'Needs frequency from you', 21: 'Needs the breakdown from you', 80: 'Recalculated as quarterly; confirm', 82: 'Recalculated as quarterly; confirm', 12: 'Shows Overdue after import unless a newer date is given', 14: 'Imported On hold with the remark; confirm the completed quantity', 35: 'Imported separately; confirm or merge', 50: 'Imported separately; confirm or merge', 38: 'Imported separately; confirm or merge', 39: 'Imported separately; confirm or merge' };
  function hashOf(str) { let x = 0x811c9dc5; for (let i = 0; i < str.length; i += 1) { x ^= str.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x.toString(16).padStart(8, '0'); }
  EQ.facImportPreview = function facImportPreview() {
    const REF = EQ.FAC_REF; const jobs = REF.jobs;
    const server = {};
    const add = (k, row) => { (server[k] = server[k] || []).push(row); };
    jobs.forEach((j) => { if ((j.name || '').includes('�') || (j.frequencyText || '').includes('�')) add('replacement-character-in-text', j.sourceRow); if (j.sheetNextDate) add('sheet-next-date-ignored', j.sourceRow); if (j.sheetStatus === 'Pending' && j.sheetCompletedQty >= j.importQuantity && j.sheetCompletedQty > 0) add('completed-quantity-at-target-on-pending-row', j.sourceRow); });
    const byIssue = {};
    jobs.forEach((j) => j.issues.forEach((i) => { (byIssue[i] = byIssue[i] || []).push(j.sourceRow + (j.splitIndex != null ? '.' + (j.splitIndex + 1) : '')); }));
    Object.entries(server).forEach(([k, rows]) => { byIssue[k] = [...new Set(rows)]; });
    const opening = { pending: 0, inProgress: 0, onHold: 0, withDue: 0 };
    jobs.forEach((j) => { if (j.sheetStatus === 'Pending' && j.sheetCompletedQty > 0) opening.inProgress += 1; if (j.sourceRow === 14 && j.remarks) opening.onHold += 1; if (j.lastDone && j.frequencyCode && !['running-hours', 'as-required'].includes(j.frequencyCode) && j.kind === 'recurring') opening.withDue += 1; });
    opening.pending = jobs.length - opening.inProgress - opening.onHold;
    const count = (f) => { const m = {}; jobs.forEach((j) => { const k = f(j); m[k] = (m[k] || 0) + 1; }); return m; };
    return { sheetRows: REF.counts.sheetRows, importJobs: REF.counts.importJobs, sha: REF.sourceSha256, disc: count((j) => j.discipline), type: count((j) => j.type), freq: count((j) => j.frequencyText || '(blank)'), kind: count((j) => j.kind), byIssue, known: REF.knownSourceIssues, opening, previewHash: hashOf(JSON.stringify(jobs.map((j) => [j.sourceRow, j.splitIndex, j.name, j.frequencyCode, j.importQuantity, j.lastDone]))) };
  };
  /** Every import row as it would be saved (SOW V2 5.7): quantity default, calculated first due date, opening state and the issues found. */
  function rowByRow() {
    const FQ = EQ.state.D.fac.frequencies, FD = F().date;
    const rows = EQ.FAC_REF.jobs.map((r) => {
      const f = FQ.find((x) => x.code === r.frequencyCode);
      const due = r.kind === 'recurring' && f && f.kind === 'interval' && r.lastDone ? (f.intervalMonths ? FD.addMonths(r.lastDone, f.intervalMonths) : FD.addDays(r.lastDone, f.intervalDays)) : null;
      const opening = r.sourceRow === 14 && r.remarks ? 'On hold: ' + r.remarks : r.sheetStatus === 'Pending' && r.sheetCompletedQty > 0 ? 'In progress, ' + Math.min(r.sheetCompletedQty, r.importQuantity) + ' of ' + r.importQuantity + ' done' : 'Pending';
      return { r, f, due, opening };
    });
    const dt = (iso) => (iso ? EQ.fmtDate(iso) : 'blank');
    return h('details', { class: 'panel panel-pad stack imp-rows', id: 'imp-rows' }, h('summary', { 'data-fk': 'imp-rows-summary' }, 'How each of the ' + rows.length + ' jobs will be saved (' + EQ.FAC_REF.counts.sheetRows + ' sheet rows; blank values stay blank, calculated values are not typed)'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'imp-row-table' }, h('caption', { class: 'sr-only' }, 'Import rows as they will be saved'),
        h('thead', null, h('tr', null, ['Sheet row', 'Job', 'Discipline', 'Type', 'Frequency', 'Quantity', 'Kind', 'PIC', 'In/Out', 'Last done', 'First due (calculated)', 'Opening state', 'Issues'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, rows.map(({ r, f, due, opening }) => h('tr', { 'data-row': r.sourceRow + (r.splitIndex != null ? '.' + (r.splitIndex + 1) : '') },
          h('td', null, r.sourceRow + (r.splitIndex != null ? '.' + (r.splitIndex + 1) : '')), h('th', { scope: 'row' }, (r.name || '').replace(/\uFFFD/g, '-')), h('td', null, r.discipline), h('td', null, r.type), h('td', null, f ? f.label : 'not set'),
          h('td', null, String(r.importQuantity) + (r.quantity == null ? ' (blank in sheet)' : '')), h('td', null, r.kind), h('td', null, r.pic || 'blank'), h('td', null, r.mode || 'blank'), h('td', null, dt(r.lastDone)), h('td', null, due ? EQ.fmtDate(due) : 'none'), h('td', null, opening),
          h('td', null, (r.issues || []).map((i) => ISSUE_TEXT[i] ? i.replace(/-/g, ' ') : i).join('; ') || '-')))))));
  }
  function importSection() {
    const P = EQ.facImportPreview();
    const D = EQ.state.D.fac;
    const locked = D.jobs.some((j) => j.updates.some((u) => u.kind !== 'importOpening' && (u.state === 'active' || u.state === 'undone')));
    const issueKeys = Object.keys(P.byIssue);
    const tile = (n, l) => h('div', { class: 'kpi static' }, h('span', { class: 'k-n' }, String(n)), h('span', { class: 'k-l' }, l));
    return h('div', { class: 'stack' },
      h('div', { class: 'row between' }, h('h2', null, 'FAC master-list import: preview'), h('span', { class: 'tag dashed' }, 'Nothing is saved before Admin confirms')),
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Source: supplied facility job sheet. File fingerprint: ', h('span', { class: 'mono' }, P.sha.slice(0, 16) + '...'), '. Re-import is allowed only before progress is recorded on an imported job.')),
      h('div', { class: 'kpis kpis-sm', role: 'group', 'aria-label': 'Preview counts' }, tile(P.sheetRows, 'sheet rows'), tile(P.importJobs, 'jobs to create'), tile(P.disc.Electrical, 'Electrical'), tile(P.disc.Mechanical, 'Mechanical'), tile(P.disc.Civil, 'Civil'), tile(P.type.Inspection, 'Inspection'), tile(P.type.Service, 'Service')),
      h('div', { class: 'stack small', style: 'gap:.3rem' },
        h('p', null, h('strong', null, 'Starting counts: '), P.opening.pending + ' Pending · ' + P.opening.inProgress + ' In progress · ' + P.opening.onHold + ' On hold.'),
        h('p', null, h('strong', null, 'Pending due dates: '), P.opening.withDue + ' calculated from last completion + interval. Others have no due date.'),
        h('p', null, h('strong', null, 'Source values: '), 'Progress uses the sheet quantity; held jobs keep their notes. Status, percentages and next dates are recalculated.')),
      h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'imp-i' }, h('h3', { id: 'imp-i' }, 'Issues found, by type'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'imp-issues' }, h('caption', { class: 'sr-only' }, 'Import issues by type with sheet rows'), h('thead', null, h('tr', null, ['Issue', 'Jobs', 'How it will be saved', 'Sheet rows'].map((c) => h('th', { scope: 'col' }, c)))),
          h('tbody', null, issueKeys.map((k) => h('tr', { 'data-issue': k }, h('th', { scope: 'row', class: 'mono' }, k), h('td', null, String(P.byIssue[k].length)), h('td', null, ISSUE_TEXT[k] || k), h('td', { class: 'rows' }, P.byIssue[k].join(', ')))))))),
      h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'imp-k' }, h('h3', { id: 'imp-k' }, 'Points found in the source sheet (confirm with the owner)'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'imp-known' }, h('caption', { class: 'sr-only' }, 'Known source issues'), h('thead', null, h('tr', null, ['Sheet rows', 'Finding', 'Proposed handling'].map((c) => h('th', { scope: 'col' }, c)))),
          h('tbody', null, P.known.map((k) => h('tr', null, h('td', null, k.rows.join(', ')), h('th', { scope: 'row' }, k.issue), h('td', null, [...new Set(k.rows.map((r) => KNOWN_HANDLING[r]))].filter(Boolean).join('; ')))))))),
      rowByRow(),
      h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'imp-f' }, h('h3', { id: 'imp-f' }, 'Frequencies in the sheet'), h('div', { class: 'row' }, Object.entries(P.freq).sort((a, b) => b[1] - a[1]).map(([f, n]) => h('span', { class: 'tag' }, f + ': ' + n)))),
      h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'Preview hash (simulated): ', h('span', { class: 'mono' }, P.previewHash)),
        h('button', { type: 'button', class: 'primary', 'data-fk': 'imp-confirm', onClick: () => EQ.dlg.reason({ title: 'Confirm the FAC master-list import', message: locked ? 'This is a re-run. Progress has already been recorded on imported jobs, so the server refuses it (409 import_locked_by_progress).' : 'Confirm creates ' + P.importJobs + ' jobs in one transaction. Prototype: nothing is saved; the jobs are already loaded as the synthetic fixture.', label: 'Note (optional)', confirm: 'Confirm import', onSubmit: () => (locked ? { ok: false, status: 409, code: 'import_locked_by_progress', message: "Import locked: progress already exists on imported jobs. Re-import would overwrite their starting state. Preview is still available." } : { ok: true }) }) }, 'Confirm import...')),
      locked ? h('div', { class: 'notice warn' }, icon('lock'), h('p', null, 'Re-run lock active: synthetic progress exists on imported jobs, so a confirm is refused. Preview still works.')) : null);
  }

  // ---------------------------------------------------------------- FAC settings
  function facSettings() {
    const s = EQ.state.D.fac.settings; const st = { dueSoonDays: s.dueSoonDays, refreshSeconds: s.refreshSeconds, scrollPxPerSec: s.scrollPxPerSec }; let err = {};
    const num = (id, label, key, min, max, hint) => h('div', { class: 'field' }, h('label', { for: id }, label), h('input', { id, 'data-fk': id, type: 'number', min, max, value: st[key], onInput: (e) => { st[key] = e.target.value; } }), h('div', { class: 'hint' }, hint));
    const form = h('form', { class: 'panel panel-pad stack', onSubmit: (e) => { e.preventDefault(); const r = EQ.fac.api.saveSettings(st); if (r.ok) EQ.toast('FAC settings saved', 'The dashboard picks up the new speed at once. Prototype: in memory only.'); else { err = r.fields; EQ.toast(r.message); } EQ.rerender(); } },
      h('h3', null, 'Dashboard and due dates'),
      h('div', { class: 'grid-2' }, num('fs-due', 'Due-soon window (days)', 'dueSoonDays', 1, 60, '1 to 60. Default 7.'), num('fs-ref', 'Dashboard refresh (seconds)', 'refreshSeconds', 30, 600, '30 to 600. Default 60.'), num('fs-spd', 'Dashboard scroll speed (pixels per second)', 'scrollPxPerSec', 5, 80, '5 to 80. Default 20: about one row every four seconds.'), h('div', { class: 'field' }, h('span', { class: 'label' }, 'Reduced-motion page flip'), h('div', { class: 'small muted' }, 'Fixed at 8 seconds (SOW V2 5.5), not a setting.'))),
      Object.keys(err).length ? h('div', { class: 'err-summary', role: 'alert' }, Object.values(err).join(' ')) : null,
      h('div', { class: 'row' }, h('button', { type: 'submit', class: 'primary', 'data-fk': 'fs-save' }, 'Save settings')));
    const fr = EQ.state.D.fac.frequencies;
    return h('div', { class: 'stack' }, h('h2', null, 'FAC lists and settings'), form,
      h('section', { class: 'panel panel-pad stack' }, h('h3', null, 'Frequencies and their intervals'), h('div', { class: 'stack small muted', style: 'gap:.3rem;margin:0' }, h('p', null, h('strong', null, "Intervals: "), "Tri-annually: every 4 months. Bi-annually: every 6 months."), h('p', null, h('strong', null, "Changes: "), "New intervals apply only to cycles opened afterwards."), h('p', null, h('strong', null, "Next due: "), "Last completion + interval. Monthly and longer intervals use calendar months.")),
        h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Frequency', 'Interval', 'Cycle basis', 'Kind'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, fr.map((f) => h('tr', null, h('th', { scope: 'row' }, f.label), h('td', null, f.intervalMonths ? f.intervalMonths + ' month(s)' : f.intervalDays ? f.intervalDays + ' day(s)' : 'No automatic date'), h('td', null, f.basis === 'period' ? 'Period (day / Monday-Sunday week)' : 'Rolling (from the completion date)'), h('td', null, f.kind))))))),
      h('section', { class: 'panel panel-pad stack' }, h('h3', null, 'Disciplines and types'), h('div', { class: 'row' }, Object.values(F().DISC_NAME).map((n) => h('span', { class: 'tag' }, n)), Object.values(F().TYPE_NAME).map((n) => h('span', { class: 'tag gold' }, n))), h('p', { class: 'small muted', style: 'margin:0' }, 'Admin can add disciplines (a new lane appears on the dashboard). Adding is not simulated in this prototype.')));
  }

  // ---------------------------------------------------------------- ZMMS (EQ settings)
  function zmmsSection(q) {
    const z = EQ.state.D.zmms; const f = EQ.zmms.freshness();
    const set = { sync1: z.settings.sync1, sync2: z.settings.sync2, staleAfterHours: z.settings.staleAfterHours };
    let err = {};
    const timeForm = h('form', { class: 'panel panel-pad stack', onSubmit: (e) => { e.preventDefault(); const r = EQ.zmms.saveSettings(set); EQ.toast(r.ok ? 'Sync times saved' : r.message, r.ok ? 'Prototype: in memory only.' : null); EQ.rerender(); } },
      h('h3', null, 'Sync times (Asia/Colombo)'), h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'zs-1' }, 'First sync'), h('input', { id: 'zs-1', 'data-fk': 'zs-1', type: 'time', value: set.sync1, onInput: (e) => { set.sync1 = e.target.value; } })), h('div', { class: 'field' }, h('label', { for: 'zs-2' }, 'Second sync'), h('input', { id: 'zs-2', 'data-fk': 'zs-2', type: 'time', value: set.sync2, onInput: (e) => { set.sync2 = e.target.value; } })),
        h('div', { class: 'field' }, h('label', { for: 'zs-3' }, 'Mark data stale after (hours)'), h('input', { id: 'zs-3', 'data-fk': 'zs-3', type: 'number', min: 1, max: 168, value: set.staleAfterHours, onInput: (e) => { set.staleAfterHours = Number(e.target.value); } }))),
      h('div', { class: 'row' }, h('button', { type: 'submit', class: 'primary', 'data-fk': 'zs-save' }, 'Save times')));
    const sim = { outcome: ui.zmmsOut, inject: ui.zmmsInject };
    const syncBox = h('section', { class: 'panel panel-pad stack' }, h('h3', null, 'Sync now (read-only; the app never writes to ZMMS)'),
      h('div', { class: 'notice warn' }, icon('alert'), h('p', null, "Simulation only: no ZMMS connection or account. Failed/partial syncs change nothing. Successful syncs save the day and update automatic status.")),
      h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'zs-out' }, 'Simulated outcome'), h('select', { id: 'zs-out', 'data-fk': 'zs-out', onChange: (e) => { ui.zmmsOut = e.target.value; } }, [['succeeded', 'Run succeeds'], ['login_failed', 'Fails: login rejected'], ['layout_changed', 'Fails: page layout changed'], ['timeout', 'Fails: timeout'], ['http_error', 'Fails: HTTP 503']].map(([v, l]) => h('option', { value: v, selected: ui.zmmsOut === v ? true : null }, l)))),
        h('label', { class: 'check', style: 'align-self:end;min-height:2.5rem' }, h('input', { type: 'checkbox', checked: ui.zmmsInject ? true : null, 'data-fk': 'zs-inject', onChange: (e) => { ui.zmmsInject = e.target.checked; } }), 'The page now also lists a BreakDown job for QC901 (QC-DEMO-02)')),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'primary', 'data-fk': 'zs-sync', onClick: () => { const r = EQ.zmms.syncNow({ outcome: ui.zmmsOut, inject: ui.zmmsInject ? [{ equipmentText: 'QC902', type: 'BreakDown', status: 'Initialized', desc: 'Injected breakdown job (synthetic simulation)' }] : [] }); EQ.toast(r.ok ? (r.changedNothing ? 'Run failed: ' + ui.zmmsOut + '. Previous data and every status kept.' : 'Run #' + r.run.id + ' succeeded: ' + r.run.applied + ' status change(s)') : r.message); } }, icon('sync'), 'Sync now')));
    const runs = h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'zr-h' }, h('h3', { id: 'zr-h' }, 'Recent runs'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'zruns' }, h('caption', { class: 'sr-only' }, 'ZMMS sync runs'), h('thead', null, h('tr', null, ['Run', 'Trigger', 'Ended', 'Outcome', 'Pages / rows', 'New / upd / absent', 'Evaluated / applied / not applied'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, z.runs.slice(0, 10).map((r) => h('tr', { class: r.outcome === 'failed' ? 'failed-run' : '', 'data-run': r.id }, h('th', { scope: 'row' }, '#' + r.id + (r.retryOf ? ' (retry of #' + r.retryOf + ')' : '')), h('td', null, r.trigger), h('td', null, EQ.fmtInstantShort(r.endedUtc)),
          h('td', null, r.outcome === 'succeeded' ? h('span', { class: 'tag green' }, 'Succeeded') : h('span', { class: 'tag red' }, 'Failed'), r.failureDetail ? h('div', { class: 'small' }, r.failureDetail) : null), h('td', null, r.pagesRead + ' / ' + r.rowsRead), h('td', null, r.outcome === 'succeeded' ? r.rowsNew + ' / ' + r.rowsUpdated + ' / ' + r.rowsAbsent : 'unchanged'), h('td', null, r.outcome === 'succeeded' ? r.evaluated + ' / ' + r.applied + ' / ' + r.suppressed : 'no status changed')))))));
    const maps = h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'zm-h' }, h('div', { class: 'row between' }, h('h3', { id: 'zm-h' }, 'Equipment mapping'), h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'zm-add', onClick: () => mapDialog('') }, icon('plus'), 'Add mapping...')),
      h('p', { class: 'small muted', style: 'margin:0' }, "Match exact codes after trimming spaces and converting to uppercase. One code links to one equipment; multiple codes can link to it. Other equipment and spreaders remain unmatched or ignored."),
      h('div', { class: 'table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Equipment mapping'), h('thead', null, h('tr', null, ['ZMMS code', 'Action', 'App equipment', 'State', ''].map((c, i) => h('th', { scope: 'col' }, c || h('span', { class: 'sr-only' }, 'Actions')))))
        , h('tbody', null, z.mappings.map((m) => h('tr', { class: m.state === 'retired' ? 'inactive' : '' }, h('th', { scope: 'row', class: 'mono' }, m.key), h('td', null, m.action === 'map' ? 'Map' : 'Ignore'), h('td', null, m.equipmentId ? EQ.eq(m.equipmentId).code : '-'), h('td', null, m.state + (m.retiredReason ? ' (' + m.retiredReason + ')' : '')),
          h('td', null, m.state === 'active' ? h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.reason({ title: 'Retire mapping ' + m.key, message: 'Rows already attached stay attached; later runs treat this code as unmatched.', confirm: 'Retire', danger: true, onSubmit: (r) => EQ.zmms.retireMapping(m.id, r) }) }, 'Retire') : null)))))));
    const um = EQ.zmms.unmatched();
    const queue = h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'zu-h' }, h('h3', { id: 'zu-h' }, 'Unmatched queue ', h('span', { class: 'tag ' + (um.length ? 'gold' : '') }, String(um.length))),
      um.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'zunmatched' }, h('caption', { class: 'sr-only' }, 'Unmatched ZMMS equipment codes'), h('thead', null, h('tr', null, ['ZMMS code', 'Rows', 'First', 'Last', ''].map((c) => h('th', { scope: 'col' }, c || h('span', { class: 'sr-only' }, 'Actions'))))), h('tbody', null, um.map((u) => h('tr', { 'data-key': u.key }, h('th', { scope: 'row', class: 'mono' }, u.key), h('td', null, String(u.rows)), h('td', null, EQ.fmtDate(u.first)), h('td', null, EQ.fmtDate(u.last)), h('td', null, h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'map-' + u.key, onClick: () => mapDialog(u.key) }, 'Map or ignore...')))))))
        : h('p', { class: 'small muted', style: 'margin:0' }, 'Nothing is waiting for a mapping.'), h('p', { class: 'small muted', style: 'margin:0' }, "Unmatched rows stay here. Mapping links existing rows without duplicates; status updates at the next sync. SQ spreaders and SF/SK/WS/RS mobile equipment are outside the QC/RTG/ES fleet."));
    const vmap = h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'zv-h' }, h('h3', { id: 'zv-h' }, 'Job type and job status mapping'),
      h('p', { class: 'small muted', style: 'margin:0' }, "Admin maps job types to Breakdown or Maintenance after reviewing real data. These are sample mappings. An unmapped type blocks automatic status for affected equipment."),
      h('div', { class: 'table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Value mapping'), h('thead', null, h('tr', null, ['Field', 'ZMMS value', 'Effect'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, z.valueMappings.map((v) => h('tr', { class: v.effect === 'unmapped' ? 'unmapped-row' : '' }, h('td', null, v.field === 'jobType' ? 'Job type' : 'Job status'), h('th', { scope: 'row' }, v.text), h('td', null,
        h('select', { 'aria-label': 'Effect of ' + v.field + ' ' + v.text, 'data-fk': 'vm-' + v.id, onChange: (e) => { const r = EQ.zmms.setEffect(v.id, e.target.value); EQ.toast(r.ok ? 'Effect saved' : r.message); } }, (v.field === 'jobType' ? [['breakdown', 'Breakdown'], ['maintenance', 'Maintenance'], ['none', 'No effect'], ['unmapped', 'Unmapped (needs a decision)']] : [['open', 'Open (counts)'], ['closed', 'Closed (ignored)'], ['unmapped', 'Unmapped (needs a decision)']]).map(([val, l]) => h('option', { value: val, selected: v.effect === val ? true : null }, l))), v.effect === 'unmapped' ? h('span', { class: 'tag red', style: 'margin-left:.4rem' }, 'unmapped') : null)))))),
      h('label', { class: 'check', style: 'min-height:2.5rem' }, h('input', { type: 'checkbox', role: 'switch', checked: z.settings.autoEnabled ? true : null, 'data-fk': 'zm-auto', onChange: (e) => { const r = EQ.zmms.setAuto(e.target.checked); if (!r.ok) { EQ.toast(r.message); } EQ.rerender(); } }), 'Automatic status from ZMMS is ' + (z.settings.autoEnabled ? 'on' : 'off')),
      !EQ.zmms.canEnableAuto().ok ? h('div', { class: 'notice warn' }, icon('alert'), h('p', null, 'Switching it on again is blocked: ' + EQ.zmms.canEnableAuto().why)) : null);
    const evs = h('section', { class: 'panel panel-pad stack', 'aria-labelledby': 'ze-h' }, h('h3', { id: 'ze-h' }, 'Status evaluation of the latest successful run'),
      h('div', { class: 'table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Evaluation per equipment'), h('thead', null, h('tr', null, ['Equipment', 'Computed', 'Result', 'Causing ZMMS jobs'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, z.evaluations.map((e) => h('tr', { 'data-eval': e.equipmentId }, h('th', { scope: 'row' }, EQ.eq(e.equipmentId).code), h('td', null, e.computed ? EQ.statusBadge(e.computed) : '-'), h('td', null, e.applied ? h('span', { class: 'tag green' }, 'Applied') : h('span', { class: 'tag' }, 'Not applied: ' + ({ manualOverride: 'manual correction holds today', unmappedValues: 'a job type or status has no effect yet', automaticDisabled: 'automatic status is off', unchanged: 'unchanged' }[e.skip] || e.skip || 'no change needed'))), h('td', null, e.causes.length ? e.causes.join(', ') : '-')))))));
    return h('div', { class: 'stack' }, h('h2', null, 'ZMMS daily jobs: mapping, mapping of values, sync times and health'),
      h('section', { class: 'panel panel-pad stack zmms-health' + (f.stale ? ' failing' : ''), 'aria-labelledby': 'zh-h', 'data-fk': 'zmms-health' }, h('h3', { id: 'zh-h' }, 'Health ', f.stale ? h('span', { class: 'tag red' }, 'failing') : h('span', { class: 'tag green' }, 'healthy')),
        h('dl', { class: 'kv' }, h('dt', null, 'Last successful sync'), h('dd', null, f.from ? EQ.fmtInstant(f.from) : 'None'), h('dt', null, 'Latest run'), h('dd', null, '#' + z.runs[0].id + ' · ' + z.runs[0].outcome + (z.runs[0].failureCode ? ' (' + z.runs[0].failureCode + ')' : '')), h('dt', null, 'Next scheduled'), h('dd', null, z.settings.sync1 + ' and ' + z.settings.sync2 + ' Asia/Colombo'), h('dt', null, 'Failed runs in the list'), h('dd', null, String(z.runs.filter((r) => r.outcome === 'failed').length))),
        f.stale ? h('div', { class: 'notice warn' }, icon('alert'), h('p', null, "A failed sync keeps previous data and statuses, marked stale. Temporary failures retry after 2, 5 and 15 minutes. Rejected logins do not retry automatically.")) : null),
      timeForm, syncBox, runs, maps, queue, vmap, evs);
  }
  function mapDialog(key) {
    const k = K(); const st = { key, action: 'map', equipmentId: '' }; let errors = {};
    k.openDialog({ build(api) { return { title: key ? 'Map or ignore ' + key : 'Add equipment mapping',
      body: [k.writerGuard(), key ? null : k.field('zm-key', 'ZMMS equipment code', k.input(st, 'key', { maxlength: 100 }), { required: true, error: errors.key }),
        k.radios(st, 'action', 'zm-act', [{ value: 'map', label: 'Map to an app equipment item' }, { value: 'ignore', label: 'Ignore (not an app equipment item)' }], () => api.render(), 'Action *', null),
        st.action === 'map' ? k.field('zm-eq', 'App equipment', k.select(st, 'equipmentId', EQ.state.D.equipment.filter((e) => e.lifecycle === 'active').map((e) => ({ value: e.id, label: e.code })), null, 'Choose'), { required: true, error: errors.equipmentId }) : null],
      foot: k.footButtons(api, 'Save mapping', () => { const r = EQ.zmms.addMapping(st); if (r.ok) { api.close(r); EQ.toast('Mapping saved: ' + r.attached + ' existing row(s) attached, none duplicated', 'No status is recomputed until the next sync.'); } else { errors = r.fields || {}; api.render(); } }) }; } });
  }

  // ---------------------------------------------------------------- major spare parts (EQ settings)
  // U1-C21: EQ Team and Admin add spare parts to a register (EQ Jobs / crane view). U1-C22: here an Admin adds, edits and retires the
  // spare-part types and their expected life, adds parts to the register, changes type/life per equipment, edits register entries
  // (the same register actions as EQ Jobs) and removes parts from the register. Every change is audited; history is kept.
  function spareSection(q) {
    const sp = EQ.state.D.spare;
    const eqs = EQ.state.D.equipment.filter((e) => e.lifecycle === 'active' && EQ.positionsOf(e.id).some((p) => p.state === 'active'));
    const eqId = q.equipment || ui.spareEq; const eq = EQ.eq(eqId) || eqs[0];
    const positions = EQ.positionsOf(eq.id).filter((p) => p.state === 'active').sort((a, b) => EQ.cmp(a.name, b.name));
    const typeRow = (t) => h('tr', { class: t.active ? '' : 'inactive', 'data-type': t.code },
      h('td', { class: 'mono' }, t.code),
      h('th', { scope: 'row' }, h('input', { type: 'text', value: t.name, maxlength: 200, 'aria-label': 'Name of spare-part type ' + t.code, 'data-fk': 'type-name-' + t.code, onChange: (e) => { const r = EQ.spares.renameType(t.id, e.target.value); EQ.toast(r.ok ? 'Type renamed' : r.message, 'Prototype: in memory only; audited.'); EQ.rerender(); } }), t.origin === 'admin' ? h('span', { class: 'tag gold', style: 'margin-left:.35rem' }, 'Added by Admin') : null),
      h('td', null, h('input', { type: 'number', min: 1, max: 600, value: t.defaultLife == null ? '' : t.defaultLife, placeholder: 'not set', 'aria-label': 'Default expected life in months for ' + t.name, 'data-fk': 'life-' + t.code, style: 'max-width:8rem', onChange: (e) => { const r = EQ.spares.setTypeLife(t.id, e.target.value); EQ.toast(r.ok ? 'Default life saved for ' + t.name : r.message, 'Prototype: in memory only.'); EQ.rerender(); } })),
      h('td', null, String(Object.values(sp.designated).filter((d) => d.typeId === t.id).length)),
      h('td', null, t.active ? h('span', { class: 'tag green' }, 'Active') : h('span', { class: 'tag' }, 'Retired')),
      h('td', null, h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'type-act-' + t.code, onClick: () => { const r = EQ.spares.setTypeActive(t.id, !t.active); EQ.toast(r.ok ? t.name + (t.active ? ' reactivated' : ' retired: not offered for new spare parts; registered parts keep it') : r.message, 'Prototype: in memory only; audited.'); EQ.rerender(); } }, t.active ? 'Retire' : 'Reactivate')));
    const types = h('div', { class: 'panel table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Spare-part types and default expected life'), h('thead', null, h('tr', null, ['Code', 'Type', 'Default expected life (months)', 'Designated positions', 'State', 'Action'].map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', null, sp.types.map(typeRow))));
    const rows = positions.map((p) => {
      const d = sp.designated[p.id]; const firstActive = (sp.types.find((t) => t.active) || sp.types[0]);
      const st = { on: !!d, typeId: d ? d.typeId : firstActive.id, lifeOverride: d && d.lifeOverride != null ? String(d.lifeOverride) : '' };
      const typeOpts = sp.types.filter((t) => t.active || t.id === st.typeId);
      const row = d ? EQ.spares.row(p.id) : null;
      return h('tr', { 'data-pos': p.id },
        h('th', { scope: 'row' }, p.name, h('div', { class: 'small muted mono' }, p.key)),
        h('td', null, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.on ? true : null, 'data-fk': 'sp-on-' + p.id, 'aria-label': 'Major spare part: ' + p.name, onChange: (e) => { const r = EQ.spares.designate(p.id, { on: e.target.checked, typeId: st.typeId, lifeOverride: st.lifeOverride }); if (!r.ok) EQ.toast(r.message); EQ.rerender(); } }), st.on ? 'Major' : 'No')),
        h('td', null, h('select', { 'aria-label': 'Spare-part type for ' + p.name, 'data-fk': 'sp-type-' + p.id, disabled: st.on ? null : true, onChange: (e) => { const r = EQ.spares.designate(p.id, { on: true, typeId: e.target.value, lifeOverride: st.lifeOverride }); if (!r.ok) EQ.toast(r.message); EQ.rerender(); } }, typeOpts.map((t) => h('option', { value: t.id, selected: st.typeId === t.id ? true : null }, t.name + (t.active ? '' : ' (retired)'))))),
        h('td', null, h('input', { type: 'number', min: 1, max: 600, value: st.lifeOverride, placeholder: 'type default', 'aria-label': 'Expected life override in months for ' + p.name, 'data-fk': 'sp-life-' + p.id, disabled: st.on ? null : true, style: 'max-width:8rem', onChange: (e) => { const r = EQ.spares.designate(p.id, { on: true, typeId: st.typeId, lifeOverride: e.target.value }); EQ.toast(r.ok ? 'Expected life saved' : r.message); EQ.rerender(); } })),
        h('td', null, st.on ? (EQ.spares.expectedLife(p.id).months != null ? EQ.spares.expectedLife(p.id).months + ' mo (' + EQ.spares.expectedLife(p.id).source + ')' : 'Not set') : '-'),
        h('td', null, row ? h('div', { class: 'row' }, h('span', { class: 'small' }, row.condition ? (row.condition === 'replaced' ? 'Replaced ' + EQ.fmtDate(row.replacedOn) : 'Original') : 'Not recorded'),
          h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'sp-entry-' + p.id, 'aria-label': 'Edit register entry of ' + p.name, onClick: () => EQ.dlg.spare(row) }, icon('edit'), 'Edit entry'))
          : h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'sp-add-' + p.id, 'aria-label': 'Add ' + p.name + ' with its condition', onClick: () => EQ.dlg.addSpare({ equipmentId: eq.id, main: p.mainId, sub: p.subId, part: p.id }) }, icon('plus'), 'Add with condition')));
    });
    return h('div', { class: 'stack' }, h('div', { class: 'row between' }, h('h2', null, 'Major spare parts: types, expected life and register'),
        h('button', { type: 'button', class: 'primary', 'data-fk': 'sp-admin-add', onClick: () => EQ.dlg.addSpare({ equipmentId: eq.id }) }, icon('plus'), 'Add spare part')),
      h('div', { class: 'notice info' }, icon('info'), h('div', { class: 'stack', style: 'gap:.3rem' }, h('p', null, h('strong', null, "EQ Team and Admin: "), "Add parts and record condition in EQ Jobs > Spare parts condition or the crane view."), h('p', null, h('strong', null, "Admin: "), "Manage types, default life, register entries, per-equipment life, type changes and removal."), h('p', null, h('strong', null, "Records: "), "Each equipment has its own register. Retired types stay on existing parts. Removed parts keep their history; changes are logged."), h('p', null, h('strong', null, "Expected life: "), "An Admin estimate, not a drawing fact. The values here are samples."))),
      h('div', { class: 'row between' }, h('h3', null, 'Spare-part types'), h('button', { type: 'button', 'data-fk': 'type-add', onClick: () => addTypeDialog() }, icon('plus'), 'Add type')), types,
      (sp.typeLog || []).length ? h('details', { class: 'panel panel-pad' }, h('summary', null, 'Type changes (' + sp.typeLog.length + ')'), h('ul', { class: 'tl' }, sp.typeLog.slice(0, 30).map((x) => h('li', { class: 'status' }, h('span', { class: 'small' }, x.code + ' ' + x.action + ': ', x.before ? h('s', null, JSON.stringify(x.before)) : null, ' -> ' + JSON.stringify(x.after) + ', ' + EQ.fmtInstantShort(x.at) + ' by ' + EQ.userName(x.by)))))) : null,
      h('div', { class: 'row between' }, h('h3', null, 'Positions of ' + eq.code), h('div', { class: 'field', style: 'min-width:14rem' }, h('label', { for: 'sp-eq' }, 'Equipment'), h('select', { id: 'sp-eq', 'data-fk': 'sp-eq', onChange: (e) => { ui.spareEq = e.target.value; EQ.nav('/admin/eq/spare-parts', { equipment: e.target.value }); } }, eqs.map((e) => h('option', { value: e.id, selected: e.id === eq.id ? true : null }, e.code))))),
      h('div', { class: 'panel table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Positions and spare-part designation'), h('thead', null, h('tr', null, ['Position', 'Major spare part', 'Type', 'Life override (months)', 'Effective life', 'Register entry'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, rows))));
  }
  /** POST /admin/spare-part-types (API s4.19): code, name, default expected life. */
  function addTypeDialog() {
    const st = { code: '', name: '', defaultLife: '' }; let errors = {}, message = null;
    return K().openDialog({ build(api) {
      return {
        title: 'Add spare-part type',
        body: [message ? h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, message)) : null,
          h('div', { class: 'notice info' }, icon('info'), h('p', null, "Code is permanent. Default life applies unless an equipment-specific life is set. Prototype changes are not saved.")),
          h('div', { class: 'grid-2' }, K().field('ty-code', 'Code', K().input(st, 'code', { maxlength: 32, autocomplete: 'off' }), { required: true, error: errors.code, hint: 'Lowercase letters, digits and hyphens, for example boom-hoist-motor.' }),
            K().field('ty-name', 'Name', K().input(st, 'name', { maxlength: 200 }), { required: true, error: errors.name })),
          K().field('ty-life', 'Default expected life (months)', K().input(st, 'defaultLife', { type: 'number', min: 1, max: 600, step: 1, style: 'max-width:9rem' }), { error: errors.defaultLife, hint: 'Blank = not set (no prediction until a life is set).' })],
        foot: K().footButtons(api, 'Add type', () => {
          const r = EQ.spares.addType(st);
          if (r.ok) { api.close(r); EQ.toast('Spare-part type ' + st.name.trim() + ' added', 'Prototype: in memory only; audited.'); }
          else { errors = r.fields || {}; message = r.code === 'validation_failed' ? null : r.message + ' (' + r.status + ' ' + r.code + ')'; api.render(); }
        }),
      };
    } });
  }
})(window.EQ);
