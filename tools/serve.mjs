// Static server that mimics GitHub Pages: serves the repo at /mo-phong-song-thpt-tran-quoc-toan/
// Usage: node tools/serve.mjs [port]   (default 8765)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/mo-phong-song-thpt-tran-quoc-toan/';
const PORT = +(process.argv[2] || 8765);
const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (u === '/' || u === BASE.slice(0, -1)) { res.writeHead(302, {Location: BASE}); return res.end(); }
  if (!u.startsWith(BASE)) { res.writeHead(404); return res.end('404 (outside ' + BASE + ')'); }
  let p = path.join(ROOT, u.slice(BASE.length));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(buf);
  });
}).listen(PORT, () => console.log('Serving ' + ROOT + ' at http://localhost:' + PORT + BASE));
