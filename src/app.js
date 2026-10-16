const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const employeesRoutes = require('./routes/employees.routes');
const swaggerUi = require('swagger-ui-express');
const openApiDocument = require('./docs/index');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : true }));
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/employees', employeesRoutes);
app.get('/openapi.json', (req, res) => res.json(openApiDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
