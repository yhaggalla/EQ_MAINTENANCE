import fs from 'node:fs';
import { launch } from '../p03/cdp.mjs';

const base = process.argv[2] || 'http://127.0.0.1:5312/';
const out = process.argv[3] || 'docs/evidence/U1/fleet-jobs-c51'; fs.mkdirSync(out, { recursive: true });
const b = await launch({ port: 9395, gpu: 'none' }), checks = [];
const check = (name, ok, detail) => { checks.push({ name, pass: !!ok, detail }); if (!ok) throw Error(name + ': ' + JSON.stringify(detail)); };
const submit = async () => { await b.click('dialog[open] [data-fk="submit"]'); await b.wait(450); };
const nav = async (route = '/eq/jobs/special', q = {}) => { await b.eval(`EQ.nav(${JSON.stringify(route)},${JSON.stringify(q)})`); await b.wait(180); };
const card = `document.querySelector('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]').closest('.job')`;
try {
  await b.viewport(1600, 1000); await b.goto(base + '?role=eqTeam#/eq/jobs/special');
  await b.click('[data-fk="add-job"]');
  check('Form offers Project and labelled EQ type/Equipment fields', await b.eval(`!!document.querySelector('#jf-kind-project')&&!!document.querySelector('label[for="jf-type"]')&&!!document.querySelector('label[for="jf-equipment"]')`));
  await b.setValue('#jf-type', 'QC');
  check('Equipment choices contain All QC and only active QC members', await b.eval(`(()=>{const opts=[...document.querySelector('#jf-equipment').options].filter(o=>o.value);return opts.some(o=>o.value==='all'&&o.textContent==='All QC equipment')&&opts.filter(o=>o.value!=='all').every(o=>EQ.eq(o.value).typeCode==='QC'&&EQ.eq(o.value).lifecycle==='active')})()`));
  await b.setValue('#jf-equipment', 'eq-qc-demo-01'); await b.click('#jf-level-main');
  await b.setValue('#jf-type', 'RTG');
  check('Changing type resets equipment and component selection', await b.eval(`document.querySelector('#jf-equipment').value===''&&document.querySelector('#jf-level-equipment').checked&&[...document.querySelector('#jf-equipment').options].filter(o=>o.value&&o.value!=='all').every(o=>EQ.eq(o.value).typeCode==='RTG')`));
  await b.setValue('#jf-type', 'QC'); await b.setValue('#jf-equipment', 'all'); await b.click('#jf-kind-project'); await b.setValue('#jf-title', 'Fleet safety upgrade');
  check('All equipment explains future inclusion and shared completion without component fields', await b.eval(`document.querySelector('dialog').textContent.includes('including equipment added later')&&document.querySelector('dialog').textContent.includes('Progress and completion apply to all')&&!document.querySelector('#jf-level-main')`));
  await b.screenshot(out + '/create-project.png'); await submit();
  await b.eval(`window.c51Id=EQ.state.D.jobs.find(j=>j.title==='Fleet safety upgrade').id;window.c51Members=EQ.jobEquipment(EQ.job(window.c51Id)).map(e=>e.id)`);
  check('Jobs board shows one fleet Project card', await b.eval(`document.querySelectorAll('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]').length===1&&${card}.textContent.includes('All QC equipment')&&${card}.textContent.includes('Project')`));
  await b.click('[data-fk^="job-progress-' + await b.eval('window.c51Id') + '"]'); await b.setValue('#ep-percent', '45'); await b.setValue('#ep-note', 'QC safety upgrade underway.'); await submit();
  check('One saved progress value is shared', await b.eval(`EQ.job(window.c51Id).progressPercent===45&&window.c51Members.every(id=>EQ.jobsOf(id).find(j=>j.id===window.c51Id)?.progressPercent===45)&&${card}.querySelector('[data-progress="45"]')`));
  await nav('/eq/jobs/special', { kind: 'project' }); await b.eval(`document.getElementById('toasts')?.replaceChildren();window.scrollTo(0,0)`); await b.screenshot(out + '/shared-card.png');
  for (const id of await b.eval('window.c51Members.slice(0,2)')) {
    await nav('/eq/equipment/' + id, { panel: 'special' }); await b.wait(650);
    check(id + ' page displays the shared Project exactly once', await b.eval(`(()=>{const list=document.querySelector('[data-fk="special-list"]');return !!list&&[...list.querySelectorAll('li')].filter(li=>[...li.querySelectorAll('a')].some(a=>a.getAttribute('href').endsWith('/'+window.c51Id))).length===1&&list.textContent.includes('Fleet safety upgrade')&&list.textContent.includes('Project')})()`));
  }
  await b.screenshot(out + '/equipment-special.png');
  await nav('/eq/jobs/special', { equipment: await b.eval('window.c51Members[1]') });
  check('Individual-equipment filter retains one fleet card', await b.eval(`document.querySelectorAll('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]').length===1`));
  await nav('/eq/jobs/special', { type: 'RTG' });
  check('Other-type filter excludes the fleet Project', await b.eval(`!document.querySelector('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]')`));
  await nav('/eq/jobs/special', { kind: 'project' });
  await b.eval(`document.querySelector('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]').focus()`); await b.key('Enter'); await b.wait(150);
  check('Title opens shared detail with links to all current members', await b.eval(`document.querySelector('h1').textContent.includes(EQ.job(window.c51Id).number)&&document.querySelector('main').textContent.includes('Includes equipment added later')&&window.c51Members.every(id=>!!document.querySelector('main a[href="#/eq/equipment/'+id+'"]'))`));
  await b.click('[data-fk^="job-progress-"]'); await b.setValue('#ep-percent', '100'); await b.setValue('#ep-note', 'Fleet upgrade complete.');
  check('Project completion permits optional replacement lines', await b.eval(`document.querySelector('#cf-lines-h').textContent==='Replacement lines (optional)'&&!document.querySelector('#cl0-desc')`)); await submit();
  check('Completing Project updates every member through one job', await b.eval(`EQ.job(window.c51Id).workStatus==='completed'&&window.c51Members.every(id=>EQ.currentSpecial(id,{level:'equipment',id:null}).jobs.find(r=>r.job.id===window.c51Id)?.job.workStatus==='completed')`));
  await b.eval(`(async()=>{EQ.setPersona('admin');const r=await EQ.api.createEquipment({code:'QC-C51-LATER',typeCode:'QC',name:'Later QC',status:'readyForOps'});if(!r.ok)throw Error('Registration failed: '+JSON.stringify(r));window.c51Later=r.eq.id;})()`);
  await nav('/eq/equipment/'+await b.eval('window.c51Later'), { panel: 'special' }); await b.wait(650);
  check('Later-added equipment page shows the shared completed job', await b.eval(`document.querySelector('[data-fk="special-list"]').textContent.includes('Fleet safety upgrade')&&document.querySelector('[data-fk="special-list"]').textContent.includes('Completed')`));
  await nav('/eq/jobs/special');
  await b.eval(`window.c51Replacement=EQ.api.createJob({equipmentId:'all',equipmentTypeCode:'QC',level:'equipment',kind:'replacement',title:'Fleet component upgrade'}).job.id;document.querySelector('[data-fk="job-progress-'+window.c51Replacement+'"]').click()`);
  await b.setValue('#ep-percent', '100');
  check('Fleet replacement selector identifies equipment and excludes other types', await b.eval(`(()=>{const s=document.querySelector('#cl0-pos'),opts=[...s.options].filter(o=>o.value);return opts.length>0&&opts.every(o=>{const p=EQ.pos(o.value);return EQ.eq(p.equipmentId).typeCode==='QC'&&o.textContent.includes(EQ.eq(p.equipmentId).code)})&&new Set(opts.map(o=>EQ.pos(o.value).equipmentId)).size>1})()`));
  await b.key('Escape'); await b.clickText('dialog:last-of-type button', 'Discard changes');
  await b.viewport(375, 812, true); await nav('/eq/jobs/special', { layout: 'tabs' }); await b.click('[data-fk="add-job"]'); await b.setValue('#jf-type', 'RTG'); await b.setValue('#jf-equipment', 'all'); await b.click('#jf-kind-project');
  check('Phone creation form fits and retains all required options', await b.eval(`document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth+1&&document.querySelector('#jf-kind-project').checked&&document.querySelector('#jf-equipment').value==='all'`));
  await b.screenshot(out + '/phone-form.png'); await b.key('Escape'); await b.clickText('dialog:last-of-type button', 'Discard changes');
  for (const role of ['management', 'facTeam']) { await b.eval(`EQ.setPersona(${JSON.stringify(role)})`); await nav('/eq/jobs/special'); check(role + ' can read fleet cards without create/progress controls', await b.eval(`!!document.querySelector('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]')&&!document.querySelector('[data-fk="add-job"]')&&!document.querySelector('[data-fk^="job-progress-"]')`)); }
  await b.eval(`EQ.state.D.equipment.filter(e=>e.typeCode==='QC').forEach(e=>{e.lifecycle='retired'})`); await nav('/eq/jobs/special', { type: 'QC' });
  check('Type-filtered Jobs retains the shared record with zero current members', await b.eval(`!!document.querySelector('.job-name[href="#/eq/jobs/special/'+window.c51Id+'"]')&&${card}.textContent.includes('All QC equipment (0)')`));
  check('No browser errors', b.errors().length === 0, b.errors());
} finally {
  fs.writeFileSync(out + '/browser-checks.json', JSON.stringify({ passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, checks, errors: b.errors() }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, last: checks.at(-1) })); await b.close();
}
