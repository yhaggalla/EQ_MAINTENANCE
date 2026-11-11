// C71 drawing dimensions and strict back-reach-only regression against a saved pre-edit model.
// node tools/u1/check_backreach_c71.mjs [baseline directory]
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { tlsLayout } from '../../assets/models/source/cict-j526a-sts/backreach.mjs';
const baseline=process.argv[2]||'tmp/backreach-c71-before', current='artifacts/models/cict-j526a-sts-scene/1';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const before=read(baseline+'/manifest.json'),after=read(current+'/manifest.json');
const old=new Map(before.nodes.map(n=>[n.key,n])), now=new Map(after.nodes.map(n=>[n.key,n]));
const results=[];
const check=(name,fn)=>{try{const detail=fn();results.push({name,pass:true,detail});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL '+name+': '+e.message);}};
const p=read('assets/models/source/cict-j526a-sts/params.json').params, L=tlsLayout(k=>p[k].mm/1000);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
check('J526A1000 normal pose dimensions',()=>{
  near(Math.hypot(...L.pivot.map((v,i)=>v-L.eye[i])),2.565);
  near(Math.hypot(...L.pivot.map((v,i)=>v-L.sheave[i])),3.504);
  near(Math.hypot(...L.anchor.map((v,i)=>v-L.eye[i])),2.212);
  near(L.pivot[1]-L.datum,3.055);near(L.anchor[1]-L.datum,.800);near(L.anchor[0]-L.pivot[0],1.945);
  near(L.zs[1]-L.zs[0],.605);near((L.zs[0]+L.zs[1])/2,-2.45);
  near(L.zs[3]-L.zs[2],.605);near((L.zs[2]+L.zs[3])/2,2.45);
  assert(Math.abs(Math.atan2(...[L.unit[1],L.unit[0]]))<Math.PI/18,'normal cylinders must be within 10 degrees of horizontal');
  return {pivot:L.pivot,rodEye:L.eye,sheave:L.sheave,lanes:L.zs};
});
check('All 410 semantic identities, kinds, parents and classifications retained',()=>{
  assert.deepEqual([...old.keys()].sort(),[...now.keys()].sort());
  for(const [k,o]of old)for(const f of ['kind','parentKey','classification','positionKind','uom'])assert.deepEqual(now.get(k)[f],o[f],k+' '+f);
  return {nodes:now.size,remappedInstanceIndices:after.nodes.filter(n=>JSON.stringify(n.instancing)!==JSON.stringify(old.get(n.key).instancing)).length};
});
check('Only back-reach records and the hoist-rope bounds change',()=>{
  const outside=[];
  for(const [k,n]of now)if(n.parentKey!=='container.back-reach'&&!['container.back-reach','container.girder','hoist.rope.set.main'].includes(k)){
    assert.deepEqual(n,old.get(k),k);outside.push(k);
  }
  return {unchangedRecords:outside.length};
});
function glb(file){const b=fs.readFileSync(file),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len));return{j,bin:b.subarray(28+len)};}
function accessor(g,id){const a=g.j.accessors[id],v=g.j.bufferViews[a.bufferView];return{meta:{componentType:a.componentType,type:a.type,count:a.count,byteStride:v.byteStride},bytes:g.bin.subarray((v.byteOffset||0)+(a.byteOffset||0),(v.byteOffset||0)+(a.byteOffset||0)+v.byteLength)};}
function meshDigest(g,n){const h=crypto.createHash('sha256');h.update(JSON.stringify([n.translation,n.rotation,n.scale,n.matrix]));
  for(const q of g.j.meshes[n.mesh].primitives){h.update(JSON.stringify(g.j.materials[q.material]));for(const [k,id]of Object.entries(q.attributes).sort()){const a=accessor(g,id);h.update(k+JSON.stringify(a.meta));h.update(a.bytes);}if(q.indices!==undefined)h.update(accessor(g,q.indices).bytes);}
  const ext=n.extensions?.EXT_mesh_gpu_instancing; if(ext)for(const [k,id]of Object.entries(ext.attributes).sort()){h.update(k);h.update(accessor(g,id).bytes);}return h.digest('hex');}
const a=glb(baseline+'/scene.glb'),b=glb(current+'/scene.glb');
const allowed=new Set(['reeving.anti-snag-tls.device','reeving.sheave.girder-tail','trolley.skew-system.main','reference.back-reach.instanced','hoist.rope.set.main','reeving.tls-cylinders.instanced','reeving.tls-sheaves.instanced','reeving.tls-pump.motor','reeving.tls-pump.coupling-insert']);
check('Every unrelated mesh and instance transform is byte-identical',()=>{
  const nodes=new Map(b.j.nodes.map(n=>[n.name,n]));let count=0;
  for(const n of a.j.nodes)if(n.mesh!==undefined&&!allowed.has(n.name)){const nn=nodes.get(n.name);assert(nn,n.name);assert.equal(meshDigest(a,n),meshDigest(b,nn),n.name);count++;}
  for(const n of b.j.nodes)if(n.mesh!==undefined&&!a.j.nodes.some(x=>x.name===n.name))assert(allowed.has(n.name),'unexpected added mesh '+n.name);
  return {unchangedMeshes:count};
});
function outsideRope(g){const n=g.j.nodes.find(n=>n.name==='hoist.rope.set.main'),points=[];
  for(const pr of g.j.meshes[n.mesh].primitives){const ac=g.j.accessors[pr.attributes.POSITION],v=g.j.bufferViews[ac.bufferView],off=(v.byteOffset||0)+(ac.byteOffset||0),stride=v.byteStride||12;
    for(let i=0;i<ac.count;i++){const p=[0,1,2].map(j=>g.bin.readFloatLE(off+i*stride+j*4));if(p[0]>L.tail+7+.1)points.push(p);}}
  return points;
}
check('Hoist-rope vertices beyond the back reach remain unchanged',()=>{
  const ap=outsideRope(a),bp=outsideRope(b),tol=.00003;
  const same=(p,list)=>list.some(q=>p.every((v,i)=>Math.abs(v-q[i])<tol));
  assert(ap.every(p=>same(p,bp))&&bp.every(p=>same(p,ap)),'rope outside X=-54 m changed');
  return {beforeVertices:ap.length,afterVertices:bp.length,toleranceMetres:tol,boundaryX:L.tail+7};
});
check('Four physical cylinders and sheaves replace their old proxies',()=>{
  for(const prefix of ['reeving.tls-cylinder.','reeving.hoist-sheave.back-reach.'])for(let i=1;i<=4;i++){
    const n=now.get(prefix+i);assert(n.modes.includes('overall')&&n.modes.includes('technical'));assert.equal(n.parentKey,'container.back-reach');
    assert(!n.instancing.gltfNodeName.startsWith('reference.')); const z=(n.bounds.min[2]+n.bounds.max[2])/2;assert(Math.abs(z-L.zs[i-1])<1e-5);
  }
});
const report={baseline,revision:after.revision,passed:results.filter(r=>r.pass).length,total:results.length,results};
fs.writeFileSync('docs/evidence/U1/backreach-c71/scope-and-dimensions.json',JSON.stringify(report,null,2)+'\n');
if(report.passed!==report.total)process.exitCode=1;
