// U1 repair: report the node changes between the committed P03 manifest (git HEAD) and the regenerated draft v1 rev 2.
// Orphaned keys (removed) would need Admin repair before any binding could be activated; none is expected.
// Usage: node tools/u1/model_diff.mjs [--base HEAD] -> docs/evidence/U1/repair/model-revision-diff.json
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'HEAD';
const file = 'artifacts/models/cict-j526a-sts-scene/1/manifest.json';
const oldM = JSON.parse(execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', maxBuffer: 64 << 20 }));
const newM = JSON.parse(fs.readFileSync(file, 'utf8'));
const om = new Map(oldM.nodes.map((n) => [n.key, n])); const nm = new Map(newM.nodes.map((n) => [n.key, n]));
const added = [...nm.keys()].filter((k) => !om.has(k)).map((k) => ({ key: k, kind: nm.get(k).kind, sub: nm.get(k).classification?.sub || null, label: nm.get(k).label }));
const removed = [...om.keys()].filter((k) => !nm.has(k));
const changed = [];
for (const [k, o] of om) {
  const n = nm.get(k); if (!n) continue;
  const d = {};
  for (const f of ['kind', 'parentKey', 'positionKind', 'uom']) if (JSON.stringify(o[f]) !== JSON.stringify(n[f])) d[f] = [o[f], n[f]];
  if (JSON.stringify(o.classification) !== JSON.stringify(n.classification)) d.classification = [o.classification, n.classification];
  if (JSON.stringify(o.instancing) !== JSON.stringify(n.instancing)) d.instancing = [o.instancing, n.instancing];
  if (JSON.stringify(o.bounds) !== JSON.stringify(n.bounds)) d.boundsChanged = true;
  if (o.label !== n.label) d.label = [o.label, n.label];
  if (JSON.stringify(o.hotspot) !== JSON.stringify(n.hotspot)) d.hotspot = [o.hotspot?.point, n.hotspot?.point];
  if (Object.keys(d).length) changed.push({ key: k, ...d });
}
const rep = {
  base, baseAsset: { sha256: oldM.asset.sha256, bytes: oldM.asset.bytes, nodes: oldM.nodes.length }, revised: { revision: newM.revision, sha256: newM.asset.sha256, bytes: newM.asset.bytes, nodes: newM.nodes.length },
  summary: { added: added.length, removed: removed.length, changed: changed.length, identityChanges: changed.filter((c) => c.kind || c.classification || c.instancing || c.positionKind).length },
  note: 'Draft v1 revised in place (no binding active). Keys, kinds, classification and instancing of existing nodes are unchanged unless listed; bounds changes are geometry corrections.',
  added, removed, changed,
};
fs.writeFileSync('docs/evidence/U1/repair/model-revision-diff.json', JSON.stringify(rep, null, 2) + '\n');
console.log(JSON.stringify(rep.summary), 'removed:', removed, 'parent/hotspot changes:', changed.filter((c) => c.parentKey || c.hotspot).map((c) => c.key));
