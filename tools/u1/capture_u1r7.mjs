// U1 round 7 evidence (U1-C27): close-ups of the 013 load cells at the boom tip end, in the generated 3D model (P03 capture
// page, no UI), in the P03 3D page with the load cell selected, and in the P02 flat view (zoomed to the boom tip).
// Needs both prototype servers serving from disk: node artifacts/prototypes/p02-ui/serve.mjs (5312) and
// node artifacts/prototypes/p03-qc-model/serve.mjs (5313). Refuses to run (writes nothing) when either is down.
// Usage: node tools/u1/capture_u1r7.mjs [--gpu swiftshader|hardware] [--out docs/evidence/U1/repair-r7]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../p03/cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const gpu = opt('--gpu', 'swiftshader');
const out = path.resolve(repo, opt('--out', 'docs/evidence/U1/repair-r7'));
const P02 = 'http://127.0.0.1:5312/', P03 = 'http://127.0.0.1:5313/';
for (const u of [P02, P03]) { try { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); } catch (e) { console.error('Server not reachable: ' + u + ' (' + e.message + '). Start it first; nothing written.'); process.exit(2); } }
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu, port: 9377 });
const log = [];
const save = async (name, note, extra) => { const f = path.join(out, name + '.png'); await b.screenshot(f); log.push({ name, note, ...extra, file: path.relative(repo, f).split(path.sep).join('/'), errors: b.errors().slice(0, 3) }); };

// 3D model close-ups (boom tip end at x = 75.9; cross-over at x = 75.6, y = 52.9)
const shots = [
  ['r7-01-3d-loadcell-boom-tip-end', 'mode=technical&cam=79.5,55.6,5.2&tgt=75.3,52.8,0.6&fov=40', 'U1-C27: 013 load cells in-line on the horizontal cross-over of the main hoist ropes at the boom tip end (two per rope side, junction box and signal cable per side); technical mode, location approximate'],
  ['r7-02-3d-loadcell-tip-side', 'mode=technical&cam=76.6,53.6,6.2&tgt=75.5,52.9,1.8&fov=38', 'U1-C27: the +Z side of the boom tip end: rope from the tip sheave down to the cross-over, the two load cells and the junction box'],
  ['r7-03-3d-boom-tip-context', 'mode=technical&cam=92,64,24&tgt=70,52,0&fov=40', 'U1-C27: context view of the boom end (compare the place circled on r7-loadcell-location-reference.jpg)'],
];
for (const [name, q, note] of shots) {
  await b.viewport(1400, 900); b.clearEvents();
  await b.goto(`${P03}capture.html?view=persp&bg=%23e4e7ea&${q}`);
  for (let i = 0; i < 75; i++) { if (await b.eval('!!window.__done')) break; await sleep(200); }
  await sleep(300);
  await save(name, note, { query: q });
}

// P03 3D page with the 013 load cell system selected
await b.viewport(1600, 1000); b.clearEvents();
await b.goto(P03 + '?eq=eq-qc-demo-01&sub=si-q01-013&mode=technical');
for (let i = 0; i < 80; i++) { if (await b.eval('!!(window.__qcTiming || window.__qcFallback)')) break; await sleep(250); }
await sleep(1500);
await save('r7-04-3d-page-loadcell-selected', 'U1-C27: P03 3D page, 013 Load cell system selected (technical mode); the view frames the boom tip end', { url: '?eq=eq-qc-demo-01&sub=si-q01-013&mode=technical' });

// P02 flat view: 013 selected, technical mode, zoomed to the boom tip end
await b.viewport(1920, 1080); b.clearEvents();
await b.goto(P02 + '?role=eqTeam#/eq/equipment/eq-qc-demo-01?mode=technical&main=mi-q01-01&sub=si-q01-013');
await sleep(1200);
await b.eval('EQ.fitBounds({ x: 118.6, y: 33.2, w: 7.0, h: 4.6 })');
await sleep(900);
await save('r7-05-flat-loadcell-boom-tip-end', 'U1-C27: flat view (technical), 013 selected, zoomed to the boom tip end: the horizontal hoist rope line ends in the load cell at the end of the boom', { url: '#/eq/equipment/eq-qc-demo-01?mode=technical&main=mi-q01-01&sub=si-q01-013', fit: [118.6, 33.2, 7.0, 4.6] });
await b.eval('EQ.resetView()');
await sleep(900);
await save('r7-06-flat-loadcell-overview', 'U1-C27: flat view (technical), 013 selected, default framing', { url: '#/eq/equipment/eq-qc-demo-01?mode=technical&main=mi-q01-01&sub=si-q01-013' });

await b.close();
fs.writeFileSync(path.join(out, 'capture-log.json'), JSON.stringify({ tool: 'tools/u1/capture_u1r7.mjs', gpu, browser: b.browser, date: new Date().toISOString(), items: log }, null, 2) + '\n');
console.log(log.length + ' captures; with errors: ' + (log.filter((l) => l.errors.length).map((l) => l.name + ' ' + JSON.stringify(l.errors)).join('; ') || 'none'));
