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
// U1 round 2: wait for a running camera transition to finish (software rendering can stretch the 650 ms tween)
const settleCam = async () => { await sleep(300); for (let i = 0; i < 30; i++) { if (await E('!window.__qc.viewer || window.__qc.viewer._tween === null')) break; await sleep(100); } await sleep(150); };

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
  // ---------------- U1 repair checks (U1-C03..C07) ----------------
  const labelTexts = () => E(`JSON.stringify([...document.querySelectorAll('.qc-label')].map(e=>e.textContent.replace(/^[\u2190-\u2199]/, '')))`).then(JSON.parse); // U1 round 2: strip edge-pin arrows
  const clickLabel = async (re) => {
    const r = await E(`(()=>{const e=[...document.querySelectorAll('.qc-label')].find(x=>${re}.test(x.textContent.replace(/^[\u2190-\u2199]/,''))); if(!e) return null; const b=e.getBoundingClientRect(); return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2,t:e.textContent})})()`).then((x) => (x ? JSON.parse(x) : null));
    if (!r) return null; await clickAt(r.x, r.y); await settle(); return r.t;
  };
  const camSig = () => E(`JSON.stringify({p:window.__qc.viewer.camera.position.toArray().map(v=>+v.toFixed(2)),t:window.__qc.viewer.controls.target.toArray().map(v=>+v.toFixed(2)),type:window.__qc.viewer.camera.type,zoom:+window.__qc.viewer.camera.zoom.toFixed(3)})`).then(JSON.parse);
  // 21 label drill-down tier 1 -> 2 -> 3 on both synthetic QCs (U1-C07), same state as the tree (U1-C08)
  for (const [eq, k] of [['eq-qc-demo-01', 'q01'], ['eq-qc-demo-02', 'q02']]) {
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await open(`?eq=${eq}`); await settle();
    const expectMains = await E(`JSON.stringify((()=>{const m=window.__qc.manifest;const keys=m.nodes.filter(n=>(n.kind==='position'||n.kind==='hotspot')&&window.__qc.binding().has(n.key));return [...new Set(keys.map(n=>n.classification.main))].sort()})())`).then(JSON.parse);
    const t1 = await labelTexts();
    const t1Codes = t1.map((t) => t.slice(0, 2)).sort();
    const c1 = await clickLabel('/^01 Hoist/'); const s1 = await st(); const t2 = await labelTexts();
    const c2 = await clickLabel('/^012 /'); const s2 = await st(); const t3 = await labelTexts();
    const c3 = await clickLabel('/drum \\(emergency\\) brake A/'); const s3 = await st();
    const treeSel = await E(`document.querySelector('#tree [aria-selected="true"]')?.dataset.id`);
    const crumbs = await E(`document.querySelector('#crumbs').textContent`);
    const brakeA = await idOfKey('hoist.emergency.brake.a');
    const ok = JSON.stringify(t1Codes) === JSON.stringify(expectMains) && c1 && s1.main === `mi-${k}-01` && !s1.sub
      && ['011', '012', '013', '015'].every((c) => t2.some((t) => t.startsWith(c + ' ')))
      && c2 && s2.sub === `si-${k}-012` && s2.mode === 'technical' && t3.filter((t) => /drum \(emergency\) brake/.test(t)).length === 2
      && c3 && s3.part === brakeA && treeSel === brakeA && crumbs.includes('012') && (await E('location.search')).includes('part=' + brakeA);
    rec(`u1-label-drilldown-${k}`, 'U1-C07, U1-C08, S05', ok, { tier1: t1, expectMains, tier2: t2, tier3: t3, states: [s1, s2, s3], treeSel });
  }
  await b.send('Emulation.setEmulatedMedia', { features: [] });
  // 22 a drag that starts on a label still orbits and does not change the selection
  await open('?eq=eq-qc-demo-01'); await settle();
  const lr = await E(`JSON.stringify((()=>{const e=document.querySelector('.qc-label');const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}})())`).then(JSON.parse);
  const before22 = await camSig();
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: lr.x, y: lr.y, button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 6; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: lr.x + i * 15, y: lr.y, buttons: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: lr.x + 90, y: lr.y, button: 'left', buttons: 0, clickCount: 1 }); await sleep(300);
  const after22 = await camSig(); const s22 = await st();
  rec('u1-label-drag-orbits', 'U1-C07 (labels must not block orbit)', JSON.stringify(before22.p) !== JSON.stringify(after22.p) && !s22.main && !s22.part, { before22, after22 });
  // 23 toolbar: every control works (U1-C05)
  await open('?eq=eq-qc-demo-01'); await settle();
  const tb = {};
  await E(`document.querySelector('#btn-iso').click()`); await settle();
  let s23 = await st(); let c23 = await camSig();
  tb.isoFromOverall = s23.mode === 'technical' && s23.iso === true && Math.abs(c23.t[0] + 36.9) < 2.5 && !(await E(`document.querySelector('#btn-iso').disabled`));
  await E(`document.querySelector('#btn-iso').click()`); await settle(); s23 = await st(); tb.isoOff = s23.iso === false;
  await E(`document.querySelector('[data-mode="overall"]').click()`); await settle(); tb.overall = (await st()).mode === 'overall';
  await E(`window.__qc.viewer.resetView(true)`); await sleep(200); const reset0 = await camSig();
  await E(`window.__qc.viewer.persp.position.set(40,30,90); window.__qc.viewer.controls.update(); window.__qc.viewer.requestRender()`); await sleep(100);
  await E(`document.querySelector('#btn-fit').click()`); await settle(); tb.fitNoSelectionResets = JSON.stringify((await camSig()).p) === JSON.stringify(reset0.p);
  const hinge = await idOfKey('boom.hinge.a');
  await E(`window.__qc.select({ part: ${JSON.stringify(hinge)} }, { focus: false })`); await sleep(200);
  await E(`document.querySelector('#btn-fit').click()`); await settle();
  tb.fitSelection = await E(`(()=>{const v=window.__qc.viewer;const c=v.boundsOf(['boom.hinge.a']).getCenter(v.controls.target.clone());return c.distanceTo(v.controls.target)<0.05})()`);
  // U1 round 2 (U1-C10): Reset now also returns to the whole equipment (selection cleared), so the selection is made again
  // before the aligned-view checks below (the P03/U1 version expected Reset to keep the selection).
  await E(`document.querySelector('#btn-reset').click()`); await settleCam(); tb.reset = JSON.stringify((await camSig()).p) === JSON.stringify(reset0.p) && !(await st()).part;
  await E(`window.__qc.select({ part: ${JSON.stringify(hinge)} }, { focus: false })`); await sleep(200);
  await E(`document.querySelector('#btn-labels').click()`); await sleep(200); tb.labelsOff = (await labelTexts()).length === 0;
  await E(`document.querySelector('#btn-labels').click()`); await sleep(200); tb.labelsOn = (await labelTexts()).length > 0;
  tb.views = {};
  for (const v of ['side', 'end-ws', 'end-ls', 'top']) {
    await E(`(()=>{const s=document.querySelector('#view-select'); s.value='${v}'; s.dispatchEvent(new Event('change'))})()`); await sleep(400);
    const a = await camSig();
    const fitOk = await E(`(()=>{const v=window.__qc.viewer;const c=v.boundsOf(['boom.hinge.a']).getCenter(v.controls.target.clone());return c.distanceTo(v.controls.target)<0.05})()`);
    const vp = await E(`JSON.stringify((()=>{const r=document.querySelector('#viewport canvas').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})())`).then(JSON.parse);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: vp.x, y: vp.y, deltaX: 0, deltaY: -300 }); await sleep(300);
    const z = await camSig();
    await E(`document.querySelector('#btn-reset').click()`); await sleep(300); const r = await camSig();
    tb.views[v] = a.type === 'OrthographicCamera' && fitOk && z.zoom > a.zoom && r.type === 'OrthographicCamera' && r.zoom === 1;
    await E(`window.__qc.select({ part: ${JSON.stringify(hinge)} }, { focus: false })`); await sleep(150); // Reset cleared it (U1-C10)
  }
  await E(`(()=>{const s=document.querySelector('#view-select'); s.value=''; s.dispatchEvent(new Event('change'))})()`); await sleep(400);
  tb.backToPerspective = (await camSig()).type === 'PerspectiveCamera' && (await E('window.__qc.viewer.controls.enableRotate'));
  rec('u1-toolbar-controls-work', 'U1-C05, S04', Object.values(tb).every((x) => x === true || (typeof x === 'object' && Object.values(x).every(Boolean))), tb);
  // 24 model content added in the repair: back-reach area, logo, stairs, cab internals, reeving blocks (U1-C03, C04, C06)
  const mc = await E(`JSON.stringify((()=>{const v=window.__qc.viewer;const keys=['container.back-reach','reeving.anti-snag-tls.device','reeving.sheave.girder-tail','reeving.sheave.trolley-tail','auxiliary.service-crane.girder-tail','access.platform.festoon-cab-service','access.platform.girder-tail','access.stair.landside-leg-b','access.stair.a-frame','access.walkway.tie-beam','cabin.operator.main','cabin.operator.seat','cabin.operator.consoles','auxiliary.air-conditioning.outdoor-units','boom.sheave.boom-block'];
    const missing=keys.filter(k=>!v.objByKey.has(k));let logo=null;v.root.traverse(o=>{if(o.userData.decalOf) logo=o});
    const img=logo&&logo.material.map&&logo.material.map.image; const vis=(o)=>{for(let p=o;p;p=p.parent) if(!p.visible) return false; return true};
    return {missing, logo: !!logo, logoTexture: img ? [img.width, img.height] : null, logoVisibleOverall: logo ? vis(logo) : null, mode: v.mode};})())`).then(JSON.parse);
  await E(`document.querySelector('[data-mode="technical"]').click()`); await sleep(500);
  const logoTech = await E(`(()=>{let l=null;window.__qc.viewer.root.traverse(o=>{if(o.userData.decalOf) l=o});for(let p=l;p;p=p.parent) if(!p.visible) return false; return true})()`);
  rec('u1-model-content', 'U1-C03, U1-C04, U1-C06', mc.missing.length === 0 && mc.logo && mc.logoTexture && mc.logoTexture[0] === 512 && mc.logoVisibleOverall === true && logoTech === false, { ...mc, logoVisibleTechnical: logoTech });
  // ---------------- U1 round 2 (U1-C09..C16) ----------------
  const labelsNow = () => E(`JSON.stringify([...document.querySelectorAll('.qc-label')].map(e=>({t:e.textContent, edge:!!e.dataset.offscreen})))`).then(JSON.parse);
  // 25 labels stay on the crane after any tree selection (every main, a sub and a part); off-screen ones are edge-pinned
  await open('?eq=eq-qc-demo-01', 1366, 768); await settle();
  const perMain = {};
  for (const m of await E(`JSON.stringify([...document.querySelectorAll('#tree [aria-level="2"]')].map(e=>e.dataset.id))`).then(JSON.parse)) {
    await E(`document.querySelector('#tree [data-id="${m}"]').click()`); await settle(); perMain[m] = (await labelsNow()).length;
  }
  await E(`document.querySelector('#tree [data-id="si-q01-011"]').click()`); await settle(); const subN = (await labelsNow()).length;
  await E(`document.querySelector('#tree [data-id="${motorA}"]').click()`); await settle(); const partL = await labelsNow();
  rec('u1r2-labels-persist-after-tree-selection', 'U1-C09, U1-C08', Object.values(perMain).every((n) => n >= 1) && subN >= 2 && partL.length >= 2 && partL.some((l) => /motor A/.test(l.t)), { perMain, subN, partLabels: partL });
  // 26 Reset returns to the whole equipment with labels and the initial tree folds (mode is kept)
  await E(`document.querySelector('#btn-iso').click()`); await settle();
  await E(`document.querySelector('#btn-labels').click()`); await sleep(200);
  const before26 = { labels: (await labelsNow()).length, expanded: await E(`document.querySelectorAll('#tree [aria-expanded="true"]').length`) };
  await E(`window.__qc.viewer.resetView(true)`); await sleep(150); const r26cam = await camSig();
  await E(`window.__qc.select({ sub: 'si-q01-031' })`); await settle();
  await E(`document.querySelector('#btn-reset').click()`); await settleCam();
  const s26 = await st();
  const after26 = { labels: (await labelsNow()).length, pressed: await E(`document.querySelector('#btn-labels').getAttribute('aria-pressed')`), expanded: await E(`JSON.stringify([...document.querySelectorAll('#tree [aria-expanded="true"]')].map(e=>e.dataset.id))`).then(JSON.parse), search: await E('location.search'), cam: await camSig() };
  const tier1n = await E(`JSON.stringify((()=>{const m=window.__qc.manifest;const keys=m.nodes.filter(n=>(n.kind==='position'||n.kind==='hotspot')&&window.__qc.binding().has(n.key));return new Set(keys.map(n=>n.classification.main)).size})())`).then(JSON.parse);
  rec('u1r2-reset-whole-equipment', 'U1-C10, U1-C11', before26.labels === 0 && !s26.main && !s26.sub && !s26.part && !s26.container && !s26.iso && after26.pressed === 'true' && after26.labels === tier1n && JSON.stringify(after26.expanded) === '["eq"]' && after26.search === '?eq=eq-qc-demo-01&mode=technical' && JSON.stringify(after26.cam.p) === JSON.stringify(r26cam.p), { before26, after26, state: s26, tier1n });
  // 27 tree fold icons work both ways, also on the selected mechanism
  await E(`document.querySelector('#tree [data-id="mi-q01-01"]').click()`); await settle();
  const exp = () => E(`JSON.stringify([...document.querySelectorAll('#tree [aria-expanded="true"]')].map(e=>e.dataset.id))`).then(JSON.parse);
  const f0 = await exp(); await E(`document.querySelector('#tree [data-id="mi-q01-01"] .tw').click()`); await sleep(200); const f1 = await exp();
  await E(`document.querySelector('#tree [data-id="mi-q01-01"] .tw').click()`); await sleep(200); const f2 = await exp();
  await E(`document.querySelector('#tree [data-id="mi-q01-02"] .tw').click()`); await sleep(200); const f3 = await exp();
  rec('u1r2-tree-fold-both-ways', 'U1-C11', f0.includes('mi-q01-01') && !f1.includes('mi-q01-01') && f2.includes('mi-q01-01') && f3.includes('mi-q01-02') && (await st()).main === 'mi-q01-01', { f0, f1, f2, f3 });
  // 28 model content for U1-C12..C16 (manifest geometry, not appearance)
  const mc2 = await E(`JSON.stringify((()=>{const m=window.__qc.manifest;const n=(k)=>m.nodes.find(x=>x.key===k);const b=(k)=>n(k).bounds;const L=m.landmarks;
    const hot=m.nodes.filter(x=>x.kind==='hotspot');
    return {markers: hot.filter(x=>x.hotspot.representation!=='simplified-part').map(x=>x.key), hotspots: hot.length,
      loadcell: b('hoist.loadcell.main'), boomTip: L.boomTipX, trolleyRail: L.trolleyRail,
      flood: b('auxiliary.lighting.boom'), floodModes: n('auxiliary.lighting.boom').modes,
      car: b('access.elevator.car'), mast: b('access.elevator.mast'), legZ: L.legCentreSpacing/2,
      head: b('structure.a-frame.head'), apexSheave: b('boom.sheave.apex'), overall: L.overallHeight, aTop: L.aFrameTop,
      tail: b('access.platform.girder-tail'), tailX: L.girderTailX, blocks: b('boom.sheave.boom-block'), hingeX: L.hingeX}})())`).then(JSON.parse);
  const c28 = {
    noBallMarkers: mc2.markers.length === 0 && mc2.hotspots === 19,
    loadcellAtBoomTip: mc2.loadcell.min[0] > mc2.boomTip - 4 && mc2.loadcell.min[1] > mc2.trolleyRail - 0.5,
    floodlightsAlongGirderAndBoom: mc2.flood.min[0] < -40 && mc2.flood.max[0] > 60 && mc2.flood.max[1] < 50.6 && mc2.floodModes.includes('overall'),
    elevatorOutboardOfLegB: mc2.car.max[2] < -mc2.legZ - 1.2 && Math.abs((mc2.car.min[0] + mc2.car.max[0]) / 2 + 30) < 1 && mc2.mast.max[1] > 56 && mc2.mast.min[0] < -31,
    apexPlatformAndGuard: Math.abs(mc2.head.max[1] - mc2.overall) < 0.01 && mc2.head.max[0] - mc2.head.min[0] > 5 && mc2.apexSheave.max[1] > mc2.aTop + 1.5,
    tailEndPlatformBeyondGirder: mc2.tail.min[0] < mc2.tailX - 3 && mc2.tail.min[1] < 50.8,
    twoBoomBlocks: mc2.blocks.min[0] < mc2.hingeX + 29 && mc2.blocks.max[0] > mc2.hingeX + 62,
  };
  rec('u1r2-model-content', 'U1-C12, U1-C13, U1-C14, U1-C15, U1-C16', Object.values(c28).every(Boolean), { checks: c28, ...mc2 });
  // 29 U1 round 3 model content (manifest geometry against J526A0200 / J526A1200 / ISO 1161 values, not appearance)
  const mc3 = await E(`JSON.stringify((()=>{const m=window.__qc.manifest;const n=(k)=>m.nodes.find(x=>x.key===k);const b=(k)=>n(k)&&n(k).bounds;const c=(bb,i)=>(bb.min[i]+bb.max[i])/2;
    const sa=b('trolley.sheave.set.a'), sb=b('trolley.sheave.set.b'); const XT=c(sa,0);
    const wheels=m.nodes.filter(x=>x.key.startsWith('trolley.wheel.')).map(x=>({key:x.key,x:c(x.bounds,0)-XT,z:c(x.bounds,2),y:c(x.bounds,1)}));
    const tl=m.nodes.filter(x=>x.key.startsWith('spreader.twistlock.')).map(x=>({key:x.key,dx:x.hotspot.point[0]-XT,z:x.hotspot.point[2]}));
    const hbA=b('headblock.sheave-box.a'), sp=b('spreader.frame'), eqz=b('trolley.sheave.equalizer'), reel=n('trolley.spreader-cable-reel');
    return {XT, rail:m.landmarks.trolleyRail, wheels, sa, sb, tl, hbWidth:hbA.max[0]-hbA.min[0], spWidth:sp.max[0]-sp.min[0], spLen:sp.max[2]-sp.min[2],
      eqX:[eqz.min[0]-XT, eqz.max[0]-XT], reelSub: reel&&reel.classification.sub}})())`).then(JSON.parse);
  const near = (a, v, t) => Math.abs(a - v) <= t;
  const c29 = {
    fourWheelsOnePerCorner: mc3.wheels.length === 4 && mc3.wheels.every((w) => w.key.endsWith('.1')),
    wheelAxlesAndRails: mc3.wheels.every((w) => (near(w.x, -2.37, 0.02) || near(w.x, 2.07, 0.02)) && near(Math.abs(w.z), 3.15, 0.02) && near(w.y, mc3.rail + 0.315, 0.02)),
    sheaveShaftsAt900BothSides: near(mc3.sa.min[0] - mc3.XT, -1.4, 0.03) && near(mc3.sa.max[0] - mc3.XT, 1.4, 0.03) && near((mc3.sa.min[2] + mc3.sa.max[2]) / 2, 2.6, 0.05) && near((mc3.sb.min[2] + mc3.sb.max[2]) / 2, -2.6, 0.05),
    equalizersAtBothEndsAndReel014: mc3.eqX[0] < -2.7 && mc3.eqX[1] > 2.4 && mc3.reelSub === '014',
    headblockBox2090: near(mc3.hbWidth, 2.09, 0.01),
    spreaderTwistlocksIso40ft: mc3.tl.length === 4 && mc3.tl.every((t) => near(Math.abs(t.dx), 1.1295, 0.001) && near(Math.abs(t.z), 5.9925, 0.001)),
    spreaderEnvelope: near(mc3.spWidth, 2.44, 0.01) && mc3.spLen > 12 && mc3.spLen < 12.6,
  };
  rec('u1r3-trolley-spreader-content', 'U1-C17, U1-C18', Object.values(c29).every(Boolean), { checks: c29, ...mc3 });
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
