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
  EQ.reset = () => { S.D = EQ.buildFixtures(); EQ.buildV2(S.D); EQ.access.refreshSession('fixtures reset'); S.expanded = new Set(); S.refreshedAt = Date.now(); S.lastGoodAt = Date.now(); EQ.log('Fixtures reset (synthetic data restored)'); };

  EQ.user = () => EQ.USERS[S.role];
  // Server-side checks use the live Access matrix (EQ.access.srv); EQ.perm.* is what the UI shows from its session snapshot.
  const isWriter = () => !EQ.access.srv('eq.work');
  const isAdmin = () => !EQ.access.srv('eq.work.admin');
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

  /** History for one scope (DATA_CONTRACT s9): direct + descendant jobs, de-duplicated, with matching lines. */
  EQ.history = (eqId, scope, includeCancelled) => {
    const jobs = EQ.jobsOf(eqId, includeCancelled);
    const inScope = (l) => {
      const p = EQ.pos(l.positionId);
      if (scope.level === 'equipment') return true;
      if (scope.level === 'main') return p.mainId === scope.id;
      if (scope.level === 'sub') return p.subId === scope.id;
      return p.id === scope.id;
    };
    const hit = (j) => {
      if (scope.level === 'equipment') return true;
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

  // ---- simulated server rules ----
  const fail = (status, code, message, fields) => ({ ok: false, status, code, message, fields: fields || {} });
  const audit = (action, entity, reason) => { S.D.audit.unshift({ at: new Date().toISOString(), by: EQ.user().id, action, entity, reason: reason || null }); EQ.log('audit: ' + action + ' ' + entity); };
  const forbid = () => fail(403, 'forbidden', 'The server refuses this request for your role (' + (EQ.PERSONAS[S.role] ? EQ.PERSONAS[S.role].label : S.role) + '). Hidden buttons are not authorization.');
  const validDate = (v, { allowFuture } = {}) => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && v >= '2000-01-01' && (allowFuture || v <= EQ.todayColombo());

  EQ.api = {
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
        isCancelled: false, cancelReason: null, cancelledBy: null, cancelledUtc: null,
        createdBy: EQ.user().id, createdUtc: new Date().toISOString(), updatedUtc: new Date().toISOString(), reopenCount: 0, version: 1, lines: [],
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
      if (job.workStatus === 'completed') return fail(409, 'job_already_completed', 'This job is already completed. A repeat of the same command is safe: nothing was duplicated.');
      if (job.isCancelled) return fail(409, 'invalid_transition', 'A cancelled job cannot be completed.');
      const f = {}, lineErrors = {};
      if (!validDate(p.completedOn)) f.completedOn = 'Enter a completion date that is not in the future (Asia/Colombo).';
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
      job.events.push({ kind: 'completed', at: nowIso, by: EQ.user().id, note: 'Business date ' + p.completedOn });
      EQ.eq(job.equipmentId).lastActivity = nowIso;
      audit('job.complete', job.number + ' (' + lines.length + ' line(s))');
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
      const d = EQ.subDef(code); if (!d) return fail(404, 'not_found', 'Unknown code');
      if (d.reserved) return fail(409, 'reserved_definition', code + ' is a reserved inactive entry. An Admin must first give it an explicit definition.');
      S.D.catalogOverrides[code] = active; d.active = active; audit('catalog.sub.' + (active ? 'activate' : 'deactivate'), code); EQ.notify();
      return { ok: true };
    },
    resolveParameter(code, value, reason) {
      if (!isAdmin()) return forbid();
      if (!(reason || '').trim()) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter the reason / technical decision reference.' });
      S.D.resolved = S.D.resolved || {}; S.D.resolved[code] = { value, reason: reason.trim(), by: EQ.user().id, at: new Date().toISOString() };
      audit('parameter.resolve', code + ' = ' + value, reason); EQ.notify();
      return { ok: true };
    },
    reopenJob(id, reason) {
      if (!isAdmin()) return forbid();
      const job = EQ.job(id);
      if (job.workStatus !== 'completed') return fail(409, 'invalid_transition', 'Only completed work can be reopened.');
      if (!(reason || '').trim()) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter a reason.' });
      job.workStatus = 'current'; job.reopenCount += 1; job.version += 1;
      job.events.push({ kind: 'reopened', at: new Date().toISOString(), by: EQ.user().id, note: reason.trim() + ' (installations stay committed)' });
      audit('job.reopen', job.number, reason); EQ.notify();
      return { ok: true };
    },
  };
  function inTarget(job, pos) {
    if (job.level === 'equipment') return true;
    if (job.level === 'main') return pos.mainId === job.mainId;
    if (job.level === 'sub') return pos.subId === job.subId;
    return pos.id === job.positionId;
  }
  EQ.inTarget = inTarget;
})(window.EQ);
