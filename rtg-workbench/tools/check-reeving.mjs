import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launch} from './browser-runtime.mjs';

const dir='evidence/rope-review';fs.mkdirSync(dir,{recursive:true});
const browser=await launch(),page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5314/');await page.waitForFunction(()=>window.__rtg?.ready);
const report=await page.evaluate(async()=>{
  const T=await import('three'),v=__rtg.adapter.viewer,recipes=await fetch('/model/1/geometry-parameters.json').then(r=>r.json());
  const key=o=>{for(let a=o;a;a=a.parent)if(a.userData.nodeKey)return a.userData.nodeKey;return'';};
  const spans=v.motionObjects.filter(o=>o.userData.motionRole==='rope-span'),wraps=v.motionObjects.filter(o=>o.userData.motionRole==='rope-wrap'),sockets=v.motionObjects.filter(o=>o.userData.motionRole==='rope-socket');
  const m={spans:spans.length,wraps:wraps.length,sockets:sockets.length,maxSocketJoinErrorM:0,maxWrapJoinErrorM:0,maxTangentDot:0,maxOutOfPlaneM:0,maxCableJoinErrorM:0,poses:[],clashes:[],minimumCableDrumClearanceM:Infinity};
  const unitY=new T.Vector3(0,1,0),keyed=new Set();
  const forbidden=v.meshes.filter(o=>{const k=key(o);return !k.startsWith('reeving.rope.')&&!k.startsWith('headblock.rope-socket.')&&!k.startsWith('hoist.spreader-cable.')&&k!=='hoist.drum.main'&&!v.byKey.get(k)?.kind?.includes('hotspot');});
  // A centreline plus a four-point radial envelope against the actual exported triangle surfaces.
  const scan=(label,a,b,targets,radius=.014)=>{
    const route=label.match(/^reeving\.rope\.route-(\d+)/)?.[1];if(route)targets=targets.filter(o=>![`reeving.sheave.fall-${route}`,`reeving.sheave.guide-${route}`].includes(key(o)));
    const d=b.clone().sub(a),L=d.length();if(L<.001)return;d.normalize();const u=new T.Vector3().crossVectors(d,Math.abs(d.y)<.8?unitY:new T.Vector3(1,0,0)).normalize(),w=new T.Vector3().crossVectors(d,u);
    for(const off of[new T.Vector3(),u.clone().multiplyScalar(radius),u.clone().multiplyScalar(-radius),w.clone().multiplyScalar(radius),w.clone().multiplyScalar(-radius)]){
      const ray=new T.Raycaster(a.clone().add(off).addScaledVector(d,.001),d,.001,L-.002);
      for(const hit of ray.intersectObjects(targets,false)){const k=key(hit.object),id=label+'|'+k;if(!keyed.has(id)){keyed.add(id);m.clashes.push({route:label,part:k,point:hit.point.toArray().map(n=>+n.toFixed(4))});}}
    }
  };
  for(const h of[1,5,12,18,21.2])for(const x of[-9.25,0,9.25]){
    v.setMotion({x,h});
    for(const o of spans){
      const id=key(o),a=o.localToWorld(new T.Vector3(0,-.5,0)),b=o.localToWorld(new T.Vector3(0,.5,0)),c=new T.Vector3(...o.userData.sheaveCentre).add(new T.Vector3(x,0,0));
      const socket=sockets.find(s=>key(s).endsWith('.'+id.split('-').at(-1))),joint=socket.localToWorld(new T.Vector3(0,socket.userData.socketLength,0));m.maxSocketJoinErrorM=Math.max(m.maxSocketJoinErrorM,b.distanceTo(joint));
      const wrap=wraps.find(w=>key(w)===id),pa=wrap.geometry.attributes.position,centre=new T.Vector3();for(let j=0;j<6;j++)centre.add(new T.Vector3().fromBufferAttribute(pa,j*25+24));centre.divideScalar(6);wrap.localToWorld(centre);m.maxWrapJoinErrorM=Math.max(m.maxWrapJoinErrorM,a.distanceTo(centre));
      m.maxTangentDot=Math.max(m.maxTangentDot,Math.abs(a.clone().sub(c).normalize().dot(b.clone().sub(a).normalize())));
      const normal=new T.Vector3().crossVectors(new T.Vector3(...o.userData.planeOut),unitY);m.maxOutOfPlaneM=Math.max(m.maxOutOfPlaneM,Math.abs(b.clone().sub(c).dot(normal)));
      scan(id+' fall',a,b,forbidden);
    }
    const cable=v.motionObjects.find(o=>o.userData.motionRole==='drop-cable'),end=cable.localToWorld(new T.Vector3(0,.5,0)),basketEye=v.objects.get('hoist.spreader-cable.basket').localToWorld(new T.Vector3(0,2.65,0));m.maxCableJoinErrorM=Math.max(m.maxCableJoinErrorM,end.distanceTo(basketEye));
    scan('spreader hanging cable',cable.localToWorld(new T.Vector3(0,-.5,0)),end,forbidden,.022);
    m.poses.push({x,h,drumRotation:v.objects.get('hoist.drum.main').rotation.x,trolleyWheelRotation:v.objects.get('trolley.wheel.left.front').rotation.z});
  }
  v.setMotion({x:0,h:5});
  for(const r of recipes.filter(r=>r.primitive==='dynamic-rope-span')){const pts=r.parameters.leadPoints;for(let i=0;i<pts.length-1;i++)scan(r.nodeKey+' lead',new T.Vector3(...pts[i]).multiplyScalar(.001),new T.Vector3(...pts[i+1]).multiplyScalar(.001),forbidden);}
  const fixed=recipes.find(r=>r.primitive==='fixed-spreader-cable'),curve=new T.CatmullRomCurve3(fixed.parameters.path.map(p=>new T.Vector3(...p).multiplyScalar(.001))),points=curve.getPoints(192);
  for(let i=0;i<points.length-1;i++)scan('spreader fixed supply',points[i],points[i+1],forbidden,.022);
  for(const p of points)if(Math.abs(p.x)<1.5)m.minimumCableDrumClearanceM=Math.min(m.minimumCableDrumClearanceM,Math.hypot(p.y-28.87,p.z)-.628-.022);
  return{...m,assetSha256:__rtg.manifest.asset.sha256,guideEstimates:recipes.filter(r=>r.primitive==='dynamic-rope-span'&&r.parameters.guide).map(r=>({node:r.nodeKey,...r.parameters.guide})),scope:'15 lift/travel poses; centreline and four radial rays vs exported geometry. Intentional own rope/assigned sheave/socket/feed contact surfaces excluded; other sheaves included. Not a solid interference or certified rigging analysis.'};
});
await page.addStyleTag({content:'#viewer{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:99!important}#viewer .view-note,#viewer .stats,#viewer .rtg-labels{display:none!important}'});
await page.evaluate(()=>{const v=__rtg.adapter.viewer;v.setLabels([]);v.setSelection([]);v.setOverlays([]);v.setIsolate('container.trolley');v.setMotion({x:0,h:19});v.grid.visible=false;});
for(const[name,target,position]of[['trolley-overview',[0,27.5,0],[10,38,-13]],['trolley-underside',[0,26,0],[-7,22,-10]],['trolley-top',[0,28,0],[0,43,.01]],['basket',[0,21,0],[-4,24,-4]],['cable-feed',[0,27.8,-.5],[-3,26,-5]],['deck-sheaves',[0,28,-1.6],[2,32,-6]]]){
  await page.evaluate(({target,position})=>{const v=__rtg.adapter.viewer;v.setView('perspective');v.controls.target.set(...target);v.camera.position.set(...position);v.camera.lookAt(v.controls.target);v.requestRender();},{target,position});await page.waitForTimeout(200);await page.screenshot({path:`${dir}/${name}.png`});
}
await browser.close();report.errors=errors;fs.writeFileSync(`${dir}/checks.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
assert.equal(report.spans,8);assert.equal(report.wraps,8);assert.equal(report.sockets,8);
for(const name of['maxSocketJoinErrorM','maxWrapJoinErrorM','maxTangentDot','maxOutOfPlaneM','maxCableJoinErrorM'])assert(report[name]<1e-5,name);
assert.equal(report.clashes.length,0,'Rope/cable interference found');assert(report.minimumCableDrumClearanceM>.2);assert.equal(errors.length,0);
assert(report.poses.some(p=>Math.abs(p.drumRotation)>1));assert(report.poses.some(p=>Math.abs(p.trolleyWheelRotation)>1));
