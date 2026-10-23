/* Equipment detail: mechanism tree (ARIA tree), shared model viewport (3D / Flat / fallbacks), breadcrumb, Overall/Technical,
   right-side current-state panel. The URL is the single selection model; tree, breadcrumb and scene all call select(). */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  EQ.views = EQ.views || {};
  const ui = (EQ.eqUI = { treeFilter: '', showWork: true, inclCancelled: false, container: null, labels: true });
  const HOUSE_KEYS = EQ.HOUSE_KEYS; // preview.js (U1 round 2 adds the drive cabinets and the emergency drive)
  const PARAM_MAIN = { '01': ['main-hoist-motor-power', 'hoist-speed-65t', 'hoist-speed-50t', 'hoist-speed-empty'], '02': ['trolley-speed', 'trolley-motor-power'], '03': ['boom-hoist-motor-power', 'boom-hoisting-time'], '04': ['gantry-speed', 'gantry-motor-power', 'rail-type'], '05': ['supply-voltage', 'supply-frequency'], '12': ['supply-voltage', 'supply-frequency'] };

  // ---- history request guard (HIS05): a response is rendered only if it still matches the current selection ----
  const hist = { seq: 0, loaded: new Set(), pending: new Map() };
  function ensureHistory(key, label) {
    if (hist.loaded.has(key)) return true;
    if (hist.pending.has(key)) return false;
    const n = ++hist.seq;
    const slow = EQ.state.slowHistory && n % 2 === 1;
    const delay = EQ.state.slowHistory ? (slow ? 2600 : 300) : 260;
    hist.pending.set(key, n);
    EQ.log('history request #' + n + ' for ' + label + (slow ? ' (slow)' : ''));
    setTimeout(() => {
      hist.pending.delete(key);
      if (EQ.eqUI.currentHistKey !== key) { EQ.log('history response #' + n + ' for ' + label + ' DISCARDED: selection moved on'); return; }
      hist.loaded.add(key); EQ.rerender();
    }, delay);
    return false;
  }

  function select(eq, sel, extra) {
    EQ.nav('/eq/equipment/' + eq.id, { ...EQ.route.query, main: sel.main || '', sub: sel.sub || '', part: sel.part || '', container: '', ...(extra || {}) });
  }

  // ---------------------------------------------------------------- tree
  function buildNodes(eq, filter) {
    const nodes = [];
    const f = filter.trim().toLowerCase();
    const match = (t) => !f || t.toLowerCase().includes(f);
    const jobs = (scope) => EQ.openCount(eq.id, scope); // current state (API s4.16), not the Jobs-tab history
    const mainsSorted = [...eq.mains].sort((a, b) => EQ.cmp(a.code, b.code));
    mainsSorted.forEach((m) => {
      const mNode = { id: m.id, kind: 'main', level: 2, code: m.code, label: EQ.defLabel(m.code), sel: { main: m.id }, jobs: jobs({ level: 'main', id: m.id }), children: [] };
      eq.subs.filter((s) => s.mainId === m.id).sort((a, b) => EQ.cmp(a.code, b.code)).forEach((s) => {
        const sNode = { id: s.id, kind: 'sub', level: 3, code: s.code, label: EQ.defLabel(s.code), sel: { main: m.id, sub: s.id }, jobs: jobs({ level: 'sub', id: s.id }), children: [] };
        EQ.positionsOf(eq.id).filter((p) => p.subId === s.id && p.state !== 'deactivated').forEach((p) => {
          sNode.children.push({ id: p.id, kind: 'part', level: 4, code: '', label: p.name, draft: p.state === 'draft', sel: { main: m.id, sub: s.id, part: p.id }, jobs: jobs({ level: 'part', id: p.id }), children: [] });
        });
        mNode.children.push(sNode);
      });
      nodes.push(mNode);
    });
    if (!f) return nodes;
    const prune = (n) => { n.children = n.children.map(prune).filter(Boolean); return match(n.code + ' ' + n.label) || n.children.length ? n : null; };
    return nodes.map(prune).filter(Boolean);
  }

  function treeView(eq, sel) {
    const nodes = buildNodes(eq, ui.treeFilter);
    const exp = EQ.state.expanded;
    const selId = sel.part || sel.sub || sel.main || 'root';
    // expand ancestors of the selection only when the selection changes (U1 round 2, U1-C11): the P02/U1 code re-expanded
    // them on every render, so the fold icon of a selected mechanism could never collapse it
    const selSig = eq.id + '|' + (sel.main || '') + '|' + (sel.sub || '') + '|' + (sel.part || '');
    if (ui.treeSelSig !== selSig) {
      ui.treeSelSig = selSig;
      if (sel.main) exp.add(eq.id + ':' + sel.main);
      if (sel.sub) exp.add(eq.id + ':' + sel.sub);
    }
    const isOpen = (n) => ui.treeFilter ? true : exp.has(eq.id + ':' + n.id);
    const flat = [{ id: 'root', root: true, level: 1, children: [] }];
    const walk = (list) => list.forEach((n) => { flat.push(n); if (n.children.length && isOpen(n)) walk(n.children); });
    walk(nodes);
    let focusId = EQ.eqUI.treeFocus && flat.some((n) => n.id === EQ.eqUI.treeFocus) ? EQ.eqUI.treeFocus : selId;
    if (!flat.some((n) => n.id === focusId)) focusId = 'root';

    const li = (n) => {
      const open = n.children.length ? isOpen(n) : null;
      const row = h('div', { class: 'ti',
        onClick: (e) => { EQ.eqUI.treeFocus = n.id; if (e.target.closest('.twist') && n.children.length) { toggle(n); return; } if (n.children.length && n.kind === 'main') exp.add(eq.id + ':' + n.id); select(eq, n.sel); } },
        h('span', { class: 'twist', 'aria-hidden': 'true', 'data-fk': 'tw-' + n.id, title: n.children.length ? (open ? 'Fold' : 'Unfold') : null }, n.children.length ? icon(open ? 'chevron-d' : 'chevron-r') : null),
        n.code ? h('span', { class: 'code' }, n.code) : null,
        h('span', { class: 'grow' }, n.label, n.draft ? h('span', { class: 'tag dashed', style: 'margin-left:.3rem' }, 'draft') : null),
        n.jobs ? h('span', { class: 'jobs' }, n.jobs + ' open') : null);
      return h('li', { role: 'treeitem', tabindex: n.id === focusId ? '0' : '-1', 'aria-level': String(n.level), 'aria-selected': n.id === selId ? 'true' : 'false', 'aria-expanded': open == null ? null : String(open), 'aria-label': (n.code ? n.code + ' ' : '') + n.label + (n.jobs ? ', ' + n.jobs + ' open jobs' : '') + (n.draft ? ', draft' : ''), 'data-fk': 'ti-' + n.id, 'data-nid': n.id },
        row, n.children.length && open ? h('ul', { role: 'group' }, n.children.map(li)) : null);
    };
    function toggle(n) { const k = eq.id + ':' + n.id; if (exp.has(k)) exp.delete(k); else exp.add(k); EQ.rerender(); }
    const openWork = EQ.openCount(eq.id, { level: 'equipment', id: null });
    const rootLi = h('li', { role: 'treeitem', tabindex: focusId === 'root' ? '0' : '-1', 'aria-level': '1', 'aria-expanded': 'true', 'aria-selected': selId === 'root' ? 'true' : 'false', 'aria-label': eq.code + ', whole equipment' + (openWork ? ', ' + openWork + ' open jobs' : ''), 'data-fk': 'ti-root', 'data-nid': 'root' },
      h('div', { class: 'ti', onClick: () => { EQ.eqUI.treeFocus = 'root'; select(eq, {}); } }, h('span', { class: 'twist', 'aria-hidden': 'true' }, icon('chevron-d')), h('span', { class: 'grow' }, h('strong', null, eq.code), ' (whole equipment)'), openWork ? h('span', { class: 'jobs' }, openWork + ' open') : null),
      h('ul', { role: 'group' }, nodes.map(li)));
    return h('ul', { role: 'tree', 'aria-label': 'Mechanism tree for ' + eq.code, onKeydown: (e) => treeKey(e, eq, flat, isOpen, toggle) }, rootLi);
  }
  function treeKey(e, eq, flat, isOpen, toggle) {
    const t = e.target.closest('[role="treeitem"]'); if (!t) return;
    const i = flat.findIndex((n) => n.id === t.dataset.nid); const n = flat[i];
    const focus = (idx) => { const nn = flat[Math.max(0, Math.min(flat.length - 1, idx))]; EQ.eqUI.treeFocus = nn.id; const el = document.querySelector('[data-nid="' + nn.id + '"]'); if (el) { document.querySelectorAll('[role=treeitem][tabindex="0"]').forEach((x) => x.setAttribute('tabindex', '-1')); el.setAttribute('tabindex', '0'); el.focus(); } };
    const hasKids = n && n.children && n.children.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); focus(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focus(0); }
    else if (e.key === 'End') { e.preventDefault(); focus(flat.length - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (hasKids && !isOpen(n)) toggle(n); else if (hasKids) focus(i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (hasKids && isOpen(n)) toggle(n); else { for (let k = i - 1; k >= 0; k--) if ((flat[k].level || 1) < (n.level || 1)) { focus(k); break; } } }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); EQ.eqUI.treeFocus = n.id; select(eq, n.root ? {} : n.sel); }
  }

  // ---------------------------------------------------------------- selection helpers
  function resolveSel(eq, q) {
    const out = { main: null, sub: null, part: null, bad: null };
    if (q.part) { const p = EQ.pos(q.part); if (p && p.equipmentId === eq.id) { out.part = p.id; out.sub = p.subId; out.main = p.mainId; } else out.bad = 'part'; }
    else if (q.sub) { const s = eq.subs.find((x) => x.id === q.sub); if (s) { out.sub = s.id; out.main = s.mainId; } else out.bad = 'submechanism'; }
    else if (q.main) { const m = eq.mains.find((x) => x.id === q.main); if (m) out.main = m.id; else out.bad = 'main mechanism'; }
    return out;
  }
  function scopeOf(sel) { return sel.part ? { level: 'part', id: sel.part } : sel.sub ? { level: 'sub', id: sel.sub } : sel.main ? { level: 'main', id: sel.main } : { level: 'equipment', id: null }; }
  function crumbs(eq, sel, q) {
    const items = [{ label: 'Fleet', href: '#/eq/fleet' }, { label: eq.code, sel: {}, cur: !sel.main && !q.container }];
    if (sel.main) { const m = eq.mains.find((x) => x.id === sel.main); items.push({ label: EQ.defLabel(m.code) + ' (' + m.code + ')', sel: { main: m.id }, cur: !sel.sub }); }
    if (sel.sub) { const s = eq.subs.find((x) => x.id === sel.sub); items.push({ label: EQ.defLabel(s.code) + ' (' + s.code + ')', sel: { main: sel.main, sub: s.id }, cur: !sel.part }); }
    if (sel.part) { const p = EQ.pos(sel.part); items.push({ label: p.name, cur: true }); }
    if (q.container) items.push({ label: EQ.qc?.containerName(q.container) || 'Spatial group', cur: true });
    return h('nav', { 'aria-label': 'Breadcrumb' }, h('ol', { class: 'breadcrumb' }, items.map((c) => h('li', null, c.cur ? h('span', { 'aria-current': 'page' }, c.label) : c.href ? h('a', { href: c.href }, c.label) : h('a', { href: '#', onClick: (e) => { e.preventDefault(); select(eq, c.sel); } }, c.label)))));
  }

  // The shared model adapter owns both camera views and scene labels.
  function viewport(eq, sel, q, mode) {
    const S = EQ.state;
    const vp = h('section', { class: 'panel viewport', 'aria-label': 'Model area' });
    const msg = (ic, title, text, actions) => h('div', { class: 'vp-msg', role: 'status' }, h('div', null, icon(ic, 'big'), h('h2', null, title), h('p', { class: 'muted', style: 'margin:0' }, text), actions || null));
    if (eq.typeCode !== 'QC') {
      vp.appendChild(msg(eq.typeCode.toLowerCase(), '3D view not available in stage 1', eq.typeCode + ' equipment has no 3D model in stage 1. Specifications, the mechanism tree, work records, replacement history and evidence are fully available. A QC model is never shown in place of an ' + eq.typeCode + '.', h('span', { class: 'tag dashed' }, 'Type icon only, not a model')));
      return vp;
    }
    if (!EQ.verified(eq)) {
      vp.appendChild(msg('cube', 'No verified model association', eq.code + ' has no verified model association, so no 3D view is offered and no model facts are assumed. The tree (if any), jobs and history stay available.', EQ.perm.admin() ? h('a', { class: 'btn', href: '#/admin/equipment' }, 'Associate a model in Admin') : h('span', { class: 'small muted' }, 'An EQ Maintenance Admin associates a verified model.')));
      return vp;
    }
    if (S.viewer === 'loading') { vp.appendChild(h('div', { class: 'vp-msg', role: 'status', 'aria-busy': 'true' }, h('div', null, h('div', { class: 'skeleton', style: 'width:100%;height:8rem' }), h('p', { class: 'muted', style: 'margin:0' }, 'Loading the model... The tree and records are already usable.')))); return vp; }
    if (S.viewer === 'nowebgl') { vp.appendChild(msg('alert', 'WebGL is not available in this browser', 'The 3D view cannot start. Everything else works: use the mechanism tree, read history and perform permitted work.')); return vp; }
    if (S.viewer === 'contextlost') { vp.appendChild(msg('alert', '3D context lost', 'The graphics context was lost. Records stay available. The viewer tries once to restore.', h('button', { type: 'button', onClick: () => { EQ.setViewer('preview'); } }, icon('refresh'), 'Restore the viewer'))); return vp; }
    if (S.viewer === 'loadfailed') { vp.appendChild(msg('wifi-off', 'The model could not be loaded', 'The model file request failed (404 or 403 in production). No path or detail is exposed. Tree and records are unaffected.', h('button', { type: 'button', onClick: () => { EQ.setViewer('preview'); } }, icon('refresh'), 'Retry'))); return vp; }

    return EQ.qc ? EQ.qc.render(eq, sel, q, mode) : h('div', { class: 'panel panel-pad', role: 'status' }, 'Loading the viewer… Use the local prototype server for the interactive model.');
  }

  /** U1 round 2 (U1-C10/C11): Reset returns to the whole-equipment state with labels: no selection, container or
   *  isolation, labels on, the tree folded back to its initial state, full view. Mode and panel tab are kept. */
  function fullReset(eq, q) {
    ui.labels = true; ui.container = null; ui.treeFilter = '';
    [...EQ.state.expanded].filter((k) => k.startsWith(eq.id + ':')).forEach((k) => EQ.state.expanded.delete(k));
    EQ.eqUI.treeFocus = 'root'; ui.treeSelSig = null; EQ.eqUI.lastSig = null; EQ.eqUI.hadSel = true;
    EQ.nav('/eq/equipment/' + eq.id, { ...q, main: '', sub: '', part: '', container: '', iso: '' });
    // The shared viewer keeps the current camera mode when resetting.
    if (!EQ.qc) EQ.resetView();
  }
  EQ.fullReset = fullReset;

  // ---------------------------------------------------------------- right panel
  const jobMini = (j, lines) => EQ.panelTabs.jobMini(j, lines); // shared with the P03 viewer panel
  function historyTab(eq, sel, scope) {
    const key = eq.id + '|' + scope.level + '|' + (scope.id || '') + '|' + ui.inclCancelled;
    const label = scope.level === 'equipment' ? eq.code : scope.level + ' ' + scope.id;
    EQ.eqUI.currentHistKey = key;
    const loaded = ensureHistory(key, label);
    const box = h('div', { class: 'stack', 'aria-live': 'polite', 'aria-busy': loaded ? 'false' : 'true', 'data-echo': key });
    if (!loaded) { box.appendChild(h('div', { class: 'stack' }, h('p', { class: 'muted small', style: 'margin:0' }, 'Loading history for ' + scopeLabel(eq, sel) + '...'), h('div', { class: 'skeleton', style: 'height:4rem' }), h('div', { class: 'skeleton', style: 'height:4rem' }))); return box; }
    const H = EQ.history(eq.id, scope, ui.inclCancelled);
    if (!H.ok) { EQ.access.refreshSession('403 ' + H.code); box.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, H.message))); return box; }
    box.appendChild(h('label', { class: 'check small' }, h('input', { type: 'checkbox', checked: ui.inclCancelled ? true : null, 'data-fk': 'inclc', onChange: (e) => { ui.inclCancelled = e.target.checked; EQ.rerender(); } }), 'Include cancelled jobs'));
    box.appendChild(h('p', { class: 'small muted', style: 'margin:0' }, scope.level === 'part' ? 'Exact-position history only.' : scope.level === 'equipment' ? 'Every job of ' + eq.code + ' (an equipment-level job appears here once).' : 'Includes work targeted here and at everything below it. A job with several lines appears once.'));
    if (scope.level === 'part') {
      const p = EQ.pos(scope.id);
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Installed now (latest known)'), H.current
        ? h('div', { class: 'tl' }, h('li', { class: '', style: 'list-style:none' }, h('dl', { class: 'kv' }, h('dt', null, 'Item'), h('dd', null, H.current.installed.desc), h('dt', null, 'Manufacturer'), h('dd', null, H.current.installed.mfr || 'Unknown'), h('dt', null, 'Part number'), h('dd', null, H.current.installed.partNo || 'Unknown'), h('dt', null, 'Serial'), h('dd', null, H.current.installed.serial || 'Unknown'), h('dt', null, 'Quantity'), h('dd', null, H.current.installed.qty + ' ' + H.current.installed.uom), h('dt', null, 'Replaced on'), h('dd', null, EQ.fmtDate(H.current.businessDate)))))
        : h('div', { class: 'nonwork' }, h('strong', null, 'Installed item unknown'), 'No replacement is recorded at ' + p.name + '. This does not show that the item is original, healthy or never replaced.')));
    }
    box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Open work ', h('span', { class: 'tag' }, String(H.open.length))), H.open.length ? h('ul', { class: 'tl' }, H.open.map((r) => jobMini(r.job, r.matchingLines))) : h('p', { class: 'muted small', style: 'margin:0' }, 'No pending or current work in this scope.')));
    box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Completed work ', h('span', { class: 'tag' }, String(H.completed.length))), H.completed.length ? h('ul', { class: 'tl' }, H.completed.map((r) => jobMini(r.job, r.matchingLines))) : h('p', { class: 'muted small', style: 'margin:0' }, 'No completed work in this scope.')));
    if (scope.level === 'part') {
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Installation events at this position ', h('span', { class: 'tag' }, String(H.events.length))), H.events.length ? h('ul', { class: 'tl' }, H.events.map((e) => h('li', { class: e.voided ? 'voided' : '' }, h('strong', null, '#' + e.seq + ' Replacement on ' + EQ.fmtDate(e.businessDate)), h('span', null, 'Installed ' + e.installed.desc + (e.installed.serial ? ', serial ' + e.installed.serial : ', serial unknown')), h('span', null, e.removedKnown ? 'Removed ' + (e.removedDesc || '') + (e.removedSerial ? ' (serial ' + e.removedSerial + ')' : '') : 'Removed item Unknown (nothing invented)'), h('span', { class: 'when' }, 'Recorded ' + EQ.fmtInstant(e.recordedUtc) + ' by ' + EQ.userName(e.recordedBy) + '. The audit time is not proof of the physical date.')))) : h('p', { class: 'muted small', style: 'margin:0' }, 'No installation events.')));
    }
    if (H.empty) box.appendChild(h('div', { class: 'nonwork' }, h('strong', null, 'No work recorded'), 'Nothing has been recorded for this selection. History starts when the app is used; this is not evidence that anything is original, healthy or never replaced.'));
    if (scope.level === 'equipment') {
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Operational status changes'), H.statusChanges.length ? h('ul', { class: 'tl' }, H.statusChanges.map((c) => h('li', { class: 'status' }, h('div', { class: 'row between' }, EQ.statusBadge(c.status), h('span', { class: 'when' }, EQ.fmtInstant(c.at))), h('span', null, c.prev ? 'From ' + EQ.STATUS[c.prev].label : 'First recorded status'), c.reason ? h('span', null, 'Reason: ' + c.reason) : null, c.relatedJobId ? h('span', { class: 'when' }, 'Related job: ', h('a', { href: '#/eq/jobs/special/' + c.relatedJobId }, EQ.job(c.relatedJobId).number)) : null, h('span', { class: 'when' }, 'By ' + EQ.userName(c.by))))) : h('div', { class: 'nonwork' }, h('strong', null, 'Unreported'), 'No status has ever been recorded, so no duration is shown and nothing is inferred from before tracking began.')));
    }
    return box;
  }
  function scopeLabel(eq, sel) {
    if (sel.part) return EQ.pos(sel.part).name;
    if (sel.sub) return EQ.defLabel(eq.subs.find((s) => s.id === sel.sub).code);
    if (sel.main) return EQ.defLabel(eq.mains.find((m) => m.id === sel.main).code);
    return eq.code + ' (whole equipment)';
  }

  function paramRow(p, eq) {
    const resolved = EQ.state.D.resolved && EQ.state.D.resolved[p.code];
    const conflict = new Set(p.observations.map((o) => o.value)).size > 1;
    const fmt = (v) => (p.operator ? p.operator + ' ' : '') + v + (p.unit ? ' ' + p.unit : '');
    // U1-C22: an Admin-entered specification has no drawing observation; it is labelled as such and shows its source.
    if (p.origin === 'admin') return h('div', { class: 'stack', style: 'gap:.2rem;padding:.4rem 0;border-bottom:1px solid var(--border)', 'data-param': p.code },
      h('div', { class: 'row between' }, h('strong', null, p.label), h('span', { class: 'tag gold' }, 'Admin-entered')),
      p.condition ? h('span', { class: 'small muted' }, 'Condition: ' + p.condition) : null,
      h('span', null, resolved ? fmt(resolved.value) : 'Not set'),
      h('span', { class: 'small muted' }, 'Entered by an Admin' + (resolved && resolved.source ? ' from ' + resolved.source : '') + '; not a drawing observation.'));
    return h('div', { class: 'stack', style: 'gap:.2rem;padding:.4rem 0;border-bottom:1px solid var(--border)' },
      h('div', { class: 'row between' }, h('strong', null, p.label + (p.motorCount ? ' (x' + p.motorCount + ')' : '')), conflict && !resolved ? h('span', { class: 'tag red' }, 'Unresolved source conflict') : h('span', { class: 'tag' }, resolved ? (resolved.basis === 'adminEntered' && !conflict ? 'Admin value' : 'Resolved by Admin') : 'Read from drawing')),
      p.condition ? h('span', { class: 'small muted' }, 'Condition: ' + p.condition) : null,
      conflict ? h('ul', { class: 'lines', style: 'margin:0' }, p.observations.map((o) => h('li', null, fmt(o.value) + ' — ' + o.drawing + ' p' + o.page + (o.supplementary ? ' (supplementary observation)' : '')))) : h('span', null, fmt(p.observations[0].value)),
      resolved ? h('span', { class: 'small' }, (resolved.basis === 'adminEntered' && !conflict ? 'Admin value: ' : 'Chosen: ') + resolved.value + ' ' + p.unit + ' (' + resolved.reason + (resolved.source ? '; source ' + resolved.source : '') + '). Source observations are kept.') : null,
      !conflict ? h('span', { class: 'small muted' }, h('span', { class: 'tag' }, h('span', null, p.observations[0].drawing + ' p' + p.observations[0].page)), ' visually read from the drawing, not independently verified') : null,
      p.code === 'total-lift-height' ? h('span', { class: 'small' }, 'This is total lift height. It is not the overall height of the crane; an overall height is not established in the reference data.') : null,
      conflict && !resolved && EQ.perm.admin() ? h('div', null, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.dlg.resolveParam(p) }, 'Resolve with a reason')) : null);
  }
  function technicalTab(eq, sel, q) {
    const box = h('div', { class: 'stack' });
    const kv = (rows) => h('dl', { class: 'kv' }, rows.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
    if (q.container) { return containerTab(eq); }
    if (sel.part) {
      const p = EQ.pos(sel.part), s = EQ.subDef(eq.subs.find((x) => x.id === p.subId).code), m = EQ.mainDef(s.main);
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, p.name), kv([
        ['Equipment', eq.code], ['Main / sub', m.code + ' ' + m.name + ' / ' + s.code + ' ' + (s.name || '')], ['Position ID', h('span', { class: 'mono' }, p.id)],
        ['Semantic key', h('span', { class: 'mono' }, p.key)], ['Kind', p.kind === 'serialized' ? 'Serialized (1 ea)' : 'Quantity-bearing (' + p.uom + ')'], ['State', p.state === 'active' ? 'Active (confirmed by Admin)' : p.state],
        ['Installed now', (function () { const ev = EQ.state.D.events.filter((x) => x.positionId === p.id && !x.voided).slice(-1)[0]; return ev ? ev.installed.desc + (ev.installed.serial ? ' (serial ' + ev.installed.serial + ')' : ' (serial unknown)') : 'Unknown: nothing recorded (not evidence the item is original)'; })()], ['Geometry provenance', p.prov === 'approximate-location' ? h('span', null, h('span', { class: 'tag' }, 'Location approximate'), ' simplified representation') : p.prov], ['Source references', p.src]])));
      box.appendChild(h('div', { class: 'notice info' }, icon('info'), h('p', null, 'Binding: scene node key ', h('span', { class: 'mono' }, p.key), ' resolves for ' + eq.code + ' to position ', h('span', { class: 'mono' }, p.id), '. Another QC using the same template has its own position ID and its own history. A mesh name or index is never the identity.')));
    } else if (sel.sub) {
      const s = EQ.subDef(eq.subs.find((x) => x.id === sel.sub).code);
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, s.code + ' ' + (s.name || 'Reserved')), kv([['Main', EQ.mainDef(s.main).code + ' ' + EQ.mainDef(s.main).name], ['Original label', s.sourceName || '(blank in the source)'], ['Description', s.description || 'No description in the source']])));
    } else if (sel.main) {
      const m = EQ.mainDef(eq.mains.find((x) => x.id === sel.main).code);
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, m.code + ' ' + m.name), h('p', { class: 'small muted', style: 'margin:0' }, EQ.catalog.subs.filter((x) => x.main === m.code).map((x) => x.code + ' ' + (x.name || 'reserved') + (x.active ? '' : ' (inactive)')).join('; '))));
    } else {
      box.appendChild(h('div', { class: 'sec' }, h('h3', null, eq.code), kv([['Type', eq.typeCode], ['Model', EQ.verified(eq) ? eq.modelCode + ' (verified association)' : 'No verified model association'], ['Serial number', 'Unknown'], ['Commissioned', eq.commissionedOn ? EQ.fmtDate(eq.commissionedOn) + ' (synthetic)' : 'Unknown (no prediction for Original spare parts)'], ['Lifecycle', eq.lifecycle], ['Record origin', 'Synthetic development fixture']])));
    }
    // parameters
    const fam = EQ.verified(eq) && eq.modelCode === 'CICT-J526A-STS';
    const pm = sel.main ? EQ.mainDef(eq.mains.find((x) => x.id === sel.main).code).code : null;
    const params = EQ.allParams().filter((p) => (!p.modelCode || p.modelCode === eq.modelCode) && (pm ? (PARAM_MAIN[pm] || []).includes(p.code) || p.mainCode === pm : p.use === 'major'));
    box.appendChild(h('div', { class: 'sec' }, h('h3', null, pm ? 'Family parameters for main ' + pm : 'Major parameters'),
      fam ? h('div', null, h('p', { class: 'small muted', style: 'margin:0 0 .3rem' }, 'Drawing observations for the CICT-J526A-STS family (J526A00 general arrangement). They apply to this equipment only because an Admin verified its model association; they are not measurements of this item.'), params.length ? params.map((p) => paramRow(p, eq)) : h('p', { class: 'small muted' }, 'No source parameters are recorded for this mechanism.'))
        : h('div', { class: 'nonwork' }, h('strong', null, 'No family parameters'), eq.typeCode === 'QC' ? 'This equipment has no verified model association, so no drawing values are shown for it.' : 'No source parameters exist for ' + eq.typeCode + ' in the reference data.')));
    box.appendChild(h('div', { class: 'sec' }, h('h3', null, 'Drawings and photos'), h('p', { class: 'small muted', style: 'margin:0' }, 'Source drawings open only through the authenticated drawing handler. The prototype lists references and does not open files.'), h('ul', { class: 'lines', style: 'margin:0' }, (sel.part ? [EQ.pos(sel.part).src] : ['J526A00 p1 general arrangement', 'J526A0300 p1 main hoist drive']).map((t) => h('li', null, icon('file'), ' ' + t + ' ', h('span', { class: 'tag dashed' }, 'protected, requires sign-in'))))));
    return box;
  }
  function containerTab(eq) {
    const box = h('div', { class: 'stack' });
    const ps = EQ.qc?.containerPositions(eq, EQ.route.query.container) || EQ.positionsOf(eq.id).filter((p) => p.state === 'active' && HOUSE_KEYS.includes(p.key));
    const groups = {};
    ps.forEach((p) => { const s = eq.subs.find((x) => x.id === p.subId); const m = EQ.mainDef(eq.mains.find((x) => x.id === p.mainId).code); (groups[m.code + ' ' + m.name] = groups[m.code + ' ' + m.name] || []).push([p, s]); });
    box.appendChild(h('div', { class: 'notice info' }, icon('info'), h('p', null, h('strong', null, (EQ.qc?.containerName(EQ.route.query.container) || 'Machinery house') + ': spatial container. '), 'It is not a mechanism and owns no history. It contains positions from several mechanisms; select a position to see its own records.')));
    Object.entries(groups).forEach(([g, items]) => box.appendChild(h('div', { class: 'sec' }, h('h3', null, g), h('ul', { class: 'tl' }, items.map(([p]) => h('li', null, h('a', { href: '#', onClick: (e) => { e.preventDefault(); select(eq, { main: p.mainId, sub: p.subId, part: p.id }, { mode: 'technical' }); } }, p.name), h('span', { class: 'when' }, p.prov === 'approximate-location' ? 'Location approximate / simplified representation' : p.prov)))))));
    return box;
  }

  /** One current-state tab: a separate query keyed by equipment, scope, target and tab; a late response for a previous selection is
   *  discarded (HIS05). No tab shows work history (U1-C19, HIS06). */
  function tabBody(eq, sel, scope, q, tab) {
    const key = eq.id + '|' + tab + '|' + scope.level + '|' + (scope.id || '');
    EQ.eqUI.currentHistKey = key;
    const label = tab + ' ' + (scope.level === 'equipment' ? eq.code : scope.level + ' ' + scope.id);
    const loaded = ensureHistory(key, label);
    const box = h('div', { class: 'stack', 'aria-live': 'polite', 'aria-busy': loaded ? 'false' : 'true', 'data-echo': key });
    if (!loaded) { box.appendChild(h('div', { class: 'stack' }, h('p', { class: 'muted small', style: 'margin:0' }, 'Loading ' + (EQ.panelTabs.TABS.find((t) => t[0] === tab)[1]) + ' for ' + scopeLabel(eq, sel) + '...'), h('div', { class: 'skeleton', style: 'height:4rem' }), h('div', { class: 'skeleton', style: 'height:4rem' }))); return box; }
    box.appendChild(tab === 'maintenance' ? EQ.panelTabs.maintenance(eq, scope) : tab === 'special' ? EQ.panelTabs.special(eq, sel, scope) : tab === 'spareParts' ? EQ.panelTabs.spare(eq, sel, scope) : technicalTab(eq, sel, q));
    return box;
  }

  // ---------------------------------------------------------------- page
  EQ.views.equipment = function equipment(id, q) {
    const S = EQ.state;
    const eq = EQ.eq(id);
    const page = h('div', { class: 'page' });
    if (!eq) { page.appendChild(h('div', { class: 'panel panel-pad' }, h('div', { class: 'notice error', role: 'alert' }, icon('alert'), h('p', null, 'No equipment with this link exists (404). It may have been mistyped or removed.')), h('p', null, h('a', { href: '#/eq/fleet' }, 'Back to the fleet')))); return page; }
    if (S.data === 'loading') { page.appendChild(h('div', { 'aria-busy': 'true', role: 'status' }, h('span', { class: 'sr-only' }, 'Loading equipment'), h('div', { class: 'skeleton', style: 'height:4rem;margin-bottom:.7rem' }), h('div', { class: 'detail-grid' }, h('div', { class: 'skeleton', style: 'height:26rem' }), h('div', { class: 'skeleton', style: 'height:26rem' }), h('div', { class: 'skeleton', style: 'height:26rem' })))); return page; }
    if (S.data === 'error') { page.appendChild(h('div', { class: 'notice error', role: 'alert' }, icon('wifi-off'), h('div', null, h('p', null, h('strong', null, 'This equipment could not be loaded. '), 'No data is shown and nothing is assumed Ready.'), h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn-sm', onClick: () => EQ.refresh(true) }, 'Retry'), h('a', { href: '#/eq/fleet' }, 'Back to the fleet'))))); return page; }

    EQ.qc?.prepare(eq);
    const sel = resolveSel(eq, q);
    const mode = q.mode === 'technical' ? 'technical' : 'overall';
    const pq = q.panel === 'history' ? 'special' : q.panel;
    const panelTab = EQ.panelTabs.KEYS.includes(pq) ? pq : 'maintenance';
    const scope = scopeOf(sel);
    const dur = EQ.inStatusFor(eq);
    const mode2 = EQ.zmms.mode(eq);

    if (S.data === 'stale') page.appendChild(h('div', { class: 'notice warn', role: 'status', style: 'margin-bottom:.6rem' }, icon('wifi-off'), h('p', null, h('strong', null, 'Showing last good data from ' + EQ.fmtTime(S.lastGoodAt) + '. '), 'The latest refresh failed; status and work lists may be out of date.')));

    page.appendChild(h('header', { class: 'panel eq-head' },
      h('div', null, h('p', { class: 'eyebrow' }, eq.typeCode + ' equipment'), h('h1', null, eq.code, EQ.statusBadge(eq.status, true), eq.lifecycle === 'retired' ? h('span', { class: 'tag' }, 'Retired') : null)),
      h('div', { class: 'facts' },
        h('span', null, dur != null ? 'In ' + EQ.STATUS[eq.status].label + ' for ' + EQ.duration(dur) + ' (since ' + EQ.fmtInstantShort(eq.statusSince) + ')' : 'No status reported yet, so no duration'),
        eq.statusReason ? h('span', null, 'Reason: ' + eq.statusReason) : null,
        h('span', null, 'Model: ' + (EQ.verified(eq) ? eq.modelCode + ' (verified)' : 'no verified association')),
        h('span', null, h('span', { class: 'tag ' + (mode2.label === 'Auto' ? '' : 'gold'), title: mode2.long }, mode2.label === 'Auto' ? 'Auto (ZMMS)' : 'Manual'), ' ', mode2.long + (eq.zmmsMapped ? ' · ' + EQ.zmms.freshLabel() : '')),
        EQ.panelTabs.jobsAllowed() ? h('a', { href: '#/eq/jobs/special?equipment=' + eq.id }, EQ.plural(EQ.openCount(eq.id, { level: 'equipment', id: null }), 'open special job')) : h('span', null, EQ.plural(EQ.openCount(eq.id, { level: 'equipment', id: null }), 'open special job'))),
      h('div', { class: 'actions' },
        EQ.perm.write() && eq.lifecycle === 'active' ? [h('button', { type: 'button', 'data-fk': 'set-status', onClick: () => EQ.dlg.status(eq) }, icon('refresh'), eq.zmmsMapped ? 'Correct status' : 'Update status'), eq.zmmsMapped && eq.overrideOn ? h('button', { type: 'button', 'data-fk': 'back-auto', onClick: () => { const r = EQ.zmms.backToAutomatic(eq.id); EQ.toast(r.ok ? eq.code + ' is back to automatic' + (r.awaiting ? " (awaiting today's ZMMS sync)" : '') : r.message, 'Prototype: in memory only.'); } }, icon('undo'), 'Back to automatic') : null, h('button', { type: 'button', class: 'primary', 'data-fk': 'add-job', onClick: () => EQ.dlg.jobForm({ equipmentId: eq.id }) }, icon('plus'), 'Add special job')]
          : h('span', { class: 'tag gold' }, EQ.perm.write() ? 'Retired: no new jobs or status changes' : 'Read-only: Management cannot change records'))));

    page.appendChild(h('div', { class: 'toolbar' }, crumbs(eq, sel, q),
      h('div', { class: 'drawer-btns', style: 'margin-left:auto' },
        h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'open-tree', 'aria-expanded': EQ.eqUI.drawer === 'tree' ? 'true' : 'false', onClick: () => { EQ.eqUI.drawer = 'tree'; EQ.eqUI.drawerOpener = 'open-tree'; EQ.rerender(); } }, icon('tree'), 'Mechanisms'),
        h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'open-panel', 'aria-expanded': EQ.eqUI.drawer === 'panel' ? 'true' : 'false', onClick: () => { EQ.eqUI.drawer = 'panel'; EQ.eqUI.drawerOpener = 'open-panel'; EQ.rerender(); } }, icon('panel'), 'Details'))));
    if (sel.bad) page.appendChild(h('div', { class: 'notice warn', role: 'status', style: 'margin-bottom:.6rem' }, icon('alert'), h('p', null, 'The link selects a ' + sel.bad + ' that does not belong to ' + eq.code + ' (422 target_not_in_equipment). Showing the whole equipment instead.')));
    if (eq.positionState === 'draft') page.appendChild(h('div', { class: 'notice info', style: 'margin-bottom:.6rem' }, icon('info'), h('p', null, 'The positions of ' + eq.code + ' are drafts derived from its model template. No work can target them until an Admin reviews and confirms them.', EQ.perm.admin() ? ' ' : '', EQ.perm.admin() ? h('a', { href: '#/admin/eq/positions?equipment=' + eq.id }, 'Review positions') : null)));

    const treePanel = h('aside', { class: 'panel tree-panel' + (EQ.eqUI.drawer === 'tree' ? ' open' : ''), 'aria-label': 'Mechanisms' },
      h('div', { class: 'tp-head' }, h('div', { class: 'row between' }, h('h2', null, 'Mechanisms'), h('button', { type: 'button', class: 'btn-sm drawer-btns', 'aria-label': 'Close mechanisms', onClick: () => closeDrawer() }, icon('x'))),
        h('div', { class: 'field', style: 'margin-top:.4rem' }, h('label', { for: 'tf', class: 'sr-only' }, 'Filter mechanisms'), h('input', { id: 'tf', type: 'search', 'data-fk': 'tf', placeholder: 'Filter mechanisms', value: ui.treeFilter, autocomplete: 'off', onInput: (e) => { ui.treeFilter = e.target.value; EQ.rerender(); } }))),
      eq.mains.length ? treeView(eq, sel) : h('div', { class: 'panel-pad small muted' }, eq.assoc === 'verified' ? 'No applicable mechanisms are configured for this model.' : 'No mechanism instances: this equipment has no verified model association or instantiated template.'));

    const sum = EQ.panelTabs.summary(eq, scope);
    const nOf = { maintenance: sum.maintenance, special: sum.special, spareParts: sum.spare.overdue + sum.spare.dueSoon };
    const nLabel = { maintenance: 'jobs today', special: 'open', spareParts: 'overdue or due soon' };
    const sideHead = h('div', { class: 'sp-head' },
      h('div', { class: 'row between' }, h('div', null, h('p', { class: 'eyebrow' }, sel.part ? 'Part position' : sel.sub ? 'Submechanism' : sel.main ? 'Main mechanism' : q.container ? 'Spatial container' : 'Equipment'), h('h2', { 'data-fk': 'scope-title' }, q.container ? (EQ.qc?.containerName(q.container) || 'Spatial group') : scopeLabel(eq, sel))), h('button', { type: 'button', class: 'btn-sm drawer-btns', 'aria-label': 'Close details', onClick: () => closeDrawer() }, icon('x'))),
      h('div', { class: 'tabs four', role: 'tablist', 'aria-label': 'Current state of the selection' }, EQ.panelTabs.TABS.map(([k, long, short]) => {
        const n = nOf[k];
        return h('button', { type: 'button', role: 'tab', id: 'tab-' + k, 'aria-controls': 'tabpanel', 'aria-selected': panelTab === k ? 'true' : 'false', tabindex: panelTab === k ? '0' : '-1', 'aria-label': long + (n ? ', ' + n + ' ' + nLabel[k] : ''), 'data-fk': 'tab-' + k,
          onKeydown: (e) => { const keys = EQ.panelTabs.KEYS; const i = keys.indexOf(k); const j = e.key === 'ArrowRight' ? (i + 1) % 4 : e.key === 'ArrowLeft' ? (i + 3) % 4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : -1; if (j >= 0) { e.preventDefault(); EQ.nav('/eq/equipment/' + eq.id, { ...q, panel: keys[j] }); setTimeout(() => document.querySelector('[data-fk="tab-' + keys[j] + '"]')?.focus(), 0); } },
          onClick: () => EQ.nav('/eq/equipment/' + eq.id, { ...q, panel: k }) }, h('span', { class: 'lbl-long' }, long === 'Projects/Special' ? ['Projects/', h('wbr'), 'Special'] : long), n ? h('span', { class: 'tab-n', 'aria-hidden': 'true' }, String(n)) : null);
      })));
    const sideBody = h('div', { class: 'sp-body', role: 'tabpanel', id: 'tabpanel', 'aria-labelledby': 'tab-' + panelTab }, q.container ? containerTab(eq) : tabBody(eq, sel, scope, q, panelTab));
    const side = h('aside', { class: 'panel side-panel' + (EQ.eqUI.drawer === 'panel' ? ' open' : ''), 'aria-label': 'Current state of the selection' }, sideHead, sideBody);

    page.appendChild(h('div', { class: 'detail-grid' }, treePanel, h('div', { class: 'stack' }, viewport(eq, sel, q, mode), eq.typeCode !== 'QC' ? rtgSummary(eq) : null), side));
    page.appendChild(h('div', { class: 'scrim' + (EQ.eqUI.drawer ? ' on' : ''), onClick: () => closeDrawer() }));
    return page;
  };
  function closeDrawer() { const op = EQ.eqUI.drawerOpener; EQ.eqUI.drawer = null; EQ.rerender(); if (op) document.querySelector('[data-fk="' + op + '"]')?.focus(); }
  EQ.closeDrawer = closeDrawer;
  function rtgSummary(eq) {
    const cs = EQ.currentSpecial(eq.id, { level: 'equipment', id: null });
    const list = cs.ok ? cs.openJobs.slice(0, 4) : [];
    return h('section', { class: 'panel panel-pad stack', 'aria-label': 'Records summary' }, h('h2', null, 'Records for ' + eq.code), h('p', { class: 'small muted', style: 'margin:0' }, 'Same panel as a QC: applicable mechanism tree (left) and the four current-state tabs (right); work history is in the Jobs tab. Only the 3D view is deferred.'),
      list.length ? h('ul', { class: 'tl' }, list.map((r) => EQ.panelTabs.jobMini(r.job, r.matchingLines, { current: true }))) : h('p', { class: 'muted small', style: 'margin:0' }, 'No open special jobs.'));
  }
  EQ.eqv = { historyTab, jobMini, scopeLabel, resolveSel, scopeOf, ensureHistory, select, technicalTab, containerTab };
})(window.EQ);
