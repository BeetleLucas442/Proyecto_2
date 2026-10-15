const AppError = require('../utils/AppError');
const repo = require('../repositories/ticketRepository');
const users = require('../repositories/userRepository');
const events = require('../repositories/eventRepository');

exports.list = () => repo.findAll();
exports.get = async (id) => {
  const t = await repo.findById(id);
  if (!t) throw new AppError(404, 'Ticket no encontrado');
  return t;
};
// Reglas de negocio: el evento no debe haber pasado y un usuario compra un solo ticket por evento.
exports.create = async ({ user_id, event_id }) => {
  if (!(await users.findById(user_id))) throw new AppError(404, 'El usuario no existe');
  const event = await events.findById(event_id);
  if (!event) throw new AppError(404, 'El evento no existe');
  if (new Date(event.event_date.replace(' ', 'T')).getTime() <= Date.now())
    throw new AppError(409, 'No se pueden comprar tickets de un evento que ya ocurrió');
  if (await repo.findByUserAndEvent(user_id, event_id))
    throw new AppError(409, 'El usuario ya tiene un ticket para este evento');
  return repo.findById(await repo.create({ user_id, event_id }));
};
exports.remove = async (id) => { await exports.get(id); await repo.remove(id); };
