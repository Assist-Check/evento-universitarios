// Cambia las URLs de producción por las de tus servicios en Render
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
window.CONFIG = local
  ? { EVENTOS: 'http://localhost:3001', INSCRIPCIONES: 'http://localhost:3002', REPORTES: 'http://localhost:3003' }
  : { EVENTOS: 'https://eventos-service.onrender.com', INSCRIPCIONES: 'https://inscripciones-service.onrender.com', REPORTES: 'https://reportes-service-d4dv.onrender.com' };