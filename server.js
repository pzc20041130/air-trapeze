/* 本地静态服务器：node server.js [port] */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
const port = Number(process.argv[2] || process.env.PORT || 8130);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const target = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (target !== root && !target.startsWith(rootPrefix)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`空中飞人已启动: http://127.0.0.1:${port}/`);
});
