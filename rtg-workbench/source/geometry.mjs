import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sources } from './parameters.mjs';
const V = a => new T.Vector3(...a.map(x=>x/1000));
export const mats = {
  structure:new T.MeshStandardMaterial({color:'#929ea7',roughness:.72,metalness:.28}),
  metal:new T.MeshStandardMaterial({color:'#c0c8cd',roughness:.5,metalness:.6}),
  dark:new T.MeshStandardMaterial({color:'#414b55',roughness:.64,metalness:.25}),
  rubber:new T.MeshStandardMaterial({color:'#303740',roughness:.95}),
  white:new T.MeshStandardMaterial({color:'#e7ecee',roughness:.7}),
  glass:new T.MeshStandardMaterial({color:'#65899d',roughness:.2,metalness:.15,transparent:true,opacity:.36,depthWrite:false,side:T.DoubleSide}),
  marker:new T.MeshStandardMaterial({color:'#a8b5bb',roughness:.8,wireframe:true}),
};
Object.entries(mats).forEach(([k,m])=>m.name=k);
function clean(g) { for(const k of Object.keys(g.attributes)) if(!['position','normal'].includes(k))g.deleteAttribute(k); if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.clearGroups();return g; }
export class Builder {
  constructor(){this.root=new T.Group();this.root.name='rtg-zp12-1874';this.nodes=[];this.objects=new Map();this.recipes=[];this.pending=new Map();}
  node(key,label,parent=null,sub=null,source='structure',kind='position',extra={}){
    const g=new T.Group();g.name=key;g.userData={nodeKey:key,...extra.userData};
    (parent?this.objects.get(parent):this.root).add(g);this.objects.set(key,g);
    const n={key,kind,label,parentKey:parent,classification:sub?{main:sub.slice(0,2),sub}:null,gltfNodeNames:[key],instancing:null,pickable:kind!=='decorative',pickPriority:kind==='position'?50:10,modes:['overall','technical'],provenance:{kind:'estimated',sources:[sources[source]]},qualifier:'Provisional geometry; see source dimensions',cameraHint:null,...extra};
    delete n.userData;this.nodes.push(n);this.pending.set(key,new Map());return key;
  }
  container(key,label,parent,source,extra={}){return this.node(key,label,parent,null,source,'container',extra);}
  put(k,type,args,g,material='structure'){
    if(material==='metal') material='structure'; // same neutral inspection finish; merge batches without removing geometry
    this.recipes.push({nodeKey:k,primitive:type,parameters:args,authoringUnits:'mm',coordinateSpace:'semantic node local; parent transforms in scene',provenance:this.nodes.find(n=>n.key===k).provenance,confidence:'low-to-medium',endpoints:'Explicit centres/sizes or endpoints in parameters; shape not manufacturing authority'});
    const groups=this.pending.get(k);if(!groups.has(material))groups.set(material,[]);groups.get(material).push(clean(g));return g;
  }
  box(k,c,s,mat='structure'){return this.put(k,'box',{centre:c,size:s},new T.BoxGeometry(...s.map(x=>x/1000)).translate(...c.map(x=>x/1000)),mat);}
  beam(k,a,b,w,d,mat='structure'){
    const A=V(a),B=V(b),g=new T.BoxGeometry(w/1000,A.distanceTo(B),d/1000);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());return this.put(k,'beam',{a,b,width:w,depth:d},g,mat);
  }
  tube(k,a,b,r,mat='metal',segments=12){const A=V(a),B=V(b),g=new T.CylinderGeometry(r/1000,r/1000,A.distanceTo(B),segments);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),B.clone().sub(A).normalize()));g.translate(...A.add(B).multiplyScalar(.5).toArray());return this.put(k,'cylinder',{a,b,radius:r,radialSegments:segments},g,mat);}
  cyl(k,c,axis,r,len,mat='metal',seg=24){const a=[...c],b=[...c],i={x:0,y:1,z:2}[axis];a[i]-=len/2;b[i]+=len/2;return this.tube(k,a,b,r,mat,seg);}
  ring(k,c,axis,r,t,mat='dark',seg=32){const g=new T.TorusGeometry(r/1000,t/1000,6,seg);if(axis==='x')g.rotateY(Math.PI/2);if(axis==='y')g.rotateX(Math.PI/2);g.translate(...c.map(x=>x/1000));return this.put(k,'ring',{centre:c,axis,radius:r,tubeRadius:t,segments:seg},g,mat);}
  poly(k,pts,thickness,centreX,mat='structure'){
    // Profile coordinates are [Z,Y]; extrusion gives the actual chamfered/equalizer silhouette.
    const shape=new T.Shape();pts.forEach(([z,y],i)=>i?shape.lineTo(z/1000,y/1000):shape.moveTo(z/1000,y/1000));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:thickness/1000,bevelEnabled:false,steps:1});g.rotateY(-Math.PI/2);g.translate((centreX+thickness/2)/1000,0,0);return this.put(k,'profile-extrusion',{profileZY:pts,thickness,centreX},g,mat);
  }
  loft(k,a,b,wa,da,wb,db,mat='structure'){
    const corners=(c,w,d)=>[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]].map(p=>p.map((v,i)=>(v+c[i])/1000));const p=[...corners(a,wa,da),...corners(b,wb,db)],idx=[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7];const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(idx.flatMap(i=>p[i]),3));g.computeVertexNormals();return this.put(k,'tapered-box-member',{bottom:a,top:b,bottomWidth:wa,bottomDepth:da,topWidth:wb,topDepth:db},g,mat);
  }
  tyre(k,diam,width){const r=diam/2,w=width/2;const points=[[430,-w*.85],[r*.82,-w],[r*.96,-w*.7],[r,-w*.32],[r,w*.32],[r*.96,w*.7],[r*.82,w],[430,w*.85]].map(([x,y])=>new T.Vector2(x/1000,y/1000));const g=new T.LatheGeometry(points,40);g.rotateZ(Math.PI/2);this.put(k,'tyre-lathe',{diameter:diam,width,profile:'rounded shoulder, nominal bore; unloaded contour unknown',radialSegments:40},g,'rubber');
    // Low-profile tread chevrons are simplified surface details, not a tyre-manufacturer pattern.
    for(let i=0;i<32;i++){const ang=i*Math.PI/16;for(const side of[-1,1]){const A=[side*35,Math.cos(ang)*(r-25),Math.sin(ang)*(r-25)],B=[side*(w-70),Math.cos(ang+.055)*(r-30),Math.sin(ang+.055)*(r-30)];this.beam(k,A,B,20,25,'rubber');}}
  }
  rail(k,points,height=1100){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];for(const h of[height,height*.5])this.tube(k,[a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],22,'metal',6);const len=Math.hypot(...a.map((v,j)=>v-b[j])),count=Math.max(1,Math.ceil(len/1500));for(let j=0;j<=count;j++){const p=a.map((v,c)=>v+(b[c]-v)*j/count);this.tube(k,p,[p[0],p[1]+height,p[2]],22,'metal',6);}}}
  flush(){for(const[k,groups]of this.pending){for(const[mat,geos]of groups){if(!geos.length)continue;const merged=mergeGeometries(geos,false);const mesh=new T.Mesh(merged,mats[mat]);mesh.name=k+'--'+mat;this.objects.get(k).add(mesh);geos.forEach(g=>g.dispose());}}this.pending.clear();this.root.updateMatrixWorld(true);}
}
