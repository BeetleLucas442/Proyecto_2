const db = require('../config/db');

const SELECT = `SELECT t.id, t.purchased_at, t.user_id, u.username, t.event_id, e.title AS event_title, e.event_date
  FROM ticket t JOIN user u ON u.id = t.user_id JOIN event e ON e.id = t.event_id`;

exports.findAll = async () => (await db.query(`${SELECT} ORDER BY t.id`))[0];
exports.findById = async (id) => (await db.query(`${SELECT} WHERE t.id = ?`, [id]))[0][0];
exports.findByUser = async (userId) => (await db.query(`${SELECT} WHERE t.user_id = ? ORDER BY t.id`, [userId]))[0];
exports.findByEvent = async (eventId) => (await db.query(`${SELECT} WHERE t.event_id = ? ORDER BY t.id`, [eventId]))[0];
exports.findByUserAndEvent = async (userId, eventId) =>
  (await db.query('SELECT id FROM ticket WHERE user_id=? AND event_id=? LIMIT 1', [userId, eventId]))[0][0];
exports.countByEvent = async (eventId) =>
  (await db.query('SELECT COUNT(*) AS n FROM ticket WHERE event_id=?', [eventId]))[0][0].n;
exports.countByUser = async (userId) =>
  (await db.query('SELECT COUNT(*) AS n FROM ticket WHERE user_id=?', [userId]))[0][0].n;
exports.create = async ({ user_id, event_id }) =>
  (await db.query('INSERT INTO ticket (user_id, event_id) VALUES (?,?)', [user_id, event_id]))[0].insertId;
exports.remove = async (id) => (await db.query('DELETE FROM ticket WHERE id=?', [id]))[0].affectedRows;
