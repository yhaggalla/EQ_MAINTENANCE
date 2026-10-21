// Geometry kit for the deterministic QC scene generator (P03).
// Every builder works in world coordinates (metres, Y up). Geometry of one semantic node is merged per material,
// so one maintenance position = one glTF node (one primitive per material). No uv/texture data is emitted.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (a) => (a instanceof THREE.Vector3 ? a.clone() : new THREE.Vector3(a[0], a[1], a[2]));

function clean(g) {
  // Keep only position + normal so every merged geometry has identical attributes; drop uv.
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  if (!g.index) {
    const n = g.attributes.position.count;
    const idx = new Array(n); for (let i = 0; i < n; i++) idx[i] = i;
    g.setIndex(idx);
  }
  g.clearGroups();
  return g;
}

/** Axis-aligned box from centre and size. */
export function box(c, s) {
  const g = new THREE.BoxGeometry(s[0], s[1], s[2]);
  g.translate(c[0], c[1], c[2]);
  return clean(g);
}

/** Axis-aligned box from min/max corners. */
export function boxMinMax(a, b) {
  const min = [0, 1, 2].map((i) => Math.min(a[i], b[i])); const max = [0, 1, 2].map((i) => Math.max(a[i], b[i]));
  return box([(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], [max[0] - min[0], max[1] - min[1], max[2] - min[2]]);
}

/** Cylinder between two points. */
export function tube(a, b, r, seg = 16, r2 = r) {
  const A = V(a), B = V(b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2, r, len, seg, 1, false);
  const dir = B.clone().sub(A).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.applyQuaternion(q);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return clean(g);
}

/** Cylinder along a principal axis ('x' | 'y' | 'z') centred on c. */
export function cyl(c, axis, r, len, seg = 20) {
  const half = len / 2;
  const a = [...c], b = [...c];
  const i = { x: 0, y: 1, z: 2 }[axis];
  a[i] -= half; b[i] += half;
  return tube(a, b, r, seg);
}

/** Rectangular beam between two points; 'w' across (perpendicular, horizontal), 'h' vertical-ish. */
export function beam(a, b, w, h, up = [0, 1, 0]) {
  const A = V(a), B = V(b);
  const len = A.distanceTo(B);
  const g = new THREE.BoxGeometry(len, h, w);
  const xAxis = B.clone().sub(A).normalize();
  let upV = V(up);
  if (Math.abs(xAxis.dot(upV)) > 0.98) upV = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3().crossVectors(xAxis, upV).normalize();
  const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
  const m = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  g.applyMatrix4(m);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return clean(g);
}

/**
 * Frustum-like box: bottom rectangle (centre cb, size sb=[x,z]) to top rectangle (centre ct, size st=[x,z]).
 * Used for tapered/leaning legs.
 */
export function taper(cb, sb, ct, st) {
  const p = [];
  const ring = (c, s) => [
    [c[0] - s[0] / 2, c[1], c[2] - s[1] / 2], [c[0] + s[0] / 2, c[1], c[2] - s[1] / 2],
    [c[0] + s[0] / 2, c[1], c[2] + s[1] / 2], [c[0] - s[0] / 2, c[1], c[2] + s[1] / 2],
  ];
  const b = ring(cb, sb), t = ring(ct, st);
  const quads = [
    [b[0], b[1], t[1], t[0]], [b[1], b[2], t[2], t[1]], [b[2], b[3], t[3], t[2]], [b[3], b[0], t[0], t[3]],
    [t[0], t[1], t[2], t[3]], [b[3], b[2], b[1], b[0]],
  ];
  // The rings run clockwise seen from +Y, so each quad is emitted reversed to give outward (CCW) faces.
  for (const q of quads) { p.push(...q[0], ...q[2], ...q[1], ...q[0], ...q[3], ...q[2]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.computeVertexNormals(); // non-indexed, so these are flat face normals
  return clean(g);
}

/** Gable roof (ridge along Z) over the rectangle x0..x1, z0..z1 at eave height y0 with rise. */
export function gableRoof(x0, x1, z0, z1, y0, rise, t = 0.12) {
  const xm = (x0 + x1) / 2;
  const half = (x1 - x0) / 2 + 0.3;
  const slope = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  const parts = [];
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(slope, t, z1 - z0 + 0.6);
    g.rotateZ(s * -ang);
    g.translate(xm + s * half / 2, y0 + rise / 2, (z0 + z1) / 2);
    parts.push(clean(g));
  }
  return mergeGeometries(parts, false);
}

export function sphere(c, r, seg = 12) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg / 2));
  g.translate(c[0], c[1], c[2]);
  return clean(g);
}

/** Torus-free sheave: disc with hub, axis along 'x' | 'y' | 'z'. */
export function sheave(c, axis, dia, width, seg = 20) {
  return [cyl(c, axis, dia / 2, width, seg), cyl(c, axis, dia * 0.18, width * 1.6, 10)];
}

/** Material registry: one shared material per name (shared GPU resource, exported once). */
export class Materials {
  constructor(defs) {
    this.map = new Map();
    for (const [name, d] of Object.entries(defs)) {
      const m = new THREE.MeshStandardMaterial({ name, color: new THREE.Color(d.color), roughness: d.roughness ?? 0.7, metalness: d.metalness ?? 0.1, side: d.doubleSide ? THREE.DoubleSide : THREE.FrontSide });
      if (d.opacity !== undefined && d.opacity < 1) { m.transparent = true; m.opacity = d.opacity; }
      m.userData = { paintRole: d.role };
      this.map.set(name, m);
    }
  }
  get(name) { const m = this.map.get(name); if (!m) throw new Error('unknown material ' + name); return m; }
}

/** Accumulates geometry for one semantic node and produces one Object3D (Mesh, multi-material if needed). */
export class NodeGeom {
  constructor() { this.byMat = new Map(); }
  add(mat, ...geoms) {
    for (const g of geoms.flat()) { if (!this.byMat.has(mat)) this.byMat.set(mat, []); this.byMat.get(mat).push(g); }
    return this;
  }
  get empty() { return this.byMat.size === 0; }
  build(name, materials) {
    const mats = [...this.byMat.keys()].sort();
    const geoms = mats.map((m) => mergeGeometries(this.byMat.get(m), false));
    let geom; let mat;
    if (geoms.length === 1) { geom = geoms[0]; mat = materials.get(mats[0]); }
    else { geom = mergeGeometries(geoms, true); mat = mats.map((m) => materials.get(m)); }
    geom.computeBoundingBox();
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    return mesh;
  }
}

export { THREE, mergeGeometries };
