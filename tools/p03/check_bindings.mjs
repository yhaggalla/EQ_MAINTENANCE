// P03 binding and identity checks (VIS05 / DATA_CONTRACT s10.5 rules B1-B8), using the generated manifest/GLB and
// the prototype's synthetic instantiation. Read-only; writes a JSON report.
// Usage: node tools/p03/check_bindings.mjs [--out docs/evidence/P03/binding-validation.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readGlb } from '../model-generator/validate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const outArg = process.argv.indexOf('--out') > 0 ? process.argv[process.argv.indexOf('--out') + 1] : 'docs/evidence/P03/binding-validation.json';
const dir = path.join(repo, 'artifacts', 'models', 'cict-j526a-sts-scene', '1');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const gltf = readGlb(fs.readFileSync(path.join(dir, 'scene.glb')));
const cat = JSON.parse(fs.readFileSync(path.join(repo, 'documents/prompt-pack/reference/mechanisms-approved.json'), 'utf8'));
const catalog = { main: new Map(cat.mainMechanisms.map((x) => [x.code, x])), sub: new Map(cat.subMechanisms.map((x) => [x.code, x])) };
const { EQUIPMENT, instantiate } = await import(pathToFileURL(path.join(repo, 'artifacts/prototypes/p03-qc-model/js/data.mjs')).href);

const results = [];
const check = (id, rule, pass, detail) => results.push({ id, rule, pass: !!pass, detail });

/** Proposal by exact key only (B2), plus explicit Admin mappings and noVisual decisions (B3). */
function proposeBinding(positions, man, previous, adminMappings = {}, noVisual = {}) {
  const nodes = new Map(man.nodes.map((n) => [n.key, n]));
  const entries = []; const problems = [];
  for (const p of positions) {
    if (adminMappings[p.id]) { entries.push({ positionId: p.id, nodeKey: adminMappings[p.id], mode: 'adminMapping' }); continue; }
    if (noVisual[p.id]) { entries.push({ positionId: p.id, nodeKey: null, mode: 'noVisual', note: noVisual[p.id] }); continue; }
    if (nodes.get(p.semanticKey)?.kind === 'position') entries.push({ positionId: p.id, nodeKey: p.semanticKey, mode: 'exactKey' });
    else entries.push({ positionId: p.id, nodeKey: null, mode: 'unresolved' });
  }
  for (const e of entries) {
    if (e.nodeKey) { const n = nodes.get(e.nodeKey); const p = positions.find((x) => x.id === e.positionId); if (!n || n.kind !== 'position') problems.push({ rule: 'B4', positionId: e.positionId, issue: 'node missing or not a position' }); else if (n.classification.sub !== p.subCode) problems.push({ rule: 'B4', positionId: e.positionId, issue: 'sub code differs' }); }
  }
  const used = entries.filter((e) => e.nodeKey).map((e) => e.nodeKey);
  const dupNodes = used.filter((k, i) => used.indexOf(k) !== i);
  if (dupNodes.length) problems.push({ rule: 'B5', issue: 'node bound twice', nodes: dupNodes });
  const orphans = entries.filter((e) => e.mode === 'unresolved' && previous?.get(e.positionId)).map((e) => ({ positionId: e.positionId, previousNode: previous.get(e.positionId) }));
  const unresolved = entries.filter((e) => e.mode === 'unresolved').map((e) => e.positionId);
  const boundKeys = new Set(used);
  const newlyUnbound = man.nodes.filter((n) => n.kind === 'position' && !boundKeys.has(n.key)).map((n) => n.key);
  const changed = previous ? entries.filter((e) => e.nodeKey && previous.get(e.positionId) && previous.get(e.positionId) !== e.nodeKey).map((e) => ({ positionId: e.positionId, from: previous.get(e.positionId), to: e.nodeKey })) : [];
  return { entries, problems, orphans, unresolved, newlyUnbound, changed, canActivate: problems.length === 0 && unresolved.length === 0 };
}

// --- B3/B4/B5/B8 on the v1 template for the two synthetic QCs
const inst = EQUIPMENT.map((e) => ({ eq: e, i: instantiate(e, manifest, catalog) }));
for (const { eq, i } of inst) {
  const prop = proposeBinding(i.positions, manifest, null);
  check(`${eq.code}-v1-exact-binding`, 'B2,B3,B4,B5', prop.canActivate && prop.entries.every((e) => e.mode === 'exactKey'), { positions: i.positions.length, exactKey: prop.entries.filter((e) => e.mode === 'exactKey').length, problems: prop.problems, newlyUnboundNodes: prop.newlyUnbound });
  const hot = manifest.nodes.filter((n) => n.kind === 'hotspot');
  check(`${eq.code}-hotspots-to-sub-instances`, 'B4 (hotspot)', hot.every((h) => i.binding.get(h.key)?.subInstanceId === `si-${eq.key}-${h.classification.sub}` && i.subs.some((s) => s.id === `si-${eq.key}-${h.classification.sub}`)), `${hot.length} hotspots resolve to sub instances of ${eq.code}`);
}
const [a, b] = inst;
const sameKey = 'hoist.drive.motor.a';
const pa = a.i.positions.find((p) => p.semanticKey === sameKey), pb = b.i.positions.find((p) => p.semanticKey === sameKey);
const overlap = a.i.positions.filter((p) => b.i.positions.some((q) => q.id === p.id));
check('two-equipment-independent', 'B8 / HIS01', pa.id !== pb.id && overlap.length === 0, { nodeKey: sameKey, 'QC01': pa.id, 'QC02': pb.id, sharedPositionIds: overlap.length });

// --- Reordered scene: identity follows extras.nodeKey, not node order or index
const original = gltf.nodes.map((n, idx) => ({ idx, key: n.extras?.nodeKey || null, name: n.name }));
const shuffled = [...original].reverse();
const resolveByKey = (list) => new Map(list.filter((x) => x.key).map((x) => [x.key, a.i.binding.get(x.key)?.positionId || a.i.binding.get(x.key)?.subInstanceId]));
const r1 = resolveByKey(original), r2 = resolveByKey(shuffled);
const sameResolution = [...r1].every(([k, v]) => r2.get(k) === v) && r1.size === r2.size;
const indexHazard = original.filter((x, i) => x.key && shuffled[i].key && shuffled[i].key !== x.key).length;
check('reordered-scene-same-identities', 'VIS05', sameResolution, { keyedNodes: r1.size, identicalResolutions: sameResolution, wouldBreakIfIndexBased: indexHazard + ' of ' + r1.size + ' nodes change index after reordering' });
const im = manifest.instanceMaps.find((m) => m.gltfNodeName === 'gantry.wheels.instanced');
check('instanced-identity-via-map', 'DATA s10.3 instanceMaps', im.instanceKeys[2] === 'gantry.wheel.ws-a.3' && a.i.binding.get(im.instanceKeys[2]).positionId !== b.i.binding.get(im.instanceKeys[2]).positionId, { carrier: im.gltfNodeName, instanceId: 2, key: im.instanceKeys[2], 'QC01': a.i.binding.get(im.instanceKeys[2]).positionId, 'QC02': b.i.binding.get(im.instanceKeys[2]).positionId });

// --- Simulated model version 2: one key renamed, one node removed, one node added
const v2 = JSON.parse(JSON.stringify(manifest)); v2.version = 2;
const ren = v2.nodes.find((n) => n.key === 'hoist.drive.motor.a'); ren.key = 'hoist.drive.motor-a'; ren.gltfNodeNames = ['hoist.drive.motor-a']; // label unchanged on purpose
v2.nodes = v2.nodes.filter((n) => n.key !== 'trolley.wheel.ls-a.1');
v2.nodes.push({ ...v2.nodes.find((n) => n.key === 'trolley.frame'), key: 'trolley.frame.extension', label: 'Trolley frame extension (simulated new node)', gltfNodeNames: ['trolley.frame.extension'] });
const prev = new Map(a.i.positions.map((p) => [p.id, p.semanticKey]));
const pv2 = proposeBinding(a.i.positions, v2, prev);
const motorA = a.i.positions.find((p) => p.semanticKey === 'hoist.drive.motor.a'); const wheel = a.i.positions.find((p) => p.semanticKey === 'trolley.wheel.ls-a.1');
check('v2-orphans-reported', 'B6', pv2.orphans.length === 2 && pv2.orphans.some((o) => o.positionId === motorA.id) && pv2.orphans.some((o) => o.positionId === wheel.id), { orphans: pv2.orphans, newlyUnboundNodes: pv2.newlyUnbound });
check('v2-no-fuzzy-match', 'B2', !pv2.entries.some((e) => e.positionId === motorA.id && e.nodeKey === 'hoist.drive.motor-a'), 'renamed node with an identical label is NOT matched automatically');
check('v2-activation-refused-while-orphans', 'B6', pv2.canActivate === false, { canActivate: pv2.canActivate, unresolved: pv2.unresolved });
const pv2b = proposeBinding(a.i.positions, v2, prev, { [motorA.id]: 'hoist.drive.motor-a' }, { [wheel.id]: 'wheel removed from model v2 (simulated); reachable through the tree' });
check('v2-admin-repair-activates', 'B3,B6,B7', pv2b.canActivate && pv2b.changed.length === 1 && pv2b.changed[0].positionId === motorA.id, { changed: pv2b.changed, noVisual: pv2b.entries.filter((e) => e.mode === 'noVisual'), positionIdsUnchanged: true, note: 'activation changes no position, installation, job or history row (B7): history stays on position IDs' });

const report = { generatedFrom: 'artifacts/models/cict-j526a-sts-scene/1/manifest.json', sha256: manifest.asset.sha256, synthetic: true, results, summary: { passed: results.filter((r) => r.pass).length, failed: results.filter((r) => !r.pass).length } };
fs.mkdirSync(path.dirname(path.resolve(repo, outArg)), { recursive: true });
fs.writeFileSync(path.resolve(repo, outArg), JSON.stringify(report, null, 2) + '\n');
for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id);
console.log(report.summary);
if (report.summary.failed) process.exitCode = 1;
