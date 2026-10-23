// U1-C35: save spare-part conditions from the selected crane view and see the result immediately.
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/spare-panel-c35';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9390 }), results = [];
const ev = x => b.eval(x);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const step = async (name, fn) => { try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); } catch(e) { results.push({ name, pass: false, error: e.message }); console.log('FAIL ' + name + ': ' + e.message); } };
const click = async sel => { await b.click(sel); await b.wait(350); };
const save = () => click('dialog button[type="submit"]');
const select = async (id, view = '3d', extra = {}) => { await ev(`EQ.nav('/eq/equipment/eq-qc-demo-01',${JSON.stringify({ view, part: id, panel: 'spareParts', ...extra })})`); await b.wait(600); };
const shot = async name => { await ev('scrollTo(0,0)'); await b.screenshot(out+'/'+name+'.png', { fullPage: true }); };
let frame, free, date;
try {
  await b.viewport(1670,950); await b.goto(base+'?role=eqTeam#/eq/equipment/eq-qc-demo-01?view=3d&panel=spareParts');
  for(let n=0;n<100;n++){if(await ev('!!window.EQ?.qc?.session?.ready'))break;await b.wait(150);}
  frame = await ev(`EQ.positionsOf('eq-qc-demo-01').find(p=>p.key==='spreader.frame').id`);
  await select(frame);
  const update = '[data-fk="update-spare-'+frame+'"]';
  await step('Unscoped Add still opens an empty equipment chooser',async()=>{
    await ev('EQ.dlg.addSpare()');await b.wait(150);
    assert(await ev(`!!document.querySelector('#as-eq')&&!document.querySelector('#as-eq').value&&document.querySelector('dialog h2').textContent==='Add spare part'`),'unscoped Add failed');
    await b.key('Escape');
  });
  await step('Registered selected part offers Update condition instead of empty Add',async()=>{
    assert(await ev(`EQ.spares.isMajor(${JSON.stringify(frame)})&&!EQ.spares.row(${JSON.stringify(frame)}).condition&&!!document.querySelector(${JSON.stringify(update)})&&!document.querySelector('#tabpanel [data-fk="add-spare"]')`),'incorrect action');
    await click(update);
    assert(await ev(`document.querySelector('dialog h2').textContent.includes('Spreader frame')&&!document.querySelector('#as-pos')&&!!document.querySelector('#sp-desc')`),'wrong form/target');
  });
  await step('Invalid condition leaves the record unchanged and shows validation',async()=>{
    const before=await ev('JSON.stringify(EQ.state.D.spare)+JSON.stringify(EQ.state.D.events)'); await save();
    assert(await ev(`!!document.querySelector('#sp-desc[aria-invalid="true"]')`),'no inline validation');
    assert(before===await ev('JSON.stringify(EQ.state.D.spare)+JSON.stringify(EQ.state.D.events)'),'invalid submission mutated data');
  });
  await step('Saving Original refreshes the selected 3D card immediately without navigation',async()=>{
    await ev('window.c35Renderer=EQ.qc.session.viewer.renderer;window.c35Hash=location.hash');
    await b.setValue('#sp-desc','Spreader baseline C35');await b.setValue('#sp-brand','C35 Original Brand');await b.setValue('#sp-model','C35-MODEL');await save();
    assert(await ev(`(()=>{const r=EQ.spares.row(${JSON.stringify(frame)}),p=document.querySelector('#tabpanel').textContent;return !document.querySelector('dialog[open]')&&r.condition==='original'&&r.brand==='C35 Original Brand'&&p.includes('Original')&&p.includes('C35 Original Brand')&&p.includes('1 registered')&&!p.includes('Not recorded')&&EQ.spares.history(r.posId).length===1&&EQ.spares.history(r.posId)[0].source==='registerOriginal'&&location.hash===c35Hash&&EQ.qc.session.viewer.renderer===c35Renderer})()`),'saved data/panel or selection not refreshed');
    await shot('selected-original');
  });
  await step('Saving replacement refreshes brand, date, prediction and history on the same part',async()=>{
    date=await ev('EQ.shiftDay(EQ.todayColombo(),-30)'); await click(update);
    await b.setValue('#sp-desc','Spreader replacement C35');await b.setValue('#sp-brand','C35 Replacement Brand');await b.setValue('#sp-date',date);await save();
    assert(await ev(`(()=>{const r=EQ.spares.row(${JSON.stringify(frame)}),h=EQ.spares.history(r.posId),p=document.querySelector('#tabpanel').textContent;return r.condition==='replaced'&&r.replacedOn===${JSON.stringify(date)}&&r.brand==='C35 Replacement Brand'&&p.includes('Replaced')&&p.includes('C35 Replacement Brand')&&p.includes(EQ.fmtDate(r.replacedOn))&&p.includes(EQ.fmtDate(r.predicted))&&h.length===2&&h.some(x=>x.source==='registerOriginal')&&h[0].source==='registerReplacement'&&EQ.route.query.part===r.posId&&EQ.qc.session.viewer.renderer===c35Renderer})()`),'replacement missing in selected view');
    await shot('selected-replacement');
  });
  await step('Cancel and legacy Add entry preserve or update the exact registered target',async()=>{
    const before=await ev('JSON.stringify(EQ.state.D.spare)+JSON.stringify(EQ.state.D.events)');
    await ev(`EQ.dlg.addSpare({equipmentId:'eq-qc-demo-01',part:${JSON.stringify(frame)}})`);await b.wait(150);
    assert(await ev(`document.querySelector('dialog h2').textContent.startsWith('Update condition - Spreader frame')`),'legacy action still opens empty Add');
    await b.setValue('#sp-brand','CANCELLED');await b.key('Escape');
    assert(before===await ev('JSON.stringify(EQ.state.D.spare)+JSON.stringify(EQ.state.D.events)'),'cancel changed data');
  });
  await step('Flat mode and Admin update the existing record without duplicate registration',async()=>{
    await ev(`EQ.state.role='admin';EQ.access.refreshSession('C35');`);await select(frame,'flat');await click(update);await click('#sp-act-amend');
    await b.setValue('#sp-brand','C35 Admin Amendment');await b.setValue('#sp-reason','Correct brand');await save();
    assert(await ev(`EQ.qc.session.viewer.camera.isOrthographicCamera&&document.querySelector('#tabpanel').textContent.includes('C35 Admin Amendment')&&EQ.spares.rows('eq-qc-demo-01',{level:'part',id:${JSON.stringify(frame)}}).length===1&&EQ.spares.history(${JSON.stringify(frame)}).length===3`),'Flat/admin refresh or duplicate row');
  });
  await step('New selected part can still be added and appears immediately inside its isolated area',async()=>{
    free=await ev(`EQ.qc.containerPositions(EQ.eq('eq-qc-demo-01'),'machinery-house').find(p=>!EQ.spares.isMajor(p.id)).id`);
    await select(free,'flat',{area:'machinery-house'});await click('[data-fk="add-spare"]');
    assert(await ev(`document.querySelector('#as-pos').value===${JSON.stringify(free)}`),'new part prefill lost');
    const type=await ev('EQ.spares.types().find(t=>t.active).id');await b.setValue('#as-type',type);await click('#as-cond-original');await b.setValue('#as-desc','New part C35');await b.setValue('#as-brand','C35 Added Brand');await save();
    assert(await ev(`EQ.spares.isMajor(${JSON.stringify(free)})&&document.querySelector('#tabpanel').textContent.includes('C35 Added Brand')&&!!document.querySelector('[data-fk="update-spare-${free}"]')&&!document.querySelector('#tabpanel [data-fk="add-spare"]')&&EQ.route.query.part===${JSON.stringify(free)}&&EQ.qc.session.viewer.isolate==='container.machinery-house'&&EQ.spares.history(${JSON.stringify(free)})[0].source==='registerAdd'`),'new selected part failed to refresh');
    await shot('selected-new-part');
  });
  await step('Area summaries and Jobs show the same newly saved spare record',async()=>{
    await ev(`EQ.nav('/eq/equipment/eq-qc-demo-01',{view:'flat',area:'machinery-house',container:'machinery-house',panel:'spareParts'})`);await b.wait(450);
    assert(await ev(`document.querySelector('#tabpanel').textContent.includes('C35 Added Brand')&&!!document.querySelector('[data-fk="update-spare-${free}"]')`),'area summary stale');
    await ev(`EQ.nav('/eq/jobs/spare-parts',{equipment:'eq-qc-demo-01',part:${JSON.stringify(free)}})`);await b.wait(350);
    assert(await ev(`document.querySelector('.spare-table tr[data-pos="${free}"]').textContent.includes('C35 Added Brand')`),'Jobs register stale');
  });
  await step('Management has no Add/Update action and direct mutation remains refused',async()=>{
    await ev(`EQ.state.role='management';EQ.access.refreshSession('C35');`);await select(frame);
    const result=await ev(`(()=>{const before=JSON.stringify(EQ.state.D.events),r=EQ.spares.recordOriginal(${JSON.stringify(free)},{desc:'forbidden'});return {ok:r.status===403&&JSON.stringify(EQ.state.D.events)===before,button:!!document.querySelector('#tabpanel [data-fk^="update-spare-"]')||!!document.querySelector('#tabpanel [data-fk="add-spare"]')}})()`);
    assert(result.ok&&!result.button,'read-only permission widened');
  });
  await step('No browser errors',async()=>assert(!b.errors().length,b.errors().join('\n')));
}finally{fs.writeFileSync(out+'/checks.json',JSON.stringify({base,browser:b.browser,results},null,2));await b.close();}
console.log(`${results.filter(r=>r.pass).length}/${results.length} PASS`);if(results.some(r=>!r.pass))process.exitCode=1;
