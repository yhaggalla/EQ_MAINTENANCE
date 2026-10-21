/* SYNTHETIC FIXTURES for the P02 prototype.
   Every equipment code contains "-DEMO-". Names, serials, part numbers, dates, jobs and history below are invented for
   interface review only. They are NOT fleet facts, NOT an assignment of the J526A drawing family to any real crane, and
   are never to be reused as production seed data (D-21). The mechanism catalogue (catalog.js) and drawing observations
   (params.js) are the only real reference data. */
window.EQ = window.EQ || {};
(function (EQ) {
  const USERS = {
    admin: { id: 'u-admin', name: 'Synthetic Admin' },
    eqTeam: { id: 'u-eq-a', name: 'Synthetic EQ Team user A' },
    management: { id: 'u-mgmt', name: 'Synthetic Management user' },
  };
  const OTHER_EQ = { id: 'u-eq-b', name: 'Synthetic EQ Team user B' };
  EQ.USERS = USERS;
  EQ.userName = (id) => [USERS.admin, USERS.eqTeam, USERS.management, OTHER_EQ].find((u) => u.id === id)?.name || id;

  // ---- model templates (applicability) ----
  const A = 'applicable', N = 'notApplicable';
  const setState = (codes, state, into) => codes.forEach((c) => (into[c] = state));
  function applic(applicable, notApplicable) {
    const m = {};
    setState(applicable, A, m); setState(notApplicable || [], N, m);
    return m; // absent = unknown (never treated as applicable)
  }
  // J526A family candidates follow docs/SOURCE_MAP.md s6 item 4 (candidates for Admin review, not confirmed facts).
  const J526A = applic(
    ['011', '012', '013', '015', '021', '022', '024', '031', '033', '041', '042', '051', '061', '062', '071', '081', '111', '121', '131', '141', '151', '152', '153', '161', '171'],
    ['043', '044', '045', '091', '092', '093', '094'],
  );
  const RTGM = applic(['011', '013', '015', '021', '024', '041', '043', '044', '046', '051', '061', '062', '071', '081', '091', '092', '093', '094', '131', '141', '151', '161'], []);
  const ESM = applic(['011', '021', '041', '044', '045', '051', '061', '071', '081', '091', '092', '141', '151', '161'], []);

  // ---- position templates: [semanticKey, subCode, name, kind, uom, nominalQty, category, provenance, source] ----
  const QC_T = [
    ['structure.portal.waterside.leg.a', '151', 'Portal waterside leg A', 'serialized', 'ea', 1, 'structural', 'drawing-derived', 'J526A00 p1 side view'],
    ['structure.portal.landside.leg.a', '151', 'Portal landside leg A', 'serialized', 'ea', 1, 'structural', 'drawing-derived', 'J526A00 p1 side view'],
    ['structure.girder.rear.main', '151', 'Fixed rear girder', 'serialized', 'ea', 1, 'structural', 'drawing-derived', 'J526A00 p1; J526A0100'],
    ['structure.mast.main', '151', 'Mast / A-frame', 'serialized', 'ea', 1, 'structural', 'estimated', 'J526A00 p1 (apex height conflict U-06)'],
    ['boom.main.girder', '031', 'Boom main girder', 'serialized', 'ea', 1, 'structural', 'drawing-derived', 'J526A00 p1; J526A0100'],
    ['boom.rope.set.main', '033', 'Boom hoist rope set', 'quantityLot', 'rope', null, 'ropeSet', 'estimated', 'J526A2300 reeving (count unconfirmed)'],
    ['hoist.drive.motor.a', '011', 'Main hoist motor A', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A0300 p1 layout'],
    ['hoist.drive.motor.b', '011', 'Main hoist motor B', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A0300 p1 layout'],
    ['hoist.drive.gearbox.a', '011', 'Main hoist gearbox A', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A0300 p1 layout'],
    ['hoist.drive.drum.a', '011', 'Main hoist drum A', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A0300 p1 layout'],
    ['hoist.emergency.brake.a', '012', 'Hoist emergency brake A', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A0300 p1 layout'],
    ['hoist.loadcell.main', '013', 'Hoist load cell set', 'serialized', 'ea', 1, 'component', 'approximate-location', 'Location approximate'],
    ['hoist.rope.set.main', '015', 'Main hoist rope set', 'quantityLot', 'rope', null, 'ropeSet', 'estimated', 'J526A2000 reeving (count unconfirmed)'],
    ['trolley.frame', '021', 'Trolley frame', 'serialized', 'ea', 1, 'structural', 'drawing-derived', 'J526A0200 p1'],
    ['trolley.wheel.position.a', '021', 'Trolley wheel position A', 'serialized', 'ea', 1, 'component', 'estimated', 'J526A0200; ZT2-015022 wheel'],
    ['trolley.wheel.position.b', '021', 'Trolley wheel position B', 'serialized', 'ea', 1, 'component', 'estimated', 'J526A0200; ZT2-015022 wheel'],
    ['trolley.rope.set.main', '024', 'Trolley rope set', 'quantityLot', 'rope', null, 'ropeSet', 'estimated', 'J526A2100 reeving (count unconfirmed)'],
    ['gantry.bogie.waterside.a', '041', 'Gantry bogie waterside A', 'serialized', 'ea', 1, 'component', 'drawing-derived', 'J526A0600 p1'],
    ['gantry.bogie.landside.a', '041', 'Gantry bogie landside A', 'serialized', 'ea', 1, 'component', 'drawing-derived', 'J526A0600 p1'],
    ['gantry.cable-reel.main', '042', 'Gantry HV cable reel', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A4000; GA end view'],
    ['electrical.control-power.main', '051', 'Control power cabinet', 'serialized', 'ea', 1, 'electrical', 'approximate-location', 'Location approximate (machinery house)'],
    ['spreader.frame', '061', 'Spreader frame', 'serialized', 'ea', 1, 'component', 'estimated', 'J526A00 p2 item 35'],
    ['headblock.frame', '062', 'Headblock frame', 'serialized', 'ea', 1, 'component', 'drawing-derived', 'J526A1200 p1'],
    ['electrical.plc.main', '081', 'Main PLC cabinet', 'serialized', 'ea', 1, 'electrical', 'approximate-location', 'Location approximate (machinery house)'],
    ['electrical.hv.switchgear', '121', 'HV switchgear', 'serialized', 'ea', 1, 'electrical', 'approximate-location', 'Location approximate (machinery house)'],
    ['cabin.operator.main', '141', 'Operator cabin', 'serialized', 'ea', 1, 'component', 'drawing-derived', 'J526A3100 p1'],
    ['access.elevator.car', '153', 'Elevator car', 'serialized', 'ea', 1, 'component', 'approximate-location', 'J526A5100 (location approximate)'],
  ];
  const RTG_T = [
    ['hoist.drive.motor.a', '011', 'Hoist motor A', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic RTG template'],
    ['hoist.rope.set.main', '015', 'Hoist rope set', 'quantityLot', 'rope', null, 'ropeSet', 'n/a', 'Synthetic RTG template'],
    ['trolley.frame', '021', 'Trolley frame', 'serialized', 'ea', 1, 'structural', 'n/a', 'Synthetic RTG template'],
    ['gantry.steer.assembly.a', '043', 'Gantry steer assembly A', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic RTG template'],
    ['gantry.tyre.set.a', '044', 'Gantry tyre set A', 'quantityLot', 'tyre', null, 'component', 'n/a', 'Synthetic RTG template'],
    ['engine.main', '091', 'Engine', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic RTG template'],
    ['generator.main', '092', 'Generator', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic RTG template'],
    ['spreader.frame', '061', 'Spreader frame', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic RTG template'],
    ['electrical.plc.main', '081', 'Main PLC cabinet', 'serialized', 'ea', 1, 'electrical', 'n/a', 'Synthetic RTG template'],
    ['cabin.operator.main', '141', 'Operator cabin', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic RTG template'],
  ];
  const ES_T = [
    ['drive.motor.a', '011', 'Drive motor A', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic ES template'],
    ['gantry.tyre.set.a', '044', 'Tyre set A', 'quantityLot', 'tyre', null, 'component', 'n/a', 'Synthetic ES template'],
    ['engine.main', '091', 'Engine', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic ES template'],
    ['spreader.frame', '061', 'Spreader frame', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic ES template'],
    ['cabin.operator.main', '141', 'Operator cabin', 'serialized', 'ea', 1, 'component', 'n/a', 'Synthetic ES template'],
  ];

  EQ.buildFixtures = function buildFixtures() {
    const now = Date.now();
    const ago = (h) => new Date(now - h * 3600e3).toISOString();
    const D = {
      builtAt: new Date(now).toISOString(),
      models: [
        { code: 'CICT-J526A-STS', typeCode: 'QC', name: 'CICT-J526A-STS (drawing family template v1)', status: 'draft', templateRevision: 3, applic: J526A, template: QC_T, sceneVersion: 'cict-j526a-sts-scene v1 (P03 placeholder, not generated yet)' },
        { code: 'RTG-MODEL-DEMO', typeCode: 'RTG', name: 'RTG-MODEL-DEMO (synthetic)', status: 'draft', templateRevision: 1, applic: RTGM, template: RTG_T, sceneVersion: null },
        { code: 'ES-MODEL-DEMO', typeCode: 'ES', name: 'ES-MODEL-DEMO (synthetic)', status: 'draft', templateRevision: 1, applic: ESM, template: ES_T, sceneVersion: null },
      ],
      types: [{ code: 'QC', name: 'Quay crane (QC)' }, { code: 'RTG', name: 'Rail/rubber-tyred gantry (RTG)' }, { code: 'ES', name: 'ES' }],
      equipment: [], positions: [], jobs: [], events: [], statusChanges: [], idem: {}, audit: [],
      catalogOverrides: {}, // admin edits made in the prototype (in memory only)
    };

    // ---- equipment ----
    // [key, code, type, name, model, assoc, lifecycle, status, statusHoursAgo, reason, positions('active'|'draft'|null), lastActivityHoursAgo]
    const E = [
      ['q01', 'QC-DEMO-01', 'QC', 'Synthetic quay crane 1', 'CICT-J526A-STS', 'verified', 'active', 'maintenance', 52, 'Hoist motor B replacement in progress (synthetic)', 'active', 3],
      ['q02', 'QC-DEMO-02', 'QC', 'Synthetic quay crane 2', 'CICT-J526A-STS', 'verified', 'active', 'readyForOps', 264, null, 'active', 20],
      ['q03', 'QC-DEMO-03', 'QC', 'Synthetic quay crane 3 (new, template not yet confirmed)', 'CICT-J526A-STS', 'verified', 'active', null, 0, null, 'draft', 400],
      ['q04', 'QC-DEMO-04', 'QC', 'Synthetic quay crane 4 (no verified model)', null, 'unassigned', 'active', 'breakdown', 5, 'Hoist overload trip, cause not yet found (synthetic)', null, 5],
      ['q05', 'QC-DEMO-05', 'QC', 'Synthetic quay crane 5', null, 'unassigned', 'active', 'readyForOps', 50, null, null, 50],
      ['q06', 'QC-DEMO-06', 'QC', 'Synthetic quay crane 6', null, 'unassigned', 'active', 'maintenance', 220, 'Scheduled overhaul (synthetic)', null, 24],
      ['r01', 'RTG-DEMO-01', 'RTG', 'Synthetic RTG 1', 'RTG-MODEL-DEMO', 'verified', 'active', 'readyForOps', 100, null, 'active', 100],
      ['r02', 'RTG-DEMO-02', 'RTG', 'Synthetic RTG 2', 'RTG-MODEL-DEMO', 'verified', 'active', 'readyForOps', 30, null, 'active', 30],
      ['r03', 'RTG-DEMO-03', 'RTG', 'Synthetic RTG 3', 'RTG-MODEL-DEMO', 'verified', 'active', 'breakdown', 8, 'Engine fault, diagnosis in progress (synthetic)', 'active', 2],
      ['r04', 'RTG-DEMO-04', 'RTG', 'Synthetic RTG 4', null, 'unassigned', 'active', 'readyForOps', 400, null, null, 400],
      ['r05', 'RTG-DEMO-05', 'RTG', 'Synthetic RTG 5', null, 'unassigned', 'active', null, 0, null, null, 600],
      ['r06', 'RTG-DEMO-06', 'RTG', 'Synthetic RTG 6', null, 'unassigned', 'active', 'maintenance', 18, 'Tyre change (synthetic)', null, 18],
      ['r07', 'RTG-DEMO-07', 'RTG', 'Synthetic RTG 7 (retired)', null, 'unassigned', 'retired', 'readyForOps', 3000, null, null, 3000],
      ['e01', 'ES-DEMO-01', 'ES', 'Synthetic ES 1', 'ES-MODEL-DEMO', 'verified', 'active', 'readyForOps', 70, null, 'active', 70],
      ['e02', 'ES-DEMO-02', 'ES', 'Synthetic ES 2', null, 'unassigned', 'active', 'readyForOps', 20, null, null, 20],
      ['e03', 'ES-DEMO-03', 'ES', 'Synthetic ES 3', null, 'unassigned', 'active', null, 0, null, null, 900],
      ['e04', 'ES-DEMO-04', 'ES', 'Synthetic ES 4', null, 'unassigned', 'active', 'breakdown', 30, 'Hydraulic leak found (synthetic)', null, 30],
    ];
    E.forEach(([key, code, typeCode, name, modelCode, assoc, lifecycle, status, h, reason, pos, act]) => {
      const eq = {
        id: 'eq-' + code.toLowerCase(), key, code, typeCode, name, modelCode, assoc, lifecycle,
        status, statusSince: status ? ago(h) : null, statusReason: reason,
        lastActivity: ago(act), mains: [], subs: [], positionState: pos,
        origin: 'DevelopmentFixture', version: 1,
      };
      D.equipment.push(eq);
      if (pos && modelCode) instantiate(D, eq, D.models.find((m) => m.code === modelCode), pos);
      if (status) D.statusChanges.push({ id: 'sc-' + key + '-1', equipmentId: eq.id, seq: 1, status, reason, relatedJobId: null, at: eq.statusSince, by: 'u-eq-a' });
    });
    // Earlier history for two items so "status history" has more than one row (recorded changes only).
    D.statusChanges.unshift(
      { id: 'sc-q01-0', equipmentId: 'eq-qc-demo-01', seq: 1, status: 'readyForOps', reason: null, relatedJobId: null, at: ago(24 * 40), by: 'u-eq-a', prev: null },
      { id: 'sc-q02-0', equipmentId: 'eq-qc-demo-02', seq: 1, status: 'maintenance', reason: 'Gantry bogie alignment check (synthetic)', relatedJobId: null, at: ago(24 * 40), by: 'u-eq-b', prev: null },
      { id: 'sc-q02-0b', equipmentId: 'eq-qc-demo-02', seq: 2, status: 'readyForOps', reason: null, relatedJobId: null, at: ago(264), by: 'u-eq-a', prev: 'maintenance' },
    );
    D.statusChanges.filter((c) => c.id === 'sc-q01-1').forEach((c) => { c.seq = 2; c.prev = 'readyForOps'; c.relatedJobId = 'job-104'; });
    D.statusChanges.filter((c) => c.id === 'sc-q02-1').forEach((c) => D.statusChanges.splice(D.statusChanges.indexOf(c), 1));

    // ---- jobs ----
    const eqByKey = (k) => D.equipment.find((e) => e.key === k);
    const posByKey = (k, key) => D.positions.find((p) => p.equipmentId === eqByKey(k).id && p.key === key);
    const subId = (k, code) => eqByKey(k).subs.find((s) => s.code === code)?.id;
    const mainId = (k, code) => eqByKey(k).mains.find((m) => m.code === code)?.id;
    EQ._fx = { eqByKey, posByKey, subId, mainId };

    function addJob(num, k, target, o) {
      const eq = eqByKey(k);
      const j = {
        id: 'job-' + num, number: 'EQJ-2026-000' + num, equipmentId: eq.id, level: target[0],
        mainId: null, subId: null, positionId: null, kind: o.kind, title: o.title, description: o.description || '',
        priority: o.priority || null, plannedOn: o.planned || null, responsible: o.responsible || null,
        workStatus: o.status, completedOn: o.completedOn || null, completionNote: o.note || null,
        isCancelled: !!o.cancelled, cancelReason: o.cancelReason || null, cancelledBy: o.cancelledBy || null, cancelledUtc: o.cancelled ? ago(30) : null,
        createdBy: o.by || 'u-eq-a', createdUtc: ago(o.createdHoursAgo || 24 * 20), updatedUtc: ago(o.updatedHoursAgo || 24 * 5),
        reopenCount: 0, version: o.version || 1, lines: [], events: [], corrections: [],
      };
      if (target[0] === 'main') j.mainId = mainId(k, target[1]);
      if (target[0] === 'sub') { j.subId = subId(k, target[1]); j.mainId = eq.subs.find((s) => s.id === j.subId)?.mainId; }
      if (target[0] === 'part') {
        const p = posByKey(k, target[1]);
        j.positionId = p.id; j.subId = p.subId; j.mainId = p.mainId;
      }
      j.events.push({ kind: 'created', at: j.createdUtc, by: j.createdBy, note: null });
      if (o.status === 'current' || o.startedAfter) j.events.push({ kind: 'started', at: ago(o.startedHoursAgo || 48), by: j.createdBy, note: null });
      if (o.status === 'completed') j.events.push({ kind: 'completed', at: ago(o.completedHoursAgo || 24 * 10), by: o.completedBy || j.createdBy, note: 'Business date ' + o.completedOn });
      if (o.cancelled) j.events.push({ kind: 'cancelled', at: j.cancelledUtc, by: j.cancelledBy, note: j.cancelReason });
      D.jobs.push(j);
      return j;
    }
    function addLine(job, posKey, item, o) {
      const p = posByKey(eqByKey(D.equipment.find((e) => e.id === job.equipmentId).key).key, posKey);
      const evs = D.events.filter((e) => e.positionId === p.id && !e.voided);
      const prev = evs[evs.length - 1];
      const line = { id: 'ln-' + job.id + '-' + p.id, jobId: job.id, positionId: p.id, mode: 'full', removedKnown: !!o.removedDesc, removedDesc: o.removedDesc || null, removedSerial: o.removedSerial || null, item, qty: o.qty || 1, uom: p.uom, replacedOn: o.on, note: o.note || null, state: 'committed' };
      const ev = { id: 'ev-' + line.id, positionId: p.id, seq: evs.length + 1, kind: 'replacement', businessDate: o.on, jobId: job.id, lineId: line.id, removedFromEventId: prev ? prev.id : null, removedDesc: o.removedDesc || null, removedSerial: o.removedSerial || null, removedKnown: !!o.removedDesc, installed: { ...item, qty: o.qty || 1, uom: p.uom }, recordedUtc: o.recordedUtc || ago(24 * 9), recordedBy: job.createdBy, voided: false };
      line.eventId = ev.id;
      job.lines.push(line); D.events.push(ev);
      return ev;
    }

    // QC-DEMO-01
    const j101 = addJob('101', 'q01', ['part', 'hoist.drive.motor.a'], { kind: 'replacement', title: 'Replace main hoist motor A', description: 'Synthetic example job.', status: 'completed', planned: '2026-08-10', completedOn: '2026-08-12', note: 'Motor replaced and alignment checked (synthetic).', completedHoursAgo: 24 * 70 });
    addLine(j101, 'hoist.drive.motor.a', { desc: 'Main hoist motor, 450 kW class (synthetic item)', mfr: 'Synthetic Motors Ltd', partNo: 'SYN-HM-450', serial: 'SYN-0001' }, { on: '2026-08-12', removedDesc: null, recordedUtc: ago(24 * 70) });
    const j102 = addJob('102', 'q01', ['part', 'hoist.rope.set.main'], { kind: 'replacement', title: 'Replace main hoist rope set', status: 'completed', planned: '2026-05-01', completedOn: '2026-05-03', note: 'Full set renewed (synthetic).', completedHoursAgo: 24 * 170 });
    addLine(j102, 'hoist.rope.set.main', { desc: 'Steel rope, hoist (synthetic item)', mfr: 'Synthetic Ropes', partNo: 'SYN-RP-48', serial: null }, { on: '2026-05-03', qty: 4, recordedUtc: ago(24 * 170) });
    addJob('103', 'q01', ['sub', '021'], { kind: 'repair', title: 'Trolley wheel bearing lubrication and inspection', status: 'completed', planned: '2026-09-01', completedOn: '2026-09-02', note: 'Lubricated; no defects noted (synthetic).', completedHoursAgo: 24 * 48, by: 'u-eq-b' });
    addJob('104', 'q01', ['part', 'hoist.drive.motor.b'], { kind: 'replacement', title: 'Replace main hoist motor B', description: 'Motor B to be swapped for a refurbished unit (synthetic).', status: 'current', planned: '2026-10-20', priority: 'high', responsible: 'Synthetic fitter team', createdHoursAgo: 24 * 4, startedHoursAgo: 52, version: 3 });
    addJob('105', 'q01', ['sub', '021'], { kind: 'repair', title: 'Inspect trolley wheel wear', status: 'pending', planned: '2026-10-28', by: 'u-eq-b', createdHoursAgo: 24 * 2 });
    addJob('106', 'q01', ['equipment'], { kind: 'repair', title: 'Annual rail alignment survey', status: 'pending', planned: '2026-11-15', createdHoursAgo: 24 * 6 });
    addJob('107', 'q01', ['part', 'boom.rope.set.main'], { kind: 'replacement', title: 'Boom rope set replacement (planned)', status: 'pending', planned: '2026-12-02', by: 'u-admin', createdHoursAgo: 24 * 8 });
    // QC-DEMO-02 (same template, different history)
    const j201 = addJob('201', 'q02', ['part', 'hoist.drive.motor.a'], { kind: 'replacement', title: 'Replace main hoist motor A', status: 'completed', planned: '2026-02-03', completedOn: '2026-02-04', note: 'Replaced (synthetic).', completedHoursAgo: 24 * 260 });
    addLine(j201, 'hoist.drive.motor.a', { desc: 'Main hoist motor, 450 kW class (synthetic item)', mfr: 'Synthetic Motors Ltd', partNo: 'SYN-HM-450', serial: 'SYN-0009' }, { on: '2026-02-04', recordedUtc: ago(24 * 260) });
    const j202 = addJob('202', 'q02', ['part', 'hoist.drive.motor.a'], { kind: 'replacement', title: 'Replace main hoist motor A (second time)', status: 'completed', planned: '2026-09-28', completedOn: '2026-09-30', note: 'Replaced after winding fault (synthetic).', completedHoursAgo: 24 * 21, by: 'u-eq-b' });
    addLine(j202, 'hoist.drive.motor.a', { desc: 'Main hoist motor, 450 kW class (synthetic item)', mfr: 'Synthetic Motors Ltd', partNo: 'SYN-HM-450', serial: 'SYN-0017' }, { on: '2026-09-30', removedDesc: 'Main hoist motor, 450 kW class (synthetic item)', removedSerial: 'SYN-0009', recordedUtc: ago(24 * 21) });
    j202.corrections.push({ n: 1, reason: 'Serial transcribed incorrectly from the nameplate photo.', by: 'u-admin', at: ago(24 * 19), items: [{ field: 'Installed serial (line at hoist motor A)', before: 'SYN-0016', after: 'SYN-0017' }] });
    j202.events.push({ kind: 'corrected', at: ago(24 * 19), by: 'u-admin', note: 'Correction 1 - serial number (prior value kept in the correction record)' });
    const j203 = addJob('203', 'q02', ['part', 'trolley.wheel.position.a'], { kind: 'replacement', title: 'Replace trolley wheel at position A', status: 'completed', planned: '2026-07-20', completedOn: '2026-07-22', note: 'Wheel replaced; rail contact checked (synthetic).', completedHoursAgo: 24 * 90 });
    addLine(j203, 'trolley.wheel.position.a', { desc: 'Trolley wheel (synthetic item)', mfr: 'Synthetic Wheels', partNo: 'SYN-TW-310', serial: 'SYN-W-0310' }, { on: '2026-07-22', recordedUtc: ago(24 * 90) });
    addJob('204', 'q02', ['sub', '041'], { kind: 'repair', title: 'Gantry bogie alignment check', status: 'completed', planned: '2026-08-17', completedOn: '2026-08-18', note: 'Within limits (synthetic).', completedHoursAgo: 24 * 64 });
    addJob('205', 'q02', ['part', 'electrical.plc.main'], { kind: 'repair', title: 'Replace PLC cabinet fan', status: 'pending', planned: '2026-10-25', cancelled: true, cancelReason: 'Duplicate of work already covered by EQJ-2026-000204 scope.', cancelledBy: 'u-eq-a', createdHoursAgo: 24 * 12 });
    addJob('206', 'q02', ['main', '01'], { kind: 'repair', title: 'Hoist brake adjustment', status: 'current', planned: '2026-10-21', by: 'u-eq-b', createdHoursAgo: 24 * 3, startedHoursAgo: 6 });
    // Others
    addJob('401', 'q04', ['equipment'], { kind: 'repair', title: 'Investigate hoist overload trip', status: 'current', planned: '2026-10-21', createdHoursAgo: 5, startedHoursAgo: 4 });
    addJob('601', 'q06', ['equipment'], { kind: 'repair', title: 'Scheduled overhaul', status: 'current', planned: '2026-10-12', by: 'u-eq-b', createdHoursAgo: 24 * 9, startedHoursAgo: 24 * 9 });
    const j701 = addJob('701', 'r01', ['part', 'gantry.tyre.set.a'], { kind: 'replacement', title: 'Replace tyre set A', status: 'completed', planned: '2026-09-10', completedOn: '2026-09-12', note: 'Four tyres replaced (synthetic).', completedHoursAgo: 24 * 38 });
    addLine(j701, 'gantry.tyre.set.a', { desc: 'Tyre (synthetic item)', mfr: 'Synthetic Tyres', partNo: 'SYN-TY-1', serial: null }, { on: '2026-09-12', qty: 4, recordedUtc: ago(24 * 38) });
    addJob('702', 'r01', ['equipment'], { kind: 'repair', title: 'Quarterly structural walk-down', status: 'pending', planned: '2026-11-03', by: 'u-eq-b' });
    addJob('703', 'r03', ['equipment'], { kind: 'repair', title: 'Engine fault diagnosis', status: 'current', planned: '2026-10-21', createdHoursAgo: 8, startedHoursAgo: 7 });
    addJob('801', 'e04', ['equipment'], { kind: 'repair', title: 'Locate and repair hydraulic leak', status: 'current', planned: '2026-10-20', by: 'u-eq-b', createdHoursAgo: 30, startedHoursAgo: 29 });
    addJob('602', 'q06', ['equipment'], { kind: 'repair', title: 'Post-overhaul load test', status: 'pending', planned: '2026-11-01' });
    return D;
  };

  /** Create equipment-specific instances from a model template (P2: positions are per equipment). */
  function instantiate(D, eq, model, posState) {
    const subsApplicable = EQ.catalog.subs.filter((s) => s.active && model.applic[s.code] === 'applicable');
    const mainCodes = [...new Set(subsApplicable.map((s) => s.main))].sort();
    mainCodes.forEach((mc) => eq.mains.push({ id: 'mi-' + eq.key + '-' + mc, code: mc, state: 'active' }));
    subsApplicable.forEach((s) => eq.subs.push({ id: 'si-' + eq.key + '-' + s.code, code: s.code, mainId: 'mi-' + eq.key + '-' + s.main, state: 'active' }));
    let n = 0;
    model.template.forEach(([key, sub, name, kind, uom, nominal, category, prov, src]) => {
      const si = eq.subs.find((x) => x.code === sub);
      if (!si) return; // not applicable to this model: no position
      n += 1;
      D.positions.push({
        id: 'pp-' + eq.key + '-' + String(n).padStart(3, '0'), equipmentId: eq.id, mainId: si.mainId, subId: si.id,
        key, name, kind, uom, nominal, category, state: posState, prov, src,
      });
    });
  }
  EQ._instantiate = instantiate;
})(window.EQ);
