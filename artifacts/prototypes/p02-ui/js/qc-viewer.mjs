// One geometry, renderer and selection contract for 3D and fixed-side Flat modes.
// Prototype bindings only. Existing position IDs and work records are never remapped.
import * as THREE from 'three';
import { QcViewer, webglAvailable } from '../qc/js/viewer.mjs';
const EQ = window.EQ, h = EQ.h;
const BASE = 'models/cict-j526a-sts-scene/1/';
let manifest, loading, failure, session = null;
const eligible = eq => ['eq-qc-demo-01', 'eq-qc-demo-02'].includes(eq.id) && EQ.verified(eq);
const descendants = (n, key) => {
  while (n?.parentKey) { if (n.parentKey === key) return true; n = manifest.nodes.find(x => x.key === n.parentKey); }
  return false;
};

function prepare(eq) {
  if (!eligible(eq)) return;
  if (!manifest) {
    if (!loading && !failure) loading = fetch(BASE + 'manifest.json').then(r => {
      if (!r.ok) throw new Error('manifest'); return r.json();
    }).then(m => { manifest = m; }).catch(() => { failure = 'The model could not be loaded.'; })
      .finally(() => { loading = null; EQ.rerender(); });
    return;
  }
  // Append only absent exact keys. Preserve old fixture IDs even where a placeholder key has no model node.
  const existing = new Set(EQ.positionsOf(eq.id).map(p => p.key));
  for (const n of manifest.nodes.filter(n => n.kind === 'position')) {
    if (existing.has(n.key)) continue;
    const sub = eq.subs.find(s => s.code === n.classification.sub);
    if (!sub) continue;
    EQ.state.D.positions.push({ id: 'mp-' + eq.key + '-' + n.key.replaceAll('.', '_'), equipmentId: eq.id,
      mainId: sub.mainId, subId: sub.id, key: n.key, name: n.label, kind: n.positionKind, uom: n.uom,
      nominal: null, category: n.category, state: eq.positionState === 'draft' ? 'draft' : 'active',
      prov: n.provenance.kind, src: (n.provenance.sources || []).map(x => x.drawing + ' p' + x.pdfPage + (x.note ? ': ' + x.note : '')).join('; ') || n.provenance.kind });
  }
  // Old model-page links use semantic keys, never another equipment's position ID.
  const q = EQ.route.query;
  if (q.pkey) {
    const p = EQ.positionsOf(eq.id).find(p => p.key === q.pkey.replaceAll('_', '.'));
    if (p) { q.part = p.id; q.sub = p.subId; q.main = p.mainId; }
    else q.part = 'unmapped-legacy-part';
    delete q.pkey;
    history.replaceState(null, '', location.pathname + location.search + '#/eq/equipment/' + eq.id + '?' + new URLSearchParams(q));
  }
}
function dispose() {
  if (!session) return;
  session.abort.abort(); session.viewer?.dispose(); session = null;
}
function message(s, text) { s.notice.textContent = text; s.notice.hidden = !text; }
function pick(s, key) {
  const n = manifest.nodes.find(n => n.key === key), eq = s.eq;
  if (n?.kind === 'container') {
    EQ.eqv.select(eq, {}, { container: key.slice('container.'.length), area: key.slice('container.'.length), mode: 'technical' }); return;
  }
  const p = EQ.positionsOf(eq.id).find(p => p.key === key && p.state === 'active');
  if (p) { EQ.eqv.select(eq, { part: p.id }); return; }
  if (n?.kind === 'hotspot') {
    const sub = eq.subs.find(x => x.code === n.classification.sub);
    if (sub) { EQ.eqv.select(eq, { main: sub.mainId, sub: sub.id }); return; }
  }
  message(s, 'This shape has no active part binding. Use the mechanism tree.');
}
function candidates(s, nodes, work) {
  const { eq, sel, q } = s;
  const main = eq.mains.find(m => m.id === sel.main), sub = eq.subs.find(x => x.id === sel.sub);
  const part = EQ.pos(sel.part);
  const label = (id, text, ns, next, tier, selected = false) => ({ id, text, keys: ns.map(n => n.key), next,
    tier, allowHidden: true, priority: selected ? 100 : 50, selected,
    work: EQ.eqUI.showWork ? next.sub ? EQ.openCount(eq.id, { level: 'sub', id: next.sub }) : next.main ? EQ.openCount(eq.id, { level: 'main', id: next.main }) : ns.reduce((sum, n) => sum + (work.get(n.key) || 0), 0) : 0 });
  if (q.container || sub) {
    const ns = nodes.filter(n => q.container ? descendants(n, 'container.' + q.container) : n.classification.sub === sub.code);
    if (ns.length) return ns.map(n => ({ ...label(n.key, n.label, [n], { key: n.key }, 3, n.key === part?.key),
      badge: n.kind === 'hotspot' || n.provenance.kind === 'approximate-location' ? 'Approx.' : null }));
  }
  if (main) {
    const ls = eq.subs.filter(x => x.mainId === main.id).map(x => label(x.id, x.code + ' ' + EQ.defLabel(x.code),
      nodes.filter(n => n.classification.sub === x.code), { main: main.id, sub: x.id }, 2, x.id === sel.sub)).filter(x => x.keys.length);
    if (ls.length) return ls;
  }
  return eq.mains.map(m => label(m.id, m.code + ' ' + EQ.defLabel(m.code), nodes.filter(n => n.classification.main === m.code),
    { main: m.id }, 1, m.id === sel.main)).filter(x => x.keys.length);
}
function side(s) {
  const aspect = Math.max(1, s.host.clientWidth) / Math.max(1, s.host.clientHeight);
  const b = s.viewer.craneBox, size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const height = Math.max(size.y + 6, size.x / aspect) * 1.08;
  s.viewer.useOrtho('side', { cx: c.x, cy: c.y - 2, w: height * aspect, h: height });
}
function resetCamera(s) { if (s.q.view !== '3d') side(s); else s.viewer.resetView(); }
function update(s) {
  if (!s.ready) return;
  const v = s.viewer, { eq, sel, q, mode } = s;
  const flat = q.view !== '3d';
  const cameraChanged = s.flat !== flat;
  if (cameraChanged) { if (flat) side(s); else v.useOrtho(null); s.flat = flat; }
  const area = q.area || (q.iso === '1' ? 'machinery-house' : '');
  const iso = manifest.nodes.some(n => n.kind === 'container' && n.key === 'container.' + area) ? 'container.' + area : null;
  s.context && (s.context.visible = !iso);
  if (v.mode !== mode) v.setMode(mode);
  if (v.isolate !== iso) v.setIsolate(iso);
  v.objByKey.get('gantry.quay.reference').visible = false;
  const ps = EQ.positionsOf(eq.id).filter(p => p.state === 'active');
  const byKey = new Map(ps.map(p => [p.key, p]));
  const nodes = manifest.nodes.filter(n => (n.kind === 'position' && byKey.has(n.key)) ||
    (n.kind === 'hotspot' && eq.subs.some(x => x.code === n.classification.sub)));
  const main = eq.mains.find(m => m.id === sel.main), sub = eq.subs.find(x => x.id === sel.sub), part = EQ.pos(sel.part);
  const container = q.container ? 'container.' + q.container : null;
  const keys = part ? (byKey.has(part.key) ? [part.key] : []) : nodes.filter(n => sub ? n.classification.sub === sub.code : main ? n.classification.main === main.code : false).map(n => n.key);
  const sig = JSON.stringify([eq.id, keys, container, mode, iso]);
  v.setSelection(keys, { container, focus: false });
  message(s, '');
  if (sig !== s.signature || cameraChanged) {
    s.signature = sig;
    if (container || keys.length) {
      if (!v.fitKeys(container ? [container] : keys)) message(s, 'This selection has no visible representation in this mode. Use Technical mode or the tree.');
    } else if (sel.part || sel.sub || sel.main) message(s, 'This selection has no visible representation. Its records remain available.');
    else if (!iso) resetCamera(s);
  }
  if ((sel.part || sel.sub || sel.main || container) && !v.boundsOf(container ? [container] : keys))
    message(s, 'This selection has no visible representation in this mode. Its records remain available; use Technical mode or the tree.');
  const work = new Map();
  ps.forEach(p => { const count = EQ.openCount(eq.id, { level: 'part', id: p.id }); if (count) work.set(p.key, count); });
  v.setWorkMarkers(EQ.eqUI.showWork ? work : new Map());
  v.setLabels(EQ.eqUI.labels); v.setLabelCandidates(candidates(s, iso ? nodes.filter(n => descendants(n, iso)) : nodes, work));
}
function render(eq, sel, q, mode) {
  if (!eligible(eq)) return h('div', { class: 'panel panel-pad' }, 'No reviewed model binding is available for this equipment. Use the mechanism tree and records.');
  if (!manifest || failure) return h('div', { class: 'panel panel-pad', role: 'status' }, failure || 'Loading the crane model. The tree and records remain available.',
    failure ? h('button', { type: 'button', onClick: () => { failure = null; prepare(eq); EQ.rerender(); } }, 'Retry') : null);
  if (session?.eq.id !== eq.id) dispose();
  if (!session) {
    const notice = h('p', { class: 'qc-notice', role: 'status' }, 'Loading the crane model…');
    session = { eq, host: h('div', { class: 'unified-qc-stage' }, notice), notice, abort: new AbortController() };
  }
  const s = session; Object.assign(s, { eq, sel, q, mode });
  const nav = extra => EQ.nav('/eq/equipment/' + eq.id, { ...EQ.route.query, ...extra });
  const btn = (key, text, action, pressed) => h('button', { type: 'button', 'data-fk': key,
    'aria-pressed': pressed == null ? null : String(pressed), onClick: action }, text);
  const box = h('section', { class: 'panel unified-qc', 'aria-label': 'Crane viewer' },
    h('div', { class: 'vp-bar' },
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Camera view' },
        btn('view-3d', '3D', () => nav({ view: '3d' }), q.view === '3d'),
        btn('view-flat', 'Flat', () => nav({ view: 'flat' }), q.view !== '3d')),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Display mode' },
        btn('mode-overall', 'Overall', () => nav({ mode: 'overall', iso: '', area: '', container: '' }), mode === 'overall'),
        btn('mode-technical', 'Technical', () => nav({ mode: 'technical' }), mode === 'technical')),
      h('label', { class: 'qc-area' }, 'Isolate area', h('select', { 'aria-label': 'Isolate area', 'data-fk': 'isolate-area',
        onChange: e => nav({ area: e.target.value, container: e.target.value, main: '', sub: '', part: '', iso: '', ...(e.target.value ? { mode: 'technical' } : {}) }) },
        h('option', { value: '', selected: !q.area && q.iso !== '1' }, 'Whole crane'),
        manifest.nodes.filter(n => n.kind === 'container').map(n => h('option', { value: n.key.slice(10), selected: (q.area || (q.iso === '1' ? 'machinery-house' : '')) === n.key.slice(10) }, n.label)))),
      btn('fit', 'Fit selection', () => { if (s.ready) { const v = s.viewer; if (!v.selected.size && !v.selContainer) resetCamera(s); else v.fitKeys(v.selContainer ? [v.selContainer] : [...v.selected]); } }),
      btn('zoom-in', 'Zoom in', () => zoom(s, 1.25)),
      btn('zoom-out', 'Zoom out', () => zoom(s, 0.8)),
      btn('reset', 'Reset', () => { s.signature = null; EQ.fullReset(eq, q); }),
      btn('labels', 'Labels', () => { EQ.eqUI.labels = !EQ.eqUI.labels; EQ.rerender(); }, EQ.eqUI.labels),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: EQ.eqUI.showWork || null, 'data-fk': 'work', onChange: e => { EQ.eqUI.showWork = e.target.checked; EQ.rerender(); } }), 'Open-work markers')),
    h('div', { class: 'vp-info' }, EQ.statusBadge(eq.status, true), h('span', { class: 'small muted' }, q.view !== '3d' ? 'Fixed side view · right-drag to pan · scroll to zoom' : '3D view · drag to rotate · right-drag to pan · scroll to zoom')),
    s.host,
    h('details', { class: 'vp-legend' }, h('summary', null, 'Legend and model information'),
      h('p', { class: 'panel-pad small' }, 'Red: crane paint, independent of status. Blue: selected part. Purple number: open work. Approx.: representative part or approximate location. Both views use the same drawing-derived model (draft revision ' + manifest.revision + '), with synthetic equipment bindings. Yard/rail level: 0 m; sea level: -5 m (user-specified display context).' )),
    );
  requestAnimationFrame(() => { if (session === s && s.host.isConnected) start(s); });
  return box;
}
async function start(s) {
  if (s.started) { update(s); return; }
  s.started = true;
  if (!webglAvailable()) { message(s, 'WebGL is unavailable. Use the mechanism tree and information tabs.'); return; }
  try {
    s.viewer = new QcViewer(s.host, {
      onPick: hit => pick(s, hit.key),
      onResize: () => { if (s.ready && !s.sel.main && !s.sel.sub && !s.sel.part && !s.q.area && !s.q.container) resetCamera(s); },
      onLabel: c => {
        // A hidden technical label must reveal the internals when selected.
        if (s.mode === 'overall' && !s.viewer.boundsOf(c.keys)) s.q.mode = 'technical';
        if (c.next.key) pick(s, c.next.key); else EQ.eqv.select(s.eq, c.next);
      },
      onContextLost: () => { if (session === s) { s.ready = false; retry(s, 'Graphics context lost. Records remain available.'); } },
    });
    await s.viewer.load(BASE + 'scene.glb', manifest, { signal: s.abort.signal });
    if (session !== s) { s.viewer.dispose(); return; }
    addContext(s); s.ready = true; update(s);
  } catch (e) { if (session === s && e.name !== 'AbortError') retry(s, 'The model could not be loaded. Records remain available.'); }
}
// Display context only: the user's 5 m level difference is independent of the reviewed crane asset.
function addContext(s) {
  const v = s.viewer;
  v.objByKey.get('gantry.quay.reference').visible = false;
  const group = s.context = new THREE.Group(); v.scene.add(group);
  const box = (name, size, xyz, color) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    mesh.name = name; mesh.position.set(...xyz); group.add(mesh);
  };
  // Quay edge at +5.3 m from the waterside rail (existing drawing context); rail top y=0, sea y=-5.
  box('Yard', [1005.3, 1000, 2000], [-497.35, -500, 0], '#c3c5c0');
  box('Sea', [1000, 1000, 2000], [505.3, -505, 0], '#5a9cbb');
  v.craneBox = new THREE.Box3();
  for (const n of manifest.nodes.filter(n => n.kind !== 'decorative'))
    v.craneBox.union(new THREE.Box3(new THREE.Vector3(...n.bounds.min), new THREE.Vector3(...n.bounds.max)));
}
function retry(s, text) {
  message(s, text);
  s.notice.appendChild(h('button', { type: 'button', onClick: () => { dispose(); EQ.rerender(); } }, 'Retry viewer'));
}
function zoom(s, scale) {
  if (!s.ready) return;
  const v = s.viewer; v.cancelTransition();
  if (v.camera === v.ortho) { v.camera.zoom = Math.max(0.25, Math.min(120, v.camera.zoom * scale)); v.camera.updateProjectionMatrix(); }
  else v.camera.position.sub(v.controls.target).multiplyScalar(1 / scale).add(v.controls.target);
  v.controls.update(); v.requestRender();
}
EQ.qc = { prepare, render,
  selectionArea(eq, sel) {
    const area = EQ.route.query.area;
    if (!area || !manifest) return '';
    const ps = EQ.positionsOf(eq.id).filter(p => sel.part ? p.id === sel.part : sel.sub ? p.subId === sel.sub : sel.main ? p.mainId === sel.main : false);
    return ps.some(p => descendants(manifest.nodes.find(n => n.key === p.key), 'container.' + area)) ? area : '';
  },
  containerName(key) { return manifest?.nodes.find(n => n.key === 'container.' + key)?.label; },
  containerPositions(eq, key) { return manifest && EQ.positionsOf(eq.id).filter(p => p.state === 'active' && descendants(manifest.nodes.find(n => n.key === p.key), 'container.' + key)); },
  afterRender() { if (session && !session.host.isConnected) dispose(); },
  // Local prototype test access; no data or identity is kept by the viewer core.
  get session() { return session; }, get manifest() { return manifest; } };
EQ.rerender();
