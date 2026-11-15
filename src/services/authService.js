const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const users = require('../repositories/userRepository');

// Las contraseñas se almacenan como hash bcrypt (con salt incluido).
// El hash se compara del lado del servidor; nunca se compara texto plano.
exports.login = async ({ identifier, password }) => {
  const user = await users.findByEmailOrUsername(identifier);

  // Mismo mensaje para "usuario no existe" y "contraseña incorrecta"
  if (!user) throw new AppError(401, 'Credenciales inválidas');

  const coincide = await bcrypt.compare(password, user.password);
  if (!coincide) throw new AppError(401, 'Credenciales inválidas');

  const { password: _omit, ...safe } = user;
  return { message: 'Inicio de sesión exitoso', user: safe };
};