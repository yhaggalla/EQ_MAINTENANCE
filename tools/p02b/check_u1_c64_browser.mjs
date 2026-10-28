// C64 Fleet presentation repair: current shared register, local synthetic personas, no backend acceptance.
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/fleet-isolated-c64';
fs.mkdirSync(out + '/screenshots', { recursive: true });
const b = await launch({ port: 9456 }), checks = [];
const ev = x => b.eval(x);
const check = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail }); if (!pass) throw Error(name + ': ' + JSON.stringify(detail)); };
const nav = async q => { await ev(`EQ.nav('/eq/fleet',${JSON.stringify(q || {})})`); await b.wait(180); };
const shot = async name => { await ev('scrollTo(0,0)'); await b.screenshot(out + '/screenshots/' + name + '.png', { fullPage: true }); };
const cards = () => ev(`(()=>{const all=EQ.state.D.equipment;return [...document.querySelectorAll('.eq-card')].map(c=>{const e=all.find(e=>e.id===c.dataset.eq),s=getComputedStyle(c),a=c.getAnimations()[0],r=c.getBoundingClientRect();return {id:e.id,status:e.status,active:e.lifecycle==='active',hidden:c.hidden,name:s.animationName,duration:s.animationDuration,play:s.animationPlayState,time:a?.currentTime,opacity:s.opacity,transform:s.transform,borders:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],background:s.backgroundColor,rect:[r.width,r.height],illustration:!!c.querySelector('.thumb svg'),badge:!!c.querySelector('.badge'),link:c.tagName==='A'}})})()`);
const onlyIsolated = list => list.every(c => c.active && c.status === 'isolated' ? c.name === 'fleet-isolated-pulse' && c.duration === '2.5s' : c.name === 'none');
const stopped = list => list.every(c => c.name === 'none' || c.play === 'paused');
const media = async value => {
  await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value}]});
  // CSS responds immediately; asynchronous query-change/control reconciliation gets a bounded wait.
  for(let attempt=0;attempt<30;attempt++) {
    if(await ev(`document.querySelector('[data-fk=tv-page-pause]').disabled===${value==='reduce'}&&document.querySelector('.fleet-page').classList.contains('fleet-motion-paused')===!!EQ.fleetTvState().paused`)) return;
    await b.wait(100);
  }
  throw Error('Live motion preference/control failed to settle');
};
try {
  await b.send('Network.enable');
  await b.goto(base + '?role=eqTeam#/eq/fleet');
  for (let attempt=0;attempt<50;attempt++) {
    if (await ev(`!!window.EQ?.state?.D&&!!document.querySelector('.eq-card')`)) break;
    if (attempt===49) throw Error('Fleet did not become ready');
    await b.wait(100);
  }
  await ev('EQ.reset({clearStatus:true})'); await b.wait(180);
  const cycle = await ev(`new Promise(resolve=>{const c=document.querySelector('.st-card-isolated'),r=c.getBoundingClientRect(),a=c.getAnimations()[0],start=a.currentTime;const timeout=setTimeout(()=>resolve({timeout:true}),8000);c.addEventListener('animationiteration',event=>{clearTimeout(timeout);const s=getComputedStyle(c),after=c.getBoundingClientRect();resolve({elapsed:event.elapsedTime,connected:c.isConnected,start,end:a.currentTime,stable:r.width===after.width&&r.height===after.height,opacity:s.opacity,transform:s.transform})},{once:true})})`);
  check('C64 live animation completes a full 2.5 s cycle without a render restart', cycle.elapsed===2.5 && cycle.connected && cycle.end>cycle.start && cycle.stable && cycle.opacity==='1' && cycle.transform==='none',cycle);
  for (const [w, h, tv] of [[1920,1080,false],[1366,768,false],[820,1180,false],[375,812,false],[320,812,false],[1920,1080,true],[1366,768,true]]) {
    await b.viewport(w, h, w < 600); await nav(tv ? { tv: '1' } : {});
    const list = await cards();
    const expected = await ev(`EQ.state.D.equipment.filter(e=>e.lifecycle==='active').map(e=>e.id).sort()`);
    check('C64 register-derived card population ' + w + (tv ? ' TV' : ''), JSON.stringify(list.map(c=>c.id).sort()) === JSON.stringify(expected), { shown: list.length, expected: expected.length });
    check('C64 only active Isolated pulses at 2.5 s ' + w + (tv ? ' TV' : ''), onlyIsolated(list) && list.some(c=>c.name==='fleet-isolated-pulse'), list.filter(c=>c.name!=='none').map(c=>({id:c.id,duration:c.duration})));
    check('C64 uniform boundary, artwork, badge and stable geometry ' + w + (tv ? ' TV' : ''), list.every(c=>c.borders.every(v=>v==='1px') && c.illustration && c.badge && c.opacity==='1' && c.transform==='none'), list.filter(c=>c.borders.some(v=>v!=='1px')));
    const layout = await ev(`({overflow:document.documentElement.scrollWidth-innerWidth,pageOverflow:document.scrollingElement.scrollHeight-innerHeight,kpiClip:[...document.querySelectorAll('[data-kpi]')].some(e=>e.scrollWidth>e.clientWidth+1),pause:!!document.querySelector('[data-fk=tv-page-pause]'),touch:document.querySelector('[data-fk=tv-page-pause]').getBoundingClientRect().height})`);
    check('C64 unclipped layout and compact pause ' + w + (tv ? ' TV' : ''), layout.overflow<=1 && !layout.kpiClip && layout.pause && (!tv || layout.pageOverflow<=1) && (w>=600 || layout.touch>=44), layout);
    check('C64 TV read-only cards / normal links ' + w + (tv ? ' TV' : ''), list.every(c=>c.link===!tv));
    await shot('fleet-' + w + (tv ? '-tv' : ''));
  }
  await b.viewport(1366,768,false); await nav();
  // Inspect the real CSS animation at defined points, without changing keyframes or production state.
  const phases = [];
  for (const [name, time] of [['light',0],['tint',1250],['complete-cycle',2500]]) {
    phases.push(await ev(`(()=>{const c=document.querySelector('.st-card-isolated:not(.retired)'),a=c.getAnimations()[0];a.pause();a.currentTime=${time};const s=getComputedStyle(c);return {time:${time},background:s.backgroundColor,opacity:s.opacity,transform:s.transform,keyframes:a.effect.getKeyframes().map(k=>Object.keys(k).sort())}})()`));
    await shot('pulse-' + name);
  }
  check('C64 full cycle returns to light tint; only background is animated', phases[0].background!==phases[1].background && phases[0].background===phases[2].background && phases.every(p=>p.opacity==='1'&&p.transform==='none'&&p.keyframes.every(keys=>keys.join()==='backgroundColor,composite,computedOffset,easing,offset')), phases);
  await ev('EQ.rerender()'); await b.wait(100);
  await ev(`document.querySelector('[data-fk=tv-page-pause]').focus()`); await b.key(' ');
  check('C64 keyboard Pause stops cards and exposes pressed state', stopped(await cards()) && await ev(`EQ.fleetUI.paused&&document.querySelector('[data-fk=tv-page-pause]').getAttribute('aria-pressed')==='true'`));
  await b.setValue('#fq','QC'); await b.click('[data-fk=type-QC]'); await b.click('[data-fk=refresh]'); await ev('EQ.rerender()'); await b.wait(100);
  check('C64 pause retained through search, type filter, refresh and rerender', stopped(await cards()) && await ev(`EQ.fleetUI.paused&&EQ.route.query.type==='QC'&&EQ.fleetUI.q==='QC'`));
  await b.setValue('#fq',''); await nav({tv:'1'}); await b.wait(100);
  const frozen = await ev(`(()=>{EQ.fleetUI.lastFlip=Date.now()-11000;return EQ.fleetTvState()})()`); await b.wait(1150);
  check('C64 TV pause stops cards and due page rotation', frozen.pages>1 && stopped(await cards()) && await ev(`EQ.fleetTvState().page===${frozen.page}&&EQ.fleetTvState().paused`), frozen);
  await b.click('[data-fk=tv-page-pause]');
  const running = await ev(`(()=>{EQ.fleetUI.lastFlip=Date.now()-11000;return EQ.fleetTvState()})()`); await b.wait(1150);
  check('C64 TV Resume restarts cards and page rotation', (await cards()).filter(c=>c.name!=='none').every(c=>c.play==='running') && await ev(`EQ.fleetTvState().page!==${running.page}&&!EQ.fleetTvState().paused`));
  await nav({motion:'off'}); check('C64 motion=off stops cards and disables motion control', stopped(await cards()) && await ev(`document.querySelector('[data-fk=tv-page-pause]').disabled&&document.querySelector('[data-fk=tv-page-pause]').textContent.includes('Motion off')`));
  await nav({tv:'1',motion:'off'}); const offPage=await ev(`(()=>{EQ.fleetUI.lastFlip=Date.now()-11000;return EQ.fleetTvState().page})()`); await b.wait(1150);
  check('C64 motion=off stops TV page rotation', await ev(`EQ.fleetTvState().page===${offPage}&&EQ.fleetTvState().paused`) && stopped(await cards()));
  await nav();
  for (const tv of [false,true]) {
    await nav(tv?{tv:'1'}:{});
    await media('reduce');
    check('C64 live reduced motion suppresses animation and updates control '+(tv?'TV':'normal'), (await cards()).every(c=>c.name==='none') && await ev(`document.querySelector('[data-fk=tv-page-pause]').disabled&&EQ.fleetTvState().paused`));
    await shot('reduced-motion'+(tv?'-tv':''));
    await media('no-preference');
    check('C64 live motion preference resumes when user has not paused '+(tv?'TV':'normal'), (await cards()).some(c=>c.name==='fleet-isolated-pulse'&&c.play==='running') && await ev(`!document.querySelector('[data-fk=tv-page-pause]').disabled&&!EQ.fleetTvState().paused`));
  }
  await b.click('[data-fk=tv-page-pause]');
  await media('reduce');
  await media('no-preference');
  check('C64 user pause survives live reduced-motion round trip', stopped(await cards()) && await ev('EQ.fleetUI.paused'));
  await b.click('[data-fk=tv-page-pause]'); await nav();
  const id = await ev(`EQ.state.D.equipment.find(e=>e.lifecycle==='active'&&e.status==='readyForOps').id`);
  const statusForm = async (status,reason='') => {
    await ev(`EQ.nav('/eq/jobs/status')`); await b.wait(150); await b.click('[data-fk=correct-'+id+']');
    await b.click('#sf-status-'+status); if(reason) await b.setValue('#sf-reason',reason);
    await b.click('dialog button[type=submit]'); await b.wait(150); await nav();
  };
  check('C64 Ready equipment starts static', (await cards()).find(c=>c.id===id)?.name==='none');
  await statusForm('isolated','C64 synthetic manual UI test');
  check('C64 manual Ready to Isolated starts the pulse', (await cards()).find(c=>c.id===id)?.name==='fleet-isolated-pulse' && await ev(`EQ.eq(${JSON.stringify(id)}).status==='isolated'`));
  await statusForm('readyForOps');
  check('C64 manual Isolated to Ready stops the pulse and preserves audit', (await cards()).find(c=>c.id===id)?.name==='none' && await ev(`EQ.state.D.statusChanges.filter(c=>c.equipmentId===${JSON.stringify(id)}).slice(-2).map(c=>c.status).join()==='isolated,readyForOps'`));
  // Use a register member with no work; all mutations remain inside the temporary browser profile.
  const retired = await ev(`(async()=>{EQ.state.role='admin';EQ.access.refreshSession('C64 retirement check');const e=EQ.eq('eq-qc-demo-14');const s=await EQ.api.setStatus(e.id,{status:'isolated',reason:'C64 synthetic retired exclusion',expectedCurrentStatusChangeId:e.currentStatusChangeId,key:'c64-retire-status'});if(!s.ok)return {status:s};return await EQ.api.retireEquipment(e.id)})()`);
  await nav({lifecycle:'all'});
  check('C64 retired Isolated remains static with uniform boundary', (await cards()).some(c=>c.id==='eq-qc-demo-14'&&!c.active&&c.status==='isolated'&&c.name==='none'&&c.borders.every(v=>v==='1px')), retired);
  await shot('retired-isolated');
  await nav({layout:'table'});
  check('C64 retained table is static', await ev(`!!document.querySelector('table')&&!document.querySelector('.eq-card')&&document.getAnimations().every(a=>a.animationName!=='fleet-isolated-pulse')`));
  // Simulate a browser that delays/drops media-query change events. CSS/matches stay native.
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const native=window.matchMedia.bind(window);window.c64SuppressedListeners=0;window.matchMedia=query=>{const m=native(query);if(query==='(prefers-reduced-motion: reduce)'){const add=m.addEventListener.bind(m);m.addEventListener=(type,...args)=>{if(type==='change'){window.c64SuppressedListeners++;return}return add(type,...args)}}return m}})()`});
  await b.goto(base+'?role=eqTeam#/eq/fleet');
  for(let i=0;i<50&&!await ev(`!!document.querySelector('[data-fk=tv-page-pause]')`);i++) await b.wait(100);
  check('C64 delayed-event regression actually suppresses the preference listener', await ev('window.c64SuppressedListeners>0'));
  await b.viewport(1920,1080,false);
  for(const [mode,q] of [['normal',{}],['TV multiple pages',{tv:'1'}],['TV single page',{tv:'1',type:'QC',status:'isolated'}]]) {
    await nav(q);
    const focus=q.tv?'fleet-tv-exit':'fq'; await ev(`document.querySelector('[data-fk=${focus}]').focus()`);
    const started=Date.now(); await media('reduce');
    const disabled=await ev(`({disabled:document.querySelector('[data-fk=tv-page-pause]').disabled,focus:document.activeElement.dataset.fk,pages:EQ.fleetTvState().pages})`);
    check('C64 timer reconciles reduced motion without listener; focus retained '+mode, (await cards()).every(c=>c.name==='none')&&disabled.disabled&&disabled.focus===focus&&(mode!=='TV single page'||disabled.pages===1), {elapsedMs:Date.now()-started,...disabled});
    const page=await ev(`(()=>{EQ.fleetUI.lastFlip=Date.now()-20000;return EQ.fleetTvState().page})()`);
    await media('no-preference');
    const enabled=await ev(`({disabled:document.querySelector('[data-fk=tv-page-pause]').disabled,focus:document.activeElement.dataset.fk,page:EQ.fleetTvState().page,flipAge:Date.now()-EQ.fleetUI.lastFlip})`);
    check('C64 timer restores motion without listener and resets TV delay '+mode, (await cards()).some(c=>c.name==='fleet-isolated-pulse'&&c.play==='running')&&!enabled.disabled&&enabled.focus===focus&&(!q.tv||(enabled.page===page&&enabled.flipAge<2500)),enabled);
  }
  await b.click('[data-fk=tv-page-pause]'); await media('reduce'); await media('no-preference');
  check('C64 delayed-event timer preserves explicit user pause', stopped(await cards())&&await ev('EQ.fleetUI.paused'));
  const requests=b.events.filter(e=>e.method==='Network.requestWillBeSent').map(e=>e.params.request.url);
  check('C64 CMMS stays absent and no external runtime traffic', await ev(`!EQ.cmms&&!EQ.state.D.cmms&&!document.querySelector('.cmms-fresh,[data-fk^=src-]')`) && requests.every(url=>url.startsWith(new URL(base).origin+'/')||/^(data:|blob:|about:)/.test(url)) && !requests.some(url=>/cmms\.js|zmms\.lk/.test(url)));
  check('C64 no browser console errors', b.errors().length===0,b.errors());
} finally {
  fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({boundary:'Local synthetic browser checks, temporary profile, persona simulation; formal backend/production acceptance not run',browser:b.browser,checks},null,2));
  console.log(JSON.stringify({pass:checks.filter(c=>c.pass).length,total:checks.length,out})); await b.close();
}
