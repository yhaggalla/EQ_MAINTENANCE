// C72 identity, fit and preservation checks against the saved revision 9 model.
// node tools/u1/check_floating_c72.mjs [baseline directory]
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const baseline=process.argv[2]||'tmp/floating-c72-before', current='artifacts/models/cict-j526a-sts-scene/1';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const before=read(baseline+'/manifest.json'),after=read(current+'/manifest.json');
const old=new Map(before.nodes.map(n=>[n.key,n])), now=new Map(after.nodes.map(n=>[n.key,n]));
const p=read('assets/models/source/cict-j526a-sts/params.json').params,P=k=>p[k].mm/1000;
const results=[],near=(a,b,tol=.00004)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const check=(name,fn)=>{try{const detail=fn();results.push({name,pass:true,detail});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL '+name+': '+e.message);}};
const center=k=>now.get(k).bounds.min.map((v,i)=>(v+now.get(k).bounds.max[i])/2);
check('All component identities and classifications retained; only two area parents corrected',()=>{
 assert.deepEqual([...old.keys()].sort(),[...now.keys()].sort());
 const parents={'auxiliary.jib-cranes.2':'container.a-frame','auxiliary.obstruction-lights.2':'container.girder'};
 for(const [k,o]of old){for(const f of ['kind','classification','positionKind','uom'])assert.deepEqual(now.get(k)[f],o[f],k+' '+f);assert.equal(now.get(k).parentKey,parents[k]||o.parentKey,k);}
 return {nodes:now.size,positions:after.nodes.filter(n=>n.kind==='position').length};
});
check('Eight fitted trolley sheaves and four fitted headblock sheaves at drawing datums',()=>{
 for(const [prefix,count,y]of [['trolley.hoist-sheave.',8,P('girderUndersideElevation')+P('girderDepth')+.12+P('trolleyMainSheaveCentreAboveRail')],['headblock.hoist-sheave.',4,P('liftAboveRail')+1.12+P('headblockSheaveCentreAboveBase')]]){
 const ns=after.nodes.filter(n=>n.key.startsWith(prefix));assert.equal(ns.length,count);
 for(const n of ns){assert(n.modes.includes('overall'));assert(!n.instancing.gltfNodeName.startsWith('reference.'));near(center(n.key)[1],y);near(n.bounds.max[0]-n.bounds.min[0],1);}
 }
 near(center('headblock.hoist-sheave.2')[0]-center('headblock.hoist-sheave.1')[0],1.010);
 near(Math.abs(center('trolley.hoist-sheave.1-i')[2]-center('trolley.hoist-sheave.2-i')[2]),.165);
 near(center('trolley.hoist-sheave.1-ii')[0]-center('trolley.hoist-sheave.1-i')[0],1.8);
});
check('Four buffers meet the outer bogies at the 27 metre envelope',()=>{
 for(let i=1;i<=4;i++){const c=center('gantry.buffers.'+i);near(c[1],1.31);near(Math.abs(c[2]),13.175);assert(now.get('gantry.buffers.'+i).modes.includes('overall'));}
 near(now.get('gantry.buffers.1').bounds.max[2]-now.get('gantry.buffers.2').bounds.min[2],27);
});
check('Trip wires span the drawing brackets and small fittings meet their assemblies',()=>{
 for(let i=1;i<=2;i++){const n=now.get('boom.collision.trip-wires.'+i);near(n.bounds.max[0]-n.bounds.min[0],69.6,.002);near(center(n.key)[1],50.1);near(Math.abs(center(n.key)[2]),5.495);near(now.get('trolley.limit.proximity-switches.'+i).bounds.min[1],52.3);}
 near(now.get('auxiliary.jib-cranes.1').bounds.min[1],52.3);
 for(let i=1;i<=4;i++)near(center('trolley.rope-clamp.'+i)[1],52.73);
 near(now.get('gantry.rail-brake-hpu').bounds.min[0],.655);
 near(center('trolley.spreader-cable-reel.main-reducer-bearing')[1],51.82);
});
check('Optional attachments keep records and have no display mode',()=>{
 const hidden=after.nodes.filter(n=>!n.modes.length);assert.deepEqual(hidden.map(n=>n.key).sort(),['spreader.hook-beam','spreader.hook-beam.hook','spreader.over-height-adapter']);
 for(const n of hidden)assert(/not fitted/.test(n.qualifier));
});
function glb(file){const b=fs.readFileSync(file),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len));return{j,bin:b.subarray(28+len)};}
function accessor(g,id){const a=g.j.accessors[id],v=g.j.bufferViews[a.bufferView];return{meta:{componentType:a.componentType,type:a.type,count:a.count,byteStride:v.byteStride},bytes:g.bin.subarray((v.byteOffset||0)+(a.byteOffset||0),(v.byteOffset||0)+(a.byteOffset||0)+v.byteLength)};}
function meshDigest(g,n){const h=crypto.createHash('sha256');h.update(JSON.stringify([n.translation,n.rotation,n.scale,n.matrix]));
  for(const q of g.j.meshes[n.mesh].primitives){h.update(JSON.stringify(g.j.materials[q.material]));for(const [k,id]of Object.entries(q.attributes).sort()){const a=accessor(g,id);h.update(k+JSON.stringify(a.meta));h.update(a.bytes);}if(q.indices!==undefined)h.update(accessor(g,q.indices).bytes);}
  const ext=n.extensions?.EXT_mesh_gpu_instancing; if(ext)for(const [k,id]of Object.entries(ext.attributes).sort()){h.update(k);h.update(accessor(g,id).bytes);}return h.digest('hex');}

const a=glb(baseline+'/scene.glb'),b=glb(current+'/scene.glb');
const allowed=new Set(['reference.girder.instanced','boom.main.girder','reference.boom.instanced','reference.a-frame.instanced','trolley.sheave.set.a','trolley.sheave.set.b','trolley.spreader-cable-reel','trolley.hoist-sheaves.instanced','trolley.spreader-cable','reference.trolley.instanced','headblock.sheave-box.a','headblock.sheave-box.b','headblock.hoist-sheaves.instanced','reference.unfitted-attachments.instanced','reference.headblock-spreader.instanced','gantry.bogie.ws-a','gantry.bogie.ws-b','gantry.bogie.ls-a','gantry.bogie.ls-b','gantry.cable-reel.main','gantry.buffers.instanced','reference.gantry.instanced','reference.portal.instanced','gantry.mounted-housings.instanced']);
check('All geometry outside the explicitly repaired assemblies is byte-identical',()=>{
 const bn=new Map(b.j.nodes.map(n=>[n.name,n])),an=new Map(a.j.nodes.map(n=>[n.name,n]));let count=0;
 for(const n of a.j.nodes)if(n.mesh!==undefined&&!allowed.has(n.name)){assert(bn.has(n.name));assert.equal(meshDigest(a,n),meshDigest(b,bn.get(n.name)),n.name);count++;}
 for(const n of b.j.nodes)if(n.mesh!==undefined&&!an.has(n.name))assert(allowed.has(n.name),n.name);
 return {unchangedMeshes:count,allowedMeshChanges:[...allowed]};
});
check('C71 back-reach records and every hoist rope vertex remain unchanged',()=>{
 const bn=new Map(b.j.nodes.map(n=>[n.name,n]));let count=0;
 for(const [k,n]of old)if(n.parentKey==='container.back-reach'||k==='container.back-reach'){assert.deepEqual(now.get(k),n,k);count++;}
 for(const key of ['hoist.rope.set.main','trolley.rope.set.main','trolley.catenary-rope.set.main','boom.rope.set.main']){
 const n=a.j.nodes.find(n=>n.name===key);assert(n,'missing baseline '+key);assert.equal(meshDigest(a,n),meshDigest(b,bn.get(key)),key);}
 return {unchangedBackreachRecords:count,ropeMeshes:4};
});
const report={baseline,revision:after.revision,passed:results.filter(r=>r.pass).length,total:results.length,results};
fs.writeFileSync('docs/evidence/U1/floating-parts-c72/scope-and-fit.json',JSON.stringify(report,null,2)+'\n');
if(report.passed!==report.total)process.exitCode=1;
