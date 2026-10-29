// Ad-hoc model review captures from fixed cameras (labels off, Technical, whole crane; optional selected part key).
// Usage: node tools/u1/capture_views.mjs <outDir> <json [[name,[px,py,pz],[tx,ty,tz]],...]> [pkey]
import { launch } from '../p03/cdp.mjs';
const [out, json, pkey] = process.argv.slice(2);
const views = JSON.parse(json);
const b = await launch({ port: 9369 });
await b.viewport(1600, 1000);
await b.goto('http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&panel=technical' + (pkey ? '&pkey=' + pkey : ''));
for (let i = 0; i < 60; i++) { await b.wait(250); if (await b.eval('!!EQ.qc?.session?.ready')) break; }
await b.wait(1500);
await b.eval(`(()=>{document.querySelectorAll('.qc-labels').forEach(e=>e.style.display='none');return 1})()`);
for (const [name, p, t] of views) {
  await b.eval(`(()=>{const v=EQ.qc.session.viewer;if(v.camera!==v.persp)v.useOrtho(null);v.persp.position.set(${p});v.controls.target.set(${t});v.persp.fov=45;v.persp.near=0.05;v.persp.updateProjectionMatrix();v.controls.update();v.requestRender();return 1})()`);
  await b.wait(900);
  await b.eval(`(()=>{const c=document.querySelector('.qc-canvas');window.scrollTo(0,c.getBoundingClientRect().top+scrollY-10);return 1})()`);
  await b.wait(300);
  await b.screenshot(`${out}/${name}.png`);
}
console.log('errors', JSON.stringify(b.errors()));
await b.close();
