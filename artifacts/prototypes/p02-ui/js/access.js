/* P02B: Portal roles, the in-app Access matrix, personas, sections/tabs and landing (DATA_CONTRACT s6, s14; API s4.17).
   SIMULATION: there is no sign-in. The persona switch stands in for the Portal role assignment. Two views of the matrix exist on
   purpose: the server-side check (live matrix, EQ.access.srv) and the UI session snapshot (EQ.access.has, refreshed at most every
   60 s, on a persona switch and after any 403 feature_disabled), so the prototype can show that a switched-off tab is blocked on the
   "API" before the UI has caught up (ACC02). */
window.EQ = window.EQ || {};
(function (EQ) {
  const ROLES = { admin: 'Admin', management: 'Management', eqTeam: 'EQ Team', facTeam: 'FAC Team' };
  // Ceiling per role: F = fixed on, T1 = toggle (default on), T0 = toggle (default off), N = above the ceiling.
  const FEATURES = [
    ['eq.fleet.view', 'EQ Fleet tab and equipment detail (view)', { admin: 'F', eqTeam: 'F', facTeam: 'T1', management: 'T1' }],
    ['eq.jobs.view', 'EQ Jobs tab (view)', { admin: 'F', eqTeam: 'F', facTeam: 'T1', management: 'T1' }],
    ['eq.work', 'EQ work: special jobs, status correction, spare-part condition', { admin: 'F', eqTeam: 'F', facTeam: 'N', management: 'N' }],
    ['eq.work.admin', 'EQ corrections: reopen completed work, cancel any job, void register entries', { admin: 'F', eqTeam: 'N', facTeam: 'N', management: 'N' }],
    ['fac.dashboard.view', 'FAC Dashboard (view)', { admin: 'F', eqTeam: 'T1', facTeam: 'F', management: 'T1' }],
    ['fac.jobs.view', 'FAC Jobs tab (view)', { admin: 'F', eqTeam: 'T1', facTeam: 'F', management: 'T1' }],
    ['fac.work', 'FAC work: update progress, hold, photos', { admin: 'F', eqTeam: 'N', facTeam: 'F', management: 'N' }],
    ['fac.oneTimeJobs.add', 'FAC: add one-time jobs', { admin: 'F', eqTeam: 'N', facTeam: 'T1', management: 'N' }],
    ['fac.masterList.manage', 'FAC: manage the master job list (add, edit, deactivate recurring jobs)', { admin: 'F', eqTeam: 'N', facTeam: 'T0', management: 'N' }],
    ['fac.work.admin', 'FAC corrections: cycles, Admin due date, remove any photo', { admin: 'F', eqTeam: 'N', facTeam: 'N', management: 'N' }],
    ['export.excel', 'Export to Excel', { admin: 'F', eqTeam: 'T1', facTeam: 'T1', management: 'T1' }],
    ['admin.access', 'Admin pages (EQ settings, FAC settings, Access)', { admin: 'F', eqTeam: 'N', facTeam: 'N', management: 'N' }],
  ];
  const FEATURE_KEYS = FEATURES.map((f) => f[0]);
  const CEIL = Object.fromEntries(FEATURES.map((f) => [f[0], f[2]]));

  // Personas = what the Portal role assignment would give a signed-in user. noAccess is a Management user whose four view
  // tabs have been switched off (the override is local to this persona so the other personas are unaffected).
  const ALL_VIEWS_OFF = ['eq.fleet.view', 'eq.jobs.view', 'fac.dashboard.view', 'fac.jobs.view'];
  const PERSONAS = {
    admin: { label: 'Admin', roles: ['admin'], hint: 'everything, both sections, Admin' },
    management: { label: 'Management', roles: ['management'], hint: 'read-only in both sections' },
    eqTeam: { label: 'EQ Team', roles: ['eqTeam'], hint: 'works on EQ, reads FAC' },
    facTeam: { label: 'FAC Team', roles: ['facTeam'], hint: 'works on FAC, reads EQ' },
    eqfac: { label: 'EQ Team + FAC Team', roles: ['eqTeam', 'facTeam'], hint: 'works in both sections' },
    noAccess: { label: 'All tabs switched off', roles: ['management'], off: { management: ALL_VIEWS_OFF }, hint: 'Management with the four view tabs switched off in Admin > Access' },
  };
  EQ.PERSONAS = PERSONAS;
  EQ.ROLE_LABEL_V2 = ROLES;

  function freshAccess() { return { version: 1, entries: {}, changes: [], updatedUtc: null, updatedBy: null }; }
  const A = () => EQ.state.D.access;
  const key = (role, f) => role + '|' + f;
  function defaultOn(role, f) { const c = CEIL[f][role]; return c === 'F' || c === 'T1'; }

  /** The state of one matrix cell: ceiling kind ('fixed' | 'toggle' | 'no') and whether it is effectively on. */
  function cell(role, f, matrix) {
    const c = CEIL[f][role];
    if (c === 'F') return { kind: 'fixed', on: true };
    if (c === 'N') return { kind: 'no', on: false };
    const m = (matrix || A()).entries;
    const v = Object.prototype.hasOwnProperty.call(m, key(role, f)) ? m[key(role, f)] : defaultOn(role, f);
    return { kind: 'toggle', on: !!v, default: defaultOn(role, f) };
  }

  /** Effective feature set for a persona against a matrix: union over held roles of fixed cells and toggles that are on. */
  function effective(personaKey, matrix) {
    const p = PERSONAS[personaKey];
    const out = new Set();
    p.roles.forEach((r) => FEATURE_KEYS.forEach((f) => {
      const c = cell(r, f, matrix);
      if (!c.on) return;
      if (p.off && p.off[r] && p.off[r].includes(f)) return; // persona-local override (never widens)
      out.add(f);
    }));
    return out;
  }

  /** Tabs and sections for a feature set (DATA_CONTRACT s14.1). */
  function layout(features) {
    const has = (f) => features.has(f);
    const eq = [];
    if (has('eq.fleet.view')) eq.push({ id: 'fleet', label: 'Fleet', path: '/eq/fleet', icon: 'home', feature: 'eq.fleet.view' });
    if (has('eq.jobs.view')) eq.push({ id: 'jobs', label: 'Jobs', path: '/eq/jobs/special', icon: 'list', feature: 'eq.jobs.view' });
    const fac = [];
    if (has('fac.dashboard.view')) fac.push({ id: 'dashboard', label: 'FAC Dashboard', path: '/fac/dashboard', icon: 'board', feature: 'fac.dashboard.view' });
    if (has('fac.jobs.view')) fac.push({ id: 'jobs', label: 'FAC Jobs', path: '/fac/jobs', icon: 'list', feature: 'fac.jobs.view' });
    const admin = has('admin.access');
    return { eq, fac, admin, noAccess: !eq.length && !fac.length && !admin };
  }

  function featureForRoute(path) {
    if (path.startsWith('/eq/fleet') || path.startsWith('/eq/equipment')) return 'eq.fleet.view';
    if (path.startsWith('/eq/jobs')) return 'eq.jobs.view';
    if (path.startsWith('/fac/dashboard')) return 'fac.dashboard.view';
    if (path.startsWith('/fac/jobs')) return 'fac.jobs.view';
    if (path.startsWith('/admin')) return 'admin.access';
    return null;
  }

  let snapshot = null; // { persona, features:Set, at }
  function refreshSession(reason) {
    const S = EQ.state;
    snapshot = { persona: S.role, features: effective(S.role), at: Date.now() };
    if (reason) EQ.log('session re-read (' + reason + '): ' + snapshot.features.size + ' features');
    return snapshot;
  }
  function snap() { if (!snapshot || snapshot.persona !== EQ.state.role) refreshSession('persona switch'); return snapshot; }

  const fail = (status, code, message, extra) => ({ ok: false, status, code, message, ...(extra || {}) });

  EQ.access = {
    ROLES, FEATURES, FEATURE_KEYS, CEIL, cell: (r, f) => cell(r, f), effectiveFor: effective, layoutFor: layout,
    fresh: freshAccess,
    /** UI session view (what the tabs and buttons use). */
    has: (f) => snap().features.has(f),
    ui: (f) => snap().features.has(f),
    /** Live server-side check; returns null when allowed, else a refusal object (403 feature_disabled / forbidden_role). */
    srv(f) {
      const live = effective(EQ.state.role);
      if (live.has(f)) return null;
      const p = PERSONAS[EQ.state.role];
      const ceilingAllows = p.roles.some((r) => CEIL[f][r] === 'T1' || CEIL[f][r] === 'T0' || CEIL[f][r] === 'F');
      if (ceilingAllows) { return fail(403, 'feature_disabled', 'This feature is switched off for your role in Admin > Access (403 feature_disabled).', { feature: f }); }
      return fail(403, 'forbidden_role', 'No role you hold allows this (403 forbidden_role).', { feature: f });
    },
    features: () => snap().features,
    layout: () => layout(snap().features),
    featureForRoute,
    refreshSession,
    sessionAt: () => (snapshot ? snapshot.at : null),
    persona: () => PERSONAS[EQ.state.role],
    session() {
      const f = snap().features, l = layout(f);
      return { features: [...f], sections: { eq: l.eq.map((t) => t.id), fac: l.fac.map((t) => t.id), admin: l.admin }, noAccess: l.noAccess, landing: EQ.access.landing() };
    },
    /** Landing (D-90): last used permitted route (path only, localStorage), else the role default, else first permitted tab. */
    landing() {
      const l = layout(snap().features);
      const tabs = [...l.eq, ...l.fac];
      if (l.noAccess) return '/no-access';
      const permitted = (p) => { const f = featureForRoute(p); return f && snap().features.has(f); };
      const last = EQ.access.readLast();
      if (last && permitted(last)) return last;
      const p = PERSONAS[EQ.state.role];
      const onlyFac = p.roles.length === 1 && p.roles[0] === 'facTeam';
      const pref = onlyFac ? '/fac/dashboard' : '/eq/fleet';
      if (permitted(pref)) return pref;
      const order = ['/eq/fleet', '/eq/jobs/special', '/fac/dashboard', '/fac/jobs'];
      return order.find(permitted) || (l.admin ? '/admin/access' : '/no-access');
    },
    lastKey: () => 'eq-maintenance:last-route:' + EQ.user().id,
    readLast() { try { const v = localStorage.getItem(EQ.access.lastKey()); return v && /^\/[a-z/-]*$/.test(v) ? v : null; } catch (e) { return null; } },
    writeLast(path) { try { localStorage.setItem(EQ.access.lastKey(), path); } catch (e) { /* private window or blocked storage: role default is used */ } },
    clearLast() { try { Object.keys(localStorage).filter((k) => k.startsWith('eq-maintenance:last-route:')).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ } },

    /** Admin saves matrix changes atomically (DATA s14.5). changes = [{role, feature, on}] */
    save(changes, version, reason) {
      const deny = EQ.access.srv('admin.access');
      if (deny) return deny;
      const m = A();
      if (version !== m.version) return fail(409, 'version_conflict', 'The matrix changed since you opened it (version ' + m.version + '). Reload and review.');
      const bad = changes.filter((c) => !CEIL[c.feature] || CEIL[c.feature][c.role] === 'F' || CEIL[c.feature][c.role] === 'N' || !(c.role in ROLES));
      if (bad.length) return fail(422, 'access_cell_not_toggleable', 'Refused as a whole: ' + bad.map((b) => b.role + ' / ' + b.feature).join(', ') + ' is not a toggleable cell (fixed by the Portal role or above its ceiling).', { cells: bad });
      const real = changes.filter((c) => cell(c.role, c.feature).on !== !!c.on);
      if (!real.length) return { ok: true, version: m.version, changed: 0 };
      m.version += 1; m.updatedUtc = new Date().toISOString(); m.updatedBy = EQ.user().id;
      real.forEach((c) => {
        const old = cell(c.role, c.feature).on;
        m.entries[key(c.role, c.feature)] = !!c.on;
        m.changes.unshift({ version: m.version, role: c.role, feature: c.feature, oldOn: old, newOn: !!c.on, reason: (reason || '').trim() || null, by: EQ.user().id, at: m.updatedUtc });
      });
      EQ.log('audit: access.change x' + real.length + ' (matrix version ' + m.version + '; takes effect at users\' next session read, within 60 s)');
      EQ.notify();
      return { ok: true, version: m.version, changed: real.length };
    },
    reset() { EQ.state.D.access = freshAccess(); refreshSession('matrix reset'); },
  };
})(window.EQ);
