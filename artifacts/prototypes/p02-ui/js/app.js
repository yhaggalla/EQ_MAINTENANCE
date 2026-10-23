/* Shell, hash router, section switch and tabs, prototype controls, focus/scroll preservation, auto-refresh and an accessibility
   self-audit helper. P02B: EQ | FAC sections, Access-matrix-driven tabs, landing rule, legacy P02 routes redirected (D-89). */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const S = EQ.state;
  const APP_NAME = 'EQ & FAC Maintenance';
  let mainEl, controlsEl, bannerEl, navEl, switchEl, roleChipEl, liveEl, topbarEl;
  let controlsOpen = false, lastPath = null;
  S.section = S.section || 'eq';

  // ---------------- routing ----------------
  function parse() {
    const raw = location.hash.replace(/^#/, '');
    const [pathPart, qs] = raw.split('?');
    const segs = pathPart.split('/').filter(Boolean);
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
    return { name: segs[0] || '', segs, query, path: '/' + segs.join('/') };
  }
  EQ.route = parse();
  /** Legacy P02 paths -> V2 route trees (D-89). Returns a new hash or null. */
  function legacy(r) {
    const q = new URLSearchParams(r.query);
    const out = (path) => '#' + path + (q.toString() ? '?' + q.toString() : '');
    const [a, b] = r.segs;
    if (a === 'fleet') return out('/eq/fleet');
    if (a === 'equipment' && b) { if (q.get('panel') === 'history') q.set('panel', 'special'); return out('/eq/equipment/' + b); }
    if (a === 'jobs') return out(b ? '/eq/jobs/special/' + b : '/eq/jobs/special');
    if (a === 'admin' && (!b || !['eq', 'fac', 'access'].includes(b))) return out('/admin/eq/' + (b === 'bindings' ? 'scene-bindings' : b || 'equipment'));
    if (a === 'eq' && b === 'jobs' && !r.segs[2]) return out('/eq/jobs/special');
    return null;
  }
  EQ.nav = (path, query, opts) => {
    const qs = new URLSearchParams();
    Object.entries(query || {}).forEach(([k, v]) => { if (v !== '' && v != null) qs.set(k, v); });
    const hash = '#' + path + (qs.toString() ? '?' + qs.toString() : '');
    if (hash === location.hash) { render(); return; }
    if (opts && opts.replace) location.replace(hash); else location.hash = hash;
  };
  window.addEventListener('hashchange', () => { EQ.route = parse(); render(); });

  EQ.setViewer = (v) => { S.viewer = v; syncUrl(); EQ.log('viewer state: ' + v); render(); };
  function syncUrl() {
    const u = new URL(location.href);
    u.searchParams.set('role', S.role); u.searchParams.set('data', S.data); u.searchParams.set('viewer', S.viewer);
    history.replaceState(null, '', u.pathname + u.search + location.hash);
  }
  EQ.refresh = (manual) => {
    if (S.data === 'stale' || S.data === 'error') { S.failedAt = Date.now(); EQ.log('refresh FAILED (simulated); last good data kept from ' + EQ.fmtTime(S.lastGoodAt)); }
    else { S.refreshedAt = Date.now(); S.lastGoodAt = S.refreshedAt; if (manual) EQ.log('refreshed (manual)'); }
    render();
  };
  EQ.rerender = () => render();
  EQ.subscribe(() => { S.lastGoodAt = S.data === 'stale' || S.data === 'error' ? S.lastGoodAt : Date.now(); render(); });
  EQ.setPersona = (k) => { S.role = k; EQ.access.refreshSession('persona switch'); syncUrl(); EQ.log('persona: ' + EQ.PERSONAS[k].label); const l = EQ.access.landing(); if (!EQ.route.path || !routeOk(EQ.route.path)) EQ.nav(l, {}, { replace: true }); else render(); };
  function routeOk(path) { const f = EQ.access.featureForRoute(path); return !f || EQ.access.has(f); }

  // ---------------- shell ----------------
  function buildShell() {
    const root = document.getElementById('app');
    root.replaceChildren();
    liveEl = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', id: 'live' });
    bannerEl = h('div', { class: 'proto-banner', role: 'region', 'aria-label': 'Prototype notice' });
    switchEl = h('div', { class: 'section-switch', role: 'group', 'aria-label': 'Section' });
    navEl = h('nav', { class: 'topnav', 'aria-label': 'Main' });
    roleChipEl = h('div', { class: 'topbar-right' });
    mainEl = h('main', { id: 'main', tabindex: '-1' });
    controlsEl = h('aside', { class: 'pc', id: 'pc', 'aria-label': 'Prototype controls', hidden: true });
    topbarEl = h('header', { class: 'topbar' }, h('a', { class: 'portal-logo', href: '#/', 'aria-label': APP_NAME }, h('span', { class: 'logo-mark' }, 'CICT'), h('span', { class: 'logo-copy' }, h('strong', null, APP_NAME), h('small', null, 'Engineering Portal application'))), switchEl, navEl, roleChipEl);
    root.append(h('a', { class: 'skip-link', href: '#main', onClick: (e) => { e.preventDefault(); mainEl.focus(); } }, 'Skip to content'), bannerEl, topbarEl, mainEl, controlsEl, liveEl);
  }
  function currentSection() {
    const a = EQ.route.segs[0];
    if (a === 'eq' || a === 'fac') S.section = a;
    const L = EQ.access.layout();
    if (S.section === 'eq' && !L.eq.length && L.fac.length) return 'fac';
    if (S.section === 'fac' && !L.fac.length && L.eq.length) return 'eq';
    return S.section;
  }
  function paintChrome() {
    const L = EQ.access.layout();
    const sec = currentSection();
    const persona = EQ.access.persona();
    bannerEl.replaceChildren(
      h('strong', null, 'PROTOTYPE'), h('span', null, 'Synthetic data only. Nothing is saved, no sign-in is implemented, no live ZMMS connection exists, and the persona below is a simulation of the Portal role assignment, not authentication.'),
      h('button', { type: 'button', 'aria-expanded': controlsOpen ? 'true' : 'false', 'aria-controls': 'pc', 'data-fk': 'pc-toggle', onClick: () => { controlsOpen = !controlsOpen; render(); } }, 'Prototype controls'));
    const path = EQ.route.path;
    const tabs = sec === 'fac' ? L.fac : L.eq;
    const secs = [];
    if (L.eq.length && L.fac.length) {
      const eqTarget = (EQ.access.readLastSection('eq') || L.eq[0].path), facTarget = (EQ.access.readLastSection('fac') || L.fac[0].path);
      secs.push(h('a', { class: 'sec-link', href: '#' + eqTarget, 'aria-current': sec === 'eq' ? 'true' : null, 'data-fk': 'sec-eq' }, 'EQ'), h('a', { class: 'sec-link', href: '#' + facTarget, 'aria-current': sec === 'fac' ? 'true' : null, 'data-fk': 'sec-fac' }, 'FAC'));
    }
    switchEl.hidden = !secs.length; switchEl.replaceChildren(...secs);
    const cur = (t) => path.startsWith(t.path.split('/').slice(0, 3).join('/'));
    navEl.replaceChildren(...[
      ...(L.noAccess ? [] : tabs.map((t) => h('a', { class: 'nav-link', href: '#' + t.path, 'aria-current': cur(t) ? 'page' : null, 'data-fk': 'nav-' + sec + '-' + t.id }, icon(t.icon), t.label))),
      L.admin ? h('a', { class: 'nav-link', href: '#/admin/eq/equipment', 'aria-current': path.startsWith('/admin') ? 'page' : null, 'data-fk': 'nav-admin' }, icon('gear'), 'Admin') : null].filter(Boolean));
    const roChip = !L.noAccess && ((path.startsWith('/fac') && !EQ.access.has('fac.work')) || (!path.startsWith('/fac') && !path.startsWith('/admin') && !EQ.access.has('eq.work')));
    roleChipEl.replaceChildren(...[
      roChip ? h('span', { class: 'role-chip readonly-chip', title: persona.hint }, icon('lock'), 'Read-only access') : null,
      h('span', { class: 'role-chip', title: 'Simulated Portal role assignment: ' + persona.hint }, icon('user'), EQ.user().name + ' · ' + persona.label)].filter(Boolean));
    controlsEl.hidden = !controlsOpen;
    if (controlsOpen) controlsEl.replaceChildren(...controlsBody());
  }

  function controlsBody() {
    const f = (id, label, el) => h('div', { class: 'field' }, h('label', { for: id }, label), el);
    const sel = (id, opts, val, cb) => { const s = h('select', { id, 'data-fk': id }, opts.map(([v, l]) => h('option', { value: v, selected: val === v ? true : null }, l))); s.addEventListener('change', () => cb(s.value)); return s; };
    return [
      h('header', null, h('h2', null, 'Prototype controls'), h('button', { type: 'button', 'aria-label': 'Close prototype controls', onClick: () => { controlsOpen = false; render(); document.querySelector('[data-fk="pc-toggle"]')?.focus(); } }, icon('x'))),
      h('div', { class: 'body' },
        h('fieldset', null, h('legend', null, 'Simulated Portal roles (not authentication)'),
          h('div', { class: 'stack' }, Object.entries(EQ.PERSONAS).map(([r, p]) => h('label', { class: 'check' }, h('input', { type: 'radio', name: 'pc-role', value: r, checked: S.role === r ? true : null, 'data-fk': 'role-' + r, onChange: () => EQ.setPersona(r) }), p.label + ' (' + p.hint + ')')))),
        f('pc-data', 'Data state', sel('pc-data', [['normal', 'Normal'], ['loading', 'Loading'], ['empty', 'Empty (no equipment)'], ['stale', 'Stale (refresh failed, last good data kept)'], ['error', 'Error (no data)']], S.data, (v) => { S.data = v; syncUrl(); EQ.log('data state: ' + v); render(); })),
        f('pc-viewer', 'Viewer state (QC detail)', sel('pc-viewer', [['preview', 'Placeholder preview'], ['loading', 'Loading'], ['nowebgl', 'WebGL unavailable'], ['contextlost', 'Context lost'], ['loadfailed', 'Model request failed']], S.viewer, (v) => EQ.setViewer(v))),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: S.conflictNext ? true : null, 'data-fk': 'pc-conflict', onChange: (e) => { S.conflictNext = e.target.checked; } }), 'Next job edit save hits a version conflict'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: S.slowHistory ? true : null, 'data-fk': 'pc-slow', onChange: (e) => { S.slowHistory = e.target.checked; } }), 'Slow, out-of-order history responses'),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { EQ.reset(); EQ.nav(EQ.access.landing(), {}); render(); } }, 'Reset fixtures'),
          h('button', { type: 'button', class: 'btn-sm', 'data-fk': 'pc-arrival', onClick: () => { const r = EQ.fac.simulateArrival({ photo: true }); EQ.toast(r ? 'Simulated: another FAC user recorded progress on ' + r.job.number : 'No job available', 'The dashboard patches the row in place and glows it.'); } }, 'Simulate a FAC update arriving'),
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.createJob({ equipmentId: 'eq-qc-demo-02', kind: 'repair', title: 'Direct API write attempt (prototype)', level: 'equipment' }); EQ.toast(r.ok ? 'Server accepted the write for ' + EQ.PERSONAS[S.role].label + ': ' + r.job.number : 'Server refused (' + r.status + '): ' + r.message); } }, 'Try a direct EQ write as this role'),
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.fac.api.hold('fj-3', 'Direct API write attempt (prototype)'); EQ.toast(r.ok ? 'Server accepted the FAC write for ' + EQ.PERSONAS[S.role].label : 'Server refused (' + r.status + ' ' + r.code + '): ' + r.message); } }, 'Try a direct FAC write as this role'),
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { const lc = EQ.lastCompletion; if (!lc) { EQ.toast('Complete a job first, then resend its request.'); return; } const r = EQ.api.completeJob(lc.id, lc.payload); EQ.toast(r.replayed ? 'Retry replayed: no duplicate completion or replacement was recorded' : r.message || 'Unexpected result'); EQ.log('retry of the same completion request: ' + (r.replayed ? 'replayed, nothing duplicated' : 'not replayed')); } }, 'Resend last completion (retry test)')),
        h('p', { class: 'small muted', style: 'margin:0' }, 'WebGL detected in this browser: ' + (S.webgl ? 'yes' : 'no') + '. The placeholder preview itself uses no WebGL. Fixtures built ' + EQ.fmtInstantShort(S.D.builtAt) + '. Session snapshot read ' + EQ.fmtTime(EQ.access.sessionAt()) + '.'),
        h('div', null, h('h4', null, 'Event log (simulated server, requests, audit)'), h('ul', { class: 'log', 'aria-label': 'Prototype event log', tabindex: '0' }, S.log.length ? S.log.slice(0, 25).map((l) => h('li', null, l)) : h('li', null, 'No events yet'))))];
  }

  // ---------------- render with focus/scroll preservation ----------------
  let rendering = false;
  function render() {
    if (rendering || !mainEl) return;
    rendering = true;
    try {
      EQ.route = parse();
      let r = EQ.route;
      // landing and legacy redirects
      if (!r.name) { const l = EQ.access.landing(); location.replace('#' + l); EQ.route = r = parse(); }
      else { const lg = legacy(r); if (lg) { location.replace(lg); EQ.route = r = parse(); } }
      const ae = document.activeElement;
      const inMain = ae && (mainEl.contains(ae) || controlsEl.contains(ae) || navEl.contains(ae) || bannerEl.contains(ae) || switchEl.contains(ae));
      const fk = inMain && ae.dataset ? ae.dataset.fk : null;
      const selStart = ae && 'selectionStart' in ae ? ae.selectionStart : null, selEnd = ae && 'selectionEnd' in ae ? ae.selectionEnd : null;
      const scroll = {}; document.querySelectorAll('.tree-panel,.side-panel,.pc').forEach((n) => { scroll[n.className.split(' ')[0]] = n.scrollTop; });
      const wy = window.scrollY;
      const firstRender = lastPath === null;
      const pathChanged = lastPath !== r.path.split('/').slice(0, 4).join('/');

      const L = EQ.access.layout();
      const feat = EQ.access.featureForRoute(r.path);
      let view, title = APP_NAME;
      if (L.noAccess || r.name === 'no-access') { view = EQ.views.noAccess(); title = 'No access'; }
      else if (feat && !EQ.access.has(feat)) { view = EQ.views.forbidden(feat, r.path); title = 'Not available'; }
      else if (r.name === 'eq') {
        const [, a, b, c] = r.segs;
        if (a === 'equipment' && b) { view = EQ.views.equipment(b, r.query); title = 'Equipment'; }
        else if (a === 'jobs') { view = EQ.views.eqJobs(b || 'special', c, r.query); title = 'EQ Jobs'; }
        else { view = EQ.views.fleet(r.query); title = 'Fleet'; }
      } else if (r.name === 'fac') {
        const [, a, b, c] = r.segs;
        if (a === 'dashboard' && b === 'jobs' && c) { view = EQ.views.facJob(c, r.query, { fromDashboard: true }); title = 'FAC job'; }
        else if (a === 'jobs' && b) { view = EQ.views.facJob(b, r.query); title = 'FAC job'; }
        else if (a === 'jobs') { view = EQ.views.facJobs(r.query); title = 'FAC Jobs'; }
        else { view = EQ.views.facDashboard(r.query); title = 'FAC Dashboard'; }
      } else if (r.name === 'admin') { view = EQ.views.admin(r.segs[1] || 'eq', r.segs[2] || '', r.query); title = 'Admin'; }
      else { location.replace('#' + EQ.access.landing()); view = h('div'); }
      document.body.classList.toggle('tv', r.name === 'fac' && r.segs[1] !== 'jobs' && r.query.tv === '1');
      document.body.dataset.section = currentSection();
      if (mainEl.childNodes.length !== 1 || mainEl.firstChild !== view) mainEl.replaceChildren(view);
      paintChrome();

      document.title = APP_NAME + ' prototype - ' + title;
      const tabPath = tabKey(r.path);
      if (tabPath && !L.noAccess && EQ.access.has(EQ.access.featureForRoute(tabPath) || '')) { EQ.access.writeLast(tabPath); EQ.access.writeLastSection(tabPath); }
      if (pathChanged) { lastPath = r.path.split('/').slice(0, 4).join('/'); window.scrollTo(0, 0); liveEl.textContent = 'Page: ' + title; if (!fk && !firstRender) mainEl.focus({ preventScroll: true }); }
      else { window.scrollTo(0, wy); document.querySelectorAll('.tree-panel,.side-panel,.pc').forEach((n) => { const v = scroll[n.className.split(' ')[0]]; if (v) n.scrollTop = v; }); }
      if (fk) {
        const el = document.querySelector('[data-fk="' + fk + '"]');
        if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); if (selStart != null && el.setSelectionRange && el.type !== 'checkbox' && el.type !== 'date' && el.type !== 'search') { try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* ignore */ } } else if (selStart != null && el.type === 'search') { try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* ignore */ } } }
      }
    } finally { rendering = false; }
  }
  function tabKey(path) {
    if (path.startsWith('/eq/fleet') || path.startsWith('/eq/equipment')) return '/eq/fleet';
    if (path.startsWith('/eq/jobs')) return '/eq/jobs/special';
    if (path.startsWith('/fac/dashboard')) return '/fac/dashboard';
    if (path.startsWith('/fac/jobs')) return '/fac/jobs';
    return null;
  }
  // last used tab per section (path only; same storage rule as the landing, D-90)
  EQ.access.readLastSection = (sec) => { try { const v = localStorage.getItem(EQ.access.lastKey() + ':' + sec); return v && /^\/[a-z/-]*$/.test(v) && EQ.access.has(EQ.access.featureForRoute(v) || '') ? v : null; } catch (e) { return null; } };
  EQ.access.writeLastSection = (path) => { try { localStorage.setItem(EQ.access.lastKey() + ':' + (path.startsWith('/fac') ? 'fac' : 'eq'), path); } catch (e) { /* ignore */ } };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && EQ.eqUI && EQ.eqUI.drawer && !document.querySelector('dialog[open]')) EQ.closeDrawer();
    if (e.key === 'Escape' && document.body.classList.contains('tv') && !document.querySelector('dialog[open]')) EQ.nav('/fac/dashboard', { ...EQ.route.query, tv: '' });
  });

  // ---------------- accessibility self-audit (used by tools/p02/check_prototype.mjs and by reviewers) ----------------
  window.__protoAudit = function audit() {
    const issues = [];
    const name = (el) => {
      const al = el.getAttribute('aria-label'); if (al && al.trim()) return al.trim();
      const lb = el.getAttribute('aria-labelledby'); if (lb) { const t = lb.split(/\s+/).map((i) => document.getElementById(i)?.textContent || '').join(' ').trim(); if (t) return t; }
      if (el.id) { const l = document.querySelector('label[for="' + el.id + '"]'); if (l && l.textContent.trim()) return l.textContent.trim(); }
      const wl = el.closest('label'); if (wl && wl.textContent.trim()) return wl.textContent.trim();
      if (el.title) return el.title;
      return (el.textContent || '').trim();
    };
    const hiddenSub = (el) => el.closest('[aria-hidden="true"]');
    document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach((el) => { if (!name(el)) issues.push('Unlabelled control: ' + el.outerHTML.slice(0, 90)); });
    document.querySelectorAll('button,a[href],[role=button],[role=tab],[role=treeitem]').forEach((el) => { if (hiddenSub(el)) return; if (!name(el)) issues.push('No accessible name: ' + el.outerHTML.slice(0, 90)); });
    const ids = {}; document.querySelectorAll('[id]').forEach((el) => { ids[el.id] = (ids[el.id] || 0) + 1; });
    Object.entries(ids).forEach(([k, n]) => { if (n > 1) issues.push('Duplicate id ' + k); });
    document.querySelectorAll('[tabindex]').forEach((el) => { if (Number(el.getAttribute('tabindex')) > 0) issues.push('Positive tabindex: ' + el.outerHTML.slice(0, 60)); });
    document.querySelectorAll('[aria-hidden="true"]').forEach((el) => { if (el.matches('a[href],button,input,select,textarea,[tabindex="0"]') || el.querySelector('a[href]:not([tabindex="-1"]),button:not([tabindex="-1"]),input,select,textarea,[tabindex="0"]')) issues.push('Focusable element inside aria-hidden: ' + el.outerHTML.slice(0, 80)); });
    document.querySelectorAll('[aria-describedby],[aria-labelledby]').forEach((el) => { (el.getAttribute('aria-describedby') || el.getAttribute('aria-labelledby')).split(/\s+/).forEach((i) => { if (!document.getElementById(i)) issues.push('aria reference to missing id ' + i); }); });
    const canvases = document.querySelectorAll('canvas').length;
    const hasH1 = document.querySelectorAll('h1').length;
    return { route: location.hash, issues, canvases, h1: hasH1, focusable: document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex="0"]').length };
  };

  // ---------------- init ----------------
  function init() {
    const sp = new URLSearchParams(location.search);
    if (EQ.PERSONAS[sp.get('role')]) S.role = sp.get('role');
    if (['normal', 'loading', 'empty', 'stale', 'error'].includes(sp.get('data'))) S.data = sp.get('data');
    if (['preview', 'loading', 'nowebgl', 'contextlost', 'loadfailed'].includes(sp.get('viewer'))) S.viewer = sp.get('viewer');
    if (sp.get('controls') === '1') controlsOpen = true;
    try { const c = document.createElement('canvas'); S.webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { S.webgl = false; }
    EQ.reset();
    buildShell();
    EQ.route = parse();
    render();
    setInterval(() => { if (S.data === 'normal') EQ.refresh(false); }, 60000);
    // session re-read every 60 s so an Access-matrix change reaches the visible UI within a minute (ACC02)
    setInterval(() => { EQ.access.refreshSession('60 s poll'); render(); }, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.EQ);
