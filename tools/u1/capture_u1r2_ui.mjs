// U1 round 2 evidence: UI screenshots for U1-C09..C11 (labels kept after tree selections, edge-pinned labels, Reset,
// tree folds) in the P02 flat view and the P03 3D view. Needs both prototype servers:
//   node artifacts/prototypes/p02-ui/serve.mjs 5312   and   node artifacts/prototypes/p03-qc-model/serve.mjs 5313
// Usage: node tools/u1/capture_u1r2_ui.mjs [--out docs/evidence/U1/repair-r2/screenshots]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../p03/cdp.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = path.resolve(repo, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'docs/evidence/U1/repair-r2/screenshots');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu: 'hardware', port: 9364 });
const log = [];
const shot = async (name, note) => { const f = path.join(out, name + '.png'); await b.screenshot(f); log.push({ name, note, file: path.relative(repo, f).split(path.sep).join('/'), errors: b.errors().filter((e) => !/favicon|404/.test(e)).slice(0, 3) }); };
const p02 = async (hash) => { await b.viewport(1366, 768); b.clearEvents(); await b.goto(`http://127.0.0.1:5312/?role=eqTeam#${hash}`); await sleep(1300); await b.eval(`document.querySelector('.viewport')?.scrollIntoView({block:'start'})`); await sleep(300); };
const p03 = async (q) => { await b.viewport(1366, 768); b.clearEvents(); await b.goto('http://127.0.0.1:5313/' + q); for (let i = 0; i < 60; i++) { if (await b.eval('!!window.__qcTiming')) break; await sleep(250); } await sleep(1200); };
const click = async (sel, wait = 1000) => { await b.eval(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(wait); };

// P02 flat view
await p02('/equipment/eq-qc-demo-01');
await click('[data-nid="mi-q01-13"] > .ti'); await shot('p02-r2-01-tree-13-lighting', 'U1-C09: 13 Lighting selected in the tree: the floodlight fittings are highlighted and labelled (P02/U1 showed no labels)');
await click('[data-nid="mi-q01-17"] > .ti'); await shot('p02-r2-02-tree-17-other-fallback', 'U1-C09: 17 Other has nothing drawn on the crane: the main-mechanism labels stay, with a notice');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&mode=technical');
await shot('p02-r2-03-part-edge-labels', 'U1-C09: part selected and fitted: sibling labels outside the frame are pinned to the edge with an arrow');
await click('[data-nid="mi-q01-01"] > .ti > .twist', 500); await shot('p02-r2-04-fold-selected-main', 'U1-C11: the fold icon of the selected main mechanism now collapses it (P02/U1 re-expanded it at once)');
await click('[data-fk="labels"]', 400); await click('[data-fk="reset"]', 1200); await shot('p02-r2-05-after-reset', 'U1-C10/C11: Reset: whole equipment, labels back on, tree folded to its initial state, full view (mode kept)');
await p02('/equipment/eq-qc-demo-01?mode=technical&main=mi-q01-01&sub=si-q01-013'); await shot('p02-r2-06-loadcell-boom-tip', 'U1-C12: 013 load cells drawn at the boom-tip rope anchors (technical)');
await p02('/equipment/eq-qc-demo-01?main=mi-q01-15&sub=si-q01-153'); await shot('p02-r2-07-elevator', 'U1-C16: elevator car at the landside leg with the landing levels');
// P03 3D view
await p03('?eq=eq-qc-demo-01');
await click('#tree [data-id="mi-q01-13"]', 1300); await shot('p03-r2-01-tree-13-lighting', 'U1-C09/C15: 13 Lighting selected in the tree: floodlight fittings highlighted and labelled');
const motor = await b.eval(`window.__qc.binding().get('hoist.drive.motor.a').positionId`);
await click('#tree [data-id="mi-q01-01"]', 1300); await click('#tree [data-id="si-q01-011"]', 1300); await click(`#tree [data-id="${motor}"]`, 1400);
await shot('p03-r2-02-part-edge-labels', 'U1-C09: part selected from the tree: sibling labels stay; off-screen ones are pinned to the edge with an arrow');
await click('#tree [data-id="mi-q01-01"] .tw', 500); await shot('p03-r2-03-fold-selected-main', 'U1-C11: fold icon collapses the selected main');
await click('#btn-labels', 400); await click('#btn-reset', 1500); await shot('p03-r2-04-after-reset', 'U1-C10/C11: Reset: whole equipment, labels on, tree folded, full view');
await p03('?eq=eq-qc-demo-01&sub=si-q01-013&mode=technical'); await shot('p03-r2-05-loadcell', 'U1-C12: 013 load cell system: load pins in the rope-end anchors at the boom tip');
await p03('?eq=eq-qc-demo-01&sub=si-q01-153'); await shot('p03-r2-06-elevator', 'U1-C16: 153 Elevator: mast and landings, car at the first landing outboard of leg B');
await p03('?eq=eq-qc-demo-02&sub=si-q02-061'); await shot('p03-r2-07-spreader-qc02', 'U1-C16: 061 Spreader on QC-DEMO-02: corner castings, twistlocks and flippers instead of balls');
await b.close();
fs.writeFileSync(path.join(out, '..', 'capture-log-ui.json'), JSON.stringify({ browser: b.browser, items: log }, null, 2) + '\n');
console.log(log.length + ' screenshots; with errors: ' + log.filter((l) => l.errors.length).map((l) => l.name).join(', '));
