// Arranca los 3 microservicios y el Front End en local
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), path = require('path');
for (const d of ['eventos-service', 'inscripciones-service', 'reportes-service']) spawn('node', ['server.js'], { cwd: path.join(__dirname, d), stdio: 'inherit' });
const root = path.join(__dirname, 'frontend'), T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript' };
http.createServer((q, r) => {
  const p = q.url.split('?')[0], f = path.join(root, p === '/' ? 'index.html' : p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('No encontrado'); }
  r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(r);
}).listen(8080, () => console.log('Front End: http://localhost:8080'));
