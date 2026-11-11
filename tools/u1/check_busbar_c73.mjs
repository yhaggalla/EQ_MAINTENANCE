// C73: compare with saved revision 10; only the cable-system geometry may change.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base=process.argv[2]||'tmp/busbar-c73-before',cur='artifacts/models/cict-j526a-sts-scene/1';
const before=JSON.parse(fs.readFileSync(base+'/manifest.json')),after=JSON.parse(fs.readFileSync(cur+'/manifest.json'));
const old=new Map(before.nodes.map(n=>[n.key,n])),now=new Map(after.nodes.map(n=>[n.key,n])),key='trolley.cable-system.main';
const results=[],check=(name,fn)=>{try{const detail=fn();results.push({name,pass:true,detail});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL '+name+': '+e.message);}};
check('Every identity and classification retained; only the system area parent changes',()=>{
 assert.deepEqual([...old.keys()].sort(),[...now.keys()].sort());for(const [k,o]of old){const n=now.get(k);for(const f of ['kind','classification','positionKind','uom'])assert.deepEqual(n[f],o[f],k+' '+f);assert.equal(n.parentKey,k===key?'container.trolley-runway':o.parentKey);}
 return {nodes:now.size,positions:after.nodes.filter(n=>n.kind==='position').length};
});
check('Busbar is under the boom, connection datum follows the cabin, old rear-girder sample is absent',()=>{
 const n=now.get(key),p=JSON.parse(fs.readFileSync('assets/models/source/cict-j526a-sts/params.json')).params,P=k=>p[k].mm/1000;
 assert(n.bounds.min[0]>0);assert(n.bounds.max[0]<P('boomLength'));assert(n.bounds.max[1]<=P('girderUndersideElevation')+.00001);
 assert.equal(n.hotspot.point[0],P('trolleyPositionX')-P('cabinOffsetLandside')-P('cabinLengthX')+P('busbarCabConnectionFromRear'));
 assert(Math.abs(n.hotspot.point[1]-(P('cabinFloorElevation')+P('cabinBodyHeight')-P('busbarCabConnectionBelowRoof')))<1e-8);
 assert(n.modes.includes('overall')&&n.modes.includes('technical'));assert(/confirmed by user/.test(n.qualifier));return {bounds:n.bounds,connection:n.hotspot.point};
});
function glb(file){const b=fs.readFileSync(file),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len));return{j,bin:b.subarray(28+len)};}
function accessor(g,id){const a=g.j.accessors[id],v=g.j.bufferViews[a.bufferView];return{meta:{componentType:a.componentType,type:a.type,count:a.count,byteStride:v.byteStride},bytes:g.bin.subarray((v.byteOffset||0)+(a.byteOffset||0),(v.byteOffset||0)+(a.byteOffset||0)+v.byteLength)};}
function meshDigest(g,n){const h=crypto.createHash('sha256');h.update(JSON.stringify([n.translation,n.rotation,n.scale,n.matrix]));
  for(const q of g.j.meshes[n.mesh].primitives){h.update(JSON.stringify(g.j.materials[q.material]));for(const [k,id]of Object.entries(q.attributes).sort()){const a=accessor(g,id);h.update(k+JSON.stringify(a.meta));h.update(a.bytes);}if(q.indices!==undefined)h.update(accessor(g,q.indices).bytes);}
  const ext=n.extensions?.EXT_mesh_gpu_instancing; if(ext)for(const [k,id]of Object.entries(ext.attributes).sort()){h.update(k);h.update(accessor(g,id).bytes);}return h.digest('hex');}


const a=glb(base+'/scene.glb'),b=glb(cur+'/scene.glb');
check('Only the identified cable-system mesh changes; TLS, cabin, all other assemblies and ropes are byte-identical',()=>{
 const bn=new Map(b.j.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n])),an=new Map(a.j.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n]));
 assert.deepEqual([...an.keys()].sort(),[...bn.keys()].sort());let count=0;
 for(const [k,n]of an)if(k!==key){assert.equal(meshDigest(a,n),meshDigest(b,bn.get(k)),k);count++;}
 assert.notEqual(meshDigest(a,an.get(key)),meshDigest(b,bn.get(key)));return {unchangedMeshes:count};
});
const report={baseline:base,revision:after.revision,passed:results.filter(r=>r.pass).length,total:results.length,results};
fs.writeFileSync('docs/evidence/U1/busbar-c73/scope-and-placement.json',JSON.stringify(report,null,2)+'\n');if(report.passed!==report.total)process.exitCode=1;
