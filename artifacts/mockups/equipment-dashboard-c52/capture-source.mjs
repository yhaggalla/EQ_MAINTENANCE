import fs from 'node:fs';
import { launch } from '../../../tools/p03/cdp.mjs';
const out = new URL('./', import.meta.url);
const b = await launch({ port: 9396, gpu: 'swiftshader' });
try {
  await b.viewport(1760, 1000);
  await b.goto('http://127.0.0.1:5312/?role=eqTeam#/eq/equipment/eq-qc-demo-02?panel=special&view=flat');
  for (let i = 0; i < 45; i++) {
    if (await b.eval(`!!document.querySelector('.qc-canvas') && document.querySelectorAll('.qc-label').length>5`)) break;
    await b.wait(300);
  }
  await b.wait(500);
  const source = await b.eval(`(()=>{const stage=document.querySelector('.unified-qc-stage'),r=stage.getBoundingClientRect();return {bounds:{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1},labels:[...stage.querySelectorAll('.qc-label')].map(e=>{const p=e.getBoundingClientRect();return {text:e.textContent.trim(),x:(p.left-r.left)/r.width,y:(p.top-r.top)/r.height}})}})()`);
  // Camera/label UI only in this disposable browser; application source and business data are unchanged.
  await b.click('[data-fk="labels"]');
  await b.eval(`EQ.eqUI.showWork=false;EQ.rerender()`); await b.wait(250);
  const capture = await b.send('Page.captureScreenshot', { format: 'png', clip: source.bounds });
  fs.writeFileSync(new URL('crane-source.png', out), Buffer.from(capture.data, 'base64'));
  fs.writeFileSync(new URL('source-capture.json', out), JSON.stringify(source, null, 2) + '\n');
  console.log(JSON.stringify({ width: source.bounds.width, height: source.bounds.height, labels: source.labels }));
} finally { await b.close(); }
