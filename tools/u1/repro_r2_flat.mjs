// U1 round 2 reproduction/verification helper for the P02 flat view (U1-C09..C11): labels after tree selections of every
// main, Reset, tree fold. Usage: node tools/u1/repro_r2_flat.mjs [baseUrl] [WxH]   (P02 server on 5312)
import { launch } from '../p02/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const [vw, vh] = (process.argv[3] || '1366x768').split('x').map(Number);
const b = await launch({ port: 9351 });
const L = () => b.eval(`[...document.querySelectorAll('#scene-labels .sc-label')].map(e=>(e.dataset.offscreen?'[edge]':'')+e.textContent)`);
const out = {};
try {
  await b.viewport(vw, vh);
  await b.goto(base + '?role=eqTeam#/equipment/eq-qc-demo-01'); await b.wait(900);
  out.initial = await L();
  const mains = await b.eval(`[...document.querySelectorAll('[role=treeitem][aria-level="2"]')].map(e=>e.dataset.nid)`);
  out.perMain = {};
  for (const m of mains) { await b.click(`[data-nid="${m}"] > .ti`); await b.wait(800); out.perMain[m] = { n: (await L()).length, fallback: await b.eval(`(document.querySelector('[data-fk="label-fallback"]')||{}).textContent||''`) }; }
  await b.click('[data-nid="mi-q01-01"] > .ti'); await b.wait(700);
  await b.click('[data-nid="si-q01-011"] > .ti'); await b.wait(700);
  const motor = await b.eval(`EQ.positionsOf('eq-qc-demo-01').find(p=>p.key==='hoist.drive.motor.a').id`);
  await b.click(`[data-nid="${motor}"] > .ti`); await b.wait(900);
  out.partLabels = await L();
  out.expandedBefore = await b.eval(`[...document.querySelectorAll('[role=treeitem][aria-expanded=true]')].map(e=>e.dataset.nid)`);
  await b.click('[data-nid="mi-q01-01"] > .ti > .twist'); await b.wait(400);
  out.expandedAfterFold = await b.eval(`[...document.querySelectorAll('[role=treeitem][aria-expanded=true]')].map(e=>e.dataset.nid)`);
  await b.click('[data-nid="mi-q01-01"] > .ti > .twist'); await b.wait(400);
  out.expandedAfterUnfold = await b.eval(`[...document.querySelectorAll('[role=treeitem][aria-expanded=true]')].map(e=>e.dataset.nid)`);
  await b.click('[data-fk="labels"]'); await b.wait(300); out.labelsOff = (await L()).length;
  await b.click('[data-fk="reset"]'); await b.wait(1200);
  out.afterReset = { hash: await b.eval('location.hash'), labels: (await L()).length, labelsPressed: await b.eval(`document.querySelector('[data-fk="labels"]').getAttribute('aria-pressed')`), expanded: await b.eval(`[...document.querySelectorAll('[role=treeitem][aria-expanded=true]')].map(e=>e.dataset.nid)`), viewBox: await b.eval(`document.getElementById('scene-svg').getAttribute('viewBox')`) };
  out.errors = b.errors();
} catch (e) { out.exception = e.message; }
console.log(JSON.stringify(out, null, 1));
await b.close();
