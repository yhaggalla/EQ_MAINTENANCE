import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
/** Tangent in the vertical rope plane. Centre / lower endpoint and radius are metres. */
export function ropeTangent(centre,lower,radius){
  const c=new T.Vector3(...centre),b=new T.Vector3(...lower),q=b.clone().sub(c),d=q.length(),u=q.clone().normalize();
  const axis=new T.Vector3(q.z,0,-q.x).normalize();if(!axis.lengthSq())axis.set(1,0,0);
  const v=new T.Vector3().crossVectors(axis,u).normalize();
  return c.addScaledVector(u,radius*radius/d).addScaledVector(v,radius*Math.sqrt(Math.max(0,1-radius*radius/(d*d))));
}
/** A rigid socket/turnbuckle pivots at the headblock pin and stays collinear with its loaded rope. */
export function ropeConnection(data,height){
  const pin=new T.Vector3(...(data.headblockPin||data.endOffset));pin.y+=height;
  const a=ropeTangent(data.sheaveCentre,pin.toArray(),data.sheaveRadius),direction=a.clone().sub(pin).normalize();
  const b=pin.clone().addScaledVector(direction,data.socketLength||0);
  return{a,b,pin,direction};
}
/** A fall-sheave wrap ends at the moving tangent, rather than extending past it at low lift. */
export function ropeWrapGeometry(data,height,existing){
  const c=new T.Vector3(...data.sheaveCentre),u=new T.Vector3(...data.planeOut),up=new T.Vector3(0,1,0),axis=new T.Vector3().crossVectors(u,up);
  const tangent=ropeConnection(data,height).a.sub(c);
  const to=Math.atan2(tangent.y,tangent.dot(u)),segments=24,radial=6;
  const g=existing||new T.TorusGeometry(data.sheaveRadius,data.ropeRadius,radial,segments);
  if(!existing){const a=g.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];}
  const p=g.attributes.position,n=g.attributes.normal;
  for(let j=0;j<=radial;j++)for(let i=0;i<=segments;i++){
    const t=data.arrivalAngle+(to-data.arrivalAngle)*i/segments,ph=j/radial*Math.PI*2;
    const normal=u.clone().multiplyScalar(Math.cos(t)*Math.cos(ph)).addScaledVector(up,Math.sin(t)*Math.cos(ph)).addScaledVector(axis,Math.sin(ph));
    const point=c.clone().addScaledVector(u,Math.cos(t)*data.sheaveRadius).addScaledVector(up,Math.sin(t)*data.sheaveRadius).addScaledVector(normal,data.ropeRadius),k=j*(segments+1)+i;
    p.setXYZ(k,...point.toArray());n.setXYZ(k,...normal.toArray());
  }
  p.needsUpdate=true;n.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();return g;
}
/** Constant-length U carrier: fixed lower anchor x=0; moving upper anchor x=trolleyX. */
const link=new T.BoxGeometry(.105,.075,.32);link.deleteAttribute('uv');link.clearGroups();
export function chainGeometry(trolleyX,y,z,existing){
  const r=.3,L=12,turn=(L+trolleyX)/2,arc=Math.PI*r,total=L+arc;
  const at=s=>s<turn?new T.Vector3(s,y,z):s<turn+arc?new T.Vector3(turn+r*Math.sin((s-turn)/r),y+r-r*Math.cos((s-turn)/r),z):new T.Vector3(turn-(s-turn-arc),y+2*r,z);
  const count=104,base=link.attributes.position,normal=link.attributes.normal;
  const merged=existing||mergeGeometries(Array.from({length:count},()=>link),false),positions=merged.attributes.position,normals=merged.attributes.normal,v=new T.Vector3(),q=new T.Quaternion();
  for(let i=0;i<count;i++){const a=at(total*i/count),b=at(total*(i+1)/count),mid=a.clone().add(b).multiplyScalar(.5),dir=b.clone().sub(a).normalize();q.setFromUnitVectors(new T.Vector3(1,0,0),dir);
    for(let j=0;j<base.count;j++){v.fromBufferAttribute(base,j).applyQuaternion(q).add(mid);positions.setXYZ(i*base.count+j,v.x,v.y,v.z);v.fromBufferAttribute(normal,j).applyQuaternion(q);normals.setXYZ(i*base.count+j,v.x,v.y,v.z);}
  }
  positions.needsUpdate=true;normals.needsUpdate=true;merged.computeBoundingBox();merged.computeBoundingSphere();return merged;
}
