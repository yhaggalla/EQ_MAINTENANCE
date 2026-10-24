// U1-T01 BUILD only: local synthetic browser/network/visual checks. No real authentication.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/temp-management-walkthrough';
const referenceRoot = path.resolve(out, 'reference');
const referencePort = 5392;
const results = [], network = [], consoleCounts = [];
let b;
const check = (id, name, pass, detail) => { results.push({ id, name, pass: !!pass, ...(detail === undefined ? {} : { detail }) }); console.log((pass ? 'PASS ' : 'FAIL ') + id + ' ' + name); };
const ev = expression => b.eval(expression);
const traffic = label => {
  for (const event of b.events) {
    if (event.method === 'Network.requestWillBeSent') {
      const request = event.params.request, url = new URL(request.url);
      network.push({ label, method: request.method, origin: url.origin, path: url.pathname, type: event.params.type });
    }
    if (event.method === 'Network.responseReceived' && event.params.response.status >= 400) network.push({ label, failureStatus: event.params.response.status, path: new URL(event.params.response.url).pathname });
  }
  consoleCounts.push({ label, errors: b.errors() });
  b.clearEvents();
};
const metrics = () => ev(`(()=>{const pick=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,color:c.color,background:c.backgroundColor,radius:c.borderRadius,font:c.fontFamily}};return {frame:pick('.login-frame'),panel:pick('.login-panel'),input:pick('#userName'),password:pick('#password'),submit:pick('.login-submit')}})()`);
const cssSignature = () => ev(`(()=>{const e=document.querySelector('.app-tile'),c=getComputedStyle(e);return {radius:c.borderRadius,color:c.color,background:c.backgroundColor,padding:c.padding,columns:getComputedStyle(document.querySelector('.tile-grid')).gridTemplateColumns}})()`);
const referenceServer = http.createServer((req,res) => {
  const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  const file = path.resolve(referenceRoot, name);
  if (!file.startsWith(referenceRoot + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,data) => { if(error) return res.writeHead(404).end(); res.writeHead(200,{'Content-Type':{'.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'}[path.extname(file)] || 'application/octet-stream'});res.end(data); });
});
await new Promise(resolve=>referenceServer.listen(referencePort,'127.0.0.1',resolve));
try {
  b = await launch({port:9407,gpu:'swiftshader'});
  await b.send('Network.enable');
  await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__storageWrites=[];for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__storageWrites.push(method);return original.apply(this,args)}}`});
  for (const [w,h] of [[1920,1080],[1366,768],[375,812]]) {
    await b.viewport(w,h,w===375);
    await b.goto('http://127.0.0.1:'+referencePort+'/login.html');
    const reference = await metrics(); await b.screenshot(out+'/reference-login-'+w+'.png'); traffic('reference-login-'+w);
    await b.goto(base); const actual=await metrics();
    check('TD01',w+'px source login geometry/styles match',JSON.stringify(reference)===JSON.stringify(actual),{reference,actual});
    check('TD01',w+'px usable fields, branding and no page overflow',await ev(`document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#userName').getBoundingClientRect().height>=44&&document.querySelector('#password').getBoundingClientRect().height>=44&&[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)&&document.querySelector('.login-submit').getBoundingClientRect().right<=innerWidth`));
    await b.screenshot(out+'/login-'+w+'.png');
    check('TD01',w+'px fresh root has login and no EQ app/session',await ev(`!!document.querySelector('form.login-form')&&!window.EQ&&document.querySelectorAll('.app-tile').length===0&&Object.keys(localStorage).length===0&&Object.keys(sessionStorage).length===0&&document.cookie===''`));
    await b.click('.login-submit');
    check('TD03',w+'px exactly four correctly branded cards',await ev(`document.querySelectorAll('.app-tile').length===4&&document.querySelectorAll('[data-placeholder]').length===3&&[...document.querySelectorAll('.app-tile strong')].map(e=>e.textContent).join('|')==='Urgent Materials Monitor|PayPrep Assistant|Safety Inspection and Rectification Tracker|EQ & FAC Maintenance'`));
    check('TD03',w+'px launcher fits horizontally',await ev('document.documentElement.scrollWidth<=innerWidth+1'));
    const actualCard = await cssSignature(); await b.screenshot(out+'/launcher-'+w+'.png',{fullPage:w===375}); traffic('temporary-screens-'+w);
    await b.goto('http://127.0.0.1:'+referencePort+'/launcher.html');const referenceCard=await cssSignature();await b.screenshot(out+'/reference-launcher-'+w+'.png',{fullPage:w===375});traffic('reference-launcher-'+w);
    check('TD03',w+'px source card styles match',actualCard.radius===referenceCard.radius&&actualCard.color===referenceCard.color&&actualCard.background===referenceCard.background&&actualCard.padding===referenceCard.padding,{reference:referenceCard,actual:actualCard});
  }
  await b.viewport(1366,768);
  for(const [name,userLength,passwordLength] of [['both blank',0,0],['username only',1,0],['password only',0,1],['arbitrary outside real length limits',301,301]]) {
    await b.goto(base);traffic('case-start-'+name);
    await b.setValue('#userName','x'.repeat(userLength));await b.setValue('#password','!'.repeat(passwordLength));
    check('TD02',name+' has no browser validation constraints',await ev(`document.querySelector('form').noValidate&&document.querySelector('form').checkValidity()&&[...document.querySelectorAll('input')].every(e=>!e.required&&!e.hasAttribute('maxlength')&&!e.hasAttribute('minlength')&&!e.hasAttribute('pattern')&&!e.hasAttribute('name'))`));
    await b.click('.login-submit');
    check('TD02',name+' proceeds and discards all fields',await ev(`!!document.querySelector('.tile-grid')&&!document.querySelector('input')&&window.__storageWrites.length===0&&Object.keys(localStorage).length===0&&Object.keys(sessionStorage).length===0&&document.cookie===''`));
    const calls=b.events.filter(e=>e.method==='Network.requestWillBeSent');
    check('TD02',name+' sends no request or console output',calls.length===0&&b.events.filter(e=>e.method==='Runtime.consoleAPICalled').length===0);
    traffic('submit-'+name);
  }
  await b.goto(base);await b.click('.login-submit');traffic('placeholder-start');
  const before=await ev('location.href');
  for(const id of ['umms','payprep','safety']) {
    await b.click('[data-placeholder="'+id+'"]');
    check('TD04',id+' click is inert with accessible explanation',await ev(`location.href===${JSON.stringify(before)}&&document.querySelector('#placeholder-status').textContent.includes('not connected')`)&&b.events.filter(e=>e.method==='Network.requestWillBeSent').length===0);
    traffic('placeholder-'+id);
  }
  check('TD04','Portal administration, accounts, roles, password and provisioning absent',await ev(`!document.querySelector('a[href*="admin"],a[href*="password"],.admin-callout,.user-menu-panel,details.user-menu')&&!document.querySelector('form,input,select')&&document.querySelectorAll('.topbar nav .nav-link').length===1`));
  await b.click('[data-enter-eq]');await b.wait(900);
  check('TD05','fresh-default EQ Fleet and unchanged EQ Team persona',await ev(`location.pathname==='/index.html'&&EQ.route.path==='/eq/fleet'&&EQ.state.role==='eqTeam'&&document.querySelectorAll('.eq-card').length===67`));
  check('TD05','temporary CSS/scripts/state do not enter app document',await ev(`!document.querySelector('[href*="temp-management"],[src*="temp-management"]')&&!document.querySelector('#walkthrough')&&EQ.state.D.fac.jobs.length===114`));
  await b.screenshot(out+'/entered-eq-fleet-1366.png');
  await ev(`EQ.nav('/eq/jobs/special')`);await b.wait(400);
  check('TD05','EQ Jobs retains writer actions',await ev(`!!document.querySelector('[data-fk="add-job"]')&&EQ.access.has('eq.work')`));
  await b.click('[data-fk="add-job"]');check('TD05','EQ create-job form opens via existing control',await ev(`!!document.querySelector('dialog[open] #jf-title')`));await b.key('Escape');
  await ev(`EQ.nav('/eq/equipment/eq-qc-demo-01')`);
  for(let i=0;i<90;i++){if(await ev('!!window.EQ?.qc?.session?.ready'))break;await b.wait(150);}
  check('TD05','equipment loads shared checked model in default Flat',await ev(`!!EQ.qc?.session?.ready&&EQ.qc.session.viewer.camera.isOrthographicCamera&&document.querySelectorAll('canvas').length===1&&EQ.qc.session.viewer.checksumVerified`));
  await b.screenshot(out+'/equipment-flat-1366.png');
  await b.click('[data-fk="view-3d"]');await b.wait(600);
  check('TD05','3D switch works with same equipment identity',await ev(`EQ.qc.session.viewer.camera.isPerspectiveCamera&&EQ.route.segs[2]==='eq-qc-demo-01'`));await b.screenshot(out+'/equipment-3d-1366.png');
  await ev(`EQ.nav('/fac/dashboard')`);await b.wait(600);
  check('TD05','FAC Dashboard retains 114-job register and TV control',await ev(`EQ.state.D.fac.jobs.length===114&&!!document.querySelector('[data-fk="dash-tv"]')&&!!document.querySelector('.kpis')`));
  await b.click('[data-fk="dash-tv"]');await b.wait(500);
  check('TD05','FAC TV opens and Escape returns',await ev(`document.body.classList.contains('tv')&&EQ.route.query.tv==='1'`));await b.screenshot(out+'/fac-tv-1366.png');await b.key('Escape');
  check('TD05','FAC TV exits',await ev(`!document.body.classList.contains('tv')&&!EQ.route.query.tv`));
  await b.click('[data-fk="pc-toggle"]');
  const personaSelector=await ev(`!!document.querySelector('[data-fk="role-facTeam"]')`);
  check('TD05','existing persona selector remains available',!!personaSelector);
  if(personaSelector)await b.click('[data-fk="role-facTeam"]');
  await ev(`EQ.nav('/fac/jobs')`);await b.wait(350);
  check('TD05','FAC Jobs and team write permission remain',await ev(`EQ.state.role==='facTeam'&&EQ.access.has('fac.work')&&!EQ.access.has('eq.work')&&document.querySelector('main').textContent.includes('Update progress')`));
  await b.screenshot(out+'/fac-jobs-1366.png');
  traffic('entered-EQ-FAC');
  await b.goto(base+'#/eq/jobs/special');
  check('TD05','existing explicit root EQ bookmark preserves direct entry',await ev(`location.pathname==='/index.html'&&EQ.route.path==='/eq/jobs/special'`));traffic('existing-EQ-bookmark');
  await b.goto(base+'?role=management#/fac/dashboard');
  check('TD05','existing FAC bookmark preserves query persona and route',await ev(`location.pathname==='/index.html'&&EQ.state.role==='management'&&EQ.route.path==='/fac/dashboard'`));traffic('existing-FAC-bookmark');
  // A fresh context is required: the unchanged app remembers its last permitted tab.
  await b.close(); b = await launch({port:9407,gpu:'swiftshader'});
  await b.send('Network.enable');
  await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__storageWrites=[];for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__storageWrites.push(method);return original.apply(this,args)}}`});
  await b.viewport(1366,768);
  await b.goto(base);
  check('TD06','repeat fresh root always returns to blank login',await ev(`!!document.querySelector('.login-form')&&document.querySelector('#userName').value===''&&document.querySelector('#password').value===''&&!window.EQ`));
  check('TD06','username initially focused',await ev(`document.activeElement.id==='userName'`));
  await b.key('Tab');check('TD06','Tab reaches password with visible focus',await ev(`document.activeElement.id==='password'&&getComputedStyle(document.activeElement).boxShadow!=='none'`));
  await b.key('Tab');check('TD06','Tab reaches labelled password reveal',await ev(`document.activeElement.classList.contains('login-reveal')&&document.activeElement.getAttribute('aria-label')==='Show password'`));
  await b.key('Tab');check('TD06','Tab reaches Sign in',await ev(`document.activeElement.classList.contains('login-submit')`));await b.key('Enter');
  check('TD06','keyboard Sign in moves focus into launcher',await ev(`!!document.querySelector('.tile-grid')&&document.activeElement.id==='main-content'`));
  await b.key('Tab');check('TD06','launcher keyboard starts with UMMS placeholder',await ev(`document.activeElement.dataset.placeholder==='umms'`));await b.key('Enter');
  check('TD06','keyboard placeholder remains on launcher',await ev(`!!document.querySelector('.tile-grid')`));
  for(let i=0;i<3;i++)await b.key('Tab');
  check('TD06','Tab reaches EQ/FAC card with visible focus',await ev(`document.activeElement.hasAttribute('data-enter-eq')&&getComputedStyle(document.activeElement).outlineStyle!=='none'`));await b.key('Enter');await b.wait(750);
  check('TD06','keyboard path opens fresh EQ Fleet',await ev(`EQ.route.path==='/eq/fleet'&&EQ.state.role==='eqTeam'`));traffic('repeat-keyboard-path');
  await b.goto(base);await b.click('.login-theme-toggle');check('TD06','theme toggle local only',await ev(`document.documentElement.dataset.theme==='dark'&&window.__storageWrites.length===0`));await b.screenshot(out+'/login-dark-1366.png');
  await b.click('.login-reveal');check('TD06','password reveal does not read/store/send values',await ev(`document.querySelector('#password').type==='text'&&document.querySelector('.login-reveal').getAttribute('aria-pressed')==='true'&&window.__storageWrites.length===0`));traffic('local-theme-reveal');
  check('TD06','all page traffic is local GET asset/document traffic',network.every(r=>!r.failureStatus&&r.method==='GET'&&['http://127.0.0.1:5312','http://127.0.0.1:'+referencePort,'null'].includes(r.origin)&&!/^\/(auth|api|umms|payprep|safety)(\/|$)/.test(r.path)),network.filter(r=>r.failureStatus||r.method!=='GET'||r.origin!=='null'&&!r.origin.startsWith('http://127.0.0.1:')));
  check('TD06','no browser console/runtime errors',consoleCounts.every(r=>r.errors.length===0),consoleCounts.filter(r=>r.errors.length));
  const portalStatus=execFileSync('git',['-C','F:/CODEX/CICT-ENG_MAIN_PAGE','status','--short'],{encoding:'utf8'}).trim();
  check('TD06','Portal source still clean at reference commit',!portalStatus&&execFileSync('git',['-C','F:/CODEX/CICT-ENG_MAIN_PAGE','rev-parse','HEAD'],{encoding:'utf8'}).trim()==='47f7bd9d8296fda56114d8239e10ae9ad7850460');
} catch(error) { check('HARNESS','completed browser checks',false,error.stack); }
finally {
  if(b)await b.close();await new Promise(resolve=>referenceServer.close(resolve));
  const report={phase:'U1-T01 BUILD',dateUtc:new Date().toISOString(),method:'Fresh throwaway headless Chrome profile, CDP, software WebGL; reference exact source JSX SSR with safe fixtures and copied original CSS/assets.',results,total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,removal:{TD07:'NOT RUN - future REMOVE task',TD08:'NOT RUN - future REMOVE task'}};
  fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(out+'/network.json',JSON.stringify({note:'Request method/origin/path/type only. No headers, cookies, request bodies, credentials or tokens recorded.',requests:network,console:consoleCounts},null,2)+'\n');
  console.log('TOTAL '+report.passed+'/'+report.total+' passed');if(report.failed)process.exitCode=1;
}
