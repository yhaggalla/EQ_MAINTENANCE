// U1-C78: crane-view right panel. Spare parts as one line each (name + status) that opens to the full record, one line open at a time,
// the part picked in the 3D model opens its own line, no count badges on the main tabs, flat rows (no card shadows or side strips).
// Usage: node tools/p02b/check_u1_c78.mjs [base] [output folder]
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/panel-lines-c78';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9397 }), results = [];
const ev = (x) => b.eval(x);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const step = async (name, fn) => { try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); } catch (e) { results.push({ name, pass: false, error: e.message }); console.log('FAIL ' + name + ': ' + e.message); } };
const shot = (name) => b.screenshot(out + '/' + name + '.png');
const Q1 = 'eq-qc-demo-01';
const open = async (role, hash) => {
  await b.goto(base + '?role=' + role + '#' + hash);
  await ev(`window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));addEventListener('unhandledrejection',e=>__errs.push(String(e.reason)))`);
};
const waitViewer = async () => { for (let n = 0; n < 100; n++) { if (await ev('!!window.EQ?.qc?.session?.ready')) break; await b.wait(150); } };
const waitPanel = async () => { for (let n = 0; n < 40; n++) { if (await ev(`!!document.querySelector('#tabpanel [aria-busy="false"]')`)) break; await b.wait(100); } };
const lines = `[...document.querySelectorAll('#tabpanel li.sp-row')].map(li=>({pos:li.dataset.pos,flag:li.dataset.flag,name:li.querySelector('.sp-line-name').textContent,state:li.querySelector('.sp-state').textContent,exp:li.querySelector('.sp-line').getAttribute('aria-expanded'),shown:!li.querySelector('.sp-detail').hidden&&li.querySelector('.sp-detail').offsetHeight>0}))`;

try {
  await b.viewport(1500, 920);

  await step('01 Main tabs show plain names, no count badges', async () => {
    await open('eqTeam', '/eq/equipment/' + Q1 + '?panel=spareParts'); await waitViewer(); await waitPanel();
    const r = await ev(`({n:document.querySelectorAll('.side-panel [role="tab"] .tab-n').length,txt:[...document.querySelectorAll('.side-panel [role="tab"]')].map(t=>t.textContent.trim()),aria:[...document.querySelectorAll('.side-panel [role="tab"]')].map(t=>t.getAttribute('aria-label'))})`);
    assert(r.n === 0, 'badges ' + r.n);
    assert(JSON.stringify(r.txt) === JSON.stringify(['Spare part status', 'Projects/Special', 'Technical']), 'tab text ' + JSON.stringify(r.txt));
    assert(r.aria.every((a) => a === null), 'aria-label counts ' + JSON.stringify(r.aria));
  });

  await step('02 Every registered part is one closed line with name and status; Overdue, then Due soon first', async () => {
    const r = await ev(lines); const want = await ev(`EQ.spares.rows('${Q1}',null).map(r=>({pos:r.posId,flag:r.flag||'none',word:EQ.panelTabs.spareStatus(r)[0]}))`);
    assert(r.length === want.length && r.length > 3, 'count ' + r.length + '/' + want.length);
    assert(r.every((x) => x.exp === 'false' && !x.shown), 'a line is open at whole-equipment scope');
    const rank = (f) => (f === 'overdue' ? 0 : f === 'dueSoon' ? 1 : 2);
    assert(r.every((x, i) => i === 0 || rank(r[i - 1].flag) <= rank(x.flag)), 'order ' + r.map((x) => x.flag).join(','));
    assert(r.every((x) => want.find((w) => w.pos === x.pos)?.word === x.state.trim()), 'status words');
    assert(r.some((x) => x.state.trim() === 'Overdue') && r.some((x) => x.state.trim() === 'OK'), 'status mix');
    await shot('01-lines-closed');
  });

  await step('03 Clicking a line opens the full record; a second line closes the first; clicking again closes', async () => {
    const [a, c] = (await ev(lines)).filter((x) => x.state.trim() !== 'Not recorded');
    await b.click(`[data-fk="spare-line-${a.pos}"]`);
    let r = await ev(lines);
    assert(r.find((x) => x.pos === a.pos).exp === 'true' && r.find((x) => x.pos === a.pos).shown, 'first did not open');
    const txt = await ev(`document.querySelector('#spd-${a.pos}').textContent`);
    for (const k of ['Condition', 'Brand', 'Model / part no.', 'Serial', 'Replaced', 'Expected life', 'Next predicted replacement', 'Update condition']) assert(txt.includes(k), 'missing ' + k);
    await shot('02-line-open');
    await b.click(`[data-fk="spare-line-${c.pos}"]`);
    r = await ev(lines);
    assert(r.filter((x) => x.exp === 'true').map((x) => x.pos).join() === c.pos, 'one open at a time: ' + JSON.stringify(r.filter((x) => x.exp === 'true')));
    await b.click(`[data-fk="spare-line-${c.pos}"]`);
    r = await ev(lines);
    assert(r.every((x) => x.exp === 'false' && !x.shown), 'did not close');
  });

  await step('04 Picking a registered part in the 3D model opens its line', async () => {
    const pos = await ev(`EQ.spares.rows('${Q1}',null).find(r=>r.flag==='overdue').posId`);
    await ev(`EQ.eqv.select(EQ.eq('${Q1}'),{part:'${pos}'})`); await b.wait(500); await waitPanel();
    const r = await ev(lines);
    assert(r.length === 1 && r[0].pos === pos && r[0].exp === 'true' && r[0].shown, JSON.stringify(r));
    assert(await ev(`new URLSearchParams(location.hash.split('?')[1]).get('part')==='${pos}'`), 'URL');
    await shot('03-picked-part-open');
  });

  await step('05 Flag filter, search and History still work on lines', async () => {
    await open('eqTeam', '/eq/equipment/' + Q1 + '?panel=spareParts'); await waitViewer(); await waitPanel();
    await b.click('[data-fk="spare-flag-overdue"]'); await b.wait(150);
    let vis = await ev(`[...document.querySelectorAll('#tabpanel li.sp-row')].filter(li=>!li.hidden).map(li=>li.dataset.flag)`);
    assert(vis.length && vis.every((f) => f === 'overdue'), 'filter ' + vis);
    await b.click('[data-fk="spare-flag-overdue"]'); await b.wait(150);
    const name = await ev(`document.querySelector('#tabpanel li.sp-row .sp-line-name').textContent`);
    await ev(`(()=>{const i=document.querySelector('[data-fk="panel-search"]');i.value=${JSON.stringify(name)};i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await b.wait(150);
    vis = await ev(`[...document.querySelectorAll('#tabpanel li.sp-row')].filter(li=>!li.hidden).map(li=>li.querySelector('.sp-line-name').textContent)`);
    assert(vis.includes(name) && vis.length < (await ev(`document.querySelectorAll('#tabpanel li.sp-row').length`)), 'search ' + vis);
    await ev(`(()=>{const i=document.querySelector('[data-fk="panel-search"]');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await b.wait(150);
    const rep = await ev(`EQ.spares.rows('${Q1}',null).find(r=>r.condition==='replaced').posId`);
    await b.click(`[data-fk="spare-line-${rep}"]`);
    await b.click(`[data-fk="spare-history-${rep}"]`); await b.wait(300);
    const r = await ev(`({panel:!!document.querySelector('.sp-history'),exp:document.querySelector('[data-fk="spare-line-${rep}"]').getAttribute('aria-expanded')})`);
    assert(r.panel && r.exp === 'true', 'history ' + JSON.stringify(r));
    // the history view uses the same type and flat style as the lines: plain condition text, status dot + word, no chips
    const st = await ev(`(()=>{const p=document.querySelector('.sp-history');const t=p.querySelector('h2');return {chips:p.querySelectorAll('.sp-history-head .tag').length,state:p.querySelector('.sp-history-head .sp-state')?.textContent,h2:getComputedStyle(t).fontSize+'/'+getComputedStyle(t).fontWeight,radius:getComputedStyle(p).borderRadius,dt:getComputedStyle(p.querySelector('.sp-specs dt')||t).fontWeight}})()`);
    assert(st.chips === 0 && st.state && st.h2 === '13px/600' && st.radius === '8px' && st.dt === '400', 'history style ' + JSON.stringify(st));
    await shot('04-history-line-open');
    await b.click('[data-fk="sp-history-close"]'); await b.wait(200);
    assert(await ev(`document.querySelector('[data-fk="spare-line-${rep}"]').getAttribute('aria-expanded')==='true'&&document.activeElement?.dataset.fk==='spare-history-${rep}'`), 'line closed or focus lost after closing history');
  });

  await step('06 Flat look: no shadows or side strips on lines and job rows', async () => {
    const s = await ev(`(()=>{const li=document.querySelector('#tabpanel li.sp-row');const cs=getComputedStyle(li);return {shadow:cs.boxShadow,left:cs.borderLeftWidth,radius:cs.borderRadius}})()`);
    assert(s.shadow === 'none' && s.left === '0px' && s.radius === '0px', 'spare ' + JSON.stringify(s));
    await b.click('[data-fk="tab-special"]'); await b.wait(400); await waitPanel();
    const j = await ev(`(()=>{const li=document.querySelector('#tabpanel .eq-current-card');const cs=getComputedStyle(li);return {shadow:cs.boxShadow,left:cs.borderLeftWidth,radius:cs.borderRadius,badge:document.querySelectorAll('.side-panel [role="tab"] .tab-n').length}})()`);
    assert(j.shadow === 'none' && j.left === '0px' && j.radius === '0px' && j.badge === 0, 'special ' + JSON.stringify(j));
    await shot('05-special-rows');
    await b.click('[data-fk="tab-technical"]'); await b.wait(400); await waitPanel();
    await shot('06-technical');
  });

  await step('07 Read-only role: lines open, no edit actions', async () => {
    await open('management', '/eq/equipment/' + Q1 + '?panel=spareParts'); await waitViewer(); await waitPanel();
    const pos = await ev(`document.querySelector('#tabpanel li.sp-row').dataset.pos`);
    await b.click(`[data-fk="spare-line-${pos}"]`);
    const r = await ev(`({open:document.querySelector('[data-fk="spare-line-${pos}"]').getAttribute('aria-expanded'),upd:document.querySelectorAll('[data-fk^="update-spare-"]').length})`);
    assert(r.open === 'true' && r.upd === 0, JSON.stringify(r));
  });

  await step('07b Open in Jobs buttons: hidden for Management only, kept for EQ Team and Admin', async () => {
    const jobsBtns = `[...document.querySelectorAll('.side-panel [data-fk^="open-in-jobs-"],.side-panel [data-fk^="jobs-tab-off-"]')].map(e=>e.dataset.fk)`;
    for (const [role, want] of [['management', 0], ['eqTeam', 1], ['admin', 1]]) {
      for (const tab of ['spareParts', 'special']) {
        await open(role, '/eq/equipment/' + Q1 + '?panel=' + tab); await waitViewer(); await waitPanel();
        const got = await ev(jobsBtns);
        assert(got.length === want && (!want || got[0] === 'open-in-jobs-' + tab), role + ' ' + tab + ' ' + JSON.stringify(got));
      }
    }
    await open('management', '/eq/equipment/' + Q1 + '?panel=spareParts'); await waitViewer(); await waitPanel();
    assert(await ev(`!document.querySelector('#tabpanel .stack > .row:empty')`), 'empty footer row left for Management');
    await shot('08-management-no-jobs-button');
  });

  await step('08 Phone width: lines fit, tap target at least 44 px', async () => {
    await b.viewport(390, 844);
    await open('eqTeam', '/eq/equipment/' + Q1 + '?panel=spareParts'); await waitViewer();
    await b.click('[data-fk="open-panel"]'); await b.wait(300); await waitPanel();
    const r = await ev(`(()=>{const l=document.querySelector('#tabpanel .sp-line');const rc=l.getBoundingClientRect();return {h:rc.height,over:l.scrollWidth>l.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth+1}})()`);
    assert(r.h >= 44 && !r.over && !r.page, JSON.stringify(r));
    await shot('07-phone');
    await b.viewport(1500, 920);
  });

  await step('09 No browser errors', async () => { const e = await ev('window.__errs||[]'); assert(!e.length, JSON.stringify(e)); });
} finally {
  fs.writeFileSync(out + '/results.json', JSON.stringify({ check: 'U1-C78', base, at: new Date().toISOString(), results }, null, 2));
  console.log(results.filter((r) => r.pass).length + '/' + results.length + ' passed');
  await b.close();
}
