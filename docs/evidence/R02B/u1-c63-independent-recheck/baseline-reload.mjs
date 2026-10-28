import fs from 'node:fs';
import {launch} from '../../tools/p03/cdp.mjs';
const b=await launch({port:9505,gpu:'none'});const results=[];
try {
 const url='http://127.0.0.1:5312/index.html?role=admin#/eq/jobs/status';
 await b.goto(url);await b.eval('EQ.reset({clearStatus:true})');
 results.push({name:'first',v:await b.eval(`({since:EQ.eq('eq-qc-demo-02').statusSince,event:EQ.state.D.statusChanges.find(x=>x.id===EQ.eq('eq-qc-demo-02').currentStatusChangeId),snapshot:JSON.parse(localStorage.getItem(EQ.manual.key))})`)});
 await b.wait(1500);await b.goto(url);
 results.push({name:'reload-no-change',v:await b.eval(`({since:EQ.eq('eq-qc-demo-02').statusSince,event:EQ.state.D.statusChanges.find(x=>x.id===EQ.eq('eq-qc-demo-02').currentStatusChangeId),snapshot:JSON.parse(localStorage.getItem(EQ.manual.key))})`)});
} finally {fs.writeFileSync('tmp/u1-c63-independent-recheck/baseline-reload.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await b.close()}
