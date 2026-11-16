// Development-only static file server; no dependencies and no build step.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./game/', import.meta.url));
const base = resolve(root);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    const path = resolve(base, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!path.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    const stat = statSync(path);
    if (!stat.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    createReadStream(path).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
});
server.on('error', (error) => { console.error('Cannot start IRONHOLD static server:', error.message); process.exitCode = 1; });
server.listen(8080, '127.0.0.1', () => console.log('IRONHOLD on http://localhost:8080'));
