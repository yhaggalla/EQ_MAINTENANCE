/* U1-C63: deliberately authored, synthetic manual choices. Never convert old/blank status values.
   Only operational-status changes (and newly registered demo equipment) persist in this browser.
   This is a review prototype, not server authorization or production persistence. */
window.EQ = window.EQ || {};
(function (EQ) {
  const KEY = 'cict.eq.asset-management.manual-status.v1';
  // Recorded when this synthetic baseline was explicitly reviewed/authored; reload is not a new status event.
  const BASELINE_RECORDED_AT = '2026-10-28T05:24:09.000Z';
  // Every code is listed for review. These are synthetic choices, not observations of the real fleet.
  const BASELINE = [
    ['QC01','isolated','Synthetic manual isolation for planned component work'],
    ['QC02','readyForOps'], ['QC03','readyForOps'],
    ['QC04','isolated','Synthetic manual isolation for technical investigation'],
    ['QC05','readyForOps'], ['QC06','isolated','Synthetic manual isolation for project work'],
    ['QC07','readyForOps'], ['QC08','readyForOps'], ['QC09','readyForOps'], ['QC10','readyForOps'],
    ['QC11','readyForOps'], ['QC12','readyForOps'], ['QC13','readyForOps'], ['QC14','readyForOps'],
    ['RTG01','readyForOps'], ['RTG02','readyForOps'],
    ['RTG03','isolated','Synthetic manual isolation for investigation'],
    ['RTG04','readyForOps'], ['RTG05','readyForOps'],
    ['RTG06','isolated','Synthetic manual isolation for component replacement'],
    ['RTG07','readyForOps'], ['RTG08','readyForOps'], ['RTG09','readyForOps'], ['RTG10','readyForOps'],
    ['RTG11','readyForOps'], ['RTG12','readyForOps'], ['RTG13','readyForOps'], ['RTG14','readyForOps'],
    ['RTG15','readyForOps'], ['RTG16','readyForOps'], ['RTG17','readyForOps'], ['RTG18','readyForOps'],
    ['RTG19','readyForOps'], ['RTG20','readyForOps'], ['RTG21','readyForOps'], ['RTG22','readyForOps'],
    ['RTG23','readyForOps'], ['RTG24','readyForOps'], ['RTG25','readyForOps'], ['RTG26','readyForOps'],
    ['RTG27','readyForOps'], ['RTG28','readyForOps'], ['RTG29','readyForOps'], ['RTG30','readyForOps'],
    ['RTG31','readyForOps'], ['RTG32','readyForOps'], ['RTG33','readyForOps'], ['RTG34','readyForOps'],
    ['RTG35','readyForOps'], ['RTG36','readyForOps'], ['RTG37','readyForOps'], ['RTG38','readyForOps'],
    ['RTG39','readyForOps'], ['RTG40','readyForOps'], ['RTG41','readyForOps'], ['RTG42','readyForOps'],
    ['RTG43','readyForOps'], ['RTG44','readyForOps'], ['RTG45','readyForOps'], ['RTG46','readyForOps'],
    ['ES01','readyForOps'], ['ES02','readyForOps'], ['ES03','readyForOps'],
    ['ES04','isolated','Synthetic manual isolation for hydraulic investigation'],
    ['ES05','readyForOps'], ['ES06','readyForOps'], ['ES07','readyForOps'],
  ];
  const valid = value => value === 'readyForOps' || value === 'isolated';
  const copy = value => JSON.parse(JSON.stringify(value));
  // Do not persist model assignments without their position/binding records: other work remains in memory.
  const fields = ['id','key','code','typeCode','name','lifecycle','status','statusSince','statusReason','statusBy','currentStatusChangeId','lastActivity','origin','version','manualRegistered'];
  const statusFields = ['lifecycle','status','statusSince','statusReason','statusBy','currentStatusChangeId'];
  const BASE_GENERATION = 'c63-authored-baseline';
  const locks = () => window.navigator && window.navigator.locks;
  const storageConflict = message => Object.assign(new Error(message), { status: 409, code: 'local_status_changed' });
  const storageFailure = message => Object.assign(new Error(message), { status: 503, code: 'local_status_storage_failed' });
  const readStored = () => {
    const raw = window.localStorage && window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  };
  const M = EQ.manual = { key: KEY, baseline: BASELINE.map(row => row.slice()), valid, warning: '' };
  M.build = function build(D) {
    const now = BASELINE_RECORDED_AT;
    D.statusChanges.forEach(event => { event.legacy = true; });
    D.equipment.forEach(eq => {
      const row = BASELINE.find(choice => choice[0] === eq.code);
      if (!row || !valid(row[1])) throw new Error('Missing explicit synthetic manual status for ' + eq.code);
      const previous = eq.status;
      const seq = Math.max(0, ...D.statusChanges.filter(c => c.equipmentId === eq.id).map(c => c.seq)) + 1;
      const change = { id: 'manual-initial-' + eq.id, equipmentId: eq.id, seq, status: row[1], prev: previous, reason: row[2] || 'Synthetic manual registration choice', relatedJobId: null, at: now, by: 'u-admin', source: 'manual', kind: 'manualInitial', legacy: false };
      D.statusChanges.push(change);
      Object.assign(eq, { status: row[1], statusSince: now, statusReason: change.reason, statusBy: change.by, currentStatusChangeId: change.id, statusSource: 'manual' });
    });
  };
  M.restore = function restore(D) {
    M.warning = '';
    let raw;
    try { raw = window.localStorage && window.localStorage.getItem(KEY); }
    catch { M.warning = 'Browser-local status storage is unavailable. Saved changes cannot be read; writes are refused until storage is available.'; return; }
    M.generation = BASE_GENERATION;
    M.revision = 0;
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (![1,2].includes(saved.version) || !Array.isArray(saved.equipment) || !Array.isArray(saved.changes) || saved.equipment.length > 5000 || (saved.revision !== undefined && (!Number.isSafeInteger(saved.revision) || saved.revision < 0))) throw Error('format');
      const ids = new Set();
      for (const e of saved.equipment) {
        if (!e.id || ids.has(e.id) || !valid(e.status) || !e.code || !['QC','RTG','ES'].includes(e.typeCode) || !['active','retired'].includes(e.lifecycle)) throw Error('equipment');
        ids.add(e.id);
        const changes = saved.changes.filter(c => c.equipmentId === e.id);
        const current = changes.find(c => c.id === e.currentStatusChangeId);
        if (!current || current.status !== e.status || current.at !== e.statusSince || current.by !== e.statusBy) throw Error('history');
        for (const c of changes) if (!valid(c.status) || !c.by || !Number.isFinite(Date.parse(c.at)) || !Number.isInteger(c.seq) || c.seq < 1 || (c.status === 'isolated' && !(c.reason || '').trim())) throw Error('event');
        const existing = D.equipment.find(x => x.id === e.id);
        if (existing && (existing.code !== e.code || existing.typeCode !== e.typeCode)) throw Error('identity');
        if (!existing && (!e.manualRegistered || D.equipment.some(x => x.code.toLowerCase() === e.code.toLowerCase()))) throw Error('registration');
      }
      if (saved.changes.some(c => !ids.has(c.equipmentId))) throw Error('unknown event');
      // Validate the entire snapshot before applying any row; retain the original legacy history.
      D.statusChanges = D.statusChanges.filter(c => c.legacy || !ids.has(c.equipmentId));
      D.statusChanges.push(...copy(saved.changes));
      saved.equipment.forEach(value => {
        let eq = D.equipment.find(x => x.id === value.id);
        if (!eq) {
          eq = { mains: [], subs: [], modelCode: null, assoc: 'unassigned', positionState: null, commissionedOn: null };
          D.equipment.push(eq);
          for (const name of fields) if (Object.prototype.hasOwnProperty.call(value, name)) eq[name] = copy(value[name]);
        } else {
          // Keep unrelated in-memory work/model edits and their version; import only shared manual state.
          const changed = eq.currentStatusChangeId !== value.currentStatusChangeId || eq.lifecycle !== value.lifecycle;
          for (const name of statusFields) if (Object.prototype.hasOwnProperty.call(value, name)) eq[name] = copy(value[name]);
          if (value.lastActivity && (!eq.lastActivity || value.lastActivity > eq.lastActivity)) eq.lastActivity = value.lastActivity;
          if (changed) eq.version = Math.max(eq.version || 1, value.version || 1) + 1;
        }
        eq.statusSource = 'manual';
      });
      M.generation = saved.generation || BASE_GENERATION;
      M.revision = saved.revision || 0;
    } catch { M.warning = 'Saved demo status could not be restored. The explicitly authored synthetic baseline is shown; use Reset fixtures to discard the invalid local snapshot.'; }
  };
  M.save = function save() {
    if (M.sessionOnly) {
      M.warning = 'Safe cross-tab storage is unavailable in this browser. This manual edit is kept for the current session only.';
      return false;
    }
    const D = EQ.state.D;
    const equipment = D.equipment.map(eq => Object.fromEntries(fields.filter(k => eq[k] !== undefined).map(k => [k, eq[k]])));
    const changes = D.statusChanges.filter(c => !c.legacy && c.source === 'manual');
    try {
      const latest = readStored();
      if ((latest?.revision || 0) !== M.revision || (latest?.generation || BASE_GENERATION) !== M.generation) throw storageConflict('Another tab changed or reset the saved status. Reload and review before retrying.');
      const revision = M.revision + 1;
      window.localStorage.setItem(KEY, JSON.stringify({ version: 2, revision, generation: M.generation, equipment, changes }));
      M.revision = revision;
      M.warning = ''; return true;
    }
    catch (error) {
      if (error.code === 'local_status_changed') throw error;
      M.warning = 'Browser-local status could not be saved. Nothing was changed; your form can be retried when storage is available.';
      throw storageFailure(M.warning);
    }
  };
  M.clear = function clear() {
    try {
      let revision = 0;
      try { revision = readStored()?.revision || 0; } catch { /* Reset explicitly discards corrupt data. */ }
      // A reset marker prevents an old open tab from silently resurrecting the deleted snapshot.
      const generation = window.crypto?.randomUUID?.() || Date.now() + '-' + Math.random();
      window.localStorage.setItem(KEY, JSON.stringify({ version: 2, revision: revision + 1, generation, equipment: [], changes: [] }));
    } catch {
      M.warning = 'Browser-local status could not be reset. The existing records were kept.';
      throw storageFailure(M.warning);
    }
  };
  const locked = action => locks()?.request ? locks().request(KEY, { mode: 'exclusive' }, action) : action();
  M.reset = action => locked(() => {
    try { M.clear(); return action(); }
    catch (error) {
      if (error.code !== 'local_status_storage_failed') throw error;
      return { ok: false, status: error.status, code: error.code, message: error.message };
    }
  });
  M.transaction = function transaction(action) {
    return locked(() => {
      let before;
      try {
        // Browsers without Web Locks keep edits in-session rather than risk cross-tab lost writes.
        M.sessionOnly = !!window.document && !locks()?.request;
        if (!M.sessionOnly) {
          let saved;
          try { saved = readStored(); }
          catch (error) {
            if (error instanceof SyntaxError) throw storageConflict('The saved demo status is invalid. Use Reset fixtures before editing.');
            throw storageFailure('Browser-local status could not be read. Nothing was changed.');
          }
          if (!M.sessionOnly) {
            if ((saved?.generation || BASE_GENERATION) !== M.generation) throw storageConflict('Demo status was reset in another tab. Reload before editing.');
            M.restore(EQ.state.D);
            if (M.warning) throw storageConflict(M.warning);
          }
        }
        before = copy(EQ.state.D);
        return action();
      } catch (error) {
        if (!['local_status_changed','local_status_storage_failed'].includes(error.code)) throw error;
        if (before) EQ.state.D = before;
        EQ.notify();
        return { ok: false, status: error.status, code: error.code, message: error.message };
      }
    });
  };
  // The synthetic rule bodies stay synchronous under a real cross-tab Web Lock. UI callers await them.
  for (const name of ['setStatus','createEquipment','retireEquipment']) {
    const command = EQ.api[name];
    EQ.api[name] = (...args) => {
      const role = EQ.state.role;
      return M.transaction(() => role === EQ.state.role ? command(...args) : { ok: false, status: 409, code: 'persona_changed', message: 'The demo persona changed while this action was waiting. Review and try again.' });
    };
  }
})(window.EQ);
