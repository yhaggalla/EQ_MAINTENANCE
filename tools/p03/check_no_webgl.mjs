// P03: real no-WebGL browser (Chrome started with --disable-webgl --disable-3d-apis): the page must fall back and the tree must still work.
// Usage: node tools/p03/check_no_webgl.mjs [screenshot.png] [report.json]   (U1 round 2 added the optional report path; defaults unchanged)
import fs from 'node:fs';
import { launch } from './cdp.mjs';
// U1-C77 check repair: the standalone P03 page was replaced by a redirect to the shared equipment viewer (U1-C32). This check drives
// that retired page (window.__qc), so it reports SUPERSEDED and stops instead of failing on a missing hook. The live coverage is
// tools/p02b/check_unified_viewer.mjs (model load, selection, context loss, load failure, WebGL unavailable).
{ const page = fs.readFileSync(new URL('../../artifacts/prototypes/p03-qc-model/index.html', import.meta.url), 'utf8');
  if (page.includes('Compatibility entry for saved P03 links')) { console.log('SUPERSEDED: the P03 standalone page redirects to the shared viewer; run tools/p02b/check_unified_viewer.mjs'); process.exit(0); } }
const b = await launch({ gpu: 'none', port: 9345 });
await b.viewport(1920, 1080);
await b.goto('http://127.0.0.1:5313/?eq=eq-qc-demo-01'); await new Promise((r) => setTimeout(r, 2500));
const before = await b.eval(`JSON.stringify({fallback: window.__qcFallback || null, visible: !document.querySelector('#fallback').hidden, canvases: document.querySelectorAll('canvas').length})`).then(JSON.parse);
await b.eval(`document.querySelector('#tree [data-id="mi-q01-04"]').click()`); await new Promise((r) => setTimeout(r, 300));
const state = await b.eval('JSON.stringify(window.__qc.state)').then(JSON.parse);
const info = await b.eval(`document.querySelector('#info').textContent.slice(0, 120)`);
await b.screenshot(process.argv[2] || 'docs/evidence/P03/screenshots/17-real-no-webgl.png');
const pass = before.visible && !!before.fallback && state.main === 'mi-q01-04' && info.includes('04');
const rep = { browser: b.browser, flags: '--disable-gpu --disable-webgl --disable-3d-apis', before, treeSelection: state.main, info, pass };
fs.writeFileSync(process.argv[3] || 'docs/evidence/P03/no-webgl-check.json', JSON.stringify(rep, null, 2) + '\n');
console.log(JSON.stringify(rep));
await b.close();
if (!pass) process.exitCode = 1;
