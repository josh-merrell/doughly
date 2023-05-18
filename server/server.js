const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { supabase, verifyUser } = require('./db');
// Import the express module
const express = require('express');

// Instantiate an express application
const app = express();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'routing-service' },
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});

global.logger = logger;

const requestLogStream = fs.createWriteStream(path.join(__dirname, 'request.log'), { flags: 'a' });

app.use(morgan('combined')); //send request logs to console
app.use(morgan('combined', { stream: requestLogStream })); //also send request logs to file

const clientsRouter = require('./modules/clients/router');
const ordersRouter = require('./modules/orders/router');

app.use(express.json());

app.use(verifyUser);

// Add the supabase client to the request object
app.use((req, res, next) => {
  req.client = { db: supabase };
  next();
});

app.use('/clients', clientsRouter);
app.use('/orders', ordersRouter);

// Start the server
const port = 3000;
app.listen(port, () => {
  global.logger.info(`Server is running at http://localhost:${port}`);
});
