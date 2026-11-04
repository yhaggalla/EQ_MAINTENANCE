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
    const brace=part(`structure.brace.${side}`,`${title(side)} upper transverse brace bar`,frame,'151','structure');B.tube(brace,[x,E.braceY,-braceZ],[x,E.braceY,braceZ],E.braceDiameter/2);
    for(const[sz,end]of ENDS){const c=part(`structure.brace-clevis.${side}.${end}`,`${title(side)} brace ${end} end clevis`,frame,'151','structure');B.box(c,[x,E.braceY,sz*braceZ],[420,450,120]);B.cyl(c,[x,E.braceY,sz*(braceZ-110)],'x',45,500,'dark');for(const dx of[-1,1])B.box(c,[x+dx*170,E.braceY,sz*(braceZ-110)],[30,300,220]);}
  }
  // Name-plate arrangement (JL28605) panels; artwork and lettering added by appearance.mjs.
  for(const[,id]of ENDS){part(`auxiliary.nameplate.capacity.${id}`,`${title(id)} girder 40.5t capacity sign`,frame,'171','gaItems');part(`auxiliary.nameplate.maker.${id}`,`${title(id)} girder ZPMC maker sign`,frame,'171','gaItems');part(`auxiliary.flag.${id}`,`${title(id)} girder CICT company flag panel`,frame,'171','gaItems');}

  // ── Lighting, signals and sensors (M14 p14 safety/signal list; GA item 13) ──
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){const y=19500,L=legAt(sz,y),x=sx*S-sx*(L.hx+180),z=L.z-sz*300;const k=part(`auxiliary.floodlight.leg.${side}.${end}`,`${title(side)} ${end} leg floodlight`,frame,'131','eroom');B.box(k,[x,y,z],[360,280,300],'white');B.box(k,[x-sx*10,y-150,z],[300,20,240],'glass');B.box(k,[sx*S-sx*(L.hx+40),y+80,z],[100,80,140],'dark');}
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
    // Mirrored by side: steering cylinder, link rod and turning jack inboard; chain drive and lock-pin cylinder outboard.
    const xin=x-sx*580,xout=d=>x+sx*d,sillBottom=E.sillTop-E.sillDepth;
    B.poly(eq,[[-1600+z,2820],[-1600+z,3240],[-500+z,3240],[z,3450],[500+z,3240],[1600+z,3240],[1600+z,2820]],650,x);B.box(eq,[x,(3240+sillBottom)/2,z],[550,sillBottom-3240,500]);
    const pin=part(`gantry.equalizer-pin.${id}`,`${title(words(id))} equalizer pivot pin`,bogie,'041','bogieDetail');B.cyl(pin,[x,3250,z],'x',190,950);for(const d of[-1,1])B.cyl(pin,[x+d*490,3250,z],'x',240,30,'dark',24);
    const lock=part(`gantry.lock-cylinder.${id}`,`${title(words(id))} steering lock-pin cylinder`,bogie,'045','bogieDetail');B.tube(lock,[xout(400),3080,z-700],[xout(400),3080,z-180],70,'dark',16);B.tube(lock,[xout(400),3080,z-180],[xout(400),3080,z+120],28,'metal',10);B.box(lock,[xout(400),3080,z-760],[160,200,120],'dark');
    const steer=part(`gantry.steering.${id}`,`${title(words(id))} steering cylinder`,bogie,'043','bogieDetail');B.tube(steer,[xin,2580,z-900],[xin,2580,z+600],90,'dark',16);B.tube(steer,[xin,2580,z+600],[xin,2580,z+1150],40,'metal',12);B.box(steer,[xin,2580,z-960],[200,200,120],'dark');
    const link=part(`gantry.steer-link.${id}`,`${title(words(id))} steering link rod`,bogie,'043','bogieDetail');B.beam(link,[xin,2450,z-1400],[xin,2450,z+1400],65,65,'dark');for(const d of[-1,1])B.cyl(link,[xin,2450,z+d*1400],'y',55,180,'metal',12);
    // Turning jack: one hydraulic jacking cylinder per bogie (four per RTG) lifts the frame and both tyres off the
    // ground so the wheels can be rotated 16° / 90° unloaded. It hangs from a sill bracket between the two tyres,
    // inboard of the steering cylinder, clear of the stair and chain drive. Shown retracted (travel position).
    const J=E.turningJack,jx=x-sx*J.offsetX,jack=part(`gantry.turning-jack.${id}`,`${title(words(id))} turning jack · hydraulic jacking cylinder`,bogie,'045','jacking');
    const sillFace=x-sx*E.sillWidth/2,far=x-sx*(J.offsetX+J.bodyRadius);
    B.box(jack,[(sillFace+far)/2,sillBottom-80,z],[Math.abs(far-sillFace),160,J.bracketWidth]);B.box(jack,[jx,sillBottom-200,z],[J.bodyRadius*2+120,80,J.bodyRadius*2+120]);
    for(const d of[-1,1])B.box(jack,[(sillFace+jx)/2,sillBottom-300,z+d*(J.bracketWidth/2-15)],[Math.abs(sillFace-jx),280,30]);
    B.cyl(jack,[jx,(sillBottom-240+J.bodyBottomY)/2,z],'y',J.bodyRadius,sillBottom-240-J.bodyBottomY,'dark',24);for(const y of[sillBottom-300,J.bodyBottomY+60])B.cyl(jack,[jx,y,z],'y',J.bodyRadius+25,40,'dark',24);
    B.cyl(jack,[jx,(J.bodyBottomY+J.padTopY+40)/2,z],'y',J.rodRadius,J.bodyBottomY-J.padTopY-40,'metal',20);B.cyl(jack,[jx,J.padTopY+20,z],'y',J.rodRadius+30,40,'metal',16);
    B.box(jack,[jx,J.padTopY-J.padThickness/2,z],[J.padSize,J.padThickness,J.padSize],'dark');for(const d of[-1,1])B.tube(jack,[jx+sx*J.bodyRadius,sillBottom-400,z+d*60],[sillFace,sillBottom-400,z+d*60],12,'dark',6);
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
      B.cyl(rim,[0,0,0],'x',E.tyreRimDiameter/2,E.tyreWidth+30,'metal',40);for(const s of[-1,1]){B.cyl(rim,[s*310,0,0],'x',210,65,'metal',32);for(let i=0;i<10;i++)B.cyl(rim,[s*348,310*Math.cos(i*Math.PI/5),310*Math.sin(i*Math.PI/5)],'x',26,38,'metal',6);}
      if(pos==='outer'){
        // The reducer seats on the equalizer end (top 3240); motor, output shaft and small sprocket sit above it.
        const ry=3465,sy=3435,my=ry+225+90;
        const drive=part(`gantry.drive.${id}`,`${title(words(id))} gantry reducer FVS370 · outer wheel`,bogie,'041','gantry');B.box(drive,[x,ry,wz],[620,450,550]);B.box(drive,[x,my-45,wz],[720,90,720]);B.cyl(drive,[x+sx*500,sy,wz],'x',110,260,'dark',16);
        const motor=part(`gantry.drive-motor.${id}`,`${title(words(id))} gantry motor 25 kW with brake`,bogie,'041','gantry');B.cyl(motor,[x,my+575,wz],'y',245,1150,'dark',24);B.cyl(motor,[x,my+1210,wz],'y',290,120,'dark',24);for(let i=0;i<6;i++)B.ring(motor,[x,my+125+i*150,wz],'y',250,10,'metal',24);B.box(motor,[x+sx*260,my+375,wz],[140,260,220],'dark');
        const chain=part(`gantry.chain.${id}`,`${title(words(id))} double-strand roller chain and guard`,bogie,'047','gantryChain');
        B.poly(chain,[[wz-470,940],[wz+400,940],[wz+250,sy+100],[wz-190,sy+100]],95,x+sx*560,'dark');
        for(const dz of[-1,1]){const a=[x+sx*640,sy,wz+dz*rSmall],b=[x+sx*640,930,wz+dz*rLarge];for(const off of[-18,18])B.tube(chain,[a[0]+off,a[1],a[2]],[b[0]+off,b[1],b[2]],14,'dark',6);}
        B.cyl(chain,[x+sx*640,sy,wz],'x',rSmall,75,'metal',32);
        const sprocket=part(`gantry.sprocket.${id}`,`${title(words(id))} 58-tooth wheel sprocket`,bogie,'047','gantryChain');B.cyl(sprocket,[x+sx*640,930,wz],'x',rLarge,75,'metal',48);
        for(let i=0;i<58;i++){const a=i*2*Math.PI/58;B.box(sprocket,[x+sx*640,930+(rLarge+18)*Math.sin(a),wz+(rLarge+18)*Math.cos(a)],[70,30,22],'metal');}
        const anti=part(`gantry.anti-collision.${id}`,`${title(words(id))} corner anti-collision switch`,bogie,'161','safety');const az=wz+pair*1010;B.box(anti,[x+sx*520,1650,az],[180,240,130],'dark');B.tube(anti,[x+sx*520,1770,az],[x+sx*520,2450,az],12,'metal',6);B.cyl(anti,[x+sx*520,2470,az],'y',30,40,'#f0a020',8);
      }
    }
  }
  const hyd=part('gantry.hydraulic-station.main','Steering hydraulic station',gantry,'043','gaItems');const hx=-S-E.sillWidth/2-360;
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
      const d=sx<0?'a':'b',drive=part(`trolley.drive.${d}`,`Trolley direct-wheel gearmotor ${d.toUpperCase()} · KH107`,trolley,'021','trolley');B.box(drive,[sx*2025,fy,sz*3620],[450,500,350]);B.cyl(drive,[sx*2025,fy+520,sz*3620],'y',180,600,'dark');
      const brake=part(`trolley.drive-brake.${d}`,`Trolley motor brake and fan cowl ${d.toUpperCase()}`,trolley,'021','trolley');B.cyl(brake,[sx*2025,fy+890,sz*3620],'y',150,140,'dark',20);B.ring(brake,[sx*2025,fy+965,sz*3620],'y',120,10,'metal',20);
    }
  }
  for(const[sz,id]of ENDS){const k=part(`trolley.anchor.${id}`,`Trolley storm anchor device · ${id}`,trolley,'021','trolleyItems');B.box(k,[0,fy-280,sz*(G-420)],[300,320,260],'dark');B.cyl(k,[0,fy-560,sz*(G-420)],'y',45,320,'metal',12);B.box(k,[0,fy-140,sz*(G-420)],[180,60,180],'#f0a020');}
  const lube=part('trolley.lubrication.main','Centralized lubrication pump',trolley,'151','trolleyItems');B.box(lube,[-1650,fy+560,1000],[450,550,300],'dark');B.cyl(lube,[-1650,fy+1035,1000],'y',130,400,'white',16);
  // Grease lines run below the rope leads and outboard of every sheave to the four wheel bearings.
  const ly=fy+120;B.tube(lube,[-1650,fy+285,1000],[-1650,ly,1000],8,'dark',4);B.tube(lube,[-1650,ly,1000],[-1250,ly,1000],8,'dark',4);for(const[sz]of ENDS){B.tube(lube,[-1250,ly,1000],[-1250,ly,sz*3050],8,'dark',4);for(const[sx]of SIDES)B.tube(lube,[-1250,ly,sz*3050],[sx*2025,ly,sz*3050],8,'dark',4);}
  const box=part('trolley.connect-box.main','Trolley connect box',trolley,'051','trolleyItems');B.box(box,[-2350,fy+930,-1400],[450,1300,450],'white');B.box(box,[-2580,fy+930,-1400],[20,1100,360],'dark');
  const ohl=part('trolley.overheight-limit.main','Over-height limit device',trolley,'161','trolleyItems');B.box(ohl,[0,fy-330,-800],[300,250,250],'dark');B.tube(ohl,[0,fy-455,-800],[0,fy-1955,-800],14,'metal',6);B.box(ohl,[0,fy-1985,-800],[200,60,60],'#f0a020');
  for(const[sz,id]of ENDS){const k=part(`auxiliary.floodlight.trolley.${id}`,`Trolley floodlight · ${id}`,trolley,'131','lights');B.box(k,[0,R+200,sz*3600],[420,260,180],'white');B.box(k,[0,R+60,sz*3600],[360,20,140],'glass');}

  // ── Hoist machinery (Fig 2-10) ──
  const hoist=B.container('container.hoist','Hoist machinery and reeving',trolley,'hoist');const dy=E.drumCentreY,mz=E.motorCentreZ;
  const drum=part('hoist.drum.main','Hoist drum Ø1200 · eight groove groups',hoist,'011','hoist','position',{userData:{motionRole:'drum'}});B.objects.get(drum).position.set(0,dy/1000,0);
  B.cyl(drum,[0,0,0],'x',P('drumDiameter')/2,E.drumLength,'dark',64);for(const x of[-1480,1480])B.cyl(drum,[x,0,0],'x',690,50,'metal',48);for(const g of E.reeving.grooveX)for(const sg of[-1,1])for(let w=0;w<6;w++)B.ring(drum,[sg*g+(w-2.5)*30,0,0],'x',606,8,'metal',48);
  const coupling=part('hoist.drum-coupling.main','Drum coupling to reducer',hoist,'011','hoistDrive');B.cyl(coupling,[1515,dy,0],'x',360,60,'metal',40);for(let i=0;i<12;i++){const a=i*Math.PI/6;B.cyl(coupling,[1515,dy+300*Math.cos(a),300*Math.sin(a)],'x',18,90,'dark',6);}
  const bearing=part('hoist.drum-bearing.main','Drum bearing seat (non-drive end)',hoist,'011','hoistDrive');B.box(bearing,[-1640,fy+500,0],[240,550,650]);B.cyl(bearing,[-1640,dy,0],'x',250,200,'metal',32);B.box(bearing,[-1640,fy+260,0],[500,80,850]);
  const base=part('hoist.machinery-base.main','Hoist machinery base plates',hoist,'011','hoistDrive');B.box(base,[300,28420,mz],[1500,180,850]);B.box(base,[1770,28375,675],[700,90,2050]);
  const reducer=part('hoist.reducer.main','Hoist reducer SEW ML4PSF140E · casing',hoist,'011','hoist');B.box(reducer,[1770,dy,750],[550,900,2100]);B.box(reducer,[1770,dy+80,750],[620,70,2150],'metal');for(const z of[mz])B.cyl(reducer,[1410,dy,z],'x',210,300);
  const oil=part('hoist.reducer-oil.main','Reducer oil level indicator, drain valve and breather',hoist,'011','hoistDrive');B.cyl(oil,[1770,dy-250,-330],'z',45,60,'glass',16);B.cyl(oil,[1770,dy-430,-330],'z',25,80,'metal',8);B.cyl(oil,[1770,dy+515,300],'y',50,120,'metal',12);
  const motor=part('hoist.motor.main','Hoist motor 180 kW · YASKAWA',hoist,'011','hoist');B.cyl(motor,[300,dy,mz],'x',360,1300,'dark',32);for(let i=0;i<10;i++)B.ring(motor,[-300+i*120,dy,mz],'x',364,16,'metal');for(const s of[-1,1])B.box(motor,[300,dy-300,mz+s*300],[1100,120,80],'dark');
  const fan=part('hoist.motor-fan.main','Hoist motor cooling fan with filter',hoist,'011','hoistDrive');B.cyl(fan,[-460,dy,mz],'x',400,220,'dark',32);for(const r of[120,240,350])B.ring(fan,[-575,dy,mz],'x',r,10,'metal',24);
  const enc=part('hoist.encoder.main','Hoist motor pulse encoder',hoist,'011','hoistDrive');B.cyl(enc,[-630,dy,mz],'x',95,100,'dark',16);B.box(enc,[-630,dy+120,mz],[60,60,60],'dark');
  const hsc=part('hoist.hs-coupling.main','High-speed couplings and shafts',hoist,'011','hoistDrive');for(const[a,b]of[[950,1495],[2045,2450]]){B.tube(hsc,[a,dy,mz],[b,dy,mz],75,'metal');B.cyl(hsc,[a+90,dy,mz],'x',150,110,'metal',24);}
  for(const[x,id]of[[1100,'a'],[2300,'b']]){const k=part(`hoist.brake.${id}`,`Hoist high-speed disc brake ${id.toUpperCase()}`,hoist,'011','hoist');B.cyl(k,[x,dy,mz],'x',315,40,'metal');for(const z of[-1,1])B.box(k,[x,dy-50,mz+z*270],[350,460,180],'dark');B.box(k,[x,28460,mz],[500,260,800]);}
  for(const[name,label,dz]of[['overspeed-switch','Hoist overspeed protection switch',220],['cam-limit','Hoist cam limit switch',-220]]){const k=part(`hoist.${name}.main`,label,hoist,'011','hoistDrive');B.box(k,[-1900,dy,dz],[260,240,240],'dark');B.tube(k,[-1760,dy,0],[-1770,dy,dz],20,'metal',6);B.box(k,[-1900,dy+150,dz],[120,60,120],'#f0a020');}
  const reel=part('hoist.spreader-cable.reel','Spreader cable reel (SCF1)',hoist,'014','trolleyItems');B.cyl(reel,[2350,28950,-1200],'z',420,360,'dark',40);for(const dz of[-1,1])B.cyl(reel,[2350,28950,-1200+dz*190],'z',470,20,'metal',40);B.box(reel,[2400,fy+405,-1200],[300,250,500],'dark');

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
  const ropesDef=[];
  for(const[sz,endId]of[[1,'front'],[-1,'rear']])for(const[sx,side]of SIDES)ropesDef.push({pair:'end',sz,sx,label:`${endId} (${sz>0?'+':'−'}Z) end pair, ${side} fall`,xg:sx*(sz>0?RV.grooveX[3]:RV.grooveX[0]),C:[sx*RV.endSheaveX,Yf,sz*RV.endSheaveZ],e1:[sx,0,0],end:[sx*RV.endRopeX,RV.endRopeY,sz*RV.ropeTerminalZ],pin:[0,RV.pinY,sz*RV.ropeTerminalZ]});
  for(const[sx,side]of[[1,'right'],[-1,'left']])for(const[sz,endId]of[[1,'front'],[-1,'rear']]){const xg=sx*(sx*sz>0?RV.grooveX[1]:RV.grooveX[2]);ropesDef.push({pair:'side',sz,sx,label:`${side} (${sx>0?'+':'−'}X) side pair, ${endId} fall`,xg,C:[xg,Yf,sz*RV.sideSheaveZ],e1:[0,0,sz],end:[xg,RV.sideRopeY,sz*RV.sideRopeZ],pin:[sx*RV.sidePinX,RV.pinY,0]});}
  const ropeLengths=[];
  ropesDef.forEach((r,i)=>{
    const n=i+1,top=r.sz<0,yLead=top?yTop:yBot,Y=[0,1,0],toLocal=p=>[dot(add(p,r.C,-1),r.e1),p[1]-r.C[1]],to3=([u,v])=>[r.C[0]+u*r.e1[0],r.C[1]+v,r.C[2]+u*r.e1[2]],ang=([u,v])=>Math.atan2(v,u);
    const axle=r.e1[0]?'z':'x',fall=part(`reeving.sheave.fall-${n}`,`Fall sheave ${n} · ${r.label}`,hoist,'015','reeving');
    B.cyl(fall,r.C,axle,Rs-rr,90,'metal',40);for(const d of[-1,1])B.cyl(fall,add(r.C,axle==='z'?[0,0,d*52]:[d*52,0,0]),axle,Rs+40,16,'dark',40);B.cyl(fall,r.C,axle,90,250,'metal',16);
    // Fork plates carry the shaft to the trolley end beam (end pairs) or trolley girder (side pairs).
    for(const d of[-1,1]){if(axle==='z')B.box(fall,[r.C[0]+r.sx*270,Yf,r.C[2]+d*80],[540,280,16],'dark');else B.box(fall,[r.C[0]+d*80,Yf,r.C[2]+r.sz*445],[16,280,890],'dark');}
    const k=part(`reeving.rope.route-${n}`,`Hoist rope ${n} · ${r.label}`,hoist,'015','reeving');
    const pts=[];let thetaArr,lead=0;
    if(r.pair==='end'){
      const gk=part(`reeving.sheave.guide-${n}`,`Horizontal guide sheave ${n} · ${r.sz>0?'front':'rear'} end, ${r.sx>0?'right':'left'}`,hoist,'015','reeving');
      const Cg=[r.xg+r.sx*Rg,yLead,r.sz*(RV.endSheaveZ-Rg)];B.cyl(gk,Cg,'y',Rg-rr,90,'metal',40);for(const d of[-1,1])B.cyl(gk,add(Cg,[0,d*52,0]),'y',Rg+40,16,'dark',40);
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
  const basket=part('hoist.spreader-cable.basket','Spreader cable storage basket',suspended,'014','spreader');for(const[y,r]of[[1350,380],[2050,520]])B.ring(basket,[0,y,0],'y',r,25,'metal');for(let i=0;i<12;i++){const a=i*Math.PI/6;B.tube(basket,[380*Math.cos(a),1350,380*Math.sin(a)],[520*Math.cos(a),2050,520*Math.sin(a)],15,'metal',6);}
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
  const door=part('cabin.door.main','Cab side door with window',cab,'141','cabin',{enclosure:true});B.box(door,[cx+720,cy+1000,-1025],[700,2000,45],'white');B.box(door,[cx+720,cy+1500,-1052],[480,650,16],'glass');B.box(door,[cx+450,cy+1000,-1080],[140,30,55],'dark');
  const frameSup=part('cabin.support-frame.main','Cab cantilever support beams',cab,'141','cabin');for(const z of[-800,800])B.box(frameSup,[cx+250,hangTop+125,z],[1900,250,200]);B.box(frameSup,[cx+1050,hangTop+125,0],[200,250,1800]);
  for(const[sx,side]of SIDES)for(const[sz,end]of ENDS){const k=part(`cabin.suspension.${side}.${end}`,`Cab hanger and resilient mount · ${sx<0?'forward':'aft'}, ${sz<0?'door side':'far side'}`,cab,'141','cabin');const x=cx+sx*850,z=sz*800;B.beam(k,[x,cy+2250,z],[x,hangTop,z],100,100,'metal');B.cyl(k,[x,cy+2310,z],'y',90,120,'rubber');B.box(k,[x,hangTop-20,z],[240,40,240],'dark');}
  const seat=part('cabin.seat.main','Operator seat',cab,'141','cabin',{modes:['technical']});B.box(seat,[cx+200,cy+600,0],[650,180,650],'dark');B.box(seat,[cx+490,cy+1100,0],[150,900,600],'dark');B.cyl(seat,[cx+200,cy+300,0],'y',140,500);
  for(const[sz,id]of ENDS){const z=sz*650,k=part(`cabin.console.${id==='rear'?'left':'right'}`,`Operator ${id==='rear'?'left':'right'} control console`,cab,'141','cabin',{modes:['technical']});B.box(k,[cx+100,cy+700,z],[1000,700,350],'white');B.cyl(k,[cx-100,cy+1150,z],'y',30,220,'dark');B.box(k,[cx+350,cy+1130,z],[250,60,200],'dark');}
  const wiper=part('cabin.wiper.main','Front window wiper',cab,'141','cabin');B.tube(wiper,[cx-1040,cy+1450,-100],[cx-1040,cy+2100,400],12,'dark',6);B.box(wiper,[cx-1020,cy+1420,-100],[60,80,80],'dark');
  const cabAc=part('cabin.aircon.main','Cab air conditioner · assumed envelope',cab,'152','cabin');B.box(cabAc,[cx+600,cy+2490,0],[850,420,800],'white');for(let j=0;j<7;j++)B.box(cabAc,[cx+600,cy+2350+j*40,415],[650,12,20],'dark');
  const landing=part('cabin.landing.main','Cab side landing and guard rail',cab,'151','cabin');B.box(landing,[cx+450,cy,-1550],[2800,90,1000],'dark');B.rail(landing,[[cx-950,cy,-2025],[cx+1850,cy,-2025],[cx+1850,cy,-1050]],1000);
  const ladder=part('cabin.ladder.main','Cab access ladder to trolley',cab,'151','cabin');for(const x of[cx-950,cx-450])B.beam(ladder,[x,cy,-1500],[x,R+500,-1500],55,55);for(let y=cy+200;y<R+500;y+=300)B.tube(ladder,[cx-950,y,-1500],[cx-450,y,-1500],20,'metal',6);

  // ── IGUS energy chain in stainless guide trough (Fig 2-43 / 2-44) ──
  const chain=part('trolley-drive.energy-chain.main','IGUS energy chain 5050RHD · moving links',root,'023','chain');
  const chainMesh=new T.Mesh(chainGeometry(0,(R+250)/1000,-4.9),mats.dark);chainMesh.name=chain+'--moving-links';chainMesh.userData={motionRole:'energy-chain',y:(R+250)/1000,z:-4.9};B.objects.get(chain).add(chainMesh);
  B.recipes.push({nodeKey:chain,primitive:'constant-length-u-carrier',parameters:{radius:300,straightTotal:12000,linkCount:104},authoringUnits:'mm',provenance:{kind:'estimated',sources:[sources.chain]},confidence:'low',endpoints:'Fixed anchor midspan; moving endpoint follows trolley; outboard route and raised handrail-crossing bracket assumed'});
  const trough=part('trolley-drive.chain-trough.main','Stainless steel energy-chain guide trough',root,'023','eroom');B.box(trough,[0,R+140,-4900],[22400,150,450],'metal');for(const dz of[-1,1])B.box(trough,[0,R+390,-4900+dz*235],[22400,350,20],'metal');for(let x=-10800;x<=10801;x+=2400)B.box(trough,[x,R+20,-4500],[100,100,780],'dark');
  const anchor=part('trolley-drive.chain-anchor.main','Energy-chain fixed-end anchor',root,'023','chain');B.box(anchor,[0,R+250,-4900],[400,160,520],'dark');
  const bracket=part('trolley-drive.chain-bracket.main','Energy-chain L bracket and floating connection',trolley,'023','eroom');B.beam(bracket,[0,R+850,-4900],[0,R+1300,-4900],100,100);B.beam(bracket,[0,R+1300,-4900],[0,R+1300,-3700],100,100);B.beam(bracket,[0,R+1300,-3700],[0,R+550,-3700],100,100);B.box(bracket,[0,R+850,-4900],[300,120,500],'metal');

  // ── Stairs, landings and walkways (JL28604) ──
  const access=B.container('container.access','Stairs, landings and upper walkways',root,'access');
  const points=[[S+1200,300,-1000],[S+1200,4200,5000],[S+1200,7800,3250],[S+1200,14800,-2700],[S+1200,21800,3250],[S+1200,24800,5000],[S+1200,R-95,3250]];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],f=part(`access.stair.flight-${i+1}`,`Stair flight ${i+1} · ${(a[1]/1000).toFixed(1)} → ${(b[1]/1000).toFixed(1)} m`,access,'151','access');
    for(const xoff of[-450,450])B.beam(f,[a[0]+xoff,a[1],a[2]],[b[0]+xoff,b[1],b[2]],80,140,'structure');const count=Math.ceil((b[1]-a[1])/220);for(let j=0;j<=count;j++){const t=j/count,p=a.map((v,c)=>v+(b[c]-v)*t);B.box(f,p,[900,40,280],'dark');}for(const xoff of[-450,450])B.rail(f,[[a[0]+xoff,a[1],a[2]],[b[0]+xoff,b[1],b[2]]]);
    const l=part(`access.stair.landing-${i+1}`,`Stair landing ${i+1} · ${(b[1]/1000).toFixed(1)} m`,access,'151','access');B.box(l,[b[0],b[1],b[2]],[1500,70,1300],'dark');for(const dx of[-1,1])B.box(l,[b[0]+dx*720,b[1]-200,b[2]],[60,400,60]);
  }
  for(const[sz,id]of ENDS){const z=sz*4100,k=part(`access.walkway.girder.${id}`,`${title(id)} girder walkway and handrail`,access,'151','access');B.box(k,[0,R-100,z],[E.girderLength,80,850],'dark');B.rail(k,[[-12300,R-60,z+sz*420],[12300,R-60,z+sz*420]]);}
  for(const[sx,side]of SIDES){const x=sx*12250,k=part(`access.walkway.cross.${side}`,`${title(side)} end cross landing and handrail`,access,'151','access');B.box(k,[x,R-100,0],[850,80,9000],'dark');B.rail(k,[[x,R-60,-4500],[x,R-60,4500]]);}
  const pl=part('access.ladder.power-room','Power-room platform access ladder',access,'151','access');const lx=-S-1600,lz=2900;for(const dx of[-250,250])B.beam(pl,[lx+dx,0,lz],[lx+dx,E.sillTop+1000,lz],55,55);for(let y=300;y<E.sillTop+900;y+=300)B.tube(pl,[lx-250,y,lz],[lx+250,y,lz],20,'metal',6);

  // ── Power room (−X) and electrical room (+X) on the sills; qualified area markers for internals ──
  for(const[sx,type,source]of[[1,'electrical','electrical'],[-1,'power','power']]){
    const x=sx*S,pre=type==='power'?'auxiliary':'electrical',h=type==='power'?2200:2800;
    const k=B.container(`container.${type}-room`,type==='power'?'Power room':'Electrical room',root,source,{enclosure:true});
    const shellKey=part(`${pre}.room.shell`,`${title(type)} room enclosure`,k,'151',source,{enclosure:true});
    B.box(shellKey,[x,E.sillTop+80,0],[2500,160,4900],'white');B.box(shellKey,[x,E.sillTop+h,0],[2500,100,4500],'white');for(const z of[-2200,2200])B.box(shellKey,[x,E.sillTop+h/2,z],[2350,h,60],'white');for(const dx of[-1180,1180])B.box(shellKey,[x+dx,E.sillTop+h/2,0],[60,h,4400],'white');
    const door=part(`${pre}.room.door`,`${title(type)} room access door`,k,'151',type==='electrical'?'eroom':source);B.box(door,[x+sx*1220,E.sillTop+1050,1000],[50,1950,850],'dark');B.box(door,[x+sx*1255,E.sillTop+1000,700],[30,40,140],'metal');
    const louvre=part(`${pre}.room.louvre`,`${title(type)} room ventilation louvre`,k,'151',source);for(let i=0;i<9;i++)B.box(louvre,[x+sx*1220,E.sillTop+500+i*125,-850],[70,35,900],'dark');
    const deck=part(`access.${type}-room.platform`,`${title(type)} room platform and guard rail`,k,'151','access');B.box(deck,[x+sx*1600,E.sillTop,0],[800,100,5500],'dark');B.rail(deck,[[x+sx*2000,E.sillTop,-2750],[x+sx*2000,E.sillTop,2750]]);
    const specs=type==='power'?[['engine','091'],['generator','092'],['battery','094']]:[['drives','071'],['plc','081'],['control','051']];
    specs.forEach(([name,sub],i)=>{const key=`${pre}.${name}.area`,point=[x/1000,(E.sillTop+1100)/1000,(i-1)*1.15],n=B.node(key,`${title(name)} · documented room, location unresolved`,k,sub,source,'hotspot',{modes:['technical'],provenance:{kind:'approximate-location',sources:[sources[source]]},qualifier:'Area marker only; not vendor geometry or exact mounting location',hotspot:{point,radius:.55,representation:'qualified-area'}});B.box(n,[x,E.sillTop+1000,(i-1)*1150],[1200,1300,750],'marker');});
    const acs=type==='power'?[['power','Power-room cooling / exhaust area','093',1700]]:[['electrical','Electrical-room air conditioner 1','152',1700],['electrical-2','Electrical-room air conditioner 2','152',-1700]];
    for(const[suffix,label,sub,z]of acs){const ac=B.node(`auxiliary.aircon.${suffix}`,label,k,sub,type==='electrical'?'eroom':source,'hotspot',{provenance:{kind:'approximate-location',sources:[sources[type==='electrical'?'eroom':source]]},hotspot:{point:[x/1000,(E.sillTop+h)/1000,z/1000],radius:.5},qualifier:'Location approximate; vendor drawing required'});B.box(ac,[x,E.sillTop+h+350,z],[850,650,450],'dark');}
    if(type==='power'){
      const ex=part('auxiliary.exhaust.main','Engine exhaust stack and rain cap',k,'091','power');B.tube(ex,[x+500,E.sillTop+h,-1500],[x+500,E.sillTop+h+1600,-1500],150,'dark',16);B.cyl(ex,[x+500,E.sillTop+h+1680,-1500],'y',220,50,'dark',16);
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
