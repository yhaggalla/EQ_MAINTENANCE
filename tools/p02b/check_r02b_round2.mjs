// Focused R02B repair probes. Executes unchanged prototype scripts in an isolated VM;
// synthetic fixtures only, no browser, network, database or production authentication.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const out = process.argv[2] || 'docs/evidence/R02B/repair-round2-20261023/probes-after.json';
const box = vm.createContext({ console, Intl, Date, URLSearchParams, setTimeout, clearTimeout });
box.window = box;
for (const name of ['util', 'catalog', 'params', 'fac-ref', 'fixtures', 'access', 'store', 'zmms', 'spares', 'fac']) {
  vm.runInContext(fs.readFileSync(`artifacts/prototypes/p02-ui/js/${name}.js`, 'utf8'), box, { filename: name + '.js' });
}
const E = box.EQ;
E.reset(); E.state.role = 'admin';
const eq = 'eq-qc-demo-01', scope = { level: 'equipment', id: null };
const source = E.job('job-101');
const reopened = E.api.reopenJob(source.id, 'R02B round 2 regression');
// Include nonempty nested history to prove it is withheld, not merely absent in a fixture.
source.corrections.push({ reason: 'Synthetic prior correction', items: [{ before: 'old', after: 'new' }] });
const saved = E.access.save([{ role: 'management', feature: 'eq.jobs.view', on: false }], E.state.D.access.version, 'R02B regression');
E.state.role = 'management'; E.access.refreshSession('regression');
const result = E.currentSpecial(eq, scope), row = result.openJobs.find(r => r.job.id === source.id);
// U1-C23 (round 6): completed jobs are listed too, so the allowlist adds completedOn (null for open/reopened jobs) and listedOn; nothing else
const keys = ['id', 'number', 'equipmentId', 'level', 'mainId', 'subId', 'positionId', 'kind', 'title', 'workStatus', 'plannedOn', 'completedOn', 'listedOn'].sort();
const sameKeys = (v, expected) => JSON.stringify(Object.keys(v).sort()) === JSON.stringify(expected);
const checks = [];
const check = (id, ok, detail) => checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail });
check('F1-reopened-hidden-history', reopened.ok && saved.ok && E.history(eq, scope, true).status === 403 && result.ok && !!row,
  { historyStatus: E.history(eq, scope, true).status, currentOk: result.ok, reopened: reopened.ok });
check('F1-current-job-allowlist', !!row && sameKeys(row.job, keys) && row.job.completedOn === null && result.jobs.every((r) => sameKeys(r.job, keys)), { actualKeys: row && Object.keys(row.job), expectedKeys: keys, reopenedCompletedOn: row && row.job.completedOn });
check('F1-position-allowlist', !!row && row.matchingLines.length > 0 && row.matchingLines.every(l => sameKeys(l, ['positionId'])),
  { actualKeys: row && row.matchingLines.map(l => Object.keys(l)) });
check('F1-source-history-preserved', source.completedOn && source.completionNote && source.events.some(e => e.kind === 'reopened') && source.corrections.length > 0,
  { completedOn: source.completedOn, eventKinds: source.events.map(e => e.kind), corrections: source.corrections.length });
const oldTitle = source.title, oldPos = source.lines[0].positionId;
row.job.title = 'Attempted payload mutation'; row.matchingLines[0].positionId = 'not-a-position'; result.scope.level = 'part';
check('F1-reference-isolation', source.title === oldTitle && source.lines[0].positionId === oldPos && scope.level === 'equipment',
  { jobDetached: source.title === oldTitle, positionDetached: source.lines[0].positionId === oldPos, scopeDetached: scope.level === 'equipment' });

// Rebuild after deliberately mutating the returned payload; no probe leaks into another.
E.reset(); E.state.role = 'management'; E.access.refreshSession('regression');
const F = E.fac, today = E.todayColombo(), start = F.date.addDays(today, -29);
// Independent predicate/oracle; do not call the implementation's filterJobs.
function expected(q) {
  const jobs = E.state.D.fac.jobs.filter(j => (!q.discipline || j.discipline === q.discipline) && (!q.type || j.typeCode === q.type)
    && (!q.mode || (q.mode === 'none' ? !j.mode : j.mode === q.mode))
    && (!q.pic || (q.pic === 'me' ? j.picProfileId === E.user().id : q.pic === 'unassigned' ? !j.picProfileId && !j.picName : j.picName === q.pic || j.picProfileId === q.pic)));
  const cycles = jobs.filter(j => !(j.kind === 'recurring' && ['daily', 'weekly'].includes(j.freqCode))).flatMap(j => j.cycles)
    .filter(c => c.state === 'completed' && c.dueOn && c.completedOn >= start && c.completedOn <= today);
  const n = cycles.length, ok = cycles.filter(c => c.completedOn <= c.dueOn).length;
  return { n, ok, pct: n ? Math.round(ok / n * 100) : null };
}
const cases = [{}, { discipline: 'electrical' }, { discipline: 'civil' }, { type: 'inspection' }, { type: 'service' }, { mode: 'inHouse' }, { mode: 'outsource' }, { mode: 'none' },
  { pic: 'unassigned' }, { pic: 'me' }];
for (const j of E.state.D.fac.jobs.filter(j => j.cycles.some(c => c.state === 'completed'))) {
  if (j.picName || j.picProfileId) cases.push({ pic: j.picName || j.picProfileId });
  cases.push({ discipline: j.discipline, type: j.typeCode, mode: j.mode || 'none', pic: j.picName || j.picProfileId || 'unassigned' });
}
const comparisons = cases.map(q => { const k = F.dashboard(q).kpi, want = expected(q); return { q, want, actual: { n: k.onTimeN, ok: k.onTimeOk, pct: k.onTimePct } }; });
check('F2-filtered-numerator-denominator', comparisons.every(c => JSON.stringify(c.want) === JSON.stringify(c.actual)), comparisons);
const electrical = F.dashboard({ discipline: 'electrical' }).kpi;
check('F2-empty-population', electrical.active === 18 && electrical.onTimeN === 0 && electrical.onTimeOk === 0 && electrical.onTimePct === null, electrical);
const all = F.dashboard({}).kpi;
check('F2-unfiltered-regression', all.active === 114 && all.onTimeN === 8 && all.onTimeOk === 6 && all.onTimePct === 75, all);
// The performance window includes closed/deactivated matching jobs as before; only
// the four population filters constrain it. KPI focus is a lane drill-down.
E.state.role = 'admin';
const completedJob = E.state.D.fac.jobs.find(j => j.cycles.some(c => c.state === 'completed' && c.dueOn && c.completedOn >= start));
F.api.deactivate(completedJob.id, 'Synthetic regression');
E.state.role = 'management';
const withFocus = F.dashboard({ discipline: 'civil', focus: 'overdue' }).kpi, want = expected({ discipline: 'civil' });
check('F2-completion-window-scope', withFocus.onTimeN === want.n && withFocus.onTimeOk === want.ok && withFocus.onTimePct === want.pct,
  { actual: withFocus, expected: want });

// Seed only this VM's completed jobs with varied mode/PIC identities: the normal
// sample has no assigned PIC or mode on its completed cycles. Exercise nonempty
// subsets as well as unassigned/me and combined filters without changing fixtures.
const completedJobs = E.state.D.fac.jobs.filter(j => j.cycles.some(c => c.state === 'completed'));
completedJobs.forEach((j, i) => {
  j.mode = i % 2 ? 'outsource' : 'inHouse';
  j.picProfileId = i % 3 === 0 ? E.user().id : null;
  j.picName = i % 3 === 1 ? 'Synthetic named PIC' : null;
});
const subsets = [{ mode: 'inHouse' }, { mode: 'outsource' }, { pic: 'me' }, { pic: E.user().id }, { pic: 'Synthetic named PIC' }, { pic: 'unassigned' },
  { discipline: 'civil', type: 'inspection', mode: 'inHouse', pic: 'me' }];
const varied = subsets.map(q => { const k = F.dashboard(q).kpi; return { q, want: expected(q), actual: { n: k.onTimeN, ok: k.onTimeOk, pct: k.onTimePct } }; });
check('F2-nonempty-mode-pic-and-combined', varied.every(c => JSON.stringify(c.want) === JSON.stringify(c.actual))
  && varied.slice(0, 6).every(c => c.want.n > 0 && c.want.n < all.onTimeN), varied);

const failed = checks.filter(c => c.status === 'FAIL').length;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ tool: 'tools/p02b/check_r02b_round2.mjs', generatedUtc: new Date().toISOString(), boundary: 'Isolated Node VM, synthetic prototype fixtures only', passed: checks.length - failed, failed, checks }, null, 2));
for (const c of checks) console.log(`${c.status} ${c.id}`);
process.exitCode = failed ? 1 : 0;
