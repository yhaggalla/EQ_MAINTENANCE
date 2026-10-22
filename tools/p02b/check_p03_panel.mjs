// P02B / U1-C19 checks for the P03 3D viewer page: the right panel has the same four current-state tabs and the same current state as the
// flat view (U1-C08 parity). Needs both servers:
//   node artifacts/prototypes/p02-ui/serve.mjs         (http://127.0.0.1:5312/)
//   node artifacts/prototypes/p03-qc-model/serve.mjs   (http://127.0.0.1:5313/)
// Usage: node tools/p02b/check_p03_panel.mjs [outJson]      Software WebGL (SwiftShader); prototype-level evidence only.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p03/cdp.mjs';

const outFile = process.argv[2] || 'docs/evidence/P02B/p03-panel-checks.json';
const P02 = 'http://127.0.0.1:5312/', P03 = 'http://127.0.0.1:5313/';
const results = [];
const rec = (id, covers, name, ok, detail) => { results.push({ id, covers, name, status: ok ? 'PASS' : 'FAIL', detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '') }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + name + (detail ? ' - ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, ok ? 200 : 700) : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await launch({ gpu: 'swiftshader', port: 9371 });
await b.send('Emulation.setFocusEmulationEnabled', { enabled: true });
{ const rawGoto = b.goto; b.goto = async (u) => { await rawGoto(u); await b.send('Emulation.setFocusEmulationEnabled', { enabled: false }); await b.send('Emulation.setFocusEmulationEnabled', { enabled: true }); }; } // a navigation resets the emulation
const E = (x) => b.eval(x);
const step = async (id, covers, name, fn) => { try { const r = await fn(); rec(id, covers, name, r === true || (r && r.ok), r && r.detail); } catch (e) { rec(id, covers, name, false, 'EXCEPTION ' + e.message); } };
async function openP03(q = '', w = 1920, h = 1080) { await b.viewport(w, h); b.clearEvents(); await b.goto(P03 + q); for (let i = 0; i < 80; i++) { if (await E('!!(window.__qcTiming || window.__qcFallback)')) break; await sleep(250); } await sleep(400); }
const norm = (t) => t.replace(/ZMMS data from \d{2} \w{3} \d{4} \d{2}:\d{2}/g, 'ZMMS data from <t>').replace(/created \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, 'created <t>').replace(/\s+/g, ' ').trim();
const p3text = () => E(`document.querySelector('#info').innerText`);
const p2text = () => E(`document.querySelector('.side-panel .sp-body').innerText`);
const tabs3 = () => E(`[...document.querySelectorAll('#info-tabs [role=tab]')].map(t=>({k:t.dataset.tab, label:t.textContent.replace(/\\d+$/,'').trim(), sel:t.getAttribute('aria-selected'), tab:t.getAttribute('tabindex'), clipped:t.scrollWidth>t.clientWidth+1}))`);

try {
  console.log('Browser:', b.browser);
  // ------------------------------------------------------------------ P3-01 four tabs
  await step('P3-01', ['U1-C19', 'S07', 'U1-C08'], '3D viewer right panel has exactly four tabs (Maintenance, Projects/Special, Technical, Spare parts) in a tablist, default Maintenance, no history anywhere', async () => {
    await openP03('?eq=eq-qc-demo-01'); const t = await tabs3();
    const bad = [];
    for (const q of ['', '&main=mi-q01-01', '&main=mi-q01-01&sub=si-q01-011']) for (const k of ['maintenance', 'special', 'technical', 'spareParts']) {
      await openP03('?eq=eq-qc-demo-01' + q + '&panel=' + k, 1920, 1080); const x = await p3text();
      if (/Completed work|Installation events|Exact-position history|synthetic history|Operational status changes/.test(x)) bad.push(q + '/' + k);
    }
    return { ok: t.map((x) => x.label).join('|') === 'Maintenance|Projects/Special|Technical|Spare parts' && t[0].sel === 'true' && t.every((x) => !x.clipped) && !bad.length && (await E(`document.querySelector('#info-tabs').getAttribute('role')`)) === 'tablist', detail: JSON.stringify({ tabs: t.map((x) => x.label), bad }) };
  });
  // ------------------------------------------------------------------ P3-02 parity with the flat view
  const scopes = [
    ['whole', '', { }, ''],
    ['main 01', '&main=mi-q01-01', { main: 'mi-q01-01' }, ''],
    ['main 02', '&main=mi-q01-02', { main: 'mi-q01-02' }, ''],
    ['sub 011', '&main=mi-q01-01&sub=si-q01-011', { main: 'mi-q01-01', sub: 'si-q01-011' }, ''],
    ['part motor A', null, null, 'hoist.drive.motor.a'],
    ['part motor B', null, null, 'hoist.drive.motor.b'],
    ['part boom rope', null, null, 'boom.rope.set.main'],
  ];
  await step('P3-02', ['U1-C19', 'U1-C08', 'S07', 'HIS06'], 'Flat/3D parity: for 7 selections x the three data tabs the 3D panel shows exactly the same current state as the flat view (ZMMS jobs today, open special jobs, spare-part register rows); counts and flags equal; Technical is the model-derived specification summary', async () => {
    const diffs = [], seen = [];
    for (const [label, q3, p2q, key] of scopes) {
      // P03 selection
      let url3 = '?eq=eq-qc-demo-01', p2sel = { ...(p2q || {}) };
      if (key) {
        await openP03('?eq=eq-qc-demo-01');
        const pid = await E(`window.__qc.binding().get('${key}').positionId`); url3 = '?eq=eq-qc-demo-01&part=' + pid;
        const info = await E(`(()=>{const p=window.__qc.positions().find(p=>p.id==='${pid}'); return [p.mainId, p.subId]})()`); p2sel = { main: info[0], sub: info[1] };
        const p2id = await (async () => { await b.goto(P02 + '?role=management#/eq/fleet'); await sleep(500); return E(`EQ.positionsOf('eq-qc-demo-01').find(p=>p.key==='${key}').id`); })();
        p2sel.part = p2id;
      } else url3 += q3;
      for (const tab of ['maintenance', 'special', 'spareParts']) {
        await openP03(url3 + '&panel=' + tab); const a = norm(await p3text());
        await b.goto(P02 + '?role=management#/eq/equipment/eq-qc-demo-01?' + new URLSearchParams({ ...p2sel, panel: tab }).toString()); await sleep(900); const c = norm(await p2text());
        seen.push(label + '/' + tab + ':' + a.length);
        if (a !== c) { let i = 0; while (i < a.length && a[i] === c[i]) i += 1; diffs.push(label + '/' + tab + ' first difference at char ' + i + '\n  3D: ...' + a.slice(Math.max(0, i - 40), i + 80) + '\n  2D: ...' + c.slice(Math.max(0, i - 40), i + 80)); }
      }
    }
    return { ok: !diffs.length && seen.length === 21, detail: diffs.length ? diffs.slice(0, 2).join('\n') : '21 tab/selection views identical in text; both pages read as Management so the write-only Add job button is absent in both (' + seen.slice(0, 4).join(', ') + ' ...)' };
  });
  await step('P3-03', ['U1-C19', 'S07'], 'The Technical tab of the 3D page is the specification summary of the selected area: part identity, semantic key, binding, provenance, source drawings; mechanism level lists its submechanisms and source-linked parameters; 63 m stays total lift and the 46 / 45.5 m/min conflict stays visible; the machinery house is a spatial group with no tab content', async () => {
    await openP03('?eq=eq-qc-demo-01&panel=technical'); const eqT = await p3text();
    await openP03('?eq=eq-qc-demo-01&main=mi-q01-04&panel=technical'); const m4 = await p3text();
    await openP03('?eq=eq-qc-demo-01'); const pid = await E(`window.__qc.binding().get('hoist.drive.motor.a').positionId`);
    await openP03('?eq=eq-qc-demo-01&part=' + pid + '&panel=technical'); const part = await p3text();
    await openP03('?eq=eq-qc-demo-01&container=machinery-house&panel=special'); const house = await p3text();
    return { ok: /63 m is total lift, not height/.test(eqT) && /Source-linked parameters/.test(eqT) && /conflict/.test(m4) && /46 m\/min/.test(m4) && /45\.5/.test(m4) && /Semantic key/.test(part) && /hoist\.drive\.motor\.a/.test(part) && /exact key/.test(part) && /Sources/.test(part) && /spatial group, not a mechanism/.test(house) && !/Open special jobs/.test(house), detail: JSON.stringify({ eq: eqT.length, m4: /45\.5/.test(m4), part: /Semantic key/.test(part), house: /spatial group/.test(house) }) };
  });
  await step('P3-04', ['U1-C19', 'S16', 'OPS02'], 'Tabs are keyboard-operable in the 3D page (arrows, Home/End, roving tab stop), the active tab is in the URL, and the tree selection is unchanged by tab changes', async () => {
    await openP03('?eq=eq-qc-demo-01&main=mi-q01-01'); await E(`document.querySelector('#info-tabs [data-tab="maintenance"]').focus()`);
    await b.key('ArrowRight'); await sleep(200); const a = await E(`({f:document.activeElement.dataset.tab, sel:document.querySelector('#info-tabs [aria-selected=true]').dataset.tab, url:location.search, tabs:[...document.querySelectorAll('#info-tabs [role=tab]')].map(t=>t.getAttribute('tabindex')).join()})`);
    await b.key('End'); await sleep(200); const e = await E(`({f:document.activeElement.dataset.tab, url:location.search})`); await b.key('Home'); await sleep(200); const h = await E(`({f:document.activeElement.dataset.tab, url:location.search, st:window.__qc.state.main})`);
    await openP03('?eq=eq-qc-demo-01&main=mi-q01-01&panel=spareParts'); const reload = await E(`document.querySelector('#info-tabs [aria-selected=true]').dataset.tab`);
    return { ok: a.f === 'special' && a.sel === 'special' && /panel=special/.test(a.url) && a.tabs === '-1,0,-1,-1' && e.f === 'spareParts' && /panel=spareParts/.test(e.url) && h.f === 'maintenance' && !/panel=/.test(h.url) && h.st === 'mi-q01-01' && reload === 'spareParts', detail: JSON.stringify({ a, e, h, reload }) };
  });
  await step('P3-05', ['U1-C19', 'VIS03', 'S05', 'S07'], 'Selecting in the 3D scene (a real canvas click on a part) updates the panel to that part: scope title, Projects/Special for exactly that position, Spare parts row, tree and URL follow; the tab chosen stays', async () => {
    await openP03('?eq=eq-qc-demo-01&mode=technical&panel=special');
    if (!(await E('!!window.__qc.viewer'))) return { ok: false, detail: 'no WebGL viewer in this browser' };
    await E(`window.__qc.viewer.fitKeys(['hoist.drive.motor.b'])`); for (let i = 0; i < 40; i++) { if (await E('window.__qc.viewer._tween === null')) break; await sleep(100); } await sleep(500);
    const pt = await E(`JSON.stringify(window.__qc.viewer.projectCenter('hoist.drive.motor.b'))`).then(JSON.parse);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y }); await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', buttons: 1, clickCount: 1 }); await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', buttons: 0, clickCount: 1 }); await sleep(900);
    const s = await E('JSON.stringify(window.__qc.state)').then(JSON.parse); const title = await E(`document.querySelector('[data-fk="scope-title"]').textContent`); const sp = await p3text(); const tab = await E(`document.querySelector('#info-tabs [aria-selected=true]').dataset.tab`);
    await E(`document.querySelector('#info-tabs [data-tab="spareParts"]').click()`); await sleep(200); const spare = await p3text();
    const wantJob = await E(`EQ.history('eq-qc-demo-01', {level:'part', id: EQ.positionsOf('eq-qc-demo-01').find(p=>p.key==='hoist.drive.motor.b').id}, false).open.map(r=>r.job.number)`);
    return { ok: !!s.part && /Main hoist motor B/.test(title) && tab === 'special' && wantJob.length === 1 && sp.includes(wantJob[0]) && /Replace main hoist motor B/.test(sp) && /Main hoist motor B/.test(spare) && /Original|Replaced|Not recorded/.test(spare), detail: JSON.stringify({ part: s.part, title, tab, job: wantJob }) };
  });
  await step('P3-06', ['U1-C19', 'S07'], 'Open in Jobs from the 3D page opens the P02 EQ Jobs tab with the same equipment and scope; job numbers link there too', async () => {
    await openP03('?eq=eq-qc-demo-01&main=mi-q01-01&panel=special'); const href = await E(`document.querySelector('[data-fk="open-in-jobs-special"]').href`); const target = await E(`document.querySelector('[data-fk="open-in-jobs-special"]').target`);
    const link = await E(`(document.querySelector('#info .tl a')||{}).href`);
    await b.goto(href); await sleep(900); const t = await E(`document.querySelector('#sh-h') ? document.querySelector('#sh-h').textContent : ''`); const nums = await E(`[...document.querySelectorAll('section[aria-labelledby="sh-h"] .tl a')].map(a=>a.textContent).filter(x=>/^EQJ/.test(x))`);
    return { ok: href.startsWith(P02) && /scope=main/.test(href) && /target=mi-q01-01/.test(href) && target === '_blank' && /\/\?role=eqTeam#\/eq\/jobs\/special\//.test(link || '') && /History of/.test(t) && nums.length >= 2, detail: JSON.stringify({ href, nums }) };
  });
  await step('P3-07', ['U1-C19', 'VIS08', 'S16'], 'Fallbacks keep the four tabs usable: no WebGL (simulated) shows the fallback list and the tabs; the panel needs no WebGL', async () => {
    await openP03('?eq=eq-qc-demo-01&viewer=nowebgl&main=mi-q01-01&panel=special'); const fb = await E(`!document.querySelector('#fallback').hidden`); const t = await tabs3(); const body = await p3text(); const canv = await E(`document.querySelectorAll('canvas').length`);
    await E(`document.querySelector('#info-tabs [data-tab="technical"]').click()`); await sleep(200); const tech = await p3text();
    return { ok: fb && t.length === 4 && /Open special jobs/.test(body) && /Main instance/.test(tech) && canv === 0, detail: JSON.stringify({ fb, tabs: t.length, canv }) };
  });
  await step('P3-08', ['U1-C19', 'OPS02', 'S16'], 'The 3D page panel at 1920x1080, 1366x768, tablet and phone: no horizontal page overflow, tabs visible and unclipped, no console errors', async () => {
    const out = []; let bad = [];
    for (const [w, h] of [[1920, 1080], [1366, 768], [1024, 768], [390, 844]]) {
      await openP03('?eq=eq-qc-demo-01&main=mi-q01-01&panel=spareParts', w, h);
      const r = await E(`({sw:document.scrollingElement.scrollWidth, iw:innerWidth, tabs:[...document.querySelectorAll('#info-tabs [role=tab]')].map(t=>{const r=t.getBoundingClientRect(); return r.width>0 && r.right<=innerWidth+1 && t.scrollWidth<=t.clientWidth+1}), infoVisible:document.querySelector('#info').getBoundingClientRect().width>0})`);
      const errs = b.errors(); out.push([w, r.sw, r.iw, r.tabs.every(Boolean)]);
      if (r.sw > r.iw + 1 || !r.tabs.every(Boolean) || !r.infoVisible || errs.length) bad.push(w + ' ' + JSON.stringify({ r, errs: errs.slice(0, 1) }));
    }
    return { ok: !bad.length, detail: bad.length ? bad.join(' | ') : JSON.stringify(out) };
  });
} finally { /* close below */ }

const failed = results.filter((r) => r.status !== 'PASS').length;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ tool: 'tools/p02b/check_p03_panel.mjs', browser: b.browser, gpu: 'swiftshader (software WebGL)', date: new Date().toISOString(), note: 'Prototype-level checks of the P03 viewer panel against the P02 flat panel; synthetic data.', passed: results.length - failed, failed, results }, null, 2));
console.log(`\n${results.length} checks, ${failed} failed`);
await b.close();
process.exit(failed ? 1 : 0);
