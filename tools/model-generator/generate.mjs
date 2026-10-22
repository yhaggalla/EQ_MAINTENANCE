// eq-model-generator: deterministic build of the CICT-J526A-STS QC scene (P03).
// Usage: node tools/model-generator/generate.mjs [--source assets/models/source/cict-j526a-sts] [--out artifacts/models/cict-j526a-sts-scene/1]
// Inputs: params.json (mm, provenance) + build.mjs (scene definition). Outputs: scene.glb, manifest.json,
// provenance.md, landmarks.json, checksums.json. No network access, no randomness, no clock in the GLB.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as kit from './lib/kit.mjs';
import { SceneBuilder } from './lib/scene-builder.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const arg = (name, def) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; };
const srcDir = path.resolve(repo, arg('--source', 'assets/models/source/cict-j526a-sts'));
const outDir = path.resolve(repo, arg('--out', 'artifacts/models/cict-j526a-sts-scene/1'));
const rel = (p) => path.relative(repo, p).split(path.sep).join('/');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// GLTFExporter (binary) uses the browser FileReader; Node has Blob but no FileReader.
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((ab) => { this.result = ab; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((ab) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(ab).toString('base64'); this.onloadend?.(); }); }
};

const paramsDoc = JSON.parse(fs.readFileSync(path.join(srcDir, 'params.json'), 'utf8'));
const used = new Set();
const P = (id) => {
  const p = paramsDoc.params[id];
  if (!p) throw new Error('unknown parameter ' + id);
  used.add(id);
  return Array.isArray(p.mm) ? p.mm.map((v) => v / 1000) : p.mm / 1000;
};

const { buildCrane } = await import(pathToFileURL(path.join(srcDir, 'build.mjs')).href);
const { builder: S, landmarks } = buildCrane({ kit, SceneBuilder, Materials: kit.Materials, P, THREE });
const root = S.root;
root.updateMatrixWorld(true);

// ---------- bounds ----------
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const toB = (b) => ({ min: b.min.toArray().map(r6), max: b.max.toArray().map(r6) });
const nodeBox = new Map();
for (const n of S.nodes) {
  const b = new THREE.Box3();
  if (n.instancing) {
    const im = root.getObjectByName(n.instancing.gltfNodeName);
    const m = new THREE.Matrix4(); im.getMatrixAt(n.instancing.index, m);
    im.geometry.computeBoundingBox();
    b.copy(im.geometry.boundingBox).applyMatrix4(m.premultiply(im.matrixWorld));
  } else if (n.kind !== 'container') {
    b.setFromObject(S.objects.get(n.key));
  } else {
    const shell = S.objects.get(n.key).children.find((c) => c.userData.shellOf === n.key);
    if (shell) b.setFromObject(shell);
  }
  nodeBox.set(n.key, b);
}
// containers: union of their own shell and all descendants (by parentKey)
const childrenOf = (k) => S.nodes.filter((n) => n.parentKey === k);
const unionDeep = (k) => { const b = nodeBox.get(k).clone(); for (const c of childrenOf(k)) b.union(c.kind === 'container' ? unionDeep(c.key) : nodeBox.get(c.key)); return b; };
for (const n of S.nodes) n.bounds = toB(n.kind === 'container' ? unionDeep(n.key) : nodeBox.get(n.key));

// ---------- metrics ----------
function meshStats(filterMode) {
  let tris = 0, prims = 0, meshes = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const modes = (o.userData.modes || 'overall,technical').split(',');
    if (filterMode && !modes.includes(filterMode)) return;
    const idx = o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count;
    const inst = o.isInstancedMesh ? o.count : 1;
    tris += (idx / 3) * inst;
    prims += Array.isArray(o.material) ? o.geometry.groups.length : 1;
    meshes += 1;
  });
  return { triangles: tris, drawCallsEstimate: prims, meshObjects: meshes };
}
const statsAll = meshStats(null), statsOverall = meshStats('overall'), statsTech = meshStats('technical');

// ---------- export GLB ----------
const exporter = new GLTFExporter();
const rawGlb = Buffer.from(await exporter.parseAsync(root, { binary: true, onlyVisible: false, includeCustomExtensions: false }));

/**
 * GLTFExporter needs a browser canvas to encode textures, which Node does not have. Materials that declare
 * userData.textureFile are therefore exported untextured and the PNG is embedded here, byte for byte, as a
 * bufferView image referenced by the material's baseColorTexture (no external URI, deterministic).
 */
function embedTextures(glbBuf) {
  const jsonLen = glbBuf.readUInt32LE(12);
  const gltf = JSON.parse(glbBuf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen;
  const binLen = glbBuf.readUInt32LE(binStart);
  let bin = glbBuf.subarray(binStart + 8, binStart + 8 + binLen);
  const textured = [];
  root.traverse((o) => { if (o.isMesh) for (const m of [o.material].flat()) if (m.userData?.textureFile && !textured.includes(m)) textured.push(m); });
  // U1 round 3: material colour factors are rounded to 6 decimals. The sRGB -> linear conversion (Math.pow) differs in
  // the last bit between the Windows and Linux Node builds, which made scene.glb differ by platform; geometry did not.
  const r6 = (v) => Math.round(v * 1e6) / 1e6;
  for (const m of gltf.materials || []) {
    if (m.pbrMetallicRoughness?.baseColorFactor) m.pbrMetallicRoughness.baseColorFactor = m.pbrMetallicRoughness.baseColorFactor.map(r6);
    if (m.emissiveFactor) m.emissiveFactor = m.emissiveFactor.map(r6);
  }
  const info = [];
  for (const m of textured) {
    const file = path.join(srcDir, m.userData.textureFile);
    const png = fs.readFileSync(file);
    const mi = (gltf.materials || []).findIndex((x) => x.name === m.name);
    if (mi < 0) throw new Error('textured material not exported: ' + m.name);
    const pad = (4 - (bin.length % 4)) % 4;
    const offset = bin.length + pad;
    bin = Buffer.concat([bin, Buffer.alloc(pad), png]);
    gltf.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: png.length });
    gltf.images ||= []; gltf.samplers ||= []; gltf.textures ||= [];
    gltf.images.push({ name: path.basename(file, '.png'), mimeType: 'image/png', bufferView: gltf.bufferViews.length - 1 });
    gltf.samplers.push({ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 });
    gltf.textures.push({ sampler: gltf.samplers.length - 1, source: gltf.images.length - 1 });
    gltf.materials[mi].pbrMetallicRoughness ||= {};
    gltf.materials[mi].pbrMetallicRoughness.baseColorTexture = { index: gltf.textures.length - 1 };
    gltf.materials[mi].pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
    info.push({ material: m.name, file: rel(file), sha256: sha(png), bytes: png.length });
  }
  const binPad = (4 - (bin.length % 4)) % 4; bin = Buffer.concat([bin, Buffer.alloc(binPad)]);
  gltf.buffers[0].byteLength = bin.length;
  let json = Buffer.from(JSON.stringify(gltf), 'utf8'); const jp = (4 - (json.length % 4)) % 4; json = Buffer.concat([json, Buffer.alloc(jp, 0x20)]);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return { glb: Buffer.concat([head, jh, json, bh, bin]), textures: info };
}
const { glb, textures: embeddedTextures } = embedTextures(rawGlb);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'scene.glb'), glb);

let commit = 'unknown', dirty = null;
try {
  commit = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  dirty = execFileSync('git', ['-C', repo, 'status', '--porcelain', '--', rel(srcDir), rel(here)], { encoding: 'utf8' }).trim().length > 0;
} catch { /* git not available */ }
const pkg = JSON.parse(fs.readFileSync(path.join(here, 'package.json'), 'utf8'));
const threePkg = JSON.parse(fs.readFileSync(path.join(here, 'node_modules', 'three', 'package.json'), 'utf8'));

const overall = new THREE.Box3().setFromObject(root);
const manifest = {
  schemaVersion: 1,
  modelCode: paramsDoc.modelCode,
  equipmentModelCode: paramsDoc.equipmentModelCode,
  version: paramsDoc.version,
  revision: paramsDoc.revision ?? 1,
  revisionNote: paramsDoc.revisionNote ?? null,
  status: 'draft',
  statusNote: 'P03 prototype, revised in the U1 repair while still a draft with no active binding. Not assigned to any equipment; bindings are made by Admin per equipment (DATA_CONTRACT s10.5).',
  units: 'm',
  axes: { up: '+Y', x: '+X toward waterside along the boom', z: 'along the rails (gantry travel); +Z = right-hand side looking from landside to the water' },
  origin: 'top of waterside rail on the crane transverse centreline',
  sides: paramsDoc.coordinateSystem.sideNames,
  generator: { name: pkg.name, version: pkg.version, sourceCommit: commit, sourceDirty: dirty, three: threePkg.version, node: process.version },
  source: { params: rel(path.join(srcDir, 'params.json')), definition: rel(path.join(srcDir, 'build.mjs')) },
  asset: { file: 'scene.glb', sha256: sha(glb), bytes: glb.length, triangles: statsAll.triangles, drawCallsEstimate: statsAll.drawCallsEstimate, overallMode: statsOverall, technicalMode: statsTech },
  budgets: { trianglesMax: 150000, drawCallsMax: 200, assetBytesMax: 8 * 1024 * 1024, source: 'QC_3D_MODELLING_BRIEF s6 (provisional)' },
  bounds: toB(overall),
  landmarks,
  nodes: S.nodes,
  instanceMaps: S.instanceMaps,
  decals: (S.decals || []).map((d) => ({ ...d, textures: embeddedTextures })),
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// ---------- landmark check (model vs. source inputs) ----------
const bOf = (k) => manifest.nodes.find((n) => n.key === k).bounds;
const cx = (b, i) => (b.min[i] + b.max[i]) / 2;
const checks = [];
const chk = (name, actual, expected, kind, tolPct, note) => { const dev = expected === 0 ? Math.abs(actual) : Math.abs(actual - expected) / Math.abs(expected) * 100; checks.push({ name, expected: r6(expected), actual: r6(actual), deviationPct: Math.round(dev * 1000) / 1000, tolerancePct: tolPct, pass: dev <= tolPct, kind, note }); };
chk('rail gauge (rail centrelines)', cx(bOf('gantry.rail.waterside'), 0) - cx(bOf('gantry.rail.landside'), 0), P('railGauge'), 'measured', 1, 'J526A00/J526A0100 30000');
chk('outreach: hoist centre at outreach limit from waterside rail', cx(bOf('headblock.frame'), 0) - cx(bOf('gantry.rail.waterside'), 0), P('outreach'), 'measured', 1, 'display position at outreach limit');
chk('backreach + tail: girder end from landside rail', cx(bOf('gantry.rail.landside'), 0) - bOf('structure.girder.rear.main').min[0], P('backreach') + P('girderTailBeyondBackreach'), 'measured', 1, 'J526A0100 20000 + 11000');
chk('boom tip X from hinge line', bOf('boom.main.girder').max[0] - P('hingeX'), P('boomLength'), 'measured', 1, 'J526A0100 75900');
chk('overall height (apex head top)', manifest.bounds.max[1], P('apexMarker'), 'measured', 1, 'J526A00 marker 83356; NOT the 63 m total lift');
chk('A-frame structural top', bOf('structure.a-frame.head').min[1] + 1.4, P('portalTopWaterside') + P('aFrameHeight'), 'drawing-derived', 1, '5000 + 49000 + 25640');
chk('waterside portal top', bOf('structure.portal.waterside.upper-beam').max[1], P('portalTopWaterside'), 'drawing-derived', 1, '5000 + 49000');
chk('landside portal top', bOf('structure.portal.landside.upper-beam').max[1], P('portalTopLandside'), 'drawing-derived', 1, '5000 + 49250 (U-05)');
chk('girder underside elevation', bOf('structure.girder.rear.main').min[1], P('girderUndersideElevation'), 'drawing-derived', 1, '50500 interpretation (U-19)');
chk('trolley wheels on the girder rail', bOf('trolley.wheel.ws-a.1').min[1], P('girderUndersideElevation') + P('girderDepth') + 0.12, 'drawing-derived', 1, 'girder underside + 1800 box + rail');
chk('lift above rail: spreader underside', bOf('spreader.frame').min[1], P('liftAboveRail'), 'measured', 1, 'display position at upper limit');
chk('tie-beam clearance', bOf('structure.portal.tie-beam.a').min[1], P('portalTieBeamUnderside'), 'measured', 1, '12500');
chk('leg centre spacing (end view)', cx(bOf('structure.portal.landside.leg.a'), 2) - cx(bOf('structure.portal.landside.leg.b'), 2), P('legCentreSpacing'), 'measured', 1, '20400');
chk('gantry overall length (end view)', bOf('gantry.bogie.ws-a').max[2] - bOf('gantry.bogie.ws-b').min[2], P('bogieOverall'), 'measured', 1, '27000 (buffers to buffers)');
// Measured on the house shell (walls, roof, roof railings). The container bounds also include the external walkways
// and A/C platform added in the U1 repair, which are not part of the 18200 house length.
const houseShell = new THREE.Box3().setFromObject(S.objects.get('container.machinery-house').children.find((c) => c.userData.shellOf === 'container.machinery-house'));
chk('machinery house length along rails (shell)', houseShell.max.z - houseShell.min.z, P('machineryHouseLengthZ') + 0.6, 'measured', 2, '18200 walls; roof overhang 300 each side included');
chk('headblock sheave-box span', cx(bOf('headblock.sheave-box.a'), 2) - cx(bOf('headblock.sheave-box.b'), 2), P('headblockSheaveSpan'), 'measured', 1, 'J526A1200 5200');
const totalLift = 63;
checks.push({ name: 'overall height is not the 63 m total lift', expected: '!= 63', actual: r6(manifest.bounds.max[1]), pass: Math.abs(manifest.bounds.max[1] - totalLift) > 5, kind: 'invariant' });
fs.writeFileSync(path.join(outDir, 'landmarks.json'), JSON.stringify({ generatedFrom: rel(path.join(srcDir, 'params.json')), checks }, null, 2) + '\n');

// ---------- provenance / dimension table ----------
const lines = [];
lines.push('# CICT-J526A-STS scene v1: dimension and provenance table', '');
lines.push('Generated by `tools/model-generator/generate.mjs` from `' + rel(path.join(srcDir, 'params.json')) + '` and `' + rel(path.join(srcDir, 'build.mjs')) + '`. Do not edit by hand.', '');
lines.push('Provenance kinds: **measured** = printed dimension used as exact input; **drawing-derived** = computed from printed dimensions; **estimated** = scaled visual estimate (provisional 5 % silhouette tolerance); **approximate-location** = placed inside a documented area, exact position/shape not established.', '');
lines.push('## 1 Input parameters', '', '| Parameter | Value (mm) | Kind | Source | Note |', '| --- | --- | --- | --- | --- |');
for (const [id, p] of Object.entries(paramsDoc.params)) lines.push(`| ${id}${used.has(id) ? '' : ' (unused)'} | ${Array.isArray(p.mm) ? p.mm.join(' x ') : p.mm} | ${p.kind} | ${p.source} | ${p.note || ''} |`);
lines.push('', '## 2 Landmark check (model geometry vs. source inputs)', '', '| Landmark | Expected | Model | Deviation % | Tolerance % | Result | Note |', '| --- | --- | --- | --- | --- | --- | --- |');
for (const c of checks) lines.push(`| ${c.name} | ${c.expected} | ${c.actual} | ${c.deviationPct ?? ''} | ${c.tolerancePct ?? ''} | ${c.pass ? 'pass' : 'FAIL'} | ${c.note || ''} |`);
const count = (k) => manifest.nodes.filter((n) => n.kind === k).length;
lines.push('', `## 3 Nodes (${manifest.nodes.length}: ${count('position')} positions, ${count('hotspot')} hotspots, ${count('container')} containers, ${count('decorative')} decorative)`, '', '| Key | Kind | Code | Modes | Provenance | Sources |', '| --- | --- | --- | --- | --- | --- |');
for (const n of manifest.nodes) lines.push(`| \`${n.key}\` | ${n.kind}${n.instancing ? ' (instanced)' : ''} | ${n.classification ? n.classification.sub : ''} | ${n.modes.join(', ')} | ${n.provenance.kind} | ${n.provenance.sources.map((s) => s.drawing + (s.pdfPage ? ' p' + s.pdfPage : '') + ': ' + s.note).join('; ')}${n.classificationNote ? ' **Classification:** ' + n.classificationNote : ''} |`);
if (manifest.decals.length) {
  lines.push('', `## 4 Decals (${manifest.decals.length}; visual identity marks, not maintenance identities)`, '', '| glTF node | Container | Modes | Provenance | Sources | Embedded texture |', '| --- | --- | --- | --- | --- | --- |');
  for (const d of manifest.decals) lines.push(`| \`${d.gltfNodeName}\` | ${d.container} | ${d.modes.join(', ')} | ${d.provenance.kind} | ${d.provenance.sources.map((s) => s.drawing + ': ' + s.note).join('; ')} | ${d.textures.map((t) => t.file + ' sha256 ' + t.sha256.slice(0, 12) + '...').join('; ')} |`);
}
fs.writeFileSync(path.join(outDir, 'provenance.md'), lines.join('\n') + '\n');

// ---------- checksums ----------
const files = [path.join(srcDir, 'params.json'), path.join(srcDir, 'build.mjs'), ...embeddedTextures.map((t) => path.join(repo, t.file)), path.join(here, 'generate.mjs'), path.join(here, 'lib', 'kit.mjs'), path.join(here, 'lib', 'scene-builder.mjs'), path.join(here, 'package-lock.json'), path.join(outDir, 'scene.glb'), path.join(outDir, 'manifest.json'), path.join(outDir, 'provenance.md'), path.join(outDir, 'landmarks.json')];
fs.writeFileSync(path.join(outDir, 'checksums.json'), JSON.stringify(Object.fromEntries(files.map((f) => [rel(f), sha(fs.readFileSync(f))])), null, 2) + '\n');

const failed = checks.filter((c) => !c.pass);
console.log(JSON.stringify({ out: rel(outDir), bytes: glb.length, sha256: sha(glb), nodes: manifest.nodes.length, positions: count('position'), hotspots: count('hotspot'), containers: count('container'), triangles: statsAll.triangles, drawCalls: statsAll.drawCallsEstimate, overall: statsOverall, technical: statsTech, landmarkFailures: failed.map((c) => c.name) }, null, 2));
if (failed.length) process.exitCode = 2;
