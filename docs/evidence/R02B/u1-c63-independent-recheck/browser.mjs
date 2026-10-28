// U1-C63 browser/UI checks. Synthetic persona simulation; no production/backend acceptance claim.
import fs from 'node:fs';
import { launch } from '../../tools/p03/cdp.mjs';
const base=process.argv[2]||'http://127.0.0.1:5312/index.html';
const out=process.argv[3]||'docs/evidence/U1/asset-management-c63';
fs.mkdirSync(out+'/screenshots',{recursive:true});
const b=await launch({port:9502,gpu:'swiftshader'}),checks=[];
const ev=x=>b.eval(x),check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
const go=async(route,role='eqTeam')=>{await b.goto(base+'?role='+role+'#'+route);await b.wait(350);};
const shot=async name=>{await ev('scrollTo(0,0)');await b.screenshot(out+'/screenshots/'+name+'.png',{fullPage:true});};
const layout=()=>ev(`({overflow:document.documentElement.scrollWidth-innerWidth,kpis:[...document.querySelectorAll('[data-kpi]')].map(e=>({key:e.dataset.kpi,clip:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1})),pageScroll:document.scrollingElement.scrollHeight-innerHeight})`);
const reconcile=()=>ev(`(()=>{const type=EQ.route.query.type,needle=EQ.fleetUI.q.toLowerCase();const active=EQ.state.D.equipment.filter(e=>e.lifecycle==='active'&&(!type||type==='all'||e.typeCode===type)&&(!needle||(e.code+' '+e.name+' '+(e.modelCode||'')).toLowerCase().includes(needle)));const counts={total:active.length,readyForOps:active.filter(e=>e.status==='readyForOps').length,isolated:active.filter(e=>e.status==='isolated').length};return {counts,actual:['total','readyForOps','isolated'].every(k=>Number(document.querySelector('[data-kpi='+k+'] .n')?.textContent)===counts[k]),types:['total','readyForOps','isolated'].every(k=>[...document.querySelectorAll('[data-kpi='+k+'] [data-eq-type]')].every(el=>Number(el.querySelector('b').textContent)===active.filter(e=>e.typeCode===el.dataset.eqType&&(k==='total'||e.status===k)).length)),share:document.querySelector('[data-kpi=share] .n')?.textContent,wantedShare:active.length?Math.round(counts.readyForOps/active.length*100)+' %':'—'}})()`);
try {
  await b.send('Network.enable');
  for(const [w,h,tv] of [[1920,1080,false],[1366,768,false],[820,1180,false],[375,812,false],[320,812,false],[1920,1080,true],[1366,768,true]]) {
    await b.viewport(w,h,w<600);await go('/eq/fleet'+(tv?'?tv=1&motion=off':''));
    const state=await reconcile(),l=await layout();
    check('AM10 '+w+(tv?' TV':'')+' four KPIs reconcile',state.actual&&state.types&&state.share===state.wantedShare&&l.kpis.length===4,state);
    check('AM11 '+w+(tv?' TV':'')+' unclipped layout',l.overflow<=1&&l.kpis.every(k=>!k.clip)&&(!tv||l.pageScroll<=1),l);
    check('AM02/AM03 '+w+' removed integration and card motion',await ev(`!EQ.cmms&&!EQ.state.D.cmms&&!document.querySelector('[data-blink],.blink,[data-fk=blink-pause],.cmms-fresh,[data-fk^=src-]')&&[...document.querySelectorAll('.eq-card')].every(e=>getComputedStyle(e).animationName==='none')&&!/CMMS|Unreported|Automatic status/.test(document.querySelector('main')?.textContent||document.body.textContent)`));
    await shot('fleet-'+w+(tv?'-tv':''));
  }
  await b.viewport(1366,768);await go('/eq/fleet');
  check('AM01 updated display/title',await ev(`document.title.includes('EQ & FAC Asset Management')&&document.body.textContent.includes('EQ & FAC Asset Management')`));
  await b.setValue('#fq','QC01');let stats=await reconcile();
  check('AM10 search scopes numerator and denominator',stats.actual&&stats.types&&stats.counts.total===1&&stats.counts.isolated===1&&stats.share==='0 %',stats);
  await b.setValue('#fq','does-not-match-any-equipment');stats=await reconcile();
  check('AM10 zero population shows dash',stats.actual&&stats.counts.total===0&&stats.share==='—',stats);
  await b.setValue('#fq','');await b.click('[data-fk=cc-isolated]');stats=await reconcile();
  check('AM10 status filter leaves the active KPI base intact',stats.counts.total===67&&stats.actual&&await ev(`[...document.querySelectorAll('.eq-card')].every(el=>EQ.eq(el.dataset.eq).status==='isolated')`));
  await ev(`(async()=>{EQ.state.role='admin';EQ.access.refreshSession('C63 retirement');await EQ.api.retireEquipment('eq-qc-demo-14');EQ.nav('/eq/fleet',{lifecycle:'all'});})()`);await b.wait(200);stats=await reconcile();
  check('AM10 Include retired leaves active denominator unchanged',stats.actual&&stats.counts.total===66&&await ev(`!!document.querySelector('[data-eq=eq-qc-demo-14].retired')`),stats);
  await ev(`(async()=>{await EQ.reset({clearStatus:true});EQ.nav('/eq/fleet',{layout:'table'});})()`);await b.wait(200);
  check('AM07 retained Fleet Table has no source/daily-work columns',await ev(`document.querySelector('table')&&!/CMMS|Source|Daily work/.test(document.querySelector('table').textContent)`));
  await shot('fleet-table');
  await go('/eq/jobs/daily?equipment=eq-qc-demo-01');
  check('AM07 obsolete Daily work link resolves safely',await ev(`location.hash.includes('/eq/jobs/special')&&!document.querySelector('[data-fk=jp-daily]')&&document.querySelectorAll('.eqjobs-page .subtabs a').length===3&&document.querySelector('[role=status]')?.textContent.includes('removed')`));
  await go('/admin/eq/cmms','admin');
  check('AM02 obsolete Admin link has no retained integration handler',await ev(`location.hash.includes('/admin/eq/equipment')&&!document.querySelector('[data-fk=an-eq-cmms]')&&!EQ.cmms`));
  await go('/eq/equipment/eq-qc-demo-01?panel=maintenance');await b.wait(700);
  check('AM08 saved Maintenance tab cannot reopen',await ev(`location.hash.includes('panel=spareParts')&&document.querySelector('[role=tab][aria-selected=true]').id==='tab-spareParts'&&![...document.querySelectorAll('[role=tab]')].some(e=>e.id==='tab-maintenance')`));
  check('AM08 ordered three-tab navigation',await ev(`[...document.querySelectorAll('[role=tab]')].map(e=>e.id).join()==='tab-spareParts,tab-special,tab-technical'`));
  await ev(`document.querySelector('#tab-spareParts').focus()`);await b.key('ArrowRight');
  check('AM08 keyboard Right follows visible order',await ev(`document.activeElement.id==='tab-special'&&document.querySelector('#tab-special').getAttribute('aria-selected')==='true'`));
  await b.key('End');check('AM08 keyboard End selects Technical',await ev(`document.activeElement.id==='tab-technical'&&document.querySelector('#tab-technical').getAttribute('aria-selected')==='true'`));
  await b.key('ArrowRight');check('AM08 keyboard wraps to first',await ev(`document.activeElement.id==='tab-spareParts'`));
  await b.click('#tab-technical');await ev(`EQ.eqv.select(EQ.eq('eq-qc-demo-01'),{part:'pp-q01-007'})`);await b.wait(700);
  check('AM08 selection defaults to Spare part status',await ev(`document.querySelector('#tab-spareParts').getAttribute('aria-selected')==='true'&&EQ.route.query.part==='pp-q01-007'`));
  const selections=[{}, {main:'mi-q01-01'}, {sub:'si-q01-011'}, {part:'pp-q01-007'}, {container:'machinery-house'}];
  for(const selection of selections) {
    for(const tab of ['spareParts','special','technical']) {
      await ev(`EQ.nav('/eq/equipment/eq-qc-demo-01',${JSON.stringify({...selection,panel:tab,view:'flat'})})`);await b.wait(650);
      const flat=await ev(`({text:document.querySelector('#tabpanel').textContent,echo:document.querySelector('#tabpanel [data-echo]')?.dataset.echo})`);
      await b.click('[data-fk=view-3d]');await b.wait(650);
      const three=await ev(`({text:document.querySelector('#tabpanel').textContent,echo:document.querySelector('#tabpanel [data-echo]')?.dataset.echo})`);
      check('AM09 Flat/3D parity '+JSON.stringify(selection)+' '+tab,flat.text===three.text&&flat.echo===three.echo,{echo:flat.echo});
    }
  }
  await go('/eq/equipment/eq-qc-demo-01?view=3d');await b.wait(1500);await shot('crane-3d-default');
  await b.viewport(375,812,true);await b.wait(350);await b.click('[data-fk=open-panel]');await b.wait(350);
  check('AM08 phone panel tabs meet touch size and no page overflow',await ev(`[...document.querySelectorAll('[role=tab]')].every(e=>e.getBoundingClientRect().height>=44)&&document.documentElement.scrollWidth<=innerWidth+1`));
  await shot('crane-phone-panel');
  await b.viewport(1366,768,false);await go('/eq/jobs/status');
  check('AM05 Jobs manual current status without source/expiry columns',await ev(`!!document.querySelector('.status-board')&&!/Source|Manual until|Causing|CMMS/.test(document.querySelector('.status-board').textContent)&&!!document.querySelector('[data-fk=correct-eq-qc-demo-01]')`));
  await b.click('[data-fk=correct-eq-qc-demo-01]');
  check('AM05 status form exactly two choices and no preselected value',await ev(`document.querySelectorAll('dialog input[name=sf-status]').length===2&&!document.querySelector('dialog input[name=sf-status]:checked')`));
  await b.click('#sf-status-readyForOps');await b.click('dialog button[type=submit]');await b.wait(200);
  check('AM05 UI manual save changes one value and records actor',await ev(`EQ.eq('eq-qc-demo-01').status==='readyForOps'&&EQ.eq('eq-qc-demo-01').statusBy==='u-eq-a'&&!document.querySelector('dialog[open]')`));
  const current=await ev(`EQ.eq('eq-qc-demo-01').currentStatusChangeId`);
  await go('/eq/jobs/status');
  check('AM06 manual value/history survive actual page reload',await ev(`EQ.eq('eq-qc-demo-01').status==='readyForOps'&&EQ.eq('eq-qc-demo-01').currentStatusChangeId===${JSON.stringify(current)}&&EQ.state.D.statusChanges.some(c=>c.id===${JSON.stringify(current)})`));
  await ev(`window.c63Today=EQ.todayColombo;EQ.todayColombo=()=>'2099-01-01';EQ.refresh(true);EQ.todayColombo=window.c63Today;`);
  check('AM06 refresh and simulated day boundary do not overwrite status',await ev(`EQ.eq('eq-qc-demo-01').currentStatusChangeId===${JSON.stringify(current)}`));
  await shot('eq-status-desktop');
  await go('/eq/jobs/status','management');
  check('AM05 Management read-only in UI and rule layer',await ev(`(async()=>!document.querySelector('[data-fk^=correct-]')&&(await EQ.api.setStatus('eq-qc-demo-01',{status:'isolated',reason:'denied',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-01').currentStatusChangeId})).status===403)()`));
  await go('/eq/jobs/status','facTeam');
  check('AM05 FAC Team cannot change EQ status',await ev(`(async()=>!document.querySelector('[data-fk^=correct-]')&&(await EQ.api.setStatus('eq-qc-demo-01',{status:'isolated',reason:'denied',expectedCurrentStatusChangeId:EQ.eq('eq-qc-demo-01').currentStatusChangeId})).status===403)()`));
  await go('/admin/eq/equipment','admin');await ev('EQ.dlg.newEquipment()');await b.wait(100);
  check('ADM01 registration no default operational value',await ev(`!document.querySelector('dialog input[name=ne-status]:checked')&&document.querySelectorAll('dialog input[name=ne-status]').length===2`));
  await b.setValue('#ne-code','C63-UI');await b.setValue('#ne-type','QC');await b.click('dialog button[type=submit]');
  check('ADM01 incomplete UI registration does not create equipment',await ev(`!EQ.state.D.equipment.some(e=>e.code==='C63-UI')&&!!document.querySelector('#ne-status-err')`));
  await b.click('#ne-status-isolated');await b.setValue('#ne-reason','Synthetic manual registration from UI');await b.click('dialog button[type=submit]');
  check('ADM01 initial UI selection and audit commit together',await ev(`(()=>{const e=EQ.state.D.equipment.find(e=>e.code==='C63-UI');return e?.status==='isolated'&&EQ.state.D.statusChanges.some(c=>c.id===e.currentStatusChangeId&&c.by==='u-admin')&&!document.querySelector('dialog[open]')})()`));
  for(const [route,role] of [['/eq/jobs/special','eqTeam'],['/eq/jobs/spare-parts','eqTeam'],['/fac/dashboard','management'],['/fac/jobs','facTeam']]) {
    await go(route,role);check('Retained route loads '+route,await ev(`!!document.querySelector('main')&&!document.querySelector('.notice.error')&&document.querySelector('main').textContent.length>100`));await shot(route.replaceAll('/','-').slice(1));
  }
  await b.viewport(1920,1080);await go('/fac/dashboard?tv=1','management');await shot('fac-tv');
  await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await go('/fac/dashboard','management');
  check('AM03 retained FAC reduced-motion screen renders',await ev(`document.body.textContent.includes('Electrical')&&matchMedia('(prefers-reduced-motion: reduce)').matches`));await shot('fac-reduced-motion');
  const requests=b.events.filter(e=>e.method==='Network.requestWillBeSent').map(e=>e.params.request.url);
  check('AM02 zero external CMMS/runtime traffic',requests.every(url=>/^(http:\/\/127\.0\.0\.1:5312\/|data:|blob:|about:)/.test(url))&&!requests.some(url=>/cmms\.js|zmms\.lk/.test(url)),requests.filter(url=>!/^(http:\/\/127\.0\.0\.1:5312\/|data:|blob:|about:)/.test(url)));
  check('No browser console errors',b.errors().length===0,b.errors());
} finally {
  fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({boundary:'Local synthetic prototype browser checks; persona simulation, browser-local manual status, software WebGL',browser:b.browser,checks},null,2));
  console.log(JSON.stringify({pass:checks.filter(c=>c.pass).length,total:checks.length,out}));await b.close();
}
