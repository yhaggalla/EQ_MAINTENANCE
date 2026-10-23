// P02B browser checks for the V2 interface prototype (headless Chrome through the DevTools protocol).
// Needs the prototype server:  node artifacts/prototypes/p02-ui/serve.mjs   (http://127.0.0.1:5312/)
// Usage: node tools/p02b/check_p02b.mjs [baseUrl] [outJson] [--only=A,B]
// PROTOTYPE-LEVEL evidence only: synthetic in-memory data, no sign-in, no persistence, no ZMMS contact. A PASS here supports the cited
// acceptance IDs at prototype level; it does not execute them against the real app (those stay NOT RUN until P09-P11).
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p02/cdp.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const base = args[0] || 'http://127.0.0.1:5312/';
const outFile = args[1] || 'docs/evidence/P02B/p02b-browser-checks.json';
const results = [];
const rec = (id, ids, name, ok, detail) => { results.push({ id, covers: ids, name, status: ok ? 'PASS' : 'FAIL', detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '') }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + name + (detail ? ' - ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, ok ? 220 : 700) : '')); };
const url = (q, hash) => base + '?' + new URLSearchParams(q).toString() + '#' + hash;
const Q1 = 'eq-qc-demo-01', Q2 = 'eq-qc-demo-02';

const b = await launch({ port: 9370 });
await b.send('Network.enable');
await b.send('Emulation.setFocusEmulationEnabled', { enabled: true }); // headless pages are unfocused otherwise and element.focus() fires no focus events
{ const rawGoto = b.goto; b.goto = async (u) => { await rawGoto(u); await b.send('Emulation.setFocusEmulationEnabled', { enabled: false }); await b.send('Emulation.setFocusEmulationEnabled', { enabled: true }); }; } // a navigation resets the emulation
const go = async (role, hash, extra = {}, wait = 500) => { b.clearEvents(); await b.goto(url({ role, ...extra }, hash)); await b.wait(wait); };
const ev = (expr) => b.eval(expr);
const text = (sel) => b.eval(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const exists = (sel) => b.eval(`!!document.querySelector(${JSON.stringify(sel)})`);
const count = (sel) => b.eval(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const step = async (id, ids, name, fn) => { if (only.length && !only.some((o) => id.startsWith(o))) return; try { const r = await fn(); rec(id, ids, name, r === true || (r && r.ok), r && r.detail); } catch (e) { rec(id, ids, name, false, 'EXCEPTION ' + e.message); } };
const near = (a, c, tol) => Math.abs(a - c) <= tol;

try {
  console.log('Browser:', b.browser);
  await b.viewport(1920, 1080);

  // =============================================================== A. shell, sections, tabs, landing
  const topbar = () => ev(`(()=>{const sw=[...document.querySelectorAll('.section-switch .sec-link')].map(a=>a.textContent+(a.getAttribute('aria-current')==='true'?'*':'')); const tabs=[...document.querySelectorAll('.topnav .nav-link')].map(a=>a.textContent.trim()); return {switchVisible:!document.querySelector('.section-switch').hidden && sw.length>0, sw, tabs, ro:!!document.querySelector('.readonly-chip'), hash:location.hash.replace('#','').split('?')[0], title:document.title, brand:document.querySelector('.logo-copy strong').textContent, persona:document.querySelector('.topbar-right').textContent}})()`);
  await step('A01', ['ACC01', 'S18'], 'Top bar per persona: section switch, per-section tabs, Admin link, read-only chip, app name EQ & FAC Maintenance', async () => {
    const out = {};
    for (const role of ['admin', 'management', 'eqTeam', 'facTeam', 'eqfac', 'noAccess']) { await ev('try{localStorage.clear()}catch(e){}'); await go(role, '/'); out[role] = await topbar(); }
    const eqTabs = (o) => o.tabs.filter((t) => ['Fleet', 'Jobs'].includes(t)).length === 2, facTabs = (o) => o.tabs.includes('FAC Dashboard') && o.tabs.includes('FAC Jobs');
    const A = out.admin, M = out.management, E = out.eqTeam, F = out.facTeam, X = out.eqfac, N = out.noAccess;
    const ok = A.switchVisible && A.tabs.includes('Admin') && A.tabs.includes('Fleet') && !A.ro && A.hash === '/eq/fleet'
      && M.switchVisible && !M.tabs.includes('Admin') && M.ro && M.hash === '/eq/fleet'
      && E.switchVisible && !E.tabs.includes('Admin') && E.hash === '/eq/fleet'
      && F.switchVisible && F.hash === '/fac/dashboard' && F.tabs.includes('FAC Dashboard') && facTabs(F) && !F.tabs.includes('Admin')
      && X.switchVisible && X.hash === '/eq/fleet' && !X.ro && !X.tabs.includes('Admin')
      && !N.switchVisible && N.tabs.length === 0 && N.hash === '/no-access'
      && Object.values(out).every((o) => o.brand === 'EQ & FAC Maintenance' && /EQ & FAC Maintenance/.test(o.title));
    return { ok, detail: JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, o]) => [k, { sw: o.sw.join('/'), tabs: o.tabs.join('|'), ro: o.ro, landing: o.hash }]))) };
  });
  await step('A02', ['ACC01', 'ACC05', 'S18'], 'A user whose four view tabs are switched off sees the No access page (not an error): role text, no tabs, no switch, no 403 shell', async () => {
    await go('noAccess', '/eq/fleet');
    const t = await text('main'); const tb = await topbar();
    await go('noAccess', '/fac/jobs'); const t2 = await text('main'); const h2 = await ev('location.hash');
    return { ok: /No access - contact the EQ & FAC Maintenance Admin/.test(t) && /not an error/.test(t) && tb.tabs.length === 0 && !tb.switchVisible && /No access/.test(t2) && !(await exists('[role=alert]')), detail: 'route /eq/fleet and /fac/jobs both show the No access page' };
  });
  await step('A03', ['ACC01', 'S18'], 'First-visit landing: FAC Team lands on FAC Dashboard; EQ Team + FAC Team and every other role on EQ Fleet; last used tab restores; storage failure falls back to the role default', async () => {
    const land = async (role, pre) => { await ev('try{localStorage.clear()}catch(e){}'); if (pre) { await go(role, pre); } await go(role, '/'); return ev('location.hash.replace("#","").split("?")[0]'); };
    const r = { fac: await land('facTeam'), eqfac: await land('eqfac'), mgmt: await land('management'), admin: await land('admin') };
    // last used: facTeam visits FAC Jobs, then opens the app root again
    await ev('try{localStorage.clear()}catch(e){}'); await go('eqfac', '/fac/jobs'); await b.wait(200);
    const stored = await ev(`JSON.stringify(Object.entries(localStorage).filter(([k])=>k.startsWith('eq-maintenance:last-route:')))`);
    await b.goto(url({ role: 'eqfac' }, '/')); await b.wait(500); const last = await ev('location.hash.replace("#","").split("?")[0]');
    // path only is stored (no query value, no record data)
    const pathOnly = !/[?=]/.test(stored.replace(/\[|\]|"|,|:/g, ''));
    // storage failure: make localStorage throw, role default is used
    const inj = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})` });
    await b.goto(url({ role: 'facTeam' }, '/')); await b.wait(600); const blocked = await ev('location.hash.replace("#","").split("?")[0]'); const errs = b.errors();
    await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: inj.identifier });
    return { ok: r.fac === '/fac/dashboard' && r.eqfac === '/eq/fleet' && r.mgmt === '/eq/fleet' && r.admin === '/eq/fleet' && last === '/fac/jobs' && pathOnly && blocked === '/fac/dashboard' && !errs.length, detail: JSON.stringify({ ...r, last, stored: stored.slice(0, 120), blocked, errs }) };
  });
  // fresh browser state for later checks (the injected script above is per-page-load; navigate resets nothing else, so reload a clean page)
  await step('A04', ['ACC01', 'ACC02', 'S18'], 'Section switch is hidden when only one section is permitted; a switched-off tab answers 403 feature_disabled on its direct route; Admin pages answer 403 forbidden_role', async () => {
    await go('admin', '/admin/access');
    const r = await ev(`EQ.access.save([{role:'management',feature:'fac.dashboard.view',on:false},{role:'management',feature:'fac.jobs.view',on:false}], EQ.state.D.access.version, 'check A04')`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/fleet',{})`); await b.wait(400);
    const t = await topbar();
    await ev(`EQ.nav('/fac/dashboard',{})`); await b.wait(400); const m = await text('main');
    await ev(`EQ.nav('/admin/eq/equipment',{})`); await b.wait(400); const adm = await text('main');
    return { ok: r.ok && !t.switchVisible && !t.tabs.some((x) => /FAC/.test(x)) && t.tabs.includes('Fleet') && /403/.test(m) && /feature_disabled/.test(m) && /403/.test(adm) && /forbidden_role/.test(adm), detail: JSON.stringify({ save: r.ok, tabs: t.tabs, sw: t.switchVisible, fac: m.slice(0, 80), admin: adm.slice(0, 90) }) };
  });

  // =============================================================== B. Access matrix
  const asRole = (role) => ev(`(EQ.state.role='${role}', EQ.access.refreshSession('check'), true)`);
  await step('B01', ['ACC02', 'S19'], 'Switching a view tab off for Management: the server refuses at once (403 feature_disabled), the UI follows at its next session read, exports and direct routes are blocked, the change is audited (actor, time, old -> new), switching it on restores access', async () => {
    await go('admin', '/admin/access');
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/jobs/special',{})`); await b.wait(300);
    const before = { tab: (await topbar()).tabs.includes('Jobs'), srv: await ev(`EQ.access.srv('eq.jobs.view')`) };
    // Admin saves while Management's UI snapshot is still the old one (the live matrix is read by the server on every request)
    const save = await ev(`(()=>{const keep=EQ.state.role; EQ.state.role='admin'; const r=EQ.access.save([{role:'management',feature:'eq.jobs.view',on:false}], EQ.state.D.access.version, 'check B01'); EQ.state.role=keep; return r;})()`);
    const staleUi = await ev(`({ui: EQ.access.has('eq.jobs.view'), srv: EQ.access.srv('eq.jobs.view'), exp: EQ.eqExport('special',{})})`);
    await ev(`EQ.access.refreshSession('60 s poll'); EQ.rerender()`); await b.wait(400);
    const after = { tab: (await topbar()).tabs.includes('Jobs'), page: await text('main') };
    const log = await ev(`EQ.state.D.access.changes[0]`);
    // switch it on again
    await ev(`(()=>{const keep=EQ.state.role; EQ.state.role='admin'; EQ.access.save([{role:'management',feature:'eq.jobs.view',on:true}], EQ.state.D.access.version, 'restore'); EQ.state.role=keep; EQ.access.refreshSession('poll'); EQ.rerender();})()`); await b.wait(300);
    const restored = (await topbar()).tabs.includes('Jobs');
    const ok = before.tab && !before.srv && save.ok && staleUi.srv && staleUi.srv.status === 403 && staleUi.srv.code === 'feature_disabled' && staleUi.exp.status === 403
      && !after.tab && /403/.test(after.page) && /feature_disabled/.test(after.page) && log && log.role === 'management' && log.feature === 'eq.jobs.view' && log.oldOn === true && log.newOn === false && log.by === 'u-admin' && !!log.at && restored;
    return { ok, detail: JSON.stringify({ before, serverRefusedAtOnce: { api: staleUi.srv && staleUi.srv.code, export: staleUi.exp.status }, afterTab: after.tab, log, restored, note: 'UI lag (60 s session read) is a design rule; a single browser page cannot show a stale second session' }) };
  });
  await step('B02', ['ACC03', 'S19', 'AUTH03'], 'The matrix never widens a Portal ceiling: Management write, FAC Team EQ write, EQ Team FAC write, any role Admin pages and any Admin cell are refused as a whole (422 access_cell_not_toggleable), nothing stored; only the 13 toggleable cells have switches', async () => {
    await go('admin', '/admin/access');
    const sw = await count('.access-matrix input[data-switch]');
    const r = await ev(`(()=>{const v=EQ.state.D.access.version; const S=(c)=>EQ.access.save(c, EQ.state.D.access.version, 'x');
      const bad=[['management','eq.work'],['management','fac.work'],['facTeam','eq.work'],['eqTeam','fac.work'],['eqTeam','admin.access'],['facTeam','admin.access'],['management','admin.access'],['admin','eq.fleet.view'],['admin','admin.access']].map(([role,feature])=>{const x=S([{role,feature,on:true},{role,feature,on:false}]); return [role+'|'+feature, x.status+' '+x.code];});
      const mixed=S([{role:'management',feature:'eq.fleet.view',on:false},{role:'management',feature:'eq.work',on:true}]);
      return {bad, mixed:[mixed.status, mixed.code], versionSame: EQ.state.D.access.version===v, fleetStillOn: EQ.access.cell('management','eq.fleet.view').on, changes: EQ.state.D.access.changes.length};})()`);
    // Management and EQ Team cannot call the matrix command at all
    const roles = await ev(`(()=>{const out={}; for (const r of ['management','eqTeam','facTeam']) { EQ.state.role=r; out[r]=EQ.access.save([{role:'management',feature:'eq.fleet.view',on:false}], 1, 'x').status; } EQ.state.role='admin'; return out;})()`);
    const ok = sw === 13 && r.bad.every(([, v]) => v === '422 access_cell_not_toggleable') && r.mixed[0] === 422 && r.versionSame && r.fleetStillOn && r.changes === 0 && Object.values(roles).every((v) => v === 403);
    return { ok, detail: JSON.stringify({ switches: sw, refused: r.bad.length, mixed: r.mixed, versionSame: r.versionSame, roles }) };
  });
  await step('B03', ['ACC04', 'S19', 'S23'], 'Granting FAC Team "manage master list" lets it add a recurring job through the API; revoking it makes the same request fail on the server', async () => {
    await go('admin', '/admin/access');
    const mk = `EQ.fac.api.createJob({kind:'recurring', discipline:'civil', typeCode:'inspection', name:'Check job B03', freqCode:'monthly', quantity:1})`;
    const r = await ev(`(()=>{const out={}; EQ.state.role='facTeam'; EQ.access.refreshSession('t'); out.before=${mk};
      EQ.state.role='admin'; out.grant=EQ.access.save([{role:'facTeam',feature:'fac.masterList.manage',on:true}], EQ.state.D.access.version,'grant');
      EQ.state.role='facTeam'; EQ.access.refreshSession('t'); out.after=${mk};
      EQ.state.role='admin'; out.revoke=EQ.access.save([{role:'facTeam',feature:'fac.masterList.manage',on:false}], EQ.state.D.access.version,'revoke');
      EQ.state.role='facTeam'; EQ.access.refreshSession('t'); out.again=${mk}; EQ.state.role='admin'; EQ.access.refreshSession('t');
      return {before:[out.before.status,out.before.code], grant:out.grant.ok, after:[out.after.ok, out.after.job && out.after.job.name], revoke:out.revoke.ok, again:[out.again.status,out.again.code]};})()`);
    return { ok: r.before[0] === 403 && r.grant && r.after[0] === true && r.revoke && r.again[0] === 403 && r.again[1] === 'feature_disabled', detail: JSON.stringify(r) };
  });
  await step('B04', ['ACC03', 'FAC11', 'AUTH03', 'S11'], 'Role write matrix on the simulated server: Management refused for EQ and FAC writes; EQ Team refused for FAC writes and Admin pages; FAC Team refused for EQ writes and Admin pages; one-time FAC jobs allowed for FAC Team by default', async () => {
    await go('admin', '/fleet');
    const r = await ev(`(()=>{const out={};
      const eqW=()=>EQ.api.createJob({equipmentId:'${Q2}',kind:'repair',title:'role probe',level:'equipment'}); const eqS=()=>EQ.api.setStatus('${Q2}',{status:'maintenance',reason:'probe'});
      const facW=()=>EQ.fac.api.hold('fj-3','probe'); const facP=()=>EQ.fac.api.progress('fj-3',{qty:1,key:'probe-'+Math.random()}); const sync=()=>EQ.zmms.syncNow({}); const ap=()=>EQ.access.save([],1,'');
      const oneT=()=>EQ.fac.api.createJob({kind:'oneTime',discipline:'civil',typeCode:'inspection',name:'one time probe',quantity:1});
      const code=(f)=>{const x=f(); return x.ok===false||x.status>=400 ? x.status : 'ok';};
      for (const r of ['management','eqTeam','facTeam']) { EQ.state.role=r; EQ.access.refreshSession('t'); out[r]={eqJob:code(eqW), eqStatus:code(eqS), facHold:code(facW), facProgress:code(facP), zmmsSync:code(sync), access:code(ap), oneTime:code(oneT)}; }
      EQ.state.role='admin'; EQ.access.refreshSession('t'); return out;})()`);
    const M = r.management, E = r.eqTeam, F = r.facTeam;
    const ok = Object.values(M).every((v) => v === 403) && E.eqJob === 'ok' && E.eqStatus === 'ok' && E.facHold === 403 && E.facProgress === 403 && E.zmmsSync === 403 && E.access === 403 && E.oneTime === 403
      && F.eqJob === 403 && F.eqStatus === 403 && F.facHold !== 403 && F.zmmsSync === 403 && F.access === 403 && F.oneTime === 'ok';
    return { ok, detail: JSON.stringify(r) };
  });

  // Repair-R02B finding 1: a switched-off tab must be blocked on the data reads, not only on the route (B01 only called EQ.access.srv)
  await step('B05', ['ACC02', 'S19', 'S07', 'HIS06'], 'EQ Jobs off with Fleet on: history/list/record/export refuse; a reopened job exposes only allowlisted current fields and matching position IDs while retaining its source history; no job links or history render in the crane tabs [Repair-R02B round 2; adapted to U1-C23: completed jobs listed with the same allowlist plus completedOn/listedOn]', async () => {
    await go('admin', '/admin/access');
    const reopened = await ev(`EQ.api.reopenJob('job-101','B05: prior completion must stay in Jobs history').ok`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/fleet',{})`); await b.wait(300);
    // Admin saves while Management's UI snapshot still shows the Jobs tab
    const save = await ev(`(()=>{const keep=EQ.state.role; EQ.state.role='admin'; const r=EQ.access.save([{role:'management',feature:'eq.jobs.view',on:false}], EQ.state.D.access.version, 'check B05'); EQ.state.role=keep; return r.ok;})()`);
    const reads = await ev(`(()=>{const sc={level:'equipment',id:null}; const h=EQ.history('${Q1}',sc,true), hp=EQ.history('${Q1}',{level:'part',id:'pp-q01-007'},true), js=EQ.readJobs(), j=EQ.readJob('job-101'), ex=EQ.eqExport('special',{}), cs=EQ.currentSpecial('${Q1}',sc);
      return {history:[h.status,h.code,'completed' in h], part:[hp.status,hp.code,'events' in hp], jobs:[js.status,js.code,'items' in js], job:[j.status,j.code,'job' in j], exp:ex.status,
        current:{ok:cs.ok, open:cs.ok?cs.openJobs.length:-1, listed:cs.ok?cs.jobs.length:-1, listsCompleted:cs.ok&&cs.openJobs.some(r=>r.job.workStatus==='completed'||r.job.isCancelled), listsCancelled:cs.ok&&cs.jobs.some(r=>r.job.isCancelled), jobKeys:cs.ok?[...new Set(cs.jobs.map(r=>JSON.stringify(Object.keys(r.job).sort())))]:[], counts:cs.counts, openInJobs:cs.openInJobs,
          reopened:cs.openJobs.find(r=>r.job.id==='job-101'), sourceHistoryKept:!!EQ.job('job-101').completedOn&&!!EQ.job('job-101').completionNote&&EQ.job('job-101').events.some(e=>e.kind==='reopened')}};})()`);
    // the record and board views themselves refuse to render data when the server read is refused (independent of the route gate)
    const rec = await ev(`EQ.views.job('job-101').textContent`); const board = await ev(`EQ.specialBoard({}).textContent`);
    await ev(`EQ.nav('/eq/jobs/special/job-101',{})`); await b.wait(500); const route = await text('main');
    await ev(`EQ.access.refreshSession('60 s poll'); EQ.rerender()`); await b.wait(300);
    const panel = {};
    for (const tab of ['maintenance', 'special', 'technical', 'spareParts']) {
      await ev(`EQ.nav('/eq/equipment/${Q1}',{panel:'${tab}'})`); await b.wait(600);
      panel[tab] = await ev(`({jobsLinks:[...document.querySelectorAll('.side-panel a, .eq-head a')].filter(a=>(a.getAttribute('href')||'').includes('eq/jobs')).length, nums:[...document.querySelectorAll('.side-panel [data-fk^="job-num-"]')].map(e=>e.textContent), off:!!document.querySelector('[data-fk^="jobs-tab-off-"]'), corr:/Correction history/.test(document.querySelector('.side-panel').textContent)})`);
    }
    await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'management',feature:'eq.jobs.view',on:true}], EQ.state.D.access.version,'restore'); EQ.access.refreshSession('restore');})()`);
    const R = reads, P = panel;
    // U1-C23 (round 6): the allowlist adds completedOn and listedOn (completed jobs are listed); nothing else
    const currentJobKeys = ['id','number','equipmentId','level','mainId','subId','positionId','kind','title','workStatus','plannedOn','completedOn','listedOn'].sort();
    const reopenedPayload = R.current.reopened;
    const payloadSafe = reopenedPayload && JSON.stringify(Object.keys(reopenedPayload.job).sort()) === JSON.stringify(currentJobKeys) && reopenedPayload.job.completedOn === null
      && R.current.jobKeys.length === 1 && R.current.jobKeys[0] === JSON.stringify(currentJobKeys) && !R.current.listsCancelled
      && reopenedPayload.matchingLines.length > 0 && reopenedPayload.matchingLines.every(l=>JSON.stringify(Object.keys(l)) === '["positionId"]');
    const ok = reopened && payloadSafe && R.current.sourceHistoryKept && save && R.history[0] === 403 && R.history[1] === 'feature_disabled' && !R.history[2] && R.part[0] === 403 && !R.part[2] && R.jobs[0] === 403 && !R.jobs[2] && R.job[0] === 403 && !R.job[2] && R.exp === 403
      && /403/.test(rec) && /feature_disabled/.test(rec) && !/Replace main hoist motor A/.test(rec) && /403/.test(board) && !/EQJ-/.test(board) && /403/.test(route) && /feature_disabled/.test(route)
      && R.current.ok && R.current.open >= 3 && !R.current.listsCompleted && R.current.counts.completed >= 1 && R.current.openInJobs === null
      && Object.values(P).every((t) => t.jobsLinks === 0 && !t.corr) && P.special.nums.length === R.current.listed && R.current.listed === R.current.open + R.current.counts.completed && P.special.off && P.maintenance.off && P.spareParts.off;
    return { ok, detail: JSON.stringify({ reads: R, recordView: rec.slice(0, 90), boardView: board.slice(0, 60), route: route.slice(0, 40), panel: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, { links: v.jobsLinks, plainNumbers: v.nums.length, offNote: v.off }])) }) };
  });
  await step('B06', ['ACC02', 'FAC12', 'S19', 'S27'], 'FAC Jobs switched off for Management while the Dashboard stays on: the FAC Jobs list, the full cycle list and the FAC export are refused (403); a dashboard row opens the read-only dashboard detail of an active job without FAC Jobs actions; a deactivated job is 404 there; the FAC Jobs route answers 403 [Repair-R02B findings 1 and 7]', async () => {
    await go('admin', '/admin/access');
    const prep = await ev(`(()=>{const act=EQ.state.D.fac.jobs.filter(j=>j.state==='active'); const victim=act[act.length-1].id; const d=EQ.fac.api.deactivate(victim,'check B06'); const s=EQ.access.save([{role:'management',feature:'fac.jobs.view',on:false}], EQ.state.D.access.version, 'check B06'); return {victim, deact:d.ok, save:s.ok};})()`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/fac/dashboard',{})`); await b.wait(1300);
    const reads = await ev(`(()=>{const F=EQ.fac; const a=EQ.state.D.fac.jobs.find(j=>j.state==='active'); const l=F.list({}), c=F.cycles(a.id), e=F.exportRows({}), d=F.detail(a.id), x=F.detail('${prep.victim}');
      return {list:[l.status,l.code], cycles:[c.status,c.code], exp:[e.status,e.code], detail:[d.ok,d.via], deactivated:[x.status,x.code]};})()`);
    const href = await ev(`document.querySelector('.lane .row-link').getAttribute('href')`);
    await ev(`location.hash=document.querySelector('.lane .row-link').getAttribute('href')`); await b.wait(800);
    const det = await ev(`({t:document.querySelector('main').textContent, note:!!document.querySelector('[data-fk="dash-detail-note"]'), back:!!document.querySelector('[data-fk="back-dashboard"]'), acts:document.querySelectorAll('main .eq-head .actions button, main [data-fk="job-pic"], main .btn-act').length})`);
    await ev(`EQ.nav('/fac/jobs',{})`); await b.wait(500); const route = await text('main');
    await ev(`EQ.nav('/fac/dashboard/jobs/${prep.victim}',{})`); await b.wait(500); const gone = await text('main');
    await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'management',feature:'fac.jobs.view',on:true}], EQ.state.D.access.version,'restore'); EQ.access.refreshSession('restore');})()`);
    const ok = prep.deact && prep.save && reads.list[0] === 403 && reads.cycles[0] === 403 && reads.exp[0] === 403 && reads.detail[0] === true && reads.detail[1] === 'dashboard' && reads.deactivated[0] === 404
      && /^#\/fac\/dashboard\/jobs\//.test(href) && det.note && det.back && det.acts === 0 && /Current cycle/.test(det.t) && /Timeline/.test(det.t) && /Previous cycles/.test(det.t)
      && /403/.test(route) && /feature_disabled/.test(route) && /404/.test(gone);
    return { ok, detail: JSON.stringify({ prep, reads, href, detail: { note: det.note, back: det.back, actions: det.acts }, route: route.slice(0, 80), deactivatedOnDashboardRoute: gone.slice(0, 60) }) };
  });

  // =============================================================== C. crane view right panel (U1-C19) in the flat view
  const tabsOf = () => ev(`[...document.querySelectorAll('.side-panel [role=tab]')].map(t=>({k:t.dataset.fk.replace('tab-',''), label:t.textContent.replace(/\\d+$/,'').trim(), sel:t.getAttribute('aria-selected'), tab:t.getAttribute('tabindex'), w:Math.round(t.getBoundingClientRect().width)}))`);
  const panelText = () => text('.side-panel .sp-body');
  await step('C01', ['U1-C19', 'S07', 'HIS06'], 'Flat view right panel has exactly four tabs - Maintenance, Projects/Special, Technical, Spare parts - in a tablist; default Maintenance; every tab name fully visible at 1920 and 1366', async () => {
    const out = {};
    for (const [w, h] of [[1920, 1080], [1366, 768]]) {
      await b.viewport(w, h); await go('eqTeam', `/eq/equipment/${Q1}`);
      const tabs = await tabsOf(); const clipped = await ev(`[...document.querySelectorAll('.side-panel [role=tab]')].some(t=>t.scrollWidth>t.clientWidth+1)`);
      const sideBox = await ev(`(()=>{const p=document.querySelector('.side-panel').getBoundingClientRect(); return [...document.querySelectorAll('.side-panel [role=tab]')].every(t=>{const r=t.getBoundingClientRect(); return r.left>=p.left-1 && r.right<=p.right+1})})()`);
      out[w] = { names: tabs.map((t) => t.label).join('|'), selected: tabs.filter((t) => t.sel === 'true').map((t) => t.k).join(), clipped, inside: sideBox };
    }
    await b.viewport(1920, 1080);
    const ok = Object.values(out).every((o) => o.names === 'Maintenance|Projects/Special|Technical|Spare parts' && o.selected === 'maintenance' && !o.clipped && o.inside);
    return { ok, detail: JSON.stringify(out) };
  });
  await step('C02', ['U1-C19', 'U1-C23', 'S07', 'HIS06', 'SP04'], 'The crane view shows current state only: no tab contains work history (installation events, status changes, corrections; completed jobs only in Projects/Special, U1-C23); each tab shows its own current content', async () => {
    const hist = /Completed work(?! \()|Installation events|Operational status changes|Installed now \(latest known\)|Correction history|Completion note|Completed on /;
    const histSpecial = /Completed work(?! \()|Installation events|Operational status changes|Installed now \(latest known\)|Correction history|Completion note|Corrected \d/; // U1-C23: Projects/Special lists completed jobs with their completion date only
    const bad = [], seen = {};
    for (const [hash, sel] of [[`/eq/equipment/${Q1}`, 'whole'], [`/eq/equipment/${Q1}?main=mi-q01-01`, 'main'], [`/eq/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011`, 'sub'], [`/eq/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007`, 'part']]) {
      for (const tab of ['maintenance', 'special', 'technical', 'spareParts']) {
        await go('eqTeam', hash, {}, 250); await ev(`EQ.nav('/eq/equipment/${Q1}', Object.assign(Object.fromEntries(new URLSearchParams(location.hash.split('?')[1]||'')), {panel:'${tab}'}))`); await b.wait(500);
        const t = await panelText(); seen[sel + '/' + tab] = t.length;
        const rx = tab === 'special' ? histSpecial : hist;
        if (rx.test(t)) bad.push(sel + '/' + tab + ': ' + (t.match(rx) || [''])[0]);
        if (!t.length) bad.push(sel + '/' + tab + ': empty');
      }
    }
    return { ok: !bad.length, detail: bad.length ? bad.join('; ') : 'no history text in 16 tab/scope combinations' };
  });
  await step('C03', ['U1-C19', 'U1-C23', 'S07', 'HIS02', 'HIS06'], 'Projects/Special lists exactly the open and completed (non-cancelled) special jobs of the scope (equipment all, mechanism with descendants de-duplicated, part exact), counts open/completed/cancelled; cancelled jobs are counted not listed (U1-C23 supersedes the open-only reading)', async () => {
    const res = [];
    for (const [hash, scope, level] of [[`/eq/equipment/${Q1}`, "{level:'equipment',id:null}", 'whole'], [`/eq/equipment/${Q1}?main=mi-q01-01`, "{level:'main',id:'mi-q01-01'}", 'main'], [`/eq/equipment/${Q1}?main=mi-q01-02&sub=si-q01-021`, "{level:'sub',id:'si-q01-021'}", 'sub'], [`/eq/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-008`, "{level:'part',id:'pp-q01-008'}", 'part']]) {
      await go('eqTeam', hash, { }, 250); await ev(`EQ.nav('/eq/equipment/${Q1}', Object.assign(Object.fromEntries(new URLSearchParams(location.hash.split('?')[1]||'')), {panel:'special'}))`); await b.wait(500);
      const want = await ev(`(()=>{const H=EQ.history('${Q1}',${scope},true); return {open:H.open.filter(r=>!r.job.isCancelled).map(r=>r.job.number), listed:[...H.open,...H.completed].filter(r=>!r.job.isCancelled).map(r=>r.job.number), completed:H.completed.filter(r=>!r.job.isCancelled).length, cancelled:[...H.open,...H.completed].filter(r=>r.job.isCancelled).length}})()`);
      const got = await ev(`({nums:[...document.querySelectorAll('.side-panel .sp-body .tl a')].map(a=>a.textContent), tags:[...document.querySelectorAll('.side-panel [role=group] .tag')].map(t=>t.textContent)})`);
      const uniq = new Set(got.nums).size === got.nums.length;
      const same = JSON.stringify([...got.nums].sort()) === JSON.stringify([...want.listed].sort());
      const tagsOk = got.tags[0] === want.open.length + ' open' && got.tags[1] === want.completed + ' completed' && got.tags[2] === want.cancelled + ' cancelled';
      res.push({ level, want: want.listed.length, got: got.nums.length, uniq, same, tagsOk });
    }
    const wholeJobs = await ev(`(()=>{const H=EQ.history('${Q1}',{level:'equipment',id:null},false); return H.open.length+H.completed.length})()`);
    return { ok: res.every((r) => r.uniq && r.same && r.tagsOk) && wholeJobs >= 3 && res[0].got === wholeJobs, detail: JSON.stringify(res) };
  });
  await step('C04', ['U1-C19', 'ZM07', 'S20'], "Maintenance tab: today's ZMMS daily jobs of the equipment only, status with its source, 'ZMMS data from', same list for any selection, no earlier days, no history; unmapped equipment says Not linked to ZMMS", async () => {
    await go('eqTeam', `/eq/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007`, {}, 600);
    const t1 = await panelText(); const nums1 = await ev(`[...document.querySelectorAll('.side-panel [data-zjob]')].map(e=>e.dataset.zjob)`);
    await go('eqTeam', `/eq/equipment/${Q1}`, {}, 600); const nums2 = await ev(`[...document.querySelectorAll('.side-panel [data-zjob]')].map(e=>e.dataset.zjob)`);
    const want = await ev(`EQ.zmms.todayJobs('${Q1}').map(j=>j.jobNo)`); const earlier = await ev(`EQ.zmms.jobsOn('${Q1}', EQ.shiftDay(EQ.todayColombo(),-1), false).length`);
    await go('eqTeam', '/eq/equipment/eq-qc-demo-03', {}, 600); const t3 = await panelText();
    return { ok: JSON.stringify(nums1) === JSON.stringify(want) && JSON.stringify(nums2) === JSON.stringify(want) && want.length >= 1 && earlier >= 1 && /ZMMS data from/.test(t1) && /Auto \(ZMMS\)|Manual/.test(t1) && /same list shows for any selection/.test(t1) && /Not linked to ZMMS/.test(t3), detail: JSON.stringify({ want, nums1, nums2, earlierDaysExistButHidden: earlier }) };
  });
  await step('C05', ['U1-C19', 'S22', 'SP04', 'SP03'], 'Spare parts tab: current register rows inside the selection with condition, brand, replaced date, expected life, next predicted replacement and flags; no history; non-designated part says Not a major spare part', async () => {
    const check = async (hash, scope) => { await go('eqTeam', hash, {}, 250); await ev(`EQ.nav('/eq/equipment/${Q1}', Object.assign(Object.fromEntries(new URLSearchParams(location.hash.split('?')[1]||'')), {panel:'spareParts'}))`); await b.wait(500);
      const want = await ev(`EQ.spares.rows('${Q1}', ${scope}).map(r=>r.pos.name).sort()`); const got = await ev(`[...document.querySelectorAll('.side-panel [data-pos] strong')].map(e=>e.textContent).sort()`); return { want, got, text: await panelText() }; };
    const whole = await check(`/eq/equipment/${Q1}`, 'null'); const main = await check(`/eq/equipment/${Q1}?main=mi-q01-01`, "{level:'main',id:'mi-q01-01'}");
    const none = await check(`/eq/equipment/${Q1}?main=mi-q01-02&sub=si-q01-021&part=pp-q01-020`, "{level:'part',id:'pp-q01-020'}");
    const flags = /Overdue/.test(whole.text) && /Due soon/.test(whole.text) && /Next predicted replacement/.test(whole.text) && /Calendar estimate from expected life, not a condition assessment/.test(whole.text) && /Expected life/.test(whole.text) && /Replaced/.test(whole.text) && /Original/.test(whole.text);
    return { ok: JSON.stringify(whole.want) === JSON.stringify(whole.got) && whole.got.length >= 8 && JSON.stringify(main.want) === JSON.stringify(main.got) && main.got.length < whole.got.length && flags && !/Revision|History of/.test(whole.text) && (none.got.length === 0 ? /Not a major spare part|No major spare parts/.test(none.text) : true), detail: JSON.stringify({ whole: whole.got.length, main: main.got.length, none: none.text.slice(0, 80) }) };
  });
  await step('C06', ['U1-C19', 'S07', 'HIS06'], 'Technical tab: specification summary of the selected area (equipment, mechanism, part) with source-linked parameters; 63 m stays total lift height and the 46 / 45.5 m/min conflict stays visible', async () => {
    await go('eqTeam', `/eq/equipment/${Q1}`, {}, 250); await ev(`EQ.nav('/eq/equipment/${Q1}', {panel:'technical'})`); await b.wait(400); const eqT = await panelText();
    await ev(`EQ.nav('/eq/equipment/${Q1}', {panel:'technical', main:'mi-q01-04'})`); await b.wait(400); const m4 = await panelText();
    await ev(`EQ.nav('/eq/equipment/${Q1}', {panel:'technical', main:'mi-q01-01', sub:'si-q01-011', part:'pp-q01-007'})`); await b.wait(400); const part = await panelText();
    return { ok: /Major parameters/.test(eqT) && /total lift height/i.test(eqT) && /not the overall height of the crane/.test(eqT) && /Model: CICT-J526A-STS|CICT-J526A-STS/.test(eqT) && /Unresolved source conflict/.test(m4) && /46/.test(m4) && /45\.5/.test(m4) && /Semantic key/.test(part) && /Position ID/.test(part), detail: JSON.stringify({ eq: eqT.length, main4: /45\.5/.test(m4), part: /Semantic key/.test(part) }) };
  });
  await step('C07', ['U1-C19', 'S07', 'HIS06', 'VIS03'], 'Open in Jobs: Projects/Special opens EQ Jobs with the same equipment and scope and shows the same scoped history (descendants de-duplicated, exact part); Spare parts opens the register scoped to the selection; Maintenance opens today\'s daily jobs', async () => {
    await go('eqTeam', `/eq/equipment/${Q1}?main=mi-q01-01&panel=special`, {}, 500);
    const href = await ev(`document.querySelector('[data-fk="open-in-jobs-special"]').getAttribute('href')`);
    await ev(`document.querySelector('[data-fk="open-in-jobs-special"]').click()`); await b.wait(700);
    const hist = await ev(`[...document.querySelectorAll('section[aria-labelledby="sh-h"] .tl a')].map(a=>a.textContent).filter(t=>/^EQJ-/.test(t))`);
    const hTitle = await text('#sh-h'); const want = await ev(`(()=>{const H=EQ.history('${Q1}',{level:'main',id:'mi-q01-01'},false); return [...H.open,...H.completed].map(r=>r.job.number).sort()})()`);
    const histNums = [...new Set(hist)].sort();
    await go('eqTeam', `/eq/equipment/${Q1}?main=mi-q01-01&panel=spareParts`, {}, 500);
    const href2 = await ev(`document.querySelector('[data-fk="open-in-jobs-spareParts"]').getAttribute('href')`);
    await ev(`document.querySelector('[data-fk="open-in-jobs-spareParts"]').click()`); await b.wait(600);
    const rows = await ev(`[...document.querySelectorAll('.spare-table tbody tr[data-pos]')].map(r=>r.dataset.pos)`); const wantRows = await ev(`EQ.spares.rows('${Q1}',{level:'main',id:'mi-q01-01'}).map(r=>r.posId)`);
    await go('eqTeam', `/eq/equipment/${Q1}?panel=maintenance`, {}, 500);
    const href3 = await ev(`document.querySelector('[data-fk="open-in-jobs-maintenance"]').getAttribute('href')`);
    return { ok: /scope=main/.test(href) && /target=mi-q01-01/.test(href) && /History of/.test(hTitle) && histNums.length >= 2 && want.every((n) => histNums.includes(n)) && /spare-parts/.test(href2) && JSON.stringify(rows.sort()) === JSON.stringify(wantRows.sort()) && /from=\d{4}-\d\d-\d\d&to=\d{4}-\d\d-\d\d/.test(href3), detail: JSON.stringify({ href, histNums, want, href2, rows: rows.length, href3 }) };
  });
  await step('C08', ['U1-C19', 'S16', 'OPS02'], 'Tabs are keyboard-operable (arrow keys, Home/End, roving tab stop) and the selection model of the tree is unchanged by tab changes', async () => {
    await go('eqTeam', `/eq/equipment/${Q1}?main=mi-q01-01`, {}, 500);
    await ev(`document.querySelector('[data-fk="tab-maintenance"]').focus()`); await b.key('ArrowRight'); await b.wait(400);
    const a = await ev(`({h:location.hash, f:document.activeElement.dataset.fk, tabs:[...document.querySelectorAll('.side-panel [role=tab]')].map(t=>t.getAttribute('tabindex')).join()})`);
    await b.key('End'); await b.wait(400); const e = await ev(`({h:location.hash, f:document.activeElement.dataset.fk})`);
    await b.key('Home'); await b.wait(400); const hm = await ev(`({h:location.hash, f:document.activeElement.dataset.fk})`);
    return { ok: a.f === 'tab-special' && /panel=special/.test(a.h) && a.tabs === '-1,0,-1,-1' && e.f === 'tab-spareParts' && /panel=spareParts/.test(e.h) && hm.f === 'tab-maintenance' && /main=mi-q01-01/.test(hm.h), detail: JSON.stringify({ a, e, hm }) };
  });
  await step('C09', ['HIS05', 'S07'], 'Late panel responses for a previous selection are discarded (out-of-order protection survives the four-tab panel)', async () => {
    await go('eqTeam', `/eq/equipment/${Q1}`, {}, 500); await ev('EQ.state.slowHistory = true');
    await ev(`EQ.nav('/eq/equipment/${Q1}', {main:'mi-q01-01',sub:'si-q01-011',part:'pp-q01-007',panel:'special'})`); await b.wait(150);
    await ev(`EQ.nav('/eq/equipment/${Q1}', {main:'mi-q01-01',sub:'si-q01-011',part:'pp-q01-008',panel:'special'})`); await b.wait(3500);
    const echo = await ev(`(document.querySelector('[data-echo]')||{dataset:{}}).dataset.echo||''`); const log = await ev('EQ.state.log.join("\\n")'); const title = await text('[data-fk="scope-title"]');
    await ev('EQ.state.slowHistory = false');
    return { ok: echo.includes('pp-q01-008') && /Main hoist motor B/.test(title) && /DISCARDED/.test(log), detail: 'echo ' + echo + '; DISCARDED logged: ' + /DISCARDED/.test(log) };
  });

  // =============================================================== D. fleet cards
  await step('D01', ['S02', 'S03', 'ZM05', 'OPS01'], "Fleet: every card shows the status source (Auto/Manual) and today's ZMMS daily-job count; the 'manual status, no telemetry' note is replaced by the automatic-status meaning; unmapped equipment is Manual and has no count", async () => {
    await go('eqTeam', '/eq/fleet', {}, 600);
    const cards = await ev(`[...document.querySelectorAll('.eq-card')].map(c=>({code:c.querySelector('.code').firstChild.textContent, src:c.querySelector('.src').textContent, zc:c.querySelector('[data-zmms-today]')?c.querySelector('[data-zmms-today]').dataset.zmmsToday:null}))`);
    const truth = await ev(`EQ.state.D.equipment.filter(e=>e.lifecycle==='active').map(e=>({code:e.code, src:EQ.zmms.mode(e).label, zc:EQ.zmms.todayCount(e)}))`);
    const same = cards.length === truth.length && cards.every((c) => { const t = truth.find((x) => x.code === c.code); return t && t.src === c.src && String(t.zc == null ? null : t.zc) === String(c.zc); });
    const page = await text('main'); const note = await ev(`document.querySelector('[data-fk="status-note"]').title`);
    const unmapped = cards.filter((c) => c.zc == null); const manual = cards.filter((c) => c.src === 'Manual');
    return { ok: same && cards.some((c) => c.src === 'Auto' && Number(c.zc) >= 1) && unmapped.length >= 3 && unmapped.every((c) => c.src === 'Manual') && manual.length > unmapped.length - 1 && !/telemetry/i.test(page) && /automatically from today's ZMMS daily jobs/.test(note) && /correct it with a reason/.test(note) && /Equipment that has never been set shows Unreported/.test(note), detail: JSON.stringify({ n: cards.length, auto: cards.filter((c) => c.src === 'Auto').length, manual: manual.length, unmapped: unmapped.length }) };
  });
  await step('D02', ['S02', 'S03', 'OPS01'], 'Fleet Auto/Manual source filter reconciles with the cards; the manual correction held by QC-DEMO-04 shows Manual although it is mapped; freshness line shows ZMMS data from', async () => {
    await go('eqTeam', '/eq/fleet?source=manual', {}, 500); const man = await ev(`[...document.querySelectorAll('.eq-card')].map(c=>c.querySelector('.code').firstChild.textContent)`);
    await go('eqTeam', '/eq/fleet?source=auto', {}, 500); const aut = await ev(`[...document.querySelectorAll('.eq-card')].map(c=>c.querySelector('.code').firstChild.textContent)`);
    const total = await ev(`EQ.state.D.equipment.filter(e=>e.lifecycle==='active').length`); const q4 = await ev(`(()=>{const e=EQ.eq('eq-qc-demo-04'); return [e.zmmsMapped, EQ.zmms.mode(e).key]})()`);
    const fr = await text('[data-fk="zmms-fresh"]');
    return { ok: man.length + aut.length === total && !man.some((c) => aut.includes(c)) && man.includes('QC-DEMO-04') && q4[0] === true && q4[1] === 'manualCorrection' && /ZMMS data from \d/.test(fr), detail: JSON.stringify({ man: man.length, auto: aut.length, total, q4, fr }) };
  });


  // =============================================================== E. EQ Jobs tab in three parts
  // U1-C20 (round 5): the first part is split into two tabs, Special/Projects and Daily work (CMMS); the same checks run on each tab.
  await step('E01', ['S08', 'ZM07', 'HIS06', 'U1-C20'], 'EQ Jobs Special/Projects and Daily work (CMMS) tabs (U1-C20 split of part 1): special jobs on their own tab, the read-only ZMMS daily jobs on the Daily work tab with "ZMMS data from"; unmatched equipment never listed here; filters (equipment, type, date range, search) apply to both lists and stay in the URL; earlier days are kept', async () => {
    await go('eqTeam', '/eq/jobs/special', {}, 700);
    const nav = await ev(`[...document.querySelectorAll('.subtabs a')].map(a=>a.textContent+(a.getAttribute('aria-current')==='page'?'*':'')).join('|')`);
    const specialOnly = await ev(`!!document.querySelector('.job') && [...document.querySelectorAll('h2')].some(h=>h.textContent==='Special jobs') && !document.getElementById('dj-h')`);
    await go('eqTeam', '/eq/jobs/daily', {}, 700);
    const dailyOnly = await ev(`!!document.getElementById('dj-h') && !document.querySelector('.job')`);
    const fresh = await text('#daily'); const ro = await ev(`document.querySelectorAll('#daily .daily-table input, #daily .daily-table select, #daily .daily-table textarea, #daily .daily-table button').length`);
    const today = await ev(`[...document.querySelectorAll('.daily-table tbody tr')].map(r=>r.dataset.zjob)`);
    const wantToday = await ev(`EQ.zmms.jobsOn('${Q1}',EQ.todayColombo(),false).length + EQ.state.D.zmms.jobs.filter(j=>j.match==='matched' && j.date===EQ.todayColombo() && j.sourceState==='present' && j.equipmentId!=='${Q1}').length`);
    const unm = await ev(`EQ.state.D.zmms.jobs.filter(j=>j.match!=='matched' && j.date===EQ.todayColombo()).map(j=>j.jobNo)`);
    // filters
    await go('eqTeam', `/eq/jobs/daily?type=RTG`, {}, 600); const rtgRows = await ev(`[...document.querySelectorAll('.daily-table tbody tr')].map(r=>r.querySelector('td a').textContent)`);
    await go('eqTeam', `/eq/jobs/special?type=RTG`, {}, 600); const rtgJobs = await ev(`[...document.querySelectorAll('.job')].map(j=>j.textContent.match(/(QC|RTG|ES)-DEMO-\\d+/)[1])`);
    await go('eqTeam', `/eq/jobs/daily?equipment=${Q1}&from=${'2000-01-01'}&to=2999-01-01`, {}, 600); const allDays = await ev(`new Set([...document.querySelectorAll('.daily-table tbody tr td:first-child')].map(t=>t.textContent)).size`);
    await go('eqTeam', `/eq/jobs/daily?equipment=${Q2}&from=${'2000-01-01'}&to=2999-01-01`, {}, 600);
    const absent = await ev(`!!document.querySelector('.daily-table tr.inactive') && [...document.querySelectorAll('.daily-table')].some(t=>/No longer in the ZMMS list/.test(t.textContent))`);
    await go('eqTeam', `/eq/jobs/daily?equipment=${Q2}`, {}, 600); const q2Only = await ev(`[...document.querySelectorAll('.daily-table tbody tr')].every(r=>r.querySelector('td a').textContent==='QC-DEMO-02')`);
    const urlKeeps = await ev(`location.hash.includes('equipment=${Q2}') && [...document.querySelectorAll('.subtabs a')].every(a=>a.getAttribute('href').includes('equipment=${Q2}'))`);
    const listed = await ev(`(EQ.dailyRows({}).map(j=>j.jobNo))`);
    return { ok: /^Special\/Projects\*\|Daily work \(CMMS\)\|EQ status\|Spare parts condition$/.test(nav) && specialOnly && dailyOnly && /ZMMS data from \d/.test(fresh) && ro === 0 && today.length === wantToday && !unm.some((n) => listed.includes(n)) && rtgRows.length >= 3 && rtgRows.every((c) => /^RTG-/.test(c)) && rtgJobs.length > 0 && rtgJobs.every((c) => c === 'RTG') && allDays >= 3 && absent && q2Only && urlKeeps,
      detail: JSON.stringify({ nav, specialOnly, dailyOnly, ro, today: today.length, wantToday, unmatchedHidden: unm.length, rtg: rtgRows.length, rtgJobs: rtgJobs.length, allDays, absent, q2Only, urlKeeps }) };
  });
  await step('E02', ['S08', 'S21', 'ZM06', 'JOB13'], 'EQ Jobs part 2 (EQ status): one row per active equipment with source and mode; EQ Team corrects with a mandatory reason (Manual for today), Back to automatic ends it; the status history lists source, actor or sync run and reason; Management has no action buttons', async () => {
    await go('eqTeam', '/eq/jobs/status', {}, 700);
    const rows = await count('.status-board tbody tr'); const want = await ev(`EQ.state.D.equipment.filter(e=>e.lifecycle==='active').length`);
    const hasAuto = await ev(`[...document.querySelectorAll('.status-board tbody tr')].some(r=>r.querySelector('.src.auto'))`);
    // correct QC-DEMO-02 through the dialog: no reason -> error; then reason -> Manual
    await b.click(`[data-fk="correct-${Q2}"]`); await b.wait(300);
    await b.click('#sf-status-breakdown'); await b.click('dialog button[type="submit"]'); await b.wait(400); const err = await text('dialog');
    await b.setValue('#sf-reason', 'Hoist brake fault found at the 08:00 walk-down (check)'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const after = await ev(`(()=>{const e=EQ.eq('${Q2}'); return {status:e.status, mode:EQ.zmms.mode(e).key, row:document.querySelector('[data-eq="${Q2}"]').textContent}})()`);
    const autoBtn = await exists(`[data-fk="auto-${Q2}"]`);
    await b.click(`[data-fk="auto-${Q2}"]`); await b.wait(500);
    const back = await ev(`(()=>{const e=EQ.eq('${Q2}'); return {mode:EQ.zmms.mode(e).key, status:e.status}})()`);
    const hist = await ev(`[...document.querySelectorAll('[data-sc]')].slice(0,4).map(r=>r.textContent)`);
    const histKinds = await ev(`EQ.state.D.statusChanges.filter(c=>c.equipmentId==='${Q2}').map(c=>c.kind+':'+c.source).join(',')`);
    await go('management', '/eq/jobs/status', {}, 600); const mBtns = await count('.status-board button');
    return { ok: rows === want && hasAuto && /A reason is required for every correction/.test(err) && after.status === 'breakdown' && after.mode === 'manualCorrection' && /Manual/.test(after.row) && autoBtn && back.mode !== 'manualCorrection' && hist.length >= 3 && hist.some((h) => /ZMMS sync|User/.test(h)) && /manualCorrection:manual/.test(histKinds) && /backToAutomatic/.test(histKinds) && mBtns === 0, detail: JSON.stringify({ rows, want, after: { s: after.status, m: after.mode }, back, histKinds, mgmtButtons: mBtns }) };
  });
  await step('E03', ['S08', 'S22', 'SP03', 'SP04'], 'EQ Jobs part 3 (spare parts condition): register per equipment with due-soon / overdue flags, flag filter, per-part history that keeps previous values after two edits; Management has no update buttons', async () => {
    await go('eqTeam', '/eq/jobs/spare-parts', {}, 700);
    const rows = await count('.spare-table tbody tr[data-pos]'); const want = await ev(`EQ.spares.allRows().length`);
    const flags = await ev(`({over:document.querySelectorAll('.spare-table .tag.red').length, soon:document.querySelectorAll('.spare-table .tag.gold').length, rowsOver:document.querySelectorAll('.overdue-row').length})`);
    await go('eqTeam', '/eq/jobs/spare-parts?flag=overdue', {}, 600); const ov = await ev(`[...document.querySelectorAll('.spare-table tbody tr[data-pos]')].map(r=>r.dataset.pos)`); const wantOv = await ev(`EQ.spares.allRows(r=>r.flag==='overdue').map(r=>r.posId)`);
    // two edits keep the previous values in the history (SP04)
    const r2 = await ev(`(()=>{const pos=EQ.positionsOf('${Q1}').find(p=>p.key==='hoist.drive.gearbox.a'); const id=pos.id;
      const r1=EQ.spares.recordReplacement(id,{desc:'Gearbox B03 (check)',brand:'Brand One',model:'M-1',serial:'S-1',replacedOn:EQ.shiftDay(EQ.todayColombo(),-3)});
      const r2=EQ.spares.amend(id,{desc:'Gearbox B03 (check)',brand:'Brand Two',model:'M-1',serial:'S-1',reason:'nameplate read again'});
      const h=EQ.spares.history(id); return {ok:[r1.ok,r2.ok], n:h.length, id, top:h[0], second:h[1], third:h[2]};})()`);
    // navigate inside the page (a reload would restore the fixtures and lose the two edits)
    await ev(`EQ.nav('/eq/jobs/spare-parts', {equipment:'${Q1}'})`); await b.wait(600); await b.click(`[data-fk="hist-${r2.id}"]`); await b.wait(300);
    const histText = await text('.hist-row');
    await ev(`EQ.nav('/eq/equipment/${Q1}', {main:'mi-q01-01', sub:'si-q01-012', part:'${r2.id}', panel:'spareParts'})`); await b.wait(700); const crane = await panelText();
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/jobs/spare-parts', {})`); await b.wait(600); const mBtns = await ev(`[...document.querySelectorAll('.spare-table button')].filter(b=>/Update/.test(b.textContent)).length`);
    return { ok: rows === want && want >= 10 && flags.over >= 2 && flags.soon >= 1 && flags.rowsOver >= 1 && JSON.stringify(ov.sort()) === JSON.stringify(wantOv.sort()) && wantOv.length >= 2 && r2.ok[0] && r2.ok[1] && r2.n >= 3 && r2.top.before.brand === 'Brand One' && r2.top.after.brand === 'Brand Two' && /Brand One/.test(histText) && /Brand Two/.test(histText) && /nameplate read again/.test(histText) && !/Brand One/.test(crane) && /Brand Two/.test(crane) && mBtns === 0, detail: JSON.stringify({ rows, want, flags, overdueIds: ov.length, history: r2.n, craneShowsOnlyCurrent: !/Brand One/.test(crane), mgmtUpdate: mBtns }) };
  });

  // =============================================================== F. ZMMS rules (synthetic sync; never contacts ZMMS)
  await step('F01', ['ZM02', 'S20'], 'A failed run (login failure, layout change, timeout, HTTP error) records itself, keeps every row and every status unchanged, marks the data stale and warns; "ZMMS data from" stays at the last good run', async () => {
    await go('admin', '/admin/eq/zmms', {}, 700);
    const snap = () => ev(`JSON.stringify({st:EQ.state.D.equipment.map(e=>[e.id,e.status,e.statusSince,e.statusSource]), jobs:EQ.state.D.zmms.jobs.length, from:EQ.zmms.lastSuccess().endedUtc, hist:EQ.state.D.statusChanges.length})`);
    const before = await snap(); const out = {};
    for (const code of ['login_failed', 'layout_changed', 'timeout', 'http_error']) { const r = await ev(`(()=>{const x=EQ.zmms.syncNow({outcome:'${code}'}); return [x.ok, x.changedNothing, x.run && x.run.outcome, x.run && x.run.failureCode]})()`); out[code] = r; }
    const after = await snap(); const fr = await ev(`EQ.zmms.freshness()`);
    await go('eqTeam', '/eq/fleet', {}, 500); await ev(`EQ.zmms.syncNow({outcome:'timeout', system:true}); EQ.rerender()`); await b.wait(400); const fleetFresh = await text('[data-fk="zmms-fresh"]');
    return { ok: before === after && Object.values(out).every((r) => r[0] && r[1] && r[2] === 'failed') && fr.stale && fr.latestOutcome === 'failed' && /stale/.test(fleetFresh) && /ZMMS data from/.test(fleetFresh), detail: JSON.stringify({ unchanged: before === after, runs: out, stale: fr.stale, fleetFresh }) };
  });
  await step('F02', ['ZM05', 'S21'], 'Automatic status: unmapped job-type values stop the status change for the equipment concerned and automatic mode cannot be switched on until mapped; after mapping a breakdown job gives Breakdown, a maintenance job Maintenance, nothing in the plan gives Ready for OPS, each with its causing ZMMS jobs', async () => {
    await go('admin', '/admin/eq/zmms', {}, 700);
    const r = await ev(`(()=>{
      const Z=EQ.zmms, z=EQ.state.D.zmms; const out={};
      // empty mapping state: every value unmapped, automatic off -> a sync stores jobs and changes no status
      z.valueMappings.forEach(v=>{v.effect='unmapped'}); z.settings.autoEnabled=false;
      const st0=EQ.state.D.equipment.map(e=>e.status).join();
      const noMap=Z.syncNow({}); const st1=EQ.state.D.equipment.map(e=>e.status).join();
      out.empty={changed:st0!==st1, applied:noMap.run.applied};
      out.autoRefused=Z.setAuto(true); 
      // map the values (Admin choices after the first real data, Q11)
      const set=(f,t,e)=>Z.setEffect(z.valueMappings.find(v=>v.field===f && v.text===t).id,e);
      set('jobType','BreakDown','breakdown'); set('jobType','CM','maintenance'); set('jobType','PM','maintenance'); set('jobType','Defect','none'); set('jobType','WireRope','maintenance');
      ['Initialized','Added To Daily','Re-Added to Daily','Hold'].forEach(t=>set('jobStatus',t,'open')); set('jobStatus','Completed','closed');
      out.autoOn=Z.setAuto(true).ok;
      const q=EQ.eq('eq-rtg-demo-03'), m=EQ.eq('eq-qc-demo-02'), w=EQ.eq('eq-rtg-demo-06');
      m.status='maintenance'; const run=Z.syncNow({});
      out.after={bd:[q.status,q.statusSource,q.statusCauses], ready:[m.status], wire:[w.status,w.statusCauses], applied:run.run.applied, ranOk:run.ok};
      return out;})()`);
    const ok = r.empty.changed === false && r.empty.applied === 0 && r.autoRefused.ok === false && r.autoRefused.code === 'zmms_mapping_incomplete' && r.autoOn && r.after.bd[0] === 'breakdown' && r.after.bd[1] === 'zmms' && r.after.bd[2].length >= 1 && r.after.ready[0] === 'readyForOps' && r.after.wire[0] === 'maintenance' && r.after.wire[1].length === 1;
    return { ok, detail: JSON.stringify(r) };
  });
  await step('F03', ['ZM06', 'S21', 'JOB13'], 'Manual correction needs a reason, shows Manual, holds over the same day\'s second sync, returns to automatic at the first sync of the next day; Back to automatic ends it earlier; Management cannot correct', async () => {
    await go('eqTeam', '/eq/jobs/status', {}, 600);
    const r = await ev(`(()=>{const Z=EQ.zmms; const out={}; const e=EQ.eq('${Q2}'); const day=EQ.todayColombo();
      out.noReason=Z.correct('${Q2}',{status:'breakdown',reason:''}).code;
      out.ok=Z.correct('${Q2}',{status:'breakdown',reason:'Brake fault found (check F03)'}).ok; out.mode=Z.mode(e).key; out.status=e.status;
      EQ.state.role='admin'; EQ.access.refreshSession('t'); const second=Z.syncNow({}); EQ.state.role='eqTeam'; EQ.access.refreshSession('t');
      out.afterSecondSync={status:e.status, mode:Z.mode(e).key, ev:Z.compute(e,day).computed};
      // the next day's first successful sync: jobs of tomorrow do not exist, so the plan says Ready for OPS
      EQ.state.role='admin'; EQ.access.refreshSession('t'); const tomorrow=EQ.shiftDay(day,1); const next=Z.syncNow({businessDate:tomorrow}); EQ.state.role='eqTeam'; EQ.access.refreshSession('t');
      out.nextDay={status:e.status, mode:Z.mode(e).key, source:e.statusSource, overrideCleared:e.overrideOn===null, last:EQ.state.D.statusChanges.filter(c=>c.equipmentId==='${Q2}').slice(-1)[0].kind};
      // Back to automatic earlier (QC-DEMO-01, mapped)
      Z.correct('${Q1}',{status:'readyForOps',reason:'check F03 early'}); const early=Z.backToAutomatic('${Q1}'); out.early={ok:early.ok, mode:Z.mode(EQ.eq('${Q1}')).key};
      EQ.state.role='management'; EQ.access.refreshSession('t'); out.mgmt=Z.correct('${Q2}',{status:'breakdown',reason:'x'}).status; EQ.state.role='eqTeam'; EQ.access.refreshSession('t');
      return out;})()`);
    return { ok: r.noReason === 'validation_failed' && r.ok && r.mode === 'manualCorrection' && r.status === 'breakdown' && r.afterSecondSync.status === 'breakdown' && r.afterSecondSync.mode === 'manualCorrection' && r.nextDay.mode === 'automatic' && r.nextDay.source === 'zmms' && r.nextDay.overrideCleared && r.nextDay.last === 'overrideEnded' && r.early.ok && r.early.mode !== 'manualCorrection' && r.mgmt === 403, detail: JSON.stringify(r) };
  });
  await step('F04', ['ZM01', 'ZM03', 'S20'], 'Rows are keyed by job number and date (a repeat creates no duplicate); a concurrent Sync now is refused as already running; unmatched rows stay in the queue and attach to equipment after Admin maps them without duplicates', async () => {
    await go('admin', '/admin/eq/zmms', {}, 700);
    const r = await ev(`(()=>{const Z=EQ.zmms, z=EQ.state.D.zmms; const out={};
      const inj={equipmentText:'QC901',type:'CM',status:'Initialized',desc:'Injected job (synthetic check)',jobNo:'900777'};
      const n0=z.jobs.length; const a=Z.syncNow({inject:[inj]}); const b=Z.syncNow({inject:[inj]});
      out.upsert={new1:a.run.rowsNew, new2:b.run.rowsNew, upd2:b.run.rowsUpdated, count:z.jobs.filter(j=>j.jobNo==='900777'&&j.date===EQ.todayColombo()).length, added:z.jobs.length-n0};
      z.runLock=99; out.concurrent=Z.syncNow({}); z.runLock=null;
      const unm=Z.unmatched(); const key=unm[0].key; const rows=unm[0].rows; const total=z.jobs.length;
      const map=Z.addMapping({key, action:'map', equipmentId:'eq-qc-demo-03'});
      out.map={ok:map.ok, attached:map.attached, rowsBefore:rows, total:z.jobs.length===total, eqMapped:EQ.eq('eq-qc-demo-03').zmmsMapped, nowMatched:z.jobs.filter(j=>j.equipmentKey===key&&j.match==='matched').length, queueAfter:Z.unmatched().length, unmatchedBefore:unm.length};
      out.dupMap=Z.addMapping({key, action:'map', equipmentId:'eq-qc-demo-04'}).code;
      return out;})()`);
    return { ok: r.upsert.new1 === 1 && r.upsert.new2 === 0 && r.upsert.upd2 === 1 && r.upsert.count === 1 && r.concurrent.alreadyRunning === true && r.map.ok && r.map.attached === r.map.rowsBefore && r.map.total && r.map.eqMapped && r.map.nowMatched === r.map.rowsBefore && r.map.queueAfter === r.map.unmatchedBefore - 1 && r.dupMap === 'validation_failed', detail: JSON.stringify(r) };
  });
  await step('F05', ['ZM02', 'ZM03', 'ZM05', 'S20', 'S21'], 'Admin ZMMS page: sync times and Sync now, health with last success and a synthetic failed run, recent runs, equipment mapping with an ignore entry, unmatched queue, job type and status mapping, status evaluation; Management and EQ Team get 403', async () => {
    await go('admin', '/admin/eq/zmms', {}, 800);
    const t = await text('main');
    const has = { times: /Sync times/.test(t) && (await exists('input[type=time], input[name*=sync], #zs-1, [data-fk*="sync"]')), health: /health/i.test(t), failed: /layout_changed/.test(t) && /failed/i.test(t), runs: /Recent runs/.test(t), maps: /Equipment mapping/i.test(t), ignore: /ignore/i.test(t), unmatched: /Unmatched queue/.test(t), values: /Job type and job status mapping/.test(t), evalu: /Status evaluation/.test(t), syncNow: /Sync now/.test(t), synth: /synthetic/i.test(t) };
    await ev(`(()=>{const b=[...document.querySelectorAll('main button')].find(x=>/^Sync now/.test(x.textContent.trim())); if(b) b.click();})()`); await b.wait(500); const runsAfter = await ev(`EQ.state.D.zmms.runs[0].trigger`);
    await go('management', '/admin/eq/zmms', {}, 500); const m = await text('main'); await go('eqTeam', '/admin/eq/zmms', {}, 500); const e = await text('main');
    return { ok: Object.values(has).every(Boolean) && runsAfter === 'manual' && /403/.test(m) && /403/.test(e), detail: JSON.stringify({ has, runsAfter }) };
  });

  // =============================================================== G. spare-part rules
  await step('F06', ['ZM06', 'S21'], "Back to automatic never sets a missing value: when today's evaluation stopped at unmapped values (RTG-DEMO-06, WireRope not mapped) it keeps the corrected value as awaiting today's ZMMS sync instead of applying a null status; with a computed evaluation it applies that value [Repair-R02B finding 3]", async () => {
    await go('eqTeam', '/eq/jobs/status', {}, 600);
    const r = await ev(`(()=>{const Z=EQ.zmms; const w='eq-rtg-demo-06', q='eq-qc-demo-02'; const evW=EQ.state.D.zmms.evaluations.find(x=>x.equipmentId===w), evQ=EQ.state.D.zmms.evaluations.find(x=>x.equipmentId===q);
      Z.correct(w,{status:'breakdown',reason:'check F06'}); const a=Z.backToAutomatic(w); const ew=EQ.eq(w); const lastW=EQ.state.D.statusChanges.filter(c=>c.equipmentId===w).slice(-1)[0];
      Z.correct(q,{status:'breakdown',reason:'check F06'}); const b2=Z.backToAutomatic(q); const eq2=EQ.eq(q);
      return {evW:[evW.computed, evW.skip], w:{ok:a.ok, awaiting:a.awaiting, status:ew.status, mode:Z.mode(ew).key, lastKind:lastW.kind, lastSource:lastW.source, lastStatus:lastW.status}, evQ:[evQ.computed, evQ.skip], q:{ok:b2.ok, awaiting:b2.awaiting, status:eq2.status, mode:Z.mode(eq2).key}};})()`);
    const ok = r.evW[0] === null && r.evW[1] === 'unmappedValues' && r.w.ok && r.w.awaiting === true && r.w.status === 'breakdown' && r.w.lastKind === 'backToAutomatic' && r.w.lastSource === 'manual' && r.w.lastStatus === 'breakdown' && r.w.mode === 'awaitingAuto'
      && r.evQ[0] === 'readyForOps' && r.q.ok && r.q.awaiting === false && r.q.status === 'readyForOps' && r.q.mode === 'automatic';
    return { ok, detail: JSON.stringify(r) };
  });
  await step('G01', ['SP03', 'S22'], 'Prediction = replaced date + expected life (calendar months); Original uses the commissioning date; unknown commissioning date or life shows no prediction and never a fabricated date; due soon (90 days) and overdue flags are correct (independent recomputation)', async () => {
    await go('admin', '/eq/jobs/spare-parts', {}, 600);
    const r = await ev(`(()=>{
      const parts=(s)=>s.split('-').map(Number); const addM=(iso,n)=>{const [y,m,d]=parts(iso); const t=new Date(Date.UTC(y,m-1+n,1)); const last=new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0)).getUTCDate(); t.setUTCDate(Math.min(d,last)); return t.toISOString().slice(0,10)};
      const days=(a,b)=>Math.round((Date.UTC(...parts(a).map((v,i)=>i===1?v-1:v))-Date.UTC(...parts(b).map((v,i)=>i===1?v-1:v)))/864e5);
      const today=EQ.todayColombo(); const bad=[]; let n=0, unknown=0;
      EQ.spares.allRows().forEach(row=>{ n++; const eq=row.eq; const life=row.lifeMonths; const base=row.condition==='replaced'?row.replacedOn:row.condition==='original'?eq.commissionedOn:null;
        let want=null; if(base && life!=null) want=addM(base,life);
        if(want!==row.predicted) bad.push([row.pos.name,eq.code,want,row.predicted]);
        if(!want){ unknown++; if(row.predicted) bad.push(['fabricated',row.pos.name]); }
        else { const d=days(want,today); const f=d<0?'overdue':d<=90?'dueSoon':null; if(f!==row.flag) bad.push(['flag',row.pos.name,f,row.flag]); } });
      // commissioning date unknown -> Original parts show no prediction (QC-DEMO-02 spreader)
      const e2=EQ.eq('eq-qc-demo-02'); const keep=e2.commissionedOn; e2.commissionedOn=null; const sp=EQ.positionsOf('eq-qc-demo-02').find(p=>p.key==='spreader.frame'); const row=EQ.spares.row(sp.id); e2.commissionedOn=keep;
      return {n, unknown, bad, noComm:{cond:row.condition, predicted:row.predicted, why:row.why}};})()`);
    return { ok: r.n >= 10 && r.bad.length === 0 && r.unknown >= 1 && r.noComm.cond === 'original' && r.noComm.predicted === null && /commissioning date unknown/.test(r.noComm.why), detail: JSON.stringify(r) };
  });
  await step('G02', ['SP01', 'S22', 'ADM02'], 'Admin selects major spare parts per position with an expected life by type and a per-equipment override; the override changes only that equipment (another QC from the same template keeps its own register); undesignating hides the row but keeps history', async () => {
    await go('admin', '/admin/eq/spare-parts', {}, 700); const t = await text('main');
    const r = await ev(`(()=>{const P=EQ.spares; const out={};
      const k='hoist.drive.motor.a'; const p1=EQ.positionsOf('${Q1}').find(x=>x.key===k), p2=EQ.positionsOf('${Q2}').find(x=>x.key===k);
      out.before=[P.expectedLife(p1.id).months, P.expectedLife(p2.id).months];
      const o=P.designate(p1.id,{on:true,typeId:'spt-hoist-motor',lifeOverride:12,reason:'check G02'}); out.after=[P.expectedLife(p1.id), P.expectedLife(p2.id)]; out.pred=[P.row(p1.id).predicted, P.row(p2.id).predicted]; out.o=o.ok;
      const hist0=P.history(p1.id).length; const off=P.designate(p1.id,{on:false,reason:'check'}); out.hidden=!P.rows('${Q1}').some(r=>r.posId===p1.id); out.histKept=P.history(p1.id).length>hist0 && EQ.state.D.events.some(e=>e.positionId===p1.id);
      const bad=P.designate(p1.id,{on:true,typeId:'spt-hoist-motor',lifeOverride:'0'}); out.badLife=[bad.status,bad.code];
      EQ.state.role='eqTeam'; EQ.access.refreshSession('t'); out.eqTeam=P.designate(p1.id,{on:true,typeId:'spt-hoist-motor'}).status; EQ.state.role='admin'; EQ.access.refreshSession('t');
      const ty=P.setTypeLife('spt-hoist-brake',''); out.typeNoLife=ty.ok; out.typeLife=P.typeOf('spt-hoist-brake').defaultLife;
      return out;})()`);
    return { ok: /Spare-part types/.test(t) && /Positions of/.test(t) && /expected life/i.test(t) && r.before[0] === 120 && r.before[1] === 120 && r.after[0].months === 12 && r.after[0].source === 'override' && r.after[1].months === 120 && r.after[1].source === 'type' && r.pred[0] !== r.pred[1] && r.hidden && r.histKept && r.badLife[0] === 422 && r.eqTeam === 403 && r.typeNoLife && r.typeLife === null, detail: JSON.stringify(r) };
  });
  await step('G03', ['SP02', 'S22', 'JOB05', 'JOB08', 'JOB06'], 'Completing a Replacement special job writes the condition register in the same commit (brand, model, serial, replaced date from the line, history source jobCompletion); an invalid second line commits nothing at all; a retry with the same key replays and adds no history row', async () => {
    await go('eqTeam', '/fleet', {}, 500);
    const r = await ev(`(()=>{const P=EQ.spares; const pos=(k)=>EQ.positionsOf('${Q2}').find(p=>p.key===k); const brake=pos('hoist.emergency.brake.a'), gb=pos('hoist.drive.gearbox.a'); const out={};
      const job=EQ.api.createJob({equipmentId:'${Q2}',kind:'replacement',title:'Replace brake and gearbox (check G03)',level:'equipment'}).job;
      const hist0=P.history(brake.id).length, ev0=EQ.state.D.events.length;
      const bad=EQ.api.completeJob(job.id,{key:'g03a',completedOn:EQ.todayColombo(),note:'n',lines:[{positionId:brake.id,qty:1,desc:'Brake',on:EQ.todayColombo(),removedKnown:'unknown',mfr:'BrakeCo'},{positionId:gb.id,qty:1,desc:'',on:EQ.todayColombo(),removedKnown:'unknown'}]});
      out.rollback={ok:bad.ok, status:EQ.job(job.id).workStatus, events:EQ.state.D.events.length-ev0, hist:P.history(brake.id).length-hist0, cond:P.row(brake.id).brand};
      const day=EQ.todayColombo(); const good=EQ.api.completeJob(job.id,{key:'g03b',completedOn:day,note:'done',lines:[{positionId:brake.id,qty:1,desc:'Emergency disc brake',on:day,removedKnown:'unknown',mfr:'BrakeCo',partNo:'BR-77',serial:'BR-0001',conditionRemarks:'fitted with new pads'}]});
      const row=P.row(brake.id); const h=P.history(brake.id);
      out.committed={ok:good.ok, cond:row.condition, brand:row.brand, model:row.model, serial:row.serial, on:row.replacedOn===day, src:h[0].source, job:h[0].jobId===job.id, remarks:row.remarks, newHist:h.length-hist0, status:EQ.eq('${Q2}').status};
      const again=EQ.api.completeJob(job.id,{key:'g03b'}); out.retry={replayed:again.replayed, hist:P.history(brake.id).length-hist0, events:EQ.state.D.events.filter(e=>e.jobId===job.id).length};
      return out;})()`);
    return { ok: r.rollback.ok === false && r.rollback.status !== 'completed' && r.rollback.events === 0 && r.rollback.hist === 0 && r.committed.ok && r.committed.cond === 'replaced' && r.committed.brand === 'BrakeCo' && r.committed.model === 'BR-77' && r.committed.serial === 'BR-0001' && r.committed.on && r.committed.src === 'jobCompletion' && r.committed.job && r.committed.newHist === 1 && r.retry.replayed && r.retry.hist === 1 && r.retry.events === 1, detail: JSON.stringify(r) };
  });
  await step('G04', ['SP02', 'S22'], 'The completion dialog for a Replacement job at a major spare part shows the condition notice and pre-fills nothing it does not know (no invented brand, serial or date)', async () => {
    await go('eqTeam', `/eq/jobs/special?equipment=${Q1}`, {}, 600);
    await b.clickIn('.job', 'Replace main hoist motor B', 'Complete...'); await b.wait(300);
    const t = await text('dialog'); const vals = await ev(`({desc:(document.querySelector('#cl0-desc')||{}).value, sn:(document.querySelector('#cl0-sn')||{}).value, mfr:(document.querySelector('#cl0-mfr')||{}).value})`);
    await b.key('Escape'); await b.wait(300);
    return { ok: /Major spare part/.test(t) && /condition register is updated in the same transaction/.test(t) && !vals.sn && !vals.mfr, detail: JSON.stringify(vals) };
  });


  // =============================================================== H. FAC Dashboard
  const dash = () => ev('EQ.dashState()');
  const lanesRows = () => ev(`Object.fromEntries([...document.querySelectorAll('.lane')].map(l=>[l.dataset.lane, [...l.querySelectorAll('.lane-list:not(.dup) .frow')].map(r=>r.dataset.key)]))`);
  await step('H01', ['S27', 'FAC01', 'FAC02', 'FDB01'], 'FAC Dashboard loads the 114 jobs of reference\\fac-job-list.json (by sheet row and split index) with clearly labelled synthetic progress; KPI strip with eight figures reconciling with the FAC Jobs list for the same filters; clicking a KPI filters the lanes and is kept in the URL', async () => {
    await go('management', '/fac/dashboard', {}, 900);
    const ref = await ev(`(()=>{const R=EQ.FAC_REF.jobs, J=EQ.state.D.fac.jobs.filter(j=>j.origin==='facImport'); const key=(sr,sp)=>sr+'/'+(sp==null?'':sp); const rk=new Set(R.map(r=>key(r.sourceRow,r.splitIndex))); const jk=new Set(J.map(j=>key(j.sourceRow,j.split))); return {ref:R.length, app:J.length, same:R.length===J.length && [...rk].every(k=>jk.has(k)), byDisc:J.reduce((a,j)=>(a[j.discipline]=(a[j.discipline]||0)+1,a),{}), refDisc:R.reduce((a,r)=>(a[r.discipline.toLowerCase()]=(a[r.discipline.toLowerCase()]||0)+1,a),{}), qtyBlankToOne:R.filter(r=>r.quantity==null).every(r=>J.find(j=>j.sourceRow===r.sourceRow&&j.split===r.splitIndex).quantity===1)}})()`);
    const note = await text('.overlay-note'); const proto = await text('.proto-tag');
    const kpis = await ev(`[...document.querySelectorAll('.kpi')].map(k=>({id:k.dataset.kpi, n:k.querySelector('.k-n').textContent, btn:k.tagName==='BUTTON'}))`);
    const rec1 = await ev(`(()=>{const d=EQ.fac.dashboard({}); const l=EQ.fac.list({}).rows.filter(x=>x.job.state==='active'); return {k:d.kpi, ov:l.filter(x=>x.info.overdue).length, prog:l.filter(x=>x.info.status==='inProgress').length, hold:l.filter(x=>x.info.status==='onHold').length, comp:l.filter(x=>x.info.status==='completed').length, total:l.length, ds:l.filter(x=>x.info.dueSoon && !x.info.period).length}})()`);
    const shown = Object.fromEntries(kpis.map((k) => [k.id, k.n]));
    const recon = Number(shown.active) === rec1.total && Number(shown.overdue) === rec1.ov && Number(shown.inProgress) === rec1.prog && Number(shown.onHold) === rec1.hold && Number(shown.completed) === rec1.comp && Number(shown.dueSoon) === rec1.ds;
    await b.click('[data-fk="kpi-overdue"]'); await b.wait(500);
    const hash = await ev('location.hash'); const rows = await lanesRows(); const onlyOver = await ev(`[...document.querySelectorAll('.lane .lane-list:not(.dup) .frow')].every(r=>r.classList.contains('g-overdue'))`); const nOver = Object.values(rows).reduce((a, x) => a + x.length, 0);
    await b.click('[data-fk="kpi-overdue"]'); await b.wait(400); const cleared = !/focus=overdue/.test(await ev('location.hash'));
    return { ok: ref.ref === 114 && ref.same && JSON.stringify(ref.byDisc) === JSON.stringify(ref.refDisc) && ref.qtyBlankToOne && /SYNTHETIC PROGRESS/.test(note) && /synthetic/i.test(proto) && kpis.length === 8 && recon && /focus=overdue/.test(hash) && onlyOver && nOver === rec1.ov && cleared, detail: JSON.stringify({ ref, kpis: shown, recon, nOver, overdue: rec1.ov }) };
  });
  await step('H02', ['S27', 'FDB02'], 'Three discipline lanes (Electrical, Mechanical, Civil) in the order Overdue, On hold, In progress, Due soon, Pending, then completed in the last 7 days; each lane header carries a completion ring; rows show type icon, name, frequency, progress with quantity and %, due countdown, PIC, mode, picture or icon; status uses colour plus icon plus text', async () => {
    await go('management', '/fac/dashboard', {}, 900);
    const order = await ev(`(()=>{const G=EQ.fac.GROUPS; const out={}; for (const l of document.querySelectorAll('.lane')) { const gs=[...l.querySelectorAll('.lane-list:not(.dup) .frow')].map(r=>[...r.classList].find(c=>/^g-/.test(c))); const idx=gs.map(g=>({'g-overdue':0,'g-hold':1,'g-prog':2,'g-soon':3,'g-pend':4,'g-done':5}[g])); out[l.dataset.lane]={n:idx.length, mono: idx.every((v,i)=>i===0||idx[i-1]<=v)}; } return out;})()`);
    const names = await ev(`[...document.querySelectorAll('.lane h2')].map(h=>h.textContent).join('|')`);
    const rings = await count('.lane .ring'); const sample = await ev(`(()=>{const r=document.querySelector('.lane-list:not(.dup) .frow'); return {icon:!!r.querySelector('.thumb svg, .thumb img'), name:!!r.querySelector('.name').textContent, meta:r.querySelector('.meta').textContent, bar:!!r.querySelector('.prog .bar')||!!r.querySelector('.hold-reason'), pill:!!r.querySelector('.pill svg') && r.querySelector('.pill').textContent.length>3, due:r.querySelector('.due').textContent}})()`);
    const allPills = await ev(`[...document.querySelectorAll('.lane-list:not(.dup) .pill')].every(p=>p.querySelector('svg') && p.textContent.trim().length>=3)`);
    const pics = await count('.lane-list:not(.dup) .thumb img'); const model = await ev(`(()=>{const d=EQ.fac.dashboard({}); return d.lanes.map(l=>[l.code,l.total,l.pct,l.rows.length]).join(';')})()`);
    return { ok: Object.values(order).every((o) => o.mono && o.n > 5) && names === 'Electrical|Mechanical|Civil' && rings === 3 && sample.icon && sample.name && /\d+/.test(sample.due) && /·/.test(sample.meta) && sample.bar && allPills && pics >= 3, detail: JSON.stringify({ order, rings, pics, sample, model }) };
  });
  await step('H03', ['S27', 'FDB02'], 'A status change glows briefly and the job moves to its new place; a new update slides into the live ticker and the latest-proof carousel; the due-load chart shows 8 weeks stacked by discipline', async () => {
    await go('management', '/fac/dashboard', {}, 900);
    const before = await lanesRows(); const tick0 = await ev(`[...document.querySelectorAll('.tick-list:not(.dup) .tick')].map(t=>t.dataset.key)`);
    const target = await ev(`(()=>{const d=EQ.fac.dashboard({}); const l=d.lanes.find(x=>x.code==='mechanical'); const r=l.rows.find(x=>x.group==='pending' && x.target>1); return r?{id:r.id,key:r.key,name:r.name}:null})()`);
    // the FAC user puts a pending job on hold (a status change): it must move to the On hold group
    const res = await ev(`(()=>{const keep=EQ.state.role; EQ.state.role='facTeam'; EQ.access.refreshSession('t'); const r=EQ.fac.api.hold('${target.id}','Area not released by OPS (check H03)'); EQ.state.role=keep; EQ.access.refreshSession('t'); return [r.ok, r.code]})()`);
    await ev('EQ.rerender()'); await b.wait(700);
    const after = await lanesRows(); const glow = await ev(`document.querySelectorAll('.lane .frow.glow').length`);
    const i0 = before.mechanical.indexOf(target.key), i1 = after.mechanical.indexOf(target.key);
    const grp = await ev(`[...document.querySelectorAll('.lane[data-lane=mechanical] .lane-list:not(.dup) .frow')].find(r=>r.dataset.key==='${target.key}').className`);
    // a new progress update arrives (another user): ticker gains an item with glow
    await ev(`EQ.fac.simulateArrival({photo:true}); EQ.rerender()`); await b.wait(600);
    const tick1 = await ev(`[...document.querySelectorAll('.tick-list:not(.dup) .tick')].map(t=>t.dataset.key)`); const tickGlow = await ev(`document.querySelectorAll('.tick-list:not(.dup) .tick.glow').length`);
    const proof = await ev(`({n:(document.querySelector('.proof-n')||{}).textContent, caption:(document.querySelector('.proof-cap')||{}).textContent})`);
    const bars = await count('.load-svg rect.lb'); const wk = await count('.load-svg .lb-wk'); const legend = await text('.load-legend');
    return { ok: res[0] && i0 !== i1 && /g-hold/.test(grp) && glow >= 1 && tick1.length >= tick0.length && tick1[0] !== tick0[0] && tickGlow >= 1 && /Photo \d+ of \d+/.test(proof.n) && /synthetic photo/.test(proof.caption) && wk === 8 && bars >= 8 && /Electrical/.test(legend) && /Civil/.test(legend), detail: JSON.stringify({ moved: [i0, i1], grp, glow, tick: [tick0.length, tick1.length], proof, bars, wk }) };
  });
  await step('H04', ['S27', 'FDB04'], 'Refreshing every 60 seconds patches in place: the DOM nodes of unchanged rows survive, the layout does not move (KPI strip, lane headers, ticker, proof and due-load boxes keep their rectangles), the scroll anchor is kept; the page says "Updated hh:mm"', async () => {
    await go('management', '/fac/dashboard', {}, 1200);
    await b.click('[data-fk="dash-pause"]'); await b.wait(200);   // freeze motion so positions are comparable
    const rects = () => ev(`['.kpis','.lane[data-lane=electrical] header','.lane[data-lane=mechanical] header','.lane[data-lane=civil] header','.ticker','.proof','.load','.dash-head'].map(s=>{const r=document.querySelector(s).getBoundingClientRect(); return [s, Math.round(r.top*10)/10, Math.round(r.left*10)/10, Math.round(r.width*10)/10, Math.round(r.height*10)/10]})`);
    const tag = await ev(`(()=>{const rows=[...document.querySelectorAll('.lane-list:not(.dup) .frow')]; rows.forEach((r,i)=>{r._probe=i}); const st=EQ.dashState(); return {n:rows.length, off:st.lanes.mechanical.offset, key0:st.lanes.mechanical.keys[0]}})()`);
    const r0 = await rects(); const d0 = await dash();
    await ev(`EQ.refresh(true)`); await b.wait(500); await ev(`EQ.refresh(true)`); await b.wait(500);
    await ev(`EQ.fac.simulateArrival({photo:false}); EQ.rerender()`); await b.wait(700);
    const r1 = await rects(); const d1 = await dash();
    const survivors = await ev(`[...document.querySelectorAll('.lane-list:not(.dup) .frow')].filter(r=>r._probe!==undefined).length`);
    const moved = r0.filter((r, i) => !(near(r[1], r1[i][1], 0.6) && near(r[2], r1[i][2], 0.6) && near(r[3], r1[i][3], 0.6) && near(r[4], r1[i][4], 0.6)));
    const upd = await text('.updated');
    // scroll anchor: a row below the fold keeps its place when a row above changes
    const anchor = await ev(`(()=>{const L=EQ.dashState().lanes.mechanical; return [L.offset, L.keys[0]]})()`);
    return { ok: moved.length === 0 && survivors >= tag.n - 3 && /Updated \d\d:\d\d Asia\/Colombo/.test(upd) && d1.mode === d0.mode && Math.abs(d1.lanes.mechanical.offset - d0.lanes.mechanical.offset) < 90 + 1, detail: JSON.stringify({ moved, survivors, rows: tag.n, offsets: [d0.lanes.mechanical.offset, d1.lanes.mechanical.offset], upd }) };
  });
  await step('H05', ['S27', 'FDB02', 'FDB03', 'S16'], 'Moving lists run at a measured, steady speed (px/s from the Admin setting, readable), the ticker moves faster horizontally, and the loop is seamless', async () => {
    await b.viewport(1920, 1080); await go('management', '/fac/dashboard', {}, 1500);
    // sample the real animation with requestAnimationFrame: offset vs time for 4 s
    const run = await ev(`new Promise(res=>{const L=()=>EQ.dashState().lanes; const s=[]; const t0=performance.now(); let last=null; const tick=()=>{const t=performance.now()-t0; const st=EQ.dashState(); s.push([t, st.lanes.electrical.offset, st.lanes.mechanical.offset, st.ticker.offset, st.speed, st.lanes.mechanical.rowH]); if(t<4200) requestAnimationFrame(tick); else res(s)}; requestAnimationFrame(tick);})`);
    const rate = (i, a, c) => { const dt = (run[c][0] - run[a][0]) / 1000; let d = run[c][i] - run[a][i]; return d / dt; };
    const speed = run[0][4]; const rowH = run[0][5];
    // windowed speeds (500 ms windows), ignoring the single wrap-around
    const win = []; for (let t = 0; t < 3400; t += 500) { const a = run.findIndex((r) => r[0] >= t), c = run.findIndex((r) => r[0] >= t + 500); if (a >= 0 && c > a) { const v = rate(2, a, c); if (v > 0) win.push(v); } }
    const mean = win.reduce((x, y) => x + y, 0) / win.length; const dev = Math.max(...win.map((v) => Math.abs(v - mean) / mean));
    const tickV = rate(3, 0, run.length - 1);
    const st = await dash();
    return { ok: st.mode === 'scroll' && st.lanes.mechanical.moving && speed >= 12 && speed <= 36 && Math.abs(mean - speed) / speed < 0.12 && dev < 0.2 && rowH * 1 > 40 && (speed * 60) / rowH <= 30 && tickV > 0 && tickV > mean && st.lanes.mechanical.T > st.lanes.mechanical.viewH, detail: JSON.stringify({ declaredPxPerSec: Math.round(speed * 10) / 10, measuredMean: Math.round(mean * 10) / 10, maxWindowDeviation: Math.round(dev * 1000) / 10 + ' %', rowsPerMinute: Math.round(speed * 60 / rowH * 10) / 10, rowH: Math.round(rowH), tickerPxPerSec: Math.round(tickV * 10) / 10, windows: win.length }) };
  });
  await step('H06', ['S27', 'FDB03', 'S16'], 'Hover and keyboard focus stop the lane or the ticker they are on, the Pause button stops everything, and releasing them resumes the motion', async () => {
    await go('management', '/fac/dashboard', {}, 1200);
    const moved = async (ms = 900) => { const a = await dash(); await b.wait(ms); const c = await dash(); return { lane: Math.abs(c.lanes.mechanical.offset - a.lanes.mechanical.offset) > 3, tick: Math.abs(c.ticker.offset - a.ticker.offset) > 3 }; };
    const base = await moved();
    await ev(`document.querySelector('.lane[data-lane=mechanical] .lane-view').dispatchEvent(new PointerEvent('pointerenter',{bubbles:false}))`); const hov = await moved();
    await ev(`document.querySelector('.lane[data-lane=mechanical] .lane-view').dispatchEvent(new PointerEvent('pointerleave',{bubbles:false}))`); const rel = await moved();
    await ev(`document.querySelector('.ticker .tick-view').dispatchEvent(new PointerEvent('pointerenter',{bubbles:false}))`); const thov = await moved();
    await ev(`document.querySelector('.ticker .tick-view').dispatchEvent(new PointerEvent('pointerleave',{bubbles:false}))`);
    await ev(`document.querySelector('.lane[data-lane=mechanical] .row-link[tabindex="0"]').focus()`); const foc = await moved(); await ev('document.activeElement.blur()'); const unf = await moved();
    await ev(`document.querySelector('.ticker .tick-link[tabindex="0"]').focus()`); const tfoc = await moved(); await ev('document.activeElement.blur()');
    await b.click('[data-fk="dash-pause"]'); const paused = await moved(); const pressed = await ev(`document.querySelector('[data-fk="dash-pause"]').getAttribute('aria-pressed')`);
    await b.click('[data-fk="dash-pause"]'); const resumed = await moved();
    return { ok: base.lane && base.tick && !hov.lane && rel.lane && !thov.tick && !foc.lane && unf.lane && !tfoc.tick && !paused.lane && !paused.tick && pressed === 'true' && resumed.lane && resumed.tick, detail: JSON.stringify({ base, hover: hov, released: rel, tickerHover: thov, focus: foc, unfocused: unf, tickerFocus: tfoc, paused, resumed }) };
  });
  await step('H07', ['S27', 'FDB03', 'S16', 'OPS02'], 'No keyboard focus trap: one tab stop per lane and for the ticker (roving), Tab walks through the whole page and reaches the controls after the moving lists, Shift+Tab walks back, and arrows move inside a lane', async () => {
    await go('management', '/fac/dashboard', {}, 1200);
    const stops = await ev(`({lanes:[...document.querySelectorAll('.lane')].map(l=>l.querySelectorAll('.lane-list:not(.dup) [tabindex="0"]').length), dupFocusable:document.querySelectorAll('.dup a[tabindex="0"], .dup [tabindex="0"]').length, ticker:document.querySelectorAll('.tick-list:not(.dup) [tabindex="0"]').length})`);
    await ev('document.activeElement && document.activeElement.blur(); window.scrollTo(0,0)');
    const seen = []; for (let i = 0; i < 90; i++) { await b.key('Tab'); const d = await ev(`(()=>{const a=document.activeElement; return a? (a.dataset.fk || a.className.split(' ')[0] || a.tagName)+'|'+(a.closest('.lane')?a.closest('.lane').dataset.lane:'')+'|'+(a.closest('.ticker')?'ticker':'')+'|'+(a.closest('.proof')?'proof':'')+'|'+(a.closest('.static-alt')?'static':'') : 'none'})()`); seen.push(d); if (/static/.test(d) && seen.some((x) => /proof/.test(x))) break; }
    const hitLane = ['electrical', 'mechanical', 'civil'].every((l) => seen.some((x) => x.includes('|' + l + '|'))); const hitTicker = seen.some((x) => /ticker/.test(x)); const hitProof = seen.some((x) => /proof/.test(x)); const hitStatic = seen.some((x) => /static/.test(x));
    const perLane = ['electrical', 'mechanical', 'civil'].map((l) => seen.filter((x) => x.includes('|' + l + '|')).length);
    // arrows inside a lane
    await ev(`document.querySelector('.lane[data-lane=civil] .row-link[tabindex="0"]').focus()`); const k0 = await ev('document.activeElement.dataset.key'); await b.key('ArrowDown'); const k1 = await ev('document.activeElement.dataset.key'); await b.key('Home'); const k2 = await ev('document.activeElement.dataset.key');
    // Shift+Tab leaves the lane backwards
    await b.key('Tab', { shift: true }); const back = await ev(`(()=>{const a=document.activeElement; return a.closest('.lane')? a.closest('.lane').dataset.lane : (a.dataset.fk||a.tagName)})()`);
    return { ok: stops.lanes.every((n) => n === 1) && stops.ticker === 1 && stops.dupFocusable === 0 && hitLane && hitTicker && hitProof && hitStatic && perLane.every((n) => n === 1) && k0 !== k1 && k2 === k0 && back !== 'civil', detail: JSON.stringify({ stops, perLaneTabStops: perLane, steps: seen.length, k: [k0, k1, k2], back }) };
  });
  await step('H08', ['S27', 'FDB03', 'S16'], 'Static accessible alternative: a collapsible full table of every dashboard job (skip link and Static view button), motion off in Static view, with every job reachable by link', async () => {
    await go('management', '/fac/dashboard', {}, 1000);
    await ev(`document.querySelector('.skip-dash').click()`); await b.wait(300);
    const open = await ev(`document.getElementById('dash-static').open`); const rows = await count('#dash-static tbody tr'); const want = await ev(`EQ.fac.dashboard({}).lanes.reduce((a,l)=>a+l.rows.length,0)`);
    const links = await count('#dash-static tbody a'); const focusOk = await ev(`document.activeElement.dataset.fk`);
    await go('management', '/fac/dashboard?motion=off', {}, 900); const st = await dash(); const tr = await ev(`[...document.querySelectorAll('.lane-track')].map(t=>t.style.transform).join('')`); const mode = await ev(`document.querySelector('.fac-dash').dataset.motion`);
    const a0 = await dash(); await b.wait(900); const a1 = await dash();
    return { ok: open && rows === want && links === want && focusOk === 'static-summary' && mode === 'static' && tr === '' && a0.lanes.mechanical.offset === a1.lanes.mechanical.offset, detail: JSON.stringify({ rows, want, mode }) };
  });
  await step('H09', ['S27', 'FDB03', 'S16'], 'prefers-reduced-motion: the lanes flip a page every 8 seconds instead of scrolling (page indicator shown), the ticker is static, nothing scrolls continuously', async () => {
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await go('management', '/fac/dashboard', {}, 1500);
    const mode = await ev(`document.querySelector('.fac-dash').dataset.motion`); const ind = await text('.lane[data-lane=mechanical] .page-ind');
    const pg0 = await ev(`EQ.dashState().lanes.mechanical.page`); const tr0 = await ev(`document.querySelector('.lane[data-lane=mechanical] .lane-track').style.transform`);
    await b.wait(4000); const mid = await ev(`EQ.dashState().lanes.mechanical.page`); const tickT = await ev(`document.querySelector('.tick-track').style.transform`);
    await b.wait(5500); const pg1 = await ev(`EQ.dashState().lanes.mechanical.page`); const tr1 = await ev(`document.querySelector('.lane[data-lane=mechanical] .lane-track').style.transform`); const ind1 = await text('.lane[data-lane=mechanical] .page-ind');
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    return { ok: mode === 'flip' && /Page 1 of \d+/.test(ind) && pg0 === mid && pg1 === pg0 + 1 && tr0 !== tr1 && /Page 2 of/.test(ind1) && tickT === '', detail: JSON.stringify({ mode, ind, pages: [pg0, mid, pg1], t: [tr0, tr1], ind1 }) };
  });
  await step('H10', ['S27', 'FDB05', 'S16'], 'TV mode at 1920x1080: navigation hidden, larger text, the whole dashboard (KPIs, three lanes, ticker, proof, due load) fits one screen without page scroll, Exit TV mode works; management only (no anonymous dashboard)', async () => {
    await b.viewport(1920, 1080); await go('management', '/fac/dashboard', {}, 1000);
    const fs0 = await ev(`parseFloat(getComputedStyle(document.querySelector('.lane-list:not(.dup) .name')).fontSize)`);
    await go('management', '/fac/dashboard?tv=1', {}, 1200);
    const r = await ev(`({fs:parseFloat(getComputedStyle(document.querySelector('.lane-list:not(.dup) .name')).fontSize), nav:getComputedStyle(document.querySelector('.topbar')).display, bodyTv:document.body.classList.contains('tv'), sh:document.scrollingElement.scrollHeight, ih:innerHeight, sw:document.scrollingElement.scrollWidth, iw:innerWidth, parts:['.kpis','.lanes','.ticker','.proof','.load'].map(s=>{const e=document.querySelector(s).getBoundingClientRect(); return [s, Math.round(e.top), Math.round(e.bottom)]}), exit:!!document.querySelector('[data-fk="dash-tv"]')})`);
    const inView = r.parts.every(([, t, bt]) => t >= 0 && bt <= r.ih + 1);
    await b.click('[data-fk="dash-tv"]'); await b.wait(400); const exited = !/tv=1/.test(await ev('location.hash')) && (await ev(`getComputedStyle(document.querySelector('.topbar')).display`)) !== 'none';
    // no anonymous view: a role without the tab gets 403, not the dashboard
    await go('noAccess', '/fac/dashboard?tv=1', {}, 600); const anon = await text('main');
    return { ok: r.bodyTv && r.nav === 'none' && r.fs >= fs0 && r.sh <= r.ih + 1 && r.sw <= r.iw && inView && r.exit && exited && /No access/.test(anon), detail: JSON.stringify({ fontNormal: fs0, fontTv: r.fs, scrollHeight: r.sh, innerHeight: r.ih, parts: r.parts, exited }) };
  });
  await step('H11', ['S27', 'FDB04', 'OPS01'], 'Stale and error states: a failed refresh keeps the last good data with "Updated hh:mm", a STALE marker and a warning; an error state shows no data and never presents jobs as completed; empty state explains the import', async () => {
    await go('management', '/fac/dashboard', {}, 1000); const hh = (await text('.updated')).match(/Updated (\d\d:\d\d)/);
    await ev(`EQ.state.data='stale'; EQ.refresh(false)`); await b.wait(600); const st = await text('.dash-banner'); const upd = await text('.updated'); const rows = await count('.lane .frow');
    await go('management', '/fac/dashboard', { data: 'error' }, 700); const er = await text('main'); const eRows = await count('.frow');
    await go('management', '/fac/dashboard', { data: 'empty' }, 700); const em = await text('main');
    return { ok: !!hh && /Showing the last good data from \d\d:\d\d/.test(st) && /STALE/.test(upd) && /Updated \d\d:\d\d/.test(upd) && rows > 50 && /could not be loaded/.test(er) && eRows === 0 && /No FAC jobs yet/.test(em) && /Admin > FAC > Import/.test(em), detail: JSON.stringify({ upd, banner: st.slice(0, 60), rows }) };
  });
  await step('H12', ['S27', 'FAC10', 'FDB01'], 'Dashboard filters persist and restore; filtered on-time KPI shows Civil inspection 71%, 5/7, and Electrical no percentage with no eligible cycles; Clear filters resets [Repair-R02B round 2]', async () => {
    await go('management', '/fac/dashboard', {}, 900);
    await ev(`(()=>{const s=document.getElementById('df-d'); s.value='mechanical'; s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.wait(500);
    await ev(`(()=>{const s=document.getElementById('df-t'); s.value='inspection'; s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.wait(500);
    const h1 = await ev('location.hash'); const lanes = await ev(`[...document.querySelectorAll('.lane')].filter(l=>!l.hidden).map(l=>l.dataset.lane)`); const types = await ev(`[...document.querySelectorAll('.lane:not([hidden]) .lane-list:not(.dup) .meta')].every(m=>/Inspection/.test(m.textContent))`);
    const want = await ev(`EQ.fac.dashboard({discipline:'mechanical',type:'inspection'}).kpi.active`); const shown = await text('[data-kpi=active] .k-n');
    await b.goto(base + h1 + (h1.includes('?') ? '' : '')); await b.wait(900); const again = await ev(`({d:document.getElementById('df-d').value, t:document.getElementById('df-t').value})`);
    const withRole = url({ role: 'management' }, h1.replace('#', '')); await b.goto(withRole); await b.wait(900); const restored = await ev(`({d:document.getElementById('df-d').value, t:document.getElementById('df-t').value, lanes:[...document.querySelectorAll('.lane')].filter(l=>!l.hidden).length})`);
    await b.clickText('.dash-filters button', 'Clear filters'); await b.wait(500); const cleared = await ev('location.hash');
    // Review repeat F2: assert the visible performance KPI, including zero denominator,
    // rather than only active counts. Seeded Civil inspection cycles are 5 on time / 7.
    await go('management', '/fac/dashboard?discipline=electrical', {}, 900);
    const electrical = await text('[data-kpi=ontime]');
    const electricalN = await text('[data-kpi=active] .k-n');
    await go('management', '/fac/dashboard?discipline=civil&type=inspection', {}, 900);
    const civilInspection = await text('[data-kpi=ontime]');
    const performance = electricalN === '18' && /no cycles completed yet/.test(electrical) && !/%/.test(electrical)
      && /71\s*%/.test(civilInspection) && /5 of 7 cycles/.test(civilInspection);
    return { ok: performance && /discipline=mechanical/.test(h1) && /type=inspection/.test(h1) && lanes.length === 1 && lanes[0] === 'mechanical' && types && String(want) === shown && restored.d === 'mechanical' && restored.t === 'inspection' && restored.lanes === 1 && !/discipline=/.test(cleared), detail: JSON.stringify({ h1, want, shown, restored, cleared, electrical, civilInspection }) };
  });
  await step('H13', ['S27', 'FDB06', 'S16'], 'Phone (390x844): KPI strip and one combined list without auto-scroll, lanes hidden, latest-proof carousel with thumbnails only, no horizontal scroll', async () => {
    await b.viewport(390, 844, true, 2); await go('management', '/fac/dashboard', {}, 1200);
    const r = await ev(`({mode:document.querySelector('.fac-dash').dataset.motion, comb:getComputedStyle(document.querySelector('.combined')).display, lanes:getComputedStyle(document.querySelector('.lanes')).display, kpis:document.querySelectorAll('.kpi').length, kpiVisible:document.querySelector('.kpis').getBoundingClientRect().height>40, rows:document.querySelectorAll('.combined .frow').length, sw:document.scrollingElement.scrollWidth, iw:innerWidth, proofImg:!!document.querySelector('.proof img'), ticker:getComputedStyle(document.querySelector('.ticker')).display})`);
    const o0 = await ev(`window.scrollY`); await b.wait(1500); const o1 = await ev(`window.scrollY`); const tr = await ev(`[...document.querySelectorAll('.combined, .combined-list')].map(e=>e.style.transform).join('')`);
    await b.viewport(1920, 1080);
    return { ok: r.mode === 'combined' && r.comb !== 'none' && r.lanes === 'none' && r.kpis === 8 && r.kpiVisible && r.rows >= 50 && r.sw <= r.iw && r.proofImg && o0 === o1 && tr === '', detail: JSON.stringify(r) };
  });


  // =============================================================== I. FAC Jobs
  const cardsOf = () => ev(`[...document.querySelectorAll('.fcard')].map(c=>({name:c.querySelector('.fc-name').textContent, yours:!!c.querySelector('.tag.gold'), cls:c.className}))`);
  await step('I01', ['S28', 'FAC10'], 'FAC Jobs opens on My work (overdue, due soon, in progress; own PIC first), then Board (Pending, In progress, On hold, Completed this cycle) and List; filters and search are kept in the URL and restore from the link', async () => {
    await go('facTeam', '/fac/jobs', {}, 900);
    const view = await ev(`[...document.querySelectorAll('.view-seg button')].map(b=>b.textContent+(b.getAttribute('aria-pressed')==='true'?'*':'')).join('|')`);
    const cards = await cardsOf(); const want = await ev(`(()=>{const r=EQ.fac.list({}); return EQ.fac.myWork(r.rows, r.me).map(x=>x.job.name)})()`);
    const firstNotYours = cards.findIndex((c) => !c.yours); const lastYours = cards.map((c) => c.yours).lastIndexOf(true);
    const mineOnly = cards.every((c) => /g-(overdue|prog|soon)/.test(c.cls) || true);
    await b.click('[data-fk="view-board"]'); await b.wait(400);
    const cols = await ev(`[...document.querySelectorAll('.fcol h2')].map(h=>h.textContent).join('|')`);
    const colCounts = await ev(`[...document.querySelectorAll('.fcol header')].map(h=>Number(h.querySelector('.tag').textContent))`);
    const wantCols = await ev(`(()=>{const r=EQ.fac.list({}).rows.filter(x=>x.job.state==='active'); return ['pending','inProgress','onHold','completed'].map(s=>r.filter(x=>x.info.status===s).length)})()`);
    await b.click('[data-fk="view-list"]'); await b.wait(400); const listRows = await count('.fac-list tbody tr');
    // filters in the URL
    await ev(`(()=>{const s=document.getElementById('ff-d'); s.value='civil'; s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.wait(400);
    await ev(`(()=>{const s=document.getElementById('ff-f'); s.value='quarterly'; s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await b.wait(400);
    const h1 = await ev('location.hash'); const n1 = await ev(`document.querySelector('[data-fk="job-count"]').textContent`); const wantN = await ev(`EQ.fac.list({discipline:'civil',frequency:'quarterly'}).rows.length`);
    await b.goto(url({ role: 'facTeam' }, h1.replace('#', ''))); await b.wait(900); const rest = await ev(`({d:document.getElementById('ff-d').value, f:document.getElementById('ff-f').value, n:document.querySelector('[data-fk="job-count"]').textContent})`);
    return { ok: /My work\*\|Board\|List/.test(view) && cards.length === want.length && cards.length >= 10 && cards.slice(0, Math.max(0, lastYours + 1)).every((c) => c.yours) && lastYours >= 3 && (firstNotYours < 0 || firstNotYours > lastYours) && cols === 'Pending|In progress|On hold|Completed (this cycle)' && JSON.stringify(colCounts) === JSON.stringify(wantCols) && listRows >= 40 && /discipline=civil/.test(h1) && /frequency=quarterly/.test(h1) && n1.startsWith(wantN + ' job') && rest.d === 'civil' && rest.f === 'quarterly' && rest.n === n1, detail: JSON.stringify({ view, mine: cards.length, ownFirst: lastYours + 1, cols, colCounts, h1, n1 }) };
  });
  await step('I02', ['S28', 'FAC05', 'FAC07', 'S25'], 'One-tap Done today / Done this week completes the current cycle once (a repeat is refused, nothing double counted); same-day undo of the own last update works; undo of another user\'s update or after midnight is refused; Admin correction with a reason keeps the previous values', async () => {
    await go('facTeam', '/fac/jobs', {}, 800);
    const ids = await ev(`(()=>{const J=EQ.state.D.fac.jobs; const d=J.find(j=>j.freqCode==='daily' && EQ.fac.info(j).status!=='completed' && !j.isOnHold && j.state==='active'); const w=J.find(j=>j.freqCode==='weekly' && EQ.fac.info(j).status!=='completed' && !j.isOnHold && j.state==='active'); return {d:d&&d.id, w:w&&w.id}})()`);
    await ev(`EQ.nav('/fac/jobs', {view:'list', q:'${await ev(`EQ.fac.byId('${ids.d}').name`)}'.slice(0,20)})`); await b.wait(500);
    const before = await ev(`EQ.fac.info(EQ.fac.byId('${ids.d}')).done`);
    await b.click(`[data-fk="done-${ids.d}"]`); await b.wait(500);
    const after = await ev(`({done:EQ.fac.info(EQ.fac.byId('${ids.d}')).done, status:EQ.fac.info(EQ.fac.byId('${ids.d}')).status, btn:!!document.querySelector('[data-fk="done-${ids.d}"]')})`);
    const again = await ev(`(()=>{const r=EQ.fac.api.progress('${ids.d}',{kind:'doneToday', key:'again-'+Math.random()}); return [r.ok, r.code, EQ.fac.info(EQ.fac.byId('${ids.d}')).done]})()`);
    const wk = await ev(`(()=>{const a=EQ.fac.api.progress('${ids.w}',{kind:'doneThisWeek', key:'w1'}); const b=EQ.fac.api.progress('${ids.w}',{kind:'doneThisWeek', key:'w2'}); const wrong=EQ.fac.api.progress('${ids.d}',{kind:'doneThisWeek', key:'w3'}); return [a.ok, b.code, wrong.code, EQ.fac.info(EQ.fac.byId('${ids.w}')).done]})()`);
    // undo: own latest update same day works; other user refused; after midnight refused
    const und = await ev(`(()=>{const out={}; const j='${ids.d}';
      out.other=(()=>{EQ.state.role='eqfac'; EQ.access.refreshSession('t'); const r=EQ.fac.api.undo(j); EQ.state.role='facTeam'; EQ.access.refreshSession('t'); return [r.status, r.code]})();
      const last=EQ.fac.byId(j).updates.filter(u=>u.state==='active').slice(-1)[0]; const keep=last.recordedUtc; last.recordedUtc=new Date(Date.now()-30*3600e3).toISOString(); const late=EQ.fac.api.undo(j); last.recordedUtc=keep; out.late=[late.status, late.code];
      const ok=EQ.fac.api.undo(j); out.own=[ok.ok, EQ.fac.info(EQ.fac.byId(j)).done, EQ.fac.byId(j).updates.filter(u=>u.state==='undone').length]; return out;})()`);
    // Admin correction with a reason keeps the previous values
    const corr = await ev(`(()=>{const j=EQ.fac.byId('fj-2'); EQ.state.role='admin'; EQ.access.refreshSession('t'); const info0=EQ.fac.info(j); const up=j.updates.filter(u=>u.state==='active').slice(-1)[0];
      const none=EQ.fac.api.correct('fj-2',{reason:'',items:[{type:'quantity',updateId:up.id,qty:'10'}]}); const r=EQ.fac.api.correct('fj-2',{reason:'Typed the wrong quantity (check I02)',items:[{type:'quantity',updateId:up.id,qty:'10'}]});
      const c=j.corrections.slice(-1)[0]; const out={noReason:none.code, ok:r.ok, prev:c&&c.items[0].before, next:c&&c.items[0].after, reason:c&&c.reason, by:c&&c.by, before:info0.done}; EQ.state.role='facTeam'; EQ.access.refreshSession('t'); out.facTeam=EQ.fac.api.correct('fj-2',{reason:'x',items:[]}).status; return out;})()`);
    return { ok: after.done === after.done && after.status === 'completed' && before < after.done + 1 && !after.btn && again[0] === false && again[1] === 'cycle_already_completed' && wk[0] && wk[1] === 'cycle_already_completed' && wk[2] === 'kind_frequency_mismatch' && wk[3] >= 1 && und.other[0] === 403 && und.other[1] === 'not_update_author' && und.late[1] === 'undo_window_passed' && und.own[0] && und.own[2] === 1 && corr.noReason === 'reason_required' && corr.ok && String(corr.next) === '10' && corr.prev !== undefined && corr.prev !== null && /Typed the wrong quantity/.test(corr.reason) && corr.facTeam === 403, detail: JSON.stringify({ before, after, again, wk, und, corr }) };
  });
  await step('I03', ['S25', 'FAC06', 'FAC03', 'FAC04'], 'Update progress: partial updates accumulate; more than the remaining quantity and a future date are refused; reaching the quantity asks for confirmation and completes the cycle; the next due date follows the recorded completion date in calendar months and the next cycle opens (the job shows Completed, next due date, per DATA s17.11)', async () => {
    await go('facTeam', '/fac/jobs', {}, 700);
    // a monthly rolling job with quantity 3 and no progress
    const jid = await ev(`(()=>{const j=EQ.state.D.fac.jobs.find(j=>j.freqCode==='monthly' && j.quantity===3 && j.kind==='recurring' && EQ.fac.info(j).done===0 && !j.isOnHold && j.state==='active'); return j&&j.id})()`);
    await ev(`EQ.nav('/fac/jobs', {view:'list', q:EQ.fac.byId('${jid}').name.slice(0,24)})`); await b.wait(500);
    const open = async (n) => { await b.click(`[data-fk="prog-${jid}"]`); await b.wait(300); };
    await open(); await b.click('dialog button[type="submit"]'); await b.wait(400); const e0 = await text('dialog');
    await b.setValue('#fp-qty', '9'); await b.click('dialog button[type="submit"]'); await b.wait(400); const e1 = await text('dialog');
    await b.setValue('#fp-qty', '1'); await b.setValue('#fp-date', EQ_PLUS1()); await b.click('dialog button[type="submit"]'); await b.wait(400); const e2 = await text('dialog');
    await b.setValue('#fp-date', await ev('EQ.todayColombo()')); await b.setValue('#fp-note', 'first unit (check I03)'); await b.click('dialog button[type="submit"]'); await b.wait(600);
    const d1 = await ev(`EQ.fac.info(EQ.fac.byId('${jid}'))`);
    await open(); await b.setValue('#fp-qty', '1'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const d2 = await ev(`EQ.fac.info(EQ.fac.byId('${jid}')).done`);
    await open(); await b.setValue('#fp-qty', '1'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const confirmText = await text('dialog[open]:last-of-type'); const conf = /Complete this cycle/.test(confirmText);
    const stillOpen = await ev(`EQ.fac.info(EQ.fac.byId('${jid}')).done`);
    await b.clickText('dialog[open] button', 'Yes, complete the cycle'); await b.wait(700);
    const job = await ev(`(()=>{const j=EQ.fac.byId('${jid}'); const i=EQ.fac.info(j); const today=EQ.todayColombo(); const [y,m,d]=today.split('-').map(Number); const t=new Date(Date.UTC(y,m,1)); const last=new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0)).getUTCDate(); t.setUTCDate(Math.min(d,last)); return {status:i.status, done:i.done, lastDone:j.lastDoneOn, dueOn:i.dueOn, wantDue:t.toISOString().slice(0,10), cycles:j.cycles.map(c=>[c.seq,c.state]), open:j.cycles.filter(c=>c.state==='open').length, ups:j.updates.filter(u=>u.state==='active').length}})()`);
    return { ok: /Enter a whole number|quantity/i.test(e0) && /Only 3 remain|remain/i.test(e1) && /future/.test(e2) && d1.done === 1 && d2 === 2 && conf && stillOpen === 2 && job.ups === 3 && job.open === 1 && job.cycles.slice(-1)[0][1] === 'open' && job.lastDone === (await ev('EQ.todayColombo()')) && job.dueOn === job.wantDue && job.status === 'completed' /* DATA s17.11: Completed, next due <date>, until the next cycle has progress or is due soon */, detail: JSON.stringify({ e0: e0.slice(0, 60), e1: e1.slice(0, 80), e2: e2.slice(0, 80), d1: d1.done, d2, conf, job }) };
  });
  function EQ_PLUS1() { const d = new Date(Date.now() + 36 * 3600e3); return d.toISOString().slice(0, 10); }
  await step('I04', ['S25', 'FAC08', 'S26', 'FAC09'], 'Hold needs a reason, shows On hold, blocks progress updates and release restores the previous status; photos: camera capture input (JPG/PNG), at most 5 per update, oversized, disguised and traversal-named files refused', async () => {
    await go('facTeam', '/fac/jobs', {}, 700);
    const jid = await ev(`(()=>{const j=EQ.state.D.fac.jobs.find(j=>j.quantity>3 && EQ.fac.info(j).status==='inProgress' && !j.isOnHold && j.state==='active' && j.kind==='recurring'); return j&&j.id})()`);
    await ev(`EQ.nav('/fac/jobs', {view:'list', q:EQ.fac.byId('${jid}').name.slice(0,24)})`); await b.wait(500);
    await b.click(`[data-fk="hold-${jid}"]`); await b.wait(300); await b.click('dialog button[type="submit"]'); await b.wait(400); const e = await text('dialog');
    await b.setValue('#fh-reason', 'Area not released by OPS (check I04)'); await b.click('dialog button[type="submit"]'); await b.wait(600);
    const held = await ev(`(()=>{const j=EQ.fac.byId('${jid}'); const i=EQ.fac.info(j); return {status:i.status, hold:j.isOnHold, reason:j.holdReason}})()`);
    const blocked = await ev(`(()=>{const r=EQ.fac.api.progress('${jid}',{qty:1,key:'hb'+Math.random()}); return [r.status,r.code]})()`);
    const dashHold = await ev(`EQ.fac.dashboard({}).lanes.flatMap(l=>l.rows).find(r=>r.id==='${jid}').group`);
    await b.click(`[data-fk="rel-${jid}"]`); await b.wait(500); const rel = await ev(`(()=>{const i=EQ.fac.info(EQ.fac.byId('${jid}')); return {status:i.status, hold:EQ.fac.byId('${jid}').isOnHold}})()`);
    // photos
    const pe = await ev(`[EQ.facPhotoError({name:'x.exe',type:'application/octet-stream',size:100}), EQ.facPhotoError({name:'x.png',type:'text/html',size:100}), EQ.facPhotoError({name:'big.jpg',type:'image/jpeg',size:11*1024*1024}), EQ.facPhotoError({name:'..\\\\..\\\\evil.png',type:'image/png',size:10}), EQ.facPhotoError({name:'ok.jpg',type:'image/jpeg',size:1000})]`);
    const six = await ev(`(()=>{const r=EQ.fac.api.progress('${jid}',{qty:1,photos:[1,2,3,4,5,6].map(i=>({name:'p'+i+'.jpg',src:'data:,'})),key:'six'+Math.random()}); return [r.status, r.code]})()`);
    await b.click(`[data-fk="prog-${jid}"]`); await b.wait(300); const input = await ev(`(()=>{const i=document.getElementById('fp-photos'); return {capture:i.getAttribute('capture'), accept:i.getAttribute('accept'), multiple:i.multiple, label:/Take or add photos/.test(document.querySelector('dialog').textContent)}})()`); await b.key('Escape'); await b.wait(300);
    return { ok: /Enter why the job is on hold/.test(e) && held.status === 'onHold' && held.hold && /Area not released/.test(held.reason) && blocked[0] === 409 && blocked[1] === 'job_on_hold' && dashHold === 'onHold' && rel.status === 'inProgress' && !rel.hold && pe.slice(0, 4).every((x) => !!x) && pe[4] === null && six[0] === 422 && six[1] === 'validation_failed' && input.capture === 'environment' && /image\/jpeg,image\/png/.test(input.accept) && input.multiple && input.label, detail: JSON.stringify({ held, blocked, dashHold, rel, pe: pe.map((x) => (x || 'ok').slice(0, 30)), six, input }) };
  });
  await step('I05', ['S28', 'FAC10'], 'Job detail: fields, current cycle progress, timeline of updates with who/when/quantity/note/photos, previous cycles with On time / Late by n days, Admin correction visible', async () => {
    const jid = await ev(`(()=>{const j=EQ.state.D.fac.jobs.find(j=>j.cycles.filter(c=>c.state==='completed').length>=1 && j.updates.some(u=>u.photos&&u.photos.length)); return j?j.id:EQ.state.D.fac.jobs.find(j=>j.updates.some(u=>u.kind!=='importOpening')).id})()`).catch(() => null);
    await go('facTeam', '/fac/jobs', {}, 500);
    const id = await ev(`(()=>{const j=EQ.state.D.fac.jobs.find(j=>j.cycles.some(c=>c.state==='completed')); return j?j.id:null})()`);
    const uid = await ev(`(()=>{const j=EQ.state.D.fac.jobs.find(j=>j.updates.some(u=>u.kind!=='importOpening' && u.photos.length)); return j?j.id:null})()`);
    const use = id || uid; await ev(`EQ.nav('/fac/jobs/${use}', {})`); await b.wait(600); const t = await text('main');
    await ev(`EQ.nav('/fac/jobs/${uid}', {})`); await b.wait(600); const t2 = await text('main'); const imgs = await count('.photos img');
    const prevRows = await ev(`document.querySelectorAll('.facjob-page table tbody tr').length`);
    return { ok: !!use && !!uid && /Previous cycles/.test(t) && /Current cycle/.test(t) && /Timeline|timeline/.test(t2) && /By Synthetic/.test(t2) && imgs >= 1 && /(On time|Late by \d+ d|No due date|Missed)/.test(t + t2) && /Job number/.test(t) && /Completed quantity/.test(t), detail: JSON.stringify({ use, uid, imgs, hasResult: /(On time|Late by \d+ d)/.test(t + t2) }) };
  });
  await step('I06', ['S28', 'S23', 'ACC04', 'FAC11'], 'One-time job form (FAC Team, default on): creates a job with no frequency or due date that closes on completion; EQ Team and Management have no add button; the export button exports exactly the filtered rows with the source columns plus the calculated ones', async () => {
    await go('facTeam', '/fac/jobs', {}, 700);
    await b.click('[data-fk="add-onetime"]'); await b.wait(300); await b.click('dialog button[type="submit"]'); await b.wait(400); const err = await text('dialog');
    await b.setValue('#fj-d', 'civil'); await b.setValue('#fj-t', 'inspection'); await b.setValue('#fj-name', 'Check one-time roof survey (check I06)'); await b.setValue('#fj-q', '2'); await b.click('dialog button[type="submit"]'); await b.wait(700);
    const hash = await ev('location.hash'); const job = await ev(`(()=>{const j=EQ.state.D.fac.jobs.find(x=>x.name==='Check one-time roof survey (check I06)'); const i=EQ.fac.info(j); return {kind:j.kind, freq:j.freqCode, due:i.dueOn, status:i.status, id:j.id}})()`);
    const done = await ev(`(()=>{const a=EQ.fac.api.progress('${'FJ'}'.replace('FJ',EQ.fac.byId ? EQ.state.D.fac.jobs.find(x=>x.name==='Check one-time roof survey (check I06)').id : ''),{allDone:true, confirmCompletion:true, key:'ot1'}); const j=EQ.state.D.fac.jobs.find(x=>x.name==='Check one-time roof survey (check I06)'); return {ok:a.ok, status:EQ.fac.info(j).status, open:j.cycles.filter(c=>c.state==='open').length, state:j.state}})()`);
    await go('eqTeam', '/fac/jobs', {}, 600); const eqBtn = await exists('[data-fk="add-onetime"]'); await go('management', '/fac/jobs', {}, 600); const mBtn = await exists('[data-fk="add-onetime"]'); const acts = await count('.btn-act');
    const ex = await ev(`(()=>{const q={discipline:'civil',frequency:'quarterly'}; const r=EQ.fac.exportRows(q); const l=EQ.fac.list(q).rows; return {cols:r.columns.slice(0,12), colsAll:r.columns.length, rows:r.rows.length, list:l.length, btn:true}})()`);
    await go('management', '/fac/jobs?discipline=civil&frequency=quarterly', {}, 600); const exBtn = await exists('[data-fk="fac-export"]');
    const exOff = await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'management',feature:'export.excel',on:false}], EQ.state.D.access.version,'x'); EQ.state.role='management'; EQ.access.refreshSession('t'); const r=EQ.fac.exportRows({}); EQ.state.role='admin'; EQ.access.refreshSession('t'); return [r.status,r.code]})()`);
    const exNoView = await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'eqTeam',feature:'fac.jobs.view',on:false}], EQ.state.D.access.version,'x'); EQ.state.role='eqTeam'; EQ.access.refreshSession('t'); const r=EQ.fac.exportRows({}); EQ.state.role='admin'; EQ.access.refreshSession('t'); return [r.status,r.code]})()`);
    return { ok: /Choose a discipline|Enter the job name/.test(err) && /fac\/jobs\/fj-n/.test(hash) && job.kind === 'oneTime' && job.freq === 'as-required' && job.due === null && done.ok && done.status === 'completed' && done.open === 0 && !eqBtn && !mBtn && acts === 0 && ex.rows === ex.list && ex.cols.slice(0, 4).join() === 'Section,Internal Section,Inspection/ Service,Description' && ex.colsAll > 16 && exBtn && exOff[0] === 403 && exNoView[0] === 403, detail: JSON.stringify({ job, done, ex, exOff, exNoView }) };
  });
  await step('I07', ['S28', 'S26', 'OPS02', 'FAC09'], 'FAC Jobs on a phone (390x844): one column, filters folded, large one-tap buttons, the Update progress form is full screen with the camera control and no horizontal scroll', async () => {
    await b.viewport(390, 844, true, 2); await go('facTeam', '/fac/jobs', {}, 900);
    const r = await ev(`({sw:document.scrollingElement.scrollWidth, iw:innerWidth, cols:getComputedStyle(document.querySelector('.fcards')).gridTemplateColumns.split(' ').length, fold:document.querySelector('.filter-fold').open, btnH:Math.min(...[...document.querySelectorAll('.fcard .btn-act')].slice(0,6).map(b=>b.getBoundingClientRect().height)), nav:getComputedStyle(document.querySelector('.topnav')).display})`);
    const jid = await ev(`document.querySelector('.fcard [data-fk^="prog-"]').dataset.fk.replace('prog-','')`);
    await b.click(`[data-fk="prog-${jid}"]`); await b.wait(400);
    const d = await ev(`(()=>{const dlg=document.querySelector('dialog'); const r=dlg.getBoundingClientRect(); const cam=document.querySelector('label.file-btn').getBoundingClientRect(); const sub=document.querySelector('dialog button[type=submit]').getBoundingClientRect(); return {w:Math.round(r.width), h:Math.round(r.height), camVisible:cam.width>40 && cam.height>=36, subH:Math.round(sub.height), sw:document.scrollingElement.scrollWidth, iw:innerWidth}})()`);
    await b.key('Escape'); await b.wait(200); await b.viewport(1920, 1080);
    return { ok: r.sw <= r.iw && r.cols === 1 && r.fold === false && r.btnH >= 40 && d.w >= 380 && d.h >= 800 && d.camVisible && d.subH >= 40 && d.sw <= d.iw, detail: JSON.stringify({ r, d }) };
  });

  // =============================================================== J. Admin: FAC master list, import preview, settings
  await step('J01', ['S23', 'FAC01', 'FAC02', 'ADM05'], 'Admin FAC import preview: 114 jobs from 111 sheet rows, every row shown with how it will be saved (blank quantity 1, blank PIC/mode/dates stay blank, two-frequency rows as two jobs, row 14 On hold with its remark), the JSON\'s issues and known source issues (U-30) listed, nothing saved before Admin confirms, a re-run locked after progress', async () => {
    await go('admin', '/admin/fac/import', {}, 900); const t = await text('main');
    await ev(`document.getElementById('imp-rows').open=true`); await b.wait(200);
    const rows = await count('#imp-rows tbody tr'); const r14 = await text('#imp-rows tr[data-row="14"]'); const splits = await ev(`[...document.querySelectorAll('#imp-rows tbody tr')].filter(r=>/\\.\\d$/.test(r.dataset.row)).length`);
    const blankQ = await ev(`[...document.querySelectorAll('#imp-rows tbody tr')].filter(r=>/blank in sheet/.test(r.textContent)).length`); const wantBlank = await ev(`EQ.FAC_REF.jobs.filter(j=>j.quantity==null).length`);
    const known = await count('.imp-known tbody tr'); const wantKnown = await ev('EQ.FAC_REF.knownSourceIssues.length'); const issues = await count('.imp-issues tbody tr');
    const wantIssues = await ev(`new Set(EQ.FAC_REF.jobs.flatMap(j=>j.issues)).size`);
    const tiles = await ev(`[...document.querySelectorAll('.kpis-sm .kpi')].map(k=>k.textContent)`);
    await b.click('[data-fk="imp-confirm"]'); await b.wait(400); const dlg = await text('dialog'); await b.key('Escape'); await b.wait(200);
    const blankPic = await ev(`EQ.FAC_REF.jobs.filter(j=>!j.pic).every(j=>EQ.state.D.fac.jobs.find(x=>x.sourceRow===j.sourceRow&&x.split===j.splitIndex).picName===null)`);
    return { ok: rows === 114 && /sheet rows/.test(tiles.join(' ')) && tiles[0].startsWith('111') && tiles[1].startsWith('114') && /On hold: Not released/.test(r14) && splits >= 6 && blankQ === wantBlank && known === wantKnown && known === 7 && issues >= Math.min(wantIssues, 3) && /Nothing is saved before Admin confirms/.test(t) && /Sheet status, percentages and next dates are not stored as typed values/.test(t) && /(409 import_locked_by_progress|Confirm creates 114 jobs)/.test(dlg) && blankPic, detail: JSON.stringify({ rows, splits, blankQ, known, issues, wantIssues, tiles: tiles.slice(0, 2), dlg: dlg.slice(0, 120) }) };
  });
  await step('J02', ['S23', 'ADM04', 'ACC04'], 'Admin FAC master list: all jobs listed, add a recurring job, edit, deactivate with a reason (never delete, history kept) and reactivate; FAC Team sees no master-list controls unless the right is granted', async () => {
    await go('admin', '/admin/fac/master-list', {}, 800);
    const rows = await count('.fac-list tbody tr'); const total = await ev('EQ.state.D.fac.jobs.length'); const add = await exists('[data-fk="ml-add"]');
    const r = await ev(`(()=>{const out={}; const a=EQ.fac.api.createJob({kind:'recurring',discipline:'electrical',typeCode:'service',name:'Admin test job J02',freqCode:'quarterly',quantity:5,lastDoneOn:EQ.shiftDay(EQ.todayColombo(),-20)}); out.add=[a.ok, a.job&&EQ.fac.info(a.job).dueOn];
      const id=a.job.id; const n=EQ.state.D.fac.jobs.length; const noReason=EQ.fac.api.deactivate(id,''); const off=EQ.fac.api.deactivate(id,'No longer needed (check J02)'); out.off=[noReason.code, off.ok, EQ.fac.byId(id).state, EQ.state.D.fac.jobs.length===n];
      const upd=EQ.fac.api.progress(id,{qty:1,key:'j02'}); out.blockedWhenOff=[upd.status, upd.code]; const on=EQ.fac.api.reactivate(id); out.on=[on.ok, EQ.fac.byId(id).state];
      const ed=EQ.fac.api.updateJob(id,{name:'Admin test job J02 (renamed)', discipline:'electrical', typeCode:'service', quantity:5, freqCode:'quarterly', kind:'recurring'}); out.edit=[ed.ok, EQ.fac.byId(id).edits.length>=1]; return out;})()`);
    await go('facTeam', '/admin/fac/master-list', {}, 600); const ft = await text('main');
    await go('facTeam', '/fac/jobs', {}, 600); const ftBtn = await exists('[data-fk="add-recurring"]');
    return { ok: rows >= 30 && total >= 114 && add && r.add[0] && r.add[1] && r.off[0] === 'reason_required' && r.off[1] && r.off[2] === 'deactivated' && r.off[3] && r.blockedWhenOff[1] === 'job_not_active' && r.on[0] && r.on[1] === 'active' && r.edit[0] && r.edit[1] && /403/.test(ft) && !ftBtn, detail: JSON.stringify({ rows, total, ...r, ftBtn }) };
  });
  await step('J03', ['S27', 'S24'], 'Admin FAC settings: due-soon window, refresh interval and dashboard scroll speed are validated and applied (the dashboard speed follows the setting); the frequency list shows the seeded intervals (tri-annually 4 months, bi-annually 6 months)', async () => {
    await go('admin', '/admin/fac/settings', {}, 800); const t = await text('main');
    const r = await ev(`(()=>{const bad=EQ.fac.api.saveSettings({dueSoonDays:0,refreshSeconds:5,scrollPxPerSec:500}); const ok=EQ.fac.api.saveSettings({dueSoonDays:10,refreshSeconds:60,scrollPxPerSec:30}); return {bad:[bad.status,Object.keys(bad.fields||{}).join()], ok:ok.ok, s:EQ.state.D.fac.settings}})()`);
    await ev(`EQ.nav('/fac/dashboard',{})`); await b.wait(900); const sp = await ev(`EQ.dashState().speed`); const soon = await text('[data-kpi=dueSoon] .k-l');
    return { ok: /Tri-annually/.test(t) && /4 month/.test(t) && /Bi-annually/.test(t) && /6 month/.test(t) && r.bad[0] === 422 && r.bad[1].includes('dueSoonDays') && r.ok && sp >= 30 * 0.8 && sp <= 30 * 1.5 && /Due in 10 d/.test(soon), detail: JSON.stringify({ r, speed: sp, soon }) };
  });


  // =============================================================== K. layouts at the required sizes
  const SIZES = [['1920x1080', 1920, 1080, false], ['1366x768', 1366, 768, false], ['tablet 1024x768', 1024, 768, false], ['tablet 768x1024', 768, 1024, false], ['phone 390x844', 390, 844, true]];
  const ROUTES = [['eqTeam', '/eq/fleet'], ['eqTeam', `/eq/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&panel=spareParts`], ['eqTeam', '/eq/jobs/special'], ['eqTeam', '/eq/jobs/status'], ['eqTeam', '/eq/jobs/spare-parts'], ['management', '/fac/dashboard'], ['facTeam', '/fac/jobs'], ['facTeam', '/fac/jobs?view=board'], ['facTeam', '/fac/jobs/fj-2'], ['admin', '/admin/access'], ['admin', '/admin/fac/master-list'], ['admin', '/admin/fac/import'], ['admin', '/admin/fac/settings'], ['admin', '/admin/eq/zmms'], ['admin', '/admin/eq/spare-parts'], ['noAccess', '/eq/fleet']];
  await step('K01', ['OPS02', 'S16', 'FDB05', 'FDB06'], 'Layout at 1920x1080, 1366x768, tablet (1024x768 and 768x1024) and phone (390x844): every new route has no horizontal page overflow, no console error, no accessibility-audit issue (names, ids, focus) and the section switch and tabs stay reachable', async () => {
    const bad = []; let n = 0;
    for (const [label, w, h, mobile] of SIZES) {
      await b.viewport(w, h, mobile, mobile ? 2 : 1);
      for (const [role, hash] of ROUTES) {
        await go(role, hash, {}, 450); n += 1;
        // U1-C32: the equipment page now owns one real canvas; other routes still own none.
        // Wait for the rendered route/model rather than auditing during module loading.
        const modelPage = hash.startsWith('/eq/equipment/');
        for (let retry = 0; retry < 50; retry++) {
          if (await ev(`!!document.querySelector('main h1') && ${modelPage ? '!!window.EQ?.qc?.session?.ready' : 'true'}`)) break;
          await b.wait(200);
        }
        const a = await ev(`(()=>{const au=window.__protoAudit(); const sw=document.scrollingElement.scrollWidth, iw=innerWidth; const bar=document.querySelector('.topbar'); const br=bar?bar.getBoundingClientRect():null; return {issues:au.issues.slice(0,2), over:sw>iw+1?sw+'>'+iw:null, h1:au.h1, canvases:au.canvases, nav:!bar||getComputedStyle(bar).display!=='none'}})()`);
        const errs = b.errors();
        if (a.issues.length || a.over || errs.length || a.h1 < 1 || a.canvases !== (modelPage ? 1 : 0)) bad.push(label + ' ' + role + ' ' + hash.split('?')[0] + ' => ' + JSON.stringify({ i: a.issues, o: a.over, e: errs.slice(0, 1), h1: a.h1, c: a.canvases }));
      }
      // top bar reachability: the section switch and tabs of a user with both sections are on screen
      await go('eqfac', '/eq/fleet', {}, 450); const bar = await ev(`(()=>{const q=(s)=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return r.right<=innerWidth+1 && r.width>0}; const links=[...document.querySelectorAll('.topnav .nav-link, .section-switch .sec-link')].map(a=>{const r=a.getBoundingClientRect(); return r.width>0 && r.left>=0 && r.right<=innerWidth+1}); return links.every(Boolean)})()`);
      if (!bar) bad.push(label + ' top bar overflows');
    }
    await b.viewport(1920, 1080);
    return { ok: !bad.length, detail: bad.length ? bad.slice(0, 6).join(' | ') : n + ' route/size/persona combinations clean' };
  });
  await step('K02', ['FDB05', 'S27', 'OPS02'], 'FAC Dashboard at 1366x768 (normal and TV) and at 1920x1080: lanes readable (row text >= 13 px, at least 4 rows visible per lane), TV mode fits the screen without page scroll; tablet shows lanes in one column; moving lists keep a steady speed at each size', async () => {
    const out = {};
    for (const [label, w, h] of [['1920x1080', 1920, 1080], ['1366x768', 1366, 768]]) {
      await b.viewport(w, h); await go('management', '/fac/dashboard', {}, 1300);
      const n = await ev(`(()=>{const L=document.querySelector('.lane[data-lane=mechanical] .lane-view'); const row=document.querySelector('.lane-list:not(.dup) .frow'); const fs=parseFloat(getComputedStyle(row.querySelector('.name')).fontSize); return {viewH:Math.round(L.clientHeight), rowH:Math.round(row.getBoundingClientRect().height), fs:fs, rowsVisible:Math.floor(L.clientHeight/row.getBoundingClientRect().height), speed:EQ.dashState().speed}})()`);
      await go('management', '/fac/dashboard?tv=1', {}, 1300);
      const t = await ev(`({sh:document.scrollingElement.scrollHeight, ih:innerHeight, sw:document.scrollingElement.scrollWidth, iw:innerWidth, parts:['.kpis','.lanes','.ticker','.dash-bottom'].every(s=>{const r=document.querySelector(s).getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight+1}), rowH:Math.round(document.querySelector('.lane-list:not(.dup) .frow').getBoundingClientRect().height), rowsVisible:Math.floor(document.querySelector('.lane-view').clientHeight/document.querySelector('.lane-list:not(.dup) .frow').getBoundingClientRect().height)})`);
      out[label] = { normal: n, tv: t };
    }
    await b.viewport(768, 1024); await go('management', '/fac/dashboard', {}, 1000); const tab = await ev(`({cols:getComputedStyle(document.querySelector('.lanes')).gridTemplateColumns.split(' ').length, sw:document.scrollingElement.scrollWidth, iw:innerWidth, mode:document.querySelector('.fac-dash').dataset.motion})`);
    await b.viewport(1920, 1080);
    const ok = Object.values(out).every((o) => o.normal.fs >= 13 && o.normal.rowsVisible >= 4 && o.tv.sh <= o.tv.ih + 1 && o.tv.sw <= o.tv.iw && o.tv.parts && o.tv.rowsVisible >= 3) && tab.cols === 1 && tab.sw <= tab.iw && tab.mode === 'scroll';
    return { ok, detail: JSON.stringify({ out, tablet: tab }) };
  });

  await step('L04', ['ZM05', 'ZM06', 'S20', 'S21'], "Synthetic ZMMS and status history are self-consistent: every run's business date is the Asia/Colombo date of its start; every automatic or override-ended status row was written by a succeeded run of its own date at that run's end, with no reason and no user, and every automatic Breakdown/Maintenance lists causing ZMMS jobs from that run's plan; every Auto Breakdown/Maintenance equipment shows its causes; no daily job was created after now [Repair-R02B finding 2]", async () => {
    await go('admin', '/eq/jobs/status', {}, 600);
    const r = await ev(`(()=>{const z=EQ.state.D.zmms, now=Date.now(); const bad=[];
      z.runs.forEach(r=>{ if (r.businessDate!==EQ.todayOf(r.startedUtc)) bad.push('run '+r.id+' date'); if (Date.parse(r.endedUtc)>now) bad.push('run '+r.id+' in the future'); });
      const sys=EQ.state.D.statusChanges.filter(c=>c.kind==='automatic'||c.kind==='overrideEnded');
      sys.forEach(c=>{ const run=z.runs.find(r=>r.id===c.runId); if(!run||run.outcome!=='succeeded'){bad.push(c.id+' no run'); return;}
        if (EQ.todayOf(c.at)!==run.businessDate || c.planDate!==run.businessDate) bad.push(c.id+' date '+EQ.todayOf(c.at)+' vs run '+run.businessDate);
        if (c.at!==run.endedUtc) bad.push(c.id+' not at run end'); if (c.reason!==null) bad.push(c.id+' reason'); if (c.by) bad.push(c.id+' user');
        if (c.status!=='readyForOps') { if(!c.causes.length) bad.push(c.id+' no causes'); c.causes.forEach(no=>{ const j=z.jobs.find(x=>x.jobNo===no && x.date===run.businessDate && x.equipmentId===c.equipmentId); if(!j) bad.push(c.id+' cause '+no+' not in plan'); }); }
        else if (c.causes.length) bad.push(c.id+' ready with causes'); });
      EQ.state.D.equipment.filter(e=>e.zmmsMapped && e.statusSource==='zmms' && e.status && e.status!=='readyForOps').forEach(e=>{ if(!(e.statusCauses||[]).length) bad.push(e.code+' auto '+e.status+' without cause'); });
      const future=z.jobs.filter(j=>Date.parse(j.created.replace(' ','T')+'+05:30')>now).map(j=>j.jobNo);
      return {bad, future, automaticRows:sys.length, runsUsed:new Set(sys.map(c=>c.runId)).size, days:new Set(sys.map(c=>c.planDate)).size, rtg06:[EQ.eq('eq-rtg-demo-06').status, EQ.zmms.causeText(EQ.eq('eq-rtg-demo-06'))]};})()`);
    const board = await text('.status-board');
    return { ok: !r.bad.length && !r.future.length && r.automaticRows >= 5 && r.runsUsed >= 2 && r.days >= 2 && /Caused by ZMMS job/.test(r.rtg06[1]) && /Not in the ZMMS plan for/.test(board), detail: JSON.stringify(r) };
  });
  // =============================================================== L. hygiene, provenance and the ZMMS boundary
  await step('L01', ['S16', 'S17'], 'No page shows the words null, undefined, NaN or [object Object] and the prototype banner is on every route, for every persona', async () => {
    const bad = []; const routes = ['/eq/fleet', `/eq/equipment/${Q1}`, `/eq/equipment/${Q1}?main=mi-q01-01&panel=technical`, '/eq/equipment/eq-rtg-demo-01', '/eq/jobs/special', '/eq/jobs/status', '/eq/jobs/spare-parts', '/fac/dashboard', '/fac/dashboard?tv=1', '/fac/jobs', '/fac/jobs?view=board', '/fac/jobs/fj-2', '/admin/access', '/admin/fac/master-list', '/admin/fac/import', '/admin/fac/settings', '/admin/eq/equipment', '/admin/eq/zmms', '/admin/eq/spare-parts', '/admin/eq/positions'];
    let n = 0;
    for (const role of ['admin', 'management', 'eqTeam', 'facTeam', 'eqfac', 'noAccess']) {
      for (const r of routes) {
        await go(role, r, {}, 350); n += 1;
        const t = await ev(`({t:document.body.innerText, banner:!!document.querySelector('.proto-banner')})`);
        const m = t.t.match(/\b(null|undefined|NaN)\b|\[object [A-Za-z]+\]/);
        if (m || !t.banner) bad.push(role + ' ' + r + ' ' + (m ? m[0] : 'no banner'));
      }
    }
    return { ok: !bad.length, detail: bad.length ? bad.slice(0, 8).join(' | ') : n + ' page views clean' };
  });
  await step('L02', ['ZM04', 'S20', 'S15'], 'The prototype never contacts ZMMS or any external host: every network request during a full walk-through is to 127.0.0.1 or a data URI; no account, password or token appears in the page, in browser storage or in the prototype source', async () => {
    b.clearEvents();
    for (const [role, r] of [['admin', '/admin/eq/zmms'], ['eqTeam', '/eq/fleet'], ['management', '/fac/dashboard'], ['facTeam', '/fac/jobs'], ['admin', '/admin/access']]) await go(role, r, {}, 600);
    const reqs = b.events.filter((e) => e.method === 'Network.requestWillBeSent').map((e) => e.params.request.url);
    const external = reqs.filter((u) => !/^(http:\/\/127\.0\.0\.1:|data:|about:)/.test(u));
    const storage = await ev(`JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage), document.cookie])`);
    const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(js|html|css|mjs|md)$/.test(f.name)) files.push(p); } };
    walk('artifacts/prototypes/p02-ui'); walk('artifacts/prototypes/p03-qc-model/js'); walk('tools/p02b');
    const hits = []; const secret = /(password|passwd|pwd|secret|api[_-]?key|bearer)\s*[:=]\s*['"`][^'"`\s]{3,}/i;
    for (const f of files) { const t = fs.readFileSync(f, 'utf8'); if (/vendor/.test(f)) continue; const m = t.match(secret); if (m) hits.push(f + ': ' + m[0].slice(0, 40)); }
    const zmmsUrls = []; for (const f of files) { const t = fs.readFileSync(f, 'utf8'); (t.match(/https?:\/\/[^\s'"`)]*zmms[^\s'"`)]*/gi) || []).forEach((u) => zmmsUrls.push(path.basename(f) + ' ' + u)); }
    return { ok: reqs.length > 5 && !external.length && !/password|token|secret/i.test(storage) && !hits.length && zmmsUrls.length === 0, detail: JSON.stringify({ requests: reqs.length, external: external.slice(0, 3), storage: storage.slice(0, 120), secretPatternHits: hits, zmmsUrlsInSource: zmmsUrls }) };
  });
  await step('L03', ['ZM01', 'ZM07', 'S20'], 'The synthetic ZMMS daily-job fixtures follow the layout of the real daily export profiled on 22 Oct 2026 (documents\\Daily All Running Jobs_CMMS-LK-2026-10-22.xls, structure only): same column set, same vocabularies, equipment code formats, non-fleet items in the unmatched / ignored list; no description or personal data is copied', async () => {
    const xls = fs.readFileSync('documents/Daily All Running Jobs_CMMS-LK-2026-10-22.xls', 'utf8');
    const ths = [...xls.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const cell = (title) => [...xls.matchAll(new RegExp('<td title="' + title.replace(/[()]/g, '\\$&') + '"[^>]*>([\\s\\S]*?)</td>', 'g'))].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    const realTypes = new Set(cell('Job Type')), realStatus = new Set(cell('Job Status')), realPri = new Set(cell('Priority')), realEq = cell('Equipment'); const realDesc = new Set(cell('Job Description'));
    await go('admin', '/admin/eq/zmms', {}, 600);
    const fx = await ev(`(()=>{const J=EQ.state.D.zmms.jobs; return {types:[...new Set(J.map(j=>j.typeText))], status:[...new Set(J.map(j=>j.statusText))], pri:[...new Set(J.map(j=>j.priority))], eq:[...new Set(J.map(j=>j.equipmentText))], keys:Object.keys(J[0]), descs:J.map(j=>j.desc), nonFleet:J.filter(j=>/^(SF|SK|WS|RS)/.test(j.equipmentText)).map(j=>j.match), origin:[...new Set(J.map(j=>j.origin))], names:J.some(j=>/@/.test(JSON.stringify(j)))}})()`);
    const need = ['jobNo', 'cwo', 'date', 'statusText', 'priority', 'created', 'dept', 'eqType', 'equipmentText', 'typeText', 'desc', 'mechStaff', 'mechHours', 'elecStaff', 'elecHours', 'fault', 'faultDesc', 'corrective', 'remark', 'instruction', 'workDone', 'statusRemarks'];
    const subset = (a, B) => a.every((x) => B.has(x));
    const codeOk = fx.eq.every((e) => /^(QC|RT|ES|SQ|SF|SK|WS|RS)-?\d{3}$/.test(e)); const realPattern = realEq.every((e) => /^[A-Z]{2}\d{3}$/.test(e));
    const copied = fx.descs.filter((d) => realDesc.has(d));
    return { ok: ths.length === 24 /* 24 named columns plus one blank action column */ && need.every((k) => fx.keys.includes(k)) && subset(fx.types, realTypes) && subset(fx.status, realStatus) && subset(fx.pri, realPri) && realTypes.size === 5 && realStatus.size === 5 && codeOk && realPattern && fx.nonFleet.length >= 4 && fx.nonFleet.every((m) => m !== 'matched') && copied.length === 0 && fx.origin.every((o) => o === 'developmentFixture') && !fx.names, detail: JSON.stringify({ exportColumns: ths.length, types: [...realTypes], status: [...realStatus], priority: [...realPri], fixtureTypes: fx.types, fixtureStatus: fx.status, nonFleetRows: fx.nonFleet.length, equipmentFormat: 'LLddd', copiedDescriptions: copied.length }) };
  });

} finally { /* closed below */ }

// ---------------------------------------------------------------- finish
const failed = results.filter((r) => r.status !== 'PASS').length;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ tool: 'tools/p02b/check_p02b.mjs', browser: b.browser, date: new Date().toISOString(), note: 'Prototype-level checks against the synthetic P02B prototype; not acceptance execution.', passed: results.length - failed, failed, results }, null, 2));
console.log(`\n${results.length} checks, ${failed} failed`);
await b.close();
process.exit(failed ? 1 : 0);
