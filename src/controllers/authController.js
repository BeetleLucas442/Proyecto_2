const service = require('../services/authService');
exports.login = async (req, res, next) => { try { res.json(await service.login(req.body)); } catch (e) { next(e); } };
