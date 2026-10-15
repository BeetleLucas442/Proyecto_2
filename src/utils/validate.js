// Helpers de validación reutilizables por los validators.
const isStr = (v) => typeof v === 'string';
const blank = (v) => v === undefined || v === null || (isStr(v) && v.trim() === '');

function required(body, field, errors) {
  if (blank(body[field])) { errors.push({ field, message: `${field} es obligatorio` }); return false; }
  return true;
}
function string(body, field, errors, { max, min = 1 } = {}) {
  if (!required(body, field, errors)) return;
  if (!isStr(body[field])) return errors.push({ field, message: `${field} debe ser texto` });
  const len = body[field].trim().length;
  if (len < min) errors.push({ field, message: `${field} debe tener al menos ${min} caracteres` });
  if (max && len > max) errors.push({ field, message: `${field} no puede superar ${max} caracteres` });
}
function email(body, field, errors) {
  if (!required(body, field, errors)) return;
  if (!isStr(body[field]) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body[field]) || body[field].length > 255)
    errors.push({ field, message: `${field} no es un correo válido` });
}
function phone(body, field, errors) {
  if (!required(body, field, errors)) return;
  if (!isStr(body[field]) || !/^\+?[0-9 ()-]{7,20}$/.test(body[field]))
    errors.push({ field, message: `${field} debe tener entre 7 y 20 dígitos (puede iniciar con +)` });
}
function intId(body, field, errors) {
  if (!required(body, field, errors)) return;
  if (!Number.isInteger(body[field]) || body[field] <= 0)
    errors.push({ field, message: `${field} debe ser un entero positivo` });
}
function futureDate(body, field, errors) {
  if (!required(body, field, errors)) return;
  const d = new Date(body[field]);
  if (isNaN(d.getTime())) return errors.push({ field, message: `${field} no es una fecha válida (use ISO 8601, ej. 2026-12-31T20:00:00)` });
  if (d.getTime() <= Date.now()) errors.push({ field, message: `${field} debe ser una fecha futura` });
}
module.exports = { required, string, email, phone, intId, futureDate, blank };
