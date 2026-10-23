// U1-C32: user-flow checks for the shared model viewer. Synthetic prototype, software WebGL.
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5324/';
const out = 'docs/evidence/U1/unified-viewer';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9384 }), results = [];
const ev = x => b.eval(x);
const waitReady = async () => { for (let i = 0; i < 80; i++) { if (await ev('!!window.EQ?.qc?.session?.ready')) return; await b.wait(150); } throw Error('viewer readiness timeout'); };
const go = async (id = '01', q = '') => { await b.goto(base + '?role=management#/eq/equipment/eq-qc-demo-' + id + '?' + q); await waitReady(); await b.wait(800); };
const step = async (id, fn) => { try { await fn(); results.push({ id, pass: true }); console.log('PASS ' + id); } catch (e) { results.push({ id, pass: false, error: e.message }); console.log('FAIL ' + id + ': ' + e.message); } };
const assert = (ok, message) => { if (!ok) throw Error(message); };
const click = fk => b.click('[data-fk="' + fk + '"]' + (fk.startsWith('ti-') ? ' > .ti' : ''));
try {
  await b.viewport(1600, 1100);
  await step('01 shared model and single viewport', async () => {
    await go();
    assert(await ev(`(()=>{window.savedViewer=EQ.qc.session.viewer;window.savedRoot=savedViewer.root;return document.querySelectorAll('canvas').length===1&&document.querySelectorAll('[role=tree]').length===1&&document.querySelectorAll('[role=tablist]').length===1&&!document.querySelector('#scene-svg')&&savedViewer.checksumVerified})()`), 'single shared checked model');
    assert(await ev(`EQ.qc.manifest.nodes.filter(n=>n.kind==='position').every(n=>EQ.positionsOf('eq-qc-demo-01').some(p=>p.key===n.key))`), 'model position omitted from shared tree');
    await b.screenshot(out + '/3d-desktop.png', { fullPage: true });
  });
  await step('02 tree selection and all four panels survive switches', async () => {
    await click('ti-mi-q01-01'); await click('ti-si-q01-011'); await click('ti-pp-q01-007'); await b.wait(900);
    for (const tab of ['maintenance', 'special', 'technical', 'spareParts']) {
      await click('tab-' + tab); await b.wait(500);
      const before = await ev(`({part:EQ.route.query.part,text:document.querySelector('#tabpanel').textContent})`);
      await click('view-flat'); await b.wait(500);
      const same = await ev(`({part:EQ.route.query.part,text:document.querySelector('#tabpanel').textContent,same:EQ.qc.session.viewer===savedViewer&&EQ.qc.session.viewer.root===savedRoot,flat:EQ.qc.session.viewer.camera.isOrthographicCamera&&!EQ.qc.session.viewer.controls.enableRotate})`);
      assert(before.part === same.part && before.text === same.text && same.same && same.flat, 'selection/panel/model mismatch: ' + tab);
      await click('view-3d'); await b.wait(400);
      assert(await ev(`EQ.qc.session.viewer.camera.isPerspectiveCamera&&EQ.qc.session.viewer.controls.enableRotate&&EQ.route.query.part==='pp-q01-007'`), '3D restore');
    }
  });
  await step('03 fixed side drag, pan, zoom and aspect ratio', async () => {
    await click('view-flat'); await click('reset'); await b.wait(300);
    const before = await ev(`(()=>{const v=EQ.qc.session.viewer;return {q:v.camera.quaternion.toArray(),zoom:v.camera.zoom,r:v.renderer.domElement.getBoundingClientRect().toJSON()}})()`);
    const { x, y, width, height } = before.r;
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + width/2, y: y + height/2, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + width/2 + 70, y: y + height/2 + 30, button: 'left', buttons: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + width/2 + 70, y: y + height/2 + 30, button: 'left' });
    assert(JSON.stringify(before.q) === JSON.stringify(await ev('EQ.qc.session.viewer.camera.quaternion.toArray()')), 'Flat rotated');
    await click('zoom-in');
    assert(await ev('EQ.qc.session.viewer.camera.zoom') > before.zoom, 'zoom control');
    const pos = await ev('EQ.qc.session.viewer.camera.position.toArray()');
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x + width/2, y: y + height/2, button: 'right', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + width/2 + 70, y: y + height/2 + 30, button: 'right', buttons: 2 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + width/2 + 70, y: y + height/2 + 30, button: 'right' });
    assert(JSON.stringify(pos) !== JSON.stringify(await ev('EQ.qc.session.viewer.camera.position.toArray()')), 'pan control');
    await click('reset'); await b.screenshot(out + '/flat-desktop.png', { fullPage: true });
    await b.viewport(1366, 768); await b.wait(400);
    assert(await ev(`(()=>{const v=EQ.qc.session.viewer;return Math.abs((v.ortho.right-v.ortho.left)/(v.ortho.top-v.ortho.bottom)-v.host.clientWidth/v.host.clientHeight)<0.01})()`), 'distorted side view after resize');
  });
  await step('04 scene label clicks drill down through tree and panel in both views', async () => {
    for (const view of ['3d', 'flat']) {
      await click('view-' + view); await click('reset'); await b.wait(900);
      for (const wanted of ['mi-q01-01', 'si-q01-011', 'hoist.drive.motor.a']) {
        const rect = await ev(`(()=>{const v=EQ.qc.session.viewer;const p=v._placedLabels.find(p=>p.c.id===${JSON.stringify(wanted)});if(!p)return null;const r=v.renderer.domElement.getBoundingClientRect();return {x:r.x+p.r.x+p.r.w/2,y:r.y+p.r.y+p.r.h/2}})()`);
        assert(rect, 'label missing ' + wanted);
        await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...rect, button: 'left', clickCount: 1 });
        await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...rect, button: 'left', clickCount: 1 });
        await b.wait(900);
      }
      assert(await ev(`EQ.route.query.part==='pp-q01-007'&&document.querySelector('[data-fk="ti-pp-q01-007"]').getAttribute('aria-selected')==='true'`), 'scene/tree selection mismatch');
    }
  });
  await step('05 technical isolation, labels, markers and reset retain Flat', async () => {
    await click('iso'); await b.wait(500);
    assert(await ev(`EQ.qc.session.viewer.mode==='technical'&&EQ.qc.session.viewer.isolate==='container.machinery-house'`), 'isolation');
    await click('labels'); await click('work');
    assert(await ev('!EQ.qc.session.viewer.labelsOn&&EQ.qc.session.viewer.work.size===0'), 'toggle controls');
    await click('view-3d'); await click('view-flat');
    assert(await ev('!EQ.qc.session.viewer.labelsOn&&EQ.qc.session.viewer.isolate!==null'), 'mode switch changed display settings');
    await click('reset'); await b.wait(300);
    assert(await ev(`EQ.qc.session.viewer.camera.isOrthographicCamera&&EQ.qc.session.viewer.labelsOn&&!EQ.route.query.part&&!EQ.qc.session.viewer.isolate`), 'Reset lost Flat');
  });
  await step('06 equipment-specific identity, direct URL and refresh', async () => {
    await go('02', 'view=flat&mode=technical&part=pp-q02-007&panel=technical');
    assert(await ev(`EQ.qc.session.viewer.camera.isOrthographicCamera&&document.querySelector('#tabpanel').textContent.includes('pp-q02-007')&&!document.querySelector('#tabpanel').textContent.includes('pp-q01-007')`), 'equipment isolation');
    await b.send('Page.reload'); await waitReady();
    assert(await ev(`EQ.route.query.part==='pp-q02-007'&&EQ.route.query.view==='flat'`), 'reload');
    await go('01', 'view=flat&part=pp-q02-007');
    assert(await ev(`document.querySelector('main').textContent.includes('does not belong')&&!EQ.qc.session.viewer.selected.size`), 'cross-equipment part accepted');
  });
  await step('07 legacy P03 route resolves exact semantic key into shared page', async () => {
    await b.goto(base + 'qc/?eq=eq-qc-demo-02&part=pp-q02-049&view=side&panel=technical'); await waitReady(); await b.wait(500);
    assert(await ev(`location.hash.includes('/eq/equipment/eq-qc-demo-02')&&EQ.route.query.view==='flat'&&EQ.pos(EQ.route.query.part).equipmentId==='eq-qc-demo-02'&&!EQ.route.query.pkey`), 'legacy route');
    await click('ti-mi-q02-02');
    assert(await ev(`EQ.route.query.main==='mi-q02-02'&&!EQ.route.query.part`), 'legacy part stuck');
  });
  await step('08 phone, landscape and keyboard switch', async () => {
    await b.viewport(390, 844); await go('01', 'view=flat');
    assert(await ev('document.scrollingElement.scrollWidth<=innerWidth'), 'phone horizontal overflow');
    await b.screenshot(out + '/flat-phone.png', { fullPage: true });
    await ev(`document.querySelector('[data-fk="view-3d"]').focus()`); await b.key('Enter'); await b.wait(300);
    assert(await ev(`document.querySelector('[data-fk="view-3d"]').getAttribute('aria-pressed')==='true'&&EQ.qc.session.viewer.camera.isPerspectiveCamera`), 'keyboard activation');
    await b.viewport(844, 390); await b.wait(300);
    assert(await ev('document.scrollingElement.scrollWidth<=innerWidth'), 'landscape overflow');
  });
  await step('09 context loss recovery and lifecycle disposal', async () => {
    await ev(`EQ.qc.session.viewer.renderer.getContext().getExtension('WEBGL_lose_context').loseContext()`); await b.wait(300);
    assert(await ev(`document.querySelector('.qc-notice').textContent.includes('Graphics context lost')&&!!document.querySelector('[role=tree]')&&!!document.querySelector('#tabpanel')`), 'context fallback');
    await b.click('.qc-notice button'); await waitReady();
    await ev(`window.oldViewer=EQ.qc.session.viewer;EQ.nav('/eq/fleet',{})`); await b.wait(300);
    assert(await ev('oldViewer._disposed&&!EQ.qc.session&&!document.querySelector("canvas")'), 'viewer leak on exit');
  });
  await step('10 actual model load failure preserves records and retry succeeds', async () => {
    await b.send('Network.enable'); await b.send('Network.setBlockedURLs', { urls: ['*scene.glb'] });
    await b.viewport(1600, 1100); await b.goto(base + '#/eq/equipment/eq-qc-demo-01'); await b.wait(1600);
    assert(await ev(`document.querySelector('.qc-notice')?.textContent.includes('could not be loaded')&&!!document.querySelector('[role=tree]')`), 'load fallback');
    await b.send('Network.setBlockedURLs', { urls: [] }); await b.click('.qc-notice button'); await waitReady();
    b.clearEvents(); await click('view-flat'); await b.wait(400);
    assert(!b.errors().length, 'browser error: ' + b.errors().join(';'));
  });
} finally { await b.close(); }
const noGpu = await launch({ port: 9387, gpu: 'none' });
try {
  await noGpu.goto(base + '#/eq/equipment/eq-qc-demo-01?view=flat'); await noGpu.wait(1500);
  const ok = await noGpu.eval(`document.querySelector('.qc-notice')?.textContent.includes('WebGL is unavailable')&&!!document.querySelector('[role=tree]')&&!!document.querySelector('#tabpanel')&&document.querySelectorAll('canvas').length===0`);
  results.push({ id: '11 actual WebGL unavailable keeps tree and information panels', pass: !!ok });
  console.log((ok ? 'PASS' : 'FAIL') + ' 11 actual WebGL unavailable');
} finally { await noGpu.close(); }
fs.writeFileSync(out + '/viewer-checks.json', JSON.stringify({ base, results }, null, 2));
console.log(results.filter(r => r.pass).length + '/' + results.length + ' PASS');
process.exitCode = results.every(r => r.pass) ? 0 : 1;
