// U1-C77 scope and dimension check (follow-up to the QC reference review; docs/evidence/U1/qc-reference-review/REPORT.md).
// Usage: node tools/u1/check_reference_c77.mjs [baseline-dir]   (default tmp/qc-rev14-final = saved revision 14)
// Compares revision 15 with the saved revision 14: every key kept, one key added, only the named meshes changed, and the
// drawing values applied (boom latch J526A62, house wall and upper beams J526A010100 / J526A3000, ZPMC plate decal).
import fs from 'node:fs'; import crypto from 'node:crypto';
const base = process.argv[2] || 'tmp/qc-rev14-final', cur = 'artifacts/models/cict-j526a-sts-scene/1';
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
const A = glb(base + '/scene.glb'), B = glb(cur + '/scene.glb');
const an = new Map(A.j.nodes.filter((n) => n.mesh !== undefined).map((n) => [n.name, n])), bn = new Map(B.j.nodes.filter((n) => n.mesh !== undefined).map((n) => [n.name, n]));
const node = (k) => after.nodes.find((n) => n.key === k); const near = (x, y, t = 0.011) => Math.abs(x - y) <= t;
const results = [];
const check = (name, ok, detail) => { results.push({ name, pass: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ': ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };

const idRow = (n) => JSON.stringify([n.key, n.kind, n.classification, n.parentKey, n.positionKind, n.uom]);
const beforeIds = new Set(before.nodes.map(idRow)), afterIds = new Set(after.nodes.map(idRow));
const added = after.nodes.filter((n) => !before.nodes.some((o) => o.key === n.key)).map((n) => n.key);
check('All 410 revision 14 keys kept with their kind, classification, parent and position kind', [...beforeIds].every((r) => afterIds.has(r)) && before.nodes.length === 410);
check('One key added: boom.latch.frame (031, A-frame)', added.length === 1 && added[0] === 'boom.latch.frame' && node('boom.latch.frame').classification?.sub === '031' && node('boom.latch.frame').parentKey === 'container.a-frame', added);
check('Instance maps keep their carriers and key order', JSON.stringify(before.instanceMaps.map((m) => [m.gltfNodeName, m.instanceKeys])) === JSON.stringify(after.instanceMaps.map((m) => [m.gltfNodeName, m.instanceKeys])), after.instanceMaps.length + ' maps');

const changed = [...bn.keys()].filter((k) => !an.has(k) || meshDigest(A, an.get(k)) !== meshDigest(B, bn.get(k))).sort();
const removed = [...an.keys()].filter((k) => !bn.has(k));
const houseKeys = new Set(after.nodes.filter((n) => ['container.machinery-house', 'container.electrical-room'].includes(n.parentKey)).map((n) => n.key));
const allowed = new Set(['boom.latch.frame', 'structure.a-frame.head', 'reference.a-frame.instanced', 'reference.machinery-house.instanced', 'reference.electrical-room.instanced', 'container.machinery-house.shell', 'container.electrical-room.shell', 'container.machinery-house.logo-cict',
  'structure.portal.waterside.upper-beam', 'structure.portal.landside.upper-beam', 'structure.portal.landside.leg.a', 'structure.portal.landside.leg.b', 'access.walkway.girder-boom', 'container.portal.markings', 'container.portal.zpmc-plate',
  'hoist.rope.set.main', 'trolley.rope.set.main', 'boom.rope.set.main']);
const unexpected = changed.filter((k) => !allowed.has(k) && !houseKeys.has(k));
check('Only the meshes named in the C77 record changed; no mesh removed', unexpected.length === 0 && removed.length === 0, { changed: changed.length, unchanged: bn.size - changed.length, unexpected, removed });
const keep = [...bn.keys()].filter((k) => /^(reeving\.tls|reeving\.anti-snag|trolley\.|cabin\.|headblock\.|spreader\.|gantry\.|structure\.girder|boom\.main|hoist\.loadcell|access\.stair|access\.elevator|structure\.a-frame\.(leg|rear)|structure\.backstay|container\.portal\.crane-number|reference\.(back-reach|trolley|trolley-runway|boom|headblock-spreader|gantry|portal|access)\.instanced)/.test(k) && !/rope\.set/.test(k));
check('Everything else from C71-C76 is byte-identical (TLS, busbar, cabin, trolley, headblock, spreader, gantry, stairs, A-frame legs, crane-number decal)', keep.length > 40 && keep.every((k) => an.has(k) && meshDigest(A, an.get(k)) === meshDigest(B, bn.get(k))), keep.length + ' meshes');

const mh = after.landmarks.machineryHouse;
check('D10 house seaside wall = -30000 - 1330 / 2 - 1200 = -31865; depth 10500', near(mh.x[1], -31.865) && near(mh.x[0], -42.365) && params.machineryHouseSeasideWallX.kind === 'drawing-derived', mh.x);
const inHouse = after.nodes.filter((n) => ['container.machinery-house', 'container.electrical-room'].includes(n.parentKey) && n.kind !== 'container');
const outside = inHouse.filter((n) => n.bounds.min[2] < mh.z[0] - 1.4 || n.bounds.max[2] > mh.z[1] + 0.4 || n.bounds.min[0] < mh.x[0] - 1.3 || n.bounds.max[0] > mh.x[1] + 1.1).map((n) => n.key);
check('Every house part stays inside the house and its walkways', outside.length === 0, { parts: inHouse.length, outside });
const dA = node('hoist.drive.drum.a').bounds, dB = node('hoist.drive.drum.b').bounds, dOld = before.nodes.find((n) => n.key === 'hoist.drive.drum.a').bounds;
check('House contents moved with the wall (-265) and stay symmetric about the crane centreline', near(dA.min[0] - dOld.min[0], -0.265) && near(dA.min[2] + dB.max[2], 0, 0.02), [dA.min[0], dOld.min[0]]);
const ubW = node('structure.portal.waterside.upper-beam').bounds, ubL = node('structure.portal.landside.upper-beam').bounds;
check('Upper portal beams 1330 wide; landside beam zone 3350 (J526A010100)', near(ubW.max[0] - ubW.min[0], 1.33) && near(ubL.max[0] - ubL.min[0], 1.33) && near(ubL.max[1] - 3.35 - 1.2, ubL.min[1], 0.02), [ubW.min[0], ubW.max[0], ubL.min[0], ubL.max[0], ubL.min[1], ubL.max[1]]);
const p1 = node('boom.stowage-pins.1').bounds, p2 = node('boom.stowage-pins.2').bounds; const cz = (b) => (b.min[2] + b.max[2]) / 2, cxm = (b) => (b.min[0] + b.max[0]) / 2, cy = (b) => (b.min[1] + b.max[1]) / 2;
check('Boom latch hooks 5750 apart, 2700 from the A-frame centre, 850 above the latch platform (J526A62)', near(cz(p2) - cz(p1), 5.75, 0.02) && near(cxm(p1), -2 + 2.7, 0.02) && near(cy(p1), params.boomLatchPlatformElevation.mm / 1000 + 0.85, 0.02), [cxm(p1), cy(p1), cz(p1), cz(p2)]);
check('No latch part is left at the apex', ['boom.latch.hook-thruster', 'boom.stowage-pins.1', 'boom.stowage-pins.2', 'boom.stowage-pins.switches.1', 'boom.stowage-pins.switches.2', 'boom.limit.stowage-switches'].every((k) => node(k).bounds.max[1] < 66), 'all below 66 m');
check('Four decals (CICT logo, markings, ZPMC plate, crane number) with four embedded textures', after.decals.length === 4 && after.decals.some((d) => d.gltfNodeName === 'container.portal.zpmc-plate') && new Set(after.decals[0].textures.map((t) => t.file)).size === 4, after.decals.map((d) => d.gltfNodeName));
const flFile = 'docs/evidence/U1/qc-reference-review/floating-after-rev15.json'; const fl = fs.existsSync(flFile) ? JSON.parse(fs.readFileSync(flFile)).summary : null;
check('Floating-part finder: no detached piece at 30 mm (run with --out ' + flFile + ')', fl && fl.revision === 15 && fl.islands === 0, fl);
check('Budgets: triangles, draw calls (350) and asset size', after.asset.triangles <= after.budgets.trianglesMax && after.asset.drawCallsEstimate <= after.budgets.drawCallsMax && after.asset.bytes <= after.budgets.assetBytesMax, { triangles: after.asset.triangles, drawCalls: after.asset.drawCallsEstimate, bytes: after.asset.bytes });
check('Revision 15 against the saved revision 14', after.revision === 15 && before.revision === 14, [before.revision, after.revision]);
const failed = results.filter((r) => !r.pass).length;
fs.writeFileSync('docs/evidence/U1/qc-reference-review/scope-and-dimensions-c77.json', JSON.stringify({ baseline: base, revision: after.revision, passed: results.length - failed, failed, changedMeshes: changed, results }, null, 2) + '\n');
console.log({ passed: results.length - failed, failed }); process.exit(failed ? 1 : 0);
