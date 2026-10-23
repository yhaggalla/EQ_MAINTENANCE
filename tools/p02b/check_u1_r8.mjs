// U1 round 8 repair checks (U1-C28..U1-C31, EQ Fleet dashboard) against the synthetic prototype (headless Chrome, DevTools protocol).
// Needs the prototype served from disk:  node artifacts/prototypes/p02-ui/serve.mjs   (http://127.0.0.1:5312/)
// R8-09 also needs the committed prototype (git HEAD copy) served on another port for the "FAC unchanged" comparison:
//   git archive HEAD artifacts/prototypes/p02-ui | tar -x -C <dir>;  node <dir>/artifacts/prototypes/p02-ui/serve.mjs 5322
// Usage: node tools/p02b/check_u1_r8.mjs [p02Url] [outJson] [--head=http://127.0.0.1:5322/] [--only=R8-01,R8-05]
// PROTOTYPE-LEVEL evidence only: synthetic in-memory data, persona switch instead of sign-in, no persistence, no ZMMS contact.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p03/cdp.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const P02 = args[0] || 'http://127.0.0.1:5312/';
const outFile = args[1] || 'docs/evidence/U1/repair-r8/u1-r8-checks.json';
const HEAD = (process.argv.find((a) => a.startsWith('--head=')) || '').slice(7) || null;
const results = [];
const rec = (id, covers, name, ok, detail) => { results.push({ id, covers, name, status: ok ? 'PASS' : 'FAIL', detail: typeof detail === 'string' ? detail : JSON.stringify(detail || '') }); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + name + (detail ? ' - ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 1200) : '')); };

// preflight: never record results from stopped servers
for (const u of [P02, HEAD].filter(Boolean)) { try { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); } catch (e) { console.error('Server not reachable: ' + u + ' (' + e.message + '). Start it first; nothing written.'); process.exit(2); } }

const b = await launch({ gpu: 'swiftshader', port: 9378 });
const ev = (expr) => b.eval(expr);
const go = async (role, hash, wait = 700, base = P02) => { b.clearEvents(); await b.goto(base + '?role=' + role + '#' + hash); await b.wait(wait); };
const step = async (id, covers, name, fn) => { if (only.length && !only.some((o) => id.startsWith(o))) return; try { const r = await fn(); rec(id, covers, name, r === true || (r && r.ok), r && r.detail); } catch (e) { rec(id, covers, name, false, 'EXCEPTION ' + e.message); } };
const reduced = async (on) => b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] });
const ACTIVE = `EQ.state.D.equipment.filter(e=>e.lifecycle==='active')`;

try {
  console.log('Browser:', b.browser);
  await b.viewport(1920, 1080);
  await reduced(false);

  // ------------------------------------------------------------- U1-C28 TV mode
  await step('R8-01', ['U1-C28', 'S02', 'OPS02', 'FDB05'], 'EQ Fleet TV mode (#/eq/fleet?tv=1) at 1920x1080 for every role that can see EQ Fleet: navigation hidden, visible "EQ Fleet" title, the whole synthetic fleet on one screen without page scroll, large type (code >= 22 px, KPI numbers >= 40 px, card text >= 15 px), read-only (no links, inputs or editing buttons; only Pause and Exit TV mode), auto-refresh note; a role without EQ Fleet gets the 403 / No access page and no TV', async () => {
    const out = {};
    for (const role of ['admin', 'eqTeam', 'management', 'eqfac']) {
      await go(role, '/eq/fleet?tv=1', 900);
      out[role] = await ev(`(()=>{const m=document.querySelector('main'); const cards=[...m.querySelectorAll('.eq-card')]; const vis=cards.filter(c=>!c.hidden);
        const px=(el)=>el?parseFloat(getComputedStyle(el).fontSize):0; const tb=document.querySelector('.topbar');
        return {tv:document.body.classList.contains('tv'), topbar:getComputedStyle(tb).display, h1:(m.querySelector('h1')||{}).textContent, h1px:px(m.querySelector('h1')),
          scroll:document.scrollingElement.scrollHeight-innerHeight, cards:cards.length, visible:vis.length, active:${ACTIVE}.length, inView:vis.every(c=>{const r=c.getBoundingClientRect(); return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth}),
          codePx:Math.min(...vis.map(c=>px(c.querySelector('.code')))), metaPx:Math.min(...vis.map(c=>px(c.querySelector('.meta')))), durPx:Math.min(...vis.map(c=>px(c.querySelector('.dur')))), kpiPx:Math.min(...[...m.querySelectorAll('.kpi .n')].map(px)),
          links:m.querySelectorAll('a[href]').length, inputs:m.querySelectorAll('input,select,textarea').length, buttons:[...m.querySelectorAll('button')].map(x=>x.textContent.trim()),
          updated:(m.querySelector('[data-fk="tv-updated"]')||{}).textContent||'', pages:EQ.fleetTvState().pages}})()`);
    }
    await go('facTeam', '/eq/fleet?tv=1', 600); // FAC Team: EQ Fleet is a toggle that is on by default; switch it off for this persona
    await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'facTeam',feature:'eq.fleet.view',on:false}], EQ.state.D.access.version,'R8-01'); EQ.setPersona('facTeam'); EQ.nav('/eq/fleet',{tv:'1'});})()`); await b.wait(600);
    const off = await ev(`({tv:document.body.classList.contains('tv'), text:document.querySelector('main').textContent.slice(0,160), cards:document.querySelectorAll('.eq-card').length})`);
    await ev(`(()=>{EQ.state.role='admin'; EQ.access.save([{role:'facTeam',feature:'eq.fleet.view',on:true}], EQ.state.D.access.version,'restore'); EQ.access.refreshSession('restore');})()`);
    await go('noAccess', '/eq/fleet?tv=1', 600); const na = await ev(`({tv:document.body.classList.contains('tv'), text:document.querySelector('main').textContent.slice(0,80)})`);
    const ok = Object.values(out).every((r) => r.tv && r.topbar === 'none' && r.h1 === 'EQ Fleet' && r.h1px >= 28 && r.scroll <= 0 && r.cards === r.active && r.visible === r.active && r.inView && r.pages === 1
      && r.codePx >= 22 && r.metaPx >= 15 && r.durPx >= 15 && r.kpiPx >= 40 && r.links === 0 && r.inputs === 0 && r.buttons.length === 2 && /Pause/.test(r.buttons[0]) && /Exit TV mode/.test(r.buttons[1]) && /refreshes every 60 s/.test(r.updated))
      && !off.tv && off.cards === 0 && /403|not available/i.test(off.text) && !na.tv && /No access/.test(na.text);
    return { ok, detail: { ...out, facTeamOff: off, noAccess: na } };
  });

  await step('R8-02', ['U1-C28', 'S02', 'S03', 'OPS01'], 'TV mode behaviour: URL-addressable (TV button opens ?tv=1 with the current type/status/source filters; ?tv=1&type=QC shows only QC); refresh on the same poll (EQ.refresh, as the 60 s timer calls it, updates the time; a status change by an EQ Team writer reaches the TV view and its counts); Esc and Exit TV mode return to the normal fleet with the filters kept; counts reconcile with the cards', async () => {
    await go('eqTeam', '/eq/fleet?type=QC&source=auto', 600);
    await ev(`document.querySelector('[data-fk="fleet-tv"]').click()`); await b.wait(700);
    const viaBtn = await ev(`({hash:location.hash, tv:document.body.classList.contains('tv'), types:[...new Set([...document.querySelectorAll('.eq-card')].map(c=>EQ.eq(c.dataset.eq).typeCode))], n:document.querySelectorAll('.eq-card').length, want:EQ.state.D.equipment.filter(e=>e.lifecycle==='active'&&e.typeCode==='QC'&&EQ.zmms.mode(e).label==='Auto').length})`);
    await b.key('Escape'); await b.wait(500);
    const afterEsc = await ev(`({hash:location.hash, tv:document.body.classList.contains('tv'), topbar:getComputedStyle(document.querySelector('.topbar')).display})`);
    await go('management', '/eq/fleet?tv=1', 800);
    await ev(`(()=>{EQ.state.refreshedAt=Date.now()-120000; EQ.rerender();})()`); await b.wait(300); // pretend the last poll was two minutes ago
    const t0 = await ev(`document.querySelector('[data-fk="tv-updated"]').textContent`);
    const before = await ev(`({blink:(document.querySelector('[data-eq="eq-es-demo-02"]')||{dataset:{}}).dataset.blink||null, maint:document.querySelector('[data-kpi="maintenance"] .n').textContent})`);
    // another user (EQ Team writer) changes an unmapped equipment; the TV re-renders from the shared data (the poll would do the same)
    const w = await ev(`(()=>{EQ.state.role='eqTeam'; EQ.access.refreshSession('writer'); const r=EQ.api.setStatus('eq-es-demo-02',{status:'maintenance',reason:'R8-02 check (synthetic)'}); EQ.state.role='management'; EQ.access.refreshSession('back'); EQ.refresh(false); return r.ok})()`); await b.wait(500);
    const after = await ev(`({blink:(document.querySelector('[data-eq="eq-es-demo-02"]')||{dataset:{}}).dataset.blink||null, maint:document.querySelector('[data-kpi="maintenance"] .n').textContent, counts:EQ.fleetCounts(EQ.state.D.equipment), cards:document.querySelectorAll('.eq-card').length, kpi:Object.fromEntries([...document.querySelectorAll('[data-kpi]')].map(k=>[k.dataset.kpi,(k.querySelector('.n')||{}).textContent])), upd:document.querySelector('[data-fk="tv-updated"]').textContent})`);
    await ev(`document.querySelector('[data-fk="fleet-tv-exit"]').click()`); await b.wait(500);
    const afterExit = await ev(`({hash:location.hash, tv:document.body.classList.contains('tv'), links:document.querySelectorAll('main a.eq-card').length})`);
    await go('management', '/eq/fleet?tv=1&type=QC', 700); const qcOnly = await ev(`({types:[...new Set([...document.querySelectorAll('.eq-card')].map(c=>EQ.eq(c.dataset.eq).typeCode))], groups:document.querySelectorAll('.fleet-group').length, total:document.querySelector('[data-kpi="total"] .n').textContent})`);
    const c = after.counts;
    const ok = /tv=1/.test(viaBtn.hash) && /type=QC/.test(viaBtn.hash) && /source=auto/.test(viaBtn.hash) && viaBtn.tv && viaBtn.types.join() === 'QC' && viaBtn.n === viaBtn.want
      && /^#\/eq\/fleet/.test(afterEsc.hash) && !/tv=1/.test(afterEsc.hash) && /type=QC/.test(afterEsc.hash) && !afterEsc.tv && afterEsc.topbar !== 'none'
      && w && before.blink === null && after.blink === 'maintenance' && Number(after.maint) === Number(before.maint) + 1 && t0 !== after.upd
      && after.kpi.total === String(c.total) && after.kpi.readyForOps === String(c.readyForOps) && after.kpi.breakdown === String(c.breakdown) && after.kpi.maintenance === String(c.maintenance) && after.kpi.unreported === String(c.unreported) && after.cards === c.total
      && !/tv=1/.test(afterExit.hash) && !afterExit.tv && afterExit.links === c.total && qcOnly.types.join() === 'QC' && qcOnly.groups === 1 && qcOnly.total === '6';
    return { ok, detail: { viaBtn, afterEsc, t0, before, after: { ...after, counts: undefined }, afterExit, qcOnly } };
  });

  await step('R8-03', ['U1-C28', 'OPS02'], 'TV mode when the fleet does not fit one screen (1366x768, and 1920x1080 with 40 extra synthetic RTGs added in memory for this check): no page scroll, the cards are split into pages that each fit, every active card is on exactly one page, "Page n of m" shown; the page turns every 10 s and Pause stops the turn', async () => {
    const out = {};
    const probe = async () => ev(`(async()=>{const st=EQ.fleetTvState(); const seen={}; let fits=true; const body=document.querySelector('.tvf-body');
      for(let p=0;p<st.pages;p++){ EQ.fleetUI.tvPage=p; EQ.fleetUI.lastFlip=Date.now(); await new Promise(r=>setTimeout(r,1150)); const vis=[...document.querySelectorAll('.eq-card')].filter(c=>!c.hidden&&c.getBoundingClientRect().height>0);
        vis.forEach(c=>{seen[c.dataset.eq]=(seen[c.dataset.eq]||0)+1}); if(body.scrollHeight>body.clientHeight+1||vis.some(c=>c.getBoundingClientRect().bottom>body.getBoundingClientRect().bottom+1)) fits=false; }
      const act=${ACTIVE}.map(e=>e.id); return {pages:st.pages, fits, all:act.every(id=>seen[id]===1), extra:Object.keys(seen).filter(k=>!act.includes(k)).length, scroll:document.scrollingElement.scrollHeight-innerHeight, pager:document.querySelector('[data-fk="tv-pager"]').textContent}})()`);
    await b.viewport(1366, 768);
    await go('management', '/eq/fleet?tv=1', 900);
    out.s1366 = await probe();
    // rotation and pause
    const rot = await ev(`(async()=>{EQ.fleetUI.tvPage=0; EQ.fleetUI.lastFlip=Date.now()-10500; await new Promise(r=>setTimeout(r,1300)); const a=EQ.fleetTvState().page;
      document.querySelector('[data-fk="blink-pause"]').click(); await new Promise(r=>setTimeout(r,200)); EQ.fleetUI.lastFlip=Date.now()-30000; await new Promise(r=>setTimeout(r,1300)); const b=EQ.fleetTvState(); const txt=document.querySelector('[data-fk="tv-pager"]').textContent;
      document.querySelector('[data-fk="blink-pause"]').click(); await new Promise(r=>setTimeout(r,200)); return {turned:a, pausedPage:b.page, paused:b.paused, txt}})()`);
    await b.viewport(1920, 1080);
    await go('management', '/eq/fleet?tv=1', 600);
    await ev(`(()=>{const src=EQ.eq('eq-rtg-demo-02'); for(let i=0;i<40;i++){ EQ.state.D.equipment.push({...src, id:'eq-rtg-x'+i, key:'rx'+i, code:'RTG-X-'+String(i+1).padStart(2,'0'), name:'Synthetic RTG for the paging check '+(i+1), status:['readyForOps','breakdown','maintenance',null][i%4], statusSince:new Date(Date.now()-3600e3*(i+1)).toISOString(), zmmsMapped:false}); } EQ.rerender();})()`); await b.wait(900);
    out.s1920big = await probe();
    const ok = out.s1366.pages >= 2 && out.s1366.fits && out.s1366.all && out.s1366.extra === 0 && out.s1366.scroll <= 0 && /Page \d of \d/.test(out.s1366.pager)
      && rot.turned === 1 && rot.paused && rot.pausedPage === 1 && /paused/.test(rot.txt)
      && out.s1920big.pages >= 2 && out.s1920big.fits && out.s1920big.all && out.s1920big.scroll <= 0;
    return { ok, detail: { ...out, rot } };
  });

  // ------------------------------------------------------------- U1-C29 illustrations
  await step('R8-04', ['U1-C29', 'VIS06', 'VIS10', 'S02'], 'QC, RTG and ES illustrations on the fleet cards, group headers and the KPI tile (normal and TV): in-house inline SVG with the recognisable parts (QC: boom, A-frame, forestays, backstay, legs, portal, machinery house, trolley, cab, ropes, spreader, container; RTG: legs, girder, trolley, cab, spreader, container rows, tyres, e-house; ES: mast, side-pick spreader, empty container, cab, counterweight, wheels), each card shows its own type, CICT red on QC/RTG structure, no images, external references, gradients or canvases; QC proportions follow the drawing (boom tip to waterside leg : rail gauge = 75.9 : 30 within 5 %)', async () => {
    const REQ = { QC: ['boom-and-girder', 'a-frame', 'forestays', 'backstay', 'legs', 'portal', 'machinery-house', 'trolley', 'cab', 'hoist-ropes', 'spreader', 'container'], RTG: ['legs', 'girder', 'trolley', 'cab', 'spreader', 'container', 'container-rows', 'tyres', 'e-house'], ES: ['mast', 'spreader', 'container', 'cab', 'counterweight', 'wheels', 'chassis'] };
    const res = {};
    for (const [label, hash] of [['normal', '/eq/fleet'], ['tv', '/eq/fleet?tv=1']]) {
      await go('eqTeam', hash, 800);
      res[label] = await ev(`(()=>{const REQ=${JSON.stringify(REQ)}; const arts=[...document.querySelectorAll('main svg.eq-art')];
        const where=(s)=>s.closest('.eq-card')?'card':s.closest('.fleet-group > header')?'group':s.closest('.kpi')?'kpi':'other';
        const missing=[]; arts.forEach(s=>{const parts=[...s.querySelectorAll('g[data-part]')].map(g=>g.dataset.part); REQ[s.dataset.art].forEach(p=>{if(!parts.includes(p)) missing.push(s.dataset.art+':'+p)})});
        const cardTypeOk=[...document.querySelectorAll('.eq-card')].every(c=>{const s=c.querySelector('svg.eq-art'); return s && s.dataset.art===EQ.eq(c.dataset.eq).typeCode});
        const html=arts.map(s=>s.outerHTML).join('');
        const qc=document.querySelector('.eq-card svg.eq-art[data-art="QC"]'); const bb=(k)=>qc.querySelector('g[data-part="'+k+'"]').getBBox(); const boom=bb('boom-and-girder'), legs=bb('legs');
        const ws=legs.x+1.8, ls=legs.x+legs.width-1.8, ratio=(ws-boom.x)/(ls-ws);
        const reds=['QC','RTG'].map(t=>{const s=document.querySelector('svg.eq-art[data-art="'+t+'"] g[data-part="legs"] path'); return s&&s.getAttribute('fill')});
        return {count:arts.length, places:arts.reduce((a,s)=>{a[where(s)]=(a[where(s)]||0)+1; return a},{}), types:[...new Set(arts.map(s=>s.dataset.art))].sort(), missing, cardTypeOk,
          images:/<image|href=|xlink|url\\(|Gradient|<foreignObject|<script/i.test(html), canvases:document.querySelectorAll('canvas').length, ratio:Math.round(ratio*1000)/1000, want:Math.round(75.9/30*1000)/1000, reds, aria:arts.every(s=>s.getAttribute('aria-hidden')==='true')}})()`);
    }
    const n = res.normal, t = res.tv;
    const ok = [n, t].every((r) => r.types.join() === 'ES,QC,RTG' && !r.missing.length && r.cardTypeOk && !r.images && r.canvases === 0 && Math.abs(r.ratio / r.want - 1) <= 0.05 && r.reds.every((x) => x === '#c7261c') && r.aria)
      && n.places.card === 16 && n.places.group === 3 && n.places.kpi === 3 && t.places.card === 16 && t.places.group === 3 && t.places.kpi === 3;
    return { ok, detail: res };
  });

  // ------------------------------------------------------------- U1-C30 blink
  const blinkProbe = (scope) => ev(`(()=>{const cards=[...document.querySelectorAll('${scope} .eq-card')];
    const info=cards.map(c=>{const cs=getComputedStyle(c), be=getComputedStyle(c,'::before'); const k=EQ.statusKey(EQ.eq(c.dataset.eq).status);
      return {id:c.dataset.eq, k, blink:c.dataset.blink||null, anim:cs.animationName, dur:cs.animationDuration, iter:cs.animationIterationCount, bg:cs.backgroundColor, shadow:cs.boxShadow, stripe:be.content!=='none'?(be.borderLeftStyle==='dashed'?'dashed':be.backgroundColor):'none', badge:!!(c.querySelector('.badge svg')&&c.querySelector('.badge').textContent.trim()===EQ.STATUS[k].label), label:c.getAttribute('aria-label')||''}});
    return info})()`);
  await step('R8-05', ['U1-C30', 'VIS06', 'OPS02'], 'Blink: every active Breakdown card pulses rose (2.5 s, 0.4 flashes/s) and every Maintenance card amber (3.5 s, 0.29 flashes/s), both below 3 flashes per second, with different colours, rhythm and stripe pattern (solid / dashed); Ready for OPS and Unreported never blink; status stays as icon + text badge and in the accessible name; the blink changes no layout (card boxes identical at 0, 25, 50, 75 % of the cycle); peak colours differ in hue from each other (>= 40 degrees) and from the CICT paint red; also in TV mode', async () => {
    const res = {};
    for (const [label, hash] of [['normal', '/eq/fleet'], ['tv', '/eq/fleet?tv=1']]) {
      await go('eqTeam', hash, 800);
      const info = await blinkProbe('main');
      const rects = await ev(`(async()=>{const anims=document.getAnimations().filter(a=>a.animationName&&/pa-blink/.test(a.animationName)); const snap=()=>[...document.querySelectorAll('.eq-card')].map(c=>{const r=c.getBoundingClientRect(); return [r.x,r.y,r.width,r.height].map(v=>Math.round(v*100)/100).join(',')}).join(';');
        const out=[]; const peaks={}; for(const f of [0,.25,.5,.75]){ anims.forEach(a=>{a.pause(); a.currentTime=f*a.effect.getTiming().duration}); await new Promise(r=>requestAnimationFrame(()=>r())); out.push(snap());
          if(f===.5) anims.forEach(a=>{const c=a.effect.target; peaks[c.dataset.blink]=getComputedStyle(c).backgroundColor}); }
        anims.forEach(a=>a.play()); return {same:out.every(x=>x===out[0]), n:anims.length, peaks}})()`);
      res[label] = { info, rects };
    }
    const rgb = (s) => (s.match(/\d+/g) || []).slice(0, 3).map(Number);
    const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
    const hue = ([r, g, bl]) => { r /= 255; g /= 255; bl /= 255; const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn; if (!d) return 0; const hh = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; return (hh * 60 + 360) % 360; };
    const hueGap = (a, b2) => { const x = Math.abs(hue(a) - hue(b2)); return Math.min(x, 360 - x); };
    const chk = (r) => {
      const act = r.info;
      const bd = act.filter((x) => x.k === 'breakdown'), mt = act.filter((x) => x.k === 'maintenance'), other = act.filter((x) => x.k === 'readyForOps' || x.k === 'unreported');
      const pk = r.rects.peaks; const pb = rgb(pk.breakdown || ''), pm = rgb(pk.maintenance || ''), paint = [0xc7, 0x26, 0x1c];
      return bd.length >= 1 && mt.length >= 1 && bd.every((x) => x.blink === 'breakdown' && x.anim === 'pa-blink-breakdown' && x.dur === '2.5s' && x.iter === 'infinite' && x.stripe !== 'none' && x.stripe !== 'dashed')
        && mt.every((x) => x.blink === 'maintenance' && x.anim === 'pa-blink-maintenance' && x.dur === '3.5s' && x.iter === 'infinite' && x.stripe === 'dashed')
        && other.every((x) => x.blink === null && x.anim === 'none' && x.stripe === 'none') && act.every((x) => x.badge && x.label.includes(EQ_LABEL[x.k]))
        && 1 / 1.2 < 3 && 1 / 2.4 < 3 && r.rects.same && r.rects.n === bd.length + mt.length && hueGap(pb, pm) >= 40 && hueGap(pb, paint) >= 20 && dist(pb, paint) > 120 && dist(pm, paint) > 120;
    };
    const EQ_LABEL = { readyForOps: 'Ready for OPS', breakdown: 'Breakdown', maintenance: 'Maintenance', unreported: 'Unreported' };
    const ok = chk(res.normal) && chk(res.tv) && res.normal.info.length === 16;
    return { ok, detail: { hueGap: Math.round(hueGap(rgb(res.normal.rects.peaks.breakdown || ''), rgb(res.normal.rects.peaks.maintenance || ''))), normal: { peaks: res.normal.rects.peaks, sameBoxes: res.normal.rects.same, anims: res.normal.rects.n, cards: res.normal.info.map((x) => x.id.slice(3) + ':' + (x.blink || '-') + ':' + x.dur + ':' + x.stripe) }, tv: { peaks: res.tv.rects.peaks, sameBoxes: res.tv.rects.same, anims: res.tv.rects.n } } };
  });

  await step('R8-06', ['U1-C30', 'OPS02', 'FDB03'], 'Reduced motion, Pause and motion=off: with prefers-reduced-motion the blinking cards show a steady highlighted fill and ring (no animation) in normal and TV mode; the Pause blinking control (aria-pressed) gives the same steady state and Resume restores the blink; ?motion=off starts paused with the control disabled; the legend and badges keep the meaning without colour', async () => {
    const res = {};
    await reduced(true);
    for (const [label, hash] of [['normalReduced', '/eq/fleet'], ['tvReduced', '/eq/fleet?tv=1']]) { await go('eqTeam', hash, 800); res[label] = await blinkProbe('main'); }
    await reduced(false);
    await go('eqTeam', '/eq/fleet', 700);
    await ev(`document.querySelector('[data-fk="blink-pause"]').click()`); await b.wait(300);
    res.paused = await blinkProbe('main'); res.pausedBtn = await ev(`(()=>{const x=document.querySelector('[data-fk="blink-pause"]'); return {pressed:x.getAttribute('aria-pressed'), text:x.textContent.trim(), page:document.querySelector('.fleet-page').dataset.blinkState}})()`);
    await ev(`document.querySelector('[data-fk="blink-pause"]').click()`); await b.wait(300);
    res.resumed = await blinkProbe('main');
    await go('eqTeam', '/eq/fleet?tv=1&motion=off', 700); res.motionOff = await blinkProbe('main'); res.motionOffBtn = await ev(`({disabled:document.querySelector('[data-fk="blink-pause"]').disabled, pressed:document.querySelector('[data-fk="blink-pause"]').getAttribute('aria-pressed')})`);
    const legend = await ev(`[...document.querySelectorAll('.blink-legend')].map(l=>l.textContent)`);
    const steady = (arr) => { const bl = arr.filter((x) => x.blink); return bl.length >= 4 && bl.every((x) => x.anim === 'none' && /inset/.test(x.shadow) && x.bg !== 'rgb(255, 255, 255)') && arr.filter((x) => !x.blink).every((x) => x.bg === 'rgb(255, 255, 255)' || x.k === 'retired'); };
    const ok = steady(res.normalReduced) && steady(res.tvReduced) && steady(res.paused) && res.pausedBtn.pressed === 'true' && /Resume blinking/.test(res.pausedBtn.text) && res.pausedBtn.page === 'paused'
      && res.resumed.filter((x) => x.blink).every((x) => /pa-blink/.test(x.anim)) && steady(res.motionOff) && res.motionOffBtn.disabled && res.motionOffBtn.pressed === 'true'
      && legend.length >= 1 && legend.every((t) => /Breakdown/.test(t) && /Maintenance/.test(t));
    const sum = (arr) => arr.filter((x) => x.blink).map((x) => x.blink[0] + ':' + x.anim + ':' + x.bg).slice(0, 4);
    return { ok, detail: { normalReduced: sum(res.normalReduced), tvReduced: sum(res.tvReduced), paused: sum(res.paused), pausedBtn: res.pausedBtn, resumed: sum(res.resumed), motionOff: sum(res.motionOff), motionOffBtn: res.motionOffBtn, legend } };
  });

  // ------------------------------------------------------------- U1-C31 restyle
  await step('R8-07', ['U1-C31', 'U1-C02', 'S02', 'OPS02'], 'Flat pastel professional EQ Fleet: light neutral page, white rounded cards and KPI tiles with soft shadows, a six-tile KPI row (active with type illustrations, Ready-for-OPS share, four status tiles that filter), restrained colours; no gradients, glow (text-shadow), backdrop blur, neon or glass anywhere on the page; sans-serif type; U1-C02 density kept (cards <= 60 px, whole fleet on one 1366x768 screen); status colours distinct from CICT paint red', async () => {
    const out = {};
    for (const [label, w, hh] of [['1920', 1920, 1080], ['1366', 1366, 768]]) {
      await b.viewport(w, hh);
      await go('eqTeam', '/eq/fleet', 800);
      out[label] = await ev(`(()=>{const all=[...document.querySelectorAll('body, body *')]; const cs=(e)=>getComputedStyle(e);
        const grad=all.filter(e=>/gradient/.test(cs(e).backgroundImage)).map(e=>e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).slice(0,5);
        const glow=all.filter(e=>cs(e).textShadow!=='none'||cs(e).backdropFilter!=='none'&&cs(e).backdropFilter!==''||cs(e).filter!=='none').map(e=>String(e.className)).slice(0,5);
        const kpis=[...document.querySelectorAll('.kpi-row > .kpi')]; const cards=[...document.querySelectorAll('.eq-card')];
        const r=(e)=>parseFloat(cs(e).borderTopLeftRadius);
        return {page:cs(document.body).backgroundColor, grad, glow, kpis:kpis.map(k=>k.dataset.kpi), kpiWhite:kpis.every(k=>cs(k).backgroundColor==='rgb(255, 255, 255)'), kpiRadius:Math.min(...kpis.map(r)), kpiShadow:kpis.every(k=>cs(k).boxShadow!=='none'),
          statusButtons:kpis.filter(k=>k.tagName==='BUTTON'&&k.hasAttribute('aria-pressed')).length, cardRadius:Math.min(...cards.map(r)), cardShadow:cards.every(c=>cs(c).boxShadow!=='none'), font:cs(document.querySelector('.eq-card .code')).fontFamily,
          maxH:Math.max(...cards.map(c=>c.getBoundingClientRect().height)), maxBottom:Math.max(...cards.map(c=>c.getBoundingClientRect().bottom)), h1:document.querySelector('main h1').className, scrollX:document.scrollingElement.scrollWidth-innerWidth}})()`);
    }
    await b.viewport(1920, 1080);
    const fx = out['1920'], sx = out['1366'];
    const ok = [fx, sx].every((r) => r.page === 'rgb(242, 242, 238)' && !r.grad.length && !r.glow.length && r.kpis.join() === 'total,share,readyForOps,breakdown,maintenance,unreported' && r.kpiWhite && r.kpiRadius >= 12 && r.kpiShadow && r.statusButtons === 4 && r.cardRadius >= 12 && r.cardShadow && /Inter|Segoe UI/.test(r.font) && r.maxH <= 60 && /sr-only/.test(r.h1) && r.scrollX <= 0)
      && sx.maxBottom <= 768;
    return { ok, detail: out };
  });

  await step('R8-08', ['U1-C28', 'U1-C30', 'U1-C31', 'S02', 'OPS01', 'OPS02'], 'Accessibility and reconciliation after the restyle: the self-audit finds no issue on the normal and TV fleet (names, ids, aria references, no focusable inside aria-hidden) at 1920, 1366, tablet and phone; status tile filters reconcile with the cards; phone shows one card column and two KPI columns without horizontal scroll; no console errors', async () => {
    const bad = []; const sizes = [['1920', 1920, 1080, false], ['1366', 1366, 768, false], ['tablet', 820, 1180, false], ['phone', 390, 844, true]];
    for (const [label, w, hh, mob] of sizes) {
      await b.viewport(w, hh, mob);
      for (const hash of ['/eq/fleet', '/eq/fleet?tv=1', '/eq/fleet?layout=table']) {
        await go('eqTeam', hash, 650);
        const a = await ev(`(()=>{const au=window.__protoAudit(); return {issues:au.issues.slice(0,3), h1:au.h1, canvases:au.canvases, over:document.scrollingElement.scrollWidth>innerWidth+1}})()`);
        const errs = b.errors();
        if (a.issues.length || a.h1 < 1 || a.canvases || a.over || errs.length) bad.push(label + ' ' + hash + ' ' + JSON.stringify({ ...a, errs: errs.slice(0, 2) }));
      }
    }
    await b.viewport(390, 844, true); await go('eqTeam', '/eq/fleet', 600);
    const phone = await ev(`({cols:new Set([...document.querySelectorAll('.eq-card')].map(c=>Math.round(c.getBoundingClientRect().x))).size, kpiCols:new Set([...document.querySelectorAll('.kpi-row > .kpi')].map(c=>Math.round(c.getBoundingClientRect().x))).size})`);
    await b.viewport(1920, 1080);
    const rec2 = [];
    for (const s of ['readyForOps', 'breakdown', 'maintenance', 'unreported']) {
      await go('eqTeam', '/eq/fleet', 500); const n = await ev(`document.querySelector('[data-fk="cc-${s}"] .n').textContent`);
      await ev(`document.querySelector('[data-fk="cc-${s}"]').click()`); await b.wait(400);
      const r = await ev(`({cards:document.querySelectorAll('.eq-card').length, pressed:document.querySelector('[data-fk="cc-${s}"]').getAttribute('aria-pressed')})`);
      rec2.push([s, n, r.cards, r.pressed]);
    }
    const ok = !bad.length && phone.cols === 1 && phone.kpiCols === 2 && rec2.every(([, n, c, p]) => String(c) === n && p === 'true');
    return { ok, detail: { bad: bad.slice(0, 6), phone, filters: rec2 } };
  });

  // ------------------------------------------------------------- FAC unchanged
  // U1-C32 deliberately replaces the equipment viewport. Its behavior is covered by check_unified_viewer.mjs.
  // Retain exact style comparisons for every unaffected FAC route and EQ Jobs.
  if (HEAD) await step('R8-09', ['U1-C31', 'S23', 'S27'], 'FAC screens and EQ Jobs look unchanged: computed styles of every element on the FAC Dashboard (normal and TV), FAC Jobs, a FAC job and EQ Jobs are identical to the committed baseline; equipment viewer superseded by U1-C32', async () => {
    const ROUTES = [['management', '/fac/dashboard?motion=off'], ['management', '/fac/dashboard?tv=1&motion=off'], ['facTeam', '/fac/jobs'], ['facTeam', '/fac/jobs/fj-3'], ['eqTeam', '/eq/jobs/special']];
    const PROPS = ['color', 'background-color', 'background-image', 'font-size', 'font-weight', 'font-family', 'line-height', 'border-top-color', 'border-top-width', 'border-top-style', 'border-left-color', 'border-left-width', 'border-top-left-radius', 'box-shadow', 'padding-top', 'padding-left', 'margin-top', 'margin-left', 'display', 'gap', 'grid-template-columns', 'flex-direction', 'text-transform', 'letter-spacing', 'opacity', 'animation-name', 'visibility'];
    const fp = async (base, role, hash) => { await go(role, hash, 1100, base); return ev(`(()=>{const P=${JSON.stringify(PROPS)}; const els=[document.documentElement, document.body, ...document.querySelectorAll('.proto-banner, .proto-banner *, .topbar, .topbar *, main, main *')];
      return {n:els.length, rows:els.map(e=>{const cs=getComputedStyle(e); return (e.tagName+'.'+(typeof e.className==='string'?e.className:(e.className&&e.className.baseVal)||'')).slice(0,80)+'|'+P.map(p=>cs.getPropertyValue(p)).join('|')})}})()`); };
    const diffs = [];
    for (const [role, hash] of ROUTES) {
      await b.viewport(1920, 1080);
      const a = await fp(HEAD, role, hash), c = await fp(P02, role, hash);
      const d = []; const n = Math.max(a.rows.length, c.rows.length);
      for (let i = 0; i < n && d.length < 3; i++) if (a.rows[i] !== c.rows[i]) d.push({ i, head: (a.rows[i] || '').slice(0, 300), now: (c.rows[i] || '').slice(0, 300) });
      diffs.push({ route: role + ' ' + hash, elements: [a.n, c.n], differences: d.length, sample: d });
    }
    return { ok: diffs.every((x) => x.differences === 0 && x.elements[0] === x.elements[1] && x.elements[0] > 20), detail: diffs };
  });
} finally {
  await b.close();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const pass = results.filter((r) => r.status === 'PASS').length;
  fs.writeFileSync(outFile, JSON.stringify({ ranAt: new Date().toISOString(), p02: P02, head: HEAD, note: 'Prototype-level checks only (synthetic data, simulated personas, no persistence, no ZMMS contact).', pass, total: results.length, results }, null, 2));
  console.log(pass + '/' + results.length + ' PASS -> ' + outFile);
}
