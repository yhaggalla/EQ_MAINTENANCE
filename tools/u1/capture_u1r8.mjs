// U1 round 8 screenshots (EQ Fleet restyle, illustrations, blink, TV mode) into docs/evidence/U1/repair-r8/.
// Needs the prototype served from disk: node artifacts/prototypes/p02-ui/serve.mjs  (http://127.0.0.1:5312/)
// Usage: node tools/u1/capture_u1r8.mjs [p02Url] [outDir]
// Full-page shots freeze the blink at its peak (50 % of the cycle) so it is visible in a still image; the close-ups show
// the peak and the off phase. Synthetic data only.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../p03/cdp.mjs';

const P02 = process.argv[2] || 'http://127.0.0.1:5312/';
const OUT = process.argv[3] || 'docs/evidence/U1/repair-r8';
try { const r = await fetch(P02); if (!r.ok) throw new Error('HTTP ' + r.status); } catch (e) { console.error('Server not reachable: ' + P02 + ' (' + e.message + '). Start it first; nothing written.'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const b = await launch({ port: 9393 });
const shots = [];
const go = async (role, hash, wait = 1000) => { b.clearEvents(); await b.goto(P02 + '?role=' + role + '#' + hash); await b.wait(wait); };
const freeze = (f) => b.eval(`(async()=>{document.getAnimations().filter(a=>/pa-blink/.test(a.animationName||'')).forEach(a=>{a.pause(); a.currentTime=${f}*a.effect.getTiming().duration}); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); return 1})()`);
const save = async (name, note, opts) => { const f = path.join(OUT, name); await b.screenshot(f, opts); shots.push({ file: f.replace(/\\/g, '/'), note, errors: b.errors().slice(0, 2) }); console.log('saved', f); };
const clip = async (name, note, sel, pad = 10) => {
  const r = await b.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  if (!r) { shots.push({ file: name, note: 'NOT FOUND ' + sel }); return; }
  const shot = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + 2 * pad, height: r.h + 2 * pad, scale: 2 } });
  const f = path.join(OUT, name); fs.writeFileSync(f, Buffer.from(shot.data, 'base64')); shots.push({ file: f.replace(/\\/g, '/'), note }); console.log('saved', f);
};
const reduced = (on) => b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] });

try {
  await reduced(false);
  await b.viewport(1920, 1080);
  await go('eqTeam', '/eq/fleet'); await freeze(0.5);
  await save('r8-01-eq-fleet-1920.png', 'EQ Fleet, EQ Team, 1920x1080 (blink frozen at its peak)');
  await clip('r8-05-breakdown-card-blink-peak.png', 'Breakdown card at the blink peak (rose fill and ring, solid stripe, 1.2 s cycle)', 'a.eq-card[data-eq="eq-qc-demo-04"]');
  await clip('r8-06-maintenance-card-blink-peak.png', 'Maintenance card at the blink peak (amber fill and ring, dashed stripe, 2.4 s cycle)', 'a.eq-card[data-eq="eq-qc-demo-01"]');
  await freeze(0);
  await clip('r8-05b-breakdown-card-blink-off.png', 'Breakdown card at the off phase of the blink (stripe stays)', 'a.eq-card[data-eq="eq-qc-demo-04"]');
  await clip('r8-06b-maintenance-card-blink-off.png', 'Maintenance card at the off phase of the blink (dashed stripe stays)', 'a.eq-card[data-eq="eq-qc-demo-01"]');
  await clip('r8-12-kpi-row-1920.png', 'KPI tile row: active equipment with type illustrations, Ready-for-OPS share, four status tiles (filters)', '.kpi-row', 6);

  await b.viewport(1366, 768);
  await go('eqTeam', '/eq/fleet'); await freeze(0.5);
  await save('r8-02-eq-fleet-1366.png', 'EQ Fleet, EQ Team, 1366x768 (whole synthetic fleet on one screen; blink at peak)');

  await b.viewport(1920, 1080);
  await go('management', '/eq/fleet?tv=1', 1200); await freeze(0.5);
  await save('r8-03-tv-1920.png', 'TV mode, Management, 1920x1080: one screen, read-only, Pause and Exit TV mode (blink at peak)');
  await b.viewport(1366, 768);
  await go('management', '/eq/fleet?tv=1', 1200); await freeze(0.5);
  await save('r8-04-tv-1366-page1.png', 'TV mode at 1366x768: the fleet does not fit, so it is shown in pages that turn every 10 s (Page 1 of 2)');

  await b.viewport(1920, 1080);
  await reduced(true);
  await go('eqTeam', '/eq/fleet');
  await save('r8-07-reduced-motion-1920.png', 'prefers-reduced-motion: no blinking; Breakdown and Maintenance cards keep a steady fill, ring and stripe');
  await go('management', '/eq/fleet?tv=1', 1200);
  await save('r8-07b-reduced-motion-tv-1920.png', 'TV mode with prefers-reduced-motion: steady highlight');
  await reduced(false);

  await b.viewport(820, 1180);
  await go('eqTeam', '/eq/fleet'); await freeze(0.5);
  await save('r8-08-tablet-820.png', 'EQ Fleet, tablet 820x1180 (full page)', { fullPage: true });
  await b.viewport(390, 844, true);
  await go('eqTeam', '/eq/fleet'); await freeze(0.5);
  await save('r8-09-phone-390.png', 'EQ Fleet, phone 390x844 (full page): KPI tiles in two columns, one card column', { fullPage: true });

  // illustration sheet (the same EQ.fleetArt used on the page), for review at a large size
  await b.viewport(1500, 560);
  await go('eqTeam', '/eq/fleet', 600);
  await b.eval(`(()=>{const m=document.querySelector('main'); m.replaceChildren(); const w=document.createElement('div'); w.style.cssText='display:flex;gap:24px;padding:24px;flex-wrap:wrap;align-items:flex-start';
    for(const t of ['QC','RTG','ES']){const d=document.createElement('figure'); d.style.cssText='margin:0;width:440px;background:#fff;border:1px solid #e2e4de;border-radius:14px;padding:14px;box-shadow:0 1px 2px rgb(27 39 51/5%),0 4px 14px rgb(27 39 51/6%)';
      const tile=document.createElement('div'); tile.style.cssText='height:270px;background:#eff0eb;border-radius:10px;padding:8px 10px 0;display:grid'; const s=EQ.fleetArt(t); s.style.cssText='width:100%;height:100%'; tile.appendChild(s); d.appendChild(tile);
      const c=document.createElement('figcaption'); c.style.cssText='font:600 14px Inter,Segoe UI,sans-serif;color:#34424e;margin-top:10px'; c.textContent=t+': '+EQ.fleetArtName(t)+' (in-house flat SVG; parts: '+EQ.FLEET_ART_PARTS[t].join(', ')+')'; d.appendChild(c); w.appendChild(d);} m.appendChild(w); return 1})()`);
  await b.wait(300);
  await save('r8-10-illustrations.png', 'The three equipment illustrations at a large size (QC at drawing proportions; RTG and ES typical)');

  // FAC unchanged (for the user's eye; the computed-style comparison is check R8-09)
  await b.viewport(1920, 1080);
  await go('management', '/fac/dashboard?motion=off', 1400);
  await save('r8-11-fac-dashboard-unchanged-1920.png', 'FAC Dashboard after the repair (unchanged; restyle follows after the EQ review)');
} finally {
  await b.close();
  fs.writeFileSync(path.join(OUT, 'u1-r8-captures.json'), JSON.stringify({ tool: 'tools/u1/capture_u1r8.mjs', p02: P02, date: new Date().toISOString(), note: 'Synthetic prototype data; screenshots are visual evidence only.', shots }, null, 2));
}
