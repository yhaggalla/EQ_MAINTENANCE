// Automated checks for the P02 prototype, run in a real headless Chrome through the DevTools protocol.
// Usage: node tools/p02/check_prototype.mjs [baseUrl] [outJson]
// Serve the prototype first: node artifacts/prototypes/p02-ui/serve.mjs
// These are prototype UI checks. They do not exercise any production server, database or authentication.
import fs from 'node:fs';
import { launch } from './cdp.mjs';

const base = process.argv[2] || 'http://127.0.0.1:5312/';
const outFile = process.argv[3] || 'docs/evidence/P02/automated-checks.json';
const results = [];
const rec = (id, name, ok, detail) => { results.push({ id, name, status: ok ? 'PASS' : 'FAIL', detail: ok ? (detail || '') : (detail || 'assertion failed') }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + name + (detail ? ' - ' + detail : '')); };
const url = (q, hash) => base + '?' + new URLSearchParams(q).toString() + '#' + hash;
const Q1 = 'eq-qc-demo-01', Q2 = 'eq-qc-demo-02';

const b = await launch({ port: 9342 });
const go = async (role, hash, extra = {}) => { b.clearEvents(); await b.goto(url({ role, ...extra }, hash)); await b.wait(500); };
const text = (sel) => b.eval(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const ev = (expr) => b.eval(expr);
const step = async (id, name, fn) => { try { const r = await fn(); rec(id, name, r === true || (r && r.ok), r && r.detail); } catch (e) { rec(id, name, false, 'EXCEPTION ' + e.message); } };

try {
  console.log('Browser:', b.browser);
  await b.viewport(1920, 1080);

  // ---------------- C01 route smoke ----------------
  const routes = ['/fleet', '/fleet?type=QC&status=maintenance', `/equipment/${Q1}`, `/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&mode=technical`, `/equipment/${Q2}`, '/equipment/eq-qc-demo-03', '/equipment/eq-qc-demo-04', '/equipment/eq-rtg-demo-01', '/equipment/eq-es-demo-01', '/jobs', '/jobs?includeCancelled=1', '/jobs/job-202', '/admin/equipment', '/admin/models', '/admin/catalog', '/admin/positions', '/admin/parameters', '/admin/bindings'];
  for (const role of ['admin', 'eqTeam', 'management']) {
    const bad = [];
    for (const r of routes) {
      await go(role, r);
      const a = await ev('window.__protoAudit()');
      const errs = b.errors();
      if (a.issues.length || errs.length || a.h1 < 1 || a.canvases !== 0) bad.push(r + ' => ' + JSON.stringify({ issues: a.issues.slice(0, 3), errs: errs.slice(0, 2), h1: a.h1, canvases: a.canvases }));
    }
    rec('C01-' + role, `Route smoke, ${routes.length} routes as ${role}: no console errors, every control named, unique ids, one h1, zero canvases`, bad.length === 0, bad.join(' | '));
  }

  // ---------------- C02 counts reconcile ----------------
  await step('C02', 'Fleet counts reconcile with cards for every status filter; retired excluded by default', async () => {
    await go('eqTeam', '/fleet');
    const c = await ev('EQ.fleetCounts(EQ.state.D.equipment)');
    if (c.readyForOps + c.breakdown + c.maintenance + c.unreported !== c.total) return { ok: false, detail: 'counts do not sum' };
    const all = await ev("document.querySelectorAll('.eq-card').length");
    if (all !== c.total) return { ok: false, detail: `cards ${all} != active ${c.total}` };
    for (const s of ['readyForOps', 'breakdown', 'maintenance', 'unreported']) {
      await go('eqTeam', '/fleet?status=' + s);
      const n = await ev("document.querySelectorAll('.eq-card').length");
      if (n !== c[s]) return { ok: false, detail: `${s}: ${n} cards vs count ${c[s]}` };
    }
    await go('eqTeam', '/fleet?lifecycle=all');
    const withRet = await ev("document.querySelectorAll('.eq-card').length");
    return { ok: withRet === c.total + 1, detail: `active ${c.total}: ready ${c.readyForOps}, breakdown ${c.breakdown}, maintenance ${c.maintenance}, unreported ${c.unreported}; with retired ${withRet}` };
  });
  await step('C03', 'Unreported equipment shows no duration and is not counted Ready', async () => {
    await go('eqTeam', '/equipment/eq-qc-demo-03');
    const head = await text('.eq-head');
    await go('eqTeam', '/fleet');
    const card = await ev(`[...document.querySelectorAll('.eq-card')].find(c=>c.textContent.includes('QC-DEMO-03')).textContent`);
    return head.includes('Unreported') && head.includes('No status reported yet') && !/In (Ready|Maintenance|Breakdown)/.test(card) && card.includes('No status reported yet');
  });
  await step('C04', 'Status is never colour-only: every status badge has an icon and text', async () => {
    await go('eqTeam', '/fleet');
    return ev(`[...document.querySelectorAll('.badge')].every(x=>x.querySelector('svg')&&(x.textContent.trim().length>3||(x.getAttribute('aria-label')||'').length>3)) && document.querySelectorAll('.badge').length>10`);
  });

  // ---------------- C05 selection model ----------------
  await step('C05', 'Tree, breadcrumb, URL and scene share one selection (main, then part via the scene)', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    await b.click('[data-nid="mi-q01-01"] > .ti'); await b.wait(500);
    const h1 = await ev('location.hash');
    const crumb = await text('.breadcrumb');
    const sel1 = await ev(`[...document.querySelectorAll('.sc-hit.sel')].map(e=>e.dataset.key)`);
    await b.click('[data-fk="mode-technical"]'); await b.wait(400);
    await b.click('[data-key="hoist.drive.motor.a"]'); await b.wait(600);
    const h2 = await ev('location.hash');
    const treeSel = await ev(`document.querySelector('[role=treeitem][aria-selected=true]').dataset.nid`);
    const title = await text('[data-fk="scope-title"]');
    return { ok: h1.includes('main=mi-q01-01') && crumb.includes('Hoist (01)') && sel1.includes('hoist.rope.set.main') && h2.includes('part=pp-q01-007') && treeSel === 'pp-q01-007' && title.includes('Main hoist motor A'), detail: `hash ${h2}; tree selected ${treeSel}` };
  });
  await step('C06', 'Back/forward reproduces the selection', async () => {
    await go('eqTeam', `/equipment/${Q1}?main=mi-q01-01`);
    await b.click('[data-nid="mi-q01-02"] > .ti'); await b.wait(300);
    await ev('history.back()'); await b.wait(500);
    const back = await ev('location.hash');
    await ev('history.forward()'); await b.wait(500);
    const fwd = await ev('location.hash');
    return back.includes('main=mi-q01-01') && fwd.includes('main=mi-q01-02');
  });
  await step('C07', 'Tree selection matches the scene: sub selection highlights exactly its bound positions', async () => {
    await go('eqTeam', `/equipment/${Q1}?main=mi-q01-04&sub=si-q01-041&mode=technical`);
    const keys = await ev(`[...document.querySelectorAll('.sc-hit.sel')].map(e=>e.dataset.key).sort()`);
    return { ok: JSON.stringify(keys) === JSON.stringify(['gantry.bogie.landside.a', 'gantry.bogie.waterside.a']), detail: keys.join(',') };
  });

  // ---------------- history isolation ----------------
  await step('C08', 'Same template, different equipment: motor A history is separate (HIS01)', async () => {
    await go('eqTeam', `/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007`);
    const a = await text('.side-panel');
    await go('eqTeam', `/equipment/${Q2}?main=mi-q02-01&sub=si-q02-011&part=pp-q02-007`);
    const c = await text('.side-panel');
    const ids = await ev(`[EQ.pos('pp-q01-007').key, EQ.pos('pp-q02-007').key, EQ.pos('pp-q01-007').id !== EQ.pos('pp-q02-007').id]`);
    const ok = a.includes('SYN-0001') && !a.includes('SYN-0017') && !a.includes('SYN-0009') && c.includes('SYN-0017') && c.includes('SYN-0009') && !c.includes('SYN-0001') && ids[0] === ids[1] && ids[2];
    return { ok, detail: 'QC-01 shows SYN-0001 only; QC-02 shows SYN-0009 and SYN-0017; same key, different position IDs' };
  });
  await step('C09', 'Scoped history: descendant jobs de-duplicated, equipment-level job not repeated, exact part scope does not leak', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    const r = await ev(`(()=>{
      const H=(l,id)=>EQ.history('${Q1}',{level:l,id}); const nums=(x)=>x.map(r=>r.job.number);
      const main=H('main','mi-q01-01'); const part=H('part','pp-q01-013'); const eqs=H('equipment',null);
      return { mainCompleted:nums(main.completed), mainOpen:nums(main.open), partCompleted:nums(part.completed), eqCount:eqs.open.length+eqs.completed.length,
        dupMain:new Set(nums(main.completed).concat(nums(main.open))).size!==nums(main.completed).concat(nums(main.open)).length,
        equipmentJobInMain: nums(main.open).includes('EQJ-2026-000106') };})()`);
    const ok = r.mainCompleted.length === 2 && r.mainOpen.length === 1 && r.mainOpen[0] === 'EQJ-2026-000104' && r.partCompleted.length === 1 && r.partCompleted[0] === 'EQJ-2026-000102' && !r.dupMain && !r.equipmentJobInMain && r.eqCount === 7;
    return { ok, detail: JSON.stringify(r) };
  });
  await step('C10', 'No-work and unknown states never claim healthy/original; empty history says No work recorded', async () => {
    await go('eqTeam', `/equipment/${Q2}?main=mi-q02-02&sub=si-q02-021&part=pp-q02-014`);
    const t = await text('.side-panel');
    return t.includes('No work recorded') && t.includes('Installed item unknown') && /not evidence/i.test(t) && !/\bhealthy\b(?! or)/i.test(t.replace(/healthy or never replaced/g, '').replace(/original, healthy/g, ''));
  });
  await step('C11', 'Late history responses for a previous selection are discarded (HIS05)', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    await b.wait(500);
    await ev('EQ.state.slowHistory = true');
    // request counter is odd -> slow; prime so that the next selection (A) is slow and the one after (B) is fast
    const n = await ev('1');
    await b.click('[data-nid="mi-q01-01"] > .ti'); await b.wait(700);
    await ev(`EQ.nav('/equipment/${Q1}', {main:'mi-q01-01',sub:'si-q01-011',part:'pp-q01-007'})`); await b.wait(120);
    await ev(`EQ.nav('/equipment/${Q1}', {main:'mi-q01-01',sub:'si-q01-011',part:'pp-q01-008'})`);
    await b.wait(3500);
    const echo = await ev(`(document.querySelector('[data-echo]')||{dataset:{}}).dataset.echo||''`);
    const panel = await text('.side-panel');
    const log = await ev('EQ.state.log.join("\\n")');
    return { ok: echo.includes('pp-q01-008') && panel.includes('Main hoist motor B') && !panel.includes('SYN-0001') && /DISCARDED/.test(log), detail: 'panel echo ' + echo + '; log has DISCARDED: ' + /DISCARDED/.test(log) };
  });

  // ---------------- permissions (UI and simulated server rules) ----------------
  await step('C12', 'Management is read-only in the UI: no write controls, persistent read-only indicator, navigation still works', async () => {
    const bad = [];
    for (const r of [`/equipment/${Q1}`, '/jobs', '/fleet', `/equipment/${Q1}?part=pp-q01-007&sub=si-q01-011&main=mi-q01-01`]) {
      await go('management', r);
      const labels = await ev(`[...document.querySelectorAll('main button, main a.btn')].map(x=>x.textContent.trim())`);
      const forbidden = labels.filter((l) => /^(Add job|Update status|Complete|Edit|Start|Return to Pending|Cancel\.\.\.|Register equipment|Add job for this selection)/.test(l));
      if (forbidden.length) bad.push(r + ': ' + forbidden.join(','));
    }
    const chip = await text('.readonly-chip');
    const nav = await ev(`[...document.querySelectorAll('.topnav a')].map(a=>a.textContent.trim())`);
    return { ok: !bad.length && chip.includes('Read-only') && nav.join() === 'Fleet,Jobs', detail: bad.join('; ') + ' nav=' + nav.join() };
  });
  await step('C13', 'Simulated server refuses every write for Management (403) and Admin-only writes for EQ Team', async () => {
    const m = await (async () => { await go('management', '/fleet'); return ev(`(()=>{const r={};
      r.job=EQ.api.createJob({equipmentId:'${Q2}',kind:'repair',title:'x',level:'equipment'}).status;
      r.status=EQ.api.setStatus('${Q2}',{status:'maintenance',reason:'x'}).status;
      r.complete=EQ.api.completeJob('job-206',{key:'k',completedOn:'2026-10-01',note:'x',lines:[]}).status;
      r.cancel=EQ.api.cancelJob('job-206','reason here').status; r.move=EQ.api.moveJob('job-206','pending').status; r.edit=EQ.api.updateJob('job-206',{}).status;
      r.eq=EQ.api.createEquipment({code:'ZZ',typeCode:'QC'}).status; r.app=EQ.api.setApplicability('CICT-J526A-STS','047','applicable').status; r.reopen=EQ.api.reopenJob('job-201','r').status; return r;})()`); })();
    await go('eqTeam', '/fleet');
    const t = await ev(`(()=>{const r={};
      r.eq=EQ.api.createEquipment({code:'ZZ',typeCode:'QC'}).status; r.app=EQ.api.setApplicability('CICT-J526A-STS','047','applicable').status; r.reopen=EQ.api.reopenJob('job-201','r').status;
      r.retire=EQ.api.retireEquipment('eq-es-demo-02').status; r.cat=EQ.api.setCatalogActive('011',false).status; r.pos=EQ.api.confirmPositions('eq-qc-demo-03',['pp-q03-001']).status;
      r.job=EQ.api.createJob({equipmentId:'${Q2}',kind:'repair',title:'ok',level:'equipment'}).ok; return r;})()`);
    const mOk = Object.values(m).every((s) => s === 403);
    const tOk = t.eq === 403 && t.app === 403 && t.reopen === 403 && t.retire === 403 && t.cat === 403 && t.pos === 403 && t.job === true;
    return { ok: mOk && tOk, detail: 'Management ' + JSON.stringify(m) + ' EQ Team ' + JSON.stringify(t) };
  });
  await step('C14', 'Admin area: EQ Team and Management get a 403 explanation and no Admin nav; Admin sees the screens', async () => {
    await go('eqTeam', '/admin/equipment');
    const a = await text('main');
    await go('management', '/admin/catalog');
    const mg = await text('main');
    await go('admin', '/admin/catalog');
    const ad = await text('main');
    const nav = await ev(`[...document.querySelectorAll('.topnav a')].map(a=>a.textContent.trim()).join()`);
    return a.includes('403') && mg.includes('403') && ad.includes('Mechanism catalogue') && nav === 'Fleet,Jobs,Admin';
  });
  await step('C15', 'Cancel rules: EQ Team only own uncompleted jobs; Admin any uncompleted; completed never; reopened protected (J6)', async () => {
    await go('eqTeam', '/jobs');
    const r = await ev(`(()=>{const P=(id)=>EQ.perm.cancel(EQ.job(id)).ok; const r={};
      r.ownPending=P('job-106'); r.otherCreator=P('job-105'); r.completed=P('job-101');
      EQ.state.role='admin'; r.adminOther=P('job-105'); r.adminCompleted=P('job-101');
      EQ.api.reopenJob('job-101','test reopen'); EQ.state.role='eqTeam'; r.reopenedEq=P('job-101');
      EQ.state.role='admin'; r.reopenedAdminWithLines=P('job-101');
      EQ.state.role='eqTeam'; const c=EQ.api.cancelJob('job-106','duplicate request'); r.cancelOwn=c.ok; r.cancelledHidden=!EQ.state.D.jobs.filter(j=>!j.isCancelled).includes(EQ.job('job-106')); r.cancelNoReason=EQ.api.cancelJob('job-206','').status;
      return r;})()`);
    const ok = r.ownPending && !r.otherCreator && !r.completed && r.adminOther && !r.adminCompleted && !r.reopenedEq && !r.reopenedAdminWithLines && r.cancelOwn && r.cancelledHidden;
    return { ok, detail: JSON.stringify(r) };
  });
  await step('C16', 'Cancelled jobs leave the three columns and appear with Include cancelled (with reason and actor)', async () => {
    await go('eqTeam', '/jobs?equipment=' + Q2);
    const hidden = await text('.board');
    await go('eqTeam', '/jobs?includeCancelled=1&equipment=' + Q2);
    const shown = await text('main');
    return !hidden.includes('PLC cabinet fan') && shown.includes('PLC cabinet fan') && shown.includes('Duplicate of work already covered') && shown.includes('Cancelled by Synthetic EQ Team user A');
  });

  // ---------------- job forms and completion ----------------
  await step('C17', 'Completion through the dialog: replacement committed once, history updated, equipment stays Maintenance, retry replays', async () => {
    await go('eqTeam', '/jobs?equipment=' + Q1);
    await b.clickIn('.job', 'Replace main hoist motor B', 'Complete...'); await b.wait(250);
    await b.setValue('#cf-note', 'Motor B swapped (synthetic test).');
    await b.setValue('#cl0-desc', 'Main hoist motor (synthetic test item)');
    await b.setValue('#cl0-sn', 'SYN-TEST-1');
    await b.click('dialog button[type="submit"]'); await b.wait(900);
    const r = await ev(`({status:EQ.job('job-104').workStatus, ev:EQ.state.D.events.filter(e=>e.positionId==='pp-q01-008').length, eqStatus:EQ.eq('${Q1}').status, open:!!document.querySelector('dialog[open]')})`);
    const key = await ev('EQ.lastCompletion.key');
    const again = await ev(`(()=>{const x=EQ.api.completeJob('job-104',{key:EQ.lastCompletion.key}); return {replayed:x.replayed, ok:x.ok, ev:EQ.state.D.events.filter(e=>e.positionId==='pp-q01-008').length};})()`);
    const other = await ev(`EQ.api.completeJob('job-104',{key:'another-key',completedOn:'2026-10-01',note:'x',lines:[]}).code`);
    return { ok: r.status === 'completed' && r.ev === 1 && r.eqStatus === 'maintenance' && !r.open && again.replayed && again.ev === 1 && other === 'job_already_completed', detail: JSON.stringify({ r, again, other }) };
  });
  await step('C18', 'Completion validation: errors summarised and linked, duplicate position refused, nothing saved', async () => {
    await go('eqTeam', '/jobs?equipment=' + Q1);
    await b.clickIn('.job', 'Boom rope set replacement', 'Complete...'); await b.wait(250);
    await b.setValue('#cf-date', '');
    await b.click('dialog button[type="submit"]'); await b.wait(900);
    const sum = await text('#err-summary');
    await b.click('dialog .row.between button'); await b.wait(150); // Add line
    await b.setValue('#cl0-pos', await ev(`EQ.positionsOf('${Q1}').find(p=>p.key==='boom.rope.set.main').id`));
    await b.setValue('#cl1-pos', await ev(`EQ.positionsOf('${Q1}').find(p=>p.key==='boom.rope.set.main').id`));
    await b.setValue('#cf-note', 'x'); await b.setValue('#cf-date', '2026-10-20');
    await b.setValue('#cl0-desc', 'rope'); await b.setValue('#cl1-desc', 'rope'); await b.setValue('#cl0-qty', '0'); await b.setValue('#cl1-qty', '2');
    await b.click('dialog button[type="submit"]'); await b.wait(900);
    const sum2 = await text('#err-summary');
    const saved = await ev(`({st:EQ.job('job-107').workStatus, ev:EQ.state.D.events.filter(e=>e.positionId==='${await ev(`EQ.positionsOf('${Q1}').find(p=>p.key==='boom.rope.set.main').id`)}').length})`);
    const focused = await ev(`document.activeElement && document.activeElement.id`);
    return { ok: /not in the future/.test(sum) && /Duplicate position/.test(sum2) && /greater than 0/.test(sum2) && saved.st === 'pending' && saved.ev === 0 && focused === 'err-summary', detail: sum.slice(0, 120) + ' | ' + sum2.slice(0, 200) };
  });
  await step('C19', 'Atomic completion: one valid and one invalid line commit nothing; out-of-order date refused; quantity rules per position kind', async () => {
    await go('eqTeam', '/fleet');
    const r = await ev(`(()=>{
      const mk=(pos)=>EQ.api.createJob({equipmentId:'${Q2}',kind:'replacement',title:'T',level:'part',positionId:pos}).job;
      const motor=EQ.positionsOf('${Q2}').find(p=>p.key==='hoist.drive.motor.a'); const rope=EQ.positionsOf('${Q2}').find(p=>p.key==='hoist.rope.set.main'); const wheel=EQ.positionsOf('${Q2}').find(p=>p.key==='trolley.wheel.position.b');
      const evs=()=>EQ.state.D.events.length;
      const j1=EQ.api.createJob({equipmentId:'${Q2}',kind:'replacement',title:'Multi',level:'equipment'}).job;
      const n0=evs();
      const bad=EQ.api.completeJob(j1.id,{key:'a1',completedOn:'2026-10-20',note:'n',lines:[{positionId:rope.id,qty:'2',desc:'rope',on:'2026-10-20',removedKnown:'unknown'},{positionId:motor.id,qty:'1',desc:'',on:'2026-10-20',removedKnown:'unknown'}]});
      const afterBad={ok:bad.ok, status:EQ.job(j1.id).workStatus, n:evs()-n0};
      const old=EQ.api.completeJob(j1.id,{key:'a2',completedOn:'2026-10-20',note:'n',lines:[{positionId:motor.id,qty:'1',desc:'m',on:'2026-01-01',removedKnown:'unknown'}]});
      const ser2=EQ.api.completeJob(j1.id,{key:'a3',completedOn:'2026-10-20',note:'n',lines:[{positionId:motor.id,qty:'2',desc:'m',on:'2026-10-20',removedKnown:'unknown'}]});
      const other=EQ.api.completeJob(j1.id,{key:'a4',completedOn:'2026-10-20',note:'n',lines:[{positionId:EQ.positionsOf('${Q1}')[0].id,qty:'1',desc:'m',on:'2026-10-20',removedKnown:'unknown'}]});
      const good=EQ.api.completeJob(j1.id,{key:'a5',completedOn:'2026-10-20',note:'n',lines:[{positionId:rope.id,qty:'2',desc:'rope',on:'2026-10-20',removedKnown:'unknown'},{positionId:wheel.id,qty:'1',desc:'wheel',on:'2026-10-20',removedKnown:'unknown'}]});
      const lot=EQ.state.D.events.find(e=>e.positionId===rope.id && e.jobId===j1.id);
      const future=EQ.api.createJob({equipmentId:'${Q2}',kind:'repair',title:'F',level:'equipment'}).job; const fut=EQ.api.completeJob(future.id,{key:'a6',completedOn:'2999-01-01',note:'n',lines:[]});
      return {afterBad, old:old.lineErrors&&old.lineErrors[0].on, ser2:ser2.lineErrors&&ser2.lineErrors[0].qty, other:other.lineErrors&&other.lineErrors[0].positionId, good:good.ok, goodN:evs()-n0, lotQty:lot&&lot.installed.qty+' '+lot.installed.uom, fut:fut.fields&&fut.fields.completedOn};})()`);
    const ok = r.afterBad.ok === false && r.afterBad.status !== 'completed' && r.afterBad.n === 0 && /out_of_order/.test(r.old) && /exactly 1/.test(r.ser2) && /another equipment/.test(r.other) && r.good === true && r.goodN === 2 && r.lotQty === '2 rope' && /future/.test(r.fut);
    return { ok, detail: JSON.stringify(r) };
  });
  await step('C20', 'Status rules: reason required for Breakdown/Maintenance, same status refused, foreign job refused, Ready needs no reason, job completion never sets Ready', async () => {
    await go('eqTeam', '/fleet');
    const r = await ev(`(()=>{const S=(id,p)=>EQ.api.setStatus(id,p);
      return { noReason:S('${Q2}',{status:'maintenance',reason:''}).fields.reason, same:S('${Q2}',{status:'readyForOps'}).fields.status, foreign:S('${Q2}',{status:'maintenance',reason:'r',relatedJobId:'job-104'}).fields.relatedJobId,
        ok:S('${Q2}',{status:'maintenance',reason:'Brake work',relatedJobId:'job-206'}).ok, ready:S('${Q2}',{status:'readyForOps'}).ok, unk:S('eq-rtg-demo-05',{status:'readyForOps'}).ok,
        changes:EQ.history('${Q2}',{level:'equipment'}).statusChanges.length, retired:EQ.api.setStatus('eq-rtg-demo-07',{status:'breakdown',reason:'x'}).code }; })()`);
    return { ok: /required/.test(r.noReason) && /already/.test(r.same) && /another equipment/.test(r.foreign) && r.ok && r.ready && r.unk && r.changes === 4 && r.retired === 'equipment_retired', detail: JSON.stringify(r) };
  });
  await step('C21', 'Version conflict: stale save returns 409 with current values and nothing is lost', async () => {
    await go('eqTeam', '/jobs?equipment=' + Q1);
    await ev('EQ.state.conflictNext = true');
    await b.clickIn('.job', 'Inspect trolley wheel wear', 'Edit'); await b.wait(250);
    await b.setValue('#jf-title', 'My edited title');
    await b.click('dialog button[type="submit"]'); await b.wait(800);
    const t = await text('dialog');
    const title = await ev(`document.querySelector('#jf-title').value`);
    return t.includes('409 version_conflict') && t.includes('Keep my edits') && title === 'My edited title';
  });
  await step('C22', 'Job form: invalid state shows a linked error summary; unsaved-changes guard on close; no EAM/Maximo field', async () => {
    await go('eqTeam', '/jobs');
    await b.click('[data-fk="add-job"]'); await b.wait(250);
    const formText = await text('dialog');
    await b.click('dialog button[type="submit"]'); await b.wait(800);
    const sum = await text('#err-summary');
    await b.setValue('#jf-title', 'Dirty title');
    await b.key('Escape'); await b.wait(250);
    const guard = await ev(`document.querySelectorAll('dialog[open]').length`);
    const gtext = await ev(`[...document.querySelectorAll('dialog[open]')].pop().textContent`);
    await b.clickText('dialog[open] button', 'Keep editing'); await b.wait(150);
    const still = await ev(`document.querySelectorAll('dialog[open]').length`);
    return { ok: /Choose an equipment/.test(sum) && /Choose Repair/.test(sum) && /Enter a title/.test(sum) && guard === 2 && /Discard unsaved changes/.test(gtext) && still === 1 && !/maximo|EAM|work order/i.test(formText), detail: `dialogs ${guard}->${still}` };
  });
  await step('C23', 'Status dialog: reason required for Maintenance is reported per field', async () => {
    await go('eqTeam', `/equipment/${Q2}`);
    await b.click('[data-fk="set-status"]'); await b.wait(200);
    await b.click('#sf-status-breakdown'); await b.click('dialog button[type="submit"]'); await b.wait(500);
    const t = await text('dialog');
    return /required for Breakdown and Maintenance/.test(t) && /Takes effect at server time/.test(t);
  });

  // ---------------- keyboard and focus ----------------
  await step('C24', 'Keyboard: skip link is first; mechanism tree supports arrows, expand/collapse and Enter', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    await ev('document.activeElement && document.activeElement.blur()');
    await b.key('Tab');
    const first = await ev('document.activeElement.className + "|" + document.activeElement.textContent');
    await ev(`document.querySelector('[data-nid="root"]').focus()`);
    await b.key('ArrowDown'); const f1 = await ev('document.activeElement.dataset.nid');
    await b.key('ArrowRight'); await b.wait(150);
    const exp = await ev(`document.querySelector('[data-nid="mi-q01-01"]').getAttribute('aria-expanded')`);
    const ex2 = exp;
    await b.key('ArrowDown'); await b.key('Enter'); await b.wait(500);
    const hash = await ev('location.hash');
    const focusKept = await ev(`document.activeElement && document.activeElement.dataset.nid`);
    return { ok: first.includes('skip-link') && f1 === 'mi-q01-01' && ex2 === 'true' && hash.includes('sub=si-q01-011') && focusKept === 'si-q01-011', detail: `first=${first.slice(0, 30)} f1=${f1} exp=${exp}/${ex2} hash=${hash} focus=${focusKept}` };
  });
  await step('C25', 'Dialog keeps focus inside (40 Tab presses) and every dialog control has an accessible name', async () => {
    const bad = [];
    const dialogs = [
      ['add job', '/jobs', async () => { await b.click('[data-fk="add-job"]'); }],
      ['complete (replacement)', '/jobs?equipment=' + Q1, async () => { await b.clickIn('.job', 'Replace main hoist motor B', 'Complete...'); }],
      ['edit job', '/jobs?equipment=' + Q1, async () => { await b.clickIn('.job', 'Inspect trolley wheel wear', 'Edit'); }],
      ['cancel job', '/jobs?equipment=' + Q1, async () => { await b.clickIn('.job', 'Annual rail alignment survey', 'Cancel...'); }],
      ['set status', `/equipment/${Q2}`, async () => { await b.click('[data-fk="set-status"]'); }],
    ];
    for (const [name, hash, open] of dialogs) {
      await go('eqTeam', hash); await open(); await b.wait(300);
      const a = await ev('window.__protoAudit()');
      if (a.issues.length) bad.push(name + ': ' + a.issues.slice(0, 2).join('; '));
      let out = 0;
      for (let i = 0; i < 40; i++) { await b.key('Tab', { shift: i % 7 === 6 }); const inside = await ev(`!!(document.activeElement && document.activeElement.closest('dialog'))`); if (!inside) out++; }
      if (out) bad.push(name + ': focus left the dialog ' + out + 'x');
    }
    await go('admin', '/admin/equipment'); await b.click('main .primary'); await b.wait(250);
    const a2 = await ev('window.__protoAudit()'); if (a2.issues.length) bad.push('register equipment: ' + a2.issues.join(';'));
    return { ok: bad.length === 0, detail: bad.join(' | ') };
  });
  await step('C26', 'Visible keyboard focus indicator (>= 2 px outline) on nav links, buttons, inputs, tree items, chips', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    await b.key('Tab');
    const r = await ev(`(()=>{const out=[]; const sels=['.nav-link','.eq-head button','[data-fk="tf"]','.vp-bar button','.chips button','.tabs button'];
      for(const sel of sels){const el=document.querySelector(sel); el.focus(); const o=getComputedStyle(el); out.push(sel+':'+(el.matches(':focus-visible')&&o.outlineStyle!=='none'&&parseFloat(o.outlineWidth)>=2?'ok':'NONE'));}
      const ti=document.querySelector('[role=treeitem]'); ti.focus(); const c=getComputedStyle(ti.querySelector('.ti')); out.push('treeitem:'+(ti.matches(':focus-visible')&&c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>=2?'ok':'NONE'));
      return out;})()`);
    return { ok: !r.some((x) => x.endsWith('NONE')), detail: r.join(', ') };
  });

  // ---------------- viewer behaviour ----------------
  await step('C27', 'Non-WebGL, context lost and failed-load states: viewer explains, tree/history/work stay usable, never a canvas', async () => {
    const bad = [];
    for (const v of ['nowebgl', 'contextlost', 'loadfailed', 'loading']) {
      await go('eqTeam', `/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007`, { viewer: v });
      await b.wait(500);
      const m = await text('.viewport');
      const tree = await ev(`document.querySelectorAll('[role=treeitem]').length`);
      const side = await text('.side-panel');
      const canv = await ev(`document.querySelectorAll('canvas').length`);
      const addJob = await ev(`!!document.querySelector('[data-fk="add-job"]')`);
      const msg = { nowebgl: 'WebGL is not available', contextlost: 'context lost', loadfailed: 'could not be loaded', loading: 'Loading the model' }[v];
      if (!m.includes(msg) || tree < 10 || !side.includes('SYN-0001') || canv || !addJob) bad.push(v);
    }
    return { ok: !bad.length, detail: bad.join(',') };
  });
  await step('C28', 'RTG/ES say 3D is not available (never a QC model); QC without verified model is not shown a model', async () => {
    const out = [];
    for (const [id, expect] of [['eq-rtg-demo-01', '3D view not available in stage 1'], ['eq-es-demo-01', '3D view not available in stage 1'], ['eq-qc-demo-04', 'No verified model association']]) {
      await go('eqTeam', '/equipment/' + id);
      const t = await text('.viewport');
      const svg = await ev(`!!document.querySelector('#scene-svg')`);
      if (!t.includes(expect) || svg) out.push(id);
    }
    await go('eqTeam', '/equipment/eq-rtg-demo-01');
    const records = await text('main');
    return { ok: !out.length && records.includes('Records for RTG-DEMO-01') && records.includes('Replace tyre set A'), detail: out.join(',') };
  });
  await step('C29', 'Machinery house is a spatial container: selects nothing, lists contained positions grouped by mechanism', async () => {
    await go('eqTeam', `/equipment/${Q1}?mode=technical`);
    await b.click('[data-container="machinery-house"]'); await b.wait(500);
    const h = await ev('location.hash');
    const t = await text('.side-panel');
    const selected = await ev(`document.querySelector('[role=treeitem][aria-selected=true]').dataset.nid`);
    return h.includes('container=machinery-house') && !/main=|part=/.test(h) && /not a mechanism/.test(t) && /01 Hoist/.test(t) && /08 PLC/.test(t) && selected === 'root';
  });
  await step('C30', 'Camera: Fit and Reset change the viewBox; thin rope gets a minimum extent; transition completes', async () => {
    await go('eqTeam', `/equipment/${Q1}?main=mi-q01-01&sub=si-q01-015&part=pp-q01-013`);
    await b.wait(900);
    const vb = await ev(`document.getElementById('scene-svg').getAttribute('viewBox').split(' ').map(Number)`);
    await b.clickText('.vp-bar button', 'Reset'); await b.wait(700);
    const vb2 = await ev(`document.getElementById('scene-svg').getAttribute('viewBox').split(' ').map(Number)`);
    await b.clickText('.vp-bar button', 'Fit'); await b.wait(700);
    const vb3 = await ev(`document.getElementById('scene-svg').getAttribute('viewBox').split(' ').map(Number)`);
    return { ok: vb[2] >= 34 && vb[2] < 144 && Math.abs(vb2[2] - 144) < 0.5 && Math.abs(vb3[2] - vb[2]) < 0.5, detail: `fit ${vb[2].toFixed(1)}, reset ${vb2[2].toFixed(1)}, refit ${vb3[2].toFixed(1)}` };
  });
  await step('C31', 'Reduced motion: selection fit is instant; a newer selection cancels a running transition', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await ev(`EQ.nav('/equipment/${Q1}', {main:'mi-q01-04',sub:'si-q01-041',mode:'technical'})`);
    await b.wait(120);
    const instant = await ev(`document.getElementById('scene-svg').getAttribute('viewBox').split(' ').map(Number)[2]`);
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await go('eqTeam', `/equipment/${Q1}`);
    await ev(`EQ.nav('/equipment/${Q1}', {main:'mi-q01-04',sub:'si-q01-041',mode:'technical'})`); await b.wait(60);
    await ev(`EQ.nav('/equipment/${Q1}', {main:'mi-q01-02',sub:'si-q01-021',mode:'technical'})`); await b.wait(800);
    const cx = await ev(`(()=>{const v=document.getElementById('scene-svg').getAttribute('viewBox').split(' ').map(Number); return v[0]+v[2]/2;})()`);
    return { ok: instant < 140 && cx > 75, detail: `reduced-motion width after 120 ms ${instant.toFixed(1)}; final centre x after superseded fit ${cx.toFixed(1)} (trolley region)` };
  });
  await step('C32', 'Overall mode hides technical internals; Technical shows them; red paint never carries status (separate legend)', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    const vis = (m) => ev(`(()=>{const e=document.querySelector('[data-key="hoist.drive.motor.a"]'); return getComputedStyle(e).display;})()`);
    const o = await vis(); await go('eqTeam', `/equipment/${Q1}?mode=technical`); const t = await vis();
    const legend = await ev(`document.querySelector('.vp-legend').textContent`);
    const maint = await text('.eq-head');
    return { ok: o === 'none' && t !== 'none' && /Red paint is never a Breakdown indication/.test(legend) && /Appearance \(not status\)/.test(legend) && maint.includes('Maintenance'), detail: `overall ${o}, technical ${t}` };
  });
  await step('C33', 'Open-work markers carry numbers and tooltips and can be switched off', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    const n = await ev(`document.querySelectorAll('.work-markers > g').length`);
    await b.click('[data-fk="work"]'); await b.wait(150);
    const n2 = await ev(`document.querySelectorAll('.work-markers > g').length`);
    return n >= 1 && n2 === 0;
  });

  // ---------------- Admin ----------------
  await step('C34', 'Admin catalogue: 16 main, 43 sub, 41 active, 048/063 inactive, no main 10, 061 Spreader, 062 Headblock, original labels visible', async () => {
    await go('admin', '/admin/catalog');
    const t = await text('main');
    const c = await ev(`({m:EQ.catalog.mains.length, s:EQ.catalog.subs.length, a:EQ.catalog.subs.filter(x=>x.active).length, res:EQ.catalog.subs.filter(x=>!x.active).map(x=>x.code), ten:EQ.catalog.mains.some(x=>x.code==='10'), strs:EQ.catalog.subs.every(x=>typeof x.code==='string')})`);
    const rowText = await ev(`[...document.querySelectorAll('tr')].filter(r=>/^06[12]/.test(r.textContent)).map(r=>r.textContent)`);
    const r1 = await ev(`EQ.api.setCatalogActive('048',true).code`);
    return { ok: c.m === 16 && c.s === 43 && c.a === 41 && c.res.join() === '048,063' && !c.ten && c.strs && /Main 10 intentionally absent/.test(t) && rowText.some((x) => x.includes('Spreader') && x.includes('"lp"')) && rowText.some((x) => x.includes('Headblock')) && r1 === 'reserved_definition', detail: JSON.stringify(c) };
  });
  await step('C35', 'Applicability: edit raises the template revision but changes no installed position, job or history; unknown is not treated as applicable', async () => {
    await go('admin', '/admin/models');
    const r = await ev(`(()=>{const before={pos:EQ.state.D.positions.length,jobs:EQ.state.D.jobs.length,ev:EQ.state.D.events.length,rev:EQ.model('CICT-J526A-STS').templateRevision};
      EQ.api.setApplicability('CICT-J526A-STS','047','applicable'); const after={pos:EQ.state.D.positions.length,jobs:EQ.state.D.jobs.length,ev:EQ.state.D.events.length,rev:EQ.model('CICT-J526A-STS').templateRevision};
      const unknown=EQ.model('CICT-J526A-STS').applic['154']; const q1=EQ.eq('${Q1}').subs.some(s=>s.code==='047'); const tyre=EQ.eq('${Q1}').subs.some(s=>['043','044','045','091'].includes(s.code));
      return {before,after,unknown,q1Has047:q1,qcHasTyreEngine:tyre};})()`);
    return { ok: r.after.rev === r.before.rev + 1 && r.after.pos === r.before.pos && r.after.jobs === r.before.jobs && r.after.ev === r.before.ev && r.unknown === undefined && !r.q1Has047 && !r.qcHasTyreEngine, detail: JSON.stringify(r) };
  });
  await step('C36', 'Admin equipment: duplicate code refused; new equipment is Unreported with no model; retire refused with open jobs; drafts confirm', async () => {
    await go('admin', '/admin/equipment');
    const r = await ev(`(()=>{const dup=EQ.api.createEquipment({code:'qc-demo-01',typeCode:'QC'}); const n=EQ.api.createEquipment({code:'QC-NEW-01',typeCode:'QC'});
      const ret=EQ.api.retireEquipment('${Q1}'); const target=EQ.api.createJob({equipmentId:'eq-qc-demo-03',kind:'repair',title:'t',level:'part',positionId:'pp-q03-007'});
      const conf=EQ.api.confirmPositions('eq-qc-demo-03',['pp-q03-007']); const after=EQ.api.createJob({equipmentId:'eq-qc-demo-03',kind:'repair',title:'t',level:'part',positionId:'pp-q03-007'});
      return {dup:dup.fields&&dup.fields.code, status:n.eq.status, model:n.eq.modelCode, assoc:n.eq.assoc, retire:ret.code, draftTarget:target.fields&&target.fields.target, afterConfirm:after.ok};})()`);
    return { ok: /already exists/.test(r.dup) && r.status === null && r.model === null && r.assoc === 'unassigned' && r.retire === 'equipment_has_open_jobs' && /confirmed/.test(r.draftTarget) && r.afterConfirm === true, detail: JSON.stringify(r) };
  });
  await step('C37', 'Specifications: gantry speed keeps 46 and 45.5 m/min; trolley motor 275 and 270 kW; total lift is not overall height; resolution keeps observations', async () => {
    await go('admin', '/admin/parameters');
    const t = await text('main');
    await ev(`EQ.api.resolveParameter('gantry-speed','46','Technical decision TD-1 (synthetic test)')`);
    await ev(`EQ.nav('/equipment/${Q1}', {main:'mi-q01-04', panel:'technical'})`); await b.wait(400);
    const t2 = await text('.side-panel');
    await ev(`EQ.nav('/equipment/${Q1}', {panel:'technical'})`); await b.wait(400);
    const t3 = await text('.side-panel');
    await ev(`EQ.nav('/equipment/eq-qc-demo-04', {panel:'technical'})`); await b.wait(400);
    const t4 = await text('.side-panel');
    return { ok: /46 m\/min/.test(t) && /45\.5 m\/min/.test(t) && /275 kW/.test(t) && /270 kW/.test(t) && /Unresolved conflict/.test(t) && /Gantry speed/.test(t2) && /Source observations are kept/.test(t2) && /not the overall height of the crane/.test(t3) && /No family parameters/.test(t4), detail: 'conflicts visible before resolution; observations kept after' };
  });
  await step('C38', 'Resolution requires a reason and is Admin-only', async () => {
    await go('eqTeam', '/fleet');
    const a = await ev(`EQ.api.resolveParameter('gantry-speed','46','r').status`);
    await go('admin', '/fleet');
    const b2 = await ev(`EQ.api.resolveParameter('gantry-speed','46','').fields.reason`);
    return a === 403 && /required|Enter/.test(b2);
  });
  await step('C39', 'Bindings preview: exact-key proposals only; RTG/unverified equipment cannot be bound; drafts block activation', async () => {
    await go('admin', '/admin/bindings');
    const t = await text('main');
    await go('admin', '/admin/bindings?equipment=eq-qc-demo-04');
    const t4 = await text('main');
    await go('admin', '/admin/bindings?equipment=eq-qc-demo-03');
    const t3 = await text('main');
    return /exact-key matches/.test(t) && /Pass/.test(t) && /cannot be bound/.test(t4) && /still drafts/.test(t3);
  });

  // ---------------- data states ----------------
  await step('C40', 'Data states: stale keeps last good data with a notice; error shows nothing as Ready; empty and loading handled on fleet, jobs and equipment', async () => {
    await go('eqTeam', '/fleet', { data: 'stale' });
    const stale = await text('main'); const cardsStale = await ev(`document.querySelectorAll('.eq-card').length`);
    await go('eqTeam', '/fleet', { data: 'error' });
    const err = await text('main'); const cardsErr = await ev(`document.querySelectorAll('.eq-card').length`);
    await go('admin', '/fleet', { data: 'empty' }); const empty = await text('main');
    await go('eqTeam', '/fleet', { data: 'loading' }); const busy = await ev(`!!document.querySelector('[aria-busy="true"]')`);
    await go('eqTeam', `/equipment/${Q1}`, { data: 'stale' }); const eqStale = await text('main');
    await go('eqTeam', `/equipment/${Q1}`, { data: 'error' }); const eqErr = await text('main');
    await go('eqTeam', '/jobs', { data: 'error' }); const jErr = await text('main');
    await go('eqTeam', '/jobs', { data: 'empty' }); const jEmpty = await text('main');
    return { ok: /last good data/.test(stale) && cardsStale === 16 && /could not be loaded/.test(err) && cardsErr === 0 && /No equipment is registered/.test(empty) && busy && /last good data/.test(eqStale) && /could not be loaded/.test(eqErr) && /could not be loaded/.test(jErr) && /No jobs yet/.test(jEmpty) };
  });
  await step('C41', 'Prototype does not imply persistence: banner on every page, nothing in browser storage, reload restores fixtures', async () => {
    await go('eqTeam', '/jobs');
    const banner = await text('.proto-banner');
    await ev(`EQ.api.createJob({equipmentId:'${Q2}',kind:'repair',title:'temp',level:'equipment'})`);
    const n1 = await ev('EQ.state.D.jobs.length');
    const stor = await ev('localStorage.length + sessionStorage.length + document.cookie.length');
    await ev('location.reload()'); await b.wait(900);
    const n2 = await ev('EQ.state.D.jobs.length');
    return banner.includes('Synthetic data only') && /no sign-in/.test(banner) && stor === 0 && n2 === n1 - 1;
  });
  await step('C42', 'Only synthetic equipment: every equipment code contains -DEMO- (or the single Admin-registered test code) and records are marked DevelopmentFixture', async () => {
    await go('eqTeam', '/fleet');
    return ev(`EQ.state.D.equipment.every(e=>/-DEMO-/.test(e.code) && e.origin==='DevelopmentFixture')`);
  });

  // ---------------- U1 repair (U1-C01..C03, C05, C07, C08) ----------------
  await step('U1-C01', 'QC type icon is the ship-to-shore crane outline (legs, girder and boom, A-frame with stays, trolley rope and spreader) on QC cards', async () => {
    await go('eqTeam', '/fleet');
    const r = await ev(`(()=>{const c=[...document.querySelectorAll('.eq-card')].find(x=>x.textContent.includes('QC-DEMO-01')); const svg=c&&c.querySelector('.thumb svg'); return svg?svg.innerHTML:''})()`);
    return { ok: /M8\.5 3\.5 22\.5 10/.test(r) && /M17\.5 10v4\.5/.test(r) && /M1\.5 10h21/.test(r), detail: r.slice(0, 160) };
  });
  await step('U1-C02', 'Fleet: no heading block; manual-status / Unreported meaning kept as a compact note; the whole synthetic fleet fits one 1366x768 screen; cards at most 60 px high (P02 cards were about 95 px)', async () => {
    await b.viewport(1366, 768);
    await go('eqTeam', '/fleet');
    const r = await ev(`(()=>{const h1=document.querySelector('main h1, h1'); const note=document.querySelector('[data-fk="status-note"]'); const cards=[...document.querySelectorAll('.eq-card')];
      return {pageHead: !!document.querySelector('.page-head'), eyebrow: [...document.querySelectorAll('.eyebrow')].some(e=>/Fleet overview/i.test(e.textContent)), h1: h1 && h1.className, h1h: h1 && h1.getBoundingClientRect().height,
        note: note && (note.title + ' | ' + note.textContent), cards: cards.length, maxBottom: Math.max(...cards.map(c=>c.getBoundingClientRect().bottom)), maxH: Math.max(...cards.map(c=>c.getBoundingClientRect().height))};})()`);
    const c = await ev('EQ.fleetCounts(EQ.state.D.equipment)');
    await b.viewport(1920, 1080);
    return { ok: !r.pageHead && !r.eyebrow && /sr-only/.test(r.h1) && r.h1h <= 1 && /no live telemetry/.test(r.note) && /Unreported/.test(r.note) && r.cards === c.total && r.maxBottom <= 768 && r.maxH <= 60, detail: JSON.stringify(r) };
  });
  await step('U1-C03', 'Flat schematic: back-reach area, CICT logo (Overall only) and stairs are drawn and selectable', async () => {
    await go('eqTeam', `/equipment/${Q1}`);
    const keys = ['access.platform.girder-tail', 'reeving.anti-snag-tls.device', 'reeving.sheave.girder-tail', 'auxiliary.service-crane.girder-tail', 'access.platform.festoon-cab-service', 'access.stair.landside-leg-b', 'access.stair.a-frame'];
    const r = await ev(`(()=>{const ks=${JSON.stringify(keys)}; const bad=ks.filter(k=>{const e=document.querySelector('[data-key="'+k+'"]'); return !e || e.classList.contains('unbound') || e.getAttribute('tabindex')!=='0'});
      const logo=document.querySelector('.sc-logo'); return {bad, logoW: logo?logo.getBBox().width:0, logoHref: logo&&logo.getAttribute('href'), logoShown: logo?getComputedStyle(logo).display:'none'};})()`);
    await b.click('[data-key="reeving.anti-snag-tls.device"]'); await b.wait(500);
    const hash = await ev('location.hash'); const title = await text('[data-fk="scope-title"]');
    await go('eqTeam', `/equipment/${Q1}?mode=technical`);
    const logoTech = await ev(`getComputedStyle(document.querySelector('.sc-logo')).display`);
    return { ok: r.bad.length === 0 && r.logoW > 2 && r.logoHref === 'img/cict-logo.png' && r.logoShown !== 'none' && logoTech === 'none' && /part=pp-q01-03\d/.test(hash) && /Anti-snag/.test(title), detail: JSON.stringify({ ...r, hash, title, logoTech }) };
  });
  await step('U1-C07', 'Flat drill-down: tier 1 mains, click -> tier 2 subs, click -> tier 3 parts (switches to Technical for internals); tree and URL follow', async () => {
    await go('eqTeam', `/equipment/${Q1}`); await b.wait(300);
    const labels = () => ev(`[...document.querySelectorAll('.sc-label')].map(e=>e.textContent)`);
    const t1 = await labels();
    const expect1 = await ev(`(()=>{const ks=new Set(EQ.sceneKeys()); return [...new Set(EQ.positionsOf('${Q1}').filter(p=>p.state==='active'&&ks.has(p.key)).map(p=>EQ.pos(p.id).mainId))].length})()`);
    await b.click('[data-fk="lbl-mi-q01-01"]'); await b.wait(500);
    const h1 = await ev('location.hash'); const t2 = await labels();
    await b.click('[data-fk="lbl-si-q01-012"]'); await b.wait(500);
    const h2 = await ev('location.hash'); const t3 = await labels();
    const brake = await ev(`EQ.positionsOf('${Q1}').find(p=>p.key==='hoist.emergency.brake.a').id`);
    await b.click('[data-fk="lbl-' + brake + '"]'); await b.wait(500);
    const h3 = await ev('location.hash'); const treeSel = await ev(`document.querySelector('[role=treeitem][aria-selected=true]').dataset.nid`);
    const ok = t1.length === expect1 && t1.some((t) => t.startsWith('01 ')) && h1.includes('main=mi-q01-01') && !/sub=si/.test(h1) && ['011', '012', '013', '015'].every((c) => t2.some((t) => t.startsWith(c + ' ')))
      && h2.includes('sub=si-q01-012') && h2.includes('mode=technical') && t3.some((t) => /emergency brake A/i.test(t)) && h3.includes('part=' + brake) && treeSel === brake;
    return { ok, detail: JSON.stringify({ t1, expect1, t2, t3, h3, treeSel }) };
  });
  await step('U1-C05-C08', 'Flat toolbar parity: Isolate machinery house (switches to Technical, dims the rest, fits the house), Labels on/off, Overall clears isolation', async () => {
    await go('eqTeam', `/equipment/${Q1}`); await b.wait(300);
    await b.click('[data-fk="iso"]'); await b.wait(900);
    const r = await ev(`({hash: location.hash, iso: document.getElementById('scene-svg').classList.contains('iso'), tech: document.getElementById('scene-svg').classList.contains('mode-technical'), vbw: +document.getElementById('scene-svg').getAttribute('viewBox').split(' ')[2], pressed: document.querySelector('[data-fk="iso"]').getAttribute('aria-pressed')})`);
    const n1 = await ev(`document.querySelectorAll('.sc-label').length`);
    await b.click('[data-fk="labels"]'); await b.wait(300); const n0 = await ev(`document.querySelectorAll('.sc-label').length`);
    await b.click('[data-fk="labels"]'); await b.wait(300); const n2 = await ev(`document.querySelectorAll('.sc-label').length`);
    await b.click('[data-fk="mode-overall"]'); await b.wait(400); const h2 = await ev('location.hash');
    return { ok: /iso=1/.test(r.hash) && r.iso && r.tech && r.vbw < 60 && r.pressed === 'true' && n1 > 0 && n0 === 0 && n2 === n1 && !/iso=1/.test(h2) && /mode=overall/.test(h2), detail: JSON.stringify({ ...r, n1, n0, n2, h2 }) };
  });

  // ---------------- responsive ----------------
  const sizes = [[1920, 1080, false], [1366, 768, false], [1024, 768, false], [768, 1024, false], [390, 844, true]];
  for (const [w, h, mob] of sizes) {
    await step('C43-' + w, `Layout ${w}x${h}: no horizontal page overflow on fleet, equipment, jobs, admin; panels ${w >= 1280 ? 'inline' : 'in drawers'}`, async () => {
      await b.viewport(w, h, mob);
      const bad = [];
      for (const [role, r] of [['eqTeam', '/fleet'], ['eqTeam', `/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007&mode=technical`], ['eqTeam', '/jobs'], ['admin', '/admin/positions'], ['eqTeam', '/equipment/eq-rtg-demo-01']]) {
        await go(role, r); await b.wait(300);
        const o = await ev(`({sw:document.documentElement.scrollWidth, iw:window.innerWidth})`);
        if (o.sw > o.iw + 1) bad.push(r + ' overflow ' + o.sw + '>' + o.iw);
      }
      await go('eqTeam', `/equipment/${Q1}?main=mi-q01-01&sub=si-q01-011&part=pp-q01-007`);
      const geo = await ev(`(()=>{const q=(s)=>{const e=document.querySelector(s); const r=e.getBoundingClientRect(); return {x:r.x,w:r.width,vis:getComputedStyle(e).visibility}}; return {tree:q('.tree-panel'), side:q('.side-panel'), vp:q('.viewport'), btn:getComputedStyle(document.querySelector('.drawer-btns')).display};})()`);
      if (w >= 1280) { if (geo.tree.vis !== 'visible' || geo.side.vis !== 'visible' || geo.tree.x < 0 || geo.side.x + geo.side.w > w + 1) bad.push('panels not inline'); if (geo.vp.w < (w >= 1920 ? 800 : 600)) bad.push('viewport too narrow ' + Math.round(geo.vp.w)); }
      else { if (geo.tree.vis !== 'hidden' || geo.side.vis !== 'hidden' || geo.btn === 'none') bad.push('drawers not collapsed'); }
      if (w < 1280) {
        await b.click('[data-fk="open-tree"]'); await b.wait(350);
        const g = await ev(`(()=>{const r=document.querySelector('.tree-panel').getBoundingClientRect(); return {x:r.x, vis:getComputedStyle(document.querySelector('.tree-panel')).visibility};})()`);
        if (g.vis !== 'visible' || g.x < -1) bad.push('tree drawer did not open');
        await b.key('Escape'); await b.wait(300);
        const closed = await ev(`getComputedStyle(document.querySelector('.tree-panel')).visibility`);
        const focus = await ev(`document.activeElement && document.activeElement.dataset.fk`);
        if (closed !== 'hidden' || focus !== 'open-tree') bad.push('Esc/focus return failed: ' + closed + ' ' + focus);
      }
      return { ok: bad.length === 0, detail: bad.join('; ') + ` viewport ${Math.round(geo.vp.w)}px` };
    });
  }
  await b.viewport(1920, 1080);
  await step('C44', 'Phone width: fleet cards single column, dialogs full-screen, 3D preview optional (job form usable)', async () => {
    await b.viewport(390, 844, true);
    await go('eqTeam', '/fleet');
    const cols = await ev(`new Set([...document.querySelectorAll('.eq-card')].map(c=>Math.round(c.getBoundingClientRect().x))).size`);
    await go('eqTeam', '/jobs'); await b.click('[data-fk="add-job"]'); await b.wait(300);
    const d = await ev(`(()=>{const r=document.querySelector('dialog').getBoundingClientRect(); return {w:r.width,h:r.height};})()`);
    await b.viewport(1920, 1080);
    return { ok: cols === 1 && d.w >= 389 && d.h >= 843, detail: `cols ${cols}, dialog ${d.w}x${d.h}` };
  });
} finally {
  await b.close();
  fs.mkdirSync('docs/evidence/P02', { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ generated: new Date().toISOString(), base, results }, null, 1));
  const f = results.filter((r) => r.status === 'FAIL').length;
  console.log('\n' + results.length + ' checks, ' + f + ' failed');
  process.exitCode = f ? 1 : 0;
}
