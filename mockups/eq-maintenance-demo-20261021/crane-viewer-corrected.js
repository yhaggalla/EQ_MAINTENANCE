/* Drawing-informed visual mockup, revision 2. X=trolley, Y=up, Z=gantry travel.
 * References: J526A00, J526A0100 p1, J526A0600 p1, J526A1200, J526A3000 p1.
 * The spreader is a simplified telescopic frame, not manufacturer CAD.
 */
window.createCraneViewer=function(host,options={}){
 const T=window.THREE;if(!T)throw new Error('The local 3D library is unavailable.');
 const scene=new T.Scene();scene.background=new T.Color('#edf3f6');scene.fog=new T.Fog('#edf3f6',310,760);
 const camera=new T.PerspectiveCamera(43,1,.1,1000),renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 renderer.domElement.setAttribute('aria-label','QC model based on the supplied general arrangement. Drag to orbit, scroll to zoom, or use the mechanism tree.');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement);
 const controls=new T.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=3;controls.maxDistance=440;controls.maxPolarAngle=Math.PI*.493;controls.listenToKeyEvents(renderer.domElement);
 camera.position.set(145,101,173);controls.target.set(20,40,0);controls.update();
 scene.add(new T.HemisphereLight(0xffffff,0x8b9ca5,2.4));const sun=new T.DirectionalLight(0xffffff,3.1);sun.position.set(30,120,80);scene.add(sun);const fill=new T.DirectionalLight(0xdae9ff,1.6);fill.position.set(-70,45,-80);scene.add(fill);
 const root=new T.Group(),scenery=new T.Group();scene.add(root,scenery);
 const groups=new Map(),pickables=[],textures=[],roofPanels=[],cutawayWalls=[],houseSigns=[],wheelMeshes=[],truckGroups=[],staticRails=[];
 let disposed=false,scheduled=false,transition=null,showLabels=true,technical=false,cutaway=false,selectedTarget={},selectedBounds=null,firstSize=true;
 const palette={red:'#b91f32',darkred:'#921b2a',steel:'#637c89',wheel:'#65747c',dark:'#263f4b',cream:'#e6e9e6',yellow:'#edb82f',glass:'#73a5ba',rope:'#304550'};
 const mat=(c,extra={})=>new T.MeshStandardMaterial({color:palette[c]||c,roughness:.63,metalness:.16,...extra});
 function group(main,sub,key){const id=[main,sub,key].join('/');if(!groups.has(id)){const g=new T.Group();g.userData={main,sub,key};root.add(g);groups.set(id,g);}return groups.get(id);}
 function mesh(g,geometry,material,p){const m=new T.Mesh(geometry,material);if(p)m.position.set(...p);g.add(m);if(g.userData.main)pickables.push(m);return m;}
 function box(g,p,size,c='red',extra={}){return mesh(g,new T.BoxGeometry(...size),mat(c,extra),p);}
 function rod(g,a,b,r=.12,c='red',segments=8){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=mesh(g,new T.CylinderGeometry(r,r,d.length(),segments),mat(c),av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function beam(g,a,b,w=.8,depth=w,c='red'){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=mesh(g,new T.BoxGeometry(w,d.length(),depth),mat(c),av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 // Equalizer side elevation in the YZ plane, extruded along X.
 function yzPlate(g,x,points,width,c='red'){const s=new T.Shape();points.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:false});geo.rotateY(Math.PI/2);return mesh(g,geo,mat(c),[x-width/2,0,0]);}
 function railings(g,a,b,y,z){rod(g,[a,y,z],[b,y,z],.035,'cream',5);for(let x=a;x<=b+.01;x+=2.7)rod(g,[x,y-1.05,z],[x,y,z],.035,'cream',5);}
 const ground=mesh(scenery,new T.PlaneGeometry(430,300),mat('#e3eaed'),[-30,-.35,0]);ground.rotation.x=-Math.PI/2;
 const water=mesh(scenery,new T.PlaneGeometry(160,300),mat('#bfd6df',{roughness:.4}),[112,-.3,0]);water.rotation.x=-Math.PI/2;
 const grid=new T.GridHelper(260,52,0xb9cbd2,0xd4dee3);grid.position.y=-.25;grid.material.transparent=true;grid.material.opacity=.34;scene.add(grid);
 // Rails belong to infrastructure, not mechanism 04 or its focus bounds.
 for(const x of [-15,15]){staticRails.push(box(scenery,[x,-.04,0],[.12,.19,125],'steel'));box(scenery,[x,-.15,0],[.43,.09,125],'#a0afb6');}

 // Two portal frames, 30 m rail gauge, 20.4 m leg spacing (J526A0100).
 const ws=group('15','151','waterside-leg'),ls=group('15','151','landside-leg'),portal=group('15','151','portal-frame'),mast=group('15','151','mast');
 for(const z of [-10.2,10.2]){
  beam(ws,[15,4.1,z],[13,50.5,z],1.5,2.0);beam(ls,[-15,4.1,z],[-15,50.5,z],1.5,2.0);
  box(portal,[-.6,13.9,z],[31.2,2.8,1.65]);beam(portal,[-14.2,15.3,z],[12.6,49.9,z],1.15,1.35);
  beam(mast,[-15,53,z*.37],[13,81.9,z*.34],.72,.95);beam(mast,[13,51.75,z*.91],[13,81.9,z*.34],1.05,1.15);
 }
 for(const [g,x] of [[ls,-15],[ws,15]]){box(g,[x,4.9,0],[2.1,2,21.05]);box(portal,[x===15?13:x,50.4,0],[2.5,2.9,21.05]);}
 box(mast,[13,82.25,0],[1.5,.7,7.9]);rod(mast,[13,83.25,-4],[13,83.25,4],.04,'cream',5);for(const z of [-3.9,0,3.9])rod(mast,[13,82.5,z],[13,83.25,z],.04,'cream',5);

 // Four 8-wheel units. 800 mm STEEL wheels, low pair/intermediate
 // equalizers and upper saddle, rather than a solid rectangular housing.
 const drive=group('04','041','drive'),wheels=group('04','041','wheel-a');
 for(const x of [-15,15])for(const z0 of [-7.9,7.9]){
  const truck=new T.Group();truck.userData={main:'04',sub:'041',key:'drive',truck:true};drive.add(truck);truckGroups.push(truck);
  const zs=[-4.35,-3.3,-1.8,-.75,.75,1.8,3.3,4.35];
  // rotateY maps side-elevation Z to -Z; mirror coordinates to retain location.
  yzPlate(truck,x,[[z0-4.9,1.9],[z0-2.55,2.2],[z0-2.55,3.7],[z0+2.55,3.7],[z0+2.55,2.2],[z0+4.9,1.9],[z0+4.9,1.65],[z0+2.2,1.7],[z0,2.2],[z0-2.2,1.7],[z0-4.9,1.65]].map(([z,y])=>[-z,y]),.72);
  for(const c of [-2.55,2.55]){box(truck,[x,1.53,z0+c],[.68,.52,4.1]);rod(truck,[x-.48,1.9,z0+c],[x+.48,1.9,z0+c],.22,'steel',10);}
  for(const c of [-3.825,-1.275,1.275,3.825])box(truck,[x,.91,z0+c],[.73,.6,1.85]);
  for(const [i,z] of zs.entries()){
   wheelMeshes.push(rod(wheels,[x-.22,.4,z0+z],[x+.22,.4,z0+z],.4,'wheel',14));
   rod(wheels,[x-.27,.4,z0+z],[x-.22,.4,z0+z],.43,'dark',14);rod(wheels,[x+.22,.4,z0+z],[x+.27,.4,z0+z],.43,'dark',14);rod(wheels,[x-.4,.4,z0+z],[x+.4,.4,z0+z],.13,'cream',10);
   if(i%2===0){const sign=x>0?-1:1;box(truck,[x+sign*.68,1.01,z0+z],[.54,.65,.66],'steel');rod(truck,[x+sign*.68,1.33,z0+z],[x+sign*.68,1.92,z0+z],.22,'steel',12);box(truck,[x+sign*.68,1.98,z0+z],[.38,.12,.38],'dark');}
  }
  box(truck,[x,3.7,z0],[1.25,.25,1.25]);for(const z of [z0-5.35,z0+5.35])rod(truck,[x,1.6,z-.18],[x,1.6,z+.18],.18,'dark',10);
 }

 // Twin plated BOX girders with cross bracing in plan (J526A0100),
 // replacing the inaccurate side lattice used in the first mockup.
 const rear=group('15','151','rear-girder'),boom=group('03','031','girder');
 function girder(g,start,end,isBoom=false){
  const y=52;
  for(const z of [-3.75,3.75]){box(g,[(start+end)/2,y,z],[end-start,1.85,1.2]);box(g,[(start+end)/2,y+.98,z],[end-start,.16,1.4],'darkred');box(g,[(start+end)/2,y-.98,z],[end-start,.15,1.4],'darkred');box(g,[(start+end)/2,y+1.14,z],[end-start,.13,.1],'steel');}
  for(let x=start+1;x<end;x+=9.5){const next=Math.min(x+9.5,end-1);beam(g,[x,51.35,-3.15],[x,51.35,3.15],.27,.38);if(next>x+.5)beam(g,[x,51.35,-3.15],[next,51.35,3.15],.18,.2);}
  box(g,[(start+end)/2,53.25,-4.8],[end-start,.13,.9],'cream');railings(g,start,end,54.35,-5.22);
  if(isBoom){box(g,[end-.2,51.8,0],[.55,1.65,8.4]);for(const z of [-3.75,3.75])rod(g,[start,51.9,z-.6],[start,51.9,z+.6],.75,'steel',16);for(const x of [42,84])for(const z of [-3.75,3.75])box(g,[x,53.65,z],[1,1.1,1.5]);}
 }
 girder(rear,-46,13);girder(boom,13,90.9,true);
 for(const z of [-3.75,3.75]){beam(mast,[13,81.9,z*.93],[-45,53.8,z],.18,.24,'darkred');beam(mast,[13,81.9,z*.93],[-15,54.1,z],.24,.28,'darkred');beam(boom,[13,81.9,z*.93],[42,53.9,z],.18,.24,'darkred');beam(boom,[13,81.9,z*.93],[84,53.9,z],.18,.24,'darkred');}

 const trolley=group('02','021','frame'),tx=43;
 for(const z of [-3.15,3.15])box(trolley,[tx,52.1,z],[8.3,.85,.48],'cream');for(const x of [tx-3.6,tx+3.6])box(trolley,[x,52.1,0],[.55,.85,6.8],'cream');
 for(const x of [tx-3,tx+3])for(const z of [-3.75,3.75])rod(group('02','021',z<0?'wheel-a':'wheel-b'),[x,53.35,z-.16],[x,53.35,z+.16],.44,'wheel',12);
 const cab=group('14','141','assembly');box(cab,[tx-1,47.7,-5.3],[3.3,3.5,3],'cream');box(cab,[tx-1,48,-6.83],[2.8,2.25,.06],'glass',{roughness:.26,metalness:.3});box(cab,[tx+.67,48,-5.3],[.06,2.25,2.5],'glass',{roughness:.26});beam(cab,[tx-1,49.5,-5.3],[tx-1,52.5,-5.3],.35,.45,'cream');

 // Headblock: 5.2 m centres and 2.09 m end profile from J526A1200.
 // Long axes run along Z (rails), PERPENDICULAR to trolley travel X.
 const head=group('06','062','headblock'),spreader=group('06','061','frame'),sy=28.5,hy=30;
 for(const x of [tx-.77,tx+.77])box(head,[x,hy,0],[.26,.48,5.2],'cream');
 for(const z of [-2.6,2.6]){box(head,[tx,hy,z],[2.09,.55,.35],'cream');for(const x of [tx-.505,tx+.505]){rod(head,[x,hy+.45,z-.1],[x,hy+.45,z+.1],.45,'steel',16);rod(group('01','015','rope-set'),[x,51.6,z],[x,hy+.88,z],.038,'rope',6);}rod(group('01','013','assembly'),[tx,sy+.6,z],[tx,hy-.3,z],.13,'steel',10);}
 box(head,[tx,hy+.25,0],[1.15,.55,1.6],'cream');for(const z of [-2.4,-1.2,0,1.2,2.4])box(head,[tx,hy-.04,z],[1.55,.09,.14],'steel');
 for(const x of [tx-.79,tx+.79]){box(spreader,[x,sy,0],[.4,.72,6],'yellow');for(const sign of [-1,1])box(spreader,[x,sy-.08,sign*4.2],[.29,.48,3.6],'yellow');}
 for(const z of [-6.06,6.06]){
  box(spreader,[tx,sy-.05,z],[2.438,.62,.48],'yellow');
  for(const sign of [-1,1]){const lock=group('06','061','twistlock'),x=tx+sign*1.15;box(lock,[x,sy-.47,z],[.25,.27,.25],'dark');rod(lock,[x,sy-.55,z],[x,sy-.78,z],.075,'steel',8);beam(spreader,[x,sy+.02,z],[x+sign*.46,sy-.78,z+Math.sign(z)*.48],.17,.22,'yellow');box(spreader,[x+sign*.46,sy-.85,z+Math.sign(z)*.48],[.22,.2,.45],'yellow');}
 }
 for(const z of [-2.5,2.5])box(spreader,[tx,sy+.26,z],[2,.17,.42],'yellow');box(spreader,[tx,sy+.3,0],[1.2,.28,1.65],'yellow');

 // J526A3000: visible 18.2 x 10.5 m pitched-roof machinery house.
 // The narrow switchgear annex is included. Technical WHOLE-crane view
 // keeps the cladding; an internal selection opens the roof and side walls.
 const house=group('15','151','machinery-house'),hx=-26,floor=53.2,wallH=5.1;
 box(house,[hx,floor-.18,-1.4],[19.2,.42,14.3],'steel');
 for(const z of [-5.25,5.25])cutawayWalls.push(box(house,[hx,floor+wallH/2,z],[18.2,wallH,.14],'cream'));
 for(const x of [hx-9.1,hx+9.1])cutawayWalls.push(box(house,[x,floor+wallH/2,0],[.14,wallH,10.5],'cream'));
 for(const x of [hx-9.1,hx,hx+9.1])for(const z of [-5.25,5.25])box(house,[x,floor+wallH/2,z],[.16,wallH,.16],'steel');
 for(const sign of [-1,1]){const panel=box(house,[hx,floor+wallH+.34,sign*2.72],[18.65,.16,5.52],'cream');panel.rotation.x=sign*.13;roofPanels.push(panel);box(house,[hx,floor+wallH-.07,sign*5.55],[18.7,.19,.21],'steel');}
 box(house,[hx,floor+wallH+.7,0],[18.7,.14,.22],'steel');
 for(const x of [hx-9.1,hx+9.1]){beam(house,[x,floor+wallH,-5.25],[x,floor+wallH+.7,0],.12,.16,'steel');beam(house,[x,floor+wallH+.7,0],[x,floor+wallH,5.25],.12,.16,'steel');}
 for(const x of [hx-6.7,hx+6.6]){box(house,[x,floor+1.2,5.34],[1.1,2.4,.1],'steel');box(house,[x,floor+1.65,5.4],[.72,.65,.05],'glass');}
 for(const x of [hx-4.2,hx,hx+4.2]){box(house,[x,floor+1.3,5.35],[2.2,.7,.08],'steel');for(let y=floor+1.05;y<floor+1.6;y+=.15)box(house,[x,y,5.41],[2.05,.035,.035],'dark');}
 cutawayWalls.push(box(house,[hx,floor+2.05,-8.125],[18.2,4.1,.14],'cream'));
 for(const x of [hx-9.1,hx+9.1])cutawayWalls.push(box(house,[x,floor+2.05,-6.7],[.14,4.1,2.85],'cream'));
 roofPanels.push(box(house,[hx,floor+4.15,-6.7],[18.6,.16,3.05],'steel'));
 box(house,[hx,floor+4.6,0],[17.4,.25,.3],'steel');for(const x of [hx-7.3,hx+7.3])box(house,[x,floor+3.4,0],[.16,2.4,.2],'steel');
 for(const [idx,x] of [[0,hx-4.4],[1,hx+3]]){
  const y=floor+1.3,motor=group('01','011',idx?'motor-b':'motor-a');rod(motor,[x,y,-4.25],[x,y,-2.1],.74,'steel',18);box(motor,[x,floor+.25,-3.2],[1.7,.3,2.4],'dark');for(let i=0;i<5;i++)rod(motor,[x,y,-4.1+i*.3],[x,y,-4.04+i*.3],.82,'steel',14);
  box(group('01','011','gearbox'),[x,y,-.65],[2.1,2.3,2.1],'steel');rod(group('01','011','brake'),[x,y,-1.95],[x,y,-1.68],.64,'yellow',14);rod(group('01','011','drum-a'),[x,y,.65],[x,y,4],1.15,'darkred',20);for(const z of [.65,4])rod(group('01','011','drum-a'),[x,y,z-.06],[x,y,z+.06],1.32,'steel',20);
 }
 rod(group('03','031','boom-motor'),[hx-6.4,floor+1.1,3.8],[hx-3.9,floor+1.1,3.8],.6,'steel',14);box(group('03','032','emergency-brake'),[hx-7.6,floor+1,2.9],[1,1.35,1.3],'yellow');box(group('01','012','emergency-brake'),[hx+6.6,floor+1,3.3],[1,1.35,1.3],'yellow');
 for(const [i,main,sub,key] of [[0,'07','071','inverter'],[1,'08','081','plc'],[2,'12','121','assembly'],[3,'05','051','assembly']]){const g=group(main,sub,key);box(g,[hx-6.4+i*3.5,floor+1.6,-6.7],[2.2,3.1,1.35],'steel');box(g,[hx-6.4+i*3.5,floor+2,-5.99],[.8,.55,.06],'glass');}

 const reel=group('04','042','assembly');rod(reel,[16.8,6.9,-12.1],[16.8,6.9,-11],1.45,'steel',20);for(const z of [-12.2,-10.9])rod(reel,[16.8,6.9,z-.06],[16.8,6.9,z+.06],1.7,'darkred',20);beam(reel,[15,5,-10.7],[16.8,6.9,-10.7],.3,.4,'steel');
 const access=group('15','151','landside-leg');
 // Narrow exterior stair on one landside leg; no giant zigzag across it.
 for(let i=0;i<6;i++){const y=5.3+i*7.2,za=i%2?-8.4:-11.8,zb=i%2?-11.8:-8.4;beam(access,[-16.4,y,za],[-16.4,y+7.2,zb],.22,.95,'cream');box(access,[-16.4,y,za],[1.5,.12,1.5],'cream');rod(access,[-16.4,y+1,za],[-16.4,y+8.2,zb],.035,'steel',5);}
 const lift=group('15','153','assembly');box(lift,[-17,28,11.5],[1.8,2.7,1.7],'cream');beam(lift,[-17,5.5,11.5],[-17,50.8,11.5],.16,.2,'steel');
 for(const x of [29,69])box(group('13','131','assembly'),[x,53.7,4.6],[.48,.48,.48],'cream');box(group('16','161','assembly'),[hx-8.4,floor+.8,-.2],[1.1,1.2,1.4],'steel');box(group('11','111','assembly'),[tx,hy+.1,1.6],[.8,.4,.5],'steel');box(group('01','014','assembly'),[hx+8,floor+1.2,-3.7],[1.2,1.3,1.3],'dark');
 const catenary=group('02','023','assembly');for(let x=-40;x<41;x+=5)rod(catenary,[x,51.3,4.65],[x+3,49.9,4.65],.045,'dark',5);
 function plate(g,text,p,size,reverse=false){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#edf0ed';ctx.fillRect(0,0,512,160);ctx.fillStyle='#25566f';ctx.font='700 83px Segoe UI, sans-serif';ctx.textAlign='center';ctx.fillText(text,256,112);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.push(tex);const m=mesh(g,new T.PlaneGeometry(...size),new T.MeshBasicMaterial({map:tex}),p);if(reverse)m.rotation.y=Math.PI;return m;}
 houseSigns.push(plate(house,'CICT',[hx,floor+3.3,5.43],[5.3,1.65]),plate(house,'CICT',[hx,floor+3,-8.17],[5.3,1.65],true));plate(portal,options.equipment||'QC01',[0,13.9,11.04],[6,1.6]);
 const fullBounds=new T.Box3().setFromObject(root),framingPoints=[];
 root.traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])framingPoints.push(new T.Vector3(x,y,z));});
 const selectionBox=new T.Box3Helper(new T.Box3(),0x168bc2);selectionBox.visible=false;scene.add(selectionBox);
 const labels=document.createElement('div');labels.className='model-labels';host.appendChild(labels);
 const labelsSpec=[['03','031','Boom',[68,54.4,0]],['02','021','Trolley',[tx,53.6,-4]],['15','151','Machinery house',[hx,60,0],'machinery-house'],['04','041','Gantry drive',[15,3.8,7.9]],['06','061','Spreader',[tx,28.5,0]]];
 labelsSpec.forEach(([main,sub,title,p,part])=>{const b=document.createElement('button');b.type='button';b.className='model-label';b.textContent=title;b.setAttribute('aria-label','Select '+title);b.onclick=()=>options.onSelect?.({main,sub,part:part||''});labels.appendChild(b);});
 function houseState(){const t=selectedTarget,inside=['05','07','08','12','16'].includes(t.main)||(t.main==='01'&&['011','012','014'].includes(t.sub))||(t.main==='03'&&['boom-motor','emergency-brake'].includes(t.part));cutaway=technical&&inside&&!!t.sub;roofPanels.forEach(m=>m.visible=!cutaway);houseSigns.forEach(m=>m.visible=!cutaway);cutawayWalls.forEach(m=>{m.visible=!cutaway;m.material.transparent=cutaway;m.material.opacity=cutaway?.10:1;m.material.depthWrite=!cutaway;});}
 function boundsFor(list){const b=new T.Box3();list.forEach(g=>b.union(new T.Box3().setFromObject(g)));return b;}
 function moveTo(target,distance,offset,instant=false){const dir=offset?new T.Vector3(...offset).normalize():camera.position.clone().sub(controls.target).normalize(),toPos=target.clone().addScaledVector(dir,distance);if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){transition=null;camera.position.copy(toPos);controls.target.copy(target);controls.update();invalidate();return;}transition={start:performance.now(),fromPos:camera.position.clone(),toPos,fromTarget:controls.target.clone(),toTarget:target};invalidate();}
 function fit(bounds,offset=null,instant=false,padding=1.17,minDistance=4){
  const center=bounds.getCenter(new T.Vector3()),dir=offset?new T.Vector3(...offset).normalize():camera.position.clone().sub(controls.target).normalize(),right=new T.Vector3(0,1,0).cross(dir).normalize(),up=dir.clone().cross(right).normalize();
  const tanV=Math.tan(T.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;let distance=minDistance;
  const points=bounds===fullBounds?framingPoints:[];
  if(!points.length)for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new T.Vector3(x,y,z));
  for(const point of points){const p=point.clone().sub(center),depth=p.dot(dir);distance=Math.max(distance,depth+Math.abs(p.dot(right))*padding/tanH,depth+Math.abs(p.dot(up))*padding/tanV);}
  moveTo(center,Math.min(420,distance),dir.toArray(),instant);
 }
 function invalidate(){if(!scheduled&&!disposed){scheduled=true;requestAnimationFrame(draw);}}
 function draw(time){if(disposed)return;scheduled=false;if(transition){const t=Math.min(1,(time-transition.start)/500),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(transition.fromPos,transition.toPos,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);if(t<1)invalidate();else transition=null;}controls.update();renderer.render(scene,camera);const w=host.clientWidth,h=host.clientHeight,placed=[];labelsSpec.forEach((spec,i)=>{const p=new T.Vector3(...spec[3]).project(camera),x=(p.x+1)*w/2,y=(-p.y+1)*h/2,visible=showLabels&&p.z<1&&x>44&&x<w-50&&y>40&&y<h-45&&!placed.some(q=>Math.abs(x-q[0])<92&&Math.abs(y-q[1])<29);labels.children[i].style.cssText=`left:${x}px;top:${y}px;display:${visible?'block':'none'}`;if(visible)placed.push([x,y]);});}
 controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{transition=null;});
 function size(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(firstSize){firstSize=false;fit(fullBounds,[.65,.25,1],true);}invalidate();}
 const observer=new ResizeObserver(size);observer.observe(host);size();let down=null;
 const onDown=e=>{down={x:e.clientX,y:e.clientY};},onUp=e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(pickables,false).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return !(cutaway&&cutawayWalls.includes(h.object));});if(hit){let o=hit.object;while(o&&!o.userData.main)o=o.parent;const d=o?.userData;if(d)options.onSelect?.({main:d.main,sub:d.sub,part:d.key});}};
 renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();options.onError?.('3D context lost. The mechanism tree and work records remain available.');});
 const asBounds=b=>b?{min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new T.Vector3()).toArray()}:null;
 const api={
  select(target={},focus=true){selectedTarget={...target};let approximate=false,selected=[...groups.values()].filter(g=>(!target.main||g.userData.main===target.main)&&(!target.sub||g.userData.sub===target.sub)&&(!target.part||g.userData.key===target.part));if(!selected.length&&target.sub){selected=[...groups.values()].filter(g=>g.userData.main===target.main);approximate=true;}if(!selected.length){selected=[house];approximate=true;}for(const g of groups.values())g.traverse(o=>{if(o.isMesh&&o.material.emissive){o.material.emissive.set(selected.includes(g)&&target.main?'#145878':'#000000');o.material.emissiveIntensity=.42;}});selectedBounds=boundsFor(selected);selectionBox.box.copy(selectedBounds);selectionBox.visible=!!target.main;houseState();if(focus&&target.main&&!selectedBounds.isEmpty()){if(target.main==='04')fit(selectedBounds,[.8,.4,1],false,1.28);else if(target.main==='06')fit(selectedBounds,[1,.7,1.25],false,1.35);else if(cutaway)fit(selectedBounds,[-1.4,1.2,-.5],false,1.5,18);else fit(selectedBounds);}invalidate();return {approximate};},
  setTechnical(value){technical=value;houseState();invalidate();},setLabels(value){showLabels=value;invalidate();},
  view(name){const ds={side:[0,.02,1],end:[1,.05,0],top:[.001,1,.001],perspective:[.65,.25,1]};fit(fullBounds,ds[name]||ds.perspective);},
  zoom(factor){transition=null;camera.position.copy(controls.target.clone().add(camera.position.clone().sub(controls.target).multiplyScalar(factor)));invalidate();},reset(){selectionBox.visible=false;api.view('perspective');},
  screenshot(){renderer.render(scene,camera);const a=document.createElement('a');a.download=(options.equipment||'QC')+'-demo-view.png';a.href=renderer.domElement.toDataURL('image/png');a.click();},
  info(){const r=renderer.domElement.getBoundingClientRect(),p=new T.Vector3(65,52,4.4).project(camera);return {revision:'drawing-correction-2',triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,groups:groups.size,technical,cutaway,camera:camera.position.toArray(),target:controls.target.toArray(),selection:{...selectedTarget},selectionBounds:asBounds(selectedBounds),mechanismBounds:Object.fromEntries(['03','04','06'].map(main=>[main,asBounds(boundsFor([...groups.values()].filter(g=>g.userData.main===main)))])),gantry:{travellingUnits:truckGroups.length,wheelCount:wheelMeshes.length,wheelDiameter:.8,railGauge:30,legSpacing:20.4,railsSelectable:staticRails.some(m=>pickables.includes(m))},house:{bounds:asBounds(new T.Box3().setFromObject(house)),roofVisible:roofPanels.every(m=>m.visible),wallsOpaque:cutawayWalls.every(m=>m.material.opacity===1)},spreader:{bounds:asBounds(new T.Box3().setFromObject(spreader)),headblockBounds:asBounds(new T.Box3().setFromObject(head)),longAxis:'Z / gantry rails'},boomPickPoint:{x:r.left+(p.x+1)*r.width/2,y:r.top+(-p.y+1)*r.height/2}};},
  dispose(){disposed=true;observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);const gs=new Set(),ms=new Set(),ts=new Set(textures);scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();labels.remove();}
 };invalidate();return api;
};
