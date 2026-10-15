const s = require('../services/userService');
const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
exports.list = wrap(async (_q, res) => res.json(await s.list()));
exports.get = wrap(async (req, res) => res.json(await s.get(req.params.id)));
exports.create = wrap(async (req, res) => res.status(201).json(await s.create(req.body)));
exports.update = wrap(async (req, res) => res.json(await s.update(req.params.id, req.body)));
exports.remove = wrap(async (req, res) => { await s.remove(req.params.id); res.status(204).end(); });
exports.tickets = wrap(async (req, res) => res.json(await s.listTickets(req.params.id)));
