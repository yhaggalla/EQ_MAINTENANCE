// U1 repair evidence: screenshots of the repaired P02 flat view (fleet, QC icon, flat drill-down, back-reach, logo,
// stairs, isolate/labels) and of the P03 3D drill-down and toolbar. Needs both prototype servers:
//   node artifacts/prototypes/p02-ui/serve.mjs 5312   and   node artifacts/prototypes/p03-qc-model/serve.mjs 5313
// Usage: node tools/u1/capture_u1.mjs   -> docs/evidence/U1/repair/screenshots/ and capture-log-u1.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../p03/cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// U1 round 2: --out DIR (default unchanged) so round-2 screenshots go to their own evidence folder
const out = process.argv.includes('--out') ? path.resolve(repo, process.argv[process.argv.indexOf('--out') + 1]) : path.join(repo, 'docs', 'evidence', 'U1', 'repair', 'screenshots');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu: 'hardware', port: 9357 });
const log = [];
const shot = async (name, note) => { const f = path.join(out, name + '.png'); await b.screenshot(f); log.push({ name, note, file: path.relative(repo, f).split(path.sep).join('/'), errors: b.errors().slice(0, 3) }); };
const p02 = async (hash, w = 1920, h = 1080, role = 'eqTeam') => { await b.viewport(w, h, w < 600); b.clearEvents(); await b.goto(`http://127.0.0.1:5312/?role=${role}#${hash}`); await sleep(1400); };
const p03 = async (q) => { await b.viewport(1920, 1080); b.clearEvents(); await b.goto('http://127.0.0.1:5313/' + q); for (let i = 0; i < 60; i++) { if (await b.eval('!!window.__qcTiming')) break; await sleep(250); } await sleep(1200); };
const clickLabel3d = async (re) => {
  const r = await b.eval(`(()=>{const e=[...document.querySelectorAll('.qc-label')].find(x=>${re}.test(x.textContent.replace(/^[\u2190-\u2199]/,''))); if(!e) return null; const q=e.getBoundingClientRect(); return JSON.stringify({x:q.left+q.width/2,y:q.top+q.height/2})})()`);
  if (!r) return false; const { x, y } = JSON.parse(r);
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(1300); return true;
};

// P02 flat view and fleet
await p02('/fleet'); await shot('p02-01-fleet-1920', 'U1-C02: compact fleet, no heading block, status meaning in the dashed note (tooltip); U1-C01 QC icon on QC cards');
await p02('/fleet', 1366, 768); await shot('p02-02-fleet-1366', 'U1-C02: the whole synthetic fleet (16 active items) fits one 1366 x 768 screen');
await p02('/fleet', 1920, 1080, 'admin'); await shot('p02-03-fleet-admin', 'U1-C02: Register equipment moved into the filter bar for Admin');
await p02('/fleet', 390, 844); await shot('p02-04-fleet-phone', 'U1-C02: phone width, single column');
await p02('/equipment/eq-qc-demo-01'); await shot('p02-05-flat-tier1', 'U1-C07/C08: flat view, whole equipment: tier 1 labels (main mechanisms); back-reach, logo and stairs drawn (U1-C03)');
await b.eval(`document.querySelector('[data-fk="lbl-mi-q01-01"]').click()`); await sleep(1000); await shot('p02-06-flat-tier2', 'U1-C07: clicked "01 Hoist": tier 2 labels (011, 012, 013, 015); tree and breadcrumb follow');
await b.eval(`document.querySelector('[data-fk="lbl-si-q01-012"]').click()`); await sleep(1000); await shot('p02-07-flat-tier3', 'U1-C07: clicked "012": switched to Technical, tier 3 part labelled');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-11&sub=si-q01-111'); await shot('p02-08-flat-backreach', 'U1-C03: back-reach area (anti-snag/TLS device, tail sheaves, service crane, festoon and cab service platform, tail platform) and the CICT logo');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-15&sub=si-q01-151'); await shot('p02-09-flat-stairs', 'U1-C03: stair tower on the landside leg and the A-frame stair among the 151 parts');
await p02('/equipment/eq-qc-demo-01?mode=technical&iso=1'); await shot('p02-10-flat-isolate', 'U1-C05/C08: Isolate machinery house in the flat view (same control as 3D)');
await p02('/equipment/eq-qc-demo-02'); await shot('p02-11-flat-qc02', 'U1-C07: QC02 has the same drill-down labels');
// P03 3D view
await p03('?eq=eq-qc-demo-01'); await shot('p03-01-tier1', 'U1-C07: 3D whole equipment: every main mechanism with a representation is labelled; dashed = inside, opens in Technical');
await clickLabel3d('/^01 Hoist/'); await shot('p03-02-tier2', 'U1-C07: clicked "01 Hoist": its submechanisms labelled');
await clickLabel3d('/^012 /'); await shot('p03-03-tier3', 'U1-C07: clicked "012": Technical mode, both drum brakes labelled');
await clickLabel3d('/brake A/'); await shot('p03-04-part', 'U1-C07/C08: part selected from its label; tree, breadcrumb, URL and history follow');
await p03('?eq=eq-qc-demo-02'); await clickLabel3d('/^14 Cabin/'); await clickLabel3d('/^141 /'); await shot('p03-05-qc02-cabin-parts', 'U1-C06/C07: QC02, 14 Cabin > 141: cab, seat and consoles labelled');
await p03('?eq=eq-qc-demo-01'); await b.eval(`document.querySelector('#btn-iso').click()`); await sleep(1300); await shot('p03-06-isolate-from-overall', 'U1-C05: Isolate machinery house from Overall switches to Technical and fits the house');
await p03('?eq=eq-qc-demo-01&main=mi-q01-11&view=side'); await shot('p03-07-aligned-side-fit', 'U1-C05: aligned side view with the selection (11 Skew system at the girder tail) fitted; pan and wheel zoom work');
await p03('?eq=eq-qc-demo-01&view=top'); await shot('p03-08-aligned-top', 'U1-C05: plan view');
await b.close();
fs.writeFileSync(path.join(out, '..', path.basename(out) === 'screenshots' ? 'capture-log-u1.json' : 'capture-log-' + path.basename(out) + '.json'), JSON.stringify({ browser: b.browser, items: log }, null, 2) + '\n');
console.log(log.length + ' screenshots; errors: ' + log.filter((l) => l.errors.length).map((l) => l.name).join(', '));
