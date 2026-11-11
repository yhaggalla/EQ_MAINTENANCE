import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const base='tmp/cabin-c75-before',cur='artifacts/models/cict-j526a-sts-scene/1';
const before=JSON.parse(fs.readFileSync(base+'/manifest.json')),after=JSON.parse(fs.readFileSync(cur+'/manifest.json'));
function glb(file){const b=fs.readFileSync(file),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len));return{j,bin:b.subarray(28+len)};}
function accessor(g,id){const a=g.j.accessors[id],v=g.j.bufferViews[a.bufferView];return{meta:{componentType:a.componentType,type:a.type,count:a.count,byteStride:v.byteStride},bytes:g.bin.subarray((v.byteOffset||0)+(a.byteOffset||0),(v.byteOffset||0)+(a.byteOffset||0)+v.byteLength)};}
function meshDigest(g,n,instances=true){const h=crypto.createHash('sha256');h.update(JSON.stringify([n.translation,n.rotation,n.scale,n.matrix]));for(const q of g.j.meshes[n.mesh].primitives){h.update(JSON.stringify(g.j.materials[q.material]));for(const [k,id]of Object.entries(q.attributes).sort()){const a=accessor(g,id);h.update(k+JSON.stringify(a.meta));h.update(a.bytes);}if(q.indices!==undefined)h.update(accessor(g,q.indices).bytes);}if(instances)for(const [k,id]of Object.entries(n.extensions?.EXT_mesh_gpu_instancing?.attributes||{}).sort()){h.update(k);h.update(accessor(g,id).bytes);}return h.digest('hex');}
const a=glb(base+'/scene.glb'),b=glb(cur+'/scene.glb');
const an=new Map(a.j.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n])),bn=new Map(b.j.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n]));

assert.deepEqual(before.nodes.map(n=>[n.key,n.classification,n.parentKey]).sort(),after.nodes.map(n=>[n.key,n.classification,n.parentKey]).sort());
const changed=new Set(['cabin.operator.main','cabin.operator.consoles','cabin.air-conditioning','access.stair.landside-leg-b','reference.trolley.instanced']);let unchanged=0;
for(const [key,node]of an)if(!changed.has(key)){assert.equal(meshDigest(a,node),meshDigest(b,bn.get(key)),key);unchanged++;}
const cab=after.nodes.find(n=>n.key==='cabin.operator.main');assert(cab.bounds.min[2]<-3.49&&cab.bounds.max[2]<1.17);
for(const key of ['cabin.access-gate.switches.1','cabin.access-gate.switches.2'])assert(after.nodes.find(n=>n.key===key).bounds.max[2]<0);
const report={pass:true,revision:after.revision,identities:after.nodes.length,unchangedMeshes:unchanged,busbar:'byte-identical',TLSAndRopes:'byte-identical',entranceSide:'-Z elevator side',homeStation:'estimated; current cabin display remains at outreach'};
fs.writeFileSync('docs/evidence/U1/cabin-c75/scope.json',JSON.stringify(report,null,2)+'\n');console.log(report);
