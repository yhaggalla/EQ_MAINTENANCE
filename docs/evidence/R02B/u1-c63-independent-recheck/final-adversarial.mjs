import fs from 'node:fs';
import {launch} from '../../tools/p03/cdp.mjs';
const b=await launch({port:9506,gpu:'none'}),checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+JSON.stringify(detail))};
const command=(id,status='isolated',key=id)=>`EQ.api.setStatus('${id}',{status:'${status}',reason:'Independent persistence failure review',expectedCurrentStatusChangeId:EQ.eq('${id}').currentStatusChangeId,key:'final-${key}'})`;
try {
 const url='http://127.0.0.1:5312/index.html?role=admin#/eq/jobs/status';await b.goto(url);await b.eval('EQ.reset({clearStatus:true})');
 const initial=await b.eval(`({since:EQ.eq('eq-qc-demo-02').statusSince,event:EQ.state.D.statusChanges.find(x=>x.id===EQ.eq('eq-qc-demo-02').currentStatusChangeId)})`);
 await b.goto(url);check('Untouched initialization event time stable across actual reload',JSON.stringify(initial)===JSON.stringify(await b.eval(`({since:EQ.eq('eq-qc-demo-02').statusSince,event:EQ.state.D.statusChanges.find(x=>x.id===EQ.eq('eq-qc-demo-02').currentStatusChangeId)})`)));
 check('Seed persists', (await b.eval(command('eq-qc-demo-01','readyForOps','seed'))).storedLocally);
 await b.eval(`window.reviewBefore=JSON.stringify(EQ.state.D);window.reviewStored=localStorage.getItem(EQ.manual.key);window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}`);
 for(const [name,expr] of [['Status',command('eq-qc-demo-02')],['Registration',`EQ.api.createEquipment({code:'QUOTA-FAILED',typeCode:'QC',status:'readyForOps'})`],['Retirement',`EQ.api.retireEquipment('eq-qc-demo-14')`],['Reset',`EQ.reset({clearStatus:true})`]]) {
  const r=await b.eval(expr);check(name+' write failure rejects503 and rolls back all data',r.status===503&&await b.eval(`JSON.stringify(EQ.state.D)===window.reviewBefore&&localStorage.getItem(EQ.manual.key)===window.reviewStored`),r);
 }
 await b.eval(`Storage.prototype.setItem=window.originalSetItem`);const recovered=await b.eval(command('eq-qc-demo-02'));
 check('Retry after storage recovery commits status and audit once',recovered.ok&&recovered.storedLocally&&await b.eval(`EQ.state.D.statusChanges.filter(x=>x.equipmentId==='eq-qc-demo-02'&&x.kind==='manualStatus').length===1`),recovered);
 await b.eval(`window.originalGetItem=Storage.prototype.getItem;window.reviewBefore=JSON.stringify(EQ.state.D);Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')}`);
 const denied=await b.eval(command('eq-qc-demo-03'));check('Read failure rejects before mutation',denied.status===503&&await b.eval(`JSON.stringify(EQ.state.D)===window.reviewBefore`),denied);await b.eval(`Storage.prototype.getItem=window.originalGetItem`);
 await b.eval(`EQ.api.associateModel('eq-qc-demo-03','CICT-J526A-STS','Independent model remains in-memory');window.reviewModel={modelCode:EQ.eq('eq-qc-demo-03').modelCode,assoc:EQ.eq('eq-qc-demo-03').assoc,positions:EQ.positionsOf('eq-qc-demo-03').map(p=>p.id)};EQ.eq('eq-qc-demo-03').lastActivity='2099-01-01T00:00:00.000Z'`);
 await b.eval(command('eq-qc-demo-05'));
 check('Shared status refresh preserves unrelated local model/positions and newest activity',await b.eval(`JSON.stringify(window.reviewModel)===JSON.stringify({modelCode:EQ.eq('eq-qc-demo-03').modelCode,assoc:EQ.eq('eq-qc-demo-03').assoc,positions:EQ.positionsOf('eq-qc-demo-03').map(p=>p.id)})&&EQ.eq('eq-qc-demo-03').lastActivity==='2099-01-01T00:00:00.000Z'`));
 await b.eval(`Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});window.reviewStored=localStorage.getItem(EQ.manual.key)`);
 const noLockA=await b.eval(command('eq-qc-demo-07')),noLockB=await b.eval(command('eq-qc-demo-08'));
 check('No-Web-Locks fallback retains two session edits without touching shared data',noLockA.ok&&!noLockA.storedLocally&&noLockB.ok&&!noLockB.storedLocally&&await b.eval(`EQ.eq('eq-qc-demo-07').status==='isolated'&&EQ.eq('eq-qc-demo-08').status==='isolated'&&localStorage.getItem(EQ.manual.key)===window.reviewStored`));
 check('No browser errors',b.errors().length===0,b.errors());
} finally {fs.writeFileSync('tmp/u1-c63-independent-recheck/final-adversarial-checks.json',JSON.stringify({checks},null,2));console.log(JSON.stringify({pass:checks.filter(c=>c.pass).length,total:checks.length,checks},null,2));await b.close()}
