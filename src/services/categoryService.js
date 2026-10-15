const AppError = require('../utils/AppError');
const repo = require('../repositories/categoryRepository');
const db = require('../config/db');

exports.list = () => repo.findAll();
exports.get = async (id) => {
  const c = await repo.findById(id);
  if (!c) throw new AppError(404, 'Categoría no encontrada');
  return c;
};
exports.create = async (data) => repo.findById(await repo.create(data));
exports.update = async (id, data) => { await exports.get(id); await repo.update(id, data); return repo.findById(id); };
exports.remove = async (id) => {
  await exports.get(id);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM event WHERE category_id=?', [id]);
  if (n > 0) throw new AppError(409, 'No se puede eliminar: hay eventos en esta categoría');
  await repo.remove(id);
};
