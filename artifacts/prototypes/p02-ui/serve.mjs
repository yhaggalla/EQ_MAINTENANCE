// Minimal static server for the P02 prototype (no dependencies, localhost only, read-only, no uploads).
// Usage: node serve.mjs [port]   -> http://127.0.0.1:5312/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const modelRoot = path.resolve(root, '../../models');
const viewerRoot = path.resolve(root, '../p03-qc-model');
const port = Number(process.argv[2]) || 5312;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.glb': 'model/gltf-binary', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  const url = new URL(req.url, 'http://localhost');
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
  if (rel === '/') rel = '/temp-management/index.html'; // U1-T01 temporary presentation; remove before U1 approval.
  const base = rel.startsWith('/models/') ? modelRoot : rel.startsWith('/qc/') ? viewerRoot : root;
  const local = rel.startsWith('/models/') ? rel.slice(8) : rel.startsWith('/qc/') ? rel.slice(4) : rel.slice(1);
  const file = path.resolve(base, local || 'index.html');
  if (!file.startsWith(base + path.sep) || file.endsWith('serve.mjs')) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(port, '127.0.0.1', () => console.log('P02 prototype on http://127.0.0.1:' + port + '/'));
