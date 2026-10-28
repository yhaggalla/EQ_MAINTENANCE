import fs from 'node:fs';
import {launch} from '../../tools/p03/cdp.mjs';
const out='tmp/u1-c63-independent-recheck/adversarial.json';
const b=await launch({port:9504,gpu:'none'});const results=[];
try {
 await b.goto('http://127.0.0.1:5312/index.html?role=admin#/eq/jobs/status');
 await b.eval('EQ.reset({clearStatus:true})');
 results.push({name:'seed',result:await b.eval(`EQ.api.setStatus('eq-qc-demo-01',{status:'readyForOps',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-01').currentStatusChangeId,key:'seed'})`)});
 await b.eval(`window.originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}`);
 results.push({name:'quota-first',result:await b.eval(`(async()=>{const r=await EQ.api.setStatus('eq-qc-demo-02',{status:'isolated',reason:'Quota first edit',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-02').currentStatusChangeId,key:'quota1'});return {r,status:EQ.eq('eq-qc-demo-02').status,warning:EQ.manual.warning}})()`)});
 results.push({name:'quota-next',result:await b.eval(`(async()=>{const r=await EQ.api.setStatus('eq-qc-demo-03',{status:'isolated',reason:'Quota second edit',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-03').currentStatusChangeId,key:'quota2'});return {r,qc02:EQ.eq('eq-qc-demo-02').status,qc03:EQ.eq('eq-qc-demo-03').status,history:EQ.state.D.statusChanges.filter(e=>e.equipmentId==='eq-qc-demo-02').map(e=>({id:e.id,reason:e.reason})),warning:EQ.manual.warning}})()`)});
 await b.eval(`Storage.prototype.setItem=window.originalSetItem;EQ.reset({clearStatus:true})`);
 await b.eval(`window.lockReady=false;window.holdLock=navigator.locks.request(EQ.manual.key,()=>new Promise(resolve=>{window.releaseLock=resolve;window.lockReady=true}));true`);
 for(let i=0;i<20&&!await b.eval('window.lockReady');i++)await b.wait(50);
 await b.eval(`window.queuedStatus=EQ.api.setStatus('eq-qc-demo-02',{status:'isolated',reason:'Queued actor',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-02').currentStatusChangeId,key:'queued-role'});EQ.state.role='management';EQ.access.refreshSession('review');window.releaseLock();true`);
 results.push({name:'role-change-while-waiting',result:await b.eval(`(async()=>({result:await window.queuedStatus,status:EQ.eq('eq-qc-demo-02').status}))()`)});
 results.push({name:'errors',result:b.errors()});
} finally {fs.writeFileSync(out,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await b.close()}
