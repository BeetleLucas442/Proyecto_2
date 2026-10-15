require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nyxa',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // devuelve DATETIME como texto 'YYYY-MM-DD HH:mm:ss'
});

module.exports = pool;
