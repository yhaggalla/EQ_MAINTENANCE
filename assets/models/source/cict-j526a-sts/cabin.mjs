// U1-C74: J526A3100 p1, A-A / B-B / C-C and plan. Local coordinates: rear x=0,
// walking floor y=0, centreline z=0; front faces +X. Millimetre inputs live in params.json.
// Vendor instrument faces, seat profiles, frame sections and display positions are illustrative.
export function cabinModel({ kit, THREE, P, x0, y0, halfWidth, hangerEnd, hangerY, railY }) {
  const { box, boxMinMax, beam, cyl, tube, railing } = kit;
  const L = P('cabinLengthX'), H = P('cabinBodyHeight'), W = halfWidth;
  const pt = (x, y, z) => [x0 + x, y0 + y, z];
  const b = (a, c) => boxMinMax(pt(...a), pt(...c));
  const line = (a, c, w=.055, h=w) => beam(pt(...a), pt(...c), w, h);
  const side = (poly, z, t=.025) => {
    const s = new THREE.Shape(); s.moveTo(...poly[0]); for (const p of poly.slice(1)) s.lineTo(...p); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth:t, bevelEnabled:false, steps:1 });
    g.translate(x0,y0,z-t/2); g.deleteAttribute('uv');
    if (!g.index) g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
    g.clearGroups(); return g;
  };
  const frontX = y => L - .2 + .2 * (y-.2)/(H-.2);
  const front = (ya,yb,z0=-W+.055,z1=W-.055,t=.025) =>
    beam(pt(frontX(ya),ya,(z0+z1)/2),pt(frontX(yb),yb,(z0+z1)/2),z1-z0,t,[1,0,0]);
  const sx = L-P('cabSeatFromFront');
  // Existing reference identities get proper rectangular housings attached INSIDE the cab.
  const instruments = [
    ...[-.68,0,.68].map((z,i)=>({key:`cabin.monitors.${i+1}`,c:pt(L-.44,2.12,z),s:[.10,.28,.43]})),
    {key:'cabin.twistlock-panel',c:pt(L-.29,.37,0),s:[.10,.16,.50]},
    {key:'cabin.floor-window-lighting',c:pt(L-.21,.25,0),s:[.10,.045,1.85]}
  ];
  const model = { instruments,
    instrumentGeometry() {
      // One material with vertex colours keeps each complete screen inside its own selectable
      // instance; screen faces must not accidentally belong to the neighbouring console identity.
      const colour=(geom,hex)=>{const c=new THREE.Color(hex),a=[];for(let i=0;i<geom.attributes.position.count;i++)a.push(c.r,c.g,c.b);geom.setAttribute('color',new THREE.Float32BufferAttribute(a,3));return geom;};
      return [colour(box([0,0,0],[1,1,1]),'#4a5560'),colour(box([-.506,0,0],[.012,.84,.87]),'#2f6d8e'),
        ...[-.18,0,.18].map(y=>colour(box([-.516,y,0],[.012,.035,.60]),'#8c949b'))];
    },
    accessSwitches:[pt(.52,1.12,W+.055),pt(.52,1.27,W+.055)],
    shell(g) {
      // 200-deep floor edge, solid rear service strip and central seat plinth. Side floor panes
      // and the rising front floor pane stay open to downward sightlines through the footrest.
      g.add('cabBody', b([0,-.2,-W],[.65,0,W]),b([.65,-.12,-.32],[1.90,0,.32]));
      for(const z of [-W+.04,W-.04]) g.add('cabFrame',line([0,-.06,z],[1.9,-.06,z],.08,.12),line([1.9,-.06,z],[L-.2,.14,z],.08,.12));
      for(const z of [-1,1]) {
        const za=z<0?-W+.08:.36,zb=z<0?-.36:W-.08;
        g.add('cabGlass',b([.69,-.025,za],[1.88,-.012,zb]));
        for(const zz of [za,zb]) g.add('cabFrame',line([.67,-.015,zz],[1.9,-.015,zz],.025,.025));
      }
      // Front floor: 900 run, 200 rise; 826 clear pane length centred within that frame.
      const fl=P('cabFloorWindowLength'),run=Math.sqrt(fl*fl-(fl*.2/Math.hypot(.9,.2))**2);
      const xa=2.35-run/2,xb=2.35+run/2,fy=x=>(x-1.9)*.2/.9;
      g.add('cabGlass',beam(pt(xa,fy(xa),0),pt(xb,fy(xb),0),2*W-.16,.018));
      for(const x of [1.9,L-.2]) g.add('cabFrame',line([x,fy(x),-W],[x,fy(x),W],.065,.06));
      for(const z of [-.33,.33]) g.add('cabFrame',line([1.9,.025,z],[L-.2,.225,z],.035,.03));
      for(let x=.72;x<1.9;x+=.19) for(const s of [-1,1]) g.add('cabFrame',line([x,.025,s*.35],[x,.025,s*(W-.08)],.025,.025));
      for(let x=1.98;x<2.78;x+=.16) g.add('cabFrame',line([x,fy(x)+.025,-W+.08],[x,fy(x)+.025,W-.08],.025,.025));
      // Front windscreen: broad fixed lower pane, 50 transom and upper hinged pane; no centre mullion.
      g.add('cabGlass',front(.28,1.46),front(1.51,2.00));
      g.add('cabBody',front(2.04,H,-W,W,.065));
      for(const y of [.23,1.485,2.025]) g.add('cabFrame',line([frontX(y),y,-W],[frontX(y),y,W],.05,.05));
      for(const z of [-W+.025,W-.025]) g.add('cabFrame',line([L-.2,.20,z],[L,H,z],.07,.07));
      g.add('cabFrame',line([frontX(1.48)+.035,1.48,0],[frontX(.65)+.035,.65,-.19],.022,.022),line([frontX(.55)+.045,.55,-.22],[frontX(1.27)+.045,1.27,-.10],.025,.025));
      // Side windows end at the SAME raked front posts; the door has open glazed apertures.
      for(const s of [-1,1]) {
        const z=s*W;
        g.add('cabGlass',side([[1.43,.10],[1.9,.10],[L-.2,.23],[frontX(1.46),1.46],[1.43,1.46]],z,.012),
          side([[1.43,1.52],[frontX(1.52),1.52],[frontX(2.00),2.00],[1.43,2.00]],z,.012));
        g.add('cabBody',b([s>0?0:1.39,2.05,z-.025],[L,H,z+.025]));
        for(const x of [0,1.39]) g.add('cabFrame',b([x-.035,0,z-.035],[x+.035,H,z+.035]));
        for(const y of [1.49,2.025]) g.add('cabFrame',line([1.39,y,z],[frontX(y),y,z],.05,.05));
        g.add('cabFrame',line([2.16,1.52,z],[2.16,2.00,z],.025,.025));
        if(s>0) {
          g.add('cabBody',b([.035,0,z-.025],[.48,2.05,z+.025]),b([1.31,0,z-.025],[1.36,2.05,z+.025]));
          for(const x of [.50,1.29]) g.add('cabFrame',line([x,.035,z],[x,2.04,z],.035,.035));
          for(const y of [.035,1.05,2.035]) g.add('cabFrame',line([.50,y,z],[1.29,y,z],.035,.035));
          g.add('cabGlass',b([.53,.07,z-.008],[1.26,1.02,z+.008]),b([.53,1.08,z-.008],[1.26,2.00,z+.008]));
          g.add('cabFrame',line([.56,1.10,z+.055],[.73,1.10,z+.055],.025,.025));
        } else {
          g.add('cabBody',b([.035,0,z-.025],[1.36,1.90,z+.025]));
          g.add('cabGlass',b([.18,1.94,z-.008],[1.24,2.24,z+.008]));
          g.add('cabBody',b([.035,1.90,z-.025],[.14,H,z+.025]),b([1.28,1.90,z-.025],[1.36,H,z+.025]),b([.14,2.28,z-.025],[1.28,H,z+.025]));
          // Cut the upper solid band around the rear hinged aperture (rather than covering the glass).
          g.add('cabFrame',line([.16,1.92,z],[1.26,1.92,z],.035),line([.16,2.26,z],[1.26,2.26,z],.035));
        }
      }
      g.add('cabBody',b([-.04,0,-W],[.02,H,W]),b([-.06,H,-W-.06],[L+P('cabinFrontOverhang')-.035,H+.065,W+.06]));
      g.add('cabFrame',b([L+P('cabinFrontOverhang')-.035,H-.045,-W-.06],[L+P('cabinFrontOverhang'),H+.065,W+.06]));
      // 2100 x 1940 mounting pitch, 110 aft offset. 2673 is mounting-top height, not enclosure height.
      const mount=P('cabMountTopHeight'),xs=[.11,.11+P('cabMountPitchX')],zs=[-P('cabMountPitchZ')/2,P('cabMountPitchZ')/2];
      for(const x of xs) for(const z of zs) {
        g.add('cabFrame',b([x-.13,H+.065,z-.13],[x+.13,H+.13,z+.13]),cyl(pt(x,mount-.07,z),'y',.105,.14,16),
          b([x-.06,mount,z-.06],[x+.06,hangerY-y0,z+.06]));
      }
      for(const z of zs) g.add('cabFrame',boxMinMax(pt(0,hangerY-y0,z-.08),[hangerEnd-.02,hangerY+.22,z+.08]));
      for(const x of [...xs,hangerEnd-x0-.1]) g.add('cabFrame',line([x,hangerY-y0+.11,-1.05],[x,hangerY-y0+.11,1.05],.16,.22));
      // Plan: rear 900 walkway, 4600 overall span and 850 x 1445 side return to the hinged door.
      const rear=-P('cabWalkwayWidth'),outer=-W+P('cabPlatformSpanZ'),sideZ=W+P('cabSideWalkwayWidth'),ret=P('cabSideWalkwayLength');
      g.add('paint',b([rear,-.08,-W],[0,0,outer]),b([0,-.08,W],[ret,0,sideZ]));
      for(const [a,c] of [[[rear,0,-W],[rear,0,outer]],[[rear,0,-W],[0,0,-W]],[[0,0,outer],[0,0,sideZ]],[[0,0,sideZ],[ret,0,sideZ]],[[ret,0,sideZ],[ret,0,W]]]) g.add('paint',...railing(pt(...a),pt(...c),{step:.9}));
      g.add('cabFrame',line([rear+.05,0,outer],[rear+.05,1.1,outer],.04),line([-.05,0,outer],[-.05,1.1,outer],.04),line([rear+.05,1.02,outer],[-.05,1.02,outer],.025),line([rear+.05,.5,outer],[-.05,.5,outer],.025));
      // Ladder reaches the trolley deck, with its lower access on the rear platform.
      for(const z of [-.25,.25]) g.add('paint',line([-.16,0,z],[-.16,railY-y0+.15,z],.045,.045));
      for(let y=.28;y<railY-y0;y+=.28) g.add('paint',line([-.16,y,-.25],[-.16,y,.25],.025,.025));
      g.add('paint',b([-.25,railY-y0-.06,-.4],[hangerEnd-x0,railY-y0,.4]));
      for(const z of [-.4,.4]) g.add('paint',...railing(pt(-.25,railY-y0,z),pt(hangerEnd-x0,railY-y0,z),{step:1}));
      // Ceiling light diffuser (floor-window strip owns its separate retained identity).
      g.add('cabBody',b([1.1,H-.035,-.5],[1.22,H-.012,.5]));
    },
    seat(g) {
      g.add('cabFrame',b([sx-.27,.01,-.28],[sx+.27,.055,.28]),cyl(pt(sx,.17,0),'y',.12,.25,16));
      for(let y=.28;y<.47;y+=.045) g.add('seat',b([sx-.22,y,-.23],[sx+.20,y+.032,.23]));
      g.add('seat',b([sx-.29,.48,-.29],[sx+.31,.60,.29]),line([sx-.31,.58,0],[sx-.41,1.27,0],.55,.14),box(pt(sx-.42,1.39,0),[.15,.23,.34]));
      for(const z of [-.32,.32]) {
        g.add('cabFrame',line([sx-.17,.58,z],[sx-.17,.81,z],.035,.035));
        g.add('seat',b([sx-.25,.80,z-.05],[sx+.12,.86,z+.05]));
      }
      g.add('cabFrame',line([sx+.12,.12,-.2],[sx+.46,.19,-.2],.035),line([sx+.12,.12,.2],[sx+.46,.19,.2],.035),b([sx+.35,.18,-.29],[sx+.52,.22,.29]));
    },
    consoles(g) {
      for(const s of [-1,1]) {
        const z=s*.57;
        g.add('cabFrame',b([sx-.22,.03,z-.17],[sx+.38,.77,z+.17]));
        g.add('seat',b([sx-.24,.77,z-.19],[sx+.40,.805,z+.19]),cyl(pt(sx+.15,.845,z),'y',.055,.08,12),tube(pt(sx+.15,.88,z),pt(sx+.11,1.02,z),.018,10),box(pt(sx+.11,1.04,z),[.06,.10,.055]));
        g.add('panel',b([sx-.17,.806,z-.12],[sx+.01,.814,z+.12]));
        for(const dx of [.07,.18,.29]) for(const dz of [-.12,.12]) g.add('panel',cyl(pt(sx+dx,.821,z+dz),'y',.018,.014,8));
      }
      // C-C: 600 x 1800 reel-control panel plus 1400 x 2000 CAB/spreader panel, 400/405 deep.
      const rearPanels=[[-1.0,-.4,1.8],[-.38,1.02,2.0]];
      for(const [za,zb,h] of rearPanels) {
        g.add('cabFrame',b([.04,.015,za],[.445,h,zb]));
        const split=zb-za>1?2:1;
        for(let k=0;k<split;k++) {
          const z0=za+k*(zb-za)/split,z1=za+(k+1)*(zb-za)/split;
          g.add('cabBody',b([.446,.07,z0+.025],[.454,h-.04,z1-.025]));
          g.add('seat',b([.455,.83,z1-.10],[.48,1.02,z1-.075]));
        }
      }
      // Auxiliary control station on the closed side, as section B-B.
      g.add('cabFrame',b([.63,.95,-W+.025],[1.19,1.80,-W+.15]));
      g.add('panel',b([.67,1.26,-W+.151],[1.15,1.72,-W+.16]));
      for(let i=0;i<4;i++) g.add('seat',cyl(pt(.72+i*.11,1.10,-W+.17),'z',.022,.025,10));
      // Screen supports attach to the ceiling; each display face belongs to its instrument instance.
      for(const m of instruments.filter(m=>m.key.includes('monitors'))) {
        const [x,y,z]=m.c;
        g.add('cabFrame',box([x,y+.21,z],[.045,.18,.045]));
      }
      g.add('cabFrame',b([L-.32,.18,-.045],[L-.26,.31,.045])); // indicator bracket to front floor frame
    }
  };
  // C75: drawing-local layout is mirrored so the door and boarding platform face the
  // elevator (-Z). Reverse triangle winding as well as normals; retain all semantic keys.
  const mirror = draw => g => draw({add:(mat,...geoms)=>{for(const geom of geoms.flat()){
    geom.scale(1,1,-1);const idx=geom.index;for(let i=0;i<idx.count;i+=3){const a=idx.getX(i);idx.setX(i,idx.getX(i+2));idx.setX(i+2,a);}g.add(mat,geom);
  }}});
  model.shell=mirror(model.shell);model.consoles=mirror(model.consoles);
  model.accessSwitches=model.accessSwitches.map(([x,y,z])=>[x,y,-z]);
  return model;
}
