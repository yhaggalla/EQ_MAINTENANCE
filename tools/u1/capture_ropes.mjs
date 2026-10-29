// U1-C66 rope-path review captures from fixed camera viewpoints (labels off, Technical mode, whole crane).
// Usage (prototype server on 5312): node tools/u1/capture_ropes.mjs <outDir> [name ...]
import { launch } from '../p03/cdp.mjs';
const out = process.argv[2] || 'docs/evidence/U1/rope-paths-c66';
const only = process.argv.slice(3);
const views = { // [camera position, target] in scene metres (X along the boom, Y up, Z along the rails)
  'user-view': [[60, 63, 11], [72.5, 52.8, -0.5]],
  'tip-side': [[71, 55.5, 9], [74.5, 52.9, 0]],
  'tip-top': [[70.5, 60, 3.5], [74.5, 52.6, 0]],
  'tip-end': [[80, 54.5, 5], [74.5, 52.9, 0]],
  'trolley-side': [[66, 54.5, 9], [70, 52.6, 0]],
  'trolley-under': [[66, 49.5, 7], [70, 51.8, 0]],
  'tail-side': [[-55, 55.5, 9], [-59, 53, 0]],
  'tail-top': [[-54, 59, 4], [-59, 52.8, 0]],
  'house-exit': [[-47, 55.5, 7], [-42, 53.2, 1.5]],
  'hinge-catenary': [[-4, 57, 6], [1.3, 53, 1]],
  'apex': [[-9, 82.5, 9], [-1.2, 79.5, 1]],
  'apex-side': [[-1, 79, 9], [-1, 79.6, 0]],
  'boom-blocks': [[23, 57, 8], [28, 53.6, 0.5]],
  'boom-blocks-z3': [[58, 56, 8], [62.6, 53.4, 0.5]],
};
const b = await launch({ port: 9365 });
await b.viewport(1600, 1000);
await b.goto('http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&panel=technical');
for (let i = 0; i < 40; i++) { await b.wait(250); if (await b.eval('!!EQ.qc.session?.ready')) break; }
await b.wait(1500);
await b.eval(`(()=>{const s=EQ.qc.session;s.viewer.setLabels(false);s.viewer.setLabelCandidates([]);document.querySelectorAll('.qc-labels,.qc-leaders').forEach(e=>e.style.display='none');return 1})()`);
for (const [name, [p, t]] of Object.entries(views)) {
  if (only.length && !only.includes(name)) continue;
  await b.eval(`(()=>{const v=EQ.qc.session.viewer;v.useOrtho&&v.camera!==v.persp&&v.useOrtho(null);v.persp.position.set(${p});v.controls.target.set(${t});v.persp.fov=40;v.persp.near=0.05;v.persp.updateProjectionMatrix();v.controls.update();v.requestRender();return 1})()`);
  await b.wait(900);
  await b.eval(`(()=>{const c=document.querySelector('.qc-canvas');const r=c.getBoundingClientRect();window.scrollTo(0,r.top+scrollY-10);return 1})()`);
  await b.wait(300);
  await b.screenshot(`${out}/${name}.png`);
}
console.log('errors', JSON.stringify(b.errors()));
await b.close();
