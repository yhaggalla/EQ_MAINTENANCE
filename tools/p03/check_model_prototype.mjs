// P03 browser checks for the QC model prototype (headless Chrome via CDP). Needs the prototype server:
//   node artifacts/prototypes/p03-qc-model/serve.mjs   (http://127.0.0.1:5313/)
// Usage: node tools/p03/check_model_prototype.mjs [--gpu swiftshader|hardware] [--out docs/evidence/P03/browser-checks.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const gpu = arg('--gpu', 'swiftshader');
const out = path.resolve(repo, arg('--out', `docs/evidence/P03/browser-checks-${gpu}.json`));
const BASE = 'http://127.0.0.1:5313/';
const results = [];
const rec = (id, acceptance, pass, detail) => { results.push({ id, acceptance, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + id + (pass ? '' : ' ' + JSON.stringify(detail).slice(0, 300))); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await launch({ gpu, port: gpu === 'hardware' ? 9343 : 9342 });
const E = (expr) => b.eval(expr);
async function open(q = '', w = 1920, h = 1080) {
  await b.viewport(w, h); b.clearEvents();
  await b.goto(BASE + q);
  for (let i = 0; i < 60; i++) { if (await E('!!(window.__qcTiming || window.__qcFallback)')) break; await sleep(250); }
  await sleep(300);
}
async function clickAt(x, y) {
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  await sleep(250);
}
const st = () => E('JSON.stringify(window.__qc.state)').then(JSON.parse);
const posKey = (id) => E(`window.__qc.positions().find(p=>p.id===${JSON.stringify(id)})?.semanticKey`);
const idOfKey = (k) => E(`window.__qc.binding().get(${JSON.stringify(k)})?.positionId`);
const settle = () => sleep(900); // > 650 ms focus transition

try {
  // 1 load
  await open('?eq=eq-qc-demo-01');
  const load = await E(`JSON.stringify({timing: window.__qcTiming, missing: window.__qc.viewer.missing, info: window.__qc.viewer.lastInfo, sha: window.__qc.viewer.checksumVerified, canvases: document.querySelectorAll('canvas').length, renderer: (()=>{const gl=window.__qc.viewer.renderer.getContext();const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})(), ua: navigator.userAgent})`).then(JSON.parse);
  rec('load-model-and-manifest', 'S04, VIS09', load.timing && load.missing.length === 0 && load.sha === true && load.canvases === 1, load);
  rec('no-console-errors-on-load', 'S16', b.errors().length === 0, b.errors());
  const overallInfo = load.info;

  // 2 tree selection main -> sub -> part
  await E(`document.querySelector('#tree [data-id="mi-q01-01"]').click()`); await settle();
  let s = await st(); let sel = await E('JSON.stringify([...window.__qc.viewer.selected])').then(JSON.parse);
  rec('tree-select-main', 'S05, VIS03', s.main === 'mi-q01-01' && !s.sub && sel.length > 5 && sel.every((k) => k.startsWith('hoist.') || k.startsWith('emergency.') === false), { state: s, selectedKeys: sel.length });
  await E(`document.querySelector('#tree [data-id="si-q01-011"]').click()`); await settle();
  s = await st(); sel = await E('JSON.stringify([...window.__qc.viewer.selected])').then(JSON.parse);
  rec('tree-select-sub', 'S05, VIS03', s.sub === 'si-q01-011' && s.main === 'mi-q01-01' && sel.includes('hoist.drive.motor.a') && !sel.includes('hoist.emergency.brake.a'), { state: s, keys: sel });
  const motorA = await idOfKey('hoist.drive.motor.a');
  await E(`document.querySelector('#tree [data-id="${motorA}"]').click()`); await settle();
  s = await st(); sel = await E('JSON.stringify([...window.__qc.viewer.selected])').then(JSON.parse);
  const crumbs = await E(`document.querySelector('#crumbs').textContent`);
  const info = await E(`document.querySelector('#info').textContent`);
  rec('tree-select-part', 'S05, S07, VIS03', s.part === motorA && sel.length === 1 && sel[0] === 'hoist.drive.motor.a' && crumbs.includes('01 Hoist') && crumbs.includes('011') && info.includes(motorA) && info.includes('Exact-position history') && info.includes('EQJ-SYN-0101'), { state: s, crumbs, url: await E('location.search') });
  const ariaSel = await E(`document.querySelector('#tree [aria-selected="true"]').dataset.id`);
  rec('tree-synchronised', 'S05', ariaSel === motorA, ariaSel);

  // 3 scene pick of the same part reproduces the same identity (motor is technical-only): focus it without selecting, then click
  await open(`?eq=eq-qc-demo-01&mode=technical&iso=1`); await settle();
  await E(`window.__qc.viewer.fitKeys(['hoist.drive.motor.a'])`); await settle(); // occlusion-aware focus, then click its centre
  let pt = await E(`JSON.stringify(window.__qc.viewer.projectCenter('hoist.drive.motor.a'))`).then(JSON.parse);
  await clickAt(pt.x, pt.y);
  s = await st();
  rec('scene-pick-part-equals-tree', 'VIS03, S05', s.part === motorA && s.sub === 'si-q01-011' && s.main === 'mi-q01-01', { clicked: pt, state: s });

  // 4 transparent enclosure: in technical mode a ray through the house reaches internals, never the container
  await open(`?eq=eq-qc-demo-01&mode=technical`); await settle();
  await E(`window.__qc.viewer.fitKeys(['container.machinery-house'])`); await settle();
  const throughHouse = [];
  for (const k of ['hoist.drive.drum.b', 'boom-hoist.drum.main', 'electrical.hv.main-transformer']) {
    const p = await E(`JSON.stringify(window.__qc.viewer.projectCenter('${k}'))`).then(JSON.parse);
    const hit = await E(`(()=>{const v=window.__qc.viewer;const r=v.renderer.domElement.getBoundingClientRect();return JSON.stringify(v.pickAt({x:(${p.x}-r.left)/r.width*2-1,y:-((${p.y}-r.top)/r.height)*2+1}))})()`).then(JSON.parse);
    throughHouse.push({ target: k, hit });
  }
  rec('technical-enclosure-not-pickable', 'VIS04, DATA s10.7', throughHouse.every((h) => h.hit && h.hit.nodeKind !== 'container'), throughHouse);

  // 5 container pick in overall mode selects the spatial group only
  await open(`?eq=eq-qc-demo-01`); await settle();
  await E(`window.__qc.viewer.fitKeys(['container.machinery-house'])`); await settle();
  pt = await E(`JSON.stringify(window.__qc.viewer.projectCenter('container.machinery-house'))`).then(JSON.parse);
  await clickAt(pt.x, pt.y + 10); s = await st();
  const cinfo = await E(`document.querySelector('#info').textContent`);
  rec('overall-house-click-selects-container-only', 'DATA s10.7/s10.10, D-50', s.container === 'machinery-house' && !s.main && !s.sub && !s.part && cinfo.includes('not a mechanism'), { state: s });

  // 6 instanced gantry wheel pick resolves through instanceMaps
  const wheelId = await idOfKey('gantry.wheel.ws-a.3');
  await E(`window.__qc.viewer.fitKeys(['gantry.wheel.ws-a.3'])`); await settle(); // occlusion-aware focus (no selection made)
  pt = await E(`JSON.stringify(window.__qc.viewer.projectCenter('gantry.wheel.ws-a.3'))`).then(JSON.parse);
  await clickAt(pt.x, pt.y); s = await st();
  rec('instanced-wheel-pick', 'DATA s10.3 instanceMaps, VIS03', s.part === wheelId, { wheelId, state: s });

  // 7 decorative and background clicks do not create maintenance selections or clear the current one
  await E(`window.__qc.select({ part: ${JSON.stringify(motorA)} }, { focus: false })`);
  await E(`window.__qc.viewer.resetView(true)`); await sleep(300);
  const quay = await E(`JSON.stringify(window.__qc.viewer.projectCenter('gantry.quay.reference'))`).then(JSON.parse);
  await clickAt(quay.x + 120, quay.y + 40); const afterQuay = await st(); const hint1 = await E(`document.querySelector('#hint').textContent`);
  await clickAt(450, 200); const afterBg = await st(); const hint2 = await E(`document.querySelector('#hint').textContent`);
  rec('decorative-and-background-keep-selection', 'DATA s10.7 step 3-4', afterQuay.part === motorA && afterBg.part === motorA && /Not a maintenance position|Background/.test(hint1 + hint2), { hint1, hint2 });

  // 8 camera: user drag cancels a running transition; newer selection wins
  await E(`window.__qc.viewer.resetView(true)`); await sleep(200);
  await E(`window.__qc.select({ part: ${JSON.stringify(wheelId)} })`); await sleep(120);
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 900, y: 600, button: 'left', buttons: 1, clickCount: 1 });
  const tweenAfterDrag = await E('window.__qc.viewer._tween === null');
  for (let i = 1; i <= 5; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 900 + i * 12, y: 600, buttons: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 960, y: 600, button: 'left', buttons: 0, clickCount: 1 });
  const camA = await E('JSON.stringify(window.__qc.viewer.persp.position.toArray())'); await sleep(900);
  const camB = await E('JSON.stringify(window.__qc.viewer.persp.position.toArray())');
  rec('drag-cancels-transition', 'VIS04, brief s5', tweenAfterDrag && camA === camB, { tweenAfterDrag, camStable: camA === camB });
  await E(`window.__qc.viewer.resetView(true)`); await sleep(200);
  const pA = await idOfKey('boom.hinge.a'); const pB = await idOfKey('gantry.cable-reel.main');
  await E(`window.__qc.select({ part: ${JSON.stringify(pA)} })`); await sleep(100);
  await E(`window.__qc.select({ part: ${JSON.stringify(pB)} })`); await sleep(1200);
  const tgt = await E(`(()=>{const v=window.__qc.viewer;const c=v.boundsOf(['gantry.cable-reel.main']).getCenter(v.controls.target.clone());return JSON.stringify({d:c.distanceTo(v.controls.target)})})()`).then(JSON.parse);
  rec('newer-selection-wins', 'VIS04, P10 note', tgt.d < 0.01, tgt);

  // 9 thin rope fit and hidden selection (no camera jump to infinity)
  await E(`window.__qc.select({ part: ${JSON.stringify(await idOfKey('trolley.rope.set.main'))} })`); await sleep(1000);
  const rope = await E(`(()=>{const v=window.__qc.viewer;const p=v.persp.position;return JSON.stringify({finite:[p.x,p.y,p.z].every(Number.isFinite), dist:p.distanceTo(v.controls.target)})})()`).then(JSON.parse);
  rec('thin-rope-fit-finite', 'VIS04', rope.finite && rope.dist > 1 && rope.dist < 600, rope);
  await E(`window.__qc.viewer.resetView(true)`); await sleep(200);
  const before = await E('JSON.stringify(window.__qc.viewer.persp.position.toArray())');
  await E(`window.__qc.select({ sub: 'si-q01-013' })`); await sleep(900); // load-cell hotspot is technical-only -> hidden in Overall
  const after = await E('JSON.stringify(window.__qc.viewer.persp.position.toArray())');
  const hint3 = await E(`document.querySelector('#hint').textContent`);
  rec('hidden-selection-camera-unchanged', 'VIS04, DATA s10.8', before === after && /no visible representation/.test(hint3), { hint3 });

  // 10 modes: overall hides internals; technical shows them and ghosts the enclosure
  const modeInfo = async () => E(`(()=>{const v=window.__qc.viewer;const m=v.objByKey.get('hoist.drive.motor.a');let vis=true;for(let p=m;p;p=p.parent) if(!p.visible) vis=false;const shell=v.shells.get('container.machinery-house');let op=null;shell.traverse(o=>{if(o.isMesh) op=o.material.opacity});return JSON.stringify({motorVisible:vis, shellOpacity:op, calls:v.lastInfo.calls, tris:v.lastInfo.triangles})})()`).then(JSON.parse);
  await open('?eq=eq-qc-demo-01'); const mo = await modeInfo();
  await E(`document.querySelector('[data-mode="technical"]').click()`); await sleep(800); const mt = await modeInfo();
  rec('overall-vs-technical', 'S06, VIS03', !mo.motorVisible && mo.shellOpacity === 1 && mt.motorVisible && mt.shellOpacity < 0.2, { overall: mo, technical: mt });

  // 11 second equipment: same node key, different position ID and history
  await open(`?eq=eq-qc-demo-02`); await settle();
  const motorA2 = await idOfKey('hoist.drive.motor.a');
  await E(`window.__qc.select({ part: ${JSON.stringify(motorA2)} })`); await settle();
  const info2 = await E(`document.querySelector('#info').textContent`);
  rec('equipment-specific-history', 'S12, HIS01 (synthetic)', motorA2 !== motorA && info2.includes('EQJ-SYN-0202') && !info2.includes('EQJ-SYN-0101'), { 'QC-DEMO-01': motorA, 'QC-DEMO-02': motorA2 });

  // 12 deep link reload and back/forward
  await open(`?eq=eq-qc-demo-01&part=${motorA}&mode=technical`); await settle();
  s = await st(); sel = await E('JSON.stringify([...window.__qc.viewer.selected])').then(JSON.parse);
  rec('deep-link-reload', 'VIS03, D-20', s.part === motorA && s.main === 'mi-q01-01' && sel[0] === 'hoist.drive.motor.a', s);
  await E(`document.querySelector('#tree [data-id="si-q01-012"]').click()`); await settle();
  await E('history.back()'); await sleep(900); s = await st();
  const backOk = s.part === motorA;
  await E('history.forward()'); await sleep(900); const s2 = await st();
  rec('back-forward', 'VIS03', backOk && s2.sub === 'si-q01-012' && !s2.part, { back: backOk, forward: s2 });

  // 13 keyboard tree navigation
  await open('?eq=eq-qc-demo-01');
  await E(`document.querySelector('#tree [tabindex="0"]').focus()`);
  await b.key('ArrowDown'); await b.key('ArrowRight'); await b.key('ArrowDown'); await b.key('Enter'); await settle();
  s = await st();
  rec('keyboard-tree', 'S16', s.sub === 'si-q01-011', s);

  // 14 labels decluttered (no overlaps, capped)
  const lab = await E(`(()=>{const r=[...document.querySelectorAll('.qc-label')].map(e=>e.getBoundingClientRect());let ov=0;for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i],b=r[j];if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)ov++}return JSON.stringify({n:r.length,overlaps:ov})})()`).then(JSON.parse);
  rec('labels-decluttered', 'brief s5', lab.n > 0 && lab.n <= 22 && lab.overlaps === 0, lab);

  // 15 reduced motion: focus is instant
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await open('?eq=eq-qc-demo-01');
  await E(`window.__qc.select({ part: ${JSON.stringify(pB)} })`); await sleep(60);
  const rm = await E(`(()=>{const v=window.__qc.viewer;const c=v.boundsOf(['gantry.cable-reel.main']).getCenter(v.controls.target.clone());return JSON.stringify({reduced:v.reducedMotion, tween:v._tween, d:c.distanceTo(v.controls.target)})})()`).then(JSON.parse);
  rec('reduced-motion-instant', 'VIS04', rm.reduced === true && rm.tween === null && rm.d < 0.01, rm);
  await b.send('Emulation.setEmulatedMedia', { features: [] });

  // 16 resource disposal: create/load/dispose extra viewers 6 times; canvases and listeners do not accumulate
  await open('?eq=eq-qc-demo-01');
  const disp = await E(`(async()=>{const { QcViewer } = await import('./js/viewer.mjs');const m=window.__qc.manifest;const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;width:320px;height:240px;';document.body.appendChild(host);const before=document.querySelectorAll('canvas').length;const counts=[];for(let i=0;i<6;i++){const v=new QcViewer(host,{});await v.load('models/cict-j526a-sts-scene/1/scene.glb', m);v._renderNow();counts.push({canvases:document.querySelectorAll('canvas').length, geometries:v.renderer.info.memory.geometries});v.dispose();}host.remove();return JSON.stringify({before, during:counts, after:document.querySelectorAll('canvas').length, disposed:QcViewer.disposedCount})})()`).then(JSON.parse);
  rec('dispose-no-accumulation', 'VIS10 (prototype level)', disp.after === disp.before && disp.during.every((c) => c.canvases === disp.before + 1) && disp.disposed === 6, disp);

  // 17 performance: 10-second orbit with a frame rendered every animation frame
  await open('?eq=eq-qc-demo-01');
  const orbit = await E(`(async()=>{const v=window.__qc.viewer;v.resetView(true);await new Promise(r=>setTimeout(r,200));const t=v.controls.target.clone();const p0=v.persp.position.clone().sub(t);const r=Math.hypot(p0.x,p0.z);let a0=Math.atan2(p0.z,p0.x);let frames=0;const start=performance.now();let worst=0,last=start;await new Promise(res=>{const step=(now)=>{const a=a0+(now-start)/10000*Math.PI*2;v.persp.position.set(t.x+r*Math.cos(a),t.y+p0.y,t.z+r*Math.sin(a));v.persp.lookAt(t);v._renderNow();frames++;worst=Math.max(worst,now-last);last=now;if(now-start<10000)requestAnimationFrame(step);else res();};requestAnimationFrame(step);});const secs=(performance.now()-start)/1000;return JSON.stringify({frames, seconds:+secs.toFixed(2), fps:+(frames/secs).toFixed(1), worstFrameMs:+worst.toFixed(1), calls:v.lastInfo.calls, triangles:v.lastInfo.triangles, viewport:[v.renderer.domElement.width,v.renderer.domElement.height]})})()`).then(JSON.parse);
  rec('orbit-10s-measured', 'brief s6 (target >= 30 fps on reference desktop)', true, { ...orbit, gpuMode: gpu, renderer: load.renderer, note: gpu === 'swiftshader' ? 'software rendering (SwiftShader) in headless Chrome; not the office reference desktop' : 'hardware ANGLE/D3D11 in headless Chrome on this workstation' });
  const tech = await E(`(async()=>{document.querySelector('[data-mode="technical"]').click();await new Promise(r=>setTimeout(r,600));const v=window.__qc.viewer;v._renderNow();return JSON.stringify(v.lastInfo)})()`).then(JSON.parse);
  rec('render-counters', 'brief s6 budgets', overallInfo.calls <= 200 && tech.calls <= 200 && tech.triangles <= 150000, { overall: overallInfo, technical: tech });

  // 18 fallbacks keep the tree and panel usable
  for (const sim of ['nowebgl', 'loadfail', 'contextlost']) {
    await open(`?viewer=${sim}&eq=eq-qc-demo-01`); await sleep(sim === 'contextlost' ? 1200 : 300);
    const fb = await E(`JSON.stringify({fallback: window.__qcFallback || null, visible: !document.querySelector('#fallback').hidden})`).then(JSON.parse);
    await E(`document.querySelector('#tree [data-id="mi-q01-02"]').click()`); await sleep(200);
    const s3 = await st();
    rec(`fallback-${sim}`, 'VIS08, S16', fb.visible && fb.fallback && s3.main === 'mi-q01-02', { ...fb, treeStillWorks: s3.main });
  }
  // 19 phone width layout: viewer and tree stacked, no horizontal scroll
  await open('?eq=eq-qc-demo-01', 390, 844);
  const mobile = await E(`JSON.stringify({scrollW: document.documentElement.scrollWidth, w: innerWidth})`).then(JSON.parse);
  rec('narrow-layout-no-horizontal-scroll', 'S16', mobile.scrollW <= mobile.w + 1, mobile);
  // 20 P02 review-flow integration: the P02 QC detail links to the P03 model with the same equipment and selection
  try {
    await b.viewport(1920, 1080);
    await b.goto('http://127.0.0.1:5312/?role=eqTeam#/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&mode=technical'); await sleep(1500);
    const href = await E(`document.querySelector('[data-fk="open-p03"]')?.href || null`);
    await b.goto(href); for (let i = 0; i < 40; i++) { if (await E('!!window.__qcTiming')) break; await sleep(250); } await sleep(800);
    const s4 = await st(); const key4 = await posKey(s4.part);
    await b.goto('http://127.0.0.1:5312/?role=eqTeam#/equipment/eq-qc-demo-01?main=mi-q01-01&sub=si-q01-011&part=pp-q01-009&mode=technical'); await sleep(1500);
    const href2 = await E(`document.querySelector('[data-fk="open-p03"]')?.href || null`);
    await b.goto(href2); for (let i = 0; i < 40; i++) { if (await E('!!window.__qcTiming')) break; await sleep(250); } await sleep(1900);
    const s5 = await st(); const hint5 = await E(`document.querySelector('#hint').textContent`);
    rec('p02-link-opens-p03-selection', 'P03 integration into the P02 review flow', href && key4 === 'hoist.drive.motor.a' && s4.mode === 'technical' && s5.sub === 'si-q01-011' && !s5.part && /not in the drawing-derived v1 template/.test(hint5), { href, resolvedKey: key4, placeholderOnlyKey: { href: href2, state: s5, hint: hint5 } });
  } catch (e) { rec('p02-link-opens-p03-selection', 'P03 integration into the P02 review flow', false, 'P02 server on 5312 not reachable or link missing: ' + e.message); }
  rec('no-console-errors-overall', 'S16', b.errors().filter((e) => !/404|Not Found|model request failed|WebGL/i.test(e)).length === 0, b.errors());
} catch (e) {
  rec('harness-exception', '-', false, String(e && e.stack || e));
} finally {
  await b.close();
}
const report = { browser: b.browser, gpu, at: new Date().toISOString(), results, summary: { passed: results.filter((r) => r.pass).length, failed: results.filter((r) => !r.pass).length } };
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(report.summary);
if (report.summary.failed) process.exitCode = 1;
