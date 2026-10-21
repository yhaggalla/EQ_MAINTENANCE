// SYNTHETIC equipment, bindings and history for the P03 model prototype. Nothing here is a fleet fact.
// Each synthetic QC gets its own mechanism instances and part positions instantiated from the manifest's position
// nodes; the binding maps node key -> position ID by EXACT key equality (DATA_CONTRACT s10.5 B2). History is keyed by
// position ID only, so QC-DEMO-01 and QC-DEMO-02 share geometry but never history.

export const EQUIPMENT = [
  { id: 'eq-qc-demo-01', key: 'q01', code: 'QC-DEMO-01', name: 'Synthetic quay crane 1', status: 'maintenance', statusText: 'Maintenance', statusReason: 'Hoist motor B replacement in progress (synthetic)' },
  { id: 'eq-qc-demo-02', key: 'q02', code: 'QC-DEMO-02', name: 'Synthetic quay crane 2', status: 'readyForOps', statusText: 'Ready for OPS', statusReason: null },
];

/** Instantiate synthetic mechanism instances, positions and the exact-key binding for one equipment item. */
export function instantiate(eq, manifest, catalog) {
  const nodes = manifest.nodes.filter((n) => n.kind === 'position' || n.kind === 'hotspot');
  const subCodes = [...new Set(nodes.map((n) => n.classification.sub))].sort();
  const mainCodes = [...new Set(subCodes.map((c) => c.slice(0, 2)))].sort();
  const mains = mainCodes.map((c) => ({ id: `mi-${eq.key}-${c}`, code: c, name: catalog.main.get(c)?.name || c }));
  const subs = subCodes.map((c) => ({ id: `si-${eq.key}-${c}`, code: c, mainCode: c.slice(0, 2), mainId: `mi-${eq.key}-${c.slice(0, 2)}`, name: catalog.sub.get(c)?.name || c }));
  let n = 0;
  const positions = manifest.nodes.filter((x) => x.kind === 'position').map((x) => ({
    id: `pp-${eq.key}-${String(++n).padStart(3, '0')}`, semanticKey: x.key, name: x.label, subCode: x.classification.sub,
    subId: `si-${eq.key}-${x.classification.sub}`, mainId: `mi-${eq.key}-${x.classification.main}`, kind: x.positionKind, uom: x.uom,
  }));
  // binding: node key -> position ID (positions) or sub-instance ID (hotspots); exact key only
  const binding = new Map();
  for (const p of positions) binding.set(p.semanticKey, { positionId: p.id, mode: 'exactKey' });
  for (const h of manifest.nodes.filter((x) => x.kind === 'hotspot')) binding.set(h.key, { subInstanceId: `si-${eq.key}-${h.classification.sub}`, mode: 'exactKey' });
  return { mains, subs, positions, binding };
}

const J = (id, eqKey, posKey, kind, title, status, date, note) => ({ id, eqKey, posKey, kind, title, status, date, note });
// Jobs reference semantic keys here only to build the fixture; they are resolved to position IDs at instantiation.
const JOBS = [
  J('EQJ-SYN-0101', 'q01', 'hoist.drive.motor.a', 'Replacement', 'Replace main hoist motor A', 'Completed', '2026-08-12', 'Synthetic example'),
  J('EQJ-SYN-0102', 'q01', 'hoist.rope.set.main', 'Replacement', 'Renew main hoist rope set', 'Completed', '2026-05-03', 'Synthetic example (quantity lot)'),
  J('EQJ-SYN-0104', 'q01', 'hoist.drive.motor.b', 'Replacement', 'Replace main hoist motor B', 'Current', '2026-10-20', 'Synthetic example'),
  J('EQJ-SYN-0105', 'q01', 'gantry.wheel.ws-a.3', 'Repair', 'Gantry wheel WS-A 3 flange inspection', 'Pending', '2026-11-04', 'Synthetic example (instanced position)'),
  J('EQJ-SYN-0106', 'q01', 'boom.rope.set.main', 'Replacement', 'Boom hoist rope set replacement', 'Pending', '2026-12-02', 'Synthetic example'),
  J('EQJ-SYN-0201', 'q02', 'hoist.drive.motor.a', 'Replacement', 'Replace main hoist motor A', 'Completed', '2026-02-04', 'Synthetic example'),
  J('EQJ-SYN-0202', 'q02', 'hoist.drive.motor.a', 'Replacement', 'Replace main hoist motor A (second time)', 'Completed', '2026-09-30', 'Synthetic example'),
  J('EQJ-SYN-0203', 'q02', 'trolley.wheel.ls-a.1', 'Replacement', 'Replace trolley wheel LS-A 1', 'Completed', '2026-07-22', 'Synthetic example'),
  J('EQJ-SYN-0204', 'q02', 'electrical.hv.main-transformer', 'Repair', 'Main transformer oil sampling follow-up', 'Current', '2026-10-18', 'Synthetic example'),
];

export function jobsFor(eq, inst) {
  const byKey = new Map(inst.positions.map((p) => [p.semanticKey, p]));
  return JOBS.filter((j) => j.eqKey === eq.key).map((j) => ({ ...j, positionId: byKey.get(j.posKey)?.id, subId: byKey.get(j.posKey)?.subId, mainId: byKey.get(j.posKey)?.mainId }));
}
