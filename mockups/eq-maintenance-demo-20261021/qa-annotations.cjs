const {createRequire}=require('module'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const req=createRequire('C:/Users/yasas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/probe.js');
const {chromium}=req('playwright'),out=path.join(__dirname,'qa','annotation-fix');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:940}});await ctx.setOffline(true);
 const page=await ctx.newPage(),errors=[],external=[],results=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 const click=s=>page.locator(s).first().click(),info=()=>page.evaluate(()=>Mockup.getModelInfo()),pause=()=>page.waitForTimeout(650);
 const capture=name=>page.screenshot({path:path.join(out,name),fullPage:true});
 async function test(name,fn){await fn();results.push({name,status:'PASS'});console.log('PASS',name);}
 try{
  await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href+'#equipment/QC02');await page.waitForFunction(()=>Mockup.getModelInfo()?.triangles>0);
  await test('Annotation 1: revised drawing-based crane renders, with side and end views',async()=>{
   const m=await info();assert.equal(m.revision,'drawing-correction-2');assert(m.triangles>10000);await capture('01-revised-perspective.png');
   for(const view of ['side','end']){await page.selectOption('[data-change="camera"]',view);await pause();await capture('02-revised-'+view+'.png');}
  });
  await test('Annotation 2: four eight-wheel travelling units and 800 mm steel wheel scale',async()=>{
   const m=await info();assert.equal(m.gantry.travellingUnits,4);assert.equal(m.gantry.wheelCount,32);assert.equal(m.gantry.wheelDiameter,.8);
   await click('[data-action="select-target"][data-main="04"]');await click('[data-action="select-target"][data-sub="041"]');await click('[data-action="select-target"][data-part="QC02|041|wheel-a"]');await pause();const selected=await info();assert(selected.selectionBounds.size[1]<.9);assert(selected.selectionBounds.size[2]>24);assert((await page.locator('.selection-summary h2').innerText()).includes('Gantry wheel'));
  });
  await test('Annotation 3: Gantry selects lower travelling mechanisms, excluding rails and portal',async()=>{
   await click('[data-action="select-target"][data-main="04"]');await pause();const m=await info();assert.equal(m.selection.main,'04');assert.equal(m.gantry.railsSelectable,false);assert(m.selectionBounds.max[1]<9);assert(m.selectionBounds.size[2]<30);assert(m.selectionBounds.size[0]<36);await capture('03-revised-gantry.png');
  });
  await test('Annotation 4: telescopic spreader and separate headblock have transverse long axes',async()=>{
   await click('[data-action="select-target"][data-main="06"]');await pause();const m=await info(),s=m.spreader;assert(s.bounds.size[2]>12);assert(s.bounds.size[0]<4);assert(s.headblockBounds.size[2]>5.2&&s.headblockBounds.size[2]<5.6);assert(s.headblockBounds.size[0]>2&&s.headblockBounds.size[0]<2.2);assert(s.headblockBounds.min[1]>s.bounds.max[1]);await capture('04-revised-spreader.png');
   await click('[data-action="select-target"][data-sub="062"]');await click('[data-action="select-target"][data-part="QC02|062|headblock"]');assert((await page.locator('.selection-summary h2').innerText()).includes('Headblock'));
  });
  await test('Annotation 5: machinery house remains visible in Overall and Technical whole-crane views',async()=>{
   await click('[data-action="select-all"]');await click('[data-action="mode"][data-mode="technical"]');let m=await info();assert(m.house.roofVisible&&m.house.wallsOpaque&&!m.cutaway);
   await click('[data-action="mode"][data-mode="overall"]');m=await info();assert(m.house.roofVisible&&m.house.wallsOpaque);
   await click('[data-action="select-target"][data-main="15"]');await click('[data-action="select-target"][data-sub="151"]');await click('[data-action="select-target"][data-part="QC02|151|machinery-house"]');await pause();assert((await page.locator('.selection-summary h2').innerText()).includes('Machinery house'));assert((await info()).house.roofVisible);await capture('05-machinery-house.png');
  });
  await test('Internal hoist drill-down opens house; returning to whole equipment restores cladding',async()=>{
   await click('[data-action="select-target"][data-main="01"][data-sub="011"]');await click('[data-action="select-target"][data-part="QC02|011|motor-a"]');await pause();let m=await info();assert(m.technical&&m.cutaway&&!m.house.roofVisible);await capture('06-machinery-cutaway.png');await click('[data-action="select-all"]');m=await info();assert(!m.cutaway&&m.house.roofVisible&&m.house.wallsOpaque);
  });
  await test('Corrected model remains available on phone viewport without horizontal overflow',async()=>{
   await page.setViewportSize({width:390,height:844});await click('[data-action="reset-camera"]');await pause();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert((await info()).triangles>0);await capture('07-revised-mobile.png');
  });
  await test('No uncaught browser errors or external requests from the corrected standalone HTML',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[]);});
  const report={passed:results.length,failed:0,geometryRevision:'drawing-correction-2',browser:'Microsoft Edge, software WebGL',mode:'file:// with network disabled',results,browserErrors:errors,externalRequests:external};fs.writeFileSync(path.join(out,'ANNOTATION_RESULTS.json'),JSON.stringify(report,null,2));console.log('SUMMARY',results.length,'annotation checks passed');
 }catch(error){await capture('annotation-failure.png').catch(()=>{});fs.writeFileSync(path.join(out,'ANNOTATION_RESULTS.json'),JSON.stringify({passed:results.length,failed:1,results,error:error.stack,browserErrors:errors},null,2));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
