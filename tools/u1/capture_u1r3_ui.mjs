// U1 round 3 evidence: UI screenshots for U1-C17 (trolley) and U1-C18 (spreader, headblock) in the P02 flat view and
// the P03 3D view, with the drill-down labels on. Needs both prototype servers:
//   node artifacts/prototypes/p02-ui/serve.mjs 5312   and   node artifacts/prototypes/p03-qc-model/serve.mjs 5313
// Usage: node tools/u1/capture_u1r3_ui.mjs [--gpu swiftshader|hardware] [--out docs/evidence/U1/repair-r3/screenshots]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../p03/cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const opt = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const out = path.resolve(repo, opt('--out', 'docs/evidence/U1/repair-r3/screenshots'));
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu: opt('--gpu', 'swiftshader'), port: 9365 });
const log = [];
const shot = async (name, note) => { const f = path.join(out, name + '.png'); await b.screenshot(f); log.push({ name, note, file: path.relative(repo, f).split(path.sep).join('/'), errors: b.errors().filter((e) => !/favicon|404/.test(e)).slice(0, 3) }); };
const p02 = async (hash) => { await b.viewport(1366, 768); b.clearEvents(); await b.goto(`http://127.0.0.1:5312/?role=eqTeam#${hash}`); await sleep(1500); await b.eval(`document.querySelector('.viewport')?.scrollIntoView({block:'start'})`); await sleep(400); };
const p03 = async (q) => { await b.viewport(1366, 768); b.clearEvents(); await b.goto('http://127.0.0.1:5313/' + q); for (let i = 0; i < 120; i++) { if (await b.eval('!!window.__qcTiming')) break; await sleep(250); } await sleep(1500); await b.eval(`document.querySelector('#btn-fit')?.click()`); await sleep(3500); }; // Fit selection, as the user did for 14.png

// P02 flat view
await p02('/equipment/eq-qc-demo-01?main=mi-q01-02&sub=si-q01-021&mode=technical'); await shot('p02-r3-01-trolley-021', 'U1-C17 flat: 021 Trolley selected (technical): frame, wheels A/B at 2370 / 2070, sheave shafts A (B behind) at 900 either side, equalizer sheaves, labels');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-015&mode=technical'); await shot('p02-r3-02-hoist-rope-falls', 'U1-C17 flat: 015 main hoist rope set: falls from the trolley sheave tangents to the headblock sheaves (drawing pattern)');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-06'); await shot('p02-r3-03-spreader-headblock', 'U1-C18 flat: 06 Spreader: headblock (2090, two dia 1000 sheaves, fence, twistlocks) and spreader end-on (2440, main beams, flippers, twistlocks)');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-014'); await shot('p02-r3-04-cable-reel-014', 'U1-C17 flat: 014 spreader cable reel in the trolley body with the cable to the headblock');
// P03 3D view
await p03('?eq=eq-qc-demo-01&container=trolley&mode=technical'); await shot('p03-r3-01-trolley-container', 'U1-C17 3D: trolley spatial group fitted (technical, the 14.png state): labelled wheels LS-A/LS-B/WS-A/WS-B, sheave sides A/B, equalizer sheaves, frame, cable reel');
await p03('?eq=eq-qc-demo-01&sub=si-q01-021&mode=technical'); await shot('p03-r3-01b-trolley-021', 'U1-C17 3D: 021 trolley sub-mechanism selected: tier-3 labels for every 021 position (house drive, tail sheaves, trolley parts)');
await p03('?eq=eq-qc-demo-02&sub=si-q02-061'); await shot('p03-r3-02-spreader-061-qc02', 'U1-C18 3D: 061 Spreader on QC02: spreader frame and the four twistlock / flipper corners');
await p03('?eq=eq-qc-demo-01&sub=si-q01-062'); await shot('p03-r3-03-headblock-062', 'U1-C18 3D: 062 Headblock: frame, sheave boxes A/B with twistlocks');
await p03('?eq=eq-qc-demo-01&sub=si-q01-014&mode=technical'); await shot('p03-r3-04-cable-reel-014', 'U1-C17 3D: 014 spreader cable reel (new position) inside the trolley body');
await b.close();
fs.writeFileSync(path.join(out, '..', 'capture-log-ui.json'), JSON.stringify({ browser: b.browser, items: log }, null, 2) + '\n');
console.log(log.length + ' screenshots; with errors: ' + log.filter((l) => l.errors.length).map((l) => l.name).join(', '));
