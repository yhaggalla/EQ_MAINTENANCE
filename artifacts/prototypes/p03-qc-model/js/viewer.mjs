// QcViewer: Three.js viewer core for the CICT-J526A-STS scene (P03 prototype; promoted and bound to real data in P10).
// Contract: DATA_CONTRACT s10 (identity via userData.nodeKey or instanceMaps; containers are not mechanisms;
// enclosures transparent and not pickable in Technical mode; union-bounds focus with 0.5 m minimum extent).
// Rendering is on demand: frames are requested by control changes, camera transitions, selection and mode changes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SEL_COLOR = new THREE.Color('#1677ff');   // selection overlay (never red, so it cannot read as paint or Breakdown)
const MIN_EXTENT = 0.5;                          // DATA_CONTRACT s10.8

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

async function sha256Hex(buf) {
  if (!crypto?.subtle) return null; // non-secure context: checksum cannot be computed in the browser
  const d = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class QcViewer {
  /**
   * @param {HTMLElement} host  element that receives the canvas and the label layer
   * @param {object} opts { onPick({key, kind, nodeKind}), onBackground(), onContextLost(), onFrame() }
   */
  constructor(host, opts = {}) {
    this.host = host; this.opts = opts;
    this.reducedMotion = opts.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.mode = 'overall'; this.isolate = null; this.selected = new Set(); this.selContainer = null;
    this.labelsOn = true; this.work = new Map();
    this._needs = false; this._raf = 0; this._tween = null; this._disposed = false; this._listeners = [];

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!opts.preserveDrawingBuffer }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setClearColor('#e9eef2');
    r.info.autoReset = false;
    r.domElement.className = 'qc-canvas';
    r.domElement.setAttribute('aria-hidden', 'true'); // the tree and assembly list are the accessible equivalents
    host.appendChild(r.domElement);
    this.labelLayer = document.createElement('div'); this.labelLayer.className = 'qc-labels'; host.appendChild(this.labelLayer);

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#8a8f86', 1.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.7); sun.position.set(-60, 120, 80); this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#dfe8f0', 0.7); fill.position.set(80, 40, -90); this.scene.add(fill);

    this.persp = new THREE.PerspectiveCamera(35, 1, 0.3, 3000);
    this.ortho = new THREE.OrthographicCamera(-50, 50, 50, -50, -2000, 4000);
    this.camera = this.persp;
    this.controls = new OrbitControls(this.persp, r.domElement);
    this.controls.enableDamping = false;
    this.controls.screenSpacePanning = true;
    this.controls.maxDistance = 600; this.controls.minDistance = 2;
    this._on(this.controls, 'change', () => this.requestRender());
    this._on(this.controls, 'start', () => this.cancelTransition('user'));   // a drag cancels a running focus transition

    this._on(r.domElement, 'webglcontextlost', (e) => { e.preventDefault(); this.contextLost = true; this.opts.onContextLost?.(); });
    this._ptr = null;
    this._on(r.domElement, 'pointerdown', (e) => { this._ptr = { x: e.clientX, y: e.clientY }; });
    this._on(r.domElement, 'pointerup', (e) => { if (this._ptr && Math.hypot(e.clientX - this._ptr.x, e.clientY - this._ptr.y) < 5) this._click(e); this._ptr = null; });
    this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(host);
    this.resize();
  }

  _on(target, ev, fn) { target.addEventListener(ev, fn); this._listeners.push([target, ev, fn]); }

  /** Load the GLB and manifest. Throws {code} on checksum or structure failures (caller shows the fallback). */
  async load(glbUrl, manifest, { verifyChecksum = true, signal } = {}) {
    this.manifest = manifest;
    const res = await fetch(glbUrl, { credentials: 'same-origin', signal });
    if (!res.ok) throw Object.assign(new Error('model request failed ' + res.status), { code: 'http_' + res.status });
    const buf = await res.arrayBuffer();
    if (verifyChecksum) {
      const h = await sha256Hex(buf);
      if (h && h !== manifest.asset.sha256) throw Object.assign(new Error('model checksum mismatch'), { code: 'checksum' });
      this.checksumVerified = !!h;
    }
    const gltf = await new GLTFLoader().parseAsync(buf, '');
    this.root = gltf.scene;
    this.scene.add(this.root);
    this._index();
    this.setMode('overall');
    this.resetView(true);
    return { checksumVerified: this.checksumVerified };
  }

  _index() {
    const m = this.manifest;
    this.nodeByKey = new Map(m.nodes.map((n) => [n.key, n]));
    this.objByKey = new Map(); this.shells = new Map(); this.carriers = new Map(); this.meshes = [];
    this.instanceKeyOf = new Map(); // carrierName -> [keys]
    for (const im of m.instanceMaps) this.instanceKeyOf.set(im.gltfNodeName, im.instanceKeys);
    this.root.traverse((o) => {
      const u = o.userData || {};
      if (u.nodeKey) this.objByKey.set(u.nodeKey, o);
      if (u.shellOf) this.shells.set(u.shellOf, o);
      if (u.instanceCarrier) this.carriers.set(u.carrierName, o);
      if (o.isMesh) { this.meshes.push(o); o.userData._baseMat = o.material; }
    });
    // instanced positions -> {carrier, index}
    this.instOfKey = new Map();
    for (const [name, keys] of this.instanceKeyOf) keys.forEach((k, i) => this.instOfKey.set(k, { carrier: this.carriers.get(name), index: i }));
    for (const c of this.carriers.values()) { c.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(c.count * 3).fill(1), 3); }
    // missing nodes are reported, never guessed
    this.missing = m.nodes.filter((n) => !n.instancing && !this.objByKey.has(n.key)).map((n) => n.key);
    this.modelBox = new THREE.Box3().setFromObject(this.root);
  }

  /** Overall: normal appearance, technical-only internals hidden. Technical: enclosures transparent and unpickable. */
  setMode(mode) {
    this.mode = mode;
    const tech = mode === 'technical';
    this.root.traverse((o) => {
      const modes = o.userData.modes;
      if (modes) o.visible = modes.split(',').includes(mode) && this._isoVisible(o);
      else if (o.userData.shellOf) o.visible = this._isoVisible(o);
    });
    for (const [key, shell] of this.shells) {
      const node = this.nodeByKey.get(key);
      shell.traverse((o) => { if (o.isMesh) o.material = tech && node?.enclosure ? this._ghost(o.userData._baseMat) : o.userData._baseMat; });
    }
    this._applySelection();
    this.requestRender();
  }

  /** Isolate one container (e.g. the machinery house) for inspection of its internals. null = show all. */
  setIsolate(containerKey) {
    this.isolate = containerKey;
    this.setMode(this.mode);
    if (containerKey) this.fitKeys([containerKey]);
  }

  _isoVisible(o) {
    if (!this.isolate) return true;
    for (let p = o; p; p = p.parent) if (p.userData?.nodeKey === this.isolate) return true;
    return false;
  }

  _ghost(mat) {
    const list = Array.isArray(mat) ? mat : [mat];
    const out = list.map((m) => { if (!m.userData._ghost) { const g = m.clone(); g.transparent = true; g.opacity = 0.14; g.depthWrite = false; m.userData._ghost = g; } return m.userData._ghost; });
    return Array.isArray(mat) ? out : out[0];
  }

  _hi(mat) {
    const list = Array.isArray(mat) ? mat : [mat];
    const out = list.map((m) => { if (!m.userData._hi) { const h = m.clone(); h.emissive = SEL_COLOR.clone(); h.emissiveIntensity = 0.75; h.color = m.color.clone().lerp(SEL_COLOR, 0.35); if (h.transparent) h.opacity = Math.max(h.opacity, 0.6); m.userData._hi = h; } return m.userData._hi; });
    return Array.isArray(mat) ? out : out[0];
  }

  /** keys: Set of node keys (positions/hotspots) to highlight; container: container key (spatial selection). */
  setSelection(keys, { container = null, focus = true } = {}) {
    this.selected = new Set(keys || []);
    this.selContainer = container;
    this._applySelection();
    if (focus) {
      const fk = container ? [container] : [...this.selected];
      if (fk.length) this.fitKeys(fk); else this.requestRender();
    } else this.requestRender();
  }

  _applySelection() {
    if (!this.root) return;
    const tech = this.mode === 'technical';
    for (const mesh of this.meshes) {
      if (mesh.isInstancedMesh) continue;
      const shellKey = this._shellKey(mesh);
      const key = this._keyOf(mesh);
      const sel = key && this.selected.has(key);
      const enclosure = shellKey && tech && this.nodeByKey.get(shellKey)?.enclosure;
      mesh.material = sel ? this._hi(mesh.userData._baseMat) : enclosure ? this._ghost(mesh.userData._baseMat) : mesh.userData._baseMat;
    }
    for (const [name, c] of this.carriers) {
      const keys = this.instanceKeyOf.get(name);
      // instance colours multiply the shared material colour, so the selected tint is over-driven to stay visibly blue
      keys.forEach((k, i) => { if (this.selected.has(k)) c.instanceColor.setXYZ(i, 0.35, 1.3, 4.0); else c.instanceColor.setXYZ(i, 1, 1, 1); });
      c.instanceColor.needsUpdate = true;
    }
    // selection outline box (separate from paint); union for a container, per key otherwise (max 16)
    if (this._selBoxes) { for (const b of this._selBoxes) { this.scene.remove(b); b.geometry.dispose(); b.material.dispose(); } }
    this._selBoxes = [];
    const boxKeys = this.selContainer ? [this.selContainer] : [...this.selected].slice(0, 16);
    for (const k of boxKeys) {
      const b = this.boundsOf([k]); if (!b) continue;
      const helper = new THREE.Box3Helper(b, this.selContainer ? '#7a4cc2' : '#1677ff');
      helper.material.depthTest = false; helper.renderOrder = 10; helper.material.transparent = true; helper.material.opacity = 0.9;
      this.scene.add(helper); this._selBoxes.push(helper);
    }
  }

  _keyOf(o) { for (let p = o; p; p = p.parent) if (p.userData?.nodeKey) return p.userData.nodeKey; return null; }
  _shellKey(o) { for (let p = o; p; p = p.parent) { if (p.userData?.shellOf) return p.userData.shellOf; if (p.userData?.nodeKey) return null; } return null; }

  /** Union bounds of visible geometry for node keys (containers include descendants). Thin items padded to 0.5 m. */
  boundsOf(keys) {
    const box = new THREE.Box3(); let any = false;
    const add = (b) => { if (!b.isEmpty() && [b.min.x, b.min.y, b.max.x, b.max.y].every(Number.isFinite)) { box.union(b); any = true; } };
    for (const k of keys) {
      const inst = this.instOfKey.get(k);
      if (inst) {
        if (!inst.carrier.visible) continue;
        const m = new THREE.Matrix4(); inst.carrier.getMatrixAt(inst.index, m); m.premultiply(inst.carrier.matrixWorld);
        inst.carrier.geometry.computeBoundingBox(); add(inst.carrier.geometry.boundingBox.clone().applyMatrix4(m));
        continue;
      }
      const o = this.objByKey.get(k); if (!o) continue;
      const node = this.nodeByKey.get(k);
      if (node?.kind === 'container') {
        // descendants that are currently visible (mode/isolation aware), including instanced members
        const b = new THREE.Box3();
        o.traverseVisible((c) => { if (c.isMesh && !c.isInstancedMesh) b.expandByObject(c); });
        add(b);
        for (const [key, n] of this.nodeByKey) if (n.instancing && this._isDescendant(key, k)) add(this.boundsOf([key]) || new THREE.Box3());
        continue;
      }
      if (!this._effVisible(o)) continue;
      add(new THREE.Box3().setFromObject(o));
    }
    if (!any) return null;
    const size = box.getSize(new THREE.Vector3()); const c = box.getCenter(new THREE.Vector3());
    for (const ax of ['x', 'y', 'z']) if (size[ax] < MIN_EXTENT) { box.min[ax] = c[ax] - MIN_EXTENT / 2; box.max[ax] = c[ax] + MIN_EXTENT / 2; }
    return box;
  }

  _isDescendant(key, containerKey) { let n = this.nodeByKey.get(key); while (n && n.parentKey) { if (n.parentKey === containerKey) return true; n = this.nodeByKey.get(n.parentKey); } return false; }
  _effVisible(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }

  /** Fit the camera to the union bounds of keys. Returns false (camera unchanged) when nothing is visible. */
  fitKeys(keys) {
    const b = this.boundsOf(keys);
    if (!b) { this.requestRender(); return false; }
    this._fitBox(b, this._unoccludedDir(b, keys));
    return true;
  }

  _fitDistance(box) {
    const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.75);
    const vFov = THREE.MathUtils.degToRad(this.persp.fov); const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.persp.aspect);
    return Math.min(Math.max(r / Math.sin(Math.min(vFov, hFov) / 2) * 1.12 + Math.min(8, 2 + r * 0.5), 9), 450); // small parts keep some context
  }

  /** For a single small selection, keep the current view direction unless another part hides it; then try a few
   *  standard directions and use the first from which a ray reaches the selection first (avoids unreachable parts). */
  _unoccludedDir(box, keys) {
    const cur = this.persp.position.clone().sub(this.controls.target).normalize();
    if (keys.length !== 1 || box.getSize(new THREE.Vector3()).length() > 25) return cur;
    const c = box.getCenter(new THREE.Vector3()); const d = this._fitDistance(box);
    const cands = [cur, ...[[1, 0.7, 0.45], [1, 0.7, -0.45], [-1, 0.7, 0.45], [-1, 0.7, -0.45], [0.45, 0.7, 1], [0.45, 0.7, -1], [-0.45, 0.7, 1], [-0.45, 0.7, -1], [0.1, 1, 0.1], [1, 0.2, 0.35], [-1, 0.2, 0.35], [1, 0.2, -0.35], [-1, 0.2, -0.35]].map((v) => new THREE.Vector3(...v).normalize())];
    const ray = new THREE.Raycaster(); const targets = this._pickTargets();
    for (const dir of cands) {
      ray.set(c.clone().add(dir.clone().multiplyScalar(d)), dir.clone().negate()); ray.far = d + 1;
      const first = ray.intersectObjects(targets, false).map((h) => this._resolveHit(h)).find((x) => x);
      if (!first || first.key === keys[0]) return dir;
    }
    return cur;
  }

  _pickTargets() {
    const tech = this.mode === 'technical';
    return this.meshes.filter((m) => {
      if (!this._effVisible(m)) return false;
      const shellKey = this._shellKey(m);
      return !(shellKey && tech && this.nodeByKey.get(shellKey)?.enclosure); // transparent enclosures are not pickable
    });
  }

  _resolveHit(h) {
    if (h.object.isInstancedMesh && h.instanceId !== undefined) {
      const key = this.instanceKeyOf.get(h.object.userData.carrierName)?.[h.instanceId];
      return key ? { key, nodeKind: 'position', viaInstance: true } : null;
    }
    const shellKey = this._shellKey(h.object);
    if (shellKey) return { key: shellKey, nodeKind: 'container' };
    const key = this._keyOf(h.object); const node = key && this.nodeByKey.get(key);
    if (!node) return null;
    return { key, nodeKind: node.kind };
  }

  _fitBox(box, dir) {
    const c = box.getCenter(new THREE.Vector3());
    const d = this._fitDistance(box);
    const viewDir = dir ? dir.clone().normalize() : this.persp.position.clone().sub(this.controls.target).normalize();
    if (!Number.isFinite(viewDir.x) || viewDir.lengthSq() < 0.5) viewDir.set(-0.55, 0.45, 0.7).normalize();
    this._transition(c.clone().add(viewDir.multiplyScalar(d)), c);
  }

  /** Useful full-crane view (3/4 view from the landside, +Z side). */
  resetView(instant = false) {
    if (this.camera !== this.persp) this.useOrtho(null);
    const box = (this.modelBox || new THREE.Box3(new THREE.Vector3(-62, 0, -14), new THREE.Vector3(76, 84, 14))).clone();
    box.min.z = Math.max(box.min.z, -16); box.max.z = Math.min(box.max.z, 16); // ignore the wide quay context slab
    const c = box.getCenter(new THREE.Vector3()); const r = box.getSize(new THREE.Vector3()).length() / 2;
    const vFov = THREE.MathUtils.degToRad(this.persp.fov); const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.persp.aspect);
    const d = r / Math.sin(Math.min(vFov, hFov) / 2) * 0.92;
    const dir = new THREE.Vector3(-0.42, 0.32, 0.85).normalize();
    this._transition(c.clone().add(dir.multiplyScalar(d)), c, instant);
  }

  cancelTransition() { if (this._tween) { this._tween.cancelled = true; this._tween = null; } }

  _transition(pos, target, instant = false) {
    this.cancelTransition();
    if (instant || this.reducedMotion) {
      this.persp.position.copy(pos); this.controls.target.copy(target); this.controls.update(); this.requestRender(); return;
    }
    const t = (this._tween = { from: this.persp.position.clone(), fromT: this.controls.target.clone(), to: pos, toT: target, t0: performance.now(), dur: 650, cancelled: false });
    const step = (now) => {
      if (t.cancelled || this._disposed) return;
      const k = Math.min(1, (now - t.t0) / t.dur); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.persp.position.lerpVectors(t.from, t.to, e); this.controls.target.lerpVectors(t.fromT, t.toT, e);
      this.controls.update(); this._renderNow();
      if (k < 1) requestAnimationFrame(step); else this._tween = null;
    };
    requestAnimationFrame(step);
  }

  /** Orthographic aligned views for drawing comparison. view: 'side' | 'end-ws' | 'end-ls' | 'top' | null (back to perspective). */
  useOrtho(view, frame) {
    if (!view) { this.camera = this.persp; this.controls.enabled = true; this.requestRender(); return; }
    const o = this.ortho; const f = frame; // {left,right,bottom,top} in scene metres on the view plane
    const set = (pos, up) => { o.position.copy(pos); o.up.copy(up); };
    if (view === 'side') { set(new THREE.Vector3(f.cx, f.cy, 1000), new THREE.Vector3(0, 1, 0)); o.lookAt(f.cx, f.cy, 0); }       // landside left, waterside right
    if (view === 'end-ws') { set(new THREE.Vector3(1000, f.cy, f.cx), new THREE.Vector3(0, 1, 0)); o.lookAt(0, f.cy, f.cx); }      // from the water, +Z on the left
    if (view === 'end-ls') { set(new THREE.Vector3(-1000, f.cy, f.cx), new THREE.Vector3(0, 1, 0)); o.lookAt(0, f.cy, f.cx); }     // from landside, +Z on the right
    if (view === 'top') { set(new THREE.Vector3(f.cx, 1000, f.cy), new THREE.Vector3(0, 0, -1)); o.lookAt(f.cx, 0, f.cy); }       // plan, waterside right, +Z down
    const hw = f.w / 2, hh = f.h / 2;
    o.left = -hw; o.right = hw; o.top = hh; o.bottom = -hh; o.updateProjectionMatrix();
    this.camera = o; this.controls.enabled = false; this.requestRender();
  }

  setLabels(on) { this.labelsOn = on; this.requestRender(); }
  /** work: Map(nodeKey -> open job count) for open-work markers (separate legend from paint and status). */
  setWorkMarkers(work) { this.work = work || new Map(); this.requestRender(); }
  /** Label candidates supplied by the app: [{key, text, priority, badge}] */
  setLabelCandidates(list) { this.labelCandidates = list || []; this.requestRender(); }

  _click(e) {
    if (!this.root) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const hit = this.pickAt(ndc);
    if (hit) this.opts.onPick?.(hit); else this.opts.onBackground?.();
  }

  /** Picking policy (DATA_CONTRACT s10.7). Returns {key, nodeKind} or {nodeKind:'decorative'} or null. */
  pickAt(ndc) {
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.camera);
    for (const h of ray.intersectObjects(this._pickTargets(), false)) { const r = this._resolveHit(h); if (r) return r; }
    return null;
  }

  /** Test/diagnostic helper: CSS-pixel position of the centre of a node's visible bounds (null if not visible). */
  projectCenter(key) {
    const b = this.boundsOf([key]); if (!b) return null;
    const p = b.getCenter(new THREE.Vector3()).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }

  /** Project a node's label anchor (top centre of its bounds) to CSS pixels. */
  anchorOf(key) {
    const b = this.boundsOf([key]); if (!b) return null;
    const p = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2).project(this.camera);
    if (p.z > 1 || p.z < -1) return null;
    const w = this.renderer.domElement.clientWidth, h = this.renderer.domElement.clientHeight;
    return { x: (p.x + 1) / 2 * w, y: (1 - p.y) / 2 * h };
  }

  _layoutLabels() {
    const layer = this.labelLayer; layer.textContent = '';
    if (!this.labelsOn || !this.labelCandidates) return;
    const placed = []; const w = this.renderer.domElement.clientWidth, h = this.renderer.domElement.clientHeight;
    const cands = [...this.labelCandidates].sort((a, b) => b.priority - a.priority);
    let n = 0;
    for (const c of cands) {
      if (n >= 22) break;
      const a = this.anchorOf(c.key); if (!a || a.x < 0 || a.y < 48 || a.x > w || a.y > h - 30) continue; // keep clear of the status badge and legend
      const el = document.createElement('div'); el.className = 'qc-label' + (c.selected ? ' sel' : '');
      el.textContent = c.text;
      if (c.badge) { const b = document.createElement('span'); b.className = 'qc-badge'; b.textContent = c.badge; el.appendChild(b); }
      if (c.work) { const b = document.createElement('span'); b.className = 'qc-work'; b.textContent = c.work; b.title = c.work + ' open job(s), synthetic'; el.appendChild(b); }
      layer.appendChild(el);
      const r = { x: a.x - el.offsetWidth / 2, y: a.y - el.offsetHeight - 6, w: el.offsetWidth, h: el.offsetHeight };
      if (placed.some((p) => r.x < p.x + p.w + 4 && r.x + r.w + 4 > p.x && r.y < p.y + p.h + 2 && r.y + r.h + 2 > p.y)) { el.remove(); continue; }
      el.style.transform = `translate(${Math.round(r.x)}px, ${Math.round(r.y)}px)`;
      placed.push(r); n++;
    }
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, true);
    this.persp.aspect = w / h; this.persp.updateProjectionMatrix();
    this.requestRender();
  }

  requestRender() {
    if (this._needs || this._disposed) return;
    this._needs = true;
    this._raf = requestAnimationFrame(() => { this._needs = false; this._renderNow(); });
  }

  _renderNow() {
    if (this._disposed || this.contextLost) return;
    this.renderer.info.reset();
    this.renderer.render(this.scene, this.camera);
    this.lastInfo = { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, programs: this.renderer.info.programs?.length ?? null };
    this.frames = (this.frames || 0) + 1;
    this._layoutLabels();
    this.opts.onFrame?.(this.lastInfo);
  }

  /** Release GPU resources and listeners (renderer included). Shared caches belong to this instance only. */
  dispose() {
    this._disposed = true; this.cancelTransition(); cancelAnimationFrame(this._raf);
    for (const [t, ev, fn] of this._listeners) t.removeEventListener(ev, fn);
    this._listeners = []; this._ro?.disconnect(); this.controls.dispose();
    const mats = new Set();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      for (const m of [o.material, o.userData?._baseMat].flat()) if (m) { mats.add(m); if (m.userData?._hi) mats.add(m.userData._hi); if (m.userData?._ghost) mats.add(m.userData._ghost); }
    });
    for (const m of mats) m.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss?.();
    this.renderer.domElement.remove(); this.labelLayer.remove();
    QcViewer.disposedCount = (QcViewer.disposedCount || 0) + 1;
  }
}
