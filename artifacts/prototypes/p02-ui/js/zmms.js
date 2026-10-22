/* P02B: ZMMS daily jobs and automatic status (DATA_CONTRACT s15, API s4.18-s4.19).
   SYNTHETIC ONLY. This prototype never contacts ZMMS (www.zmms.lk) and holds no account. Every job number, equipment code and
   description below is invented. The column set, the vocabularies (job types, job statuses, priorities) and the equipment code format follow
   the structure of the real daily export file profiled on 22 October 2026 (file-level evidence only; the live page is read first in P07B,
   ZQ-01..ZQ-13); no description or personal data was copied from that file.
   The rule functions follow the contract so the screens show real behaviour: a failed run changes nothing, a manual correction holds
   for the current Asia/Colombo day, unmapped values stop the automatic status for the equipment concerned. */
window.EQ = window.EQ || {};
(function (EQ) {
  const pad = (n) => String(n).padStart(2, '0');
  const shiftDay = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); };
  EQ.shiftDay = shiftDay;
  /** Start of the current Asia/Colombo day as a UTC millisecond value (Colombo is UTC+05:30, no daylight saving). */
  EQ.colomboDayStartMs = () => { const [y, m, d] = EQ.todayColombo().split('-').map(Number); return Date.UTC(y, m - 1, d) - 5.5 * 3600e3; };
  const normKey = (t) => (t || '').trim().replace(/\s+/g, ' ').toUpperCase();
  EQ.zmmsKey = normKey;

  const Z = (EQ.zmms = {});
  const fail = (status, code, message, fields) => ({ ok: false, status, code, message, fields: fields || {} });
  const Zd = () => EQ.state.D.zmms;
  const actor = () => EQ.user().id;

  Z.RUN_FAILURES = {
    login_failed: 'login_failed - the login form was rejected (not retried automatically, to avoid locking the account)',
    layout_changed: "layout_changed - expected column 'Job No' not found; columns seen: 7",
    timeout: 'timeout - run exceeded 300 s after page 2 of 3',
    http_error: 'http_error - HTTP 503 from the host on page 2',
  };

  Z.build = function buildZmms(D) {
    const now = Date.now();
    const today = EQ.todayColombo();
    const ago = (h) => new Date(now - h * 3600e3).toISOString();
    const z = (D.zmms = {
      settings: { sync1: '06:00', sync2: '14:00', autoEnabled: true, staleAfterHours: 26 },
      forcedFailure: false, // prototype control: pretend the latest run failed
      runs: [], jobs: [], mappings: [], valueMappings: [], evaluations: [], seq: 1,
    });
    // ---- equipment mappings (aliases allowed; ignore for equipment the app does not manage) ----
    // Shape follows the real daily export profiled on 22 Oct 2026 (documents/"Daily All Running Jobs_CMMS-LK-2026-10-22.xls", a file
    // export, not the live page, so ZQ-03/06/07/08/09 stay open for P07B): equipment CODES such as QC002 / RT007 / ES004 / SQ008 (spreader)
    // / SF010 / RS002 / SK001 / WS001. The codes below use a 9xx block so they cannot be mistaken for fleet facts.
    const eqId = (code) => 'eq-' + code.toLowerCase();
    const map = (text, code) => z.mappings.push({ id: z.mappings.length + 1, key: normKey(text), action: 'map', equipmentId: eqId(code), state: 'active', by: 'u-admin', at: ago(24 * 30), retiredReason: null });
    map('QC901', 'QC-DEMO-01'); map('QC902', 'QC-DEMO-02'); map('QC904', 'QC-DEMO-04'); map('QC905', 'QC-DEMO-05'); map('QC906', 'QC-DEMO-06'); map('QC-906', 'QC-DEMO-06');
    map('RT901', 'RTG-DEMO-01'); map('RT902', 'RTG-DEMO-02'); map('RT903', 'RTG-DEMO-03'); map('RT906', 'RTG-DEMO-06'); map('ES901', 'ES-DEMO-01');
    z.mappings.push({ id: z.mappings.length + 1, key: normKey('SF901'), action: 'ignore', equipmentId: null, state: 'active', by: 'u-admin', at: ago(24 * 30), retiredReason: null });
    // ---- job type / status value mapping (effects are an Admin decision after the first real data, Q11). Raw values as in the export. ----
    const vm = (field, text, effect) => z.valueMappings.push({ id: z.valueMappings.length + 1, field, key: normKey(text), text, effect, lastSeenUtc: ago(3), by: 'u-admin' });
    vm('jobType', 'BreakDown', 'breakdown'); vm('jobType', 'CM', 'maintenance'); vm('jobType', 'PM', 'maintenance'); vm('jobType', 'Defect', 'none'); vm('jobType', 'WireRope', 'unmapped');
    vm('jobStatus', 'Initialized', 'open'); vm('jobStatus', 'Added To Daily', 'open'); vm('jobStatus', 'Re-Added to Daily', 'open'); vm('jobStatus', 'Hold', 'open'); vm('jobStatus', 'Completed', 'closed');
    // ---- daily job rows (all synthetic; columns as in the export) ----
    const TB = 'BreakDown', TC = 'CM', TP = 'PM', TD = 'Defect', TW = 'WireRope', SI = 'Initialized', SA = 'Added To Daily', SR = 'Re-Added to Daily', SH = 'Hold', SC = 'Completed';
    const rows = [];
    let n = 900100;
    const DEPT = { QC: ['QC', 'Quay Crane'], RT: ['RTG', 'Rubber Tyred Gantry Crane'], ES: ['Mobile', 'Empty Stacker'], SQ: ['Spreader', 'QC Spreader'], SF: ['Mobile', 'Small Forklift'], SK: ['Mobile', 'Sky Lift'], WS: ['Mobile', 'Workshop'], RS: ['Mobile', 'Reach Stacker'] };
    const add = (dayOffset, text, type, status, desc, x) => {
      x = x || {}; const d = DEPT[text.slice(0, 2).toUpperCase()] || ['QC', 'Quay Crane'];
      const done = status === SC;
      const jobNo = x.no || String(++n);
      rows.push({ jobNo, cwo: x.cwo === undefined ? (type === TP ? '' : n % 4 === 0 ? String(326100 + n % 97) : '') : x.cwo, date: shiftDay(today, -dayOffset), text, type, status, desc, absent: !!x.absent,
        priority: x.priority || (type === TB ? 'High' : type === TW ? 'Medium' : 'Low'), created: x.created || (shiftDay(today, -dayOffset - (type === TP ? 3 : 0)) + (type === TP ? ' 06:51:31' : ' 08:' + String(10 + n % 45).padStart(2, '0') + ':' + String(10 + n % 50).padStart(2, '0'))),
        dept: d[0], eqType: d[1], mechStaff: type === TP || done ? String(1 + n % 3) : '-', mechHours: type === TP || done ? [2, 4, 8, 10][n % 4].toFixed(2) : '-', elecStaff: n % 5 === 0 ? '1' : '-', elecHours: n % 5 === 0 ? '4.00' : '-',
        fault: type === TB || type === TD ? 'Reported fault text (synthetic)' : '', faultDesc: type === TB ? 'Fault description text (synthetic)' : '', corrective: done && type !== TP ? 'Corrective action text (synthetic)' : '', remark: '', instruction: type === TP ? 'Job instruction text (synthetic)' : '', workDone: done ? 'Work done summary text (synthetic)' : '', statusRemarks: status === SH ? 'Waiting for a part (synthetic)' : '' });
    };
    // today
    add(0, 'QC901', TC, SI, 'Hoist motor B replacement support: isolation and lifting plan (synthetic)');
    add(0, 'QC901', TP, SC, 'Pre-shift walk-down checklist (synthetic)');
    add(0, 'QC904', TP, SA, 'Hoist limit switch check (synthetic)');
    add(0, 'QC-906', TC, SI, 'Scheduled overhaul, day 12 (synthetic)', { priority: 'Medium' });
    add(0, 'RT903', TB, SI, 'Engine fault diagnosis (synthetic)');
    add(0, 'RT901', TP, SC, 'Quarterly structural walk-down, part 1 (synthetic)');
    add(0, 'RT906', TW, SI, 'Wire rope inspection (synthetic)');
    add(0, 'ES901', TD, SR, 'Hydraulic hose check (synthetic; a Defect has no status effect)');
    add(0, 'QC999', TC, SI, 'Spreader-side lighting (synthetic; equipment code not mapped)');
    add(0, 'QC999', TD, SI, 'Cabin door defect (synthetic; equipment code not mapped)');
    add(0, 'SQ901', TC, SI, 'Twist-lock service (synthetic; spreader code)');
    add(0, 'SQ901', TC, SC, 'Flipper repair (synthetic; spreader code)');
    add(0, 'SQ902', TP, SI, 'Spreader PM (synthetic; spreader code)');
    add(0, 'SF901', TC, SI, 'Forklift brake (synthetic; ignored by mapping)');
    add(0, 'RS901', TC, SH, 'Reach stacker tyre (synthetic; mobile equipment, not mapped)');
    add(0, 'SK901', TC, SI, 'Sky lift basket (synthetic; mobile equipment, not mapped)');
    add(0, 'WS901', TC, SI, 'Workshop crane (synthetic; not mapped)');
    // earlier days (history kept for every synced day)
    for (let d = 1; d <= 6; d += 1) {
      add(d, 'QC901', d <= 2 ? TC : TP, d === 1 ? SI : SC, d <= 2 ? 'Motor B replacement preparation, day ' + (3 - d) + ' (synthetic)' : 'Routine inspection (synthetic)');
      add(d, 'QC902', d % 2 ? TP : TC, SC, d % 2 ? 'Routine inspection (synthetic)' : 'Gantry bogie alignment follow-up (synthetic)');
      add(d, 'RT903', d < 2 ? TB : TC, d < 2 ? SI : SC, d < 2 ? 'Engine fault, first report (synthetic)' : 'Engine oil sampling (synthetic)');
      add(d, 'QC-906', TC, SI, 'Scheduled overhaul, day ' + (12 - d) + ' (synthetic)');
      if (d === 1) add(d, 'QC902', TC, SI, 'Spreader twist-lock inspection (synthetic)', { no: '900020', absent: true }); // dropped from a later complete run
      if (d === 2) add(d, 'QC999', TP, SC, 'Daily check (synthetic)');
      if (d === 3) add(d, 'SQ901', TC, SC, 'Spreader repair (synthetic)');
    }
    const eqs = D.equipment;
    rows.forEach((r, i) => {
      const key = normKey(r.text);
      const m = z.mappings.find((x) => x.key === key && x.state === 'active');
      const eq = m && m.action === 'map' ? eqs.find((e) => e.id === m.equipmentId) : null;
      z.jobs.push({
        id: i + 1, jobNo: r.jobNo, cwo: r.cwo, date: r.date, equipmentText: r.text, equipmentKey: key, equipmentId: eq ? eq.id : null,
        match: m ? (m.action === 'ignore' ? 'ignored' : 'matched') : 'unmatched',
        desc: r.desc, typeText: r.type, typeKey: normKey(r.type), statusText: r.status, statusKey: normKey(r.status), priority: r.priority, created: r.created, dept: r.dept, eqType: r.eqType,
        mechStaff: r.mechStaff, mechHours: r.mechHours, elecStaff: r.elecStaff, elecHours: r.elecHours, fault: r.fault, faultDesc: r.faultDesc, corrective: r.corrective, remark: r.remark, instruction: r.instruction, workDone: r.workDone, statusRemarks: r.statusRemarks,
        sourceState: r.absent ? 'absentFromSource' : 'present', origin: 'developmentFixture', firstRun: 1, lastRun: 1,
      });
    });
    // ---- sync runs (newest first). One synthetic failed run and its retry. ----
    const run = (id, trig, hoursAgo, outcome, extra) => ({ id, trigger: trig, startedUtc: ago(hoursAgo + 0.03), endedUtc: ago(hoursAgo), outcome, failureCode: null, failureDetail: null, businessDate: today, pagesRead: outcome === 'succeeded' ? 3 : 1, rowsRead: outcome === 'succeeded' ? 21 : 0, rowsNew: 0, rowsUpdated: 0, rowsUnchanged: 0, rowsAbsent: 0, rowsUnmatched: 0, evaluated: 0, applied: 0, suppressed: 0, retryOf: null, ...(extra || {}) });
    z.runs = [
      run(8, 'schedule', 2.5, 'succeeded', { rowsRead: 21, rowsNew: 4, rowsUpdated: 2, rowsUnchanged: 14, rowsAbsent: 1, rowsUnmatched: 4, evaluated: 10, applied: 1, suppressed: 2 }),
      run(7, 'schedule', 12, 'succeeded', { rowsRead: 17, rowsNew: 1, rowsUpdated: 3, rowsUnchanged: 13, rowsUnmatched: 3, evaluated: 10, applied: 0, suppressed: 1 }),
      run(6, 'retry', 24.1, 'succeeded', { retryOf: 5, rowsRead: 19, rowsNew: 5, rowsUpdated: 1, rowsUnchanged: 13, rowsUnmatched: 3, evaluated: 10, applied: 2, suppressed: 0 }),
      run(5, 'schedule', 24.3, 'failed', { failureCode: 'layout_changed', failureDetail: Z.RUN_FAILURES.layout_changed, nextRetryUtc: ago(24.2) }),
      run(4, 'schedule', 36, 'succeeded', { rowsRead: 18, rowsNew: 2, rowsUpdated: 2, rowsUnchanged: 14, rowsUnmatched: 2, evaluated: 10, applied: 1, suppressed: 0 }),
      run(3, 'schedule', 48, 'succeeded', { rowsRead: 16, rowsNew: 3, rowsUpdated: 0, rowsUnchanged: 13, rowsUnmatched: 2, evaluated: 10, applied: 0, suppressed: 0 }),
    ];
    z.seq = 9;
    // ---- equipment annotations: mapped or not, status source/mode ----
    const mappedIds = new Set(z.mappings.filter((m) => m.action === 'map' && m.state === 'active').map((m) => m.equipmentId));
    eqs.forEach((e) => { e.zmmsMapped = mappedIds.has(e.id); e.overrideOn = null; e.statusSource = e.zmmsMapped ? 'zmms' : 'manual'; e.statusCauses = []; });
    // QC-DEMO-04 carries a manual correction made today: the plan says maintenance, the crane is in breakdown.
    const q04 = eqs.find((e) => e.id === 'eq-qc-demo-04');
    const mid = EQ.colomboDayStartMs() + Math.max(20, (now - EQ.colomboDayStartMs()) / 60000 / 2) * 60000;
    q04.overrideOn = today; q04.statusSource = 'manual'; q04.statusSince = new Date(mid).toISOString(); q04.statusReason = 'Hoist overload trip, cause not yet found; the ZMMS plan lists only a routine check (synthetic)';
    q04.statusCauses = [];
    // initial evaluation of the latest run (shows causes and skip reasons)
    z.evaluations = [];
    eqs.filter((e) => e.zmmsMapped && e.lifecycle === 'active').forEach((e) => {
      const ev = Z.compute(e, today);
      const held = e.overrideOn && e.overrideOn >= today;
      z.evaluations.push({ runId: 8, equipmentId: e.id, computed: ev.computed, applied: false, skip: held ? 'manualOverride' : ev.skip || (ev.computed === e.status ? 'unchanged' : null), causes: ev.causes });
      if (!held && e.status && e.status === ev.computed) e.statusCauses = ev.causes;
    });
    // status change log: add source/kind to every existing record, then the automatic/manual entries
    D.statusChanges.forEach((c) => { c.source = 'manual'; c.kind = 'manualStatus'; c.causes = []; c.runId = null; });
    const sc = (eq, status, prev, source, kind, hoursAgo, reason, causes, runId, by) => D.statusChanges.push({ id: 'sc-v2-' + eq.key + '-' + D.statusChanges.length, equipmentId: eq.id, seq: D.statusChanges.filter((c) => c.equipmentId === eq.id).length + 1, status, prev, reason, relatedJobId: null, at: ago(hoursAgo), by: by || null, source, kind, causes: causes || [], runId: runId || null });
    // retag the latest records of mapped equipment as automatic where the story says so
    ['eq-qc-demo-01', 'eq-qc-demo-02', 'eq-qc-demo-05', 'eq-qc-demo-06', 'eq-rtg-demo-01', 'eq-rtg-demo-02', 'eq-rtg-demo-03', 'eq-rtg-demo-06', 'eq-es-demo-01'].forEach((id) => {
      const list = D.statusChanges.filter((c) => c.equipmentId === id).sort((a, b) => b.seq - a.seq);
      if (list[0]) { list[0].source = 'zmms'; list[0].kind = 'automatic'; list[0].by = null; list[0].runId = 8; list[0].causes = (eqs.find((e) => e.id === id).statusCauses || []).slice(); }
    });
    const q04e = D.statusChanges.filter((c) => c.equipmentId === q04.id).sort((a, b) => b.seq - a.seq)[0];
    if (q04e) { q04e.at = q04.statusSince; q04e.source = 'manual'; q04e.kind = 'manualCorrection'; q04e.by = 'u-eq-a'; q04e.reason = q04.statusReason; q04e.prev = q04e.prev || 'maintenance'; }
    sc(q04, 'maintenance', null, 'zmms', 'automatic', Math.max(2, (now - mid) / 3600e3 + 1), 'Automatic from the ZMMS day plan', ['900103'], 7, null);
    // keep seq ordering sensible: the automatic entry precedes the correction
    const q04list = D.statusChanges.filter((c) => c.equipmentId === q04.id).sort((a, b) => new Date(a.at) - new Date(b.at));
    q04list.forEach((c, i) => { c.seq = i + 1; });
    // QC-DEMO-03 has no ZMMS mapping and was never set; e04 unmapped keeps its V1 manual status.
    z.healthTick = now;
  };

  // ---------------------------------------------------------------- derived views
  Z.mode = function mode(eq) {
    if (!eq.zmmsMapped) return { key: 'manualUnmapped', label: 'Manual', long: 'Manual (not linked to ZMMS)' };
    const today = EQ.todayColombo();
    if (eq.overrideOn && eq.overrideOn >= today) return { key: 'manualCorrection', label: 'Manual', long: 'Manual correction for today (until the first ZMMS sync of the next day)' };
    if (eq.overrideOn) return { key: 'awaitingSync', label: 'Manual', long: 'Manual (from ' + EQ.fmtDate(eq.overrideOn) + '), awaiting the next ZMMS sync' };
    if (eq.statusSource === 'manual') return { key: 'awaitingAuto', label: 'Auto', long: 'Automatic: awaiting today\'s ZMMS sync' };
    return { key: 'automatic', label: 'Auto', long: 'Automatic from the ZMMS day plan' };
  };
  Z.jobsOn = (eqId, date, includeAbsent) => Zd().jobs.filter((j) => j.equipmentId === eqId && j.date === date && (includeAbsent || j.sourceState === 'present'));
  Z.todayJobs = (eqId) => Z.jobsOn(eqId, EQ.todayColombo(), false);
  Z.todayCount = (eq) => (eq.zmmsMapped ? Z.todayJobs(eq.id).length : null);
  Z.lastSuccess = () => Zd().runs.find((r) => r.outcome === 'succeeded') || null;
  Z.latestRun = () => Zd().runs[0];
  Z.freshness = function freshness() {
    const z = Zd(), last = Z.lastSuccess();
    const latest = z.runs[0];
    const hours = last ? (Date.now() - new Date(last.endedUtc).getTime()) / 3600e3 : Infinity;
    const stale = latest.outcome === 'failed' || hours > z.settings.staleAfterHours;
    return { from: last ? last.endedUtc : null, stale, latestOutcome: latest.outcome, failureCode: latest.failureCode, hours };
  };
  Z.freshLabel = () => { const f = Z.freshness(); return f.from ? 'ZMMS data from ' + EQ.fmtInstantShort(f.from) : 'No ZMMS data yet'; };
  Z.valueEffect = (field, key) => { const v = Zd().valueMappings.find((x) => x.field === field && x.key === key); return v ? v.effect : 'unmapped'; };
  Z.unmatched = function unmatched() {
    const m = {};
    Zd().jobs.filter((j) => j.match === 'unmatched').forEach((j) => { const r = (m[j.equipmentKey] = m[j.equipmentKey] || { key: j.equipmentKey, text: j.equipmentText, rows: 0, first: j.date, last: j.date }); r.rows += 1; if (j.date < r.first) r.first = j.date; if (j.date > r.last) r.last = j.date; });
    return Object.values(m).sort((a, b) => EQ.cmp(a.key, b.key));
  };
  Z.unmappedValues = () => Zd().valueMappings.filter((v) => v.effect === 'unmapped');
  Z.canEnableAuto = () => (Z.lastSuccess() && !Z.unmappedValues().length ? { ok: true } : { ok: false, why: Z.lastSuccess() ? 'Values seen in the latest run still have no effect: ' + Z.unmappedValues().map((v) => v.text).join(', ') + '.' : 'No successful run exists yet.' });

  /** Day plan of an equipment on a date and the status it computes (DATA s15.7 steps 1-4). */
  Z.compute = function compute(eq, date) {
    const plan = Z.jobsOn(eq.id, date, false);
    for (const r of plan) {
      if (Z.valueEffect('jobType', r.typeKey) === 'unmapped' || Z.valueEffect('jobStatus', r.statusKey) === 'unmapped') return { plan, computed: null, skip: 'unmappedValues', causes: [] };
    }
    const open = (r) => Z.valueEffect('jobStatus', r.statusKey) === 'open';
    const bd = plan.filter((r) => Z.valueEffect('jobType', r.typeKey) === 'breakdown' && open(r));
    if (bd.length) return { plan, computed: 'breakdown', skip: null, causes: bd.map((r) => r.jobNo) };
    const mt = plan.filter((r) => Z.valueEffect('jobType', r.typeKey) === 'maintenance' && open(r));
    if (mt.length) return { plan, computed: 'maintenance', skip: null, causes: mt.map((r) => r.jobNo) };
    return { plan, computed: 'readyForOps', skip: null, causes: [] };
  };

  function logStatus(eq, status, prev, source, kind, reason, causes, runId) {
    const D = EQ.state.D;
    D.statusChanges.push({ id: 'sc-' + eq.key + '-z' + (D.statusChanges.length + 1), equipmentId: eq.id, seq: D.statusChanges.filter((c) => c.equipmentId === eq.id).length + 1, status, prev, reason: reason || null, relatedJobId: null, at: new Date().toISOString(), by: source === 'manual' ? actor() : null, source, kind, causes: causes || [], runId: runId || null });
  }

  /** One simulated sync run (DATA s15.5-s15.7). opts: { outcome: 'succeeded' | failureCode, businessDate, inject: [{ equipmentText, type, status, desc }], trigger }.
   *  A failed run records itself and changes nothing else (ZM02). A succeeded run upserts, evaluates and applies the automatic status. */
  Z.syncNow = function syncNow(opts) {
    opts = opts || {};
    const deny = EQ.access.srv('admin.access'); if (deny && !opts.system) return deny;
    const z = Zd();
    if (z.runLock) return { ok: true, status: 202, alreadyRunning: true, runId: z.runLock };
    const id = z.seq++;
    const date = opts.businessDate || EQ.todayColombo();
    const base = { id, trigger: opts.trigger || 'manual', startedUtc: new Date().toISOString(), endedUtc: new Date().toISOString(), businessDate: date, retryOf: null, pagesRead: 0, rowsRead: 0, rowsNew: 0, rowsUpdated: 0, rowsUnchanged: 0, rowsAbsent: 0, rowsUnmatched: 0, evaluated: 0, applied: 0, suppressed: 0 };
    if (opts.outcome && opts.outcome !== 'succeeded') {
      const run = { ...base, outcome: 'failed', failureCode: opts.outcome, failureDetail: Z.RUN_FAILURES[opts.outcome] || opts.outcome, pagesRead: 1, rowsRead: 7 };
      z.runs.unshift(run);
      EQ.log('ZMMS run #' + id + ' FAILED (' + opts.outcome + '): previous data and every status kept unchanged'); EQ.notify();
      return { ok: true, status: 202, run, changedNothing: true };
    }
    // succeeded: upsert injected rows, mark nothing else, evaluate
    const run = { ...base, outcome: 'succeeded', failureCode: null, failureDetail: null, pagesRead: 3 };
    (opts.inject || []).forEach((r) => {
      const key = normKey(r.equipmentText);
      const m = z.mappings.find((x) => x.key === key && x.state === 'active');
      const eq = m && m.action === 'map' ? EQ.eq(m.equipmentId) : null;
      const no = r.jobNo || String(900500 + z.jobs.length);
      const existing = z.jobs.find((j) => j.jobNo === no && j.date === date);
      const row = { jobNo: no, date, equipmentText: r.equipmentText, equipmentKey: key, equipmentId: eq ? eq.id : null, match: m ? (m.action === 'ignore' ? 'ignored' : 'matched') : 'unmatched', desc: r.desc || 'Injected by the prototype simulation (synthetic)', typeText: r.type, typeKey: normKey(r.type), statusText: r.status || 'Initialized', statusKey: normKey(r.status || 'Initialized'), cwo: '', priority: r.priority || 'Medium', created: date + ' 09:00:00', dept: 'QC', eqType: 'Quay Crane', mechStaff: '-', mechHours: '-', elecStaff: '-', elecHours: '-', fault: '', faultDesc: '', corrective: '', remark: '', instruction: '', workDone: '', statusRemarks: '', sourceState: 'present', origin: 'developmentFixture', firstRun: id, lastRun: id };
      if (existing) { Object.assign(existing, row, { id: existing.id }); run.rowsUpdated += 1; } else { row.id = z.jobs.length + 1; z.jobs.push(row); run.rowsNew += 1; }
      ['jobType', 'jobStatus'].forEach((f) => { const k = f === 'jobType' ? row.typeKey : row.statusKey; if (!z.valueMappings.some((v) => v.field === f && v.key === k)) z.valueMappings.push({ id: z.valueMappings.length + 1, field: f, key: k, text: f === 'jobType' ? row.typeText : row.statusText, effect: 'unmapped', lastSeenUtc: new Date().toISOString(), by: null }); });
    });
    run.rowsRead = z.jobs.filter((j) => j.date === date && j.sourceState === 'present').length;
    run.rowsUnmatched = z.jobs.filter((j) => j.date === date && j.match === 'unmatched').length;
    // evaluation (inside the same simulated transaction)
    z.evaluations = [];
    EQ.state.D.equipment.filter((e) => e.zmmsMapped && e.lifecycle === 'active').forEach((e) => {
      run.evaluated += 1;
      const ev = Z.compute(e, date);
      const rec = { runId: id, equipmentId: e.id, computed: ev.computed, applied: false, skip: ev.skip, causes: ev.causes };
      z.evaluations.push(rec);
      if (!z.settings.autoEnabled) { rec.skip = 'automaticDisabled'; run.suppressed += 1; return; }
      if (ev.skip) { run.suppressed += 1; return; }
      if (e.overrideOn && e.overrideOn >= date) { rec.skip = 'manualOverride'; run.suppressed += 1; return; }
      if (e.overrideOn && e.overrideOn < date) {
        logStatus(e, ev.computed, e.status, 'zmms', 'overrideEnded', 'Manual correction ended; ZMMS plan applied', ev.causes, id);
        e.overrideOn = null; e.status = ev.computed; e.statusSince = new Date().toISOString(); e.statusReason = null; e.statusSource = 'zmms'; e.statusCauses = ev.causes; rec.applied = true; run.applied += 1; return;
      }
      if (ev.computed !== e.status || e.statusSource === 'manual') {
        if (ev.computed === e.status) { e.statusSource = 'zmms'; e.statusCauses = ev.causes; rec.skip = 'unchanged'; return; }
        logStatus(e, ev.computed, e.status, 'zmms', 'automatic', 'Automatic from the ZMMS day plan', ev.causes, id);
        e.status = ev.computed; e.statusSince = new Date().toISOString(); e.statusReason = null; e.statusSource = 'zmms'; e.statusCauses = ev.causes; e.version += 1; rec.applied = true; run.applied += 1;
      } else { e.statusCauses = ev.causes; rec.skip = 'unchanged'; }
    });
    z.runs.unshift(run);
    EQ.log('ZMMS run #' + id + ' succeeded: ' + run.rowsRead + ' rows, ' + run.applied + ' status change(s), ' + run.suppressed + ' evaluation(s) not applied'); EQ.notify();
    return { ok: true, status: 202, run };
  };

  /** EQ Team manual correction of a mapped equipment (current day only, reason mandatory, D-94). */
  Z.correct = function correct(eqId, p) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const eq = EQ.eq(eqId);
    if (eq.lifecycle === 'retired') return fail(409, 'equipment_retired', 'Retired equipment accepts no status changes.');
    const f = {};
    if (!['readyForOps', 'breakdown', 'maintenance'].includes(p.status)) f.status = 'Choose one of the three operational statuses.';
    if (!(p.reason || '').trim()) f.reason = 'A reason is required for every correction of an automatic status.';
    const today = EQ.todayColombo();
    if (p.status === eq.status && eq.overrideOn && eq.overrideOn >= today) f.status = 'Already a manual ' + EQ.STATUS[p.status].label + ' for today (409 status_unchanged).';
    if (p.relatedJobId) { const j = EQ.job(p.relatedJobId); if (!j || j.equipmentId !== eq.id) f.relatedJobId = 'That job belongs to another equipment (422).'; }
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was changed.', f);
    logStatus(eq, p.status, eq.status, 'manual', 'manualCorrection', p.reason.trim(), [], null);
    eq.status = p.status; eq.statusSince = new Date().toISOString(); eq.statusReason = p.reason.trim(); eq.statusSource = 'manual'; eq.overrideOn = today; eq.statusCauses = []; eq.version += 1; eq.lastActivity = eq.statusSince;
    EQ.log('audit: status.correction ' + eq.code + ' -> ' + p.status + ' (manual for ' + today + ')'); EQ.notify();
    return { ok: true };
  };
  Z.backToAutomatic = function backToAutomatic(eqId) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const eq = EQ.eq(eqId);
    if (!eq.zmmsMapped) return fail(409, 'not_mapped', eq.code + ' is not linked to ZMMS; it keeps a manual status.');
    if (!eq.overrideOn) return fail(409, 'not_manual', 'The status is already automatic.');
    const z = Zd(), today = EQ.todayColombo();
    const ev = z.evaluations.find((x) => x.equipmentId === eq.id);
    const lastToday = Z.lastSuccess() && Z.lastSuccess().businessDate === today && ev && ev.computed;
    if (lastToday) {
      const comp = ev.computed;
      logStatus(eq, comp, eq.status, 'zmms', 'backToAutomatic', 'Back to automatic', ev.causes, Z.lastSuccess().id);
      eq.status = comp; eq.statusSince = new Date().toISOString(); eq.statusReason = null; eq.statusSource = 'zmms'; eq.statusCauses = ev.causes.slice();
    } else {
      logStatus(eq, eq.status, eq.status, 'manual', 'backToAutomatic', "Back to automatic: awaiting today's ZMMS sync", [], null);
      eq.statusSource = 'manual'; // shown "Automatic - awaiting today's ZMMS sync"
    }
    eq.overrideOn = null; eq.version += 1;
    EQ.log('audit: status.backToAutomatic ' + eq.code); EQ.notify();
    return { ok: true, awaiting: !lastToday };
  };

  // ---------------------------------------------------------------- Admin (admin.access)
  Z.saveSettings = function saveSettings(p) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const z = Zd(); const f = {};
    ['sync1', 'sync2'].forEach((k) => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p[k] || '')) f[k] = 'Enter a time as hh:mm (Asia/Colombo).'; });
    if (!f.sync1 && !f.sync2 && p.sync1 === p.sync2) f.sync2 = 'The two sync times must differ.';
    if (!(p.staleAfterHours >= 1 && p.staleAfterHours <= 168)) f.staleAfterHours = 'Enter 1 to 168 hours.';
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
    Object.assign(z.settings, { sync1: p.sync1, sync2: p.sync2, staleAfterHours: Number(p.staleAfterHours) });
    EQ.log('audit: zmms.settings ' + p.sync1 + ' / ' + p.sync2); EQ.notify(); return { ok: true };
  };
  Z.setAuto = function setAuto(on) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    if (on) { const c = Z.canEnableAuto(); if (!c.ok) return fail(422, 'zmms_mapping_incomplete', 'Automatic status cannot be switched on: ' + c.why); }
    Zd().settings.autoEnabled = !!on; EQ.log('audit: zmms.automaticStatus ' + (on ? 'on' : 'off')); EQ.notify(); return { ok: true };
  };
  Z.setEffect = function setEffect(id, effect) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const v = Zd().valueMappings.find((x) => x.id === id);
    if (!v) return fail(404, 'not_found', 'Unknown value.');
    const ok = v.field === 'jobType' ? ['breakdown', 'maintenance', 'none', 'unmapped'] : ['open', 'closed', 'unmapped'];
    if (!ok.includes(effect)) return fail(422, 'validation_failed', 'Not an allowed effect for ' + v.field + '.');
    v.effect = effect; EQ.log('audit: zmms.valueMapping ' + v.text + ' -> ' + effect); EQ.notify(); return { ok: true };
  };
  Z.addMapping = function addMapping(p) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const z = Zd(); const key = normKey(p.key); const f = {};
    if (!key) f.key = 'Enter the ZMMS equipment text.';
    else if (z.mappings.some((m) => m.key === key && m.state === 'active')) f.key = 'This key already has an active mapping (one key maps to at most one equipment).';
    if (p.action === 'map') { const e = EQ.eq(p.equipmentId); if (!e) f.equipmentId = 'Choose an equipment item.'; else if (e.lifecycle !== 'active') f.equipmentId = 'Only active equipment can be a target.'; }
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
    z.mappings.push({ id: z.mappings.length + 1, key, action: p.action, equipmentId: p.action === 'map' ? p.equipmentId : null, state: 'active', by: actor(), at: new Date().toISOString(), retiredReason: null });
    let attached = 0;
    z.jobs.filter((j) => j.equipmentKey === key && j.match === 'unmatched').forEach((j) => { if (p.action === 'map') { j.equipmentId = p.equipmentId; j.match = 'matched'; } else j.match = 'ignored'; attached += 1; });
    if (p.action === 'map') { const e = EQ.eq(p.equipmentId); if (!e.zmmsMapped) { e.zmmsMapped = true; e.statusSource = e.statusSource || 'manual'; } }
    EQ.log('audit: zmms.mapping ' + key + ' -> ' + (p.action === 'map' ? p.equipmentId : 'ignore') + ' (' + attached + ' existing row(s) attached, none duplicated; status is not recomputed until the next sync)'); EQ.notify();
    return { ok: true, attached };
  };
  Z.retireMapping = function retireMapping(id, reason) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const m = Zd().mappings.find((x) => x.id === id);
    if (!m || m.state !== 'active') return fail(404, 'not_found', 'No active mapping.');
    if (!(reason || '').trim()) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter a reason.' });
    m.state = 'retired'; m.retiredReason = reason.trim();
    if (m.action === 'map') { const still = Zd().mappings.some((x) => x.state === 'active' && x.action === 'map' && x.equipmentId === m.equipmentId); if (!still) { const e = EQ.eq(m.equipmentId); e.zmmsMapped = false; e.overrideOn = null; e.statusSource = 'manual'; } }
    EQ.log('audit: zmms.mapping.retire ' + m.key); EQ.notify(); return { ok: true };
  };
})(window.EQ);
