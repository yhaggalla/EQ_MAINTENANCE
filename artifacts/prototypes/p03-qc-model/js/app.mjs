// P03 QC model prototype page: one selection state (URL) shared by tree, breadcrumb, scene picking and panel.
// Synthetic data only (see data.mjs). The viewer core (viewer.mjs) never sees database IDs; it works in node keys.
import { QcViewer, webglAvailable } from './viewer.mjs';
import { EQUIPMENT, instantiate } from './data.mjs';

// Shared synthetic V2 data layer and four-tab renderer from the P02 prototype (classic scripts loaded by index.html). P02B / U1-C19.
const EQ = window.EQ;
EQ.state.role = 'management'; // the viewer page is read-only; there is no sign-in and no persona switch here
EQ.panelTabs.base = location.protocol + '//' + location.hostname + ':5312/?role=management'; // Open in Jobs and job numbers open the P02 prototype as the same read-only Management persona (Repair-R02B finding 7)
EQ.reset();

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

const state = { eq: 'eq-qc-demo-01', main: null, sub: null, part: null, container: null, mode: 'overall', iso: false, view: '', panel: 'maintenance' };
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
  state.panel = EQ.panelTabs.KEYS.includes(q.get('panel')) ? q.get('panel') : 'maintenance';
}
function writeURL(push = true) {
  const q = new URLSearchParams();
  if (SIM) q.set('viewer', SIM);
  q.set('eq', state.eq);
  for (const k of ['main', 'sub', 'part', 'container']) if (state[k]) q.set(k, state[k]);
  if (state.mode !== 'overall') q.set('mode', state.mode);
  if (state.iso) q.set('iso', '1');
  if (state.view) q.set('view', state.view);
  if (state.panel !== 'maintenance') q.set('panel', state.panel);
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
    if (doFocus && labelFallback) hint(labelFallback + ' has nothing to label below it in this view; the labels show the level above.');
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
  // U1 round 2 (U1-C09): labels never disappear when a selection is made in the tree. The level below the selection
  // is labelled; when it has nothing to label (no bound geometry), the selection's own level is labelled with the
  // selection highlighted, and failing that the main mechanisms (tier 1). Off-screen labels are pinned to the edge.
  const ii = I();
  const partLabel = (n, extra) => ({ id: n.key, keys: [n.key], text: lab(n), badge: n.kind === 'hotspot' ? 'Approx.' : qualOf(n), work: openCount('part', n.key) || undefined, allowHidden: true, tier: 3, next: n.kind === 'hotspot' ? { hotspot: n.key } : { part: ii.binding.get(n.key)?.positionId }, ...extra });
  const tier3 = (s, selKey) => manifest.nodes.filter((n) => s && (n.kind === 'position' || n.kind === 'hotspot') && n.classification.sub === s.code && ii.binding.has(n.key)).map((n) => partLabel(n, n.key === selKey ? { priority: 100, selected: true } : { priority: selKey ? 40 : 60 }));
  const tier2 = (m, selSubId) => {
    const out = [];
    for (const s of ii.subs.filter((x) => x.mainId === m.id)) {
      const keys = boundKeysWhere((n) => n.classification.sub === s.code); if (!keys.length) continue;
      out.push({ id: s.id, keys, text: `${s.code} ${s.name}`, work: openCount('sub', s.id) || undefined, allowHidden: true, tier: 2, priority: s.id === selSubId ? 90 : 60, selected: s.id === selSubId, next: { sub: s.id }, hint: `${s.code} ${s.name}: ${keys.length} position(s) / part(s). Click to show its parts.` });
    }
    return out;
  };
  const tier1 = (selMainId) => ii.mains.map((m) => { const keys = boundKeysWhere((n) => n.classification.main === m.code); return keys.length ? { id: m.id, keys, text: `${m.code} ${m.name}`, work: openCount('main', m.id) || undefined, allowHidden: true, tier: 1, priority: m.id === selMainId ? 90 : 50, selected: m.id === selMainId, next: { main: m.id }, hint: `${m.code} ${m.name}: click to show its submechanisms.` } : null; }).filter(Boolean);
  const head = (m) => { const keys = boundKeysWhere((n) => n.classification.main === m.code); return keys.length && !state.iso ? [{ id: m.id + '-head', keys, text: `${m.code} ${m.name}`, selected: true, tier: 1, priority: 30, allowHidden: true, next: { main: m.id } }] : []; };
  labelFallback = null;
  if (state.container) {
    const ck = 'container.' + state.container; const out = [];
    for (const n of manifest.nodes) if ((n.kind === 'position' || n.kind === 'hotspot') && isDesc(n, ck) && ii.binding.has(n.key)) out.push(partLabel(n, { priority: 40, allowHidden: false }));
    return out;
  }
  const m = ii.mains.find((x) => x.id === state.main); const s = ii.subs.find((x) => x.id === state.sub);
  if (state.part) {
    const p = ii.positions.find((x) => x.id === state.part);
    const t3 = tier3(s, p?.semanticKey); if (t3.length) return t3;
  } else if (s) {
    const t3 = tier3(s, null); if (t3.length) return t3;
  } else if (m) {
    const t2 = tier2(m, null); if (t2.length) return [...t2, ...head(m)];
    labelFallback = `${m.code} ${m.name}`; return tier1(m.id);
  } else return tier1(null);
  // the selected sub or part has nothing to label: keep its main's submechanisms, else the main mechanisms
  if (m) { const t2 = tier2(m, s?.id); if (t2.length) { labelFallback = s ? `${s.code} ${s.name}` : null; return [...t2, ...head(m)]; } }
  labelFallback = (s && `${s.code} ${s.name}`) || (m && `${m.code} ${m.name}`) || null; return tier1(m?.id);
}
let labelFallback = null;
function onLabel(c) {
  if (!c.next) return;
  const hiddenHere = state.mode === 'overall' && c.keys.length && c.keys.every((k) => !nodeOf(k).modes.includes('overall'));
  if (hiddenHere) state.mode = 'technical';
  if (c.next.hotspot) {
    if (hiddenHere) { writeURL(); render({ focus: false }); }
    viewer.fitKeys([c.next.hotspot]); hint(lab(nodeOf(c.next.hotspot)) + ': representative part of the selected submechanism (location approximate).'); return;
  }
  select(c.next);
  if (hiddenHere) hint('Switched to Technical mode: ' + c.text + ' is inside the structure or enclosure.');
}

// ---------- shared P02 data layer: scope translation and open-job counts ----------
const E2 = () => EQ.eq(state.eq); // the synthetic V2 equipment record (status, ZMMS jobs, special jobs, spare-part register)
/** P03 selection -> P02 data-layer scope. Main/sub ids share the code-based pattern; a part is matched by its exact semantic key
 *  (never by name or index). Returns null when the data layer has nothing under that identity. */
function dataScopeFor(level, idOrKey) {
  const eq2 = E2(); if (!eq2) return null;
  if (level === 'equipment') return { level: 'equipment', id: null };
  if (level === 'main') return eq2.mains.some((m) => m.id === idOrKey) ? { level: 'main', id: idOrKey } : null;
  if (level === 'sub') return eq2.subs.some((x) => x.id === idOrKey) ? { level: 'sub', id: idOrKey } : null;
  const q = EQ.positionsOf(eq2.id).find((x) => x.key === idOrKey && x.state === 'active');
  return q ? { level: 'part', id: q.id } : null;
}
/** Open special jobs in a scope: the same rule as the Projects/Special tab (descendants included, de-duplicated). */
function openCount(level, idOrKey) {
  const sc = dataScopeFor(level, idOrKey);
  return sc ? EQ.openCount(state.eq, sc) : 0; // current state (API s4.16), not the Jobs-tab history (D-139)
}
function currentDataScope() {
  if (state.part) { const p = I().positions.find((x) => x.id === state.part); return { want: 'part', scope: p ? dataScopeFor('part', p.semanticKey) : null, name: p ? p.name : 'this position' }; }
  if (state.sub) return { want: 'sub', scope: dataScopeFor('sub', state.sub), name: 'this submechanism' };
  if (state.main) return { want: 'main', scope: dataScopeFor('main', state.main), name: 'this mechanism' };
  return { want: 'equipment', scope: dataScopeFor('equipment'), name: 'this equipment' };
}

// ---------- equipment header, breadcrumb ----------
function renderEquipment() {
  // status and its source come from the shared synthetic V2 data layer (Auto from the ZMMS day plan, or a Manual correction for today)
  const e = eqObj(); const q = E2(); const mode = EQ.zmms.mode(q); const key = EQ.statusKey(q.status);
  $('#status-badge').replaceChildren(el('span', null, e.code + ' '), el('span', { class: 'st ' + key }, (key === 'readyForOps' ? '✔ ' : '⚠ ') + EQ.STATUS[key].label), el('span', { class: 'src-tag', title: mode.long }, mode.label === 'Auto' ? 'Auto (ZMMS)' : 'Manual'), el('span', { class: 'synthetic', style: 'margin-left:6px' }, 'synthetic'));
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
  const ii = I(); const e = eqObj();
  const rows = [];
  rows.push({ level: 1, id: 'eq', text: e.code, sel: !state.main && !state.container, next: {}, hasKids: true, open: true });
  for (const m of ii.mains) {
    const open = expanded.has(m.id);
    const mw = openCount('main', m.id);
    rows.push({ level: 2, id: m.id, code: m.code, text: m.name, sel: state.main === m.id && !state.sub, next: { main: m.id }, hasKids: true, open, work: mw });
    if (!open) continue;
    for (const s of ii.subs.filter((x) => x.mainId === m.id)) {
      const sopen = expanded.has(s.id);
      const nPos = ii.positions.filter((p) => p.subId === s.id).length;
      rows.push({ level: 3, id: s.id, code: s.code, text: s.name, sel: state.sub === s.id && !state.part, next: { sub: s.id }, hasKids: true, open: sopen, cnt: nPos, work: openCount('sub', s.id) });
      if (!sopen) continue;
      for (const p of ii.positions.filter((x) => x.subId === s.id)) {
        const n = nodeOf(p.semanticKey);
        rows.push({ level: 4, id: p.id, text: p.name, sel: state.part === p.id, next: { part: p.id }, q: qualOf(n), work: openCount('part', p.semanticKey) });
      }
      for (const h of manifest.nodes.filter((x) => x.kind === 'hotspot' && x.classification.sub === s.code)) rows.push({ level: 4, id: 'h-' + h.key, text: 'Representative part: ' + h.label.replace(/ \(.*\)$/, ''), sel: false, next: { sub: s.id }, q: 'Approx.' });
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
    item.addEventListener('click', (ev) => { if (ev.target.closest('.tw') && r.hasKids && r.level > 1) { toggle(r.id); return; } select(r.next); });
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

// ---------- right panel: four current-state tabs (U1-C19, S07, D-122) ----------
// Maintenance (today's ZMMS daily jobs), Projects/Special (open special jobs in the selection), Technical (specification summary of the
// selected area) and Spare parts (register condition within the selection). No work history is shown here; the scoped history is in the
// EQ Jobs tab of the P02 prototype ("Open in Jobs"). Same tabs and same data as the flat view (U1-C08 parity).
const TAB_ARIA = { maintenance: 'jobs today', special: 'open', spareParts: 'overdue or due soon' };
function scopeTitle() {
  const ii = I(); const e = eqObj();
  if (state.container) return ['Spatial group', nodeOf('container.' + state.container)?.label || 'Container'];
  if (state.part) { const p = ii.positions.find((x) => x.id === state.part); return ['Part position', p ? p.name : 'Unknown position']; }
  if (state.sub) { const s = ii.subs.find((x) => x.id === state.sub); return ['Submechanism', s ? `${s.code} ${s.name}` : 'Unknown']; }
  if (state.main) { const m = ii.mains.find((x) => x.id === state.main); return ['Main mechanism', m ? `${m.code} ${m.name}` : 'Unknown']; }
  return ['Equipment', `${e.code} (whole equipment)`];
}
function renderInfo() {
  const ii = I(); const e = eqObj(); const box = $('#info');
  const [kind, title] = scopeTitle();
  $('#info-head').replaceChildren(el('p', { class: 'eyebrow' }, kind), el('h3', { 'data-fk': 'scope-title' }, title));
  const ds = currentDataScope(); const eq2 = E2();
  const scope = ds.scope || { level: 'equipment', id: null };
  const sum = EQ.panelTabs.summary(eq2, scope);
  const nOf = { maintenance: sum.maintenance, special: ds.scope ? sum.special : 0, spareParts: ds.scope ? sum.spare.overdue + sum.spare.dueSoon : 0 };
  const tabs = $('#info-tabs');
  tabs.replaceChildren(...EQ.panelTabs.TABS.map(([k, long]) => {
    const n = nOf[k];
    return el('button', { type: 'button', role: 'tab', id: 'ptab-' + k, 'aria-controls': 'info', 'aria-selected': state.panel === k ? 'true' : 'false', tabindex: state.panel === k ? '0' : '-1', 'data-tab': k, 'aria-label': long + (n ? ', ' + n + ' ' + TAB_ARIA[k] : ''),
      onclick: () => setPanel(k),
      onkeydown: (ev) => { const keys = EQ.panelTabs.KEYS; const i = keys.indexOf(k); const j = ev.key === 'ArrowRight' ? (i + 1) % 4 : ev.key === 'ArrowLeft' ? (i + 3) % 4 : ev.key === 'Home' ? 0 : ev.key === 'End' ? 3 : -1; if (j >= 0) { ev.preventDefault(); setPanel(keys[j], true); } } },
      long === 'Projects/Special' ? ['Projects/', document.createElement('wbr'), 'Special'] : long, n ? el('span', { class: 'tab-n', 'aria-hidden': 'true' }, String(n)) : null);
  }));
  box.setAttribute('aria-labelledby', 'ptab-' + state.panel);
  box.dataset.tab = state.panel; box.dataset.echo = [state.eq, state.panel, scope.level, scope.id || ''].join('|');
  if (state.container) { box.replaceChildren(...containerPanel(ii)); return; }
  const missing = (what) => el('div', { class: 'nonwork' }, el('strong', null, 'No data under this identity'), `${ds.name} has no matching ${what} in the shared prototype fixtures of ${e.code}. Nothing is inferred from a name or an index; this is not evidence that there is no work or no spare part.`);
  let body;
  if (state.panel === 'maintenance') body = EQ.panelTabs.maintenance(eq2, scope);
  else if (state.panel === 'special') body = ds.scope ? EQ.panelTabs.special(eq2, {}, scope) : missing('position');
  else if (state.panel === 'spareParts') body = ds.scope ? EQ.panelTabs.spare(eq2, {}, scope) : missing('position');
  else body = el('div', { class: 'stack' }, ...technicalParts(ii, e));
  box.replaceChildren(body);
}
function setPanel(k, focus) { state.panel = k; writeURL(false); renderInfo(); if (focus) document.querySelector(`#info-tabs [data-tab="${k}"]`)?.focus(); }

/** Spatial group (machinery house): a container, not a mechanism; it owns no history and no tab content (DATA s10.10). */
function containerPanel(ii) {
  const ck = 'container.' + state.container; const n = nodeOf(ck); const parts = [];
  const inside = manifest.nodes.filter((x) => (x.kind === 'position' || x.kind === 'hotspot') && isDesc(x, ck));
  const byMain = new Map(); for (const x of inside) { const m = x.classification.main; if (!byMain.has(m)) byMain.set(m, []); byMain.get(m).push(x); }
  parts.push(el('p', null, el('strong', null, n.label), ' is a spatial group, not a mechanism. Selecting it assigns no maintenance identity to its contents.'));
  parts.push(el('p', null, `${inside.length} positions / representative parts inside, grouped by main mechanism:`));
  for (const [m, list] of [...byMain].sort()) {
    parts.push(el('h3', null, `${m} ${catalog.main.get(m)?.name || ''}`));
    parts.push(el('ul', { class: 'poslist' }, ...list.map((x) => el('li', null, el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); goNode(x.key); } }, x.label)))));
  }
  if (n.enclosure) parts.push(el('p', { class: 'qual' }, 'Enclosure: shown transparent and not pickable in Technical mode, so internal positions can be selected through it.'));
  return parts;
}

/** Technical tab: the specification summary of the selected area (identity, model facts, provenance, source-linked parameters). */
function technicalParts(ii, e) {
  const parts = [];
  const dl = (...pairs) => el('dl', null, ...pairs.flatMap(([k, v]) => (v === null || v === undefined ? [] : [el('dt', null, k), el('dd', null, v)])));
  const code = (t) => el('code', null, t);
  const paramBlock = (key) => {
    if (!params) return [];
    const codes = PARAMS_BY_MAIN[key] || []; if (!codes.length) return [];
    const rows = codes.map((c) => params.find((p) => p.code === c)).filter(Boolean);
    return [el('h3', null, 'Source-linked parameters'), el('ul', { class: 'hist' }, ...rows.map((p) => el('li', null, `${p.label}: `, el('strong', null, CONFLICTS[p.code] ? 'conflict' : `${p.value}${p.unit ? ' ' + p.unit : ''}`), p.condition ? ` (${p.condition})` : '', el('br'), el('span', { class: 'empty' }, CONFLICTS[p.code] || `${p.source.drawingNumber} p${p.source.pdfPage}, ${p.verification.replace(/_/g, ' ')}`))))];
  };
  if (state.part) {
    const p = ii.positions.find((x) => x.id === state.part); const n = p && nodeOf(p.semanticKey);
    if (!p) parts.push(el('p', { class: 'empty' }, 'This position does not exist on ' + e.code + '.'));
    else {
      const s = ii.subs.find((x) => x.id === p.subId); const m = ii.mains.find((x) => x.id === p.mainId); const b = ii.binding.get(p.semanticKey);
      const q2 = dataScopeFor('part', p.semanticKey); const ev = q2 && EQ.state.D.events.filter((x) => x.positionId === q2.id && !x.voided).slice(-1)[0];
      parts.push(el('h3', null, p.name));
      if (n.qualifier) parts.push(el('p', { class: 'qual' }, n.qualifier + '.', n.classificationNote ? el('br') : null, n.classificationNote || ''));
      parts.push(dl(['Equipment', e.code], ['Main', `${m.code} ${m.name}`], ['Sub', `${s.code} ${s.name}`], ['Position ID', code(p.id)], ['Semantic key', code(p.semanticKey)], ['Binding', b ? `exact key (${b.mode})` : 'not bound: no visual representation'], ['Position kind', p.kind + (p.uom ? ` (${p.uom})` : '')],
        ['Installed now', ev ? ev.installed.desc + (ev.installed.serial ? ` (serial ${ev.installed.serial})` : ' (serial unknown)') : 'Unknown: nothing recorded (not evidence the item is original)']));
      parts.push(el('h3', null, 'Sources'), el('ul', { class: 'hist' }, ...n.provenance.sources.map((x) => el('li', null, `${x.drawing}${x.pdfPage ? ' p' + x.pdfPage : ''}: ${x.note}`))));
      parts.push(...paramBlock(m.code));
    }
  } else if (state.sub) {
    const s = ii.subs.find((x) => x.id === state.sub);
    const pos = ii.positions.filter((x) => x.subId === state.sub); const hs = manifest.nodes.filter((x) => x.kind === 'hotspot' && x.classification.sub === s?.code);
    parts.push(el('h3', null, `${s.code} ${s.name}`), dl(['Sub instance', code(s.id)], ['Positions', String(pos.length)], ['Representative parts', String(hs.length)]));
    if (hs.length) parts.push(el('p', { class: 'qual' }, 'Representative parts show where the submechanism is (location approximate); they are not exact components: ', hs.map((h) => h.label).join('; ')));
    parts.push(el('ul', { class: 'poslist' }, ...pos.map((x) => el('li', null, el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); select({ part: x.id }); } }, x.name)))));
    parts.push(...paramBlock(s.mainCode));
  } else if (state.main) {
    const m = ii.mains.find((x) => x.id === state.main);
    parts.push(el('h3', null, `${m.code} ${m.name}`), dl(['Main instance', code(m.id)], ['Submechanisms', ii.subs.filter((x) => x.mainId === m.id).map((x) => `${x.code} ${x.name}`).join(', ')], ['Positions', String(ii.positions.filter((x) => x.mainId === m.id).length)]));
    parts.push(...paramBlock(m.code));
  } else {
    const eq2 = E2();
    parts.push(el('h3', null, `${e.code} ${e.name}`), dl(['Model template', 'CICT-J526A-STS v1 (draft; association is synthetic, not a fleet fact)'], ['Commissioned', eq2 && eq2.commissionedOn ? EQ.fmtDate(eq2.commissionedOn) + ' (synthetic)' : 'Unknown (no prediction for Original spare parts)'], ['Overall height', `${manifest.landmarks.overallHeight.toFixed(3)} m to apex head (J526A00 marker 83356); 63 m is total lift, not height`], ['Positions', `${ii.positions.length} positions, ${manifest.nodes.filter((x) => x.kind === 'hotspot').length} representative parts (location approximate)`]));
    parts.push(...paramBlock('equipment'));
  }
  return parts;
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
  f.replaceChildren(el('h3', null, '3D view unavailable'), el('p', null, reason), el('p', null, 'The mechanism tree, breadcrumb and the four current-state tabs (Maintenance, Projects/Special, Technical, Spare parts) remain fully usable. Use the tree on the left, or the list below.'),
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
  // U1 round 2 (U1-C10/C11): Reset returns to the whole-equipment state: no selection or isolation, labels on, the tree
  // folded back to its initial state and the full view of the current view type (mode and aligned view are kept).
  $('#btn-reset').addEventListener('click', () => fullReset());
  $('#btn-labels').addEventListener('click', (ev) => { const on = ev.currentTarget.getAttribute('aria-pressed') !== 'true'; ev.currentTarget.setAttribute('aria-pressed', String(on)); viewer?.setLabels(on); });
  function fullReset() {
    Object.assign(state, { main: null, sub: null, part: null, container: null, iso: false });
    expanded.clear();
    $('#btn-labels').setAttribute('aria-pressed', 'true'); viewer?.setLabels(true);
    writeURL(); lastFocusKey = null;
    render({ focus: true }); // lastFocusKey was cleared, so render() resets the camera of the current view once
    hint('Reset: whole equipment, labels on, tree folded, full view.');
  }
  window.__qc.reset = fullReset;
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
