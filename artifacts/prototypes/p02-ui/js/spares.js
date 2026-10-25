/* P02B: major spare-part condition register (DATA_CONTRACT s16, API s4.21-s4.23). SYNTHETIC data only.
   The register is the current-state view of the installation events at a designated position (one installation history,
   S22). The next predicted replacement is a calendar estimate (base date + expected life in months), computed at read and never
   stored; it is never shown when the base date or the life is unknown. */
window.EQ = window.EQ || {};
(function (EQ) {
  const S$ = (EQ.spares = {});
  const Sd = () => EQ.state.D.spare;
  const fail = (status, code, message, fields) => ({ ok: false, status, code, message, fields: fields || {} });
  const parts = (iso) => iso.split('-').map(Number);
  const addMonths = (iso, n) => { const [y, m, d] = parts(iso); const t = new Date(Date.UTC(y, m - 1 + n, 1)); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(d, last)); return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0'); };
  const dayDiff = (a, b) => { const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b); return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 864e5); };
  const monthsDiff = (a, b) => { const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };
  S$.addMonths = addMonths;

  S$.build = function build(D) {
    const today = EQ.todayColombo();
    const ago = (days) => new Date(Date.now() - days * 864e5).toISOString();
    const sp = (D.spare = { types: [], designated: {}, remarks: {}, history: [], dueSoonDays: 90 });
    const type = (code, name, life) => { const t = { id: 'spt-' + code, code, name, defaultLife: life, active: true }; sp.types.push(t); return t; };
    const T = {
      motor: type('hoist-motor', 'Hoist motor', 120), gearbox: type('hoist-gearbox', 'Hoist gearbox', 180), brake: type('hoist-brake', 'Hoist brake', 96),
      ropeMain: type('wire-rope-main-hoist', 'Wire rope set, main hoist', 36), ropeBoom: type('wire-rope-boom', 'Wire rope set, boom hoist', 48), ropeTrolley: type('wire-rope-trolley', 'Wire rope set, trolley', 36),
      wheel: type('trolley-wheel', 'Trolley wheel', 60), spreader: type('spreader', 'Spreader', 240), tyre: type('tyre-set', 'Tyre set', 36), engine: type('engine', 'Engine', null),
    };
    // commissioning dates (synthetic; a real date is Admin-entered). QC03 stays unknown: no prediction for Original parts there.
    const comm = { 'eq-qc-demo-01': '2018-03-15', 'eq-qc-demo-02': '2019-06-20', 'eq-rtg-demo-01': '2016-01-10' };
    D.equipment.forEach((e) => { e.commissionedOn = comm[e.id] || null; });
    const eqId = (code) => D.equipment.find((e) => e.code === code)?.id;
    const designate = (eqCode, key, t, over) => { const p = D.positions.find((x) => x.equipmentId === eqId(eqCode) && x.key === key); if (p) sp.designated[p.id] = { typeId: t.id, lifeOverride: over == null ? null : over }; return p; };
    const KEYS = [['hoist.drive.motor.a', T.motor], ['hoist.drive.motor.b', T.motor], ['hoist.drive.gearbox.a', T.gearbox], ['hoist.emergency.brake.a', T.brake], ['hoist.rope.set.main', T.ropeMain], ['boom.rope.set.main', T.ropeBoom], ['trolley.rope.set.main', T.ropeTrolley], ['trolley.wheel.position.a', T.wheel], ['trolley.wheel.position.b', T.wheel], ['spreader.frame', T.spreader]];
    ['QC01', 'QC02'].forEach((c) => KEYS.forEach(([k, t]) => designate(c, k, t)));
    designate('RTG01', 'gantry.tyre.set.a', T.tyre); designate('RTG01', 'engine.main', T.engine, 144);
    // a per-equipment life override that puts the QC01 boom rope set inside the due-soon window (computed from today)
    const boomRope = designate('QC01', 'boom.rope.set.main', T.ropeBoom, monthsDiff(comm['eq-qc-demo-01'], EQ.shiftDay(today, 50)));
    // baseline events for Original parts (Record Original) and a few notes; replaced parts come from the real events of the job fixtures
    const base = (eqCode, key, item, by) => {
      const p = D.positions.find((x) => x.equipmentId === eqId(eqCode) && x.key === key); if (!p) return;
      if (D.events.some((e) => e.positionId === p.id && !e.voided)) return;
      D.events.push({ id: 'ev-base-' + p.id, positionId: p.id, seq: D.events.filter((e) => e.positionId === p.id).length + 1, kind: 'baselineRecorded', businessDate: null, jobId: null, lineId: null, removedFromEventId: null, removedKnown: false, removedDesc: null, removedSerial: null, installed: { ...item, qty: 1, uom: p.uom }, recordedUtc: ago(60), recordedBy: by || 'u-admin', voided: false });
    };
    base('QC01', 'hoist.drive.motor.b', { desc: 'Main hoist motor (as supplied, synthetic)', mfr: 'Synthetic Motors Ltd', partNo: 'SYN-HM-450', serial: null });
    base('QC01', 'hoist.drive.gearbox.a', { desc: 'Main hoist gearbox (as supplied, synthetic)', mfr: 'Synthetic Gears', partNo: 'SYN-GB-12', serial: 'SYN-G-0007' });
    base('QC01', 'hoist.emergency.brake.a', { desc: 'Emergency disc brake (as supplied, synthetic)', mfr: 'Synthetic Brakes', partNo: 'SYN-BR-3', serial: null });
    base('QC01', 'boom.rope.set.main', { desc: 'Boom hoist rope set (as supplied, synthetic)', mfr: 'Synthetic Ropes', partNo: 'SYN-RP-40', serial: null });
    base('QC01', 'trolley.wheel.position.a', { desc: 'Trolley wheel (as supplied, synthetic)', mfr: 'Synthetic Wheels', partNo: 'SYN-TW-310', serial: null });
    base('QC02', 'hoist.drive.gearbox.a', { desc: 'Main hoist gearbox (as supplied, synthetic)', mfr: 'Synthetic Gears', partNo: 'SYN-GB-12', serial: 'SYN-G-0102' });
    base('QC02', 'hoist.emergency.brake.a', { desc: 'Emergency disc brake (as supplied, synthetic)', mfr: 'Synthetic Brakes', partNo: 'SYN-BR-3', serial: null });
    base('QC02', 'spreader.frame', { desc: 'Spreader (as supplied, synthetic)', mfr: 'Synthetic Spreaders', partNo: 'SYN-SP-40', serial: 'SYN-S-0044' });
    // QC01 trolley wheel B, QC02 motor B stay "not recorded": no event, no prediction, no claim of Original.
    // remarks and history
    const pm = (eqCode, key) => D.positions.find((x) => x.equipmentId === eqId(eqCode) && x.key === key);
    const note = (p, text) => { if (p) sp.remarks[p.id] = text; };
    note(pm('QC01', 'hoist.emergency.brake.a'), 'Pads measured at 60 % (synthetic remark). Replacement not yet planned.');
    note(boomRope, 'Planned replacement EQJ-2026-000107 (pending).');
    // history: one row per non-voided event at a designated position, then register-only entries
    let rev = {};
    const hist = (pos, source, before, after, extra) => { rev[pos.id] = (rev[pos.id] || 0) + 1; sp.history.push({ posId: pos.id, equipmentId: pos.equipmentId, rev: rev[pos.id], source, before, after, reason: null, by: 'u-eq-a', at: ago(5), jobId: null, ...(extra || {}) }); };
    Object.keys(sp.designated).forEach((id) => {
      const pos = EQ.pos(id); if (!pos) return;
      let prev = null;
      D.events.filter((e) => e.positionId === id && !e.voided).sort((a, b) => a.seq - b.seq).forEach((e) => {
        const after = { condition: e.kind === 'baselineRecorded' ? 'original' : 'replaced', replacedOn: e.businessDate, brand: e.installed.mfr, model: e.installed.partNo, serial: e.installed.serial };
        hist(pos, e.kind === 'baselineRecorded' ? 'registerOriginal' : e.jobId ? 'jobCompletion' : 'registerReplacement', prev, after, { jobId: e.jobId, by: e.recordedBy, at: e.recordedUtc });
        prev = after;
      });
    });
    const amendP = pm('QC01', 'hoist.drive.motor.a');
    if (amendP) {
      const last = sp.history.filter((h) => h.posId === amendP.id).slice(-1)[0];
      hist(amendP, 'registerAmend', last.after, { ...last.after, model: 'SYN-HM-450-R2' }, { reason: 'Part number corrected from the nameplate photo (synthetic)', by: 'u-admin', at: ago(2) });
    }
  };

  // ---------------------------------------------------------------- derivations (computed at read)
  S$.types = () => Sd().types;
  S$.typeOf = (id) => Sd().types.find((t) => t.id === id);
  S$.isMajor = (posId) => !!Sd().designated[posId];
  S$.expectedLife = (posId) => {
    const d = Sd().designated[posId]; if (!d) return { months: null, source: null };
    if (d.lifeOverride != null) return { months: d.lifeOverride, source: 'override' };
    const t = S$.typeOf(d.typeId); return t && t.defaultLife != null ? { months: t.defaultLife, source: 'type' } : { months: null, source: null };
  };
  S$.row = function row(posId) {
    const pos = EQ.pos(posId), eq = EQ.eq(pos.equipmentId), d = Sd().designated[posId];
    const evs = EQ.state.D.events.filter((e) => e.positionId === posId && !e.voided).sort((a, b) => a.seq - b.seq);
    const latest = evs[evs.length - 1] || null;
    const repl = latest && latest.kind !== 'baselineRecorded';
    const condition = !latest ? null : repl ? 'replaced' : 'original';
    const life = S$.expectedLife(posId);
    const baseDate = condition === 'replaced' ? latest.businessDate : condition === 'original' ? eq.commissionedOn : null;
    let predicted = null, why = null;
    if (!condition) why = 'No prediction (condition not recorded)';
    else if (!baseDate) why = 'No prediction (commissioning date unknown)';
    else if (life.months == null) why = 'No prediction (expected life not set)';
    else predicted = addMonths(baseDate, life.months);
    const today = EQ.todayColombo();
    let flag = null, daysTo = null;
    if (predicted) { daysTo = dayDiff(predicted, today); if (daysTo < 0) flag = 'overdue'; else if (daysTo <= Sd().dueSoonDays) flag = 'dueSoon'; }
    const t = d ? S$.typeOf(d.typeId) : null;
    const sub = eq.subs.find((s) => s.id === pos.subId), main = eq.mains.find((m) => m.id === pos.mainId);
    return { posId, pos, eq, equipmentId: eq.id, typeId: d && d.typeId, typeName: t ? t.name : '', condition, replacedOn: condition === 'replaced' ? latest.businessDate : null, brand: latest ? latest.installed.mfr : null, model: latest ? latest.installed.partNo : null, serial: latest ? latest.installed.serial : null, desc: latest ? latest.installed.desc : null,
      lifeMonths: life.months, lifeSource: life.source, baseDate, predicted, why, flag, daysTo, remarks: Sd().remarks[posId] || '', subCode: sub ? sub.code : null, mainCode: main ? main.code : null, currentEventId: latest ? latest.id : null, commissionedOn: eq.commissionedOn };
  };
  S$.rows = function rows(eqId, scope) {
    const eq = EQ.eq(eqId);
    let list = EQ.positionsOf(eqId).filter((p) => p.state === 'active' && Sd().designated[p.id]);
    if (scope) {
      if (scope.level === 'main') list = list.filter((p) => p.mainId === scope.id);
      else if (scope.level === 'sub') list = list.filter((p) => p.subId === scope.id);
      else if (scope.level === 'part') list = list.filter((p) => p.id === scope.id);
      else if (scope.level === 'area') {
        const ids = new Set((EQ.qc?.containerPositions(eq, scope.id) || []).map((p) => p.id));
        list = list.filter((p) => ids.has(p.id));
      }
    }
    return list.map((p) => S$.row(p.id)).sort((a, b) => EQ.cmp(a.mainCode + a.subCode + a.pos.name, b.mainCode + b.subCode + b.pos.name));
  };
  S$.allRows = (filter) => EQ.state.D.equipment.flatMap((e) => (e.lifecycle === 'active' ? S$.rows(e.id) : [])).filter((r) => !filter || filter(r));
  S$.counts = (rows) => ({ total: rows.length, overdue: rows.filter((r) => r.flag === 'overdue').length, dueSoon: rows.filter((r) => r.flag === 'dueSoon').length });
  S$.history = (posId) => Sd().history.filter((h) => h.posId === posId).sort((a, b) => b.rev - a.rev);

  // ---------------------------------------------------------------- register actions and Add spare part (eq.work, U1-C21); designation settings (admin.access)
  const nextRev = (posId) => Sd().history.filter((h) => h.posId === posId).length + 1;
  function pushHist(pos, source, before, after, reason) { Sd().history.push({ posId: pos.id, equipmentId: pos.equipmentId, rev: nextRev(pos.id), source, before, after, reason: reason || null, by: EQ.user().id, at: new Date().toISOString(), jobId: null }); }
  const snapshot = (r) => ({ condition: r.condition, replacedOn: r.replacedOn, brand: r.brand, model: r.model, serial: r.serial, remarks: r.remarks });
  S$.recordOriginal = function recordOriginal(posId, p) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const pos = EQ.pos(posId); if (!pos || !Sd().designated[posId]) return fail(404, 'not_found', 'Not a major spare-part position.');
    if (EQ.state.D.events.some((e) => e.positionId === posId && !e.voided)) return fail(409, 'position_has_installation_history', 'This position already has installation history. Use Record replacement or Amend current.');
    if (!(p.desc || '').trim()) return fail(422, 'validation_failed', 'Nothing was saved.', { desc: 'Describe the installed item.' });
    const before = snapshot(S$.row(posId));
    const evs = EQ.state.D.events.filter((e) => e.positionId === posId);
    EQ.state.D.events.push({ id: 'ev-base-' + posId + '-' + evs.length, positionId: posId, seq: evs.length + 1, kind: 'baselineRecorded', businessDate: null, jobId: null, lineId: null, removedFromEventId: null, removedKnown: false, removedDesc: null, removedSerial: null, installed: { desc: p.desc.trim(), mfr: p.brand || null, partNo: p.model || null, serial: p.serial || null, qty: 1, uom: pos.uom }, recordedUtc: new Date().toISOString(), recordedBy: EQ.user().id, voided: false });
    if (p.remarks) Sd().remarks[posId] = p.remarks;
    pushHist(pos, 'registerOriginal', before, snapshot(S$.row(posId)), null);
    EQ.notify(); return { ok: true };
  };
  S$.recordReplacement = function recordReplacement(posId, p) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const pos = EQ.pos(posId); if (!pos || !Sd().designated[posId]) return fail(404, 'not_found', 'Not a major spare-part position.');
    const f = {}; const today = EQ.todayColombo();
    if (!(p.desc || '').trim()) f.desc = 'Describe the installed item.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.replacedOn || '') || p.replacedOn > today) f.replacedOn = 'Enter a replacement date that is not in the future (Asia/Colombo).';
    const evs = EQ.state.D.events.filter((e) => e.positionId === posId && !e.voided).sort((a, b) => a.seq - b.seq);
    const last = evs[evs.length - 1];
    if (!f.replacedOn && last && last.businessDate && p.replacedOn < last.businessDate) f.replacedOn = 'Earlier than the latest recorded replacement (' + EQ.fmtDate(last.businessDate) + '). Enter past work oldest first (409 out_of_order_installation).';
    if (p.expectedCurrentEventId && (last ? last.id : null) !== p.expectedCurrentEventId) return fail(409, 'installation_changed', 'Another user changed this position since you opened the form.');
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
    const before = snapshot(S$.row(posId));
    const all = EQ.state.D.events.filter((e) => e.positionId === posId);
    EQ.state.D.events.push({ id: 'ev-cr-' + posId + '-' + all.length, positionId: posId, seq: all.length + 1, kind: 'conditionReplacement', businessDate: p.replacedOn, jobId: null, lineId: null, removedFromEventId: last ? last.id : null, removedKnown: !!last, removedDesc: last ? last.installed.desc : null, removedSerial: last ? last.installed.serial : null, installed: { desc: p.desc.trim(), mfr: p.brand || null, partNo: p.model || null, serial: p.serial || null, qty: 1, uom: pos.uom }, recordedUtc: new Date().toISOString(), recordedBy: EQ.user().id, voided: false });
    if (p.remarks != null) Sd().remarks[posId] = p.remarks;
    pushHist(pos, 'registerReplacement', before, snapshot(S$.row(posId)), null);
    EQ.log('audit: sparepart.replacement ' + pos.name); EQ.notify(); return { ok: true };
  };
  S$.amend = function amend(posId, p) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const pos = EQ.pos(posId); const r = pos && Sd().designated[posId] ? S$.row(posId) : null;
    if (!r) return fail(404, 'not_found', 'Not a major spare-part position.');
    if (!r.condition) return fail(409, 'no_current_installation', 'Nothing is recorded here yet. Use Record Original or Record replacement.');
    const before = snapshot(r);
    const ev = EQ.state.D.events.find((e) => e.id === r.currentEventId);
    ev.installed = { ...ev.installed, mfr: p.brand || null, partNo: p.model || null, serial: p.serial || null, desc: (p.desc || ev.installed.desc) };
    if (p.remarks != null) Sd().remarks[posId] = p.remarks;
    pushHist(pos, 'registerAmend', before, snapshot(S$.row(posId)), p.reason || null);
    EQ.notify(); return { ok: true };
  };
  S$.setRemarks = function setRemarks(posId, text) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const pos = EQ.pos(posId); if (!pos || !Sd().designated[posId]) return fail(404, 'not_found', 'Not a major spare-part position.');
    const before = snapshot(S$.row(posId)); Sd().remarks[posId] = (text || '').slice(0, 2000);
    pushHist(pos, 'registerRemarks', before, snapshot(S$.row(posId)), null); EQ.notify(); return { ok: true };
  };
  /** Add spare part (U1-C21, DATA s16.3, API s4.18 POST /equipment/{id}/spare-parts): EQ Team and Admin (eq.work) add an active,
   *  non-designated position of one equipment to its register and record its first condition in one atomic step. Nothing is saved
   *  on any refusal. condition '' keeps an installation that is already recorded at the position (job or earlier register entry).
   *  p = { equipmentId, posId, typeId, lifeMonths ('' = part-type default), condition ('original'|'replaced'|''), replacedOn, desc, brand, model, serial, remarks } */
  S$.add = function add(p) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const pos = EQ.pos(p.posId); const eq = EQ.eq(p.equipmentId);
    if (!pos || !eq) return fail(404, 'not_found', 'Unknown equipment or position.');
    if (pos.equipmentId !== eq.id) return fail(422, 'target_not_in_equipment', 'The position does not belong to ' + eq.code + '.');
    if (eq.lifecycle !== 'active') return fail(409, 'equipment_retired', eq.code + ' is not active.');
    if (pos.state !== 'active') return fail(422, 'position_not_active', 'Only confirmed (active) positions can be added.');
    if (Sd().designated[pos.id]) return fail(409, 'already_major_spare_part', pos.name + ' is already in the register of ' + eq.code + '. Use Update... to change its condition.');
    const evs = EQ.state.D.events.filter((e) => e.positionId === pos.id && !e.voided).sort((a, b) => a.seq - b.seq);
    const last = evs[evs.length - 1] || null;
    const cond = p.condition || '';
    if (cond === 'original' && last) return fail(409, 'position_has_installation_history', 'This position already has installation history, so it cannot be recorded as Original. Keep the recorded installation or record a replacement.');
    const f = {}; const today = EQ.todayColombo();
    const t = S$.typeOf(p.typeId);
    if (!t || !t.active) f.typeId = 'Choose a spare-part type (an Admin maintains the types).';
    const life = p.lifeMonths === '' || p.lifeMonths == null ? null : Number(p.lifeMonths);
    if (life != null && !(Number.isInteger(life) && life >= 1 && life <= 600)) f.lifeMonths = 'Expected life must be a whole number of 1 to 600 months, or blank for the part-type default.';
    if (!['original', 'replaced', ''].includes(cond) || (cond === '' && !last)) f.condition = 'Choose Original or Replaced.';
    if (cond && !(p.desc || '').trim()) f.desc = 'Describe the installed item.';
    if (cond === 'replaced') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.replacedOn || '') || p.replacedOn > today) f.replacedOn = 'Enter a fitted/replaced date that is not in the future (Asia/Colombo).';
      else if (last && last.businessDate && p.replacedOn < last.businessDate) f.replacedOn = 'Earlier than the latest recorded replacement (' + EQ.fmtDate(last.businessDate) + ') (409 out_of_order_installation).';
    }
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
    // one transaction: designation + first condition + one history row
    const prevHist = Sd().history.filter((x) => x.posId === pos.id).slice(-1)[0];
    Sd().designated[pos.id] = { typeId: t.id, lifeOverride: life, addedBy: EQ.user().id };
    const all = EQ.state.D.events.filter((e) => e.positionId === pos.id);
    const item = () => ({ desc: p.desc.trim(), mfr: p.brand || null, partNo: p.model || null, serial: p.serial || null, qty: 1, uom: pos.uom });
    if (cond === 'original') EQ.state.D.events.push({ id: 'ev-add-' + pos.id + '-' + all.length, positionId: pos.id, seq: all.length + 1, kind: 'baselineRecorded', businessDate: null, jobId: null, lineId: null, removedFromEventId: null, removedKnown: false, removedDesc: null, removedSerial: null, installed: item(), recordedUtc: new Date().toISOString(), recordedBy: EQ.user().id, voided: false });
    if (cond === 'replaced') EQ.state.D.events.push({ id: 'ev-add-' + pos.id + '-' + all.length, positionId: pos.id, seq: all.length + 1, kind: 'conditionReplacement', businessDate: p.replacedOn, jobId: null, lineId: null, removedFromEventId: last ? last.id : null, removedKnown: !!last, removedDesc: last ? last.installed.desc : null, removedSerial: last ? last.installed.serial : null, installed: item(), recordedUtc: new Date().toISOString(), recordedBy: EQ.user().id, voided: false });
    if (p.remarks) Sd().remarks[pos.id] = String(p.remarks).slice(0, 2000);
    pushHist(pos, 'registerAdd', prevHist ? prevHist.after : null, { ...snapshot(S$.row(pos.id)), typeId: t.id, lifeOverride: life }, null);
    EQ.log('audit: sparepart.add ' + eq.code + ' ' + pos.name); EQ.notify();
    return { ok: true, row: S$.row(pos.id) };
  };
  /** Positions an EQ writer may add: active, not designated, of an active equipment, optionally inside a main/sub. */
  S$.addable = (eqId, mainId, subId) => EQ.positionsOf(eqId).filter((p) => p.state === 'active' && !Sd().designated[p.id] && (!mainId || p.mainId === mainId) && (!subId || p.subId === subId));
  S$.designate = function designate(posId, p) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const pos = EQ.pos(posId); if (!pos) return fail(404, 'not_found', 'Unknown position.');
    if (pos.state !== 'active') return fail(409, 'position_not_active', 'Only confirmed (active) positions can be designated.');
    const sp = Sd();
    const before = sp.designated[posId] ? { ...sp.designated[posId] } : null;
    if (!p.on) { delete sp.designated[posId]; } else {
      const f = {};
      if (!S$.typeOf(p.typeId)) f.typeId = 'Choose a spare-part type.';
      else if (!S$.typeOf(p.typeId).active && !(before && before.typeId === p.typeId)) f.typeId = 'This spare-part type is retired; choose an active type.';
      if (p.lifeOverride !== '' && p.lifeOverride != null && !(Number(p.lifeOverride) >= 1 && Number(p.lifeOverride) <= 600)) f.lifeOverride = 'Expected life must be 1 to 600 months.';
      if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
      sp.designated[posId] = { typeId: p.typeId, lifeOverride: p.lifeOverride === '' || p.lifeOverride == null ? null : Number(p.lifeOverride) };
    }
    pushHist(pos, 'designation', before, p.on ? { ...sp.designated[posId] } : null, p.reason || null);
    EQ.log('audit: sparepart.designation ' + pos.name + ' ' + (p.on ? 'on' : 'off')); EQ.notify(); return { ok: true };
  };
  /** Replacement special-job completion writes the register in the same transaction (DATA s16.4). */
  S$.noteCompletion = function noteCompletion(pos, job, line, remarks) {
    const sp = Sd();
    const last = sp.history.filter((h2) => h2.posId === pos.id).slice(-1)[0];
    if (remarks) sp.remarks[pos.id] = remarks;
    sp.history.push({ posId: pos.id, equipmentId: pos.equipmentId, rev: nextRev(pos.id), source: 'jobCompletion', before: last ? last.after : null, after: { condition: 'replaced', replacedOn: line.replacedOn, brand: line.item.mfr, model: line.item.partNo, serial: line.item.serial, remarks: sp.remarks[pos.id] || '' }, reason: null, by: EQ.user().id, at: new Date().toISOString(), jobId: job.id });
  };
  S$.setTypeLife = function setTypeLife(typeId, months) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const t = S$.typeOf(typeId); if (!t) return fail(404, 'not_found', 'Unknown type.');
    if (months !== '' && !(Number(months) >= 1 && Number(months) <= 600)) return fail(422, 'validation_failed', 'Expected life must be 1 to 600 months.', { life: 'Enter 1 to 600 months, or leave blank for none.' });
    const before = t.defaultLife;
    t.defaultLife = months === '' ? null : Number(months); typeLog(t, 'life', { defaultLife: before }, { defaultLife: t.defaultLife });
    EQ.log('audit: sparepart.typeLife ' + t.code + ' ' + t.defaultLife); EQ.notify(); return { ok: true };
  };
  // ---------------------------------------------------------------- U1-C22: Admin adds, edits and retires spare-part types (API s4.19)
  function typeLog(t, action, before, after) { (Sd().typeLog = Sd().typeLog || []).unshift({ typeId: t.id, code: t.code, action, before, after, by: EQ.user().id, at: new Date().toISOString() }); }
  const lifeErr = (v) => (v === '' || v == null ? null : (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 600 ? null : 'Enter a whole number of 1 to 600 months, or leave blank for none.'));
  /** POST /admin/spare-part-types: { code, name, defaultLife } - code immutable and unique (409 duplicate_code). */
  S$.addType = function addType(p) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const code = String(p.code || '').trim(); const name = String(p.name || '').trim(); const f = {};
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(code) || code.length > 32) f.code = 'Use lowercase letters, digits and hyphens, at most 32 characters (for example boom-hoist-motor).';
    else if (Sd().types.some((t) => t.code === code)) return fail(409, 'duplicate_code', 'A spare-part type with code ' + code + ' already exists.', { code: 'Already exists.' });
    if (!name) f.name = 'Enter the type name.'; else if (name.length > 200) f.name = 'At most 200 characters.';
    else if (Sd().types.some((t) => t.name.toLowerCase() === name.toLowerCase())) f.name = 'Another type has this name.';
    const le = lifeErr(p.defaultLife); if (le) f.defaultLife = le;
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
    const t = { id: 'spt-' + code, code, name, defaultLife: p.defaultLife === '' || p.defaultLife == null ? null : Number(p.defaultLife), active: true, origin: 'admin' };
    Sd().types.push(t); typeLog(t, 'added', null, { name, defaultLife: t.defaultLife });
    EQ.log('audit: sparepart.type.add ' + code); EQ.notify(); return { ok: true, type: t };
  };
  /** PUT /admin/spare-part-types/{id}: name (code never changes); prior value kept in the type log. */
  S$.renameType = function renameType(typeId, name) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const t = S$.typeOf(typeId); if (!t) return fail(404, 'not_found', 'Unknown type.');
    name = String(name || '').trim();
    if (!name || name.length > 200) return fail(422, 'validation_failed', 'Enter a type name of at most 200 characters.', { name: 'Enter a name.' });
    if (Sd().types.some((x) => x !== t && x.name.toLowerCase() === name.toLowerCase())) return fail(422, 'validation_failed', 'Another type has this name.', { name: 'Another type has this name.' });
    if (name === t.name) return { ok: true };
    const before = t.name; t.name = name; typeLog(t, 'renamed', { name: before }, { name });
    EQ.log('audit: sparepart.type.rename ' + t.code); EQ.notify(); return { ok: true };
  };
  /** POST /admin/spare-part-types/{id}/deactivate|activate: a retired type is not offered for new spare parts; designated positions keep it. */
  S$.setTypeActive = function setTypeActive(typeId, active) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const t = S$.typeOf(typeId); if (!t) return fail(404, 'not_found', 'Unknown type.');
    if (t.active === !!active) return { ok: true };
    t.active = !!active; typeLog(t, active ? 'reactivated' : 'retired', { active: !active }, { active: !!active });
    EQ.log('audit: sparepart.type.' + (active ? 'activate' : 'deactivate') + ' ' + t.code); EQ.notify(); return { ok: true };
  };
})(window.EQ);
