// U1-C34: isolated-area records, compact controls and the reference 3D home view.
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/viewer-refinements-c34';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9388 }), results = [];
const ev = x => b.eval(x);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const step = async (name, fn) => { try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); } catch (e) { results.push({ name, pass: false, error: e.message }); console.log('FAIL ' + name + ': ' + e.message); } };
const click = async key => { await b.click('[data-fk="' + key + '"]'); await b.wait(400); };
const ready = async () => { for (let n = 0; n < 80; n++) { if (await ev('!!window.EQ?.qc?.session?.ready')) return; await b.wait(150); } throw Error('viewer readiness'); };
const open = async q => { await b.goto(base + '?role=management#/eq/equipment/eq-qc-demo-01?' + q); await ready(); await b.wait(700); };
const settle = async () => { await ev(`new Promise(resolve=>{const tick=()=>{if(EQ.qc?.session?.viewer?._tween)requestAnimationFrame(tick);else requestAnimationFrame(()=>requestAnimationFrame(resolve));};tick();})`); };
const screenshot = async name => { await settle(); await b.eval('scrollTo(0,0)'); await b.screenshot(out + '/' + name + '.png', { fullPage: true }); };
try {
  await b.viewport(1670, 950); await open('');
  await step('Initial view remains Flat', async () => assert(await ev('EQ.qc.session.viewer.camera.isOrthographicCamera'), 'wrong initial camera'));
  await step('Desktop controls occupy one row, area label is inline, all controls visible', async () => {
    assert(await ev(`(()=>{const bar=document.querySelector('.vp-bar'),r=bar.getBoundingClientRect();return [...bar.children].every(e=>{const b=e.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom&&b.left>=r.left&&b.right<=r.right})&&r.height<65&&bar.scrollWidth<=bar.clientWidth+1&&Math.abs(document.querySelector('.qc-area span').getBoundingClientRect().y-document.querySelector('.qc-area select').getBoundingClientRect().y)<20})()`), 'wrapped or hidden desktop controls');
    await screenshot('flat-desktop');
  });
  const areas = await ev('EQ.qc.manifest.nodes.filter(n=>n.kind==="container").map(n=>n.key.slice(10))');
  for (const area of areas) await step('All four tabs work within ' + area, async () => {
    await b.setValue('[data-fk="isolate-area"]', area); await b.wait(400);
    const ids = await ev('EQ.qc.containerPositions(EQ.qc.session.eq,EQ.route.query.container).map(p=>p.id)');
    for (const tab of ['maintenance', 'special', 'spareParts', 'technical']) {
      await click('tab-' + tab);
      assert(await ev(`document.querySelector('#tabpanel').getAttribute('aria-labelledby')==='tab-${tab}'&&document.querySelector('[data-fk="tab-${tab}"]').getAttribute('aria-selected')==='true'&&EQ.qc.session.viewer.isolate===${JSON.stringify('container.' + area)}`), 'tab selection/isolation');
      const text = await ev('document.querySelector("#tabpanel").textContent');
      assert(tab === 'maintenance' ? text.includes("Today's ZMMS daily jobs") : tab === 'special' ? text.includes('Special jobs') : tab === 'spareParts' ? text.includes('Current condition') : text.includes(ids.length + ' included part positions'), 'wrong tab body ' + tab);
      if (tab === 'spareParts') assert(await ev(`Array.from(document.querySelectorAll('#tabpanel [data-pos]')).every(e=>${JSON.stringify(ids)}.includes(e.dataset.pos))`), 'spare outside area');
    }
  });
  await step('Area scope excludes unrelated targets and deduplicates multiple replacement lines', async () => {
    await b.setValue('[data-fk="isolate-area"]', 'machinery-house'); await b.wait(300);
    const result = await ev(`(()=>{
      const eq=EQ.qc.session.eq,inside=EQ.qc.containerPositions(eq,'machinery-house'),outside=EQ.positionsOf(eq.id).find(p=>p.state==='active'&&!inside.some(i=>i.id===p.id));
      const template=EQ.jobsOf(eq.id,true)[0],make=(id,p,extra={})=>({...structuredClone(template),id,number:id,equipmentId:eq.id,level:'part',positionId:p.id,mainId:p.mainId,subId:p.subId,kind:'repair',title:id,workStatus:'pending',isCancelled:false,showOnDashboard:true,lines:[],...extra});
      const a=make('C34-IN',inside[0]),z=make('C34-OUT',outside),hidden=make('C34-HIDDEN',inside[0],{showOnDashboard:false}),multi=make('C34-MULTI',outside,{kind:'replacement',lines:inside.slice(0,2).map(p=>({positionId:p.id,state:'committed',item:{desc:'MUST NOT LEAK',serial:'MUST NOT LEAK'}}))}),done=make('C34-DONE',inside[0],{workStatus:'completed',completedOn:EQ.todayColombo(),completionNote:'MUST NOT LEAK',corrections:[{secret:'MUST NOT LEAK'}]});
      EQ.state.D.jobs.push(a,z,hidden,multi,done);
      const r=EQ.currentSpecial(eq.id,{level:'area',id:'machinery-house'}),rows=r.jobs.filter(x=>x.job.id.startsWith('C34-'));
      return {ids:rows.map(x=>x.job.id),matches:rows.find(x=>x.job.id==='C34-MULTI')?.matchingLines.length,safe:!JSON.stringify(r).includes('MUST NOT LEAK'),invalid:EQ.currentSpecial(eq.id,{level:'area',id:'missing'}).jobs.length};
    })()`);
    assert(JSON.stringify(result.ids.sort()) === JSON.stringify(['C34-DONE', 'C34-IN', 'C34-MULTI']), 'area leaked or lost jobs');
    assert(result.matches === 2 && result.safe && result.invalid === 0, 'deduplication, safe projection or invalid area');
    await click('tab-special');
    assert(await ev(`document.querySelector('#tabpanel').textContent.includes('C34-IN')&&!document.querySelector('#tabpanel').textContent.includes('C34-OUT')`), 'area filter not used by panel');
  });
  await step('Area selection opens a part and preserves isolation while switching tabs', async () => {
    await click('tab-technical'); await b.click('#tabpanel a'); await b.wait(400);
    assert(await ev(`!!EQ.route.query.part&&!EQ.route.query.container&&EQ.qc.session.viewer.isolate==='container.machinery-house'`), 'part did not retain area');
    await click('tab-spareParts'); assert(await ev(`EQ.route.query.part&&document.querySelector('[data-fk="scope-title"]').textContent===EQ.pos(EQ.route.query.part).name`), 'part scope lost');
  });
  await open('view=3d');
  await step('3D home uses reference direction and frames the complete crane', async () => {
    assert(await ev(`(()=>{const v=EQ.qc.session.viewer,d=v.camera.position.clone().sub(v.controls.target).normalize(),want=v.camera.position.clone().set(.55,.22,.8).normalize();return d.distanceTo(want)<.001&&v.camera.isPerspectiveCamera&&v.controls.enableRotate})()`), 'wrong 3D home');
    assert(await ev(`(()=>{const v=EQ.qc.session.viewer;v.camera.updateMatrixWorld();let x=0,y=0;for(const n of EQ.qc.manifest.nodes.filter(n=>n.kind==='position'))for(const a of [n.bounds.min[0],n.bounds.max[0]])for(const b of [n.bounds.min[1],n.bounds.max[1]])for(const c of [n.bounds.min[2],n.bounds.max[2]]){const p=v.camera.position.clone().set(a,b,c).project(v.camera);x=Math.max(x,Math.abs(p.x));y=Math.max(y,Math.abs(p.y));}return x<=.95&&y<=.95&&Math.max(x,y)>.8})()`), 'cropped or undersized home framing');
    await screenshot('3d-desktop');
    // Unlabelled view makes the user-reference angle/placement easy to compare.
    await click('labels'); await screenshot('3d-reference'); await click('labels');
  });
  await step('3D Reset restores the reference after zoom and area isolation', async () => {
    const before=await ev('({p:EQ.qc.session.viewer.camera.position.toArray(),t:EQ.qc.session.viewer.controls.target.toArray()})');
    await click('zoom-in'); await b.setValue('[data-fk="isolate-area"]','back-reach'); await b.wait(750); await click('reset'); await b.wait(800);
    const after=await ev('({p:EQ.qc.session.viewer.camera.position.toArray(),t:EQ.qc.session.viewer.controls.target.toArray(),view:EQ.route.query.view,iso:EQ.qc.session.viewer.isolate})');
    assert(before.p.every((v,i)=>Math.abs(v-after.p[i])<.001)&&before.t.every((v,i)=>Math.abs(v-after.t[i])<.001)&&after.view==='3d'&&!after.iso,'3D Reset changed camera or home placement');
    await b.setValue('[data-fk="isolate-area"]','back-reach'); await click('tab-technical'); await b.wait(650); await screenshot('isolated-back-reach');
    assert(await ev(`(()=>{const v=EQ.qc.session.viewer;v.camera.updateMatrixWorld();const c=v.boundsOf([v.isolate]).getCenter(v.camera.position.clone()).project(v.camera);return Math.abs(c.x)<.01&&Math.abs(c.y)<.01&&v.renderer.info.render.triangles>0})()`), 'isolated geometry is outside the view');
  });
  await step('Static water and quay retain the 5 m rail-to-sea drop', async () => {
    await click('reset'); await b.wait(700);
    assert(await ev(`(()=>{const s=EQ.qc.session,c=s.context,y=c.getObjectByName('Yard'),w=c.getObjectByName('Sea');return c.visible&&y.position.y+y.geometry.parameters.height/2===0&&w.position.y+w.geometry.parameters.height/2===-5&&w.material[2].isShaderMaterial&&!!c.getObjectByName('Quay coping')&&!s.viewer.meshes.includes(w)&&!('time' in w.material[2].uniforms)})()`), 'water level/material/picking or continuous animation');
  });
  await step('Flat Reset and keyboard tabs remain usable', async () => {
    await click('view-flat'); await click('zoom-in'); await click('reset');
    assert(await ev(`EQ.qc.session.viewer.camera.isOrthographicCamera&&!EQ.qc.session.viewer.controls.enableRotate&&EQ.qc.session.viewer.camera.zoom===1`), 'Flat Reset');
    await b.setValue('[data-fk="isolate-area"]','back-reach'); await click('tab-maintenance');
    await ev(`document.querySelector('[data-fk="tab-maintenance"]').focus()`); await b.key('ArrowRight'); await b.wait(450);
    assert(await ev(`EQ.route.query.panel==='special'&&EQ.route.query.area==='back-reach'&&document.activeElement.dataset.fk==='tab-special'`), 'keyboard tab/isolation');
  });
  await step('Phone and landscape controls and area dropdown stay within the page', async () => {
    for (const [w,h] of [[390,844],[844,390]]) {
      await b.viewport(w,h); await b.wait(400); await settle();
      assert(await ev('document.scrollingElement.scrollWidth<=innerWidth'), 'page overflow');
      assert(await ev(`(()=>{const v=EQ.qc.session.viewer,b=v.boundsOf([v.isolate]),o=v.ortho,size=b.getSize(v.camera.position.clone());return size.x/((o.right-o.left)/o.zoom)<=.71&&size.y/((o.top-o.bottom)/o.zoom)<=.71})()`), 'isolated geometry clipped after resize');
    }
    await b.viewport(390,844); await screenshot('phone');
  });
  await step('No browser errors', async () => assert(!b.errors().length, b.errors().join('\n')));
} finally { fs.writeFileSync(out+'/checks.json', JSON.stringify({base,browser:b.browser,results},null,2)); await b.close(); }
console.log(`${results.filter(r=>r.pass).length}/${results.length} PASS`);
if(results.some(r=>!r.pass)) process.exitCode=1;
