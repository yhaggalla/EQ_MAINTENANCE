// Bounded C74 change against the saved C73 baseline, including unaffected instances in shared carriers.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base=process.argv[2]||'tmp/cabin-c74-before',cur='artifacts/models/cict-j526a-sts-scene/1';
const before=JSON.parse(fs.readFileSync(base+'/manifest.json')),after=JSON.parse(fs.readFileSync(cur+'/manifest.json'));
const old=new Map(before.nodes.map(n=>[n.key,n])),now=new Map(after.nodes.map(n=>[n.key,n]));
const targeted=k=>k.startsWith('cabin.')||k==='trolley.cable-system.main';
const results=[],check=(name,fn)=>{try{const detail=fn();results.push({name,pass:true,detail});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL '+name+': '+e.message);}};
function glb(file){const b=fs.readFileSync(file),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len));return{j,bin:b.subarray(28+len)};}
function accessor(g,id){const a=g.j.accessors[id],v=g.j.bufferViews[a.bufferView];return{meta:{componentType:a.componentType,type:a.type,count:a.count,byteStride:v.byteStride},bytes:g.bin.subarray((v.byteOffset||0)+(a.byteOffset||0),(v.byteOffset||0)+(a.byteOffset||0)+v.byteLength)};}
function meshDigest(g,n,instances=true){const h=crypto.createHash('sha256');h.update(JSON.stringify([n.translation,n.rotation,n.scale,n.matrix]));for(const q of g.j.meshes[n.mesh].primitives){h.update(JSON.stringify(g.j.materials[q.material]));for(const [k,id]of Object.entries(q.attributes).sort()){const a=accessor(g,id);h.update(k+JSON.stringify(a.meta));h.update(a.bytes);}if(q.indices!==undefined)h.update(accessor(g,q.indices).bytes);}if(instances)for(const [k,id]of Object.entries(n.extensions?.EXT_mesh_gpu_instancing?.attributes||{}).sort()){h.update(k);h.update(accessor(g,id).bytes);}return h.digest('hex');}
const a=glb(base+'/scene.glb'),b=glb(cur+'/scene.glb');
const an=new Map(a.j.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n])),bn=new Map(b.j.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n]));
check('All 410 identities, classifications and parents retained',()=>{
  assert.deepEqual([...old.keys()].sort(),[...now.keys()].sort());
  for(const [k,o]of old)for(const f of ['kind','classification','parentKey','positionKind','uom'])assert.deepEqual(now.get(k)[f],o[f],k+' '+f);
  assert.equal(after.revision,12);return {identities:now.size,positions:after.nodes.filter(n=>n.kind==='position').length};
});
check('Busbar and cabin connection are entirely on the opposite (+Z) side beneath the boom',()=>{
  const o=old.get('trolley.cable-system.main'),n=now.get('trolley.cable-system.main');
  assert(o.bounds.max[2]<0&&n.bounds.min[2]>0);assert.equal(o.bounds.min[0],n.bounds.min[0]);assert.equal(o.bounds.max[0],n.bounds.max[0]);assert(n.bounds.max[1]<=50.5);assert(n.hotspot.point[2]>1.1);
  return {oldSide:o.bounds,newSide:n.bounds,connection:n.hotspot.point};
});
check('Non-cabin mesh geometry and transforms remain byte-identical, including TLS and every rope',()=>{
  let count=0;for(const [k,n]of an)if(!targeted(k)&&k!=='reference.trolley.instanced'){assert(bn.has(k),k);assert.equal(meshDigest(a,n),meshDigest(b,bn.get(k)),k);count++;}
  assert.equal(meshDigest(a,an.get('reference.trolley.instanced'),false),meshDigest(b,bn.get('reference.trolley.instanced'),false));
  assert.deepEqual([...bn.keys()].filter(k=>!an.has(k)).sort(),['cabin.floor-window-lighting','cabin.mounted-instruments.instanced']);
  return {byteIdenticalCompleteMeshes:count,sharedCarrierBaseGeometry:'unchanged'};
});
check('Unaffected shared-carrier instances retain their transforms and bounds',()=>{
  const values=(g,node,index)=>Object.fromEntries(Object.entries(node.extensions.EXT_mesh_gpu_instancing.attributes).map(([k,id])=>{
    const acc=g.j.accessors[id],view=g.j.bufferViews[acc.bufferView],size={VEC3:3,VEC4:4}[acc.type];assert.equal(acc.componentType,5126);
    const start=(view.byteOffset||0)+(acc.byteOffset||0)+index*(view.byteStride||4*size);
    return [k,Array.from({length:size},(_,i)=>g.bin.readFloatLE(start+i*4))];
  }));let count=0;
  for(const [k,o]of old)if(!targeted(k)&&o.kind!=='container'){
    const n=now.get(k);assert.deepEqual(n.bounds,o.bounds,k+' bounds');
    if(o.instancing?.gltfNodeName==='reference.trolley.instanced'){
      assert.deepEqual(values(a,an.get(o.instancing.gltfNodeName),o.instancing.index),values(b,bn.get(n.instancing.gltfNodeName),n.instancing.index),k);count++;
    }
  }return {unchangedTrolleyInstances:count};
});
check('Seat, consoles, screens and lighting fit within the cab envelope and mount above its floor',()=>{
  for(const key of ['cabin.operator.seat','cabin.operator.consoles','cabin.monitors.1','cabin.monitors.2','cabin.monitors.3','cabin.twistlock-panel','cabin.floor-window-lighting']){
    const n=now.get(key),{min,max}=n.bounds;assert(min[0]>=64.5&&max[0]<=67.5,key+' X');assert(min[1]>=47.8&&max[1]<=50.23,key+' Y');assert(min[2]>=-1.101&&max[2]<=1.101,key+' Z');assert(n.modes.includes('overall')&&n.modes.includes('technical'),key+' modes');
  }
  assert.equal(now.get('cabin.floor-window-lighting').instancing,null);
  assert.equal(now.get('cabin.monitors.1').instancing.gltfNodeName,'cabin.mounted-instruments.instanced');
  return {floorLight:now.get('cabin.floor-window-lighting').bounds};
});
check('Cabin mounting dimensions follow J526A3100 and source module is included in checksums',()=>{
  const p=JSON.parse(fs.readFileSync('assets/models/source/cict-j526a-sts/params.json')).params;
  for(const [key,mm]of Object.entries({cabinLengthX:3000,cabinWidthZ:2200,cabinBodyHeight:2400,cabMountTopHeight:2673,cabMountPitchX:2100,cabMountPitchZ:1940,cabPlatformSpanZ:4600,cabSideWalkwayWidth:850,cabSideWalkwayLength:1445}))assert.equal(p[key].mm,mm,key);
  assert(fs.readFileSync(cur+'/checksums.json','utf8').includes('cict-j526a-sts/cabin.mjs'));return {drawing:'J526A3100 p1 A-A, B-B, C-C and plan'};
});
fs.writeFileSync('docs/evidence/U1/cabin-c74/scope-and-placement.json',JSON.stringify({baseline:base,revision:after.revision,passed:results.filter(r=>r.pass).length,total:results.length,results},null,2)+'\n');
if(results.some(r=>!r.pass))process.exitCode=1;
