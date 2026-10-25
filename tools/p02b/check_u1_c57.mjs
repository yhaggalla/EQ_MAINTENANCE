// U1-C57: independent completion-cycle aggregation and responsive, fixed-height three-card review.
import fs from 'node:fs';
import vm from 'node:vm';
import { launch } from '../p03/cdp.mjs';
const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/fac-charts-c57'; fs.mkdirSync(out, { recursive: true });
const checks = [], check = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail }); if (!pass) throw Error(name + ': ' + JSON.stringify(detail)); };
const box = vm.createContext({ console, Intl, Date, URLSearchParams, setTimeout, clearTimeout }); box.window = box;
for (const file of ['util', 'catalog', 'params', 'fac-ref', 'fixtures', 'access', 'store', 'cmms', 'spares', 'fac']) vm.runInContext(fs.readFileSync(`artifacts/prototypes/p02-ui/js/${file}.js`, 'utf8'), box);
const E = box.EQ; E.reset(); E.state.role = 'management'; E.access.refreshSession('C57');
const today = E.todayColombo(), day = date => new Date(date + 'T00:00:00Z'), add = (date, n) => new Date(+day(date) + n * 864e5).toISOString().slice(0, 10);
const monday = add(today, -((day(today).getUTCDay() + 6) % 7)), start = add(monday, -21);
// Do not call the dashboard/filter/date helpers in this oracle. A completed cycle counts once, regardless of quantity or update count.
function expected(q) {
  const jobs = E.state.D.fac.jobs.filter(j => j.showOnDashboard !== false && !(j.kind === 'recurring' && ['daily', 'weekly'].includes(j.freqCode))
    && (!q.discipline || j.discipline === q.discipline) && (!q.type || j.typeCode === q.type)
    && (!q.mode || (q.mode === 'none' ? !j.mode : j.mode === q.mode))
    && (!q.pic || (q.pic === 'unassigned' ? !j.picName && !j.picProfileId : q.pic === 'me' ? j.picProfileId === E.user().id : j.picName === q.pic || j.picProfileId === q.pic)));
  return Array.from({ length: 4 }, (_, i) => {
    const s = add(start, i * 7), e = i === 3 ? today : add(s, 6), r = { start: s, end: e, electrical: 0, mechanical: 0, civil: 0 };
    jobs.forEach(j => j.cycles.forEach(c => { if (c.state === 'completed' && c.completedOn >= s && c.completedOn <= e) r[j.discipline]++; })); return r;
  });
}
let b;
try {
  for (const q of [{}, { discipline: 'civil' }, { discipline: 'electrical' }, { type: 'inspection' }, { type: 'service' }, { mode: 'none' }, { pic: 'unassigned' }, { focus: 'overdue' }]) {
    const actual = E.fac.dashboard(q).completionTrend, want = expected(q);
    check('Completed-cycle trend reconciles ' + JSON.stringify(q), JSON.stringify(actual) === JSON.stringify(want), { actual, want });
  }
  const source = E.state.D.fac.jobs.find(j => j.cycles.some(c => c.state === 'completed') && !['daily', 'weekly'].includes(j.freqCode));
  const cycle = source.cycles.find(c => c.state === 'completed');
  source.cycles.push(...[add(start, -1), start, today, add(today, 1)].map((completedOn, i) => ({ ...cycle, seq: 900 + i, completedOn })));
  const daily = E.state.D.fac.jobs.find(j => j.kind === 'recurring' && j.freqCode === 'daily');
  daily.cycles.push({ ...cycle, seq: 990, basis: 'period', completedOn: today });
  check('Boundary days, future cycles and routine checks reconcile independently', JSON.stringify(E.fac.dashboard({}).completionTrend) === JSON.stringify(expected({})));
  source.state = 'inactive';
  check('Historical completions remain after job deactivation', JSON.stringify(E.fac.dashboard({}).completionTrend) === JSON.stringify(expected({})));
  source.showOnDashboard = false;
  check('Hidden jobs leave completion trend', JSON.stringify(E.fac.dashboard({}).completionTrend) === JSON.stringify(expected({})));
  E.reset(); E.state.role = 'management'; E.access.refreshSession('C57');
  const completed = E.state.D.fac.jobs.filter(j => j.cycles.some(c => c.state === 'completed'));
  completed.forEach((j, i) => { j.mode = i % 2 ? 'outsource' : 'inHouse'; j.picName = i % 2 ? 'Named test PIC' : null; });
  for (const q of [{ mode: 'inHouse' }, { pic: 'Named test PIC' }, { discipline: 'civil', type: 'inspection', mode: 'outsource', pic: 'Named test PIC' }]) check('Populated mode/PIC filters ' + JSON.stringify(q), JSON.stringify(E.fac.dashboard(q).completionTrend) === JSON.stringify(expected(q)));
  const unique = E.state.D.fac.jobs[0]; unique.name = 'C57 unique search';
  check('Wildcard search narrows trend to the matching job', E.fac.dashboard({ search: 'C57*search' }).completionTrend.every(w => w.electrical + w.mechanical + w.civil === unique.cycles.filter(c => c.state === 'completed' && c.completedOn >= w.start && c.completedOn <= w.end).length));
  check('No matches return four explicit zero weeks', E.fac.dashboard({ search: 'C57-no-matches' }).completionTrend.length === 4 && E.fac.dashboard({ search: 'C57-no-matches' }).completionTrend.every(w => w.electrical + w.mechanical + w.civil === 0));
  E.state.role = 'noAccess'; E.access.refreshSession('C57 deny'); check('Dashboard feature denial still protects trend', E.fac.dashboard({}).status === 403);

  b = await launch({ port: 9403, gpu: 'none' });
  const ev = x => b.eval(x);
  const baseline = JSON.parse(fs.readFileSync('docs/evidence/U1/fac-charts-c57/before.json', 'utf8'));
  for (const [w, h, tv] of [[1920, 1080, false], [1366, 768, false], [375, 812, false], [1920, 1080, true], [1366, 768, true]]) {
    await b.viewport(w, h, w === 375); await b.goto(base + '?role=management#/fac/dashboard' + (tv ? '?tv=1' : '')); await b.wait(120);
    const m = await ev(`(()=>{const cards=[...document.querySelector('.dash-bottom').children],s=document.querySelector('.load-svg'),r=s.getBoundingClientRect(),vb=s.viewBox.baseVal;const rects=[...s.querySelectorAll('rect')].map(e=>e.getBBox());return {cards:cards.length,order:cards.map(c=>c.className).join(','),sameRow:cards.every(c=>Math.abs(c.getBoundingClientRect().top-cards[0].getBoundingClientRect().top)<1),height:document.querySelector('.load').getBoundingClientRect().height,lane:document.querySelector('.lane-view').clientHeight,svgWidth:r.width,svgHeight:r.height,vw:vb.width,vh:vb.height,coverage:(Math.max(...rects.map(r=>r.x+r.width))-Math.min(...rects.map(r=>r.x)))/vb.width,clip:cards.some(c=>c.scrollHeight>c.clientHeight+1),overflow:document.documentElement.scrollWidth-innerWidth,scroll:document.scrollingElement.scrollHeight-innerHeight,dueWeeks:s.querySelectorAll('.lb-wk').length,trendWeeks:document.querySelectorAll('.trend-svg .lb-wk').length,labelsFit:[...document.querySelectorAll('.weekly-chart text')].every(e=>{const r=e.getBBox(),v=e.closest('svg').viewBox.baseVal;return r.x>=-1&&r.y>=-1&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1}),jobs:EQ.dash.model.kpi.active}})()`);
    const before = baseline.find(x => x.w === w && x.h === h && x.tv === tv);
    check(w + 'px ' + (tv ? 'TV ' : '') + 'three cards retain chart/data and do not grow', m.cards === 3 && m.order === 'proof,trend,load' && m.height <= before.card.h + 1 && !m.clip && m.overflow <= 1 && m.dueWeeks === 8 && m.trendWeeks === 4 && m.jobs === 114 && m.labelsFit && (w < 1200 || m.sameRow) && (!tv || m.scroll <= 1), { before: before.card, after: m });
    check(w + 'px measured chart fills available width without text distortion', Math.abs(m.vw - m.svgWidth) <= 1 && Math.abs(m.vh - m.svgHeight) <= 1 && m.coverage > .90, m);
    if (w === 1920 && !tv) check('Main feeds keep the C56 height', m.lane === 392, m.lane);
    if (w === 375) await ev(`document.querySelector('.dash-bottom').scrollIntoView({block:'center'})`);
    await b.screenshot(out + '/' + (tv ? 'tv-' : 'dashboard-') + w + '.png');
    if (tv) {
      await b.click('[data-fk="proof-pause"]'); let fits = true;
      for (let i = 0; i < await ev('EQ.dash.model.proof.length'); i++) { await b.click('[data-fk="proof-next"]'); fits = fits && await ev(`document.querySelector('.proof').scrollHeight<=document.querySelector('.proof').clientHeight+1`); }
      check(w + 'px TV keeps every photo caption inside the original card height', fits);
    }
  }
  await b.viewport(1920, 1080); await b.goto(base + '?role=management#/fac/dashboard');
  const oldWidth = await ev(`document.querySelector('.load-svg').viewBox.baseVal.width`); await b.viewport(1366, 768); await b.wait(300);
  check('Resize redraws the same data to the new measured width', await ev(`document.querySelector('.load-svg').viewBox.baseVal.width!==${oldWidth}&&Math.abs(document.querySelector('.load-svg').viewBox.baseVal.width-document.querySelector('.load-svg').clientWidth)<=1`));
  await b.click('[data-fk="dash-filters-toggle"]'); await b.setValue('#df-search', 'no-c57-match'); await b.wait(150);
  check('Live search updates both charts to explicit zero counts', await ev(`EQ.dash.model.kpi.active===0&&[...document.querySelectorAll('.weekly-chart .lb-total')].length===12&&[...document.querySelectorAll('.weekly-chart .lb-total')].every(e=>e.textContent==='0')&&!document.querySelector('.weekly-chart').innerHTML.includes('NaN')`));
  await ev(`EQ.nav('/fac/dashboard',{})`); await b.wait(100); await b.click('[data-fk="proof-pause"]');
  const photo = await ev(`document.querySelector('.proof-n').textContent`); await b.click('[data-fk="proof-next"]'); check('Proof navigation survives third card', await ev(`document.querySelector('.proof-n').textContent!==${JSON.stringify(photo)}`));
  check('No browser errors', b.errors().length === 0, b.errors());
} finally {
  const result = { passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, checks, errors: b?.errors() || [] };
  fs.writeFileSync(out + '/checks.json', JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ passed: result.passed, failed: result.failed, last: checks.at(-1) })); if (b) await b.close();
}
