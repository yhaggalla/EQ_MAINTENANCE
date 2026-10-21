// Registration validation for a generated scene version (DATA_CONTRACT s10.4, VIS09). Read-only.
// Usage: node tools/model-generator/validate.mjs [--dir artifacts/models/cict-j526a-sts-scene/1] [--out report.json]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const dir = path.resolve(repo, arg('--dir', 'artifacts/models/cict-j526a-sts-scene/1'));
const out = arg('--out', null);

export function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jsonLen = buf.readUInt32LE(12);
  if (buf.readUInt32LE(16) !== 0x4e4f534a) throw new Error('first chunk is not JSON');
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
}

export function validate(dir) {
  const results = [];
  const check = (id, pass, detail) => results.push({ id, pass: !!pass, detail });
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const glbBuf = fs.readFileSync(path.join(dir, manifest.asset.file));
  const gltf = readGlb(glbBuf);
  const cat = JSON.parse(fs.readFileSync(path.join(repo, 'documents', 'prompt-pack', 'reference', 'mechanisms-approved.json'), 'utf8'));
  const subs = new Map(cat.subMechanisms.map((s) => [s.code, s]));

  check('schema', manifest.schemaVersion === 1 && Array.isArray(manifest.nodes) && Array.isArray(manifest.instanceMaps), 'schemaVersion 1 with nodes and instanceMaps');
  check('units', manifest.units === 'm', 'units = ' + manifest.units);
  const sha = crypto.createHash('sha256').update(glbBuf).digest('hex');
  check('asset-sha256', sha === manifest.asset.sha256, sha);
  check('asset-bytes', glbBuf.length === manifest.asset.bytes, glbBuf.length + ' bytes');

  const gNodes = gltf.nodes || [];
  const nameCount = new Map(); for (const n of gNodes) nameCount.set(n.name, (nameCount.get(n.name) || 0) + 1);
  const keyed = gNodes.filter((n) => n.extras && n.extras.nodeKey);
  const mKeys = new Set(manifest.nodes.map((n) => n.key));
  const badNames = manifest.nodes.flatMap((n) => n.gltfNodeNames.filter((g) => nameCount.get(g) !== 1).map((g) => n.key + ' -> ' + g));
  check('gltf-names-exactly-once', badNames.length === 0, badNames.length ? badNames.slice(0, 10) : `${manifest.nodes.reduce((a, n) => a + n.gltfNodeNames.length, 0)} names found once each`);
  const unknownKeyed = keyed.filter((n) => !mKeys.has(n.extras.nodeKey)).map((n) => n.extras.nodeKey);
  check('glb-keys-in-manifest', unknownKeyed.length === 0, unknownKeyed.length ? unknownKeyed : `${keyed.length} keyed GLB nodes all in manifest`);
  const keyMismatch = keyed.filter((n) => n.name !== n.extras.nodeKey).map((n) => n.name);
  check('node-name-equals-key', keyMismatch.length === 0, keyMismatch.length ? keyMismatch : 'every keyed node is named by its key');

  const keyRe = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*){1,11}$/;
  const dup = manifest.nodes.map((n) => n.key).filter((k, i, a) => a.indexOf(k) !== i);
  check('keys-unique', dup.length === 0, dup.length ? dup : manifest.nodes.length + ' unique keys');
  const badKeys = manifest.nodes.filter((n) => !keyRe.test(n.key) || n.key.length > 128 || (n.kind === 'container') !== n.key.startsWith('container.')).map((n) => n.key);
  check('keys-grammar', badKeys.length === 0, badKeys.length ? badKeys : 'grammar and container prefix rule satisfied');

  const byKey = new Map(manifest.nodes.map((n) => [n.key, n]));
  const cycles = []; const missingParent = [];
  for (const n of manifest.nodes) {
    if (n.parentKey && !byKey.has(n.parentKey)) missingParent.push(n.key);
    const seen = new Set(); let p = n;
    while (p && p.parentKey) { if (seen.has(p.key)) { cycles.push(n.key); break; } seen.add(p.key); p = byKey.get(p.parentKey); }
  }
  check('parents-exist-no-cycles', !missingParent.length && !cycles.length, { missingParent, cycles });
  const badParentKind = manifest.nodes.filter((n) => n.parentKey && byKey.get(n.parentKey)?.kind !== 'container').map((n) => n.key);
  check('parents-are-containers', badParentKind.length === 0, badParentKind.length ? badParentKind : 'all parents are containers');

  const badClass = manifest.nodes.filter((n) => {
    if (n.kind === 'position' || n.kind === 'hotspot') { const s = n.classification && subs.get(n.classification.sub); return !s || s.mainCode !== n.classification.main || s.active !== true; }
    return n.classification !== null;
  }).map((n) => n.key + ' ' + JSON.stringify(n.classification));
  check('classification', badClass.length === 0, badClass.length ? badClass : 'positions/hotspots carry an active catalogue sub under its main; containers/decorative carry none');
  const inactiveUsed = manifest.nodes.filter((n) => ['048', '063'].includes(n.classification?.sub)).map((n) => n.key);
  check('no-inactive-subcodes', inactiveUsed.length === 0, inactiveUsed);
  const notApplicableCandidates = manifest.nodes.filter((n) => ['043', '044', '045', '091', '092', '093', '094'].includes(n.classification?.sub)).map((n) => n.key);
  check('no-tyre-steer-diesel-on-qc', notApplicableCandidates.length === 0, notApplicableCandidates.length ? notApplicableCandidates : 'no 043/044/045/09x nodes');

  const finite = (b) => b && [...b.min, ...b.max].every(Number.isFinite);
  const badBounds = manifest.nodes.filter((n) => n.kind !== 'container' && (!finite(n.bounds) || n.bounds.max.some((v, i) => v < n.bounds.min[i]))).map((n) => n.key);
  check('bounds-finite-nonempty', badBounds.length === 0, badBounds);
  const thin = manifest.nodes.filter((n) => n.kind !== 'container' && finite(n.bounds) && n.bounds.max.some((v, i) => v - n.bounds.min[i] < 0.5)).map((n) => n.key);
  check('thin-items-flagged', true, { note: 'thin items use the 0.5 m minimum fit extent in the viewer', count: thin.length, examples: thin.slice(0, 8) });
  const badHot = manifest.nodes.filter((n) => n.kind === 'hotspot' && !(n.hotspot && n.hotspot.point.length === 3 && n.hotspot.radius > 0 && n.qualifier)).map((n) => n.key);
  check('hotspots-point-radius-qualifier', badHot.length === 0, badHot);

  // instance maps: carrier exists once with EXT_mesh_gpu_instancing; each instance covered exactly once
  const instIssues = [];
  for (const im of manifest.instanceMaps) {
    const carrier = gNodes.find((n) => n.name === im.gltfNodeName);
    if (!carrier) { instIssues.push('missing carrier ' + im.gltfNodeName); continue; }
    const ext = carrier.extensions?.EXT_mesh_gpu_instancing;
    const count = ext ? gltf.accessors[ext.attributes.TRANSLATION].count : 0;
    if (count !== im.instanceKeys.length) instIssues.push(`${im.gltfNodeName}: ${count} instances vs ${im.instanceKeys.length} keys`);
    if (new Set(im.instanceKeys).size !== im.instanceKeys.length) instIssues.push(im.gltfNodeName + ' duplicate keys');
    im.instanceKeys.forEach((k, i) => { const n = byKey.get(k); if (!n || n.instancing?.gltfNodeName !== im.gltfNodeName || n.instancing.index !== i) instIssues.push('mismatch ' + k); });
  }
  const instancedNodes = manifest.nodes.filter((n) => n.instancing).length;
  check('instance-maps', instIssues.length === 0 && instancedNodes === manifest.instanceMaps.reduce((a, m) => a + m.instanceKeys.length, 0), instIssues.length ? instIssues : `${instancedNodes} instanced positions in ${manifest.instanceMaps.length} carriers`);

  const ext = JSON.stringify(gltf.buffers || []) + JSON.stringify(gltf.images || []);
  check('no-external-uris', !/"uri"/.test(ext), 'buffers/images: ' + ext.slice(0, 80));

  // decals (U1 repair): visual identity marks only, embedded texture identical to the declared source file
  const decalIssues = [];
  for (const d of manifest.decals || []) {
    const gn = gNodes.filter((n) => n.name === d.gltfNodeName);
    if (gn.length !== 1) decalIssues.push(d.gltfNodeName + ' found ' + gn.length + ' times');
    else if (gn[0].extras?.nodeKey || gn[0].extras?.decalOf !== d.container) decalIssues.push(d.gltfNodeName + ' must carry decalOf and no nodeKey');
    if (mKeys.has(d.gltfNodeName)) decalIssues.push(d.gltfNodeName + ' must not be a manifest node');
    for (const t of d.textures || []) {
      const img = (gltf.images || []).find((im) => im.bufferView !== undefined && im.mimeType === 'image/png');
      const srcSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(repo, t.file))).digest('hex');
      if (!img) decalIssues.push('no embedded PNG image');
      else {
        const bv = gltf.bufferViews[img.bufferView]; const jsonLen = glbBuf.readUInt32LE(12); const binStart = 20 + jsonLen + 8;
        const emb = crypto.createHash('sha256').update(glbBuf.subarray(binStart + (bv.byteOffset || 0), binStart + (bv.byteOffset || 0) + bv.byteLength)).digest('hex');
        if (emb !== t.sha256 || srcSha !== t.sha256) decalIssues.push(`texture sha mismatch embedded ${emb.slice(0, 12)} source ${srcSha.slice(0, 12)} manifest ${t.sha256.slice(0, 12)}`);
      }
    }
  }
  check('decals-embedded-and-not-identities', decalIssues.length === 0, decalIssues.length ? decalIssues : `${(manifest.decals || []).length} decal(s); embedded texture equals the source file`);

  const railW = byKey.get('gantry.rail.waterside'), railL = byKey.get('gantry.rail.landside');
  const gauge = ((railW.bounds.min[0] + railW.bounds.max[0]) - (railL.bounds.min[0] + railL.bounds.max[0])) / 2;
  check('plausible-gauge', Math.abs(gauge - 30) < 0.01, 'rail gauge ' + gauge.toFixed(3) + ' m');
  const h = manifest.bounds.max[1];
  check('overall-height-not-total-lift', Math.abs(h - 63) > 5 && Math.abs(h - 83.356) < 0.84, 'overall height ' + h.toFixed(3) + ' m (J526A00 apex marker 83.356; 63 m is total lift)');

  const a = manifest.asset; const b = manifest.budgets;
  check('budget-triangles', a.triangles <= b.trianglesMax, `${a.triangles} <= ${b.trianglesMax}`);
  check('budget-draw-calls', a.drawCallsEstimate <= b.drawCallsMax, `${a.drawCallsEstimate} (all modes) <= ${b.drawCallsMax}; overall ${a.overallMode.drawCallsEstimate}, technical ${a.technicalMode.drawCallsEstimate}`);
  check('budget-asset-size', a.bytes <= b.assetBytesMax, `${a.bytes} <= ${b.assetBytesMax}`);
  const lm = JSON.parse(fs.readFileSync(path.join(dir, 'landmarks.json'), 'utf8'));
  check('landmarks-within-tolerance', lm.checks.every((c) => c.pass), lm.checks.filter((c) => !c.pass).map((c) => c.name));

  const counts = { nodes: manifest.nodes.length, positions: manifest.nodes.filter((n) => n.kind === 'position').length, hotspots: manifest.nodes.filter((n) => n.kind === 'hotspot').length, containers: manifest.nodes.filter((n) => n.kind === 'container').length, decorative: manifest.nodes.filter((n) => n.kind === 'decorative').length };
  return { manifest: path.relative(repo, path.join(dir, 'manifest.json')).split(path.sep).join('/'), status: results.every((r) => r.pass) ? 'validated' : 'draft', counts, results };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rep = validate(dir);
  if (out) fs.writeFileSync(path.resolve(repo, out), JSON.stringify(rep, null, 2) + '\n');
  for (const r of rep.results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + (r.pass ? '' : ' ' + JSON.stringify(r.detail)));
  console.log('status:', rep.status, JSON.stringify(rep.counts));
  if (rep.status !== 'validated') process.exitCode = 1;
}
