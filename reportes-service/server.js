// Microservicio 3: Reportes (consultas filtradas con Query Params)
const { call, serve } = require('./lib');
const EV = process.env.EVENTOS_URL || 'http://localhost:3001';
const IN = process.env.INSCRIPCIONES_URL || 'http://localhost:3002';
const qs = o => { const p = new URLSearchParams(); for (const k in o) if (o[k]) p.set(k, o[k]); const t = p.toString(); return t ? '?' + t : ''; };

serve([
  ['GET', '/health', () => [200, { estado: 'ok', servicio: 'reportes' }]],
  ['GET', '/reportes', async ({ query: q }) => {
    const eventos = await call(`${EV}/eventos${qs({ categoria: q.categoria, desde: q.desde, hasta: q.hasta })}`);
    const insc = await call(`${IN}/inscripciones${qs({ programa: q.programa, semestre: q.semestre })}`);
    const filas = eventos.map(e => { const n = insc.filter(i => i.eventoId === e.id).length;
      return { id: e.id, nombre: e.nombre, fecha: e.fecha, categoria: e.categoria, cupo: e.cupo, inscritos: n, ocupacionPorcentaje: Math.round(n * 100 / e.cupo) }; });
    return [200, { filtros: { categoria: q.categoria || null, desde: q.desde || null, hasta: q.hasta || null, programa: q.programa || null, semestre: q.semestre ? +q.semestre : null },
      totalEventos: filas.length, totalInscripciones: filas.reduce((a, f) => a + f.inscritos, 0), eventos: filas }];
  }],
], 3003);
