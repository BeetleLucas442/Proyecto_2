const AppError = require('../utils/AppError');
const users = require('../repositories/userRepository');

// Contraseña en texto plano en este corte (según el enunciado).
exports.login = async ({ identifier, password }) => {
  const user = await users.findByEmailOrUsername(identifier);
  if (!user || user.password !== password) throw new AppError(401, 'Credenciales inválidas');
  const { password: _omit, ...safe } = user;
  return { message: 'Inicio de sesión exitoso', user: safe };
};
