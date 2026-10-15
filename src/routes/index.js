const router = require('express').Router();
const { validate, validateIds } = require('../middlewares/validate');
const val = require('../validators');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const categories = require('../controllers/categoryController');
const events = require('../controllers/eventController');
const participants = require('../controllers/participantController');
const tickets = require('../controllers/ticketController');

router.post('/auth/login', validate(val.login), auth.login);

router.get('/users', users.list);
router.post('/users', validate(val.userCreate), users.create);
router.get('/users/:id', validateIds('id'), users.get);
router.put('/users/:id', validateIds('id'), validate(val.userUpdate), users.update);
router.delete('/users/:id', validateIds('id'), users.remove);
router.get('/users/:id/tickets', validateIds('id'), users.tickets);

router.get('/categories', categories.list);
router.post('/categories', validate(val.category), categories.create);
router.get('/categories/:id', validateIds('id'), categories.get);
router.put('/categories/:id', validateIds('id'), validate(val.category), categories.update);
router.delete('/categories/:id', validateIds('id'), categories.remove);

router.get('/events', events.list);
router.post('/events', validate(val.eventCreate), events.create);
router.get('/events/:id', validateIds('id'), events.get);
router.put('/events/:id', validateIds('id'), validate(val.eventUpdate), events.update);
router.delete('/events/:id', validateIds('id'), events.remove);
router.get('/events/:id/tickets', validateIds('id'), events.tickets);

router.get('/events/:eventId/participants', validateIds('eventId'), participants.list);
router.post('/events/:eventId/participants', validateIds('eventId'), validate(val.participant), participants.create);
router.get('/events/:eventId/participants/:id', validateIds('eventId', 'id'), participants.get);
router.put('/events/:eventId/participants/:id', validateIds('eventId', 'id'), validate(val.participant), participants.update);
router.delete('/events/:eventId/participants/:id', validateIds('eventId', 'id'), participants.remove);

router.get('/tickets', tickets.list);
router.post('/tickets', validate(val.ticket), tickets.create);
router.get('/tickets/:id', validateIds('id'), tickets.get);
router.delete('/tickets/:id', validateIds('id'), tickets.remove);

module.exports = router;
