// C73 local browser checks and inspection views for the user-confirmed busbar/cabin relationship.
import fs from 'node:fs';
import {launch} from '../p03/cdp.mjs';
const out='docs/evidence/U1/busbar-c73', key='trolley.cable-system.main', b=await launch({port:9398}),results=[];
const ev=s=>b.eval(s),check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
try {
  await b.viewport(1600,1000);
  await b.goto('http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&motion=off');
  for(let i=0;i<120;i++){if(await ev('!!window.EQ?.qc?.session?.ready'))break;await b.wait(150);}
  let r=await ev('({missing:EQ.qc.session.viewer.missing,checksum:EQ.qc.session.viewer.checksumVerified,revision:EQ.qc.session.viewer.manifest.revision})');
  check('Revision 11 loads with verified checksum and no missing geometry',r.revision===11&&r.checksum&&!r.missing.length,r);
  // 023 remains a reference hotspot; the existing synthetic QC fixture does not instantiate this sub-mechanism.
  // Verify its semantic hit in the same viewer below without changing fixture applicability in a geometry repair.
  await ev(`(async()=>{const {QcViewer}=await import('/qc/js/viewer.mjs');const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:10000;background:#e8edf1';document.body.append(host);const v=window.__c73v=new QcViewer(host,{reducedMotion:true,preserveDrawingBuffer:true,onPick:hit=>{window.__c73pick=hit;v.setSelection([hit.key],{focus:false});}});await v.load('/models/cict-j526a-sts-scene/1/scene.glb',EQ.qc.session.viewer.manifest);v.setLabels(false);v.setMode('technical');v.objByKey.get('gantry.quay.reference').visible=false;})()`);
  await b.wait(350);
  for(const [name,pos,target,fov]of [
    ['01-cabin-connection',[61.5,47.8,-8.5],[65.4,49.7,-1.6],42],
    ['02-busbar-under-boom',[40,30,-72],[37,51,0],54],
    ['03-old-festoon-removed',[-22,46,-20],[-20,50,-3],40]
  ]){await ev(`(()=>{const v=__c73v;v.persp.position.set(${pos});v.controls.target.set(${target});v.persp.fov=${fov};v.persp.updateProjectionMatrix();v.controls.update();v._renderNow();})()`);await b.wait(200);await b.screenshot(out+'/'+name+'.png');}
  r=await ev(`(()=>{const v=__c73v;return ['overall','technical'].map(mode=>{v.setMode(mode);return{mode,visible:!!v.boundsOf(['${key}'])};});})()`);
  check('Busbar connection remains visible in both viewing modes',r.every(x=>x.visible),r);
  const click=await ev(`(()=>{const v=__c73v;v.persp.position.set(65.5,48.8,-9);v.controls.target.set(65.5,49.9,-2);v.controls.update();v._renderNow();const p=v.persp.position.clone().set(65.5,50.05,-3.15).project(v.camera),r=v.renderer.domElement.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};})()`);
  await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:click.x,y:click.y,button:'left',clickCount:1});
  await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:click.x,y:click.y,button:'left',clickCount:1});await b.wait(200);
  r=await ev('window.__c73pick');check('Actual contact-shoe mouse pick resolves to the retained identity',r?.key===key,r);
  const errors=b.errors();check('No browser or resource errors',!errors.length,errors);
} finally {fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,results},null,2)+'\n');await b.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
