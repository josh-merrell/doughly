const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'routing-service' },
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});
const { supabase, verifyUser } = require('./db');

// Instantiate an express application
const app = express();

global.logger = logger;

const requestLogStream = fs.createWriteStream(path.join(__dirname, 'request.log'), { flags: 'a' });

app.use(morgan('combined')); //send request logs to console
app.use(morgan('combined', { stream: requestLogStream })); //also send request logs to file
const { queryArrayParser } = require('./middleware/queryParsing');

const clientsRouter = require('./modules/clients/router');
const personsRouter = require('./modules/persons/router');
const invoicesRouter = require('./modules/invoices/router');
const paymentRouter = require('./modules/payments/router');
const ordersRouter = require('./modules/orders/router');
const recipesRouter = require('./modules/recipes/router');
const tagsRouter = require('./modules/tags/router');
const stockProductsRouter = require('./modules/products/stock/router');
const stepsRouter = require('./modules/steps/router');
const toolsRouter = require('./modules/tools/router');
const toolStocksRouter = require('./modules/toolStocks/router');
const employeesRouter = require('./modules/employees/router');

app.use(express.json());

if (process.env.NODE_ENV !== 'development') {
  app.use(verifyUser);
}

// Add the supabase client to the request object
app.use((req, res, next) => {
  req.client = { db: supabase };
  next();
});
app.use(queryArrayParser);

app.use('/clients', clientsRouter);
app.use('/persons', personsRouter);
app.use('/employees', employeesRouter);
app.use('/invoices', invoicesRouter);
app.use('/payments', paymentRouter);
app.use('/orders', ordersRouter);
app.use('/recipes', recipesRouter);
app.use('/tags', tagsRouter);
app.use('/stockProducts', stockProductsRouter);
app.use('/steps', stepsRouter);
app.use('/tools', toolsRouter);
app.use('/toolStocks', toolStocksRouter);

// Start the server
const port = 3000;
app.listen(port, () => {
  global.logger.info(`Server is running at http://localhost:${port}`);
});
