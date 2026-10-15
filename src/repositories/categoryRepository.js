const db = require('../config/db');

exports.findAll = async () => (await db.query('SELECT id, name FROM category ORDER BY id'))[0];
exports.findById = async (id) => (await db.query('SELECT id, name FROM category WHERE id = ?', [id]))[0][0];
exports.create = async ({ name }) => (await db.query('INSERT INTO category (name) VALUES (?)', [name]))[0].insertId;
exports.update = async (id, { name }) => (await db.query('UPDATE category SET name=? WHERE id=?', [name, id]))[0].affectedRows;
exports.remove = async (id) => (await db.query('DELETE FROM category WHERE id = ?', [id]))[0].affectedRows;
