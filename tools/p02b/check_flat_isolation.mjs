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
  // U1-C77 check repair: the simplified equipment view (commit cb0fc59) has no Flat mode; the viewer opens in 3D. The Flat assertions
  // are replaced by their 3D equivalents; the area-isolation assertions are unchanged.
  check('3D default, rotation enabled (Flat mode removed)', await b.eval('EQ.qc.session.viewer.camera.isPerspectiveCamera && EQ.qc.session.viewer.controls.enableRotate && !document.querySelector(\'[data-fk="view-flat"]\')'));
  check('Yard/sea levels differ by 5 m', await b.eval(`(()=>{const c=EQ.qc.session.context;const top=n=>{const m=c.getObjectByName(n);return m.position.y+m.geometry.parameters.height/2};return top('Yard')===0&&top('Sea')===-5})()`));
  check('Full crane is framed: inside the view and at least 80% of the limiting dimension', await b.eval(`(()=>{const v=EQ.qc.session.viewer;v.camera.updateMatrixWorld();let x=0,y=0;for(const n of EQ.qc.manifest.nodes.filter(n=>n.kind==='position'&&n.modes.length))for(const a of [n.bounds.min[0],n.bounds.max[0]])for(const b of [n.bounds.min[1],n.bounds.max[1]])for(const c of [n.bounds.min[2],n.bounds.max[2]]){const p=v.camera.position.clone().set(a,b,c).project(v.camera);x=Math.max(x,Math.abs(p.x));y=Math.max(y,Math.abs(p.y));}return x<=.97&&y<=.97&&Math.max(x,y)>.8})()`));
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
  await b.click('[data-fk="reset"]'); await b.wait(400);
  check('Reset restores whole crane in 3D and its environment', await b.eval(`EQ.qc.session.viewer.camera.isPerspectiveCamera&&!EQ.qc.session.viewer.isolate&&!EQ.route.query.part&&EQ.qc.session.context.visible`));
  await b.viewport(390, 844); await b.wait(300);
  check('Dropdown fits phone width', await b.eval('document.scrollingElement.scrollWidth<=innerWidth'));
  await b.screenshot(out + '/phone.png', { fullPage: true });
  check('No browser errors', !b.errors().length);
} finally {
  fs.writeFileSync(out + '/checks.json', JSON.stringify(results, null, 2)); await b.close();
}
console.log(`${results.length}/${results.length} PASS`);
