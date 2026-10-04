// Microservicio 2: Gestión de inscripciones (participantes)
const { err, idNum, db, call, serve } = require('./lib');
const EV = process.env.EVENTOS_URL || 'http://localhost:3001';
const s = db('inscripciones.json', { ultimoPart: 0, ultimaInsc: 0, participantes: [], inscripciones: [] });

const evento = id => call(`${EV}/eventos/${idNum(id)}`); // 404 si no existe
const unir = i => { const p = s.d.participantes.find(x => x.id === i.participanteId);
  return { inscripcionId: i.id, eventoId: i.eventoId, fecha: i.fecha, participanteId: p.id, nombre: p.nombre, correo: p.correo, programa: p.programa, semestre: p.semestre }; };
function listar(q, eventoId) {
  if (q.semestre !== undefined && !(/^\d+$/.test(q.semestre) && +q.semestre >= 1 && +q.semestre <= 12)) throw err(400, 'semestre debe ser un entero entre 1 y 12');
  return s.d.inscripciones.filter(i => !eventoId || i.eventoId === eventoId).map(unir)
    .filter(r => (!q.programa || r.programa.toLowerCase() === q.programa.toLowerCase()) && (!q.semestre || r.semestre === +q.semestre));
}

serve([
  ['GET', '/health', () => [200, { estado: 'ok', servicio: 'inscripciones' }]],
  ['POST', '/eventos/:eventoId/inscripciones', async ({ params, body: b }) => {
    const ev = await evento(params.eventoId);
    const e = [];
    for (const c of ['nombre', 'programa']) if (typeof b[c] !== 'string' || !b[c].trim()) e.push(`${c} es obligatorio`);
    if (typeof b.correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.correo.trim())) e.push('correo no es válido');
    if (!Number.isInteger(b.semestre) || b.semestre < 1 || b.semestre > 12) e.push('semestre debe ser un entero entre 1 y 12');
    if (e.length) throw err(400, e.join('; '));
    const correo = b.correo.trim().toLowerCase();
    let p = s.d.participantes.find(x => x.correo === correo);
    const inscritos = s.d.inscripciones.filter(i => i.eventoId === ev.id);
    if (p && inscritos.some(i => i.participanteId === p.id)) throw err(409, 'El participante ya está inscrito en este evento');
    if (inscritos.length >= ev.cupo) throw err(409, 'El evento no tiene cupos disponibles');
    if (!p) { p = { id: ++s.d.ultimoPart, nombre: b.nombre.trim(), correo, programa: b.programa.trim(), semestre: b.semestre }; s.d.participantes.push(p); }
    const i = { id: ++s.d.ultimaInsc, eventoId: ev.id, participanteId: p.id, fecha: new Date().toISOString().slice(0, 10) };
    s.d.inscripciones.push(i); s.save();
    return [201, { ...i, participante: p }];
  }],
  ['GET', '/eventos/:eventoId/participantes', async ({ params, query }) => {
    const ev = await evento(params.eventoId);
    const lista = listar(query, ev.id);
    return [200, { evento: ev.nombre, cupo: ev.cupo, total: lista.length, participantes: lista }];
  }],
  ['GET', '/inscripciones', ({ query }) => [200, listar(query, query.eventoId ? idNum(query.eventoId) : null)]],
], 3002);
