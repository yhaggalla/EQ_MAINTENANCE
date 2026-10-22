const {createRequire}=require('module');
const path=require('path'),{pathToFileURL}=require('url');
const req=createRequire('C:/Users/yasas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/probe.js');
const {chromium}=req('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1060}});await context.setOffline(true);
  const page=await context.newPage(),base=pathToFileURL(path.join(__dirname,'index.html')).href,out=path.join(__dirname,'qa');
  await page.goto(base+'#jobs');await page.waitForFunction(()=>window.Mockup);await page.waitForTimeout(650);await page.screenshot({path:path.join(out,'04-work-orders-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.goto(base+'#fleet');await page.waitForFunction(()=>window.Mockup);await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'05-fleet-mobile.png'),fullPage:true});
  await page.goto(base+'#equipment/QC01');await page.waitForFunction(()=>Mockup.getModelInfo()?.triangles>0);await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'06-qc-explorer-mobile.png'),fullPage:true});
  await page.locator('.equipment-head [data-action="new-job"]').click();await page.screenshot({path:path.join(out,'07-mobile-work-form.png'),fullPage:true});
  console.log('Captured clean work-order and mobile screenshots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
