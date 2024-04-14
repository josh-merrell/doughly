const { NODE_ENV } = process.env;

const ErrRouteNotFound = () => {
  const e = new Error('route not found');
  e.code = 404;
  return e;
};
module.exports.ErrRouteNotFound;

const ErrSystemUnavailable = () => {
  const e = new Error('system unavailable, try again later');
  e.code = 500;
  return e;
};
module.exports.ErrSystemUnavailable;

const ErrOperationUnsuccessful = () => {
  const e = new Error('operation unsuccessful, try again later');
  e.code = 501;
  return e;
};
module.exports.ErrOperationUnsuccessful = ErrOperationUnsuccessful;

//Not Found error handler
module.exports.routeNotFoundHandler = (req, res, next) => {
  if (NODE_ENV !== 'production') {
    console.log(`Route ${req.url} not found`);
  }
  next(ErrRouteNotFound());
};

//generic erorr handler, just pass it a string and a code. All normal error should be handled by this
module.exports.errorGen = (m, c) => {
  if (!m || !c) return new Error('errorGen requires a message and a code');
  const e = new Error(m);
  e.code = c;
  return e;
};

//with async/await, you need some way to catch error instead of using try/catch in each controller, so we wrap
//the function in catchErrors(), catch any thrown errors, and pass it along to our express middleware with next()
module.exports.errorCatcher = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

module.exports.getErrorHandler = () => {
  if (NODE_ENV === 'production' || NODE_ENV === 'staging') {
    return prodErrorHandler;
  }
  return devErrorHandler;
};

//eslint-disable-next-line no-unused-vars
const devErrorHandler = (err, req, res, _next) => {
  let status = err.code || 500;
  if (isNaN(status)) {
    global.logger.info(`In errorHandler, error code: ${err.code}, error object: ${JSON.stringify(err)}`);
    status = 400;
  }
  delete err.code;

  if (err.message !== ErrSystemUnavailable().message) {
    global.logger.info(`Error: ${err.message}`);
  }

  if (err.stack) {
    res.status(status).send(`<h1>${err.message}</h1><h2>${err.code}</h2><pre>${err.stack}</pre>`).end();
  } else {
    //else return the json
    res
      .status(status)
      .json({
        message: err.message,
        raw: err,
        stack: err.stack || Error.captureStackTrace(err),
      })
      .end();
  }
};

//eslint-disable-next-line no-unused-vars
const prodErrorHandler = (err, req, res, _next) => {
  let code = err.code || 500;
  if (isNaN(code)) {
    code = 400;
  }
  delete err.code;

  //prevent sql error from leaking data
  if (err.sqlErr === true) {
    err = ErrSystemUnavailable();
  }
  //catch validation errors and return the messages from Joi so the users can see them and fix their input
  if (err.validationError) {
    res
      .status(code)
      .json({
        message: err.message,
        raw: err,
      })
      .end();
  } else {
    res.status(code).json({ message: err.message });
  }
};
