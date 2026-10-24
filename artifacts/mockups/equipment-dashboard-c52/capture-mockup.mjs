import fs from 'node:fs';
import { launch } from '../../../tools/p03/cdp.mjs';
const out = new URL('./', import.meta.url), b = await launch({ port: 9397, gpu: 'none' });
try {
  await b.viewport(1680, 960); await b.goto('http://127.0.0.1:5317/');
  const metrics = await b.eval(`(()=>{const r=document.querySelector('.details').getBoundingClientRect();return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,height:document.documentElement.scrollHeight,cards:document.querySelectorAll('.job-card').length,details:{x:r.x,y:r.y,width:r.width,height:r.height,scale:1}}})()`);
  if (metrics.pageWidth > metrics.viewport) throw Error('Desktop overflow');
  await b.screenshot(new URL('mockup-desktop.png', out).pathname.replace(/^\/([A-Za-z]:)/,'$1'), { fullPage: true });
  const panel = await b.send('Page.captureScreenshot', { format: 'png', clip: metrics.details, captureBeyondViewport: true });
  fs.writeFileSync(new URL('mockup-details.png', out), Buffer.from(panel.data, 'base64'));
  await b.click('[data-filter="current"]');
  const filterWorks = await b.eval(`document.querySelectorAll('.job-card').length===1&&document.querySelector('.job-title').textContent==='Hoist brake adjustment'`);
  await b.click('[data-filter="all"]'); await b.setValue('#job-search','trolley');
  const searchWorks = await b.eval(`document.querySelectorAll('.job-card').length===1&&document.querySelector('.job-title').textContent.includes('trolley wheel')`);
  await b.setValue('#job-search',''); await b.click('#toggle-labels');
  const labelsWork = await b.eval(`[...document.querySelectorAll('.model-label')].every(e=>e.style.visibility==='hidden')`);
  fs.writeFileSync(new URL('preview-checks.json',out),JSON.stringify({metrics,filterWorks,searchWorks,labelsWork,errors:b.errors()},null,2)+'\n');
  console.log(JSON.stringify({metrics,filterWorks,searchWorks,labelsWork,errors:b.errors()}));
} finally { await b.close(); }
