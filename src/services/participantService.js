const AppError = require('../utils/AppError');
const repo = require('../repositories/participantRepository');
const events = require('../repositories/eventRepository');

const ensureEvent = async (eventId) => {
  if (!(await events.findById(eventId))) throw new AppError(404, 'Evento no encontrado');
};
exports.list = async (eventId) => { await ensureEvent(eventId); return repo.findByEvent(eventId); };
exports.get = async (eventId, id) => {
  await ensureEvent(eventId);
  const p = await repo.findById(eventId, id);
  if (!p) throw new AppError(404, 'Participante no encontrado en este evento');
  return p;
};
exports.create = async (eventId, data) => {
  await ensureEvent(eventId);
  return repo.findById(eventId, await repo.create(eventId, data));
};
exports.update = async (eventId, id, data) => { await exports.get(eventId, id); await repo.update(eventId, id, data); return repo.findById(eventId, id); };
exports.remove = async (eventId, id) => { await exports.get(eventId, id); await repo.remove(eventId, id); };
