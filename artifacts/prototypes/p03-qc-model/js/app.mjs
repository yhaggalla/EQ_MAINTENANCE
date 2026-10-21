// P03 QC model prototype page: one selection state (URL) shared by tree, breadcrumb, scene picking and panel.
// Synthetic data only (see data.mjs). The viewer core (viewer.mjs) never sees database IDs; it works in node keys.
import { QcViewer, webglAvailable } from './viewer.mjs';
import { EQUIPMENT, instantiate, jobsFor } from './data.mjs';

const MODEL_BASE = 'models/cict-j526a-sts-scene/1/';
const $ = (s) => document.querySelector(s);
const el = (tag, attrs, ...kids) => {
  attrs = attrs || {};
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'class') e.className = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : String(k));
  return e;
};
const Q = new URLSearchParams(location.search);
const SIM = Q.get('viewer'); // nowebgl | contextlost | loadfail (prototype fallback simulation)

const state = { eq: 'eq-qc-demo-01', main: null, sub: null, part: null, container: null, mode: 'overall', iso: false, view: '' };
let manifest, catalog, params, viewer = null, viewerState = 'loading', inst = new Map(), expanded = new Set(), loadMs = null;
let lastFocusKey = null;
const PARAMS_BY_MAIN = {
  equipment: ['rail-gauge', 'outreach', 'backreach', 'lift-height-above-rail', 'total-lift-height', 'swl-under-spreader', 'swl-under-cargo-beam'],
  '01': ['main-hoist-motor-power', 'hoist-speed-65t', 'hoist-speed-50t', 'hoist-speed-empty', 'lift-height-above-rail', 'total-lift-height'],
  '02': ['trolley-motor-power', 'trolley-speed'], '03': ['boom-hoist-motor-power', 'boom-hoisting-time'],
  '04': ['gantry-motor-power', 'gantry-speed', 'rail-gauge', 'rail-type'], '12': ['supply-voltage', 'supply-frequency'],
};
const CONFLICTS = { 'trolley-motor-power': 'Source conflict U-02: 275 kW (J526A00) vs 270 kW (J526A04). No value chosen.', 'gantry-speed': 'Source conflict U-01: 46 m/min (J526A00) vs 45.5 m/min (J526A0600). No value chosen.' };

function readURL() {
  const q = new URLSearchParams(location.search);
  const ok = (v) => (v && /^[A-Za-z0-9_-]+$/.test(v) ? v : null); // D-20 deep-link character rule
  state.eq = ok(q.get('eq')) && EQUIPMENT.some((e) => e.id === q.get('eq')) ? q.get('eq') : 'eq-qc-demo-01';
  state.main = ok(q.get('main')); state.sub = ok(q.get('sub')); state.part = ok(q.get('part')); state.container = ok(q.get('container'));
  state.mode = q.get('mode') === 'technical' ? 'technical' : 'overall';
  state.iso = q.get('iso') === '1' && state.mode === 'technical';
  state.view = ['side', 'end-ws', 'end-ls', 'top'].includes(q.get('view')) ? q.get('view') : '';
}
function writeURL(push = true) {
  const q = new URLSearchParams();
  if (SIM) q.set('viewer', SIM);
  q.set('eq', state.eq);
  for (const k of ['main', 'sub', 'part', 'container']) if (state[k]) q.set(k, state[k]);
  if (state.mode !== 'overall') q.set('mode', state.mode);
  if (state.iso) q.set('iso', '1');
  if (state.view) q.set('view', state.view);
  const url = location.pathname + '?' + q.toString();
  if (url !== location.pathname + location.search) (push ? history.pushState : history.replaceState).call(history, null, '', url);
}

const eqObj = () => EQUIPMENT.find((e) => e.id === state.eq);
const I = () => { if (!inst.has(state.eq)) inst.set(state.eq, instantiate(eqObj(), manifest, catalog)); return inst.get(state.eq); };
const nodeOf = (k) => manifest.nodes.find((n) => n.key === k);
const qualOf = (n) => (n?.provenance.kind === 'approximate-location' ? 'Approx.' : n?.provenance.kind === 'estimated' ? 'Est.' : null);

/** Node keys represented by the current selection (union for main/sub). */
function selectionKeys() {
  const ii = I();
  if (state.container) return { keys: [], container: 'container.' + state.container };
  if (state.part) { const p = ii.positions.find((x) => x.id === state.part); return { keys: p && ii.binding.has(p.semanticKey) ? [p.semanticKey] : [] }; }
  const pick = (pred) => manifest.nodes.filter((n) => (n.kind === 'position' || n.kind === 'hotspot') && pred(n) && ii.binding.has(n.key)).map((n) => n.key);
  if (state.sub) { const s = ii.subs.find((x) => x.id === state.sub); return { keys: s ? pick((n) => n.classification.sub === s.code) : [] }; }
  if (state.main) { const m = ii.mains.find((x) => x.id === state.main); return { keys: m ? pick((n) => n.classification.main === m.code) : [] }; }
  return { keys: [] };
}

function select(next, { push = true, focus = true } = {}) {
  Object.assign(state, { main: null, sub: null, part: null, container: null }, next);
  // ancestors always follow the deepest selection
  const ii = I();
  if (state.part) { const p = ii.positions.find((x) => x.id === state.part); if (p) { state.sub = p.subId; state.main = p.mainId; } }
  if (state.sub && !state.main) state.main = ii.subs.find((x) => x.id === state.sub)?.mainId || null;
  if (state.main) expanded.add(state.main); if (state.sub) expanded.add(state.sub);
  writeURL(push);
  render({ focus });
}

function render({ focus = true } = {}) {
  renderEquipment(); renderCrumbs(); renderTree(); renderContainers(); renderInfo(); renderToolbar();
  if (viewer && viewerState === 'ready') {
    if (viewer.mode !== state.mode) viewer.setMode(state.mode);
    const iso = state.iso ? 'container.machinery-house' : null;
    if (viewer.isolate !== iso) { viewer.isolate = iso; viewer.setMode(state.mode); }
    if (appliedView !== state.view) applyView(); // only when the aligned view changes, so a fit is not undone
    const { keys, container } = selectionKeys();
    const focusKey = JSON.stringify([state.eq, keys, container, state.iso]);
    const doFocus = focus && focusKey !== lastFocusKey;
    lastFocusKey = focusKey;
    viewer.setSelection(keys, { container, focus: doFocus });
    if (doFocus && !keys.length && !container) { if (state.iso) viewer.fitKeys(['container.machinery-house']); else resetCurrentView(); }
    if (doFocus && (keys.length || container) && !viewer.boundsOf(container ? [container] : keys)) hint('This selection has no visible representation in this mode; camera unchanged.');
    viewer.setLabelCandidates(labelCandidates());
  }
}

let appliedView = null;
function applyView() {
  appliedView = state.view;
  if (!state.view) { if (viewer.camera !== viewer.persp) viewer.useOrtho(null); $('#orient').textContent = 'Perspective. Drag to orbit, right-drag to pan, wheel to zoom. +X = waterside (boom side).'; return; }
  const host = $('#viewport'); const aspect = host.clientWidth / Math.max(1, host.clientHeight);
  const fr = (w0, h0, cx, cy) => { let w = w0, h = w0 / aspect; if (h < h0) { h = h0; w = h0 * aspect; } return { w, h, cx, cy }; };
  const F = { side: fr(146, 92, 7.5, 41.5), 'end-ws': fr(40, 92, 0, 41.5), 'end-ls': fr(40, 92, 0, 41.5), top: fr(146, 36, 7.5, 0) }[state.view];
  viewer.useOrtho(state.view, F);
  $('#orient').textContent = { side: 'Side elevation (orthographic): landside left, waterside right; rail level = 0 m', 'end-ws': 'End view from the water (orthographic): +Z (side A) on the left', 'end-ls': 'End view from landside (orthographic): +Z (side A) on the right', top: 'Plan (orthographic): waterside right, +Z (side A) down' }[state.view] + '. Right-drag to pan, wheel to zoom.';
}
/** Reset the camera of the current view: the full aligned frame in an aligned view, the full-crane view otherwise. */
function resetCurrentView() { if (state.view) applyView(); else viewer.resetView(); }

// ---------- drill-down labels (U1-C07): tier 1 mains -> tier 2 subs -> tier 3 parts, same state as the tree ----------
const lab = (n) => n.label.replace(/ \((location|count).*\)$/i, '');
const boundKeysWhere = (pred) => manifest.nodes.filter((n) => (n.kind === 'position' || n.kind === 'hotspot') && pred(n) && I().binding.has(n.key)).map((n) => n.key);
function labelCandidates() {
  const ii = I(); const out = []; const work = openWorkByKey();
  const workOf = (keys) => keys.reduce((a, k) => a + (work.get(k) || 0), 0) || undefined;
  const partLabel = (n, extra) => ({ id: n.key, keys: [n.key], text: lab(n), badge: n.kind === 'hotspot' ? 'Approx.' : qualOf(n), work: work.get(n.key), allowHidden: true, tier: 3, next: n.kind === 'hotspot' ? { hotspot: n.key } : { part: ii.binding.get(n.key)?.positionId }, ...extra });
  if (state.container) {
    const ck = 'container.' + state.container;
    for (const n of manifest.nodes) if ((n.kind === 'position' || n.kind === 'hotspot') && isDesc(n, ck) && ii.binding.has(n.key)) out.push(partLabel(n, { priority: 40, allowHidden: false }));
  } else if (state.part) {
    const p = ii.positions.find((x) => x.id === state.part); const s = p && ii.subs.find((x) => x.id === p.subId);
    for (const n of manifest.nodes) if (s && (n.kind === 'position' || n.kind === 'hotspot') && n.classification.sub === s.code && ii.binding.has(n.key)) {
      out.push(partLabel(n, n.key === p.semanticKey ? { priority: 100, selected: true } : { priority: 40 }));
    }
  } else if (state.sub) {
    const s = ii.subs.find((x) => x.id === state.sub);
    for (const n of manifest.nodes) if (s && (n.kind === 'position' || n.kind === 'hotspot') && n.classification.sub === s.code && ii.binding.has(n.key)) out.push(partLabel(n, { priority: 60 }));
  } else if (state.main) {
    const m = ii.mains.find((x) => x.id === state.main);
    for (const s of ii.subs.filter((x) => x.mainId === state.main)) {
      const keys = boundKeysWhere((n) => n.classification.sub === s.code); if (!keys.length) continue;
      out.push({ id: s.id, keys, text: `${s.code} ${s.name}`, work: workOf(keys), allowHidden: true, tier: 2, priority: 60, next: { sub: s.id }, hint: `${s.code} ${s.name}: ${keys.length} position(s) / marker(s). Click to show its parts.` });
    }
    if (m && !state.iso) { const keys = boundKeysWhere((n) => n.classification.main === m.code); if (keys.length) out.push({ id: m.id + '-head', keys, text: `${m.code} ${m.name}`, selected: true, tier: 1, priority: 30, allowHidden: true, next: { main: m.id } }); }
  } else {
    for (const m of ii.mains) {
      const keys = boundKeysWhere((n) => n.classification.main === m.code); if (!keys.length) continue;
      out.push({ id: m.id, keys, text: `${m.code} ${m.name}`, work: workOf(keys), allowHidden: true, tier: 1, priority: 50, next: { main: m.id }, hint: `${m.code} ${m.name}: click to show its submechanisms.` });
    }
  }
  return out;
}
function onLabel(c) {
  if (!c.next) return;
  const hiddenHere = state.mode === 'overall' && c.keys.length && c.keys.every((k) => !nodeOf(k).modes.includes('overall'));
  if (hiddenHere) state.mode = 'technical';
  if (c.next.hotspot) {
    if (hiddenHere) { writeURL(); render({ focus: false }); }
    viewer.fitKeys([c.next.hotspot]); hint(lab(nodeOf(c.next.hotspot)) + ': location marker (approximate) of the selected submechanism.'); return;
  }
  select(c.next);
  if (hiddenHere) hint('Switched to Technical mode: ' + c.text + ' is inside the structure or enclosure.');
}

function openWorkByKey() {
  const m = new Map(); const ii = I();
  for (const j of jobsFor(eqObj(), ii)) if (j.status !== 'Completed') { const p = ii.positions.find((x) => x.id === j.positionId); if (p) m.set(p.semanticKey, (m.get(p.semanticKey) || 0) + 1); }
  return m;
}

// ---------- equipment header, breadcrumb ----------
function renderEquipment() {
  const e = eqObj();
  $('#status-badge').replaceChildren(el('span', null, e.code + ' '), el('span', { class: 'st ' + e.status }, (e.status === 'readyForOps' ? '✔ ' : '⚠ ') + e.statusText), el('span', { class: 'synthetic', style: 'margin-left:6px' }, 'synthetic'));
}
function renderCrumbs() {
  const ii = I(); const e = eqObj(); const items = [];
  const link = (text, next) => el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); select(next); } }, text);
  items.push(el('li', null, link(e.code, {})));
  if (state.container) items.push(el('li', null, nodeOf('container.' + state.container)?.label + ' (spatial group)'));
  const m = ii.mains.find((x) => x.id === state.main); const s = ii.subs.find((x) => x.id === state.sub); const p = ii.positions.find((x) => x.id === state.part);
  if (m) items.push(el('li', null, s || p ? link(`${m.code} ${m.name}`, { main: m.id }) : `${m.code} ${m.name}`));
  if (s) items.push(el('li', null, p ? link(`${s.code} ${s.name}`, { sub: s.id }) : `${s.code} ${s.name}`));
  if (p) items.push(el('li', { 'aria-current': 'page' }, p.name));
  $('#crumbs').replaceChildren(...items);
}

// ---------- tree (ARIA tree with roving tabindex) ----------
function renderTree() {
  const ii = I(); const e = eqObj(); const work = openWorkByKey();
  const rows = [];
  const subWork = (code) => [...work].filter(([k]) => nodeOf(k).classification?.sub === code).reduce((a, [, c]) => a + c, 0);
  rows.push({ level: 1, id: 'eq', text: e.code, sel: !state.main && !state.container, next: {}, hasKids: true, open: true });
  for (const m of ii.mains) {
    const open = expanded.has(m.id);
    const mw = [...work].filter(([k]) => nodeOf(k).classification?.main === m.code).reduce((a, [, c]) => a + c, 0);
    rows.push({ level: 2, id: m.id, code: m.code, text: m.name, sel: state.main === m.id && !state.sub, next: { main: m.id }, hasKids: true, open, work: mw });
    if (!open) continue;
    for (const s of ii.subs.filter((x) => x.mainId === m.id)) {
      const sopen = expanded.has(s.id);
      const nPos = ii.positions.filter((p) => p.subId === s.id).length;
      rows.push({ level: 3, id: s.id, code: s.code, text: s.name, sel: state.sub === s.id && !state.part, next: { sub: s.id }, hasKids: true, open: sopen, cnt: nPos, work: subWork(s.code) });
      if (!sopen) continue;
      for (const p of ii.positions.filter((x) => x.subId === s.id)) {
        const n = nodeOf(p.semanticKey);
        rows.push({ level: 4, id: p.id, text: p.name, sel: state.part === p.id, next: { part: p.id }, q: qualOf(n), work: work.get(p.semanticKey) });
      }
      for (const h of manifest.nodes.filter((x) => x.kind === 'hotspot' && x.classification.sub === s.code)) rows.push({ level: 4, id: 'h-' + h.key, text: 'Location marker: ' + h.label.replace(/ \(.*\)$/, ''), sel: false, next: { sub: s.id }, q: 'Approx.' });
    }
  }
  const tree = $('#tree');
  const activeId = rows.find((r) => r.sel)?.id || 'eq';
  tree.replaceChildren(...rows.map((r, i) => {
    const item = el('div', { class: 'ti', role: 'treeitem', 'aria-level': r.level, 'aria-selected': r.sel ? 'true' : 'false', 'aria-expanded': r.hasKids ? String(!!r.open) : null, tabindex: r.id === activeId ? '0' : '-1', 'data-id': r.id, 'data-i': i, style: `padding-left:${(r.level - 1) * 14 + 4}px` },
      el('span', { class: 'tw', 'aria-hidden': 'true' }, r.hasKids ? (r.open ? '▾' : '▸') : ''),
      r.code ? el('span', { class: 'code' }, r.code) : null, el('span', null, r.text),
      r.cnt !== undefined ? el('span', { class: 'cnt' }, r.cnt + ' pos.') : null,
      r.q ? el('span', { class: 'q', title: r.q === 'Approx.' ? 'Location approximate / simplified representation' : 'Estimated geometry' }, r.q) : null,
      r.work ? el('span', { class: 'wk', title: r.work + ' open job(s), synthetic' }, r.work) : null);
    item.addEventListener('click', (ev) => { if (ev.target.classList.contains('tw') && r.hasKids && r.level > 1) { toggle(r.id); return; } select(r.next); });
    item.addEventListener('keydown', (ev) => treeKey(ev, rows, i));
    return item;
  }));
}
function toggle(id) { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); renderTree(); focusTree(id); }
function focusTree(id) { const t = document.querySelector(`#tree [data-id="${id}"]`); if (t) { document.querySelectorAll('#tree .ti').forEach((x) => x.setAttribute('tabindex', '-1')); t.setAttribute('tabindex', '0'); t.focus(); } }
function treeKey(ev, rows, i) {
  const r = rows[i]; const go = (j) => { if (rows[j]) { ev.preventDefault(); focusTree(rows[j].id); } };
  if (ev.key === 'ArrowDown') go(i + 1); else if (ev.key === 'ArrowUp') go(i - 1); else if (ev.key === 'Home') go(0); else if (ev.key === 'End') go(rows.length - 1);
  else if (ev.key === 'ArrowRight' && r.hasKids && r.level > 1) { ev.preventDefault(); if (!r.open) toggle(r.id); else go(i + 1); }
  else if (ev.key === 'ArrowLeft') { ev.preventDefault(); if (r.open && r.level > 1) toggle(r.id); else { for (let j = i - 1; j >= 0; j--) if (rows[j].level < r.level) { focusTree(rows[j].id); break; } } }
  else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(r.next); focusTree(r.id); }
}

function renderContainers() {
  const list = manifest.nodes.filter((n) => n.kind === 'container');
  $('#containers').replaceChildren(...list.map((n) => {
    const id = n.key.replace('container.', '');
    return el('button', { type: 'button', 'aria-pressed': state.container === id ? 'true' : 'false', onclick: () => select({ container: id }) }, n.label);
  }));
}

function renderToolbar() {
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === state.mode)));
  // U1-C05: always enabled; in Overall mode it switches to Technical first (it used to be disabled there, which read as broken)
  const iso = $('#btn-iso'); iso.setAttribute('aria-pressed', String(state.iso)); iso.title = state.mode === 'technical' ? 'Show only the machinery house and its equipment' : 'Switches to Technical mode and shows only the machinery house';
  $('#view-select').value = state.view;
}

// ---------- right panel ----------
function renderInfo() {
  const ii = I(); const e = eqObj(); const box = $('#info'); const parts = [];
  const dl = (...pairs) => el('dl', null, ...pairs.flatMap(([k, v]) => (v === null || v === undefined ? [] : [el('dt', null, k), el('dd', null, v)])));
  const code = (t) => el('code', null, t);
  const jobs = jobsFor(e, ii);
  const histFor = (pred, label) => {
    const list = jobs.filter(pred).sort((a, b) => b.date.localeCompare(a.date));
    return [el('h3', null, label, ' ', el('span', { class: 'synthetic' }, 'synthetic history')),
      list.length ? el('ul', { class: 'hist' }, ...list.map((j) => el('li', { class: j.status === 'Completed' ? '' : 'open' }, el('strong', null, j.id), ` ${j.kind}, ${j.status}, ${j.date}`, el('br'), j.title, ' ', el('span', { class: 'empty' }, '(' + (ii.positions.find((p) => p.id === j.positionId)?.name || 'equipment') + ')')))) : el('p', { class: 'empty' }, 'No work recorded. This does not mean the component is original or healthy.')];
  };
  const paramBlock = (key) => {
    if (state.mode !== 'technical' || !params) return [];
    const codes = PARAMS_BY_MAIN[key] || []; if (!codes.length) return [];
    const rows = codes.map((c) => params.find((p) => p.code === c)).filter(Boolean);
    return [el('h3', null, 'Source-linked parameters'), el('ul', { class: 'hist' }, ...rows.map((p) => el('li', null, `${p.label}: `, el('strong', null, CONFLICTS[p.code] ? 'conflict' : `${p.value}${p.unit ? ' ' + p.unit : ''}`), p.condition ? ` (${p.condition})` : '', el('br'), el('span', { class: 'empty' }, CONFLICTS[p.code] || `${p.source.drawingNumber} p${p.source.pdfPage}, ${p.verification.replace(/_/g, ' ')}`))))];
  };
  if (state.container) {
    const ck = 'container.' + state.container; const n = nodeOf(ck);
    const inside = manifest.nodes.filter((x) => (x.kind === 'position' || x.kind === 'hotspot') && isDesc(x, ck));
    const byMain = new Map(); for (const x of inside) { const m = x.classification.main; if (!byMain.has(m)) byMain.set(m, []); byMain.get(m).push(x); }
    parts.push(el('p', null, el('strong', null, n.label), ' is a spatial group, not a mechanism. Selecting it assigns no maintenance identity to its contents.'));
    parts.push(el('p', null, `${inside.length} positions / location markers inside, grouped by main mechanism:`));
    for (const [m, list] of [...byMain].sort()) {
      parts.push(el('h3', null, `${m} ${catalog.main.get(m)?.name || ''}`));
      parts.push(el('ul', { class: 'poslist' }, ...list.map((x) => el('li', null, el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); goNode(x.key); } }, x.label)))));
    }
    if (n.enclosure) parts.push(el('p', { class: 'qual' }, 'Enclosure: shown transparent and not pickable in Technical mode, so internal positions can be selected through it.'));
  } else if (state.part) {
    const p = ii.positions.find((x) => x.id === state.part); const n = p && nodeOf(p.semanticKey);
    if (!p) parts.push(el('p', { class: 'empty' }, 'This position does not exist on ' + e.code + '.'));
    else {
      const s = ii.subs.find((x) => x.id === p.subId); const m = ii.mains.find((x) => x.id === p.mainId); const b = ii.binding.get(p.semanticKey);
      parts.push(el('h3', null, p.name));
      if (n.qualifier) parts.push(el('p', { class: 'qual' }, n.qualifier + '.', n.classificationNote ? el('br') : null, n.classificationNote || ''));
      parts.push(dl(['Equipment', e.code], ['Main', `${m.code} ${m.name}`], ['Sub', `${s.code} ${s.name}`], ['Position ID', code(p.id)], ['Semantic key', code(p.semanticKey)], ['Binding', b ? `exact key (${b.mode})` : 'not bound: no visual representation'], ['Position kind', p.kind + (p.uom ? ` (${p.uom})` : '')], ['Installed item', 'Unknown (no installation recorded; nothing is assumed)'], ['Geometry', n.provenance.kind + (n.instancing ? `; instanced (${n.instancing.gltfNodeName} #${n.instancing.index} resolved via instanceMaps)` : '')]));
      parts.push(el('h3', null, 'Sources'), el('ul', { class: 'hist' }, ...n.provenance.sources.map((x) => el('li', null, `${x.drawing}${x.pdfPage ? ' p' + x.pdfPage : ''}: ${x.note}`))));
      parts.push(...histFor((j) => j.positionId === p.id, 'Exact-position history'));
    }
  } else if (state.sub) {
    const s = ii.subs.find((x) => x.id === state.sub);
    const pos = ii.positions.filter((x) => x.subId === state.sub); const hs = manifest.nodes.filter((x) => x.kind === 'hotspot' && x.classification.sub === s?.code);
    parts.push(el('h3', null, `${s.code} ${s.name}`), dl(['Sub instance', code(s.id)], ['Positions', String(pos.length)], ['Location markers', String(hs.length)]));
    if (hs.length) parts.push(el('p', { class: 'qual' }, 'Location markers are approximate and represent the submechanism, not an exact component: ', hs.map((h) => h.label).join('; ')));
    parts.push(el('ul', { class: 'poslist' }, ...pos.map((x) => el('li', null, el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); select({ part: x.id }); } }, x.name)))));
    parts.push(...paramBlock(s.mainCode));
    parts.push(...histFor((j) => j.subId === s.id, 'Submechanism history (direct and descendant)'));
  } else if (state.main) {
    const m = ii.mains.find((x) => x.id === state.main);
    parts.push(el('h3', null, `${m.code} ${m.name}`), dl(['Main instance', code(m.id)], ['Submechanisms', ii.subs.filter((x) => x.mainId === m.id).map((x) => `${x.code} ${x.name}`).join(', ')], ['Positions', String(ii.positions.filter((x) => x.mainId === m.id).length)]));
    parts.push(...paramBlock(m.code));
    parts.push(...histFor((j) => j.mainId === m.id, 'Main mechanism history (direct and descendant)'));
  } else {
    parts.push(el('h3', null, `${e.code} ${e.name}`), dl(['Status', `${e.statusText}${e.statusReason ? ' - ' + e.statusReason : ''} (synthetic)`], ['Model template', 'CICT-J526A-STS v1 (draft; association is synthetic, not a fleet fact)'], ['Overall height', `${manifest.landmarks.overallHeight.toFixed(3)} m to apex head (J526A00 marker 83356); 63 m is total lift, not height`], ['Positions', `${ii.positions.length} positions, ${manifest.nodes.filter((x) => x.kind === 'hotspot').length} location markers`]));
    parts.push(...paramBlock('equipment'));
    parts.push(...histFor(() => true, 'Equipment history (all levels)'));
  }
  box.replaceChildren(...parts);
}
function isDesc(n, ck) { let p = n; while (p?.parentKey) { if (p.parentKey === ck) return true; p = nodeOf(p.parentKey); } return false; }

/** Navigate from a node key (scene pick or container list) through the equipment binding. */
function goNode(key) {
  const ii = I(); const n = nodeOf(key); const b = ii.binding.get(key);
  if (!n || n.kind === 'decorative') { hint('Not a maintenance position (context geometry).'); return; }
  if (n.kind === 'container') { select({ container: key.replace('container.', '') }); return; }
  if (!b) { hint('This node is not bound to a position of ' + eqObj().code + '.'); return; }
  if (b.positionId) select({ part: b.positionId }); else if (b.subInstanceId) select({ sub: b.subInstanceId });
}

let hintT = 0;
function hint(text) { const h = $('#hint'); h.textContent = text; h.classList.add('show'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('show'), 2600); }

function showFallback(reason) {
  viewerState = 'fallback'; window.__qcFallback = reason;
  const f = $('#fallback'); f.hidden = false;
  f.replaceChildren(el('h3', null, '3D view unavailable'), el('p', null, reason), el('p', null, 'The mechanism tree, breadcrumb, selection details and history remain fully usable. Use the tree on the left, or the list below.'),
    el('ul', { class: 'poslist' }, ...I().positions.slice(0, 60).map((p) => el('li', null, el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); select({ part: p.id }); } }, p.name)))));
  document.querySelectorAll('.toolbar button, .toolbar select').forEach((b) => { if (!b.dataset.mode) b.disabled = true; });
}

async function initViewer() {
  if (SIM === 'nowebgl' || !webglAvailable()) { showFallback(SIM === 'nowebgl' ? 'WebGL is disabled (simulated with ?viewer=nowebgl).' : 'This browser or device cannot create a WebGL context.'); return; }
  const t0 = performance.now();
  viewer = new QcViewer($('#viewport'), {
    onPick: (hit) => goNode(hit.key),
    onLabel: (c) => onLabel(c),
    onBackground: () => hint('Background: selection kept. Use Reset view or the tree to change it.'),
    onContextLost: () => showFallback('The graphics context was lost. Reload the page to retry the 3D view.'),
    onFrame: (info) => { $('#perf').textContent = `Draw calls ${info.calls} | triangles ${info.triangles.toLocaleString()} | geometries ${info.geometries} | frames ${viewer.frames} | model load ${loadMs ?? '-'} ms | asset ${(manifest.asset.bytes / 1024).toFixed(0)} KiB, sha256 ${viewer.checksumVerified ? 'verified' : 'not verifiable here'}`; },
  });
  window.__qc.viewer = viewer;
  try {
    await viewer.load(SIM === 'loadfail' ? MODEL_BASE + 'missing.glb' : MODEL_BASE + 'scene.glb', manifest);
    loadMs = Math.round(performance.now() - t0);
    viewerState = 'ready';
    window.__qcTiming = { modelLoadMs: loadMs, readySinceNavigationMs: Math.round(performance.now()) };
    if (viewer.missing.length) hint(viewer.missing.length + ' manifest nodes missing from the asset (reported, not guessed).');
    lastFocusKey = null; render();
    if (SIM === 'contextlost') setTimeout(() => viewer.renderer.getContext().getExtension('WEBGL_lose_context')?.loseContext(), 400);
  } catch (err) {
    showFallback('The model could not be loaded (' + (err.code || err.message) + ').');
  }
}

async function main() {
  readURL();
  window.__qc = { viewer: null, state, select, binding: () => I().binding, positions: () => I().positions }; // test hook (prototype only)
  const [m, cat, par] = await Promise.all([fetch(MODEL_BASE + 'manifest.json').then((r) => r.json()), fetch('ref/mechanisms-approved.json').then((r) => r.json()), fetch('ref/major-parameters.json').then((r) => r.json()).catch(() => null)]);
  manifest = m; params = par?.parameters || null; window.__qc.manifest = m;
  catalog = { main: new Map(cat.mainMechanisms.map((x) => [x.code, x])), sub: new Map(cat.subMechanisms.map((x) => [x.code, x])) };
  const sel = $('#eq-select');
  sel.replaceChildren(...EQUIPMENT.map((e) => el('option', { value: e.id }, `${e.code} (synthetic)`)));
  sel.value = state.eq;
  sel.addEventListener('change', () => { state.eq = sel.value; select({}); });
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { state.mode = b.dataset.mode; if (state.mode !== 'technical') state.iso = false; writeURL(); lastFocusKey = null; render({ focus: !!(state.main || state.part || state.container) }); }));
  $('#btn-iso').addEventListener('click', () => {
    state.iso = !state.iso;
    if (state.iso && state.mode !== 'technical') { state.mode = 'technical'; hint('Technical mode switched on to show the machinery-house equipment.'); }
    writeURL(); lastFocusKey = null; render();
  });
  // Fit: the selection if there is one (in perspective or aligned views), otherwise the whole crane / the isolated house.
  $('#btn-fit').addEventListener('click', () => {
    if (!viewer || viewerState !== 'ready') return;
    const { keys, container } = selectionKeys();
    if (!(keys.length || container)) { if (state.iso) viewer.fitKeys(['container.machinery-house']); else resetCurrentView(); hint(state.iso ? 'Fitted the machinery house.' : 'Nothing selected: fitted the whole crane.'); }
    else if (!viewer.fitKeys(container ? [container] : keys)) hint('This selection has no visible representation in this mode; camera unchanged.');
  });
  // Reset: the full frame of the current view (aligned view stays aligned; perspective returns to the full-crane view).
  $('#btn-reset').addEventListener('click', () => { if (!viewer || viewerState !== 'ready') return; resetCurrentView(); });
  $('#btn-labels').addEventListener('click', (ev) => { const on = ev.currentTarget.getAttribute('aria-pressed') !== 'true'; ev.currentTarget.setAttribute('aria-pressed', String(on)); viewer?.setLabels(on); });
  $('#view-select').addEventListener('change', (ev) => {
    state.view = ev.target.value; writeURL();
    if (viewer && viewerState === 'ready') { applyView(); if (!state.view) viewer.resetView(); else { const { keys, container } = selectionKeys(); if (keys.length || container) viewer.fitKeys(container ? [container] : keys); } }
  });
  window.addEventListener('popstate', () => { readURL(); $('#eq-select').value = state.eq; lastFocusKey = null; render(); });
  // Deep link from the P02 prototype: pkey = semantic key with '.' written as '_' (D-20). Exact key only, never fuzzy.
  const pkey = new URLSearchParams(location.search).get('pkey');
  if (pkey && /^[a-z0-9_-]+$/.test(pkey)) {
    const key = pkey.replace(/_/g, '.');
    const p = I().positions.find((x) => x.semanticKey === key);
    if (p) { state.part = p.id; writeURL(false); }
    else setTimeout(() => hint(`P02 placeholder position '${key}' is not in the drawing-derived v1 template; showing its mechanism instead.`), 1500);
  }
  for (const id of [state.main, state.sub]) if (id) expanded.add(id);
  if (state.part) { const p = I().positions.find((x) => x.id === state.part); if (p) { expanded.add(p.mainId); expanded.add(p.subId); state.main = p.mainId; state.sub = p.subId; } }
  render();
  await initViewer();
}
main();
