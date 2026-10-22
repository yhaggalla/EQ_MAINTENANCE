import fs from 'node:fs';
import * as T from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';

export const appearance={
  status:'photo-referenced',revision:2,
  display:'CICT red steelwork, white enclosures, yellow spreader, black/yellow guards and photo-readable signage',
  palette:{structure:'#cc1930',enclosures:'#e7ecee',spreader:'#e7b52d',hazardYellow:'#f6bf26',hazardBlack:'#171b20',cictBlue:'#075578',lettering:'#111820'},
  sourcePhotos:['maxresdefault.jpg','images.jpg','images (1).jpg','story-11.webp','IMG_20171109_140808.jpg','IMG_20171109_141902.jpg','IMG_20171109_141914.jpg'],
  qualifications:['Photographic colour match; no measured RAL or coating specification supplied.','CICT flag uses the unchanged user-supplied PNG; panel dimensions and placement are estimated from the photos.','ZPMC lettering reconstructed from the photograph; fine emblem/text details unavailable.','No photographed fleet number is adopted as an equipment identity.'],
  flag:'CICT company flag',flagPlacement:'CICT-marked upper girder panels visible in maxresdefault.jpg; dimensions estimated',flagArtwork:'RTG drawings/04a76ac3-a3c0-494b-bbc9-2f5859c38600.png'
};
const font=new FontLoader().parse(JSON.parse(fs.readFileSync(new URL('./artwork/helvetiker_bold.typeface.json',import.meta.url),'utf8')));
export function addAppearance(B,{S,G,R,E}){
  const top=R-80,beamY=top-E.girderDepth/2;
  // A face coordinate system always reads left-to-right when viewed from outside.
  const point=(c,face,u,v,offset=0)=>face==='front'?[c[0]+u,c[1]+v,c[2]+offset]:face==='rear'?[c[0]-u,c[1]+v,c[2]-offset]:face==='right'?[c[0]+offset,c[1]+v,c[2]-u]:[c[0]-offset,c[1]+v,c[2]+u];
  const provenance=()=>({kind:'estimated',sources:[{document:'PHOTO:maxresdefault.jpg / images (1).jpg / IMG_20171109_141914.jpg',imageRegion:'steelwork, beam signs, spreader and wheel guards',note:'User supplied appearance authority; placement and colour estimated from perspective photographs.'}]});
  const finish=(key,type,args,g,color)=>{B.put(key,type,args,g,color);B.recipes.at(-1).provenance=provenance();B.recipes.at(-1).confidence='medium';};
  const polygon=(key,c,face,pts,color,offset=0)=>{const shape=new T.Shape(pts.map(p=>new T.Vector2(...p))),g=new T.ShapeGeometry(shape);const a=g.attributes.position;for(let i=0;i<a.count;i++){const p=point(c,face,a.getX(i),a.getY(i),offset);a.setXYZ(i,...p.map(v=>v/1000));}g.computeVertexNormals();finish(key,'painted-polygon',{centre:c,face,points:pts,color,offset},g,color);};
  const rect=(key,c,face,w,h,color,offset=0)=>polygon(key,c,face,[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],color,offset);
  const text=(key,c,face,value,w,h,color,offset=3)=>{const g=new T.ShapeGeometry(font.generateShapes(value,100),3);g.computeBoundingBox();const b=g.boundingBox,size=b.getSize(new T.Vector3()),s=Math.min(w/size.x,h/size.y),a=g.attributes.position;for(let i=0;i<a.count;i++){const p=point(c,face,(a.getX(i)-(b.min.x+b.max.x)/2)*s,(a.getY(i)-(b.min.y+b.max.y)/2)*s,offset);a.setXYZ(i,...p.map(v=>v/1000));}g.computeVertexNormals();finish(key,'painted-lettering',{centre:c,face,text:value,width:w,height:h,color,offset,artwork:'Photo-readable lettering; reconstructed with bundled vector font'},g,color);};
  for(const side of[-1,1]){
    const face=side>0?'front':'rear',key=`structure.girder.${side>0?'front':'rear'}`,z=side*(G+E.girderWidth/2+8),at=x=>[side*x,beamY,z];
    rect(key,at(-7600),face,2300,880,'#f5f5e9');text(key,at(-7600),face,'40.5t',2100,690,'#111820');
    rect(key,at(4800),face,1400,1300,'#f7f7ef');
    rect(key,at(9400),face,1550,820,'#f5f5e9');text(key,[side*9400,beamY+60,z],face,'ZPMC',1370,420,'#277763');
    // The PNG is embedded unchanged; UVs reference it through a flag-shaped display mesh.
    const data=JSON.parse(fs.readFileSync(new URL('./artwork/cict-flag.mesh.json',import.meta.url),'utf8')),c=at(4800),width=1400,height=1400;
    const shape=new T.Shape(data.outline.map(([x,y])=>new T.Vector2(x,data.height-y))),g=new T.ShapeGeometry(shape),a=g.attributes.position,uv=[];
    for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);uv.push(x/data.width,1-y/data.height);const p=point(c,face,(x/data.width-.5)*width,(y/data.height-.5)*height,5);a.setXYZ(i,...p.map(v=>v/1000));}
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();finish(key,'painted-company-flag',{centre:c,face,width,height,source:data.source,identity:'CICT',imageUnchanged:true,display:'Source artwork clipped by geometry to omit its surrounding checkerboard'},g,'cictFlag');B.recipes.at(-1).provenance={kind:'estimated',sources:[{document:data.source,note:'User supplied company flag; girder panel location from supplied photo; dimensions estimated.'}]};
  }
  // Photograph-supported collision guards are open above the wheel, with striped outer end plates.
  const clip=(pts,axis,limit,keepAbove)=>{const result=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],ai=keepAbove?a[axis]>=limit:a[axis]<=limit,bi=keepAbove?b[axis]>=limit:b[axis]<=limit;if(ai)result.push(a);if(ai!==bi){const t=(limit-a[axis])/(b[axis]-a[axis]);result.push(a.map((v,j)=>v+(b[j]-v)*t));}}return result;};
  function hazard(key,c,face,w,h){rect(key,c,face,w,h,'#f6bf26');const pitch=430;for(let x=-w/2-h;x<w/2+h;x+=pitch){let p=[[x,-h/2],[x+pitch*.5,-h/2],[x+pitch*.5+h,h/2],[x+h,h/2]];for(const[axis,limit,above]of[[0,-w/2,true],[0,w/2,false],[1,-h/2,true],[1,h/2,false]])p=clip(p,axis,limit,above);if(p.length>=3)polygon(key,c,face,p,'#171b20',3);}}
  // User's annotated view requests matching guards for both tyres of every equalizer.
  for(const sx of[-1,1])for(const sz of[-1,1])for(const pair of[-1,1]){
    const id=`${sx<0?'left':'right'}.${sz<0?'rear':'front'}`,key=`gantry.equalizer.${id}`,wheelZ=sz*3950+pair*1400,z=wheelZ+pair*970,c=[sx*S,870,z];
    hazard(key,c,pair>0?'front':'rear',1390,850);
    for(const dx of[-680,680])B.beam(key,[sx*S+dx,1300,z],[sx*S+dx,2380,wheelZ],50,70,'structure');
    for(const dx of[-1,1])hazard(key,[sx*S+dx*695,870,wheelZ],dx>0?'right':'left',1860,850);
  }
  // Red suspension frame and yellow spreader are visible in all supplied overview photos.
  for(const n of B.nodes){if(n.key.startsWith('structure.')||n.key.startsWith('spreader.')||n.key.startsWith('headblock.')||n.key.startsWith('gantry.equalizer.')||n.enclosure)n.appearanceSource={kind:'estimated',photos:appearance.sourcePhotos,paintSpec:'unavailable',note:'Photo-referenced paint; does not change mechanical provenance or equipment identity'};}
}
