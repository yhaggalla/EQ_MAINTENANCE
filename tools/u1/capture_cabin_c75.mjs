import fs from 'node:fs';
import {launch} from '../p03/cdp.mjs';
const out='docs/evidence/U1/cabin-c75', b=await launch({port:9401}), results=[];
const ev=s=>b.eval(s),check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
try {
  await b.viewport(1600,1100);
  await b.goto('http://127.0.0.1:5312/index.html#/eq/equipment/eq-qc-demo-01?view=3d&mode=technical&motion=off');
  for(let i=0;i<120;i++){if(await ev('!!window.EQ?.qc?.session?.ready'))break;await b.wait(150);}
  let r=await ev('({missing:EQ.qc.session.viewer.missing,checksum:EQ.qc.session.viewer.checksumVerified,revision:EQ.qc.session.viewer.manifest.revision})');
  check('Revision 13 loads with verified checksum and no missing geometry',r.revision===13&&r.checksum&&!r.missing.length,r);
  await ev(`(async()=>{const {QcViewer}=await import('/qc/js/viewer.mjs');const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:10000;background:#e8edf1';document.body.append(host);const v=window.__c74v=new QcViewer(host,{reducedMotion:true,preserveDrawingBuffer:true,onPick:hit=>{window.__c74pick=hit;v.setSelection([hit.key],{focus:false});}});await v.load('/models/cict-j526a-sts-scene/1/scene.glb',EQ.qc.session.viewer.manifest);v.setLabels(false);v.setMode('technical');v.objByKey.get('gantry.quay.reference').visible=false;})()`);
  await b.wait(350);
  for(const [name,pos,target,fov]of [
    ['01-elevator-side-door',[70,49.5,-7],[66,49.2,-.6],44],
    ['02-home-access',[-40,51,-17],[-30.8,48.2,-8],47],
    ['03-home-access-plan',[-31,62,-8],[-31,47.845,-8],44]
  ]){await ev(`(()=>{const v=__c74v;v.persp.position.set(${pos});v.controls.target.set(${target});v.persp.fov=${fov};v.persp.updateProjectionMatrix();v.controls.update();v._renderNow();})()`);await b.wait(200);await b.screenshot(out+'/'+name+'.png');}
  // Real hit tests from inside the cab avoid glass occlusion and exercise the existing semantic identities.
  for(const [key,point,camera]of [['cabin.operator.seat',[66.3,48.35,0],[67.13,49.15,0]],['cabin.operator.consoles',[66.5,48.6,.57],[67.13,49.15,0]],['cabin.monitors.2',[67.0,49.92,0],[66.6,49.15,0]]]) {
    const p=await ev(`(()=>{const v=__c74v;v.controls.minDistance=.05;v.persp.position.set(${camera});v.controls.target.set(${point});v.persp.fov=70;v.persp.updateProjectionMatrix();v.controls.update();v._renderNow();const p=v.persp.position.clone().set(${point}).project(v.camera),r=v.renderer.domElement.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};})()`);
    await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
    await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});await b.wait(100);
    r=await ev('window.__c74pick');check('Physical pick retains '+key,r?.key===key,r);await ev('__c74v.setSelection([],{focus:false})');
  }
  r=await ev(`(()=>{const v=__c74v;return ['overall','technical'].map(mode=>{v.setMode(mode);return{mode,visible:['cabin.operator.main','cabin.operator.seat','cabin.operator.consoles','cabin.monitors.1','trolley.cable-system.main'].every(k=>!!v.boundsOf([k]))};});})()`);
  check('Cabin, instruments and opposite busbar visible in both modes',r.every(x=>x.visible),r);
  const errors=b.errors();check('No browser or resource errors',!errors.length,errors);
} finally {fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,results},null,2)+'\n');await b.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
