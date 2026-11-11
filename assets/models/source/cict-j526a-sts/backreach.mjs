// U1-C71: J526A1000, sheet 1 normal-operation pose; sheet 2: four pry bars/cylinders/sheaves.
// Local to the girder tail. Dimensions are read from params.json; mounting datum and fabrication detail are qualified estimates.
export function tlsLayout(P) {
  const tail = -P('railGauge') - P('backreach') - P('girderTailBeyondBackreach');
  const deck = P('girderUndersideElevation') + P('girderDepth');
  const datum = deck + P('tlsMountAboveDeck');
  const anchor = [tail + P('tlsAnchorFromTail'), datum + P('tlsAnchorHeight')];
  const pivot = [anchor[0] - P('tlsPivotToAnchorX'), datum + P('tlsPivotHeight')];
  // Intersect the pry-bar rod-eye circle with the normal cylinder-length circle.
  const dx = anchor[0] - pivot[0], dy = anchor[1] - pivot[1], d = Math.hypot(dx, dy);
  const r = P('tlsPivotToRodEye'), length = P('tlsCylinderNormalLength');
  const a = (r*r - length*length + d*d)/(2*d), h = Math.sqrt(r*r-a*a);
  const eye = [pivot[0]+a*dx/d+h*dy/d, pivot[1]+a*dy/d-h*dx/d];
  // The fork below the rod eye is offset toward the tail (not a straight diagonal cylinder).
  const sx=eye[0]-P('tlsForkOffsetX');
  const sheave = [sx,pivot[1]-Math.sqrt(P('tlsLeverLength')**2-(sx-pivot[0])**2)];
  const zs = [-1,1].flatMap(s=>[s*P('tlsPairCentreZ')-P('tlsPairSpacing')/2,s*P('tlsPairCentreZ')+P('tlsPairSpacing')/2]).sort((a,b)=>a-b);
  return { tail, deck, datum, anchor, pivot, eye, sheave, zs, length,
    unit: [(anchor[0]-eye[0])/length,(anchor[1]-eye[1])/length],
    at: (p,z)=>[p[0],p[1],z] };
}

export function drawTlsFrame(g, L, kit, P) {
  const {boxMinMax,beam,cyl,tube}=kit, {tail,deck,datum,pivot,eye,sheave,zs,anchor,at}=L;
  for(const side of [-1,1]) {
    const z=side*P('tlsPairCentreZ'), half=P('tlsSupportHalfWidth');
    // Two three-cheek fixed supports, each carrying two independent pendulum levers.
    for(const dz of [-half,0,half]) {
      g.add('paint',boxMinMax([tail+.05,deck,z+dz-.07],[tail+1.45,datum+.04,z+dz+.07]),
        beam([tail+.10,datum,z+dz],at(pivot,z+dz),.10,.22));
    }
    g.add('steel',cyl(at(pivot,z),'z',.09,2*half+.12,16));
    g.add('paint',boxMinMax([anchor[0]-.35,datum,z-half],[anchor[0]+.35,anchor[1]-.14,z+half]));
  }
  for(const z of zs) {
    for(const dz of [-.13,.13]) g.add('paint',beam(at(pivot,z+dz),at(eye,z+dz),.045,.22),
      beam(at(eye,z+dz),at(sheave,z+dz),.045,.28),
      boxMinMax([anchor[0]-.18,anchor[1]-.15,z+dz-.04],[anchor[0]+.18,anchor[1]+.15,z+dz+.04]));
    g.add('steel',cyl(at(eye,z),'z',.065,.40,16),cyl(at(pivot,z),'z',.10,.34,16));
    // Thin hydraulic hoses follow the support; no extra cylinder-shaped proxy.
    g.add('steel',tube([anchor[0]+.35,datum+.1,z],[anchor[0]+.45,anchor[1]+.15,z],.018,6));
  }
}

export function drawTlsCylinder(g, kit, P) {
  // Local +X from rod eye to body trunnion; trunnion is 2212 mm from the eye at normal operation.
  const {cyl,boxMinMax}=kit, gland=P('tlsExposedRod'), end=P('tlsCylinderBodyEnd');
  // One material keeps the exported carrier a single InstancedMesh (required by the existing picker).
  g.add('steel',cyl([gland/2,0,0],'x',P('tlsRodDiameter')/2,gland,16));
  g.add('steel',cyl([(gland+end)/2,0,0],'x',P('tlsBarrelOuterDiameter')/2,end-gland,20),
    cyl([gland,0,0],'x',.17,.10,20),cyl([end,0,0],'x',.17,.10,20),
    cyl([0,0,0],'z',.125,.22,18),cyl([P('tlsCylinderNormalLength'),0,0],'z',.065,.42,16));
  for(const x of [gland+.12,end-.15]) g.add('steel',boxMinMax([x-.045,.10,-.045],[x+.045,.20,.045]));
}
