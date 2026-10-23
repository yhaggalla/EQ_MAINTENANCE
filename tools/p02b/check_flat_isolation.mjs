import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/flat-isolation';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9386 });
const results = [];
const check = (name, ok) => { results.push({ name, pass: !!ok }); if (!ok) throw Error(name); };
try {
  await b.viewport(1600, 1000);
  await b.goto(base + '#/eq/equipment/eq-qc-demo-01');
  for (let n = 0; n < 100; n++) { if (await b.eval('!!window.EQ?.qc?.session?.ready')) break; await b.wait(150); }
  check('Flat default, rotation locked', await b.eval('EQ.qc.session.viewer.camera.isOrthographicCamera && !EQ.qc.session.viewer.controls.enableRotate'));
  check('Yard/sea levels differ by 5 m', await b.eval(`(()=>{const c=EQ.qc.session.context;const top=n=>{const m=c.getObjectByName(n);return m.position.y+m.geometry.parameters.height/2};return top('Yard')===0&&top('Sea')===-5})()`));
  check('Full crane occupies at least 90% of the limiting viewport dimension', await b.eval(`(()=>{const v=EQ.qc.session.viewer,s=v.craneBox.getSize(v.camera.position.clone()),o=v.ortho;return Math.max(s.x/((o.right-o.left)/o.zoom),s.y/((o.top-o.bottom)/o.zoom))>=0.9})()`));
  await b.screenshot(out + '/flat.png', { fullPage: true });
  const areas = await b.eval('EQ.qc.manifest.nodes.filter(n=>n.kind==="container").map(n=>n.key.slice(10))');
  for (const area of areas) {
    await b.setValue('[data-fk="isolate-area"]', area); await b.wait(200);
    check('Isolate ' + area, await b.eval(`(()=>{const s=EQ.qc.session,v=s.viewer;return v.isolate===${JSON.stringify('container.'+area)}&&v.mode==='technical'&&!!v.boundsOf([v.isolate])&&!s.context.visible&&v.labelCandidates.length>0})()`));
  }
  await b.setValue('[data-fk="isolate-area"]', 'machinery-house'); await b.wait(350);
  await b.click('[data-fk="tab-technical"]'); await b.wait(400);
  await b.screenshot(out + '/isolated-house.png', { fullPage: true });
  await b.click('.sp-body a'); await b.wait(400);
  check('Part records retain area isolation', await b.eval(`!!EQ.route.query.part&&EQ.qc.session.viewer.isolate==='container.machinery-house'`));
  await b.click('[data-fk="view-3d"]'); await b.click('[data-fk="reset"]'); await b.wait(400);
  check('Reset restores whole crane in current 3D mode and environment', await b.eval(`EQ.qc.session.viewer.camera.isPerspectiveCamera&&!EQ.qc.session.viewer.isolate&&!EQ.route.query.part&&EQ.qc.session.context.visible`));
  await b.click('[data-fk="view-flat"]'); await b.wait(250);
  await b.viewport(390, 844); await b.wait(300);
  check('Dropdown fits phone width', await b.eval('document.scrollingElement.scrollWidth<=innerWidth'));
  await b.screenshot(out + '/phone.png', { fullPage: true });
  check('No browser errors', !b.errors().length);
} finally {
  fs.writeFileSync(out + '/checks.json', JSON.stringify(results, null, 2)); await b.close();
}
console.log(`${results.length}/${results.length} PASS`);
