// Genera docs/api-eventos.postman_collection.json (importable en Postman, Thunder Client e Insomnia)
const fs = require('fs');
const H = [{ key: 'Content-Type', value: 'application/json' }];
const req = (name, method, path, body, expect, setVar) => ({
  name,
  event: [{ listen: 'test', script: { type: 'text/javascript', exec: [
    `pm.test('Status ${expect}', () => pm.response.to.have.status(${expect}));`,
    ...(setVar ? [`pm.collectionVariables.set('${setVar}', pm.response.json().id);`] : [])
  ] } }],
  request: {
    method, header: body ? H : [],
    url: { raw: `{{baseUrl}}${path}`, host: ['{{baseUrl}}'], path: path.replace(/^\//, '').split('?')[0].split('/'), ...(path.includes('?') && { query: [{ key: 'category_id', value: path.split('=')[1] }] }) },
    ...(body && { body: { mode: 'raw', raw: JSON.stringify(body, null, 2).replace(/"(\{\{\w+\}\})"/g, '$1') } })
  }
});
const future = '2030-12-31T20:00:00';
const folder = (name, item) => ({ name, item });

const collection = {
  info: { name: 'API Eventos - Corte 2', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000/api' }],
  item: [
    folder('Auth', [
      req('Login OK', 'POST', '/auth/login', { identifier: 'ana@correo.com', password: '1234' }, 200),
      req('Login ERROR credenciales', 'POST', '/auth/login', { identifier: 'ana@correo.com', password: 'mal' }, 401),
      req('Login ERROR campos faltantes', 'POST', '/auth/login', { identifier: 'ana@correo.com' }, 400)
    ]),
    folder('Users', [
      req('Crear usuario OK', 'POST', '/users', { email: 'ana@correo.com', username: 'ana', password: '1234', phone: '3001234567' }, 201, 'userId'),
      req('Crear usuario (segundo, para tickets)', 'POST', '/users', { email: 'luis@correo.com', username: 'luis', password: 'abcd', phone: '3010000000' }, 201, 'userId2'),
      req('Crear usuario ERROR email inválido', 'POST', '/users', { email: 'malo', username: 'x', password: '1', phone: 'abc' }, 400),
      req('Crear usuario ERROR duplicado', 'POST', '/users', { email: 'ana@correo.com', username: 'ana', password: '1234', phone: '3001234567' }, 409),
      req('Listar usuarios OK', 'GET', '/users', null, 200),
      req('Obtener usuario OK', 'GET', '/users/{{userId}}', null, 200),
      req('Obtener usuario ERROR 404', 'GET', '/users/99999', null, 404),
      req('Actualizar usuario OK', 'PUT', '/users/{{userId}}', { email: 'ana@correo.com', username: 'ana', phone: '3009998888' }, 200),
      req('Actualizar usuario ERROR 400', 'PUT', '/users/{{userId}}', { email: 'ana@correo.com' }, 400)
    ]),
    folder('Categories', [
      req('Crear categoría OK', 'POST', '/categories', { name: 'Festival' }, 201, 'categoryId'),
      req('Crear categoría ERROR nombre vacío', 'POST', '/categories', { name: '' }, 400),
      req('Crear categoría ERROR duplicada', 'POST', '/categories', { name: 'Festival' }, 409),
      req('Listar categorías OK', 'GET', '/categories', null, 200),
      req('Obtener categoría OK', 'GET', '/categories/{{categoryId}}', null, 200),
      req('Obtener categoría ERROR 404', 'GET', '/categories/99999', null, 404),
      req('Actualizar categoría OK', 'PUT', '/categories/{{categoryId}}', { name: 'Festival Música' }, 200),
      req('Actualizar categoría ERROR 404', 'PUT', '/categories/99999', { name: 'X' }, 404)
    ]),
    folder('4 Events', [
      req('Crear evento OK', 'POST', '/events', { title: 'Concierto Rock', description: 'Noche de rock', event_date: future, venue: 'Movistar Arena', address: 'Cra 1 # 2-3', creator_id: '{{userId}}', category_id: '{{categoryId}}' }, 201, 'eventId'),
      req('Crear evento ERROR fecha pasada', 'POST', '/events', { title: 'Viejo', description: 'x', event_date: '2020-01-01T10:00:00', venue: 'v', address: 'a', creator_id: 1, category_id: 1 }, 400),
      req('Listar eventos OK', 'GET', '/events', null, 200),
      req('Filtrar eventos por categoría OK', 'GET', '/events?category_id=1', null, 200),
      req('Filtrar eventos ERROR category_id inválido', 'GET', '/events?category_id=abc', null, 400),
      req('Obtener evento OK', 'GET', '/events/{{eventId}}', null, 200),
      req('Obtener evento ERROR 404', 'GET', '/events/99999', null, 404),
      req('Actualizar evento OK', 'PUT', '/events/{{eventId}}', { title: 'Concierto Rock II', description: 'Nueva fecha', event_date: '2031-01-15T20:00:00', venue: 'Movistar Arena', address: 'Cra 1 # 2-3', category_id: '{{categoryId}}' }, 200),
      req('Actualizar evento ERROR 404', 'PUT', '/events/99999', { title: 'x', description: 'x', event_date: future, venue: 'v', address: 'a', category_id: 1 }, 404)
    ]),
    folder('5 Participants', [
      req('Agregar participante OK', 'POST', '/events/{{eventId}}/participants', { name: 'Los Rockeros', role: 'Artista principal' }, 201, 'participantId'),
      req('Agregar participante ERROR datos incompletos', 'POST', '/events/{{eventId}}/participants', { name: 'Solo nombre' }, 400),
      req('Agregar participante ERROR evento 404', 'POST', '/events/99999/participants', { name: 'X', role: 'Y' }, 404),
      req('Listar participantes OK', 'GET', '/events/{{eventId}}/participants', null, 200),
      req('Obtener participante OK', 'GET', '/events/{{eventId}}/participants/{{participantId}}', null, 200),
      req('Obtener participante ERROR 404', 'GET', '/events/{{eventId}}/participants/99999', null, 404),
      req('Actualizar participante OK', 'PUT', '/events/{{eventId}}/participants/{{participantId}}', { name: 'Los Rockeros', role: 'Invitado' }, 200),
      req('Actualizar participante ERROR 400', 'PUT', '/events/{{eventId}}/participants/{{participantId}}', { name: '' }, 400)
    ]),
    folder('6 Tickets', [
      req('Comprar ticket OK', 'POST', '/tickets', { user_id: '{{userId}}', event_id: '{{eventId}}' }, 201, 'ticketId'),
      req('Comprar ticket ERROR duplicado', 'POST', '/tickets', { user_id: '{{userId}}', event_id: '{{eventId}}' }, 409),
      req('Comprar ticket ERROR datos incompletos', 'POST', '/tickets', { user_id: 1 }, 400),
      req('Comprar ticket ERROR evento 404', 'POST', '/tickets', { user_id: '{{userId}}', event_id: 99999 }, 404),
      req('Listar tickets OK', 'GET', '/tickets', null, 200),
      req('Obtener ticket OK', 'GET', '/tickets/{{ticketId}}', null, 200),
      req('Obtener ticket ERROR 404', 'GET', '/tickets/99999', null, 404),
      req('Tickets de un usuario OK', 'GET', '/users/{{userId}}/tickets', null, 200),
      req('Tickets de un evento OK', 'GET', '/events/{{eventId}}/tickets', null, 200)
    ]),
    folder('7 Eliminaciones (al final)', [
      req('Eliminar evento ERROR con tickets', 'DELETE', '/events/{{eventId}}', null, 409),
      req('Eliminar ticket OK', 'DELETE', '/tickets/{{ticketId}}', null, 204),
      req('Eliminar ticket ERROR 404', 'DELETE', '/tickets/{{ticketId}}', null, 404),
      req('Eliminar participante OK', 'DELETE', '/events/{{eventId}}/participants/{{participantId}}', null, 204),
      req('Eliminar participante ERROR 404', 'DELETE', '/events/{{eventId}}/participants/{{participantId}}', null, 404),
      req('Eliminar categoría ERROR con eventos', 'DELETE', '/categories/{{categoryId}}', null, 409),
      req('Eliminar evento OK', 'DELETE', '/events/{{eventId}}', null, 204),
      req('Eliminar evento ERROR 404', 'DELETE', '/events/{{eventId}}', null, 404),
      req('Eliminar categoría OK', 'DELETE', '/categories/{{categoryId}}', null, 204),
      req('Eliminar usuario 2 OK', 'DELETE', '/users/{{userId2}}', null, 204),
      req('Eliminar usuario OK', 'DELETE', '/users/{{userId}}', null, 204),
      req('Eliminar usuario ERROR 404', 'DELETE', '/users/{{userId}}', null, 404)
    ])
  ]
};
collection.item.splice(1, 0, collection.item.shift()); // Users primero, luego Auth
fs.writeFileSync(__dirname + '/api-eventos.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Colección generada');
