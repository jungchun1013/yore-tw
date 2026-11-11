// preview dist-site/ the way Cloudflare assets serve it: /about -> about.html, /en/ -> en/index.html
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2] || require("path").join(__dirname, "..", "dist-site");
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };
const rfile = path.join(root, '_redirects');
const redirects = fs.existsSync(rfile) ? fs.readFileSync(rfile, 'utf8').split('\n').filter(Boolean).map((l) => l.split(/\s+/)) : [];
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const r = redirects.find(([from]) => from === p);
  if (r) { res.writeHead(Number(r[2] || 302), { location: r[1] }); res.end(); return; }
  let f = path.join(root, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  else if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404 ' + p); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(4100, () => console.log("http://localhost:4100"));
