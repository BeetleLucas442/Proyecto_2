# API de Eventos (Node.js + Express + MySQL) - Corte 2

## 1. Puesta en marcha
1. Instala Node 18+ y MySQL 8.
2. Ejecuta `database/schema.sql` en MySQL Workbench (crea la BD `nyxa`; **borra la BD si ya existía**).
3. Copia `.env.example` a `.env` y pon tu usuario/contraseña de MySQL.
4. `npm install` y luego `npm start`.
5. Swagger UI: http://localhost:3000/api-docs  — API base: http://localhost:3000/api

## 2. Arquitectura por capas
```
routes        -> define URI + verbo y encadena middlewares de validación
validators    -> reglas de entrada (tipos, obligatorios, formato, fecha futura)
controllers   -> traducen HTTP (req/res, códigos de estado)
services      -> reglas de negocio (existencia, duplicados, restricciones)
repositories  -> únicas consultas SQL (mysql2/promise, consultas parametrizadas)
config/db.js  -> pool de conexiones a MySQL (variables en .env)
middlewares   -> validación y manejo centralizado de errores
docs/openapi.js -> especificación OpenAPI mostrada con Swagger UI
```

## 3. Endpoints (prefijo /api)
| Recurso | Endpoints |
|---|---|
| Auth | POST /auth/login |
| Users | GET, POST /users · GET, PUT, DELETE /users/:id · GET /users/:id/tickets |
| Categories | GET, POST /categories · GET, PUT, DELETE /categories/:id |
| Events | GET (?category_id=), POST /events · GET, PUT, DELETE /events/:id · GET /events/:id/tickets |
| Participants | GET, POST /events/:eventId/participants · GET, PUT, DELETE /events/:eventId/participants/:id |
| Tickets | GET, POST /tickets · GET, DELETE /tickets/:id |

Códigos: 200/201/204 éxito · 400 validación · 401 login · 404 no existe · 409 conflicto de negocio.

## 4. Reglas de negocio implementadas (ajústalas a tu caso del corte 1)
- La fecha del evento debe ser futura al crearlo/editarlo.
- No se compran tickets de eventos ya ocurridos; un usuario tiene un solo ticket por evento.
- No se elimina un evento con tickets, ni una categoría con eventos, ni un usuario con eventos o tickets.
- Los participantes se eliminan en cascada con su evento.
- Las respuestas nunca devuelven la contraseña (guardada en texto plano solo en este corte).

## 5. Pruebas
Importa `docs/api-eventos.postman_collection.json` en Postman, Thunder Client o Insomnia. Cada endpoint tiene un caso de éxito y uno de error. Ejecuta las carpetas en orden (la de Users va primero y guarda los ids en variables; Auth usa el usuario ana@correo.com / 1234 creado ahí). La carpeta final elimina los datos de prueba.
