require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3000;
db.query('SELECT 1')
  .then(() => app.listen(PORT, () => console.log(`API en http://localhost:${PORT}/api/users  |  Swagger: http://localhost:${PORT}/api-docs`)))
  .catch((err) => { console.error('No se pudo conectar a MySQL:', err.message); process.exit(1); });
