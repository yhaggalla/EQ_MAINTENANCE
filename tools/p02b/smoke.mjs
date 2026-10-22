// Quick smoke run: open routes for several personas, print console errors and audit issues. Not evidence; development aid.
import { launch } from '../p02/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const b = await launch({ port: 9352 });
await b.viewport(1920, 1080);
const routes = ['/eq/fleet', '/eq/equipment/eq-qc-demo-01', '/eq/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&panel=spareParts', '/eq/jobs/special', '/eq/jobs/status', '/eq/jobs/spare-parts', '/fac/dashboard', '/fac/jobs', '/fac/jobs/fj-2', '/admin/access', '/admin/fac/master-list', '/admin/fac/import', '/admin/fac/settings', '/admin/eq/spare-parts', '/admin/eq/zmms', '/admin/eq/equipment'];
for (const role of ['admin', 'eqTeam', 'facTeam', 'management', 'eqfac', 'noAccess']) {
  for (const r of routes) {
    b.clearEvents();
    await b.goto(base + '?role=' + role + '#' + r);
    await b.wait(500);
    const a = await b.eval('JSON.stringify({h:location.hash, a:window.__protoAudit(), t:document.querySelector("main").textContent.slice(0,60)})');
    const o = JSON.parse(a); const errs = b.errors();
    if (errs.length || o.a.issues.length) console.log(role, r, '->', o.h, 'ERR', errs.slice(0, 2), 'ISSUES', o.a.issues.slice(0, 3));
  }
}
console.log('smoke done');
await b.close();
