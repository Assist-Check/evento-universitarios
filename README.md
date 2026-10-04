# Sistema de gestión de eventos universitarios

Actividad integradora: Backend con 3 microservicios REST, Front End y despliegue en Render. Node.js 18+ sin dependencias externas (no requiere `npm install`).

| Pieza | Carpeta | Puerto local |
|---|---|---|
| Microservicio 1: Eventos (CRUD) | `eventos-service` | 3001 |
| Microservicio 2: Inscripciones | `inscripciones-service` | 3002 |
| Microservicio 3: Reportes | `reportes-service` | 3003 |
| Front End | `frontend` | 8080 |

Documentación de endpoints: [`docs/API.md`](docs/API.md). Colección de Postman: `postman/eventos-universitarios.postman_collection.json`.

## Ejecutar en local

```bash
git clone https://github.com/TU_USUARIO/eventos-universitarios.git
cd eventos-universitarios
npm start
```

Abre `http://localhost:8080`. Para detener todo, `Ctrl+C`. Para correr la prueba automática (39 verificaciones): `npm test`.

## Probar con Postman

Importa el archivo de `postman/`. Las variables `eventos`, `inscripciones` y `reportes` de la colección apuntan a localhost; cámbialas por las URLs de Render para probar en producción.

## Despliegue en Render

Crea 3 **Web Services** desde este repositorio (uno por microservicio) con estos datos:

| Servicio | Root Directory | Build Command | Start Command | Variables de entorno |
|---|---|---|---|---|
| eventos-service | `eventos-service` | `npm install` | `npm start` | ninguna |
| inscripciones-service | `inscripciones-service` | `npm install` | `npm start` | `EVENTOS_URL` = URL pública de eventos |
| reportes-service | `reportes-service` | `npm install` | `npm start` | `EVENTOS_URL` y `INSCRIPCIONES_URL` |

Después crea un **Static Site** con Root Directory `frontend`, sin build command y Publish Directory `.`. Antes, edita `frontend/config.js` con las 3 URLs de Render y súbelo a GitHub.

Notas: el plan gratuito duerme los servicios tras unos minutos sin uso, así que la primera petición puede tardar cerca de un minuto. Los datos se guardan en archivos JSON dentro del servicio y en el plan gratuito se reinician con cada redespliegue.

## Decisiones

- El correo identifica al participante; se guarda una sola vez aunque se inscriba a varios eventos.
- Los inscritos y los reportes se calculan al consultar; no se guardan.
- Los microservicios se comunican por HTTP. Si uno no responde, el otro devuelve 500.
- Cada microservicio es independiente (tiene su propio `package.json` y `lib.js`) para poder desplegarse por separado.
