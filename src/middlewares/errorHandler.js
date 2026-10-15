const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'JSON mal formado en el cuerpo de la solicitud' });
  if (err instanceof AppError)
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  // Errores de MySQL traducidos
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Registro duplicado (valor único ya existe)' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Referencia inválida: el registro relacionado no existe' });
  if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'No se puede eliminar: otros registros dependen de este' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
module.exports = { notFound, errorHandler };
