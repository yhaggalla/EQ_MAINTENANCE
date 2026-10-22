import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import{validateManifest,readGlbJson,sha256}from'./contract.mjs';
const UP=new T.Vector3(0,1,0);
export class RtgViewer {
  constructor(host,options={}){
    this.host=host;this.options=options;this.mode='overall';this.hidden=new Set();this.selected=new Set();this.overlays=new Map();this.isolated=null;this.playing=false;this.motion={x:0,h:5};this.disposed=false;this.contextLost=false;this.listeners=[];this.frameCount=0;this.restoreAttempts=0;
    this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor('#edf1f3');this.renderer.domElement.setAttribute('aria-hidden','true');host.append(this.renderer.domElement);
    this.labels=document.createElement('div');this.labels.className='rtg-labels';this.labels.setAttribute('aria-hidden','true');host.append(this.labels);
    this.scene=new T.Scene();this.scene.add(new T.HemisphereLight(0xffffff,0x64727c,2));const sun=new T.DirectionalLight(0xffffff,2.5);sun.position.set(-20,45,25);this.scene.add(sun);const fill=new T.DirectionalLight(0xd8e7f1,.9);fill.position.set(30,20,-25);this.scene.add(fill);
    this.grid=new T.GridHelper(60,30,0xc1cbd1,0xd5dde1);this.grid.position.y=-.03;this.scene.add(this.grid);
    this.perspective=new T.PerspectiveCamera(35,1,.1,500);this.orthographic=new T.OrthographicCamera(-20,20,20,-20,.1,500);this.camera=this.perspective;
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;this.controls.maxDistance=160;this.controls.minDistance=.3;this.controls.screenSpacePanning=true;
    this.on(this.controls,'change',()=>this.requestRender());
    this.on(this.renderer.domElement,'webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.pause();cancelAnimationFrame(this.raf);this.raf=0;this.options.onContextLost?.();});
    this.on(this.renderer.domElement,'webglcontextrestored',()=>{if(this.restoreAttempts++===0){this.contextLost=false;this.requestRender();this.options.onContextRestored?.();}});
    this.on(this.renderer.domElement,'pointerdown',e=>{this.pointer={x:e.clientX,y:e.clientY};});
    this.on(this.renderer.domElement,'pointerup',e=>{if(this.pointer&&Math.hypot(e.clientX-this.pointer.x,e.clientY-this.pointer.y)<5)this.pick(e);this.pointer=null;});
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(host);this.resize();
  }
  on(target,name,fn){target.addEventListener(name,fn);this.listeners.push([target,name,fn]);}
  async load(glbUrl,manifest,{loader,signal}={}){
    this.byKey=validateManifest(manifest);this.manifest=manifest;
    const start=performance.now();const buf=loader?await loader(glbUrl,{signal,kind:'model'}):await fetch(glbUrl,{credentials:'same-origin',signal}).then(r=>{if(!r.ok)throw Error('Model HTTP '+r.status);return r.arrayBuffer();});
    if(this.disposed||signal?.aborted)throw new DOMException('Cancelled','AbortError');
    const glb=readGlbJson(buf);if(buf.byteLength!==manifest.asset.bytes||await sha256(buf)!==manifest.asset.sha256)throw Error('Model checksum mismatch');
    const named=new Map();for(const n of glb.nodes||[])named.set(n.name,(named.get(n.name)||0)+1);
    for(const n of manifest.nodes)for(const name of n.gltfNodeNames)if(named.get(name)!==1)throw Error('GLB node-name mapping invalid: '+name);
    const keyed=(glb.nodes||[]).filter(n=>n.extras?.nodeKey);if(keyed.length!==manifest.nodes.length||new Set(keyed.map(n=>n.extras.nodeKey)).size!==keyed.length||keyed.some(n=>!this.byKey.has(n.extras.nodeKey)))throw Error('GLB semantic metadata mismatch');
    const asset=await new GLTFLoader().parseAsync(buf,'');if(this.disposed||signal?.aborted){this.disposeGraph(asset.scene);throw new DOMException('Cancelled','AbortError');}
    this.unload();this.root=asset.scene;this.scene.add(this.root);this.objects=new Map();this.meshes=[];this.motionObjects=[];this.materialCopies=new Set();
    this.root.traverse(o=>{if(o.userData.nodeKey)this.objects.set(o.userData.nodeKey,o);if(o.isMesh){o.userData.baseMaterial=o.material;this.meshes.push(o);}if(o.userData.motionRole)this.motionObjects.push(o);});
    for(const n of manifest.nodes)if(!this.objects.has(n.key))throw Error('Imported metadata missing: '+n.key);
    this.motion={x:manifest.motion.trolley.home,h:manifest.motion.hoist.home};this.applyMotion();this.setMode(this.mode);this.resetView();this.loadMs=performance.now()-start;this.requestRender();return{checksumVerified:true,loadMs:this.loadMs};
  }
  resize(){const{width,height}=this.host.getBoundingClientRect();this.width=Math.max(1,width);this.height=Math.max(1,height);this.renderer.setSize(this.width,this.height);this.perspective.aspect=this.width/this.height;this.perspective.updateProjectionMatrix();if(this.orthoHeight)this.setOrthoSize(this.orthoHeight);this.requestRender();}
  setOrthoSize(h){this.orthoHeight=h;const w=h*this.width/this.height;Object.assign(this.orthographic,{left:-w/2,right:w/2,top:h/2,bottom:-h/2});this.orthographic.updateProjectionMatrix();}
  requestRender(){if(this.disposed||this.contextLost||this.raf)return;this.raf=requestAnimationFrame(t=>{this.raf=0;this.render(t);});}
  render(t=performance.now()){
    if(this.disposed||this.contextLost)return;
    if(this.playing){const dt=Math.min(.05,Math.max(0,(t-(this.lastTime??t))/1000));this.lastTime=t;this.phase+=dt;const c=this.manifest.motion;this.motion.x=Math.sin(this.phase*.16)*(c.trolley.max-.15);this.motion.h=5+(1-Math.cos(this.phase*.12))*6;this.applyMotion();if(t-(this.lastNotify||0)>150){this.options.onMotion?.({...this.motion,playing:true});this.lastNotify=t;}}
    this.root?.updateMatrixWorld(true);this.updateSelectionBox();this.updateLabels();this.renderer.render(this.scene,this.camera);this.frameCount++;this.lastMetrics={triangles:this.renderer.info.render.triangles,drawCalls:this.renderer.info.render.calls,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures};this.options.onFrame?.(this.lastMetrics);if(this.playing)this.requestRender();
  }
  keyOf(o){for(let p=o;p;p=p.parent)if(p.userData.nodeKey)return p.userData.nodeKey;return null;}
  effectivelyVisible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
  setMode(mode){this.mode=mode==='technical'?'technical':'overall';this.applyVisibility();this.applyMaterials();this.requestRender();}
  descendant(key,ancestor){for(let p=this.byKey?.get(key);p;p=this.byKey.get(p.parentKey))if(p.key===ancestor)return true;return false;}
  applyVisibility(){if(!this.root)return;for(const[k,o]of this.objects){const n=this.byKey.get(k);const visibleMode=n.modes.includes(this.mode);const allowed=!this.isolated||this.descendant(k,this.isolated)||this.descendant(this.isolated,k);o.visible=visibleMode&&allowed&&!this.hidden.has(k);} }
  cloneMaterial(base,type){base.userData.copies??={};if(!base.userData.copies[type]){const m=base.clone();m.userData={};if(type==='ghost'){m.transparent=true;m.opacity=.14;m.depthWrite=false;}if(type==='selected'){m.color.lerp(new T.Color('#1386cd'),.55);m.emissive.set('#096ba5');m.emissiveIntensity=.3;}if(type==='work'){m.color.lerp(new T.Color('#b36c04'),.55);m.emissive.set('#7d4500');m.emissiveIntensity=.18;}base.userData.copies[type]=m;this.materialCopies.add(m);}return base.userData.copies[type];}
  applyMaterials(){if(!this.root)return;for(const o of this.meshes){const key=this.keyOf(o),n=this.byKey.get(key),base=o.userData.baseMaterial;const selected=[...this.selected].some(k=>key===k||this.descendant(key,k));const ghost=(this.mode==='technical'||this.transparent)&&n?.enclosure;const work=this.overlays.has(key);o.material=ghost?this.cloneMaterial(base,'ghost'):selected?this.cloneMaterial(base,'selected'):work?this.cloneMaterial(base,'work'):base;}}
  setSelection(keys,{focus=false}={}){this.selected=new Set(keys||[]);this.applyMaterials();if(focus)this.fitKeys([...this.selected]);this.requestRender();}
  setLabels(items){this.labelItems=items||[];this.labels.replaceChildren();for(const item of this.labelItems){const el=document.createElement('span');el.className='rtg-label';el.textContent=item.text;el.dataset.key=item.key;this.labels.append(el);}this.requestRender();}
  updateLabels(){this.labelRects=[];if(!this.objects)return;const boxes=[];[...(this.labelItems||[])].slice(0,24).forEach((item,i)=>{const el=this.labels.children[i],o=this.objects.get(item.key);if(!el)return;el.style.display='none';if(!o||!this.effectivelyVisible(o))return;const box=this.bounds([item.key]);if(box.isEmpty())return;const p=box.getCenter(new T.Vector3()).project(this.camera);if(p.z<-1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1)return;const x=(p.x+1)*this.width/2,y=(1-p.y)*this.height/2,w=Math.min(220,Math.max(80,item.text.length*6.2+16)),h=25;const rect={x:x-w/2,y:y-h/2,w,h,item};if(rect.x<2||rect.y<2||rect.x+w>this.width-2||rect.y+h>this.height-2||boxes.some(b=>rect.x<b.x+b.w+5&&rect.x+w+5>b.x&&rect.y<b.y+b.h+5&&rect.y+h+5>b.y))return;boxes.push(rect);this.labelRects.push(rect);el.style.cssText=`display:block;left:${rect.x}px;top:${rect.y}px;max-width:${w}px`;});}
  pick(e){if(!this.root)return;const r=this.renderer.domElement.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,label=this.labelRects?.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(label){this.options.onPick?.({key:label.item.key,kind:this.byKey.get(label.item.key)?.kind,source:'label'});return;}
    const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/r.width*2-1,-y/r.height*2+1),this.camera);const allowed=this.meshes.filter(o=>{const n=this.byKey.get(this.keyOf(o));return this.effectivelyVisible(o)&&n?.pickable&&!(n.enclosure&&(this.mode==='technical'||this.transparent));});const hit=ray.intersectObjects(allowed,false)[0];if(hit){const key=this.keyOf(hit.object);this.options.onPick?.({key,kind:this.byKey.get(key)?.kind,source:'pointer'});}else this.options.onBackground?.();}
  bounds(keys){const b=new T.Box3();this.root?.updateMatrixWorld(true);for(const key of keys){const o=this.objects?.get(key);if(!o||!this.effectivelyVisible(o))continue;o.traverse(p=>{if(p.isMesh&&this.effectivelyVisible(p)){p.geometry.computeBoundingBox();b.union(p.geometry.boundingBox.clone().applyMatrix4(p.matrixWorld));}});}return b;}
  fitKeys(keys){const box=this.bounds(keys);if(box.isEmpty()){this.options.onHint?.('Selection has no visible geometry');return false;}this.fitBox(box);return true;}
  fitBox(box){const centre=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()).max(new T.Vector3(.5,.5,.5));let dir=this.camera.position.clone().sub(this.controls.target).normalize();if(!dir.lengthSq())dir.set(1,.6,1).normalize();const radius=size.length()/2;
    if(this.camera.isPerspectiveCamera){const vf=this.perspective.fov*Math.PI/180,hf=2*Math.atan(Math.tan(vf/2)*this.perspective.aspect),distance=radius/Math.sin(Math.min(vf,hf)/2)*1.12;this.camera.position.copy(centre).addScaledVector(dir,Math.min(180,Math.max(1,distance)));}
    else {const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(dir,new T.Vector3(),this.camera.up)).invert();const pts=[];for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])pts.push(new T.Vector3(x,y,z).sub(centre).applyQuaternion(q));const projected=new T.Box3().setFromPoints(pts).getSize(new T.Vector3());this.setOrthoSize(Math.max(projected.y,projected.x/(this.width/this.height),.5)*1.15);this.camera.position.copy(centre).addScaledVector(dir,100);}
    this.controls.target.copy(centre);this.camera.lookAt(centre);this.controls.update();this.requestRender();
  }
  setView(view){const dirs={front:[0,0,1],rear:[0,0,-1],left:[-1,0,0],right:[1,0,0],top:[0,1,0]};this.view=view;
    this.camera=view==='perspective'?this.perspective:this.orthographic;this.camera.up.set(0,1,0);if(view==='top')this.camera.up.set(0,0,-1);this.controls.object=this.camera;this.controls.enableRotate=view==='perspective';this.camera.position.copy(this.controls.target).add(new T.Vector3(...(dirs[view]||[1,.65,1])).normalize().multiplyScalar(100));this.fitKeys(['container.crane']);}
  resetView(){this.camera=this.perspective;this.view='perspective';this.controls.object=this.camera;this.controls.enableRotate=true;this.camera.up.set(0,1,0);this.controls.target.set(0,14,0);this.camera.position.set(42,32,47);this.fitKeys(['container.crane']);}
  setIsolate(key){this.isolated=key||null;this.applyVisibility();if(key)this.fitKeys([key]);this.requestRender();}
  setHidden(keys,hidden=true){keys.forEach(k=>hidden?this.hidden.add(k):this.hidden.delete(k));this.applyVisibility();this.requestRender();}
  showAll(){this.hidden.clear();this.isolated=null;this.applyVisibility();this.requestRender();}
  setTransparency(value){this.transparent=!!value;this.applyMaterials();this.requestRender();}
  setOverlays(entries){this.overlays=new Map(entries||[]);this.applyMaterials();this.requestRender();}
  updateSelectionBox(){if(this.boxHelper){this.scene.remove(this.boxHelper);this.boxHelper.geometry.dispose();this.boxHelper.material.dispose();this.boxHelper=null;}if(!this.selected.size)return;const b=this.bounds([...this.selected]);if(b.isEmpty())return;this.boxHelper=new T.Box3Helper(b,0x0584c7);this.scene.add(this.boxHelper);}
  setMotion({x=this.motion.x,h=this.motion.h}){if(!this.manifest)return;const m=this.manifest.motion;this.motion={x:T.MathUtils.clamp(x,m.trolley.min,m.trolley.max),h:T.MathUtils.clamp(h,m.hoist.min,m.hoist.max)};this.applyMotion();this.options.onMotion?.({...this.motion,playing:this.playing});this.requestRender();}
  applyMotion(){for(const o of this.motionObjects||[]){const role=o.userData.motionRole;if(role==='trolley')o.position.x=this.motion.x;if(role==='suspended')o.position.y=this.motion.h;if(role==='trolley-wheel')o.rotation.z=-this.motion.x/o.userData.radius;if(role==='drum')o.rotation.x=(this.motion.h-5)/.6;if(role==='rope-span'){const a=new T.Vector3(...o.userData.start),b=new T.Vector3(...o.userData.endOffset);b.y+=this.motion.h;const d=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(UP,d.clone().normalize());o.scale.set(1,d.length(),1);}}
    this.root?.updateMatrixWorld(true);
  }
  play(){if(!this.root||this.contextLost)return;this.phase=0;this.lastTime=null;this.playing=true;this.options.onMotion?.({...this.motion,playing:true});this.requestRender();}
  pause(){this.playing=false;this.lastTime=null;this.options.onMotion?.({...this.motion,playing:false});}
  resetMotion(){this.pause();this.setMotion({x:this.manifest.motion.trolley.home,h:this.manifest.motion.hoist.home});}
  stats(){const gl=this.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{...this.lastMetrics,frameCount:this.frameCount,loadMs:this.loadMs,playing:this.playing,viewport:[this.width,this.height],dpr:this.renderer.getPixelRatio(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),browser:navigator.userAgent,logicalProcessors:navigator.hardwareConcurrency,reducedMotion:this.reducedMotion};}
  disposeGraph(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));if(o.userData.baseMaterial)ms.add(o.userData.baseMaterial);});gs.forEach(g=>g.dispose());ms.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture){v.source?.data?.close?.();v.dispose();}m.dispose();});}
  unload(){this.pause();if(this.root){this.scene.remove(this.root);this.disposeGraph(this.root);this.root=null;}this.materialCopies?.forEach(m=>m.dispose());this.materialCopies?.clear();this.objects=new Map();this.meshes=[];this.motionObjects=[];this.selected.clear();if(this.boxHelper){this.scene.remove(this.boxHelper);this.boxHelper.geometry.dispose();this.boxHelper.material.dispose();this.boxHelper=null;}}
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.raf=0;this.ro.disconnect();this.listeners.forEach(([t,n,f])=>t.removeEventListener(n,f));this.listeners=[];this.controls.dispose();this.unload();this.grid.geometry.dispose();this.grid.material.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();this.labels.remove();}
}
