// U1-C54: one fleet register must reach every equipment selector and dashboard population.
import fs from 'node:fs';
import vm from 'node:vm';
import { launch } from '../p03/cdp.mjs';

const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/fleet-size-c54';
fs.mkdirSync(out, { recursive: true });
const checks = [], expected = { QC: 14, RTG: 46, ES: 7 };
const check = (name, ok, detail) => { checks.push({ name, pass: !!ok, detail }); if (!ok) throw Error(name + ': ' + JSON.stringify(detail)); };
const box = vm.createContext({ console, Intl, Date, URLSearchParams, setTimeout, clearTimeout }); box.window = box;
for (const file of ['util', 'catalog', 'params', 'fac-ref', 'fixtures', 'access', 'store', 'zmms', 'spares', 'fac', 'dialogs', 'views-jobs', 'views-eqjobs']) {
  vm.runInContext(fs.readFileSync(`artifacts/prototypes/p02-ui/js/${file}.js`, 'utf8'), box, { filename: file + '.js' });
}
let b;
try {
  const E = box.EQ; E.reset(); E.state.role = 'eqTeam'; E.access.refreshSession('C54');
  for (const [type, count] of Object.entries(expected)) {
    const rows = E.state.D.equipment.filter(e => e.typeCode === type);
    check(type + ' has exactly the requested active members and consecutive demo codes', rows.length === count && rows.every((e, i) => e.lifecycle === 'active' && e.code === `${type}-DEMO-${String(i + 1).padStart(2, '0')}`), rows.map(e => e.code));
  }
  check('67 unique equipment IDs, keys and codes', E.state.D.equipment.length === 67 && ['id', 'key', 'code'].every(k => new Set(E.state.D.equipment.map(e => e[k])).size === 67));
  const added = E.state.D.equipment.filter(e => e.typeCode === 'QC' ? Number(e.key.slice(1)) > 6 : e.typeCode === 'RTG' ? Number(e.key.slice(1)) >= 7 : Number(e.key.slice(1)) > 4);
  check('51 newly active members have no invented status/model/positions/history/ZMMS link', added.length === 51 && added.every(e => e.status === null && e.statusSince === null && e.modelCode === null && e.assoc === 'unassigned' && e.positionState === null && E.positionsOf(e.id).length === 0 && E.jobsOf(e.id, true).length === 0 && !e.zmmsMapped && !e.commissionedOn && !E.state.D.statusChanges.some(s => s.equipmentId === e.id)));
  check('Existing equipment-specific job and replacement identities survive', E.job('job-101').equipmentId === 'eq-qc-demo-01' && E.pos('pp-q01-007').key === 'hoist.drive.motor.a' && E.pos('pp-q02-007').equipmentId === 'eq-qc-demo-02' && E.state.D.jobs.length === 20);
  const c = E.fleetCounts(E.state.D.equipment);
  check('Status populations reconcile, including unknown units', c.total === 67 && c.unreported >= 51 && c.readyForOps + c.breakdown + c.maintenance + c.unreported === c.total, c);
  for (const [type, count] of Object.entries(expected)) {
    const job = E.api.createJob({ equipmentId: 'all', equipmentTypeCode: type, kind: 'project', level: 'equipment', title: 'C54 ' + type + ' fleet work' }).job;
    check(type + ' fleet job covers every member once and exports once', !!job && E.jobEquipment(job).length === count && E.jobEquipment(job).every(e => E.currentSpecial(e.id, { level: 'equipment', id: null }).jobs.filter(r => r.job.id === job.id).length === 1) && E.eqExport('special', { type }).rows.filter(r => r[0] === job.number).length === 1);
  }
  E.reset();
  check('Reset restores the 67-member baseline and keeps FAC at 114', E.state.D.equipment.length === 67 && E.state.D.fac.jobs.length === 114);

  b = await launch({ port: 9398, gpu: 'none' });
  const ev = expr => b.eval(expr);
  const nav = async (route, q = {}) => { await ev(`EQ.nav(${JSON.stringify(route)},${JSON.stringify(q)});window.scrollTo(0,0)`); await b.wait(220); };
  await b.viewport(1920, 1080); await b.goto(base + '?role=admin#/eq/fleet');
  check('Dashboard total and type badges show 67 / 14 / 46 / 7', await ev(`document.querySelector('[data-kpi="total"] .n').textContent==='67'&&[...document.querySelectorAll('.k-type b')].map(e=>e.textContent).join(',')==='14,46,7'&&document.querySelectorAll('.eq-card').length===67`));
  check('Dashboard status tiles reconcile with the register', await ev(`(()=>{const c=EQ.fleetCounts(EQ.state.D.equipment);return ['readyForOps','breakdown','maintenance','unreported'].every(k=>Number(document.querySelector('[data-kpi="'+k+'"] .n').textContent)===c[k])})()`));
  await b.screenshot(out + '/fleet-1920.png', { fullPage: true });
  for (const [type, count] of Object.entries(expected)) {
    await nav('/eq/fleet', { type });
    check(type + ' dashboard cards and group total include the last unit', await ev(`document.querySelector('[data-kpi="total"] .n').textContent==='${count}'&&document.querySelectorAll('.eq-card').length===${count}&&!!document.querySelector('[data-eq="eq-${type.toLowerCase()}-demo-${String(count).padStart(2, '0')}"]')`));
  }
  await nav('/eq/fleet', { layout: 'table' });
  check('Fleet table has all 67 equipment links', await ev(`document.querySelectorAll('main .fleet-group tbody tr').length===67`));
  await nav('/admin/eq/equipment');
  check('Admin register lists all 67 equipment including each last unit', await ev(`document.querySelector('main tbody').rows.length===67&&['eq-qc-demo-14','eq-rtg-demo-46','eq-es-demo-07'].every(id=>!!document.querySelector('main a[href="#/eq/equipment/'+id+'"]'))`));
  for (const tab of ['special', 'daily', 'status', 'spare-parts']) {
    await nav('/eq/jobs/' + tab);
    check(tab + ' equipment filter includes all 67', await ev(`document.querySelector('#flt-eq').options.length===68&&['eq-qc-demo-14','eq-rtg-demo-46','eq-es-demo-07'].every(id=>[...document.querySelector('#flt-eq').options].some(o=>o.value===id))`));
    if (tab === 'status') check('EQ status board has all 67 equipment rows', await ev(`document.querySelectorAll('main tr[data-eq]').length===67`));
  }
  await nav('/eq/jobs/special'); await b.click('[data-fk="add-job"]');
  for (const [type, count] of Object.entries(expected)) {
    await b.setValue('#jf-type', type);
    check(type + ' job form offers all members plus the shared fleet target', await ev(`(()=>{const o=[...document.querySelector('#jf-equipment').options].filter(o=>o.value);return o.length===${count + 1}&&o.some(o=>o.value==='all')&&o.filter(o=>o.value!=='all').every(o=>EQ.eq(o.value).typeCode==='${type}')})()`));
  }
  await b.setValue('#jf-equipment', 'eq-es-demo-07'); await b.click('#jf-kind-repair'); await b.setValue('#jf-title', 'C54 final ES inspection'); await b.click('dialog[open] [data-fk="submit"]'); await b.wait(450);
  check('A special job can be created for the last ES', await ev(`EQ.state.D.jobs.some(j=>j.equipmentId==='eq-es-demo-07'&&j.title==='C54 final ES inspection')`));
  await nav('/admin/eq/zmms'); await b.click('[data-fk="zm-add"]');
  check('ZMMS mapping selector offers every active unit without assigning any', await ev(`document.querySelector('#zm-eq').options.length===68&&[...document.querySelector('#zm-eq').options].some(o=>o.value==='eq-rtg-demo-46')&&!EQ.eq('eq-rtg-demo-46').zmmsMapped`));
  await b.key('Escape');
  for (const id of ['eq-qc-demo-14', 'eq-rtg-demo-46', 'eq-es-demo-07']) {
    await nav('/eq/equipment/' + id);
    check(id + ' detail opens with Unreported and safe model fallback', await ev(`!!document.querySelector('.eq-summary')&&document.querySelector('.eq-summary').textContent.includes(EQ.eq('${id}').code)&&document.querySelector('.eq-summary').textContent.includes('Unreported')&&!document.querySelector('canvas')`));
  }
  await ev(`EQ.reset();EQ.setPersona('management');document.getElementById('toasts')?.replaceChildren()`);
  for (const [w, h] of [[1920, 1080], [1366, 768]]) {
    await b.viewport(w, h); await nav('/eq/fleet', { tv: '1', motion: 'off' }); await b.wait(450);
    const paging = await ev(`(()=>{const root=document.querySelector('.tvf-body'),cards=[...root.querySelectorAll('.eq-card')],seen=new Set(),st=EQ.fleetTvState();let fit=true;for(let p=0;p<st.pages;p++){cards.forEach(c=>{c.hidden=Number(c.dataset.page)!==p});root.querySelectorAll('.fleet-group').forEach(g=>{g.hidden=!g.querySelector('.eq-card:not([hidden])')});const r=root.getBoundingClientRect();cards.filter(c=>!c.hidden).forEach(c=>{if(c.getBoundingClientRect().bottom>r.bottom+1)fit=false;seen.add(c.dataset.eq)});if(root.scrollHeight>root.clientHeight+1)fit=false;}return {pages:st.pages,seen:seen.size,fit,scroll:document.scrollingElement.scrollHeight-innerHeight,links:root.querySelectorAll('a.eq-card').length}})()`);
    check(w + 'px TV pages cover all 67 with no scrolling or edit links', paging.seen === 67 && paging.fit && paging.scroll <= 1 && paging.links === 0, paging);
    await nav('/eq/fleet', { tv: '1', motion: 'off' }); await b.wait(250); await b.screenshot(out + '/fleet-tv-' + w + '.png');
  }
  await b.viewport(375, 812, true); await nav('/eq/fleet');
  check('Phone fleet fits horizontally and retains all equipment', await ev(`document.documentElement.scrollWidth<=innerWidth+1&&document.querySelectorAll('.eq-card').length===67`));
  await b.screenshot(out + '/fleet-phone.png');
  await b.setValue('#fq', 'RTG-DEMO-46');
  check('Phone search reaches the last RTG', await ev(`document.querySelectorAll('.eq-card').length===1&&document.querySelector('.eq-card').dataset.eq==='eq-rtg-demo-46'`));
  check('Management remains read-only with the expanded fleet', await ev(`!document.querySelector('[data-fk="add-job"]')&&EQ.api.createJob({equipmentId:'eq-es-demo-07',kind:'repair',level:'equipment',title:'Denied C54 write'}).status===403`));
  check('No browser errors', b.errors().length === 0, b.errors());
} finally {
  const result = { passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, checks, errors: b?.errors() || [] };
  fs.writeFileSync(out + '/checks.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ passed: result.passed, failed: result.failed, last: checks.at(-1) }));
  if (b) await b.close();
}
