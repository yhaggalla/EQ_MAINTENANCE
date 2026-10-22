import fs from 'node:fs';
// Add the unchanged PNG to the exported GLB's BIN chunk. Avoids authoring-time DOM APIs.
export function embedArtwork(glb){
  const jsonLength=glb.readUInt32LE(12),json=JSON.parse(glb.subarray(20,20+jsonLength).toString('utf8').trim()),binStart=20+jsonLength+8;
  const bytes=fs.readFileSync(new URL('../source/artwork/cict-flag-source.png',import.meta.url)),align=n=>Math.ceil(n/4)*4,offset=align(json.buffers[0].byteLength),bin=Buffer.alloc(align(offset+bytes.length));
  glb.copy(bin,0,binStart,binStart+json.buffers[0].byteLength);bytes.copy(bin,offset);json.buffers[0].byteLength=bin.length;
  const bufferView=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length});
  json.images=[{name:'User supplied CICT company flag',mimeType:'image/png',bufferView}];json.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];json.textures=[{sampler:0,source:0}];
  const material=json.materials.find(m=>m.name==='cictFlag');if(!material)throw Error('Missing CICT flag material');material.pbrMetallicRoughness.baseColorTexture={index:0};
  const text=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(align(text.length),32);text.copy(padded);const result=Buffer.alloc(12+8+padded.length+8+bin.length);
  result.writeUInt32LE(0x46546c67,0);result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);result.writeUInt32LE(padded.length,12);result.writeUInt32LE(0x4e4f534a,16);padded.copy(result,20);
  const pos=20+padded.length;result.writeUInt32LE(bin.length,pos);result.writeUInt32LE(0x004e4942,pos+4);bin.copy(result,pos+8);return result;
}
