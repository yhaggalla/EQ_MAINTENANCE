/* A simplified, drawing-informed QC scene, built only for this isolated mockup. */
window.createCraneViewer = function (host, options={}) {
  const T=window.THREE;
  if(!T) throw new Error('The local 3D library is unavailable.');
  const scene=new T.Scene(); scene.background=new T.Color('#edf3f6'); scene.fog=new T.Fog('#edf3f6',270,650);
  const camera=new T.PerspectiveCamera(43,1,.25,900);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6)); renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.domElement.setAttribute('aria-label','Interactive QC model. Drag to orbit, scroll to zoom, or select a component using the mechanism tree.');
  renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement);
  const controls=new T.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=8;controls.maxDistance=340;controls.maxPolarAngle=Math.PI*.49;controls.target.set(21,37,0);controls.listenToKeyEvents(renderer.domElement);
  camera.position.set(157,108,151);controls.update();
  scene.add(new T.HemisphereLight(0xffffff,0x7f919b,2.6));
  const sun=new T.DirectionalLight(0xffffff,3.2);sun.position.set(35,120,90);scene.add(sun);
  const fill=new T.DirectionalLight(0xd5e5ff,1.5);fill.position.set(-70,45,-80);scene.add(fill);
  const root=new T.Group();scene.add(root);
  const groups=new Map(),pickables=[],materials=[],geometries=[],textures=[];
  const palette={red:'#b92532',darkred:'#8c1b28',steel:'#617e92',dark:'#293d4c',cream:'#e5e9e7',yellow:'#e7b448',glass:'#81b6cb',rope:'#263d4b'};
  const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color:palette[color]||color,roughness:.65,metalness:.12,...extra});materials.push(m);return m;};
  const group=(main,sub,key)=>{const id=[main,sub,key].join('/');if(!groups.has(id)){const g=new T.Group();g.userData={main,sub,key};root.add(g);groups.set(id,g);}return groups.get(id);};
  function mesh(g,geo,material,pos){geometries.push(geo);const m=new T.Mesh(geo,material);if(pos)m.position.set(...pos);g.add(m);if(g!==scene)pickables.push(m);return m;}
  function box(g,p,size,color='red',extra={}){return mesh(g,new T.BoxGeometry(...size),mat(color,extra),p);}
  function rod(g,a,b,r=.16,color='red',segments=8){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(g,new T.CylinderGeometry(r,r,d.length(),segments),mat(color),av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
  function beam(g,a,b,w=.8,depth=w,color='red'){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(g,new T.BoxGeometry(w,d.length(),depth),mat(color),av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
  const ground=mesh(scene,new T.PlaneGeometry(450,350),mat('#e3eaed'),[-25,-.75,0]);ground.rotation.x=-Math.PI/2;
  const water=mesh(scene,new T.PlaneGeometry(180,350),mat('#bed5df',{roughness:.4}),[112,-.65,0]);water.rotation.x=-Math.PI/2;
  const grid=new T.GridHelper(270,54,0xb8c9d1,0xd2dde2);grid.position.y=-.55;grid.material.transparent=true;grid.material.opacity=.38;scene.add(grid);
  for(const x of [-15,15]){beam(group('04','041','drive'),[x,0,-65],[x,0,65],.18,.24,'steel');}
  const portalWS=group('15','151','waterside-leg'),portalLS=group('15','151','landside-leg'),mast=group('15','151','mast');
  for(const z of [-10.2,10.2]){
    beam(portalWS,[15,5,z],[16,54,z],1.65,1.8);
    beam(portalLS,[-15,5,z],[-12,54,z],1.65,1.8);
    beam(portalWS,[-14.5,13,z],[15,13,z],1.2,1.3);
    beam(portalLS,[-12,53,z],[16,53,z],1.3,1.6);
    beam(portalLS,[-14.5,15,z],[15,49,z],.85,.85);
    beam(mast,[15,55,z*.8],[15,84,z*.72],1.3,1.3);
    beam(mast,[-10,55,z*.8],[15,84,z*.72],.9,.9);
  }
  for(const x of [-15,15]){beam(portalWS,[x,7,-11],[x,7,11],1.25,1.6);beam(portalWS,[x,51,-10.2],[x,51,10.2],1.1,1.5);}
  beam(mast,[15,84,-7.35],[15,84,7.35],1,1.1);
  const bogie=group('04','041','drive');
  for(const x of [-15,15])for(const z0 of [-8.3,8.3]){
    box(bogie,[x,3,z0],[2.8,3.5,11.5]);
    for(let i=0;i<8;i++){const z=z0-4.8+i*1.37;const wheel=rod(group('04','041','wheel-a'),[x-1.1,1.3,z],[x+1.1,1.3,z],.85,'dark',14);if(i%2===0)box(bogie,[x+1.4,2.8,z],[1.8,1,1.1],'steel');}
  }
  function girder(g,start,end,y=55){
    for(const z of [-3.5,3.5]){
      beam(g,[start,y,z],[end,y,z],.65,.8);beam(g,[start,y+3.7,z],[end,y+3.7,z],.65,.8);
      for(let x=start;x<end-.5;x+=5){const next=Math.min(x+5,end);beam(g,[x,y,z],[x,y+3.7,z],.3,.3);beam(g,[x,y,z],[next,y+3.7,z],.32,.32);}
    }
    for(let x=start;x<=end;x+=5){beam(g,[x,y,-3.5],[x,y,3.5],.35,.4);beam(g,[x,y+3.7,-3.5],[x,y+3.7,3.5],.3,.3);}
    box(g,[(start+end)/2,y+4.15,-4.1],[end-start,.16,1.1],'cream');
    for(let x=start;x<end;x+=6){rod(g,[x,y+4.3,-4.6],[x,y+5.5,-4.6],.055,'yellow',5);}
    rod(g,[start,y+5.5,-4.6],[end,y+5.5,-4.6],.065,'yellow',5);
  }
  girder(group('15','151','rear-girder'),-35,15);girder(group('03','031','girder'),15,85);
  const stays=group('03','031','girder');
  for(const z of [-3.5,3.5]){rod(stays,[15,84,z*2.1],[49,58.5,z],.13,'darkred');rod(stays,[15,84,z*2.1],[84,58.5,z],.12,'darkred');rod(mast,[15,84,z*2.1],[-34,58.5,z],.13,'darkred');}
  box(group('03','031','girder'),[85,56.7,0],[1.2,6,9]);
  const trolley=group('02','021','frame');box(trolley,[43,59.1,0],[8.3,1,9.2],'cream');
  for(const x of [40,46])for(const z of [-4.2,4.2])rod(group('02','021',z<0?'wheel-a':'wheel-b'),[x,59,z-.5],[x,59,z+.5],.7,'dark',12);
  const cab=group('14','141','assembly');box(cab,[40,51.2,-6.6],[4.3,4.7,4.7],'cream');box(cab,[40.2,51.9,-9],[3.6,2.8,.12],'glass',{metalness:.3,roughness:.25});box(cab,[42.2,51.9,-6.8],[.1,2.8,3.9],'glass');beam(cab,[40,54,-6.6],[40,59,-6.6],.5,.6,'cream');
  const hoistRopes=group('01','015','rope-set');
  for(const x of [40.7,45.3])for(const z of [-2,2])rod(hoistRopes,[x,56,z],[x,32,z],.09,'rope',6);
  const headblock=group('06','062','headblock');box(headblock,[43,31,0],[7.2,1.8,4.7],'cream');
  for(const x of [40.5,45.5])rod(group('01','013','assembly'),[x,30,0],[x,31.5,0],.24,'steel');
  const spreader=group('06','061','frame');box(spreader,[43,28.5,0],[12.2,1.1,3.2],'yellow');
  for(const x of [37,49])box(group('06','061','twistlock'),[x,27.6,0],[.7,.8,3.3],'dark');
  for(const z of [-1.5,1.5]){box(spreader,[43,29,z],[12.5,.6,.3],'yellow');}
  const house=group('15','151','machinery-house');const shell=[];
  shell.push(box(house,[-20,63,0],[22,9,16],'cream'));
  for(const x of [-29,-11])shell.push(box(house,[x,62,-8.06],[3,2.5,.12],'glass'));
  const motors=[];
  for(const [idx,x] of [[0,-25],[1,-16]]){
    const key=idx===0?'motor-a':'motor-b';const motor=group('01','011',key);rod(motor,[x,60,-6.5],[x,60,-3],1.3,'steel',20);box(motor,[x,59,-4.8],[3,.5,4],'dark');
    for(let f=0;f<5;f++)rod(motor,[x,60,-6+f*.45],[x,60,-5.9+f*.45],1.4,'steel',16);
    const gear=group('01','011','gearbox');box(gear,[x,60,-1.7],[3.3,3.3,3],'steel');
    rod(group('01','011','drum-a'),[x,60,.3],[x,60,5.2],1.8,'darkred',24);
    rod(group('01','011','brake'),[x,60,-3.2],[x,60,-2.7],1.15,'yellow',16);
  }
  rod(group('03','031','boom-motor'),[-28,60,5.2],[-25,60,5.2],1,'steel',16);
  box(group('03','032','emergency-brake'),[-29.5,60,3.4],[1.5,2,2],'yellow');
  box(group('01','012','emergency-brake'),[-12,60,3],[1.6,2,2],'yellow');
  for(const [i,main,sub,key] of [[0,'07','071','inverter'],[1,'08','081','plc'],[2,'12','121','assembly'],[3,'05','051','assembly']]){const g=group(main,sub,key);box(g,[-28+i*3.5,61.2,6],[2.4,4.4,1.4],'steel');box(g,[-28+i*3.5,62,5.23],[1,.7,.08],'glass');}
  rod(group('04','042','assembly'),[-18,5,-12],[-18,5,-9],2.5,'dark',22);
  for(const x of [30,67])box(group('13','131','assembly'),[x,59,4.6],[.7,.7,.7],'cream');
  const lift=group('15','153','assembly');box(lift,[-12,27,10.9],[2.3,3.5,2.1],'cream');beam(lift,[-12,4,11],[-12,52,11],.25,.3,'steel');
  const access=group('15','151','landside-leg');
  for(let i=0;i<6;i++){const y=5+i*8;const za=i%2?6:-6,zb=-za;beam(access,[-16,y,za],[-16,y+8,zb],.3,1.1,'cream');box(access,[-16,y,za],[2,.18,3],'cream');}
  box(group('16','161','assembly'),[-30,60,-1],[1.8,1.5,2],'steel');
  box(group('11','111','assembly'),[43,30,2.6],[2,1,.8],'steel');
  box(group('01','014','assembly'),[-10,61,-5],[2,2,2],'dark');
  const catenary=group('02','023','assembly');for(let x=-30;x<41;x+=5)rod(catenary,[x,57.4,4.8],[x+3,55.6,4.8],.06,'dark',5);
  function plate(g,text,p,size){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#f1f4f3';ctx.fillRect(0,0,512,160);ctx.fillStyle='#25566f';ctx.font='700 83px Segoe UI, sans-serif';ctx.textAlign='center';ctx.fillText(text,256,112);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.push(tex);const m=mesh(g,new T.PlaneGeometry(...size),new T.MeshBasicMaterial({map:tex}),p);materials.push(m.material);return m;}
  plate(house,'CICT',[-20,64,-8.1],[10,3.1]).rotation.y=Math.PI;
  plate(house,'CICT',[-20,64,8.1],[10,3.1]);
  plate(portalWS,options.equipment||'QC01',[0,14,-10.95],[8,2.2]).rotation.y=Math.PI;
  const containerMat=['#839eaa','#b2bdba','#b2a592'];
  for(let i=0;i<6;i++){const g=new T.Group();scene.add(g);box(g,[-46,1.7,(i-3)*7],[10,3,5],containerMat[i%3]);}
  const selectionBox=new T.Box3Helper(new T.Box3(),0x168bc2);selectionBox.visible=false;scene.add(selectionBox);
  const labels=document.createElement('div');labels.className='model-labels';host.appendChild(labels);
  const labelsSpec=[['03','031','Boom',[65,61,0]],['02','021','Trolley',[43,60,-3]],['01','011','Main hoist',[-20,68,0]],['04','041','Gantry',[15,5,10]]];
  labelsSpec.forEach(([main,sub,title,pos])=>{const b=document.createElement('button');b.type='button';b.className='model-label';b.textContent=title;b.setAttribute('aria-label','Select '+title);b.onclick=()=>options.onSelect?.({main,sub,part:''});labels.appendChild(b);});
  let disposed=false,scheduled=false,transition=null,showLabels=true,technical=false;
  function invalidate(){if(!scheduled&&!disposed){scheduled=true;requestAnimationFrame(draw);}}
  function draw(time){if(disposed)return;scheduled=false;if(transition){const t=Math.min(1,(time-transition.start)/500),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(transition.fromPos,transition.toPos,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);if(t<1)invalidate();else transition=null;}
    controls.update();renderer.render(scene,camera);
    const w=host.clientWidth,h=host.clientHeight,placed=[];
    labelsSpec.forEach((spec,i)=>{const p=new T.Vector3(...spec[3]).project(camera),x=(p.x+1)*w/2,y=(-p.y+1)*h/2;const visible=showLabels&&p.z<1&&x>40&&x<w-50&&y>40&&y<h-45&&!placed.some(q=>Math.abs(x-q[0])<85&&Math.abs(y-q[1])<29);labels.children[i].style.cssText=`left:${x}px;top:${y}px;display:${visible?'block':'none'}`;if(visible)placed.push([x,y]);});
  }
  controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{transition=null;});
  function size(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate();}
  const observer=new ResizeObserver(size);observer.observe(host);size();
  let down=null;
  const onDown=e=>{down={x:e.clientX,y:e.clientY};};
  const onUp=e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(pickables,false).find(h=>h.object.visible&&h.object.parent.visible&&h.object.parent.userData.main&&!(technical&&shell.includes(h.object)));if(hit){const d=hit.object.parent.userData;options.onSelect?.({main:d.main,sub:d.sub,part:d.key});}};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();options.onError?.('3D context lost. The mechanism tree and work records remain available.');});
  function moveTo(target,distance,offset){const dir=offset?new T.Vector3(...offset).normalize():camera.position.clone().sub(controls.target).normalize();const toPos=target.clone().addScaledVector(dir,distance);if(matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.copy(toPos);controls.target.copy(target);invalidate();return;}transition={start:performance.now(),fromPos:camera.position.clone(),toPos,fromTarget:controls.target.clone(),toTarget:target};invalidate();}
  const api={
    select(target={},focus=true){let selected=[...groups.values()].filter(g=>(!target.main||g.userData.main===target.main)&&(!target.sub||g.userData.sub===target.sub)&&(!target.part||g.userData.key===target.part));let approximate=false;if(!selected.length&&target.sub){selected=[...groups.values()].filter(g=>g.userData.main===target.main);approximate=true;}if(!selected.length){selected=[house];approximate=true;}
      for(const g of groups.values())g.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material.emissive.set(selected.includes(g)&&target.main?'#124e6e':'#000000');o.material.emissiveIntensity=.34;}});
      const bounds=new T.Box3();selected.forEach(g=>bounds.union(new T.Box3().setFromObject(g)));selectionBox.box.copy(bounds);selectionBox.visible=!!target.main;
      if(focus&&target.main&&!bounds.isEmpty()){const center=bounds.getCenter(new T.Vector3()),extent=bounds.getSize(new T.Vector3());const distance=Math.max(15,Math.max(extent.x,extent.y,extent.z)*1.85);moveTo(center,Math.min(210,distance));}invalidate();return {approximate};
    },
    setTechnical(value){technical=value;shell.forEach(m=>{m.material.transparent=value;m.material.opacity=value?.12:1;m.material.depthWrite=!value;});invalidate();},
    setLabels(value){showLabels=value;invalidate();},
    view(name){transition=null;const center=new T.Vector3(23,40,0);if(name==='side')moveTo(center,190,[0,.07,-1]);else if(name==='end')moveTo(center,160,[1,.08,0]);else if(name==='top')moveTo(center,190,[.001,1,.001]);else moveTo(center,208,[1,.5,1]);},
    zoom(factor){transition=null;camera.position.copy(controls.target.clone().add(camera.position.clone().sub(controls.target).multiplyScalar(factor)));invalidate();},
    reset(){selectionBox.visible=false;api.view('perspective');},
    screenshot(){renderer.render(scene,camera);const a=document.createElement('a');a.download=(options.equipment||'QC')+'-demo-view.png';a.href=renderer.domElement.toDataURL('image/png');a.click();},
    info(){const r=renderer.domElement.getBoundingClientRect(),p=new T.Vector3(65,56.8,3.5).project(camera);return {triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,groups:groups.size,technical,camera:camera.position.toArray(),target:controls.target.toArray(),boomPickPoint:{x:r.left+(p.x+1)*r.width/2,y:r.top+(-p.y+1)*r.height/2}};},
    dispose(){disposed=true;observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);const gs=new Set(),ms=new Set(),ts=new Set(textures);scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();labels.remove();}
  };
  invalidate();return api;
};
