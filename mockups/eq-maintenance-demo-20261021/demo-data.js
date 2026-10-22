/* Synthetic demonstration records. No production services are used. */
window.createDemoState = function () {
  const catalogue = structuredClone(window.DEMO_REFERENCE.catalogue);
  const state = {version:1,role:'Admin',catalogue, equipment:[],parts:[],jobs:[],replacements:[],audit:[],uploads:[],applicability:{QC:['01','02','03','04','05','06','07','08','11','12','13','14','15','16','17'],RTG:['01','02','04','05','06','07','08','09','11','12','13','14','15','16','17'],ES:['04','05','06','07','08','09','13','14','15','17']}};
  const configs = {QC:['Maintenance','Ready for OPS','Ready for OPS','Breakdown','Ready for OPS','Ready for OPS'],RTG:['Ready for OPS','Maintenance','Ready for OPS','Ready for OPS','Maintenance','Ready for OPS','Ready for OPS','Ready for OPS'],ES:['Ready for OPS','Ready for OPS','Maintenance',null]};
  for (const [type,statuses] of Object.entries(configs)) statuses.forEach((status,i)=>state.equipment.push({id:`${type}${String(i+1).padStart(2,'0')}`,type,model:type==='QC'?'J526A · STS reference':type==='RTG'?'RTG · demo configuration':'Empty stacker · demo configuration',location:type==='QC'?`Quay ${i<3?'north':'south'} · berth ${Math.floor(i/2)+1}`:type==='RTG'?`Yard block ${String.fromCharCode(65+Math.floor(i/2))}${(i%2)+1}`:`Empty yard · zone ${i+1}`,status,since:status?`2026-10-${status==='Breakdown'?'21':status==='Maintenance'?'20':'21'}T${String(6+i%4).padStart(2,'0')}:20:00+05:30`:null,reason:status==='Breakdown'?'Boom emergency brake pressure loss':status==='Maintenance'?'Planned inspection / corrective work':'Released following operational checks',active:true,updated:'2026-10-21T08:40:00+05:30'}));
  const positions={
    '011':[['motor-a','Hoist motor A','450 kW','DEMO-HM-A'],['motor-b','Hoist motor B','450 kW','DEMO-HM-B'],['gearbox','Hoist gearbox','SEW · reference','DEMO-GB'],['drum-a','Hoist drum A','Main hoist','DEMO-DR'],['brake','Hoist service brake','Brake assembly','DEMO-BR']],
    '012':[['emergency-brake','Hoist emergency brake','Hydraulic assembly','']],
    '015':[['rope-set','Main hoist rope set','Rope set','']],
    '021':[['frame','Trolley frame','Main assembly',''],['wheel-a','Trolley wheel · position A','Wheel assembly','DEMO-TW-A'],['wheel-b','Trolley wheel · position B','Wheel assembly','DEMO-TW-B']],
    '024':[['rope-set','Trolley rope set','Rope set','']],
    '031':[['girder','Boom main girder','Structural member',''],['boom-motor','Boom hoist motor','375 kW','DEMO-BM']],
    '032':[['emergency-brake','Boom emergency brake','Hydraulic assembly','DEMO-EB']],
    '033':[['rope-set','Boom hoist rope set','Rope set','']],
    '041':[['drive','Gantry drive assembly','20 kW per motor','DEMO-GD'],['wheel-a','Gantry wheel · position A','Wheel assembly','DEMO-GW']],
    '061':[['frame','Spreader frame','Spreader assembly',''],['twistlock','Twistlock set','Twistlock set','DEMO-TL']],
    '062':[['headblock','Headblock assembly','Headblock','DEMO-HB']],
    '071':[['inverter','Main drive inverter','Drive cabinet','DEMO-INV']],
    '081':[['plc','Main PLC cabinet','Simplified cabinet','DEMO-PLC']],
    '151':[['waterside-leg','Waterside leg','Structural member',''],['landside-leg','Landside leg','Structural member',''],['mast','A-frame / mast','Structural member',''],['rear-girder','Rear girder','Structural member',''],['machinery-house','Machinery house / access','Spatial enclosure','']],
  };
  state.equipment.forEach(eq=>catalogue.subMechanisms.filter(s=>s.active&&state.applicability[eq.type].includes(s.mainCode)&&!(eq.type==='QC'&&['043','044','045','047'].includes(s.code))).forEach(sub=>(positions[sub.code]||[['assembly',`${sub.name} assembly`,'Major assembly','']]).forEach(([key,name,spec,serial])=>state.parts.push({id:`${eq.id}|${sub.code}|${key}`,eq:eq.id,main:sub.mainCode,sub:sub.code,key,name,spec,serial:serial?`${serial}-${eq.id}`:'',installed:'2025-06-15',active:true}))));
  const defs=[
    ['QC01','01','011','gearbox','Hoist gearbox inspection & oil service','Repair','Current','High','2026-10-21','Inspect oil condition, couplings and gearbox bearing noise.'],
    ['QC04','03','032','emergency-brake','Replace boom emergency brake seal kit','Replacement','Current','Critical','2026-10-21','Restore hydraulic pressure and verify brake operation.'],
    ['RTG02','04','043','assembly','Gantry steering cylinder leak repair','Repair','Current','High','2026-10-22','Repair oil leak and inspect hose connections.'],
    ['QC02','02','021','wheel-a','Trolley wheel replacement · position A','Replacement','Pending','Medium','2026-10-22','Replace wheel assembly during planned maintenance window.'],
    ['ES03','09','093','assembly','Cooling-system inspection','Repair','Current','Medium','2026-10-21','Inspect coolant circuit and fan.'],
    ['QC01','01','015','rope-set','Main hoist wire-rope renewal','Replacement','Pending','High','2026-10-24','Prepare replacement rope set and reeving plan.'],
    ['RTG05','07','071','inverter','Drive cooling fan service','Repair','Pending','Medium','2026-10-23','Clean filter and inspect drive cabinet fan.'],
    ['QC03','01','011','motor-a','Hoist motor A replacement','Replacement','Completed','High','2026-10-19','New demonstration motor installed; checks recorded.'],
    ['QC01','01','011','motor-a','Hoist motor A replacement','Replacement','Completed','High','2026-10-09','Completed replacement with alignment checks.'],
    ['QC02','02','021','wheel-b','Trolley wheel · position B renewed','Replacement','Completed','Medium','2026-09-20','Wheel replacement and inspection completed.'],
    ['QC04','03','033','rope-set','Boom rope-set replacement','Replacement','Completed','High','2026-10-12','Demonstration reeving work completed.'],
    ['ES01','13','131','assembly','Restore rear work light','Repair','Pending','Low','2026-10-25','Inspect lamp and control supply.'],
    ['RTG06','06','061','twistlock','Spreader twistlock-set replacement','Replacement','Completed','Medium','2026-10-08','Set renewed and functional checks recorded.'],
    ['QC05','08','081','plc','PLC communication diagnostics','Repair','Current','Medium','2026-10-22','Investigate intermittent communication event.'],
    ['QC06','15','153','assembly','Elevator door interlock inspection','Repair','Pending','Medium','2026-10-23','Inspect and record interlock operation.'],
    ['RTG04','04','041','wheel-a','Gantry wheel inspection','Repair','Pending','Low','2026-10-24','Inspect running surface and bearing condition.'],
    ['QC03','01','013','assembly','Load-cell system calibration checks','Repair','Pending','Medium','2026-10-24','Record checks during planned maintenance.'],
    ['ES02','09','094','assembly','Battery replacement','Replacement','Completed','Low','2026-10-16','Battery renewed in the dummy maintenance record.'],
    ['QC01','01','011','brake','Hoist brake adjustment','Repair','Completed','Medium','2026-10-20','Brake inspected and adjusted; measurements recorded.'],
    ['QC02','07','071','inverter','Inverter cooling filter inspection','Repair','Current','Low','2026-10-21','Bench inspection of spare cooling module.'],
  ];
  defs.forEach((d,i)=>{
    const [eq,main,sub,key,title,kind,status,priority,due,notes]=d;
    const part=state.parts.find(p=>p.eq===eq&&p.sub===sub&&p.key===key);
    const job={id:`WO-DEMO-${String(i+1).padStart(3,'0')}`,eq,main,sub,part:part?.id||'',title,kind,status,priority,due,notes,owner:i%3?'Demo technician':'Demo engineer',createdBy:i%4?'eq-team':'other-engineer',created:`2026-10-${String(Math.max(1,Number(due.slice(-2))-2)).padStart(2,'0')}T08:10:00+05:30`,completed:status==='Completed'?due:null,completionNote:status==='Completed'?notes:'',cancelled:false,evidence:[]};
    state.jobs.push(job);
    if(status==='Completed'&&kind==='Replacement'&&part){
      const serial=`DEMO-NEW-${eq}-${i+1}`;
      state.replacements.push({id:`REP-DEMO-${i+1}`,job:job.id,eq,part:part.id,main,sub,date:due,oldSerial:part.serial||'Unknown',newSerial:serial,item:`${part.name} · demonstration replacement`,qty:1,unit:part.key==='rope-set'?'set':'ea',actor:'Demo engineer'});
      part.serial=serial;part.installed=due;job.applied=true;
    }
  });
  state.audit=[
    {id:'A1',time:'2026-10-21T08:40:00+05:30',eq:'QC04',kind:'Status',text:'QC04 marked Breakdown',detail:'Boom emergency brake pressure loss',actor:'Demo engineer'},
    {id:'A2',time:'2026-10-21T08:12:00+05:30',eq:'QC01',kind:'Work',text:'Hoist gearbox inspection started',detail:'WO-DEMO-001 moved to Current',actor:'Demo technician'},
    {id:'A3',time:'2026-10-20T15:10:00+05:30',eq:'QC01',kind:'Completed',text:'Hoist brake adjustment completed',detail:'Equipment operational status was not changed',actor:'Demo engineer'},
    {id:'A4',time:'2026-10-19T10:25:00+05:30',eq:'QC03',kind:'Replacement',text:'QC03 hoist motor A replaced',detail:'Position history updated',actor:'Demo engineer'},
    {id:'A5',time:'2026-10-20T06:20:00+05:30',eq:'RTG02',kind:'Status',text:'RTG02 marked Maintenance',detail:'Steering cylinder repair',actor:'Demo technician'},
  ];
  return state;
};
