const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const repo = require('../repositories/userRepository');
const tickets = require('../repositories/ticketRepository');
const db = require('../config/db');

const SALT_ROUNDS = 10;

exports.list = () => repo.findAll();
exports.get = async (id) => {
  const u = await repo.findById(id);
  if (!u) throw new AppError(404, 'Usuario no encontrado');
  return u;
};

// La contraseña se hashea (bcrypt + salt) antes de persistirla
exports.create = async (data) => {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const id = await repo.create({ ...data, password: passwordHash });
  return repo.findById(id);
};

exports.update = async (id, data) => {
  await exports.get(id);
  // Si se envía password nueva se hashea; si no, se conserva el hash actual
  const password = data.password
    ? await bcrypt.hash(data.password, SALT_ROUNDS)
    : await repo.getPassword(id);
  await repo.update(id, { ...data, password });
  return repo.findById(id);
};

exports.remove = async (id) => {
  await exports.get(id);
  const [[{ n: created }]] = await db.query('SELECT COUNT(*) AS n FROM event WHERE creator_id=?', [id]);
  if (created > 0) throw new AppError(409, 'No se puede eliminar: el usuario es creador de eventos');
  if ((await tickets.countByUser(id)) > 0) throw new AppError(409, 'No se puede eliminar: el usuario tiene tickets comprados');
  await repo.remove(id);
};
exports.listTickets = async (id) => { await exports.get(id); return tickets.findByUser(id); };