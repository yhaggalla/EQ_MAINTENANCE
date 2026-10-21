/* Shell, hash router, prototype controls, focus/scroll preservation, auto-refresh and an accessibility self-audit helper. */
window.EQ = window.EQ || {};
(function (EQ) {
  const h = EQ.h, icon = EQ.icon;
  const S = EQ.state;
  const ROLE_LABEL = { admin: 'Admin', eqTeam: 'EQ Team', management: 'Management' };
  let mainEl, controlsEl, bannerEl, navEl, roleChipEl, liveEl;
  let controlsOpen = false, lastPath = null;

  // ---------------- routing ----------------
  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/fleet';
    const [pathPart, qs] = raw.split('?');
    const segs = pathPart.split('/').filter(Boolean);
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
    return { name: segs[0] || 'fleet', segs, query, path: '/' + segs.join('/') };
  }
  EQ.route = parse();
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

  // ---------------- shell ----------------
  function buildShell() {
    const root = document.getElementById('app');
    root.replaceChildren();
    liveEl = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', id: 'live' });
    bannerEl = h('div', { class: 'proto-banner', role: 'region', 'aria-label': 'Prototype notice' });
    navEl = h('nav', { class: 'topnav', 'aria-label': 'Main' });
    roleChipEl = h('div', { class: 'topbar-right' });
    mainEl = h('main', { id: 'main', tabindex: '-1' });
    controlsEl = h('aside', { class: 'pc', id: 'pc', 'aria-label': 'Prototype controls', hidden: true });
    root.append(
      h('a', { class: 'skip-link', href: '#main', onClick: (e) => { e.preventDefault(); mainEl.focus(); } }, 'Skip to content'),
      bannerEl,
      h('header', { class: 'topbar' }, h('a', { class: 'portal-logo', href: '#/fleet', 'aria-label': 'CICT EQ Maintenance, fleet' }, h('span', { class: 'logo-mark' }, 'CICT'), h('span', { class: 'logo-copy' }, h('strong', null, 'EQ Maintenance'), h('small', null, 'Engineering Portal application'))), navEl, roleChipEl),
      mainEl, controlsEl, liveEl);
  }
  function paintChrome() {
    bannerEl.replaceChildren(
      h('strong', null, 'PROTOTYPE'), h('span', null, 'Synthetic data only. Nothing is saved, no sign-in is implemented, and the role below is a simulation, not authentication.'),
      h('button', { type: 'button', 'aria-expanded': controlsOpen ? 'true' : 'false', 'aria-controls': 'pc', 'data-fk': 'pc-toggle', onClick: () => { controlsOpen = !controlsOpen; render(); } }, 'Prototype controls'));
    const r = EQ.route.name;
    const link = (name, label, ic) => h('a', { class: 'nav-link', href: '#/' + name, 'aria-current': r === name || (name === 'jobs' && r === 'jobs') ? 'page' : null }, icon(ic), label);
    navEl.replaceChildren(...[link('fleet', 'Fleet', 'home'), link('jobs', 'Jobs', 'list'), S.role === 'admin' ? link('admin', 'Admin', 'gear') : null].filter(Boolean));
    roleChipEl.replaceChildren(...[
      S.role === 'management' ? h('span', { class: 'role-chip readonly-chip' }, icon('lock'), 'Read-only access') : null,
      h('span', { class: 'role-chip' }, icon('user'), EQ.user().name + ' · ' + ROLE_LABEL[S.role])].filter(Boolean));
    controlsEl.hidden = !controlsOpen;
    if (controlsOpen) controlsEl.replaceChildren(...controlsBody());
  }

  function controlsBody() {
    const f = (id, label, el) => h('div', { class: 'field' }, h('label', { for: id }, label), el);
    const sel = (id, opts, val, cb) => { const s = h('select', { id, 'data-fk': id }, opts.map(([v, l]) => h('option', { value: v, selected: val === v ? true : null }, l))); s.addEventListener('change', () => cb(s.value)); return s; };
    return [
      h('header', null, h('h2', null, 'Prototype controls'), h('button', { type: 'button', 'aria-label': 'Close prototype controls', onClick: () => { controlsOpen = false; render(); document.querySelector('[data-fk="pc-toggle"]')?.focus(); } }, icon('x'))),
      h('div', { class: 'body' },
        h('fieldset', null, h('legend', null, 'Simulated role (not authentication)'),
          h('div', { class: 'stack' }, ['admin', 'eqTeam', 'management'].map((r) => h('label', { class: 'check' }, h('input', { type: 'radio', name: 'pc-role', value: r, checked: S.role === r ? true : null, 'data-fk': 'role-' + r, onChange: () => { S.role = r; syncUrl(); EQ.log('role: ' + ROLE_LABEL[r]); render(); } }), ROLE_LABEL[r] + (r === 'management' ? ' (read-only)' : r === 'eqTeam' ? ' (writer; user A)' : ' (writer + corrections)'))))),
        f('pc-data', 'Data state', sel('pc-data', [['normal', 'Normal'], ['loading', 'Loading'], ['empty', 'Empty (no equipment)'], ['stale', 'Stale (refresh failed, last good data kept)'], ['error', 'Error (no data)']], S.data, (v) => { S.data = v; syncUrl(); EQ.log('data state: ' + v); render(); })),
        f('pc-viewer', 'Viewer state (QC detail)', sel('pc-viewer', [['preview', 'Placeholder preview'], ['loading', 'Loading'], ['nowebgl', 'WebGL unavailable'], ['contextlost', 'Context lost'], ['loadfailed', 'Model request failed']], S.viewer, (v) => EQ.setViewer(v))),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: S.conflictNext ? true : null, 'data-fk': 'pc-conflict', onChange: (e) => { S.conflictNext = e.target.checked; } }), 'Next job edit save hits a version conflict'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: S.slowHistory ? true : null, 'data-fk': 'pc-slow', onChange: (e) => { S.slowHistory = e.target.checked; } }), 'Slow, out-of-order history responses'),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { EQ.reset(); EQ.nav('/fleet', {}); render(); } }, 'Reset fixtures'),
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { const r = EQ.api.createJob({ equipmentId: 'eq-qc-demo-02', kind: 'repair', title: 'Direct API write attempt (prototype)', level: 'equipment' }); EQ.toast(r.ok ? 'Server accepted the write for ' + ROLE_LABEL[S.role] + ': ' + r.job.number : 'Server refused (' + r.status + '): ' + r.message); } }, 'Try a direct write as this role'),
          h('button', { type: 'button', class: 'btn-sm', onClick: () => { const lc = EQ.lastCompletion; if (!lc) { EQ.toast('Complete a job first, then resend its request.'); return; } const r = EQ.api.completeJob(lc.id, lc.payload); EQ.toast(r.replayed ? 'Retry replayed: no duplicate completion or replacement was recorded' : r.message || 'Unexpected result'); EQ.log('retry of the same completion request: ' + (r.replayed ? 'replayed, nothing duplicated' : 'not replayed')); } }, 'Resend last completion (retry test)')),
        h('p', { class: 'small muted', style: 'margin:0' }, 'WebGL detected in this browser: ' + (S.webgl ? 'yes' : 'no') + '. The placeholder preview itself uses no WebGL. Fixtures built ' + EQ.fmtInstantShort(S.D.builtAt) + '.'),
        h('div', null, h('h4', null, 'Event log (simulated server, requests, audit)'), h('ul', { class: 'log', 'aria-label': 'Prototype event log', tabindex: '0' }, S.log.length ? S.log.slice(0, 25).map((l) => h('li', null, l)) : h('li', null, 'No events yet'))))];
  }

  // ---------------- render with focus/scroll preservation ----------------
  let rendering = false;
  function render() {
    if (rendering || !mainEl) return;
    rendering = true;
    try {
      EQ.route = parse();
      const ae = document.activeElement;
      const inMain = ae && (mainEl.contains(ae) || controlsEl.contains(ae) || navEl.contains(ae) || bannerEl.contains(ae));
      const fk = inMain && ae.dataset ? ae.dataset.fk : null;
      const selStart = ae && 'selectionStart' in ae ? ae.selectionStart : null, selEnd = ae && 'selectionEnd' in ae ? ae.selectionEnd : null;
      const scroll = {}; document.querySelectorAll('.tree-panel,.side-panel,.pc').forEach((n) => { scroll[n.className.split(' ')[0]] = n.scrollTop; });
      const wy = window.scrollY;
      const r = EQ.route;
      const firstRender = lastPath === null;
      const pathChanged = lastPath !== r.path.split('/').slice(0, 3).join('/');

      let view;
      if (r.name === 'equipment' && r.segs[1]) view = EQ.views.equipment(r.segs[1], r.query);
      else if (r.name === 'jobs' && r.segs[1]) view = EQ.views.job(r.segs[1]);
      else if (r.name === 'jobs') view = EQ.views.jobs(r.query);
      else if (r.name === 'admin') view = EQ.views.admin(r.segs[1] || 'equipment', r.query);
      else view = EQ.views.fleet(r.query);
      mainEl.replaceChildren(view);
      paintChrome();

      const titles = { fleet: 'Fleet', equipment: 'Equipment', jobs: r.segs[1] ? 'Job record' : 'Jobs', admin: 'Admin' };
      document.title = 'EQ Maintenance prototype - ' + (titles[r.name] || 'Fleet');
      if (pathChanged) { lastPath = r.path.split('/').slice(0, 3).join('/'); window.scrollTo(0, 0); liveEl.textContent = 'Page: ' + (titles[r.name] || 'Fleet'); if (!fk && !firstRender) mainEl.focus({ preventScroll: true }); }
      else { window.scrollTo(0, wy); document.querySelectorAll('.tree-panel,.side-panel,.pc').forEach((n) => { const v = scroll[n.className.split(' ')[0]]; if (v) n.scrollTop = v; }); }
      if (fk) {
        const el = document.querySelector('[data-fk="' + fk + '"]');
        if (el) { el.focus({ preventScroll: true }); if (selStart != null && el.setSelectionRange && el.type !== 'checkbox' && el.type !== 'date' && el.type !== 'search') { try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* ignore */ } } else if (selStart != null && el.type === 'search') { try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* ignore */ } } }
      }
    } finally { rendering = false; }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && EQ.eqUI && EQ.eqUI.drawer && !document.querySelector('dialog[open]')) EQ.closeDrawer();
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
    document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach((el) => { if (!name(el)) issues.push('Unlabelled control: ' + el.outerHTML.slice(0, 90)); });
    document.querySelectorAll('button,a[href],[role=button],[role=tab],[role=treeitem]').forEach((el) => { if (!name(el)) issues.push('No accessible name: ' + el.outerHTML.slice(0, 90)); });
    const ids = {}; document.querySelectorAll('[id]').forEach((el) => { ids[el.id] = (ids[el.id] || 0) + 1; });
    Object.entries(ids).forEach(([k, n]) => { if (n > 1) issues.push('Duplicate id ' + k); });
    document.querySelectorAll('[tabindex]').forEach((el) => { if (Number(el.getAttribute('tabindex')) > 0) issues.push('Positive tabindex: ' + el.outerHTML.slice(0, 60)); });
    document.querySelectorAll('[aria-describedby],[aria-labelledby]').forEach((el) => { (el.getAttribute('aria-describedby') || el.getAttribute('aria-labelledby')).split(/\s+/).forEach((i) => { if (!document.getElementById(i)) issues.push('aria reference to missing id ' + i); }); });
    const canvases = document.querySelectorAll('canvas').length;
    const hasH1 = document.querySelectorAll('h1').length;
    return { route: location.hash, issues, canvases, h1: hasH1, focusable: document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex="0"]').length };
  };

  // ---------------- init ----------------
  function init() {
    const sp = new URLSearchParams(location.search);
    if (['admin', 'eqTeam', 'management'].includes(sp.get('role'))) S.role = sp.get('role');
    if (['normal', 'loading', 'empty', 'stale', 'error'].includes(sp.get('data'))) S.data = sp.get('data');
    if (['preview', 'loading', 'nowebgl', 'contextlost', 'loadfailed'].includes(sp.get('viewer'))) S.viewer = sp.get('viewer');
    if (sp.get('controls') === '1') controlsOpen = true;
    try { const c = document.createElement('canvas'); S.webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { S.webgl = false; }
    EQ.reset();
    buildShell();
    EQ.route = parse();
    render();
    setInterval(() => { if (S.data === 'normal') EQ.refresh(false); }, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.EQ);
