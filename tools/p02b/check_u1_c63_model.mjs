// Revision-7 rule checks in isolated synthetic VM stores. No network, SQL or production authorization claim.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const out=process.argv[2] || 'docs/evidence/U1/asset-management-c63/model-checks.json';
const persisted=new Map(), checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
function boot() {
  const box=vm.createContext({console,Intl,Date,URLSearchParams,setTimeout,clearTimeout});box.window=box;
  box.localStorage={getItem:k=>persisted.get(k)||null,setItem:(k,v)=>persisted.set(k,v),removeItem:k=>persisted.delete(k)};
  for(const name of ['util','catalog','params','fac-ref','fixtures','access','store','manual-status','spares','fac','dialogs','views-jobs','views-eqjobs'])vm.runInContext(fs.readFileSync('artifacts/prototypes/p02-ui/js/'+name+'.js','utf8'),box,{filename:name+'.js'});
  box.EQ.reset();box.EQ.state.role='admin';box.EQ.access.refreshSession('C63 model check');return box;
}
let box=boot(),E=box.EQ;
const before=()=>JSON.stringify(E.state.D.equipment.map(e=>[e.id,e.status,e.statusSince,e.currentStatusChangeId]));
const update=(id,status,extra={})=>E.api.setStatus(id,{status,reason:status==='isolated'?'Synthetic manual C63 isolation':'',expectedCurrentStatusChangeId:E.eq(id)?.currentStatusChangeId,key:'test-'+Math.random(),...extra});
try {
  check('AM04 exactly two current status definitions',Object.keys(E.STATUS).sort().join()==='isolated,readyForOps');
  check('AM05 all 67 explicitly authored choices and events',E.manual.baseline.length===67&&new Set(E.manual.baseline.map(x=>x[0])).size===67&&E.state.D.equipment.every(e=>E.manual.valid(e.status)&&e.statusBy&&E.state.D.statusChanges.some(c=>c.id===e.currentStatusChangeId&&c.equipmentId===e.id&&c.source==='manual')));
  check('AM10 baseline reconciles without a conversion algorithm',JSON.stringify(E.fleetCounts(E.state.D.equipment))===JSON.stringify({readyForOps:61,isolated:6,total:67}),E.fleetCounts(E.state.D.equipment));
  check('AM02 integration data and executable API absent',!E.cmms&&!E.state.D.cmms&&!E.dailyRows);
  const old=E.state.D.statusChanges.filter(c=>c.legacy).map(c=>JSON.stringify(c));
  check('AM04 truthful old status events retained',old.length>0&&E.state.D.statusChanges.some(c=>c.legacy&&c.status==='maintenance')&&E.statusLabel('maintenance')==='Legacy: Maintenance');
  for(const role of ['management','facTeam']) {
    E.state.role=role;E.access.refreshSession('denial');const b=before();
    check('AM05 '+role+' status API denied',update('eq-qc-demo-02','isolated').status===403&&before()===b);
    check('ADM01 '+role+' registration denied',E.api.createEquipment({code:'DENIED',typeCode:'QC',status:'readyForOps'}).status===403);
  }
  E.state.role='admin';E.access.refreshSession('admin');
  for(const status of [null,'breakdown','maintenance','unreported','automatic','']) {
    const b=before(),r=update('eq-qc-demo-02',status);check('AM05 invalid current value rejected '+String(status),r.status===422&&before()===b,r.code);
  }
  check('AM05 isolated reason required',update('eq-qc-demo-02','isolated',{reason:''}).status===422);
  check('AM05 overlong reason rejected',update('eq-qc-demo-02','isolated',{reason:'x'.repeat(501)}).status===422);
  check('AM05 cross-equipment related job rejected',update('eq-qc-demo-02','isolated',{relatedJobId:'job-104'}).status===422);
  check('AM05 cancelled related job rejected',update('eq-qc-demo-02','isolated',{relatedJobId:'job-205'}).status===422);
  check('AM06 missing concurrency token rejected',E.api.setStatus('eq-qc-demo-02',{status:'isolated',reason:'Synthetic'}).status===409);
  const request={status:'isolated',reason:'Synthetic manual isolation',expectedCurrentStatusChangeId:E.eq('eq-qc-demo-02').currentStatusChangeId,key:'stable-retry'};
  const r=E.api.setStatus('eq-qc-demo-02',request);check('AM05 valid explicit change records actor/time/reason',r.ok&&r.change.by==='u-admin'&&r.change.reason===request.reason&&E.eq('eq-qc-demo-02').status==='isolated');
  const eventCount=E.state.D.statusChanges.length;
  check('AM06 identical retry does not duplicate event',E.api.setStatus('eq-qc-demo-02',request).replayed&&E.state.D.statusChanges.length===eventCount);
  check('AM06 reused key with changed payload refused',E.api.setStatus('eq-qc-demo-02',{...request,status:'readyForOps'}).status===409);
  check('AM06 stale editor loses without corrupting state',E.api.setStatus('eq-qc-demo-02',{...request,key:'stale-request',status:'readyForOps'}).status===409&&E.eq('eq-qc-demo-02').status==='isolated');
  check('AM04 existing legacy event values unchanged',old.every(value=>E.state.D.statusChanges.some(c=>JSON.stringify(c)===value)));
  const current=E.eq('eq-qc-demo-02').currentStatusChangeId;
  box=boot();E=box.EQ;
  check('AM06 browser-local store restores status/history across reload',E.eq('eq-qc-demo-02').status==='isolated'&&E.eq('eq-qc-demo-02').currentStatusChangeId===current&&E.state.D.statusChanges.some(c=>c.id===current)&&!E.manual.warning);
  check('AM06 another equipment remains independent',E.eq('eq-qc-demo-03').status==='readyForOps');
  const b=before();E.spares.rows('eq-qc-demo-01');E.fac.dashboard({});
  check('AM06 FAC cycle and spare-date evaluation do not change EQ status',before()===b);
  const regCount=E.state.D.equipment.length,histCount=E.state.D.statusChanges.length;
  for(const p of [{code:'C63X',typeCode:'QC'},{code:'C63X',typeCode:'QC',status:'maintenance'},{code:'C63X',typeCode:'QC',status:'isolated',reason:''}])check('ADM01 incomplete registration atomic '+JSON.stringify(p),E.api.createEquipment(p).status===422&&E.state.D.equipment.length===regCount&&E.state.D.statusChanges.length===histCount);
  const newEq=E.api.createEquipment({code:'C63-MANUAL',typeCode:'QC',status:'isolated',reason:'Synthetic registration isolation'});
  check('ADM01 explicit registration and first event atomic',newEq.ok&&newEq.eq.status==='isolated'&&E.state.D.statusChanges.some(c=>c.equipmentId===newEq.eq.id&&c.prev===null&&c.by==='u-admin'));
  const newId=newEq.eq.id;box=boot();E=box.EQ;
  check('AM06 newly registered demo status survives browser-local reload',E.eq(newId)?.status==='isolated'&&E.eq(newId).code==='C63-MANUAL');
  const newEq2=E.api.createEquipment({code:'C63-SECOND',typeCode:'QC',status:'readyForOps'});
  check('S12 stable registered identities remain unique after reload',newEq2.ok&&newEq2.eq.id!==newId&&new Set(E.state.D.equipment.map(e=>e.id)).size===E.state.D.equipment.length);
  E.state.role='management';E.access.refreshSession('read-only');
  check('S11 export denied when optional export policy disabled',E.access.save([{role:'management',feature:'export.excel',on:false}],E.state.D.access.version,'Denied from Management').status===403);
  E.state.role='admin';E.access.refreshSession('admin');
  check('AM07 removed daily export refuses rather than changing meaning',E.eqExport('daily',{}).status===404);
  check('S29 retained special export works',E.eqExport('special',{}).ok);
  check('S22 retained spare register and prediction work',E.spares.rows('eq-qc-demo-01').some(row=>row.predicted)&&E.eqExport('spare',{}).ok);
  // Independent stores sharing one persistence backend reproduce the reviewer's real two-tab failure.
  persisted.clear();
  const tabA=boot().EQ,tabB=boot().EQ;
  const payload=(tab,id,status='isolated',key=id)=>({status,reason:'Explicit independent-tab test',expectedCurrentStatusChangeId:tab.eq(id).currentStatusChangeId,key:'tabs-'+key});
  const staleSame=payload(tabB,'eq-qc-demo-02','readyForOps','stale-same');
  const aChange=tabA.api.setStatus('eq-qc-demo-02',payload(tabA,'eq-qc-demo-02'));
  const bChange=tabB.api.setStatus('eq-qc-demo-03',payload(tabB,'eq-qc-demo-03'));
  check('AM06 independent tabs save unrelated equipment without lost history',aChange.ok&&bChange.ok&&tabB.eq('eq-qc-demo-02').currentStatusChangeId===aChange.change.id);
  let reloaded=boot().EQ;
  check('AM06 reload retains both independent-tab status events',reloaded.eq('eq-qc-demo-02').status==='isolated'&&reloaded.eq('eq-qc-demo-03').status==='isolated'&&[aChange.change.id,bChange.change.id].every(id=>reloaded.state.D.statusChanges.some(c=>c.id===id)));
  const sharedBefore=persisted.get(tabB.manual.key),same=tabB.api.setStatus('eq-qc-demo-02',staleSame);
  check('AM06 stale same-equipment tab conflicts without persisted mutation',same.status===409&&same.code==='status_changed'&&persisted.get(tabB.manual.key)===sharedBefore);
  const regA=boot().EQ,regB=boot().EQ;
  const createdA=regA.api.createEquipment({code:'TWO-TAB-A',typeCode:'QC',status:'readyForOps'});
  const createdB=regB.api.createEquipment({code:'TWO-TAB-B',typeCode:'QC',status:'readyForOps'});
  check('ADM01 independent-tab registrations have distinct stable IDs',createdA.ok&&createdB.ok&&createdA.eq.id!==createdB.eq.id);
  reloaded=boot().EQ;
  check('ADM01 both independent-tab registrations survive reload',reloaded.state.D.equipment.some(e=>e.code==='TWO-TAB-A')&&reloaded.state.D.equipment.some(e=>e.code==='TWO-TAB-B'));
  const duplicate=regA.api.createEquipment({code:'TWO-TAB-B',typeCode:'QC',status:'readyForOps'});
  check('ADM01 cross-tab duplicate code rejected before mutation',duplicate.status===422&&boot().EQ.state.D.equipment.filter(e=>e.code==='TWO-TAB-B').length===1);
  const retA=boot().EQ,retB=boot().EQ;
  check('AM06 independent-tab retirement commits',retA.api.retireEquipment('eq-qc-demo-14').ok);
  const next=retB.api.setStatus('eq-qc-demo-05',payload(retB,'eq-qc-demo-05'));
  check('AM06 another tab status save does not resurrect retired equipment',next.ok&&boot().EQ.eq('eq-qc-demo-14').lifecycle==='retired');
  const retiredWrite=retB.api.setStatus('eq-qc-demo-14',payload(retB,'eq-qc-demo-14'));
  check('AM05 latest cross-tab retirement blocks status write',retiredWrite.status===409&&retiredWrite.code==='equipment_retired');
  const staleAfterReset=boot().EQ,resetter=boot().EQ;
  resetter.reset({clearStatus:true});
  const resetBefore=persisted.get(staleAfterReset.manual.key);
  const resetWrite=staleAfterReset.api.setStatus('eq-qc-demo-07',payload(staleAfterReset,'eq-qc-demo-07'));
  check('AM06 reset in another tab cannot resurrect an old snapshot',resetWrite.status===409&&resetWrite.code==='local_status_changed'&&persisted.get(staleAfterReset.manual.key)===resetBefore&&boot().EQ.state.D.equipment.length===67);
  box=boot();E=box.EQ;
  const baselineTime=E.eq('eq-qc-demo-02').statusSince;
  box=boot();E=box.EQ;
  check('AM06 untouched baseline event time stays fixed across reload',E.eq('eq-qc-demo-02').statusSince===baselineTime&&E.state.D.statusChanges.find(c=>c.id===E.eq('eq-qc-demo-02').currentStatusChangeId).at===baselineTime);
  E.reset({clearStatus:true});box=boot();E=box.EQ;
  check('AM06 fixture reset restores the same authored baseline audit instant',E.eq('eq-qc-demo-02').statusSince===baselineTime);
  check('AM06 quota test seed saved',update('eq-qc-demo-01','readyForOps').storedLocally);
  const storageBefore=persisted.get(E.manual.key),write=box.localStorage.setItem;
  box.localStorage.setItem=()=>{throw Error('QuotaExceededError');};
  const quota=update('eq-qc-demo-02','isolated'),quotaNext=update('eq-qc-demo-03','isolated');
  check('AM06 storage write failures reject both edits without status or history loss',quota.status===503&&quotaNext.status===503&&E.eq('eq-qc-demo-02').status==='readyForOps'&&E.eq('eq-qc-demo-03').status==='readyForOps'&&persisted.get(E.manual.key)===storageBefore&&!E.state.D.statusChanges.some(c=>['eq-qc-demo-02','eq-qc-demo-03'].includes(c.equipmentId)&&c.kind==='manualStatus'));
  const quotaReg=E.api.createEquipment({code:'QUOTA-REG',typeCode:'QC',status:'readyForOps'}),quotaRetire=E.api.retireEquipment('eq-qc-demo-14');
  check('ADM01 storage failure rolls back registration and retirement',quotaReg.status===503&&quotaRetire.status===503&&!E.state.D.equipment.some(e=>e.code==='QUOTA-REG')&&E.eq('eq-qc-demo-14').lifecycle==='active');
  const quotaReset=E.reset({clearStatus:true});
  check('AM06 failed explicit reset preserves stored and in-memory records',quotaReset.status===503&&E.eq('eq-qc-demo-01').status==='readyForOps'&&persisted.get(E.manual.key)===storageBefore);
  box.localStorage.setItem=write;
  persisted.set(E.manual.key,'{"version":1,"equipment":[],"changes":[{"equipmentId":"unknown"}]}');box=boot();E=box.EQ;
  check('AM06 corrupt local snapshot is rejected visibly and atomically',!!E.manual.warning&&E.state.D.equipment.length===67&&E.state.D.equipment.every(e=>E.manual.valid(e.status)));
} finally {
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({boundary:'Synthetic VM rules and browser-local persistence only; no production/server/SQL acceptance',checks},null,2));
  console.log(JSON.stringify({pass:checks.filter(c=>c.pass).length,total:checks.length,out}));
}
