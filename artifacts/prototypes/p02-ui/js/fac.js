/* P02B: FAC section engine (DATA_CONTRACT s17-s19, API s4.24-s4.27): jobs, cycles, due dates, flags, progress, hold, undo,
   corrections, dashboard read model and export rows.
   REAL: the 114 jobs come from documents/prompt-pack/reference/fac-job-list.json (js/fac-ref.js, generated).
   SYNTHETIC (labelled in the UI): every progress update, photo, hold made in the app, PIC-to-user assignment, Admin-entered due date,
   job picture and user name below. Nothing is persisted; a reload restores this fixture. */
window.EQ = window.EQ || {};
(function (EQ) {
  const F = (EQ.fac = {});
  const pad = (n) => String(n).padStart(2, '0');
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmt = (dt) => dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
  const addDays = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
  const addMonths = (s, n) => { const d = parse(s); const day = d.getUTCDate(); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(day, last)); return fmt(t); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
  const weekStart = (s) => addDays(s, -((parse(s).getUTCDay() + 6) % 7)); // Monday
  const colomboDate = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date(iso));
  F.date = { addDays, addMonths, diffDays, weekStart, parse, fmt, colomboDate };
  const D = () => EQ.state.D.fac;
  const fail = (status, code, message, fields, extra) => ({ ok: false, status, code, message, fields: fields || {}, ...(extra || {}) });

  // ---------------------------------------------------------------- reference lists
  const DISC = [['electrical', 'Electrical'], ['mechanical', 'Mechanical'], ['civil', 'Civil']];
  F.DISC_NAME = Object.fromEntries(DISC);
  F.TYPE_NAME = { inspection: 'Inspection', service: 'Service' };
  F.MODE_NAME = { inHouse: 'In-house', outsource: 'Outsource' };
  F.KIND_NAME = { recurring: 'Recurring', oneTime: 'One-time', continuous: 'Continuous' };
  F.USERS = { a: { id: 'u-fac-a', name: 'Synthetic FAC user A' }, b: { id: 'u-fac-b', name: 'Synthetic FAC user B' }, c: { id: 'u-fac-c', name: 'Synthetic FAC user C' } };
  F.userName = (id) => { if (!id) return 'Import'; const u = Object.values(F.USERS).find((x) => x.id === id) || Object.values(EQ.USERS).find((x) => x.id === id); return u ? u.name : id; };

  function freqList() {
    return EQ.FAC_REF.frequencies.map((f) => ({ code: f.code, label: f.label, intervalMonths: f.intervalMonths, intervalDays: f.intervalDays,
      kind: f.code === 'running-hours' ? 'runningHours' : f.code === 'as-required' ? 'asRequired' : 'interval', basis: f.code === 'daily' || f.code === 'weekly' ? 'period' : 'rolling', active: true }));
  }
  const freq = (job) => (job.freqCode ? D().frequencies.find((f) => f.code === job.freqCode) : null);
  const isPeriod = (job) => { const f = freq(job); return !!f && f.basis === 'period' && job.kind === 'recurring'; };
  F.freq = freq; F.isPeriod = isPeriod;
  F.freqLabel = (job) => { const f = freq(job); return f ? f.label : 'Frequency not set'; };

  // ---------------------------------------------------------------- synthetic photos (SVG, labelled; no real image is stored)
  function photoSrc(seed, label) {
    const hue = (seed * 47) % 360;
    const t = (label || '').slice(0, 34).replace(/[<>&"]/g, '');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',38%,78%)"/><stop offset="1" stop-color="hsl(' + ((hue + 30) % 360) + ',30%,58%)"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><rect y="270" width="640" height="130" fill="hsl(' + hue + ',18%,36%)"/>' +
      '<rect x="' + (60 + (seed * 37) % 120) + '" y="120" width="150" height="170" fill="hsl(' + hue + ',20%,30%)" stroke="#fff" stroke-width="3"/><rect x="' + (300 + (seed * 53) % 100) + '" y="170" width="190" height="120" fill="hsl(' + hue + ',25%,24%)" stroke="#fff" stroke-width="3"/>' +
      '<circle cx="' + (520 + (seed % 3) * 15) + '" cy="90" r="34" fill="#fff" opacity=".7"/><rect y="340" width="640" height="60" fill="rgba(7,30,48,.72)"/><text x="18" y="368" font-family="Segoe UI,Arial" font-size="22" font-weight="700" fill="#fff">SYNTHETIC PHOTO</text><text x="18" y="392" font-family="Segoe UI,Arial" font-size="15" fill="#e6eef4">' + t + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  F.photoSrc = photoSrc;
  let photoSeq = 0;
  const newPhoto = (label, by, src, name) => ({ id: 'ph-' + (++photoSeq), src: src || photoSrc(photoSeq, label), name: name || 'synthetic-' + photoSeq + '.svg', state: 'active', by, synthetic: !src, removedReason: null });

  // ---------------------------------------------------------------- build (real list + synthetic overlay)
  F.build = function build(Dx) {
    const REF = EQ.FAC_REF;
    const today = EQ.todayColombo();
    photoSeq = 0;
    const fac = (Dx.fac = { settings: { dueSoonDays: 7, refreshSeconds: 60, scrollPxPerSec: 20 }, frequencies: freqList(), version: 1, seq: 1, jobs: [], overlay: { dueDates: 0, updates: 0, photos: 0, holds: 0, pics: 0, assigned: 0 }, importBatch: null, idem: {}, audit: [] });
    REF.jobs.forEach((r, i) => {
      const nm = (r.name || '').replace(/(\w)�(s\b)/g, '$1’$2').replace(/�/g, '-');
      const job = {
        id: 'fj-' + r.sourceRow + (r.splitIndex != null ? '-' + r.splitIndex : ''), number: 'FAC-' + String(i + 1).padStart(5, '0'), sourceRow: r.sourceRow, split: r.splitIndex,
        discipline: r.discipline.toLowerCase(), typeCode: r.type.toLowerCase(), name: nm, freqCode: r.frequencyCode, freqText: (r.frequencyText || '').replace(/�/g, '-'),
        kind: r.kind === 'one-time' ? 'oneTime' : r.kind, quantity: r.importQuantity || 1, picName: r.pic, picProfileId: null,
        mode: r.mode === 'In-house' ? 'inHouse' : r.mode === 'Outsource' ? 'outsource' : null, lastDoneOn: r.lastDone || null, openingLastDoneOn: r.lastDone || null, remarks: r.remarks || null,
        state: 'active', isOnHold: false, holdReason: null, heldSince: null, origin: 'facImport', issues: (r.issues || []).slice(), sheetStatus: r.sheetStatus, sheetCompletedQty: r.sheetCompletedQty,
        cycles: [], updates: [], holds: [], corrections: [], edits: [], periodVersions: {}, picture: null, synthetic: {},
        showOnDashboard: true, // U1-C26 default: shown
      };
      if (nm !== r.name) job.issues.push('replacement-character-in-text');
      fac.jobs.push(job);
    });
    fac.jobs.forEach((job) => openFirstCycle(job, 'import'));
    overlay(fac, today);
    fac.version = 1;
  };

  /** Opening state of a job (D-118). Daily/Weekly jobs keep no stored cycle (period cycles are created by the first update). */
  function openFirstCycle(job, reason) {
    if (isPeriod(job)) return;
    const f = freq(job);
    let dueOn = null, basis = 'none';
    if (job.kind === 'recurring' && f && f.kind === 'interval' && job.lastDoneOn) { dueOn = f.intervalMonths ? addMonths(job.lastDoneOn, f.intervalMonths) : addDays(job.lastDoneOn, f.intervalDays); basis = 'lastDonePlusInterval'; }
    const c = { seq: 1, basis: 'rolling', dueOn, dueBasis: basis, target: job.quantity, completedOn: null, state: 'open', openedReason: reason, version: 1, interval: f ? { months: f.intervalMonths, days: f.intervalDays } : null };
    job.cycles.push(c);
    if (job.sheetStatus === 'Pending' && job.sheetCompletedQty > 0) {
      const q = Math.min(job.sheetCompletedQty, job.quantity);
      job.updates.push({ id: 'up-' + job.id + '-0', kind: 'importOpening', cycleKey: 1, qty: q, workDate: null, note: 'Opening quantity from the supplied sheet (' + job.sheetCompletedQty + ' of ' + job.quantity + ')', state: 'active', actorId: null, recordedUtc: new Date(Date.now() - 30 * 864e5).toISOString(), photos: [], completes: false });
      if (q >= job.quantity) job.synthetic.awaitingConfirmation = true;
    }
    if (job.sourceRow === 14 && job.remarks) { job.isOnHold = true; job.holdReason = job.remarks; job.heldSince = new Date(Date.now() - 30 * 864e5).toISOString(); job.holds.push({ kind: 'hold', reason: job.remarks + ' (imported)', actorId: null, at: job.heldSince }); }
  }

  // ---------------------------------------------------------------- derived state
  const activeUps = (job, key) => job.updates.filter((u) => u.state === 'active' && u.cycleKey === key);
  const sumQ = (ups) => ups.reduce((a, u) => a + u.qty, 0);
  /** The job's current cycle as a plain object (rolling: the open one, else the latest completed; period: the cycle containing today). */
  const periodCycle = (job, ps) => {
    const f = freq(job), pe = f.code === 'daily' ? ps : addDays(ps, 6);
    const ups = activeUps(job, ps), done = sumQ(ups);
    const completed = done >= job.quantity;
    return { basis: 'period', key: ps, periodStart: ps, periodEnd: pe, dueOn: pe, dueBasis: 'period', target: job.quantity, done, completed, completedOn: completed ? ups.map((u) => u.workDate).sort().pop() : null, version: job.periodVersions[ps] || 0 };
  };
  F.periodCycle = periodCycle;
  F.current = function current(job, today) {
    today = today || EQ.todayColombo();
    if (isPeriod(job)) return periodCycle(job, freq(job).code === 'daily' ? today : weekStart(today));
    const open = job.cycles.find((c) => c.state === 'open');
    if (open) return { ...open, key: open.seq, done: sumQ(activeUps(job, open.seq)), completed: false };
    const last = [...job.cycles].reverse().find((c) => c.state === 'completed') || job.cycles[job.cycles.length - 1];
    return { ...last, key: last.seq, done: last.target, completed: true };
  };
  const lastCompletedCycle = (job) => [...job.cycles].reverse().find((c) => c.state === 'completed') || null;

  /** Calculated, never typed: status, flags, quantities, due label (DATA s17.4, s17.11). */
  F.info = function info(job, today) {
    today = today || EQ.todayColombo();
    const c = F.current(job, today), dueSoonDays = D().settings.dueSoonDays;
    const roll = c.basis === 'rolling';
    const hasDue = !!c.dueOn;
    const overdue = roll && !c.completed && hasDue && c.dueOn < today && job.state === 'active';
    const daysOverdue = overdue ? diffDays(today, c.dueOn) : 0;
    const dueSoon = !c.completed && hasDue && c.dueOn >= today && diffDays(c.dueOn, today) <= dueSoonDays && job.state === 'active';
    const prevDone = roll ? lastCompletedCycle(job) : null;
    let status;
    if (job.state === 'closed') status = 'completed';
    else if (job.isOnHold) status = 'onHold';
    else if (!c.completed && c.done > 0) status = 'inProgress';
    else if (c.basis === 'period' && c.completed) status = 'completed';
    else if (roll && c.done === 0 && prevDone && !overdue && !dueSoon && job.state === 'active') status = 'completed';
    else status = 'pending';
    let done = c.done, target = c.target, completedOn = c.completedOn;
    if (status === 'completed' && roll && prevDone) { done = prevDone.target; target = prevDone.target; completedOn = prevDone.completedOn; }
    if (job.state === 'closed') { done = target = (lastCompletedCycle(job) || c).target; completedOn = (lastCompletedCycle(job) || c).completedOn; }
    const pct = target ? Math.round((done / target) * 100) : 0;
    let dueLabel, dueKind = 'none', noDue = null;
    if (c.basis === 'period') { dueLabel = freq(job).code === 'daily' ? 'Due today' : 'Due ' + EQ.fmtDate(c.dueOn).replace(/ \d{4}$/, ''); dueKind = c.completed ? 'ok' : 'soon'; if (c.completed) dueLabel = freq(job).code === 'daily' ? 'Done today' : 'Done this week'; }
    else if (hasDue) {
      const dd = diffDays(c.dueOn, today);
      if (c.completed || status === 'completed' && !dueSoon && !overdue) { dueLabel = 'Next due ' + (c.dueOn.slice(0, 4) === today.slice(0, 4) ? EQ.fmtDate(c.dueOn).replace(/ \d{4}$/, '') : EQ.fmtDate(c.dueOn)); dueKind = 'ok'; } // U1-C24: the year is shown when the next due date is in a later year
      else if (overdue) { dueLabel = 'Overdue ' + daysOverdue + ' d'; dueKind = 'overdue'; }
      else if (dd === 0) { dueLabel = 'Due today'; dueKind = 'soon'; }
      else { dueLabel = 'Due in ' + dd + ' d'; dueKind = dueSoon ? 'soon' : 'ok'; }
    } else {
      const f = freq(job);
      noDue = !f ? 'Frequency not set: no due date' : job.kind !== 'recurring' ? 'No due date (' + F.KIND_NAME[job.kind].toLowerCase() + ' job)' : f.kind === 'runningHours' ? 'Next due is entered at each completion' : f.kind === 'asRequired' ? 'No fixed frequency: no due date' : 'No due date until the first completion or an Admin-entered date';
      dueLabel = 'No due date';
    }
    const group = job.state !== 'active' ? null : overdue ? 'overdue' : status === 'onHold' ? 'onHold' : status === 'inProgress' ? 'inProgress' : dueSoon ? 'dueSoon' : status === 'pending' ? 'pending' : (status === 'completed' && completedOn && diffDays(today, completedOn) <= 6 ? 'recent' : status === 'completed' ? 'upToDate' : null); // U1-C24: done earlier, not yet due again: listed, not hidden
    return { job, cycle: c, status, overdue, daysOverdue, dueSoon, dueOn: c.dueOn, dueLabel, dueKind, noDue, done, target, pending: Math.max(0, target - done), pct, group, completedOn, period: c.basis === 'period', awaitingConfirmation: !c.completed && c.done >= c.target && c.target > 0 };
  };
  F.GROUPS = ['overdue', 'onHold', 'inProgress', 'dueSoon', 'pending', 'recent', 'upToDate'];
  F.GROUP_NAME = { overdue: 'Overdue', onHold: 'On hold', inProgress: 'In progress', dueSoon: 'Due soon', pending: 'Pending', recent: 'Completed in the last 7 days', upToDate: 'Done, up to date (not yet due again)' };
  F.STATUS_NAME = { pending: 'Pending', inProgress: 'In progress', completed: 'Completed', onHold: 'On hold' };
  F.picDisplay = (job) => (job.picProfileId ? F.userName(job.picProfileId) : job.picName || 'Unassigned');
  F.byId = (id) => D().jobs.find((j) => j.id === id);
  /** U1-C26: shown on the FAC Dashboard unless its shared "Show on dashboard" switch is off (default shown). */
  F.shown = (job) => job.showOnDashboard !== false;
  /** Simulated GET /fac/jobs/{id} (API s4.22, D-140): fac.jobs.view reads any job; fac.dashboard.view alone reads only an active job,
   *  because that is the read-only detail a dashboard row opens (SOW V2 5.5.7). The FAC Jobs list, the full cycle list and the export
   *  stay fac.jobs.view only (Repair-R02B findings 1 and 7). */
  F.detail = function detail(id) {
    const full = !EQ.access.srv('fac.jobs.view');
    if (!full && EQ.access.srv('fac.dashboard.view')) return EQ.access.srv('fac.jobs.view');
    const job = F.byId(id);
    if (!job || (!full && (job.state !== 'active' || !F.shown(job)))) return fail(404, 'not_found', 'No FAC job with this link exists (404).'); // dashboard population only (D-140, U1-C26)
    return { ok: true, job, via: full ? 'jobs' : 'dashboard' };
  };
  /** Simulated GET /fac/jobs/{id}/cycles: the full paged cycle list belongs to the FAC Jobs tab. */
  F.cycles = function cycles(id) { const deny = EQ.access.srv('fac.jobs.view'); if (deny) return deny; const job = F.byId(id); return job ? { ok: true, items: F.previousCycles(job) } : fail(404, 'not_found', 'No such job.'); };
  /** Where a dashboard row, ticker item or proof caption links: the FAC Jobs record when the session holds fac.jobs.view, else the
   *  read-only dashboard detail route (gated by fac.dashboard.view). */
  F.jobHref = (id) => (EQ.access.has('fac.jobs.view') ? '#/fac/jobs/' : '#/fac/dashboard/jobs/') + id;
  F.jobPic = (job) => (job.picture && job.picture.state === 'active' ? job.picture : null);

  /** Previous cycles for the detail view: completion date, on time / late by n d / missed / no due date. */
  F.previousCycles = function previousCycles(job) {
    const out = [];
    if (isPeriod(job)) {
      const today = EQ.todayColombo(), f = freq(job);
      const keys = [...new Set(job.updates.filter((u) => u.state === 'active' && typeof u.cycleKey === 'string').map((u) => u.cycleKey))].sort().reverse();
      const curKey = F.current(job).key;
      keys.filter((k) => k !== curKey).forEach((k) => {
        const ups = activeUps(job, k), done = sumQ(ups), pe = f.code === 'daily' ? k : addDays(k, 6);
        const completed = done >= job.quantity;
        out.push({ label: f.code === 'daily' ? EQ.fmtDate(k) : 'Week of ' + EQ.fmtDate(k), done, target: job.quantity, completedOn: completed ? ups.map((u) => u.workDate).sort().pop() : null, result: completed ? 'On time' : 'Missed', dueOn: pe });
      });
      return out;
    }
    [...job.cycles].filter((c) => c.state === 'completed').reverse().forEach((c) => {
      const late = c.dueOn ? diffDays(c.completedOn, c.dueOn) : null;
      out.push({ label: 'Cycle ' + c.seq, done: c.target, target: c.target, completedOn: c.completedOn, dueOn: c.dueOn, result: !c.dueOn ? 'No due date' : late <= 0 ? 'On time' : 'Late by ' + late + ' d' });
    });
    return out;
  };

  // ---------------------------------------------------------------- internal writers (shared by the API and the synthetic seeds)
  function bump() { D().version += 1; }
  function applyProgress(job, p) {
    // p: { qty, workDate, note, kind, actorId, recordedUtc, photos, completeKey? }
    let c = F.current(job);
    if (c.basis === 'period') c = periodCycle(job, freq(job).code === 'daily' ? p.workDate : weekStart(p.workDate));
    const key = c.key;
    const up = { id: 'up-' + job.id + '-' + (job.updates.length + 1), kind: p.kind || 'progress', cycleKey: key, qty: p.qty, workDate: p.workDate, note: p.note || '', state: 'active', actorId: p.actorId, recordedUtc: p.recordedUtc || new Date().toISOString(), photos: p.photos || [], completes: false };
    job.updates.push(up);
    if (c.basis === 'period') job.periodVersions[key] = (job.periodVersions[key] || 0) + 1;
    const total = sumQ(activeUps(job, key));
    if (total >= c.target) {
      up.completes = true;
      const completedOn = activeUps(job, key).map((u) => u.workDate).sort().pop();
      if (c.basis === 'rolling') {
        const cy = job.cycles.find((x) => x.seq === key); cy.state = 'completed'; cy.completedOn = completedOn; cy.completedUtc = up.recordedUtc; cy.version += 1;
        job.lastDoneOn = completedOn;
        const f = freq(job);
        if (job.kind === 'recurring') {
          let dueOn = null, basis = 'none';
          if (f && f.kind === 'interval') { dueOn = f.intervalMonths ? addMonths(completedOn, f.intervalMonths) : addDays(completedOn, f.intervalDays); basis = 'lastDonePlusInterval'; }
          else if (f && f.kind === 'runningHours' && p.nextDueOn) { dueOn = p.nextDueOn; basis = 'enteredAtCompletion'; }
          job.cycles.push({ seq: key + 1, basis: 'rolling', dueOn, dueBasis: basis, target: job.quantity, completedOn: null, state: 'open', openedReason: 'previousCompleted', version: 1, interval: f ? { months: f.intervalMonths, days: f.intervalDays } : null });
        } else { job.state = 'closed'; job.closedUtc = up.recordedUtc; }
      }
    }
    return up;
  }
  function recordedFor(daysAgo, minsAgo, hour) {
    const now = Date.now(), start = EQ.colomboDayStartMs();
    if (!daysAgo) return new Date(Math.max(start + 5 * 60000, now - (minsAgo || 0) * 60000)).toISOString();
    return new Date(start - (daysAgo - 1) * 864e5 - (24 - (hour == null ? 11 : hour)) * 3600e3).toISOString();
  }

  // ---------------------------------------------------------------- synthetic overlay (clearly labelled in the UI)
  function overlay(fac, today) {
    const byRow = (row, split) => fac.jobs.find((j) => j.sourceRow === row && (split == null ? j.split == null : j.split === split));
    const U = F.USERS;
    // 1. PIC linked to the synthetic FAC Team user (an Admin edit: PIC is a user or a typed name, never both)
    [30, 33, 46, 53, 62, 66, 84, 95].forEach((r) => { const j = byRow(r); if (j) { j.picName = null; j.picProfileId = U.a.id; j.synthetic.pic = true; fac.overlay.assigned += 1; } });
    // 2. Admin-entered due dates (DueBasis adminEntered) so the board shows overdue, due soon and a spread over the next 8 weeks
    const dueOffsets = { 87: -12, 22: -5, 33: -3, 28: 2, 47: 4, 66: 6, 43: 1, 52: 9, 59: 11, 60: 13, 62: 15, 63: 18, 64: 21, 41: 24, 42: 27, 38: 30, 67: 33, 76: 36, 78: 39, 79: 42, 84: 45, 86: 48, 89: 51, 92: 54, 98: 38, 99: 44, 102: 20, 109: 26, 110: 31 };
    Object.entries(dueOffsets).forEach(([r, off]) => { const j = byRow(Number(r)); if (!j || isPeriod(j)) return; const c = j.cycles.find((x) => x.state === 'open'); if (c && !c.dueOn) { c.dueOn = addDays(today, off); c.dueBasis = 'adminEntered'; j.synthetic.due = true; fac.overlay.dueDates += 1; } });
    // 3. completions (rolling, whole quantity) with a synthetic due date relative to the completion day: on time and late
    const comp = [[88, 2, +1, 'a', 2], [91, 3, -7, 'b', 1], [93, 6, +2, 'a', 0], [100, 12, +3, 'c', 1], [104, 15, +5, 'b', 0], [105, 8, -1, 'a', 2], [107, 20, +4, 'c', 1], [108, 25, +2, 'b', 0]];
    comp.forEach(([r, daysAgo, dueRel, who, photos]) => {
      const j = byRow(r); if (!j) return;
      const c = j.cycles[0]; const done = addDays(today, -daysAgo);
      c.dueOn = addDays(done, dueRel); c.dueBasis = 'adminEntered'; j.synthetic.due = true; fac.overlay.dueDates += 1;
      const ph = Array.from({ length: photos }, () => { const p = newPhoto(j.name, U[who].id); fac.overlay.photos += 1; return p; });
      applyProgress(j, { qty: j.quantity, workDate: done, kind: 'progress', note: 'Completed (synthetic)', actorId: U[who].id, recordedUtc: recordedFor(daysAgo, 0, 14 - (r % 5)), photos: ph });
      j.synthetic.completed = true; fac.overlay.updates += 1;
    });
    // 4. partial progress, daily/weekly checks
    const wkClamp = (n) => { const d = addDays(today, -n); const ws = weekStart(today); return d < ws ? ws : d; };
    const prog = [
      [2, null, 20, 0, 12, 'a', 2, 'Panel boards, level 3 east (synthetic)', 'progress'], [5, null, 1, 1, 0, 'b', 0, 'Elevator 2 monthly inspection (synthetic)', 'progress'], [7, null, 1, 0, 95, 'a', 1, 'Hook block and rail check, crane 1 of 2 (synthetic)', 'progress'],
      [82, null, 30, 1, 0, 'a', 1, 'Fenders, berth 3 (synthetic)', 'progress'], [80, null, 12, 2, 0, 'b', 0, 'Bollards 1-12 (synthetic)', 'progress'],
      [48, null, 1, 0, 200, 'c', 0, 'MEP STP stage 1 (synthetic)', 'progress'], [83, null, 6, 0, 40, 'b', 1, 'Power pits QC 1-6 (synthetic)', 'progress'],
      [11, null, 'all', 0, 160, 'a', 1, 'All three substations (synthetic)', 'doneToday'], [24, null, 'all', 0, 140, 'b', 0, 'Done today (synthetic)', 'doneToday'], [27, null, 'all', 0, 75, 'a', 0, 'Done today (synthetic)', 'doneToday'], [30, null, 'all', 0, 30, 'c', 1, 'Cooling tower walk-round (synthetic)', 'doneToday'],
      [23, null, 'all', 2, 0, 'a', 0, 'Done this week (synthetic)', 'doneThisWeek'], [40, null, 'all', 0, 20, 'b', 0, 'Done this week (synthetic)', 'doneThisWeek'],
    ];
    prog.forEach(([r, sp, q, daysAgo, minsAgo, who, photos, note, kind]) => {
      const j = byRow(r, sp); if (!j) return;
      const c = F.current(j); const qty = q === 'all' ? c.target - c.done : q;
      const wd = kind === 'doneThisWeek' ? wkClamp(daysAgo) : addDays(today, -daysAgo);
      const ph = Array.from({ length: photos }, () => { const p = newPhoto(j.name, U[who].id); fac.overlay.photos += 1; return p; });
      applyProgress(j, { qty, workDate: wd, kind, note, actorId: U[who].id, recordedUtc: recordedFor(daysAgo, minsAgo, 15), photos: ph });
      j.synthetic.progress = true; fac.overlay.updates += 1;
    });
    // 5. a hold made in the app, with a reason
    const hj = byRow(44); if (hj) { hj.isOnHold = true; hj.holdReason = 'Detector zones closed for roof repair works (synthetic)'; hj.heldSince = recordedFor(1, 0, 10); hj.holds.push({ kind: 'hold', reason: hj.holdReason, actorId: U.b.id, at: hj.heldSince }); fac.overlay.holds += 1; }
    // 6. job pictures
    fac.jobs.forEach((j, i) => { if (i % 4 === 1) { j.picture = newPhoto(j.name, null); j.picture.purpose = 'jobPicture'; j.synthetic.picture = true; fac.overlay.pics += 1; } });
  }

  // ---------------------------------------------------------------- dashboard read model (DATA s18.4)
  F.filterJobs = function filterJobs(jobs, q) {
    const me = EQ.user().id;
    // U1-C44: substring search with literal punctuation, * any text and ? one character.
    // Greedy glob matching avoids treating user text as a regular expression.
    const term = String(q.search || '').trim().toLowerCase();
    const pattern = ('*' + term + '*').replace(/\*+/g, '*');
    const matches = (j) => {
      if (!term) return true;
      const text = [j.name, j.number, F.picDisplay(j), F.DISC_NAME[j.discipline], F.TYPE_NAME[j.typeCode], F.MODE_NAME[j.mode], F.freqLabel(j), j.remarks].filter(Boolean).join(' ').toLowerCase();
      let t = 0, p = 0, star = -1, retry = 0;
      while (t < text.length) {
        if (p < pattern.length && (pattern[p] === '?' || pattern[p] === text[t])) { p++; t++; }
        else if (pattern[p] === '*') { star = p++; retry = t; }
        else if (star >= 0) { p = star + 1; t = ++retry; }
        else return false;
      }
      while (pattern[p] === '*') p++;
      return p === pattern.length;
    };
    return jobs.filter((j) => (!q.discipline || j.discipline === q.discipline) && (!q.type || j.typeCode === q.type) && (!q.mode || (q.mode === 'none' ? !j.mode : j.mode === q.mode))
      && (!q.pic || (q.pic === 'me' ? j.picProfileId === me : q.pic === 'unassigned' ? !j.picProfileId && !j.picName : (j.picName === q.pic || j.picProfileId === q.pic))) && matches(j));
  };
  F.rowOf = function rowOf(job, info) {
    info = info || F.info(job);
    return { key: job.id, id: job.id, number: job.number, discipline: job.discipline, type: job.typeCode, name: job.name, freq: F.freqLabel(job), done: info.done, target: info.target, pct: info.pct, status: info.status, group: info.group, overdue: info.overdue, dueSoon: info.dueSoon, dueLabel: info.dueLabel, dueKind: info.dueKind,
      pic: F.picDisplay(job), mode: job.mode ? F.MODE_NAME[job.mode] : '', thumb: F.jobPic(job) ? F.jobPic(job).src : null, holdReason: job.isOnHold ? job.holdReason : null, daysOverdue: info.daysOverdue, dueOn: info.dueOn, period: info.period,
      sig: [info.status, info.group, info.done, info.target, info.dueLabel, job.isOnHold ? job.holdReason : '', F.picDisplay(job), job.name, F.jobPic(job) ? 1 : 0].join('|') };
  };
  const ORDER = Object.fromEntries(F.GROUPS.map((g, i) => [g, i]));
  F.dashboard = function dashboard(q) {
    const deny = EQ.access.srv('fac.dashboard.view'); if (deny) return deny;
    q = q || {};
    const today = EQ.todayColombo(), d = D(), set = d.settings;
    const filtered = F.filterJobs(d.jobs, q).filter(F.shown); // U1-C26: hidden jobs leave every block (KPIs, on-time, lanes, ticker, proof, due load)
    const active = filtered.filter((j) => j.state === 'active');
    const infos = active.map((j) => ({ j, i: F.info(j, today) }));
    const rolling = infos.filter((x) => !x.i.period);
    // on-time: rolling cycles with a due date completed in [today-29, today]
    const win = []; filtered.forEach((j) => { if (isPeriod(j)) return; j.cycles.filter((c) => c.state === 'completed' && c.dueOn && c.completedOn >= addDays(today, -29) && c.completedOn <= today).forEach((c) => win.push({ ok: c.completedOn <= c.dueOn })); });
    const dailies = infos.filter((x) => x.j.freqCode === 'daily' && x.j.kind === 'recurring');
    const kpi = {
      active: infos.length, completed: infos.filter((x) => x.i.status === 'completed').length, inProgress: infos.filter((x) => x.i.status === 'inProgress').length, onHold: infos.filter((x) => x.i.status === 'onHold').length, overdue: infos.filter((x) => x.i.overdue).length,
      dueSoon: rolling.filter((x) => x.i.dueSoon).length, onTimePct: win.length ? Math.round((win.filter((w) => w.ok).length / win.length) * 100) : null, onTimeN: win.length, onTimeOk: win.filter((w) => w.ok).length,
      checksDone: dailies.filter((x) => x.i.status === 'completed').length, checksTotal: dailies.length,
    };
    const focusOk = (x) => !q.focus || ({ overdue: x.i.overdue, dueSoon: x.i.dueSoon && !x.i.period, inProgress: x.i.status === 'inProgress', completed: x.i.status === 'completed', onHold: x.i.status === 'onHold' }[q.focus]);
    const lanes = DISC.map(([code, name]) => {
      const lane = infos.filter((x) => x.j.discipline === code);
      const rows = lane.filter((x) => x.i.group && focusOk(x)).sort((a, b) => ORDER[a.i.group] - ORDER[b.i.group] || b.i.daysOverdue - a.i.daysOverdue || EQ.cmp(a.i.dueOn || '9999', b.i.dueOn || '9999') || EQ.cmp(a.j.name, b.j.name)).map((x) => F.rowOf(x.j, x.i));
      const done = lane.filter((x) => x.i.status === 'completed').length;
      return { code, name, total: lane.length, completed: done, pct: lane.length ? Math.round((done / lane.length) * 100) : 0, rows };
    }).filter((l) => !q.discipline || l.code === q.discipline);
    // ticker: the 20 latest updates, completions, holds and releases of the last 7 days
    const ev = [];
    const cutoff = Date.now() - 7 * 864e5;
    active.forEach((j) => {
      j.updates.filter((u) => u.state === 'active' && u.kind !== 'importOpening' && new Date(u.recordedUtc).getTime() >= cutoff).forEach((u) => ev.push({ key: u.id, at: u.recordedUtc, who: F.userName(u.actorId), jobId: j.id, jobName: j.name, qty: u.qty, completed: u.completes, kind: u.kind }));
      j.holds.filter((h) => h.actorId && new Date(h.at).getTime() >= cutoff).forEach((h, i) => ev.push({ key: 'hd-' + j.id + '-' + i + '-' + h.at, at: h.at, who: F.userName(h.actorId), jobId: j.id, jobName: j.name, qty: 0, completed: false, kind: h.kind }));
    });
    ev.sort((a, b) => EQ.cmp(b.at, a.at));
    const proof = [];
    active.forEach((j) => j.updates.filter((u) => u.state === 'active').forEach((u) => u.photos.filter((p) => p.state === 'active').forEach((p) => proof.push({ key: p.id, src: p.src, jobId: j.id, jobName: j.name, workDate: u.workDate, who: F.userName(u.actorId), at: u.recordedUtc, synthetic: !!p.synthetic }))));
    proof.sort((a, b) => EQ.cmp(b.at, a.at));
    const ws = weekStart(today);
    const weeks = Array.from({ length: 8 }, (_, w) => ({ start: addDays(ws, w * 7), electrical: 0, mechanical: 0, civil: 0 }));
    rolling.forEach((x) => { const due = x.i.dueOn; if (!due || x.i.overdue || x.i.cycle.completed) return; const idx = Math.floor(diffDays(due, ws) / 7); if (idx >= 0 && idx < 8 && weeks[idx][x.j.discipline] !== undefined) weeks[idx][x.j.discipline] += 1; });
    return { ok: true, generatedUtc: new Date().toISOString(), businessDate: today, dataVersion: d.version, etag: 'v' + d.version + '-' + today + '-' + EQ.access.sessionAt() + '-' + JSON.stringify(q), settings: { ...set, flipSeconds: 8 }, kpi, lanes, ticker: ev.slice(0, 20), proof: proof.slice(0, 12), dueLoad: weeks, filters: q, syntheticOverlay: d.overlay };
  };

  // ---------------------------------------------------------------- FAC Jobs list (DATA s18.5) and export
  F.list = function list(q) {
    const deny = EQ.access.srv('fac.jobs.view'); if (deny) return deny;
    q = q || {};
    const me = EQ.user().id;
    const rows = F.filterJobs(D().jobs, q).filter((j) => (!q.frequency || j.freqCode === q.frequency) && (!q.kind || j.kind === q.kind) && (q.state ? j.state === q.state : j.state !== 'deactivated'))
      .map((j) => ({ job: j, info: F.info(j) })).filter((x) => (!q.status || x.info.status === q.status) && (!q.flag || (q.flag === 'overdue' ? x.info.overdue : q.flag === 'dueSoon' ? x.info.dueSoon : true))
        && (!q.q || (x.job.name + ' ' + x.job.number + ' ' + F.picDisplay(x.job)).toLowerCase().includes(q.q.toLowerCase())));
    return { ok: true, rows, me };
  };
  F.myWork = function myWork(rows, me) {
    return rows.filter((x) => x.job.state === 'active' && !x.job.isOnHold && (x.info.overdue || x.info.dueSoon || x.info.status === 'inProgress'))
      .sort((a, b) => (b.job.picProfileId === me) - (a.job.picProfileId === me) || ORDER[a.info.group] - ORDER[b.info.group] || b.info.daysOverdue - a.info.daysOverdue || EQ.cmp(a.info.dueOn || '9999', b.info.dueOn || '9999') || EQ.cmp(a.job.name, b.job.name));
  };
  F.EXPORT_COLUMNS = ['Section', 'Internal Section', 'Inspection/ Service', 'Description', 'Frequency', 'Quantity', 'Last Date', 'Next Date', 'PIC', 'In-house/ Outsource', 'Completion Progress', 'Status', 'Completed qty', 'Pending qty', 'Completed percentage', 'Remarks', 'Job number', 'Due soon', 'Overdue', 'Days overdue', 'On hold reason', 'State', 'Source row', 'Shown on dashboard'];
  const safe = (v) => { if (v == null) return ''; const s = String(v); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; };
  F.exportRows = function exportRows(q) {
    const deny = EQ.access.srv('export.excel') || EQ.access.srv('fac.jobs.view'); if (deny) return deny;
    const l = F.list(q); if (!l.ok) return l;
    if (l.rows.length > 10000) return fail(422, 'export_too_large', 'More than 10 000 rows.');
    const rows = l.rows.map(({ job, info }) => [safe('Facility'), safe(F.DISC_NAME[job.discipline]), safe(F.TYPE_NAME[job.typeCode]), safe(job.name), safe(F.freqLabel(job)), job.quantity, job.lastDoneOn || '', info.dueOn || '', safe(F.picDisplay(job) === 'Unassigned' ? '' : F.picDisplay(job)), safe(job.mode ? F.MODE_NAME[job.mode] : ''), safe(F.KIND_NAME[job.kind]), safe(F.STATUS_NAME[info.status]), info.done, info.pending, info.pct + '%', safe(job.remarks), safe(job.number), info.dueSoon ? 'Yes' : '', info.overdue ? 'Yes' : '', info.daysOverdue || '', safe(job.isOnHold ? job.holdReason : ''), safe(job.state), job.sourceRow || '', F.shown(job) ? 'Yes' : 'No']);
    return { ok: true, columns: F.EXPORT_COLUMNS, rows };
  };
  F.exportCsv = function exportCsv(q) {
    const r = F.exportRows(q); if (!r.ok) return r;
    const esc = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return { ok: true, count: r.rows.length, csv: [r.columns, ...r.rows].map((row) => row.map(esc).join(',')).join('\r\n') };
  };

  // ---------------------------------------------------------------- API (simulated server rules)
  const audit = (action, job, reason) => { D().audit.unshift({ at: new Date().toISOString(), by: EQ.user().id, action, job: job && job.number, reason: reason || null }); EQ.log('audit: ' + action + (job ? ' ' + job.number : '')); };
  const todayStr = () => EQ.todayColombo();
  const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
  F.api = {
    /** Update progress / Done today / Done this week. p: { qty, allDone, workDate, note, photos[], confirmCompletion, kind, cycleVersion, nextDueOn, key } */
    progress(jobId, p) {
      const deny = EQ.access.srv('fac.work'); if (deny) return deny;
      if (p.key && D().idem[p.key]) return { ...D().idem[p.key], replayed: true };
      const job = F.byId(jobId); if (!job) return fail(404, 'not_found', 'No such job.');
      if (job.state !== 'active') return fail(409, 'job_not_active', 'This job is ' + job.state + ' and accepts no update until it is reactivated.');
      if (job.isOnHold) return fail(409, 'job_on_hold', 'This job is on hold (' + job.holdReason + '). Release it before recording progress.');
      const today = todayStr(); let c = F.current(job, today); const f = {};
      if (p.kind === 'doneToday' && !(job.freqCode === 'daily' && job.kind === 'recurring')) return fail(422, 'kind_frequency_mismatch', 'Done today applies to Daily jobs only.');
      if (p.kind === 'doneThisWeek' && !(job.freqCode === 'weekly' && job.kind === 'recurring')) return fail(422, 'kind_frequency_mismatch', 'Done this week applies to Weekly jobs only.');
      if (c.basis === 'period' && p.workDate && validDate(p.workDate) && p.workDate <= today && !(p.kind === 'doneToday' || p.kind === 'doneThisWeek')) c = periodCycle(job, job.freqCode === 'daily' ? p.workDate : weekStart(p.workDate));
      if (c.completed && c.basis === 'period') return fail(409, 'cycle_already_completed', 'This ' + (job.freqCode === 'daily' ? 'day' : 'week') + ' is already complete. Nothing was counted twice.', {}, { current: c });
      if (c.basis === 'rolling' && p.cycleVersion != null && p.cycleVersion !== c.version) return fail(409, 'version_conflict', 'Another user updated this cycle after you opened it.', {}, { current: c });
      const implied = p.kind === 'doneToday' || p.kind === 'doneThisWeek';
      const workDate = implied ? today : p.workDate || today;
      if (!validDate(workDate)) f.workDate = 'Enter a valid date.';
      else if (workDate > today) f.workDate = 'The date cannot be in the future (422 date_in_future).';
      else if (c.basis === 'rolling') { const prev = lastCompletedCycle(job); if (prev && prev.completedOn && workDate < prev.completedOn) f.workDate = 'Earlier than the previous completion on ' + EQ.fmtDate(prev.completedOn) + ' (422 date_before_previous_completion).'; }
      else { const ps = job.freqCode === 'daily' ? workDate : weekStart(workDate); const curPs = F.current(job, today).periodStart; const prevPs = job.freqCode === 'daily' ? addDays(curPs, -1) : addDays(curPs, -7); if (ps !== curPs && ps !== prevPs) f.workDate = 'Only the current or the previous ' + (job.freqCode === 'daily' ? 'day' : 'week') + ' is accepted (422 date_outside_cycle).'; }
      const remaining = c.target - c.done;
      const qty = p.allDone || implied ? remaining : Number(p.qty);
      if (!p.allDone && !implied) { if (!Number.isInteger(qty) || qty < 1) f.qty = 'Enter a whole number of 1 or more (422 quantity_invalid).'; else if (qty > remaining) f.qty = 'Only ' + remaining + ' remain in this cycle (422 quantity_exceeds_remaining). Completed quantity can never exceed the job quantity.'; }
      if ((p.photos || []).length > 5) f.photos = 'At most 5 photos per update (422 too_many_photos).';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      if (c.done + qty >= c.target && !p.confirmCompletion && !implied) return fail(409, 'completion_confirmation_required', 'This update completes the cycle. Confirm to complete it.', {}, { current: c, completes: true });
      const fq = freq(job);
      if (c.done + qty >= c.target && fq && fq.kind === 'runningHours' && job.kind === 'recurring') { if (!p.nextDueOn || p.nextDueOn <= workDate) return fail(422, 'next_due_required', 'This job is due by running hours: enter the next due date (after the completion date).', { nextDueOn: 'Enter the next due date.' }); }
      const photos = (p.photos || []).map((x) => ({ ...x }));
      const up = applyProgress(job, { qty, workDate, note: p.note, kind: p.kind || 'progress', actorId: EQ.user().id, photos, nextDueOn: p.nextDueOn });
      bump(); audit('fac.progress +' + qty, job); EQ.notify();
      const res = { ok: true, job, update: up, completed: up.completes };
      if (p.key) D().idem[p.key] = { ...res };
      return res;
    },
    hold(jobId, reason) {
      const deny = EQ.access.srv('fac.work'); if (deny) return deny;
      const job = F.byId(jobId);
      if (job.state !== 'active') return fail(409, 'job_not_active', 'This job is not active.');
      if (job.isOnHold) return fail(409, 'job_on_hold', 'Already on hold.');
      if (!(reason || '').trim() || reason.trim().length > 500) return fail(422, 'reason_required', 'A reason is required (1 to 500 characters).', { reason: 'Enter why the job is on hold, e.g. Area not released by OPS.' });
      job.isOnHold = true; job.holdReason = reason.trim(); job.heldSince = new Date().toISOString(); job.holds.push({ kind: 'hold', reason: job.holdReason, actorId: EQ.user().id, at: job.heldSince });
      bump(); audit('fac.hold', job, reason); EQ.notify(); return { ok: true, job };
    },
    release(jobId) {
      const deny = EQ.access.srv('fac.work'); if (deny) return deny;
      const job = F.byId(jobId); if (!job.isOnHold) return fail(409, 'not_on_hold', 'The job is not on hold.');
      job.isOnHold = false; job.holds.push({ kind: 'release', reason: null, actorId: EQ.user().id, at: new Date().toISOString() }); job.holdReason = null;
      bump(); audit('fac.release', job); EQ.notify(); return { ok: true, job };
    },
    /** U1-C26: simulated PUT /fac/jobs/{jobId}/display (API s4.23). The shared "Show on dashboard" switch of one FAC job (any kind and
     *  state): fac.work (FAC Team and Admin); EQ Team and Management are refused. Changes no master field, cycle or progress; a hidden
     *  job leaves every FAC Dashboard block and stays in FAC Jobs, its timeline and the export. Audited; FacDataVersion + 1. */
    setVisibility(jobId, p) {
      const deny = EQ.access.srv('fac.work'); if (deny) return deny;
      const job = F.byId(jobId); if (!job) return fail(404, 'not_found', 'No such job.');
      if (typeof p.show !== 'boolean') return fail(422, 'validation_failed', 'Choose shown or hidden.', { show: 'Required.' });
      const before = F.shown(job);
      if (before === p.show) return { ok: true, job, unchanged: true };
      job.showOnDashboard = p.show;
      job.edits.unshift({ at: new Date().toISOString(), by: EQ.user().id, changes: [{ field: 'Show on dashboard', before: before ? 'Shown' : 'Hidden', after: p.show ? 'Shown' : 'Hidden' }], reason: (p.reason || '').trim() || null });
      bump(); D().audit.unshift({ at: new Date().toISOString(), by: EQ.user().id, action: 'fac.job.display', job: job.number, reason: (p.reason || '').trim() || null, before: { showOnDashboard: before }, after: { showOnDashboard: p.show } });
      EQ.log('audit: fac.job.display ' + job.number + ' ' + (p.show ? 'shown' : 'hidden')); EQ.notify(); return { ok: true, job };
    },
    /** Same-day undo of the author's own latest active update (DATA s17.6). */
    undo(jobId) {
      const deny = EQ.access.srv('fac.work'); if (deny) return deny;
      const job = F.byId(jobId);
      const act = job.updates.filter((u) => u.state === 'active').sort((a, b) => EQ.cmp(a.recordedUtc, b.recordedUtc));
      const last = act[act.length - 1];
      if (!last) return fail(404, 'not_found', 'No update to undo.');
      if (last.kind === 'importOpening') return fail(409, 'not_undoable', 'The imported opening quantity cannot be undone; ask an Admin for a correction.');
      if (last.actorId !== EQ.user().id && !EQ.access.srv('fac.work.admin')) return fail(403, 'not_update_author', 'You can undo only your own latest update.');
      if (last.actorId !== EQ.user().id) return fail(403, 'not_update_author', 'You can undo only your own latest update.');
      if (colomboDate(last.recordedUtc) !== todayStr()) return fail(409, 'undo_window_passed', 'The undo window closed at midnight Asia/Colombo. An Admin can correct this update.');
      if (last.completes && typeof last.cycleKey === 'number') {
        const next = job.cycles.find((c) => c.seq === last.cycleKey + 1);
        if (next && activeUps(job, next.seq).length) return fail(409, 'later_progress_exists', 'The next cycle already has progress.');
        if (next) next.state = 'voided';
        const cy = job.cycles.find((c) => c.seq === last.cycleKey); cy.state = 'open'; cy.completedOn = null; cy.version += 1;
        const prev = lastCompletedCycle(job); job.lastDoneOn = prev ? prev.completedOn : job.openingLastDoneOn;
        if (job.state === 'closed') job.state = 'active';
      }
      last.state = 'undone'; last.undoneUtc = new Date().toISOString(); last.photos.forEach((p) => { p.state = 'removed'; p.removedReason = 'undo'; });
      if (typeof last.cycleKey === 'string') job.periodVersions[last.cycleKey] = (job.periodVersions[last.cycleKey] || 0) + 1;
      bump(); audit('fac.undo', job); EQ.notify(); return { ok: true, job };
    },
    /** Add a job: recurring needs fac.masterList.manage, one-time needs fac.oneTimeJobs.add (DATA s17.2). */
    createJob(p) {
      const needed = p.kind === 'oneTime' ? 'fac.oneTimeJobs.add' : 'fac.masterList.manage';
      const deny = EQ.access.srv(needed); if (deny) return deny;
      const f = {};
      if (!DISC.some((d) => d[0] === p.discipline)) f.discipline = 'Choose a discipline.';
      if (!F.TYPE_NAME[p.typeCode]) f.typeCode = 'Choose Inspection or Service.';
      if (!(p.name || '').trim()) f.name = 'Enter the job name.'; else if (p.name.length > 200) f.name = 'At most 200 characters.';
      const q = Number(p.quantity || 1); if (!Number.isInteger(q) || q < 1) f.quantity = 'Quantity must be a whole number of 1 or more.';
      if (p.kind !== 'oneTime' && !p.freqCode) f.freqCode = 'Choose a frequency.';
      if (p.kind === 'continuous' && D().frequencies.find((x) => x.code === p.freqCode) && D().frequencies.find((x) => x.code === p.freqCode).basis === 'period') f.kind = 'A Daily or Weekly frequency is only for recurring jobs (422 kind_frequency_mismatch).';
      if (p.picProfileId && p.picName) f.pic = 'Choose a user or type a name, not both.';
      if (p.lastDoneOn && (!validDate(p.lastDoneOn) || p.lastDoneOn > todayStr())) f.lastDoneOn = 'Enter a past or current date.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const job = { id: 'fj-n' + (D().seq++), number: 'FAC-' + String(D().jobs.length + 1).padStart(5, '0'), sourceRow: null, split: null, discipline: p.discipline, typeCode: p.typeCode, name: p.name.trim(), freqCode: p.kind === 'oneTime' ? 'as-required' : p.freqCode, freqText: '', kind: p.kind, quantity: q, picName: (p.picName || '').trim() || null, picProfileId: p.picProfileId || null, mode: p.mode || null, lastDoneOn: p.kind === 'oneTime' ? null : p.lastDoneOn || null, openingLastDoneOn: p.lastDoneOn || null, remarks: (p.remarks || '').trim() || null,
        state: 'active', isOnHold: false, holdReason: null, heldSince: null, origin: 'user', issues: [], cycles: [], updates: [], holds: [], corrections: [], edits: [], periodVersions: {}, picture: null, synthetic: {}, createdBy: EQ.user().id, createdUtc: new Date().toISOString(), showOnDashboard: p.showOnDashboard !== false };
      D().jobs.unshift(job); openFirstCycle(job, 'jobCreated'); bump(); audit('fac.job.create', job); EQ.notify(); return { ok: true, job };
    },
    updateJob(jobId, p) {
      const job = F.byId(jobId); if (!job) return fail(404, 'not_found', 'No such job.');
      const manage = !EQ.access.srv('fac.masterList.manage');
      const ownOneTime = job.kind === 'oneTime' && job.createdBy === EQ.user().id && !EQ.access.srv('fac.oneTimeJobs.add') && !job.updates.some((u) => u.state === 'active');
      if (!manage && !ownOneTime) return EQ.access.srv('fac.masterList.manage') || fail(403, 'forbidden', 'You cannot edit this job.');
      if (job.state === 'deactivated') return fail(409, 'job_not_active', 'Reactivate the job before editing it.');
      const f = {}; const hasProgress = job.updates.some((u) => u.state === 'active' && u.kind !== 'importOpening') || job.cycles.some((c) => c.state === 'completed');
      if (p.name != null && !p.name.trim()) f.name = 'Enter the job name.';
      if (p.quantity != null) { const q = Number(p.quantity); const cur = F.current(job); if (!Number.isInteger(q) || q < 1) f.quantity = 'Quantity must be a whole number of 1 or more.'; else if (q < cur.done) f.quantity = 'Quantity cannot be below the progress already recorded (' + cur.done + ') (409 quantity_below_progress).'; }
      if (p.kind != null && p.kind !== job.kind && hasProgress) f.kind = 'The kind can change only while the job has no progress (F6).';
      if (p.lastDoneOn !== undefined && p.lastDoneOn !== job.lastDoneOn && job.cycles.some((c) => c.state === 'completed')) f.lastDoneOn = 'The last done date changes only through a completed cycle once one exists (F5).';
      if (p.picProfileId && p.picName) f.pic = 'Choose a user or type a name, not both.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const changes = [];
      const set = (k, v, label) => { if (v !== undefined && v !== job[k]) { changes.push({ field: label || k, before: job[k] == null ? '(blank)' : String(job[k]), after: v == null ? '(blank)' : String(v) }); job[k] = v; } };
      set('name', p.name == null ? undefined : p.name.trim(), 'Name'); set('discipline', p.discipline, 'Discipline'); set('typeCode', p.typeCode, 'Type'); set('mode', p.mode === '' ? null : p.mode, 'In-house/Outsource'); set('remarks', p.remarks === undefined ? undefined : p.remarks || null, 'Remarks');
      if (p.picName !== undefined || p.picProfileId !== undefined) { set('picName', (p.picName || '').trim() || null, 'PIC (typed name)'); set('picProfileId', p.picProfileId || null, 'PIC (user)'); }
      if (p.quantity != null) { set('quantity', Number(p.quantity), 'Quantity'); const open = job.cycles.find((c) => c.state === 'open'); if (open) open.target = job.quantity; }
      if (p.freqCode !== undefined && p.freqCode !== job.freqCode) { set('freqCode', p.freqCode, 'Frequency'); const open = job.cycles.find((c) => c.state === 'open'); const fr = freq(job); if (open && !activeUps(job, open.seq).length && fr && fr.kind === 'interval' && job.lastDoneOn) { open.dueOn = fr.intervalMonths ? addMonths(job.lastDoneOn, fr.intervalMonths) : addDays(job.lastDoneOn, fr.intervalDays); open.dueBasis = 'lastDonePlusInterval'; } }
      if (p.lastDoneOn !== undefined && p.lastDoneOn !== job.lastDoneOn) { set('lastDoneOn', p.lastDoneOn || null, 'Last done'); const open = job.cycles.find((c) => c.state === 'open'); const fr = freq(job); if (open && !activeUps(job, open.seq).length && fr && fr.kind === 'interval' && job.lastDoneOn) { open.dueOn = fr.intervalMonths ? addMonths(job.lastDoneOn, fr.intervalMonths) : addDays(job.lastDoneOn, fr.intervalDays); open.dueBasis = 'lastDonePlusInterval'; } }
      if (!changes.length) return { ok: true, job, unchanged: true };
      job.edits.unshift({ at: new Date().toISOString(), by: EQ.user().id, changes }); bump(); audit('fac.job.edit', job); EQ.notify(); return { ok: true, job };
    },
    deactivate(jobId, reason) {
      const deny = EQ.access.srv('fac.masterList.manage'); if (deny) return deny;
      const job = F.byId(jobId); if (!(reason || '').trim()) return fail(422, 'reason_required', 'A reason is required.', { reason: 'Enter a reason.' });
      job.state = 'deactivated'; job.deactivatedReason = reason.trim(); job.edits.unshift({ at: new Date().toISOString(), by: EQ.user().id, changes: [{ field: 'State', before: 'active', after: 'deactivated (' + reason.trim() + ')' }] });
      bump(); audit('fac.job.deactivate', job, reason); EQ.notify(); return { ok: true };
    },
    reactivate(jobId) {
      const deny = EQ.access.srv('fac.masterList.manage'); if (deny) return deny;
      const job = F.byId(jobId); job.state = job.cycles.every((c) => c.state === 'completed') && job.kind !== 'recurring' ? 'closed' : 'active'; job.edits.unshift({ at: new Date().toISOString(), by: EQ.user().id, changes: [{ field: 'State', before: 'deactivated', after: job.state }] });
      bump(); audit('fac.job.reactivate', job); EQ.notify(); return { ok: true };
    },
    /** Admin correction (fac.work.admin): previous values stay in the correction record. items: [{ type, updateId, qty, workDate, dueOn }] */
    correct(jobId, p) {
      const deny = EQ.access.srv('fac.work.admin'); if (deny) return deny;
      const job = F.byId(jobId);
      if (!(p.reason || '').trim()) return fail(422, 'reason_required', 'A reason is required for every correction.', { reason: 'Enter the reason.' });
      const items = [], f = {};
      (p.items || []).forEach((it) => {
        const up = it.updateId && job.updates.find((u) => u.id === it.updateId);
        if (it.type === 'quantity' && up) {
          const n = Number(it.qty); const others = sumQ(activeUps(job, up.cycleKey).filter((u) => u !== up)); const cap = (typeof up.cycleKey === 'number' ? (job.cycles.find((c) => c.seq === up.cycleKey) || {}).target : job.quantity) || job.quantity;
          if (!Number.isInteger(n) || n < 1 || others + n > cap) { f.qty = 'The cycle total must stay within 1 and ' + cap + '.'; return; }
          const cyc = typeof up.cycleKey === 'number' ? job.cycles.find((c) => c.seq === up.cycleKey) : null;
          if (cyc && cyc.state === 'completed' && others + n !== cap) { f.qty = 'The cycle is completed: the total must stay equal to ' + cap + ' (reopen the cycle first).'; return; }
          items.push({ entity: 'update ' + up.id, field: 'Quantity', before: up.qty, after: n }); up.qty = n;
        } else if (it.type === 'workDate' && up) {
          if (!validDate(it.workDate) || it.workDate > todayStr()) { f.workDate = 'Enter a past or current date.'; return; }
          items.push({ entity: 'update ' + up.id, field: 'Work date', before: up.workDate || '(import)', after: it.workDate }); up.workDate = it.workDate;
        } else if (it.type === 'void' && up) {
          const cyc = typeof up.cycleKey === 'number' ? job.cycles.find((c) => c.seq === up.cycleKey) : null;
          if (cyc && cyc.state === 'completed') { f.void = 'The cycle is completed: reopen it before voiding an update.'; return; }
          items.push({ entity: 'update ' + up.id, field: 'State', before: 'active (' + up.qty + ')', after: 'voidedByCorrection' }); up.state = 'voidedByCorrection';
        } else if (it.type === 'dueOn') {
          const cyc = job.cycles.find((c) => c.state === 'open'); if (!cyc) { f.dueOn = 'No open cycle.'; return; }
          if (!validDate(it.dueOn)) { f.dueOn = 'Enter a date.'; return; }
          items.push({ entity: 'cycle ' + cyc.seq, field: 'Due date', before: cyc.dueOn || '(none)', after: it.dueOn + ' (Admin-entered)' }); cyc.dueOn = it.dueOn; cyc.dueBasis = 'adminEntered';
        } else if (it.type === 'reopen') {
          const cyc = [...job.cycles].reverse().find((c) => c.state === 'completed'); if (!cyc) { f.reopen = 'No completed cycle.'; return; }
          const next = job.cycles.find((c) => c.seq === cyc.seq + 1);
          if (next && activeUps(job, next.seq).length) { f.reopen = 'The following cycle already has progress; correct that first.'; return; }
          if (next) next.state = 'voided';
          items.push({ entity: 'cycle ' + cyc.seq, field: 'State', before: 'completed on ' + cyc.completedOn, after: 'reopened' }); cyc.state = 'open'; cyc.completedOn = null; cyc.version += 1;
          const pv = lastCompletedCycle(job); job.lastDoneOn = pv ? pv.completedOn : job.openingLastDoneOn; if (job.state === 'closed') job.state = 'active';
        }
      });
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was changed.', f);
      if (!items.length) return fail(422, 'validation_failed', 'Choose at least one correction.', { items: 'Add a correction item.' });
      job.corrections.unshift({ n: job.corrections.length + 1, reason: p.reason.trim(), by: EQ.user().id, at: new Date().toISOString(), items });
      bump(); audit('fac.correction', job, p.reason); EQ.notify(); return { ok: true, job };
    },
    saveSettings(p) {
      const deny = EQ.access.srv('admin.access'); if (deny) return deny;
      const f = {}; const n = (v) => Number(v);
      if (!(Number.isInteger(n(p.dueSoonDays)) && n(p.dueSoonDays) >= 1 && n(p.dueSoonDays) <= 60)) f.dueSoonDays = 'Due-soon window must be 1 to 60 days.';
      if (!(Number.isInteger(n(p.refreshSeconds)) && n(p.refreshSeconds) >= 30 && n(p.refreshSeconds) <= 600)) f.refreshSeconds = 'Refresh must be 30 to 600 seconds.';
      if (!(n(p.scrollPxPerSec) >= 5 && n(p.scrollPxPerSec) <= 80)) f.scrollPxPerSec = 'Scroll speed must be 5 to 80 pixels per second.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      Object.assign(D().settings, { dueSoonDays: n(p.dueSoonDays), refreshSeconds: n(p.refreshSeconds), scrollPxPerSec: n(p.scrollPxPerSec) });
      bump(); audit('fac.settings'); EQ.notify(); return { ok: true };
    },
    setPicture(jobId, photo) {
      const deny = EQ.access.srv('fac.work'); if (deny) return deny;
      const job = F.byId(jobId); if (job.picture) job.picture.state = 'replaced';
      job.picture = { ...photo, purpose: 'jobPicture', by: EQ.user().id }; bump(); audit('fac.picture', job); EQ.notify(); return { ok: true };
    },
    removePhoto(jobId, updateId, photoId, reason) {
      const job = F.byId(jobId), up = job.updates.find((u) => u.id === updateId), ph = up && up.photos.find((p) => p.id === photoId);
      if (!ph) return fail(404, 'not_found', 'No such photo.');
      const admin = !EQ.access.srv('fac.work.admin');
      const own = !EQ.access.srv('fac.work') && up.actorId === EQ.user().id && colomboDate(up.recordedUtc) === todayStr();
      if (!admin && !own) return EQ.access.srv('fac.work') || fail(403, 'forbidden', 'Only the uploader on the same day, or an Admin with a reason, can remove a photo.');
      if (admin && !own && !(reason || '').trim()) return fail(422, 'reason_required', 'A reason is required.', { reason: 'Enter a reason.' });
      ph.state = 'removed'; ph.removedReason = (reason || 'removed by uploader').trim(); bump(); audit('fac.photo.remove', job, reason); EQ.notify(); return { ok: true };
    },
  };

  /** Simulated arrival of another user's update (for the prototype control and the glow/refresh checks). */
  F.simulateArrival = function simulateArrival(spec) {
    const d = D(); spec = spec || {};
    const cands = d.jobs.filter((j) => j.state === 'active' && !j.isOnHold && !isPeriod(j) && F.current(j).done < F.current(j).target - 1 && (!spec.discipline || j.discipline === spec.discipline));
    const j = spec.jobId ? F.byId(spec.jobId) : cands[(d.version * 7) % cands.length];
    if (!j) return null;
    const c = F.current(j); const qty = spec.qty || Math.max(1, Math.min(c.target - c.done - 1, Math.ceil(c.target * 0.15)));
    const up = applyProgress(j, { qty, workDate: todayStr(), kind: 'progress', note: 'Arrived from another user (prototype simulation)', actorId: F.USERS.c.id, recordedUtc: new Date().toISOString(), photos: spec.photo ? [newPhoto(j.name, F.USERS.c.id)] : [] });
    bump(); EQ.log('simulated: ' + F.USERS.c.name + ' recorded +' + qty + ' on ' + j.number); EQ.notify(); return { job: j, update: up };
  };
  F.newPhoto = newPhoto;
})(window.EQ);
