// Local browser / picking regression and review captures for the C71 back-reach repair.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launch} from '../p03/cdp.mjs';
const out='docs/evidence/U1/backreach-c71',base=process.argv[2]||'http://127.0.0.1:5312/index.html';
const b=await launch({port:9398}),results=[];
const ev=s=>b.eval(s),check=(name,ok,detail)=>{results.push({name,pass:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);};
const ready=async()=>{for(let i=0;i<120;i++){if(await ev('!!window.EQ?.qc?.session?.ready'))return;await b.wait(150);}throw Error('Viewer did not become ready');};
const open=async(eq='eq-qc-demo-01',extra='')=>{await b.goto(base+'#/eq/equipment/'+eq+'?view=3d&mode=technical&area=back-reach&container=back-reach&motion=off'+extra);await ready();await b.wait(500);};
const shot=async(name)=>{await b.wait(300);await b.screenshot(out+'/'+name+'.png');};
try {
  await b.viewport(1600,1000);await open();
  let r=await ev('({ready:EQ.qc.session.ready,missing:EQ.qc.session.viewer.missing,checksum:EQ.qc.session.viewer.checksumVerified})');
  check('Viewer loads and verifies checksum with no missing nodes',r.ready&&r.checksum&&!r.missing.length,r);
  await shot('01-area-ui');
  const ids={};
  for(let i=1;i<=4;i++){
    const key='reeving.tls-cylinder.'+i;
    const p=await ev(`(()=>{const v=EQ.qc.session.viewer;v.setLabels(false);v.setSelection([],{focus:false});v._tween=null;v.useOrtho('top',{cx:-60,cy:0,w:8,h:8});v._renderNow();return v.projectCenter('${key}');})()`);
    assert(p,key+' projection');
    await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
    await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});await b.wait(400);
    r=await ev(`({selected:[...EQ.qc.session.viewer.selected],part:EQ.route.query.part,position:EQ.positionsOf('eq-qc-demo-01').find(p=>p.key==='${key}').id})`);
    check('Actual mesh click selects TLS cylinder '+i,r.selected.includes(key)&&r.part===r.position,r);ids[key]=r.position;
  }
  await open('eq-qc-demo-02','&pkey=reeving.tls-cylinder.1');
  r=await ev(`({selected:[...EQ.qc.session.viewer.selected],id:EQ.positionsOf('eq-qc-demo-02').find(p=>p.key==='reeving.tls-cylinder.1').id})`);
  check('QC02 retains a different equipment-specific cylinder identity',r.id!==ids['reeving.tls-cylinder.1']&&r.selected.includes('reeving.tls-cylinder.1'),r);
  await open('eq-qc-demo-01','&pkey=reeving.tls-cylinder.1');await shot('02-cylinder-selected');
  // Independent full-canvas instance of the SAME viewer/model for aligned evidence (no page resize callbacks).
  await ev(`(async()=>{const {QcViewer}=await import('/qc/js/viewer.mjs');const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:10000;background:#e8edf1';document.body.append(host);const v=window.__c71v=new QcViewer(host,{reducedMotion:true,preserveDrawingBuffer:true});await v.load('/models/cict-j526a-sts-scene/1/scene.glb',EQ.qc.session.viewer.manifest);v.setLabels(false);v.objByKey.get('gantry.quay.reference').visible=false;})()`);await b.wait(600);
  await ev(`(()=>{const v=window.__c71v;v.setMode('technical');v.persp.position.set(-67,59,-8);v.controls.target.set(-60,54,0);v.persp.fov=43;v.persp.updateProjectionMatrix();v.controls.update();v._renderNow();})()`);await shot('03-backreach-context');
  await ev(`(()=>{const v=window.__c71v;v.setIsolate('container.back-reach');v.setSelection([],{focus:false});v.useOrtho('side',{cx:-59.2,cy:52.4,w:14,h:8.75});v._renderNow();})()`);await shot('04-backreach-side');
  await ev(`(()=>{const v=window.__c71v;v.useOrtho('end-ls',{cx:0,cy:53.4,w:13,h:8.125});v._renderNow();})()`);await shot('05-backreach-end');
  await ev(`(()=>{const v=window.__c71v;v.useOrtho('top',{cx:-59.4,cy:0,w:14,h:8.75});v._renderNow();})()`);await shot('06-backreach-plan');
  // TLS-only view exposes the drawing mechanism for direct side-view comparison.
  await ev(`(()=>{const v=window.__c71v;for(const m of v.meshes)m.visible=/^reeving\.(anti-snag-tls\.device|tls-cylinders\.instanced|tls-sheaves\.instanced|sheave\.girder-tail)$/.test(m.userData.carrierName||v._keyOf(m)||'');v.useOrtho('side',{cx:-60.4,cy:54.25,w:8,h:5});v._renderNow();})()`);await shot('07-tls-side-detail');
  await open('eq-qc-demo-01','&mode=overall');
  r=await ev(`(()=>{const v=EQ.qc.session.viewer;v.setMode('overall');return ['reeving.tls-cylinder.1','reeving.hoist-sheave.back-reach.4','reeving.tls-pump.motor'].map(k=>({k,visible:!!v.boundsOf([k])}));})()`);
  check('Corrected parts remain visible in Overall mode',r.every(x=>x.visible),r);
  const errors=b.errors();check('No browser script or resource errors',!errors.length,errors);
} finally {fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length,results},null,2)+'\n');await b.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
