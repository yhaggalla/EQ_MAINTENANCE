// U1 round 3 evidence: model close-ups and aligned trolley / headblock / spreader views for U1-C17 (trolley, sheaves,
// wheels, rope paths) and U1-C18 (spreader and headblock). Renders the generated scene through the P03 capture page
// (no UI). Orthographic frames keep the 1400 x 900 aspect (w / h = 1.556) so the views are not stretched. Needs the P03 server: node artifacts/prototypes/p03-qc-model/serve.mjs 5313
// Usage: node tools/u1/capture_u1r3_model.mjs [--gpu swiftshader|hardware] [--out docs/evidence/U1/repair-r3/closeups]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../p03/cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const gpu = opt('--gpu', 'swiftshader');
const out = path.resolve(repo, opt('--out', 'docs/evidence/U1/repair-r3/closeups'));
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu, port: 9359 });
// Trolley centre X = 70 (display position), trolley rail 52.42 m; spreader underside 45 m.
const shots = [
  ['c17-trolley-top-ls', 'cam=64.5,58.5,9.5&tgt=70,52.5,0.4&fov=46', 'U1-C17: trolley from above the landside end (the 14.png viewpoint): open frame, 4 wheels, 4 sheave shafts with 2 sheaves each, equalizer sheaves, rope loops'],
  ['c17-trolley-top-ws', 'cam=76.5,58,-8.5&tgt=70,52.4,0&fov=46', 'U1-C17: trolley from above the waterside end, -Z side'],
  ['c17-trolley-falls', 'mode=technical&cam=74.5,48.6,1.4&tgt=69.8,51.9,0&fov=60', 'U1-C17: falls from the trolley sheaves to the headblock sheaves and the spreader cable reel inside the open centre body'],
  ['c17-trolley-wheel', 'cam=66.4,52.95,5.7&tgt=67.63,52.65,3.15&fov=38', 'U1-C17: landside wheel on the +Z rail: one dia 630 wheel per corner between the bracket cheek plates'],
  ['c17-trolley-side-ortho', 'view=side&cx=69.6&cy=50.6&w=10&h=6.43', 'U1-C17: aligned side view (orthographic, from +Z) for comparison with the J526A0200 side view'],
  ['c17-trolley-top-ortho', 'view=top&cx=69.6&cy=0&w=11&h=7.07', 'U1-C17: aligned plan (orthographic, from above) for comparison with the J526A0200 plan'],
  ['c17-trolley-rope-equalizers', 'cam=73.3,54.2,2.6&tgt=72.2,52.6,0&fov=42', 'U1-C17: waterside end: trolley ropes from the boom-tip sheave unit (1050 lanes) around the two horizontal equalizer sheaves'],
  ['c17-trolley-tip-sheaves', 'cam=71.5,56,6&tgt=75,53,0&fov=46', 'U1-C17: boom-tip sheave node: main hoist sheaves at the 2600 lanes and the trolley rope sheave units at 1050 (J526A2100)'],
  ['c18-spreader-side', 'cam=78,46.2,11&tgt=70,45.7,0&fov=50', 'U1-C18: headblock and spreader from the waterside / +Z (the 15.png direction): main frame, telescopic arms, end beams, corner twistlocks and flippers'],
  ['c18-spreader-waterside', 'cam=88,46.1,0.8&tgt=70,45.9,0&fov=40', 'U1-C18: headblock and spreader from the waterside at spreader height (the 15.png viewpoint): main frame, telescopic arms, end beams, flippers, twistlocks'],
  ['c18-spreader-top', 'cam=74,51,9.5&tgt=70,45.6,0&fov=50', 'U1-C18: spreader and headblock from above: two main beams, landing castings under the headblock twistlocks, power pack, arms and end beams'],
  ['c18-spreader-below', 'cam=75,41.5,7.5&tgt=70,45.3,1&fov=50', 'U1-C18: spreader from below: twistlocks at the ISO 40 ft corner positions'],
  ['c18-headblock-close', 'cam=72.6,47.9,4.6&tgt=70,46.6,1.6&fov=44', 'U1-C18: headblock end: sheave box, two sheaves dia 1000 at 1010, guards, fence, twistlocks dia 140 at 950 landing on the spreader'],
  ['c18-spreader-side-ortho', 'view=side&cx=70&cy=46.3&w=5.6&h=3.6', 'U1-C18: aligned view along the rails (from +Z) of the headblock (2090, two dia 1000 sheaves at 1010, twistlocks at 950) and the spreader end-on, for comparison with the J526A1200 end view'],
  ['c18-spreader-end-ortho', 'view=end-ws&cx=0&cy=46.6&w=14&h=9', 'U1-C18: aligned view from the waterside of the headblock (5440, sheave boxes at 5200) and the 40 ft spreader (twistlocks 11985 apart), for comparison with the J526A1200 front view'],
  ['overall-perspective', 'hideQuay=0&bg=%23e9eef2', 'Overall mode full-crane view after round 3'],
];
const log = [];
for (const [name, q, note] of shots) {
  await b.viewport(1400, 900); b.clearEvents();
  await b.goto(`http://127.0.0.1:5313/capture.html?bg=%23e4e7ea&${q.includes('view=') ? '' : 'view=persp&'}${q}`);
  for (let i = 0; i < 150; i++) { if (await b.eval('!!window.__done')) break; await sleep(200); }
  await sleep(400);
  const f = path.join(out, name + '.png'); await b.screenshot(f);
  log.push({ name, note, query: q, file: path.relative(repo, f).split(path.sep).join('/'), errors: b.errors().slice(0, 3) });
}
await b.close();
fs.writeFileSync(path.join(out, '..', 'capture-log-closeups.json'), JSON.stringify({ gpu, browser: b.browser, items: log }, null, 2) + '\n');
console.log(log.length + ' close-ups; with errors: ' + log.filter((l) => l.errors.length).map((l) => l.name).join(', '));
