const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.redirect('/api-docs'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);
module.exports = app;
