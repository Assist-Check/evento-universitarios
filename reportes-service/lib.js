const http = require('http'), fs = require('fs'), path = require('path');
const err = (status, message) => Object.assign(new Error(message), { status });
const idNum = v => { const n = Number(v); if (!Number.isInteger(n) || n < 1) throw err(400, 'El id debe ser un entero positivo'); return n; };
const fechaOk = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
const db = (file, def) => {
  const f = path.join(process.env.DATA_DIR || path.join(__dirname, 'data'), file);
  let d = def; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {}
  return { d, save() { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(this.d, null, 2)); } };
};
const call = async url => { // consulta a otro microservicio
  let r; try { r = await fetch(url, { signal: AbortSignal.timeout(60000) }); } catch { throw err(500, 'No se pudo contactar otro microservicio'); }
  const b = await r.json().catch(() => null);
  if (!r.ok) throw err(r.status < 500 ? r.status : 500, r.status < 500 ? (b && b.error) || 'Error en otro microservicio' : 'Error en otro microservicio');
  return b;
};
function serve(routes, defPort) {
  const port = process.env.PORT || defPort;
  http.createServer(async (req, res) => {
    const send = (c, b) => { res.writeHead(c, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(b === undefined ? '' : JSON.stringify(b)); };
    if (req.method === 'OPTIONS') return send(204);
    try {
      const u = new URL(req.url, 'http://x'); let body = {};
      if (req.method === 'POST' || req.method === 'PUT') {
        let raw = ''; for await (const c of req) raw += c;
        try { body = raw ? JSON.parse(raw) : {}; } catch { return send(400, { error: 'JSON inválido' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return send(400, { error: 'El body debe ser un objeto JSON' });
      }
      for (const [m, p, h] of routes) {
        if (m !== req.method) continue;
        const mt = u.pathname.match(new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'));
        if (mt) { const r = await h({ params: mt.groups || {}, query: Object.fromEntries(u.searchParams), body }); return send(r[0], r[1]); }
      }
      send(404, { error: 'Ruta no encontrada' });
    } catch (e) {
      if (e.status) return send(e.status, { error: e.message });
      console.error(e); send(500, { error: 'Error interno del servidor' });
    }
  }).listen(port, () => console.log(`Servicio activo en http://localhost:${port}`));
}
module.exports = { err, idNum, fechaOk, db, call, serve };
