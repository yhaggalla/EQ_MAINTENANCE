// Local model/UI evidence: corrected geometry, actual picking, retained optional-part records.
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const out='docs/evidence/U1/floating-parts-c72', b=await launch({port:9398}), results=[];
const ev=s=>b.eval(s), check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
const open=async(extra='')=>{await b.goto('http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&motion=off'+extra);for(let i=0;i<120;i++){if(await ev('!!window.EQ?.qc?.session?.ready')){await b.wait(500);return;}await b.wait(150);}throw Error('Viewer timeout');};
const shot=async(name)=>{await b.wait(250);await b.screenshot(out+'/'+name+'.png');};
try {
  await b.viewport(1600,1000); await open();
  let r=await ev('({missing:EQ.qc.session.viewer.missing,checksum:EQ.qc.session.viewer.checksumVerified,revision:EQ.qc.session.viewer.manifest.revision})');
  check('Revision 10 loads with verified checksum and no missing nodes',r.revision===10&&r.checksum&&!r.missing.length,r);
  r=await ev(`(()=>{const v=EQ.qc.session.viewer;return ['overall','technical'].map(mode=>{v.setMode(mode);return {mode,hidden:['spreader.over-height-adapter','spreader.hook-beam','spreader.hook-beam.hook'].every(k=>!v.boundsOf([k])),fitted:['trolley.hoist-sheave.1-i','headblock.hoist-sheave.1','gantry.buffers.1','trolley.spreader-cable','reeving.tls-cylinder.1'].every(k=>!!v.boundsOf([k]))};});})()`);
  check('Optional attachments hidden and fitted assemblies visible in both modes',r.every(x=>x.hidden&&x.fitted),r);
  await open('&pkey=spreader.over-height-adapter');
  r=await ev(`({selected:[...EQ.qc.session.viewer.selected],notice:document.querySelector('.qc-notice')?.textContent,part:EQ.route.query.part})`);
  check('Optional attachment retains selection and explains its absent geometry',r.selected.includes('spreader.over-height-adapter')&&/not fitted/.test(r.notice)&&!!r.part,r);await shot('01-optional-attachment-record');
  await open('&area=headblock-spreader&container=headblock-spreader');
  await ev(`(async()=>{const {QcViewer}=await import('/qc/js/viewer.mjs');const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:10000;background:#e8edf1';document.body.append(host);const v=window.__c72v=new QcViewer(host,{reducedMotion:true,preserveDrawingBuffer:true,onPick:hit=>{window.__c72picked=hit;v.setSelection([hit.key],{focus:false});}});await v.load('/models/cict-j526a-sts-scene/1/scene.glb',EQ.qc.session.viewer.manifest);v.setLabels(false);v.setMode('technical');v.objByKey.get('gantry.quay.reference').visible=false;})()`);
  await b.wait(300);
  const key='headblock.hoist-sheave.4'; // side view faces +Z: this is the near-side landside sheave
  // Pick on the rim, above the shaft/guard, so the sheave's own instance is the raycast target.
  const rim=await ev(`(()=>{const v=__c72v;v.setIsolate('container.headblock-spreader');v.setLabels(false);v.setSelection([],{focus:false});v._tween=null;v.useOrtho('side',{cx:70,cy:47.1,w:4,h:2.5});v._renderNow();const p=v.boundsOf(['${key}']).getCenter(v.persp.position.clone());p.y+=.32;p.project(v.camera);const r=v.renderer.domElement.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};})()`);
  await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:rim.x,y:rim.y,button:'left',clickCount:1});
  await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rim.x,y:rim.y,button:'left',clickCount:1});await b.wait(400);
  r=await ev('({selected:[...__c72v.selected],hit:window.__c72picked})');
  check('Actual sheave rim click resolves to its individual component',r.selected.includes(key)&&r.hit?.key===key,r);
  await ev(`(()=>{const v=__c72v;v.setIsolate(null);v.setSelection([],{focus:false});v.useOrtho(null);})()`);
  for(const [name,pos,target,fov] of [
    ['02-trolley-headblock',[82,55,-18],[70,49.9,0],40],
    ['03-trolley-above',[79,63,-14],[71,52,0],40],
    ['04-gantry-end',[20,11,-27],[0,5,-6],43],
    ['05-cable-guide',[8,7,-18],[.6,4,-12],40],
    ['06-boom-trip-wire',[77,55,-12],[70.5,51,-4],42],
    ['07-tls-preserved',[-67,59,-8],[-60,54,0],43]
  ]){await ev(`(()=>{const v=__c72v;v.persp.position.set(${pos});v.controls.target.set(${target});v.persp.fov=${fov};v.persp.updateProjectionMatrix();v.controls.update();v._renderNow();})()`);await shot(name);}
  const errors=b.errors();check('No browser or resource errors',!errors.length,errors);
} finally {fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,results},null,2)+'\n');await b.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
