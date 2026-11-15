require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

const SALT_ROUNDS = 10;

async function migrar() {
  const [usuarios] = await db.query('SELECT id, password FROM user');
  let migrados = 0;

  for (const u of usuarios) {
    // Si ya es un hash bcrypt, se omite (evita hashear dos veces)
    if (u.password.startsWith('$2')) continue;

    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await db.query('UPDATE user SET password = ? WHERE id = ?', [hash, u.id]);
    migrados++;
  }

  console.log(`Usuarios migrados: ${migrados} de ${usuarios.length}`);
  await db.end();
}

migrar().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});