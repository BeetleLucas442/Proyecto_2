/* ==========================================================
   api.js — capa de acceso a la API REST de Nyxa (corte 2).
   Sin datos simulados: todo se consume de los endpoints reales.
   app.js no cambia: este archivo traduce entre lo que espera la
   interfaz y lo que devuelve la API.

   Endpoints usados:
     POST /auth/login            GET  /users/:id          PUT /users/:id
     POST /users                 GET  /users/:id/tickets
     GET  /categories            GET  /events[?category_id=]   GET /events/:id
     POST /events                DELETE /events/:id
     GET  /events/:id/participants   POST /events/:id/participants
     POST /tickets

   Lo que la API del corte 2 NO tiene (ver informe, sección de limitaciones):
   nombre completo, ciudad, foto de perfil, roles, solicitud de administrador,
   imagen y marcador del evento, reseñas.
   ========================================================== */
const API_BASE_URL = 'http://localhost:3000/api';

// La tabla `user` no tiene columna de rol: todo usuario autenticado puede crear
// eventos y eliminar los que creó. Si se agrega la columna `role`, cambiar aquí.
const DEFAULT_USER_TYPE = 'organizer';

const Session = {
  _mem: null,
  get() { try { return JSON.parse(localStorage.getItem('nyxa_session_v3') || 'null'); } catch (e) { return this._mem; } },
  set(user) { this._mem = user; try { localStorage.setItem('nyxa_session_v3', JSON.stringify(user)); } catch (e) {} },
  clear() { this._mem = null; try { localStorage.removeItem('nyxa_session_v3'); } catch (e) {} }
};

/* ---------- HTTP ---------- */
async function request(path, method = 'GET', body) {
  let res;
  try {
    res = await fetch(API_BASE_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    // Estado de error: servidor apagado, CORS o sin red
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data.details) && data.details[0] ? ': ' + data.details[0].message : '';
    throw new Error((data.error || data.message || 'Error ' + res.status) + detail);
  }
  return data;
}

/* ---------- Helpers de traducción API -> interfaz ---------- */
const today = () => new Date().toLocaleDateString('en-CA');
const dayOf = s => String(s || '').slice(0, 10);          // '2026-12-31 20:00:00' -> '2026-12-31'
const keyOf = name => String(name || '').toLowerCase();    // 'Concert' -> 'concert'
const meId = () => Session.get()?.id;
const needSession = () => { if (!meId()) throw new Error('Sesión no válida'); return meId(); };

const toUser = u => ({
  fullName: '', city: '', photo: null, status: 'active', adminRequest: null,
  attendedEvents: 0, createdEvents: 0,
  ...u, type: DEFAULT_USER_TYPE
});

const toEvent = (e, ticketIds = new Set(), participants = []) => ({
  id: e.id, title: e.title, category: keyOf(e.category_name), description: e.description,
  date: dayOf(e.event_date), venue: e.venue, address: e.address,
  image: null, score: null, participants,
  creatorId: e.creator_id,
  purchased: ticketIds.has(e.id),
  isMine: e.creator_id === meId()
});

let categoriesCache = null;
const categories = async () => categoriesCache || (categoriesCache = await request('/categories'));
const categoryId = async key => (await categories()).find(c => keyOf(c.name) === key)?.id;

const myTickets = () => request('/users/' + needSession() + '/tickets');
const myTicketIds = async () => new Set((await myTickets()).map(t => t.event_id));
const byDate = (a, b) => a.date.localeCompare(b.date);
const isUpcoming = e => e.date >= today();

/* ---------- API que usa app.js ---------- */
const API = {
  login: async (identifier, password) => {
    const r = await request('/auth/login', 'POST', { identifier, password });
    return toUser(r.user);
  },

  register: async d => toUser(await request('/users', 'POST', {
    email: d.email, username: String(d.username).trim(), password: d.password, phone: d.phone
  })),

  getProfile: async () => {
    const id = needSession();
    const [u, tickets, events] = await Promise.all([request('/users/' + id), myTickets(), request('/events')]);
    return toUser({
      ...u,
      attendedEvents: tickets.filter(t => dayOf(t.event_date) < today()).length,
      createdEvents: events.filter(e => e.creator_id === id).length
    });
  },

  // Solo se guardan los campos que existen en la tabla `user`
  updateProfile: async d => {
    const id = needSession(), current = await request('/users/' + id);
    const saved = await request('/users/' + id, 'PUT', {
      email: current.email,
      username: d.username != null ? String(d.username).trim() : current.username,
      phone: d.phone != null ? d.phone : current.phone
    });
    return toUser(saved);
  },

  getEvents: async category => {
    const catId = category ? await categoryId(category) : null;
    if (category && !catId) return [];
    const [events, tickets] = await Promise.all([
      request('/events' + (catId ? '?category_id=' + catId : '')), myTicketIds()
    ]);
    return events.map(e => toEvent(e, tickets)).filter(isUpcoming).sort(byDate);
  },

  getEvent: async id => {
    const [e, participants, tickets] = await Promise.all([
      request('/events/' + id), request('/events/' + id + '/participants'), myTicketIds()
    ]);
    return toEvent(e, tickets, participants.map(p => ({ name: p.name, role: p.role })));
  },

  // Organizador: fecha sin hora en el formulario -> se publica a las 20:00
  createEvent: async d => {
    const catId = await categoryId(d.category);
    if (!catId) throw new Error('Categoría no válida');
    const ev = await request('/events', 'POST', {
      title: d.title, description: d.description, event_date: d.date + 'T20:00:00',
      venue: d.venue, address: d.address, creator_id: needSession(), category_id: catId
    });
    for (const p of d.participants || []) {
      if (p.name) await request('/events/' + ev.id + '/participants', 'POST', { name: p.name, role: p.role || 'Participante' });
    }
    return toEvent(ev);
  },

  deleteEvent: id => request('/events/' + id, 'DELETE'),

  buyTicket: id => request('/tickets', 'POST', { user_id: needSession(), event_id: +id }),

  getMyEvents: async () => {
    const [events, tickets] = await Promise.all([request('/events'), myTicketIds()]);
    return events.map(e => toEvent(e, tickets))
      .filter(e => isUpcoming(e) && (e.isMine || e.purchased)).sort(byDate);
  },

  getAttended: async () => {
    const [events, tickets] = await Promise.all([request('/events'), myTicketIds()]);
    return events.map(e => toEvent(e, tickets))
      .filter(e => e.purchased && e.date < today()).sort(byDate).map(e => ({ ...e, reviews: [] }));
  },

  // La API del corte 2 no tiene reseñas
  addReview: async () => { throw new Error('Las reseñas aún no están disponibles.'); }
};