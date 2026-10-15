const db = require('../config/db');

const SELECT = `SELECT e.id, e.title, e.description, e.event_date, e.venue, e.address,
  e.creator_id, u.username AS creator_username, e.category_id, c.name AS category_name
  FROM event e JOIN user u ON u.id = e.creator_id JOIN category c ON c.id = e.category_id`;

exports.findAll = async ({ categoryId } = {}) => {
  if (categoryId) return (await db.query(`${SELECT} WHERE e.category_id = ? ORDER BY e.event_date`, [categoryId]))[0];
  return (await db.query(`${SELECT} ORDER BY e.event_date`))[0];
};
exports.findById = async (id) => (await db.query(`${SELECT} WHERE e.id = ?`, [id]))[0][0];
exports.create = async (e) =>
  (await db.query(
    'INSERT INTO event (title, description, event_date, venue, address, creator_id, category_id) VALUES (?,?,?,?,?,?,?)',
    [e.title, e.description, new Date(e.event_date), e.venue, e.address, e.creator_id, e.category_id]
  ))[0].insertId;
exports.update = async (id, e) =>
  (await db.query(
    'UPDATE event SET title=?, description=?, event_date=?, venue=?, address=?, category_id=? WHERE id=?',
    [e.title, e.description, new Date(e.event_date), e.venue, e.address, e.category_id, id]
  ))[0].affectedRows;
exports.remove = async (id) => (await db.query('DELETE FROM event WHERE id = ?', [id]))[0].affectedRows;
