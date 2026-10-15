const AppError = require('../utils/AppError');
const repo = require('../repositories/eventRepository');
const users = require('../repositories/userRepository');
const categories = require('../repositories/categoryRepository');
const tickets = require('../repositories/ticketRepository');

exports.list = (filters) => repo.findAll(filters);
exports.get = async (id) => {
  const e = await repo.findById(id);
  if (!e) throw new AppError(404, 'Evento no encontrado');
  return e;
};
exports.create = async (data) => {
  if (!(await users.findById(data.creator_id))) throw new AppError(404, 'El usuario creador no existe');
  if (!(await categories.findById(data.category_id))) throw new AppError(404, 'La categoría no existe');
  return repo.findById(await repo.create(data));
};
exports.update = async (id, data) => {
  await exports.get(id);
  if (!(await categories.findById(data.category_id))) throw new AppError(404, 'La categoría no existe');
  await repo.update(id, data);
  return repo.findById(id);
};
exports.remove = async (id) => {
  await exports.get(id);
  if ((await tickets.countByEvent(id)) > 0) throw new AppError(409, 'No se puede eliminar: el evento ya tiene tickets vendidos');
  await repo.remove(id); // los participantes se eliminan en cascada
};
exports.listTickets = async (id) => { await exports.get(id); return tickets.findByEvent(id); };
