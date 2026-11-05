// U1-C69: History on crane-view Spare part status cards (floating replacement-history panel over the model), flag chips that
// filter the spare parts, and Spare parts condition as the first/default EQ Jobs tab. Usage: node tools/p02b/check_u1_c69.mjs [base] [output folder]
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/spare-history-c69';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9395 }), results = [];
const ev = (x) => b.eval(x);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const step = async (name, fn) => { try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); } catch (e) { results.push({ name, pass: false, error: e.message }); console.log('FAIL ' + name + ': ' + e.message); } };
const shot = async (name, full = false) => { await b.screenshot(out + '/' + name + '.png', { fullPage: full }); };
const Q1 = 'eq-qc-demo-01';
const open = async (role, hash) => {
  await b.goto(base + '?role=' + role + '#' + hash);
  await ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason)))`);
};
const waitViewer = async () => { for (let n = 0; n < 100; n++) { if (await ev('!!window.EQ?.qc?.session?.ready')) break; await b.wait(150); } };
const waitPanel = async () => { for (let n = 0; n < 40; n++) { if (await ev(`!!document.querySelector('#tabpanel [aria-busy="false"]')`)) break; await b.wait(100); } };
const pos = (key, eq = Q1) => ev(`EQ.positionsOf(${JSON.stringify(eq)}).find(p=>p.key===${JSON.stringify(key)}).id`);
const errs = () => ev('window.__errs||[]');

try {
  await b.viewport(1500, 920);

  // ------------------------------------------------------------ EQ Jobs: Spare parts condition first and default
  await step('J1 Bare EQ Jobs link opens Spare parts condition, listed first', async () => {
    await open('eqTeam', '/eq/jobs'); await b.wait(500);
    const r = await ev(`({hash:location.hash,tabs:[...document.querySelectorAll('.eqjobs-page .subtabs a')].map(a=>[a.textContent,a.getAttribute('aria-current')]),table:!!document.querySelector('.spare-table'),nav:document.querySelector('[data-fk="nav-eq-jobs"]')?.getAttribute('href')})`);
    assert(r.hash.startsWith('#/eq/jobs/spare-parts'), 'hash ' + r.hash);
    assert(JSON.stringify(r.tabs.map((t) => t[0])) === JSON.stringify(['Spare parts condition', 'Special/Projects', 'EQ status']), 'order ' + JSON.stringify(r.tabs));
    assert(r.tabs[0][1] === 'page' && r.table, 'Spare parts condition not the loaded tab');
    assert(r.nav === '#/eq/jobs/spare-parts', 'top Jobs link ' + r.nav);
    await shot('01-jobs-default-spare-parts');
  });
  await step('J2 Fleet > Jobs link and unknown tab land on Spare parts condition; other tabs and filters still work', async () => {
    await open('eqTeam', '/eq/fleet'); await b.wait(500);
    await b.click('[data-fk="nav-eq-jobs"]'); await b.wait(500);
    assert((await ev('location.hash')).startsWith('#/eq/jobs/spare-parts'), 'Jobs link did not land on spare parts');
    await ev(`EQ.nav('/eq/jobs/unknown-tab',{})`); await b.wait(400);
    assert(await ev(`document.querySelector('.eqjobs-page .subtabs a[aria-current=page]')?.textContent==='Spare parts condition'&&!!document.querySelector('.spare-table')`), 'unknown tab fallback');
    await b.click('[data-fk="jp-special"]'); await b.wait(400);
    assert(await ev(`location.hash.startsWith('#/eq/jobs/special')&&!!document.querySelector('[data-fk="add-job"]')`), 'Special/Projects not reachable');
    await ev(`EQ.nav('/eq/jobs/special',{equipment:'${Q1}'})`); await b.wait(400);
    assert((await ev(`document.querySelector('[data-fk="jp-spare-parts"]').getAttribute('href')`)) === '#/eq/jobs/spare-parts?equipment=' + Q1, 'shared filter not kept on the first tab');
  });
  await step('J3 Remembered Jobs route from before the change resolves to the new default; Daily work still redirects safely', async () => {
    await ev(`localStorage.setItem(EQ.access.lastKey(),'/eq/jobs/special');localStorage.setItem(EQ.access.lastKey()+':eq','/eq/jobs/special')`);
    const r = await ev(`({landing:EQ.access.landing(),sec:EQ.access.readLastSection('eq')})`);
    assert(r.landing === '/eq/jobs/spare-parts' && r.sec === '/eq/jobs/spare-parts', JSON.stringify(r));
    await ev(`EQ.nav('/eq/jobs/daily',{})`); await b.wait(400);
    assert(await ev(`location.hash.includes('/eq/jobs/special')&&document.querySelector('[role=status]')?.textContent.includes('removed')&&document.querySelectorAll('.eqjobs-page .subtabs a').length===3`), 'AM07 daily redirect changed');
    await ev(`EQ.access.clearLast()`);
  });
  await step('J4 Jobs register History expansion still lists revisions', async () => {
    const gb = await pos('hoist.drive.gearbox.a');
    await ev(`EQ.nav('/eq/jobs/spare-parts',{equipment:'${Q1}'})`); await b.wait(400);
    await b.click(`[data-fk="hist-${gb}"]`); await b.wait(250);
    const t = await ev(`document.querySelector('.hist-row')?.textContent||''`);
    assert(/History of Main hoist gearbox A/.test(t) && /Revision 1 · Original recorded/.test(t), t.slice(0, 160));
    assert(!(await ev(`!!document.querySelector('.hist-row .tl')`)) && await ev(`!!document.querySelector('.hist-row .sp-log')`), 'change log still uses edge-strip timeline');
  });
  await step('J5 Jobs flag chips filter the register and keep whole-selection counts', async () => {
    await ev(`EQ.nav('/eq/jobs/spare-parts',{})`); await b.wait(400);
    const want = await ev(`EQ.spares.allRows(r=>r.flag==='overdue').length`), total = await ev(`EQ.spares.allRows().length`);
    await b.click('[data-fk="jflag-overdue"]'); await b.wait(400);
    const r = await ev(`({hash:location.hash,rows:document.querySelectorAll('.spare-table tbody tr[data-pos]').length,flags:[...document.querySelectorAll('.spare-table tbody tr[data-pos]')].every(t=>t.textContent.includes('Overdue')),
      pressed:document.querySelector('[data-fk="jflag-overdue"]').getAttribute('aria-pressed'),all:document.querySelector('[data-fk="jflag-all"]').textContent,sel:document.querySelector('[data-fk="flt-flag"]').value})`);
    assert(r.hash.includes('flag=overdue') && r.rows === want && want >= 1 && r.flags && r.pressed === 'true' && r.all === total + ' registered' && r.sel === 'overdue', JSON.stringify(r));
    await b.click('[data-fk="jflag-overdue"]'); await b.wait(400);
    assert(await ev(`!location.hash.includes('flag=')&&document.querySelectorAll('.spare-table tbody tr[data-pos]').length===${total}&&document.querySelector('[data-fk="jflag-all"]').getAttribute('aria-pressed')==='true'`), 'second press did not clear');
  });

  // ------------------------------------------------------------ crane view: History over the viewer
  let gb, motor;
  await step('H1 Every registered card offers History beside Update condition', async () => {
    await open('eqTeam', '/eq/equipment/' + Q1 + '?view=3d&panel=spareParts'); await waitViewer(); await waitPanel();
    gb = await pos('hoist.drive.gearbox.a'); motor = await pos('hoist.drive.motor.a');
    const r = await ev(`[...document.querySelectorAll('#tabpanel li[data-pos]')].map(li=>({pos:li.dataset.pos,btns:[...li.querySelectorAll('.spare-actions button')].map(x=>x.textContent.trim())}))`);
    assert(r.length >= 8 && r.every((x) => JSON.stringify(x.btns) === JSON.stringify(['Update condition', 'History'])), JSON.stringify(r.slice(0, 3)));
    assert(!(await ev(`/Revision|History of/.test(document.querySelector('#tabpanel').textContent)`)), 'panel leaks history text');
  });
  await step('H2 History opens a floating gearbox history over the model (model visible beside it), keeping the 3D session and the URL', async () => {
    await ev(`window.c69=EQ.qc.session.viewer.renderer;window.c69Hash=location.hash`);
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(250);
    const r = await ev(`(()=>{const o=document.querySelector('.sp-history'),st=document.querySelector('.unified-qc-stage'),w=o?.parentElement;const a=o?.getBoundingClientRect(),s=st?.getBoundingClientRect();
      return {inStage:!!w&&w.classList.contains('sp-history-stage')&&w.contains(st),cover:!!a&&a.top>=s.top&&a.bottom<=s.bottom&&a.right<=s.right&&s.right-a.right<20&&a.width<=380&&a.left-s.left>s.width*0.4&&document.elementFromPoint(s.left+40,s.top+s.height/2)?.tagName==='CANVAS',
        title:document.querySelector('#sp-history-title')?.textContent,focus:document.activeElement?.id,same:EQ.qc.session.viewer.renderer===c69&&location.hash===c69Hash,
        exp:document.querySelector('[data-fk="spare-history-${gb}"]').getAttribute('aria-expanded'),tool:!!document.querySelector('.unified-qc .vp-bar')&&!!document.querySelector('.unified-qc .vp-tools')}})()`);
    assert(r.inStage && r.cover, 'not a floating panel over the stage with the model visible ' + JSON.stringify(r));
    assert(r.title === 'Main hoist gearbox A' && r.focus === 'sp-history-title', 'title/focus ' + JSON.stringify(r));
    assert(r.same && r.exp === 'true' && r.tool, 'viewer session/URL/state ' + JSON.stringify(r));
    await shot('02-crane-history-gearbox-a');
  });
  await step('H3 Gearbox A (Original): compact stats, commissioning period, no edge strips and the full register change log', async () => {
    const r = await ev(`(()=>{const o=document.querySelector('.sp-history'),row=EQ.spares.row('${gb}');const li=o.querySelector('.sp-inst > li');return {text:o.textContent,items:o.querySelectorAll('.sp-inst > li').length,first:li?.textContent,
      log:o.querySelectorAll('.sp-history-log .sp-log > li').length,want:EQ.spares.history('${gb}').length,comm:EQ.fmtDate(row.commissionedOn),pred:EQ.fmtDate(row.predicted),stats:o.querySelector('.sp-history-stats').textContent,
      strips:[...o.querySelectorAll('li')].filter(x=>parseFloat(getComputedStyle(x).borderLeftWidth)>1).length}})()`);
    assert(r.items === 1 && r.first.includes(r.comm + ' – present') && /Original · Current/.test(r.first) && /Synthetic Gears · SYN-GB-12 · S\/N SYN-G-0007/.test(r.first), r.text.slice(0, 300));
    assert(r.stats.includes('In service since' + r.comm) && /Replacements0/.test(r.stats) && r.stats.includes(r.pred), 'stats ' + r.stats);
    assert(r.strips === 0, 'coloured edge strips present: ' + r.strips);
    assert(r.log === r.want && r.want >= 1, 'change log ' + r.log + '/' + r.want);
  });
  await step('H4 Switching to another card shows that part; a job replacement links its special job', async () => {
    await b.click(`[data-fk="spare-history-${motor}"]`); await b.wait(250);
    const r = await ev(`(()=>{const o=document.querySelector('.sp-history');const evs=EQ.state.D.events.filter(e=>e.positionId==='${motor}'&&!e.voided);const j=evs.find(e=>e.jobId);
      return {title:o.querySelector('h2').textContent,items:o.querySelectorAll('.sp-inst > li').length,want:evs.length,link:j?o.querySelector('a[href="#/eq/jobs/special/'+j.jobId+'"]')?.textContent:null,num:j?EQ.job(j.jobId).number:null,
        open:document.querySelectorAll('[aria-expanded="true"][data-fk^="spare-history-"]').length}})()`);
    assert(r.title === 'Main hoist motor A' && r.items === r.want && r.want >= 1 && r.open === 1, JSON.stringify(r));
    assert(r.num && r.link === r.num, 'job link ' + JSON.stringify(r));
  });
  await step('H5 A replacement saved while the history is open appears at the top; the earlier item is closed', async () => {
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(250);
    await b.click(`[data-fk="update-spare-${gb}"]`); await b.wait(250);
    await ev(`document.querySelector('input[name="sp-act"][value="replacement"]')?.click()`); await b.wait(120);
    const day = await ev(`EQ.shiftDay(EQ.todayColombo(),-20)`);
    await b.setValue('#sp-desc', 'Main hoist gearbox (C69 replacement)'); await b.setValue('#sp-brand', 'C69 Gears'); await b.setValue('#sp-model', 'C69-GB'); await b.setValue('#sp-serial', 'C69-001'); await b.setValue('#sp-date', day);
    await b.click('dialog button[type="submit"]'); await b.wait(400);
    const r = await ev(`(()=>{const o=document.querySelector('.sp-history');const li=[...o.querySelectorAll('.sp-inst > li')];return {dlg:!!document.querySelector('dialog[open]'),n:li.length,top:li[0]?.textContent,second:li[1]?.textContent,facts:o.querySelector('.sp-history-stats').textContent}})()`);
    const fd = await ev(`EQ.fmtDate(${JSON.stringify(day)})`);
    assert(!r.dlg && r.n === 2, JSON.stringify(r).slice(0, 300));
    assert(r.top.includes(fd + ' – present') && /C69 Gears · C69-GB · S\/N C69-001/.test(r.top) && /Current/.test(r.top), 'top ' + r.top);
    assert(/Original/.test(r.second) && r.second.includes(' – ' + fd) && !/Current/.test(r.second) && /Replacements1/.test(r.facts), 'second ' + r.second);
    await shot('03-crane-history-after-replacement');
  });
  await step('H6 Escape closes the history and returns focus to its History button', async () => {
    await ev(`document.querySelector('#sp-history-title').focus()`);
    await b.key('Escape'); await b.wait(250);
    const r = await ev(`({open:!!document.querySelector('.sp-history'),wrap:!!document.querySelector('.sp-history-stage'),focus:document.activeElement?.dataset.fk,stageParent:document.querySelector('.unified-qc-stage')?.parentElement?.classList.contains('unified-qc')})`);
    assert(!r.open && !r.wrap && r.stageParent && r.focus === 'spare-history-' + gb, JSON.stringify(r));
  });
  await step('H7 Stays open across Flat/3D and Technical; Close, a second History click, selecting a part and Reset close it', async () => {
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(200);
    await b.click('[data-fk="sp-history-close"]'); await b.wait(200);
    assert(!(await ev(`!!document.querySelector('.sp-history')`)), 'Close button');
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(200);
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(200);
    assert(!(await ev(`!!document.querySelector('.sp-history')`)), 'toggle');
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(200);
    await b.click('[data-fk="view-flat"]'); await b.wait(400); await b.click('[data-fk="mode-technical"]'); await b.wait(400);
    assert(await ev(`!!document.querySelector('.sp-history')&&EQ.qc.session.viewer.camera.isOrthographicCamera`), 'Flat/Technical switch closed the floating history');
    await b.click('[data-fk="view-3d"]'); await b.wait(400);
    await ev(`EQ.eqv.select(EQ.eq('${Q1}'),{main:EQ.pos('${motor}').mainId,sub:EQ.pos('${motor}').subId,part:'${motor}'})`); await b.wait(500);
    assert(!(await ev(`!!document.querySelector('.sp-history')`)), 'selection change kept the history open');
    await b.click('[data-fk="reset"]'); await b.wait(500); await waitPanel();
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(200);
    await b.click('[data-fk="reset"]'); await b.wait(400);
    assert(!(await ev(`!!document.querySelector('.sp-history')`)), 'Reset on the whole crane kept the history open');
  });
  await step('H8 Management (read-only) sees History but no Update condition; without EQ Jobs access History is not offered', async () => {
    await open('management', '/eq/equipment/' + Q1 + '?view=3d&panel=spareParts'); await waitPanel();
    const r = await ev(`({h:document.querySelectorAll('[data-fk^="spare-history-"]').length,u:document.querySelectorAll('[data-fk^="update-spare-"]').length})`);
    assert(r.h >= 8 && r.u === 0, JSON.stringify(r));
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(250);
    assert(await ev(`!!document.querySelector('.sp-history .sp-inst')`), 'management history');
    await ev(`EQ.setPersona('admin')`); await b.wait(150);
    const saved = await ev(`EQ.access.save([{role:'management',feature:'eq.jobs.view',on:false}],EQ.state.D.access.version,'C69 check').ok`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/equipment/${Q1}',{view:'3d',panel:'spareParts'})`); await b.wait(300); await waitPanel();
    const r2 = await ev(`({h:document.querySelectorAll('[data-fk^="spare-history-"]').length,o:!!document.querySelector('.sp-history'),api:EQ.spares.replacementHistory('${gb}').status,cards:document.querySelectorAll('#tabpanel li[data-pos]').length})`);
    assert(saved && r2.h === 0 && !r2.o && r2.api === 403 && r2.cards >= 8, JSON.stringify({ saved, r2 }));
  });
  await step('H9 Other equipment types: RTG01 history lays over the viewport message', async () => {
    await open('eqTeam', '/eq/equipment/eq-rtg-demo-01?panel=spareParts'); await waitPanel();
    const tyre = await pos('gantry.tyre.set.a', 'eq-rtg-demo-01');
    await b.click(`[data-fk="spare-history-${tyre}"]`); await b.wait(250);
    const r = await ev(`(()=>{const o=document.querySelector('.sp-history'),vp=o?.parentElement;return {host:!!vp&&vp.classList.contains('viewport')&&vp.classList.contains('sp-history-host'),title:o?.querySelector('h2').textContent,h:o?.getBoundingClientRect().height}})()`);
    assert(r.host && r.h >= 150 && /Tyre/i.test(r.title || ''), JSON.stringify(r));
  });
  await step('H10 Phone: History in the Details drawer closes the drawer, shows the history over the viewer, Close returns to Details', async () => {
    await b.viewport(390, 844, true, 2);
    await open('eqTeam', '/eq/equipment/' + Q1 + '?view=3d&panel=spareParts'); await waitViewer();
    await b.click('[data-fk="open-panel"]'); await b.wait(300); await waitPanel();
    await b.click(`[data-fk="spare-history-${gb}"]`); await b.wait(400);
    const r = await ev(`(()=>{const o=document.querySelector('.sp-history');const a=o?.getBoundingClientRect();return {drawer:EQ.eqUI.drawer,open:!!o,visible:!!a&&a.top<innerHeight&&a.bottom>0&&a.width>=300,
      sw:document.documentElement.scrollWidth<=innerWidth,close:document.querySelector('[data-fk="sp-history-close"]').getBoundingClientRect().height}})()`);
    assert(r.open && !r.drawer && r.visible && r.sw && r.close >= 44, JSON.stringify(r));
    await shot('04-phone-history');
    await b.click('[data-fk="sp-history-close"]'); await b.wait(300);
    assert(await ev(`!document.querySelector('.sp-history')&&document.activeElement?.dataset.fk==='open-panel'`), 'phone focus return');
    await b.viewport(1500, 920);
  });
  await step('H12 Crane-view flag chips filter the cards, combine with search and survive a re-render', async () => {
    await open('eqTeam', '/eq/equipment/' + Q1 + '?view=3d&panel=spareParts'); await waitPanel();
    const want = await ev(`EQ.spares.rows('${Q1}').filter(r=>r.flag==='overdue').map(r=>r.posId).sort()`), total = await ev(`EQ.spares.rows('${Q1}').length`);
    const vis = `[...document.querySelectorAll('#tabpanel li[data-pos]')].filter(li=>!li.hidden).map(li=>li.dataset.pos).sort()`;
    await b.click('[data-fk="spare-flag-overdue"]'); await b.wait(150);
    assert(JSON.stringify(await ev(vis)) === JSON.stringify(want) && want.length >= 1, 'overdue filter ' + JSON.stringify(await ev(vis)));
    assert(await ev(`document.querySelector('[data-fk="spare-flag-overdue"]').getAttribute('aria-pressed')==='true'&&document.querySelector('[data-fk="spare-flag-all"]').textContent==='${total} registered'`), 'pressed state/count');
    await shot('05-crane-chip-filter-overdue');
    await b.click(`[data-fk="spare-history-${want[0]}"]`); await b.wait(300);
    assert(JSON.stringify(await ev(vis)) === JSON.stringify(want), 'filter lost on re-render');
    await b.click('[data-fk="sp-history-close"]'); await b.wait(200);
    await b.setValue('#panel-search', 'no-such-part-xyz'); await b.wait(150);
    assert((await ev(vis)).length === 0 && await ev(`!document.querySelector('#tabpanel .panel-search-empty').hidden`), 'search did not combine with the filter');
    await b.setValue('#panel-search', ''); await b.wait(150);
    await b.click('[data-fk="spare-flag-dueSoon"]'); await b.wait(150);
    const ds = await ev(`EQ.spares.rows('${Q1}').filter(r=>r.flag==='dueSoon').map(r=>r.posId).sort()`);
    assert(JSON.stringify(await ev(vis)) === JSON.stringify(ds), 'due soon filter');
    await b.click('[data-fk="spare-flag-dueSoon"]'); await b.wait(150);
    assert((await ev(vis)).length === total && await ev(`document.querySelector('[data-fk="spare-flag-all"]').getAttribute('aria-pressed')==='true'`), 'second press did not show all');
  });
  await step('H11 No script errors', async () => { const e = await errs(); assert(!e.length, JSON.stringify(e)); });
} finally {
  fs.writeFileSync(out + '/checks.json', JSON.stringify({ date: new Date().toISOString(), base, passed: results.filter((r) => r.pass).length, total: results.length, results }, null, 2));
  console.log(results.filter((r) => r.pass).length + '/' + results.length + ' passed');
  await b.close();
}
