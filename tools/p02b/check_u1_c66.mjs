// U1-C66 label modes and Technical switch on part selection. Usage (server on 5312):
// node tools/p02b/check_u1_c66.mjs [base] [output folder]
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/label-modes-c66';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9367 });
await b.viewport(1600, 1000);
const results = []; let n = 0;
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + JSON.stringify(detail))); n++; };
const ev = (x) => b.eval(x);
const ready = async () => { for (let i = 0; i < 60; i++) { await b.wait(200); if (await ev('!!window.EQ?.qc?.session?.ready')) break; } await b.wait(900); };
const state = () => ev(`(()=>{const ls=[...document.querySelectorAll('.qc-label')];const pressed=[...document.querySelectorAll('.label-seg button[aria-pressed="true"]')].map(x=>x.dataset.fk);
  const note=[...document.querySelectorAll('.qc-notice')].find(x=>!x.hidden);return {mode:EQ.route.query.mode||'overall',viewerMode:EQ.qc.session.viewer.mode,labelMode:EQ.eqUI.labelMode,pressed,
  count:ls.length,sel:ls.filter(x=>x.classList.contains('sel')).map(x=>x.textContent),part:EQ.route.query.part||'',notice:note?note.textContent:''}})()`);
const click = async (sel) => { await b.click(sel); await b.wait(700); };
b.clearEvents();
await b.goto(base + '#/eq/equipment/eq-qc-demo-01?view=3d&mode=overall'); await ready();
let s = await state();
check('01 default: Key parts pressed, overview labels, no selected label', s.labelMode === 'key' && s.pressed.join() === 'labels-key' && s.count > 1 && s.sel.length === 0, s);
// mechanism selection from the tree -> Selection
// U1-C70: the QC tree follows the component workbook: Main Hoist > Hoist Drive Mechanism replace 01 > 011
await b.eval(`(()=>{const e=[...document.querySelectorAll('[role=treeitem] .ti')].find(x=>x.textContent.trim().startsWith('Main Hoist'));e.click();return 1})()`); await b.wait(700);
await b.eval(`(()=>{const e=[...document.querySelectorAll('[role=treeitem] .ti')].find(x=>x.textContent.trim().startsWith('Hoist Drive Mechanism'));e.click();return 1})()`); await b.wait(900);
s = await state();
check('02 sub assembly from the tree: Selection mode, mode unchanged (Overall)', s.labelMode === 'selection' && s.pressed.join() === 'labels-selection' && s.mode === 'overall', s);
// technical-only part from the tree while in Overall -> Technical, Selected only, one highlighted label, no hidden notice
await b.eval(`(()=>{const e=[...document.querySelectorAll('[role=treeitem] .ti')].find(x=>x.textContent.trim()==='Main hoist motor A');e.click();return 1})()`); await b.wait(1200);
s = await state();
check('03 part from the tree in Overall switches to Technical and shows it', s.mode === 'technical' && s.viewerMode === 'technical' && s.part === 'pp-q01-007' && !/no visible representation/i.test(s.notice), s);
check('04 part selection: Selected only, exactly one label and it is the selected part', s.labelMode === 'selected' && s.pressed.join() === 'labels-selected' && s.count === 1 && s.sel.length === 1 && s.sel[0].startsWith('Main hoist motor A'), s);
await b.screenshot(out + '/selected-only.png');
await click('[data-fk="labels-selection"]'); s = await state();
check('05 Selection: selected label plus related part labels', s.count > 1 && s.sel.length === 1 && s.sel[0].startsWith('Main hoist motor A'), s);
await b.screenshot(out + '/selection.png');
await click('[data-fk="labels-key"]'); s = await state();
check('06 Key parts with a selection: overview labels plus the selected label', s.count > 1 && s.sel.length === 1, s);
await b.screenshot(out + '/key-parts-with-selection.png');
await click('[data-fk="labels-selected"]'); s = await state();
check('07 back to Selected only: one label', s.count === 1 && s.sel.length === 1, s);
await click('[data-fk="view-flat"]'); s = await state();
check('08 camera switch keeps the label mode and the part', s.labelMode === 'selected' && s.count === 1 && s.part === 'pp-q01-007', s);
// picking a visible part in Overall from a label of the scene also opens Technical
await b.goto(base + '#/eq/equipment/eq-qc-demo-01?view=3d&mode=overall'); await ready();
await b.eval(`(()=>{const eq=EQ.eq('eq-qc-demo-01');const p=EQ.positionsOf(eq.id).find(x=>x.key==='trolley.wheel.ws-a.1');EQ.eqv.select(eq,{main:p.mainId,sub:p.subId,part:p.id});return 1})()`); await b.wait(1200);
s = await state();
check('09 any part selection in Overall opens Technical with Selected only', s.mode === 'technical' && s.labelMode === 'selected' && s.count === 1, s);
await click('[data-fk="reset"]'); s = await state();
check('10 Reset returns to Key parts with no selected label', s.labelMode === 'key' && s.pressed.join() === 'labels-key' && s.sel.length === 0 && s.count > 0 && !s.part, s);
await b.eval(`(()=>{const e=document.querySelector('[data-fk="isolate-area"]');e.value='machinery-house';e.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`); await b.wait(1200);
s = await state();
check('11 area isolation shows the area part labels (Key parts)', s.labelMode === 'key' && s.count > 3 && s.mode === 'technical', s);
await click('[data-fk="labels-selected"]'); s = await state();
check('12 Selected only with nothing selected shows no labels', s.count === 0, s);
await b.viewport(375, 812, true, 2); await b.goto(base + '#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&pkey=trolley_catenary_waterside'); await ready();
const fit = await ev(`(()=>{const g=document.querySelector('.label-seg');const r=g.getBoundingClientRect();return {w:r.width,vw:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,btnH:Math.min(...[...g.querySelectorAll('button')].map(x=>x.getBoundingClientRect().height))}})()`);
check('13 phone: label group fits, 44 px targets, no page overflow', fit.w <= fit.vw && !fit.overflow && fit.btnH >= 44, fit);
await b.screenshot(out + '/phone.png');
const errs = b.errors(); check('14 no browser errors', errs.length === 0, errs);
fs.writeFileSync(out + '/checks.json', JSON.stringify({ base, results }, null, 1));
console.log(results.filter((r) => r.ok).length + '/' + results.length + ' PASS');
await b.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
