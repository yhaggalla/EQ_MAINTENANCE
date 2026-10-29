// U1-C66: selected-part label highlight check (Main hoist motor A, Seaside catenary trolley) at 1920x1080.
// Usage (prototype server on 5312): node tools/u1/capture_label_c66.mjs [outDir]
import { launch } from '../p03/cdp.mjs';
const out = process.argv[2] || 'docs/evidence/U1/rope-paths-c66';
const b = await launch({ port: 9366 });
await b.viewport(1920, 1080);
const res = [];
for (const [name, key] of [['label-main-hoist-motor-a', 'hoist_drive_motor_a'], ['label-seaside-catenary', 'trolley_catenary_waterside']]) {
  b.clearEvents();
  await b.goto(`http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&pkey=${key}`);
  for (let i = 0; i < 40; i++) { await b.wait(250); if (await b.eval('!!EQ.qc.session?.ready && !!document.querySelector(".qc-label.sel")')) break; }
  await b.wait(1200);
  const info = await b.eval(`(()=>{const e=document.querySelector('.qc-label.sel');if(!e)return null;const cs=getComputedStyle(e);const o=[...document.querySelectorAll('.qc-label:not(.sel)')][0];return {text:e.textContent,bg:cs.backgroundColor,color:cs.color,fontSize:cs.fontSize,fontWeight:cs.fontWeight,zIndex:cs.zIndex,boxShadow:cs.boxShadow,otherBg:o&&getComputedStyle(o).backgroundColor,otherFont:o&&getComputedStyle(o).fontSize,selCount:document.querySelectorAll('.qc-label.sel').length}})()`);
  await b.screenshot(`${out}/${name}.png`);
  res.push({ name, info, errors: b.errors() });
}
console.log(JSON.stringify(res, null, 1));
await b.close();
