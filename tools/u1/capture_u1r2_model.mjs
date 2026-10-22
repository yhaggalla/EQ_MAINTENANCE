// U1 round 2 evidence: model close-ups of the areas changed for U1-C12..C16 (load cells, girder-tail platforms and
// stairs, apex, floodlights, elevator, parts that replaced the location balls). Renders the generated scene through the
// P03 capture page (no UI). Needs the P03 server: node artifacts/prototypes/p03-qc-model/serve.mjs 5313
// Usage: node tools/u1/capture_u1r2_model.mjs [--gpu hardware|swiftshader] [--out docs/evidence/U1/repair-r2/closeups]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../p03/cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const gpu = opt('--gpu', 'hardware');
const out = path.resolve(repo, opt('--out', 'docs/evidence/U1/repair-r2/closeups'));
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu, port: 9358 });
const shots = [
  ['c12-loadcell-boom-tip', 'mode=technical&cam=70,57,9&tgt=74,52.8,0&fov=40', 'U1-C12: load cells as load-measuring anchor pins in the main hoist rope-end anchors next to the boom-tip sheaves (J526A2000 Detail I); technical mode'],
  ['c13-girder-tail-platforms', 'cam=-49,57.5,15&tgt=-61,51.3,0&fov=46', 'U1-C13: upper tail platform, lower end platform beyond the girder end, centre stair and the two side flights'],
  ['c13-girder-tail-from-below', 'cam=-52,44,-12&tgt=-61,51,0&fov=46', 'U1-C13: same area from below and the -Z side: every stair starts and ends on a platform'],
  ['c14-apex-waterside', 'cam=14,88,20&tgt=-1,81,0&fov=40', 'U1-C14: apex platform with handrails, guide sheaves, guard frame (top = 83.356 m), fall-sheave groups under the waterside cantilever, stair head'],
  ['c14-apex-landside', 'cam=-20,86,-16&tgt=-1.5,80.5,0&fov=40', 'U1-C14: apex from landside: stay pins and lugs, boom-hoist ropes from the drum over the guide sheaves'],
  ['c14-boom-blocks', 'cam=35,59,11&tgt=28,53.6,0&fov=45', 'U1-C14: boom hoist falls to the two boom sheave blocks at Z2 and Z3 (J526A2300 B-B and C-C)'],
  ['c15-floodlights-boom', 'cam=26,43,15&tgt=30,50.2,0&fov=42', 'U1-C15: floodlight fittings under both outer edges of the boom, aimed down and outward'],
  ['c15-floodlights-overview', 'cam=10,30,40&tgt=5,48,0&fov=55', 'U1-C15: floodlight fittings along the girder and boom'],
  ['c16-elevator-landside', 'cam=-43,13,-25&tgt=-30.2,9,-12.5&fov=44', 'U1-C16: elevator outboard of landside leg B (-Z), car at the first landing (6.5 m), door on the outer face, landing platform joined to the stair tower'],
  ['c16-elevator-top', 'cam=-41,60,-26&tgt=-30.2,52,-12.5&fov=44', 'U1-C16: upper elevator landings (47.845 m and 53.43 m) and mast top'],
  ['c16-spreader-corners', 'cam=77,43.5,11&tgt=70,45,0&fov=42', 'U1-C16: spreader corners: corner castings, twistlocks and raised orange flippers instead of balls'],
  ['c16-cab-ac', 'cam=60,49.5,7&tgt=64.6,48.6,0.6&fov=40', 'U1-C16: cab air-conditioning unit (152) on the cab walkway instead of a ball'],
  ['c16-gantry-wheel-brake', 'cam=4,3.5,12&tgt=0.6,1.2,7.9&fov=42', 'U1-C16: gantry wheel brake (046) on the bogie between the middle wheels'],
  ['c16-tail-hpu-tension', 'mode=technical&cam=-52,56.5,7&tgt=-58.5,52.8,-0.5&fov=44', 'U1-C16: trim/list/skew hydraulic power unit (111) and trolley rope tension cylinders (022) at the girder tail'],
  ['c16-house-cabinets', 'mode=technical&cam=-31.5,57.5,-1.5&tgt=-37,54,-6.5&fov=48', 'U1-C16: electrical room: drive, PLC and control-power cabinet sections, wall A/C unit, emergency drive on the main hoist reducer'],
  ['c16-cable-carriages', 'mode=technical&cam=-14,47,-10&tgt=-20,49.6,-3.15&fov=42', 'U1-C16: trolley cable system (023) as festoon carriages under the -Z girder box'],
  ['overall-perspective', 'hideQuay=0&bg=%23e9eef2', 'Overall mode full-crane view after round 2'],
  ['technical-perspective', 'mode=technical&hideQuay=0&bg=%23e9eef2', 'Technical mode full-crane view after round 2'],
];
const log = [];
for (const [name, q, note] of shots) {
  await b.viewport(1400, 900); b.clearEvents();
  await b.goto(`http://127.0.0.1:5313/capture.html?view=persp&bg=%23e4e7ea&${q}`);
  for (let i = 0; i < 75; i++) { if (await b.eval('!!window.__done')) break; await sleep(200); }
  await sleep(250);
  const f = path.join(out, name + '.png'); await b.screenshot(f);
  log.push({ name, note, query: q, file: path.relative(repo, f).split(path.sep).join('/'), errors: b.errors().slice(0, 3) });
}
await b.close();
fs.writeFileSync(path.join(out, '..', 'capture-log-closeups.json'), JSON.stringify({ gpu, browser: b.browser, items: log }, null, 2) + '\n');
console.log(log.length + ' close-ups; with errors: ' + log.filter((l) => l.errors.length).map((l) => l.name).join(', '));
