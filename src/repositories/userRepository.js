const db = require('../config/db');
const COLS = 'id, email, username, phone'; // nunca se lista la contraseña

exports.findAll = async () => (await db.query(`SELECT ${COLS} FROM user ORDER BY id`))[0];
exports.findById = async (id) => (await db.query(`SELECT ${COLS} FROM user WHERE id = ?`, [id]))[0][0];
exports.findByEmailOrUsername = async (identifier) =>
  (await db.query('SELECT * FROM user WHERE email = ? OR username = ? LIMIT 1', [identifier, identifier]))[0][0];
exports.create = async ({ email, username, password, phone }) =>
  (await db.query('INSERT INTO user (email, username, password, phone) VALUES (?,?,?,?)', [email, username, password, phone]))[0].insertId;
exports.update = async (id, { email, username, password, phone }) =>
  (await db.query('UPDATE user SET email=?, username=?, password=?, phone=? WHERE id=?', [email, username, password, phone, id]))[0].affectedRows;
exports.remove = async (id) => (await db.query('DELETE FROM user WHERE id = ?', [id]))[0].affectedRows;
exports.getPassword = async (id) => (await db.query('SELECT password FROM user WHERE id = ?', [id]))[0][0]?.password;
