// Independent browser pages share one origin/storage. Reproduces R02B-C63-F1; synthetic demo only.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p03/cdp.mjs';
const base=process.argv[2]||'http://127.0.0.1:5312/index.html';
const out=process.argv[3]||'docs/evidence/U1/asset-management-c63/cross-tab-checks.json';
const b=await launch({port:9492,gpu:'none'}),checks=[],sockets=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
const url=base+'?role=admin#/eq/jobs/status';
async function page() {
  const {targetId}=await b.send('Target.createTarget',{url});
  const targets=await (await fetch('http://127.0.0.1:9492/json/list')).json();
  const ws=new WebSocket(targets.find(t=>t.id===targetId).webSocketDebuggerUrl);sockets.push(ws);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  const pending=new Map();let id=0;
  ws.onmessage=({data})=>{const r=JSON.parse(data),p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.reject(Error(r.error.message)):p.resolve(r.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evalJS=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  for(let i=0;i<80;i++){if(await evalJS(`!!window.EQ?.state?.D`))return {eval:evalJS,send};await b.wait(100);}
  throw Error('New tab did not initialize');
}
const command=(p,id,status='isolated',key=id)=>p.eval(`EQ.api.setStatus(${JSON.stringify(id)},{status:${JSON.stringify(status)},reason:'Independent actual-tab isolation',expectedCurrentStatusChangeId:window.tabExpected[${JSON.stringify(id)}],key:${JSON.stringify('actual-tab-'+key)}})`);
const capture=p=>p.eval(`window.tabExpected=Object.fromEntries(EQ.state.D.equipment.map(e=>[e.id,e.currentStatusChangeId]));true`);
const snapshot=p=>p.eval(`JSON.parse(localStorage.getItem(EQ.manual.key))`);
try {
  await b.goto(url);await b.eval(`EQ.reset({clearStatus:true})`);
  const a=await page(),c=await page();await Promise.all([capture(a),capture(c)]);
  check('Actual browser supports a cross-tab exclusive lock',await a.eval(`!!navigator.locks?.request`));
  const different=await Promise.all([command(a,'eq-qc-demo-02'),command(c,'eq-qc-demo-03')]);
  check('Two simultaneously writing tabs both save different equipment',different.every(r=>r.ok&&r.storedLocally),different);
  let saved=await snapshot(a);
  check('Reload source retains both independent status values and events',different.every(r=>saved.equipment.find(e=>e.id===r.equipmentId)?.status==='isolated'&&saved.changes.some(e=>e.id===r.change.id)));
  await Promise.all([capture(a),capture(c)]);
  const same=await Promise.all([command(a,'eq-qc-demo-05','isolated','same-A'),command(c,'eq-qc-demo-05','isolated','same-B')]);
  check('Same-equipment simultaneous tabs yield one success and one conflict',same.filter(r=>r.ok).length===1&&same.filter(r=>r.status===409&&r.code==='status_changed').length===1,same);
  saved=await snapshot(a);
  check('Same-equipment conflict retains exactly one new manual event',saved.changes.filter(e=>e.equipmentId==='eq-qc-demo-05'&&e.kind==='manualStatus').length===1);
  const regs=await Promise.all([a.eval(`EQ.api.createEquipment({code:'TAB-A',typeCode:'QC',status:'readyForOps'})`),c.eval(`EQ.api.createEquipment({code:'TAB-B',typeCode:'QC',status:'readyForOps'})`)]);
  check('Concurrent registrations have distinct stable identities',regs.every(r=>r.ok)&&regs[0].eq.id!==regs[1].eq.id,regs.map(r=>({ok:r.ok,id:r.eq?.id})));
  const duplicates=await Promise.all([a.eval(`EQ.api.createEquipment({code:'TAB-DUP',typeCode:'QC',status:'readyForOps'})`),c.eval(`EQ.api.createEquipment({code:'TAB-DUP',typeCode:'QC',status:'readyForOps'})`)]);
  check('Cross-tab duplicate registration yields one success and one validation failure',duplicates.filter(r=>r.ok).length===1&&duplicates.filter(r=>r.status===422).length===1);
  await Promise.all([capture(a),capture(c)]);
  const retired=await Promise.all([a.eval(`EQ.api.retireEquipment('eq-qc-demo-14')`),command(c,'eq-qc-demo-07')]);
  saved=await snapshot(a);
  check('Concurrent retirement and another status update both survive',retired.every(r=>r.ok)&&saved.equipment.find(e=>e.id==='eq-qc-demo-14')?.lifecycle==='retired'&&saved.equipment.find(e=>e.id==='eq-qc-demo-07')?.status==='isolated');
  const third=await page();
  check('Fresh page restores all merged edits, history and registrations',await third.eval(`EQ.eq('eq-qc-demo-02').status==='isolated'&&EQ.eq('eq-qc-demo-03').status==='isolated'&&EQ.eq('eq-qc-demo-14').lifecycle==='retired'&&EQ.state.D.equipment.some(e=>e.code==='TAB-A')&&EQ.state.D.equipment.some(e=>e.code==='TAB-B')&&!EQ.manual.warning`));
  await capture(c);await a.eval(`EQ.reset({clearStatus:true})`);
  const resetBefore=await a.eval(`localStorage.getItem(EQ.manual.key)`),afterReset=await command(c,'eq-qc-demo-08');
  check('Stale tab after explicit reset cannot resurrect deleted data',afterReset.status===409&&afterReset.code==='local_status_changed'&&await a.eval(`localStorage.getItem(EQ.manual.key)===${JSON.stringify(resetBefore)}`),afterReset);
  check('Reset reload uses only the deliberately authored 67-unit baseline',await (await page()).eval(`EQ.state.D.equipment.length===67&&EQ.state.D.equipment.every(e=>EQ.manual.valid(e.status))`));
  const untouched=await a.eval(`({id:EQ.eq('eq-qc-demo-02').currentStatusChangeId,since:EQ.eq('eq-qc-demo-02').statusSince})`);
  await b.wait(1100);
  const stableBaseline=await (await page()).eval(`({id:EQ.eq('eq-qc-demo-02').currentStatusChangeId,since:EQ.eq('eq-qc-demo-02').statusSince})`);
  check('Untouched baseline reload never rewrites its event timestamp or duration',JSON.stringify(untouched)===JSON.stringify(stableBaseline),{untouched,stableBaseline});
  const quotaPage=await page();
  await quotaPage.eval(`EQ.api.setStatus('eq-qc-demo-01',{status:'readyForOps',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-01').currentStatusChangeId,key:'quota-seed'})`);
  const quotaBefore=await quotaPage.eval(`localStorage.getItem(EQ.manual.key)`);
  await quotaPage.eval(`window.originalStorageWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError')}`);
  const failures=[];
  for(const id of ['eq-qc-demo-02','eq-qc-demo-03'])failures.push(await quotaPage.eval(`EQ.api.setStatus(${JSON.stringify(id)},{status:'isolated',reason:'Quota rejection probe',expectedCurrentStatusChangeId:EQ.eq(${JSON.stringify(id)}).currentStatusChangeId})`));
  check('Actual quota failure refuses edits and preserves prior statuses/history',failures.every(r=>r.status===503)&&await quotaPage.eval(`EQ.eq('eq-qc-demo-02').status==='readyForOps'&&EQ.eq('eq-qc-demo-03').status==='readyForOps'&&!EQ.state.D.statusChanges.some(c=>['eq-qc-demo-02','eq-qc-demo-03'].includes(c.equipmentId)&&c.kind==='manualStatus')&&localStorage.getItem(EQ.manual.key)===${JSON.stringify(quotaBefore)}`),failures);
  const deniedReset=await quotaPage.eval(`EQ.reset({clearStatus:true})`);
  check('Actual quota failure refuses reset without deleting records',deniedReset.status===503&&await quotaPage.eval(`EQ.eq('eq-qc-demo-01').status==='readyForOps'&&localStorage.getItem(EQ.manual.key)===${JSON.stringify(quotaBefore)}`));
  await quotaPage.eval(`Storage.prototype.setItem=window.originalStorageWrite`);
  const dialogPage=await page();
  await dialogPage.eval(`EQ.dlg.status(EQ.eq('eq-qc-demo-02'));document.querySelector('#sf-status-isolated').click();const reason=document.querySelector('#sf-reason');reason.value='Quota dialog input';reason.dispatchEvent(new Event('input',{bubbles:true}));window.originalStorageWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError')};document.querySelector('dialog button[type=submit]').click();true`);
  for(let i=0;i<30;i++){if(await dialogPage.eval(`!!document.querySelector('#sf-status-err')`))break;await b.wait(50);}
  check('Failed-save dialog shows live unchanged current status and preserves typed input',await dialogPage.eval(`EQ.eq('eq-qc-demo-02').status==='readyForOps'&&document.querySelector('dialog .dlg-body > p').textContent.includes('Ready for OPS')&&!document.querySelector('dialog .dlg-body > p').textContent.includes('Isolated')&&document.querySelector('#sf-reason').value==='Quota dialog input'&&document.querySelector('#sf-status-isolated').checked&&document.querySelector('#sf-status-err').textContent.includes('Nothing was changed')`));
  await dialogPage.eval(`Storage.prototype.setItem=window.originalStorageWrite;document.querySelector('dialog button[type=submit]').click()`);
  for(let i=0;i<30;i++){if(await dialogPage.eval(`!document.querySelector('dialog[open]')`))break;await b.wait(50);}
  check('Retrying unchanged form after storage recovery records exactly one successful event',await dialogPage.eval(`!document.querySelector('dialog[open]')&&EQ.eq('eq-qc-demo-02').status==='isolated'&&EQ.state.D.statusChanges.filter(c=>c.equipmentId==='eq-qc-demo-02'&&c.kind==='manualStatus').length===1`));
  const unsupported=await page();
  await unsupported.eval(`Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});window.tabExpected=Object.fromEntries(EQ.state.D.equipment.map(e=>[e.id,e.currentStatusChangeId]));`);
  const noLockBefore=await a.eval(`localStorage.getItem(EQ.manual.key)`),withoutLock=await command(unsupported,'eq-qc-demo-09');
  check('Browser without Web Locks keeps edit session-only and never overwrites shared storage',withoutLock.ok&&!withoutLock.storedLocally&&await a.eval(`localStorage.getItem(EQ.manual.key)===${JSON.stringify(noLockBefore)}`)&&await unsupported.eval(`EQ.manual.warning.includes('current session only')`));
  await a.eval(`localStorage.setItem(EQ.manual.key,'{invalid')`);
  const invalid=await a.eval(`EQ.api.setStatus('eq-qc-demo-08',{status:'isolated',reason:'test',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-08').currentStatusChangeId})`);
  check('Invalid shared storage refuses mutation until explicit reset',invalid.status===409&&await a.eval(`localStorage.getItem(EQ.manual.key)==='{invalid'`),invalid);
  await a.eval(`EQ.reset({clearStatus:true})`);
  check('Explicit reset recovers invalid shared storage safely',await (await page()).eval(`!EQ.manual.warning&&EQ.state.D.equipment.length===67`));
  check('No top-level browser errors during concurrency probes',b.errors().length===0,b.errors());
} finally {
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify({boundary:'Actual independent browser tabs, shared localStorage/Web Locks; synthetic prototype only',checks},null,2));
  for(const ws of sockets)ws.close();await b.close();
  console.log(JSON.stringify({pass:checks.filter(c=>c.pass).length,total:checks.length,out}));
}
