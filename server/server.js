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

const clientsRouter = require('./modules/clients/router');
const personsRouter = require('./modules/persons/router');
const invoicesRouter = require('./modules/invoices/router');
// const ordersRouter = require('./modules/orders/router');

app.use(express.json());

if (process.env.NODE_ENV !== 'development') {
  app.use(verifyUser);
}

// Add the supabase client to the request object
app.use((req, res, next) => {
  req.client = { db: supabase };
  next();
});

app.use('/clients', clientsRouter);
app.use('/persons', personsRouter);
app.use('/invoices', invoicesRouter);
// app.use('/orders', ordersRouter);

// Start the server
const port = 3000;
app.listen(port, () => {
  global.logger.info(`Server is running at http://localhost:${port}`);
});
