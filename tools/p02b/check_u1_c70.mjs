// U1-C70 / D-220: QC tree from the component workbook (assembly > sub assembly > part, workbook names), "Excel items only"
// tick, workbook parts located in the 3D model (LHS = gate house end = -Z), group scope in panels and viewer, RTG/ES unchanged.
// Usage: node tools/p02b/check_u1_c70.mjs [base] [output folder]
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/qc-workbook-c70';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9397 }), results = [];
const ev = (x) => b.eval(x);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const step = async (name, fn) => { try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); } catch (e) { results.push({ name, pass: false, error: e.message }); console.log('FAIL ' + name + ': ' + e.message); } };
const shot = async (name) => { await b.screenshot(out + '/' + name + '.png'); };
const Q1 = 'eq-qc-demo-01';
const open = async (hash, role = 'eqTeam') => {
  await b.goto(base + '?role=' + role + '#' + hash);
  for (let n = 0; n < 60; n++) { if (await ev('!!window.EQ?.state?.D')) break; await b.wait(150); }
  await ev(`window.__errs=window.__errs||[];addEventListener('error',e=>__errs.push(String(e.message)))`);
};
const ready = async () => { for (let n = 0; n < 120; n++) { if (await ev('!!window.EQ?.qc?.session?.ready')) break; await b.wait(150); } await b.wait(500); };
const pick = async (sel) => { await b.click(sel); await b.wait(700); };
const tops = () => ev(`[...document.querySelectorAll('[role=tree] > li > ul > li')].map(li=>li.dataset.nid)`);
const P = (key, eq = Q1) => `EQ.positionsOf(${JSON.stringify(eq)}).find(p=>p.key===${JSON.stringify(key)})`;
const node = (key) => `EQ.qc.manifest.nodes.find(n=>n.key===${JSON.stringify(key)})`;
const cz = (key) => `((b)=>(b.min[2]+b.max[2])/2)(${node(key)}.bounds)`;
const cx = (key) => `((b)=>(b.min[0]+b.max[0])/2)(${node(key)}.bounds)`;

try {
  await b.viewport(1500, 950);
  await open('/eq/equipment/' + Q1 + '?view=3d&panel=spareParts'); await ready();

  await step('W1 Workbook data: 136 Excel items (QC01-QC14 list), all present as QC01 parts with the workbook names', async () => {
    const r = await ev(`(()=>{const H=EQ.qcHierarchy,eq=EQ.eq('${Q1}');const ex=H.items.filter(i=>i.excel);const ps=EQ.positionsOf(eq.id);
      const missing=ex.filter(i=>!ps.some(p=>p.key===i.key&&p.name===i.name)).map(i=>i.key);const c=EQ.qcTree.counts(eq);
      return {n:ex.length,missing,c,manual:H.items.filter(i=>!i.excel).length,rows:new Set(ex.map(i=>i.excelRow)).size}})()`);
    assert(r.n === 136 && r.rows === 136 && !r.missing.length && r.c.excel === 136 && r.c.all > 300 && r.manual > 50, JSON.stringify(r).slice(0, 400));
  });
  await step('W2 Existing system parts take the workbook names; other system parts are kept', async () => {
    const r = await ev(`({red:${P('hoist.drive.reducer.main')}.name,w1:${P('trolley.wheel.ls-b.1')}.name,gcr:${P('gantry.cable-reel.main')}.name,rope:${P('hoist.rope.set.main')}.name,seat:${P('cabin.operator.seat')}.name,
      motor:${P('hoist.drive.motor.a')}.name,legs:!!${P('structure.portal.landside.leg.b')}})`);
    assert(r.red === 'Hoist Reducer' && r.w1 === 'Trolley Wheel 1' && r.gcr === 'GCR Cable Reel' && r.rope === 'Hoist Wire Rope' && r.seat === 'Operator Seat' && r.motor === 'Main hoist motor A' && r.legs, JSON.stringify(r));
  });
  await step('W3 Tree: the 8 workbook assemblies first, then the approved mechanisms without a workbook group; RTG unchanged', async () => {
    const t = await tops();
    assert(JSON.stringify(t.slice(0, 8)) === JSON.stringify(['g-trolley', 'g-main-hoist', 'g-catenary', 'g-gantry', 'g-boom', 'g-backreach', 'g-apex', 'g-other']) && t.slice(8).every((x) => /^sys-\d\d$/.test(x)), JSON.stringify(t));
    assert(await ev(`document.querySelector('[data-fk="ti-g-catenary"]').textContent.includes('Catenary')&&!!document.querySelector('[data-fk="excel-only"]')`), 'Catenary spelling / tick');
    await shot('01-tree-all-items');
    await open('/eq/equipment/eq-rtg-demo-01'); await b.wait(400);
    assert(await ev(`!document.querySelector('[data-fk="excel-only"]')&&[...document.querySelectorAll('[role=tree] > li > ul > li')].every(li=>/^mi-/.test(li.dataset.nid))`), 'RTG tree changed');
  });
  await step('W4 "Excel items only" tick: only workbook parts and assemblies; untick restores all items', async () => {
    await open('/eq/equipment/' + Q1 + '?view=3d&panel=spareParts'); await ready();
    await pick('[data-fk="excel-only"]');
    await pick('[data-fk="ti-g-main-hoist"] > .ti'); await pick('[data-fk="ti-mh-drive"] > .ti');
    const r = await ev(`(()=>{const parts=[...document.querySelectorAll('[role=treeitem][aria-level="4"]')].map(li=>EQ.pos(li.dataset.nid));return {tops:[...document.querySelectorAll('[role=tree] > li > ul > li')].map(li=>li.dataset.nid),
      n:parts.length,allExcel:parts.every(p=>EQ.qcTree.isExcel(p)),count:document.querySelector('.tree-excel-only .tree-count').textContent,labels:[...document.querySelectorAll('.qc-label')].map(x=>x.textContent)}})()`);
    assert(r.tops.length === 8 && r.tops.every((x) => x.startsWith('g-')) && r.n === 7 && r.allExcel && /^136 of \d+$/.test(r.count), JSON.stringify(r).slice(0, 300));
    assert(r.labels.length && r.labels.every((t) => /Hoist|Sheave|Coupling|Bearing|Reducer|Rope/.test(t)), 'labels not limited to workbook parts ' + JSON.stringify(r.labels));
    await shot('02-excel-only-hoist-drive');
    await pick('[data-fk="excel-only"]');
    assert((await tops()).length === 15, 'untick did not restore all assemblies');
  });
  await step('W5 Sub assembly selection: URL, breadcrumb, panel, Technical tab and 3D highlight of its parts', async () => {
    await ev(`EQ.eqv.select(EQ.eq('${Q1}'),{grp:'tr-bearings'})`); await b.wait(1200);
    const r = await ev(`(()=>{const v=EQ.qc.session.viewer;return {grp:EQ.route.query.grp,mode:EQ.route.query.mode,crumb:document.querySelector('.breadcrumb')?.textContent,eyebrow:document.querySelector('.scope-context .eyebrow').textContent,
      title:document.querySelector('[data-fk="scope-title"]').textContent,sel:[...v.selected].sort(),aria:document.querySelector('[data-fk="ti-tr-bearings"]').getAttribute('aria-selected')}})()`);
    assert(r.grp === 'tr-bearings' && r.mode === 'technical' && r.crumb === 'Whole equipmentTrolleyTrolley Wheel Bearing' && r.eyebrow === 'Sub assembly' && r.title === 'Trolley Wheel Bearing' && r.aria === 'true', JSON.stringify(r));
    assert(JSON.stringify(r.sel) === JSON.stringify(['trolley.wheel-bearing.1', 'trolley.wheel-bearing.2', 'trolley.wheel-bearing.3', 'trolley.wheel-bearing.4']), 'highlight ' + JSON.stringify(r.sel));
    await shot('03-trolley-wheel-bearings');
    await pick('[data-fk="tab-technical"]');
    const t = await ev(`document.querySelector('#tabpanel').textContent`);
    assert(/4 parts/.test(t) && /Workbook row 13/.test(t) && /Trolley Wheel Bearing 1/.test(t), t.slice(0, 200));
  });
  await step('W6 Placement follows the workbook locations: LHS / gate house end = -Z, front catenary = seaside, numbering from the gate house end', async () => {
    const r = await ev(`({ts1z:${cz('reeving.trolley-sheave.1')},ts1x:${cx('reeving.trolley-sheave.1')},ts4z:${cz('reeving.trolley-sheave.4')},ts4x:${cx('reeving.trolley-sheave.4')},
      b1:${cz('gantry.wheel-brake.ws.1')},b4:${cz('gantry.wheel-brake.ws.4')},b5:${cz('gantry.wheel-brake.ws.5')},b8:${cz('gantry.wheel-brake.ws.8')},gcr:${cz('gantry.cable-reel.main')},
      fw1:${cz('trolley.catenary-front.wheel.1')},fw1x:${cx('trolley.catenary-front.wheel.1')},rw1x:${cx('trolley.catenary-rear.wheel.1')},fw3:${cz('trolley.catenary-front.wheel.3')},
      lc1:${cz('trolley.rail.carpet.left.1')},rc7x:${cx('trolley.rail.carpet.right.7')},lc1x:${cx('trolley.rail.carpet.left.1')},hb:${cx('headblock.hoist-sheave.1')}<${cx('headblock.hoist-sheave.2')}})`);
    assert(r.ts1z < 0 && r.ts1x < -50 && r.ts4z > 0 && r.ts4x > 60, 'trolley sheaves ' + JSON.stringify(r));
    assert(r.b1 < r.b4 && r.b4 < 0 && r.b5 > 0 && r.b8 > r.b5 && r.gcr < 0, 'wheel brakes ' + JSON.stringify(r));
    assert(r.fw1 < 0 && r.fw3 > 0 && r.fw1x > 60 && r.rw1x < 10, 'catenary wheels ' + JSON.stringify(r));
    assert(r.lc1 < 0 && r.lc1x < -50 && r.rc7x > 60 && r.hb, 'rail carpets / headblock sheaves ' + JSON.stringify(r));
  });
  await step('W7 Group scope: spare parts and special jobs are read through the group; jobs links stay equipment-wide', async () => {
    await ev(`EQ.eqv.select(EQ.eq('${Q1}'),{grp:'g-main-hoist'})`); await b.wait(900);
    const r = await ev(`(()=>{const eq=EQ.eq('${Q1}'),ids=new Set(EQ.qcTree.positionIds(eq,'g-main-hoist'));const want=EQ.spares.rows(eq.id).filter(r=>ids.has(r.posId)).map(r=>r.posId).sort();
      const got=[...document.querySelectorAll('#tabpanel li[data-pos]')].map(li=>li.dataset.pos).sort();const cs=EQ.currentSpecial(eq.id,{level:'group',id:'g-main-hoist'});
      return {want,got,open:cs.ok&&cs.openJobs.length,badge:document.querySelector('[data-fk="ti-g-main-hoist"] .jobs')?.textContent||'',link:document.querySelector('[data-fk="open-in-jobs-spareParts"]')?.getAttribute('href')||''}})()`);
    assert(r.want.length >= 5 && JSON.stringify(r.want) === JSON.stringify(r.got), 'spare rows ' + JSON.stringify(r).slice(0, 300));
    assert(r.open >= 1 && r.badge === r.open + ' open' && /equipment=eq-qc-demo-01$/.test(r.link), JSON.stringify(r).slice(0, 300));
  });
  await step('W8 3D labels use the workbook names; a group label drills down; choosing an Area clears the group', async () => {
    await pick('[data-fk="reset"]'); await b.wait(600);
    const ov = await ev(`[...document.querySelectorAll('.qc-label')].map(x=>x.textContent)`);
    assert(ov.some((t) => t.startsWith('Main Hoist')) && ov.some((t) => t.startsWith('Catenary')), 'overview labels ' + JSON.stringify(ov));
    assert(await ev(`EQ.qc.session.viewer.labelCandidates.find(c=>c.id==='g-gantry')?.next?.grp==='g-gantry'`), 'group label does not drill to the group');
    await ev(`EQ.eqv.select(EQ.eq('${Q1}'),{grp:'g-gantry'})`); await b.wait(900);
    const sub = await ev(`[...document.querySelectorAll('.qc-label')].map(x=>x.textContent)`);
    assert(sub.some((t) => t.startsWith('Sea Side Wheel Brake')) && sub.some((t) => t.startsWith('Gantry Cable Reel')), 'gantry sub assembly labels ' + JSON.stringify(sub));
    await b.setValue('[data-fk="isolate-area"]', 'machinery-house'); await b.wait(700);
    assert(await ev(`!EQ.route.query.grp&&EQ.route.query.container==='machinery-house'`), 'area kept the group');
    await shot('04-gantry-labels');
  });
  await step('W9 Old mechanism links (main / sub / part) still open on the workbook tree', async () => {
    await open('/eq/equipment/' + Q1 + '?view=flat&main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&panel=spareParts'); await ready();
    const r = await ev(`({part:EQ.route.query.part,sel:document.querySelector('[data-fk="ti-pp-q01-007"]')?.getAttribute('aria-selected'),crumb:document.querySelector('.breadcrumb')?.textContent,title:document.querySelector('[data-fk="scope-title"]').textContent})`);
    assert(r.part === 'pp-q01-007' && r.sel === 'true' && r.crumb === 'Whole equipmentMain HoistHoist Drive MechanismMain hoist motor A' && r.title === 'Main hoist motor A', JSON.stringify(r));
  });
  await step('W10 QC03 (draft positions) gets the workbook tree too; jobs keep the approved codes', async () => {
    await open('/eq/equipment/eq-qc-demo-03'); await b.wait(500);
    const r = await ev(`(()=>{const eq=EQ.eq('eq-qc-demo-03');const c=EQ.qcTree.counts(eq);const p=EQ.positionsOf(eq.id).find(p=>p.key==='trolley.wheel-bearing.1');
      return {c,tops:[...document.querySelectorAll('[role=tree] > li > ul > li')].length,code:p&&eq.subs.find(s=>s.id===p.subId).code,state:p&&p.state}})()`);
    assert(r.c.excel === 136 && r.tops >= 8 && r.code === '021' && r.state === 'draft', JSON.stringify(r));
  });
  await step('W11 Phone: tick in the Mechanisms drawer with a 44 px target, no page overflow', async () => {
    await b.viewport(390, 844, true, 2);
    await open('/eq/equipment/' + Q1 + '?view=3d'); await ready();
    await pick('[data-fk="open-tree"]');
    const r = await ev(`(()=>{const t=document.querySelector('.tree-excel-only');const rr=t.getBoundingClientRect();return {h:rr.height,vis:rr.width>0&&rr.right<=innerWidth,sw:document.documentElement.scrollWidth<=innerWidth}})()`);
    assert(r.h >= 44 && r.vis && r.sw, JSON.stringify(r));
    await shot('05-phone-tree');
    await b.viewport(1500, 950);
  });
  await step('W12 No script errors', async () => { const e = await ev('window.__errs||[]'); assert(!e.length, JSON.stringify(e)); });
} finally {
  fs.writeFileSync(out + '/checks.json', JSON.stringify({ date: new Date().toISOString(), base, passed: results.filter((r) => r.pass).length, total: results.length, results }, null, 2));
  console.log(results.filter((r) => r.pass).length + '/' + results.length + ' passed');
  await b.close();
}
