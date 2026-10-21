// Scene builder: creates the Three.js hierarchy and the matching manifest node list (DATA_CONTRACT s10.3).
// Identity rule: every semantic node is one named glTF node whose userData.nodeKey is the key. Instanced
// positions are resolved through instanceMaps (carrier node name + ordered key list), never by index alone.
import { THREE, NodeGeom, sphere } from './kit.mjs';

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*){1,11}$/;
const DOMAINS = new Set(['structure', 'boom', 'hoist', 'trolley', 'trolley-drive', 'boom-hoist', 'gantry', 'reeving', 'headblock', 'spreader', 'machinery-house', 'electrical', 'cabin', 'access', 'auxiliary', 'emergency', 'container']);

export class SceneBuilder {
  constructor(materials, rootName) {
    this.materials = materials;
    this.root = new THREE.Group();
    this.root.name = rootName;
    this.root.userData = { modelRoot: true };
    this.nodes = [];
    this.objects = new Map(); // key -> Object3D
    this.instanceMaps = [];
  }

  _check(key) {
    if (!KEY_RE.test(key) || key.length > 128) throw new Error('bad key ' + key);
    if (!DOMAINS.has(key.split('.')[0])) throw new Error('bad domain ' + key);
    if (this.objects.has(key) || this.nodes.some((n) => n.key === key)) throw new Error('duplicate key ' + key);
  }

  _parent(parentKey) {
    if (!parentKey) return this.root;
    const p = this.objects.get(parentKey);
    if (!p) throw new Error('unknown parent ' + parentKey);
    return p;
  }

  _entry(key, kind, o) {
    const sub = o.sub || null;
    return {
      key, kind, label: o.label,
      parentKey: o.parentKey || null,
      classification: sub ? { main: sub.slice(0, 2), sub } : null,
      classificationNote: o.classificationNote || null,
      gltfNodeNames: [],
      instancing: null,
      pickable: kind !== 'decorative',
      pickPriority: o.pickPriority ?? (kind === 'hotspot' ? 60 : kind === 'position' ? 50 : kind === 'container' ? 10 : 0),
      modes: o.modes || ['overall', 'technical'],
      enclosure: !!o.enclosure,
      positionKind: kind === 'position' ? (o.positionKind || 'serialized') : null,
      uom: kind === 'position' ? (o.uom || 'ea') : null,
      category: o.category || null,
      provenance: { kind: o.prov || 'estimated', sources: o.sources || [] },
      qualifier: o.qualifier || defaultQualifier(o.prov),
      hotspot: null,
      bounds: null,
      cameraHint: o.cameraHint || null,
    };
  }

  container(key, o = {}) {
    this._check(key);
    const g = new THREE.Group();
    g.name = key;
    g.userData = { nodeKey: key, nodeKind: 'container' };
    this._parent(o.parentKey).add(g);
    this.objects.set(key, g);
    const e = this._entry(key, 'container', o);
    e.gltfNodeNames.push(key);
    this.nodes.push(e);
    return g;
  }

  /** Enclosure/visual geometry that belongs to the container itself (e.g. machinery-house walls). */
  containerShell(containerKey, build) {
    const ng = new NodeGeom(); build(ng);
    const mesh = ng.build(containerKey + '.shell', this.materials);
    mesh.userData = { shellOf: containerKey };
    this.objects.get(containerKey).add(mesh);
    return mesh;
  }

  _mesh(key, kind, o, build) {
    this._check(key);
    const ng = new NodeGeom(); build(ng);
    if (ng.empty) throw new Error('empty geometry for ' + key);
    const mesh = ng.build(key, this.materials);
    mesh.userData = { nodeKey: key, nodeKind: kind, modes: (o.modes || ['overall', 'technical']).join(',') };
    this._parent(o.parentKey).add(mesh);
    this.objects.set(key, mesh);
    const e = this._entry(key, kind, o);
    e.gltfNodeNames.push(key);
    this.nodes.push(e);
    return e;
  }

  position(key, o, build) { if (!o.sub) throw new Error('position without classification ' + key); return this._mesh(key, 'position', o, build); }
  decorative(key, o, build) { if (o.sub) throw new Error('decorative with classification ' + key); return this._mesh(key, 'decorative', o, build); }

  /** Qualified location marker for a sub mechanism whose exact geometry is not established. */
  hotspot(key, o) {
    if (!o.sub) throw new Error('hotspot without classification ' + key);
    const r = o.radius || 0.6;
    const e = this._mesh(key, 'hotspot', { ...o, modes: o.modes || ['technical'], prov: o.prov || 'approximate-location' }, (ng) => ng.add('hotspot', sphere(o.point, r, 14)));
    e.hotspot = { point: o.point, radius: r };
    return e;
  }

  /**
   * Instanced positions sharing one geometry (e.g. 32 gantry wheels). One carrier node; each instance is a
   * manifest position whose identity comes from instanceMaps[carrier].instanceKeys[instanceId].
   */
  instanced(carrierName, o, baseBuild, instances) {
    const ng = new NodeGeom(); baseBuild(ng);
    const proto = ng.build(carrierName, this.materials);
    const im = new THREE.InstancedMesh(proto.geometry, proto.material, instances.length);
    im.name = carrierName;
    im.userData = { instanceCarrier: true, carrierName, modes: (o.modes || ['overall', 'technical']).join(',') };
    instances.forEach((inst, i) => im.setMatrixAt(i, inst.matrix));
    im.instanceMatrix.needsUpdate = true;
    this._parent(o.parentKey).add(im);
    const keys = [];
    instances.forEach((inst, i) => {
      this._check(inst.key);
      const e = this._entry(inst.key, 'position', { ...o, ...inst });
      e.instancing = { gltfNodeName: carrierName, index: i };
      this.nodes.push(e);
      keys.push(inst.key);
    });
    this.instanceMaps.push({ gltfNodeName: carrierName, instanceKeys: keys });
    return im;
  }
}

function defaultQualifier(prov) {
  if (prov === 'approximate-location') return 'Location approximate / simplified representation';
  if (prov === 'estimated') return 'Estimated geometry';
  return null;
}
