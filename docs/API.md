# Documento de APIs

Tres microservicios REST (JSON). Local: eventos `:3001`, inscripciones `:3002`, reportes `:3003`. En producción cada uno tiene su URL de Render. Con body, enviar `Content-Type: application/json`.

Los errores siempre tienen la forma `{ "error": "mensaje" }`. Códigos: **200** ok, **201** creado, **400** datos inválidos, **404** no existe, **409** conflicto (ya inscrito / sin cupos), **500** error interno o servicio caído.

## Microservicio 1: Eventos (`eventos-service`)

| Método | Ruta | Tipo de parámetro | Descripción |
|---|---|---|---|
| GET | `/health` | | Estado del servicio |
| POST | `/eventos` | Body | Crea un evento → 201 |
| GET | `/eventos` | Query: `categoria`, `nombre`, `lugar`, `desde`, `hasta` | Lista eventos, filtros combinables |
| GET | `/eventos/{id}` | Path | Consulta un evento |
| PUT | `/eventos/{id}` | Path + Body | Reemplaza los datos del evento |
| DELETE | `/eventos/{id}` | Path | Elimina el evento |

Body de POST/PUT (todos obligatorios): `nombre` (texto), `fecha` (AAAA-MM-DD), `lugar` (texto), `categoria` (texto), `cupo` (entero > 0).

```json
POST /eventos
{ "nombre": "Feria de Ingeniería", "fecha": "2026-11-15", "lugar": "Auditorio Central", "categoria": "académico", "cupo": 100 }

201 → { "id": 1, "nombre": "Feria de Ingeniería", "fecha": "2026-11-15", "lugar": "Auditorio Central", "categoria": "académico", "cupo": 100 }
400 → { "error": "nombre es obligatorio; cupo debe ser un entero mayor que 0" }
404 → { "error": "El evento no existe" }
```

## Microservicio 2: Inscripciones (`inscripciones-service`)

| Método | Ruta | Tipo de parámetro | Descripción |
|---|---|---|---|
| GET | `/health` | | Estado del servicio |
| POST | `/eventos/{eventoId}/inscripciones` | Path + Body | Inscribe a un participante |
| GET | `/eventos/{eventoId}/participantes` | Path + Query: `programa`, `semestre` | Participantes de un evento |
| GET | `/inscripciones` | Query: `eventoId`, `programa`, `semestre` | Lista de inscripciones (la usa Reportes) |

Body de la inscripción: `nombre`, `correo`, `programa` (texto) y `semestre` (entero de 1 a 12). El correo identifica a la persona: si ya existe se reutiliza su registro. Orden de validación: evento inexistente (404), datos inválidos (400), ya inscrito (409), sin cupos (409).

```json
POST /eventos/1/inscripciones
{ "nombre": "Laura Gómez", "correo": "laura.gomez@universidad.edu", "programa": "Ingeniería de Sistemas", "semestre": 5 }

201 → { "id": 1, "eventoId": 1, "participanteId": 1, "fecha": "2026-10-03", "participante": { "id": 1, "nombre": "Laura Gómez", "correo": "laura.gomez@universidad.edu", "programa": "Ingeniería de Sistemas", "semestre": 5 } }
409 → { "error": "El participante ya está inscrito en este evento" }

GET /eventos/1/participantes
200 → { "evento": "Feria de Ingeniería", "cupo": 100, "total": 1, "participantes": [ { "inscripcionId": 1, "eventoId": 1, "fecha": "2026-10-03", "participanteId": 1, "nombre": "Laura Gómez", "correo": "laura.gomez@universidad.edu", "programa": "Ingeniería de Sistemas", "semestre": 5 } ] }
```

## Microservicio 3: Reportes (`reportes-service`)

| Método | Ruta | Tipo de parámetro | Descripción |
|---|---|---|---|
| GET | `/health` | | Estado del servicio |
| GET | `/reportes` | Query: `categoria`, `desde`, `hasta`, `programa`, `semestre` | Eventos con inscritos. `categoria`, `desde`, `hasta` eligen eventos; `programa` y `semestre` filtran las inscripciones |

```json
GET /reportes?categoria=académico&programa=Ingeniería de Sistemas&semestre=5

200 → { "filtros": { "categoria": "académico", "desde": null, "hasta": null, "programa": "Ingeniería de Sistemas", "semestre": 5 },
  "totalEventos": 1, "totalInscripciones": 1,
  "eventos": [ { "id": 1, "nombre": "Feria de Ingeniería", "fecha": "2026-11-15", "categoria": "académico", "cupo": 100, "inscritos": 1, "ocupacionPorcentaje": 1 } ] }
400 → { "error": "semestre debe ser un entero entre 1 y 12" }
```

Inscripciones y Reportes consultan al microservicio de Eventos por HTTP (variables `EVENTOS_URL` e `INSCRIPCIONES_URL`). Si ese servicio no responde, devuelven 500.
