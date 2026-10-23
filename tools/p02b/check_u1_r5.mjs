// U1 round 5 repair checks (U1-C20, U1-C21) against the synthetic P02B prototype (headless Chrome through the DevTools protocol).
// Needs the prototype server on http://127.0.0.1:5312/ (artifacts/prototypes/p02-ui/serve.mjs).
// Usage: node tools/p02b/check_u1_r5.mjs [baseUrl] [outJson] [--only=R5-01,R5-04]
// PROTOTYPE-LEVEL evidence only: synthetic in-memory data, persona switch instead of sign-in, no persistence, no ZMMS contact.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p02/cdp.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const base = args[0] || 'http://127.0.0.1:5312/';
const outFile = args[1] || 'docs/evidence/U1/repair-r5/u1-r5-checks.json';
const results = [];
const rec = (id, ids, name, ok, detail) => { results.push({ id, covers: ids, name, status: ok ? 'PASS' : 'FAIL', detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '') }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + name + (detail ? ' - ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 700) : '')); };
const url = (q, hash) => base + '?' + new URLSearchParams(q).toString() + '#' + hash;
const Q1 = 'eq-qc-demo-01';

const b = await launch({ port: 9374 });
await b.send('Network.enable');
const go = async (role, hash, wait = 600) => { b.clearEvents(); await b.goto(url({ role }, hash)); await b.wait(wait); };
const ev = (expr) => b.eval(expr);
const text = (sel) => b.eval(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const exists = (sel) => b.eval(`!!document.querySelector(${JSON.stringify(sel)})`);
const step = async (id, ids, name, fn) => { if (only.length && !only.some((o) => id.startsWith(o))) return; try { const r = await fn(); rec(id, ids, name, r === true || (r && r.ok), r && r.detail); } catch (e) { rec(id, ids, name, false, 'EXCEPTION ' + e.message); } };
const subtabs = () => ev(`[...document.querySelectorAll('.subtabs a')].map(a=>a.textContent+(a.getAttribute('aria-current')==='page'?'*':'')).join('|')`);
const panel = (q) => ev(`EQ.nav('/eq/equipment/${Q1}', ${JSON.stringify(q)})`);

try {
  console.log('Browser:', b.browser);
  await b.viewport(1920, 1080);

  // ------------------------------------------------------------- U1-C20: four EQ Jobs tabs
  await step('R5-01', ['U1-C20', 'S08', 'ZM07', 'HIS06'], 'EQ Jobs has four tabs - Special/Projects, Daily work (CMMS), EQ status, Spare parts condition; Special/Projects holds the special jobs only, Daily work (CMMS) holds the read-only ZMMS daily jobs only with "ZMMS data from", default today, earlier days by From/To; shared filters carry across the tabs', async () => {
    await go('eqTeam', '/eq/jobs/special', 800);
    const navS = await subtabs();
    const sp = { board: await exists('.job'), daily: await exists('#daily'), dailyTable: await exists('.daily-table'), heading: await ev(`[...document.querySelectorAll('h2')].map(h=>h.textContent).join('|')`) };
    await go('eqTeam', '/eq/jobs/daily', 800);
    const navD = await subtabs();
    const d = { board: await exists('.job'), daily: await exists('#daily'), fresh: await text('#daily'), ro: await ev(`document.querySelectorAll('#daily .daily-table input, #daily .daily-table select, #daily .daily-table textarea, #daily .daily-table button').length`), rows: await ev(`[...document.querySelectorAll('.daily-table tbody tr')].map(r=>r.dataset.zjob)`), addJob: await exists('[data-fk="add-job"]') };
    const wantToday = await ev(`EQ.state.D.zmms.jobs.filter(j=>j.match==='matched' && j.date===EQ.todayColombo()).length`);
    await go('eqTeam', `/eq/jobs/daily?equipment=${Q1}&from=2000-01-01&to=2999-01-01`, 700);
    const days = await ev(`new Set([...document.querySelectorAll('.daily-table tbody tr td:first-child')].map(t=>t.textContent)).size`);
    const carry = await ev(`[...document.querySelectorAll('.subtabs a')].every(a=>a.getAttribute('href').includes('equipment=${Q1}'))`);
    const unmatched = await ev(`EQ.state.D.zmms.jobs.filter(j=>j.match!=='matched').map(j=>j.jobNo)`); const listed = await ev(`EQ.dailyRows({from:'2000-01-01',to:'2999-01-01'}).map(j=>j.jobNo)`);
    await go('management', '/eq/jobs/daily', 700); const mgmt = { rows: await ev(`document.querySelectorAll('.daily-table tbody tr').length`), buttons: await ev(`document.querySelectorAll('#daily button:not([data-fk^="export"])').length`) };
    const ok = navS === 'Special/Projects*|Daily work (CMMS)|EQ status|Spare parts condition' && navD === 'Special/Projects|Daily work (CMMS)*|EQ status|Spare parts condition'
      && sp.board && !sp.daily && !sp.dailyTable && /Special jobs/.test(sp.heading)
      && !d.board && d.daily && /ZMMS data from \d/.test(d.fresh) && d.ro === 0 && d.rows.length === wantToday && !d.addJob
      && days >= 3 && carry && !unmatched.some((n) => listed.includes(n)) && mgmt.rows === wantToday && mgmt.buttons === 0;
    return { ok, detail: { navS, navD, special: sp, daily: { ...d, fresh: d.fresh.slice(0, 60), rows: d.rows.length }, wantToday, days, carry, mgmt } };
  });
  await step('R5-02', ['U1-C20', 'U1-C19', 'S07'], 'Crane view links follow the split: Maintenance "Open in Jobs" opens Daily work (CMMS) for the equipment and today; Projects/Special opens Special/Projects with the scope; the legacy /eq/jobs route still lands on Special/Projects', async () => {
    await go('eqTeam', `/eq/equipment/${Q1}?panel=maintenance`, 700);
    const m = await ev(`(document.querySelector('[data-fk="open-in-jobs-maintenance"]')||{}).getAttribute?.('href')||''`);
    await panel({ main: 'mi-q01-01', panel: 'special' }); await b.wait(500);
    const s = await ev(`(document.querySelector('[data-fk="open-in-jobs-special"]')||{}).getAttribute?.('href')||''`);
    await go('eqTeam', '/eq/jobs', 600); const legacy = await ev('location.hash');
    const t = await ev('EQ.todayColombo()');
    return { ok: m.startsWith('#/eq/jobs/daily?') && m.includes('equipment=' + Q1) && m.includes('from=' + t) && m.includes('to=' + t) && s.startsWith('#/eq/jobs/special?') && /scope=main/.test(s) && legacy.startsWith('#/eq/jobs/special'), detail: { maintenance: m, special: s, legacy } };
  });

  // ------------------------------------------------------------- U1-C21 (a): Add special job
  await step('R5-03', ['U1-C21', 'S09', 'S07', 'JOB01'], 'Writers see "Add special job" in Special/Projects and in the crane view (whole equipment and any selection), pre-filled with the equipment and the selected mechanism/part; the job is created and appears as open; Management and FAC Team see no add action', async () => {
    await go('eqTeam', '/eq/jobs/special', 700);
    const tabBtn = await text('[data-fk="add-job"]');
    await go('eqTeam', `/eq/equipment/${Q1}?panel=special`, 700);
    const wholeBtn = await text('[data-fk="add-for-sel"]');
    await b.click('[data-fk="add-for-sel"]'); await b.wait(300);
    const wholePre = await ev(`({eq:(document.querySelector('#jf-equipment')||{}).value, level:(document.querySelector('input[name="jf-level"]:checked')||{}).value, title:(document.getElementById('dlg-title')||{}).textContent})`);
    await b.key('Escape'); await b.wait(300);
    await panel({ main: 'mi-q01-01', sub: 'si-q01-011', part: 'pp-q01-007', panel: 'special' }); await b.wait(600);
    await b.click('[data-fk="add-for-sel"]'); await b.wait(300);
    const partPre = await ev(`({eq:(document.querySelector('#jf-equipment')||{}).value, level:(document.querySelector('input[name="jf-level"]:checked')||{}).value, part:(document.querySelector('#jf-part')||{}).value})`);
    const open0 = await ev(`EQ.currentSpecial('${Q1}',{level:'part',id:'pp-q01-007'}).openJobs.length`);
    await b.click('#jf-kind-repair'); await b.setValue('#jf-title', 'Inspect hoist motor coupling (check R5-03)'); await b.click('dialog button[type="submit"]'); await b.wait(700);
    const created = await ev(`(()=>{const j=EQ.state.D.jobs.find(x=>x.title==='Inspect hoist motor coupling (check R5-03)'); return j?{level:j.level, positionId:j.positionId, eq:j.equipmentId, status:j.workStatus}:null})()`);
    const open1 = await ev(`EQ.currentSpecial('${Q1}',{level:'part',id:'pp-q01-007'}).openJobs.length`);
    const shown = await ev(`/Inspect hoist motor coupling/.test(document.querySelector('.side-panel .sp-body').textContent)`);
    const ro = {};
    for (const role of ['management', 'facTeam']) {
      await go(role, '/eq/jobs/special', 600); const a = await exists('[data-fk="add-job"]');
      await go(role, `/eq/equipment/${Q1}?main=mi-q01-01&panel=special`, 600); ro[role] = { tab: a, crane: await exists('[data-fk="add-for-sel"]') };
    }
    await go('admin', `/eq/equipment/${Q1}?panel=special`, 600); const adminBtn = await exists('[data-fk="add-for-sel"]');
    const ok = /Add special job/.test(tabBtn) && /Add special job/.test(wholeBtn) && wholePre.eq === Q1 && wholePre.level === 'equipment' && /Add special job/.test(wholePre.title)
      && partPre.eq === Q1 && partPre.level === 'part' && partPre.part === 'pp-q01-007' && created && created.level === 'part' && created.positionId === 'pp-q01-007' && created.eq === Q1 && open1 === open0 + 1 && shown
      && Object.values(ro).every((r) => !r.tab && !r.crane) && adminBtn;
    return { ok, detail: { tabBtn, wholeBtn, wholePre, partPre, created, open0, open1, shown, readOnly: ro, adminBtn } };
  });

  // ------------------------------------------------------------- U1-C21 (b): Add spare part (command rules)
  await step('R5-04', ['U1-C21', 'S22', 'SP01', 'SP04', 'ACC03', 'AUTH03'], 'Add spare part (simulated server): EQ Team and Admin add a non-designated active position with type, condition, date, brand and expected life; the entry starts its history (source registerAdd); Management and FAC Team are refused (403); duplicates, inactive positions, future dates, invalid life, unknown type and Original over recorded history are refused and save nothing; Admin-only designation settings stay Admin-only', async () => {
    await go('eqTeam', '/eq/jobs/spare-parts', 700);
    const r = await ev(`(()=>{const P=EQ.spares, D=EQ.state.D; const out={};
      const free=(eqId)=>EQ.positionsOf(eqId).filter(p=>p.state==='active' && !P.isMajor(p.id) && !D.events.some(e=>e.positionId===p.id && !e.voided));
      const f1=free('${Q1}'); const a=f1[0], bpos=f1[1];
      const snap=()=>JSON.stringify([D.spare.designated, D.events.length, D.spare.history.length]);
      const role=(r)=>{EQ.state.role=r; EQ.access.refreshSession('check');};
      const today=EQ.todayColombo(), past=EQ.shiftDay(today,-200);
      role('management'); let s0=snap(); out.mgmt=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',condition:'replaced',replacedOn:past,desc:'x'}); out.mgmtNothing=snap()===s0;
      role('facTeam'); s0=snap(); out.fac=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',condition:'replaced',replacedOn:past,desc:'x'}); out.facNothing=snap()===s0;
      role('eqTeam');
      s0=snap();
      out.future=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',condition:'replaced',replacedOn:EQ.shiftDay(today,2),desc:'Motor'});
      out.life=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',lifeMonths:'0',condition:'original',desc:'Motor'});
      out.type=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-nope',condition:'original',desc:'Motor'});
      out.noCond=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',condition:'',desc:'Motor'});
      out.badNothing=snap()===s0;
      const add=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',lifeMonths:'84',condition:'replaced',replacedOn:past,desc:'Coupling motor (check R5-04)',brand:'CheckBrand',model:'CB-1',serial:'CB-0001',remarks:'added by EQ Team'});
      const row=P.row(a.id); const h=P.history(a.id);
      out.add={ok:add.ok, major:P.isMajor(a.id), cond:row.condition, on:row.replacedOn===past, brand:row.brand, life:row.lifeMonths, lifeSource:row.lifeSource, predicted:row.predicted, inRegister:P.rows('${Q1}').some(x=>x.posId===a.id), hist:h.length, src:h[0]&&h[0].source, before:h[0]&&h[0].before, by:h[0]&&h[0].by, remarks:row.remarks};
      s0=snap(); out.dup=P.add({equipmentId:'${Q1}',posId:a.id,typeId:'spt-hoist-motor',condition:'original',desc:'again'}); out.dupNothing=snap()===s0;
      // Original at a position that already has installation history -> 409; keeping the recorded installation is allowed
      const withHist=EQ.positionsOf('${Q1}').find(p=>p.state==='active' && !P.isMajor(p.id) && D.events.some(e=>e.positionId===p.id && !e.voided));
      out.histPos=!!withHist;
      if(withHist){ s0=snap(); out.orig=P.add({equipmentId:'${Q1}',posId:withHist.id,typeId:'spt-hoist-brake',condition:'original',desc:'Brake'}); out.origNothing=snap()===s0;
        const keep=P.add({equipmentId:'${Q1}',posId:withHist.id,typeId:'spt-hoist-brake',condition:''}); out.keep={ok:keep.ok, cond:P.row(withHist.id).condition, hist:P.history(withHist.id)[0].source}; }
      const draft=D.positions.find(p=>p.state!=='active'); if(draft){ s0=snap(); out.draft=P.add({equipmentId:draft.equipmentId,posId:draft.id,typeId:'spt-hoist-motor',condition:'original',desc:'x'}); out.draftNothing=snap()===s0; }
      out.wrongEq=P.add({equipmentId:'eq-qc-demo-02',posId:bpos.id,typeId:'spt-hoist-motor',condition:'original',desc:'x'});
      out.designateStillAdmin=P.designate(bpos.id,{on:true,typeId:'spt-hoist-motor'}).status;
      role('admin'); const adm=P.add({equipmentId:'${Q1}',posId:bpos.id,typeId:'spt-trolley-wheel',condition:'original',desc:'Wheel (check R5-04)'}); out.admin={ok:adm.ok, cond:P.row(bpos.id).condition, life:P.row(bpos.id).lifeMonths, lifeSource:P.row(bpos.id).lifeSource, src:P.history(bpos.id)[0].source};
      const st=(x)=>x&&[x.status,x.code];
      return {mgmt:st(out.mgmt), mgmtNothing:out.mgmtNothing, fac:st(out.fac), facNothing:out.facNothing, future:[out.future.status, Object.keys(out.future.fields||{})], life:[out.life.status, Object.keys(out.life.fields||{})], type:[out.type.status, Object.keys(out.type.fields||{})], noCond:[out.noCond.status, Object.keys(out.noCond.fields||{})], badNothing:out.badNothing, add:out.add, dup:st(out.dup), dupNothing:out.dupNothing, histPos:out.histPos, orig:st(out.orig), origNothing:out.origNothing, keep:out.keep, draft:st(out.draft), draftNothing:out.draftNothing, wrongEq:st(out.wrongEq), designateStillAdmin:out.designateStillAdmin, admin:out.admin};})()`);
    const ok = r.mgmt[0] === 403 && r.mgmt[1] === 'forbidden_role' && r.mgmtNothing && r.fac[0] === 403 && r.facNothing
      && r.future[0] === 422 && r.future[1].includes('replacedOn') && r.life[0] === 422 && r.life[1].includes('lifeMonths') && r.type[0] === 422 && r.type[1].includes('typeId') && r.noCond[0] === 422 && r.noCond[1].includes('condition') && r.badNothing
      && r.add.ok && r.add.major && r.add.cond === 'replaced' && r.add.on && r.add.brand === 'CheckBrand' && r.add.life === 84 && r.add.lifeSource === 'override' && !!r.add.predicted && r.add.inRegister && r.add.hist === 1 && r.add.src === 'registerAdd' && r.add.before === null && r.add.by === 'u-eq-a' && r.add.remarks === 'added by EQ Team'
      && r.dup[0] === 409 && r.dup[1] === 'already_major_spare_part' && r.dupNothing
      && (!r.histPos || (r.orig[0] === 409 && r.orig[1] === 'position_has_installation_history' && r.origNothing && r.keep.ok && r.keep.cond && r.keep.hist === 'registerAdd'))
      && (!r.draft || (r.draft[0] === 422 && r.draft[1] === 'position_not_active' && r.draftNothing)) && r.wrongEq[0] === 422 && r.wrongEq[1] === 'target_not_in_equipment'
      && r.designateStillAdmin === 403 && r.admin.ok && r.admin.cond === 'original' && r.admin.life === 60 && r.admin.lifeSource === 'type' && r.admin.src === 'registerAdd';
    return { ok, detail: r };
  });

  // ------------------------------------------------------------- U1-C21 (b): Add spare part (screens)
  await step('R5-05', ['U1-C21', 'S22', 'SP04', 'S07'], 'Spare parts condition tab: "Add spare part" for EQ Team and Admin opens a form (equipment, main, sub, position, type, condition, date, brand, expected life); saving adds the row with its first history entry; the crane-view Spare parts tab offers the same action pre-filled with the selection (a non-designated part is pre-selected); Management sees neither', async () => {
    await go('eqTeam', `/eq/jobs/spare-parts?equipment=${Q1}`, 800);
    const btn = await text('[data-fk="add-spare"]');
    await b.click('[data-fk="add-spare"]'); await b.wait(300);
    const title = await text('#dlg-title'); const fields = await ev(`['as-eq','as-main','as-sub','as-pos','as-type','as-cond-original','as-cond-replaced','as-brand','as-life'].filter(id=>!document.getElementById(id))`);
    const eqPre = await ev(`(document.getElementById('as-eq')||{}).value`);
    // pick the first offered position, condition Replaced with a past date
    const pick = await ev(`(()=>{const s=document.getElementById('as-pos'); const o=[...s.options].find(x=>x.value); return o?o.value:null})()`);
    await b.setValue('#as-pos', pick); await b.wait(200);
    await b.setValue('#as-type', 'spt-hoist-motor'); await b.wait(200);
    await b.click('#as-cond-replaced'); await b.wait(200);
    const past = await ev(`EQ.shiftDay(EQ.todayColombo(),-30)`);
    await b.setValue('#as-date', past); await b.setValue('#as-brand', 'FormBrand'); await b.setValue('#as-life', '48'); await b.setValue('#as-desc', 'Item added from the form (check R5-05)');
    await b.click('dialog button[type="submit"]'); await b.wait(700);
    const saved = await ev(`(()=>{const id=${JSON.stringify(pick)}; if(!EQ.spares.isMajor(id)) return null; const r=EQ.spares.row(id); return {cond:r.condition, brand:r.brand, life:r.lifeMonths, on:r.replacedOn, hist:EQ.spares.history(id).map(h=>h.source)}})()`);
    const inTable = await ev(`!!document.querySelector('.spare-table tr[data-pos=${JSON.stringify(pick)}]')`);
    const dialogGone = !(await exists('dialog[open]'));
    // crane view: non-designated part pre-selected
    const freePart = await ev(`(()=>{const p=EQ.positionsOf('${Q1}').find(p=>p.state==='active' && !EQ.spares.isMajor(p.id)); return p?{id:p.id, main:p.mainId, sub:p.subId}:null})()`);
    await panel({ main: freePart.main, sub: freePart.sub, part: freePart.id, panel: 'spareParts' }); await b.wait(600);
    const cranePart = { text: await text('.side-panel .sp-body'), btn: await exists('[data-fk="add-spare"]') };
    await b.click('[data-fk="add-spare"]'); await b.wait(300);
    const cranePre = await ev(`({eq:(document.getElementById('as-eq')||{}).value, main:(document.getElementById('as-main')||{}).value, sub:(document.getElementById('as-sub')||{}).value, pos:(document.getElementById('as-pos')||{}).value})`);
    await b.key('Escape'); await b.wait(300);
    const dialogClosed = !(await exists('dialog[open]'));
    await panel({ panel: 'spareParts' }); await b.wait(500); const craneWhole = await exists('[data-fk="add-spare"]');
    await go('admin', `/eq/jobs/spare-parts`, 600); const adminBtn = await exists('[data-fk="add-spare"]');
    await go('management', `/eq/jobs/spare-parts`, 600); const mTab = await exists('[data-fk="add-spare"]');
    await go('management', `/eq/equipment/${Q1}?panel=spareParts`, 600); const mCrane = await exists('[data-fk="add-spare"]');
    const ok = /Add spare part/.test(btn) && /Add spare part/.test(title) && fields.length === 0 && eqPre === Q1 && !!pick && saved && saved.cond === 'replaced' && saved.brand === 'FormBrand' && saved.life === 48 && saved.on === past && saved.hist.length === 1 && saved.hist[0] === 'registerAdd' && inTable && dialogGone
      && /Not a major spare part/.test(cranePart.text) && cranePart.btn && cranePre.eq === Q1 && cranePre.main === freePart.main && cranePre.sub === freePart.sub && cranePre.pos === freePart.id && craneWhole && dialogClosed && adminBtn && !mTab && !mCrane;
    return { ok, detail: { btn, title, missingFields: fields, eqPre, pick, saved, inTable, dialogGone, cranePart: { btn: cranePart.btn, notMajor: /Not a major spare part/.test(cranePart.text) }, cranePre, freePart, dialogClosed, craneWhole, adminBtn, mgmt: { tab: mTab, crane: mCrane } } };
  });
  await step('R5-06', ['U1-C21', 'S19', 'ACC01'], 'Access matrix wording follows U1-C21: the EQ work row names adding spare parts (EQ Team and Admin fixed, FAC Team and Management not allowed); the Admin row keeps spare-part types and expected-life settings; no console errors on the changed screens', async () => {
    await go('admin', '/admin/access', 700);
    const t = await text('main');
    const ceil = await ev(`EQ.access.CEIL['eq.work']`);
    const errs = [];
    for (const [role, hash] of [['eqTeam', '/eq/jobs/special'], ['eqTeam', '/eq/jobs/daily'], ['eqTeam', '/eq/jobs/spare-parts'], ['eqTeam', `/eq/equipment/${Q1}?panel=spareParts`], ['admin', '/admin/eq/spare-parts']]) { await go(role, hash, 500); errs.push(...b.errors().map((e) => hash + ': ' + String(e).slice(0, 160))); }
    const adm = await text('main');
    return { ok: /add spare parts/i.test(t) && ceil.eqTeam === 'F' && ceil.admin === 'F' && ceil.facTeam === 'N' && ceil.management === 'N' && /EQ Team and Admin add/i.test(adm) && !errs.length, detail: { ceil, adminNote: (adm.match(/EQ Team and Admin add[^.]*\./i) || [''])[0], errs } };
  });

  // ------------------------------------------------------------- U1-C22: Admin add/adjust in EQ settings
  const asRole = (r) => `EQ.state.role=${JSON.stringify(r)}; EQ.access.refreshSession('check');`;
  await step('R5-07', ['U1-C22', 'SRC01', 'SRC02', 'SRC03', 'ADM04', 'ACC03'], 'Mechanism catalogue (simulated server): Admin adds main and sub mechanisms with new string codes and edits names/descriptions with audit and prior values kept; main 10, duplicates, wrong code format and inactive parents are refused; 061 Spreader / 062 Headblock names are fixed; reserved 048/063 stay reserved; EQ Team and Management get 403; a fixtures reset restores the approved 16/43 catalogue', async () => {
    await go('admin', '/admin/eq/catalog', 700);
    const btns = { main: await exists('[data-fk="cat-add-main"]'), sub: await exists('[data-fk="cat-add-sub"]'), edit: await exists('[data-fk="cat-edit-011"]'), lock: await ev(`!!document.querySelector('tr[data-code="061"] .lock')`) };
    const r = await ev(`(()=>{const A=EQ.api, out={}; const st=(x)=>x&&[x.status,x.code];
      const before=JSON.stringify(EQ.catalog);
      ${asRole('eqTeam')} out.eqTeam=st(A.addMainDef({code:'18',name:'x'})); ${asRole('management')} out.mgmt=st(A.addSubDef({main:'01',code:'019',name:'x'})); out.mgmtEdit=st(A.editDef('011',{name:'x'}));
      out.unchanged=JSON.stringify(EQ.catalog)===before;
      ${asRole('admin')}
      out.ten=st(A.addMainDef({code:'10',name:'Main ten'})); out.dupMain=st(A.addMainDef({code:'01',name:'Again'})); out.badMain=[A.addMainDef({code:'7',name:'x'}).status, Object.keys(A.addMainDef({code:'7',name:'x'}).fields)];
      out.noName=Object.keys(A.addMainDef({code:'18',name:''}).fields);
      out.unchanged2=JSON.stringify(EQ.catalog)===before;
      const m=A.addMainDef({code:'18',name:'Shore power (check R5-07)',description:'Admin-added main',reason:'check'}); out.addMain=m.ok && EQ.mainDef('18').origin==='admin' && typeof EQ.mainDef('18').code==='string';
      const s=A.addSubDef({main:'18',code:'181',name:'Shore power cabinet (check R5-07)',description:'Admin-added sub'}); out.addSub=s.ok && EQ.subDef('181').main==='18' && EQ.subDef('181').active;
      out.dupSub=st(A.addSubDef({main:'01',code:'011',name:'x'})); out.wrongPrefix=Object.keys(A.addSubDef({main:'18',code:'191',name:'x'}).fields||{});
      A.setCatalogActive('18',false); out.inactiveParent=st(A.addSubDef({main:'18',code:'182',name:'x'})); A.setCatalogActive('18',true);
      out.lock=st(A.editDef('061',{name:'Lifting frame'})); out.lockDesc=A.editDef('061',{name:'Spreader',description:'Spreader assembly (check R5-07)'}).ok && EQ.subDef('061').name==='Spreader';
      out.reserved=st(A.editDef('048',{name:'x'})); out.reservedStill=EQ.subDef('048').reserved && !EQ.subDef('048').active;
      const e=A.editDef('011',{name:'Hoist drive (check R5-07)',description:'edited',reason:'check'}); out.rename=e.ok && EQ.subDef('011').name==='Hoist drive (check R5-07)' && EQ.subDef('011').code==='011' && EQ.subDef('011').main==='01' && EQ.subDef('011').sourceName==='Hoist';
      const log=EQ.state.D.catalogLog; const l011=log.find(x=>x.code==='011'&&x.action==='edited'); out.logPrior=l011&&l011.before.name==='Hoist'&&l011.after.name==='Hoist drive (check R5-07)';
      out.audit=EQ.state.D.audit.filter(x=>/^catalog\\./.test(x.action)).map(x=>x.action);
      out.counts={main:EQ.catalog.mains.filter(x=>x.origin!=='admin').length, sub:EQ.catalog.subs.filter(x=>x.origin!=='admin').length, total:[EQ.catalog.mains.length,EQ.catalog.subs.length], ten:!!EQ.mainDef('10')};
      return out;})()`);
    await ev(`EQ.rerender()`); await b.wait(300);
    const screen = { block18: await ev(`!!document.querySelector('[data-main="18"]') && /Added by Admin/.test(document.querySelector('[data-main="18"]').textContent)`), row181: await exists('tr[data-code="181"]'), log: /Catalogue changes/.test(await text('main')) };
    // the form path: add a main mechanism through the dialog
    await b.click('[data-fk="cat-add-main"]'); await b.wait(300);
    const dlgTitle = await text('#dlg-title');
    await b.setValue('#am-code', '19'); await b.setValue('#am-name', 'Form main (check R5-07)'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const formAdded = await ev(`!!EQ.mainDef('19') && !!document.querySelector('[data-main="19"]') && !document.querySelector('dialog[open]')`);
    await b.click('[data-fk="cat-add-main"]'); await b.wait(300); await b.setValue('#am-code', '10'); await b.setValue('#am-name', 'Ten'); await b.click('dialog button[type="submit"]'); await b.wait(300);
    const formRefusal = await ev(`(document.querySelector('dialog[open] [data-fk-note="refusal"]')||{}).textContent||''`); await b.key('Escape'); await b.wait(200);
    const reset = await ev(`(()=>{EQ.reset(); const c=EQ.catalog; return {m:c.mains.length, s:c.subs.length, active:c.subs.filter(x=>x.active).length, n061:EQ.subDef('061').name, n062:EQ.subDef('062').name, n011:EQ.subDef('011').name, ten:!!EQ.mainDef('10'), r048:EQ.subDef('048').reserved && !EQ.subDef('048').active, r063:EQ.subDef('063').reserved}})()`);
    const ok = btns.main && btns.sub && btns.edit && btns.lock
      && r.eqTeam[0] === 403 && r.mgmt[0] === 403 && r.mgmtEdit[0] === 403 && r.unchanged
      && r.ten[0] === 422 && r.ten[1] === 'code_unassigned_reserved' && r.dupMain[0] === 409 && r.dupMain[1] === 'duplicate_code' && r.badMain[0] === 422 && r.badMain[1].includes('code') && r.noName.includes('name') && r.unchanged2
      && r.addMain && r.addSub && r.dupSub[0] === 409 && r.wrongPrefix.includes('code') && r.inactiveParent[0] === 422 && r.inactiveParent[1] === 'parent_inactive'
      && r.lock[0] === 409 && r.lock[1] === 'approved_name_locked' && r.lockDesc && r.reserved[0] === 422 && r.reservedStill && r.rename && r.logPrior
      && r.audit.includes('catalog.main.add') && r.audit.includes('catalog.sub.add') && r.audit.includes('catalog.sub.edit')
      && r.counts.main === 16 && r.counts.sub === 43 && !r.counts.ten && screen.block18 && screen.row181 && screen.log && /Add main mechanism/.test(dlgTitle) && formAdded && /code_unassigned_reserved/.test(formRefusal)
      && reset.m === 16 && reset.s === 43 && reset.active === 41 && reset.n061 === 'Spreader' && reset.n062 === 'Headblock' && reset.n011 === 'Hoist' && !reset.ten && reset.r048 && reset.r063;
    return { ok, detail: { btns, r, screen, dlgTitle, formAdded, formRefusal: formRefusal.slice(0, 120), reset } };
  });

  await step('R5-08', ['U1-C22', 'ADM02', 'ADM03', 'HIS01', 'VIS05'], 'Main-part positions (simulated server): Admin adds a DRAFT position to one equipment (other QC unchanged) and edits name, kind, parent mechanism and binding key while draft; after confirmation the key and parent are frozen (409 position_key_frozen / ancestors_frozen), kind is frozen once history exists (409 history_exists), the name stays editable with audit; bad keys, duplicate keys and container. keys are refused; EQ Team gets 403; the form adds a draft row', async () => {
    await go('admin', `/admin/eq/positions?equipment=${Q1}`, 700);
    const addBtn = await exists('[data-fk="pos-add"]');
    const r = await ev(`(()=>{const A=EQ.api, out={}; const st=(x)=>x&&[x.status,x.code]; const eq=EQ.eq('${Q1}'); const s011=eq.subs.find(s=>s.code==='011'), s012=eq.subs.find(s=>s.code==='012')||eq.subs.find(s=>s.code!=='011');
      const n2=EQ.positionsOf('eq-qc-demo-02').length;
      ${asRole('eqTeam')} out.eqTeam=st(A.addPosition('${Q1}',{name:'x',key:'hoist.drive.motor.z',subId:s011.id,kind:'serialized'})); ${asRole('admin')}
      out.badKey=Object.keys(A.addPosition('${Q1}',{name:'Bad key',key:'Hoist Motor',subId:s011.id,kind:'serialized'}).fields);
      out.container=Object.keys(A.addPosition('${Q1}',{name:'Container',key:'container.machinery-house',subId:s011.id,kind:'serialized'}).fields);
      out.dupKey=st(A.addPosition('${Q1}',{name:'Dup',key:'hoist.drive.motor.a',subId:s011.id,kind:'serialized'}));
      out.lotNoUom=Object.keys(A.addPosition('${Q1}',{name:'Lot',key:'hoist.drive.lot.c',subId:s011.id,kind:'quantityLot',uom:''}).fields);
      const a=A.addPosition('${Q1}',{name:'Hoist motor C (check R5-08)',key:'hoist.drive.motor.c',subId:s011.id,kind:'serialized',source:'J526A0300 p1'}); const p=a.position;
      out.added={ok:a.ok, state:p&&p.state, eq:p&&p.equipmentId, main:p&&p.mainId===s011.mainId, origin:p&&p.origin, other:EQ.positionsOf('eq-qc-demo-02').length===n2};
      const ed=A.editPosition(p.id,{name:'Hoist motor C, renamed',key:'hoist.drive.motor.c2',subId:s012.id,kind:'quantityLot',uom:'set'}); out.draftEdit={ok:ed.ok, key:p.key, sub:p.subId===s012.id, main:p.mainId===s012.mainId, kind:p.kind, uom:p.uom};
      A.confirmPositions('${Q1}',[p.id]); out.confirmed=p.state;
      out.keyFrozen=st(A.editPosition(p.id,{key:'hoist.drive.motor.c3'})); out.subFrozen=st(A.editPosition(p.id,{subId:s011.id}));
      out.kindNoHist=A.editPosition(p.id,{kind:'serialized'}).ok && p.kind==='serialized';
      out.rename=A.editPosition(p.id,{name:'Hoist motor C (confirmed)'}).ok && p.name==='Hoist motor C (confirmed)' && p.key==='hoist.drive.motor.c2';
      const withHist=EQ.positionsOf('${Q1}').find(x=>x.state==='active' && EQ.posHasHistory(x));
      out.histKind=st(A.editPosition(withHist.id,{kind:withHist.kind==='serialized'?'quantityLot':'serialized',uom:'set'}));
      out.histRename=A.editPosition(withHist.id,{name:withHist.name+' (renamed)'}).ok;
      const log=(EQ.state.D.positionLog||[]).filter(x=>x.posId===p.id); out.log=log.map(x=>x.action); out.logPrior=log.some(x=>x.before&&x.before.key==='hoist.drive.motor.c');
      out.audit=EQ.state.D.audit.filter(x=>/^position\\./.test(x.action)).map(x=>x.action);
      return out;})()`);
    await ev(`EQ.rerender()`); await b.wait(300);
    const rowShown = await ev(`[...document.querySelectorAll('main tbody tr')].some(tr=>/Hoist motor C \\(confirmed\\)/.test(tr.textContent) && /Added by Admin/.test(tr.textContent))`);
    await b.click('[data-fk="pos-add"]'); await b.wait(300);
    const fields = await ev(`['pf-name','pf-sub','pf-key','pf-kind-serialized','pf-kind-quantityLot','pf-src'].filter(id=>!document.getElementById(id))`);
    const subOpt = await ev(`[...document.getElementById('pf-sub').options].find(o=>o.value).value`);
    await b.setValue('#pf-name', 'Form position (check R5-08)'); await b.setValue('#pf-sub', subOpt); await b.setValue('#pf-key', 'hoist.drive.form.check'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const formAdded = await ev(`(()=>{const p=EQ.positionsOf('${Q1}').find(x=>x.key==='hoist.drive.form.check'); return p?{state:p.state, row:[...document.querySelectorAll('main tbody tr')].some(tr=>/Form position/.test(tr.textContent)), open:!!document.querySelector('dialog[open]')}:null})()`);
    const editBtn = await ev(`!!document.querySelector('[data-fk^="pos-edit-pp-q01-"]')`);
    const ok = addBtn && r.eqTeam[0] === 403 && r.badKey.includes('key') && r.container.includes('key') && r.dupKey[0] === 409 && r.dupKey[1] === 'duplicate_semantic_key' && r.lotNoUom.includes('uom')
      && r.added.ok && r.added.state === 'draft' && r.added.eq === Q1 && r.added.main && r.added.origin === 'admin' && r.added.other
      && r.draftEdit.ok && r.draftEdit.key === 'hoist.drive.motor.c2' && r.draftEdit.sub && r.draftEdit.main && r.draftEdit.kind === 'quantityLot' && r.draftEdit.uom === 'set'
      && r.confirmed === 'active' && r.keyFrozen[0] === 409 && r.keyFrozen[1] === 'position_key_frozen' && r.subFrozen[0] === 409 && r.subFrozen[1] === 'ancestors_frozen' && r.kindNoHist && r.rename
      && r.histKind[0] === 409 && r.histKind[1] === 'history_exists' && r.histRename && r.log.includes('added') && r.log.includes('edited') && r.logPrior && r.audit.includes('position.add') && r.audit.includes('position.edit')
      && rowShown && fields.length === 0 && formAdded && formAdded.state === 'draft' && formAdded.row && !formAdded.open && editBtn;
    return { ok, detail: { addBtn, r, rowShown, missingFields: fields, formAdded, editBtn } };
  });

  await step('R5-09', ['U1-C22', 'ADM06', 'SRC05', 'S14'], 'Specifications (simulated server): Admin adds a specification row with value, unit and source (labelled Admin-entered, no drawing observation) and edits it with the prior definition kept; records new values on drawing rows with the prior value kept and observations unchanged; drawing definitions cannot be edited (409); a missing source or duplicate name is refused; EQ Team gets 403; the new row shows in the Technical tab of its mechanism', async () => {
    await go('admin', '/admin/eq/parameters', 700);
    const addBtn = await exists('[data-fk="spec-add"]'); const setBtn = await exists('[data-fk="spec-val-rail-gauge"]');
    const r = await ev(`(()=>{const A=EQ.api, out={}; const st=(x)=>x&&[x.status,x.code];
      ${asRole('eqTeam')} out.eqTeam=st(A.addSpec({label:'x',value:'1',use:'technical',source:'s'})); out.eqTeamVal=st(A.resolveParameter('rail-gauge','30','x')); ${asRole('admin')}
      out.noSource=Object.keys(A.addSpec({label:'Hoist brake torque (check R5-09)',value:'1200',unit:'Nm',use:'technical',mainCode:'01'}).fields);
      const a=A.addSpec({label:'Hoist brake torque (check R5-09)',value:'1200',unit:'Nm',use:'technical',mainCode:'01',source:'OEM manual s4 p12 (synthetic)'}); out.add={ok:a.ok, code:a.definition&&a.definition.code, origin:a.definition&&a.definition.origin, obs:a.definition&&a.definition.observations.length, val:EQ.state.D.resolved[a.definition.code].value, basis:EQ.state.D.resolved[a.definition.code].basis};
      out.dup=st(A.addSpec({label:'Hoist brake torque (check R5-09)',value:'1',use:'technical',source:'s'}));
      const code=a.definition.code;
      out.edit=A.editSpec(code,{label:'Hoist brake torque, service (check R5-09)',unit:'kNm'}).ok; out.defHist=(EQ.state.D.paramHistory[code]||[]).filter(x=>x.kind==='definition').map(x=>x.before.label);
      out.newVal=A.resolveParameter(code,'1.25','Nameplate re-read',{source:'Nameplate photo (synthetic)'}).ok; out.valHist=(EQ.state.D.paramHistory[code]||[]).filter(x=>x.kind==='value').map(x=>x.value);
      const obs0=JSON.stringify(EQ.paramDef('rail-gauge').observations);
      out.rg1=A.resolveParameter('rail-gauge','30.5','Site survey (synthetic)',{source:'Survey note (synthetic)'}).ok; out.rg2=A.resolveParameter('rail-gauge','30.48','Corrected survey (synthetic)',{source:'Survey note rev B (synthetic)'}).ok;
      out.rgCur=EQ.state.D.resolved['rail-gauge'].value; out.rgHist=(EQ.state.D.paramHistory['rail-gauge']||[]).map(x=>x.value); out.obsSame=JSON.stringify(EQ.paramDef('rail-gauge').observations)===obs0; out.rgBasis=EQ.state.D.resolved['rail-gauge'].basis;
      out.drawingEdit=st(A.editSpec('rail-gauge',{label:'Rail gauge 2'})); out.noReason=st(A.resolveParameter('rail-gauge','31',''));
      out.audit=EQ.state.D.audit.filter(x=>/^parameter\\./.test(x.action)).map(x=>x.action);
      return out;})()`);
    await ev(`EQ.rerender()`); await b.wait(300);
    const adminRow = await ev(`(()=>{const tr=document.querySelector('tr[data-param^="adm-hoist-brake-torque"]'); return tr?{text:tr.textContent.slice(0,200), hist:!!document.querySelector('tr[data-param-hist^="adm-hoist-brake-torque"]'), rgHist:!!document.querySelector('tr[data-param-hist="rail-gauge"]')}:null})()`);
    await panel({ main: 'mi-q01-01', panel: 'technical' }); await b.wait(600);
    const tech = await ev(`(()=>{const el=document.querySelector('.side-panel .sp-body')||document.querySelector('main'); const t=el.textContent; return {has:/Hoist brake torque, service \\(check R5-09\\)/.test(t), admin:/Admin-entered/.test(t), val:/1\\.25 kNm/.test(t)}})()`);
    await panel({ panel: 'technical' }); await b.wait(500);
    const techEq = await ev(`(()=>{const t=(document.querySelector('.side-panel .sp-body')||document.querySelector('main')).textContent; return {rg:/Admin value/.test(t) && /30\\.48/.test(t), obs:/30\\.?\\d* m/.test(t)}})()`);
    const ok = addBtn && setBtn && r.eqTeam[0] === 403 && r.eqTeamVal[0] === 403 && r.noSource.includes('source') && r.add.ok && r.add.origin === 'admin' && r.add.obs === 0 && r.add.val === '1200' && r.add.basis === 'adminEntered'
      && r.dup[0] === 409 && r.edit && r.defHist.includes('Hoist brake torque (check R5-09)') && r.newVal && r.valHist.includes('1200')
      && r.rg1 && r.rg2 && r.rgCur === '30.48' && r.rgHist.includes('30.5') && r.obsSame && r.rgBasis === 'adminEntered' && r.drawingEdit[0] === 409 && r.drawingEdit[1] === 'source_definition_fixed' && r.noReason[0] === 422
      && r.audit.includes('parameter.add') && r.audit.includes('parameter.value') && r.audit.includes('parameter.edit')
      && adminRow && /Admin-entered/.test(adminRow.text) && adminRow.hist && adminRow.rgHist && tech.has && tech.admin && tech.val && techEq.rg;
    return { ok, detail: { addBtn, setBtn, r, adminRow, tech, techEq } };
  });

  await step('R5-10', ['U1-C22', 'U1-C21', 'SP01', 'SP04', 'ACC03'], 'Spare parts (Admin settings): Admin adds, renames and retires spare-part types (prior values logged; a retired type is not offered for new parts and is refused for new designations or additions, while registered parts keep it); Admin adds parts to the register from the settings page (Add spare part / Add with condition, pre-selected) and edits register entries with the register actions; EQ Team gets 403 on type changes', async () => {
    await go('admin', `/admin/eq/spare-parts?equipment=${Q1}`, 700);
    const ui0 = { add: await exists('[data-fk="sp-admin-add"]'), typeAdd: await exists('[data-fk="type-add"]'), entry: await ev(`!!document.querySelector('[data-fk^="sp-entry-"]')`), addWith: await ev(`!!document.querySelector('[data-fk^="sp-add-"]')`), retire: await exists('[data-fk="type-act-hoist-brake"]') };
    const r = await ev(`(()=>{const P=EQ.spares, out={}; const st=(x)=>x&&[x.status,x.code];
      ${asRole('eqTeam')} out.eqTeam=[st(P.addType({code:'x-type',name:'X'})), st(P.renameType('spt-hoist-brake','B')), st(P.setTypeActive('spt-hoist-brake',false))]; ${asRole('admin')}
      out.bad=Object.keys(P.addType({code:'Bad Code',name:'',defaultLife:'0'}).fields); out.dup=st(P.addType({code:'hoist-brake',name:'Other brake'}));
      const t=P.addType({code:'boom-hoist-motor',name:'Boom hoist motor (check R5-10)',defaultLife:'150'}); out.add={ok:t.ok, life:t.type&&t.type.defaultLife, active:t.type&&t.type.active};
      out.rename=P.renameType('spt-boom-hoist-motor','Boom hoist motor, renamed').ok && P.typeOf('spt-boom-hoist-motor').name==='Boom hoist motor, renamed';
      const brakeUsers=Object.entries(EQ.state.D.spare.designated).filter(([,d])=>d.typeId==='spt-hoist-brake').map(([id])=>id);
      out.retire=P.setTypeActive('spt-hoist-brake',false).ok && !P.typeOf('spt-hoist-brake').active;
      out.keep=brakeUsers.length>0 && brakeUsers.every(id=>EQ.state.D.spare.designated[id].typeId==='spt-hoist-brake' && P.row(id).typeName==='Hoist brake');
      const free=EQ.positionsOf('${Q1}').filter(p=>p.state==='active' && !P.isMajor(p.id) && !EQ.state.D.events.some(e=>e.positionId===p.id && !e.voided));
      out.designRetired=st(P.designate(free[0].id,{on:true,typeId:'spt-hoist-brake'})); out.addRetired=Object.keys(P.add({equipmentId:'${Q1}',posId:free[0].id,typeId:'spt-hoist-brake',condition:'original',desc:'x'}).fields||{});
      out.addNew=P.add({equipmentId:'${Q1}',posId:free[0].id,typeId:'spt-boom-hoist-motor',condition:'original',desc:'Boom motor (check R5-10)'}).ok && P.row(free[0].id).lifeMonths===150;
      out.typeLog=(EQ.state.D.spare.typeLog||[]).map(x=>x.code+':'+x.action); out.freePos=free[1]&&free[1].id;
      return out;})()`);
    await ev(`EQ.rerender()`); await b.wait(300);
    const retiredShown = await ev(`/Retired/.test((document.querySelector('tr[data-type="hoist-brake"]')||{}).textContent||'') && /Reactivate/.test((document.querySelector('[data-fk="type-act-hoist-brake"]')||{}).textContent||'')`);
    await b.click(`[data-fk="sp-add-${r.freePos}"]`); await b.wait(300);
    const pre = await ev(`({title:(document.getElementById('dlg-title')||{}).textContent, pos:(document.getElementById('as-pos')||{}).value, types:[...(document.getElementById('as-type')||{options:[]}).options].map(o=>o.value)})`);
    await b.key('Escape'); await b.wait(300);
    const entryId = await ev(`document.querySelector('[data-fk^="sp-entry-"]').dataset.fk`);
    await b.click(`[data-fk="${entryId}"]`); await b.wait(300);
    const entryTitle = await text('#dlg-title'); const entryActs = await ev(`[...document.querySelectorAll('input[name="sp-act"]')].map(i=>i.value)`);
    await b.click('#sp-act-remarks'); await b.wait(150); await b.setValue('#sp-remarks', 'Admin edit of the register entry (check R5-10)'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const entryPos = entryId.replace('sp-entry-', '');
    const entrySaved = await ev(`EQ.spares.row(${JSON.stringify(entryPos)}).remarks==='Admin edit of the register entry (check R5-10)' && EQ.spares.history(${JSON.stringify(entryPos)})[0].source==='registerRemarks' && EQ.spares.history(${JSON.stringify(entryPos)})[0].by==='u-admin'`);
    await b.click('[data-fk="type-add"]'); await b.wait(300); await b.setValue('#ty-code', 'trolley-motor'); await b.setValue('#ty-name', 'Trolley motor (check R5-10)'); await b.setValue('#ty-life', '120'); await b.click('dialog button[type="submit"]'); await b.wait(400);
    const formType = await ev(`!!EQ.spares.typeOf('spt-trolley-motor') && !!document.querySelector('tr[data-type="trolley-motor"]')`);
    const ok = ui0.add && ui0.typeAdd && ui0.entry && ui0.addWith && ui0.retire && r.eqTeam.every((x) => x[0] === 403) && r.bad.includes('code') && r.bad.includes('name') && r.bad.includes('defaultLife') && r.dup[0] === 409
      && r.add.ok && r.add.life === 150 && r.add.active && r.rename && r.retire && r.keep && r.designRetired[0] === 422 && r.addRetired.includes('typeId') && r.addNew
      && r.typeLog.some((x) => x === 'hoist-brake:retired') && r.typeLog.some((x) => x === 'boom-hoist-motor:renamed') && r.typeLog.some((x) => x === 'boom-hoist-motor:added')
      && retiredShown && /Add spare part/.test(pre.title) && pre.pos === r.freePos && !pre.types.includes('spt-hoist-brake') && pre.types.includes('spt-boom-hoist-motor')
      && /Update condition/.test(entryTitle) && entryActs.includes('remarks') && entrySaved && formType;
    return { ok, detail: { ui0, r, retiredShown, pre, entryId, entryTitle, entryActs, entrySaved, formType } };
  });

  await step('R5-11', ['U1-C22', 'ACC03', 'AUTH03'], 'Admin-only ceiling unchanged: EQ Team, FAC Team and Management cannot open Admin > EQ settings and every new add/adjust command refuses them (403); no console errors on the Admin pages changed in round 5', async () => {
    const res = {};
    for (const role of ['eqTeam', 'facTeam', 'management']) {
      await go(role, '/admin/eq/catalog', 600);
      res[role] = { page: await ev(`!!document.querySelector('[data-fk="cat-add-main"]')`), cmds: await ev(`(()=>{const A=EQ.api,P=EQ.spares; return [A.addMainDef({code:'18',name:'x'}),A.addSubDef({main:'01',code:'019',name:'x'}),A.editDef('011',{name:'x'}),A.addPosition('${Q1}',{name:'x',key:'a.b',subId:'si-q01-011',kind:'serialized'}),A.editPosition('pp-q01-001',{name:'x'}),A.addSpec({label:'x',value:'1',use:'major',source:'s'}),A.editSpec('rail-gauge',{label:'x'}),A.resolveParameter('rail-gauge','1','x'),P.addType({code:'zz',name:'zz'}),P.renameType('spt-hoist-brake','x'),P.setTypeActive('spt-hoist-brake',false)].map(x=>x.status)})()`) };
    }
    const errs = [];
    for (const hash of ['/admin/eq/catalog', '/admin/eq/positions', '/admin/eq/parameters', '/admin/eq/spare-parts']) { await go('admin', hash, 600); errs.push(...b.errors().map((e) => hash + ': ' + String(e).slice(0, 160))); }
    const ok = Object.values(res).every((x) => !x.page && x.cmds.every((s) => s === 403)) && !errs.length;
    return { ok, detail: { res, errs } };
  });
} finally { /* closed below */ }

const failed = results.filter((r) => r.status !== 'PASS').length;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ tool: 'tools/p02b/check_u1_r5.mjs', browser: b.browser, date: new Date().toISOString(), note: 'Prototype-level checks of the U1 round 5 repair against the synthetic prototype; not acceptance execution.', passed: results.length - failed, failed, results }, null, 2));
console.log(`\n${results.length} checks, ${failed} failed`);
await b.close();
process.exit(failed ? 1 : 0);
