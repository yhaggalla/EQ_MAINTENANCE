// SYNTHETIC equipment and bindings for the P03 model prototype. Nothing here is a fleet fact.
// Each synthetic QC gets its own mechanism instances and part positions instantiated from the manifest's position
// nodes; the binding maps node key -> position ID by EXACT key equality (DATA_CONTRACT s10.5 B2). History is keyed by
// position ID only, so QC01 and QC02 share geometry but never history.

export const EQUIPMENT = [
  { id: 'eq-qc-demo-01', key: 'q01', code: 'QC01', name: 'Synthetic quay crane 1' },
  { id: 'eq-qc-demo-02', key: 'q02', code: 'QC02', name: 'Synthetic quay crane 2' },
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

// P02B: synthetic jobs, CMMS daily jobs, status and the spare-part register now come from the shared V2 data layer of the P02 prototype
// (artifacts/prototypes/p02-ui/js, loaded by index.html), so the flat view and this 3D view show the same current state.
