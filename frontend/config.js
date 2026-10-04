// Cambia las URLs de producción por las de tus servicios en Render
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
window.CONFIG = local
  ? { EVENTOS: 'http://localhost:3001', INSCRIPCIONES: 'http://localhost:3002', REPORTES: 'http://localhost:3003' }
  : { EVENTOS: 'https://CAMBIAR-eventos-service.onrender.com', INSCRIPCIONES: 'https://CAMBIAR-inscripciones-service.onrender.com', REPORTES: 'https://CAMBIAR-reportes-service.onrender.com' };
