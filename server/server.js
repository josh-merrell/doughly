const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const cors = require('cors');
const { ErrorHandler } = require('./middleware/errorHandling');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ss',
    }),
    winston.format.json(),
    winston.format.printf((info) => {
      delete info.service;
      return `${info.timestamp} [${info.level}]: ${info.message}`;
    }),
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logger.log', level: 'info' })
  ],
});

const { supabase, supabaseDefault } = require('./db');

// Instantiate an express application
const app = express();

global.logger = logger;

const requestLogStream = fs.createWriteStream(path.join(__dirname, 'request.log'), { flags: 'a' });

app.use(
  cors({
    origin: '*',
    methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.options('*', cors()); // Enable CORS for all OPTIONS requests

const { queryArrayParser } = require('./middleware/queryParsing');

const personsRouter = require('./modules/persons/router');
const recipesRouter = require('./modules/recipes/router');
const stepsRouter = require('./modules/steps/router');
const toolsRouter = require('./modules/tools/router');
const toolStocksRouter = require('./modules/toolStocks/router');
const ingredientsRouter = require('./modules/ingredients/router');
const ingredientStocksRouter = require('./modules/ingredientStocks/router');
const uploadsRouter = require('./modules/uploads/router');
const logsRouter = require('./modules/logs/router');
const profilesRouter = require('./modules/profiles/router');
const shoppingRouter = require('./modules/shopping/router');
const pushTokensRouter = require('./modules/pushNotifications/router');
const messagesRouter = require('./modules/messages/router');
const linkPreviewsRouter = require('./modules/linkPreviews/router');
const purchasesRouter = require('./modules/purchases/router');

// UTIL ROUTERS
const unitRatioRouter = require('./modules/utility/unitRatios/router');
const { error } = require('console');

app.use(express.json());

//endpoint for EC2 health checks
app.use('/ping', (req, res) => {
  res.send('pong');
});

app.use(morgan('combined', { stream: requestLogStream })); //also send request logs to file (other than health checks)

// CURRENTLY BORKED
// if (process.env.NODE_ENV !== 'development') {
//   app.use(verifyUser);
// }
// Add the supabase client to the request object
app.use((req, res, next) => {
  req.client = { db: supabase };
  req.defaultClient = { db: supabaseDefault };
  next();
});
app.use(queryArrayParser);

// Maintain map of connected clients, used for Server-Sent Events
const activeConnections = new Map();
// endpoint for Frontend to open new SSE connection
app.use('/recipe-progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add this client to the map
  const userID = req.query.userID;
  global.logger.info(`*SSE Session* connected userID: ${userID}`);
  activeConnections.set(userID, res);

  // Remove the connection from the map when the client closes the connection
  req.on('close', () => {
    global.logger.info(`*SSE Session* disconnected userID: ${userID}`);
    activeConnections.delete(req.userID);
  });
});
// Function to send a message to connected client
const sendSSEMessage = (userID, message) => {
  const res = activeConnections.get(userID);
  if (res) {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }
};

app.use('/uploads', uploadsRouter);
app.use('/persons', personsRouter);
app.use('/recipes', recipesRouter);
app.use('/shopping', shoppingRouter);
app.use('/steps', stepsRouter);
app.use('/tools', toolsRouter);
app.use('/toolStocks', toolStocksRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/ingredientStocks', ingredientStocksRouter);
app.use('/logs', logsRouter);
app.use('/profiles', profilesRouter);
app.use('/unitRatios', unitRatioRouter);
app.use('/pushTokens', pushTokensRouter);
app.use('/messages', messagesRouter);
app.use('/link-previews', linkPreviewsRouter);
app.use('/purchases', purchasesRouter);

// Start the server
const port = 3000;
app.listen(port, () => {
  global.logger.info(`Server is running at http://localhost:${port}`);
});

const errHandler = new ErrorHandler();

// Global error-handling middleware
app.use((err, req, res, next) => {
  errHandler.handleError(err, req, res);
});

process.on('uncaughtException', (err) => {
  errHandler.handleError(err);
  if (!errHandler.isTrustedError(err)) process.exit(1);
});

module.exports = {
  sendSSEMessage,
  app,
  logger,
  activeConnections,
  supabase,
  supabaseDefault,
};
