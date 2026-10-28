import fs from 'node:fs';
import {launch} from '../../tools/p03/cdp.mjs';
const b=await launch({port:9507,gpu:'none'}),checks=[];const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+JSON.stringify(detail))};
try {
 await b.viewport(1920,1080);await b.goto('http://127.0.0.1:5312/index.html?role=management#/fac/dashboard?tv=1');
 const first=await b.eval('EQ.dashState()');await b.wait(1100);const moved=await b.eval('EQ.dashState()');
 check('FAC TV lists/ticker actually move',first.mode==='scroll'&&Object.keys(first.lanes).some(k=>moved.lanes[k].offset!==first.lanes[k].offset)&&moved.ticker.offset!==first.ticker.offset,{first,moved});
 await b.click('[data-fk=dash-pause]');const stopped=await b.eval('EQ.dashState()');await b.wait(1100);const pause=await b.eval('EQ.dashState()');
 check('FAC Pause stops all moving lanes/ticker',pause.paused&&Object.keys(stopped.lanes).every(k=>pause.lanes[k].offset===stopped.lanes[k].offset)&&pause.ticker.offset===stopped.ticker.offset);
 await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await b.goto('http://127.0.0.1:5312/index.html?role=management#/fac/dashboard');
 const reduced=await b.eval('EQ.dashState()');await b.wait(1100);const reducedNext=await b.eval('EQ.dashState()');
 check('FAC reduced-motion uses stationary paged lanes/ticker',reduced.mode==='flip'&&reduced.reduced&&!reduced.ticker.moving&&Object.keys(reduced.lanes).every(k=>reducedNext.lanes[k].offset===reduced.lanes[k].offset));
 await b.viewport(375,812,true);await b.wait(500);const phone=await b.eval('EQ.dashState()');await b.wait(1100);const phoneNext=await b.eval('EQ.dashState()');
 check('FAC phone uses combined list without auto-scroll',phone.mode==='combined'&&phone.phone&&Object.keys(phone.lanes).every(k=>phoneNext.lanes[k].offset===phone.lanes[k].offset));
 check('No errors',b.errors().length===0,b.errors());
} finally {fs.writeFileSync('tmp/u1-c63-independent-recheck/fac-motion-checks.json',JSON.stringify({checks},null,2));console.log(JSON.stringify({pass:checks.filter(x=>x.pass).length,total:checks.length}));await b.close()}
