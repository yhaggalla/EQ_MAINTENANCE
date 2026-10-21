// Minimal localhost server for the P03 model prototype (no dependencies, read-only, 127.0.0.1 only).
// Usage: node artifacts/prototypes/p03-qc-model/serve.mjs [port]   -> http://127.0.0.1:5313/
// Routes: /            -> this folder (page, js, css, vendored three.js)
//         /models/...  -> artifacts/models (generated scene.glb + manifest.json; same-origin, no CDN)
//         /ref/<file>  -> two whitelisted reference files from documents/prompt-pack/reference
// The production app serves models through the authenticated /eq-maintenance asset endpoint instead (D-39).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '..', '..', '..');
const models = path.join(repo, 'artifacts', 'models');
const refs = { 'mechanisms-approved.json': path.join(repo, 'documents', 'prompt-pack', 'reference', 'mechanisms-approved.json'), 'major-parameters.json': path.join(repo, 'documents', 'prompt-pack', 'reference', 'major-parameters.json') };
const port = Number(process.argv[2]) || 5313;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.svg': 'image/svg+xml' };

function resolve(urlPath) {
  if (urlPath.startsWith('/ref/')) return refs[urlPath.slice(5)] || null;
  if (urlPath.startsWith('/models/')) { const f = path.normalize(path.join(models, urlPath.slice(8))); return f.startsWith(models + path.sep) ? f : null; }
  const f = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
  return f.startsWith(root) && !f.endsWith('serve.mjs') ? f : null;
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  const url = new URL(req.url, 'http://localhost');
  const file = resolve(decodeURIComponent(url.pathname));
  if (!file) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(port, '127.0.0.1', () => console.log('P03 model prototype on http://127.0.0.1:' + port + '/'));
