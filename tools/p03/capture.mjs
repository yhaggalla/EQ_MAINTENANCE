// P03 evidence capture: aligned orthographic model renders (same pixel frame as the J526A00 crops), perspective
// renders for the photo comparison, and UI walkthrough screenshots. Needs serve.mjs on 127.0.0.1:5313.
// Usage: node tools/p03/capture.mjs [--gpu hardware|swiftshader] [--model-dir DIR] [--shots-dir DIR] [--log FILE] [--u1]
// The U1 repair added the directory options (defaults unchanged) and --u1, which adds close-ups of the repaired areas.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const gpu = process.argv.includes('--gpu') ? process.argv[process.argv.indexOf('--gpu') + 1] : 'hardware';
const A = JSON.parse(fs.readFileSync(path.join(here, 'alignment.json'), 'utf8'));
const opt = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const U1 = process.argv.includes('--u1');
const outModel = path.resolve(repo, opt('--model-dir', 'artifacts/p03-captures'));
const outShots = path.resolve(repo, opt('--shots-dir', 'docs/evidence/P03/screenshots'));
const logFile = path.resolve(repo, opt('--log', 'docs/evidence/P03/capture-log.json'));
fs.mkdirSync(outModel, { recursive: true }); fs.mkdirSync(outShots, { recursive: true });
const BASE = 'http://127.0.0.1:5313/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu, port: 9344 });
const log = [];
async function waitFor(expr, ms = 15000) { const t = Date.now(); while (Date.now() - t < ms) { if (await b.eval(expr)) return true; await sleep(200); } return false; }

// 1 aligned orthographic renders
for (const [view, v] of Object.entries(A.views)) {
  const [x0, y0, x1, y1] = v.crop; const [rx, ry] = v.ref; const ppm = A.ppm;
  const uL = (x0 - rx) / ppm, uR = (x1 - rx) / ppm, vT = (ry - y0) / ppm, vB = (ry - y1) / ppm;
  const w = uR - uL, h = vT - vB;
  let cx = (uL + uR) / 2; let cy = (vT + vB) / 2;
  if (v.u === '-Z') cx = -cx;
  if (v.v === '-Z') cy = -cy;
  await b.viewport(x1 - x0, y1 - y0);
  await b.goto(`${BASE}capture.html?view=${view}&cx=${cx}&cy=${cy}&w=${w}&h=${h}`);
  await waitFor('!!window.__done'); await sleep(300);
  const f = path.join(outModel, `model-${view}.png`);
  await b.screenshot(f);
  log.push({ view, frame: { cx, cy, w, h }, px: [x1 - x0, y1 - y0], file: path.relative(repo, f).split(path.sep).join('/') });
}
// 2 perspective renders for appearance comparison
const persp = [
  ['persp-photo-angle', 'cam=9,1.7,-118&tgt=-16,42,0&fov=48&hideQuay=0&bg=%23dfe9f2'],
  ['persp-overall', 'hideQuay=0&bg=%23e9eef2'],
  ['persp-technical', 'mode=technical&hideQuay=0&bg=%23e9eef2'],
  // close-ups for the appearance check against the site photos documents/Image_20261021*.jpg (appearance only)
  ['persp-house-closeup', 'cam=-14,38,34&tgt=-37,55,0&fov=40&bg=%23e4e7ea'],
  ['persp-trolley-closeup', 'cam=92,38,26&tgt=68,48,0&fov=36&bg=%23e4e7ea'],
  // U1 repair close-ups: logo end wall (-Z) with A/C units and stair tower, back-reach area, cab, stair tower, house internals
  ...(U1 ? [['persp-logo-endwall', 'cam=-26,57,-33&tgt=-37,55,-8&fov=42&bg=%23e4e7ea'], ['persp-backreach', 'cam=-47,63,24&tgt=-57,51,0&fov=48&bg=%23e4e7ea'],
    ['persp-cab-closeup', 'cam=73,49.5,9&tgt=66,49,0&fov=40&bg=%23e4e7ea'], ['persp-stair-tower', 'cam=-44,32,-34&tgt=-31,26,-13&fov=50&bg=%23e4e7ea'],
    ['persp-house-technical', 'cam=-24,66,22&tgt=-37,54,1&fov=45&mode=technical&bg=%23e4e7ea'], ['persp-photo-angle-u1', 'cam=40,48,-120&tgt=-12,46,0&fov=45&hideQuay=0&bg=%23ffffff']] : []),
];
for (const [name, q] of persp) {
  await b.viewport(1600, 1000);
  await b.goto(`${BASE}capture.html?view=persp&${q}`); await waitFor('!!window.__done'); await sleep(300);
  const f = path.join(outModel, `model-${name}.png`); await b.screenshot(f); log.push({ view: name, file: path.relative(repo, f).split(path.sep).join('/') });
}
// 3 UI walkthrough
async function page(q, w = 1920, h = 1080) { await b.viewport(w, h); await b.goto(BASE + q); await waitFor('!!(window.__qcTiming || window.__qcFallback)'); await sleep(1100); }
const shot = async (name, note) => { const f = path.join(outShots, name + '.png'); await b.screenshot(f); log.push({ ui: name, note, file: path.relative(repo, f).split(path.sep).join('/') }); };
const id = (k) => b.eval(`window.__qc.binding().get(${JSON.stringify(k)})?.positionId`);
await page('?eq=eq-qc-demo-01'); await shot('01-overall-equipment', 'Overall mode, full-crane reset view, equipment-level synthetic history');
await page('?eq=eq-qc-demo-01&main=mi-q01-01&mode=technical'); await shot('02-main-01-hoist-technical', 'Main 01 Hoist selected: union of bound positions highlighted and fitted; tree, breadcrumb and descendant history synchronised');
await page('?eq=eq-qc-demo-01&sub=si-q01-011&mode=technical'); await shot('03-sub-011-hoist-technical', 'Sub 011 selected: narrower set (motors, reducer, drums, high-speed brakes, boom-tip sheaves)');
const mA = await id('hoist.drive.motor.a');
await page(`?eq=eq-qc-demo-01&part=${mA}&mode=technical`); await shot('04-part-motor-a-qc01', 'Part: main hoist motor A on QC01, exact-position synthetic history (EQJ-SYN-0101)');
await page(`?eq=eq-qc-demo-02&part=${mA.replace('q01', 'q02')}&mode=technical`); await shot('05-part-motor-a-qc02', 'Same semantic key on QC02 resolves to a different position ID and different history');
await page('?eq=eq-qc-demo-01&container=machinery-house'); await shot('06-container-machinery-house-overall', 'Machinery house selected in Overall mode: spatial group only, contents grouped by mechanism, no maintenance identity');
await page('?eq=eq-qc-demo-01&mode=technical&iso=1'); await shot('07-technical-isolated-house', 'Technical mode, machinery house isolated: simplified internals with Approx. qualifiers and location markers');
await page('?eq=eq-qc-demo-01&mode=technical'); await shot('08-technical-transparent-house', 'Technical mode: enclosure transparent and not pickable, internals and location markers visible');
await page(`?eq=eq-qc-demo-01&part=${await id('gantry.wheel.ws-a.3')}`); await shot('09-instanced-gantry-wheel', 'Instanced gantry wheel WS-A 3 selected (instanceMaps identity), open synthetic work marker');
await page(`?eq=eq-qc-demo-01&part=${await id('trolley.rope.set.main')}`); await shot('10-thin-rope-selection', 'Thin rope set selected: minimum 0.5 m fit extent, quantity-lot position');
await page('?eq=eq-qc-demo-01&sub=si-q01-061&mode=technical'); await shot('11-spreader-technical', 'Spreader (061) with twistlock/flipper corner markers');
for (const v of ['side', 'end-ws', 'top']) { await page(`?eq=eq-qc-demo-01&view=${v}`); await shot('12-ui-aligned-' + v, 'Aligned orthographic view inside the prototype UI'); }
await page('?viewer=nowebgl&eq=eq-qc-demo-01&part=' + mA); await shot('13-fallback-nowebgl', 'WebGL unavailable: tree, breadcrumb, selection details and history remain usable');
await page('?viewer=loadfail&eq=eq-qc-demo-01'); await shot('14-fallback-loadfail', 'Model request failed (404): fallback with reason');
await page('?eq=eq-qc-demo-01&part=' + mA + '&mode=technical', 1366, 768); await shot('15-layout-1366x768', '1366 x 768 desktop layout');
await page('?eq=eq-qc-demo-01', 390, 844); await shot('16-layout-phone-390', 'Phone width: viewer first, tree and panel stacked below');
await b.close();
fs.writeFileSync(logFile, JSON.stringify({ gpu, browser: b.browser, items: log }, null, 2) + '\n');
console.log(log.length + ' captures');
