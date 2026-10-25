// U1 round 6 repair checks (U1-C23..U1-C26) against the synthetic prototypes (headless Chrome through the DevTools protocol).
// Needs both servers serving from disk:
//   node artifacts/prototypes/p02-ui/serve.mjs         (http://127.0.0.1:5312/)
//   node artifacts/prototypes/p03-qc-model/serve.mjs   (http://127.0.0.1:5313/)
// Usage: node tools/p02b/check_u1_r6.mjs [p02Url] [p03Url] [outJson] [--only=R6-01,R6-05] [--manifest=path]
// The before-reproduction ran the same script against a `git archive HEAD` copy served on other ports.
// PROTOTYPE-LEVEL evidence only: synthetic in-memory data, persona switch instead of sign-in, no persistence, no CMMS contact.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p03/cdp.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const P02 = args[0] || 'http://127.0.0.1:5312/';
const P03 = args[1] || 'http://127.0.0.1:5313/';
const outFile = args[2] || 'docs/evidence/U1/repair-r6/u1-r6-checks.json';
const manifestFile = (process.argv.find((a) => a.startsWith('--manifest=')) || '').slice(11) || 'artifacts/models/cict-j526a-sts-scene/1/manifest.json'; // the before-run passes the committed manifest
const results = [];
const rec = (id, covers, name, ok, detail) => { results.push({ id, covers, name, status: ok ? 'PASS' : 'FAIL', detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '') }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + name + (detail ? ' - ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 900) : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const Q1 = 'eq-qc-demo-01';

// preflight: never record results from stopped servers
for (const u of [P02, P03]) { try { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); } catch (e) { console.error('Server not reachable: ' + u + ' (' + e.message + '). Start it first; nothing written.'); process.exit(2); } }

const b = await launch({ gpu: 'swiftshader', port: 9376 });
const ev = (expr) => b.eval(expr);
const go = async (role, hash, wait = 650) => { b.clearEvents(); await b.goto(P02 + '?role=' + role + '#' + hash); await b.wait(wait); };
const text = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})||{}).textContent||''`);
const exists = (sel) => ev(`!!document.querySelector(${JSON.stringify(sel)})`);
const step = async (id, covers, name, fn) => { if (only.length && !only.some((o) => id.startsWith(o))) return; try { const r = await fn(); rec(id, covers, name, r === true || (r && r.ok), r && r.detail); } catch (e) { rec(id, covers, name, false, 'EXCEPTION ' + e.message); } };
const asRole = (r) => `EQ.state.role=${JSON.stringify(r)}; EQ.access.refreshSession('check');`;
const panelNums = () => ev(`[...document.querySelectorAll('.side-panel .sp-body ul.tl > li')].map(li=>(li.querySelector('.row > :first-child')||{}).textContent)`);
const SCOPES = [['whole', '', "{level:'equipment',id:null}"], ['main 01', 'main=mi-q01-01', "{level:'main',id:'mi-q01-01'}"], ['sub 011', 'main=mi-q01-01&sub=si-q01-011', "{level:'sub',id:'si-q01-011'}"], ['part 007', 'main=mi-q01-01&sub=si-q01-011&part=pp-q01-007', "{level:'part',id:'pp-q01-007'}"]];

try {
  console.log('Browser:', b.browser);
  await b.viewport(1920, 1080);

  // ------------------------------------------------------------- U1-C23
  await step('R6-01', ['U1-C23', 'S07', 'HIS02', 'HIS06', 'U1-C19'], 'Crane-view Projects/Special lists open AND completed special jobs of the selection (whole crane all; mechanism with descendants, de-duplicated; part exact), newest first; cancelled jobs are counted, not listed; completed cards show only the completion date (no note, correction or installation details)', async () => {
    const res = [];
    for (const eqId of [Q1, 'eq-qc-demo-02']) for (const [label, qs, scope] of (eqId === Q1 ? SCOPES : [SCOPES[0]])) {
      await go('eqTeam', `/eq/equipment/${eqId}?${qs}${qs ? '&' : ''}panel=special`, 650);
      const want = await ev(`(()=>{const H=EQ.history('${eqId}',${scope},true); const rows=[...H.open,...H.completed]; return {listed:rows.filter(r=>!r.job.isCancelled).map(r=>r.job.number).sort(), completed:H.completed.filter(r=>!r.job.isCancelled).length, cancelled:rows.filter(r=>r.job.isCancelled).length, open:H.open.filter(r=>!r.job.isCancelled).length}})()`);
      const cs = await ev(`(()=>{const c=EQ.currentSpecial('${eqId}',${scope}); return {order:c.jobs.map(r=>r.job.number), dates:c.jobs.map(r=>r.job.listedOn), counts:c.counts}})()`);
      const got = await panelNums();
      const txt = await text('.side-panel .sp-body');
      const tags = await ev(`[...document.querySelectorAll('.side-panel [role=group] .tag')].map(t=>t.textContent)`);
      const sorted = cs.dates.every((d, i) => i === 0 || cs.dates[i - 1] >= d);
      const nCompletedCards = await ev(`[...document.querySelectorAll('.side-panel .sp-body ul.tl > li')].filter(li=>/Completed on /.test(li.textContent)).length`);
      const leak = /Completion note|Correction|Corrected \d|installed |removed item|serial /i.test(txt);
      res.push({ eqId, label, want: want.listed.length, got: got.length, same: JSON.stringify([...got].sort()) === JSON.stringify(want.listed), uniq: new Set(got).size === got.length, domOrder: JSON.stringify(got) === JSON.stringify(cs.order), sorted, completedCards: nCompletedCards, wantCompleted: want.completed, tags, tagsOk: tags[0] === want.open + ' open' && tags[1] === want.completed + ' completed' && tags[2] === want.cancelled + ' cancelled', leak });
    }
    const whole = res[0];
    const ok = res.every((r) => r.same && r.uniq && r.domOrder && r.sorted && r.completedCards === r.wantCompleted && r.tagsOk && !r.leak) && whole.wantCompleted >= 1 && whole.want > whole.wantCompleted && res.some((r) => /cancelled/.test(r.tags[2]) && !r.tags[2].startsWith('0'));
    return { ok, detail: res };
  });

  await step('R6-02', ['U1-C23', 'HIS06', 'S07', 'ACC02'], 'Projects/Special payload stays the CurrentSpecialJob allowlist for completed and reopened jobs (adds only completedOn and listedOn; matching positions as IDs); a reopened job is listed as open with no completion date while its Jobs-tab history is kept; with EQ Jobs switched off the list still shows and job numbers are plain text', async () => {
    await go('admin', `/eq/equipment/${Q1}?panel=special`, 600);
    const KEYS = ['id', 'number', 'equipmentId', 'level', 'mainId', 'subId', 'positionId', 'kind', 'title', 'workStatus', 'plannedOn', 'completedOn', 'listedOn'].sort();
    const r = await ev(`(()=>{const reo=EQ.api.reopenJob('job-101','R6-02: prior completion stays in Jobs history').ok;
      const c=EQ.currentSpecial('${Q1}',{level:'equipment',id:null});
      return {reo, keys:[...new Set(c.jobs.map(x=>JSON.stringify(Object.keys(x.job).sort())))], lineKeys:[...new Set(c.jobs.flatMap(x=>x.matchingLines.map(l=>JSON.stringify(Object.keys(l)))))],
        completed:c.jobs.filter(x=>x.job.workStatus==='completed').map(x=>[x.job.number,x.job.completedOn]), reopened:c.jobs.find(x=>x.job.id==='job-101')&&c.jobs.find(x=>x.job.id==='job-101').job,
        detached:(()=>{const x=c.jobs.find(x=>x.job.id==='job-102'); return !!x && x.job!==EQ.job('job-102');})(),
        sourceKept:!!EQ.job('job-101').completedOn && !!EQ.job('job-101').completionNote && EQ.job('job-101').events.some(e=>e.kind==='reopened')};})()`);
    // Management with EQ Jobs switched off: the crane tab still lists open and completed jobs as plain numbers
    await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'management',feature:'eq.jobs.view',on:false}], EQ.state.D.access.version,'check R6-02');})()`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/equipment/${Q1}',{panel:'special'})`); await b.wait(600);
    const off = await ev(`({nums:[...document.querySelectorAll('.side-panel [data-fk^="job-num-"]')].map(e=>e.textContent), links:[...document.querySelectorAll('.side-panel a')].filter(a=>(a.getAttribute('href')||'').includes('eq/jobs')).length, completed:[...document.querySelectorAll('.side-panel .sp-body ul.tl > li')].filter(li=>/Completed on /.test(li.textContent)).length})`);
    await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'management',feature:'eq.jobs.view',on:true}], EQ.state.D.access.version,'restore'); EQ.access.refreshSession('restore');})()`);
    const ok = r.reo && r.keys.length === 1 && r.keys[0] === JSON.stringify(KEYS) && r.lineKeys.every((k) => k === '["positionId"]') && r.completed.length >= 1 && r.completed.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c[1]))
      && r.reopened && r.reopened.workStatus === 'current' && r.reopened.completedOn === null && r.detached && r.sourceKept && off.nums.length >= 3 && off.links === 0 && off.completed >= 1;
    return { ok, detail: { ...r, keys: r.keys.map((k) => JSON.parse(k).length + ' keys'), off } };
  });

  // ------------------------------------------------------------- U1-C24
  await step('R6-03', ['U1-C24', 'S27', 'FDB02', 'FDB01'], 'FAC Dashboard lanes list every active job: jobs completed earlier and not yet due again are listed last as "Done · up to date" with their next due date (not hidden); group order Overdue, On hold, In progress, Due soon, Pending, Completed in the last 7 days, Up to date; filters and the completed KPI focus still apply', async () => {
    await go('management', '/fac/dashboard', 1500);
    const m = await ev(`(()=>{const F=EQ.fac, d=F.dashboard({}); const G=F.GROUPS; return {groups:G, lanes:d.lanes.map(l=>({code:l.code,total:l.total,rows:l.rows.length, order:l.rows.every((r,i)=>i===0||G.indexOf(l.rows[i-1].group)<=G.indexOf(r.group)), upto:l.rows.filter(r=>r.group==='upToDate').map(r=>({status:r.status,due:r.dueLabel,overdue:r.overdue,dueSoon:r.dueSoon}))})),
      kpiActive:d.kpi.active, civil:F.dashboard({discipline:'civil'}).lanes.map(l=>[l.code,l.total,l.rows.length]), focus:F.dashboard({focus:'completed'}).lanes.reduce((a,l)=>a+l.rows.filter(r=>r.group==='upToDate').length,0), focusOther:F.dashboard({focus:'overdue'}).lanes.reduce((a,l)=>a+l.rows.filter(r=>r.group==='upToDate').length,0)}})()`);
    const dom = await ev(`({pills:[...document.querySelectorAll('.lane-list:not(.dup) .frow.g-upto .pill')].map(p=>p.textContent), dues:[...document.querySelectorAll('.lane-list:not(.dup) .frow.g-upto .due')].map(p=>p.textContent), counts:[...document.querySelectorAll('.lane-count')].map(c=>c.textContent)})`);
    const upto = m.lanes.flatMap((l) => l.upto);
    const ok = m.groups.join() === 'overdue,onHold,inProgress,dueSoon,pending,recent,upToDate' && m.lanes.every((l) => l.rows === l.total && l.order) && upto.length >= 1 && upto.every((u) => u.status === 'completed' && !u.overdue && !u.dueSoon && /^(Next due|No due date|Done)/.test(u.due))
      && m.lanes.reduce((a, l) => a + l.rows, 0) === m.kpiActive && m.civil.length === 1 && m.civil[0][1] === m.civil[0][2] && m.focus === upto.length && m.focusOther === 0
      && dom.pills.length === upto.length && dom.pills.every((p) => /Done · up to date/.test(p)) && dom.dues.every((d) => /Next due|No due date/.test(d)) && dom.counts.every((c) => { const [a, t] = c.match(/\d+/g).map(Number); return a === t; });
    return { ok, detail: { lanes: m.lanes.map((l) => ({ code: l.code, total: l.total, rows: l.rows, order: l.order, upToDate: l.upto.length })), kpiActive: m.kpiActive, civil: m.civil, focusCompletedUpToDate: m.focus, focusOverdueUpToDate: m.focusOther, dom: { pills: dom.pills.length, sample: dom.pills.slice(0, 2), dues: dom.dues.slice(0, 3), counts: dom.counts } } };
  });

  // ------------------------------------------------------------- U1-C25, position rule replaced by U1-C27 (U1 round 7)
  await step('R6-04', ['U1-C25', 'U1-C27', 'U1-C08', 'VIS03'], 'Flat view (U1 round 7 rule, U1-C27): the 013 load cell is an in-line part at the boom tip end: the horizontal main hoist rope line ends in the load-cell body (rope height inside the body), and the part lies within 1.2 m of the boom end; labelled "boom tip end", approximate; no longer about 2.6 m inboard', async () => {
    await go('eqTeam', `/eq/equipment/${Q1}?mode=technical&main=mi-q01-01&sub=si-q01-013`, 900);
    const r = await ev(`(()=>{const g=document.querySelector('[data-key="hoist.loadcell.main"]'); if(!g) return null; const rope=[...document.querySelectorAll('[data-key="hoist.rope.set.main"] line')].map(l=>[+l.getAttribute('x1'),+l.getAttribute('y1'),+l.getAttribute('x2'),+l.getAttribute('y2')]).filter(l=>l[2]-l[0]>20 && l[0]>80 && (l[1]||l[3]) && l[2]>115)[0];
      const body=g.querySelector('rect.sc-tech'); const bx=+body.getAttribute('x'), bw=+body.getAttribute('width'), by=+body.getAttribute('y'), bh=+body.getAttribute('height'); const boom=document.querySelector('[data-key="boom.main.girder"] rect'); const boomEnd=boom? +boom.getAttribute('x') + +boom.getAttribute('width') : null;
      const ry=rope? rope[3] : null; const bb=g.getBBox(); const x0=bb.x, x1=bb.x+bb.width;
      return {title:g.querySelector('title').textContent, rope, body:[bx,by,bw,bh], ropeEndY:ry, ropeMeets: !!rope && rope[2]>=x0-0.05 && rope[2]<=bx+0.05 && ry>=by && ry<=by+bh, boomEnd, x0:+x0.toFixed(2), x1:+x1.toFixed(2), bound:!g.classList.contains('unbound'), endDist:+(boomEnd!=null? boomEnd-(bx+bw/2) : 99).toFixed(2)};})()`);
    const ok = r && r.ropeMeets && r.boomEnd != null && r.x1 <= r.boomEnd + 0.05 && r.x0 >= r.boomEnd - 1.2 && r.endDist > 0 && r.endDist < 1 && /horizontal hoist rope/i.test(r.title) && /boom tip end/i.test(r.title) && /approx/i.test(r.title) && /Location approximate/.test(r.title) && r.bound;
    return { ok, detail: r };
  });

  await step('R6-05', ['U1-C25', 'U1-C27', 'VIS01', 'VIS02', 'VIS09', 'S04'], '3D model (U1 round 7 rule, U1-C27; draft v1 rev 6): the 013 hotspot sits at the boom tip end, in-line on the horizontal cross-over of the main hoist ropes (point 0.3 m inboard of the tip at the cross-over height, bounds within 1.2 m of the tip, both rope sides, within the boom width, the hoist rope set reaches the point), labelled "boom tip end" and approximate, technical mode; moved outboard of the round 6 point when compared with a committed revision 5; the key set, kinds and classification are unchanged against the committed revision; the 3D page selects it', async () => {
    const M = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const n = M.nodes.find((x) => x.key === 'hoist.loadcell.main'); const L = M.landmarks || {};
    const tipX = 75.9, gTop = n ? n.hotspot.point[1] - 1.1 : 0;
    let base = null; try { base = JSON.parse((await import('node:child_process')).execFileSync('git', ['show', 'HEAD:artifacts/models/cict-j526a-sts-scene/1/manifest.json'], { encoding: 'utf8', maxBuffer: 64 << 20 })); } catch { base = null; }
    const idOf = (m) => m.nodes.map((x) => [x.key, x.kind, x.classification ? x.classification.sub : null, x.positionKind, JSON.stringify(x.instancing)].join('|')).sort().join('\n');
    const sameIdentity = base ? idOf(base) === idOf(M) : null;
    const baseNode = base && base.nodes.find((x) => x.key === 'hoist.loadcell.main');
    const pt = n.hotspot.point;
    await b.viewport(1600, 1000); await b.goto(P03 + '?eq=eq-qc-demo-01&sub=si-q01-013&mode=technical');
    for (let i = 0; i < 80; i++) { if (await ev('!!(window.__qcTiming || window.__qcFallback)')) break; await sleep(250); }
    await sleep(600);
    const page = await ev(`({sel:[...document.querySelectorAll('#tree [aria-selected=true]')].map(e=>e.textContent.trim()).join('|'), crumbs:(document.querySelector('#crumbs')||{}).textContent||'', label:(window.__qc.manifest.nodes.find(x=>x.key==='hoist.loadcell.main')||{}).label, fallback:!!window.__qcFallback})`);
    const errs = b.errors();
    const rope = M.nodes.find((x) => x.key === 'hoist.rope.set.main'); const gTopTip = (M.nodes.find((x) => x.key === 'reeving.sheave.boom-tip') || { bounds: { min: [0, 0] } }).bounds.min[1];
    const moved = !baseNode || (base.revision < M.revision ? pt[0] > baseNode.hotspot.point[0] + 1.5 : JSON.stringify(baseNode.hotspot.point) === JSON.stringify(pt));
    const ok = n && n.kind === 'hotspot' && n.classification.sub === '013' && n.modes.join() === 'technical' && /horizontal main hoist rope at the boom tip end/.test(n.label) && /approximate/i.test(n.qualifier)
      && Math.abs(pt[0] - (tipX - 0.3)) < 0.05 && Math.abs(pt[1] - (gTopTip + 0.6)) < 0.05 && n.bounds.min[0] > tipX - 1.2 && n.bounds.max[0] < tipX && pt[1] > n.bounds.min[1] && pt[1] < n.bounds.max[1] && n.bounds.min[2] < -1.3 && n.bounds.max[2] > 1.3 && n.bounds.min[2] > -3 && n.bounds.max[2] < 3 && rope.bounds.max[0] >= pt[0] && rope.bounds.max[0] < pt[0] + 0.2
      && moved && M.revision >= 6 && sameIdentity === true && /horizontal main hoist rope at the boom tip end/.test(page.label) && !page.fallback && !errs.length;
    return { ok, detail: { point: pt, bounds: n.bounds, basePoint: baseNode && baseNode.hotspot.point, baseRevision: base && base.revision, moved, ropeMaxX: rope && rope.bounds.max[0], gTopTip, revision: M.revision, sameIdentity, nodes: M.nodes.length, label: n.label, page: { ...page, crumbs: page.crumbs.slice(0, 80) }, errors: errs.slice(0, 3), landmarksKeys: Object.keys(L).length } };
  });

  // ------------------------------------------------------------- U1-C26 special jobs
  await step('R6-06', ['U1-C26', 'S07', 'S02', 'ACC03', 'AUTH03', 'HIS06'], 'Special job "Show on dashboard / 3D" (simulated server): EQ Team and Admin switch any special job (also completed), Management and FAC Team are refused (403, nothing changed), a stale version is 409; a hidden job leaves the crane panel list and counts, the tree/label work badges and the fleet-card count, and stays in the Jobs tab, the scoped history and the export; audited with the previous value; default shown', async () => {
    await go('eqTeam', '/eq/fleet', 600);
    const r = await ev(`(()=>{const A=EQ.api, st=(x)=>x&&[x.status,x.code], out={};
      out.defaultShown=EQ.state.D.jobs.every(j=>j.showOnDashboard===true);
      const j=EQ.job('job-104'); const pid=j.positionId; const sc={level:'part',id:pid}, eqs={level:'equipment',id:null};
      const snap=()=>({list:EQ.currentSpecial('${Q1}',eqs).jobs.map(x=>x.job.number), cnt:EQ.currentSpecial('${Q1}',eqs).counts, part:EQ.openCount('${Q1}',sc), fleet:EQ.shownOpenJobs('${Q1}').length, hist:EQ.history('${Q1}',eqs,false).open.map(r=>r.job.number), jobs:EQ.readJobs().items.some(x=>x.id==='job-104'), exp:EQ.eqExport('special',{}).rows.find(x=>x[0]===j.number)});
      const s0=snap(); const v0=j.version;
      ${asRole('management')} out.mgmt=st(A.setJobVisibility('job-104',{show:false,version:j.version})); ${asRole('facTeam')} out.fac=st(A.setJobVisibility('job-104',{show:false,version:j.version}));
      out.refusedNothing=j.showOnDashboard===true && j.version===v0;
      ${asRole('eqTeam')} out.stale=st(A.setJobVisibility('job-104',{show:false,version:v0-1})); out.staleNothing=j.showOnDashboard===true;
      const h=A.setJobVisibility('job-104',{show:false,version:v0,reason:'not for the TV board'}); const s1=snap();
      out.hide={ok:h.ok, flag:j.showOnDashboard, version:j.version, audit:EQ.state.D.audit[0], event:j.events[j.events.length-1].kind, workUnchanged:j.workStatus==='current'};
      out.before=s0; out.after=s1;
      ${asRole('admin')} const c=A.setJobVisibility('job-102',{show:false}); out.completedHidden=c.ok && !EQ.currentSpecial('${Q1}',eqs).jobs.some(x=>x.job.id==='job-102') && EQ.history('${Q1}',eqs,false).completed.some(r=>r.job.id==='job-102');
      const back=A.setJobVisibility('job-104',{show:true}); A.setJobVisibility('job-102',{show:true}); out.restored=back.ok && EQ.currentSpecial('${Q1}',eqs).jobs.length===s0.list.length && EQ.openCount('${Q1}',sc)===s0.part;
      out.auditTrail=EQ.state.D.audit.filter(a=>a.action==='job.display').map(a=>[a.entity,a.before.showOnDashboard,a.after.showOnDashboard,a.by]);
      return out;})()`);
    const b0 = r.before, a1 = r.after;
    const ok = r.defaultShown && r.mgmt[0] === 403 && r.mgmt[1] === 'forbidden_role' && r.fac[0] === 403 && r.refusedNothing && r.stale[0] === 409 && r.staleNothing
      && r.hide.ok && r.hide.flag === false && r.hide.audit.action === 'job.display' && r.hide.audit.before.showOnDashboard === true && r.hide.audit.after.showOnDashboard === false && r.hide.audit.reason === 'not for the TV board' && /hidden/.test(r.hide.event) && r.hide.workUnchanged
      && b0.list.includes('EQJ-2026-000104') && !a1.list.includes('EQJ-2026-000104') && a1.cnt.current === b0.cnt.current - 1 && b0.part >= 1 && a1.part === b0.part - 1 && a1.fleet === b0.fleet - 1
      && a1.hist.includes('EQJ-2026-000104') && a1.jobs && a1.exp && a1.exp[a1.exp.length - 1] === 'No' && b0.exp[b0.exp.length - 1] === 'Yes' && r.completedHidden && r.restored && r.auditTrail.length === 4;
    return { ok, detail: r };
  });

  await step('R6-07', ['U1-C26', 'S07', 'S02', 'U1-C08'], 'Special job switch on screens: the job record offers "Show on dashboard / 3D" to EQ Team (switch) and shows the state read-only to Management; switching it off removes the job from the flat crane panel, the tree badge and the fleet card, adds a "Hidden from dashboard / 3D" tag in the Jobs tab; the 3D page hides it from its Projects/Special tab and label badges the same way', async () => {
    await go('eqTeam', '/eq/jobs/special/job-104', 700);
    const sw = { has: await exists('[data-fk="vis-job-104"]'), checked: await ev(`(document.querySelector('[data-fk="vis-job-104"]')||{}).checked`), role: await ev(`(document.querySelector('[data-fk="vis-job-104"]')||{getAttribute(){}}).getAttribute('role')`) };
    await go('eqTeam', `/eq/fleet`, 600); const card0 = await ev(`(document.querySelector('a.eq-card[href$="${Q1}"] .meta')||{}).textContent||''`);
    await go('eqTeam', '/eq/jobs/special/job-104', 700);
    await b.click('[data-fk="vis-job-104"]'); await b.wait(500);
    const after = { checked: await ev(`document.querySelector('[data-fk="vis-job-104"]').checked`), tag: await exists('[data-fk="hidden-tag"]'), flag: await ev(`EQ.job('job-104').showOnDashboard`) };
    await ev(`EQ.nav('/eq/jobs/special',{equipment:'${Q1}'})`); await b.wait(500); const boardTag = await ev(`[...document.querySelectorAll('.job')].filter(j=>/EQJ-2026-000104/.test(j.textContent)).map(j=>!!j.querySelector('[data-fk="hidden-tag"]'))`);
    await ev(`EQ.nav('/eq/equipment/${Q1}',{main:'mi-q01-01',sub:'si-q01-011',part:'pp-q01-008',panel:'special'})`); await b.wait(600);
    const crane = { nums: await panelNums(), badge: await ev(`(document.querySelector('[data-nid="pp-q01-008"] .jobs')||{}).textContent||''`) };
    await ev(`EQ.nav('/eq/fleet',{})`); await b.wait(500); const card1 = await ev(`(document.querySelector('a.eq-card[href$="${Q1}"] .meta')||{}).textContent||''`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/eq/jobs/special/job-104',{})`); await b.wait(500);
    const mgmt = { sw: await exists('[data-fk="vis-job-104"]'), state: await text('[data-fk="vis-state-job-104"]') };
    const errs = b.errors();
    // 3D page: same rule through the shared data layer (in-memory per page, so the switch is applied there by the simulated Admin call)
    await b.viewport(1600, 1000); b.clearEvents(); await b.goto(P03 + '?eq=eq-qc-demo-01&part=' + 'pp-q01-008' + '&panel=special');
    for (let i = 0; i < 80; i++) { if (await ev('!!(window.__qcTiming || window.__qcFallback)')) break; await sleep(250); }
    await sleep(500);
    const p3pid = await ev(`(()=>{const p=window.__qc.positions().find(p=>p.semanticKey===EQ.pos('pp-q01-008').key); return p?p.id:null})()`);
    const s3 = await ev(`(()=>{const sc={level:'part',id:'pp-q01-008'}; const before={open:EQ.openCount('eq-qc-demo-01',sc), listed:EQ.currentSpecial('eq-qc-demo-01',{level:'equipment',id:null}).jobs.map(x=>x.job.number)};
      EQ.state.role='admin'; EQ.access.refreshSession('check'); const r=EQ.api.setJobVisibility('job-104',{show:false}); EQ.state.role='management'; EQ.access.refreshSession('check');
      return {before, ok:r.ok, after:{open:EQ.openCount('eq-qc-demo-01',sc), listed:EQ.currentSpecial('eq-qc-demo-01',{level:'equipment',id:null}).jobs.map(x=>x.job.number)}}})()`);
    await ev(`window.__qc.select({part:${JSON.stringify(p3pid)}})`); await sleep(500);
    const p3txt = await ev(`document.querySelector('#info').innerText`);
    const p3errs = b.errors();
    const ok = sw.has && sw.checked === true && sw.role === 'switch' && after.checked === false && after.tag && after.flag === false && boardTag.length === 1 && boardTag[0]
      && !crane.nums.includes('EQJ-2026-000104') && crane.badge === '' && /(\d+) open/.test(card0) && Number(card1.match(/(\d+) open/)[1]) === Number(card0.match(/(\d+) open/)[1]) - 1
      && !mgmt.sw && /Hidden/.test(mgmt.state) && !errs.length
      && s3.ok && s3.before.open === 1 && s3.after.open === 0 && s3.before.listed.includes('EQJ-2026-000104') && !s3.after.listed.includes('EQJ-2026-000104') && !/EQJ-2026-000104/.test(p3txt) && !p3errs.length;
    return { ok, detail: { sw, after, boardTag, crane, card0: card0.slice(0, 60), card1: card1.slice(0, 60), mgmt, errs: errs.slice(0, 3), p3: { pid: p3pid, ...s3, text: p3txt.slice(0, 160), errs: p3errs.slice(0, 3) } } };
  });

  // ------------------------------------------------------------- U1-C26 FAC jobs
  await step('R6-08', ['U1-C26', 'S27', 'S28', 'FDB01', 'FAC11', 'ACC03', 'AUTH03'], 'FAC job "Show on dashboard" (simulated server): FAC Team and Admin switch any FAC job (recurring, one-time, continuous), EQ Team and Management are refused; a hidden job leaves every dashboard block (KPIs, lanes, ticker, latest proof, due load, on-time basis) and the dashboard-only detail (404); it stays in FAC Jobs, its timeline and the export; data version bumps; audited; default shown', async () => {
    await go('facTeam', '/fac/jobs', 700);
    const r = await ev(`(()=>{const F=EQ.fac, A=F.api, D=EQ.state.D.fac, st=(x)=>x&&[x.status,x.code], out={};
      out.defaultShown=D.jobs.every(j=>j.showOnDashboard===true);
      out.kinds=[...new Set(D.jobs.map(j=>j.kind))];
      // a job that feeds the ticker / proof: the most recent active progress update with a photo
      const withProof=D.jobs.filter(j=>j.state==='active' && j.updates.some(u=>u.state==='active' && u.photos.some(p=>p.state==='active'))).sort((a,b)=>EQ.cmp(b.updates[b.updates.length-1].recordedUtc,a.updates[a.updates.length-1].recordedUtc))[0];
      const due=D.jobs.find(j=>j.state==='active' && j.kind==='recurring' && F.info(j).dueOn && !F.info(j).overdue && !F.info(j).cycle.completed && !F.isPeriod(j) && j!==withProof);
      const oneTime=D.jobs.find(j=>j.kind==='oneTime'); const cont=D.jobs.find(j=>j.kind==='continuous');
      const dash=(q)=>F.dashboard(q||{}); const inLanes=(d,id)=>d.lanes.some(l=>l.rows.some(x=>x.id===id));
      const load=(d)=>d.dueLoad.reduce((a,w)=>a+w.electrical+w.mechanical+w.civil,0);
      const d0=dash(); const v0=D.version;
      ${asRole('eqTeam')} out.eq=st(A.setVisibility(withProof.id,{show:false})); ${asRole('management')} out.mgmt=st(A.setVisibility(withProof.id,{show:false}));
      out.refusedNothing=withProof.showOnDashboard===true && D.version===v0;
      ${asRole('facTeam')}
      const h1=A.setVisibility(withProof.id,{show:false,reason:'pilot area'}); const h2=A.setVisibility(due.id,{show:false});
      const d1=dash();
      out.hide={ok:h1.ok&&h2.ok, version:D.version-v0, audit:D.audit[0].action, auditBefore:D.audit[0].before, edit:withProof.edits[0].changes[0]};
      out.kpi=[d0.kpi.active,d1.kpi.active]; out.lanes=[inLanes(d0,withProof.id),inLanes(d1,withProof.id),inLanes(d0,due.id),inLanes(d1,due.id)];
      out.ticker=[d0.ticker.some(t=>t.jobId===withProof.id), d1.ticker.some(t=>t.jobId===withProof.id)]; out.proof=[d0.proof.some(p=>p.jobId===withProof.id), d1.proof.some(p=>p.jobId===withProof.id)];
      out.dueLoad=[load(d0),load(d1)]; out.onTime=[d0.kpi.onTimeN,d1.kpi.onTimeN];
      out.list=F.list({}).rows.some(x=>x.job.id===withProof.id); out.exp=F.exportRows({}).rows.find(x=>x[16]===withProof.number); out.expCol=F.exportRows({}).columns.slice(-1)[0];
      ${asRole('admin')} out.admin=[A.setVisibility(oneTime.id,{show:false}).ok, A.setVisibility(cont.id,{show:false}).ok, A.setVisibility(oneTime.id,{show:true}).ok, A.setVisibility(cont.id,{show:true}).ok];
      // dashboard-only reader: Management with FAC Jobs off
      EQ.access.save([{role:'management',feature:'fac.jobs.view',on:false}], EQ.state.D.access.version,'check R6-08');
      ${asRole('management')} out.dashDetailHidden=st(F.detail(withProof.id)); out.dashDetailShown=F.detail(d1.lanes[0].rows[0].id).ok;
      ${asRole('admin')} EQ.access.save([{role:'management',feature:'fac.jobs.view',on:true}], EQ.state.D.access.version,'restore');
      out.ids=[withProof.id, due.id];
      return out;})()`);
    const ok = r.defaultShown && r.kinds.length === 3 && r.eq[0] === 403 && r.eq[1] === 'forbidden_role' && r.mgmt[0] === 403 && r.refusedNothing && r.hide.ok && r.hide.version === 2 && r.hide.audit === 'fac.job.display' && r.hide.auditBefore.showOnDashboard === true && r.hide.edit.field === 'Show on dashboard' && r.hide.edit.after === 'Hidden'
      && r.kpi[1] === r.kpi[0] - 2 && r.lanes.join() === 'true,false,true,false' && r.ticker[0] && !r.ticker[1] && r.proof[0] && !r.proof[1] && r.dueLoad[1] === r.dueLoad[0] - 1 && r.onTime[1] <= r.onTime[0]
      && r.list && r.exp && r.exp[r.exp.length - 1] === 'No' && r.expCol === 'Shown on dashboard' && r.admin.every(Boolean) && r.dashDetailHidden[0] === 404 && r.dashDetailShown;
    return { ok, detail: r };
  });

  await step('R6-09', ['U1-C26', 'S27', 'S28', 'S19', 'ACC01'], 'FAC screens: the FAC job detail offers the "Show on dashboard" switch to FAC Team and Admin and shows the state read-only to EQ Team and Management; switching it off makes the job disappear from the Management dashboard and TV mode (shared setting) and tags it "Hidden from dashboard" in FAC Jobs; the Access matrix names the right in the EQ work and FAC work rows; no console errors', async () => {
    await go('facTeam', '/fac/jobs', 700);
    const id = await ev(`EQ.fac.dashboard({}).lanes[2].rows[0].id`);
    await ev(`EQ.nav('/fac/jobs/${id}',{})`); await b.wait(500);
    const fsw = { has: await exists(`[data-fk="vis-${id}"]`), checked: await ev(`(document.querySelector('[data-fk="vis-${id}"]')||{}).checked`) };
    await b.click(`[data-fk="vis-${id}"]`); await b.wait(500);
    const flag = await ev(`EQ.fac.byId('${id}').showOnDashboard`);
    await ev(`EQ.nav('/fac/jobs',{})`); await b.wait(500); const tag = await ev(`!!document.querySelector('[data-job="${id}"] [data-fk="hidden-tag"]')`);
    await ev(`EQ.setPersona('management')`); await ev(`EQ.nav('/fac/dashboard',{})`); await b.wait(1300);
    const dash = await ev(`[...document.querySelectorAll('.lane-list:not(.dup) .row-link')].some(a=>a.getAttribute('href').endsWith('${id}'))`);
    await ev(`EQ.nav('/fac/dashboard',{tv:'1'})`); await b.wait(1200); const tv = await ev(`[...document.querySelectorAll('.lane-list:not(.dup) .row-link')].some(a=>a.getAttribute('href').endsWith('${id}'))`);
    await ev(`EQ.nav('/fac/jobs/${id}',{})`); await b.wait(500); const mState = { sw: await exists(`[data-fk="vis-${id}"]`), state: await text(`[data-fk="vis-state-${id}"]`) };
    await ev(`EQ.setPersona('eqTeam')`); await ev(`EQ.nav('/fac/jobs/${id}',{})`); await b.wait(500); const eState = { sw: await exists(`[data-fk="vis-${id}"]`), state: await text(`[data-fk="vis-state-${id}"]`) };
    await ev(`EQ.setPersona('admin')`); await ev(`EQ.nav('/fac/jobs/${id}',{})`); await b.wait(500); const aSw = await exists(`[data-fk="vis-${id}"]`);
    await ev(`EQ.nav('/admin/access',{})`); await b.wait(500); const acc = await text('main');
    const errs = b.errors();
    const ok = fsw.has && fsw.checked === true && flag === false && tag && !dash && !tv && !mState.sw && /Hidden/.test(mState.state) && !eState.sw && /Hidden/.test(eState.state) && aSw
      && /show or hide special jobs on the dashboard \/ 3D/.test(acc) && /show or hide FAC jobs on the dashboard/.test(acc) && /add spare parts/i.test(acc) && !errs.length;
    return { ok, detail: { id, fsw, flag, tag, dashboardListed: dash, tvListed: tv, mState, eState, adminSwitch: aSw, errs: errs.slice(0, 3) } };
  });
} finally { /* closed below */ }

const failed = results.filter((r) => r.status !== 'PASS').length;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify({ tool: 'tools/p02b/check_u1_r6.mjs', browser: b.browser, p02: P02, p03: P03, manifest: manifestFile, date: new Date().toISOString(), note: 'Prototype-level checks of the U1 round 6 repair against the synthetic prototypes and the regenerated model manifest; not acceptance execution.', passed: results.length - failed, failed, results }, null, 2));
console.log(`\n${results.length} checks, ${failed} failed`);
await b.close();
process.exit(failed ? 1 : 0);
