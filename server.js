const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8765;
const HOST = '127.0.0.1';
const TYPES = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8'
};
const server = http.createServer((req,res)=>{
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = urlPath === '/' ? '/game.html' : urlPath;
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file,(err,st)=>{
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not Found'); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type':type,'Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(PORT,HOST,()=>console.log(`Afei V2.70 running at http://${HOST}:${PORT}/game.html`));
