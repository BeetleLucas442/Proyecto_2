const AppError = require('../utils/AppError');

// validate(fn): fn(body, req) devuelve un arreglo de errores
const validate = (fn) => (req, _res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const errors = fn(body, req);
  if (errors.length) return next(new AppError(400, 'Datos de entrada inválidos', errors));
  next();
};

// Valida que los parámetros de ruta indicados sean enteros positivos
const validateIds = (...names) => (req, _res, next) => {
  for (const n of names) {
    const v = Number(req.params[n]);
    if (!Number.isInteger(v) || v <= 0)
      return next(new AppError(400, `El parámetro ${n} debe ser un entero positivo`));
    req.params[n] = v;
  }
  next();
};
module.exports = { validate, validateIds };
