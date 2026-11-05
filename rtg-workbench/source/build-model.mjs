import * as T from 'three';
import {Builder,mats} from './geometry.mjs';
import {dimensions as D,estimates as E,sources} from './parameters.mjs';
import {ropeTangent,chainGeometry} from '../viewer/kinematics.mjs';
import {addAppearance} from './appearance.mjs';

// Revision 2: 300 selectable parts (position + qualified hotspot nodes). Spatial containers are extra.
// Coordinates are millimetres: +X across span / trolley travel, +Y up, +Z gantry travel (front).
export const PART_TARGET=300;
const SIDES=[[-1,'left'],[1,'right']],ENDS=[[-1,'rear'],[1,'front']];
const words=id=>id.replaceAll('.',' ');
// Monotone-chain convex hull of [z,y] points, for profile extrusions that wrap two circles.
const hull2=pts=>{const p=[...pts].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),x=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const q of p){while(lo.length>1&&x(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.reverse()){while(up.length>1&&x(up.at(-2),up.at(-1),q)<=0)up.pop();up.push(q);}return[...lo.slice(0,-1),...up.slice(0,-1)];};
const title=s=>s.charAt(0).toUpperCase()+s.slice(1);

export function buildModel(){
  const B=new Builder(),P=k=>D[k].value,S=D.span.value/2,Z=D.base.value/2,G=P('gauge')/2,R=P('railHeight'),top=R-P('railSection');
  const part=(key,label,parent,sub,source,extra)=>B.node(key,label,parent,sub,source,'position',extra);
  const legTop=top-E.girderDepth;
  // Leg centreline and half-widths at height y (the leg lofts from sill top to girder underside).
  const legAt=(sz,y)=>{const t=(y-E.sillTop)/(legTop-E.sillTop);return{z:sz*(Z+(G-Z)*t),hx:(E.legBottomWidthX+(E.legTopWidthX-E.legBottomWidthX)*t)/2,hz:(E.legBottomWidthZ+(E.legTopWidthZ-E.legBottomWidthZ)*t)/2};};
  const root=B.container('container.crane','ZP12-1874 RTG',null,'structure');

  // ── Gantry frame: two box girders, four tapered legs, two sills, two brace bars (Pic 2-3) ──
  const frame=B.container('container.frame','Gantry frame',root,'structure');
  for(const[sz,id]of ENDS){
    const z=sz*G,k=part(`structure.girder.${id}`,`${title(id)} main box girder`,frame,'151','structure');
    B.box(k,[0,top-E.girderDepth/2,z],[E.girderLength,E.girderDepth,E.girderWidth]);
    for(const dy of[0,-E.girderDepth])B.box(k,[0,top+dy,z],[E.girderLength,35,E.girderWidth+70]);
    for(const sx of[-1,1])B.box(k,[sx*(E.girderLength/2+15),top-E.girderDepth/2,z],[30,E.girderDepth+40,E.girderWidth+70]);
    const rail=part(`trolley.rail.${id}`,`${title(id)} trolley rail · 80 × 80 square bar`,frame,'021','trolley');B.box(rail,[0,R-40,z],[E.girderLength,80,80],'metal');
    const clips=part(`trolley.rail-clips.${id}`,`${title(id)} rail clips and fixing plates`,frame,'021','frameDetail');
    for(let x=-11800;x<=11801;x+=1475)for(const s of[-1,1])B.box(clips,[x,top+15,z+s*95],[160,30,90],'metal');
    for(const[sx,side]of SIDES){
      const stop=part(`trolley.buffer.${id}.${side}`,`${title(id)} ${side} trolley end buffer`,frame,'021','trolley');B.box(stop,[sx*12000,R+350,z],[100,800,400]);B.cyl(stop,[sx*11750,R+400,z],'x',150,400,'rubber');
      const ear=part(`structure.lifting-ear.${id}.${side}`,`${title(id)} ${side} buffer support / lifting ear`,frame,'151','frameDetail');
      B.box(ear,[sx*(E.girderLength/2+60),top-650,z],[60,800,420]);B.ring(ear,[sx*(E.girderLength/2+95),top-650,z],'x',110,28,'dark',24);B.box(ear,[sx*11900,R+20,z],[500,40,500]);
    }
    const sw=part(`trolley.limit-switch.${id==='rear'?'left':'right'}`,`Trolley travel limit switch · ${id==='rear'?'left':'right'} end`,frame,'021','gaItems');
    const sx=id==='rear'?-1:1;B.box(sw,[sx*10900,R+110,-(G+250)],[260,300,200],'dark');B.tube(sw,[sx*10900,R+260,-(G+250)],[sx*10900,R+560,-(G+120)],15,'metal',6);B.cyl(sw,[sx*10900,R+580,-(G+110)],'z',45,40,'rubber',12);
  }
  for(const[sx,side]of SIDES){
    const x=sx*S,sill=part(`structure.sill.${side}`,`${title(side)} sill beam`,frame,'151','structure');B.box(sill,[x,E.sillTop-E.sillDepth/2,0],[E.sillWidth,E.sillDepth,E.sillLength]);
    for(const[sz,end]of ENDS){
      const id=`${side}.${end}`,leg=part(`structure.leg.${id}`,`${title(side)} ${end} tapered box leg`,frame,'151','structure');
      B.loft(leg,[x,E.sillTop,sz*Z],[x,legTop,sz*G],E.legBottomWidthX,E.legBottomWidthZ,E.legTopWidthX,E.legTopWidthZ);
      const foot=part(`structure.leg-foot.${id}`,`${title(side)} ${end} leg-to-sill flange joint`,frame,'151','frameDetail');B.box(foot,[x,E.sillTop+70,sz*Z],[950,100,1000]);
      for(const dx of[-1,1])for(const dz of[-1,1])B.box(foot,[x+dx*390,E.sillTop+270,sz*Z+dz*430],[30,300,140]);
      const head=part(`structure.leg-head.${id}`,`${title(side)} ${end} leg-to-girder knee joint`,frame,'151','frameDetail');B.box(head,[x,legTop-40,sz*G],[1300,80,1000]);
      for(const dx of[-1,1])B.beam(head,[x+dx*560,legTop-950,sz*G],[x+dx*640,legTop-80,sz*G],40,780);
      // Sill-end lifting lugs are welded to the sill beam, so they belong to that part (frees 4 parts for the jacks).
      B.box(sill,[x,E.sillTop-E.sillDepth/2,sz*(E.sillLength/2+30)],[320,380,60]);B.ring(sill,[x,E.sillTop-E.sillDepth/2,sz*(E.sillLength/2+62)],'z',85,26,'dark',24);
    }
    const braceZ=legAt(1,E.braceY).z-legAt(1,E.braceY).hz-60;
    const brace=part(`structure.brace.${side}`,`${title(side)} upper transverse brace bar and end clevises`,frame,'151','structure');B.tube(brace,[x,E.braceY,-braceZ],[x,E.braceY,braceZ],E.braceDiameter/2);
    for(const[sz]of ENDS){const c=brace;B.box(c,[x,E.braceY,sz*braceZ],[420,450,120]);B.cyl(c,[x,E.braceY,sz*(braceZ-110)],'x',45,500,'dark');for(const dx of[-1,1])B.box(c,[x+dx*170,E.braceY,sz*(braceZ-110)],[30,300,220]);}
  }
  // Name-plate arrangement (JL28605) panels; artwork and lettering added by appearance.mjs.
  for(const[,id]of ENDS){part(`auxiliary.nameplate.capacity.${id}`,`${title(id)} girder 40.5t capacity and ZPMC maker signs`,frame,'171','gaItems');part(`auxiliary.flag.${id}`,`${title(id)} girder CICT company flag panel`,frame,'171','gaItems');}

  // ── Lighting, signals and sensors (M14 p14 safety/signal list; GA item 13) ──
  // Leg LED floodlights: black rectangular panels low on each leg, facing the gantry travel direction (WA-25, WA-26).
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){const y=6200,L=legAt(sz,y),x=sx*S,z=L.z+sz*(L.hz+90);const k=part(`auxiliary.floodlight.leg.${side}.${end}`,`${title(side)} ${end} leg LED travel floodlight`,frame,'131','sitePhotos');B.box(k,[x,y,z],[820,320,150],'dark');B.box(k,[x,y,z+sz*80],[760,260,12],'glass');for(const dx of[-1,1])B.box(k,[x+dx*300,y+190,L.z+sz*(L.hz+30)],[60,140,60],'dark');}
  for(const[sx,side]of SIDES){const k=part(`auxiliary.travel-beacon.${side}`,`${title(side)} gantry-travel warning beacon`,frame,'131','safety');const x=sx*(S+E.sillWidth/2+110);B.box(k,[x,E.sillTop-90,4250],[220,60,220],'dark');B.cyl(k,[x,E.sillTop+40,4250],'y',95,200,'#f0a020',16);B.cyl(k,[x,E.sillTop+160,4250],'y',70,40,'dark',16);}
  const mast=part('auxiliary.gps.mast','GPS / RCMS support mast',frame,'155','gaItems');const gx=12250,gz=1800,gy=R-60;B.box(mast,[gx,gy+15,gz],[400,30,400],'dark');B.tube(mast,[gx,gy,gz],[gx,gy+2300,gz],45,'metal',12);B.tube(mast,[gx,gy+2100,gz-650],[gx,gy+2100,gz+650],25,'metal',8);
  const gps=part('auxiliary.gps.antenna','GPS positioning antenna',frame,'155','gaItems');B.cyl(gps,[gx,gy+2360,gz],'y',120,90,'white',20);B.cyl(gps,[gx,gy+2420,gz],'y',70,40,'white',16);
  const rcms=part('auxiliary.rcms.antenna','RCMS data antenna',frame,'155','gaItems');B.tube(rcms,[gx,gy+2100,gz+650],[gx,gy+2950,gz+650],18,'white',8);B.box(rcms,[gx,gy+2060,gz+650],[120,80,120],'dark');
  const wind=part('auxiliary.anemometer.main','Wind speed indicator (anemometer)',frame,'151','safety');const ax=-12250,az=-1800;B.tube(wind,[ax,gy,az],[ax,gy+2200,az],40,'metal',10);B.box(wind,[ax,gy+2250,az],[110,110,110],'dark');for(let i=0;i<3;i++){const a=i*2*Math.PI/3,p=[ax+260*Math.cos(a),gy+2300,az+260*Math.sin(a)];B.tube(wind,[ax,gy+2300,az],p,10,'metal',6);B.cyl(wind,p,'y',55,60,'white',10);}B.box(wind,[ax+250,gy+2280,az],[380,30,40],'dark');

  // ── Eight-wheel gantry: four bogies with equalizer, two steerable wheels and one driven wheel each ──
  const gantry=B.container('container.gantry','Eight-wheel gantry',root,'gantry');
  const rSmall=P('driveSprocketPitchDiameter')/2,rLarge=P('wheelSprocketPitchDiameter')/2;
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){
    const id=`${side}.${end}`,x=sx*S,z=sz*Z,bogie=B.container(`container.bogie.${id}`,`${title(side)} ${end} bogie`,gantry,'gantry');
    const eq=part(`gantry.equalizer.${id}`,`${title(id.replace('.',' '))} equalizer beam`,bogie,'041','bogieDetail');
    // Mirrored by side: steering cylinder and link rod inboard; chain drive, lock-pin cylinder and drive platform outboard.
    const xin=x-sx*580,xout=d=>x+sx*d,sillBottom=E.sillTop-E.sillDepth;
    B.poly(eq,[[-1600+z,2820],[-1600+z,3240],[-500+z,3240],[z,3450],[500+z,3240],[1600+z,3240],[1600+z,2820]],650,x);B.box(eq,[x,(3240+sillBottom)/2,z],[550,sillBottom-3240,500]);
    const pin=part(`gantry.equalizer-pin.${id}`,`${title(words(id))} equalizer pivot pin`,bogie,'041','bogieDetail');B.cyl(pin,[x,3250,z],'x',190,950);for(const d of[-1,1])B.cyl(pin,[x+d*490,3250,z],'x',240,30,'dark',24);
    const lock=part(`gantry.lock-cylinder.${id}`,`${title(words(id))} steering lock-pin cylinder`,bogie,'045','bogieDetail');B.tube(lock,[xout(400),3080,z-700],[xout(400),3080,z-180],70,'dark',16);B.tube(lock,[xout(400),3080,z-180],[xout(400),3080,z+120],28,'metal',10);B.box(lock,[xout(400),3080,z-760],[160,200,120],'dark');
    const steer=part(`gantry.steering.${id}`,`${title(words(id))} steering cylinder`,bogie,'043','bogieDetail');B.tube(steer,[xin,2580,z-900],[xin,2580,z+600],90,'dark',16);B.tube(steer,[xin,2580,z+600],[xin,2580,z+1150],40,'metal',12);B.box(steer,[xin,2580,z-960],[200,200,120],'dark');
    const link=part(`gantry.steer-link.${id}`,`${title(words(id))} steering link rod`,bogie,'043','bogieDetail');B.beam(link,[xin,2450,z-1400],[xin,2450,z+1400],65,65,'dark');for(const d of[-1,1])B.cyl(link,[xin,2450,z+d*1400],'y',55,180,'metal',12);
    // Turning jack (site photos WA-23/24/26): one hydraulic jacking cylinder per bogie, four per RTG, centred under the
    // equalizer between the two tyres. Square guide sleeve, red barrel, chrome rod and a ribbed swivel foot just above the
    // ground. Extending it lifts the bogie so both tyres turn 16° / 90° unloaded. Shown retracted (travel position).
    const J=E.turningJack,jack=part(`gantry.turning-jack.${id}`,`${title(words(id))} turning jack · hydraulic jacking cylinder`,bogie,'045','jacking');
    B.box(jack,[x,(2820+J.sleeveBottomY)/2,z],[J.sleeveSize,2820-J.sleeveBottomY,J.sleeveSize]);B.box(jack,[x,J.sleeveBottomY+30,z],[J.sleeveSize+60,60,J.sleeveSize+60]);
    B.cyl(jack,[x,(J.sleeveBottomY+J.bodyBottomY)/2,z],'y',J.bodyRadius,J.sleeveBottomY-J.bodyBottomY,'structure',24);B.cyl(jack,[x,J.bodyBottomY+30,z],'y',J.bodyRadius+30,60,'structure',24);
    B.cyl(jack,[x,(J.bodyBottomY+J.footTopY+80)/2,z],'y',J.rodRadius,J.bodyBottomY-J.footTopY-80,'metal',20);B.cyl(jack,[x,J.footTopY+40,z],'y',J.rodRadius+40,80,'dark',16);
    B.cyl(jack,[x,J.footTopY-J.footThickness/2,z],'y',J.footRadius,J.footThickness,'dark',32);for(let i=0;i<8;i++){const a=i*Math.PI/4,c=Math.cos(a),q=Math.sin(a);B.beam(jack,[x+(J.rodRadius+30)*c,J.footTopY+70,z+(J.rodRadius+30)*q],[x+(J.footRadius-40)*c,J.footTopY+10,z+(J.footRadius-40)*q],30,30,'dark');}
    for(const d of[-1,1])B.tube(jack,[x+sx*(J.sleeveSize/2+20),2700,z+d*70],[x+sx*(J.bodyRadius+25),J.bodyBottomY+260,z+d*70],14,'dark',6);
    for(const pair of[-1,1]){
      const wz=z+pair*P('bogiePitch')/2,pos=pair===sz?'outer':'inner',wheelid=`${id}.${pos}`,wl=`${title(words(id))} ${pos}`;
      const slew=part(`gantry.slew-bearing.${wheelid}`,`${wl} slewing bearing`,bogie,'045','bogieDetail');B.cyl(slew,[x,2600,wz],'y',480,150);B.ring(slew,[x,2690,wz],'y',410,35);for(let i=0;i<16;i++){const a=i*Math.PI/8;B.cyl(slew,[x+440*Math.cos(a),2690,wz+440*Math.sin(a)],'y',18,50,'dark',6);}
      const fork=part(`gantry.wheel-fork.${wheelid}`,`${wl} wheel fork and axle housings`,bogie,'041','bogieDetail');B.box(fork,[x,2380,wz],[1100,240,1200]);
      for(const s of[-1,1]){B.poly(fork,[[wz-550,2390],[wz+550,2390],[wz+250,930],[wz-250,930]],100,x+s*420);B.cyl(fork,[x+s*440,930,wz],'x',180,120,'dark');}
      const guard=part(`gantry.guard.${wheelid}`,`${wl} tyre protective frame`,bogie,'041','bogieDetail');
      // Open rail outline; its long side is inboard, the outboard side carries the striped plate beside the chain drive.
      B.rail(guard,[[xout(650),1100,wz-930],[x-sx*650,1100,wz-930],[x-sx*650,1100,wz+930],[xout(650),1100,wz+930]],550);
      const tyre=part(`gantry.tyre.${wheelid}`,`${wl} tyre 21.00-35`,bogie,'044','gantry','position',{userData:{motionRole:'gantry-wheel',radius:P('tyreDiameter')/2000}});
      B.objects.get(tyre).position.set(x/1000,P('tyreDiameter')/2000,wz/1000);B.tyre(tyre,P('tyreDiameter'),E.tyreWidth);
      const rim=part(`gantry.rim.${wheelid}`,`${wl} rim, hub and wheel studs`,bogie,'044','gantry');B.objects.get(rim).position.set(x/1000,P('tyreDiameter')/2000,wz/1000);
      B.cyl(rim,[0,0,0],'x',E.tyreRimDiameter/2,E.tyreWidth+30,'dark',40);for(const s of[-1,1]){B.cyl(rim,[s*310,0,0],'x',210,65,'structure',32);for(let i=0;i<10;i++)B.cyl(rim,[s*348,310*Math.cos(i*Math.PI/5),310*Math.sin(i*Math.PI/5)],'x',26,38,'metal',6);}
      if(pos==='outer'){
        // Site photos WA-20/24/25/26: the drive stands at the outer end of the driven wheel, outboard, and steers with it.
        // Reducer on a fork extension; vertical grey motor with a red top cover; red chain case down to the wheel sprocket;
        // a service platform with handrail around the motor and a ladder on the bogie end face.
        const GD=E.gantryDrive,dz0=wz+sz*GD.offsetZ,dx0=xout(GD.offsetX),ry=GD.reducerY,rh=GD.reducerHeight,sy=ry,my=ry+rh/2,deckY=my-20;
        const drive=part(`gantry.drive.${id}`,`${title(words(id))} gantry reducer FVS370 · outer wheel`,bogie,'041','sitePhotos');B.box(drive,[dx0,ry,dz0],[560,rh,600]);B.cyl(drive,[xout(560),sy,dz0],'x',110,260,'dark',16);B.box(drive,[x,2380,wz+sz*(GD.offsetZ-100)],[400,240,400]);
        const motor=part(`gantry.drive-motor.${id}`,`${title(words(id))} gantry motor 25 kW with brake · vertical`,bogie,'041','sitePhotos');B.cyl(motor,[dx0,my+425,dz0],'y',240,850,'#a9b0b5',32);for(let i=0;i<7;i++)B.ring(motor,[dx0,my+80+i*115,dz0],'y',244,9,'#c9ced2',32);B.cyl(motor,[dx0,my+1025,dz0],'y',270,350,'structure',32);B.box(motor,[dx0,my+420,dz0-sz*300],[220,260,120],'#b9bfc3');{const c=[[dx0,my+300,dz0-sz*370],[dx0,my+350,sz*(E.sillLength/2+110)],[dx0,E.sillTop-E.sillDepth+250,sz*(E.sillLength/2+110)]];for(let i=0;i<2;i++)B.tube(motor,c[i],c[i+1],30,'dark',8);}
        const chain=part(`gantry.chain.${id}`,`${title(words(id))} double-strand roller chain and red chain case`,bogie,'047','gantryChain');
        const ring=(cz,cy,r)=>Array.from({length:20},(_,i)=>[cz+r*Math.cos(i*Math.PI/10),cy+r*Math.sin(i*Math.PI/10)]);
        B.poly(chain,hull2([...ring(wz,930,rLarge+60),...ring(dz0,sy,rSmall+70)]),95,x+sx*560);
        {const vz=dz0-wz,vy=sy-930,L=Math.hypot(vz,vy),nz=-vy/L,ny=vz/L,xc=xout(640);for(const sd of[-1,1])for(const off of[-18,18])B.tube(chain,[xc+off,sy+sd*ny*rSmall,dz0+sd*nz*rSmall],[xc+off,930+sd*ny*rLarge,wz+sd*nz*rLarge],14,'dark',6);}
        B.cyl(chain,[xout(640),sy,dz0],'x',rSmall,75,'metal',32);
        const plat=part(`access.drive-platform.${id}`,`${title(words(id))} drive service platform, handrail and ladder`,bogie,'151','sitePhotos');
        const zr=a=>wz+sz*a,xs=(a,b)=>[Math.min(xout(a),xout(b)),Math.max(xout(a),xout(b))],box=(xa,xb,za,zb)=>{const[x1,x2]=xs(xa,xb),z1=Math.min(zr(za),zr(zb)),z2=Math.max(zr(za),zr(zb));B.box(plat,[(x1+x2)/2,deckY,(z1+z2)/2],[x2-x1,40,z2-z1],'dark');};
        box(-600,900,GD.offsetZ+320,GD.offsetZ+720);box(-600,-60,GD.offsetZ-320,GD.offsetZ+320);box(560,900,GD.offsetZ-320,GD.offsetZ+320);
        B.rail(plat,[[xout(-600),deckY,zr(GD.offsetZ-320)],[xout(-600),deckY,zr(GD.offsetZ+720)],[xout(900),deckY,zr(GD.offsetZ+720)],[xout(900),deckY,zr(GD.offsetZ+200)]],1000);B.rail(plat,[[xout(-600),deckY,zr(GD.offsetZ-320)],[xout(-60),deckY,zr(GD.offsetZ-320)]],1000);
        // Side ladder: plane x = outboard face just beyond the deck edge; rails 450 apart along Z.
        const lx=xout(GD.ladderX),la=zr(GD.ladderZ[0]),lb=zr(GD.ladderZ[1]);for(const lz of[la,lb])B.beam(plat,[lx,0,lz],[lx,deckY+1000,lz],55,55,'structure');for(let y=300;y<deckY;y+=300)B.tube(plat,[lx,y,la],[lx,y,lb],18,'metal',6);
        const sprocket=part(`gantry.sprocket.${id}`,`${title(words(id))} 58-tooth wheel sprocket`,bogie,'047','gantryChain');B.cyl(sprocket,[x+sx*640,930,wz],'x',rLarge,75,'metal',48);B.cyl(sprocket,[x+sx*690,930,wz],'x',rLarge-60,20,'structure',48);
        for(let i=0;i<58;i++){const a=i*2*Math.PI/58;B.box(sprocket,[x+sx*640,930+(rLarge+18)*Math.sin(a),wz+(rLarge+18)*Math.cos(a)],[70,30,22],'metal');}
        const anti=part(`gantry.anti-collision.${id}`,`${title(words(id))} corner anti-collision switch`,bogie,'161','safety');const az=wz+pair*1010,ax=x+sx*760;B.box(anti,[ax,1650,az],[180,240,130],'dark');B.tube(anti,[ax,1770,az],[ax,2450,az],12,'metal',6);B.cyl(anti,[ax,2470,az],'y',30,40,'#f0a020',8);
      }
    }
  }
  const hyd=part('gantry.hydraulic-station.main','Steering hydraulic station and sill pipework',gantry,'043','gaItems');const hx=-S-E.sillWidth/2-360;
  // Pipe bundles run along the outer sill faces and drop to each bogie (site photos WA-23/24/27). The +X rear drop is
  // moved inward to clear the busbar terminal box.
  for(const[sx]of SIDES){const px=sx*(S+E.sillWidth/2+30),zs=sx>0?[-3400,3950]:[-3950,3950];for(let i=0;i<4;i++){const py=E.sillTop-140-i*60,o=sx*i*0;B.tube(hyd,[px+o,py,zs[0]-i*40],[px+o,py,zs[1]+i*40],14,'structure',6);for(const[j,zz]of zs.entries()){const zd=zz+(j?1:-1)*i*40;B.tube(hyd,[px,py,zd],[px,3300,zd],14,'structure',6);}}}
  B.box(hyd,[hx,3700,2600],[700,700,900],'dark');B.cyl(hyd,[hx,3700,3200],'z',150,450,'dark',16);B.box(hyd,[hx+180,4020,2350],[200,60,200],'metal');for(const dz of[-250,0,250])B.tube(hyd,[hx+330,3500,2600+dz],[-S-E.sillWidth/2,3500,2600+dz],14,'metal',6);
  const horn=part('auxiliary.travel-alarm.horn','Gantry-travel alarm horn',gantry,'151','safety');const hz=-1700;B.box(horn,[-S-E.sillWidth/2-60,3900,hz],[120,160,160],'dark');B.cone(horn,[-S-E.sillWidth/2-120,3900,hz],[-S-E.sillWidth/2-460,3900,hz],45,140,'white');

  // ── Trolley: two I-section girders, two end beams, four wheels, two direct drives (JL28606) ──
  const trolley=B.container('container.trolley','Moving trolley + cabin',root,'trolley',{userData:{motionRole:'trolley'}});const fy=R+250;
  for(const[sz,id]of ENDS){const k=part(`trolley.girder.${id}`,`Trolley ${id} I-section girder`,trolley,'021','trolley');B.box(k,[0,fy,sz*G],[E.trolleyFrameLength,400,80]);for(const y of[fy-225,fy+225])B.box(k,[0,y,sz*G],[E.trolleyFrameLength,50,450]);}
  for(const[sx,side]of SIDES){const k=part(`trolley.end-beam.${side}`,`Trolley ${side} end beam`,trolley,'021','trolley'),x=sx*E.trolleyFrameLength/2;B.box(k,[x,fy,0],[100,380,6400]);for(const y of[fy-210,fy+210])B.box(k,[x,y,0],[300,45,6400]);}
  for(const[sx,id]of[[-1,'a'],[1,'b']]){const k=part(`trolley.cross-beam.${id}`,`Trolley machinery cross beam ${id.toUpperCase()}`,trolley,'021','trolley');B.box(k,[sx*1640,fy+250,0],[400,60,3400]);}
  for(const[sz,id]of ENDS){const k=part(`access.trolley.walkway.${id}`,`Trolley ${id} walkway and handrail`,trolley,'151','trolley');B.box(k,[0,fy+245,sz*3700],[5600,65,700],'dark');B.rail(k,[[-2800,fy+280,sz*3700],[2800,fy+280,sz*3700]]);}
  for(const[sx,side]of SIDES){const k=part(`access.trolley.walkway.${side}`,`Trolley ${side} end walkway and handrail`,trolley,'151','trolley');B.box(k,[sx*2800,fy+245,0],[700,65,7400],'dark');B.rail(k,[[sx*2800,fy+280,-3700],[sx*2800,fy+280,3700]]);}
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){
    const wid=`${side}.${end}`,k=part(`trolley.wheel.${wid}`,`Trolley wheel Ø500 · ${words(wid)}`,trolley,'021','trolley','position',{userData:{motionRole:'trolley-wheel',radius:.25}});
    B.objects.get(k).position.set(sx*P('trolleyBase')/2000,fy/1000,sz*G/1000);B.cyl(k,[0,0,0],'z',250,150,'metal',32);B.cyl(k,[0,0,0],'z',100,330,'dark');for(const dz of[-1,1])B.cyl(k,[0,0,dz*80],'z',265,12,'metal',32);
    const brg=part(`trolley.wheel-bearing.${wid}`,`Trolley wheel bearing housings · ${words(wid)}`,trolley,'021','trolley');for(const dz of[-1,1])B.box(brg,[sx*2025,fy,sz*G+dz*220],[320,300,110],'dark');
    const guide=part(`trolley.guide.${wid}`,`Side guide rollers · ${words(wid)}`,trolley,'021','trolleyItems');for(const dx of[-160,160]){B.cyl(guide,[sx*2025+dx,R-20,sz*(G+140)],'y',80,100,'dark');B.box(guide,[sx*2025+dx,R+95,sz*(G+120)],[100,80,350]);B.cyl(guide,[sx*2025+dx,R+40,sz*(G+140)],'y',22,140,'metal',8);}
    if(sx===sz){
      const d=sx<0?'a':'b',drive=part(`trolley.drive.${d}`,`Trolley direct-wheel gearmotor ${d.toUpperCase()} · KH107 shaft-mounted`,trolley,'021','sitePhotos'),gz=sz*(G+E.trolleyDrive.offsetZ),gy=fy-20;B.box(drive,[sx*2025,gy,gz],[420,440,260]);B.cyl(drive,[sx*2565,gy,gz],'x',170,660,'#a9b0b5',24);for(let i=0;i<5;i++)B.ring(drive,[sx*(2300+i*120),gy,gz],'x',174,8,'#c9ced2',24);
      const brake=part(`trolley.drive-brake.${d}`,`Trolley motor brake and fan cowl ${d.toUpperCase()}`,trolley,'021','sitePhotos');B.cyl(brake,[sx*2975,gy,gz],'x',190,160,'structure',24);B.ring(brake,[sx*3060,gy,gz],'x',150,10,'dark',24);
    }
  }
  for(const[sz,id]of ENDS){const k=part(`trolley.anchor.${id}`,`Trolley storm anchor device · ${id}`,trolley,'021','trolleyItems');B.box(k,[0,fy-280,sz*(G-420)],[300,320,260],'dark');B.cyl(k,[0,fy-560,sz*(G-420)],'y',45,320,'metal',12);B.box(k,[0,fy-140,sz*(G-420)],[180,60,180],'#f0a020');}
  const lube=part('trolley.lubrication.main','Centralized lubrication pump',trolley,'151','trolleyItems');B.box(lube,[-1650,fy+560,1000],[450,550,300],'dark');B.cyl(lube,[-1650,fy+1035,1000],'y',130,400,'white',16);
  // Grease lines run below the rope leads and outboard of every sheave to the four wheel bearings.
  const ly=fy+120;B.tube(lube,[-1650,fy+285,1000],[-1650,ly,1000],8,'dark',4);B.tube(lube,[-1650,ly,1000],[-1250,ly,1000],8,'dark',4);for(const[sz]of ENDS){B.tube(lube,[-1250,ly,1000],[-1250,ly,sz*3050],8,'dark',4);for(const[sx]of SIDES)B.tube(lube,[-1250,ly,sz*3050],[sx*2025,ly,sz*3050],8,'dark',4);}
  const box=part('trolley.connect-box.main','Trolley electrical cabinet / connect box · stainless',trolley,'051','sitePhotos');B.box(box,[-2225,fy+1180,-1400],[700,1800,1000],'#b9bfc3');B.box(box,[-2225,fy+2100,-1400],[760,40,1060],'#9aa1a6');for(const dz of[-250,250])B.box(box,[-2580,fy+1180,-1400+dz],[12,1650,460],'#a6adb2');
  const ohl=part('trolley.overheight-limit.main','Over-height limit device',trolley,'161','trolleyItems');B.box(ohl,[0,fy-330,-800],[300,250,250],'dark');B.tube(ohl,[0,fy-455,-800],[0,fy-1955,-800],14,'metal',6);B.box(ohl,[0,fy-1985,-800],[200,60,60],'#f0a020');
  for(const[sz,id]of ENDS){const k=part(`auxiliary.floodlight.trolley.${id}`,`Trolley floodlight · ${id}`,trolley,'131','lights');B.box(k,[0,R+200,sz*3600],[420,260,180],'white');B.box(k,[0,R+60,sz*3600],[360,20,140],'glass');}

  // ── Hoist machinery (Fig 2-10) ──
  const hoist=B.container('container.hoist','Hoist machinery and reeving',trolley,'hoist');const dy=E.drumCentreY,mz=E.motorCentreZ;
  const drum=part('hoist.drum.main','Hoist drum Ø1200 · eight groove groups',hoist,'011','hoist','position',{userData:{motionRole:'drum'}});B.objects.get(drum).position.set(0,dy/1000,0);
  B.cyl(drum,[0,0,0],'x',P('drumDiameter')/2,E.drumLength,'dark',64);for(const x of[-1480,1480])B.cyl(drum,[x,0,0],'x',690,50,'metal',48);for(const g of E.reeving.grooveX)for(const sg of[-1,1])for(let w=0;w<6;w++)B.ring(drum,[sg*g+(w-2.5)*30,0,0],'x',606,8,'metal',32);
  const coupling=part('hoist.drum-coupling.main','Drum coupling to reducer',hoist,'011','hoistDrive');B.cyl(coupling,[1515,dy,0],'x',360,60,'metal',40);for(let i=0;i<12;i++){const a=i*Math.PI/6;B.cyl(coupling,[1515,dy+300*Math.cos(a),300*Math.sin(a)],'x',18,90,'dark',6);}
  const bearing=part('hoist.drum-bearing.main','Drum bearing seat (non-drive end)',hoist,'011','hoistDrive');B.box(bearing,[-1640,fy+500,0],[240,550,650]);B.cyl(bearing,[-1640,dy,0],'x',250,200,'metal',32);B.box(bearing,[-1640,fy+260,0],[500,80,850]);
  const base=part('hoist.machinery-base.main','Hoist machinery base plates',hoist,'011','hoistDrive');B.box(base,[300,28420,mz],[1500,180,850]);B.box(base,[1770,28375,675],[700,90,2050]);
  const reducer=part('hoist.reducer.main','Hoist reducer SEW ML4PSF140E · casing',hoist,'011','hoist');B.box(reducer,[1770,dy,750],[550,900,2100]);B.box(reducer,[1770,dy+80,750],[620,70,2150],'metal');for(const z of[mz])B.cyl(reducer,[1410,dy,z],'x',210,300);
  const oil=part('hoist.reducer-oil.main','Reducer oil level indicator, drain valve and breather',hoist,'011','hoistDrive');B.cyl(oil,[1770,dy-250,-330],'z',45,60,'glass',16);B.cyl(oil,[1770,dy-430,-330],'z',25,80,'metal',8);B.cyl(oil,[1770,dy+515,300],'y',50,120,'metal',12);
  const motor=part('hoist.motor.main','Hoist motor 180 kW · YASKAWA',hoist,'011','hoist');B.cyl(motor,[300,dy,mz],'x',360,1300,'#a3abb0',32);for(let i=0;i<10;i++)B.ring(motor,[-300+i*120,dy,mz],'x',364,16,'#c9ced2');B.box(motor,[600,dy+460,mz],[420,200,380],'#c9ced2');for(let i=0;i<3;i++)B.tube(motor,[480+i*110,dy+560,mz+150],[430+i*110,fy+400,mz+520],22,'dark',8);for(const s of[-1,1])B.box(motor,[300,dy-300,mz+s*300],[1100,120,80],'dark');
  const fan=part('hoist.motor-fan.main','Hoist motor cooling fan with filter',hoist,'011','hoistDrive');B.cyl(fan,[-460,dy,mz],'x',400,220,'#e8e4da',32);for(const r of[120,240,350])B.ring(fan,[-575,dy,mz],'x',r,10,'metal',24);
  const enc=part('hoist.encoder.main','Hoist motor pulse encoder',hoist,'011','hoistDrive');B.cyl(enc,[-630,dy,mz],'x',95,100,'dark',16);B.box(enc,[-630,dy+120,mz],[60,60,60],'dark');
  const hsc=part('hoist.hs-coupling.main','High-speed couplings and shafts',hoist,'011','hoistDrive');for(const[a,b]of[[950,1495],[2045,2450]]){B.tube(hsc,[a,dy,mz],[b,dy,mz],75,'metal');B.cyl(hsc,[a+90,dy,mz],'x',150,110,'metal',24);}
  for(const[x,id]of[[1100,'a'],[2300,'b']]){const k=part(`hoist.brake.${id}`,`Hoist high-speed disc brake ${id.toUpperCase()}`,hoist,'011','hoist');B.cyl(k,[x,dy,mz],'x',315,40,'metal');for(const z of[-1,1])B.box(k,[x,dy-50,mz+z*270],[350,460,180],'dark');B.box(k,[x,28460,mz],[500,260,800]);}
  for(const[name,label,dz]of[['overspeed-switch','Hoist overspeed protection switch',220],['cam-limit','Hoist cam limit switch',-220]]){const k=part(`hoist.${name}.main`,label,hoist,'011','hoistDrive');B.box(k,[-1900,dy,dz],[260,240,240],'dark');B.tube(k,[-1760,dy,0],[-1770,dy,dz],20,'metal',6);B.box(k,[-1900,dy+150,dz],[120,60,120],'#f0a020');}
  const reel=part('hoist.spreader-cable.reel','Spreader cable reel (SCF1)',hoist,'014','trolleyItems');B.cyl(reel,[2350,28950,-1200],'z',420,360,'dark',40);for(const dz of[-1,1])B.cyl(reel,[2350,28950,-1200+dz*190],'z',470,20,'metal',40);B.box(reel,[2400,fy+380,-1200],[300,200,500],'dark');

  // ── Eight-rope reeving (M14 p26–27, Fig 2-14; JL28606 front/side views) ──
  // One end of each rope is clamped on the drum; the rope passes round the trolley sheaves (8 fall + 4 horizontal
  // guides = 12) and two ropes a group join, through turnbuckles, at the midpoints of the headblock's four edges,
  // forming four isosceles triangles. End pairs hang in the X-Y planes z = ±endSheaveZ (seen edge-on in the front
  // view); side pairs hang in the Y-Z planes of their drum grooves. Leads to +Z leave the drum bottom and leads to
  // −Z leave the drum top, so all eight ropes wind in together. The four end-pair leads turn 90° on the horizontal
  // guides. Every straight lead is tangent to the circles it joins and lies in the plane of the sheave it enters.
  const suspended=B.container('container.suspended','Headblock + spreader',trolley,'spreader',{userData:{motionRole:'suspended'}});B.objects.get(suspended).position.y=E.hoistHome/1000;
  const RV=E.reeving,rr=P('ropeDiameter')/2,Rd=P('drumDiameter')/2+rr,Rs=E.sheaveDiameter/2,Rg=E.guideSheaveDiameter/2,yBot=dy-Rd,yTop=dy+Rd,Yf=yBot-Rs;
  const add=(a,b,k=1)=>a.map((v,j)=>v+k*b[j]),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const ropeLine=(k,pts)=>{for(let i=0;i<pts.length-1;i++)B.tube(k,pts[i],pts[i+1],rr,'dark',6);};
  const arc=(c,a,b,from,to,r,steps)=>Array.from({length:steps+1},(_,s)=>{const t=from+(to-from)*s/steps;return c.map((v,j)=>v+r*(Math.cos(t)*a[j]+Math.sin(t)*b[j]));});
  // Direct tangent between circle/point 1 and circle 2 in a vertical plane, both wrapped clockwise in the local
  // (u outward, v up) frame. Returns the two tangent points in local coordinates.
  const tangentCW=(D,r1,S,r2)=>{const w=[S[0]-D[0],S[1]-D[1]],L=Math.hypot(...w),phi=Math.atan2(w[1],w[0])+Math.asin((r2-r1)/L),n=[Math.sin(phi),-Math.cos(phi)];return[[D[0]-r1*n[0],D[1]-r1*n[1]],[S[0]-r2*n[0],S[1]-r2*n[1]]];};
  // Site photos WA-04/06/07: yellow sheaves with six lightening holes, rim flanges and a red hub.
  const sheaveFinish=(k,C,axle,Rp)=>{const ax={x:[1,0,0],y:[0,1,0],z:[0,0,1]}[axle],u=axle==='y'?[1,0,0]:[0,1,0],v=axle==='z'?[1,0,0]:[0,0,1];B.cyl(k,C,axle,Rp-rr,90,'#e2b32a',40);for(const d of[-1,1])B.ring(k,add(C,ax.map(w=>w*d*52)),axle,Rp+10,30,'#d4a51f',28);B.cyl(k,C,axle,170,120,'structure',24);for(let i=0;i<6;i++){const a=i*Math.PI/3;B.cyl(k,C.map((w,j)=>w+0.55*Rp*(Math.cos(a)*u[j]+Math.sin(a)*v[j])),axle,0.16*Rp,96,'dark',10);}};
  const ropesDef=[];
  for(const[sz,endId]of[[1,'front'],[-1,'rear']])for(const[sx,side]of SIDES)ropesDef.push({pair:'end',sz,sx,label:`${endId} (${sz>0?'+':'−'}Z) end pair, ${side} fall`,xg:sx*(sz>0?RV.grooveX[3]:RV.grooveX[0]),C:[sx*RV.endSheaveX,Yf,sz*RV.endSheaveZ],e1:[sx,0,0],end:[sx*RV.endRopeX,RV.endRopeY,sz*RV.ropeTerminalZ],pin:[0,RV.pinY,sz*RV.ropeTerminalZ]});
  for(const[sx,side]of[[1,'right'],[-1,'left']])for(const[sz,endId]of[[1,'front'],[-1,'rear']]){const xg=sx*(sx*sz>0?RV.grooveX[1]:RV.grooveX[2]);ropesDef.push({pair:'side',sz,sx,label:`${side} (${sx>0?'+':'−'}X) side pair, ${endId} fall`,xg,C:[xg,Yf,sz*RV.sideSheaveZ],e1:[0,0,sz],end:[xg,RV.sideRopeY,sz*RV.sideRopeZ],pin:[sx*RV.sidePinX,RV.pinY,0]});}
  const ropeLengths=[];
  ropesDef.forEach((r,i)=>{
    const n=i+1,top=r.sz<0,yLead=top?yTop:yBot,Y=[0,1,0],toLocal=p=>[dot(add(p,r.C,-1),r.e1),p[1]-r.C[1]],to3=([u,v])=>[r.C[0]+u*r.e1[0],r.C[1]+v,r.C[2]+u*r.e1[2]],ang=([u,v])=>Math.atan2(v,u);
    const axle=r.e1[0]?'z':'x',fall=part(`reeving.sheave.fall-${n}`,`Fall sheave ${n} · ${r.label}`,hoist,'015','reeving');
    sheaveFinish(fall,r.C,axle,Rs);B.cyl(fall,r.C,axle,90,250,'metal',16);
    // Fork plates carry the shaft to the trolley end beam (end pairs) or trolley girder (side pairs).
    for(const d of[-1,1]){if(axle==='z')B.box(fall,[r.C[0]+r.sx*270,Yf,r.C[2]+d*80],[540,280,16],'dark');else B.box(fall,[r.C[0]+d*80,Yf,r.C[2]+r.sz*445],[16,280,890],'dark');}
    const k=part(`reeving.rope.route-${n}`,`Hoist rope ${n} · ${r.label}`,hoist,'015','reeving');
    const pts=[];let thetaArr,lead=0;
    if(r.pair==='end'){
      const gk=part(`reeving.sheave.guide-${n}`,`Horizontal guide sheave ${n} · ${r.sz>0?'front':'rear'} end, ${r.sx>0?'right':'left'}`,hoist,'015','reeving');
      const Cg=[r.xg+r.sx*Rg,yLead,r.sz*(RV.endSheaveZ-Rg)];sheaveFinish(gk,Cg,'y',Rg);
      if(top){B.cyl(gk,add(Cg,[0,95,0]),'y',60,100,'metal',12);B.box(gk,[Cg[0],Cg[1]+150,r.sz*2700],[140,120,1000],'dark');B.box(gk,[Cg[0],(fy+250+Cg[1]+210)/2,r.sz*3150],[140,Cg[1]+210-(fy+250),140],'dark');}
      else{B.cyl(gk,add(Cg,[0,-150,0]),'y',60,220,'metal',12);B.box(gk,[Cg[0],fy+150,r.sz*1950],[200,80,600],'dark');}
      pts.push([r.xg,yLead,0],[r.xg,yLead,Cg[2]]);pts.push(...arc(Cg,[-r.sx,0,0],[0,0,r.sz],0,Math.PI/2,Rg,10).slice(1));lead+=Math.abs(Cg[2])+Rg*Math.PI/2;
      const exit=pts.at(-1);
      if(top){const[,T2]=tangentCW(toLocal(exit),0,[0,0],Rs);thetaArr=ang(T2);pts.push(to3(T2));lead+=dist(exit,to3(T2));}
      else{thetaArr=Math.PI/2;pts.push(to3([0,Rs]));lead+=dist(exit,to3([0,Rs]));}
    }else if(top){const[T1,T2]=tangentCW(toLocal([r.xg,dy,0]),Rd,[0,0],Rs);thetaArr=ang(T2);pts.push(to3(T1),to3(T2));lead+=dist(to3(T1),to3(T2));}
    else{thetaArr=Math.PI/2;pts.push([r.xg,yLead,0],to3([0,Rs]));lead+=Math.abs(r.C[2]);}
    // Static wrap on the fall sheave runs to the departure at maximum lift; lower poses leave earlier in the same groove.
    const endAt=h=>[r.end[0]/1000,(r.end[1]+h)/1000,r.end[2]/1000],dep=h=>ang(toLocal(ropeTangent(r.C.map(v=>v/1000),endAt(h),Rs/1000).toArray().map(v=>v*1000)));
    const thetaMax=dep(P('lift')),wrap=arc(r.C,r.e1,Y,thetaArr,thetaMax,Rs,Math.max(4,Math.ceil((thetaArr-thetaMax)/(Math.PI/16))));pts.push(...wrap.slice(1));ropeLine(k,pts);
    const centre=r.C.map(v=>v/1000),home=endAt(E.hoistHome),a=ropeTangent(centre,home,Rs/1000),b=new T.Vector3(...home),mesh=new T.Mesh(new T.CylinderGeometry(rr/1000,rr/1000,1,6),mats.dark);
    mesh.name=k+'--moving-span';mesh.userData={motionRole:'rope-span',sheaveCentre:centre,sheaveRadius:Rs/1000,start:a.toArray(),endOffset:r.end.map(v=>v/1000)};mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());mesh.scale.y=a.distanceTo(b);B.objects.get(k).add(mesh);
    const freeLength=(lead+Rs*(thetaArr-dep(E.hoistHome))+a.distanceTo(b)*1000)/1000;ropeLengths.push({rope:n,pair:r.pair,lead:top?'drum top':'drum bottom',freeLengthAtHomeM:Number(freeLength.toFixed(3))});
    B.recipes.push({nodeKey:k,primitive:'dynamic-rope-span',parameters:{pair:r.pair,drumGrooveX:r.xg,drumLead:top?'top':'bottom',fallSheaveCentre:r.C,lowerOffset:r.end,headblockPin:r.pin,diameter:P('ropeDiameter'),freeLengthAtHomeM:Number(freeLength.toFixed(3))},authoringUnits:'mm',provenance:{kind:'estimated',sources:[sources.reeving]},confidence:'medium',endpoints:'Drum tangent → (horizontal guide) → fall-sheave tangent; moving span tangent to the fall sheave and attached to the headblock socket'});
    const socket=part(`headblock.rope-socket.${n}`,`Rope ${n} socket and turnbuckle · ${r.label}`,suspended,'015','reeving');
    const dir=add(r.pin,r.end,-1),L=Math.hypot(...dir),u=dir.map(v=>v/L),s1=add(r.end,u,230),s2=add(r.pin,u,-70),mid=add(s1,u,(L-300)/2);
    B.tube(socket,r.end,s1,45,'metal',12);B.tube(socket,s1,s2,30,'metal',10);B.tube(socket,add(mid,u,-110),add(mid,u,110),55,'dark',12);
  });

  // ── Headblock and Bromma electric telescopic spreader (Fig 2-18; p13) ──
  const hb=part('headblock.frame.main','Headblock frame',suspended,'062','spreader');for(const x of[-RV.sidePinX,RV.sidePinX])B.box(hb,[x,1150,0],[230,350,5380]);for(const z of[-2500,0,2500])B.box(hb,[0,1150,z],[1200,350,220]);
  const basket=part('hoist.spreader-cable.basket','Spreader cable storage basket and guide cage',suspended,'014','sitePhotos');{const bc='#e7b52d',b0=1325,bh=420,br=420;B.cyl(basket,[0,b0+bh/2,0],'y',br,bh,bc,40);B.ring(basket,[0,b0+bh,0],'y',br-15,18,bc,40);B.ring(basket,[0,b0+bh-30,0],'y',br-110,45,'dark',40);B.cone(basket,[0,b0+bh,0],[0,b0+bh+380,0],260,40,'dark',24);for(let i=0;i<6;i++){const a=i*Math.PI/3;B.tube(basket,[(br-40)*Math.cos(a),b0+bh,(br-40)*Math.sin(a)],[130*Math.cos(a),2650,130*Math.sin(a)],14,bc,6);}B.ring(basket,[0,2650,0],'y',140,18,bc,24);B.ring(basket,[0,2150,0],'y',262,12,bc,24);}
  // Spreader drop cable (user, 5 November 2026; WA-15/17): from the motorised reel along the trolley to a guide bellmouth
  // above the headblock, then a moving vertical span through the guide cage into the basket. The span follows the hoist.
  {const k=part('hoist.spreader-cable.drop','Spreader drop cable · reel to headblock basket (moving)',hoist,'014','sitePhotos'),cr=22,gy=28050,path=[[2350,28530,-1200],[600,28530,-1200],[0,28150,0],[0,gy,0]];
  for(let i=0;i<path.length-1;i++)B.tube(k,path[i],path[i+1],cr,'dark',8);B.cone(k,[0,gy,0],[0,gy-260,0],70,160,'#b9bfc3',16);
  const top=[0,gy-260,0],end=[0,2140,0],a=new T.Vector3(...top.map(v=>v/1000)),b=new T.Vector3(0,(end[1]+E.hoistHome)/1000,0),mesh=new T.Mesh(new T.CylinderGeometry(cr/1000,cr/1000,1,8),mats.dark);
  mesh.name=k+'--moving-span';mesh.userData={motionRole:'drop-cable',start:a.toArray(),endOffset:end.map(v=>v/1000)};mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);B.objects.get(k).add(mesh);
  B.recipes.push({nodeKey:k,primitive:'dynamic-drop-cable',parameters:{reel:[2350,28950,-1200],guide:top,lowerOffset:end,diameter:2*cr},authoringUnits:'mm',provenance:{kind:'estimated',sources:[sources.sitePhotos]},confidence:'low',endpoints:'Fixed run from reel to guide bellmouth; vertical moving span ends at the headblock guide cone'});}
  const hjb=part('headblock.junction-box.main','Headblock junction box',suspended,'062','spreader');B.box(hjb,[0,1550,1100],[600,450,400],'dark');
  for(const[sz,id]of ENDS){const z=sz*2000,k=part(`headblock.skew-cylinder.${id}`,`Headblock ${id} skew / shift cylinder`,suspended,'111','spreader');const a=[-RV.sidePinX,1470,z],b=[RV.sidePinX,1470,z-sz*700],m=a.map((v,j)=>v+(b[j]-v)*.6);B.tube(k,a,m,65,'dark',16);B.tube(k,m,b,32,'metal',10);}
  const adjust=part('headblock.adjustment.main','Headblock edge-midpoint rope pins and brackets',suspended,'062','reeving');
  for(const sz of[-1,1]){B.box(adjust,[0,1425,sz*(RV.ropeTerminalZ-50)],[360,200,260],'dark');B.cyl(adjust,[0,RV.pinY,sz*RV.ropeTerminalZ],'x',50,360,'metal',16);}
  for(const sx of[-1,1]){B.box(adjust,[sx*RV.sidePinX,1425,0],[200,200,360],'dark');B.cyl(adjust,[sx*RV.sidePinX,RV.pinY,0],'z',50,360,'metal',16);}
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){const k=part(`headblock.connector.${side}.${end}`,`Headblock-to-spreader connector · ${side} ${end}`,suspended,'062','spreader');B.tube(k,[sx*650,1000,sz*2000],[sx*650,800,sz*2000],80,'metal');B.box(k,[sx*650,985,sz*2000],[260,30,260],'dark');}
  const sp=part('spreader.frame.main','Spreader main frame · retracted 20 ft',suspended,'061','spreader');for(const x of[-800,800])B.box(sp,[x,530,0],[350,600,4400]);for(const z of[-2200,0,2200])B.box(sp,[0,530,z],[1900,600,250]);
  for(const[sz,id]of ENDS){
    const k=part(`spreader.telescopic.${id}`,`Spreader ${id} telescopic end beam (fixed demo pose)`,suspended,'061','spreader');for(const x of[-800,800])B.box(k,[x,500,sz*2100],[250,400,1800],'metal');B.box(k,[0,500,sz*2900],[2440,650,300]);
    for(const[sx,side]of SIDES){
      const c=part(`spreader.corner.${side}.${id}`,`Spreader twistlock housing · ${side} ${id}`,suspended,'061','spreader');B.cyl(c,[sx*1050,160,sz*2900],'y',55,320,'dark');B.box(c,[sx*1050,35,sz*2900],[170,70,80],'metal');B.box(c,[sx*1050,300,sz*2900],[300,120,260]);
      const f=part(`spreader.flipper.${side}.${id}`,`Spreader guide flipper · ${side} ${id}`,suspended,'061','spreader');B.poly(f,[[sz*2930,550],[sz*3250,280],[sz*3250,-70],[sz*3110,-70],[sz*3110,160],[sz*2930,350]],160,sx*1170);B.cyl(f,[sx*1170,450,sz*2950],'x',60,220,'dark',12);
    }
  }
  const tdrive=part('spreader.telescope-drive.main','Spreader telescopic drive motor and gearbox',suspended,'061','spreader');B.cyl(tdrive,[0,990,-1100],'z',160,700,'dark',20);B.box(tdrive,[0,990,-600],[380,320,300],'dark');
  const pump=part('spreader.hydraulic-pump.main','Spreader flipper power pack',suspended,'061','spreader');B.box(pump,[0,985,1100],[480,300,380],'dark');B.cyl(pump,[0,1060,1380],'z',90,180,'dark',12);
  const sjb=part('spreader.junction-box.main','Spreader electrical junction box',suspended,'061','spreader');B.box(sjb,[1065,600,700],[180,380,520],'dark');

  // ── Operator cabin under the trolley ──
  const cab=B.container('container.cabin','Operator cabin',trolley,'cabin',{enclosure:true});const cx=E.cabCentreX,cy=E.cabFloor,hangTop=fy-455;
  const shell=part('cabin.shell.main','Cab shell, glazing and roof',cab,'141','cabin','position',{enclosure:true});
  B.box(shell,[cx+350,cy+40,0],[1700,80,2000],'white');B.box(shell,[cx+50,cy+2200,0],[2450,100,2100],'white');
  const profile=[[-550,0],[-1000,230],[-1200,1120],[-1000,2200],[1200,2200],[1200,0]];
  for(const z of[-1000,1000]){const pts=profile.map(([x,y])=>[cx+x,cy+y,z]);for(let i=0;i<pts.length;i++)B.beam(shell,pts[i],pts[(i+1)%pts.length],65,65,'white');B.panel(shell,pts,'glass');B.box(shell,[cx,cy+1120,z],[2300,65,65],'white');B.beam(shell,[cx+350,cy,z],[cx+350,cy+2200,z],65,65,'white');}
  for(let i=0;i<3;i++){const a=profile[i],b=profile[i+1];B.panel(shell,[[cx+a[0],cy+a[1],-1000],[cx+a[0],cy+a[1],1000],[cx+b[0],cy+b[1],1000],[cx+b[0],cy+b[1],-1000]],'glass');B.beam(shell,[cx+a[0],cy+a[1],-1000],[cx+a[0],cy+a[1],1000],65,65,'white');B.beam(shell,[cx+a[0],cy+a[1],0],[cx+b[0],cy+b[1],0],45,45,'white');}
  B.box(shell,[cx+1200,cy+1100,0],[65,2200,2000],'white');for(const z of[-500,500])B.box(shell,[cx+1238,cy+1450,z],[18,1050,850],'glass');
  // Interior finishes from site photos WA-01/02/03: protective bars over the lower front glazing, rolled roller blinds,
  // dark floor mat and the main-particular plate on the rear wall.
  for(const t of[.2,.4,.6,.8]){const px=cx-1000-200*t+90,py=cy+230+890*t;B.tube(shell,[px,py,-930],[px,py,930],14,'dark',6);}for(const t of[.3,.7]){const px=cx-550-450*t+90,py=cy+230*t+40;B.tube(shell,[px,py,-930],[px,py,930],14,'dark',6);}
  for(const z of[-955,955])B.cyl(shell,[cx+100,cy+2080,z],'x',38,2000,'#b8a9c9',10);B.box(shell,[cx+300,cy+85,0],[1600,10,1900],'#2f343a');B.box(shell,[cx+1160,cy+1750,-450],[12,300,460],'#c9ced2');
  const door=part('cabin.door.main','Cab side door with window',cab,'141','cabin',{enclosure:true});B.box(door,[cx+720,cy+1000,-1025],[700,2000,45],'white');B.box(door,[cx+720,cy+1500,-1052],[480,650,16],'glass');B.box(door,[cx+450,cy+1000,-1080],[140,30,55],'dark');
  const frameSup=part('cabin.support-frame.main','Cab cantilever support beams',cab,'141','cabin');for(const z of[-800,800])B.box(frameSup,[cx+250,hangTop+125,z],[1900,250,200]);B.box(frameSup,[cx+1050,hangTop+125,0],[200,250,1800]);
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){const k=part(`cabin.suspension.${side}.${end}`,`Cab hanger and resilient mount · ${sx<0?'forward':'aft'}, ${sz<0?'door side':'far side'}`,cab,'141','cabin');const x=cx+sx*850,z=sz*800;B.beam(k,[x,cy+2250,z],[x,hangTop,z],100,100,'metal');B.cyl(k,[x,cy+2310,z],'y',90,120,'rubber');B.box(k,[x,hangTop-20,z],[240,40,240],'dark');}
  // Cab interior (site photos WA-02/03, 5 November 2026): black high-back suspension seat facing the spreader (−X), two
  // stainless armrest consoles with joystick, push-button grid and emergency stop, a stainless HMI cabinet with a
  // touchscreen and louvres, and a CCTV monitor hung from the front ceiling. Visible in both modes; sizes scaled from photos.
  {const fl=cy+80,sc='#353a40',ss='#c3c8cc';
  const seat=part('cabin.seat.main','Operator suspension seat',cab,'141','cabInterior');
  B.cyl(seat,[cx+300,fl+150,0],'y',150,300,'dark',16);B.box(seat,[cx+300,fl+320,0],[520,60,480],'dark');B.box(seat,[cx+260,fl+420,0],[560,130,540],sc);
  B.beam(seat,[cx+520,fl+470,0],[cx+620,fl+1180,0],150,520,sc);B.beam(seat,[cx+630,fl+1220,0],[cx+645,fl+1420,0],130,320,sc);
  for(const z of[-300,300])B.box(seat,[cx+300,fl+610,z],[480,70,90],sc);
  for(const[sz,id]of ENDS){const z=sz*520,side=id==='rear'?'left':'right',k=part(`cabin.console.${side}`,`Operator ${side} armrest console · joystick and push-buttons`,cab,'141','cabInterior');
    B.box(k,[cx+80,fl+320,z],[620,640,300],ss);const y0=fl+650,x0=cx-260,x1=cx+380,slope=(80)/(x1-x0);B.beam(k,[x0,y0,z],[x1,y0+80,z],40,330,ss);
    B.cyl(k,[x0+90,y0+40,z],'y',55,40,'dark',12);B.tube(k,[x0+90,y0+60,z],[x0+110,y0+300,z],16,'dark',8);B.cyl(k,[x0+112,y0+320,z],'y',34,70,'dark',10);
    const colors=['#2fb45a','#2fb45a','#d23a3a','#e8e8e8','#f0c020'];for(let r=0;r<5;r++)for(let c=0;c<4;c++){const bx=x0+230+r*85,by=y0+20+(bx-x0)*slope+15,bz=z+(c-1.5)*70;B.cyl(k,[bx,by,bz],'y',17,24,colors[(r+c+(sz>0?1:0))%colors.length],8);}
    if(sz>0){B.cyl(k,[x1-60,y0+80+30,z+90],'y',42,40,'#d23a3a',12);B.cyl(k,[x1-60,y0+80+8,z+90],'y',60,10,'#f0c020',12);}}
  const hmi=part('cabin.hmi.main','HMI touchscreen and cab control cabinet',cab,'051','cabInterior');
  B.box(hmi,[cx+1010,fl+600,720],[320,1200,440],ss);for(let i=0;i<6;i++)B.box(hmi,[cx+848,fl+180+i*45,720],[8,18,300],'dark');
  B.box(hmi,[cx+830,fl+1000,720],[70,360,420],ss);B.box(hmi,[cx+793,fl+1010,720],[6,250,320],'#1d2a33');
  const cctv=part('cabin.cctv.main','CCTV monitor and front indicator panel',cab,'131','cabInterior');
  B.tube(cctv,[cx-640,cy+2150,-560],[cx-640,cy+2000,-560],18,'dark',8);B.beam(cctv,[cx-700,cy+1640,-560],[cx-650,cy+2000,-560],45,540,'dark');B.beam(cctv,[cx-675,cy+1665,-560],[cx-627,cy+1975,-560],6,470,'#1d2a33');
  B.box(cctv,[cx-560,cy+520,620],[160,220,260],ss);for(const dz of[-60,0,60])B.cyl(cctv,[cx-640,cy+560,620+dz],'x',16,10,dz?'#2fb45a':'#d23a3a',8);}
  const wiper=part('cabin.wiper.main','Front window wiper',cab,'141','cabin');B.tube(wiper,[cx-1040,cy+1450,-100],[cx-1040,cy+2100,400],12,'dark',6);B.box(wiper,[cx-1020,cy+1420,-100],[60,80,80],'dark');
  const cabAc=part('cabin.aircon.main','Cab air conditioner · assumed envelope',cab,'152','cabin');B.box(cabAc,[cx+600,cy+2490,0],[850,420,800],'white');for(let j=0;j<7;j++)B.box(cabAc,[cx+600,cy+2350+j*40,415],[650,12,20],'dark');
  const landing=part('cabin.landing.main','Cab side landing and guard rail',cab,'151','cabin');B.box(landing,[cx+450,cy,-1550],[2800,90,1000],'dark');B.rail(landing,[[cx-950,cy,-2025],[cx+1850,cy,-2025],[cx+1850,cy,-1050]],1000);
  const ladder=part('cabin.ladder.main','Cab access ladder to trolley',cab,'151','cabin');for(const x of[cx-950,cx-450])B.beam(ladder,[x,cy,-1500],[x,R+500,-1500],55,55);for(let y=cy+200;y<R+500;y+=300)B.tube(ladder,[cx-950,y,-1500],[cx-450,y,-1500],20,'metal',6);

  // ── IGUS energy chain in stainless guide trough (Fig 2-43 / 2-44) ──
  const chain=part('trolley-drive.energy-chain.main','IGUS energy chain 5050RHD · moving links',root,'023','chain');
  const chainMesh=new T.Mesh(chainGeometry(0,(R+250)/1000,-4.9),mats.dark);chainMesh.name=chain+'--moving-links';chainMesh.userData={motionRole:'energy-chain',y:(R+250)/1000,z:-4.9};B.objects.get(chain).add(chainMesh);
  B.recipes.push({nodeKey:chain,primitive:'constant-length-u-carrier',parameters:{radius:300,straightTotal:12000,linkCount:104},authoringUnits:'mm',provenance:{kind:'estimated',sources:[sources.chain]},confidence:'low',endpoints:'Fixed anchor midspan; moving endpoint follows trolley; outboard route and raised handrail-crossing bracket assumed'});
  const trough=part('trolley-drive.chain-trough.main','Stainless energy-chain guide trough and fixed-end anchor',root,'023','eroom');B.box(trough,[0,R+140,-4900],[22400,150,450],'metal');for(const dz of[-1,1])B.box(trough,[0,R+390,-4900+dz*235],[22400,350,20],'metal');for(let x=-10800;x<=10801;x+=2400)B.box(trough,[x,R+20,-4500],[100,100,780],'dark');
  B.box(trough,[0,R+250,-4900],[400,160,520],'dark');
  // Portal over the girder walkway carries the chain's moving end (site photo WA-11); posts clear the walkway handrails.
  const bracket=part('trolley-drive.chain-bracket.main','Energy-chain portal bracket and floating connection',trolley,'023','sitePhotos');{const pt=R+2300;for(const px of[-700,700]){B.beam(bracket,[px,R+1000,-4900],[px,pt,-4900],120,120);B.beam(bracket,[px,R+527,-3550],[px,pt,-3550],120,120);B.beam(bracket,[px,pt,-4900],[px,pt,-3550],120,120);}for(const pz of[-4900,-3550])B.beam(bracket,[-760,pt,pz],[760,pt,pz],100,100);B.beam(bracket,[-760,R+1000,-4900],[760,R+1000,-4900],100,100);B.box(bracket,[0,R+940,-4900],[240,100,400],'metal');}

  // ── Stairs, landings and walkways (JL28604) ──
  const access=B.container('container.access','Stairs, landings and upper walkways',root,'access');
  // Stair-side switchback (JL28600 side view; user review 5 November 2026). Two side-by-side lanes outboard of the +X legs
  // so a flight that turns 180° never shares a plane with the next one. Landings span the lanes they serve, are braced
  // to the nearest leg (or the room platform), and their handrails stay open only where a flight or walkway connects.
  {const ST=E.stair,X=a=>S+a,A=ST.laneA,Bc=ST.laneB,hw=ST.laneWidth/2,yTop=R-60;
  const flights=[
    {lane:A,a:[0,ST.startZ],b:[ST.y[0],ST.z[0][0]]},
    {lane:Bc,a:[ST.y[0],ST.z[0][0]],b:[ST.y[1],ST.z[1][1]]},
    {lane:Bc,a:[ST.y[1],ST.z[1][0]],b:[ST.y[2],ST.z[2][1]]},
    {lane:A,a:[ST.y[2],ST.z[2][1]],b:[ST.y[3],ST.z[3][0]]},
    {lane:A,a:[ST.y[3],ST.z[3][1]],b:[ST.y[4],ST.z[4][0]]},
    {lane:Bc,a:[ST.y[4],ST.z[4][0]],b:[yTop,ST.z[5][1]]}];
  flights.forEach((f,i)=>{const k=part(`access.stair.flight-${i+1}`,`Stair flight ${i+1} · ${(f.a[0]/1000).toFixed(1)} → ${(f.b[0]/1000).toFixed(1)} m`,access,'151','access');
    const P0=[X(f.lane),f.a[0],f.a[1]],P1=[X(f.lane),f.b[0],f.b[1]],at=t=>P0.map((v,c)=>v+(P1[c]-v)*t),n=Math.ceil((f.b[0]-f.a[0])/ST.riser);
    for(const sd of[-1,1]){const xs=X(f.lane+sd*(hw-15));B.beam(k,[xs,P0[1],P0[2]],[xs,P1[1],P1[2]],30,240,'structure');B.rail(k,[[X(f.lane+sd*hw),P0[1],P0[2]],[X(f.lane+sd*hw),P1[1],P1[2]]]);}
    for(let j=1;j<n;j++)B.box(k,at(j/n),[ST.laneWidth-60,30,260],'dark');});
  // Landings: [y, z range, x range, rail paths ([x,z] pairs), support style]. Rails follow the open edges only.
  const xa=ST.xInner,xb=ST.xOuter,xm=A+hw+10,L=[
    {y:ST.y[0],z:ST.z[0],x:[xa,xb],rails:[[[xa,ST.z[0][0]],[xa,ST.z[0][1]],[xb,ST.z[0][1]],[xb,ST.z[0][0]]]],support:'sill'},
    {y:ST.y[1],z:ST.z[1],x:[xm,xb],rails:[[[xm,ST.z[1][0]],[xm,ST.z[1][1]]],[[xb,ST.z[1][0]],[xb,ST.z[1][1]]]],support:'room'},
    {y:ST.y[2],z:ST.z[2],x:[xa,xb],rails:[[[xa,ST.z[2][1]],[xa,ST.z[2][0]],[xb,ST.z[2][0]],[xb,ST.z[2][1]]]],support:'leg',leg:-1},
    {y:ST.y[3],z:ST.z[3],x:[xa,xm],rails:[[[xa,ST.z[3][0]],[xa,ST.z[3][1]]],[[xm,ST.z[3][0]],[xm,ST.z[3][1]]]],support:'leg',leg:1},
    {y:ST.y[4],z:ST.z[4],x:[xa,xb],rails:[[[xa,ST.z[4][0]],[xa,ST.z[4][1]],[xb,ST.z[4][1]],[xb,ST.z[4][0]]]],support:'cantilever',leg:1},
    {y:yTop,z:ST.z[5],x:[ST.xTop,xb],rails:[[[ST.xTop,ST.z[5][1]],[Bc-hw,ST.z[5][1]]],[[xb,ST.z[5][1]],[xb,ST.z[5][0]],[ST.xTop,ST.z[5][0]]]],support:'walkway'}];
  L.forEach((l,i)=>{const k=part(`access.stair.landing-${i+1}`,`Stair landing ${i+1} · ${(l.y/1000).toFixed(1)} m`,access,'151','access'),zc=(l.z[0]+l.z[1])/2,dz=l.z[1]-l.z[0],x0=X(l.x[0]),x1=X(l.x[1]),yb=l.y-35,yf=l.y-160;
    B.box(k,[(x0+x1)/2,yb,zc],[x1-x0,70,dz],'dark');for(const zz of[l.z[0]+40,l.z[1]-40])B.box(k,[(x0+x1)/2,yf,zz],[x1-x0,180,80]);
    for(const path of l.rails)B.rail(k,path.map(([xx,zz])=>[X(xx),l.y,zz]),1100);
    if(l.support==='leg'){const Lg=legAt(l.leg,yf),face=S+Lg.hx,lo=legAt(l.leg,yf-1600),zs=[Math.max(l.z[0],Lg.z-Lg.hz)+80,Math.min(l.z[1],Lg.z+Lg.hz)-80];
      for(const zz of zs){B.beam(k,[face,yf,zz],[x0,yf,zz],100,180);B.beam(k,[S+lo.hx,yf-1600,zz],[(x0+x1)/2,yf-90,zz],90,90);}}
    if(l.support==='cantilever'){const Lg=legAt(l.leg,yf),zf=Lg.z+Lg.hz,xs=S+Math.min(Lg.hx-120,450),lo=legAt(l.leg,yf-1500);
      B.beam(k,[xs,yf,zf],[xs,yf,l.z[1]],120,180);B.beam(k,[xs,yf,zf],[x0,yf,l.z[0]+40],100,160);B.beam(k,[xs,yf-1500,lo.z+lo.hz],[xs,yf-90,l.z[1]-80],100,100);for(const zz of[l.z[0]+40,l.z[1]-40])B.beam(k,[xs,yf,zz],[x0,yf,zz],100,180);}
    if(l.support==='room')for(const xx of[X(l.x[0]+90),X(l.x[1]-260)])B.beam(k,[xx,E.sillTop+50,l.z[0]+100],[xx,yf-90,l.z[0]+100],100,100);
    if(l.support==='sill'){const xs=S+300;for(const zz of[l.z[0]+40,l.z[1]-40])B.beam(k,[xs,yf,zz],[x0,yf,zz],100,180);B.beam(k,[xs,yf,E.sillLength/2],[xs,yf,l.z[1]],120,180);B.beam(k,[xs,E.sillTop-E.sillDepth+100,E.sillLength/2],[xs,yf-90,l.z[1]-60],90,90);}
    if(l.support==='walkway')for(const zz of[l.z[0]+40,l.z[1]-40])B.beam(k,[X(ST.xTop-500),yf,zz],[x1,yf,zz],100,180);});}
  for(const[sz,id]of ENDS){const z=sz*4100,k=part(`access.walkway.girder.${id}`,`${title(id)} girder walkway and handrail`,access,'151','access');B.box(k,[0,R-100,z],[E.girderLength,80,850],'dark');B.rail(k,[[-12300,R-60,z+sz*420],[12300,R-60,z+sz*420]]);}
  for(const[sx,side]of SIDES){const x=sx*12250,k=part(`access.walkway.cross.${side}`,`${title(side)} end cross landing and handrail`,access,'151','access');B.box(k,[x,R-100,0],[850,80,9000],'dark');
    // Outer-edge handrail; on the stair side it opens where the stair's top landing joins.
    const xr=sx*(12250+405),gap=sx>0?E.stair.z[5]:null;if(gap){B.rail(k,[[xr,R-60,-4500],[xr,R-60,gap[0]]]);B.rail(k,[[xr,R-60,gap[1]],[xr,R-60,4500]]);}else B.rail(k,[[xr,R-60,-4500],[xr,R-60,4500]]);}
  // Power-room access (estimated route): ladder from the front -X drive platform up to a leg-end landing at room-platform
  // level, joined by a walkway to the power-room platform. The photos show no ground ladder beside the bogies on this side.
  {const GD=E.gantryDrive,sx=-1,x=-S,xo=a=>x+sx*a,wzO=Z+P('bogiePitch')/2,top=E.sillTop,zl=wzO+GD.offsetZ-340,pl=part('access.ladder.power-room','Power-room access ladder and leg-end landing',access,'151','sitePhotos');
  B.box(pl,[xo(1600),top,(2750+E.sillLength/2)/2],[800,100,E.sillLength/2-2750]);B.box(pl,[xo(1250),top,(E.sillLength/2+zl)/2],[1500,100,zl-E.sillLength/2]);
  for(const a of[700,1800])B.beam(pl,[xo(a),top-50,zl-150],[xo(Math.min(a,400)),E.sillTop-E.sillDepth/2,E.sillLength/2+20],90,90);
  B.rail(pl,[[xo(2000),top+50,2750],[xo(2000),top+50,zl],[xo(920),top+50,zl]],1100);
  const lz=wzO+GD.offsetZ-340+60,deck=GD.reducerY+GD.reducerHeight/2;for(const a of[650,880])B.beam(pl,[xo(a),deck,lz],[xo(a),top+1050,lz],55,55);for(let y=deck+300;y<top+50;y+=300)B.tube(pl,[xo(650),y,lz],[xo(880),y,lz],20,'metal',6);}

  // ── Power room (−X) and electrical room (+X) on the sills; qualified area markers for internals ──
  for(const[sx,type,source]of[[1,'electrical','electrical'],[-1,'power','power']]){
    const x=sx*S,pre=type==='power'?'auxiliary':'electrical',h=type==='power'?2200:2800;
    const k=B.container(`container.${type}-room`,type==='power'?'Power room':'Electrical room',root,source,{enclosure:true});
    const shellKey=part(`${pre}.room.shell`,`${title(type)} room enclosure`,k,'151',source,{enclosure:true});
    B.box(shellKey,[x,E.sillTop+80,0],[2500,160,4900],'white');B.box(shellKey,[x,E.sillTop+h,0],[2500,100,4500],'white');for(const z of[-2200,2200])B.box(shellKey,[x,E.sillTop+h/2,z],[2350,h,60],'white');for(const dx of[-1180,1180])B.box(shellKey,[x+dx,E.sillTop+h/2,0],[60,h,4400],'white');
    const door=part(`${pre}.room.door`,`${title(type)} room access door`,k,'151',type==='electrical'?'eroom':source);B.box(door,[x+sx*1220,E.sillTop+1050,1000],[50,1950,850],'dark');B.box(door,[x+sx*1255,E.sillTop+1000,700],[30,40,140],'metal');
    const louvre=part(`${pre}.room.louvre`,`${title(type)} room ventilation louvre`,k,'151',source);for(let i=0;i<9;i++)B.box(louvre,[x+sx*1220,E.sillTop+500+i*125,-850],[70,35,900],'dark');
    const deck=part(`access.${type}-room.platform`,`${title(type)} room platform and guard rail${type==='power'?', leg tie bars':''}`,k,'151','access');B.box(deck,[x+sx*1600,E.sillTop,0],[800,100,5500],'dark');B.rail(deck,[[x+sx*2000,E.sillTop,-2750],[x+sx*2000,E.sillTop,2750]]);
    if(type==='power')for(const ty of[E.sillTop+1200,E.sillTop+h+150]){const L=legAt(1,ty),zi=L.z-L.hz,bx=x+sx*1350;B.box(deck,[bx,ty,0],[200,250,2*zi]);for(const sz of[-1,1])B.beam(deck,[bx,ty,sz*zi],[x+sx*L.hx,ty,sz*L.z],120,160);}
    const specs=type==='power'?[['engine','091'],['generator','092'],['battery','094']]:[['drives','071'],['plc','081'],['control','051']];
    specs.forEach(([name,sub],i)=>{const key=`${pre}.${name}.area`,point=[x/1000,(E.sillTop+1100)/1000,(i-1)*1.15],n=B.node(key,`${title(name)} · documented room, location unresolved`,k,sub,source,'hotspot',{modes:['technical'],provenance:{kind:'approximate-location',sources:[sources[source]]},qualifier:'Area marker only; not vendor geometry or exact mounting location',hotspot:{point,radius:.55,representation:'qualified-area'}});B.box(n,[x,E.sillTop+1000,(i-1)*1150],[1200,1300,750],'marker');});
    const acs=type==='power'?[['power','Power-room cooling / exhaust area','093',1700]]:[['electrical','Electrical-room air conditioner 1','152',1700],['electrical-2','Electrical-room air conditioner 2','152',-1700]];
    for(const[suffix,label,sub,z]of acs){const ac=B.node(`auxiliary.aircon.${suffix}`,label,k,sub,type==='electrical'?'eroom':source,'hotspot',{provenance:{kind:'approximate-location',sources:[sources[type==='electrical'?'eroom':source]]},hotspot:{point:[x/1000,(E.sillTop+h)/1000,z/1000],radius:.5},qualifier:'Location approximate; vendor drawing required'});B.box(ac,[x,E.sillTop+h+350,z],[850,650,450],'dark');}
    if(type==='power'){
      // Exhaust (user, 5 November 2026): from the roof outlet the pipe crosses to the front leg, climbs its outboard face
      // with clamps, passes outside the girder end and rises through the cross walkway to a rain cap above the handrail.
      // Kept off the girder sides so it clears the trolley, fall sheaves and chain trough at every travel position.
      const ex=part('auxiliary.exhaust.main','Engine exhaust pipe · roof outlet, leg run and rain cap',k,'091','exhaust');
      {const XP=E.exhaust,yR=E.sillTop+h+50,yH=yR+XP.riseAboveRoof,legX=y=>x+sx*(legAt(1,y).hx+XP.offsetX),legZ=y=>legAt(1,y).z+XP.offsetZ,xo=x+sx*XP.outletX,yT=R+XP.topAboveRail;
      const pts=[[xo,yR,XP.outletZ],[xo,yH,XP.outletZ],[xo,yH,legZ(yH)],[legX(yH),yH,legZ(yH)],[legX(legTop),legTop,legZ(legTop)],[legX(legTop),yT,legZ(legTop)]];
      for(let i=0;i<pts.length-1;i++)B.tube(ex,pts[i],pts[i+1],XP.radius,'dark',16);for(let i=1;i<pts.length-1;i++)B.cyl(ex,pts[i],'y',XP.radius+12,2*XP.radius,'dark',16);
      B.cyl(ex,[xo,yR+60,XP.outletZ],'y',XP.radius+60,120,'dark',16);B.cyl(ex,[legX(legTop),R-100,legZ(legTop)],'y',XP.radius+40,80,'metal',16);B.cyl(ex,[legX(legTop),yT+40,legZ(legTop)],'y',XP.radius+70,60,'dark',16);
      for(let y=yH+2000;y<legTop-600;y+=3000){const px=legX(y),fx=x+sx*legAt(1,y).hx;B.box(ex,[(px+fx)/2,y,legZ(y)],[Math.abs(px-fx),60,140],'dark');}}
      const rad=part('auxiliary.radiator.main','Engine radiator and grille',k,'093','power');B.box(rad,[x,E.sillTop+1200,-2330],[1400,1300,200],'dark');for(let i=0;i<10;i++)B.box(rad,[x,E.sillTop+650+i*115,-2440],[1300,30,20],'metal');
      const tank=part('auxiliary.fuel-tank.main','Diesel fuel tank',k,'091','power');B.box(tank,[x+sx*-(E.sillWidth/2+400),3700,0],[800,700,1400],'white');B.cyl(tank,[x+sx*-(E.sillWidth/2+400),4100,500],'y',60,100,'dark',12);
    }
  }

  // ── Busbar power collector (user photos, DZD-230) and leg cable risers ──
  const bus=B.container('container.busbar','Busbar power collector (photo-referenced)',root,'busbar');const bx=S+E.sillWidth/2,by=5300,bz=legAt(-1,by).z;
  const mount=part('electrical.busbar.mount','Busbar collector mounting frame',bus,'051','busbar');B.box(mount,[S+430,by,bz],[120,1400,700]);for(const y of[by-500,by+500])B.box(mount,[S+580,y,bz],[300,120,160]);
  const arm=part('electrical.busbar.arm','Busbar collector parallel arm',bus,'051','busbar');for(const[y0,y1]of[[by-250,by-120],[by+250,by+380]])B.tube(arm,[S+700,y0,bz],[S+2300,y1,bz],45,'structure',12);B.tube(arm,[S+700,by-250,bz],[S+2300,by+380,bz],30,'structure',10);for(const x of[S+700,S+2300])for(const y of x===S+700?[by-250,by+250]:[by-120,by+380])B.cyl(arm,[x,y,bz],'z',55,240,'metal',12);B.tube(arm,[S+900,by+250,bz+120],[S+1500,by-160,bz+120],35,'metal',10);
  const head=part('electrical.busbar.collector-head','Busbar collector head, shoes and guide rollers',bus,'051','busbar');B.box(head,[S+2520,by+130,bz],[360,760,900]);for(const dy of[-1,1])for(const dz of[-1,1])B.cyl(head,[S+2740,by+130+dy*300,bz+dz*380],'y',90,80,'#e8dcc0',16);for(let i=0;i<4;i++)B.box(head,[S+2740,by-60+i*130,bz],[90,50,620],'dark');
  const hose=part('electrical.busbar.cable-hose','Busbar collector cable hoses',bus,'051','busbar');const hp=[[S+2400,by-260,bz+300],[S+1700,by-700,bz+330],[S+900,by-650,bz+300],[S+560,by-400,bz+250],[bx+100,4100,bz+260]];for(let i=0;i<hp.length-1;i++)for(const dz of[0,-120])B.tube(hose,[hp[i][0],hp[i][1],hp[i][2]+dz],[hp[i+1][0],hp[i+1][1],hp[i+1][2]+dz],38,'dark',8);
  const jb=part('electrical.busbar.junction-box','Busbar collector terminal box (DZD-230 plate)',bus,'051','busbar');B.box(jb,[bx+100,4100,bz],[200,500,450],'white');B.box(jb,[bx+205,4150,bz],[10,240,320],'dark');
  for(const[sx,side]of SIDES){const k=part(`electrical.cable-riser.${side}`,`${title(side)} front leg cable riser`,frame,'051','eroom');const a=legAt(1,4700),b=legAt(1,24550),pa=[sx*S-sx*(a.hx+120),4700,a.z],pb=[sx*S-sx*(b.hx+120),24550,b.z];B.tube(k,pa,pb,55,'dark',10);for(let t=0;t<=1.0001;t+=1/7){const p=pa.map((v,j)=>v+(pb[j]-v)*t);B.box(k,[p[0]+sx*60,p[1],p[2]],[140,60,180],'dark');}}

  addAppearance(B,{S,G,R,E});
  B.flush();
  const parts=B.nodes.filter(n=>n.kind==='position'||n.kind==='hotspot').length;
  if(parts!==PART_TARGET)throw new Error(`Part count ${parts} differs from the ${PART_TARGET}-part specification`);
  return{builder:B,routes:ropesDef,ropeLengths,motion:{trolley:{nodeKey:trolley,min:-9.25,max:9.25,home:0,units:'m',source:'M14 p20 JL28600 18500 operating range'},hoist:{nodeKey:suspended,min:E.hoistMinDemo/1000,max:P('lift')/1000,home:E.hoistHome/1000,units:'m',source:'M14 p15 maximum lift; 1m minimum is a conservative demo envelope, not a lower limit setting'},disabled:['gantry travel: no surveyed yard envelope','steering: pivots and cylinder strokes unresolved','spreader telescope/skew: supplier geometry and limits unresolved'],qualifier:'Visual demonstration only. Estimated rail/cab/rope geometry prevents certified kinematic acceptance.'}};
}
