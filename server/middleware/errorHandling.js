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
  severity;

  constructor(name, message, code, isOperational) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.severity = severity;

    Error.captureStackTrace(this);
  }
}

module.exports.AppError = AppError;

module.exports.errorGen = (m, c, n, o, s) => {
  if (!m || !c) return new AppError('errorName', 'errorGen requires a message and a code', 500, true, 2);
  const e = new AppError(n || 'errorName', m, c, o || true, s || 3);
  return e;
};

//with async/await, you need some way to catch error instead of using try/catch in each controller, so we wrap
//the function in catchErrors(), catch any thrown errors, and pass it along to our express middleware with next()
module.exports.errorCatcher = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

class ErrorHandler {
  async handleError(error, req, res) {
    // await logError(error);
    // await addMonitoringMetric(error);
    // crashIfNeededOrSendResponse(error, res);

    global.logger.error(error.stack);

    // Extract properties from the error object
    const statusCode = error.code || 500;
    const errorMessage = error.message || 'Something went wrong!';
    const errorName = error.name || 'Error';
    const isOperational = error.isOperational || false;
    const timestamp = error.timestamp || new Date();
    const severity = error.severity || 3;

    if (res) {
      // Send response with all relevant error properties
      res.status(statusCode).json({
        error: {
          name: errorName,
          message: errorMessage,
          code: statusCode,
          isOperational: isOperational,
          timestamp: timestamp,
          severity: severity,
        },
      });
    } else {
      // Handle 'uncaughtException' errors
      global.logger.error(`Unhandled Exception: ${errorMessage}`);
    }
  }

  logError(error) {
    severityLevels = {
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

    global.logger.log({
      level: level,
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      timestamp: error.timestamp,
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
