// U1-C68: component parameters folded into the parameter model (groups, sources, conflicts, Admin decisions).
// Usage (server on 5312): node tools/p02b/check_u1_c68.mjs [base] [output folder]
import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/index.html';
const out = process.argv[3] || 'docs/evidence/U1/parameter-model-c68';
fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9370 });
await b.viewport(1600, 1000);
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + JSON.stringify(detail).slice(0, 600))); };
const ev = (x) => b.eval(x);
const ready = async (sel) => { for (let i = 0; i < 60; i++) { await b.wait(200); if (await ev(`!!EQ.qc?.session?.ready && !document.querySelector('[aria-busy="true"]')${sel ? ` && !!document.querySelector(${JSON.stringify(sel)})` : ''}`)) break; } await b.wait(700); };
const go = async (q, sel, role = 'eqTeam') => { await b.goto(base + '?role=' + role + '#/eq/equipment/eq-qc-demo-01?' + q); await ready(sel); };
const groups = () => ev(`[...document.querySelectorAll('[data-group]')].map(e=>e.dataset.group)`);
const row = (code) => ev(`(()=>{const d=document.querySelector('dd[data-param="${code}"]');return d?{text:d.textContent,conflict:!!d.querySelector('.tag.red'),btn:!!d.querySelector('[data-fk="resolve-${code}"]')}:null})()`);
b.clearEvents();

// 1 reference data integrity in the running app
await go('view=3d&mode=technical&panel=technical', '.qc-canvas');
const integ = await ev(`(()=>{const G=EQ.paramGroups,S=EQ.paramSources,P=EQ.sourceParams;const codes=new Set(P.map(p=>p.code));
  return {groups:G.length,sources:Object.keys(S).length,params:P.length,missing:G.flatMap(g=>g.parameterCodes).filter(c=>!codes.has(c)),
  badRefs:P.flatMap(p=>p.observations.flatMap(o=>(o.refs||[]).filter(r=>!S[r.document]))).length,noObs:P.filter(p=>!p.observations.length).map(p=>p.code),
  legacy:typeof EQ.componentSpecs}})()`);
check('01 reference data: 27 groups, every group code defined, every reference registered, no observation-less parameter, old dataset retired',
  integ.groups === 27 && integ.missing.length === 0 && integ.badRefs === 0 && integ.noObs.length === 0 && integ.legacy === 'undefined' && integ.sources >= 25, integ);

// 2 area: machinery house groups and a sourced row reusing an existing reference parameter
await go('view=3d&mode=technical&panel=technical&area=machinery-house&container=machinery-house', '[data-group]');
let gs = await groups(); let r = await row('main-hoist-motor-power');
check('02 area groups come from the parameter model (machinery house: 9 groups)', gs.length === 9 && gs[0] === 'machinery-house' && gs.includes('main-hoist'), gs);
check('03 existing parameter reused with all its sources (450 kW: J526A00, J526A0300, manual table 1-2)', r && /450 kW/.test(r.text) && /J526A00 p1/.test(r.text) && /J526A0300 p1/.test(r.text) && /ZPMC-MM-CH1 p5/.test(r.text) && !r.conflict, r);
r = await row('mh-service-crane-capacity');
check('04 differing sources are an unresolved conflict with both values (10 t J526A1600 / 12 t manual 1.6.1); EQ Team cannot resolve', r && r.conflict && /10 t/.test(r.text) && /12 t/.test(r.text) && !r.btn, r);
await b.screenshot(out + '/area-machinery-house.png');

// 3 search filters component rows as label/value pairs
await b.eval(`(()=>{const i=document.querySelector('input[aria-label^="Search Technical"]')||document.querySelector('input[aria-label^="Search"][placeholder*="technical"]');i.value='SB315';i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`); await b.wait(500);
const srch = await ev(`[...document.querySelectorAll('dd[data-param]')].filter(d=>!d.hidden).map(d=>d.dataset.param)`);
check('05 technical search finds component rows (SB315 drum brakes)', srch.length >= 2 && srch.every((c) => /hoist/.test(c)), srch);

// 4 part and sub-mechanism selections
await go('view=3d&mode=technical&panel=technical&pkey=trolley_catenary_waterside', '[data-group]');
gs = await groups();
check('06 part shows the groups linked to its model key (seaside catenary trolley)', gs.join() === 'catenary-trolleys', gs);
await go('view=3d&mode=technical&panel=technical&main=mi-q01-01&sub=si-q01-011', '[data-group]');
gs = await groups();
check('07 sub-mechanism 011 shows the groups of its parts', gs.includes('main-hoist') && gs.includes('anti-snag-tls'), gs);
await go('view=3d&mode=technical&panel=technical&pkey=trolley_frame', '[data-group]');
r = await row('trolley-motor-power') || await row('trolley-speed');
const tm = await ev(`(()=>{const p=EQ.paramDef('trolley-motor-power');return {obs:p.observations.map(o=>o.value+'@'+o.drawing),conflict:EQ.paramEffective(p).state}})()`);
check('08 U-02 trolley motor stays an open conflict with three observations (275 J526A00, 270 J526A0400, 275 manual)', tm.obs.length === 3 && tm.conflict === 'conflict', tm);

// 5 Admin resolves the service-crane conflict with a reason; prior observations stay visible
await go('view=3d&mode=technical&panel=technical&area=machinery-house&container=machinery-house', '[data-group]', 'admin');
r = await row('mh-service-crane-capacity');
check('09 Admin sees Resolve with a reason on the conflict row', r && r.btn, r);
await b.click('[data-fk="resolve-mh-service-crane-capacity"]'); await b.wait(400);
await b.setValue('#rp-val', '10'); await b.setValue('#rp-reason', 'J526A1600 main data list is the as-built sheet; manual 1.6.1 text superseded');
await b.clickText('dialog button, .dialog button', 'Record decision'); await b.wait(700);
r = await row('mh-service-crane-capacity');
const res = await ev(`EQ.state.D.resolved['mh-service-crane-capacity']`);
check('10 decision recorded with reason; row shows the chosen value, Resolved by Admin and both observations', res && res.value === '10' && r && !r.conflict && /Resolved by Admin/.test(r.text) && /12 t/.test(r.text) && /J526A1600/.test(r.text), { res, r });
await b.screenshot(out + '/resolved-conflict.png');

// 6 Admin specifications page: filter by conflicts and by component group
await b.goto(base + '?role=admin#/admin/eq/parameters'); await b.wait(1500);
const adm = async (v) => { await b.eval(`(()=>{const s=document.querySelector('[data-fk="param-filter"]');s.value=${JSON.stringify(v)};s.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`); await b.wait(400); return ev(`[...document.querySelectorAll('tr[data-param]')].map(t=>t.dataset.param)`); };
const def = await ev(`[...document.querySelectorAll('tr[data-param]')].map(t=>t.dataset.param)`);
const conf = await adm('conflicts'); const grp = await adm('group:trolley-rails'); const all = await adm('all');
check('11 Admin page (fresh load; prototype decisions are in memory): reference list unchanged (20), conflicts filter lists the three open conflicts, group and all filters',
  def.length === 20 && conf.sort().join() === 'gantry-speed,mh-service-crane-capacity,trolley-motor-power' && grp.length === 11 && grp[0] === 'trolley-rails-rail' && all.length === 240, { def: def.length, conf, grp: grp.length, all: all.length });
await b.screenshot(out + '/admin-specifications.png');

// 7 Management (read-only) sees values but no decision controls
await go('view=3d&mode=technical&panel=technical&area=machinery-house&container=machinery-house', '[data-group]', 'management');
r = await row('mh-service-crane-capacity');
check('12 Management sees the conflict but no Resolve control', r && r.conflict && !r.btn, r);
const errs = b.errors(); check('13 no browser errors', errs.length === 0, errs);
fs.writeFileSync(out + '/checks.json', JSON.stringify({ base, results }, null, 1));
console.log(results.filter((x) => x.ok).length + '/' + results.length + ' PASS');
await b.close();
process.exit(results.every((x) => x.ok) ? 0 : 1);
