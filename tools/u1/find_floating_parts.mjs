// U1-C76: find geometry that touches nothing ("floating parts") in the generated QC scene.
// Usage: node tools/u1/find_floating_parts.mjs [model-dir] [--out FILE] [--eps 0.03]
// Method: every mesh (and every instance of an instanced carrier) is split into its connected pieces (primitives that
// share vertices). Triangles are subdivided to edges <= 1 m and two pieces touch when any of their triangle boxes come
// within eps. Pieces are then grouped; every group that is not joined to the main structure is reported with its node.
// Nodes with no display mode (unfitted optional attachments) are skipped. Conservative: box proximity can join two
// parts that only pass close to each other, so a reported island is certain, a missing one is not proof of contact.
import fs from 'node:fs';
const args = process.argv.slice(2); const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const dir = args[0] && !args[0].startsWith('--') ? args[0] : 'artifacts/models/cict-j526a-sts-scene/1';
const EPS = Number(opt('--eps', 0.03)); const outFile = opt('--out', null); const MAXE = 1.0; const CELL = 1.0;
const buf = fs.readFileSync(dir + '/scene.glb'); const jl = buf.readUInt32LE(12); const J = JSON.parse(buf.subarray(20, 20 + jl)); const bin = buf.subarray(28 + jl);
const manifest = JSON.parse(fs.readFileSync(dir + '/manifest.json'));
function acc(id) {
  const a = J.accessors[id], v = J.bufferViews[a.bufferView]; const o = (v.byteOffset || 0) + (a.byteOffset || 0); const n = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  const out = new Array(a.count * n); const st = v.byteStride || (n * (a.componentType === 5126 ? 4 : a.componentType === 5125 ? 4 : a.componentType === 5123 ? 2 : 1));
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) { const p = o + i * st + k * (a.componentType === 5126 || a.componentType === 5125 ? 4 : a.componentType === 5123 ? 2 : 1);
    out[i * n + k] = a.componentType === 5126 ? bin.readFloatLE(p) : a.componentType === 5125 ? bin.readUInt32LE(p) : a.componentType === 5123 ? bin.readUInt16LE(p) : bin.readUInt8(p); }
  return out;
}
const quatRot = (q, v) => { const [x, y, z, w] = q; const [vx, vy, vz] = v; const ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; };
// hidden nodes (modes [])
const hidden = new Set(manifest.nodes.filter((n) => n.modes && n.modes.length === 0).map((n) => n.key));
const instKeys = new Map(manifest.instanceMaps.map((m) => [m.gltfNodeName, m.instanceKeys]));
const pieces = []; // {node, key, tris: Float64Array-like [ax,ay,az,bx,...]}
for (const n of J.nodes) {
  if (n.mesh === undefined) continue; if (n.extras?.modes === '') continue;
  const prim = J.meshes[n.mesh].primitives; let pos = [], idx = [];
  for (const q of prim) { const p = acc(q.attributes.POSITION); const base = pos.length / 3; const ii = q.indices !== undefined ? acc(q.indices) : p.map((_, i) => i).slice(0, p.length / 3); for (const v of p) pos.push(v); for (const i of ii) idx.push(i + base); }
  // connected pieces by shared (rounded) vertex position
  const vid = new Map(); const vmap = new Array(pos.length / 3); const parent = [];
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  for (let i = 0; i < pos.length / 3; i++) { const k = Math.round(pos[i * 3] * 2000) + ',' + Math.round(pos[i * 3 + 1] * 2000) + ',' + Math.round(pos[i * 3 + 2] * 2000); if (!vid.has(k)) { vid.set(k, parent.length); parent.push(parent.length); } vmap[i] = vid.get(k); }
  for (let t = 0; t < idx.length; t += 3) { const a = find(vmap[idx[t]]), b = find(vmap[idx[t + 1]]), c = find(vmap[idx[t + 2]]); parent[b] = a; parent[find(c)] = a; }
  const groups = new Map();
  for (let t = 0; t < idx.length; t += 3) { const r = find(vmap[idx[t]]); if (!groups.has(r)) groups.set(r, []); const g = groups.get(r); for (const i of [idx[t], idx[t + 1], idx[t + 2]]) g.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); }
  const inst = n.extensions?.EXT_mesh_gpu_instancing?.attributes;
  if (inst) {
    const T = acc(inst.TRANSLATION), R = inst.ROTATION !== undefined ? acc(inst.ROTATION) : null, Sx = inst.SCALE !== undefined ? acc(inst.SCALE) : null; const keys = instKeys.get(n.name) || [];
    for (let i = 0; i < T.length / 3; i++) {
      const key = keys[i] || n.name + '#' + i; if (hidden.has(key)) continue;
      for (const g of groups.values()) { const tr = new Array(g.length);
        for (let v = 0; v < g.length; v += 3) { let p = [g[v], g[v + 1], g[v + 2]]; if (Sx) p = [p[0] * Sx[i * 3], p[1] * Sx[i * 3 + 1], p[2] * Sx[i * 3 + 2]]; if (R) p = quatRot([R[i * 4], R[i * 4 + 1], R[i * 4 + 2], R[i * 4 + 3]], p); tr[v] = p[0] + T[i * 3]; tr[v + 1] = p[1] + T[i * 3 + 1]; tr[v + 2] = p[2] + T[i * 3 + 2]; }
        pieces.push({ node: n.name, key, tris: tr }); }
    }
  } else { if (hidden.has(n.name)) continue; for (const g of groups.values()) pieces.push({ node: n.name, key: n.name, tris: g }); }
}
// subdivide and hash triangle boxes
const grid = new Map(); const up = pieces.map((_, i) => i); const findP = (a) => { while (up[a] !== a) { up[a] = up[up[a]]; a = up[a]; } return a; };
const boxes = []; // [piece, x0,y0,z0,x1,y1,z1]
function addTri(pi, a, b, c, depth) {
  const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); const ab = d(a, b), bc = d(b, c), ca = d(c, a); const m = Math.max(ab, bc, ca);
  if (m > MAXE && depth < 12) { const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    if (m === ab) { const x = mid(a, b); addTri(pi, a, x, c, depth + 1); addTri(pi, x, b, c, depth + 1); } else if (m === bc) { const x = mid(b, c); addTri(pi, a, b, x, depth + 1); addTri(pi, a, x, c, depth + 1); } else { const x = mid(c, a); addTri(pi, a, b, x, depth + 1); addTri(pi, x, b, c, depth + 1); }
    return; }
  boxes.push(pi, Math.min(a[0], b[0], c[0]) - EPS, Math.min(a[1], b[1], c[1]) - EPS, Math.min(a[2], b[2], c[2]) - EPS, Math.max(a[0], b[0], c[0]) + EPS, Math.max(a[1], b[1], c[1]) + EPS, Math.max(a[2], b[2], c[2]) + EPS);
}
pieces.forEach((p, pi) => { const t = p.tris; for (let i = 0; i < t.length; i += 9) addTri(pi, [t[i], t[i + 1], t[i + 2]], [t[i + 3], t[i + 4], t[i + 5]], [t[i + 6], t[i + 7], t[i + 8]], 0); });
const nb = boxes.length / 7;
for (let i = 0; i < nb; i++) { const o = i * 7; const pi = boxes[o];
  for (let x = Math.floor(boxes[o + 1] / CELL); x <= Math.floor(boxes[o + 4] / CELL); x++) for (let y = Math.floor(boxes[o + 2] / CELL); y <= Math.floor(boxes[o + 5] / CELL); y++) for (let z = Math.floor(boxes[o + 3] / CELL); z <= Math.floor(boxes[o + 6] / CELL); z++) {
    const k = x + ',' + y + ',' + z; let cell = grid.get(k); if (!cell) { cell = []; grid.set(k, cell); }
    for (const j of cell) { const q = j * 7; const pj = boxes[q]; if (pj === pi) continue; const ra = findP(pi), rb = findP(pj); if (ra === rb) continue;
      if (boxes[o + 1] <= boxes[q + 4] && boxes[o + 4] >= boxes[q + 1] && boxes[o + 2] <= boxes[q + 5] && boxes[o + 5] >= boxes[q + 2] && boxes[o + 3] <= boxes[q + 6] && boxes[o + 6] >= boxes[q + 3]) up[ra] = rb; }
    cell.push(i); }
}
// islands
const islands = new Map(); pieces.forEach((p, i) => { const r = findP(i); if (!islands.has(r)) islands.set(r, []); islands.get(r).push(i); });
const mainRoot = findP(pieces.findIndex((p) => p.node === 'structure.girder.rear.main'));
const label = new Map(manifest.nodes.map((n) => [n.key, n.label])); const parentOf = new Map(manifest.nodes.map((n) => [n.key, n.parentKey]));
const report = [];
for (const [r, list] of islands) { if (r === mainRoot) continue; const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]; const keys = new Map();
  for (const i of list) { const t = pieces[i].tris; keys.set(pieces[i].key, (keys.get(pieces[i].key) || 0) + 1); for (let v = 0; v < t.length; v += 3) for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], t[v + k]); b[k + 3] = Math.max(b[k + 3], t[v + k]); } }
  // nearest geometry outside the island: box-to-box gap (eps removed) searched within 3 m
  const inIsland = new Set(list); let best = { gap: Infinity };
  for (let i = 0; i < nb; i++) { const o = i * 7; if (!inIsland.has(boxes[o])) continue; const R = 3;
    for (let x = Math.floor((boxes[o + 1] - R) / CELL); x <= Math.floor((boxes[o + 4] + R) / CELL); x++) for (let y = Math.floor((boxes[o + 2] - R) / CELL); y <= Math.floor((boxes[o + 5] + R) / CELL); y++) for (let z = Math.floor((boxes[o + 3] - R) / CELL); z <= Math.floor((boxes[o + 6] + R) / CELL); z++) {
      const cell = grid.get(x + ',' + y + ',' + z); if (!cell) continue;
      for (const j of cell) { const q = j * 7; if (inIsland.has(boxes[q])) continue; const d = [0, 1, 2].map((k) => { const lo = boxes[q + 1 + k] - boxes[o + 4 + k], hi = boxes[o + 1 + k] - boxes[q + 4 + k]; return lo > 0 ? lo + 2 * EPS : hi > 0 ? -(hi + 2 * EPS) : 0; });
        const gap = Math.hypot(...d); if (gap < best.gap) best = { gap, to: pieces[boxes[q]].key, move: d.map((v) => +v.toFixed(3)) }; } } }
  report.push({ keys: [...keys].map(([k, c]) => ({ key: k, pieces: c, parent: parentOf.get(k) || null, label: label.get(k) || null })), bounds: { min: b.slice(0, 3).map((v) => +v.toFixed(3)), max: b.slice(3).map((v) => +v.toFixed(3)) }, nearest: best.gap === Infinity ? null : { gap: +best.gap.toFixed(3), to: best.to, move: best.move } }); }
report.sort((a, b) => (a.keys[0].parent || '').localeCompare(b.keys[0].parent || '') || a.keys[0].key.localeCompare(b.keys[0].key));
const summary = { model: dir, revision: manifest.revision, eps: EPS, pieces: pieces.length, triangleBoxes: nb, islands: report.length, islandKeys: [...new Set(report.flatMap((r) => r.keys.map((k) => k.key)))].length };
if (outFile) fs.writeFileSync(outFile, JSON.stringify({ summary, islands: report }, null, 2) + '\n');
for (const r of report) console.log((r.keys[0].parent || '-').replace('container.', '').padEnd(20), r.keys.map((k) => k.key + (k.pieces > 1 ? ' x' + k.pieces : '')).join(' + ').slice(0, 60).padEnd(62), JSON.stringify(r.bounds.min), JSON.stringify(r.bounds.max), r.nearest ? 'gap ' + r.nearest.gap + ' to ' + r.nearest.to + ' move ' + JSON.stringify(r.nearest.move) : 'nothing within 3 m');
console.log(JSON.stringify(summary));
