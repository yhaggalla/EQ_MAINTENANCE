// U1 round 2 reproduction/verification helper for the P03 3D view (U1-C09..C11): labels after tree selections, Reset,
// tree fold. Usage: node tools/u1/repro_r2_3d.mjs [--gpu hardware]   (P03 server on 5313)
import { launch } from '../p03/cdp.mjs';
const gpu = process.argv.includes('--gpu') ? process.argv[process.argv.indexOf('--gpu') + 1] : 'hardware';
const b = await launch({ gpu, port: 9361 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const E = (x) => b.eval(x);
await b.viewport(1366, 768);
await b.goto('http://127.0.0.1:5313/?eq=eq-qc-demo-01');
for (let i = 0; i < 60; i++) { if (await E('!!window.__qcTiming')) break; await sleep(250); }
await sleep(800);
const labels = () => E(`[...document.querySelectorAll('.qc-label')].map(e=>(e.dataset.offscreen?'[edge]':'')+e.textContent)`);
const out = { initial: await labels() };
const mains = await E(`[...document.querySelectorAll('#tree [aria-level="2"]')].map(e=>e.dataset.id)`);
out.perMain = {};
for (const m of mains) { await E(`document.querySelector('#tree [data-id="${m}"]').click()`); await sleep(1000); out.perMain[m] = (await labels()).length; }
await E(`document.querySelector('#tree [data-id="mi-q01-01"]').click()`); await sleep(900);
await E(`document.querySelector('#tree [data-id="si-q01-011"]').click()`); await sleep(900);
const motor = await E(`window.__qc.binding().get('hoist.drive.motor.a').positionId`);
await E(`document.querySelector('#tree [data-id="${motor}"]').click()`); await sleep(1100);
out.partLabels = await labels();
out.expandedBeforeFold = await E(`[...document.querySelectorAll('#tree [aria-expanded="true"]')].map(e=>e.dataset.id)`);
await E(`document.querySelector('#tree [data-id="mi-q01-01"] .tw').click()`); await sleep(300);
out.expandedAfterFold = await E(`[...document.querySelectorAll('#tree [aria-expanded="true"]')].map(e=>e.dataset.id)`);
await E(`document.querySelector('#tree [data-id="mi-q01-01"] .tw').click()`); await sleep(300);
out.expandedAfterUnfold = await E(`[...document.querySelectorAll('#tree [aria-expanded="true"]')].map(e=>e.dataset.id)`);
await E(`document.querySelector('#btn-labels').click()`); await sleep(300);
out.labelsOff = (await labels()).length;
await E(`document.querySelector('#btn-reset').click()`); await sleep(1200);
out.afterReset = { state: await E('JSON.stringify(window.__qc.state)'), labels: (await labels()).length, expanded: await E(`[...document.querySelectorAll('#tree [aria-expanded="true"]')].map(e=>e.dataset.id)`), search: await E('location.search'), labelsBtn: await E(`document.querySelector('#btn-labels').getAttribute('aria-pressed')`) };
out.errors = b.errors();
console.log(JSON.stringify(out, null, 1));
await b.close();
