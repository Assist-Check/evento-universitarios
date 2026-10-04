// Microservicio 1: Gestión de eventos (CRUD)
const { err, idNum, fechaOk, db, serve } = require('./lib');
const s = db('eventos.json', { ultimoId: 0, eventos: [] });

function validar(b) {
  const e = [];
  for (const c of ['nombre', 'lugar', 'categoria']) if (typeof b[c] !== 'string' || !b[c].trim()) e.push(`${c} es obligatorio`);
  if (!fechaOk(b.fecha)) e.push('fecha debe tener formato AAAA-MM-DD y ser una fecha válida');
  if (!Number.isInteger(b.cupo) || b.cupo < 1) e.push('cupo debe ser un entero mayor que 0');
  if (e.length) throw err(400, e.join('; '));
  return { nombre: b.nombre.trim(), fecha: b.fecha, lugar: b.lugar.trim(), categoria: b.categoria.trim().toLowerCase(), cupo: b.cupo };
}
const buscar = id => { const e = s.d.eventos.find(x => x.id === idNum(id)); if (!e) throw err(404, 'El evento no existe'); return e; };
const has = (txt, q) => txt.toLowerCase().includes(q.toLowerCase());

serve([
  ['GET', '/health', () => [200, { estado: 'ok', servicio: 'eventos' }]],
  ['POST', '/eventos', ({ body }) => { const e = { id: ++s.d.ultimoId, ...validar(body) }; s.d.eventos.push(e); s.save(); return [201, e]; }],
  ['GET', '/eventos', ({ query: q }) => {
    for (const k of ['desde', 'hasta']) if (q[k] && !fechaOk(q[k])) throw err(400, `${k} debe tener formato AAAA-MM-DD`);
    return [200, s.d.eventos.filter(e =>
      (!q.categoria || e.categoria === q.categoria.toLowerCase()) && (!q.lugar || has(e.lugar, q.lugar)) &&
      (!q.nombre || has(e.nombre, q.nombre)) && (!q.desde || e.fecha >= q.desde) && (!q.hasta || e.fecha <= q.hasta)
    ).sort((a, b) => a.fecha.localeCompare(b.fecha))];
  }],
  ['GET', '/eventos/:id', ({ params }) => [200, buscar(params.id)]],
  ['PUT', '/eventos/:id', ({ params, body }) => { const e = buscar(params.id); Object.assign(e, validar(body)); s.save(); return [200, e]; }],
  ['DELETE', '/eventos/:id', ({ params }) => { const e = buscar(params.id); s.d.eventos = s.d.eventos.filter(x => x !== e); s.save(); return [200, { mensaje: 'Evento eliminado', evento: e }]; }],
], 3001);
