// U1-C76 scope and dimension check for the QC reference review (docs/evidence/U1/qc-reference-review/REPORT.md).
// Usage: node tools/u1/check_reference_c76.mjs [baseline-dir]   (default tmp/qc-review-before-model = saved revision 13)
// Compares the regenerated model with the saved revision 13: identities, the set of meshes allowed to change, the
// corrected dimensions, and that the C71-C75 subjects (TLS / back reach, busbar, cabin, fitted parts) are untouched.
import fs from 'node:fs'; import crypto from 'node:crypto';
const base = process.argv[2] || 'tmp/qc-review-before-model', cur = 'artifacts/models/cict-j526a-sts-scene/1';
const before = JSON.parse(fs.readFileSync(base + '/manifest.json')), after = JSON.parse(fs.readFileSync(cur + '/manifest.json'));
const params = JSON.parse(fs.readFileSync('assets/models/source/cict-j526a-sts/params.json')).params;
function glb(file) { const b = fs.readFileSync(file), len = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + len)); return { j, bin: b.subarray(28 + len) }; }
function accessor(g, id) { const a = g.j.accessors[id], v = g.j.bufferViews[a.bufferView]; const o = (v.byteOffset || 0) + (a.byteOffset || 0); return { a, v, bytes: g.bin.subarray(o, o + v.byteLength - (a.byteOffset || 0)) }; }
function meshDigest(g, n) {
  const h = crypto.createHash('sha256'); h.update(JSON.stringify([n.translation, n.rotation, n.scale, n.matrix]));
  for (const q of g.j.meshes[n.mesh].primitives) { h.update(g.j.materials[q.material].name); for (const [k, id] of Object.entries(q.attributes).sort()) { h.update(k); h.update(accessor(g, id).bytes); } if (q.indices !== undefined) h.update(accessor(g, q.indices).bytes); }
  for (const [k, id] of Object.entries(n.extensions?.EXT_mesh_gpu_instancing?.attributes || {}).sort()) { h.update(k); h.update(accessor(g, id).bytes); }
  return h.digest('hex');
}
function positions(g, n) {
  const out = [];
  for (const q of g.j.meshes[n.mesh].primitives) { const { a, v, bytes } = accessor(g, q.attributes.POSITION); const st = v.byteStride || 12; for (let i = 0; i < a.count; i++) out.push([bytes.readFloatLE(i * st), bytes.readFloatLE(i * st + 4), bytes.readFloatLE(i * st + 8)]); }
  return out;
}
const A = glb(base + '/scene.glb'), B = glb(cur + '/scene.glb');
const an = new Map(A.j.nodes.filter((n) => n.mesh !== undefined).map((n) => [n.name, n])), bn = new Map(B.j.nodes.filter((n) => n.mesh !== undefined).map((n) => [n.name, n]));
const node = (k) => after.nodes.find((n) => n.key === k); const near = (x, y, t = 0.011) => Math.abs(x - y) <= t;
const results = [];
const check = (name, ok, detail) => { results.push({ name, pass: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ': ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };

// 1 identities
const idOf = (m) => JSON.stringify(m.nodes.map((n) => [n.key, n.kind, n.classification, n.parentKey, n.positionKind, n.uom]).sort());
check('All 410 keys, kinds, classifications, parents and position kinds retained', idOf(before) === idOf(after) && after.nodes.length === 410, after.nodes.length + ' nodes');
check('Instance maps keep their carriers and key order', JSON.stringify(before.instanceMaps.map((m) => [m.gltfNodeName, m.instanceKeys])) === JSON.stringify(after.instanceMaps.map((m) => [m.gltfNodeName, m.instanceKeys])), after.instanceMaps.length + ' maps');

// 2 scope of mesh changes
const changed = [...bn.keys()].filter((k) => !an.has(k) || meshDigest(A, an.get(k)) !== meshDigest(B, bn.get(k))).sort();
const removed = [...an.keys()].filter((k) => !bn.has(k));
const allowedRe = /^(hoist\.drive|hoist\.emergency|emergency\.drive|trolley-drive\.|boom-hoist\.|electrical\.|machinery-house\.|auxiliary\.air-conditioning|auxiliary\.rope-reeving\.machinery-house|structure\.machinery-frame|container\.machinery-house|container\.electrical-room|reference\.(machinery-house|electrical-room|gantry)\.instanced)/;
const allowedList = ['hoist.rope.set.main', 'trolley.rope.set.main', 'boom.rope.set.main', 'gantry.cable-reel.main', 'access.stair.a-frame', 'structure.a-frame.head', 'access.walkway.girder-boom', 'access.platform.portal-top', 'access.stair.landside-leg-b', 'container.portal.markings', 'container.portal.crane-number',
  'structure.portal.waterside.sill-beam', 'structure.portal.landside.sill-beam', 'structure.portal.waterside.upper-beam', 'structure.portal.landside.upper-beam',
  // floating-part sweep: brackets / seats added or workbook parts seated on their assembly
  'auxiliary.service-crane.girder-tail', 'reference.a-frame.instanced', 'reference.access.instanced', 'reference.portal.instanced', 'reference.trolley.instanced', 'spreader.frame', 'trolley.frame'];
const houseKeys = new Set(after.nodes.filter((n) => ['container.machinery-house', 'container.electrical-room'].includes(n.parentKey)).map((n) => n.key));
const unexpected = changed.filter((k) => !allowedRe.test(k) && !allowedList.includes(k) && !houseKeys.has(k));
check('Only the meshes named in the C76 report changed; no mesh removed', unexpected.length === 0 && removed.length === 0, { changed: changed.length, unchanged: bn.size - changed.length, unexpected, removed });
const untouched = [...bn.keys()].filter((k) => /^(reeving\.tls|reeving\.anti-snag|trolley\.cable-system|cabin\.|trolley\.hoist-sheaves|trolley\.wheel|headblock\.|spreader\.(twistlock|flipper|corner)|gantry\.buffers|structure\.girder|boom\.main|hoist\.loadcell|reference\.(back-reach|trolley-runway|boom|headblock-spreader)\.instanced)/.test(k));
check('C71-C75 subjects are byte-identical (TLS / back reach, busbar, cabin, trolley sheaves, headblock, load cells)', untouched.length > 10 && untouched.every((k) => an.has(k) && meshDigest(A, an.get(k)) === meshDigest(B, bn.get(k))), untouched.length + ' meshes');
// ropes: vertices outside the machinery house X range are unchanged
const HX = [after.landmarks.machineryHouse.x[0] - 1.6, after.landmarks.machineryHouse.x[1] + 1.6]; const ropeDiff = {};
for (const k of ['hoist.rope.set.main', 'trolley.rope.set.main', 'boom.rope.set.main', 'trolley.catenary-rope.set.main']) {
  // the boom-hoist rope runs straight from its drum to the apex guide sheaves, so that run follows the drum; its falls beyond the A-frame must not move
  const key = (p) => p.map((v) => v.toFixed(4)).join(','); const out = k === 'boom.rope.set.main' ? (p) => p[0] > -1.5 : (p) => p[0] < HX[0] || p[0] > HX[1];
  const a = new Set(positions(A, an.get(k)).filter(out).map(key)), b = new Set(positions(B, bn.get(k)).filter(out).map(key));
  ropeDiff[k] = [...a].filter((p) => !b.has(p)).length + [...b].filter((p) => !a.has(p)).length;
}
check('Rope vertices outside the machinery house are unchanged (boom-hoist rope: beyond the A-frame)', Object.values(ropeDiff).every((v) => v === 0), ropeDiff);

// 3 corrected dimensions
const mh = after.landmarks.machineryHouse;
check('D1 house walls -9.2 .. +9.0 (J526A3000 9200 + 9000)', near(mh.z[0], -9.2) && near(mh.z[1], 9.0), mh.z);
const dA = node('hoist.drive.drum.a').bounds, dB = node('hoist.drive.drum.b').bounds;
check('D1 main hoist drums symmetric about the crane centreline', near(dA.min[2] + dB.max[2], 0, 0.02) && near(dA.max[2] + dB.min[2], 0, 0.02), [dA.min[2], dA.max[2], dB.min[2], dB.max[2]]);
const inHouse = after.nodes.filter((n) => ['container.machinery-house', 'container.electrical-room'].includes(n.parentKey) && n.kind !== 'container');
const outside = inHouse.filter((n) => n.bounds.min[2] < mh.z[0] - 1.4 || n.bounds.max[2] > mh.z[1] + 0.4 || n.bounds.min[0] < mh.x[0] - 1.3 || n.bounds.max[0] > mh.x[1] + 1.1).map((n) => n.key);
check('D1 every house part stays inside the house and its walkways', outside.length === 0, { parts: inHouse.length, outside });
const roofTop = Math.max(...positions(B, bn.get('container.machinery-house.shell')).filter((p) => Math.abs(p[0] - (mh.x[0] + mh.x[1]) / 2) < 0.05).map((p) => p[1]));
check('D2 roof ridge about eaves + 450', roofTop > mh.eaves + 0.4 && roofTop < mh.eaves + 0.65, { eaves: mh.eaves, ridgeTop: roofTop });
check('D3 cabin home rear face from the printed 7250', params.cabinHomeRearX.mm === -30000 + params.trolleyParkFromLandsideRail.mm - params.cabinOffsetLandside.mm - params.cabinLengthX.mm && params.cabinHomeRearX.kind === 'drawing-derived', params.cabinHomeRearX.mm);
const st = node('access.stair.landside-leg-b').bounds;
check('D3 fixed boarding walkway ends at the home position', near(st.max[0], params.cabinHomeRearX.mm / 1000, 0.1), st.max[0]);
const reel = node('gantry.cable-reel.main').bounds;
check('D4 gantry reel dia 5600 in the 1225 plane, centre 7885', near(reel.max[2] - reel.min[2], 5.6, 0.03) && near(reel.max[1], 7.885 + 2.8, 0.03) && reel.min[0] < 1.225 && reel.max[0] > 1.225, reel);
check('D5 three decals (CICT logo, portal markings, crane number placeholder) with three embedded textures', after.decals.length === 3 && ['container.portal.markings', 'container.portal.crane-number'].every((k) => after.decals.some((d) => d.gltfNodeName === k)) && new Set(after.decals[0].textures.map((t) => t.file)).size === 3
  && B.j.nodes.find((n) => n.name === 'container.portal.crane-number')?.extras?.decalRole === 'crane-number', after.decals.map((d) => d.gltfNodeName));
const sa = node('access.stair.a-frame').bounds;
check('D7 A-frame stair beside leg A: within 2.5 m landside of the A-frame line, flights along Z', sa.min[0] > -4.5 && sa.max[0] < -2.55 && sa.max[2] - sa.min[2] > 5 && sa.min[2] > 2.5, sa);
const wk = positions(B, bn.get('access.walkway.girder-boom')); const through = (x0, x1) => wk.filter((p) => p[0] > x0 + 0.05 && p[0] < x1 - 0.05 && p[1] < 52.5 && p[1] > 52.1).length;
check('D8 girder / boom walkway deck no longer passes through the portal upper beams and steps over them', through(-2.8, -1.2) === 0 && through(-30.8, -29.2) === 0 && Math.max(...wk.map((p) => p[1])) > 55, { maxY: Math.max(...wk.map((p) => p[1])) });
const ub = node('structure.portal.waterside.upper-beam').bounds, sb = node('structure.portal.waterside.sill-beam').bounds;
check('D9 haunches under the upper beams and on the sill beams', sb.max[1] > 6.3 + params.sillHaunch.mm[1] / 1000 - 0.02 && positions(B, bn.get('structure.portal.waterside.upper-beam')).some((p) => near(p[1], 54 - 2.85 - params.portalHaunch.mm[1] / 1000, 0.02) && Math.abs(p[2]) > 8.9), [ub.min[1], sb.max[1]]);
check('Budgets: triangles, draw calls (350, D-226) and asset size', after.asset.triangles <= after.budgets.trianglesMax && after.asset.drawCallsEstimate <= after.budgets.drawCallsMax && after.budgets.drawCallsMax === 350 && after.asset.bytes <= after.budgets.assetBytesMax, { triangles: after.asset.triangles, drawCalls: after.asset.drawCallsEstimate, bytes: after.asset.bytes });
const fl = fs.existsSync('docs/evidence/U1/qc-reference-review/floating-after-rev14.json') ? JSON.parse(fs.readFileSync('docs/evidence/U1/qc-reference-review/floating-after-rev14.json')).summary : null;
check('Floating-part finder (tools/u1/find_floating_parts.mjs --out .../floating-after-rev14.json): no detached piece at 30 mm', fl && fl.revision === 14 && fl.islands === 0, fl);
check('Revision 14 against the saved revision 13', after.revision === 14 && before.revision === 13, [before.revision, after.revision]);
const failed = results.filter((r) => !r.pass).length;
fs.writeFileSync('docs/evidence/U1/qc-reference-review/scope-and-dimensions.json', JSON.stringify({ baseline: base, revision: after.revision, passed: results.length - failed, failed, changedMeshes: changed, results }, null, 2) + '\n');
console.log({ passed: results.length - failed, failed }); process.exit(failed ? 1 : 0);
