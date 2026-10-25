import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/fleet-summary-c59'; fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9408, gpu: 'none' }), checks = [];
const ev = x => b.eval(x);
const check = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail }); if (!pass) throw Error(name + ': ' + JSON.stringify(detail)); };
const nav = async q => { await ev(`EQ.nav('/eq/fleet',${JSON.stringify(q)});window.scrollTo(0,0)`); await b.wait(160); };
// Independent UI oracle: read the register directly, rather than the fleet-count selector or the new rendering helper.
const reconcile = () => ev(`(()=>{const active=EQ.state.D.equipment.filter(e=>e.lifecycle==='active'&&(!EQ.route.query.type||EQ.route.query.type==='all'||e.typeCode===EQ.route.query.type));const types=['QC','RTG','ES'].filter(t=>active.some(e=>e.typeCode===t));return ['total','readyForOps','breakdown','maintenance'].map(k=>{const card=document.querySelector('[data-kpi="'+k+'"]'),rows=[...card.querySelectorAll('[data-eq-type]')];const wanted=t=>active.filter(e=>e.typeCode===t&&(k==='total'||e.status===k)).length;return {k,valid:rows.length===types.length&&types.every(t=>{const e=rows.find(e=>e.dataset.eqType===t);return e&&Number(e.querySelector('b').textContent)===wanted(t)})&&Number(card.querySelector('.n').textContent)===types.reduce((s,t)=>s+wanted(t),0)}})})()`);
try {
  for (const [w, h, tv] of [[1920,1080,false],[1366,768,false],[375,812,false],[320,812,false],[1920,1080,true],[1366,768,true]]) {
    await b.viewport(w,h,w<768); await b.goto(base+'?role=eqTeam#/eq/fleet'+(tv?'?tv=1&motion=off':''));
    const rows=await reconcile(); check(w+'px '+(tv?'TV ':'')+'all type summaries reconcile',rows.every(r=>r.valid),rows);
    const layout=await ev(`(()=>{const cards=[...document.querySelectorAll('.kpi-row > .kpi')],icons=[...document.querySelectorAll('.kpi-row .k-label-icon')],r=k=>document.querySelector('[data-kpi="'+k+'"]').getBoundingClientRect();return{icons:icons.length,compactIcons:icons.every(i=>i.getAttribute('aria-hidden')==='true'&&i.getBoundingClientRect().width<=16&&i.getBoundingClientRect().height<=16),oldArt:document.querySelectorAll('.kpi-row .eq-art,.kpi-row .k-ic,.kpi-row .donut').length,overflow:document.documentElement.scrollWidth-innerWidth,clip:cards.some(c=>c.scrollWidth>c.clientWidth+1||c.scrollHeight>c.clientHeight+1),row:new Set(cards.map(c=>Math.round(c.getBoundingClientRect().top))).size,share:r('share').width,unknown:r('unreported').width,status:r('maintenance').width,buttons:document.querySelectorAll('.kpi-row button').length,scroll:document.scrollingElement.scrollHeight-innerHeight}})()`);
    check(w+'px '+(tv?'TV ':'')+'compact icons and accessible layout',layout.icons===6&&layout.compactIcons&&layout.oldArt===0&&layout.overflow<=1&&!layout.clip&&(w<1280||(layout.row===1&&layout.share<layout.status&&layout.unknown<layout.status))&&layout.buttons===(tv?0:4)&&(!tv||layout.scroll<=1),layout);
    await b.screenshot(out+'/'+(tv?'tv-':'fleet-')+w+'.png');
  }
  await b.viewport(1600,1000); await b.goto(base+'?role=eqTeam#/eq/fleet');
  for (const type of ['QC','RTG','ES']) { await nav({type});const r=await reconcile();check(type+' filter scopes headline and summary together',r.every(x=>x.valid),r); }
  await nav({});
  for (const status of ['readyForOps','breakdown','maintenance','unreported']) {
    await b.click('[data-fk="cc-'+status+'"]');
    check(status+' card still filters equipment and keeps full type-based KPIs',await ev(`document.querySelector('[data-fk="cc-${status}"]').getAttribute('aria-pressed')==='true'&&[...document.querySelectorAll('.eq-card')].every(c=>(EQ.eq(c.dataset.eq).status||'unreported')==='${status}')`)&&(await reconcile()).every(x=>x.valid));
    await b.click('[data-fk="cc-'+status+'"]');
  }
  await ev(`EQ.setPersona('admin');window.c59New=EQ.api.createEquipment({code:'C59-QC-NEW',typeCode:'QC'}).eq.id`); await nav({});
  check('New unreported equipment updates totals without inventing a ready count',(await reconcile()).every(r=>r.valid)&&await ev(`EQ.eq(window.c59New).status===null&&Number(document.querySelector('[data-kpi="total"] .n').textContent)===68`));
  await ev(`EQ.api.setStatus(window.c59New,{status:'readyForOps'})`);
  check('New Ready status updates QC and ready percentage', (await reconcile()).every(r=>r.valid)&&await ev(`Number(document.querySelector('[data-kpi="share"] .n').textContent.replace(/[^0-9]/g,''))===Math.round(EQ.state.D.equipment.filter(e=>e.lifecycle==='active'&&e.status==='readyForOps').length/EQ.state.D.equipment.filter(e=>e.lifecycle==='active').length*100)`));
  const before=await ev(`JSON.stringify(EQ.state.D.equipment.map(e=>[e.id,e.status]))`);
  await ev(`EQ.api.setStatus(window.c59New,{status:'breakdown',reason:''})`);
  check('Rejected status change leaves summaries unchanged',await ev(`JSON.stringify(EQ.state.D.equipment.map(e=>[e.id,e.status]))===${JSON.stringify(before)}`)&&(await reconcile()).every(r=>r.valid));
  await ev(`EQ.api.setStatus(window.c59New,{status:'breakdown',reason:'Synthetic C59 check'})`);
  check('Accepted Breakdown moves the same QC into its correct summary',(await reconcile()).every(r=>r.valid));
  await ev(`EQ.api.retireEquipment(window.c59New)`); await nav({lifecycle:'all'});
  check('Including retired equipment never adds it to active KPIs',(await reconcile()).every(r=>r.valid)&&await ev(`Number(document.querySelector('[data-kpi="total"] .n').textContent)===67&&!!document.querySelector('[data-eq="'+window.c59New+'"]')`));
  await ev(`EQ.setPersona('management')`);await nav({});
  check('Management status-card filters stay read-only',await ev(`document.querySelector('[data-kpi="breakdown"]').getAttribute('aria-label').includes('QC:')&&EQ.api.setStatus('eq-qc-demo-03',{status:'readyForOps'}).status===403`));
  await b.click('[data-fk="cc-breakdown"]');await ev(`document.querySelector('[data-fk="cc-breakdown"]').focus()`);await b.key('Enter');
  check('Keyboard toggles the selected filter off',await ev(`document.querySelector('[data-fk="cc-breakdown"]').getAttribute('aria-pressed')==='false'`));
  check('No browser errors',b.errors().length===0,b.errors());
} finally {
  const result={passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,checks,errors:b.errors()};fs.writeFileSync(out+'/checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,failed:result.failed,last:checks.at(-1)}));await b.close();
}
