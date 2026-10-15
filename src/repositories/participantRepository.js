const db = require('../config/db');

exports.findByEvent = async (eventId) =>
  (await db.query('SELECT id, name, role, event_id FROM participant WHERE event_id = ? ORDER BY id', [eventId]))[0];
exports.findById = async (eventId, id) =>
  (await db.query('SELECT id, name, role, event_id FROM participant WHERE id = ? AND event_id = ?', [id, eventId]))[0][0];
exports.create = async (eventId, { name, role }) =>
  (await db.query('INSERT INTO participant (name, role, event_id) VALUES (?,?,?)', [name, role, eventId]))[0].insertId;
exports.update = async (eventId, id, { name, role }) =>
  (await db.query('UPDATE participant SET name=?, role=? WHERE id=? AND event_id=?', [name, role, id, eventId]))[0].affectedRows;
exports.remove = async (eventId, id) =>
  (await db.query('DELETE FROM participant WHERE id=? AND event_id=?', [id, eventId]))[0].affectedRows;
