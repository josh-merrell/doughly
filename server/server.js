const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const cors = require('cors');
const https = require('https');
require('dotenv').config();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ss',
    }),
    winston.format.json(),
    winston.format.printf((info) => {
      // If you want to exclude the 'service' attribute
      delete info.service;
      return `${info.timestamp} [${info.level}]: ${info.message}`;
    }),
  ),
  transports: [new winston.transports.Console({ format: winston.format.simple() }), new winston.transports.File({ filename: 'logger.log', level: 'info' })],
});

const { supabase, supabaseDefault, verifyUser } = require('./db');

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

// app.use(morgan('combined')); //send request logs to console
app.use(morgan('combined', { stream: requestLogStream })); //also send request logs to file
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

app.use(express.json());

//endpoing for EC2 health checks
app.use('/ping', (req, res) => {
  res.send('pong');
});

if (process.env.NODE_ENV !== 'development') {
  app.use(verifyUser);
}
// Add the supabase client to the request object
app.use((req, res, next) => {
  req.client = { db: supabase };
  req.defaultClient = { db: supabaseDefault };
  next();
});
app.use(queryArrayParser);

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

// Your SSL Certificate and Private Key
const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Start the server
const port = 3000;
// https.createServer(credentials, app).listen(port, () => {
//   global.logger.info(`Server is running at https://localhost:${port}`);
// });
app.listen(port, () => {
  global.logger.info(`Server is running at http://localhost:${port}`);
});
