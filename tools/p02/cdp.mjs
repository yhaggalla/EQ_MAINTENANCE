// Tiny Chrome DevTools Protocol driver (no dependencies; Node >= 22 global WebSocket).
// Used by tools/p02/capture.mjs and tools/p02/check_prototype.mjs. Launches a throw-away headless Chrome profile.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// EQ_CHROME overrides; the Linux path is the Playwright Chromium used in the cloud container (U1 round 3).
const CHROME = [process.env.EQ_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].filter(Boolean).find((p) => fs.existsSync(p));
const LINUX_ARGS = process.platform === 'linux' ? ['--no-sandbox'] : []; // the container runs as root

export async function launch({ port = 9340 } = {}) {
  if (!CHROME) throw new Error('No Chrome/Edge found');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'eq-p02-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', ...LINUX_ARGS, '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 60; i++) {
    try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!ver) throw new Error('Chrome did not start');
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(d.error.message)) : res(d.result); }
    else if (d.method) events.push(d);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  const api = {
    browser: ver.Browser, send, events,
    errors() { return events.filter((e) => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')).map((e) => (e.params.exceptionDetails ? e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text : e.params.args ? e.params.args.map((a) => a.value || a.description).join(' ') : e.params.entry.text)); },
    clearEvents() { events.length = 0; },
    async viewport(w, h, mobile = false, dpr = 1) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile }); },
    async goto(url) { await send('Page.navigate', { url: 'about:blank' }); await new Promise((r) => setTimeout(r, 120)); await send('Page.navigate', { url }); await new Promise((r) => setTimeout(r, 700)); },
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; },
    async wait(ms) { await new Promise((r) => setTimeout(r, ms)); },
    async click(sel) { const ok = await api.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.scrollIntoView({block:'center'});if(typeof e.click==='function')e.click();else e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true})()`); if (!ok) throw new Error('click: no element ' + sel); await api.wait(120); },
    async clickText(sel, text) { const ok = await api.eval(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(x=>x.textContent.trim().includes(${JSON.stringify(text)}));if(!e)return false;e.scrollIntoView({block:'center'});e.click();return true})()`); if (!ok) throw new Error('clickText: no element ' + sel + ' ' + text); await api.wait(120); },
    async clickIn(containerSel, containerText, btnText) { const ok = await api.eval(`(()=>{const c=[...document.querySelectorAll(${JSON.stringify(containerSel)})].find(x=>x.textContent.includes(${JSON.stringify(containerText)}));if(!c)return 'nocontainer';const e=[...c.querySelectorAll('button,a')].find(x=>x.textContent.trim().includes(${JSON.stringify(btnText)}));if(!e)return 'nobutton';e.scrollIntoView({block:'center'});e.click();return 'ok'})()`); if (ok !== 'ok') throw new Error('clickIn: ' + ok + ' ' + containerText + ' / ' + btnText); await api.wait(150); },
    async setValue(sel, value) { const ok = await api.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.focus();e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`); if (!ok) throw new Error('setValue: no element ' + sel); await api.wait(80); },
    async key(key, { shift = false, code } = {}) {
      const map = { Tab: 9, Enter: 13, Escape: 27, ' ': 32, ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35 };
      const p = { key, code: code || (key.length === 1 ? 'Key' + key.toUpperCase() : key), windowsVirtualKeyCode: map[key] || key.charCodeAt(0), modifiers: shift ? 8 : 0 };
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p });
      if (key === 'Enter') await send('Input.dispatchKeyEvent', { type: 'char', text: '\r', ...p });
      if (key === ' ') await send('Input.dispatchKeyEvent', { type: 'char', text: ' ', ...p });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
      await api.wait(60);
    },
    async screenshot(file, { fullPage = false } = {}) {
      let params = { format: 'png', captureBeyondViewport: fullPage };
      if (fullPage) {
        const m = await send('Page.getLayoutMetrics');
        const h = Math.ceil(m.cssContentSize?.height || m.contentSize.height);
        params = { ...params, clip: { x: 0, y: 0, width: Math.ceil(m.cssContentSize?.width || m.contentSize.width), height: Math.min(h, 4000), scale: 1 } };
      }
      const r = await send('Page.captureScreenshot', params);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async close() { try { await send('Browser.close'); } catch { /* ignore */ } try { ws.close(); } catch { /* ignore */ } proc.kill(); await new Promise((r) => setTimeout(r, 400)); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ } },
  };
  return api;
}
