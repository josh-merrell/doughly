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
class AppError extends Error {
  name;
  code;
  isOperational;
  message;
  severity;

  constructor(name, message, code, isOperational, severity) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name || 'AppError';
    this.message = message || 'An error occurred';
    this.code = code || 500;
    this.isOperational = isOperational || false;
    this.severity = severity || 3;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports.AppError = AppError;

module.exports.errorGen = (m, c, n, o, s) => {
  if (!m || !c) return new AppError('missingErrorMessageOrCode', 'errorGen requires a message and a code', 500, true, 2);
  return new AppError(n || 'errorName', m, c, o, s || 3);
};

//with async/await, you need some way to catch error instead of using try/catch in each controller, so we wrap
//the function in catchErrors(), catch any thrown errors, and pass it along to our express middleware with next()
module.exports.errorCatcher = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

class ErrorHandler {
  async handleError(error, req, res) {
    // Extract properties from the error object
    const statusCode = error.code || 500;
    const errorMessage = error.message || 'Something went wrong!';
    const errorName = error.name || 'Error';
    const isOperational = error.isOperational || false;
    const severity = error.severity || 3;

    await this.logError(error);
    // await addMonitoringMetric(error);
    // crashIfNeededOrSendResponse(error, res);

    if (res) {
      res.status(statusCode).json({
        name: errorName,
        message: errorMessage,
        code: statusCode,
        isOperational: isOperational,
        severity: severity,
      });
    }
  }

  logError(error) {
    const severityLevels = {
      0: 'error', // Emergency
      1: 'error', // Alert
      2: 'error', // Critical
      3: 'warn', // Error
      4: 'warn', // Warning
      5: 'info', // Notice
      6: 'info', // Informational
      7: 'debug', // Debug
    };

    const level = severityLevels[error.severity] || 'error';

    global.logger.error({
      level: level,
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      isOperational: error.isOperational,
      severity: error.severity,
    });
  }

  async isTrustedError(error) {
    // Check if the error is trusted AppError instance
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }
}

module.exports.ErrorHandler = ErrorHandler;
