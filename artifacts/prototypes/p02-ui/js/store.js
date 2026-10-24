/* In-memory prototype store and a simulated "server rule" layer.
   NOTHING here is persisted: a page reload restores the synthetic fixtures. The rule functions exist so the forms and
   the (non-draggable) job actions go through one path, as the production API contract (docs/API_CONTRACT.md) requires. */
window.EQ = window.EQ || {};
(function (EQ) {
  const S = (EQ.state = {
    role: 'eqTeam', data: 'normal', viewer: 'preview', conflictNext: false, slowHistory: false,
    D: null, refreshedAt: Date.now(), lastGoodAt: Date.now(), failedAt: null,
    expanded: new Set(), log: [], webgl: null,
  });
  const subs = [];
  EQ.subscribe = (fn) => subs.push(fn);
  EQ.notify = () => subs.forEach((f) => f());
  EQ.log = (msg) => { S.log.unshift(EQ.fmtTime(Date.now()) + '  ' + msg); S.log.length = Math.min(S.log.length, 60); };
  // U1-C22: the approved catalogue as loaded; a fixtures reset restores it in place (Admin additions and edits are in memory only).
  const CAT0 = JSON.stringify(EQ.catalog || { mains: [], subs: [] });
  const restoreCatalog = () => { const c = JSON.parse(CAT0); EQ.catalog.mains.splice(0, EQ.catalog.mains.length, ...c.mains); EQ.catalog.subs.splice(0, EQ.catalog.subs.length, ...c.subs); };
  EQ.reset = () => { restoreCatalog(); S.D = EQ.buildFixtures(); EQ.buildV2(S.D); EQ.access.refreshSession('fixtures reset'); S.expanded = new Set(); S.refreshedAt = Date.now(); S.lastGoodAt = Date.now(); EQ.log('Fixtures reset (synthetic data restored)'); };

  EQ.user = () => EQ.USERS[S.role];
  // Server-side checks use the live Access matrix (EQ.access.srv); EQ.perm.* is what the UI shows from its session snapshot.
  const isWriter = () => !EQ.access.srv('eq.work');
  const isAdmin = () => !EQ.access.srv('eq.work.admin');
  const isCfgAdmin = () => !EQ.access.srv('admin.access'); // configuration endpoints (API s4.12, s4.13, s4.19)
  EQ.perm = {
    write: () => EQ.access.has('eq.work'), admin: () => EQ.access.has('eq.work.admin'),
    /** Cancel: Admin any uncompleted job; EQ Team only own jobs and never a reopened (previously completed) job. */
    cancel(job) {
      if (job.isCancelled || job.workStatus === 'completed') return { ok: false, why: 'Completed or already cancelled work cannot be cancelled. Completed work uses the Admin correction path.' };
      if (isAdmin()) {
        if (job.reopenCount > 0 && job.lines.some((l) => l.state === 'committed')) return { ok: false, why: 'Reopened job with committed replacement lines: void them by correction first.' };
        return { ok: true };
      }
      if (!isWriter()) return { ok: false, why: 'Read-only access.' };
      if (job.reopenCount > 0) return { ok: false, why: 'Previously completed work: only Admin can cancel it.' };
      if (job.createdBy !== EQ.user().id) return { ok: false, why: 'EQ Team can cancel only jobs they created (this job was created by ' + EQ.userName(job.createdBy) + ').' };
      return { ok: true };
    },
  };

  // ---- selectors ----
  EQ.eq = (id) => S.D.equipment.find((e) => e.id === id);
  EQ.model = (code) => S.D.models.find((m) => m.code === code);
  EQ.pos = (id) => S.D.positions.find((p) => p.id === id);
  EQ.job = (id) => S.D.jobs.find((j) => j.id === id);
  EQ.mainDef = (code) => EQ.catalog.mains.find((m) => m.code === code);
  EQ.subDef = (code) => EQ.catalog.subs.find((s) => s.code === code);
  EQ.defLabel = (code) => {
    const m = EQ.mainDef(code) || EQ.subDef(code);
    return m ? m.name || 'Reserved (no name)' : code;
  };
  EQ.positionsOf = (eqId) => S.D.positions.filter((p) => p.equipmentId === eqId);
  EQ.jobsOf = (eqId, includeCancelled) => S.D.jobs.filter((j) => j.equipmentId === eqId && (includeCancelled || !j.isCancelled));
  EQ.openJobs = (eqId) => EQ.jobsOf(eqId).filter((j) => j.workStatus !== 'completed');
  EQ.verified = (eq) => eq.assoc === 'verified' && !!eq.modelCode;
  EQ.currentUserCanSeeAdmin = () => isAdmin();
  EQ.fleetCounts = (list) => {
    const c = { readyForOps: 0, breakdown: 0, maintenance: 0, unreported: 0, total: 0 };
    list.filter((e) => e.lifecycle === 'active').forEach((e) => { c[EQ.statusKey(e.status)] += 1; c.total += 1; });
    return c;
  };
  EQ.inStatusFor = (eq) => (eq.status && eq.statusSince ? Date.now() - new Date(eq.statusSince).getTime() : null);

  /** Human path of a job target. */
  EQ.targetLabel = (job) => {
    const eq = EQ.eq(job.equipmentId);
    if (job.level === 'equipment') return 'Whole equipment (' + eq.code + ')';
    const parts = [];
    const main = eq.mains.find((m) => m.id === job.mainId); if (main) parts.push(EQ.defLabel(main.code) + ' (' + main.code + ')');
    const sub = eq.subs.find((s) => s.id === job.subId); if (sub) parts.push(EQ.defLabel(sub.code) + ' (' + sub.code + ')');
    const p = job.positionId && EQ.pos(job.positionId); if (p) parts.push(p.name);
    return parts.join(' / ');
  };

  /** Scope rows (DATA_CONTRACT s9): direct + descendant jobs, de-duplicated, with matching lines. Internal: the two simulated read
   *  endpoints below apply the Access matrix before returning any of it (Repair-R02B finding 1, API s2 / s4.6 / s4.16, D-139). */
  const scoped = (eqId, scope, includeCancelled) => {
    const jobs = EQ.jobsOf(eqId, includeCancelled);
    // A physical area is a read filter over bound positions, never a new work/history owner.
    const areaIds = scope.level === 'area' ? new Set((EQ.qc?.containerPositions(EQ.eq(eqId), scope.id) || []).map((p) => p.id)) : null;
    const inScope = (l) => {
      const p = EQ.pos(l.positionId);
      if (areaIds) return areaIds.has(p?.id);
      if (scope.level === 'equipment') return true;
      if (scope.level === 'main') return p.mainId === scope.id;
      if (scope.level === 'sub') return p.subId === scope.id;
      return p.id === scope.id;
    };
    const hit = (j) => {
      if (scope.level === 'equipment') return true;
      if (areaIds) return areaIds.has(j.positionId) || j.lines.some((l) => l.state === 'committed' && inScope(l));
      const direct = scope.level === 'main' ? j.mainId === scope.id : scope.level === 'sub' ? j.subId === scope.id : j.positionId === scope.id;
      return direct || j.lines.some((l) => l.state === 'committed' && inScope(l));
    };
    const rows = jobs.filter(hit).map((j) => ({ job: j, matchingLines: j.lines.filter((l) => l.state === 'committed' && inScope(l)) }));
    const open = rows.filter((r) => r.job.workStatus !== 'completed').sort((a, b) => EQ.cmp(a.job.plannedOn || '9999', b.job.plannedOn || '9999'));
    const completed = rows.filter((r) => r.job.workStatus === 'completed').sort((a, b) => EQ.cmp(b.job.completedOn, a.job.completedOn));
    const out = { equipmentId: eqId, scope, open, completed, events: [], current: null, statusChanges: [] };
    if (scope.level === 'part') {
      out.events = S.D.events.filter((e) => e.positionId === scope.id).sort((a, b) => b.seq - a.seq);
      out.current = out.events.find((e) => !e.voided) || null;
    }
    if (scope.level === 'equipment') out.statusChanges = S.D.statusChanges.filter((c) => c.equipmentId === eqId).sort((a, b) => b.seq - a.seq);
    out.empty = !open.length && !completed.length && !out.events.length;
    return out;
  };
  const readDeny = (f) => { const d = EQ.access.srv(f); if (d) EQ.log('server refused a read: ' + d.status + ' ' + d.code + ' (' + f + ')'); return d; };
  /** Simulated GET /equipment/{id}/history (API s4.6): the EQ Jobs tab's scoped history. Needs eq.jobs.view on the live matrix;
   *  otherwise the refusal object (403 feature_disabled / forbidden_role) and no data at all. */
  EQ.history = (eqId, scope, includeCancelled) => readDeny('eq.jobs.view') || { ok: true, ...scoped(eqId, scope, includeCancelled) };
  /** U1-C26: a special job is shown on the dashboards / crane view unless the shared "Show on dashboard / 3D" switch is off. */
  EQ.shownOnDashboard = (j) => j.showOnDashboard !== false;
  EQ.CURRENT_COMPLETED_LIMIT = 50;
  const colomboDay = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date(iso));
  /** Simulated GET /equipment/{id}/current-state/special (API s4.16): what the crane view may read with eq.fleet.view only.
   *  U1-C23: `jobs` lists the open AND completed (non-cancelled) special jobs of the scope, newest first (listedOn = completion date of
   *  a completed job, creation business date of an open one), at most 50 completed (`moreCompleted`); cancelled jobs are counted only.
   *  U1-C26: jobs whose "Show on dashboard / 3D" switch is off are left out of the list and of every count (they stay in the Jobs tab).
   *  Explicit CurrentSpecialJob allowlist: no description, completion note, completer, events, corrections, evidence or installation
   *  details, also for completed and reopened jobs. `openJobs` is the open subset (tree/label/fleet badges). */
  EQ.currentSpecial = (eqId, scope) => {
    const deny = readDeny('eq.fleet.view'); if (deny) return deny;
    const H = scoped(eqId, scope, true);
    const shown = (r) => EQ.shownOnDashboard(r.job);
    const rows = [...H.open, ...H.completed].filter(shown);
    const open = H.open.filter((r) => !r.job.isCancelled && shown(r));
    const completed = H.completed.filter((r) => !r.job.isCancelled && shown(r));
    const project = ({ job: j, matchingLines }) => ({
      job: { id: j.id, number: j.number, equipmentId: j.equipmentId, level: j.level, mainId: j.mainId, subId: j.subId,
        positionId: j.positionId, kind: j.kind, title: j.title, workStatus: j.workStatus, plannedOn: j.plannedOn,
        completedOn: j.workStatus === 'completed' ? j.completedOn : null, listedOn: j.workStatus === 'completed' ? j.completedOn : colomboDay(j.createdUtc) },
      matchingLines: matchingLines.map((l) => ({ positionId: l.positionId })),
    });
    const byNewest = (a, b) => EQ.cmp(b.job.listedOn || '', a.job.listedOn || '') || EQ.cmp(b.job.number, a.job.number);
    const listedCompleted = completed.map(project).sort(byNewest);
    const jobs = [...open.map(project), ...listedCompleted.slice(0, EQ.CURRENT_COMPLETED_LIMIT)].sort(byNewest);
    return { ok: true, equipmentId: eqId, scope: { level: scope.level, id: scope.id }, jobs, moreCompleted: listedCompleted.length > EQ.CURRENT_COMPLETED_LIMIT,
      openJobs: jobs.filter((r) => r.job.workStatus !== 'completed'),
      counts: { pending: open.filter((r) => r.job.workStatus === 'pending').length, current: open.filter((r) => r.job.workStatus === 'current').length,
        completed: completed.length, cancelled: rows.filter((r) => r.job.isCancelled).length },
      openInJobs: EQ.access.srv('eq.jobs.view') ? null : { equipment: eqId, scope: scope.level, target: scope.id || null } };
  };
  /** Fleet cards and crane work markers (U1-C26): open, non-cancelled special jobs that are shown on the dashboard / 3D. */
  EQ.shownOpenJobs = (eqId) => EQ.openJobs(eqId).filter(EQ.shownOnDashboard);
  /** Simulated GET /jobs and GET /jobs/{id} (API s4.7): EQ Jobs tab records, eq.jobs.view only. */
  EQ.readJobs = () => readDeny('eq.jobs.view') || { ok: true, items: S.D.jobs.slice() };
  // Percentage is recorded explicitly; never infer a made-up percentage for Current jobs.
  EQ.jobProgress = (job) => {
    const completed = job.workStatus === 'completed' && !job.isCancelled;
    return { percent: completed ? 100 : Number.isInteger(job.progressPercent) ? job.progressPercent : job.workStatus === 'pending' ? 0 : null,
      workDate: job.progressUpdatedOn || (completed ? job.completedOn : null), note: job.progressNote || (completed ? job.completionNote : '') || '' };
  };
  EQ.readJob = (id) => readDeny('eq.jobs.view') || (EQ.job(id) ? { ok: true, job: EQ.job(id) } : { ok: false, status: 404, code: 'not_found', message: 'No job with this link exists (404).' });
  /** Open-job count for the crane-view tree badges (current state only). */
  EQ.openCount = (eqId, scope) => { const r = EQ.currentSpecial(eqId, scope); return r.ok ? r.openJobs.length : 0; };

  // ---- simulated server rules ----
  const fail = (status, code, message, fields) => ({ ok: false, status, code, message, fields: fields || {} });
  const audit = (action, entity, reason, changes) => { S.D.audit.unshift({ at: new Date().toISOString(), by: EQ.user().id, action, entity, reason: reason || null, ...changes }); EQ.log('audit: ' + action + ' ' + entity); };
  const forbid = () => fail(403, 'forbidden', 'The server refuses this request for your role (' + (EQ.PERSONAS[S.role] ? EQ.PERSONAS[S.role].label : S.role) + '). Hidden buttons are not authorization.');
  const validDate = (v, { allowFuture } = {}) => {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v < '2000-01-01' || (!allowFuture && v > EQ.todayColombo())) return false;
    const date = new Date(v + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
  };

  EQ.api = {
    /** U1-C50: versioned, retry-safe EQ percentage update. 100% uses atomic completion. */
    updateJobProgress(id, p) {
      if (!isWriter()) return forbid();
      p = p || {};
      const job = EQ.job(id);
      if (!job) return fail(404, 'not_found', 'Job not found.');
      if (typeof p.key !== 'string' || !p.key.trim() || p.key.length > 128) return fail(422, 'validation_failed', 'A request key is required.');
      const key = 'job-progress:' + id + ':' + p.key;
      if (S.D.idem[key]) return { ...JSON.parse(JSON.stringify(S.D.idem[key])), replayed: true };
      if (job.isCancelled || job.workStatus === 'completed') return fail(409, 'job_not_editable', 'Completed or cancelled jobs cannot receive progress updates.');
      if (EQ.eq(job.equipmentId).lifecycle !== 'active') return fail(409, 'equipment_retired', 'Retired equipment cannot receive progress updates.');
      if (p.version !== job.version) return fail(409, 'version_conflict', 'This job changed. Close the form and reopen Update progress to use the latest values.');
      const f = {};
      if (typeof p.percent !== 'number' || !Number.isInteger(p.percent) || p.percent < 0 || p.percent > 100) f.percent = 'Enter a whole percentage from 0 to 100.';
      if (!validDate(p.workDate)) f.workDate = 'Enter a valid work date that is not in the future.';
      const lastDate = job.progressUpdatedOn || (job.reopenCount ? job.completedOn : null);
      if (!f.workDate && lastDate && p.workDate < lastDate) f.workDate = 'Work date cannot be before the latest recorded progress or completion.';
      if (typeof p.note !== 'string' || !p.note.trim() || p.note.length > 2000) f.note = 'Enter a progress note (up to 2000 characters).';
      if (p.percent === 100 && p.lines != null && (!Array.isArray(p.lines) || p.lines.some((l) => !l || typeof l !== 'object' || typeof l.desc !== 'string' || typeof l.on !== 'string' || (l.removedKnown === 'yes' && typeof l.removedDesc !== 'string')))) f.lines = 'Enter valid replacement details.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Check the highlighted fields.', f);
      if (p.percent === 100) {
        const res = EQ.api.completeJob(id, { key, version: p.version, completedOn: p.workDate, note: p.note, lines: p.lines || [] });
        if (res.ok) S.D.idem[key] = JSON.parse(JSON.stringify(res));
        return res;
      }
      const before = EQ.jobProgress(job), fromStatus = job.workStatus, now = new Date().toISOString();
      job.progressPercent = p.percent; job.progressUpdatedOn = p.workDate; job.progressNote = p.note.trim();
      if (p.percent > 0) job.workStatus = 'current';
      job.version += 1; job.updatedUtc = now; EQ.eq(job.equipmentId).lastActivity = now;
      job.events.push({ kind: 'progressUpdated', at: now, by: EQ.user().id, workDate: p.workDate, percent: p.percent, previousPercent: before.percent, fromStatus, toStatus: job.workStatus, note: job.progressNote });
      audit('job.progress', job.number, job.progressNote, { before, after: EQ.jobProgress(job) });
      const res = { ok: true, job, statusUnchanged: EQ.eq(job.equipmentId).status };
      S.D.idem[key] = JSON.parse(JSON.stringify(res)); EQ.notify(); return res;
    },
    createJob(p) {
      if (!isWriter()) return forbid();
      const f = {};
      const eq = p.equipmentId && EQ.eq(p.equipmentId);
      if (!eq) f.equipmentId = 'Choose an equipment item.';
      else if (eq.lifecycle === 'retired') f.equipmentId = 'Retired equipment accepts no new jobs.';
      if (!p.kind) f.kind = 'Choose Repair or Replacement.';
      if (!p.title || !p.title.trim()) f.title = 'Enter a title.'; else if (p.title.length > 200) f.title = 'Title can have at most 200 characters.';
      if (p.plannedOn && !validDate(p.plannedOn, { allowFuture: true })) f.plannedOn = 'Enter a valid date.';
      let mainId = null, subId = null, positionId = null;
      if (eq && p.level !== 'equipment') {
        if (p.level === 'part') {
          const pos = EQ.pos(p.positionId);
          if (!pos || pos.equipmentId !== eq.id) f.target = 'That part position does not belong to this equipment (422 target_not_in_equipment).';
          else if (pos.state !== 'active') f.target = 'Only confirmed (active) positions can be targeted.';
          else { positionId = pos.id; subId = pos.subId; mainId = pos.mainId; }
        } else if (p.level === 'sub') {
          const s = eq.subs.find((x) => x.id === p.subId);
          if (!s) f.target = 'Choose a submechanism of this equipment.'; else { subId = s.id; mainId = s.mainId; }
        } else if (p.level === 'main') {
          const m = eq.mains.find((x) => x.id === p.mainId);
          if (!m) f.target = 'Choose a main mechanism of this equipment.'; else mainId = m.id;
        }
      }
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Some fields need attention.', f);
      const n = 100 + S.D.jobs.length + 50;
      const job = {
        id: 'job-' + n + '-' + S.D.jobs.length, number: 'EQJ-2026-000' + n, equipmentId: eq.id, level: p.level || 'equipment', mainId, subId, positionId,
        kind: p.kind, title: p.title.trim(), description: p.description || '', priority: p.priority || null, plannedOn: p.plannedOn || null, responsible: p.responsible || null,
        workStatus: p.initialStatus === 'current' ? 'current' : 'pending', completedOn: null, completionNote: null,
        progressPercent: p.initialStatus === 'current' ? null : 0, progressUpdatedOn: null, progressNote: null,
        isCancelled: false, cancelReason: null, cancelledBy: null, cancelledUtc: null,
        createdBy: EQ.user().id, createdUtc: new Date().toISOString(), updatedUtc: new Date().toISOString(), reopenCount: 0, version: 1, lines: [], showOnDashboard: p.showOnDashboard !== false, // U1-C26 default shown
        events: [{ kind: 'created', at: new Date().toISOString(), by: EQ.user().id, note: null }], corrections: [],
      };
      S.D.jobs.unshift(job); eq.lastActivity = job.createdUtc;
      audit('job.create', job.number); EQ.notify();
      return { ok: true, job };
    },
    updateJob(id, p) {
      if (!isWriter()) return forbid();
      const job = EQ.job(id);
      if (job.workStatus === 'completed' || job.isCancelled) return fail(409, 'job_not_editable', 'Completed or cancelled work is not edited here. Admin uses the correction path.');
      if (S.conflictNext) {
        S.conflictNext = false;
        const before = { title: job.title, plannedOn: job.plannedOn, description: job.description };
        job.version += 1; job.plannedOn = '2026-11-30'; job.title = job.title.replace(/ \(updated by B\)$/, '') + ' (updated by B)';
        job.events.push({ kind: 'edited', at: new Date().toISOString(), by: 'u-eq-b', note: 'Changed title and planned date' });
        EQ.log('simulated: another user saved ' + job.number + ' first (version ' + (job.version - 1) + ' -> ' + job.version + ')');
        EQ.notify();
        return { ok: false, status: 409, code: 'version_conflict', message: 'Another user changed this job after you opened it. Nothing of yours was lost: review the current values below.', current: { ...job }, before };
      }
      if (p.version !== job.version) return fail(409, 'version_conflict', 'This job changed since you opened it.', {});
      const f = {};
      if (!p.title || !p.title.trim()) f.title = 'Enter a title.';
      if (p.plannedOn && !validDate(p.plannedOn, { allowFuture: true })) f.plannedOn = 'Enter a valid date.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Some fields need attention.', f);
      Object.assign(job, { title: p.title.trim(), description: p.description || '', priority: p.priority || null, plannedOn: p.plannedOn || null, responsible: p.responsible || null });
      job.version += 1; job.updatedUtc = new Date().toISOString();
      job.events.push({ kind: 'edited', at: job.updatedUtc, by: EQ.user().id, note: null });
      audit('job.edit', job.number); EQ.notify();
      return { ok: true, job };
    },
    moveJob(id, to) { // start / return to pending
      if (!isWriter()) return forbid();
      const job = EQ.job(id);
      if (job.workStatus === 'completed' || job.isCancelled) return fail(409, 'invalid_transition', 'This job cannot move to ' + to + '.');
      job.workStatus = to; job.version += 1;
      job.events.push({ kind: to === 'current' ? 'started' : 'returnedToPending', at: new Date().toISOString(), by: EQ.user().id, note: null });
      audit('job.' + (to === 'current' ? 'start' : 'return'), job.number); EQ.notify();
      return { ok: true, job };
    },
    cancelJob(id, reason) {
      const job = EQ.job(id);
      const pr = EQ.perm.cancel(job);
      if (!pr.ok) return fail(pr.why.startsWith('Read-only') ? 403 : 409, pr.why.startsWith('Read-only') ? 'forbidden' : 'cancel_not_allowed', pr.why);
      if (!reason || reason.trim().length < 3) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter a reason (at least 3 characters).' });
      job.isCancelled = true; job.cancelReason = reason.trim(); job.cancelledBy = EQ.user().id; job.cancelledUtc = new Date().toISOString(); job.version += 1;
      job.events.push({ kind: 'cancelled', at: job.cancelledUtc, by: EQ.user().id, note: job.cancelReason });
      audit('job.cancel', job.number, job.cancelReason); EQ.notify();
      return { ok: true, job };
    },
    /** Atomic, retry-safe completion (all lines or none). Never changes the equipment operational status. */
    completeJob(id, p) {
      if (!isWriter()) return forbid();
      if (p.key && S.D.idem[p.key]) return { ...S.D.idem[p.key], replayed: true };
      const job = EQ.job(id);
      if (!job) return fail(404, 'not_found', 'Job not found.');
      if (p.version != null && p.version !== job.version) return fail(409, 'version_conflict', 'This job changed. Reopen the form to use the latest values.');
      if (job.workStatus === 'completed') return fail(409, 'job_already_completed', 'This job is already completed. A repeat of the same command is safe: nothing was duplicated.');
      if (job.isCancelled) return fail(409, 'invalid_transition', 'A cancelled job cannot be completed.');
      const f = {}, lineErrors = {};
      if (!validDate(p.completedOn)) f.completedOn = 'Enter a completion date that is not in the future (Asia/Colombo).';
      if (job.progressUpdatedOn && p.completedOn < job.progressUpdatedOn) f.completedOn = 'Completion date cannot be before the latest progress update.';
      if (!p.note || !p.note.trim()) f.note = 'Enter a completion note.';
      const lines = p.lines || [];
      if (job.kind === 'repair' && lines.length) f.lines = 'Repair jobs take no replacement lines.';
      if (job.kind === 'replacement' && !lines.length && !job.lines.some((l) => l.state === 'committed')) f.lines = 'A replacement job needs at least one replacement line.';
      const seen = new Set();
      lines.forEach((l, i) => {
        const e = {};
        const pos = EQ.pos(l.positionId);
        if (!pos) e.positionId = 'Choose the position that was replaced.';
        else if (pos.equipmentId !== job.equipmentId) e.positionId = 'That position belongs to another equipment (422).';
        else if (pos.state !== 'active') e.positionId = 'Position is not active.';
        else if (!inTarget(job, pos)) e.positionId = 'Position is outside this job\'s target.';
        else if (seen.has(pos.id) || job.lines.some((x) => x.state === 'committed' && x.positionId === pos.id)) e.positionId = 'Duplicate position: this job already has a line for it (422 duplicate_position).';
        if (pos) seen.add(pos.id);
        if (!l.desc || !l.desc.trim()) e.desc = 'Describe the installed item.';
        const q = Number(l.qty);
        if (pos && pos.kind === 'serialized' ? q !== 1 : !(q > 0)) e.qty = pos && pos.kind === 'serialized' ? 'A serialized position takes exactly 1 ea.' : 'Quantity must be greater than 0.';
        if (!validDate(l.on)) e.on = 'Enter a replacement date that is not in the future.';
        else if (l.on > p.completedOn) e.on = 'Replacement date cannot be after the completion date.';
        else if (pos) {
          const last = S.D.events.filter((x) => x.positionId === pos.id && !x.voided).slice(-1)[0];
          if (last && last.businessDate && l.on < last.businessDate) e.on = 'Earlier than the latest recorded replacement at this position (' + EQ.fmtDate(last.businessDate) + '). Enter past work oldest first (409 out_of_order_installation).';
        }
        if (l.removedKnown === 'yes' && !(l.removedDesc || '').trim()) e.removedDesc = 'Describe the removed item, or choose Unknown.';
        if (Object.keys(e).length) lineErrors[i] = e;
      });
      if (Object.keys(f).length || Object.keys(lineErrors).length) return { ok: false, status: 422, code: 'validation_failed', message: 'Nothing was saved. Fix the items below and try again.', fields: f, lineErrors };
      // all-or-nothing commit
      const nowIso = new Date().toISOString();
      const beforeProgress = EQ.jobProgress(job);
      lines.forEach((l) => {
        const pos = EQ.pos(l.positionId);
        const evs = S.D.events.filter((x) => x.positionId === pos.id && !x.voided);
        const prev = evs[evs.length - 1];
        const line = { id: 'ln-' + job.id + '-' + pos.id, jobId: job.id, positionId: pos.id, mode: 'full', removedKnown: l.removedKnown === 'yes', removedDesc: l.removedKnown === 'yes' ? l.removedDesc : null, removedSerial: l.removedKnown === 'yes' ? l.removedSerial || null : null, item: { desc: l.desc.trim(), mfr: l.mfr || null, partNo: l.partNo || null, serial: l.serial || null }, qty: Number(l.qty), uom: pos.uom, replacedOn: l.on, note: l.note || null, state: 'committed' };
        const ev = { id: 'ev-' + line.id, positionId: pos.id, seq: S.D.events.filter((x) => x.positionId === pos.id).length + 1, kind: 'replacement', businessDate: l.on, jobId: job.id, lineId: line.id, removedFromEventId: prev ? prev.id : null, removedDesc: line.removedDesc, removedSerial: line.removedSerial, removedKnown: line.removedKnown, installed: { ...line.item, qty: line.qty, uom: pos.uom }, recordedUtc: nowIso, recordedBy: EQ.user().id, voided: false };
        line.eventId = ev.id; job.lines.push(line); S.D.events.push(ev);
        if (EQ.spares.isMajor(pos.id)) EQ.spares.noteCompletion(pos, job, line, l.conditionRemarks); // register written in the same transaction (SP02)
      });
      job.workStatus = 'completed'; job.completedOn = p.completedOn; job.completionNote = p.note.trim(); job.version += 1; job.updatedUtc = nowIso;
      job.progressPercent = 100; job.progressUpdatedOn = p.completedOn; job.progressNote = p.note.trim();
      job.events.push({ kind: 'completed', at: nowIso, by: EQ.user().id, workDate: p.completedOn, percent: 100, previousPercent: beforeProgress.percent, note: p.note.trim() });
      EQ.eq(job.equipmentId).lastActivity = nowIso;
      audit('job.complete', job.number + ' (' + lines.length + ' line(s))', p.note.trim(), { before: beforeProgress, after: EQ.jobProgress(job) });
      const res = { ok: true, job, statusUnchanged: EQ.eq(job.equipmentId).status };
      if (p.key) S.D.idem[p.key] = { ...res };
      EQ.notify();
      return res;
    },
    setStatus(eqId, p) {
      if (!isWriter()) return forbid();
      const eq = EQ.eq(eqId);
      if (eq.zmmsMapped) return EQ.zmms.correct(eqId, p); // V2 (D-94): a change on ZMMS-linked equipment is a current-day correction
      const f = {};
      if (eq.lifecycle === 'retired') return fail(409, 'equipment_retired', 'Retired equipment accepts no status changes.');
      if (!['readyForOps', 'breakdown', 'maintenance'].includes(p.status)) f.status = 'Choose one of the three operational statuses.';
      if (p.status === eq.status) f.status = 'The equipment is already ' + EQ.STATUS[p.status].label + ' (409 status_unchanged).';
      if ((p.status === 'breakdown' || p.status === 'maintenance') && !(p.reason || '').trim()) f.reason = 'A short reason is required for Breakdown and Maintenance.';
      if (p.relatedJobId) { const j = EQ.job(p.relatedJobId); if (!j || j.equipmentId !== eq.id) f.relatedJobId = 'That job belongs to another equipment (422).'; }
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was changed.', f);
      const now = new Date().toISOString();
      const seq = S.D.statusChanges.filter((c) => c.equipmentId === eq.id).length + 1;
      S.D.statusChanges.push({ id: 'sc-' + eq.key + '-n' + seq, equipmentId: eq.id, seq, status: p.status, prev: eq.status, reason: (p.reason || '').trim() || null, relatedJobId: p.relatedJobId || null, at: now, by: EQ.user().id, source: 'manual', kind: 'manualStatus', causes: [], runId: null });
      eq.status = p.status; eq.statusSince = now; eq.statusReason = (p.reason || '').trim() || null; eq.statusSource = 'manual'; eq.lastActivity = now; eq.version += 1;
      audit('status.change', eq.code + ' -> ' + p.status, p.reason); EQ.notify();
      return { ok: true };
    },
    createEquipment(p) {
      if (!isAdmin()) return forbid();
      const f = {};
      if (!(p.code || '').trim()) f.code = 'Enter an equipment code.';
      else if (S.D.equipment.some((e) => e.code.toLowerCase() === p.code.trim().toLowerCase())) f.code = 'Code "' + p.code.trim() + '" already exists (duplicates are refused).';
      if (!p.typeCode) f.typeCode = 'Choose a type.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const key = 'n' + (S.D.equipment.length + 1);
      const eq = { id: 'eq-' + p.code.trim().toLowerCase(), key, code: p.code.trim(), typeCode: p.typeCode, name: p.name || '', modelCode: null, assoc: 'unassigned', lifecycle: 'active', status: null, statusSince: null, statusReason: null, lastActivity: new Date().toISOString(), mains: [], subs: [], positionState: null, origin: 'DevelopmentFixture', version: 1, zmmsMapped: false, overrideOn: null, statusSource: 'manual', statusCauses: [], commissionedOn: null };
      S.D.equipment.push(eq); audit('equipment.create', eq.code); EQ.notify();
      return { ok: true, eq };
    },
    associateModel(eqId, modelCode, note) {
      if (!isAdmin()) return forbid();
      const eq = EQ.eq(eqId), m = EQ.model(modelCode);
      const f = {};
      if (!m) f.model = 'Choose a model.'; else if (m.typeCode !== eq.typeCode) f.model = 'The model belongs to another equipment type.';
      if (!(note || '').trim()) f.reason = 'A verification note is required (who confirmed the model, and from what).';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      eq.modelCode = modelCode; eq.assoc = 'verified'; eq.positionState = 'draft';
      eq.mains = []; eq.subs = [];
      S.D.positions = S.D.positions.filter((p) => p.equipmentId !== eq.id);
      EQ._instantiate(S.D, eq, m, 'draft');
      audit('equipment.model.associate', eq.code + ' -> ' + modelCode, note); EQ.notify();
      return { ok: true };
    },
    retireEquipment(id) {
      if (!isAdmin()) return forbid();
      const eq = EQ.eq(id);
      const open = EQ.openJobs(id);
      if (open.length) return fail(409, 'equipment_has_open_jobs', 'Retire is refused while uncompleted, uncancelled jobs exist (' + open.map((j) => j.number).join(', ') + ').');
      eq.lifecycle = 'retired'; audit('equipment.retire', eq.code); EQ.notify();
      return { ok: true };
    },
    setApplicability(modelCode, sub, state) {
      if (!isAdmin()) return forbid();
      const m = EQ.model(modelCode);
      if (state === 'unknown') delete m.applic[sub]; else m.applic[sub] = state;
      m.templateRevision += 1;
      audit('catalog.applicability', modelCode + ' ' + sub + ' = ' + state); EQ.notify();
      return { ok: true };
    },
    confirmPositions(eqId, ids) {
      if (!isAdmin()) return forbid();
      S.D.positions.filter((p) => ids.includes(p.id)).forEach((p) => { p.state = 'active'; });
      audit('position.confirm', EQ.eq(eqId).code + ' x' + ids.length); EQ.notify();
      return { ok: true };
    },
    setPositionState(id, state) {
      if (!isAdmin()) return forbid();
      EQ.pos(id).state = state; audit('position.' + state, id); EQ.notify(); return { ok: true };
    },
    setCatalogActive(code, active) {
      if (!isAdmin()) return forbid();
      const d = EQ.subDef(code) || EQ.mainDef(code); if (!d) return fail(404, 'not_found', 'Unknown code');
      if (d.reserved) return fail(409, 'reserved_definition', code + ' is a reserved inactive entry. An Admin must first give it an explicit definition.');
      const level = EQ.subDef(code) ? 'sub' : 'main';
      if (d.active === active) return { ok: true };
      catLog(code, active ? 'activated' : 'deactivated', { active: !active }, { active }, null);
      S.D.catalogOverrides[code] = active; d.active = active; audit('catalog.' + level + '.' + (active ? 'activate' : 'deactivate'), code); EQ.notify();
      return { ok: true };
    },
    /** POST /admin/parameters/values (API s4.13; DATA s3.8): a new current value for the model scope; the prior value is kept
     *  (superseded, never overwritten) and the drawing observations stay visible. basis: resolvedConflict | adminEntered. */
    resolveParameter(code, value, reason, opts) {
      if (!isCfgAdmin()) return forbid();
      opts = opts || {};
      const def = EQ.paramDef(code); if (!def) return fail(404, 'not_found', 'Unknown parameter.');
      if (!(reason || '').trim()) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter the reason / technical decision reference.' });
      const f = {};
      if (value == null || !String(value).trim()) f.value = 'Enter the value.'; else if (String(value).length > 100) f.value = 'At most 100 characters.';
      if (opts.source != null && String(opts.source).length > 300) f.source = 'At most 300 characters.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      S.D.resolved = S.D.resolved || {}; S.D.paramHistory = S.D.paramHistory || {};
      const prev = S.D.resolved[code];
      if (prev) (S.D.paramHistory[code] = S.D.paramHistory[code] || []).unshift({ kind: 'value', ...prev, supersededAt: new Date().toISOString(), supersededBy: EQ.user().id });
      const conflict = new Set((def.observations || []).map((o) => o.value)).size > 1;
      S.D.resolved[code] = { value: String(value).trim(), reason: reason.trim(), source: String(opts.source || '').trim() || null, basis: opts.basis || (conflict ? 'resolvedConflict' : 'adminEntered'), by: EQ.user().id, at: new Date().toISOString() };
      audit('parameter.value', code + ' = ' + String(value).trim() + (prev ? ' (was ' + prev.value + ')' : ''), reason); EQ.notify();
      return { ok: true };
    },

    // ---------------- U1-C22: Admin add/adjust in EQ settings (F:admin.access; every change audited, prior values kept) ----------------
    /** POST /admin/catalog/main-mechanisms (API s4.12; DATA s3.1 C2): a new code chosen by Admin; never 10, never an existing code. */
    addMainDef(p) {
      if (!isCfgAdmin()) return forbid();
      const code = String(p.code || '').trim(); const name = String(p.name || '').trim(); const f = {};
      if (code === '10') return fail(422, 'code_unassigned_reserved', 'Main code 10 stays absent from the catalogue and cannot be created.', { code: 'Main code 10 stays absent from the catalogue.' });
      if (!/^\d{2}$/.test(code) || code === '00') f.code = 'Enter a new two-digit main code as text, for example 18.';
      else if (EQ.mainDef(code)) return fail(409, 'duplicate_code', 'Main code ' + code + ' already exists (' + EQ.mainDef(code).name + '). Codes are never reused or renumbered.', { code: 'Code ' + code + ' already exists.' });
      if (!name) f.name = 'Enter a name.'; else if (name.length > 200) f.name = 'At most 200 characters.';
      if ((p.description || '').length > 2000) f.description = 'At most 2000 characters.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const d = { code, name, sourceName: null, description: String(p.description || '').trim() || null, active: true, origin: 'admin', nameDecision: 'admin_defined' };
      EQ.catalog.mains.push(d); EQ.catalog.mains.sort((a, b) => a.code.localeCompare(b.code));
      catLog(code, 'added', null, { name: d.name, description: d.description, active: true }, p.reason);
      audit('catalog.main.add', code + ' ' + name, p.reason); EQ.notify(); return { ok: true, definition: d };
    },
    /** POST /admin/catalog/sub-mechanisms (API s4.12): code = parent main code + one digit, unique across the catalogue; parent immutable. */
    addSubDef(p) {
      if (!isCfgAdmin()) return forbid();
      const code = String(p.code || '').trim(); const name = String(p.name || '').trim(); const m = EQ.mainDef(p.main); const f = {};
      if (!m) f.main = 'Choose the main mechanism.';
      else if (m.active === false) return fail(422, 'parent_inactive', 'Main ' + m.code + ' is inactive; activate it before adding submechanisms.', { main: 'The main mechanism is inactive.' });
      if (!/^\d{3}$/.test(code)) f.code = 'Enter a three-digit code as text: the main code plus one digit.';
      else if (m && !code.startsWith(m.code)) f.code = 'A submechanism code starts with its main code (' + m.code + 'x).';
      else if (EQ.subDef(code)) return fail(409, 'duplicate_code', 'Code ' + code + ' already exists (' + EQ.defLabel(code) + '). Codes are never reused or renumbered.', { code: 'Code ' + code + ' already exists.' });
      if (!name) f.name = 'Enter a name.'; else if (name.length > 200) f.name = 'At most 200 characters.';
      if ((p.description || '').length > 2000) f.description = 'At most 2000 characters.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const d = { code, main: m.code, name, sourceName: null, description: String(p.description || '').trim() || null, active: true, reserved: false, origin: 'admin', nameDecision: 'admin_defined' };
      EQ.catalog.subs.push(d); EQ.catalog.subs.sort((a, b) => a.code.localeCompare(b.code));
      catLog(code, 'added', null, { name: d.name, description: d.description, active: true }, p.reason);
      audit('catalog.sub.add', code + ' ' + name + ' under ' + m.code, p.reason); EQ.notify(); return { ok: true, definition: d };
    },
    /** PUT /admin/catalog/{main|sub}-mechanisms/{id} (API s4.12; DATA s11): name and description, audited, prior values kept; code and
     *  parent never change. 061 Spreader and 062 Headblock are user-confirmed names (21 Oct 2026) and stay; reserved 048/063 are refused. */
    editDef(code, p) {
      if (!isCfgAdmin()) return forbid();
      const d = EQ.subDef(code) || EQ.mainDef(code); if (!d) return fail(404, 'not_found', 'Unknown code.');
      if (d.reserved) return fail(422, 'reserved_definition', code + ' is a reserved inactive entry; it stays reserved until an explicit define-reserved decision.');
      const name = String(p.name == null ? d.name : p.name).trim();
      const desc = p.description == null ? (d.description || null) : (String(p.description).trim() || null);
      const f = {};
      if (LOCKED_NAMES[code] && name !== LOCKED_NAMES[code]) return fail(409, 'approved_name_locked', code + ' ' + LOCKED_NAMES[code] + ' is a user-confirmed name and is not renamed. Its description can be edited.', { name: 'The name ' + LOCKED_NAMES[code] + ' is fixed.' });
      if (!name) f.name = 'Enter a name.'; else if (name.length > 200) f.name = 'At most 200 characters.';
      if (desc && desc.length > 2000) f.description = 'At most 2000 characters.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      if (name === d.name && desc === (d.description || null)) return fail(422, 'no_change', 'Nothing changed.');
      const before = { name: d.name, description: d.description || null };
      d.name = name; d.description = desc; if (before.name !== name && d.nameDecision !== 'admin_defined') d.nameDecision = 'admin_renamed';
      catLog(code, 'edited', before, { name, description: desc }, p.reason);
      audit('catalog.' + (EQ.subDef(code) ? 'sub' : 'main') + '.edit', code + (before.name !== name ? ' "' + before.name + '" -> "' + name + '"' : ' description'), p.reason); EQ.notify(); return { ok: true };
    },
    /** POST /admin/equipment/{id}/positions (API s4.13; DATA s3.4 P2): a new DRAFT position of one equipment under one of its sub instances. */
    addPosition(eqId, p) {
      if (!isCfgAdmin()) return forbid();
      const eq = EQ.eq(eqId); if (!eq) return fail(404, 'not_found', 'Unknown equipment.');
      if (eq.lifecycle !== 'active') return fail(409, 'equipment_retired', eq.code + ' is not active.');
      const f = posFields(eq, p, null);
      if (f.status) return f;
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const si = eq.subs.find((x) => x.id === p.subId);
      const n = S.D.positions.filter((x) => x.equipmentId === eq.id && x.origin === 'admin').length + 1;
      const pos = { id: 'pp-' + eq.key + '-a' + String(n).padStart(2, '0'), equipmentId: eq.id, mainId: si.mainId, subId: si.id, key: String(p.key).trim(), name: String(p.name).trim(), kind: p.kind, uom: p.kind === 'serialized' ? 'ea' : String(p.uom).trim(), nominal: p.kind === 'serialized' ? 1 : null, category: 'component', state: 'draft', prov: 'n/a', src: String(p.source || '').trim() || 'Admin entry (no drawing reference given)', origin: 'admin' };
      S.D.positions.push(pos);
      (S.D.positionLog = S.D.positionLog || []).unshift({ posId: pos.id, equipmentId: eq.id, action: 'added', before: null, after: posSnap(pos), by: EQ.user().id, at: new Date().toISOString() });
      audit('position.add', eq.code + ' ' + pos.key + ' (draft)'); EQ.notify(); return { ok: true, position: pos };
    },
    /** PUT /admin/equipment/{id}/positions/{positionId} (API s4.13; DATA s3.4 P2/P3, s11): name always (audited); key and parent only
     *  while draft (409 position_key_frozen / ancestors_frozen); kind and UOM only before history (409 history_exists). */
    editPosition(posId, p) {
      if (!isCfgAdmin()) return forbid();
      const pos = EQ.pos(posId); if (!pos) return fail(404, 'not_found', 'Unknown position.');
      const eq = EQ.eq(pos.equipmentId);
      const want = { name: p.name == null ? pos.name : p.name, key: p.key == null ? pos.key : String(p.key).trim(), subId: p.subId == null ? pos.subId : p.subId, kind: p.kind == null ? pos.kind : p.kind, uom: p.uom == null ? pos.uom : String(p.uom).trim(), source: p.source == null ? pos.src : p.source };
      const hist = posHasHistory(pos);
      if (want.key !== pos.key && pos.state !== 'draft') return fail(409, 'position_key_frozen', 'The semantic key of a confirmed position never changes. Deactivate it and add a new position instead.', { key: 'Frozen since confirmation.' });
      if (want.subId !== pos.subId && (pos.state !== 'draft' || hist)) return fail(409, 'ancestors_frozen', 'The mechanism of a position can change only while it is a draft without references.', { subId: 'Frozen since confirmation.' });
      if ((want.kind !== pos.kind || (want.kind !== 'serialized' && want.uom !== pos.uom)) && hist) return fail(409, 'history_exists', 'Kind and unit are frozen once history exists at the position.', { kind: 'Frozen: history exists.' });
      const f = posFields(eq, want, pos);
      if (f.status) return f;
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const before = posSnap(pos);
      const si = eq.subs.find((x) => x.id === want.subId);
      const next = { name: String(want.name).trim(), key: want.key, subId: si.id, mainId: si.mainId, kind: want.kind, uom: want.kind === 'serialized' ? 'ea' : want.uom, src: String(want.source || '').trim() || pos.src };
      if (JSON.stringify(before) === JSON.stringify(posSnap(next))) return fail(422, 'no_change', 'Nothing changed.');
      Object.assign(pos, next);
      (S.D.positionLog = S.D.positionLog || []).unshift({ posId: pos.id, equipmentId: eq.id, action: 'edited', before, after: posSnap(pos), by: EQ.user().id, at: new Date().toISOString() });
      audit('position.edit', eq.code + ' ' + pos.key); EQ.notify(); return { ok: true };
    },
    /** POST /admin/parameters/definitions + first value (API s4.13; DATA s3.8): an Admin-entered specification row for a model scope
     *  with its value, unit and source; it has no drawing observation and is labelled Admin-entered wherever it is shown. */
    addSpec(p) {
      if (!isCfgAdmin()) return forbid();
      const label = String(p.label || '').trim(); const f = {};
      const code = 'adm-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
      if (!label) f.label = 'Enter the specification name.'; else if (label.length > 120) f.label = 'At most 120 characters.';
      else if (EQ.allParams().some((x) => x.label.toLowerCase() === label.toLowerCase() || x.code === code)) return fail(409, 'duplicate_code', 'A specification named "' + label + '" already exists. Record a new value on it instead.', { label: 'Already exists.' });
      if (p.value == null || !String(p.value).trim()) f.value = 'Enter the value.'; else if (String(p.value).length > 100) f.value = 'At most 100 characters.';
      if (String(p.unit || '').length > 16) f.unit = 'At most 16 characters.';
      if (!String(p.source || '').trim()) f.source = 'Enter where the value comes from (document and page, nameplate or decision).';
      if (!['major', 'technical'].includes(p.use)) f.use = 'Choose Major or Technical.';
      if (p.mainCode && !EQ.mainDef(p.mainCode)) f.mainCode = 'Unknown main mechanism.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const at = new Date().toISOString();
      const def = { code, label, unit: String(p.unit || '').trim(), condition: String(p.condition || '').trim() || null, use: p.use, verification: 'admin_entered', operator: null, motorCount: null, observations: [], origin: 'admin', modelCode: p.modelCode || 'CICT-J526A-STS', mainCode: p.mainCode || null, addedBy: EQ.user().id, addedAt: at };
      (S.D.specAdded = S.D.specAdded || []).push(def);
      S.D.resolved = S.D.resolved || {}; S.D.resolved[code] = { value: String(p.value).trim(), reason: String(p.reason || '').trim() || 'Specification added by Admin', source: String(p.source).trim(), basis: 'adminEntered', by: EQ.user().id, at };
      audit('parameter.add', code + ' = ' + String(p.value).trim() + (def.unit ? ' ' + def.unit : ''), p.source); EQ.notify(); return { ok: true, definition: def };
    },
    /** PUT /admin/parameters/definitions/{code}: label, unit, condition, use and mechanism link of an Admin-entered row (prior kept).
     *  Drawing-derived definitions are source facts and are refused (record a value instead). */
    editSpec(code, p) {
      if (!isCfgAdmin()) return forbid();
      const def = EQ.paramDef(code); if (!def) return fail(404, 'not_found', 'Unknown parameter.');
      if (def.origin !== 'admin') return fail(409, 'source_definition_fixed', 'This row comes from the drawings; its observations are never edited. Record a value with a reason instead.');
      const f = {}; const label = String(p.label == null ? def.label : p.label).trim();
      if (!label) f.label = 'Enter the specification name.'; else if (EQ.allParams().some((x) => x !== def && x.label.toLowerCase() === label.toLowerCase())) f.label = 'Another specification has this name.';
      if (p.unit != null && String(p.unit).length > 16) f.unit = 'At most 16 characters.';
      if (p.use != null && !['major', 'technical'].includes(p.use)) f.use = 'Choose Major or Technical.';
      if (p.mainCode && !EQ.mainDef(p.mainCode)) f.mainCode = 'Unknown main mechanism.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      const snap = (d) => ({ label: d.label, unit: d.unit, condition: d.condition, use: d.use, mainCode: d.mainCode });
      const before = snap(def);
      const next = { label, unit: p.unit == null ? def.unit : String(p.unit).trim(), condition: p.condition == null ? def.condition : (String(p.condition).trim() || null), use: p.use || def.use, mainCode: p.mainCode === undefined ? def.mainCode : (p.mainCode || null) };
      if (JSON.stringify(before) === JSON.stringify(snap(next))) return fail(422, 'no_change', 'Nothing changed.');
      Object.assign(def, next);
      S.D.paramHistory = S.D.paramHistory || {}; (S.D.paramHistory[code] = S.D.paramHistory[code] || []).unshift({ kind: 'definition', before, after: snap(def), by: EQ.user().id, at: new Date().toISOString() });
      audit('parameter.edit', code, null); EQ.notify(); return { ok: true };
    },
    reopenJob(id, reason) {
      if (!isAdmin()) return forbid();
      const job = EQ.job(id);
      if (job.workStatus !== 'completed') return fail(409, 'invalid_transition', 'Only completed work can be reopened.');
      if (!(reason || '').trim()) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter a reason.' });
      job.workStatus = 'current'; job.reopenCount += 1; job.version += 1;
      job.progressPercent = null; job.progressUpdatedOn = null; job.progressNote = null;
      job.events.push({ kind: 'reopened', at: new Date().toISOString(), by: EQ.user().id, note: reason.trim() + ' (installations stay committed)' });
      audit('job.reopen', job.number, reason); EQ.notify();
      return { ok: true };
    },
    /** U1-C26: simulated PUT /jobs/{jobId}/display (API s4.8a). The shared "Show on dashboard / 3D" switch of one special job.
     *  eq.work (EQ Team and Admin; any special job, any work state); Management and FAC Team are refused. It changes no work field
     *  and no work status: only where the job is displayed. Audited (job.display) with the previous value; a progress event is kept. */
    setJobVisibility(id, p) {
      const deny = EQ.access.srv('eq.work'); if (deny) return deny; // 403 forbidden_role (Management, FAC Team) on the live matrix
      const job = EQ.job(id); if (!job) return fail(404, 'not_found', 'No job with this link exists (404).');
      if (typeof p.show !== 'boolean') return fail(422, 'validation_failed', 'Choose shown or hidden.', { show: 'Required.' });
      if (p.version != null && p.version !== job.version) return fail(409, 'version_conflict', 'This job changed since you opened it.', {});
      const before = EQ.shownOnDashboard(job);
      if (before === p.show) return { ok: true, job, unchanged: true };
      job.showOnDashboard = p.show; job.version += 1; job.updatedUtc = new Date().toISOString();
      job.displayChangedUtc = job.updatedUtc; job.displayChangedBy = EQ.user().id;
      job.events.push({ kind: p.show ? 'shown on dashboard / 3D' : 'hidden from dashboard / 3D', at: job.updatedUtc, by: EQ.user().id, note: (p.reason || '').trim() || null });
      S.D.audit.unshift({ at: job.updatedUtc, by: EQ.user().id, action: 'job.display', entity: job.number, reason: (p.reason || '').trim() || null, before: { showOnDashboard: before }, after: { showOnDashboard: p.show } });
      EQ.log('audit: job.display ' + job.number + ' ' + (p.show ? 'shown' : 'hidden')); EQ.notify();
      return { ok: true, job };
    },
  };
  // ---- U1-C22 helpers ----
  const LOCKED_NAMES = { '061': 'Spreader', '062': 'Headblock' };
  EQ.catalogLockedName = (code) => LOCKED_NAMES[code] || null;
  function catLog(code, action, before, after, reason) { (S.D.catalogLog = S.D.catalogLog || []).unshift({ code, action, before, after, reason: (reason || '').trim() || null, by: EQ.user().id, at: new Date().toISOString() }); }
  const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*){1,11}$/;
  const posSnap = (p) => ({ name: p.name, key: p.key, subId: p.subId, kind: p.kind, uom: p.uom, src: p.src });
  const posHasHistory = (p) => S.D.events.some((e) => e.positionId === p.id) || S.D.jobs.some((j) => j.positionId === p.id || (j.lines || []).some((l) => l.positionId === p.id));
  EQ.posHasHistory = posHasHistory;
  /** Field checks shared by add/edit position (DATA s10.2 key grammar; UQ (EquipmentId, SemanticKey); active, non-reserved definition). */
  function posFields(eq, p, self) {
    const f = {};
    const name = String(p.name || '').trim(); const key = String(p.key || '').trim();
    if (!name) f.name = 'Enter the position name.'; else if (name.length > 200) f.name = 'At most 200 characters.';
    if (!KEY_RE.test(key) || key.length > 128) f.key = 'Use lowercase segments joined by dots, 2 to 12 segments, for example hoist.drive.motor.c.';
    else if (key.startsWith('container.')) f.key = 'The container. prefix is reserved for spatial containers, which are never positions.';
    else if (S.D.positions.some((x) => x !== self && x.equipmentId === eq.id && x.key === key)) return fail(409, 'duplicate_semantic_key', 'Another position of ' + eq.code + ' already uses the key ' + key + '.', { key: 'Already used on ' + eq.code + '.' });
    const si = eq.subs.find((x) => x.id === p.subId);
    if (!si) f.subId = 'Choose the submechanism of ' + eq.code + '.';
    else { const d = EQ.subDef(si.code); if (!d || d.active === false || d.reserved) f.subId = si.code + ' is inactive or reserved and cannot take new positions.'; else if (si.state && si.state !== 'active') f.subId = 'This mechanism instance is deactivated.'; }
    if (!['serialized', 'quantityLot'].includes(p.kind)) f.kind = 'Choose Serialized or Quantity lot.';
    else if (p.kind === 'quantityLot' && !/^[A-Za-z]{1,16}$/.test(String(p.uom || '').trim())) f.uom = 'Enter the unit of a quantity lot, for example rope, set, m or pcs.';
    if ((p.source || '').length > 300) f.source = 'At most 300 characters.';
    return f;
  }
  /** Drawing-derived parameters plus the Admin-entered specification rows (U1-C22). */
  EQ.allParams = () => EQ.sourceParams.concat((S.D && S.D.specAdded) || []);
  EQ.paramDef = (code) => EQ.allParams().find((x) => x.code === code);

  function inTarget(job, pos) {
    if (job.level === 'equipment') return true;
    if (job.level === 'main') return pos.mainId === job.mainId;
    if (job.level === 'sub') return pos.subId === job.subId;
    return pos.id === job.positionId;
  }
  EQ.inTarget = inTarget;
})(window.EQ);
