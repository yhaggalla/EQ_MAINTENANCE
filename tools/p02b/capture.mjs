// P02B evidence screenshots (synthetic prototype data). Needs both servers (P02 on 5312, P03 on 5313). Software WebGL for the 3D page.
// Usage: node tools/p02b/capture.mjs [outDir]    default docs/evidence/P02B/screenshots
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p03/cdp.mjs';

const out = process.argv[2] || 'docs/evidence/P02B/screenshots';
fs.mkdirSync(out, { recursive: true });
const P02 = 'http://127.0.0.1:5312/', P03 = 'http://127.0.0.1:5313/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu: 'swiftshader', port: 9372 });
await b.send('Emulation.setFocusEmulationEnabled', { enabled: true });
{ const rawGoto = b.goto; b.goto = async (u) => { await rawGoto(u); await b.send('Emulation.setFocusEmulationEnabled', { enabled: false }); await b.send('Emulation.setFocusEmulationEnabled', { enabled: true }); }; } // a navigation resets the emulation
const log = [];
const E = (x) => b.eval(x);
let n = 0;
async function shot(name, { url, w = 1920, h = 1080, mobile = false, wait = 900, full = false, pre, fn }) {
  await b.viewport(w, h, mobile, mobile ? 2 : 1);
  b.clearEvents();
  await b.goto(url);
  if (/5313/.test(url)) { for (let i = 0; i < 80; i++) { if (await E('!!(window.__qcTiming || window.__qcFallback)')) break; await sleep(250); } await sleep(900); }
  await sleep(wait);
  if (pre) await pre();
  const file = path.join(out, String(++n).padStart(2, '0') + '-' + name + '.png');
  await b.screenshot(file, { fullPage: full });
  const errs = b.errors();
  log.push({ file: path.basename(file), url: url.replace(/^http:\/\/127.0.0.1:\d+\//, ''), viewport: w + 'x' + h + (mobile ? ' (phone emulation)' : ''), consoleErrors: errs.length });
  console.log(path.basename(file), errs.length ? 'ERRORS ' + JSON.stringify(errs.slice(0, 2)) : '');
}
const q1 = '/eq/equipment/eq-qc-demo-01';
const hash = (role, h, extra = '') => P02 + '?role=' + role + extra + '#' + h;
try {
  // ---- A. top bar for the six personas
  await shot('topbar-admin-eq-fleet', { url: hash('admin', '/eq/fleet') });
  await shot('topbar-management-eq-fleet-readonly', { url: hash('management', '/eq/fleet') });
  await shot('topbar-eqteam-eq-jobs', { url: hash('eqTeam', '/eq/jobs/special') });
  await shot('topbar-facteam-fac-dashboard-landing', { url: hash('facTeam', '/') });
  await shot('topbar-eq-and-fac-team-landing-eq', { url: hash('eqfac', '/') });
  await shot('no-access-all-tabs-off', { url: hash('noAccess', '/') });
  // ---- B. fleet
  await shot('fleet-1920', { url: hash('eqTeam', '/eq/fleet') });
  await shot('fleet-1366', { url: hash('eqTeam', '/eq/fleet'), w: 1366, h: 768 });
  await shot('fleet-phone', { url: hash('eqTeam', '/eq/fleet'), w: 390, h: 844, mobile: true, full: true });
  // ---- C. crane view flat, four tabs
  await shot('crane-flat-whole-maintenance', { url: hash('management', q1 + '?panel=maintenance') });
  await shot('crane-flat-main01-projects-special', { url: hash('management', q1 + '?main=mi-q01-01&panel=special') });
  await shot('crane-flat-part-technical', { url: hash('management', q1 + '?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&mode=technical&panel=technical') });
  await shot('crane-flat-main01-spare-parts', { url: hash('management', q1 + '?main=mi-q01-01&panel=spareParts') });
  await shot('crane-flat-spare-parts-1366', { url: hash('management', q1 + '?main=mi-q01-01&panel=spareParts'), w: 1366, h: 768 });
  await shot('crane-flat-tablet-drawer', { url: hash('management', q1 + '?main=mi-q01-01&panel=special'), w: 1024, h: 768, pre: async () => { await E(`document.querySelector('[data-fk="open-panel"]').click()`); await sleep(500); } });
  // ---- C2. crane view 3D (P03), same four tabs
  const u3 = (q) => P03 + '?eq=eq-qc-demo-01' + q;
  await shot('crane-3d-whole-maintenance', { url: u3(''), wait: 1500 });
  await shot('crane-3d-main01-projects-special', { url: u3('&main=mi-q01-01&panel=special'), wait: 1500 });
  await shot('crane-3d-part-motor-technical', { url: u3('&mode=technical&pkey=hoist_drive_motor_b&panel=technical'), wait: 1800 });
  await shot('crane-3d-main01-spare-parts', { url: u3('&main=mi-q01-01&mode=technical&panel=spareParts'), wait: 1500 });
  // ---- D. EQ Jobs three parts
  await shot('eq-jobs-special-and-daily', { url: hash('eqTeam', '/eq/jobs/special'), full: true });
  await shot('eq-jobs-special-daily-earlier-days-qc02', { url: hash('eqTeam', '/eq/jobs/special?equipment=eq-qc-demo-02&from=2026-10-01&to=2026-10-31'), full: true });
  await shot('eq-jobs-eq-status', { url: hash('eqTeam', '/eq/jobs/status'), full: true });
  await shot('eq-jobs-spare-parts-history', { url: hash('eqTeam', '/eq/jobs/spare-parts?equipment=eq-qc-demo-01'), full: true, pre: async () => { await E(`document.querySelector('[data-fk^="hist-"]').click()`); await sleep(400); } });
  await shot('eq-jobs-open-in-jobs-scoped-history', { url: hash('eqTeam', '/eq/jobs/special?equipment=eq-qc-demo-01&scope=main&target=mi-q01-01'), full: true });
  // ---- E. FAC dashboard
  await shot('fac-dashboard-1920', { url: hash('management', '/fac/dashboard'), wait: 1500 });
  await shot('fac-dashboard-tv-1920', { url: hash('management', '/fac/dashboard?tv=1'), wait: 1500 });
  await shot('fac-dashboard-1366', { url: hash('management', '/fac/dashboard'), w: 1366, h: 768, wait: 1500 });
  await shot('fac-dashboard-tv-1366', { url: hash('management', '/fac/dashboard?tv=1'), w: 1366, h: 768, wait: 1500 });
  await shot('fac-dashboard-tablet', { url: hash('management', '/fac/dashboard'), w: 768, h: 1024, wait: 1500, full: true });
  await shot('fac-dashboard-phone-combined-list', { url: hash('management', '/fac/dashboard'), w: 390, h: 844, mobile: true, full: true, wait: 1500 });
  await shot('fac-dashboard-filtered-in-url', { url: hash('management', '/fac/dashboard?discipline=mechanical&type=inspection&focus=overdue'), wait: 1500 });
  await shot('fac-dashboard-static-view-and-table', { url: hash('management', '/fac/dashboard?motion=off'), wait: 1200, full: true, pre: async () => { await E(`document.getElementById('dash-static').open = true`); await sleep(300); } });
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await shot('fac-dashboard-reduced-motion-page-flip', { url: hash('management', '/fac/dashboard'), wait: 1500 });
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await shot('fac-dashboard-stale-refresh-failed', { url: hash('management', '/fac/dashboard', '&data=stale'), wait: 1500 });
  await shot('fac-dashboard-error', { url: hash('management', '/fac/dashboard', '&data=error') });
  // ---- F. FAC jobs
  await shot('fac-jobs-my-work-1920', { url: hash('facTeam', '/fac/jobs') });
  await shot('fac-jobs-board', { url: hash('facTeam', '/fac/jobs?view=board') });
  await shot('fac-jobs-my-work-phone', { url: hash('facTeam', '/fac/jobs'), w: 390, h: 844, mobile: true, full: true });
  await shot('fac-jobs-update-progress-form-phone', { url: hash('facTeam', '/fac/jobs'), w: 390, h: 844, mobile: true, pre: async () => { await E(`document.querySelector('[data-fk^="prog-"]').click()`); await sleep(500); } });
  await shot('fac-job-detail-timeline-previous-cycles', { url: hash('facTeam', '/fac/jobs/fj-2'), full: true });
  await shot('fac-jobs-one-time-job-form', { url: hash('facTeam', '/fac/jobs'), pre: async () => { await E(`document.querySelector('[data-fk="add-onetime"]').click()`); await sleep(500); } });
  await shot('fac-jobs-management-read-only', { url: hash('management', '/fac/jobs') });
  // ---- G. Admin
  await shot('admin-access-matrix', { url: hash('admin', '/admin/access'), full: true });
  await shot('admin-fac-master-list', { url: hash('admin', '/admin/fac/master-list'), full: true });
  await shot('admin-fac-import-preview', { url: hash('admin', '/admin/fac/import'), full: true, pre: async () => { await E(`document.getElementById('imp-rows').open = true`); await sleep(300); } });
  await shot('admin-fac-settings', { url: hash('admin', '/admin/fac/settings'), full: true });
  await shot('admin-eq-zmms-health-failed-run', { url: hash('admin', '/admin/eq/zmms'), full: true });
  await shot('admin-eq-spare-parts-selection', { url: hash('admin', '/admin/eq/spare-parts'), full: true });
} finally {
  fs.writeFileSync(path.join(out, 'capture-log.json'), JSON.stringify({ tool: 'tools/p02b/capture.mjs', date: new Date().toISOString(), note: 'All screenshots show the synthetic P02B prototype (labelled); not a production view.', shots: log }, null, 2));
  await b.close();
}
console.log(n + ' screenshots');
process.exit(0);
