const {createRequire}=require('module');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const req=createRequire('C:/Users/yasas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/probe.js');
const {chromium}=req('playwright');
const root=__dirname,out=path.join(root,'qa'),results=[];
const file=pathToFileURL(path.join(root,'index.html')).href;
async function test(name,fn){await fn();results.push({name,status:'PASS'});console.log('PASS',name);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1600,height:1060},acceptDownloads:true});await ctx.setOffline(true);
 const page=await ctx.newPage(),errors=[],warnings=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')warnings.push(m.text());});
 const click=s=>page.locator(s).first().click(),submit=()=>click('#modal button[type="submit"]'),state=()=>page.evaluate(()=>Mockup.getState());
 const close=()=>click('#modal [data-action="close-modal"]');
 try{
  await page.goto(file+'#equipment/QC01');await page.waitForFunction(()=>Mockup.getModelInfo()?.triangles>0);
  await test('3D labels, technical/overall modes and camera presets',async()=>{
   await page.locator('[data-change="labels"]').uncheck();await page.waitForTimeout(100);assert.equal(await page.locator('.model-label:visible').count(),0);
   await page.locator('[data-change="labels"]').check();await page.waitForTimeout(100);assert(await page.locator('.model-label:visible').count()>0);
   await click('[data-action="mode"][data-mode="technical"]');assert((await page.evaluate(()=>Mockup.getModelInfo())).technical);
   await click('[data-action="mode"][data-mode="overall"]');assert(!(await page.evaluate(()=>Mockup.getModelInfo())).technical);
   for(const view of ['end','top','perspective']){await page.selectOption('[data-change="camera"]',view);await page.waitForTimeout(600);const info=await page.evaluate(()=>Mockup.getModelInfo());assert(info.camera.every(Number.isFinite));}
  });
  await test('3D PNG download and full-screen toggle',async()=>{
   const download=page.waitForEvent('download');await click('[data-action="screenshot"]');const d=await download;assert.equal(d.suggestedFilename(),'QC01-demo-view.png');const bytes=fs.readFileSync(await d.path());assert.equal(bytes.subarray(1,4).toString(),'PNG');
   await click('[data-action="fullscreen"]');await page.waitForFunction(()=>!!document.fullscreenElement);await click('[data-action="fullscreen"]');await page.waitForFunction(()=>!document.fullscreenElement);
  });
  let job;
  await test('Work edit updates the existing work order',async()=>{
   await click('[data-action="select-target"][data-main="01"][data-sub="011"]');await click('[data-action="select-target"][data-part="QC01|011|motor-a"]');
   await click('.equipment-head [data-action="new-job"]');await page.selectOption('#modal select[name="kind"]','Replacement');await page.locator('#modal input[name="title"]').fill('Multi-position demo test');await submit();
   job=(await state()).jobs.find(j=>j.title==='Multi-position demo test').id;
   await click(`#detail-panel [data-action="view-job"][data-job="${job}"]`);await click('#modal [data-action="edit-job"]');await page.locator('#modal input[name="title"]').fill('Multi-position demo test revised');await page.selectOption('#modal select[name="priority"]','High');await submit();
   const j=(await state()).jobs.find(j=>j.id===job);assert.equal(j.title,'Multi-position demo test revised');assert.equal(j.priority,'High');
  });
  await test('Multi-position replacements reject duplicates and install two exact positions',async()=>{
   const initial=(await state()).replacements.length;
   await click(`#detail-panel [data-action="view-job"][data-job="${job}"]`);await click('#modal [data-action="complete-job"]');await page.locator('#modal textarea[name="completionNote"]').fill('Two dummy motor positions verified.');
   await click('[data-action="add-line"]');await page.selectOption('#modal select[name="part_1"]','QC01|011|motor-a');await page.locator('#modal input[name="item_1"]').fill('Second demo motor');await submit();assert((await page.locator('#form-error').innerText()).includes('only once'));assert.equal((await state()).replacements.length,initial);
   await page.selectOption('#modal select[name="part_1"]','QC01|011|motor-b');await page.locator('#modal input[name="serial_0"]').fill('TEST-MOTOR-A');await page.locator('#modal input[name="serial_1"]').fill('TEST-MOTOR-B');await submit();const s=await state();assert.equal(s.replacements.length,initial+2);assert.equal(s.parts.find(p=>p.id==='QC01|011|motor-b').serial,'TEST-MOTOR-B');
  });
  await test('Admin correction keeps prior record and physical replacement history',async()=>{
   const before=await state();await click(`#detail-panel [data-action="view-job"][data-job="${job}"]`);await click('#modal [data-action="correct-job"]');await page.locator('#modal input[name="title"]').fill('Corrected dummy maintenance record');await page.locator('#modal textarea[name="reason"]').fill('Correct wording only.');await submit();const s=await state(),j=s.jobs.find(j=>j.id===job);assert.equal(j.corrections.length,1);assert.equal(j.title,'Corrected dummy maintenance record');assert.equal(s.replacements.length,before.replacements.length);assert.equal(s.parts.find(p=>p.id==='QC01|011|motor-a').serial,'TEST-MOTOR-A');
  });
  await test('Maintenance/Breakdown reason validation prevents an incomplete status update',async()=>{
   await click('.equipment-head [data-action="status"]');await page.selectOption('#status-value','Breakdown');await submit();assert(await page.locator('#modal').evaluate(e=>e.open));assert.equal((await state()).equipment.find(e=>e.id==='QC01').status,'Maintenance');await page.locator('#status-reason').fill('Synthetic verification reason.');await submit();assert.equal((await state()).equipment.find(e=>e.id==='QC01').status,'Breakdown');
  });
  await test('Reserved main code 10 remains unassigned; duplicate equipment rejected',async()=>{
   await click('.nav-link[data-view="admin"]');await page.waitForFunction(()=>Mockup.getUI().view==='admin');await click('[data-action="add-equipment"]');await page.locator('#modal input[name="id"]').fill('QC01');await page.locator('#modal input[name="location"]').fill('Dummy berth');await submit();assert((await page.locator('#form-error').innerText()).includes('already exists'));await close();
   await click('[data-action="admin-tab"][data-tab="mechanisms"]');await click('[data-action="add-main"]');await page.locator('#modal input[name="code"]').fill('10');await page.locator('#modal input[name="name"]').fill('Must remain unassigned');await submit();assert((await page.locator('#form-error').innerText()).includes('remains unassigned'));await close();assert(!(await state()).catalogue.mainMechanisms.some(m=>m.code==='10'));
  });
  await test('No uncaught errors or invalid form pattern errors',async()=>{assert.deepEqual(errors,[]);assert(!warnings.some(w=>w.includes('pattern')||w.includes('regular expression')));});
  const fallbackBrowser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-webgl']});
  try{const fallbackPage=await fallbackBrowser.newPage();await test('No-WebGL fallback preserves mechanism and work navigation',async()=>{await fallbackPage.goto(file+'#equipment/QC01');await fallbackPage.waitForFunction(()=>window.Mockup);assert((await fallbackPage.locator('#model-surface').innerText()).includes('3D is unavailable'));await fallbackPage.locator('[data-action="select-target"][data-main="01"][data-sub="011"]').click();assert((await fallbackPage.locator('.selection-summary h2').innerText()).includes('Hoist'));await fallbackPage.locator('.equipment-head [data-action="new-job"]').click();assert(await fallbackPage.locator('#modal input[name="title"]').isVisible());await fallbackPage.screenshot({path:path.join(out,'08-no-webgl-fallback.png'),fullPage:true});});}finally{await fallbackBrowser.close();}
  fs.writeFileSync(path.join(out,'ADDITIONAL_RESULTS.json'),JSON.stringify({passed:results.length,failed:0,results,browserErrors:errors,consoleErrors:warnings},null,2));console.log('SUMMARY',results.length,'additional checks passed');
 }catch(e){await page.screenshot({path:path.join(out,'additional-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'ADDITIONAL_RESULTS.json'),JSON.stringify({passed:results.length,failed:1,results,error:e.stack,browserErrors:errors,consoleErrors:warnings},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
