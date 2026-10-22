/* FAC Jobs tab (SOW V2 s5.6, DATA_CONTRACT s18.5): My work, board / list, one-tap actions, the Update progress form with camera upload
   on a phone, hold, job detail with timeline and previous cycles, one-time / recurring job form, Admin correction, export.
   Every action goes through EQ.fac.api (the simulated server rules), so a button and a direct call behave identically. SYNTHETIC data. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const F = () => EQ.fac;
  const K = () => EQ._dlg;
  const ui = (EQ.facUI = { q: '', show: {}, status: 'pending' });
  const COLS = [['pending', 'Pending'], ['inProgress', 'In progress'], ['onHold', 'On hold'], ['completed', 'Completed (this cycle)']];
  const canWork = () => EQ.access.has('fac.work');

  // ---------------------------------------------------------------- actions (one tap)
  function doneTap(job, info) {
    const kind = job.freqCode === 'daily' ? 'doneToday' : 'doneThisWeek';
    const r = F().api.progress(job.id, { kind, note: '', key: 'k-' + job.id + '-' + EQ.todayColombo() + '-' + kind });
    EQ.toast(r.ok ? (kind === 'doneToday' ? 'Done today: ' : 'Done this week: ') + job.name : r.message, r.ok ? 'Prototype: in memory only. Undo from the job detail (same day).' : null);
    return r;
  }
  function actionsFor(job, info, o) {
    o = o || {};
    if (!canWork() || job.state !== 'active') return [];
    const acts = [];
    const period = info.period;
    if (!job.isOnHold) {
      if (period && !info.cycle.completed) acts.push(h('button', { type: 'button', class: 'btn-act primary', 'data-fk': 'done-' + job.id, onClick: () => doneTap(job, info) }, icon('check-circle'), job.freqCode === 'daily' ? 'Done today' : 'Done this week'));
      if (!(period && info.cycle.completed)) acts.push(h('button', { type: 'button', class: 'btn-act' + (period ? '' : ' primary'), 'data-fk': 'prog-' + job.id, onClick: () => EQ.dlg.facProgress(job) }, icon('plus'), 'Update progress'));
      acts.push(h('button', { type: 'button', class: 'btn-act', 'data-fk': 'hold-' + job.id, onClick: () => EQ.dlg.facHold(job) }, icon('hold'), 'Hold'));
    } else acts.push(h('button', { type: 'button', class: 'btn-act', 'data-fk': 'rel-' + job.id, onClick: () => { const r = F().api.release(job.id); EQ.toast(r.ok ? 'Released: ' + job.name : r.message, 'Prototype: in memory only.'); } }, icon('play'), 'Release hold'));
    return acts;
  }

  // ---------------------------------------------------------------- card / row
  function jobCard(x, me) {
    const { job, info } = x;
    const own = job.picProfileId === me;
    return h('article', { class: 'fcard ' + ({ overdue: 'g-overdue', onHold: 'g-hold', inProgress: 'g-prog', dueSoon: 'g-soon', pending: 'g-pend', recent: 'g-done' }[info.overdue ? 'overdue' : info.status === 'onHold' ? 'onHold' : info.status === 'inProgress' ? 'inProgress' : info.dueSoon ? 'dueSoon' : info.status === 'completed' ? 'recent' : 'pending']), 'aria-label': job.name, 'data-job': job.id },
      h('div', { class: 'fc-top' },
        h('span', { class: 'thumb' }, F().jobPic(job) ? h('img', { src: F().jobPic(job).src, alt: '', loading: 'lazy' }) : icon(job.typeCode === 'inspection' ? 'inspect' : 'service')),
        h('div', { class: 'fc-main' }, h('a', { class: 'fc-name', href: '#/fac/jobs/' + job.id }, job.name), h('div', { class: 'meta' }, h('span', { class: 'mono' }, job.number), ' · ', h('span', { class: 'disc d-' + job.discipline }, F().DISC_NAME[job.discipline]), ' · ' + F().TYPE_NAME[job.typeCode] + ' · ' + F().freqLabel(job)),
          h('div', { class: 'meta' }, 'PIC ' + F().picDisplay(job) + (job.mode ? ' · ' + F().MODE_NAME[job.mode] : '') + (own ? ' · ' : ''), own ? h('span', { class: 'tag gold' }, 'Yours') : null))),
      h('div', { class: 'fc-prog' }, EQ.facBar(info.done, info.target, info.pct), h('div', { class: 'fc-flags' }, EQ.facPill(info.status, info.overdue, info.dueSoon), info.dueSoon && !info.overdue ? h('span', { class: 'pill st-dueSoon' }, icon('flag'), 'Due soon') : null, h('span', { class: 'due due-' + info.dueKind }, info.dueLabel))),
      job.isOnHold ? h('div', { class: 'hold-reason' }, 'On hold: ' + job.holdReason) : null,
      info.noDue && !job.isOnHold && info.status !== 'completed' ? h('div', { class: 'small muted' }, info.noDue) : null,
      h('div', { class: 'fc-acts' }, actionsFor(job, info)));
  }

  EQ.views.facJobs = function facJobs(q) {
    const S = EQ.state;
    const page = h('div', { class: 'page facjobs-page' });
    const setQ = (patch) => EQ.nav('/fac/jobs', { ...q, ...patch });
    const view = ['mywork', 'board', 'list'].includes(q.view) ? q.view : 'mywork';
    page.appendChild(h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'eyebrow' }, 'FAC'), h('h1', null, 'FAC Jobs'), h('p', null, 'Your work first: overdue, due soon and in-progress jobs. One tap marks a daily or weekly check done; Update progress takes a quantity, a note and photos. A FAC job is never linked to an EQ equipment record.')),
      h('div', { class: 'row' },
        EQ.access.has('export.excel') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'fac-export', onClick: () => { const r = F().exportRows(filterQ(q)); if (r.ok) { EQ.downloadCsv('fac-jobs.csv', r.columns, r.rows); EQ.toast('Exported ' + r.rows.length + ' filtered job(s)', 'Prototype stand-in: CSV, not the server-generated .xlsx. Source columns plus the calculated ones.'); } else EQ.toast(r.message); } }, icon('download'), 'Export to Excel') : null,
        EQ.access.has('fac.oneTimeJobs.add') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-onetime', onClick: () => EQ.dlg.facJobForm({ kind: 'oneTime' }) }, icon('plus'), 'Add one-time job') : null,
        EQ.access.has('fac.masterList.manage') ? h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'add-recurring', onClick: () => EQ.dlg.facJobForm({ kind: 'recurring' }) }, icon('plus'), 'Add recurring job') : null,
        !canWork() ? h('span', { class: 'tag gold' }, 'Read-only: you cannot change FAC records') : null)));
    if (S.data === 'loading') { page.appendChild(h('div', { 'aria-busy': 'true', role: 'status', class: 'board' }, [1, 2, 3].map(() => h('div', { class: 'skeleton', style: 'height:14rem' })))); return page; }
    if (S.data === 'error') { page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'FAC jobs could not be loaded. '), 'Nothing is shown as completed without data.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'))))); return page; }
    if (S.data === 'stale') page.appendChild(h('div', { class: 'notice warn', role: 'status' }, icon('wifi-off'), h('p', null, 'Showing the last good data from ' + EQ.fmtTime(S.lastGoodAt).slice(0, 5) + '; the latest refresh failed.')));
    if (S.data === 'empty') { page.appendChild(h('div', { class: 'panel empty' }, icon('list'), h('h2', null, 'No FAC jobs yet'), h('p', null, 'An Admin imports the master list in Admin > FAC > Import.'))); return page; }
    const res = F().list(filterQ(q));
    if (!res.ok) { EQ.access.refreshSession('403 ' + res.code); setTimeout(() => EQ.rerender(), 0); return EQ.views.forbidden('fac.jobs.view', '/fac/jobs', res.code); }

    page.appendChild(h('div', { class: 'seg view-seg', role: 'group', 'aria-label': 'View' }, [['mywork', 'My work'], ['board', 'Board'], ['list', 'List']].map(([v, l]) => h('button', { type: 'button', 'aria-pressed': view === v ? 'true' : 'false', 'data-fk': 'view-' + v, onClick: () => setQ({ view: v }) }, l))));
    const sel = (id, label, key, opts, any) => h('div', { class: 'field' }, h('label', { for: id }, label), h('select', { id, 'data-fk': id, onChange: (e) => setQ({ [key]: e.target.value }) }, h('option', { value: '' }, any), opts.map(([v, l]) => h('option', { value: v, selected: q[key] === v ? true : null }, l))));
    const search = h('input', { type: 'search', id: 'fq', 'data-fk': 'fq', value: q.q || '', placeholder: 'Job, number or PIC', autocomplete: 'off' });
    let t; search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { EQ.facUI.q = search.value; setQ({ q: search.value }); }, 250); });
    const pics = [...new Set(S.D.fac.jobs.map((x) => x.picName).filter(Boolean))];
    const filt = h('form', { class: 'panel filters facfilters', role: 'search', 'aria-label': 'FAC job filters', onSubmit: (e) => e.preventDefault() },
      sel('ff-d', 'Discipline', 'discipline', [['electrical', 'Electrical'], ['mechanical', 'Mechanical'], ['civil', 'Civil']], 'All'), sel('ff-t', 'Type', 'type', [['inspection', 'Inspection'], ['service', 'Service']], 'All'),
      sel('ff-m', 'In-house / Outsource', 'mode', [['inHouse', 'In-house'], ['outsource', 'Outsource']], 'All'), sel('ff-p', 'PIC', 'pic', [['me', 'Me'], ...pics.map((p) => [p, p]), ['unassigned', 'Unassigned']], 'Everyone'),
      sel('ff-f', 'Frequency', 'frequency', S.D.fac.frequencies.map((f) => [f.code, f.label]), 'Any'), sel('ff-k', 'Kind', 'kind', [['recurring', 'Recurring'], ['oneTime', 'One-time'], ['continuous', 'Continuous']], 'Any'),
      view === 'list' ? sel('ff-s', 'Status', 'status', COLS.map(([k, l]) => [k, l]), 'Any') : null, sel('ff-g', 'Flag', 'flag', [['overdue', 'Overdue'], ['dueSoon', 'Due soon']], 'Any'),
      h('div', { class: 'field grow' }, h('label', { for: 'fq' }, 'Search'), search), h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.nav('/fac/jobs', { view }) }, 'Clear filters'));
    page.appendChild(h('details', { class: 'filter-fold', open: window.matchMedia('(min-width: 768px)').matches ? true : null }, h('summary', null, 'Filters', Object.keys(q).filter((k) => k !== 'view' && q[k]).length ? ' (' + Object.keys(q).filter((k) => k !== 'view' && q[k]).length + ' on)' : ''), filt));
    const rows = res.rows;
    page.appendChild(h('p', { class: 'small muted', 'aria-live': 'polite', 'data-fk': 'job-count' }, rows.length + ' job(s) match.' + (EQ.access.has('export.excel') ? ' Export uses the same filters.' : '')));

    if (view === 'mywork') {
      const mine = F().myWork(rows, res.me);
      page.appendChild(h('section', { 'aria-labelledby': 'mw-h' }, h('h2', { id: 'mw-h' }, 'My work ', h('span', { class: 'tag' }, String(mine.length))), h('p', { class: 'small muted' }, 'Overdue, due soon and in-progress jobs; the jobs where you are the PIC come first. Jobs on hold are on the board.'),
        mine.length ? h('div', { class: 'fcards' }, mine.map((x) => jobCard(x, res.me))) : h('div', { class: 'nonwork' }, h('strong', null, 'Nothing needs attention'), 'No overdue, due-soon or in-progress job matches these filters.')));
    } else if (view === 'board') {
      const by = (s) => rows.filter((x) => x.job.state === 'active' && x.info.status === s).sort((a, b) => (b.info.overdue - a.info.overdue) || b.info.daysOverdue - a.info.daysOverdue || EQ.cmp(a.info.dueOn || '9999', b.info.dueOn || '9999') || EQ.cmp(a.job.name, b.job.name));
      page.appendChild(h('div', { class: 'fboard' }, COLS.map(([k, l]) => {
        const list = by(k), lim = ui.show[k] || 12;
        return h('section', { class: 'panel col fcol', 'aria-labelledby': 'fc-' + k }, h('header', null, h('h2', { id: 'fc-' + k }, l), h('span', { class: 'tag' }, String(list.length))),
          h('div', { class: 'col-body' }, list.length ? [...list.slice(0, lim).map((x) => jobCard(x, res.me)), list.length > lim ? h('button', { type: 'button', class: 'btn-sm', onClick: () => { ui.show[k] = lim + 20; EQ.rerender(); } }, 'Show ' + Math.min(20, list.length - lim) + ' more (' + (list.length - lim) + ' hidden)') : null] : h('p', { class: 'muted small', style: 'margin:0' }, 'No ' + l.toLowerCase() + ' jobs match.')));
      })));
    } else {
      const lim = ui.show.list || 40;
      page.appendChild(h('div', { class: 'panel table-wrap' }, h('table', { class: 'fac-list' }, h('caption', { class: 'sr-only' }, 'FAC jobs'),
        h('thead', null, h('tr', null, ['Job', 'Discipline', 'Type', 'Frequency', 'Progress', 'Due', 'Status', 'PIC', 'Actions'].map((c) => h('th', { scope: 'col' }, c)))),
        h('tbody', null, rows.slice(0, lim).map((x) => h('tr', { class: x.job.state !== 'active' ? 'inactive' : '' },
          h('th', { scope: 'row' }, h('a', { href: '#/fac/jobs/' + x.job.id }, x.job.name), h('div', { class: 'small muted mono' }, x.job.number + (x.job.state !== 'active' ? ' · ' + x.job.state : ''))), h('td', null, F().DISC_NAME[x.job.discipline]), h('td', null, F().TYPE_NAME[x.job.typeCode]), h('td', null, F().freqLabel(x.job)),
          h('td', null, EQ.facBar(x.info.done, x.info.target, x.info.pct)), h('td', null, h('span', { class: 'due due-' + x.info.dueKind }, x.info.dueLabel)), h('td', null, EQ.facPill(x.info.status, x.info.overdue, x.info.dueSoon)),
          h('td', null, F().picDisplay(x.job)), h('td', null, h('div', { class: 'row' }, actionsFor(x.job, x.info))))))),
        rows.length > lim ? h('div', { class: 'panel-pad' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => { ui.show.list = lim + 40; EQ.rerender(); } }, 'Show 40 more (' + (rows.length - lim) + ' hidden)')) : null));
    }
    page.appendChild(h('p', { class: 'small muted overlay-note' }, 'SYNTHETIC PROGRESS: jobs and frequencies come from the supplied sheet; progress, photos, holds made in the app and the PIC link to the synthetic FAC user are fictional. Nothing is saved.'));
    return page;
  };
  function filterQ(q) { const o = {}; ['discipline', 'type', 'mode', 'pic', 'frequency', 'kind', 'status', 'flag', 'q'].forEach((k) => { if (q[k]) o[k] = q[k]; }); return o; }

  // ---------------------------------------------------------------- job detail
  EQ.views.facJob = function facJob(id) {
    const job = F().byId(id);
    const page = h('div', { class: 'page facjob-page' });
    if (!job) { page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, 'No FAC job with this link exists (404).'))); return page; }
    const info = F().info(job);
    const cy = info.cycle;
    page.appendChild(h('nav', { 'aria-label': 'Breadcrumb' }, h('ol', { class: 'breadcrumb', style: 'margin-bottom:.6rem' }, h('li', null, h('a', { href: '#/fac/jobs' }, 'FAC Jobs')), h('li', null, h('span', { 'aria-current': 'page' }, job.number)))));
    const adm = !EQ.access.srv('fac.work.admin');
    page.appendChild(h('header', { class: 'panel eq-head' }, h('div', null, h('p', { class: 'eyebrow' }, F().DISC_NAME[job.discipline] + ' · ' + F().TYPE_NAME[job.typeCode]), h('h1', null, job.name, ' ', EQ.facPill(info.status, info.overdue, info.dueSoon), info.dueSoon && !info.overdue ? h('span', { class: 'pill st-dueSoon' }, icon('flag'), 'Due soon') : null, job.state !== 'active' ? h('span', { class: 'tag' }, job.state) : null)),
      h('div', { class: 'facts' }, h('span', null, h('span', { class: 'due due-' + info.dueKind }, info.dueLabel)), h('span', null, 'Frequency: ' + F().freqLabel(job)), h('span', null, 'PIC: ' + F().picDisplay(job))),
      h('div', { class: 'actions' }, actionsFor(job, info),
        EQ.access.has('fac.work') ? h('button', { type: 'button', class: 'btn-act', 'data-fk': 'undo', onClick: () => { const r = F().api.undo(job.id); EQ.toast(r.ok ? 'Last update undone' : r.message, r.ok ? 'Prototype: in memory only.' : null); } }, icon('undo'), 'Undo my last update') : null,
        EQ.access.has('fac.masterList.manage') && job.state === 'active' ? h('button', { type: 'button', class: 'btn-act', 'data-fk': 'edit-job', onClick: () => EQ.dlg.facJobForm({ job }) }, icon('edit'), 'Edit job') : null,
        adm ? h('button', { type: 'button', class: 'btn-act', 'data-fk': 'correct', onClick: () => EQ.dlg.facCorrect(job) }, icon('sliders'), 'Correct (Admin)...') : null)));
    if (!canWork()) page.appendChild(h('p', { class: 'small muted' }, 'Read-only: Management and EQ Team cannot change FAC records.'));
    const kv = (rows) => h('dl', { class: 'kv' }, rows.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
    const pic = F().jobPic(job);
    const prev = F().previousCycles(job);
    page.appendChild(h('div', { class: 'grid-2 detail-cols', style: 'align-items:start;margin-top:.7rem' },
      h('section', { class: 'panel panel-pad stack' }, h('h2', null, 'Job'),
        h('div', { class: 'job-pic' }, pic ? h('img', { src: pic.src, alt: 'Job picture: ' + job.name + (pic.synthetic ? ' (synthetic placeholder image)' : '') }) : h('div', { class: 'nonwork' }, 'No job picture (optional).'),
          canWork() ? h('label', { class: 'btn btn-sm file-btn' }, icon('camera'), pic ? 'Replace job picture' : 'Add job picture', h('input', { type: 'file', accept: 'image/jpeg,image/png', capture: 'environment', class: 'sr-only', 'data-fk': 'job-pic', onChange: (e) => { const f = e.target.files[0]; if (!f) return; const err = photoError(f); if (err) { EQ.toast(err); return; } F().api.setPicture(job.id, F().newPhoto(job.name, EQ.user().id, URL.createObjectURL(f), f.name)); EQ.toast('Job picture set', 'Prototype: stays in this browser tab only.'); } })) : null),
        kv([['Job number', job.number], ['Discipline', F().DISC_NAME[job.discipline]], ['Type', F().TYPE_NAME[job.typeCode]], ['Frequency', F().freqLabel(job)], ['Quantity', String(job.quantity)], ['Kind', F().KIND_NAME[job.kind]], ['PIC', F().picDisplay(job)], ['In-house / Outsource', job.mode ? F().MODE_NAME[job.mode] : 'Not set'], ['Last done', job.lastDoneOn ? EQ.fmtDate(job.lastDoneOn) : 'Not set'], ['Remarks', job.remarks || '-'], ['State', job.state + (job.sourceRow ? ' · source row ' + job.sourceRow + (job.split != null ? ' (split ' + (job.split + 1) + ')' : '') : ' · created in the app')]]),
        job.issues.length ? h('div', { class: 'small muted' }, 'Import notes: ' + job.issues.map((i) => i.replace(/-/g, ' ')).join('; ')) : null),
      h('section', { class: 'panel panel-pad stack' }, h('h2', null, 'Current cycle'),
        h('div', { class: 'cycle-box' }, EQ.facBar(info.done, info.target, info.pct), h('div', { class: 'row' }, EQ.facPill(info.status, info.overdue, info.dueSoon), h('span', { class: 'due due-' + info.dueKind }, info.dueLabel))),
        kv([['Completed quantity', info.done + ' of ' + info.target], ['Pending quantity', String(info.pending)], ['Next due', info.dueOn ? EQ.fmtDate(info.dueOn) + (cy.dueBasis === 'adminEntered' ? ' (Admin-entered date)' : cy.dueBasis === 'period' ? '' : ' (last done + interval)') : info.noDue], info.overdue ? ['Days overdue', String(info.daysOverdue)] : null, info.period ? ['Period', EQ.fmtDate(cy.periodStart) + (cy.periodEnd !== cy.periodStart ? ' to ' + EQ.fmtDate(cy.periodEnd) : '')] : null, job.isOnHold ? ['On hold', job.holdReason] : null]),
        info.awaitingConfirmation ? h('div', { class: 'notice warn' }, icon('alert'), h('p', null, 'The full quantity is recorded but the cycle is not confirmed complete. Update progress with the remaining quantity 0 is not possible; an Admin confirms it by correction.')) : null,
        h('h3', { style: 'margin-top:.6rem' }, 'Previous cycles'),
        prev.length ? h('div', { class: 'table-wrap' }, h('table', null, h('caption', { class: 'sr-only' }, 'Previous cycles'), h('thead', null, h('tr', null, ['Cycle', 'Done', 'Completed', 'Result'].map((c) => h('th', { scope: 'col' }, c)))), h('tbody', null, prev.slice(0, 14).map((c) => h('tr', null, h('th', { scope: 'row' }, c.label), h('td', null, c.done + '/' + c.target), h('td', null, c.completedOn ? EQ.fmtDate(c.completedOn) : '-'), h('td', null, h('span', { class: 'tag ' + (c.result === 'On time' ? 'green' : c.result === 'Missed' || /Late/.test(c.result) ? 'red' : '') }, c.result))))))) : h('p', { class: 'small muted', style: 'margin:0' }, 'No completed cycle recorded in the app yet.' + (job.lastDoneOn && !info.period ? ' The last done date (' + EQ.fmtDate(job.lastDoneOn) + ') comes from the supplied sheet.' : '')))));
    // timeline
    const tl = [];
    job.updates.forEach((u) => tl.push({ at: u.recordedUtc, kind: 'update', u }));
    job.holds.forEach((x) => tl.push({ at: x.at, kind: 'hold', x }));
    job.corrections.forEach((c) => tl.push({ at: c.at, kind: 'corr', c }));
    job.edits.forEach((e) => tl.push({ at: e.at, kind: 'edit', e }));
    tl.sort((a, b) => EQ.cmp(b.at, a.at));
    page.appendChild(h('section', { class: 'panel panel-pad stack', style: 'margin-top:.7rem', 'aria-labelledby': 'tl-h' }, h('h2', { id: 'tl-h' }, 'Timeline ', h('span', { class: 'tag' }, String(tl.length))),
      tl.length ? h('ul', { class: 'tl' }, tl.map((t) => timelineItem(job, t))) : h('div', { class: 'nonwork' }, h('strong', null, 'No updates yet'), 'Every update is recorded here with who, when, quantity, note and photos.')));
    return page;
  };
  function timelineItem(job, t) {
    if (t.kind === 'update') {
      const u = t.u;
      return h('li', { class: u.state === 'active' ? '' : 'voided', 'data-up': u.id },
        h('div', { class: 'row between' }, h('strong', null, u.kind === 'importOpening' ? 'Opening quantity: ' + u.qty : (u.kind === 'doneToday' ? 'Done today' : u.kind === 'doneThisWeek' ? 'Done this week' : '+' + u.qty) + (u.completes ? ' · cycle completed' : '')), h('span', { class: 'when' }, EQ.fmtInstantShort(u.recordedUtc))),
        h('span', { class: 'when' }, (u.state === 'undone' ? 'UNDONE (kept). ' : u.state === 'voidedByCorrection' ? 'Voided by an Admin correction (kept). ' : '') + 'By ' + F().userName(u.actorId) + (u.workDate ? ' · work date ' + EQ.fmtDate(u.workDate) : '')),
        u.note ? h('span', null, u.note) : null,
        u.photos.length ? h('div', { class: 'photos' }, u.photos.map((p) => p.state === 'active' ? h('figure', { class: 'ph' }, h('button', { type: 'button', class: 'ph-btn', 'aria-label': 'Open photo ' + p.name, onClick: () => EQ.dlg.photo(p) }, h('img', { src: p.src, alt: 'Completion photo' + (p.synthetic ? ' (synthetic placeholder)' : '') })), canRemove(u) ? h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.reason({ title: 'Remove photo', message: 'The removal is recorded; the file is kept and shown to Admin only.', label: 'Reason', confirm: 'Remove photo', danger: true, onSubmit: (r) => F().api.removePhoto(job.id, u.id, p.id, r) }) }, 'Remove') : null) : h('span', { class: 'tag dashed' }, 'Photo removed: ' + p.removedReason))) : null);
    }
    if (t.kind === 'hold') return h('li', { class: 'status' }, h('div', { class: 'row between' }, h('strong', null, t.x.kind === 'hold' ? 'Put on hold' : 'Hold released'), h('span', { class: 'when' }, EQ.fmtInstantShort(t.x.at))), t.x.reason ? h('span', null, t.x.reason) : null, h('span', { class: 'when' }, 'By ' + F().userName(t.x.actorId)));
    if (t.kind === 'corr') return h('li', { class: 'open' }, h('div', { class: 'row between' }, h('strong', null, 'Admin correction ' + t.c.n), h('span', { class: 'when' }, EQ.fmtInstantShort(t.c.at))), h('span', null, 'Reason: ' + t.c.reason), t.c.items.map((it) => h('div', { class: 'small' }, it.entity + ' · ' + it.field + ': ', h('s', null, String(it.before)), ' → ', h('strong', null, String(it.after)))), h('span', { class: 'when' }, 'By ' + F().userName(t.c.by) + '. Previous values are kept above.'));
    return h('li', { class: 'status' }, h('div', { class: 'row between' }, h('strong', null, 'Master data edited'), h('span', { class: 'when' }, EQ.fmtInstantShort(t.e.at))), t.e.changes.map((c) => h('div', { class: 'small' }, c.field + ': ', h('s', null, c.before), ' → ', h('strong', null, c.after))), h('span', { class: 'when' }, 'By ' + F().userName(t.e.by)));
  }
  function canRemove(u) { return u.state === 'active' && ((u.actorId === EQ.user().id && EQ.todayOf(u.recordedUtc) === EQ.todayColombo() && canWork()) || !EQ.access.srv('fac.work.admin')); }
  function photoError(f) {
    if (!/\.(jpe?g|png)$/i.test(f.name)) return 'Only JPG or PNG photos are accepted (422): ' + f.name;
    if (f.type && !/^image\/(jpeg|png)$/.test(f.type)) return 'The file type does not match a JPG or PNG photo: ' + f.name;
    if (f.size > 10 * 1024 * 1024) return 'Photos can be at most 10 MB (413 file_too_large): ' + f.name;
    if (/[\\/\u0000-\u001f]/.test(f.name)) return 'The file name contains path or control characters: refused.';
    return null;
  }
  EQ.facPhotoError = photoError;

  // ---------------------------------------------------------------- dialogs
  EQ.dlg.photo = function photo(p) {
    const k = K();
    k.openDialog({ noGuard: true, build(api) { return { title: 'Completion photo', body: [h('img', { src: p.src, alt: 'Completion photo' + (p.synthetic ? ' (synthetic placeholder)' : ''), style: 'width:100%;border-radius:.4rem' }), h('p', { class: 'small muted', style: 'margin:0' }, p.synthetic ? 'Synthetic placeholder image generated by the prototype.' : 'Local preview. The server would re-encode the image, strip location metadata and serve it only to signed-in users allowed to view FAC.')], foot: [h('button', { type: 'button', class: 'primary', 'data-fk': 'close', onClick: () => api.close() }, 'Close')] }; } });
  };
  EQ.dlg.facHold = function facHold(job) {
    const k = K(); const st = { reason: '' }; let err = null;
    k.openDialog({ build(api) { return { title: 'Put on hold - ' + job.name, body: [k.writerGuard && !canWork() ? h('div', { class: 'notice warn' }, icon('lock'), h('p', null, 'Read-only access. The server refuses this action for your role.')) : null,
      h('div', { class: 'notice info' }, icon('info'), h('p', null, 'On hold keeps the job in its place on the board and stops progress updates until it is released. The due date keeps counting.')),
      k.field('fh-reason', 'Reason', k.area(st, 'reason', { rows: 3, maxlength: 500 }), { required: true, error: err, hint: 'For example: Area not released by OPS.' })],
      foot: k.footButtons(api, 'Put on hold', () => { const r = F().api.hold(job.id, st.reason); if (r.ok) { api.close(r); EQ.toast('On hold: ' + job.name, 'Prototype: in memory only.'); } else { err = (r.fields && r.fields.reason) || r.message; api.render(); } }) }; } });
  };
  EQ.dlg.facProgress = function facProgress(job) {
    const k = K();
    const today = EQ.todayColombo();
    const st = { qty: '', all: false, workDate: today, note: '', nextDueOn: '', files: [] };
    let errors = {}, busy = false;
    const key = 'req-' + job.id + '-' + Date.now();
    const api = k.openDialog({ build(api) {
      const info = F().info(job); const rem = info.target - info.done;
      const fq = F().freq(job);
      const needNext = fq && fq.kind === 'runningHours' && job.kind === 'recurring' && (st.all || Number(st.qty) >= rem);
      return {
        title: 'Update progress - ' + job.name,
        body: [!canWork() ? h('div', { class: 'notice warn' }, icon('lock'), h('p', null, 'Read-only access. The server refuses this action for your role.')) : null,
          h('p', { class: 'small', style: 'margin:0' }, h('strong', null, info.done + ' of ' + info.target + ' done'), ' · ' + rem + ' remaining · ' + info.dueLabel + ' · ' + (info.period ? 'this ' + (job.freqCode === 'daily' ? 'day' : 'week') : 'this cycle')),
          h('div', { class: 'grid-2' },
            k.field('fp-qty', 'Quantity done now', k.input(st, 'qty', { inputmode: 'numeric', type: 'number', min: '1', max: String(rem), disabled: st.all ? true : null }, () => api.markDirty()), { required: !st.all, error: errors.qty, hint: 'Whole units, 1 to ' + rem + '. The total can never exceed ' + info.target + '.' }),
            k.field('fp-date', 'Work date', k.input(st, 'workDate', { type: 'date', max: today }, () => api.markDirty()), { required: true, error: errors.workDate, hint: 'Default today (Asia/Colombo). Not in the future.' })),
          h('label', { class: 'check allchk' }, h('input', { type: 'checkbox', checked: st.all ? true : null, 'data-fk': 'fp-all', onChange: (e) => { st.all = e.target.checked; api.markDirty(); api.render(); } }), 'All done (' + rem + ' remaining)'),
          needNext ? k.field('fp-next', 'Next due date (running-hours job)', k.input(st, 'nextDueOn', { type: 'date' }), { required: true, error: errors.nextDueOn, hint: 'This frequency has no automatic date; enter it at completion.' }) : null,
          k.field('fp-note', 'Note (optional)', k.area(st, 'note', { rows: 2, maxlength: 2000 }), {}),
          photoField(st, api, errors.photos)],
        foot: k.footButtons(api, st.all || Number(st.qty) >= rem ? 'Save and complete the cycle' : 'Save progress', () => submit(false), { busy }),
      };
    } });
    function photoField(st2, api2, err) {
      const input = h('input', { type: 'file', accept: 'image/jpeg,image/png', capture: 'environment', multiple: true, id: 'fp-photos', 'data-fk': 'fp-photos', class: 'sr-only', onChange: (e) => { const msgs = []; [...e.target.files].forEach((f) => { const m = photoError(f); if (m) msgs.push(m); else if (st2.files.length >= 5) msgs.push('At most 5 photos per update (422 too_many_photos).'); else st2.files.push({ id: 'new-' + Math.random().toString(36).slice(2), src: URL.createObjectURL(f), name: f.name, state: 'active', by: EQ.user().id, synthetic: false }); }); errors.photos = msgs[0] || null; e.target.value = ''; api2.markDirty(); api2.render(); } });
      return h('div', { class: 'field' }, h('span', { class: 'label' }, 'Completion photos (optional, up to 5)'),
        h('div', { class: 'row' }, h('label', { class: 'btn file-btn', for: 'fp-photos' }, icon('camera'), 'Take or add photos'), input, h('span', { class: 'small muted' }, st2.files.length + ' of 5')),
        st2.files.length ? h('div', { class: 'photos' }, st2.files.map((f, i) => h('figure', { class: 'ph' }, h('img', { src: f.src, alt: 'Selected photo ' + (i + 1) }), h('button', { type: 'button', class: 'btn-sm', onClick: () => { st2.files.splice(i, 1); api2.render(); } }, 'Remove')))) : null,
        err ? h('div', { class: 'err' }, icon('alert'), err) : h('div', { class: 'hint' }, 'JPG or PNG, up to 10 MB each. On a phone this opens the camera. Prototype: the photos stay in this tab; the server would resize them, strip location data and make thumbnails.'));
    }
    function submit(confirmed) {
      if (busy) return; busy = true; api.render();
      const info = F().info(job);
      const res = F().api.progress(job.id, { qty: st.all ? undefined : Number(st.qty), allDone: st.all, workDate: st.workDate, note: st.note, photos: st.files, confirmCompletion: confirmed, nextDueOn: st.nextDueOn || undefined, cycleVersion: info.cycle.version, key });
      busy = false;
      if (res.ok) { api.close(res); EQ.toast(res.completed ? 'Cycle completed: ' + job.name : 'Progress saved: +' + res.update.qty + ' on ' + job.name, res.replayed ? 'Retry replayed: nothing was counted twice.' : 'Prototype: in memory only.'); return; }
      if (res.code === 'completion_confirmation_required') { api.render(); K().confirmDialog({ title: 'Complete this cycle?', message: 'This update brings ' + job.name + ' to the full quantity (' + info.target + '). The cycle is marked Completed and the next cycle opens' + (job.kind === 'recurring' ? '' : '; the job closes') + '.', confirmLabel: 'Yes, complete the cycle', cancelLabel: 'Not yet' }).then((ok) => { if (ok) submit(true); }); return; }
      errors = res.fields && Object.keys(res.fields).length ? res.fields : { qty: res.message };
      if (res.code === 'version_conflict' || res.code === 'job_on_hold' || res.code === 'cycle_already_completed' || res.code === 'job_not_active') EQ.toast(res.message);
      api.render();
    }
    return api;
  };

  EQ.dlg.facJobForm = function facJobForm({ job, kind }) {
    const k = K(); const editing = !!job;
    const allowKinds = [];
    if (EQ.access.has('fac.masterList.manage')) allowKinds.push('recurring', 'continuous');
    if (EQ.access.has('fac.oneTimeJobs.add')) allowKinds.push('oneTime');
    const st = job ? { discipline: job.discipline, typeCode: job.typeCode, name: job.name, kind: job.kind, freqCode: job.freqCode || '', quantity: String(job.quantity), picName: job.picName || '', mine: job.picProfileId === EQ.user().id, mode: job.mode || '', lastDoneOn: job.lastDoneOn || '', remarks: job.remarks || '', file: null }
      : { discipline: '', typeCode: '', name: '', kind: kind || allowKinds[0] || 'oneTime', freqCode: '', quantity: '1', picName: '', mine: false, mode: '', lastDoneOn: '', remarks: '', file: null };
    let errors = {};
    const api = k.openDialog({ build(api) {
      const f = F();
      return {
        title: editing ? 'Edit job - ' + job.number : st.kind === 'oneTime' ? 'Add one-time job' : 'Add recurring job',
        body: [!allowKinds.length && !editing ? h('div', { class: 'notice warn' }, icon('lock'), h('p', null, 'You cannot add FAC jobs. The server refuses this action for your role.')) : null,
          editing ? null : k.radios(st, 'kind', 'fj-kind', [{ value: 'recurring', label: 'Recurring' }, { value: 'oneTime', label: 'One-time' }, { value: 'continuous', label: 'Continuous' }].filter((o) => allowKinds.includes(o.value) || !allowKinds.length), () => api.render(), 'Job kind *', errors.kind),
          h('div', { class: 'grid-2' }, k.field('fj-d', 'Discipline', k.select(st, 'discipline', Object.entries(f.DISC_NAME).map(([v, l]) => ({ value: v, label: l })), null, 'Choose'), { required: true, error: errors.discipline }), k.field('fj-t', 'Type', k.select(st, 'typeCode', Object.entries(f.TYPE_NAME).map(([v, l]) => ({ value: v, label: l })), null, 'Choose'), { required: true, error: errors.typeCode })),
          k.field('fj-name', 'Job name', k.input(st, 'name', { maxlength: 200 }, () => api.markDirty()), { required: true, error: errors.name, hint: 'For example: Weighbridge government stamping.' }),
          h('div', { class: 'grid-2' },
            st.kind === 'oneTime' ? h('div', { class: 'field' }, h('span', { class: 'label' }, 'Frequency'), h('div', { class: 'small muted' }, 'One-time jobs close on completion and have no frequency or due date.')) : k.field('fj-f', 'Frequency', k.select(st, 'freqCode', EQ.state.D.fac.frequencies.map((x) => ({ value: x.code, label: x.label })), null, 'Choose'), { required: true, error: errors.freqCode || errors.kind }),
            k.field('fj-q', 'Quantity per cycle', k.input(st, 'quantity', { type: 'number', min: '1', inputmode: 'numeric' }), { required: true, error: errors.quantity, hint: 'Units covered in one cycle, for example 414 panel boards.' })),
          h('div', { class: 'grid-2' }, k.field('fj-pic', 'PIC (typed name)', k.input(st, 'picName', { maxlength: 200 }), { error: errors.pic, hint: 'Optional. Or assign to yourself below.' }), k.field('fj-mode', 'In-house / Outsource', k.select(st, 'mode', [{ value: 'inHouse', label: 'In-house' }, { value: 'outsource', label: 'Outsource' }], null, 'Not set'), {})),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.mine ? true : null, onChange: (e) => { st.mine = e.target.checked; } }), 'Assign the PIC to me (' + EQ.user().name + ')'),
          st.kind === 'oneTime' ? null : k.field('fj-ld', 'Last done date (optional)', k.input(st, 'lastDoneOn', { type: 'date', max: EQ.todayColombo() }), { error: errors.lastDoneOn, hint: 'Starting point for the next due date. After the first completion it follows the recorded completions.' }),
          k.field('fj-rem', 'Remarks', k.area(st, 'remarks', { rows: 2, maxlength: 4000 }), {})],
        foot: k.footButtons(api, editing ? 'Save changes' : 'Add job', () => {
          const p = { ...st, picProfileId: st.mine ? EQ.user().id : null, picName: st.mine ? null : st.picName, mode: st.mode || null };
          const r = editing ? f.api.updateJob(job.id, p) : f.api.createJob(p);
          if (r.ok) { api.close(r); EQ.toast(editing ? 'Saved ' + job.number : 'Added ' + r.job.number + ' (' + r.job.name + ')', 'Prototype: in memory only.'); if (!editing) EQ.nav('/fac/jobs/' + r.job.id, {}); } else { errors = r.fields && Object.keys(r.fields).length ? r.fields : { name: r.message }; api.render(); }
        }),
      };
    } });
    return api;
  };

  EQ.dlg.facCorrect = function facCorrect(job) {
    const k = K();
    const ups = job.updates.filter((u) => u.state === 'active');
    const st = { type: 'quantity', updateId: ups.length ? ups[ups.length - 1].id : '', qty: '', workDate: '', dueOn: '', reason: '' };
    let errors = {};
    const api = k.openDialog({ build(api) {
      const upOpts = ups.map((u) => ({ value: u.id, label: (u.workDate ? EQ.fmtDate(u.workDate) : 'import') + ' · +' + u.qty + ' · ' + F().userName(u.actorId) }));
      return { title: 'Admin correction - ' + job.name,
        body: [h('div', { class: 'notice info' }, icon('info'), h('p', null, 'A correction needs a reason, keeps the previous values in the timeline and never rewrites other cycles or jobs. Next due always derives from the recorded completion dates.')),
          k.radios(st, 'type', 'fc-type', [{ value: 'quantity', label: 'Change an update quantity' }, { value: 'workDate', label: 'Change an update date' }, { value: 'void', label: 'Void an update' }, { value: 'dueOn', label: 'Set an Admin due date' }, { value: 'reopen', label: 'Reopen the last completed cycle' }], () => api.render(), 'Correction *', errors.items),
          ['quantity', 'workDate', 'void'].includes(st.type) ? k.field('fc-up', 'Update', k.select(st, 'updateId', upOpts, null, 'Choose'), { required: true, error: errors.qty || errors.void || errors.workDate }) : null,
          st.type === 'quantity' ? k.field('fc-q', 'New quantity', k.input(st, 'qty', { type: 'number', min: '1' }), { required: true, error: errors.qty }) : null,
          st.type === 'workDate' ? k.field('fc-wd', 'New work date', k.input(st, 'workDate', { type: 'date', max: EQ.todayColombo() }), { required: true, error: errors.workDate }) : null,
          st.type === 'dueOn' ? k.field('fc-due', 'Admin-entered due date', k.input(st, 'dueOn', { type: 'date' }), { required: true, error: errors.dueOn }) : null,
          k.field('fc-reason', 'Reason', k.area(st, 'reason', { rows: 2 }), { required: true, error: errors.reason })],
        foot: k.footButtons(api, 'Record correction', () => {
          const item = { type: st.type, updateId: st.updateId, qty: st.qty, workDate: st.workDate, dueOn: st.dueOn };
          const r = F().api.correct(job.id, { reason: st.reason, items: [item] });
          if (r.ok) { api.close(r); EQ.toast('Correction recorded', 'The previous values stay in the timeline.'); } else { errors = r.fields && Object.keys(r.fields).length ? r.fields : { items: r.message }; api.render(); }
        }) };
    } });
    return api;
  };
})(window.EQ);
