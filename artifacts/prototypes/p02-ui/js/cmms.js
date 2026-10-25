/* P02B: CMMS daily jobs and automatic status (DATA_CONTRACT s15, API s4.18-s4.19).
   SYNTHETIC ONLY. This prototype never contacts CMMS (www.zmms.lk) and holds no account. Every job number, equipment code and
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
  const colomboDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date(ms));
  /** 'YYYY-MM-DD HH:MM:SS' in Asia/Colombo (UTC+05:30), the format of the export's Created column. */
  const colomboStamp = (ms) => new Date(ms + 5.5 * 3600e3).toISOString().slice(0, 19).replace('T', ' ');
  const normKey = (t) => (t || '').trim().replace(/\s+/g, ' ').toUpperCase();
  EQ.cmmsKey = normKey;

  const Z = (EQ.cmms = {});
  const fail = (status, code, message, fields) => ({ ok: false, status, code, message, fields: fields || {} });
  const Zd = () => EQ.state.D.cmms;
  const actor = () => EQ.user().id;

  Z.RUN_FAILURES = {
    login_failed: 'login_failed - the login form was rejected (not retried automatically, to avoid locking the account)',
    layout_changed: "layout_changed - expected column 'Job No' not found; columns seen: 7",
    timeout: 'timeout - run exceeded 300 s after page 2 of 3',
    http_error: 'http_error - HTTP 503 from the host on page 2',
  };

  Z.build = function buildCmms(D) {
    const now = Date.now();
    const today = EQ.todayColombo();
    const ago = (h) => new Date(now - h * 3600e3).toISOString();
    const z = (D.cmms = {
      settings: { sync1: '06:00', sync2: '14:00', autoEnabled: true, staleAfterHours: 26 },
      forcedFailure: false, // prototype control: pretend the latest run failed
      runs: [], jobs: [], mappings: [], valueMappings: [], evaluations: [], seq: 1,
    });
    // ---- equipment mappings (aliases allowed; ignore for equipment the app does not manage) ----
    // Shape follows the real daily export profiled on 22 Oct 2026 (documents/"Daily All Running Jobs_CMMS-LK-2026-10-22.xls", a file
    // export, not the live page, so ZQ-03/06/07/08/09 stay open for P07B): equipment CODES such as QC002 / RT007 / ES004 / SQ008 (spreader)
    // / SF010 / RS002 / SK001 / WS001. The codes below use a 9xx block so they cannot be mistaken for fleet facts.
    const eqId = (code) => D.equipment.find((e) => e.code === code).id;
    const map = (text, code) => z.mappings.push({ id: z.mappings.length + 1, key: normKey(text), action: 'map', equipmentId: eqId(code), state: 'active', by: 'u-admin', at: ago(24 * 30), retiredReason: null });
    map('QC901', 'QC01'); map('QC902', 'QC02'); map('QC904', 'QC04'); map('QC905', 'QC05'); map('QC906', 'QC06'); map('QC-906', 'QC06');
    map('RT901', 'RTG01'); map('RT902', 'RTG02'); map('RT903', 'RTG03'); map('RT906', 'RTG06'); map('ES901', 'ES01');
    z.mappings.push({ id: z.mappings.length + 1, key: normKey('SF901'), action: 'ignore', equipmentId: null, state: 'active', by: 'u-admin', at: ago(24 * 30), retiredReason: null });
    // ---- job type / status value mapping (effects are an Admin decision after the first real data, Q11). Raw values as in the export. ----
    const vm = (field, text, effect) => z.valueMappings.push({ id: z.valueMappings.length + 1, field, key: normKey(text), text, effect, lastSeenUtc: ago(3), by: 'u-admin' });
    vm('jobType', 'BreakDown', 'breakdown'); vm('jobType', 'CM', 'maintenance'); vm('jobType', 'PM', 'maintenance'); vm('jobType', 'Defect', 'none'); vm('jobType', 'WireRope', 'unmapped');
    vm('jobStatus', 'Initialized', 'open'); vm('jobStatus', 'Added To Daily', 'open'); vm('jobStatus', 'Re-Added to Daily', 'open'); vm('jobStatus', 'Hold', 'open'); vm('jobStatus', 'Completed', 'closed');
    // ---- time model (Repair-R02B finding 2) ----
    // Runs sit at the scheduled times (06:00 and 14:00 Asia/Colombo) of the last three business days, and BusinessDate =
    // BusinessDay(StartedUtc) (DATA s15.5). Automatic status was already switched on before the first listed run; older runs are not
    // in this short fixture list. Before 06:05 today an Admin "Sync now" stands in for the first scheduled run, so today always has data.
    const t0 = EQ.colomboDayStartMs();
    const slot = (dayBack, hh, mm) => t0 - dayBack * 864e5 + (hh * 60 + (mm || 0)) * 60e3;
    const iso = (ms) => new Date(ms).toISOString();
    const runs = []; let rid = 0;
    const mkRun = (trigger, startMs, minutes, outcome, extra) => {
      const r = { id: ++rid, trigger, startedUtc: iso(startMs), endedUtc: iso(startMs + minutes * 60e3), businessDate: colomboDate(startMs), outcome, failureCode: null, failureDetail: null, retryOf: null, requestedBy: null,
        pagesRead: outcome === 'succeeded' ? 3 : 1, rowsRead: 0, rowsNew: 0, rowsUpdated: 0, rowsUnchanged: 0, rowsAbsent: 0, rowsUnmatched: 0, evaluated: 0, applied: 0, suppressed: 0, ...(extra || {}) };
      runs.push(r); return r;
    };
    mkRun('schedule', slot(2, 6), 2, 'succeeded'); mkRun('schedule', slot(2, 14), 2, 'succeeded');
    mkRun('schedule', slot(1, 6), 2, 'succeeded');
    const failedRun = mkRun('schedule', slot(1, 14), 1, 'failed', { failureCode: 'layout_changed', failureDetail: Z.RUN_FAILURES.layout_changed, nextRetryUtc: iso(slot(1, 14, 6)), rowsRead: 7 });
    mkRun('retry', slot(1, 14, 6), 2, 'succeeded', { retryOf: failedRun.id }); // parse failures are retried once after 5 minutes (s15.5 rule 4)
    const elapsed = now - t0;
    if (elapsed > (6 * 60 + 5) * 60e3) mkRun('schedule', slot(0, 6), 2, 'succeeded');
    else mkRun('manual', t0 + elapsed * 0.5, Math.min(2, (elapsed * 0.2) / 60e3), 'succeeded', { requestedBy: 'u-admin' });
    if (elapsed > (14 * 60 + 5) * 60e3) mkRun('schedule', slot(0, 14), 2, 'succeeded');
    const okRuns = runs.filter((r) => r.outcome === 'succeeded');
    const runsOn = (date) => okRuns.filter((r) => r.businessDate === date);

    // ---- daily job rows (all synthetic; columns as in the export) ----
    const TB = 'BreakDown', TC = 'CM', TP = 'PM', TD = 'Defect', TW = 'WireRope', SI = 'Initialized', SA = 'Added To Daily', SR = 'Re-Added to Daily', SH = 'Hold', SC = 'Completed';
    const rows = [];
    let n = 900100;
    const DEPT = { QC: ['QC', 'Quay Crane'], RT: ['RTG', 'Rubber Tyred Gantry Crane'], ES: ['Mobile', 'Empty Stacker'], SQ: ['Spreader', 'QC Spreader'], SF: ['Mobile', 'Small Forklift'], SK: ['Mobile', 'Sky Lift'], WS: ['Mobile', 'Workshop'], RS: ['Mobile', 'Reach Stacker'] };
    const add = (dayOffset, text, type, status, desc, x) => {
      x = x || {}; const d = DEPT[text.slice(0, 2).toUpperCase()] || ['QC', 'Quay Crane'];
      const done = status === SC;
      const jobNo = x.no || String(++n);
      const date = shiftDay(today, -dayOffset);
      // created before the day's first sync (Repair-R02B finding 2): a PM is planned three days ahead, other jobs the afternoon before
      const created = x.created || (type === TP ? shiftDay(date, -3) + ' 06:51:31' : shiftDay(date, -1) + ' ' + String(15 + (n % 6)).padStart(2, '0') + ':' + String(10 + (n % 45)).padStart(2, '0') + ':' + String(10 + (n % 50)).padStart(2, '0'));
      rows.push({ jobNo, cwo: x.cwo === undefined ? (type === TP ? '' : n % 4 === 0 ? String(326100 + n % 97) : '') : x.cwo, date, text, type, status, desc, absent: !!x.absent,
        priority: x.priority || (type === TB ? 'High' : type === TW ? 'Medium' : 'Low'), created,
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
    add(0, 'RT906', TW, SI, 'Wire rope inspection (synthetic; WireRope is a value first seen today and not mapped yet)');
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
      add(d, 'QC901', d <= 2 ? TC : TP, d <= 2 ? SI : SC, d <= 2 ? 'Motor B replacement preparation, day ' + (3 - d) + ' (synthetic)' : 'Routine inspection (synthetic)');
      add(d, 'QC902', d % 2 ? TP : TC, SC, d % 2 ? 'Routine inspection (synthetic)' : 'Gantry bogie alignment follow-up (synthetic)');
      add(d, 'RT903', d < 2 ? TB : TC, d < 2 ? SI : SC, d < 2 ? 'Engine fault, first report (synthetic)' : 'Engine oil sampling (synthetic)');
      add(d, 'QC-906', TC, SI, 'Scheduled overhaul, day ' + (12 - d) + ' (synthetic)');
      if (d === 1) add(d, 'QC902', TC, SI, 'Spreader twist-lock inspection (synthetic)', { no: '900020', absent: true }); // dropped from a later complete run of that day
      if (d === 1) add(d, 'RT906', TC, SI, 'Tyre change (synthetic)');
      if (d === 2) add(d, 'QC999', TP, SC, 'Daily check (synthetic)');
      if (d === 3) add(d, 'SQ901', TC, SC, 'Spreader repair (synthetic)');
    }
    const eqs = D.equipment;
    rows.forEach((r, i) => {
      const key = normKey(r.text);
      const m = z.mappings.find((x) => x.key === key && x.state === 'active');
      const eq = m && m.action === 'map' ? eqs.find((e) => e.id === m.equipmentId) : null;
      const day = runsOn(r.date);
      // first and last run that saw the row (rows of days before the listed runs keep null); an absent row was seen by the day's first run only
      const firstRun = day.length ? day[0].id : null, lastRun = day.length ? (r.absent ? day[0].id : day[day.length - 1].id) : null;
      z.jobs.push({
        id: i + 1, jobNo: r.jobNo, cwo: r.cwo, date: r.date, equipmentText: r.text, equipmentKey: key, equipmentId: eq ? eq.id : null,
        match: m ? (m.action === 'ignore' ? 'ignored' : 'matched') : 'unmatched',
        desc: r.desc, typeText: r.type, typeKey: normKey(r.type), statusText: r.status, statusKey: normKey(r.status), priority: r.priority, created: r.created, dept: r.dept, eqType: r.eqType,
        mechStaff: r.mechStaff, mechHours: r.mechHours, elecStaff: r.elecStaff, elecHours: r.elecHours, fault: r.fault, faultDesc: r.faultDesc, corrective: r.corrective, remark: r.remark, instruction: r.instruction, workDone: r.workDone, statusRemarks: r.statusRemarks,
        sourceState: r.absent ? 'absentFromSource' : 'present', origin: 'developmentFixture', firstRun, lastRun,
      });
    });
    // run counters from what each run saw
    const seenBy = (r) => z.jobs.filter((j) => j.date === r.businessDate && j.firstRun != null && j.firstRun <= r.id && j.lastRun >= r.id);
    okRuns.forEach((r) => {
      const seen = seenBy(r); const prevRun = runsOn(r.businessDate).filter((x) => x.id < r.id).slice(-1)[0];
      r.rowsRead = seen.length; r.rowsNew = seen.filter((j) => j.firstRun === r.id).length; r.rowsUnchanged = r.rowsRead - r.rowsNew;
      r.rowsAbsent = prevRun ? z.jobs.filter((j) => j.date === r.businessDate && j.lastRun === prevRun.id && j.sourceState === 'absentFromSource').length : 0;
      r.rowsUnmatched = seen.filter((j) => j.match === 'unmatched').length;
    });

    // ---- automatic status, replayed run by run (Repair-R02B finding 2) ----
    // Every automatic row is written by the run that computed it, at that run's end, with reason null and its causes (DATA s3.7, s15.7).
    // Unmapped equipment keeps the V1 manual history. A mapped equipment keeps only the manual rows recorded before the first listed run.
    const mappedIds = new Set(z.mappings.filter((m) => m.action === 'map' && m.state === 'active').map((m) => m.equipmentId));
    eqs.forEach((e) => { e.cmmsMapped = mappedIds.has(e.id); e.overrideOn = null; e.statusSource = e.cmmsMapped ? 'cmms' : 'manual'; e.statusCauses = []; e.statusPlanDate = null; e.statusRunId = null; });
    D.statusChanges.forEach((c) => { c.source = 'manual'; c.kind = 'manualStatus'; c.causes = []; c.runId = null; c.planDate = null; });
    const goLive = new Date(okRuns[0].startedUtc).getTime();
    D.statusChanges = D.statusChanges.filter((c) => !mappedIds.has(c.equipmentId) || new Date(c.at).getTime() < goLive);
    const mapped = eqs.filter((e) => e.cmmsMapped && e.lifecycle === 'active');
    const st = new Map(mapped.map((e) => {
      const last = D.statusChanges.filter((c) => c.equipmentId === e.id).sort((a, b) => new Date(a.at) - new Date(b.at)).slice(-1)[0];
      return [e.id, last ? { status: last.status, since: last.at, source: 'manual', reason: last.reason || null, causes: [], planDate: null, runId: null, overrideOn: null } : { status: null, since: null, source: null, reason: null, causes: [], planDate: null, runId: null, overrideOn: null }];
    }));
    const push = (e, c) => { const s = st.get(e.id); D.statusChanges.push({ id: 'sc-v2-' + e.key + '-' + D.statusChanges.length, equipmentId: e.id, seq: 0, prev: s.status, relatedJobId: null, ...c }); if (c.status !== s.status) s.since = c.at; s.status = c.status; s.source = c.source; s.reason = c.reason; };
    // QC04: an EQ Team correction made today after the day's first sync (the plan says maintenance, the crane is in breakdown)
    const q04 = eqs.find((e) => e.id === 'eq-qc-demo-04');
    const firstToday = runsOn(today)[0];
    const corrAt = new Date(firstToday.endedUtc).getTime() + Math.max(1000, (now - new Date(firstToday.endedUtc).getTime()) * 0.5);
    const q04Reason = 'Hoist overload trip, cause not yet found; the CMMS plan lists only a routine check (synthetic)';
    let corrected = false;
    const correctQ04 = () => { corrected = true; push(q04, { status: 'breakdown', source: 'manual', kind: 'manualCorrection', reason: q04Reason, causes: [], runId: null, planDate: null, at: iso(corrAt), by: 'u-eq-a' }); const s = st.get(q04.id); s.overrideOn = today; s.causes = []; s.planDate = null; s.runId = null; };
    let lastEvals = [];
    okRuns.forEach((r) => {
      if (!corrected && corrAt < new Date(r.startedUtc).getTime()) correctQ04();
      const evals = [];
      mapped.forEach((e) => {
        r.evaluated += 1;
        const s = st.get(e.id);
        const ev = Z.evalPlan(seenBy(r).filter((j) => j.equipmentId === e.id));
        const rec = { runId: r.id, equipmentId: e.id, computed: ev.computed, applied: false, skip: ev.skip, causes: ev.causes };
        evals.push(rec);
        if (ev.skip) { r.suppressed += 1; return; }
        if (s.overrideOn && s.overrideOn >= r.businessDate) { rec.skip = 'manualOverride'; r.suppressed += 1; return; }
        if (s.status === ev.computed && s.source === 'cmms') { rec.skip = 'unchanged'; s.causes = ev.causes; s.planDate = r.businessDate; s.runId = r.id; return; }
        push(e, { status: ev.computed, source: 'cmms', kind: 'automatic', reason: null, causes: ev.causes, runId: r.id, planDate: r.businessDate, at: r.endedUtc, by: null });
        s.causes = ev.causes; s.planDate = r.businessDate; s.runId = r.id; rec.applied = true; r.applied += 1;
      });
      lastEvals = evals;
    });
    if (!corrected) correctQ04();
    z.evaluations = lastEvals;
    mapped.forEach((e) => {
      const s = st.get(e.id);
      e.status = s.status; e.statusSince = s.since; e.statusSource = s.source; e.statusReason = s.source === 'manual' ? s.reason : null;
      e.statusCauses = s.causes.slice(); e.statusPlanDate = s.planDate; e.statusRunId = s.runId; e.overrideOn = s.overrideOn;
    });
    // sequence numbers follow time per equipment
    eqs.forEach((e) => D.statusChanges.filter((c) => c.equipmentId === e.id).sort((a, b) => new Date(a.at) - new Date(b.at)).forEach((c, i) => { c.seq = i + 1; }));
    z.runs = runs.slice().reverse(); // newest first
    z.seq = rid + 1;
    // QC03 has no CMMS mapping and was never set; e04 unmapped keeps its V1 manual status.
    z.healthTick = now;
  };

  // ---------------------------------------------------------------- derived views
  Z.mode = function mode(eq) {
    if (!eq.cmmsMapped) return { key: 'manualUnmapped', label: 'Manual', long: 'Manual (not linked to CMMS)' };
    const today = EQ.todayColombo();
    if (eq.overrideOn && eq.overrideOn >= today) return { key: 'manualCorrection', label: 'Manual', long: 'Manual correction for today (until the first CMMS sync of the next day)' };
    if (eq.overrideOn) return { key: 'awaitingSync', label: 'Manual', long: 'Manual (from ' + EQ.fmtDate(eq.overrideOn) + '), awaiting the next CMMS sync' };
    if (eq.statusSource === 'manual') return { key: 'awaitingAuto', label: 'Auto', long: 'Automatic: awaiting today\'s CMMS sync' };
    return { key: 'automatic', label: 'Auto', long: 'Automatic from the CMMS day plan' };
  };
  Z.jobsOn = (eqId, date, includeAbsent) => Zd().jobs.filter((j) => j.equipmentId === eqId && j.date === date && (includeAbsent || j.sourceState === 'present'));
  Z.todayJobs = (eqId) => Z.jobsOn(eqId, EQ.todayColombo(), false);
  Z.todayCount = (eq) => (eq.cmmsMapped ? Z.todayJobs(eq.id).length : null);
  Z.lastSuccess = () => Zd().runs.find((r) => r.outcome === 'succeeded') || null;
  Z.latestRun = () => Zd().runs[0];
  Z.freshness = function freshness() {
    const z = Zd(), last = Z.lastSuccess();
    const latest = z.runs[0];
    const hours = last ? (Date.now() - new Date(last.endedUtc).getTime()) / 3600e3 : Infinity;
    const stale = latest.outcome === 'failed' || hours > z.settings.staleAfterHours;
    return { from: last ? last.endedUtc : null, stale, latestOutcome: latest.outcome, failureCode: latest.failureCode, hours };
  };
  /** Why the current status is what it is, for the panel and the status board (DATA s3.7: a Ready result has no causes and shows
   *  "Not in the CMMS plan for <date>"; Breakdown/Maintenance list every causing CMMS job of the plan that produced it). */
  Z.causeText = function causeText(eq) {
    if (!eq.cmmsMapped || eq.statusSource !== 'cmms' || !eq.statusPlanDate) return '';
    const when = EQ.fmtDate(eq.statusPlanDate) + (eq.statusPlanDate === EQ.todayColombo() ? ' (today)' : '');
    if (eq.statusCauses && eq.statusCauses.length) return 'Caused by CMMS job ' + eq.statusCauses.join(', ') + ' in the plan of ' + when;
    return eq.status === 'readyForOps' ? 'Not in the CMMS plan for ' + when : '';
  };
  Z.freshLabel = () => { const f = Z.freshness(); return f.from ? 'CMMS data from ' + EQ.fmtInstantShort(f.from) : 'No CMMS data yet'; };
  Z.valueEffect = (field, key) => { const v = Zd().valueMappings.find((x) => x.field === field && x.key === key); return v ? v.effect : 'unmapped'; };
  Z.unmatched = function unmatched() {
    const m = {};
    Zd().jobs.filter((j) => j.match === 'unmatched').forEach((j) => { const r = (m[j.equipmentKey] = m[j.equipmentKey] || { key: j.equipmentKey, text: j.equipmentText, rows: 0, first: j.date, last: j.date }); r.rows += 1; if (j.date < r.first) r.first = j.date; if (j.date > r.last) r.last = j.date; });
    return Object.values(m).sort((a, b) => EQ.cmp(a.key, b.key));
  };
  Z.unmappedValues = () => Zd().valueMappings.filter((v) => v.effect === 'unmapped');
  Z.canEnableAuto = () => (Z.lastSuccess() && !Z.unmappedValues().length ? { ok: true } : { ok: false, why: Z.lastSuccess() ? 'Values seen in the latest run still have no effect: ' + Z.unmappedValues().map((v) => v.text).join(', ') + '.' : 'No successful run exists yet.' });

  /** Day plan of an equipment on a date and the status it computes (DATA s15.7 steps 1-4). */
  Z.compute = function compute(eq, date) { return Z.evalPlan(Z.jobsOn(eq.id, date, false)); };
  /** DATA s15.7 steps 3-4 on a given set of day-plan rows (also used to replay the fixture runs). */
  Z.evalPlan = function evalPlan(plan) {
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

  function logStatus(eq, status, prev, source, kind, reason, causes, runId, planDate) {
    const D = EQ.state.D;
    // automatic and overrideEnded rows carry no reason (the causes explain them, DATA s3.7); they are recorded by no user
    const sys = kind === 'automatic' || kind === 'overrideEnded';
    D.statusChanges.push({ id: 'sc-' + eq.key + '-z' + (D.statusChanges.length + 1), equipmentId: eq.id, seq: D.statusChanges.filter((c) => c.equipmentId === eq.id).length + 1, status, prev, reason: sys ? null : reason || null, relatedJobId: null, at: new Date().toISOString(), by: sys || source !== 'manual' && kind !== 'backToAutomatic' ? null : actor(), source, kind, causes: causes || [], runId: runId || null, planDate: planDate || null });
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
      EQ.log('CMMS run #' + id + ' FAILED (' + opts.outcome + '): previous data and every status kept unchanged'); EQ.notify();
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
      const row = { jobNo: no, date, equipmentText: r.equipmentText, equipmentKey: key, equipmentId: eq ? eq.id : null, match: m ? (m.action === 'ignore' ? 'ignored' : 'matched') : 'unmatched', desc: r.desc || 'Injected by the prototype simulation (synthetic)', typeText: r.type, typeKey: normKey(r.type), statusText: r.status || 'Initialized', statusKey: normKey(r.status || 'Initialized'), cwo: '', priority: r.priority || 'Medium', created: colomboStamp(Date.now()), dept: 'QC', eqType: 'Quay Crane', mechStaff: '-', mechHours: '-', elecStaff: '-', elecHours: '-', fault: '', faultDesc: '', corrective: '', remark: '', instruction: '', workDone: '', statusRemarks: '', sourceState: 'present', origin: 'developmentFixture', firstRun: id, lastRun: id };
      if (existing) { Object.assign(existing, row, { id: existing.id }); run.rowsUpdated += 1; } else { row.id = z.jobs.length + 1; z.jobs.push(row); run.rowsNew += 1; }
      ['jobType', 'jobStatus'].forEach((f) => { const k = f === 'jobType' ? row.typeKey : row.statusKey; if (!z.valueMappings.some((v) => v.field === f && v.key === k)) z.valueMappings.push({ id: z.valueMappings.length + 1, field: f, key: k, text: f === 'jobType' ? row.typeText : row.statusText, effect: 'unmapped', lastSeenUtc: new Date().toISOString(), by: null }); });
    });
    run.rowsRead = z.jobs.filter((j) => j.date === date && j.sourceState === 'present').length;
    run.rowsUnmatched = z.jobs.filter((j) => j.date === date && j.match === 'unmatched').length;
    // evaluation (inside the same simulated transaction)
    z.evaluations = [];
    EQ.state.D.equipment.filter((e) => e.cmmsMapped && e.lifecycle === 'active').forEach((e) => {
      run.evaluated += 1;
      const ev = Z.compute(e, date);
      const rec = { runId: id, equipmentId: e.id, computed: ev.computed, applied: false, skip: ev.skip, causes: ev.causes };
      z.evaluations.push(rec);
      if (!z.settings.autoEnabled) { rec.skip = 'automaticDisabled'; run.suppressed += 1; return; }
      if (ev.skip) { run.suppressed += 1; return; }
      if (e.overrideOn && e.overrideOn >= date) { rec.skip = 'manualOverride'; run.suppressed += 1; return; }
      if (e.overrideOn && e.overrideOn < date) {
        logStatus(e, ev.computed, e.status, 'cmms', 'overrideEnded', null, ev.causes, id, date);
        if (ev.computed !== e.status) e.statusSince = new Date().toISOString();
        e.overrideOn = null; e.status = ev.computed; e.statusReason = null; e.statusSource = 'cmms'; e.statusCauses = ev.causes; e.statusPlanDate = date; e.statusRunId = id; rec.applied = true; run.applied += 1; return;
      }
      if (ev.computed !== e.status || e.statusSource === 'manual') {
        // same value but the source was manual (e.g. after Back to automatic with no evaluation yet): a source-only automatic row (O1)
        logStatus(e, ev.computed, e.status, 'cmms', 'automatic', null, ev.causes, id, date);
        if (ev.computed !== e.status) e.statusSince = new Date().toISOString();
        e.status = ev.computed; e.statusReason = null; e.statusSource = 'cmms'; e.statusCauses = ev.causes; e.statusPlanDate = date; e.statusRunId = id; e.version += 1; rec.applied = true; run.applied += 1;
      } else { e.statusCauses = ev.causes; e.statusPlanDate = date; e.statusRunId = id; rec.skip = 'unchanged'; }
    });
    z.runs.unshift(run);
    EQ.log('CMMS run #' + id + ' succeeded: ' + run.rowsRead + ' rows, ' + run.applied + ' status change(s), ' + run.suppressed + ' evaluation(s) not applied'); EQ.notify();
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
    if (p.relatedJobId) { const j = EQ.job(p.relatedJobId); if (!j || !EQ.jobApplies(j, eq.id)) f.relatedJobId = 'That job does not apply to this equipment (422).'; }
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was changed.', f);
    logStatus(eq, p.status, eq.status, 'manual', 'manualCorrection', p.reason.trim(), [], null);
    eq.status = p.status; eq.statusSince = new Date().toISOString(); eq.statusReason = p.reason.trim(); eq.statusSource = 'manual'; eq.overrideOn = today; eq.statusCauses = []; eq.version += 1; eq.lastActivity = eq.statusSince;
    EQ.log('audit: status.correction ' + eq.code + ' -> ' + p.status + ' (manual for ' + today + ')'); EQ.notify();
    return { ok: true };
  };
  Z.backToAutomatic = function backToAutomatic(eqId) {
    const deny = EQ.access.srv('eq.work'); if (deny) return deny;
    const eq = EQ.eq(eqId);
    if (!eq.cmmsMapped) return fail(409, 'not_mapped', eq.code + ' is not linked to CMMS; it keeps a manual status.');
    if (!eq.overrideOn) return fail(409, 'not_manual', 'The status is already automatic.');
    const z = Zd(), today = EQ.todayColombo();
    const ev = z.evaluations.find((x) => x.equipmentId === eq.id);
    const lastToday = !!(Z.lastSuccess() && Z.lastSuccess().businessDate === today && ev && ev.computed);
    if (lastToday) {
      const comp = ev.computed;
      // only an evaluation with a computed value is applied (DATA s15.7 step 6, Repair-R02B finding 3)
      logStatus(eq, comp, eq.status, 'cmms', 'backToAutomatic', null, ev.causes, Z.lastSuccess().id, today);
      if (comp !== eq.status) eq.statusSince = new Date().toISOString();
      eq.status = comp; eq.statusReason = null; eq.statusSource = 'cmms'; eq.statusCauses = ev.causes.slice(); eq.statusPlanDate = today; eq.statusRunId = Z.lastSuccess().id;
    } else {
      logStatus(eq, eq.status, eq.status, 'manual', 'backToAutomatic', "Back to automatic: awaiting today's CMMS sync", [], null);
      eq.statusSource = 'manual'; // shown "Automatic - awaiting today's CMMS sync"
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
    EQ.log('audit: cmms.settings ' + p.sync1 + ' / ' + p.sync2); EQ.notify(); return { ok: true };
  };
  Z.setAuto = function setAuto(on) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    if (on) { const c = Z.canEnableAuto(); if (!c.ok) return fail(422, 'cmms_mapping_incomplete', 'Automatic status cannot be switched on: ' + c.why); }
    Zd().settings.autoEnabled = !!on; EQ.log('audit: cmms.automaticStatus ' + (on ? 'on' : 'off')); EQ.notify(); return { ok: true };
  };
  Z.setEffect = function setEffect(id, effect) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const v = Zd().valueMappings.find((x) => x.id === id);
    if (!v) return fail(404, 'not_found', 'Unknown value.');
    const ok = v.field === 'jobType' ? ['breakdown', 'maintenance', 'none', 'unmapped'] : ['open', 'closed', 'unmapped'];
    if (!ok.includes(effect)) return fail(422, 'validation_failed', 'Not an allowed effect for ' + v.field + '.');
    v.effect = effect; EQ.log('audit: cmms.valueMapping ' + v.text + ' -> ' + effect); EQ.notify(); return { ok: true };
  };
  Z.addMapping = function addMapping(p) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const z = Zd(); const key = normKey(p.key); const f = {};
    if (!key) f.key = 'Enter the CMMS equipment text.';
    else if (z.mappings.some((m) => m.key === key && m.state === 'active')) f.key = 'This key already has an active mapping (one key maps to at most one equipment).';
    if (p.action === 'map') { const e = EQ.eq(p.equipmentId); if (!e) f.equipmentId = 'Choose an equipment item.'; else if (e.lifecycle !== 'active') f.equipmentId = 'Only active equipment can be a target.'; }
    if (Object.keys(f).length) return fail(422, 'validation_failed', 'Nothing was saved.', f);
    z.mappings.push({ id: z.mappings.length + 1, key, action: p.action, equipmentId: p.action === 'map' ? p.equipmentId : null, state: 'active', by: actor(), at: new Date().toISOString(), retiredReason: null });
    let attached = 0;
    z.jobs.filter((j) => j.equipmentKey === key && j.match === 'unmatched').forEach((j) => { if (p.action === 'map') { j.equipmentId = p.equipmentId; j.match = 'matched'; } else j.match = 'ignored'; attached += 1; });
    if (p.action === 'map') { const e = EQ.eq(p.equipmentId); if (!e.cmmsMapped) { e.cmmsMapped = true; e.statusSource = e.statusSource || 'manual'; } }
    EQ.log('audit: cmms.mapping ' + key + ' -> ' + (p.action === 'map' ? p.equipmentId : 'ignore') + ' (' + attached + ' existing row(s) attached, none duplicated; status is not recomputed until the next sync)'); EQ.notify();
    return { ok: true, attached };
  };
  Z.retireMapping = function retireMapping(id, reason) {
    const deny = EQ.access.srv('admin.access'); if (deny) return deny;
    const m = Zd().mappings.find((x) => x.id === id);
    if (!m || m.state !== 'active') return fail(404, 'not_found', 'No active mapping.');
    if (!(reason || '').trim()) return fail(422, 'validation_failed', 'A reason is required.', { reason: 'Enter a reason.' });
    m.state = 'retired'; m.retiredReason = reason.trim();
    if (m.action === 'map') { const still = Zd().mappings.some((x) => x.state === 'active' && x.action === 'map' && x.equipmentId === m.equipmentId); if (!still) { const e = EQ.eq(m.equipmentId); e.cmmsMapped = false; e.overrideOn = null; e.statusSource = 'manual'; } }
    EQ.log('audit: cmms.mapping.retire ' + m.key); EQ.notify(); return { ok: true };
  };
})(window.EQ);
