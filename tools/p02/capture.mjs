// Captures the review screenshots of the P02 prototype with headless Chrome (DevTools protocol).
// Usage: node tools/p02/capture.mjs [baseUrl] [set]   set = all | d1920 | d1366 | tablet | phone
import { launch } from './cdp.mjs';

const base = process.argv[2] || 'http://127.0.0.1:5312/';
const only = process.argv[3] || 'all';
const out = 'docs/evidence/P02/screenshots';
const u = (q, hash) => base + '?' + new URLSearchParams(q).toString() + '#' + hash;
const Q1 = 'eq-qc-demo-01', Q2 = 'eq-qc-demo-02';
const motorA = (k) => `main=mi-${k}-01&sub=si-${k}-011&part=pp-${k}-007`;

// Each scene: [file, query, hash, optional setup(b)]
const scenes = [
  ['01-fleet-eqteam', { role: 'eqTeam' }, '/fleet'],
  ['02-fleet-management-readonly', { role: 'management' }, '/fleet'],
  ['03-fleet-filter-maintenance', { role: 'eqTeam' }, '/fleet?type=QC&status=maintenance'],
  ['04-fleet-stale', { role: 'eqTeam', data: 'stale' }, '/fleet'],
  ['05-fleet-empty-admin', { role: 'admin', data: 'empty' }, '/fleet'],
  ['06-fleet-loading', { role: 'eqTeam', data: 'loading' }, '/fleet'],
  ['07-fleet-error', { role: 'eqTeam', data: 'error' }, '/fleet'],
  ['08-qc-overview', { role: 'eqTeam' }, `/equipment/${Q1}`],
  ['09-qc-main-hoist-selected', { role: 'eqTeam' }, `/equipment/${Q1}?main=mi-q01-01`],
  ['10-qc-motor-a-technical', { role: 'eqTeam' }, `/equipment/${Q1}?${motorA('q01')}&mode=technical`],
  ['11-qc02-same-motor-different-history', { role: 'eqTeam' }, `/equipment/${Q2}?${motorA('q02')}&mode=technical`],
  ['12-qc-technical-panel-parameters', { role: 'management' }, `/equipment/${Q1}?main=mi-q01-04&mode=technical&panel=technical`],
  ['13-qc-machinery-house-container', { role: 'eqTeam' }, `/equipment/${Q1}?container=machinery-house&mode=technical`],
  ['14-qc-management-readonly', { role: 'management' }, `/equipment/${Q1}?${motorA('q01')}`],
  ['15-qc-viewer-no-webgl', { role: 'eqTeam', viewer: 'nowebgl' }, `/equipment/${Q1}?${motorA('q01')}`],
  ['16-qc-viewer-load-failed', { role: 'eqTeam', viewer: 'loadfailed' }, `/equipment/${Q1}`],
  ['17-qc-no-verified-model', { role: 'eqTeam' }, '/equipment/eq-qc-demo-04'],
  ['18-qc-draft-positions', { role: 'admin' }, '/equipment/eq-qc-demo-03'],
  ['19-qc-unreported-status', { role: 'eqTeam' }, '/equipment/eq-qc-demo-03?panel=history'],
  ['20-rtg-detail-3d-unavailable', { role: 'eqTeam' }, '/equipment/eq-rtg-demo-01?main=mi-r01-04&sub=si-r01-044&part=pp-r01-005'],
  ['21-es-detail-3d-unavailable', { role: 'management' }, '/equipment/eq-es-demo-01'],
  ['22-jobs-board-eqteam', { role: 'eqTeam' }, '/jobs'],
  ['23-jobs-management-readonly', { role: 'management' }, '/jobs'],
  ['24-jobs-include-cancelled', { role: 'admin' }, '/jobs?includeCancelled=1&equipment=eq-qc-demo-02'],
  ['25-job-record-with-correction', { role: 'eqTeam' }, '/jobs/job-202'],
  ['26-dialog-add-job-invalid', { role: 'eqTeam' }, '/jobs', async (b) => { await b.click('[data-fk="add-job"]'); await b.wait(200); await b.click('dialog button[type="submit"]'); await b.wait(700); }],
  ['27-dialog-complete-replacement', { role: 'eqTeam' }, '/jobs?equipment=eq-qc-demo-01', async (b) => { await b.clickIn('.job', 'Replace main hoist motor B', 'Complete...'); await b.wait(250); }],
  ['28-dialog-complete-invalid', { role: 'eqTeam' }, '/jobs?equipment=eq-qc-demo-01', async (b) => { await b.clickIn('.job', 'Replace main hoist motor B', 'Complete...'); await b.wait(250); await b.setValue('#cf-date', ''); await b.click('dialog button[type="submit"]'); await b.wait(800); }],
  ['29-dialog-version-conflict', { role: 'eqTeam' }, '/jobs?equipment=eq-qc-demo-01', async (b) => { await b.eval('EQ.state.conflictNext = true'); await b.clickIn('.job', 'Replace main hoist motor B', 'Edit'); await b.wait(250); await b.click('dialog button[type="submit"]'); await b.wait(800); }],
  ['30-dialog-set-status-reason-required', { role: 'eqTeam' }, `/equipment/${Q2}`, async (b) => { await b.click('[data-fk="set-status"]'); await b.wait(200); await b.click('#sf-status-maintenance'); await b.click('dialog button[type="submit"]'); await b.wait(500); }],
  ['31-cancel-not-allowed-other-creator', { role: 'eqTeam' }, '/jobs?equipment=eq-qc-demo-02'],
  ['32-admin-equipment', { role: 'admin' }, '/admin/equipment'],
  ['33-admin-models-applicability', { role: 'admin' }, '/admin/models'],
  ['34-admin-catalog', { role: 'admin' }, '/admin/catalog'],
  ['35-admin-positions-draft', { role: 'admin' }, '/admin/positions?equipment=eq-qc-demo-03'],
  ['36-admin-parameters-conflicts', { role: 'admin' }, '/admin/parameters'],
  ['37-admin-bindings', { role: 'admin' }, '/admin/bindings'],
  ['38-admin-forbidden-eqteam', { role: 'eqTeam' }, '/admin/equipment'],
  ['40-keyboard-focus-tree', { role: 'eqTeam' }, `/equipment/${Q1}?main=mi-q01-01`, async (b) => { await b.eval(`document.querySelector('[data-nid="mi-q01-01"]').focus()`); await b.key('Tab', { shift: true }); await b.key('Tab'); await b.key('ArrowDown'); await b.key('ArrowDown'); await b.wait(150); }],
  ['41-keyboard-focus-form', { role: 'eqTeam' }, '/jobs', async (b) => { await b.click('[data-fk="add-job"]'); await b.wait(250); for (let i = 0; i < 4; i++) await b.key('Tab'); await b.wait(150); }],
  ['39-prototype-controls', { role: 'eqTeam', controls: '1' }, `/equipment/${Q1}`],
];

const sizes = {
  d1920: { w: 1920, h: 1080, mobile: false, only: null },
  d1366: { w: 1366, h: 768, mobile: false, only: ['01-fleet-eqteam', '02-fleet-management-readonly', '08-qc-overview', '10-qc-motor-a-technical', '12-qc-technical-panel-parameters', '14-qc-management-readonly', '20-rtg-detail-3d-unavailable', '22-jobs-board-eqteam', '27-dialog-complete-replacement', '28-dialog-complete-invalid', '35-admin-positions-draft', '33-admin-models-applicability', '40-keyboard-focus-tree'] },
  tablet: { w: 1024, h: 768, mobile: false, only: ['01-fleet-eqteam', '08-qc-overview', '10-qc-motor-a-technical', '22-jobs-board-eqteam', '27-dialog-complete-replacement', '32-admin-equipment'] },
  phone: { w: 390, h: 844, mobile: true, only: ['01-fleet-eqteam', '08-qc-overview', '10-qc-motor-a-technical', '22-jobs-board-eqteam', '26-dialog-add-job-invalid', '27-dialog-complete-replacement', '17-qc-no-verified-model'] },
};

const b = await launch({ port: 9341 });
try {
  for (const [key, s] of Object.entries(sizes)) {
    if (only !== 'all' && only !== key) continue;
    await b.viewport(s.w, s.h, s.mobile, 1);
    for (const [file, q, hash, setup] of scenes) {
      if (s.only && !s.only.includes(file)) continue;
      await b.goto(u(q, hash));
      await b.wait(650);
      if (key === 'tablet' && file === '10-qc-motor-a-technical') {
        await b.screenshot(`${out}/${key}/${file}-a-closed-drawers.png`);
        await b.click('[data-fk="open-tree"]'); await b.wait(350); await b.screenshot(`${out}/${key}/${file}-b-tree-drawer.png`);
        await b.eval('EQ.closeDrawer()'); await b.wait(150);
        await b.click('[data-fk="open-panel"]'); await b.wait(500); await b.screenshot(`${out}/${key}/${file}-c-details-drawer.png`);
        continue;
      }
      if (key === 'phone' && file === '08-qc-overview') {
        await b.screenshot(`${out}/${key}/${file}.png`);
        await b.click('[data-fk="open-tree"]'); await b.wait(350); await b.screenshot(`${out}/${key}/${file}-b-tree-drawer.png`);
        continue;
      }
      if (setup) await setup(b);
      const full = !hash.startsWith('/equipment') && !setup && file !== '39-prototype-controls';
      await b.screenshot(`${out}/${key}/${file}.png`, { fullPage: full && key !== 'phone' });
      const errs = b.errors();
      console.log(key, file, errs.length ? 'ERRORS: ' + errs.join('; ') : 'ok');
      b.clearEvents();
    }
  }
} finally { await b.close(); }
