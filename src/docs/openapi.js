// Especificación OpenAPI 3.0 de la API (se muestra en /api-docs con Swagger UI)
const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema, example) => ({ 'application/json': { schema, ...(example && { example }) } });
const err = (description, message, details) => ({
  description,
  content: json(ref('Error'), { error: message, ...(details && { details }) })
});
const R400 = err('Datos de entrada inválidos', 'Datos de entrada inválidos', [{ field: 'email', message: 'email no es un correo válido' }]);
const R400id = err('Parámetro de ruta inválido', 'El parámetro id debe ser un entero positivo');
const R404 = (what) => err(`${what} no encontrado`, `${what} no encontrado`);
const R409 = (msg) => err('Conflicto con reglas de negocio', msg);
const body = (schema, example) => ({ required: true, content: json(schema, example) });
const idParam = (name = 'id') => ({ name, in: 'path', required: true, schema: { type: 'integer', minimum: 1 }, example: 1 });
const ok = (description, schema, example) => ({ description, content: json(schema, example) });
const arr = (n) => ({ type: 'array', items: ref(n) });

const userEx = { id: 1, email: 'ana@correo.com', username: 'ana', phone: '3001234567' };
const eventEx = { id: 1, title: 'Concierto Rock', description: 'Noche de rock', event_date: '2026-12-31 20:00:00', venue: 'Movistar Arena', address: 'Cra 1 # 2-3', creator_id: 1, creator_username: 'ana', category_id: 1, category_name: 'Concert' };
const ticketEx = { id: 1, purchased_at: '2026-10-14 10:00:00', user_id: 1, username: 'ana', event_id: 1, event_title: 'Concierto Rock', event_date: '2026-12-31 20:00:00' };

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API de Eventos',
    version: '1.0.0',
    description: 'API REST para gestionar usuarios, categorías, eventos, participantes y tickets. Corte 2. La contraseña se guarda en texto plano en este corte.'
  },
  servers: [{ url: 'http://localhost:3000/api' }],
  tags: ['Auth', 'Users', 'Categories', 'Events', 'Participants', 'Tickets'].map((name) => ({ name })),
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Iniciar sesión',
        description: 'Verifica las credenciales contra la base de datos. `identifier` puede ser el email o el username.',
        requestBody: body(ref('LoginInput'), { identifier: 'ana@correo.com', password: '1234' }),
        responses: {
          200: ok('Inicio de sesión exitoso', ref('LoginResponse'), { message: 'Inicio de sesión exitoso', user: userEx }),
          400: R400, 401: err('Credenciales inválidas', 'Credenciales inválidas')
        }
      }
    },
    '/users': {
      get: { tags: ['Users'], summary: 'Listar usuarios', responses: { 200: ok('Lista de usuarios (sin contraseña)', arr('User'), [userEx]) } },
      post: {
        tags: ['Users'], summary: 'Crear usuario',
        requestBody: body(ref('UserInput'), { email: 'ana@correo.com', username: 'ana', password: '1234', phone: '3001234567' }),
        responses: { 201: ok('Usuario creado', ref('User'), userEx), 400: R400, 409: R409('Registro duplicado (valor único ya existe)') }
      }
    },
    '/users/{id}': {
      parameters: [idParam()],
      get: { tags: ['Users'], summary: 'Obtener usuario', responses: { 200: ok('Usuario', ref('User'), userEx), 400: R400id, 404: R404('Usuario') } },
      put: {
        tags: ['Users'], summary: 'Actualizar usuario', description: 'Si no se envía `password` se conserva la actual.',
        requestBody: body(ref('UserUpdateInput'), { email: 'ana@correo.com', username: 'ana', phone: '3009998888' }),
        responses: { 200: ok('Usuario actualizado', ref('User'), userEx), 400: R400, 404: R404('Usuario'), 409: R409('Registro duplicado (valor único ya existe)') }
      },
      delete: {
        tags: ['Users'], summary: 'Eliminar usuario',
        responses: { 204: { description: 'Eliminado' }, 400: R400id, 404: R404('Usuario'), 409: R409('No se puede eliminar: el usuario es creador de eventos') }
      }
    },
    '/users/{id}/tickets': {
      parameters: [idParam()],
      get: { tags: ['Users', 'Tickets'], summary: 'Tickets de un usuario', responses: { 200: ok('Tickets del usuario', arr('Ticket'), [ticketEx]), 400: R400id, 404: R404('Usuario') } }
    },
    '/categories': {
      get: { tags: ['Categories'], summary: 'Listar categorías', responses: { 200: ok('Lista', arr('Category'), [{ id: 1, name: 'Concert' }]) } },
      post: {
        tags: ['Categories'], summary: 'Crear categoría', requestBody: body(ref('CategoryInput'), { name: 'Festival' }),
        responses: { 201: ok('Creada', ref('Category'), { id: 4, name: 'Festival' }), 400: R400, 409: R409('Registro duplicado (valor único ya existe)') }
      }
    },
    '/categories/{id}': {
      parameters: [idParam()],
      get: { tags: ['Categories'], summary: 'Obtener categoría', responses: { 200: ok('Categoría', ref('Category'), { id: 1, name: 'Concert' }), 400: R400id, 404: R404('Categoría') } },
      put: {
        tags: ['Categories'], summary: 'Actualizar categoría', requestBody: body(ref('CategoryInput'), { name: 'Música' }),
        responses: { 200: ok('Actualizada', ref('Category'), { id: 1, name: 'Música' }), 400: R400, 404: R404('Categoría'), 409: R409('Registro duplicado (valor único ya existe)') }
      },
      delete: {
        tags: ['Categories'], summary: 'Eliminar categoría',
        responses: { 204: { description: 'Eliminada' }, 400: R400id, 404: R404('Categoría'), 409: R409('No se puede eliminar: hay eventos en esta categoría') }
      }
    },
    '/events': {
      get: {
        tags: ['Events'], summary: 'Listar eventos', parameters: [{ name: 'category_id', in: 'query', required: false, schema: { type: 'integer' }, description: 'Filtra por categoría' }],
        responses: { 200: ok('Lista de eventos', arr('Event'), [eventEx]), 400: err('category_id inválido', 'category_id debe ser un entero positivo') }
      },
      post: {
        tags: ['Events'], summary: 'Crear evento', description: 'La fecha debe ser futura. `creator_id` y `category_id` deben existir.',
        requestBody: body(ref('EventInput'), { id: 1, title: 'Concierto Rock', description: 'Noche de rock', event_date: '2026-12-31T20:00:00', venue: 'Movistar Arena', address: 'Cra 1 # 2-3', creator_id: 1, category_id: 1 }),
        responses: { 201: ok('Evento creado', ref('Event'), eventEx), 400: R400, 404: err('Creador o categoría inexistente', 'La categoría no existe') }
      }
    },
    '/events/{id}': {
      parameters: [idParam()],
      get: { tags: ['Events'], summary: 'Obtener evento', responses: { 200: ok('Evento', ref('Event'), eventEx), 400: R400id, 404: R404('Evento') } },
      put: {
        tags: ['Events'], summary: 'Actualizar evento', description: 'No se puede cambiar el creador.',
        requestBody: body(ref('EventUpdateInput'), { title: 'Concierto Rock II', description: 'Nueva fecha', event_date: '2027-01-15T20:00:00', venue: 'Movistar Arena', address: 'Cra 1 # 2-3', category_id: 1 }),
        responses: { 200: ok('Actualizado', ref('Event'), eventEx), 400: R400, 404: R404('Evento') }
      },
      delete: {
        tags: ['Events'], summary: 'Eliminar evento', description: 'Elimina también sus participantes. Falla si ya hay tickets vendidos.',
        responses: { 204: { description: 'Eliminado' }, 400: R400id, 404: R404('Evento'), 409: R409('No se puede eliminar: el evento ya tiene tickets vendidos') }
      }
    },
    '/events/{id}/tickets': {
      parameters: [idParam()],
      get: { tags: ['Events', 'Tickets'], summary: 'Tickets de un evento', responses: { 200: ok('Tickets del evento', arr('Ticket'), [ticketEx]), 400: R400id, 404: R404('Evento') } }
    },
    '/events/{eventId}/participants': {
      parameters: [idParam('eventId')],
      get: { tags: ['Participants'], summary: 'Listar participantes de un evento', responses: { 200: ok('Lista', arr('Participant'), [{ id: 1, name: 'Los Rockeros', role: 'Artista principal', event_id: 1 }]), 400: R400id, 404: R404('Evento') } },
      post: {
        tags: ['Participants'], summary: 'Agregar participante', requestBody: body(ref('ParticipantInput'), { name: 'Los Rockeros', role: 'Artista principal' }),
        responses: { 201: ok('Creado', ref('Participant'), { id: 1, name: 'Los Rockeros', role: 'Artista principal', event_id: 1 }), 400: R400, 404: R404('Evento') }
      }
    },
    '/events/{eventId}/participants/{id}': {
      parameters: [idParam('eventId'), idParam()],
      get: { tags: ['Participants'], summary: 'Obtener participante', responses: { 200: ok('Participante', ref('Participant')), 400: R400id, 404: R404('Participante') } },
      put: {
        tags: ['Participants'], summary: 'Actualizar participante', requestBody: body(ref('ParticipantInput'), { name: 'Los Rockeros', role: 'Invitado' }),
        responses: { 200: ok('Actualizado', ref('Participant')), 400: R400, 404: R404('Participante') }
      },
      delete: { tags: ['Participants'], summary: 'Eliminar participante', responses: { 204: { description: 'Eliminado' }, 400: R400id, 404: R404('Participante') } }
    },
    '/tickets': {
      get: { tags: ['Tickets'], summary: 'Listar tickets', responses: { 200: ok('Lista', arr('Ticket'), [ticketEx]) } },
      post: {
        tags: ['Tickets'], summary: 'Comprar ticket',
        description: 'Reglas: el evento no debe haber ocurrido y un usuario solo puede tener un ticket por evento.',
        requestBody: body(ref('TicketInput'), { user_id: 1, event_id: 1 }),
        responses: { 201: ok('Ticket creado', ref('Ticket'), ticketEx), 400: R400, 404: err('Usuario o evento inexistente', 'El evento no existe'), 409: R409('El usuario ya tiene un ticket para este evento') }
      }
    },
    '/tickets/{id}': {
      parameters: [idParam()],
      get: { tags: ['Tickets'], summary: 'Obtener ticket', responses: { 200: ok('Ticket', ref('Ticket'), ticketEx), 400: R400id, 404: R404('Ticket') } },
      delete: { tags: ['Tickets'], summary: 'Cancelar (eliminar) ticket', responses: { 204: { description: 'Eliminado' }, 400: R400id, 404: R404('Ticket') } }
    }
  },
  components: {
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' }, details: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } } } },
      LoginInput: { type: 'object', required: ['identifier', 'password'], properties: { identifier: { type: 'string', description: 'email o username' }, password: { type: 'string' } } },
      LoginResponse: { type: 'object', properties: { message: { type: 'string' }, user: ref('User') } },
      User: { type: 'object', properties: { id: { type: 'integer' }, email: { type: 'string' }, username: { type: 'string' }, phone: { type: 'string' } } },
      UserInput: { type: 'object', required: ['email', 'username', 'password', 'phone'], properties: { email: { type: 'string', format: 'email', maxLength: 255 }, username: { type: 'string', minLength: 3, maxLength: 50 }, password: { type: 'string', minLength: 4, maxLength: 255 }, phone: { type: 'string', maxLength: 20 } } },
      UserUpdateInput: { type: 'object', required: ['email', 'username', 'phone'], properties: { email: { type: 'string', format: 'email' }, username: { type: 'string' }, password: { type: 'string', description: 'opcional' }, phone: { type: 'string' } } },
      Category: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
      CategoryInput: { type: 'object', required: ['name'], properties: { name: { type: 'string', maxLength: 50 } } },
      Event: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, description: { type: 'string' }, event_date: { type: 'string' }, venue: { type: 'string' }, address: { type: 'string' }, creator_id: { type: 'integer' }, creator_username: { type: 'string' }, category_id: { type: 'integer' }, category_name: { type: 'string' } } },
      EventInput: { type: 'object', required: ['title', 'description', 'event_date', 'venue', 'address', 'creator_id', 'category_id'], properties: { title: { type: 'string', maxLength: 150 }, description: { type: 'string' }, event_date: { type: 'string', format: 'date-time' }, venue: { type: 'string', maxLength: 150 }, address: { type: 'string', maxLength: 255 }, creator_id: { type: 'integer' }, category_id: { type: 'integer' } } },
      EventUpdateInput: { type: 'object', required: ['title', 'description', 'event_date', 'venue', 'address', 'category_id'], properties: { title: { type: 'string' }, description: { type: 'string' }, event_date: { type: 'string', format: 'date-time' }, venue: { type: 'string' }, address: { type: 'string' }, category_id: { type: 'integer' } } },
      Participant: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, role: { type: 'string' }, event_id: { type: 'integer' } } },
      ParticipantInput: { type: 'object', required: ['name', 'role'], properties: { name: { type: 'string', maxLength: 150 }, role: { type: 'string', maxLength: 80 } } },
      Ticket: { type: 'object', properties: { id: { type: 'integer' }, purchased_at: { type: 'string' }, user_id: { type: 'integer' }, username: { type: 'string' }, event_id: { type: 'integer' }, event_title: { type: 'string' }, event_date: { type: 'string' } } },
      TicketInput: { type: 'object', required: ['user_id', 'event_id'], properties: { user_id: { type: 'integer' }, event_id: { type: 'integer' } } }
    }
  }
};
