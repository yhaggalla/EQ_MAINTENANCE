// U1-C65 evidence captures: new trolley-runway / catenary / re-reeving parts and the Technical-tab component data.
// Usage (prototype server on 5312): node tools/u1/capture_c65.mjs [outDir]
import { launch } from '../p03/cdp.mjs';
const out = process.argv[2] || 'docs/evidence/U1/qc-technical-c65';
const b = await launch({ port: 9361 });
await b.viewport(1920, 1080);
const base = 'http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?';
const pid = (key) => key.replaceAll('.', '_'); // semantic-key link (pkey), resolved by the viewer to the bound position ID
const shots = [
  ['01-flat-whole-crane', 'view=flat&mode=overall&panel=technical'],
  ['02-3d-catenary-seaside', `view=3d&mode=technical&panel=technical&pkey=${pid('trolley.catenary.waterside')}`],
  ['03-3d-catenary-landside', `view=3d&mode=technical&panel=technical&pkey=${pid('trolley.catenary.landside')}`],
  ['04-3d-rail-hinge-joint', `view=3d&mode=technical&panel=technical&pkey=${pid('trolley.rail.hinge-joint')}`],
  ['05-3d-catenary-tensioner', `view=3d&mode=technical&panel=technical&pkey=${pid('trolley.catenary.tensioner')}`],
  ['06-3d-rope-reeving-device', `view=3d&mode=technical&panel=technical&pkey=${pid('auxiliary.rope-reeving.machinery-house')}`],
  ['07-3d-spreader-cable-reel', `view=3d&mode=technical&panel=technical&pkey=${pid('trolley.spreader-cable-reel')}`],
  ['13-3d-anti-snag-tls', `view=3d&mode=technical&panel=technical&pkey=${pid('reeving.anti-snag-tls.device')}`],
  ['14-3d-trolley-wheel', `view=3d&mode=technical&panel=technical&pkey=${pid('trolley.wheel.ws-a.1')}`],
  ['15-3d-headblock', `view=3d&mode=technical&panel=technical&pkey=${pid('headblock.frame')}`],
  ['08-area-trolley-runway', 'view=3d&mode=technical&panel=technical&area=trolley-runway&container=trolley-runway'],
  ['09-area-machinery-house', 'view=3d&mode=technical&panel=technical&area=machinery-house&container=machinery-house'],
  ['10-area-back-reach', 'view=3d&mode=technical&panel=technical&area=back-reach&container=back-reach'],
  ['11-area-headblock-spreader', 'view=3d&mode=technical&panel=technical&area=headblock-spreader&container=headblock-spreader'],
  ['12-area-trolley', 'view=3d&mode=technical&panel=technical&area=trolley&container=trolley'],
];
const report = [];
for (const [name, q] of shots) {
  b.clearEvents();
  await b.goto(base + q);
  for (let i = 0; i < 40; i++) { await b.wait(250); if (await b.eval(`!!EQ.qc.session?.ready && !document.querySelector('[aria-busy="true"]') && !!document.querySelector('.equipment-page h3')`)) break; }
  await b.wait(1500);
  const info = await b.eval(`(()=>({groups:[...document.querySelectorAll('[data-spec-group]')].map(e=>e.dataset.specGroup+' ('+e.querySelectorAll('dt').length+')'),notice:document.querySelector('.qc-notice:not([hidden])')?.textContent||null,ready:!!EQ.qc.session?.ready}))()`);
  await b.screenshot(`${out}/${name}.png`);
  report.push({ name, q, ...info, errors: b.errors() });
}
console.log(JSON.stringify(report, null, 1));
await b.close();
